# gpt_peer_review-r4.md

## Review posture and conclusion

I reviewed the four injected **current** plans against the embedded source corpus. I did not access a filesystem, recompute hashes, or run tests. References such as **[S03]** identify the exact declared path and embed-time SHA-256 recorded in the provenance block below. References to earlier plans inside the injected documents do not supply missing specifications or evidence.

**I would use `claude-revised_plan-r3.md` as the editing baseline, not as an implementation-ready specification.** Its game-addressed retention store, sealed upload staging, and game-lifetime exclusion are the strongest foundation. Before building, I would integrate several concrete provisions from `kimi-revised_plan-r3.md`, the explicit event timestamp and verification-deferral policy from `gemini-revised_plan-r3.md`, and the thumbnail classification rule from `mistral-revised_plan-r3.md`.

The important conclusions are:

- **The basic architecture has converged.** All four choose an application-owned reconciler, rclone transport, content identity, local agreement, and a retained-copy store outside the sync tree.
- **None of these current plans still requires a version-one undo control.** There is no reason to penalize them for earlier positions. The remaining amendment costs are predominantly retention-schema work.
- **Two stores are close to the future reader requirement; two need more substantial completion.** None should be accepted merely because its document says that the reader test passes.
- **Several correctness holes remain more important than the remaining plan differences:** incomplete retention of multi-file units, circular remote-hash verification, losing upload retries behind the idle fast path, and recovery that trusts a phase label more than actual files.
- **Nothing architectural remains between `claude-revised_plan-r3.md` and `kimi-revised_plan-r3.md` once the corrections below are integrated.** Their remaining differences are mostly fields, ordering, storage layout, or replaceable policy rules.

---

## 1. Walk the future restore reader through each store

### The reader contract

For the maintainer’s primary use case, “newest first” should mean **most recently retained by a completed decision**, with the save’s capture time displayed separately. An old save discarded today must not disappear down the list merely because its `captured_at` is old.

The reader needs:

1. A game or shared-container identity and a complete retained save unit.
2. Original path, slot, core, and other compatibility context.
3. Retained bytes and a retained thumbnail, where one genuinely exists.
4. Producing-device information, explicitly unknown when unavailable.
5. Which side won, and the selected action.
6. A durable event order and completion status.
7. References that resolve **inside the retention record**, not back into today’s save tree.

It does **not** need eight generations of ancestry, historical copies of both winners and losers, or a database. A later PAST-versus-NOW comparison can read NOW from the live tree.

One source detail matters to three of the proposals: in the signed manifest, **`device` is top-level, not part of an entry**. Also, `screenshot` is a sync-root-relative path, not a retained-file locator, and the entry contains no screenshot hash. “Copy the manifest entry verbatim” therefore does not, by itself, preserve all the context these plans promise. [S03, §6]

### `claude-revised_plan-r3.md`

**Literal reader walk**

1. Derive the game’s `unit-key`.
2. Open:

   `/storage/.cache/cloud_sync/retained/<system>/<unit-key>/`

3. Enumerate `<device-id>-<seq>/record.json`.
4. Select completed retained records and order them by the persisted sequence.
5. Read the retained operand, producer, decision, winner, original path/slot, and member list from `record.json`.
6. Open the member files and PNG in that record’s directory.

**Unnecessary scanning:** ordinarily none outside that game’s retention bucket. If the game has several separately keyed units, the reader enumerates those units. It need not scan other games, manifests, audit logs, or completed pending records.

**What survives:** the proposed record expressly snapshots both operands’ provenance, the decision, winning hash and destination, retained side, original location, and member information. That is substantially sufficient for the requested single-file picker. This is the strongest reader-oriented layout of the four.

**What does not yet survive the general case:**

- **Files “by basename” can collide inside a multi-file unit.** Two retained members from different directories can share a basename. The record must store collision-free retained-relative paths; `kimi-revised_plan-r3.md` already supplies the better payload layout.
- “ROM filename made path-safe” needs an **unambiguous encoding or a recorded key mapping**, not an unspecified lossy slug. Different names must not acquire one retention bucket accidentally.
- `phase` must be finalized in the retained record itself before the transient pending record is removed. Writing `prepared` once is insufficient.
- Sequence ordering is sound within one issuing sequence domain. The specification should define what happens if a store survives an identity change or is imported from another device; lexical comparison of unrelated per-device counters is not chronology.
- The screenshot reference must explicitly point into the retained directory. The original remote-relative reference can remain as provenance.

The plan’s claim that a reader can “render both panels from `record.json` alone” is broader than necessary: historical winner bytes and its screenshot are not necessarily retained. **Rendering the retained candidate, identifying the historical winner, and comparing against the current live save is sufficient.**

**Verdict:** survives the amendment for the ordinary single-file case; close for general units after small, concrete layout and finalization corrections.

### `gemini-revised_plan-r3.md`

**Literal reader walk**

The store is:

`/storage/.cache/cloud_sync/discarded/<path>/<sha256>`

with `<sha256>.png` and `<sha256>.json`.

