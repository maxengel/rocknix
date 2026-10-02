## Summary

This bucket replaces fixed-name ZIP backups with dated tar archives, adds credential filtering and archive rotation, and introduces pre-restore snapshots and recovery markers while retaining legacy ZIP readers. The visible implementation is not ready for release. The principal blockers are incomplete rollback, custom backup locations that can reintroduce credentials, and a credential check that publishes the archive even when it finds secrets. Other paths silently omit selected files, proceed without a usable recovery checkpoint, or expose shared archive files to concurrent writers. This is a static review of the embedded corpus; no build, device test, filesystem re-read, or hash recomputation was performed.

## Findings

All changed-code citations below refer to **S1**, the embedded diff. Hunk anchors and named blocks identify the locations without inventing source line numbers. The declared paths and Facilitator-verified SHA-256 values for **S1–S4** are recorded in `corpus.provenance.json` under **Coverage boundary**.

### F-BR-01: Rollback is not an inverse of the restore
- **Severity:** Critical
- **Category:** Data loss
- **Where:** `projects/ROCKNIX/packages/rocknix/sources/scripts/backuptool:@@ -15,54 +16,860 @@` — `write_archive()`, snapshot creation, and extraction-failure rollback
- **What:** The snapshot covers the current device’s filtered backup selection, not every destination the incoming archive will modify. Rollback only overlays that snapshot, so it cannot recover omitted pre-existing files or remove files created by the failed extraction.
- **Failure scenario:** Restore an archive made with `LOCATIONS=(/storage/.config)` onto a device using `DEFAULT` that already has DuckStation settings. Fail extraction after it overwrites those settings: DuckStation is outside `DEFAULT`, so rollback cannot recover the original file, yet a successful snapshot extraction produces “YOUR SETTINGS ARE UNCHANGED.”
- **Evidence:** The snapshot calls `write_archive "${SNAPSHOT}" 0`, which still uses `find ${COMPRESSLOCATIONS[@]} -type f` and the seed-pruning `cmp -s` branch. Rollback is only `tar -xzf "${SNAPSHOT}" -C /`. Refutation checked: there is no incoming-member inventory, record of previously absent paths, or unfiltered snapshot mode.
- **Fix:** Validate and inventory the incoming restore footprint first. Preserve the exact pre-existing contents, types, and metadata of every affected path, record absent paths, and use that record to undo both replacements and creations before claiming the settings are unchanged.
- **Confidence:** high — the snapshot selection and rollback operations are visible.

### F-BR-02: Broad custom backups embed credential-bearing recovery snapshots
- **Severity:** Critical
- **Category:** Security
- **Where:** `projects/ROCKNIX/packages/rocknix/sources/scripts/backuptool:@@ -15,54 +16,860 @@` — `write_archive()` enumeration, snapshot storage, and credential scanning
- **What:** The backup output directory and its `archive/` subtree are not excluded from custom selections. A normal sanitized backup can therefore contain an opaque, unsanitized pre-restore archive, defeating the promise that those credentials stay on the device.
- **Failure scenario:** After a restore has created a `STRIP=0` snapshot containing a Wi-Fi key, run a backup with `LOCATIONS=(/storage)`. The new cloud-eligible archive includes that snapshot under `storage/roms/backup/archive/`, with the original key inside it.
- **Evidence:** Enumeration recursively collects regular files from the selected roots; the explicit directory exclusions cover PPSSPP assets/cache and the proxy, not `${SETTINGS_BACKUPS}`. The final scan examines only `.cfg`, `.conf`, and `.ini` files, not nested `.tar.gz` contents. Refutation checked: the direct cloud exclusion of `archive/`, asserted in a comment, cannot exclude bytes nested inside the uploaded archive.
- **Fix:** Exclude the tool’s output, recovery, and temporary-artifact subtrees before collection, regardless of custom locations. Add a regression that creates a credential-bearing snapshot and then backs up a parent directory; assert that no recovery archive is included. This also prevents recursive backup growth.
- **Confidence:** high — nested inclusion follows directly from the file selection. No executed cloud upload is claimed.

