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

=== START gpt_peer_review-r2.md ===

# Round-2 peer review

## Recommendation

**I would build from `claude-revised_plan.md`, but not implement it unchanged.** It gives the clearest account of lifecycle ownership, manifest transport ownership, capture, error reporting, and migration. Those are the boundaries that a correct conflict test cannot protect by itself.

Before using it as the implementation specification, I would:

- Remove its provisional-agreement permissions and its unsupported guarantee that `--backup-dir` makes concurrent overwrites recoverable.
- Correct conflict classification for multi-file units.
- Narrow deletion handling rather than adopt its entire deletion table.
- Take self-contained producer provenance and reusable, **verified** staging from `kimi-revised_plan.md`.
- Take the explicit real-device #10 launch-behaviour rehearsal from `gemini-revised_plan.md`.
- Take the move-observation approach from `mistral-revised_plan.md`, rather than infer lineage after a rename-and-overwrite.
- Treat #10’s deferral as internal build sequencing, **not evidence that a release without local core isolation is safe**.
- Specify durable recovery from an interrupted apply before enabling destructive actions.

No plan is ready to become an unqualified implementation contract. Three particularly consequential errors survive in these revisions:

1. An exit-only `copy` upload does **not** preserve both sides of a fork.
2. Hashing a metadata-skipped staging copy does **not** establish the cloud’s current content.
3. Grouping already-classified file conflicts does **not** correctly classify a multi-file save.

### Evidence convention

I used only the embedded corpus. I did not access files, run commands, re-hash sources, or conduct hardware tests.

Source citations `[S1]`–`[S42]` refer to the full declared paths and exact Facilitator-provided hashes at the corresponding positions in `corpus.provenance.json` below. Paths abbreviated in prose are suffixes of those declared paths. The revised-plan filenames identify proposals under review, not evidence that their technical claims are true. Earlier analyses and reviews mentioned inside those plans were not independently available.

---

## 1. Claims that must not survive into implementation

### 1.1 The “lossless one-way stopgap” is still destructive

This affects:

- `gemini-revised_plan.md`, §5.1;
- `kimi-revised_plan.md`, F5;
- `mistral-revised_plan.md`, §§1, 3.2, and 6.

Disabling downloads prevents one direction of overwrite. It does not prevent the remaining upload from overwriting the cloud.

A sufficient counterexample is:

| Before the exit upload | Content |
|---|---|
| Local save at path *p* | X |
| Cloud save at path *p* | Y |
| Other retained copy of Y | None established |

The shipped `cloud_backup --recent` forces `copy`. Its `--backup-dir` branch applies to `BACKUPMETHOD=sync`, which that recent path has just overridden. If X is transferred, the result is X locally and X in the cloud. **Y has not been preserved.**

This follows directly from `cloud_backup::backup_game_saves`, not from any assumed bisync behaviour. [S29]

The claim that another device probably still holds Y is insufficient. Y may be a cloud-only version after a reflash, deletion, card replacement, or an earlier overwrite. Neither the current transport nor these stopgap proposals pins it.

There is also a configuration mismatch:

- The shipped startup toggle controls the **whole boot pair**, not just its restore half.
- The embedded menu map supplies no toggle that disables the manual SYNC row.
- The literal boot script uses two separate commands, not an `&&` chain. Its backup can run after its restore fails. [S13, S35]

**Disposition:** reject this stopgap’s safety claim. D-CLOUD-029 remains binding unless the maintainer explicitly accepts a new row changing it. `mistral-revised_plan.md` cannot both say it respects D-CLOUD-029 and then replace that decision in its register table. [S6]

**Cheapest confirming experiment:** in an isolated test prefix, use different-sized X and Y so a comparison shortcut cannot hide the overwrite; run the actual recent upload and inventory every retained copy of Y.

**Prediction:** the canonical cloud object becomes X. The proposed posture is not lossless.

---

### 1.2 Kimi’s staging mirror reintroduces the failure it says it eliminates

`kimi-revised_plan.md` F3 proposes:

> `rclone copy`, allowlist-filtered, skipping unchanged by the backend’s available metadata

It then says this learns C by content on every backend, while acknowledging that on WebDAV a same-size cloud change can remain invisible.

Those statements cannot both support the proposed classifier.

Consider this sequence:

1. Local, cloud, agreement, and stage initially contain H₀.
2. The cloud becomes Hᶜ, with the same byte length.
3. Local becomes Hˡ.
4. The metadata-based copy leaves staged H₀ untouched.
5. Hashing the stage yields H₀.
6. The classifier concludes “cloud equals agreement; only local changed” and uploads Hˡ.

The actual situation was a fork. The hash verified the **cache**, not the cloud.

