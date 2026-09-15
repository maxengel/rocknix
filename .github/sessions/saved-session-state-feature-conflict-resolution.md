# Saved Session State

> **Saved**: 2026-09-15T22:55:00Z
> **Branch**: feature/conflict-resolution (worktree; the work itself is on `next` and in the ES repo)
> **Repo**: maxengel/rocknix (primary checkout /workspace/repos/rocknix on `next`); ES ~/Development/emulationstation-next (build branch `test/qa-integration`)

## Current Focus

RC-12 round on the RG SP, live: the maintainer rebooted the device onto **RC-12 build 2 `0242500826`** themselves (~22:05 UTC; verified from the device) and is testing -- the save state manager, then the Wi-Fi picker between two networks. Their notes so far are built: **build 3 `f2ee6415cd`** (#202, the manager's tile labels a point smaller; VM frames filed), **build 4 `5b795f2e49`** (#203, D-CLOUD-129: a launch over the player's sync or a running transfer asks STOP IT AND PLAY / KEEP WAITING; proven on guest d -- the question, the stop, the game a second later; suites running at 22:50 UTC) and **build 5 `8b533d76ec`** (pin commit `0659732cc1`; #203's gap: a stopped manual backup's row read COULDN'T FINISH, now stamped with the cancel token; the transfer's word is the card's SKIPPED - YOU STARTED A GAME; the manager's French title) -- x64 building at 22:48, a background chain files it, upgrades guest d and starts its H700 build. Nothing beyond build 2 is staged; the punch list and the eleven decisions are **#200**.

## Completed This Session (since the 14:14 UTC RC-11 device apply)

- #200 filed: the RG SP punch list (A) and the decisions list with wording options (B), updated for RC-12 build 2 at 19:50 UTC.
- The maintainer's first two calls -> RC-12 build 1 `2514d317f7` (ES `7dd9de6a1`): the line under WI-FI SSID only when it differed (D-UI-061, now superseded), MANAGE SAVED NETWORKS / SAVED NETWORKS / NO SAVED NETWORKS (D-UI-062). Nine suites PASSED (`qa-2514d317f7-webdav-a-20260915-1857`); guest d upgraded in place through `.update`; 7 frames filed (`docs/qa-frames/2026-09-15/191-*-2514d317f7.png`); H700 `h700-all-20260915-2514d317f7` built, not staged, superseded.
- The third call (the phone paradigm) -> RC-12 build 2 `0242500826`: ES `feature/wifi-paradigm-rc12` `404d3a9a3` (GuiWifi rewritten; `WifiText::pickerRows` / `parseJoin`; `ApiSystem::joinWifiNetwork`; the row hand-built and filled from `wifictl current`; `addInputTextConfigRowWithDescription` and `openWifiSettings` removed) + `ae521676e` (French WI--FI -> WI-FI); distribution `f0b71adfac` (`wifictl join`, harness section u. 19 PASS, 337 whole). Unit tests 102 cases / 1149 assertions. 10 frames filed (`201-*-0242500826.png`). #201 boxes 1-4 ticked; #191 body brought to build 2.
- Register: D-UI-061, D-UI-062, D-UI-063, D-UI-064 (291 IDs, register-check clean). Menu map's network section rewritten. Work log entries 18:55 and 19:40. `next` pushed to origin (427e05a1f2).

## In Progress

- Build 4's nine suites (`vm-qa-5b795f2e49.log`; watcher). Build 5's x64 build + guest d upgrade + H700 build (watcher `bcoex0i0g`). Then on guest d (pointed at the local QA WebDAV, `--bwlimit 8k`; `cloud_sync.conf.before-203` holds its previous conf): re-run the #203 proof -- GAME SETTINGS > BACK UP SAVES TO THE CLOUD > YES (row 18 from the top), back out with B B (B answers NO on a confirmation, so never press B on the dialog), A A on the NES list (Böbl -> manager), A on START NEW GAME -> the question -> A; quit with `pkill -TERM retroarch`; the row should read SKIPPED, A GAME WAS STARTED. Then the transfer-page variant (MANAGE CLOUD STORAGE > BACK UP TO THE CLOUD > ticks > CONTINUE > the page > B > launch). Frames EN/FR, file, QA rows for builds 4 and 5, #203 ticks.
- The maintainer's round on the RG SP (Wi-Fi picker between two networks); each note -> issue, branch, build.
- The #200 decisions (eleven items; item 11 the row's label).

## Next Steps

1. When the maintainer says so: stage the latest H700 build (build 4 or later; `stage-rgsp-run-<id>.sh` pattern, BEGIN/END lines), then the reboot as its own question through `tools/device-act`, then `rgsp-after-reboot.sh <id>`.
2. Apply the #200 decisions as they come (one string each; register rows citing D-RA-021 / D-UI-058 / D-UI-060 ...), build 3, VM proofs, H700.
3. Follow-ups still open: #198 (setrootpass quoting), #193 French wrap (decision 3 on #200), #190 box 3 / #199 box 3, #196 upgrade check and START NEW GAME, #192 card frames, #187 frames, 1280x800 frames, rocknix.org pages (#191/#201 network settings; save states), upstream proposals (#168), #185, #186, SM8550 (D-WORKFLOW-020).

## Key Files Modified

| File | Change | Notes |
| --- | --- | --- |
| ES `es-app/src/guis/GuiWifi.{h,cpp}` | Rewritten | the picker: rows from `WifiText::pickerRows`, join / key popup + connect, `onJoined` rebuilds the page |
| ES `es-app/src/WifiText.{h,cpp}`, `tests/unit/WifiTextTests.cpp` | Modified | `PickerRow`, `pickerRows`, `parseJoin` (+ tests); `ssidLine` removed |
| ES `es-app/src/ApiSystem.{h,cpp}` | Modified | `joinWifiNetwork` -> `timeout 120 wifictl join` |
| ES `es-app/src/guis/GuiMenu.{h,cpp}` | Modified | the WI-FI SSID row (label/value/arrow, `networkSettingsFillInSsid` fills the value), MANAGE SAVED NETWORKS words, `openWifiSettings` gone |
| ES `es-app/src/guis/GuiSettings.{h,cpp}` | Modified | `addInputTextConfigRowWithDescription` removed; `buildInputTextConfigRow` back to void |
| ES `es-core/src/components/MultiLineMenuEntry.{h,cpp}` | Modified | `layoutRows`: `setDescription` re-lays single-line entries too |
| ES `locale/lang/fr/LC_MESSAGES/emulationstation2.po` | Modified | saved-networks words, picker words, WI-FI one hyphen |
| `projects/ROCKNIX/packages/rocknix/sources/scripts/wifictl` | Modified | `join <name>` (nmcli connection up, settings moved from the profile, pin) |
| `tools/last-good-scripts-test` | Modified | section u.: seven join checks; the nmcli shim grew connection up / psk / device show / modify |
| `projects/ROCKNIX/packages/ui/emulationstation/package.mk` | Modified | pin `e7d5029fb70dd693d7ffe8b89f3d63c794d4ca0a` |
| `docs/decision-register.md`, `docs/es-menu-map.md`, `docs/vm-qa-log.md`, `docs/work-logs/.../2026_09_15-work_log.md`, `docs/qa-frames/2026-09-15/` | Modified | D-UI-061..064; the network section; RC-12 build 1 row; 18:55 / 19:40; 17 frames |

## Related Context

- **Tracker**: #200 (punch list + decisions), #201 (the paradigm; boxes 5-6 open), #191 (box 3's RG SP half, box 4 docs), #196, #193, #194, #195, #190, #199, #187, #192, #185.
- **Session scripts**: `/workspace/tmp/rocknix-session/rc11/lib.sh` (guest d helpers), `rc12/wifictl-stub-2` (the stand-in: saved table `/tmp/wifictl-stub-table`, range `/tmp/wifictl-stub-range`, `join-fails` / `connect-fails` flags), `build-x64-rc12*.sh`, `vm-qa-*.log`, `build-h700-rc12*.log`.
- **Artifacts**: `/workspace/artifacts/rocknix-images/{x64,h700}-all-20260915-{2514d317f7,0242500826}/` with BUILD_INFO.txt; suites `qa-2514d317f7-webdav-a-20260915-1857`, `qa-0242500826-webdav-a-...`.

## Notes for Next Session

- Guest d (`:10026`) is on build 2 with the stand-in bind-mounted over `/usr/bin/wifictl` (tables reset: Home Wi-Fi active, Cafe: Guest saved; Library in range), `wifi.ssid` = Home Wi-Fi, English. `umount /usr/bin/wifictl` restores the real script. The MAIN MENU keeps its cursor while open: close it and reopen with START before counting rows (NETWORK SETTINGS is 6 down); the first press after an ES restart is swallowed (`wake`, `press_change`).
- `wifictl connect` deletes an existing profile and rebuilds it from the key given -- the reason the picker joins saved networks through `join` and never `connect`. `wifictl join` writes `wifi.ssid` / `wifi.key` on the OS side (the key read from NetworkManager, never printed); the interface re-reads SystemConf after a join (`loadSystemConf`, which drops unsaved in-memory changes -- the page is rebuilt anyway).
- The keyboard popup accepts with START (`ret` on the VM); X accepts an empty value. UseOSK defaults on.
- A `pgrep -f` count from a command line containing the literal (even inside an echo string) counts the shell wrapper; `ps -eo lstart,args` before believing a "run in flight".
- The maintainer's rules stand: never stage/reboot/write on the RG SP without a per-action yes; a status read must be side-effect-free (`cat` the flush stamp); mask values; the account name stays out of the repo (frames checked before filing -- one frame of the summary page with the name was deleted unfiled tonight).

## Open Questions

- The eleven decisions on #200 (the row's label among them: WI-FI SSID / WI-FI NETWORK / WI-FI).
- Whether RC-12 build 2 goes onto the RG SP now or after the remaining decisions land in a build 3.
