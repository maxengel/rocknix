# Council — round 2, peer review of the revised approaches

You are one of five council members. Each of you has produced a revised approach
to the foundation for cloud-save conflict resolution in ROCKNIX. The corpus is
embedded above, unchanged and hash-verified; the other four members' revised
approaches are injected below.

Review them. You are not revising your own plan in this step and you are not
voting.

## Anti-self-citation constraint

Judge the plans on their merits against the embedded corpus. Do not treat the
injected artifacts as evidence about how councils, models, or this deliberation
behave.

## What this round is for

The revisions have converged on much and still differ in places. Your job is to
make the remaining differences **decidable**, so that what gets built is the
best available foundation rather than an average of four documents.

- **Find the real disagreements.** Where two plans differ, say whether the
  difference is substantive or only wording. If substantive, state what evidence
  or experiment would settle it, and which way you think it settles.
- **Test the load-bearing claims again.** These plans now make detailed
  assertions about the shipped scripts, EmulationStation's helpers, rclone's
  behaviour, filter precedence, exit codes and the register. Check them against
  the corpus. A confident error that survives into the built foundation is the
  most expensive thing that can happen here.
- **Name what each plan uniquely has.** For every plan, identify at least one
  element the others lack that would be a real loss if it were dropped. Be
  specific enough that it could be lifted into another plan verbatim.
- **Name what any plan has that should not be built.** Over-engineering is a
  failure mode too: this is a handheld running busybox with a five-second
  budget on the path a player watches. Say plainly where a plan proposes
  machinery the problem does not earn.
- **Say which plan you would build from,** and what you would take from the
  others before building. You are not voting; you are making the case.

Where a plan has changed your mind since your own revision, say so and why.

Refer to plans by filename (for example `kimi-revised_plan.md`), never by an
invented ordinal.

## Injected revised approaches

=== START gemini-revised_plan.md ===

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

=== END gemini-revised_plan.md ===

=== START gpt-revised_plan.md ===

# `gpt-revised-approach.md`

## Recommendation

**Build a content-based reconciliation service, using rclone for transport—not bisync as the authority on conflicts.** Retain the core namespace, stored-byte SHA-256 identity, per-device manifest, and native wizard. Amend the surrounding contracts before implementing capture or enabling any replacement write path.

The important changes are:

1. **Capture locally even when cloud transfer cannot run.**
2. **Reconcile complete save units, not every allowlisted path independently.**
3. **Use one explicitly scoped agreement record, supported by verified content evidence.**
4. **Record moves, deletions, and resolutions as operations; do not infer them from filenames or absence.**
5. **Treat ES’s slot helpers as naming/allocation primitives that need hardening—not as transaction primitives.**
6. **Preserve bytes and recover interrupted applies in V1.** General snapshot browsing can remain V2.
7. **Preserve competing publications during cross-device races.** A pre-upload check alone cannot provide that guarantee.
8. **Replace every save-writing entry point together.** A safe menu detector behind an unsafe boot restore is not conflict resolution.

This is a revised proposal, not an implementation or hardware validation report. I used only the embedded sources and supplied reviews. The original Step 1 analysis files were not separately embedded; references to their arguments below concern the positions reproduced in the reviews.

**Citation convention:** `[Snn]` identifies the exact declared path and embed-time SHA-256 at position `nn` in the parallel arrays in `corpus.provenance.json` below. Those hashes were supplied by the Facilitator; I did not re-read or re-hash files.

---

## 1. What I concede, retain, and adopt

### Corrections to the position attributed to `gpt-analysis.md`

| Review | Revision |
|---|---|
| `claude_peer_review.md` and `kimi_peer_review.md`: the D-CLOUD-031 reopening and occurrence-identity machinery were too broad. | **Conceded.** Keep SHA-256 as version identity. Use ES move/delete receipts, pre-session content observations, and conservative unknowns before introducing another identity system. Below I name the specific schema additions and operational records actually needed. |
| `claude_peer_review.md` and `kimi_peer_review.md`: the selected-state core rewrite is conditional on `!racommands`. | **Conceded and corrected.** `setupSaveState()` can change the launched emulator/core, but that rewrite is dormant under today’s compiled default and becomes active when config-driven mode sets `racommands = false`. This is specifically a #10–#21 integration hazard. [S38, S39, S42] |
| `claude_peer_review.md`: the header declaring `makeStateFilename()`’s default argument was not embedded. | **Conceded.** I cannot establish the state call’s default `fullPath` argument from this corpus. The visible implementation does derive full paths from the source’s parent, and the image call explicitly requests that behavior. Therefore a staged `SaveState` object is not a proven live-repository copy primitive. Obtaining the header and testing both destinations is an acceptance requirement. [S38] |
| `claude_peer_review.md`: ordinary manifest/save mismatch does not require a general publication-generation system. | **Conceded for metadata consistency.** A mismatch means unknown evidence, not permission to overwrite. Add thumbnail binding and complete-unit membership; do not invent a general generation protocol merely to handle stale JSON. I separately retain a small publication/decision receipt for the cross-device race described in §4.7. That is a different requirement. |
| `mistral_peer_review.md`: compressed-byte identity was treated as more fragile than the evidence warrants. | **Accepted as a narrowing.** There is no demonstrated reason to replace stored-byte SHA-256. Re-serialization producing different compressed bytes creates a different stored version by definition. V1 does not need semantic savestate normalization. |
| `claude_peer_review.md`: the issue-export limitation was stated too categorically. | **Corrected.** These exports do not clearly distinguish current bodies from first comments. I cannot independently verify all claimed body edits. The register, design documents, and embedded implementation are the firmer basis for this proposal. |

### Findings I defend

**The auto-only allocator failure is real.** `gemini_peer_review.md` says I misread the empty-repository branch. The embedded function shows otherwise:

1. An auto state is stored with slot `-1`.
2. An auto-only state list is **not empty**, so the `states.size() == 0` return does not execute.
3. The search examines slots `99999` through `0`; it finds no `-1`.
4. The function returns `-99`.

Conversely, finding slot `99999` returns `100000`; the terminal `-99` is not an “all slots full” result. This is a source-level finding, independently supported by the other supplied reviews, but the source—not agreement among reviewers—is the evidence. [S37]

I also retain the findings that:

- `getNextFreeSlot()` does not refresh its repository.
- `copyToSlot()` ignores the results of the file operations and reports success after its initial checks.
- Capture placed inside the existing transfer gate would be skipped when offline, when the setting is off, or when another sync is running.
- The round-trip harness replaces `rclone.conf` before checking the selected remote and does not restore it. [S37, S38, S41, S29, S36]

### Contributions adopted

- From `claude_peer_review.md`, and its account of `claude-analysis.md`: **the boot-sync versus game-session race**, including transient `.auto.bak` and incremental-slot files; the reflash case that receives the same device’s previous manifest; and the need to price fetching several devices’ manifests.
- From `kimi_peer_review.md`: **resolution ping-pong**, an explicit payload/control/attachment path universe, option hygiene, kid/kiosk behavior, and deletion intent combined with bulk-deletion guards.
- From `mistral_peer_review.md`: the requirement that concurrency mitigation preserve competing bytes, rather than stop at “check again and log.”

I do **not** adopt two unsupported findings in `gemini_peer_review.md`. The embedded `cloud_sync_helper` neither reads `ASSUME_YES` nor calls `controller_confirm`; duplicate confirmation happens in the parent scripts. Nor does this corpus establish that the two remote-selection methods choose different remotes. Their equivalence deserves a test, but it is not an established defect in the single-remote model. [S29–S31, S33]

---

## 2. Decisions: retain the foundation, amend its contracts

A decided row remains binding until the maintainer records a new refinement. The council vote should authorize the following changes explicitly; it should not silently reinterpret the old rows.

### Required changes

| Priority | Decision or settled scope | Proposed new refinement |
|---|---|---|
| **Before #22** | #9/#22’s bisync dependency; IA detection section | **The manifest/content test is authoritative.** Bisync remains a required conformance experiment, not a required production engine. It may later accelerate discovery only if it satisfies the same non-mutating, fail-closed contract. There is no register ID in this corpus specifically deciding that dependency; amend the issue bodies and IA, rather than inventing one. |
| **Before #21/#22 integration** | **D-CLOUD-028** | Preserve the fast idle path and local no-network answer, but permit the correctness reads and verification required for changed saves. Time-window filtering is a scheduling hint, not change identity. Capture is independent of transfer eligibility. “One rclone spawn” cannot remain an unconditional constraint on a verified overwrite against a hashless backend. |
| **Before #21** | **D-CLOUD-031**, refining **D-CLOUD-017** | Retain one current manifest per device at the decided path. Add honest imported-origin observations, thumbnail content binding, and complete save-unit membership. Define conservative parsing and agreement scoping. Authorize the narrowly scoped publication/resolution receipts in §4.7; the current schema does not already provide their semantics. |
| **Before #24** | **D-CLOUD-030**, read with **D-CLOUD-017** | Clarify that automatic duplicate compaction concerns numbered states in the same game/core repository, with no game running, after verified copies and intended locations are established. It does not collapse an auto resume point into a numbered slot or treat equal bytes as proof of a move. The SHA-256 identity decision itself stays. |
| **Before enabling apply** | IA rev 4 and #25’s V2 boundary | Transaction preimages, interrupted-apply recovery, protected storage, and a minimal on-device recovery action are V1. General snapshot management remains V2. |
| **Before #23** | IA’s settled retention and cancellation behavior | Default **Keep discarded saves** on, with bounded completed-history retention. Keep unresolved/in-flight versions independently protected. Replace the cancellation promise with the precise sentence in §4.5. |

The last two are changes to settled design, even though they do not have their own register IDs. They should receive new register rows rather than being buried in comments. [S2–S6, S18, S23, S26]

### Decisions retained

- **D-CLOUD-029:** no `--update` stopgap; replace the shipped writers wholesale.
- **D-CLOUD-017:** core directories, build pin as data, game saves shared, legacy provenance unknown.
- **D-CLOUD-009:** reuse the existing device identity; do not casually regenerate it and strand backups.
- **D-CLOUD-026:** copy, verify content, then remove.
- **D-CLOUD-027:** persistent append-only text audit, with its decided rotation and support-only role.
- **D-CLOUD-024/025:** wizard in this drop; hardware compatibility work before deciding badge severity.
- Existing save shortcuts, stamps, and remembered transfer selections remain under **D-UI-017/018/020**. [S6]

### Why I retain D-CLOUD-029

Adding `--update` only to the exit upload does not protect the system end to end. If it skips an older local file because the cloud is newer, the next boot’s restore can overwrite that local file. The embedded boot script runs restore then backup as separate commands, without `&&`. [S35]

`claude_peer_review.md` proposes a useful operational precaution: disable automatic downloads while only uploading. That reduces cross-device overwrites of local saves, but **“lossless” is too strong**: it can still overwrite a cloud-only version, and later local play can replace the producing device’s copy.

For current private testing, use verified independent copies and isolated test storage, and optionally disable the existing automatic-sync toggles. That is a maintainer operating choice, not a reason to rewrite D-CLOUD-029 or claim a safe interim sync product.

---

## 3. What is load-bearing, and what can wait

### Load-bearing for this milestone

- Content evidence sufficient to distinguish equal-size changes.
- Offline-capable capture and an actual launched-core record.
- Correct save-unit boundaries and authentic thumbnail binding.
- Scoped agreement, explicit deletion intent, and resolution receipts.
- No live save mutation while its emulator session is active.
- Checked slot allocation and verified copies.
- Durable preservation before replacement, including overlapping device publications.
- Recoverable partial apply and durable, truthful result reporting.
- Complete replacement of every save-writing entry point.
- Upgrade behavior that reads old layouts without falsely attributing them.

### Refinements that can follow

- Bisync as an optimization.
- Locally computing backend-native hashes to reduce downloads.
- A large history browser, full-device snapshots, and arbitrary historical rollback.
- Launch-time auto-state resolution rather than the V1 sync-triggered wizard.
- Additional compatibility fingerprints beyond the source pin, once hardware identifies useful axes.
- More sophisticated thumbnail zoom and presentation refinements.

**Not proposed for V1:** semantic binary merging, progress heuristics selecting a winner, a shared database, vector clocks for the whole library, or another save-version identity.

---

## 4. The foundation I would build

## 4.1 Define the data universe before defining the detector

The allowlist is a transport boundary, not a list of independent conflict candidates. Today it admits manifests, PNGs, temporary state files, and whole emulator directories. Applying the schema’s per-path table indiscriminately would create phantom conflicts or unclassified writes. [S3, S32]

Use four classes:

| Class | Treatment |
|---|---|
| **Save units** | Conflict classification and decisions. A savestate unit is its stored state plus its bound thumbnail. A standalone save may be a file or a complete directory/member set. |
| **Control metadata** | Parse and validate separately. Each device publishes only its own current manifest; cached copies of other devices’ manifests must not be uploaded as authoritative replacements. |
| **Independent screenshots** | An explicit asset policy, not accidental treatment as SRAM or a state thumbnail. Colliding distinct screenshots can be retained or held without blocking unrelated save decisions. |
| **Known transient/private artifacts** | Excluded from normal payload handling. This includes ROCKNIX’s staging, journals, recovery stores, and the known transient `.state.auto.bak` path. Unknown files are not deleted merely because they look untidy. |