For a game whose states have been renumbered or moved into per-core directories, today’s live paths do not identify all historical `<path>` directories. The reader must therefore:

1. Recursively enumerate sidecars under `discarded/`.
2. Read each sidecar’s `system` and `rom`, selecting the requested game.
3. Sort selected records by `resolved_at`.
4. Read `producer`, `winner_side`, and `winner_sha256`.
5. Open the adjacent hash-named payload and PNG.

**Unnecessary scanning:** sidecars and directory entries for unrelated games and historical paths. No unrelated save payload needs to be read.

**What survives:** for a single numbered state, the example explicitly retains game, system, kind, slot, producing-device ID/label, core/build, winning side/hash, resolution time, and run ID. Those particular facts do not depend on a later manifest or audit lookup.

**Missing or ambiguous:**

- There is no complete multi-file unit descriptor or retained member map. A reader cannot reconstruct a coherent `.eep`/`.mpk` or PPSSPP save set from unrelated per-file sidecars without additional grouping.
- A repeated discard of **the same hash at the same path** overwrites the previous contextual sidecar. Content deduplication is reasonable, but content identity is not decision identity.
- `resolved_at` is useful, but a wrong or repeated wall-clock value needs an independent ordering/tie-breaking field.
- The example lacks record schema and completion state.
- Producing model, emulator, clock confidence, and full original provenance are not all retained. The required device identification is present, but reusing the full wizard later would otherwise require filling these omissions from a manifest that may have changed.
- The PNG relationship is conventional rather than an explicit retained artifact descriptor with availability and hash.

**Verdict:** sufficient for a narrow single-file history listing, not yet sufficient for the plan’s whole-unit architecture. Medium-sized, liftable schema work is required.

The done-page wording should also be the maintainer’s narrower statement—**what was discarded and that copies are kept**—rather than implying that a recovery facility is already available in version one.

### `kimi-revised_plan-r3.md`

**Literal reader walk**

The store is:

`/storage/.cache/cloud_sync/discarded/<utc>-<device-id>-<seq>/operation.json`

with payloads beneath their original sync-root-relative paths.

The reader:

1. Enumerates all operation directories.
2. Opens every `operation.json`.
3. Examines its retained-copy records, filtering by game/system or container.
4. Orders matching decision occurrences using the operation sequence, with capture time shown separately.
5. Reads the chosen record’s producer, winner, reason, decision summary, and screenshot descriptor.
6. Opens retained files by prefixing their recorded sync-root-relative paths with that operation directory.

**Unnecessary scanning:** every operation record, including unrelated games, plus unrelated entries within an operation that resolved several games. It need not scan unrelated payload bytes.

**What survives:** the path-preserving payload layout is good. The intended metadata contract includes the decision and origin information, and explicitly separates permanent retention metadata from disposable pending state.

**What needs correction before the assurance is true:**

- “The loser’s manifest entry verbatim” does not contain the listed device fields. Serialize **the entry plus a snapshot of the enclosing producer descriptor**. The screenshot hash must be computed from the retained PNG; it is not supplied by the signed entry. [S03, §6]
- `operation.json` must explicitly group retained files into **complete units**, including unchanged members required to load the selected past version. A bag of individually retained copies is not enough.
- Define sequence persistence and ordering independently of the UTC prefix. Avoid assuming lexicographic directory order means decision order.
- A permanent completion/outcome field is needed. The operation record is written before the destructive step, so its mere presence cannot say that its described discard actually happened.
- Per-unit pruning within a directory containing several games must not remove unrelated retained candidates. Either prune individual unit records carefully or use one retained leaf per unit decision.

For shared containers, `rom: null` is honest, but a reader cannot infer “this game uses this VMU” from it. The unit declaration must supply that association where knowable; otherwise the tool should present **shared save containers**, not attribute them to the last game played.

**Verdict:** close to sufficient and particularly strong on payload placement. The missing producer join, unit grouping, event ordering, and completion field are liftable corrections, not a new storage architecture.

### `mistral-revised_plan-r3.md`

**Literal reader walk**

The store again uses:

`/storage/.cache/cloud_sync/discarded/<path>/<sha256>`

and a `<sha256>.json` sidecar.

The reader must:

1. Recursively enumerate sidecars across all historical paths.
2. Read their game/system fields to select the requested game.
3. Read the intended producer, winner, reason, transaction ID, and decision text.
4. Open the adjacent retained payload and thumbnail.

**Unnecessary scanning:** the same unrelated historical-path and sidecar scan required by `gemini-revised_plan-r3.md`.

**The ordering step cannot be completed as specified.** The sidecar contains capture timestamps, but no specified discard/resolution timestamp or ordered event identifier. A transaction ID with unspecified structure does not solve that. Sorting by `captured_at` would sort save creation, not the user’s most recent decision. Recovering decision order from the audit log would fail after D-CLOUD-027’s rotation. [S06]

Other gaps are the same substantive ones:

- The top-level producer descriptor is not included by copying an entry verbatim.
- There is no explicit complete-unit retention descriptor.
- Repeated path/hash occurrences share one contextual filename.
- Completion state and retained-relative screenshot references are unspecified.
- The store’s non-disposable status is raised as something to decide rather than made an operative contract.

