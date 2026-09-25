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

## #182 -- the gated cloud rows dimmed at 1280x800 (guest b, fresh, no cloud, `c8609558d4`)

`182-cloud-rows-dimmed-no-cloud-1280x800-c8609558d4.png`: the CLOUD hub on a
guest with no `rclone.conf` -- BACK UP TO THE CLOUD, RESTORE FROM THE CLOUD
and MATCH THIS DEVICE TO THE CLOUD drawn dimmed while the SAVE MANAGEMENT
rows are full; a second frame a second later was byte-identical (md5
`550e3ce3`), so the dim holds across frames (`ComponentList::render`
recolours every element every frame; ES `d9fa93bf2`'s `setDimmed` re-applies
it). `...-cursor-moved-...png`: the cursor on RESTORE, the rows still dimmed.
The 640x480 frame is RC-11's (`182-cloud-rows-dimmed-no-cloud-640x480-a6d032bf5e.png`).

## #263 -- RetroArch's surface on the guest: 1:1 against scaled (2026-09-24, `c041be7e98`, guest d, `video_driver = gl`)

- `263-saved-state-notification-14px-surface-640x480` -- `video_fullscreen_x/y` set to
  640/480: RetroArch's log reads `Using resolution 640x480`, and the saved-state
  notification (the message-queue font at the 14 px floor, widget factor 1.0) has
  single-column stems in its letters -- FreeType's hinted output, as
  `tools/font-stems` renders it on the host.
- `263-saved-state-notification-surface-240x256-scaled` -- the shipped GENERIC_X64
  values (`video_fullscreen_x/y = 0`): RetroArch's log reads `Using resolution
  240x256`, sway scales the surface to the panel, and the same notification's stems
  are two grey columns wide. This is the picture every RetroArch frame read off a
  guest before #263 showed, #251's measurements included; the H700 ships
  `video_fullscreen_x = 640` and never drew this way. `video_windowed_fullscreen =
  true` alone did not change the surface.

## #195 -- YESTERDAY on the save state tiles (2026-09-24, `d27858eb70`, guest d, 640x480)

- `195-manager-yesterday-and-today-640x480` -- the SAVE STATE MANAGER for Bobl with
  the auto save dated today 17:07 and slot 0 dated yesterday 14:03: the tiles read
  `AUTO SAVE / 17:07` and `SLOT 0 / YESTERDAY 14:03` (D-UI-087; the day rule is
  `Utils::Time::dayRelation`, the manager walk `tools/vm-walks/manager.steps`).
  French (HIER) and the date form for older saves are owed on the next walk.
  Superseded the same evening by the `664ad9ac64` frame below (D-UI-089).
- `195-manager-today-yesterday-older-at-640x480` -- the same manager on the
  twenty-second cut (`664ad9ac64`, ES `296aa5966`) with the auto save dated today
  09:07, slot 0 yesterday 14:03 and slot 1 on 2026-09-01 12:00: the tiles read
  `TODAY at 09:07`, `YESTERDAY at 14:03` and `09/01/26 at 12:00` -- the three
  forms of D-UI-089 in one frame, the year two digits, the lowercase `at` between
  the day and the time. Guest d, `tools/vm-walks/manager.steps`; the states are
  three 4 KB stubs with the fixture thumbnail, touched to those times, and the
  guest was rebooted first because ES's file cache had already recorded the
  savestates directory as absent (`es-native-ui.md`, the uncached-read trap).
  French (HIER, AUJOURD'HUI, `à`) is still owed a frame.
- `245-250-manager-fbn-vertical-tile-and-arrow-1280x800` and
  `250-manager-nes-horizontal-tile-and-arrow-1280x800` -- the SAVE STATE MANAGER
  for a vertical FBNeo game (Ms. Pac-Man) and a horizontal NES one (Bobl), from
  the walk baseline accepted on `664ad9ac64`: the capture tile upright at the
  game's own aspect for both (#245, #243) and the START NEW GAME arrow the same
  one arrow, one direction, one size on each (#250). These are the walks
  `tools/vm-walks/manager.steps` produces on every vm-qa run, so a change to
  either fails `frame-diff` against this baseline -- which is what closes the
  two issues rather than a person looking at a handheld (D-QA-044).
