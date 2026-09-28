# Punch List — the whole fix round for #307/#308, before the candidate (D-WORKFLOW-060)
**Generated:** 2026-09-28  
**Issue:** #313 (Phase 6; the Phase 7 gate below is its task list)
**Source Audit:** `docs/audits/2026_09_28-milestone-audit-of-the-fix-round/04-analysis.md`
**Total Items:** 34 (Critical: 0, High: 13, Medium: 18, Low: 3). PL-028 and PL-029 were added after the blind second opinion (S-06, S-30); PL-030..PL-034 after the refutation pass, which gated five leads as verification-first items (S-21, S-24, S-25, S-26, S-27) and re-graded PL-013 Medium; five acceptance texts were amended there (R-01, R-02, R-04, R-05 and the PL-006 widening), each marked in place. Every item is a defect this audit discovered, confirmed by the orchestrator against the source (`02-forward-audit.md` § Verification); the seats' remaining Mediums and Lows go to their streams as leads, listed at the end, and the first audit's carried items stay on #309.
---

## Instructions for Executing Agent

The FIX-NOW set is every High and Medium here: each lands in its stream's files with a case seen to fail first, by the stream that owns them (their agents keep their context) or by the integrator for the hooks, the harness, the lint and the rules; then one more cut, vm-qa and the proofs' scripts on it, and the candidate is called from that cut. A fix that changes what is written says how it treats what earlier builds wrote (D-WORKFLOW-050). Nothing here reopens a design decision; the register rows stand.

---

## High Priority
## PL-001: TIDY UP YOUR CLOUD FOLDERS deletes a tier copied onto itself when the pointer carries a trailing slash
- **Severity:** High
- **Category:** Data loss (a deletion before its precondition is read exactly)
- **Source Finding:** G2-A-01 (claude, A)
- **Owner area:** stream A, cloud_migrate_layout
- **Where:** projects/ROCKNIX/packages/network/rclone/sources/cloud_migrate_layout lines 447, 455, 531, 537, 546, 548, 565, 577, 594; relocate()
- **What:** the guards compare the conf's raw string with the constant; `SAVES_REMOTE="/ROCKNIX/Saves/"` is unequal, the tier is copied onto itself, verified clean, and its files deleted. Narrowed by the refutation pass: the comparison defect is demonstrated; the deletion is conditional on rclone's same-directory copy, which nobody ran -- the case runs the real shape.
- **Acceptance:** the three pointers are normalised (a leading slash, no trailing slash, no dot components) before every compare, and relocate refuses when src and dst name one folder; a harness case with the trailing-slash conf asserts nothing is copied or deleted and the pointer is left; run 2 of the proofs on the next cut unchanged

## PL-002: conf_valid accepts an executable "comment" after a carriage return, in five copies
- **Severity:** High
- **Category:** Configuration executed (fail-open validation)
- **Source Finding:** G2-A-01 (gpt, A); siblings from 3.6.5
- **Owner area:** stream A, the cloud scripts
- **Where:** cloud_backup:1043, cloud_restore:1104, cloud_sync_helper:247, cloud_content_backup:128, cloud_content_restore:131 (`rest()`)
- **What:** the grammar's trailing-whitespace class includes `\r`; bash does not treat a CR as a separator, so `EXTRA="x"<CR>#$(cmd)` passes and runs cmd when sourced. Narrowed by the refutation pass: three of the five copies gate a `source`; the content scripts' two feed `conf_get` readers -- all five are fixed.
- **Acceptance:** a CR anywhere in the file is refused by all five copies (the class loses `\r`, or the file is refused when it holds one); a case with the seat's line fails first and then passes in each script

## PL-003: backuptool sources cloud_sync.conf to read the backups folder
- **Severity:** High
- **Category:** Configuration executed
- **Source Finding:** G2-B-01 (gpt, B)
- **Owner area:** stream B, backuptool
- **Where:** projects/ROCKNIX/packages/rocknix/sources/scripts/backuptool:42
- **What:** the reader is `. /storage/.config/cloud_sync.conf` in a subshell; the string is validated after the file has run.
- **Acceptance:** the key is read as text (the first `SETTINGS_BACKUPS="..."` line, as the cleanup keeps it), never sourced; a case with a command in the conf shows nothing runs and the folder is read

## PL-004: a failed safety copy is restored over the valid configuration
- **Severity:** High
- **Category:** Last-known-good destroyed by its own fallback
- **Source Finding:** G2-A-02 (gpt, A)
- **Owner area:** stream A, cloud_backup and cloud_restore
- **Where:** cloud_backup:1170, cloud_restore:1231 (the `elif [ -s pre_cleanup ] && mv -f`)
- **What:** the fallback restores the pre-cleanup copy on non-emptiness alone; a `cp` that failed part-way (a full card) leaves a truncated prefix that replaces the untouched valid file.
- **Acceptance:** the copy is restored only when `cp` succeeded and `conf_valid` passes on the copy; a case that makes `cp` write a prefix and fail asserts the live file is byte-identical afterwards, in both scripts

## PL-005: the redaction fast path lets a flag-form password through
- **Severity:** High
- **Category:** Credential in a log
- **Source Finding:** G2-B-02 (gpt, B)
- **Owner area:** stream B, 001-functions
- **Where:** projects/ROCKNIX/packages/rocknix/profile.d/001-functions (`redact_credentials`, `passkey=`)
- **What:** `redact_credentials 'launcher --pass qa-value'` prints the value: the argument-mode detector knows `pass` before `=`/`:` only, the sed path knows the flag form.
- **Acceptance:** the fast-path trigger includes the flag form (`--?[A-Za-z0-9_.-]*pass` followed by whitespace); the two lines as cases, masked

