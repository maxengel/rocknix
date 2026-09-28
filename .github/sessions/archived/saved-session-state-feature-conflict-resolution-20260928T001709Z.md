# Saved Session State

> **Saved**: 2026-09-27T22:55:00Z
> **Branch**: feature/conflict-resolution (the session worktree; the work is on `next` at `9d3615430a` and `feature/rc-device-fixes`)
> **Repo**: maxengel/rocknix (fork of ROCKNIX/distribution)

## Current Focus

The release-candidate round (#236). The RG35XX SP runs `d39ccdfff3` since 22:02 UTC. The maintainer's play-testing on it gave three notes, all built and in one round now: #304 the sync card's transfer line (D-UI-108), #305 saves first at the link's return with the send card taking its own stamp (D-UI-109; the third card was the send card twice), #306 the wake check reading RetroArch 1.22's history under `playlists/builtin/` (D-RA-038; it never ran on the device). chain-85 from `7911c53bb4` (ES `7eae8ed91`; chain-84's x64 build failed at the link, batch() in the wrong namespace): x64 run 85 started 22:47 UTC, then H700 run 63, vm-qa 67, proof-298 (phase B checks saves first; phase C touches the `builtin/` history). On green: the frames, the records, the three issues ticked, then the maintainer's yes for the copy and the reboot (`stage-*-7911c53bb4.sh` refuse until their words replace `YES_QUOTE_NOT_GIVEN`; the label is double-quoted). Blindspot 65 records why the two came back from the device (a shim that stamps at once; a fixture path the device never writes).

## Completed This Session

- #298 closed (the three card notes) on `c9f5aa7de0`; #300 filed and fixed (the stall bound on the hash-library fetch, the hasher's own toast and marker, one index attempt per reload); #301 filed (the fetch off the interface thread, follow-up); D-RA-036, D-UI-105, blindspot 64, `es-code-traps.md` § A pooled connection with the link gone, `engineering-practices.md` § masking read.
- ES commits on `test/qa-integration`: `9202ebed5`, `636065877`, `341d0515a` (pin `341d0515a85f375a2070b8629bad51115d5efbab` on next). ctl: `index-offline`, the marker inside the half hour; suite 384 PASS.
- Records: `x64-all-20260927-c9f5aa7de0`, `h700-all-20260927-af523c33a7` (on the device), `*-48f940aa06` and `*-9e9a9eda81` as superseded; catalog 67 cuts; device fact row updated.

## In Progress

- chain-85 (`/workspace/tmp/rocknix-session/chain-85.sh`, pid 1922823, `chain-85.status`, `chain-85.rc` when done); Monitor armed on its milestones.

## Next Steps

1. Read `chain-85.rc` and proof-298's verdict; on a FAIL read the guest's log and the frames first (blindspot 64). Then `python3 records-7911c53bb4.py`, `tools/release-catalog --write`; frames: the sync card mid-transfer (vm-qa's round trip or proof A/B `B-link` frames) and the phase-B order (the saves card, then the RetroAchievements cards) to `docs/qa-frames/2026-09-27/30[456]-*`; the change log's bullets for #304/#305/#306 (not yet written: the change log is written against the build); tick #304/#305/#306; commit/push; ask the maintainer for a yes; put their words into `stage-and-reboot-7911c53bb4.sh` (double-quoted LABEL) and run it; device facts, records' Device lines, #236, close the three, work log, stash.
2. Then the maintainer's play-testing and the soak (step 4), the call (5), the audit (6), the PRs and the other devices (7-8). #303's second half (the settings pages' rows) if wanted. #301 (the fetch off the interface thread) and #278 (harness debts: measure-toast.py, a frame-text check, one sync per chain, the proof's shim matching the real proxy's stamp delay and a real game launch for the history) remain.

## Key Files Modified

| File | Change | Notes |
| --- | --- | --- |
| `projects/ROCKNIX/packages/network/raofflineproxy/sources/raofflineproxy-ctl` | Modified | `index-offline`; the interval guard yields to `index-pending` |
| `projects/ROCKNIX/packages/ui/emulationstation/package.mk` | Modified | pin `341d0515a` |
| `tools/last-good-scripts-test` | Modified | three cases (the verb; the marker inside the half hour; without it) |
| ES `es-core/src/HttpReq.{h,cpp}`, `es-app/src/{ThreadedHasher,ProxyCards,OfflineAchievements,RetroAchievements}.cpp`, `views/ViewController.cpp`, `locale/lang/fr/...po` | Modified | the stall bound, the toast and marker, one attempt per reload, the sentence that fits |
| `docs/decision-register.md`, `docs/blindspot-register.md`, `.claude/rules/{es-code-traps,es-player-text,engineering-practices}.md`, `docs/cloud-sync-changelog.md`, `docs/releases/{device-facts,catalog}.md`, `docs/vm-qa-log.md`, `docs/friction-log.md`, `docs/work-logs/2026_09-work_logs/2026_09_25-work_log.md` | Modified | the round's records |

## Related Context

- **Tracker**: #236 (the round), #304/#305/#306 (built, in chain-85), #303 (the card sweep; the settings pages' rows not read), #301 (follow-up), #278 (harness debts); #298, #299, #300, #302 closed.
- **Session tools**: `/workspace/tmp/rocknix-session/` -- `proof-298.sh` (phase E grades the hasher's line, the marker, the listing inside the half hour, no re-index; frames 25 s past the toast), `measure-toast.py FONT PX STRING...`, `records-*.py`, `chain-8N.sh`, `stage-*.sh`.

## Notes for Next Session

- Guest d is on the chain's latest image (port 10026, monitor `/tmp/rocknix-qemu-monitor-d.sock`); ssh with `/tmp/rocknix-vm-pair/qa-key`. A read of a log whose lines are the evidence uses the masking `sed`, not the dropping `grep -v` (the reboot's device-act lines "went missing" three times because the label quoted "passing build").
- A chain syncs once at its start; `chain-8N.sh` still carries a second `merge --ff-only next` before the H700 build -- drop it in the next template, and never commit to `next` between a chain's sync and its last image (the twins' ids split otherwise).
- A work-log heading's time comes from `date -u`, never an estimate (three headings drifted an hour on 2026-09-27).
- `tools/es-syntax-check` is not the linker: a function referenced across namespaces passed it and failed the link (run 84).
- A device-act label that quotes the maintainer goes in double quotes (`LABEL="...\"<words>\""`): apostrophes in their words cut a single-quoted label and the reboot of 21:44 ran nothing.
- chain-8N scripts from chain-83 on sync once at their start (the second `merge --ff-only next` before the H700 build is gone); never commit to `next` between a chain's sync and its last image.
- `tools/rc-preflight` needs `--allow-unchecked device-facts` (no tool reads the facts yet, #270); the `Already written` item reads a `Code trace` heading plus an `Already written:` line at a line's start in the issue (body or comments).

## Open Questions

- The yes for `7911c53bb4` on the RG35XX SP once chain-85 is green and its frames are read.
- Whether #303's second half (the settings pages' rows) is wanted before the call.
