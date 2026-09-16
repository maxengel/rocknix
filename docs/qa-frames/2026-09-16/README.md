# QA frames, 2026-09-16 -- RC-12 build 6 `bc26baa60d` on GENERIC_X64 guest d (640x480)

Build 6 (ES `f26668e7c`) carries the maintainer's eleven decisions of the RC-12 round (#200). Guest d was upgraded in place from build 5 through `.update`. Taken with `tools/vm-visual-qa` over the QEMU monitor; the `wifictl` stand-in answers `Home Wi-Fi` on the VM, which has no Wi-Fi.

| Frame | Issue | What it shows |
| --- | --- | --- |
| `201-network-settings-wifi-network-label-640x480-bc26baa60d.png` | #201, #200 item 11 | NETWORK SETTINGS: the row is `WI-FI NETWORK  Home Wi-Fi` (D-UI-071), MANAGE SAVED NETWORKS below WI-FI COUNTRY |
| `196-manager-slots-3-and-1-gap-640x480-bc26baa60d.png` | #196, #200 item 6 | Tobu Tobu Girl Deluxe's manager with slot files 3 (12:00) and 1 (10:00) and no slot 2: the gap is shown as it is, no renumbering on open |
| `196-manager-delete-slot-1-dialog-640x480-bc26baa60d.png` | #196 | Y on the 10:00 tile (slot 1): ARE YOU SURE YOU WANT TO DELETE THIS ITEM? YES / NO |
| `196-manager-after-delete-slot-3-kept-640x480-bc26baa60d.png` | #196 | After YES: the 12:00 tile and AUTO SAVE remain; on disk `Tobu Tobu Girl Deluxe.state3` keeps its number (upstream renamed it to slot 1). A launch from it and a quit afterwards left `state3` untouched (mtime 12:00) and rewrote the auto save (D-UI-069) |
| `202-manager-title-fr-640x480-bc26baa60d.png` | #202 | Böbl's manager in French: the title `GESTIONNAIRE DES SAUVEGARDES D'ÉTAT` (it showed in English before build 5), NOUVELLE PARTIE, three dated slots |

Not framed: the two French offline lines (`HORS LIGNE : …`, D-UI-067) -- the main menu's START key was swallowed on every attempt after an interface restart tonight while A and B registered, so the offline summary was not reached in French; the lines are one-line translation changes shorter than the English that fits.
