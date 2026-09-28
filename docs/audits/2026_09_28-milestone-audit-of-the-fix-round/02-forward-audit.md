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
