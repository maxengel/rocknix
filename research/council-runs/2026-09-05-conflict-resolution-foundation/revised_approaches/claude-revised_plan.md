# Step 3 — Revised approach: the foundation for cloud-save conflict resolution in ROCKNIX

*Council member: author of `claude-analysis.md`. Reviews answered here: `gemini_peer_review.md`, `gpt_peer_review.md`, `kimi_peer_review.md`, `mistral_peer_review.md`. Peer analyses adopted from: `gpt-analysis.md`, `kimi-analysis.md`, `gemini-analysis.md`, `mistral-analysis.md`.*

## 0. Conventions

- Source paths below are relative to `research/council-runs/2026-09-05-conflict-resolution-foundation/_sources/` and are the Facilitator-embedded, hash-verified copies listed in the provenance block at the end. I did not re-read or re-hash anything myself.
- **[V]** = verified against an embedded source. **[K]** = a claim about rclone, RetroArch, Linux or a backend that the corpus does not establish; each carries the experiment that settles it. **[M]** = a number still to be measured.
- **F** marks a load-bearing element: get it wrong and the milestone violates its cardinal rule (`issues/issue-11.md`; `repo/.claude/rules/rclone-cloud-sync.md` § Preserve player progress). **R** marks a refinement that can follow later without making V1 unsafe.
- Concessions, defences and adoptions are marked inline where the substance lives, and collected in §8.

---

## 1. The foundation in one page

The decided rows stand. Identity is the sha256 of the stored bytes (D-CLOUD-030), the manifest is one JSON per device under `savestates/.rocknix/` with an unsynced local agreement record (D-CLOUD-031), the audit log is append-only text (D-CLOUD-027), the wizard's information architecture is rev 4, and the shipped write paths stay as they are until #22 replaces them (D-CLOUD-029). Nothing in this revision reopens any of them. Five things around them change:

1. **F — The save tree has one writer at a time.** Today the boot sync (`repo/projects/ROCKNIX/packages/network/rclone/autostart/102-cloud-saves`) runs in the background under a running emulator; a downloaded save is overwritten by RetroArch's next 10-second flush, and the exit push then uploads the emulator's copy over the cloud's. That is an end-to-end progress loss with no conflict ever recorded [V, §3.7]. The boot sync moves into EmulationStation, and no reconcile, compaction or download touches the save tree while a game runs.
2. **F — Detection is an application-owned three-way reconcile** over (local hash, cloud hash, agreed hash), built on the manifest test in `repo/docs/save-manifest-schema.md` §3. `rclone bisync` is demoted from "the detector" to a spike that must pass a written contract before it is used for anything, and is never the writer. The exit push keeps D-CLOUD-028's zero-spawn no-change path and gains a pre-upload check when something did change.
3. **F — The conflict table gains the rows it lacks**: deletion (with intent evidence, never inferred from absence), agreement established by verified equality, provisional agreement that authorises nothing destructive, save units for multi-file saves, and a recorded-loser rule so a resolution made on one device is not silently reversed by another.
4. **F — The merge primitives get a checked adapter, not raw reuse.** `getNextFreeSlot()` returns −99 for a game that has only an auto state; `copyToSlot()` returns true without checking either copy; the repository cache can hand out the same slot twice [V, §3.6]. Every one of these sits on KEEP BOTH's path for the commonest conflict kind.
5. **F — Every rclone invocation the new code makes is built from scratch.** `RCLONEOPTS` still ships with `--delete-excluded`, `cloud_sync_helper` never strips it, and user filter rules are merged *ahead of* the defaults, so a safety exclusion in the defaults can be overridden by a customisation [V, §3.3.6]. The reconciler inherits neither the option string nor `BACKUPMETHOD`.

Migration is additive and staged: capture ships first (no behaviour change), the reconciler runs in shadow beside the legacy paths, then takes over the exit push, then boot and menu, and the wizard lands with the takeover. `#10`'s physical layout change is a behaviour change to ES, not a config change, and is re-sequenced after the wizard (§3.9, maintainer to confirm).

---

## 2. What is load-bearing and what is optional

