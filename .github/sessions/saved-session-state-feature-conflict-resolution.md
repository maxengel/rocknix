# Saved Session State

> **Saved**: 2026-09-27T02:50:00Z
> **Branch**: feature/conflict-resolution (worktree `/workspace/repos/rocknix.worktrees/conflict-resolution`; the record lives on `next` in `/workspace/repos/rocknix`, pushed to `origin/next`)
> **Repo**: maxengel/rocknix (fork of ROCKNIX/distribution)

## Current Focus

The release-candidate round (D-QA-049, `release-candidates.md`, D-WORKFLOW-047). The candidate is **`6f0a974765`** (RetroArch patch `0019`'s sixth cut, #295: the notification text where the build before the readable-size floor drew it, 50 px above a 640x480 panel's bottom, at the readable size; x64 run 69 at 23:05, H700 run 47 at 23:08 UTC; records filed; vm-qa run 52 all fifteen suites; `rc-preflight` MAY BE CUT). The patch took six cuts (3, 57, 29, 40, 45 px under the box's edge before the text's centre was the number measured); the five earlier cuts' records are superseded. **The RG35XX SP runs `6f0a974765` since 2026-09-27 00:06 UTC** (boot abdbfb8a -> 6a98d23b; staged 23:57-00:01 UTC, sha256 matched on the device, rebooted 00:01:26 UTC on the maintainer's yeses *"You can copy and reboot."*; queue empty, no failed unit, no crash backtrace); the device facts' H700 row, both records' Device lines, the QA log row, the catalog and #236 say so (`next` at `f6ffe4743a`). Before it: `af3aaa3af0` since 22:47 UTC (its text 60 px up, which the maintainer saw as unchanged). Earlier tonight: `86dc949300` (15:00), `d72084ccad` (21:05), `af3aaa3af0` (22:47) each on its own yeses; #292/#293/#294/#295 done; #292's real-award frame open (the test's route, #278).

## Completed This Session (2026-09-26, this stretch)

