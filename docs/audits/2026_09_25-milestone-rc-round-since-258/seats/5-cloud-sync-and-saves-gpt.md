## Summary

This bucket adds cloud-transfer orchestration, save capture, settings-backup retention, content matching, and asynchronous save-state bookkeeping. It should not be cleared for release on the supplied evidence. A failed per-system cloud listing can authorize deletion of local content, and the content exclusions omit the newly supported N64 `.fla` saves. Migration can erase writes made after verification, move nested settings and content into the saves tier, and leave an interrupted device pointing at an emptied source. Other findings concern lost manifest updates, success reported after failed phases, cancellation, and leaked joinable threads. This is a static review of the embedded corpus; no files were independently read or hashed, and no tests were executed.

## Findings

**Citation convention:** `[S1]` is the embedded diff; `[S2]`–`[S7]` are the embedded audit standards and rules. Their exact declared paths and Facilitator-verified hashes are recorded in `corpus.provenance.json` under **Coverage boundary**. “Where” identifies a file and hunk inside `[S1]`, not a separately inspected checkout file.

### F-CS-01: A failed system listing authorizes local deletion
- **Severity:** Critical
- **Category:** Data loss
- **Where:**
  - `projects/ROCKNIX/packages/network/rclone/sources/cloud_content_restore:@@ -0,0 +1,1128 @@` — `match_plan_one`, `match_run`
- **What:** `match_plan_one` treats an unsuccessful or empty per-system listing as proof that the system is absent from the cloud. Applying that plan deletes the local content without establishing that absence.
- **Failure scenario:** The initial ROMs-root listing succeeds. The connection then fails while listing `ROMs/nes`; the script sizes the local NES directory, returns a `remove` plan, and deletes its files locally.
- **Evidence:** The branch is `if rclone lsf "${src}" ... | grep -q .; then ... else ... remove`. The earlier `cloud_root_populated` guard does not refute this: it checks a different path at an earlier time. The local deletion can succeed without another network check. `[S1]`
- **Fix:** Distinguish successful empty listings from failed listings, positively establish absence, and abort before deletion on an unreadable system. Add a regression that drops the connection after the root check.
- **Confidence:** high — the failure-to-deletion branch is explicit.

### F-CS-02: Content matching can delete N64 `.fla` saves
- **Severity:** Critical
- **Category:** Data loss
- **Where:**
  - `projects/ROCKNIX/packages/network/rclone/sources/cloud_sync-rules.txt:@@ -14,6 +27,19 @@`
  - `projects/ROCKNIX/packages/network/rclone/sources/cloud_content_backup:@@ -0,0 +1,600 @@` — `content_files`, `SAVE_EXCLUDES`
  - `projects/ROCKNIX/packages/network/rclone/sources/cloud_content_restore:@@ -0,0 +1,1128 @@` — `SAVE_EXCLUDES`, `content_files`, `cloud_content_filter`
- **What:** The saves allowlist adds `.fla`, but the content tier's exclusions and counting predicates do not. These game saves consequently qualify as content to upload, overwrite, or delete.
- **Failure scenario:** A selected N64 directory contains `Game.fla`, which the cloud's content directory lacks. A content match deletes it as an extra ROM-tier file.
- **Evidence:** The new saves rule is `+ /**/*.fla`; content excludes stop at `*.eep`, `*.mpk`, and `*.sra` before proceeding to other extensions. No `.fla` exclusion appears in either content script. `[S1]`
- **Fix:** Add `.fla` to every corresponding content exclusion and counting predicate. Test backup, restore, and match with a `.fla` sentinel that must remain untouched.
- **Confidence:** high — the conflicting tier definitions are visible together.

### F-CS-03: Apply recomputes rather than enforces the approved deletion plan
- **Severity:** Critical
- **Category:** Data loss
- **Where:**
  - `projects/ROCKNIX/packages/network/rclone/sources/cloud_content_restore:@@ -0,0 +1,1128 @@` — `match_run`, `--match` dispatch
- **What:** `--match --apply` generates a fresh plan and uses that plan's count for `--max-delete`. It does not enforce the earlier preview the player approved.
- **Failure scenario:** Preview reports one deletion. Before apply, additional local-only files appear or remote files disappear. Apply recomputes a larger count and deletes the larger set without another approval.
- **Evidence:** Both preview and apply execute `planned=$(match_plan_one "${sys}")`; apply passes the newly read `files` to `--max-delete`. I looked for a saved plan, approval token, or supplied deletion limit; the apply dispatch supplies none. `[S1]`
- **Fix:** Bind approval to a persisted plan identifying the affected files and relevant versions. Refuse or seek renewed approval when that plan changes; a newly calculated count is not the approved limit.
- **Confidence:** high — the command's own preview/apply contract has no binding mechanism.

### F-CS-04: Retire validates a root-relative path but unlinks the raw argument
- **Severity:** Critical
- **Category:** Data loss
- **Where:**
  - `projects/ROCKNIX/packages/network/rclone/sources/cloud_capture:@@ -0,0 +1,1534 @@` — `retire_rel`, `RETIRE_ACCEPTED`, `finish`
- **What:** Relative retirement arguments are interpreted under `ROOT` for recording but are retained unchanged for `rm`. The unlink therefore acts relative to the process's working directory, potentially outside the saves tree.
- **Failure scenario:** From another directory containing `Game.srm`, invoke `--retire --unlink Game.srm`. The recorder looks for `${ROOT}/Game.srm`, but `finish` deletes the working directory's `Game.srm`, even if nothing was recorded.
- **Evidence:** Acceptance stores `RETIRE_ACCEPTED+=("${_raw}")`; unlink executes `rm -f -- "${_p}"`. No `cd "${ROOT}"` or conversion to an anchored absolute path intervenes. The lexical check also does not resolve symlinked parent directories. `[S1]`
- **Fix:** Store and use one validated, root-anchored path for both recording and unlinking. Reject escapes through relative paths and symlinked parents.
- **Confidence:** high — recording and deletion use different path interpretations.

### F-CS-05: An incomplete allowlist can replace the live rules
- **Severity:** Critical
- **Category:** Data loss
- **Where:**
  - `projects/ROCKNIX/packages/network/rclone/sources/cloud_sync_helper:@@ -36,13 +36,24 @@`
  - `projects/ROCKNIX/packages/network/rclone/sources/cloud_sync_helper:@@ -50,38 +61,83 @@`
  - `projects/ROCKNIX/packages/network/rclone/sources/cloud_backup:@@ -188,36 +786,164 @@` — `load_config`
  - `projects/ROCKNIX/packages/network/rclone/sources/cloud_restore:@@ -264,36 +852,160 @@` — `load_config`
