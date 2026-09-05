author:	maxengel
association:	owner
edited:	false
status:	none
--
## Verified against a device: where the screenshots come from

Checked on a running GENERIC_X64 build rather than assumed, since the whole design rests on the picture being there.

**Savestates: the screenshot exists and already syncs.** `retroarch.cfg` ships `savestate_thumbnail_enable = "true"`, so RetroArch writes a PNG beside every savestate. Planting fixtures and running `cloud_backup` against the QA endpoint (`tools/cloud-round-trip`) shows they reach the cloud under the **current** allowlist — no filter change needed:

```
GAMES/savestates/game.state1
GAMES/savestates/game.state1.png       <- thumbnail
GAMES/savestates/game.state.auto.png   <- auto-slot thumbnail
GAMES/saves/game.srm                   <- no PNG
```

`+ /savestates/**` and `+ /**/*.state*` both catch them.

**Battery saves have no screenshot at all.** RetroArch only thumbnails savestates. `game.srm` arrives alone, and there is nothing to render in its panel.

That matters because this issue currently says "Per conflict: side-by-side panels ... showing screenshot" for *every* conflict, and battery-save conflicts are likely the common case — every game with an in-game save produces one, whether or not the player ever touches savestates.

### The trap to avoid

The obvious workaround - show that game's most recent savestate thumbnail next to a `.srm` - is worse than showing nothing. The entire premise here is that the player picks by recognising the picture. A picture that is *not* of the save being chosen will be read as if it were, and will drive wrong choices in exactly the situation where a wrong choice loses progress. If a substitute image is shown at all it has to be labelled as what it is, and visibly distinct from a real save screenshot.

### Suggested amendment to the flow

- [ ] Savestate conflicts: screenshot panel as specified.
- [ ] Battery-save conflicts: no screenshot. Lean on timestamp (device-local), size, source device, and game identity (box art from the scraper is fine here - it identifies the *game*, which is not in question).
- [ ] Never present an image that is not of the save under consideration without labelling it as a substitute.
- [ ] Decide whether the two conflict kinds share one panel layout or get distinct ones; a screenshot-shaped hole in the `.srm` panel will read as a loading failure.

### Dependency note

Timestamp comes free from the filesystem, but **source device and emulator/version do not exist yet** - they need the manifest from #20/#21. Until those land, the panels can show screenshot + timestamp + size only, which is enough to be useful for savestates and thin for battery saves.
--
author:	maxengel
association:	owner
edited:	false
status:	none
--
## Battery-save panels: icons, and what can honestly fill them

Agreed on icons rather than a screenshot-shaped hole. ES already ships the glyph font we use elsewhere in the cloud UI (`_U("")` and friends), so this needs no new assets and stays theme-consistent.

Date, time and device are the load-bearing three. Checked what else is genuinely derivable rather than assumed:

| Field | Source | Real? |
|---|---|---|
| `gametime` (total seconds played) | ES gamelist | **yes** - `FileData.cpp:782` accumulates elapsed seconds on game exit, and it is already a gamelist sort option |
| `playcount`, `lastplayed` | ES gamelist | yes |
| Box art | gamelist `thumbnail` / `image` / `marquee` / `boxart` | yes, where the game was scraped |

### Box art goes in the header, not in the panels

It is a property of the **game**, so it is identical on both sides by definition. Putting it inside each panel implies the two differ in something they cannot differ in - the same misleading-image failure as substituting a screenshot, just quieter. One box-art in the header answers "which game are we resolving?"; the panels stay purely about what distinguishes the two saves.

### Play time is per-device, and is not progress

Two caveats worth building around rather than discovering later:

