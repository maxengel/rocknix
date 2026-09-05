# gpt-revised_plan-r3.md

## Recommendation

**Build a small, content-based reconciler around rclone—not a wizard behind an otherwise unchanged sync.** It owns every save-writing path, compares complete save units against a verified local agreement record, and gives EmulationStation explicit outcomes rather than asking it to interpret rclone’s progress text.

Keep the foundations already decided:

- SHA-256 of stored bytes identifies a save version.
- Slots and filenames are locations, not identities.
- Each device publishes only its own manifest.
- Game saves remain shared; save states are organized by core.
- Genuine forks require a player’s decision, never a recency rule.
- The audit log remains append-only text at `/storage/.cache/log/cloud_audit.log`.

Make these amendments:

1. **Retain discarded copies by default, with a count bound, but ship no V1 restore control.** Retained copies include sufficient metadata for the separate, later history-restore picker.
2. **Use our classifier as the authority.** Bisync must earn any production role through a disposable spike; its presence and help text do not prove a safe detect-only interface.
3. **Read current cloud evidence before a proposed overwrite, including at game exit.** If obtaining sufficient evidence is too expensive for the foreground path, leave that unit pending rather than overwrite an unread head.
4. **Coordinate save mutations with the actual emulator lifecycle.** The cloud lock alone does not protect files while a game is running.
5. **Reuse and repair ES’s save-state primitives through a checked adapter.** Their present return values and allocator edge cases are not adequate safety checks.
6. **Propagate explicit, version-specific deletion intent.** Unexplained absence does not authorize deletion. Verified duplicate compaction acts on both sides so it converges.
7. **Keep only immediate agreement, immediate predecessor information where known, active deletion intent, and one in-flight apply record.** Do not build a distributed resolution history.

This is a recommendation for implementation **after the gates below pass**, not a claim that the proposed mechanisms have been tested.

### Evidence and citation convention

`S01`–`S42` identify the embedded sources in order. Each citation resolves to the exact declared path and Facilitator-supplied SHA-256 in `corpus.provenance.json` at the end. Short paths in prose are the suffixes of those declared paths.

I used the embedded text. I did not access a filesystem, recompute hashes, execute commands, or test hardware. The earlier revised plans themselves are not embedded here; the revision-accountability section uses the passages quoted or described in the injected reviews.

---

## 1. What this revision concedes, adopts, and rejects

| Issue | Position in this revision |
|---|---|
| **V1 native recovery requirement** | **Withdrawn.** `claude_peer_review-r3.md`, `gemini_peer_review-r3.md`, and `kimi_peer_review-r3.md` correctly identify the “minimal native recovery route” quoted from `gpt-revised_plan-r2.md` as exceeding the new maintainer decision. Its design moves to the separate history-restore issue. Nothing in V1’s resolution flow puts a discarded copy back. |
| **Retention metadata left dependent on a completed plan or mutable manifests** | **Corrected.** The criticism in `claude_peer_review-r3.md` and `kimi_peer_review-r3.md` is sound: a rotating audit log and a producer’s current manifest cannot serve as the lasting description of a discarded version. V1 writes a self-contained record beside each retained set and keeps it after successful apply. |
| **Cross-device resolution receipts in V1** | **Removed.** I accept the two-device trace in `claude_peer_review-r3.md`, rather than the contrary recommendation in `kimi_peer_review-r3.md`. A later informed choice is allowed to propagate normally; the earlier copy is retained. Preventing that propagation would add policy and history the primary use case does not earn. |
| **Move hooks and generation machinery for lineage fidelity** | **Cut from the required design.** Net moves are recognized by verified content equality. Ambiguous `replaces` values remain unknown. The one required new ES observation point is explicit deletion; no hook is justified merely to reconstruct a deeper ancestry chain. |
| **Budget fallback** | **Adopted from `gemini-revised_plan-r2.md`, as quoted in `claude_peer_review-r3.md`.** Expensive verification may be deferred. The necessary qualification is that the corresponding canonical overwrite is deferred too. |
| **Shared-container distinction and gate-table form** | **Adopted from `mistral-revised_plan-r2.md`, as described in the reviews.** A shared VMU or memory card is presented as a container, not falsely assigned to one ROM. Experiment tables below name the owner and the pass condition. |
| **Source-visible hazards in option handling and temporary files** | **Adopted from `kimi-revised_plan-r2.md`, as credited by `claude_peer_review-r3.md`.** The supplied scripts confirm the allowlist bypass, admission of save-tier conflicted copies, and admission of `.state.auto.bak`. These are implementation inputs, not reasons to trust the rest of any plan without checking it. |
| **Run-bound result records** | **Adopted from `claude-revised_plan-r2.md`, as described in `kimi_peer_review-r3.md`.** An outcome is accepted only for the run ID and sync context the caller requested. Missing or stale output is not success. |
| **A full remote staging mirror, mandatory protected-publication protocol, or unconditional deferral of #10 attributed to GPT** | These attributions in `mistral_peer_review-r3.md` are not the position of this artifact. The earlier text is unavailable to inspect directly, so I will not reconstruct it. **This plan uses candidate-scoped staging, gates preservation without promising linearizability, and keeps #10 in the drop, sequenced last.** |

Two further disagreements need an explicit answer:

- **Hashless metadata tiers:** I reject using an unchanged manifest claim or size/mtime as sufficient permission to overwrite. They can direct the investigation; they cannot establish the cloud’s current bytes. This follows the same-size failure already documented in the shipped scripts. [S03 §2–3; S29 `backup_system_files`; S30 `restore_system_files`]
- **Manifest-last publication:** I do **not** require a separate manifest upload merely to create an apparent commit point. The manifest is an observation, not an authorization or atomic commit record. The payload and our own manifest may share a batch, provided readers verify the described bytes and treat mismatches as pending. A manifest-last convention alone would not protect against an interrupted or concurrent writer.

---

## 2. What is settled, and what is not

Agreement among reviewers is not evidence of runtime behavior.

| Proposition | Evidence status | Consequence |
|---|---|---|
| Version identity is SHA-256 of stored bytes; numbered-slot duplicates are compacted after re-verification | **Decided:** D-CLOUD-030 | Keep it. Narrow the compaction scope explicitly below. |
| Per-device manifests and local agreement state | **Decided:** D-CLOUD-031 | Keep the placement and ownership; refine the schema’s semantics. |
| V1 retention is on by default, count-bounded, with no V1 undo control | **Authoritative amendment in this brief** | Apply it without reopening the product decision. |
| The exit upload can overwrite a divergent cloud save | **Source-visible:** `--recent` forces `copy`; the ES call supplies no `--update` | #22 must replace this path, not merely add a menu detector. [S29; S41] |
| The boot pair is newest-wins | **Source-visible:** both directions use `copy --update` | D-CLOUD-029 remains the deliberate temporary posture. [S35; S06] |
| ES has allocator and copy-verification defects relevant to KEEP BOTH | **Source-visible**, detailed in §7 | A checked adapter is mandatory. [S37–S39] |
| A manifest-driven reconciler is the better production authority than bisync | **Engineering recommendation, not an executed comparison** | Run the bisync spike; do not claim its failure in advance. |
| `copy --backup-dir` preserves an intervening remote head under races and interruption | **Unmeasured for this use** | A preservation gate is required. No universal atomicity claim. |
| The changed-unit exit path fits an acceptable foreground budget | **Unmeasured** | Measure process starts, requests, bytes, and wall time on H700. |
| Auto states are the commonest conflict | **A schema assertion, not established by the embedded evidence** | Census actual launch habits; keep the resume-point presentation regardless. |
| The proposed standalone save-unit boundaries are correct | **Unmeasured** | Inventory real emulator outputs before enabling automatic treatment. |
| Queueing unattended conflicts is preferable to automatically opening the wizard | **Proposed IA amendment** | Update the IA and issue body, not just a comment. |
| A retention count of three is right | **Product proposal only** | Use three initially if approved; correctness requires a positive bound, not that particular number. |

