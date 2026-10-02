# The interface PR, read by bucket

The EmulationStation side goes upstream as **one PR** to `ROCKNIX/emulationstation-next`
(D-WORKFLOW-066: `GuiMenu.cpp` and `ApiSystem.cpp` carry every bucket's rows, and a
per-bucket split would be the artificial cut the maintainer ruled out). This guide is
what the PR description carries so a reviewer can read one bucket at a time. The fork's
`test/qa-integration` against ROCKNIX's `master` (`cada856d8`, the merge base): 207
files, +42,056 / -1,142. Written 2026-09-29 (#322) from each file's own commits.

Two paths in the fork's tree never reach the PR: `.githooks/` and `CLAUDE.md` (personal,
as on the distribution side); `.gitignore`'s one line (the unit-test binary) does.

## A. Cloud: setup on the device, the sign-in, the hub and the transfer page

Pairs with distribution PRs 7 and 8 (the cloud scripts the pages run).

- `es-app/src/guis/GuiMenu.cpp`: the `cloudSetup*` pages (the wizard's steps, the QR row,
  the password page, the folder editor), `cloudRemote*` (the provider list and the form),
  `cloudOAuth*` (the sign-in: on-device keyboard or the phone, the listener wait),
  `GuiMenu::openCloudSetup`, `openCloudAddRemote`, `openCloud` (the hub), `openCloudFolderEditor`,
  `cloudAdd*Row` / `cloudHub*` / `cloudReadLastRun` / `cloudLatestRun` (the rows and their
  stamps), `cloudOpenTransfer` / `cloudOpenMatch` (the tick page, the systems picker,
  `cloudSelectionRead` / `cloudSaveSelection`), `cloudPreviewTidyFolders` / `cloudOfferTidyFolders`.
- `CloudText.{h,cpp}` (every pure string rule: the stamps, the outcome words, the whys;
  `es-app/tests/unit/CloudTextTests.cpp`), `CloudOffer.{h,cpp}` (the empty-cloud offers),
  `CloudExit.h` (the sentinels 69 and 75), `CloudTransferJob.{h,cpp}` (the transfer page's
  job; `tests/app-unit/JobsTests.cpp`), `ThreadedCloudSync.{h,cpp}` (the automatic sync and
  its card), `JourneyTiers.h` (`tests/app-unit/JourneyTiersTests.cpp`), `TextFit.h`
  (`tests/app-unit/TextFitTests.cpp`).
- `guis/GuiCloudTransfer.{h,cpp}` (the long-job page, sat in, with CANCEL; D-UI-078).
- `es-core`: `components/AsyncNotificationComponent.{h,cpp}` (the card: width, opacity,
  the action row), `Window.cpp` (one floating surface at a time), `guis/GuiMsgBox.cpp`
  (a message measured at the width it is drawn at), `utils/Platform.{h,cpp}` (multi-line
  command output read whole).
- `tests/cloud-*.py` (the page-lifetime and quoting checks built with AddressSanitizer).

## B. Saves: the capture at game exit, the save-state manager, and captures that turn

