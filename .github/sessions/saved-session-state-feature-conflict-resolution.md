# Saved Session State

> **Saved**: 2026-09-26T22:52:00Z
> **Branch**: feature/conflict-resolution (worktree `/workspace/repos/rocknix.worktrees/conflict-resolution`; the record lives on `next` in `/workspace/repos/rocknix`, pushed to `origin/next`)
> **Repo**: maxengel/rocknix (fork of ROCKNIX/distribution)

## Current Focus

The release-candidate round (D-QA-049, `release-candidates.md`, D-WORKFLOW-047). The maintainer approved the copy and reboot of `64a0934a5d`, then asked for #293's capture-failure toast to be in the build, so that cut was never staged; the candidate is **`d72084ccad`** (ES `d3ba4edca`: the toast; RAOfflineProxy `c1bd3724d1`, D-RA-032; x64 run 63 at 19:22, H700 run 41 at 19:25 UTC; records `x64-all-20260926-d72084ccad`, `h700-all-20260926-d72084ccad`, the `64a0934a5d` records superseded). Proven: the toast (`proof-293-toast-v2`, 8 of 8, frames `293-capture-failed-*`), the proxy (`tools/ra-offline-test` 32 of 32 on the bump), vm-qa runs 46 and 48 (fresh pairs) fourteen of fifteen each, frame-diff on one transfer screen both times -- the second back-up of the same content ends in 2 s with NOTHING NEW where the `f483f215ad` reference held it still working at 90 s (the QA backend's same-name refusal, #286; the backend was restarted between runs 45 and 46) -- so run 48's walks are the new baseline (build `d72084ccad`, 20:40 UTC; the old one kept as `walk-baseline-f483f215ad-20260926-2040`) and frame-diff reads PASS against it; run 47 (`--only walks --skip-up`) met leftover guest state and proved nothing. `rc-preflight` MAY BE CUT at `4d757d4b63`; `next` at `8c848b915f`. `d72084ccad` was on the RG35XX SP 21:05-22:41 UTC. Their observations on it: the stacked alerts (praise; #294 done), and RetroArch's notifications one text line higher since the readable-size floor (#295) -- they chose option two, and the fix is RetroArch patch `0019` (D-UI-097) in the cut **`af3aaa3af0`** (x64 run 67, H700 run 45, 21:50-21:55 UTC; records filed; the three earlier cuts of the patch 0e0ffbe3cf/5355c29f68/3251889cdd superseded, each measured: 3, 57, 29 px), proven on guest d: the lowest box 40 px above the bottom (57 before, 38 on the build before the floor), the log lines `placement reference 11.00 px ... place scale 0.786`. vm-qa run 50 over it: all fifteen suites PASS (22:20 UTC); the records, the catalog and the QA log are complete and pushed; `rc-preflight` MAY BE CUT. **`af3aaa3af0` is on the RG35XX SP since 22:47 UTC** (staged and rebooted on the maintainer's yeses; boot `abdbfb8a`); the play-testing is theirs (D-QA-036), then the call (#236, step 5), then the step-6 audit through the Facilitator on OpenRouter.

## Completed This Session (2026-09-26, this stretch)

- #288 (rotation records stale until replay; provenance in the record) -> `3f93dc4683`; #289 (the Already-written policy, D-WORKFLOW-050, `rc-preflight`'s item); #290 (the exit path's order) -> `86dc949300`, on the device since 15:00 UTC; #291 (the guests on hardware GL through virgl, VNC frames, llvmpipe restored) -> `f483f215ad`.
- #292/#293: `ProxyCards` in EmulationStation (`0ade9086b`, `92bc92a4e`, `f5a120262`, `6e6643687` on `test/qa-integration`): the send card, the top-up card, the two launch questions, the exit card without the achievements, the owed exit sync at the link, the stamp `last-sync-link`; French for every string; D-RA-030, D-UI-095, D-UI-096 (the words approved), D-RA-031 (RAOfflineProxy kept at `0711f0b`; `rc-accept.txt` line); the conventions in `es-player-text.md`, the rule in `es-native-ui.md`, the map; the change log's entry; frames `docs/qa-frames/2026-09-26/292-*`, `293-*`; the issues' checkboxes ticked with the evidence, comments posted.
- Proofs: `proof-292-cards.sh` (run 1: harness faults, the top-up card and the STOP IT AND PLAY question seen), `-v2` (found the no-network afterSync defect), `-v3` (23 of 25; found PLAY NOW's re-entry), `-v4` (the stamp check fixed, not yet run); `diag-292-1b` (twice), `diag-292-race`, `diag-293-stop` with the interface's Info log on -- every exit synced, STOP IT AND PLAY works.
- Friction entry (the proof's keys and settings, #278); memory `proof-keys-and-settings-from-the-rule`.

## In Progress

- **The call (#236, step 5)** after the maintainer's play-testing of `af3aaa3af0`.
- **#292's real-award frame**: the route missed twice on the reset account (the splash timing); fix the route to read the screen before its first press (#278), then `proof-292-real-award-v2` again.

## Next Steps

1. On the maintainer's yes for `d72084ccad`: the copy, then the reboot on a second yes: `/workspace/tmp/rocknix-session/stage-and-reboot-86dc949300.sh` is the shape (adapt to `d72084ccad`; stage to `/storage/.update-staging`, sha256 on the device, move into `/storage/.update`; `tools/device-act rg35xxsp ...` for each step); device-facts row after.
2. The real-award frame of the send card: one more reset of Tobu's Potato-tan Secret (100359; the 19:33 UTC run earned it again), then `proof-292-real-award-v2` (the toggle on before the reboot, which v1 lacked and so showed no card). The proxy bump itself is proven (D-RA-032).
3. #292's open item to verify: twenty PLAY NOW exits after a link flip with `Debug=true`, every one with a `cloud_backup` run.
5. Step 6 (the audit through the Facilitator on OpenRouter; `docs/audits/2026_09_25-milestone-rc-round-since-258/` paused at Phase 1.3, uncommitted), steps 7-8 (the PR series by content; RG SP and Nova builds).
6. Harness (#278): promote `proof-common.sh`, the proof scripts, `vnc-grab.py` and the ctl shim into `tools/`; `press_a`/`press_b`; `tools/fork-worktree remove ../rocknix.worktrees/rc-device-fixes` when the round closes.

## Key Files Modified

| File | Change | Notes |
| --- | --- | --- |
| ES `es-app/src/ProxyCards.{h,cpp}` | Created | the send and top-up cards, the gates' answers |
| ES `FileData.cpp`, `ThreadedCloudSync.cpp`, `OfflineAchievements.{h,cpp}`, `NetworkThread.cpp`, `ThreadedHasher.cpp`, `CloudText.{h,cpp}`, `CMakeLists.txt`, `locale/lang/fr/...po` | Modified | the questions, the exit card's cleanup, `exitSyncOwed`, the link's calls, French |
| `projects/ROCKNIX/packages/ui/emulationstation/package.mk` | Modified | pin `6e6643687` |
| `docs/decision-register.md`, `docs/releases/rc-accept.txt` | Modified | D-RA-031, D-RA-032 |
| `projects/ROCKNIX/packages/network/raofflineproxy*/package.mk` | Modified | the proxy at `c1bd3724d1`; the three recipes' comments |
| ES `main.cpp`, `FileData.cpp` (the toast), `.claude/rules/player-language.md` (the lesson) | Modified | #293 item 3 |
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

- The maintainer's call on `af3aaa3af0` after the play-testing (step 5).
