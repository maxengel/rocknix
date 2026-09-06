# #24 [OPEN] conflict-resolution: savestate merge semantics (slot renumbering + limits)
labels: cloud-saves  milestone: Cloud Saves: Visual Conflict Resolution

Part of the conflict-resolution milestone (epic: #11). Feeds the wizard (#23).

MERGE for savestates means **keeping both sides** by re-slotting: the conflicting state increments to the next free slot (likely appended at the end) or is inserted with later states shifted down — no state is lost.

## Tasks / research
- [ ] Per-core slot model survey: max slots, slot-in-filename conventions (RetroArch `.state`, `.state1..N`, `.auto`), which cores tolerate renumbering (pure file rename vs embedded metadata).
- [ ] Define merge algorithm: append vs insert+shift; deterministic ordering (by UTC timestamp); thumbnail sidecars must move with their states.
- [ ] Slot-limited cores: when the limit would be exceeded, merge is not offered — wizard falls back to keep-one (document per-core in the #19 table).
- [ ] Game saves (SRAM): merge is generally impossible — binary choice only; confirm exceptions (e.g. per-slot memcard formats) are out of scope for v1.

## Acceptance
Merge spec reviewed; a dry-run tool demonstrates re-slotting on a fixture set without corruption.
