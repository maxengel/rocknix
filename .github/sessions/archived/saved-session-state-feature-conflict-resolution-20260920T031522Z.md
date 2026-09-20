# Saved Session State

> **Saved**: 2026-09-18T01:35:49Z
> **Branch**: feature/conflict-resolution (this worktree holds only the session state; the work is on `next` and in the ES repo)
> **Repo**: maxengel/rocknix -- primary checkout /workspace/repos/rocknix on `next` (dd4d55654a, pushed); ES ~/Development/emulationstation-next, build branch `test/qa-integration` at `fb6947fb4` (pushed, pinned as build 16); ES feature worktrees `manager-no-flash`, `card-compare-words`, `french-sweep`, `transfer-compare-words`, `help-row` (all merged); distribution feature worktree `/workspace/repos/rocknix.worktrees/build11-flash`

## Current Focus

**Build 15 `b245fd12ac` is on the RG SP; build 16 `6168c7c49a` is built, proven on the VM and not staged.** The maintainer's round on build 15 produced four notes, all handled: the deletion flash confirmed fixed (#207 closed with #205 and #206), the French needing no device look (#152 closed), the save-state hotkey read from the code and confirmed on the device (#209, open, needs their decision), and the help bar fixed and measured (#210, only its device box open). A crash they hit on FBNeo is read end to end and filed (#211). **Nothing is in flight; nothing is queued for the device.**

## Completed This Session (2026-09-17 02:26 -> 2026-09-18T01:35:49Z)

- **#207, #208** filed from their words, fixed, proven, registered (D-UI-074, D-UI-075); **#205, #206, #207** closed on their confirmation (*"deletes worked as expected without the screen redraw issue"*); **#162, #164, #102, #115, #152** closed as delivered.
- **#152**: French for all 661 fork strings, `tools/es-untranslated`, the `french` suite in the runner, the hub row's line fitting 640x480.
- **#210**: the help bar's two defects (an ungated SAVE STATES prompt; the row centred on a box including the prompt it dropped) fixed in ES `7dc8bf373` and measured: the French game list went 1 / 139 px -> 70 / 71, 1280x800 reads 118 / 118 EN and 255 / 256 FR, and a list where save states cannot apply no longer offers them. `measure-helprow.py` is the check.
- **#209**: the chain read end to end (ES passes the launched slot; `setsettings.sh` writes `state_slot` and emits `-e N`; RetroArch's entry slot makes it current, then increments before every save). Confirmed on the device: `savestate_auto_index = "true"`, `global.incrementalsavestates` empty (INCREMENT PER SAVE), `savestate_max_keep` written empty. Two defects named, nothing changed.
- **#211**: RetroArch segfaulted 8 ms after the badge GET that follows the second offline award (full timeline, device local, in the issue); both awards were queued and flushed successfully at 21:10, so the achievements survived and the session did not; no cloud sync was involved (the exit capture started 0.5 s **after** the fault). The code reading corrected the direction: cache badges while online rather than fake them, and route a second achievement in `tools/ra-offline-test` before a two-award session can be driven. #79 entry 2 carries the verdict.
- **Builds 11-16** (x64 + H700), all suites PASSED; artifacts under `/workspace/artifacts/rocknix-images/{x64,h700}-all-2026091{7,8}-<id>/`. **Build 16 H700 tar sha `74ba9d304c6e5d6a2f28746697cc5e9731e4e5e0b5d2c2b85fd7498dd5aed517`, 1,304,320,000 bytes.**
- **Records**: QA rows 11-16; work logs 2026-09-17 (02:58 -> 20:50, eighteen entries) and 2026-09-18 (00:20 -> 01:35); register D-UI-074/075, D-QA-027/028 (the RG35XX SP as QA handheld; SM8550 after the RC); frames `206-*`, `207-*`, `208-*`, `152-*`, `157-*`, `67-*`, `210-*`.

## In Progress

- Nothing is running. The device is on build 15, idle, and reachable.

## Next Steps

1. **The maintainer's decisions**: whether build 16 goes to the device (two questions, D-QA-011 then D-QA-015); #209's modes (what INCREMENT PER SAVE and DO NOT INCREMENT should promise, and the legacy `0`); whether the FAVORITE prompt gets #210's treatment.
2. **#211's reproduction**, when they want it: a VM-only `core_pattern` change, a second routed achievement in `tools/ra-offline-test`, then the proxy caching badges while online (which also removes #199's stall).
3. The rest of their build-15 round: #200's list, #210's device box, #157 box 3.
4. Then the RC's remaining tail: the fifteen fixed-awaiting closures, rocknix.org (#42, #191/#201, #196, #203), and the SM8550 build for the Nova (D-QA-028).