1. `gametime` lives in the **local** device's gamelist. The cloud side's value cannot be read locally at all - it has to have been captured into the manifest when that device wrote the save (see #21). Without that the cloud panel simply has no play time to show, and the UI must handle one side having it and the other not.
2. More hours does not mean further along. It can be idle time, a replay, or a second playthrough on the other device. Worth showing as a signal; worth **not** sorting, defaulting or auto-selecting by, which would quietly reintroduce the recency-style heuristic this milestone exists to avoid.

### Suggested panel content for a battery save

- Kind icon (battery save vs savestate) so the two conflict types are distinguishable at a glance
- Timestamp, device-local, with the source device's friendly name
- Play time and play count **where the manifest carries them**, blank where it does not - never zero-as-unknown
- File size as a last-resort differentiator
--
author:	maxengel
association:	owner
edited:	false
status:	none
--
## Decisions: no play time, optional box art, glyph-based iconography

Settled:

- **Play time is out.** Not shown, and #21 does not need to capture it.
- **Box art is optional, and lives in the header** - one image identifying the game, never duplicated per side.
- **Battery saves get a glyph**, not an empty screenshot frame.
- **Visual semantics layer on top of a source icon**: cloud vs console for where a save is, with conflict / upload / download applied over it.

## The palette is available today

Verified against the shipped `resources/fontawesome-webfont.ttf` by reading its cmap - every codepoint below is present, so this needs no font work and no new assets:

| Glyph | Codepoint | Use |
|---|---|---|
| cloud | `` | source: the cloud side |
| gamepad | `` | source: this device |
| floppy | `` | kind: battery save (`.srm`) |
| cloud-upload | `` | action: device wins, push up |
| cloud-download | `` | action: cloud wins, pull down |
| warning triangle | `` | state: conflict |
| check-circle | `` | state: in sync / resolved |
| times-circle | `` | state: discarded side |
| refresh | `` | state: syncing |
| arrow-circle-up / down | `` / `` | direction where a cloud metaphor is wrong |

``, ``, ``, ``, `` and `` are already used elsewhere in our UI, so they will read consistently.

## Most of the "overlay" is already pre-composed

Worth knowing before building a compositing layer: FontAwesome **already ships the cloud combinations as single glyphs**. `cloud-upload` and `cloud-download` are one codepoint each, not a cloud with an arrow stuck on it. So the two most common cases need no overlay at all - just a different glyph.

That matters because these render as text. Overlaying two glyphs is not string concatenation; it means two positioned components with explicit z-order, which is more layout to get right and more to go wrong across themes and resolutions. Use the pre-composed glyph wherever one exists, and reserve real overlaying for combinations FontAwesome does not have - gamepad-plus-conflict being the obvious one.

Where a genuine overlay is needed, the badge should sit consistently (one corner, one size relative to the base glyph) so it reads as a modifier rather than a second icon competing with the first.

## Still to decide

- Icon for savestate-kind conflicts. The screenshot carries that panel, so the glyph is only a small kind marker - `` (picture) is already in use and would pair naturally with the floppy.
- Whether "conflict" is a badge over the source icon, or a property of the row containing both panels. Badging both sides with a warning says the same thing twice; the conflict is the *pair*, not either side.
--
author:	maxengel
association:	owner
edited:	false
status:	none
--
IA and flow mockups are up before any UI work: [`docs/conflict-wizard-ia.md`](https://github.com/maxengel/rocknix/blob/next/docs/conflict-wizard-ia.md), in the same Mermaid-and-prose form as the menu map, and linked from it.

Covers the walkthrough flow, abstracted wireframes for each screen (entry, savestate compare, battery-save compare, review, apply), and the source/state glyph semantics — structure only, no visual design.

Two things it pins down that were not previously written anywhere:

- **What counts as a conflict.** Cloud-only and device-only files are not forks; they sync without prompting. Only "changed on both sides since they last agreed" asks. Otherwise the entry screen reports an alarming number when nothing is at risk.
- **Deferring must always be safe.** Nothing transfers until APPLY, and LATER never costs anything. If it can, players feel hurried into the snap decision that loses a save — which is the failure this whole milestone exists to prevent.

Four open questions are listed at the bottom rather than decided — mostly about how the walkthrough behaves on a long list, and what happens to a deferred conflict on the next sync.
--
author:	maxengel
association:	owner
edited:	false
status:	none
--
Rendered wireframes, deliberately low-fidelity, with the reasoning for each screen in the margins:

https://claude.ai/code/artifact/5da9ce12-b088-4db0-8557-4b34fe454dd6

Five screens — entry, savestate compare, battery-save compare, review decisions, done — drawn at device aspect rather than desktop width, so the layout is judged under the constraint it actually has to work in.

One thing worth deciding early, called out at the bottom of the page: the smallest target is the RG351M at roughly 480×320, and that is where a side-by-side pair of screenshots is tightest. If each thumbnail ends up below the size where a player can recognise the moment, screen 02 has lost the only advantage it has over a list of timestamps. Worth laying out at the smallest panel first rather than designing at 640×480 and scaling down.
--
author:	maxengel
association:	owner
edited:	false
status:	none
--
## Rev 2 — three screens collapse into one

Wireframes and [`docs/conflict-wizard-ia.md`](https://github.com/maxengel/rocknix/blob/next/docs/conflict-wizard-ia.md) updated (same URL: https://claude.ai/code/artifact/5da9ce12-b088-4db0-8557-4b34fe454dd6).

- No entry screen — the count becomes the header of the first conflict.
- No summary — the last CONTINUE becomes **COMPLETE**. The summary survives as an opt-in setting, *Review decisions before applying*.
- No deferral — replaced by **KEEP LEFT / KEEP RIGHT / KEEP BOTH**, with the selected column(s) highlighting.
- **KEEP BOTH is savestate-only**, moving the merged copy to the lowest unused slot. In-game saves have fixed cartridge slots, so it is shown dimmed with a reason rather than hidden.
- Metadata splits by kind: core + version on a savestate is **compatibility** information, since states are core- and chipset-specific; emulator + version on a memory-card save is context, since those are usually portable.

Deferral being replaced by *keep discarded saves* is the part I think is strongest — it answers the same worry ("I am not sure") without leaving a conflict permanently unresolved, and it is what makes a one-way choice acceptable on in-game saves.

### Consequences worth deciding before build

- **KEEP BOTH needs "lowest unused" to mean unused on *both* sides.** A slot free locally but taken in the cloud collides at the next sync — one resolved conflict becomes a new one. The state's screenshot also has to move with it, or the picker shows the wrong picture next time, in a UI whose whole premise is picking by picture.
- **Slots full** should refuse KEEP BOTH up front with a reason, not fail at apply.
- **Does *keep discarded saves* default on or off?** Off makes the default path destructive. On needs a retention rule — kept forever, discarded copies grow without bound on card storage. This is the same machinery as #25, worth building once.
- **Fix which side is left** (cloud or device) and never vary it. Muscle memory carries a long list; a column that swaps is how the wrong save gets picked at speed.
- **Nothing applies until COMPLETE**, so quitting partway is safe — but it also discards every decision made. Fine for three conflicts, less so for thirty.
--
author:	maxengel
association:	owner
edited:	false
status:	none
--
## Rev 3 — decisions settled, three of them by reading ES rather than choosing

Wireframes and [`docs/conflict-wizard-ia.md`](https://github.com/maxengel/rocknix/blob/next/docs/conflict-wizard-ia.md) updated (same URL).

**Settled:** no file size shown (not actionable); interrupted runs discard their decisions and apply nothing; cloud is always the left column; *keep discarded saves* off by default with a count selector that stays visible-but-dimmed while off, and doubles as the retention bound.

**Three questions turned out to be answerable from ES's own code, and two of the answers change the design:**

- **There is no 99-slot ceiling.** `SaveStateRepository::getNextFreeSlot()` scans to **99999**. Slot exhaustion is not a real constraint, so a "you have used 80% of your slots" warning would be mitigating a problem that does not exist. A cap is still available to us as a *product* judgement about how many states a player can usefully manage — but it is a choice, not a limit we are forced into.
- **ES appends; it does not fill gaps.** That same function returns **highest occupied + 1**. "Lowest unused" would have contradicted how every other savestate on the device is allocated, and would quietly fill a gap the player may have made on purpose. Spec now says *next free slot* and reuses the existing allocator.
- **The screenshot moves for free.** `SaveState::copyToSlot(slot, move)` already renames the `.png` alongside the state. That closes the risk I raised earlier — a renumbered state whose thumbnail stayed behind would show the wrong picture in a picker whose whole premise is choosing by picture.

Also noted for whoever builds it: `renumberSlots()` exists if reclaiming gaps is ever wanted, and the filename pattern is `{{romfilename}}.state{{slot}}` / `.state{{slot}}.png` from `firstslot = 0`.

**Still open:** whether "next free" means free on *both* sides (otherwise the merge collides at the next sync), whether we want a slot cap at all given the above, and whether a merged copy records where it originally came from.
--
author:	maxengel
association:	owner
edited:	false
status:	none
--
**Pre-futro audit — 2026-09-05.** Live state: thumbnails on, `.png` moves with `copyToSlot`, glyph codepoints present; no conflict UI exists in the ES tree (retro finding stands). Body's *Superseded* note keeps it aligned with IA rev 4. **Post-futro audit — 2026-09-05.** Four ACs added (pre-pass gate, discard visibility, 480×320 first, badge after #19). Depends on #22. Green light for the layout work at the smallest panel once #22 produces a conflict JSON fixture; badge waits for #19.
--
