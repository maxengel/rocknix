# QA frames, 2026-09-22

GENERIC_X64 guest d (640x480, `:10026`), the third candidate of the #236
round: EmulationStation pin `3305233d1` (#241, D-UI-078: the scan page, the
transfer page and the scraper sit on a foreground page whose one way out
while they run is CANCEL; `7c7ffab43`, a refreshed two-line row keeps its
height). Frames are `tools/vm-visual-qa` screendumps; the QA account's name
is boxed out where it appears (the RETROACHIEVEMENTS SETTINGS page's
USERNAME row).

Filled in below as the walks land.

## #241 -- long work is a foreground page with CANCEL (D-UI-078), on `75603308e4`

Guest d rebuilt from the image for each language, the QA cloud reset before
each pass; every frame `640x480`; the French set carries `-fr`.

- `241-scan-running-footer-*` -- SCANNING GAMES FOR OFFLINE ACHIEVEMENTS with
  the footer `THIS CAN TAKE A WHILE. PRESS B TO CANCEL.` (FR `CELA PEUT
  PRENDRE DU TEMPS. APPUYEZ SUR B POUR ANNULER.`); the help bar's B reads
  CANCEL. Six fixture ROMs with RetroAchievements sets plus thirty pad ROMs,
  so the run outlasts the presses.
- `241-scan-cancel-dialog-*` -- B on the page: `CANCEL THE SCAN?` /
  `GAMES ALREADY SAVED STAY SAVED. THE NEXT SCAN CARRIES ON FROM THERE.`,
  YES first, NO last (B answers NO). FR `ANNULER L'ANALYSE ?`.
- `241-scan-outcome-cancelled-*` -- YES: within a second the ctl has stamped
  `130 scan cached=2 skipped=31 ready=3 ... why=CANCELLED` and the page reads
  `SKIPPED - YOU CANCELLED IT · GAMES WITH ACHIEVEMENTS ADDED: 2 · 3 GAMES
  READY FOR OFFLINE PLAY · THE NEXT SCAN CARRIES ON FROM HERE. · ELAPSED
  0:14 · A TRY AGAIN B CLOSE`. FR `IGNORÉ - VOUS L'AVEZ ANNULÉ`.
- `241-scan-page-after-cancel-*` -- B closes the page: the OFFLINE
  ACHIEVEMENTS (BETA) page beneath, its row reading `LAST <date> - SKIPPED ·
  3 GAMES READY FOR OFFLINE PLAY` and the block below it intact. On the
  first cut (`f0576e5f1a`) and on the previous candidate this frame was the
  row's two texts drawn on top of each other under a selector bar a screen
  tall (`MultiLineMenuEntry::layoutRows` drifted ten percent per refresh;
  ES `7c7ffab43`).
- `241-scan-again-dialog-*` -- A on the row afterwards: the SCAN GAMES
  confirmation without the `LAST TIME IT COULDN'T FINISH` paragraph -- a
  cancel is not a failure.
- `241-transfer-running-footer-*` -- BACKING UP TO THE CLOUD, a ROMs backup
  of a 150 MB fixture (`ITEM 3 OF 5 · TRANSFERRING MeteoRain.gba`), the same
  footer. `241-transfer-cancel-dialog-*`: `CANCEL THIS BACKUP OR RESTORE?` /
  `WHAT'S ALREADY IN PLACE STAYS. THE NEXT BACKUP OR RESTORE FINISHES WHAT
  THIS ONE DIDN'T.` `241-transfer-outcome-cancelled-*`: `SKIPPED - YOU
  CANCELLED IT · 32 FILES BACKED UP · WHAT MADE IT IS IN YOUR CLOUD. THE
  REST IS STILL HERE.`; `last-backup` restamped `130 player-cancelled`, which
  the hub rows read as SKIPPED, YOU CANCELLED IT.
- `241-scraper-running-footer-*` -- SCRAPING GAMES on a page of the same
  shape (`GAME 3 OF 38 · [nes] Bobl · GAMES SCRAPED: 2`) where the previous
  builds drew a corner card; `241-scraper-cancel-dialog-*`: `CANCEL
  SCRAPING?` / `WHAT'S SCRAPED SO FAR IS KEPT. UPDATE GAMELISTS TO APPLY
  IT.`; `241-scraper-outcome-cancelled-*`: `SKIPPED - YOU CANCELLED IT ·
  GAMES SCRAPED: 12 · UPDATE GAMELISTS TO APPLY CHANGES.` -- the French note
  takes the shorter `METTEZ À JOUR LES LISTES DE JEUX POUR L'APPLIQUER.`,
  since the long form ran off this panel on the second cut (ES `46111b1e3`).

## #242 -- offline with a resolver that waits, on `f2f23da875`

The RG35XX SP's shape, not the VM's usual link cut: an address on the
interface, no default route, and a nameserver that never answers
(`repro-242.sh`: `nameserver 10.0.2.99`, `options timeout:10 attempts:2`, so
a lookup waits its twenty seconds as glibc's did on the handheld). The
toggle on and the six fixture games scanned into the store; the interface
restarted after the toggle went on from the shell.

- `242-game-page-offline-resolver-waits-*` -- MAIN MENU, RETROACHIEVEMENTS
  (the summary from the store, `YOU'RE OFFLINE. SHOWING THE GAMES SAVED FOR
  OFFLINE PLAY.`, at once), A on Böbl: the game's page within a few seconds,
  `YOU'RE OFFLINE. SHOWING YOUR MOST RECENT PROGRESS.` The proxy logged the
  store's `patch` and `unlocks` requests the instant they arrived (60 ms
  apart) and its own probe as `name lookup of retroachievements.org took
  longer than 3 s`; the interface's log has no timeout. On the previous
  cuts and on the device the same request was logged twenty seconds after it
  arrived, the interface gave up at fifteen, asked the web, and showed
  libcurl's "Timeout was reached". The summary frame is not filed: its title
  carries the QA account's name.
- `242-service-down-sentence-*` -- the same shape with `raofflineproxy` stopped
  after the monitor had marked the device offline: A on Böbl, and within eight
  seconds `AN ERROR OCCURRED / THE OFFLINE ACHIEVEMENTS SERVICE DIDN'T
  ANSWER. TRY AGAIN IN A MOMENT.` over the summary, with `offline, and the
  proxy did not answer for game 4902; not asking the web` in the interface's
  log. The summary's title behind the dialog carried the QA account's name;
  the top band is painted out with `tools/png-blackout` (stdlib only), which
  is how a frame with the name in it is filed from now on.
