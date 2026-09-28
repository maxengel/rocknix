# Forward Audit — the whole fix round for #307/#308, on the tree the candidate is cut from (D-WORKFLOW-060)

**Auditor:** Code Auditor skill (orchestrator: Claude Fable 5.1 in the session; the seats: `anthropic/claude-fable-5.1` at xhigh and `openai/gpt-6-astra` at max, both through the council Facilitator on OpenRouter, D-QA-048/049)
**Date:** 2026-09-28 (Phase 2 dispatched 13:58 UTC)
**Subject:** the distribution `417dcd8610..1b0d233657` and the EmulationStation fork `7eae8ed91..87b182fbe` -- the eight streams' first deliveries and follow-ups, and the integrator's own commits -- judged against #307's acceptance text per item, #308's rows, and the first audit's 165 findings with the streams' claimed answers
**Spec:** `01-research-notes.md` § 1.1; the rules by glob, read from `next`

---

## How this phase was run

Ten packets, each a whole-branch diff (D-WORKFLOW-058) with the stream's report, its first-audit findings with the stream's claimed answer, and its punch items with their acceptance text; the ES range split by path into core, application and tests; the integrator's commits as a packet of their own with no prior seat. The same packet to both seats, neither seeing the other; the first audit's per-item verdicts sequestered from the packets and from this document until § Cross-check (Phase 2.5). Each seat returns a verdict per punch item, a verdict per first-audit answer (the follow-up review nobody had made), findings `G2-<X>-NN`, sweep spot-checks, the seams between streams, and a coverage boundary. The orchestrator re-reads every Critical and High against the source on `next` before it is written into § Verification, and runs the mechanical checks that exist (`tools/pkgcheck`, the harness, the ES unit suites, vm-qa run 69's report) rather than reading their sources.

## Findings index (the seats' own severities; unverified until § Verification)

_(built from the twenty outputs once they are in)_

## Punch-item verdicts (the seats' per-item readings against the acceptance text)

_(one row per item: item, stream, claude, gpt, the orchestrator's verdict with its artifact)_

## The follow-up review (per first-audit finding: is the stream's answer sound as the diff shows it)

_(one row per finding: id, seat, the stream's claim, claude, gpt, the orchestrator)_

## Verification (Phase 4.5, running; a finding is written here the moment it is checked)

_The orchestrator's own reads of the highest-risk follow-up hunks, made before the seat outputs were opened (so they are independent of them); each names the artifact and what would have refuted it._

### O-1 (A, `91231adf43`) -- the migration's verification reads rclone's exit status and an exact count
**Read:** `cloud_migrate_layout`: `check_clean()` returns 1 unless `$1 -eq 0` and the output matches `(^|[^0-9])0 differences found`; both call sites (`relocate`, `resumable`) run `out=$(rclone check ...)` and call `check_clean $? "${out}"` on the very next line, so `$?` is rclone's status. "10 differences found" no longer matches. The harness case A31 constructs ten differences and asserts the pointer stays and RC is non-zero.
**Would refute it:** a statement between the assignment and the check (none), or a caller that still greps the output (none; `grep -n 'differences found'` finds only `check_clean`).
**Verdict:** **sound.** Test gap, Low: A31 fails both halves at once; no case isolates a non-zero status beside a clean-looking line (a listing error mid-check).

### O-2 (A, `79c2f15725`) -- the pointer is read back before the old folder is removed
**Read:** in `relocate`, `set_pointer` (line 33 of the function) returns non-zero unless `conf_value "$1"` reads back the value just written; a failure returns 2 before "Removing the old folder" (lines 37-38, the `rclone delete` and `rmdirs`); the caller treats rc 2 apart from "SOME FILES DIDN'T FINISH" and the why is `YOUR CLOUD SYNC SETTINGS COULDN'T BE SAVED` (in the card's table since ES `87b182fbe`).
**Would refute it:** a delete before the pointer write, or a read-back that reads the value from memory; neither.
**Verdict:** **sound on the read.** The harness's case for this path says plainly it cannot construct the failure as root (`G-A-02: run as root, a read-only folder does not stop the write ... not a pass`): a guard proven by reading, not by a fired case -- recorded, not hidden.

### O-3 (A, `d5f24b05aa`) -- `conf_valid` is a grammar
**Read:** `cloud_backup:1017`: `bash -n` and then an awk grammar -- `KEY=` then a double-quoted value in which only `$NAME`/`${NAME}` expansions, no backticks, no backslashes but a trailing continuation are allowed; the five path keys refuse `$`, backtick, backslash, control characters and multi-line values (`whole()`); a continuation line is parsed by the same `dq()`; anything after the closing quote but space or a comment is bad. The first 45 lines read; the bare and single-quoted branches are below the cut and are the seats' to read.
**Verdict:** **sound as far as read**; the seat outputs decide the rest.

### O-4 (B, `a7163034df`) -- the credential scan fails closed
**Read:** `backuptool`'s `credential_lines`: `find` into a list file, a failed walk returns 1; each `grep -c` keeps its status and a status above 1 or an empty count returns 1; the caller distinguishes a scan that could not run (return 3, the staging removed) from a scan that found a leak (return 5).
**Verdict:** **sound.**

### O-5 (B, `59f0fbf0bc`) -- the boot's revert reads the mount table
**Read:** `chksysconfig`: `/proc/mounts` read with awk on the mount-point field; unreadable table falls back to the folder test with a `say` line; `under_roms` answers "waits" only when the table says the roms folder is not mounted; the marker's created paths are judged too. Proven on the guest: the runner's `B-kill18-reboot` 7 PASS on `1b0d233657` where `4234be0b6b` deferred the revert for ever.
**Verdict:** **sound, and proven on the VM.**

### O-6 (E2, ES `f4c9549ba`) -- the capture gate refuses at its bound
**Read:** `FileData.cpp`: after the bounded wait, the launch continues only if the capture in flight is no longer the one waited on; else `sCaptureWaitedOn` is cleared, a warning is logged and a one-button `GuiMsgBox` with `YOUR LAST GAME'S SAVES ARE STILL BEING RECORDED. TRY AGAIN IN A MOMENT.` is shown, and the game is not started; a capture older than `CaptureHungSeconds` (120, steady clock from `sCaptureStartedMs`) is taken as hung and stops holding launches, with a log line. Proven on the guest (run 2, `E2-pl061` 11 PASS, the refusal on its frame).
**Verdict:** **sound, and proven on the VM.** The words are proposed (D-UI-115).

### O-7 (E2, ES `71a67ed1b`) -- the journey record is read whole and replaced or not at all
**Read:** `JourneyTiers.h`: the reader requires `saves=`, `content=`, `media=` each exactly once with a value of 0 or 1, else the record is unknown; `replaceRecord` removes the old record, refuses if it still exists, writes the new one, and reports `OldRecordStands` when the old one can be neither replaced nor removed -- the restore then does not start (`COULDN'T SAVE WHAT YOU TICKED, SO NOTHING WAS RESTORED.`, proposed).
**Verdict:** **sound.**

### O-8 (C, `db843bf27d`) -- the sign-in state is written under a file lock by its owner only
**Read:** `cloud_oauth`: `_state_locked()` takes an `flock(LOCK_EX)` on `session.lock` around every read-modify-write; each serve stamps an attempt id and `write_owned` refuses a write whose attempt is not the state's; `_fail_owned` checks the status set and the ownership under the lock; a superseded holder no longer writes failure over the new attempt.
**Verdict:** **sound on the read.**

### O-9 (D, `ebcbf19817`) -- the scan cursor is kept only after the run's jobs
**Read:** `raofflineproxy-ctl` and `cache-images`: the listing writes `scan-cursor.next` (`propose_cursor`); `commit_cursor` moves it into place after the jobs and reads it back against the proposed value, failing the run (exit 1, `SOMETHING_WENT_WRONG`) when it cannot; the exit trap removes `.next`, so a cancelled run leaves the old cursor. Proven on the guest (run 2, `D-pl059` PASS: the cursor kept only after the jobs, no `.next` left).
**Verdict:** **sound, and proven on the VM.**

### O-10 (B, `316bb02e5d`) -- the exclusions are one checked filter
**Read:** `backuptool`: one awk pass drops the own backups folder, the staging prefix, the cores and the evidence folders from the file list into `.kept`; the count of kept lines, the count of dropped ones and the `mv` into place are each checked in one `||` chain, and any failure logs, removes every list and returns 2 -- nothing written. Before, two unchecked passes and a count that only logged.
**Verdict:** **sound.**

### O-11 (B, `97db4608d4`) -- the last-good records beside a stripped file are held back
**Read:** `backuptool`: the key scan's file classes now include `*.backup`, `*.bak`, `*.cfg.*`, `*.conf.*`, `*.ini.*`; for every file the backup strips or holds back (`system.cfg`, `es_settings.cfg`, the RetroArch config, the token files, the device-only set) its `.backup`, `.bak`, `.tmp` and `.old` neighbours present in the list are added to the held-back list, with a count logged. D-CLOUD-147.
**Verdict:** **sound.** Already written: archives already made are not rewritten (the stream's line), which is the right answer -- the next backup omits them.

### O-12 (E1, ES `44705df2d`) -- a cut live file against a whole record
**Read:** `es-core` `AtomicFile`: a live file that is not complete, shorter than a whole `.backup`, a prefix of it, and no newer than the record (`st_mtime <= backup + 1`) is treated as cut of the record and the record loads; a save made onto such a base is written and not recorded as last known good (`baseWhole`); the recovered file's mode is the most private of the copies on disk. A live file cut *after* the record was made has a newer mtime and falls to the existing `liveCut` handling.
**Verdict:** **sound.** The unit suites carry it (es-file-tests 21/3346 on the merged tree, run by the orchestrator at 14:0x: es-unit-tests 1813/1813).

### O-13 (E1, ES `5e390e128`) -- the reap guard is tried without blocking
**Read:** `removeIfStill` takes the guard with `LOCK_NB` in a loop until the acquire's own deadline; when it cannot, it returns false and the acquire fails rather than removing the holder's lock -- nothing is removed without the guard.
**Verdict:** **sound; fails closed.**

### O-14 (D, `dfdc3a6891`) -- one rule for a ready game
**Read:** `raofflineproxy-ctl`'s comparison: a game is ready when the account's unlocks row exists and an achievement-set row names its `GameId` (parsed from the first 512 characters of the row, else from the whole body; a body that cannot be parsed contributes nothing). The stream reports the count going from 3 to the correct 2, and a `grep` that cannot read now fails the comparison rather than counting zero (below the read's cut; the seats' to confirm).
**Verdict:** **sound as far as read.**

### O-15 (D, `adf852a4b7`) -- only a listener PPSSPP can reach counts
**Read:** the `/proc/net/tcp{,6}` match accepts `127.0.0.1:8080`, `0.0.0.0:8080` and `::ffff:127.0.0.1:8080` and no longer `::` or `::1`; the harness case constructs each. **A question for the seats:** a service bound to `::` on a dual-stack kernel (`bindv6only=0`) does serve `127.0.0.1`, so dropping `::` is stricter than the fact; it is harmless only if the proxy never binds `::`, which the packet's `raofflineproxy` bind should show.
**Verdict:** **sound for the shipped bind; the `::` case is Low and open until a seat or the source answers.**

### O-16 (C, `8b5655a4dc`) -- a saves folder named like its own sibling is refused
**Read:** `cloud_setup`'s `syncpath_problem`: the typed path, case-folded, is refused when it equals `<parent>/Backups` or `<parent>/Content`, with the folder to use (`Try <parent>/Saves.`); the derived siblings are exactly those two names, so the collision set is complete. An already-aliased configuration is read as it stands (the accepted-risk ledger of the fix audit).
**Verdict:** **sound.**

### O-17 (F1, `16ae2219ca`) -- the take-backs remove exact names, once
**Read:** the two take-back scripts list the exact paths the retired quirks wrote and remove those; each runs until its files are gone, then writes a stamp under `/storage/.cache` and exits early on every later boot; the rescue and emergency masks are removed by name. The harness's F1 cases: an owner's own drop-in (`weston.service.d/10-generic-x64.conf` named after the pattern but the owner's) survives; the take-back boot's journal says so; a second boot changes nothing.
**Verdict:** **sound.** Already written: a downgrade to a build with the old quirks writes the files again and they then stay -- the stream's own line, and the honest one.

### O-18 (F2, `f53264dcb0`) -- 0018 decides Auto when the configuration loads
**Read:** the patch's answer is taken in `config_load_file` from the `--appendconfig` list right after RetroArch appends those files, the last file that sets `state_slot` winning as in the load, so the answer describes what RetroArch read, not what is at those paths by content-load time; a `-1` in the main config is not this launch's request and is scanned, reset or restored over as upstream does. The harness compiles the helper with RetroArch's own config parser over ten append lists (expects `0100001111`); the runner's `F2-autoslot` on `1b0d233657`: 9 PASS, the log's `Keeping the Auto slot` line and the `-1` not sticking.
**Verdict:** **sound, and proven on the VM.**

### O-19 (F2, `9f1d126d24`) -- a kept guest's Control1 splice is repaired
**Read:** `start_mupen64plus.sh` on GENERIC_X64 only, when the config holds the `[Retroid Pocket Gamepad]` header: an awk pass drops exactly the six pasted lines as a block, writes a temporary, and replaces the config only if the temporary is non-empty; the case F2-5b asserts that exactly those six lines leave a player's copy and that the player's own `plugin = 5` and `ScreenWidth = 1280` stay.
**Verdict:** **sound.**

### O-20 (seam: the proxy's outcome tokens x the interface's tables)
**Read:** `raofflineproxy-ctl` prints `SOME_IMAGES_NOT_SAVED`, `TOOK_TOO_LONG`, `LIBRARY_UNREADABLE`, `SOMETHING_WENT_WRONG` and `CANCELLED` as its why tokens; `CloudText.cpp` maps the first three (lines 988-1000) and `CANCELLED`; `SOMETHING_WENT_WRONG` has no row of its own, and needs none: the stamp's why is read back with its underscores as spaces (`CloudText.cpp:285-288`) and anything the table does not know reads as `SOMETHING WENT WRONG` (`:1008`, `:1124`), which is the same sentence.
**Verdict:** **the seam agrees.**

### O-21 (seam: the settings lock, the scripts x the interface)
**Read:** `profile.d/001-functions` (the scripts' side, B `f3622d3a2d`) and `es-core/src/utils/AtomicFileUtil.cpp` (the interface's side, E1 `5e390e128`) name the same lock (`/tmp/.system.cfg.lock`), the same contents (the holder's pid alone), the same birth (written to `<lock>.<pid>` and hard-linked), and the same reap guard (`<lock>.reap` under `flock`); the scripts' comment cites the interface's `PidLock` and the interface's cites the scripts. D-INFRA-012 (pid-only, bounded by `pid_max`) is written on both sides.
**Verdict:** **the seam agrees.**

_The seats' Highs, each re-read against the source on `next` (the distribution) or the ES branch at `87b182fbe`, with the command where one settles it._

### G2-A-01 (claude, A) -- a tier whose pointer names its destination under another spelling is copied onto itself and its files deleted
**Seat's claim:** the PL-026 guards compare the conf's raw string with the constant (`/ROCKNIX/Saves`); `SAVES_REMOTE="/ROCKNIX/Saves/"` is not equal, so the tier is treated as unmoved, copied onto itself, verified clean and its source files deleted -- the same folder.
**Checked:** `cloud_migrate_layout` lines 447, 455, 531, 537, 546, 548, 565, 577, 594: every compare is `[ "${saves}" != "${NEW_SAVES}" ]` on the raw value; the `${1%/}` normalisations at 109, 188, 499-505 are inside helpers, not before these compares; `relocate` has no `src == dst` refusal (its first twelve lines read). A trailing slash in the conf reaches the compare as written. Whether `rclone copy X X` exits 0 was not run here; the delete that follows runs `rclone delete "${src}" --files-from-raw` on the same folder regardless.
**Verdict:** **confirmed, High** -- a conf edited by hand or written by an older setup with a trailing slash loses every save on TIDY UP YOUR CLOUD FOLDERS. Fix: normalise the three pointers (strip trailing slashes, require a leading one) before every compare, and refuse `relocate` when `src` and `dst` name one folder after normalisation; a case with the trailing-slash conf.

### G2-A-01 (gpt, A) -- `conf_valid` accepts an executable "comment" after a carriage return
**Seat's claim:** `rest()` accepts `\r` as whitespace before `#`; bash does not, so `EXTRA="x"<CR>#$(cmd)` passes the validator and runs `cmd` when sourced.
**Checked:** `cloud_backup:1017` `conf_valid`: `function rest(s, i) { if (substr(s, i) !~ /^([ \t\r]+(#.*)?)?$/) bad() }` -- a CR is in the class; `whole()` inspects the parsed value only; `bash -n` accepts the line. The same grammar is in `cloud_restore` and `cloud_sync_helper`. A33's seven shapes do not include a CR.
**Verdict:** **confirmed, High** -- the non-executing contract (D-CLOUD-142) has a hole one byte wide. Fix: drop `\r` from `rest()`'s class (a CR anywhere in the file is bad), in all three copies; a case with the seat's line.

### G2-A-02 (gpt, A) -- a failed safety copy can overwrite the valid configuration
**Seat's claim:** the duplicate-cleanup fallback restores `.pre-cleanup.$$` on `-s` alone, so a `cp` that failed part-way (a full card) leaves a truncated prefix that then replaces the untouched valid file.
**Checked:** `cloud_backup` (the block at the first `pre_cleanup`): `if cp -f ... && cleanup && conf_valid; then ... elif [ -s "${pre_cleanup}" ] && mv -f "${pre_cleanup}" "${conf_file}"; then` -- the `elif` runs when `cp` itself failed; nothing records that the copy completed and nothing validates the copy before the move. `cloud_restore` carries the same block (5 references).
**Verdict:** **confirmed, High** -- the last-known-good rule (D-CLOUD-078) inverted by the fallback meant to keep it. Fix: a flag set only after `cp` succeeds, and `conf_valid "${pre_cleanup}"` before the move; a case that makes `cp` write a prefix and fail.

### G2-B-01 (gpt, B) -- reading the backup-folder setting executes `cloud_sync.conf`
**Seat's claim:** `backuptool` sources the configuration to read `SETTINGS_BACKUPS`, against the rule that the file is never sourced with a command in it.
**Checked:** `backuptool:42`: `_configured=$( unset SETTINGS_BACKUPS BACKUPFOLDER; . /storage/.config/cloud_sync.conf >/dev/null 2>&1; printf ...)` -- a subshell, but a source; the `case` after it validates the string only. The cloud scripts gate their own sourcing on `conf_valid` (O-3); `backuptool` has no such gate.
**Verdict:** **confirmed, High** -- the same file, one reader that still executes it. Fix: read the key with a non-executing reader (a `sed -n 's/^SETTINGS_BACKUPS="\([^"]*\)".*/\1/p' | head -1`, the first assignment as the cleanup keeps it), never `.`; a case with a command in the conf.

### G2-B-02 (gpt, B) -- the redaction fast path lets `--pass value` through
**Seat's claim:** the argument-mode detector recognises `pass` only before `=` or `:`; the flag form takes the fast path unredacted.
**Checked by running it:** `source profile.d/001-functions; redact_credentials 'launcher --pass qa-value'` prints `launcher --pass qa-value`; `'x --RA_Pass qa-value'` prints unchanged; `'pass=qa-value'` is masked.
**Verdict:** **confirmed, High** -- a credential given as a flag is logged. Fix: the fast-path trigger includes `--?[A-Za-z0-9_.-]*pass[[:space:]]`; the two lines as cases.

### G2-B-04 (gpt, B) -- a failed snapshot worklist reads as "nothing to protect"
**Seat's claim:** `snapshot_members`'s `KEEP=$(mktemp)` and its appends are unchecked; an empty worklist returns 4, which the caller reads as no members to protect, and the restore extracts without a snapshot.
**Checked:** `backuptool` `snapshot_members` lines 3, 17, 24-27: `KEEP=$(mktemp)` unchecked, `printf ... >> "${KEEP}"` unchecked, `[ ! -s "${KEEP}" ]` returns 4 whatever emptied it.
**Verdict:** **confirmed, High** -- the shape B fixed one stage earlier (G-B-01), at the next stage. Fix: `mktemp` and every append checked, a failure returning 2 (the restore refuses), 4 only for a genuinely empty selection; a case that makes `mktemp` fail.

### G2-B-05 (gpt, B) -- extraction applies members the snapshot never covers
**Seat's claim:** the snapshot lists `storage/*` regular files; extraction runs the whole archive minus a skip list, so a member outside `storage/` (a legacy or foreign archive's `tmp/...`) is written to `/` and never rolled back.
**Checked:** `archive_members` filters `^storage/` (line 5's awk and the tar case at 479-480); `tar -xzf ... -C / -X "${SKIP}"` (1356) and the unzip equivalent extract everything not skipped; nothing refuses an archive with a member outside `storage/`.
**Verdict:** **confirmed, Medium** (re-graded from High: it needs an archive this tool never writes -- a foreign or hand-made one -- and the rollback covers the settings it does list). Fix: refuse an archive whose member list holds a path not under `storage/` before anything is extracted; a case with such an archive.

### G2-B-06 (gpt, B) -- an archive can overwrite the recovery marker that protects its own extraction
**Seat's claim:** `RESTORE_MARK` is written and verified before extraction but not excluded from it; an archive carrying `storage/.config/.restore-in-progress` (a stale marker captured by an earlier broad backup) overwrites the fresh one.
**Checked:** `backuptool:1302` sets the marker; the skip list at 1355 holds the ppsspp assets and the token files, not the marker; `grep -n RESTORE_MARK | grep -i skip` finds nothing.
**Verdict:** **confirmed, High** -- the boot's revert then reads the archived marker. Fix: the marker (and the snapshot's own path) in every skip list, and the backup never lists them; a case with an archive carrying the marker.

### G2-B-07 (gpt, B) -- a quoted password beginning with whitespace passes the key scan
**Seat's claim:** the value suffix `"?[^"[:space:]]+` cannot consume a space after the opening quote.
**Checked by running it:** `printf 'password = " leading-text"\npassword = "plain"\n' | grep -ciE "$CREDENTIAL_KEYS"` prints 1 -- the leading-space line does not match.
**Verdict:** **confirmed, High** (a residual of the credential scan; an `.ini` a player added to their own list). Fix: `"?[[:space:]]*[^"[:space:]]+` after the quote; the line as a case.

### G2-C-04 (gpt, C) -- dot components bypass the tier-separation guard
**Seat's claim:** `/Mine/Backups/.` passes `syncpath_problem`; `dirname` makes the siblings `/Mine/Backups/Backups` and `/Mine/Backups/Content`, inside the saves folder.
**Checked by running it:** `syncpath_problem '/Mine/Backups/.'` returns 0 (accepted) on `next`'s `cloud_setup`; the function rejects `"`, `$`, backtick, backslash and control characters, and the two sibling names, and nothing else.
**Verdict:** **confirmed, High** -- the collision C closed (G-C-01) reopened by a path alias. Fix: reject any `.` or `..` component and any empty component, then the sibling check; a case with the seat's path.

### G2-E-core-01 (gpt, E-core) -- an escaped inner quote ends the masked range
**Seat's claim:** in `maskValueEnd`'s enclosing-quote branch the inner-quote test runs before the backslash escape, so `sh -c 'tool --password "front\" back"'` leaves `back` unmasked.
**Checked:** `es-core/src/utils/StringUtil.cpp` `maskValueEnd`: the `inner != 0` branch (lines +31..+34 of the function: `if (c == inner) inner = 0`) precedes the single-quote backslash branch (+38..+40); the double-quote escape at +22..+25 applies only when the enclosing quote is `"`. Under a `'`-enclosing command an inner `\"` closes the inner quote.
**Verdict:** **confirmed, High** -- a residual of E1's masking fix (`b036967fc`). Fix: inside an inner quote, a backslash skips the next character in both enclosing modes; a doctest with the seat's line.

### G2-E-tests-01 (gpt, E-tests) and G2-I-02 (gpt, I) -- the hooks' scan fails open when its pipeline fails
**Seat's claim:** `hits="$(git diff ... | awk | grep -E | sed | head -5 || true)"`; an invalid pattern, or a missing tool, yields an empty `hits` and the hook exits 0.
**Checked by running it:** a copy of `.githooks/pre-commit` in a scratch repository with a staged `<credential-shaped example redacted>` line: with `SECRET_PATTERNS='devpassword=[A-Za-z0-9._%-]{4,}'` it refuses (rc 1); with `SECRET_PATTERNS='['` grep and sed print errors and the hook exits **0**.
**Verdict:** **confirmed, High** -- the guard blindspot 67 added fails open on its own error. Fix: validate the pattern once (`printf '' | grep -E -e "$SECRET_PATTERNS"; [ $? -le 1 ]`) and read each stage's status from `PIPESTATUS`, refusing on any status above grep's 1; the constructed failure as the hook's own test.

### G2-I-01 (claude and gpt, I) -- the audit-packet path exemption removes the scan from a pushed path
**Seat's claim:** both hooks skip `docs/audits/*/seats/*.diff` by name on a comment's justification ("a verbatim copy of a range the guards have already read"), which nothing checks; a packet built from unpushed worktree branches, or a line appended to one, is never scanned.
**Checked:** `.githooks/pre-commit` (`grep -v -E '^docs/audits/[^/:]+/seats/[^/:]+\.diff: '`) and `.githooks/pre-push` (`case "$f" in docs/audits/*/seats/*.diff) continue`) as the seat says; this very audit's packets were built from branches that were merged, but the exemption cannot tell that.
**Verdict:** **confirmed, High** -- a guard weakened by its own author. Fix: remove the exemption from both hooks; stop committing the packet `.diff` copies (a `.gitignore` line for `docs/audits/*/seats/*.diff`; the manifests' sha256 and the branch ranges are the record, and a packet is regenerated from them); the ES fork's hooks the same.

### G2-I-10 (gpt, I) -- the rule's log-redaction example preserves the secret
**Seat's claim:** `engineering-practices.md`'s example `sed -E 's/((token|key|passw[a-z]*|psk|user)[=:][^ ]*)/\1***/Ig'` puts the value inside group 1 and prints it back with stars.
**Checked:** the line is in the rule; the proof runner found the same on 2026-09-28 (its `common.sh` carries the corrected form); the session's memory was corrected this morning, the rule was not.
**Verdict:** **confirmed, High** (the seat's grade; a transcript that follows the rule leaks the value). Fix: `s/((token|key|passw[a-z]*|psk|user)[=:])[^ ]*/\1***/Ig` in the rule, with the note that a masking pattern is proven on a fake `key=SECRET` line first.

_The blindspot screen's repeats (an agent's pre-screen of the 67 entries against the round's diffs, `/workspace/tmp/rocknix-session/blindspot-screen-fix-round.md`: 15 repeated, 32 avoided, 21 not relevant), the ones that survived the orchestrator's read:_

### BS-1 (blindspots 10, 35, 62; C) -- passwords already written to a persistent log stay on the card
**Screen's claim:** C stopped `cloud_remote` logging rclone's failure output with `pass=<password>` in it, but did nothing about lines already in `cloud_sync.log`; `/var/log` is persistent (D-SYS-001), so a device that ever had a failed `config create` keeps a plaintext cloud password.
**Checked:** `packages/sysutils/busybox/system.d/var-log.mount` binds `/var/log` to `/storage/.cache/log` (D-SYS-001, on by default); C's diff replaces `log("rclone %s failed (%d): %s" % (...))` with a line without the output; no scrub of the existing log anywhere (`grep -n 'scrub\|pass=' cloud_sync_helper` finds nothing).
**Verdict:** **confirmed, High** -- the Already-written answer is missing for a credential at rest. Fix: on the first run of the new scripts, rewrite `/var/log/cloud_sync.log` (and its rotations) with the password shapes masked, once, recorded by a stamp; a case over a planted line.

### BS-2 (blindspots 12, 46; C x A) -- two readers of one file disagree on a duplicated key
**Screen's claim:** C's `conf_get` takes the last assignment; the automatic sync's duplicate cleanup keeps the first, so after a cleanup the scripts use the first while the hub's line named the last.
**Checked:** `cloud_setup:117` `value="$(grep "^$1=" ... | tail -n 1)"`; `cloud_sync_cleanup_duplicates.sh`'s header: "keeping only the first occurrence".
**Verdict:** **confirmed, Medium** -- a seam the two streams did not know they shared. Fix: `conf_get` takes the first (`head -n 1`), matching what the file becomes; a case with a duplicated key.

### BS-3 (blindspot 8, 43; B) -- the ZIP check passes a damaged stored member
**Screen's claim:** B's comment says busybox has no `-t` and that `unzip -p` verifies every member's CRC; both false on busybox 1.36.1.
**Checked by running it:** the image's own busybox (`build.ROCKNIX-GENERIC_X64.x86_64/image/system/usr/bin/busybox`, 1.36.1) on a ZIP with a damaged *stored* member: `unzip -t` rc 0, `unzip -p` rc 0; on a damaged *deflated* member: rc 1 and 1; the host's Info-ZIP reports both (rc 2 and 9).
**Verdict:** **confirmed, Medium** -- a legacy ZIP with a damaged stored member passes the pre-restore check and fails mid-extraction (the snapshot then covers the rollback, which is why not High). Fix: verify each member against the listed CRC (`unzip -lv`'s column, `cksum`), or refuse stored members in a legacy ZIP; the measurement above as the case.

### BS-4 (blindspot 39; D, C) -- skipped checks count as PASSED
**Screen's claim:** D adds 23 SKIP branches (a pinned tarball absent) and C one; the harness's verdict counts only FAILs.
**Checked:** `tools/last-good-scripts-test:10224`: `if [ "${FAIL}" -eq 0 ]; then echo "PASSED"`; a SKIP is printed and not counted; vm-qa run 69's scripts.log on the build host holds 0 SKIP lines (the pinned tarballs are there), so the hazard is a host without them, where the same run would read PASSED over 23 unrun checks.
**Verdict:** **confirmed, Medium** -- a harness that says PASSED over unrun checks. Fix: the summary says `PASSED, N SKIPPED` and exits 3 when N > 0 and FAIL = 0, which vm-qa's `run_suite` already reads as SKIP; the block headers name what a skip needs.

### BS-5 (blindspots 50, 55; F1) -- the rehearsal's wait reads the previous boot's line
**Screen's claim:** `tools/vm-upgrade-rehearsal` waits for "Autostart complete" in `/var/log/boot.log`, which is appended and persistent, so the previous boot's line satisfies the wait at once and the "autostart finished" check cannot fail.
**Checked:** `tools/vm-upgrade-rehearsal:129-132`; `packages/sysutils/autostart/sources/autostart:7,10` appends (`>>`) to `/var/log/boot.log` and never truncates it; `/var/log` is persistent (BS-1).
**Verdict:** **confirmed, Medium** -- the rehearsal's own guard is an assertion that cannot fail (the rule in `engineering-practices.md`). Fix: wait on `journalctl -b` for the autostart unit's completion, or on a line stamped with this boot's id; a case with a stale line planted.