A PNG referenced by `screenshot` is not sufficiently bound to a version merely because the path is present. Add **`screenshot_sha256`**, and render no screenshot when the actual PNG fails that binding. Never borrow another state’s picture for an in-game save. [S2, S3, S21, S24]

For multi-file saves, a group label alone is insufficient. The observation must describe the **complete member set and member hashes**, so “every required member is present” can be verified. Shared VMUs or memory cards must permit a system/container identity and `rom: null`, rather than being falsely attributed to whichever game exited last.

PPSSPP’s per-game-ID directory and Dreamcast’s shared saves are the first cases to measure. Do not assume N64 EEPROM and controller-pak files are always one atomic game save. [S3, S9, S32]

### Origin is different from possession

A receiving device must be able to record:

> “I hold these bytes here; this is the origin information supplied with them.”

That is not claiming to have produced the bytes. Add an origin object preserved on import and re-slotting, including the known producing-device/build/capture information. Keep local observation or materialization time distinct from production time.

This fixes two concrete gaps:

- KEEP BOTH creates a new local location without inventing a new producer.
- Provenance does not vanish merely because the original producer later overwrites its own path entry.

For unknown legacy files, identity can be known while origin remains unknown. Contradictory provenance for the same bytes is rendered as ambiguous; `generated_at` does not break the tie. [S3, S4, S21, S25]

---

## 4.2 Agreement belongs to a particular conversation

Keep the local agreement record under `/storage/.cache/cloud_sync/`, outside normal sync and system backups. But scope it to at least:

- the remote/endpoint namespace;
- the resolved cloud root;
- the canonical local root and storage identity;
- the effective payload-policy version.

Changing a remote account behind the same name, changing roots, or presenting a different storage volume must not reuse an unrelated agreement. Credential refresh should not itself invent a new namespace; the implementation needs an explicit, tested distinction between authentication changes and destination changes.

**Unknown scope means no valid agreement.** Do not silently retain the old baseline because the JSON still parses.

An agreement entry means:

> These exact unit contents were verified equal at the two endpoints for this namespace.

It is not merely “rclone exited zero after an upload.” Equality verified without a transfer can also establish initial agreement. Failed, incomplete, skipped, or unresolved units do not advance it. Stamps remain user-facing run history; they are not agreement. [S3, S6, S29, S30, S33]

The config explicitly describes using different backup and restore paths. That makes `BACKUPPATH == RESTOREPATH` more than a speculative edge case. A warning followed by normal reconciliation is insufficient. [S33]

For V1:

- Automatic bidirectional reconciliation requires one validated live root.
- An intentionally different restore destination remains an **import/export destination**, not evidence that the live root agreed with the cloud.
- If that distinction cannot be honored safely, refuse that automatic operation with a native explanation. Do not silently rewrite the owner’s paths.

---

## 4.3 Capture independently of the network, and after the correct lifecycle boundary

The existing ES call is gated on the game-exit setting, the backup binary’s presence, and no ES sync already running. `cloud_backup` checks network availability before doing its work. Putting capture inside either gate would miss precisely the offline sessions that later create forks. [S29, S41]

### Capture sequence

1. **Before launch preparation**, retain the relevant pre-session hashes and provenance observations.
2. Record the **actual resolved emulator/core that will execute**, including a selected state’s override. Do not reconstruct it from configured defaults at exit.
3. Record ES-managed moves and deletions at those operations, under the local save lifecycle guard.
4. After emulator return and ES’s `onGameEnded()` cleanup, capture the final files and update the device’s local observations.
5. Only then enqueue eligible cloud work.

Capture should still happen when:

- automatic transfer is disabled;
- there is no network;
- another cloud transfer owns the cloud lock;
- the emulator returned a nonzero exit code but left a save.

If a hard power loss prevents capture, the next scan records unknown provenance rather than attributing an old file to the next game session.

### Why the cleanup ordering matters

In current `racommands` mode, a numbered-slot launch can:

- back up the previous auto state;
- copy the selected state into the auto path;
- make a provisional incremental-slot copy;
- delete an unchanged provisional copy at exit;
- remove the session’s auto file and restore the previous auto backup;
- renumber remaining slots.

All of that occurs before the existing cloud call. Therefore **“the auto state is written on every exit” is not an adequate description of the final sync payload**. Moreover, a new auto write is not itself a conflict if the other side has not changed since agreement. Its actual conflict frequency must be measured. [S37–S41]

A coherent page-cache read after process exit is not the alleged “filesystem cache has not flushed” race. The real questions are detached emulator processes, asynchronous helpers, and ES’s own lifecycle transformations.

### Cheap lineage, not another identity system

Use pre-session hashes plus explicit ES move/delete receipts to update path keys and `replaces`. Equal hashes alone establish equal bytes, not whether an occurrence was moved or copied.

If the available events cannot disambiguate a rename-and-edit sequence, leave lineage unknown. Do not manufacture a predecessor from whichever file previously occupied the destination slot. The rotating audit log cannot be the sole operational store for lineage needed to authorize future destructive work.

---

## 4.4 Use the manifest/content test as authority

The corpus does not establish that `bisync --conflict-resolve none` is a report-only operation. It also does not establish a stable, non-mutating plan/apply interface that accepts our external resolution and updates bisync’s agreement state afterward. The beta planning note’s newer-wins design is superseded intent, not evidence about a safe interface. [S2, S5, S16, S18, S23]

Run the bisync spike anyway. It is needed to settle the inherited dependency and to build regression fixtures. But the service’s correctness must not depend on undocumented output parsing or a second independent baseline.

### Content evidence

- Local SHA-256 is authoritative for the stored bytes.
- A remote native hash can identify a previously verified SHA-256 observation **within the same remote namespace**.
- Size and mtime can narrow work; they cannot establish equality on a backend that offers no usable content hash.
- On the hashless QA WebDAV, read and hash the relevant remote content before authorizing an overwrite.
- Once the service decides a transfer is required, force that explicit transfer past size-only comparison. Do not let rclone independently skip it for the same reason #53 skipped changed archives. [S3, S4, S9, S29]

`remote_hash` may remain null until observed. The manifest uploaded in a pass cannot contain evidence learned after that pass. Store post-transfer observations locally and publish them later if useful; do not require an extra upload merely to make the field non-null.

`claude_peer_review.md`’s local backend-hash computation is a worthwhile optimization experiment. It is not established by this corpus and still has process-start cost.

### Classification contract

Let `L`, `C`, and `A` describe complete verified unit contents, after accounting for known moves and operation receipts.

| Evidence | Action |
|---|---|
| `L == C` | Verify equality and establish/retain agreement. |
| Valid `A`; local unchanged; cloud is a verified one-sided advance | Download without asking. |
| Valid `A`; cloud unchanged; local is a verified one-sided advance | Upload without asking. |
| Both changed to different contents | Genuine fork; ask. |
| Both present and different, no valid agreement | Ask. **Never silently choose a direction.** |
| One side truly absent, the other a complete unit, no conflicting deletion intent | Add the missing copy. |
| Incomplete listing, ambiguous unit membership, or insufficient content evidence | Hold the affected work. This is not “no conflicts.” |
| Multiple competing published heads or incompatible resolution receipts | Ask; do not choose the newest receipt or canonical file. |

Malformed or newer-schema manifests mean unavailable metadata for the affected work, not an empty authoritative map. If the effect cannot be bounded to particular units, hold the wider reconciliation. Ordinary file bytes can still be staged for inspection; do not claim a complete save has been imported when its membership is unknown.

### Deletion is a separate operation

The present table’s absence rule cannot implement intentional deletion or convergent compaction. Conversely, interpreting absence as deletion would make a card swap or missing mount destructive. [S3, S5, S25]

V1 deletion requires:

- an explicit operation receipt identifying the exact unit/path and hash to retire;
- a matching namespace and valid storage root;
- a verified retained copy where required;
- an aggregate guard against unexpected deletion sets.

A deletion of version `X` may retire another unchanged copy of `X`. If the remote now holds `Y`, it is a delete/edit conflict, not permission to delete `Y`. Compaction has its own lossless receipt. Unexplained absence never creates either receipt.

Tombstones and resolution receipts must not expire merely because a handheld was offline for a month. Their safe retirement rule is a protocol question; the count selector for discarded **payloads** is not that rule.

---

## 4.5 Prepare, decide, apply, verify—with an honest cancellation boundary

Retain the system → game walkthrough, fixed cloud-left order, explicit side selection, optional review, and no per-conflict deferral. Retain the no-size/no-play-time decisions. [S2, S24]

Replace the IA’s cancellation promise with this exact sentence:

> **Before COMPLETE, no conflicting save or its dependent files are changed on either side. Quitting discards the pending decisions. Independently reconciled files from the completed pre-pass remain synced.**

That states what the existing pre-pass design actually permits.

### Operational phases

1. **Observe and stage.** Validate roots, inventory, metadata, and content evidence.
2. **Apply independent non-conflicts.** Independence is determined at save-unit and dependency level, not just filename level. A conflict’s PNG or dependent save member cannot move separately.
3. **Build a frozen plan.** Bind every choice to exact operand hashes, origin data, destination paths, and slot reservations.
4. **Walk the player through that plan.** Thumbnails are verified staged assets, not mutable live remote paths.
5. **At COMPLETE, reacquire the cloud lock and revalidate.** A changed operand or newly occupied destination invalidates the plan. Re-detect rather than applying an old choice to new bytes.
6. **Apply through a durable journal.**
7. **Verify resulting artifacts**, then update agreement, refresh ES’s repository, and report the actual outcome.

Do not hold a global cloud lock indefinitely while a person thinks through screenshots. Planning and apply each take it; immutable staged inputs and hash-bound plans make releasing it safe.

The pre-pass proves “free locally equals free in the observed cloud inventory” only at that observation. It is necessary for KEEP BOTH, but not sufficient without fresh validation and reservations.

---

## 4.6 Harden the merge boundary

The IA correctly chose ES’s conventions, but overstated the guarantees of the helpers. The following become named #24 acceptance criteria:

1. **Auto-only repository:** allocation returns the correct first numbered slot rather than `-99`.
2. **Fresh inventory:** newly downloaded cloud-only slots are visible before allocation.
3. **Batch reservations:** two KEEP BOTH choices cannot reserve the same destination.
4. **Destination correctness:** a staged source produces files in the selected live game/core repository, not beside itself in staging.
5. **Operation failure:** a failed state or PNG copy is a failed merge, regardless of `copyToSlot()`’s current return value.
6. **Content verification:** destination state and required thumbnail are re-read and checked.
7. **Retry idempotence:** retrying a partially applied KEEP BOTH does not create another duplicate or consume another slot.
8. **Unsupported context:** missing core/config/ROM or a non-RetroArch state never produces a pretend-success allocation. [S37–S39]

Use or harden ES’s allocator and filename generation. Do not duplicate its conventions in a shell script. Do not introduce a 99-slot product cap to work around an allocator defect.

For an auto-state KEEP BOTH, define the outcome explicitly: keep the device resume point at the auto path and materialize the cloud version into a numbered slot, with its thumbnail. That is a location policy, not a recency judgment. It requires the allocator fix and hardware validation.

Compaction runs only after verified application, while idle, within the same numbered-state repository. It preserves an appropriate bound thumbnail, records the removal, and does not let remote copies resurrect the compacted location indefinitely.

---

## 4.7 Preserve publications before canonical replacement

This is the remaining substantive disagreement with the request in `claude_peer_review.md` to defer all concurrency mechanism selection.

I agree that the first proposal was under-costed. I do **not** agree that another pre-upload read plus local journaling is sufficient.

Consider:

1. Both devices observed base `X`.
2. Device B publishes `B` and records agreement.
3. Device A, using its earlier observation, replaces the canonical cloud path with `A`.
4. B later sees local `B`, agreed `B`, cloud `A`.

The plain table calls that “cloud changed; download,” losing the fact that A never observed B. A local audit line does not repair that missing causal evidence.

### The minimum added protocol

Before replacing a canonical cloud save:

- Seal the outgoing unit’s bytes locally.
- Publish a **device-attributable, uniquely named, non-overwriting copy** in a protected area on the same remote.
- Associate it with a small receipt identifying the unit, its hashes, origin, and the agreement/base on which it was produced.
- Preserve any otherwise unprotected cloud preimage before replacing it.
- Verify the protected artifacts before treating the publication as durable.

The current per-device manifest remains the current catalog. This receipt is not another mutable shared manifest or a second version identity. Its operation identifier exists for idempotence and recovery.

The protected remote area must not be a destination of the legacy save mirror or content operations. Its placement must be derived and validated against the configured roots; this proposal does not assume every user has the default layout.

Readers consider competing published heads, not merely whichever bytes presently occupy the canonical filename. A publication based on `X` cannot automatically supersede a distinct publication also based on `X`.

### Resolution receipts prevent ping-pong

At COMPLETE, publish a decision bound to the exact operand hashes and resulting locations.

