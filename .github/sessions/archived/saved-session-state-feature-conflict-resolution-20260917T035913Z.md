# Saved Session State

> **Saved**: 2026-09-17T03:01:22Z
> **Branch**: feature/conflict-resolution (this worktree holds only the session state; the work is on `next` and in the ES repo)
> **Repo**: maxengel/rocknix -- primary checkout /workspace/repos/rocknix on `next` (6c0c13dc4e, pushed); ES ~/Development/emulationstation-next, build branch `test/qa-integration` at `e4b441d9e` (pushed); ES feature worktree `emulationstation-next.worktrees/manager-no-flash` (`feature/manager-no-flash`, `058c375ac`, merged); distribution feature worktree `/workspace/repos/rocknix.worktrees/build11-flash` (`feature/build11-flash`, merged into next)

## Current Focus

**#207 (the flash after a deletion) is fixed and proven on the VM; build 12 `794bdbb945` is waiting to build.** The maintainer reported it at ~02:30 UTC on RC-12 build 10 on the RG SP: *"a flash that briefly happens after the deletion is made ... as if it's redrawing that element."* Cause: `GuiSaveState::update()` refreshed and rebuilt the whole grid when the worker job landed (D-UI-073's "reloads its grid when the worker is done") -- one frame of an empty sheet. Fix (D-UI-074): the page records the files its tiles were built from and rebuilds only when the disk disagrees (ES `ee4786940`, build 11 `ea828b286a`); proven on guest d: DELETE and COPY each go from 3 frame changes to 1, and an immutable file's tile comes back with an INFO line. A second ES fix (`058c375ac`: the worker no longer logs "save state deleted" for a refused unlink) is pinned as build 12 `794bdbb945` on `next`. **Build 11's nine suites are running** (`vm-qa-ea828b286a.log`, started 02:50; round-trip/exit/time-to-play PASS so far); a background waiter (`until grep 'suites done'`) notifies. Build 12's x64 build must not start until they finish: it overwrites the image file they booted from.

## Completed This Session (2026-09-17 02:26 -> 2026-09-17T03:01:22Z)

- **#207 filed** (D-QA-012, sub-issue of #11), mechanism, direction, five acceptance boxes; boxes 2, 3, 4 ticked with numbers; two comments (reproduction; build 11 table).
- **#205 closed out on the device**: read-only `device-act` read of the RG SP's `/var/log/cloud_sync.log`: the maintainer's two build-10 deletions `(--retire --unlink, 1160 ms)` / `(970 ms)`; build 6's `--retire` alone 860-1020 ms x4. Boxes 1 and 5 ticked with their words; the log survived the reboot (not tmpfs-only). Comment posted.
- **Reproduction on build 10 guest d** with `flash-check.py` (83 ms/frame, idle 0 changes): DELETE 0.34 / 0.60 (no tiles) / 0.69 s; COPY 0.26 / 0.52 / 0.61 s.
- **Fix**: ES `ee4786940` (GuiSaveState mShown/filesOnDisk compare; INFO line on the exception path; comments in SaveStateRepository/Bookkeeper) -> merge `fa4ada9d3`; pin `ea828b286a`; x64 built 02:49, H700 02:53 (both ES binaries carry the string, BUILD_ID checked); artifacts archived `/workspace/artifacts/rocknix-images/{x64,h700}-all-20260917-ea828b286a/` (H700 tar sha `7bc199ca68928cc3…`, 1,304,268,800 bytes).
- **Guest d upgraded in place to build 11** (tar sha equal), `proof-11.sh`: A one change (0.44 s), B one change (0.34 s), no rebuild logged. `proof-11c.sh` (`chattr +i`): 3 changes, "4 shown, 5 on disk; rebuilt", file still present. The empty-directory fixture was wrong (`remove()` rmdirs it).
- **Worker line fix**: ES `058c375ac` -> merge `e4b441d9e`; pin `794bdbb945` on next (build 12; not built yet).
- **Records**: D-UI-074 (311 IDs, register-check clean); work log 02:58 and 02:59 entries; four frames `docs/qa-frames/2026-09-17/207-*`; unit tests 112 / 1224.

## In Progress

- **Build 11 suites** (guests a/b): waiter armed; on 'suites done' read the PASSED/FAILED lines.
  - **What remains**: if all pass, start `chain-794bdbb945.sh` (x64 -> suites + H700) detached (`setsid nohup ... &`); archive build 12's artifacts under `*-20260917-794bdbb945/`; upgrade guest d in place (scp the tar with `-P 10026` to `/storage/.update`, sha equal, reboot, wait); re-run `proof-11.sh` and `proof-11c.sh` (case C now also expects the worker's WARNING `save state deletion did not take` instead of `save state deleted`); QA rows for builds 11 and 12 in `docs/vm-qa-log.md`; #207 box 5 (CAP13 + unit tests on the build); then **the staging question** for the RG SP (templates `../stage-rgsp-run-0923b9ee9f.sh`, `../rgsp-after-reboot.sh`; artifact dir carries the build id).
- **The maintainer's round on the device** continues in parallel: #200 section A, #201 box 5, anything else they report -> issue quoting them, fix, build.

## Next Steps

