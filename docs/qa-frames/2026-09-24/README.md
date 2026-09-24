# QA frames, 2026-09-24

## #251 -- the sign-in toast's size, framed at the H700's numbers on `6205420b3d`

Guest d at `640x480`, the widget scale set as the H700 config has it
(`menu_widget_scale_factor` 1.0, so the message-queue font comes out at the
same 10 px the handheld draws) and then at 1.4; each launch framed two
seconds in, with the achievement banner in the same frame for reference. A
second pair of launches ran with FreeType's classic full-hinting interpreter
selected through `FREETYPE_PROPERTIES=truetype:interpreter-version=35` on
RetroArch's environment: **the frames were pixel-identical** to the default
ones, so that lever does nothing here without a font or a load-flag change.
The crops stop before the QA account's name.

- `251-toast-10px-vs-15px-4x` -- the toast at 10 px (top) and 15 px
  (bottom), enlarged 4x with nearest-neighbour so each screen pixel is a
  square. Measured along the busiest text row (`solidity.py`, session
  scripts): at 10 px, 41 vertical strokes, none with a fully-lit pixel,
  mean stem 0.76 px of coverage -- every stem is two grey half-columns; at
  15 px, 46 strokes, 10 with a solid core, mean stem 1.40 px.
- `251-banner-17px-vs-24px-3x` -- the achievement banner at 17 px (the
  size the maintainer called sharp: 56 strokes, 21 solid, mean stem 1.37
  px) and at the 1.4 scale, 24 px (51 of 56 solid, 1.87 px), where it
  **runs off the right edge of the 640 px panel** -- which rules the wider
  widget scale out on this device.

So the softness is stroke width against the pixel grid, decided by size:
Inter UI's stems cross one pixel at about 13 px and two at about 25 px on
this renderer, and the sizes the interface picks for a 640x480 panel with no
DPI reported fall below the first threshold for the message queue.

## #251 fixed -- the seventeenth cut `443028ff7a`, the toast at 14 px

- `251-toast-10px-vs-14px-4x` -- the sixteenth cut's 10 px toast (top) and
  the seventeenth's 14 px (bottom), guest d at the H700's widget factor,
  enlarged 4x. Measured over the same text span on the x-height row: 10 px,
  41 strokes, none with a fully-lit pixel, mean stem 0.76 px; 14 px, 44
  strokes, 16 solid (36%), mean stem 1.19 px -- the same solid share as the
  achievement banner's 17 px (38%, 1.37 px). A first read over a shorter
  span said none were solid; the span has to be the same text on every
  size, which is in #255's brief for the measuring tool.

## #192 and #203 -- the startup card's lines and the launch question, on `a84fce38a6` (guest d, 640x480, EN and FR)

Taken for audit #258 PL-025, which found the boxes named frames nobody had
filed. Guest d rebooted its interface with `cloudsaves.startup` on; frames at
0.7 s from the moment `essway` started, over the QA WebDAV cloud at
`--bwlimit 1M`.

