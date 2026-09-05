# Step 2 — Peer review

**Scope:** This reviews the four injected proposals, not the merits of the council process, and does not cast a vote. I used only the embedded corpus; I did not execute commands, inspect devices, or independently re-read or hash files.

Citations such as **[S38]** refer to the declared source path and Facilitator-verified SHA-256 recorded in the inline `corpus.provenance.json` below.

## Main findings

Several proposals identify real architectural gaps: agreement-state ownership, deletion semantics, remote changes during resolution, capture provenance, and the distinction between pre-COMPLETE cancellation and interrupted application.

However, the following recommendations must **not** pass into Step 3 unchanged:

- **`mistral-analysis.md`:** Treating unequal copies with no agreement as a one-way transfer would introduce silent data loss.
- **`gemini-analysis.md`:** Falling back to legacy copy when the conflict engine refuses a configuration would bypass the safety guard.
- **`kimi-analysis.md`:** “Size-plus-relist” cannot verify an uploaded save on a hashless backend.
- **`claude-analysis.md`:** Replacing an unavailable cloud hash with size and mtime cannot preserve a content-based conflict guarantee.
- **`gemini-analysis.md` and `mistral-analysis.md`:** Adding `--update` does not generally turn conflicting uploads into safe skips.
- **All four:** ES’s existing slot and copy helpers do not provide all the guarantees attributed to them. There are directly checkable failure cases in the embedded implementations.

The case for evaluating an application-owned reconciler is substantial. The case that bisync is *necessarily* unrecoverable, always blind to the relevant changes, or incapable of recognizing externally equalized files is **not established by this corpus**. Retain the comparative spike and its artifact-level assertions.

---

## 1. Review of `claude-analysis.md`

### Strongest argument: introducing `es_savestates.cfg` changes behavior, not merely paths

This is the most valuable source-grounded finding in `claude-analysis.md`.

The embedded code establishes that:

- `SaveStateConfig::Default()` enables `racommands`, `incremental`, and `autosave`.
- Configurations loaded from XML set `racommands = false`; autosave and incremental behavior must be explicitly enabled.
- `SaveState::setupSaveState()` has materially different launch and file-handling paths depending on `racommands`.
- `setupSaveState()` can rewrite the emulator/core arguments, so the configured default returned by `getCore(true)` is not necessarily the core actually launched. [S38, S39, S42]

This supports a concrete revision to #10/#21: **prove launch, autosave, incremental saving, and attribution under the new configuration—not just directory discovery.** Calling #10 a “config-only change” is not an established safety claim.

The remote/root binding of `agreed.json` is another strong argument. The schema’s example has no binding to a remote account, cloud folder, or local storage instance, although changing the cloud folder is a supported operation. A remembered hash from a different synchronization relationship can authorize the wrong overwrite. [S03 §7, S13, S33]

### Weakest argument: the proposed replacement relaxes content verification to meet its budget

The replacement detector is described as safer because SHA-256 is authoritative, but parts of its proposed fast path undermine that premise:

1. **Hashing only when size or mtime changes misses same-size, same-mtime edits.**  
   That optimization needs a reliable dirty-file mechanism or a stated conservative fallback. A size/mtime tuple cannot prove byte equality. The project has already encountered the corresponding remote-side failure. [S03 §6, S10, S29]

2. **A pre-upload remote hash describes the old cloud version.**  
   It must not become the `remote_hash` associated with the newly uploaded SHA-256. Computing the expected backend hash locally can help comparison, but does not establish that the upload actually stored those bytes.

3. **The proposed fallback to size and mtime is unsafe as confirmation.**  
   In particular, §4’s suggestion to drop `remote_hash` “in favour of (size, mtime)” must explicitly preserve download-and-hash or another proven content-verification mechanism. On the QA WebDAV backend, even modtime is unavailable as a useful comparison property. [S04 §1]

4. **The two-spawn gated push does amend D-CLOUD-028.**  
   A zero-spawn no-change path is attractive, but a changed-file path that lists, uploads, and possibly verifies has a different command and network budget. `kimi-analysis.md` correctly treats this as a decision requiring explicit refinement rather than claiming the existing contract is unchanged. [S06 D-CLOUD-028]

