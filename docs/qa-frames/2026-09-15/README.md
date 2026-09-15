# QA frames, 2026-09-15 -- RC-11 on GENERIC_X64 guest d (640x480)

Builds: RC-11 build 1 `66bfd20330` (ES `137309b7d`) and build 2 `a6d032bf5e` (ES `8d5ad005d`, adds #199). RC-12 build 1 `2514d317f7` (ES `7dd9de6a1`): the maintainer's two calls on the RC-11 round (#191, D-UI-061/062), on guest d upgraded in place from RC-11 build 2. RC-12 build 2 `0242500826` (ES `e7d5029fb`, `wifictl join`): the phone paradigm for Wi-Fi (#201, D-UI-063/064), on guest d upgraded in place again, the `wifictl` stand-in answering two saved networks (Home Wi-Fi in use, Cafe: Guest) and three in range (those two and Library). RC-12 build 3 `f2ee6415cd` (ES `34523d1ac`): the save state manager's tile labels a point smaller (#202). The build is the last
token of each file name. Frames that showed the QA account's name (the summary page's title, RetroArch's login toast) carry a
black box over it; nothing else is edited. Taken with `tools/vm-visual-qa` over the QEMU monitor; the tool's own press-and-
screenshot latency is about 1.7 s and sits inside every timing quoted in the QA log.

| Frame | Issue | What it shows |
| --- | --- | --- |
| `190-summary-offline-stale-state-640x480-a6d032bf5e.png` | #190 (a) | Link cut and the address dropped, the proxy's state file still saying online: the device's list 4.6 s after A, the line `YOU'RE OFFLINE. SHOWING THE GAMES SAVED FOR OFFLINE PLAY.` (D-RA-021), per-game bars on a visible track |
| `190-summary-web-unreachable-640x480-a6d032bf5e.png` | #190 (b) | Link up, the resolver dead: the wait ended 1.7 s after A, the device's list |
| `190-summary-offline-fr-640x480-a6d032bf5e.png` | #190 box 1 | The same page in French: `VOUS ÊTES HORS LIGNE. VOICI LES JEUX ENREGISTRÉS POUR JOUER HORS LIGNE.` |
| `199-summary-offline-200-games-icons-absent-640x480-a6d032bf5e.png` | #199 | 200 games cached by id (no icons), link cut: the list 4.6 s after A with blank icon slots; the interface's one `raofflineproxy-ctl summary` call in its log, no per-game request |
| `194-login-toast-offline-640x480-66bfd20330.png` | #194 | 3 s after an offline launch through the proxy: `RetroAchievements: Logged in as "<name>" (offline).` inside its backdrop (RetroArch patches 0013/0014, proxy patch 011) |
| `196-manager-before-launch-24h-640x480-66bfd20330.png` | #196, #195 | Böbl's SAVE STATE MANAGER before the slot launch: START NEW GAME, the dated slot `02:16`, AUTO SAVE `02:08`; 24-hour clock |
| `196-manager-after-quit-640x480-66bfd20330.png` | #196 | After launching that slot (`-e 1` in exec.log) and quitting: AUTO SAVE carries the quit time `02:17`, the slot tile keeps `02:16`; no `.bak` on the card |
| `195-manager-12h-en-640x480-66bfd20330.png` | #195 | SHOW CLOCK IN 12-HOUR FORMAT on: `02:17 AM` / `02:16 AM` |
| `195-manager-12h-fr-640x480-66bfd20330.png` | #195 | The same in French: `SAUV. AUTO 15/09/2026 02:17 AM`, `NOUVELLE PARTIE` |
| `193-game-page-offline-fr-640x480-66bfd20330.png` | #193 | Böbl's achievements page offline in French: the percentage and the bar on one line on a visible track; the French line wraps onto the bar's row (follow-up on the issue) |
| `191-network-settings-live-ssid-640x480-a6d032bf5e.png` | #191 | NETWORK SETTINGS: the WI-FI SSID row's line `CONNECTED TO Home Wi-Fi` (a stand-in `wifictl` answers on the VM, which has no Wi-Fi); the MANAGE NETWORKS row |
| `191-manage-networks-640x480-a6d032bf5e.png` | #191 | MANAGE NETWORKS: `Home Wi-Fi  IN USE`, `Cafe: Guest` |
| `191-forget-dialog-640x480-a6d032bf5e.png` | #191 | `FORGET Home Wi-Fi?` with the consequence, YES / NO |
| `191-after-forget-toast-640x480-a6d032bf5e.png` | #191 | The toast `Home Wi-Fi : FORGOTTEN, AND YOU'RE DISCONNECTED` and the list rebuilt |
| `182-cloud-rows-dimmed-no-cloud-640x480-a6d032bf5e.png` | #182 | GAME SETTINGS with no cloud configured: the CLOUD SETTINGS rows dimmed on this frame, not only on the first |
| `191-network-settings-same-network-640x480-2514d317f7.png` | #191 (RC-12) | NETWORK SETTINGS with the device on the configured network (the stand-in answers `Home Wi-Fi`, `wifi.ssid` = `Home Wi-Fi`): WI-FI SSID is one line, no name repeated (D-UI-061); the MANAGE SAVED NETWORKS row below WI-FI COUNTRY (D-UI-062) |
| `191-network-settings-other-network-640x480-2514d317f7.png` | #191 (RC-12) | The stand-in answers `Cafe: Guest`: the row has grown the line `CONNECTED TO Cafe: Guest`, the value still `Home Wi-Fi`, the rows below moved down |
| `191-network-settings-not-connected-640x480-2514d317f7.png` | #191 (RC-12) | No active network: `NOT CONNECTED` under the label |
| `191-network-settings-could-not-check-640x480-2514d317f7.png` | #191 (RC-12) | The stand-in exits 2 for `current` (NetworkManager not answering): `COULDN'T CHECK` |
| `191-manage-saved-networks-640x480-2514d317f7.png` | #191 (RC-12) | MANAGE SAVED NETWORKS: group `SAVED NETWORKS`, `Home Wi-Fi  IN USE`, `Cafe: Guest` |
| `191-network-settings-other-network-fr-640x480-2514d317f7.png` | #191 (RC-12) | The other-network row in French: `CONNECTÉ À Cafe: Guest`; the row `GÉRER LES RÉSEAUX ENREGISTRÉS` |
| `191-manage-saved-networks-fr-640x480-2514d317f7.png` | #191 (RC-12) | The page in French: `GÉRER LES RÉSEAUX ENREGISTRÉS`, `RÉSEAUX ENREGISTRÉS`, `UTILISÉ` beside the one in use |
| `201-network-settings-row-640x480-0242500826.png` | #201 | NETWORK SETTINGS: WI-FI SSID's value is the network the device is on, `Home Wi-Fi`, with an arrow; no line under the label (D-UI-063) |
| `201-picker-640x480-0242500826.png` | #201 | A on the row: WI-FI NETWORKS -- `Home Wi-Fi  CONNECTED` first, `Cafe: Guest  SAVED`, `Library`; REFRESH, INPUT MANUALLY, BACK (D-UI-064) |
| `201-joined-toast-640x480-0242500826.png` | #201 | A on Cafe: Guest (saved, no key asked): after the spinner, the toast `CONNECTED TO Cafe: Guest` over the rebuilt page, the row now `Cafe: Guest`; `wifi.ssid` / `wifi.key` moved by `wifictl join` |
| `201-picker-after-join-640x480-0242500826.png` | #201 | The picker again: `Cafe: Guest  CONNECTED` first, `Home Wi-Fi  SAVED`, `Library` |
| `201-key-popup-640x480-0242500826.png` | #201 | A on Library (not saved): the WI-FI KEY on-screen keyboard; START accepts (empty for an open network) |
| `201-connected-new-network-640x480-0242500826.png` | #201 | After the spinner: `CONNECTED TO Library`, the row `Library`, the WI-FI KEY row empty as typed; the stand-in now holds Library as a saved network |
| `201-connect-failed-dialog-640x480-0242500826.png` | #201 | The stand-in refusing the connect: `COULDN'T CONNECT TO Library.` / `CHECK THE KEY AND TRY AGAIN.` over the picker; the row afterwards still `Home Wi-Fi`, the settings untouched |
| `201-join-failed-dialog-640x480-0242500826.png` | #201 | The stand-in refusing the join: `COULDN'T CONNECT TO Cafe: Guest.` / `IF ITS KEY HAS CHANGED, FORGET IT UNDER MANAGE SAVED NETWORKS AND JOIN IT AGAIN WITH THE NEW KEY.` |
| `201-network-settings-row-fr-640x480-0242500826.png` | #201 | The row in French: `NOM DU RÉSEAU WI-FI  Library` (the WI--FI typo of the French labels fixed in this build), `GÉRER LES RÉSEAUX ENREGISTRÉS` |
| `201-picker-fr-640x480-0242500826.png` | #201 | The picker in French: `RÉSEAUX WI-FI`, `Library  CONNECTÉ`, `Cafe: Guest  ENREGISTRÉ`, `Home Wi-Fi  ENREGISTRÉ`; RAFRAÎCHIR, SAISIE MANUELLE, RETOUR |
| `202-manager-labels-en-640x480-f2ee6415cd.png` | #202 | Tobu Tobu Girl Deluxe's SAVE STATE MANAGER on build 3: START NEW GAME and `AUTO SAVE / 09/15/2026 02:43` at 15 px (a point under the small font); compare `196-manager-*-66bfd20330.png` |
| `202-manager-labels-fr-640x480-f2ee6415cd.png` | #202 | Böbl's manager in French: `NOUVELLE PARTIE`, `SAUV. AUTO 15/09/2026 02:44`; the title SAVE STATE MANAGER has no French line yet |

Not framed this round: the startup card's first step (#192; the VM guest had no working cloud remote at boot -- the words are unit-tested,
the RG SP's normal boot is the check), a transfer left running (#187; the nine suites' walks passed on both builds), the English
game page (#193; the string is in the binary, the French frame shows the layout), 1280x800 variants, START NEW GAME after #196.
