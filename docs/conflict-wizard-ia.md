# Conflict wizard — IA and flow

Low-fidelity structure for the cloud-save conflict wizard (#23). **Information
architecture and interaction only** — what is on screen, what the player can do,
and where each choice leads. No visual design: no sizes, colours, spacing or
component choices. Those come later, against
[es-ui-style-guide.md](es-ui-style-guide.md).

Companion to [es-menu-map.md](es-menu-map.md), which places this subtree in the
wider menu. Rendered low-fidelity wireframes of these screens, with the reasoning
in the margins: <https://claude.ai/code/artifact/5da9ce12-b088-4db0-8557-4b34fe454dd6>

> **Rev 3.** Decisions settled, several against ES's actual savestate code.
> No file size shown; interrupted runs discard their decisions; cloud is
> always the left column; *keep discarded saves* is off by default with a
> retention count. Merged states go to the **next free** slot, matching
> `SaveStateRepository::getNextFreeSlot()`, which appends rather than filling
> gaps.

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
    SYNC([sync finds a fork]) --> ITEM

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
| KEEP BOTH | yes — moves to the **next free** slot | **no** — fixed slots; shown disabled with a reason |
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

- `SaveStateRepository::getNextFreeSlot()` returns **highest occupied + 1** — it
  appends. It scans to 99999, so slot exhaustion is not a real constraint and
  there is no 99-slot ceiling to design around.
- `SaveState::copyToSlot(slot, move)` **already renames the `.png` alongside the
  state**, so a merged savestate keeps its screenshot for free. Reuse it.
- `SaveStateRepository::renumberSlots()` compacts slots to be contiguous, if
  reclaiming gaps is ever wanted.
- Slot filenames are `{{romfilename}}.state{{slot}}` with the thumbnail at
  `{{romfilename}}.state{{slot}}.png`, from `firstslot = 0`.

## Open questions

- **Free on which side?** "Next free slot" must mean free in the cloud *and* on
  the device, or the merge collides at the next sync.
- **Is a slot cap wanted at all?** Exhaustion is not a system constraint. A cap
  would be a product judgement about how many states a player can usefully
  manage — and without one, a "slots nearly full" warning mitigates a problem
  that does not exist.
- **Does a merged copy keep its origin?** Once moved to a new slot it is no
  longer "the cloud one"; worth deciding whether the manifest records where it
  came from.
