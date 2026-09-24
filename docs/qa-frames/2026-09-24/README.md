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
