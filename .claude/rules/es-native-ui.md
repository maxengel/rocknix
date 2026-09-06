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
  + worker thread updating it — see `ThreadedBluetooth.cpp` (also used by content
  installers). Best fit for rclone progress (parse `--stats` output later, L3).
- **Busy spinner while loading**: `GuiLoading<T>` (async worker + result callback), or a
  full-screen `GuiComponent` owning a `BusyComponent` + small state machine — see
  `GuiBackup.cpp` (batocera's native user-data backup).
- **Run an OS command**: `Utils::Platform::runSystemCommand(cmd, name, window)` — passing
  `window` shows a splash while it runs; `/usr/bin/run "<cmd>"` for fullscreen console
  TUIs (current parity flows). Native pages should prefer headless backends + the async
  patterns above over console hops.
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
