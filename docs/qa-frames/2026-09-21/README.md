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
- `195-save-state-manager-{24h,12h}-640x480-77e7e97515.png` — Probe's SAVE
  STATE MANAGER (an auto save and two slots seeded by the guest's rebuild):
  with SHOW CLOCK IN 12-HOUR FORMAT off the tiles read `09/20/2026 22:30`;
  with it on, `09/20/2026 10:30 PM` and the clock `12:04 AM` (#195). The
  AUTO SAVE tile's label is two lines over its thumbnail (#202).
- `210-{screenshots,tools}-list-help-bar-640x480-77e7e97515.png` — the
  SCREENSHOTS and TOOLS lists: the help bar reads `OPTIONS · MENU · BACK ·
  SEARCH · GAME OPTIONS`, centred, and offers no SAVE STATES where none can
  apply (#210's VM half). The Tools entries carry their icons under the default
  artwork setting (#69's baseline).
- `181-logo-{nes,gb,gba}-640x480-77e7e97515.png` — the carousel on guest d
  with the GBA fixture added: NES, GAME BOY and GAME BOY ADVANCE logos render
  equally sharp here, so #181's softness (FBNeo, NES and Game Boy against GBA,
  Genesis and Sega CD on the handheld) is not reproduced on the VM and stays a
  panel or scaler matter for the device.
- `82-bobl-launched-by-api-640x480.png`, `82-screenshots-list-after-game-exit-640x480.png`
  — #82 on the RC: Böbl launched on guest d through `POST /launch`, a PNG
  copied into `/storage/roms/screenshots` while it ran, the game ended through
  the exit hotkey's `execute_kill`; SCREENSHOTS then lists `2026-09-13-at-boot`
  and `2026-09-21-in-session` with no UPDATE GAMELISTS. `GET /emukill` answered
  200 and killed nothing (#239): `ApiSystem::emuKill` runs
  `batocera-es-swissknife`, which this image does not carry.
- `65-*-640x480.png` — #65 on the RC (guest d): SCRAPER opens on SCRAPE FROM;
  `up` lands on the tab strip, drawn as a filled box over SCRAPE where the
  unfocused strip is an underline; `right` there moves to OPTIONS with the strip
  still focused; `down` returns to IMAGE SOURCE; `right` on that row cycles
  SCREENSHOT to TITLE SCREENSHOT in place.
- `67-*-640x480.png` — #67 on the RC: GAMES TO SCRAPE FOR set to GAMES MISSING
  ALL MEDIA, kept across a tab switch and across BACK to the main menu and
  reopening SCRAPER.
- `64-scraper-accounts-tab-640x480.png` (account name boxed),
  `64-scraping-1of6-640x480.png`, `64-scraping-3of6-bobl-640x480.png`,
  `64-no-developer-pair-sentence-640x480.png` — #64 on the RC: the QA
  ScreenScraper account and the public JELOS pair under ACCOUNTS; SCRAPE NOW
  runs SCRAPING 1/6..6/6 and wrote images, marquee, manual and videos for Böbl,
  Tobu, Ninoid and MeteoRain; with the developer rows removed the same button
  gives SCREENSCRAPER NEEDS A DEVELOPER ID AND PASSWORD. ENTER YOURS UNDER
  SCRAPER > ACCOUNTS.
- `66-wrong-developer-pair-sentence-640x480.png`,
  `66-no-account-sentence-640x480.png` — #66 on the RC: a made-up pair with a
  valid account gives SCREENSCRAPER REJECTED THE DEVELOPER ID OR PASSWORD. CHECK
  THEM UNDER SCRAPER > ACCOUNTS.; a valid pair with no account gives
  SCREENSCRAPER NEEDS YOUR ACCOUNT TO SCRAPE. ADD IT UNDER SCRAPER > ACCOUNTS.
