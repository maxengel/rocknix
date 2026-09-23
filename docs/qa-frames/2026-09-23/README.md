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
