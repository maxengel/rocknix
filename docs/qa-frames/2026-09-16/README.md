# QA frames, 2026-09-16 -- RC-12 build 6 `bc26baa60d` on GENERIC_X64 guest d (640x480)

Build 6 (ES `f26668e7c`) carries the maintainer's eleven decisions of the RC-12 round (#200). Build 7 `586d2334fd` (ES `265540258`) adds D-CLOUD-130: the automatic syncs ask the launch question too. Guest d was upgraded in place from build 5 through `.update`. Taken with `tools/vm-visual-qa` over the QEMU monitor; the `wifictl` stand-in answers `Home Wi-Fi` on the VM, which has no Wi-Fi.

| Frame | Issue | What it shows |
| --- | --- | --- |
| `201-network-settings-wifi-network-label-640x480-bc26baa60d.png` | #201, #200 item 11 | NETWORK SETTINGS: the row is `WI-FI NETWORK  Home Wi-Fi` (D-UI-071), MANAGE SAVED NETWORKS below WI-FI COUNTRY |
| `196-manager-slots-3-and-1-gap-640x480-bc26baa60d.png` | #196, #200 item 6 | Tobu Tobu Girl Deluxe's manager with slot files 3 (12:00) and 1 (10:00) and no slot 2: the gap is shown as it is, no renumbering on open |
| `196-manager-delete-slot-1-dialog-640x480-bc26baa60d.png` | #196 | Y on the 10:00 tile (slot 1): ARE YOU SURE YOU WANT TO DELETE THIS ITEM? YES / NO |
| `196-manager-after-delete-slot-3-kept-640x480-bc26baa60d.png` | #196 | After YES: the 12:00 tile and AUTO SAVE remain; on disk `Tobu Tobu Girl Deluxe.state3` keeps its number (upstream renamed it to slot 1). A launch from it and a quit afterwards left `state3` untouched (mtime 12:00) and rewrote the auto save (D-UI-069) |
| `202-manager-title-fr-640x480-bc26baa60d.png` | #202 | Böbl's manager in French: the title `GESTIONNAIRE DES SAUVEGARDES D'ÉTAT` (it showed in English before build 5), NOUVELLE PARTIE, three dated slots |
| `203-question-over-exit-sync-640x480-586d2334fd.png` | #203, D-CLOUD-130 | Build 7: a game quit with SYNC SAVES WHEN EXITING A GAME on (guest d pointed at its own QA folder `/GAMES-d` at 8 KB/s), then a launch during the card `SYNCING SAVES TO THE CLOUD 79 KB OF 421 KB`: the same question as over a player's sync -- until build 6 this sync was cancelled without asking |
| `203-game-after-stopping-exit-sync-640x480-586d2334fd.png` | #203, D-CLOUD-130 | After STOP IT AND PLAY: the sync's group took about nine seconds to die behind the spinner, then Böbl started; the stamp `last-sync-exit` reads `… 130 cancelled` (SKIPPED - YOU STARTED A GAME) |

Not framed: the two French offline lines (`HORS LIGNE : …`, D-UI-067) -- the main menu's START key was swallowed on every attempt after an interface restart tonight while A and B registered, so the offline summary was not reached in French; the lines are one-line translation changes shorter than the English that fits.
