I'll produce a revised approach that integrates the strongest elements from all four plans, corrects the identified gaps, and aligns with the maintainer's amendments. This will be a buildable foundation for the conflict-resolution milestone.

---

# Revised Approach: Cloud-Save Conflict Resolution Foundation

## 1. Architecture Summary

**Core components:**
- Content identity via sha256 of stored bytes (D-CLOUD-030)
- Per-device manifests at `savestates/.rocknix/manifest-<device-id>.json` (D-CLOUD-031)
- Local unsynced agreement record at `/storage/.local/share/rocknix/cloud-saves/agreed.json`
- Application-owned three-way classifier with rclone transport
- Lifecycle gate with session-lifetime exclusion
- Checked adapter over ES slot primitives
- Retention store at `/storage/.local/share/rocknix/cloud-saves/retained/`
- Queue-and-badge for unattended passes
- Deterministic KEEP BOTH for auto states
- Retention ON by default, count-bounded (3 per unit)
- Version-specific tombstones for explicit deletes
- Cloud-side compaction to end renumber loop
- `--backup-dir` as remote retirement mechanism

## 2. Identity and Manifest Schema (D-CLOUD-031 refinement)

### 2.1 Identity
- **sha256 of stored bytes** is the version identity (D-CLOUD-030)
- Slot number and file name are attributes, not identity
- Thumbnail is not part of identity (`.png` travels with state by path)

### 2.2 Manifest Fields
```json
{
  "schema": 1,
  "device": {
    "id": "ROCKNIX-ee5013fc56",
    "label": "Anbernic-RG35XX-SP",
    "model": "Anbernic RG35XX SP",
    "family": "H700",
    "os_version": "20260905"
  },
  "generated_at": "2026-09-05T15:37:28Z",
  "entries": {
    "savestates/gba/Mega Man & Bass (USA).state1": {
      "kind": "state",
      "sha256": "64-hex-digest",
      "size": 50816,
      "mtime": "2025-07-29T05:09:49Z",
      "captured_at": "2025-07-29T05:09:50Z",
      "captured_local": "2025-07-29T01:09:50-04:00",
      "clock_synced": true,
      "system": "gba",
      "rom": "Mega Man & Bass (USA).gba",
      "emulator": "retroarch",
      "core": "mgba",
      "core_build": "e31759b24e7",
      "core_display_version": "0.11-dev",
      "slot": 1,
      "screenshot": "savestates/gba/Mega Man & Bass (USA).state1.png",
      "replaces": null,
      "remote_hash": {"type": "dropbox", "value": "..."},
      "producer": {  // NEW: inline producer snapshot
        "device": {
          "id": "ROCKNIX-ee5013fc56",
          "label": "Anbernic-RG35XX-SP",
          "model": "Anbernic RG35XX SP",
          "family": "H700"
        },
        "emulator": "retroarch",
        "core": "mgba",
        "core_build": "e31759b24e7",
        "captured_at": "2025-07-29T05:09:50Z",
        "captured_local": "2025-07-29T01:09:50-04:00",
        "clock_synced": true
      }
    }
  }
}
```

**Key refinements:**
1. **Inline producer snapshot** (from gpt-revised_plan-r3.md §4.2) - preserves provenance when the producer's manifest entry is overwritten
2. **Explicit unknowns** - all fields can be `null` or `"unknown"` (from gpt-revised_plan-r3.md §4.2)
3. **Content locator** - `rom` field for container units (from gpt-revised_plan-r3.md §8.3)

## 3. Agreement Record

```json
{
  "schema": 1,
  "sync_context": {  // NEW: from gpt-revised_plan-r3.md §4.4
    "remote": "dropbox:",
    "backend": "dropbox",
    "sync_root": "/ROCKNIX/Saves",
    "local_roots": ["/storage/roms"],
    "link_identity": "ROCKNIX-ee5013fc56"
  },
  "entries": {
    "gba/Advance Wars (USA) (Rev 1).srm": {
      "sha256": "64-hex-digest",
      "remote_hash": {"type": "dropbox", "value": "..."},
      "at": "2026-09-05T15:40:02Z",
      "direction": "up",
      "verified": true  // NEW: from claude-revised_plan-r3.md §3.3.3
    }
  }
}
```

**Key refinements:**
1. **Sync context binding** (from gpt-revised_plan-r3.md §4.4) - prevents cross-account overwrites
2. **Verification flag** (from claude-revised_plan-r3.md §3.3.3) - tracks whether content was verified

## 4. Conflict Detection

### 4.1 Three-Way Classifier
Per path, with L = local hash, C = cloud hash, A = agreed hash:

| L vs C | A known? | L vs A | C vs A | Verdict | Action |
|--------|----------|--------|--------|---------|--------|
| equal  | -        | -      | -      | identical | nothing |
| differ | yes      | equal  | differ | cloud changed | download, no prompt |
| differ | yes      | differ | equal  | device changed | upload, no prompt |
| differ | yes      | differ | differ | **divergent** | wizard |
| differ | no       | -      | -      | **divergent** (never agreed) | wizard |
| only one side | - | - | - | one-way | transfer, no prompt |

