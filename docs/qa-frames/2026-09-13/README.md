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

`4d7eb1f303` (EmulationStation `44bcc4d51d`) on guest d at 640x480, for #160:
the RetroAchievements game page for Sonic the Hedgehog (the probe ROM given
`<cheevosId>1</cheevosId>`, opened from the game's options panel, VIEW THIS
GAME'S ACHIEVEMENTS), with the QA account carried in by `tools/qa-accounts`.
The account has unlocked nothing, so the page reads 0/35 and the bar is at
0 %. Framed at the theme's default font size and at Extra Large
(`<string name="subset.font-size" value="xlarge" />` in `es_settings.cfg`,
written with EmulationStation stopped), in English and, for Extra Large,
French.

`0f7785e6ed` -- a **feature-branch TEST build**, not a `next` image: distribution
`feature/ra-offline` (`1d03246676`..`eefb1a7393` on `next` `34aca64afd`, ES pin
`0f7785e6ed`) with EmulationStation `feature/ra-offline` `403a45415c` -- on
guest d at 640x480, for #165 and #166 (the OFFLINE RETROACHIEVEMENTS toggle,
D-RA-002). GAME SETTINGS > RETROACHIEVEMENTS SETTINGS, the QA account carried
in by `tools/qa-accounts`, HARDCORE MODE switched on by hand first so the
revert had something to revert to. Frames carrying `-fr` were taken with
`system.language=fr_FR`. The row's line is UPPERCASE where every sibling
description on the page is sentence case, in both languages.

