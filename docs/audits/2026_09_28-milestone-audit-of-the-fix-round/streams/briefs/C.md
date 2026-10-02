# Fix stream C: the cloud sign-in broker and setup -- the audit of the fix round (D-WORKFLOW-060), Phase 7
You are an Opus 5.5 subagent executing the punch list of the milestone-tier audit of the whole fix round (`docs/audits/2026_09_28-milestone-audit-of-the-fix-round/`), the second such round today: the same worktree, the same files, the same rules. Work only in your worktree, only in the files you own, run every item to an outcome, and return a report. Nothing you do reaches a device, a QA guest, an image build or the `next` branch: you deliver a branch, and the integrator builds.
## Your worktree and branch

- Worktree: `/workspace/repos/rocknix.worktrees/pl-c`, branch `feature/pl-c`, cut from `next`. `cd` there for everything; commit there. The primary checkouts (`/workspace/repos/rocknix` on `next`; the ES checkout `/home/max/Development/emulationstation-next.worktrees/qa-integration`) are read-only for you.
- The rules live in `/workspace/repos/rocknix/.claude/rules/` (read them from there; your ROCKNIX worktree carries the same copies). Open before you start: `engineering-practices.md` (§ Guards must fail closed, § Verify the artifact not the report, § A failure you find is yours to fix, § Before deleting a duplicate), `upgrade-and-install.md` (every fix answers what it does to what earlier builds already wrote), `working-principles.md` § Pre-flight, `packaging-and-patches.md`, and `rclone-cloud-sync.md` where your files are cloud scripts. Cite the decision-register rows your items name (`docs/decision-register.md`) rather than re-arguing them.
## The files you own (exclusive -- another stream owns everything else)

`projects/ROCKNIX/packages/network/rclone/sources/cloud_oauth`, `cloud_setup`, `cloud_remote`, `cloud_device_id`; `projects/ROCKNIX/packages/web/` (webkitgtk, the sign-in window `cloud-signin-window.c` and its recipe, libsoup/libpsl recipes named by your rows); plus your block in `tools/last-good-scripts-test` and the ES repo's `tests/cloud-oauth-lifetime.py` is NOT yours (E2). NOT the other cloud scripts (A).

If a fix genuinely needs a file outside this list, do not touch it: say so in the report under that item and leave the item open with the reason.
## How you prove a fix (scripts and recipes)

