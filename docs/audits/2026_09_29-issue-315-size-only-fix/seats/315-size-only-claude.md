# Second look: #315, the same-size save (packet `315-size-only.diff`)

Sources read: `315-size-only.diff` (sha256 `c6ae1519…4d98ed`), `rclone-cloud-sync.md` (`81fbe525…c896bd`), `upgrade-and-install.md` (`d79a1084…061f8cfd`), `anti-patterns.md` (`fd825c05…f1bde678`). Where rclone's behaviour matters below, the version is v1.75.1 (the image's, per the brief) and I say what I rely on; nothing in the packet is rclone source, so those points are reasoning, not measurement.

## 1. Summary

The packet adds `remote_compares_by_size`, a config-file test for a WebDAV remote rclone cannot set modtimes on, and on such a remote sends the exit sync's recent set with `--ignore-times` and every other saves pass, both scripts, with `--update --modify-window 1s`; the harness asserts where the flags land per remote type. For the case the brief measured — a same-size save rewritten after its upload — the mechanism is sound in both directions and nothing on any other remote changes. Three findings matter. `--update` on the deliberate BACK UP SAVES row removes the one pass that sent a size-changed save regardless of time, so a save whose mtime precedes the cloud's upload time (device clock wrong at write, server clock ahead) is now skipped with COMPLETED where it was sent before; D-CLOUD-153's accepted loss names only the same-size case (F-SS-01). The vendor table is asserted, not measured: rclone's WebDAV documentation names Fastmail, ownCloud and Nextcloud (and `rclone serve`) as the vendors it sets modtimes on and does not name SharePoint, so `sharepoint` remotes may keep the defect while `fastmail` is over-detected (F-SS-02); a WebDAV remote wrapped in `crypt` is not detected at all (F-SS-04). On my reading of rclone's `--update` handling, `--modify-window 1s` is inert on these remotes and the packet has no measurement of `--update` alone; the rule file's explanation of why the fix works rests on that flag (F-SS-03). The round-trip's read-back can pick a `-replaced` copy and fail falsely (F-SS-06), and the harness proves command lines only — the bytes-level proof the rule file cites (`proofs-307/X-size-same.sh`) is not in the packet.

## 2. Findings

