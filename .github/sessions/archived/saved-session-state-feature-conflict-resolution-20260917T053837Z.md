# Saved Session State

> **Saved**: 2026-09-17T03:59:13Z
> **Branch**: feature/conflict-resolution (this worktree holds only the session state; the work is on `next` and in the ES repo)
> **Repo**: maxengel/rocknix -- primary checkout /workspace/repos/rocknix on `next` (d3ed872497, pushed); ES ~/Development/emulationstation-next, build branch `test/qa-integration` at `e4b441d9e` (pushed); ES feature worktree `emulationstation-next.worktrees/manager-no-flash` (`feature/manager-no-flash`, `058c375ac`, merged); distribution feature worktree `/workspace/repos/rocknix.worktrees/build11-flash` (`feature/build11-flash`, merged into next)

## Current Focus

**RC-12 build 12 `6c0c13dc4e` is complete on the VM side and waits for the maintainer's word to be staged on the RG SP.** It carries the #207 fix (the save state manager rebuilds its grid only when the disk disagrees with the page, D-UI-074 -- the flash after a deletion the maintainer reported on build 10) and the worker's truthful deletion line. Nine suites PASSED, CAP13/14 PASSED on guest b, guest d proofs PASSED (deletion and copy one frame change each; an immutable file's tile comes back with the INFO line and the worker's WARNING), and #206 box 3 (the copy's gate during a sync) proven on guest d. **Nothing has been sent to the RG SP this session.** The next act is the maintainer's: the transfer (D-QA-011) and then the reboot, each its own question.

## Completed This Session (2026-09-17 02:26 -> 2026-09-17T03:59:13Z)

- **#207 filed and fully proven on the VM** (boxes 2-5 ticked; box 1 is the device's). Mechanism, build-10 reproduction (3 frame changes incl. an empty sheet), fix ES `ee4786940` (build 11 `ea828b286a`), worker line ES `058c375ac` (build 12 `6c0c13dc4e`, pin commit `794bdbb945`). Register D-UI-074. Frames `docs/qa-frames/2026-09-17/207-*`.
- **#205 closed out on the device** (read-only): the RG SP's `--retire --unlink` 1160 / 970 ms; boxes 1 and 5 ticked with the maintainer's words.
- **#206 box 3 proven** (guest d, build 12): refusal dialog during a 1 MB backup at 1 KB/s; frame `206-manager-copy-refused-during-sync-*`. Every #206 box ticked.
- **Builds**: 11 (`ea828b286a`, superseded, never staged) and 12 (`6c0c13dc4e`) for x64 and H700, both archived under `/workspace/artifacts/rocknix-images/{x64,h700}-all-20260917-<id>/` with `SHA256SUMS.tar` and `BUILD_INFO.txt`. Build 12 H700 tar sha `9c04e61e723fb78bd9c7dfa2978499cc651d582514f05823a421f172a38f43e7`, 1,304,268,800 bytes.
- **Suites**: build 11 `qa-ea828b286a-webdav-a-20260917-0250` nine PASSED; build 12 `qa-6c0c13dc4e-webdav-a-20260917-0319` nine PASSED (0.88 / 1.31 / 2.01 s); CAP13 (a)-(d), CAP14 (a)-(d) PASSED on guest b (`cap-b-6c0c13dc4e.log`).
- **Records**: QA rows for builds 11 and 12; work log entries 02:58, 02:59, 03:24, 03:47, 04:00; memory `build-id-is-the-synced-head`.

## In Progress

- **The staging question for the RG SP** -- asked in the final message of this session; nothing runs until the maintainer answers.
  - **What remains**: on their yes for the transfer: `QUOTE='<their words verbatim>' bash /workspace/tmp/rocknix-session/stage-rgsp-run-6c0c13dc4e.sh` (refuses without QUOTE; does the idle check, uploads under `.part`, verifies the sha on the device, moves into `/storage/.update`). Then ask about the reboot by name; on yes: `tools/device-act rgsp "reboot-apply-h700-6c0c13dc4e (maintainer yes: '...')" -- 'sync; reboot'` with `DEVICE_ACT_SSH_OPTS='-o Hostname=100.75.221.73'`, then `bash /workspace/tmp/rocknix-session/rgsp-after-reboot.sh 6c0c13dc4e`. Then the maintainer's round: #207 box 1 (no flash after YES), the rest of #200 section A, #201 box 5.
- **The maintainer's build-10 round** continues on the device meanwhile: each note -> issue quoting them (D-QA-012), fix, build (the cycle used today: ES branch from `test/qa-integration`, merge, pin on a distribution branch, merge to next, `fork-worktree sync` with nothing in flight, chain, guest d proof, suites, H700).

## Next Steps

