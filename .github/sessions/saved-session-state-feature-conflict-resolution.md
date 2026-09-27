# Saved Session State

> **Saved**: 2026-09-27T22:55:00Z
> **Branch**: feature/conflict-resolution (the session worktree; the work is on `next` at `9d3615430a` and `feature/rc-device-fixes`)
> **Repo**: maxengel/rocknix (fork of ROCKNIX/distribution)

## Current Focus

The release-candidate round (#236). The RG35XX SP runs `d39ccdfff3` since 22:02 UTC. One change is built and pinned but not yet an image: #304 (ES `9d870eb81`, pin on `next` at `e649e339eb`), the sync card's transfer line `TRANSFERRING FILE n OF m (x OF y)` beside the bar (D-UI-108) -- the maintainer said "Generate a build yet, but ..." (read as: not yet), so the round for it (x64, H700, vm-qa with a transfer frame, proof) starts on their word. Then the maintainer's play-testing and the soak (step 4), the call on #236 (5), the audit (6), the PRs and the other devices (7-8). Every yes so far was spent on the build it named.

## Completed This Session

- #298 closed (the three card notes) on `c9f5aa7de0`; #300 filed and fixed (the stall bound on the hash-library fetch, the hasher's own toast and marker, one index attempt per reload); #301 filed (the fetch off the interface thread, follow-up); D-RA-036, D-UI-105, blindspot 64, `es-code-traps.md` § A pooled connection with the link gone, `engineering-practices.md` § masking read.
- ES commits on `test/qa-integration`: `9202ebed5`, `636065877`, `341d0515a` (pin `341d0515a85f375a2070b8629bad51115d5efbab` on next). ctl: `index-offline`, the marker inside the half hour; suite 384 PASS.
- Records: `x64-all-20260927-c9f5aa7de0`, `h700-all-20260927-af523c33a7` (on the device), `*-48f940aa06` and `*-9e9a9eda81` as superseded; catalog 67 cuts; device fact row updated.

## In Progress

- Nothing running. Guest d is on `d39ccdfff3` (port 10026). No build in flight.

## Next Steps

1. On the maintainer's word: chain-84 from the `next` head (derive from `chain-83.sh`: one sync at the start, x64 run 84, H700 run 62, vm-qa 66, proof-298), then a transfer frame of the sync card at 640x480 from the round-trip or the exit sync (proof phase A/B frames, or a walk) to `docs/qa-frames/`, tick #304, the change log's bullet, the records, and a staging on a yes of its own (`stage-*` scripts derived with the label in double quotes).
2. Then steps 4-8 as above; #303's second half (the settings pages' rows) if wanted.

## Key Files Modified

| File | Change | Notes |
| --- | --- | --- |
| `projects/ROCKNIX/packages/network/raofflineproxy/sources/raofflineproxy-ctl` | Modified | `index-offline`; the interval guard yields to `index-pending` |
| `projects/ROCKNIX/packages/ui/emulationstation/package.mk` | Modified | pin `341d0515a` |
| `tools/last-good-scripts-test` | Modified | three cases (the verb; the marker inside the half hour; without it) |
| ES `es-core/src/HttpReq.{h,cpp}`, `es-app/src/{ThreadedHasher,ProxyCards,OfflineAchievements,RetroAchievements}.cpp`, `views/ViewController.cpp`, `locale/lang/fr/...po` | Modified | the stall bound, the toast and marker, one attempt per reload, the sentence that fits |
| `docs/decision-register.md`, `docs/blindspot-register.md`, `.claude/rules/{es-code-traps,es-player-text,engineering-practices}.md`, `docs/cloud-sync-changelog.md`, `docs/releases/{device-facts,catalog}.md`, `docs/vm-qa-log.md`, `docs/friction-log.md`, `docs/work-logs/2026_09-work_logs/2026_09_25-work_log.md` | Modified | the round's records |

## Related Context

- **Tracker**: #236 (the round), #304 (the transfer line, built, no image yet), #303 (the card sweep; the settings pages' rows not read), #301 (follow-up), #278 (harness debts); #298, #299, #300, #302 closed.
- **Session tools**: `/workspace/tmp/rocknix-session/` -- `proof-298.sh` (phase E grades the hasher's line, the marker, the listing inside the half hour, no re-index; frames 25 s past the toast), `measure-toast.py FONT PX STRING...`, `records-*.py`, `chain-8N.sh`, `stage-*.sh`.

## Notes for Next Session

- Guest d is on the chain's latest image (port 10026, monitor `/tmp/rocknix-qemu-monitor-d.sock`); ssh with `/tmp/rocknix-vm-pair/qa-key`. A read of a log whose lines are the evidence uses the masking `sed`, not the dropping `grep -v` (the reboot's device-act lines "went missing" three times because the label quoted "passing build").
- A chain syncs once at its start; `chain-8N.sh` still carries a second `merge --ff-only next` before the H700 build -- drop it in the next template, and never commit to `next` between a chain's sync and its last image (the twins' ids split otherwise).
- A device-act label that quotes the maintainer goes in double quotes (`LABEL="...\"<words>\""`): apostrophes in their words cut a single-quoted label and the reboot of 21:44 ran nothing.
- chain-8N scripts from chain-83 on sync once at their start (the second `merge --ff-only next` before the H700 build is gone); never commit to `next` between a chain's sync and its last image.
- `tools/rc-preflight` needs `--allow-unchecked device-facts` (no tool reads the facts yet, #270); the `Already written` item reads a `Code trace` heading plus an `Already written:` line at a line's start in the issue (body or comments).

## Open Questions

- When to build the round for #304 (the maintainer's "not yet").
- Whether #303's second half (the settings pages' rows) is wanted before the call.