- **What:** Errors while assembling the rules do not prevent their installation. The supposed catch-all validation also matches ordinary exclusions such as `- /**/*.db`, so it does not establish that the final deny-all survived.
- **Failure scenario:** Storage fills while writing `rules.new`, before `- /**`. The subsequent rename installs the partial filter; a sync restore can then regard non-save files as eligible destination deletions.
- **Evidence:** `cat ... >> "${rules}.new"` is followed by unconditional `mv -f`; the test is `grep -q '^- /\*\*'`, without an end anchor. Neither transfer script checks the helper's exit status. Atomic rename prevents torn publication, not publication of an already incomplete candidate. `[S1, S4]`
- **Fix:** Check every construction step, validate the complete candidate including the exact catch-all, and publish only on success. Otherwise retain/recover the previous rules and refuse unsafe transfers.
- **Confidence:** high — write failures and the false-positive validation are not guarded.

### F-CS-06: Clock-ordered pruning can delete the recovery copy just created
- **Severity:** Critical
- **Category:** Data loss
- **Where:**
  - `projects/ROCKNIX/packages/network/rclone/sources/cloud_backup:@@ -342,43 +1220,95 @@` — `prune_replaced_remote`
  - `projects/ROCKNIX/packages/network/rclone/sources/cloud_backup:@@ -400,90 +1330,257 @@` — replacement directory
  - `projects/ROCKNIX/packages/network/rclone/sources/cloud_backup:@@ -491,29 +1588,332 @@` — settings retention
  - `projects/ROCKNIX/packages/network/rclone/sources/cloud_restore:@@ -415,30 +1260,144 @@` — `prune_replaced_local`
- **What:** Retention equates lexical timestamp order with successful-run order. A future-dated old folder or archive can cause the current run's newly protected version to be deleted.
- **Failure scenario:** An existing replacement folder is dated in the future. Today's backup replaces a cloud save and keeps its former bytes under today's folder; pruning deletes today's folder and retains the future-dated one.
- **Evidence:** Replacement pruning uses `sort -r | tail -n +2`; settings retention similarly sorts names. None pins the actual current run's recovery folder or uploaded archive. The settings upload marker is written before pruning, so deletion of that upload can also suppress subsequent retransmission. `[S1, S3, S4]`
- **Fix:** Retain the actual newly committed recovery record independently of wall-clock ordering. Do not remove it based on another device's filename timestamp.
- **Confidence:** high — the supplied corpus explicitly anticipates unreliable device clocks, but pruning does not.

### F-CS-07: Migration purges source versions it never copied
- **Severity:** Critical
- **Category:** Data loss
- **Where:**
  - `projects/ROCKNIX/packages/network/rclone/sources/cloud_migrate_layout:@@ -0,0 +1,323 @@` — `relocate`
- **What:** A point-in-time copy and check are followed by purging the entire source. There is no coordination with writers and no restriction to the versions actually verified.
- **Failure scenario:** Another handheld writes a new save to the source after `rclone check` finishes but before `rclone purge`. Purge removes that save although the destination never received it.
- **Evidence:** The sequence ends with `rclone purge "${src}"`; the complete script contains no transfer-lock acquisition or conditional, version-specific deletion. A successful earlier check cannot refute a later write. The upgrade rules expressly require considering another syncing device. `[S1, S3]`
- **Fix:** Do not purge a shared source under this protocol. Use a migration protocol that accounts for concurrent versions, or retain the source until writers are safely coordinated; also require successful verification status.
- **Confidence:** high — the destructive interleaving follows directly from the command sequence.

### F-CS-08: Migrating the original layout puts other tiers inside Saves
- **Severity:** High
- **Category:** Upgrade path
- **Where:**
  - `projects/ROCKNIX/packages/network/rclone/sources/cloud_migrate_layout:@@ -0,0 +1,323 @@` — `has_files`, `main`, `relocate`
- **What:** Exclusions used to decide whether saves exist are not applied to their relocation. Moving the original `/GAMES` saves root also moves its nested backups, content, and unrelated files.
- **Failure scenario:** `/GAMES` contains a save, `/GAMES/backup`, and `/GAMES/Content`. The first relocation copies all three under `/ROCKNIX/Saves` and purges `/GAMES`; later phases find their old sources absent and repoint to empty sibling destinations.
- **Evidence:** `has_files` excludes `backup/**` and `Backups/**`, but `relocate` performs an unfiltered copy and purge. I found no equivalent exclusions or tier extraction in the actual transfer. `[S1, S3]`
- **Fix:** Partition the migration into explicitly owned tier payloads. Never relocate the shared parent wholesale; verify each destination before changing its pointer.
- **Confidence:** high — this is the original layout described by the script itself.

### F-CS-09: Interrupted migration leaves stale pointers and cannot resume
- **Severity:** High
- **Category:** Upgrade path
- **Where:**
  - `projects/ROCKNIX/packages/network/rclone/sources/cloud_migrate_layout:@@ -0,0 +1,323 @@` — `relocate`, destination checks, configuration updates
- **What:** Sources are removed before the configuration points to their replacements. A later failure or interruption leaves old pointers, and the resumption check rejects a destination whose source has already been removed.
- **Failure scenario:** Saves relocate and their source is purged. The process stops before updating `SAVES_REMOTE`. A rerun sees the destination but cannot prove it is a subset of the now-missing source, so it refuses.
- **Evidence:** Configuration edits occur after both relocations. Moreover, the loop checks both `NEW_SAVES` and `NEW_BACKUPS` with `resumable "${remote}${saves_src}" ...`, using the saves source even for backups. No migration journal or completed-phase handling refutes either problem. `[S1, S3]`
- **Fix:** Make pointer changes and source retirement recoverable across interruption. Track each tier separately and compare a backup destination with its backup source.
- **Confidence:** high — both the ordering and incorrect source argument are explicit.

### F-CS-10: Migration treats cloud read failures as empty sources
- **Severity:** High
- **Category:** Upgrade path
- **Where:**
  - `projects/ROCKNIX/packages/network/rclone/sources/cloud_migrate_layout:@@ -0,0 +1,323 @@` — `has_entries`, `has_files`, `exists`, `main`, `migrate_content`
