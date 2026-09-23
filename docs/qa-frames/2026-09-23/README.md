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
