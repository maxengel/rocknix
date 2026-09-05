# `gpt-revised_plan-r2.md`

## Recommendation

**Build a content-based reconciler with one controlled save-writing path, using rclone for transport. Do not build the wizard on an assumed “report-only” bisync mode, and do not treat ES’s existing slot functions as transactional file operations.**

The foundation should preserve the project’s existing decisions on stored-byte identity, per-device manifests, core namespacing, persistent audit, and no recency-based conflict resolution. It needs targeted refinements to capture, agreement, deletion intent, retention, and the game-exit budget.

The load-bearing design is:

1. **Capture locally after every completed session**, independently of network availability and automatic-sync settings.
2. **Separate save production from cloud transport.** Gameplay, ES’s temporary save rearrangements, capture, and cloud writes must share a save-lifecycle gate; the existing cloud lock alone is insufficient.
3. **Classify using verified local content, verified cloud content, and local last agreement.** Manifests supply provenance and operation records, not unquestionable assertions about what the cloud currently contains.
4. **Transfer only explicitly classified paths**, with non-overridable scope and ownership checks.
5. **Preserve preimages before replacement.** Use rclone’s `--backup-dir` where its relevant behavior has been established, but do not call it atomic, free, or universally safe on the strength of this corpus.
6. **Propagate only recorded, version-specific retirements**, never deletions inferred from absence.
7. **Apply a frozen, hash-bound plan.** That plan, augmented with per-unit progress, is the recovery journal; there is no second transaction database.
8. **Use a checked ES merge adapter**, including a real fix for auto-only allocation and explicit destinations for staged cloud states.
9. **Queue conflicts from unattended syncs.** Interactive sync may enter the walkthrough; boot and game-exit jobs must not seize the UI.
10. **Keep #10 in the feature drop**, but implement its layout change after the reconciliation and launch behavior have been rehearsed. A working wizard does not make an unsafe flat save namespace acceptable.

Full snapshot history, distributed coordination, semantic save merging, a shared database, and an immutable remote publication protocol are **not default V1 machinery**.

### Evidence convention

`S01`–`S42` refer to the supplied source headers and the corresponding ordered path/hash pairs in `corpus.provenance.json` below. For readability, prose citations show the portion of the declared path after `_sources/`.

- **Source-visible:** follows from the embedded implementation.
- **Decided:** established by the decision register, pending an explicit refinement where proposed.
- **Proposed:** this document’s design choice.
- **Unmeasured:** requires the named experiment.

I have no filesystem access and performed no commands, hardware tests, or independent hashing. Earlier revised-plan files were not supplied in this round; references to them identify proposals described in the injected reviews, not files I independently inspected.

---

## 1. What changed after the reviews

### 1.1 Concessions and adoptions

| Point | Disposition |
|---|---|
| Mandatory protected remote publications for every changed unit | **Withdrawn as the default V1 mechanism.** `claude_peer_review-r2.md`, `gemini_peer_review-r2.md`, and `kimi_peer_review-r2.md` make the proportionality objection correctly: this requires additional protocol and transport work on an already expensive path. That objection establishes a scope problem, not that the cheaper replacement has already been proven. |
| A separate durable transaction journal | **Removed.** Adopt `claude_peer_review-r2.md`’s formulation: the frozen apply plan, with expected operands, preserved copies, and per-unit status, is the journal. `kimi_peer_review-r2.md` is also right that restart should revalidate actual artifacts rather than trust a saved program counter. |
| Full remote staging as the normal detection mechanism | **Rejected.** Retain candidate-scoped content reads. Full content examination is a fallback for a full reconciliation on backends without a trustworthy equality signal—not the normal game-exit operation. |
| Manifest transport ownership | **Adopt the ownership rule credited to `kimi-revised_plan.md`; do not require a separate process per manifest.** Foreign manifests must never be republished, and an ordinary download must not overwrite this device’s locally updated manifest. Batch ownership-filtered transfers when the filter behavior is proven. |
| Missing allowlist and transient-file hazards | **Adopt the findings emphasized by `kimi_peer_review-r2.md` and `claude_peer_review-r2.md`.** A nonempty `RCLONEOPTS` without `--filter-from` bypasses the allowlist; `.state.auto.bak` is admitted by the shipped save patterns. These are source-visible findings, not speculative objections. |
| Explicit scope exclusions | **Adopt the discipline credited to `mistral-revised_plan.md`.** No semantic binary merge, whole-library vector clocks, occurrence identifiers for ordinary saves, or audit-log tamper-proofing. |
| “Nothing here is built” | **Keep this explicit**, as emphasized by `gemini_peer_review-r2.md` and `kimi_peer_review-r2.md`. The signed schema describes future behavior; it is not evidence of a functioning detector or agreement store. |

Sources: `repo/docs/save-manifest-schema.md` [S03]; `repo/projects/ROCKNIX/packages/network/rclone/sources/cloud_backup` [S29]; `.../cloud_restore` [S30]; `.../cloud_sync_helper` [S31]; `.../cloud_sync-rules.txt` [S32].

### 1.2 Corrections to the reviews

These matter because agreement among reviewers is not a substitute for evidence.

- **`--backup-dir` is not proven “atomic-equivalent” or zero-round-trip.**  
  `gemini_peer_review-r2.md` overstates this, and `claude_peer_review-r2.md`’s “zero extra round trips” is unsupported. The embedded uploader demonstrates use of the flag in mirror mode; it does not demonstrate concurrent replacement semantics, crash ordering, complete-unit preservation, or cost on every backend. Adding a flag need not add a process, but server-side copy or rename can still cost requests and time. [S29]

- **The protected-publication proposal was not distributed two-phase commit.**  
  `gemini_peer_review-r2.md` mislabels it. Its purpose was preservation before canonical replacement, not global atomic commitment. I nevertheless withdraw its mandatory V1 implementation for the scope reasons above.

- **The reconciler is not stateless, and this plan does not require a full staging mirror.**  
  Those descriptions in `mistral_peer_review-r2.md` are incorrect. Last agreement, pending operations, and retirement records are deliberately durable local state.

- **Exit-time renumbering is conditional, not “every exit.”**  
  `claude_peer_review-r2.md` correctly identifies an important exit-time rename path, but overgeneralizes it. `FileData` calls `onGameEnded()` only when `saveStateInfo` exists; the `racommands` branch returns early for a negative slot. A numbered-slot launch can exercise the rename trace; an arbitrary new-game or auto-resume exit need not. [S38, S41]

- **The detailed “temporary auto gets a fresh mtime” incident trace remains partly unmeasured.**  
  The temporary auto and `.bak` operations are visible. The exact copy utility’s timestamp behavior is not embedded. Test the dangerous trace; do not promote its timing assumptions to observed behavior. [S38]