- `tools/last-good-scripts-test` (run from your worktree root: `./tools/last-good-scripts-test`; read its header first for how cases are written, how the image's busybox is used for the applets the device has, and how fixtures are made) is the harness. Add your cases at the END of the file in ONE block headed `# ---- audit #307, stream C ----` (other streams append their own blocks; the integrator merges). A case is written FIRST and seen to FAIL on the unfixed script -- paste the FAIL line in the report -- then the fix, then the whole suite PASS; quote the final PASS count.
- A recipe (`package.mk`) edit is followed by `tools/pkgcheck <package>`; quote its output. Late binding: toolchain and path variables only inside functions.
- A script that will run under busybox is tested through the image's busybox as the harness does; every external command you add is one the device has (`command -v` in the guest's busybox list in `generic-x64-vm-testing.md` § What the guest's busybox lacks, or a package dependency).
- Every word a player reads (a `>>> why` line, a console line) follows `es-player-text.md` § Outcome vocabulary: `COMPLETED`, `COULDN'T FINISH - <why>`, `SKIPPED - <reason>`, everyday register, no exit codes or paths on a screen.
## Commits

One commit per punch item (a sweep group may share one). Title `<package or script>: <text>` under 72 characters, no spaces before the colon; a blank line; a body that names the item (`audit of the fix round PL-NNN`, or the lead's id `G2-X-NN`) and the finding, says what the test case is, and carries the `Already written:` line -- how the fix treats what earlier builds already wrote on a device (D-WORKFLOW-050; "nothing is written" is an acceptable answer when true). End every commit message with:

```
Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
```

Never `--no-verify`, never a bare `git stash`, never edit a shell script while a run of it is in flight (the harness reads scripts by offset).

## The punch items (the contract)

Each item below is a defect the orchestrator confirmed against the source, with the artifact named in `docs/audits/2026_09_28-milestone-audit-of-the-fix-round/02-forward-audit.md` § Verification (the `O-n` entries and the runs) -- read that entry for your item before you start, and the seat's finding under its id in `seats/C-claude.md` / `seats/C-gpt.md`. Every item: a case seen to fail first, then the fix, then the case passing; the commit body carries the `Already written:` line (D-WORKFLOW-050) saying how the fix treats what earlier builds already wrote.

## PL-009: a dot component walks past the saves-folder guard
- **Severity:** High
- **Category:** Tier separation bypassed
- **Source Finding:** G2-C-04 (gpt, C)
- **Owner area:** stream C, cloud_setup
- **Where:** cloud_setup syncpath_problem
- **What:** `/Mine/Backups/.` is accepted; dirname derives the siblings inside the saves folder.
- **Acceptance:** any `.` or `..` or empty component is refused before the sibling check; the seat's path as a case, refused with the folder to use

## PL-014: cloud passwords already written to the persistent cloud_sync.log stay on the card
- **Severity:** High
- **Category:** A credential at rest, unanswered by the fix
- **Source Finding:** BS-1 (blindspots 10, 35, 62; C)
- **Owner area:** stream C, the cloud scripts' startup
- **Where:** the rclone package (cloud_sync_helper's startup, or the package's autostart); /var/log is a bind of /storage/.cache/log (D-SYS-001)
- **What:** C stopped `cloud_remote` logging rclone's failure output with `pass=<password>` in it; the lines already written by earlier builds stay, and the log is trimmed only past 1 MiB.
- **Acceptance:** the first run of the new scripts rewrites cloud_sync.log and its rotations with the password shapes masked, once, recorded by a stamp under /storage/.cache; a case over a planted line; the Already-written line names it

## PL-021: conf_get takes the last assignment where the cleanup keeps the first
- **Severity:** Medium
- **Category:** Two readers of one file
- **Source Finding:** BS-2 (blindspots 12, 46; C x A)
- **Owner area:** stream C, cloud_setup
- **Where:** cloud_setup:117 (`tail -n 1`); cloud_sync_cleanup_duplicates.sh keeps the first
- **What:** with a key written twice, the hub's line and `--content-location` name a different folder from the one the scripts use after the cleanup.
- **Acceptance:** `conf_get` takes the first assignment; a case with a duplicated key asserts both readers agree

**PL-014's file grant:** the scrub may be a new script under `projects/ROCKNIX/packages/network/rclone/sources/` (installed by one line in that package's `package.mk`) and one call to it from the package's startup hook; `cloud_sync_helper` is stream A's -- if the call has to live there, leave the one-line call to the integrator and say so in the report, with the exact line.

## The leads (the seats' remaining findings in your files; not gated, every one gets an outcome)

Read each under its id in `docs/audits/2026_09_28-milestone-audit-of-the-fix-round/seats/C-claude.md` and `C-gpt.md` (part 2 of the seat's output), then the code it names. Then either **fix** it -- the same rule, a case first -- or **withdraw** it with the line that refutes it, in the report. Ids: G2-C-01 (claude); G2-C-01, G2-C-02, G2-C-03 (gpt). In short: keystrokes before a focused field dropped and not resent; the reader's value forms; a backward status transition; the success path and a close without a new attempt.

Also: S-25 (the blind pass) is G2-C-03's close-without-a-new-attempt case: a late same-attempt `signed-in` must not reopen a closed state.

## The report

Write `/workspace/tmp/rocknix-session/streams2/C-report.md` (create the directory if needed) and return its content as your final message. It carries: the branch and `git log --oneline <base>..HEAD`; per punch item -- **outcome** (resolved / open with reason), the commit, the test case's name, the FAIL line seen before the fix and the PASS after, the `Already written:` answer, and anything the integrator must prove on the VM or a device; per sweep row -- fixed (commit) or withdrawn (reason); the harness's final line (the `tools/last-good-scripts-test` PASS count); and a short list of what you could not do and why. No claim without its artifact: a commit hash, a test's output line, a grep.

## Do not

- Build an image or run `make`, `scripts/build`, `scripts/image`; touch `/workspace/repos/rocknix.worktrees/generic-x64` or `devices` (build worktrees); ssh to any host or guest; run `tools/vm-*` or `generic-x64-vm`; touch `/workspace/artifacts`.
- Push; commit on `next` or `test/qa-integration`; create or remove worktrees; edit files outside your list; read `~/.config/council/env`, `~/.config/rocknix/`, `~/.ROCKNIX/`, or anything under `~/.config/<the external forge>/`.
- Ask questions: nobody is watching this stream; decide from the rules and say what you decided in the report. If an item is blocked, leave it open with the reason and go on.

## Run to completion

Wait for every command you start with bounded loops; return only when every punch item and every lead has an outcome. A few hours is expected.