## PL-006: a failed snapshot worklist reads as "nothing to protect"
- **Severity:** High
- **Category:** Restore without its snapshot (guard fails open)
- **Source Finding:** G2-B-04 (gpt, B); eight sibling mktemp sites
- **Owner area:** stream B, backuptool
- **Where:** backuptool snapshot_members (KEEP=$(mktemp), the appends, `return 4`); mktemp at 207, 473, 650-652, 758, 775, 1093
- **What:** `mktemp` and every append to KEEP are unchecked; an empty worklist returns 4 whatever emptied it, and the restore extracts without a snapshot or marker.
- **Acceptance:** one checked helper for every temporary file in backuptool; a failure returns a code the restore refuses (not 4); a case that makes mktemp fail asserts the restore refuses, and so does a failure after a successful mktemp (an append to KEEP, the final list write -- the refutation's widening); a genuinely empty selection still returns 4

## PL-007: an archive can overwrite the recovery marker that protects its own extraction
- **Severity:** High
- **Category:** Restore control file overwritten
- **Source Finding:** G2-B-06 (gpt, B); adjacent: the snapshot path
- **Owner area:** stream B, backuptool
- **Where:** backuptool:1302 (RESTORE_MARK), the skip lists at 1355 and the unzip equivalent
- **What:** the marker and the snapshot path are not excluded from extraction; an archive carrying `storage/.config/.restore-in-progress` overwrites the fresh marker, and the boot's revert reads the archived one.
- **Acceptance:** the marker and the snapshot path are in every skip list and never listed by the backup; a case with an archive carrying both asserts the fresh marker and the snapshot survive extraction

## PL-008: a quoted password beginning with whitespace passes the key scan
- **Severity:** High
- **Category:** Credential published
- **Source Finding:** G2-B-07 (gpt, B)
- **Owner area:** stream B, backuptool
- **Where:** backuptool CREDENTIAL_KEYS
- **What:** `password = " leading-text"` does not match (`"?[^"[:space:]]+` cannot consume the space after the quote); the file publishes.
- **Acceptance:** the value class allows whitespace after the opening quote; the line as a case, refused

## PL-009: a dot component walks past the saves-folder guard
- **Severity:** High
- **Category:** Tier separation bypassed
- **Source Finding:** G2-C-04 (gpt, C)
- **Owner area:** stream C, cloud_setup
- **Where:** cloud_setup syncpath_problem
- **What:** `/Mine/Backups/.` is accepted; dirname derives the siblings inside the saves folder.
- **Acceptance:** any `.` or `..` or empty component is refused before the sibling check; the seat's path as a case, refused with the folder to use

## PL-010: an escaped inner quote ends the masked range
- **Severity:** High
- **Category:** Credential in a log
- **Source Finding:** G2-E-core-01 (gpt, E-core)
- **Owner area:** stream E1, StringUtil::maskValueEnd
- **Where:** es-core/src/utils/StringUtil.cpp maskValueEnd (the inner-quote branch before the escape)
- **What:** under a single-quote-enclosing command, an inner `\"` closes the inner quote and the space after it ends the range: `sh -c 'tool --password "front\" back"'` leaves `back` unmasked.
- **Acceptance:** inside an inner quote a backslash skips the next character in both enclosing modes; a doctest with the seat's line, masked whole; es-syntax-check

## PL-011: the hooks pass a commit when their pattern is invalid or a stage fails
- **Severity:** High
- **Category:** A scanner that passes on its own error
- **Source Finding:** G2-E-tests-01 (gpt) = G2-I-02 (gpt, I); siblings in the ES fork
- **Owner area:** the integrator, .githooks in both repositories
- **Where:** .githooks/pre-commit and pre-push (the `hits=$(... | head -5 || true)` pipelines) in the distribution and in the ES fork
- **What:** run: a scratch repository with a staged credential line and `SECRET_PATTERNS='['` -- grep and sed print errors and the hook exits 0.
- **Acceptance:** the pattern is validated once before use and every stage's status is read in the shell that ran it: a producer, parser or redactor failure of any status refuses, and grep's 1 is a pass only at the matching stage (amended after the refutation pass, R-02); the constructed failure is the hook's own test, in both repositories

## PL-012: the audit-packet exemption stops the hooks reading a pushed path
- **Severity:** High
- **Category:** A scanner exemption keyed on a path
- **Source Finding:** G2-I-01 (claude and gpt, I)
- **Owner area:** the integrator, .githooks
- **Where:** .githooks/pre-push:211,228; .githooks/pre-commit:20
- **What:** a `.diff` under docs/audits/*/seats/ is never scanned, on a comment nothing checks; a packet built from unpushed branches, or a line appended to one, passes.
- **Acceptance:** the exemption is removed from both hooks; packet `.diff` copies are no longer committed (a `.gitignore` line; the copies already committed stay in history as the reviewed bytes, `git show <commit>:<path>` against the manifests' sha256 -- amended, R-05: a hash identifies bytes, history keeps them); the hooks' test covers a credential-shaped line in such a file, refused

## PL-014: cloud passwords already written to the persistent cloud_sync.log stay on the card
- **Severity:** High
- **Category:** A credential at rest, unanswered by the fix
- **Source Finding:** BS-1 (blindspots 10, 35, 62; C)
- **Owner area:** stream C, the cloud scripts' startup
- **Where:** the rclone package (cloud_sync_helper's startup, or the package's autostart); /var/log is a bind of /storage/.cache/log (D-SYS-001)
- **What:** C stopped `cloud_remote` logging rclone's failure output with `pass=<password>` in it; the lines already written by earlier builds stay, and the log is trimmed only past 1 MiB.
- **Acceptance:** the first run of the new scripts rewrites cloud_sync.log and its rotations with the password shapes masked, once, recorded by a stamp under /storage/.cache; a case over a planted line; the Already-written line names it

## Medium Priority
## PL-015: the new grammar refuses an escaped quote a hand-edited conf may carry
- **Severity:** Medium
- **Category:** Upgrade path (a working configuration refused)
- **Source Finding:** G2-A-05 (claude, A)
- **Owner area:** stream A, conf_valid (five copies)
- **Where:** the same five copies as PL-002
- **What:** ran: `RCLONEOPTS="--exclude \"*.tmp\" --progress"` -- rc 1; an upgraded device with such a conf reads YOUR CLOUD SYNC SETTINGS COULDN'T BE READ.
- **Acceptance:** bash's own escapes inside double quotes (`\"`, `\\`, `\$`) are accepted by all five copies; the line as a case, accepted; a still-refused shape names why in the log

## PL-016: the revert proceeds when the mount table cannot be read
- **Severity:** Medium
- **Category:** Guard fails open
- **Source Finding:** G2-B-08 (gpt, B)
- **Owner area:** stream B, chksysconfig
- **Where:** chksysconfig:144-147
- **What:** with /proc/mounts unreadable the fallback treats an existing parent folder as "not waiting".
- **Acceptance:** an unreadable table waits (fails closed) with its say line; a case with PROC_MOUNTS pointing at a missing file asserts the revert is deferred and the mark kept

## PL-017: the upstream-era move can replace an older archived ZIP of the same name
- **Severity:** Medium
- **Category:** Data loss (an archived backup overwritten)
- **Source Finding:** G2-B-10 (gpt, B)
- **Owner area:** stream B, backuptool
- **Where:** backuptool:1479
- **What:** `mv -f` into archive/upstream-era/ overwrites a same-named file.
- **Acceptance:** a collision keeps both (`mv -n`, then a dated suffix); a case with two same-named zips asserts both survive

## PL-018: the recovery fallback selects a backup that is usable but not whole
- **Severity:** Medium
- **Category:** Last-known-good (an incomplete record chosen)
- **Source Finding:** G2-E-core-04 (gpt, E-core)
- **Owner area:** stream E1, AtomicFileUtil
- **Where:** es-core/src/utils/AtomicFileUtil.cpp:370 (`backupOk && isUsableKeyValues(backup)`; `backupWhole` at 308 unused there)
- **What:** an incomplete backup can be loaded as the record.
- **Acceptance:** the fallback requires `backupWhole`; two es-file-tests cases (amended, R-04): a cut backup, no usable live file and a whole `.tmp` -> the `.tmp` recovers; a cut backup, no usable live file and no `.tmp` -> the defaults load and the cut backup is not recorded as last-known-good

## PL-019: the BIOS-only path writes the selection unchecked and continues without a press
- **Severity:** Medium
- **Category:** Consent skipped; a write unchecked
- **Source Finding:** G2-E-app-02 (claude) / G2-E-app-03 (gpt, E-app)
- **Owner area:** stream E2, GuiMenu
- **Where:** es-app/src/guis/GuiMenu.cpp:4211-4215
- **What:** when nothing but BIOS is to move, `--set-systems bios` is written through executeScriptLegacy, its result discarded, and onDone() called at once. Narrowed by the refutation pass: the unchecked write and the missing press on this path are the finding; whether a press preceded it is not.
- **Acceptance:** the write's status is checked (a failure ends with its why) and the continuation is a press on the verb as on every other path; an app-unit case; a frame at 640x480 of the page with only BIOS to move

## PL-020: the rotation generators read an `#elif 0` arm after `#if 0` as live
- **Severity:** Medium
- **Category:** Wrong table row from a dead branch
- **Source Finding:** G2-F2-01 (gpt, F2)
- **Owner area:** stream F2, the rotation generators
- **Where:** projects/ROCKNIX/packages/emulators/libretro/rotation-table-{fba,mame}.py preprocess()
- **What:** on `elif` the stack rule is `'gone' if top in ('one','gone') else 'live'`, so `#if 0 / #elif 0 / ... #endif` compiles its second arm.
- **Acceptance:** an `#elif 0` arm is dead and an `#elif 1` arm after a dead `#if 0` is live, other conditions live as before; the generator's fixture gains the four shapes; the five tables regenerate with a 0-line diff or the changed rows named

## PL-021: conf_get takes the last assignment where the cleanup keeps the first
- **Severity:** Medium
- **Category:** Two readers of one file
- **Source Finding:** BS-2 (blindspots 12, 46; C x A)
- **Owner area:** stream C, cloud_setup
- **Where:** cloud_setup:117 (`tail -n 1`); cloud_sync_cleanup_duplicates.sh keeps the first
- **What:** with a key written twice, the hub's line and `--content-location` name a different folder from the one the scripts use after the cleanup.
- **Acceptance:** `conf_get` takes the first assignment; a case with a duplicated key asserts both readers agree

## PL-022: busybox unzip passes a damaged stored ZIP member
- **Severity:** Medium
- **Category:** A check that cannot see a damaged stored member
- **Source Finding:** BS-3 (blindspots 8, 43; B)
- **Owner area:** stream B, backuptool
- **Where:** backuptool's ZIP verification (the `unzip -t` / `unzip -p` comment)
- **What:** measured on the image's busybox 1.36.1: a damaged stored member passes `unzip -t` and `unzip -p` (rc 0); a damaged deflated one fails (rc 1).
- **Acceptance:** each member is verified against its listed CRC-32 with a ZIP-compatible CRC-32 the image has (python3's `zlib.crc32`; POSIX `cksum` is a different checksum -- amended, R-01), or a legacy ZIP with stored members is refused with its why; healthy and damaged, stored and deflated members as cases, run with the image's busybox

## PL-023: skipped checks are not counted in the verdict
- **Severity:** Medium
- **Category:** A harness that says PASSED over unrun checks
- **Source Finding:** BS-4 (blindspot 39; D, C)
- **Owner area:** the integrator, tools/last-good-scripts-test
- **Where:** tools/last-good-scripts-test:10224
- **What:** 23 D SKIP branches and one C branch print SKIP; the verdict line counts FAIL only (run 69 on the build host: 0 skipped, so the hazard is a host without the tarballs).
- **Acceptance:** the summary reads `PASSED, N SKIPPED` and exits 3 when N > 0 and FAIL = 0 (vm-qa's run_suite reads 3 as SKIP); a run with a tarball hidden shows it

## PL-024: the upgrade rehearsal waits on a persistent boot.log line the previous boot wrote
- **Severity:** Medium
- **Category:** A wait a stale line satisfies
- **Source Finding:** BS-5 (blindspots 50, 55; F1)
- **Owner area:** stream F1, tools/vm-upgrade-rehearsal
- **Where:** tools/vm-upgrade-rehearsal:129-132; autostart appends to /var/log/boot.log; /var/log persists
- **What:** the "Autostart complete" wait passes at once on the previous boot's line; the check cannot fail.
- **Acceptance:** the wait reads the current boot (journalctl -b, or a line stamped with the boot id); a case with a stale line planted asserts the wait waits

## PL-028: an archive member outside storage/ is extracted and never rolled back
- **Severity:** Medium
- **Category:** Restore/rollback write-set mismatch (a member the snapshot never covers)
- **Source Finding:** G2-B-05 (gpt, B); the blind pass's S-06
- **Owner area:** stream B, backuptool
- **Where:** backuptool `archive_members` (the `^storage/` filter, line 5's awk and the tar case at 479-480); the extraction `tar -xzf ... -C / -X "${SKIP}"` (1356) and the unzip equivalent
- **What:** the snapshot lists `storage/*` regular files; extraction runs the whole archive minus a skip list, so a member outside `storage/` (a legacy or foreign archive's `tmp/...`) is written to `/` and never rolled back. Confirmed Medium in § Verification and then carried nowhere -- neither a punch item nor a lead -- until the blind pass named it (S-06, High there); the grade stays Medium: it needs an archive this tool never writes.
- **Acceptance:** an archive whose member list holds a path not under `storage/` is refused before anything is extracted, with its why; a case with such an archive (tar and zip) asserts nothing outside `storage/` is written and the refusal is printed

## PL-029: the candidate's own proofs are not yet on the candidate
- **Severity:** Medium
- **Category:** Verification gap (S-30)
- **Source Finding:** the blind pass's S-30; § 3.5-3.6
- **Owner area:** the integrator, the next cut
- **Where:** `tools/vm-upgrade-rehearsal` (not run on `1b0d233657`), the layout migration proved in harness cases and not on a guest, the E1/E2 follow-up proofs, the proofs runner's 3 NOT RUN, the Wi-Fi stand-in without an adapter
- **What:** clean-image and harness results were read as covering the kept-`/storage` upgrade and the endpoint-dependent journeys; on the cut the candidate is called from, each of those has its own artifact or is named as a gap the VM cannot close.
- **Acceptance:** on the next cut: `tools/vm-upgrade-rehearsal` from the previous device build passes and its stamp is in the QA log; the migration runs on a guest against the QA cloud with its before/after listings filed; the E1/E2 follow-ups' proofs run under `proofs-307/`; the runner's NOT RUN count is 0 or each is named with what only a device can show (`vm-first.md`); the Wi-Fi item names the physical fact

## PL-013: the rule's log-redaction example preserves the secret
- **Severity:** Medium (High until the refutation pass re-graded it: a guide a person runs, not a shipped disclosure path)
- **Category:** A rule that leaks what it says it masks
- **Source Finding:** G2-I-10 (gpt, I)
- **Owner area:** the integrator, engineering-practices.md
- **Where:** .claude/rules/engineering-practices.md:555
- **What:** `\1***` reproduces the value captured in group 1.
- **Acceptance:** the example closes its group at the delimiter (`((token|key|passw[a-z]*|psk|user)[=:])[^ ]*` -> `\1***`) and says a masking pattern is proven on a fake `key=SECRET` line first; `tools/rules-check` clean


## PL-030: the save-state COPY runs outside the transfer lock
- **Severity:** Medium (verification-first)
- **Category:** Concurrency (a queued operation outside the guard)
- **Source Finding:** G2-E-app-01 (claude, E-app); the blind pass's S-21; gated by the refutation pass
- **Owner area:** stream E2, SaveStateBookkeeper
- **Where:** es-app/src/SaveStateBookkeeper.cpp `runCopy` (after the delete's lock logic at 64-156)
- **What:** DELETE waits on the transfer lock and holds it; COPY takes no lock and cannot wait on `transferGone`, so a shell-started cloud transfer can overlap a copy; a UI-time busy check does not cover the queued copy's later execution.
- **Acceptance:** the whole COPY operation is protected by the same guard as DELETE, with an app-unit case that fails first; or a source-backed refutation names the line that already serialises it

## PL-031: a failed readiness comparison is replaced by a cache-operation count
- **Severity:** Medium (verification-first)
- **Category:** Fail-open measurement (a substituted number)
- **Source Finding:** G2-D-02 (gpt, D); the blind pass's S-24; gated by the refutation pass
- **Owner area:** stream D, raofflineproxy-ctl
- **Where:** raofflineproxy-ctl ~1917 and ~2220 (`ADDED`/`MADE` inside `&&` chains)
- **What:** `games_made_ready` now fails on an unreadable comparison (O-14), but its callers can publish the number of cache operations as "games made ready" when it does.
- **Acceptance:** with the comparison forced to fail after nonzero cache operations, the published count is refused or reported unknown, never substituted; a harness case (section t) or a source-backed refutation naming the line

## PL-032: attempt ownership does not make a closed sign-in state final
- **Severity:** Medium (verification-first)
- **Category:** Lifecycle (a terminal state reopened)
- **Source Finding:** G2-C-03 (gpt, C) with G2-C-02 (gpt); the blind pass's S-25; gated by the refutation pass (Medium there, Low in the triage)
- **Owner area:** stream C, cloud_oauth
- **Where:** cloud_oauth ~506 `write_owned(self.attempt, status="signed-in")`; the `failed -> waiting` transition within one attempt
- **What:** a late same-attempt `signed-in` write can reopen a state the player closed without a new attempt; ownership checks the attempt id, not the terminal state.
- **Acceptance:** terminal-state ordering is gated together with its callback and marker side effects, including a close without a successor attempt, with a case that fails first; or a source-backed refutation naming the line

## PL-033: the listener predicate rejects a reachable dual-stack listener
- **Severity:** Medium (conditional, verification-first)
- **Category:** Wrong predicate (a reachable service read as absent)
- **Source Finding:** G2-D-01 (claude, D); O-15; the blind pass's S-26; gated by the refutation pass
- **Owner area:** stream D, raofflineproxy
- **Where:** the listener gate's `::` case (O-15)
- **What:** rejecting `::` rejects a listener PPSSPP can reach through `127.0.0.1` when `bindv6only=0`; whether the shipped proxy ever binds `::` is not established.
- **Acceptance:** the line where the shipped proxy is bound IPv4-only is named and the item closes on it; or the predicate reads a dual-stack listener as reachable, with a case

## PL-034: a capture released for a launch past the age bound has no safety proof
- **Severity:** Medium (verification-first)
- **Category:** Safety evidence (age is not termination)
- **Source Finding:** O-6; §3.5 (capture gate x capture lock); the blind pass's S-27; gated by the refutation pass
- **Owner area:** stream A, cloud_capture (and the gate in E2's FileData, read only)
- **Where:** the capture gate's 120 s age escape (D-UI-115's policy stands); `cloud_capture`'s lock
- **What:** a capture blocked on the lock past the age is released for the launch; nothing shows the old capture is finished or cannot write saves the running game owns.
- **Acceptance:** a harness case with a capture blocked on the lock, the launch released, and what the capture does when it gets the lock -- safe overlap or cancellation shown; or the precise accepted risk recorded with the line (the 120 s policy is not reopened)

## Low Priority
## PL-025: the harness under vm-qa runs with SIGPIPE ignored
- **Severity:** Low
- **Category:** Runner divergence
- **Source Finding:** G2-I-04 (claude, I)
- **Owner area:** the integrator, tools/vm-qa
- **Where:** tools/vm-qa (the python exec wrapper)
- **What:** Python ignores SIGPIPE at startup and execv keeps the disposition; by hand the harness has it default.
- **Acceptance:** the wrapper resets SIGPIPE beside SIGINT; a check in the harness prints both dispositions

## PL-026: pre-commit's grep runs over the path label as well as the content
- **Severity:** Low
- **Category:** A false refusal
- **Source Finding:** G2-I-02 (claude) / G2-I-03 (gpt, I)
- **Owner area:** the integrator, .githooks/pre-commit
- **Where:** .githooks/pre-commit (the awk label)
- **What:** a credential-shaped file name is refused as content (pre-push anchors past the path for this reason).
- **Acceptance:** the grep is anchored past the label as pre-push's is; the hooks' test adds a file named like a key

## PL-027: es-player-text.md lacks the two why sentences the integrator added
- **Severity:** Low
- **Category:** The rule behind the round
- **Source Finding:** G2-A-04 (claude, A)
- **Owner area:** the integrator, es-player-text.md
- **Where:** .claude/rules/es-player-text.md (the why list)
- **What:** the list stops at the #307 additions; CHECK WHAT WOULD CHANGE FIRST and YOUR CLOUD SYNC SETTINGS COULDN'T BE SAVED are in the card's table and not in the rule.
- **Acceptance:** the two sentences in the list, with their scripts; rules-check clean

## Leads for the streams (the seats' evidence; not gated here)

Each stream reads its leads as it read the first audit's findings: fix with a case first, or withdraw with the line that refutes it, in its follow-up report. None blocks the candidate on the orchestrator's read; one that turns out to is added here.

| Stream | Findings | In short |
|---|---|---|
| A | G2-A-02, G2-A-03, G2-A-06 (claude); G2-A-03, G2-A-04 (gpt) | a cut between the pointer write and the delete (#309 PL-002's subject); the card and the row disagreeing on a `69 gaps` run; the lock held through the sealing walk; other assignment forms read as absent; a plan-removal failure ignored |
| B | G2-B-02 (claude); G2-B-03, G2-B-09, G2-B-11 (gpt) | a device whose roms folder is never a mount point waits for ever; `ln` into a directory at the lock path; the seed manifest's unchecked read; persistence failures of the SSID/key pair |
| C | G2-C-01 (claude); G2-C-01, G2-C-02, G2-C-03 (gpt) | keystrokes before a focused field dropped and not resent; the reader's value forms; a backward status transition; the success path and a close without a new attempt |
| D | G2-D-01 (claude); G2-D-01, G2-D-02, G2-D-03 (gpt) | the listener gate's `::` case; a GameId split at the 512-character prefix; a substituted count when games_made_ready fails; the token check and the marker's removal not one operation |
| E1 | G2-E-core-01 (claude); G2-E-core-02, -03, -05, -06, -07 (gpt) | a quoted string ending at the first enclosing byte; recovery without the lock; only the first save over a cut base excluded; the mode on a failed restore; pending changes dropped on a failed load; a false conflict from confMap |
| E2 | G2-E-app-01 (claude); G2-E-app-01, -02, -04, -05 (gpt) | runCopy without the lock; a namesake profile outranking the active one; the watcher hand-off; the hung rule as consent (accepted risk, D-UI-115); stopRun's cmdline test |
| F1 | G2-F1-01..04 (gpt) | migrations that stop on a stamp alone; the first run deleting any file at a listed path; ownership records from a generated value; a socket node as proof |
| F2 | G2-F2-02, G2-F2-03 (gpt) | provenance from the configuration parse; assertions on a directory entry |
| the integrator | G2-I-05..09 (claude), G2-I-04..09 (gpt); the E-tests Mediums | the lint's bullet form, section boundary and seat attribution; the fixture's early return; the pattern file's load check; the ES test suites' oracles and doubles |

## Pre-existing tracked scope (exempt from the Phase 7 gate)

- #309: the fix audit's fourteen carried items (PL-002 there is G2-A-02's subject; PL-003 there is the picker's SSID column; PL-006 there is this audit).
- #310: the launch/exit cycle's 10 MiB a game.
- #42: the public rocknix.org page (`documentation-accuracy.md`'s gate).
- D-UI-111, D-NET-012, D-NET-013: open in the register.

## Phase 7 resolution gate

Recorded per item as it is resolved: the outcome (resolved / deferred / rejected), the commit or issue, the evidence. Open until then.

| Item | Severity | Outcome | Evidence |
| --- | --- | --- | --- |
| PL-001 | High | | |
| PL-002 | High | | |
| PL-003 | High | | |
| PL-004 | High | | |
| PL-005 | High | | |
| PL-006 | High | | |
| PL-007 | High | | |
| PL-008 | High | | |
| PL-009 | High | Resolved | Resolved `505dae63aa` (merged `8840998047`) -- `syncpath_problem` refuses an empty, `.` or `..` part before any other check and offers the folder the path meant (`Try /Mine/Saves.`); harness case CF1: 8 FAIL before (`--set-saves-remote /Mine/Backups/. rc 0; config: SAVES_REMOTE="/Mine/Backups/." …`), 10 PASS after with two controls (`/Mine/.hidden/Saves`, `/Mine/..x/Saves` accepted); already written: a stored folder and its derived siblings are left, the next change is refused with a clean one offered; the integrator: the harness on the merged tree `PASSED` (1065 PASS, 16:59 UTC), and at `f3d19dc8fb` in `pl-c` `40 CHECK(S) FAILED`, all C's |
| PL-010 | High | Resolved | Resolved ES `3157d1a69` (with `107597312` for shellQuote's `'\''` form) -- `maskValueEnd` reads the inner command as its shell would; MaskSecretsTests "an escaped quote inside an inner quoted value does not end it": 4 of 6 FAIL before, 6/6 after; the integrator ran the branch's binaries: es-unit-tests 1824/1824; `tools/es-syntax-check` PASS on StringUtil.cpp; already written: the mask runs at log time, lines logged before stay in es_log's four archives until rotated |
| PL-011 | High | Resolved | Resolved `3e70ef9239` (ES `7d999fd15`) -- `.githooks/guard-lib` compiles both lists before use and reads every grep's status (1 = nothing, 0 = hits, else refuse); `.githooks/hooks-test` 27 cases PASS incl. "a credential list that does not compile: refused" for pre-commit and pre-push; the ES fork's `pre-push-test` 21 cases PASS with the same case |
| PL-012 | High | Resolved | Resolved `3e70ef9239` + `f3d19dc8fb` -- the exemption is gone from both hooks (`hooks-test`: "the same line under an audit packet (no path is exempt): refused"); `.gitignore` `/docs/audits/*/seats/*.diff`; the 30 tracked packets untracked (`git rm --cached`, kept on disk); the reviewed bytes stay retrievable from history (`git show cba6ae23f2~1:<path>`, sha256 per manifest; R-05: the regeneration claim is dropped); the ES test's FAKE= exemption is gone too (ES `3cd229a51`, the fixture built at run time); the one exemption left is a unit test's `maskSecrets(` line, E1 asked to split its literals |
| PL-013 | Medium | Resolved | Resolved `f3d19dc8fb` -- `engineering-practices.md` line 554 closes the group at the delimiter (`((…)[=:])[^ ]*` -> `\1***`) with the proof paragraph (a fake `key=SECRET` line, `SECRET` absent from the output); `tools/rules-check` clean |
| PL-014 | High | Resolved | Resolved `790011706a` (merged `8840998047`) -- `cloud_log_scrub`, installed by one `package.mk` line and run in the foreground by `autostart/102-cloud-saves` before the capture pass: once per device it rewrites every `cloud_sync.log*` under `/storage/.cache/log` through `redact_credentials` (old `cloud_remote` failure lines become `rclone config create failed (1)`, rclone's words in `cloud_oauth` failures `<redacted>`), never changing a line count, and stamps `/storage/.cache/cloud_sync/log-scrubbed` (`scrubbed=<epoch> files=<n> lines=<n>`; no stamp without the filter, so the next boot retries); case CF3: 7 FAIL before (`still in the cloud log: PLANT…`), 8 PASS after; 0.16 s over 0.66 MB with the image's busybox, at boot, never on the launch path; `tools/pkgcheck rclone` 0; already written: this item IS what earlier builds wrote, masked in place on the first boot of this build; the rehearsal with a planted line is PL-029's; the integrator: the harness on the merged tree `PASSED` (1065 PASS, 16:59 UTC), and at `f3d19dc8fb` in `pl-c` `40 CHECK(S) FAILED`, all C's |
| PL-015 | Medium | | |
| PL-016 | Medium | | |
| PL-017 | Medium | | |
| PL-018 | Medium | Resolved | Resolved ES `0c6665bf1` + `f297007de` (amended per R-04) -- the Backup fallback requires `backupWhole`; two es-file-tests cases (a whole `.tmp` beside a cut record recovers; no `.tmp` -> the defaults, the cut record not recorded) and es-conf-tests on the shipped SystemConf: 11 of 19 FAIL before (`CHECK( c.source == Temporary )`), all PASS after; the integrator ran es-file-tests 3389/3389 and es-conf-tests 98/98; already written: a cut record from an earlier build is no longer loaded and the next whole record replaces it |
| PL-019 | Medium | Resolved | ES `bf00e91c9` -- BIOS alone now opens the CONTENT TO BACK UP / RESTORE page (SYSTEMS reading NONE, a BIOS FILES group, BACK and the verb) and the run starts only on the verb; `cloudSaveSelection` runs `--set-systems`, reads the file back and continues only when rc is 0 and the file names exactly what was ticked, else `COULDN'T SAVE WHAT YOU TICKED, SO NOTHING WAS BACKED UP.` (proposed words, D-UI-116) and the page stays; `tests/cloud-content-selection.py` 0 of 5 before, 13 of 13 after, a mutation trusting rc alone fails 3; the integrator ran app-unit-tests 119/119; es-syntax-check PASS; French appended, es-untranslated 603/603; already written: a selection file from an earlier build is read as before and replaced on the next press; the 640x480 frame is the next cut's |
| PL-020 | Medium | | |
| PL-021 | Medium | Resolved | Resolved `9c9951798b` (merged `8840998047`) -- `conf_get` reads the first assignment as the cleanup and the content scripts do (D-CLOUD-149, reversing the first round's last-wins); case CF2: 2 FAIL before (`--info names '/Second/Saves', the saves scripts after the cleanup '/ROCKNIX/Saves'`), PASS after; already written: nothing is written; the integrator: the harness on the merged tree `PASSED` (1065 PASS, 16:59 UTC), and at `f3d19dc8fb` in `pl-c` `40 CHECK(S) FAILED`, all C's |
| PL-022 | Medium | | |
| PL-023 | Medium | Resolved | Resolved `f3d19dc8fb` -- `skip()` counts the 25 sites; the verdict reads `PASSED, N SKIPPED` and exits 3 when FAIL = 0 and N > 0 (`vm-qa` `run_suite` reads 3 as SKIP, line 137). Proof: the committed harness on the host `PASSED` rc 0 (1002 PASS, 0 SKIP; `harness-pl023-normal.log`); in a worktree whose client pin names no tarball `PASSED, 22 SKIPPED -- a check that did not run has not passed` rc 3 (839 PASS, 22 SKIP; `harness-pl023-skip.log`) |
| PL-024 | Medium | Resolved | Resolved `104433dbe8` (merged `e3394a893f`) -- the rehearsal's wait polls the guest's boot id and `systemctl is-active rocknix-autostart.service` and ends only on `<this boot's id> active`; `failed` ends it early, a wait that runs out records what it last read and the check FAILs; `/var/log/boot.log` is no longer read. Harness case F1r-a lifts the wait's lines against a fixture guest whose boot.log already holds the previous boot's line: FAIL before (`the wait ended on 'polls=1 autostarted=yes' where autostart finished on poll 4`, stream F1's run at `f3d19dc8fb`, and the integrator's own re-run there at 16:48 UTC: `11 CHECK(S) FAILED, 0 SKIPPED`, every one an F1 case), PASS after; the integrator's harness run on the merged tree: `PASSED` rc 0 (16:40 UTC); already written: nothing, the rehearsal keeps no state; the rehearsal itself runs on the next cut (PL-029) |
| PL-025 | Low | Resolved | Resolved `f3d19dc8fb` -- `tools/vm-qa`'s exec wrapper resets SIGPIPE beside SIGINT; the harness prints its inherited dispositions first (`signals: SigIgn=… SIGINT ignored=N SIGPIPE ignored=N`; the first cut of the line read `/proc/self/status` inside `$(awk …)`, awk's own process, which reads SIGPIPE ignored where the harness's bash has it default; it reads `/proc/$$/status` since 17:00 UTC, and the wrapper's reset was checked by hand: through it into `bash -c grep`, SigIgn `0x1000001`, SIGPIPE clear) |
| PL-026 | Low | Resolved | Resolved `3e70ef9239` -- `guard_scan` anchors every pattern after the label (`^([^\t]*\t)+.*(…)`); `hooks-test`: "a file NAMED like a key, clean inside (the label is not scanned): allowed" in pre-commit and at push |
| PL-027 | Low | Resolved | Resolved `f3d19dc8fb` -- `es-player-text.md`'s why list carries `CHECK WHAT WOULD CHANGE FIRST` (`cloud_content_restore`) and `YOUR CLOUD SYNC SETTINGS COULDN'T BE SAVED` (`cloud_migrate_layout`); `tools/rules-check` clean |
| PL-028 | Medium | | |
| PL-029 | Medium | | |
| PL-030 | Medium | Withdrawn | refuted from the source (E2, checked by the integrator): the COPY's only write to the saves tree is `copyToSlot` at the press (`GuiSaveState.cpp:516`) behind `savesTreeBusy` (`:499`, `:33`); the queued record (`:524`) is `cloud_capture --adopt`, which writes only under `/storage/.cache/cloud_sync` (`cloud_capture:674` MANIFEST, `:115` STAGE) under `capture_lock` (`:1559`); its only saves-folder write is `--retire --unlink`, the DELETE's; no transfer script reads the manifests or the stage (`grep -n "manifest-\|cloud_capture\|/stage\|\.capture"` over the five cloud scripts: 0 lines). Adding DELETE's guard would drop a copy's record whenever a transfer holds the lock. The false `TransferLock` comment goes to E1 |
| PL-031 | Medium | Resolved | the script side `3bc003dde8` (merged `a566bcc2df`): `added=` in the scan/top-up stamp is the measured count, `0` when nothing was cached, the word `unknown` when the store could not be read, the cache-count fallback gone; harness case D34: 4 FAIL before (`stamp: … 0 topup cached=3 … added=3 -- a failed measurement replaced by the cache count`), 4 PASS after (`added=unknown`); the interface side ES `6d8bdab4e` (pin `2b377f0fbe`): `parseScanStamp` reads `unknown` as its own answer and the top-up card says how many games are ready, never a count it cannot know -- es-unit-tests `CHECK( -1 == -2 )` before, 1825/1825 after; proxycards-tests `5 MORE GAMES ARE READY. == 14 GAMES ARE READY.` before, 67/67 after; the integrator ran both binaries and the harness on the merged tree (`PASSED`, 1077 PASS, 17:12 UTC) and the harness at `f3d19dc8fb` in `pl-d` (`7 CHECK(S) FAILED`, the seven all D's: D34's four, D33's two, D35's one); already written: an old stamp with a number reads as that number, one with none as before |
| PL-032 | Medium | Resolved | Resolved `f945f4182a` (merged `8840998047`) -- each attempt has its own id; `write_owned` takes `owner=` and `from_status=`: `waiting` only from `starting`, `signed-in` only from `starting`/`waiting` by the current attempt, the closing `failed` only from those; a refused success deletes the remote it made and writes no marker; `holder.end()` waits up to 45 s for a collector still saving (D-CLOUD-150); case CF4: 7 FAIL before (`a dead attempt republished as waiting`; `after A finished behind B: … marker True, A's remote removed False`), 7 PASS after plus a control; already written: the state lives in `/var/run`, nothing persists; the integrator: the harness on the merged tree `PASSED` (1065 PASS, 16:59 UTC), and at `f3d19dc8fb` in `pl-c` `40 CHECK(S) FAILED`, all C's |
| PL-033 | Medium | Withdrawn | on the source, with a guard (`759b65b5c5`, merged `a566bcc2df`): the pinned client listens on IPv4 only -- `proxy_service.py:267` keeps socketserver's `AF_INET` (line 208 unpatched), `boot.py:32` and `:58` make `AF_INET` sockets, `config.py:367` defaults `proxy_host` to `127.0.0.1` and nothing sets it -- so leaving `::` out of the listener checks never turns the shipped proxy away; harness case D36 runs the pinned client's `run-service` in a network namespace (bwrap `--unshare-net`) and asks both listener checks of the real socket (`ctl=1 ppsspp=1 looks=2; tcp 0100007F:1F90`), so a pin that moves the listener to `::` fails the suite rather than the unit at every boot; the constructed failure read `ctl=0 ppsspp=0 looks=31; tcp6 …:1F90` |
| PL-034 | Medium | | |

## Punch index

```yaml
punch_index:
- id: PL-001
  severity: 'High'
  category: 'Data loss (a deletion before its precondition is read exactly)'
  source_finding: 'G2-A-01 (claude, A)'
  owner_area: 'stream A, cloud_migrate_layout'
  where: 'projects/ROCKNIX/packages/network/rclone/sources/cloud_migrate_layout lines 447, 455, 531, 537, 546, 548, 565, 577, 594; relocate()'
  acceptance: 'the three pointers are normalised (a leading slash, no trailing slash, no dot components) before every compare, and relocate refuses when src and dst name one folder; a harness case with the trailing-slash conf asserts nothing is copied or deleted and the pointer is left; run 2 of the proofs on the next cut unchanged'
  outcome: open
- id: PL-002
  severity: 'High'
  category: 'Configuration executed (fail-open validation)'
  source_finding: 'G2-A-01 (gpt, A); siblings from 3.6.5'
  owner_area: 'stream A, the cloud scripts'
  where: 'cloud_backup:1043, cloud_restore:1104, cloud_sync_helper:247, cloud_content_backup:128, cloud_content_restore:131 (`rest()`)'
  acceptance: 'a CR anywhere in the file is refused by all five copies (the class loses `\r`, or the file is refused when it holds one); a case with the seat''s line fails first and then passes in each script'
  outcome: open
- id: PL-003
  severity: 'High'
  category: 'Configuration executed'
  source_finding: 'G2-B-01 (gpt, B)'
  owner_area: 'stream B, backuptool'
  where: 'projects/ROCKNIX/packages/rocknix/sources/scripts/backuptool:42'
  acceptance: 'the key is read as text (the first `SETTINGS_BACKUPS="..."` line, as the cleanup keeps it), never sourced; a case with a command in the conf shows nothing runs and the folder is read'
  outcome: open
- id: PL-004
  severity: 'High'
  category: 'Last-known-good destroyed by its own fallback'
  source_finding: 'G2-A-02 (gpt, A)'
  owner_area: 'stream A, cloud_backup and cloud_restore'
  where: 'cloud_backup:1170, cloud_restore:1231 (the `elif [ -s pre_cleanup ] && mv -f`)'
  acceptance: 'the copy is restored only when `cp` succeeded and `conf_valid` passes on the copy; a case that makes `cp` write a prefix and fail asserts the live file is byte-identical afterwards, in both scripts'
  outcome: open
- id: PL-005
  severity: 'High'
  category: 'Credential in a log'
  source_finding: 'G2-B-02 (gpt, B)'
  owner_area: 'stream B, 001-functions'
  where: 'projects/ROCKNIX/packages/rocknix/profile.d/001-functions (`redact_credentials`, `passkey=`)'
  acceptance: 'the fast-path trigger includes the flag form (`--?[A-Za-z0-9_.-]*pass` followed by whitespace); the two lines as cases, masked'
  outcome: open
- id: PL-006
  severity: 'High'
  category: 'Restore without its snapshot (guard fails open)'
  source_finding: 'G2-B-04 (gpt, B); eight sibling mktemp sites'
  owner_area: 'stream B, backuptool'
  where: 'backuptool snapshot_members (KEEP=$(mktemp), the appends, `return 4`); mktemp at 207, 473, 650-652, 758, 775, 1093'
  acceptance: 'one checked helper for every temporary file in backuptool; a failure returns a code the restore refuses (not 4); a case that makes mktemp fail asserts the restore refuses, and so does a failure after a successful mktemp (an append to KEEP, the final list write -- the refutation''s widening); a genuinely empty selection still returns 4'
  outcome: open
- id: PL-007
  severity: 'High'
  category: 'Restore control file overwritten'
  source_finding: 'G2-B-06 (gpt, B); adjacent: the snapshot path'
  owner_area: 'stream B, backuptool'
  where: 'backuptool:1302 (RESTORE_MARK), the skip lists at 1355 and the unzip equivalent'
  acceptance: 'the marker and the snapshot path are in every skip list and never listed by the backup; a case with an archive carrying both asserts the fresh marker and the snapshot survive extraction'
  outcome: open
- id: PL-008
  severity: 'High'
  category: 'Credential published'
  source_finding: 'G2-B-07 (gpt, B)'
  owner_area: 'stream B, backuptool'
  where: 'backuptool CREDENTIAL_KEYS'
  acceptance: 'the value class allows whitespace after the opening quote; the line as a case, refused'
  outcome: open
- id: PL-009
  severity: 'High'
  category: 'Tier separation bypassed'
  source_finding: 'G2-C-04 (gpt, C)'
  owner_area: 'stream C, cloud_setup'
  where: 'cloud_setup syncpath_problem'
  acceptance: 'any `.` or `..` or empty component is refused before the sibling check; the seat''s path as a case, refused with the folder to use'
  outcome: resolved
- id: PL-010
  severity: 'High'
  category: 'Credential in a log'
  source_finding: 'G2-E-core-01 (gpt, E-core)'
  owner_area: 'stream E1, StringUtil::maskValueEnd'
  where: 'es-core/src/utils/StringUtil.cpp maskValueEnd (the inner-quote branch before the escape)'
  acceptance: 'inside an inner quote a backslash skips the next character in both enclosing modes; a doctest with the seat''s line, masked whole; es-syntax-check'
  outcome: resolved
- id: PL-011
  severity: 'High'
  category: 'A scanner that passes on its own error'
  source_finding: 'G2-E-tests-01 (gpt) = G2-I-02 (gpt, I); siblings in the ES fork'
  owner_area: 'the integrator, .githooks in both repositories'
  where: '.githooks/pre-commit and pre-push (the `hits=$(... | head -5 || true)` pipelines) in the distribution and in the ES fork'
  acceptance: 'the pattern is validated once before use and every stage''s status is read in the shell that ran it: a producer, parser or redactor failure of any status refuses, and grep''s 1 is a pass only at the matching stage (amended after the refutation pass, R-02); the constructed failure is the hook''s own test, in both repositories'
  outcome: resolved
- id: PL-012
  severity: 'High'
  category: 'A scanner exemption keyed on a path'
  source_finding: 'G2-I-01 (claude and gpt, I)'
  owner_area: 'the integrator, .githooks'
  where: '.githooks/pre-push:211,228; .githooks/pre-commit:20'
  acceptance: 'the exemption is removed from both hooks; packet `.diff` copies are no longer committed (a `.gitignore` line; the copies already committed stay in history as the reviewed bytes, `git show <commit>:<path>` against the manifests'' sha256 -- amended, R-05: a hash identifies bytes, history keeps them); the hooks'' test covers a credential-shaped line in such a file, refused'
  outcome: resolved
- id: PL-014
  severity: 'High'
  category: 'A credential at rest, unanswered by the fix'
  source_finding: 'BS-1 (blindspots 10, 35, 62; C)'
  owner_area: 'stream C, the cloud scripts'' startup'
  where: 'the rclone package (cloud_sync_helper''s startup, or the package''s autostart); /var/log is a bind of /storage/.cache/log (D-SYS-001)'
  acceptance: 'the first run of the new scripts rewrites cloud_sync.log and its rotations with the password shapes masked, once, recorded by a stamp under /storage/.cache; a case over a planted line; the Already-written line names it'
  outcome: resolved
- id: PL-015
  severity: 'Medium'
  category: 'Upgrade path (a working configuration refused)'
  source_finding: 'G2-A-05 (claude, A)'
  owner_area: 'stream A, conf_valid (five copies)'
  where: 'the same five copies as PL-002'
  acceptance: 'bash''s own escapes inside double quotes (`\"`, `\\`, `\$`) are accepted by all five copies; the line as a case, accepted; a still-refused shape names why in the log'
  outcome: open
- id: PL-016
  severity: 'Medium'
  category: 'Guard fails open'
  source_finding: 'G2-B-08 (gpt, B)'
  owner_area: 'stream B, chksysconfig'
  where: 'chksysconfig:144-147'
  acceptance: 'an unreadable table waits (fails closed) with its say line; a case with PROC_MOUNTS pointing at a missing file asserts the revert is deferred and the mark kept'
  outcome: open
- id: PL-017
  severity: 'Medium'
  category: 'Data loss (an archived backup overwritten)'
  source_finding: 'G2-B-10 (gpt, B)'
  owner_area: 'stream B, backuptool'
  where: 'backuptool:1479'
  acceptance: 'a collision keeps both (`mv -n`, then a dated suffix); a case with two same-named zips asserts both survive'
  outcome: open
- id: PL-018
  severity: 'Medium'
  category: 'Last-known-good (an incomplete record chosen)'
  source_finding: 'G2-E-core-04 (gpt, E-core)'
  owner_area: 'stream E1, AtomicFileUtil'
  where: 'es-core/src/utils/AtomicFileUtil.cpp:370 (`backupOk && isUsableKeyValues(backup)`; `backupWhole` at 308 unused there)'
  acceptance: 'the fallback requires `backupWhole`; two es-file-tests cases (amended, R-04): a cut backup, no usable live file and a whole `.tmp` -> the `.tmp` recovers; a cut backup, no usable live file and no `.tmp` -> the defaults load and the cut backup is not recorded as last-known-good'
  outcome: resolved
- id: PL-019
  severity: 'Medium'
  category: 'Consent skipped; a write unchecked'
  source_finding: 'G2-E-app-02 (claude) / G2-E-app-03 (gpt, E-app)'
  owner_area: 'stream E2, GuiMenu'
  where: 'es-app/src/guis/GuiMenu.cpp:4211-4215'
  acceptance: 'the write''s status is checked (a failure ends with its why) and the continuation is a press on the verb as on every other path; an app-unit case; a frame at 640x480 of the page with only BIOS to move'
  outcome: resolved
- id: PL-020
  severity: 'Medium'
  category: 'Wrong table row from a dead branch'
  source_finding: 'G2-F2-01 (gpt, F2)'
  owner_area: 'stream F2, the rotation generators'
  where: 'projects/ROCKNIX/packages/emulators/libretro/rotation-table-{fba,mame}.py preprocess()'
  acceptance: 'an `#elif 0` arm is dead and an `#elif 1` arm after a dead `#if 0` is live, other conditions live as before; the generator''s fixture gains the four shapes; the five tables regenerate with a 0-line diff or the changed rows named'
  outcome: open
- id: PL-021
  severity: 'Medium'
  category: 'Two readers of one file'
  source_finding: 'BS-2 (blindspots 12, 46; C x A)'
  owner_area: 'stream C, cloud_setup'
  where: 'cloud_setup:117 (`tail -n 1`); cloud_sync_cleanup_duplicates.sh keeps the first'
  acceptance: '`conf_get` takes the first assignment; a case with a duplicated key asserts both readers agree'
  outcome: resolved
- id: PL-022
  severity: 'Medium'
  category: 'A check that cannot see a damaged stored member'
  source_finding: 'BS-3 (blindspots 8, 43; B)'
  owner_area: 'stream B, backuptool'
  where: 'backuptool''s ZIP verification (the `unzip -t` / `unzip -p` comment)'
  acceptance: 'each member is verified against its listed CRC-32 with a ZIP-compatible CRC-32 the image has (python3''s `zlib.crc32`; POSIX `cksum` is a different checksum -- amended, R-01), or a legacy ZIP with stored members is refused with its why; healthy and damaged, stored and deflated members as cases, run with the image''s busybox'
  outcome: open
- id: PL-023
  severity: 'Medium'
  category: 'A harness that says PASSED over unrun checks'
  source_finding: 'BS-4 (blindspot 39; D, C)'
  owner_area: 'the integrator, tools/last-good-scripts-test'
  where: 'tools/last-good-scripts-test:10224'
  acceptance: 'the summary reads `PASSED, N SKIPPED` and exits 3 when N > 0 and FAIL = 0 (vm-qa''s run_suite reads 3 as SKIP); a run with a tarball hidden shows it'
  outcome: resolved
- id: PL-024
  severity: 'Medium'
  category: 'A wait a stale line satisfies'
  source_finding: 'BS-5 (blindspots 50, 55; F1)'
  owner_area: 'stream F1, tools/vm-upgrade-rehearsal'
  where: 'tools/vm-upgrade-rehearsal:129-132; autostart appends to /var/log/boot.log; /var/log persists'
  acceptance: 'the wait reads the current boot (journalctl -b, or a line stamped with the boot id); a case with a stale line planted asserts the wait waits'
  outcome: resolved
- id: PL-028
  severity: 'Medium'
  category: 'Restore/rollback write-set mismatch (a member the snapshot never covers)'
  source_finding: 'G2-B-05 (gpt, B); the blind pass''s S-06'
  owner_area: 'stream B, backuptool'
  where: 'backuptool `archive_members` (the `^storage/` filter, line 5''s awk and the tar case at 479-480); the extraction `tar -xzf ... -C / -X "${SKIP}"` (1356) and the unzip equivalent'
  acceptance: 'an archive whose member list holds a path not under `storage/` is refused before anything is extracted, with its why; a case with such an archive (tar and zip) asserts nothing outside `storage/` is written and the refusal is printed'
  outcome: open
- id: PL-029
  severity: 'Medium'
  category: 'Verification gap (S-30)'
  source_finding: 'the blind pass''s S-30; § 3.5-3.6'
  owner_area: 'the integrator, the next cut'
  where: '`tools/vm-upgrade-rehearsal` (not run on `1b0d233657`), the layout migration proved in harness cases and not on a guest, the E1/E2 follow-up proofs, the proofs runner''s 3 NOT RUN, the Wi-Fi stand-in without an adapter'
  acceptance: 'on the next cut: `tools/vm-upgrade-rehearsal` from the previous device build passes and its stamp is in the QA log; the migration runs on a guest against the QA cloud with its before/after listings filed; the E1/E2 follow-ups'' proofs run under `proofs-307/`; the runner''s NOT RUN count is 0 or each is named with what only a device can show (`vm-first.md`); the Wi-Fi item names the physical fact'
  outcome: open
- id: PL-013
  severity: 'Medium (High until the refutation pass re-graded it: a guide a person runs, not a shipped disclosure path)'
  category: 'A rule that leaks what it says it masks'
  source_finding: 'G2-I-10 (gpt, I)'
  owner_area: 'the integrator, engineering-practices.md'
  where: '.claude/rules/engineering-practices.md:555'
  acceptance: 'the example closes its group at the delimiter (`((token|key|passw[a-z]*|psk|user)[=:])[^ ]*` -> `\1***`) and says a masking pattern is proven on a fake `key=SECRET` line first; `tools/rules-check` clean'
  outcome: resolved
- id: PL-030
  severity: 'Medium (verification-first)'
  category: 'Concurrency (a queued operation outside the guard)'
  source_finding: 'G2-E-app-01 (claude, E-app); the blind pass''s S-21; gated by the refutation pass'
  owner_area: 'stream E2, SaveStateBookkeeper'
  where: 'es-app/src/SaveStateBookkeeper.cpp `runCopy` (after the delete''s lock logic at 64-156)'
  acceptance: 'the whole COPY operation is protected by the same guard as DELETE, with an app-unit case that fails first; or a source-backed refutation names the line that already serialises it'
  outcome: withdrawn
- id: PL-031
  severity: 'Medium (verification-first)'
  category: 'Fail-open measurement (a substituted number)'
  source_finding: 'G2-D-02 (gpt, D); the blind pass''s S-24; gated by the refutation pass'
  owner_area: 'stream D, raofflineproxy-ctl'
  where: 'raofflineproxy-ctl ~1917 and ~2220 (`ADDED`/`MADE` inside `&&` chains)'
  acceptance: 'with the comparison forced to fail after nonzero cache operations, the published count is refused or reported unknown, never substituted; a harness case (section t) or a source-backed refutation naming the line'
  outcome: resolved
- id: PL-032
  severity: 'Medium (verification-first)'
  category: 'Lifecycle (a terminal state reopened)'
  source_finding: 'G2-C-03 (gpt, C) with G2-C-02 (gpt); the blind pass''s S-25; gated by the refutation pass (Medium there, Low in the triage)'
  owner_area: 'stream C, cloud_oauth'
  where: 'cloud_oauth ~506 `write_owned(self.attempt, status="signed-in")`; the `failed -> waiting` transition within one attempt'
  acceptance: 'terminal-state ordering is gated together with its callback and marker side effects, including a close without a successor attempt, with a case that fails first; or a source-backed refutation naming the line'
  outcome: resolved
- id: PL-033
  severity: 'Medium (conditional, verification-first)'
  category: 'Wrong predicate (a reachable service read as absent)'
  source_finding: 'G2-D-01 (claude, D); O-15; the blind pass''s S-26; gated by the refutation pass'
  owner_area: 'stream D, raofflineproxy'
  where: 'the listener gate''s `::` case (O-15)'
  acceptance: 'the line where the shipped proxy is bound IPv4-only is named and the item closes on it; or the predicate reads a dual-stack listener as reachable, with a case'
  outcome: withdrawn
- id: PL-034
  severity: 'Medium (verification-first)'
  category: 'Safety evidence (age is not termination)'
  source_finding: 'O-6; §3.5 (capture gate x capture lock); the blind pass''s S-27; gated by the refutation pass'
  owner_area: 'stream A, cloud_capture (and the gate in E2''s FileData, read only)'
  where: 'the capture gate''s 120 s age escape (D-UI-115''s policy stands); `cloud_capture`''s lock'
  acceptance: 'a harness case with a capture blocked on the lock, the launch released, and what the capture does when it gets the lock -- safe overlap or cancellation shown; or the precise accepted risk recorded with the line (the 120 s policy is not reopened)'
  outcome: open
- id: PL-025
  severity: 'Low'
  category: 'Runner divergence'
  source_finding: 'G2-I-04 (claude, I)'
  owner_area: 'the integrator, tools/vm-qa'
  where: 'tools/vm-qa (the python exec wrapper)'
  acceptance: 'the wrapper resets SIGPIPE beside SIGINT; a check in the harness prints both dispositions'
  outcome: resolved
- id: PL-026
  severity: 'Low'
  category: 'A false refusal'
  source_finding: 'G2-I-02 (claude) / G2-I-03 (gpt, I)'
  owner_area: 'the integrator, .githooks/pre-commit'
  where: '.githooks/pre-commit (the awk label)'
  acceptance: 'the grep is anchored past the label as pre-push''s is; the hooks'' test adds a file named like a key'
  outcome: resolved
- id: PL-027
  severity: 'Low'
  category: 'The rule behind the round'
  source_finding: 'G2-A-04 (claude, A)'
  owner_area: 'the integrator, es-player-text.md'
  where: '.claude/rules/es-player-text.md (the why list)'
  acceptance: 'the two sentences in the list, with their scripts; rules-check clean'
  outcome: resolved
```