- **No deletion propagation is not an adequate resolution of D-CLOUD-030.**  
  I reject the V1 recommendation in `gemini_peer_review-r2.md` and `mistral_peer_review-r2.md`. Repeatedly restoring a retired duplicate while compacting it locally does not converge. Intent-recorded retirement is needed; absence-based deletion is not.

- **A one-way upload posture is not lossless.**  
  `mistral_peer_review-r2.md` repeats a claim refuted by the embedded uploader. Disabling downloads prevents one class of local overwrite, but the exit upload can still overwrite a cloud-only version. D-CLOUD-029 stands. [S06, S29, S35]

---

## 2. Decisions that need maintainer approval

These are proposed **new refinement rows citing existing IDs**, not edits to decided rows and not newly assigned register IDs.

| Existing decision | Proposed refinement | Reason |
|---|---|---|
| **D-CLOUD-031** | Retain one per-device JSON manifest and unsynced agreement. Revise the schema to preserve immutable origin, describe complete save units, bind screenshots, record explicit operations, scope agreement to its endpoints, and establish agreement on verified equality as well as transfer. | Path-keyed latest entries and a one-step `replaces` field do not represent possession versus production, grouped saves, retirement, or bootstrap equality adequately. |
| **D-CLOUD-030** | Retain stored-byte SHA-256 identity. Limit automatic compaction to duplicate **numbered states in one game/core repository**. Record and propagate verified move/duplicate retirements so they converge. Equality alone establishes duplicate bytes, not that a particular rename occurred. | Auto resume points are not interchangeable with numbered slots; cloud copies otherwise resurrect compacted duplicates. |
| **D-CLOUD-014**, with D-CLOUD-030/031 | Ordinary backup remains non-deleting. Reconciliation may retire an exact version only following an explicit save-management action, verified move, or verified duplicate compaction, with recoverable preservation and a deletion-set guard. | This is a narrow exception for synchronization of known intent, not a return to mirror semantics. The exception should be explicit rather than hidden behind a new command name. |
| **D-CLOUD-028** | Preserve a cheap no-local-change exit path. For changed units, permit bounded correctness reads and verification; timestamps become scheduling hints, not the authority for what changed. Batch payload and owned metadata whenever possible. | “Never inspect the remote” cannot safely authorize replacement of a potentially diverged cloud version. The changed-path cost must be measured, not concealed. |
| **D-CLOUD-024**, specifically its IA rev-4 endorsement | Keep the wizard in this drop. Approve IA rev 5 with queued unattended conflicts, precise cancellation semantics, default-on bounded discard retention, and minimal native recovery. | The existing off-by-default escape hatch is weak protection against a mistaken visual choice, and the absolute “nothing transfers” wording contradicts the pre-pass. |
| **D-CLOUD-017** | **No reversal.** Core directories remain in this drop. Their implementation follows the launch rehearsal and checked writer, rather than being treated as a configuration-only prerequisite. | A clean chipset result does not repeal core isolation. Creating `es_savestates.cfg` changes launch behavior as well as directories. |

The following remain unchanged:

- **D-CLOUD-009:** reuse `cloud_device_id`; do not silently invent a new device identity.
- **D-CLOUD-025:** hardware compatibility testing determines badge severity.
- **D-CLOUD-027:** append-only, rotated, support-only audit at `/storage/.cache/log/cloud_audit.log`.
- **D-CLOUD-029:** no `--update` stopgap.
- **D-CLOUD-026:** migrations preserve content before removing originals.

Bisync’s demotion requires an explicit approach amendment and edits to #9, #22, and the IA. No standalone register row declares bisync the detector, but that does **not** make changing the maintainer’s proposed architecture a merely clerical action. [S01, S02, S06, S16, S18, S23]

**Retention count:** I propose three completed, deliberately discarded versions per save unit as an initial default. That is a new product choice—not a number specified by the IA and not borrowed from system-backup retention. Unresolved conflicts and incomplete transactions are exempt from this rolling count.

---

## 3. The foundation to build

### 3.1 One save-writing authority, with two distinct locks

The existing `take_cloud_lock` serializes cloud scripts on one device. It does not serialize them against an emulator or ES’s save-state preparation and cleanup.

The source demonstrates why that distinction is essential:

- Boot launches restore and backup in a detached shell.
- Those commands are separate; backup runs even if restore fails.
- A numbered-state launch can create a temporary auto state, an auto backup, and a provisional numbered copy.
- Cleanup and possible renumbering occur before the current exit-sync call.
- SRAM may be flushed while gameplay is active.

Sources: `.../autostart/102-cloud-saves` [S35]; `es/SaveState.cpp` [S38]; `es/FileData.cpp.launchGame-excerpt-l740-850.cpp` [S41]; `repo/docs/save-manifest-schema.md` §4 [S03].

**Proposed mechanism**

- ES owns scheduling of the startup save job. The autostart path requests work; it no longer independently restores into the live save tree.
- All entry points—boot, exit, menu, Tools, the future savestate-manager SYNC tile, and any shutdown integration—reach the same backend.
- A **save-lifecycle gate** covers launch-time temporary changes, active gameplay, final emulator writes, ES cleanup, renumbering, and capture.
- Cloud downloads, compaction, re-slotting, and apply operations may modify the live tree only while that gate is available.
- Uploading an already sealed, immutable local staging copy may continue during gameplay.

**Lock order**

1. A network worker takes the cloud lock non-blockingly.
2. It takes the lifecycle gate non-blockingly only for a short snapshot or local commit.
3. It does not hold the lifecycle gate across network waits.
4. ES’s game session holds the lifecycle gate, performs local capture, releases it, and only then requests cloud work.
5. Capture never waits for the cloud lock.

This prevents a session from blocking on a network worker that is itself waiting for the session. The exact ownership mechanism must also survive ES dying while an emulator remains alive; that is a required failure test, not an assumption that `flock` alone settles.

### 3.2 Capture is unconditional local work

Capture runs after the session’s save lifecycle has stabilized, including ES cleanup, whether:

- automatic game-exit sync is disabled;
- the network is absent;
- another cloud operation is running;
- the emulator exited unsuccessfully.

Putting capture inside the present sync condition misses offline and skipped sessions—the sessions most likely to produce later forks. [S29, S41]

Capture receives the **actual launch context**, after save-state launch adjustments: game identity, system, resolved emulator, and the core actually selected for execution. Calling `getCore(true)` at exit is not a general substitute once `setupSaveState()` can rewrite the launch command. [S38, S39, S42]

Capture must:

- hash the known save units for the played game regardless of their mtimes;
- recognize ES’s recorded moves rather than attribute them as new production;
- exclude temporary auto backups and provisional launch artifacts;
- retain provenance for unchanged imported bytes;
- distinguish “observed here” from “produced here”;
- write only when content, placement, or meaningful metadata changes;
- never rewrite the manifest merely to refresh `generated_at`.