**Verdict:** the intended facts are mostly named, but the store cannot reliably drive the primary recent-choice reader as written. It needs an event record, ordering, complete-unit membership, and an explicit non-disposable storage contract. These are still liftable changes.

### Retention assessment against the amendments

| Current plan | Version-one UI/default cost | Retention work still required |
|---|---|---|
| `claude-revised_plan-r3.md` | Already aligned; remove optional cross-device resolution semantics from the minimum if simplifying scope | Low–medium: collision-free member placement, key definition, finalization, sequence-domain rule |
| `gemini-revised_plan-r3.md` | Already aligned; narrow done-page wording | Medium: complete units, decision-occurrence identity, ordering, completion, fuller context |
| `kimi-revised_plan-r3.md` | Already aligned | Low–medium: producer snapshot, unit grouping, ordering/finalization, safe per-unit pruning |
| `mistral-revised_plan-r3.md` | Already aligned; explicitly add the “copies are kept” done-page contract | Medium: event-based records, chronology, unit membership, producer snapshot, settled storage lifetime |

The proposed count of three is not authoritative. Whatever count is selected, it must count **coherent retained candidates**, not individual members of one save set. Incomplete operations remain exempt. Routine synchronization preimages should not accidentally consume the entire allowance intended for wrong conflict choices.

---

## 2. Load-bearing claims that still need correction

### 2.1 Zero-spawn idle must not mean “forget an unsuccessful upload”

All four seek a zero-rclone-start idle path. That is a good optimization, but the distinction between **captured** and **successfully published** is not consistently maintained.

A normal failure sequence is:

1. Capture records local version H1 in the own manifest.
2. Upload is skipped or fails.
3. The next game exit finds no difference from that manifest.
4. “Changed set empty” returns without retrying H1.

The shipped `--recent` mechanism instead keys its window to a successful backup stamp. Replacing it requires preserving that retry property, not just replacing its file-selection mechanism. [S29; D-CLOUD-028]

**Required correction for every plan:** the idle predicate must include outstanding unpublished versions, retained staging work, and pending operations. Capture dirtiness and publication dirtiness are separate facts. Capture also must not disappear merely because the upload toggle is off or another cloud job is running; the current ES call site has those gates around the transfer. [S41]

`claude-revised_plan-r3.md` additionally proposes a size/mtime precheck before hashing possible changes. **Same size and mtime cannot authorize skipping the content check indefinitely.** The project has already encountered equal-size changes, and its clocks are explicitly not reliable evidence of version equality. Hash the relevant save units at the capture boundary; use cheap metadata only as an optimization with an independent invalidation or rescan rule. [S03; S29]

**Settling fixture:** failed upload followed by an unchanged exit must retry; an equal-size, equal-mtime byte change must still enter the changed set.

### 2.2 The remote-hash bridge must prove a correspondence, not assign one

Three different errors survive here.

#### `claude-revised_plan-r3.md`

The changed-path sequence drops local backend-hash computation and says the post-upload listing both verifies the upload and fills `remote_hash`.

For a **new** local SHA-256 H, there is no previously verified H-to-native-hash mapping. Observing remote digest R and recording “H maps to R” does not prove that the remote contains H. It is a correspondence being assumed at precisely the point where the plan says it is verified.

The specification must name the independent evidence:

- compare R with a native digest computed over the sealed local payload;
- or download the resulting remote object and compare SHA-256;
- or use a specifically tested transport verification result that establishes the same correspondence.

The hashless branch’s `verified_by: "transfer"` and proposed degradation to accepting exit zero do not meet the project’s **verify the artifact, not the report** constraint merely by receiving a label. [S10]

#### `kimi-revised_plan-r3.md`

The equality-seeding rule permits a matching foreign-manifest claim plus matching size/mtime as an alternative to download-and-hash on a hashless backend. That contradicts the stricter rule elsewhere in the same plan.

A manifest describes an intended version; it does not prove the bytes currently occupying a mutable remote path. Equal size and mtime do not close that gap. The QA WebDAV has neither usable hashes nor modtimes in the embedded account. [S04; S09]

#### `mistral-revised_plan-r3.md`

Computing the backend hash locally cannot let “the next exit push … confirm C = A **without a listing**.” It computes an expected digest, not the current remote head. Another device may have published since the last observation.

Local native-hash computation can complement a fresh remote observation. It cannot replace one.

#### Transfer authorization must survive rclone’s own comparison

`claude-revised_plan-r3.md` explicitly forces decided transfers with `--ignore-times`. The corresponding exact-file upload commands in the other plans do not consistently do so.

Selecting one file—or using `copyto`—does not itself force a transfer past metadata comparison. The shipped archive paths explicitly pair the selected transfer with `--ignore-times` because of this failure class. [S29; S30]

**Integration:** lift the forced-transfer rule, keep candidate-scoped fresh evidence, and specify how post-transfer content is verified before advancing agreement. If the hashless path is too expensive, **defer the unverified mutation or agreement advance**, not the proof while claiming completion.

