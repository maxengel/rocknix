# ROCKNIX Cloud-Save Conflict Resolution: Foundational Architecture

This document specifies the end-to-end architecture for cloud-save conflict resolution in ROCKNIX. It is written to be built from. It incorporates the maintainer’s binding amendments: **reversibility is a primary use case (one step back), V1 retains discarded copies by default with a count bound, V1 ships no undo control, and the retention store must be designed now to drive a future compare-and-choose recovery tool.**

---

## 1. The Retention Store (V1 for the Future Reader)

The store retains discarded saves so a future tool can recover them. It must answer: *"show me the retained past versions of this game, newest first, with a thumbnail, the producing device, and which side won"* without scanning unrelated games, trusting mutable manifests, or relying on the rotating audit log.

**Location and Invariant:** `/storage/.cache/cloud_sync/retained/`
Like the audit log (D-CLOUD-027), this directory holds irreplaceable data. It is exempt from cache-clearing sweeps and is excluded from `backuptool` archives.

**Layout and Ordering:**
```text
retained/<system>/<unit-key>/<device-id>-<seq>/
  record.json
  <original-path-preserving payloads and .png>
```
*   `<unit-key>`: The ROM filename made path-safe, or the container label (e.g., a shared VMU).
*   `<seq>`: A persistent, monotonic per-device counter. **This is the clock-free sort key.** Directory names sort chronologically even if the device booted without a network.

**The `record.json` Contract:**
Written *before* any destructive action. It is self-contained and copies all required context inline:
*   **Identity:** `system`, `unit-key`, `resolution_id`.
*   **Completion:** `phase` (`prepared` vs `finalized`). A record stays `prepared` until the apply step finishes; interrupted applies are recovered or rolled back on next boot.
*   **Event Time:** `resolved_at` (wall clock, for UI display only).
*   **Decision:** `action` (KEEP LEFT / RIGHT / BOTH), `winner_side`, `winner_sha256`, `retained_side`.
*   **Producer Snapshot:** Copied inline from the discarded operand's manifest entry (`device.id`, `device.label`, `device.model`, `emulator`, `core`, `core_build`, `captured_at`, `clock_synced`).
*   **Members:** The complete unit map (paths relative to the retained directory, sha256, size).
*   **Preview:** The retained-relative path to the `.png`, and its hash.

**The Cloud-Loser Fetch:**
On KEEP RIGHT (device wins), the cloud loser's bytes and PNG have not yet been downloaded. The apply step **must fetch them into the local retained directory** before publishing the device's win to the cloud. The done page's promise that "copies are kept" requires the bytes to be local.

**Pruning (Count = 3):**
Pruning is bucketed logically so ES renumbering does not fragment the count. `.state.auto` is its own bucket; numbered states share a game/core bucket. Pruning evicts the oldest `<seq>` in the bucket. **Rule:** A retention sweep must never evict the only copy of an unreviewed head, and incomplete (`prepared`) operations are exempt.

---

## 2. Identity, Manifests, and Agreement

**Identity (D-CLOUD-030):** A save version is the sha256 of its stored bytes. Slot and filename are attributes. The `.png` is an associated artifact, not part of the version identity (a thumbnail anomaly with identical state bytes is not a progress fork).

**Manifests (D-CLOUD-031):** One JSON per device at `savestates/.rocknix/manifest-<device-id>.json`. Each device writes only its own.
*   **Owner vs. Producer:** The manifest *owner* is the device writing the JSON. The *producer* is recorded per-entry. If Device A resolves KEEP BOTH by installing Device B's state into a free slot, A writes the entry but records B's snapshot as the producer.
*   **Set of Claims:** The union of manifests is a *set of claims*, not a right-biased merge of maps. Two devices claiming the same path with different hashes is the definition of a conflict.
*   **Foreign Manifests:** Manifests from other devices are cached out-of-tree and never republished by this device.

**Agreement (`agreed.json`):**
Kept locally, never synced. It records the hash this device last uploaded, downloaded, or verified as equal.
*   **Sync-Context Binding:** The agreement record is bound to the `remote`, `backend`, `sync_root`, and `device_id`. If a player uses CHANGE CLOUD FOLDER or re-links their account, the context changes. The old agreement is voided, preventing a stranger folder's files from silently overwriting local saves.

---

## 3. The Classifier and Write Paths

`rclone bisync` is demoted to a candidate transport. The logic is owned by a home-built three-way classifier over complete member maps.

**The Conflict Test:**
1.  Identical hashes → write agreement, do nothing.
2.  Only cloud changed since agreement → download, no prompt.
3.  Only device changed since agreement → upload, no prompt.
4.  Both changed, or never agreed and different → **Wizard**.

**Write-Path Ownership & The Budget:**
The shipped write paths (boot, menu, game-exit) are currently newest-wins. They are replaced by this classifier.
*   **Read Before Write:** The game-exit pass *must* read cloud evidence for the changed set before uploading. It cannot blindly push.
*   **Budget Fallback:** If reading the cloud state exceeds the ~5s budget (e.g., on a hashless WebDAV backend), the script must **defer the upload** (leave the unit pending). It must *never* upload over an unread head.
*   **Capture is Unconditional:** The capture step (hashing the save and writing the local manifest) runs on game exit *even if* the exit-sync toggle is off, offline, or the lock is held. Otherwise, offline progress accrues no provenance.
*   **Zero-Spawn Idle:** If capture shows no local changes, and there are no pending uploads/resolutions, the exit script terminates without spawning rclone. However, an unsuccessful upload *must* be retried on the next exit, even if the file hasn't changed since the failure.

