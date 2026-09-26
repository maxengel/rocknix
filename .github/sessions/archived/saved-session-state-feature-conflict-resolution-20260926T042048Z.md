# Saved Session State

> **Saved**: 2026-09-26T03:07:07Z (refreshed from `date -u` when copied)
> **Branch**: feature/conflict-resolution (worktree `/workspace/repos/rocknix.worktrees/conflict-resolution`; the record lives on `next` in `/workspace/repos/rocknix`, pushed to `origin/next`)
> **Repo**: maxengel/rocknix (fork of ROCKNIX/distribution)

## Current Focus

The release-candidate round (D-QA-049, `release-candidates.md`, D-WORKFLOW-047). The device is on **`a8175c6193`** (since 02:15 UTC); the maintainer's first look found #288 (the rotation records #280 fixed stayed wrong until each game is replayed), fixed as D-UI-094 (ES `5644752aa`: a record says `from=own-launch`, an unmarked one is not trusted, the table stands in) and rebuilt as **`3f93dc4683`** (x64 run 57, H700 run 37, both images carry the string). `chain-9` (pid 852939, `chain-9.status`, a harness waiter on `chain-9.rc`) is on vm-qa run 42, then the five proofs (#288 first), the rehearsal from a8175c6193, guest d and the sign-in window. The process change the maintainer asked for is wired: every fix answers what was already written (D-WORKFLOW-050, #289, `rc-preflight`'s `already written` item, proven to fire).

## Completed This Session (2026-09-26, after 02:20 UTC)

- #288 filed in the maintainer's words with the device reads (three records `turns=3`, no launch since the boot); the fix in ES (`5644752aa`, 126 unit tests), the pin (`3f93dc4683`), vm-qa's fixture writing the marked record; the code trace with its `Already written` line.
- The defect reproduced on guest d (`proof-288-d`: the old record turns the tile, the mark on the bottom; the exit heals it by play): frames filed in `docs/qa-frames/2026-09-26/` (`288-*`), README section.
- #289 (D-WORKFLOW-050): `tools/rc-preflight` `already written` item (open bugs with a trace and bugs closed completed since 2026-09-26 02:45 UTC must carry `Already written:`), proven FAIL then PASS on #288; `upgrade-and-install.md` new section, `release-candidates.md` step 0, `issue-tracking.md` closing discipline; blindspot 62; work log 03:05 UTC; next `e446f5a906`.
- Hygiene: #279 #280 #282 #283 closed with open checkboxes -- ticked with evidence or struck with the decision; code traces posted on #280 and #282 (with `Already written`); `ceremony-check --gate` passes (the step-6 audit still owed at the CI level).
- #236 comment: the rebuild and why; no device action until asked.

## In Progress

- **chain-9** (started 02:54 UTC): vm-qa run 42 (~29 min), proofs (`proof-288-stale-record.sh` on guest a expects the mark on the RIGHT with the old record and `turns=0 from=own-launch` after the exit), rehearsal run 31, guest d rebuild + signin.
  - **What remains after it**: RECORD.txt for `x64-all-20260926-3f93dc4683` and `h700-all-20260926-3f93dc4683` (template: a8175c6193's), `tools/release-catalog --write`, the QA-log row, the changelog's cut entry, the `288-*` "after" frames + README; close #288 on the VM proof (tick its checkboxes with the artifacts); mark a8175c6193's records SUPERSEDED once 3f93dc4683 is staged; then ask the maintainer for the copy and the reboot (D-QA-011/015), each a yes.

## Next Steps

1. When `chain-9.rc` lands: read `chain-9.log`, `proof-288.log`, the vm-qa report dir, the rehearsal RESULT; the records above; close #288; `rc-preflight` (expect MAY BE CUT once #288 is closed); ask for the copy and the reboot of 3f93dc4683.
2. After the maintainer's soak: the device reads (filtered), the call on #236 (step 5) with the device facts and the catalog in the same change.
3. Step 6: the audit through the Facilitator on OpenRouter (`docs/audits/2026_09_25-milestone-rc-round-since-258/`, uncommitted, paused at Phase 1.3).
4. Steps 7-8: the PR series by content, #42's docs last; builds for the RG SP and the Retroid Pocket Nova.
5. Harness: promote the proof scripts into `tools/` (#278) -- `proof-288-stale-record.sh` included; #286; #284; `tools/fork-worktree remove ../rocknix.worktrees/rc-device-fixes` when the round closes.

## Key Files Modified

| File | Change | Notes |
| --- | --- | --- |
| ES `es-app/src/CaptureRotation{,Text}.{cpp,h}`, `tests/unit/CaptureRotationTextTests.cpp` | Modified | `from=own-launch`; `recordFromOwnLaunch`; unmarked -> table; rewrite on exit (#288) |
| `projects/ROCKNIX/packages/ui/emulationstation/package.mk` | Modified | pin `5644752aac74585645525712821ec2d4c623f09f` |
| `tools/vm-qa` | Modified | the manager fixture's NES record carries the line |
| `tools/rc-preflight` | Modified | `already written` item (#289) |
| `.claude/rules/{upgrade-and-install,release-candidates,issue-tracking}.md` | Modified | D-WORKFLOW-050 |
| `docs/decision-register.md`, `docs/blindspot-register.md`, work log, `docs/qa-frames/2026-09-26/` | Modified | D-UI-094, D-WORKFLOW-050, blindspot 62, the 03:05 entry, the 288 frames |

## Related Context

- **Tracker**: #236 (the round), #288, #289, #277/#278, #284-#287, #270, #42.
- **Register**: D-UI-094, D-WORKFLOW-050, D-LAUNCH-004 (its heal clause superseded), D-UI-081/082, D-QA-049/050/051.
- **Session files**: `/workspace/tmp/rocknix-session/` (chain-9.*, proof-288-stale-record.sh, proof-288-d{,-run1}/, rc-preflight-289-{before,after}.txt, issue-bodies/).
- **Guests**: the pair up under vm-qa run 42 (a :10022, b :10023); guest d on a8175c6193 (:10026) until the chain rebuilds it.
- **Device**: RG35XX SP on a8175c6193 (boot 2ea54cb6); reads only, through `grep -v -i -E 'key|pass|token|user|psk'`.

## Notes for Next Session

- A record older than ES `5644752aa` reads `turns=N` alone; the fixed reader ignores it in favour of the table. `tools/vm-qa`'s fixture and any proof seeding a record must write `from=own-launch` on its own line.
- `proof-288-stale-record.sh` measures the fixture's green mark against the picture's blue ground; RetroArch's own auto save replaces the fixture picture at every exit, so the picture is re-seeded before the second walk.
- `rc-preflight`'s `bugs` item reads #288 open without a disposition until it is closed; that is correct.

## Open Questions

- The copy and the reboot of 3f93dc4683 on the RG35XX SP (each a yes), once the chain has passed.
- Words for the `(+)` on the IP ADDRESS row (#279 option 2), if wanted.
