# QA frames, 2026-09-14 -- offline RetroAchievements phase 2b (#173, #165, #166)

Feature-branch **TEST** image `609f1df917` (distribution `feature/ra-offline`
tip; EmulationStation `feature/ra-offline` `f7430b49d0`), on guest d at 640x480
(`-device virtio-gpu-pci,xres=640,yres=480`), the QA RetroAchievements account
carried in by `tools/qa-accounts`, the QA WebDAV backend (`tools/cloud-test-backend`,
remote `qa-cloud`, `SAVES_REMOTE=/QA-d/Saves`) for the exit sync card. No
handheld, no real cloud account. Every frame is a QEMU `screendump`
(`tools/vm-visual-qa` / a burst loop), driven over the monitor and serial sockets.

The guest's QEMU had `-device i6300esb -action watchdog=reset`; systemd armed
it at a 15 s hardware timeout, and a guest hang during the run tripped it and
hard-reset the VM twice, which lost the toggle's on-marker and my post-rebuild
`/storage` writes. Relaunched the same disk without the watchdog for the rest
of the run. On a clean (non-watchdog) reboot the toggle survives: raofflineproxy
started at ~2.0 s before EmulationStation at ~3.5 s, `enabled=1 marker=1
service=active`, no unmet-condition skip -- the 099-networkservices marker fix
(`unset STATE SVC CONF DAEMONS`) is present and working on this image.