### Claims that hold, with qualifications

- **The boot sync can overlap gameplay:** supported. The autostart script backgrounds its work; the cloud lock serializes cloud scripts, not emulator writes. The launch excerpt contains no shared exclusion with that boot job. The actual lost-SRAM outcome still needs the proposed experiment. [S35, S41]
- **Renumbering needs more than an mtime window:** sound. ES uses rename operations. Preservation of mtime is ordinary filesystem behavior, but should still be confirmed on the target layout as proposed. [S38]
- **Manifest union cannot mean last-map-wins by path:** correct. Several devices can describe different versions at the same path. Readers need version-qualified candidate records, not an arbitrary map overwrite. [S03 §§2, 5]
- **Audit rotation limits historical lineage:** correct. D-CLOUD-027 retains only one predecessor after rotation; it cannot support an unbounded history claim. [S06 D-CLOUD-027]

### Claims requiring correction

**Bisync assertions remain hypotheses.**  
The analysis labels much of its rclone knowledge `[K]`, which is appropriate. Its verdict nevertheless relies on those hypotheses as if already resolved. In particular:

- Rewriting a filter file is not necessarily changing its effective contents.
- Whether comments affect bisync’s filter-change check is an experiment, not an established outcome.
- Whether a scoped listing traverses only selected parent directories must be measured.
- Native-hash computation and verification requirements vary by backend and configuration.

The proposal should say: **“Prefer this replacement if the spike confirms these constraints,”** or supply the missing version-specific evidence. Neither the upstream bisync implementation nor its 1.75.0 documentation is embedded. [S16, S23]

**`onGameEnded()` does not renumber on every savestate-manager exit.**  
There is an early return when `racommands` is true and `slot < 0`. The launch path also calls `onGameEnded()` only when `options.saveStateInfo` is present. The additional renumbering path is real, but the analysis overgeneralizes it. [S38, S41]

**Pretty-printed JSON is not generally broken by newline removal.**  
Blindspot 3 concerns line-oriented output whose record separators matter. Removing formatting newlines from a valid single JSON document normally preserves it. Reading a result file remains a good interface choice, but “pretty JSON becomes a mashed string” is not the right technical justification. [S07]

**`copyToSlot()` is not categorically unusable for a cloud version.**  
It operates on a local source and constructs destinations relative to that source’s parent. A cloud version therefore needs deliberate materialization and destination handling. That is a constraint, not proof the helper cannot participate. More importantly, its unchecked return behavior is a shared missed failure discussed below. [S38]

**Absence plus an agreement record does not prove explicit deletion.**  
The proposed deletion rows need more than a mass-delete threshold. A single missing file can result from an interrupted layout change, an unavailable mount, an emulator’s temporary rename, or an external client. Explicit deletion events or suitably qualified tombstones are stronger evidence than absence alone. D-CLOUD-030’s duplicate-compaction decision does not automatically authorize general deletion propagation. [S03, S06 D-CLOUD-030, S11]

### Presentation revisions

Replacing the **CLOUD** header with the producing device’s name confuses two distinct facts:

- where the candidate currently resides;
- which device produced it.

The IA deliberately fixes cloud on the left and already includes device/model in the metadata. Keep both facts visible. A downloaded version can have the same producer on both sides. [S02]

The launch-time resume proposal is useful to explore, but selecting a tile is **not automatically a complete cloud resolution**. It must specify:

- which version remains at `.state.auto`;
- how the other version is preserved;
- how the choice interacts with SRAM;
- what happens if the subsequent game session crashes or never uploads;
- how agreement advances.

Similarly, `session_seconds` reopens a settled product choice. It is not reliable progress evidence, and deriving it from a numbered state’s mtime is unsafe after downloads, moves, or clock changes. Treat it as an optional research question, not a prerequisite for a safe picker. [S22, S24]

### Concrete Step 3 revisions

1. Separate the replacement’s **verified protocol** from its performance optimizations.
2. Explicitly request the necessary D-CLOUD-028 and D-CLOUD-031 refinements.
3. Replace size/mtime confirmation with a content-verification requirement.
4. Specify deletion intent, manifest ownership, and agreement binding before describing the detector as complete.
5. Keep `--backup-dir` and advisory locks as mechanisms requiring backend tests—not as universal atomicity guarantees.
6. Preserve the configuration-behavior and actual-launched-core findings as blocking #10/#21 acceptance tests.

