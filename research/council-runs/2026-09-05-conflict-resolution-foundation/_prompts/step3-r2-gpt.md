# Council — round 2, revised approach

You are one of five council members. You have each produced a revised approach
to the foundation for cloud-save conflict resolution in ROCKNIX, and the other
four have now reviewed all of them. The corpus is embedded above, unchanged and
hash-verified; those four reviews are injected below.

Now produce **your round-2 revised approach**: the foundation you would
actually build, having heard this second round of critique. This is the artifact
the council votes on next, so it must stand on its own — a reader should be able
to act on it without having read any analysis, review, or earlier revision.

## Anti-self-citation constraint

Reason about the substance on its merits, against the embedded corpus. Do not
treat the injected reviews as evidence about how councils, models, or this
deliberation behave.

## What this revision must do

The first revision closed the easy distance. What remains are the places where
the plans genuinely disagree, and the places where all four agree without the
corpus having settled the point. Both are dangerous, and this round exists to
deal with them rather than to polish prose.

- **Settle, do not average.** Where the reviews identified a substantive
  disagreement, take a position and give the reason. If the evidence does not
  yet exist, say which experiment settles it and what your plan does in the
  meantime under each outcome. Do not adopt a compromise that no reviewer
  argued for.
- **Separate what the corpus settles from what the council merely agrees on.**
  A position held by everyone and evidenced by nobody is the most expensive
  kind of error, because no reviewer is left to catch it. Mark those explicitly.
- **Concede what was refuted**, naming the reviewer and the file, and correct
  it. A revision that quietly drops a refuted claim is worse than one that owns
  it. Where a review misread you, say so and make the argument better.
- **Adopt what others got right**, crediting them by filename. You are not
  scored on originality.
- **Refuse what the problem does not earn.** This is a handheld running busybox
  with a five-second budget on a path the player watches. Where a reviewer or a
  plan proposes machinery beyond that, say so and cut it.
- **Keep the load-bearing separable from the optional.** Get the load-bearing
  parts wrong and the milestone is unsafe; the rest can follow later. Make the
  boundary explicit.
- **State decision changes explicitly.** If your approach requires reopening a
  decided register row, name the ID, state the change as a new refinement
  citing the old row, and give the argument. If it needs no reopening, say so.
- **Be honest about what is still unmeasured**, and name the experiment that
  settles each hypothesis about rclone, bisync, RetroArch, a backend, or the
  hardware.

Refer to members and artifacts by filename (for example `gpt-analysis.md`,
`kimi_peer_review-r2.md`), never by an invented ordinal.

## Injected peer reviews

=== START claude_peer_review-r2.md ===

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

=== END claude_peer_review-r2.md ===

=== START gemini_peer_review-r2.md ===

This round has successfully stress-tested the foundation. The revisions agree on the core architecture: **bisync is demoted, detection is a manifest-based three-way reconcile, and the ES merge primitives require a checked adapter.** 

However, the plans diverge significantly on how to handle concurrency, deletions, and the detection substrate. Below is the adjudication of those disagreements, the verification of the load-bearing claims, and the final synthesis.

### 1. The Real Disagreements (and how to settle them)

**Concurrency and Cross-Device Races**
* **The Disagreement:** `gpt-revised_plan.md` demands a custom two-phase commit (a "protected publication batch" that seals bytes, publishes a uniquely named copy, and associates it with a receipt before canonical replacement). `claude-revised_plan.md` and `kimi-revised_plan.md` rely on rclone's native `--backup-dir` to archive overwritten files.
* **Settlement:** GPT's approach is over-engineering for a busybox environment with a 5-second budget. `rclone copy --backup-dir` natively moves the existing remote file aside before overwriting it. If Device A overwrites Device B's upload, B's bytes are safely archived in the dated backup directory. This satisfies the requirement to preserve competing publications without building a custom transaction journal. Claude and Kimi win here.

**Deletion Propagation**
* **The Disagreement:** `claude-revised_plan.md` wants to propagate deletions using tombstones hooked into the ES delete path. `gpt-revised_plan.md` wants explicit operation receipts. `kimi-revised_plan.md` argues that deletions should *never* propagate in V1 (absence = resurrect).
* **Settlement:** Kimi is right. Hooking the ES delete path (which isn't fully embedded in this corpus) to write tombstones is too fragile for V1. Resurrecting a deleted save is a minor annoyance; losing a save to a false tombstone (e.g., an unmounted SD card or an emulator's temporary rename) violates the cardinal rule. V1 must fail closed on absence.

**Detection Substrate (Staging vs. Hash)**
* **The Disagreement:** `kimi-revised_plan.md` proposes a full staging mirror (`rclone copy` the remote tree locally, then hash). `claude-revised_plan.md` proposes `rclone lsjson --hash` with targeted downloads.
* **Settlement:** Claude is right. Kimi's staging mirror violates the 5-second budget and fails the `#53` size-only trap on WebDAV (an unchanged size means `rclone copy` skips the file, leaving the local hash stale even if the remote bytes changed). Claude's targeted `lsjson --hash` (falling back to download-and-hash only on hashless backends) is the correct budget-conscious approach.

### 2. Testing the Load-Bearing Claims

I verified the following claims against the embedded corpus. A confident error here would break the milestone.

* **`getNextFreeSlot()` returns `-99` for auto-only (GPT, Claude, Kimi):** **Verified.** In `es/SaveStateRepository.cpp`, if only `.state.auto` (slot `-1`) exists, `states.size() == 1`. The `states.size() == 0` early return is bypassed. The loop checks slots `99999` down to `0`, finds nothing, and falls through to return `-99`. Gemini's Step 2 rebuttal was definitively wrong.
* **`copyToSlot()` ignores failures (GPT, Claude, Kimi):** **Verified.** In `es/SaveState.cpp`, the function checks `slot < 0` and source existence, but completely ignores the return values of `renameFile` and `copyFile`. It returns `true` unconditionally, even if the disk is full.
* **`es_savestates.cfg` changes launch behavior (Claude, Kimi):** **Verified.** In `es/SaveStateConfigFile.cpp`, the compiled `Default()` sets `racommands = true`. However, the XML parsing logic hardcodes `racommands = false` and defaults `autosave` and `incremental` to false. Creating this file to satisfy `#10` disables the `.auto` backup and next-slot copy. `#10` must be re-sequenced after the wizard.
* **Manifest transport hazard (Kimi):** **Verified.** If Device B downloads `manifest-A.json`, it sits in `savestates/.rocknix/`. B's next `cloud_backup` will catch it in the `+ /savestates/**` allowlist and upload it, overwriting A's newer manifest with A's older one.
* **`cloud_sync_helper` duplicate check (GPT):** **Verified.** GPT correctly points out that `cloud_sync_helper` (Source 31) does not contain `ASSUME_YES` or `controller_confirm`. The duplicate check logic lives entirely in `cloud_backup` (Source 29) and `cloud_restore` (Source 30). Gemini hallucinated the bug's location.