- **What:** Migration presence tests discard listing errors. Apply can consequently change pointers and report completion without copying data that remains at the old location.
- **Failure scenario:** The remote is configured but unreachable. Listings produce no stdout, relocation is skipped, and the script changes saves/settings/content pointers to the new layout.
- **Evidence:** The predicates inspect `$(rclone lsf ... 2>/dev/null | head -1)` rather than successful listing status. The empty-source branches permit configuration updates. There is no successful-reachability prerequisite in `main`. `[S1]`
- **Fix:** Use distinct present, absent, and unreadable outcomes. Permit an empty-source pointer change only after successful reads establish absence; preserve configuration on read failure.
- **Confidence:** high — failure and absence collapse into the same branch.

### F-CS-11: A failed gamelist transfer still reports success
- **Severity:** High
- **Category:** Correctness
- **Where:**
  - `projects/ROCKNIX/packages/network/rclone/sources/cloud_content_backup:@@ -0,0 +1,600 @@` — transfer loop
  - `projects/ROCKNIX/packages/network/rclone/sources/cloud_content_restore:@@ -0,0 +1,1128 @@` — transfer loop
- **What:** Both content scripts ignore the result of their separate gamelist pass. Their outcome and stamp describe only the preceding transfer.
- **Failure scenario:** A `--media-only` run successfully performs its empty artwork pass, then fails to transfer `gamelist.xml`. It prints “Backed up” or “Restored” and stamps exit 0.
- **Evidence:** `RC=$?` precedes the gamelist command, which ends in `|| true`. The subsequent result branch consults only `RC`. The gamelist's separate `--update` semantics do not justify ignoring its failure. `[S1, S5]`
- **Fix:** Capture and aggregate both results, treating 0 and 9 consistently. Report and stamp a failed gamelist transfer as a failed tier.
- **Confidence:** high — the second result is explicitly discarded.

### F-CS-12: Saves exit 9 masks a settings-phase failure
- **Severity:** High
- **Category:** Correctness
- **Where:**
  - `projects/ROCKNIX/packages/network/rclone/sources/cloud_backup:@@ -522,53 +1922,88 @@` — overall result
  - `projects/ROCKNIX/packages/network/rclone/sources/cloud_restore:@@ -599,23 +1854,43 @@` — overall result
- **What:** Both reducers treat only saves exit 0 as success when deciding whether to consider the settings result. Saves exit 9 therefore hides a failed settings phase.
- **Failure scenario:** Saves return 9 and settings return 5. The script exits 9, prints “Completed,” and performs successful-run cleanup.
- **Evidence:** Both use `overall=${...STATUS}; [ "${overall}" -eq 0 ] && overall=${...SYSTEM_STATUS}`. Their own `outcome_word` and completion branches accept `0|9`, which refutes treating 9 as the first failure. `[S1]`
- **Fix:** Normalize successful phase results or select the first result outside `{0,9}`. Test both scripts with saves 9/settings failure.
- **Confidence:** high — contradictory success definitions are present in the same scripts.

### F-CS-13: Content `--all` omits BIOS and changes filter meaning
- **Severity:** High
- **Category:** Correctness
- **Where:**
  - `projects/ROCKNIX/packages/network/rclone/sources/cloud_content_restore:@@ -0,0 +1,1128 @@` — `remote_for`, `resolve_src`, `MEDIA_EXCLUDES`, `--all`
- **What:** `--all` selects one empty directory name, which resolves to the ROMs container rather than ROMs plus BIOS. Using that container as the transfer root also invalidates media filters anchored to a system root.
- **Failure scenario:** Restoring a cloud containing `ROMs/nes/Game.nes` and `BIOS/...` succeeds without restoring BIOS. Default ROMs-only mode can also bring down `nes/images/...`, because `/images/**` no longer matches that nested path.
- **Evidence:** `--all` sets `DIRS=("")`; `remote_for("")` yields `"${ROOT}ROMs/"`. Only `--selected` explicitly appends BIOS. The transfer still uses root-anchored media patterns. `[S1]`
- **Fix:** Enumerate systems and BIOS as separate units for `--all`, retaining each system's normal transfer root and legacy-resolution rules.
- **Confidence:** high — both errors follow from the constructed source path.

### F-CS-14: Capture commits, garbage collection, and stamps race other captures
- **Severity:** High
- **Category:** Concurrency
- **Where:**
  - `projects/ROCKNIX/packages/network/rclone/sources/cloud_capture:@@ -0,0 +1,1534 @@` — `finish`, steps 10–11
- **What:** The final manifest check and rename are not an atomic conditional update. Uncoordinated garbage collection and per-mode stamp merging introduce additional lost-state races.
- **Failure scenario:** Two captures both pass the final `stat` check, then overwrite one another's manifests. Separately, one capture can delete another's newly sealed hash before that second capture publishes its entry.
- **Evidence:** The script checks `stat`, performs a card identity call, and later runs `mv`. GC protects only hashes read from the current manifest; it does not protect another writer's pending seals. `last-capture` is another read-modify-rename without writer coordination. The one retry only handles changes detected before the check. `[S1]`
- **Fix:** Introduce a real single-writer or capture-local commit protocol covering document publication, active seals, GC, and stamp merging. Do not reuse the cloud-transfer lock, which ordinary capture must not wait on.
- **Confidence:** high — concrete interleavings bypass the advertised detection.

### F-CS-15: Save-state mutation is not serialized with cloud transfers
- **Severity:** High
- **Category:** Concurrency
- **Where:**
  - `es-app/src/guis/GuiSaveState.cpp:@@ -222,6 +409,19 @@`
  - `es-app/src/guis/GuiSaveState.cpp:@@ -229,13 +429,30 @@`
  - `es-app/src/guis/GuiSaveState.cpp:@@ -246,15 +463,35 @@`
  - `es-app/src/SaveStateBookkeeper.cpp:@@ -0,0 +1,191 @@`
- **What:** DELETE and COPY check only a UI singleton, not the transfer lock. A queued deletion executes later without rechecking even that singleton.
- **Failure scenario:** A deletion confirmation opens while no sync runs; a sync starts before YES or before the worker executes. The worker retires and unlinks files under an active transfer. A script-started transfer is invisible to the singleton check throughout.
- **Evidence:** The check occurs before opening the dialog; its callback calls `deleteLater`, and `runDelete` has no transfer synchronization. The queue serializes bookkeeping jobs only. `[S1]`
- **Fix:** Serialize actual tree mutations with transfer execution and initiation, including confirmation and worker delays. Keep ordinary provenance capture independent of that gate.
- **Confidence:** high — the execution-time synchronization is absent from the complete worker implementation.

