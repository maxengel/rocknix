# Saved Session State

> **Saved**: 2026-09-16T15:08:29Z
> **Branch**: feature/conflict-resolution (this worktree holds only the session state; the work is on `next` and in the ES repo)
> **Repo**: maxengel/rocknix -- primary checkout /workspace/repos/rocknix on `next` (f56f286020, pushed); ES ~/Development/emulationstation-next, build branch `test/qa-integration` at `265540258` (pushed)

## Current Focus

RC-12 for the "Offline RetroAchievements" milestone round on the maintainer's RG SP. **The RG SP is on RC-12 build 6 `bc26baa60d`** (staged 03:18 UTC on "you may stage the buils", rebooted through `tools/device-act` 03:33 UTC on "you may reboot", verified back with an empty queue, `ready=247 pending=0`). **RC-12 build 7 `586d2334fd` is built, proven and offered; NOT staged** -- it awaits the maintainer's word (D-QA-011), then the reboot as its own question (D-QA-015). Build 7 adds D-CLOUD-130: every sync a game launch would interrupt asks STOP IT AND PLAY / KEEP WAITING, the automatic startup and after-a-game syncs included (the maintainer's consistency call after meeting the exit sync's silent stop).

## Completed This Session (2026-09-15 evening -> 2026-09-16 05:20 UTC)