### F-BR-03: Unvalidated location spellings bypass credential exclusions
- **Severity:** Critical
- **Category:** Security
- **Where:** `projects/ROCKNIX/packages/rocknix/sources/scripts/backuptool:@@ -15,54 +16,860 @@` — custom `LOCATIONS`, `FILELIST`, and `SECRETLIST` construction
- **What:** Credential handling depends on literal path equality, but selected paths are not normalized before comparison. Equivalent spellings can bypass both exclusion and sanitization.
- **Failure scenario:** Use `LOCATIONS=(/storage/.config/.)`. `find` produces paths containing `/./`, so the PPSSPP token file no longer equals the canonical entry in `RATOKENFILES`; its `.dat` contents are archived and are outside the text-config leak scan. An empty sourced `LOCATIONS` also supplies no root to `find`, causing collection from the working directory instead of representing an empty selection.
- **Evidence:** Collection uses `find ${COMPRESSLOCATIONS[@]}`, while secret membership uses `grep -qxF "${CANDIDATE}" "${FILELIST}"` against fixed absolute paths. Refutation checked: no canonicalization or nonempty-root validation precedes these operations.
- **Fix:** Validate nonempty, explicit selection roots and normalize collected paths before applying the credential policy. Handle aliases without accidentally following excluded OS symlinks. Test `/./`, relative roots, repeated separators, and an empty list.
- **Confidence:** high — the path-string mismatch is sufficient to bypass the visible policy.

### F-BR-04: Detected credentials do not block archive publication
- **Severity:** Critical
- **Category:** Security
- **Where:** `projects/ROCKNIX/packages/rocknix/sources/scripts/backuptool:@@ -15,54 +16,860 @@` — final rename, rotation, and `LEAKS` handling
- **What:** A positive credential detection only prints a warning; the archive remains published and the backup finishes successfully. The check also runs after the final-name rename and rotation of the previous backup.
- **Failure scenario:** Add a fixture such as `/storage/.config/game/account.conf` containing `password=TEST_SECRET`. It is selected by the defaults, is not specially sanitized, triggers the leak scan, and still produces a successful cloud-eligible backup; the documented `backuptool backup && cloud_backup --system-only` chain is not stopped.
- **Evidence:** Publication is `mv -f "${TARGET}.partial" "${TARGET}"`. The positive branch only sets and prints `WARN`, after which the script announces “SETTINGS BACKED UP TO THIS DEVICE.” Refutation checked: there is no rejection, quarantine, nonzero exit, or upload-ineligibility marker; scan extraction/pipeline errors are not fail-closed either.
- **Fix:** Complete credential validation before publication and rotation. On a detected secret or failed scan, remove or privately quarantine the candidate, preserve the previous backup, and return failure with a player-facing reason.
- **Confidence:** high — archive publication and successful continuation are explicit; the uploader itself is outside the packet.

### F-BR-05: Snapshot collection errors are treated as an empty device
- **Severity:** High
- **Category:** Data loss
- **Where:** `projects/ROCKNIX/packages/rocknix/sources/scripts/backuptool:@@ -15,54 +16,860 @@` — `write_archive()` return codes and restore snapshot `case`
- **What:** Return code 2 represents both “nothing to collect” and collection failures, but restore treats every 2 as permission to proceed without a snapshot. An unreadable or unsuccessfully staged settings tree is not an absent settings tree.
- **Failure scenario:** Existing settings are present, but the staging pipeline fails. `write_archive` returns 2, restore sets `SNAPSHOT=""`, and destructive extraction proceeds without rollback protection.
- **Evidence:** The pipeline-error branch removes staging and `return 2`; a failed pruning grep also returns 2. Restore’s `2)` branch clears the snapshot and logs “no current settings to copy aside.” Refutation checked: no separate error status or independent proof of an empty destination exists.
- **Fix:** Separate verified-empty collection from enumeration/read/staging failure. Abort restore on any failure to preserve existing state; allow snapshot-free restoration only after establishing that the incoming footprint has no pre-existing state to protect.
- **Confidence:** high — the incompatible meanings of return code 2 are explicit.

