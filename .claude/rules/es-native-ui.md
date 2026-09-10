---
description: "EmulationStation (emulationstation-next) native UI/UX best practices — building blocks, patterns, and precedents for menu/settings/async work."
paths:
  - "**"
---

# EmulationStation native UI/UX practices

Survey of `ROCKNIX/emulationstation-next` (2026-07-24) for building native experiences
(cloud sync, backup/restore, issue #15 L2/L3). Source lives in the separate ES repo;
this file guides any work there.

## Where things live

- `es-app/src/guis/` — application pages (GuiMenu, GuiControllersSettings, GuiMoonlight,
  GuiBackupStart/GuiBackup, GuiBios, GuiFileBrowser, GuiBatoceraStore, ...).
- `es-core/src/guis/` — primitives: `GuiMsgBox` (1–3 button dialog), `GuiTextEditPopup` /
  `GuiTextEditPopupKeyboard` (on-screen keyboard), `GuiInfoPopup`, `GuiInputConfig`.
- `es-core/src/components/` — `MenuComponent`, `ComponentList`, `SwitchComponent`,
  `OptionListComponent`, `SliderComponent`, `ButtonComponent`, `BusyComponent`
  (spinner), `AsyncNotificationComponent` (top-right progress card).

## Core patterns (use these, don't invent)

- **Settings page**: `new GuiSettings(window, _("TITLE"))` + `addGroup` / `addEntry`
  (action rows) / `addWithLabel` (switch/option rows) / `addSaveFunc` (apply-on-close);
  `s->setVariable("reboot", true)` + finalize for reboot-needed changes.
- **Text/credential input**: `GuiSettings::addInputTextConfigRow(title, settingsID,
  password, storeInSettings)` — binds a row to SystemConf (default) or Settings
  (`storeInSettings=true`), opens the on-screen keyboard, masks with `password=true`.
  This is the tool for wifi/RetroAchievements/ScreenScraper credential re-entry
  (`"wifi.key"`, `"global.retroachievements.password"`, `ScreenScraperPass`).
- **Confirmation**: `GuiMsgBox(window, _("TEXT"), _("YES"), cb, _("NO"), nullptr)`.
  Dialog text MUST describe actual behavior (see the backuptool drift lesson).
- **Toast**: `window->displayNotificationMessage(_("..."), ms)`.
- **Background job with progress card**: `window->createAsyncNotificationComponent()`
  -- two rows (title, text) by default; pass `true` for the third, the action
  row, when the outcome carries a recovery clause. The cloud card composed one
  for a day and had no row to draw it on (blindspot 35).
  + worker thread updating it — see `ThreadedBluetooth.cpp` (also used by content
  installers). Best fit for rclone progress (parse `--stats` output later, L3).
- **Busy spinner while loading**: `GuiLoading<T>` (async worker + result callback), or a
  full-screen `GuiComponent` owning a `BusyComponent` + small state machine — see
  `GuiBackup.cpp` (batocera's native user-data backup).
- **Run an OS command**: `Utils::Platform::runSystemCommand(cmd, name, window)` — passing
  `window` shows a splash while it runs; `/usr/bin/run "<cmd>"` for fullscreen console
  TUIs (current parity flows). Native pages should prefer headless backends + the async
  patterns above over console hops.
- **A file another process writes is read uncached.** `Utils::FileSystem::exists`
  remembers a miss while `UseFileCache` is on (the default) until a game launch
  or a restart clears the cache, so a stamp the scripts write, or the
  `rclone.conf` the wizard makes, reads as absent for the rest of the session
  on any page that asked before it existed. Pass `exists(path, false)` for
  those (the cloud rows read NOT DONE ON THIS DEVICE YET after a run had
  stamped, 2026-09-10).
- **Gating**: `ApiSystem::isScriptingSupported(ApiSystem::FEATURE)` for capability-based
  entries (batocera-style backends); plain `Utils::FileSystem::exists("/usr/bin/tool")`
  for OS-shipped scripts (our cloud entries). Respect `isFullUI`/kid-mode branches.
- **OS event hooks**: `Scripting::fireEvent("game-start"/"game-end"/...)` executes
  scripts from user ES `scripts/<event>/`, the ES exe dir (`/usr/bin/scripts/<event>/`,
  read-only image — our game-end hook), and `/var/run/emulationstation/scripts/<event>/`.

## Tabbed pages: the strip is a focus stop

`MenuComponent(window, title, tabbedUI = true)` puts a `ComponentTab` strip
above the rows. Since #65 (2026-09-05, D-UI-021) the strip is a focusable grid
cell: up from the first row lands on it, left/right there switch tabs, down
returns to the rows, and the wrap runs strip → rows → buttons → strip. A page
opens on its first row. Rows keep left/right for themselves, which is how an
option row cycles in place everywhere else in ES.

It was wired the other way for years — the strip non-focusable, and
`MenuComponent::input` handing every left/right on the page to it — so the 23
option rows on SCRAPER → OPTIONS could only be changed through the A-button
popup, and the focused rendering `ComponentTab` had always carried (a full
selector bar over the active tab) was never once drawn. **Do not route a
direction key to one component from everywhere on a page.** Give the
component a focus stop and let the grid deliver the key to whatever holds the
focus; a component that needs a key from anywhere is a component in the wrong
place.

Four screens still route left/right to their strips themselves
(`GuiThemeInstaller`, `GuiBatoceraStore`, `GuiKeyMappingEditor`,
`GuiKeyboardtopads`). They move to the same model with #63.

## Spacing (house style)

Values live in one place each, so a screen never makes its own decision.

- **Buttons on a menu's button bar**: `BUTTON_GRID_HORIZ_PADDING` in
  `es-core/src/components/MenuComponent.cpp`, **0.022 of screen width**
  (14px on a 640px handheld panel). Every ES screen ends in this bar, so
  changing it here is the whole style rule.

  It was `0.0052` — 3px on a handheld — which reads as one control rather
  than two, and puts a destructive choice a thumb's width from a safe one.
  Two adjacent buttons must be separated far enough that hitting the wrong
  one is a decision, not a slip.

- **Rows on a cloud-setup page**: `CLOUD_SETUP_ROW_PADDING` in `GuiMenu.cpp`.

- **How wide and where a progress card sits**: 0.9 of screen width, centred
  at the top — `AsyncNotificationComponent`'s constructor for the size,
  `Window::renderAsyncNotifications` for the position (the latter re-applies
  it every frame, so both must agree). 0.9 is `GuiInfoPopup`'s cap and the
  widest this app lets a non-blocking overlay get. Past half the screen a
  card pinned to a corner reads as a panel that failed to fit rather than a
  placement anybody chose, so anything wider than that is centred.

  The four tiers, so a new surface picks the right one:

  | Surface | Width | Position | Blocks input | Ends |
  |---|---|---|---|---|
  | `Splash` (boot, gamelist reload, launch) | full screen; its bar is 0.5W | whole screen | yes | when the work does |
  | `GuiInfoPopup` (toast) | fits text, capped 0.9W | top, centred | no | on a timer |
  | `AsyncNotificationComponent` (progress) | 0.9W | top, centred | no | when the work does |
  | `GuiCloudTransfer` (long job) | full screen | whole screen | yes | **when dismissed** |

  Full-*screen* is a modal takeover, not a wider card — do not reach for it
  for work the player can keep playing through.

### Outcome words, and the register they are written in

A cloud run **passes or fails**. `COMPLETED`, or `COULDN'T FINISH - <why>`,
or `SKIPPED - <reason>` for the two sentinels and the launch cancel. There is
no middle word: `COMPLETED WITH GAPS` existed for a day and the maintainer's
verdict on meeting one was that a half-outcome nobody can act on costs more
trust than either plain answer (D-UI-030). A run whose parts disagree is a
failure that still says truthfully what moved.

The words themselves are **everyday, not formal** (D-UI-031). The test is
whether a person would say it out loud:

| Not this | This |
| --- | --- |
| `NOTHING WAS SENT. YOUR CLOUD IS AS IT WAS.` | `DON'T WORRY, NOTHING CHANGED.` |
| `NO NETWORK CONNECTION` | `YOU'RE NOT ONLINE` |
| `ANOTHER CLOUD SYNC IS RUNNING` | `A SYNC IS ALREADY RUNNING` |
| `YOUR CLOUD REFUSED THE TRANSFER` | `YOUR CLOUD WOULDN'T TAKE THE FILES` |
| `WRITING THE SETTINGS ARCHIVE...` | `PACKING UP YOUR SETTINGS...` |
| `IT RUNS AGAIN AT THE NEXT STARTUP.` | `IT'LL TRY AGAIN NEXT STARTUP.` |

Unchanged by that pass, because they are vocabulary rather than register: the
three tiers, the two verbs, `Wi-Fi`, the serial comma, two lines per row, and
the outcome words above.

  **Duration decides between the last two, and the deciding column is
  "Ends".** A card is right for work somebody watches finish — a scrape, a
  hash, a two-second save sync. It is wrong for anything long enough to walk
  away from, because it closes itself the moment the job ends: a 1.4 GiB
  restore left nothing behind but a log file, and the player had to ask
  somebody else whether it had worked (2026-09-03).

  So a job measured in minutes gets a page that outlives it. Show the live
  line, a bar only where a real percentage exists behind it, elapsed time, and
  then the outcome — and refuse input while it runs, because there is nothing
  to choose and a stray press should not dismiss a page somebody is waiting
  on. `GuiCloudTransfer` follows `GuiBackup`'s shape (GuiComponent +
  BusyComponent + worker thread), which is this codebase's existing answer to
  a long job with a page of its own.

- **How solid a floating card is**: `NOTIFICATION_OPACITY` in
  `es-core/src/components/AsyncNotificationComponent.cpp`, **255**. Every
  themed surface in the app — menus, dialogs, `GuiInfoPopup` after its
  fade-in — draws its background at full opacity and lets the theme decide
  how solid to be. This card was the one exception at 200, and over the
  shipped theme's `0x111111` panel that let a fifth of the game art through:
  a progress line on a mid-grey smear that shifted with the box art behind
  it. The corners of `frame.png` fade to nothing regardless, so a card at
  full opacity still reads as an overlay rather than a page.

Screen-relative fractions, never pixel constants: these panels run from
640×480 to 1920×1080 and a fixed value is right on exactly one of them.

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

## Reusable precedents

- **`GuiBackupStart`/`GuiBackup`** — native backup flow (target-device OptionList →
  busy-anim page → ApiSystem call). Hidden on ROCKNIX (no `ApiSystem::BACKUP` backend);
  the model to follow for a native backuptool page (issue #18 P2+).
- **`GuiFileBrowser`** — directory/file picker; the pattern for the P3 cloud
  directory chooser (feed it rclone `lsf` results).
- **`GuiMoonlight`** — settings+actions hybrid page driving an external tool.
- **`GuiBatoceraStore`/`GuiThemeDownloader`** — list + install with async progress.

## Anti-patterns (observed, avoid)

- Developer/QA concepts in product text: no QEMU/VM/port-forward mentions, no
  "open this link on the device" (there is no browser). Console-first: player +
  handheld + phone companion is the only assumed environment.

- **Two surfaces for one event.** A job that reports progress in one shape
  and its outcome in another, somewhere else on screen, changes shape and
  position at exactly the moment somebody is looking for the answer. The
  surface that reported the work says how it ended and then fades — see
  `ThreadedCloudSync::run`. It replaced a card that vanished into a
  `GuiInfoPopup` two hundred pixels away.

- **An operation whose only report is transient.** A progress card and the
  toast that replaces it are both gone within seconds, so anyone who starts a
  job and walks away — which is the normal way to run a backup — returns to a
  screen that has never heard of it. Long-running work must leave a durable
  answer to "did that work?" on the page that offered it: the backend stamps
  the outcome somewhere device-local, and the page reads it back.

  That stamp is necessary and **not sufficient**, which took a second round to
  learn. A row in a menu answers "did the last one work?" for somebody who
  thinks to go and look; it does nothing for somebody standing in front of the
  device when the surface they were watching vanishes. For anything long, the
  durable answer has to be *on the screen that ran it* — see the fourth tier
  above. A log file is not that answer either; nobody is going to be told a
  path.

- Dialog text promising behavior the backend doesn't do (pre-P1 backup dialogs).
- Dropping to a fullscreen CLI for things a `GuiSettings` page + headless backend can do
  natively — acceptable as parity stopgap, not as the end state (issue #15 L2).
- Direct `system()`/popen in UI code paths — use `runSystemCommand`/`ApiSystem`/threads.

## Outcome vocabulary (D-UI-028)

Every cloud surface -- the sync card, the transfer page, the rows under the
toggles -- ends a run with one of four words, then a why, what is in place,
and how to recover. Nothing else: no `FAILED`, no `SUCCEEDED`, no log path,
no exit code, no `rclone`.

| Word | When | Card (line 2) | Page (line 1) | Row token |
|---|---|---|---|---|
| `COMPLETED` | every part of the run succeeded (rclone 9 counts as success) | `COMPLETED` | `COMPLETED` | `COMPLETED` |
| `COMPLETED WITH GAPS - <what>` | some parts succeeded and some did not; a match cut after deletions | `COMPLETED WITH GAPS - NES DID NOT FINISH` | `COMPLETED WITH GAPS` | `COMPLETED WITH GAPS` |
| `COULDN'T FINISH - <why>` | nothing succeeded and it is not a sentinel | `COULDN'T FINISH - YOUR CLOUD STOPPED ANSWERING` | `COULDN'T FINISH` | `COULDN'T FINISH, YOUR CLOUD STOPPED ANSWERING` |
| `SKIPPED - <reason>` | only 69, 75, and the launch cancel | `SKIPPED - NO NETWORK CONNECTION` / `SKIPPED - ANOTHER CLOUD SYNC IS RUNNING` / `SKIPPED - A GAME WAS STARTED` | same | `SKIPPED, NO NETWORK` / `SKIPPED, ANOTHER SYNC WAS RUNNING` / `SKIPPED, A GAME WAS STARTED` |

**Why** comes from a `>>> why <sentence>` line the scripts print at the point
of failure (rclone's own taxonomy stays in the log), else from rc: rclone 3/4
`YOUR CLOUD FOLDER WASN'T FOUND`; 5 `YOUR CLOUD STOPPED ANSWERING`; 7/8 `YOUR
CLOUD REFUSED THE TRANSFER`; the sign-in check `COULDN'T REACH YOUR CLOUD. YOU
MAY NEED TO SIGN IN AGAIN`; the saves-root guard `YOUR SAVES ARE ON A
DIFFERENT CARD`; a 130 that was not a launch cancel `IT WAS STOPPED`; anything
else `SOMETHING WENT WRONG`. The six rc-keyed sentences are duplicated
verbatim in `ThreadedCloudSync`'s own fallback map, so they change on both
sides or on neither -- the plain-language pass (#108) deliberately left them
alone for that reason.

The scripts also print, where the table has no entry: `YOUR CLOUD STORAGE
ISN'T SET UP YET`, `YOUR SAVES FOLDER ISN'T ON THIS DEVICE`, `THIS DEVICE'S
SETTINGS BACKUP IS DAMAGED`, `THE COPY IN YOUR CLOUD ISN'T COMPLETE`, `YOUR
CLOUD SYNC SETTINGS COULDN'T BE READ`, `AN OLD FOLDER SETTING IS IN THE WAY`,
`COULDN'T TELL WHICH CARD YOUR SAVES ARE ON`, `YOUR SAVES CHANGED CARDS
PART-WAY THROUGH`, and `SOME FILES DIDN'T FINISH` for rclone 6 (2026-09-10,
#105 tranche A; reworded into everyday words 2026-09-10, #108); `backuptool`
prints its own on the console flows (`THERE'S NO SETTINGS BACKUP ON THIS
DEVICE YET`, `THIS DEVICE'S SETTINGS BACKUP IS DAMAGED`, `COULDN'T KEEP A COPY
OF YOUR CURRENT SETTINGS`, `THE RESTORE COULDN'T FINISH`, ...). **The stamp's
third field** is the why
sentence as one token, spaces as underscores
(`1789000000 5 YOUR_CLOUD_STOPPED_ANSWERING`), present only when the run did
not complete and was not a sentinel; a reader turns the underscores back into
spaces.

**In place**, one per verb, true because rclone renames on completion and the
content scripts never delete outside a match: back up `WHAT WAS SENT IS IN
YOUR CLOUD. THE REST IS STILL ON THIS DEVICE.` / `NOTHING WAS SENT. YOUR CLOUD
IS AS IT WAS.`; restore `WHAT ARRIVED IS ON THIS DEVICE. THE REST IS AS IT
WAS.` / `NOTHING ARRIVED. THIS DEVICE IS AS IT WAS.`; saves sync `THE SAVES
THAT MOVED ARE ON BOTH SIDES. THE REST ARE AS THEY WERE.` / `YOUR SAVES ARE AS
THEY WERE.`; match `N FILES WERE REMOVED FROM THIS DEVICE. YOUR CLOUD STILL HAS
THEM.` / `NOTHING WAS REMOVED.`

**Recover**: the page offers `TRY AGAIN` (A) beside `CLOSE` (B) on line 7 when
the run did not complete, re-running the same command; the card's action line
names the row (`TRY AGAIN: GAME SETTINGS > BACK UP SAVES TO THE CLOUD`), or for
an automatic sync when it runs again (`IT RUNS AGAIN WHEN YOU EXIT A GAME`);
no network `TRY AGAIN WHEN YOU'RE ONLINE.`; lock held `WAIT FOR IT TO FINISH,
THEN TRY AGAIN.`; a game started `YOUR SAVES ARE SENT WHEN YOU EXIT THE GAME.`
Measure every string at 640x480 in frames; if the card's action line clips,
drop the in-place clause first.