### F-CS-16: Every sync leaks a joinable thread
- **Severity:** High
- **Category:** Resource
- **Where:**
  - `es-app/src/ThreadedCloudSync.cpp:@@ -0,0 +1,840 @@` — constructor, destructor, `run`
  - `es-app/src/ThreadedCloudSync.h:@@ -0,0 +1,178 @@` — `mHandle`
- **What:** Each sync allocates a joinable `std::thread`, but nothing joins, detaches, or deletes it. Self-deleting the containing object does not release the thread object or joinable-thread resources.
- **Failure scenario:** Repeated game exits accumulate unreaped thread resources until thread creation or memory allocation fails.
- **Evidence:** Construction uses `mHandle = new std::thread(...)`; `run` ends with `delete this`. The complete destructor only closes the notification and handles the singleton. I found no ownership transfer or reaper. `[S1]`
- **Fix:** Use an explicit thread-lifetime model: an owner that joins, or a detached worker holding safe shared ownership until completion.
- **Confidence:** high — the complete lifetime contains no reclamation.

### F-CS-17: ZIP integrity failures fall through to a successful listing
- **Severity:** High
- **Category:** Correctness
- **Where:**
  - `projects/ROCKNIX/packages/network/rclone/sources/cloud_backup:@@ -172,6 +602,152 @@` — `archive_whole`
  - `projects/ROCKNIX/packages/network/rclone/sources/cloud_backup:@@ -491,29 +1588,332 @@` — archive validation and upload
- **What:** A ZIP listing is accepted as proof of integrity. Even where `unzip -t` is supported and detects damaged contents, a successful listing overrides that failure.
- **Failure scenario:** A ZIP has an intact central directory but a damaged compressed member or CRC. It lists successfully, is uploaded, and is accepted by the remote byte-count check as a good backup.
- **Evidence:** `unzip -t "$1" ... || unzip -l "$1" ...` cannot distinguish an unsupported test option from a failed integrity test. Listing the directory does not verify member contents; the later check compares sizes only. `[S1]`
- **Fix:** Use a supported operation that reads and verifies every member. Detect unsupported test capability separately; never downgrade a real integrity failure to a listing.
- **Confidence:** high — the fallback defeats the validation it is meant to provide.

### F-CS-18: Content migration failure is discarded by the caller
- **Severity:** High
- **Category:** Correctness
- **Where:**
  - `projects/ROCKNIX/packages/network/rclone/sources/cloud_migrate_layout:@@ -0,0 +1,323 @@` — final `migrate_content` call in `main`
- **What:** After migrating saves/settings, `main` ignores failure from `migrate_content` and returns success.
- **Failure scenario:** Content relocation refuses a foreign destination or fails during copying. The final output still says “Done,” and the command exits 0.
- **Evidence:** The call is followed by unconditional final messages and `return 0`. The earlier “saves/settings already current” branch does return `$?`, showing that propagation exists in one route but not this one. `[S1]`
- **Fix:** Propagate the content result and report the actual partial migration state. Emit a structured reason for migration-specific refusals rather than relying on rclone exit-code wording.
- **Confidence:** high — the status is visibly overwritten.

### F-CS-19: The sync card confuses bytes attempted with saves committed
- **Severity:** High
- **Category:** Correctness
- **Where:**
  - `es-app/src/ThreadedCloudSync.cpp:@@ -0,0 +1,840 @@` — `mMoved`, outcome selection, `inPlaceClause`
  - `es-app/src/CloudText.cpp:@@ -0,0 +1,902 @@` — `exitSyncOwed`
- **What:** The card treats any nonzero transferred-byte counter as completed movement and reports exit 69 as “SKIPPED” without considering progress. This disagrees with the transfer page's explicit handling of interrupted work.
- **Failure scenario:** An S3 upload sends bytes but commits no file before the link fails. The card records a skip and selects wording for data that reached the cloud. If an earlier file did commit, calling the whole run skipped is also inaccurate.
- **Evidence:** `live.sent > 0` sets `mMoved`; the 69 branch ignores it and completed-file counts. `[S4]` documents S3's commit-or-nothing behavior, and `GuiCloudTransfer` explicitly avoids using attempted bytes as committed files. `[S1]`
- **Fix:** Track committed files and distinguish “nothing ran” from interrupted work. Preserve the no-network retry cause separately so `exitSyncOwed` still schedules the owed sync.
- **Confidence:** high — the counter and backend semantics are both documented in the corpus.

### F-CS-20: Saves-root recording can succeed without recording anything
- **Severity:** Medium
- **Category:** Correctness
- **Where:**
  - `projects/ROCKNIX/packages/network/rclone/sources/cloud_saves_root:@@ -0,0 +1,175 @@` — `write_record`, `record`, `accept`
  - `projects/ROCKNIX/packages/network/rclone/sources/cloud_backup:@@ -400,90 +1330,257 @@` — post-transfer root recording
  - `projects/ROCKNIX/packages/network/rclone/sources/cloud_restore:@@ -481,79 +1481,316 @@` — post-transfer root recording
- **What:** `record` and `accept` return 0 even if persisting the identity fails. The transfer callers also invoke `record` after some failed transfers, despite describing it as a successful-sync record.
- **Failure scenario:** The cache filesystem is full or read-only. A completed transfer leaves no root record, but subsequent runs continue treating the device as never recorded. Alternatively, a failed first transfer can establish an identity as if it succeeded.
- **Evidence:** `write_record` errors fall into cleanup; its callers then explicitly `exit 0`. Transfer status does not guard the post-transfer `record` call. `[S1]`
- **Fix:** Propagate persistence errors and record only an accepted successful phase. Report a failed safety-record write rather than silently leaving the guard unarmed.
- **Confidence:** high — error results are explicitly suppressed.

### F-CS-21: A no-op full capture deletes the quarantined manifest
- **Severity:** Medium
- **Category:** Correctness
- **Where:**
  - `projects/ROCKNIX/packages/network/rclone/sources/cloud_capture:@@ -0,0 +1,1534 @@` — manifest loading, no-ops exit, `finish`
- **What:** A successful no-op is sufficient to delete quarantined manifests, even when no replacement manifest was written.
- **Failure scenario:** `--full` encounters a malformed manifest in a nonempty saves tree. It moves the manifest aside, has no entries to scan, reaches the empty-ops exit, and deletes the quarantine while recording success.
- **Evidence:** Invalid input leaves `SRC="/dev/null"`; empty `OPS` calls `finish "${RC}"`, normally 0. `finish` removes `"${MANIFEST}".corrupt-*` solely on rc 0 and a nonempty manifest pathname. It does not require a valid replacement file. `[S1]`
- **Fix:** Keep quarantined data until a valid replacement has actually been committed. A no-op after rejecting the source is not evidence of recovery.
- **Confidence:** high — the entire path is present in the new script.

