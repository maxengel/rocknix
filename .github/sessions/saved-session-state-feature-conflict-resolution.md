# Saved Session State

> **Saved**: 2026-09-27T22:08:00Z
> **Branch**: feature/conflict-resolution (the session worktree; the work is on `next` at `9d3615430a` and `feature/rc-device-fixes`)
> **Repo**: maxengel/rocknix (fork of ROCKNIX/distribution)

## Current Focus

The release-candidate round (#236). The RG35XX SP runs `d39ccdfff3` since 22:02 UTC (ES `2178c9e6d`, pin `2178c9e6d1096c09685b20c321cd6955cf8f771b`): #298, #299, #300, #302 and #303's card sweep over this morning's `9a64a4ad8f`. Staged on the maintainer's conditional yes of 20:35 UTC and their retry word of 21:39 (the harness had refused the first launch; a first reboot attempt cut its label at an apostrophe and ran nothing). Next is step 4 of `release-candidates.md`: the maintainer's play-testing and the soak; then the call on #236 (5), the two-agent audit (6), the PRs and the other devices (7-8). Every yes so far was spent on the build it named; the next device action is asked for by name.

## Completed This Session

- #298 closed (the three card notes) on `c9f5aa7de0`; #300 filed and fixed (the stall bound on the hash-library fetch, the hasher's own toast and marker, one index attempt per reload); #301 filed (the fetch off the interface thread, follow-up); D-RA-036, D-UI-105, blindspot 64, `es-code-traps.md` § A pooled connection with the link gone, `engineering-practices.md` § masking read.
- ES commits on `test/qa-integration`: `9202ebed5`, `636065877`, `341d0515a` (pin `341d0515a85f375a2070b8629bad51115d5efbab` on next). ctl: `index-offline`, the marker inside the half hour; suite 384 PASS.
- Records: `x64-all-20260927-c9f5aa7de0`, `h700-all-20260927-af523c33a7` (on the device), `*-48f940aa06` and `*-9e9a9eda81` as superseded; catalog 67 cuts; device fact row updated.

## In Progress

- Nothing running. Guest d is on `d39ccdfff3` (port 10026). No build in flight.

## Next Steps

1. Read the maintainer's play-testing on `d39ccdfff3` (their words go to fork issues the same session, D-QA-012); after the soak, read the device's journal (reads only, masking `sed`).
2. The call on #236 (step 5): the build, the soak's read, `tools/rc-preflight --allow-unchecked device-facts` (MAY BE CUT at `58ea505cd3`; re-run at the head); the device facts and the catalog in the same change.
3. Step 6: the two-agent audit through the council's Facilitator on OpenRouter (`docs/audits/2026_09_25-milestone-rc-round-since-258/` paused at Phase 1.3); its punch list resolved before step 7.
4. Steps 7-8: the PR series by content, rocknix.org last (#42); builds for the RG SP and the Retroid Pocket Nova, each on its own yes.
5. #303's second half (the settings pages' rows and descriptions) if the maintainer wants it before the call.

## Key Files Modified

| File | Change | Notes |
| --- | --- | --- |
| `projects/ROCKNIX/packages/network/raofflineproxy/sources/raofflineproxy-ctl` | Modified | `index-offline`; the interval guard yields to `index-pending` |
| `projects/ROCKNIX/packages/ui/emulationstation/package.mk` | Modified | pin `341d0515a` |
| `tools/last-good-scripts-test` | Modified | three cases (the verb; the marker inside the half hour; without it) |
| ES `es-core/src/HttpReq.{h,cpp}`, `es-app/src/{ThreadedHasher,ProxyCards,OfflineAchievements,RetroAchievements}.cpp`, `views/ViewController.cpp`, `locale/lang/fr/...po` | Modified | the stall bound, the toast and marker, one attempt per reload, the sentence that fits |
| `docs/decision-register.md`, `docs/blindspot-register.md`, `.claude/rules/{es-code-traps,es-player-text,engineering-practices}.md`, `docs/cloud-sync-changelog.md`, `docs/releases/{device-facts,catalog}.md`, `docs/vm-qa-log.md`, `docs/friction-log.md`, `docs/work-logs/2026_09-work_logs/2026_09_25-work_log.md` | Modified | the round's records |

## Related Context

- **Tracker**: #236 (the round), #302 (the offline notice card, open until its frame is posted), #303 (the card sweep; the settings pages' rows are not in this pass), #301 (follow-up), #278 (harness debts); #298, #299, #300 closed.
- **Session tools**: `/workspace/tmp/rocknix-session/` -- `proof-298.sh` (phase E grades the hasher's line, the marker, the listing inside the half hour, no re-index; frames 25 s past the toast), `measure-toast.py FONT PX STRING...`, `records-*.py`, `chain-8N.sh`, `stage-*.sh`.

## Notes for Next Session

- Guest d is on the chain's latest image (port 10026, monitor `/tmp/rocknix-qemu-monitor-d.sock`); ssh with `/tmp/rocknix-vm-pair/qa-key`. A read of a log whose lines are the evidence uses the masking `sed`, not the dropping `grep -v` (the reboot's device-act lines "went missing" three times because the label quoted "passing build").
- A chain syncs once at its start; `chain-8N.sh` still carries a second `merge --ff-only next` before the H700 build -- drop it in the next template, and never commit to `next` between a chain's sync and its last image (the twins' ids split otherwise).
- A device-act label that quotes the maintainer goes in double quotes (`LABEL="...\"<words>\""`): apostrophes in their words cut a single-quoted label and the reboot of 21:44 ran nothing.
- chain-8N scripts from chain-83 on sync once at their start (the second `merge --ff-only next` before the H700 build is gone); never commit to `next` between a chain's sync and its last image.
- `tools/rc-preflight` needs `--allow-unchecked device-facts` (no tool reads the facts yet, #270); the `Already written` item reads a `Code trace` heading plus an `Already written:` line at a line's start in the issue (body or comments).

## Open Questions

- Whether #303's second half (the settings pages' rows) is wanted before the call.
