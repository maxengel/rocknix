### 1. Is this foundation sound, end to end?

The foundation is exceptionally well-reasoned but contains two critical structural flaws in its detection and write-path migration strategies. 

**Detection (`rclone bisync`): Amend.** 
Relying on `rclone bisync` with `--conflict-resolve none` (`research/council-runs/2026-09-05-conflict-resolution-foundation/_sources/issues/issue-22.md`) is dangerous for a handheld gaming OS. Bisync is highly stateful; it relies on local listings stored in `/storage/.cache/rclone/bisync`. If a handheld hard-powers off, drops Wi-Fi mid-transfer, or has its SD card swapped, bisync's state can desync from the remote. When this happens, bisync refuses to run and demands `--resync` (which defaults to `path1` winner-takes-all). Issue #22 explicitly forbids the detector from running `--resync` on its own. This creates a deadlock: bisync refuses to run without `--resync`, and our scripts refuse to pass `--resync`. 
*Recommendation:* Do not use `bisync` for detection. You are already building a robust, stateless manifest system (`research/council-runs/2026-09-05-conflict-resolution-foundation/_sources/repo/docs/save-manifest-schema.md`). Use `rclone lsjson` to pull the remote manifests, diff them against the local manifests and `agreed.json` in memory, and execute standard `rclone copy` commands. It is stateless, immune to workdir corruption, and guarantees you never accidentally trigger a winner-takes-all resync.

**Identity and Lineage (sha256 + manifest): Endorse.**
Deciding that identity is the `sha256` of the stored bytes (D-CLOUD-030) is brilliant. Because EmulationStation renumbers slots by renaming files (`research/council-runs/2026-09-05-conflict-resolution-foundation/_sources/es/SaveStateRepository.cpp`), relying on filenames would cause endless false conflicts. 

**Presentation and Resolution: Amend.**
The IA states that non-conflicts are applied *before* the wizard opens (`research/council-runs/2026-09-05-conflict-resolution-foundation/_sources/repo/docs/conflict-wizard-ia.md`). This is mandatory so that `getNextFreeSlot()` accurately reflects the cloud's state. However, if you use `bisync --conflict-resolve none`, bisync will skip the conflicting files entirely. This means the cloud's conflicting file is *not on the device* when the wizard opens. To show the wizard, or to execute KEEP BOTH, you must download the cloud's conflicting file to a temporary staging directory first. 

**Merge Semantics (`copyToSlot`): Endorse.**
Reusing ES's `SaveState::copyToSlot` (`research/council-runs/2026-09-05-conflict-resolution-foundation/_sources/es/SaveState.cpp`) ensures the `.png` thumbnail travels with the state automatically. 

