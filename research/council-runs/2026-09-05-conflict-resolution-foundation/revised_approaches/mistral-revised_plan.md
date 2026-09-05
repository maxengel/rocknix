I will produce a revised approach grounded in the embedded corpus and the peer reviews. This will be a standalone foundation document that a reader can act on without having read my Step 1 or any review.

---

# Revised foundation for cloud-save conflict resolution in ROCKNIX

## 1. Executive summary

The foundational approach must be built on a **manifest-based reconciliation layer** that is **stateless, content-addressed, and owned by the application**. `rclone bisync` is not a viable detector: it is blind to SRAM changes on hashless backends, demands `--resync` on first runs and filter changes, and its stateful workdir is a corruption hazard. The manifest schema (D-CLOUD-031) is the correct identity foundation, but it requires targeted refinements to handle deletion, multi-file saves, and provenance after merges.

The shipped write paths are **newest-wins** and must be replaced before any conflict resolution ships. The replacement must be **non-destructive by default**, preserve both copies of every fork, and never overwrite without explicit player choice. A **one-way stopgap** (disable the boot restore; keep only the exit upload) is the safest interim measure until the full replacement is ready.

## 2. What must be preserved from the original approach

- **Identity:** sha256 of stored bytes (D-CLOUD-030). Slot and file name are attributes.
- **Manifest:** one JSON per device under `savestates/.rocknix/`, describing in-game saves as well as states by path relative to the sync root.
- **Agreement record:** local, never synced (`/storage/.cache/cloud_sync/agreed.json`).
- **Conflict test:** identical → nothing; only one side changed → transfer; both changed or never agreed → wizard.
- **Presentation:** Vita-style walkthrough, system → game; cloud always left; KEEP LEFT / KEEP RIGHT / KEEP BOTH; nothing transfers until COMPLETE.
- **Audit log:** append-only text at `/storage/.cache/log/cloud_audit.log` (D-CLOUD-027).

## 3. What must change, and why

### 3.1 The detector must be manifest-based, not bisync-based

**Why:** Bisync is blind to SRAM changes on the QA WebDAV backend (size-only comparison), demands `--resync` on first runs and filter changes, and its stateful workdir is a corruption hazard. The manifest schema already provides a content-addressed identity foundation (sha256) that works on every backend.

**How:** Replace bisync with a **stateless detector** that:
- Lists the remote with `rclone lsjson --hash` (or size+mtime on hashless backends).
- Reads the local manifest and `agreed.json`.
- Applies schema §3's conflict test to every path.
- Never runs `--resync`; never uses a workdir.

**Evidence:** The corpus establishes the QA WebDAV has no hashes and no modtimes (`docs/save-manifest-alignment-review.md` §1); bisync's `--resync` demand is in the futro (`plans/conflict-resolution/vita-style-conflict-resolution.md` §4 step 2); the manifest schema already carries sha256 (`docs/save-manifest-schema.md` §6).

### 3.2 The shipped write paths must be replaced before conflict resolution ships

**Why:** The shipped boot sync (`102-cloud-saves`) and game-exit upload are newest-wins: `copy --update` overwrites the older copy, and the exit upload has no `--update` at all. This violates the cardinal rule ("never newest-wins") and destroys progress.

**How:** Replace them with a **non-destructive detector** that:
- Refuses to transfer any file that changed on both sides since the last agreement.
- Never overwrites without explicit player choice.
- Preserves both copies of every fork.

**Stopgap:** Until the replacement is ready, **disable the boot restore** and keep only the exit upload. This preserves both copies of every fork (the cloud holds the last-exit copy; the local copy is never overwritten). It is a maintainer setting, not a code change, and it respects D-CLOUD-029.

**Evidence:** The boot sync is `cloud_restore --yes --method=copy --update` then `cloud_backup … --update` (`autostart/102-cloud-saves`); the exit upload is `copy` with no `--update` (`cloud_backup --recent`); the cardinal rule is in `#11` and `.claude/rules/rclone-cloud-sync.md`.