### F-SS-01: `--update` on the full backup pass removes the time-independent path a size-changed save had
- **Severity:** Medium
- **Category:** Correctness
- **Where:** `projects/ROCKNIX/packages/network/rclone/sources/cloud_backup` hunk `@@ -1712,6 +1740,28 @@`, the `else` branch (`all_opts+=("--update")`, `all_opts+=("--modify-window" "1s")`)
- **What:** Before this change the deliberate BACK UP SAVES row and the `--recent` fallback with no stamp ran a plain `copy` on these remotes, which sent any save whose size changed, whatever its mtime. rclone's `--update` skips a destination whose modtime is newer than the source before it looks at size (the brief's own dry-run: `Destination is newer than source, skipping`). On a size-only remote the destination's modtime is the upload time, so a local save whose mtime precedes the last upload is now skipped even when its bytes and size differ.
- **Failure scenario:** (a) A no-RTC device boots with a clock earlier than the last upload — the saved-clock file missing after a crash, or the last upload made from another device — the player saves a savestate (`.state`, variable size), the clock is later corrected; the exit sync excludes the file (`--max-age`, pre-existing), the player presses BACK UP SAVES → `--update` compares the stale mtime with the cloud's upload time → skipped → `Game saves: COMPLETED`. (b) A self-hosted WebDAV server whose clock is ahead of the device's by Δ: every save written within Δ of its previous upload is skipped by the full pass and the startup backup, size change or not; the exit sync's `--ignore-times` is the only thing that still moves it. Before the fix both were sent because the sizes differed.
- **Evidence:** the new comment concedes only "a save written while the device's clock was wrong" for the same-size case; the context comment above the recent block still says a wrong mtime "is caught there" (the full pass), which is no longer true on these remotes. Looked for a plain size-comparing pass kept beside the `--update` one, or a guard on server/device skew; none. I rely on rclone's documented `--update` semantic ("skip any files which exist on the destination and have a modified time that is newer than the source") for the 1.7x line, and on the brief's dry-run line showing the branch fires.
- **Fix:** on a size-only remote run the full pass as two rclone calls — the plain `copy` as before (catches size changes, as it did), then `copy --update` for the same-size set — or, cheaper, keep one pass but pre-check saves whose mtime is older than the last-backup stamp minus a sanity floor and send them by `--files-from`. At minimum widen D-CLOUD-153's accepted loss to "any save whose mtime precedes the cloud's upload time, including size-changed ones" and name the server-clock case.
- **Confidence:** high on mechanism (documented flag, the packet's own dry-run); medium on frequency — a saved-clock restore keeps most no-RTC boots ahead of the last upload.

### F-SS-02: The vendor table is asserted, not measured, and disagrees with rclone's documentation
- **Severity:** Medium
- **Category:** Correctness
- **Where:** `cloud_backup` hunk `@@ -483,6 +483,32 @@` and `cloud_restore` hunk `@@ -926,6 +926,33 @@`, the line `nextcloud|owncloud|sharepoint|sharepoint-ntlm|rclone) return 1 ;;`
- **What:** The list treats `sharepoint` and `sharepoint-ntlm` as modtime-keeping (no flags) and `fastmail` and `infinitescale` as size-only (flags on). rclone's WebDAV documentation names Fastmail Files, ownCloud and Nextcloud (plus `vendor = rclone` against `rclone serve webdav`) as the vendors it supports modified times and hashes on, and does not name SharePoint. The two errors are not symmetric: over-detecting `fastmail` costs redundant uploads and a semantics change the fix already accepts; under-detecting `sharepoint` keeps the defect, silently.
- **Failure scenario:** `type = webdav`, `vendor = sharepoint`, a battery save rewritten with the same size → function returns 1 → plain `copy` → `Sizes identical` → not sent, COMPLETED — the exact shape of #315, on a remote the change claims to have covered.
- **Evidence:** the comment says "every vendor but nextcloud, owncloud, sharepoint and rclone's own serve" with no measurement cited; the brief's only `backend features` output is for `other`. Looked in the packet for `Precision`/`Hashes` output on a sharepoint or fastmail remote, or for a reference to `setQuirks` in 1.75.1; none.
- **Fix:** run `rclone backend features <remote>:` on the image's 1.75.1 once per vendor value rclone accepts (`fastmail nextcloud owncloud sharepoint sharepoint-ntlm rclone other infinitescale`), set the list from `Precision` and `Hashes`, record the outputs beside D-CLOUD-153, and add an S315 row per vendor. Consider inverting the list to the vendors measured as modtime-capable, so a vendor rclone adds later defaults to "size-only" (the harmless direction by the fix's own argument).
- **Confidence:** medium — I rely on rclone's WebDAV documentation; I have not read 1.75.1's `webdav.go` in this packet.

