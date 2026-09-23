# Saved Session State

> **Saved**: 2026-09-23T16:58:00Z
> **Branch**: feature/conflict-resolution (this worktree holds only the session state; the work is on `next` in the primary checkout `/workspace/repos/rocknix`, head `e5065e18ee` + UNCOMMITTED #252 work: `tools/frame-diff`, `tools/vm-qa`, `tools/vm-walks/{suite.txt,masks.txt,claims.txt,manager.steps,fixtures/,README.md}`, `.githooks/pre-push`, `.claude/rules/{generic-x64-vm-testing,fork-workflow}.md`, `docs/{decision-register,cloud-sync-changelog}.md`, the work log)
> **Repo**: maxengel/rocknix (fork of ROCKNIX/distribution)

## Current Focus

**#252 is being rolled out (D-QA-038, the maintainer's yes at ~16:20 UTC: "roll that out as well ... shouldn't require us to cut a new build. Let me know what testing is required").** Built and proven on the host: `tools/frame-diff` (compare/accept/boxes; stdlib PNG; 16-px cells; masks; claims keyed by the baseline build; rc 2 = no baseline), the `frame-diff` suite in `tools/vm-qa` (after `walks`; rc 3 = SKIP shown in the table and the footer), `tools/vm-walks/masks.txt` (the clock 1110..1215 x 36..64; the running transfer's count line, bar and ELAPSED), `claims.txt` (three whole-frame claims for the new manager walks against `9221b4528d`), `manager.steps` + `manager-{nes,gb,fbn}` suite lines (StartupSystem with essway stopped) + `ensure_manager_fixture` in vm-qa (stub ROMs, the ring pictures in `tools/vm-walks/fixtures/`, `turns=1` for Bobl, mtimes 2026-09-01 12:00), and `default-pre` now also turning both sync switches off and removing `/storage/.cache/cloud_sync/last-*`. **Baseline** `/workspace/artifacts/rocknix-images/walk-baseline` = run 14's frames (`9221b4528d`). **Run 17** (`qa-aa8d525a8a-webdav-a-20260923-1627`, `--only walks,frame-diff`): walks PASS 1332 s, the three manager walks reached the manager (arrow upright, tiles turned, dates fixed), frame-diff FAIL (1) with 156 unclaimed boxes -- the manager fixture changed the carousel backdrop and the systems page, and the hub's game-exit row/switch differed because the exit suite had not run; the suite fails closed as designed. **Run 18 is in flight** (started 16:53, same flags, with the hub normalisation; `vmqa-run18.{log,rc}`; a first start without the normalisation was killed at 16:53).

**The RG35XX SP** came up on the fourteenth (`c0c2d15179`, the queued tar applied at the power-on; queue empty). The fifteenth (`aa8d525a8a`, #250) is built, green (vm-qa 11/11 run 16, rehearsal 19/19), not staged: the transfer and the reboot are asked for and unanswered (D-QA-011).

## Completed This Session (2026-09-23 04:55 -> 05:30 UTC)

- **#250** -- ES `bb79e4fc4` (`GuiSaveState` sets a tile decorator: aspect and turns only for a tile whose entry has a capture; `ImageGridComponent::setTileDecorator`; the grid-wide `setImageDisplayAspect/Rotation` removed). Distribution pin `aa8d525a8a`. Body box 1 corrected and ticked; comment with the arrow table (`issues/250#issuecomment-5789496467`).
- **The arrow reference**: the fifth cut `5d8bc093c7` had already fitted the arrow at 4:3 on an NES game (84x38); every pre-#243 manager frame (09-15 .. 09-21 `77e7e97515`) has it at 54x43, x 55..108, y 306..348, and the fifteenth matches those. The 1,033-pixel difference against the fifth cut's NES frame in `measure-250-aa8d525a8a.txt` is the fifth cut's own distortion, not a regression.
- **Docs** (`b26f214a56` on `next`): `docs/qa-frames/2026-09-23/250-*` five frames + README section; work-log entries 05:05 and 05:20; the change log's #250 line; the 09-22 #245 decision entry that had been left uncommitted.
- **#251 filed** (the sign-in banner's font is RetroArch's message-queue 20 against the achievement banner's 32; options for the maintainer).

## In Progress

- **Run 18** (`--only walks,frame-diff` on the fifteenth's image; ~25 min). Expected: walks PASS, frame-diff FAIL against the thirteenth's baseline (the fixture and the normalisation changed the walked screens; the thirteenth's x64 image is not kept, so that baseline cannot be regenerated under the new suite).
- **The transfer and reboot question** for the fifteenth on the RG35XX SP.

## Next Steps

1. When run 18 ends: read its `frame-diff.md`; the boxes should be the fixture's (backdrop, systems page, transfer counts) and nothing on the hub's rows. Then `tools/frame-diff accept <run18>/walks /workspace/artifacts/rocknix-images/walk-baseline --build aa8d525a8a --note "first baseline under the suite with the manager fixture and the hub normalisation; the thirteenth's x64 image is not kept"`, prune the three `9221b4528d` claims from `claims.txt`, and run **run 19** (same flags) -- the end-to-end negative control, expected PASS with zero boxes. Positive controls already on file: `frame-diff boxes` on the twelfth vs fifteenth `fbn` manager at 640x480 (one box, the arrow) and run 17's FAIL (156 unclaimed).
2. Commit on `next` (tools + rules + docs + the guard), push; QA-log rows for runs 17-19; #252 comment with the proofs and tick the boxes that hold (tool, suite, walks, rule, change log); work log; the answer to the maintainer: no device testing is needed, it is all host and VM.
3. Then the fifteenth on the device once the maintainer says yes to the transfer and the reboot (`stage-rg35xxsp-aa8d525a8a.sh`; `tools/device-act` for the reboot). Then #250 box 2, #249, #245, #246, #243 device halves; #251 the maintainer's call.

## Key Files Modified (this session)

| File | Change | Notes |
| --- | --- | --- |
| `projects/ROCKNIX/packages/ui/emulationstation/package.mk` | Modified | pin `456eb7150` -> `834bf069c` (`aa8d525a8a`) |
| `docs/cloud-sync-changelog.md` | Modified | the #250 line under "Fixes worth calling out" |
| `docs/qa-frames/2026-09-23/README.md`, `250-*.png` | Modified/Created | the arrow before (fifth: 4:3-fitted; thirteenth: turned) and after |
| `docs/work-logs/2026_09-work_logs/2026_09_23-work_log.md` | Modified | 05:05 (#250 fix), 05:20 (the reference correction) |
| ES repo `feature/display-aspect` -> `test/qa-integration` | branch | `GuiSaveState.cpp`, `ImageGridComponent.h`, `GridTileComponent.{h,cpp}` |

## Related Context

- **Tracker**: #250 (box 1 ticked; box 2 the maintainer's), #251 (open, the maintainer's call), #249 (device half open), #248 (done on the device), #245/#246/#243 (device halves), #236 (round page), #247
- **Register**: D-UI-080, D-UI-081, D-UI-082, D-QA-037
- **Artifacts**: `h700-all-20260923-aa8d525a8a/` (candidate), `h700-all-20260923-c0c2d15179/` (staged on the device, to be superseded), `qa-aa8d525a8a-webdav-a-20260923-0506/`
- **Session scripts** (`/workspace/tmp/rocknix-session/`): `chain-250.sh`, `proof-243d.sh <outdir> "fbn nes gb"`, `measure-243.py`, `arrow-bbox.py` (the arrow's box in the START NEW GAME tile; fails on a frame whose first tile is unselected), `compare-region.py a b 8 262 156 436`, `stage-rgsp-aa8d525a8a.sh`, `record-h700-run19.sh` (copies + SHA256SUMS only; RECORD.txt is written by hand)

## Notes for Next Session

- **A must-not-change assertion's "before" is the build before the first change of the series**, not the previous cut: the fifth cut was already wrong for the arrow on 4:3 systems. Pre-#243 manager frames live in `docs/qa-frames/2026-09-1[5-7]/` and `2026-09-21/195-save-state-manager-24h-640x480-77e7e97515.png`.
- `freeslot.svg` is a 612x792 box with a 391x314 arrow; at its own shape the arrow's box is about 1.25:1 (54x43 at 640x480, selected tile).
- The FBNeo system is `fbn`; `arcade` is mame2003_plus. `StartupSystem=<name>` with essway stopped lands the carousel; `imageviewer` is not honoured. ES Info logs need `Debug=true`; `/var/log/es_log.txt` is tmpfs on the VM.
- One chain per image; no x64 build while vm-qa runs; the reboot is a question every time, by device.

## Open Questions

- The transfer and the reboot of the RG35XX SP for the fifteenth (asked 05:50 UTC and again at 16:20; the device is on, on the fourteenth).
- Whether the walk baseline may be the fifteenth's own frames for now (the thirteenth's x64 image is gone); the rule says it moves when a cut is accepted on the device.
- #251: which option, if any.