### F-CS-22: Adopt can inherit another game's unit and can falsely report recording
- **Severity:** Medium
- **Category:** Correctness
- **Where:**
  - `projects/ROCKNIX/packages/network/rclone/sources/cloud_capture:@@ -0,0 +1,1534 @@` — adopt preflight, step 7b, copy merge
  - `es-app/src/SaveStateBookkeeper.cpp:@@ -0,0 +1,191 @@` — `runCopy`
- **What:** Adopt validates destination membership but does not validate the source entry's unit before inheriting it. Its earlier empty-unit exit also returns success before applying the promised nonmember result.
- **Failure scenario:** A destination state for game A has the same bytes as a recorded state for game B; using B as `--from` copies B's `.unit`, system, and ROM into A's entry. With no members present, an invalid adoption instead exits 0 and is logged as recorded.
- **Evidence:** The inheritance condition checks source hash equality, not `E_UNIT`; the merge copies the source entry wholesale. `M_PATHS == 0` calls `finish 0` before adopt validation. `[S1]`
- **Fix:** Validate both paths' unit/kind before provenance inheritance, and return the documented nonmember result on every nonmember path.
- **Confidence:** high — both validation gaps are explicit.

### F-CS-23: Cancellation restamps the wrong transfer records
- **Severity:** Medium
- **Category:** Correctness
- **Where:**
  - `es-app/src/CloudTransferJob.cpp:@@ -0,0 +1,699 @@` — `restampStoppedParts`
  - `projects/ROCKNIX/packages/network/rclone/sources/cloud_backup:@@ -172,6 +602,152 @@` — `record_last_run`
  - `projects/ROCKNIX/packages/network/rclone/sources/cloud_restore:@@ -248,6 +638,182 @@` — `record_last_run`
- **What:** Cancellation maps script names to saves stamps without accounting for `--system-only`. It also restamps any matching recently written stamp, including a part that completed before cancellation.
- **Failure scenario:** Cancelling a settings-only backup leaves `last-settings-backup` as a generic stopped failure. In a multi-tier run, a successful saves stamp can instead be rewritten as cancelled when a later phase is stopped.
- **Evidence:** `PARTS` maps `cloud_backup` only to `last-backup` and `cloud_restore` only to `last-restore`; eligibility is an mtime test, not the phase's actual result. `[S1]`
- **Fix:** Track actual started/completed parts and their exact stamp paths. Restamp only the interrupted part, preserving completed outcomes.
- **Confidence:** high — script stamp selection and cancellation selection demonstrably disagree.

### F-CS-24: Cancellation before the PID announcement never reaches the process
- **Severity:** Medium
- **Category:** Concurrency
- **Where:**
  - `es-app/src/CloudTransferJob.cpp:@@ -0,0 +1,699 @@` — `stopByPlayer`, PID handling, `run`
- **What:** A cancellation received while `mPid` is zero sets the cancellation flag but sends no signal. Receiving the PID later does not act on the pending cancellation.
- **Failure scenario:** The worker is delayed before processing its initial PID line. The player cancels; the command subsequently runs to completion, after which the page says it was cancelled.
- **Evidence:** `stopByPlayer` signals only `pid > 0`; the PID handler merely assigns `mPid`. Unlike `ThreadedCloudSync::cancelForLaunch`, there is no retry or later cancellation check. `[S1]`
- **Fix:** Deliver pending cancellation immediately when the PID becomes available, with a bounded termination path. Do not label an uncancelled, completed command as skipped.
- **Confidence:** high — the lost-signal interleaving is explicit.

### F-CS-25: The sync singleton is accessed with a C++ data race
- **Severity:** Medium
- **Category:** Concurrency
- **Where:**
  - `es-app/src/ThreadedCloudSync.cpp:@@ -0,0 +1,840 @@` — `start`, `run`, destructor
  - `es-app/src/ThreadedCloudSync.h:@@ -0,0 +1,178 @@` — `isRunning`, `mInstance`
- **What:** `mInstance` is a non-atomic pointer read outside its mutex while the worker writes it. The start predicate is also checked before acquiring the mutex and is not rechecked inside it.
- **Failure scenario:** The interface reads `isRunning()` while completion clears the pointer: this is a C++ data race. Concurrent starters can both pass the preliminary check.
- **Evidence:** `isRunning()` directly returns `mInstance != nullptr`; `run` changes it under `sInstanceLock`, while the destructor also accesses it without that lock. Locking only the writer does not synchronize these reads. `[S1]`
- **Fix:** Synchronize every access and perform the check-and-install inside one critical section, with object lifetime protected through dereferences.
- **Confidence:** high — the unsynchronized accesses are visible; no crash is claimed as observed.

### F-CS-26: Match reports planned removals as actual removals and promises nonexistent backups
- **Severity:** Medium
- **Category:** Correctness
- **Where:**
  - `projects/ROCKNIX/packages/network/rclone/sources/cloud_content_restore:@@ -0,0 +1,1128 @@` — `match_run`
  - `es-app/src/guis/GuiCloudTransfer.cpp:@@ -0,0 +1,948 @@` — completed-page removal summary and recovery note
- **What:** Match increments removal totals before attempting deletion and emits them even after failure. Its recovery note also says the cloud still holds files whose absence from the cloud was the reason for deleting them.
- **Failure scenario:** A read-only card prevents all three planned deletions, but the page says three files were removed. If a local-only file was removed before a later failure, “YOUR CLOUD STILL HAS IT” is false.
- **Evidence:** Totals are updated before `rclone delete`/`sync`; `>>> removed` publishes those totals on failure too. The page renders them as `REMOVED`, not “planned.” No actual-deletion accounting or backup creation refutes this. `[S1, S5]`
- **Fix:** Report confirmed removals, or explicitly report an unknown count. Explain that matching removes local-only content irreversibly; use match-specific cancellation/recovery wording.
- **Confidence:** high — producer and consumer agree on a number with the wrong meaning.

### F-CS-27: Malformed status fields become successful runs
- **Severity:** Medium
- **Category:** Correctness
- **Where:**
  - `es-app/src/CloudText.cpp:@@ -0,0 +1,902 @@` — `parseLastRun`, tier protocol parsing
  - `es-app/tests/unit/CloudTextTests.cpp:@@ -0,0 +1,1220 @@`
