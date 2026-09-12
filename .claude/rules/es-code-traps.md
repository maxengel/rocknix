---
description: "Sharp edges in the EmulationStation codebase, each found by debugging and each carrying its fix: button-bar lifetimes, rclone's piped progress, xgettext and non-ASCII comments, help-bar prompts, TextComponent's measuring, and where pure string code lives."
paths:
  # ES source lives in the separate `ROCKNIX/emulationstation-next` repo, so no
  # glob written here can name `es-app/**`. `**` is the widest a repo-relative
  # glob reaches; a session working only in the ES checkout still loads none of
  # these (#147 § 9).
  - "**"
---

# EmulationStation code traps

Sharp edges in the EmulationStation codebase, each found by debugging and each
carrying its fix. Split out of `es-native-ui.md` on 2026-09-12 (#147) --
maintainer: *"let's split up the native UI into parts"* (D-WORKFLOW-008).
Nothing here is a matter of taste: every one of them broke a build, killed the
process, or put nonsense on a screen.

The patterns these are traps in are `es-native-ui.md`; the words they carry are
`es-player-text.md`.

## Never rebuild a button bar from inside one of its buttons

`MenuComponent::clearButtons()` destroys the `ButtonComponent`s, and a
button's callback is a `std::function` that lives inside the button. A
callback that calls `clearButtons()` + `addButton(...)` — to relabel SELECT
ALL as SELECT NONE, say — destroys itself while it is running, and
EmulationStation dies on the press (2026-09-06, the content page's first
cut; the VM frame after the press was black, the next one the carousel).
Rebuilding from a *switch row's* change callback is fine — the rows survive
the rebuild — which is why the transfer page's `rebuildButtons` never showed
the problem. From a button, post it: `window->postToUiThread([weak]{ if
(auto b = weak.lock()) (*b)(); })`, with the switches kept quiet while the
button sets them so their own callbacks do not fire a second rebuild, and
the rebuild owned by the page (through `onFinalize`) rather than by the
callbacks that call it, or the shared_ptr cycle keeps it alive forever.

## What rclone's piped progress actually looks like

`GuiCloudTransfer` parses `rclone --progress` through a pipe, and a pipe
is not a terminal. Three consequences, each of which put nonsense on the
page before it was written down (2026-09-06):

- The per-file line is `" * %-*s:%3d%% /%s, %s/s, %s"`, so at 100% there is
  **no space after the colon**: `name.zip:100% / 40 MiB, 1 MiB/s, 0s`. Split
  on the last `:` that is followed by a percentage, never on `": "` — the
  latter put the whole line on the name row and showed `S` (the basename of
  `1Mi/s, 0s`) as the file name.
- Every line is **cut at 80 columns** (rclone assumes a terminal width it
  cannot measure), so the last field arrives torn: `5.722 MiB/`, `976.547
  Ki`. Show a field only when it is whole.
- Long names are shortened with **U+2026**, and stripping "unprintable"
  bytes turns `Ikari n…ge` into `Ikari nge`. Keep UTF-8; drop C0 controls.
- The next block's `Transferred:` is glued to the last per-file line without
  a newline (already handled: the reader splits on the marker).
- `BusyComponent::setText("")` is a **no-op** against its empty initial
  state, so the spinner shows its default WORKING... unless the caption is
  given at construction: `BusyComponent(window, "")`.

## Comments near a translatable string must be ASCII

ES's build runs `xgettext` over the sources for the `.pot` file, and it
stops the whole build on a non-ASCII byte in a comment it extracts
(`Non-ASCII comment at or before <file>:<line> ... Please specify the source
encoding through --from-code`). It extracts comments that sit right before a
`_( )` call, so a middle dot, an em dash or an ellipsis in such a comment
breaks the image build while `g++ -fsyntax-only` passes it (2026-09-08,
`b44a715a9`: eight comment lines in `GuiCloudTransfer.cpp`). String
literals may carry `·`; comments may not. Write `.`, `--`, `->`, `...`.
Before bumping the ES pin, run `grep -nP '^\s*//.*[^\x00-\x7F]'` over the
files you touched; a real image build is the only check that runs xgettext.

## The help bar offers a direction only where it moves something

`ComponentGrid::getHelpPrompts` used to decide from the grid's dimensions:
more than one row means up/down, more than one column means left/right. A
`GuiMsgBox` is a 2x2 shell whose only focusable cell is a button row that is
itself an N x 2 grid (the second row a 2px shadow spacer), so the inner grid
claimed up/down and the outer claimed left/right, and every dialog read
`OK  CHOOSE  CHOOSE` (#115, D-UI-034). `canMoveCursor(dir)` asks whether the
scan `moveCursor` would run reaches a focusable cell, and the prompt is
offered only then. When a screen's help bar names a key, pressing it must do
something; a prompt that lies is worse than none.

## TextComponent measures at its full width and draws at its padded one

`onTextChanged()` sets the automatic height from `sizeWrappedText(text,
getSize().x())`; `buildTextCache()` lays glyphs out at `mSize.x() - padding`.
With side padding the drawn width is narrower than the measured one -- 5% on
a 640x480 `GuiMsgBox` -- so any wrap point in that band costs a line the
height never budgeted, and a text with no clip rect paints it over whatever
sits below. That was #48's overlapping OK button; `GuiMsgBox` now measures at
the drawn width. The root is in `TextComponent` and fixing it there re-heights
every padded auto-height text in the app, which nobody has looked at on a
screen yet; until someone does, measure at the padded width where you build
a dialog, and know that the auto height is optimistic.

## Pure text has a home, and a test

`es-app/src/CloudText.{h,cpp}` holds the cloud surfaces' pure string code --
`cleanHostname`, `providerLabel`, `parseLastRun`, `runOrigin`, `shortenWhy`,
`outcomeCandidates`, `classifyProtocolLine`, `chooseThatFits` -- with nothing
from the window, the fonts or the filesystem behind it, and
`es-app/tests/unit/` builds `es-unit-tests` against it with doctest (#120).
A rule about a string -- a stamp's shape, a protocol line, a candidate list --
goes there and gets a case; the thin shell that reads the file or measures
the font stays where it was. Build and run from the ES tree with the
toolchain's cmake and the host compiler:

```
B=/workspace/repos/rocknix.worktrees/generic-x64/build.ROCKNIX-GENERIC_X64.x86_64
$B/toolchain/bin/cmake -S es-app/tests/unit -B build-tests -DCMAKE_CXX_COMPILER=/usr/bin/g++
$B/toolchain/bin/cmake --build build-tests --target es-unit-tests && ./build-tests/es-unit-tests
```