---

## 2. Review of `gemini-analysis.md`

### Strongest argument: resolution needs retained bytes and a coherent save unit

The analysis correctly challenges a release in which a mistaken manual choice can irreversibly remove progress. Its distinction between an explicit choice and an accidental button press is a legitimate product-safety argument for revisiting the IA’s default-off retention setting. [S02, S24]

It also correctly identifies the danger of treating a multi-file save as independent choices. The repair should be expressed as **a save-unit inventory and grouped resolution contract**, however. The corpus establishes that several layouts exist; it does not establish that every `.eep`/`.mpk` combination is one indivisible save or that mixing them “almost certainly” corrupts it. That needs emulator/game-specific evidence. [S01 §4.8, S32]

### Weakest argument: reopening D-CLOUD-029 on the premise that `--update` preserves both copies

This argument is incorrect as stated.

Consider two different saves:

| Candidate | Modification time | Progress |
|---|---:|---|
| Cloud | 100 | Further |
| Local | 200 | Less |

`copy --update` can still overwrite the cloud’s further-progress version with the newer local file. In the opposite timestamp ordering, it skips the upload—but the next boot restore can overwrite the retained local version.

Thus, `--update` protects one timestamp ordering for one direction; it does not preserve both versions across the shipped workflow. D-CLOUD-029 explicitly accepts the current risk until replacement. Reopening it requires a materially different preservation argument or a narrower risk-reduction case, not “a skip leaves both safe until the wizard.” [S06 D-CLOUD-029, S29, S30, S35]

The recommendation to **fall back to legacy copy when roots differ** is more dangerous still. A guard that refuses because its model does not apply must not hand control to the destructive mechanism it was replacing.

### Other checkable corrections

| Claim in `gemini-analysis.md` | Review |
|---|---|
| The proposed manifest engine is “stateless” and immune to workdir corruption | Incorrect. It still depends on manifests, `agreed.json`, and recovery state. Removing bisync’s additional state is simplification, not statelessness. [S03] |
| `rclone lsjson` pulls remote manifest contents | Incorrect description. Listing object metadata is not downloading the JSON payloads. The fetch and its cost need an explicit place in the protocol. |
| `bisync --conflict-resolve none` skips conflicting files entirely | Not established by the embedded evidence. The corpus supplies claims about the flags, not a non-dry-run artifact trace proving untouched conflicting paths. [S16, S23] |
| Rclone handles remote concurrency safely through temporary files and atomic renames | Incorrect as a consistency claim. Atomic replacement of one object does not prevent two writers from overwriting each other’s updates. Backend-independent atomic rename is itself unproven here. |
| Two distinct devices’ manifests overwrite each other merely because uploads are simultaneous | Not under the intended per-device filenames. That requires duplicated identity or a transfer path that republishes another device’s cached manifest. [S03, S34] |
| Query the maintainer’s existing `agreed.json` history | The schema says nothing is built. There is no such historical dataset in the corpus. [S03 opening] |
| Emit pins during “Yocto/buildroot” assembly | Wrong build-system description. ROCKNIX uses the LibreELEC/CoreELEC-derived build system; the proposed pin sources are `get_pkg_version` and `LIBRETRO_CORES`. [S15, S03 §9] |

### The filesystem-cache explanation is wrong

The analysis conflates **visibility of completed writes** with **durability after power loss**.

Under ordinary Linux file I/O, a subsequent reader sees bytes already written into the page cache; they need not first reach the SD card. A background writer or a launcher that returns while a child continues writing is a different, plausible race. The embedded `process.run()` call does not establish whether every standalone launcher waits for all writers. [S41]

A global `sync` followed by a sleep is not a proof of writer quiescence and does not fix a surviving child. Replace this experiment with:

- identify the actual writing process and launch lifecycle;
- capture a stable version;
- verify that version is what gets transferred;
- test interruption and durability separately.

### Lineage must not be adopted from the losing side

