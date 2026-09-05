# Council — Step 4: peer vote

You are one of five council members. Each of you has now produced a revised
approach to the foundation for cloud-save conflict resolution in ROCKNIX. The
corpus is embedded above, unchanged and hash-verified; the other four members'
revised plans are injected below.

Vote for **exactly one** of them. You may not vote for your own plan, and your
own plan is not injected — judge the four you are given.

## Anti-self-citation constraint

Judge the plans on their merits against the embedded corpus. Do not treat the
injected artifacts as evidence about how councils, models, or this deliberation
behave.

## What you are voting for

The winning plan becomes the foundation the maintainer builds on. So vote for
the plan that would be **safest and most buildable if adopted as written**, not
the one that is most impressive or most thorough. Weigh, in this order:

1. **Does it protect player progress?** The cardinal rule is that no save is
   lost and that resolution never defaults to recency. A plan with an elegant
   architecture and one silent-overwrite path is worse than a plainer plan with
   none.
2. **Is it grounded?** Claims about the shipped code, EmulationStation's
   helpers, rclone's behaviour and the register's decisions should be correct,
   and hypotheses should be labelled as hypotheses with an experiment named.
3. **Is it actually implementable** by a small team on a busybox handheld,
   inside the stated budgets, against 69 rclone backends of varying capability?
4. **Does it sequence the work** so the cheap experiments that could invalidate
   a design run before the expensive building?
5. **Is it honest about what it does not know**, and about which decided rows
   it needs reopened?

## Your output

- **Name the winner** in your first line, by member short name, unambiguously.
- **Give your reasoning**, comparing the winner against the other three
  specifically. Say what the winner does better and where the others fall short.
- **Record dissent.** Name every important primitive, finding or safeguard that
  a losing plan has and the winner does not fully absorb, by filename. This is
  how good ideas from losing plans survive into the final synthesis, so be
  thorough here even when your winner is clear.
- **Name any remaining defect in the winner** that must be fixed before it is
  built.

Refer to plans by filename (for example `kimi-revised_plan.md`), never by an
invented ordinal.

## Injected revised plans

=== START claude-revised_plan.md ===

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

=== END claude-revised_plan.md ===

=== START gemini-revised_plan.md ===

Here is my revised approach for the cloud-save conflict resolution foundation. 

This revision abandons my initial assumptions about rclone’s safety mechanisms and emulator file-flushing, which my peers correctly dismantled. Instead, it builds on the concrete, code-level vulnerabilities discovered by the council—specifically the broken ES merge primitives, the launch-behavior side effects of the proposed configuration, and the silent data-loss loops in the sync paths.

### 1. Concessions: What I Got Wrong

I explicitly concede the following claims from my Step 1 analysis, which were refuted by the corpus and my peers:

*   **The D-CLOUD-029 `--update` stopgap is unsafe.** I argued that adding `--update` to the game-exit sync would safely strand a local save rather than clobbering the cloud. `claude-analysis.md`, `gpt-analysis.md`, and `kimi-analysis.md` correctly proved this false: `autostart/102-cloud-saves` runs `cloud_restore --update` at boot. If the exit path skips uploading, the next boot will download the newer cloud copy and silently overwrite the local progress. My proposal merely moved the clobber from game-exit to boot.
*   **The "Emulator Flush Race" is not the primary timing hazard.** I hypothesized that the OS page cache might not have flushed when the capture step runs. `claude-analysis.md` and `gpt-analysis.md` correctly noted that `process.run()` has returned and the emulator has exited; Linux page cache is coherent for local readers. The real race is `claude-analysis.md`'s finding: the boot sync backgrounds itself and can overlap with active gameplay, uploading transient `.bak` files.
*   **Bisync does not "skip conflicting files entirely."** I stated this as fact. `claude-analysis.md` and `kimi-analysis.md` rightly called this an unverified hypothesis that contradicts `issues/issue-22.md` (which states `--conflict-loser num` renames losers). The spike must run to determine actual 1.75.0 behavior.
*   **Rclone does not guarantee atomic renames across all backends.** I relied on this for concurrency safety. `gpt-analysis.md` correctly pointed out that this is backend-dependent and unproven for our 69 targets.
*   **ROCKNIX does not use Yocto/buildroot.** `gpt-analysis.md` caught my error; `CLAUDE.md` defines it as a LibreELEC/CoreELEC fork. 
*   **Querying `agreed.json` history is impossible today.** `kimi-analysis.md` correctly noted that the schema header says "Nothing here is built."

### 2. Defenses: What I Still Hold

*   **The primary detector must be stateless and manifest-based.** I defend my stance to demote bisync, bolstered by `claude-analysis.md` and `kimi-analysis.md`. Bisync's stateful nature, its `--resync` traps, and its SRAM blindness on hashless backends (like the QA WebDAV) make it a fragile foundation. The SHA-256 manifest diff is the only mechanism that satisfies the corpus's constraints.
*   **Multi-file saves must be resolved as a unit.** I defend my "chimera" argument (e.g., mixing files from different devices corrupts the save), though I adopt `kimi-analysis.md`'s correction to use PPSSPP and shared VMU directories as the canonical examples rather than N64.
*   **Retention should be default-on.** I defend my argument that *Keep discarded saves* must default to ON, bounded by the count selector. `claude-analysis.md` and `gpt-analysis.md` agreed: a manual choice can be mistaken, and a support-only text log cannot recover lost bytes.

### 3. Adoptions: What Others Got Right

I adopt the following critical findings into the load-bearing architecture:

*   **The `-99` Auto-Only Bug (`gpt-analysis.md`):** `SaveStateRepository::getNextFreeSlot()` returns `-99` if the repository only contains `.state.auto` (`es/SaveStateRepository.cpp`). The IA's reliance on this for `KEEP BOTH` merges will fail on the most common conflict type.
*   **Unchecked Copy Primitives (`gpt-analysis.md`):** `copyToSlot()` returns `true` without checking the return values of the underlying file copies (`es/SaveState.cpp`). We cannot blindly reuse ES's helpers for cloud merges.
*   **The `racommands=false` Launch Trap (`gpt-analysis.md` & `claude-analysis.md`):** Shipping `es_savestates.cfg` for #10 forces `racommands = false` and disables `autosave`/`incremental` by default (`es/SaveStateConfigFile.cpp`). This silently changes launch behavior across every RetroArch system.
*   **The Deletion Propagation Gap (`claude-analysis.md`):** The conflict table lacks a deletion row. Without explicit tombstones, a player's local deletion is resurrected by the next sync, creating a permanent churn loop.
*   **The `--delete-excluded` Inheritance Trap (`claude-analysis.md`):** `cloud_sync.conf` ships with `--delete-excluded`. If the new detector inherits `RCLONEOPTS` without explicitly stripping it, a `sync` run will delete everything outside the allowlist (ROMs, BIOS).
*   **The Round-Trip Harness is Broken (`gpt-analysis.md`):** `tools/cloud-round-trip` overwrites `rclone.conf` before asserting the remote, and false-fails on dated archive names. It must be fixed before it can be trusted.

---

### 4. The Load-Bearing Foundation (What we must build)

If we get these wrong, the milestone is unsafe.

**A. Detection & Agreement Engine**
The primary detector is a local, stateless manifest diff (comparing local SHA-256, cloud SHA-256, and `agreed.json`). Bisync is relegated to a diagnostic tool or fast-path optimization *only if* the spike proves it safe. 
*   *Staleness Rule:* If a remote file has no manifest entry, it is treated as `unknown` and falls into the conservative "ask" branch. We do not assume it is a safe overwrite.
*   *Option Hygiene:* The detector must explicitly strip `--delete-excluded` from `RCLONEOPTS` and never inherit `BACKUPMETHOD=sync` semantics.