The corpus explicitly identifies the QA WebDAV as having neither usable hashes nor modtimes, and `cloud_backup` documents the same-size comparison failure that caused #53. The schema calls size/modtime hints, with content confirmation after download. [S3, S4, S29]

Kimi’s qualification—

> any path whose decision matters gets download-and-hash confirmation

—can repair this only if it is an explicit, unavoidable admission rule. It must cover:

- overwrites;
- equality used to establish agreement;
- “nothing to do” conclusions presented as verified synchronization;
- deletion or duplicate-cleanup decisions;
- reuse of a staged candidate at COMPLETE.

It cannot coexist with an accepted rule that same-size changes remain invisible until a future size change.

There is a second staging problem: **`rclone copy` does not make a mirror.** A file removed remotely can remain in the stage. Presence in the staging directory is therefore not proof of current remote presence. Each staged object needs to be associated with a successful current inventory or another valid freshness proof.

`mistral-revised_plan.md` has the corresponding unresolved problem in §3.1: listing hashes—or size and mtime—and reading local metadata does not obtain a current cloud SHA-256 on a hashless backend. `gemini-revised_plan.md` also needs to explain where verified C comes from; naming a SHA-256 manifest diff does not answer that.

**Disposition:** retain staging as a cache of verified candidates, not as an authoritative mirror obtained through ordinary comparison skipping. Unknown freshness must remain unknown.

**Cheapest experiment:** repeat a same-sized SRAM overwrite against an already-populated WebDAV stage, then change the local SRAM and inspect the classifier’s proposed action.

**Prediction:** ordinary metadata-skipped staging misses the cloud change. Forced content retrieval or an explicit unknown verdict is necessary.

---

### 1.3 The multi-file classifier must operate on the unit, not just aggregate file conflicts

`claude-revised_plan.md` §3.4.3 and `kimi-revised_plan.md` F3 say, in substance:

> Classify per path; if any member is divergent, mark the group divergent.

That is insufficient for a save whose members form one coherent unit.

Suppose a declared save unit contains files *a* and *b*:

| Snapshot | a | b |
|---|---|---|
| Agreed | a₀ | b₀ |
| Local | a₁ | b₀ |
| Cloud | a₀ | b₁ |

Neither file is individually divergent:

- *a* looks device-changed;
- *b* looks cloud-changed.

The proposed rule silently constructs `(a₁, b₁)`. Neither device produced that snapshot.

For an indivisible save unit, **both sides changed the unit**, so this is a group-level fork even though no individual path changed on both sides.

`gemini-revised_plan.md` has the right high-level requirement—resolve the whole bundle—but does not yet provide the group-level test. `mistral-revised_plan.md` similarly needs more than a new `container` kind.

The actual grouping boundaries remain empirical. The corpus names PPSSPP game-ID layouts and shared VMUs, but does not prove that every N64 pair, VMU directory, or emulator-specific directory is one indivisible unit. [S1, S6, S32] Assertions that N64 files are either necessarily coupled or “largely independent” remain hypotheses here.

**Disposition:** for a declared coherent unit, compare its complete local, cloud, and agreed member maps, including membership changes. Do not merely combine already-detected per-file conflicts.

**Cheapest experiment:** the two-file example above is enough to test the classifier. Then verify the grouping table with actual emulator writes.

**Prediction:** both detailed per-file-then-group rules misclassify the example unless amended.

Also, “resolve as a unit” is not the same as “transfer atomically.” None of the embedded material establishes atomic remote directory replacement. An interrupted bundle publication must not become a playable mixed generation.

---

### 1.4 Rechecking and saving the previously observed bytes do not guarantee recovery from a concurrent overwrite

`kimi-revised_plan.md` F9 says its remaining lost race is recoverable because it staged the prior version. `claude-revised_plan.md` §3.7.4 makes the stronger claim that the overwritten bytes will be retained through `--backup-dir`.

The unresolved interleaving is:

1. A checks cloud H₀ and retains H₀.
2. B publishes Hᵇ.
3. A publishes Hᵃ over Hᵇ.

A retained H₀, not Hᵇ.

A `--backup-dir` may improve this substantially. But the corpus does not establish **which generation it archives under this race**, the atomicity of its move/copy operations across backends, or what happens when two devices choose the same dated archive destination. The shipped use is with `sync`; the proposed use and concurrency guarantee require testing. [S29]

Calling the race an accepted limitation is honest only if its consequence is stated accurately:

> A concurrent version may be lost unless that version itself was durably retained.

It is not enough to say “lost update possible, but bytes retained” without establishing the latter.