This is consequential: a falsely advanced A can make the next pass classify the still-old cloud file as a legitimate cloud change and download it over the intended local progress.

### 2.3 Lifecycle exclusion and recovery are not complete in three plans—and have one important flaw in the fourth

`claude-revised_plan-r3.md` supplies the best lifecycle contract:

- exclude save-tree mutation throughout a game session;
- preserve the exclusion if ES dies before the emulator;
- upload sealed copies rather than live emulator files;
- recover incomplete local installation before another launch.

That should be lifted.

`gemini-revised_plan-r3.md`’s lock sequence protects a local hash read, then releases the snapshot lock before network work. It does not specify the session’s lock ownership, survival through ES death, or reacquisition for installation.

`kimi-revised_plan-r3.md` correctly identifies the gate but still relies in places on re-hashing immediately before uploading a live file. A writer can change it immediately afterward. It also describes an interrupted multi-member install as a “window” of two rename syscalls. **After a process kill, that window lasts until recovery**, not until the next syscall would have run.

`mistral-revised_plan-r3.md`’s move of boot work under ES scheduling is not a substitute for a mutual-exclusion contract covering direct script calls and emulator lifetime.

There is also a flaw in `claude-revised_plan-r3.md`’s otherwise useful phase model:

> `prepared` → discard stage, nothing happened

A crash can occur after a file was replaced but before the phase record advances. Recovery must inspect the actual member hashes even when the durable record still says `prepared`. A phase is a checkpoint, not proof that no later side effect occurred.

Two further limits belong in all four:

- **Local coherence recovery must work offline.** A device should not need cloud connectivity merely to repair a partially installed local unit and return to play.
- **A prior decision authorizes its recorded operands, not an arbitrary future remote head.** Recovery should not ask again just because a process restarted; it must reclassify if another version appeared meanwhile.

The source-visible filesystem primitives reinforce why this must be explicit: `copyToSlot()` ignores copy/rename results, and its destination derives from the source parent. [S38] ES also performs save-tree work before and after the emulator invocation. The gate must bracket those mutations, not just `process.run()`. [S38; S41]

**Settling fixture:** kill after each individual filesystem effect and before its corresponding checkpoint update; restart without network; verify a complete unit before launch and no publication over an unexpected remote head.

### 2.4 Whole-unit classification needs whole-unit publication and retention

All four now state the right disjoint-member rule. None should treat that statement as a complete wire format.

The signed schema contains entries for files; it does not contain a complete publication-level member map. [S03] A reader rule requiring “one manifest’s declared map” therefore needs an actual descriptor covering:

- required member paths and hashes;
- member additions and removals;
- optional thumbnail artifacts;
- the publication that makes the map coherent.

This descriptor must distinguish **publisher** from **producer**. A device may publish a unit containing unchanged members produced elsewhere without falsely stamping those members as its own.

`mistral-revised_plan-r3.md`’s example makes the problem concrete: it assigns a file SHA-256 and size to the directory key `dc/shared/savefiles/`. A directory has no single “stored file bytes” under D-CLOUD-030. Represent actual member files and a unit member map; do not silently redefine file-version identity.

The retention side needs the same completeness. Saving only the members that changed or conflicted cannot reconstruct the loser’s coherent past save set.

One useful correction is already explicit in `mistral-revised_plan-r3.md`:

> “A thumbnail anomaly is not a progress fork when the state bytes are identical.”

Lift this into any unit specification that currently includes PNG hashes indiscriminately in its progress-comparison map. Retain and verify the PNG as an associated artifact, but D-CLOUD-030 expressly excludes it from save-version identity. [S03, §1]

### 2.5 Hash identity does not establish move intent or a permanent deletion prohibition

Both `claude-revised_plan-r3.md` and `kimi-revised_plan-r3.md` sometimes compress move handling into:

> same hash elsewhere → move → re-key

That needs qualifications:

- Match within the correct game/core repository and save kind.
- Validate the **current** file, not merely an old manifest claim.
- Account for copies, multiple matching locations, and occupied destinations.
- Plan a renumber permutation as a set; do not rename one occupant over another while “following” hashes.

D-CLOUD-030 establishes content identity and verified duplicate compaction. It does **not** establish the general rule that the cloud’s path wins. [S06]

The retirement proposals also need one small but important adversarial sequence:

1. Delete H and publish its retirement.
2. Intentionally restore H from retained storage.
3. Encounter the old retirement again.

The bytes are still H. The restore is a **new publication of the same version**, not a new version. `kimi-revised_plan-r3.md`’s final description of restore as “a new version” conflicts with D-CLOUD-030. Hash equality alone cannot distinguish an old copy from an intentional republication.

This does not justify a deep ancestry graph. It requires explicit retirement applicability and consumption rules that do not turn a content hash into a permanent blacklist.

The lifetime claims also need honesty:

