# Saved Session State

> **Saved**: 2026-09-24T02:35:00Z
> **Branch**: feature/conflict-resolution (this worktree holds only the session state; the work is on `next` in the primary checkout `/workspace/repos/rocknix`, head `e5065e18ee` + UNCOMMITTED #252 work: `tools/frame-diff`, `tools/vm-qa`, `tools/vm-walks/{suite.txt,masks.txt,claims.txt,manager.steps,fixtures/,README.md}`, `.githooks/pre-push`, `.claude/rules/{generic-x64-vm-testing,fork-workflow}.md`, `docs/{decision-register,cloud-sync-changelog}.md`, the work log)
> **Repo**: maxengel/rocknix (fork of ROCKNIX/distribution)

## Current Focus

**The seventeenth cut `443028ff7a` is the candidate** (the maintainer: *"Let's go with option two"*, D-UI-084): RetroArch patch `0016-widgets-message-queue-floor.patch` (the message queue never under 14 px) on top of the sixteenth's #209/#198/#247. Built 01:08-01:11 (RetroArch re-patched and rebuilt on both arches), `h700-all-20260924-443028ff7a` with RECORD.txt (VMQA_RESULT placeholder), guest d proof done (14 px: 44 strokes, 16 solid, mean stem 1.19 px; frame `251-toast-10px-vs-14px-4x`). **vm-qa run 23 + the rehearsal are rerunning (`chain-17b.sh`, `vmqa-run23.{log,rc}`, `upgrade-rehearsal-run18.{log,rc}`, `chain-17.done`)** after a false alarm: a stem measurement over a short span read 0 solid and I stopped the first run; the full span read 36% and the floor stays 14. When green: finalize RECORD.txt, the QA row, mark the sixteenth's record superseded, then ask the maintainer for the copy and the reboot (`stage-rg35xxsp-443028ff7a.sh` ready). **Then the rigorous code audit** (the maintainer: *"a full code audit using the code auditor's skill and being very rigorous to make sure comment quality, etc., are all well defined and executed"*) over the work since #186, with the `code-auditor` skill; its punch list fixed at every severity before the candidate is called one (D-WORKFLOW-015/016). **The RG35XX SP runs the fifteenth `aa8d525a8a`.**

Filed tonight: #255 (grid-fit font sizes per panel, the maintainer's idea, with the measurements), #256 (upstream in several PRs: the map; the interface side is coupled through GuiMenu.cpp +5,774 and ApiSystem.cpp +1,458; distribution splits by package).

## Completed This Session (2026-09-23 04:55 -> 05:30 UTC)

- **#250** -- ES `bb79e4fc4` (`GuiSaveState` sets a tile decorator: aspect and turns only for a tile whose entry has a capture; `ImageGridComponent::setTileDecorator`; the grid-wide `setImageDisplayAspect/Rotation` removed). Distribution pin `aa8d525a8a`. Body box 1 corrected and ticked; comment with the arrow table (`issues/250#issuecomment-5789496467`).
- **The arrow reference**: the fifth cut `5d8bc093c7` had already fitted the arrow at 4:3 on an NES game (84x38); every pre-#243 manager frame (09-15 .. 09-21 `77e7e97515`) has it at 54x43, x 55..108, y 306..348, and the fifteenth matches those. The 1,033-pixel difference against the fifth cut's NES frame in `measure-250-aa8d525a8a.txt` is the fifth cut's own distortion, not a regression.
- **Docs** (`b26f214a56` on `next`): `docs/qa-frames/2026-09-23/250-*` five frames + README section; work-log entries 05:05 and 05:20; the change log's #250 line; the 09-22 #245 decision entry that had been left uncommitted.
- **#251 filed** (the sign-in banner's font is RetroArch's message-queue 20 against the achievement banner's 32; options for the maintainer).

## In Progress

- **The RG35XX SP runs the seventeenth cut `443028ff7a`** (staged 02:20 UTC, rebooted 02:21 on the maintainer's yes, up 02:27, queue empty). The walk baseline is run 23's frames (`walk-baseline/BASELINE.txt`, build 443028ff7a). The maintainer's boxes on it: #251, #209, #198, #250, #249, #245, #246, #243.
- **The milestone audit** runs in a background Fable agent (launched 02:03; `docs/audits/2026_09_24-milestone-rc-round-since-186/`). When it returns: verify leads, `tools/lint-audit-artifacts`, the Phase 6 issue, resolve every item (an eighteenth cut if code changes; VM first), Phase 7 outcomes from commands. Council second opinions once Phase 2 exists.
- #257 filed (the staging as a tool in the tree; a dated file name cost a no-op copy).

## Next Steps

1. On `chain-17.done`: RECORD.txt's VMQA_RESULT; the QA row for `443028ff7a` (runs 32/21, vm-qa 23, rehearsal 18); the sixteenth's RECORD marked superseded; commit/push; ask the maintainer for the copy and the reboot of the RG35XX SP (D-QA-011). On the yes: `stage-rg35xxsp-443028ff7a.sh`, then the reboot through `tools/device-act`; BUILD_ID + empty queue; `tools/frame-diff accept <run23>/walks walk-baseline --build 443028ff7a` once on the device; RECORD, QA row, #236 box, work log.
2. **The code audit** with the `code-auditor` skill (Milestone tier: the work since #186, 2026-09-14 -> the seventeenth cut), comment quality in scope; audit agents on Fable 5.1 (memory `audit-subagents-run-on-fable`); `tools/lint-audit-artifacts` before its Phase 6; the punch list fixed at every severity (D-WORKFLOW-015) and tested on the VM before any device build (D-WORKFLOW-016). Also the retro due ~09-26 and the 2026-W39 summary by 09-29 (`tools/ceremony-check`).
3. **Every session**: `tools/ceremony-check` first; `tools/archaeology <terms>` before anything is called pending; a friction line when something slows; `tools/work-log-index --write` after a log entry. Never edit a shell tool while a run of it is in flight. A stem measurement compares the same text span on every size.
4. The maintainer's device boxes on the seventeenth: #251 (the toast reads), #209 (the save shortcut), #198 (a password with a space), #250, #249, #245, #246, #243; then the RG SP (D-QA-031), the Nova. #252 box 3b; #253's four-week box; #255, #256 later; #42 (docs) before the upstream PRs.

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
