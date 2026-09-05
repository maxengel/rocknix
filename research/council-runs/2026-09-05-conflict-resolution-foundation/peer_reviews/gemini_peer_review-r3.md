An analysis of the four revised approaches against the embedded corpus and the maintainer’s new authoritative constraints.

---

### 1. Costing the Amendments

The maintainer’s two rulings—reversibility is one step back with no V1 undo control, and the discard store must support a future "time machine" picker—directly invalidate parts of the proposed plans:

*   **`gpt-revised_plan-r2.md` over-scoped V1.** GPT explicitly demanded a "minimal native recovery route for retained decisions" in V1 (Section 8), arguing that SSH is not a console-first escape hatch. The maintainer explicitly descoped this: *"ships no undo control... Restoring a discarded copy becomes a separate tool."* GPT pays the cost of designing and demanding a UI surface that the maintainer rejected.
*   **`kimi-revised_plan-r2.md` and `mistral-revised_plan-r2.md` designed a discard store the future picker cannot read.** Mistral places discards in `/storage/.cache/cloud_sync/discarded/<stamp>/`. Kimi places them in `/discarded/<path>/<sha256>`. Because Kimi deletes the plan file after apply, and Mistral relies only on a timestamp, both drop the context required for the future picker (which device produced the copy, which side won the conflict, what core it belongs to). To survive the amendment, the discard store must write a metadata sidecar (e.g., `discard-meta.json`) alongside the retained bytes.
*   **`kimi-revised_plan-r2.md` abandoned a capability for an edge case.** Kimi’s plan states: *"V1 propagates no ordinary deletion... The one deletion is D-CLOUD-030's duplicate compaction."* Kimi relies on a "hold-back" flag to prevent resurrecting deleted files, explicitly refusing to delete them from the cloud to protect against the unmounted-card edge case. The maintainer ruled: *"abandoning a capability to buy it [safety from an edge case] needs a better reason than the edge case alone."* Kimi’s complete refusal to propagate recorded deletions is costed by this amendment.

### 2. The Real Disagreements

**Disagreement 1: Deletion Propagation vs. Unexplained Absence**
*   *The Split:* `kimi-revised_plan-r2.md` refuses to propagate deletions to the cloud, using a local "hold-back" flag instead. `gpt-revised_plan-r2.md` allows deletion propagation, but *only* via explicit receipts (verified ES moves/deletes), while failing closed on unexplained absence.
*   *Substantive or Wording:* Substantive.
*   *Resolution:* `gpt-revised_plan-r2.md` wins. The maintainer’s amendment explicitly states we should not abandon capabilities just for edge cases. Kimi built a robust receipt system (the ops journal) but stopped short of using it to actually delete remote files. We should use Kimi's receipts to execute a remote `copy-verify-delete` (into the dated sibling), fulfilling the capability while still failing closed on unrecorded absence.

**Disagreement 2: Concurrency and `--backup-dir`**
*   *The Split:* `kimi-revised_plan-r2.md` leans on `rclone copy --backup-dir` in both directions as the primary safety net for concurrent writes, assuming it will atomically archive the intervening head if a race occurs. `gpt-revised_plan-r2.md` points out that `--backup-dir`'s atomicity and behavior under concurrent writes on backends like WebDAV and Dropbox is entirely unproven.
*   *Substantive or Wording:* Substantive.
*   *Resolution:* `gpt-revised_plan-r2.md` is correct. Rclone's `--backup-dir` is a client-side directive; on backends without atomic server-side moves, a concurrent overwrite can still result in a torn or lost file. *Experiment to settle:* The two-device race fixture (Gate 7). I predict `--backup-dir` will *not* reliably preserve the intervening head on WebDAV, meaning the lineage check (which both plans adopt) is the true safety net, surfacing the lost update as a fork on the next pass.