For standalone emulators, a ROM-name filter is insufficient. Use measured layout adapters. Files outside a known adapter may be inventoried and hashed as unknown; they must not all be attributed to whichever game just exited. [S03, S06 D-CLOUD-028, S22, S29]

The core-pins artifact is emitted at image build from the effective package configuration. Unknown mappings remain unknown. The pin is useful comparison data, **not proof** that two builds serialize identically. [S03 §9, S04, S15]

### 3.3 Keep the manifest shape; fix its semantics

Retain:

- `savestates/.rocknix/manifest-<device-id>.json`;
- one writer per manifest;
- path-relative entries;
- stored-byte SHA-256;
- local, unsynced agreement.

Do not add SQLite.

The minimum schema refinement is:

| Record | Required meaning |
|---|---|
| **Origin** | The device/model, emulator/core/build, and capture facts of the producer of these bytes. Copying or re-slotting preserves this object. Unknown stays unknown. |
| **Possession / placement** | This device currently holds a version at this path. Recording possession does not claim authorship. |
| **Save unit** | A complete member set captured at a coherent generation, with each member’s path and hash. A single SRAM or state is a simple unit; a multi-file save is a larger one. |
| **Screenshot binding** | The observed PNG path and its SHA-256, associated with the state version. This prevents stale transport pairing; it does not magically prove that an emulator generated the image contemporaneously. |
| **Operation record** | An explicit move, delete, duplicate retirement, or completed resolution, bound to exact input hashes and output locations. |
| **Generation / parent observation** | Enough information to distinguish a new own-manifest generation from an unacknowledged foreign rewrite of the same device file. No clock-based last-writer-wins rule. |

A shared VMU or memory-card container can have `rom: null`. Do not invent one game’s name for a file that serves several games.

Also distinguish:

- the ROM filename/path ES launched;
- the repository’s filename-derived matching key.

With `nofileextension=true`, ES commonly matches the ROM stem. The schema’s recorded launch filename can remain useful without pretending it is the discovery regex’s key. [S03, S37, S39]

**Why origin must be carried:** looking up provenance by hash across current manifests is a useful fallback, but not durable. The producer can overwrite its own latest path entry; without origin copied into a holder’s entry, imported versions then lose their provenance. This adopts the point supported by `kimi_peer_review-r2.md`.

**Validation rules**

- Reject traversal, absolute member paths, paths escaping the configured root, and unsafe symlink destinations.
- Reject contradictory membership and incomplete grouped units.
- Unsupported schema or malformed JSON is not an empty manifest.
- Unknown provenance does not mean unknown content: bytes can still be hashed.
- Unusable control metadata must not authorize destructive operations. Preserve the bytes and report a retryable metadata problem.
- Limits on manifest size, entries, group members, and thumbnail decoding must prevent a malformed remote file from exhausting the handheld.

### 3.4 Manifest transport is ownership-aware

The shipped allowlist would carry every manifest under `savestates/`. Bulk copy does not enforce the rule “each device writes only its own.” [S29, S30, S32]

Therefore:

- Upload only this device’s manifest from the metadata namespace.
- Ordinary downloads exclude this device’s manifest from replacement.
- Foreign manifests are downloaded as validated, read-only observations; they are never uploaded by their readers.
- Publish payload and the owned manifest in the same batch when the tested filter interface permits it.
- A manifest describing locally captured bytes is not a promise that those bytes already occupy the canonical cloud path.

The preferred implementation is exact file selection and ownership filters inside existing batches—not one rclone process per metadata file. If the relevant filter ordering or exact-path interface cannot express that safely, correctness wins over a claimed process budget; the measured extra batch is exposed under the D-CLOUD-028 refinement.

**Reflash special case**

A genuinely new device has no own cloud manifest. A reflash may regenerate an existing device identity, including its prior naming behavior. Its previous manifest must be read and reconciled before an own-manifest replacement, **but local capture must not wait for the network**. Keep new offline observations locally until bootstrap reconciliation can combine them honestly. [S03, S04, S34]

A same-ID manifest fork is not resolved by time or generation number alone. It can indicate a cloned card or stale own-file publication. Preserve both observations and refuse blind own-manifest replacement. The corpus does not supply a complete identity-collision detector; the cloned-card experiment is mandatory.

---

## 4. Classification, deletion, and resolution

### 4.1 Agreement is a scoped observation

Agreement means:

> At a verified reconciliation point, this device and this cloud destination held this version of this save unit.

It is not a last-run stamp and not an upload-success return code.

Bind it to:

- the selected remote’s storage identity and relevant endpoint/root configuration;
- the canonical cloud save prefix;
- the local root and storage identity;
- the unit’s complete member set;
- the verified content version.

Credential refresh should not invalidate agreement merely because a token changed. Changing a bucket, endpoint, cloud folder, local card, or save root must not silently reuse the old conversation.

Write agreement:

- after verified upload;
- after verified download;
- after verified equality with no transfer;
- after verified completion of a recorded operation.

Equality-establishes-agreement is necessary for first run, repaired state, and reflash. The current schema omits it. [S03 §§2–3, S33]

### 4.2 The classifier

For a coherent unit, let **L** be local content, **C** cloud content, and **A** last agreement. “Absent” below means absence established by a complete, successful observation—not a failed listing or missing mount.

Operation records are evaluated before a generic equality or one-way branch.

| Situation | Action |
|---|---|
| Root, listing, content identity, or required unit membership cannot be established | Preserve; mark pending/error. No destructive action. |
| A valid pending move/retirement record applies to exact version X, and its required preservation/destination checks pass | Complete that operation idempotently. |
| A retirement for X encounters Y at a relevant path | Conflict or stale operation; never treat the record as permission to remove Y. |
| A completed resolution applies to the exact observed versions | Reconcile to its verified outputs, preserving displaced copies. |
| Two resolution records choose different outputs for the same unresolved pair | Ask; no timestamp or device-priority winner. |
| L = C, with no outstanding operation changing that result | Establish/refresh agreement; transfer nothing. |
| L ≠ C, L = A | Cloud changed; verified, preimage-preserving download. |
| L ≠ C, C = A | Device changed; verified, preimage-preserving upload. |
| L ≠ C, both differ from A | Genuine conflict. |
| L ≠ C, A unknown | Conservative conflict. |
| Only one side exists, no agreement or retirement establishes a prior shared version | One-way addition after root and unit checks. |
| A previously agreed version is unexpectedly absent on one side, with no applicable operation record | Hold the surviving version; do not infer deletion and do not automatically resurrect indefinitely. Surface an incomplete reconciliation. |
| Both sides are absent | Clear obsolete agreement only after validating the roots and outstanding operation state. Absence alone creates no global delete instruction. |