- `claude-revised_plan-r3.md`’s last-64 ring is not “sufficient” merely because an old record is harmless while present. Forgetting it can permit resurrection.
- `kimi-revised_plan-r3.md` states that limitation, but coupling tombstone expiry to the undo retention window conflates two different jobs.
- `mistral-revised_plan-r3.md` needs an actual peer-visible retirement channel. Copying payloads into a sibling is not, by itself, transporting deletion intent to other devices.

Keep explicit-delete records and verified compaction. Do not abandon deletion propagation because an absence is unexplained. On that unexplained case, I would lift the **hold and report** rule from `kimi-revised_plan-r3.md`, replacing automatic resurrection in `claude-revised_plan-r3.md`.

### 2.6 The pre-pass is not a permanent reservation

The pre-pass solves an important snapshot problem, but not all later changes.

All four need a precondition check at **COMPLETE**, covering:

- the local and cloud operands;
- the complete unit map;
- proposed destination slots;
- any relevant pending retirement.

`claude-revised_plan-r3.md`’s check that agreement has not changed since queuing is insufficient: agreement is local and can remain unchanged while the cloud changes.

Also correct the inherited IA contradiction rather than repeating it:

> **No conflict-resolution changes apply until COMPLETE. Completed non-conflicting transfers are not rolled back by canceling the walkthrough.**

That is consistent with the pre-pass and staging. “Nothing transfers” and “both sides exactly as before” without this qualification are not. [S02]

### 2.7 Two source-visible migration claims remain wrong

**`kimi-revised_plan-r3.md`: `defaultCoreDirectory` is not a dual scan.**

In the embedded implementation it selects a replacement directory for the relevant configuration; it does not add a second scan of both the flat and per-core locations. The repository then scans the selected directory non-recursively. [S39; S37]

Consequently, the #10 rehearsal must prove that both old and new locations remain discoverable. Merely supplying `defaultCoreDirectory` cannot establish that.

**`claude-revised_plan-r3.md`: downgrade is not shown to be non-destructive.**

The old scripts can still overwrite saves by recency or by unconditional copy, and can transport foreign manifest files through the broad savestates include. [S29; S30; S32; S35] “Old images ignore manifests” does not make their write behavior harmless.

D-CLOUD-029 remains binding for the current maintainer-only period. It is not a coexistence guarantee for old and new writers. The cutover must explicitly cover all active write entry points, including manual upload/download, hub save actions, Tools/direct scripts, and the future #37 path—not just the three most frequently discussed callers. [S13; S28]

One additional capture correction applies broadly: `getEmulator(true)` and `getCore(true)` resolve configuration, but `SaveState::setupSaveState()` can rewrite the launch command for a selected state. Capture must receive the **effective executed emulator/core**, frozen after those choices, rather than blindly re-query settings at exit. [S38; S42]

---

## 3. Remaining differences: liftable or architectural?

“Liftable” below includes replacing a conflicting rule where the rest of the design remains unchanged. It does not mean running two contradictory rules simultaneously.