- A second device still holding the exact discarded version can honor the already-made decision.
- A new descendant of that version is not covered by the receipt and remains a conflict.
- Opposed concurrent decisions do not resolve by timestamp.
- A deliberate undo is a new explicit decision, not an unlabelled re-upload of an old loser.

This adopts the failure trace in `kimi_peer_review.md` without turning the audit log into a synchronization database.

### No fictional atomicity

There is no claim that rclone provides atomic rename or compare-and-swap across all 69 backends. Nor must payload and JSON become visible simultaneously: readers accept a published unit only when its descriptor and all required content verify. A partial publication is pending, not a valid winner.

The guarantee is:

> **Overlapping conforming ROCKNIX writers may leave multiple recoverable heads requiring reconciliation; they must not erase the only copy of a competing head.**

This is not linearizable global synchronization. It cannot protect an unseen third-party write made at the exact overwrite instant by a client that publishes no protected copy. That stronger guarantee requires backend-specific conditional writes or a different service, neither established here.

### Cost and rejection rule

This is not free. A changed unit can require a remote evidence read, a protected-publication batch, canonical transfer, and verification; hashless backends may require content downloads too.

Measure that cost before implementation. If it exceeds the acceptable exit budget:

- the exit path may upload protected candidates and leave reconciliation pending;
- it must not call that “fully synced”;
- it must never fall back to an unchecked canonical overwrite.

Idle exits still need no remote operation. Fetch manifests and transfer objects in batches, not one rclone process per file. Five approximately 20 KB manifests are small in bytes, but backend requests and process starts—not just bytes—must be measured. [S3, S6, S9]

Unresolved heads and active transaction copies are not evicted by the discarded-save count. Space exhaustion pauses destructive work rather than deleting the protection required to finish it.

---

## 4.8 Recovery is V1; the audit remains a log

A transaction journal must survive power loss and record, per unit:

- exact expected inputs and destinations;
- the selected operation;
- verified preimages and protected publications;
- prepared, applied, and verified stages;
- which agreement updates remain outstanding.

The journal is not rotated with `cloud_audit.log`. The audit records intent before destructive work and outcome afterward; an “intent” line is not falsely written as “resolved.”

Local temp-and-rename protects readers from torn JSON under the relevant filesystem semantics. It is not, by itself, a power-loss durability guarantee. File and directory durability, recovery ordering, and restart behavior require the interruption test.

On restart:

- incomplete work is resumed idempotently or restored to a verified usable state;
- affected games are not launched against a half-materialized save unit;
- completed independent units are reported accurately;
- an incomplete batch is not stamped as fully successful.

Default-on discarded-save retention is justified by the actual V1 choice: two SRAM panels can both have unknown origin and uncertain clocks, and neither screenshot nor support log can rescue an accidental choice. The count bounds completed history; an additional byte budget prevents large states or containers exhausting the card. Capacity checks must fail safely.

V1 needs a minimal native recovery action for those retained copies. General history browsing and arbitrary snapshot management remain #25’s later work. [S2, S3, S6, S10, S26]

---

## 4.9 Coordinate saves with game sessions—not only other syncs

Keep `take_cloud_lock` as the single transport serialization point. Add a local save-lifecycle gate shared by:

- launch preparation;
- the active emulator session;
- exit cleanup and capture;
- ES state deletion/renumbering;
- cloud materialization and compaction.

This is not a second cloud lock. It protects mutable local game data.

A background boot operation can inspect or upload sealed staging data while a game runs. It must not restore over live SRAM, renumber active states, or scan ES’s provisional copies as final saves. If it cannot obtain a safe materialization window, it records pending work.

Lock ownership and acquisition order must be specified before implementation so capture cannot deadlock behind a network worker. Capture must also not disappear just because transport is busy.

The cheap reproducer is particularly strong: start a numbered-slot game while the current delayed boot sync is running and inspect both the live saves and remote `.bak`/extra-slot artifacts. [S29, S32, S35, S38, S41]

---

## 4.10 Treat #10 as a launch-behavior migration

Creating `es_savestates.cfg` is not merely changing a directory template:

- compiled `Default()` enables `racommands`, autosave, and incremental behavior;
- file-driven configs set `racommands = false`;
- autosave and incremental default false unless set;
- config-driven enumeration replaces the compiled-default path;
- the selected-state emulator/core rewrite becomes active. [S39]

Therefore #10 must prove:

- old flat states remain discoverable without fabricated core provenance;
- new states are written into the decided per-core layout;
- RetroArch and ES agree on the directory;
- numbered-state loading, auto resume, new-game launch, and incremental saving still work;
- capture records the core actually executed;
- unavailable cores do not make imported states disappear without explanation.

I would use an explicit legacy-reader path whose provenance is unknown, rather than stamp flat files with the current configured default core. `defaultCoreDirectory` may help a transition, but it does not by itself establish provenance or preserve launch behavior.

Emit core pins from ROCKNIX’s actual LibreELEC/CoreELEC-derived build resolution, including package overrides—not from display strings or a guessed build-system stage. Map core names to effective packages and report unmapped cases as unknown. The source pin is useful compatibility evidence, not proof that ABI, patches, settings, BIOS, ROM content, or serialization behavior are identical. [S3, S8, S15, S19, S20, S42]

---

## 4.11 Give every caller the same policy and result channel

The new service must own save transfer from:

- boot;
- game exit;
- SYNC, UPLOAD, and DOWNLOAD rows;
- save-data selections in multi-tier backup/restore;
- Tools/script invocations;
- #37’s future SYNC tile;
- any future shutdown sync.

Existing command names may remain compatibility wrappers. They must not retain a direct path around reconciliation.

Do not inherit `RCLONEOPTS` or `BACKUPMETHOD` as reconciliation policy. The shipped config still contains `--delete-excluded`; both current transfer scripts strip it independently. A new consumer that forgets the strip can reintroduce deletion outside the payload. User rules also precede defaults, so a private-store exclusion appended to defaults is not an unconditional guard. [S29–S33]

Build safety exclusions and explicit transfer sets at the service boundary. Deliberate mirror requests remain separately guarded and archived; they cannot bypass unresolved conflicts.

### Typed outcomes, not overloaded raw exit codes

The embedded scripts can return rclone’s `3` or `4`, while `ThreadedCloudSync` interprets every `3` or `4` as the friendly lock/network skips. Both scripts also finish with the saves phase’s status, potentially hiding system-phase failure. These are source-visible reporting defects. [S29, S30, S40]

Use explicit outcomes such as:

- verified success;
- no local changes;
- skipped because transport is busy;
- unavailable network;
- conflicts pending;
- incomplete apply/recovery pending;
- verification failure.

Keep raw rclone status as diagnostic detail, not the product meaning.

Boot writes a persistent pending/result record that ES consumes on its UI thread. The wizard cannot be triggered solely by stdout from a detached boot shell redirected to `/dev/null`.

In kid/kiosk mode, preserve saves and expose a persistent “needs attention” state without forcing an inaccessible destructive configuration flow. Resolution can require unlocking the full UI; ordinary play must not silently discard either branch. [S12, S13, S35, S40]

---

## 5. Resolution plan for all eleven known unknowns

All experiments below are future work. “Before” names the product step they gate.

| # | Measurement and device | Before / acceptance |
|---|---|---|
| **1. Compatibility** | First RG35XX SP ↔ RG SP, same image and actual core, matching content/BIOS/settings. Verify distinct model and device identities. Then RK3326/RG351M and RK3566/RG353M directed pairs. Use at least two cores, and exercise continued execution and re-saving—not just one matching frame. Run core-version and corruption tests on disposable saves with SRAM protected. | **#23 badge semantics; D-CLOUD-025.** Record results per tested core/build/context, not “ARM states are compatible.” A corrupted-file test characterizes detection; it does not prove cross-build compatibility. [S8, S20] |
| **2. Bisync and agreement** | Exact device rclone 1.75.0: compressed state+PNG, equal-size SRAM mutation, preserved-mtime mutation, rename, deletion, genuine fork, first run, filter change, interrupted run, recover/resilient retry. VM against loopback WebDAV and MinIO; H700 against an isolated Dropbox prefix. Inspect payload hashes and workdir artifacts before/after. | **#22 implementation.** Question zero: what does `none` actually mutate? Reject any production role requiring automatic `--resync`, conflict renaming, ambiguous empty output, or an independent authoritative baseline. [S5, S16, S23] |
| **3. Auto states** | On the two H700s, record final on-disk results for new-game, auto-resume, and numbered-slot launches. Compare before preparation, after emulator exit, and after ES cleanup. Keep a small session census of genuine forks. | **Auto labeling and #24 semantics.** Do not query nonexistent `agreed.json` history or assume a conflict per session. Prove auto-only KEEP BOTH after the allocator fix. [S3, S37–S41] |
| **4. KEEP BOTH pre-pass** | On H700, cloud-only highest slots, several pending merges, auto-only states, missing PNG, stale repository, interruption during pre-pass, and a new cloud slot appearing during the walkthrough. | **#24/#23 apply.** No wizard on an incomplete required pre-pass; no duplicate reservation; stale plans refuse safely. |
| **5. Per-core layout** | On H700, rehearse a populated flat library through config-driven mode. Observe actual launch arguments and resulting files; test user config overrides and an absent-core directory. Repeat the relevant load paths on the second family. | **#10, then #21 integration.** Read both layouts; preserve launch behavior; do not silently assign a default core to unknown legacy states. [S19, S39] |
| **6. Build pins and launched core** | Verify emitted pins against effective build recipes for several normal and exceptional core/package names. On device, launch a state selecting a different supported core and inspect the captured context. Include standalone-emulator unknown handling. | **#21.** Capture the executed core, not only `getCore(true)` at exit. [S3, S15, S38, S42] |
| **7. Different roots** | In a fresh VM, intentionally separate backup and restore roots; change cloud root, relink destination, and substitute a different populated local root. | **#22 agreement writing.** No agreement crosses namespaces; no absence-driven deletion; alternate restore does not mark live saves agreed. [S33] |
| **8. Standalone/shared saves** | Before/after inventories around real PPSSPP and shared-memory-card sessions on an installed supported handheld, using RG353M where appropriate. Determine actual required member sets and shared ownership. Interrupt multi-member materialization. | **Schema additions/#21 adapters/#22 pre-pass.** No per-file chimera; no false game attribution. Test whether loading a state can also rewrite SRAM and therefore creates cross-unit dependencies. [S3, S9, S32] |
| **9. 480×320 usability** | Physical RG351M, real paired thumbnails and ambiguous glyph-only saves; controller selection and enlarged inspection where necessary. Capture VM frames at both 480×320 and 640×480 as regression aids. | **#23 layout acceptance.** The player can distinguish the intended side and recognize the state. Missing style-guide corpus must be supplied first. [S2, S12, S24] |
| **10. Two devices online** | Two H700s: pause A after observing the base, publish from B, resume A; repeat with opposed resolutions and power/network interruption. Separately overlap boot reconciliation with game launch. | **Any canonical writer in #22.** Both competing versions remain recoverable; no stale agreement silently converts the race into a one-sided advance. Measure publication-store and recovery costs. |
| **11. Round-trip suite** | Repair the harness, then run it on the now-available GENERIC_X64 image against WebDAV and MinIO. Add real compressed state+PNG fixtures, same-size save changes, metadata binding, all entry points, and two-device cases. | **#22 cutover.** Record behavior, not the existence of steps. The embedded suite has not established these guarantees. [S27, S36] |

The protocol’s older conclusion that clean cross-chipset tests might eliminate #10 is superseded: **D-CLOUD-017 now decides core separation**, not chipset separation. Clean chipset results would narrow compatibility warnings, not repeal core namespacing.

---

## 6. Newly surfaced failure modes and the cheapest exposing experiment

These are not claims that failures have been observed on hardware.

