# Audit — bucket 8-es-menus-and-core

## Summary

This bucket is the EmulationStation half of the fork outside the cloud-transfer, offline-achievements and save-state buckets: the cloud hub, on-device rclone setup and QR/phone sign-in pages in `GuiMenu.cpp`; saved-Wi-Fi management and asynchronous network-page fill-in; the maintenance/reset rows moved from a console to spinner-plus-dialog; the BIOS check, scraper run page and achievements page rewrites; launch gating against running syncs and the post-exit capture/rotation record; atomic, recoverable `es_settings.cfg`/`system.cfg` writes with a shell-compatible pid lock; a fault handler that no longer takes the log lock; credential masking on every logged command; and a host-buildable doctest suite for the pure code. Most of it is defensive and well-reasoned, and the parts I could trace end to end (masking, atomic writes, rotation text, time text, tab stops, grid prompts) hold up against their tests.

Three findings matter most. `SystemData::rescanIfFolderChanged` deletes every `FileData` of any gamelist-less system whose folder mtime moved after a game exit, but only the system's own view is dropped first; collection entries and the filter index that hold those pointers are not, which the fork's own traps rule identifies as a use-after-free class (F-ES-01). The post-restore WI-FI PASSWORD row still runs `wifictl connect` (now `timeout 150`) synchronously in a save function, the very freeze `networkApplyWifi` was added in the same file to remove (F-ES-02). And the content picker hands cloud folder names to the shell inside bare double quotes, while the post-exit rotation record stamps `from=own-launch` on turns read from a log that may not be this session's (F-ES-04, F-ES-08). Several player-text rules the fork wrote for itself are broken in this bucket, most visibly `PRESS B TO CANCEL` on the scraper page.

## Findings

### F-ES-01: Folder rescan deletes FileData that collections and the filter index still point at
- **Severity:** High
- **Category:** Concurrency
- **Where:**
  - `es-app/src/SystemData.cpp` hunk `@@ -295,6 +296,63 @@` (`rescanIfFolderChanged`, `rescanChangedFolders`)
  - `es-app/src/FileData.cpp` hunk `@@ -799,6 +1029,87 @@` (`window->postToUiThread([] { SystemData::rescanChangedFolders(); });`)
  - `es-app/src/views/ViewController.cpp` hunk `@@ -1040,6 +1041,66 @@` (`dropGameListView`, `remakeGameListView`)
