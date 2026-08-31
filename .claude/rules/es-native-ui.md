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

- Dialog text promising behavior the backend doesn't do (pre-P1 backup dialogs).
- Dropping to a fullscreen CLI for things a `GuiSettings` page + headless backend can do
  natively — acceptable as parity stopgap, not as the end state (issue #15 L2).
- Direct `system()`/popen in UI code paths — use `runSystemCommand`/`ApiSystem`/threads.