The schema’s “only one side → transfer” rule therefore remains valid for additions, but not as a universal answer to previously agreed data disappearing. [S03]

A “pending” count must not inflate the wizard’s count of genuine forks. Connection, metadata, and storage problems are distinct outcomes.

### 4.3 Version-specific retirement belongs in V1

The concrete convergence requirement is simple:

1. Cloud has a state at slot 5.
2. A device imports it and later performs a legitimate ES renumber to slot 3.
3. Both paths can then exist in the cloud.
4. Local compaction alone removes slot 5.
5. A rule that always restores cloud-only paths brings slot 5 back forever.

That is incompatible with a useful implementation of D-CLOUD-030. The exact exit path must be tested, but the synchronization loop itself follows from the proposed rules.

**V1 retirement records are produced only by:**

- an explicit save-management delete action whose synced-library effect is made clear;
- a verified ES move/renumber;
- verified duplicate compaction.

They are **not** produced by a directory scan noticing a missing file.

For a move, the recorded destination becomes canonical only after the same version is verified there. If another version occupies that destination, do not overwrite it to satisfy the move. Concurrent equivalent placements can be compacted using D-CLOUD-030’s lower-numbered-copy rule, once every relevant version is preserved.

For a deletion, the record names the exact version the user removed. A remote edit is a delete/edit conflict, not collateral permission.

Every retirement:

- has an idempotent operation identity;
- requires successful artifact checks;
- preserves required bytes before removing a live name;
- is subject to an unexpected-deletion-set guard;
- is audited before the destructive step and recorded as complete afterwards.

Do not expire these records merely because the discard-retention count rolled over. An offline handheld must still learn why an old path was retired. V1 may retain these small records without automatic garbage collection; reaching a control-state limit should stop mutation rather than silently discard correctness state.

### 4.4 Keep a narrow resolution receipt

I retain this part of V1, agreeing with `kimi_peer_review-r2.md` and disagreeing with its deferral in `claude_peer_review-r2.md`.

The sequential reversal requires no concurrent gameplay:

- A and B diverge from X.
- A chooses A’s version.
- B later chooses B’s version.
- A’s next ordinary three-way pass can interpret B as a one-sided cloud change and silently reverse A’s choice.

An audit line alone cannot prevent that.

A receipt records the exact operand hashes and chosen output locations. It is not a vector clock or a general lineage database. Its purpose is to distinguish:

- application of the same completed choice on another device;
- resurrection of a specifically rejected version;
- a later genuinely new version;
- an explicit conflicting choice.

A newly confirmed reversal names the prior decision it supersedes. Old choices do not permanently veto later player intent, and dates do not resolve contradictory decisions.

---

## 5. Learning C without turning every exit into a full restore

### 5.1 Equality evidence

Use the backend’s native hash as a shortcut only when it has a **content-verified association** with the stored-byte SHA-256 for the same remote context.

Otherwise, fetch the relevant bytes into fresh or explicitly refreshed staging and hash them.

In particular:

- Size is a useful inequality check, not equality proof.
- Mtime is a useful scheduling hint, not equality proof.
- Hashless **with modtime** still cannot certify a preserved-mtime change.
- Hashless **without modtime**, as on the QA WebDAV, cannot safely reuse a size-only staging copy.
- A successful copy command that skipped stale staged bytes is not a content observation.

This is stricter than the hashless-and-no-modtime-only fallback suggested in `claude_peer_review-r2.md`. Its candidate-scoped principle is correct; its proposed equality boundary is not sufficient for the preserved-mtime fixture.

Sources: `repo/docs/save-manifest-schema.md` [S03]; `repo/docs/save-manifest-alignment-review.md` [S04]; `repo/.claude/rules/engineering-practices.md` [S10]; `.../cloud_backup` [S29].

On a **full** reconciliation, a backend without a usable content token may require reading every overlapping candidate unit. Do that in bounded batches, not by maintaining an unquestioned second full-library mirror.

### 5.2 The concrete game-exit path

1. **Capture locally**, as specified above.
2. If no content, placement, or meaningful owned metadata changed, perform no remote work for the exit push. Say **“No new saves to upload”**, not “The cloud is fully in sync.”
3. If automatic exit sync is disabled, stop after capture.
4. If the relevant remote is definitely unreachable locally, retain pending work and return promptly.
5. Take the cloud lock; obtain or use a sealed snapshot of the changed units.
6. Read cloud evidence for those units and the control records needed to classify them.
7. Upload only device-changed or safely new units. Conflicts and uncertain comparisons remain pending.
8. Batch the owned manifest with authorized payload where supported.
9. Verify the destination artifacts.
10. Advance agreement only for verified units. Preserve dirty state for anything not verified.

A non-overwrite option can help protect a normal first-addition case, but it must not be described as cross-device compare-and-swap. The concurrent first-create fixture remains part of the preservation test.

**Budget**

The no-local-change path should be no worse than the corpus’s approximately five-second H700 baseline and should avoid the rclone startup entirely when possible. The changed path may require an evidence batch, a transfer batch, and a verification batch; hashless or uncached cases can require more work.

I do not claim an unmeasured “two-spawn maximum.” Measure:

- one changed SRAM;
- one state plus PNG;
- five foreign manifests;
- warm and cold metadata caches;
- native-hash and hashless backends.

Do not add a standalone post-upload listing merely to fill `remote_hash` in the just-uploaded manifest. Keep verified observations locally and publish them on the next natural metadata update. A manifest with `remote_hash: null` is valid.

If work cannot complete within the approved interaction budget, leave it pending and say so. Do not recover the budget by skipping content verification or calling a queued save “uploaded.” [S03, S04, S06 D-CLOUD-028, S09]

### 5.3 No default route is not definitive “no network”

The current uploader returns exit 4 when there is no default route. A directly connected LAN remote can still be reachable. [S29]

The successor may use a cheap local test when it can establish that the selected remote has no usable path. Uncertainty should lead to a bounded real operation or a truthful pending outcome—not a false assertion that no network exists.

The LAN-only test must be run before inheriting the present skip behavior.

---

## 6. Replacement safety and the concurrency contract

### 6.1 The chosen V1 mechanism

**Use archive-before-replace, not a mandatory protected-publication protocol.**

For an authorized transfer:

- the source is sealed;
- expected destination content is recorded;
- the destination is revalidated as close to replacement as the transport permits;
- displaced bytes are preserved;
- the resulting artifact is verified;
- agreement is written last.

Use:

- a reserved remote sibling of the save payload for remote preimages;
- `/storage/.cache/cloud_sync/discarded/` for local retained copies;
- unique device/transaction components, not a timestamp alone.

The remote archive must be outside the synchronized payload and must be proven compatible with the configured remote-root shape. The design must not quietly relocate the player’s cloud folder to make an archive flag work.

