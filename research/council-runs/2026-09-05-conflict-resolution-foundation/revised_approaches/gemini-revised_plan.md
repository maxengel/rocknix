Here is my revised approach for the cloud-save conflict resolution foundation. 

This revision abandons my initial assumptions about rclone’s safety mechanisms and emulator file-flushing, which my peers correctly dismantled. Instead, it builds on the concrete, code-level vulnerabilities discovered by the council—specifically the broken ES merge primitives, the launch-behavior side effects of the proposed configuration, and the silent data-loss loops in the sync paths.

### 1. Concessions: What I Got Wrong

I explicitly concede the following claims from my Step 1 analysis, which were refuted by the corpus and my peers:

*   **The D-CLOUD-029 `--update` stopgap is unsafe.** I argued that adding `--update` to the game-exit sync would safely strand a local save rather than clobbering the cloud. `claude-analysis.md`, `gpt-analysis.md`, and `kimi-analysis.md` correctly proved this false: `autostart/102-cloud-saves` runs `cloud_restore --update` at boot. If the exit path skips uploading, the next boot will download the newer cloud copy and silently overwrite the local progress. My proposal merely moved the clobber from game-exit to boot.
*   **The "Emulator Flush Race" is not the primary timing hazard.** I hypothesized that the OS page cache might not have flushed when the capture step runs. `claude-analysis.md` and `gpt-analysis.md` correctly noted that `process.run()` has returned and the emulator has exited; Linux page cache is coherent for local readers. The real race is `claude-analysis.md`'s finding: the boot sync backgrounds itself and can overlap with active gameplay, uploading transient `.bak` files.
*   **Bisync does not "skip conflicting files entirely."** I stated this as fact. `claude-analysis.md` and `kimi-analysis.md` rightly called this an unverified hypothesis that contradicts `issues/issue-22.md` (which states `--conflict-loser num` renames losers). The spike must run to determine actual 1.75.0 behavior.
*   **Rclone does not guarantee atomic renames across all backends.** I relied on this for concurrency safety. `gpt-analysis.md` correctly pointed out that this is backend-dependent and unproven for our 69 targets.
*   **ROCKNIX does not use Yocto/buildroot.** `gpt-analysis.md` caught my error; `CLAUDE.md` defines it as a LibreELEC/CoreELEC fork. 
*   **Querying `agreed.json` history is impossible today.** `kimi-analysis.md` correctly noted that the schema header says "Nothing here is built."

### 2. Defenses: What I Still Hold

*   **The primary detector must be stateless and manifest-based.** I defend my stance to demote bisync, bolstered by `claude-analysis.md` and `kimi-analysis.md`. Bisync's stateful nature, its `--resync` traps, and its SRAM blindness on hashless backends (like the QA WebDAV) make it a fragile foundation. The SHA-256 manifest diff is the only mechanism that satisfies the corpus's constraints.
*   **Multi-file saves must be resolved as a unit.** I defend my "chimera" argument (e.g., mixing files from different devices corrupts the save), though I adopt `kimi-analysis.md`'s correction to use PPSSPP and shared VMU directories as the canonical examples rather than N64.
*   **Retention should be default-on.** I defend my argument that *Keep discarded saves* must default to ON, bounded by the count selector. `claude-analysis.md` and `gpt-analysis.md` agreed: a manual choice can be mistaken, and a support-only text log cannot recover lost bytes.

### 3. Adoptions: What Others Got Right

I adopt the following critical findings into the load-bearing architecture:

*   **The `-99` Auto-Only Bug (`gpt-analysis.md`):** `SaveStateRepository::getNextFreeSlot()` returns `-99` if the repository only contains `.state.auto` (`es/SaveStateRepository.cpp`). The IA's reliance on this for `KEEP BOTH` merges will fail on the most common conflict type.
*   **Unchecked Copy Primitives (`gpt-analysis.md`):** `copyToSlot()` returns `true` without checking the return values of the underlying file copies (`es/SaveState.cpp`). We cannot blindly reuse ES's helpers for cloud merges.
*   **The `racommands=false` Launch Trap (`gpt-analysis.md` & `claude-analysis.md`):** Shipping `es_savestates.cfg` for #10 forces `racommands = false` and disables `autosave`/`incremental` by default (`es/SaveStateConfigFile.cpp`). This silently changes launch behavior across every RetroArch system.
*   **The Deletion Propagation Gap (`claude-analysis.md`):** The conflict table lacks a deletion row. Without explicit tombstones, a player's local deletion is resurrected by the next sync, creating a permanent churn loop.
*   **The `--delete-excluded` Inheritance Trap (`claude-analysis.md`):** `cloud_sync.conf` ships with `--delete-excluded`. If the new detector inherits `RCLONEOPTS` without explicitly stripping it, a `sync` run will delete everything outside the allowlist (ROMs, BIOS).
*   **The Round-Trip Harness is Broken (`gpt-analysis.md`):** `tools/cloud-round-trip` overwrites `rclone.conf` before asserting the remote, and false-fails on dated archive names. It must be fixed before it can be trusted.

