# #19 [OPEN] conflict-resolution: research savestate cross-device compatibility matrix
labels: cloud-saves  milestone: Cloud Saves: Visual Conflict Resolution

Part of the conflict-resolution milestone (epic: #11).

Game saves (SRAM/memcard) are generally portable; **savestates are bound to emulator, emulator/core version, and often architecture**. Before cross-device sync can be safe, we need a rules engine for "is this savestate usable on that device?".

## Tasks
- [ ] Inventory the emulators/cores we ship (`*-lr`, `*-sa`) and document savestate portability per core: same-core cross-arch? cross-version? (RetroArch cores vary; some embed core version in the state header.)
- [ ] Define **compatibility keys**: (core, core-version, arch?, platform?) → the minimal tuple that must match for a state to load. Relates #10 (per-core/arch namespacing).
- [ ] Device identity: map device-tree compatible strings / `HW_DEVICE` to **friendly model names** (e.g. "RG353V", "Retroid Pocket 5") for display and manifests.
- [ ] Deliverable: `compatibility rules` document + machine-readable table the conflict engine can consume.

## Test sequencing (added 2026-08-27)

A second H700 handheld (RG-SP) joins the existing RG35xx SP, giving **two devices on one chipset** — the control this matrix previously lacked. With three different build families only, a failed transfer cannot separate chipset from core version from anything else. Holding the chipset constant makes the result decisive either way:

- transfers → chipset is the real variable, build the cross-chipset matrix
- does not transfer → chipset was never the variable, and #10's per-chipset namespacing is aimed wrongly

Run the same-chipset control **first**; it is far cheaper than the full matrix and determines whether the matrix measures what it claims to.

## Acceptance criteria

- [ ] A reviewed doc + machine-readable table answering, for each shipped core: which other devices' states it can load, keyed by the compatibility tuple above.
- [ ] Device identity resolves to a **model**, not a build target. `scripts/image:163` sets `HW_DEVICE="${DEVICE}"`, so twelve distinct Anbernic handhelds all report `H700`; two devices sharing that build target must report distinct identities, verified on the RG35xx SP and RG-SP pair. The model string is available at `/proc/device-tree/model` (precedent: `ap6611s/autostart/008-ap6611s`, and H700's `bootloader/update.sh` reading `rocknix-dt-id`).
- [ ] The same-chipset control is run and recorded before the cross-chipset matrix.

Blocks #20 (a manifest recording `H700` as provenance cannot distinguish two H700 devices) and #23 (`docs/conflict-wizard-ia.md` specifies `device + model` per side; two identical `H700` rows convey nothing). Related: #44.