## Key Files Modified (this session)

| File | Change | Notes |
| --- | --- | --- |
| ES `GuiSaveState.{h,cpp}`, `SaveStateBookkeeper.{h,cpp}`, `SaveStateRepository.cpp` | Modified | #207 |
| ES `CloudText.{h,cpp}`, `ThreadedCloudSync.{h,cpp}`, `CloudTextTests.cpp` | Modified | #208 |
| ES `locale/.../emulationstation2.po` (+494), `GuiMenu.cpp`, `GuiCloudTransfer.cpp` | Modified | #152, #157 |
| ES `views/gamelist/ISimpleGameListView.cpp`, `es-core/src/components/HelpComponent.cpp` | Modified | #210 |
| `tools/es-untranslated`, `tools/vm-qa` (the `french` suite), `.githooks/pre-push`, `fork-workflow.md` | Created/Modified | #152 |
| `projects/ROCKNIX/packages/ui/emulationstation/package.mk` | Modified | pin `fb6947fb41…` (build 16) |
| `docs/decision-register.md`, `docs/vm-qa-log.md`, two work logs, `docs/qa-frames/2026-09-1{7,8}/` | Modified | rows, entries, frames |

## Related Context

- **Tracker**: #209, #210 (device box), #211, #79 (entry 2), #200, #157 (box 3), #104 (the crash test on the QA handheld), #131 (box 2), #150 (SM8550), #11 epic.
- **Device record**: `/workspace/artifacts/rocknix-device-actions.log` -- 20:12-20:27 staged build 15, 20:30 reboot, RETURNED 20:32 on `b245fd12ac`; 01:08 and 01:12 (2026-09-18) read-only reads of the crash evidence and the save-state settings. The device power-cycled on its own account at 20:32 device local (boot `7d13b9e0`).
- **Session scripts**: `/workspace/tmp/rocknix-session/` -- `rgsp-idle.sh`, `rgsp-crash-read.sh` (+ `-wait`), `stage-rgsp-run-<id>.sh` (QUOTE-gated), `rgsp-after-reboot.sh`; `manager-no-flash/` (`upgrade-d.sh`, `flash-check.py`, `hold.py`, proofs); `french-sweep/` (`measure-helprow.py`, `po_append.py`, batches, `fr-frames.sh`, `capture-b.sh`, `lib-b.sh`, chains for builds 14-16); the crash evidence at `rgsp-crash-20260917.log`.

## Notes for Next Session

- **Guest d** (`:10026`) and **guests a/b** are on build 16, English; guest d holds the QA ScreenScraper account in `es_settings.cfg` and remembers NES only in the scraper. Guest e is a 640x480 spare on RC-6.
- **The help row is measurable**: `measure-helprow.py <monitor.sock> <label>` reports the lit columns of the bottom bar, so "off-centre" is a number. Compare the same row before and after, never two different rows -- my first "before" was the carousel because a swallowed key left the guest where it was.
- **The crash evidence recipe** is #79's: `exec.log` dies at the next launch, so read it first; the journal is persistent; `core_pattern=|/bin/false` means no dump exists; busybox `find` has no `-newermt` (stat + awk).
- **A display mask that rewrites `<redacted>` hides a redaction** -- count the placeholder on the source before reading a leak (the ScreenScraper false alarm).
- Commits: `git -c user.name="Max Engel" -c user.email="max@awecelot.com"`, trailers `Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>` (changed mid-session from Fable 5.1) and `Claude-Session: https://claude.ai/code/session_01LkFLXE5GsT1apn8AwrxrGR`; register append-only (`tools/register-check` with ES_SRC); docs on `feature/build11-flash` then `git -C /workspace/repos/rocknix merge --ff-only` + push; never `cd` into the primary; session state committed from this worktree.

## Open Questions

- Does build 16 go to the RG SP, and when? (Two answers: the transfer, then the reboot.)
- #209: what should INCREMENT PER SAVE and DO NOT INCREMENT each promise, and what happens to a legacy `0`?
- #210: does the FAVORITE prompt get the same honesty treatment as SAVE STATES?
- #211: reproduce on the VM now (a core-pattern change and a second routed achievement), or wait and see whether it recurs?