**Key refinements:**
1. **Equality bootstrap** - write agreement on verified equality (from all plans)
2. **Move detection** - same hash under new path = move (no conflict)
3. **Never agreed = ask** - conservative branch (from all plans)

### 4.2 Special Cases
- **Auto states** - most common conflict; wizard treats as "resume point" decision
- **In-game saves** - no lineage inside session; final state only
- **Unknown files** - identity but no provenance; conflict test still works
- **Container units** - multi-file saves (PSX memcards, Dreamcast VMU) handled as units

## 5. Write Path Ownership

### 5.1 Lifecycle Gate
**Contract (from claude-revised_plan-r3.md §3.3):**
1. Exclude save-tree mutation throughout game session
2. Preserve exclusion if ES dies before emulator exits
3. Upload sealed copies, not live emulator files
4. Recover incomplete local installation before next launch

**Implementation:**
- `flock` on `/var/run/cloud_sync.lock` inherited by emulator child
- ES wrapper ensures fd survives ES death (from gpt-revised_plan-r3.md §3.2)
- Staging directory for upload copies
- Recovery inspects actual hashes, not phase labels

### 5.2 Exit Path Budget
**Policy (from gpt-revised_plan-r3.md §4.3):**
- **0 spawn idle path:** when nothing changed and no pending work
- **3-4 spawn changed path:** when changes detected
  - 1: compute local hashes
  - 2: verify cloud state (hashless backend may need download)
  - 3: upload changed files
  - 4: (if needed) upload manifest

**Verification rules:**
- Always verify content before overwriting (from all plans)
- Defer unverifiable uploads to next full pass (from gpt-revised_plan-r3.md §4.3)
- Never upload over an unread head (from gpt-revised_plan-r3.md §4.3)

## 6. Retention Store

### 6.1 Layout
```
/storage/.local/share/rocknix/cloud-saves/retained/
  <system>/
    <unit-key>/
      <device-id>-<seq>/
        record.json
        <member-files...>
```

**Key refinements:**
1. **Game-addressed discovery** (from claude-revised_plan-r3.md §3.9.1)
2. **Clock-free ordering** (from claude-revised_plan-r3.md §3.9.1)
3. **Complete units** (from gpt-revised_plan-r3.md §8.3)
4. **Non-disposable home** (from gpt-revised_plan-r3.md §8.2)

### 6.2 Record Schema
```json
{
  "resolution_id": "20260905-ROCKNIX-ee5013fc56-00042",
  "system": "gba",
  "rom": "Mega Man & Bass (USA).gba",
  "unit": {  // from claude-revised_plan-r3.md §3.9.1
    "kind": "state",
    "members": [
      {
        "path": "savestates/gba/Mega Man & Bass (USA).state1",
        "sha256": "64-hex-digest",
        "size": 50816,
        "slot": 1,
        "screenshot": {
          "path": "savestates/gba/Mega Man & Bass (USA).state1.png",
          "sha256": "64-hex-digest",
          "retained": true
        }
      }
    ]
  },
  "producer": {  // from gpt-revised_plan-r3.md §8.3
    "device": {
      "id": "ROCKNIX-ee5013fc56",
      "label": "Anbernic-RG35XX-SP",
      "model": "Anbernic RG35XX SP",
      "family": "H700"
    },
    "emulator": "retroarch",
    "core": "mgba",
    "core_build": "e31759b24e7",
    "captured_at": "2025-07-29T05:09:50Z",
    "captured_local": "2025-07-29T01:09:50-04:00",
    "clock_synced": true
  },
  "decision": {  // from gpt-revised_plan-r3.md §8.3
    "action": "keep_right",
    "winner": {
      "side": "device",
      "path": "savestates/gba/Mega Man & Bass (USA).state1",
      "sha256": "64-hex-digest",
      "device": {
        "id": "ROCKNIX-ee5013fc56",
        "label": "Anbernic-RG35XX-SP"
      }
    },
    "retained_side": "cloud",
    "original_path": "savestates/gba/Mega Man & Bass (USA).state2"
  },
  "resolved_at": "2026-09-05T16:22:10Z",  // from gemini-revised_plan-r3.md §2.1
  "phase": "finalized",  // from gpt-revised_plan-r3.md §8.3
  "reason": "conflict_loser"  // from mistral-revised_plan-r3.md §6.1
}
```

### 6.3 Pruning Policy
- **Count = 3 per unit** (auto states own bucket; numbered states share game/core bucket)
- **Exemptions:** pending operations, incomplete transactions
- **Rule:** "A retention sweep must never evict the only copy of an unreviewed head" (from gemini-revised_plan-r3.md §2.2)

## 7. Deletion and Retirement

