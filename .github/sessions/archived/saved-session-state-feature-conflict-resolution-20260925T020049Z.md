# Saved Session State

> **Saved**: 2026-09-24T22:43:49Z
> **Branch**: feature/conflict-resolution (session-state worktree; merged up to next at `ad3c42f211`, the twenty-second cut's records)
> **Repo**: maxengel/rocknix (fork of ROCKNIX/distribution)

## Current Focus

The RC round (#236). **The twenty-second cut `664ad9ac64` (ES `296aa5966`) is built, proven and recorded** -- the maintainer's "at" form on the save state tiles (`TODAY at 09:07`, `YESTERDAY at 14:03`, `09/01/26 at 12:00`, D-UI-089) over everything the twenty-first carried. vm-qa run 28: thirteen suites PASS, `frame-diff` FAIL on six boxes that were exactly the changed tile line, claimed under D-UI-089 in `tools/vm-walks/claims.txt` and re-compared PASS (6 claimed, 0 unclaimed, 78 screens; `frame-diff-reclaimed.md` beside run 28's report). Time to play 1.09 / 1.51 / 0.97 s, surface 1280x800; rehearsal run 23 PASS 20/20. **The two device questions for its tar are on #236** (comment 5823436167), each its own yes (D-QA-011). Nothing is staged; the RG35XX SP runs the seventeenth (`443028ff7a`).

## Completed This Session

- Twenty-second cut: chain-22 (H700 run 27, x64 run 44), artifacts `h700-all-20260924-664ad9ac64` (RECORD.txt; the tar's os-release read back) and `x64-all-20260924-664ad9ac64`; the twenty-first's RECORD.txt marked superseded.
- The three tile forms in one frame: `docs/qa-frames/2026-09-24/195-manager-today-yesterday-older-at-640x480-664ad9ac64.png` (+ README row).
- QA-log row, change-log section "The twenty-second cut", work-log 22:45 entry, index; `tools/signin-memory` comm-name fix committed (it measured #228's 246 MB baseline).
- Earlier today: audit #258 Phases 6-7; code-auditor v1.11.0 Phase 4.6 (#260) and its seat run; #262 triage with the maintainer's twelve answers; #192, #195 (D-UI-087 then D-UI-089), #255, #263 shipped; #228's 2.54 spike parked on `build/webkit-254` (D-WORKFLOW-041/042); #264, #265 filed.

## In Progress

- Nothing running. Guest d is up on `664ad9ac64` (:10026, StartupSystem nes, three Bobl states dated today / yesterday / 2026-09-01). No build, no QA run.

## Next Steps

1. On the maintainer's **yes to the copy**: idle check first (`flock -n /var/run/cloud_sync.lock true`, `rclon[e]`, emulators), then stage `/workspace/artifacts/rocknix-images/h700-all-20260924-664ad9ac64/ROCKNIX-H700.aarch64-20260924.tar` into the RG35XX SP's `~/.update` through `tools/device-act`, verify the device-side sha256 against SHA256SUMS. On the **separate yes to the reboot**: `tools/device-act` reboot, then read `/etc/os-release` for `664ad9ac64` and `journalctl -b` for the update. Then `tools/frame-diff accept` run 28's walks as the baseline (note: the twenty-second cut on the device) and prune the six claims.
2. Owed frames on the next VM session: the French tile frame (HIER / AUJOURD'HUI / à -- set `system.language` fr on guest d); #255's notification at 15 px at 640x480 (denser shot burst after F2; check `Using resolution` first) and the 1280x800 pair; #193's frames.
3. #228: the 2.54 bump is the next candidate's first work, from `build/webkit-254` at the final link (the Inspector protocol's `powerEfficientPlaybackStateChanged`).
4. The maintainer's open calls: an Epic-tier audit for the CI-red cadence (12 closures since the last); #265's SemVer scheme; #15/#18 close or keep; #192's WAITING frame is the RG SP's boot.
5. #264: `tools/retroarch-syntax-check`.

## Key Files Modified

| File | Change | Notes |
| --- | --- | --- |
| `tools/vm-walks/claims.txt` | Modified | six D-UI-089 claims against baseline `443028ff7a`; header says x1 y1 are half-open |
| `docs/vm-qa-log.md`, `docs/cloud-sync-changelog.md`, work log 2026-09-24, `docs/work-logs/INDEX.md` | Modified | the twenty-second cut |
| `docs/qa-frames/2026-09-24/195-manager-today-yesterday-older-at-640x480-664ad9ac64.png`, README | Created/Modified | the three tile forms |
| `tools/signin-memory` | Modified | 15-character comm names |
| ES `TimeText.{h,cpp}`, `TimeUtil.{h,cpp}`, `GuiSaveState.cpp`, `TimeTextTests.cpp`, fr .po | Modified | `296aa5966` on test/qa-integration (pin) |

## Related Context

- **Tracker**: #236 (the round; the device questions), #195 (D-UI-087/089), #228 (2.54 spike), #255, #263, #264, #265, #258/#260 (audit, Phase 4.6).
- **Register**: D-UI-089, D-WORKFLOW-015, D-WORKFLOW-041/042/043, D-QA-011.

## Notes for Next Session

- Chain scripts in `/workspace/tmp/rocknix-session/` (chain-22.sh, build-h700-run27.sh, build-x64-run44.sh, vmqa-run28.sh, record-h700-run28.sh). Never edit a bash tool mid-run; long runs via setsid nohup + watch-job + a harness waiter.
- A frame-diff claim's `x1 y1` are half-open: the report prints `376..462`, the claim is `... 463 704`. Claims written from the printed numbers read "live" and claim nothing.
- A manager opened before its savestates directory exists stays empty until ES restarts (the file cache records the miss); reboot the guest after seeding states.
- On the RG35XX SP never `pkill -f` a pattern the ssh command line carries; `/tmp/ttp-kill` on guests. Reads through `grep -v -i -E 'key|pass|token|user|psk'`.

## Open Questions

- Copy and reboot of the twenty-second cut onto the RG35XX SP: the maintainer's yes, each separately (#236).
- Groundhog: add the council substrate before porting Phase 4.6, or leave its auditor without the phase?