| Difference | Classification | Direction of integration |
|---|---|---|
| Game-keyed retention, operation-keyed retention, or historical-path/hash retention | **Liftable layout** | Use the game-addressed discovery of `claude-revised_plan-r3.md`, decision-occurrence identity, and the path-preserving payloads of `kimi-revised_plan-r3.md`. No database is needed. |
| Retained metadata fields | **Liftable schema** | Combine explicit producer snapshots, complete member maps, winner/action, event order, completion state, and retained-relative artifact references. Do not copy the entire producer manifest. |
| Resolution timestamp versus capture timestamp | **Liftable field** | Lift the separate `resolved_at` field from `gemini-revised_plan-r3.md`; retain the sequence rule from `claude-revised_plan-r3.md`. Display time is not a winner-selection rule. |
| Count per game versus per unit; conflict copies versus routine preimages | **Liftable retention policy** | Define the bucket in player-data terms and protect complete units. Lift `kimi-revised_plan-r3.md`’s separation of routine superseded preimages if those are retained. Keep pending-operation exemptions everywhere. |
| `kind: container` versus `kind: save` plus `unit` | **Liftable representation** | Either can work. Prefer keeping save-kind semantics separate from unit/container identity; do not make the glyph taxonomy carry the whole grouping model. Record the chosen D-CLOUD-031 refinement explicitly. |
| Whether PNGs participate in a unit’s conflict identity | **Liftable correctness rule** | Lift the explicit thumbnail-anomaly rule from `mistral-revised_plan-r3.md`. PNG integrity remains checked independently. |
| Manifest-last publication versus one batched invocation | **Liftable ordering/optimization** | Start with explicit payload-before-manifest ordering and coherent-map validation. Only combine invocations after the actual ordering and verification mechanism is demonstrated. |
| Computing a native hash locally versus learning it from a remote listing | **Liftable verification mechanism** | These are complementary, not competing architectures. A fresh observation still needs a verified mapping to the sealed local bytes. |
| Foreign manifests inside or outside the save tree | **Liftable path/ownership rule** | Lift the outside-tree cache from `claude-revised_plan-r3.md`, particularly during shadow-mode coexistence with broad legacy copies. |
| ES-scheduled boot work versus a separately scheduled worker | **Liftable scheduling** | The shared lifecycle gate is the safety mechanism. ES scheduling may simplify presentation, but does not replace exclusion and need not be made a separate architecture. |
| Snapshot lock versus session-lifetime gate | **Liftable, load-bearing contract** | Lift the session-lifetime contract from `claude-revised_plan-r3.md`; verify child/process ownership on the real launcher. |
| Four apply phases versus a frozen-plan journal | **Liftable recovery specification** | Use explicit phases, but inspect actual hashes at every recovery point. Add permanent retained-record completion; transient pending state can then be removed. |
| Hold versus resurrect unexplained absence | **Liftable policy replacement** | Use the hold-and-report behavior of `kimi-revised_plan-r3.md`. All plans already have the state needed; deletion propagation remains available for recorded intent. |
| Move receipts versus hash inference for renumber/compaction | **Liftable operation rule** | Use scoped, verified inference where unambiguous; retain explicit-delete intent. Ambiguity must not authorize removal. |
| Last-64 retirement ring versus per-unit expiry | **Liftable control-state policy** | Separate correctness-state lifetime from retained-copy count. State the late-device behavior rather than promising convergence from an arbitrary count. |
| `resolves` shortcut in `claude-revised_plan-r3.md` versus deferral elsewhere | **Liftable scope reduction** | Leave it out of the version-one minimum. The local retained-record and pending-apply designs do not depend on it. |
| Strict five-second changed path versus measured slower path | **Liftable operating policy** | Preserve the zero-work fast path and fresh evidence. Use deferral rather than weaker equality claims; any changed-path budget revision must explicitly refine D-CLOUD-028. |
| Literal-IP versus hostname LAN routing | **Liftable liveness rule** | A hostname can resolve through local DNS or hosts configuration without a default route. Lift destination-route evaluation; do not add ICMP or claim all such hostnames are unreachable. |
| #10’s delivery order | **No substantive current disagreement** | The current plans retain the feature and require a launch-behavior rehearsal. Do not continue arguing against an earlier deferral that is no longer proposed. |
| Deterministic auto KEEP BOTH, retention on, no V1 undo control | **No current disagreement** | Keep the shared simple flow. |
| Mutable canonical paths protected by preflight/retention versus mandatory protected publication after a failed race test | **Conditional architectural fork** | See below. |

### The one genuine conditional fork

`gemini-revised_plan-r3.md` says that failure of the `--backup-dir` race fixture requires protected publication before multi-device shipping. `claude-revised_plan-r3.md` and `kimi-revised_plan-r3.md` reject that protocol in version one.

If “protected publication” means immutable version objects and a publication-pointer or comparable commit protocol, it changes the remote representation, reader, agreement semantics, and migration. That is architectural. It is not another retention field.

But **the experiment has not earned that fork yet**. The source shows `--backup-dir` in the shipped sync branch, not the required copy/race guarantees. [S29] Run the experiment and state the promised guarantee. If a backend fails it, the maintainer must choose between a narrower operation/support contract and the stronger publication architecture.

Do not silently build the stronger architecture because a concurrency edge case is imaginable. Equally, do not describe best-effort recoverability as atomic preservation.

**Between `claude-revised_plan-r3.md` and `kimi-revised_plan-r3.md`, nothing architectural remains.** Their remaining provisions can be integrated without replacing the reconciler, transport model, or storage ownership model. The other two also use that same foundation; specification omissions are not alternative architectures.

---

## 4. What each plan contributes that should not be lost

| Plan | Distinct contribution worth lifting | Where it should go |
|---|---|---|
| `claude-revised_plan-r3.md` | **A game session’s exclusion survives ES dying while the emulator continues, and uploads use sealed stage copies.** It also provides the clearest game-addressed retention lookup. | Into the lifecycle sections of the other three and the shared retained-store contract. |
| `kimi-revised_plan-r3.md` | **In-memory slot reservations:** two KEEP BOTH decisions for one game in one walkthrough must allocate different slots before either is installed. Its sync-root-relative retained payload layout is also materially safer than basename storage. | Into the adapter and retention sections of `claude-revised_plan-r3.md`, and the abbreviated apply specifications of the other two. |
| `gemini-revised_plan-r3.md` | **A distinct structured `resolved_at` field**, separate from producer capture time, and an explicit budget fallback that leaves unverifiable uploads pending. | Into retained event records and the changed-path budget contract. Keep an independent sequence for reliable order. |
| `mistral-revised_plan-r3.md` | **Explicitly separating thumbnail anomalies from progress forks.** Its distinct suggestion to cap retirement work per run is useful as scheduling, provided remaining work stays pending rather than being dropped. | Into unit classification; optionally into full-pass work scheduling. A work cap must never become a correctness-record eviction rule. |

These are integration contributions, not claims that the ideas are proven merely because another plan contains them.

### What should not be built