- **What:** Status parsing converts invalid text to integer zero, which is then treated as success.
- **Failure scenario:** `1789000000 garbage` becomes a completed last run. `>>> tier SETTINGS|nonsense` becomes a successful tier.
- **Evidence:** Both paths use `atoi` without full-field validation. Tests explicitly require a nonsense tier code to become 0; the existing junk tests therefore do not refute the defect. Other parsers in the same file demonstrate strict numeric validation. `[S1]`
- **Fix:** Require a complete, bounded integer status. Treat absent or malformed statuses as invalid/unknown, never completed, and change the tests accordingly.
- **Confidence:** high — the failing inputs have deterministic parser results.

### F-CS-28: Reachable LAN remotes are rejected without a default route
- **Severity:** Medium
- **Category:** Correctness
- **Where:**
  - `projects/ROCKNIX/packages/network/rclone/sources/cloud_backup:@@ -34,6 +378,92 @@`
  - `projects/ROCKNIX/packages/network/rclone/sources/cloud_restore:@@ -30,6 +348,78 @@`
  - `projects/ROCKNIX/packages/network/rclone/sources/cloud_net_ready:@@ -0,0 +1,217 @@`
- **What:** A default route is made a prerequisite for syncing, although a directly connected LAN remote does not require one.
- **Failure scenario:** A handheld has a connected subnet route to its NAS but no gateway. The NAS is reachable, yet backup/restore exits 69 before probing it.
- **Evidence:** `check_network_link` exits when `has_default_route` fails; `cloud_net_ready` likewise rejects a connected local-only network without a default route. `[S4]` both documents this shortcut and requires supporting LAN remotes, so the convention itself needs reconciliation. `[S1]`
- **Fix:** Judge whether the configured remote can be reached, while retaining a fast offline check that does not exclude valid local routes.
- **Confidence:** high — the routing assumption is incorrect for the stated LAN case.

### F-CS-29: The oldest automatic bound needs two helper runs to reach 90 seconds
- **Severity:** Medium
- **Category:** Upgrade path
- **Where:**
  - `projects/ROCKNIX/packages/network/rclone/sources/cloud_sync_helper:@@ -109,39 +182,171 @@`
  - `projects/ROCKNIX/packages/network/rclone/sources/cloud_sync_helper:@@ -156,7 +361,76 @@`
- **What:** The new 20-to-90 migration runs before the older migration that adds five retries and one transfer. An earliest-version configuration therefore finishes the first helper run still carrying `--max-duration 20s`.
- **Failure scenario:** Seed the first-cut automatic option string without the retry/transfer suffix. One helper run raises `SYNC_CEILING_SECONDS` to 90 but later rewrites the option string to the intermediate 20-second value.
- **Evidence:** `migrate_default` matches only the suffixed 20-second string. The later `main` block recognizes the unsuffixed string and writes the suffixed 20-second string. No final normalization follows it. `[S1, S3]`
- **Fix:** Normalize all historical automatic defaults directly to the current value in one pass. Test each previously shipped shape.
- **Confidence:** high — the transformation order is explicit.

### F-CS-30: Content scans and transfers do not describe the same file set
- **Severity:** Medium
- **Category:** Correctness
- **Where:**
  - `projects/ROCKNIX/packages/network/rclone/sources/cloud_content_backup:@@ -0,0 +1,600 @@` — `content_files`
  - `projects/ROCKNIX/packages/network/rclone/sources/cloud_content_restore:@@ -0,0 +1,1128 @@` — `content_files`, `cloud_content_filter`, BIOS scan
- **What:** The local scanner, remote scanner, and transfer exclusions differ, producing persistent false differences.
- **Failure scenario:** `dc/shared/savefiles/card.dat` is counted remotely but excluded locally and from transfer. Conversely, remote `README.txt` is excluded from counts while the transfer and local scanner can carry and count it.
- **Evidence:** `cloud_content_filter` checks `seg[2]` for `save`, `memcards`, and `PPSSPP`, but not `shared/savefiles`; it drops `README.txt`, unlike `content_files`. BIOS scanning bypasses that filter and strips only README files. I found no subsequent normalization that restores parity. `[S1, S4]`
- **Fix:** Derive scans and transfers from the same scope definition, including BIOS and nested paths. Test equality after an actual round trip.
- **Confidence:** high — explicit predicates disagree.

### F-CS-31: Script-provided failure reasons bypass localization
- **Severity:** Medium
- **Category:** Player text
- **Where:**
  - `es-app/src/ThreadedCloudSync.cpp:@@ -0,0 +1,840 @@` — why handling and outcome composition
  - `es-app/src/CloudTransferJob.cpp:@@ -0,0 +1,699 @@` — why handling
  - `es-app/src/guis/GuiCloudTransfer.cpp:@@ -0,0 +1,948 @@` — failed-item detail
- **What:** English `>>> why` sentences are inserted unchanged into otherwise localized outcomes. Translating the exit-code fallback does not translate the normal script-reason path.
- **Failure scenario:** A French interface receives `>>> why YOUR CLOUD STOPPED ANSWERING` and displays that English sentence beside a French outcome.
- **Evidence:** The card selects `mWhy` directly instead of `whyForCode`; the page appends stored `f.why` directly. The parser deliberately leaves translation to callers, but neither caller performs it here. Catalog contents outside the packet cannot repair the missing lookup. `[S1, S5, S6]`
- **Fix:** Map protocol reasons to localized messages at the UI boundary, with corresponding French catalog entries and extraction coverage.
- **Confidence:** high — the bypass is in the visible composition paths.

### F-CS-32: One-line fitting cuts UTF-8 in the middle of a character
- **Severity:** Medium
- **Category:** Player text
- **Where:**
  - `es-app/src/guis/GuiCloudTransfer.cpp:@@ -0,0 +1,948 @@` — `fitOneLine`
- **What:** Truncation removes bytes rather than UTF-8 characters. It can pass malformed text to font measurement and return malformed text for display.
- **Failure scenario:** A long accented or non-Latin filename ends near the clipping boundary. Removing one continuation byte corrupts its last character.
- **Evidence:** The loop calls `text.pop_back()` and immediately measures the resulting string. No UTF-8 boundary handling intervenes, despite the reader explicitly preserving UTF-8 names. `[S1, S6]`
- **Fix:** Truncate at code-point boundaries, or use a UTF-8-aware fitting helper. Test multibyte filenames and French text at the width boundary.
- **Confidence:** high — bytewise removal can split any multibyte character; no crash is asserted.