**Remote-Hash Verification:**
A locally computed hash describes local bytes. It cannot certify the remote. To advance agreement, the engine must prove correspondence by matching a fresh remote listing, downloading the file, or matching a native backend hash.

---

## 4. Lifecycle Gate and Merge Adapter

**The Lifecycle Gate:**
Save-tree mutations must be mutually excluded. The lock (`take_cloud_lock`) serializes cloud scripts, but ES and the emulator mutate the tree.
*   The gate must bracket the entire launch session (from before ES pre-launch work to after ES post-launch work).
*   **ES-Death Survival:** The lock file descriptor must be inherited by the emulator process (`ProcessStartInfo`). If ES crashes (SIGABRT) and restarts while the emulator is running, the boot-sync must not wake up and clobber the save tree.

**The Checked Adapter:**
ES's slot primitives (`getNextFreeSlot`, `copyToSlot`) have sharp edges. They must be wrapped by an adapter:
*   `getNextFreeSlot` returns `-99` for auto-only repositories and non-RetroArch cores. The adapter must handle this and prompt for keep-one if no slots exist.
*   `copyToSlot` returns `true` even if the filesystem copy fails. The adapter must verify the filesystem result.
*   **In-Memory Reservations:** If a user selects KEEP BOTH for five conflicts in one walkthrough, the adapter must reserve slots in memory so they don't all collide on the same "next free" slot before application begins.

**Deterministic Auto KEEP BOTH:**
`.state.auto` conflicts are common. KEEP BOTH is deterministic: the device keeps its `.state.auto` (resume point), and the cloud copy is installed into the next free numbered slot.

---

## 5. Deletion, Compaction, and Moves

**Deletion Propagation:**
Explicit local deletions must propagate. They are recorded as version-specific tombstones in the device's manifest.
*   **Unexplained Absence Fails Closed:** If a file vanishes from the cloud without a tombstone, the device *holds and reports*. It does not automatically resurrect the file, nor does it delete the local copy.
*   **Tombstone Expiry:** Tombstones expire when they fall out of the retention window, preventing unbounded manifest growth.

**Verified Compaction (D-CLOUD-030):**
ES renumbers slots on delete (e.g., slot 2 becomes slot 1). Sync sees this as delete+create.
*   **Move Inference:** Same hash at a new path is a move.
*   **Compaction:** If a sync leaves the same hash in slot 1 and slot 2, the higher slot is removed *only after* both files are re-read and hashes verified identical. This terminates renumber churn. Compaction copies are lossless and do *not* consume the retention store's count.

---

## 6. The Wizard and Presentation

**Trigger:** Unattended passes (boot, menu) that detect conflicts **queue and badge** them. The wizard opens when the user clicks the badge or explicitly requests a sync.

**The COMPLETE Gate:**
Nothing transfers until the user presses COMPLETE.
*   **Pre-Pass Re-check:** At COMPLETE, the engine must re-verify that the cloud state hasn't changed since the walkthrough began. If it has, the affected decisions are voided and re-presented.
*   **Cancellation:** Quitting the walkthrough discards the pending decisions. Completed non-conflicting transfers (which ran before the wizard opened) are *not* rolled back.

**Presentation:**
*   **Cloud is Left.**
*   **Battery Saves:** Use the floppy glyph (``). No substitute screenshots.
*   **Compatibility:** `core_build` and `device.family` drive the warning badge.

---

## 7. Execution Gates (What must be proven before shipping)

These must be executed on hardware or the GENERIC_X64 VM.

1.  **Harness Repair:** Fix `tools/cloud-round-trip`. It currently overwrites `rclone.conf` without restoring it, and asserts `ROCKNIX-backup-qa.zip` without the date prefix the uploader actually applies.
2.  **The Offline Fork Fixture:** Device A and B agree on H0. B publishes HB. A edits to HA offline. A exits game. Assert: neither candidate is overwritten. A's upload is deferred.
3.  **The Retention Reader Test:** Create retained decisions. Overwrite the producer's manifest, renumber the slots, rotate the audit log, and remove the pending apply plan. Assert: a test script can still list the game's history, newest first, and locate the PNG.
4.  **The #10 Launch Rehearsal:** `es_savestates.cfg` disables `racommands`. Assert that the ROCKNIX RetroArch launcher correctly honors the non-racommands launch path (`-state_slot N -state_file "..."`) and discovers both flat and per-core layouts.
5.  **Lifecycle ES-Death Test:** Kill ES while the emulator runs. Assert that a background sync cannot acquire the lock and mutate the tree.
6.  **The `--backup-dir` Race:** Test `copy --backup-dir` on Dropbox and WebDAV under interruption. If it fails to preserve the replaced object atomically, fallback to explicit copy-verify-delete for retirements.
7.  **#19 Bench Run:** Run the same-chipset control (H700 vs H700) before the cross-chipset matrix (H700 vs RK3566). Measure loud vs. silent failure to set the badge severity.