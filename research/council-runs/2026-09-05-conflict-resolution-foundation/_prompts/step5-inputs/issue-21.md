# #21 [OPEN] conflict-resolution: capture manifests when saves/states are written
labels: cloud-saves  milestone: Cloud Saves: Visual Conflict Resolution

Part of the conflict-resolution milestone (epic: #11). Depends on the manifest schema (#20).

Write the manifest sidecars at the moment saves/states are produced.

## Tasks
- [ ] Hook points: the game-exit path that already runs the save sync — `FileData::launchGame` → `ThreadedCloudSync` (`e74fe4e58a`); the OS hook `/usr/bin/scripts/game-end/` was removed (`357dfcffd7`) and must not come back as a second path. Plus RetroArch save/state naming conventions and standalone emulators' save dirs.
- [ ] Populate device/emulator fields (friendly name from #19; core version discovery per emulator).
- [ ] Pair screenshots: reuse RetroArch state thumbnails; define capture for cores without them.
- [ ] Backfill strategy for pre-existing saves (manifest-less files must still sync and appear in conflicts with degraded info).
- [ ] Keep manifests inside the existing sync allowlist so they travel with the saves.

## Acceptance
Playing a game and saving/stating produces correct manifests; existing saves keep working without them.


## Futro adjustments (2026-09-05, futro on #11)

- [ ] Manifests for **in-game saves** pass the sync allowlist. Verified 2026-09-05 with a fixture on the RG35XX SP: `rclone lsf -R --files-only --filter-from /storage/.config/cloud_sync-rules.txt` passes everything under `savestates/` and excludes `snes/game.srm.json`, `snes/game.srm.manifest`, `snes/.cloud-meta.xml` (`- /**/*.xml`, `- /**`). Either the manifest lives under `savestates/` or the rules gain an explicit `+`; the fixture command is the acceptance test.
- [ ] Nothing stamps a file it did not write: pre-existing saves stay `unknown`, and `unknown` is a value the wizard renders, not an error (per #10 and #20 threads; `upgrade-and-install.md`).
- [ ] Any script this issue adds that touches the cloud takes `take_cloud_lock` (`b9ea9f3fe8`).
- [ ] Device fields come from `cloud_device_id` / `--label` (verified on the device: `ROCKNIX-ee5013fc56`, `Anbernic-RG35XX-SP`).



## Constraints from the schema and its alignment review (2026-09-05)

- [ ] **Core pins file.** `core_build` is our `PKG_VERSION` pin and nothing on the device carries it (`/usr/lib/libretro/*.info` exists but holds libretro-super's `display_version`). Emit `/usr/share/rocknix/core-pins` at image build — one line per core package, `<package> <PKG_VERSION>` — from `LIBRETRO_CORES` in `virtual/emulators` via `get_pkg_version` (`config/functions`). The capture step maps core name → package (`mgba` → `mgba-lr`, `genesis_plus_gx` → `genesis-plus-gx-lr`; exceptions in a small table) and records `"unknown"` when the map has no answer.
- [ ] **Told, not discovered.** ES passes `--system`, `--rom`, `--emulator` (`getEmulator(true)`) and `--core` (`getCore(true)`) on the command line at the exit path (`FileData.cpp:836`); the capture step never infers which core wrote a state. Standalone emulators pass their own name as the core.
- [ ] **No second rclone spawn.** The manifest is written *before* `cloud_backup --yes --saves-only --recent` runs, in the same exit path; it lives under `savestates/` and is newer than the last-backup stamp, so it rides the existing `--max-age` window. D-CLOUD-028's budget stands: one rclone start (~1 s on an A53), no extra listing.
- [ ] Written whole to a temporary name and renamed into place; a reader never sees a torn file.
- [ ] `docs/save-manifest-schema.md` §6 is the field contract; §7 the worked examples; the `manifest-<id>.json` file is asserted by the #35 step added the same day.

