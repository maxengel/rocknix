# #37 [OPEN] ES: sync saves from the savestate manager at game launch
labels: cloud-saves  milestone: none

Child of #15 (native ES experience, L3).

The savestate manager appears just before launch and is exactly where a player notices that a save from their other handheld is missing. Today the only fix is backing out to Game Settings → Cloud Tools and running a sync, then relaunching. A tile on this screen removes that entirely.

## Shape

A tile at **position 0** of the existing grid — left of START NEW GAME — that pulls saves and rebuilds the grid in place. Everything else about the screen is unchanged.

Selecting it runs a **saves-only** pull (`cloud_restore --saves-only`, which already exists) behind a blocking `GuiLoading` spinner. That is deliberate: if the sync ran in the background while the grid stayed live, a player could pick a slot that is mid-download or about to be replaced — the worst possible moment. `GuiLoading` already swallows all input and dismisses itself when the worker returns, so "modal, shows status, disappears" is native behaviour rather than new machinery. On completion, rebuild the grid and surface the outcome as a toast.

An in-tile spinner (animating the tile itself instead of a modal) would be a nicer end state, but `GridTileComponent` renders a static image and has no busy state today, so it is a follow-up refinement rather than the first cut.

## The hint

`GuiSaveState` already has a dynamic help bar — `updateHelpPrompts()` is wired to a cursor-changed callback and the prompts already vary by selected item (DELETE / COPY TO FREE SLOT appear only on a populated slot). So the hint belongs there: when the sync tile is selected the bar reads SYNC rather than LAUNCH, which is the idiomatic mechanism and adds no on-screen clutter.

## Acceptance criteria

- [ ] A sync tile is the leftmost item in the savestate grid, shown **only when a cloud remote is configured** (`/storage/.config/rclone/rclone.conf` exists) so it is never a dead end.
- [ ] **The default cursor position is unchanged.** Inserting at index 0 must not move the initial selection onto the sync tile — the grid still opens on whatever it opens on today.
- [ ] Selecting it runs `cloud_restore --saves-only` behind a blocking spinner; the grid cannot be operated until it finishes.
- [ ] The call is wrapped in `timeout` (`/usr/bin/timeout` ships on the image) so a stalled network cannot trap the player on the launch screen. On timeout, report it and leave the grid usable.
- [ ] The grid is rebuilt from disk after a successful sync, so a newly-pulled state is immediately selectable.
- [ ] Outcome surfaced as a toast (`<glyph> SYNC SAVES : FINISHED` / failure pointing at the log), matching the existing cloud toast shape.
- [ ] Help bar reads SYNC when the tile is selected.
- [ ] Respects the single-instance guard — if a sync is already running (boot sync, manual run), say so rather than starting a second.

## Related

- #7 — the boot sync exists but uses `ping google.com` as its liveness check; `cloud_setup --check` is the better primitive now that it exists.
- #14 — single-instance `flock`, which this shares.
- #24 — this screen already has a **COPY TO FREE SLOT** action, which is the mechanism cross-device states would arrive through, and the tiles already render `emulator: core` per slot, so origin badging has a place.