### F-BR-06: Collection and sanitization errors can produce a successful partial backup
- **Severity:** High
- **Category:** Correctness
- **Where:** `projects/ROCKNIX/packages/rocknix/sources/scripts/backuptool:@@ -15,54 +16,860 @@` — `write_archive()` enumeration, list filtering, and sanitized-copy creation
- **What:** Several operations that determine archive completeness have unchecked results. A valid tar listing therefore proves that the resulting container is readable, not that all selected settings were successfully collected and sanitized.
- **Failure scenario:** `find` encounters an unreadable subtree after emitting other files, or a sanitizer fails after creating a short destination file. The surviving files can still be archived, listed, renamed, and reported as a successful backup.
- **Evidence:** The result of `find ... > "${FILELIST}"` is ignored; the later secret-list filter and the `sed`/`grep` writes of sanitized settings also lack error handling. Refutation checked: the added `pipefail` protects only the tar collection pipeline, and `GREP_RC` protects only the earlier regenerable-file filter.
- **Fix:** Check temporary-file creation, enumeration, filtering, copying, and every sanitized write. Distinguish expected absent default globs and grep’s “no matches” result from actual failures. Publish only after all required collection operations succeed.
- **Confidence:** high — the unchecked commands precede an otherwise successful publication path.

### F-BR-07: Whitespace in filenames is lost before archiving and during legacy inspection
- **Severity:** High
- **Category:** Correctness
- **Where:** `projects/ROCKNIX/packages/rocknix/sources/scripts/backuptool:@@ -15,54 +16,860 @@` — `DEFAULT`, `COMPRESSLOCATIONS`, `find`, and ZIP symlink enumeration
- **What:** Unquoted array expansion splits selected names containing whitespace. The legacy ZIP symlink parser separately truncates member names by taking only field four.
- **Failure scenario:** A default-selected theme directory named `My Theme` is split into nonexistent input paths; other settings remain, so backup succeeds without the theme. A legacy ZIP member whose live symlink name contains a space is not added correctly to `SKIP`, allowing the BusyBox unzip failure this branch was intended to prevent.
- **Evidence:** The code uses `COMPRESSLOCATIONS=(${DEFAULT[@]})`, `COMPRESSLOCATIONS=(${LOCATIONS[@]})`, and `find ${COMPRESSLOCATIONS[@]}`. ZIP enumeration uses `for ENTRY in $(... awk ... '{print $4}')`. Refutation checked: the later scan’s space-safe extraction does not repair either earlier parser.
- **Fix:** Quote array copies and expansions, replace whitespace-splitting command substitutions with filename-preserving enumeration, and use a target-tested method of obtaining complete ZIP member names.
- **Confidence:** high — both splitting points are visible and ordinary spaced names are sufficient inputs.

### F-BR-08: Seed pruning prevents successful restores from restoring default settings
- **Severity:** High
- **Category:** Correctness
- **Where:** `projects/ROCKNIX/packages/rocknix/sources/scripts/backuptool:@@ -15,54 +16,860 @@` — `/usr/config` comparison and successful restore extraction
- **What:** Files equal to the image seed are omitted without recording that their backed-up state was the default. A later restore leaves any subsequently edited destination file untouched.
- **Failure scenario:** Back up a seed-identical `retroarch.cfg`, with another non-seed file present so the archive completes. Change a RetroArch setting, then restore that backup: the edited `retroarch.cfg` remains, while the tool reports that settings were restored.
- **Evidence:** A successful `cmp -s "/usr/config/${REL}" "${F}"` causes `continue`. Restore only extracts members present in the archive. Refutation checked: no defaults manifest, reset operation, or destination reconciliation exists.
- **Fix:** Retain player-setting files even when equal to a seed, or explicitly record and restore default-state intent. Do not infer that every absent path in an old or custom archive should be reset; existing pruned archives lack that information.
- **Confidence:** high — this failure requires neither a damaged archive nor a failed extraction.

