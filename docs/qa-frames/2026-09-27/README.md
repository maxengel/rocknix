# QA frames, 2026-09-27

## #296, RetroArch's notifications across four builds at the H700's widget scale

Guests e, f, g and d (640x480, `menu_widget_scale_factor = 1.0` -- the H700's; the GENERIC_X64 image ships 0.4, which
is the scale #295 was measured at), `diag-296-flows-v2.sh` (a reboot, then A: a fresh start and the exit hotkey's kill;
B: the resume from the auto save; C: a resume, F7 (state slot 1), F2, then F7 and F2 0.3 s apart, the kill) with frames
over VNC every 0.1 s; `timeline-boxes.py` reads every box's rows and the text rows inside it, `file-296.py` picks one
frame per build per moment, `compose-296.py` writes the strips (the bottom 150 rows of each build, oldest first) and the
outline overlays (each build's boxes and text rows in its own colour on the first build's frame). The QA account's name
is painted out of every sign-in line (`tools/png-blackout`; x 268..372 at the 14 px face, 205..300 at the old build's
10.9 px). The builds, oldest first: `e5ed60f3df` (2026-09-10, before the readable-size floor), `d72084ccad` (the 14 px
floor, #251/#255), `af3aaa3af0` (#295's first placement cut, an 11 px reference), `6f0a974765` (the sixth cut, a 9 px
reference with the box scaled to it; on the RG35XX SP since 00:06 UTC).

| Build | moment | frame | boxes (rows @ left x; text rows) |
| --- | --- | --- | --- |
| `e5ed60f3df` | signin-alone | `296-signin-alone-e5ed60f3df-640x480-s1.png` | 410..437 @x11, text 420..426 |
| `e5ed60f3df` | load-line-alone | `296-load-line-alone-e5ed60f3df-640x480-s1.png` | 410..437 @x11, text 420..425 |
| `e5ed60f3df` | stack-entering | `296-stack-entering-e5ed60f3df-640x480-s1.png` | 410..462 @x11, text 420..452 |
| `e5ed60f3df` | stack-settled | `296-stack-settled-e5ed60f3df-640x480-s1.png` | 381..408 @x11, text 391..397; 410..437 @x11, text 420..425 |
| `e5ed60f3df` | slot-save | `296-slot-save-e5ed60f3df-640x480-s1.png` | 410..437 @x11, text 420..426 |
| `e5ed60f3df` | slot-and-save-together | `296-slot-and-save-together-e5ed60f3df-640x480-s1.png` | 410..437 @x11, text 422..426 |
| `d72084ccad` | signin-alone | `296-signin-alone-d72084ccad-640x480-s1.png` | 383..422 @x15, text 398..407 |
| `d72084ccad` | load-line-alone | `296-load-line-alone-d72084ccad-640x480-s1.png` | 383..422 @x15, text 397..407 |
| `d72084ccad` | stack-entering | `296-stack-entering-d72084ccad-640x480-s1.png` | 383..456 @x15, text 398..442 |
| `d72084ccad` | stack-settled | `296-stack-settled-d72084ccad-640x480-s1.png` | 342..381 @x15, text 357..366; 383..422 @x15, text 398..408 |
| `d72084ccad` | slot-save | `296-slot-save-d72084ccad-640x480-s1.png` | 383..422 @x15, text 398..407 |
| `d72084ccad` | slot-and-save-together | `296-slot-and-save-together-d72084ccad-640x480-s1.png` | 405..444 @x15, text 420..429 |
| `af3aaa3af0` | signin-alone | `296-signin-alone-af3aaa3af0-640x480-s1.png` | 400..439 @x15, text 415..424 |
| `af3aaa3af0` | load-line-alone | `296-load-line-alone-af3aaa3af0-640x480-s1.png` | 400..439 @x15, text 414..424 |
| `af3aaa3af0` | stack-entering | `296-stack-entering-af3aaa3af0-640x480-s1.png` | 400..439 @x15, text 415..425; 451..479 @x15, text 467..476 |
| `af3aaa3af0` | stack-settled | `296-stack-settled-af3aaa3af0-640x480-s1.png` | 364..439 @x15, text 379..425 |
| `af3aaa3af0` | slot-save | `296-slot-save-af3aaa3af0-640x480-s1.png` | 400..439 @x15, text 415..424 |
| `af3aaa3af0` | slot-and-save-together | `296-slot-and-save-together-af3aaa3af0-640x480-s1.png` | 400..439 @x15, text 415..424 |
| `6f0a974765` | signin-alone | `296-signin-alone-6f0a974765-640x480-s1.png` | 404..434 @x15, text 415..424 |
| `6f0a974765` | load-line-alone | `296-load-line-alone-6f0a974765-640x480-s1.png` | 418..448 @x15, text 429..439 |
| `6f0a974765` | stack-entering | `296-stack-entering-6f0a974765-640x480-s1.png` | 410..452 @x15, text 421..442 |
| `6f0a974765` | stack-settled | `296-stack-settled-6f0a974765-640x480-s1.png` | 373..434 @x15, text 384..425 |
| `6f0a974765` | slot-save | `296-slot-save-6f0a974765-640x480-s1.png` | 404..434 @x15, text 414..423 |
| `6f0a974765` | slot-and-save-together | `296-slot-and-save-together-6f0a974765-640x480-s1.png` | 404..434 @x15, text 415..424 |


Composites: `296-strip-<moment>-4builds-640x480-s1.png` and `296-overlay-<moment>-4builds-640x480-s1.png` for each moment.

What the rows say, at the device's scale:

- **The sign-in alone**: the text's centre 57, 77, 60 and 60 px above the panel's bottom; the box 28, 40, 40 and 31 px.
- **The load line alone**, before the sign-in arrives: at its final slot on the first three builds (410, 383, 400); on
  `6f0a974765` at **418..448, 14 px below its final slot** (404..434), where it stays until the sign-in arrives and the
  queue re-places it. That is the "comes up and then is moved" of the maintainer's report.
- **The stack settled**: `e5ed60f3df` 381..408 over 410..437 (a one-row seam); `d72084ccad` 342..381 over 383..422 (one
  row); `af3aaa3af0` one run 364..439 (the boxes **overlap by four rows**: a 36 px pitch under a 40 px box); `6f0a974765`
  one run 373..434 (the boxes **touch**: a 31 px pitch under a 31 px box). The sign-in is above the load line on every
  build: RetroArch keeps task messages (a load, a save) at the bottom and inserts regular messages above them.
- **The stack entering**: on every build the sign-in slides from below the panel's edge up through the load line's box
  into the slot above it (the merged runs 410..462, 383..456, 400..479, 410..452); the load line itself does not move
  except on `6f0a974765`, where it jumps the 14 px at the same moment.
- **A save to another slot while playing** (F7 then F2), and F7 and F2 together: one task line at the final slot on every
  build; the slot change draws no message of its own.
- **The exit** (the hotkey's kill, auto save on): nothing is drawn on any build; the auto save is written after the last
  frame.

The resume window's timing, per build: the first box at +0.87, +0.92, +0.77, +0.84 s; the second message at +1.29,
+1.22, +1.13, +1.47 s; the stack at rest at +1.56, +1.52, +1.59, +1.58 s; gone at about +4.2 s.
