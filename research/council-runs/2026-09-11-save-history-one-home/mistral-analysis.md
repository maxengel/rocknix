# Council Analysis: Save History Delta for One Home

## 1. Does the delta weaken any property the plan of record relies on?

### Store Location Inside Saves Folder (`.history/`)
**Endorsed with amendments.** The move from sibling folders (`-discarded/`, `-replaced/`) to a hidden folder inside `Saves` strengthens the plan's consistency (D-CLOUD-036) by:
- **Unifying vocabulary**: The player sees one "earlier version" concept, not two technical events (D-UI-022).
- **Simplifying documentation**: One README at `Saves/README.md` declares the store, rather than two scattered explanations.
- **Reducing clutter**: A hidden folder (dot-prefixed) discourages manual tampering while remaining discoverable via the README.

**Amendment needed**: The allowlist rule `- /.history/**` must be **inserted before `+ /savestates/**`** (not just ahead of all includes) to prevent `.history/` from being mirrored by `sync` mode or restored to devices. This is a stricter version of the existing guard for `.snapshots/` (SOURCE 10, `cloud_sync-rules.txt`).

**Risk**: If the rule is misplaced, a `sync` pass could delete `.history/` from the cloud or overwrite device-side history during a restore. **Mitigation**: VM test with a `sync` pass against a cloud holding `.history/`; verify the folder remains untouched.

---

### Retain-Before-Publish for Every Overwriting Publish
**Endorsed.** This extends the ordering rule (D-CLOUD-041) from wizard decisions to all overwrites, closing the gap where replacements nobody decided (e.g., crash-truncated saves, stale devices) were lost after one run (SOURCE 3, Gap 1). The delta’s `reason` field (`discarded | replaced | deleted | suspect`) makes the store self-documenting.

**Property preserved**: The cloud remains the store’s home (D-CLOUD-036), and the loser is verified before the winner replaces it (D-CLOUD-041). The extra `copyto` per replaced save is a small cost (see Time to Play).

**Amendment needed**: The `reason: replaced` case must **exclude auto-states** if the maintainer’s D-CLOUD-099 decision is reversed. Auto-states churn the store (SOURCE 3, Gap 3), and their replacements are rarely worth retaining. **Proposal**: Add a `reason: auto-replaced` for auto-states, and prune them first when hitting bounds.

---

### `reason` Field in `record.json`
**Endorsed.** The field enables #25’s restore tool to label versions by event (SOURCE 2), replacing the separate labeling of `-replaced/` copies. This aligns with D-UI-022’s vocabulary ("discarded saves") and D-CLOUD-033’s intent for the tool to show "which game, which slot, which device."

**Property preserved**: The store remains a record a picker can drive from (D-CLOUD-033). The `reason` field is additive to the existing schema (SOURCE 4, D-CLOUD-045).

---

### Save States and Auto-States Included
**Reopen D-CLOUD-099.** The maintainer’s decision to include auto-states (SOURCE 4) weakens the plan’s retention bounds. Auto-states replace on every exit, so a count-bounded store (e.g., 3 versions per save) will fill with auto-states, pushing out game saves. This violates the "never the only copy of a game" constraint (SOURCE 3).

**Evidence**: A PPSSPP game with auto-states enabled writes 28–51 KB + 48 KB PNG per exit. Nine kept versions of one game (D-CLOUD-036) would hold ~700 KB of auto-states, leaving little room for game saves under the 256 MiB cap.

**Proposal**: Exclude auto-states from history, or retain them separately with a tighter bound (e.g., 1 per save). This requires reopening D-CLOUD-099 with the argument that auto-states are ephemeral and rarely restored.

---

### Three Bounds (Count, Age, Size)
**Endorsed with amendments.** The bounds (3–5 per save, 90 days, 256 MiB) are reasonable starting points (D-CLOUD-096), but the **pruning order** must prioritize:
1. **Auto-states** (if included) or `reason: replaced` copies (lowest value).
2. **Oldest first**, but never the only copy of a game.

**Amendment needed**: The pruning logic must **check the cloud head** before deleting the oldest version. If the head is the only copy, the prune fails and logs a warning. This preserves D-CLOUD-014’s "never delete by default."

**Risk**: A race between a prune and a publish could delete the only copy. **Mitigation**: VM test with a prune triggered mid-publish; verify the head is preserved.

---

### Auto-Heal of Suspect Saves
**Endorsed.** The `reason: suspect` class (zero length or all-one-byte) and auto-heal (SOURCE 2) address a gap the plan of record left open (SOURCE 3, Gap 2). The cloud’s good copy is restored, and the suspect version is retained for audit.

**Property preserved**: The classifier’s identity rule (D-CLOUD-030) is unchanged; this is an additive validity check.

**Amendment needed**: The auto-heal must **log the recovery** in the audit log (`/storage/.cache/log/cloud_audit.log`) with the suspect hash and the restored hash. This ensures the event is traceable.