`--backup-dir` is the preferred transport mechanism for preserving remote replacements when its behavior is established. Local replacements can use the same facility where applicable or the checked local commit machinery.

### 6.2 What this does—and does not—guarantee

The source corpus supports rclone’s existing archive use in one uploader mode. It does **not** establish all of the following:

- preservation when two writers both observed an absent destination;
- preservation when an intervening writer changes the destination after the precheck;
- behavior when killed between archival and replacement;
- atomic preservation of a multi-file unit;
- the safety of retrying a partially completed remote move;
- zero additional latency.

These are mandatory capability tests, not claims to repeat.

**Accepted V1 contract:** under the project’s single-player handoff model, operations preserve verified preimages and complete save units, fail closed on observed changes, and make unexpected overlap recoverable where the tested transport mechanism supports that property.

**Not claimed:** linearizable synchronization or an unconditional all-backend guarantee against arbitrary overlapping writers.

If that stronger guarantee is required, non-overwriting protected publications become load-bearing and their cost must be approved. Consensus that they are expensive cannot make the guarantee free.

### 6.3 Outcome of the preservation gate

- **Mechanism passes, with understood semantics:** enable the tested archive-before-replace path.
- **Mechanism is unsupported or remains ambiguous:** allow observation and safe local staging, but do not enable canonical replacement on that path.
- **A test loses an unreviewed competing head or produces an unrecoverable unit:** stop activation. Either adopt a measured, narrowly scoped protected-publication design or narrow automatic support. Never fall back to unchecked copy.

Archive anomalies must create a pending recovery item. A record saying what the worker *expected* to archive is not evidence of what it actually preserved.

Unreviewed competing heads and incomplete transactions are never automatically pruned by the ordinary discard count. If preservation space is exhausted, the operation stops; it does not evict the only unresolved copy.

---

## 7. Merge and interrupted apply

### 7.1 The checked merge contract

The following are source-visible:

- Auto-only repositories can fall through `getNextFreeSlot()` to `-99`.
- The allocator reads cached repository state.
- `copyToSlot()` ignores the copy/rename return values.
- Explicit full-path filename generation uses the source’s parent directory.
- Standalone emulator states are not generally supported by the current repository’s `isEnabled()` check.

Sources: `es/SaveStateRepository.cpp` [S37]; `es/SaveState.cpp` [S38]. The relevant header default arguments are not embedded.

The adapter must satisfy these acceptance criteria:

1. **Correct repository:** allocate within the intended game/core configuration. An unsupported standalone state does not gain KEEP BOTH merely because it has a state-like extension.
2. **Fresh occupancy:** refresh before planning; account for every relevant cloud-only state and every slot reserved earlier in the same plan.
3. **Correct empty/auto-only behavior:** when no numbered state exists, allocate from `firstslot`. Fix the allocator; do not invent a 99-slot product cap.
4. **Explicit destination:** compute the live destination from the repository configuration, not from a temporary download’s parent.
5. **No overwrite during allocation:** verify local and cloud destination availability again before commit. A changed destination invalidates the plan.
6. **Verified state/PNG pair:** copy with checked results, verify hashes and expected paths, and preserve the original until the operation is durable.
7. **Defined auto KEEP BOTH result:** the device resume point remains at `.state.auto`; the cloud resume point becomes a numbered state with its PNG. The plan explicitly shows which resume point will remain canonical and how both versions will exist on both sides.
8. **Idempotent recovery:** a failed or repeated apply cannot allocate a second copy merely because the first attempt’s status update was interrupted.

Automatic duplicate compaction never collapses an auto resume point into a numbered state. Different games, cores, or save containers are not deduplicated merely because their bytes happen to match.

### 7.2 The pre-pass gate

Before the walkthrough becomes actionable:

- reconcile independent non-conflicts;
- download and represent the cloud-only numbered states needed to establish slot occupancy;
- validate complete units;
- freeze the conflict operands, destination reservations, and relevant cloud observations.

If that pre-pass is interrupted or incomplete, do not open a wizard that offers an unsafe KEEP BOTH.

The pre-pass is necessary, not sufficient: another device can change the cloud while the player is deciding. COMPLETE must revalidate the inputs and destinations. A changed plan is refreshed rather than applied against stale assumptions.

A state and an SRAM file are not assumed independent merely because they are different files. The state-load/SRAM experiment determines whether related decisions need to be held together.

### 7.3 One frozen plan doubles as the journal

The plan records:

- transaction identity and endpoint context;
- exact unit inputs;
- chosen outcomes;
- intended destinations;
- locations and hashes of retained copies;
- per-unit stage;
- outstanding verification and agreement updates.

Before COMPLETE, choices are disposable. After COMPLETE starts mutation, recovery uses this plan until all affected units are coherent.

Local temporary files must be created on the destination filesystem when atomic rename is required. A state and PNG are not an atomic pair; a populated directory generally cannot be assumed replaceable atomically; cloud directory rename is not a generic multi-object transaction.

Therefore:

- stage and verify all members;
- preserve preimages;
- commit in an order defined for that unit;
- block access to an incomplete live unit;
- verify the resulting unit;
- write agreement last.

After a crash, inspect actual hashes and membership. If the unit is fully old, fully new, or safely repairable from retained copies, complete or roll it back idempotently. Otherwise keep it unavailable for mutation and present native recovery. Do not discard the plan simply because a fresh scan produced another plausible classification.

The audit log remains the human-readable record, not the transaction authority. Its rotation cannot erase recovery state. [S06 D-CLOUD-027, S10, S11]

---

## 8. Presentation and recovery

Retain the settled presentation choices:

- system → game walkthrough;
- cloud always left;
- screenshot for a state, save glyph for an in-game save;
- device/model, date/time, and emulator/core/build where known;
- no file size or play-time heuristic;
- KEEP LEFT / KEEP RIGHT / KEEP BOTH;
- KEEP BOTH disabled with a reason where unsupported;
- optional review before applying.

Sources: `repo/docs/conflict-wizard-ia.md` [S02]; `repo/.claude/rules/es-native-ui.md` [S12]; `issues/issue-23.md` [S24].

### Triggering

- **Interactive SYNC:** after a successful pre-pass, enter the walkthrough as part of that operation.
- **Boot/game exit:** record pending conflicts and report them on the existing status surface. A persistent cloud-settings entry opens the walkthrough.
- **Kid/kiosk mode:** preserve divergent data and retain pending state. Resolution may require unlocking the full UI; do not add a destructive configuration surface solely to bypass the mode’s design. [S13]

### Cancellation wording

Adopt the precise statement identified in `claude_peer_review-r2.md`:

> Before COMPLETE, no conflicting save or its dependent files are changed on either side. Quitting discards the pending decisions. Independently reconciled files from the completed pre-pass remain synced.

Staging cloud bytes for comparison is permitted; replacing a conflicting live save before COMPLETE is not.