The corpus does contain reported H700 measurements and device inspections. It does **not** contain executed results for the new classifier, preservation protocol, lifecycle coordination, or compatibility matrix. [S05; S08; S20; S27]

---

## 3. The foundation: one authority over save mutations

### 3.1 Responsibilities

**EmulationStation**

- Owns the player interaction.
- Supplies the actual launched ROM, emulator, and core context.
- Participates in save-lifecycle coordination.
- Uses the checked state allocator/copy adapter.
- Presents typed results and the conflict walkthrough.

**Local reconciler**

- Captures stable local observations.
- Reads current remote evidence through rclone.
- Classifies save units.
- Produces an exact transfer/apply plan.
- Retains preimages and discarded copies.
- Applies only authorized changes and advances agreement after verification.

**rclone**

- Lists and transfers.
- Performs only the exact, policy-approved operations.
- Does not choose a conflict winner.
- Does not rename save-state losers.
- Does not define whether two files represent a genuine fork.

There is no new daemon, shared database, binary-save merger, or distributed consensus service.

### 3.2 Two different locks, for two different hazards

Reuse `take_cloud_lock` for all cloud operations. It already serializes transfer scripts on one device and returns a non-blocking skip. [S29–S30]

Add one **save-lifecycle gate** shared by:

- the emulator session;
- ES save-state deletion and renumbering;
- capture;
- live save installation and compaction.

This addresses a different hazard. The boot script currently runs independently of gameplay, while `SaveState::setupSaveState` can temporarily replace `.state.auto` and `onGameEnded` can restore its `.bak`. A cloud lock does not stop either operation. [S35; S38; S41]

**Acquisition order**

1. A cloud worker acquires the cloud lock non-blockingly.
2. When it needs a stable local snapshot or a live mutation, it acquires the lifecycle gate non-blockingly.
3. If gameplay owns that gate, the worker leaves mutation pending. It does not wait while holding something gameplay needs.
4. The game session performs local capture at its completion, releases the lifecycle gate, and only then requests cloud work.
5. **Capture never waits for the cloud lock and performs no network work.**

Remote listing and candidate downloads into staging do not need to hold the lifecycle gate. Before a live apply, the worker reacquires it and revalidates its inputs.

A qualification is necessary: a bounded apply critical section may include a remote mutation while the relevant local snapshot is held stable. I do not promise that every network wait disappears from that critical section. Instead, perform expensive discovery and staging beforehand, limit the commit’s work, and yield between units. A game launch may wait briefly for an already-started commit, but never behind an unbounded background full pass.

The session’s ownership must survive **ES dying while the emulator remains alive**. An ES-owned Boolean or a marker removed when ES exits is insufficient. The actual launch supervisor or emulator process lifetime must own the gate; the missing launch plumbing must be inspected before choosing the precise implementation. [S10; S41]

### 3.3 Capture is independent of whether sync is enabled or available

Capture must still happen when:

- exit sync is disabled;
- the device is offline;
- another cloud operation holds the cloud lock;
- the emulator exits unsuccessfully after having written a save.

The existing ES sync invocation is gated by the sync setting and current sync activity. Merely inserting capture inside that conditional would lose provenance in ordinary use. [S41]

Capture occurs after ES has completed its own save-state cleanup, and before the next session can mutate the relevant files. It records **newly produced bytes**, not every file whose timestamp happens to be recent.

Use the actual launch context saved when the command was constructed. After #10, selecting a state can change the emulator/core command independently of the configured default; asking `getCore(true)` only at exit is not a sufficient general contract. [S38 `setupSaveState`; S39; S42]

Capture selection must cover the emulator’s actual save locations, including standalone layouts. It must not regress to a ROM-basename upload filter, which D-CLOUD-028 rejected for good reason. Hash supported session outputs, identify newly encountered files, and use a full pass to verify the remaining library. The shadow census determines the cost of this local work.

**Do not rewrite a manifest only to refresh `generated_at`.**

---

## 4. Data model: current state, not a history system

### 4.1 Five records, each with one job

| Record | Purpose | Authority |
|---|---|---|
| **Owned manifest** | Describes this device’s current observed/materialized save occurrences, their version hashes, and known producer metadata | An observation; not proof of current remote contents |
| **Local agreement record** | Records the last verified common save-unit map for this sync context | Classifier baseline |
| **Active retirement notices** | Carry explicit, version-specific deletion intent to devices that were offline | Permission for a matching retirement, never permission to delete a different occupant |
| **One in-flight apply plan** | Holds expected inputs, selected outputs, retained locations, and per-unit completion state | Recovery of an interrupted operation |
| **Retained-copy record** | Describes bytes kept for the later history-restore tool | Historical context only; never classifier authority |

No record stores a version DAG. `replaces`, when known, remains one immediate predecessor. A missing or ambiguous predecessor is `null`, not reconstructed with speculative move history.

### 4.2 Manifest ownership and provenance

Keep the D-CLOUD-031 path:

`savestates/.rocknix/manifest-<device-id>.json`

But make these semantics explicit in the next schema revision:

- The top-level device is the **manifest owner**.
- An entry’s producer facts describe **who produced those bytes**, where known.
- Importing or re-slotting a version may create an observation in our own manifest without changing its producer.
- Producer facts needed after an import are carried inline, rather than recoverable only by looking up another device’s mutable current manifest.
- An unknown producer remains unknown.
- A content hash can have multiple observations. Equal bytes do not prove a unique author or capture time.
- Readers take a **set of claims**, not a right-biased merge in which the last manifest read wins for a path.

This refines the signed schema’s “nothing stamps a file it did not write” rule without weakening its intent: observing imported data must not falsely claim authorship. [S03 §2, §5–6; S21]

Foreign manifests are downloaded to an **out-of-tree observation cache**, not bulk-restored into the save tree. They are never republished by us. If an existing tree contains foreign manifests, exclude them from every upload and import their contents as observations without treating their presence as permission to overwrite the producer’s remote file.

Before a freshly installed device publishes under an existing device ID, read its previous remote manifest. Hydrate only facts supported by matching bytes; do not replace it blindly with an empty manifest. A detected same-ID fork stops control-file publication. V1 does not need a second device identity or a multi-generation writer protocol to report that condition safely. [D-CLOUD-009; S34]

### 4.3 Save units and complete membership

A file hash identifies bytes. A **save unit** identifies the collection that must be compared and installed coherently.

- **Numbered state:** state payload plus its companion screenshot dependency.
- **Auto state:** resume-point payload plus its screenshot dependency.
- **Ordinary in-game save:** one file where the emulator really uses one file.
- **Multi-file in-game save:** a measured, complete member set.
- **Shared container:** a VMU or memory-card unit that can contain several games.