### F-CS-33: Joined command-option replacement can modify a ROM filename
- **Severity:** Medium
- **Category:** Correctness
- **Where:**
  - `es-app/src/SaveState.cpp:@@ -40,7 +40,37 @@` — `_changeCommandlineArgument`
- **What:** The new joined-form branch replaces the last substring `--core=` or `--emulator=` without checking argument boundaries or quoting.
- **Failure scenario:** A command contains a real `--core=mgba` argument followed by a quoted ROM filename containing `--core=other`. Replacement modifies the filename instead of the option and can remove its closing quote.
- **Evidence:** The branch uses `commandLine.rfind(joined)` and ends the replacement at the next literal space. The token-boundary protection added below applies only to the legacy branch, so it does not refute this case. `[S1]`
- **Fix:** Replace parsed arguments, not substrings in a shell command. At minimum, handle token boundaries and quoted arguments consistently.
- **Confidence:** high — the string transformation is fully visible.

### F-CS-34: Advertised network ceilings do not cover all cloud commands
- **Severity:** Medium
- **Category:** Resource
- **Where:**
  - `projects/ROCKNIX/packages/network/rclone/sources/cloud_restore:@@ -562,6 +1799,7 @@` — main ordering
  - `projects/ROCKNIX/packages/network/rclone/sources/cloud_restore:@@ -7,6 +7,324 @@` — wrapper
  - `projects/ROCKNIX/packages/network/rclone/sources/cloud_backup:@@ -7,6 +7,350 @@` — wrapper
  - `projects/ROCKNIX/packages/network/rclone/sources/cloud_content_backup:@@ -0,0 +1,600 @@`
  - `projects/ROCKNIX/packages/network/rclone/sources/cloud_content_restore:@@ -0,0 +1,1128 @@`
- **What:** Automatic restore probes run before its deadline is initialized, and an expired deadline still grants each subsequent command time. Content transfers retain the ten-retry network options without the stall watchdog introduced to bound that behavior.
- **Failure scenario:** A preflight listing that keeps receiving data outlasts the automatic budget; a stalled S3 content transfer remains subject to the SDK backoff described in the corpus.
- **Evidence:** `check_internet` precedes `load_config`; deadline zero invokes bare `rclone`, and expired time is clamped to one second. Neither complete content script defines the stall wrapper. Idle timeout alone does not refute these cases. `[S1, S4]`
- **Fix:** Initialize enforcement before the first remote operation, stop after deadline expiry, and consistently apply the deliberate stall bound to content transfers.
- **Confidence:** high — enforcement gaps are visible; exact device timings were not measured here.

### F-CS-35: An undated legacy archive sorts newer than dated archives
- **Severity:** Medium
- **Category:** Upgrade path
- **Where:**
  - `projects/ROCKNIX/packages/network/rclone/sources/cloud_restore:@@ -481,79 +1481,316 @@` — newest-archive selection
- **What:** The fallback selector treats lexical order as chronology even though it deliberately accepts undated legacy archive names.
- **Failure scenario:** A folder with no archive matching this device's label contains an old `ROCKNIX_BACKUP.zip` and a newer `2026_...` archive. `sort | tail -1` chooses the undated `ROCKNIX...` file.
- **Evidence:** When `mine` is empty, the complete listing is sorted without separating dated and undated formats. The own-label preference does not refute the stated fallback case, which exists specifically for legacy/shared folders. `[S1, S3]`
- **Fix:** Parse supported naming formats explicitly. Do not assign chronology from lexical position to undated archives; use reliable metadata or make the ambiguity explicit.
- **Confidence:** high — the named legacy formats and selector are both present.

### F-CS-36: Transfer instructions hard-code controller letters
- **Severity:** Low
- **Category:** Player text
- **Where:**
  - `es-app/src/guis/GuiCloudTransfer.cpp:@@ -0,0 +1,948 @@` — footer and cancellation instructions
- **What:** Footer text hard-codes A/B while input and help use mapped controls. This violates the supplied interaction rule for alternate controllers and swapped assignments.
- **Failure scenario:** None demonstrated on a device; the strings remain `A TRY AGAIN / B CLOSE` and `PRESS B TO CANCEL` regardless of the displayed control mapping.
- **Evidence:** The literal strings coexist with `BUTTON_BACK`-based input/help. No mapping-derived label is substituted into the footer. `[S1, S7]`
- **Fix:** Derive inline prompts from the active control mapping, or rely on the mapped help bar rather than hard-coded letters.
- **Confidence:** high — this is a directly visible convention violation.

### F-CS-37: Shipped configuration comments still call sync the default
- **Severity:** Low
- **Category:** Documentation
- **Where:**
  - `projects/ROCKNIX/packages/network/rclone/sources/cloud_sync.conf:@@ -34,16 +56,81 @@`
  - `projects/ROCKNIX/packages/network/rclone/sources/cloud_sync.conf.defaults:@@ -29,21 +51,67 @@`
- **What:** Both templates say the default backup method is `sync` immediately above the new `copy` default.
- **Failure scenario:** A user editing the configuration receives contradictory guidance about the destructive setting this change is intended to retire.
- **Evidence:** `### The default is "sync"` remains beside `BACKUPMETHOD="copy"` and `DEFAULT_BACKUPMETHOD="copy"`. The migration rationale elsewhere does not correct these shipped instructions. `[S1]`
- **Fix:** Describe copy as the default and explain sync's deletion behavior without presenting it as the recommended baseline.
- **Confidence:** high — the contradiction is literal.

## Upstream fit

- **Split the submission by independently reviewable behavior.** Binary/dependency changes, capture/schema production, destructive layout migration, content matching, transfer presentation, and save-state bookkeeping are different review and rollback units. Offline-achievements parsing and proxy-card integration also appear in this bucket.
- **Reduce duplicated safety machinery.** Backup and restore duplicate substantial locking, deadline, configuration, and reporting implementations; content scripts maintain additional variants. The observed differences in status aggregation, watchdog coverage, and phase reporting show that these copies are already diverging.
- **Replace fork-history commentary with durable contracts where possible.** Long comments keyed primarily to fork issue numbers and individual debugging sessions make upstream review harder. Preserve the invariants, backend evidence, and rationale, but provide upstream-accessible references and focused tests.
- **Reconcile stale rules instead of treating them as accurate descriptions of the candidate.** `[S4]` still describes no package checksum, Tools symlinks, a package `post-update`, and older transfer behavior. The diff changes or removes those. These inconsistencies should not be “fixed” by reverting safer code.
- **Keep safety claims narrower than the evidence.** Atomic rename does not establish valid content, a byte counter does not establish committed files, and a preview count does not establish actual deletions. Several comments and UI sentences currently make those substitutions.
- No literal credential or developer-home runtime path was visible in the reviewed code. That does **not** clear credential handling: the installed setup, OAuth, remote-configuration, and identity helpers are outside this packet. The dependency and prebuilt-binary changes also need build/download verification, not just the supplied source checksum.