### 3.3 The manifest schema must be refined

**Refinements needed (D-CLOUD-031 amendments):**

| ID | Change | Why |
|---|---|---|
| D-CLOUD-031-A | Add `origin` sub-object: `{ device: string, hash: string }` | KEEP BOTH and #37's copy-to-free-slot create versions whose producer is not the local device. The origin must be preserved so the wizard can show "this state came from Anbernic-RG35XX-SP" and the audit log can record it. |
| D-CLOUD-031-B | Add `screenshot_sha256` | A manifest can correctly identify the current state hash while its screenshot path contains an older PNG from an interrupted publication. The picker then confidently presents the wrong picture. Bind companions to a capture/version and withhold or mark the image when that association is unverified. |
| D-CLOUD-031-C | Add `container` kind for multi-file saves | PPSSPP's per-game-ID directory and the Dreamcast shared VMU are saves that span multiple files. The detector must refuse to auto-pick on shared containers and must offer the whole container as one unit. |
| D-CLOUD-031-D | Add `deleted` marker | A player deletion is resurrected at the next sync unless explicitly propagated. Tombstones recorded at the ES delete path + a mass-delete guard + `--backup-dir` archival are the safe propagation mechanism. |
| D-CLOUD-031-E | Add parse-failure rule | An unparseable manifest is "provenance unknown and flagged", never "no entry → unknown → proceed". Torn remote manifests on dumb backends must not silently proceed. |

**Evidence:** The origin gap is in the alignment review (`docs/save-manifest-alignment-review.md` §3.5); the screenshot binding is in `docs/save-manifest-schema.md` §6; the multi-file cases are in `cloud_sync-rules.txt` and D-CLOUD-028; the deletion gap is in `docs/save-manifest-schema.md` §3; the parse-failure rule is a general safety requirement.

### 3.4 The merge primitives must be wrapped in a checked adapter

**Why:** `getNextFreeSlot()` returns **-99** for an auto-only repository (the commonest conflict kind), does not refresh the repository, and `copyToSlot()` ignores the return values of both state and screenshot copy/rename operations. The IA's "slot exhaustion is not a real constraint" and "checked, not assumed" are both wrong.

**How:** Wrap the ES primitives in a checked adapter that:
- Refreshes the repository before allocation.
- Reserves the chosen slot in a pending-allocations map.
- Validates the destination path is free on both sides before copying.
- Verifies the copies before advancing agreement.
- Follows D-CLOUD-026's copy-verify-delete rule.

**Evidence:** `getNextFreeSlot()` returns -99 (`es/SaveStateRepository.cpp`); `copyToSlot()` returns true unconditionally (`es/SaveState.cpp`); the IA's claims are in `docs/conflict-wizard-ia.md`.

### 3.5 The discard store must be excluded from sync and bounded

**Why:** The discard store (`keep discarded saves`) is a wizard implementation detail that must not sync. The IA specifies a count selector that is the retention rule, but the allowlist has no rule for it.

**How:** Add `- /savestates/.discards/**` to `cloud_sync-rules.txt` ahead of `+ /savestates/**`. The discard store must be bounded by the count selector (default 3, per the IA).

**Evidence:** The IA's settings are in `docs/conflict-wizard-ia.md` § Settings; the allowlist is in `cloud_sync-rules.txt`.

### 3.6 The detector must never inherit `RCLONEOPTS` or `BACKUPMETHOD`

**Why:** The shipped default `cloud_sync.conf` still carries `--delete-excluded` in `RCLONEOPTS`; every new consumer of the config must independently remember to strip it, or a `sync`-method run deletes everything outside the allowlist on the destination.

**How:** The detector must never inherit `RCLONEOPTS` or `BACKUPMETHOD` semantics. It must explicitly set its own options.

**Evidence:** `--delete-excluded` is in `cloud_sync.conf`; `cloud_backup` and `cloud_restore` strip it at load; `cloud_sync_helper` does not strip it from existing configs.

