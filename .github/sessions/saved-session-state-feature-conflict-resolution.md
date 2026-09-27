# Saved Session State

> **Saved**: 2026-09-27T21:45:00Z
> **Branch**: feature/conflict-resolution (the session worktree; the work is on `next` at `9d3615430a` and `feature/rc-device-fixes`)
> **Repo**: maxengel/rocknix (fork of ROCKNIX/distribution)

## Current Focus

The release-candidate round (#236). The RG35XX SP runs `ed0fc38a22` since 19:53 UTC. The cut that supersedes it, `d39ccdfff3` (ES `2178c9e6d`: the offline notice as a card, #302, and every fork card's title/body swept of repetition, #303, D-UI-107), is green (vm-qa 65 all suites, no walk frame moved; proof-298 35/35) and its seven card frames are read and filed. The maintainer's conditional yes of 20:35 UTC covers its copy and reboot; the harness's permission classifier refused the command that launches `stage-and-reboot-d39ccdfff3.sh` ("Interfere With Workloads"), so the device is untouched and the script waits for the maintainer to run it or allow it. Per the denial, the same outcome is not pursued another way.

## Completed This Session

- #298 closed (the three card notes) on `c9f5aa7de0`; #300 filed and fixed (the stall bound on the hash-library fetch, the hasher's own toast and marker, one index attempt per reload); #301 filed (the fetch off the interface thread, follow-up); D-RA-036, D-UI-105, blindspot 64, `es-code-traps.md` § A pooled connection with the link gone, `engineering-practices.md` § masking read.
- ES commits on `test/qa-integration`: `9202ebed5`, `636065877`, `341d0515a` (pin `341d0515a85f375a2070b8629bad51115d5efbab` on next). ctl: `index-offline`, the marker inside the half hour; suite 384 PASS.
- Records: `x64-all-20260927-c9f5aa7de0`, `h700-all-20260927-af523c33a7` (on the device), `*-48f940aa06` and `*-9e9a9eda81` as superseded; catalog 67 cuts; device fact row updated.

## In Progress

- Nothing running. Guest d is on `d39ccdfff3` (port 10026). No build in flight. All chains done (chain-83 rc 0).

## Next Steps

1. The staging of `d39ccdfff3`: `/workspace/tmp/rocknix-session/stage-and-reboot-d39ccdfff3.sh` (copy, sha256 on the device, idle check, reboot through `tools/device-act` under a label quoting the yes, then the post-boot reads; ~12 min). Once it has run: the device fact row (`docs/releases/device-facts.md`, the H700 row: `d39ccdfff3`, the boot id from the script's read), both RECORD.txt Device lines (`x64-all-20260927-d39ccdfff3`, `h700-all-20260927-d39ccdfff3`), the QA row's last sentence, `tools/release-catalog --write`, a #236 comment, a work-log entry, then the maintainer's play-testing (step 4), the call (5), the audit (6), the PRs and other devices (7-8).
2. #303 stays open for the settings pages' rows and descriptions (not read in the sweep) until the maintainer decides; #302 closed.

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

- The staging of `d39ccdfff3` needs the maintainer's hand (run the script, or allow the reboot command in the harness); the yes itself was given at 20:35 UTC.
- Whether #303's second half (the settings pages' rows) is wanted before the call.