Pairs with distribution PR 8 (`runemu.sh`'s `-state_file` contract, `cloud_capture`).

- `FileData.{h,cpp}` (the exit capture and the launch gate), `LaunchCommand.h`
  (`es-app/tests/unit/LaunchCommandTests.cpp`), `main.cpp` (the capture on the crash path,
  the startup sync's command), `SaveState.cpp`, `SaveStateBookkeeper.{h,cpp}`
  (`tests/app-unit/BookkeeperTests.cpp`), `SaveStateJobQueue.{h,cpp}`,
  `SaveStateRepository.{h,cpp}`, `guis/GuiSaveState.{h,cpp}` (the manager: DELETE and COPY
  under the transfer lock, TODAY / YESTERDAY), `RunLock.h` (shared with C;
  `tests/app-unit/RunLockTests.cpp`), `es-core/src/utils/{TimeText,TimeUtil}.{h,cpp}`,
  `es-core/src/utils/CommandLineUtil.h`.
- The turned captures (#243, #245): `CaptureRotation*.{h,cpp}`, `DisplayAspect*.{h,cpp}`,
  `guis/GuiImageViewer.cpp`, `views/gamelist/{DetailedContainer,GridGameListView,ISimpleGameListView}.cpp`,
  `es-core/src/components/{GridTileComponent,ImageComponent}.{h,cpp}`, `ImageGridComponent.h`,
  `resources/TextureData.cpp`.
- The library while ES runs (#246): `SystemData.{h,cpp}`, `FolderMerge.h`,
  `views/ViewController.{h,cpp}` (the rescan drops the view before it deletes).
- `tests/launch-*.py`, `es-app/CMakeLists.txt`.

## C. RetroAchievements offline

Pairs with distribution PR 6 (the proxy package and the launch scripts).

- `OfflineAchievements.{h,cpp}`, `OfflineAchievementsText.{h,cpp}` (unit tests beside),
  `OfflineScanJob.{h,cpp}`, `guis/GuiOfflineScan.{h,cpp}` (the scan page),
  `ProxyCards.{h,cpp}` (the send card, the top-up card, the game-list card;
  `tests/app-unit/ProxyCardsTests.cpp`), `RetroAchievements.{h,cpp}` and
  `guis/GuiRetroAchievements.{h,cpp}` (the summary offline, without a web key),
  `guis/GuiRetroAchievementsSettings.cpp` (the toggle and its page),
  `guis/GuiGameAchievements.{h,cpp}`, `guis/GuiGameOptions.cpp`, `CheevosIndex.{h,cpp}`,
  `CheevosRetry.{h,cpp}`, `NetworkThread.{h,cpp}` (the link's return: saves first, then one
  batch), `ThreadedHasher.{h,cpp}` (the index feeds the cache; an offline index says so).
- `es-core`: `HttpReq.{h,cpp}` (a fetch bounded in silence), `components/WebImageComponent.cpp`,
  `utils/OfflineProxyUrl.{h,cpp}`.
- `tests/hasher-offline-index.py`, `tests/run-lock-signal.py`.

## D. Wi-Fi: the picker, saved networks, the row that tells the truth

Pairs with distribution PR 5 (`wifictl`).

- `guis/GuiWifi.{h,cpp}` (the picker: CONNECTED / SAVED, the saved-network dialog,
  INPUT MANUALLY), `WifiText.{h,cpp}` (the press rules; `es-app/tests/unit/WifiTextTests.cpp`),
  `GuiMenu.cpp`: `networkSettingsFillIn*`, `networkApplyWifi`,
  `GuiMenu::forgetWifiNetworkWithConfirmation`, `manageNetworks*`, `openManageNetworks`.
- Shared with A and C: `ApiSystem.{h,cpp}` (every shell-out; the join answer is a type),
  `guis/GuiSettings.{h,cpp}` (`addInputTextConfigRow` and the row builders).

## E. Settings kept whole, credentials never logged

Pairs with distribution PR 4 (chksysconfig, backuptool).

- `es-core/src/{Settings,SystemConf}.{h,cpp}`, `utils/AtomicFileUtil.{h,cpp}` (write through
  a temporary, keep the last known good, recover under the settings lock; unit tests beside),
  `Log.cpp` / `LogPolicy.h`, `utils/StringUtil.{h,cpp}` (a credential masked whole;
  `MaskSecretsTests.cpp`), `Scripting.cpp`, `InputManager.cpp`, `Win32ApiSystem.cpp`,
  `AppWindow.h`, `GuiMenu.cpp`: `maintenance*` and `runMaintenanceCommand` (the reset page's
  outcome dialogs), `GuiMenu::openRestoreRelink` (FINISH RESTORE PROCESS).
- `tests/credential-quoting.py`, `tests/maintenance-why.py`.

## F. The scraper's developer pair, and BIOS

- `scrapers/{Scraper,ScreenScraper,ThreadedScraper}.{h,cpp}`, `guis/GuiScraperStart.cpp`
  (DEVELOPER ID / DEVELOPER PASSWORD under ACCOUNTS on a build with no pair compiled in),
  `guis/GuiScraperRun.{h,cpp}` (sat in, with CANCEL), `guis/GuiBios.{h,cpp}`.

## G. Interface mechanics every bucket stands on

- `es-core/src/components/ComponentGrid.{h,cpp}` (a direction offered only where it moves
  something), `ComponentTab.cpp` (the tab strip as a focus stop, D-UI-021; an empty strip is no stop since `f1ae6bc25`, #325),
  `MenuComponent.{h,cpp}`, `MultiLineMenuEntry.{h,cpp}` (rows measured from their fonts),
  `ComponentList.h`, `SwitchComponent.{h,cpp}`, `HelpComponent.cpp`, `TextComponent.h`,
  `resources/{Font,TabStops}.{h,cpp}` (unit test beside).
- `locale/lang/fr/LC_MESSAGES/emulationstation2.po` (every fork string in French, D-UI-051).
- The test harness: `CMakeLists.txt`, `es-app/tests/unit/` (doctest, `external/doctest/doctest.h`),
  `tests/app-unit/` and its fakes.

## The shared files, so a reviewer of one bucket knows what else is in them

| File | Buckets |
| --- | --- |
| `es-app/src/guis/GuiMenu.cpp` | A, D, E (the functions above), and the RetroAchievements rows of C |
| `es-app/src/ApiSystem.{h,cpp}` | A, C, D |
| `es-app/src/guis/GuiSettings.{h,cpp}` | A, D |
| `es-app/src/main.cpp` | A, B, E |
| `es-app/src/RunLock.h` | B, C |
| `es-core/src/utils/Platform.{h,cpp}` | A, B, E |
| `es-core/src/utils/StringUtil.{h,cpp}` | A, E |