**Disposition:** accept rechecks as useful detection and staging as preservation of observed candidates. Reject a universal recoverability guarantee based on them. If no-loss under concurrent compliant devices is required, every produced version needs a proven preservation path before canonical replacement. If that stronger requirement is deferred, state the residual possible loss plainly.

**Cheapest experiment:** insert a new cloud-only version after the final recheck and before publication, then inspect canonical, archival, and staged objects by hash. Repeat with two same-second archive destinations.

**Prediction:** precheck-plus-stage alone cannot preserve an intervening version. `--backup-dir` results will be backend- and operation-dependent until proven otherwise.

---

### 1.5 None of the plans finishes the interrupted-apply contract

Preserving losers and writing an audit line before deletion are necessary. They do not fully specify recovery when power fails:

- after one member of a bundle is installed;
- after local replacement but before remote publication;
- after remote publication but before agreement is advanced;
- after an intent was logged but before the operation happened.

`claude-revised_plan.md` is the closest, but its per-item ordering is not yet a recovery state machine. The other plans are less explicit.

The audit log is bounded, support-oriented text under D-CLOUD-027. It must not silently become the sole transaction journal or the only record identifying an incomplete apply. [S6]

**Required acceptance contract:** after interruption, the implementation can identify the exact planned versions and destinations, distinguish completed work from intent, keep incomplete units out of emulator consumption, and either finish or safely stop without deleting a unique candidate.

A small durable pending-operation record is earned here. A database, daemon, distributed two-phase commit, or unbounded history service is not.

This is V1 apply safety, not the V2 rollback browser. The upgrade rule already treats interruption as normal. [S11]

---

## 2. The remaining disagreements, made decidable

### 2.1 Bisync’s role: substantive; “stateless” is mostly terminology

All four plans prefer application-owned reconciliation. That preference is defensible because the application already needs to understand:

- slot identity;
- save units;
- producer metadata;
- manifest ownership;
- screenshots;
- player decisions.

But several stated reasons for rejecting bisync are still not evidence.

`mistral-revised_plan.md` repeatedly states as fact that bisync is SRAM-blind, necessarily demands resync on first runs and filter changes, and has a corruption-prone workdir. The embedded futro poses these as failure scenarios to investigate; it is not an executed trace. The issue comments show help output and an interpretation of defaults, not the actual conflict side effects. [S5, S23]

`claude-revised_plan.md` improves the epistemic labels, but still overreaches in places:

- Rewriting a filter file does not establish that its content changed.
- Even changed content does not establish how bisync fingerprints it.
- A full-sync engine need not satisfy the exit path’s no-remote-contact fast path if the application simply does not invoke it on that path.

Kimi similarly cannot call post-manual-apply failure “spike-independent” while correctly listing the behaviour as a hypothesis.

**What settles it:** a version-pinned, disposable real-run matrix, not just dry-run output:

- genuine fork under `none`;
- same-size edits on WebDAV;
- rename and deletion;
- external equalization after a manual resolution;
- unchanged filter rewrite versus actual filter change;
- interruption and recovery;
- missing listings;
- exact pre/post names and bytes.

The corpus contains neither upstream 1.75.0 implementation material nor a roadmap that could settle these claims. [S16, S23]

**My expectation:** application policy remains necessary whatever the spike finds. Bisync might still earn a limited transfer role; the available evidence does not establish that it has already failed every relevant contract.

**What not to build:** a permanent second diagnostic reconciler in production, maintaining another baseline and making extra remote calls after its adoption question has been answered. Keep that comparison in developer tests.

As for “stateless”: a pure classification function consuming inventories and agreement is a good design. The overall system is nevertheless stateful. `agreed.json`, pending applies, and retained versions are state. Avoiding a bisync workdir does not remove recovery obligations.

---

### 2.2 General deletion propagation versus conservative resurrection

This is a real disagreement:

- Claude, Gemini, and Mistral add tombstones.
- Kimi deliberately does not propagate ordinary deletions in V1.

**I favour Kimi’s conservative ordinary-deletion policy for V1**, but not its claim that existing compaction makes the whole problem disappear.

D-CLOUD-030 removes a higher numbered duplicate after re-verification. If that removal is only local and every absent path is subsequently restored, the next sync downloads it again, compaction removes it again, and the cycle repeats. That is safe in the narrow byte-preservation sense but does not converge. [S3, S6]

The distinction worth preserving is:

1. **Unexplained absence:** not deletion authority.
2. **Explicit player deletion:** a separately approved propagation policy.
3. **Verified duplicate cleanup:** already decided, and lossless only within its carefully checked scope.

