### 1. Does the delta weaken any property the plan of record relies on?

I have evaluated each changed row of the delta table (`repo/docs/save-history-plan-delta.md`). The delta does not weaken the plan of record; it unifies disparate mechanisms into a single, predictable store. 

*   **Store at `<SAVES_REMOTE>/.history/<unit>/<seq>/`, `reason`, and `README.md`**: **Endorse**. The plan of record relied on `-discarded/` being a sibling folder to avoid rclone `--backup-dir` overlap (D-CLOUD-014). Because the reconciler writes to `.history/` via explicit `copyto` rather than `--backup-dir`, placing it inside `Saves/` is safe and satisfies the maintainer's request for one home (D-CLOUD-095).
*   **Retain-before-publish for every publish that overwrites a cloud copy**: **Endorse**. The plan of record relied on retaining only wizard losers (D-CLOUD-036). Extending this to all overwrites strengthens the system by covering undecided replacements (e.g., crash truncations, #132) without weakening the ordering rule (D-CLOUD-041).
*   **Retiring `--backup-dir`**: **Amend**. The plan of record uses `--backup-dir` locally (`repo/code/cloud_restore-set-aside-excerpt.md`) to preserve local saves overwritten by a restore, satisfying D-CLOUD-078 (always keep a record of the last known good state). If we retire it, we must ensure no local data is destroyed. I amend this row: The reconciler must also perform **retain-before-install** for any fetch or restore that overwrites a local save, pushing the local loser to the cloud `.history/` store before overwriting it locally.
*   **Allowlist `- /.history/**` ahead of every include**: **Endorse**. Prevents sync loops and keeps the store hidden from the device.
*   **Nesting settings, age (90 d) and total (256 MiB) caps**: **Endorse**. Meets D-UI-039 and D-CLOUD-096.
*   **Reader reads one store, reason as label**: **Endorse**. Simplifies the UI.
*   **Classifier adds `suspect` class (auto-heal)**: **Endorse**. Meets D-CLOUD-100.
*   **Save states included (auto-states included)**: **Endorse**. Meets D-CLOUD-099.

### 2. Concrete failure modes and ordering hazards

Beyond the suspected hazards, I have identified a critical unnamed hazard regarding handheld clock skew:

*   **Clock skew triggering immediate pruning (Unnamed Hazard)**: 
    *   *Hazard*: Handhelds frequently lose RTC sync. The `<seq>` path uses `<decided_at, UTC compact>-<deciding device id>`. If a device with a dead battery thinks it is 1970, its history entries will be written with an ancient timestamp. When the pruning logic enforces the 90-day age cap (D-CLOUD-096), it will immediately delete this brand-new save because its timestamp makes it look like the oldest record.
    *   *Experiment*: On the GENERIC_X64 VM, set the system clock to 2020. Trigger a conflict resolution that pushes to `.history/`. Run the pruning sweep and verify if the newly retained save is immediately deleted.
*   **Provider differences and server-side copy fallback**:
    *   *Hazard*: Retain-before-publish relies on `rclone copyto`. On Dropbox, this is a fast server-side API call. On self-hosted backends like SFTP or WebDAV (`issues/133.md`), rclone may not support server-side copy and will silently fall back to downloading the file and re-uploading it to `.history/`. This doubles the bandwidth and time required for a publish.
    *   *Experiment*: On the VM against the SFTP QA backend, run a publish that triggers retain-before-publish. Monitor network traffic to see if it equals the file size (indicating a download/upload fallback) rather than just API overhead.
*   **Retain-before-publish under an interrupted run**:
    *   *Hazard*: If `rclone copyto` succeeds in placing the old cloud head into `.history/`, but the subsequent publish of the new save fails (e.g., link loss), the cloud head remains unchanged. The next sync pass will see the same head and may `copyto` it again, creating duplicate history entries and churning the count cap.
    *   *Experiment*: On the VM against WebDAV, kill the reconciler process after `copyto` completes but before the publish finishes. Verify if the next run duplicates the history entry.
*   **Two devices publishing to the store at once**:
    *   *Hazard*: Because `<seq>` includes the device ID, paths will not collide. However, if both devices evaluate the 256 MiB total size cap or the count cap at the same time, they may both attempt to delete the same oldest record, causing one to fail, or they may both delete records and over-prune.
    *   *Experiment*: Run two reconcilers concurrently on the VM, both pushing to the same unit's history on WebDAV, exceeding the count cap.
*   **The store's README inside a folder that `sync` mode mirrors**:
    *   *Hazard*: The allowlist (`repo/code/cloud_sync-rules.txt`) excludes `- /.history/**`, but the root `Saves/README.md` is not explicitly excluded. However, because the allowlist ends with `- /**`, the README will be ignored and not synced to the device. This is actually correct (it prevents clutter on the handheld), but means the README only exists in the cloud.
    *   *Experiment*: Run a full restore on the VM with a `README.md` placed in the cloud's `Saves/` root. Assert that it does not appear on the local device.

### 3. What it costs the time to play

Per `repo/rules/time-to-play.md` (D-CLOUD-098), time to play is a first-class metric. 

*   **Cost**: Retain-before-publish adds one `rclone copyto` operation per overwritten cloud file. On a handheld's Wi-Fi, if the provider supports server-side copy (e.g., Dropbox), this is **1 additional round trip taking ~0.5 to 1.0 seconds**. If the provider does not (e.g., SFTP), it requires a full download and upload, which could add **2-4 seconds** for a 5MB save state.
*   **Keeping it off the launch path**: The exit sync must not block the player. If the player launches a *different* game, they do not wait. If they launch the *same* game, EmulationStation checks `L_T` and `L_S`, and will refuse the launch if the reconciler holds `L_S` (D-CLOUD-053). To keep the network cost off the launch path, the reconciler must read the locally captured save into memory or a staging area, **release `L_S`**, and only then perform the network `copyto` and publish. Because capture already seals an independent copy (D-CLOUD-034), the reconciler does not need to hold `L_S` during the network round trips.

### 4. Migration

Devices currently hold `Saves-replaced/<stamp>/` in the cloud and `.cache/cloud_sync/replaced/<stamp>/` locally (`repo/docs/save-history-plan-delta.md`). These are pruned to the newest run (`repo/code/cloud_backup-set-aside-excerpt.md`). To ensure no earlier version is lost and no prompt is shown to the player:

1.  **Stop writing**: The new reconciler replaces `cloud_backup` and `cloud_restore`, so `--backup-dir` is naturally retired.
2.  **Read both**: The #25 restore tool must be amended to read both the new `.history/` store and the legacy `Saves-replaced/` and `.cache/cloud_sync/replaced/` directories.
3.  **Synthesize records**: When reading the legacy directories, the tool synthesizes a record in memory (e.g., `reason: replaced (legacy)`, using the folder's timestamp for the date).
4.  **Age out**: Because the legacy folders only hold a single run, they do not need to be moved or rewritten into `.history/`. They will simply remain accessible via the restore tool until the user deletes them or the 90-day age cap sweeps them.

### 5. A simpler shape

The proposed delta is **already the simplest shape** that meets all of the maintainer's constraints. 

*   Option C (`repo/docs/save-history-gap-analysis.md`, suffixed copies like `Zelda.srm.bak-1`) was rejected by the maintainer due to cluttering the saves folder.
*   Relying on the cloud provider's native file history (e.g., Dropbox's 30-day history) violates D-QA-017 (we do not optimize solely for Dropbox) and leaves users of self-hosted backends (WebDAV, SFTP, SMB) with no history at all.
*   The delta unifies two disparate, confusing mechanisms (`--backup-dir` and `-discarded/`) into a single, predictable, metadata-rich store. It uses one vocabulary ("earlier versions"), hides the complexity from casual browsing (D-CLOUD-095), and provides a single recovery path for all overwrite scenarios (conflicts, sync replacements, and auto-heal).