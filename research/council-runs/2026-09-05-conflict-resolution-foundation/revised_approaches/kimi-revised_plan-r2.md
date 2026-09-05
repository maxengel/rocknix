# Round-2 revised approach — the foundation I would build

**Author:** the council member whose round-1 revision was `kimi-revised_plan.md`.
**Corpus:** the 42 embedded sources, read at embed time, cited by declared path (shortened in prose to the part after `_sources/`) with the Facilitator's sha256 values recorded in `corpus.provenance.json` at the end. I did not re-read, re-hash, or execute anything.
**One honesty note before anything else:** `kimi-revised_plan.md` is not itself embedded. I engage with my own round-1 positions through the four reviews' quotations of them (F1–F9, H1–H8). Where I concede, I concede the claim as quoted.

---

## 0. How to read this document

This is a complete, standalone specification of the foundation: what gets built, in what order, with what guarantees, and what each guarantee rests on. Sections 2–3 are the delta since my round-1 revision (concessions and adoptions, with names). Section 4 is the architecture. Section 5 settles every substantive disagreement the reviews surfaced. Section 6 separates what the corpus proves from what the council merely agrees on. Sections 7–13 are the register changes, the unknowns, the experiments, the hardware gates, the refusals, and the build order.

The constraints from `00-problem-statement.md` are treated as binding throughout: preserve player progress above all; never default to recency; console-first; immutable OS, mutable `/storage`; rclone is the only transport; the exit path is watched by a player who just exited a game; guards fail closed; verify the artifact, not the report.

---

## 1. The foundation in one page

A save version is the sha256 of its stored bytes (D-CLOUD-030). Each device writes one manifest at `savestates/.rocknix/manifest-<id>.json` describing every save and state by path (D-CLOUD-031); a local, unsynced agreement record remembers the hash this device last moved per path per remote. Detection is a **unit-level three-way test** — local bytes, cloud bytes, agreed bytes — run by our own engine over rclone listings, foreign manifests, and on-demand content reads. `rclone bisync` is **not** the detector; it is a candidate bulk-transfer engine whose fate a spike decides, and no line of code depends on the outcome either way.

Capture happens at every game exit, offline or not, told the emulator and core by ES rather than discovering them. Non-conflicting changes are applied by the engine before any question is asked; genuine forks are **queued**, surfaced as a badge and a card line, and resolved in the wizard — never over the head of a player who just finished a game. The wizard walks system by system, cloud always left, screenshot or honest glyph, KEEP LEFT / KEEP RIGHT / KEEP BOTH, nothing conflicting transferred until COMPLETE. Merges go through a **checked adapter** over ES's slot allocator — never raw primitives, because the primitives lie. Every mutating transfer in both directions carries `--backup-dir` into a dated sibling, so no overwrite anywhere in the system destroys the only copy of anything. Deletions propagate only when they were **recorded** (an ES delete, a renumber, a compaction, a wizard choice) — as moves into the dated sibling, never hard deletes; unexplained absence fails closed, always. The shipped newest-wins write paths stay exactly as they are (D-CLOUD-029) until the engine replaces them wholesale.

---

## 2. What I concede from `kimi-revised_plan.md`

Nine positions did not survive review. Each is corrected in §4–§5; here they are owned.

| # | Round-1 claim (as quoted) | Refuted by | The refutation, verified against the corpus |
|---|---|---|---|
| C1 | **F8: deletions never propagate in V1; absence → resurrect, logged** | `claude_peer_review-r2.md` §2.1 | The renumber-churn trace: cloud-only `state5` downloaded onto `{0,1,2}`; `onGameEnded()` → `renumberSlots()` (incremental is true in the compiled default — `es/SaveStateConfigFile.cpp`, `es/SaveState.cpp`) moves it to `state3`; next pass uploads `state3` as device-only; `state5` is absent locally with agreement saying both had it → resurrected; D-CLOUD-030 compaction removes the local duplicate; next pass resurrects it again. **Forever.** I re-ran this trace against the embedded ES sources and the schema's move rule; it holds. Pure resurrection cannot terminate, because D-CLOUD-030's compaction is local-only and the cloud duplicate is never retired. |
| C2 | **F3: full staging mirror of the remote saves tree, hashed locally, as the default way to learn C** | `gpt_peer_review_r2.md` §1.2; `gemini_peer_review-r2.md` §1; `claude_peer_review-r2.md` §2.3 | A metadata-skipped `rclone copy` verifies the **cache**, not the cloud: on the QA WebDAV (no hashes, no modtimes — `repo/docs/save-manifest-alignment-review.md`) rclone compares by size, and same-size SRAM changes are the norm for fixed-size emulated memory — the #53 shape. And `rclone copy` is not a mirror: a remotely deleted file lingers in the stage, so staged presence is not proof of remote presence. |
| C3 | **F2: manifests move by explicit single-file copies, excluded from tree transfers** | `claude_peer_review-r2.md` §2.5 | A separate copy is another ~1 s rclone spawn on the path D-CLOUD-028 budgets at one spawn. The ownership semantics survive as filters inside the existing spawns. |
| C4 | **F5: the one-way interim posture "preserves both copies of every fork"** | `gpt_peer_review-r2.md` §1.1; `claude_peer_review-r2.md` row 14 | The exit upload is `copy` with no `--update` (`sources/cloud_backup`, the `--recent` branch): it overwrites the cloud head of a fork, after which the other head survives only on the other device — and a reflash or card failure ends it. The precise guarantee is *no device-local file is ever overwritten*. "Lossless" was wrong. |
| C5 | **F9: recheck-before-overwrite plus a staged prior version makes a lost race recoverable** | `gpt_peer_review-r2.md` §1.4 | The fatal interleaving: A checks and retains H₀; B publishes Hᵇ; A publishes over Hᵇ. A retained H₀, not Hᵇ. My staging protects the *observed* preimage, not the *intervening* one. |
| C6 | **F3's unit rule: classify per file; any divergent member makes the group divergent** | `gpt_peer_review-r2.md` §1.3 | The disjoint-member counterexample: agreed (a₀,b₀), local (a₁,b₀), cloud (a₀,b₁). No file is individually divergent, so the rule silently constructs (a₁,b₁) — a snapshot **neither device produced**. For an indivisible unit that is a fork, and per-file aggregation cannot see it. |
| C7 | **F1: D-CLOUD-030 compaction is the designed remedy for the mid-session zombie** | `claude_peer_review-r2.md` row 11 | Compaction covers *numbered slots of one game*. The `.state.auto` zombie is not a slot. The shipped sequence — `setupSaveState()` renames auto→`.bak` (old mtime preserved) and copies the slot→auto (fresh mtime); a racing boot backup uploads the zombie; `onGameEnded()` restores the real auto with its old mtime, which `--recent` never pushes; the next boot's `cloud_restore --update` downloads the zombie **over the real resume point** — is a concrete data-loss reproducer in shipped code (`es/SaveState.cpp`, `autostart/102-cloud-saves`). The remedy is exclusion and the lifecycle gate, not compaction. |
| C8 | **Discard retention "default 3, per the IA"** | `claude_peer_review-r2.md` row 15 | `repo/docs/conflict-wizard-ia.md` names a count selector and **no default**. The count-3 default is my proposal, and because IA rev 4 (which D-CLOUD-024 called implementation-ready) says *off by default*, flipping it needs a register row, not a citation. |
| C9 | **KEEP BOTH on an auto conflict: "the winner stays at `.state.auto`"** | `gpt_peer_review-r2.md` §2.6 | KEEP BOTH identifies no winner. Which copy automatic resume uses afterwards was undefined behaviour dressed as a rule. |

