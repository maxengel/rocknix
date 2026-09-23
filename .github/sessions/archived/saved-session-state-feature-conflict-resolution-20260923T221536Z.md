# Saved Session State

> **Saved**: 2026-09-23T19:55:00Z
> **Branch**: feature/conflict-resolution (this worktree holds only the session state; the work is on `next` in the primary checkout `/workspace/repos/rocknix`, head `e5065e18ee` + UNCOMMITTED #252 work: `tools/frame-diff`, `tools/vm-qa`, `tools/vm-walks/{suite.txt,masks.txt,claims.txt,manager.steps,fixtures/,README.md}`, `.githooks/pre-push`, `.claude/rules/{generic-x64-vm-testing,fork-workflow}.md`, `docs/{decision-register,cloud-sync-changelog}.md`, the work log)
> **Repo**: maxengel/rocknix (fork of ROCKNIX/distribution)

## Current Focus

**Blindspot 52 (#253): four "pending decisions" put to the maintainer were settled in the record.** The maintainer: *"I worry that we're losing track of the institutional knowledge ... I think a lot of these are actually settled issues. We need to spend the time doing our own project archaeology ... and then figuring out how we prevent this from happening in the future."* Done the same session: the archaeology on #209 (parity, D-UI-057 -> D-UI-083), #228 (RC pin D-WORKFLOW-026; the post-RC path D-WORKFLOW-027 open with pros/cons on the issue), #225 (the 09-19 scope cut, D-QA-039, closed as delivered), #42 (D-WORKFLOW-014, not an RC item), #251 (verified: the fraction is dropped by FT_Set_Pixel_Sizes; 10 px vs 17 px on the H700; options with numbers). Prevention: `tools/archaeology <terms>|--issue N`, `tools/work-log-index --write|--check` (`docs/work-logs/INDEX.md`), the push-guard warning, three rule sentences (decision-register.md, learning-capture.md), blindspot 52, #236 § C rewritten to two open items (D-WORKFLOW-027, #251). All committed and pushed on `next`.

**Also today:** #250 proven and the fifteenth cut green; #252 (frame-diff gate) rolled out and proven (runs 17-21). **The RG35XX SP runs the fourteenth; the fifteenth's transfer and reboot are still asked for and unanswered.**

## Completed This Session (2026-09-23 04:55 -> 05:30 UTC)

- **#250** -- ES `bb79e4fc4` (`GuiSaveState` sets a tile decorator: aspect and turns only for a tile whose entry has a capture; `ImageGridComponent::setTileDecorator`; the grid-wide `setImageDisplayAspect/Rotation` removed). Distribution pin `aa8d525a8a`. Body box 1 corrected and ticked; comment with the arrow table (`issues/250#issuecomment-5789496467`).
- **The arrow reference**: the fifth cut `5d8bc093c7` had already fitted the arrow at 4:3 on an NES game (84x38); every pre-#243 manager frame (09-15 .. 09-21 `77e7e97515`) has it at 54x43, x 55..108, y 306..348, and the fifteenth matches those. The 1,033-pixel difference against the fifth cut's NES frame in `measure-250-aa8d525a8a.txt` is the fifth cut's own distortion, not a regression.
- **Docs** (`b26f214a56` on `next`): `docs/qa-frames/2026-09-23/250-*` five frames + README section; work-log entries 05:05 and 05:20; the change log's #250 line; the 09-22 #245 decision entry that had been left uncommitted.
- **#251 filed** (the sign-in banner's font is RetroArch's message-queue 20 against the achievement banner's 32; options for the maintainer).

## In Progress

- The transfer and reboot question for the fifteenth on the RG35XX SP (asked 05:50, 16:20, 18:45 and 19:55 UTC).
- #209's build waits on the maintainer's nod for a cut (the decision is settled): one `case` line in `setsettings.sh` (`0|2|false|none` -> `savestate_auto_index false`), the legacy `0` shown as DO NOT INCREMENT in the interface, `savestate_max_keep` never written empty.
- #251: the maintainer's pick among the four options (numbers on the issue).

## Next Steps

1. **Before putting anything to the maintainer as pending: `tools/archaeology <terms>` first** (rule in decision-register.md). After appending a work-log entry: `tools/work-log-index --write`.
2. On the maintainer's yes: stage the fifteenth (`stage-rg35xxsp-aa8d525a8a.sh`), then the reboot through `tools/device-act`; then #250 box 2, #249, #245, #246, #243 device halves; then the RG SP (D-QA-031), then the Nova.
3. On the maintainer's nod: build #209 (D-UI-083) into the next cut; on their pick, #251.
4. #252 box 3b (SCREENSHOTS/viewer walks); #253's four-week box (2026-10-21).

## Key Files Modified (this session)

| File | Change | Notes |
| --- | --- | --- |
| `tools/frame-diff` | Created | compare / accept / boxes; stdlib PNG; masks; claims keyed by baseline build |
| `tools/vm-qa` | Modified | `frame-diff` suite; SKIPS; `ensure_manager_fixture`; the cloud reset before seeding |
| `tools/vm-walks/{suite.txt,masks.txt,claims.txt,manager.steps,fixtures/*,README.md}` | Modified/Created | the manager walks; default-pre; the two steering files |
| `.githooks/pre-push`, `.claude/rules/fork-workflow.md` | Modified | `tools/frame-diff` in the fork-only list |
| `.claude/rules/generic-x64-vm-testing.md` | Modified | § "The frames are compared, not only counted (#252)" |
| `docs/decision-register.md` | Modified | D-QA-038 decided; D-RA-006 kept under the open table |
| `docs/cloud-sync-changelog.md` | Modified | #250 and #252 lines |
| `docs/vm-qa-log.md` | Modified | the fifteenth's row; the #252 runs' row |
| `docs/qa-frames/2026-09-23/` | Modified | `250-*` and `252-*` frames + README sections |
| `docs/work-logs/2026_09-work_logs/2026_09_23-work_log.md` | Modified | entries 05:05 .. 18:35 |
| `projects/ROCKNIX/packages/ui/emulationstation/package.mk` | Modified | pin `834bf069c` (`aa8d525a8a`) |

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
- The walk baseline is the fifteenth's own frames (run 20) because the thirteenth's x64 image is gone; said so in BASELINE.txt and on #252.
- #251: which option, if any.