The “Unknown Manifest Overwrite” scenario asks whether KEEP RIGHT should adopt Device A’s `replaces` lineage. Not unless the actual local predecessor is known to be that version.

Choosing B over A is a resolution decision, not evidence that B descended from A. When the predecessor is unknown, preserve that uncertainty. A newly written B version can have known B provenance while its parent remains unknown. [S03 §§2, 6]

### Concrete Step 3 revisions

1. Withdraw the blanket `--update` safety claim and the legacy-copy fallback.
2. Retain the bisync spike; remove unsupported assertions that every interruption demands resync.
3. Specify manifest fetching, payload validation, agreement persistence, and recovery.
4. Separate writer-lifecycle testing from filesystem durability testing.
5. Define retention count scope—per save unit, game, or transaction—rather than prescribing “1” without saying what it bounds.
6. Treat multi-file grouping as measured emulator behavior, not inferred solely from extensions.

---

## 3. Review of `kimi-analysis.md`

### Strongest argument: the first writer can lose progress without a later conflict

The trace in §3.13 is compelling:

1. B uploads `H_B` and records agreement with it.
2. A, acting on a stale observation, overwrites the cloud with `H_A`.
3. B later has `L_B = A_B = H_B`, while `C = H_A`.
4. The schema correctly classifies this as “cloud changed,” so B downloads `H_A` without a conflict.

That outcome follows directly from the proposed table. It demonstrates why a pre-upload read or a COMPLETE-time recheck **shrinks a race window but does not eliminate it**. An audit line does not restore the overwritten bytes. [S03 §3]

This finding should change the claimed guarantee of every proposal relying on read-before-copy. Step 3 needs an explicit answer: enforce serialization, retain independently published versions despite racing canonical writes, or state the remaining limitation honestly. “The lock is advisory” cannot become “progress is protected under concurrency.”

The narrow reopening of D-CLOUD-028 is also well argued: a correctness read for files about to be uploaded differs from an unconditional reachability probe, but its real cost must be measured and registered. [S06 D-CLOUD-028]

### Weakest argument: size-plus-relist as post-upload verification

Section 1.6 permits “download-and-hash **or size-plus-relist**” on hashless backends. The latter is exactly the class of comparison the design is supposed to stop trusting.

A different 65,536-byte SRAM file passes a size check. Relisting it twice does not change that fact. The required revision is unambiguous:

> A hashless remote requires content confirmation before agreement can certify the uploaded version, unless another explicitly tested mechanism provides the same guarantee.

The system-backup code’s size assertion is useful prior-art context, not sufficient proof for the stronger save-version identity contract. [S03 §6, S10, S29]

### Strong supporting findings

These deserve to remain:

- **Pending KEEP BOTH allocations must be reserved within the plan.** Calling an unchanged repository’s allocator repeatedly before COMPLETE can select the same slot. [S37]
- **Unchanged manifests should not be rewritten solely to change `generated_at`.** Otherwise metadata churn defeats the no-change fast path. [S03, S06 D-CLOUD-028]
- **The headless-to-ES handoff is unspecified.** The boot job discards output, while `ThreadedCloudSync` understands success, two skip states, and generic failure—not a conflict result. [S35, S40]
- **The discard store belongs to the wizard’s implementation scope if its setting ships there.** Deferring #25 cannot defer the bytes needed to honor #23’s own retention setting. [S02, S26]
- **The XML configuration does not automatically include a second legacy-flat reader.** The code supports the diagnosis that “read both, write new” is not obtained merely by adding another emulator template. [S39]

### Detection claims overreach their stated evidence

The proposal initially labels bisync’s hashless behavior as inference, but later treats it as a settled universal result: “Every in-game-save change … is invisible,” and bisync is therefore capped at hash-capable backends.

The corpus establishes the size-only failure for the shipped copy paths. It does **not** establish every bisync comparison mode, refusal behavior, or recovery mechanism in 1.75.0. A clean refusal on an unsupported configuration would also differ materially from silent blindness. [S29, S16, S23]

Similarly:

- The externally equalized-conflict loop is a useful test.
- The statement that a subsequent clean bisync run is “impossible” is not established.
- The claim that the manifest algorithm is already “complete” and handles renames “for free” conflicts with the proposal’s own unresolved deletion and grouping requirements.

