# Saved Session State

> **Saved**: 2026-09-27T19:22:00Z
> **Branch**: feature/conflict-resolution (the session worktree; the work is on `next` at `9d3615430a` and `feature/rc-device-fixes`)
> **Repo**: maxengel/rocknix (fork of ROCKNIX/distribution)

## Current Focus

The release-candidate round (#236). `c9f5aa7de0` (H700 id `af523c33a7`) is on the RG35XX SP since 19:05 UTC on the maintainer's yes of 18:38 UTC. One more cut, `ed0fc38a22` (ES `341d0515a`: the offline-index toast cut to fit 640x480, D-UI-105), is in chain-81 (x64 run 81 and H700 run 59 built; vm-qa 63 then proof-298 running). It goes to the device only on a yes of its own.

## Completed This Session

- #298 closed (the three card notes) on `c9f5aa7de0`; #300 filed and fixed (the stall bound on the hash-library fetch, the hasher's own toast and marker, one index attempt per reload); #301 filed (the fetch off the interface thread, follow-up); D-RA-036, D-UI-105, blindspot 64, `es-code-traps.md` § A pooled connection with the link gone, `engineering-practices.md` § masking read.
- ES commits on `test/qa-integration`: `9202ebed5`, `636065877`, `341d0515a` (pin `341d0515a85f375a2070b8629bad51115d5efbab` on next). ctl: `index-offline`, the marker inside the half hour; suite 384 PASS.
- Records: `x64-all-20260927-c9f5aa7de0`, `h700-all-20260927-af523c33a7` (on the device), `*-48f940aa06` and `*-9e9a9eda81` as superseded; catalog 67 cuts; device fact row updated.

## In Progress

- chain-81 (`/workspace/tmp/rocknix-session/chain-81.sh`, pid 231841, `chain-81.status`, `chain-81.rc` when done): vm-qa run 63, then proof-298 on guest d.
  - **What remains**: on green -- `python3 records-ed0fc38a22.py`, `tools/release-catalog --write`, the toast frame (E-offline frames after the `the index ran offline` line; verify the sentence is whole) to `docs/qa-frames/2026-09-27/300-offline-index-toast-ed0fc38a22-640x480.png` + README row, commit/push, tick #299's and #300's last checkboxes, close #299 and #300, ask the maintainer for a yes for the copy and the reboot of `ed0fc38a22` (the scripts `stage-and-reboot-ed0fc38a22.sh` / `stage-rg35xxsp-ed0fc38a22.sh` refuse until `YES_QUOTE_NOT_GIVEN` is replaced by their words), then device facts, records' Device lines, #236 comment, work log, `tools/rc-preflight` (expect: bugs PASS once #300 closes; device facts by hand).

## Next Steps

1. Read `chain-81.rc` and proof-298's `=== done`; if a FAIL, read the guest's `/var/log/es_log.txt` and the frames before touching the proof's waits (blindspot 64).
2. Records + frame + issues as above; ask the yes; stage on it.
3. Then the round's step 5 (the call on #236), step 6 (the two-agent audit through the Facilitator on OpenRouter; `docs/audits/2026_09_25-milestone-rc-round-since-258/` paused at Phase 1.3), steps 7-8.

## Key Files Modified

| File | Change | Notes |
| --- | --- | --- |
| `projects/ROCKNIX/packages/network/raofflineproxy/sources/raofflineproxy-ctl` | Modified | `index-offline`; the interval guard yields to `index-pending` |
| `projects/ROCKNIX/packages/ui/emulationstation/package.mk` | Modified | pin `341d0515a` |
| `tools/last-good-scripts-test` | Modified | three cases (the verb; the marker inside the half hour; without it) |
| ES `es-core/src/HttpReq.{h,cpp}`, `es-app/src/{ThreadedHasher,ProxyCards,OfflineAchievements,RetroAchievements}.cpp`, `views/ViewController.cpp`, `locale/lang/fr/...po` | Modified | the stall bound, the toast and marker, one attempt per reload, the sentence that fits |
| `docs/decision-register.md`, `docs/blindspot-register.md`, `.claude/rules/{es-code-traps,es-player-text,engineering-practices}.md`, `docs/cloud-sync-changelog.md`, `docs/releases/{device-facts,catalog}.md`, `docs/vm-qa-log.md`, `docs/friction-log.md`, `docs/work-logs/2026_09-work_logs/2026_09_25-work_log.md` | Modified | the round's records |

## Related Context

- **Tracker**: #236 (the round), #299 (open: the toast frame), #300 (open: the toast frame), #301 (follow-up), #278 (harness debts: `measure-toast.py`, a frame-text check, one sync per chain), #298 closed.
- **Session tools**: `/workspace/tmp/rocknix-session/` -- `proof-298.sh` (phase E grades the hasher's line, the marker, the listing inside the half hour, no re-index; frames 25 s past the toast), `measure-toast.py FONT PX STRING...`, `records-*.py`, `chain-8N.sh`, `stage-*.sh`.

## Notes for Next Session

- Guest d is on the chain's latest image (port 10026, monitor `/tmp/rocknix-qemu-monitor-d.sock`); ssh with `/tmp/rocknix-vm-pair/qa-key`. A read of a log whose lines are the evidence uses the masking `sed`, not the dropping `grep -v` (the reboot's device-act lines "went missing" three times because the label quoted "passing build").
- A chain syncs once at its start; `chain-8N.sh` still carries a second `merge --ff-only next` before the H700 build -- drop it in the next template, and never commit to `next` between a chain's sync and its last image (the twins' ids split otherwise).
- The maintainer's yes of 18:38 UTC was for the fully tested build and was spent on `c9f5aa7de0`; `ed0fc38a22` needs its own.
- `tools/rc-preflight` at `9d3615430a`: bugs FAIL (#300 open), device facts CANNOT (read by hand).

## Open Questions

- The yes for `ed0fc38a22` on the RG35XX SP (the copy and the reboot), once vm-qa 63 and the proof pass.