1. On 'suites done': read the result; if PASSED, start `/workspace/tmp/rocknix-session/manager-no-flash/chain-794bdbb945.sh` detached; wait for BUILD OK (x64 ~3 min, H700 ~4 min, suites ~25 min).
2. Guest d to build 12 and both proofs; post on #207; tick box 5 once CAP13/unit tests are cited from the build; QA rows.
3. #206 box 3 (the copy's gate with a sync in flight) on guest d -- **only when no suite is running** (one writer per QA folder): rclone.conf via `tools/cloud-test-backend rclone-conf`, `SAVES_REMOTE=/GAMES-d`, `--bwlimit 8k`, BACK UP SAVES from GAME SETTINGS, X in the manager -> the refusal.
4. Ask the maintainer whether to stage build 12 on the RG SP (transfer is D-QA-011's question; the reboot is a second question), naming the tar sha.
5. Closures owed on confirmation (unchanged): #182, #175, #183, #181, #178, #177, #174, #169, #160, #121, #113, #102, #50; rocknix.org pages (#191/#201, #196, #203) before any upstream PR.

## Key Files Modified (this session)

| File | Change | Notes |
| --- | --- | --- |
| ES `es-app/src/guis/GuiSaveState.{h,cpp}` | Modified | `mShown`, `filesOnDisk()`, compare-before-rebuild in `update()`, INFO line on the exception path |
| ES `es-app/src/SaveStateRepository.cpp`, `SaveStateBookkeeper.h` | Modified | comments: refresh only when the disk disagrees (#207) |
| ES `es-app/src/SaveStateBookkeeper.cpp` | Modified | the worker warns when the file is still present after the fallback |
| `projects/ROCKNIX/packages/ui/emulationstation/package.mk` | Modified | pin `fa4ada9d3…` (build 11) then `e4b441d9e…` (build 12) |
| `docs/decision-register.md` | Modified | D-UI-074 |
| `docs/work-logs/2026_09-work_logs/2026_09_17-work_log.md` | Modified | 02:58, 02:59 entries |
| `docs/qa-frames/2026-09-17/207-*.png` | Created | empty sheet (build 10); tile gone, tile added, immutable tile back (build 11) |

## Related Context

- **Tracker**: #207 (this), #205 (closed out on the device, still open pending the refusal box), #206 (box 3 open), #200/#201 (the round), #11 epic.
- **Device record**: `/workspace/artifacts/rocknix-device-actions.log` -- 02:36 read-only retire read (boot `bae3b500`). No device change this session.
- **Session scripts** (`/workspace/tmp/rocknix-session/manager-no-flash/`): `flash-check.py <key|none> <label> [s]` (frame-change capture on guest d), `proof-11.sh`, `proof-11c.sh`, `chk.sh` (syntax check for the manager-no-flash ES worktree), `build-x64-*.sh` / `suites-*.sh` / `chain-*.sh` for `ea828b286a` and `794bdbb945`, logs alongside; `frames/` (build 10), `frames-11/`. `../delete-async/unit-tests.sh <ES worktree>`, `../delete-async/press-time.py`, `../rc11/lib.sh` as before. A scratch copy of `tools/device-act` sits in the session scratchpad (this worktree lacks `tools/` additions; use `git -C /workspace/repos/rocknix show next:tools/device-act`).

## Notes for Next Session

- **Guest d** (`:10026`) is on **build 11**, on Bobl's manager page (or wherever the last proof left it: B closes; the carousel after a restart). Fixture: Bobl `state1..4` + auto, `state4` has no thumbnail and three scratch `retired` rows; Probe auto/1/2. Cloud config untouched (no rclone.conf). Guests a/b run the build 11 suites.
- **Key map on guest d**: `x` = A (confirm/launch), `z` = B (back), `a` = Y (DELETE), `s` = X (COPY in the manager; RANDOM on the carousel -- do not press there), `shift` wakes the screensaver. Open the manager from the game list: `s`, `x`.
- **Fixture lesson**: to prove "the unlink was refused", make the file immutable (`chattr +i`, busybox has it); an empty directory is removed by the worker's `remove()`. Restore with `chattr -i`.
- **Build ordering**: never start an x64 build while `tools/vm-qa` runs -- same `target/…-20260917.img.gz` filename. `fork-worktree sync` only with no build in flight (done at 02:45 for build 11; **not yet for build 12** -- run it before the chain; docker ps first).
- **scp to a guest needs `-P 10026`** (a `-p` becomes a local filename and the sha check fails loudly).
- Device log times are local (UTC-4): the RG SP's `22:27:39` is 02:27:39 UTC; `last-capture` epochs settle it.
- Commits: `git -c user.name="Max Engel" -c user.email="max@awecelot.com"`, trailers `Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>` and `Claude-Session: https://claude.ai/code/session_01LkFLXE5GsT1apn8AwrxrGR`; register append-only (`tools/register-check` with ES_SRC); docs land on a feature branch then `git -C /workspace/repos/rocknix merge --ff-only` + push, never a `cd` into the primary; session state committed from this worktree.

## Open Questions

- The maintainer's confirmation of #207 box 1 on the device (no flash) once a build with the fix is on the RG SP -- which needs their yes to stage and their yes to reboot.
- The rest of their build-10 round (#200 section A, #201 box 5).