**Misread check:** `mistral_peer_review-r2.md` §3.3 attributes the staging mirror to `gpt-revised_plan.md` as something worth taking from it. The full mirror was my F3, and it was wrong; gpt's contribution was the candidate-scoped alternative I am now adopting. No other review misread my plan in a way that changes substance — the refutations above are correct, and `gemini_peer_review-r2.md` and `mistral_peer_review-r2.md`'s defences of F8 are addressed head-on in §5.1.

---

## 3. What I adopt from the other plans

Credited by filename; each is integrated in §4.

**From `claude-revised_plan.md` (via `claude_peer_review-r2.md`):** intent-recorded deletion receipts propagated as moves into dated siblings (the F8 replacement); `--backup-dir` in **both** directions as the concurrency-recoverability mechanism (developed from `gemini-revised_plan.md`'s seed); the agreement record bound to (remote, sync root); candidate-scoped staging with the full stage as hashless fallback; the reflash bootstrap; the one-writer rule and moving the boot sync under ES's scheduling; the in-spawn manifest transport filters.

**From `gpt-revised_plan.md` (via `gpt_peer_review-r2.md` and the other reviews):** the unit-level member-map classifier; the D-CLOUD-030 clarification (compaction concerns numbered states in one game/core repository, idle, after verified copies; never collapses an auto resume point into a numbered slot; equal bytes do not prove a move); the `makeStateFilename` parent-derivation finding (a staged-in-/tmp state would merge into /tmp — stage in the real save directory under a temp name); the eight #24 acceptance criteria, especially "standalone-emulator states never allocate" (`isEnabled` requires `retroarch`); the lifecycle gate **with a specified acquisition order**; self-contained producer provenance (an `origin` record, not a hash lookup into manifests the producer may have overwritten); move observation at the operation, not reconstruction after; the interrupted-apply contract; the precise cancellation sentence; the kid/kiosk rule; the import framing for `BACKUPPATH ≠ RESTOREPATH`; the "does loading a state rewrite SRAM?" and "no default route ≠ no reachable LAN remote" experiments; no 99-slot product cap; D-CLOUD-017 superseding the compat doc's "#10 likely unnecessary" line.

**From `gemini-revised_plan.md`:** the `--backup-dir` retention seed; the #10 launch-behaviour rehearsal as a real-device pre-implementation gate; the one-sentence D-CLOUD-029 confirmation ("the stopgap merely moves the clobber from game-exit to boot").

**From `mistral-revised_plan.md`:** the out-of-scope fence (a builder needs it as much as the plan); the IA-text corrections for rev 5 (the "checked, not assumed" paragraph is wrong about `getNextFreeSlot()` for the auto-only case); move observation as a first-class mechanism; the experiment→owner-issue table shape.

**Kept from `kimi-revised_plan.md` (verified by reviewers, not refuted):** the `RCLONEOPTS`-without-`--filter-from` hazard (a non-empty user `RCLONEOPTS` replaces the default option set wholesale — `sources/cloud_backup` `load_config` — and syncs `/storage/roms` with **no allowlist**; the most serious shipped hazard any plan found); the conflicted-copy admission in the saves tier (`+ /**/*.srm` admits a Dropbox "conflicted copy"; the saves scripts carry no `CONFLICT_EXCLUDES`); the `*.bak`/transient-artifact exclusion; the manifest-write discipline (never rewrite to bump `generated_at` — every exit would push 20 KB and the round-trip's "nothing to transfer" step would fail); the foreign-manifest republication hazard; the identity-collision rule for cloned cards; queue-and-badge conflict surfacing; the discard store outside the sync tree; the screenshots-tier recency exception; the ordered hardware gates with a defined shadow census; the #10 deferral.

---

## 4. The architecture, end to end

Each part is marked **endorse** (build as decided), **amend** (build with the stated changes), or **replace** (build differently), with register IDs cited.

### 4.1 Identity and lineage — **endorse, with five schema amendments**

D-CLOUD-030 and D-CLOUD-031 stand. A save version is the sha256 of its stored bytes; slot and file name are attributes; one JSON manifest per device at `savestates/.rocknix/manifest-<id>.json`, each device writes only its own, readers take the union; entries keyed by path relative to the sync root; the agreement record is local and unsynced at `/storage/.cache/cloud_sync/agreed.json`.

Five amendments (proposed as one register row refining D-CLOUD-031; §8):

1. **`origin`.** When a version is materialized anywhere other than where its producer wrote it — downloaded, re-slotted by KEEP BOTH — the receiving device records the producer's `device.id`, `device.label`, `core`, `core_build`, and `captured_at` **copied from the producer's entry at materialization time**. A re-slot is a new *placement* of an existing version, not a new version. This is `gpt_peer_review-r2.md` §2.3's correction: a per-device manifest holds one current entry per path, so when the producer overwrites the original path, the old provenance disappears from every manifest — hash-lookup provenance dies; self-contained provenance survives.
2. **`screenshot_sha256`.** The sha256 of the PNG that travels with a state. The picker's entire premise is choosing by the picture; a PNG that does not match the state version is a wrong picture shown at the worst moment. The apply step verifies the pair.
3. **`group`.** A label shared by the members of one save unit (VMU directory, memcard set, PPSSPP game-ID directory, an N64 `.eep/.mpk` pair), `null` for single-file saves. `rom` is `null` for shared containers (a VMU is not one game's). The grouping *table* — which layouts form indivisible units — lives in the engine, seeded from the allowlist's special directories (`sources/cloud_sync-rules.txt`: `n64/save/*`, `psx/memcards/*`, `dc/shared/savefiles/`, `psp/PPSSPP/`).
4. **Parse-failure rule.** An unparseable foreign manifest has its entries treated as `unknown`, is logged, is never adopted, and is never deleted — the producer rewrites it whole (temp-and-rename) on its next capture. A manifest with a higher `schema` is refused, per the schema's own rule.
5. **Identity-collision rule.** A device that finds entries under its own `device.id` that it did not write (a cloned card, an adopted identity file) warns loudly — audit line plus a UI surface — and does not adopt or merge them. The detection is behavioural, not time-based (`gpt_peer_review-r2.md` §2.3: clocks are explicitly untrusted in this design). The fix is regenerating one device's stored id, which `sources/cloud_device_id`'s stored-value-wins rule already permits.

Lineage: `replaces` holds one step; the audit log (D-CLOUD-027) holds the rest. **Move observation** (`mistral-revised_plan.md`'s mechanism, championed by `gpt_peer_review-r2.md` §2.3): ES's `copyToSlot(move=true)` and `SaveState::remove()` are patched to append one line to a local ops journal (`/storage/.cache/cloud_sync/ops.log`, never synced). Capture consumes it: a move re-keys the manifest entry (schema §6's own rule), which is what makes `replaces` correct across the rename-then-edit sequence — slot1=H₁, slot2=H₂, delete slot1 (renumber moves H₂ onto slot1's path), next session overwrites slot1 with H₃; without the journal, capture reads the stale entry and records `replaces: H₁` when the true predecessor was H₂. The journal is one choke point per operation type, and the round-trip suite proves it fires (blindspot 14: construct the renumber, watch the line appear). Hash-based move detection with re-verification remains as the safety net if a journal line is ever missed.

### 4.2 Capture (#21) — **amend**

Capture runs at the existing game-exit point (`es/FileData.cpp.launchGame-excerpt`), where ES already knows the game, `getEmulator(true)`, and `getCore(true)`, and passes them on the command line — told, not discovering (schema §9). Four amendments:

- **Unconditional.** Capture runs regardless of network, of the `cloudsaves.gameexit` setting, and of the cloud lock. The shipped gates (`FileData.cpp`: the setting, the binary's existence, `!ThreadedCloudSync::isRunning()`; `cloud_backup`'s exit 4 in `check_network_link`) exist for the *sync*; capture inside any of them misses exactly the offline sessions that manufacture forks. Capture is local reads plus a manifest write; per-file reads are safe against the engine's renames (rename is atomic), and a unit hashed across an apply boundary self-corrects at the next capture. It never takes the cloud lock, so it cannot deadlock behind a network worker (`gpt_peer_review-r2.md`'s acquisition-order requirement).
- **The launch descriptor, not the resolved default.** Record the core the launch actually used. Today `getCore(true)` is correct because the compiled default keeps `racommands=true`, which dormants `setupSaveState()`'s emulator/core rewrite; the XML path that activates the rewrite already exists (`es/SaveStateConfigFile.cpp`, `es/SaveState.cpp`), and upgraded installations can carry custom configs. ES passes what it launched; capture stays correct after #10.
- **The ops journal is consumed** (§4.1) so moves re-key rather than fork lineage.
- **The manifest is written only when something changed** — never to bump `generated_at`. Written whole, temp-and-rename.

`core_build` comes from `/usr/share/rocknix/core-pins`, emitted at image build from `LIBRETRO_CORES` × `get_pkg_version`, with `"unknown"` when the core→package map has no answer (schema §9). `clock_synced` is recorded; the wizard renders it.

### 4.3 Detection (#22) — **replace the detector; keep the issue's widened scope**

**The classifier is ours.** The authority is the unit-level three-way test. For a save unit U with member maps M_local, M_cloud, M_agreed (path → sha256 over the unit's *complete* member set, membership changes included):

| Condition | Verdict | Action |
|---|---|---|
| M_local = M_cloud | identical | nothing; write agreement if absent (verified equality writes agreement with no transfer) |
| M_local = M_agreed ≠ M_cloud | cloud changed | download the unit, no prompt |
| M_cloud = M_agreed ≠ M_local | device changed | upload the unit, no prompt |
| M_local ≠ M_agreed ∧ M_cloud ≠ M_agreed | **divergent** | wizard |
| no M_agreed ∧ M_local ≠ M_cloud | **never agreed** | wizard — conservative |
| only one side holds the unit | one-way | transfer, no prompt |
| cloud members match no manifest claim and no agreed map | **unknown** | ask — never silently "repaired" |
| a member missing that agreement says both had, no receipt | unexplained absence | fail closed (§4.6) |

Single-file saves are the degenerate case — this *is* the schema's §3 table generalized to units, which is the correction from `gpt_peer_review-r2.md` §1.3 (C6). A file with no manifest entry on either side is `unknown`-both and falls under "never agreed → ask" (the alignment review's constraint on #22). A sync client's conflicted copy is never a version the wizard offers (D-CLOUD-022) — and the saves tier currently *admits* one via `+ /**/*.srm`; that is a shipped bug, filed on day one (§8).

**How C's bytes are known — tiered, candidate-scoped** (C2's correction):

1. **Listing tier** (full passes): one `rclone lsjson --hash` of the sync root. Where the backend offers a hash, matching it against manifest-recorded `remote_hash` yields the sha256 without a download (schema §2).
2. **Manifest-claim tier:** the union of foreign manifests claims (sha256, size, mtime, device, core) per path. On hashless backends this is what catches another *ROCKNIX* device's same-size SRAM change — the producer's own manifest says so, and the subsequent download confirms the bytes.
3. **Confirmation tier:** download-and-hash for every path where a decision depends on it and tiers 1–2 cannot settle it — contested paths, wizard-displayed pairs, upload verification on hashless backends. On the QA WebDAV (no hashes, no modtimes) size is a hint and sha256-after-download is the confirmation, exactly as the schema says; a listing that answers nothing is *unknown*, never "no conflict" (blindspot 22).

The **full content stage survives only as a fallback mode** for backends offering neither hash nor modtime, and every staged object is valid only alongside the listing that vouched for its freshness. The residual is stated honestly: a same-size change by a *non-ROCKNIX* writer on a hashless backend is invisible to the cheap tiers; a periodic full-verify pass (menu-triggered, not boot) bounds it. The shadow census (§11) measures how large that scope actually is on the maintainer's real library before the fallback mode's cost is accepted.

**bisync is a candidate transfer engine, nothing more.** The spike (§11) decides whether bisync earns the bulk-transfer role for non-conflicting units. The engine's semantics — classification, agreement, receipts, the wizard's data — never depend on the outcome. If bisync is adopted: never `--resync` on its own (the first run is an explicit maintainer-driven step; `--resync-mode` defaults to path1, a winner-picks-all pass); `--recover`/`--resilient`; `--conflict-loser` never left to rename a savestate (its `…conflict1` suffix breaks `{{romfilename}}.state{{slot}}` and the file vanishes from the manager); the workdir named explicitly at `/storage/.cache/rclone/bisync`; every call under the cloud lock (the futro's #22 ACs, kept whole).

**The engine never inherits `RCLONEOPTS` or `BACKUPMETHOD`.** It builds its own option set. (Corpus-settled: `sources/cloud_sync.conf` ships `--delete-excluded` inside `RCLONEOPTS`; each legacy script strips it independently; the engine does not inherit the problem.)

**Passes and entry points.** The engine owns the saves tier's write paths (the futro's widened #22):

- **Boot pass** — full reconcile: download phase, then upload phase (the restore-before-backup ordering the old pair guarded), non-conflicts applied, conflicts queued, badge updated. Scheduled by ES once the UI is up and no game is running; the existing `autostart/102-cloud-saves` trigger is replaced by this, which is what removes the boot-sync-versus-gameplay race structurally (§4.7). Its liveness check becomes the configured remote, not `ping google.com` (`repo/.claude/rules/rclone-cloud-sync.md`: "reachability means the remote, not the internet" — the pre-existing gap is filed with #7).
- **Exit pass** — capture; then, if nothing changed since the last successful pass and no conflict work is pending: exit 0 with **no remote contact** (D-CLOUD-028's fast path preserved untouched). Otherwise one rclone spawn uploads the changed saves plus the own manifest (filtered include), with `--backup-dir` to the remote dated sibling; then verification — one `lsjson --hash` on hash backends (which also populates `remote_hash` lazily; no dedicated spawn), download-and-hash of just-transferred files on hashless ones. Before each upload, the cached manifest-claim tier is consulted: if a foreign manifest claims that path at a version ≠ agreement, the upload is skipped and the conflict queued instead. The residual is stated: a fork created since the last full pass can be overwritten on the exit path, and the dated sibling is what makes that recoverable; full passes detect authoritatively. The card reports `UPLOADED n` / `n CONFLICTS QUEUED` — never implying the cloud is settled when it is not (`gpt_peer_review-r2.md` §2.5's reporting rule).
- **SYNC SAVE DATA row** — explicit full reconcile, then a direct route into the wizard if conflicts exist (the player asked).
- **Menu full passes** — unchanged in spirit; they are where full-verify lives.

The replaced-mechanism inventory (the futro's requirement) is answered: `--update`'s newer-on-destination skip → the classifier; restore-before-backup ordering → the reconcile's download phase precedes its upload phase; the lock → kept, plus the lifecycle gate; the `--recent` window → kept for the exit pass; the stamps in `/storage/.cache/cloud_sync/` → written by the engine, so the D-UI-018 rows keep reading them. The content tier, the system-backup tier, and `gamelist.xml` are untouched — out of scope. Screenshots sync as today (append-mostly, timestamped names; no progress lives in a screenshot — a stated exception).

**Results are typed.** Every run writes a run-correlated result JSON (counts, per-phase status, conflicts found) that the card and badge read; rclone's raw exit codes never reach the UI. The shipped collision — rclone's 3/4 passing through `clean_exit` into the scripts' reserved SKIPPED meanings, and `clean_exit ${BACKUP_STATUS}` masking a system-phase failure — is filed on day one (`sources/cloud_backup`, `sources/cloud_restore`, `es/ThreadedCloudSync.cpp`; `claude_peer_review-r2.md` row 6, `gpt_peer_review-r2.md` §2.7).

### 4.4 Presentation and resolution (#23) — **amend the trigger and three details; endorse the rest**

IA rev 4's walkthrough stands: system by system then game by game; cloud always the left column; screenshot or glyph, never a substitute image; date, time, device + model, core + build per side; no file size, no play time; KEEP LEFT / KEEP RIGHT / KEEP BOTH; nothing conflicting transfers until COMPLETE; the pre-pass applies non-conflicts before the walkthrough opens, and the wizard refuses to open until it has completed.

Amendments (the IA rev 5 batch, §8):

1. **Queue-and-badge trigger.** "A sync that reports conflicts opens the wizard" cannot survive contact with the entry points: the boot pass has no UI to open anything, and the exit pass is watched by a player who just finished a game — a wizard over that moment is the prompt-as-failure-mode the repo's own rules name. Conflicts are recorded in a pending state file; the exit card says `n CONFLICTS QUEUED`; a `GAME SETTINGS > CLOUD SETTINGS` row reads `n SAVE CONFLICTS TO RESOLVE`; the wizard opens from that row and from the direct route after an explicit sync. (My F7.4 and `claude-revised_plan.md` converged on this; `gpt_peer_review-r2.md` §2.6's amendment — the direct route — is included.)
2. **The cancellation sentence** (`gpt_peer_review-r2.md` §2.6's precise form, which supersedes `claude_peer_review-r2.md` §2.8's): *"Cancelling leaves the conflicting versions unchanged and discards the walkthrough's choices. Earlier non-conflicting updates have already been applied."* Rev 4's "quitting partway leaves both sides exactly as they were" is literally false once the pre-pass has run.
3. **KEEP BOTH on an auto conflict requires a resume-side sub-choice** (C9): the player picks which copy becomes `.state.auto`; the other is materialized to the next free numbered slot through the checked adapter. One extra press; deterministic; visible. The schema's `kind: auto` marking lets the wizard label it a resume point rather than a numbered slot (schema §4).
4. **KEEP BOTH is dimmed with a reason** for in-game saves (fixed slots), for standalone-emulator states (`SaveStateRepository::isEnabled` requires `retroarch`; the allocator returns −99 — `claude_peer_review-r2.md` row 1, gpt's AC 8), and for auto-only repositories (the −99 defect).
5. **Kid/kiosk mode** (`gpt_peer_review-r2.md` over `mistral_peer_review-r2.md`): the full-UI block collapses in kid mode (`repo/docs/es-menu-map.md`), so the badge is invisible there — and a kid resolving save conflicts destructively is what kid mode exists to prevent. Pending conflicts stay safe (nothing destructive happens without the wizard) and become resolvable after unlock. No restricted-mode resolver is built.
6. **Layout at 480×320 first**, proven with real thumbnails on the RG351M (`tools/vm-visual-qa` frames at both sizes as AC evidence). If the thumbnails are not recognizable there, the fallback is a single-column compare (one panel, toggle sides) — decided by the test, not in advance.
7. **The compatibility badge** compares (core, core_build) between the entry and this device's pins; `unknown` renders honestly. Its severity — convenience or safeguard — waits for #19 (D-CLOUD-025 stands). Chipset is not an axis unless #19 makes it one.

The done page names each discarded copy per game, and the audit line is written **before** the apply step retires anything (the futro's ACs, kept).

### 4.5 Merge (#24) — **replace raw reuse with a checked adapter**

The corpus now proves the primitives cannot be used raw: `getNextFreeSlot()` returns −99 for an auto-only repository (the vector is non-empty with slot −1, the 99999→0 scan finds nothing — `es/SaveStateRepository.cpp`) and for any non-RetroArch emulator; `copyToSlot()` ignores the results of its copies and renames and returns `true` unconditionally (`es/SaveState.cpp`); and `makeStateFilename(fullPath=true)` derives the destination from the **source's** parent directory, so a cloud state staged outside the save directory would be merged back into the staging directory.

The adapter therefore:

- computes destinations itself; stages cloud bytes **in the real save directory under a temp name** (a name matching neither ES's slot regex nor the auto regex, cleaned on sight at the next pass — it would otherwise sync via `+ /savestates/**`);
- reserves the whole batch's target slots **up front** (refreshing between allocations is insufficient — planned copies have not materialized, so repeated refreshes return the same slot; `gpt_peer_review-r2.md` §3) and re-verifies at apply time;
- copies, **verifies the bytes by sha256**, then renames into place — PNG before state, the pair bound by `screenshot_sha256`;
- handles −99 explicitly: auto-only repository → the auto conflict's KEEP BOTH goes through the resume-side sub-choice; standalone or disabled → KEEP BOTH is dimmed, never attempted;
- records the merged copy as a new placement: manifest entry with `origin` preserved from the producer, `replaces: null`, slot as an attribute; audit line.

No 99-slot product cap is introduced to work around the allocator defect (`gpt_peer_review-r2.md`). `renumberSlots()` remains available if gap reclamation is ever wanted.

### 4.6 Safety, deletion, and rollback — **replace F8/F9 with the receipts-and-siblings mechanism**

**Every mutating transfer, in both directions, carries `--backup-dir` into a dated sibling.** Uploads: `remote:<SYNCPATH>-replaced/<stamp>/` (a sibling, never nested — D-CLOUD-014's verified constraint). Downloads and local retirements: `/storage/.cache/cloud_sync/discarded/<stamp>/`. Zero extra spawns; the archiving rides inside the transfer. This is `claude_peer_review-r2.md` §2.2's development of `gemini-revised_plan.md`'s seed, and it is what answers `gpt_peer_review-r2.md` §1.4's interleaving: when A publishes over B's intervening Hᵇ, A's own `--backup-dir` moves Hᵇ aside server-side in the same spawn. The guarantee is **recoverability, not prevention** — there is no compare-and-swap on arbitrary backends, and `--backup-dir`'s exact behaviour under a two-writer race (which generation it archives, same-second destination collisions) is a named spike fixture, not an assumption (§11).

**Deletion propagates only from recorded intent** (C1's correction). Three sources of intent, all local and all ours: the ops journal (ES deletions and renumbers), compaction (D-CLOUD-030), and wizard resolutions. Each produces a **receipt**: *path P held version H; this device retired it at T for reason R*. Propagation: if the cloud holds P with hash verified == H, the engine copies it to the dated sibling, verifies, then deletes P — copy-verify-delete, never `rclone move` (D-CLOUD-026). If the cloud holds P at any other hash, the world changed since the receipt: that is a conflict, not permission. Receipts are capped per run; an unexpected deletion set fails closed. A mass-absent remote tree refuses to act at all (the changelog's empty-remote guard).

**Unexplained absence fails closed, exactly as F8 said.** No receipt → the absent path is resurrected or asked about, never deleted. This is where `gemini_peer_review-r2.md` and `mistral_peer_review-r2.md`'s defence of F8 is honoured: their argument — a false tombstone loses data, a resurrection annoys — is correct for *unrecorded* absence, and it survives whole. What does not survive is "never", because D-CLOUD-030's own compaction cannot terminate without a cloud-side retirement (the churn trace, C1). The minimal mechanism that terminates is receipts for recorded operations; nothing more general is built (§5.1).

**The move-path rule** (proposed register row, §8): for a savestate, the device's renumbered path is canonical; the cloud's old path is retired by receipt. This answers the schema §3's dangling "the rule in #24 says which path wins" — #24 never said; now it is said.

**Keep discarded saves** becomes a retention count over the local dated sibling — the same machinery as #25's pre-change snapshots, built once, as the IA asked. Default **ON, count 3**, proposed as a register row (C8). The store lives outside the sync tree, so no allowlist rule is needed — and note `claude_peer_review-r2.md` row 8: a *defaults-file* exclusion is not a boundary at all, because `cloud_sync_helper` places user rules first. That propagates to #25: its snapshot exclusion must be a command-line exclusion or an outside-tree location, never a defaults line.

**The interrupted-apply contract** (`gpt_peer_review-r2.md` §1.5's requirement, `claude_peer_review-r2.md` §2.8's shape): the wizard's decisions are frozen into an **apply record** before anything moves — per unit: the decision, the operand hashes on both sides, destinations, preimage locations, and a per-unit status. Apply per unit: stage → verify staged bytes against the operand hash → move the loser to the local sibling → rename staged into place (PNG before state; a multi-file container staged as a whole directory and renamed whole) → verify final bytes → write manifest entries → write agreement **last** → audit line → mark status. An interruption leaves each unit old or new; the record's presence at the next pass means "an apply was interrupted", and each unit is re-reconciled from the record against reality — never deleting a unique candidate, never repeating a destructive step against a different occupant, and re-offering undecided units. The done page after a crash reads the record and says accurately what was applied. The audit log (D-CLOUD-027: bounded, support-only) is deliberately **not** the journal.

### 4.7 The one-writer rule and the lifecycle gate — **new, load-bearing**

The save tree has at most one writer at a time among gameplay, capture, and engine mutations. ES holds a **lifecycle lock** (a flock, non-blocking on the engine's side) for the duration of gameplay; the engine takes it before any save-tree mutation — downloads, compaction, apply — and skips-and-defers if a game is running. Acquisition order is fixed: **lifecycle lock, then cloud lock, never the reverse**; capture takes neither (§4.2). The gate is scoped to save-tree safety: game launch is never blocked behind a long content transfer (`gpt_peer_review-r2.md` §4's scoping). This is what closes the shipped boot-sync-versus-session race structurally rather than by timing luck: the boot pass runs under ES's scheduling when no game is running, and a game launched during any engine pass leaves the pass deferred, not racing. The session-zombie reproducer (C7) is run on hardware first, because it is also the evidence that justifies this gate to the maintainer (§11).

### 4.8 Migration off today's write paths — **endorse D-CLOUD-029; no stopgap**

The shipped paths stay exactly as they are until the engine replaces them: boot and menu run `copy --update` down then up; the exit upload is `copy` with no `--update` — newest-wins, blindspot 28. D-CLOUD-029's reasoning stands and I no longer argue with it: the maintainer is the only user until the feature exists, and the `--update` stopgap only moves the clobber from game-exit to boot (`gemini-revised_plan.md`'s one sentence). The maintainer's optional config posture — boot pair and SYNC row off, exit upload on — remains available as their own toggle choice, described with the corrected guarantee (C4): *local-loss-proof, not lossless; the cloud head of a fork can still be overwritten, surviving only on the other device.*

The upgrade is invisible (`repo/.claude/rules/upgrade-and-install.md`): existing saves are `unknown` and rendered as such; nothing stamps a file it did not write; the first full pass hashes the library once (priced on the maintainer's library before deciding boot vs menu — `claude_peer_review-r2.md` §2.11's consequence); verified equality writes agreement without transfer, so a device whose cloud already matches gets no false conflicts; a reflashed device regenerates the same `cloud_device_id` (seeded from the permanent hardware address), finds its own previous manifest in the cloud, and **seeds from it before its first capture republishes** — capture works offline regardless; the merge rule is that pre-reflash entries are its own history, refreshed for files it still holds, kept as provenance for files it does not. `BACKUPPATH ≠ RESTOREPATH` is handled as an **import**: the two-way engine refuses; a one-way copy into the alternate root writes no agreement (`gpt_peer_review-r2.md`'s framing, which beats my fail-closed-everything because `sources/cloud_sync.conf` documents the split as a feature).

---

## 5. The disagreements, settled

### 5.1 Deletion propagation — receipts for recorded operations; fail-closed otherwise

**Position:** as §4.6. **Reason:** C1's churn trace — verified against `es/SaveStateRepository.cpp`, `es/SaveState.cpp`, and D-CLOUD-030's text — shows pure resurrection cannot terminate, and `gpt_peer_review-r2.md` §2.2 independently reached the same scoping ("unexplained absence is not deletion authority; verified duplicate cleanup is already decided; do not make a general deletion protocol a prerequisite merely to solve duplicate convergence — but do not defer convergence either"). `gemini_peer_review-r2.md` ("Kimi is right… V1 must fail closed on absence") and `mistral_peer_review-r2.md` §1.2 ("the only safe V1 posture is no deletion propagation") did not engage with the trace; their safety argument is preserved in the fail-closed half, and their fragility worry is answered by the design's failure direction — a missed journal line means no receipt, and no receipt means fail closed. **Deciders:** the churn-termination fixture (cloud-only `state5` onto `{0,1,2}`; download; launch from the manager and exit; sync twice; assert one copy of H per side, no churn, the retired cloud copy in the dated sibling); the delete-propagation fixture (delete the highest slot on A; sync; sync B; assert B's copy is moved aside, not resurrected); the stale-receipt fixture (a receipt for X retires only an unchanged X; if the other side now holds Y → conflict); the mass-absence fixture (refuses to act). **Under each outcome:** if receipts prove fragile in practice, the hash-based move detection with re-verification is the net, and the worst case is bounded churn — annoying, never loss.

### 5.2 Concurrency — `--backup-dir` both directions; gpt's protocol deferred with a named trigger

**Position:** as §4.6. **Reason:** the model is one-player-many-devices-never-concurrent; the budget forbids a two-phase commit in bash (gpt's own pricing: a changed unit can require an evidence read, a publication batch, the canonical transfer, and verification, against a path where one save already costs ~7 s, "most of it Dropbox's commit" — `repo/.claude/rules/rclone-cloud-sync.md`); and the cardinal rule needs recoverability, not linearizability. `mistral_peer_review-r2.md` §1.3 is right that the pre-upload check alone cannot close the window — which is exactly why the mechanism is `--backup-dir`, not the check. **Deciders:** the two-H700 race fixture (interleave publications; kill after each destructive stage; pass = both heads present, one canonical, one siblinged) and gpt's Gate 5 cost measurement. **Under each outcome:** if `--backup-dir` preserves intervening heads on Dropbox and WebDAV, ship as designed; if it does not, gpt's protected-publication protocol becomes load-bearing **before multi-device ships**, and the drop sequences single-device-first.

### 5.3 How C's bytes are obtained — candidate-scoped tiers; full stage as hashless fallback

**Position:** as §4.3. **Reason:** C2. `mistral-revised_plan.md`'s metadata-only detector is rejected with it (`claude_peer_review-r2.md` row 13: on the QA WebDAV it compares by size — the #53 shape it itself cites). **Deciders:** the same-size WebDAV fixture (change a cloud SRAM preserving size; the classifier must not conclude "cloud unchanged"); the shadow census cost measurement. **Under each outcome:** if the decision-scoped download set is small on the maintainer's library, candidate-scoping is permanent; if it is large, the full-stage fallback is priced and accepted for hashless backends only.

### 5.4 bisync's role — candidate transfer engine; the classifier is ours regardless

**Position:** as §4.3. This is the council's main amendment to argue to the maintainer: the problem statement listed bisync-as-detector as the approach under judgement, and no register row made it binding (`claude_peer_review-r2.md` §0 is correct on both counts). The spike-independent argument — nothing writes bisync's listing state after a manual wizard apply — remains a hypothesis until the spike; the spike runs regardless. **Decider:** the spike matrix (§11). **Under each outcome:** pass → bisync earns bulk transfer of non-conflicting units under our flags; fail → pure rclone copy, and nothing in the engine changes, because nothing depended on it.

### 5.5 #10's per-core directories — deferred to their own futro; no safety claim made

**Position:** defer, with `gpt-revised_plan.md`'s proof obligations (via `claude_peer_review-r2.md` §2.4) installed as #10's futro gates, and `gemini-revised_plan.md`'s real-device launch-behaviour rehearsal as the pre-implementation gate. **Reason:** shipping `es_savestates.cfg` is a launch-behaviour migration, not a config change — corpus-settled (`es/SaveStateConfigFile.cpp`: the XML path hard-codes `racommands = false` and defaults `autosave`/`incremental` to false; the compiled `Default()` sets all three true). The wizard does not need the directory: `core` is a field, the classifier and badge work on the flat layout. **Honesty** (`gpt_peer_review-r2.md` §2.4): the flat layout's local cross-core overwrite (core C₂ writing the `.state.auto` path C₁ used, before any reconciler sees either version) is **pre-existing shipped behaviour** — this milestone does not worsen it, and I do not claim the drop is "safe" against it; D-CLOUD-017 stands and #10 gets its own futro. Also adopted: gpt's note that D-CLOUD-017 supersedes `repo/docs/savestate-compat-test.md`'s "#10 likely unnecessary" — a clean chipset result narrows the badge; it does not repeal core namespacing.

### 5.6 Wizard trigger, retention default, cancellation, auto KEEP BOTH, kid mode

Settled as §4.4: queue-and-badge with a direct route (IA rev 5, not a quiet replacement of the rev 4 contract); retention ON with count 3 by **register row**, not by citation (C8); gpt's precise cancellation sentence; the resume-side sub-choice; gpt's kid/kiosk rule over mistral's reachability requirement.

### 5.7 Manifest transport — in-spawn filters, gated on one dry run

**Position:** downloads exclude `/savestates/.rocknix/manifest-<own>.json`; uploads include only the own manifest under `.rocknix/`; foreign manifests in the tree are harmless read-only caches; the reflash bootstrap (§4.8) is a first-run special case, not a transport rule. **Reason:** C3. **Decider:** one dry run, because the corpus establishes only that `--include`/`--exclude` precede `--filter-from` (`repo/.claude/rules/rclone-cloud-sync.md`); the relative order of `--filter` and `--filter-from` is unestablished. If `--filter` cannot be ordered ahead, `--exclude`/`--include` are used, which can. The republication hazard itself (a cached foreign manifest republished over its producer's newer one; the own-manifest download overwriting entries captured since) becomes a round-trip fixture.

### 5.8 Interrupted apply — the frozen plan is the journal

Settled as §4.6: the apply record with per-unit status **is** the durable pending-operation record; no separate transaction journal, no database, no daemon. `gpt_peer_review-r2.md` §1.5's acceptance contract is adopted verbatim as the test: after interruption, the implementation can identify the exact planned versions and destinations, distinguish completed work from intent, keep incomplete units out of emulator consumption, and either finish or safely stop without deleting a unique candidate.

### 5.9 Split roots, remote_hash, agreement writes

Split roots: import framing (§4.8). `remote_hash`: populated lazily from the next natural listing, never by a dedicated post-upload spawn on the watched path (`claude_peer_review-r2.md` §4); a locally computed backend-native hash (`rclone hashsum dropbox`) is an *expected* value, not an observation — it remains my H2 experiment, not a dependency (`gpt_peer_review-r2.md` §2.5). Agreement is written in exactly three ways: after a verified upload, after a verified download, after verified equality. No provisional agreement authorizes anything (`gpt_peer_review-r2.md` §4's removal, adopted).

---

## 6. What the corpus settles vs what the council merely agrees on

The most expensive error left is a position held by everyone and evidenced by nobody. These are the load-bearing ones:

| Position | Status | What settles it |
|---|---|---|
| bisync's 1.75.0 behaviour under `--conflict-resolve none`, interruption, filter change, external equalization | **Council-agreed (demoted), corpus-silent** | The spike matrix (§11, gate 2) |
| `--backup-dir` preserves the intervening head under a two-writer race on our backends | **Council-agreed (claude/gemini/me), untested for this use** — shipped precedent exists only for `BACKUPMETHOD=sync` | The race fixture (§11, gate 7) |
| The exit upload overwrites the cloud head of a fork | **Code-visible** (`sources/cloud_backup` `--recent` forces `copy`, no `--update`), **not executed** | The cheap counterexample (§11, gate 1) |
| The session-zombie resume-point loss | **Code-traced** (`es/SaveState.cpp` + `autostart/102-cloud-saves`), **not executed** | The H700 reproducer (§11, gate 3) |
| Foreign-manifest republication | **Allowlist admission verified** (`+ /savestates/**`); the republish behaviour not executed | Round-trip fixture (§11, gate 1) |
| Auto states are the commonest conflict | **Schema §4 asserts; launch-habit dependent** (`gpt_peer_review-r2.md` §3: numbered-slot launches discard the session's auto at exit) | The shadow census (§11, gate 8) |
| 480×320 thumbnails are recognizable | **Council-agreed to test; unmeasured** | The RG351M recognition test (§11, gate 9) |
| Core sets differ per build target | **Asserted, not corpus-established** | `diff LIBRETRO_CORES` across targets — no hardware (§11, gate 0) |
| `--filter` vs `--filter-from` ordering | **Not in corpus** | One dry run (§11, gate 0) |
| `rclone hashsum <backend>` computes backend-native hashes locally | **General knowledge, not corpus** | Device experiment; not a dependency |

Corpus-**settled** (assertable without further experiment): the −99 allocator defect; `copyToSlot`'s unconditional `true`; the `es_savestates.cfg` behaviour flip; the boot pair's shape and its `ping google.com` gate; the harness defects; the `RCLONEOPTS`-without-`--filter-from` hazard; user-rules-first in `cloud_sync_helper`; the allowlist's admission of `*.bak` and conflicted-copy `.srm`; the exit-code 3/4 collision and phase-status masking; newest-wins as shipped (blindspot 28); the substrate (rclone 1.75.0 with bisync, `take_cloud_lock`, `jq`, busybox `sha256sum`, ES's slot primitives, the allowlist's `*.db*` exclusions); the budget numbers (~1 s rclone start, ~5 s nothing-changed exit sync, ~7 s one save); all cited D-CLOUD rows.

---

## 7. Load-bearing vs optional

**Load-bearing** — get these wrong and the milestone is unsafe:

1. Identity = sha256 of stored bytes (D-CLOUD-030) and the unit-level three-way classifier with unknown→ask and never-agreed→ask.
2. Capture at exit: unconditional, told-not-discovered, journal-consuming, write-only-on-change.
3. The checked merge adapter (no raw ES primitives; batch reservations; temp-then-rename; byte verification; PNG binding).
4. The one-writer rule: lifecycle gate with fixed acquisition order; the boot pass under ES's scheduling.
5. `--backup-dir` in both directions; dated siblings; retention count.
6. The ops journal + receipts; unexplained absence fails closed.
7. Manifest transport ownership (own manifest never downloaded over local; no republish of cached foreign manifests).
8. Agreement scoped to (remote, sync root); written last per unit; only the three write paths of §5.9.
9. The apply record for interrupted applies.
10. Guards fail closed; every transfer verified by content.

**Optional / deferrable:** bisync as transfer engine; the badge's severity (#19); #10's directories; #25's snapshot UI; resolution receipts / anti-ping-pong (V2 — the ordinary post-resolution case is "cloud changed → download"; a re-ask arises only when the other device never agreed, and re-asking is not destructive); full-verify cadence tuning; a kid-mode resolver; the SQLite history index (**rejected** — say so in #20 and close it).

---

## 8. Decision-register changes (proposals to the maintainer)

The register is append-only; each is a new row citing the old. Nothing below reopens a row silently.

- **D-CLOUD-029: stands.** No stopgap; the engine replaces the write paths wholesale. No row needed.
- **Proposed D-CLOUD-032** (refines D-CLOUD-030, cites #24): compaction's scope clarified — numbered states in one game/core repository, idle, after verified copies; never collapses an auto resume point into a numbered slot; equal bytes do not prove a move. And the move-path rule: for a savestate, the device's renumbered path is canonical; the cloud's old path is retired by receipt.
- **Proposed D-CLOUD-033** (refines D-CLOUD-031): the five schema amendments of §4.1 (`origin`, `screenshot_sha256`, `group`, parse-failure rule, identity-collision rule) plus agreement scoping to (remote, sync root).
- **Proposed D-CLOUD-034** (refines D-CLOUD-024 / IA rev 4): *keep discarded saves* defaults **ON** with a retention count of 3, bounded, sharing #25's machinery. Reason: the default-off path is destructive on the commonest conflict kind; the cardinal rule prefers retention; the count bounds card storage.
- **Proposed D-CLOUD-035** (refines D-CLOUD-028): the exit pass may spend verification round trips on just-transferred files (one listing on hash backends; download-and-hash on hashless). The no-change fast path — no remote contact — is untouched. Numbers attached after the pricing gate (§11, gate 8) before the row is asked for.
- **Proposed D-CLOUD-036** (amends the #22 approach as framed in `00-problem-statement.md` and the futro): the conflict classifier is the manifest three-way test; bisync is a candidate transfer engine pending the spike. This is the amendment `claude_peer_review-r2.md` §0 correctly says must be argued, not body-edited.
- **IA rev 5 batch** (to the maintainer with D-CLOUD-034; not rows): queue-and-badge trigger; the cancellation sentence; the KEEP BOTH auto sub-choice; the `getNextFreeSlot` −99 correction to the "checked, not assumed" paragraph; the kid/kiosk rule.
- **Propagated to #25:** the snapshot exclusion cannot be a defaults-file rule (user rules precede defaults); it must be a command-line exclusion or an outside-tree location.
- **Filed on day one, outside the milestone:** the `RCLONEOPTS`-without-`--filter-from` ROM-upload hazard; the exit-code 3/4 collision and saves-phase-only status masking; the round-trip harness repair (it overwrites `rclone.conf` before asserting the first remote, never restores it, and its dated-archive and tar-name assertions cannot pass against the embedded uploader); conflicted-copy artifacts in the saves tier; the `*.bak`/transient-artifact exclusion; the boot liveness check (#7); the exit-4 LAN finding (`gpt_peer_review-r2.md`: no default route ≠ no reachable LAN remote — `check_network_link` should test the remote's host against connected routes before declaring exit 4).

---

## 9. The eleven known unknowns: resolution plans

1. **Chipset axis; loud vs silent failure.** Run `repo/docs/savestate-compat-test.md` on the bench (H700 ×2, RK3326, RK3566), **same-chipset control first**, all devices on one build, before the badge is designed (D-CLOUD-025). Under "portable": the badge is a convenience. Under "silent corruption": it is a safeguard and the cross-core toggles get destructive framing. Either way the schema carries core + build.
2. **bisync against a real remote.** The spike (§11, gate 2): loopback WebDAV, then MinIO, then Dropbox from the device; the matrix of §11. Until it runs, no code depends on bisync. Its agreement state vs ours: answered by the external-equalization fixture.
3. **The auto state as commonest conflict.** Measured by the shadow census (fork rate per kind). The wizard treats `kind: auto` as a resume-point decision regardless; the census decides whether the resume framing is the common path or a special case.
4. **The KEEP BOTH pre-pass gate.** The wizard refuses to open until the pre-pass completes and says so (kept AC). An interrupted pre-pass is marked in the apply record; the next pass re-runs it; the wizard never opens on a partial one.
5. **No shipped `es_savestates.cfg`.** #10's futro creates it *and* moves RetroArch's `savestate_directory` (two consumers, one layout — the alignment review §3.2), rehearsed on a real device first (§5.5).
6. **The core build pin.** #21 emits `/usr/share/rocknix/core-pins` at image build; ES passes emulator and core at exit; `"unknown"` when unmapped.
7. **`BACKUPPATH == RESTOREPATH`.** Assumed; the engine refuses two-way when split; one-way import writes no agreement; a warning in `cloud_sync_helper`.
8. **Standalone layouts.** The grouping table is seeded from the allowlist's special directories; the unit classifier handles them; the SRAM-rewrite experiment (§10) decides whether a state and its `.srm` are a cross-unit dependency.
9. **480×320.** Layout at 480×320 first; the recognition test decides; the single-column compare is the designed fallback.
10. **Two devices online at once.** Not enforced; `--backup-dir` recoverability plus the audit log make violations visible and survivable; the race fixture proves the recoverability; the model stays "never concurrent" with the residual stated.
11. **The round-trip suite has never run.** Repaired first (§8), then run on a GENERIC_X64 VM against **both** backends before #22 begins — never against a configured handheld — with the new steps: manifest transport, two-device both-sides-changed (pass = neither copy overwritten), churn termination, deletion receipts, wrong-clock, republication, discard exclusion, no-allowlist `RCLONEOPTS`, same-size WebDAV SRAM fork, and the manifest step from the alignment review (manifest reaches the remote; `remote_hash` null on WebDAV, non-null on S3; absent from the content tier).

---

## 10. Unknown unknowns: named failures and their cheapest experiments

- **The boot-sync vs game-session race** (now known): the zombie reproducer — §11, gate 3.
- **Rename-then-edit lineage corruption** (`gpt_peer_review-r2.md`): delete slot 1 of {1:H₁, 2:H₂}, renumber, overwrite slot 1 with H₃; inspect `replaces`. Cheapest: the exact sequence on a device; the ops journal is the fix.
- **The disjoint-member unit fork** (`gpt_peer_review-r2.md`): the two-file fixture of C6 — pure classifier test, no hardware.
- **Stale foreign manifest republished** (mine): plant a stale `manifest-<other>.json` locally, run the exit pass, assert the remote's copy unchanged.
- **Identity collision on a cloned card** (mine): clone an ID onto a second same-model device; assert the warning fires and no entries are adopted.
- **Does loading a state rewrite SRAM?** (`gpt_peer_review-r2.md` — the sharpest unasked grouping question): load a state on disposable data, hash the `.srm` before and after. Decides whether state and SRAM are one unit.
- **The wizard's cloud-screenshot fetch fails mid-open:** kill the network between queue and open; the panel must render the glyph, not hang.
- **ES's repository staleness after an external apply:** apply a KEEP BOTH, open the savestate manager without relaunching; if ghost slots appear, the apply must force a refresh. (`SaveStateRepository::refresh` exists; the manager's refresh trigger is a corpus gap — §14.)
- **Same-second dated-sibling collision between two devices:** part of the race fixture; if real, the sibling name gains the device id.

---

## 11. What must be proven on hardware before any of it is built, in order

**Gate 0 (no hardware).** Repair `tools/cloud-round-trip`. `diff LIBRETRO_CORES` across targets. The `--filter`/`--filter-from` dry run.

**Gate 1 (VM + loopback WebDAV + MinIO).** The cheap counterexamples: exit-upload-overwrites-cloud-head; same-size staged cloud change; disjoint-member unit fork; stale-receipt path reuse; three-pass churn termination; `RCLONEOPTS`-no-allowlist; conflicted-copy exclusion; `*.bak` exclusion. These eliminate wrong designs before any hardware hour is spent.

**Gate 2 (loopback → Dropbox from the H700).** The bisync spike: genuine fork under `none`; same-size edits on WebDAV; rename; deletion; external equalization after a manual resolution; unchanged filter rewrite vs actual change; interruption and `--recover`/`--resilient`; missing listings; exact pre/post names and bytes. Dry-run **and** real disposable writes.

**Gate 3 (H700).** The session-zombie reproducer on shipped code: startup sync on; boot; launch from a numbered slot inside the boot window; let the boot sync finish; exit; inventory the remote for `.bak`, the zombie auto, the extra slot; then boot-restore and observe the resume point. This characterizes the shipped loss precisely and justifies the lifecycle gate.

**Gate 4 (H700 or VM-with-ES).** ES primitive failure paths: auto-only repository → −99 observed; `copyToSlot` against an unwritable destination → reported success vs actual bytes; the ops-journal hook fires on renumber and on manager delete; repository staleness after an external apply.

**Gate 5 (H700).** Capture and the lifecycle gate: offline capture, lock-skipped capture, boot-overlap capture; manifest verified against planted states (sha256 equality, `core_build` from the pins file, honest `unknown`).

**Gate 6 (bench).** #19: same-chipset control, then cross-chipset, then core-version, then loud/silent. Gates the badge only.

**Gate 7 (two H700s).** The race fixture with `--backup-dir` (both heads preserved: one canonical, one siblinged; kill after each destructive stage) and the churn-termination and delete-propagation fixtures end-to-end.

**Gate 8 (maintainer's library).** The shadow census: the detector runs log-only; outputs fork rate per kind, verdict distribution, unknown rate, and the exit-path cost in spawns, round trips, and seconds (the D-CLOUD-035 pricing). A verdict-table bug is defined: any pass whose verdict would have overwritten or deleted a unique byte sequence. Shadow runs preserve their inputs.

**Gate 9 (RG351M).** The 480×320 recognition test with real thumbnails; the wizard press-through; `tools/vm-visual-qa` frames at 480×320 and 640×480 as the AC evidence.

---

## 12. What is not being built

- `gpt-revised_plan.md`'s protected publication batch and resolution receipts (V2, with the named trigger of §5.2) — two-phase commit machinery the one-player model does not earn on a 5-second path.
- A separate apply journal beyond the frozen plan with per-unit status.
- The full staging mirror as a default mode; separate manifest-copy spawns.
- Semantic binary merging; vector clocks; a shared database; a SQLite history index; a daemon.
- A 99-slot product cap to work around the allocator defect.
- Permanent loser memory as automatic authority — a deliberately restored file is a new version, not a stigmatized one.
- Tombstones for hypothetical external writers — receipts cover **our** recorded operations only.
- A kid/kiosk-mode resolver.
- Progress heuristics that select a winner.

---

## 13. Build order

Repair the harness (gate 0) → counterexamples (gate 1) → bisync spike (gate 2) → zombie reproducer (gate 3) → ES primitives (gate 4) → capture + gate (gate 5) → #19 bench (gate 6) → race + churn fixtures (gate 7) → shadow census (gate 8) → 480×320 (gate 9). Then: **#21 (capture) → #22 (engine: classifier, passes, receipts, transport) → #24 (checked adapter) → #23 (wizard) → #10's futro → #25's futro.** The day-one filings of §8 proceed in parallel; they are not the milestone's baggage but its bycatch.

---

## 14. `corpus.provenance.json`

```json
{
  "artifact": "kimi-round2-revised-approach.md",
  "role": "council member, round-2 revised approach",
  "corpus_mode": "verbatim embedded sources supplied by the Council Facilitator (council-facilitator@1.2.0)",
  "facilitator_manifest_read_timestamp_utc": "2026-09-05T17:32:51Z",
  "member_filesystem_access": false,
  "member_rehashed_sources": false,
  "member_executed_hardware_or_tool_tests": false,
  "hash_basis": "sha256 values are those declared verified at embed time by the Facilitator; not recomputed by this member",
  "own_round1_revision_embedded": false,
  "own_round1_revision_engaged_via": "quotations in the four injected peer reviews (F1-F9, H1-H8)",
  "reviewed_artifacts": [
    "claude_peer_review-r2.md",
    "gemini_peer_review-r2.md",
    "gpt_peer_review-r2.md",
    "mistral_peer_review-r2.md"
  ],
  "reviewed_artifact_hashes_provided": false,
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
  "missing_sources_needed": [
    "rclone 1.75.0 bisync documentation or source (every bisync behaviour claim is a hypothesis until this or the spike exists)",
    "emulationstation-next SaveState.h (the makeStateFilename default), GuiSaveState.cpp (the delete/renumber call site the ops journal must hook), Paths.cpp (the hard-coded savestates root)",
    "ROCKNIX setsettings.sh and the shipped retroarch.cfg / es_systems.cfg (RetroArch's savestate_directory; the two-consumer layout question; savestate_auto_save)",
    "docs/es-ui-style-guide.md (the house rules the IA cites for dimmed controls)",
    "cloud_sync.conf.defaults and cloud_sync-rules.txt.defaults (the user-rules-first merge cannot be fully reasoned about without them)",
    "cloud_content_backup, cloud_content_restore, cloud_setup, backuptool, tools/cloud-test-backend (the changelog's cross-tier claims cannot be checked without them)",
    "unambiguous current issue bodies for #9, #10, #21, #22, #23, #35 with the futro's added ACs (the exports do not distinguish body from first comment)",
    "kimi-revised_plan.md (this member's own round-1 revision) and the four revised plans under review"
  ],
  "missing_source_paths_and_hashes": "not supplied by the Facilitator; none fabricated"
}
```