Claude’s full deletion table is not ready to implement. For example, row 12 tests for a remote tombstone but does not explicitly require that it targets the currently agreed version. A stale tombstone for an earlier occupant of a reused path must not authorize removing the present occupant. A mass-delete threshold does not repair that problem.

**What settles the scope:**

- Three consecutive syncs after duplicate compaction: do transfers cease?
- Delete-and-renumber on one device, then edit the reused slot on another.
- Reuse a formerly deleted path and later present its old tombstone.
- Substitute a different populated save tree at the same configured root.

**Prediction:** conservative resurrection protects unique bytes; local-only duplicate deletion churns; path-only deletion records eventually target the wrong occurrence.

**Build implication:** do not make a general deletion protocol a prerequisite merely to solve duplicate convergence. Conversely, do not defer duplicate convergence while claiming D-CLOUD-030 has solved it.

---

### 2.3 Producer provenance, placement, and lineage are different records

Here `kimi-revised_plan.md` has the better direction: preserve producer metadata when a version is materialized elsewhere.

Claude’s “look up producer by hash across manifests” works only while some retained manifest still describes that hash. A per-device map with one current entry per path is not immutable history. If the producer overwrites that path, old core/build/capture metadata can disappear. A V2 index cannot reconstruct fields that no surviving record contains. D-CLOUD-027’s rotated audit log does not make this unbounded history durable. [S3, S6]

Mistral’s proposed `origin: {device, hash}` is a useful reference but may still be insufficient to display an old version’s core build and capture time once its producer’s entry has been replaced.

**Preferred contract:** materialization preserves the version’s available producer metadata separately from the device publishing or holding it. A re-slot is a new placement, **not a new save version** if the bytes are unchanged. Claude’s §3.6.7 calls it a new version; that contradicts D-CLOUD-030. [S3, S6]

There are two additional problems to correct:

#### Rename-then-edit defeats Claude’s possession-record shortcut

Suppose:

- slot 1 held H₁;
- slot 2 held H₂;
- ES deletes slot 1 and renames slot 2 to slot 1;
- the next session overwrites slot 1 with H₃.

Reading the old agreement at slot 1 yields H₁, not H₂. Claude’s R5 does not solve this unless the placement record was updated when the move occurred. The embedded ES code makes those moves before the proposed exit capture. [S37, S38, S41]

This is where Mistral’s instruction to **observe move operations** is valuable. If the predecessor was not observed, uncertain lineage is better than a confidently wrong `replaces`.

#### Reflash recovery cannot block offline capture

Claude’s “download before first capture” conflicts with its own requirement that capture works offline and independently of sync.

The right acceptance test is not “did capture first contact the cloud?” It is:

> Can a reflashed device capture offline without erasing historical metadata when it eventually republishes its own manifest?

Also, the identity implementation has both current and legacy naming logic. The permanent-address seed does not imply the full identifier remains identical across the naming-era transition. [S34]

**Experiments:**

- Re-slot a state; let its producer overwrite the original path; confirm provenance survives.
- Run the rename-then-edit sequence and inspect `replaces`.
- Reflash using both a current generated identity and a stored legacy identity; capture offline first.
- Clone an ID onto a second device of the **same model**.

**Prediction:** hash-union lookup alone loses historical provenance; unchanged per-path possession misattributes the predecessor; model/family checks miss same-model identity collisions.

Claude’s `generated_at` comparison is not an identity-collision proof either. Clocks are explicitly untrusted in this design. [S3]

Finally, agreement scoping is necessary, but hashing an entire remote config section is too blunt. Test credential refresh separately from changing the actual remote account/root. The former should not necessarily invalidate every agreement; the latter must.

---

### 2.4 Deferring #10 is a sequencing choice, not a safety argument

Claude and Kimi defer per-core directory materialization. Gemini instead makes its behavioural rehearsal an explicit gate. Mistral does not adequately address the launch-mode migration.

The code supports the central warning:

- `Default()` enables `racommands`, autosave, and incremental behaviour.
- XML-loaded configurations set `racommands=false`.
- Autosave and incremental behaviour must be declared explicitly rather than inherited from the compiled default. [S39]

That earns a rehearsal. It does **not** prove that the entire feature can safely ship without core isolation.

Claude says flat-path collisions will become visible conflicts with core metadata. That is only true if both versions survive until reconciliation. On one device, core C₂ can write the same flat `.state.auto` or numbered-slot path previously used by C₁ **before the reconciler sees either fork**. Metadata cannot recover overwritten bytes.

The same issue exists independently of chipset compatibility: two different cores are not made interchangeable by a successful same-core H700/RK3326 transfer.