Keep per-file `kind` as `state`, `auto`, or `save`. Add the shared-container distinction at the **unit** level: a container’s `rom` is nullable and its header names the container. This adopts the useful distinction credited to `mistral-revised_plan-r2.md` without claiming that “container” is a fourth file format.

For every unit, compare a canonical **member map**: relative member path → stored-byte hash, including membership changes. A screenshot is a dependency with its own hash, but remains outside the save version’s identity, as D-CLOUD-030 requires.

Do not assume that every `.eep` and `.mpk` pair, every PPSSPP directory, or every Dreamcast folder is one transaction. The emulator inventory determines those boundaries. If a required member is outside the effective allowlist, that unit is incomplete and cannot be automatically transferred as if complete. [S01 §4.8; S32]

Preserve `rom` as the ROM filename supplied by ES, including the extension. A discovery-regex stem is not a substitute. Record a relative content locator where needed to distinguish identical basenames in different directories; do not pretend that this alone fixes an emulator that writes both games to the same local save path. [S03 §6; S39; S42]

### 4.4 Agreement belongs to a sync context

Keep agreement local under `/storage/.cache/cloud_sync/`, as D-CLOUD-031 specifies.

Bind it to:

- remote name and backend type;
- remote save root;
- normalized local backup and restore roots;
- a local link/context identity that changes when setup switches accounts or namespaces.

The five path/type/name values are necessary but not sufficient for an account relink under the same remote name. Ordinary OAuth token refresh must not invalidate agreement.

A changed context invalidates agreement as overwrite permission. It does not erase retained saves or replay an old pending plan against the new destination.

**Establish agreement on verified equality as well as on verified transfer.** Otherwise, a device upgraded while local and cloud bytes already match never obtains a baseline, and its first later edit unnecessarily becomes “never agreed → ask.” That gap follows directly from the current schema’s transfer-only wording. [S03 §2–3, §9; S11]

### 4.5 Schema and parser discipline

The next schema revision must cover:

- owner versus immutable producer metadata;
- complete unit membership and container identity;
- screenshot hashes and verified pairing;
- current retirement notices;
- agreement established by equality;
- sync-context binding for local control state.

Read schema 1 conservatively and preserve unknown values. Refuse unsupported higher schemas for mutation. Reject absolute paths, traversal components, unsafe links escaping the root, and malformed member sets. Do not turn a parse failure into an empty manifest.

These are schema changes requiring a new refinement of D-CLOUD-031, not merely implementation detail.

---

## 5. Classification and deletion semantics

### 5.1 The classifier works on units

Let:

- **L** be the verified local member map;
- **C** be the current verified cloud member map;
- **A** be the last verified common map in this sync context.

Before this comparison, reconcile unambiguous moves by equal version hashes within the same game/core repository.

| Condition | Outcome |
|---|---|
| L = C | Identical. Establish or refresh agreement from that equality. |
| L ≠ C; A known; L = A | Cloud changed. Eligible for verified download. |
| L ≠ C; A known; C = A | Device changed. Eligible for verified upload. |
| L ≠ C; A known; both differ from A | Genuine fork. Player decision required. |
| L ≠ C; no A | Never agreed. Player decision required. |
| One side has a genuinely new unit; complete evidence confirms absence on the other; no prior presence or retirement contradicts this | One-way transfer. |
| A previously present unit is now absent without recorded intent | Unexplained absence. Hold mutation; do not infer deletion or treat it as a new upload. |
| A matching, explicit retirement targets the unchanged version | Apply the retirement through preservation and verification. |
| A retirement for X encounters Y at a relevant occurrence | Stale operation or delete/edit conflict. Never delete Y under X’s authorization. |
| Listing, membership, manifest, or byte evidence is insufficient | Unknown/pending. Not “identical” and not “no conflicts.” |

For a two-file save:

- A = `(a₀, b₀)`
- L = `(a₁, b₀)`
- C = `(a₀, b₁)`

Both complete maps changed, so this is a conflict. “Mark the unit divergent if any individual file is divergent” misses it and silently synthesizes `(a₁, b₁)`, a save neither device produced.

### 5.2 Explicit deletions propagate; unexplained absence does not

V1 honors an ES deletion across the synced library.

The delete operation records, before removing bytes:

- an operation ID;
- the issuing device and sync context;
- the game/core or save-unit scope;
- the exact version and occurrence being retired;
- whether an equivalent intended occurrence remains.

The live deletion wording must make its synced-library effect clear. Reuse an existing confirmation if there is one; do not add a second confirmation inside conflict resolution.

A remote or peer-side retirement is conditional on the expected version still being present. A new occupant turns it into a stale operation or conflict.

This is the minimal machinery needed to distinguish an intentional delete from a missing card or unexplained missing file. The latter is a reason to stop, not a reason to abandon deletion propagation.

**Depth limit:** retirement notices are current deletion intent, not an ancestry chain. They may need to outlive an offline device; they are not pruned by the discard-history count. V1 does not build acknowledgement vectors or distributed garbage collection. If a control-state limit prevents retaining necessary intent, stop further automatic retirement rather than silently dropping it.

A future intentional restore is a **new publication**, possibly of the same SHA-256 version. A retirement is not a permanent stigma on those bytes.

The actual `GuiSaveState.cpp` deletion call site is not embedded. Its reported location must be inspected before implementing this hook. [S25; S11]

### 5.3 Compaction must converge on both sides

Apply D-CLOUD-030 to **numbered states within one game/core repository**:

- re-read and compare the relevant state bytes;
- retain the lower-numbered occurrence;
- remove the redundant higher-numbered occurrence on whichever side holds it;
- preserve correct screenshot association;
- log the operation.

Do not compact an auto resume point into a numbered state, or equal bytes across different games, cores, or save kinds.

Cloud-side compaction closes the upload/download/compact loop without requiring a move journal. ES’s net renumbering can ordinarily be recognized by equal hashes at changed paths. An ambiguous rename-then-edit loses some lineage detail, not safety: leave `replaces` unknown and classify conservatively.

### 5.4 No V1 cross-device resolution history

Suppose A and B diverge from X:

1. A compares both versions and chooses A’s.
2. B later compares A’s published choice with B’s version and chooses B’s.
3. A, unchanged since its own last agreement, sees the cloud change to B’s choice.

The correct result is an ordinary download of that later informed decision, retaining A’s replaced copy. V1 does not need to force another conflict merely to preserve A’s earlier preference.

A stale wizard cannot publish an old choice blindly: apply revalidates the exact inputs it showed. That is an in-flight operation check, not a permanent `resolves` history.

---

## 6. Transport, verification, and the watched exit path

### 6.1 Current remote evidence is mandatory before overwrite

Use native remote hashes when they can be matched to a verified stored-byte observation.

Use manifest claims, size, and mtime to:

- locate likely versions;
- identify obvious disagreement;
- prioritize required reads.

Do **not** use them alone to certify unchanged content on a hashless backend.

For a hashless unit whose canonical version might be overwritten, fetch its current bytes to a fresh, candidate-scoped location and hash them. The read must not be silently skipped by rclone’s own size comparison. The corpus’s same-size archive defect is precisely the counterexample to relying on a successful copy command here. [S29–S30]

