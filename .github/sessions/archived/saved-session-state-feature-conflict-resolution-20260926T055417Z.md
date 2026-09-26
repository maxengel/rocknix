# Saved Session State

> **Saved**: 2026-09-26T04:20:48Z
> **Branch**: feature/conflict-resolution (worktree `/workspace/repos/rocknix.worktrees/conflict-resolution`; the record lives on `next` in `/workspace/repos/rocknix`, pushed to `origin/next`)
> **Repo**: maxengel/rocknix (fork of ROCKNIX/distribution)

## Current Focus

The release-candidate round (D-QA-049, `release-candidates.md`, D-WORKFLOW-047). The candidate rebuilt with #288, **`3f93dc4683`**, is proven on the VM (vm-qa run 42, the five proofs, the FBNeo table case, rehearsal run 31) and **on the RG35XX SP since 2026-09-26 04:17 UTC** (staged and rebooted on the maintainer's two yeses; boot id 490ccd51). #288 is closed; `rc-preflight` reads MAY BE CUT (unchecked by tool: device facts) on next. The soak (D-QA-036) and the look at Dr. Mario's and F-Zero's captures are the maintainer's; then the call (step 5) on #236; then the audit (step 6) through the Facilitator on OpenRouter.

## Completed This Session (2026-09-26, after 02:20 UTC)

- #288 filed in the maintainer's words with the device reads (three records `turns=3`, no launch since the boot); the fix in ES (`5644752aa`, 126 unit tests), the pin (`3f93dc4683`), vm-qa's fixture writing the marked record; the code trace with its `Already written` line.
- The defect reproduced on guest d (`proof-288-d`: the old record turns the tile, the mark on the bottom; the exit heals it by play): frames filed in `docs/qa-frames/2026-09-26/` (`288-*`), README section.
- #289 (D-WORKFLOW-050): `tools/rc-preflight` `already written` item (open bugs with a trace and bugs closed completed since 2026-09-26 02:45 UTC must carry `Already written:`), proven FAIL then PASS on #288; `upgrade-and-install.md` new section, `release-candidates.md` step 0, `issue-tracking.md` closing discipline; blindspot 62; work log 03:05 UTC; next `e446f5a906`.
- Hygiene: #279 #280 #282 #283 closed with open checkboxes -- ticked with evidence or struck with the decision; code traces posted on #280 and #282 (with `Already written`); `ceremony-check --gate` passes (the step-6 audit still owed at the CI level).
- #236 comment: the rebuild and why; no device action until asked.

## In Progress

- **The soak on the RG35XX SP** (the maintainer's, on 3f93dc4683). Nothing runs on the device without a per-action yes; reads are free through the credential filter. Their observations go to #277.

## Next Steps

1. After the soak: the device reads (the journal, the stamps, the four rotation records rewritten with `from=own-launch` as the games are played), the call on #236 (step 5) with the device facts and the catalog in the same change (D-WORKFLOW-046).
2. Step 6: the audit through the Facilitator on OpenRouter (`docs/audits/2026_09_25-milestone-rc-round-since-258/`, uncommitted, paused at Phase 1.3; `. ~/.config/council/env && npx tsx tools/council/council-invoke.ts --member <seat> --provider openrouter ...`).
3. Steps 7-8: the PR series by content, #42's docs last; builds for the RG SP and the Retroid Pocket Nova (cold; `tools/build-preflight` first), each staged on its own yes.
4. Harness: promote the proof scripts into `tools/` (#278) -- `proof-288-stale-record.sh`, `proof-288-fbn.sh`, and the injected load-state key that a busy guest can miss (#249's chain-run flake); #286; #284; `tools/fork-worktree remove ../rocknix.worktrees/rc-device-fixes` when the round closes.
5. The step-6 audit is owed at the CI level (`ceremony-check`); #279 option 2's words remain the maintainer's to choose.

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