- #288 (rotation records stale until replay; provenance in the record) -> `3f93dc4683`; #289 (the Already-written policy, D-WORKFLOW-050, `rc-preflight`'s item); #290 (the exit path's order) -> `86dc949300`, on the device since 15:00 UTC; #291 (the guests on hardware GL through virgl, VNC frames, llvmpipe restored) -> `f483f215ad`.
- #292/#293: `ProxyCards` in EmulationStation (`0ade9086b`, `92bc92a4e`, `f5a120262`, `6e6643687` on `test/qa-integration`): the send card, the top-up card, the two launch questions, the exit card without the achievements, the owed exit sync at the link, the stamp `last-sync-link`; French for every string; D-RA-030, D-UI-095, D-UI-096 (the words approved), D-RA-031 (RAOfflineProxy kept at `0711f0b`; `rc-accept.txt` line); the conventions in `es-player-text.md`, the rule in `es-native-ui.md`, the map; the change log's entry; frames `docs/qa-frames/2026-09-26/292-*`, `293-*`; the issues' checkboxes ticked with the evidence, comments posted.
- Proofs: `proof-292-cards.sh` (run 1: harness faults, the top-up card and the STOP IT AND PLAY question seen), `-v2` (found the no-network afterSync defect), `-v3` (23 of 25; found PLAY NOW's re-entry), `-v4` (the stamp check fixed, not yet run); `diag-292-1b` (twice), `diag-292-race`, `diag-293-stop` with the interface's Info log on -- every exit synced, STOP IT AND PLAY works.
- Friction entry (the proof's keys and settings, #278); memory `proof-keys-and-settings-from-the-rule`.

## In Progress

- **#296, the sixth cut's stacked notifications** (the maintainer, 2026-09-27 00:30 UTC: the save line comes up and is moved when the sign-in arrives; the two stacked with no space). Four guests, one per build (e `e5ed60f3df` :10027, f `d72084ccad` :10028, g `af3aaa3af0` :10029, d `6f0a974765` :10026; all up, at widget scale 1.0), `diag-296-flows-v2.sh` (reboot, A/B/C with the slot save), frames at 0.1 s, `timeline-boxes.py`, `file-296.py`, `compose-296.py` -> `docs/qa-frames/2026-09-27/` (36 files, README with the rows). Measured: the sixth cut's load line lands at 418..448 (14 px low) and jumps to 404..434 when the sign-in arrives (two layout passes, the 9 px reference differs between them, `gfx_widgets_layout` never re-places); its stacked boxes touch (pitch 31 under a 31 px box; the old build 29 under 28); the first cut overlapped by 4 rows. The order is RetroArch's (tasks below, regular above) on every build; a slot save is one line; nothing at exit. The maintainer chose option 2 with the floor at 13 px and the stack lower (D-UI-098, D-UI-099). **The seventh cut is built**: patches 0016 (13 px) and 0019 (the box from the drawn font, the room under the bottom box `MSG_QUEUE_BOTTOM_MARGIN_LINES` 4/3 of the placement line height = 21-22 px, one divider between boxes, an 11 px reference) on `feature/rc-device-fixes` `7fd4864597`, merged to `next`; x64 run 70 (`build-x64-run70.sh`, image `target/ROCKNIX-GENERIC_X64.x86_64-20260927.img.gz`); guest d rebuilt from it (`after-build-70.sh`), the flows `d-v7`: drawn 13 px, box 36, seam 1, no jump, 21 px under the bottom box. Filed as cell 5 of the five-build grids; four margin mock-ups (12/21/32/42, `mock-margin.py`) on #296 (02:45 UTC comment). **Waiting for the maintainer's margin number**; vm-qa run 53 (`vmqa-run53.sh`, `vmqa-run53.rc`) running over the image. Guests e, f, g are down (their disks kept under /workspace/tmp/rocknix-vm-*; `start-guest.sh NAME PORT VNC MAC` brings one back); d is up on the seventh cut. #297 filed (a screenshot library per build).
- **The maintainer's play-testing of `6f0a974765`** otherwise (D-QA-036). Nothing runs on the device from here without a per-action yes.
- **The call (#236, step 5)** after the maintainer's play-testing.

## Next Steps

0. On the maintainer's margin number for #296: if 21, `7fd4864597` is the cut -- vm-qa run 53's result, the records (`x64-all-20260927-7fd4864597`, `h700-all-20260927-...`), the H700 build (`build-h700-run48.sh` from run47's shape, the devices worktree synced at 7fd4864597), the change log entry, the catalog, then the two yeses; otherwise change `MSG_QUEUE_BOTTOM_MARGIN_LINES` in patch 0019 (in `patch-0019/b`, regenerate with `diff -u a b` under the header), commit on `feature/rc-device-fixes`, merge, sync, x64 build, `after-build-70.sh`'s shape, vm-qa, H700. The re-place at layout was left out (a second animation on a moving message); the 11 px reference makes the passes agree instead. Harness debts for #278: the runner's helper-after-reboot rule, `scp -P`, the grabber's 2 s timeout (`vnc-grab.py`), the label face in `compose-296.py`.
1. The call (#236 step 5) once the maintainer reports the play-testing: a comment naming the build (`6f0a974765`), the soak's read and step 0's verdict (`rc-preflight` MAY BE CUT at `7330e62d69`, the two post-cut drifts accepted by D-RA-033/D-WORKFLOW-052); the device facts and the catalog in the same change (D-WORKFLOW-046). Any further staging follows `stage-and-reboot-6f0a974765.sh`'s shape (`/workspace/tmp/rocknix-session/`), on two fresh yeses.
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

- The maintainer's margin number for #296 (21 as built, or 12/32/42 from the mock-ups), then their read of the cut on the device; then the call (step 5). The ceremony check reports the code audit overdue (62 closures since 2026-09-24; CI red) -- that is step 6, which follows the call by the maintainer's order (D-QA-049).
