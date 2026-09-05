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