# Round 2 — peer review of the four revised approaches

**Reviewer:** the fifth council member. **Corpus:** the 42 embedded sources, read at embed time; cited by declared path (shortened in prose to the part after `_sources/`) with the Facilitator's sha256 values recorded in `corpus.provenance.json` at the end. I did not re-read or re-hash anything, and nothing below is a hardware result. Plans are referred to by filename only.

---

## 0. Where the four plans have converged, and whether the convergence is earned

Eleven points are now held by all four plans. I list them because a builder should treat them as the council's position, and because two of them are *not yet* settled by evidence even though nobody disputes them.

| Converged position | Held by | Is it settled by the corpus, or by agreement? |
|---|---|---|
| The manifest three-way test (L, C, A — `repo/docs/save-manifest-schema.md` §3) is the classifier; bisync is demoted to a candidate transport engine pending the spike | all four | **By argument, not by evidence.** No register row made bisync the detector (I re-read all of `repo/docs/decision-register.md`: D-CLOUD-024 cites IA rev 4 as "implementation-ready design", nothing more). But the maintainer listed bisync detection as the approach under judgement in `00-problem-statement.md`, so this is an amendment to be argued to the maintainer, not "just body edits". The spike-independent argument (`kimi-revised_plan.md` F3a: nothing writes bisync's listing state after a manual wizard apply) is the strongest one and is still a hypothesis. The spike must run. |
| Capture (#21) runs regardless of network, lock, or the game-exit setting | all four | **Settled.** `es/FileData.cpp.launchGame-excerpt` gates the sync on `cloudsaves.gameexit`, the binary's presence and `!ThreadedCloudSync::isRunning()`; `cloud_backup` exits 4 in `check_network_link` before `load_config`. Capture inside either gate misses exactly the offline sessions that manufacture forks. |
| `getNextFreeSlot()` returns −99 for an auto-only repository; `copyToSlot()` reports success unconditionally; a checked adapter replaces raw reuse | all four | **Settled** (verified below, §1 rows 1–2). |
| Shipping `es_savestates.cfg` hard-codes `racommands = false` and defaults `autosave`/`incremental` to false | gemini, gpt, kimi (mistral silent) | **Settled** (`es/SaveStateConfigFile.cpp`). |
| D-CLOUD-029 stands: the `--update` stopgap moves the clobber from exit to boot | all four | **Settled** (`autostart/102-cloud-saves` runs `cloud_restore --update` before `cloud_backup --update`). `mistral-revised_plan.md` §6 labels the row "Replaced" while §3.2 says it "respects D-CLOUD-029" — wording, and the register is append-only; the one-way posture is a toggle, not a row. |
| *Keep discarded saves* defaults ON, bounded | all four | Converged, but IA rev 3 settled OFF and D-CLOUD-024 called rev 4 implementation-ready. `gpt-revised_plan.md` is right that this needs a register row, not a comment. |
| Schema amendments: `origin`, `screenshot_sha256`, a multi-file grouping, a parse-failure rule; agreement scoped to remote + root | all four | Converged; the grouping differs in wording only (§2.11). |
| The new engine never inherits `RCLONEOPTS`/`BACKUPMETHOD`; `--delete-excluded` is shipped and each script strips it independently | all four | **Settled** (`sources/cloud_sync.conf`, both scripts' `load_config`, `cloud_sync_helper` strips only `--verbose`). |
| `tools/cloud-round-trip` must be repaired before it runs, and never against a configured handheld | gemini, gpt, kimi (mistral silent) | **Settled** (§1 row 7). |
| Layout at 480×320 first; real thumbnails on the RG351M | all four | Settled by the IA and #23. |
| #19's bench decides badge severity only (D-CLOUD-025) | all four | Settled. |

The two "by agreement" rows are where a confident error could still survive into the foundation: bisync's actual 1.75.0 behaviour under `--conflict-resolve none`, and whether the first-run/interrupted-run paths can avoid `--resync`. Every plan lists the spike; none should ship code that depends on its outcome either way until it has run.

---

## 1. Load-bearing claims, re-tested against the corpus

| # | Claim | Made by | Verdict |
|---|---|---|---|
| 1 | `getNextFreeSlot()` returns **−99** for an auto-only repository | all | **Confirmed.** `es/SaveStateRepository.cpp::refresh()` leaves `slot = -1` for a file matched by `matchAutoFile` (it sets only `rom`). The vector is non-empty, so the `states.size() == 0 → firstslot` branch is skipped; the 99999→0 scan finds no slot ≥ 0; the function returns −99. Two extra facts the plans under-use: (a) `!isEnabled(game)` also returns −99, and `isEnabled` requires `emulator == "retroarch"` — so KEEP BOTH must be dimmed for every standalone-emulator state (only `gpt-revised_plan.md` AC 8 says so); (b) the function does not refresh the repository. |
| 2 | `copyToSlot()` ignores the copy/rename results | all | **Confirmed** (`es/SaveState.cpp`: two early `return false` checks, then unconditional `return true`). The destination is derived from the *source's* parent via `makeStateFilename(fullPath=true)`; the state call's default argument is in `SaveState.h`, not embedded — `gpt-revised_plan.md` concedes this correctly. `setupSaveState()` passes `makeStateFilename(-1)` straight to `exists()`/`copyFile()`, which implies the default is a full path, but that is inference. |
| 3 | Under `es_savestates.cfg`, `racommands=false`, `autosave`/`incremental` default false, and `setupSaveState()`'s emulator/core rewrite becomes live | gpt, kimi, gemini | **Confirmed.** `es/SaveStateConfigFile.cpp`: `emul->racommands = false;`, `autosave` default `"false"`, `incremental = readXmlValue(...) == "true"`; `Default()` sets all three true. The rewrite in `es/SaveState.cpp` is gated on `!racommands`. |
| 4 | The boot pair runs restore then backup as two commands, backgrounded, gated on `ping google.com` | gpt, kimi, gemini, mistral | **Confirmed** (`autostart/102-cloud-saves`). The backgrounded subshell is what makes the boot-sync-versus-session race real. |
| 5 | The harness overwrites `rclone.conf` before asserting the first remote, never restores it, and false-fails on dated archive names | gpt, kimi, gemini | **Confirmed**, and worse than stated. `tools/cloud-round-trip`: `dev.write(RCLONE_CONF, …)` precedes `first = dev.run("rclone listremotes …")`, so the docstring's guard is vacuous; cleanup restores `CONF` keys but not `RCLONE_CONF`. `sources/cloud_backup` renames an undated archive to `${stamp}-${base}`, so `f"{device_id}/{ARCHIVE_NAME}" in listing` cannot pass and `dev.sha(archive)` after restore is `None` (restore lands under the dated `newest` name). A third: the tar step expects `*-*_BACKUP.tar.gz`, which nothing in the suite creates. `repo/.claude/rules/rclone-cloud-sync.md`'s sentence "The driver refuses if the first remote is not the test one" is not what the embedded driver does. |
| 6 | rclone's exit 3/4 collide with the scripts' reserved 3/4; `ThreadedCloudSync` renders both as SKIPPED; the collided paths *do* stamp; the scripts exit with the saves phase's status only | gpt, kimi | **Confirmed** (`clean_exit ${BACKUP_STATUS}` → `record_last_run`; `report_rclone_error` names 3/4 as directory/file not found; `es/ThreadedCloudSync.cpp` maps 3/4 to the friendly skips). |
| 7 | A non-empty user `RCLONEOPTS` that omits `--filter-from` syncs with **no allowlist** | kimi only | **Confirmed**, and this is the most serious shipped hazard any plan found: `cloud_backup`/`cloud_restore` add `--filter-from` only when `${#filtered_opts[@]} -eq 0`. With it absent, only `--exclude=bios/**` and the backup-folder exclude stand between `/storage/roms` and the cloud. ROMs upload. File it now, independent of the milestone. |
| 8 | User rules precede defaults in the merged rules file, so a defaults-file exclusion is not an unconditional guard | kimi, gpt | **Confirmed** (`sources/cloud_sync_helper`: "User rules go FIRST"). This also undercuts `repo/docs/save-manifest-schema.md` §8's plan for `#25` (`- /savestates/.snapshots/**` ahead of `+ /savestates/**`) — a *defaults* rule cannot promise that. Propagate to #25. |
| 9 | The saves allowlist admits a Dropbox "conflicted copy" `.srm`, and the saves scripts do not exclude it | kimi | **Confirmed** against the embedded `cloud_backup`/`cloud_restore` (no `CONFLICT_EXCLUDES`; those live in the content scripts, not embedded). `repo/docs/cloud-sync-changelog.md` claims artifacts move "in neither direction" — as a claims document it is broader than the embedded saves scripts show. |
| 10 | `*.state*` matches `game.state.auto.bak` and every `.state<N>.png` | kimi (the `*.bak` exclusion) | **Confirmed** (`sources/cloud_sync-rules.txt`). |
| 11 | "Compaction (D-CLOUD-030) is the designed remedy for the session zombie" | **kimi F1** | **Overstated.** D-CLOUD-030 compacts "two *slots* of one game holding the same hash". The mid-session `.state.auto` copy is not a slot; only the numbered `mNewSlotFile` (`nextSlot`, highest+1) is, and it is compacted only if it round-trips through the cloud. `gpt-revised_plan.md`'s clarification — compaction never collapses an auto resume point into a numbered slot — is the correct reading. The shipped consequence nobody spelled out: `renameFile(auto → .bak)` preserves the old mtime, `copyFile(slot → auto)` gives the zombie a fresh one; a boot backup mid-session uploads the zombie; `onGameEnded()` restores the real auto with its *old* mtime, which `--recent` never pushes; the next boot's `cloud_restore --update` downloads the zombie over the real resume point, and the `.bak` is re-downloaded forever. That is a concrete data-loss reproducer in the shipped code, cheap to run (`kimi-revised_plan.md` §8.1). |
| 12 | "`--backup-dir` is already in use, so retention's cost is near zero" | gemini §2 | **Partly wrong** — `cloud_backup` adds `--backup-dir` only under `BACKUPMETHOD=sync`. But the idea is the best cheap mechanism in any plan (developed in §2.2). |
| 13 | "List the remote with `lsjson --hash` (or size+mtime on hashless backends)" as the detector | mistral §3.1 | **Inconsistent with its own argument.** Mistral demotes bisync for size-only blindness, then proposes a detector that on the QA WebDAV — which offers *neither* hashes nor modtimes (`repo/docs/save-manifest-alignment-review.md`, D-QA row) — compares by size. That is the #53 shape. Without a download-and-hash step (kimi F3/F4, gpt §4.4) the mistral detector inherits the defect it cites. |
| 14 | The one-way interim posture "preserves both copies of every fork" | mistral §3.2 | **Imprecise.** The exit upload is `copy` with no `--update` and overwrites the cloud copy whenever local differs. The precise guarantee is *no device-local file is ever overwritten*; the cloud copy of another device's fork survives only on that device. `gpt-revised_plan.md` §2 states this correctly. |
| 15 | Discard retention "default 3, per the IA" | kimi, mistral | **Not in corpus.** `repo/docs/conflict-wizard-ia.md` names a count selector and no default. |
| 16 | bisync requires `--resync` after a filter change | mistral (as fact), kimi (as fixture) | **Not in corpus.** Treat as a spike fixture. |
| 17 | `getCore(true)` at the exit point records the launched core | kimi | **Confirmed for the compiled default** (the rewrite is dormant while `racommands` is true). `gpt-revised_plan.md`'s general form — record the launch command's actual `-core` — costs nothing extra if ES passes what it launched, and stays correct after #10. |
| 18 | `renumberSlots()` runs on **every** exit in the compiled default whenever gaps exist | none of the four | **Confirmed** and load-bearing (§2.1): `onGameEnded()` calls it when `config->incremental`, which `Default()` sets true. A sync that brings down a cloud-only higher slot is renumbered at the *next exit*, not the next deletion. |
| 19 | For numbered-slot launches the session's auto state is discarded at exit | gpt §4.3 | **Confirmed** (`removeFile(mAutoFileBackup); renameFile(.bak → auto)`). "The auto state is written on every exit" is false for that launch type; auto-conflict frequency is launch-habit dependent, as `kimi-revised_plan.md` conceded. |
| 20 | D-CLOUD-017 supersedes `repo/docs/savestate-compat-test.md`'s "#10 likely unnecessary" | gpt | **Confirmed.** A clean chipset result narrows the badge; it does not repeal core namespacing. Only gpt says so; lift it. |

---

## 2. The real disagreements, made decidable

### 2.1 Does V1 propagate deletions? — **substantive; decides for intent-recorded receipts (gpt/gemini/mistral), against `kimi-revised_plan.md` F8**

`kimi-revised_plan.md` F8: deletions never propagate in V1; absence where agreement says both had the file → resurrect, logged; mass absence fails closed. `gpt-revised_plan.md` §4.4, `gemini-revised_plan.md` §5.2 and `mistral-revised_plan.md` D-CLOUD-031-D: explicit tombstones/receipts, propagated with a mass-delete guard and retention.

Kimi's position is internally inconsistent with D-CLOUD-030, and the trace that shows it needs no hardware:

1. Device A has `{state0, state1, state2}`. A sync brings down cloud-only `game.state5` (hash H). Agreement for `state5` = H.
2. A launches the game from the manager and exits. `onGameEnded()` → `renumberSlots()` moves `state5 → state3` with its `.png` (row 18 above).
3. Next pass: local `state3` (H), cloud `state5` (H), local `state5` absent, cloud `state3` absent. Move detection re-keys; `state3` is device-only → upload. Cloud now holds `state3` and `state5`, both H.
4. Cloud `state5`: absent locally, agreement says both had it → under F8, **resurrect**. Local now has `state3` and `state5`, both H → D-CLOUD-030 compaction removes local `state5`.
5. Next pass: step 4 again. Forever.

D-CLOUD-030's compaction only terminates if the *cloud* duplicate is retired, which is a deletion in the cloud — precisely what F8 forbids. So the register row the council is bound by already requires a cloud-side removal mechanism; the only question is whether it is inferred from absence (dangerous: card swap, unmounted storage, interrupted layout change) or recorded from intent. The answer is intent: receipts written by (a) ES's delete path, (b) `renumberSlots()`/move, (c) compaction. Absence with no receipt still fails closed exactly as kimi says, so his safety argument survives intact; only "never" does not.

Two conditions make this safe in V1: the propagated operation is a **move into a dated sibling** (`Saves-replaced/<stamp>/…`, the D-CLOUD-014 pattern — verified against the real remote that a sibling is required), never a hard delete; and a per-run cap fails closed on an unexpected deletion set. The delete/edit case is gpt's rule: a receipt for version X retires another unchanged copy of X; if the other side now holds Y, it is a conflict, not permission.

**Decider:** the harness fixture "cloud-only `state5` on a device with `{0,1,2}`; download; launch and exit; sync twice; assert one copy of H on each side, no churn, the retired cloud copy present in the dated sibling." And a second: "delete the highest slot on A; sync; sync B; assert B's copy is moved aside, not resurrected."

A corollary none of the four decided: `repo/docs/save-manifest-schema.md` §3 says "the rule in #24 says which path wins" for a move, and #24 has not said. Propose the row now: *for a savestate, the device's renumbered path is canonical and the cloud's old path is retired by receipt* — otherwise every sync-introduced gap is a churn generator.

### 2.2 Concurrency: protected publications vs recheck-and-preserve — **substantive; decides for `kimi-revised_plan.md` F9 strengthened by `gemini-revised_plan.md`'s `--backup-dir`, against `gpt-revised_plan.md` §4.7 for this drop**

gpt's §4.7 is the deepest treatment of the two-writer race in any plan and its trace is correct: two devices from base X; B publishes B; A, having observed X, replaces canonical with A; B later sees local B, agreed B, cloud A → "cloud changed → download" and B's progress is gone. Kimi's F9 recheck-before-overwrite narrows the window to one round trip but does not close it, and F9(2) protects the *remote* preimage only; the silent download that overwrites B's local copy is not covered.

gpt's remedy — per-changed-unit protected publication, receipt, cloud-preimage preservation and verification on the same remote — is machinery the problem does not earn under "one player, many devices, never concurrent". gpt itself prices it honestly (a changed unit can require an evidence read, a publication batch, the canonical transfer and verification; hashless backends add downloads) against a path where one save already costs ~7 s, "most of it Dropbox's commit" (`repo/.claude/rules/rclone-cloud-sync.md`).

There is a cheaper mechanism that gives the recoverability guarantee gpt actually states ("overlapping writers may leave multiple recoverable heads; they must not erase the only copy of a competing head") without new protocol: **rclone's `--backup-dir` on every transfer the engine performs, in both directions.** For uploads, `--backup-dir remote:<SYNCPATH>-replaced/<stamp>` moves the cloud preimage aside server-side inside the same spawn (D-CLOUD-014's own precedent). For downloads, `--backup-dir /storage/.cache/cloud_sync/discarded/<stamp>` moves the local preimage aside by rename inside the same spawn. Zero extra spawns, zero extra round trips, and it covers the race in both orderings: whichever device loses, its head is in a dated sibling. Then:

- kimi's F9(2) "never overwrite without holding the bytes" is satisfied structurally;
- *keep discarded saves* becomes a retention count over the same local sibling, which unifies it with #25's precursor as the IA asked ("build it once");
- gpt's resolution receipts (anti-ping-pong) become V2 — under the three-way test the ordinary post-resolution case is "cloud changed → download", not a re-ask; a re-ask arises only when the other device never agreed, and re-asking is not destructive.

**Deciders:** gpt's own Gate 5 cost measurement (one changed SRAM, one changed state, five manifests, cold/warm), and the two-H700 race with a kill after each destructive stage — pass condition "both heads present, one canonical, one in a dated sibling". State the residual honestly (kimi F9(4)): no compare-and-swap on arbitrary backends; a lost race is *recoverable*, not prevented.

### 2.3 How C's bytes are obtained — **substantive on cost; decides for candidate-scoped reads (gpt) with kimi's full stage as a fallback mode**

`kimi-revised_plan.md` F3 mirrors the whole remote saves tree into `/storage/.cache/cloud_sync/stage/` every full pass and hashes both trees; "one mechanism, four consumers" (wizard screenshots, KEEP BOTH source, discard source, upload certification). `gpt-revised_plan.md` §4.4 reads and hashes only the units a decision depends on.

Kimi's advantage is real only on a backend offering neither hash nor modtime — i.e. the QA WebDAV, which real players do not have (Dropbox/Drive/OneDrive carry modtimes; S3/B2 carry hashes). Its cost is a second copy of the save library on the card (PSX/N64 states are megabytes each, uncompressed or not) and a hash pass over two trees on an A53 every boot and menu pass; kimi concedes the same-size blind spot remains on WebDAV anyway. The four consumers only ever need the *conflicted* paths.

So: stage candidates only (paths where L≠C by whatever the backend offers, plus every path the wizard will show), and fall back to a full content stage only when the backend's features report no usable hash *and* no modtime. Kimi's mechanism survives as the fallback mode; the default pays nothing extra. **Decider:** shadow-mode cost on the maintainer's real library (kimi H7).

### 2.4 #10's per-core directories: defer past the wizard (kimi) or keep with proof gates (gpt) — **substantive; decides for deferral, with gpt's gates lifted into #10's own futro**

Row 3 shows that "a config change" (D-CLOUD-017's original framing) is a launch-behaviour migration: `racommands`, `autosave`, `incremental`, the core rewrite, and RetroArch's `savestate_directory` (two consumers, one layout — `repo/docs/save-manifest-alignment-review.md` §3.2). The wizard does not need the directory: `core` is a field, the three-way test and the badge work on a flat layout, and D-CLOUD-017's "warn, do not block" already covers a cross-core pair presented as a conflict. Kimi's framing — "key on core, build as data" stands; directory materialisation is an implementation refinement recorded as a new row citing D-CLOUD-017 — is compatible with the append-only register. gpt's six proof obligations (`gpt-revised_plan.md` §4.10) are exactly the futro #10 then needs. `gemini-revised_plan.md` §6.2's one-line "launch behaviour rehearsal" is the same experiment named shorter.

### 2.5 Manifest transport — **substantive on budget; decides for filters in the existing spawns, not separate copies**

`kimi-revised_plan.md` F2's transport rule excludes `.rocknix/**` from tree transfers and moves manifests by explicit single-file copy. The hazard it prevents is real and gpt names it too (a cached foreign manifest republished over its producer's newer copy; and — worse, unnamed by both — the plain download of the *own* manifest from the cloud overwriting entries captured locally since). But a separate copy is another rclone spawn (~1 s, `rclone-cloud-sync.md`) on the watched path, against the alignment review's D-CLOUD-028 row that the manifest "adds no rclone spawn". Both halves can be filters inside the existing transfers: downloads exclude `/savestates/.rocknix/manifest-<own>.json`; uploads include only that file under `.rocknix/`. Foreign manifests may then sit in the tree as harmless read-only caches, and the reflash bootstrap (gpt's case: a reflashed device finds its own previous manifest in the cloud) is a first-run special case, not a transport rule.

**Decider:** one dry run, because the corpus verified only that `--include/--exclude` precede `--filter-from`; the relative order of `--filter` and `--filter-from` is not established. If `--filter` cannot be ordered ahead, use `--exclude`/`--include`, which can.

### 2.6 Where the discard store lives — **substantive; decides for outside the sync tree (kimi), against `mistral-revised_plan.md` §3.5**

Mistral puts it under `savestates/.discards/` with a defaults rule ahead of `+ /savestates/**`. Row 8 shows a defaults rule is not a boundary. Kimi's `/storage/.cache/cloud_sync/discarded/` needs no rule and — with §2.2 — is simply the local `--backup-dir`. One caveat kimi does not state: `repo/docs/conflict-wizard-ia.md` describes `/storage/.cache/` as state that "can be regenerated", and discarded saves cannot; the convention is bent, acceptably, because `.cache` survives updates and `agreed.json` already lives there. If anything ever must live inside the tree, name it without a save extension and exclude it on the command line, not in the defaults file.

### 2.7 How the wizard is triggered, and kid/kiosk mode — **substantive; decides for queue-and-badge (kimi F7.4, gpt §4.11) and gpt's kid-mode rule over mistral's**

IA rev 4 says "a sync that reports conflicts opens the wizard". The boot sync is a detached shell with output to `/dev/null`; it has no way to open anything. The exit sync is watched by a player who just finished a game; a wizard over that moment is the "prompt as failure mode" the repo's own rule warns against. Kimi's queue (state file + a `GAME SETTINGS > CLOUD SETTINGS` row "N SAVE CONFLICTS TO RESOLVE", with the sync card saying so) and gpt's "persistent pending/result record ES consumes on its UI thread" are the same design; it is an IA rev 5 item to put before the maintainer, not a row.

`mistral-revised_plan.md` gate 5 wants the wizard *reachable* in kid/kiosk mode; `gpt-revised_plan.md` wants saves preserved and a persistent "needs attention" state, with resolution possibly requiring the full UI. `repo/docs/es-menu-map.md` collapses the entire full-UI block in kid mode. A kid resolving save conflicts destructively is what kid mode exists to prevent; gpt is right, and the queue design makes it safe by construction because nothing destructive happens until someone with the full UI chooses.

### 2.8 Interrupted apply: a transaction journal (gpt §4.8) or re-detection — **decides for "the frozen plan file is the journal"**

gpt's V1 journal (per-unit expected inputs, destinations, preimages, stages, outstanding agreement updates, not rotated with the audit log) is more than the problem needs *if* the apply follows two disciplines: every unit is written to a temp name and renamed into place (PNG before state; a multi-file container into a temp directory renamed whole), and agreement is written last, per unit. Then an interruption leaves each unit either old or new, `screenshot_sha256` catches a mismatched pair, and the next pass re-detects the unapplied remainder as conflicts and asks again. What that loses is only the done page's accurate "what was applied" after a crash — which the frozen plan (already needed to bind decisions to operand hashes, gpt §4.5 step 3) provides if it carries a per-unit status. Build one thing.

Lift gpt's cancellation sentence verbatim into IA rev 5, because the rev 4 promise ("quitting partway leaves both sides exactly as they were") is literally false once the pre-pass has run:

> Before COMPLETE, no conflicting save or its dependent files are changed on either side. Quitting discards the pending decisions. Independently reconciled files from the completed pre-pass remain synced.

### 2.9 `BACKUPPATH ≠ RESTOREPATH` — **wording-plus; decides for gpt's framing**

Kimi fails closed (no transfers at all); gpt treats a different restore root as an import destination that never writes agreement. `sources/cloud_sync.conf` documents the split as a *feature* ("will prevent data from being replaced on restore"), so refusing the DOWNLOAD row entirely removes something shipped. The two-way engine refuses; a plain one-way copy into the alternate root, with no agreement written, is what that feature always was.

### 2.10 Multi-file saves — **wording**

`group` key (kimi), `group_id` (gemini), `container` kind (mistral), "complete member set and member hashes" (gpt). With entries keyed by path and a shared group label, the member set is derivable from the union of manifests plus a directory scan; an ungrouped file inside a grouped directory makes the unit incomplete → conservative. gpt's `rom: null` for shared containers (VMU, memcards) is the one field-level point the others should adopt verbatim. gpt's experiment — does *loading a state* rewrite SRAM, making a state and a `.srm` a cross-unit dependency? — is the sharpest unasked question about grouping; run it on disposable data.

### 2.11 Agreement on observed equality — **converged; note the consequence**

Kimi F3 row 1 and gpt §4.2 both write agreement when L = C is verified with no transfer. This is correct and closes the first-run/reflash false-conflict loop. It also means the first full pass after cutover hashes every local save (tens of KB each; `sha256sum` is busybox) — price it once, on the maintainer's library, before deciding whether it runs at boot or from the menu.

---

## 3. What each plan uniquely has (liftable as written)

**`gemini-revised_plan.md`**
- The one-sentence D-CLOUD-029 confirmation any register note can carry: *"My proposal merely moved the clobber from game-exit to boot."*
- The seed of the cheapest safety mechanism in the whole deliberation (§2.2): retention via rclone's `--backup-dir`. Gemini states it loosely ("already in use"); developed, it replaces gpt's publication protocol, unifies *keep discarded saves* with #25's precursor, and costs no spawn.
- Its §4.C names both mid-session artifacts in one line (`.state.auto.bak` and the provisional slot) — the shortest correct statement of what the boot-versus-session reproducer must look for.

Plainly: little else in this plan is irreplaceable; it is a well-disciplined set of concessions and adoptions.

**`gpt-revised_plan.md`**
- The D-CLOUD-030 clarification (compaction concerns numbered states in one game/core repository, idle, after verified copies; never collapses auto into a slot; equal bytes do not prove a move).
- The eight #24 acceptance criteria in §4.6 — the most complete statement of the merge contract; and "do not introduce a 99-slot product cap to work around an allocator defect".
- The cancellation sentence (§2.8 above).
- The save-lifecycle gate distinct from the cloud lock, with the requirement that acquisition order be specified so capture cannot deadlock behind a network worker (§4.9). Everyone else says "serialise against gameplay" without a mechanism.
- Typed outcomes replacing overloaded exit codes (§4.11), and the kid/kiosk rule.
- The reflash case: a device regenerates the same `cloud_device_id` (`sources/cloud_device_id` seeds from the permanent address) and finds its own previous manifest in the cloud.
- "Does loading a state rewrite SRAM?" and "no default route ≠ no reachable LAN remote" — two experiments no one else has.
- D-CLOUD-017 superseding the compat test's "#10 likely unnecessary".
- The corpus-gaps list (§6 below draws on it).

**`kimi-revised_plan.md`**
- The `RCLONEOPTS`-without-`--filter-from` hazard (row 7) — a shipped ROM-upload path.
- Manifest write discipline: never rewrite to bump `generated_at`; otherwise every exit pass pushes 20 KB and the round-trip's "nothing to transfer" step fails.
- The `*.bak` exclusion and the transient-file reproducer as gate 1.
- Conflicts queue via a badge row; the headless handoff is a state file, never an exit code.
- The screenshots-tier recency exception stated as an exception.
- The identity-collision rule for cloned cards.
- The ordered hardware gates with a *defined* shadow census (what counts as a verdict-table bug) and the H1–H8 hypothesis list — the only plan that separates "what we believe" from "what we measured" in a form a builder can tick.
- The "checked and not adopted" section — the discipline of naming the peer claims it verified and rejected.

**`mistral-revised_plan.md`**
- The out-of-scope fence with reasons: occurrence identifiers not warranted ("hook the move operations instead"), launch-time resolution V2, audit-log tamper-proofing is theatre. A builder needs the fence as much as the plan.
- The direct correction to IA text that should land in rev 5: the IA's "checked, not assumed" paragraph is wrong about `getNextFreeSlot()` for the auto-only case, and its slot-exhaustion sentence, while true about 99999, hides the −99 defect.
- The experiment → owner-issue table shape.

---

## 4. What should not be built

- **`gpt-revised_plan.md` §4.7** protected publications, receipts and remote preimage protocol (§2.2). Recoverability is the right guarantee; `--backup-dir` delivers it inside existing spawns.
- **`gpt-revised_plan.md` §4.8** as a separate journal (§2.8). The frozen plan with per-unit status is the journal.
- **`gpt-revised_plan.md` §4.1**'s four-class universe as machinery. The *distinction* is right (payload, control, screenshots, transients); the implementation is a filter set and a grouping table, not a classifier.
- **`kimi-revised_plan.md` F3**'s full staging mirror as the default mode (§2.3); and F2's separate manifest copies (§2.5).
- **`kimi-revised_plan.md` F8**'s "never propagate" — not over-engineering but under-engineering that D-CLOUD-030 already contradicts (§2.1).
- **`mistral-revised_plan.md` §3.5**'s in-tree discard store with a defaults rule (§2.6), and its detector without a content read (row 13).
- **Resolution receipts / anti-ping-pong** (gpt §4.7, adopted from a review) — V2.
- **SQLite history index** — every plan says no; say so in #20 and close it.
- **A `remote_hash` populated by a post-upload listing** (`repo/docs/save-manifest-schema.md` §6 as written) — a second spawn on the watched path. Populate it lazily from the next natural full-pass listing (gpt: "store post-transfer observations locally and publish later"); kimi's H2 (`rclone hashsum dropbox` locally) is a nice experiment, not a dependency.

---

## 5. Which plan I would build from, and what I would take first

**Build from `kimi-revised_plan.md`.** It is the most complete, its register changes are explicit and correctly scoped to append-only refinements, its treatment of the shipped scripts found the most serious live hazards, and its hardware gates are ordered and defined. Before building, change and lift:

1. **Replace F8** with intent-recorded receipts (ES delete, renumber/move, compaction) propagated as moves into dated siblings, capped; keep "unexplained absence fails closed" (§2.1). Add the move-path register row.
2. **Narrow F1**: compaction covers numbered zombies only; exclude `*.bak` (already there); name the shipped boot-sync reproducer as a data-loss case, not clutter (row 11).
3. **Strengthen F9 with `--backup-dir` in both directions**, making *keep discarded saves* a retention count over the local sibling (§2.2). Add the byte budget from gpt.
4. **Scope F3's stage to candidates** with full-stage as the no-hash-no-modtime fallback (§2.3).
5. **Replace F2's transport rule** with in-spawn filters, after the one dry run (§2.5).
6. **Lift from gpt**: the D-CLOUD-030 clarification; the eight #24 ACs (especially AC 8: standalone states never allocate); the cancellation sentence; the lifecycle gate with acquisition order; typed outcomes; the kid-mode rule; the reflash bootstrap; the SRAM-rewrite and LAN-route experiments; the D-CLOUD-017/compat-test note.
7. **Lift from mistral**: the out-of-scope fence and the IA-text corrections into rev 5.
8. **Adopt gpt's import framing** for `BACKUPPATH ≠ RESTOREPATH` (§2.9).
9. **Take kimi's #10 deferral** and put gpt's §4.10 obligations in #10's futro (§2.4).
10. **File now, outside the milestone**: row 7 (no allowlist), row 6 (exit-code collision and saves-phase-only status), row 5 (harness), row 9 (conflicted copies in the saves tier), row 11 (`.bak` upload), and the `ping google.com` liveness (#7).

**Where the plans changed my mind since my own revision.** Three places. I had treated D-CLOUD-030's compaction as the remedy for the mid-session zombie; gpt's clarification and re-reading `onGameEnded()` show it covers only the numbered copy, and the shipped `--update` path turns the auto copy into a resume-point loss. I had leaned to "no V1 deletion"; the renumber trace in §2.1 — which none of the four ran but which their positions forced me to run — shows D-CLOUD-030 cannot terminate without a cloud-side retirement, so intent-recorded receipts are load-bearing, not optional. And gpt's insistence that a pre-upload check "cannot provide that guarantee" was right in its diagnosis and over-built in its remedy; it is what made me look for a mechanism that preserves both heads for free, which gemini had half-named.

---

## 6. Corpus gaps to surface to the orchestrator

Not embedded, and load-bearing for claims above (no paths or hashes invented):

- **rclone 1.75.0 bisync documentation or source** — every bisync claim in all four plans is a hypothesis until this or the spike exists.
- **`SaveState.h`** (the `makeStateFilename` default), **`GuiSaveState.cpp`** (the delete/renumber call site any deletion receipt must hook), **`Paths.cpp`** (the hard-coded savestates root cited by the alignment review).
- **`setsettings.sh`** and the shipped `retroarch.cfg`/`es_systems.cfg` (RetroArch's `savestate_directory`, `savestate_auto_save`; the two-consumer layout question).
- **`docs/es-ui-style-guide.md`** (the IA doc's house rules for dimmed controls; #23's layout work cites it).
- **`cloud_sync.conf.defaults` / `cloud_sync-rules.txt.defaults`**, and **`cloud_content_backup` / `cloud_content_restore` / `cloud_setup` / `backuptool` / `tools/cloud-test-backend`** — the changelog's cross-tier claims (row 9) cannot be checked without them.
- **Unambiguous current issue bodies** — the exports do not distinguish body from first comment, so "ACs added in §5" (`repo/plans/conflict-resolution/vita-style-conflict-resolution.md`) cannot be independently confirmed.

---

## `corpus.provenance.json`

```json
{
  "artifact": "round2-peer-review.md",
  "role": "council member, round 2 peer review",
  "corpus_mode": "verbatim embedded sources supplied by the Council Facilitator (council-facilitator@1.2.0)",
  "facilitator_manifest_read_timestamp_utc": "2026-09-05T17:32:51Z",
  "member_filesystem_access": false,
  "member_rehashed_sources": false,
  "member_executed_hardware_or_tool_tests": false,
  "hash_basis": "sha256 values are those declared verified at embed time by the Facilitator; not recomputed by this member",
  "reviewed_plans": [
    "gemini-revised_plan.md",
    "gpt-revised_plan.md",
    "kimi-revised_plan.md",
    "mistral-revised_plan.md"
  ],
  "reviewed_plan_hashes_provided": false,
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
    "rclone 1.75.0 bisync documentation or source",
    "emulationstation-next SaveState.h, GuiSaveState.cpp, Paths.cpp",
    "ROCKNIX setsettings.sh and the shipped retroarch.cfg / es_systems.cfg",
    "docs/es-ui-style-guide.md",
    "cloud_sync.conf.defaults and cloud_sync-rules.txt.defaults",
    "cloud_content_backup, cloud_content_restore, cloud_setup, backuptool, tools/cloud-test-backend",
    "unambiguous current issue bodies for #10, #21, #22, #23, #35 with the futro's added ACs"
  ],
  "missing_source_paths_and_hashes": "not supplied by the Facilitator; none fabricated"
}
```