**Disagreement 3: The `es_savestates.cfg` Launch-Behavior Migration (#10)**
*   *The Split:* `claude-revised_plan-r2.md` (via Kimi's summary) thought #10 could be deferred because flat-path collisions become visible conflicts. `kimi-revised_plan-r2.md` and `gpt-revised_plan-r2.md` correctly identify that shipping `es_savestates.cfg` alters emulator launch behavior, not just directories.
*   *Substantive or Wording:* Substantive.
*   *Resolution:* `kimi` and `gpt` are correct. Source `es/SaveStateConfigFile.cpp` proves that the compiled `Default()` sets `incremental = true`, `autosave = true`, and `racommands = true`. But the XML parser (lines 160+) defaults `autosave` and `incremental` to false, and hardcodes `emul->racommands = false;`. Shipping this file disables the `.auto` backup dance. It must be gated behind a real-device rehearsal.

### 3. Testing Load-Bearing Claims Against the Corpus

I verified the most critical claims made by the plans against the embedded sources:

*   **Claim:** `copyToSlot` ignores copy/rename return values and returns `true` unconditionally (`kimi-revised_plan-r2.md`).
    *   *Verification:* **TRUE.** Source 38 (`es/SaveState.cpp`), lines 240-264. The function executes `Utils::FileSystem::renameFile(...)` or `copyFile(...)` and unconditionally hits `return true;` at the end without checking their success. A checked adapter is absolutely mandatory.
*   **Claim:** `getNextFreeSlot` returns `-99` for an auto-only repository (`kimi-revised_plan-r2.md`, `gpt-revised_plan-r2.md`).
    *   *Verification:* **TRUE.** Source 37 (`es/SaveStateRepository.cpp`), lines 183-199. If only an auto state exists, `states.size()` is 1. The loop scans `for (int i = 99999; i >= 0; i--)`. Since the auto state has `slot == -1`, the loop finishes without a match and returns `-99`.
*   **Claim:** A non-empty `RCLONEOPTS` without `--filter-from` bypasses the allowlist (`kimi-revised_plan-r2.md`).
    *   *Verification:* **TRUE.** Source 33 (`cloud_sync.conf`) defines `RCLONEOPTS` including the `--filter-from` flag. Source 31 (`cloud_sync_helper`) merges user configs. If a user overrides `RCLONEOPTS` in their local config, the default `--filter-from` is lost. Because `cloud_backup` [S29] passes `RCLONEOPTS` directly to rclone, the allowlist is entirely bypassed. This is a massive shipped hazard.
*   **Claim:** The exit upload is `copy` with no `--update`, meaning it overwrites the cloud head of a fork (`kimi-revised_plan-r2.md`).
    *   *Verification:* **TRUE.** Source 29 (`cloud_backup`), lines 218-232. The `--recent` flag forces `BACKUPMETHOD="copy"` and adds `--max-age` and `--no-traverse`, but does *not* add `--update`. It is a blind overwrite.

### 4. What Each Plan Uniquely Has (To Lift Verbatim)

*   **From `kimi-revised_plan-r2.md`:** The exact breakdown of the ES primitive defects (`getNextFreeSlot` returning `-99`, `copyToSlot` returning unconditional `true`, `makeStateFilename` deriving from the source's parent). This proves beyond doubt that raw ES primitives cannot be used and a checked adapter is required.
*   **From `gpt-revised_plan-r2.md`:** The **lifecycle gate acquisition order**: *"1. A network worker takes the cloud lock non-blockingly. 2. It takes the lifecycle gate non-blockingly... 4. ES’s game session holds the lifecycle gate, performs local capture, releases it, and only then requests cloud work. 5. Capture never waits for the cloud lock."* This structurally eliminates the boot-sync vs. game-session race.
*   **From `claude-revised_plan-r2.md` (via Kimi):** Binding `agreed.json` to the 5-tuple of `{remote name, remote type, SYNCPATH, BACKUPPATH, RESTOREPATH}`. This ensures that changing a cloud folder or unlinking an account doesn't result in a mass false-agreement overwrite.
*   **From `mistral-revised_plan-r2.md`:** The explicit "What not to build" section, which serves as a strict out-of-scope fence for the builder.

### 5. What Should Not Be Built

*   **A native undo/recovery UI in V1:** Explicitly descoped by the maintainer.
*   **A SQLite database:** Unnecessary overhead on busybox, and syncing a database file is a known corruption hazard (as proven by the allowlist exclusions).
*   **A full staging mirror of the remote tree:** Costs a full download on hashless backends just to verify equality. Candidate-scoped staging is the correct approach.
*   **A 99-slot product cap:** ES supports 99999 slots; capping it is inventing a product limitation to mask a code defect.
*   **`bisync` as the production detector:** It remains a spike. Its `--conflict-loser` suffix breaks ES's regex, and its `--resync` behavior is too dangerous for unattended syncs.

### 6. Which Plan I Would Build From

I would build from **`kimi-revised_plan-r2.md`**. 

It is the most rigorously evidenced plan, correctly identifying the ES primitive bugs, the `RCLONEOPTS` bypass hazard, and the exact exit-path budget. It relies on verifiable artifacts rather than assumed rclone behaviors.

**What I would change/take from the others:**
1.  **Fix the Discard Store (Maintainer Amendment):** I would amend Kimi's discard store to write a `discard-meta.json` sidecar alongside every retained file. This sidecar will record `original_path`, `game`, `core`, `device_id`, `side_won`, and `timestamp`, perfectly setting up the maintainer's V2 "time machine" picker.
2.  **Restore Deletion Propagation (Maintainer Amendment / GPT):** I would take GPT's approach to deletion. Kimi built a brilliant "ops journal" to generate deletion receipts, but stopped short of using them to delete remote files. I would use Kimi's receipts to execute a remote `copy-verify-delete` (into the dated sibling), fulfilling the deletion capability while still failing closed on unrecorded absence.
3.  **Adopt the Lifecycle Gate (GPT):** I would lift GPT's strict lock acquisition order to guarantee the boot-sync cannot race the emulator.

### 7. Where a Plan Changed My Mind

The reviews and the revised plans changed my mind regarding **`bisync` and the full staging mirror**. In my own revision, I might have leaned toward utilizing `bisync`'s built-in detection or mirroring the remote tree to simplify comparisons. However, `kimi-revised_plan-r2.md` and `gpt-revised_plan-r2.md` conclusively proved that `bisync`'s suffixing breaks ES's `{{romfilename}}.state{{slot}}` regex (causing files to vanish from the UI), and that a full staging mirror on a hashless backend (like the QA WebDAV) would trigger a full library download just to verify sizes. Candidate-scoped downloads and a custom JSON-based reconciler are the only safe paths forward.