### Retention and recovery

“Keep discarded saves” defaults on under the proposed refinement. Its count limits completed, deliberately discarded versions—not transaction preimages still needed for correctness.

Turning it off does not disable crash safety. It permits disposal of an explicitly rejected version only after the selected outcome has been safely applied.

V1 needs a minimal native recovery route for retained decisions and detected archival anomalies, reusing the same comparison/apply machinery. A directory of bytes recoverable only through SSH is not a complete console-first escape hatch.

The broad #25 timeline, arbitrary historical snapshots, and full rollback browser remain V2.

### Honest outcomes

Replace raw rclone status forwarding with typed backend outcomes:

- no local changes;
- completed and verified;
- skipped because another operation owns the lock;
- skipped because the remote is definitely unreachable locally;
- conflicts pending;
- partially completed/pending verification;
- failed.

The existing collision is real: rclone’s 3/4 can pass through script `clean_exit`, write stamps, and be displayed as friendly skips by `ThreadedCloudSync`. Both scripts also return the saves-phase status even when the system phase failed. [S29, S30, S40]

Keep rclone’s raw code in diagnostics, not in the UI protocol. A success stamp must name the operation actually verified.

---

## 9. Namespace, scope, and cutover

### 9.1 #10 stays in the drop

I reject deferring physical core isolation beyond the feature drop merely because the wizard can read a `core` field.

A flat shared filename can collide **before the cloud engine sees it**. Metadata cannot recover a state already overwritten locally by another core. D-CLOUD-017 remains justified.

However, shipping `es_savestates.cfg` is not a harmless path substitution:

- `Default()` enables `racommands`, auto-save, and incremental behavior.
- The XML parser hard-codes `racommands=false`.
- Auto-save and incremental defaults differ.
- Core/emulator command rewriting becomes relevant.

These are source-visible behavior changes. [S38, S39]

The implementation must prove:

1. ES discovers both existing flat states and new core-specific states.
2. RetroArch writes where ES looks.
3. New-game, numbered-state, and auto-resume launches retain intended semantics.
4. Actual launched-core provenance remains accurate.
5. Unknown legacy provenance is not silently assigned to the default core.
6. Interrupted materialization and downgrade/mixed-reader cases preserve old data.

If the XML path cannot preserve behavior, change the appropriate resolver/configuration behavior deliberately; do not ship a naive config because the directory template exists.

A passing chipset test narrows compatibility warnings. It does **not** make #10 unnecessary, despite that stale conclusion in the bench document. [S06 D-CLOUD-017/025, S08]

### 9.2 Enforce scope at the transport boundary

The new engine must not inherit arbitrary `RCLONEOPTS`, `BACKUPMETHOD`, or a mutable filter file as its safety policy.

The embedded configuration contains `--delete-excluded`; each existing script strips it independently. A new consumer can inherit it. User rules are placed ahead of defaults, so a defaults-file exclusion is not unconditional. [S29–S33]

Use:

- a fixed maximum save scope;
- user selection only to narrow that scope;
- exact planned paths;
- mandatory exclusions for internal state, transients, foreign-conflict artifacts, and non-save tiers;
- an assertion that effective restrictions are present before every transport operation.

State thumbnails belong to their state unit. Ordinary screenshots must not be mistaken for state evidence. Their collisions can be preserved separately without introducing a recency exception into save resolution.

The discard store remains outside the sync root. If #25 later adds an in-tree snapshot layout, its exclusion must be enforced at the actual transfer boundary, not merely inserted into defaults.

### 9.3 Unequal backup and restore roots

The shipped configuration documents a different restore root as a way to avoid replacing live data. [S33]

Therefore:

- two-way reconciliation requires compatible, explicit endpoint roots;
- an alternate restore root remains an **import destination**;
- import does not write agreement for the live save tree;
- import does not overwrite differing pre-existing destination data without preservation and a decision.

Do not silently rewrite this setting and do not reject all downloads merely because the two-way engine cannot model it.

### 9.4 Migration and old writers

D-CLOUD-029 remains binding until #22 replaces the paths. The honest development posture is isolated test storage and, if the maintainer chooses, disabling automatic sync on live libraries. Keeping only exit upload is not a no-loss guarantee.

Cut over in stages:

1. Build capture and observe locally.
2. Run the classifier in read-only shadow mode.
3. Enable the guarded exit push.
4. Route startup, menu, Tools, and savestate-manager operations through the same backend.
5. Enable the walkthrough and checked merge.
6. Complete and validate #10.
7. Activate the feature only after the end-to-end gates pass.

Before activation, inventory every caller and re-home its guards, settings, cadence, and stamps. Preserve the two user workflows affirmed by D-UI-018/020 rather than deleting “duplicate” surfaces again. [S06, S07, S10, S13]

A new device cannot stop an old binary on another device from running its old overwrite. The initial maintainer rollout must therefore update or disable old writers deliberately. This plan does not claim mixed-version writer safety merely because new readers understand old files.

---

## 10. Proof order

### 10.1 Before production implementation: substrate experiments

Test fixtures and instrumented test builds are permitted here. They are not an excuse to implement the production wizard before its assumptions are checked.

| Gate | Experiment and artifact | Where | What it gates |
|---|---|---|---|
| **P0 — Safe test channel** | Repair the round-trip runner; preserve/restore configuration in cleanup; validate the destination before replacing configuration; fix dated-archive expectations; create the tar artifact it tests; use valid content-system fixtures; preserve complete command output. Run baseline scenarios with explicit expected failures. | Disposable GENERIC_X64 VM; loopback WebDAV and MinIO | Every destructive experiment; #22 implementation |
| **P1 — Actual save lifecycle** | Numbered launch, auto launch, new-game launch; capture directory contents and hashes before/during/after. Introduce a delayed boot sync. Test `.auto.bak`, provisional slots, SRAM changes, and cleanup. Exercise auto-only allocation and a failed destination copy. | RG35XX SP on disposable data; second H700 where useful | Lifecycle gate, capture placement, #24 |
| **P2 — rclone contract** | Run the bisync and targeted-copy matrix below, including archive-before-replace and interrupted verification. Preserve raw output, resulting bytes, and workdir state. | VM/WebDAV/MinIO first; then H700/Dropbox; two H700s for overlap | Transport selection, deletion/retention mechanism, changed-path budget |
| **P3 — Launch/layout and save-unit inventory** | Rehearse core-directory changes; record actual launch commands and write locations. Inventory standalone save membership. Test state loading followed by SRAM flush. Check effective core/package pins and mapping exceptions. | H700 first; relevant second target and standalone emulators | #21, unit boundaries, #10 |
| **P4 — Compatibility** | Same-build, same-core H700 control first; then directed cross-family pairs, another core, a core-version mismatch where available, and controlled corruption. Observe continued behavior, not only initial load success. | H700 pair, RG351M, RG353M, as availability is confirmed | Badge severity; compatibility claims |
| **P5 — Cost and recognition** | Measure local hashing and candidate-scoped transport on a copy of the actual library. Display real cloud/device thumbnails, long labels, unknown metadata, and the auto-resume choice at both panel sizes. | H700 and physical RG351M | D-CLOUD-028 refinement, #23 layout |