### F-BR-09: Custom inputs outside `/storage` are silently discarded
- **Severity:** High
- **Category:** Upgrade path
- **Where:** `projects/ROCKNIX/packages/rocknix/sources/scripts/backuptool:@@ -15,54 +16,860 @@` — custom-location contract, staging, and final tar creation
- **What:** Collection accepts arbitrary selected roots, but the final archive includes only the staged `storage` subtree. Mixed custom selections silently lose every selected file outside that subtree.
- **Failure scenario:** Select a non-seed `system.cfg` together with `/etc/profile`. Both are collected or sanitized into staging, but the completed archive contains only the `storage` member tree.
- **Evidence:** Final creation is `tar -czf "${TARGET}.partial" -C "${STAGING}" storage`. The removed ZIP command archived `${COMPRESSLOCATIONS[@]}` directly, and the retained configuration example permits `/some/other/folder/file.name*`. Refutation checked: no unsupported-root validation or warning accompanies the narrowed output.
- **Fix:** Preserve the supported custom-root contract after destination validation, or reject unsupported roots before starting. Resolve the compatibility policy explicitly rather than reporting a partial custom selection as complete, as required by S3’s upgrade guidance.
- **Confidence:** high — the final tar operand excludes the other staged roots.

### F-BR-10: Concurrent runs share publication files without locking
- **Severity:** High
- **Category:** Concurrency
- **Where:** `projects/ROCKNIX/packages/rocknix/sources/scripts/backuptool:@@ -15,54 +16,860 @@` — timestamp naming, `.partial` cleanup, publication, and restore markers
- **What:** There is no visible operation lock, while same-second runs share final and `.partial` names. One run can delete, truncate, or rename another run’s candidate between verification and publication.
- **Failure scenario:** Two backups receive the same second-resolution stamp. Run A verifies the shared `.partial`; run B starts rewriting it; A then renames B’s unfinished file to the final name and reports success.
- **Evidence:** Names use `date +%Y_%m_%d-%H%M%S`, creation uses `"${TARGET}.partial"`, and startup deletes all root `*.tar.gz.partial` files. Refutation checked: no lock or unique candidate ownership is visible; restore also uses one shared journal path.
- **Fix:** Serialize backup and restore operations with a device-wide lock, use operation-unique candidates, and never remove another active operation’s temporary files. Test overlapping same-second invocations.
- **Confidence:** high — the race exists for direct invocations even if some external callers serialize their own actions.

### F-BR-11: The recovery journal is neither mandatory nor protected
- **Severity:** High
- **Category:** Data loss
- **Where:** `projects/ROCKNIX/packages/rocknix/sources/scripts/backuptool:@@ -15,54 +16,860 @@` — `RESTORE_MARK` creation, extraction, and successful completion
- **What:** Restore does not require successful, durable journal creation before modifying the live tree. The journal path is also not reserved against archive contents, and it is removed before the final filesystem flush.
- **Failure scenario:** Make `.restore-in-progress.tmp` unwritable: the marker write fails but extraction starts anyway. Alternatively, a custom archive containing an older `.restore-in-progress` can overwrite the current recovery pointer during extraction; interruption then leaves the wrong pointer.
- **Evidence:** `printf ... > "${RESTORE_MARK}.tmp" && mv ...` has no failure branch. Neither restore exclusion list contains the journal, and `rm -f "${RESTORE_MARK}"` precedes the eventual `sync`. Refutation checked: there is no visible pre-extraction durability barrier or protection of transaction metadata.
- **Fix:** Require a verified, durable snapshot and journal before extraction; reserve operational marker paths in writers and readers; handle an existing recovery transaction before starting another. Flush restored state before durably removing the journal.
- **Confidence:** high for the missing gates and path protection; exact power-loss behavior still requires the target filesystem test.