| Failure | Cheapest useful experiment |
|---|---|
| **Harness damages configuration before its safety assertion** | Fresh disposable VM: save byte copies of every config the suite touches, interrupt it immediately after endpoint setup, and compare afterward. Add pre-mutation refusal and exception cleanup. Never point the current harness at a configured handheld. [S36] |
| **Harness false-fails or false-passes against the wrong artifact** | Compare its undated archive expectation with the uploader’s dated output; create a real archive before testing tar integrity. Assert exact paths and bytes, not basename substrings. Its current archive namespace/restore expectations do not match the embedded uploader. [S29, S36] |
| **A successful pre-pass changes the evidence shown for a conflict** | Construct a state fork with differently bound PNGs and a related save member; run only preparation and compare every conflict-dependent hash. |
| **A resolved loser returns as an apparently ordinary cloud update** | Resolve on A, sync B holding the loser, attempt to upload it again, then sync A. Repeat with B modifying the loser first. Exact loser and new descendant must be distinguished. |
| **Cloned storage violates “one manifest writer per device ID”** | Clone a test card, observe both IDs, publish different states concurrently. Also reflash the same hardware and recover its old manifest. Do not “fix” the legitimate reflash case by blindly generating another identity. [S34] |
| **Reused basename associates a state with the wrong ROM** | Two content files with the same stem in different relevant locations/extensions, then discovery and capture. Verify the real game association, not only `rom` basename equality. [S3, S37, S39] |
| **Absent core produces a successfully downloaded but invisible state** | Compare the actual core sets on H700 and RK3326, then import under a missing core’s directory. Verify the UI reports retained-but-unavailable data rather than pretending it is a playable slot. |
| **User filters override recovery-store exclusions** | Put a broad include ahead of defaults and run helper migration. Enumerate the resulting transport set; assert private bytes remain outside ordinary saves/content operations. [S31, S32] |
| **Broken timestamp assumptions create a permanent dirty-file blind spot** | Save under an unset clock; renumber an old state; move the clock backward and forward. Dirty tracking must still find content/path changes without `--max-age` being authoritative. [S29, S38] |
| **“No default route” falsely means “no reachable remote”** | A LAN-only test network with a route to its configured remote but no default route. Verify quick availability handling does not suppress valid LAN sync. The current local route check is a heuristic, not proof. [S29] |
| **Backend case or Unicode behavior aliases two paths** | In an isolated remote prefix, upload case-only and normalization-variant names. Reconcile only if the namespace preserves the required distinctions or the collision is held explicitly. |
| **Successful state load later corrupts the battery save** | On disposable data, record SRAM before state load, continue play, allow autosave/exit, then compare and reload. A matching first screenshot is inadequate evidence for safe continuation. |
| **Raw rclone errors are displayed as harmless skips** | Induce rclone statuses corresponding to path/file errors through each wrapper and compare native outcome, stamp, and raw diagnostic. [S29, S30, S40] |
| **A text log outlives neither the bytes nor the transaction state it describes** | Kill after intent logging, after one local rename, after remote replacement, and before agreement update. Reboot and recover without treating a log line as proof of completion. |

---

## 7. Hardware gates, in order

There are two kinds of proof: **substrate/protocol experiments before production implementation**, and **the same adversarial tests against the completed implementation**. A manual rehearsal cannot certify code that does not exist yet.

### Gate 0 — make the test environment safe

Before any destructive handheld experiment:

- repair or replace the harness’s configuration handling;
- use fresh VM/test-card state and an isolated remote namespace;
- assert the target before changing credentials or paths;
- prove cleanup on failure;
- keep independent verified copies of any player data involved.

The current harness is an unconditional stop for use on a configured handheld. [S36]

### Gate 1 — observe the actual save lifecycle on H700

Run the same-chipset control, numbered/auto/new-game lifecycle observations, and boot-versus-play reproducer. Establish the actual producer, final payload, thumbnail relationship, and local serialization needs.

This prevents building capture around files ES later removes or restores.

### Gate 2 — establish the transport contract

Run rclone/bisync conformance and the full content-evidence cases across WebDAV, MinIO, and real Dropbox. Preserve raw output and before/after artifacts.

Authoritative rclone 1.75.0 documentation/source should be added to the corpus here. No prediction about bisync’s future development substitutes for this contract.

### Gate 3 — prove layout and save-unit boundaries

Rehearse #10’s behavioral transition and the standalone/shared-container cases. Verify the allocator’s failure cases in a small target-side test, then prove the repaired behavior before KEEP BOTH is enabled.

### Gate 4 — prove race preservation and crash recovery

On the two H700s, run deliberately interleaved publications and decisions. On both VM and handheld, interrupt every destructive stage.

If the protocol cannot retain all competing heads or recover a usable local unit, **do not enable canonical writes**.

### Gate 5 — price the system and prove the smallest UI

Measure on H700:

- idle, one changed SRAM, one changed state, and large-unit exits;
- one versus five manifests;
- cold and warm execution;
- rclone process count, backend request count, transferred bytes, CPU time, and player-visible duration;
- hashless and hash-capable behavior.

Then complete the RG351M visual/controller test and the remaining compatibility matrix before badge severity is finalized.

### Gate 6 — integrated release proof

Run the repaired suite and native press-through on:

- a fresh installation;
- an upgrade with real old layout/configuration;
- a same-device reflash with its own cloud manifest;
- all save-writing entry points;
- two upgraded devices;
- a deliberately mixed-version setup, to document and enforce the supported writer boundary.

D-QA-001 still gates publication. A successful VM run is not the handheld proof. [S6, S11]

---

## 8. Cutover and release boundary

Implement in this order:

1. Approve the targeted decision refinements and collect the missing sources.
2. Emit pins and implement local lifecycle capture, initially without changing shipped transfer policy.
3. Build read-only/shadow reconciliation and compare its verdicts against constructed operand tables and recorded sessions.
4. Harden slot operations and implement V1 preservation/recovery.
5. Complete the wizard and its persistent trigger/result channel.
6. Route **all** save entry points through the new service in one coordinated image/ES cutover.
7. Replay the hardware gates against the actual artifacts.

Preserve old data shapes, settings, menu cadence, stamps, and legitimate explicit operations. Do not preserve a direct unsafe writer merely for CLI compatibility.

There is an unavoidable boundary to state honestly: new code can read old saves safely, but it cannot prevent an old binary on another device from performing its old overwrite. The cutover must provide a safe participation state for the new service; simultaneous unreplaced writers are not made safe by release notes. Protected cloud publications should be outside the old canonical mirror’s reach, and mixed-version testing must show exactly what is and is not protected.

Finally, revise the changelog from observed behavior. Its current newest-wins description is a description of the old implementation, not a property to carry into the new one; its broader “never deletes” and success claims must not replace artifact verification. [S14]

**Bottom line:** the chosen identity, namespace, manifest location, and wizard are worth retaining. The unsafe foundation is the assumption that transport success, filename equality, a per-device lock, and ES helper reuse together constitute reconciliation. They do not. The foundation should instead be **verified content, explicit operations, protected competing versions, and recoverable application**.

---

## 9. Corpus gaps requiring orchestrator action

The following are referenced or needed but not available as independently embedded source files here:

- Authoritative rclone 1.75.0 bisync documentation/source and relevant upstream release/development material. The planning note cannot establish current or future semantics.
- `SaveState.h`, the complete launch-command construction, `GuiSaveState.cpp`, and `Paths.cpp`.
- RetroArch launcher/settings generation, actual `retroarch.cfg` and `es_systems.cfg`, and effective per-target core package lists/recipes.
- `docs/es-ui-style-guide.md`.
- Shipped `.defaults` files and implementations of `cloud_content_backup`, `cloud_content_restore`, `cloud_setup`, `backuptool`, and `tools/cloud-test-backend`.
- Unambiguously exported current issue bodies where acceptance criteria are said to have changed.
- Original Step 1 analysis files. The supplied peer reviews suffice to identify arguments to address, but not to claim those originals were independently read.

No paths or hashes for these missing sources are invented in the provenance arrays.

---

# `corpus.provenance.json`

```json
{
  "artifact": "gpt-revised-approach.md",
  "corpus_mode": "verbatim embedded sources supplied by the Council Facilitator",
  "facilitator": "council-facilitator@1.2.0",
  "verification_basis": "All source hashes below are the sha256 values declared verified at embed time by the Facilitator. They were not independently recomputed by this council member.",
  "facilitator_manifest_read_timestamp_utc": "2026-09-05T17:32:51Z",
  "member_filesystem_access": false,
  "member_rehashed_sources": false,
  "member_executed_hardware_or_tool_tests": false,
  "citation_index": "S1 through S42 correspond one-to-one to the 1-based positions in source_file_paths and source_file_hashes.",
  "source_file_paths": [
    "research/council-runs/2026-09-05-conflict-resolution-foundation/_sources/00-problem-statement.md",
    "research/council-runs/2026-09-05-conflict-resolution-foundation/_sources/repo/docs/conflict-wizard-ia.md",
    "research/council-runs/2026-09-05-conflict-resolution-foundation/_sources/repo/docs/save-manifest-schema.md",
    "research/council-runs/2026-09-05-conflict-resolution-foundation/_sources/repo/docs/save-manifest-alignment-review.md",
    "research/council-runs/2026-09-05-conflict-resolution-foundation/_sources/repo/plans/conflict-resolution/vita-style-conflict-resolution.md",
    "research/council-runs/2026-09-05-conflict-resolution-foundation/_sources/repo/docs/decision-register.md",
    "research/council-runs/2026-09-05-conflict-resolution-foundation/_sources/repo/docs/blindspot-register.md",
    "research/council-runs/2026-09-05-conflict-resolution-foundation/_sources/repo/docs/savestate-compat-test.md",
    "research/council-runs/2026-09-05-conflict-resolution-foundation/_sources/repo/.claude/rules/rclone-cloud-sync.md",
    "research/council-runs/2026-09-05-conflict-resolution-foundation/_sources/repo/.claude/rules/engineering-practices.md",
    "research/council-runs/2026-09-05-conflict-resolution-foundation/_sources/repo/.claude/rules/upgrade-and-install.md",
    "research/council-runs/2026-09-05-conflict-resolution-foundation/_sources/repo/.claude/rules/es-native-ui.md",
    "research/council-runs/2026-09-05-conflict-resolution-foundation/_sources/repo/docs/es-menu-map.md",
    "research/council-runs/2026-09-05-conflict-resolution-foundation/_sources/repo/docs/cloud-sync-changelog.md",
    "research/council-runs/2026-09-05-conflict-resolution-foundation/_sources/repo/CLAUDE.md",
    "research/council-runs/2026-09-05-conflict-resolution-foundation/_sources/rclone-bisync-planning.md",
    "research/council-runs/2026-09-05-conflict-resolution-foundation/_sources/issues/issue-11.md",
    "research/council-runs/2026-09-05-conflict-resolution-foundation/_sources/issues/issue-9.md",
    "research/council-runs/2026-09-05-conflict-resolution-foundation/_sources/issues/issue-10.md",
    "research/council-runs/2026-09-05-conflict-resolution-foundation/_sources/issues/issue-19.md",
    "research/council-runs/2026-09-05-conflict-resolution-foundation/_sources/issues/issue-20.md",
    "research/council-runs/2026-09-05-conflict-resolution-foundation/_sources/issues/issue-21.md",
    "research/council-runs/2026-09-05-conflict-resolution-foundation/_sources/issues/issue-22.md",
    "research/council-runs/2026-09-05-conflict-resolution-foundation/_sources/issues/issue-23.md",
    "research/council-runs/2026-09-05-conflict-resolution-foundation/_sources/issues/issue-24.md",
    "research/council-runs/2026-09-05-conflict-resolution-foundation/_sources/issues/issue-25.md",
    "research/council-runs/2026-09-05-conflict-resolution-foundation/_sources/issues/issue-35.md",
    "research/council-runs/2026-09-05-conflict-resolution-foundation/_sources/issues/issue-37.md",
    "research/council-runs/2026-09-05-conflict-resolution-foundation/_sources/repo/projects/ROCKNIX/packages/network/rclone/sources/cloud_backup",
    "research/council-runs/2026-09-05-conflict-resolution-foundation/_sources/repo/projects/ROCKNIX/packages/network/rclone/sources/cloud_restore",
    "research/council-runs/2026-09-05-conflict-resolution-foundation/_sources/repo/projects/ROCKNIX/packages/network/rclone/sources/cloud_sync_helper",
    "research/council-runs/2026-09-05-conflict-resolution-foundation/_sources/repo/projects/ROCKNIX/packages/network/rclone/sources/cloud_sync-rules.txt",
    "research/council-runs/2026-09-05-conflict-resolution-foundation/_sources/repo/projects/ROCKNIX/packages/network/rclone/sources/cloud_sync.conf",
    "research/council-runs/2026-09-05-conflict-resolution-foundation/_sources/repo/projects/ROCKNIX/packages/network/rclone/sources/cloud_device_id",
    "research/council-runs/2026-09-05-conflict-resolution-foundation/_sources/repo/projects/ROCKNIX/packages/network/rclone/autostart/102-cloud-saves",
    "research/council-runs/2026-09-05-conflict-resolution-foundation/_sources/repo/tools/cloud-round-trip",
    "research/council-runs/2026-09-05-conflict-resolution-foundation/_sources/es/SaveStateRepository.cpp",
    "research/council-runs/2026-09-05-conflict-resolution-foundation/_sources/es/SaveState.cpp",
    "research/council-runs/2026-09-05-conflict-resolution-foundation/_sources/es/SaveStateConfigFile.cpp",
    "research/council-runs/2026-09-05-conflict-resolution-foundation/_sources/es/ThreadedCloudSync.cpp",
    "research/council-runs/2026-09-05-conflict-resolution-foundation/_sources/es/FileData.cpp.launchGame-excerpt-l740-850.cpp",
    "research/council-runs/2026-09-05-conflict-resolution-foundation/_sources/es/FileData.cpp.getCore-excerpt-l1470-1560.cpp"
  ],
  "source_file_hashes": [
    "7e8c1076ee1735925af1d59dded61d23146c5c8e9fb2aae2be53d5afca26b6b7",
    "5738428852899047b9d49902b78e9c5e0d4457f67b09d079fdfeb89fdcfcc6c9",
    "2a794ea3d027402a26e3dfc62ea6184c204211c888c904413d1564ecf3f189ce",
    "56f6c54c013c5476f638a0dee5f2201e6a4ad021b47c674010bdc392665bfd48",
    "d22a49e73fe5d25cafea7646ec353e57a3da95f6ef84d4b86249c91bb170cf43",
    "0a4b1150d907f26cdd70d480830e195b9fa2885920abf48641506bb5a0f09640",
    "1514b33d61ab148d4e59bf446af03d973792a0673969df471b41c021edc9cbd8",
    "4d0b9d21ee5c9c26a25da5c169d9e99b83c18457732bd9471078c2d508b1d1bb",
    "7d43f252d029d54baa98ffa266b9334fa2f0f2da3db2507f451205f40dc73353",
    "e8ee62ea5af749ef09c0ede9da7abc5d7c192d890ae2e737cc369a5c5549c646",
    "d343c805b912141a1f8af7aa8d6025e2379e5335fb197c4cc59adf960fa43cbb",
    "cba905608c0104093b166c88393dba32159dca2b280d8a5229b6668930c8e4d2",
    "3ab8da275237ac1ccf3cab3bf2f019077d7fdef06d2e6afd180313ca80e00d8c",
    "6357ada783d5b09f22bd6fad2745b5c101e68fcdf2f85ffc698975be356cd594",
    "b19a3fd41d9728a0d5ee22aad6fd54c2f2d5199cd5835dbdc695d6e5062f8516",
    "acae778e1ee700e4a7c0120cb5e9be2fb5d2129aa04ef3e75590af2effca60eb",
    "4c6881068dd2be7eca3031e8d929b4d1a5f314eb6d08ba07a1d7cbd735bd207f",
    "cf3f971c8c6d95f0429d7f2937ecb130b1b40f2d12d7681441548230ca48a9c0",
    "4704211f8e92be217eb2f16cd363a6a7c3dacc381f5083b7536e9aa33b79ab0f",
    "b4f54c4e548f514f9429d5ea56dc9c3e246b95b0ae519a4b013891b1d69ffe39",
    "083c6c3504c578da7c283008d1305492f792a82c4b0a30d35007f9776ff6ad90",
    "c87315eb509d89d1ac2f8595c1fb47c9227836fadfbd13cf22122fce5f9806d3",
    "6d998503be831ad800a34bbfa952fc2aeb85ca5f5d959b6d10dad98d0fea6831",
    "016287a95f088a1cf137199a4c50321e0650684b78ecbe1849d995ae52afb6ee",
    "f87746eecfd56f78e477d227a25ddb7cfc2accc4626656c41ac14eeff8285ea0",
    "696bcdba14d33dfeea8e627a90094a2b1955745f32fc28677f54bb97f88099ba",
    "5787b6f79b1f7a9160c0540997d8b2fae1541201224c4bb8bf17b3cacf610210",
    "a43faf60f3fa4d2aa60345815484ff7c862bdba0061befa068e64b1994e0a907",
    "dfd1bf52dca78ab67a1b30b56e3c048d8910863a99ca02442525f58d083a2a57",
    "3a1bec8bb0ef5005f3dd92cdd766beb2c32ef26c5b5ea06fbd6cdb0bb0259de9",
    "8b22b9c82effe0a044ff765f73ecf24e26dd064abf694dc1f37304e2759b8823",
    "60db296dde26bebbf4fcf1b97101188799cedb2eb3260616204a2ee082ce19c3",
    "c9f4d94dc9745bce7bccf99145816e0e45305c8a5058acb6476a1fb56f96eb6c",
    "2b56d6f5fd4a86bfd40578bec43308204f62af513df9b3ed227cf971585f837b",
    "7c3e79bbe41bd70ec1c1f08d9defd04e38af891430616173609bf3e76c2159ee",
    "212e1c8531008b1d25f5f976797d9762c5cfa3061fe70229c546d276784efb49",
    "9931bfdceacc18344d7a6b9eeea0a27278dff46ae04a7f82e5c4efe7300ff51b",
    "848e0746fa26ef5c565af72962c487b0d4185f199f36f2290827bd086e303741",
    "4f38ea7dcfcbd71068122124c428d146b7da3c6dbdcc05a81afc99bbd93a9b15",
    "62f817868c3b803429e62efb7aa8f37aa995213386c6e4303e8e1f490a144ffc",
    "5b341d85de24badb2984fff979226f25f080831a1d194f607b6d6caa6085f233",
    "2410e4316d9c2c3bfb301c39dbe79590fb73682b18e70988527eeecc2a024fa6"
  ],
  "injected_review_filenames": [
    "claude_peer_review.md",
    "gemini_peer_review.md",
    "kimi_peer_review.md",
    "mistral_peer_review.md"
  ],
  "injected_review_hashes_provided": false,
  "review_provenance_note": "Reviews were supplied inline by filename without declared filesystem paths or hashes. They are credited as critique; technical conclusions are checked against the embedded source corpus or explicitly marked for experiment.",
  "missing_sources": [
    "Authoritative rclone 1.75.0 bisync documentation/source and relevant upstream release/development material",
    "SaveState.h and the complete ES launch-command construction",
    "GuiSaveState.cpp and Paths.cpp",
    "RetroArch launcher/settings generation and actual retroarch.cfg and es_systems.cfg",
    "Effective per-target core package lists and package recipes",
    "docs/es-ui-style-guide.md",
    "Shipped cloud-sync .defaults files",
    "cloud_content_backup, cloud_content_restore, cloud_setup, backuptool, and tools/cloud-test-backend implementations",
    "Unambiguously exported current issue bodies",
    "Original Step 1 analysis files"
  ],
  "missing_source_hashes": "Not supplied; no paths or hashes for missing sources have been fabricated."
}
```