### 3. What Each Plan Uniquely Has (To Keep)

* **Claude:** **`agreed.json` binding.** Binding the agreement record to the remote name and sync roots is critical. Without this, a user executing `CHANGE CLOUD FOLDER` would apply an old agreement to a new, empty destination, causing the detector to falsely conclude the cloud deleted everything.
* **GPT:** **`makeStateFilename` parent derivation.** GPT caught a massive bug in how we planned to use ES primitives: `makeStateFilename(fullPath=true)` derives the destination from the *source's* parent directory (`es/SaveState.cpp`). If we download a cloud state to a temporary folder and call `copyToSlot()`, it will merge the file into the temporary folder, not the game's save folder. Cloud files must be staged in the actual save directory under a temporary name, or the adapter must compute the destination itself.
* **Kimi:** **Manifest transport rule.** Excluding `.rocknix/**` from the bulk tree transfer and using explicit single-file copies is the only way to prevent the republication of stale foreign manifests (verified above).
* **Mistral:** **Configuration stopgap.** Disabling the boot restore via existing toggles while keeping the exit upload is a zero-code way for the maintainer to stop the newest-wins race immediately during development.

### 4. What Should Not Be Built (Over-engineering)

* **GPT's protected publication batch:** A custom two-phase commit in bash is too complex and unnecessary when `rclone copy --backup-dir` provides atomic-equivalent archiving of overwritten files.
* **Kimi's staging mirror:** Mirroring the entire remote tree locally on every sync is too slow and fails on hashless backends.
* **Claude's tombstones:** Hooking ES delete paths to write tombstones is too fragile for V1.

### 5. Conclusion: Which Plan to Build From

I would build from **`kimi-revised_plan.md`**, heavily amended. 

Kimi's structure—explicit F-numbered load-bearing rules, clear concessions, and the critical manifest transport rule—is the most rigorous foundation. However, I would:
1. **Replace** Kimi's staging mirror (F3) with Claude's `lsjson --hash` detection.
2. **Adopt** GPT's `copyToSlot` staging fix (incorporating it into F6).
3. **Adopt** Claude's `agreed.json` binding (incorporating it into F4).
4. **Keep** Kimi's "no deletion propagation" rule (F8) over Claude's tombstones and GPT's receipts.

This synthesis respects the 5-second budget, closes the ES primitive traps, and safely defers concurrency and deletion complexity to V2.

=== END gemini_peer_review-r2.md ===

=== START kimi_peer_review-r2.md ===

# Round 2 peer review — kimi

I reviewed the four injected revised approaches against the embedded corpus, claim by claim. I am the fifth member (author of `kimi-analysis.md` / `kimi_peer_review.md`); my own revised plan is not in scope here, and I say below where these four changed my mind.

---

## 1. Summary

The four plans have converged on the same foundation: manifest-based content reconciliation as the only writer of the save tree, bisync demoted to a spike, tombstoned deletions, a checked adapter around ES's slot primitives, option hygiene at the transport boundary, unconditional capture, default-on retention, and repair of the round-trip harness before anything else. That convergence is real and earned — each piece traces to a corpus lesson.

The remaining disagreements are few. Two of them are **errors**, not legitimate forks: the "one-way stopgap" in `gemini-revised_plan.md` and `mistral-revised_plan.md` is not lossless, and `mistral-revised_plan.md` states bisync's failure modes as facts the corpus does not establish. One is a genuine scoping fork: `gpt-revised_plan.md`'s protected-publication protocol versus `claude-revised_plan.md`'s archive-and-report posture for concurrent writers. The rest is wording.

I would build from `claude-revised_plan.md`, with specific lifts from `gpt-revised_plan.md`. Reasons and lifts in §7.

---

## 2. Load-bearing claims re-tested against the corpus

### 2.1 Claims that hold