| Load-bearing (F) | Refinement (R) |
|---|---|
| One writer at a time; boot sync into ES | Launch-time resume-point picker in the savestate manager (V2) |
| Three-way reconcile as the only writer of the save tree; bisync never writes | Locally computed backend hashes to skip listings |
| Amended conflict table (§3.4) including tombstones and units | SQLite history index |
| `agreed.json` bound to remote + roots; provisional vs confirmed agreement | History browser / rollback UI (#25) |
| Checked merge adapter (§3.6) | Per-core directory layout (#10), after a behavioural test plan |
| Option hygiene and non-overridable safety exclusions (§3.3.6) | Kid-mode badge design |
| Discard store present in V1 because the setting ships in V1 | Thumbnail-size heuristics beyond the measured minimum |
| Result-file trigger and a normalised exit-code protocol (§3.5.5) | `cloud_restore` pause fix |
| Capture unconditional on the sync; records the core that ran | Audit-log rotation policy revisions |

---

## 3. Architecture, end to end

### 3.1 Identity — D-CLOUD-030 stands; compaction is narrowed

**Endorse.** The sha256 of stored bytes survives ES's renumbering because `renumberSlots()` moves files with `copyToSlot(slot, true)`, which is a rename of both the state and its PNG (`es/SaveStateRepository.cpp`, `es/SaveState.cpp`) [V]. Nothing in the corpus argues against it.

**Refine compaction (new row citing D-CLOUD-030, not a reversal):**

- Compaction applies to **numbered slots only**. The `.state.auto` file is a resume pointer, not a slot, and ES itself makes it a byte-identical copy of whichever slot was launched for the duration of a session (`SaveState::setupSaveState` copies `fileName` to `autoFilename` under `racommands`) [V]. During an incremental session ES also copies the launched state to the next free slot and removes it at exit if unchanged [V]. So "same hash in two places" is the *normal* state of a running game. Compaction that ran mid-session would delete ES's own transient. — adopted from `kimi_peer_review.md` §6.6; the narrowing to numbered slots also answers `gpt-analysis.md`'s auto-state concern.
- Compaction runs **only when no game is running** and only after the reconcile has fetched every cloud-only file, so both copies' provenance is known.
- Compaction **writes a tombstone** for the removed path (§3.4). Without it the next pass re-downloads the cloud's copy of the higher slot and compacts it again forever — the churn loop from my Step 1, which `kimi_peer_review.md` confirmed as the most consequential gap in the schema as written.

### 3.2 Manifest, agreement and lineage — D-CLOUD-031 stands; a targeted field list

**Endorse the shape.** One JSON per device, each writes only its own, readers take the union, in-game saves included, allowlist-forced location [V: futro fixture in `repo/plans/conflict-resolution/vita-style-conflict-resolution.md` §1]. The refinements below are a new register row citing D-CLOUD-031 (a field and semantics list), not a reopening of the shape. `gpt_peer_review.md` asked that schema changes be acknowledged as such; they are.

**R1 — Union semantics are per version, not per path.** Two devices can legitimately describe different versions at the same path. Readers do not merge maps by path; they form, per path, the set of candidate versions, and provenance is looked up **by sha256** across all manifests ("who produced version H?"). The path answers only "what is at *p* now", which the listing or a download-and-hash decides. `gpt_peer_review.md` confirmed this; it was in my Step 1 and holds.

**R2 — `agreed.json` is bound to the conversation it records.** It carries the rclone remote name plus a fingerprint of that remote's config section, `SYNCPATH`, `BACKUPPATH` and `RESTOREPATH`. A mismatch on any of them makes the whole record absent, which drops every path into the conservative "never agreed → ask" branch. `CHANGE CLOUD FOLDER` is a shipped operation (`repo/docs/es-menu-map.md`) and the schema's §7 example has no binding [V]. Unchallenged by any reviewer; held.

**R3 — Agreement has a state: `confirmed` or `provisional`.** Confirmed means both sides' content was verified by hash (or by download-and-hash). Provisional means "we uploaded this and rclone exited 0, but no content check has been observed". A provisional agreement authorises a skip and a further upload of a locally changed file; it **never** authorises overwriting the local file. Full detail in §3.3.4. — This replaces my Step 1 suggestion (§4) to fall back to `(size, mtime)`: **conceded to `gpt_peer_review.md`**, which showed that fallback re-admits the exact size-only failure the project paid for in #53. Kimi's "size-plus-relist" is rejected for the same reason (`kimi-analysis.md` §1.6, as `gpt_peer_review.md` argued).

**R4 — Verified equality establishes agreement.** Observing `L = C = H` writes `A = H` confirmed, without a transfer. A literal reading of schema §9 ("the agreement record is written by the transfer") leaves a first-run equal file permanently "never agreed" and turns the next one-sided change into a spurious conflict. — adopted from `gpt_peer_review.md` §5.3.

**R5 — Possession is recorded locally; production is recorded in the manifest.** After the reconciler downloads a version to *p*, our manifest gains no entry for it (D-CLOUD-031: nothing stamps a file it did not write). The local record of "what is at *p*" is `agreed.json`. **Capture computes `replaces` from that possession record**, falling back to our own manifest's entry, else `null`. — This narrows my Step 1 §1.2 Amend 2. **Conceded in part to `gemini_peer_review.md`**: in the ordinary case (a device overwrites its own previous version) `replaces` is trivially computable from a read-merge-write of our manifest. The case I had in mind — a capture after KEEP LEFT, where our manifest's last entry is the discarded loser and the file's actual predecessor is the downloaded winner — is real, but it is solved by reading the possession record, not by declaring the field uncomputable. `gpt_peer_review.md`'s renumber-and-edit lineage example (`gpt-analysis.md` §1.3) is covered the same way: `replaces` is the hash last *known at that path on this device*, whatever manifest entry that came from.

**R6 — Reflash: download before first capture; read-merge-write always.** `cloud_device_id` seeds the identity from the permanent hardware address precisely so a reflash regenerates the same id (`repo/projects/ROCKNIX/packages/network/rclone/sources/cloud_device_id`) [V]. So a reflashed device's *own* manifest is already in the cloud, and the alignment review's "a fresh handheld receives every other device's manifest and none of its own" (`repo/docs/save-manifest-alignment-review.md` §2) is wrong for the commonest fresh-handheld case. Capture must never regenerate from an empty map; it downloads `.rocknix/`, merges, and writes. Held; confirmed by `kimi_peer_review.md`.

**R7 — Manifest ownership is enforced in transport, not only in capture.** The generic save upload walks the tree and `+ /savestates/**` admits every `manifest-*.json` in it, so a device that downloaded another device's manifest can republish a stale copy over the owner's newer one. Own manifest goes up by an explicit single-file copy; `.rocknix/**` is excluded from the bulk upload and only ever downloaded. — adopted from `gpt_peer_review.md` §5.4. Corollary: two devices sharing one id (the id file is editable by design, D-CLOUD-009) break the one-writer rule; the reconciler refuses (exit 6, §3.5.5) if the cloud holds a manifest under its own id with a `generated_at` newer than anything it wrote.

**R8 — Unchanged manifests are not rewritten.** A `generated_at` bump on every exit defeats the no-change fast path. — adopted from `kimi-analysis.md`.

**R9 — New fields:** `unit` (save-unit id, §3.4.3); `screenshot_size` and `screenshot_sha256` (companion binding, §3.5.4); a `deleted` map of tombstones (path → {sha256, when}); a bounded `resolutions` list (path, winner, loser, when) (§3.4.4); `rom` defined as *the name ES matched*, which under the compiled default's `nofileextension = true` is the stem, not the file name with extension (`es/SaveStateRepository.cpp` `getSaveStates` uses `getStem`) [V] — schema §6's gloss is imprecise and would detach states from their game on lookup.

**R10 — A torn remote manifest is "provenance unknown, flagged", never "no entry".** Temp-and-rename protects the local write; an interrupted PUT to WebDAV leaves truncated JSON. — adopted from `kimi_peer_review.md` §6.5.

**Lineage beyond one step.** D-CLOUD-027 rotates the audit log at 1 MiB keeping one predecessor, so the log cannot carry unbounded history [V]. History is best-effort in V1; a V2 index rebuilt from the union of manifests (each `replaces` is a link) is the durable answer. `gpt_peer_review.md` confirmed the limit; no register change is needed, only honesty in #25's scope.

### 3.3 Detection

#### 3.3.1 Contract first, mechanism second — adopted from `gpt-analysis.md`

The detector's contract, against which both the manifest reconciler and bisync are judged:

1. It classifies every path in the save universe into exactly one verdict of the amended table (§3.4), by content hash on both sides.
2. It transfers only what the table says is one-way; it never overwrites a divergent item; it never deletes without a tombstone.
3. It works on a backend with no hashes and no modtimes (the QA WebDAV, D-QA-001/002), degrading to "ask" or "wait for download-and-hash", never to "size says same".
4. It never renames, suffixes or moves a savestate (the `…conflict1` trap, `issues/issue-22.md`).
5. It recovers from an interrupted run without any winner-picks-all pass over the tree, and without an operator step.
6. It keeps D-CLOUD-028's no-change path: one process start, no remote listing, nothing transferred.
7. Its refusal is observable: a run that could not classify is distinguishable from a run that found nothing (blindspot 22).

**Conceded to `gpt_peer_review.md` and `kimi_peer_review.md`:** my Step 1 stated bisync's internals — listing-based state, `--resync` demands on first run and filter change, `--max-age` phantom deletions — as if settled. They are **[K]**. The corpus also contradicts itself on the central fact: `issues/issue-22.md` says `--conflict-loser num` renames losers; `gemini-analysis.md` says conflicting files are skipped entirely. Both cannot be true, and no bisync documentation or trace is embedded.

**Defended:** the demotion of bisync still follows from what *is* checkable.
- Contract item 6 is incompatible with any tool that lists both sides every run; the exit push's zero-listing contract is in the shipped code (`cloud_backup` `--recent` block: `--max-age … --no-traverse`, `mkdir` and `rmdirs` skipped) and in D-CLOUD-028 [V]. bisync at game exit is out on budget alone.
- `cloud_sync_helper` **regenerates `cloud_sync-rules.txt` on every OS update** (`update_cloud_sync_rules` rewrites the file, user rules first, then the defaults) [V]. If bisync fingerprints its filter file [K], every upgraded device demands `--resync` after every update — which #22's ACs forbid the detector to run. Ten-minute test.
- Item 3: the shipped scripts' own comments document rclone's size-only fallback on hashless, modtime-less remotes (#53) [V]. Whether bisync's compare inherits it or refuses outright is `kimi-analysis.md`'s hypothesis and `gpt_peer_review.md`'s objection; either outcome fails the contract for the QA backend unless bisync degrades to "ask".

So: **the manifest reconciler is the default detector and the only writer.** bisync's spike runs anyway (§7, step 2), with question zero being what `--conflict-resolve none` does to conflicted files in 1.75.0 (`kimi_peer_review.md`). If bisync passes all seven items it may be kept as a cross-check diagnostic that compares its report with the reconciler's; it is never given write access to the tree. This changes #9's role (an issue, not a register row) and is stated as such.

#### 3.3.2 The full reconcile (boot, menu SYNC row, wizard entry)

One lock (`take_cloud_lock`, exit 3) held across plan *and* apply. Steps: download `.rocknix/*.json`; one recursive listing with `--hash`; hash every local candidate (~50 files of tens of KB; `sha256sum` is busybox-present; cost **[M]**); compute verdicts per §3.4; apply one-way transfers (down, then up with `--backup-dir` as a belt, §3.7); establish agreements; write own manifest up; write the result file; exit per §3.5.5. Divergent items are never touched. A COMPLETE-time recheck (§3.5.2) re-hashes both sides for every planned action before applying; anything that moved since the plan refuses and re-plans.

**Lock interaction — requested by `gemini_peer_review.md`:** the reconciler is a script and takes the same `flock` on `/var/run/cloud_sync.lock` as the four transfer scripts; the wizard's apply invokes the reconciler's apply mode, which takes it again; ES's `ThreadedCloudSync::mInstance` remains the UI-level guard against two ES-started jobs. A separate, new exclusion — "no game running" — is a different resource and lives in ES (§3.7.1).

**Conceded to `kimi_peer_review.md`:** my Step 1 said ES's guard "only knows ES-started syncs". Overstated — the script lock already surfaces as `SKIPPED - ANOTHER CLOUD SYNC IS RUNNING` on the card (`es/ThreadedCloudSync.cpp`) [V]. The real gap is that the boot job has no card and no channel at all (§3.5.5).

#### 3.3.3 The gated exit push — D-CLOUD-028 refined, not broken

ES already knows the game and passes emulator and core at exit (`repo/docs/save-manifest-schema.md` §9). Capture hashes **that game's files regardless of mtime**, plus any file inside the D-CLOUD-028 time window (which is what still covers standalone emulators' layouts). Then:

- **Nothing changed** → no rclone at all (better than today's one spawn). Contract item 6 kept.
- **Something changed** → spawn 1: `rclone lsjson --hash --files-from <changed>` — a listing of *only the changed files*, not the tree; compare the native hash against the agreement's recorded `remote_hash`. If the cloud still holds *A*: spawn 2 uploads with `--backup-dir` (belt). If it does not, or the backend offers no hash to compare: **do not upload; leave it for the full pass**, which will classify it. Files with no agreement at all (a game's first save) are uploaded with `--ignore-existing` — never clobbering an unknown cloud object.

**Conceded to `gpt_peer_review.md`:** this is two process starts when something changed, and it *is* a refinement of D-CLOUD-028's "one spawn". Stated as a new row: no-change path unchanged (zero spawns, zero listing); changed path ≤ 2 spawns, target ≤ +2 s [M]; on a hashless backend the exit push uploads only never-agreed files and defers the rest. The rename-blindness of the pure time window (ES renumbers by rename; rename preserves mtime [K, POSIX]; a renumbered slot falls outside `--max-age`) — held, confirmed by `kimi_peer_review.md` — is covered because the played game's files are hashed regardless of mtime and moves are folded out by hash at the full pass.

**Conceded to `gpt_peer_review.md`:** hashing only on a size/mtime change is not verification. Restated: the size/mtime tuple is only ever a *pre-check to skip hashing at exit for files not belonging to the played game*, exactly as today's window is, and the full pass hashes everything.

#### 3.3.4 Verification of uploads

- On hash-capable backends I believe rclone verifies each transfer against a common hash after upload [K]. The spike checks `rclone copy -vv` output for the check lines on Dropbox; if confirmed, exit 0 on such a backend establishes a **confirmed** agreement with no second listing. If not, agreement is provisional until the next full pass lists the object.
- The manifest's `remote_hash` is recorded only when a listing *after* the upload has been observed (§6 defines it that way [V]); otherwise `null`. A pre-upload listing describes the *old* cloud object and must never be copied into the new entry (`gpt_peer_review.md`). Computing Dropbox's content hash locally to compare against a later listing without a download is an optimisation [K, cheap to test], not a dependency.
- On the QA WebDAV (no hashes, no modtimes; `repo/docs/save-manifest-alignment-review.md` §1 D-QA rows) agreement is provisional until the full pass downloads and hashes the object. That is a few files, when idle.
- **Rule: a provisional agreement never authorises overwriting local.** If `A` is provisional and `C ≠ A`, the upload may have been corrupted or raced; the verdict is "ask", never "cloud changed → download".

#### 3.3.5 The path universe — three classes, stated

- **Save files**: the conflict test applies. Standalone layouts are named (`cloud_sync-rules.txt` [V]).
- **Companions**: `*.png` thumbnails follow their state's verdict and never get an independent row (a state conflict must not produce a second, phantom PNG conflict). Binding rules in §3.5.4.
- **Metadata**: `savestates/.rocknix/*.json` — all downloaded, only own uploaded, never a conflict row (§3.2 R7).
- **Ignored**: `*.bak` (ES's own `game.state.auto.bak` transient matches `+ /**/*.state*` and neither of ES's regexes — `es/SaveState.cpp`, `es/SaveStateConfigFile.cpp` `SetupRegEx` [V]), `*.partial`, `*.tmp`, Dropbox "conflicted copy" and Syncthing `.sync-conflict-` names (D-CLOUD-022 describes a repair policy for the content tier; the embedded saves allowlist has no such exclusion [V] — `gpt-analysis.md`), `.snapshots/**`, `*.db*`.

— adopted from `kimi_peer_review.md` §6.2, with `gpt-analysis.md`'s D-CLOUD-022 nuance.

#### 3.3.6 Option hygiene and non-overridable safety exclusions — F

- The shipped `cloud_sync.conf` still carries `--delete-excluded` in `RCLONEOPTS`; `cloud_backup` and `cloud_restore` each strip it at load; `cloud_sync_helper` strips only `--verbose`/`-v` and never this flag [V]. Every new consumer of the config must strip it or inherit a destructive flag. The reconciler **does not read `RCLONEOPTS` or `BACKUPMETHOD` at all**; it constructs its own invocations. A user who deliberately set `BACKUPMETHOD=sync` back (D-CLOUD-015 respects that) must not turn the reconcile into a mirror. — adopted from `kimi_peer_review.md` §5.3.
- `cloud_sync_helper` places user rules **ahead of** the defaults (first match wins), so a default exclusion such as #25's `- /savestates/.snapshots/**` is defeated by a user `+ /**` [V]. And the backup/restore scripts use their fallback `--filter-from` only when the options array is empty [V] — a non-empty customisation without the filter transfers with no allowlist at all. Safety exclusions (`.snapshots/**`, `.rocknix/**` on upload, `*.bak`, conflict artefacts) are passed as `--exclude` flags, which rclone applies ahead of `--filter-from` (the subsystem rule file says this was verified [V] and warns not to lean on it — leaning on it *deliberately, with a fixture that proves it fires*, is the one acceptable use). — adopted from `gpt_peer_review.md` §5.5.
- `BACKUPPATH ≠ RESTOREPATH` → the reconciler refuses (exit 6) rather than warns; its agreement model has one root. No fallback to the legacy path on refusal — a guard that hands control to the mechanism it replaced is not a guard (`gpt_peer_review.md` on `gemini-analysis.md`).

### 3.4 The conflict test, amended

Per path *p* within a save unit. *L*, *C*: local and cloud hash, or ∅. *A*: agreed hash, or ∅, with state confirmed/provisional. *Tₗ*: own tombstone for *p*; *T꜀*: a tombstone for *p* in another device's manifest. *Rₓ*: a resolution record at *p* naming loser *X*.

| # | Condition | Verdict | Action |
|---|---|---|---|
| 1 | *L* = *C* | identical | nothing; **write *A* = *L* confirmed** if absent |
| 2 | *L* ∅, *C* present, no *Tₗ* | cloud-only | download; *A* = *C* |
| 3 | *L* present, *C* ∅, no *T꜀* | device-only | upload; *A* = *L* (provisional until verified) |
| 4 | *L* ≠ *C*, *A* confirmed, *L* = *A*, *C* ≠ *A* | cloud changed | download, no prompt — **unless *C* is a recorded loser of a resolution this device made** (*R꜀*), then **divergent (reversal) → ask** |
| 5 | *L* ≠ *C*, *A* confirmed, *C* = *A*, *L* ≠ *A* | device changed | pre-upload check that *C* still = *A*; upload with `--backup-dir` |
| 6 | *L* ≠ *C*, *A* confirmed, both ≠ *A* | **divergent** | wizard |
| 7 | *L* ≠ *C*, *A* ∅ | **divergent (never agreed)** | wizard — if a resolution record names *L* as loser, the wizard says so and offers accepting it as the default |
| 8 | *L* ≠ *C*, *A* provisional | **divergent (unverified)** | wizard; never a silent download over *L* |
| 9 | *L* ∅, *C* = *A*, *Tₗ*(hash = *A*) | device deleted | archive cloud object to `--backup-dir`, then delete it; clear *A* |
| 10 | *L* ∅, *C* = *A*, no *Tₗ* | absent, unexplained | download (restore) — resurrection is annoying, not lossy |
| 11 | *L* ∅, *C* ≠ *A* | cloud changed since; local gone | download; any tombstone superseded |
| 12 | *L* = *A*, *C* ∅, *T꜀* | cloud deleted elsewhere | move local to discard store, delete local, clear *A* |
| 13 | *L* = *A*, *C* ∅, no *T꜀* | absent, unexplained | upload (resurrect) |
| 14 | *L* ≠ *A*, *C* ∅ | device changed, cloud deleted | upload — progress outranks a deletion |
| 15 | *L* ∅, *C* ∅, *A* present | both gone | clear *A* |

Rows 1–3 and 6–7 are schema §3 made mechanical; the "never agreed → ask" row is **held** against `mistral-analysis.md`'s proposal to transfer it silently, for the reason `kimi_peer_review.md` and `gpt_peer_review.md` gave: two pre-existing different copies with no shared history are exactly the fork the cardinal rule exists for, and the fresh-handheld case it was meant to serve is row 2, not row 7.

**3.4.1 Deletion rows (9–15) — conceded and rebuilt.** My Step 1 proposed propagating deletion from absence plus a mass-delete guard on an empty root. `gpt_peer_review.md` showed absence is not intent (interrupted layout change, unmounted card, an emulator's temporary rename, another client), and `kimi_peer_review.md` showed my own two-card RG353M scenario defeats the empty-root guard: a *different populated* card presents as a mass "deletion". Rebuilt as: propagation **requires a tombstone** written at the point of deletion — ES's savestate-manager delete path (`GuiSaveState.cpp`, not embedded — gap), `SaveState::remove()`, compaction, and the wizard's own apply — plus a mass-delete guard (more than *N* propagated deletions in one run, *N* to be set; refuse with exit 6 and ask) plus `--backup-dir` archival of every propagated cloud deletion. Deletions made inside a standalone emulator's own UI have no tombstone and resurrect at the next sync: an accepted, documented limitation. A card swap has no tombstones and falls into rows 2 and 10 — a full download, safe.

**3.4.2 Equality and provisional rows (1, 8)** — §3.2 R3/R4; adopted from `gpt_peer_review.md` §5.3.

**3.4.3 Save units.** The N64 `.eep/.mpk/.sra` set for one ROM, a PPSSPP `SAVEDATA/<GAMEID>/` directory, one PSX memcard shared by many games, the Dreamcast shared VMU (`cloud_sync-rules.txt` names the layouts [V]) are not independent per-path decisions: KEEP LEFT on the `.eep` and KEEP RIGHT on the `.mpk` is a chimera (`gemini-analysis.md` §3.1; `gpt-analysis.md`). Rule: verdicts are computed per path; if any member of a unit is divergent the unit is presented as **one conflict**, KEEP LEFT/RIGHT applies to the unit, KEEP BOTH is disabled for units, and a unit's one-way transfers are applied as a group. Which files form a unit is emulator behaviour to be **measured** (`gpt_peer_review.md`), not inferred from extensions; V1 groups conservatively (directory for PPSSPP; ROM stem for N64; one file = one unit for memcards and VMU, presented under the container's name rather than a game's, with `rom: null` — `kimi-analysis.md`'s field, registered as a D-CLOUD-031 refinement). — F for the systems named; the maintainer's GBA/NES/FBNeo library is unaffected.

**3.4.4 The recorded-loser rule (rows 4, 7)** — adopted from `kimi_peer_review.md` §6.1, with a correction. Kimi's trace has B holding agreement *A₀* after uploading *H_B*, which the schema does not permit (B's upload sets *A_B* = *H_B*, and B then sees "cloud changed → download", which *is* the design working: A's player chose with both versions visible). The ping-pong is real **when B has no agreement record** — which is every device on the day #22 ships and every device after a reflash. Then B sees row 7, may pick its own copy, and A's next pass sees row 4 and silently downloads the loser it just rejected. The rule: a resolution record `(p, winner, loser, when, device)` is published in the winner's manifest; a cloud version matching a recorded loser at *p* is never applied as "cloud changed" without asking; a device holding the recorded loser is told so.

### 3.5 Presentation and resolution — IA rev 4 endorsed, with amendments

`repo/docs/conflict-wizard-ia.md` rev 4 and the futro's ACs on #23 stand: walkthrough system → game, fixed columns, KEEP LEFT / KEEP RIGHT / KEEP BOTH, nothing transfers until COMPLETE, pre-pass gate, done page names discards, 480×320 first.

**3.5.1 Cloud stays the left header. Conceded to `gpt_peer_review.md`.** My Step 1 proposed replacing "CLOUD" with the producing device's name. That conflates *where the candidate is* with *who produced it*; a downloaded version has the same producer on both sides, and the IA already carries device + model in the metadata. Both facts stay visible in their places.

**3.5.2 The cancellation promise, re-scoped — adopted from `gpt-analysis.md` §1.7.1.** "Nothing transfers until COMPLETE" and "non-conflicting files are applied before the walkthrough" cannot both describe the whole sync. Replacement text: *"Quitting the walkthrough discards your decisions and applies none of them. Files that were only in the cloud or only on this device have already been copied — nothing was overwritten to do that."* COMPLETE re-verifies every hash before applying (§3.3.2); interruption *during* apply is bounded by ordering: audit line, then archive/discard-store copy, then the destructive step, per item.

**3.5.3 Keep discarded saves: default ON, bounded — held.** The IA's off-by-default is a doc decision, not a register row. With a local discard store (§3.7.2) the cost is card space bounded by the count selector, and this subsystem's history is four silent-success defects (`repo/.claude/rules/engineering-practices.md`). `kimi_peer_review.md` §5.2 and `gpt-analysis.md` §1.7.3 concur. Proposed as a new register row, because it changes the default path from destructive to recoverable.

**3.5.4 The picture must be the picture of that version — adopted from `gpt_peer_review.md` §5.7.** The wizard shows the cloud side's PNG only when the manifest entry's `screenshot_size`/`screenshot_sha256` match what it fetched; otherwise it shows the picture glyph with "PICTURE UNAVAILABLE". Choosing by a wrong picture is a wrong choice on the cardinal-rule path, so this is F for the picker, not R.

**3.5.5 Trigger channel and result protocol — F.** "A sync that reports conflicts opens the wizard" has no mechanism for the boot path (a detached shell script) and no exit code for it (`kimi_peer_review.md` §6.3). The reconciler writes `/storage/.cache/cloud_sync/reconcile-result.json` (verdicts, pre-pass completion flag, conflict list as the wizard's fixture) and exits with a **normalised** code: 0 clean; 3 lock; 4 no network; 5 conflicts pending (non-conflicts applied); 6 refused (unsafe config: roots differ, agreement scope mismatch, mass-delete guard, dual identity); 1 error. rclone's own codes go to the log and never to the exit — today `cloud_backup` passes rclone's 3 ("directory not found") and 4 ("file not found") straight through `clean_exit`, and `ThreadedCloudSync` renders them as friendly skips [V] (`gpt-analysis.md` §3.2; `gpt_peer_review.md` §5.6). Both mains also exit with the saves phase only, masking a failed system-backup phase [V]. **Conceded to `gpt_peer_review.md`:** my blindspot-3 justification for the result file was wrong — removing formatting newlines does not break a single JSON document. The file is still right, on the correct grounds: the card reads a `popen` pipe that ends with the process, and the boot path has no pipe at all.

**3.5.6 Kid/kiosk mode — decided, adopted from `kimi_peer_review.md` §6.4.** Non-destructive branches run; conflicts are left waiting (nothing is lost — both sides stay); a badge appears on `GAME SETTINGS > CLOUD SETTINGS` in the full UI. The wizard never forces itself open in kid mode.

**3.5.7 Withdrawn: `session_seconds`. Conceded to `gpt_peer_review.md`, `mistral_peer_review.md`, `kimi_peer_review.md`.** It reopened the settled "no play time" choice, is not progress evidence, and is unsafe to derive from a state's mtime after a download or a move. If side-by-side thumbnails prove unrecognisable on the RG351M (§7 step 7), the fallback is a single-panel A/B flip, not a new metric.

**3.5.8 Moved to V2: the launch-time resume-point picker. Conceded to `kimi_peer_review.md` and `gpt_peer_review.md`.** Resolving the `.state.auto` conflict from the savestate manager's grid at launch is the right place eventually (that is where the player has context), but as a V1 amendment it re-scopes #23 and #37, depends on `GuiSaveState.cpp` mechanics not embedded, adds a thumbnail fetch to the launch path with no budget, and leaves unspecified which version stays at `.state.auto`, how the other is preserved, how it interacts with the SRAM, and what happens if the session crashes. It goes to #37 as a costed proposal. In V1 the auto pair is labelled a resume point (schema `kind: "auto"`) and is the first item shown for its game.

### 3.6 Merge — a checked adapter around ES's primitives (#24)

Endorse the primitives as the *mechanism*; reject raw reuse as the *contract*. The adapter's acceptance list, each item from embedded code:

1. **Auto-only repository → `getNextFreeSlot()` returns −99** (`es/SaveStateRepository.cpp`): with only `.state.auto`, `states.size()` is 1 (slot −1), the size-zero early return is not taken, the 99999→0 scan matches nothing, and the function falls through to −99 [V]. This is `gpt-analysis.md` §1.8's find. **`gemini_peer_review.md` rejected it citing the `states.size() == 0` line; that rebuttal misreads the code** — the auto state makes the size non-zero. The commonest conflict kind on the commonest layout breaks KEEP BOTH. The adapter treats any negative result as "no slot" and allocates from `firstslot` when only an auto state exists. Cheap hardware confirmation: launch a game that has only an auto state and read the RetroArch command in the ES log for `-state_slot -99` (`setupSaveState` passes `nextSlot` straight through [V]).
2. **`copyToSlot()` returns true without checking either copy** [V]. The adapter hashes state and PNG at the destination before recording agreement or removing any source (D-CLOUD-026's copy-verify-delete shape).
3. **Destination is derived from the source's parent** (`makeStateFilename` combines with `getParent(fileName)`; default arguments live in the unembedded header — consistent with the embedded call sites). A cloud version must be staged into the game's savestate directory under a temporary name, or the adapter computes the destination itself. **Conceded to `gpt_peer_review.md`:** the helper is not "categorically unusable" for a cloud version; it needs deliberate staging.
4. **Allocation reads a cached repository** (`getNextFreeSlot` does not `refresh()`; `renumberSlots` does) [V]. The plan **reserves** slots for every pending KEEP BOTH before apply (`kimi-analysis.md`), refreshes after the pre-pass download, and never holds a `SaveState*` across a refresh — `refresh()` deletes them (`gpt_peer_review.md` §5.8) [V].
5. **RetroArch only**: `isEnabled()` rejects any other emulator [V], so KEEP BOTH is offered only where allocation exists; standalone emulators get KEEP LEFT/RIGHT with a reason (dim, don't hide).
6. **No renumbering during a merge**: `onGameEnded` renumbers only for incremental configs and only when `racommands` is false or the slot is non-negative [V]. **Conceded to `gpt_peer_review.md`:** my Step 1 overgeneralised this to "every exit". The exit-time renames are nonetheless routine for slot-launched sessions and are what makes rename-folding by hash non-optional.
7. A merged copy is a new version with `replaces = null` and its origin in the audit log and the resolution record.

### 3.7 Safety, retention, rollback

**3.7.1 One writer at a time — F.** The mechanism chain, verified in the corpus: `102-cloud-saves` backgrounds `cloud_restore --yes --method=copy --update` then `cloud_backup` behind a ping loop of up to 60 s [V]; ES starts and a game can be launched inside that window; RetroArch flushes SRAM every 10 s (`autosave_interval = "10"`, schema §4) [V]; the restore's write lands under the emulator and is overwritten by the next flush while `last-restore` stamps success; the exit push (`copy`, no `--update`) uploads the emulator's copy over the cloud's [V]. If the cloud copy held the further progress, it is gone with no conflict recorded. `mistral_peer_review.md` asked for the timing to be developed: the window is the ping loop plus the two transfers, at boot, every day the startup toggle is on. The changelog's own test #5 covers sync-vs-sync only [V]. Fix: `cloudsaves.startup` is honoured by ES (a `ThreadedCloudSync` job after gamelist load, inheriting the card, the lock and the exit protocol); ES refuses to launch a game while a save-tree write is in flight (a "finishing save sync" wait on the launch splash — a wait, not a prompt about internals); the reconciler, compaction and any apply refuse while a game is running. For standalone launchers that may fork and keep writing after `process.run()` returns — unverified; the launcher implementation is not embedded — the exit capture waits for the writing process (§7 step 3 measures whether this exists). `gemini-analysis.md`'s exit-time flush race is not a mechanism (same-host page-cache visibility is coherent; the emulator has exited when the sync starts [V]) — `kimi_peer_review.md` and `gpt_peer_review.md` are right about that.

**3.7.2 The discard store is V1 machinery — F.** The setting *keep discarded saves* ships with the wizard, so its bytes must exist: `/storage/.cache/cloud_sync/discarded/<date>/<path>` outside the sync tree and outside `backuptool`'s archive, bounded by the count selector as the retention rule (IA § Settings), with the audit line written before the destructive step. #25's snapshots and rollback reuse it (`kimi-analysis.md`, via `gpt_peer_review.md`).

**3.7.3 Every cloud overwrite goes through `--backup-dir` — F for the concurrency contract.** `cloud_backup` already uses a dated sibling `<SYNCPATH>-replaced/<date>` in sync mode (D-CLOUD-014) [V]; the reconciler uses it for every upload that replaces an object [K: valid with `copy`; test]. This is what turns "two devices online at once" from data loss into a recoverable event.

**3.7.4 The concurrency contract, stated honestly.** `kimi-analysis.md` §3.13's lost-update trace holds: a pre-upload check narrows the window and does not close it (`gpt_peer_review.md`). Contract: *under concurrent writers, the cloud's canonical object may be overwritten by a stale writer; the overwritten bytes are retained under `<SYNCPATH>-replaced/`, the audit log names them, and the anomaly (an archived object whose hash was not the agreed one) is reported at the next full pass; recovery in V1 is manual.* This is stronger than audit-only, which `mistral_peer_review.md` rightly rejected, and weaker than a guarantee, which no advisory lock can give across devices.

**3.7.5 Audit log** — D-CLOUD-027 stands; every reconciler action (including compaction, tombstone propagation, archival) writes a line before it acts. Tamper-proofing (`mistral-analysis.md`) is rejected with `gpt_peer_review.md` and `kimi_peer_review.md`: there is no adversary.

### 3.8 Capture (#21)

- **Unconditional.** Capture runs at game exit *before and independently of* the `ThreadedCloudSync::start` call, which is gated on the setting, the binary and `!isRunning()` (`es/FileData.cpp.launchGame-excerpt-l740-850.cpp`) [V]. A capture inside that gate loses provenance exactly when a later conflict is born (an exit-3 skip). — adopted from `gpt-analysis.md` §1.5; it was also my Step 1 §3.9.
- **Records the core that ran, not the configured one.** Under the compiled default (`racommands = true`) no rewrite happens and `getCore(true)` is the launched core. Under any `es_savestates.cfg`, `racommands` is false [V] and `setupSaveState()` rewrites `-emulator`/`-core` to the selected state's config [V] — `gpt-analysis.md` §1.5, activated by #10's config as `kimi_peer_review.md` noted. ES built the command; capture takes emulator and core from the command actually executed.
- **Read-merge-write**, downloaded first after a reflash (§3.2 R6); never rewrites an unchanged manifest (R8); `unknown` rendered, never guessed; the core-pins file emitted at image build per schema §9.
- Capture and manifest write add no rclone spawn; the manifest rides the same push (alignment review §3.3).

### 3.9 Layout (#10) — a behaviour change, re-sequenced

D-CLOUD-017 stands. Its implementation is not the config edit `issues/issue-10.md` describes: **no `es_savestates.cfg` ships** (compiled defaults; alignment review §2), and *creating one* switches every RetroArch system from `Default()` — `racommands`, `incremental`, `autosave` all true — to the XML constructor, which sets `racommands = false` unconditionally and defaults `autosave` and `incremental` to false unless declared (`es/SaveStateConfigFile.cpp`) [V]. That disables ES's launch dance (`.auto` backup, next-slot copy, exit renumber) and enables the core-rewrite path. `gpt_peer_review.md` named this my strongest finding; `kimi-analysis.md` added that the XML mechanism gives no second "legacy flat" reader, so "read both layouts, write the new one" (`repo/.claude/rules/upgrade-and-install.md`) is not obtained by adding a template. And `gpt_peer_review.md` is right that migrating flat states into the current default core's directory would manufacture provenance D-CLOUD-017 forbids.

Recommendation: **re-sequence #10 after the wizard.** The schema does not depend on the layout (`core` is a field; entries are keyed by path); the reconciler and wizard already show core + build per side, so two cores' states colliding at a flat path present as a conflict with the core visible — safe, if noisy. #10 then gets a behavioural test plan (launch, autosave, incremental, attribution, legacy-flat reader) and RetroArch's `savestate_directory` handling (`setsettings.sh` not embedded — gap). The problem statement lists #10 inside the milestone; this is a sequencing change for the maintainer to confirm, not a reversal.

### 3.10 Migration off the shipped write paths

**D-CLOUD-029 endorsed, not reopened.** `gemini-analysis.md`'s argument (a skip strands, a clobber destroys) is the right *kind* of challenge to a decided row, and it is the same argument the futro made before the maintainer declined it as the only user at risk. `gpt_peer_review.md` adds that `--update` protects one timestamp ordering in one direction and the next boot restore undoes it. The new evidence — the boot race — argues for accelerating the replacement, not patching the flag (`kimi_peer_review.md` §5.4). No reopening.

**Cutover, additive at every step** (blindspot 23 inventory answered per step):

1. **Capture + manifests** ship beside the legacy paths. Pre-existing files stay `unknown`. No transfer changes.
2. **Shadow mode** (`kimi-analysis.md`, defined here as `mistral_peer_review.md` asked): after each legacy transfer the reconciler runs read-only, computes verdicts from before/after hashes and the manifests, and logs what it *would* have done. A **shadow disagreement** is any path where the legacy pass overwrote a version the reconciler classifies as divergent or never-agreed (a loss the legacy path caused — logged with both hashes), or where the reconciler would have refused a transfer the legacy pass made. A **verdict-table bug** is a reconciler verdict that would have acted destructively where the manifests show it should not (for example, "cloud changed" for a version whose manifest entry is our own upload). Two weeks of the maintainer's use; every disagreement reviewed.
3. **The exit push** is taken over (§3.3.3). The legacy `--recent` path is removed; its properties (window, `--no-traverse`, forced copy, exit 4 in a tenth of a second, no probe, no tidy, stamps) each have a named home in the new path.
4. **Boot and menu** are taken over; the boot job moves into ES (§3.7.1); the legacy pair's properties — newer-on-destination skip (replaced by the table), restore-before-backup order (kept: down then up), the lock, the stamps `last-backup`/`last-restore` that GAME SETTINGS reads (D-UI-018, kept), and `check_internet` (replaced by `cloud_setup --check` semantics; `ping google.com` is wrong in both directions per the rule file [V]) — are inventoried.
5. **The wizard** lands with step 4 (D-CLOUD-024). Between 3 and 5, divergent items simply wait and the SYNC row says how many.

Also in the cutover: `cloud_restore` still calls `sleep 2`/`sleep 3` directly where `cloud_backup` uses the `--yes`-aware `pause` [V] (`kimi_peer_review.md` §6.7).

---

## 4. Register: what changes, what does not

| Row | Action | Statement |
|---|---|---|
| D-CLOUD-030 | **Refine (new row)** | Compaction: numbered slots only; never `.state.auto`; only when no game is running and after the pre-pass; writes a tombstone. Identity unchanged. |
| D-CLOUD-031 | **Refine (new row)** | Fields and semantics: agreement scope binding and state; union per version; possession record; `unit`; `rom` = matched name (stem under `nofileextension`); `screenshot_size/sha256`; `deleted` tombstones; `resolutions`; `rom: null` for shared containers; ownership enforced in transport; torn-manifest rule. Shape unchanged. |
| D-CLOUD-028 | **Refine (new row)** | No-change path: zero spawns, zero listing. Changed path: listing of the changed files then upload, ≤ 2 spawns, target ≤ +2 s [M]; hashless backends defer agreed files to the full pass. |
| D-CLOUD-029 | **Endorse** | No `--update` stopgap; the boot race accelerates #22, it does not reopen the row. |
| D-CLOUD-027 | **Endorse** | Lineage beyond one step is best-effort under 1 MiB rotation; V2 index from manifests. |
| D-CLOUD-017 | **Endorse; re-sequence #10** | Layout change follows the wizard, gated on a behavioural test plan. Maintainer to confirm. |
| D-CLOUD-014/022/026 | **Endorse** | `--backup-dir` reused for every cloud overwrite; conflict artefacts excluded from the saves universe; copy-verify-delete for every move. |
| New | **Propose** | *Keep discarded saves* default on, bounded by the count. |
| New | **Propose** | "Never auto-delete the loser" is scoped: deletion propagates only with a tombstone, a mass-delete guard and archival. |
| New | **Propose** | The manifest reconciler is the detector and only writer; bisync is admitted, if at all, as a diagnostic after passing the seven-item contract. (Changes #9's role; no register row is reopened.) |
| New | **Propose** | The save tree has one writer at a time; the boot sync is ES-owned. |

---

## 5. Known unknowns — resolution plans

| # | Unknown | Plan | Device / step |
|---|---|---|---|
| 1 | Chipset axis; loud or silent | `repo/docs/savestate-compat-test.md`; same-chipset control (RG35XX SP ↔ RG SP) first, then RK3326/RK3566, then Test C. Results apply to tested cores and builds only. | Bench, ~1 h; before #23's badge only |
| 2 | bisync against a real remote | Spike (§7 step 2): question zero (what happens to conflicted files under `none`), hashless SRAM, filter-file rewrite → resync?, interrupted run, rename. My prediction: fails items 3, 5 or 6 → diagnostic at most. | VM + WebDAV/MinIO, then RG35XX SP + Dropbox; before any #22 code |
| 3 | Auto state the commonest conflict? | Count verdict kinds during shadow mode. Treated as a resume point either way; launch-time picker V2. | Shadow phase |
| 4 | KEEP BOTH pre-pass gate | Result file carries a pre-pass-complete flag; wizard refuses without it; pre-pass transfers are idempotent copies so an interrupted pre-pass re-runs; slots reserved in the plan; −99 handled. | VM fixture; before #23 layout |
| 5 | `es_savestates.cfg` | Answered by corpus: none ships; creating one flips `racommands`/`autosave`/`incremental` [V]. → #10 re-sequenced; RetroArch `savestate_directory` path still to read (gap). | — |
| 6 | Core build pin | `/usr/share/rocknix/core-pins` at image build; capture records the *launched* core from the command. | #21 |
| 7 | `BACKUPPATH == RESTOREPATH` | Reconciler refuses when unequal (exit 6). | #22 |
| 8 | Multi-file saves | Save units (§3.4.3); inventory which files change together per emulator (§7 step 8). | RG35XX SP, one game each |
| 9 | 480×320 | Real thumbnails on the RG351M before layout (§7 step 7); fallback A/B flip. | RG351M |
| 10 | Two devices online | Contract §3.7.4: pre-upload check + `--backup-dir` + audit; lost update possible, bytes retained. | Two H700s; verify archival |
| 11 | Round-trip suite never run | Repair (§7 step 0), then run on GENERIC_X64 against both backends. | First |

---

## 6. Unknown unknowns — the failure and the cheapest experiment that exposes it

| Failure | Cheapest experiment | Credit |
|---|---|---|
| Boot download overwritten by the emulator's flush; exit push clobbers the cloud's further progress | Two devices' saves differing; boot; launch inside the ping window; play 30 s; exit; compare three copies | `claude-analysis.md`; developed per `mistral_peer_review.md` |
| Resolution ping-pong after reflash/first run silently reverses an explicit choice | Two H700s; one fork; resolve on A; wipe B's `agreed.json`; sync B, pick B's copy; sync A | `kimi_peer_review.md` §6.1, corrected here |
| Reflashed device regenerates an empty manifest over its own | Reflash the RG SP; capture before download; compare with the cloud copy | `claude-analysis.md` |
| Renumbered slot falls outside the exit window; cloud keeps a stale set | Delete slot 1 of {0,1,2} in the savestate manager; exit; list the cloud | `claude-analysis.md`; `gpt-analysis.md` |
| Stale foreign manifest republished by the bulk upload | B downloads A's manifest; A publishes newer; B uploads; check A's survives | `gpt_peer_review.md` §5.4 |
| User rules ahead of defaults defeat a safety exclusion; non-empty `RCLONEOPTS` without filter transfers ROMs | Fixture config with `+ /**` first; another with options but no `--filter-from`; dry-run listing | `gpt_peer_review.md` §5.5 |
| `--delete-excluded` inherited by a new consumer; `BACKUPMETHOD=sync` turns reconcile into a mirror | Set `sync`; dry-run the detector against a destination holding excluded files | `kimi_peer_review.md` §5.3 |
| `.state.auto`↔slot duplicate and `.bak` uploaded mid-session; compaction deletes ES's transient | Run a sync mid-session; list the cloud; observe | `claude-analysis.md`; `kimi_peer_review.md` §6.6 |
| Auto-only game breaks KEEP BOTH (−99) | Read the ES log's RetroArch command for `-state_slot -99` | `gpt-analysis.md` |
| `copyToSlot` reports success on a failed copy | Read-only destination; merge; compare hashes | `gpt-analysis.md`; `gpt_peer_review.md` §5.1 |
| Wrong picture beside the right version | Interrupt between state and PNG publication; open the wizard | `gpt_peer_review.md` §5.7 |
| Torn remote manifest read as "no entries" | Truncate a manifest on the QA WebDAV; run detection | `kimi_peer_review.md` §6.5 |
| Card swap read as mass deletion | Swap cards; dry-run reconcile; count "would delete" | `kimi_peer_review.md` on my §3.3 |
| rclone exit 3/4 rendered as SKIPPED; failed system phase masked | Force a missing-file error and a `--system-only` failure; read card and stamp | `gpt-analysis.md` §3.2 |
| Kid mode strands or force-opens | Enable kid mode; construct a conflict; observe | `kimi_peer_review.md` §6.4 |
| Clock-unsynced device writes 1970 mtimes; files fall outside the window | Boot without network; save; exit; check the push | `claude-analysis.md` §3.11 |
| Same-second mtime and backend precision mismatch manufacture "cloud changed" | Compare listing and manifest `mtime` for a known-identical file on Dropbox and WebDAV | `kimi_peer_review.md` §6.8 |
| Dropbox case/Unicode normalisation of ROM names splits one path into two | Upload a state for a ROM with `é` and mixed case; list | `claude-analysis.md` §3.4 [K] |
| Two devices share one id (edited id file) → two writers of one manifest | Copy the id file; run both; inspect | this revision, §3.2 R7 |
| Harness overwrites `rclone.conf` before asserting the remote; false-fails on dated archive names; never restores remote config | Run on a disposable VM with sentinels; diff config before and after | `gpt-analysis.md` §3.1 |

**Checked and not adopted** from `gemini_peer_review.md` §5: (1) the duplicate-cleanup prompt is not broken by an unexported `ASSUME_YES` — the prompt lives in `cloud_backup`'s own `load_config`, where the variable is in scope, and `cloud_sync_helper` contains no `controller_confirm` at all [V]; (2) `check_internet` using `rclone listremotes | head -1` while `first_remote()` sorts section names — the script's comment asserts the two orderings are equivalent [V]; whether `listremotes` sorts is [K] and a one-line check.

---

## 7. What must be proven on hardware before any of it is built, in order

0. **Repair `tools/cloud-round-trip`, then run it** on the GENERIC_X64 image against WebDAV and MinIO. Its `rclone.conf` overwrite precedes the remote assertion, its cleanup restores neither the remote config nor `SYNCPATH`, and its archive assertions expect undated names the scripts no longer write [V] (`gpt-analysis.md`). A suite that false-fails on correct behaviour cannot be the milestone's instrument. Add the both-sides-changed step whose pass is "neither copy overwritten", and the manifest step from the alignment review §3.6.
1. **The boot race** (§6, row 1) on the RG35XX SP with a real emulator — 15 minutes; decides that the boot sync moves into ES before #22, and measures the window.
2. **The bisync spike** against the seven-item contract — VM first, then the RG35XX SP against Dropbox (blindspot 8). Question zero first. Record output shapes; keep artefact inventories before and after.
3. **ES primitive behaviour** on the VM: auto-only allocation; `copyToSlot` under a read-only destination; a minimal `es_savestates.cfg` and its effect on launch, autosave, incremental and the `-core` rewrite; whether any standalone launcher keeps writing after `process.run()` returns.
4. **Filter and safety-exclusion fixtures** on the device with `rclone lsf --filter-from` as the futro did: user rules first, `--exclude` precedence, `.rocknix/` and `.bak` handling, `--backup-dir` with `copy`.
5. **Backend verification**: does `rclone copy -vv` show a post-upload hash check on Dropbox; does a locally computed Dropbox content hash match `lsjson --hash`; what does the QA WebDAV listing return for a manifest-recorded file.
6. **#19 on the bench** — same-chipset control, then cross-family, then Test C; gates only the badge's severity.
7. **Thumbnail recognisability at 480×320** on the RG351M with real state PNGs; decides side-by-side versus A/B flip before any layout work.
8. **Multi-file save inventory** — PPSSPP, N64, PSX memcard, Dreamcast VMU: which files change on one save; defines the V1 unit table.

Steps 0–5 need no maintainer bench time beyond a device on the LAN; 6–8 need the maintainer's hands for about two hours in total.

---

## 8. Ledger

**Conceded**
- `replaces` "not computable" — `gemini_peer_review.md`: computable from the possession record; narrowed (§3.2 R5).
- `(size, mtime)` as confirmation; hash-on-change as verification — `gpt_peer_review.md`: withdrawn; provisional/confirmed agreement replaces it (§3.2 R3, §3.3.4).
- Two-spawn gated push amends D-CLOUD-028 — `gpt_peer_review.md`: stated as a refinement row (§3.3.3, §4).
- `onGameEnded` renumbers on every exit — `gpt_peer_review.md`: overgeneralised (§3.6 item 6).
- Pretty-JSON/blindspot-3 justification — `gpt_peer_review.md`: wrong grounds; result file kept on right ones (§3.5.5).
- `copyToSlot` "categorically unusable" — `gpt_peer_review.md`: needs staging plus verification (§3.6 item 3).
- Deletion from absence with an empty-root guard — `gpt_peer_review.md`, `kimi_peer_review.md`: rebuilt on tombstones (§3.4.1).
- Replacing the CLOUD header — `gpt_peer_review.md` (§3.5.1).
- Launch-time picker as V1 — `kimi_peer_review.md`, `gpt_peer_review.md`: V2 (§3.5.8).
- `session_seconds` — `gpt_peer_review.md`, `mistral_peer_review.md`, `kimi_peer_review.md`: withdrawn (§3.5.7).
- ES guard "only knows ES syncs" — `kimi_peer_review.md`: overstated (§3.3.2).
- bisync internals stated as fact — `gpt_peer_review.md`, `kimi_peer_review.md`: marked [K]; contract-first (§3.3.1).
- Boot race underdeveloped — `mistral_peer_review.md`: developed (§3.7.1).

**Defended**
- bisync demoted: on the exit budget, the helper's rules rewrite, and the corpus's self-contradiction (§3.3.1).
- Deletion rows are necessary: without them compaction churns forever (§3.1, §3.4.1).
- "Never agreed → ask" stays (§3.4).
- Keep-discarded default on (§3.5.3).
- `agreed.json` scoping; reflash inheritance; union-per-version (§3.2).

**Adopted**
- `gpt-analysis.md`: −99, unchecked `copyToSlot`, staging parent, cached repository, launched-core capture, unconditional capture, cancellation text, harness hazards, exit-code collisions, D-CLOUD-022 nuance, contract-first spike.
- `gpt_peer_review.md`: equality establishes agreement; manifest ownership in transport; safety exclusions not guaranteed by defaults; PNG binding; `SaveState*` lifetime; `#10` inferred-core migration rejected.
- `kimi-analysis.md`: hashless blindness (conditional); concurrent lost update; reserved slots; unchanged manifests; headless handoff; discard store in V1; no automatic legacy reader; shadow mode.
- `kimi_peer_review.md`: resolution records (corrected); path classes; trigger channel; kid mode; torn manifest; compaction gate; `cloud_restore` pauses; mtime tolerance; `--delete-excluded` inheritance.
- `gemini-analysis.md`: save units (chimera); the best-formed D-CLOUD-029 argument (not adopted as a reopening).
- `mistral-analysis.md`: publication race ordering; refusal at every entry point (already the futro's AC, endorsed).

**Corrected on the record**
- `gemini_peer_review.md`'s rebuttal of the −99 finding misreads `getNextFreeSlot`'s size check (§3.6 item 1).
- `kimi_peer_review.md` §6.1's trace requires B to lack an agreement record; it is real for first-run and post-reflash devices (§3.4.4).

---

## 9. Gaps surfaced to the orchestrator

Not embedded, and needed before the corresponding element can be called verified: `GuiSaveState.cpp` (delete path for tombstones; renumber-on-delete claim; any V2 launch-time picker); `Paths.cpp` and the RetroArch launch/`setsettings.sh` path (#10); `SaveState.h`/`SaveStateRepository.h` and `Utils::FileSystem` (default arguments, copy/rename return semantics); `docs/es-ui-style-guide.md` (#23 layout); `cloud_content_backup`/`cloud_content_restore` (`CONFLICT_EXCLUDES`), `cloud_setup`, `tools/cloud-test-backend`, `backuptool`; rclone 1.75.0 bisync documentation or source (every [K] in §3.3); the current issue *bodies* with their edited ACs (the embedded issue files are comment-thread exports); `es_systems.cfg`, `retroarch.cfg`, the two audit punch-lists; and any executed result of the round-trip suite, the bisync spike or the compatibility protocol.

---

## corpus.provenance.json

```json
{
  "corpus_mode": "facilitator_embedded_read_at_time",
  "council_member_artifact": "claude-analysis.md (Step 1); this document (Step 3)",
  "source_count": 42,
  "hash_verification": "sha256 values verified at embed time by the Council Facilitator and copied from the per-source headers; not re-read or re-hashed by this member",
  "independently_reread_files": false,
  "independently_rehashed_files": false,
  "commands_or_hardware_tests_performed": false,
  "manifest_read_timestamp_utc_as_supplied": "2026-09-05T17:32:51Z",
  "peer_reviews_answered": [
    "gemini_peer_review.md",
    "gpt_peer_review.md",
    "kimi_peer_review.md",
    "mistral_peer_review.md"
  ],
  "peer_analyses_cited": [
    "gpt-analysis.md",
    "kimi-analysis.md",
    "gemini-analysis.md",
    "mistral-analysis.md"
  ],
  "source_file_paths": [
    "research/council-runs/2026-09-05-conflict-resolution-foundation/_sources/00-problem-statement.md",
    "research/council-runs/2026-09-05-conflict-resolution-foundation/_sources/repo/docs/conflict-wizard-ia.md",
    "research/council-runs/2026-09-05-conflict-resolution-foundation/_sources/repo/docs/save-manifest-schema.md",
    "research/council-runs/2026-09-05-conflict-resolution-foundation/_sources/repo/docs/save-manifest-alignment-review.md",
    "research/council-runs/2026-09-05-conflict-resolution-foundation/_sources/repo/plans/conflict-resolution/vita-style-conflict-resolution.md",
    "research/council-runs/2026-09-05-conflict-resolution-foundation/_sources/repo/docs/decision-register.md",
    "research/council-runs/2026-09-05-conflict-resolution-foundation/_sources/repo/docs/blindspot-register.md",
    "research/council-runs/2026-09-05-conflict-resolution-foundation/_sources/repo/docs/savestate-compat-test.md",
    "research/council-runs/2026-09-05-conflict-resolution-foundation/_sources/repo/.claude/rules/rclone-cloud-sync.md",
    "research/council-runs/2026-09-05-conflict-resolution-foundation/_sources/repo/.claude/rules/engineering-practices.md",
    "research/council-runs/2026-09-05-conflict-resolution-foundation/_sources/repo/.claude/rules/upgrade-and-install.md",
    "research/council-runs/2026-09-05-conflict-resolution-foundation/_sources/repo/.claude/rules/es-native-ui.md",
    "research/council-runs/2026-09-05-conflict-resolution-foundation/_sources/repo/docs/es-menu-map.md",
    "research/council-runs/2026-09-05-conflict-resolution-foundation/_sources/repo/docs/cloud-sync-changelog.md",
    "research/council-runs/2026-09-05-conflict-resolution-foundation/_sources/repo/CLAUDE.md",
    "research/council-runs/2026-09-05-conflict-resolution-foundation/_sources/rclone-bisync-planning.md",
    "research/council-runs/2026-09-05-conflict-resolution-foundation/_sources/issues/issue-11.md",
    "research/council-runs/2026-09-05-conflict-resolution-foundation/_sources/issues/issue-9.md",
    "research/council-runs/2026-09-05-conflict-resolution-foundation/_sources/issues/issue-10.md",
    "research/council-runs/2026-09-05-conflict-resolution-foundation/_sources/issues/issue-19.md",
    "research/council-runs/2026-09-05-conflict-resolution-foundation/_sources/issues/issue-20.md",
    "research/council-runs/2026-09-05-conflict-resolution-foundation/_sources/issues/issue-21.md",
    "research/council-runs/2026-09-05-conflict-resolution-foundation/_sources/issues/issue-22.md",
    "research/council-runs/2026-09-05-conflict-resolution-foundation/_sources/issues/issue-23.md",
    "research/council-runs/2026-09-05-conflict-resolution-foundation/_sources/issues/issue-24.md",
    "research/council-runs/2026-09-05-conflict-resolution-foundation/_sources/issues/issue-25.md",
    "research/council-runs/2026-09-05-conflict-resolution-foundation/_sources/issues/issue-35.md",
    "research/council-runs/2026-09-05-conflict-resolution-foundation/_sources/issues/issue-37.md",
    "research/council-runs/2026-09-05-conflict-resolution-foundation/_sources/repo/projects/ROCKNIX/packages/network/rclone/sources/cloud_backup",
    "research/council-runs/2026-09-05-conflict-resolution-foundation/_sources/repo/projects/ROCKNIX/packages/network/rclone/sources/cloud_restore",
    "research/council-runs/2026-09-05-conflict-resolution-foundation/_sources/repo/projects/ROCKNIX/packages/network/rclone/sources/cloud_sync_helper",
    "research/council-runs/2026-09-05-conflict-resolution-foundation/_sources/repo/projects/ROCKNIX/packages/network/rclone/sources/cloud_sync-rules.txt",
    "research/council-runs/2026-09-05-conflict-resolution-foundation/_sources/repo/projects/ROCKNIX/packages/network/rclone/sources/cloud_sync.conf",
    "research/council-runs/2026-09-05-conflict-resolution-foundation/_sources/repo/projects/ROCKNIX/packages/network/rclone/sources/cloud_device_id",
    "research/council-runs/2026-09-05-conflict-resolution-foundation/_sources/repo/projects/ROCKNIX/packages/network/rclone/autostart/102-cloud-saves",
    "research/council-runs/2026-09-05-conflict-resolution-foundation/_sources/repo/tools/cloud-round-trip",
    "research/council-runs/2026-09-05-conflict-resolution-foundation/_sources/es/SaveStateRepository.cpp",
    "research/council-runs/2026-09-05-conflict-resolution-foundation/_sources/es/SaveState.cpp",
    "research/council-runs/2026-09-05-conflict-resolution-foundation/_sources/es/SaveStateConfigFile.cpp",
    "research/council-runs/2026-09-05-conflict-resolution-foundation/_sources/es/ThreadedCloudSync.cpp",
    "research/council-runs/2026-09-05-conflict-resolution-foundation/_sources/es/FileData.cpp.launchGame-excerpt-l740-850.cpp",
    "research/council-runs/2026-09-05-conflict-resolution-foundation/_sources/es/FileData.cpp.getCore-excerpt-l1470-1560.cpp"
  ],
  "source_file_hashes": [
    "7e8c1076ee1735925af1d59dded61d23146c5c8e9fb2aae2be53d5afca26b6b7",
    "5738428852899047b9d49902b78e9c5e0d4457f67b09d079fdfeb89fdcfcc6c9",
    "2a794ea3d027402a26e3dfc62ea6184c204211c888c904413d1564ecf3f189ce",
    "56f6c54c013c5476f638a0dee5f2201e6a4ad021b47c674010bdc392665bfd48",
    "d22a49e73fe5d25cafea7646ec353e57a3da95f6ef84d4b86249c91bb170cf43",
    "0a4b1150d907f26cdd70d480830e195b9fa2885920abf48641506bb5a0f09640",
    "1514b33d61ab148d4e59bf446af03d973792a0673969df471b41c021edc9cbd8",
    "4d0b9d21ee5c9c26a25da5c169d9e99b83c18457732bd9471078c2d508b1d1bb",
    "7d43f252d029d54baa98ffa266b9334fa2f0f2da3db2507f451205f40dc73353",
    "e8ee62ea5af749ef09c0ede9da7abc5d7c192d890ae2e737cc369a5c5549c646",
    "d343c805b912141a1f8af7aa8d6025e2379e5335fb197c4cc59adf960fa43cbb",
    "cba905608c0104093b166c88393dba32159dca2b280d8a5229b6668930c8e4d2",
    "3ab8da275237ac1ccf3cab3bf2f019077d7fdef06d2e6afd180313ca80e00d8c",
    "6357ada783d5b09f22bd6fad2745b5c101e68fcdf2f85ffc698975be356cd594",
    "b19a3fd41d9728a0d5ee22aad6fd54c2f2d5199cd5835dbdc695d6e5062f8516",
    "acae778e1ee700e4a7c0120cb5e9be2fb5d2129aa04ef3e75590af2effca60eb",
    "4c6881068dd2be7eca3031e8d929b4d1a5f314eb6d08ba07a1d7cbd735bd207f",
    "cf3f971c8c6d95f0429d7f2937ecb130b1b40f2d12d7681441548230ca48a9c0",
    "4704211f8e92be217eb2f16cd363a6a7c3dacc381f5083b7536e9aa33b79ab0f",
    "b4f54c4e548f514f9429d5ea56dc9c3e246b95b0ae519a4b013891b1d69ffe39",
    "083c6c3504c578da7c283008d1305492f792a82c4b0a30d35007f9776ff6ad90",
    "c87315eb509d89d1ac2f8595c1fb47c9227836fadfbd13cf22122fce5f9806d3",
    "6d998503be831ad800a34bbfa952fc2aeb85ca5f5d959b6d10dad98d0fea6831",
    "016287a95f088a1cf137199a4c50321e0650684b78ecbe1849d995ae52afb6ee",
    "f87746eecfd56f78e477d227a25ddb7cfc2accc4626656c41ac14eeff8285ea0",
    "696bcdba14d33dfeea8e627a90094a2b1955745f32fc28677f54bb97f88099ba",
    "5787b6f79b1f7a9160c0540997d8b2fae1541201224c4bb8bf17b3cacf610210",
    "a43faf60f3fa4d2aa60345815484ff7c862bdba0061befa068e64b1994e0a907",
    "dfd1bf52dca78ab67a1b30b56e3c048d8910863a99ca02442525f58d083a2a57",
    "3a1bec8bb0ef5005f3dd92cdd766beb2c32ef26c5b5ea06fbd6cdb0bb0259de9",
    "8b22b9c82effe0a044ff765f73ecf24e26dd064abf694dc1f37304e2759b8823",
    "60db296dde26bebbf4fcf1b97101188799cedb2eb3260616204a2ee082ce19c3",
    "c9f4d94dc9745bce7bccf99145816e0e45305c8a5058acb6476a1fb56f96eb6c",
    "2b56d6f5fd4a86bfd40578bec43308204f62af513df9b3ed227cf971585f837b",
    "7c3e79bbe41bd70ec1c1f08d9defd04e38af891430616173609bf3e76c2159ee",
    "212e1c8531008b1d25f5f976797d9762c5cfa3061fe70229c546d276784efb49",
    "9931bfdceacc18344d7a6b9eeea0a27278dff46ae04a7f82e5c4efe7300ff51b",
    "848e0746fa26ef5c565af72962c487b0d4185f199f36f2290827bd086e303741",
    "4f38ea7dcfcbd71068122124c428d146b7da3c6dbdcc05a81afc99bbd93a9b15",
    "62f817868c3b803429e62efb7aa8f37aa995213386c6e4303e8e1f490a144ffc",
    "5b341d85de24badb2984fff979226f25f080831a1d194f607b6d6caa6085f233",
    "2410e4316d9c2c3bfb301c39dbe79590fb73682b18e70988527eeecc2a024fa6"
  ],
  "missing_material": [
    {"description": "GuiSaveState.cpp (delete path for tombstones; renumber-on-delete; launch-time picker mechanics)", "declared_source_path": null, "sha256": null},
    {"description": "Paths.cpp and RetroArch launch / setsettings.sh savestate_directory path (#10)", "declared_source_path": null, "sha256": null},
    {"description": "SaveState.h, SaveStateRepository.h and Utils::FileSystem implementations (default arguments; copy/rename return semantics)", "declared_source_path": null, "sha256": null},
    {"description": "docs/es-ui-style-guide.md (#23 layout)", "declared_source_path": null, "sha256": null},
    {"description": "cloud_content_backup, cloud_content_restore, cloud_setup, tools/cloud-test-backend, backuptool", "declared_source_path": null, "sha256": null},
    {"description": "rclone 1.75.0 bisync documentation or source (every [K] claim in §3.3)", "declared_source_path": null, "sha256": null},
    {"description": "Current issue bodies with edited acceptance criteria; embedded issue files are comment-thread exports", "declared_source_path": null, "sha256": null},
    {"description": "es_systems.cfg, retroarch.cfg, the two audit punch-lists; executed results of the round-trip suite, bisync spike and compatibility protocol", "declared_source_path": null, "sha256": null}
  ]
}
```