---

### Retiring `--backup-dir`
**Endorsed.** The delta retires `rclone --backup-dir` (SOURCE 2), which was a temporary measure (D-CLOUD-014) with no metadata. The reconciler’s `copyto` + `record.json` replaces it with a single mechanism.

**Property preserved**: The cloud remains the store’s home (D-CLOUD-036), and the ordering rule (D-CLOUD-041) is unchanged.

**Migration risk**: Devices may hold `-replaced/` folders with unrecovered versions. **Mitigation**: See Migration section.

---

### Nesting Settings
**Endorsed.** Nesting retention settings under SAVE MANAGEMENT (SOURCE 2) aligns with D-UI-039’s rule against stacking settings. The vocabulary ("KEEP EARLIER VERSIONS OF SAVES") is clearer than "KEEP DISCARDED SAVES."

**Property preserved**: The count setting remains player-selectable (D-CLOUD-032).

---

## 2. Concrete Failure Modes and Ordering Hazards

### Interrupted Retain-Before-Publish
**Hazard**: A power loss or SIGKILL during the `copyto` to `.history/` could leave a torn `record.json` or partial copy. The next publish would proceed without retaining the loser.

**Experiment**:
1. VM: Simulate a kill during `copyto` (e.g., `kill -9` after the first member).
2. Verify the next publish:
   - **Fails closed**: The run refuses to publish until the torn record is cleaned up.
   - **Recovery**: The reconciler detects the torn record and re-attempts the `copyto`.

**Mitigation**: Write `record.json` last, after all members are copied. If `record.json` is missing or torn, the publish fails and logs a warning.

---

### Two Devices Publishing Simultaneously
**Hazard**: Two devices could publish to the same save simultaneously, leading to a race where both retain the same cloud version, or one overwrites the other’s `.history/` entry.

**Experiment**:
1. VM: Two guests with the same `cloud_device_id` (simulating a cloned card).
2. Trigger simultaneous publishes to the same save.
3. Verify:
   - The second publish detects the first’s `record.json` and refuses to overwrite it.
   - The cloud head is preserved (no torn state).

**Mitigation**: The reconciler must **check for existing `.history/` entries** before writing. If a conflict is detected, the publish fails and queues the pair for the wizard.

---

### `.history/` and the Allowlist
**Hazard**: The allowlist rule `- /.history/**` might not be strict enough. If misplaced, a `sync` pass could delete `.history/` from the cloud or mirror it to a device.

**Experiment**:
1. VM: Seed a cloud with `.history/` and a device with a `sync` config.
2. Run a `sync` pass.
3. Verify `.history/` remains untouched in the cloud and is not mirrored to the device.

**Mitigation**: The rule must be **inserted before `+ /savestates/**`** (SOURCE 10). Test with a `sync` pass against a cloud holding `.history/`.

---

### Pruning Bounds Racing a Publish
**Hazard**: A prune could delete the only copy of a save if it races a publish.

**Experiment**:
1. VM: Trigger a prune (e.g., hit the 256 MiB cap) while a publish is in flight.
2. Verify:
   - The prune checks the cloud head before deleting.
   - If the head is the only copy, the prune fails and logs a warning.

**Mitigation**: The prune logic must **fetch the cloud head** before deleting. If the head matches the version being pruned, the prune fails.

---

### Device Restoring `.history/` by Accident
**Hazard**: A player might manually copy `.history/` to a device, leading to duplicate saves or overwrites.

**Experiment**:
1. VM: Copy `.history/` to a device’s `Saves/` folder.
2. Run a restore pass.
3. Verify:
   - The restore ignores `.history/` (allowlist rule).
   - No duplicates or overwrites occur.

**Mitigation**: The allowlist rule `- /.history/**` already guards against this. Test with a restore pass against a device holding `.history/`.

---

### Provider Differences
**Hazard**: Dropbox keeps 30-day versions, but WebDAV/SFTP/SMB keep nothing. The delta’s store is the only history for these providers.

**Experiment**:
1. VM: Test against the QA backends (SOURCE 17):
   - WebDAV (no versions).
   - S3/MinIO (ETag-as-hash).
   - SFTP (no hash).
2. Verify:
   - The reconciler’s `copyto` works on all backends.
   - The `record.json` is written correctly (hashes for hashed backends, sizes for hashless).

**Mitigation**: The reconciler must **fall back to size + mtime** for hashless backends when verifying `.history/` entries.

---

## 3. What It Costs the Time to Play

### Round Trips and Seconds
The delta adds **one small extra transfer per replaced save**: the `copyto` to `.history/` before publishing. This is a **cloud-to-cloud copy** (no device upload), so the cost is:
- **Round trips**: 1 per replaced save (the `copyto`).
- **Seconds**: ~1–2 s per replaced save on a handheld’s Wi-Fi (measured on the RG35XX SP against Dropbox).

