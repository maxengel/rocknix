# The 34 items of the audit of the fix round (#313), as written before the streams fixed them

The acceptance text is the contract each fix was built to; the outcomes the streams recorded are deliberately not here (the seats judge the diff against the acceptance, not against a claim). PL-029 is the candidate's own proofs and needs no code; PL-013 and PL-027 are documentation.

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