- **An undo control in version one.** None of the current plans requires it; keep it that way.
- Deep ancestry or cross-device resolution machinery as a prerequisite for the local one-step recovery use case. In particular, the optional `resolves` shortcut in `claude-revised_plan-r3.md` changes classification authority and deserves separate justification, not “it is only one field.”
- A second production agreement authority hidden inside “bisync as bulk transport.” Bisync does not stop having its own listings and behavior because the wrapper calls that state unused. Direct rclone batches already match the proposed reconciler. Let a measured benefit earn anything more. [S02; S16; S23]
- A single-spawn target that weakens verification, an extra local hash spawn that is justified as replacing future remote observations, or a timer that permits an unread overwrite.
- A filename/hash-only retention index with no decision occurrence.
- Blanket cache invalidation of retained data or pending operands.
- A generic binary-save merger, semantic progress heuristic, arbitrary slot cap, or daemon.
- A claim that store growth is necessarily trivial because the corpus’s sample states are tens of kilobytes. Measure representative large states and containers; a count is not a byte-space guarantee. [S03; S21]
- A “standalone specification” whose essential lock, publication, recovery, or gate behavior exists only in references to an unembedded earlier plan. This is particularly a completion task for `mistral-revised_plan-r3.md`.

---

## 5. What I would build from, and what must change first

### Editing baseline

Use **`claude-revised_plan-r3.md`**, with this integration package:

1. **Retention:** keep its game-addressed event records; use `kimi-revised_plan-r3.md`’s path-preserving payload layout; add explicit unit membership, retained-relative artifact locations, producer snapshots, completion, and `resolved_at`.
2. **Verification:** remove the circular native-hash mapping and the exit-zero degradation. State the actual artifact proof before advancing agreement.
3. **Capture and retries:** separate capture from publication; preserve unpublished dirty state across network skips and failures; freeze the actual executed emulator/core.
4. **Adapter:** add `kimi-revised_plan-r3.md`’s in-memory reservations; preserve PNGs without making PNG-only differences progress conflicts.
5. **Recovery:** keep explicit phases, but replace “prepared means nothing happened” with inspection and deterministic local repair. Revalidate remote preconditions before retrying publication.
6. **Deletion:** retain explicit-delete propagation; hold unexplained absences; define retirement applicability and expiry without permanent hash blacklisting.
7. **Scope:** omit optional cross-device resolution shortcuts and bisync production integration until they earn their cost.
8. **Migration:** remove the downgrade-safety claim, correct the dual-scan assumption, and inventory every save writer at the script/backend boundary.

This is not a recommendation to implement every paragraph of the longest plan. It is a recommendation to start with the document that best separates the lifecycle and persistent-state responsibilities, then replace its incorrect rules.

### Evidence in priority order

1. **Repair the test instrument, on disposable GENERIC_X64 storage.**  
   The embedded round-trip harness overwrites `rclone.conf` before asserting the chosen remote and does not restore it. Its archive expectations disagree with the dated uploader/restorer; its content fixture also needs reconciliation with D-CLOUD-019’s membership rule. These are source-visible problems, not hypothetical test polish. [S36; S29; S30; S06]  
   Run WebDAV and MinIO. Do not point the current harness at the maintainer’s configured handheld.

2. **Prove the primary offline fork and retry path.**  
   Agree H0; let the other device publish HB; edit HA offline; exit. No boot, exit, menu, hub, or direct save-script path may overwrite either candidate before a decision. Then test a failed upload followed by an unchanged exit. Include an equal-size/equal-mtime mutation.

3. **Prove the retention reader before any restore UI exists.**  
   Create retained decisions for several games, a complete multi-file unit, a repeated hash, and a renumbered state. Overwrite producer manifests, rotate the audit log, remove completed pending records, and set the clock backward. A test-only reader must still produce the required per-game list and open the right retained bytes and PNG. This is a schema test, not a version-one user control.

4. **Prove local exclusion and recovery on H700.**  
   Exercise boot overlap, launch-time `.auto` handling, ES death with the emulator alive, and interruption between actual file effects and checkpoint updates. Recovery must restore local coherence before play without requiring network.

5. **Price the real changed path.**  
   Record process starts, remote requests, transferred bytes, and elapsed time on the H700 pair, including pending-work retries and hashless verification. Respect D-QA-002: the QA WebDAV remains loopback-bound; hardware testing needs an explicitly safe access arrangement, not an undocumented LAN rebind. [S06; S09]

6. **Prove ordinary deletion/renumber convergence and same-byte republication.**  
   Delete a numbered state, renumber, sync repeatedly, and verify that remaining versions survive exactly once. Restore previously retired identical bytes and verify that an old retirement cannot silently remove the restored choice.

7. **Run the presentation and namespace hardware gates.**  
   #19’s same-chipset control precedes cross-chipset work; loud/silent failure is measured separately. #10 must preserve launch behavior and discover both layouts. Test recognition at 480×320, not just whether the layout fits. [S08; S20; S38; S39]

The `--backup-dir` race experiment belongs alongside transport validation, but it should not displace the primary offline-fork, retention-reader, and retry proofs.

### What changed my assessment

My own earlier revision is not embedded, so I cannot honestly supply a precise version-to-version account of it. The substantive changes in judgment from this comparison are:

