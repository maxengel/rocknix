This round has successfully stress-tested the foundation. The revisions agree on the core architecture: **bisync is demoted, detection is a manifest-based three-way reconcile, and the ES merge primitives require a checked adapter.** 

However, the plans diverge significantly on how to handle concurrency, deletions, and the detection substrate. Below is the adjudication of those disagreements, the verification of the load-bearing claims, and the final synthesis.

### 1. The Real Disagreements (and how to settle them)

**Concurrency and Cross-Device Races**
* **The Disagreement:** `gpt-revised_plan.md` demands a custom two-phase commit (a "protected publication batch" that seals bytes, publishes a uniquely named copy, and associates it with a receipt before canonical replacement). `claude-revised_plan.md` and `kimi-revised_plan.md` rely on rclone's native `--backup-dir` to archive overwritten files.
* **Settlement:** GPT's approach is over-engineering for a busybox environment with a 5-second budget. `rclone copy --backup-dir` natively moves the existing remote file aside before overwriting it. If Device A overwrites Device B's upload, B's bytes are safely archived in the dated backup directory. This satisfies the requirement to preserve competing publications without building a custom transaction journal. Claude and Kimi win here.

**Deletion Propagation**
* **The Disagreement:** `claude-revised_plan.md` wants to propagate deletions using tombstones hooked into the ES delete path. `gpt-revised_plan.md` wants explicit operation receipts. `kimi-revised_plan.md` argues that deletions should *never* propagate in V1 (absence = resurrect).
* **Settlement:** Kimi is right. Hooking the ES delete path (which isn't fully embedded in this corpus) to write tombstones is too fragile for V1. Resurrecting a deleted save is a minor annoyance; losing a save to a false tombstone (e.g., an unmounted SD card or an emulator's temporary rename) violates the cardinal rule. V1 must fail closed on absence.

**Detection Substrate (Staging vs. Hash)**
* **The Disagreement:** `kimi-revised_plan.md` proposes a full staging mirror (`rclone copy` the remote tree locally, then hash). `claude-revised_plan.md` proposes `rclone lsjson --hash` with targeted downloads.
* **Settlement:** Claude is right. Kimi's staging mirror violates the 5-second budget and fails the `#53` size-only trap on WebDAV (an unchanged size means `rclone copy` skips the file, leaving the local hash stale even if the remote bytes changed). Claude's targeted `lsjson --hash` (falling back to download-and-hash only on hashless backends) is the correct budget-conscious approach.

### 2. Testing the Load-Bearing Claims

I verified the following claims against the embedded corpus. A confident error here would break the milestone.

* **`getNextFreeSlot()` returns `-99` for auto-only (GPT, Claude, Kimi):** **Verified.** In `es/SaveStateRepository.cpp`, if only `.state.auto` (slot `-1`) exists, `states.size() == 1`. The `states.size() == 0` early return is bypassed. The loop checks slots `99999` down to `0`, finds nothing, and falls through to return `-99`. Gemini's Step 2 rebuttal was definitively wrong.
* **`copyToSlot()` ignores failures (GPT, Claude, Kimi):** **Verified.** In `es/SaveState.cpp`, the function checks `slot < 0` and source existence, but completely ignores the return values of `renameFile` and `copyFile`. It returns `true` unconditionally, even if the disk is full.
* **`es_savestates.cfg` changes launch behavior (Claude, Kimi):** **Verified.** In `es/SaveStateConfigFile.cpp`, the compiled `Default()` sets `racommands = true`. However, the XML parsing logic hardcodes `racommands = false` and defaults `autosave` and `incremental` to false. Creating this file to satisfy `#10` disables the `.auto` backup and next-slot copy. `#10` must be re-sequenced after the wizard.
* **Manifest transport hazard (Kimi):** **Verified.** If Device B downloads `manifest-A.json`, it sits in `savestates/.rocknix/`. B's next `cloud_backup` will catch it in the `+ /savestates/**` allowlist and upload it, overwriting A's newer manifest with A's older one.
* **`cloud_sync_helper` duplicate check (GPT):** **Verified.** GPT correctly points out that `cloud_sync_helper` (Source 31) does not contain `ASSUME_YES` or `controller_confirm`. The duplicate check logic lives entirely in `cloud_backup` (Source 29) and `cloud_restore` (Source 30). Gemini hallucinated the bug's location.

### 3. What Each Plan Uniquely Has (To Keep)

* **Claude:** **`agreed.json` binding.** Binding the agreement record to the remote name and sync roots is critical. Without this, a user executing `CHANGE CLOUD FOLDER` would apply an old agreement to a new, empty destination, causing the detector to falsely conclude the cloud deleted everything.
* **GPT:** **`makeStateFilename` parent derivation.** GPT caught a massive bug in how we planned to use ES primitives: `makeStateFilename(fullPath=true)` derives the destination from the *source's* parent directory (`es/SaveState.cpp`). If we download a cloud state to a temporary folder and call `copyToSlot()`, it will merge the file into the temporary folder, not the game's save folder. Cloud files must be staged in the actual save directory under a temporary name, or the adapter must compute the destination itself.
* **Kimi:** **Manifest transport rule.** Excluding `.rocknix/**` from the bulk tree transfer and using explicit single-file copies is the only way to prevent the republication of stale foreign manifests (verified above).
* **Mistral:** **Configuration stopgap.** Disabling the boot restore via existing toggles while keeping the exit upload is a zero-code way for the maintainer to stop the newest-wins race immediately during development.

### 4. What Should Not Be Built (Over-engineering)

* **GPT's protected publication batch:** A custom two-phase commit in bash is too complex and unnecessary when `rclone copy --backup-dir` provides atomic-equivalent archiving of overwritten files.
* **Kimi's staging mirror:** Mirroring the entire remote tree locally on every sync is too slow and fails on hashless backends.
* **Claude's tombstones:** Hooking ES delete paths to write tombstones is too fragile for V1.

### 5. Conclusion: Which Plan to Build From

I would build from **`kimi-revised_plan.md`**, heavily amended. 

Kimi's structure—explicit F-numbered load-bearing rules, clear concessions, and the critical manifest transport rule—is the most rigorous foundation. However, I would:
1. **Replace** Kimi's staging mirror (F3) with Claude's `lsjson --hash` detection.
2. **Adopt** GPT's `copyToSlot` staging fix (incorporating it into F6).
3. **Adopt** Claude's `agreed.json` binding (incorporating it into F4).
4. **Keep** Kimi's "no deletion propagation" rule (F8) over Claude's tombstones and GPT's receipts.

This synthesis respects the 5-second budget, closes the ES primitive traps, and safely defers concurrency and deletion complexity to V2.