**B. The Merge Contract (Replacing ES Primitives)**
We cannot reuse `getNextFreeSlot()` and `copyToSlot()` directly. We must build a **checked adapter** that:
1.  Handles the `-99` auto-only edge case by defaulting to slot `0` or `firstslot`.
2.  Verifies the destination hashes of both the `.state` and `.png` after copying.
3.  Refreshes the repository explicitly before allocating multiple `KEEP BOTH` slots in a batch.

**C. Concurrency & Lifecycle Isolation**
The boot sync (`102-cloud-saves`) must be serialized against the emulator, not just other syncs. A sync running mid-play will capture transient `.state.auto.bak` files and zombie slots created by `setupSaveState`. The lock must exclude active gameplay.

**D. Grouped Resolution**
Multi-file saves (PPSSPP, VMU) must be resolved atomically. The wizard must batch these by directory/group, presenting one KEEP LEFT / KEEP RIGHT choice for the entire bundle.

---

### 5. Decision Changes (Register Rows)

I propose the following explicit register changes:

**1. WITHDRAW the D-CLOUD-029 `--update` reopen; implement a One-Way Stopgap.**
*   *Argument:* `--update` is unsafe due to the boot-restore clobber. Instead, adopt `claude-analysis.md`'s stopgap: disable the boot pair and SYNC row entirely, leaving *only* the game-exit upload (which is a pure `copy`). This preserves both copies and leaves divergences as "never agreed → ask" for the wizard's first run. Cross-device pickup is broken until the wizard ships, but no data is lost.

**2. REOPEN D-CLOUD-031 (Manifest Schema) for targeted amendments.**
*   *Argument:* The schema requires four surgical additions to be safe:
    *   `group_id`: To bind multi-file saves (PPSSPP/VMU) into atomic resolution units.
    *   `screenshot_sha256`: To bind the thumbnail to the state, preventing the wizard from presenting a mismatched image if a PNG copy fails (`gpt-analysis.md`).
    *   `deleted`: Explicit tombstones to allow deletion propagation without resurrection loops (`claude-analysis.md`).
    *   `agreed.json` scoping: Must key on `remote` + `sync_root` to prevent a changed cloud folder from authorizing overwrites based on old hashes.

**3. REOPEN IA Rev 3 Settings: *Keep discarded saves* defaults to ON.**
*   *Argument:* A manual choice in the wizard can be mistaken. A support-only text log cannot recover lost bytes. With `--backup-dir` already in use, the cost is near zero and bounded by the count selector.

---

### 6. Unmeasured Hypotheses & Required Experiments

Before writing code, we must execute these specific tests:

1.  **The Bisync Spike:** We must run this to determine what `--conflict-resolve none` actually does to conflicted files in 1.75.0 (does it rename both? skip? error?).
2.  **#10 Launch Behavior Rehearsal:** Because shipping `es_savestates.cfg` forces `racommands = false`, we must test auto-resume and incremental slot behavior on a real device to measure the blast radius of this "config-only" change.
3.  **Round-Trip Harness Repair:** Fix the `rclone.conf` overwrite and the dated-archive substring assertions in `tools/cloud-round-trip`. Run it on the GENERIC_X64 VM to establish a baseline.
4.  **Thumbnail Distinguishability:** Render actual side-by-side thumbnails on the RG351M (480×320) to prove the UI is legible before finalizing the wizard layout.

=== END gemini-revised_plan.md ===

=== START kimi-revised_plan.md ===

# Step 3 — Revised foundation for cloud-save conflict resolution in ROCKNIX

**Author:** the member who wrote `kimi-analysis.md` in Step 1. This document stands alone: it is the foundation I would build, revised after the Step 2 critiques. It concedes what was refuted (with the reviewer named), defends what I still hold, adopts what others got right (credited by filename), separates the load-bearing from the optional, and states every decision change explicitly.

Sources are cited by repo-relative path; the full declared paths and the Facilitator-verified sha256 values are in `corpus.provenance.json` at the end. I did not re-read or re-hash any file; the embedded corpus is my read-at-time corpus.

---

## 1. What the critique changed, in one paragraph

The spine of my Step 1 survives: detection must be the manifest three-way test (sha256 identity vs. a locally held agreement record), not `rclone bisync`, because sha256 is the only comparison that works on a hashless backend and because bisync's own agreement state has no named writer after a manual wizard apply. Three reviews converged on that (`claude_peer_review.md` §6, `gemini_peer_review.md` §5, `gpt_peer_review.md` §3). Around that spine, the critique forced real corrections: my endorsement of ES's slot/copy primitives was refuted by verified code readings in `gpt-analysis.md` §1.8; my "size-plus-relist" verification shortcut was refuted by `gpt_peer_review.md` §3; my #10 "Option A" violated the project's own attribution rule; my claim that the manifest has no PNG entries was simply wrong (`gemini_peer_review.md` §3); my auto-state "storm" was asserted on a premise that `es/SaveState.cpp` partially falsifies; and my concurrency mitigation was too weak (`mistral_peer_review.md`). Each is owned and corrected below. I also adopt the two findings no analysis had: the mid-session transient-file hazard and the one-way interim posture (`claude_peer_review.md` §5), and the harness/transport/exit-code findings of `gpt_peer_review.md` §5.

---

## 2. The foundation (load-bearing — get these wrong and the milestone is unsafe)

### F1. Identity: unchanged

A save version is the sha256 of its stored bytes; slot and file name are attributes (D-CLOUD-030; `docs/save-manifest-schema.md` §1). **No reopening.** One strengthening observation, adopted from `claude_peer_review.md` §5 A: ES's `setupSaveState()` creates a transient byte-identical copy mid-session (slot N copied to `.state.auto`, and in incremental mode to `game.state<next>`; `es/SaveState.cpp`). If a sync overlaps a session, that copy can reach another device as a zombie slot — and D-CLOUD-030's compaction (same hash in two slots → remove the higher after re-verification, logged) already cleans it up by construction. The register row is not merely safe here; it is the designed remedy.

### F2. Manifest: shape stands; five amendments as one explicit refinement of D-CLOUD-031

The per-device JSON at `savestates/.rocknix/manifest-<device-id>.json`, union-read, keyed by path relative to the sync root, with the agreement record local and unsynced (D-CLOUD-031) — endorsed. My Step 1 claim that it needed no changes was wrong (concession to `gpt_peer_review.md` §3). Five amendments, proposed as one new register row citing D-CLOUD-031:

