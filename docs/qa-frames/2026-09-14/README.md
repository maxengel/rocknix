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