The offline-achievements exit/startup cards carry the awards-pending
(`OFFLINE ACHIEVEMENTS WILL BE SENT NEXT TIME YOU'RE CONNECTED.`) and flushed
(`OFFLINE ACHIEVEMENTS HAVE BEEN SENT TO RETROACHIEVEMENTS.`) sentences; those
two are verified in the ES source (`ThreadedCloudSync.cpp`,
`OfflineAchievements.cpp`) but are **not framed here** -- no genuinely new
offline unlock was reachable on the VM within budget (see the #173 comment),
and the store was not faked. The saves-only branch of the same card is framed.

Later the same day, after the maintainer reset the QA account's progress on
Tobu Tobu Girl Deluxe at retroachievements.org, the two sentences above WERE
framed, by `tools/ra-offline-test` (the `ra-offline` suite of `tools/vm-qa`,
#166) running the scenario end to end on the same image and guest -- first
with the toggle off (the control, #162's loss: the award fired offline and
was never recorded), then with the toggle on (queued, `pending=1`, flushed 11 s
after the link returned, the stamp, RetroAchievements' API answering earned
`2026-09-14 02:51:28`, the relaunch reading 27/28). The `ra-offline-control-*`
and `ra-offline-exit-awards-pending` / `ra-offline-flushed` rows are those runs'
frames; the tool's 20-frame bursts after each game exit are under
`/workspace/artifacts/rocknix-images/qa-609f1df917-webdav-d-20260914-0249/ra-offline-frames/`.

| Frame | What it shows |
| --- | --- |
| `ra-offline-set-28-not-29-640x480-609f1df917.png` | Tobu Tobu Girl Deluxe launched online through the proxy: RetroArch's card reads "You have 1 of 28 achievements unlocked" -- the set is **28, not 29**. RetroArch's log had `Set 6292: 27/28 achievements active`, no `Awarding achievement 101000001`; the proxy's cached `achievementsets` body held 28 achievements, 101000001 absent, flags all 3 (patch 002 / D-RA-005). |
| `ra-offline-ra-settings-page-640x480-609f1df917.png` | GAME SETTINGS > RETROACHIEVEMENTS SETTINGS: RETROACHIEVEMENTS on, the account (USERNAME 8BitKidQA), HARDCORE MODE off, and the **OFFLINE ACHIEVEMENTS** row -- one sentence-case line "Beta. Casual achievements only." with an arrow, sitting between HARDCORE MODE and LEADERBOARDS. |
| `ra-offline-page-640x480-609f1df917.png` | The OFFLINE ACHIEVEMENTS page: the switch (on), then three two-line info rows -- "EARN CASUAL ACHIEVEMENTS WITHOUT A CONNECTION. THEY ARE SENT WHEN YOU'RE BACK ONLINE.", "BETA. CASUAL ACHIEVEMENTS ONLY, SO TURNING IT ON TURNS HARDCORE MODE OFF.", and the `!RA!` sentence "!RA! IN A GAME'S CORNER MEANS AN ACHIEVEMENT HASN'T REACHED RETROACHIEVEMENTS YET." No subtitle on the parent; each row two lines (D-UI-023). |
| `ra-offline-turn-on-dialog-640x480-609f1df917.png` | Turning the switch off then on raises the TURN ON / NOT NOW dialog: "THIS IS A BETA FEATURE. IT WORKS FOR CASUAL ACHIEVEMENTS ONLY, AND TURNING IT ON TURNS HARDCORE MODE OFF." (TURN ON focused). |
| `ra-offline-exit-card-saves-only-640x480-609f1df917.png` | The exit sync card, offline, toggle on but no award queued (`cloudsaves.gameexit=1`, remote configured): SYNC SAVES / **SKIPPED - YOU'RE NOT ONLINE** / **SAVES WILL BE SYNCED NEXT TIME YOU'RE CONNECTED.** The two-part clause does not fit at 640x480, so the action line falls through to the saves sentence alone (as the report predicts). |
| `ra-offline-ra-settings-page-640x480-609f1df917-fr.png` | French (`system.language=fr_FR`): PARAMÈTRES RETROACHIEVEMENTS, the **SUCCÈS HORS LIGNE** row with "Bêta. Succès en mode facile seulement." and an arrow; MODE DIFFICILE off above it. |
| `ra-offline-page-640x480-609f1df917-fr.png` | French SUCCÈS HORS LIGNE page: the switch, then "OBTENEZ DES SUCCÈS EN MODE FACILE SANS CONNEXION. ILS SONT ENVOYÉS QUAND VOUS ÊTES DE NOUVEAU EN LIGNE.", "BÊTA. SUCCÈS EN MODE FACILE SEULEMENT, DONC L'ACTIVER DÉSACTIVE LE MODE DIFFICILE.", and "!RA! DANS LE COIN D'UN JEU : UN SUCCÈS N'A PAS ENCORE ATTEINT RETROACHIEVEMENTS." -- each two lines. |
| `ra-offline-exit-card-saves-only-640x480-609f1df917-fr.png` | The exit sync card in French with the toggle **off** (`raofflineproxy-ctl disable`, offline exit): SYNCHRONISER LES SAUVEGARDES / SKIPPED - YOU'RE NOT ONLINE / **LES SAUVEGARDES SERONT SYNCHRONISÉES À VOTRE PROCHAINE CONNEXION.** The action-line sentence is translated; the outcome word (SKIPPED - YOU'RE NOT ONLINE) has no French yet, as the report notes. |
| `ra-offline-control-exit-offline-640x480-609f1df917.png` | The control (toggle **off**, `raofflineproxy-ctl disable`, `cloudsaves.gameexit=1`): Tobu Tobu Girl Deluxe launched online direct (`Using host: https://retroachievements.org`, `Set 6292: 28/28 achievements active`), the link cut, `Awarding achievement 100359: Potato-tan Secret` from the MAIN MENU carousel, RetroArch's own `Error awarding achievement 100359: No response, retrying in 4 seconds`, then `execute_kill` with eth0 down. The exit sync card ~1 s later: SYNC SAVES / **SKIPPED - YOU'RE NOT ONLINE** / **SAVES WILL BE SYNCED NEXT TIME YOU'RE CONNECTED.** -- the saves-only sentence, no word about achievements, because nothing waits anywhere (`raofflineproxy-ctl pending` = 0, exit 1). No `DON'T WORRY, NOTHING CHANGED.` line on this card. |
| `ra-offline-control-locked-640x480-609f1df917.png` | The same game's achievements page on the device after the control, the link back for several minutes: X on the game > VIEW THIS GAME'S ACHIEVEMENTS (the gamelist given `<cheevosId>15738</cheevosId>` by hand, since the unscraped one has none): **Achievements (softcore): 0/28**, (hardcore) 0/28, Points 0/275, 0% complete. RetroAchievements' API 90 s after the link returned: `100359` NOT earned; the relaunch online read `28/28 achievements active` again. #162's loss, reproduced: the unlock RetroArch awarded offline went nowhere. |
| `ra-offline-control-locked-row-640x480-609f1df917.png` | The bottom of that page, **Potato-tan Secret -- Listen to the hidden song. - Points: 3** focused with its greyed badge and no `Unlocked on` line, between The Song That Never Ends and Stomping Apprentice. |
| `ra-offline-exit-awards-pending-640x480-609f1df917.png` | The suite run (toggle **on**): the same unlock through the proxy (`Using host: 127.0.0.1:8080`, `28/28 active` -- 28 not 29, no `101000001` award in the session), `Achievement 100359: queued_offline`, proxy `Queued offline award: achievementId=100359`, then `execute_kill` with eth0 down and the proxy's `online_state.json` already false. The exit sync card ~1 s later: SYNC SAVES / **SKIPPED - YOU'RE NOT ONLINE** / **OFFLINE ACHIEVEMENTS WILL BE SENT NEXT TIME YOU'RE CONNECTED.** -- D-RA-004's awards-pending sentence, fed by `raofflineproxy-ctl pending` = 1. |
| `ra-offline-flushed-640x480-609f1df917.png` | The next connected exit card, after `set_link net0 on`: the proxy logged `Connectivity restored; attempting flush` and `Flush complete: total=1 flushed=1 skipped_deleted=0 skipped_stale=0 pending_remaining=0` 11 s after the link returned and left `last-flush` = `1789354334 1`; the relaunch online read `Set 6292: 27/28 achievements active`; its exit ran the card online: SYNC SAVES / **COMPLETED** / **OFFLINE ACHIEVEMENTS HAVE BEEN SENT TO RETROACHIEVEMENTS.** (the stamp read and cleared by the card). RetroAchievements' API: `100359` earned `2026-09-14 02:51:28`, the unlock's own moment. |
| `ra-offline-recorded-640x480-609f1df917.png` | The same achievements page after the suite run (account put back on for the frame, guest rebooted): **Achievements (softcore): 1/28**, 4% complete, Points 3/275, and the first row in colour -- **Potato-tan Secret -- Listen to the hidden song. - Points: 3 -- Unlocked on: 2026-09-14 02:51:28** -- the moment RetroArch awarded it offline (the proxy's `queuedAt=1789354288002`), not the flush's 02:52:14: RA applied the proxy's `offsetSeconds`, as the 09-13 proof also saw. The control's frame above is this page with 0/28. |
