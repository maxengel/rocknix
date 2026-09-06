Part of #11. Identity is decided (D-CLOUD-030); this issue is the merge and install half, consumed by #23.

**What changed.** No per-core slot survey and no slot cap: `getNextFreeSlot` scans to 99999 (`SaveStateRepository.cpp`). No "insert and shift". Standalone emulators are keep-one by construction because ES's slot machinery only exists for RetroArch.

### The adapter's rules (R8)

- **Next free slot** is computed by the adapter from the **visible numbered states from `firstslot`**, not by calling `getNextFreeSlot` blind: with only an auto state present, that function returns `-99` and `setupSaveState` passes `-state_slot -99` to RetroArch (Gate 3 watches this). Highest occupied + 1 among slots ≥ `firstslot`.
- **Slots are reserved in memory** for the length of the walkthrough, so two KEEP BOTH decisions for one game never collide; they are re-checked at COMPLETE.
- KEEP BOTH exists only where `SaveStateRepository::isEnabled` is true (emulator `retroarch`) and the unit is a save state; game saves and every standalone unit are keep-one.
- **Install (D7)**: the cloud copy is fetched to stage, hashed, then renamed into `makeStateFilename(slot)` and its PNG into the image name — the same pair `copyToSlot` moves (`SaveState.cpp`); state then PNG; a rename is the only mutation in the tree, so a kill leaves either the old or the new file, never a torn one (A7). `copyToSlot(slot, move=false)` → verify → remove is the shape for any local re-slot (D-CLOUD-026).
- **The auto rule**: this device keeps its `.state.auto`; the cloud's `.state.auto` and PNG are installed as the next free numbered slot; one sentence, no question (#23). Consequence to record in Gate 12: this device's auto becomes the cloud's at the next push, so the other device applies the same rule in turn.
- **Compaction** (D-CLOUD-030): the same hash in two slots of one game after a sync → the higher slot is removed, only after both files are re-read equal, logged; it happens in the same apply plan as any move, never as a separate pass (P5). Not retained (I13).
- Moves: the cloud's layout wins (P5).
- **Recovery (D2)**: every apply writes its pending record before the first effect and checkpoints after each rename; a restart completes or reverts per the record; nothing half-installed is ever listed by the save state manager.

### A gap to close before coding

`copyToSlot` calls `makeStateFilename(slot)` with the header's default for `fullPath`; `SaveState.h` is not in the corpus, so whether that default is `true` is unverified. Read it: a `false` default would rename into the working directory. Same for `SaveStateRepository.h`'s defaults.

### Acceptance

- [ ] From a repository holding only `game.state.auto`, KEEP BOTH installs the cloud copy as `game.state` (slot 0 with `firstslot = 0`), and RetroArch is never handed `-state_slot -99`.
- [ ] Two KEEP BOTH decisions for one game in one walkthrough land in two distinct slots; the save state manager shows both thumbnails.
- [ ] A dry-run fixture (planted states, a divergent pair, a duplicate hash in two slots, a renumbered move) produces the plan the rules above predict, and applying it leaves exactly one copy of each version with its PNG.
- [ ] Kill the process after the state's rename and before the PNG's: on restart the pair is completed; the manager never showed a state without its picture.
- [ ] A game save conflict shows KEEP BOTH dimmed with its reason; so does any DuckStation, PPSSPP or Flycast unit.

**Preceded by** Gates 3, 6, 12 (the unit table). **Does not build**: slot caps, insert-and-shift, ordering by timestamp, a merger.

---

---
*Body written from the council's handoff, `research/council-runs/2026-09-05-conflict-resolution-foundation/final-issue-draft.md` (consensus plan `revised_approaches/consensus_plan.md`), applied 2026-09-06 per the maintainer.*
