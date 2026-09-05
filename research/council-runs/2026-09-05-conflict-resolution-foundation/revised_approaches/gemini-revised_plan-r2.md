This is my round-2 revised approach for the cloud-save conflict resolution foundation in ROCKNIX. It synthesizes the findings from the embedded corpus and the four peer reviews (`claude-revised_plan.md`, `gemini-revised_plan.md`, `gpt-revised_plan.md`, `mistral-revised_plan.md`), settling the remaining disagreements into a standalone, implementable specification.

## 1. Concessions and Refutations

Before defining the architecture, I concede the following points where peer reviews proved earlier approaches unsafe or unearned:

*   **The "lossless one-way stopgap" is destructive.** `gemini-revised_plan.md` and `mistral-revised_plan.md` proposed disabling downloads and keeping only the game-exit upload. As `gpt-revised_plan.md` and `kimi-revised_plan.md` correctly proved from `projects/ROCKNIX/packages/network/rclone/sources/cloud_backup`, the exit upload forces `copy` with *no* `--update`. It will blindly overwrite a newer cloud copy. This stopgap must not be built. D-CLOUD-029 stands.
*   **A full staging mirror is blind to same-size changes.** `kimi-revised_plan.md` proposed a metadata-skipped staging mirror. As `gpt-revised_plan.md` pointed out, on hashless backends (like the QA WebDAV, per `docs/save-manifest-alignment-review.md`), a same-size SRAM edit will be skipped by `rclone copy`, causing the detector to miss the cloud change entirely. We must use candidate-scoped reads with explicit download-and-hash verification.
*   **Hash-union provenance is volatile.** `claude-revised_plan.md` proposed looking up a version's producer by hashing across all manifests. `gpt-revised_plan.md` correctly argued that once the producer overwrites its own slot, the entry vanishes, and imported copies (like KEEP BOTH merges) lose their history. Provenance must be carried as an `origin` object inside the entry itself.
*   **Absence is not deletion intent, but D-CLOUD-030 requires tombstones.** `kimi-revised_plan.md` argued for never propagating deletions. However, `claude_peer_review-r2.md` proved that without cloud-side retirement, D-CLOUD-030's duplicate compaction creates an infinite upload/download/compact loop. We must use intent-recorded receipts (tombstones) for explicit deletions and compactions, while treating unexplained absence as a fail-closed anomaly.

## 2. The Architecture, End to End

### 2.1 Detection: The Manifest Three-Way Test
*Note: The council unanimously agrees on this, but it is **unmeasured** until the bisync spike runs.*

We demote `rclone bisync` to a candidate transport engine. The detector is a stateless classifier applying a three-way test (Local, Cloud, Agreed) per `docs/save-manifest-schema.md`.
*   **Candidate-Scoped Reads:** The engine lists the remote (`lsjson --hash`). It stages only the paths where L≠C (by hash if available, or size/mtime if not). On hashless backends, it explicitly downloads and hashes candidates to defeat the size-only blindspot.
*   **Multi-File Units:** Classification operates on the *save unit*, not individual files. If any member of a declared unit (e.g., a shared VMU or a state+PNG) is divergent, the entire unit is marked divergent. `gpt-revised_plan.md` correctly notes that aggregating file conflicts silently creates Frankenstein saves.

### 2.2 Identity and Lineage
We refine D-CLOUD-031 (see §5) to include an `origin` object.
*   **Self-Contained Provenance:** When a device materializes a save from the cloud, it records the producer's `device.label`, `core`, `core_build`, and `captured_at` in its own manifest entry.
*   **Screenshot Binding:** The manifest records `screenshot_sha256` to ensure the picker never displays a mismatched thumbnail.
*   **Move Observation:** ES move operations (`renumberSlots`) must update the placement record locally. We do not attempt to infer lineage after a rename-and-overwrite (`mistral-revised_plan.md`).

### 2.3 Presentation and Resolution
*   **Queued Conflicts & Headless Handoff:** The exit sync never opens the wizard over a player who just finished a game (`kimi-revised_plan.md`). Conflicts are written to a durable pending-result file. The UI surfaces a "N SAVE CONFLICTS TO RESOLVE" badge in `GAME SETTINGS > CLOUD SETTINGS`.
*   **Kid/Kiosk Mode:** The badge is hidden in restricted modes (`gpt-revised_plan.md`). Destructive resolution requires unlocking the full UI. We reject `mistral-revised_plan.md`'s requirement to make it reachable here, as it violates the mode's design (`docs/es-menu-map.md`).
*   **KEEP BOTH on Auto States:** The device's resume point stays at `.state.auto`. The cloud version materializes into a numbered slot with its thumbnail (`gpt-revised_plan.md`).
*   **Cancellation Contract:** "Cancelling leaves conflicting versions unchanged and discards walkthrough choices. Earlier non-conflicting updates have already been applied."