### F-SS-03: `--modify-window 1s` is inert on these remotes on my reading, and the packet never measures `--update` alone
- **Severity:** Low
- **Category:** Documentation
- **Where:** `cloud_backup` hunk `@@ -1712`, `cloud_restore` hunk `@@ -1786,6 +1813,20 @@` (`all_opts+=("--modify-window" "1s")`); `.claude/rules/rclone-cloud-sync.md`, § "What the QA backends compare by"
- **What:** In rclone's `NeedTransfer`, when `--update` is set and the computed modify window is "not supported" (which `GetModifyWindow` returns whenever either side's precision is `ModTimeNotSupported`, regardless of `--modify-window`), rclone substitutes one second itself. If that reading is right, `--modify-window 1s` changes nothing here, the rule file's sentence "`copy --update` compares the two modtimes only inside a `--modify-window`, which is the whole width when precision is unsupported" is wrong, and the startup pair — which already carried `--update` on both halves — was never blind in the local-newer direction, which sits uneasily with "never moved again, in either direction".
- **Failure scenario:** none demonstrated — the flags as shipped transfer either way. The risk is downstream: a maintainer who later widens the window to absorb server-clock skew (F-SS-01 b) will find it does nothing; and if the startup pair *was* observed not to move the save, the mechanism is not the one this fix addresses.
- **Evidence:** the brief's table measures `plain copy`, `--update --modify-window 1s`, and `--ignore-times`, never `--update` alone; S315 asserts `--modify-window 1s` is present (`sz_has "${c}" '--modify-window 1s'`) without any test of effect. I rely on my reading of `fs/operations.NeedTransfer`'s `UpdateOlder` branch ("use 1 second as a safe default as the resolution of the time a file was uploaded") and `fs.GetModifyWindow` in the 1.7x line; not verified against 1.75.1 source here.
- **Fix:** one dry-run settles it: the brief's `--update` case without `--modify-window 1s`, at `-vv`. Then either drop the flag and the S315 assertion or correct the rule file's explanation; and state which passes were measured blind pre-fix.
- **Confidence:** medium.

### F-SS-04: A WebDAV remote behind `crypt`, `alias`, `union` or `combine` is not detected
- **Severity:** Medium
- **Category:** Correctness
- **Where:** both `remote_compares_by_size` bodies, `[ "${type}" = webdav ] || return 1`
- **What:** A player who wrapped their WebDAV remote in `crypt` (`type = crypt`, `remote = dav:enc`) has a first remote whose `type` is not `webdav`. `crypt` over a backend with no hashes and no settable modtime inherits both absences, so rclone compares by size alone there too; the function returns 1 and the run keeps the defect.
- **Failure scenario:** `rclone.conf` with `[vault] type = crypt remote = dav:Saves` first and `[dav] type = webdav vendor = other` second → no flags on any pass → same-size save never moves, COMPLETED.
- **Evidence:** the `type` check is exact and no `remote =` line is followed. Looked for wrapper handling or a log line; none. Not covered by S315.
- **Fix:** for `type` in `crypt|alias|union|combine`, read the section's `remote =` (first `<name>:` before the colon; `union` has several) and recurse once or twice; log which section decided.
- **Confidence:** high on the code path; medium on prevalence (the wizard writes no `crypt`; `rclone config` users might).

### F-SS-05: `.` in a remote name is a sed metacharacter; a space is refused outright
- **Severity:** Low
- **Category:** Correctness
- **Where:** both function bodies, `case "${remote}" in *[!A-Za-z0-9_.-]*) return 1 ;; esac` and `sed -n "/^\[${remote}\]/,/^\[/…"`
- **What:** The character class admits `.` and the name is interpolated unescaped into a sed address, so `.` matches any character. rclone's newer releases also accept a space in a remote name, which the class refuses (fail-safe off).
- **Failure scenario:** file order `[a_b]` (dropbox) then `[a.b]` (webdav/other); `rclone listremotes | head -1` sorts `a.b` first (`.` 0x2E < `_` 0x5F); pattern `^\[a.b\]` matches line 1 `[a_b]` → `type = dropbox` → return 1 → no flags on a size-only remote.
- **Evidence:** S315's row `! sz_fn … 'qa;rm'; check $? "… never a sed pattern"` tests a character outside the class; `.` is inside it and is a pattern. Refutation tried: whether the first-remote choice makes the false match unreachable — it does not when the earlier section's name differs at the `.` position by a character that sorts after `.`.
- **Fix:** escape before interpolating (`remote_re=$(printf '%s' "${remote}" | sed 's/[.]/\\./g')`), or match the header with awk on an exact string; decide whether a name with a space should be refused or handled.
- **Confidence:** high on mechanism; the input needs two near-identical names, which is rare.

