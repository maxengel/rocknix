# Round 3 Revised Approach: Cloud-Save Conflict Resolution Foundation

This document specifies the complete, executable foundation for cloud-save conflict resolution in ROCKNIX. It is built on the embedded corpus (S01–S42) and the maintainer’s two binding amendments: **reversibility is first-class but bounded to one step back**, and **V1 ships a headless retention store (no undo UI) designed for a future "time machine" reader**.

This revision settles the remaining disagreements by adopting the strongest, corpus-backed mechanisms from the round-2 plans, conceding refuted positions, and stripping over-scoped machinery.

---

## 1. Concessions and Adoptions

To reach a safe, console-first foundation within the 5-second exit budget, I concede the following refuted positions and adopt the proven corrections from my peers:

*   **Concession (Exit-path overwrite):** I concede that relying on cached manifest claims to authorize an exit upload (`kimi-revised_plan-r2.md`) fails the acceptance criterion to *refuse* offline forks. **Adopted:** `gpt-revised_plan-r2.md`’s requirement to read cloud evidence for changed units *before* uploading.
*   **Concession (Unit classification):** I concede that "any member divergent marks the whole unit divergent" (`gemini-revised_plan-r2.md`) fails to detect disjoint-member forks (e.g., A edits `.eep`, B edits `.mpk`). **Adopted:** `kimi-revised_plan-r2.md` and `gpt-revised_plan-r2.md`’s complete member-map comparison.
*   **Concession (Deletion propagation):** I concede that abandoning deletion propagation because an unmounted card mimics a deletion (`claude-revised_plan-r2.md`, `kimi-revised_plan-r2.md`) violates the maintainer's directive that edge cases inform but do not drive. **Adopted:** `gpt-revised_plan-r2.md`’s version-specific retirement records for explicit ES deletes.
*   **Adopted from `claude-revised_plan-r2.md`:** The strict hashless verification rule (equal size is not an equality verdict; download-and-hash is required before overwriting).
*   **Adopted from `gemini-revised_plan-r2.md`:** The LAN-only reachability fix (`ip route get <ip>`) and the split-root (`BACKUPPATH != RESTOREPATH`) one-way import destination.
*   **Adopted from `mistral-revised_plan-r2.md`:** `kind: "container"` for shared VMU/memcard units, making `rom: null` a strict type rule.
*   **Adopted from `gpt-revised_plan-r2.md`:** The `--files-from` manifest transport (avoiding `--include`'s destructive exclusion behavior) and the `.cache` non-disposable warning.

---

## 2. The Maintainer Amendments: Retention & Undo

The maintainer ruled that V1 must not add UI complexity to the resolution flow. There is no "undo" button in V1. However, discarded copies must be retained (ON by default, bounded by a count), and the store must be designed *now* to support a future "time machine" tool.

### 2.1 The V1 Retention Store
The store lives at `/storage/.cache/cloud_sync/discarded/<path>/`. **Warning:** Despite residing in `.cache`, this directory is *not* a disposable cache and must be exempt from OS-level cache-wiping routines (`gpt-revised_plan-r2.md`).

When a resolution discards a copy (local or cloud), the engine writes:
1.  **The State & Thumbnail:** The discarded bytes (`<sha256>`) and its PNG (`<sha256>.png`). The PNG must travel with the state so the future picker can render it.
2.  **The Context Sidecar:** `<sha256>.json`, written *before* the destructive apply step, containing:
    ```json
    {
      "rom": "Advance Wars.gba",
      "system": "gba",
      "kind": "state",
      "slot": 1,
      "producer": {
        "device_id": "ROCKNIX-ee5013fc56",
        "device_label": "Anbernic-RG35XX-SP",
        "core": "mgba",
        "core_build": "e31759b24e7...",
        "captured_at": "2026-09-05T15:37:28Z"
      },
      "winner_side": "local",
      "winner_sha256": "<winning_hash>",
      "reason": "conflict-loser",
      "resolved_at": "2026-09-06T10:00:00Z",
      "run_id": "<uuid>"
    }
    ```

### 2.2 Retention Bounds
*   **Count:** Default is **3 per save unit** (not global).
*   **Exemptions:** Unresolved conflicts and incomplete transaction preimages are strictly exempt from pruning (`gpt-revised_plan-r2.md`). A retention sweep must never evict the only copy of an unreviewed head.
*   **Done Page:** The wizard's final screen explicitly states: *"Discarded copies are kept and can be recovered later."*

---

## 3. Architecture and End-to-End Flow

### 3.1 Identity and Manifests
*   **Identity:** A save version is the `sha256` of its stored bytes (D-CLOUD-030).
*   **Manifests:** One JSON per device at `savestates/.rocknix/manifest-<device_id>.json` (D-CLOUD-031). Each device writes only its own.
*   **Agreement:** The last agreed hash per path is stored locally at `/storage/.cache/cloud_sync/agreed.json`.
*   **Equality Establishes Agreement:** If Local = Cloud, and no agreement record exists, the engine *writes* the agreement record. Without this, the first change to any legacy save triggers a false conflict (`gpt-revised_plan-r2.md`).

### 3.2 The Lifecycle Gate
To survive ES dying while the emulator lives (`gpt-revised_plan-r2.md`), the lock order is fixed:
1.  Take `take_cloud_lock` (blocks other syncs).
2.  Take local snapshot lock (blocks ES/RetroArch mutation).
3.  Read local hashes.
4.  Release local snapshot lock.
5.  Perform network operations.

### 3.3 Classification (Member-Map)
A save unit (e.g., `.eep` + `.mpk` pair) is classified by comparing its complete member map (Path → Hash) across Local, Cloud, and Agreed.
*   If Local changed and Cloud changed (including disjoint member edits), the unit is **Divergent → Wizard**.
*   If Local changed and Cloud = Agreed, **Upload**.
*   If Cloud changed and Local = Agreed, **Download**.
*   If Local ≠ Cloud and Agreed is unknown, **Divergent → Wizard**.

### 3.4 The Game-Exit Sync (Pre-Upload Evidence)
To satisfy the AC that offline forks are *refused* by the exit pass, the engine must read before writing (`gpt-revised_plan-r2.md`):
1.  Identify locally changed units.
2.  Fetch cloud evidence *only* for those units (`lsjson --hash` on S3/Dropbox; manifest claims on WebDAV).
3.  **Hashless Strictness:** On WebDAV (no hashes/mtimes), equal size is *not* an equality verdict. The engine must download-and-hash the cloud head before authorizing an overwrite (`claude-revised_plan-r2.md`). If this exceeds the 5-second budget, the upload is deferred to the next full pass (`gemini-revised_plan-r2.md`).
4.  Upload safely advanced units using `--files-from` (avoids `--include`'s destructive exclusion).
5.  Leave conflicts pending. Say *"No new saves to upload"* rather than *"The cloud is fully in sync"*.

### 3.5 Resolution and Apply
*   **Auto KEEP BOTH:** Deterministic. The device's resume point stays at `.state.auto`; the cloud copy is moved to the next free numbered slot with its PNG. No extra sub-choice UI is presented.
*   **Merge Primitives:** `SaveStateRepository::getNextFreeSlot()` (which correctly returns `-99` for auto-only repos) and `copyToSlot(move=false)` are used.
*   **Interrupted Apply:** The frozen plan is the journal. A boolean `done` is insufficient. The record must distinguish: prepared operands, local installation complete, remote publication verified, and agreement committed.

### 3.6 Deletion Propagation and Churn
*   **Explicit Deletes:** When ES deletes a state, the engine writes a version-specific retirement record (tombstone) containing the exact `sha256`. This propagates the deletion without treating an unexplained absence (e.g., a detached SD card) as a delete (`gpt-revised_plan-r2.md`).
*   **Compaction Churn:** D-CLOUD-030 compaction applies to the *cloud* copy as well. Retiring the cloud's higher slot via copy-verify-delete into a dated sibling terminates the renumber-churn loop (`kimi-revised_plan-r2.md`).

---

## 4. What the Corpus Settles vs. What the Council Agrees

**Settled by the Corpus (Source-Visible):**
*   `getNextFreeSlot()` returns `-99` for an auto-only repository (S37). The adapter must handle this by allocating from `firstslot`.
*   The exit upload is `copy` with no `--update` (S29). The one-way stopgap is destructive; D-CLOUD-029 stands until #22 replaces it.
*   `RCLONEOPTS` silently replaces `--filter-from` (S29). Option hygiene is load-bearing.
*   Creating `es_savestates.cfg` changes launch behavior (S39). The #10 rehearsal gate is mandatory.
*   Exit-time renumbering is conditional, not every exit (S38, S41).

**Agreed by the Council (Unmeasured / Not in Corpus):**
*   **Bisync's Demotion:** The council agrees bisync should be a candidate transport, not the detector. (Requires the bisync spike to confirm 1.75.0 behavior).
*   **Boot Sync Scheduling:** The boot pass must move under ES's scheduling to avoid racing gameplay.
*   **Queue-and-Badge Trigger:** Unattended passes queue conflicts and badge the UI, rather than forcing the wizard open immediately.
*   **Retention Count:** The default count of 3 per unit is a product proposal, not a corpus-derived limit.

---

## 5. Decision Register Updates

*   **Refine D-CLOUD-031 (Manifest & Agreement):** Add: "Equality establishes agreement. If Local and Cloud hashes match but no agreement record exists, the engine writes the agreement record to prevent false conflicts on legacy saves."
*   **New D-CLOUD-032 (V1 Retention Store):** "Discarded saves are retained ON by default, bounded by a per-unit count (proposed: 3), exempting pending transactions. The store lives at `/storage/.cache/cloud_sync/discarded/` (exempt from cache-wiping) and includes a JSON sidecar with full producer/winner context to support a future time-machine reader. V1 ships no undo UI."
*   **New D-CLOUD-033 (Deletion Propagation):** "Explicit player deletions and D-CLOUD-030 compactions generate version-specific retirement records. Unexplained filesystem absence fails closed. Cloud-side compaction terminates the renumber-churn loop."

---

## 6. Known Unknowns and Experiments (The Gates)

Before freezing the implementation, the following experiments must be executed on the GENERIC_X64 VM and H700 hardware:

1.  **The Bisync Spike:** Run rclone 1.75.0 `bisync` with `--conflict-resolve none`, `--recover`, and `--resilient`. Verify it does not rename savestate losers and handles missing listings gracefully.
2.  **Hashless Exit-Sync Cost:** Measure the time to download-and-hash a 64 KiB `.srm` on the QA WebDAV from the H700. If it exceeds the 5-second budget, enact the `gemini` fallback (defer verification to the full pass).
3.  **The `--backup-dir` Race Fixture:** Interleave two publications on Dropbox/WebDAV. Verify `--backup-dir` atomically preserves the intervening head. If it fails, a protected-publication protocol is required before multi-device ships.
4.  **The #10 Launch-Behavior Rehearsal:** Ship `es_savestates.cfg` and verify that RetroArch's `racommands`, autosave, and incremental behaviors are preserved.
5.  **The 480x320 UI Layout Test:** Render the wizard at the RG351M's resolution. Verify side-by-side thumbnails are recognizable. If not, fallback to a single-column toggle.
6.  **The Cloned-Card Experiment:** Run two live devices sharing one `cloud_device_id` (a supported misconfiguration). Verify the engine warns and refuses rather than corrupting state.

---

## 7. What Should Not Be Built

*   **A V1 Undo Control:** Descoped by the maintainer.
*   **8-Generation Lineage:** `claude`'s deep ancestry requirement is over-scoped. One-step operation context is sufficient.
*   **Cached-Manifest Exit Overwrites:** `kimi`'s permission to overwrite based on stale caches misses the primary offline-fork scenario.
*   **Timestamp-only Discard Stores:** Fails the maintainer's requirement for the future reader tool.
*   **`--include` Manifest Transport:** `gemini`'s approach excludes the payload. Use `--files-from`.
*   **A New Ping Probe:** `gemini`'s ping violates D-CLOUD-028. Keep `ip route` (WAN) and add `ip route get <ip>` (LAN).