| Claim | Where made | Corpus check |
|---|---|---|
| `getNextFreeSlot()` returns −99 for an auto-only repository (auto state has slot −1; `states.size() == 1`, so the empty-repo early return is not taken; the 99999→0 scan matches nothing) | `gpt-revised_plan.md` §1; `claude-revised_plan.md` §3.6 | **Confirmed** — `es/SaveStateRepository.cpp`. `gemini_peer_review.md`'s earlier rebuttal misread the size check; both revised plans are right that the bug is real. One precision on claude's confirmation experiment: for a *new-game* launch the `-state_slot -99` is swallowed by the `nextSlot > 0` guard in `setupSaveState`; it appears in the command only on the auto-resume and slot-launch paths (`es/SaveState.cpp`). The experiment must launch *from* the auto state. |
| `copyToSlot()` returns true without checking either file operation | `gpt-revised_plan.md`; `claude-revised_plan.md` §3.6 | **Confirmed** — `es/SaveState.cpp`. |
| `getNextFreeSlot()` reads a cached repository; `renumberSlots()` refreshes | both | **Confirmed** — `es/SaveStateRepository.cpp`. |
| Creating `es_savestates.cfg` flips `racommands` to false and defaults `autosave`/`incremental` to false, disabling ES's launch dance and activating the `-emulator`/`-core` rewrite | `claude-revised_plan.md` §3.9; `gpt-revised_plan.md` §4.10 | **Confirmed** — `es/SaveStateConfigFile.cpp` (XML constructor sets `racommands = false` unconditionally; `autosave` default `"false"`; `incremental` default absent) vs. `Default()` (all true); `es/SaveState.cpp` (`!racommands` gate on the rewrite). |
| The boot race: `102-cloud-saves` backgrounds restore+backup behind a ≤60 s ping loop; RetroArch flushes SRAM every 10 s; a mid-session restore is overwritten by the emulator; the exit push (`copy`, no `--update`) then uploads the emulator's copy over the cloud's | `claude-revised_plan.md` §3.7.1; adopted by all | **Confirmed** — `autostart/102-cloud-saves`, `docs/save-manifest-schema.md` §4, `cloud_backup` `--recent` block, `FileData.cpp.launchGame-excerpt`. The changelog's test #5 covers sync-vs-sync only (`docs/cloud-sync-changelog.md`). |
| `.state.auto.bak` matches the allowlist (`+ /**/*.state*`) and neither of ES's regexes | `claude-revised_plan.md` §3.3.5 | **Confirmed** — `cloud_sync-rules.txt`, `es/SaveStateConfigFile.cpp` `SetupRegEx`. |
| `RCLONEOPTS` ships `--delete-excluded`; `cloud_sync_helper` never strips it; both transfer scripts strip it at load; a new consumer inherits it | `claude-revised_plan.md` §3.3.6; `mistral-revised_plan.md` §3.6 | **Confirmed** — `cloud_sync.conf`, `cloud_backup`, `cloud_restore`, `cloud_sync_helper`. |
| User rules are merged *ahead of* the defaults; first match wins; a user `+ /**` defeats any default safety exclusion | `claude-revised_plan.md` §3.3.6; `gpt-revised_plan.md` §4.11 | **Confirmed** — `cloud_sync_helper` (`update_cloud_sync_rules`, comment and code). |
| A non-empty `RCLONEOPTS` without `--filter-from` transfers with no allowlist at all (fallback options only apply when the array is empty) | `claude-revised_plan.md` §3.3.6 | **Confirmed** — `cloud_backup` (`if [ ${#filtered_opts[@]} -gt 0 ]`). |
| rclone's exit 3/4 pass through `clean_exit` and collide with the scripts' own skip codes, which `ThreadedCloudSync` renders as friendly SKIPPED; both mains exit with the saves-phase status only, masking a failed system phase | `gpt-revised_plan.md` §4.11; `claude-revised_plan.md` §3.5.5 | **Confirmed** — `cloud_backup`/`cloud_restore` (`clean_exit ${BACKUP_STATUS}`), `es/ThreadedCloudSync.cpp`. |
| The round-trip harness overwrites `rclone.conf` *before* asserting the remote, never restores it or `SYNCPATH`, and its archive-namespace assertion false-fails on the dated names the uploader now writes | `gpt-revised_plan.md` §1/§6; `claude-revised_plan.md` §7 step 0 | **Confirmed** — `tools/cloud-round-trip` vs. `cloud_backup` (undated archive names get a `stamp-` prefix; the harness's `{device_id}/{ARCHIVE_NAME}` substring can never match). |
| A reflashed device regenerates the same `cloud_device_id` (permanent-address seed), so its *own* manifest is already in the cloud; the alignment review's "none of its own" applies to genuinely new hardware, not reflashes | `claude-revised_plan.md` §3.2 R6 | **Confirmed** — `cloud_device_id`, `docs/save-manifest-alignment-review.md` §2. |
| A stale foreign manifest is republished by the bulk upload (`copy`, no `--update`, `+ /savestates/**` admits every `manifest-*.json`) | `claude-revised_plan.md` §3.2 R7 | **Confirmed** — `cloud_backup`, `cloud_sync-rules.txt`. |
| `cloud_restore` still calls `sleep` directly where `cloud_backup` uses the `--yes`-aware `pause` | `claude-revised_plan.md` §3.10 | **Confirmed** — `cloud_restore` has no `pause()` function. |
| The schema has no deletion rows, no equality-establishes-agreement row, and §9 assigns agreement writes to transfers only | all four | **Confirmed** — `docs/save-manifest-schema.md` §3, §9. |
| `rom` as ES's repository key is the *stem* under `nofileextension = true`, not "file name with extension" as schema §6 glosses it | `claude-revised_plan.md` §3.2 R9 | **Confirmed** — `es/SaveStateRepository.cpp` (`getStem` branch), `es/SaveStateConfigFile.cpp` (default `nofileextension = true`). |
| The QA WebDAV offers no hashes and no modtimes | all four | **Confirmed** — `docs/save-manifest-alignment-review.md` §1 (D-QA rows). |

### 2.2 Claims that fail or are overclaimed

1. **The "one-way stopgap" is not lossless.** `gemini-revised_plan.md` §5.1 and `mistral-revised_plan.md` §3.2/§6 propose disabling the boot pair and SYNC row, keeping only the game-exit upload, and claim "no data is lost" / "preserves both copies of every fork". This is false. The exit upload is `cloud_backup --yes --saves-only --recent`: `BACKUPMETHOD` forced to `copy`, **no `--update`** (`cloud_backup`; futro §4 step 1: it "overwrites the cloud copy whenever the local one differs, even if the cloud's is the newer"). With downloads disabled, the local device never sees the other device's progress — and its exit push overwrites that progress at the cloud. The cardinal-rule violation persists in the upload direction. `gpt-revised_plan.md` §2 says this correctly ("'lossless' is too strong: it can still overwrite a cloud-only version"); `claude-revised_plan.md` quietly dropped the idea after its own Step 1. Notably, gemini and mistral adopted a position its originator abandoned and that a review they cite already refuted. **This must not be built.** D-CLOUD-029 stands as written; the honest interim is gpt's: isolated test storage and disabled auto-sync toggles as a maintainer *operating* choice, not a product change.

2. **`mistral-revised_plan.md` states bisync's failures as established fact.** §1/§3.1: "blind to SRAM changes on hashless backends, demands `--resync` on first runs and filter changes, and its stateful workdir is a corruption hazard." The corpus establishes none of these. The futro poses the `--resync` question as a what-if with a spike to settle it; the workdir at `/storage/.cache/rclone/bisync` is cited as *good* under blindspot 14 (a guard outside what it guards); behaviour on hashless backends is untested. The *conclusion* (manifest-based detector) may well be right, but `claude-revised_plan.md` ([K] markers, contract-first spike) and `gpt-revised_plan.md` ("the corpus does not establish that `--conflict-resolve none` is report-only") handle the epistemics correctly and mistral does not. A foundation document that asserts unmeasured tool behaviour as fact is how this project ships confident mistakes (blindspot 9).

3. **`mistral-revised_plan.md` §3.1's hashless fallback is wrong for the QA backend.** "size+mtime on hashless backends" — the QA WebDAV has *no modtimes* (#53), so the fallback is size-only, which is the exact #53 trap. The corpus-sanctioned fallback is size as pre-check plus sha256 after download (alignment review §1), which claude and gpt both state correctly.

4. **`mistral-revised_plan.md` §5's "wizard must be reachable in kid/kiosk mode"** contradicts the mode's design: kid/kiosk collapses the menu to INFORMATION / UNLOCK / RETROACHIEVEMENTS / QUIT (`docs/es-menu-map.md`), and configuration surfaces deliberately do not exist there. `claude-revised_plan.md` §3.5.6 and `gpt-revised_plan.md` §4.11 have the right shape: non-destructive branches run, divergent items wait (nothing is lost — both sides stay), a needs-attention badge shows in the full UI, resolution requires unlocking. mistral's requirement should be struck.

5. **`mistral-revised_plan.md` §3.5's discard store at `/savestates/.discards/**`** relies on an exclusion rule staying ahead of `+ /savestates/**` — but user rules merge *ahead of* defaults (`cloud_sync_helper`), so a user `+ /**` defeats it, and the store's contents (discarded saves) would sync. `/storage/.cache/cloud_sync/discarded/` (claude §3.7.2, gpt §4.8) is outside the sync tree by construction and outside `backuptool`'s archive — the same reasoning the IA used for `history.db`. Settles to claude/gpt.

6. **`claude-revised_plan.md` §3.4.4's correction of my ping-pong trace understates prevalence.** Claude is right that my original trace's agreement bookkeeping was loose. But the reversal scenario does not *require* B to lack an agreement record: it requires only that both sides resolve for their own copy. A and B share agreement A₀; both diverge; A resolves KEEP-own and uploads H_A; B sees divergent, resolves KEEP-own, uploads H_B; A's next pass sees L=H_A=A, C=H_B — schema row "cloud changed → download" silently reverses A's explicit choice. No reflash, no first run, no missing agreement. That is precisely why the recorded-loser guard (claude's row 4, gpt's resolution receipts) is V1 machinery and not an edge case. The guard is right; the framing "real when B has no agreement record" should read "real whenever two resolutions disagree, which the sequential single-player flow produces unaided".

7. **`claude-revised_plan.md` §3.3.3's "≤ 2 spawns" may undercount by one.** R7 requires the own manifest to go up by an explicit single-file copy with `.rocknix/**` excluded from the bulk upload; the manifest changes exactly when captures change, i.e. on every non-idle exit. Unless the changed-files upload carries the manifest via `--files-from` (filter interaction with the `.rocknix/**` exclusion is [K] — testable in ten minutes), the changed path is ≤ 3 spawns. Small, but the D-CLOUD-028 refinement row should state the real number.

8. **`gpt-revised_plan.md` §4.8's durable transaction journal is borderline over-earned for V1.** With tombstones and claude's apply ordering (audit line → archive/discard-store copy → destructive step, per item), an interrupted apply *converges on re-run*: the next reconcile re-classifies whatever state each unit is actually in, and every row of claude's table is idempotent under re-entry (I walked the crash points: post-download-pre-agreement → row 1 writes A; post-archive-pre-delete → row 9 re-fires; post-delete-pre-clear → row 15 clears). The journal's residual value is resume-without-reclassification, which is real but not obviously worth a second durable store beside the audit log in V1. Keep the ordering rule and the idempotent re-plan; grow the journal if the shadow phase shows a non-converging case.

---

## 3. The real disagreements, and how they settle

### Substantive

**D1 — The interim posture (D-CLOUD-029).** claude/gpt: endorse, no stopgap, accelerate #22. gemini/mistral: the one-way stopgap. *Settled by reading `cloud_backup` and the futro — no experiment needed.* Settles to claude/gpt (§2.2.1). gemini's own concession §1 contains the crispest statement of *why* `--update` on exit is pointless (the boot restore clobbers next boot); that argument is correct and worth keeping, but it argues for claude's "accelerate, don't patch", not for gemini's §5.1.

**D2 — Concurrent-writer machinery.** claude: pre-upload check + `--backup-dir` on every overwrite + audit + anomaly report, manual recovery, honest contract. gpt: protected non-overwriting publications + receipts + competing-heads reader logic, automatic detection. *What settles it:* the project's accepted posture (futro: "Accepted for this drop; the audit log will show if it is violated"), the exit-path budget (gpt's protocol adds a protected upload + receipt + verification per changed save; gpt itself says measure and degrade), and gpt's Gate 4 two-H700 interleaving test. My call: **claude's stack for V1** (the pre-upload check narrows the window to seconds; archival preserves bytes; the anomaly report surfaces it), **gpt's protocol as the designed V2 answer** if the audit shows violations or the feature ships beyond the maintainer. The *receipts* half of gpt's §4.7 (resolution receipts against ping-pong) is not concurrency machinery — the sequential flow produces the reversal unaided (§2.2.6) — and belongs in V1; both plans already have it. If Gate 4 shows `--backup-dir` unhonoured or the anomaly report unactionable on a real backend, I would flip to gpt's protocol for V1.