Keep the spike as the arbiter, as the analysis elsewhere recommends. Do not let an explicitly conditional hypothesis become an unconditional architectural premise.

### #10’s proposed Option A violates the attribution rule

Moving flat states into the current default core’s directory and recording that core as fact is not made legitimate by an audit line saying it was inferred.

A loud failure in one bench test does not turn an unknown producing core into a known one. D-CLOUD-017 and the upgrade rule explicitly reject manufacturing authoritative-looking provenance. [S06 D-CLOUD-017, S11]

Option B also needs stronger qualification:

- It leaves the default core writing into the legacy-flat directory.
- A later change in the system’s default core can change which core is associated with those files.
- It is not the full “read both, write the new layout” migration contract.

The useful conclusion is **“the existing configuration mechanism may be insufficient”**, not “choose between two configurations that each compromise the requirement.” A reader change is a legitimate alternative.

Also, a measured chipset incompatibility does not by itself require chipset directories. D-CLOUD-017 deliberately separates physical namespace from compatibility metadata and policy.

### Other revisions needed

**Root mismatch is not closed by a warning.**  
The config explicitly permits different backup and restore roots. An engine whose agreement model requires one root must refuse affected save writes or model the distinction. “Warning fires; nothing misbehaves” assumes the result that must be proved. [S33]

**Auto-state recency is not semantically authoritative.**  
A new resume point can be a shallow replay or an accidental new game even with a perfectly synchronized clock. The cardinal rule applies to it as well. Offline play alone also does not produce a conflict: both sides must diverge. Measure actual forks, not merely auto-state writes. [S01, S03 §3]

**Initial conflict volume is overstated.**  
The table asks about copies that differ *now*, not files whose contents “ever diverged.” Identical copies do not need a choice merely because their provenance or agreement record is missing. [S03 §3]

**Schema amendments must be acknowledged as such.**  
`rom: null`, new container kinds, tombstones, and grouping fields are reasonable proposals, but they alter the signed-off rev-1 contract. The opening claim that nothing touches D-CLOUD-031 should be replaced with an explicit proposed refinement. [S03 §6, S06 D-CLOUD-031]

### Concrete Step 3 revisions

1. Delete size-plus-relist as verification.
2. Preserve the concurrency counterexample and require a stronger preservation contract.
3. Keep bisync behavior conditional until measured.
4. Reject inferred-core migration; specify an honest legacy reader.
5. Make root mismatch a fail-closed condition for the affected engine.
6. Register the proposed schema changes and correct the auto-state/initial-volume assumptions.

---

## 4. Review of `mistral-analysis.md`

### Strongest argument: every save-writing entry point must share the same refusal policy

The demand to test boot, game exit, and the menu against a constructed both-sides change is correct. So is requiring KEEP BOTH’s destination to be free on both sides. These are substantive endorsements of #22/#23’s documented acceptance criteria, rather than newly discovered requirements. [S05 §5, S23, S02]

### Weakest argument: “never agreed and different” should transfer without prompting

This proposed table row must be rejected.

If both sides contain different bytes and no common baseline exists, nothing identifies a safe direction. Calling that case “one-way” does not make it one-way.

A fresh handheld with **no local file** already has a separate cloud-only case. A fresh handheld with **an identical local file** already has the equality case. A handheld with two different pre-existing versions is exactly the case where conservative behavior requires a choice. Long-offline agreement is not invalid simply because it is old. [S03 §3]

The proposed row would silently destroy the evidence needed for the player’s decision.

### Incorrect claims about the current design

**Audit logging is already a V1 requirement.**  
D-CLOUD-027 and the IA require it. Making it “mandatory from day one” does not replace snapshots; an audit log contains descriptions, not the lost save bytes. [S06 D-CLOUD-027, S02]

**KEEP BOTH retains both save versions.**  
If implemented correctly, the desired cloud bytes remain available in the allocated numbered slot. The assertion that the original cloud copy cannot be recovered confuses loss of its former path with loss of its content. The valid concern is interrupted or incorrect application—not KEEP BOTH’s intended semantics.

