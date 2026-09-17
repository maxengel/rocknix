# Saved Session State

> **Saved**: 2026-09-16T23:43:00Z
> **Branch**: feature/conflict-resolution (this worktree holds only the session state; the work is on `next` and in the ES repo)
> **Repo**: maxengel/rocknix -- primary checkout /workspace/repos/rocknix on `next` (8ad3984a95, pushed); ES ~/Development/emulationstation-next, build branch `test/qa-integration` at `942132e99` (pushed); feature worktree `emulationstation-next.worktrees/delete-async` on `feature/savestate-delete-async` (a8e274598, merged)

## Current Focus

#205 -- the save state manager's DELETE hung for "a second or so" on the RG SP. Root cause found, reproduced on guest d, fixed, proven, built as **RC-12 build 9 `e287f9d21a`** (nine suites PASSED, guest d proof PASS), H700 filed, **NOT staged**: the RG SP was off the network (both addresses) when the run ended, so the staging question waits for the device (D-QA-011), then the reboot as its own question (D-QA-015). The RG SP is still on RC-12 build 6 `bc26baa60d`.

## Completed This Session (2026-09-16 15:13 -> 23:45 UTC)

- **Cause** (asked as a question, answered first, then fixed on the maintainer's go): since D-CLOUD-053 the Y handler ran `cloud_capture --retire` and `--rescan` synchronously on the interface thread (`popen`); COPY TO FREE SLOT runs no script. Reproduced through the manager on guest d with a press timer over the QEMU monitor (`scratchpad/press-time.py`, 83 ms/frame): YES 0.588 s to the first changed frame vs a copy 0.350 s on build 7; the journal put the retire at 165 ms of interface thread; ~150 ms under ES because each `popen` forks a 346 MB process. On the A53 that is the second the maintainer felt.
- **Decisions**: D-UI-073 (instant deletion: tile gone the frame YES is pressed; retire then unlink on one worker, one at a time; paths not pointers; joined at exit), D-CLOUD-132 (no post-delete `--rescan`: nothing renumbers since D-UI-069). Maintainer: *"Let's go with option 1 with the mitigation steps you've outlined."* Blindspot 45 (a fixture's speed, not the device's).
- **ES** `a11cde632` + `a8e274598` on `feature/savestate-delete-async`, merged to `test/qa-integration` (`2bf92e67f`, then `942132e99`): `SaveStateDeleteQueue` (pure order book; 7 unit cases / 52 assertions, 109 / 1201 in all -- compiled with host g++, no cmake on this host, see below), `SaveStateDeleter` (the worker; `shutdown()` from main's tail and `onExit`), `GuiSaveState` (hides pending tiles in `loadGrid`, enqueues two strings on YES, polls `completed()` in `update()` keeping the cursor), `SaveStateRepository::onDisk` (never hands out a state whose file is gone -- the ghost tile the teardown case found on build 8).
- **Builds**: build 8 `a4dfd97ca5` (nine suites PASSED; guest d proof found the ghost) and build 9 `e287f9d21a` (nine PASSED `qa-e287f9d21a-webdav-a-20260916-2316`; guest d: copy 0.349 s, YES 0.345 s; retire on the worker, no rescan, file gone, row written; YES+B 10 ms later with ES intact and no ghost on reopen; a file removed over ssh not listed). Filed under `/workspace/artifacts/rocknix-images/{x64,h700}-all-20260916-{a4dfd97ca5,e287f9d21a}/` (build 9 H700 tar sha `5d7b9806eab2cb00…`).
- **Issues**: #205 (cause, reproduction, decision, builds, proofs; VM-side acceptance boxes ticked, the rescan box superseded in the body; box 1 and the device half of box 5 open), #206 (COPY TO FREE SLOT writes a slot no capture mode records -- open, not started). Both sub-issues of #11.
- **Docs on `next`** (all pushed): register rows, blindspot 45, `save-manifest-schema.md` renumber bullet corrected, QA rows for builds 8 and 9 in `docs/vm-qa-log.md`, work log entries 15:50 -> 23:45, frames `docs/qa-frames/2026-09-16/205-*`.
- Memory: `one-proof-at-the-devices-numbers` extended with the speed lesson.

## In Progress

- **Offering build 9 to the RG SP**: not asked yet because the device was off the network. On the maintainer's yes: `stage-rgsp-run-e287f9d21a.sh` (copy the build-6 wrapper `stage-rgsp-run-bc26baa60d.sh`: artifact dir `h700-all-20260916-e287f9d21a`, quote the yes, BEGIN/END lines), then the reboot as its own question through `tools/device-act rgsp "reboot-apply-h700-e287f9d21a (maintainer yes ...)" -- 'sync; reboot'`, then `rgsp-after-reboot.sh e287f9d21a`. Note the RG SP goes from build 6 straight to build 9 (builds 7 and 8 never staged): D-CLOUD-130 (the automatic syncs ask) lands on the device with it.
- The maintainer's own round then: #205 box 1 (no perceptible freeze after YES) and the device's `(--retire, N ms)` line from `/var/log/cloud_sync.log` (read-only, `tools/device-act`), plus #200 section A on build 9.

## Next Steps

1. When the RG SP is on: ask *"May I stage build 9 `e287f9d21a` on the RG SP?"*; stage; ask for the reboot by name; `rgsp-after-reboot.sh`; record the RETURNED line, the QA row's device column, the work log, #205 (tick box 1 and box 5's device half on the maintainer's word; record the device's retire ms).
2. #206 (its own change, #21's design): a capture mode for a manager-made copy, plus the missing running-sync gate on the X handler.
3. Earlier follow-ups, unchanged: #203's transfer-page stamps; the rocknix.org pages (#191/#201, #196, #203) before any upstream PR; #185's own round; the audit and RAOfflineProxy upstreaming tasks.

## Key Files Modified (this session)

| File | Change | Notes |
| --- | --- | --- |
| ES `es-app/src/SaveStateDeleteQueue.{h,cpp}` | Created | pure order book: enqueue/take/finish/isPending/completed; unit-tested |
| ES `es-app/src/SaveStateDeleter.{h,cpp}` | Created | the worker: retire then unlink, one job at a time; `shutdown()` joins |
| ES `es-app/src/guis/GuiSaveState.{h,cpp}` | Modified | YES enqueues two strings and reloads; `loadGrid` hides pending; `update()` polls `completed()` |
| ES `es-app/src/SaveStateRepository.{h,cpp}` | Modified | `onDisk`/`anyOnDisk`: `getSaveStates`/`hasSaveStates` skip vanished files |
| ES `es-app/src/main.cpp`, `es-app/CMakeLists.txt`, `es-app/tests/unit/{CMakeLists.txt,README.md,SaveStateDeleteQueueTests.cpp}` | Modified/Created | shutdown hook; sources listed; the test |
| `projects/ROCKNIX/packages/ui/emulationstation/package.mk` | Modified | pin `942132e99efa8b5ac3048eea50fce33a2a5e0a51` (build 9) |
| `docs/decision-register.md`, `docs/blindspot-register.md`, `docs/save-manifest-schema.md`, `docs/vm-qa-log.md`, `docs/work-logs/2026_09-work_logs/2026_09_16-work_log.md`, `docs/qa-frames/2026-09-16/205-*` | Modified | D-UI-073, D-CLOUD-132; blindspot 45; rows; frames |

## Related Context

- **Tracker**: #205, #206 (new, under #11); #200 (the RG SP round), #201-#203, #185.
- **Session scripts** (`/workspace/tmp/rocknix-session/delete-async/`): `chk.sh` (cross-compiler syntax check for the ES worktree; `chk.sh <files>`), `build-tests/es-unit-tests` (built by hand with host g++ -- **no cmake on this host**; the g++ line is in the 2026-09-16 work log / this session), `proof-9.sh` (the guest d proof, gated; assumes the NES list with Bobl selected), `chain-*.sh`/`build-x64-*.sh`/`suites-*.sh` (the build pattern: x64, then suites and H700 side by side), logs. Scratchpad (may vanish): `press-time.py`, `keys-fast.py`, frames.
- **Device record**: `/workspace/artifacts/rocknix-device-actions.log` -- two read-only attempts on the RG SP this session (both unreachable); the last real act is build 6's reboot (03:33 UTC).

## Notes for Next Session

- **Guest d** (`:10026`) is on **build 9**, English, fixture intact: Bobl `state1..3` + auto, Tobu `state3` + auto; no cloud remote; the manifest carries ten `retired` rows from today's scratch deletions (harmless). After an ES restart guest d sits on the **carousel** (not the list): X there is RANDOM -- this framed PICO-8's list once and a #205 comment row was posted on it before the frame was read (corrected in the next comment). Read the frame before the claim.
- The auto-mode classifier refuses a VM reboot when it shares a command with a copy; the maintainer authorised rebooting guest d in chat (*"please reboot that guest d vm"*), and standalone reboot commands then passed.
- ES does not handle SIGTERM (`signal(SIGTERM, …)` commented out): `systemctl restart essway` kills it in 25 ms; the join at exit guards ES's own quit paths only. A kill inside the retire's tail leaves a row and the file (same as before).
- Timing floor on guest d's rig: ~0.26-0.35 s press to first changed frame (input latency + 83 ms/frame); compare presses against each other, not against zero.
- Every device act: idle check, ask by name, `tools/device-act`, read the device afterwards; the ES pin must be pushed before building; build worktrees sync only with no build running; commits gated on the check (`chk.sh ... && git commit`).
- Commits: `git -c user.name="Max Engel" -c user.email="max@awecelot.com"`, trailers `Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>` and `Claude-Session: https://claude.ai/code/session_01LkFLXE5GsT1apn8AwrxrGR`; register append-only (`tools/register-check`, ES_SRC for ES citations); never `cd` into the primary checkout.

## Open Questions

- The maintainer's yes to stage build 9 on the RG SP (the device was off the network at 23:41 UTC); then the reboot.
- Their feel of the deletion on the device (#205 box 1) and the device's `(--retire, N ms)` number.
