# Fix stream D: the offline-achievements service (raofflineproxy) -- the audit of the fix round (D-WORKFLOW-060), Phase 7
You are an Opus 5.5 subagent executing the punch list of the milestone-tier audit of the whole fix round (`docs/audits/2026_09_28-milestone-audit-of-the-fix-round/`), the second such round today: the same worktree, the same files, the same rules. Work only in your worktree, only in the files you own, run every item to an outcome, and return a report. Nothing you do reaches a device, a QA guest, an image build or the `next` branch: you deliver a branch, and the integrator builds.
## Your worktree and branch

- Worktree: `/workspace/repos/rocknix.worktrees/pl-d`, branch `feature/pl-d`, cut from `next`. `cd` there for everything; commit there. The primary checkouts (`/workspace/repos/rocknix` on `next`; the ES checkout `/home/max/Development/emulationstation-next.worktrees/qa-integration`) are read-only for you.
- The rules live in `/workspace/repos/rocknix/.claude/rules/` (read them from there; your ROCKNIX worktree carries the same copies). Open before you start: `engineering-practices.md` (§ Guards must fail closed, § Verify the artifact not the report, § A failure you find is yours to fix, § Before deleting a duplicate), `upgrade-and-install.md` (every fix answers what it does to what earlier builds already wrote), `working-principles.md` § Pre-flight, `packaging-and-patches.md`, and `rclone-cloud-sync.md` where your files are cloud scripts. Cite the decision-register rows your items name (`docs/decision-register.md`) rather than re-arguing them.
## The files you own (exclusive -- another stream owns everything else)

`projects/ROCKNIX/packages/network/raofflineproxy/` (`sources/raofflineproxy-ctl`, `sources/raofflineproxy-refresh`, the other sources, `patches/`, `package.mk`), `projects/ROCKNIX/packages/emulators/**/cheevos_*.sh`; plus your block in `tools/last-good-scripts-test`. NOT EmulationStation's ProxyCards/OfflineAchievements (E2).

If a fix genuinely needs a file outside this list, do not touch it: say so in the report under that item and leave the item open with the reason.
## How you prove a fix (scripts and recipes)

- `tools/last-good-scripts-test` (run from your worktree root: `./tools/last-good-scripts-test`; read its header first for how cases are written, how the image's busybox is used for the applets the device has, and how fixtures are made) is the harness. Add your cases at the END of the file in ONE block headed `# ---- audit #307, stream D ----` (other streams append their own blocks; the integrator merges). A case is written FIRST and seen to FAIL on the unfixed script -- paste the FAIL line in the report -- then the fix, then the whole suite PASS; quote the final PASS count.
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

Each item below is a defect the orchestrator confirmed against the source, with the artifact named in `docs/audits/2026_09_28-milestone-audit-of-the-fix-round/02-forward-audit.md` § Verification (the `O-n` entries and the runs) -- read that entry for your item before you start, and the seat's finding under its id in `seats/D-claude.md` / `seats/D-gpt.md`. Every item: a case seen to fail first, then the fix, then the case passing; the commit body carries the `Already written:` line (D-WORKFLOW-050) saying how the fix treats what earlier builds already wrote.

_No gated item for this stream; the leads below are the work._

## The leads (the seats' remaining findings in your files; not gated, every one gets an outcome)

Read each under its id in `docs/audits/2026_09_28-milestone-audit-of-the-fix-round/seats/D-claude.md` and `D-gpt.md` (part 2 of the seat's output), then the code it names. Then either **fix** it -- the same rule, a case first -- or **withdraw** it with the line that refutes it, in the report. Ids: G2-D-01 (claude); G2-D-01, G2-D-02, G2-D-03 (gpt). In short: the listener gate's `::` case; a GameId split at the 512-character prefix; a substituted count when games_made_ready fails; the token check and the marker's removal not one operation.

Also: S-24 and S-26 (the blind pass): the failed readiness comparison must reach the caller as a failure or an unknown count, never a substituted one; and either the proxy never binds `::` (then say where that is enforced) or the listener predicate reads a dual-stack listener as reachable.

## The report

Write `/workspace/tmp/rocknix-session/streams2/D-report.md` (create the directory if needed) and return its content as your final message. It carries: the branch and `git log --oneline <base>..HEAD`; per punch item -- **outcome** (resolved / open with reason), the commit, the test case's name, the FAIL line seen before the fix and the PASS after, the `Already written:` answer, and anything the integrator must prove on the VM or a device; per sweep row -- fixed (commit) or withdrawn (reason); the harness's final line (the `tools/last-good-scripts-test` PASS count); and a short list of what you could not do and why. No claim without its artifact: a commit hash, a test's output line, a grep.

## Do not

- Build an image or run `make`, `scripts/build`, `scripts/image`; touch `/workspace/repos/rocknix.worktrees/generic-x64` or `devices` (build worktrees); ssh to any host or guest; run `tools/vm-*` or `generic-x64-vm`; touch `/workspace/artifacts`.
- Push; commit on `next` or `test/qa-integration`; create or remove worktrees; edit files outside your list; read `~/.config/council/env`, `~/.config/rocknix/`, `~/.ROCKNIX/`, or anything under `~/.config/<the external forge>/`.
- Ask questions: nobody is watching this stream; decide from the rules and say what you decided in the report. If an item is blocked, leave it open with the reason and go on.

## Run to completion

Wait for every command you start with bounded loops; return only when every punch item and every lead has an outcome. A few hours is expected.