### 2.4 Merge, Safety, and Rollback
*   **Concurrency via `--backup-dir`:** We reject `gpt-revised_plan.md`'s expensive protected-publication protocol for V1. Instead, we use `gemini-revised_plan.md` and `claude-revised_plan.md`'s approach: every transfer in both directions uses `--backup-dir`. Uploads move cloud preimages to `<SYNCPATH>-replaced/<stamp>`; downloads move local preimages to `/storage/.cache/cloud_sync/discarded/<stamp>`. This makes lost races *recoverable* without extra spawns.
*   **Discard Store:** Lives at `/storage/.cache/cloud_sync/discarded/`. Because it is outside `/storage/roms`, it requires no allowlist exclusions and avoids sync-tree contamination (`kimi-revised_plan.md`).
*   **Retention:** *Keep discarded saves* defaults **ON**, bounded by a count selector. (This is a unanimous council change from IA rev 4's off-by-default).
*   **Checked Adapter:** `es/SaveStateRepository.cpp`'s `getNextFreeSlot()` returns -99 for auto-only repos, and `copyToSlot()` ignores return values. We wrap these in a checked adapter that verifies bytes written and handles the -99 defect safely.

### 2.5 Migration Path
*   **D-CLOUD-029 Stands:** The shipped write paths stay as they are until the new engine replaces them.
*   **Boot Sync vs. Session Race:** The detached `102-cloud-saves` boot script races with active gameplay, causing data loss (`claude-revised_plan.md`). We move the boot sync into ES scheduling, gated by save-lifecycle semantics (`gpt-revised_plan.md`): uploads of sealed data during play are permitted, but restores/renumbers/applies are blocked while an emulator runs.
*   **Manifest Transport:** Manifests move via in-spawn filters (`--include /savestates/.rocknix/manifest-<own>.json`), not separate `rclone` spawns, preserving the exit budget.

## 3. Decision Register Changes

These are explicit, append-only refinements to existing rows:

*   **Refine D-CLOUD-031-A (Origin):** Manifest entries must carry an `origin` object (device, core, build, capture time) to preserve producer metadata across re-slots.
*   **Refine D-CLOUD-031-B (Screenshots):** Manifest entries must carry `screenshot_sha256` to bind thumbnails to states.
*   **Refine D-CLOUD-031-C (Units):** Multi-file saves are grouped by a shared label. Shared containers (e.g., VMUs) record `rom: null`.
*   **Refine D-CLOUD-030-A (Deletions):** Unexplained absence fails closed. Explicit ES deletions, renumbers, and D-CLOUD-030 compactions write intent-recorded receipts (tombstones) which propagate as moves into dated siblings, capped per run.
*   **New Row (Retention):** *Keep discarded saves* defaults ON, bounded by a count selector, unifying conflict discards with #25's rollback precursor.

## 4. Known Unknowns (Resolution Plan)

1.  **Does loading a state rewrite SRAM?** (`gpt-revised_plan.md`)
    *   *Plan:* On a disposable test library, load a state, exit without saving in-game, and check if the `.srm` mtime/hash changed. If yes, states and saves form a single cross-unit dependency for the pre-pass.
2.  **The Exit Budget.**
    *   *Plan:* Measure process starts and remote operations on the H700 for: no changes, one changed SRAM, one state+PNG, and hashless verification. If the budget exceeds 5 seconds, defer hashless verification to the boot/menu full pass, leaving the exit push as a fast-path upload only.
3.  **`BACKUPPATH != RESTOREPATH` Behavior.**
    *   *Plan:* Treat a split path as an import destination (`gpt-revised_plan.md`). The engine performs a one-way copy into the alternate root but writes no agreement records, preserving the shipped feature's intent without corrupting the sync state.
4.  **The LAN No-Default-Route False Negative.**
    *   *Plan:* `check_network_link` exits 4 if there is no default route, which breaks LAN-only remotes on the same subnet (`gpt-revised_plan.md`). Replace the `ip route` check with a fast local ping to the remote's resolved IP, falling back to the default route check only for WAN remotes.

## 5. Unknown Unknowns

**The Failure:** The round-trip suite (`tools/cloud-round-trip`) reports SUCCESS while testing nothing, because its assertions are broken and it tests against a legacy archive naming convention.
**The Cheapest Experiment:** Repair the harness. Remove the `rclone.conf` overwrite that precedes the remote assertion. Fix the archive-namespace assertion to expect the new `${stamp}-${base}` dated names. Run it against MinIO (S3) and WebDAV on a GENERIC_X64 VM. If it fails, the test suite itself is the unknown unknown masking regressions.

## 6. What Must Be Proven on Hardware (In Order)

1.  **The Bisync Spike:** Run `rclone bisync` 1.75.0 against WebDAV and Dropbox with a genuine fork, a same-size SRAM edit, and an external equalization. If it demands `--resync` or renames savestate losers, permanently discard it as a detector.
2.  **The #19 Compatibility Bench (D-CLOUD-025):** Run the same-chipset control first (RG35XX SP vs RG SP). Then cross-family (H700 vs RK3566). Finally, corruption tests (truncate vs flip bytes) to determine if failure is loud or silent. This decides the severity of the UI badge.
3.  **The #10 Launch-Behavior Rehearsal:** Before shipping `es_savestates.cfg`, test auto-resume and incremental-slot behavior on a real device (`gemini-revised_plan.md`). Creating this XML file flips `racommands` to false and alters launch arguments. We must prove this does not strand existing flat-namespace saves.
4.  **The Boot-Race Reproducer:** Turn on startup sync, boot, launch a game from a numbered slot within 30 seconds, let the boot sync finish, exit, and list the remote. Prove that moving the boot sync into ES scheduling prevents the emulator's live SRAM from being overwritten by a stale cloud download.
5.  **The Interrupted Apply:** Kill the process after a local replacement but before remote publication, and after remote publication but before agreement is advanced. Prove that the frozen plan file allows the next pass to re-detect the unapplied remainder safely without deleting a unique candidate.