| Frame | What it shows |
| --- | --- |
| `192-startup-card-checking-en-640x480-a84fce38a6.png` | link up: `SYNCING SAVES AT STARTUP` / `CHECKING THE CONNECTION...` (#192 case a, D-UI-055) |
| `192-startup-card-checking-fr-640x480-a84fce38a6.png` | the same in French: `SYNCHRONISATION DES SAUVEGARDES AU DÉMARRAGE` / `VÉRIFICATION DE LA CONNEXION...` |
| `192-startup-card-sending-en-640x480-a84fce38a6.png` | the step after: `SENDING · 3 KB OF 3 KB` |
| `192-startup-card-offline-skipped-en-640x480-a84fce38a6.png` | `eth0` down before the interface started: `SYNC SAVES` / `SKIPPED - YOU'RE NOT ONLINE` / `IT'LL TRY AGAIN AT STARTUP, OR SYNC NOW FROM GAME SETTINGS.` -- at once, with no `WAITING FOR A NETWORK` step (below) |
| `192-startup-card-offline-skipped-fr-640x480-a84fce38a6.png` | the same in French: `IGNORÉ - VOUS N'ÊTES PAS EN LIGNE` / `NOUVEL ESSAI AU PROCHAIN DÉMARRAGE.` |
| `203-launch-question-over-startup-sync-fr-640x480-a84fce38a6.png` | `POST /launch` while the startup sync ran: `VOS SAUVEGARDES SE SYNCHRONISENT AVEC LE CLOUD.` / `SI VOUS L'ARRÊTEZ, LA PROCHAINE SYNCHRONISATION FINIRA CE QUE CELLE-CI N'A PAS FAIT.` -- `L'ARRÊTER ET JOUER` / `CONTINUER D'ATTENDRE` (D-CLOUD-130; #203's FR frame, the EN ten were filed on 2026-09-16) |
| `203-after-keep-waiting-sync-goes-on-fr-640x480-a84fce38a6.png` | after B (CONTINUER D'ATTENDRE): the sync goes on, `ENVOI · 8.0 MB SUR 8.0 MB` |

**#192 case b -- `WAITING FOR A NETWORK, UP TO 60 SECONDS...` -- could not be
framed, and the reason is in the scripts, not the fixture.** `cloud_net_ready`
exits 69 at once when there is no default route (D-CLOUD-072: "no route means
no wait, so a device booted offline never holds the launch gate"), and the
card then reads `SKIPPED - YOU'RE NOT ONLINE`; the waiting line is drawn only
while the script waits, and it waits only with a route. Two constructions
were tried on guest d: (1) `eth0` down with a dummy interface asking DHCP of
nobody, so NetworkManager read `connecting` -- no route, exit 69 at once
(`cloud_sync.log`: `no default route after 0s`); (2) the same with a device
route through the dummy -- a route, but `eth0`'s address survived `ip link set
down`, the interface saw a link and said `CHECKING THE CONNECTION...`. The
waiting words need no address on any interface and a default route at the
same time, which no real device has either: a default route rides an address.
Recorded on #192 for the maintainer's call (drop the words, or make the no-route
case wait a bounded few seconds before it says offline).

## #252 -- the third manager walk's frame (guest a, 1280x800, `a84fce38a6`)

`252-walk-manager-gb-1280x800-a84fce38a6.png` is `walks/manager-gb/04-3-manager.png`
from vm-qa run 24 (`qa-a84fce38a6-webdav-a-20260924-0424`): the SAVE STATE MANAGER
on the Game Boy fixture, the third of the three walks #252 box 3 names (nes and
fbn were filed on 2026-09-23). `frame-diff` compared all three against the
`443028ff7a` baseline with 0 boxes.

## #258 PL-019 -- a screenshot turns the moment its record is written, without a restart (guest d, 640x480, `c8609558d4`)

A vertical game the tables do not know (`fbneo/vertprobe.zip`, a stub) and
its screenshot (`screenshots/vertprobe-260901-120300.png`, the raw
landscape capture of a vertical board: the green block on the left). The
SCREENSHOTS list and the viewer framed with no record; then
`turns=1` written by hand over ssh to `savestates/fbn/vertprobe.rotation`
(the synthetic line); the same list and viewer framed again with the same
interface process (`pidof emulationstation` 6518 before and after).

| Frame | What it shows |
| --- | --- |
| `258-pl019-screenshot-list-before-record-640x480-c8609558d4.png` | the list's picture untransformed, the block on the left |
| `258-pl019-screenshot-viewer-before-record-640x480-c8609558d4.png` | the viewer the same |
| `258-pl019-screenshot-list-after-record-same-process-640x480-c8609558d4.png` | after the record: the picture upright, the block at the bottom -- no restart |
| `258-pl019-screenshot-viewer-after-record-same-process-640x480-c8609558d4.png` | the viewer upright |

On `a84fce38a6` and before, the same steps would have shown the first pair
twice: the screenshot cache held the Transform it was built with until the
process ended (audit #258 PL-019; ES `4fd019f04`).