### F-BR-12: Legacy restores can overwrite the current cloud identity
- **Severity:** High
- **Category:** Upgrade path
- **Where:** `projects/ROCKNIX/packages/rocknix/sources/scripts/backuptool:@@ -15,54 +16,860 @@` — `RCLONECFG` exclusion and both restore `SKIP` lists
- **What:** New backups exclude `rclone.conf`, but neither legacy restore reader excludes it. An old custom backup can overwrite the destination’s cloud credentials with expired credentials or another device’s account.
- **Failure scenario:** Restore an older ZIP made from `/storage/.config` onto a device whose regular `rclone.conf` now identifies a different cloud account. Extraction replaces that file and still reports success.
- **Evidence:** `RCLONECFG` is held back in `write_archive`, while restore exclusions contain PPSSPP paths, `RATOKENFILES`, and `RATOKENDIRS`, but no rclone configuration. Refutation checked: the ZIP live-symlink check does not protect a regular file. This is the write-only fix pattern prohibited by S3, “Fixing forward is not enough.”
- **Fix:** Preserve the destination’s cloud credentials when reading both formats, using the same normalized sensitive-path policy. Test old archives containing a populated rclone configuration against a destination already connected to another account.
- **Confidence:** high — the file replacement is visible; downstream cloud operations are outside the packet.

### F-BR-13: Tar restores can replace OS-managed symlinks
- **Severity:** Medium
- **Category:** Upgrade path
- **Where:** `projects/ROCKNIX/packages/rocknix/sources/scripts/backuptool:@@ -15,54 +16,860 @@` — default ES exclusions and tar/ZIP restore branches
- **What:** The tar reader assumes an archived member corresponding to a live symlink will itself be a symlink. That assumption conflicts with regular-file-only collection and with custom or older archives.
- **Failure scenario:** A custom tar contains a regular `storage/.config/emulationstation/es_systems.cfg` from a device where the link was already flattened. Restoring it onto a device with the OS-managed symlink replaces the link and freezes the systems definition at the archived version.
- **Evidence:** The tar branch expressly omits a symlink skip-list and extracts directly; only ZIP tests `[ -L "/${ENTRY}" ]`. The default-list comment identifies these ES files as OS-managed links that must not become regular files. Refutation checked: excluding them from today’s defaults does not protect existing or custom archives.
- **Fix:** Apply OS-owned-path and live-link protection consistently to both formats, with tests for regular archived members over current OS symlinks.
- **Confidence:** high — the divergent reader behavior and the protected-path rationale are both in S1.

### F-BR-14: ZIP integrity failure is overridden by a successful listing
- **Severity:** Medium
- **Category:** Correctness
- **Where:** `projects/ROCKNIX/packages/rocknix/sources/scripts/backuptool:@@ -15,54 +16,860 @@` — `archive_ok()`
- **What:** The fallback cannot distinguish an unsupported `unzip -t` option from a genuine integrity failure. A readable central directory is accepted as proof that the archive payload is whole.
- **Failure scenario:** A ZIP has an intact central directory but a corrupted compressed member. A capable unzip rejects `-t`, `-l` succeeds, and restore proceeds to live extraction despite the failed integrity test.
- **Evidence:** The check is `unzip -t "${1}" ... || unzip -l "${1}" ...`. Refutation checked: there is no capability detection or complete payload-read check before the destructive phase.
- **Fix:** Detect test-option support independently and never override an actual integrity failure with a listing. For BusyBox, validate complete extraction into private staging before touching the live tree.
- **Confidence:** high — listing metadata does not establish payload integrity.

### F-BR-15: Rotation can delete the snapshot about to protect a restore
- **Severity:** Medium
- **Category:** Correctness
- **Where:** `projects/ROCKNIX/packages/rocknix/sources/scripts/backuptool:@@ -15,54 +16,860 @@` — `trim_archive()` and snapshot success branch
- **What:** The newly created recovery snapshot is immediately eligible for ordinary date-name retention. There is no exemption for the active snapshot.
- **Failure scenario:** Three retained archives have names later than the device’s current clock after an RTC reset. The new snapshot sorts behind them and is deleted by `trim_archive`; restore then records its now-missing path and starts extraction.
- **Evidence:** Snapshot success executes `0) trim_archive`, whose sorted list includes `*PRE_RESTORE*.tar.gz` and removes everything after `ARCHIVE_KEEP`. Refutation checked: there is no active-path exclusion or existence check after trimming.
- **Fix:** Pin active and journal-referenced recovery snapshots against retention. Trim only after the transaction is resolved, or explicitly exclude protected paths independently of their timestamps.
- **Confidence:** high — three future-dated retained names are sufficient to produce the deletion.