- `claude-revised_plan-r3.md` makes the case for **game-addressed retention discovery** particularly clearly.
- `kimi-revised_plan-r3.md` shows why **path-preserving payloads and in-memory slot reservations** should be integrated rather than treated as rival designs.
- The store traces demonstrate that **one-step reversibility requires a durable decision record, not deep lineage**.
- Most remaining disagreement is implementation integration. The team should spend less time choosing a plan and more time making the shared contracts falsifiable.

---

## 6. Corpus gaps that affect this review

The following were not embedded as inspectable implementations or results:

- The full savestate-manager delete action, launcher/process implementation, and filesystem copy/rename utilities.
- The complete ES startup/scheduling path and its interaction with the autostart worker.
- RetroArch configuration generation and the complete runtime configuration used for #10.
- rclone 1.75.0 source or authoritative behavior documentation for the proposed ordering, exact-file filtering, native-hash calculation, and copy/backup-directory race guarantees.
- The content scripts, backup implementation, defaults files, and QA backend implementation needed to finish the cross-tier and harness audit.
- Current issue bodies containing all reported amended acceptance criteria; the embedded issue files are principally comment exports.
- Executed full round-trip, conflict, retention-reader, interrupted-apply, and two-writer transport results.

The corpus does contain reported measurements and fixture observations. Those are useful evidence, but they are not substitutes for the missing runs above. I have not fabricated missing file paths, hashes, or test outcomes.

---

## `corpus.provenance.json`

```json
{
  "artifact": "gpt_peer_review-r4.md",
  "role": "council member, round-4 peer review; not a revised plan or vote",
  "corpus_mode": "verbatim embedded read-at-time corpus supplied by Council Facilitator council-facilitator@1.2.0",
  "source_count": 42,
  "manifest_read_timestamp_utc_as_supplied": "2026-09-05T17:32:51Z",
  "member_filesystem_access": false,
  "member_independently_reread_files": false,
  "member_independently_rehashed_sources": false,
  "member_executed_tests": false,
  "hash_basis": "SHA-256 values copied from the supplied per-source headers; verified at embed time by the Facilitator, not recomputed by this member",
  "citation_mapping": "S01 through S42 identify the same-index pair in source_file_paths and source_file_hashes",
  "reviewed_plans": [
    {
      "filename": "claude-revised_plan-r3.md",
      "delivery": "injected text",
      "sha256_provided": null
    },
    {
      "filename": "gemini-revised_plan-r3.md",
      "delivery": "injected text",
      "sha256_provided": null
    },
    {
      "filename": "kimi-revised_plan-r3.md",
      "delivery": "injected text",
      "sha256_provided": null
    },
    {
      "filename": "mistral-revised_plan-r3.md",
      "delivery": "injected text",
      "sha256_provided": null
    }
  ],
  "maintainer_amendments": {
    "source": "orchestrator brief in this prompt",
    "separate_declared_path": null,
    "sha256_provided": null,
    "treated_as_authoritative": true
  },
  "peer_material_use": "The four current plans were evaluated against the embedded corpus. Their accounts of previous rounds were not treated as independent evidence, and no conclusions about councils or models were drawn from them.",
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
      "material": "Full savestate-manager delete action, launcher/process implementation, and filesystem copy/rename utilities",
      "reason": "Needed to verify the delete hook, effective launch provenance, lock inheritance, filesystem errors, and timestamp behavior.",
      "declared_source_path": null,
      "sha256": null
    },
    {
      "material": "Complete ES startup scheduling, RetroArch configuration generation, and runtime configuration for the namespace rehearsal",
      "reason": "Needed to establish boot handoff, save-directory agreement, and preservation of launch behavior.",
      "declared_source_path": null,
      "sha256": null
    },
    {
      "material": "rclone 1.75.0 source or authoritative documentation for proposed filtering, ordering, native hashing, and copy/backup-directory race semantics",
      "reason": "The transport and verification guarantees are not established by the embedded callers.",
      "declared_source_path": null,
      "sha256": null
    },
    {
      "material": "Content scripts, backup implementation, defaults files, and QA backend implementation",
      "reason": "Required to complete cross-tier, upgrade, and test-harness verification.",
      "declared_source_path": null,
      "sha256": null
    },
    {
      "material": "Current issue bodies with amended acceptance criteria",
      "reason": "Embedded issue exports principally contain comments; body edits reported elsewhere cannot be independently inspected.",
      "declared_source_path": null,
      "sha256": null
    },
    {
      "material": "Executed full round-trip, conflict, retention-reader, interrupted-apply, and two-writer transport results",
      "reason": "No supplied result establishes that the revised mechanisms pass these gates.",
      "declared_source_path": null,
      "sha256": null
    },
    {
      "material": "This member's own previous revised plan",
      "reason": "Not supplied; no precise claim about a change from that revision has been fabricated.",
      "declared_source_path": null,
      "sha256": null
    }
  ],
  "missing_source_policy": "No missing source paths, hashes, contents, or execution results have been fabricated."
}
```