**D4 — Kid/kiosk behaviour.** Settles to claude/gpt (§2.2.4). Evidence: `docs/es-menu-map.md`'s mode design. No experiment needed.

**D5 — Discard store location.** Settles to claude/gpt (§2.2.5). Evidence: `cloud_sync_helper` merge order.

**D6 — Provenance for merged/imported copies.** claude: provenance looked up by sha256 across the union of manifests. gpt/mistral: an `origin` object carried in the entry. *Substantive, small.* gpt's durability argument is decisive: once the producer overwrites its own path entry, the union no longer contains that version anywhere, and hash-lookup provenance degrades to `unknown` for every device holding a copy — including KEEP BOTH merges, which are the milestone's own feature. Cost is one additive field. **Settles to gpt/mistral; adopt the origin field** (with claude's lookup as the fallback for pre-field versions).

**D7 — Auto-state KEEP BOTH outcome.** gpt states it explicitly: the device resume point stays at `.state.auto`; the cloud version materialises into a numbered slot with its thumbnail. claude's adapter handles the −99 allocation but never says where the cloud auto *goes*. *Settles to gpt's sentence, lifted verbatim into the merge adapter's contract.*

**D10 — Boot-sync mechanism.** claude: boot sync moves into ES (a `ThreadedCloudSync` job after gamelist load; ES refuses launches during save-tree writes). gpt: a save-lifecycle gate shared by launch/session/exit/cloud; a background boot operation may *upload sealed staging* during play but must never restore over live SRAM; boot writes a persistent result record ES consumes. *Substantive in mechanism, convergent in principle.* Settle: **claude's ES-owned scheduling** (a UI-less writer is the root defect; the boot job deserves the card per `es-native-ui.md`'s tiers) **with gpt's gate semantics** (uploads of sealed data during play are safe and keep the exit path cheap; restores, renumbers, compaction and applies are what must be excluded). The boot-race reproducer both plans specify gates the whole thing.

