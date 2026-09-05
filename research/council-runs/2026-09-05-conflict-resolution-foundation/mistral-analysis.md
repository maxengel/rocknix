# Analysis of the Cloud-Save Conflict Resolution Foundation

## 1. Is this foundation sound, end to end?

### Detection (Issue #22, D-CLOUD-029)

**Endorsement with critical amendments.** The bisync-based detection approach is sound in principle, but the current design has a fatal flaw: **the shipped write paths are newest-wins today** (blindspot 28, `00-problem-statement.md` §4, `plans/conflict-resolution/vita-style-conflict-resolution.md` §4). This violates the cardinal rule (D-CLOUD-014, #11) and must be fixed before any detector is built.

**Required changes:**
- **Immediate stopgap:** Add `--update` to the game-exit upload (`cloud_backup --recent`). This turns clobber into skip (the cloud's newer copy survives; the local one waits for the wizard). Evidence in `projects/ROCKNIX/packages/network/rclone/sources/cloud_backup` lines 639-646 shows no `--update` is present today.
- **Permanent fix:** #22 must gate the boot pass, the game-exit pass, and the SYNC row on last-agreed state. The futro's AC (a) is correct: a both-sides-changed save must be refused (not resolved) by every transfer path, shown by a constructed fixture. The current `copy --update` pair is a recency resolver by construction and must be replaced.

**Bisync specifics:**
- **Endorse** `--conflict-resolve none` (default) and `--conflict-loser num` as correct defaults.
- **Amend:** Never let bisync rename savestate losers. Its suffix (`...conflict1`) breaks the `{{romfilename}}.state{{slot}}` pattern ES matches on (`SaveStateRepository.cpp` lines 98-99). The futro's AC (c) is correct: detect with bisync, resolve into slots ourselves.
- **Amend:** The detector must never run `--resync` on its own. `--resync-mode` defaults to path1 (winner-picks-all), which is a recency-free data-loss tool. Use `--recover` and `--resilient` instead (futro AC b).

### Identity and Lineage (D-CLOUD-030, Issue #24)

**Endorse with one critical clarification.** The decision to use sha256 of stored bytes as identity is correct. However:

**Amendment:** The compacting rule (D-CLOUD-030) must be **reversible and logged**. A renumber on one side followed by a sync can leave the same hash in two slots. The current rule removes the higher-numbered copy after re-verification, but this is **destructive** if the player deliberately kept both copies (e.g., for different playthroughs). The audit log must record the removal, and the player must have a way to recover the discarded copy if it was intentional.

**Evidence:** `SaveStateRepository::renumberSlots()` in `SaveStateRepository.cpp` moves files with `copyToSlot(slot, move=true)`, which renames both the state and its `.png`. This is the mechanism that creates duplicates.

### Manifest (D-CLOUD-031, Issue #20)

**Endorse with two amendments.**

**Amendment 1:** The manifest must include **play session boundaries**. The current schema records `captured_at` as the moment the entry was written, but for `.state.auto` files (written on every exit), this conflates multiple sessions. Add a `session_id` field to group states written in the same session.

**Amendment 2:** The `remote_hash` field must be **mandatory after upload**. The current design allows `null` until upload, but this creates a race condition: if a sync is interrupted after the file is uploaded but before the manifest is updated, the remote copy is orphaned. The upload step must atomically update both the file and its manifest entry.

**Evidence:** `docs/save-manifest-schema.md` §6 shows `remote_hash` as nullable. The futro's bisync spike (Issue #22) must test this race condition.

### Presentation and Resolution (Issue #23)

**Endorse with critical amendments to the conflict test.**

**Amendment 1:** The conflict test in `docs/save-manifest-schema.md` §3 is **too conservative**. It treats "never agreed" as a conflict, but this is wrong for:
- A fresh handheld restoring from the cloud (every other device's manifest is `unknown`)
- A device that has been offline for a long time (the last-agreed state may be stale)

**Proposed test:**
| L vs C | A known? | L vs A | C vs A | Verdict | Action |
|--------|----------|--------|--------|---------|--------|
| equal  | —        | —      | —      | identical | nothing |
| differ | yes      | equal  | differ | cloud changed | download |
| differ | yes      | differ | equal  | device changed | upload |
| differ | yes      | differ | differ | **divergent** | wizard |
| differ | no       | —      | —      | **one-way** | transfer, no prompt (conservative) |

**Amendment 2:** The wizard must **batch conflicts by game**. The current design walks system-by-system then game-by-game, but this is inefficient for players with many conflicts. Group conflicts by game (e.g., "3 conflicts in Mega Man 2") and let the player resolve them in one pass.

**Evidence:** `docs/conflict-wizard-ia.md` § Flow shows the current walkthrough order.

### Merge Semantics (Issue #24)

**Amend:** KEEP BOTH must be **slot-aware**. The current design uses `getNextFreeSlot()`, but this is unsafe if the cloud has states in slots the device considers free. The pre-pass must download every cloud-only state before the wizard opens, and the merge must verify the target slot is free on both sides.

**Evidence:** `SaveStateRepository::getNextFreeSlot()` in `SaveStateRepository.cpp` returns highest occupied + 1, which is only safe if the cloud's state is already local.

### Safety and Rollback (Issue #25)

**Replace:** The current design treats snapshots as V2, but this is **too late**. The audit log (`/storage/.cache/log/cloud_audit.log`) must be **mandatory from day one**, because:
- It is the only record of where a merged state came from
- It is the only way to recover from a bad merge
- It is cheap to implement (append-only text)

**Proposal:** Make the audit log a **blocking dependency** for the wizard. The log must record:
- What conflicted (paths, hashes)
- Which side won (KEEP LEFT/RIGHT/BOTH)
- Where a merged copy went (slot)
- When (timestamp)

### Migration off Shipped Write Paths (D-CLOUD-029)

**Amend:** The current plan (write paths stay as shipped until #22 replaces them) is **unacceptable**. The shipped paths are newest-wins today, which violates the cardinal rule. The stopgap (`--update` on game-exit upload) must be applied **immediately**, and the boot pass must be gated on last-agreed state before the wizard ships.

**Evidence:** `autostart/102-cloud-saves` runs `cloud_restore --update && cloud_backup --update`, which is newest-wins by construction.

---

## 2. The Known Unknowns

### 1. Is chipset a compatibility axis, and is failure loud or silent? (#19)

**Resolution plan:**
- **Measure:** Run `docs/savestate-compat-test.md` on the bench (H700 ×2, RK3326, RK3566).
- **Substrate:** Real hardware (GENERIC_X64 VM cannot test aarch64-to-aarch64).
- **Before:** #23's badge design. If failure is silent, the badge must be a safeguard (red warning icon). If failure is loud, it can be a convenience (yellow info icon).

**Evidence:** The protocol already exists and is ready to run.

### 2. Bisync against a real remote with compressed savestates, device-side rename, both-sides change, and interrupted run

**Resolution plan:**
- **Measure:** Spike inside #22 against:
  - `tools/cloud-test-backend` (WebDAV, loopback)
  - Dropbox from the device
- **Substrate:** RG35XX SP (H700) with compressed savestates (`savestate_file_compression = "true"` in `retroarch.cfg`).
- **Before:** #22's implementation. Record:
  - `--conflict-resolve none` output shape
  - `--recover`/`--resilient` behavior after interruption
  - Whether `--resync` is avoided

**Evidence:** The futro's AC (b) and (c) already name this.

### 3. The auto state (game.state.auto) is the commonest conflict

**Resolution plan:**
- **Measure:** Instrument the game-exit sync (`FileData.cpp:836`) to count how often `.state.auto` is the only changed file.
- **Substrate:** Maintainer's devices (RG35XX SP, RG353M, RG351M).
- **Before:** #23's UI design. If `.state.auto` is >50% of conflicts, treat it as a resume-point decision (label it "Resume" rather than "Auto Slot 1").

**Evidence:** `FileData.cpp.launchGame-excerpt-l740-850.cpp` shows the sync hook.

### 4. KEEP BOTH's "next free slot" is safe only if every cloud-only state was downloaded before the wizard opened

**Resolution plan:**
- **Measure:** Construct a fixture with:
  - Device: slot 1 occupied, slot 2 free
  - Cloud: slot 2 occupied (same game)
- **Substrate:** Two H700s (one to write the cloud state, one to run the wizard).
- **Before:** #23's implementation. Verify the pre-pass downloads the cloud state before the wizard opens.

**Evidence:** `docs/conflict-wizard-ia.md` § Flow assumes this, but it is untested.

### 5. No es_savestates.cfg ships; ES runs on compiled defaults

**Resolution plan:**
- **Measure:** `find / -name es_savestates.cfg` on the RG35XX SP image.
- **Substrate:** RG35XX SP (image `6d03d93946`).
- **Before:** #10's implementation. If the file is missing, the per-core directory move must create it and update RetroArch's `savestate_directory`.

**Evidence:** `SaveStateConfigFile.cpp` lines 51-55 show the template substitution.

### 6. The core build pin is not on the device

**Resolution plan:**
- **Measure:** Verify `/usr/lib/libretro/*.info` exists and contains `display_version`, not `PKG_VERSION`.
- **Substrate:** RG35XX SP.
- **Before:** #21's implementation. Emit `/usr/share/rocknix/core-pins` at image build with `<package> <PKG_VERSION>` per core.

**Evidence:** `docs/save-manifest-schema.md` §9 already names this.

### 7. BACKUPPATH == RESTOREPATH is assumed

**Resolution plan:**
- **Measure:** Audit `cloud_sync_helper` for hardcoded `/storage/roms`.
- **Substrate:** None (code audit).
- **Before:** #22's implementation. Add a warning in `cloud_sync_helper` if `BACKUPPATH != RESTOREPATH`.

**Evidence:** `cloud_sync_helper` lines 100-105 derive `CONTENTPATH` from `SYNCPATH`.

### 8. Standalone emulators' save layouts

**Resolution plan:**
- **Measure:** Document the save layouts for:
  - PPSSPP (by game ID)
  - Dreamcast (shared VMU)
  - N64 (`.eep`/`.mpk`)
  - PSX (memcards)
- **Substrate:** RG35XX SP with each emulator.
- **Before:** #20's schema finalization. The manifest must key by file path, so conflicts in multi-file saves must present as a single entry.

**Evidence:** `cloud_sync-rules.txt` already includes `/psx/memcards/*.mcd`.

### 9. The smallest panel is 480×320 (RG351M)

**Resolution plan:**
- **Measure:** Lay out the wizard at 480×320 first, using `tools/vm-visual-qa`.
- **Substrate:** GENERIC_X64 VM (640×480) and RG351M (480×320).
- **Before:** #23's implementation. If thumbnails are unrecognizable, use a list view for small panels.

**Evidence:** The futro's AC on #23 already names this.

### 10. Two devices online at once is not enforced

**Resolution plan:**
- **Measure:** Instrument the audit log to record concurrent syncs.
- **Substrate:** Two H700s syncing to the same Dropbox folder.
- **Before:** #22's implementation. If concurrent syncs are detected, the audit log must flag them, and the wizard must warn the player.

**Evidence:** The lock (`take_cloud_lock`) is per-device, not per-remote.

### 11. The round-trip suite has never run

**Resolution plan:**
- **Measure:** Build GENERIC_X64 image and run `tools/cloud-round-trip`.
- **Substrate:** GENERIC_X64 VM.
- **Before:** #22's implementation. The suite must pass before any bisync code is written.

**Evidence:** The futro's AC on #35 already names this.

---

## 3. What is missing that nobody has named

### 1. Bisync's `--resync` is a data-loss trap

**Failure mode:** An interrupted bisync run defaults to `--resync-mode path1`, which is winner-picks-all. A player who scripts `bisync ... || bisync --resync` to "make it work" ships a recency-free data-loss tool.

**Experiment:**
- Construct a fixture with:
  - Device: `game.state1` (hash A)
  - Cloud: `game.state1` (hash B)
- Interrupt the first bisync run.
- Run `bisync --resync`.
- **Expected:** The cloud copy overwrites the device copy (or vice versa), with no record.

**Evidence:** `rclone-bisync-planning.md` shows `--resync-mode` defaults to path1.

### 2. The manifest's `remote_hash` is a race condition

**Failure mode:** If a sync is interrupted after the file is uploaded but before the manifest is updated, the remote copy is orphaned. The next sync sees a file with no manifest entry and treats it as `unknown`, which may trigger the wizard unnecessarily.

**Experiment:**
- Instrument `cloud_backup` to:
  1. Upload the file
  2. Kill the process before updating the manifest
- Run a second sync.
- **Expected:** The remote file is treated as `unknown`, and the wizard may open.

**Evidence:** `docs/save-manifest-schema.md` §6 shows `remote_hash` as nullable.

### 3. The audit log is not tamper-proof

**Failure mode:** The audit log (`/storage/.cache/log/cloud_audit.log`) is append-only text, but it is not signed or hashed. A player could edit it to hide a bad merge or to frame another device.

**Experiment:**
- Construct a fixture with:
  - Device A: `game.state1` (hash A)
  - Device B: `game.state1` (hash B)
- Resolve the conflict with KEEP LEFT (Device A wins).
- Edit the audit log to say KEEP RIGHT (Device B wins).
- **Expected:** The log shows a false resolution, and there is no way to detect the tampering.

**Evidence:** D-CLOUD-027 specifies the log location and format.

### 4. The wizard's "KEEP BOTH" is not reversible

**Failure mode:** KEEP BOTH moves the merged copy to the next free slot, but there is no record of which states were merged. If the player later realizes they wanted to keep the original copies, there is no way to recover them.

**Experiment:**
- Construct a fixture with:
  - Device: `game.state1` (hash A)
  - Cloud: `game.state1` (hash B)
- Resolve with KEEP BOTH.
- Later, realize the cloud copy was the desired one.
- **Expected:** No way to recover the original cloud copy.

**Evidence:** `docs/conflict-wizard-ia.md` § Semantics shows KEEP BOTH moves to the next free slot.

### 5. The manifest's `core_build` is not validated

**Failure mode:** The manifest records `core_build` as `"unknown"` if the core-pins file is missing or the mapping fails. This could lead to false compatibility assumptions.

**Experiment:**
- Delete `/usr/share/rocknix/core-pins`.
- Run the game-exit sync.
- **Expected:** `core_build` is recorded as `"unknown"`, and the wizard may show incorrect compatibility badges.

**Evidence:** `docs/save-manifest-schema.md` §9 names the core-pins file.

### 6. The wizard's "KEEP DISCARDED SAVES" is not bounded

**Failure mode:** The setting "Keep discarded saves" is off by default with a count selector, but the count is not enforced. Discarded copies could grow without bound on card storage.

**Experiment:**
- Enable "Keep discarded saves" with count=3.
- Resolve 10 conflicts, discarding each time.
- **Expected:** Only the last 3 discarded copies are kept.

**Evidence:** `docs/conflict-wizard-ia.md` § Settings shows the count selector.

### 7. The manifest's `clock_synced` is not actionable

**Failure mode:** The manifest records `clock_synced` as `false` if the device booted without a network, but the wizard does not use this to warn the player about unreliable timestamps.

**Experiment:**
- Boot the device without a network.
- Play a game and save.
- Sync to the cloud.
- **Expected:** The wizard shows a warning about unreliable timestamps.

**Evidence:** `docs/save-manifest-schema.md` §6 includes `clock_synced`.

### 8. The wizard's "REVIEW DECISIONS" is not discoverable

**Failure mode:** The setting "Review decisions before applying" is off by default, and there is no on-screen hint that it exists. Players may not know they can review their choices.

**Experiment:**
- Run the wizard without enabling "Review decisions".
- **Expected:** No indication that a review step is available.

**Evidence:** `docs/conflict-wizard-ia.md` § Settings shows the setting.

### 9. The manifest's `replaces` is not transitive

**Failure mode:** The manifest records `replaces` as the sha256 this version replaced, but this is only one step of lineage. If a state is replaced multiple times, the audit log must be consulted to reconstruct the full history.

**Experiment:**
- Construct a fixture with:
  - Device: `game.state1` (hash A) → `game.state1` (hash B) → `game.state1` (hash C)
- Sync to the cloud.
- **Expected:** The manifest shows `replaces: B`, but there is no record of A.

**Evidence:** `docs/save-manifest-schema.md` §6 shows `replaces` as a single step.

### 10. The wizard's "COMPLETE" button is not reversible

**Failure mode:** The wizard applies all decisions on COMPLETE, but there is no way to undo a bad resolution after the fact. The only escape hatch is "Keep discarded saves", which is off by default.

**Experiment:**
- Resolve a conflict with KEEP LEFT.
- Realize KEEP RIGHT was desired.
- **Expected:** No way to undo the resolution.

**Evidence:** `docs/conflict-wizard-ia.md` § Flow shows COMPLETE applies all decisions.

---

## 4. What must be proven on hardware, and in what order

### Phase 1: Substrate Validation (Before Any Code is Written)
1. **Bisync behavior on real hardware** (Issue #22 spike):
   - Test against Dropbox from the RG35XX SP.
   - Record `--conflict-resolve none` output shape.
   - Verify `--recover`/`--resilient` avoid `--resync`.
   - **Invalidates:** Bisync-based detection if `--resync` is unavoidable.

2. **Savestate compatibility** (Issue #19):
   - Run `docs/savestate-compat-test.md` on the bench (H700 ×2, RK3326, RK3566).
   - **Invalidates:** Per-chipset namespacing (#10) if states are portable across chipsets.

3. **Round-trip suite** (Issue #35):
   - Build GENERIC_X64 image and run `tools/cloud-round-trip`.
   - **Invalidates:** Any bisync implementation if the suite fails.

### Phase 2: Manifest and Identity (Before #20/#21/#24 are Built)
1. **Manifest shape validation**:
   - Verify the allowlist excludes XML outside `savestates/` (fixture on RG35XX SP).
   - **Invalidates:** Per-save sidecars if XML is excluded.

2. **Core build pin validation**:
   - Verify `/usr/lib/libretro/*.info` exists and contains `display_version`.
   - **Invalidates:** The core-pins file if `PKG_VERSION` is already present.

3. **Slot identity validation**:
   - Verify `SaveStateRepository::renumberSlots()` moves files with `copyToSlot(slot, move=true)`.
   - **Invalidates:** Hash-based identity if renumbering does not rename files.

### Phase 3: Wizard UI (Before #23 is Built)
1. **Small-panel layout**:
   - Lay out the wizard at 480×320 (RG351M) using `tools/vm-visual-qa`.
   - **Invalidates:** Side-by-side thumbnails if they are unrecognizable.

2. **Conflict batching**:
   - Construct a fixture with 10 conflicts across 3 games.
   - **Invalidates:** System-by-system walkthrough if batching by game is faster.

3. **Auto state frequency**:
   - Instrument the game-exit sync to count `.state.auto` conflicts.
   - **Invalidates:** Resume-point labeling if `.state.auto` is <50% of conflicts.

### Phase 4: Safety and Rollback (Before #25 is Built)
1. **Audit log tamper-proofing**:
   - Attempt to edit `/storage/.cache/log/cloud_audit.log`.
   - **Invalidates:** Append-only text if tampering is undetectable.

2. **KEEP BOTH reversibility**:
   - Construct a fixture with a merged state.
   - **Invalidates:** KEEP BOTH if the original copies cannot be recovered.

3. **Concurrent sync detection**:
   - Run two syncs to the same Dropbox folder from two H700s.
   - **Invalidates:** Per-device lock if concurrent syncs corrupt data.

### Phase 5: Migration (Before #22 Replaces Write Paths)
1. **Stopgap validation**:
   - Add `--update` to the game-exit upload and verify it skips newer cloud copies.
   - **Invalidates:** The stopgap if it does not prevent clobber.

2. **Last-agreed state validation**:
   - Construct a fixture with a both-sides-changed save.
   - **Invalidates:** The boot pass if it does not refuse the conflict.

3. **Manifest race condition**:
   - Interrupt a sync after upload but before manifest update.
   - **Invalidates:** The manifest schema if the remote copy is orphaned.

---

## Summary of Critical Risks

1. **The shipped write paths are newest-wins today** (blindspot 28). This must be fixed before any detector is built.
2. **Bisync's `--resync` is a data-loss trap**. The detector must never run it on its own.
3. **The manifest's `remote_hash` is a race condition**. The upload step must atomically update both the file and its manifest entry.
4. **The audit log is not tamper-proof**. It must be signed or hashed.
5. **KEEP BOTH is not reversible**. The wizard must record which states were merged.

**Order of operations:**
1. Fix the shipped write paths (stopgap: `--update` on game-exit upload).
2. Validate bisync behavior on real hardware.
3. Run the round-trip suite.
4. Finalize the manifest schema.
5. Build the wizard UI and test on small panels.
6. Implement the audit log and test tamper-proofing.
7. Replace the write paths with bisync-based detection.