**Safety and Rollback: Amend.**
V2 snapshots (#25) are planned "later" (`research/council-runs/2026-09-05-conflict-resolution-foundation/_sources/repo/plans/conflict-resolution/vita-style-conflict-resolution.md`). This is too late. If *keep discarded saves* is off by default (IA Rev 3), a player who accidentally presses A on the wrong panel permanently deletes their progress. The cardinal rule is "never auto-delete the loser." While a manual choice isn't "auto-delete," a UI slip is irreversible. 
*Recommendation:* *Keep discarded saves* must default to ON with a retention count of 1, or V2 snapshots must block this release.

**Migration off shipped write paths: REOPEN D-CLOUD-029.**
D-CLOUD-029 (`research/council-runs/2026-09-05-conflict-resolution-foundation/_sources/repo/docs/decision-register.md`) leaves the current `copy --update` and game-exit `copy` paths in place until the wizard is built. As noted in Blindspot 28, this means the shipped OS is currently executing a recency-based clobber on every game exit. The maintainer argued that adding `--update` to the game-exit sync is just swapping one risk for another. This is false. A clobber destroys the older (potentially higher-progress) save permanently. A skip (`--update`) leaves the local save stuck on the device, but *safe*, until the wizard ships. 
*Argument to reopen:* Data loss is worse than data stranding. Reopen D-CLOUD-029 and apply `--update` to the game-exit sync immediately as a stopgap.

### 2. The Known Unknowns

1. **Chipset compatibility / loud vs silent failure:** Run the protocol in `docs/savestate-compat-test.md` on the physical bench (H700, RK3566, RK3326) before designing the UI badge.
2. **Bisync against real remote / interrupted run:** *Misframed.* Do not run this spike. As argued above, drop `bisync` entirely and use your manifest diffing. If you insist on bisync, measure this by pulling the battery on the device mid-sync, then observe if `bisync --recover` deadlocks.
3. **Auto state commonest conflict:** Measure by querying the maintainer's own `agreed.json` history. The wizard should treat it as a resume point, but verify that `copyToSlot` correctly translates a `.state.auto` into a numbered `.stateN` when KEEP BOTH is selected.
4. **KEEP BOTH's "next free slot" safety:** Measure by interrupting the pre-pass gate. If the pre-pass fails, the wizard must refuse to open.
5. **`es_savestates.cfg` location:** *Answered by corpus.* `SaveStateConfigFile.cpp` lines 136-139 (`research/council-runs/2026-09-05-conflict-resolution-foundation/_sources/es/SaveStateConfigFile.cpp`) show it looks in `Paths::getUserEmulationStationPath()` and `Paths::getEmulationStationPath()`. If it's missing, ES falls back to hardcoded defaults.
6. **Core build pin not on device:** Plan: Implement the `#21` AC to emit `/usr/share/rocknix/core-pins` during the Yocto/buildroot image assembly phase.
7. **`BACKUPPATH == RESTOREPATH` assumed:** Plan: Add a strict assertion in `cloud_sync_helper` (`research/council-runs/2026-09-05-conflict-resolution-foundation/_sources/repo/projects/ROCKNIX/packages/network/rclone/sources/cloud_sync_helper`). If they differ, refuse to run the conflict engine and fall back to legacy copy.
8. **Standalone emulators' multi-file saves:** *See Unknown Unknowns below.*
9. **480×320 panel readability:** Plan: Generate UI frames via `tools/vm-visual-qa` at 480x320. If thumbnails are illegible, fallback to a single-panel toggle (L/R shoulder buttons to swap views) rather than side-by-side.
10. **Two devices online at once:** Plan: The lock (`/var/run/cloud_sync.lock`) is local. Rclone handles remote concurrency safely via temporary files and atomic renames, but manifests could overwrite each other if two devices upload simultaneously. Measure by running two VMs syncing to the same WebDAV endpoint simultaneously.
11. **Round-trip suite never run:** Plan: Execute `tools/cloud-round-trip` on the `GENERIC_X64` VM immediately.

### 3. Unknown Unknowns (What is missing)

**1. The Multi-File Save Chimera (Architecture)**
*The Failure:* Standalone emulators often use multiple files for a single save state (e.g., N64 uses `.eep` and `.mpk`). Because the manifest keys by *file path* (`research/council-runs/2026-09-05-conflict-resolution-foundation/_sources/repo/docs/save-manifest-schema.md`), a conflict in an N64 game will present as two separate conflicts in the wizard. If a player chooses KEEP LEFT for the `.eep` and KEEP RIGHT for the `.mpk`, they will stitch together two different playthroughs, almost certainly corrupting the save permanently.
*Cheapest Experiment:* Create a fixture in `tools/cloud-round-trip` with mismatched `.eep` and `.mpk` files. Observe if the wizard groups them (it won't, based on the schema) or asks twice. 

**2. The Emulator Flush Race Condition (Substrate)**
*The Failure:* The game-exit hook (`FileData.cpp:836` in `research/council-runs/2026-09-05-conflict-resolution-foundation/_sources/es/FileData.cpp.launchGame-excerpt-l740-850.cpp`) fires `ThreadedCloudSync::start` immediately after `process.run()` returns. However, the OS filesystem cache may not have flushed the emulator's final SRAM write to disk, or a standalone emulator might fork and return before fully terminating. If `cloud_backup` hashes and uploads the `.srm` while it is still being written, the cloud receives a torn save, and the manifest records a hash that will immediately mismatch the local file once the flush completes.
*Cheapest Experiment:* Add a 50MB dummy save file to a core, exit the game, and immediately check if the uploaded `sha256` matches the final `sha256` on the SD card. 

**3. Clock Skew vs. Rclone Mtime (Operational)**
*The Failure:* Handhelds frequently boot without NTP sync, defaulting to epoch time (1970). The schema correctly flags `clock_synced: false`, but `rclone` itself relies heavily on `mtime` for its internal comparisons. If a device writes a save in 1970, and the cloud has a save from 2026, a standard `rclone copy --update` (or bisync) will silently skip uploading the new progress because 1970 < 2026. The conflict detector will never even see the file because rclone filtered it out before the script could evaluate it.
*Cheapest Experiment:* Disconnect Wi-Fi, set the OS clock to 2020, play a game to generate a save, reconnect Wi-Fi, and run the sync. Watch rclone silently ignore the file.

**4. The "Unknown" Manifest Overwrite (Architecture)**
*The Failure:* If Device A uploads a save (creating a manifest), and Device B downloads it via a legacy client (or before upgrading), Device B has the file but no manifest. When Device B upgrades and plays the game, it hashes the file, finds no manifest, and marks its lineage as `unknown`. When Device B syncs, it will see Device A's manifested version in the cloud. Because Device B's version is `unknown`, the conflict test (`research/council-runs/2026-09-05-conflict-resolution-foundation/_sources/repo/docs/save-manifest-schema.md` §3) says "never agreed -> ask". This is safe. *However*, if the user chooses KEEP RIGHT (Device B), does the new manifest correctly adopt Device A's `replaces` lineage, or does it sever the history? 
*Cheapest Experiment:* Hand-craft a legacy state in the QA bucket, download it to a VM, modify it, and trace the resulting `agreed.json` and manifest lineage.

### 4. What must be proven on hardware, and in what order

Before writing any UI code for the wizard, the following must be proven sequentially:

1. **The Emulator Flush Race (Hardware):** Prove that `cloud_backup` captures the exact final bytes of the `.srm`. 
   *Invalidation:* If it races, you must inject a `sync` command and a brief sleep into `FileData.cpp` before triggering the backup, or the sha256 identity foundation is void.
2. **The Bisync Deadlock (VM/Hardware):** Prove that `rclone bisync` can recover from a deleted `/storage/.cache/rclone/bisync` directory without requiring `--resync`. 
   *Invalidation:* If it demands `--resync`, you must abandon `bisync` for detection and write a custom manifest-diffing script, or you will eventually brick the sync subsystem for users who experience SD card corruption.
3. **Savestate Compatibility (Hardware):** Run the `docs/savestate-compat-test.md` protocol across the H700, RK3566, and RK3326. 
   *Invalidation:* If cross-chipset loads result in silent corruption, the UI toggles for cross-chipset sync must be removed entirely or placed behind an "Advanced/Destructive" warning, and the UI badge becomes a hard safeguard.
4. **480x320 Legibility (VM):** Render the side-by-side screenshot UI at 480x320. 
   *Invalidation:* If the thumbnails are too small to distinguish gameplay moments, the side-by-side layout must be scrapped for a single-panel toggle design.