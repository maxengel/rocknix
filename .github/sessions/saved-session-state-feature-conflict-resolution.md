# Saved Session State

> **Saved**: 2026-09-23T05:30:00Z
> **Branch**: feature/conflict-resolution (this worktree holds only the session state; the work is on `next` in the primary checkout `/workspace/repos/rocknix`, head `b26f214a56`, pushed to origin)
> **Repo**: maxengel/rocknix (fork of ROCKNIX/distribution)

## Current Focus

**The RG35XX SP runs the thirteenth cut `9221b4528d`.** The fourteenth `c0c2d15179` (#249) is in its `/storage/.update` with the reboot asked and unanswered. **The fifteenth cut `aa8d525a8a` (#250: the manager's arrow tiles untouched by the thumbnail transform; ES pin `834bf069c`) is the candidate**: x64 run 30 and H700 run 19 built (`h700-all-20260923-aa8d525a8a`, SHA256SUMS, no RECORD.txt yet), proven on guest d (the arrow tile pixel-identical to the 2026-09-21 pre-#243 frame in `fbn`/`nes`/`gb`, 0 of 25,752 pixels differ; capture tiles still turned, rings 68x69/73x73/89x89 mark above), **chain-250 still running**: vm-qa run 16 ten suites PASSED, `walks` in progress, then the upgrade rehearsal from `b245fd12ac`. When green: RECORD.txt, mark the fourteenth's record SUPERSEDED, the QA row, stage on the RG35XX SP with `stage-rgsp-aa8d525a8a.sh` (it replaces the fourteenth's same-named tar in `/storage/.update`), then ask for the reboot by name.

## Completed This Session (2026-09-23 04:55 -> 05:30 UTC)

- **#250** -- ES `bb79e4fc4` (`GuiSaveState` sets a tile decorator: aspect and turns only for a tile whose entry has a capture; `ImageGridComponent::setTileDecorator`; the grid-wide `setImageDisplayAspect/Rotation` removed). Distribution pin `aa8d525a8a`. Body box 1 corrected and ticked; comment with the arrow table (`issues/250#issuecomment-5789496467`).
- **The arrow reference**: the fifth cut `5d8bc093c7` had already fitted the arrow at 4:3 on an NES game (84x38); every pre-#243 manager frame (09-15 .. 09-21 `77e7e97515`) has it at 54x43, x 55..108, y 306..348, and the fifteenth matches those. The 1,033-pixel difference against the fifth cut's NES frame in `measure-250-aa8d525a8a.txt` is the fifth cut's own distortion, not a regression.
- **Docs** (`b26f214a56` on `next`): `docs/qa-frames/2026-09-23/250-*` five frames + README section; work-log entries 05:05 and 05:20; the change log's #250 line; the 09-22 #245 decision entry that had been left uncommitted.
- **#251 filed** (the sign-in banner's font is RetroArch's message-queue 20 against the achievement banner's 32; options for the maintainer).

## In Progress

- **chain-250** (`chain-250.sh`, log `chain-250.log`, done marker `chain-250.done`): vm-qa run 16 (`qa-aa8d525a8a-webdav-a-20260923-0506`, `vmqa-run16.rc`) then the rehearsal (`upgrade-rehearsal-run16.{log,rc}`).
- **The reboot question** for the RG35XX SP stays open; the answer applies whatever is in `/storage/.update` at that moment (the fifteenth once staged).

## Next Steps

1. On `chain-250.done`: read `vmqa-run16.rc` (0 = eleven suites PASSED) and `upgrade-rehearsal-run16.rc` (19/19). Write `RECORD.txt` in `h700-all-20260923-aa8d525a8a` (format: the fourteenth's), prepend `SUPERSEDED by h700-all-20260923-aa8d525a8a (fifteenth cut: the manager's arrow tiles untouched, #250)` to the fourteenth's, add the QA row to `docs/vm-qa-log.md`, commit docs on `next`.
2. `bash /workspace/tmp/rocknix-session/stage-rgsp-aa8d525a8a.sh > stage-aa8d525a8a.log` (idle check, copy, hash on the device, mv into `/storage/.update`; every device command through `tools/device-act`). Then ask the maintainer for the reboot of the RG35XX SP, naming `aa8d525a8a` and what it carries since the thirteenth (#249, #250).
3. On the yes: `tools/device-act rg35xxsp 'reboot to apply aa8d525a8a -- the maintainer said yes' -- 'sync; (sleep 2; reboot) >/dev/null 2>&1 &'`; confirm BUILD_ID and the empty queue; log the device-actions line; work log; the maintainer's device boxes: #250 box 2, #249, #245 (a vertical FBNeo session), #246 (an offline session with unlocks), #243 box 3.
4. #251: the maintainer's call (options in the issue); then the RG SP (D-QA-031) with the same tar; the current MAME/Flycast tables later.

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

- The reboot of the RG35XX SP (asked for the fourteenth; to be re-asked for the fifteenth once staged).
- #251: which option, if any.