**Preferred disposition:** defer #10’s implementation until its behavioural contract is understood, if useful for development. Do not declare the drop safe without either the decided isolation or an explicitly accepted alternative that prevents local cross-core overwrite. D-CLOUD-017 still governs the release design. [S6]

**Experiment:** on a protected test library, create a known state under one core, switch core, save through both auto and numbered paths, and inventory which original versions remain. Separately install the proposed configuration and exercise resume, incremental save, core selection, and legacy-flat discovery.

**Prediction:** creating the configuration changes launch behaviour; the exact effects require observation. Leaving the flat namespace in place does not itself preserve versions across core switches.

---

### 2.5 The changed-file exit budget is not yet priced

The revisions correctly recognize that D-CLOUD-028 needs an explicit amendment if changed-file uploads require additional correctness reads. But their numerical claims are not yet internally consistent.

Claude proposes:

1. a remote listing;
2. a save payload upload;
3. an explicit own-manifest single-file upload.

That is already at least three rclone invocations as described, not its claimed two, before any separate post-upload verification. Its later statement that the manifest “rides the same push” contradicts the explicit separate transfer rule.

Kimi adds staging and, on hashless backends, post-upload download-and-hash. Those are legitimate correctness costs, but the invocation and remote-operation counts need to be stated.

A locally computed backend-native hash is an **expected** value. Computing it is not proof that the remote stored it, and it does not by itself satisfy the current schema’s definition of `remote_hash` as a post-upload observation. [S3] A verified transfer-level check may supply the needed evidence, but that remains an experiment.

The shipped code also does not have a zero-spawn local-diff fast path. It normally starts rclone with a time window. “No qualifying recent files” and “no newly changed files since the last run” are not identical because the window deliberately overlaps by ten minutes. [S29]

There is a product difference as well:

- Claude defers many hashless-backend exit uploads to a full pass.
- Kimi pays to verify them.

Deferral can be safe but fails the cross-device handoff if no full pass runs on A before the player starts B. “Queued on this device” must not be reported as “safe in the cloud.”

**What settles it:** an invocation/operation trace and H700 timings for:

- no changed candidates;
- one changed SRAM;
- one state plus PNG;
- a save unit;
- hashless verification;
- unavailable network;
- A exits, then B starts without A rebooting or receiving another manual sync.

**Preferred outcome:** preserve the no-change fast path, accept a measured correctness cost for changed files, and report pending work honestly. Do not certify data by size to meet a budget.

---

### 2.6 UI disagreements need product decisions, not technical camouflage

#### Automatic wizard versus queued conflicts

Claude largely retains rev 4’s automatic trigger; Kimi explicitly queues conflicts.

That is substantive. A result file does not decide whether the UI should open immediately.

I favour Kimi’s queued, durable entry for unattended/exit-triggered work, with a direct route from an explicitly requested sync. But it requires an IA amendment: it must not quietly replace the current trigger contract. [S2]

The experiment is a controller-only session containing several conflicts, followed by dismissal, reboot, and return to the affected game. Measure whether the player can find and finish resolution without a forced interruption or a hidden backlog.

#### Cancellation

Claude correctly identifies the contradictory original promises, but its replacement text still says “nothing was overwritten” during preparation.

Non-conflicts include `L=A, C≠A`, which is an agreed one-sided update and can overwrite local A. [S3]

The accurate promise is narrower:

> Cancelling leaves the conflicting versions unchanged and discards the walkthrough’s choices. Earlier non-conflicting updates have already been applied.

Kimi, Gemini, and Mistral should not simply retain the globally worded “nothing transfers until COMPLETE” alongside an applying pre-pass.

#### KEEP BOTH on auto states

Kimi says the “winner” stays at `.state.auto` and the loser becomes a numbered slot. But KEEP BOTH does not identify a winner in the IA.

Every plan needs a deterministic, visible answer to:

> Which copy will automatic resume use after KEEP BOTH?

That cannot be inferred from recency or left to transfer order.

#### Retention

Default-on bounded retention is a reasonable proposed amendment. But:

- It is not already the settled default.
- `--backup-dir` does not make the implementation nearly free.
- The IA specifies a count selector, **not a default count of three**. Mistral’s attribution is wrong; three is the shipped system-backup retention default. [S2, S33]
- Retained bytes without a controller-accessible recovery action are not yet a console-first undo feature.

If rollback UI remains V2, distinguish “copies retained for recovery” from “you can undo this choice here.”

#### Kid/kiosk mode

Mistral uniquely makes access a required test; Claude explicitly avoids opening the wizard there. The embedded menu map says GAME SETTINGS is in the full-UI block. A badge only in that menu is invisible in kid/kiosk mode. [S13]