## Coverage boundary

The findings above are static code-path findings, not claimed reproductions. Embedded comments reporting earlier device runs, screenshots, or harness results were treated as historical assertions, not as newly verified test output.

**Orchestrator gaps requiring additional corpus:**

1. **Missing integration and helper bodies.** The packet does not contain the relevant complete callers in `FileData`, `GuiMenu`, `main`, or `ProxyCards`, nor the bodies of `cloud_setup`, `cloud_remote`, `cloud_oauth`, `cloud_device_id`, `backuptool`, and `CloudExit.h`. These are needed to clear command composition, retry scheduling, cancellation escalation, identity ownership, archive application, and sentinel agreement.
2. **Unresolved save-state deletion lead.** The changed `SaveState::setupSaveState` hunk now computes `mNewSlotFile` from the selected `slot`, removes that path, and then copies `fileName` to it. Determining whether this deletes the source itself requires the omitted `makeStateFilename`, `copyFile`, and surrounding cleanup implementations. This potentially destructive fallback path is **not cleared**, but is not asserted as a confirmed self-delete finding here.
3. **Missing specification/conformance material.** `docs/save-manifest-schema.md`, the project's blindspot register, and the relevant acceptance criteria/decision records were not embedded. The brief also names a conflict wizard whose implementation is absent. No schema-completeness or conflict-resolution verdict is possible.
4. **Missing upgrade/install wiring.** Full configuration bootstrap, update hooks, managed-symlink setup, service shutdown behavior, build lists, and locale catalogs are outside the diff. Deleting the package `post-update` and Tools installation entries cannot be cleared for existing devices without their consumers.
5. **Runtime verification remains necessary.** Priority cases are listing failure during match; preservation of `.fla`; interrupted migration; skewed-clock retention; concurrent capture/GC; disk-full rules publication; ZIP corruption; cancellation before PID publication; and settings-phase failure after saves exit 9. Clean-install and populated-upgrade runs, backend-specific transfer captures, and English/French 640×480 frames are also required. No such execution occurred in this review.

### `corpus.provenance.json`

The following is the provenance artifact's **content for the orchestrator to write**. No filesystem artifact was created by this council member. Array entries correspond by index.

```json
{
  "bucket": "5-cloud-sync-and-saves",
  "source_ids": [
    "S1",
    "S2",
    "S3",
    "S4",
    "S5",
    "S6",
    "S7"
  ],
  "source_file_paths": [
    "/workspace/repos/rocknix/docs/audits/2026_09_25-milestone-rc-round-since-258/seats/5-cloud-sync-and-saves.diff",
    "/workspace/repos/rocknix/.claude/skills/code-auditor/references/anti-patterns.md",
    "/workspace/repos/rocknix/.claude/rules/upgrade-and-install.md",
    "/workspace/repos/rocknix/.claude/rules/rclone-cloud-sync.md",
    "/workspace/repos/rocknix/.claude/rules/es-player-text.md",
    "/workspace/repos/rocknix/.claude/rules/es-code-traps.md",
    "/workspace/repos/rocknix/.claude/rules/es-ui-style-guide.md"
  ],
  "source_file_hashes": [
    "d8dc0180164aa48eb35125ee67b6dc88f176e2a9fc8030012b1d9474930f4620",
    "fd825c0505ae772ca2a6651eefe642581aaa147c254fed8cf50db1f8f1bde678",
    "de4a683f9a36f9100e6fd98be11ad84d736f370374c40f74c445a2b81eca1995",
    "92545b9e4528435e1bccdb8874d51efa7e80a41ea1d3d7f99029d45c6e2de658",
    "97c0816eabd3088ce94e3d45dec8042c1796afa3c295a9a8d080597ece817145",
    "9d5d6995714c9a1287c84f0c02a92de244271a4bdad8e53d29bb61115ba51d0f",
    "150d0ac637626d771871eab48db995d8fc46c69ed7cf786240213649d264ad02"
  ],
  "hash_algorithm": "sha256",
  "hash_verification": "Verified by the Council Facilitator at embed time; not independently re-hashed by this council member.",
  "manifest_read_timestamp_utc": "2026-09-27T22:58:44Z",
  "read_mode": "Embedded read-at-time corpus only",
  "member_filesystem_access": false,
  "member_re_read_files": false,
  "member_re_hashed_files": false,
  "tests_executed": false,
  "artifacts_written": false,
  "missing_source_requirements": [
    {
      "reference": "Full integration callers in FileData, GuiMenu, main, and ProxyCards; CloudExit.h",
      "reason": "Command composition, retry scheduling, cancellation, and sentinel agreement are not fully visible."
    },
    {
      "reference": "cloud_setup, cloud_remote, cloud_oauth, cloud_device_id, and backuptool",
      "reason": "Installed or called by the reviewed code, but their implementation bodies were not embedded."
    },
    {
      "reference": "SaveState::makeStateFilename, Utils::FileSystem::copyFile, and complete save-state setup/cleanup implementation",
      "reason": "Required to resolve the potentially destructive selected-slot remove/copy path."
    },
    {
      "reference": "docs/save-manifest-schema.md",
      "reason": "Referenced by the recorder but not embedded; schema conformance cannot be cleared."
    },
    {
      "reference": "Project blindspot register and acceptance criteria/decision records",
      "reason": "Mandatory conformance inputs are absent; no path or hash was supplied for the register."
    },
    {
      "reference": "Conflict wizard implementation",
      "reason": "Named in the brief but absent from the supplied diff."
    },
    {
      "reference": "Complete update/install wiring, service lifecycle definitions, build lists, and locale catalogs",
      "reason": "Needed to clear populated upgrades, clean installs, shutdown behavior, packaging, and localization."
    },
    {
      "reference": "Runtime results and device frames for this candidate",
      "reason": "No executed tests, backend captures, upgrade rehearsals, or UI frames were embedded as primary result artifacts."
    }
  ]
}
```