# QA frames, 2026-09-23

## #245 -- a game's captures turned by the rotation the display gave its frame (D-UI-081), on `ed61a18d5c`

Guest d at `640x480`, seeded with fixtures that carry a bright green mark on
the raw frame's right edge -- where a vertical arcade game's capture has the
game's top, since RetroArch's rotation 1 is a quarter turn counter-clockwise
-- and a record of one turn beside each game's states (`Bobl.rotation`,
`Ninoid.rotation`: `turns=1`). `measure-243.py` reports the ring's box and
which side of it the mark sits on; upright means the mark is above.

- `245-before-screenshots-list-mark-right` -- the tenth cut (`bf53cea7e4`):
  the record existed and read as empty (two bytes, under readAllText's
  byte-order-mark check), so the picture kept the file's turn, mark on the
  right, landscape.
- `245-after-manager-nes-tiles-upright` -- SAVE STATE MANAGER, Bobl (NES):
  both tiles portrait (the 4:3 shape turned), ring 73x73 round, mark above.
- `245-after-manager-gb-tile-upright` -- Ninoid (Game Boy): the 160x144
  file turned, ring 89x89, mark above.
- `245-after-screenshots-list-nes-upright` -- the SCREENSHOTS list's
  picture: Bobl's screenshot portrait, ring 141x141, mark above (the theme's
  bound extra takes the transform).
- `245-after-screenshots-list-gb-upright` -- Ninoid's, ring 172x172, mark
  above.
- `245-after-viewer-nes-upright` -- A on Bobl's screenshot: the full-screen
  viewer, portrait, ring 305x304, mark above.

## #248 -- a capture with no session record takes its turn from the core's table (D-UI-082), on `428d44af40`

Guest d, seeded with Ms. Pac-Man's ROM name under the FBNeo system (`fbn`),
a save state whose thumbnail carries the green mark on the raw frame's
LEFT edge -- the game's top for rotation 3, which is what FBNeo asks for a
VERTICAL | FLIPPED game -- a screenshot named for it, and **no rotation
record**; the turn can only come from `/usr/config/emulationstation/rotation/fbneo.txt`
(2,544 games, generated from the core's driver flags at build time).

- `248-after-manager-mspacman-upright-from-table` -- SAVE STATE MANAGER for
  Ms. Pac-Man: the tile portrait, ring 68x69 round, mark above. No session
  was ever played.
- `248-after-screenshots-list-mspacman-upright-from-table` -- the
  SCREENSHOTS list on Ms. Pac-Man's screenshot: portrait, ring 132x133,
  mark above.
- `248-after-manager-galaga-mame2003plus-upright-from-table` -- the
  thirteenth cut (`9221b4528d`): Galaga's ROM name under the `arcade`
  system, whose core is MAME 2003-plus, a left-marked thumbnail and no
  record: the tile portrait, ring 68x69, mark above -- from
  `mame2003_plus.txt` (1,643 games), one of the four tables this cut adds
  (MAME 2003-plus, MAME 2010, FB Alpha 2012 and 2019, beside FBNeo's).
- `248-after-screenshots-list-galaga-cheevo-name-upright` -- the SCREENSHOTS
  list on `galaga-cheevo-123456.png`, the name RetroArch gives the
  screenshot it takes at an achievement unlock: recognised now, portrait,
  ring 132x133, mark above.

## #250 -- the manager's arrow tiles as they always were, on `aa8d525a8a`

Guest d at `640x480`, the fixtures of #245 (a turn recorded for Ms. Pac-Man
under `fbn` and Bobl under `nes`; Ninoid under `gb` untouched). The transform
of #243 and #245 had been set on the manager's whole grid, so the arrow on
START NEW GAME and START NEW AUTO SAVE (`:/freeslot.svg`, a placeholder
state with no capture) took it too. `arrow-bbox.py` reports the bright
arrow's box inside that tile; before either change -- the 2026-09-21 frame
`195-save-state-manager-24h-640x480-77e7e97515` and the manager frames on
file from 09-15 on -- it is 54x43 at x 55..108, y 306..348.

- `250-before-manager-nes-arrow-fitted-4x3` -- the fifth cut (`5d8bc093c7`,
  #243 alone): Bobl under `nes`. An NES game fits at 4:3, and so did the
  arrow: 84x38, wide and flat -- the "scaled to reflect how we're scaling
  the system" the maintainer saw. The same cut left a Game Boy game's arrow
  alone (54x43), the Game Boy having no aspect entry.
- `250-before-manager-fbn-arrow-turned` -- the thirteenth cut
  (`9221b4528d`, #245 on top): Ms. Pac-Man, the capture tile portrait with
  the mark above, and the arrow pointing down (50x65).
- `250-after-manager-{fbn,nes,gb}-arrow-unchanged` -- the fifteenth cut:
  the same three managers. The arrow tile (x 8..156, y 262..436) is
  pixel-identical to the 2026-09-21 frame in all three -- 0 of 25,752
  pixels differ (`compare-region.py`) -- while the capture tiles keep their
  turn and shape: rings 68x69 (`fbn`), 73x73 (`nes`), 89x89 (`gb`), mark
  above.

## #252 -- the walk frames are diffed against the last accepted cut (D-QA-038)

Guest a at `1280x800`, `tools/vm-qa --only walks,frame-diff` on the
fifteenth cut's image, runs 17 to 21 (16:27 to 18:30 UTC). The new
`frame-diff` suite compares every walk frame with the baseline's and fails
on a box no claim covers; `masks.txt` hides the clock and a running
transfer's live lines.

- `252-walk-manager-{fbn,nes}-1280x800` -- the new manager walks, run 20:
  Ms. Pac-Man under `fbn` (the turn from FBNeo's table) and Bobl under `nes`
  (a turn recorded), the capture tile portrait with the mark above, the
  START NEW GAME arrow the same on both, the tile date fixed at
  `09/01/2026 12:00` by the fixture so the frames compare.
- `252-diff-systems-page-cloud-populated` / `-cloud-reset` -- what the diff
  caught between runs 18 and 20 (`x 250..598, y 367..380` and `y 438..451`):
  the FBNEO and NES rows read NOTHING NEW TO BACK UP after a run had left
  the fixture's ROMs in the QA cloud, and `4 KB NOT YET IN YOUR CLOUD · 1
  FILE` once the walks reset the cloud before seeding it. The first is what
  a second run used to inherit; the second is the state every run starts
  from now.