A full verify on a hashless backend may ultimately read the whole eligible save library. Candidate-scoped staging limits what the exit path reads; it does not make that full-pass cost disappear. Use the long-transfer surface when the measured work warrants it.

Computing a backend-native hash locally can be a useful optimization if rclone’s installed version supports it correctly. It cannot reveal whether the cloud has changed since the last observation. Test it; do not make it a prerequisite or use it to eliminate fresh remote evidence.

### 6.2 Exact selections, not a bare manifest include

For exit uploads, the selected set consists of approved changed payloads, their required companions, and our own manifest when dirty.

Use an exact file-list interface, such as a proven `--files-from` mode, against a frozen candidate bundle. Test its behavior with the deployed rclone, filters, nested paths, spaces, and Unicode before adopting it.

Do not add a lone `--include` for the manifest to an otherwise broad save copy. The rule document explicitly warns that an include excludes everything it does not match. [S09]

Enforce these invariants independently of optional `RCLONEOPTS` and user defaults:

- mandatory save membership restrictions;
- no foreign-manifest upload;
- no engine temporary files;
- no ES `.state.auto.bak` transients;
- no other sync clients’ conflict artifacts;
- no restoration outside the intended local root;
- no raw conflict-resolution or delete flags supplied through a customization.

The existing helper places user rules before defaults, and a non-empty options array can replace the fallback containing `--filter-from`. A new default exclusion alone does not close either hole. [S29–S32]

### 6.3 A manifest is not a transaction commit

An owned manifest may ride with the selected payload. It may arrive first.

That is safe only because:

- no reader chooses a cloud head by manifest timestamp;
- no reader advances agreement merely because a manifest arrived;
- a declared unit must be checked as a complete map;
- a manifest/payload mismatch becomes pending evidence;
- producer metadata is attached only to matching bytes.

A separate manifest-last `copyto` may be useful if measurement shows an operational benefit, but it is not a load-bearing commit protocol and does not deserve an extra exit-path process by default.

`remote_hash: null` remains valid. Save a verified native-hash association in local agreement when available; do not create another upload or listing solely to fill a display-independent field.

### 6.4 Exit behavior

**Idle**

1. Complete local capture.
2. Check for dirty payloads, pending required operations, and existing unresolved choices.
3. If there is no new work, start no rclone process.
4. Say **“No new saves to upload,”** not “The cloud is fully in sync.”

If choices or verification are already pending, say so instead.

**Changed**

1. Freeze the candidate units locally.
2. Acquire the cloud lock.
3. Obtain current cloud evidence for those units.
4. Upload only units classified as device-changed or safely new.
5. Leave forks and insufficiently verified units pending.
6. Verify the actual result before advancing agreement.

This satisfies #22’s reported acceptance criterion that a both-sides-changed save is **refused**, not silently resolved, on game exit. Recoverable overwrite is not an alternative interpretation of that criterion. [S05 §5; S23]

**Budget rule**

- Preserve the approximately five-second no-change experience; target zero rclone starts there.
- Measure changed paths against the existing approximately seven-second one-save observation rather than inventing a two-process or five-second guarantee.
- If sufficient verification exceeds the agreed foreground budget, leave that unit pending for the boot/menu full pass.
- The card must say it is waiting, not that the save is safe in the cloud.

Measure process starts, backend requests, bytes read, and wall time separately. `--backup-dir` may add no rclone process while adding costly remote work. [D-CLOUD-028; S09]

### 6.5 Reachability

Keep the exit path’s fast local check; do not replace it with a ping.

For a literal endpoint address, a kernel route lookup can recognize a connected LAN route without a default gateway. For an endpoint not known locally, do not start a DNS-and-ping sequence merely to decide whether to start the real work.

A missing default route does not prove that every hostname-based LAN service is unreachable. The safe response is a truthful pending/skip outcome, with a bounded real operation available on the explicit full pass. Capture still happens.

### 6.6 Preservation and concurrency

Before deliberate replacement, the engine already holds verified input copies and metadata. Add a tested `--backup-dir` guard to replacement transfers in both directions, using unique device/operation components and a non-overlapping destination.

Validate archive-prefix derivation for both path-based and bucket-based remotes; a string that works beside `/ROCKNIX/Saves` is not automatically valid when the configured root is a bucket root.

**What this claims:** recovery of planned preimages, and any additional race preservation demonstrated by the backend test.

**What it does not claim:** cross-device exclusion, compare-and-swap, or linearizable multi-object publication.

The preservation gate has three outcomes:

| Outcome | Action |
|---|---|
| All known inputs and an injected intervening head survive the tested kill/race points | Use the mechanism for that tested backend behavior; document the remaining one-player concurrency assumption. |
| Unsupported or ambiguous preservation behavior | No canonical replacement through that path until a verified alternative exists. Keep the local candidate pending. |
| An injected head disappears from all expected locations | Stop the unsafe path. Investigate a narrowly scoped preservation change or obtain an explicit supported-backend scope decision before release. |

Do not pre-build a protected-publication history for all 69 backends. Equally, do not call a lost update “recoverable” because a lineage record can describe the bytes that vanished.

### 6.7 Bisync’s role

Run the spike against rclone 1.75.0 with:

- genuine both-sides changes;
- compressed `#RZIPv` states;
- renumber-like moves;
- same-size edits;
- excluded files;
- first-run state;
- interrupted runs;
- filter changes;
- `--recover` and `--resilient`.

Observe the actual files and listing state, not just the log.

The default `--conflict-resolve none` is not, by itself, proof of a non-mutating detector API. The embedded material supplies flags and design expectations, not the required run. [S05; S16; S23]

Bisync may later earn a bulk-transport role if it simplifies the implementation without bypassing the unit classifier or creating a second agreement authority. Otherwise, use exact rclone copy operations.

There is no production `bisync … || bisync --resync` path. No code edits bisync’s private listing files to manufacture agreement. Its workdir, if used, is explicit, persistent, and bound to the sync context.

---

## 7. The wizard, safe merging, and interruption

### 7.1 Presentation

Keep the established IA:

- system → game walkthrough;
- cloud always left;
- actual state screenshot or appropriate glyph;
- date/time, device/model, emulator/core/build;
- no size or play-time comparison;
- KEEP LEFT / KEEP RIGHT / KEEP BOTH;
- KEEP BOTH disabled with a reason for in-game saves and unsupported state formats.

For a shared memory card, the heading names the container. It must not imply that the choice affects only the game most recently played.

Retain an **explicit choice** requirement; do not preselect a side by time, size, compatibility, or progress heuristics.

For an auto-state conflict:

- KEEP LEFT makes the cloud version the resume point.
- KEEP RIGHT keeps the device version as the resume point.
- KEEP BOTH keeps the device’s `.state.auto` and places the cloud version in a numbered slot with its PNG.

The KEEP BOTH explanation and done page name that outcome. There is no resume-side sub-choice.

### 7.2 Trigger and cancellation wording

Proposed IA revision:

- **Explicit SYNC:** after the non-conflict preparation completes, open the wizard if choices are needed.
- **Boot/game exit:** leave a durable pending result and visible indication; do not ambush the player with a walkthrough.
- **Kid/kiosk mode:** do not silently resolve because the settings route is hidden. Preserve the pending work until an authorized user enters full UI. [S13]

