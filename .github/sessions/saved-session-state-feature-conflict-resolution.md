# Saved Session State

> **Saved**: 2026-09-26T18:58:00Z
> **Branch**: feature/conflict-resolution (worktree `/workspace/repos/rocknix.worktrees/conflict-resolution`; the record lives on `next` in `/workspace/repos/rocknix`, pushed to `origin/next`)
> **Repo**: maxengel/rocknix (fork of ROCKNIX/distribution)

## Current Focus

The release-candidate round (D-QA-049, `release-candidates.md`, D-WORKFLOW-047). The maintainer's play-testing of `86dc949300` on the RG35XX SP asked for #292 (the offline achievements' send shown when it happens) and #293 (every automatic process in the lanes shown and gated). Both are built and proven on the VM in the cut **`64a0934a5d`** (ES `6e6643687`; x64 run 62 at 18:05 UTC, H700 run 40 at 18:09 UTC, one synced head; records `x64-all-20260926-64a0934a5d`, `h700-all-20260926-64a0934a5d`). vm-qa run 45 over the x64 image: fourteen suites PASS, the scripts suite PASS in a foreground rerun (it had been started as a shell background job, SIGINT ignored); records, catalog (45 cuts) and QA log written and pushed. The H700 image is **not staged**: the copy and the reboot are the maintainer's two yeses (D-QA-011/015). The device runs `86dc949300` since 15:00 UTC.

## Completed This Session (2026-09-26, this stretch)

- #288 (rotation records stale until replay; provenance in the record) -> `3f93dc4683`; #289 (the Already-written policy, D-WORKFLOW-050, `rc-preflight`'s item); #290 (the exit path's order) -> `86dc949300`, on the device since 15:00 UTC; #291 (the guests on hardware GL through virgl, VNC frames, llvmpipe restored) -> `f483f215ad`.
- #292/#293: `ProxyCards` in EmulationStation (`0ade9086b`, `92bc92a4e`, `f5a120262`, `6e6643687` on `test/qa-integration`): the send card, the top-up card, the two launch questions, the exit card without the achievements, the owed exit sync at the link, the stamp `last-sync-link`; French for every string; D-RA-030, D-UI-095, D-UI-096 (the words approved), D-RA-031 (RAOfflineProxy kept at `0711f0b`; `rc-accept.txt` line); the conventions in `es-player-text.md`, the rule in `es-native-ui.md`, the map; the change log's entry; frames `docs/qa-frames/2026-09-26/292-*`, `293-*`; the issues' checkboxes ticked with the evidence, comments posted.
- Proofs: `proof-292-cards.sh` (run 1: harness faults, the top-up card and the STOP IT AND PLAY question seen), `-v2` (found the no-network afterSync defect), `-v3` (23 of 25; found PLAY NOW's re-entry), `-v4` (the stamp check fixed, not yet run); `diag-292-1b` (twice), `diag-292-race`, `diag-293-stop` with the interface's Info log on -- every exit synced, STOP IT AND PLAY works.
- Friction entry (the proof's keys and settings, #278); memory `proof-keys-and-settings-from-the-rule`.

## In Progress

- **The call (#236, step 5)** after the maintainer's play-testing of `64a0934a5d`; the H700 copy and reboot wait on the two yeses.

## Next Steps

1. Put the H700 copy to the maintainer (one yes), then the reboot (a second yes): `/workspace/tmp/rocknix-session/stage-and-reboot-86dc949300.sh` is the shape (adapt to `64a0934a5d`; stage to `/storage/.update-staging`, sha256 on the device, move into `/storage/.update`; `tools/device-act rg35xxsp ...` for each step); device-facts row after.
2. Ask the maintainer to reset the QA account's Tobu "Potato-tan Secret" (100359) on the site; then `tools/ra-offline-test` with the frame grabber (the real-award run for #292's first checkbox) and the RAOfflineProxy bump to `c1bd3724d1` with that test as its proof (D-RA-031).
3. #292's open item to verify: twenty PLAY NOW exits after a link flip with `Debug=true`, every one with a `cloud_backup` run.
4. #293's item 3 (the capture-failure toast): words to the maintainer, then a small change.
5. Step 6 (the audit through the Facilitator on OpenRouter; `docs/audits/2026_09_25-milestone-rc-round-since-258/` paused at Phase 1.3, uncommitted), steps 7-8 (the PR series by content; RG SP and Nova builds).
6. Harness (#278): promote `proof-common.sh`, the proof scripts, `vnc-grab.py` and the ctl shim into `tools/`; `press_a`/`press_b`; `tools/fork-worktree remove ../rocknix.worktrees/rc-device-fixes` when the round closes.

## Key Files Modified

| File | Change | Notes |
| --- | --- | --- |
| ES `es-app/src/ProxyCards.{h,cpp}` | Created | the send and top-up cards, the gates' answers |
| ES `FileData.cpp`, `ThreadedCloudSync.cpp`, `OfflineAchievements.{h,cpp}`, `NetworkThread.cpp`, `ThreadedHasher.cpp`, `CloudText.{h,cpp}`, `CMakeLists.txt`, `locale/lang/fr/...po` | Modified | the questions, the exit card's cleanup, `exitSyncOwed`, the link's calls, French |
| `projects/ROCKNIX/packages/ui/emulationstation/package.mk` | Modified | pin `6e6643687` |
| `docs/decision-register.md`, `docs/releases/rc-accept.txt` | Modified | D-RA-031 |
| `.claude/rules/{es-player-text,es-native-ui}.md`, `docs/es-menu-map.md`, `docs/cloud-sync-changelog.md`, `docs/friction-log.md`, `docs/qa-frames/2026-09-26/`, the work log | Modified | the words, the rule, the map, the entry, the frames |

## Related Context

- **Tracker**: #236 (the round), #292, #293, #277/#278 (open items, harness), #289, #270, #42.
- **Register**: D-RA-030/031, D-UI-094/095/096, D-WORKFLOW-050/051, D-LAUNCH-006, D-QA-052.
- **Session files**: `/workspace/tmp/rocknix-session/` (proof-292-cards*.sh, diag-292-*.sh, diag-293-stop.sh, vnc-grab.py, build-x64-run60..62, build-h700-run39/40, vmqa-run45, issue-bodies/).
- **Guests**: a/b under vm-qa run 45; guest d on `64a0934a5d` (:10026, GL, `Debug=true` in its es_settings.cfg).

## Notes for Next Session

- The interface's keyboard: A is `x`, B is `z`, START is `ret`; settings the interface reads are written before a reboot; a shim over `raofflineproxy-ctl` keeps `case "$0"` on `/usr/bin` (the ctl finds its helpers by `$0`).
- The proof's `wait_change` in v3 accepted an unchanged stamp (fixed in v4).
- The network watcher polls every 5 s and pauses during a game, so a link that returned just before a launch raises "online" at the game's exit -- the link's card can follow the exit; it did not stop the exit sync in five logged runs.
- An audit or council pass is a Facilitator call with `--provider openrouter`, never an Agent-tool subagent.

## Open Questions

- The two yeses for the H700 copy and reboot.
- The QA account's achievement reset (the real-award proof and the proxy bump wait on it).
- The capture-failure toast's words (#293 item 3).
