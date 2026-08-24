# Conflict wizard — IA and flow

Low-fidelity structure for the cloud-save conflict wizard (#23). **Information
architecture and interaction only** — what is on screen, what the player can do,
and where each choice leads. No visual design: no sizes, colours, spacing or
component choices. Those come later, against
[es-ui-style-guide.md](es-ui-style-guide.md).

Companion to [es-menu-map.md](es-menu-map.md), which places this subtree in the
wider menu. Rendered low-fidelity wireframes of these screens, with the reasoning
in the margins: <https://claude.ai/code/artifact/5da9ce12-b088-4db0-8557-4b34fe454dd6>

> **Rev 4.** Merged states use ES's own `getNextFreeSlot()`; no slot cap;
> resolutions are recorded in an **audit log**; the wizard is triggered by a
> sync that reports conflicts.
>
> **Rev 3.** Decisions settled, several against ES's actual savestate code.
> No file size shown; interrupted runs discard their decisions; cloud is
> always the left column; *keep discarded saves* is off by default with a
> retention count. Merged states go to the **next free** slot, matching
> `SaveStateRepository::getNextFreeSlot()`, which appends rather than filling
> gaps — superseded by rev 4, see below.

## Scope: what counts as a conflict

Only a genuine fork needs a decision. Everything else is applied without asking:

| Situation | Handling |
|---|---|
| Exists in cloud only | download, no prompt |
| Exists on device only | upload, no prompt |
| Same on both sides | nothing |
| **Changed on both sides since they last agreed** | **conflict — ask** |

The header counts *genuine conflicts*, not files that differ, or it will look
alarming when nothing is at risk.

## Flow

```mermaid
flowchart TD
    SYNC([bisync reports a conflict]) --> PRE[apply the non-conflicts first<br/>cloud-only down, device-only up]
    PRE --> ITEM

    subgraph walk [walkthrough: system by system, then game by game]
        ITEM[conflict k of n<br/>KEEP LEFT / KEEP RIGHT / KEEP BOTH]
        ITEM -->|CONTINUE| MORE{last one?}
        MORE -->|no| ITEM
    end

    MORE -->|yes, COMPLETE| GATE{review setting on?}
    GATE -->|no| APPLY[apply]
    GATE -->|yes| REVIEW[REVIEW DECISIONS]
    REVIEW -->|CHANGE| ITEM
    REVIEW -->|APPLY| APPLY

    APPLY --> DONE([done<br/>what changed, per side])
    ITEM -.quit early.-> UNTOUCHED([nothing transferred<br/>decisions discarded])

    classDef safe stroke-dasharray: 4 3
    class UNTOUCHED,DONE safe
```

Properties the flow has to keep:

- **Nothing transfers until COMPLETE.** The walkthrough is reversible right up
  to the end; quitting partway leaves both sides exactly as they were.
- **Non-conflicting files are applied before the walkthrough starts.** This is
  not just tidiness: it is what makes the slot choice safe. Once every
  cloud-only file has been downloaded, free-on-device and free-on-both are the
  same thing, and a merge cannot pick a slot the cloud is already using.
- **Every conflict gets a decision.** There is no defer, because a discarded
  copy is recoverable when *keep discarded saves* is on — that setting, not
  deferral, is the escape hatch for "I am not sure".

## Screens

Abstracted. Boxes are regions, not components. Same layout for every conflict —
only the picture and the available options change.

```
┌──────────────────────────────────────────────┐
│ 3 CONFLICTS FOUND                            │   count, not a separate screen
│ <game name> · <system> · <kind>              │
├───────────────────────┬──────────────────────┤
│ CLOUD                 │ THIS DEVICE          │   fixed order, every time
│ ┌───────────────────┐ │ ┌──────────────────┐ │
│ │[☁]   screenshot   │ │ │[🎮]  screenshot  │ │   source badge overlaid
│ │      or glyph     │ │ │      or glyph    │ │
│ └───────────────────┘ │ └──────────────────┘ │
│ <date> <time>         │ <date> <time>        │
│ <device + model>      │ <device + model>     │
│ <emulator/core + ver> │ <emulator/core + ver>│
├───────────────────────┴──────────────────────┤
│  ( KEEP LEFT )  ( KEEP RIGHT )  ( KEEP BOTH )│   selected side(s) highlight
│  [ CONTINUE ]        …or [ COMPLETE ] if last│
│  merged saves move to the next free slot     │   only when KEEP BOTH is picked
└──────────────────────────────────────────────┘
```

Selecting a side **highlights that column**, so LEFT/RIGHT never has to be
mapped mentally onto CLOUD/DEVICE. Keep the sides in a **fixed order** across
every conflict — muscle memory does the work on a long list, and a column that
swaps sides is how the wrong save gets picked at speed.

## What each kind shows

| | Savestate | In-game save |
|---|---|---|
| Picture | screenshot, source badge overlaid | glyph, source badge overlaid |
| Metadata | date · time · device + model · **core + version** | date · time · device + model · emulator + version |
| Not shown | file size — not actionable when choosing between two saves | same |
| Emulator info means | **compatibility** — core- and chipset-specific, may not load (#19) | context — usually portable across emulators |
| KEEP BOTH | yes — moves to the next free slot via ES's `getNextFreeSlot()` | **no** — fixed slots; shown disabled with a reason |
| Losing copy | retained only when *keep discarded saves* is on | same |

KEEP BOTH is **dimmed, not hidden**, on in-game saves — the house rule from
[es-ui-style-guide.md](es-ui-style-guide.md), and a dimmed control with a reason
teaches what a vanished one cannot.

## Settings

Two toggles, both in the cloud-saves area:

- **Review decisions before applying** — off by default; turns the summary from
  a step everyone pays for into one the careful can opt into.
- **Keep discarded saves** — off by default; retains the losing copy so a
  choice can be undone. A **count selector** sets how many to keep, and stays
  visible but unselectable while the toggle is off (dim, don't hide — the
  capability should be discoverable before it is enabled). The fixed count is
  also the retention rule, so discarded copies cannot grow without bound on
  card storage. Same machinery as #25 (pre-change snapshots and rollback);
  build it once.

## Semantics

The icon says *where*, the badge says *what is happening to it*:

| Meaning | Glyph |
|---|---|
| cloud side | cloud |
| this device | gamepad |
| in-game save | floppy |
| savestate | picture |
| will download / upload | cloud-download / cloud-upload (pre-composed) |
| may not load here | warning (#19) |
| resolved / discarded | check-circle / times-circle |

All present in the shipped `fontawesome-webfont.ttf` — see #23 for codepoints
and why pre-composed glyphs beat overlaying two text glyphs. The source badge
over a screenshot *is* a real overlay, but it is a badge over an image, which is
ordinary.

**Conflict is a property of the pair, not of a side.** The header owns "this is
a conflict"; the panels own "here is what each one is".

## Settled

- **No file size** on either panel — not actionable for choosing between saves.
- **Progress does not survive an interruption.** Quitting discards decisions and
  applies nothing. Redoing a few choices beats risking a half-applied
  resolution, and it keeps the "nothing transfers until COMPLETE" guarantee
  simple.
- **Cloud is always the left column.**
- **Keep discarded saves is off by default**, with a count selector.

## What ES already does (checked, not assumed)

- `SaveStateRepository::getNextFreeSlot()` returns **highest occupied + 1**, and
  scans to 99999 — so slot exhaustion is not a real constraint and there is no
  99-slot ceiling to design around. **Use it for merges.** Because ES compacts
  slots after every deletion (below), slots are normally contiguous, and
  "highest + 1" *is* the lowest unused slot. Reusing it also inherits
  `firstslot` handling and any future change to slot conventions.
- `GuiSaveState` calls `renumberSlots()` after **every** savestate deletion, so
  gaps do not persist in normal local use. The only way to get one is sync
  bringing down a higher-numbered state from another device; appending past it
  is still safe, and avoids placing a merged save where ES may renumber later.
- `SaveState::copyToSlot(slot, move)` **already renames the `.png` alongside the
  state**, so a merged savestate keeps its screenshot for free. Reuse it.
- `SaveStateRepository::renumberSlots()` compacts slots to be contiguous, if
  reclaiming gaps is ever wanted.
- Slot filenames are `{{romfilename}}.state{{slot}}` with the thumbnail at
  `{{romfilename}}.state{{slot}}.png`, from `firstslot = 0`.

## Detection, and what triggers the wizard

A sync that reports conflicts opens the wizard. The mechanism is
**`rclone bisync`** (#9), whose defaults suit this well:

- `--conflict-resolve none` — the default — **detects and reports rather than
  picking a winner**, which is exactly the project's rule that conflict
  handling must never default to recency.
- `--conflict-loser num` renames the loser rather than deleting it.

Two consequences worth planning around:

- Much of the detection engine (#22) may be *reading what bisync already found*
  rather than diffing manifests ourselves. Manifests are still needed to
  **display** a conflict — device name, emulator, core — but perhaps not to
  find one.
- **Do not let bisync do the renaming for savestates.** Its loser suffix
  (`…conflict1`) breaks the `{{romfilename}}.state{{slot}}` pattern ES matches
  on, so the file would vanish from the savestate manager. Detect with bisync,
  then resolve into slots ourselves.

## Audit log

Every resolution is recorded: what conflicted, which side won, where a merged
copy went, and when. This replaces per-save origin tracking — after a merge the
copy is simply a savestate in a slot, and the log is what remembers it came
from the cloud.

Needs deciding: where it lives, how long it is kept, and whether it is
surfaced in the UI or is purely a support artefact.

## Open questions

- Where does the audit log live, what is its retention, and is it visible to
  the player?
- **Slot numbers are not stable identities across devices.** ES renames files
  when it renumbers after a deletion, which sync sees as delete + create, so
  the same state can arrive on another device under a different slot number.
  Conflict pairing, the manifest and the audit log all need to key on something
  other than the slot. Tracked on #24.
