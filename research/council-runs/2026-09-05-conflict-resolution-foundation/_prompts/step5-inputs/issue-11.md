# #11 [OPEN] cloud-sync: conflict resolution between local and cloud
labels: enhancement, epic, cloud-saves  milestone: Cloud Saves: Visual Conflict Resolution

**Epic** for the *Cloud Saves: Visual Conflict Resolution* milestone.

## Vision (Vita-style)

Like the PlayStation Vita's sync screen: when local and cloud diverge, the player walks the conflicts **system by system, game by game**, seeing **both versions side by side with screenshots**, and chooses **KEEP CLOUD / KEEP DEVICE / MERGE** — with unmistakable arrow/dimming iconography showing what survives. Everything is native EmulationStation, controller-first.

- **Merge** (savestates): keep both by re-slotting — the conflicting state increments (append) or inserts with later states shifted down. Slot-limited cores fall back to keep-one (#24).
- **Metadata** per save/state: game + ROM name, UTC timestamp (+ device-local rendering), handheld friendly model name (device-tree mapping), emulator/core + version, screenshot, slot, schema version (#20).
- **Cross-device**: game saves are portable; savestates are bound to core/version/arch — a compatibility rules table (#19) drives badges and merge offers. Long-term goal: pick up on one device, sync, resume on another.
- **Sync model**: one player, many devices — not concurrent play. Conflicts arise from a forgotten sync-up before syncing down elsewhere; the detection engine therefore tracks last-synced state, not just timestamps (#22).
- **Safety**: divergent items transfer nothing until resolved; V2 snapshots make every resolution reversible (#25). Progress preservation stays the prime directive.

## Task breakdown

- [ ] #19 — research: savestate cross-device compatibility matrix + device friendly names
- [ ] #20 — design: save/savestate metadata manifest (schema, screenshots, snapshot-ready)
- [ ] #21 — backend: capture manifests at save/state write time
- [ ] #22 — backend: conflict detection engine (last-synced tracking, JSON for UI)
- [ ] #23 — ES UI: Vita-style conflict wizard (system→game, side-by-side, iconography)
- [ ] #24 — merge semantics: savestate re-slotting + per-core slot limits
- [ ] #25 — V2: pre-change snapshots & rollback (planned now, built after the wizard)

## Ordering
#19/#20 (parallel research+design) → #21 → #22 → #23 (+#24 feeding it) → #25. Relates: #10 (namespacing), #9 (bisync), #8 (auto-sync), #15 (native ES program).
