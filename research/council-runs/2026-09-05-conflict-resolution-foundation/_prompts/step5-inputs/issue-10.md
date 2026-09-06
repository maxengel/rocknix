# #10 [OPEN] cloud-sync: per-core savestate namespacing, with the core build recorded in a per-device manifest (D-CLOUD-017)
labels: enhancement, cloud-saves  milestone: Cloud Saves: Visual Conflict Resolution

## Summary
Namespace savestates **per core** and **per chipset/arch** (arch element TBD) so incompatible cores/architectures can't clobber each other's states across devices.

## Motivation
Savestates frequently break across core versions and CPU architectures; syncing a flat namespace risks corruption when a state made on one device/core is restored on another. The rocknix.org cloud-sync docs already warn about state incompatibility.

## Scope
- Leverage RetroArch's per-core / per-content subfolder options.
- Define a namespacing scheme (core + chipset/arch) and a migration for existing states.

## Open question
Key on **arch** (aarch64 vs arm), **chipset**, or **device**? (TBD)

_Related: conflict resolution, bisync._



## Superseded (D-CLOUD-017, 2026-09-01) — body note added by the futro of 2026-09-05

The open question above is answered: key on **core**, not arch, chipset or device. Directories are structure and churn permanently; the core build (our own `PKG_VERSION` pin) goes in a per-device manifest under `savestates/.rocknix/states-<device-id>.json` as data. Existing states are `unknown`. Warn, do not block. Game saves are excluded. See the 2026-09-01 comment for the full reasoning.

Verified 2026-09-05 on the RG35XX SP: the layout is still flat per system (`/storage/roms/savestates/fbn/mslug.state1`), so this is decided and not built. ES already substitutes `{{core}}` in a savestate `directory` template (`SaveStateConfigFile.cpp:51-55`); open item before building:

- [ ] ~~Locate the shipped `es_savestates.cfg`~~ **There is none** (alignment review, 2026-09-05): not in the ES repo, not in the rocknix tree, not on the device. ES runs on its compiled defaults (`SaveStateConfigFile.cpp` `Default()`: `directory = "{{system}}"`) and `Paths.cpp:83` hard-codes the root `/storage/roms/savestates`. Per-core directories therefore mean **creating** an `es_savestates.cfg` for the ES package *and* pointing RetroArch's `savestate_directory` (`setsettings.sh:811`, today `${SNAPSHOTS}/${PLATFORM}`) at the same layout — two consumers, one layout, verified together.
- [ ] The layout change is a migration of player data: read both layouts, copy-verify-delete, never stamp what was not verified (`upgrade-and-install.md`, blindspot 10).