=== END gpt-revised_plan.md ===

=== START kimi-revised_plan.md ===

# Step 3 — Revised foundation for cloud-save conflict resolution in ROCKNIX

**Author:** the member who wrote `kimi-analysis.md` in Step 1. This document stands alone: it is the foundation I would build, revised after the Step 2 critiques. It concedes what was refuted (with the reviewer named), defends what I still hold, adopts what others got right (credited by filename), separates the load-bearing from the optional, and states every decision change explicitly.

Sources are cited by repo-relative path; the full declared paths and the Facilitator-verified sha256 values are in `corpus.provenance.json` at the end. I did not re-read or re-hash any file; the embedded corpus is my read-at-time corpus.

---

## 1. What the critique changed, in one paragraph

The spine of my Step 1 survives: detection must be the manifest three-way test (sha256 identity vs. a locally held agreement record), not `rclone bisync`, because sha256 is the only comparison that works on a hashless backend and because bisync's own agreement state has no named writer after a manual wizard apply. Three reviews converged on that (`claude_peer_review.md` §6, `gemini_peer_review.md` §5, `gpt_peer_review.md` §3). Around that spine, the critique forced real corrections: my endorsement of ES's slot/copy primitives was refuted by verified code readings in `gpt-analysis.md` §1.8; my "size-plus-relist" verification shortcut was refuted by `gpt_peer_review.md` §3; my #10 "Option A" violated the project's own attribution rule; my claim that the manifest has no PNG entries was simply wrong (`gemini_peer_review.md` §3); my auto-state "storm" was asserted on a premise that `es/SaveState.cpp` partially falsifies; and my concurrency mitigation was too weak (`mistral_peer_review.md`). Each is owned and corrected below. I also adopt the two findings no analysis had: the mid-session transient-file hazard and the one-way interim posture (`claude_peer_review.md` §5), and the harness/transport/exit-code findings of `gpt_peer_review.md` §5.

---

## 2. The foundation (load-bearing — get these wrong and the milestone is unsafe)

### F1. Identity: unchanged

A save version is the sha256 of its stored bytes; slot and file name are attributes (D-CLOUD-030; `docs/save-manifest-schema.md` §1). **No reopening.** One strengthening observation, adopted from `claude_peer_review.md` §5 A: ES's `setupSaveState()` creates a transient byte-identical copy mid-session (slot N copied to `.state.auto`, and in incremental mode to `game.state<next>`; `es/SaveState.cpp`). If a sync overlaps a session, that copy can reach another device as a zombie slot — and D-CLOUD-030's compaction (same hash in two slots → remove the higher after re-verification, logged) already cleans it up by construction. The register row is not merely safe here; it is the designed remedy.

### F2. Manifest: shape stands; five amendments as one explicit refinement of D-CLOUD-031

The per-device JSON at `savestates/.rocknix/manifest-<device-id>.json`, union-read, keyed by path relative to the sync root, with the agreement record local and unsynced (D-CLOUD-031) — endorsed. My Step 1 claim that it needed no changes was wrong (concession to `gpt_peer_review.md` §3). Five amendments, proposed as one new register row citing D-CLOUD-031:

1. **`origin` sub-object** (adopted from `gpt-analysis.md` §1.9 via `claude_peer_review.md` §6). When a device materialises a version it did not produce — a downloaded winner, a KEEP BOTH re-slot, #37's copy-to-free-slot — its manifest entry records the *producer's* `device`, `core`, `core_build`, `captured_at` copied from the source entry, as `origin`. This is an honest observation, not a stamp: "nothing stamps a file it did not write" is preserved because the writer's own provenance fields stay distinct from `origin`. Without it, a merged copy's provenance dies at the first re-slot (the alignment review's "#24 — a merged copy is a new entry with `replaces = null`" is exactly the gap).
2. **`screenshot_sha256`** (adopted from `gpt_peer_review.md` §5.7 / `claude_peer_review.md` §6). The picker's premise is choosing by picture; a manifest can name the right state and a stale PNG. Record the PNG's hash at capture; the wizard renders no picture on mismatch rather than a wrong one.
3. **`group` key + `rom: null` for shared containers** (my §3.2, re-scoped per `claude_peer_review.md` §3 revision 4: the canonical cases are PPSSPP's per-game-ID directory and the Dreamcast shared VMU, which the corpus itself names in `cloud_sync-rules.txt` and D-CLOUD-028 — not the N64 pair, where the two files are largely independent). All paths sharing a `group` resolve as **one decision**; a conflict in any member conflicts the unit. The grouping table (which layouts form units) is #21's data, like the core→package map; unknown layouts stay ungrouped, and grouping errors must merge decisions rather than split them — a stitched multi-file save is the corruption case.
4. **Parse-failure rule**: an unparseable cloud manifest → that device's entries are `unknown`, retried next pass; our temp-and-rename writes plus regeneration every capture make it self-healing (adopted from `claude_peer_review.md` §6).
5. **Identity-collision rule** (my §3.15, converged by `gpt-analysis.md`): `cloud_device_id` honours the stored value, so a cloned card duplicates an identity and two devices would write one `manifest-<id>.json`. If a manifest's `device.model`/`family` changes incoherently between observations, the reader warns and treats its entries as `unknown`.

Plus a **transport rule** (not schema, recorded in the same row): `/savestates/.rocknix/**` is excluded from every tree transfer by an *unconditional command-line exclusion*, and manifests move only by explicit single-file copy — our own uploaded after the tree pass, foreign manifests fetched into `/storage/.cache/cloud_sync/manifests/` for reading. Adopted from `gpt_peer_review.md` §5.4: "each device writes only its own" must constrain transport, not just capture — otherwise the exit upload (no `--update`; `projects/ROCKNIX/packages/network/rclone/sources/cloud_backup`) republishes a stale cached foreign manifest over the producer's newer one. Command-line exclusions are the unconditional mechanism because rclone applies `--exclude` ahead of `--filter-from` (verified per `.claude/rules/rclone-cloud-sync.md`), while a defaults-file rule is not unconditional — user rules precede defaults (`cloud_sync_helper`).

**Tombstones are deliberately not added.** Deletions do not propagate in V1 (F8); a tombstone field is #25/V2's additive change.

### F3. Detection: the manifest test is the sole classifier; a staging mirror is its substrate; bisync is demoted

**The classifier** is the schema §3 three-way test (L local hash, C cloud hash, A agreed hash), with these specified rows:

| Situation | Verdict | Action |
|---|---|---|
| L = C | identical | nothing; **if A unknown, write agreement** ("observed-equal") — adopted from `gpt_peer_review.md` §5.3, closing the first-run false-conflict loop |
| L ≠ C, L = A | cloud changed | download, no prompt |
| L ≠ C, C = A | device changed | upload, no prompt |
| L ≠ C, both ≠ A | divergent | wizard |
| L ≠ C, A unknown | divergent (never agreed) | wizard — conservative; `unknown`-both included (alignment review §3.5) |
| one side only | one-way | transfer, no prompt |
| same hash, new path | move | re-key, no conflict (D-CLOUD-030) |
| absent one side, A says both had it | deletion-attempt | **resurrect, logged** (F8); mass-absence → fail closed |
| any member of a `group` divergent | group divergent | wizard, one decision for the unit |

**The substrate** — this is the revision's main new mechanism, synthesised from `gemini_peer_review.md`'s demand that I expand the SRAM/WebDAV case and `gpt_peer_review.md`'s verification requirements. Each sync pass mirrors the remote's saves tree into `/storage/.cache/cloud_sync/stage/` (`rclone copy`, allowlist-filtered, skipping unchanged by the backend's available metadata), then sha256-hashes staged and local files. Consequences:

- **C is learned by content on every backend**, including the QA WebDAV that offers neither hashes nor modtimes (alignment review §1, D-QA-002 row). This is the #53 lesson (`cloud_backup`'s own comment block) applied structurally instead of per-call-site.
- **Budget**: when nothing changed anywhere, the pass costs one remote listing and zero downloads. When something changed, only changed files move. The nothing-changed game-exit path keeps D-CLOUD-028's zero-remote-contact property (F5).
- The staged bytes are **also** the wizard's cloud-side screenshot source, the KEEP BOTH materialisation source, the discard-store source (F7), and the upload-certification input (F4) — one mechanism, four consumers.
- **Honest residual risk**: on a hashless backend the staging skip keys on size alone, so a same-size cloud-side change is invisible until the next size-changing event on that path. The priced alternative (download-and-hash the whole tree every pass) is rejected on budget; the risk is stated, not hidden (blindspot 22's rule: a listing that answers nothing is *unknown*, never "no conflict" — so any path whose decision matters gets download-and-hash confirmation).

**Bisync's role.** Demoted from detector to *candidate bulk-transfer engine*, pending the spike. This amends #22's plan of record and #9's dependency status (no register row made bisync the detector, so no row reversal is needed; the #22 body edit happens in the same action, per blindspot 27's rule). Two spike-independent arguments, which I defend: (a) after the wizard resolves a conflict by hand, nothing writes bisync's listing state back — the next run re-reports or demands `--resync`, and `--resync-mode` defaults to path1, a winner-picks-all pass (futro §4 step 2); (b) D-CLOUD-030 gives us sha256, and no bisync listing compares sha256 against a backend that has no hashes. **Epistemic status, conceded** (to `gpt_peer_review.md` §3): my Step 1 stated bisync's size-only blindness and its post-manual-apply behaviour as settled. They are inference from rclone's documented comparison fallback plus the QA backend's measured properties. The spike is the arbiter; my falsification criteria stand. The spike still runs — `claude_peer_review.md` §1 is right that declining it while asking to reopen a decided dependency is backwards — and its fixtures (both-sides change, rename, interrupted run, external equalization after a manual apply, filter change) double as the adversarial suite for the manifest detector.

**Scope exclusions**: screenshots ride the pre-pass under one-way rules with recency explicitly tolerated — no player progress lives in a screenshot; this is the one place recency is tolerated, stated as an exception, flagged for revisit (my screenshots/** finding stands). Conflicted-copy artifacts (Dropbox "(conflicted copy)", Syncthing `.sync-conflict-`) are never offered as versions and never transferred (alignment review §3.5); the engine's filter set excludes them explicitly, because the shipped saves allowlist currently *admits* a conflicted `.srm` (`gpt-analysis.md`, verified against `cloud_sync-rules.txt`).

### F4. Agreement: one writer, certified writes, scoped keys

- `agreed.json` is keyed by **(remote identity, sync root, path)** — my finding, endorsed by `claude_peer_review.md` §6 as a local-file change. The schema's example binds agreement to nothing; `CHANGE CLOUD FOLDER` is a shipped row (`docs/es-menu-map.md`), and a remembered hash from a different sync relationship authorises the wrong overwrite.
- **The transfer engine is the only writer**, and only after certification. Certification on hash-capable backends: `rclone lsjson --hash` matched against the upload, or a locally computed backend-native hash (hypothesis H2, experiment 4 — adopted from `claude_peer_review.md` §5 D; if it holds, the D-CLOUD-028/`remote_hash`/"no extra spawn" contradiction `gpt-analysis.md` found dissolves, because the value is known at capture, not observed after upload). Certification on hashless backends: re-download the just-uploaded paths into staging and sha256-compare — one extra round trip per upload batch, only where the backend forces it.
- **Concession**: my Step 1 "size-plus-relist" certification is withdrawn (`gpt_peer_review.md` §3). It is the #53 failure shape; a different 65,536-byte SRAM passes it.

### F5. Write paths: gated transfers; capture always; D-CLOUD-029 stands

#22 owns the write paths (futro §5). The new pass shape: stage-down → hash → manifest test → apply non-conflicts (**downloads before uploads**, preserving the boot pair's restore-before-backup property from the replaced-mechanism inventory) → write the same `last-backup`/`last-restore` stamps (D-UI-018 preserved) → record conflicts to a pending-conflicts state file. The exit pass keeps `--max-age`/`--no-traverse` for *candidate selection* but uses the manifest test for *admission*; nothing-local-changed stays zero-remote-contact; boot and menu passes are full passes, so a wrong-mtime file is compared by hash, never skipped by a window (my §3.6 wrong-clock finding, scoped per `claude_peer_review.md` §1: a sha256 detector never classifies by mtime). The #22 refusal ACs stand, exercised through boot, exit, and SYNC row.

**D-CLOUD-028 refinement (explicit)**: the changed-path exit pass may list the remote for paths it is about to touch and may download-and-hash to certify uploads on hashless backends. This is a correctness read, not a reachability probe; the nothing-changed case is untouched. Proposed as a new row citing D-CLOUD-028; `gpt_peer_review.md` §3 and `claude_peer_review.md` §2 both treat this reopening as load-bearing.

**D-CLOUD-029: no reopening — defended.** `gemini-analysis.md` and `mistral-analysis.md` argued for an immediate `--update` stopgap on the exit upload. `102-cloud-saves` refutes the safety premise: it runs `cloud_restore --yes --method=copy --update` *before* the backup at every boot, so a skipped exit upload is overwritten by the next boot's restore — the clobber moves, nothing is preserved (`gpt_peer_review.md` §2 traces both timestamp orderings). The maintainer's "same in kind; the flag changes which copy loses" is correct at the system level. What I adopt from `claude_peer_review.md` §5 B is the **lossless interim posture**: the maintainer (the only user until the wizard ships) may disable the boot pair and the SYNC row via the existing toggles, leaving only the exit upload — no device is ever overwritten, every divergence survives for the wizard's first run, and cross-device pickup stops, which is precisely the operation that is unsafe today. This is a configuration note, not a code change and not a register change.

**Capture (#21) runs regardless of network state** (adopted from `gpt-analysis.md` §1.5 via `claude_peer_review.md` §3 revision 5). Capture inside `cloud_backup` is skipped whenever the sync is skipped (exit 4, exit 3, setting off) — and offline play is exactly when conflicts are manufactured. Capture is local work (hash, manifest entry, provenance fields), serialised with the engine by a manifest-write mutex; it never touches the remote. Capture is **provenance, not detection**: a file written with capture off is still detected (the engine hashes everything) and shown `unknown` (schema §4) — honest degradation, no stamping. Capture records the *launched* core; while the compiled default keeps `racommands = true`, `setupSaveState()`'s core rewrite is dormant (`es/SaveState.cpp`, gated on `!racommands`), so `getCore(true)` at the exit point is accurate **for this milestone**; it becomes a hard dependency the moment #10 ships a config file (`claude_peer_review.md` §2's refinement of `gpt-analysis.md` §1.5).

**Manifest write discipline** (my churn finding, retained): never rewrite the manifest to bump `generated_at`; write only when entries change, or every exit pass defeats the `--recent` window and the round-trip's "nothing changed" step.

### F6. Merge: a checked adapter, not raw ES primitives

My Step 1 endorsed `getNextFreeSlot()`/`copyToSlot()` reuse "as correct and evidence-based." **That was wrong** — conceded to `gpt-analysis.md` §1.8 (and to `claude_peer_review.md` §3, which verified it). I read `SaveStateConfigFile.cpp` closely and `SaveStateRepository.cpp` loosely. The verified facts:

- `getNextFreeSlot()` returns **-99** for an auto-only repository: the `states.size() == 0 → firstslot` early return does not cover a repo whose only state is `.state.auto` (slot −1); the 99999→0 scan finds no slot ≥ 0 and falls through (`es/SaveStateRepository.cpp`). `gemini_peer_review.md` §2's counter-claim is refuted by the embedded code — the early return requires an *empty* vector, not a numbered-slot-free one. This is the commonest KEEP BOTH case (auto conflicts).
- `getNextFreeSlot()` does not refresh the repository; `copyToSlot()` ignores both copy/rename return values and returns `true` unconditionally (`es/SaveState.cpp`); `makeStateFilename(fullPath=true)` derives the destination from the *source's* parent, so a staged cloud file would be "merged" inside the staging dir; `refresh()` deletes the `SaveState*` objects a wizard might be holding (`gpt_peer_review.md` §5.8).

The merge contract is therefore: refresh → allocate (auto-only → `firstslot`; else highest+1; treat −99 as a visible refusal, never a silent fall-through) → **reserve pending allocations inside the plan** (my §1.6's shape, retained — repeated calls before COMPLETE must not hand out the same slot) → compute destinations from the config templates, not from object state → copy state+png → **sha256-verify the destination** → only then remove any source (D-CLOUD-026's copy-verify-delete shape) → audit line *before* any deletion. KEEP BOTH on an auto conflict: the winner keeps `.state.auto`; the loser is re-slotted to the allocated numbered slot with its PNG.

### F7. Presentation: IA rev 4 plus a rev 5 amendment set

The IA (`docs/conflict-wizard-ia.md` rev 4) stands: cloud always left, nothing transfers until COMPLETE, quitting discards decisions, pre-pass gate, done page naming discards, 480×320-first, KEEP BOTH savestates-only and dimmed-with-reason on in-game saves. Amendments (IA rev 5; the IA doc is the design of record for #23, not a register row):

1. **Keep discarded saves defaults to ON, bounded** — conceded to `gpt-analysis.md` and `claude_peer_review.md` §6: two SRAM panels can both read unknown/unknown with untrusted clocks, and console-first means a support-only log is not a recovery path. The store lives at `/storage/.cache/cloud_sync/discarded/<path>/<sha256>` — **outside the sync tree**, so no allowlist rule is needed at all and `gpt_peer_review.md` §5.5's user-rules-precedence hazard cannot apply. My §1.7's "priced download" of the cloud-side loser is now genuinely priced: it rides the staging mirror, zero extra round trips. Retention: last N discarded versions per path (default 3) with a global entry cap as backstop; the count selector remains the retention rule.
2. **`clock_synced: false` is rendered** on both panels (my §1.5.5; `mistral-analysis.md` converged).
3. **Multi-file units present as one conflict row** (F2c).
4. **Conflicts queue; they do not interrupt.** The exit sync never opens the wizard over a player who just finished a game; it records conflicts and the card says so. A `GAME SETTINGS > CLOUD SETTINGS` row ("N SAVE CONFLICTS TO RESOLVE") is the way in, and the menu-triggered SYNC's completion surface links to it. This amends rev 4's "a sync that reports conflicts opens the wizard" and structurally defuses the auto-conflict frequency problem whatever the census finds.
5. The headless handoff is a **state file + badge**, not an exit code (F11).

Rejected from `claude-analysis.md` (defended): renaming the CLOUD header to the producing device (residence and producer are two facts; the IA already shows both — `gpt_peer_review.md` §1 concurs); `session_seconds` (a settled product choice and unreliable progress evidence — `gpt_peer_review.md` §1 concurs). The launch-time resume tile is parked to #37's futro.

### F8. Deletion semantics: new register row

V1: **deletions never propagate.** Absence on one side where agreement says both had the file → one-way transfer (resurrect), logged. Mass absence (all entries, or an unreadable/empty sync root) → fail closed: no transfers, loud error — absence is not proof of intent (`gpt_peer_review.md` §1: interrupted layout change, unmounted storage, emulator temp rename, external client), and the changelog's "empty or unreachable cloud folders refuse to act" is the shipped precedent. Deliberate deletion propagation is V2, designed with #25's snapshots as the safety net; the schema adds a tombstone additively then. This closes the gap my Step 1 named (deletion absent from the IA scope table and schema §3) in the conservative direction the cardinal rule requires.

### F9. Concurrency: a degradation contract, strengthened

`mistral_peer_review.md` is right that my Step 1 mitigation (pre-upload check + audit) was insufficient. The contract is now four-part: **(1)** recheck the remote object immediately before any overwrite — the staging pass is recent by construction, and the wizard re-stages the conflicted paths at COMPLETE; a mismatch becomes a conflict, never an overwrite. **(2)** Never overwrite a remote object that differs from agreement without first holding its bytes (staging / discard store). **(3)** Audit every overwrite with before/after hashes. **(4)** State the residue honestly: one round trip between recheck and write, with no compare-and-swap on arbitrary backends, is an accepted risk under the one-player-never-concurrent model — and because of (2) and (3), even a lost race is recoverable. Under this contract my §3.13 trace ends differently at the first writer: A's recheck sees B's upload ≠ A's agreement → conflict, not overwrite. `gpt_peer_review.md` §3's demand — "the lock is advisory" must not become "progress is protected under concurrency" — is met by (4)'s honesty, not by a protocol I cannot price.

### F10. Audit: unchanged

D-CLOUD-027 stands (append-only text at `/storage/.cache/log/cloud_audit.log`, rotated, support-only). The audit line for any deletion precedes the deletion (existing AC). Rotation bounds lineage (`gpt_peer_review.md` §1) — acceptable: `replaces` is one step by design and the log was never promised as unbounded history.

### F11. Result protocol: normalise, and never signal conflicts by exit code

Adopted from `gpt-analysis.md` (verified): `cloud_backup`/`cloud_restore` pass rclone's own exit codes through `clean_exit`, and rclone's 3/4 (directory-not-found / file-not-found per `report_rclone_error`) collide with the scripts' reserved 3 (lock) / 4 (no network); `ThreadedCloudSync` renders any 3/4 as SKIPPED — and those paths *do* stamp a last-run, unlike genuine skips. Both scripts also exit with the save-phase status only, masking a system-phase failure. The new engine: a normalized result protocol; conflicts-pending is a state file plus a menu badge; per-phase failures propagate. The collisions are filed as shipped bugs.

### F12. Filters are constructed, never inherited

The engine builds its filter set unconditionally on the command line (exclusions: `.rocknix`, `*.bak` — the session-transient file from `claude_peer_review.md` §5 A — conflicted-copy patterns, `bios/**`, the backup folder; inclusion: the saves allowlist). Two shipped hazards make this load-bearing, both adopted from `gpt_peer_review.md` §5.5: user rules precede defaults in `cloud_sync_helper`, so a defaults line is not a boundary; and a customised nonempty `RCLONEOPTS` that omits `--filter-from` currently syncs with **no allowlist at all** (the fallback only fires on an empty array — `cloud_backup`). The round-trip gains both fixtures; the second is filed as a shipped hazard.

---

## 3. Refinements (valuable, not load-bearing)

- **R1.** `origin` (F2.1) is additive and cheap; V1's wizard can also read the producing device's manifest from the union directly. Required before #37's badge (`issues/issue-37.md`); merely correct before then.
- **R2.** Union-fetch caching: cache foreign manifests keyed by device-id + remote mtime; measure first — five devices × ~20 KB is small but unpriced (`claude_peer_review.md` §5 E).
- **R3.** The SQLite history index beside the text audit log: still #20's open call; V1 does not need it. Default no.
- **R4.** #10's per-core **directory** materialisation is deferred (see decision changes); "core as data" already carries the milestone via the schema.
- **R5.** #19's badge severity: unchanged — the bench decides (D-CLOUD-025), same-chipset control first (`issues/issue-19.md`).

---

## 4. Concessions (owned, named)

| # | My Step 1 claim | Refuted by | Correction |
|---|---|---|---|
| 1 | Reuse `getNextFreeSlot()`/`copyToSlot()` "as correct and evidence-based" | `gpt-analysis.md` §1.8; `claude_peer_review.md` §3 | Checked merge adapter (F6) |
| 2 | "Size-plus-relist" certifies uploads on hashless backends | `gpt_peer_review.md` §3 | Withdrawn; download-and-hash certification (F4) |
| 3 | "The manifest has no entries for PNGs" | `gemini_peer_review.md` §3 | Wrong — schema §6 `screenshot` exists; the real gap is no PNG *hash* → `screenshot_sha256` (F2.2) |
| 4 | #10 Option A: attribute flat states to the default core | `gpt_peer_review.md` §3; `claude_peer_review.md` §3 | Withdrawn — violates "nothing stamps a file it did not write"; `core: "unknown"` + explicit inference marker, never a guess as fact |
| 5 | Auto-state "storm" as a given | `claude_peer_review.md` §3 (citing `es/SaveState.cpp::onGameEnded`) | Hypothesis for the shadow census; frequency is launch-habit-dependent |
| 6 | Bisync's blindness/recovery stated as settled | `gpt_peer_review.md` §3 | Restated as hypotheses; the spike arbitrates; falsification criteria retained |
| 7 | "Nothing touches D-CLOUD-031" | `gpt_peer_review.md` §3 | Wrong; five amendments proposed explicitly (F2) |
| 8 | Concurrency mitigation: pre-upload check + audit | `mistral_peer_review.md` | Four-part contract (F9) |
| 9 | N64 `.eep`/`.mpk` as the canonical multi-file case | `claude_peer_review.md` §3 | PPSSPP per-game-ID and the shared VMU are the corpus's own cases (F2.3) |
| 10 | Shadow-mode census underdefined | `mistral_peer_review.md` | Defined in §8 step 8 |
| 11 | `BACKUPPATH ≠ RESTOREPATH` handled by a warning | `gpt_peer_review.md` §3 | Fail-closed (§6, unknown 7) |

**Checked and not adopted** (to show the adoptions were verified, not absorbed): `gemini_peer_review.md` §5.1's "duplicate-cleanup prompt is broken" is refuted by the embedded source — `controller_confirm` and `ASSUME_YES` both live in `cloud_backup`'s own `load_config`, and `cloud_sync_helper` never calls `controller_confirm`. Its §5.2 (`check_internet` vs `first_remote()` divergence) is unproven — both mechanisms sort the same file's section names; worth one two-remote check, not a finding.

## 5. Defences (held, with the argument made better)

1. **Manifest-primary detection** — my §1.1, now the council's consensus. The ordering is spike-independent: even a perfectly hashing bisync has no writer for its agreement state after a manual apply, and D-CLOUD-030's sha256 is the only backend-independent comparison.
2. **D-CLOUD-029 retained** — the `--update` reopen is refuted by `102-cloud-saves`' restore-then-backup ordering (F5). `claude_peer_review.md` §6 sides with retention.
3. **Wrong-clock stranding (§3.6)** — stands for the shipped paths; in the new engine the window selects candidates but never admits by mtime, and full passes hash everything (F5).
4. **Stale-agreement and first-writer traces (§3.13)** — stand; mitigations in F4/F9.
5. **Hardware-first sequencing** — retained and extended (§8); `mistral_peer_review.md` names it the strongest part of my Step 1.
6. **Manifest churn, headless handoff, discard-store scope, screenshots scope** — stand; incorporated into F5/F7/F11/F3.

---

## 6. Decision changes, stated explicitly

| Row | Change | Argument |
|---|---|---|
| **D-CLOUD-028** | **Refine** (new row citing it): the changed-path exit pass may list the remote and download-and-hash to certify; nothing-changed stays zero-contact | A correctness read is not a reachability probe; without it the exit pass cannot refuse a clobber (my §3.6; `gpt_peer_review.md` §3) |
| **D-CLOUD-031** | **Refine** (new row citing it): the five F2 amendments + the manifest transport rule | Origin-vs-possession gap; PNG binding; multi-file units; parse and identity-collision rules; foreign-manifest republication (`gpt_peer_review.md` §5.4) |
| **D-CLOUD-017** | **Implementation refinement** (new row citing it): "key on core, build as data" stands; the **directory materialisation is deferred** past the wizard | Shipping `es_savestates.cfg` hard-codes `racommands = false` and flips `autosave`/`incremental` defaults (`es/SaveStateConfigFile.cpp`) — a launch-behaviour migration nobody budgeted, not a config change (`gpt-analysis.md` §2.5, verified); it also activates `setupSaveState()`'s core rewrite, making launched-core capture a #10 dependency |
| **#9 / #22 plan of record** | **Amend** (body edits + new row): detection is manifest-diff primary; bisync is a candidate transfer engine pending the spike | §2 F3; no register row made bisync the detector, so none is reversed |
| **New row: deletion semantics** | **Add**: V1 never propagates deletions; resurrection logged; mass-absence fails closed | F8; absence ≠ intent |
| **New row: concurrency contract** | **Add**: recheck-before-overwrite; preserve-before-overwrite; audit; residual window documented | F9 |
| **D-CLOUD-029** | **No reopening.** The one-way interim posture is a maintainer configuration note | F5 |
| **D-CLOUD-030** | **No reopening.** Compaction additionally cleans the session-zombie pair (F1) | `claude_peer_review.md` §5 A |
| **D-CLOUD-025 / D-CLOUD-027** | **No reopening** | — |
| **IA doc** | **Rev 5** (not a register row): discard default on + `.cache` store; clock marker; group presentation; conflicts queue via badge | F7 |

---

## 7. The eleven known unknowns — resolution plans

| # | Plan |
|---|---|
| 1 (chipset axis; loud/silent) | #19 bench, unchanged; same-chipset control first; gates badge severity only (D-CLOUD-025) |
| 2 (bisync behaviour) | Spike reframed: transfer-engine candidacy + adversarial fixtures for the manifest detector; no longer gates the detection design |
| 3 (auto state commonest?) | Hypothesis; the shadow census (§8.8) measures fork frequency per kind; the wizard labels `kind: auto` as a resume point regardless |
| 4 (KEEP BOTH pre-pass gate) | AC stands; the staging mirror makes the gate mechanical — staging is idempotent, an interrupted pre-pass simply re-runs, and the wizard refuses to open until it completes |
| 5 (no `es_savestates.cfg`) | Resolved by deferral (§6): compiled defaults stay for this milestone; #10's directory move gets its own futro with a launch-behaviour rehearsal |
| 6 (core pin not on device) | #21 emits `/usr/share/rocknix/core-pins` at image build; capture is told, not discovering; launched-core capture is accurate while `racommands` stays compiled-true |
| 7 (`BACKUPPATH == RESTOREPATH`) | **Fail-closed**: the engine refuses (logs, no transfers) when they differ, until the two-root case is modelled |
| 8 (standalone multi-file layouts) | `group` key (F2.3); the grouping table covers PPSSPP, VMU, N64, PSX memcards before #23 opens conflicts for those systems; ungrouped multi-file conflicts present adjacent with a "part of a set" hint |
| 9 (480×320) | Layout at 480×320 first; real-thumbnail recognition test on the RG351M (§8.9) |
| 10 (two devices online) | F9 contract + audit; residual window documented |
| 11 (round-trip never run) | **Fix the harness first** (§8.0), then run (§8.7) |

## 8. What must be proven on hardware, in order

0. **Repair `tools/cloud-round-trip` before any run** (adopted from `gpt-analysis.md` §3.1 / `gpt_peer_review.md` §5.9): it overwrites `rclone.conf` *before* asserting the first remote — the docstring's guard is inverted — never restores it, cleans up partially, and carries two assertions that cannot pass against the embedded uploader. VM only, never a configured handheld.
1. **Session-zombie experiment** (`claude_peer_review.md` §5 A): startup sync on, boot, launch from a numbered slot within 30 s, let the boot sync finish, exit, list the remote for `.bak` and extra slot files. One H700, one boot. Validates the `*.bak` exclusion and the compaction remedy.
2. **ES primitive failure paths** (`gpt_peer_review.md` §5.1–5.2, §5.8): auto-only allocation → −99; `copyToSlot` against an unwritable destination → reported success vs. actual bytes; refresh invalidation. Gates the merge adapter's contract.
3. **bisync spike**: loopback WebDAV dry-run, then Dropbox from the device; output shape under `--conflict-resolve none`, loser renaming, `--recover`/`--resilient` after interruption, external equalization, filter-change behaviour.
4. **Local backend-hash experiment** (`claude_peer_review.md` §5 D): `rclone hashsum dropbox` a state on the device vs. `lsjson --hash` of its uploaded copy. Settles whether `remote_hash` can be known at capture.
5. **Core-set divergence** (`claude_peer_review.md` §5 C): diff `LIBRETRO_CORES` across targets in the tree (no device time); if they differ, plant a state under an absent core's directory and open the manager.
6. **#19 bench**: same-chipset control → cross-chipset pairs → loud/silent (truncation, byte-flip with compression off).
7. **Round-trip full run** on the GENERIC_X64 VM, WebDAV **and** MinIO, with the new steps: manifest transport, two-device both-sides-changed (neither copy overwritten), deletion-resurrection, wrong-clock, foreign-manifest republication, discard-store exclusion, no-allowlist `RCLONEOPTS`.
8. **Shadow-mode census** on the maintainer's devices: the detector runs log-only for a fixed window. A **verdict-table bug** is defined as a verdict whose action would have destroyed or stranded data (divergent misclassified as one-way; unknown misclassified as identical; a group split that would stitch). Outputs: fork rate per kind (tests H4), verdict distribution, unknown-rate. Gates enabling the wizard's apply step.
9. **480×320 recognition** with real thumbnails on the RG351M (`gpt_peer_review.md` §6).

Build order after the gates: capture (#21) → detector/staging (#22) → wizard (#23) → merge adapter (#24). #10's directory move and #25 follow with their own futros.

## 9. Unknown unknowns — failure, cheapest experiment

| Failure | Cheapest experiment |
|---|---|
| Mid-session transient files sync out and persist (`.bak`, zombie slot) | §8.1 |
| Foreign manifest republished over its producer's newer one | Harness step: plant a stale foreign manifest locally, run the exit pass, assert the remote's copy unchanged |
| A real rclone error renders as SKIPPED-lock / SKIPPED-no-network, stamped | Force exit 3/4 from rclone; watch card and stamp |
| Torn manifest download crashes or misleads the union read | Truncate a staged manifest; expect `unknown` + retry, not a crash |
| Cloned-card identity collision silently merges two devices' provenance | Copy the ID file to a second device/VM; run both; expect the F2.5 warning |
| A detached emulator writer outlives `process.run()` and capture hashes a half-written save (the legitimate residue of `gemini-analysis.md`'s otherwise-wrong flush-race — page-cache coherence is not the issue) | Shadow mode: hash at exit and again at sync; flag mismatches |
| Customised `RCLONEOPTS` without `--filter-from` syncs the whole tree | Harness fixture (§8.0) — also filed as a shipped bug |

## 10. Unmeasured hypotheses this approach rests on

- **H1.** bisync's behaviour under `none`/`--recover`/`--resilient`/interruption/filter-change/external-equalization — settled by §8.3.
- **H2.** `rclone hashsum <backend>` computes backend-native hashes locally on the device (general knowledge, not corpus) — §8.4.
- **H3.** Rename preserves mtime on the device's filesystem (ordinary semantics; confirm on target) — harness.
- **H4.** Auto-state fork frequency — §8.8.
- **H5.** Core sets differ per target — §8.5.
- **H6.** WebDAV size-only staging skip misses same-size cloud changes until the next size-changing event — residual risk, stated in F3; characterised in §8.3/§8.7.
- **H7.** Staging and union-fetch cost on the maintainer's real library — measured in shadow mode.
- **H8.** Detached-writer lifecycle for standalone emulators — §8.8's double-hash flag.

---

## `corpus.provenance.json`

```json
{
  "corpus_mode": "facilitator_embedded_read_at_time",
  "source_count": 42,
  "source_reference_order": "positionally aligned across both arrays",
  "hash_verification": "SHA-256 values verified at embed time by the Council Facilitator and copied from the per-source headers",
  "independently_reread_files": false,
  "independently_rehashed_files": false,
  "commands_or_hardware_tests_performed": false,
  "manifest_read_timestamp_utc_as_supplied": "2026-09-05T17:32:51Z",
  "author_step1_artifact": "kimi-analysis.md",
  "peer_reviews_consulted": [
    "claude_peer_review.md",
    "gemini_peer_review.md",
    "gpt_peer_review.md",
    "mistral_peer_review.md"
  ],
  "source_file_paths": [
    "research/council-runs/2026-09-05-conflict-resolution-foundation/_sources/00-problem-statement.md",
    "research/council-runs/2026-09-05-conflict-resolution-foundation/_sources/repo/docs/conflict-wizard-ia.md",
    "research/council-runs/2026-09-05-conflict-resolution-foundation/_sources/repo/docs/save-manifest-schema.md",
    "research/council-runs/2026-09-05-conflict-resolution-foundation/_sources/repo/docs/save-manifest-alignment-review.md",
    "research/council-runs/2026-09-05-conflict-resolution-foundation/_sources/repo/plans/conflict-resolution/vita-style-conflict-resolution.md",
    "research/council-runs/2026-09-05-conflict-resolution-foundation/_sources/repo/docs/decision-register.md",
    "research/council-runs/2026-09-05-conflict-resolution-foundation/_sources/repo/docs/blindspot-register.md",
    "research/council-runs/2026-09-05-conflict-resolution-foundation/_sources/repo/docs/savestate-compat-test.md",
    "research/council-runs/2026-09-05-conflict-resolution-foundation/_sources/repo/.claude/rules/rclone-cloud-sync.md",
    "research/council-runs/2026-09-05-conflict-resolution-foundation/_sources/repo/.claude/rules/engineering-practices.md",
    "research/council-runs/2026-09-05-conflict-resolution-foundation/_sources/repo/.claude/rules/upgrade-and-install.md",
    "research/council-runs/2026-09-05-conflict-resolution-foundation/_sources/repo/.claude/rules/es-native-ui.md",
    "research/council-runs/2026-09-05-conflict-resolution-foundation/_sources/repo/docs/es-menu-map.md",
    "research/council-runs/2026-09-05-conflict-resolution-foundation/_sources/repo/docs/cloud-sync-changelog.md",
    "research/council-runs/2026-09-05-conflict-resolution-foundation/_sources/repo/CLAUDE.md",
    "research/council-runs/2026-09-05-conflict-resolution-foundation/_sources/rclone-bisync-planning.md",
    "research/council-runs/2026-09-05-conflict-resolution-foundation/_sources/issues/issue-11.md",
    "research/council-runs/2026-09-05-conflict-resolution-foundation/_sources/issues/issue-9.md",
    "research/council-runs/2026-09-05-conflict-resolution-foundation/_sources/issues/issue-10.md",
    "research/council-runs/2026-09-05-conflict-resolution-foundation/_sources/issues/issue-19.md",
    "research/council-runs/2026-09-05-conflict-resolution-foundation/_sources/issues/issue-20.md",
    "research/council-runs/2026-09-05-conflict-resolution-foundation/_sources/issues/issue-21.md",
    "research/council-runs/2026-09-05-conflict-resolution-foundation/_sources/issues/issue-22.md",
    "research/council-runs/2026-09-05-conflict-resolution-foundation/_sources/issues/issue-23.md",
    "research/council-runs/2026-09-05-conflict-resolution-foundation/_sources/issues/issue-24.md",
    "research/council-runs/2026-09-05-conflict-resolution-foundation/_sources/issues/issue-25.md",
    "research/council-runs/2026-09-05-conflict-resolution-foundation/_sources/issues/issue-35.md",
    "research/council-runs/2026-09-05-conflict-resolution-foundation/_sources/issues/issue-37.md",
    "research/council-runs/2026-09-05-conflict-resolution-foundation/_sources/repo/projects/ROCKNIX/packages/network/rclone/sources/cloud_backup",
    "research/council-runs/2026-09-05-conflict-resolution-foundation/_sources/repo/projects/ROCKNIX/packages/network/rclone/sources/cloud_restore",
    "research/council-runs/2026-09-05-conflict-resolution-foundation/_sources/repo/projects/ROCKNIX/packages/network/rclone/sources/cloud_sync_helper",
    "research/council-runs/2026-09-05-conflict-resolution-foundation/_sources/repo/projects/ROCKNIX/packages/network/rclone/sources/cloud_sync-rules.txt",
    "research/council-runs/2026-09-05-conflict-resolution-foundation/_sources/repo/projects/ROCKNIX/packages/network/rclone/sources/cloud_sync.conf",
    "research/council-runs/2026-09-05-conflict-resolution-foundation/_sources/repo/projects/ROCKNIX/packages/network/rclone/sources/cloud_device_id",
    "research/council-runs/2026-09-05-conflict-resolution-foundation/_sources/repo/projects/ROCKNIX/packages/network/rclone/autostart/102-cloud-saves",
    "research/council-runs/2026-09-05-conflict-resolution-foundation/_sources/repo/tools/cloud-round-trip",
    "research/council-runs/2026-09-05-conflict-resolution-foundation/_sources/es/SaveStateRepository.cpp",
    "research/council-runs/2026-09-05-conflict-resolution-foundation/_sources/es/SaveState.cpp",
    "research/council-runs/2026-09-05-conflict-resolution-foundation/_sources/es/SaveStateConfigFile.cpp",
    "research/council-runs/2026-09-05-conflict-resolution-foundation/_sources/es/ThreadedCloudSync.cpp",
    "research/council-runs/2026-09-05-conflict-resolution-foundation/_sources/es/FileData.cpp.launchGame-excerpt-l740-850.cpp",
    "research/council-runs/2026-09-05-conflict-resolution-foundation/_sources/es/FileData.cpp.getCore-excerpt-l1470-1560.cpp"
  ],
  "source_file_hashes": [
    "7e8c1076ee1735925af1d59dded61d23146c5c8e9fb2aae2be53d5afca26b6b7",
    "5738428852899047b9d49902b78e9c5e0d4457f67b09d079fdfeb89fdcfcc6c9",
    "2a794ea3d027402a26e3dfc62ea6184c204211c888c904413d1564ecf3f189ce",
    "56f6c54c013c5476f638a0dee5f2201e6a4ad021b47c674010bdc392665bfd48",
    "d22a49e73fe5d25cafea7646ec353e57a3da95f6ef84d4b86249c91bb170cf43",
    "0a4b1150d907f26cdd70d480830e195b9fa2885920abf48641506bb5a0f09640",
    "1514b33d61ab148d4e59bf446af03d973792a0673969df471b41c021edc9cbd8",
    "4d0b9d21ee5c9c26a25da5c169d9e99b83c18457732bd9471078c2d508b1d1bb",
    "7d43f252d029d54baa98ffa266b9334fa2f0f2da3db2507f451205f40dc73353",
    "e8ee62ea5af749ef09c0ede9da7abc5d7c192d890ae2e737cc369a5c5549c646",
    "d343c805b912141a1f8af7aa8d6025e2379e5335fb197c4cc59adf960fa43cbb",
    "cba905608c0104093b166c88393dba32159dca2b280d8a5229b6668930c8e4d2",
    "3ab8da275237ac1ccf3cab3bf2f019077d7fdef06d2e6afd180313ca80e00d8c",
    "6357ada783d5b09f22bd6fad2745b5c101e68fcdf2f85ffc698975be356cd594",
    "b19a3fd41d9728a0d5ee22aad6fd54c2f2d5199cd5835dbdc695d6e5062f8516",
    "acae778e1ee700e4a7c0120cb5e9be2fb5d2129aa04ef3e75590af2effca60eb",
    "4c6881068dd2be7eca3031e8d929b4d1a5f314eb6d08ba07a1d7cbd735bd207f",
    "cf3f971c8c6d95f0429d7f2937ecb130b1b40f2d12d7681441548230ca48a9c0",
    "4704211f8e92be217eb2f16cd363a6a7c3dacc381f5083b7536e9aa33b79ab0f",
    "b4f54c4e548f514f9429d5ea56dc9c3e246b95b0ae519a4b013891b1d69ffe39",
    "083c6c3504c578da7c283008d1305492f792a82c4b0a30d35007f9776ff6ad90",
    "c87315eb509d89d1ac2f8595c1fb47c9227836fadfbd13cf22122fce5f9806d3",
    "6d998503be831ad800a34bbfa952fc2aeb85ca5f5d959b6d10dad98d0fea6831",
    "016287a95f088a1cf137199a4c50321e0650684b78ecbe1849d995ae52afb6ee",
    "f87746eecfd56f78e477d227a25ddb7cfc2accc4626656c41ac14eeff8285ea0",
    "696bcdba14d33dfeea8e627a90094a2b1955745f32fc28677f54bb97f88099ba",
    "5787b6f79b1f7a9160c0540997d8b2fae1541201224c4bb8bf17b3cacf610210",
    "a43faf60f3fa4d2aa60345815484ff7c862bdba0061befa068e64b1994e0a907",
    "dfd1bf52dca78ab67a1b30b56e3c048d8910863a99ca02442525f58d083a2a57",
    "3a1bec8bb0ef5005f3dd92cdd766beb2c32ef26c5b5ea06fbd6cdb0bb0259de9",
    "8b22b9c82effe0a044ff765f73ecf24e26dd064abf694dc1f37304e2759b8823",
    "60db296dde26bebbf4fcf1b97101188799cedb2eb3260616204a2ee082ce19c3",
    "c9f4d94dc9745bce7bccf99145816e0e45305c8a5058acb6476a1fb56f96eb6c",
    "2b56d6f5fd4a86bfd40578bec43308204f62af513df9b3ed227cf971585f837b",
    "7c3e79bbe41bd70ec1c1f08d9defd04e38af891430616173609bf3e76c2159ee",
    "212e1c8531008b1d25f5f976797d9762c5cfa3061fe70229c546d276784efb49",
    "9931bfdceacc18344d7a6b9eeea0a27278dff46ae04a7f82e5c4efe7300ff51b",
    "848e0746fa26ef5c565af72962c487b0d4185f199f36f2290827bd086e303741",
    "4f38ea7dcfcbd71068122124c428d146b7da3c6dbdcc05a81afc99bbd93a9b15",
    "62f817868c3b803429e62efb7aa8f37aa995213386c6e4303e8e1f490a144ffc",
    "5b341d85de24badb2984fff979226f25f080831a1d194f607b6d6caa6085f233",
    "2410e4316d9c2c3bfb301c39dbe79590fb73682b18e70988527eeecc2a024fa6"
  ],
  "missing_material": [
    {
      "description": "Upstream rclone 1.75.0 bisync implementation and version-specific documentation; several bisync behaviour claims remain hypotheses until the spike",
      "declared_source_path": null,
      "sha256": null
    },
    {
      "description": "Utils::FileSystem implementations and ES headers needed to establish copy/rename/lifetime guarantees beyond the embedded excerpts",
      "declared_source_path": null,
      "sha256": null
    },
    {
      "description": "Full launcher/process implementation and RetroArch's directory-setting path (setsettings.sh and runtime configuration)",
      "declared_source_path": null,
      "sha256": null
    },
    {
      "description": "Executed round-trip, bisync-spike, and savestate-compatibility results",
      "declared_source_path": null,
      "sha256": null
    },
    {
      "description": "Current issue bodies and edited acceptance-criteria lists as distinct artifacts; the embedded issue snapshots are comment-thread exports in which the body cannot be distinguished from the first comment with certainty",
      "declared_source_path": null,
      "sha256": null
    }
  ]
}
```

=== END kimi-revised_plan.md ===

=== START mistral-revised_plan.md ===

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

=== END mistral-revised_plan.md ===
