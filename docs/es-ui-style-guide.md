# EmulationStation UI style guide

How a screen should look and behave, derived from what this codebase already
does — not invented. Every rule below is backed by shipped code; where the tree
is inconsistent, that is said plainly rather than papered over.

Companion: [es-menu-map.md](es-menu-map.md) — where a new screen belongs.
Deeper background: `.claude/rules/es-native-ui.md`.

Upstream documents **none** of this: `THEMES.md` covers only repainting menus.
The Batocera wiki contributes the interaction rules in the last section.

## Rows

Seven builders. Pick by what the row *is*, not by how it looks.

| Row | Builder | Use for |
|---|---|---|
| Action | `addEntry(label, arrow, func)` | do something / go somewhere |
| Setting | `addWithLabel(label, component)` | a value the player changes |
| Either + explanation | `addWithDescription(label, desc, comp_or_null, func)` | when one line of "what does this do" is needed |
| Section header | `addGroup(label)` | segment a page |
| Text / password | `addInputTextConfigRow(label, key, password)` | free text bound to a config key |
| Read-only fact | `addWithLabel(label, TextComponent)` | a value the player reads, not edits |
| Raw | `addRow(ComponentListRow)` | only when the helpers cannot express it |

The mechanical difference: an **action** row has a `func` and no component;
a **setting** row attaches a component on the right and lets it consume
left/right. `addWithDescription` supports both.

Controls: `SwitchComponent` for binary, `OptionListComponent` for 2+ exclusive
values (or multi-select), `SliderComponent` for a continuum. Sliders render
`value+suffix` with no space — `%`, `m`, `s`, `Mb`.

### The `multiLine` trap

Descriptions are **always visible** in both modes — `multiLine` controls
*wrapping*, not visibility:

- `multiLine = true` → the description wraps and the row grows taller.
- `multiLine = false` → the description is clamped to one line and marquee-scrolls
  only while the row is focused. It also forces the whole list into per-frame
  updates.

Which you get is decided by **which overload you hit**, and the two disagree:

```cpp
s->addWithDescription(label, desc, comp);          // multiLine = true  → wraps
s->addWithDescription(label, desc, nullptr, func); // multiLine = false → marquee
```

