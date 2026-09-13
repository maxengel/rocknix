# QA frames, 2026-09-13 -- #93, #47, #82 and #27 on the VM

GENERIC_X64 `878ec8863b` (EmulationStation `bcc82f113`) on vm-pair's guest b
at 1280x800 and on a fourth guest, d, at 640x480 (`-device
virtio-gpu-pci,xres=640,yres=480`); `02f368914e` (ES `557a27d20`) and
`db6b42c180` (ES `79fe10878`, the fourth #27 cut) on guest d, and `db6b42c180`
on guest b. Every frame is `tools/vm-visual-qa`'s screendump,
driven by step files kept in the session scratchpad.

`d32f47a947` (EmulationStation `51edcf728c`) on guest d at 640x480, for audit
#151's PL-05, PL-06, PL-07 and PL-17: the restore page on a guest whose link
was cut before boot (so no address, and the WI-FI row unset), the scraper's
start-of-scrape sentences with a bogus developer pair and no account, and the
save state manager under `--debug`. Frames carrying `-fr` were taken with
`system.language=fr_FR`.

`f0ab059596` (EmulationStation `8c8be81ba3`) on guest d at 640x480, for #155:
the NETWORK SETTINGS row after its cut, and the restore page in French, again
with the link cut before boot.

| Frame | What it shows |
|---|---|
| `save-state-manager-four-tiles-1280x800.png` | The manager on `878ec8863b`: START NEW GAME, AUTO SAVE, SLOT 1, SLOT 2, every label whole, the sheet half the screen (#27's first cut, where it happened to work). |
| `save-state-manager-slot-focused-help-bar.png` | AUTO SAVE focused: BACK / DELETE / COPY TO FREE SLOT / LAUNCH. |
| `save-state-manager-after-last-delete-help-bar.png` | After the third delete: START NEW GAME focused, BACK / LAUNCH (#93). On the old build the bar kept the deleted slot's DELETE / COPY TO FREE SLOT. |
| `save-state-manager-four-tiles-640x480-878ec8863b-still-truncated.png` | The same page at 640x480 on the same build: START NEW G... / AUTO SAVE... / SLOT 1... -- #27's first cut failing. The label share fell to its floor because `Font::getHeight` is the tallest glyph rasterised so far. |
| `finish-restore-process-no-cloud-top.png` | FINISH RESTORE PROCESS at boot on a device with no cloud storage: check-circle icons, one line under each row, CHECK CONNECTION greyed under a neutral line (#47). |
| `finish-restore-process-no-cloud-bottom.png` | The same page scrolled: LATER KEEPS THIS LIST -- IT COMES BACK NEXT TIME YOU START UP, OR FIND IT IN NETWORK SETTINGS > FINISH RESTORE PROCESS. |
| `finish-restore-process-check-connection-pressed.png` | The greyed cloud row pressed: NO CLOUD STORAGE IS SET UP ON THIS DEVICE YET. SET IT UP NOW? -- an invitation, not a fault (#47's acceptance criterion). |
| `screenshots-list-after-game-exit.png` | SCREENSHOTS after a PNG was planted while ES ran and the NES probe was launched and ended: both files listed, no UPDATE GAMELISTS (#82). |
| `restore-from-the-cloud-page.png` | RESTORE FROM THE CLOUD with SAVES on, the page the restore below ran from. |
| `screenshots-list-after-cloud-restore.png` | SCREENSHOTS after that restore brought a third PNG down from the QA cloud and the completed page was closed: all three listed (#82). |
| `save-state-manager-four-tiles-640x480-02f368914e-dates-collide.png` | #27's second cut at 640x480: every label wraps whole, and the dates of neighbouring slots run together ("21:4709/12/2026"). The tile font was scaled twice on a small panel (`es-code-traps.md`). |
| `save-state-manager-four-tiles-640x480-db6b42c180.png` | #27's fourth cut at 640x480: START NEW GAME, AUTO SAVE / date, SLOT 1 / date, SLOT 2 / date, each inside its tile, BACK / LAUNCH under them (#149). |
| `save-state-manager-slot-focused-640x480-db6b42c180.png` | AUTO SAVE focused at 640x480: BACK / DELETE / COPY TO FREE SLOT / LAUNCH -- a bar this page had never shown on a small panel. |
| `save-state-manager-after-delete-640x480-db6b42c180.png` | After deleting the auto save at 640x480: START NEW GAME focused, START NEW AUTO SAVE whole, BACK / LAUNCH (#93 at this size too). |
| `save-state-manager-four-tiles-1280x800-db6b42c180.png` | The fourth cut at 1280x800: unchanged labels, the bar drawn once (#149's second criterion). |
| `save-state-manager-slot-focused-1280x800-db6b42c180.png` | AUTO SAVE focused at 1280x800 on the fourth cut. |
| `finish-restore-process-no-wifi-top-640x480-d32f47a947.png` | FINISH RESTORE PROCESS at boot on `d32f47a947`, 640x480, link cut before boot: the empty circle on WI-FI PASSWORD, the check-circle on DEVICE PASSWORD, every row a label and one line -- the whole page fits, nothing to scroll (#151 PL-05, #47). |
| `finish-restore-process-no-wifi-bottom-640x480-d32f47a947.png` | The same page walked to its button bar, LATER focused: LATER KEEPS THIS LIST / BACK AT STARTUP, OR IN NETWORK SETTINGS > FINISH RESTORE PROCESS. on one line (#47 box 4). |
| `finish-restore-process-no-wifi-top-640x480-d32f47a947-fr.png` | The same boot in French: FINIR LA RESTAURATION, the two descriptions that have French (DEVICE PASSWORD's, LATER's) translated; the subtitle, the group names, the WI-FI and CHECK CONNECTION rows and the buttons still English -- no msgstr (D-UI-051 gap). Rows still two lines. |
| `finish-restore-process-no-wifi-bottom-640x480-d32f47a947-fr.png` | The French page at its button bar: AU DÉMARRAGE, OU DANS PARAMÈTRES RÉSEAU > FINIR LA RESTAURATION. on one line. |
| `finish-restore-process-online-top-640x480-d32f47a947.png` | The same page at a later boot with the link up: WI-FI PASSWORD now carries the check-circle -- the pair of glyphs #47 box 3 asked for, side by side with the frame above. |
| `network-settings-finish-restore-row-640x480-d32f47a947.png` | NETWORK SETTINGS while the marker exists: the RESTORE group's FINISH RESTORE PROCESS row (the on-demand route LATER names). Its description wraps to a second line at 640x480 -- a three-line row, `GuiMenu.cpp:9041`, filed separately. |
| `screenscraper-rejected-developer-pair-no-account-640x480-d32f47a947.png` | SCRAPE NOW with a bogus developer pair and no account on the shipped ordering: SCREENSCRAPER REJECTED THE DEVELOPER ID OR PASSWORD. CHECK THEM UNDER SCRAPER > ACCOUNTS. -- the pair is probed before the account is looked at (#151 PL-06, #66 box 3). Log: user-info 403, pair alone 200 rejected. |
| `screenscraper-rejected-developer-pair-no-account-640x480-d32f47a947-fr.png` | The same press in French: SCREENSCRAPER A REFUSÉ L’IDENTIFIANT OU LE MOT DE PASSE DÉVELOPPEUR. VÉRIFIEZ-LES DANS SCRAPEUR > COMPTES. |
| `screenscraper-not-online-640x480-d32f47a947.png` | SCRAPE NOW with the guest's link cut (`set_link net0 off`, address gone): YOU'RE NOT ONLINE. TRY AGAIN WHEN YOU ARE. Log: HTTP 3, "Could not resolve hostname" (#151 PL-07). A blackhole route to `api.screenscraper.fr` (HTTP 3, "Could not connect to server") and a route via `lo` (HTTP 3 after the 10 s connect timeout, "Timeout was reached") drew the byte-identical frame; neither reaches the probe, so COULDN'T REACH SCREENSCRAPER stays unframed. |
| `screenscraper-not-online-640x480-d32f47a947-fr.png` | The same press in French: VOUS N’ÊTES PAS EN LIGNE. RÉESSAYEZ QUAND VOUS LE SEREZ. |
| `save-state-manager-four-tiles-640x480-d32f47a947.png` | The manager on `d32f47a947` under `--debug`: START NEW GAME, AUTO SAVE, SLOT 1, SLOT 2 with dates, BACK / LAUNCH. es_log: `help row 0.164167 of a 264 px sheet (constructor)` and `(onSizeChanged)` -- equal (#151 PL-17). |
| `save-state-manager-four-tiles-640x480-d32f47a947-fr.png` | The manager in French: NOUVELLE PARTIE, SAUV. AUTO, EMPLACEMENT 1, EMPLACEMENT 2, RETOUR / LANCER, every label inside its tile. |
| `save-state-manager-two-tiles-1280x800-d32f47a947.png` | The manager on `d32f47a947` at 1280x800 under `--debug` (guest a, SNES `cloudonly`, which has no states): START NEW GAME focused, START NEW AUTO SAVE, BACK / LAUNCH, the sheet the lower 440 px. journal and es_log: `help row 0.164167 of a 440 px sheet (constructor)` and `(onSizeChanged)` -- equal, and the same share as the 264 px sheet at 640x480 (#151 PL-17, the 1280x800 half). |
| `network-settings-finish-restore-row-640x480-f0ab059596.png` | NETWORK SETTINGS while the marker exists, on `f0ab059596`: the RESTORE group's FINISH RESTORE PROCESS row is a label and one line -- RE-ENTER THE PASSWORDS BACKUPS LEAVE OUT (WI-FI, ACCOUNTS, DEVICE). -- where `d32f47a947` wrapped it to a third (#155 box 1, D-UI-023). |
| `network-settings-finish-restore-row-640x480-f0ab059596-fr.png` | The same row in French under PARAMÈTRES RÉSEAU: FINIR LA RESTAURATION / MOTS DE PASSE NON SAUVEGARDÉS À RESSAISIR : WI-FI, COMPTES, APPAREIL., one line, RETOUR under the page (#155 box 2). The RESTORE group heading above the row, and the rest of NETWORK SETTINGS (NETWORK SERVICES, ENABLE SSH, SYNCTHING SERVICES, VPN SERVICES, ...), stay English -- no msgstr; outside #155's row. |
| `finish-restore-process-no-wifi-top-640x480-f0ab059596-fr.png` | FINISH RESTORE PROCESS at boot in French on `f0ab059596`, link cut before boot: FINIR LA RESTAURATION, RESSAISISSEZ LES MOTS DE PASSE NON SAUVEGARDÉS, RÉSEAU, MOT DE PASSE WI-FI (empty circle) / CLÉ WI-FI JAMAIS SAUVEGARDÉE. RESSAISISSEZ-LA POUR REVENIR EN LIGNE., CET APPAREIL, MOT DE PASSE (SSH, SAMBA, SERVEUR DE FICHIERS) (check-circle), VÉRIFIER LA CONNEXION, LES MANETTES BLUETOOTH SONT À RÉASSOCIER, PLUS TARD GARDE CETTE LISTE, PLUS TARD / TERMINER -- no English left on the page (#155 box 2, D-UI-051), every row still a label and one line, the whole page on screen. |
| `finish-restore-process-no-wifi-bottom-640x480-f0ab059596-fr.png` | The French page walked to its button bar, PLUS TARD focused beside TERMINER: AU DÉMARRAGE, OU DANS PARAMÈTRES RÉSEAU > FINIR LA RESTAURATION. on one line. |