1. **`origin` sub-object** (adopted from `gpt-analysis.md` §1.9 via `claude_peer_review.md` §6). When a device materialises a version it did not produce — a downloaded winner, a KEEP BOTH re-slot, #37's copy-to-free-slot — its manifest entry records the *producer's* `device`, `core`, `core_build`, `captured_at` copied from the source entry, as `origin`. This is an honest observation, not a stamp: "nothing stamps a file it did not write" is preserved because the writer's own provenance fields stay distinct from `origin`. Without it, a merged copy's provenance dies at the first re-slot (the alignment review's "#24 — a merged copy is a new entry with `replaces = null`" is exactly the gap).
2. **`screenshot_sha256`** (adopted from `gpt_peer_review.md` §5.7 / `claude_peer_review.md` §6). The picker's premise is choosing by picture; a manifest can name the right state and a stale PNG. Record the PNG's hash at capture; the wizard renders no picture on mismatch rather than a wrong one.
3. **`group` key + `rom: null` for shared containers** (my §3.2, re-scoped per `claude_peer_review.md` §3 revision 4: the canonical cases are PPSSPP's per-game-ID directory and the Dreamcast shared VMU, which the corpus itself names in `cloud_sync-rules.txt` and D-CLOUD-028 — not the N64 pair, where the two files are largely independent). All paths sharing a `group` resolve as **one decision**; a conflict in any member conflicts the unit. The grouping table (which layouts form units) is #21's data, like the core→package map; unknown layouts stay ungrouped, and grouping errors must merge decisions rather than split them — a stitched multi-file save is the corruption case.
4. **Parse-failure rule**: an unparseable cloud manifest → that device's entries are `unknown`, retried next pass; our temp-and-rename writes plus regeneration every capture make it self-healing (adopted from `claude_peer_review.md` §6).
5. **Identity-collision rule** (my §3.15, converged by `gpt-analysis.md`): `cloud_device_id` honours the stored value, so a cloned card duplicates an identity and two devices would write one `manifest-<id>.json`. If a manifest's `device.model`/`family` changes incoherently between observations, the reader warns and treats its entries as `unknown`.

Plus a **transport rule** (not schema, recorded in the same row): `/savestates/.rocknix/**` is excluded from every tree transfer by an *unconditional command-line exclusion*, and manifests move only by explicit single-file copy — our own uploaded after the tree pass, foreign manifests fetched into `/storage/.cache/cloud_sync/manifests/` for reading. Adopted from `gpt_peer_review.md` §5.4: "each device writes only its own" must constrain transport, not just capture — otherwise the exit upload (no `--update`; `projects/ROCKNIX/packages/network/rclone/sources/cloud_backup`) republishes a stale cached foreign manifest over the producer's newer one. Command-line exclusions are the unconditional mechanism because rclone applies `--exclude` ahead of `--filter-from` (verified per `.claude/rules/rclone-cloud-sync.md`), while a defaults-file rule is not unconditional — user rules precede defaults (`cloud_sync_helper`).

**Tombstones are deliberately not added.** Deletions do not propagate in V1 (F8); a tombstone field is #25/V2's additive change.

### F3. Detection: the manifest test is the sole classifier; a staging mirror is its substrate; bisync is demoted

**The classifier** is the schema §3 three-way test (L local hash, C cloud hash, A agreed hash), with these specified rows:

| Situation | Verdict | Action |
|---|---|---|
| L = C | identical | nothing; **if A unknown, write agreement** ("observed-equal") — adopted from `gpt_peer_review.md` §5.3, closing the first-run false-conflict loop |
| L ≠ C, L = A | cloud changed | download, no prompt |
| L ≠ C, C = A | device changed | upload, no prompt |
| L ≠ C, both ≠ A | divergent | wizard |
| L ≠ C, A unknown | divergent (never agreed) | wizard — conservative; `unknown`-both included (alignment review §3.5) |
| one side only | one-way | transfer, no prompt |
| same hash, new path | move | re-key, no conflict (D-CLOUD-030) |
| absent one side, A says both had it | deletion-attempt | **resurrect, logged** (F8); mass-absence → fail closed |
| any member of a `group` divergent | group divergent | wizard, one decision for the unit |

**The substrate** — this is the revision's main new mechanism, synthesised from `gemini_peer_review.md`'s demand that I expand the SRAM/WebDAV case and `gpt_peer_review.md`'s verification requirements. Each sync pass mirrors the remote's saves tree into `/storage/.cache/cloud_sync/stage/` (`rclone copy`, allowlist-filtered, skipping unchanged by the backend's available metadata), then sha256-hashes staged and local files. Consequences:

- **C is learned by content on every backend**, including the QA WebDAV that offers neither hashes nor modtimes (alignment review §1, D-QA-002 row). This is the #53 lesson (`cloud_backup`'s own comment block) applied structurally instead of per-call-site.
- **Budget**: when nothing changed anywhere, the pass costs one remote listing and zero downloads. When something changed, only changed files move. The nothing-changed game-exit path keeps D-CLOUD-028's zero-remote-contact property (F5).
- The staged bytes are **also** the wizard's cloud-side screenshot source, the KEEP BOTH materialisation source, the discard-store source (F7), and the upload-certification input (F4) — one mechanism, four consumers.
- **Honest residual risk**: on a hashless backend the staging skip keys on size alone, so a same-size cloud-side change is invisible until the next size-changing event on that path. The priced alternative (download-and-hash the whole tree every pass) is rejected on budget; the risk is stated, not hidden (blindspot 22's rule: a listing that answers nothing is *unknown*, never "no conflict" — so any path whose decision matters gets download-and-hash confirmation).

**Bisync's role.** Demoted from detector to *candidate bulk-transfer engine*, pending the spike. This amends #22's plan of record and #9's dependency status (no register row made bisync the detector, so no row reversal is needed; the #22 body edit happens in the same action, per blindspot 27's rule). Two spike-independent arguments, which I defend: (a) after the wizard resolves a conflict by hand, nothing writes bisync's listing state back — the next run re-reports or demands `--resync`, and `--resync-mode` defaults to path1, a winner-picks-all pass (futro §4 step 2); (b) D-CLOUD-030 gives us sha256, and no bisync listing compares sha256 against a backend that has no hashes. **Epistemic status, conceded** (to `gpt_peer_review.md` §3): my Step 1 stated bisync's size-only blindness and its post-manual-apply behaviour as settled. They are inference from rclone's documented comparison fallback plus the QA backend's measured properties. The spike is the arbiter; my falsification criteria stand. The spike still runs — `claude_peer_review.md` §1 is right that declining it while asking to reopen a decided dependency is backwards — and its fixtures (both-sides change, rename, interrupted run, external equalization after a manual apply, filter change) double as the adversarial suite for the manifest detector.

**Scope exclusions**: screenshots ride the pre-pass under one-way rules with recency explicitly tolerated — no player progress lives in a screenshot; this is the one place recency is tolerated, stated as an exception, flagged for revisit (my screenshots/** finding stands). Conflicted-copy artifacts (Dropbox "(conflicted copy)", Syncthing `.sync-conflict-`) are never offered as versions and never transferred (alignment review §3.5); the engine's filter set excludes them explicitly, because the shipped saves allowlist currently *admits* a conflicted `.srm` (`gpt-analysis.md`, verified against `cloud_sync-rules.txt`).

### F4. Agreement: one writer, certified writes, scoped keys

- `agreed.json` is keyed by **(remote identity, sync root, path)** — my finding, endorsed by `claude_peer_review.md` §6 as a local-file change. The schema's example binds agreement to nothing; `CHANGE CLOUD FOLDER` is a shipped row (`docs/es-menu-map.md`), and a remembered hash from a different sync relationship authorises the wrong overwrite.
- **The transfer engine is the only writer**, and only after certification. Certification on hash-capable backends: `rclone lsjson --hash` matched against the upload, or a locally computed backend-native hash (hypothesis H2, experiment 4 — adopted from `claude_peer_review.md` §5 D; if it holds, the D-CLOUD-028/`remote_hash`/"no extra spawn" contradiction `gpt-analysis.md` found dissolves, because the value is known at capture, not observed after upload). Certification on hashless backends: re-download the just-uploaded paths into staging and sha256-compare — one extra round trip per upload batch, only where the backend forces it.
- **Concession**: my Step 1 "size-plus-relist" certification is withdrawn (`gpt_peer_review.md` §3). It is the #53 failure shape; a different 65,536-byte SRAM passes it.

### F5. Write paths: gated transfers; capture always; D-CLOUD-029 stands

#22 owns the write paths (futro §5). The new pass shape: stage-down → hash → manifest test → apply non-conflicts (**downloads before uploads**, preserving the boot pair's restore-before-backup property from the replaced-mechanism inventory) → write the same `last-backup`/`last-restore` stamps (D-UI-018 preserved) → record conflicts to a pending-conflicts state file. The exit pass keeps `--max-age`/`--no-traverse` for *candidate selection* but uses the manifest test for *admission*; nothing-local-changed stays zero-remote-contact; boot and menu passes are full passes, so a wrong-mtime file is compared by hash, never skipped by a window (my §3.6 wrong-clock finding, scoped per `claude_peer_review.md` §1: a sha256 detector never classifies by mtime). The #22 refusal ACs stand, exercised through boot, exit, and SYNC row.

**D-CLOUD-028 refinement (explicit)**: the changed-path exit pass may list the remote for paths it is about to touch and may download-and-hash to certify uploads on hashless backends. This is a correctness read, not a reachability probe; the nothing-changed case is untouched. Proposed as a new row citing D-CLOUD-028; `gpt_peer_review.md` §3 and `claude_peer_review.md` §2 both treat this reopening as load-bearing.

**D-CLOUD-029: no reopening — defended.** `gemini-analysis.md` and `mistral-analysis.md` argued for an immediate `--update` stopgap on the exit upload. `102-cloud-saves` refutes the safety premise: it runs `cloud_restore --yes --method=copy --update` *before* the backup at every boot, so a skipped exit upload is overwritten by the next boot's restore — the clobber moves, nothing is preserved (`gpt_peer_review.md` §2 traces both timestamp orderings). The maintainer's "same in kind; the flag changes which copy loses" is correct at the system level. What I adopt from `claude_peer_review.md` §5 B is the **lossless interim posture**: the maintainer (the only user until the wizard ships) may disable the boot pair and the SYNC row via the existing toggles, leaving only the exit upload — no device is ever overwritten, every divergence survives for the wizard's first run, and cross-device pickup stops, which is precisely the operation that is unsafe today. This is a configuration note, not a code change and not a register change.

**Capture (#21) runs regardless of network state** (adopted from `gpt-analysis.md` §1.5 via `claude_peer_review.md` §3 revision 5). Capture inside `cloud_backup` is skipped whenever the sync is skipped (exit 4, exit 3, setting off) — and offline play is exactly when conflicts are manufactured. Capture is local work (hash, manifest entry, provenance fields), serialised with the engine by a manifest-write mutex; it never touches the remote. Capture is **provenance, not detection**: a file written with capture off is still detected (the engine hashes everything) and shown `unknown` (schema §4) — honest degradation, no stamping. Capture records the *launched* core; while the compiled default keeps `racommands = true`, `setupSaveState()`'s core rewrite is dormant (`es/SaveState.cpp`, gated on `!racommands`), so `getCore(true)` at the exit point is accurate **for this milestone**; it becomes a hard dependency the moment #10 ships a config file (`claude_peer_review.md` §2's refinement of `gpt-analysis.md` §1.5).

**Manifest write discipline** (my churn finding, retained): never rewrite the manifest to bump `generated_at`; write only when entries change, or every exit pass defeats the `--recent` window and the round-trip's "nothing changed" step.

### F6. Merge: a checked adapter, not raw ES primitives

My Step 1 endorsed `getNextFreeSlot()`/`copyToSlot()` reuse "as correct and evidence-based." **That was wrong** — conceded to `gpt-analysis.md` §1.8 (and to `claude_peer_review.md` §3, which verified it). I read `SaveStateConfigFile.cpp` closely and `SaveStateRepository.cpp` loosely. The verified facts:

- `getNextFreeSlot()` returns **-99** for an auto-only repository: the `states.size() == 0 → firstslot` early return does not cover a repo whose only state is `.state.auto` (slot −1); the 99999→0 scan finds no slot ≥ 0 and falls through (`es/SaveStateRepository.cpp`). `gemini_peer_review.md` §2's counter-claim is refuted by the embedded code — the early return requires an *empty* vector, not a numbered-slot-free one. This is the commonest KEEP BOTH case (auto conflicts).
- `getNextFreeSlot()` does not refresh the repository; `copyToSlot()` ignores both copy/rename return values and returns `true` unconditionally (`es/SaveState.cpp`); `makeStateFilename(fullPath=true)` derives the destination from the *source's* parent, so a staged cloud file would be "merged" inside the staging dir; `refresh()` deletes the `SaveState*` objects a wizard might be holding (`gpt_peer_review.md` §5.8).

The merge contract is therefore: refresh → allocate (auto-only → `firstslot`; else highest+1; treat −99 as a visible refusal, never a silent fall-through) → **reserve pending allocations inside the plan** (my §1.6's shape, retained — repeated calls before COMPLETE must not hand out the same slot) → compute destinations from the config templates, not from object state → copy state+png → **sha256-verify the destination** → only then remove any source (D-CLOUD-026's copy-verify-delete shape) → audit line *before* any deletion. KEEP BOTH on an auto conflict: the winner keeps `.state.auto`; the loser is re-slotted to the allocated numbered slot with its PNG.

### F7. Presentation: IA rev 4 plus a rev 5 amendment set

The IA (`docs/conflict-wizard-ia.md` rev 4) stands: cloud always left, nothing transfers until COMPLETE, quitting discards decisions, pre-pass gate, done page naming discards, 480×320-first, KEEP BOTH savestates-only and dimmed-with-reason on in-game saves. Amendments (IA rev 5; the IA doc is the design of record for #23, not a register row):

1. **Keep discarded saves defaults to ON, bounded** — conceded to `gpt-analysis.md` and `claude_peer_review.md` §6: two SRAM panels can both read unknown/unknown with untrusted clocks, and console-first means a support-only log is not a recovery path. The store lives at `/storage/.cache/cloud_sync/discarded/<path>/<sha256>` — **outside the sync tree**, so no allowlist rule is needed at all and `gpt_peer_review.md` §5.5's user-rules-precedence hazard cannot apply. My §1.7's "priced download" of the cloud-side loser is now genuinely priced: it rides the staging mirror, zero extra round trips. Retention: last N discarded versions per path (default 3) with a global entry cap as backstop; the count selector remains the retention rule.
2. **`clock_synced: false` is rendered** on both panels (my §1.5.5; `mistral-analysis.md` converged).
3. **Multi-file units present as one conflict row** (F2c).
4. **Conflicts queue; they do not interrupt.** The exit sync never opens the wizard over a player who just finished a game; it records conflicts and the card says so. A `GAME SETTINGS > CLOUD SETTINGS` row ("N SAVE CONFLICTS TO RESOLVE") is the way in, and the menu-triggered SYNC's completion surface links to it. This amends rev 4's "a sync that reports conflicts opens the wizard" and structurally defuses the auto-conflict frequency problem whatever the census finds.
5. The headless handoff is a **state file + badge**, not an exit code (F11).

Rejected from `claude-analysis.md` (defended): renaming the CLOUD header to the producing device (residence and producer are two facts; the IA already shows both — `gpt_peer_review.md` §1 concurs); `session_seconds` (a settled product choice and unreliable progress evidence — `gpt_peer_review.md` §1 concurs). The launch-time resume tile is parked to #37's futro.

### F8. Deletion semantics: new register row

V1: **deletions never propagate.** Absence on one side where agreement says both had the file → one-way transfer (resurrect), logged. Mass absence (all entries, or an unreadable/empty sync root) → fail closed: no transfers, loud error — absence is not proof of intent (`gpt_peer_review.md` §1: interrupted layout change, unmounted storage, emulator temp rename, external client), and the changelog's "empty or unreachable cloud folders refuse to act" is the shipped precedent. Deliberate deletion propagation is V2, designed with #25's snapshots as the safety net; the schema adds a tombstone additively then. This closes the gap my Step 1 named (deletion absent from the IA scope table and schema §3) in the conservative direction the cardinal rule requires.

### F9. Concurrency: a degradation contract, strengthened

`mistral_peer_review.md` is right that my Step 1 mitigation (pre-upload check + audit) was insufficient. The contract is now four-part: **(1)** recheck the remote object immediately before any overwrite — the staging pass is recent by construction, and the wizard re-stages the conflicted paths at COMPLETE; a mismatch becomes a conflict, never an overwrite. **(2)** Never overwrite a remote object that differs from agreement without first holding its bytes (staging / discard store). **(3)** Audit every overwrite with before/after hashes. **(4)** State the residue honestly: one round trip between recheck and write, with no compare-and-swap on arbitrary backends, is an accepted risk under the one-player-never-concurrent model — and because of (2) and (3), even a lost race is recoverable. Under this contract my §3.13 trace ends differently at the first writer: A's recheck sees B's upload ≠ A's agreement → conflict, not overwrite. `gpt_peer_review.md` §3's demand — "the lock is advisory" must not become "progress is protected under concurrency" — is met by (4)'s honesty, not by a protocol I cannot price.

### F10. Audit: unchanged

D-CLOUD-027 stands (append-only text at `/storage/.cache/log/cloud_audit.log`, rotated, support-only). The audit line for any deletion precedes the deletion (existing AC). Rotation bounds lineage (`gpt_peer_review.md` §1) — acceptable: `replaces` is one step by design and the log was never promised as unbounded history.

### F11. Result protocol: normalise, and never signal conflicts by exit code

Adopted from `gpt-analysis.md` (verified): `cloud_backup`/`cloud_restore` pass rclone's own exit codes through `clean_exit`, and rclone's 3/4 (directory-not-found / file-not-found per `report_rclone_error`) collide with the scripts' reserved 3 (lock) / 4 (no network); `ThreadedCloudSync` renders any 3/4 as SKIPPED — and those paths *do* stamp a last-run, unlike genuine skips. Both scripts also exit with the save-phase status only, masking a system-phase failure. The new engine: a normalized result protocol; conflicts-pending is a state file plus a menu badge; per-phase failures propagate. The collisions are filed as shipped bugs.

### F12. Filters are constructed, never inherited

The engine builds its filter set unconditionally on the command line (exclusions: `.rocknix`, `*.bak` — the session-transient file from `claude_peer_review.md` §5 A — conflicted-copy patterns, `bios/**`, the backup folder; inclusion: the saves allowlist). Two shipped hazards make this load-bearing, both adopted from `gpt_peer_review.md` §5.5: user rules precede defaults in `cloud_sync_helper`, so a defaults line is not a boundary; and a customised nonempty `RCLONEOPTS` that omits `--filter-from` currently syncs with **no allowlist at all** (the fallback only fires on an empty array — `cloud_backup`). The round-trip gains both fixtures; the second is filed as a shipped hazard.

---

## 3. Refinements (valuable, not load-bearing)

- **R1.** `origin` (F2.1) is additive and cheap; V1's wizard can also read the producing device's manifest from the union directly. Required before #37's badge (`issues/issue-37.md`); merely correct before then.
- **R2.** Union-fetch caching: cache foreign manifests keyed by device-id + remote mtime; measure first — five devices × ~20 KB is small but unpriced (`claude_peer_review.md` §5 E).
- **R3.** The SQLite history index beside the text audit log: still #20's open call; V1 does not need it. Default no.
- **R4.** #10's per-core **directory** materialisation is deferred (see decision changes); "core as data" already carries the milestone via the schema.
- **R5.** #19's badge severity: unchanged — the bench decides (D-CLOUD-025), same-chipset control first (`issues/issue-19.md`).

---

## 4. Concessions (owned, named)

| # | My Step 1 claim | Refuted by | Correction |
|---|---|---|---|
| 1 | Reuse `getNextFreeSlot()`/`copyToSlot()` "as correct and evidence-based" | `gpt-analysis.md` §1.8; `claude_peer_review.md` §3 | Checked merge adapter (F6) |
| 2 | "Size-plus-relist" certifies uploads on hashless backends | `gpt_peer_review.md` §3 | Withdrawn; download-and-hash certification (F4) |
| 3 | "The manifest has no entries for PNGs" | `gemini_peer_review.md` §3 | Wrong — schema §6 `screenshot` exists; the real gap is no PNG *hash* → `screenshot_sha256` (F2.2) |
| 4 | #10 Option A: attribute flat states to the default core | `gpt_peer_review.md` §3; `claude_peer_review.md` §3 | Withdrawn — violates "nothing stamps a file it did not write"; `core: "unknown"` + explicit inference marker, never a guess as fact |
| 5 | Auto-state "storm" as a given | `claude_peer_review.md` §3 (citing `es/SaveState.cpp::onGameEnded`) | Hypothesis for the shadow census; frequency is launch-habit-dependent |
| 6 | Bisync's blindness/recovery stated as settled | `gpt_peer_review.md` §3 | Restated as hypotheses; the spike arbitrates; falsification criteria retained |
| 7 | "Nothing touches D-CLOUD-031" | `gpt_peer_review.md` §3 | Wrong; five amendments proposed explicitly (F2) |
| 8 | Concurrency mitigation: pre-upload check + audit | `mistral_peer_review.md` | Four-part contract (F9) |
| 9 | N64 `.eep`/`.mpk` as the canonical multi-file case | `claude_peer_review.md` §3 | PPSSPP per-game-ID and the shared VMU are the corpus's own cases (F2.3) |
| 10 | Shadow-mode census underdefined | `mistral_peer_review.md` | Defined in §8 step 8 |
| 11 | `BACKUPPATH ≠ RESTOREPATH` handled by a warning | `gpt_peer_review.md` §3 | Fail-closed (§6, unknown 7) |

**Checked and not adopted** (to show the adoptions were verified, not absorbed): `gemini_peer_review.md` §5.1's "duplicate-cleanup prompt is broken" is refuted by the embedded source — `controller_confirm` and `ASSUME_YES` both live in `cloud_backup`'s own `load_config`, and `cloud_sync_helper` never calls `controller_confirm`. Its §5.2 (`check_internet` vs `first_remote()` divergence) is unproven — both mechanisms sort the same file's section names; worth one two-remote check, not a finding.

## 5. Defences (held, with the argument made better)

1. **Manifest-primary detection** — my §1.1, now the council's consensus. The ordering is spike-independent: even a perfectly hashing bisync has no writer for its agreement state after a manual apply, and D-CLOUD-030's sha256 is the only backend-independent comparison.
2. **D-CLOUD-029 retained** — the `--update` reopen is refuted by `102-cloud-saves`' restore-then-backup ordering (F5). `claude_peer_review.md` §6 sides with retention.
3. **Wrong-clock stranding (§3.6)** — stands for the shipped paths; in the new engine the window selects candidates but never admits by mtime, and full passes hash everything (F5).
4. **Stale-agreement and first-writer traces (§3.13)** — stand; mitigations in F4/F9.
5. **Hardware-first sequencing** — retained and extended (§8); `mistral_peer_review.md` names it the strongest part of my Step 1.
6. **Manifest churn, headless handoff, discard-store scope, screenshots scope** — stand; incorporated into F5/F7/F11/F3.

---

## 6. Decision changes, stated explicitly

| Row | Change | Argument |
|---|---|---|
| **D-CLOUD-028** | **Refine** (new row citing it): the changed-path exit pass may list the remote and download-and-hash to certify; nothing-changed stays zero-contact | A correctness read is not a reachability probe; without it the exit pass cannot refuse a clobber (my §3.6; `gpt_peer_review.md` §3) |
| **D-CLOUD-031** | **Refine** (new row citing it): the five F2 amendments + the manifest transport rule | Origin-vs-possession gap; PNG binding; multi-file units; parse and identity-collision rules; foreign-manifest republication (`gpt_peer_review.md` §5.4) |
| **D-CLOUD-017** | **Implementation refinement** (new row citing it): "key on core, build as data" stands; the **directory materialisation is deferred** past the wizard | Shipping `es_savestates.cfg` hard-codes `racommands = false` and flips `autosave`/`incremental` defaults (`es/SaveStateConfigFile.cpp`) — a launch-behaviour migration nobody budgeted, not a config change (`gpt-analysis.md` §2.5, verified); it also activates `setupSaveState()`'s core rewrite, making launched-core capture a #10 dependency |
| **#9 / #22 plan of record** | **Amend** (body edits + new row): detection is manifest-diff primary; bisync is a candidate transfer engine pending the spike | §2 F3; no register row made bisync the detector, so none is reversed |
| **New row: deletion semantics** | **Add**: V1 never propagates deletions; resurrection logged; mass-absence fails closed | F8; absence ≠ intent |
| **New row: concurrency contract** | **Add**: recheck-before-overwrite; preserve-before-overwrite; audit; residual window documented | F9 |
| **D-CLOUD-029** | **No reopening.** The one-way interim posture is a maintainer configuration note | F5 |
| **D-CLOUD-030** | **No reopening.** Compaction additionally cleans the session-zombie pair (F1) | `claude_peer_review.md` §5 A |
| **D-CLOUD-025 / D-CLOUD-027** | **No reopening** | — |
| **IA doc** | **Rev 5** (not a register row): discard default on + `.cache` store; clock marker; group presentation; conflicts queue via badge | F7 |

---

## 7. The eleven known unknowns — resolution plans

| # | Plan |
|---|---|
| 1 (chipset axis; loud/silent) | #19 bench, unchanged; same-chipset control first; gates badge severity only (D-CLOUD-025) |
| 2 (bisync behaviour) | Spike reframed: transfer-engine candidacy + adversarial fixtures for the manifest detector; no longer gates the detection design |
| 3 (auto state commonest?) | Hypothesis; the shadow census (§8.8) measures fork frequency per kind; the wizard labels `kind: auto` as a resume point regardless |
| 4 (KEEP BOTH pre-pass gate) | AC stands; the staging mirror makes the gate mechanical — staging is idempotent, an interrupted pre-pass simply re-runs, and the wizard refuses to open until it completes |
| 5 (no `es_savestates.cfg`) | Resolved by deferral (§6): compiled defaults stay for this milestone; #10's directory move gets its own futro with a launch-behaviour rehearsal |
| 6 (core pin not on device) | #21 emits `/usr/share/rocknix/core-pins` at image build; capture is told, not discovering; launched-core capture is accurate while `racommands` stays compiled-true |
| 7 (`BACKUPPATH == RESTOREPATH`) | **Fail-closed**: the engine refuses (logs, no transfers) when they differ, until the two-root case is modelled |
| 8 (standalone multi-file layouts) | `group` key (F2.3); the grouping table covers PPSSPP, VMU, N64, PSX memcards before #23 opens conflicts for those systems; ungrouped multi-file conflicts present adjacent with a "part of a set" hint |
| 9 (480×320) | Layout at 480×320 first; real-thumbnail recognition test on the RG351M (§8.9) |
| 10 (two devices online) | F9 contract + audit; residual window documented |
| 11 (round-trip never run) | **Fix the harness first** (§8.0), then run (§8.7) |

## 8. What must be proven on hardware, in order

0. **Repair `tools/cloud-round-trip` before any run** (adopted from `gpt-analysis.md` §3.1 / `gpt_peer_review.md` §5.9): it overwrites `rclone.conf` *before* asserting the first remote — the docstring's guard is inverted — never restores it, cleans up partially, and carries two assertions that cannot pass against the embedded uploader. VM only, never a configured handheld.
1. **Session-zombie experiment** (`claude_peer_review.md` §5 A): startup sync on, boot, launch from a numbered slot within 30 s, let the boot sync finish, exit, list the remote for `.bak` and extra slot files. One H700, one boot. Validates the `*.bak` exclusion and the compaction remedy.
2. **ES primitive failure paths** (`gpt_peer_review.md` §5.1–5.2, §5.8): auto-only allocation → −99; `copyToSlot` against an unwritable destination → reported success vs. actual bytes; refresh invalidation. Gates the merge adapter's contract.
3. **bisync spike**: loopback WebDAV dry-run, then Dropbox from the device; output shape under `--conflict-resolve none`, loser renaming, `--recover`/`--resilient` after interruption, external equalization, filter-change behaviour.
4. **Local backend-hash experiment** (`claude_peer_review.md` §5 D): `rclone hashsum dropbox` a state on the device vs. `lsjson --hash` of its uploaded copy. Settles whether `remote_hash` can be known at capture.
5. **Core-set divergence** (`claude_peer_review.md` §5 C): diff `LIBRETRO_CORES` across targets in the tree (no device time); if they differ, plant a state under an absent core's directory and open the manager.
6. **#19 bench**: same-chipset control → cross-chipset pairs → loud/silent (truncation, byte-flip with compression off).
7. **Round-trip full run** on the GENERIC_X64 VM, WebDAV **and** MinIO, with the new steps: manifest transport, two-device both-sides-changed (neither copy overwritten), deletion-resurrection, wrong-clock, foreign-manifest republication, discard-store exclusion, no-allowlist `RCLONEOPTS`.
8. **Shadow-mode census** on the maintainer's devices: the detector runs log-only for a fixed window. A **verdict-table bug** is defined as a verdict whose action would have destroyed or stranded data (divergent misclassified as one-way; unknown misclassified as identical; a group split that would stitch). Outputs: fork rate per kind (tests H4), verdict distribution, unknown-rate. Gates enabling the wizard's apply step.
9. **480×320 recognition** with real thumbnails on the RG351M (`gpt_peer_review.md` §6).

Build order after the gates: capture (#21) → detector/staging (#22) → wizard (#23) → merge adapter (#24). #10's directory move and #25 follow with their own futros.

## 9. Unknown unknowns — failure, cheapest experiment

| Failure | Cheapest experiment |
|---|---|
| Mid-session transient files sync out and persist (`.bak`, zombie slot) | §8.1 |
| Foreign manifest republished over its producer's newer one | Harness step: plant a stale foreign manifest locally, run the exit pass, assert the remote's copy unchanged |
| A real rclone error renders as SKIPPED-lock / SKIPPED-no-network, stamped | Force exit 3/4 from rclone; watch card and stamp |
| Torn manifest download crashes or misleads the union read | Truncate a staged manifest; expect `unknown` + retry, not a crash |
| Cloned-card identity collision silently merges two devices' provenance | Copy the ID file to a second device/VM; run both; expect the F2.5 warning |
| A detached emulator writer outlives `process.run()` and capture hashes a half-written save (the legitimate residue of `gemini-analysis.md`'s otherwise-wrong flush-race — page-cache coherence is not the issue) | Shadow mode: hash at exit and again at sync; flag mismatches |
| Customised `RCLONEOPTS` without `--filter-from` syncs the whole tree | Harness fixture (§8.0) — also filed as a shipped bug |

## 10. Unmeasured hypotheses this approach rests on

- **H1.** bisync's behaviour under `none`/`--recover`/`--resilient`/interruption/filter-change/external-equalization — settled by §8.3.
- **H2.** `rclone hashsum <backend>` computes backend-native hashes locally on the device (general knowledge, not corpus) — §8.4.
- **H3.** Rename preserves mtime on the device's filesystem (ordinary semantics; confirm on target) — harness.
- **H4.** Auto-state fork frequency — §8.8.
- **H5.** Core sets differ per target — §8.5.
- **H6.** WebDAV size-only staging skip misses same-size cloud changes until the next size-changing event — residual risk, stated in F3; characterised in §8.3/§8.7.
- **H7.** Staging and union-fetch cost on the maintainer's real library — measured in shadow mode.
- **H8.** Detached-writer lifecycle for standalone emulators — §8.8's double-hash flag.

---

## `corpus.provenance.json`

```json
{
  "corpus_mode": "facilitator_embedded_read_at_time",
  "source_count": 42,
  "source_reference_order": "positionally aligned across both arrays",
  "hash_verification": "SHA-256 values verified at embed time by the Council Facilitator and copied from the per-source headers",
  "independently_reread_files": false,
  "independently_rehashed_files": false,
  "commands_or_hardware_tests_performed": false,
  "manifest_read_timestamp_utc_as_supplied": "2026-09-05T17:32:51Z",
  "author_step1_artifact": "kimi-analysis.md",
  "peer_reviews_consulted": [
    "claude_peer_review.md",
    "gemini_peer_review.md",
    "gpt_peer_review.md",
    "mistral_peer_review.md"
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
    {
      "description": "Upstream rclone 1.75.0 bisync implementation and version-specific documentation; several bisync behaviour claims remain hypotheses until the spike",
      "declared_source_path": null,
      "sha256": null
    },
    {
      "description": "Utils::FileSystem implementations and ES headers needed to establish copy/rename/lifetime guarantees beyond the embedded excerpts",
      "declared_source_path": null,
      "sha256": null
    },
    {
      "description": "Full launcher/process implementation and RetroArch's directory-setting path (setsettings.sh and runtime configuration)",
      "declared_source_path": null,
      "sha256": null
    },
    {
      "description": "Executed round-trip, bisync-spike, and savestate-compatibility results",
      "declared_source_path": null,
      "sha256": null
    },
    {
      "description": "Current issue bodies and edited acceptance-criteria lists as distinct artifacts; the embedded issue snapshots are comment-thread exports in which the body cannot be distinguished from the first comment with certainty",
      "declared_source_path": null,
      "sha256": null
    }
  ]
}
```

=== END kimi-revised_plan.md ===

=== START mistral-revised_plan.md ===

I will produce a revised approach grounded in the embedded corpus and the peer reviews. This will be a standalone foundation document that a reader can act on without having read my Step 1 or any review.

---

# Revised foundation for cloud-save conflict resolution in ROCKNIX

## 1. Executive summary

The foundational approach must be built on a **manifest-based reconciliation layer** that is **stateless, content-addressed, and owned by the application**. `rclone bisync` is not a viable detector: it is blind to SRAM changes on hashless backends, demands `--resync` on first runs and filter changes, and its stateful workdir is a corruption hazard. The manifest schema (D-CLOUD-031) is the correct identity foundation, but it requires targeted refinements to handle deletion, multi-file saves, and provenance after merges.

The shipped write paths are **newest-wins** and must be replaced before any conflict resolution ships. The replacement must be **non-destructive by default**, preserve both copies of every fork, and never overwrite without explicit player choice. A **one-way stopgap** (disable the boot restore; keep only the exit upload) is the safest interim measure until the full replacement is ready.

## 2. What must be preserved from the original approach

- **Identity:** sha256 of stored bytes (D-CLOUD-030). Slot and file name are attributes.
- **Manifest:** one JSON per device under `savestates/.rocknix/`, describing in-game saves as well as states by path relative to the sync root.
- **Agreement record:** local, never synced (`/storage/.cache/cloud_sync/agreed.json`).
- **Conflict test:** identical → nothing; only one side changed → transfer; both changed or never agreed → wizard.
- **Presentation:** Vita-style walkthrough, system → game; cloud always left; KEEP LEFT / KEEP RIGHT / KEEP BOTH; nothing transfers until COMPLETE.
- **Audit log:** append-only text at `/storage/.cache/log/cloud_audit.log` (D-CLOUD-027).

## 3. What must change, and why

### 3.1 The detector must be manifest-based, not bisync-based

**Why:** Bisync is blind to SRAM changes on the QA WebDAV backend (size-only comparison), demands `--resync` on first runs and filter changes, and its stateful workdir is a corruption hazard. The manifest schema already provides a content-addressed identity foundation (sha256) that works on every backend.

**How:** Replace bisync with a **stateless detector** that:
- Lists the remote with `rclone lsjson --hash` (or size+mtime on hashless backends).
- Reads the local manifest and `agreed.json`.
- Applies schema §3's conflict test to every path.
- Never runs `--resync`; never uses a workdir.

**Evidence:** The corpus establishes the QA WebDAV has no hashes and no modtimes (`docs/save-manifest-alignment-review.md` §1); bisync's `--resync` demand is in the futro (`plans/conflict-resolution/vita-style-conflict-resolution.md` §4 step 2); the manifest schema already carries sha256 (`docs/save-manifest-schema.md` §6).

### 3.2 The shipped write paths must be replaced before conflict resolution ships

**Why:** The shipped boot sync (`102-cloud-saves`) and game-exit upload are newest-wins: `copy --update` overwrites the older copy, and the exit upload has no `--update` at all. This violates the cardinal rule ("never newest-wins") and destroys progress.

**How:** Replace them with a **non-destructive detector** that:
- Refuses to transfer any file that changed on both sides since the last agreement.
- Never overwrites without explicit player choice.
- Preserves both copies of every fork.

**Stopgap:** Until the replacement is ready, **disable the boot restore** and keep only the exit upload. This preserves both copies of every fork (the cloud holds the last-exit copy; the local copy is never overwritten). It is a maintainer setting, not a code change, and it respects D-CLOUD-029.

**Evidence:** The boot sync is `cloud_restore --yes --method=copy --update` then `cloud_backup … --update` (`autostart/102-cloud-saves`); the exit upload is `copy` with no `--update` (`cloud_backup --recent`); the cardinal rule is in `#11` and `.claude/rules/rclone-cloud-sync.md`.

### 3.3 The manifest schema must be refined

**Refinements needed (D-CLOUD-031 amendments):**

| ID | Change | Why |
|---|---|---|
| D-CLOUD-031-A | Add `origin` sub-object: `{ device: string, hash: string }` | KEEP BOTH and #37's copy-to-free-slot create versions whose producer is not the local device. The origin must be preserved so the wizard can show "this state came from Anbernic-RG35XX-SP" and the audit log can record it. |
| D-CLOUD-031-B | Add `screenshot_sha256` | A manifest can correctly identify the current state hash while its screenshot path contains an older PNG from an interrupted publication. The picker then confidently presents the wrong picture. Bind companions to a capture/version and withhold or mark the image when that association is unverified. |
| D-CLOUD-031-C | Add `container` kind for multi-file saves | PPSSPP's per-game-ID directory and the Dreamcast shared VMU are saves that span multiple files. The detector must refuse to auto-pick on shared containers and must offer the whole container as one unit. |
| D-CLOUD-031-D | Add `deleted` marker | A player deletion is resurrected at the next sync unless explicitly propagated. Tombstones recorded at the ES delete path + a mass-delete guard + `--backup-dir` archival are the safe propagation mechanism. |
| D-CLOUD-031-E | Add parse-failure rule | An unparseable manifest is "provenance unknown and flagged", never "no entry → unknown → proceed". Torn remote manifests on dumb backends must not silently proceed. |

**Evidence:** The origin gap is in the alignment review (`docs/save-manifest-alignment-review.md` §3.5); the screenshot binding is in `docs/save-manifest-schema.md` §6; the multi-file cases are in `cloud_sync-rules.txt` and D-CLOUD-028; the deletion gap is in `docs/save-manifest-schema.md` §3; the parse-failure rule is a general safety requirement.

### 3.4 The merge primitives must be wrapped in a checked adapter

**Why:** `getNextFreeSlot()` returns **-99** for an auto-only repository (the commonest conflict kind), does not refresh the repository, and `copyToSlot()` ignores the return values of both state and screenshot copy/rename operations. The IA's "slot exhaustion is not a real constraint" and "checked, not assumed" are both wrong.

**How:** Wrap the ES primitives in a checked adapter that:
- Refreshes the repository before allocation.
- Reserves the chosen slot in a pending-allocations map.
- Validates the destination path is free on both sides before copying.
- Verifies the copies before advancing agreement.
- Follows D-CLOUD-026's copy-verify-delete rule.

**Evidence:** `getNextFreeSlot()` returns -99 (`es/SaveStateRepository.cpp`); `copyToSlot()` returns true unconditionally (`es/SaveState.cpp`); the IA's claims are in `docs/conflict-wizard-ia.md`.

### 3.5 The discard store must be excluded from sync and bounded

**Why:** The discard store (`keep discarded saves`) is a wizard implementation detail that must not sync. The IA specifies a count selector that is the retention rule, but the allowlist has no rule for it.

**How:** Add `- /savestates/.discards/**` to `cloud_sync-rules.txt` ahead of `+ /savestates/**`. The discard store must be bounded by the count selector (default 3, per the IA).

**Evidence:** The IA's settings are in `docs/conflict-wizard-ia.md` § Settings; the allowlist is in `cloud_sync-rules.txt`.

### 3.6 The detector must never inherit `RCLONEOPTS` or `BACKUPMETHOD`

**Why:** The shipped default `cloud_sync.conf` still carries `--delete-excluded` in `RCLONEOPTS`; every new consumer of the config must independently remember to strip it, or a `sync`-method run deletes everything outside the allowlist on the destination.

**How:** The detector must never inherit `RCLONEOPTS` or `BACKUPMETHOD` semantics. It must explicitly set its own options.

**Evidence:** `--delete-excluded` is in `cloud_sync.conf`; `cloud_backup` and `cloud_restore` strip it at load; `cloud_sync_helper` does not strip it from existing configs.

## 4. Known unknowns and experiments

| Unknown | Experiment | Owner |
|---|---|---|
| What does `--conflict-resolve none` do to conflicted files in rclone 1.75.0? | Run a fixture against the QA WebDAV with `--dry-run`; record what bisync does to conflicted files. | #22 spike |
| Does `rclone hashsum dropbox` work on the device? | On the RG35XX SP, `rclone hashsum dropbox` one state and compare with `rclone lsjson --hash` of its uploaded copy. | #22 spike |
| Do core sets differ per target? | Diff `LIBRETRO_CORES` between the H700 and RK3326 build options in the tree. If they differ, plant a state under an absent core's directory on the RK3326 and open the manager. | #10 |
| Are thumbnails distinguishable on the RG351M? | Render actual thumbnails on the RG351M (480×320); verify a player can recognise the moment. | #23 |
| Does the boot sync race the running emulator? | Enable startup sync, boot, launch from a numbered slot within 30 s, wait for the boot sync to finish, exit, list the remote for `.bak` and extra slot files. | #22 |
| Does the discard store sync? | Construct a discard store, run a sync, list the remote for `.discards/`. | #23 |
| Does the detector inherit `--delete-excluded`? | Set `BACKUPMETHOD="sync"`, run the detector's dry run against a destination holding excluded files, list what it would delete. | #22 |

## 5. What must be proven on hardware before building

1. **The detector must pass the adversarial suite on the QA WebDAV and Dropbox.**
   - Same-size and same-mtime changed data.
   - Genuine forks with `none`/loser settings.
   - Rename and deletion distinctions.
   - External equalization after a manual decision.
   - Interrupted and missing agreement/listing state.
   - Filter changes.
   - Exact pre/post path and byte inventories.

2. **The merge adapter must pass the ES primitives' failure cases.**
   - Auto-only allocation.
   - Failed copies.
   - Thumbnail mismatch.
   - Repository invalidation.

3. **The discard store must be excluded from sync and bounded.**

4. **The detector must not inherit `--delete-excluded`.**

5. **The wizard must be reachable in kid/kiosk mode.**

## 6. Decision register changes

| ID | Change | Cites |
|---|---|---|
| D-CLOUD-029 | **Replaced:** The shipped write paths stay as they are until #22 replaces them. **With:** The shipped write paths must be replaced before conflict resolution ships. Until then, disable the boot restore and keep only the exit upload. | #11 cardinal rule, `autostart/102-cloud-saves`, `cloud_backup --recent` |
| D-CLOUD-031-A | **Refined:** The save manifest is one JSON per device under `savestates/.rocknix/`. **With:** Add `origin` sub-object: `{ device: string, hash: string }`. | Alignment review §3.5 |
| D-CLOUD-031-B | **Refined:** Add `screenshot_sha256`. | `docs/save-manifest-schema.md` §6 |
| D-CLOUD-031-C | **Refined:** Add `container` kind for multi-file saves. | `cloud_sync-rules.txt`, D-CLOUD-028 |
| D-CLOUD-031-D | **Refined:** Add `deleted` marker. | `docs/save-manifest-schema.md` §3 |
| D-CLOUD-031-E | **Refined:** Add parse-failure rule. | General safety |

## 7. What is out of scope for this foundation

- **Snapshots and rollback (#25):** V2; the schema must not preclude them, but they are not part of the conflict resolution foundation.
- **Launch-time resolution:** V2; the direction is good, but it re-scopes #23 and #37 and depends on unverified `GuiSaveState` mechanics.
- **Occurrence identifiers:** The lineage problem is real, but the second identity system is not warranted; hook the move operations instead.
- **Audit log tamper-proofing:** The log is support-only on the owner's own device; signing it against its owner is theatre.

---

This document is the foundation I would build on, having heard the critique. It stands on its own: a reader can act on it without having read my Step 1 or any review.

=== END mistral-revised_plan.md ===