### 7.1 Explicit Deletes
- **Tombstone channel:** bounded list in per-device manifest (from claude-revised_plan-r3.md §3.9.2)
- **Transport:** `--backup-dir` to dated sibling (from all plans)
- **Verification:** copy-verify-delete (from D-CLOUD-026)

### 7.2 Unexplained Absence
- **Policy:** hold and report (from kimi-revised_plan-r3.md §3.8)
- **Implementation:** tombstone with `reason: "unexplained_absence"`

## 8. Merge Adapter

**Contract (from gpt-revised_plan-r3.md §7.4):**
1. Handle `-99` for auto-only repositories
2. Validate `copyToSlot` results (returns `true` regardless of filesystem success)
3. Derive destination from staging directory, not source parent
4. Reserve slots in memory for multiple KEEP BOTH in one walkthrough
5. Handle parent-derived destination paths
6. Verify PNG moves with state
7. Handle standalone emulator paths
8. Preserve unknown provenance
9. Handle container units
10. Verify all member files exist before installation

## 9. Transport and Verification

### 9.1 Remote Hash Bridge
**Rules (from gpt-revised_plan-r3.md §6.1):**
1. For new uploads: verify native hash against local payload before recording
2. For existing mappings: verify native hash against sealed local payload
3. For hashless backends: download and verify sha256 before advancing agreement
4. Always use `--ignore-times` for decided transfers

### 9.2 Manifest Publication
**Policy (from gpt-revised_plan-r3.md §6.3):**
- Manifest is observation, not commit
- Ordering: payload before manifest (measured option)
- Safety: readers verify member maps, not publication order

## 10. Wizard Flow

### 10.1 Trigger
- **Primary:** sync that reports conflicts (IA rev 4)
- **Unattended:** queue and badge (from all plans)

### 10.2 Special Cases
- **Auto states:** deterministic KEEP BOTH (device keeps `.state.auto`, cloud copy takes numbered slot)
- **In-game saves:** KEEP BOTH disabled (dimmed with reason)
- **Containers:** show as single unit with glyph

### 10.3 Done Page
```
3 CONFLICTS RESOLVED
Mega Man & Bass · GBA · Savestate

KEPT:
  Cloud: 1
  Device: 2

DISCARDED (kept on this device):
  Cloud: Mega Man & Bass (USA).state2
  Device: Mega Man & Bass (USA).state3

[ COMPLETE ]
```

## 11. Migration and Compatibility

### 11.1 Upgrade Path
- Read both shapes, write new one (from upgrade-and-install.md)
- Agreement bootstrap: write on verified equality
- Retention store: survives upgrade (test required)

### 11.2 Downgrade Safety
- **Not guaranteed** - old scripts overwrite by recency
- **Inventory:** all active write paths (boot, exit, menu, Tools, #37)

## 12. Testing Requirements

### 12.1 Priority Fixtures
1. **Harness repair** (from gpt-revised_plan-r3.md §10.3):
   - Fix `rclone.conf` overwrite
   - Match archive naming conventions
   - Restore all config values

2. **Offline fork and retry:**
   - Agree H0
   - Publish HB from second device
   - Edit HA offline
   - Exit - must not overwrite either candidate

3. **Retention reader test:**
   - Create retained decisions for multiple games
   - Overwrite producer manifests
   - Rotate audit log
   - Remove pending records
   - Verify reader produces correct per-game list

4. **Lifecycle exclusion:**
   - Boot overlap
   - ES death with emulator alive
   - Interruption between file effects and checkpoints
   - Verify recovery restores local coherence offline

5. **Changed path budget:**
   - Record process starts, remote requests, transferred bytes, elapsed time
   - Include pending-work retries and hashless verification

### 12.2 Hardware Gates
1. **#19 compatibility:** same-chipset control before cross-chipset
2. **#10 namespace:** preserve launch behavior, discover both layouts
3. **480×320 recognition:** verify at smallest panel

## 13. Register Amendments

**D-CLOUD-031-A (refines D-CLOUD-031):**
- Manifest carries inline producer snapshot
- Agreement record binds to sync context
- Retention store at `/storage/.local/share/rocknix/cloud-saves/retained/`

**D-CLOUD-029-A (refines D-CLOUD-029):**
- All write paths read cloud evidence before overwrite
- Exit path defers unverifiable uploads
- Lifecycle gate survives ES death

**D-CLOUD-027-A (refines D-CLOUD-027):**
- Retention store is not a cache and is not archived
- Audit log rotation does not affect retention

## 14. Not To Build

- V1 undo control (maintainer settled)
- Deep ancestry or cross-device resolution machinery
- Second production agreement authority
- Single-spawn target that weakens verification
- Extra local hash spawn as prerequisite
- Timestamp-ordered retention store
- Per-path discard store
- SQLite index
- Kid-mode resolver
- Automatic `--resync`
- 99-slot cap
- Daemon

---

This approach integrates the strongest elements from all four plans while correcting the identified gaps. It provides a buildable foundation that preserves player progress, empowers conflict choices, and enables one-step recovery - exactly what the maintainer asked for.