**Retention is already bounded in the specification.**  
The count selector is explicitly the retention rule. Since the feature is unbuilt, “the count is not enforced” is not an observed defect. It is an acceptance test to implement. [S02]

**`remote_hash` cannot be mandatory on all supported remotes.**  
The QA WebDAV backend supplies no hashes. Its valid value remains `null` after upload. Moreover, making a field mandatory does not atomically commit a save and a manifest. Generic multi-object atomicity is not supplied by the corpus. [S03, S04]

**The boot script does not use `&&`.**  
Its restore and backup are separate sequential commands, so the backup is attempted even after restore failure. The analysis’s quoted composition does not match the embedded source. This matters for error handling and the cutover inventory. [S35]

**#10 is no longer per-chipset namespacing.**  
D-CLOUD-017 decides core directories with build metadata. Cross-chipset portability does not invalidate per-core separation. [S06]

### Decision arguments needing repair

The `--update` recommendation has the same timestamp-ordering defect as `gemini-analysis.md` and contradicts D-CLOUD-029 unless explicitly reopened and accepted.

The duplicate-compaction objection also needs a more precise argument. Two hash-equal files contain the same stored save version. Removing one can remove an intentionally convenient slot placement, but it does not delete a different playthrough’s bytes. D-CLOUD-030 explicitly chose automatic compaction. Reopening it would require an argument about meaningful duplicate-slot intent, not a claim that byte-identical copies contain different progress. [S06 D-CLOUD-030]

Finally, signed audit logs address an unsupported threat model. This is one player’s support log, not an adversarial multi-party ledger. A player able to edit it can generally also edit local keys and state. No requirement here calls for preventing the owner from “framing another device.” That proposal adds complexity without recovering a single lost save.

### Concrete Step 3 revisions

1. Restore the schema’s conservative no-agreement row.
2. Remove mandatory remote hashes and unsupported cross-object atomicity requirements.
3. Distinguish audit records from retained payloads.
4. Correct the boot control flow and D-CLOUD-017 interpretation.
5. Reframe retention, unknown compatibility, and clock rendering as implementation tests—not established defects.
6. Drop audit tamper-proofing unless the maintainer introduces a corresponding threat model.
7. Do not make resume-point labeling depend on exceeding an arbitrary frequency threshold; it describes the file’s meaning.

---

## 5. Important failure modes none of the four analyses resolves

### 5.1 `copyToSlot()` can report success after failing to copy

**Established in the embedded code:** after checking only that the source exists and the requested slot is nonnegative, `copyToSlot()` ignores the return values of both state and screenshot copy/rename operations and returns `true`. [S38]

Therefore:

- “reuse it” does not establish successful materialization;
- a state copy can fail while the caller records agreement;
- the state and thumbnail can have different outcomes.

**Cheapest experiment:** use an isolated destination with no writable space or permissions; keep the source present; invoke the merge path and compare the reported result with destination hashes.

**Required revision:** verify state and companion artifacts independently before advancing agreement or deleting any source. Fix or wrap the helper’s success contract.

### 5.2 An auto-only repository does not yield the first numbered slot

**Established in the embedded code:** `getNextFreeSlot()` returns `firstslot` only when the state vector is empty. If it contains an auto state at slot `-1` but no numbered states, the scan over `99999…0` finds nothing and returns `-99`. [S37]

This directly affects the proposed common case: KEEP BOTH on an auto-state conflict.

**Cheapest experiment:** a game with only `.state.auto` and its PNG; refresh the repository and exercise allocation.

**Required revision:** explicitly test auto-only, empty, disabled, and boundary repositories. “No practical 99-slot limit” must not be confused with an infallible allocator.

### 5.3 Verified equality can leave a first-run file permanently “never agreed”

The schema says:

- equal copies → “nothing”;
- agreement is written by the transfer that uploads or downloads a version. [S03 §§3, 9]

A literal implementation can therefore observe `L = C = H` on its first run, transfer nothing, and leave A unknown. A later unilateral change becomes an unnecessary conflict.

**Cheapest experiment:** begin with equal copies and no agreement record; reconcile; change only the cloud; reconcile again.