1. Relay the maintainer's answer on staging build 12 (see In Progress). If they report anything else from the device, file it first.
2. After build 12 is on the device and their round is in: closures owed on confirmation -- #205 (all but the refusal box ticked; the refusal box was proven on guest d today as #206 box 3, same gate: tick it), #206, #207; then the fifteen fixed-awaiting (#182, #175, #183, #181, #178, #177, #174, #169, #160, #121, #113, #102, #50 among them).
3. rocknix.org pages (#191/#201, #196, #203) before any upstream PR; #185's round; the audit and RAOfflineProxy upstreaming tasks.

## Key Files Modified (this session)

| File | Change | Notes |
| --- | --- | --- |
| ES `es-app/src/guis/GuiSaveState.{h,cpp}` | Modified | `mShown`, `filesOnDisk()`, compare-before-rebuild, INFO line on the exception path (#207) |
| ES `es-app/src/SaveStateBookkeeper.{h,cpp}`, `SaveStateRepository.cpp` | Modified | worker WARNING when the file is still present; comments |
| `projects/ROCKNIX/packages/ui/emulationstation/package.mk` | Modified | pin `e4b441d9ec11948eef86f501fbf828edec032173` |
| `docs/decision-register.md` | Modified | D-UI-074 (311 IDs) |
| `docs/vm-qa-log.md` | Modified | rows for `ea828b286a` and `6c0c13dc4e` |
| `docs/work-logs/2026_09-work_logs/2026_09_17-work_log.md` | Modified | five entries 02:58 -> 04:00 |
| `docs/qa-frames/2026-09-17/{207-*,206-*}.png` | Created | five frames |

## Related Context

- **Tracker**: #207 (box 1 open, the device's), #206 (all ticked, awaiting the round), #205 (refusal box to tick), #200/#201 (the round), #11 epic.
- **Device record**: `/workspace/artifacts/rocknix-device-actions.log` -- 02:36 read-only retire read (boot `bae3b500`, build 10). No device change this session.
- **Session scripts** (`/workspace/tmp/rocknix-session/manager-no-flash/`): `flash-check.py <key|none> <label> [s]`, `hold.py <key> <ms>` (a held press over the monitor), `upgrade-d.sh <tar> <id>`, `proof-11*.sh`, `proof-12*.sh`, `cap-b-6c0c13dc4e.sh`, `chk.sh`, chain/build/suites scripts and logs for `ea828b286a` and `794bdbb945` (= image `6c0c13dc4e`); `frames*/`. `../stage-rgsp-run-6c0c13dc4e.sh` (QUOTE-gated), `../rgsp-after-reboot.sh`, `../stage-h700.sh`.

## Notes for Next Session

- **Guest d** (`:10026`) is on **build 12**, on the NES game list (Bobl). Fixture: Bobl `state1..4` + auto (state4 without a thumbnail; several scratch `retired` rows), Probe auto/1/2. Cloud config restored (no rclone.conf, `/ROCKNIX/Saves`, no bwlimit); `last-backup` reads `143 SOMETHING_WENT_WRONG` from today's deliberate stop; exit sync off. Guests a/b are on build 12 from the suites (guest b's `/tmp/qa-bin` holds the tree's three scripts until its next re-image).
- **Guest d key map**: `x` = A, `z` = B, `a` = Y (SEARCH on the list -- a text popup that swallows typed keys; Escape leaves it), `s` = X (GAME OPTIONS on the list; COPY in the manager), `ret` = START on the list but LAUNCH inside the manager, `shift` wakes the screensaver. **Open the manager from the list with A held** (`hold.py x 1500`); `s`,`x` (GAME OPTIONS -> LAUNCH) also opens it but asks D-CLOUD-130's question first when a sync runs. GAME SETTINGS cloud rows: from the top, up 12 then down 7 lands on BACK UP SAVES TO THE CLOUD.
- **Sync-in-flight fixtures**: a 500 KB saves backup at `--bwlimit 1k` lasts ~4 min; plant ~1 MB for a 15-minute window. The QA folder has one writer: never during `tools/vm-qa`.
- **Unremovable-file fixture**: `chattr +i` (busybox has it); an empty directory is removed by the worker's `remove()`.
- **Build naming**: BUILD_ID is the build worktree's HEAD at sync time; name everything by the image's id. No x64 build while `vm-qa` runs (same image filename). `scp` to a guest needs `-P`.
- **Frames with the RA QA account name** (a running game's login toast) stay in the session directory; never publish them.
- Commits: `git -c user.name="Max Engel" -c user.email="max@awecelot.com"`, trailers `Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>` and `Claude-Session: https://claude.ai/code/session_01LkFLXE5GsT1apn8AwrxrGR`; register append-only (`tools/register-check` with ES_SRC); docs on a feature branch then `git -C /workspace/repos/rocknix merge --ff-only` + push, never a `cd` into the primary; session state committed from this worktree.

## Open Questions

- Does the maintainer want build 12 `6c0c13dc4e` staged on the RG SP (the transfer), and then rebooted (a second yes)?
- Their confirmation of #207 box 1 (no flash after YES) and the rest of their build-10 round (#200 section A, #201 box 5).
