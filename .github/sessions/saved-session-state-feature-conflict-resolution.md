# Saved Session State

> **Saved**: 2026-09-27T20:40:00Z
> **Branch**: feature/conflict-resolution (the session worktree; the work is on `next` at `9d3615430a` and `feature/rc-device-fixes`)
> **Repo**: maxengel/rocknix (fork of ROCKNIX/distribution)

## Current Focus

The release-candidate round (#236). `ed0fc38a22` is on the RG35XX SP since 19:53 UTC. Two cuts follow it, both from the maintainer's words of 20:0x-20:3x UTC: `463abbca2a` (#302, the offline-update notice as a card: RETROACHIEVEMENTS (OFFLINE) / NEWLY ADDED GAMES WILL BE ENABLED ONCE YOU RECONNECT.; chain-82, vm-qa 64 running then proof-298; built and proven but not staged, superseded by the next) and `d39ccdfff3` (#303, D-UI-107: every fork card's title names the thing and its line says what happened, no word twice; chain-83 waits for chain-82, then x64 run 83, H700 run 61, vm-qa 65, proof-298). The maintainer's yes of 20:35 UTC -- "once we've done the redundancy sweep and made sure the language in toasts and our screens is crisp, clear, and not too cold, you're good to both transfer and reboot the device" -- covers `d39ccdfff3` once its round is green and its frames are read; `stage-and-reboot-d39ccdfff3.sh` carries those words and has not run.

## Completed This Session

- #298 closed (the three card notes) on `c9f5aa7de0`; #300 filed and fixed (the stall bound on the hash-library fetch, the hasher's own toast and marker, one index attempt per reload); #301 filed (the fetch off the interface thread, follow-up); D-RA-036, D-UI-105, blindspot 64, `es-code-traps.md` § A pooled connection with the link gone, `engineering-practices.md` § masking read.
- ES commits on `test/qa-integration`: `9202ebed5`, `636065877`, `341d0515a` (pin `341d0515a85f375a2070b8629bad51115d5efbab` on next). ctl: `index-offline`, the marker inside the half hour; suite 384 PASS.
- Records: `x64-all-20260927-c9f5aa7de0`, `h700-all-20260927-af523c33a7` (on the device), `*-48f940aa06` and `*-9e9a9eda81` as superseded; catalog 67 cuts; device fact row updated.

## In Progress

- chain-82 (`463abbca2a`, pid 763971, `chain-82.status`): vm-qa 64 then proof-298 on guest d. Its phase E frame (the card alone) is #302's evidence.
- chain-83 (`d39ccdfff3`, pid 1113204, waits on `chain-82.rc`; `chain-83.rc` when done): the sweep's round. `records-d39ccdfff3.py` and the staging scripts are prepared.
  - **What remains**: on green -- the frames of every card from proof-298 (send card: phase B; top-up card: phase B/D; offline card: phase E; exit card offline: phase A) to `docs/qa-frames/2026-09-27/303-*` with README rows; read them for crisp/clear/warm; `python3 records-d39ccdfff3.py`, `tools/release-catalog --write`, commit/push; post the frames on #303 and #302; run `stage-and-reboot-d39ccdfff3.sh`; device facts, records' Device lines, #236 comment; close #302; #303 stays open for the settings pages' pass (not read in this sweep) unless the maintainer closes it; work log; stash.

## Next Steps

1. Read `chain-82.rc` then `chain-83.rc`; on a FAIL read the guest's log and the frames before touching any wait (blindspot 64). Note: a Monitor with a `seen` set does not re-fire for `proof-298.rc`, which each chain removes and rewrites; read it by hand.
2. The frames, records, posts and the staging as above; then the maintainer's play-testing (step 4), the call on #236 (step 5), the audit (step 6), the PRs and the other devices (7-8).

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
- The yes of 20:35 UTC is conditional (the sweep done, the language read); after `d39ccdfff3` every further device action is asked for by name again.
- chain-8N scripts from chain-83 on sync once at their start (the second `merge --ff-only next` before the H700 build is gone); never commit to `next` between a chain's sync and its last image.
- `tools/rc-preflight` needs `--allow-unchecked device-facts` (no tool reads the facts yet, #270); the `Already written` item reads a `Code trace` heading plus an `Already written:` line at a line's start in the issue (body or comments).

## Open Questions

- None pending on the maintainer; the round waits on their play-testing.