**Required revision:** specify whether a verified equality observation establishes agreement without a transfer. It should not depend on manufacturing a redundant copy.

### 5.4 “Each device writes only its own manifest” must also constrain transport

The existing upload walks the save tree, and the allowlist includes all of `savestates/`. Downloaded foreign manifests reside in that same tree. Merely restricting which manifest a capture routine edits does not prevent a later generic upload from republishing a stale foreign manifest. [S29, S32]

**Cheapest experiment:**

1. B downloads A’s manifest.
2. A publishes a newer manifest.
3. B uploads its cached save tree.
4. Check whether A’s newer metadata survives.

**Required revision:** enforce manifest ownership in upload and deletion selection. Foreign manifests are reader inputs, not writable payloads of this device.

### 5.5 Mandatory safety exclusions are not guaranteed by defaults

`cloud_sync_helper` puts custom rules before defaults. Thus, putting a snapshot exclusion before `+ /savestates/**` **inside the defaults** does not necessarily put it before a custom broad inclusion. [S31]

There is another boundary: the backup and restore functions use their fallback `--filter-from` only when the configured options array is empty. A nonempty customization that omits the filter does not automatically receive the mandatory allowlist. [S29, S30]

**Cheapest experiment:** use an upgraded fixture configuration containing a broad custom inclusion, then one with nonempty `RCLONEOPTS` but no filter. Include a real save, a snapshot, and a ROM as positive/negative controls.

**Required revision:** distinguish customizable selection from non-overridable safety boundaries, and test the actual effective command. A rule’s presence in a defaults file is not proof it governs the transfer.

### 5.6 Exit-code domains already collide

The scripts reserve exit 3 for lock contention and exit 4 for no network. But they also pass through raw rclone statuses, whose own error descriptions include 3 for directory/permission problems and 4 for a missing file. `ThreadedCloudSync` renders those statuses as skips. [S29, S30, S40]

Additionally, both script mains exit with the save-phase result even if the system-backup phase failed. A `--system-only` failure can therefore be reported through an overall zero save status.

**Cheapest experiment:** force a backend/file error and a system-only transfer failure; inspect both the artifact and the card/stamp outcome.

**Required revision:** define a normalized script result protocol. Do not allocate “5 = conflicts” without separating it from native backend errors. Preserve per-phase failures rather than letting an unrelated successful phase mask them.

### 5.7 Moving the PNG is not proof it depicts the selected save version

All four discuss pairing, but none specifies a reliable binding between a particular state version and particular thumbnail bytes.

A manifest can correctly identify the current state hash while its screenshot path contains an older PNG from an interrupted publication. The picker then confidently presents the wrong picture—the failure its information architecture explicitly wants to avoid. [S03 §6, S02, S38]

**Cheapest experiment:** publish a new state with an intentionally retained old thumbnail, or interrupt between the two objects; verify what the picker shows.

**Required revision:** bind companions to a capture/version and withhold or mark the image when that association is unverified. A companion digest or generation need not become part of D-CLOUD-030’s state identity.

### 5.8 Repository refresh invalidates stored `SaveState*` objects

`SaveStateRepository::refresh()` calls `clear()`, which deletes the stored state objects. A wizard that retains those pointers across refresh, renumbering, or a revalidation pass risks using invalid objects. [S37]

**Cheapest experiment:** retain a selected conflict item, trigger the required repository refresh/reallocation, then revisit or apply that selection.

**Required revision:** retain stable plan data—version hashes and validated paths—not borrowed repository objects across invalidating operations.

### 5.9 The round-trip harness is not yet a trustworthy measuring instrument

All four correctly call for running it. Its embedded implementation also requires review before relying on the result:

- It overwrites `rclone.conf` before checking which remote is first.
- Cleanup restores only some modified settings, not the original remote configuration.
- Exception exits can bypass cleanup.
- Archive assertions expect the old undated local name, while the current scripts upload dated names and restore under those dated names. [S36, S29, S30]

**Cheapest experiment:** run on a disposable VM with known configuration sentinels; compare configuration and artifact inventory before and after, including an interrupted run.

**Required revision:** keep this suite off valuable handheld installations, distinguish stale test expectations from product defects, and add positive artifact checks without weakening the safety assertions. The already-available GENERIC_X64 image in the problem statement should be used; an earlier futro’s cold-build requirement is stale. [S01]

