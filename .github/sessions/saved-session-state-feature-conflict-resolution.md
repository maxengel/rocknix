# Saved Session State

> **Saved**: 2026-09-27T20:00:00Z
> **Branch**: feature/conflict-resolution (the session worktree; the work is on `next` at `9d3615430a` and `feature/rc-device-fixes`)
> **Repo**: maxengel/rocknix (fork of ROCKNIX/distribution)

## Current Focus

The release-candidate round (#236). `ed0fc38a22` (ES `341d0515a`, pin `341d0515a85f375a2070b8629bad51115d5efbab`) is on the RG35XX SP since 19:53 UTC on the maintainer's yes of 19:43 UTC ("My approval, both for the copy and for the reboot"); it carries #298, #299, #300 and D-UI-105 over this morning's `9a64a4ad8f`. Proven on the VM (vm-qa 63 all suites, proof-298 35/35); `tools/rc-preflight --allow-unchecked device-facts` reads MAY BE CUT at `58ea505cd3`. Next is step 4 of `release-candidates.md`: the maintainer's play-testing and the soak; then the call on #236 (step 5), the two-agent audit (step 6), the PRs and the other devices (7-8).

## Completed This Session

- #298 closed (the three card notes) on `c9f5aa7de0`; #300 filed and fixed (the stall bound on the hash-library fetch, the hasher's own toast and marker, one index attempt per reload); #301 filed (the fetch off the interface thread, follow-up); D-RA-036, D-UI-105, blindspot 64, `es-code-traps.md` § A pooled connection with the link gone, `engineering-practices.md` § masking read.
- ES commits on `test/qa-integration`: `9202ebed5`, `636065877`, `341d0515a` (pin `341d0515a85f375a2070b8629bad51115d5efbab` on next). ctl: `index-offline`, the marker inside the half hour; suite 384 PASS.
- Records: `x64-all-20260927-c9f5aa7de0`, `h700-all-20260927-af523c33a7` (on the device), `*-48f940aa06` and `*-9e9a9eda81` as superseded; catalog 67 cuts; device fact row updated.

## In Progress

- Nothing running. Guest d is on `ed0fc38a22` (port 10026); guests e/f/g down. No build in flight.

## Next Steps

1. Read the maintainer's play-testing on `ed0fc38a22` (their words go to fork issues the same session, D-QA-012); after the soak (hours offline, then Wi-Fi back, D-QA-036), read the device's journal for it (reads only, through the masking `sed`).
2. The call on #236 (step 5): the build, the soak's read, step 0's verdict (`tools/rc-preflight`); the device facts and the catalog in the same change.
3. Step 6: the two-agent audit through the council's Facilitator on OpenRouter (`docs/audits/2026_09_25-milestone-rc-round-since-258/` paused at Phase 1.3; `~/.config/council/env` sourced first, never printed); its punch list resolved before step 7.
4. Steps 7-8: the PR series by content (`fork-workflow.md`, D-WORKFLOW-034), rocknix.org last (#42); builds for the RG SP and the Retroid Pocket Nova, each staged and rebooted on its own yes.

## Key Files Modified

| File | Change | Notes |
| --- | --- | --- |
| `projects/ROCKNIX/packages/network/raofflineproxy/sources/raofflineproxy-ctl` | Modified | `index-offline`; the interval guard yields to `index-pending` |
| `projects/ROCKNIX/packages/ui/emulationstation/package.mk` | Modified | pin `341d0515a` |
| `tools/last-good-scripts-test` | Modified | three cases (the verb; the marker inside the half hour; without it) |
| ES `es-core/src/HttpReq.{h,cpp}`, `es-app/src/{ThreadedHasher,ProxyCards,OfflineAchievements,RetroAchievements}.cpp`, `views/ViewController.cpp`, `locale/lang/fr/...po` | Modified | the stall bound, the toast and marker, one attempt per reload, the sentence that fits |
| `docs/decision-register.md`, `docs/blindspot-register.md`, `.claude/rules/{es-code-traps,es-player-text,engineering-practices}.md`, `docs/cloud-sync-changelog.md`, `docs/releases/{device-facts,catalog}.md`, `docs/vm-qa-log.md`, `docs/friction-log.md`, `docs/work-logs/2026_09-work_logs/2026_09_25-work_log.md` | Modified | the round's records |

## Related Context

- **Tracker**: #236 (the round), #301 (follow-up: the fetch off the interface thread), #278 (harness debts: `measure-toast.py`, a frame-text check, one sync per chain); #298, #299, #300 closed with their evidence.
- **Session tools**: `/workspace/tmp/rocknix-session/` -- `proof-298.sh` (phase E grades the hasher's line, the marker, the listing inside the half hour, no re-index; frames 25 s past the toast), `measure-toast.py FONT PX STRING...`, `records-*.py`, `chain-8N.sh`, `stage-*.sh`.

## Notes for Next Session

- Guest d is on the chain's latest image (port 10026, monitor `/tmp/rocknix-qemu-monitor-d.sock`); ssh with `/tmp/rocknix-vm-pair/qa-key`. A read of a log whose lines are the evidence uses the masking `sed`, not the dropping `grep -v` (the reboot's device-act lines "went missing" three times because the label quoted "passing build").
- A chain syncs once at its start; `chain-8N.sh` still carries a second `merge --ff-only next` before the H700 build -- drop it in the next template, and never commit to `next` between a chain's sync and its last image (the twins' ids split otherwise).
- Every yes was spent on the build it named; the next device action (any device) is asked for by name again.
- `tools/rc-preflight` needs `--allow-unchecked device-facts` (no tool reads the facts yet, #270); the `Already written` item reads a `Code trace` heading plus an `Already written:` line at a line's start in the issue (body or comments).

## Open Questions

- None pending on the maintainer; the round waits on their play-testing.
