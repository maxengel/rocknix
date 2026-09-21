# QA frames, 2026-09-21 — the RC round for `77e7e97515` (#236), the VM half after D-QA-033

Guest d (640x480) on the release-candidate image, the QA RetroAchievements
account carried in by `tools/qa-accounts`, OFFLINE RETROACHIEVEMENTS on, the
three fixture titles scanned into the proxy's cache, the link cut on the QEMU
monitor (`set_link net0 off`, carrier 0 on the guest before any key). The QA
account's name is boxed out of the summary title (D-QA-026).

- `190-offline-summary-640x480-77e7e97515.png` — MAIN MENU, RETROACHIEVEMENTS
  (first row, `RetroachievementsMenuitem` on), offline: the saved games list
  within the 3 s wait, the line `YOU'RE OFFLINE. SHOWING THE GAMES SAVED FOR
  OFFLINE PLAY.` under the title, three titles with their bars (#190). Note the
  tofu glyph after each title (`[]`): a character in RA's title the font lacks.
- `193-160-game-page-offline-640x480-77e7e97515.png` — A on Böbl from that
  list: the game's page from the proxy's cache, `YOU'RE OFFLINE. SHOWING YOUR
  MOST RECENT PROGRESS.`, the bar and `0% complete` on one line on a visible
  track under the header lines, the list below; nothing overlaps (#193, and
  #160's 640x480 look on the RC).
