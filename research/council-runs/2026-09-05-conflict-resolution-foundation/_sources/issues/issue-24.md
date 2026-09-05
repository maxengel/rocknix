author:	maxengel
association:	owner
edited:	false
status:	none
--
Design session on #10 (2026-08-19) hands this issue a concrete case beyond the conflict-resolution one it was filed for.

If a player enables the permissive setting ("show all" rather than only their own build family's savestates), incoming states from another device must be materialized **into free slots**, not written over the slot they collide with. Copy-and-replace was explicitly rejected on #10: it is a recency overwrite, which the subsystem's guardrail forbids (*"a newer file can hold less progress than an older one from another device"*), and it is invisible to the player until they load the slot and find themselves somewhere unexpected.

So re-slotting is not only a merge-time concern — it is the mechanism by which cross-device states arrive at all. Two consequences for this issue's scope:

1. **The per-core slot limit becomes a real, common path**, not an edge case. When a core has no free slot, there is nowhere to put the incoming state, and the keep-one fallback needs an explicit prompt rather than a silent drop.
2. **Slots need origin badging.** The savestate manager already renders a grid of thumbnails; a state that came from another build family should say so, so the player choosing between two thumbnails knows which is theirs and which may not load cleanly.

Both are downstream of #19 measuring what actually breaks a state — if compatibility turns out to be coarser than build family, far fewer states need re-slotting at all.
--
author:	maxengel
association:	owner
edited:	false
status:	none
--
## ES renumbers slots on delete, and sync will see that as delete + create

Found while settling how a merged savestate picks its slot.

`GuiSaveState.cpp:236` calls `SaveStateRepository::renumberSlots()` immediately after a savestate is deleted, and `renumberSlots()` compacts every remaining state to be contiguous from `firstslot` via `copyToSlot(slot, move)` — which renames both the state **and** its `.png`.

Two consequences for this issue:

**1. Gaps do not exist in normal local use.** Delete slot 2 of {0,1,2,3} and you get {0,1,2}. So `getNextFreeSlot()` (highest occupied + 1) *is* the lowest unused slot whenever slots are contiguous, and the two only diverge when sync introduces a gap by bringing down a higher-numbered state from another device.

**2. The renumbering renames files, and sync cannot tell that apart from delete + create.** Deleting slot 1 of {0,1,2} turns `game.state2` into `game.state1` on disk. To rclone that is one file gone and another appeared — so the next sync will delete the old name remotely and upload the new one, and on a second device the same states will arrive under different slot numbers than they had.

That is worth designing for explicitly, because it means **slot numbers are not stable identities across devices**. Anything that assumes "slot 3 here is slot 3 there" — conflict pairing, the manifest, the audit log — needs to key on something other than the slot number, or two devices will disagree about which state is which after either of them deletes one.

It may also produce churn: a delete on one device can cause several files to be re-uploaded under new names, which on a metered or slow connection is more than the user did.
--
author:	maxengel
association:	owner
edited:	false
status:	none
--
**Promoted to critical path (retro on #26, 2026-09-04):** the slot-identity question here blocks the manifest schema (#20), not only merge semantics. ES renumbers slots after every deletion (`renumberSlots()`), sync sees delete+create, and the same state arrives on another device under a different number — so slot cannot be the key. Candidates the design already names: the content hash stored in the sidecar (identity of a *version*) plus the audit log (links versions over time). Decide this first.
--
author:	maxengel
association:	owner
edited:	false
status:	none
--
**Pre-futro audit — 2026-09-05.** Live state: `getNextFreeSlot` / `renumberSlots` / `copyToSlot` present at `SaveStateRepository.h:20-21`, `SaveState.h:26`; the device shows both a slot and an auto state with thumbnails (`mslug.state1`, `mspacman.state.auto`). ACs verifiable. **Post-futro audit — 2026-09-05.** No body edit; the retro's promotion to critical path stands — the identity decision here precedes #20's schema. Green light: first task of the batch.
--
author:	maxengel
association:	owner
edited:	false
status:	none
--
## Identity proposal (Task 1 of the batch, 2026-09-05) — `docs/save-manifest-schema.md` rev 0

**A save version is the sha256 of its stored bytes; slot and file name are attributes.** Parked as D-CLOUD-030 for the maintainer's word.

- ES renumbers by `copyToSlot(slot, move = true)` — a rename. The bytes and the hash survive; the slot does not. So *same hash, new path* is a **move** (no conflict, no new version), and *new hash at a path* is a **new version**.
- A slot mismatch across devices for one hash is not a conflict. A renumber followed by a sync can leave one hash in two slots; **open**: compact the higher-numbered copy after re-verifying the hashes are equal (nothing lost by construction), or leave both.
- Lineage per device and path (`replaces`) lives in the per-device manifest (D-CLOUD-017 shape). The last **agreed** hash per path is kept locally, never synced. The cloud's current version is learned from `rclone lsjson --hash` matched against remote hashes the manifests recorded at upload; a backend with no hash (WebDAV) falls back to size+mtime as a hint and sha256 after download.
- Conflict test per path: identical → nothing; only one side changed since agreement → transfer; both changed, or never agreed and different → **wizard**. Moves are folded out first.
- Auto states (`.state.auto`) will be the commonest conflict — two devices diverge on it every session; the wizard should treat it as the "resume point" decision.

Two facts for #20/#21 found on the way: the device **does** ship `/usr/lib/libretro/*.info` (the 2026-09-01 note on #10 said none), but they carry libretro-super's `display_version`, not our `PKG_VERSION` pin — so #21 must emit a core-pins file at image build; and ES knows emulator and core at game exit (`FileData::getEmulator()`, `getCore()`), so capture can be told rather than discover.
--
author:	maxengel
association:	owner
edited:	false
status:	none
--
**D-CLOUD-030 decided (maintainer, 2026-09-05):** identity is the sha256 of the stored bytes; slot and name are attributes. Duplicates left by a renumber-then-sync are **compacted** — the higher slot removed only after both files are re-read and the hashes found equal, with an audit-log line — because the player already resolves real conflicts and unintended clutter must not pile up beside them. `docs/save-manifest-schema.md` §1 updated. This closes the identity half of this issue; the merge algorithm (KEEP BOTH via `getNextFreeSlot`/`copyToSlot`) and the dry-run fixture remain.
--