### F-BR-16: Staging substitutes new filesystem metadata for original metadata
- **Severity:** Medium
- **Category:** Correctness
- **Where:** `projects/ROCKNIX/packages/rocknix/sources/scripts/backuptool:@@ -15,54 +16,860 @@` — regular-file collection, sanitized writes, and final recursive tar
- **What:** Sanitized settings are newly created with redirection rather than retaining their original metadata. Parent directories are also synthesized during staging and then archived recursively, despite not having been collected with their original attributes.
- **Failure scenario:** A settings file or parent directory has a non-default group or restrictive mode. The archive records the staging owner/mode instead, and a restore can change those attributes.
- **Evidence:** Collection uses `find ... -type f`; sanitized destinations use `mkdir -p` and `sed`/`grep` redirection; final creation recursively archives `storage`. Refutation checked: tar preserves metadata for copied regular files, but no attribute-restoration step covers rewritten files or synthetic parents.
- **Fix:** Preserve original metadata for sanitized files and intentionally handle real parent-directory metadata, or avoid applying fabricated directory attributes during restore. Compare source/archive/restored `stat` results in regression tests.
- **Confidence:** high — the original attributes are not available in the constructed entries unless copied explicitly.

### F-BR-17: Interrupted snapshots evade cleanup and retention
- **Severity:** Medium
- **Category:** Resource
- **Where:** `projects/ROCKNIX/packages/rocknix/sources/scripts/backuptool:@@ -15,54 +16,860 @@` — temporary directories, snapshot `.partial` files, cleanup, and `trim_archive()`
- **What:** Cleanup covers normal return paths but not interruption, and persistent snapshot partials are outside both startup cleanup and retention. Repeated interrupted restores can consume unbounded space despite the advertised archive bound.
- **Failure scenario:** Kill restore while writing its pre-restore archive several times. Each run leaves a differently dated `archive/*PRE_RESTORE*.tar.gz.partial`; subsequent backups and trimming never select those files.
- **Evidence:** Startup removes only `"${SETTINGS_BACKUPS}"/*.tar.gz.partial`; retention patterns end in `.tar.gz` or `.zip`. Temporary staging directories are removed only by explicit normal-flow commands. Refutation checked: no interruption trap or stale-artifact sweep is visible.
- **Fix:** Add cleanup for catchable interruption and a lock-aware startup sweep for stale temporary directories and snapshot partials. Preserve active or journal-referenced files; account separately for uncatchable termination.
- **Confidence:** high — the persistent leftover names match neither cleanup mechanism.

### F-BR-18: The patched `valloc` probe still calls the function incorrectly
- **Severity:** Medium
- **Category:** Build/packaging
- **Where:** `packages/compress/zip/patches/fix-compile-with-gcc14.patch:@@ -0,0 +1,121 @@` — embedded `unix/configure` hunk `@@ -621,11 +673,13 @@`
- **What:** The patch adds `<stdlib.h>` but leaves `valloc()` without its required size argument. With `MMAP` defined and the prototype visible, the probe fails on a libc that does provide the function.
- **Failure scenario:** Compile the displayed probe with `MMAP` enabled and a declaration of `valloc(size_t)`: the call produces a too-few-arguments error and yields a false-negative feature test.
- **Evidence:** The changed probe includes `<stdlib.h>` and retains `#ifdef MMAP` followed by `valloc();`. Refutation checked: no argument or alternative probe is supplied. The downstream use of the result is outside the packet.
- **Fix:** Use a correctly typed call such as `valloc(1)` and compile the probe with the target compiler under both relevant feature configurations.
- **Confidence:** high for the defective conditional probe; whether the candidate enables this branch is outside the packet.