So a *setting* row with a description wraps, while an *action* row with a
description does not. If an action row needs a wrapped explanation, pass
`multiLine = true` explicitly, or emit one non-selectable small-font row per
line (the wizard's `cloudSetupAddInfoRow`).

### Size by weight, not by helper

Three sizes, and which one a row gets is decided by what the row *is*:

| Size | Used for |
|---|---|
| group font | section headers (`addGroup`) |
| **text font** | row content — actions, statuses, instructions, facts, commands |
| small font | a row's *description*, explaining the row above it |

Peer items must match. A status line sitting beside an action row is the same
weight as that action and takes the same size; only text that explains another
row drops to small. `MultiLineMenuEntry` already draws its substring small, so
descriptions get this for free.

The failure to watch for is size chosen by *plumbing* rather than by weight — a
row rendering small because it happened to go through a helper that reached for
the small font. That shipped once: the cloud wizard drew "SSH SERVICE IS
ENABLED" a size below the action directly above it, and rendered the ssh command
— the most important thing on its page — smaller than the facts beneath it.

### Dim, don't hide

When a feature exists but is not yet configured, keep its rows visible and
dimmed — alpha `0x50` via `(color & 0xFFFFFF00) | 0x50` — and make them offer
the setup flow. Hiding them tells the player nothing; dimming shows what they'd
get. **Dimmed rows must still carry their description**: before setup is exactly
when someone is deciding whether the feature is worth configuring.

## Text

**Write every user-visible string already upper-cased in the source.** The
component only upper-cases four of eleven cases — notably `addEntry` labels,
`addGroup` labels and subtitles are *not* upper-cased for you.

Descriptions are the exception, and the tree has two dialects: upstream Batocera
uses sentence case ("Reduces power consumption when idle."), fork code uses ALL
CAPS. **Match the fork dialect in fork code**; one sentence, ending in a period,
`X: Y` for direction or scope, naming the concrete consequence:

> `GAME SAVES, SAVESTATES AND SCREENSHOTS: DEVICE TO CLOUD.`
> `SYSTEM SETTINGS FIRST (THE DEVICE REBOOTS), THEN GAME SAVES.`

Placeholders: `AUTO` for "system decides", `NONE` for explicitly nothing,
`<NOT SET>` for a missing credential. Passwords display as `*********`, never
the real value. Button *help* text is lower case, contrasting with its
UPPER-CASE label (`addButton(_("CONTINUE"), _("continue"), …)`).

## Confirmations

The shape, with **YES first** — there is no counter-example in the tree:

```cpp
new GuiMsgBox(window, MESSAGE_ENDING_IN_QUESTION, _("YES"), doIt, _("NO"), nullptr)
```

Safety comes from the back-button accelerator, which binds to a button named
exactly `NO` or `OK` — **and falls through to the last button if neither
exists**. Never let "back" land on the destructive choice. Ending the message
with `?` also selects the question icon automatically.

Escalate wording with severity:

1. **Reversible** — `ARE YOU SURE?`
2. **Consequential** — consequence paragraph, blank line, then the question.
   Reassure explicitly when the action sounds worse than it is:
   `SYNC GAME SAVES BOTH WAYS?\n\nTHE NEWEST COPY OF EACH SAVE IS KEPT ON BOTH SIDES. NOTHING IS DELETED.`
3. **Irreversible** — `WARNING:` prefix, `!`-terminated clauses, and a closing
   question that **restates the verb** (`RESET SYSTEM AND RESTART?`), never a
   generic "continue?".

A failed precondition uses a single-OK box and returns early — but if the
precondition is *fixable*, offer the fix instead of just refusing
(`NO CLOUD REMOTE IS CONFIGURED YET.\n\nSET UP YOUR CLOUD REMOTE NOW?`).
"Already running" is phrased as an offer to stop, not an error.

## Waiting

| Mechanism | Use when |
|---|---|
| `GuiLoading<T>` | seconds; the player must wait; result drives the next screen |
| `AsyncNotificationComponent` | minutes; the player keeps using the UI |
| `displayNotificationMessage` | it finished; nothing to decide |
| `BusyComponent` member | a bespoke screen with its own lifecycle |

Only put genuinely slow work behind a spinner. Fast local calls should run
synchronously — a spinner that flashes for 100 ms is worse than none. Toast
shape is `<glyph> <subject> : <outcome>`.

## Saving

**`addSaveFunc` (apply-on-close) is the default** — batched, and both stores are
written once. Use `setOnChangedCallback` (immediate) only when: a service must
start/stop now, the page must rebuild because the toggle reveals other rows, or
the value must survive ES being killed. Immediate callbacks must persist
themselves.

Guard destructive writes: apply a credential only when it is non-empty *and*
changed, so opening an editor and backing out cannot clear it.

## Reboot-required

Two flags on the page: `"reboot"` (notify) and `"exitreboot"` (notify, and quit
if the user opted in). Set inside `addSaveFunc`, gated on the setter actually
reporting a change; consume in `onFinalize`. A child page sets the flag on its
**parent**, which owns the message. The exact toast is
`_U("\uF011  ") + _("REBOOT REQUIRED TO APPLY THE NEW CONFIGURATION")`.

Settings whose effect is deferred may also say so in their description
("A reboot may be required for changes to take full effect.").

## Buttons

`BACK` is added automatically and is **always last**; anything else precedes it
in decreasing prominence. For a wizard, `clearButtons()` and replace the row:
exit on the left, advance on the right.

**Gate by existence, not by disabling.** Pass a null callback and the button is
not built — so CONTINUE literally does not exist until it would work:

```cpp
s->getMenu().clearButtons();
s->getMenu().addButton(_("EXIT SETUP"), _("exit setup"), [s] { s->close(); });
if (onContinue != nullptr)
    s->getMenu().addButton(_("CONTINUE"), _("continue"), onContinue);
```

A page the player may defer offers `LATER` (left) and `FINISH` (right), where
only FINISH consumes any one-shot marker.

## Glyphs

The status pair is the most reusable convention in the codebase:

| Glyph | Meaning |
|---|---|
| `\uF058` check-circle | done / verified / present |
| `\uF071` exclamation-triangle | needs attention |

Prefix a **row label** with two trailing spaces (`_U("\uF058  ")`), a
**notification** with one. When a state needs no action, put the glyph on a
non-selectable row instead of an actionable one.

Named theme icons (`iconGames`, `iconNetwork`, …) are used **only on the
top-level main menu** — no sub-page passes one, and the vocabulary is fixed, so
sub-pages use glyph prefixes.

## Gating

Four gates, in order of precedence:

1. `ApiSystem::isScriptingSupported(FEATURE)` — backend script present.
2. `Utils::FileSystem::exists(...)` — our own tooling. Nest it: feature exists →
   feature configured → individual sub-tool.
3. Kid / kiosk mode — anything that runs shell commands, resets state or edits
   credentials sits behind `isFullUI`.
4. Runtime preconditions — checked at entry with an early return, not at build.

Show a row only when it is meaningful: an account row appears because a username
survived the backup; a netplay row because netplay is on. Expensive checks
(network round-trips) belong behind an explicit user action, never at page build.

## Wizards

- **Push the new page, then close the old one.** Closing first flashes the menu
  underneath. Never call `close()` on the page that owns the running handler and
  then touch its captures — that is a use-after-free.
- **Title stays constant; the step goes in the subtitle** (`STEP 1 OF 3 - SET UP SSH`),
  separated by a spaced hyphen. Subtitles are not auto-upper-cased.
- **Rebuild the page after an edit** so every row re-reads live state.
- **`LOG(LogInfo)` at every state transition**, prefixed with the flow name.
- **Only build a gated wizard when a real sequence exists.** If the items are
  independent and optional, one page of verified rows is correct — a forced
  sequence for optional work is worse than a list.

## Interaction rules (from upstream)

- Refer to buttons by **cardinal position** (North/South/East/West), never
  console letters — labels differ per controller.
- **South confirms, East cancels** by default, and the player can swap them, so
  never hardcode "press A".
- **START** opens the main menu anywhere; **SELECT** opens the context menu.
- Provide `getHelpPrompts()` so the bottom help bar stays accurate — upstream
  states the help bar is how players learn the current assignments.

## Known inconsistencies

Documented so nobody "fixes" one half into the other by accident:

- The arrow flag on action rows is applied inconsistently — the QUIT menu passes
  `false` for rows that open confirm boxes, the reset menu passes `true`.
- `MenuComponent::addEntry` and `GuiSettings::addEntry` **swap parameters 5 and
  6** (`setCursorHere` / `onButtonRelease`). Both are `bool`, so a mix-up
  compiles silently.
- Two description dialects (sentence case upstream, ALL CAPS in fork code).