This needs a maintainer decision: resolution after unlocking, or a deliberately permitted restricted-mode resolver. I would not automatically expose destructive choices to kid mode merely to satisfy Mistral’s sentence. I would require that pending conflicts remain safe, understandable, and resolvable through the chosen access path.

---

### 2.7 Result file versus exit code is not a meaningful either/or

Claude proposes a durable result plus a normalized conflicts status. Kimi insists conflicts must never be signalled by an exit code.

The important requirements are:

- rclone codes must not escape into the application’s reserved status meanings;
- a durable, validated result must carry details;
- the UI must not mistake an old result for the current run;
- unavailable classification must not appear as clean synchronization.

A normalized exit code can summarize the same result. It is not inherently unsafe. Conversely, a state file alone is unsafe if a failed run leaves yesterday’s clean file in place.

The source finding is real: `cloud_backup` and `cloud_restore` can pass through rclone 3/4, while `ThreadedCloudSync` presents all 3/4 as friendly skips. Both script mains also return only the saves-phase status, potentially masking a system-phase failure. [S29, S30, S40]

**Disposition:** combine durable, run-correlated results with normalized status. Do not build competing notification mechanisms or treat missing results as success.

---

## 3. Additional source checks

These findings are worth carrying into acceptance criteria without re-litigating them.

| Claim | Corpus check and consequence |
|---|---|
| Auto-only allocation returns −99 | **Supported.** The vector is nonempty because it contains slot −1; the nonnegative scan finds nothing. Handle this specific case without treating every −99—including unsupported allocation—as permission to use slot zero. [S37] |
| `copyToSlot()` verifies success | **False.** After preliminary checks, it ignores state and image copy/rename results. A checked adapter is necessary. Prefer repairing/reusing the allocator and helper contracts over creating a permanently divergent slot implementation. [S38] |
| Refreshing before a batch prevents repeated slot allocation | **Insufficient.** If planned copies have not yet materialized, repeated refreshes see the same free slot. Gemini needs explicit reservations, as Claude and Kimi already require. Refresh also deletes repository-owned state objects. [S37] |
| Creating XML config always disables exit renumbering | **Overstated.** It changes the `racommands` path, but the final `onGameEnded()` renumber also depends on `config->incremental`. Explicit XML settings matter. [S38, S39] |
| `getCore(true)` is necessarily the actual launched core until #10 ships | **Too broad.** The demonstrated compiled-default path supports that inference; the configurable alternate launch path already exists. Upgraded installations can have custom configuration. Preserve the executed launch descriptor rather than rely on a future feature boundary. [S38, S39, S42] |
| Auto states necessarily diverge every session | **Not established.** ES can back up and restore `.state.auto` around numbered-slot launches. Frequency is a census question, not a premise for architecture. [S38, S41] |
| The schema already contains independent PNG entries because it has `screenshot` | **Not established.** It contains a companion-path field; that is not the same as a separate PNG version record. The relevant missing guarantee is binding the displayed PNG to the chosen state version. [S3] |
| `rom` should universally become the matched stem | **Reject that blanket change.** ES supports `nofileextension` both ways. Preserve game identity from the launch context and distinguish it from the basename used by a particular save pattern. [S3, S37, S39] |
| A safety exclusion placed before the defaults’ savestates include is unconditional | **False.** User rules precede defaults. Mistral’s discard exclusion can be defeated. The explicit option construction and transport ownership in Claude/Kimi are better; test the effective command, not just the default file. [S9, S31, S32] |
| The existing round-trip suite is a trusted baseline | **False.** Its config overwrite precedes its remote assertion, cleanup is incomplete, and archive expectations have drifted. Also review its arbitrary `qa-content` directory assumption against D-CLOUD-019’s ES-system allowlist; do not weaken production membership to make an obsolete fixture pass. [S6, S36] |

The boot/emulator overlap is a credible and important mechanism: the detached boot script and the ES launch/exit path have no demonstrated shared gameplay exclusion. But the exact timing and resulting byte loss remain to be reproduced. A “verified mechanism” should not be presented as a hardware incident already observed. [S35, S41]

---

## 4. What each plan uniquely contributes—and what not to build

### `claude-revised_plan.md`

**Distinct contribution worth retaining:** it supplies an actual ownership mechanism for the gameplay race, rather than only adding another sync lock.

Lift this requirement:

> No reconcile, compaction, or download may mutate the live save tree while an emulator owns it; game launch and save-tree commit must share an explicit lifecycle gate.

The ES-owned startup scheduling proposal gives that requirement a plausible home.

**Why I would start here:** its coverage of foreign-manifest republication, independent capture, normalized results, and actual entry points makes it the strongest integration document.

**Do not build unchanged:**