**D11 — The exit push.** claude has the only concrete design (hash the played game's files regardless of mtime; `lsjson --hash --files-from <changed>`; compare against agreed `remote_hash`; upload with `--backup-dir`; defer on mismatch; `--ignore-existing` for never-agreed first saves). gpt is directional ("correctness reads permitted; time window is a scheduling hint"). *Settles to claude's design*, with gpt's caveat that the changed-path cost is a Gate-5 measurement, and with the spawn-count correction from §2.2.7. `lsjson --files-from` support is [K] — add it to the spike.

### Wording only

- **"Reopen" vs "refine" D-CLOUD-031** (gemini says reopen; claude/gpt/mistral say refine/new row citing). The register is append-only; additive fields are refinements by its own rule. Same act, wrong label from gemini.
- **bisync's demotion** is unanimous; only the rhetoric differs (§2.2.2). All four keep the spike. gpt makes the correct procedural point that no register row makes bisync a dependency — it is issue-level (#9/#22 bodies and the IA), so issue bodies and the IA get edited, and no row needs reopening.
- **The wizard trigger channel** (claude's result file + exit 5; gpt's persistent pending/result record) is the same mechanism in two dialects.
- **Capture records the launched core from the command, not `getCore(true)` at exit** — converged; it is a consensus refinement to schema §9's "told not discovered" and should be written into #21's ACs verbatim.

### Converged and worth stating as consensus

Tombstoned deletion with a mass-delete guard and archival; the checked merge adapter (with the −99 fix); option hygiene (never inherit `RCLONEOPTS`/`BACKUPMETHOD`; safety exclusions as `--exclude` flags, proven to fire); unconditional capture; screenshot binding (`screenshot_sha256`); save units with `rom: null` for shared containers; **keep-discarded-saves default ON, bounded** — all four plans against IA rev 4's off-by-default, which is a doc decision, not a register row; this unanimous change should get its own register row; harness repair before any destructive test; #10 as a launch-behaviour migration, with claude's explicit resequencing after the wizard needing the maintainer's sign-off since the problem statement places #10 in the milestone.

---

## 4. What each plan uniquely has

**`claude-revised_plan.md`** — the most operationalized plan, and four elements the others lack that would be real losses:
- **The 15-row amended conflict table** (§3.4). The only complete, checkable verdict logic in the set — tombstone rows, provisional-agreement rows, recorded-loser rows, both-gone row. Liftable verbatim into #22's ACs.
- **The normalised exit-code protocol and result file** (§3.5.5: 0/3/4/5/6/1, rclone's codes to the log, never to the exit), with the rclone 3/4 collision as the evidence. gpt's "typed outcomes" is the same idea unnamed; claude's is implementable.
- **The gated exit push** (§3.3.3) — the only concrete D-CLOUD-028 refinement with a spawn budget.
- **Manifest transport ownership** (R7: `.rocknix/**` excluded from bulk upload, own manifest uploaded explicitly) plus the dual-identity refusal — the stale-manifest-republication hazard is named nowhere else.
- The **ledger** (§8) and the **[V]/[K]/[M] discipline** — every claim is auditable against this corpus; the model for what the built foundation's own comments should look like.

**`gpt-revised_plan.md`** — the most rigorous plan; unique elements:
- **The save-lifecycle gate semantics** (§4.9): uploads of sealed staging may proceed during play; restores/renumbers/compaction/applies may not. More precise than claude's blanket exclusion, and it keeps the exit path cheap.
- **The auto KEEP BOTH outcome** (§4.6) — see D7.
- **Origin-vs-possession with the durability argument** (§4.1) — see D6.
- **"Loading a state can rewrite SRAM"** (§5 row 8) — a cross-unit dependency nobody else names: resolving a *state* conflict can invalidate the *save* that a later flush overwrites. This changes what "independent" means for the pre-pass and belongs in the unit design.
- **The "no default route" false negative** (§6): `check_network_link` requires a *default* route, so a LAN-only remote on the same subnet is wrongly skipped with exit 4. Real, source-visible (`cloud_backup`), and unique to gpt.
- **Mixed-version cutover honesty** (§8): new code cannot prevent an old binary on another device from performing its old overwrite; protected publications must live outside the legacy mirror's reach. The only plan that states the cutover's hard boundary.
- **Receipt/tombstone retirement is not the payload count selector** (§4.4) — a handheld offline for a month must not miss a tombstone because a count rolled. claude's "bounded `resolutions`" needs this correction.

**`gemini-revised_plan.md`** — thin, and mostly a subset of the others. Two genuine uniques:
- **The pin that nothing is built yet** (concession: "querying `agreed.json` history is impossible today — the schema header says 'Nothing here is built'"). A useful discipline: every "the detector does X" sentence in all four plans is about unbuilt code, and gemini is the only one that says so.
- **The clean procedural closure of its own D-CLOUD-029 reopen** ("WITHDRAW the D-CLOUD-029 `--update` reopen") — the register-facing framing the question needs, whatever replaces it.
Its §5.1 stopgap is a liability, not a loss if dropped (§2.2.1).

**`mistral-revised_plan.md`** — two uniques worth lifting:
- **The register-ready amendment IDs** (D-CLOUD-031-A through -E). The other plans describe the same fields in prose; mistral's naming is what the register rows will actually look like.
- **The explicit out-of-scope foreclosures** (§7: occurrence identifiers, audit tamper-proofing, launch-time resolution) — the only plan that writes down which tempting machinery was considered and refused, which is exactly the anti-over-engineering record this milestone will need later.
- Its "diff `LIBRETRO_CORES` between targets" is the cheapest form of the absent-core experiment (gpt has the device-side version; both belong in the plan).

---

## 5. What should not be built

1. **The one-way stopgap** (gemini §5.1, mistral §3.2/§6) — unsafe, not merely unearned (§2.2.1).
2. **gpt's protected-publication store in V1** (§4.7's remote area, descriptors, competing-heads reader) — the complete answer to a risk the project has consciously accepted for this drop, at a cost the exit budget likely cannot pay. Keep the receipts; defer the store; claude's `--backup-dir` archival + anomaly report is the proportionate V1. Revisit on Gate-4 evidence.
3. **gpt's full durable transaction journal in V1** (§4.8) — keep the apply ordering and idempotent re-plan; grow the journal only if shadow mode shows a non-converging crash point (§2.2.8).
4. **mistral's in-tree discard store** (§3.5) — wrong placement; use `/storage/.cache/cloud_sync/discarded/`.
5. **mistral's kid-mode reachability requirement** (§5) — contradicts the mode's purpose (§2.2.4).
6. **Any production role for bisync before the spike answers question zero** — all four agree; worth stating as a gate, because #9's body still reads otherwise.

Nothing in `claude-revised_plan.md` is unearned machinery — but it is at the complexity ceiling for a busybox handheld, and its own staging (capture → shadow → exit push → boot/menu → wizard) is the right way to keep that ceiling from becoming the V1 diff.

---

## 6. Where these plans changed my mind

- **gpt's origin-durability argument (§4.1) changed my mind.** I would have relied on union-by-hash provenance (claude's R1). The producer overwriting its own entry silently orphans every imported copy's provenance — including KEEP BOTH merges. One field fixes it; I now think it belongs in the D-CLOUD-031 refinement.
- **gpt's SRAM-rewrite-on-state-load (§5 row 8) changed my mind about unit independence.** I had treated states and saves as separate universes sharing a ROM stem. A state load that rewrites the battery save on the next flush makes them one dependency for pre-pass purposes.
- **gpt's LAN no-default-route finding changed my mind about exit 4's correctness.** I had treated the route check as a clean local answer; it is a heuristic with a false-negative for LAN remotes.
- **claude's correction of my ping-pong trace (§3.4.4) I accept in part** — my agreement bookkeeping was loose — **and push back in part** (§2.2.6): the reversal needs no reflash and no missing agreement, only two disagreeing resolutions, so the guard is more load-bearing than claude's framing says.
- **On concurrency I moved toward claude.** My lost-update trace stands, and gpt's protocol is its only complete answer — but the accepted posture plus the exit budget plus claude's archival stack moved me to "archival + receipts + anomaly report in V1; protected heads in V2". gpt's own degradation clause ("leave reconciliation pending; never call it fully synced; never fall back to an unchecked overwrite") is what makes that split honest.
- The unanimous default-on retention confirms my earlier position; nothing to add beyond noting the consensus.