---

## 6. Required evidence and revisions before Step 3 settles an architecture

These are review requirements, not a replacement implementation plan.

1. **Make the harness reliable on disposable VMs.** Run WebDAV and MinIO, retain raw results, and verify configuration isolation.
2. **Test the ES primitives’ actual failure behavior.** Auto-only allocation, failed copies, thumbnail mismatch, and repository invalidation belong before trusting the merge design.
3. **Run the comparative bisync/reconciler spike.** Include:
   - same-size and same-mtime changed data;
   - hashless remote behavior;
   - genuine forks with `none`/loser settings;
   - rename and deletion distinctions;
   - external equalization after a manual decision;
   - interrupted and missing agreement/listing state;
   - filter changes;
   - exact pre/post path and byte inventories.
4. **Require a write-authorization argument for every path.** That includes foreign manifests, grouped saves, direct upload/download rows, headless callers, and configuration failures. No fallback may bypass the guard.
5. **Require a concurrency preservation argument.** Rechecks, TTLs, and provider history may mitigate; none should be described as eliminating lost updates without proof.
6. **Run #19 with the same-chipset control first, then the stated cross-family and corruption cases.** Results apply to tested cores/builds/configurations—not all savestates.
7. **Measure real small-panel recognition.** Use actual thumbnails on the RG351M, not only desktop-viewed frames, before changing the settled presentation.
8. **Make decision changes explicit.** D-CLOUD-028 budget refinements, D-CLOUD-031 schema/ownership refinements, and any reopening of D-CLOUD-029 or D-CLOUD-030 must be separately stated and accepted.

### Gaps surfaced to the orchestrator

The following needed evidence was not embedded:

- Upstream rclone 1.75.0 bisync implementation/documentation and evidence for claims about its future direction.
- `Utils::FileSystem` implementations and relevant headers for stronger copy, rename, lifetime, and durability guarantees.
- The full launcher/process implementation and RetroArch directory-setting path.
- Actual results from the round-trip suite, bisync spike, and compatibility protocol.
- Current issue bodies and edited AC lists as distinct artifacts: the supplied issue files are comment-thread exports, so several body-edit claims are supported only by the futro/alignment review.

The absence of these sources does not prevent this review, but it prevents treating several proposed implementation guarantees as established.

---

## `corpus.provenance.json`

Artifact contents are supplied inline because this session has no filesystem access. The arrays are positionally aligned: their first entries are **S01**, their second entries **S02**, and so on.

```json
{
  "corpus_mode": "facilitator_embedded_read_at_time",
  "source_count": 42,
  "source_reference_order": "S01 through S42, positionally aligned across both arrays",
  "hash_verification": "SHA-256 values verified at embed time by the Council Facilitator and copied from source headers",
  "independently_reread_files": false,
  "independently_rehashed_files": false,
  "commands_or_hardware_tests_performed": false,
  "manifest_read_timestamp_utc_as_supplied": "2026-09-05T17:32:51Z",
  "peer_analyses_reviewed": [
    "claude-analysis.md",
    "gemini-analysis.md",
    "kimi-analysis.md",
    "mistral-analysis.md"
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
      "description": "Upstream rclone 1.75.0 bisync implementation, version-specific documentation, and evidence for future-direction claims",
      "declared_source_path": null,
      "sha256": null
    },
    {
      "description": "Utils::FileSystem implementations and relevant ES headers needed to establish stronger copy, rename, lifetime, and durability guarantees",
      "declared_source_path": null,
      "sha256": null
    },
    {
      "description": "Full launcher/process implementation and RetroArch directory-setting path, including the referenced setsettings.sh and runtime configuration",
      "declared_source_path": null,
      "sha256": null
    },
    {
      "description": "Executed round-trip, bisync-spike, and savestate-compatibility results",
      "declared_source_path": null,
      "sha256": null
    },
    {
      "description": "Current issue bodies and edited acceptance-criteria lists as distinct artifacts; embedded issue snapshots are comment-thread exports",
      "declared_source_path": null,
      "sha256": null
    }
  ]
}
```