### F-BR-19: A backup containing only sanitizable settings fails before sanitization
- **Severity:** Medium
- **Category:** Correctness
- **Where:** `projects/ROCKNIX/packages/rocknix/sources/scripts/backuptool:@@ -15,54 +16,860 @@` — `FILELIST` emptiness check, `SENDLIST`, and staging pipeline
- **What:** The empty-list guard runs before credential-bearing settings are removed from the ordinary collection list. A valid selection consisting only of files that need sanitized copies reaches the tar pipeline with an empty `SENDLIST`.
- **Failure scenario:** Use `LOCATIONS=(/storage/.config/system/configs/system.cfg)` with a non-seed configuration. The file enters `SECRETLIST`, nothing remains in `SENDLIST`, and the BusyBox empty-archive behavior described in the diff causes staging to fail before the sanitized copy is written.
- **Evidence:** The script checks `[ ! -s "${FILELIST}" ]`, then filters into `SENDLIST`, and unconditionally runs `tar -cf - -T "${SENDLIST}"`. Refutation checked: the empty-`SECRETLIST` workaround does not handle empty `SENDLIST`.
- **Fix:** Skip ordinary tar collection when its list is empty, then create the required sanitized files. Distinguish a valid sanitized-only archive from a selection containing nothing exportable.
- **Confidence:** medium — the control flow is explicit, but the empty-tar behavior is supported here by the diff’s own BusyBox note rather than an executed target test.

### F-BR-20: Raw tool errors bypass the player-text contract
- **Severity:** Low
- **Category:** Player text
- **Where:** `projects/ROCKNIX/packages/rocknix/sources/scripts/backuptool:@@ -15,54 +16,860 @@` — live extraction and final archive creation
- **What:** Several failing commands can print raw diagnostics directly to the console before the curated `why` and `fail` messages. The screen can therefore expose tool names and filesystem paths that the helper comments and S4 expressly exclude.
- **Failure scenario:** A live tar extraction encounters a write error. Standard output is discarded, but stderr prints the tar diagnostic and member path to the console flow.
- **Evidence:** Restore uses `tar ... >/dev/null` and `unzip ... >/dev/null`, without redirecting stderr; final archive creation also leaves diagnostics exposed. Refutation checked: `fail()` separates its own log detail, but does not capture these earlier command errors.
- **Fix:** Capture operational diagnostics for the system log while preserving their exit status, and emit only the player-facing outcome and recovery text to the screen.
- **Confidence:** high — stderr remains connected to the caller.

## Upstream fit

- **The recovery and credential guarantees need implementation evidence, not historical comments.** The script contains many dated claims of VM/on-device verification and references to fork issues. Those are intent and history, not test evidence supplied with this packet. The PR should carry reproducible regressions for the findings above.
- **Explain the new ZIP package’s remaining consumer.** The revised writer uses tar/gzip, and legacy restoration uses unzip. No consumer or image dependency for the new `zip` package is shown. If another subsystem needs it, supply that connection; otherwise separate or remove it.
- **Give the GCC14 patch provenance and rationale.** The packet supplies raw patch hunks without an origin or explanation of their adoption. The incorrect `valloc` probe also needs correction before treating this as a compiler-compatibility fix.
- **Define custom-location support explicitly.** The old interface accepts arbitrary locations, while the new implementation assumes a `storage/...` archive shape and relies on exact path spellings. That is an externally observable compatibility change, not an internal refactor.
- **Separate durable operational rationale from fork chronology.** Keep explanations of BusyBox differences and compatibility constraints, but move repeated dates, issue narratives, and test anecdotes into maintained documentation or tests.
- **The diff alone does not establish commit hygiene or package integration.** It supplies neither individual commits nor the surrounding build graph. No literal live credential or developer-workspace path is shown in the changed production code.

## Coverage boundary

### Evidence and unresolved gaps

