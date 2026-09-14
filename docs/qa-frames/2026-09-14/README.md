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
