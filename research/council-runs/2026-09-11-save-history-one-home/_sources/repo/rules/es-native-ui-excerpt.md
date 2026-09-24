# es-native-ui.md -- the rows, vocabulary and spacing rules (excerpt)

## A row that leads somewhere is a label, not a paragraph

Maintainer, 2026-09-06: *"adding a fuller description isn't necessarily always
better. We're dealing with the 3.5- or 4-inch screen here sometimes, so we
don't want to have lots of tiny text. If necessary, sometimes it's better to
have the user click into the menu, where they can have some options or at
least breathing room. If there's more than one action that can be taken, this
likely makes sense within our menu structures, so the user has room to choose
what to do."*

So:

- **A row that opens a page with more than one action is a submenu.** Its
  label carries the verb (MANAGE CLOUD STORAGE, MANAGE GAME SAVE RESTORES AND
  CONFLICTS); the page inside carries the choices, with room. Do not make up
  for a hub label with a description that lists everything behind it — that is
  the tiny text nobody reads, on the panel where it is smallest.
- **A description, where one is needed, is one short line.** The three section
  headings the player will see inside (`BACKUP AND RESTORE, SAVE MANAGEMENT,
  CLOUD STORAGE SETUP.`) is a description; a sentence naming every action is
  not.
- **When a row genuinely needs explaining, that is a signal it wants a page**,
  not a longer line under it.

**Two lines per row, never three (D-UI-023).** Maintainer, the same day, on
the cloud settings rows that carried a label, what they move, and how they
last went: *"when we risk having an extra line, if the description can be
moved into the confirmation dialog and it serves an additive function, that's
the best-case scenario in principle (because it allows us to keep it to two
lines max)."* So a row is a label and at most one line under it. When a second
line wants in, ask what the confirmation dialog already says — the itemisation
of what moves belongs there, where it is read at the moment of deciding — and
what the page's job is: on a page that launches a job, the line under the row
is how it last went; on a page that chooses what moves, it is what the row
carries. A row with no confirmation has nowhere to move a line to, so it
keeps the line that serves the page's job and drops the other.

The case: the cloud hub row briefly carried "BACK UP OR RESTORE, CHOOSE ROMS AND
BIOS, SET WHEN SAVES SYNC, AND CONNECT OR REPAIR YOUR CLOUD STORAGE." — accurate,
and wrong, replaced the same hour.

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

## Images in a menu row are themed as text unless you stop it

`ComponentList::render` calls `setColor(menuTheme->Text.color)` on **every
element of every row, every frame**, and `ImageComponent::setColor` is
`setColorShift`. So an image added to a row is tinted with the menu's muted
text colour continuously, and setting the shift once at construction does
nothing at all.

Text beside it in the same row keeps its own colour only when it sits inside
a `ComponentGrid`, whose `setColor` does not reach the labels within — which
is why a QR code looked dimmer than the address next to it.

Where an image must keep its own colours — a QR a phone camera has to read,
a logo, a screenshot — subclass and refuse the tint:

```cpp
class UntintedImageComponent : public ImageComponent {
public:
    void setColor(unsigned int) override { ImageComponent::setColorShift(0xFFFFFFFF); }
};
```

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

## Conventions

- Every label through `_( )` (localized, UPPERCASE by convention).
- **"back up" vs "backup"**: two words as a verb ("BACK UP CONFIGURATIONS TO CLOUD",
  "back up your settings"), one word as a noun/adjective ("RESTORE FROM BACKUP",
  "backup file"). Applies to menu labels, dialogs, script output, and docs.
- **Serial comma, always.** "Game saves, save states, and screenshots" — never
  "…states and screenshots". Without it the last two items read as one thing,
  which in a list of what a backup carries is exactly the ambiguity that
  matters.
- **"game save" vs "save state".** A battery save is a **game save**; a
  snapshot of the running machine is a **save state** (two words — the
  directory is `savestates`, the label is not). They are different files with
  different failure modes, and a player who has lost one needs to know which.
  Bare "saves" is fine as a collective where nothing contrasts with it
  ("games, BIOS files, and saves"); the moment both appear, name them apart.
- **Four tiers, two verbs, and the destination says where (D-UI-022,
  D-CLOUD-050).** The things cloud sync moves are **settings** (the archive
  `backuptool` writes: emulator and interface configuration, input mapping,
  themes, collections, bezels — no saves, no ROMs, no operating system),
  **saves** (game saves, save states, and screenshots), **ROMs and BIOS**,
  and **game content** (what the scraper made: artwork, videos, manuals, and
  the game lists — D-CLOUD-049 puts `gamelist.xml` here, not with ROMs). The
  only verbs are *back up* and *restore*; nothing is "uploaded" or
  "archived" in a label, because a player has no way to tell those apart
  and the archive is uploaded too. The label says what and where: BACK UP
  SETTINGS TO THIS DEVICE, BACK UP SAVES TO THE CLOUD, RESTORE SETTINGS FROM
  THE CLOUD. **Never "system backup"** — it held people to expecting their
  games in it — and never "save data", "configurations", "everything", or
  "cloud library". *Sync* is reserved for the automatic two-way behaviour
  saves get after #22, where a player never picks a direction. The wizard's
  kept losers are **discarded saves**; *discard* means nothing else.
- **"Wi-Fi", hyphenated**, in every user-visible string. The settings keys stay
  `wifi.key` / `wifi.ssid` — an identifier is not a reason to spell the label
  after it.
- Theme-aware colors/fonts via `ThemeData::getMenuTheme()`.
- Pages provide `getHelpPrompts()` so the bottom help bar stays accurate.
- **`GuiSettings::addSwitch(title, description, settingsID, bool, onChanged)` — the bool
  is `storeInSettings`, not a default.** `true` sends the value to `es_settings.cfg`
  (ES's own store); `false` to SystemConf (`system.cfg`), which is the only place the
  launch scripts read. A row that needs a default-on switch on SystemConf is written by
  hand: `setState(SystemConf::getBool(key, true))` plus an `addSaveFunc` calling
  `setBool`. The PROGRESS TRACKER row passed `true` as a default and its state went
  where no script looks (2026-09-07).
- Lambda capture: `Window* window = mWindow;` then capture `window` (menu may be deleted).
- Wizard page replacement: `cloudSetupPresent(window, current, prev)` closes
  `prev`, and `GuiSettings::close()` ends with `delete this`. Callbacks on the
  new page must hand **that page** to the next transition, not capture the
  deleted predecessor. Both OAuth keyboard choices retained the provider page
  after it was closed and crashed on selection (2026-09-05). The ES repo's
  `python3 tests/cloud-oauth-lifetime.py` checks those transitions with
  AddressSanitizer; it complements, rather than replaces, device UI testing.

