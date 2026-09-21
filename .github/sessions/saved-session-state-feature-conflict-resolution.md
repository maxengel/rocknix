# Saved Session State

> **Saved**: 2026-09-21T16:45:19Z
> **Branch**: feature/conflict-resolution (this worktree holds only the session state; the work is on `next` in the primary checkout `/workspace/repos/rocknix`, head `8c975c962f`)
> **Repo**: maxengel/rocknix (fork of ROCKNIX/distribution)

## Current Focus

**The RC round (#236, page https://claude.ai/artifact/Uq74wpvRB3SzpZ1oydYEmo) has a second candidate, `d55169e59e`, built for H700 and recorded under `/workspace/artifacts/rocknix-images/h700-all-20260921-d55169e59e/`.** The delta from `77e7e97515` is the EmulationStation pin (`fb6947fb4` -> `d842bbe16`) for #153's transfer-page words, proven on guest d in EN and FR; #153 is closed. `tools/vm-qa` run 2 is running over the x64 twin (`/workspace/tmp/rocknix-session/vmqa-run2.{sh,log,rc}`, a background waiter watches the rc). The RG35XX SP took the second candidate at 17:25 UTC (maintainer's yes; boot id 79a7e5fc -> 8c343c14; BUILD_ID d55169e59e, build/devices). vm-qa run 2 PASSED (eleven suites, row in docs/vm-qa-log.md); #150's H700 row ticked.

## Completed since the last stash (2026-09-21 afternoon)

- B on the VM: #82, #65, #67, #64, #66 proven on the RC and ticked; #153 framed, defect found, fixed in ES (`7afce37a6`, `d842bbe16`), re-proven, closed. `tools/retroarch-wrapper-test` PASS recorded on #211.
- Builds: GENERIC_X64 runs 11 (ok), 12 (died on an unbraced loop -- blindspot 49), 13 (ok); H700 run 4 (ok). Guest d took each x64 image as an in-place update.
- New tool `tools/es-syntax-check` (ninja's own compile command, -fsyntax-only), registered in guard/list/index and `es-native-ui.md`; memory `es-syntax-check-before-pin-bump`.
- Records: #240 (Kitesurf/reset, D-QA-035), #239 corrected (/emukill no-op), #236 comments, page v6, work log entries, qa-frames README.

## Next Steps

1. Done: vm-qa run 2 PASSED, row added, #150 row 12 ticked (deviation noted: make docker-H700 via the session script).
2. The maintainer ticks `a-build-2` (SYSTEM SETTINGS shows d55169e) and works the A boxes still open on the page.
3. a-211 waits on the RetroAchievements reset (game 15738, QA account; the API is the check). #240's gameplay routes are the longer path.
4. After A: the RG SP question (D-QA-031), then SM8550 for the Nova (#150 rows 13-17).
5. Cleanup done: guest d pad and bucket paths removed, S3 unthrottled; ES worktree `transfer-cut-outcome` can be removed (merged).

## Notes for Next Session

- The transfer page packs a fresh archive before sending; for a cut-upload fixture the pad must stay in place during the UI run (LINK5's remove-the-pad trick is for the script path).
- The chooser page remembers its toggles across reboots and updates; A on a switch row toggles. Read a frame first.
- `GET /emukill` does nothing on this image; quit through `execute_kill` (#239).
- An ES `.cpp` edit runs `tools/es-syntax-check` before commit/merge/bump.
- The RG35XX SP alias is `rg35xxsp` (192.168.1.81) in `~/.ssh/config`; `rgsp` is 192.168.1.175 (the RG SP -- receives nothing until A is done, D-QA-031).