- provisional agreement that can authorize subsequent canonical uploads;
- the full deletion table;
- permanent recorded-loser rules as automatic authority;
- time-based identity-collision detection;
- the claim that metadata makes a flat cross-core namespace safe;
- a mandatory two-week shadow period on unsafe live writers.

A recorded loser can be useful context. It must not permanently stigmatize the same bytes when a player later deliberately restores them. Repeated conservative prompting after lost agreement is not sufficient justification for a new global resolution-ordering protocol.

Also, scope the gameplay gate to save-tree safety. Do not block game launch behind every long content transfer merely because both operations use the cloud subsystem.

---

### `kimi-revised_plan.md`

**Distinct contribution worth retaining:** materialized versions retain producer metadata separately from the publishing device.

Lift this requirement:

> A downloaded or re-slotted version preserves its producer’s device, core, core build, and capture metadata as origin; the receiving device records possession or materialization without claiming production.

That survives a producer subsequently overwriting its original slot better than hash lookup into current manifests alone.

Its second useful contribution is reusing staged candidates for the wizard, merge, and discard preservation. That is good economy **once freshness has been proven**.

**Do not build unchanged:**

- the metadata-skipping staging mirror as the source of current C;
- the “lossless” exit-only configuration;
- “any member divergent” as the whole unit classifier;
- the assertion that a retained precheck snapshot makes a later race recoverable;
- deletion resurrection without a duplicate-convergence plan.

The combination of a whole-tree mirror, separate manifest copies, and certification downloads also needs measurement before it is called the budget-conscious option.

---

### `gemini-revised_plan.md`

**Distinct contribution worth retaining:** the explicit **real-device #10 launch-behaviour rehearsal as a preimplementation gate**.

This is procedurally different from Claude’s VM-specified primitive experiment, Kimi’s deferral to another futro, and Mistral’s core-set comparison.

Lift:

> Before shipping `es_savestates.cfg`, test auto-resume and incremental-slot behaviour on a real device; creating the file is a launch-behaviour migration, not merely a directory-template change.

There is no unique new safe detector mechanism in this shorter plan. Its useful contribution is keeping that hardware gate visible.

**Do not build unchanged:**

- the one-way stopgap;
- an engine that merely strips `--delete-excluded` while otherwise inheriting arbitrary `RCLONEOPTS`;
- batch allocation relying only on refresh;
- “atomic bundle resolution” without unit-level classification and interrupted-publication semantics.

Its conservative unknown rule also needs narrowing: unknown **provenance** is not itself a fork. A genuinely cloud-only legacy file should still restore without demanding an impossible comparison choice. [S3]

---

### `mistral-revised_plan.md`

**Distinct contribution worth retaining:** observe moves instead of trying to reconstruct every occurrence from final hashes.

Lift:

> ES move operations must update the placement/predecessor record when they occur; a later content scan cannot reliably reconstruct a move after the destination has also been overwritten.

This supplies the missing mechanism in Claude’s rename-then-edit example without first requiring a second identity system.

Its kid/kiosk accessibility test is also valuable, provided the desired access policy is decided rather than assumed.

**Do not build unchanged:**

- the metadata-only hashless detector;
- categorical, unverified bisync claims;
- the lossless stopgap;
- default-file-only discard protection;
- the invented attribution of a three-copy discard default to the IA;
- “never overwrite without explicit choice” as a literal rule for all files.

That last phrase would turn ordinary verified one-sided updates into prompts, contrary to the agreed conflict table. The intended rule should concern divergent or unverified overwrites.

The proposed `D-CLOUD-031-A` through `-E` labels must also remain clearly marked as proposals. They are not existing register decisions.

---

## 5. The smallest useful experiment sequence

These are acceptance gates, not a request to build every proposed subsystem first.

1. **Repair and validate the test instrument.**  
   Disposable GENERIC_X64 only. Preserve configuration before mutation, prove cleanup, use exact paths and destination bytes, repair dated-archive expectations, and reconcile content fixtures with the current allowlist. Then run both WebDAV and MinIO. [S36]

2. **Run the inexpensive counterexamples first.**  
   Exit-only overwrite; same-size staged cloud change; disjoint-member unit fork; stale tombstone after path reuse; three-pass duplicate convergence. These can eliminate incorrect designs before hardware UI work.

3. **Run the version-specific rclone spike.**  
   Dry-run and actual disposable writes; WebDAV, MinIO, then device-to-Dropbox. Include external equalization and unchanged-versus-changed filter files. Record inventories and hashes, not just exit codes.

4. **Prove lifecycle and merge behaviour.**  
   Protected H700 fixtures: boot overlap, offline/lock-skipped capture, auto-only allocation, multiple pending merges, failed state/PNG copy, and repository refresh invalidation. Rehearse #10 on the actual target before enabling that layout.