- **Scope actually supplied:** three distribution files, with no EmulationStation source changes. Interface-page behavior, French translations, screen fit, caller serialization, and restart behavior cannot be audited from this packet.
- **Recovery consumers are outside the packet:** `chksysconfig verify`, the consumers of `.restore-finish-pending` and `.cloud-journey-pending`, and any startup recovery ordering. Their existence and behavior are asserted in comments, not demonstrated here.
- **Cloud integration is outside the packet:** `cloud_backup`, configuration writers/migrations, and upload selection. The credential findings establish unsafe output artifacts and successful producer status; they do not claim an observed upload.
- **Runtime dependencies are unavailable:** the full script preamble, `/etc/profile`, the candidate’s BusyBox configuration, filesystem durability behavior, image seed tree, and actual permissions. No unseen wrapper or shell option has been credited as a safety mechanism.
- **Build coverage is limited:** the rest of Info-ZIP’s configure script and makefiles, the cross-build environment, package inclusion, and resulting binaries were not embedded.
- **Compatibility decisions remain open:** the removed baseline reader only opens the fixed `${OS_NAME}_BACKUP.zip`; it cannot consume the new dated tar output. A minimum-reader/downgrade policy was not supplied. Existing seed-pruned archives also lack enough information to reconstruct whether an absent file meant “default” or “not selected.”
- **Archive trust and destination policy need clarification:** both readers extract directly at `/` after a readability check and a short exclusion list. The packet does not define the permitted custom restore namespace or the trust guarantees for imported archives; a complete security review needs those requirements and member-validation tests.
- **Additional mandatory conformance context is missing:** the blindspot register and other instruction/package-convention files mentioned by the brief were not embedded. S2’s broader conformance requirement therefore remains incomplete, not passed.
- **Verification required before release:** target-tool regressions for credential exclusion, spaced paths, damaged legacy ZIP payloads, sanitized-only selections, exact rollback, concurrent operations, failed journal writes, power interruption, clock regression, and both clean-install and upgrade states. No runtime PASS is claimed from comments or issue numbers.

These gaps are surfaced to the orchestrator rather than filled with inferred file contents or paths.

### `corpus.provenance.json`

No file was written. The following is the provenance content for the orchestrator to save. **S1–S4 index the two ordered source arrays.** Hashes are the supplied **SHA-256 values verified at embed time by the Council Facilitator**, not hashes recomputed during this audit.

```json
{
  "corpus_basis": "Embedded read-at-time corpus supplied by the Council Facilitator",
  "source_identifiers": [
    "S1",
    "S2",
    "S3",
    "S4"
  ],
  "source_file_paths": [
    "/workspace/repos/rocknix/docs/audits/2026_09_25-milestone-rc-round-since-258/seats/4-backup-restore.diff",
    "/workspace/repos/rocknix/.claude/skills/code-auditor/references/anti-patterns.md",
    "/workspace/repos/rocknix/.claude/rules/upgrade-and-install.md",
    "/workspace/repos/rocknix/.claude/rules/es-player-text.md"
  ],
  "source_file_hashes": [
    "afdfe5a267ed458189834034cd4b1a308ffb9dd06569760dc6b41e743a6c0b59",
    "fd825c0505ae772ca2a6651eefe642581aaa147c254fed8cf50db1f8f1bde678",
    "de4a683f9a36f9100e6fd98be11ad84d736f370374c40f74c445a2b81eca1995",
    "97c0816eabd3088ce94e3d45dec8042c1796afa3c295a9a8d080597ece817145"
  ],
  "hash_algorithm": "sha256",
  "hash_verification": "Verified at embed time by the Council Facilitator; not recomputed by this auditor",
  "manifest_read_timestamp_utc": "2026-09-27T22:58:44Z",
  "audit_actions": {
    "filesystem_access": false,
    "filesystem_re_reads": false,
    "hashes_recomputed": false,
    "builds_run": false,
    "runtime_tests_run": false,
    "files_written": false
  },
  "missing_sources_and_evidence": [
    "The dispatch manifest was named but its contents were not embedded.",
    "Recovery and marker consumers, including chksysconfig verify, were not embedded.",
    "Cloud upload, configuration migration, and caller implementations were not embedded.",
    "EmulationStation interface implementations and localization artifacts were not embedded.",
    "The complete script preamble, sourced profile, candidate runtime, and image seed tree were not embedded.",
    "The remaining Info-ZIP sources, build graph, and target build evidence were not embedded.",
    "The blindspot register and additional convention files referenced by the brief were not embedded.",
    "Acceptance specifications and executable QA evidence beyond the supplied rules and diff were not embedded."
  ]
}
```