The facilitator’s corpus reports the broader bench; it does not establish present physical availability. If a device or second core build is unavailable, record the missing test rather than declaring that axis settled.

### 10.2 Bisync’s decision gate

The matrix includes:

- compressed state plus PNG;
- equal-size SRAM changes;
- preserved-mtime changes;
- cloud-only and device-only additions;
- device rename and compaction;
- explicit deletion and unexplained absence;
- a genuine fork;
- first run;
- filter/root change;
- interrupted run;
- external manual equalization after a resolution;
- another device modifying the remote between observations.

Question zero is: **what does `--conflict-resolve none` actually do to payload names and bytes?**

Also establish:

- whether a supported, machine-readable plan can be consumed;
- whether external resolutions can be accepted without unsafe reinitialization;
- what `--recover` and `--resilient` actually recover;
- whether any automatic `--resync` would be needed;
- whether internal listing state can disagree with the authoritative agreement record;
- total measured cost.

**Outcome**

- If bisync satisfies the contract and materially simplifies full-pass transport, it may be adopted behind the classifier.
- If it mutates conflict paths, relies on unsafe reinitialization, cannot accept external apply coherently, or is too expensive, use targeted rclone copies.
- In neither case does bisync become an unexamined second authority.
- No production error handler invokes `--resync` automatically.

The corpus contains no upstream 1.75.0 implementation, authoritative documentation, or roadmap. I therefore make no claim about what a future release will fix. The same conformance matrix should gate future adoption. [S01, S05, S16, S23]

### 10.3 Before activation: behavior gates

After implementation:

1. **Shadow census:** record verified verdicts, pending reasons, auto/numbered/save frequencies, unknown provenance, and timing. Inject known positives and negatives; classify a disagreement as a bug when the result differs from the verified three-way/operation table.
2. **Fault campaign:** interrupt each local and remote apply stage, fill storage, fail PNG writes, corrupt a manifest, change a destination during the walkthrough, and replay pending operations.
3. **Whole-entry-point test:** boot, exit, upload, download, sync, bundle transfer, and savestate-manager sync all preserve constructed forks.
4. **Cross-device convergence:** resolve, sync the other handheld, sync both again; no duplicate resurrection, rejected-version reversal, or repeated allocation.
5. **Populated upgrade and clean install:** actual prior state, custom filters, alternate roots, old manifests, and core-layout transitions.
6. **Hardware end-to-end:** pass before upstream publication under D-QA-001.

The round-trip harness is not currently evidence of these behaviors. Its embedded implementation overwrites `rclone.conf` before checking the remote and does not restore it; several fixture expectations no longer match the uploader. Run it only after P0, never against the maintainer’s configured handheld as supplied. [S27, S36]

---

## 11. Closure plan for all eleven known unknowns

| Known unknown | Measurement and device | Decision / required point |
|---|---|---|
| **1. Chipset compatibility and silent failure** | P4: H700 control, then same-build cross-family runs and continued execution; corruption and version tests separately | Badge severity before #23 badge design. A passing sample is per-core evidence, not a universal compatibility theorem. |
| **2. Bisync, listings, interruptions, and duplicate agreement state** | P2’s raw-output/workdir/content matrix on VM backends and H700/Dropbox | Before choosing a production bisync role in #22. Targeted copies remain the safe implementation path if its contract fails. |
| **3. Auto-state conflict frequency** | P1 lifecycle traces plus shadow census segmented by launch type | Label autos as resume points, but do not assume they are written or retained on every exit. Tune presentation after observation. |
| **4. KEEP BOTH pre-pass and interruption** | Import a high cloud-only slot; interrupt pre-pass; introduce another cloud slot while the walkthrough is open; apply and sync twice | #24 and #23 cannot activate until allocation and revalidation pass. |
| **5. Missing `es_savestates.cfg`, two layout consumers** | P3 actual discovery, launch, write, resume, and cleanup traces on H700 | Before #10 implementation is committed to the XML approach; before release. |
| **6. Core pin and actual launched core** | Diff effective package/core sets; inspect emitted image artifact; run default and overridden-core launches | Before #21 is considered accurate. Unknown is allowed; misattribution is not. |
| **7. `BACKUPPATH == RESTOREPATH`** | VM fixture with split roots, cloud-folder change, remount, and restored agreement | Two-way refuses mismatched contexts; import remains available without live agreement. |
| **8. Multi-file standalone saves** | Stable member/hashing inventory for PPSSPP, VMU, N64, and PSX cases; interrupt member transfer; state-load/SRAM test | Before enabling automatic writes for that adapter. Unknown grouping remains pending, not file-by-file “success.” |
| **9. 480×320 recognition** | P5 physical RG351M recognition task with real examples, unknown data, and long source labels | Before #23 layout acceptance. Add a full-image inspection affordance if necessary; do not silently abandon the fixed cloud-left comparison. |
| **10. Two devices online** | P2 simultaneous first-create, replacement, delayed writer, contradictory resolution, and kill-stage tests | Enable only the preservation contract the mechanism supports. No claim of distributed locking. |
| **11. Never-run suite** | P0 corrected runner, then both backends and added artifact-based cases | Before #22 production work and again before activation. Step count is not coverage evidence. |

---

## 12. Additional failures worth exposing cheaply

These are hypotheses or source-derived hazards not settled by the existing acceptance claims.

