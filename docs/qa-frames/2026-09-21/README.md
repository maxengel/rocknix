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
- `194-offline-login-toast-640x480-77e7e97515.png` — Böbl launched from the
  NES list with the link cut, 2 s in: the toast at the bottom reads
  `RetroAchievements: Logged in as "<account>" (offline).` on a dark backdrop
  that covers the whole text (the name boxed out), and the game's badge card
  top-left reads `You have 0 of 12 achievements unlocked` (#194).
- `189-offline-achievements-page-row-640x480-77e7e97515.png` — GAME SETTINGS,
  RETROACHIEVEMENTS SETTINGS, OFFLINE ACHIEVEMENTS (BETA): the switch on and
  the SCAN GAMES FOR OFFLINE ACHIEVEMENTS row reading `LAST 09/20/2026 23:26 -
  COMPLETED · 3 GAMES READY FOR OFFLINE PLAY` (#189/#188, the last run).
- `189-scan-completed-640x480-77e7e97515.png` — A on that row, YES to the
  dialog: the scan runs as its own page and ends `COMPLETED · GAMES WITH
  ACHIEVEMENTS ADDED: 0 · 3 GAMES READY FOR OFFLINE PLAY · ELAPSED 0:02 · PRESS
  ANY BUTTON TO CLOSE`. Three cached games finish in two seconds, so the
  running line (`SAVING GAMES FOR OFFLINE PLAY... - GAME i OF n`) is not
  catchable here; the RG SP's RC-11 round saw it on a real library (#200).
- `68-online-summary-640x480-77e7e97515.png` — link on, MAIN MENU,
  RETROACHIEVEMENTS with the QA account and its web API key entered on the
  device: the summary loads from RetroAchievements (softcore points 4; Cookie
  Clicker 50 %, Tobu 4 %), no 401 (#68). Account name boxed.
- `157-startup-card-{1-checking,2-receiving,3-completed}-1280x800-77e7e97515.png`
  — guest a (1280x800) rebooted with SYNC SAVES DURING STARTUP on and a linked
  local remote holding a seeded save and auto save, sampled every second from
  8 s: `SYNCING SAVES AT STARTUP · CHECKING THE CONNECTION...` (the #192 first
  step), then `RECEIVING · 407 KB OF 407 KB` with a moving bar, then `SYNC
  SAVES · COMPLETED` with the bar full, then the card fades. One count per
  step, no still bar (#157). The compare step on a two-file fixture is shorter
  than the sampling interval; its halves were framed on builds 13-15.