Clarify the contradictory “nothing transfers” wording:

> Cancelling before COMPLETE discards the walkthrough’s decisions. It does not apply any conflict resolution. Non-conflicting sync work completed before the walkthrough remains completed.

Preview downloads into staging are not canonical resolution, and need not be undone.

### 7.3 Pre-pass and slot safety

Before allowing KEEP BOTH, require a complete, verified inventory for the affected game/core repository and finish downloading its cloud-only states.

This establishes the free-slot premise for that snapshot. It does not prevent another device creating a slot later. Apply therefore revalidates cloud inputs and destination occupancy.

An interrupted pre-pass cannot open the wizard with “probably complete” inventory. Resume preparation or leave it pending.

Allocate multiple KEEP BOTH outputs as one collision-checked plan, or sequentially with a repository refresh after each installation. Repeated calls against an unchanged repository must not reserve the same slot twice.

### 7.4 Checked ES adapter: acceptance contract

The adapter must satisfy all of these:

1. **Use ES’s repository/config naming conventions**, including `firstslot`, rather than inventing an independent slot convention.
2. Refresh inventory at the appropriate boundary.
3. Handle an enabled **auto-only repository**: its non-empty vector contains no non-negative slot, so today’s allocator returns `-99`; allocate from `firstslot` instead.
4. Validate the proposed slot against actual occupancy. The scan to 99999 is not an unlimited-allocation proof, and does not justify a product cap of 99.
5. Copy first and verify destination bytes and screenshot; only then retire a source.
6. Do not trust `copyToSlot`’s `true` after an attempted copy or rename. The function discards those operations’ return values.
7. Ensure the destination is the **real configured repository**, not the staging directory. `makeStateFilename` derives a full path from `fileName`’s parent.
8. Reject unsupported standalone save-state allocation rather than forcing it through a repository enabled only for RetroArch.
9. Keep auto-state and numbered-state semantics separate.
10. Check save-state/PNG pairing, and never display an old or substitute image as the chosen version’s screenshot.

These requirements are grounded in the supplied implementations. The headers defining default arguments are missing and must be inspected. [S37–S39]

Prefer repairing the shared primitive or adding an explicit destination-aware checked adapter over duplicating its template logic in shell. Stage locally under an engine-controlled temporary name when necessary; exact transfer selection must exclude that temporary file even though the broad save allowlist would admit it.

### 7.5 Apply is a recoverable operation, not an atomic cloud transaction

At COMPLETE:

1. Freeze choices, expected input maps, output paths, and retained locations.
2. Revalidate the local and cloud inputs and destination reservations.
3. Verify required preimages and retained metadata are durable.
4. Write an audit **intent** record before destructive work.
5. Apply one coherent unit at a time.
6. Verify resulting payloads and companion files.
7. Advance agreement for verified units.
8. Finalize retained-copy records and the typed result.
9. Prune only eligible completed retention entries.

The frozen plan is the apply journal. Do not build a second overlapping journal.

Power loss after COMPLETE is not equivalent to cancelling the walkthrough. Recovery examines the durable plan and actual before/after hashes. It completes or safely stops the interrupted unit before that unit is offered for play. It never overwrites an unexpected new local version to make the journal look complete.

A multi-file local installation need not pretend that several filesystem renames are atomic. Quiescence, durable preimages, and recovery before gameplay supply the required boundary.

The two minimum kill points, adopted from `gemini-revised_plan-r2.md`, are:

- after local replacement but before remote publication;
- after remote publication but before agreement advances.

---

## 8. Retention designed for the later reader

### 8.1 V1 contract

**V1 keeps discarded copies by default and provides no restore control.**

The done page names the discarded copy or set, names what won or where KEEP BOTH placed the additional state, and says that the discarded copies are kept **on this device**.

The retention setting remains outside the conflict walkthrough. If the player deliberately disables post-completion retention, transactional preimages still remain until apply has been verified; the done page must describe the actual outcome rather than claim copies were kept.

### 8.2 Store location

Use a dedicated durable data location, proposed as:

`/storage/.local/share/rocknix/cloud-saves/`

with separate `discarded/`, `preimages/`, and `pending/` areas.

This is a **proposed new path**, not an existing corpus artifact.

Reasons:

- outside the save and content transfer roots;
- outside the settings-backup convention described in the corpus;
- not under a directory whose documented convention permits regeneration or invalidation as a cache.

The real backup and cleanup tooling is not all embedded, so exclusion and upgrade survival remain acceptance tests. [S02 “Where state lives”; S04; S11]

If implementation retains the earlier `.cache/cloud_sync/discarded` placement instead, it must explicitly exempt that subtree from cache invalidation. My recommendation is to avoid giving irreplaceable data a disposable-cache home in the first place.

### 8.3 Record shape

Use a unique record ID, not a timestamp as identity. Each finalized retained set includes:

| Data | Required content |
|---|---|
| **Record identity** | Schema, record ID, operation ID, resolving device, sync-context reference |
| **Picker grouping** | System, supplied ROM filename and content locator where known; unit ID and unit kind; shared-container label where applicable |
| **Original placement** | Original relative paths, core repository, numbered slot or `auto`; final destination mapping when relevant |
| **Payload** | Every retained member’s stored-byte SHA-256, size, and local stored location |
| **Producer snapshot** | Device ID, label/model/family, emulator/core/build, capture times, clock confidence, and explicit unknowns—copied inline at retention time |
| **Preview** | Retained PNG location and hash, or an explicit absence; no lookup of the game’s latest thumbnail |
| **Decision** | KEEP LEFT / KEEP RIGHT / KEEP BOTH or non-conflict replacement reason; which side won, winner map/hashes, and known winner producer metadata |
| **Retention reason** | Conflict loser, verified one-way replacement, explicit deletion, or redundant occurrence retirement |
| **Completion** | Prepared versus finalized state, with verification results sufficient to distinguish a complete retained set from interrupted work |

The record does **not** depend on:

- a current manifest still mentioning the loser;
- the rotating audit log;
- the active apply-plan file surviving forever;
- a filename timestamp being correct.

Keep this record beside the bytes after successful apply. Remove the in-flight plan only after the finalized records and agreement updates are safely in place.

**Yes: a later restore tool can drive a picker from this store.** It can group by game or container, show the old side’s metadata and screenshot, identify the original slot and winning side, and compare the retained version with the then-current one without reconstructing history.

### 8.4 Count and pruning

Propose an initial count of **three completed discard events per logical retention bucket**, not three globally.

- An in-game unit or shared container has its own bucket.
- An auto resume point has its own bucket.
- Renumberable numbered states use a game/core collection bucket rather than an ephemeral slot path.
- One walkthrough apply affecting several numbered slots in that bucket retains its discarded set as one event, with each original slot recorded.

This avoids losing a game’s recovery copy because three unrelated games synced, and avoids renumbering moving retention between arbitrary path keys.

Routine transport preimages do not consume the conflict-discard allowance. Keep the immediate verified replacement preimage separately; do not let routine downloads evict the latest player-decision recovery set.

Prune by local commit order in a small ordered index, not by wall-clock timestamps. A wrong RTC must not make a newly discarded copy appear oldest.

**Unresolved candidates and incomplete transactions are exempt from rolling-count pruning.** If storage cannot accommodate required preservation, stop the affected sync mutation. Do not free space by deleting the only unreviewed copy.