---

### 4. The Load-Bearing Foundation (What we must build)

If we get these wrong, the milestone is unsafe.

**A. Detection & Agreement Engine**
The primary detector is a local, stateless manifest diff (comparing local SHA-256, cloud SHA-256, and `agreed.json`). Bisync is relegated to a diagnostic tool or fast-path optimization *only if* the spike proves it safe. 
*   *Staleness Rule:* If a remote file has no manifest entry, it is treated as `unknown` and falls into the conservative "ask" branch. We do not assume it is a safe overwrite.
*   *Option Hygiene:* The detector must explicitly strip `--delete-excluded` from `RCLONEOPTS` and never inherit `BACKUPMETHOD=sync` semantics.

**B. The Merge Contract (Replacing ES Primitives)**
We cannot reuse `getNextFreeSlot()` and `copyToSlot()` directly. We must build a **checked adapter** that:
1.  Handles the `-99` auto-only edge case by defaulting to slot `0` or `firstslot`.
2.  Verifies the destination hashes of both the `.state` and `.png` after copying.
3.  Refreshes the repository explicitly before allocating multiple `KEEP BOTH` slots in a batch.

**C. Concurrency & Lifecycle Isolation**
The boot sync (`102-cloud-saves`) must be serialized against the emulator, not just other syncs. A sync running mid-play will capture transient `.state.auto.bak` files and zombie slots created by `setupSaveState`. The lock must exclude active gameplay.

**D. Grouped Resolution**
Multi-file saves (PPSSPP, VMU) must be resolved atomically. The wizard must batch these by directory/group, presenting one KEEP LEFT / KEEP RIGHT choice for the entire bundle.

---

### 5. Decision Changes (Register Rows)

I propose the following explicit register changes:

**1. WITHDRAW the D-CLOUD-029 `--update` reopen; implement a One-Way Stopgap.**
*   *Argument:* `--update` is unsafe due to the boot-restore clobber. Instead, adopt `claude-analysis.md`'s stopgap: disable the boot pair and SYNC row entirely, leaving *only* the game-exit upload (which is a pure `copy`). This preserves both copies and leaves divergences as "never agreed → ask" for the wizard's first run. Cross-device pickup is broken until the wizard ships, but no data is lost.

**2. REOPEN D-CLOUD-031 (Manifest Schema) for targeted amendments.**
*   *Argument:* The schema requires four surgical additions to be safe:
    *   `group_id`: To bind multi-file saves (PPSSPP/VMU) into atomic resolution units.
    *   `screenshot_sha256`: To bind the thumbnail to the state, preventing the wizard from presenting a mismatched image if a PNG copy fails (`gpt-analysis.md`).
    *   `deleted`: Explicit tombstones to allow deletion propagation without resurrection loops (`claude-analysis.md`).
    *   `agreed.json` scoping: Must key on `remote` + `sync_root` to prevent a changed cloud folder from authorizing overwrites based on old hashes.

**3. REOPEN IA Rev 3 Settings: *Keep discarded saves* defaults to ON.**
*   *Argument:* A manual choice in the wizard can be mistaken. A support-only text log cannot recover lost bytes. With `--backup-dir` already in use, the cost is near zero and bounded by the count selector.

---

### 6. Unmeasured Hypotheses & Required Experiments

Before writing code, we must execute these specific tests:

1.  **The Bisync Spike:** We must run this to determine what `--conflict-resolve none` actually does to conflicted files in 1.75.0 (does it rename both? skip? error?).
2.  **#10 Launch Behavior Rehearsal:** Because shipping `es_savestates.cfg` forces `racommands = false`, we must test auto-resume and incremental slot behavior on a real device to measure the blast radius of this "config-only" change.
3.  **Round-Trip Harness Repair:** Fix the `rclone.conf` overwrite and the dated-archive substring assertions in `tools/cloud-round-trip`. Run it on the GENERIC_X64 VM to establish a baseline.
4.  **Thumbnail Distinguishability:** Render actual side-by-side thumbnails on the RG351M (480×320) to prove the UI is legible before finalizing the wizard layout.