## 4. Known unknowns and experiments

| Unknown | Experiment | Owner |
|---|---|---|
| What does `--conflict-resolve none` do to conflicted files in rclone 1.75.0? | Run a fixture against the QA WebDAV with `--dry-run`; record what bisync does to conflicted files. | #22 spike |
| Does `rclone hashsum dropbox` work on the device? | On the RG35XX SP, `rclone hashsum dropbox` one state and compare with `rclone lsjson --hash` of its uploaded copy. | #22 spike |
| Do core sets differ per target? | Diff `LIBRETRO_CORES` between the H700 and RK3326 build options in the tree. If they differ, plant a state under an absent core's directory on the RK3326 and open the manager. | #10 |
| Are thumbnails distinguishable on the RG351M? | Render actual thumbnails on the RG351M (480×320); verify a player can recognise the moment. | #23 |
| Does the boot sync race the running emulator? | Enable startup sync, boot, launch from a numbered slot within 30 s, wait for the boot sync to finish, exit, list the remote for `.bak` and extra slot files. | #22 |
| Does the discard store sync? | Construct a discard store, run a sync, list the remote for `.discards/`. | #23 |
| Does the detector inherit `--delete-excluded`? | Set `BACKUPMETHOD="sync"`, run the detector's dry run against a destination holding excluded files, list what it would delete. | #22 |

## 5. What must be proven on hardware before building

1. **The detector must pass the adversarial suite on the QA WebDAV and Dropbox.**
   - Same-size and same-mtime changed data.
   - Genuine forks with `none`/loser settings.
   - Rename and deletion distinctions.
   - External equalization after a manual decision.
   - Interrupted and missing agreement/listing state.
   - Filter changes.
   - Exact pre/post path and byte inventories.

2. **The merge adapter must pass the ES primitives' failure cases.**
   - Auto-only allocation.
   - Failed copies.
   - Thumbnail mismatch.
   - Repository invalidation.

3. **The discard store must be excluded from sync and bounded.**

4. **The detector must not inherit `--delete-excluded`.**

5. **The wizard must be reachable in kid/kiosk mode.**

## 6. Decision register changes

| ID | Change | Cites |
|---|---|---|
| D-CLOUD-029 | **Replaced:** The shipped write paths stay as they are until #22 replaces them. **With:** The shipped write paths must be replaced before conflict resolution ships. Until then, disable the boot restore and keep only the exit upload. | #11 cardinal rule, `autostart/102-cloud-saves`, `cloud_backup --recent` |
| D-CLOUD-031-A | **Refined:** The save manifest is one JSON per device under `savestates/.rocknix/`. **With:** Add `origin` sub-object: `{ device: string, hash: string }`. | Alignment review §3.5 |
| D-CLOUD-031-B | **Refined:** Add `screenshot_sha256`. | `docs/save-manifest-schema.md` §6 |
| D-CLOUD-031-C | **Refined:** Add `container` kind for multi-file saves. | `cloud_sync-rules.txt`, D-CLOUD-028 |
| D-CLOUD-031-D | **Refined:** Add `deleted` marker. | `docs/save-manifest-schema.md` §3 |
| D-CLOUD-031-E | **Refined:** Add parse-failure rule. | General safety |

## 7. What is out of scope for this foundation

- **Snapshots and rollback (#25):** V2; the schema must not preclude them, but they are not part of the conflict resolution foundation.
- **Launch-time resolution:** V2; the direction is good, but it re-scopes #23 and #37 and depends on unverified `GuiSaveState` mechanics.
- **Occurrence identifiers:** The lineage problem is real, but the second identity system is not warranted; hook the move operations instead.
- **Audit log tamper-proofing:** The log is support-only on the owner's own device; signing it against its owner is theatre.

---

This document is the foundation I would build on, having heard the critique. It stands on its own: a reader can act on it without having read my Step 1 or any review.