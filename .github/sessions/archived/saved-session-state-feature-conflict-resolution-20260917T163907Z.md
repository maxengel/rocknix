# Saved Session State

> **Saved**: 2026-09-17T05:47:03Z
> **Branch**: feature/conflict-resolution (this worktree holds only the session state; the work is on `next` and in the ES repo)
> **Repo**: maxengel/rocknix -- primary checkout /workspace/repos/rocknix on `next` (0a79441000, pushed); ES ~/Development/emulationstation-next, build branch `test/qa-integration` at `3c0ec779a` (pushed); ES feature worktrees `manager-no-flash` (#207, merged) and `card-compare-words` (#208, `8d5ab6db9`, merged); distribution feature worktree `/workspace/repos/rocknix.worktrees/build11-flash` (`feature/build11-flash`, merged into next)

## Current Focus

**RC-12 build 13 `91cfa8a2b1` is the build to stage; it waits for the maintainer's word.** It carries the maintainer's two build-10 notes from this session: #207 (the flash after a deletion: the manager rebuilds its grid only when the disk disagrees with the page, D-UI-074, plus the worker's truthful deletion line) and #208 (NOTHING SENT YET between the stages of a sync: the card's live line says progress -- COMPARING SAVES, the count, the bytes -- never the outcome so far, D-UI-075). Nine suites PASSED on builds 11, 12 and 13; CAP13/14 PASSED on 12; guest d proofs PASSED for #207 (builds 11, 12) and #206 box 3 (12); #208's words proven in frames on 13 (STARTING... -> COMPARING SAVES · 1 OF 1 -> ... -> 0 KB OF 186 KB). **Every VM box on #207, #208 and #206 is ticked** (#208 box 3: a full-speed run with nothing new ends on BACK UP SAVES / COMPLETED, 05:43). Nothing is in flight. Nothing has touched the RG SP this session beyond one read-only log read. **The staging question for build 13 was put to the maintainer in the session's last message; nothing runs until they answer.**

## Completed This Session (2026-09-17 02:26 -> 2026-09-17T05:38:37Z)

- **#207** filed, fixed (ES `ee4786940`, `058c375ac`), proven (VM boxes 2-5 ticked), registered (D-UI-074); **#205** closed out on the device (1160 / 970 ms; boxes 1 and 5 ticked); **#206 box 3** proven (the copy's gate during a sync).
- **#208** filed (the maintainer's words), fixed (ES `8d5ab6db9` -> merge `3c0ec779a`: `CloudText::liveWords`, pure, unit-tested, 113 / 1236), registered (D-UI-075), proven in frames on guest d (boxes 2-5 ticked; box 1 the device's).
- **Builds** 11 `ea828b286a`, 12 `6c0c13dc4e`, 13 `91cfa8a2b1` for x64 and H700, archived under `/workspace/artifacts/rocknix-images/{x64,h700}-all-20260917-<id>/` with `SHA256SUMS.tar` and `BUILD_INFO.txt`. **Build 13 H700 tar sha `fe677671428e300ad49fec2d51ed592371ef11e5b6c3a93967e3c444affd2b95`, 1,304,268,800 bytes.**
- **Suites**: 11 `qa-ea828b286a-…-0250`, 12 `qa-6c0c13dc4e-…-0319`, 13 `qa-91cfa8a2b1-…-0438`, all nine PASSED; CAP13/14 on guest b (build 12).
- **Records**: QA rows for 11, 12, 13; work log 02:58 -> 05:42 (nine entries); D-UI-074, D-UI-075 (312 IDs); frames `207-*`, `206-*`, `208-*`; memory `build-id-is-the-synced-head`.
- **Fixture lessons** (work log 05:42, 05:47, 05:50): `--bwlimit 1k` shared by four transfers freezes rclone's byte counter for stretches, so the deliberate ceiling (D-CLOUD-126) ends the run truthfully -- use `--transfers 1` beside it; the screensaver blanks a capture at 300 s (a `shift` a minute); a swallowed START turns the next A into a launch (`press_change`); the liveness signal is the scripts' processes, not rclone's.

## In Progress

- **The staging question for build 13** -- asked; the maintainer's answer decides the next act (see Next Steps 2).

## Next Steps

1. Relay the maintainer's answer on staging build 13; if they report anything else from the device, file it first (D-QA-012).
2. On their yes: stage build 13 on the RG SP? (`QUOTE='<their words>' bash /workspace/tmp/rocknix-session/stage-rgsp-run-91cfa8a2b1.sh`; refuses without QUOTE; idle check, `.part` upload, sha on the device, move into `/storage/.update`.) Then the reboot as a second question (`tools/device-act rgsp "reboot-apply-h700-91cfa8a2b1 (maintainer yes: '...')" -- 'sync; reboot'`, `DEVICE_ACT_SSH_OPTS='-o Hostname=100.75.221.73'`, then `bash /workspace/tmp/rocknix-session/rgsp-after-reboot.sh 91cfa8a2b1`).
3. Their round on build 13: #207 box 1, #208 box 1, #200 section A, #201 box 5; each new note -> issue quoting them (D-QA-012), fix, build (the cycle: ES branch from `test/qa-integration`, merge, pin on `feature/build11-flash`, merge to next, `fork-worktree sync` with nothing in flight -- check `docker ps` and `pgrep -f 'tools/vm-q[a]'`, never a pattern the shell's own line carries -- chain by the synced HEAD's id, guest d, suites, H700).
4. Closures owed on confirmation: #205 (tick the refusal box from #206 box 3, same gate), #206, #207, #208; the fifteen fixed-awaiting; rocknix.org pages (#191/#201, #196, #203) before any upstream PR.

## Key Files Modified (this session)

| File | Change | Notes |
| --- | --- | --- |
| ES `es-app/src/guis/GuiSaveState.{h,cpp}`, `SaveStateBookkeeper.{h,cpp}`, `SaveStateRepository.cpp` | Modified | #207 |
| ES `es-app/src/CloudText.{h,cpp}`, `ThreadedCloudSync.{h,cpp}`, `tests/unit/CloudTextTests.cpp` | Modified | #208: `LiveWords liveWords(...)`, `mCountShown`, the test case |
| `projects/ROCKNIX/packages/ui/emulationstation/package.mk` | Modified | pin `3c0ec779a42ebf605d2200ee7a34834e97e84112` |
| `docs/decision-register.md`, `docs/vm-qa-log.md`, work log 09-17, `docs/qa-frames/2026-09-17/{207,206,208}-*.png` | Modified/Created | rows, entries, eight frames |

## Related Context

- **Tracker**: #207, #208 (box 1 each: the device's), #206 (all ticked), #205 (refusal box to tick), #200/#201, #11.
- **Device record**: `/workspace/artifacts/rocknix-device-actions.log` -- 02:36 read-only read only.
- **Session scripts**: `/workspace/tmp/rocknix-session/manager-no-flash/` (#207 tools: `flash-check.py`, `hold.py`, `upgrade-d.sh <tar> <id>`, proofs, chains) and `/workspace/tmp/rocknix-session/card-compare-words/` (#208: `proof-13-{sync,backup,dirs,nothing}.sh`, `chk.sh`, chain/build/suites scripts and logs for `91cfa8a2b1`, `frames-13*/`); `../stage-rgsp-run-91cfa8a2b1.sh` (QUOTE-gated), `../rgsp-after-reboot.sh`, `../stage-h700.sh`.

## Notes for Next Session

- **Guest d** (`:10026`) on **build 13**, idle on the NES list; fixture Bobl `state1..4` + auto (state4 without thumbnail), Probe auto/1/2 (~190 KB each; 15 files -- count them, a `cut` listing dropped two names once). Cloud config restored (checked 05:48: no rclone.conf, `/ROCKNIX/Saves`, nothing planted); if a future proof dies mid-way: `cp /storage/.cache/cloud_sync.conf.pre208 /storage/.config/cloud_sync.conf; rm /storage/.config/rclone/rclone.conf; rm -rf /storage/roms/screenshots/qa-*`. Its stamps are scratch (`last-backup 124`, `last-sync-manual 124 gaps`). Guests a/b on build 13 from the suites.
- **Guest d keys**: `x` = A, `z` = B, `a` = Y (SEARCH on the list: a text popup that swallows keys; `esc` leaves it), `s` = X (GAME OPTIONS on the list; COPY in the manager), `ret` = START on the list but LAUNCH in the manager, `shift` wakes. Manager from the list: **A held** (`hold.py x 1500`). GAME SETTINGS cloud rows: from the top, up 12 then down 6 = SYNC SAVES WITH THE CLOUD, down 7 = BACK UP SAVES TO THE CLOUD. LAUNCH during a sync asks D-CLOUD-130's question first.
- **Frame proofs**: the VM's compare finishes before rclone's first stats tick unless the listing is slow (300 one-file directories work); a 1 KB/s limit shared by four transfers stalls the counter and the ceiling ends the run after 36 s -- `--transfers 1` beside `--bwlimit`; the screensaver blanks at 300 s; frames of a running game carry the RA QA account name and stay local.
- **Build naming**: BUILD_ID = the build worktree's HEAD at sync time; sync right after the pin; no x64 build while `vm-qa` runs; scp to a guest needs `-P`.
- Commits: `git -c user.name="Max Engel" -c user.email="max@awecelot.com"`, trailers `Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>` and `Claude-Session: https://claude.ai/code/session_01LkFLXE5GsT1apn8AwrxrGR`; register append-only (`tools/register-check` with ES_SRC); docs on `feature/build11-flash` then `git -C /workspace/repos/rocknix merge --ff-only` + push; never `cd` into the primary; session state committed from this worktree.

## Open Questions

- Does the maintainer want build 13 `91cfa8a2b1` staged on the RG SP, and then rebooted (two answers)?
- Their confirmation of #207 box 1 (no flash) and #208 box 1 (no NOTHING SENT YET) on the device, and the rest of their round.
