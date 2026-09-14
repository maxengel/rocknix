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

Later still, the **release-candidate** image `31253072d6` (`next`; EmulationStation
`f7430b49d0`, the same ES as the TEST image) on QA pair guest a at **1280x800**
(QEMU's default virtio-gpu mode), no RetroAchievements account (the page shows
without one), the toggle off and **left off** -- guest a is a cloud-sync fixture,
so the TURN ON / NOT NOW dialog is framed on its NOT NOW path only (the switch
put on, the dialog framed, B reverting it; `offlineproxy` unset, no marker, the
service inactive, EmulationStation's pid unchanged afterwards). The
`-1280x800-31253072d6` rows. At this size the menu is a centred box rather
than the full screen, so the RetroAchievements settings list scrolls:
LEADERBOARDS, VERBOSE MODE, RICH PRESENCE, ENCORE MODE follow the offline row
once it is focused. One thing seen only here: in French the *upstream* MODE
DIFFICILE description ("Désactive les chargements d'état, le rembobinage et les
codes pour plus de points.") wraps to two lines at 1280x800, so that row -- not
ours -- is three lines (D-UI-023); it is one line at 640x480 and in English.

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
| `ra-offline-toggle-row-1280x800-31253072d6.png` | RC, 1280x800, English: RETROACHIEVEMENTS SETTINGS with the **OFFLINE ACHIEVEMENTS** row focused (reached 5 downs from the page's first row) -- the label, one sentence-case line "Beta. Casual achievements only.", and an arrow; HARDCORE MODE (off, one-line description) above, LEADERBOARDS / VERBOSE MODE / RICH PRESENCE below. Two lines, nothing clipped; the same shape as the 640x480 frame. |
| `ra-offline-toggle-page-1280x800-31253072d6.png` | RC, 1280x800: the OFFLINE ACHIEVEMENTS page with the switch **off** (focused) and the three info rows, each two lines -- "EARN CASUAL ACHIEVEMENTS WITHOUT A CONNECTION. THEY ARE SENT WHEN YOU'RE BACK ONLINE.", "BETA. CASUAL ACHIEVEMENTS ONLY, SO TURNING IT ON TURNS HARDCORE MODE OFF.", "!RA! IN A GAME'S CORNER MEANS AN ACHIEVEMENT HASN'T REACHED RETROACHIEVEMENTS YET." -- then BACK. Same wraps as at 640x480 (the box is wider, the font larger). |
| `ra-offline-toggle-dialog-1280x800-31253072d6.png` | RC, 1280x800: A on the switch raises the TURN ON / NOT NOW dialog over the page, "THIS IS A BETA FEATURE. IT WORKS FOR CASUAL ACHIEVEMENTS ONLY, AND TURNING IT ON TURNS HARDCORE MODE OFF." on three lines, TURN ON focused; the switch behind shows on until B (NOT NOW's path) puts it back off. Nothing was enabled on the guest. |
| `ra-offline-toggle-row-1280x800-31253072d6-fr.png` | RC, 1280x800, French: PARAMÈTRES RETROACHIEVEMENTS with **SUCCÈS HORS LIGNE** focused -- "Bêta. Succès en mode facile seulement." and an arrow, two lines; CLASSEMENTS, MODE VERBEUX, RICH PRESENCE, MODE ENCORE below. Above it the upstream MODE DIFFICILE row's French description wraps to two lines here (three-line row; see the paragraph above). |
| `ra-offline-toggle-page-1280x800-31253072d6-fr.png` | RC, 1280x800, French SUCCÈS HORS LIGNE page: the switch off, then "OBTENEZ DES SUCCÈS EN MODE FACILE SANS CONNEXION. ILS SONT ENVOYÉS QUAND VOUS ÊTES DE NOUVEAU EN LIGNE.", "BÊTA. SUCCÈS EN MODE FACILE SEULEMENT, DONC L'ACTIVER DÉSACTIVE LE MODE DIFFICILE.", "!RA! DANS LE COIN D'UN JEU : UN SUCCÈS N'A PAS ENCORE ATTEINT RETROACHIEVEMENTS." -- each two lines, RETOUR. |

## RC-3 `5801ceb5fc` -- #175 and #176 verified on guest d (640x480)

Release-candidate image **`5801ceb5fc`** (`next`; EmulationStation `b6b6f3cea4`,
which carries #175's `461e14305`), guest d rebuilt from it, the QA
RetroAchievements account carried in by `tools/qa-accounts`, the link cut and
restored on the QEMU monitor (`set_link net0 off|on`), reads over the serial
socket while offline. `system.loglevel` is `verbose` on this image by default
(`/usr/config/system/configs/system.cfg`), so the launch log was already at the
level #176 needed. EmulationStation's `LogLevel` was raised to `information`
for the second offline cycle so the fix's INFO line would be written; the
shipped level is `warning`, at which only the WARNING and ERROR lines below
appear, and only ERROR lines reach the journal (`Log.cpp` writes those to
stderr; the file log is batched and flushed on rotation, so the lines are read
from `es_log.0.txt` after the next boot).

**#175, offline boot** (three cycles, English then French): after `set_link
net0 off` and a reboot, `eth0` down, the boot sign-in fails
(`[CheckCheevosTokenComponent] Failed to generate a new cheevos token: Could
not resolve hostname`), `global.retroachievements=1`, RETROACHIEVEMENTS on the
MAIN MENU. GAME SETTINGS > RETROACHIEVEMENTS SETTINGS opened (switch on) and
closed with B while still offline: **no dialog**, `system.cfg` still `=1`, and
the flushed log has the fix's line at the second of the close --
`WARNING retroachievements: could not reach RetroAchievements for a token
(Could not resolve hostname); the switch stays as set, and the sign-in runs
when the network is up`. The MAIN MENU rebuilt with RETROACHIEVEMENTS still in
it. Then `set_link net0 on`: the re-check fired within 5 s of NetworkManager's
`device activated` every time, and **twice** signed in (`INFO
[CheckCheevosTokenComponent] Generated a new cheevos token, saving.`, the token
written to `system.cfg` 2 s and 5 s after activation) -- but **once it fired
while DNS was not yet answering** (4.6 s after the link, `Could not resolve
hostname` again) and there is no second attempt before the component's
120-minute schedule; a further link flap rescued it. Reported on #175 as the
one thing left.

**#175, refusal**: password set wrong and the token cleared, reboot online, the
boot check refused (`Failed to generate a new cheevos token: Invalid
user/password combination. Please try again.`), the switch toggled off and on
and the page closed: the DIDN'T ACCEPT dialog, `system.cfg` `=1` after OK, the
entry still on the MAIN MENU. English and French.

**#176**: the account's password replaced by a known dummy (`PLANTEDpw7Qx`),
`Probe.nes` launched through the interface's `POST /launch`, exited by
`input_sense`'s `execute_kill`. `/var/log/exec.log` (383 lines, verbose): the
dummy **0** times; `Added setting: cheevos_password = "<redacted>"` and
`Fetch "retroachievements.password" "nes" "Probe.nes"] (<redacted>)` present;
`cheevos_username` still named. The dummy 0 times in `es_log*.txt`, the
journal and `/var/log/retroarch/`. `rocknix-evidence collect` -> a 108 KB
archive of 21 files, `21 rewritten, 0 left out`; extracted on the guest, the
dummy in **0** files; `logs/exec.log` carries the redacted line; `summary.txt`
ends `credential filter: 21 file(s) rewritten, 0 left out`. No gopher64 (or
any standalone with a password flag) is launchable on the guest -- no ROM --
so the `--ra-password <redacted>` shape stays proven by suite case r only.
Not framed: nothing on screen changes for #176.

| Frame | What it shows |
| --- | --- |
| `175-offline-boot-menu-640x480-5801ceb5fc.png` | RC-3, after the offline boot (`eth0` down, boot sign-in failed, `global.retroachievements=1`, token empty): MAIN MENU with **RETROACHIEVEMENTS** as its first row. |
| `175-offline-ra-settings-before-B-640x480-5801ceb5fc.png` | Still offline: RETROACHIEVEMENTS SETTINGS with the switch **on**, the account (USERNAME 8BitKidQA), HARDCORE MODE off, OFFLINE ACHIEVEMENTS, LEADERBOARDS, VERBOSE MODE -- the page as it is about to be closed with B. |
| `175-offline-after-B-no-dialog-640x480-5801ceb5fc.png` | The frame after B, still offline: GAME SETTINGS with RETROACHIEVEMENTS SETTINGS focused and **no UNABLE TO ACTIVATE dialog** (RC-1 `31253072d6` showed one here and wrote `=0`). `system.cfg` read `=1`; the WARNING line above was logged at this second. |
| `175-offline-main-menu-after-close-640x480-5801ceb5fc.png` | B again: the MAIN MENU rebuilt, **RETROACHIEVEMENTS still its first row** (GAME SETTINGS focused, where we came from). RC-1 rebuilt this menu without the entry. |
| `175-offline-ra-settings-before-B-640x480-5801ceb5fc-fr.png` | The same offline page in French (`fr_FR`): PARAMÈTRES RETROACHIEVEMENTS, the switch on, NOM D'UTILISATEUR / MOT DE PASSE / CLÉ D'API WEB, MODE DIFFICILE with its one-line description `Sans chargement d'état, rembobinage ni codes : plus de points.` (the D-UI-023 line RC-3 also carries), SUCCÈS HORS LIGNE, CLASSEMENTS, MODE VERBEUX. |
| `175-offline-after-B-no-dialog-640x480-5801ceb5fc-fr.png` | After B in French, offline: PARAMÈTRES DES JEUX, PARAMÈTRES RETROACHIEVEMENTS focused, no dialog. `=1`. |
| `175-refused-dialog-640x480-5801ceb5fc.png` | Online, wrong password, token cleared, the switch toggled off then on, B: **RETROACHIEVEMENTS DIDN'T ACCEPT YOUR SIGN-IN: Invalid user/password combination. Please try again.** / **RETROACHIEVEMENTS STAYS ON. CHECK YOUR USERNAME AND PASSWORD, THEN TRY AGAIN.** over GAME SETTINGS, OK. The server's sentence is RetroAchievements' own and stays English. |
| `175-refused-after-ok-640x480-5801ceb5fc.png` | After OK: GAME SETTINGS, RETROACHIEVEMENTS SETTINGS focused; `system.cfg` `global.retroachievements=1`, token empty; the MAIN MENU behind still holds RETROACHIEVEMENTS. |
| `175-refused-dialog-640x480-5801ceb5fc-fr.png` | The same refusal in French: **RETROACHIEVEMENTS N'A PAS ACCEPTÉ VOTRE CONNEXION : Invalid user/password combination. Please try again.** / **RETROACHIEVEMENTS RESTE ACTIVÉ. VÉRIFIEZ VOTRE NOM D'UTILISATEUR ET VOTRE MOT DE PASSE, PUIS RÉESSAYEZ.**, OK -- four lines of ours at 640x480, nothing clipped. |

## #174 -- the Tailscale switch and the setting the boot reads (guest e, 640x480, the 2026-09-12 image `ec12767b26`, before the fix)

The walk `174-toggle.steps`: MAIN MENU -> NETWORK SETTINGS -> up three times from the top (BACK, ZEROTIER ONE, TAILSCALE VPN) -> the switch off, then on, with no tailnet.

- `174-tailscale-row-on-640x480-ec12767b26.png` -- the row, switch on (`tailscale.up=1` set by hand before the walk).
- `174-tailscale-reauth-popup-switch-on-640x480-ec12767b26.png` -- after the switch went on: `TAILSCALE REAUTHENTICATE:` with the login URL, the switch showing **on**. When the page closed, `system.cfg` held `tailscale.up=0` (`IsTailscaleUp()` returned false on `Logged out.`), tailscaled still active; after a reboot `tailscale.up=0`, tailscaled **inactive** -- #174 reproduced. The fix (ES `fix/tailscale-intent`, D-NET-010) is proven with the same walk expecting `1` and an active daemon after the reboot.

## #181 -- system logos after a quick-select jump, before and after the fix (guest d, 640x480)

The recipe: boot on GBA, A into its list, d-pad left five times (quick-select jumps to the neighbouring system's list without passing its system view), B back to the system view. Edge width of the logo (`pngtool.py edge`, crop 120,110 400x180; ~0.4-0.6 is a crisp 1 px edge):

| frame | build | edge |
|---|---|---|
| `181-fbneo-system-view-after-jump-640x480-c5c50a2d5f-before.png` | RC-4 | 0.70 |
| `181-nes-system-view-after-jump-640x480-c5c50a2d5f-before.png` | RC-4 | 1.21 |
| `181-fbneo-system-view-after-jump-640x480-b3189ba85f.png` | RC-5 | 0.42 |
| `181-nes-system-view-after-jump-640x480-b3189ba85f.png` | RC-5 | 0.46 |

The fix: ES `fix/svg-shared-size` `20824cc29` (a shared SVG is rasterised at the largest size any consumer asks for).
- `174-tailscale-reauth-popup-switch-on-640x480-b3189ba85f-after.png` -- RC-5 `b3189ba85f`, the same walk: the popup and the switch as before, but `tailscale.up=1` on disk at once, `1` after the page closed, and after the reboot `tailscaled` **active** (uptime 46 s).

## #179 -- SCAN GAMES FOR OFFLINE ACHIEVEMENTS (guest d, 640x480, RC-5 `b3189ba85f`)

Walk `179/walks/to-game-settings(-2).steps` + `scan-en.steps`: GAME SETTINGS -> RETROACHIEVEMENTS SETTINGS -> OFFLINE ACHIEVEMENTS -> the toggle on -> the scan row -> the confirmation -> the page.

- `179-scan-confirm-dialog-640x480-b3189ba85f.png` -- `SCAN GAMES FOR OFFLINE ACHIEVEMENTS?` and what it does.
- `179-scan-running-640x480-b3189ba85f.png` -- the fourth-tier page while scanning (`GAME n OF 4`, the name, `GAMES ADDED`, spinner, elapsed).
- `179-scan-done-640x480-b3189ba85f.png` -- `COMPLETED · GAMES ADDED: 3 · WITHOUT ACHIEVEMENTS: 1 · 3 GAMES READY FOR OFFLINE PLAY · ELAPSED 0:06`.
- `179-offline-page-after-scan-640x480-b3189ba85f.png` -- the row's line afterwards: `LAST 09/14/2026 04:38 - COMPLETED · 3 GAMES READY FOR OFFLINE PLAY`.

## #180 -- the achievements pages with the link off (guest d, 640x480, RC-5 `b3189ba85f`)

Setup: the QA account in, RETROACHIEVEMENTS on, the proxy on, Tobu started once online (its set cached by hash), Böbl cached by the #179 scan (by id); then `set_link net0 off`. Walk `180-summary-to-game.steps`: MAIN MENU -> RETROACHIEVEMENTS (the summary, offline: `Softcore points: 3 / Points (hardcore): 0 / YOU'RE NOT ONLINE. SHOWING THE GAMES SAVED ON THIS DEVICE.`, Böbl `0% (0 of 12)`, Tobu `4% (1 of 28)` -- that frame carries the account name and is not kept here) -> A on a game.

- `180-game-achievements-offline-tobu-640x480-b3189ba85f.png` -- `Achievements (softcore): 1/28`, `Points: 3/275`, `YOU'RE NOT ONLINE. SHOWING WHAT'S SAVED ON THIS DEVICE.`, `4% complete`, Potato-tan Secret `Unlocked`, badges drawn from the proxy's image cache (the hash path).
- `180-game-achievements-offline-bobl-640x480-b3189ba85f.png` -- Böbl `0/12`, the twelve rows with badges (the id path, cached by the scan).

Not framed: the one-line dialog for a never-cached game (Böbl had been scanned by then), and the "will be sent" marker (needs a real queued unlock, D-RA-006). The game-options entry VIEW THIS GAME'S ACHIEVEMENTS did not appear on this guest even with `cheevosId` in the gamelist -- a pre-existing gate (`FileData::hasCheevos`), fork #183.

## RC-6 `768a0a9f48` -- the RC-5 round's notes (#184), the index-fed cache (D-RA-013), audit #186

Guest d at 640x480 from the RC-6 image (ES `ae9c7d56b`), the QA account in, the pads
(56 Game Boy files RetroAchievements does not know) beside Tobu, Böbl and Ninoid so a scan
outlasts the presses. Driven by `rc6-proofs.sh` (session scripts; phases). The two
RETROACHIEVEMENTS SETTINGS crops start below the account rows: the QA account's name stays
out of the repo.

- `184-ra-settings-row-beta-640x480-768a0a9f48.png` (+ `-fr`) -- the row **OFFLINE ACHIEVEMENTS (BETA)** with the one-line description `Casual achievements only.` / `SUCCÈS HORS LIGNE (BÊTA)`, `Succès en mode facile seulement.` (#184 note 1).
- `184-offline-page-toggle-off-640x480-768a0a9f48.png` -- the page: title **(BETA)**, the switch, the scan row (`TURN ON OFFLINE ACHIEVEMENTS FIRST.`), the gap, one block of text with `'!RA!'` quoted; the block fits at 640x480 with room (#184 note 2, D-UI-054).
- `184-turn-on-dialog-index-sentence-640x480-768a0a9f48.png` -- TURN ON / NOT NOW, with the startup index off: `IT ALSO TURNS ON INDEX NEW GAMES AT STARTUP, SO GAMES YOU ADD LATER ARE SAVED FOR OFFLINE PLAY TOO.` (PL-06). `184-turn-on-dialog-640x480-768a0a9f48-fr.png` -- the same dialog with the index already on: no such sentence.
- `184-scan-now-dialog-640x480-768a0a9f48.png` (+ `-fr`) -- after TURN ON: `SCAN GAMES FOR OFFLINE ACHIEVEMENTS NOW?` and the sentence in full (`...SO ACHIEVEMENTS CAN BE EARNED WHILE OFFLINE. THIS CAN TAKE A WHILE FOR A LARGE LIBRARY.`), SCAN NOW / LATER (#184 notes 3a, 4; D-RA-012).
- `179-scan-page-preparing-640x480-768a0a9f48.png`, `184-scan-page-game-2-of-19-640x480-768a0a9f48.png` -- the scan page: `PREPARING...`, then `SCANNING... GAME 2 OF 19`, `Tobu Tobu Girl Deluxe`, **`GAMES WITH ACHIEVEMENTS ADDED: 1`** and nothing about the ones without, `PRESS B TO KEEP SCANNING IN THE BACKGROUND.` (#184 note 5a, PL-07).
- `184-offline-page-after-scan-640x480-768a0a9f48.png` -- the row `LAST 09/14/2026 13:12 - COMPLETED · 2 GAMES READY FOR OFFLINE PLAY`; the block now ends `NEW GAMES ARE ADDED THE NEXT TIME YOU'RE CONNECTED.` because the switch turned the startup index on (PL-06).
- `186-pl07-row-scanning-game-24-of-57-640x480-768a0a9f48.png`, `...-39-of-57-...` -- B on the scan page: the page is gone, the row reads `SCANNING... - GAME 24 OF 57 · 2 GAMES READY FOR OFFLINE PLAY`, then 39, while the poller saw `raofflineproxy-ctl scan` alive every second (PL-07).
- `186-pl27-switch-off-pending-1s-...`, `186-pl27-pending-focus-moved-...`, `186-pl27-parent-while-pending-...`, `186-pl27-parent-after-ctl-640x480-768a0a9f48.png` -- the switch off with a systemctl shim that sleeps ten seconds on stop: one second in, the switch off and dimmed; down moves the selector; B leaves for RETROACHIEVEMENTS SETTINGS with HARDCORE MODE still off; after the stop (journal 14:45:42-43) HARDCORE MODE is on again (PL-27).
- `186-pl24-row-couldnt-finish-640x480-768a0a9f48.png`, `186-pl24-confirm-last-time-...`, `186-pl24-scan-not-saved-640x480-768a0a9f48.png` -- an index entry naming a game RetroAchievements has never issued (id 999999999): the top-up when the link returned ended `errors=1 why=SOME_GAMES_NOT_SAVED`, the row `COULDN'T FINISH · 2 GAMES READY`, the confirmation `LAST TIME IT COULDN'T FINISH: SOME GAMES COULDN'T BE SAVED. TRY THE SCAN AGAIN.`, the scan page `COULDN'T FINISH`, **`GAMES WITH ACHIEVEMENTS ADDED: 0 · NOT SAVED: 1`** and the sentence (PL-24). `184-scan-done-640x480-768a0a9f48-fr.png` -- the French scan page after Ninoid joined: `TERMINÉ`, `JEUX AVEC SUCCÈS AJOUTÉS : 1`, `3 JEUX PRÊTS POUR JOUER HORS LIGNE`.
- `186-pl09-summary-over-stopped-proxy-640x480-768a0a9f48.png` -- offline, the proxy stopped: the RETROACHIEVEMENTS summary gave up 1.7 s after A with one `did not answer` line (`stopped answering after 0 of 2 cached games; no summary from the device`) and showed the web's error (`Could not resolve hostname`), not an empty list (PL-09, PL-26).
- `180-never-cached-game-answer-640x480-768a0a9f48.png` -- offline, a game the index knows and the proxy never cached: `YOU'RE NOT ONLINE, AND THIS GAME'S ACHIEVEMENTS AREN'T SAVED ON THIS DEVICE YET. SCAN GAMES FOR OFFLINE ACHIEVEMENTS, OR START THE GAME ONCE WHILE YOU'RE CONNECTED.` (#180 box 3, D-RA-011).
- `184-offline-page-640x480-768a0a9f48-fr.png` -- the French page, switch on, the row `N'A PAS PU SE TERMINER · 2 JEUX PRÊTS POUR JOUER HORS LIGNE`, the block with `'!RA!'` and `LES NOUVEAUX JEUX SONT AJOUTÉS À VOTRE PROCHAINE CONNEXION.` (PL-10).

Not framed on RC-6: the GAME INDEXES rows with their offline lines (the walk's three ups landed at the top of the page; RC-7 walks to the foot), the game-options entry and the index heal (the startup index never ran on RC-6, #183 -- RC-7), the hundred-game summary timing (PL-09's other half), and 1280x800.

## RC-7 `3387cf5da0` -- #183: the startup index runs

Guest d from the RC-7 image (ES `9842a0083`), the same fixtures as RC-6. At the connected boot after
the switch went on through the page, the startup index ran two seconds after the interface started
(`Hashing [nes] Bobl`, twenty files hashed; Tobu, planted with a hash and no id, healed from the
library: `ThreadedHasher: id 15738 for [gbc] Tobu Tobu Girl Deluxe from the hash library, no file
read`), then `topup --after-index` cached Ninoid from the index without hashing it
(`topup indexed pass: cached=1 indexed=1`; ids 4902 15738 31199).

- `183-game-options-view-achievements-640x480-3387cf5da0.png` -- Tobu's game options with **VIEW THIS GAME'S ACHIEVEMENTS**, second row, on a guest that had never shown it (#183 boxes 1 and 3; PL-08).
- `184-offline-page-1280x800-3387cf5da0.png` -- the page at 1280x800 (switch on, `NOT SCANNED YET · NO GAMES READY FOR OFFLINE PLAY YET`), the whole block on one screen with its last sentence (PL-10).
- `184-ra-settings-row-beta-1280x800-3387cf5da0.png` -- RETROACHIEVEMENTS SETTINGS at 1280x800 on the way back: HARDCORE MODE off, the (BETA) row with its line.
- `184-game-indexes-rows-1280x800-3387cf5da0.png` -- the GAME INDEXES rows while OFFLINE ACHIEVEMENTS is on: **INDEX NEW GAMES AT STARTUP** (on) with `Also saves new games' achievement data for offline play.` and **INDEX GAMES** with `Also saves their achievement data for offline play.` (#184 note 3b, D-RA-013, PL-10).
- `186-pl09-summary-offline-100-games-1280x800-3387cf5da0.png` -- offline, 100 games cached by id from the hash library (no ROMs): the RETROACHIEVEMENTS summary at 1280x800, `YOU'RE NOT ONLINE. SHOWING THE GAMES SAVED ON THIS DEVICE.`, the list with points and progress per game (cropped below the title, which carries the account name). From the host: the PLEASE WAIT card was on the first screenshot after the press (1.7 s), the list on the second (2.6 s); a key press costs the frame tool ~0.8 s and a screenshot ~0.9 s, so the list was on screen within about 1.7 s of the press landing (PL-09).
