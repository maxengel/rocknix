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

`0f4e4829a8` (EmulationStation `3d9394660c`) on guest d at 640x480, for #155's
follow-through: the RESTORE group heading in French, and the CHECK CONNECTION
press on a guest with no cloud storage, link up.

`1e5a2818e8` (EmulationStation `3a121f0152`) on guest d at 640x480 and on
vm-pair's guest a at 1280x800, for #157 (D-UI-052, option 1): the startup
save-sync card with its two-half bar and the half named in the line. Guest d
was pointed at the QA WebDAV endpoint (`tools/cloud-test-backend`, remote
`qa-cloud`, its own `SAVES_REMOTE=/QA-d/Saves` beside the pair's
`/ROCKNIX/Saves`) with `cloudsaves.startup=1`, then rebooted with a frame
taken every 0.3 s from ten seconds after the reboot (`burst.py` in the session
scratchpad: a screendump loop that keeps only the frames that changed). Two
kinds of boot. **Bytes both ways**: a few hundred small saves and one 2-4 MiB
file only in the cloud, sixty small saves and a 2 MiB file only on the device,
so each half moved bytes for several seconds. **Nothing to move**: both sides
equal at 566 files, so each half is a compare and nothing else -- the
maintainer's "113 of 113" shape. The card is on screen from `>>> doing
receive` on: on the VM EmulationStation draws the carousel about five seconds
after it starts and `cloud_net_ready`'s grace ends about then, so every step
of the sync is drawn. Frames carrying `-fr` were taken with
`system.language=fr_FR`. Not caught: `RECEIVING · COMPARING SAVES` on a boot
that then moved bytes -- rclone lists, compares and transfers concurrently,
and on this endpoint the first stats block (one second in) already had bytes
queued, so the compare line stands alone only when there is nothing to move.
That is the case the acceptance criterion names, and where the second count
used to appear.

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
| `network-settings-finish-restore-row-640x480-0f4e4829a8-fr.png` | PARAMÈTRES RÉSEAU while the marker exists, on `0f4e4829a8`: the group heading above FINIR LA RESTAURATION now reads RESTAURER (it was RESTORE on `f0ab059596`); the row's line unchanged -- MOTS DE PASSE NON SAUVEGARDÉS À RESSAISIR : WI-FI, COMPTES, APPAREIL., one line, RETOUR under the page (#155 follow-through). The rest of the page (NETWORK SERVICES, ENABLE SSH, SYNCTHING SERVICES, VPN SERVICES, ...) still English -- upstream gaps, outside #155. |
| `finish-restore-process-check-connection-no-cloud-640x480-0f4e4829a8-fr.png` | VÉRIFIER LA CONNEXION pressed on FINIR LA RESTAURATION in French, link up, no `rclone.conf` on the guest: the row is gated (`cloudConfigured`, `GuiMenu.cpp:7336`) and opens the set-up offer -- NO CLOUD STORAGE IS SET UP ON THIS DEVICE YET. / SET IT UP NOW? -- OUI / NON, so the `GuiLoading` that shows CHECKING... (now VÉRIFICATION…, `msgfmt` 1302 translated) never runs here; the frame taken with no wait after the press and the settled one are byte-identical. The offer's body has no msgid in `fr/LC_MESSAGES/emulationstation2.po` (none of the NO CLOUD STORAGE dialogs do) -- recorded, outside #155's boxes. |
| `startup-sync-1-receiving-starting-640x480-1e5a2818e8.png` | Step 1, the receive half announced (`>>> doing receive`): SYNCING SAVES AT STARTUP / RECEIVING · STARTING..., the bar at its start (nothing drawn at 0 %). Byte-identical across three boots (#157, D-UI-052). |
| `startup-sync-1-receiving-comparing-640x480-1e5a2818e8.png` | Step 1 on the nothing-to-move boot: RECEIVING · COMPARING SAVES · 566 OF 566, the bar still at its start -- a comparison is not a transfer. The frame before it read 499 OF 499; the count climbs, the bar does not. |
| `startup-sync-2-receiving-bytes-640x480-1e5a2818e8.png` | Step 2, bytes arriving: RECEIVING · 408 KB OF 4.4 MB, the bar a short stub at the left -- inside the receive half's 0-50 %. |
| `startup-sync-2b-receiving-bytes-later-640x480-1e5a2818e8.png` | Step 2 a second later: RECEIVING · 1.1 MB OF 4.4 MB, the bar about a quarter of the way to the midpoint. |
| `startup-sync-2c-receiving-half-done-640x480-1e5a2818e8.png` | The receive half complete: RECEIVING · 4.5 MB OF 4.5 MB, the bar ending exactly at the card's midpoint (50 %). It holds there through `cloud_restore`'s post-transfer work until the send half is announced. |
| `startup-sync-3-sending-starting-640x480-1e5a2818e8.png` | Step 3, the send half announced (`>>> doing send`): SENDING · STARTING..., the bar parked at 50 % -- it never returns to 0. |
| `startup-sync-3-sending-comparing-640x480-1e5a2818e8.png` | Step 3 on the nothing-to-move boot: SENDING · COMPARING SAVES · 566 OF 566, the bar at 50 %. The same 566 the receive half showed, now visibly the other half's count -- the maintainer's step 3 with its name on it. The frame before it read 495 OF 495. |
| `startup-sync-4-sending-bytes-640x480-1e5a2818e8.png` | Step 4, bytes leaving: SENDING · 136 KB OF 2.5 MB, the bar just past the midpoint -- inside 50-100 %. |
| `startup-sync-4b-sending-bytes-later-640x480-1e5a2818e8.png` | Step 4 a second later: SENDING · 384 KB OF 2.5 MB, the bar further right. |
| `startup-sync-4c-sending-done-640x480-1e5a2818e8.png` | The send half complete: SENDING · 2.5 MB OF 2.5 MB, the bar the full width of the card (100 %). |
| `startup-sync-5-completed-640x480-1e5a2818e8.png` | Step 5, the outcome: the title turns to SYNC SAVES, the line to COMPLETED, the bar full. Byte-identical on the bytes boot and the nothing-to-move boot. |
| `startup-sync-1-receiving-starting-640x480-1e5a2818e8-fr.png` | Step 1 in French: RÉCEPTION · DÉMARRAGE…, bar at the start. The title SYNCING SAVES AT STARTUP has no msgstr and stays English (D-UI-051 gap; the help bar under it is French). |
| `startup-sync-1-receiving-comparing-640x480-1e5a2818e8-fr.png` | Step 1 in French, nothing to move: RÉCEPTION · COMPARAISON DES SAUVEGARDES · 828 SUR 828 on one line inside the card at 640x480 -- the longest line the card can show, measured here. Bar at the start. |
| `startup-sync-2-receiving-bytes-640x480-1e5a2818e8-fr.png` | Step 2 in French: RÉCEPTION · 888 KB SUR 3.6 MB, the bar inside 0-50 %. |
| `startup-sync-3-sending-starting-640x480-1e5a2818e8-fr.png` | Step 3 in French: ENVOI · DÉMARRAGE…, the bar parked at 50 %. |
| `startup-sync-3-sending-comparing-640x480-1e5a2818e8-fr.png` | Step 3 in French, nothing to move: ENVOI · COMPARAISON DES SAUVEGARDES · 759 SUR 759, the bar at 50 %. |
| `startup-sync-4-sending-bytes-640x480-1e5a2818e8-fr.png` | Step 4 in French: ENVOI · 304 KB SUR 2.5 MB, the bar inside 50-100 %. |
| `startup-sync-5-completed-640x480-1e5a2818e8-fr.png` | Step 5 in French: SYNC SAVES / COMPLETED, bar full -- both English; neither string has a msgstr (D-UI-051 gap, recorded). |
| `startup-sync-2-receiving-bytes-1280x800-1e5a2818e8.png` | Step 2 on guest a at 1280x800 (the pair's `/ROCKNIX/Saves` remote): RECEIVING · 656 KB OF 3.2 MB, the bar a stub at the left, inside 0-50 %. |
| `startup-sync-2c-receiving-half-done-1280x800-1e5a2818e8.png` | The receive half complete at 1280x800: RECEIVING · 3.2 MB OF 3.2 MB, the bar ending at the card's midpoint. |
| `startup-sync-4-sending-bytes-1280x800-1e5a2818e8.png` | Step 4 at 1280x800: SENDING · 440 KB OF 3.1 MB, the bar past the midpoint, inside 50-100 %. |
