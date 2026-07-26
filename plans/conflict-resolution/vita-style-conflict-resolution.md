# Cloud Saves: Visual Conflict Resolution — planning notes

Milestone: "Cloud Saves: Visual Conflict Resolution" (fork). Epic: issue #11;
tasks #19–#25. Captured 2026-07-26 from maintainer direction.

## Product vision
Vita-style: side-by-side screenshots of the cloud copy and the on-device copy,
walked system → game so the pass stays logical. Choices: KEEP CLOUD / KEEP
DEVICE / MERGE, with directional arrows + dimming making the survivor obvious.
Native EmulationStation only (console-first rule applies).

## Key decisions & rationale
- **Merge = re-slot, never overwrite**: conflicting savestate appends to the
  next free slot (or inserts, shifting later slots). Slot-limited cores get
  keep-one only. Game saves (SRAM) are binary-choice.
- **Manifests over mtimes**: sidecar metadata (game/ROM, UTC + local time,
  device friendly name via device-tree mapping, emulator/core + version,
  screenshot, slot, schema version). Detection compares against last-synced
  state — "both diverged" is the only true conflict.
- **Cross-device is the endgame**: saves portable; savestates keyed by
  (core, core-version, arch?) — compatibility table from #19 drives UI badges
  and whether cross-device resume is offered.
- **Sync model**: one player, many devices, never concurrent. Conflict cause:
  forgot to sync up on A → synced down/played on B → synced up.
- **Reversibility (V2, planned now)**: snapshot saves before applying any
  resolution; rollback restores byte-for-byte. Schema reserves the fields.

## Open questions
- Per-core state-header version sensitivity (needs the #19 survey).
- Screenshot source for cores without RetroArch state thumbnails.
- Where the last-synced manifest snapshot lives (local db vs remote marker).
- Friendly-name source of truth: device tree `compatible` → curated map.