| Failure | Cheapest revealing experiment | Required response |
|---|---|---|
| Archive names collide because two devices share a timestamp or wrong clock | Same-second replacements from both H700s with skewed clocks | Device/transaction-unique archive names; no clock-based uniqueness assumption |
| Native archive operation is copy/delete, not an indivisible move | Interrupt archive/replacement at each stage on the actual backend | Preserve and verify; disable unsupported destructive path |
| Screenshot is old although its recorded hash is valid | Delay or suppress PNG production while changing a state | Treat binding as observed pairing, not semantic proof; show a missing/untrusted image rather than a misleading substitute |
| Complete group cannot be reconstructed from stale manifest union | Different member sets from two device generations, plus an unmanifested member | Capture explicit coherent membership; no union of incompatible generations |
| A legitimate save unit includes an excluded database | Plant a grouped unit whose required member is excluded by the default database rules | Mark incomplete and investigate a safe adapter; never silently omit the member |
| Case-folding or Unicode normalization aliases distinct paths | Two names distinct locally but potentially equivalent remotely | Refuse collision; no overwrite or fabricated identity match |
| Same ROM basename in different directories/core repositories is paired incorrectly | Two different games or revisions with the same basename | Use actual launch identity and repository scope; do not merge by basename alone |
| Save root is present but is the wrong mounted card | Swap/unmount the save card while retaining agreement | Root/storage binding; absence cannot authorize retirement |
| An empty or partial remote listing looks like a clean library | Fail authentication/listing mid-pass; use a definitely nonexistent prefix | Typed unknown/error, not “nothing there” |
| A cloned card creates two writers of one manifest | Copy the stored device identity to the second test device and diverge | Preserve the manifest fork and refuse blind own-file publication |
| ES crashes while its emulator continues | Kill ES during gameplay, then request a cloud restore | Lifecycle protection must cover the surviving emulator |
| A core pin is unchanged while a patch or option affects serialization | Compare effective build inputs; exercise selected state-affecting settings | “Same pin” remains compatibility evidence, not a guaranteed-safe badge |
| Guard omitted by nonempty custom options or overridden includes | Remove `--filter-from`; add a broad user include; plant ROM and transient controls | Mandatory transport scope must still exclude them |
| Remote path or JSON member escapes the staging/live root | Malformed-path and symlink fixture | Validation fails closed before any write |

The test store, retained bytes, and pending plans are **not disposable caches**, despite residing below `/storage/.cache/`. Schema rebuilding may replace an index or agreement file; it must never recursively clear irreplaceable retained saves.

---

## 13. Release boundary

### Must ship in V1

- unconditional, honest capture;
- scoped agreement and content-based classification;
- ownership-safe manifest transport;
- save-unit and screenshot integrity;
- lifecycle gating plus the cloud lock;
- mandatory transfer scope;
- guarded replacements and recoverable retirement;
- narrow operation/resolution records;
- checked KEEP BOTH;
- frozen-plan crash recovery;
- queued conflicts, typed outcomes, and minimal native recovery;
- safe migration of every save-writing entry point;
- core namespacing with legacy reads;
- corrected tests and hardware evidence.

### May follow later

- broad #25 snapshot/history UI;
- immutable protected remote heads, unless the preservation gate makes them necessary;
- distributed leases, consensus, or compare-and-swap emulation;
- generalized causal histories;
- semantic SRAM or memory-card merging;
- automatic progress heuristics;
- a SQLite history index;
- proactive launch-time conflict resolution beyond protecting a live write;
- remote-hash conveniences that add cost without changing correctness.

**Final position:** the project has chosen good identity and presentation primitives, but it has not yet proven a safe writer. Build and test that writer first. Neither a unanimous architectural preference nor a successful rclone exit code is permission to overwrite player progress.

---

## `corpus.provenance.json`

The arrays below are positional: item *n* in `source_file_paths` is paired with item *n* in `source_file_hashes`, corresponding to `S01`–`S42`. Hashes are the Facilitator’s **sha256 values verified at embed time**, not hashes computed by this member.

```json
{
  "artifact": "gpt-revised_plan-r2.md",
  "role": "council member, round-2 revised approach",
  "corpus_mode": "verbatim embedded read-at-time corpus supplied by Council Facilitator council-facilitator@1.2.0",
  "source_count": 42,
  "manifest_read_timestamp_utc_as_supplied": "2026-09-05T17:32:51Z",
  "member_filesystem_access": false,
  "member_independently_reread_files": false,
  "member_independently_rehashed_files": false,
  "member_executed_commands_or_hardware_tests": false,
  "hash_basis": "sha256 values copied from the supplied per-source headers; verified at embed time by the Facilitator",
  "citation_mapping": "S01 through S42 correspond to the ordered, same-index source_file_paths and source_file_hashes arrays",
  "injected_review_artifacts": [
    "claude_peer_review-r2.md",
    "gemini_peer_review-r2.md",
    "kimi_peer_review-r2.md",
    "mistral_peer_review-r2.md"
  ],
  "injected_review_hashes_provided": false,
  "earlier_revised_plan_files_embedded_in_this_round": false,
  "peer_material_use": "Critique and attribution only. Claims about implementations are evaluated against the source corpus; peer agreement is not treated as empirical evidence.",
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
  "gaps_for_orchestrator": [
    {
      "material": "Authoritative rclone 1.75.0 bisync, copy, backup-dir, filtering, and verification documentation or implementation; relevant upstream roadmap if future direction is to influence the choice",
      "reason": "Transport mutation, recovery, archive ordering, and capability claims remain experiments until this evidence exists.",
      "declared_source_path": null,
      "sha256": null
    },
    {
      "material": "SaveState.h, SaveStateRepository.h, FileData.h, GuiSaveState.cpp, Paths.cpp, and the filesystem copy/rename utility implementations",
      "reason": "Default arguments, deletion hooks, launch ownership, timestamp behavior, and final destination semantics are not fully inspectable from the supplied excerpts.",
      "declared_source_path": null,
      "sha256": null
    },
    {
      "material": "Full launch-command construction, RetroArch setsettings.sh, shipped retroarch.cfg and es_systems.cfg, and effective emulator/core build recipes",
      "reason": "Needed for the two-consumer directory change, actual launched-core capture, save-unit inventories, and effective core-pin emission.",
      "declared_source_path": null,
      "sha256": null
    },
    {
      "material": "cloud_sync.conf.defaults, cloud_sync-rules.txt.defaults, post-update integration, cloud_content_backup, cloud_content_restore, cloud_setup, backuptool, and tools/cloud-test-backend",
      "reason": "Cross-tier, upgrade, archive, seeding, and test-isolation claims cannot all be independently checked from summaries or caller code.",
      "declared_source_path": null,
      "sha256": null
    },
    {
      "material": "GuiMenu.cpp and the other complete cloud entry-point implementations",
      "reason": "The complete writer inventory and menu command composition are described by the corpus but not fully embedded as implementation.",
      "declared_source_path": null,
      "sha256": null
    },
    {
      "material": "docs/es-ui-style-guide.md and actual 480x320/640x480 visual test artifacts",
      "reason": "Needed for final visual acceptance; no recognition result is established by the corpus.",
      "declared_source_path": null,
      "sha256": null
    },
    {
      "material": "Unambiguous current issue bodies and acceptance criteria",
      "reason": "The supplied issue exports are comment-thread shaped; body amendments described in the futro cannot all be independently confirmed.",
      "declared_source_path": null,
      "sha256": null
    },
    {
      "material": "Hardware run logs, current bench availability, and the newly available GENERIC_X64 image identity",
      "reason": "The prompt reports availability but supplies no completed run evidence for the proposed foundation.",
      "declared_source_path": null,
      "sha256": null
    }
  ],
  "missing_source_policy": "No missing source paths, hashes, file contents, or execution results have been fabricated."
}
```