5. **Run #19 as required by D-CLOUD-025.**  
   Same-chipset control first, then cross-family and version cases, then corruption tests that distinguish compression rejection from core behaviour. Results qualify the tested core/build combinations, not all cores by extrapolation. [S8, S20]

6. **Interrupt apply and publication deliberately.**  
   Verify every pre-apply distinct version remains recoverable, incomplete units cannot be consumed, stale results do not report success, and retry does not repeat a destructive action against a different occupant.

7. **Price and press through the finished path.**  
   Count process starts and remote operations on H700; test A-exit/B-start handoff on a hashless backend; test real PNG recognition on RG351M; exercise pending-conflict discovery, cancellation, auto KEEP BOTH, and the chosen kid/kiosk policy.

A field census can then measure auto-conflict frequency and usability. It cannot substitute for these constructed failures. A read-only detector run only **after** a legacy overwrite also cannot recover the overwritten input needed to judge that overwrite; shadow observations must preserve their inputs.

### What I would take into the build document

The resulting starting specification would be Claude’s integration outline, with:

- Kimi’s self-contained origin metadata and bounded outside-tree discard store;
- verified, selective staging rather than Kimi’s metadata-authoritative mirror;
- Gemini’s real-device #10 gate;
- Mistral’s move observation;
- unit-level three-way classification;
- conservative ordinary-deletion semantics plus explicit duplicate convergence;
- a minimal durable apply-recovery contract;
- a measured changed-file exit path.

That is a case for one document with explicit corrections—not an average of the four.

**Change-of-mind limitation:** my own revised plan is not embedded in this prompt. I cannot honestly claim a sentence-by-sentence change from it, or use these plans’ descriptions of it as evidence. The judgments above are the positions I can substantiate from the currently supplied material.

---

## Corpus gaps surfaced to the orchestrator

Before the corresponding claims can be called verified, supply:

- rclone 1.75.0 source or version-specific documentation, and the actual spike traces;
- full ES headers, filesystem helpers, launcher/process implementation, and `GuiSaveState.cpp`;
- RetroArch launch/configuration plumbing for #10;
- current content-transfer scripts and the QA backend helper;
- current issue bodies with edited acceptance criteria;
- executed compatibility and round-trip results;
- this member’s earlier revision, if a retrospective change-of-mind comparison is required.

No filesystem locations or hashes for that missing material are inferred below.

## `corpus.provenance.json`

```json
{
  "corpus_mode": "facilitator_embedded_read_at_time",
  "source_count": 42,
  "source_reference_order": "S1 through S42; source_file_paths and source_file_hashes are positionally aligned",
  "hash_verification": "SHA-256 values supplied as verified at embed time by the Council Facilitator; copied from the source headers",
  "independently_reread_files": false,
  "independently_rehashed_files": false,
  "commands_or_hardware_tests_performed": false,
  "manifest_read_timestamp_utc_as_supplied": "2026-09-05T17:32:51Z",
  "reviewed_plan_filenames": [
    "claude-revised_plan.md",
    "gemini-revised_plan.md",
    "kimi-revised_plan.md",
    "mistral-revised_plan.md"
  ],
  "reviewed_plan_hashes_supplied": false,
  "earlier_own_revision_available": false,
  "earlier_peer_review_artifacts_independently_available": false,
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
      "description": "rclone 1.75.0 implementation, version-specific bisync documentation, roadmap, and executed spike traces",
      "declared_source_path": null,
      "sha256": null
    },
    {
      "description": "Full ES headers, filesystem helpers, launcher/process implementation, and GuiSaveState.cpp",
      "declared_source_path": null,
      "sha256": null
    },
    {
      "description": "RetroArch launch and directory-configuration plumbing needed for the #10 behavioural migration",
      "declared_source_path": null,
      "sha256": null
    },
    {
      "description": "Current content-transfer scripts, cloud setup implementation, backuptool, and QA backend helper",
      "declared_source_path": null,
      "sha256": null
    },
    {
      "description": "Current issue bodies with edited acceptance criteria, separately from the embedded comment-thread exports",
      "declared_source_path": null,
      "sha256": null
    },
    {
      "description": "Executed round-trip, compatibility, concurrency, and interrupted-apply test results",
      "declared_source_path": null,
      "sha256": null
    },
    {
      "description": "This member's earlier revised plan and the earlier analyses and peer reviews referenced inside the injected plans",
      "declared_source_path": null,
      "sha256": null
    }
  ]
}
```

=== END gpt_peer_review-r2.md ===

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
