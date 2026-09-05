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
- **"Wi-Fi", hyphenated**, in every user-visible string. The settings keys stay
  `wifi.key` / `wifi.ssid` — an identifier is not a reason to spell the label
  after it.
- Theme-aware colors/fonts via `ThemeData::getMenuTheme()`.
- Pages provide `getHelpPrompts()` so the bottom help bar stays accurate.
- Lambda capture: `Window* window = mWindow;` then capture `window` (menu may be deleted).

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