### F-SS-06: The round-trip read-back picks `paths[0]` from an unsorted suffix match that also hits `-replaced` copies
- **Severity:** Low
- **Category:** Test gap
- **Where:** `tools/cloud-round-trip` hunk `@@ -1417,11 +1417,18 @@`, `got = backend_bytes(paths[0]) if paths else None`
- **What:** The listing is filtered by `endswith("savestates/recent-probe.state")` and the first hit is read. The step under test runs the exit sync with `--backup-dir`, which moves the previous cloud copy to `<saves>-replaced/<stamp>/savestates/recent-probe.state` — a path with the same suffix, holding the *old* six bytes. Which hit comes first depends on the listing's order, which for a recursive `rclone ls` is the walk's completion order, not a sort.
- **Failure scenario:** listing yields the replaced copy first → `got != b"RECENT"` → the step reports "the same-size change was not sent" on a device that sent it; a false FAIL that blocks a candidate, or a passing run that depends on listing order.
- **Evidence:** the diff's own comment: "--backup-dir keeps the cloud's copy"; the rule file: "keeps what it replaces for one cycle in `<saves folder>-replaced`". Looked for an exact-path match, a `-replaced` exclusion or `len(paths) == 1`; none. I could not see `backend("ls")`'s implementation, so the exact format is a boundary.
- **Fix:** build the expected full path from the saves prefix, filter to it, assert exactly one match, and fail closed with the list otherwise (the `None` branch already has the right shape).
- **Confidence:** medium — depends on `cloud-test-backend ls` listing the `-replaced` tree, which it does if it lists the served root.