### 8.5 Separate history-restore issue

Create a separate issue, without inventing its number here:

- enter from outside the conflict-resolution moment;
- choose a game/container and a retained version;
- reuse the compare-and-choose surface against the current version;
- restore through the same verification and preservation engine;
- treat restoration as a new explicit publication, even if its bytes equal an older version.

V1 implements the store contract and tests its future-reader projection. It does not implement this screen.

---

## 9. Migration and explicit decision changes

### 9.1 Cut over all save writers together

D-CLOUD-029 stands. There is no interim `--update` patch presented as conflict safety.

Capture can be developed in **shadow mode outside the synced tree** while the shipped paths remain. Do not publish a new control format into a tree still handled by unrestricted legacy bulk transfers and call that a safe partial rollout.

At activation, route all save-writing entry points through the same engine:

- boot;
- game exit;
- UPLOAD / DOWNLOAD / SYNC rows;
- the hub’s SAVE DATA actions;
- Tools/script entry points;
- #37’s save-state-manager sync action;
- any later shutdown pass.

No raw method flag or old ES command may bypass the classifier.

| Existing behavior | New home |
|---|---|
| Cloud-before-local ordering in two-way sync | Classify the verified L/C/A maps before any write; apply only the approved direction |
| Cloud lock | Preserved in the shared coordinator |
| Exit window | Hash-selected dirty units; mtime is not overwrite authority |
| Fast offline answer | Local route check, after capture |
| Save-only exit operation | Preserved; no system archive work on exit |
| Last-run stamps | Typed, verified results written to the established local status locations |
| Allowlist and restore exclusions | Mandatory engine invariants, not optional user arguments |
| Conflict-client exclusions | Enforced in the saves tier as well as content |
| Default copy safety | Exact approved transfers plus preservation; no unchecked mirror behavior |

The supplied scripts pass raw rclone exit codes through to a UI that reserves 3 and 4 for skips, and their final exits can mask a system-phase failure. Normalize script outcomes rather than preserving those ambiguities. [S29–S30; S40]

Each result contains a caller-issued run ID and sync-context ID. A missing, stale, malformed, or mismatched result is **unknown/failed**, never success. Keep raw rclone codes as diagnostic data.

### 9.2 Keep #10 in this drop, last

D-CLOUD-017 still earns its place. A sync detector cannot recover a state that one core already overwrote locally before capture.

But shipping `es_savestates.cfg` is not just a directory edit:

- compiled `Default()` enables autosave, incremental states, and `racommands`;
- XML parsing changes those defaults and hard-codes `racommands = false`;
- ES scans configured directories rather than recursively discovering every new core directory;
- RetroArch’s writer must use the same layout. [S37–S39; S04]

Therefore:

1. Rehearse the actual launch behavior first.
2. Preserve auto-resume, numbered-slot loading, and incremental-state behavior deliberately.
3. Read both legacy flat and new per-core layouts.
4. Write new, known-producer states into the core layout.
5. Keep old states honestly `unknown`; do not assign them to whichever core is default today.
6. Move known data only by copy, verification, then removal.

If the rehearsal fails, do not ship the naive XML. Bring the demonstrated obstacle to the maintainer as a proposed change to the drop’s scope. The directory decision itself need not be reversed.

### 9.3 Preserve split-root import behavior

The shipped config explicitly documents different `BACKUPPATH` and `RESTOREPATH` values as a way to restore elsewhere. [S33]

- Two-way reconciliation requires one coherent local root and refuses a split-root configuration as a two-way sync.
- An explicit download to the separate restore root remains a **one-way import**.
- It does not advance the main root’s agreement record.
- A populated import destination still receives preservation and conflict checks; “import” is not permission to overwrite arbitrary existing data.
- Do not silently rewrite the owner’s chosen paths.

### 9.4 Register actions

Use new append-only refinement rows; the labels below are proposals, **not assigned decision IDs**.

| Existing decision or specification | Required change |
|---|---|
| **D-CLOUD-031** | Reopen/refine the schema semantics: verified equality establishes agreement; union means claims rather than last-map-wins; distinguish owner from producer; add complete unit membership, screenshot binding, retirement intent, and local context binding. The disjoint-member fork and equality-bootstrap traces justify reopening it. |
| **D-CLOUD-030** | Refine compaction scope to numbered states in one game/core repository, on both sides, after verification. Do not collapse auto and numbered roles. SHA-256 identity itself is unchanged. |
| **D-CLOUD-028** | Refine the exit implementation: hash-selected changes and zero network work when idle; current remote evidence is allowed on changed units; defer expensive safe work rather than overwrite unread heads. Keep the local, immediate offline posture. |
| **D-CLOUD-014 / D-CLOUD-015** | Explicitly retire unchecked save-tier mirroring as an automatic writer. A legacy `sync` setting cannot authorize unclassified removals or overwrites. Default upgraded configurations continue on guarded sync; a deliberately requested operation requiring additional mirror deletions is refused rather than silently executed. No new mirror UI is added in V1. The justification is the shared-library/progress rule, not a detached-card edge case. |
| **D-CLOUD-024 and IA rev 4; #25 scope** | Record the authoritative amendment: retention on by default, count-bounded; no V1 restore control; the later restore tool is separate. Amend the IA for queued unattended conflicts and precise cancellation wording. Retention was not decided by D-CLOUD-027. |
| **#9 / #22 / IA bisync mechanism** | Request explicit approval to make our unit classifier authoritative and #9 a transport/spike dependency rather than an unconditional bisync-adoption dependency. No register row currently decides the detector, but this still changes the stated approach and needs more than a body edit. |
| **Explicit deletion propagation** | Add a new policy row covering version-specific intent, stale-target refusal, and unexplained absence. This extends behavior; it is not implied by a file disappearing. |

**No reopening requested:** D-CLOUD-009 identity; D-CLOUD-017 core-based layout; D-CLOUD-025 hardware compatibility gate; D-CLOUD-026 copy–verify–delete; D-CLOUD-027 audit location/rotation; D-CLOUD-029 temporary shipped posture.

---

## 10. Proof program

### 10.1 Before production implementation: ordered gates

Disposable probes are allowed to answer substrate questions. They are not evidence that the eventual integrated implementation works.