---

## 7. Which plan I would build from

**Base: `claude-revised_plan.md`.** It is the only plan an implementer could pick up cold: the verdict table, the exit-push design with a spawn budget, the exit-code/result protocol, the merge adapter's acceptance list, the staged cutover with shadow-disagreement definitions, and the hardware proof order. Its evidence markers mean every load-bearing claim can be re-checked against this corpus without trusting the author.

**Lift from `gpt-revised_plan.md`:** the lifecycle-gate semantics (uploads of sealed data during play are permitted; writes to the live tree are not); the auto KEEP BOTH outcome sentence; the `origin` field; the SRAM-rewrite dependency in the unit design; the LAN no-default-route finding (fix `check_network_link`'s successor to test the *remote*, per the rule file, not the default route); the mixed-version cutover boundary; the receipt-retirement correction to claude's bounded `resolutions`; the frozen, hash-bound plan language for the walkthrough.

**Lift from `mistral-revised_plan.md`:** the D-CLOUD-031-A…E amendment IDs and the out-of-scope foreclosures.

**Lift from `gemini-revised_plan.md`:** the explicit register-facing closure of the D-CLOUD-029 question, and the "nothing is built yet" discipline.

**Do not carry:** anything in §5 above.

The resulting foundation is claude's architecture with gpt's precision at the four points named, mistral's register hygiene, and gemini's procedural closure — and it is testable end to end by the hardware gates all four plans already agree on, in the order claude gives them.

---

## corpus.provenance.json

```json
{
  "corpus_mode": "facilitator_embedded_read_at_time",
  "council_member_artifact": "kimi round-2 peer review (this document)",
  "source_count": 42,
  "hash_verification": "sha256 values verified at embed time by the Council Facilitator and copied from the per-source headers; not re-read or re-hashed by this member",
  "independently_reread_files": false,
  "independently_rehashed_files": false,
  "commands_or_hardware_tests_performed": false,
  "manifest_read_timestamp_utc_as_supplied": "2026-09-05T17:32:51Z",
  "injected_revised_plans": [
    "claude-revised_plan.md",
    "gemini-revised_plan.md",
    "gpt-revised_plan.md",
    "mistral-revised_plan.md"
  ],
  "injected_plan_hashes_provided": false,
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
    {"description": "GuiSaveState.cpp (delete path for tombstones; renumber-on-delete claim; launch-time picker mechanics)", "declared_source_path": null, "sha256": null},
    {"description": "SaveState.h / SaveStateRepository.h (default arguments of makeStateFilename and copyToSlot)", "declared_source_path": null, "sha256": null},
    {"description": "rclone 1.75.0 bisync documentation or source (every bisync behaviour claim remains [K] until the spike)", "declared_source_path": null, "sha256": null},
    {"description": "cloud_content_backup / cloud_content_restore / cloud_setup / tools/cloud-test-backend / backuptool implementations", "declared_source_path": null, "sha256": null},
    {"description": "docs/es-ui-style-guide.md; Paths.cpp; RetroArch launch/setsettings.sh savestate_directory path", "declared_source_path": null, "sha256": null},
    {"description": "Current issue bodies with edited ACs (embedded issue files are comment-thread exports); my own kimi-revised_plan.md (not injected for this round)", "declared_source_path": null, "sha256": null}
  ]
}
```

=== END kimi_peer_review-r2.md ===

=== START mistral_peer_review-r2.md ===

I have reviewed the four revised approaches. Here is my analysis of the remaining substantive disagreements, the load-bearing claims that must be verified, and the elements each plan uniquely contributes.

---

## 1. Real disagreements and how to settle them

### 1.1 Bisync's role

**Disagreement:**
- `claude-revised_plan.md` and `kimi-revised_plan.md` demote bisync to a diagnostic tool or candidate transfer engine, pending the spike.
- `gemini-revised_plan.md` does not address bisync's role explicitly.
- `gpt-revised_plan.md` does not commit to bisync as the primary detector, but treats it as a required conformance experiment.

**Settlement path:**
The spike is the arbiter. The corpus does not establish bisync's behaviour under `--conflict-resolve none` (does it rename, skip, or error?), nor whether it can accept external resolution decisions without `--resync`. The spike must run against both WebDAV and Dropbox with these fixtures:
- compressed state + PNG
- equal-size SRAM mutation
- preserved-mtime mutation
- rename
- deletion
- genuine fork
- first run
- filter change
- interrupted run
- external equalization after a manual apply

**Prediction:** bisync will fail at least one of the following: hashless backends, external resolution without `--resync`, or the exit budget. The manifest test is the only detector that satisfies the corpus's constraints.

---

### 1.2 Deletion propagation

**Disagreement:**
- `claude-revised_plan.md` and `kimi-revised_plan.md` require explicit tombstones for deletion propagation, with mass-deletion guards.
- `gpt-revised_plan.md` treats absence as deletion intent only with a verified tombstone.
- `gemini-revised_plan.md` does not address deletion propagation explicitly.

**Settlement path:**
The cardinal rule ("preserve player progress") forbids inferring deletion from absence. The corpus shows absence is not intent (interrupted layout change, unmounted storage, emulator temp rename, external client). The only safe V1 posture is **no deletion propagation**. Tombstones and mass-deletion guards are additive in V2.

---

### 1.3 Concurrency contract

**Disagreement:**
- `claude-revised_plan.md` and `gpt-revised_plan.md` propose protected publication areas and resolution receipts to preserve competing heads.
- `kimi-revised_plan.md` strengthens the pre-upload check and audit, but acknowledges a residual window.
- `gemini-revised_plan.md` does not address concurrency explicitly.

**Settlement path:**
The one-player-never-concurrent model cannot guarantee linearizable synchronization across devices. The minimum contract is:
1. Recheck the remote object immediately before overwrite.
2. Never overwrite a remote object that differs from agreement without first holding its bytes.
3. Audit every overwrite with before/after hashes.
4. Document the residual window.

**Prediction:** The protected publication area is the only mechanism that preserves competing heads. The pre-upload check alone cannot close the window.

---

### 1.4 Manifest amendments

**Disagreement:**
- `claude-revised_plan.md`, `gpt-revised_plan.md`, and `kimi-revised_plan.md` propose targeted schema amendments (origin sub-object, screenshot binding, group key, parse-failure rule, identity-collision rule).
- `gemini-revised_plan.md` does not address schema amendments explicitly.

**Settlement path:**
The corpus shows the schema lacks:
- A way to record the producer's provenance for a materialized version.
- A way to bind the thumbnail to the state.
- A way to group multi-file saves.
- A rule for unparseable manifests.
- A rule for identity collisions.

**Prediction:** The amendments are load-bearing. Without them, provenance dies at re-slot, the picker shows wrong pictures, and multi-file saves split.

---

### 1.5 D-CLOUD-029 (no `--update` stopgap)

**Disagreement:**
- `claude-revised_plan.md` and `kimi-revised_plan.md` retain D-CLOUD-029 (no `--update` stopgap).
- `gemini-revised_plan.md` argues for an immediate `--update` stopgap.
- `gpt-revised_plan.md` argues that `--update` is unsafe due to the boot-restore clobber.

**Settlement path:**
The embedded `102-cloud-saves` script runs `cloud_restore --yes --method=copy --update` at boot, before the backup. If the exit path skips uploading, the next boot's restore overwrites the local progress. `--update` is unsafe in both directions.

**Prediction:** D-CLOUD-029 stands. The lossless interim posture (disable the boot pair and SYNC row, leaving only the exit upload) is the only safe configuration until the wizard ships.

---

## 2. Load-bearing claims that must be verified

### 2.1 ES primitives

**Claim:** `getNextFreeSlot()` returns `-99` for an auto-only repository; `copyToSlot()` ignores copy/rename return values and returns `true` unconditionally.

**Verification:** Read `es/SaveStateRepository.cpp` and `es/SaveState.cpp`. The auto-only case is source-visible; the copy/rename behaviour requires testing against an unwritable destination.

**Status:** Verified in the corpus (`gpt-analysis.md` §1.8; `claude_peer_review.md` §3).

---

### 2.2 Manifest transport

**Claim:** The exit upload republishes a stale cached foreign manifest over the producer's newer one.

**Verification:** Fixture: plant a stale foreign manifest locally, run the exit pass, assert the remote's copy unchanged.

**Status:** Not verified. The corpus shows the allowlist admits `manifest-*.json` (`+ /savestates/**`), but does not show the exit upload's behaviour.

---

### 2.3 Bisync behaviour

**Claim:** Bisync's behaviour under `--conflict-resolve none`, interruption, and filter change.

**Verification:** Spike against WebDAV and Dropbox with the fixtures in §1.1.

**Status:** Not verified. The corpus contradicts itself on bisync's behaviour.

---

### 2.4 Local backend-hash computation

**Claim:** `rclone hashsum <backend>` computes backend-native hashes locally on the device.

**Verification:** `rclone hashsum dropbox` a state on the device vs. `lsjson --hash` of its uploaded copy.

**Status:** Not verified. General knowledge, not corpus.

---

### 2.5 Core-set divergence

**Claim:** Core sets differ per target.

**Verification:** Diff `LIBRETRO_CORES` across targets in the tree.

**Status:** Not verified. The corpus does not establish this.

---

### 2.6 Staging and union-fetch cost

**Claim:** Staging and union-fetch cost on the maintainer's real library.

**Verification:** Shadow mode on the maintainer's devices.

**Status:** Not verified. The corpus does not establish this.

---

### 2.7 480×320 usability

**Claim:** Real thumbnails are recognizable on the RG351M.

**Verification:** Layout at 480×320 first; real-thumbnail recognition test on the RG351M.

**Status:** Not verified. The corpus does not establish this.

---

## 3. Elements each plan uniquely contributes

### 3.1 `claude-revised_plan.md`

1. **The boot-sync vs. game-session race.** The boot sync backgrounds itself and can overlap with active gameplay, uploading transient `.bak` files. This is the most consequential gap in the corpus.
2. **The reflash case.** A reflashed device regenerates the same identity and finds its own backups again. The manifest must download before first capture.
3. **The discard store.** `/storage/.cache/cloud_sync/discarded/<path>/<sha256>` is the only mechanism that bounds discarded-save retention without sync-tree contamination.
4. **The one-writer rule.** The save tree has one writer at a time; the boot sync moves into ES.

---

### 3.2 `gemini-revised_plan.md`

1. **The `#10` launch-behaviour rehearsal.** Shipping `es_savestates.cfg` forces `racommands = false` and flips `autosave`/`incremental` defaults — a launch-behaviour migration, not a config change.
2. **The bisync spike reframing.** Bisync is a candidate transfer engine, not a detector. The spike's fixtures double as the adversarial suite for the manifest detector.

---

### 3.3 `gpt-revised_plan.md`

1. **The manifest/content test as authority.** The detector is stateless and manifest-based, not bisync. This is the only mechanism that satisfies the corpus's constraints.
2. **The staging mirror.** Each sync pass mirrors the remote's saves tree into `/storage/.cache/cloud_sync/stage/`, then sha256-hashes staged and local files. This is the only mechanism that learns C by content on every backend.
3. **The typed outcomes.** Normalized result protocol; conflicts-pending is a state file plus a menu badge; per-phase failures propagate.

---

### 3.4 `kimi-revised_plan.md`

1. **The resolution receipt.** A decision bound to the exact operand hashes and resulting locations prevents ping-pong.
2. **The discard-store scope.** `/storage/.cache/cloud_sync/discarded/<path>/<sha256>` is outside the sync tree, so no allowlist rule is needed.
3. **The headless handoff.** The exit sync never opens the wizard over a player who just finished a game; it records conflicts and the card says so.

---

## 4. Elements that should not be built

### 4.1 Over-engineering

1. **Semantic binary merging.** The corpus does not establish that savestates are semantically mergeable. V1 does not need it.
2. **Vector clocks for the whole library.** The corpus does not establish that the whole library needs causal ordering. V1 does not need it.
3. **A shared database.** The corpus does not establish that a shared database is needed. V1 does not need it.
4. **Progress heuristics selecting a winner.** The corpus does not establish that progress heuristics are reliable. V1 does not need them.

---

### 4.2 Unsafe assumptions

1. **Bisync as the detector.** The corpus does not establish that bisync can accept external resolution decisions without `--resync`.
2. **Size-plus-relist certification.** The corpus shows this is the #53 failure shape.
3. **Absence as deletion intent.** The corpus shows absence is not intent.
4. **The pre-upload check alone as concurrency mitigation.** The corpus does not establish that it closes the window.

---

## 5. Which plan I would build from, and what I would take from the others

I would build from `claude-revised_plan.md`. It is the only plan that:
1. Addresses the boot-sync vs. game-session race.
2. Preserves the reflash case.
3. Bounds discarded-save retention without sync-tree contamination.
4. Enforces the one-writer rule.
5. Demotes bisync to a diagnostic tool.
6. Requires explicit tombstones for deletion propagation.
7. Proposes protected publication areas and resolution receipts for concurrency.

From `gpt-revised_plan.md`, I would take:
1. The staging mirror as the substrate for detection, wizard screenshots, KEEP BOTH materialization, and discard-store population.
2. The typed outcomes and normalized result protocol.

From `kimi-revised_plan.md`, I would take:
1. The resolution receipt to prevent ping-pong.
2. The discard-store scope and location.
3. The headless handoff and conflicts-queue badge.

From `gemini-revised_plan.md`, I would take:
1. The `#10` launch-behaviour rehearsal and deferral.

---

## 6. What changed my mind since my own revision

1. **The boot-sync vs. game-session race.** I did not consider that the boot sync backgrounds itself and can overlap with active gameplay. This is the most consequential gap in the corpus, and `claude-revised_plan.md` is the only plan that addresses it.
2. **The reflash case.** I did not consider that a reflashed device regenerates the same identity and finds its own backups again. The manifest must download before first capture.
3. **The discard store.** I did not consider that `/storage/.cache/cloud_sync/discarded/<path>/<sha256>` is the only mechanism that bounds discarded-save retention without sync-tree contamination.
4. **The one-writer rule.** I did not consider that the save tree has one writer at a time; the boot sync moves into ES.

---

## 7. The build order

1. **Repair `tools/cloud-round-trip`.** It overwrites `rclone.conf` before asserting the first remote, never restores it, and carries assertions that cannot pass against the embedded uploader.
2. **Run the bisync spike.** Settle bisync's behaviour under `--conflict-resolve none`, interruption, and filter change.
3. **Run the session-zombie experiment.** Startup sync on, boot, launch from a numbered slot within 30 s, let the boot sync finish, exit, list the remote for `.bak` and extra slot files.
4. **Run the ES primitive failure paths.** Auto-only allocation → −99; `copyToSlot` against an unwritable destination → reported success vs. actual bytes; refresh invalidation.
5. **Run the local backend-hash experiment.** `rclone hashsum dropbox` a state on the device vs. `lsjson --hash` of its uploaded copy.
6. **Run the core-set divergence check.** Diff `LIBRETRO_CORES` across targets in the tree.
7. **Run the round-trip full run.** GENERIC_X64 VM, WebDAV and MinIO, with the new steps: manifest transport, two-device both-sides-changed, deletion-resurrection, wrong-clock, foreign-manifest republication, discard-store exclusion, no-allowlist `RCLONEOPTS`.
8. **Run the shadow-mode census.** The detector runs log-only for a fixed window. Outputs: fork rate per kind, verdict distribution, unknown-rate.
9. **Run the 480×320 recognition test.** Real thumbnails on the RG351M.

Build order after the gates: capture (#21) → detector/staging (#22) → wizard (#23) → merge adapter (#24). #10's directory move and #25 follow with their own futros.

=== END mistral_peer_review-r2.md ===