### F-SS-07: `--ignore-times` re-sends every file in the 600 s slack on every exit sync, with a server-side move each
- **Severity:** Low
- **Category:** Resource
- **Where:** `cloud_backup` hunk `@@ -1703,6 +1730,7 @@` (`local age=$(( now - stamp_epoch + 600 ))`) with hunk `@@ -1712` (`all_opts+=("--ignore-times")`)
- **What:** The window starts 600 s before the last successful backup, so it includes the saves written in the last ten minutes of the previous session — the ones that backup already uploaded. Before, they were compared and skipped; now they are sent unconditionally and each displaces a cloud copy into `--backup-dir`. The comment "newer than the cloud by construction" holds for the set relative to the *stamp*, not relative to the cloud.
- **Failure scenario:** none beyond cost — roughly double the files per exit sync on a size-only remote, and one `-replaced` entry per file per pass.
- **Evidence:** arithmetic on the `age` expression; nothing in the diff narrows the window when `--ignore-times` is added. Refutation tried: whether the stamp's own upload excludes those files — it cannot, a stamp is a time, not a file list.
- **Fix:** accept and reword the comment, or shrink the slack on size-only remotes, or (#317) derive the recent set from the capture manifest's changed files.
- **Confidence:** high.

### F-SS-08: The negative path of the detection is silent
- **Severity:** Low
- **Category:** Convention
- **Where:** both function bodies (every `return 1`)
- **What:** "not webdav", "config unreadable", "section not found", "name refused", "wrapper type" all return 1 with no `log_message`. A player's log shows COMPLETED and no line says whether the detection ran or why it said no; an encrypted `rclone.conf` (no plaintext sections) turns the fix off on every remote, invisibly.
- **Failure scenario:** none demonstrated (diagnosability).
- **Evidence:** the positive branches log; the function does not. The rule file asks that everything worth knowing later be in the log, since the stamp survives and the line does not.
- **Fix:** one `log_message … "false"` distinguishing "not a size-only remote" from "could not read <conf>/<section>".
- **Confidence:** high.

### F-SS-09: Restore `--update` under a device clock in the future fetches nothing over existing local saves
- **Severity:** Low
- **Category:** Correctness
- **Where:** `cloud_restore` hunk `@@ -1786,6 +1813,20 @@`
- **What:** With the device's clock ahead of the server's, every local save is "newer" than its cloud copy, so the manual RESTORE SAVES row on a size-only remote skips every file it already has locally, size change or not; before the fix it fetched the size-changed ones. (A clock in the past does the opposite — fetches everything — which is what a manual restore means, with `--backup-dir` keeping the local copies; not a finding.)
- **Failure scenario:** device clock set to a wrong year ahead, player presses RESTORE SAVES to recover a corrupted `.state` the cloud holds → skipped → COMPLETED.
- **Evidence:** the brief's own dry-run line "Destination is newer than source, skipping" for the local-newer restore case. Refutation tried: a fresh device has no local copy, so `dst == nil` transfers — the skip needs an existing local file, which narrows it.
- **Fix:** none needed if D-CLOUD-153 records it; otherwise the RESTORE SAVES row could offer "replace anyway" (`--ignore-times`) as the manual override.
- **Confidence:** high on mechanism; low frequency.

### F-SS-10: A bespoke test hook reads a path rclone may not be using
- **Severity:** Low
- **Category:** Upstream fit
- **Where:** both function bodies, `conf="${RCLONE_CONF_FILE:-/storage/.config/rclone/rclone.conf}"`
- **What:** `RCLONE_CONF_FILE` is an invented variable in production code, documented as "the harness points it at a fixture". rclone's own is `RCLONE_CONFIG` (and `--config`). If either is ever set on the device, the function and rclone read different files.
- **Failure scenario:** none demonstrated; a maintainer will ask why the script does not honour the variable rclone honours.
- **Evidence:** the comment on the line. Looked for `RCLONE_CONFIG` or `--config` elsewhere in the diff; none.
- **Fix:** `conf="${RCLONE_CONFIG:-/storage/.config/rclone/rclone.conf}"` and have the harness set `RCLONE_CONFIG`.
- **Confidence:** high.

### F-SS-11: The two scripts differ outside the text the "same function" test compares
- **Severity:** Low
- **Category:** Convention
- **Where:** `cloud_backup` hunk `@@ -1712` (`local has_update=0`), `cloud_restore` hunk `@@ -1786` (`local has_update=0 opt`)
- **What:** `cloud_backup`'s loop variable `opt` is not declared local and leaks into the caller's scope; `cloud_restore`'s is. The S315 `cmp` covers only the function body, so this class of drift is unchecked, against the rule file's "keep these two scripts structurally in sync".
- **Failure scenario:** none demonstrated.
- **Evidence:** the two hunks as quoted.
- **Fix:** `local has_update=0 opt` in both.
- **Confidence:** high.

### F-SS-12: S315 proves argv only and skips the inputs the brief names
- **Severity:** Low
- **Category:** Test gap
- **Where:** `tools/last-good-scripts-test` hunk `@@ -12801,6 +12801,89 @@`
- **What:** No row for a name with `.`, a CRLF config, `vendor = other ` with trailing whitespace, or any vendor but `other`, `nextcloud`, `owncloud`; nothing moves a byte; and `sz_fn` runs `bash -c` inheriting the harness's PATH, so whether `sed`, `head` and `tr` are the image's busybox there is not shown (the rule file's blindspot 34 is a `tr` class under busybox).
- **Failure scenario:** none demonstrated.
- **Evidence:** the rows present; the `sz_fn` definition; the rule file's reference to `proofs-307/X-size-same.sh` for bytes, which is not in the packet.
- **Fix:** add the rows; run `sz_fn` through the same shim path `sa_run` uses; include the bytes proof or its output in the audit trail.
- **Confidence:** high.

## 3. Refutations

- `[qa]` vs `[qa-cloud]`: `^\[qa\]` ends in a literal `\]`; no confusion.
- A section that is not first: the range starts at the matching header wherever it sits; S315's `other` (owncloud, second) row covers it.
- `type=webdav` with no spaces: ` *= *` matches zero spaces.
- Trailing spaces or `\r` on `type`/`vendor` values, `[qa]\r` headers: `tr -d '[:space:]'` strips both, and the header address has no `$` — assuming busybox `tr` expands `[:space:]` (blindspot 34 was `[:print:]`); boundary below.
- `#vendor = other`: `^vendor` ignores it → treated as absent → size-only, which is rclone's default quirk set.
- No `vendor` line at all (a wizard-written conf): returns 0; S315's `c2.conf` row covers it.
- `qa;rm`, `qa/x`, `qa:path`: refused by the class before any sed; `-` is literal at the class's end.
- Trailing colon: stripped once by `${1%:}`; tested.
- `--ignore-times` beside `--max-age --no-traverse`: the filter is on source mtime, the comparison is what is bypassed; `--no-traverse` still finds the destination object for `--backup-dir`.
- `--ignore-times` beside `--update` on one line: not reachable in the diff — the recent branch adds only `--ignore-times`; if a caller supplied `--update`, `--ignore-times` takes precedence, as intended for the recent set.
- Duplicate `--update`: exact-token dedupe, and rclone accepts a repeated boolean flag anyway; S315 counts it once for both scripts.
- `--update` beside `BACKUPMETHOD=sync` on the full pass: `--update` changes overwrite decisions only; `sync`'s deletion within the allowlist is pre-existing, `--delete-excluded` is stripped by both scripts (rule file, #307).
- A player's own `--modify-window` in `RCLONEOPTS`: inert on these remotes either way (F-SS-03).
- Data loss from either flag: the recent block forces `copy`, `--backup-dir` is on both scripts, neither flag deletes.
- A corrupt same-size save now overwriting a good cloud copy: the cloud follows the device, as it already did on every modtime remote; `-replaced` keeps one cycle.
- Two devices, the recent set overwriting a newer cloud copy: plain `copy` on Dropbox/S3 already does this (it transfers on any difference, in either direction); `--backup-dir` keeps the loser; D-CLOUD-102's model.
- The settings phase: both hunks sit inside `backup_game_saves`/`restore_game_saves`; the `--exclude=<backup_rel>/**` is appended after.
- Nextcloud and Dropbox: S315 asserts neither flag on recent, deliberate and restore passes.
- Exit 69 / 75: answered before any of this runs.
- A current clock at 1970 under A: the `stamp_epoch <= now` guard sends the run to the full pass; `age` is never negative.
- Upgrade, stale same-size copies already in the cloud: the first startup backup after the update (`--update`, local newer by ≥ 1 s) sends them; the startup restore skips them (local newer).
- `vendor = rclone` against a server that is not `rclone serve`: rclone believes it set the mtime, reads back the upload time, and transfers on every mtime difference — over-active, not blind; not this fix's problem.

## 4. Coverage boundary

- Where `REMOTENAME` comes from in each script — the file's first section on the recent path, `rclone listremotes | head -1` (sorted) elsewhere per the rule file — and whether the two can disagree; F-SS-05's scenario depends on it.
- Whether `all_opts` is local to the saves functions; if it is shared with the settings phase, `--ignore-times`/`--update` reach the archive upload (harmless, but unshown).
- The harness run's output: the packet has the rows, not a green run; and whether `sa_run`/`sz_fn` execute `sed`, `head`, `tr` through the image's busybox.
- `proofs-307/X-size-same.sh` and its output — the only bytes-level proof, cited by the rule file, absent here.
- `cloud-test-backend ls` and `backend_bytes`: the listing format per backend and whether the `-replaced` tree is listed (F-SS-06).
- `rclone backend features` output on 1.75.1 for `sharepoint`, `sharepoint-ntlm`, `fastmail`, `infinitescale` (F-SS-02), and the `--update`-alone dry-run (F-SS-03).
- `cloud_setup`'s WebDAV stanza: which `vendor` value the wizard writes, if any, and whether it ever writes `crypt`.
- The `-replaced` prune's count and whether F-SS-07's extra moves change what a player can recover.
- EmulationStation's callers: whether any pass `--update` with `--recent`, and whether the new `log_message` lines (suppressed on screen with `"false"`) are read anywhere.