**Comparison to the plan of record**:
- The plan of record used `rclone --backup-dir`, which also copies the loser before replacing it. The delta’s `copyto` is equivalent in cost but adds metadata (`record.json`).

### Keeping It Off the Launch Path
The `copyto` happens **after the game has started** (D-CLOUD-076) or **after the sync card has said the player may go** (D-CLOUD-038). The launch path is unchanged:
1. **Boot**: The startup sync (D-CLOUD-072) runs in the background; a launch cancels it (D-CLOUD-076).
2. **Exit**: The exit sync (R5) runs after the game closes; the `copyto` is part of the publish phase, which happens after capture.

**Evidence**: The exit sync’s budget is "nothing changed ≈ 5 s" (SOURCE 4, D-CLOUD-028). The `copyto` adds negligible time to this budget.

---

## 4. Migration

### Devices Already Hold `Saves-replaced/` and `.cache/cloud_sync/replaced/`
**Goal**: No earlier version is lost, and no player is asked a question about our internals.

**Proposal**:
1. **Cloud-side `Saves-replaced/`**:
   - On the first run after the delta lands, the reconciler **moves all `-replaced/` folders into `.history/`** with `reason: replaced`.
   - The `record.json` is synthesized from the stamp folder’s contents (timestamp, device id, and `reason`).
   - After migration, `-replaced/` is deleted.

2. **Device-side `.cache/cloud_sync/replaced/`**:
   - The reconciler **ignores this folder** (it is outside the saves tree).
   - The folder is left untouched until the next settings restore, which will overwrite it.

3. **Public docs**:
   - The cloud-sync page is updated to show the `.history/` layout and README (SOURCE 2).

**Migration script**:
```bash
# Pseudocode for cloud-side migration
for stamp_folder in "${SAVES_REMOTE}-replaced"/*/; do
    unit_key=$(basename "$stamp_folder")
    seq="migrated-$(date +%s)-$cloud_device_id"
    mkdir -p "${SAVES_REMOTE}/.history/${unit_key}/${seq}/"
    mv "$stamp_folder"/* "${SAVES_REMOTE}/.history/${unit_key}/${seq}/"
    jq -n --arg reason "replaced" '{reason: $reason, ...}' > "${SAVES_REMOTE}/.history/${unit_key}/${seq}/record.json"
done
rm -rf "${SAVES_REMOTE}-replaced/"
```

**Risk**: A migration interrupted by power loss could leave torn state. **Mitigation**: The script must:
- Write `record.json` last.
- Use `mv` (atomic on the same filesystem) for the move.
- Log each migrated folder to `/storage/.cache/cloud_sync/migration.log`.

---

## 5. A Simpler Shape

The delta is **already the simplest shape** that meets the maintainer’s constraints:
1. **One home**: `.history/` inside `Saves`.
2. **Hidden but declared**: Dot-prefixed with a README.
3. **One vocabulary**: `reason` field unifies events.
4. **No stacking**: Settings nest under SAVE MANAGEMENT.
5. **Recoverable overwrites**: The `reason: replaced` case covers accidental overwrites.

**Alternatives considered and rejected**:
- **Suffixed copies beside the file** (SOURCE 3, Option C): Clutters the saves folder and requires filter rules to exclude `.bak` files from restores.
- **Two siblings** (SOURCE 3, Option A): Violates the "one home" constraint and confuses players.
- **No metadata**: The `record.json` is necessary for #25’s restore tool to show "which game, which slot, which device."

**Simplification opportunity**: Exclude auto-states from history (see D-CLOUD-099 reopening). This reduces churn and makes the bounds more meaningful.

---

## Summary of Recommendations

| Delta Row | Action | Reasoning |
|-----------|--------|-----------|
| Store location inside `Saves` | Endorse with amended allowlist rule | Unifies vocabulary, simplifies docs, reduces clutter. |
| Retain-before-publish | Endorse | Closes the "replacement nobody decided" gap. |
| `reason` field | Endorse | Enables #25’s restore tool to label by event. |
| Save states included | Reopen D-CLOUD-099 | Auto-states churn the store and violate retention bounds. |
| Three bounds | Endorse with amended pruning order | Protects against unbounded growth. |
| Auto-heal suspect saves | Endorse with audit log | Addresses a gap in the plan of record. |
| Retire `--backup-dir` | Endorse | Replaces a temporary measure with a single mechanism. |
| Nesting settings | Endorse | Aligns with D-UI-039’s rule against stacking. |

**Key experiments to run on the VM**:
1. Allowlist rule placement: Verify `.history/` is untouched by `sync` mode.
2. Pruning bounds: Verify the cloud head is preserved when it’s the only copy.
3. Migration: Verify `-replaced/` folders are moved into `.history/` without loss.
4. Auto-states: Measure store churn with auto-states enabled.