`e1edaaa33b` -- the second **feature-branch TEST build**, again not a `next`
image: distribution `feature/ra-offline` tip `e1edaaa33b` (the four fixes to the
first check's findings and the docs commit, on top of `eefb1a7393`) with
EmulationStation `feature/ra-offline` `23dc0336ff` -- on guest d at 640x480,
re-checking #166. The row's line is now sentence case like its siblings. The
frames were taken with the toggle on after two reboots that kept the marker
and the service (`enabled=1 marker=1 service=active` at both boots, the unit
started at 2.1 s before `essway` at 3.6-3.8 s); HARDCORE MODE had been
switched on by hand before the turn-on, as in the first check. `-fr` with
`system.language=fr_FR`.

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
| `retroachievements-game-page-default-640x480-4d7eb1f303.png` | The game page at the DEFAULT font size on `4d7eb1f303`: `0% complete` and its bar are drawn across `Achievements (softcore): 0/35` and `Achievements (hardcore): 0/35` -- #160's overlap, still present at this size. The three header lines are centred here: under full-screen menus `MenuComponent::updateSize` returns before the branch that left-aligns the subtitle, so it keeps its `ALIGN_CENTER` across 0.88 of the screen, while `GuiGameAchievements` measures `textRight` as position + padding + text width -- the left-aligned right edge, which ends before 55 % of the column although the centred text runs past it. The list below is untouched. |
| `retroachievements-game-page-xlarge-640x480-4d7eb1f303.png` | The same page at Extra Large: the measured width now crosses the threshold, and `0% complete` with its bar sits on its own row under `Points: 0/300`, the list starting below -- nothing overlaps. The bar's row starts at the header's left padding while the three lines above it are centred, so it sits left of them rather than under them. |
| `retroachievements-game-page-xlarge-640x480-4d7eb1f303-fr.png` | Extra Large in French: `Succès (mode facile): 0/35`, `Succès (mode difficile): 0/35`, `Points: 0/300`, then `0% terminé` on its own row, nothing overlapping; the options-panel row that opens the page reads VOIR LES SUCCÈS DU JEU. The achievement names and descriptions below come from RetroAchievements in English. |
| `retroachievements-game-page-default-640x480-9684d8665d.png` | The game page at the theme's DEFAULT font size on `9684d8665d` (ES `b6eb26980a`), Sonic the Hedgehog with the QA account: the title SONIC THE HEDGEHOG and the three header lines `Achievements (softcore): 0/35`, `Achievements (hardcore): 0/35`, `Points: 0/300` left-aligned at the page's left padding, the values in one tab column, the bar beside the block with `0% complete` under the bar and nothing else under it, the list starting below the header; the game art top right. #160's DEFAULT-size overlap on `4d7eb1f303` is gone. |
| `retroachievements-game-page-xlarge-640x480-9684d8665d.png` | The same page at Extra Large: the three left-aligned lines with their values in one column, the bar on its own row under `Points: 0/300` with `0% complete` centred beneath it, the list starting below -- nothing overlapping. On `4d7eb1f303` this row started at the left padding while the lines above were centred; now the lines are left-aligned too, so the row sits under them. |
| `retroachievements-game-page-xlarge-640x480-9684d8665d-fr.png` | Extra Large in French: `Succès (mode facile): 0/35`, `Succès (mode difficile): 0/35`, `Points: 0/300` left-aligned, values in one column, then `0% terminé` centred under the bar on its own row; LANCER / RETOUR under the page. The options-panel row that opens it reads VOIR LES SUCCÈS DU JEU. |
| `retroachievements-summary-default-640x480-9684d8665d.png` | The RETROACHIEVEMENTS summary page (MAIN MENU > RETROACHIEVEMENTS) at DEFAULT on `9684d8665d`: the title `RETROACHIEVEMENTS - <account>` left-aligned, `Softcore points: 0` and `Points (hardcore): 0` left-aligned with the values in one tab column beside the account picture top right; the QA account has played nothing, so the game list under the header is empty. The other header this cut of `MenuComponent::updateSize` left-aligns under full-screen menus. |
| `startup-sync-1-receiving-starting-1280x800-9684d8665d-fr.png` | The startup card on pair guest a at 1280x800 in French on `9684d8665d` (`system.language=fr_FR`, `cloudsaves.startup=1`, the pair's QA WebDAV remote): title SYNCHRONISATION DES SAUVEGARDES AU DÉMARRAGE -- the title that had no msgstr on `1e5a2818e8` -- over RÉCEPTION · DÉMARRAGE…, the bar at its start (nothing drawn at 0 %). Burst frame 12.1 s after the reboot command returned (#157 box 3). |
| `startup-sync-2c-receiving-half-done-1280x800-9684d8665d-fr.png` | Half a second later: RÉCEPTION · 8 KB SUR 8 KB, the bar ending at the card's midpoint -- the receive half complete at 50 %. |
| `startup-sync-3-sending-starting-1280x800-9684d8665d-fr.png` | The send half announced: ENVOI · DÉMARRAGE…, the bar parked at 50 %, the title still SYNCHRONISATION DES SAUVEGARDES AU DÉMARRAGE. 19.7 s. |
| `startup-sync-5-completed-1280x800-9684d8665d-fr.png` | The outcome in French: the title turns to SYNCHRONISER LES SAUVEGARDES, the line to TERMINÉ, the bar full -- both strings had no msgstr on `1e5a2818e8` and stayed English there. 20.9 s; the whole sync took a second per half (12 saves, nothing to compare for long), so no compare-line frame exists at this size. |
| `finish-restore-process-after-169-archive-1280x800-9684d8665d.png` | FINISH RESTORE PROCESS at boot on pair guest b at 1280x800 after `backuptool restore --no-restart` of an archive written on guest d with the QA RetroAchievements account and a PPSSPP `.dat` present (#169 box 3): NETWORK > WI-FI PASSWORD (ticked, the VM's wired link), ACCOUNTS > RETROACHIEVEMENTS (<account>) / YOUR USERNAME WAS RESTORED; THE PASSWORD WAS NOT., THIS DEVICE > DEVICE PASSWORD, LATER / FINISH. The `.dat` did not land (`PSP/SYSTEM/` held `CACHE` and `ppsspp.ini` only); after the account was re-entered and ES had logged in, `cheevos_ppsspp.sh` wrote it again at 17 bytes. |
| `ra-offline-toggle-page-top-640x480-0f7785e6ed.png` | The page on open: the new subtitle `!RA! IN A GAME'S CORNER MEANS AN ACHIEVEMENT HASN'T REACHED RETROACHIEVEMENTS YET.` wraps to two lines under the title (as #165 measured); SETTINGS with the account rows, OPTIONS with HARDCORE MODE off, then the new row OFFLINE RETROACHIEVEMENTS / `BETA. CASUAL ACHIEVEMENTS ONLY, EVEN WITHOUT A CONNECTION.` on one line, the switch off, LEADERBOARDS below. |
| `ra-offline-toggle-off-fresh-640x480-0f7785e6ed.png` | The row focused on a fresh image (the upgrade shape: `global.retroachievements.offlineproxy` absent from `system.cfg`, `raofflineproxy-ctl status` = `enabled=0 marker=0 service=inactive`): the switch off, HARDCORE MODE off, nothing running. Label and line fit at 640x480 with the switch beside them. |
| `ra-offline-toggle-off-hardcore-on-640x480-0f7785e6ed.png` | Before the first turn-on: HARDCORE MODE switched on and saved (page closed and reopened; `system.cfg` read `hardcore=1`), the new row off. |
| `ra-offline-toggle-dialog-640x480-0f7785e6ed.png` | A on the row: `THIS IS A BETA FEATURE. IT WORKS FOR CASUAL ACHIEVEMENTS ONLY, AND TURNING IT ON TURNS HARDCORE MODE OFF.` (three lines) over `ACHIEVEMENTS YOU EARN OFFLINE ARE SENT TO RETROACHIEVEMENTS WHEN YOU'RE BACK ONLINE.` (two lines), TURN ON focused, NOT NOW beside it; the switch behind the dialog already drawn on, HARDCORE MODE still on. Everything inside the box at 640x480. |
| `ra-offline-toggle-not-now-640x480-0f7785e6ed.png` | After NOT NOW (B): the switch back off, HARDCORE MODE untouched (on). `raofflineproxy-ctl status` unchanged, nothing written. |
| `ra-offline-toggle-on-640x480-0f7785e6ed.png` | After TURN ON: the row on and HARDCORE MODE off, set from the script's `hardcore=0` line. On the guest at that moment: `enabled=1 marker=1 service=active`, `127.0.0.1:8080` listening, `system.cfg` holding `offlineproxy=1`, `hardcore=0`, `offlineproxy.hardcore_was=1`, one journal line `offline RetroAchievements on: hardcore was 1, now 0`. The values held through the page's own save at close. |
| `ra-offline-toggle-after-off-640x480-0f7785e6ed.png` | A on the row while on (no dialog): the row off and HARDCORE MODE back on, from the record. Guest: `enabled=0 marker=0 service=inactive hardcore=1`, `hardcore_was` cleared, nothing on 8080; the next launch's appendconfig read `cheevos_custom_host = ""` and RetroArch `Using host: https://retroachievements.org`. |
| `ra-offline-toggle-page-top-640x480-0f7785e6ed-fr.png` | The page in French: PARAMÈTRES RETROACHIEVEMENTS, the subtitle `!RA! DANS LE COIN D’UN JEU : UN SUCCÈS N’A PAS ENCORE ATTEINT RETROACHIEVEMENTS.` on two lines, MODE DIFFICILE off, RETROACHIEVEMENTS HORS LIGNE / `BÊTA. SUCCÈS EN MODE FACILE SEULEMENT, MÊME SANS CONNEXION.` on one line, the switch on (the toggle was on when the language changed). |
| `ra-offline-toggle-on-service-dead-640x480-0f7785e6ed-fr.png` | The row on while nothing runs -- the state after a **second** reboot with the toggle on: `enabled=1 marker=0 service=inactive`, the unit skipped twice by its ConditionPathExists. `099-networkservices` never resets `CONF` between daemon files, so `007-syncthing` (no `CONF=` line) inherits `raofflineproxy.conf` and deletes it; the first reboot only looked fine because the marker still existed when systemd reached the unit at 1.96 s. The page has no way to show the difference. |
| `ra-offline-toggle-after-off-640x480-0f7785e6ed-fr.png` | A on the row in French: RETROACHIEVEMENTS HORS LIGNE off, MODE DIFFICILE back on (`hardcore put back to 1` in the journal). |
| `ra-offline-toggle-dialog-640x480-0f7785e6ed-fr.png` | The dialog in French: `C’EST UNE FONCTION BÊTA. ELLE NE FONCTIONNE QU’AVEC LES SUCCÈS EN MODE FACILE, ET L’ACTIVER DÉSACTIVE LE MODE DIFFICILE.` (three lines) over `LES SUCCÈS OBTENUS HORS LIGNE SONT ENVOYÉS À RETROACHIEVEMENTS QUAND VOUS ÊTES DE NOUVEAU EN LIGNE.` (three lines), ACTIVER focused, PAS MAINTENANT beside it. Inside the box at 640x480. |
| `ra-offline-toggle-not-now-640x480-0f7785e6ed-fr.png` | After PAS MAINTENANT: the switch back off, MODE DIFFICILE still on. |
| `ra-offline-toggle-on-640x480-0f7785e6ed-fr.png` | After ACTIVER: the row on, MODE DIFFICILE off; the journal `offline RetroAchievements on: hardcore was 1, now 0; raofflineproxy.service active`. |
| `ra-offline-toggle-row-sentence-case-640x480-e1edaaa33b.png` | The row focused on `e1edaaa33b`: OFFLINE RETROACHIEVEMENTS / `Beta. Casual achievements only, even without a connection.` -- sentence case like `Disable loading states, rewind and cheats for more points.` above it and `Compete in high-score and best time leaderboards (requires hardcore).` below; the label stays UPPERCASE. The switch on and HARDCORE MODE off, the state the toggle held through two reboots. |
| `ra-offline-toggle-row-sentence-case-640x480-e1edaaa33b-fr.png` | The same row in French: RETROACHIEVEMENTS HORS LIGNE / `Bêta. Succès en mode facile seulement, même sans connexion.` beside `Désactive les chargements d'état, le rembobinage et les codes pour plus de points.` and `Participez au classement des meilleurs temps et scores (mode difficile requis).`; the switch on, MODE DIFFICILE off. |