- **What:** After every game exit, every game system without a `gamelist.xml` whose folder mtime moved has its root folder `clear()`ed and repopulated. The only pointer holder taken down first is the system's own game list view; nothing touches `CollectionSystemManager` (whose `CollectionFileData` wrap source `FileData*`), and nothing re-indexes the system's filter index after the destructors removed the old files from it.
- **Failure scenario:** Fresh device, no gamelists yet. Player plays SNES game A (the recently-played auto collection now holds a `CollectionFileData` pointing at A). Player copies a new ROM into `/storage/roms/snes` over Samba, plays any game, exits. `rescanChangedFolders()` runs, SNES's mtime differs, `mRootFolder->clear()` deletes A. Browsing the recently-played (or favorites, or "all games") collection reads freed memory; the same rescan leaves the SNES FILTER menu with zeroed counts because `populateFolder` does not re-index.
- **Evidence:** The gate is only `if (mRootFolder == nullptr || mIsCollectionSystem || !mIsGameSystem || Settings::ParseGamelistOnly()) return; if (Utils::FileSystem::exists(getGamelistPath(false))) return;` — no platform check. The body is `dropGameListView` → `mRootFolder->clear()` → `populateFolder` → `remakeGameListView`, and no other call. The fork's own rule (`es-code-traps.md` § "A rescan that deletes FileData drops the view first") says: "before deleting objects, list who holds a pointer -- the view's cursor, mCurrentView, the collections (which exclude the imageviewer platform for exactly this reason), FileData::mRunningGame", and the FileData.cpp comment only considers "when the game was an image in the viewer". Refutation attempted: searched the packet for `hasPlatformId(PlatformIds::IMAGEVIEWER)` in the rescan (absent) and for any `CollectionSystemManager` call in the diff (absent); `FileData::~FileData` and `CollectionSystemManager` are outside the packet, so I cannot rule out a destructor hook, but the fork's own rule text says the collections rely on platform exclusion, not on destructors.
- **Fix:** Restrict `rescanIfFolderChanged` to systems with `hasPlatformId(PlatformIds::IMAGEVIEWER)` (the #82 case that motivated it), or before `clear()` call into `CollectionSystemManager` to drop every collection entry for the system and after `populateFolder` re-run the filter indexing the constructor performs.
- **Confidence:** medium — the deletion and the missing notification are in the packet; the exact pointer holders are outside it.

### F-ES-02: FINISH RESTORE PROCESS applies the Wi-Fi key synchronously on the interface thread
- **Severity:** Medium
- **Category:** Correctness
- **Where:**
  - `es-app/src/guis/GuiMenu.cpp` hunk `@@ -4152,75 +5643,2028 @@` (`openRestoreRelink`, WI-FI PASSWORD row's `wifi->addSaveFunc`)
  - `es-app/src/ApiSystem.cpp` hunk `@@ -562,7 +606,14 @@` (`enableWifi`: `timeout 150 wifictl connect`)
- **What:** The save function calls `ApiSystem::getInstance()->enableWifi(...)` directly; `enableWifi` is `executeScript(...)` → `system()`, now bounded at 150 s. Every other Wi-Fi apply in this file was moved behind `networkApplyWifi`/`GuiLoading` in this same diff for exactly this reason.
- **Failure scenario:** After a settings restore the player enters the Wi-Fi key on the relink page, closes the editor page → `save()` runs → screen frozen for the association (the diff's own numbers: up to 90 s healthy, 150 s bounded) with no spinner; "on a handheld reads as a crash" (the fork's `networkApplyWifi` comment).
- **Evidence:** `wifi->addSaveFunc([] { ... ApiSystem::getInstance()->enableWifi(ssid, key, SystemConf::getInstance()->get("wifi.country")); });` versus `networkApplyWifi`'s comment: "wifictl connect can take the better part of two minutes ... every caller of this is a menu callback: the screen froze for the whole association". Refutation attempted: looked for a `GuiLoading` or `networkApplyWifi` wrapper around this call — none.
- **Fix:** Replace the direct call with `networkApplyWifi(window, _("CONNECTING TO WI-FI"), apply, [s, reopen](bool){ s->close(); reopen(); })` and drop the `onFinalize` reopen, or defer via `postToUiThread`.
- **Confidence:** high.

### F-ES-03: MANAGE CLOUD STORAGE spawns `cloud_setup --info` three times at page build, one of them unused
- **Severity:** Medium
- **Category:** Resource
- **Where:**
  - `es-app/src/guis/GuiMenu.cpp` hunk `@@ -3836,120 +3996,1451 @@` (`openCloud`, the `if (configured)` block), and `cloudSetupInfo()` in hunk `@@ -4152,75 +5643,2028 @@`
- **What:** `cloudSetupInfo()` runs `timeout 10 /usr/bin/cloud_setup --info` (rclone listremotes, `ip route get`, systemctl) synchronously on the interface thread; `openCloud` calls it three times in a row, and `remoteName` is never read.
- **Failure scenario:** Opening MANAGE CLOUD STORAGE on an RK3326 blocks the interface for three rclone start-ups (each hundreds of ms; each bounded at 10 s if the route lookup wedges, the #103 case the comment names), rather than one.
- **Evidence:** `const std::string provider = CloudText::providerLabel(cloudSetupInfo()["REMOTE_TYPE"]); const std::string remoteName = cloudSetupInfo()["REMOTE_NAME"]; ... const std::string syncpath = cloudSetupInfo()["SAVES_REMOTE"];` — `remoteName` has no further use in the function. `es-ui-style-guide.md` § Gating: "Expensive checks ... belong behind an explicit user action, never at page build." Refutation attempted: looked for caching inside `cloudSetupInfo()` — it parses a fresh `executeScriptLegacy` each call.
- **Fix:** Call `cloudSetupInfo()` once into a local map and read the three keys from it; delete `remoteName`.
- **Confidence:** high.

### F-ES-04: Cloud folder names reach the shell unquoted in `--set-systems`
- **Severity:** Medium
- **Category:** Security
- **Where:**
  - `es-app/src/guis/GuiMenu.cpp` hunk `@@ -3836,120 +3996,1451 @@` (`cloudContentSystemPicker`, `s->addSaveFunc([switches] {...})`)
- **What:** The picked system names are joined with spaces and spliced into `"... --set-systems \"" + picked + "\""`; the names come from field 0 of `cloud_content_restore --scan` output, i.e. directory names in the player's cloud. Double quotes leave `$`, backticks and `"` to the shell.
- **Failure scenario:** A folder under the cloud's roms directory named `nes"; touch /storage/pwned; echo "` (or, benignly, any name containing `"` or `$`) — closing the CONTENT TO RESTORE page runs it, or breaks the save so the selection is lost. A shared or synced cloud folder is external input.
- **Evidence:** `picked += (picked.empty() ? "" : " ") + entry.first;` where `entry.first` is `f.name` from `Found f{ p[0], ...}`; then `ApiSystem::executeScriptLegacy("/usr/bin/cloud_content_restore --set-systems \"" + picked + "\"");`. Compare `ApiSystem.cpp` in this diff: "Names go through shellQuote ... they are the player's and carry anything." Refutation attempted: `tests/credential-quoting.py` only scans `CREDENTIAL_COMMANDS`, so it does not cover this site; `cloud_content_restore`'s own handling of its argument is outside the packet.
- **Fix:** `Utils::String::shellQuote(picked)`, or pass each name as its own quoted argument.
- **Confidence:** high on the quoting; medium on exploitability (script outside the packet).

### F-ES-05: Scraper page footer names a console letter
- **Severity:** Medium
- **Category:** Player text
- **Where:**
  - `es-app/src/guis/GuiScraperRun.cpp` hunk `@@ -0,0 +1,250 @@` (`update()`, footer candidates; `input()` binds `BUTTON_BACK`)
  - `locale/lang/fr/LC_MESSAGES/emulationstation2.po` (`msgid "THIS CAN TAKE A WHILE. PRESS B TO CANCEL."`, `msgid "PRESS B TO CANCEL."`)
- **What:** The footer hard-codes "B" while the cancel is bound to the configurable `BUTTON_BACK`.
- **Failure scenario:** A pad with Nintendo layout or a player who swapped confirm/cancel presses the labelled B and gets nothing (or confirms); the help bar on the same page already says CANCEL against the right glyph.
- **Evidence:** `{ _("THIS CAN TAKE A WHILE. PRESS B TO CANCEL."), _("PRESS B TO CANCEL.") }`; `if (config->isMappedTo(BUTTON_BACK, input)) askCancel();`. `es-ui-style-guide.md` § Interaction rules: "Refer to buttons by cardinal position ... never console letters"; "never hardcode 'press A'". Refutation attempted: looked for a runtime lookup of the back button's name — none.
- **Fix:** Footer "THIS CAN TAKE A WHILE." only, with the help bar carrying CANCEL; or compose the sentence from the mapped button's cardinal name.
- **Confidence:** high.

### F-ES-06: BIOS CHECK detail page upper-cases the file paths it tells the player to provide
- **Severity:** Medium
- **Category:** Player text
- **Where:**
  - `es-app/src/guis/GuiBios.cpp` hunk `@@ -104,98 +107,168 @@` (`openSystem`)
- **What:** The per-file row is built with `addWithDescription(biosIcon + "  " + f.path, status, nullptr)`; the diff itself states that `addWithDescription` upper-cases its label. The old code passed `biosFile.path` straight into `MultiLineMenuEntry`.
- **Failure scenario:** PlayStation `bios/scph5501.bin` displays as `BIOS/SCPH5501.BIN`; the player names the file that way on the case-sensitive ext4 `/storage`, and the check still reports MISSING.
- **Evidence:** New: `s->addWithDescription(biosIcon(f.status) + "  " + f.path, status, nullptr);` Old: `auto line = std::make_shared<MultiLineMenuEntry>(mWindow, biosFile.path, status);`. `GuiMenu.cpp` `manageNetworksAddRow` comment: "A network's name is case-sensitive ... so the row is built by hand: addWithLabel and addWithDescription upper-case their label." Refutation attempted: the `GuiSettings::addWithDescription` body is outside the packet; the diff's own statement about it is the evidence.
- **Fix:** Build the row by hand as `manageNetworksAddRow` does, with `MultiLineMenuEntry(window, f.path, status)`.
- **Confidence:** medium-high.

### F-ES-07: PLAY NOW answer leaks to a later, unrelated launch
- **Severity:** Medium
- **Category:** Correctness
- **Where:**
  - `es-app/src/FileData.cpp` hunk `@@ -696,10 +725,173 @@` (`launchGame`, the `ProxyCards::sendRunning()` gate)
- **What:** `sPlayThroughSend` is consumed only inside `if (ProxyCards::sendRunning() && !sPlayThroughSend.exchange(false))`; if the send finishes between the PLAY NOW press and the posted relaunch, the flag stays true and suppresses the question on the next launch that does coincide with a send.
- **Failure scenario:** Send running → player picks PLAY NOW → `launchNow` posts → by the time `launchGame` re-enters, `sendRunning()` is false → flag untouched. Hours later a send is running, the player launches a game, and no question is asked.
- **Evidence:** `if (ProxyCards::sendRunning() && !sPlayThroughSend.exchange(false))` and the PLAY NOW callback `sPlayThroughSend = true; launchNow(window, this, options);`. Refutation attempted: looked for a reset of the flag elsewhere in `launchGame` — none.
- **Fix:** `const bool playThrough = sPlayThroughSend.exchange(false);` at function entry, then `if (ProxyCards::sendRunning() && !playThrough)`.
- **Confidence:** medium-high.

### F-ES-08: Rotation record is stamped `from=own-launch` from a log that need not be this session's
- **Severity:** Medium
- **Category:** Data loss
- **Where:**
  - `es-app/src/CaptureRotation.cpp` hunk `@@ -0,0 +1,182 @@` (`recordAfterSession`)
  - `es-app/src/CaptureRotationText.cpp` hunk `@@ -0,0 +1,145 @@` (`turnsFromLog`, `fold`, `recordText`)
  - `es-app/src/FileData.cpp` hunk `@@ -757,6 +949,44 @@` (`CaptureRotation::recordAfterSession(gameToUpdate, options.launchedEmulator);`)
- **What:** `recordAfterSession` runs on every RetroArch exit regardless of `exitCode` and never checks that the log's last banner belongs to this session. `turnsFromLog` returns -1 both for "core never asked" and "no banner at all", `fold` turns -1 into 0, and an existing record is then rewritten as `turns=0\nfrom=own-launch` — the provenance line that makes the reader trust it over the core's table. If the launcher did not truncate the log (the "log level none" case the comments describe), a launch that died before RetroArch's banner reads the previous game's section and stamps that game's turn as this game's own.
- **Failure scenario:** (a) Ms. Pac-Man played (banner + `SET_ROTATION: "3"` in `exec.log`); Dr. Mario fails to start (missing core, bad ROM) → `recordAfterSession(DrMario, "retroarch")` finds Ms. Pac-Man's banner → writes `turns=3 from=own-launch` for Dr. Mario — the #280/#288 contamination, now trusted. (b) Log truncated per launch, RetroArch fails before its banner → a vertical game's correct record becomes `turns=0 from=own-launch` and its thumbnails and screenshots draw unturned until a later good exit.
- **Evidence:** `if (launch == std::string::npos) return -1;` and `int turns = coreTurns < 0 ? 0 : coreTurns % 4;`; `recordAfterSession` has no `exitCode` parameter and writes `recordText(turns)` which appends `OWN_LAUNCH_LINE`. `upgrade-and-install.md` § Migrations: "Attribute honestly. Do not stamp existing data with metadata you have not verified." Refutation attempted: looked for an mtime/`tstart` comparison of the log or an exit-code gate — none; the launcher's truncation policy is outside the packet.
- **Fix:** Pass `exitCode` and `tstart`; skip when `exitCode != 0` or the log's mtime is older than `tstart`; when `turnsFromLog` returns -1 for "no banner", do not write, and never write the own-launch line when no banner was found.
- **Confidence:** medium — the write path is fully in the packet; whether the launcher truncates the log is not.

### F-ES-09: Every link-up restarts the achievements index on the interface thread
- **Severity:** Medium
- **Category:** Concurrency
- **Where:**
  - `es-app/src/NetworkThread.cpp` hunk `@@ -157,6 +198,58 @@` (`OnWatcherChanged`, `SystemData::startIndexesAtStart(window, true)` post)
  - `es-app/src/SystemData.cpp` hunk `@@ -873,6 +931,23 @@` (`startIndexesAtStart` → `ThreadedHasher::start`)
- **What:** On each `online` transition with `CheevosCheckIndexesAtStart` on and the library not yet fetched, a hasher is started on the UI thread. Per the fork's own trap the hasher fetches the hash library in its constructor on that thread, bounded only by 10 s connect plus 30 s stall.
- **Failure scenario:** The SDIO Wi-Fi association instability the fork documents (#102): the link reports connected, the fetch starts, the link drops, the screen freezes up to ~40 s; the link comes back, the cycle repeats. `cheevosLibraryCameThisSession()` never becomes true while the fetch keeps failing, so there is no back-off.
- **Evidence:** `if (online && Settings::CheevosCheckIndexesAtStart() && !ThreadedHasher::cheevosLibraryCameThisSession()) { ... SystemData::startIndexesAtStart(window, true); }`. `es-code-traps.md` § "A pooled connection with the link gone is silent": "A fetch on the interface thread freezes the screen for its bound ... every hasher starts on the interface thread; moving the fetch off it is #300's follow-up". Refutation attempted: looked for a debounce or attempt counter around the post — none; `ThreadedHasher` is outside the packet.
- **Fix:** Rate-limit the retry (e.g. once per link-up, not before N minutes since the last attempt), or land #300 first.
- **Confidence:** medium.

### F-ES-10: `maintenanceRestart` cannot re-read what no longer exists, so a factory reset can be partly written back
- **Severity:** Medium
- **Category:** Correctness
- **Where:**
  - `es-app/src/guis/GuiMenu.cpp` hunk `@@ -246,6 +262,96 @@` (`maintenanceRestart`)
  - `es-core/src/Settings.cpp` hunk `@@ -503,19 +538,51 @@` (`loadFile`: `if (!loaded) return;`)
  - `es-core/src/SystemConf.cpp` hunk `@@ -72,31 +132,46 @@` (`loadSystemConf`: no `confMap.clear()`)
- **What:** The function's stated purpose is to stop `ViewController::saveState()` writing the old in-memory values back over a reset or restored file. `Settings::loadFile()` only overlays parsed values and returns without touching the map when neither the live file nor its `.backup` parses; `SystemConf::loadSystemConf()` never clears `confMap`. After `factoryreset ALL --no-restart` there is nothing to load, so both maps keep the pre-reset values.
- **Failure scenario:** FACTORY RESET → OK → `maintenanceRestart()` → `loadFile()` finds no file, map unchanged → `quitES(REBOOT)` → `ViewController::saveState()` changes a setting → `Settings::saveFile()` → `AtomicFile::writeText` recreates `es_settings.cfg` with every old value, if `/storage/.config/emulationstation` still exists at that moment. `SystemConf` is protected only because `saveSystemConf` refuses when the live file cannot be opened.
- **Evidence:** `if (!loaded) return;` with no `setDefaults()`/map reset; the comment above `maintenanceRestart`: "Re-read both before anything can write the old values back over what just happened". Refutation attempted: what `factoryreset ALL` removes (files or the directory) is outside the packet; if it removes the directory, `open(tmp)` fails and nothing is written.
- **Fix:** Add a "suppress save on exit" flag consumed by `Settings::saveFile`/`SystemConf::saveSystemConf` for maintenance restarts, or reset the maps to defaults before overlaying in `loadFile()`.
- **Confidence:** low-medium.

### F-ES-11: The deferred relaunch carries a copied `saveStateInfo` pointer of unknown ownership
- **Severity:** Medium
- **Category:** Correctness
- **Where:**
  - `es-app/src/FileData.cpp` hunk `@@ -696,10 +725,173 @@` (the STOP IT AND PLAY / PLAY NOW callbacks capturing `options`, `launchNow`, `launchWhenGone`)
  - `es-app/src/FileData.h` hunk `@@ -55,7 +55,9 @@` (`SaveState* saveStateInfo; bool isSaveStateInfoTemporary;`)
- **What:** Each gate returns `false` immediately and captures `options` by value into a callback that runs seconds later (up to 20 s behind `launchWhenGone`). `options.saveStateInfo` is a raw pointer with a temporary-ownership flag; the code that frees a temporary SaveState is outside the packet. If it frees on `launchGame` returning (in `ViewController::launch`), the relaunch dereferences freed memory in `setupSaveState`; if it frees only at the end of a completed `launchGame`, the refused paths leak it.
- **Failure scenario:** Save state manager → "start from slot N" with a temporary SaveState while a sync runs → STOP IT AND PLAY → relaunch → `setupSaveState` on a freed object (or, in the other ownership model, a small leak per refusal).
- **Evidence:** `_("STOP IT AND PLAY"), [this, window, options] { ... launchNow(window, this, options); ...}` and `launchNow` → `ViewController::get()->launch(game, options)`; the diff's comment "The paths are read here, after onGameEnded above" shows `onGameEnded` is in `launchGame`, but no release site is visible. Refutation attempted: searched the packet for `delete options.saveStateInfo` / `isSaveStateInfoTemporary` uses — none.
- **Fix:** Verify the owner; on the refused paths either release the temporary before returning or transfer ownership into the callback (e.g. `std::shared_ptr<SaveState>`).
- **Confidence:** low — ownership is outside the packet.

### F-ES-12: LATER promises a way back that does not exist on the marker-less path
- **Severity:** Low
- **Category:** Player text
- **Where:**
  - `es-app/src/main.cpp` hunk `@@ -671,9 +927,141 @@` (RA password prompt: `GuiMenu::openRestoreRelink(&window, false)`)
  - `es-app/src/guis/GuiMenu.cpp` hunk `@@ -4152,75 +5643,2028 @@` (`openRestoreRelink`, LATER KEEPS THIS LIST row) and the two FINISH RESTORE PROCESS rows gated on `.restore-finish-pending`
- **What:** The relink page always says "LATER KEEPS THIS LIST / BACK AT STARTUP, OR IN NETWORK SETTINGS > FINISH RESTORE PROCESS." Both rows that would bring it back are gated on the marker file, and the RA-password prompt opens the page when there is no marker.
- **Failure scenario:** "YOUR RETROACHIEVEMENTS PASSWORD IS MISSING ... ENTER IT NOW?" → YES → player presses LATER trusting the row → NETWORK SETTINGS has no FINISH RESTORE PROCESS entry.
- **Evidence:** `_("YES"), [&window] { GuiMenu::openRestoreRelink(&window, false); }`; `s->addWithDescription(_("LATER KEEPS THIS LIST"), _("BACK AT STARTUP, OR IN NETWORK SETTINGS > FINISH RESTORE PROCESS."), ...)` unconditionally; `if (Utils::FileSystem::exists("/storage/.config/.restore-finish-pending", false))` guards both rows. `upgrade-and-install.md`: "a message that sends someone to a menu that no longer holds anything is a dead end".
- **Fix:** Show the LATER row only when the marker exists (or `consumeMarker`), else word it as "LATER CLOSES THIS LIST. IT'S IN GAME SETTINGS > RETROACHIEVEMENTS SETTINGS."
- **Confidence:** high.

### F-ES-13: Maintenance dialogs prefer the script's last stdout line over its `>>> why` sentence, upper-cased
- **Severity:** Low
- **Category:** Player text
- **Where:**
  - `es-app/src/guis/GuiMenu.cpp` hunk `@@ -246,6 +262,96 @@` (`runMaintenanceCommand`)
- **What:** The failure sentence is `last.empty() ? why : last`, so any non-protocol stdout line printed after the `>>> why` line wins, and it is `toUpper`ed onto the dialog.
- **Failure scenario:** `backuptool restore` prints `>>> why THE RESTORE COULDN'T FINISH` and then a stray tool line on stdout → dialog reads `COULDN'T FINISH - <TOOL OUTPUT>`.
- **Evidence:** `return std::pair<int, std::string>(rc, last.empty() ? why : last);` and `Utils::String::toUpper(result.second)`. `es-player-text.md` § Outcome vocabulary: "Why comes from a `>>> why <sentence>` line the scripts print at the point of failure"; "no log path, no exit code". Refutation attempted: the scripts' stdout discipline is outside the packet.
- **Fix:** `why.empty() ? last : why`, and only fall back to `failText` when neither is a sentence.
- **Confidence:** medium-high on the code; low on whether scripts trip it.

### F-ES-14: Several action rows carry a description that wraps to a third line at 640 px
- **Severity:** Low
- **Category:** Player text
- **Where:**
  - `es-app/src/guis/GuiMenu.cpp` hunks `@@ -3836,120 +3996,1451 @@` and `@@ -4152,75 +5643,2028 @@`: CHANGE CLOUD FOLDER (`"THE FOLDER IN YOUR CLOUD THAT HOLDS YOUR SAVES. CURRENT:" + " " + syncpath`), CONNECT OR REPAIR (`"SET UP A PROVIDER WITH RCLONE, FROM THE HANDHELD. NO COMPUTER NEEDED."`), WITH MY PHONE (`"SCAN THE CODE, THEN CHOOSE CONTINUE. YOUR PHONE BECOMES A KEYBOARD FOR THIS SCREEN."`), WI-FI PASSWORD (`"BACKUPS NEVER INCLUDE YOUR WI-FI KEY. RE-ENTER IT TO GET BACK ONLINE."`)
- **What:** All are passed with `multiLine = true` (the trailing `true`), so they wrap. The diff's own measurement at the DEVICE PASSWORD row puts the one-line budget at about 66 characters of the bold font at 640×480; these run 70–85 characters, and their French is longer.
- **Failure scenario:** none demonstrated (needs a frame); a three-line row on a 3.5-inch panel.
- **Evidence:** D-UI-023 in `es-player-text.md`: "Two lines per row, never three." The DEVICE PASSWORD comment: "the budget that clears both is about 66 characters of the theme's bold font."
- **Fix:** Shorten to one line each (e.g. "YOUR SAVES FOLDER IN THE CLOUD." with the path in the editor; "NO COMPUTER NEEDED."), or move the extra sentence into the confirmation as the rule prescribes.
- **Confidence:** medium.

### F-ES-15: Screenshot-to-game map goes stale after UPDATE GAMELISTS and caches misses forever
- **Severity:** Low
- **Category:** Correctness
- **Where:**
  - `es-app/src/DisplayAspect.cpp` hunk `@@ -0,0 +1,153 @@` (`sStemsBuilt`, `sShots[path] = sg;`, `forgetScreenshots`)
  - `es-app/src/CaptureRotation.cpp` (`DisplayAspect::forgetScreenshots()` only after a record write)
- **What:** The stem map is built once and only emptied by `forgetScreenshots()`, which runs only when `recordAfterSession` actually wrote a record; a miss is cached in `sShots` with an empty system.
- **Failure scenario:** Player adds a game, runs UPDATE GAMELISTS, plays it (a landscape game: no record written, no `forgetScreenshots`), takes screenshots → under SCREENSHOTS they keep the file's proportions until some other game writes a rotation record or ES restarts.
- **Evidence:** `static bool sStemsBuilt = false;` reset only in `forgetScreenshots()`; `if (!had && turns == 0) return;` in `recordAfterSession` precedes the `forgetScreenshots()` call; no call from `reloadAllGames` or `rescanIfFolderChanged`.
- **Fix:** Call `DisplayAspect::forgetScreenshots()` from `ViewController::reloadAllGames` and `SystemData::rescanIfFolderChanged`; do not cache misses, or key the cache on a library generation counter.
- **Confidence:** medium.

### F-ES-16: Sign-in poll sleeps by spawning a shell
- **Severity:** Low
- **Category:** Resource
- **Where:**
  - `es-app/src/guis/GuiMenu.cpp` hunk `@@ -4152,75 +5643,2028 @@` (`cloudOAuthAwaitSession`)
- **What:** Each of up to 60 iterations calls `Utils::Platform::runSystemCommand("sleep 0.5", "", nullptr)` — a fork/exec of `sh` per poll on a worker thread where `std::this_thread::sleep_for` (used by `launchWhenGone` in this diff) is free. The same file states `runSystemCommand` "double-forks and always returns 0"; if it also returns before the child finishes, the loop does not wait at all and exhausts its 60 polls in a few seconds.
- **Failure scenario:** If non-waiting: the QR page reports "SIGN-IN DID NOT START" while `cloud_oauth serve` is still coming up — consistent with the comment "a second attempt after a cancel was timing out at the old limit".
- **Evidence:** `url.clear(); Utils::Platform::runSystemCommand("sleep 0.5", "", nullptr);`. Refutation attempted: `runSystemCommand`'s wait semantics are outside the packet (only its first lines are shown); the ENABLE SSH flow relies on it being synchronous, which argues the sleep does wait.
- **Fix:** `std::this_thread::sleep_for(std::chrono::milliseconds(500));`
- **Confidence:** medium on the waste; low on the non-wait.

### F-ES-17: The SSH wizard shows the device password in clear
- **Severity:** Low
- **Category:** Convention
- **Where:**
  - `es-app/src/guis/GuiMenu.cpp` hunk `@@ -4152,75 +5643,2028 @@` (`cloudSetupOpenPasswordPage`: CURRENT PASSWORD fact; `cloudSetupShowConnectStep`: CURRENT PASSWORD fact)
- **What:** `cloudSetupAddFact(..., _("CURRENT PASSWORD"), current)` renders `root.password` as plain text on two pages.
- **Failure scenario:** none demonstrated (over-the-shoulder exposure of the root password, by design so it can be typed at an ssh prompt).
- **Evidence:** `es-ui-style-guide.md` § Text: "Passwords display as `*********`, never the real value."; the comment: "this row exists so the player can type the password into their computer's ssh prompt."
- **Fix:** Show masked with a REVEAL action, or accept and record the exception in the style guide.
- **Confidence:** high that the rule is contradicted; the trade-off is deliberate.

### F-ES-18: INCREMENT SLOT is removed and stored `"0"` is remapped on a claim about another distribution's launcher
- **Severity:** Low
- **Category:** Upgrade path
- **Where:**
  - `es-app/src/guis/GuiMenu.cpp` hunk `@@ -3836,120 +3996,1451 @@` (`openGamesSettings`, INCREMENTAL SAVE STATES)
  - `locale/lang/fr/LC_MESSAGES/emulationstation2.po` (removed `msgid "INCREMENT SLOT"`)
- **What:** The option that wrote `global.incrementalsavestates=0` is gone; a device holding `"0"` is shown DO NOT INCREMENT and its next save writes `"2"`. The justification is "what Batocera's launcher makes of it", but ROCKNIX's `runemu.sh` is the consumer.
- **Failure scenario:** If `runemu.sh` distinguishes `0` from `2`, upgraded players who chose INCREMENT SLOT silently get a different save-state behaviour and lose the option.
- **Evidence:** `if (incrementalValue == "0") incrementalValue = "2";` and the two-entry `addRange`. `upgrade-and-install.md`: "A settings key — Does the old key still exist on upgraded devices? Renaming a key silently resets everyone's preference." Refutation attempted: `runemu.sh` is outside the packet.
- **Fix:** Cite `runemu.sh`'s handling in the code comment or keep the third entry.
- **Confidence:** low.

### F-ES-19: MOUNT CLOUD DRIVE is removed while `clouddrive.mounted` persists on upgraded devices
- **Severity:** Low
- **Category:** Upgrade path
- **Where:**
  - `es-app/src/guis/GuiMenu.cpp` hunk `@@ -5767,19 +9450,6 @@` (removed `mount_cloud` switch)
- **What:** The toggle that ran `rclonectl mount/unmount` and wrote `clouddrive.mounted` is deleted; the key survives on devices that set it, with no interface to change it.
- **Failure scenario:** A device with `clouddrive.mounted=1` whose boot path still honours the key keeps mounting the drive with no way to turn it off from the menu; anyone who used the mount loses the feature on upgrade.
- **Evidence:** The removed block `s->addWithLabel(_("MOUNT CLOUD DRIVE"), mount_cloud); ... runSystemCommand("rclonectl mount"...)`. Refutation attempted: `rclonectl` and the boot scripts are outside the packet.
- **Fix:** Either keep the row (it is orthogonal to cloud sync) or migrate the key and document the removal.
- **Confidence:** low on consequence; high on the removal.

### F-ES-20: `LaunchCommand.h` is pure and untested
- **Severity:** Low
- **Category:** Test gap
- **Where:**
  - `es-app/src/LaunchCommand.h` hunk `@@ -0,0 +1,41 @@`
  - `es-app/tests/unit/CMakeLists.txt` hunk `@@ -0,0 +1,79 @@` (no LaunchCommand test)
- **What:** `launchToken`/`launchArgument` decide the emulator, core and system the capture manifest records (`cloud_capture --system/--emulator/--core`), including the boot game whose only source is the stored command. They are header-only string functions with no doctest case, unlike every other pure module in this diff.
- **Failure scenario:** `launchToken(command, "-P")` takes the last `" -P"`; a token later in the command (a `--nick` value, a controller name in the `--controllers=` blob) containing `" -P"` would be recorded as the system — no test pins the shape.
- **Evidence:** `size_t pos = command.rfind(needle);` with `needle = " " + prefix`; the README rule "A rule about a string ... goes there and gets a case."
- **Fix:** Add `LaunchCommandTests.cpp` with the ROCKNIX command shape, a savestate-rewritten command, a netplay client command and a ROM path containing the prefixes.
- **Confidence:** high.

### F-ES-21: `cloud_remote create` output is logged unmasked
- **Severity:** Low
- **Category:** Security
- **Where:**
  - `es-app/src/guis/GuiMenu.cpp` hunk `@@ -4152,75 +5643,2028 @@` (`cloudRemoteShowForm`, CONNECT action)
- **What:** The command carries `pass=`, `key=` and similar arguments; its combined stdout+stderr is written with `LOG(LogInfo) << "cloud_remote create: " << out;`. If the script echoes its arguments in a usage or error message, the credential lands in `es_log.txt`.
- **Failure scenario:** none demonstrated (script outside the packet).
- **Evidence:** `std::string out = Utils::Platform::GetShOutput("timeout 60 /usr/bin/cloud_remote " + cmd + " 2>&1"); LOG(LogInfo) << "cloud_remote create: " << out;`. The fork's masking rule (D-INFRA-011, per `StringUtil.cpp`): "A credential's value never reaches a log".
- **Fix:** `LOG(LogInfo) << "cloud_remote create: " << Utils::String::maskSecrets(out);` — the mask already handles `name=value` shapes.
- **Confidence:** low on leakage; high that the call is unmasked.

### F-ES-22: Non-ASCII em dashes in comments of a file that carries `_()` strings
- **Severity:** Low
- **Category:** Convention
- **Where:**
  - `es-app/src/guis/GuiScraperStart.cpp` hunk `@@ -79,12 +82,30 @@` ("...when the page closes — the path the OPTIONS rows") and hunk `@@ -129,14 +159,56 @@` ("falls back to today's default — every system with a platform id — when")
- **What:** Two comment blocks contain U+2014. They are not adjacent to a `_()` line today, so xgettext does not extract them, but the fork's own rule forbids them because a later edit that moves a translatable call under them stops the image build.
- **Failure scenario:** none demonstrated today.
- **Evidence:** `es-code-traps.md` § "Comments near a translatable string must be ASCII": "Write `.`, `--`, `->`, `...`. Before bumping the ES pin, run `grep -nP '^\s*//.*[^\x00-\x7F]'`".
- **Fix:** Replace with `--`.
- **Confidence:** high.

### F-ES-23: BIOS icon macros show as empty literals in the packet
- **Severity:** Low
- **Category:** Correctness
- **Where:**
  - `es-app/src/guis/GuiBios.cpp` hunk `@@ -1,38 +1,52 @@` (`#define PRESENT_ICON _U("")`, `UNTESTED_ICON`, `MISSING_ICON`)
- **What:** The previous code used `_U("\uF071")` escapes; the new macros appear as `_U("")` in the diff. Either the literals hold raw private-use glyph bytes that do not render in the packet, or they are empty and the icon column draws nothing.
- **Failure scenario:** If empty: every BIOS row and detail line loses its status glyph; the summary text still carries the state.
- **Evidence:** the three `#define` lines; the comment says "The check-circle is what the store and the theme installer draw", which implies a glyph is intended.
- **Fix:** Use the `\uF058`/`\uF071`/`\uF127` escapes the style guide's glyph table uses; verify the bytes in the file.
- **Confidence:** low — the packet cannot show invisible bytes.

### F-ES-24: Every toast is held while any card is up, including the minutes-long hasher card
- **Severity:** Low
- **Category:** Player text
- **Where:**
  - `es-core/src/Window.cpp` hunk `@@ -318,6 +327,14 @@` (`processNotificationMessages`)
- **What:** `if (!mAsyncNotificationComponent.empty()) return;` defers all toasts behind any `AsyncNotificationComponent`, not only the fork's short cloud cards.
- **Failure scenario:** UPDATE GAMELISTS with the achievements index running for ten minutes → REBOOT REQUIRED, low-battery or any other toast waits ten minutes and arrives stale.
- **Evidence:** the unconditional early return; the comment scopes the intent to "a progress card".
- **Fix:** Defer only for cards that opt in (a flag on the component), or cap the deferral.
- **Confidence:** medium.

### F-ES-25: `CloudDimmableEntry` re-implements the dim that `MultiLineMenuEntry::setDimmed` now provides
- **Severity:** Low
- **Category:** Convention
- **Where:**
  - `es-app/src/guis/GuiMenu.cpp` hunk `@@ -3836,120 +3996,1451 @@` (`class CloudDimmableEntry`)
  - `es-core/src/components/MultiLineMenuEntry.{h,cpp}` (`setDimmed`, `ComponentListFlags::dimmed`)
- **What:** Two dim implementations exist in the same diff; the subclass hard-codes `(color & 0xFFFFFF00) | 0x50` while the base offers `setDimmed`. Its comment even says "a shared home is for the day a third page needs it" — that home was added in this diff.
- **Failure scenario:** none demonstrated.
- **Evidence:** `void setColor(unsigned int color) override { MultiLineMenuEntry::setColor(mDimmed ? (color & 0xFFFFFF00) | 0x50 : color); }` vs `MultiLineMenuEntry::setDimmed(bool)`.
- **Fix:** Delete `CloudDimmableEntry`; use `MultiLineMenuEntry` with `setDimmed`.
- **Confidence:** high.

### F-ES-26: Detached worker threads post to a `Window*` that may be gone at quit
- **Severity:** Low
- **Category:** Concurrency
- **Where:**
  - `es-app/src/guis/GuiMenu.cpp` hunk `@@ -5438,9 +8884,147 @@` (`networkSettingsFillIn`, `networkSettingsFillInSsid`) and hunk `@@ -3836,120 +3996,1451 @@` (`cloudOfferTidyFolders`)
  - `es-app/src/FileData.cpp` hunk `@@ -799,6 +1029,87 @@` (the exit capture thread)
- **What:** Each thread captures a raw `Window*` and calls `window->postToUiThread` when its script finishes; nothing joins them at shutdown. The bounds are 5–30 s, and `queryInterfaceAddresses` has none ("if it never returns the row stays blank").
- **Failure scenario:** Quit ES within the bound (or while `getifaddrs` is wedged) → the thread posts into a destroyed `Window` during static destruction.
- **Evidence:** `std::thread([window, ...] { ... window->postToUiThread(...); }).detach();` in each site; no shutdown hook.
- **Fix:** Route these through a shared owner that is drained in `main()`'s teardown (a small thread registry, or `SaveStateBookkeeper`-style shutdown), or a global "window alive" atomic checked before posting.
- **Confidence:** medium.

### F-ES-27: CHANGE CLOUD FOLDER's "CURRENT:" line is stale after a change
- **Severity:** Low
- **Category:** Player text
- **Where:**
  - `es-app/src/guis/GuiMenu.cpp` hunk `@@ -3836,120 +3996,1451 @@` (`openCloud`, CHANGE CLOUD FOLDER row; `openCloudFolderEditor`)
- **What:** Both call `cloudSetupOpenSyncPathEditor(window, current, nullptr)`; with no `onDone` the page beneath is not rebuilt and the row keeps showing the old folder.
- **Failure scenario:** Player changes the folder → returns → row still says the previous path until the page is reopened.
- **Evidence:** `nullptr, [window, syncpath] { cloudSetupOpenSyncPathEditor(window, syncpath, nullptr); }`; the wizard's own use passes a rebuild lambda.
- **Fix:** Pass `[window, s] { s->close(); GuiMenu::openCloud(window); }` as `onDone`.
- **Confidence:** high.

### F-ES-28: BIOS CHECK offers DETAILS when there is nothing to open
- **Severity:** Low
- **Category:** Convention
- **Where:**
  - `es-app/src/guis/GuiBios.cpp` hunk `@@ -225,15 +298,13 @@` (`getHelpPrompts`)
- **What:** `HelpPrompt(BUTTON_OK, _("DETAILS"))` is added unconditionally; the "THE BIOS CHECK RETURNED NOTHING" row has no input handler.
- **Failure scenario:** Empty result → help bar promises DETAILS on A → A does nothing.
- **Evidence:** `es-code-traps.md` § help bar: "When a screen's help bar names a key, pressing it must do something; a prompt that lies is worse than none."
- **Fix:** Add the prompt only when `mBios` is non-empty.
- **Confidence:** high.

### F-ES-29: Unit-test README counts and list disagree with the CMake target
- **Severity:** Low
- **Category:** Documentation
- **Where:**
  - `es-app/tests/unit/README.md` hunk `@@ -0,0 +1,37 @@`
  - `es-app/tests/unit/CMakeLists.txt` hunk `@@ -0,0 +1,79 @@`
- **What:** The CMake comment says "Ten files of EmulationStation and no more" and the README says "the binary compiles those eight files", while the target lists twelve test files and eleven sources, and the README omits `CaptureRotationText`/`DisplayAspectText`.
- **Failure scenario:** none demonstrated.
- **Evidence:** the `add_executable(es-unit-tests ...)` list versus the prose.
- **Fix:** Drop the counts and keep one list, or generate it.
- **Confidence:** high.

### F-ES-30: Progress state is reset in `Process()`, so a second scrape may briefly read the previous run's outcome
- **Severity:** Low
- **Category:** Concurrency
- **Where:**
  - `es-app/src/scrapers/ThreadedScraper.cpp` hunk `@@ -22,8 +31,14 @@` (`Process()`: `sProgress = Progress(); running = true;`)
  - `es-app/src/guis/GuiScraperStart.cpp` hunk `@@ -390,7 +483,12 @@` (`ThreadedScraper::start(...); if (isRunning()) pushGui(new GuiScraperRun(...))`)
- **What:** If `Process()` runs on the worker thread rather than in the constructor, `GuiScraperRun`'s first frames read the previous run's `finished = true` and its first press deletes the page.
- **Failure scenario:** Second scrape of a session: the page flashes last run's numbers and closes on the first input.
- **Evidence:** the reset lives in `Process()`; where `Process()` is called is outside the shown hunks.
- **Fix:** Reset `sProgress` inside `ThreadedScraper::start()` before the instance is created.
- **Confidence:** low.

## Upstream fit

- **Scope and file shape.** `GuiMenu.cpp` grows by roughly 3,500 lines of cloud hub, SSH wizard, native remote form, OAuth/phone sign-in, content picker and match preview, all as file-static functions in one translation unit. A ROCKNIX maintainer would ask for `GuiCloud*.cpp` files and for `FileData.cpp` not to include five cloud/proxy headers (`ThreadedCloudSync.h`, `CloudTransferJob.h`, `ProxyCards.h`, `GuiCloudTransfer.h`, `OfflineAchievements.h`) to gate a launch — that belongs in `ViewController` or a small launch-gate module.
- **Comment register.** Nearly every hunk carries paragraph comments citing fork issue numbers (#102, #191, #290), decision IDs (D-UI-023, D-CLOUD-079), maintainer quotes and dates. Upstream has no tracker for these; the rationale is valuable but should be condensed to the mechanism and the rule, with the history in commit messages.
- **Layering.** `es-core/src/components/AsyncNotificationComponent.cpp` includes `../../es-app/src/CloudText.h`; the comment leans on a `Window.cpp`→`ApiSystem` precedent, but it makes es-core unlinkable without es-app and would draw pushback.
- **Feature removals in a fix PR.** MOUNT CLOUD DRIVE (F-ES-19) and INCREMENT SLOT (F-ES-18) are dropped; the BIOS screen loses its tabs; the netplay `%NETPLAY%` and help-bar prompt logic change. Each needs its own justification or its own PR.
- **Global visual changes.** `BUTTON_GRID_HORIZ_PADDING` 0.0052→0.022 of screen width, `GuiMsgBox` widening to 0.8 for paragraphs, the async card at 0.9 width, centred and fully opaque, the toast-behind-card rule, `HideWindow` defaulting on for x86 under `ROCKNIX`. All reasonable, all affecting every screen; they should be separable commits.
- **Build system and tests.** `ES_BUILD_TESTS`, `es-app/tests/unit`, a vendored 7,134-line `external/doctest/doctest.h`, and two Python scripts at `tests/` in the ES repo root (`cloud-oauth-lifetime.py` compiles a harness with `g++ -fsanitize=address`; `credential-quoting.py` greps sources). Upstream would want the Python under a tooling directory and wired into CI, not beside `es-app/`.
- **`SCREENSCRAPER_RUNTIME_DEV_LOGIN`.** The compiled-in pair still takes precedence, so this is additive; but shipping a build without either pair leaves ScreenScraper unusable for anyone without a developer account. Fine as a fork policy; a maintainer would want it documented as such.
- **Headers list.** `es-app/CMakeLists.txt` continues to list `.cpp` files under `ES_HEADERS` (`GuiCloudTransfer.cpp` pattern inherited from upstream's `GuiUpdate.cpp # batocera`). Not new, but this PR adds to it.
- **Conditional includes.** `<map>` and `<thread>` are added inside an existing `#if …/#endif` block in `GuiMenu.cpp` while `std::thread` is used unconditionally in `networkSettingsFillIn`; whatever that block's condition is, a build that does not take it relies on transitive includes.
- **No personal paths or credentials** were found in the interface diff; all device paths are `/usr/bin/…`, `/storage/…`, `/tmp/…`, `/var/log/…`.
- **Hygiene.** `ImageGridComponent.h` gains `#include <functional>` above its include guard; `GridTileComponent.cpp` and `ImageGridComponent.h` have mis-indented inserted lines; `CaptureRotation::sKnownAt` is a non-static namespace-scope map (external linkage) unlike its `sTables` sibling in an anonymous namespace.

## Coverage boundary

- **ES files referenced but not in this packet** (other buckets): `ThreadedCloudSync`, `CloudText`, `WifiText`, `CloudTransferJob`, `GuiCloudTransfer`, `GuiOfflineScan`, `ProxyCards`, `OfflineAchievements[Text]`, `CheevosIndex`, `SaveStateJobQueue`, `SaveStateBookkeeper`, `OfflineProxyUrl`, `GuiWifi`, `ThreadedHasher` (`cheevosLibraryCameThisSession`), `NetworkStateWatcher::isConnected`, `RetroAchievements` (`testAccount` 4-arg, `getGameInfoAndUserProgress` 3-arg, `GameInfoAndUserProgress::NotOnDevice/FromDevice/isUnlocked`), `RetroAchievementProgress::setLabelBeside`, `ViewController::reloadAllGames` 4-arg and `launch`, `ZoomableImageComponent::setDisplayAspect`, `Utils::FileSystem::isSVG`, `HttpReqOptions::customHeaders`, `GuiInfoPopup::getMessage`, `CollectionSystemManager`, `SaveStateConfigFile`, `FileData::~FileData`, `ApiSystem::executeScript`'s `pclose`/`WEXITSTATUS` tail, `runSystemCommand`'s wait semantics, `ProcessStartInfo::run()`'s return and logging, `ThreadedScraper::start()`/constructor. Findings F-ES-01, 08, 09, 10, 11, 16, 30 set their confidence accordingly.
- **Distribution-side scripts this code drives** (bucket 0 in this packet is empty): `wifictl current|saved|join|forget|has_ap_mode|channels`, `rocknix-systems --all`, `cloud_setup --info|--check|--seed-folders|--set-syncpath|--connected|--free-auth-port`, `cloud_remote providers|fields|choices|subproviders|create`, `cloud_oauth serve|info|url|status|open|wait|close|cancel`, `cloud_capture`, `cloud_backup`/`cloud_restore` flags (`--recent`, `--automatic`, `--system-only`, `--update`), `cloud_content_restore --scan|--systems|--set-systems|--match|--apply`, `cloud_migrate_layout --check|--apply`, `cloud_net_ready --wait`, `backuptool --no-restart|--then-cloud`, `factoryreset … --no-restart` and what `ALL` removes, `setrootpass`, the shell `wait_lock` path (`/tmp/.system.cfg.lock`) and pid format, `runemu.sh`'s reading of `global.incrementalsavestates` and its `-P%SYSTEM% --core= --emulator=` command shape (`launchToken` depends on it), and any consumer of `clouddrive.mounted`.
- **Runtime evidence not derivable from a diff:** 640×480 frames for the two-line rule (F-ES-14), whether the `GuiBios` macros hold glyph bytes (F-ES-23), `msgfmt` acceptance of the new French msgids (duplicates such as `MISSING`, `APPLY`, `CONTINUE`, `NAME` would fail the locale build if they already existed in the untouched part of the `.po`), xgettext behaviour on the two em-dash comments, whether `system.cfg`/`es_settings.cfg` are ever symlinks on a device (the new `rename` replaces the link), and the actual latency of `cloud_setup --info` on RK3326/H700.
- **Concurrency I could not exercise:** the `PidLock` protocol against the shell's `wait_lock` implementation; `Window::stopNotificationPopups` under `mNotificationMessagesLock`; `ThreadedScraper`'s reset timing.