| Order | Experiment and device | Owner / before | Required result or branch |
|---|---|---|---|
| **0** | Obtain the missing sources; run pure fixtures for unit-map classification, equality bootstrap, stale retirement, record projection, and exact selection | #20 / #22, before schema revision is accepted | Disjoint-member edits conflict; equality establishes A; stale retirement never removes another version; retained records alone supply picker data |
| **1** | Repair and execute `tools/cloud-round-trip` on a disposable GENERIC_X64 VM against loopback WebDAV and MinIO | #35, before #22 | Actual keys and bytes agree with assertions; positive transfers accompany exclusion tests; no false success |
| **2** | On the reported H700 pair, trace new-game, numbered-slot, and auto-resume launches using disposable content; record files, hashes, actual command/core, and ES cleanup | #21 / #24, before capture and adapter design is finalized | Establish which bytes exist during and after launch; reproduce auto-only allocation behavior; determine capture’s safe point |
| **3** | rclone 1.75.0 bisync, exact-selection, checksum, and `copy --backup-dir` probes: VM → WebDAV/MinIO; H700 → disposable Dropbox prefix | #9 / #22, before transport selection | Record real mutations, listing state, unsupported interfaces, verification behavior, and interruption results |
| **4** | Two-H700 interleaved writes on Dropbox; two disposable clients for the loopback backend; kill at preservation/publication boundaries | #22, before replacement transfers are enabled | Every injected head remains available, or take the failure branch in §6.6; no unearned atomicity claim |
| **5** | H700 shadow census across actual launch habits, including repeated sessions and a same-size save change | #21 / #22, before exit-path activation | Measure local scan/hash cost, rclone starts, requests, bytes, wall time, unknown rate, and forks by kind; set the foreground deferral threshold |
| **6** | Same-chipset compatibility control on RG35XX SP ↔ RG-SP; then RG351M/RG353M directed pairs, same build/core; version mismatch and corruption tests | #19, before badge severity is designed | Record loud refusal, visibly wrong load, or successful continued operation. Repeat with a second core; do not generalize one core to all |
| **7** | #10 launch/layout rehearsal on H700, then another family: compiled-default behavior versus proposed config, legacy and new layouts both populated | #10, before per-core writing is enabled | Writer and reader agree; auto/incremental behavior preserved; no false provenance or hidden legacy state |
| **8** | Physical RG351M recognition and controller walkthrough, plus 640×480 validation | #23, before UI acceptance | Pictures are recognizable, choices are unambiguous, long names and unknown metadata fit; otherwise add inspection/zoom without swapping source roles |
| **9** | Integrated clean-install and upgrade fault campaign on VM, then H700: pre-pass interruption, multi-choice KEEP BOTH, ES death with emulator alive, apply kills, retry, full storage | #22–#24, before release | Original and selected bytes remain recoverable, no stale result says success, no wrong-slot writes, no re-launch into a partially installed unit |

D-QA-002 remains binding: the QA WebDAV stays on loopback. Do not expose its credential on the LAN merely to make a hardware test convenient. Use the VM for that backend and a disposable real-remote prefix for hardware. [S06]

### 10.2 The eleven known unknowns, explicitly resolved or gated

| Known unknown | Plan and interim behavior |
|---|---|
| **1. Chipset compatibility and loud/silent failure** | Gate 6. Same-chipset control first, then same-build cross-chipset tests and a second core. A matching build pin is context, not universal proof of compatibility. Until measured, show compatibility as unverified rather than safe. |
| **2. Bisync, compressed states, rename, interruption, agreement overlap** | Gate 3. Inspect real files and bisync state. Our agreement remains the only classifier authority regardless of the result; ordinary exact rclone transfers are the fallback. |
| **3. Auto-state conflict frequency** | Gates 2 and 5. Numbered-slot launches can restore the pre-session auto file; the schema’s “every session” claim is not generally established. Label `auto` as a resume point regardless of frequency. |
| **4. KEEP BOTH pre-pass sufficiency and interruption** | Gates 0 and 9. Complete relevant inventory, positive pre-pass completion, apply-time revalidation, unique reservations. Interrupted preparation leaves the wizard closed/pending. |
| **5. Missing `es_savestates.cfg` and two-consumer layout** | Gate 7. Inspect actual launcher configuration and preserve launch semantics, not just paths. Read old layout while writing new. |
| **6. Build pins and actual emulator/core capture** | Before #21, verify generated pins against the installed packages and build override resolution. Inspect the emitted artifact on H700. Gate 2 proves launch-context wiring, including core overrides. Unknown mappings stay unknown. |
| **7. `BACKUPPATH == RESTOREPATH`** | Gate 0 plus VM import tests. Require equality for two-way reconciliation; preserve split-root one-way import without advancing main agreement. |
| **8. Standalone multi-file layouts** | Before automatic classification, inventory PPSSPP, Dreamcast VMU, N64, and PSX outputs on devices that run them. Prove member boundaries and allowlist completeness. Unknown layouts remain pending, not independently merged per file. |
| **9. 480×320 recognizability** | Gate 8 on the physical RG351M. VM frames prove layout, not human recognition. Add a larger inspection view if needed while preserving cloud-left/device-right semantics. |
| **10. Two devices online at once** | Gate 4, plus lifecycle and ES-death tests in Gate 9. No distributed-lock claim. Required preimages and tested preservation are the V1 safety floor. |
| **11. Never-run round-trip suite** | Gate 1. Fix the harness before treating it as evidence. Keep it off a configured player device. |

### 10.3 The round-trip harness needs repair before its first authoritative run

The supplied harness is not merely “waiting to be run.”

Source-visible problems include:

- It overwrites `rclone.conf` before asserting the selected remote, and does not restore it.
- Its archive-name expectations disagree with the uploader’s date-prefix behavior.
- It expects restore at the original undated name while the restore script keeps the selected remote name.
- It looks for a generated tar archive that its archive fixture does not create.
- Many script invocations omit `--yes`, discard output, and have no operation timeout.
- Some checks use basename presence rather than exact remote keys and bytes.

These are visible in the embedded harness and scripts. They are not executed failures I observed. [S29–S30; S36]

Use a disposable VM initially. If the harness is later permitted on populated hardware, it must inspect existing configuration before any overwrite, explicitly preserve and restore it even on failure, and independently guard every destructive test path.

### 10.4 Additional failures worth the cheapest experiment

| Failure not adequately settled by the current design | Cheapest revealing experiment |
|---|---|
| Same basename in two ROM directories maps to one local state path | Launch two disposable same-basename contents; inspect actual output paths before involving sync |
| Backend case folding or Unicode normalization creates false new/missing pairs | Round-trip case variants and normalized/decomposed names through a disposable backend prefix |
| A legitimate save-unit member is excluded by `*.db` or another broad rule | Plant a measured unit with that member; assert the engine refuses incomplete-unit synchronization |
| Thumbnail is stale while the state changed | Change only the state, then only the PNG; assert no mismatched preview is presented as authoritative |
| Temporary `.auto` or `.bak` bytes leak during a session | Launch a numbered state while requesting boot/menu sync; inspect transferred keys and hashes |
| A cloned card creates two writers for one manifest ID | Boot two disposable installations with the same stored ID; force differing own-manifest state; verify refusal, not last-writer-wins |
| Staging and destination are on different filesystems | Put them on different mounts; interrupt installation; verify copy-and-check rather than assumed atomic rename |
| Wrong clock prunes the newest discard | Move time backward between two resolutions; verify pruning follows commit order |
| Save root disappears or is replaced with a different populated root | Simulate the change in a VM; verify missing/foreign-root evidence does not authorize deletion |
| Empty or stale result file produces success | Kill before result publication and replay a result from another run ID |
| Save manifests arrive before their payload or remain after a failed upload | Deliberately reorder/interrupt publication; readers must report pending evidence, not a clean sync |
| Thirty conflicts induce wrong-side muscle memory | Controller-only walkthrough with repeated and mixed save kinds, including unknown provenance |
| A compatibility test “loads correctly” but corrupts a later save | Continue execution after load, write an in-game save in a disposable test, and reload it |

---

## 11. Build order and scope boundary

### Load-bearing V1

Build in this order:

1. **Repair the evidence base:** harness, missing-source inspection, pure classifier and store fixtures.
2. **Accept the schema and IA refinements.**
3. **Implement lifecycle coordination and shadow capture**, including build-pin emission and actual launch context.
4. **Implement the unit classifier, exact rclone adapter, typed results, retained-copy store, and recoverable apply.**
5. **Replace every save-writing path together.**
6. **Implement the checked KEEP BOTH adapter and wizard.**
7. **Enable per-core writing after #10’s rehearsal**, keeping legacy reads.
8. **Run integrated upgrade, interruption, two-device, and physical UI acceptance.**

The following must ship with the wizard:

- retention on by default, with self-contained retained metadata;
- no V1 undo control;
- content-based unit classification;
- equality bootstrap;
- current remote evidence before overwrite;
- correct handling of unknown evidence;
- safe ownership of manifests;
- lifecycle coordination;
- checked slot allocation and copy verification;
- recoverable interrupted apply;
- exact version-specific deletion and convergent compaction;
- truthful per-run results.

### Explicitly not V1

- history-restore UI;
- multi-generation resolution receipts;
- vector clocks or a version DAG;
- a shared or local SQLite history index;
- a full remote staging mirror as the default architecture;
- a daemon;
- semantic merging of binary game saves;
- automatic progress/recency heuristics;
- a 99-slot product cap;
- a separate auto-state KEEP BOTH decision;
- move hooks solely for ancestry fidelity;
- distributed deletion-acknowledgement vectors;
- universal linearizable publication across all rclone backends;
- automatic `--resync`;
- a legacy transfer bypass when the new guard cannot run.

The recommendation is deliberately small in persistent machinery: **current observations, one agreement baseline, explicit deletion intent, one in-flight plan, and bounded retained copies with their own metadata.** That is enough to protect the decision the player just made without turning the handheld into a version-control client.

---

## 12. Gaps to surface to the orchestrator

Before implementation, obtain:

1. **`GuiSaveState.cpp`**, the save-state headers, and filesystem copy/rename utilities: delete hook, default arguments, return semantics, and timestamp behavior.
2. **`Paths.cpp`, RetroArch configuration, `setsettings.sh`, ES system configuration, and full launch/startup plumbing**: shared lifecycle ownership, boot handoff, and #10’s two-consumer layout.
3. **rclone 1.75.0 source or authoritative documentation** for bisync, `copy --backup-dir`, exact file-list filtering, native hashing of local files, and relevant backend behavior. The corpus cannot establish rclone’s future roadmap.
4. **The defaults files, content scripts, `cloud_setup`, `backuptool`, and `tools/cloud-test-backend`**: mandatory filtering, account-context invalidation, retention-store exclusion, and harness safety.
5. **The current issue bodies.** The embedded issue files predominantly contain comment-thread output. The futro supplies reported acceptance changes, but their exact current bodies are not independently present.
6. **`docs/es-ui-style-guide.md`** for final visual design.
7. The earlier revised plans if a verbatim audit of their claims is required. Here they are known only through the injected reviews.

No missing source has been assigned a fabricated declared path, hash, or test result.

---

## `corpus.provenance.json`

```json
{
  "artifact": "gpt-revised_plan-r3.md",
  "delivery": "inline; no filesystem artifact was created by this member",
  "role": "council member, round-3 revised foundation",
  "corpus_mode": "verbatim embedded read-at-time corpus supplied by Council Facilitator council-facilitator@1.2.0",
  "source_count": 42,
  "manifest_read_timestamp_utc_as_supplied": "2026-09-05T17:32:51Z",
  "member_filesystem_access": false,
  "member_independently_reread_files": false,
  "member_independently_rehashed_files": false,
  "member_executed_commands_or_hardware_tests": false,
  "hash_basis": "SHA-256 values copied from the supplied per-source headers; verified at embed time by the Facilitator, not recomputed by this member",
  "citation_mapping": "S01 through S42 map in order to the corresponding same-index entries of source_file_paths and source_file_hashes; S01 is array index 0",
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
  "injected_reviews": [
    {
      "filename": "claude_peer_review-r3.md",
      "sha256_provided": null
    },
    {
      "filename": "gemini_peer_review-r3.md",
      "sha256_provided": null
    },
    {
      "filename": "kimi_peer_review-r3.md",
      "sha256_provided": null
    },
    {
      "filename": "mistral_peer_review-r3.md",
      "sha256_provided": null
    }
  ],
  "prior_revised_plans_embedded": false,
  "revision_accountability_basis": "Quoted passages and attributions in the injected reviews; earlier plan files were not independently inspected",
  "peer_material_use": "Idea attribution and substantive critique only; not evidence of runtime behavior or of council/model behavior",
  "authoritative_prompt_amendments_applied": [
    "Preserve saves and empower player choice; one-step reversibility is the primary case; edge cases inform rather than unnecessarily constrain the approach",
    "V1 retains discarded copies ON by default with a count bound, ships no undo control, and names retained discards on the done page",
    "History restore is a separate later tool using the compare-and-choose surface; V1 retention records must support that future reader"
  ],
  "gaps_for_orchestrator": [
    {
      "material": "GuiSaveState.cpp, SaveState.h, SaveStateRepository.h, and filesystem copy/rename utility implementations",
      "reason": "Explicit-delete hook, default arguments, failure behavior, and timestamp preservation require inspection",
      "declared_source_path": null,
      "sha256": null
    },
    {
      "material": "Paths.cpp, setsettings.sh, actual RetroArch and ES system configuration, full launch supervisor and startup/network handoff",
      "reason": "Lifecycle ownership and per-core layout must be proven against both the writer and reader",
      "declared_source_path": null,
      "sha256": null
    },
    {
      "material": "rclone 1.75.0 authoritative documentation or source for bisync, copy with backup-dir, exact file-list filtering, local backend-native hashing, and backend publication behavior",
      "reason": "These proposed interfaces and preservation claims are not established by the embedded help excerpts or existing mirror-mode use",
      "declared_source_path": null,
      "sha256": null
    },
    {
      "material": "cloud_sync.conf.defaults, cloud_sync-rules.txt.defaults, cloud_content_backup, cloud_content_restore, cloud_setup, backuptool, and tools/cloud-test-backend",
      "reason": "Upgrade, filtering, account-context invalidation, retention-store exclusion, and test-environment safety need direct verification",
      "declared_source_path": null,
      "sha256": null
    },
    {
      "material": "Current standalone issue bodies and docs/es-ui-style-guide.md",
      "reason": "The embedded issue material mainly contains comments; current acceptance bodies and the full visual-design guide are not present",
      "declared_source_path": null,
      "sha256": null
    },
    {
      "material": "Earlier revised plan artifacts, including gpt-revised_plan-r2.md",
      "reason": "Available here only through review quotations and descriptions, not as complete source artifacts",
      "declared_source_path": null,
      "sha256": null
    },
    {
      "material": "Executed results for the proposed classifier, preservation protocol, lifecycle gate, compatibility matrix, and integrated wizard",
      "reason": "No such results were supplied; all corresponding gates remain unpassed in this artifact",
      "declared_source_path": null,
      "sha256": null
    }
  ],
  "proposed_path_policy": "New runtime paths in the plan are explicitly proposals, not asserted corpus sources or existing artifacts",
  "missing_source_policy": "No missing declared source paths, hashes, contents, or execution results have been fabricated"
}
```