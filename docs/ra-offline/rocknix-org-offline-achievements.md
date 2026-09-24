# Offline achievements (beta)

*Draft for the `ROCKNIX/rocknix.org` site, `docs/configure/offline-achievements.md` (or a section of `docs/configure/retroachievements.md`). Kept in the fork's `docs/` until the site PR, per `fork-workflow.md` (personal path) and `documentation-accuracy.md` (the code and the page move together). Every menu label below is the string the interface shows in the seventh candidate (`3387cf5da0`); check them against `GuiRetroAchievementsSettings.cpp` and `GuiOfflineScan.cpp` before opening the PR. Audit #186 PL-11; phase 5 #168.*

## What it does

With **offline achievements** on, you can earn RetroAchievements while your device has no connection. The achievements you unlock are kept on the device and sent to RetroAchievements the next time it is connected. You never have to check whether you are online before you play.

Two things to know before you turn it on:

- **Casual achievements only.** Offline play cannot be verified the way hardcore play is, so turning offline achievements on turns **HARDCORE MODE** off. Hardcore stays off while offline achievements are on.
- **It is a beta.** It works, it has been tested, and it is new. If something looks wrong, the page tells you what happened, and you can turn it off at any time.

## Turning it on

1. Open **GAME SETTINGS**, then **RETROACHIEVEMENTS SETTINGS**. Sign in to RetroAchievements if you have not.
2. Choose **OFFLINE ACHIEVEMENTS (BETA)**. The page opens on its switch.
3. Turn the switch on. A message says what changes: casual achievements only, hardcore mode off, and, if your device does not already index new games at startup, that it turns **INDEX NEW GAMES AT STARTUP** on so games you add later are saved for offline play too.
4. The device then offers to **scan your games** right away. Say yes if you are connected; it is what makes your games ready.

## Scanning your games

A game can earn achievements offline once its achievement data is saved on the device. That happens in three ways:

- **The scan.** **SCAN GAMES FOR OFFLINE ACHIEVEMENTS** on the offline achievements page looks at every game on the console and saves its achievement data. It takes a while for a large library. You can press **B** to keep it scanning in the background and carry on; the line under the row shows how far it is, and the page can be reopened from the row.
- **Starting a game while connected.** Any game you start while online is saved as you play it.
- **New games.** When your device comes online it saves the achievement data of games it has indexed but not yet saved, so games you add later are ready the next time you are connected.

The line under **SCAN GAMES FOR OFFLINE ACHIEVEMENTS** always says how the last scan went and how many games are ready for offline play.

Games RetroAchievements does not know are skipped. There is no limit on how many games can be saved.

## Playing offline

Play as usual. When you unlock an achievement with no connection, RetroArch shows **'!RA!'** in the corner: it means an achievement has not reached RetroAchievements yet. It is kept on the device.

When you leave a game with an achievement waiting, the card that appears at exit says **OFFLINE ACHIEVEMENTS WILL BE SENT NEXT TIME YOU'RE CONNECTED.** (or, with game saves waiting too, **OFFLINE ACHIEVEMENTS WILL BE SENT AND SAVES SYNCED NEXT TIME YOU'RE CONNECTED.**). The next time the device is connected, the sync card that runs says **OFFLINE ACHIEVEMENTS HAVE BEEN SENT TO RETROACHIEVEMENTS.**

## Viewing achievements offline

With no connection, **RETROACHIEVEMENTS** in the main menu still opens. It says **YOU'RE NOT ONLINE. SHOWING THE GAMES SAVED ON THIS DEVICE.** and lists the games whose achievement data is on the device with your progress. A game's own achievements page, from that list or from the game's options, shows its achievements and your unlocks from the saved data, with **YOU'RE NOT ONLINE. SHOWING WHAT'S SAVED ON THIS DEVICE.** An unlock that is waiting to be sent reads **Unlocked - will be sent when you're connected**.

A game whose data has not been saved yet says so in one message: scan your games, or start the game once while you are connected.

## Turning it off

Turn the switch off on the same page. Achievements already waiting are sent the next time the device is connected. **HARDCORE MODE** goes back to how it was before you turned offline achievements on.

## What a settings backup carries

A backup of your settings carries the offline achievements switch. It never carries the saved achievement data or any achievement waiting to be sent: those belong to the device, and a restored device rebuilds them by scanning.

## Questions

**Do I lose achievements if the device is off for a long time?** No. They wait on the device until it is connected.

**Why casual only?** Hardcore achievements are verified live by RetroAchievements; that cannot be done offline. Offline achievements follow the same rule as other offline solutions RetroAchievements has approved.

**Does it use more of my connection?** Saving a game's achievement data is a few small requests per game, made once, and paced.