- #200 punch list filed and kept current; the maintainer's eleven decisions taken one at a time and recorded (D-RA-022/023, D-UI-065..072, D-WORKFLOW-023, D-QA-026), plus a twelfth (D-CLOUD-130) and the benchmark's consequence (D-CLOUD-131).
- Builds, each x64-proven on guest d, nine suites, H700 filed under `/workspace/artifacts/rocknix-images/h700-all-2026091{5,6}-<id>/`:
  - build 1 `2514d317f7` (the SSID line only when it differed; MANAGE SAVED NETWORKS) -- superseded;
  - build 2 `0242500826` (#201, the Wi-Fi paradigm: the row is the network you are on, the picker marks CONNECTED/SAVED and joins a saved network; `wifictl join`) -- was on the RG SP 22:05-03:33;
  - build 3 `f2ee6415cd` (#202, the manager's labels a point smaller); build 4 `5b795f2e49` (#203, the launch-over-sync question for the player's syncs and transfers); build 5 `8b533d76ec` (a stopped manual backup's row says so; the transfer word; the manager's French title);
  - build 6 `bc26baa60d` (the eleven decisions: WI-FI NETWORK, no slot renumbering, the offline lines' French) -- **on the device**;
  - build 7 `586d2334fd` (the automatic syncs ask too) -- the candidate.
- `tools/time-to-play` answers the launch question in its game-to-game cell (D-CLOUD-131): exit -> next first frame 2.01 s with the press.
- Rules/memories: one writer per QA cloud folder while the suites run (rule + memory); gate commits on the check (memory); the QA-account frames deleted unfiled.
- Issues: #200 (punch list + decisions), #201 (paradigm; box 5 RG SP half + docs open), #202 (RG SP half open), #203 (boxes 1-3 ticked; RG SP half, French frames, docs open; follow-up: transfer-page stamps), #204 closed as parked (French stays, low priority). #191, #193, #196 carry the decisions.

## In Progress

- **Offering build 7 to the RG SP**: the maintainer has not yet answered "May I stage build 7?". On a yes: `stage-rgsp-run-586d2334fd.sh` (copy the build-6 wrapper: artifact dir `h700-all-20260916-586d2334fd`, quote the maintainer's yes, BEGIN/END lines), then ask for the reboot by name, then `rgsp-after-reboot.sh 586d2334fd`.
- The maintainer's own round on build 6/7: the RG SP items of #200 section A (the Wi-Fi picker between two networks -- no word yet; the manager's text; the launch-over-sync question; the rest). Each note -> issue quoting them (D-QA-012), branch from `test/qa-integration`, merge, pin, x64 build, suites, guest d proof, H700, then ask to stage.

## Next Steps

1. When the maintainer says so: stage build 7 (staging asked -- their word), then the reboot as its own question through `tools/device-act rgsp "reboot-apply-h700-586d2334fd (maintainer yes ...)" -- 'sync; reboot'`, then `rgsp-after-reboot.sh 586d2334fd`; record the RETURNED line, the QA row's device column, the work log, #200.
2. Follow-ups, none blocking: #203's transfer-page stamps (a transfer stopped from the transfer page leaves its parts' script stamps at 130 with no token, so the hub rows read COULDN'T FINISH once dismissed); the two French offline lines unframed on the VM (START swallowed after restarts; see notes); the rocknix.org pages for network settings (#191/#201), save states (#196), the cloud question (#203) -- required before any upstream PR (documentation-accuracy.md); upstream proposals (#168); #185's own round (D-WORKFLOW-023); the audit (task #11) and the RAOfflineProxy upstreaming (task #12) from earlier days.
3. Blindspot/rule material already captured: one writer per QA cloud folder; gate commits on the check; the START key after an ES restart (harness note in the 02:55 work log).

## Key Files Modified (this session)

| File | Change | Notes |
| --- | --- | --- |
| ES `es-app/src/FileData.cpp` | Modified | the launch gate: one question over any sync (card or transfer), `launchNow` / `launchWhenGone` (spinner, SIGKILL at 5 s, gives up at 20 s) |
| ES `es-app/src/CloudTransferJob.{h,cpp}` | Modified | runs under `setsid` with a `>>> pid` line; `stopForLaunch`; a stopped run exits `CloudExit::Stopped` and reads SKIPPED - YOU STARTED A GAME |
| ES `es-app/src/ThreadedCloudSync.{h,cpp}` | Modified | `cancelForLaunch(refusal, evenIfPlayerStarted)`; `writeStamp`; a cancelled manual backup/restore stamps `last-backup`/`last-restore` with the cancel token |
| ES `es-app/src/guis/GuiWifi.{h,cpp}` | Rewritten | the picker (D-UI-063/064) |
| ES `es-app/src/guis/GuiMenu.{h,cpp}` | Modified | WI-FI NETWORK row (value = the network the device is on), MANAGE SAVED NETWORKS words, `openWifiSettings` gone |
| ES `es-app/src/SaveState.cpp`, `guis/GuiSaveState.cpp` | Modified | no renumbering (D-UI-069); labels a point smaller (#202) |
| ES `es-app/src/WifiText.{h,cpp}`, `ApiSystem.{h,cpp}`, `GuiSettings.{h,cpp}`, `MultiLineMenuEntry.{h,cpp}`, unit tests, FR .po | Modified | `pickerRows`/`parseJoin`; `joinWifiNetwork`; the description-row helper removed; `layoutRows`; 102 unit cases |
| `projects/ROCKNIX/packages/rocknix/sources/scripts/wifictl` | Modified | `join <name>` (+ harness section u., 19 PASS) |
| `projects/ROCKNIX/packages/ui/emulationstation/package.mk` | Modified | pin `265540258e4b94f4050cda67e07e47d08c5632f2` (build 7) |
| `tools/time-to-play` | Modified | the g2g cell presses STOP IT AND PLAY (D-CLOUD-131) |
| `.claude/rules/generic-x64-vm-testing.md` | Modified | one writer per QA cloud folder |
| `docs/decision-register.md`, `docs/es-menu-map.md`, `docs/vm-qa-log.md`, `docs/work-logs/2026_09-work_logs/2026_09_1{5,6}-work_log.md`, `docs/qa-frames/2026-09-1{5,6}/` | Modified | 306 register IDs; rows for builds 1-7; frames for #191/#201/#202/#203/#196 |

## Related Context

- **Tracker**: #200 (punch list + the twelve decisions), #201, #202, #203, #191, #193, #196, #204 (closed, parked); milestone "Offline RetroAchievements", epic #11.
- **Device record**: `/workspace/artifacts/rocknix-device-actions.log` (BEGIN/END/RETURNED lines for every stage and reboot; the last: build 6's reboot 03:33 UTC).
- **Session scripts** (`/workspace/tmp/rocknix-session/`): `rc11/lib.sh` (guest d helpers: `g`, `gput`, `ser`, `frame`, `press`, `link`, `set_lang`, `es_restart`, `no_game`), `rc12/wifictl-stub-2` (the Wi-Fi stand-in), `stage-h700.sh` + `stage-rgsp-run-<id>.sh` (staging wrappers), `rgsp-after-reboot.sh`, `build-rc12g.sh` (x64 -> H700 chain pattern), `vm-qa-<id>.log`, frames under `rc12/frames-*/`.
- **Artifacts**: `/workspace/artifacts/rocknix-images/{x64,h700}-all-2026091{5,6}-<id>/` with BUILD_INFO.txt and SHA256SUMS.tar (H700); suite reports `qa-<id>-webdav-a-<date>/`.

## Notes for Next Session

- **Guest d** (`:10026`, monitor `/tmp/rocknix-qemu-monitor-d.sock`, serial `-serial-d.sock`) is on build 7 with the Wi-Fi stand-in NOT mounted after its last reboot, cloud config restored (no remote, `cloudsaves.gameexit=0`), English; Tobu has slot files `state3` + auto, Böbl `state1..3` + auto in `/storage/roms/savestates/{gbc,nes}/`. Guests a/b are the suites' (`tools/vm-qa` brings them up from the image). The QA WebDAV backend (`tools/cloud-test-backend`, :9010) serves one directory: never let another guest write `/GAMES` while the suites run; a proof uses its own folder (`SAVES_REMOTE=/GAMES-d`).
- **START (`sendkey ret`) is swallowed for a minute or more after an ES restart on guest d**, while A and B register; the frame tool's `wait-for-change` retry makes it worse (a second START closes the menu). Held presses (`sendkey ret 300`) after a long idle worked. Reach pages through A/B where possible; frames right after a restart can be stale ~30-60 s.
- The exit sync on the VM at `--bwlimit 8k` ends by its own progress bound after ~20 s (THE CLOUD TOOK TOO LONG, D-CLOUD-111): answer a launch question within the sync's first seconds to exercise the cancel.
- Every device act: idle check, ask by name, `tools/device-act`, read the device afterwards; a status read must be side-effect-free (`cat` the flush stamp, never `raofflineproxy-ctl flushed`); mask values; the QA account's name never enters the repo (frames are checked before filing; two were deleted this session).
- Commit gating: chain the commit on the check (`chk || exit 1`) -- a broken FileData.cpp reached `test/qa-integration` for eleven minutes this session because the check only fed an echo.
- Commits: `git -c user.name="Max Engel" -c user.email="max@awecelot.com"`, trailers `Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>` and `Claude-Session: https://claude.ai/code/session_01LkFLXE5GsT1apn8AwrxrGR`; register append-only (`tools/register-check`); never `cd` into the primary checkout; sync build worktrees only with no build running; the ES pin must be pushed before building.

## Open Questions

- The maintainer's yes to stage build 7 on the RG SP (asked at 05:22 UTC); then the reboot.
- Their Wi-Fi picker result between two networks on the device (#201 box 5), and the rest of #200 section A on build 6/7.
