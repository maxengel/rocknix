# Verdict: retain the core ideas, but replace the sync safety boundary

**This is a promising foundation, but not yet a safe implementation contract.** I would retain content-addressed save versions, per-device manifests, per-core savestate directories, and the native walkthrough. I would not build the production write paths around the assumption that “bisync with `--conflict-resolve none` reports conflicts and leaves their files untouched.”

The central change I recommend is:

> **ROCKNIX owns classification, the proposed resolution, and the recoverable commit. rclone transports explicitly selected artifacts. bisync is an evaluated component, not the authority that decides when player data may change.**

Three findings make this more than a preference:

1. **The proposed content identity does not yet supply a complete model of moves, provenance, or deletion.** A hash identifies bytes; it does not identify their owner, logical save, or causal history.
2. **The ES helpers are naming and allocation primitives, not verified transaction primitives.** The embedded implementation contains an auto-only allocation failure and a copy function that returns success without checking its copy results.
3. **The design postpones recovery machinery that V1 already needs.** An audit line cannot recover bytes, and “decisions are discarded after interruption” is safe only before application starts.

The signed-off schema and alignment review say that no schema changes remain. I disagree: origin versus possession, payload/thumbnail association, publication completeness, and agreement scope need decisions **before #21 makes the schema real**. This is a request to reopen the relevant portion of **D-CLOUD-031**, not permission to disregard it silently.

Sources: [`save-manifest-schema.md`](research/council-runs/2026-09-05-conflict-resolution-foundation/_sources/repo/docs/save-manifest-schema.md) (S3), [`save-manifest-alignment-review.md`](research/council-runs/2026-09-05-conflict-resolution-foundation/_sources/repo/docs/save-manifest-alignment-review.md) (S4), and [`decision-register.md`](research/council-runs/2026-09-05-conflict-resolution-foundation/_sources/repo/docs/decision-register.md) (S6).

## Disposition by component

| Component | Verdict | Required change |
|---|---|---|
| Detection | **Replace the proposed correctness boundary** | Do not infer “read-only detector” from `--conflict-resolve none`. ROCKNIX must positively authorize every mutation. |
| Version identity | **Endorse D-CLOUD-030’s SHA-256 identity** | Scope equality to a logical save context; do not equate byte equality with a move or provenance. Narrow automatic compaction. |
| Lineage | **Amend** | Distinguish replacement, movement, copying, and the state actually loaded to begin a session. A one-step `replaces` field is not complete lineage. |
| Per-device manifest | **Endorse the shape; reopen D-CLOUD-031’s sufficiency** | Separate origin from the device reporting a materialization; represent bundles, publication completeness, and namespace-scoped agreement. |
| Core namespace | **Endorse D-CLOUD-017** | Implement a genuine two-reader migration. Creating `es_savestates.cfg` changes more than directory substitution. |
| Presentation | **Endorse most of IA rev 4; amend safety semantics** | No preselected destructive answer; distinguish pre-pass transfers from conflict application; make uncertainty and recoverability usable in the flow. |
| KEEP BOTH | **Endorse re-slotting, not raw helper reuse** | Add checked allocation, reservations, destination validation, and state/PNG verification. Define auto-state behavior explicitly. |
| Audit | **Endorse D-CLOUD-027** | Keep the text log, but do not use it as the recovery journal or complete lineage store. |
| Recovery | **Move the minimum into V1** | Durable preimages and an idempotent application journal are prerequisites. A full history browser can remain V2. |
| Migration from current writers | **Endorse D-CLOUD-029’s deliberate cutover** | Replace every save-writing entrance together; do not introduce another `--update` stopgap or leave direct upload/download bypasses. |

**Evidence convention.** Statements about functions below follow from the embedded code. Hardware observations are attributed to the documents reporting them; I have not reproduced them. Predictions about unembedded rclone internals are explicitly identified as hypotheses. Source numbers identify the supplied sources; their exact declared paths and supplied SHA-256 values are recorded in the provenance appendix.

---

# 1. The end-to-end architecture

## 1.1 Detection: “no chosen winner” is not “no mutation”

The adoption argument repeatedly makes this transition:

- `--conflict-resolve none` does not choose a winning version;
- therefore bisync is a detector that can run before ROCKNIX resolves the conflict.

**The second statement does not follow from the first.** Preserving both versions by renaming them is non-destructive at the byte level, but still changes the live save namespace. That is precisely the behavior ES cannot accept.

The embedded issue comment lists both `--conflict-resolve none` and the default conflict-loser renaming policy. It does not establish a supported **plan-without-mutation / apply-this-plan** interface. The old bisync plan is also not reliable evidence of such an interface: it proposes recency resolution and a prototype command, rather than reporting a successful experiment.

Sources: [`issue-22.md`](research/council-runs/2026-09-05-conflict-resolution-foundation/_sources/issues/issue-22.md) (S23), [`rclone-bisync-planning.md`](research/council-runs/2026-09-05-conflict-resolution-foundation/_sources/rclone-bisync-planning.md) (S16), and [`issue-9.md`](research/council-runs/2026-09-05-conflict-resolution-foundation/_sources/issues/issue-9.md) (S18).

**My specific expectation to test:** an ordinary, non-dry-run bisync invocation with unresolved conflicts will preserve versions through namespace changes rather than simply return a conflict report. The exact 1.75.0 behavior and suffix rules are not established by the embedded upstream evidence, because that evidence is absent.

That expectation is enough to reject putting the invocation on live saves before the spike.

### What the spike must establish

Not merely “does it print a conflict?” It must establish all of these:

- Which files and listing-state files change during a dry run?
- What changes during a real run with `none`?
- Can conflicting paths be withheld while uncontested paths are transferred?
- Does withholding a changing set of paths invalidate bisync’s baseline or require a resync?
- After ROCKNIX performs a resolution outside bisync, what does bisync conclude on the next run?
- After interruption, which baseline is authoritative?
- Can an unsupported comparison, incomplete listing, or failed parse be distinguished from zero conflicts?
- Does the comparison detect a changed, same-size SRAM file on the hashless WebDAV backend?

A grep for `conflict` in proposed filenames is a useful **negative guard**. It is not a sufficient detector interface.

### My preferred implementation boundary

Use a small ROCKNIX reconciliation layer:

1. Obtain local observations and remote evidence through rclone.
2. Match verified content versions and normalize known layout operations.
3. Compare against the local, scoped agreement record.
4. Produce a versioned plan containing exact inputs, actions, and unresolved items.
5. Transfer only the artifacts that plan authorizes.
6. Verify results before advancing agreement.

This is not an attempt to reimplement rclone’s transports or build a generic synchronizer. ROCKNIX already needs the save-specific semantics that bisync does not know: game identity, auto states, thumbnails, core namespaces, re-slotting, and non-destructive user choices.

**Reopening request:** change #9/#22 from “bisync must be the detector” to “bisync must be evaluated against this contract.” Adopt it if it satisfies the contract without private listing-file manipulation. Otherwise use rclone’s listing and copy operations directly.

### Only one agreement authority

The schema’s agreement record and bisync’s listing history must not independently authorize writes.

I would make `/storage/.cache/cloud_sync/agreed.json` the semantic authority. If bisync remains, its workdir is transport implementation state, subordinate to the ROCKNIX plan. Never infer agreement because bisync completed, and never edit bisync listings to make an externally applied resolution look accepted.

Retain the explicit persistent workdir and the prohibition on unattended `--resync`. Neither `--recover` nor `--resilient` should be treated as a promise that every interruption is automatically recoverable.

## 1.2 The conflict table needs more than “present on one side”

The three-way test in schema §3 is a good starting point for two present, verified files. Its final row is underspecified:

> only one side has it → transfer, no prompt

That collapses several different states:

- a new file;
- an intentional deletion;
- a renamed file;
- a temporarily unavailable mount;
- an incomplete remote listing;
- a filtered-out file;
- a partly published bundle.

Those must not have the same meaning.

**Recommended V1 rule:** absence is not deletion intent. Automatic deletion propagation requires an explicit, version-specific deletion record. Without that record, preserve the remaining version.

For a recorded deletion:

- delete versus unchanged may remove a materialization, after the required preservation and verification;
- delete versus modification is a conflict;
- a path that now holds a different hash must not be deleted using an old path-only instruction.

The tombstone must identify the logical occurrence and expected version, not merely “remove slot 2.” Renumbering makes that unsafe.

This also prevents bisync’s deletion semantics from quietly replacing the schema’s copy-on-one-sided-presence semantics. The project needs to decide this explicitly rather than discover it after #9 is adopted.

---

## 1.3 Identity: keep the hash, stop asking it to answer other questions

**D-CLOUD-030 is right about version identity.** Stored-byte SHA-256 survives a rename, works independently of backend hash types, and is appropriate for byte-for-byte verification.

But the schema overstates two deductions:

> same hash under a new path is a move  
> new hash at a path is a new version replacing the old version at that path

These are useful observations, not complete descriptions of the event.

The same bytes under another path may be:

- a move;
- an intentional copy;
- a second materialization of an existing version;
- a state associated with a different core context;
- a file brought back by an old device.

Likewise, the previous contents of a path may have no causal relationship to what now occupies that path.

### A renumber-and-edit example

Start with three agreed slots containing versions A, B, and C.

On one device:

1. Delete A.
2. ES moves B and C down one slot.
3. Play and overwrite the moved B with B′.
4. Capture runs only afterward.

The final path that originally held A now holds B′. A path-local comparison can incorrectly record `B′ replaces A`. If every moved state was subsequently changed, matching final hashes against old paths cannot reconstruct the moves.

The corpus says “fold moves out first,” but has not specified how to recover information no longer present in the final file tree.

Sources: [`SaveStateRepository.cpp`](research/council-runs/2026-09-05-conflict-resolution-foundation/_sources/es/SaveStateRepository.cpp) (S37), [`SaveState.cpp`](research/council-runs/2026-09-05-conflict-resolution-foundation/_sources/es/SaveState.cpp) (S38), and [`issue-24.md`](research/council-runs/2026-09-05-conflict-resolution-foundation/_sources/issues/issue-24.md) (S25).

### The minimum additional model

Keep these concepts separate:

| Concept | Meaning |
|---|---|
| Version | SHA-256 of stored bytes |
| Logical occurrence | The save or resume-point lineage being materialized |
| Placement | Current system/core/game/path/slot |
| Origin | Which capture produced the version, with which actual emulator/core |
| Observation | Which device currently possesses or publishes that placement |
| Agreement | What this device verified with this particular remote namespace |

Record moves and copies where ES performs them, rather than reconstructing all of them at the next game exit. An occurrence identifier or a durable operation record can supply the missing link. This does **not** replace hash identity or invent a second device identity.

Also, `replaces` should mean replacement, not “more progress” and not necessarily “derived from.” Loading an old numbered state and then producing a new auto state demonstrates the difference.

### Narrow automatic compaction

I recommend a refinement of **D-CLOUD-030**, not reversal of its hash decision:

- compact only numbered materializations in the same verified game and core/load namespace;
- never collapse an auto resume point into a numbered slot just because the bytes match;
- verify that the surviving state/thumbnail association is valid;
- perform deletion under the same local mutation protection as resolution;
- update placement records and record the actual outcome.

“Two slots of one game have the same state hash” is not sufficient if their load contexts or provenance associations differ. Byte equality proves that state bytes are redundant; it does not prove that every surrounding association is redundant.

---

## 1.4 The manifest: endorse per-device files, amend the semantics before capture

The reason for **D-CLOUD-031** is sound: one device-owned JSON file avoids a shared metadata file with multiple writers, and its location fits the existing saves allowlist.

The current schema nevertheless has four substantive holes.

### A. The device writing a manifest is not always the save’s producer

Consider:

1. Device A produces V in slot 1.
2. Device B downloads V and places it in slot 3.
3. Device A later replaces slot 1 with W and rewrites its manifest.

Where does V’s origin now live?

- B must not edit A’s manifest.
- B’s top-level `device` describes B.
- A’s current path map may no longer mention V.
- The local audit log is neither synced nor permanent history.

The alignment review says a merged copy becomes a new entry with `replaces = null`, with origin in the audit log. That does not resolve the schema’s top-level-device attribution problem.

**Amendment:** allow B to report that it possesses or materialized a version created by A, retaining the original capture provenance explicitly. “Nothing stamps a file it did not write” should forbid inventing provenance—not forbid recording an honest observation of imported data.

Origin must remain interpretable after the producing device changes its manifest, disappears, or is reflashed.

### B. “Union of maps” must not mean last-map-wins

Two manifests can contain the same path with different hashes. Readers must preserve both claims and match them against actual payload evidence. JSON map merge order cannot choose the cloud version.

Further, old manifest entries are not automatically additional current conflicts. A conflict concerns current verified materializations and their agreement history, not every version ever observed by any device.

### C. A manifest and its payload are not one atomic publication

Writing JSON to a temporary file and renaming it locally prevents one class of torn local read. It does not make these arrive remotely together:

- the state;
- its PNG;
- the metadata describing them;
- related files in an emulator save bundle.

A single rclone pass can expose the manifest before some payloads, or vice versa. An interruption can make that mismatch persistent.

**Amendment:** define publication completeness. At minimum, a generation must identify its required members and expected content hashes. A reader accepts a usable bundle only after those members verify. Missing or mismatched members mean **incomplete publication**, not “unknown provenance, safe to proceed.”

The screenshot needs a verified association with the state version, not just a reusable filename.

### D. Agreement must be scoped to the conversation

`agreed.json` cannot be keyed solely by relative path across arbitrary configuration changes.

Its scope must include enough information to detect a change of:

- remote/account or configured endpoint;
- cloud root;
- local root;
- relevant filter/layout generation;
- writer incarnation where necessary.

Otherwise an agreement with the previous cloud folder can authorize an overwrite in a newly selected folder.

Losing this record must cause conservative reclassification. It is not merely a performance cache that can always be regenerated from current manifests: those manifests do not encode the past conversation.

### Required schema amendment

I would reopen **D-CLOUD-031** for:

- per-version origin distinct from reporting device;
- a publication generation or equivalent completeness record;
- bundle membership, including thumbnail verification;
- explicit placement/move semantics;
- scoped agreement metadata;
- an explicit representation of deletion intent if deletion propagation is in V1.

The paths can stay exactly as decided. A synchronized SQLite database is still unnecessary. The volume described in the corpus supports plain, bounded JSON records.

Sources: S3 §§2, 5–8; S4 §§2–3; [`issue-20.md`](research/council-runs/2026-09-05-conflict-resolution-foundation/_sources/issues/issue-20.md) (S21).

---

## 1.5 Capture: the proposed hook observes the wrong thing in several common cases

The existing exit hook is the correct integration **location**, but the implementation contract needs to distinguish four moments:

1. the actual launch context is finalized;
2. the emulator finishes writing;
3. ES performs its own cleanup, restoration, and renumbering;
4. networking starts.

The embedded exit path performs `onGameEnded()` and repository refresh before starting `cloud_backup`. The cloud call is also conditional on the game-exit setting and no existing `ThreadedCloudSync`.

Source: [`FileData.cpp.launchGame-excerpt-l740-850.cpp`](research/council-runs/2026-09-05-conflict-resolution-foundation/_sources/es/FileData.cpp.launchGame-excerpt-l740-850.cpp) (S41).

### Capture must not depend on networking being enabled or available

If capture is merely inserted into the existing conditional transfer path, provenance is missed when:

- game-exit cloud sync is disabled;
- another transfer is already running;
- the device is offline;
- a network guard returns before capture.

Those are exactly the conditions that produce cross-device conflicts later.

**Recommendation:** local capture always runs for a supported completed session, including an emulator crash that may have written data. It precedes the optional network operation and persists independently of whether that operation is skipped. This remains one ES integration path; it does not revive the removed OS hook.

### Capture the emulator actually launched

The schema proposes passing `getEmulator(true)` and `getCore(true)`. Those functions resolve configured values. But `SaveState::setupSaveState()` can rewrite `-emulator` and `-core` for a selected state without changing those configured values.

**Therefore the capture context must be frozen from the finalized launch, not re-derived afterward from game settings.**

Sources: S38 `setupSaveState()` and [`FileData.cpp.getCore-excerpt-l1470-1560.cpp`](research/council-runs/2026-09-05-conflict-resolution-foundation/_sources/es/FileData.cpp.getCore-excerpt-l1470-1560.cpp) (S42).

### An exit-time observation is not automatically an emulator write

`SaveState::onGameEnded()` can:

- remove an unchanged copied slot;
- remove the current auto-state path;
- restore its `.bak`;
- renumber numbered states.

A metadata pass after that cleanup sees ES’s final materialization, not necessarily the state the emulator just wrote. The capture system must preserve that distinction or it will attribute restored old data to the just-finished session.

### Time-window selection is a hint, not a correctness mechanism

A rename preserves mtime. A state moved today can retain last year’s mtime.

Consequently, #21 can write a fresh manifest describing the new path while `cloud_backup --recent` excludes the actual renamed state. The metadata reaches the cloud, but its described placement does not.

This is a concrete reason to refine **D-CLOUD-028**:

- retain time-based discovery as an optimization for unfamiliar emulator layouts;
- include explicit dirty placements and captured content changes regardless of old mtime;
- never stamp every file inside the ten-minute window as having been produced by the game just exited.

The rule that rejected ROM-name filtering remains correct. The alternative is **observed changes and layout adapters**, not a return to filename guessing.

---

## 1.6 D-CLOUD-028’s latency goals and the schema’s remote-hash promise conflict

The alignment review requires all of the following:

1. write the manifest before the existing recent upload;
2. add no rclone spawn;
3. obtain `remote_hash` after uploading;
4. have the uploaded manifest expose that hash.

Those four requirements cannot be satisfied by the described single `rclone copy` pass. A post-upload observation cannot be included in bytes already uploaded before the observation.

Choose explicitly between:

- `remote_hash` remaining null until a later verified observation;
- an additional batched observation/publication phase;
- a different, proven operation-scoped transport interface.

Do not obtain the hash after upload, write it locally, and imply that the manifest already in the cloud contains it.

There is also a more fundamental limit:

> With local L and old agreement A alone, the exit path cannot distinguish “cloud still holds A” from “another device changed the cloud to C.”

A blind overwrite behaves identically in those two worlds and is unsafe in one.

**My recommendation is to reopen D-CLOUD-028’s prohibition on remote observation for changed data.** Preserve the important budget:

- no local changes: no remote work, and say “nothing new to upload,” not “both sides are in sync”;
- no usable network: immediate skip;
- changed data: batched evidence gathering and verified transfer, with measured cost;
- no per-file rclone process launches.

An immutable-candidate-only exit upload could avoid reading the current canonical path, but that is different semantics: it publishes progress for later reconciliation rather than immediately making a shared canonical tree agree.

Source: [`rclone-cloud-sync.md`](research/council-runs/2026-09-05-conflict-resolution-foundation/_sources/repo/.claude/rules/rclone-cloud-sync.md) (S9), S4 §3.3, and [`cloud_backup`](research/council-runs/2026-09-05-conflict-resolution-foundation/_sources/repo/projects/ROCKNIX/packages/network/rclone/sources/cloud_backup) (S29).

---

## 1.7 Presentation: preserve the walkthrough, remove false assurances

I endorse:

- system → game ordering;
- cloud consistently on the left;
- genuine-conflict counts;
- screenshots only when they actually describe that state;
- a save glyph for in-game saves;
- no file size or playtime as progress proxies;
- explicit compatibility information;
- a persistent result page.

Source: [`conflict-wizard-ia.md`](research/council-runs/2026-09-05-conflict-resolution-foundation/_sources/repo/docs/conflict-wizard-ia.md) (S2).

I would amend five semantics.

### 1. State the cancellation boundary accurately

The IA promises both:

- non-conflicting files are applied before the walkthrough;
- quitting leaves both sides exactly as they were.

Those cannot both describe the entire sync.

Recommended meaning:

> The pre-pass may synchronize uncontested data. No **conflict resolution** is applied before COMPLETE. Quitting discards the conflict choices.

If the literal stronger promise is desired, the pre-pass must stage rather than materialize its changes, and the allocator must use a virtual inventory. That is a larger design change. I prefer the scoped, honest guarantee.

Thumbnail downloads to private staging are also transfers; they should not be confused with applying a choice to active save data.

### 2. A one-sided destructive answer must not be preselected

The initial focus may be on a control, but KEEP LEFT or KEEP RIGHT should not already constitute a resolution. Otherwise a sequence of CONTINUE presses silently chooses one side by layout.

Every conflict needs an affirmative decision. No recency-derived default, and no implicit “cloud wins because it is first.”

### 3. Unknown metadata cannot support a forced, irreversible guess

Two SRAM panels can both show:

- no screenshot;
- unknown device;
- unknown emulator;
- unreliable time.

The wizard then has no meaningful evidence with which to distinguish progress. It must not pressure the player into destroying one version merely to complete the pass.

I recommend reopening the IA’s **off-by-default discarded-save retention**. Default bounded retention on, make the control available inside the walkthrough, and provide at least a native way to undo the last resolution. Full history browsing can remain #25.

This is a reopening request against the IA’s settled rev-3 choice, not against D-CLOUD-027. The audit log can remain support-only.

### 4. KEEP BOTH for auto states needs a named active resume point

There is only one canonical `.state.auto`.

My suggested semantics:

- preserve this device’s current auto state as the active resume point;
- put the cloud auto state in the next numbered slot;
- show that consequence before COMPLETE.

Both versions survive; this is not a recency decision. But the fact that one remains the automatic resume point must be visible. “Keep both” alone does not explain it.

### 5. Shared saves need a shared-save screen, not a fictional game

A VMU or memory card may contain progress for several games. Label it as that shared storage unit. Do not assign the whole card to the last game launched merely to fit system → game ordering.

On 480×320, preserve the two-column overview but allow a focused screenshot to expand for inspection without changing side identity or the pending choice. A screenshot that technically fits but cannot be recognized is not a useful comparison.

Sources: [`issue-23.md`](research/council-runs/2026-09-05-conflict-resolution-foundation/_sources/issues/issue-23.md) (S24), [`es-native-ui.md`](research/council-runs/2026-09-05-conflict-resolution-foundation/_sources/repo/.claude/rules/es-native-ui.md) (S12), and [`es-menu-map.md`](research/council-runs/2026-09-05-conflict-resolution-foundation/_sources/repo/docs/es-menu-map.md) (S13).

---

## 1.8 KEEP BOTH: the existing ES primitives are not yet safe enough

The corpus’s strongest “already solved” claims concern these helpers. Reading their implementations produces a different conclusion.

### Evidence: auto-only repositories return `-99`

`getNextFreeSlot()`:

- returns the first slot when `states.size() == 0`;
- otherwise searches for an occupied slot from 99999 down to zero;
- returns `-99` if none is found.

A repository containing only an auto state is **not empty**, but its slot is negative. No numbered slot is found. The function returns `-99`, not slot 0.

That is directly relevant to a design that expects auto states to be the commonest conflict.

### Evidence: allocation uses cached repository contents

`getNextFreeSlot()` does not refresh the repository. Multiple KEEP BOTH decisions made before materialization can all obtain the same next slot unless the caller maintains reservations.

The pre-pass does not solve this.

### Evidence: `copyToSlot()` reports success without checking the copies

After checking that the source exists and the slot is nonnegative, the function calls `copyFile()` or `renameFile()` for the state and screenshot and then returns `true`. It does not test those results.

Disk-full, read-only destination, or a failed PNG copy can therefore produce “success.”

### Evidence: the destination comes from the source’s parent

`makeStateFilename()` constructs its full path using the parent of `fileName`. A cloud state represented by a `SaveState` object in private staging will be copied to another name **inside staging**, not necessarily into the live game’s namespace.

### Also: support is not universal

`SaveStateRepository::isEnabled()` rejects non-RetroArch emulators. The current helper is not evidence that every standalone savestate has a valid KEEP BOTH implementation.

Sources: S37 `getNextFreeSlot()` / `isEnabled()`; S38 `makeStateFilename()` / `copyToSlot()`.

### Required merge contract

Reuse ES’s naming conventions and allocator through a checked adapter:

1. refresh the relevant repository;
2. include verified cloud occupancy for that namespace;
3. maintain reservations for the whole pending batch;
4. reject sentinel or invalid slots;
5. verify that the destination is inside the intended active namespace and unoccupied;
6. copy state and PNG without overwriting unapproved content;
7. re-read and verify their bytes;
8. update placement and agreement records;
9. only then remove an authorized redundant source.

Do not call `copyToSlot(..., true)` as the safety mechanism. Copy–verify–delete under **D-CLOUD-026** is the relevant rule.

The pre-pass gate is necessary under the current IA, but not sufficient. It proves, at best, occupancy at one observed time. It says nothing about stale ES caches, reservations for other choices, or a second device publishing while the player is deciding.

---

## 1.9 Safety and rollback: recovery is V1; a history product may be V2

I distinguish three things the corpus sometimes groups together:

1. **Crash recovery:** finishing or safely abandoning an interrupted application.
2. **Undo:** recovering from the player’s wrong choice.
3. **History browsing:** exploring older snapshots.

Only the third can comfortably remain wholly in V2.

An append-only audit log does not preserve state bytes. A rotating log also cannot be the only record of lineage “beyond one step.” **D-CLOUD-027 should remain the audit decision, not become a transaction-store decision.**

Sources: S6 D-CLOUD-027, [`issue-25.md`](research/council-runs/2026-09-05-conflict-resolution-foundation/_sources/issues/issue-25.md) (S26), and [`engineering-practices.md`](research/council-runs/2026-09-05-conflict-resolution-foundation/_sources/repo/.claude/rules/engineering-practices.md) (S10).

### Minimum V1 application protocol

Before any destructive materialization:

- retain and verify both original versions and their associated assets;
- persist the exact approved input hashes and intended output placements;
- ensure enough space exists for the recovery unit;
- revalidate that the inputs still match the approved plan.

Once COMPLETE has been accepted:

- persist application intent durably;
- apply through idempotent steps;
- verify each output;
- advance agreement only for verified results;
- record completion separately from intent.

An interruption **before** application can discard decisions. An interruption **during** application must retain the journal and recovery material. Treating both as “discard choices and start again” risks applying a second plan to a half-applied first one.

Audit lines written before deletion should say **intent**, not falsely assert that the deletion happened. Completion records follow verified effects.

### Cross-device concurrency requires preservation, not a pretend lock

A device-local flock cannot serialize two handhelds. Nor is “one player, never concurrent” equivalent to “one synchronizer, never concurrent”: device A can be boot-syncing while the player uses device B.

With arbitrary rclone backends, a check followed by a write is not a general compare-and-swap operation. A remote lock file created by “check absence, then copy” has the same race.

For a defensible V1, I recommend:

- immutable, device-attributable recovery/publication artifacts for every version about to participate in a replacement;
- retention of new candidate bytes as well as overwritten preimages;
- publication records that identify the base versions the writer observed;
- preservation of unresolved publications outside ordinary bounded “discarded saves” eviction.

Canonical ES names may remain materialized views for compatibility. They must not be the only surviving copy of a contested version.

This does **not** promise globally atomic synchronization across 69 backends. It promises that concurrent conforming writers cannot destroy the only copy of each other’s progress, and that their competing publications remain discoverable. That narrower promise must be tested explicitly.

If the team wants a truly single authoritative cloud head with transactional updates, it needs stronger backend semantics than this corpus establishes. Do not simulate those semantics with ordinary file existence checks.

---

## 1.10 Migration: one guarded entrance, several user-facing workflows

Respect **D-CLOUD-029**: no interim `--update` patch. But #22 must replace the complete save-writing surface, not only three named calls.

Inventory:

- startup sync;
- game-exit upload;
- menu SYNC;
- direct UPLOAD;
- direct DOWNLOAD;
- save-data phases of the multi-tier hub;
- Tools/script invocations;
- #37’s future savestate-manager sync;
- any later shutdown operation.

All must enter the same classifier and application layer. A direct “upload” may choose direction; it must not mean “bypass conflict protection.”

Sources: S29; [`cloud_restore`](research/council-runs/2026-09-05-conflict-resolution-foundation/_sources/repo/projects/ROCKNIX/packages/network/rclone/sources/cloud_restore) (S30); [`102-cloud-saves`](research/council-runs/2026-09-05-conflict-resolution-foundation/_sources/repo/projects/ROCKNIX/packages/network/rclone/autostart/102-cloud-saves) (S35); S13; and [`issue-37.md`](research/council-runs/2026-09-05-conflict-resolution-foundation/_sources/issues/issue-37.md) (S28).

### Preserve behaviors, not unsafe mechanisms

| Existing behavior | New home |
|---|---|
| Restore before upload | Reconcile remote evidence before authorizing an upload; not a blind restore pass |
| Per-device cloud lock | One coordinator for the whole operation, not separate locks with a gap between phases |
| Recent exit work | Dirty-content/placement selection, with time as a hint |
| Fast offline answer | Local preflight, without suppressing capture |
| Last-run stamps | Verified operation outcomes; pending conflicts are a distinct result |
| Save/content/system boundaries | Non-negotiable policy around selected paths |
| Existing menu shortcuts | Remain where their cadence requires them |
| Existing old layouts | Readable without guessing provenance |
| Unknown or unsupported metadata | Conservative handling, never success-by-omission |

The embedded boot script runs backup even if restore fails; its two commands are not joined with `&&`. It also releases the script lock between directions. The unified operation should not inherit either behavior.

### Bootstrap must be a product path

“First bisync run is an explicit maintainer-driven step” is acceptable for a spike, not a finished console-first migration.

For a fresh device or lost agreement state:

- equal verified contents establish agreement;
- one-sided content is preserved and safely transferred;
- differing pre-existing contents go to the ordinary conflict workflow;
- no historical agreement is invented;
- initialization never chooses `path1`, recency, or another blanket winner.

Retain the ban on unattended unsafe `--resync`. If bisync cannot initialize conservatively behind the product’s ordinary flow, that is evidence against making it a hard dependency.

### Mixed-version writers must be tested

New guards do not constrain an old handheld still running copy-based newest-wins sync. No manifest field makes that old binary cooperate.

The release needs a deliberate protocol transition:

- read legacy data conservatively;
- isolate recovery/publication artifacts from old writers;
- test an old writer against a new one;
- either keep new authoritative state out of the legacy writer’s destructive reach or explicitly limit the guarantee to upgraded writers.

Because D-CLOUD-029 says the maintainer is the only current user, coordinated activation on the bench is practical. That opportunity should be used rather than silently assuming mixed-version safety.

Source: [`upgrade-and-install.md`](research/council-runs/2026-09-05-conflict-resolution-foundation/_sources/repo/.claude/rules/upgrade-and-install.md) (S11).

---

# 2. Resolution plans for the eleven known unknowns

| # | Assessment | What to measure, where, and before what |
|---|---|---|
| **1. Chipset compatibility and silent failure** | **Still unknown; partly mis-framed.** Passing two cores does not establish universal compatibility. Same build pin is evidence, not a serialization ABI guarantee. | Start with **RG35XX SP ↔ RG-SP**, using identical frontend/core/options and a visually verifiable content-less state. Then the six directed H700/RK3326/RK3566 pairs, a second core, and a different-core-build test. Run corruption tests in isolated save storage, then continue execution, save, and reload—not only inspect the first frame. **Before #23 badge severity is designed.** D-CLOUD-025 remains binding. |
| **2. bisync semantics and competing agreement state** | **The main architectural gate.** The corpus does not establish the required non-mutating detector contract. | On **GENERIC_X64**, use loopback WebDAV and MinIO; on **H700**, repeat against an isolated real-remote prefix. Exercise genuine `#RZIPv` states, same-size SRAM edits, renames, changing exclusions, first run, lost workdir, and interruption at several phases. Compare payload and workdir inventories before/after every operation. **Before choosing #9/#22’s implementation boundary.** |
| **3. Auto states as the commonest conflict** | **“Every session diverges” is false as a general statement.** Properly sequenced A-upload/B-download/B-play/B-upload is one-sided advancement. Also, ES may restore the old auto state after a numbered-state launch. | On the **two H700s**, trace auto, numbered, PNG, and `.bak` hashes for new-game, auto-resume, numbered-resume, normal exit, and crash. Compare sequential synchronized sessions with genuinely offline forks. Measure conflicts by kind per session. **Before auto-state capture semantics and #23’s resume-point interaction are fixed.** |
| **4. KEEP BOTH pre-pass gate** | **Necessary but insufficient.** Cached ES inventory, batch reservations, and changes during the walkthrough remain. | Plant cloud-only high slots, an auto-only repository, and multiple KEEP BOTH candidates. Interrupt a download; change cloud occupancy from the second device while review is open. Verify no collision or false success. **VM first, then H700 pair; before #24 application code and #23’s gate contract.** |
| **5. No shipped `es_savestates.cfg`** | **Its absence is already reported by the alignment review.** The unresolved question is behavior, not where to find a nonexistent shipped file. | On **H700**, compare default mode with a scratch per-core configuration: actual launch arguments, state directories, auto-resume, incremental slots, and legacy discovery. `SaveStateConfigFile` sets `racommands=false` in config-driven mode, whereas the compiled default uses `true`; it also has different defaults for autosave/incremental fields. **Before #10.** Need the unembedded launch/settings sources to finish the analysis. |
| **6. Core pin and exit context** | **Pin absence is already reported; context correctness is not solved by calling getters.** | Emit pins from effective package resolution, accounting for overrides and patches; verify the installed file against built cores. On **H700**, launch a state whose configured core differs from the game default and verify capture follows the actual launch. Record unknown honestly. **Before #21 ships; pin emission can be prepared alongside the schema amendment.** |
| **7. `BACKUPPATH == RESTOREPATH`** | **Not merely a hypothetical customization.** The shipped config explicitly describes setting them differently to avoid replacement. A warning is insufficient for a two-way engine. | In a **VM**, set distinct roots, then alias paths referring to the same root. Ensure ordinary sync either has a defined safe model or refuses before writing. Preserve the existing settings rather than silently rewriting them. **Before #22’s configuration and agreement-key design.** |
| **8. Standalone and multi-file saves** | **A correctness question, not only presentation.** Per-file one-sided changes can combine two inconsistent halves without any file being classified divergent. | On devices supporting the emulator, trace writes for **PPSSPP game-ID directories, Dreamcast VMU, PSX cards, and N64 layouts**. Create disjoint edits to different members of one save set on two replicas. Establish bundle boundaries and shared-card labels. **Before #21 attribution and #22 classification, not after the wizard is built.** |
| **9. 480×320 readability** | **Requires physical recognition testing.** A frame proves layout, not recognizability or safe choice. | Use **RG351M**, with nearby-looking gameplay moments, long names, unknown metadata, and a newer-but-less-progress case. Have the maintainer identify the intended version before pressing. Compare fixed overview with focus-to-enlarge. Use 640×480 as the second layout. **Before #23 visual design is frozen.** |
| **10. Two devices online together** | **The model does not exclude it.** One player can have two startup jobs running. | On **the H700 pair**, synchronize simultaneous edits; delay one writer between observation and commit; interrupt either device; repeat without overlapping game sessions. Require every unique version to remain recoverable and the race to remain discoverable. **Before approving #22’s commit/publication protocol.** |
| **11. Unrun round-trip suite** | **The existing image removes the cold-build prerequisite, not the verification gap.** The embedded harness also lacks the claimed new manifest and two-device conflict tests. | First inspect and run the harness on **disposable GENERIC_X64 VMs**, WebDAV and MinIO. Repair or explicitly classify stale assertions, add the manifest, same-size-save, and two-device cases, and verify both clean-install and populated-upgrade paths. **Before #22 implementation depends on a green baseline.** Do not run it unchanged against the maintainer’s configured handheld. |

Relevant sources: [`savestate-compat-test.md`](research/council-runs/2026-09-05-conflict-resolution-foundation/_sources/repo/docs/savestate-compat-test.md) (S8), [`issue-19.md`](research/council-runs/2026-09-05-conflict-resolution-foundation/_sources/issues/issue-19.md) (S20), [`issue-10.md`](research/council-runs/2026-09-05-conflict-resolution-foundation/_sources/issues/issue-10.md) (S19), [`SaveStateConfigFile.cpp`](research/council-runs/2026-09-05-conflict-resolution-foundation/_sources/es/SaveStateConfigFile.cpp) (S39), [`cloud_sync.conf`](research/council-runs/2026-09-05-conflict-resolution-foundation/_sources/repo/projects/ROCKNIX/packages/network/rclone/sources/cloud_sync.conf) (S33), and [`issue-35.md`](research/council-runs/2026-09-05-conflict-resolution-foundation/_sources/issues/issue-35.md) (S27).

**One protocol correction:** the older compatibility document says a portable cross-chipset result could make #10 unnecessary. That interpretation is superseded by **D-CLOUD-017**. Per-core namespacing remains useful even if same-core states are portable across every tested chipset.

---

# 3. Missing failure modes and the cheapest experiments

The blindspot register is valuable, but it should not become a checklist that limits discovery. The following are concrete failure mechanisms, not additional generic admonitions.

## 3.1 The test harness can damage the configuration it claims to protect

The embedded `tools/cloud-round-trip`:

- writes a new `rclone.conf` **before** checking which remote is first;
- does not restore that original configuration;
- restores some path settings but not all changed remote/content settings;
- has no encompassing cleanup-on-exception mechanism;
- uses a fake `.state` payload, not a loadable compressed state;
- contains no manifest-capture or two-device divergence test;
- checks some claims from output or source text rather than their effect.

Therefore its first-remote assertion does not protect a pre-existing real configuration in the way its docstring suggests. It has already overwritten it.

Its archive tests also expect the original fixture name in places where the embedded uploader adds a date to undated names. The tar-integrity step expects an actual system backup that the harness does not itself create.

Source: [`tools/cloud-round-trip`](research/council-runs/2026-09-05-conflict-resolution-foundation/_sources/repo/tools/cloud-round-trip) (S36).

**Cheapest experiment:** clone a disposable VM, plant recognizable configuration and selection values, interrupt the suite at several steps, and compare all touched configuration afterward. This is Gate 0 for trusting the suite on hardware.

## 3.2 Additional failure catalogue

| Failure | Why it is plausible or evidenced | Cheapest exposing experiment |
|---|---|---|
| **A “successful” application copies nothing** | `copyToSlot()` ignores copy/rename results. | Use an isolated read-only or full destination; invoke the existing operation and compare its return/report with destination hashes. |
| **Auto-only KEEP BOTH cannot allocate** | Direct consequence of `getNextFreeSlot()`’s negative-slot handling. | Populate only `.state.auto`, refresh, and exercise next-slot allocation. Expect the current implementation’s `-99`. |
| **Two decisions reserve the same slot** | Allocation reads a cached repository; no batch reservations exist in the helper. | Request two allocations before any file is materialized. |
| **The “merged” state remains in staging** | Destination generation uses the source parent. | Represent a cloud state from a scratch directory, perform a copy-to-slot, and inspect both scratch and live namespaces. |
| **A core-directory change also changes resume behavior** | Compiled defaults use `racommands=true`; config-derived emulator entries set it false. | Compare launch arguments and auto-state lifecycle before/after adding only the proposed configuration. |
| **A capture names the configured core, not the launched core** | `setupSaveState()` can rewrite launch arguments; configuration getters do not describe that rewrite. | Launch a state associated with another core and compare the executable/core arguments with captured metadata. |
| **A new manifest advertises an old-mtime renamed file that never uploads** | Rename preserves mtime; `--recent` filters by age. | Give states old mtimes, renumber them, update metadata, run the recent path, and compare described paths with actual remote objects. |
| **A correct state is shown with the wrong screenshot** | State and PNG are separate writes and transfers; reusable PNG paths are not version binding. | Publish a new state while retaining or delaying the old PNG. The UI must refuse to present it as a verified screenshot of that version. |
| **A state load destroys an unrelated good in-game save** | Loading a state can restore emulated SRAM, later flushed into the live save. The compatibility test currently focuses on state loading. | In isolated storage, preserve a distinct SRAM file, load an older or deliberately malformed state, wait through autosave, exit, and compare SRAM. |
| **Two devices write one “device-owned” manifest** | `cloud_device_id` deliberately honors its stored value; cloning `/storage` duplicates that value. | Clone storage to a second VM/device and run identity generation. Then test whether restore or clone detection prevents concurrent publication under one ID. |
| **The last good version disappears through retention** | A count bound that treats unresolved candidates like ordinary discarded history can evict the only useful version. | Fill retention with pending conflicts, add another resolution, and verify no unresolved or transaction-required artifact is selected for eviction. |
| **Hashless saves repeat #53, not just archives** | SRAM changes commonly preserve size; the saves path does not have the archive’s content-forced comparison mechanism. | On WebDAV, replace one `.srm` with different same-length bytes without resetting the remote. Check remote bytes, not exit status. |
| **A temporary manifest or recovery file becomes ordinary sync payload** | `+ /savestates/**` admits broad classes of files. | Leave an interrupted temporary publication and recovery artifacts under the tree, then enumerate the effective transfer selection. |
| **Mandatory exclusions lose to preserved user rules** | `cloud_sync_helper` puts user rules before defaults. Adding a default snapshot exclusion is not an unconditional boundary. | Add a broad user include, run the helper, and list whether snapshots/databases/private metadata now transfer. |
| **An apparently harmless save name targets another path** | Paths and screenshot references are remote-controlled metadata and ultimately become filesystem/command operands. | Supply traversal paths, absolute paths, symlinks escaping the root, quotes, newlines, and oversized JSON/PNG inputs. Require rejection before any write or render. |
| **Two game identities collapse** | The default savestate template uses ROM stems; the manifest’s ROM field is a filename, not a complete content identity. | Use identical stems in different subdirectories or with different content extensions/versions and observe pairing, capture, and compaction. |
| **A backend collapses two distinct names** | Case folding and Unicode normalization can invalidate a local path map without changing its JSON validity. | Upload two fixtures differing only by case or normalization to a representative path-based remote; compare actual object count and bytes. |
| **A crash creates a durable agreement for a non-durable payload** | Temp-and-rename is atomic visibility, not proof of power-loss durability across payload, journal, and parent directory. | On a disposable card, cut power at controlled application boundaries; verify retained versions and agreement after reboot. |

Sources for the identity and filter findings: [`cloud_device_id`](research/council-runs/2026-09-05-conflict-resolution-foundation/_sources/repo/projects/ROCKNIX/packages/network/rclone/sources/cloud_device_id) (S34), [`cloud_sync_helper`](research/council-runs/2026-09-05-conflict-resolution-foundation/_sources/repo/projects/ROCKNIX/packages/network/rclone/sources/cloud_sync_helper) (S31), and [`cloud_sync-rules.txt`](research/council-runs/2026-09-05-conflict-resolution-foundation/_sources/repo/projects/ROCKNIX/packages/network/rclone/sources/cloud_sync-rules.txt) (S32).

### Two implementation-level observations deserve immediate regression tests

**Result-code collisions.** The scripts reserve exit 3 for lock contention and exit 4 for no network, but also pass through rclone operation codes. `ThreadedCloudSync` interprets every 3 or 4 as those friendly skips. An actual rclone failure can therefore be mislabeled as “another sync” or “no network.”

**Aggregate failure reporting.** Both embedded backup and restore scripts exit using the save-phase status, not an aggregate including the system phase. A system-only failure can be presented as overall success.

These are code findings, not hardware results. They reinforce the need for a structured result envelope separating operation status, failure stage, raw transport code, conflict count, and verified effects.

Sources: S29, S30, and [`ThreadedCloudSync.cpp`](research/council-runs/2026-09-05-conflict-resolution-foundation/_sources/es/ThreadedCloudSync.cpp) (S40).

## 3.3 The “conflict artifacts never move” claim lacks complete supplied evidence

The alignment review attributes a universal no-move policy to **D-CLOUD-022**. The register row actually describes a deliberate repair operation: fill gaps with `--ignore-existing`, verify, then purge. That is different from automatic-sync exclusion.

Also, the supplied saves allowlist contains no conflicted-copy exclusions, and the supplied save-script option builders do not add them. Under those supplied rules, a conflicted `.srm` or a file anywhere under `savestates/` is admitted.

The effective device `.defaults` file was not embedded, so I cannot conclude that the running image lacks a further exclusion. I can conclude that the supplied templates do not prove the advertised all-tier property.

**Cheapest experiment:** place recognizable Dropbox- and Syncthing-style artifacts in both local and remote saves trees, alongside ordinary positive controls. Run backup and restore separately and inspect both sides. The existing harness’s content-upload test is not that experiment.

Codify the distinction:

- ordinary sync leaves foreign conflict artifacts alone;
- an explicit repair operation may act under D-CLOUD-022’s copy–verify–delete policy.

## 3.4 Compatibility badges must describe evidence, not certainty

A core build pin identifies source selection, not necessarily every serialization-relevant property. The package system permits device overrides; patches, build options, frontend container behavior, BIOS, ROM revision, and core settings can matter.

Source: [`CLAUDE.md`](research/council-runs/2026-09-05-conflict-resolution-foundation/_sources/repo/CLAUDE.md) (S15).

Therefore:

- “same recorded build” is honest;
- “tested on this combination” is stronger and needs a result;
- “compatible” as a universal green assurance is not earned by matching pins.

Record enough build context to interpret later failures, but do not turn every differing binary hash into a hard incompatibility rule. Cross-device binaries can differ while their state formats remain compatible.

Finally, a corrupted file can have a perfectly valid SHA-256. Hash identity is not state-format validation and certainly not evidence of greater progress.

---

# 4. What must be proven before building on this foundation, in order

There are two kinds of gates: experiments on the existing substrate **before feature implementation**, and fault-injection tests that necessarily run against the first application prototype. They should not be conflated.

## Gate 0 — Establish a safe, identifiable bench

**Substrates:** disposable GENERIC_X64 VM; spare or recoverable storage for physical devices.

- Preserve the maintainer’s actual saves and configurations outside the experiment.
- Verify the running rclone version and the actual scripts/binary under test.
- Repair or contain the harness configuration-overwrite hazard.
- Keep QA WebDAV on loopback, as **D-QA-002** requires.
- Use a disposable real-remote prefix for H700 transport tests.

**Stop condition:** any uncertainty about what device, remote, or storage tree a destructive test targets.

The existing GENERIC_X64 image means “start a cold build now” from the older futro is stale scheduling advice. Verify the image instead.

## Gate 1 — Run the existing pipeline and establish red controls

**Substrates:** GENERIC_X64 with WebDAV and MinIO.

- Run existing round-trip behavior against populated destinations.
- Observe same-size overwrite cases.
- Record current recency clobbering as an expected failing safety test, consistent with D-CLOUD-029.
- Verify lock and network skips by their effects.
- Add genuine compressed-state and PNG fixtures.

**Invalidates:** claims of a green baseline based only on written tests or prior comments.

This is the immediate application of **D-QA-001** and the project’s “verify the artifact” rule, not a request to certify an unbuilt feature.

## Gate 2 — Prove the H700 control and actual state lifecycle

**Hardware:** RG35XX SP and RG-SP, same build and core.

- Confirm distinct device identities and model labels.
- Transfer and load a recognizable state both directions.
- Exercise new game, auto resume, and numbered-state resume.
- Observe auto-state backup/restore behavior and actual launched core.
- Exercise the auto-only next-slot case.

**Invalidates:** the “every exit writes the current resume point” assumption and any belief that the existing allocator is immediately reusable unchanged.

A failed same-chipset control must be investigated before interpreting a cross-chipset failure.

## Gate 3 — Settle bisync’s role

**Substrates:** the VM backend pair, then H700 with a real remote.

Run the exact candidate 1.75.0 commands against:

- a true fork;
- a rename;
- a same-size edit;
- an interrupted transfer;
- missing agreement/listing state;
- changed filters;
- externally applied resolutions.

Capture complete before/after inventories, bytes, output, and workdir contents.

**Invalidates:** #9/#22’s current detector-only assumption if any ordinary invocation mutates unresolved paths or cannot preserve a reliable baseline across the proposed workflow.

This result should precede backend feature implementation.

## Gate 4 — Prove the concurrency preservation mechanism

**Hardware:** H700 pair.

Arrange two writers to observe the same base and then commit in the opposite order. Repeat with a power loss and with sequential gameplay but overlapping startup syncs.

**Pass condition:** each distinct candidate remains recoverable, neither device mistakes a race for an uncontested update, and a subsequent reconciliation can explain the remaining alternatives.

**Invalidates:** a design whose only protection is per-device flock plus pre-commit rechecking.

The fixture can expose the problem before implementation; the chosen preservation protocol must pass it on its first prototype before broader feature work relies on it.

## Gate 5 — Prove layout and save-unit boundaries

**Hardware:** H700 for RetroArch; appropriate owned device for each standalone emulator.

- Verify both ES and emulator use the proposed per-core path.
- Keep flat legacy states discoverable as unknown.
- Verify config-driven launch semantics, not only directory names.
- Identify and test PPSSPP bundles and shared cards.
- Check actual installed core-pin mappings.

**Invalidates:** “#10 is just a configuration change” and a universal “one file equals one user decision” model.

Complete this before capture and classification contracts are frozen.

## Gate 6 — Complete compatibility evidence

**Hardware:** H700 pair, RG351M, RG353M; SM8550 only for explicitly added test rows.

Run the rest of #19:

- directed cross-chipset transfers;
- at least two cores;
- different core builds;
- compressed and uncompressed corruption cases where applicable;
- continued play, save, and reload after a load;
- SRAM side-effect checks.

**Invalidates:** particular badge assurances, not D-CLOUD-017’s core namespace by itself.

No result should be generalized to an untested core family or ABI.

## Gate 7 — Prove human recognition and the real latency budget

**Hardware:** RG351M for the smallest panel; H700 for exit cost.

Measure:

- correct-choice rate, hesitation, and mistaken presses with real screenshots;
- unknown/unknown SRAM choices;
- KEEP BOTH’s auto-resume explanation;
- no-change and one-change P50/P95 durations;
- rclone process starts and actual remote requests;
- hashing and staging cost for large states, not only tens-of-KB examples.

**Invalidates:** a side-by-side-only design if pictures are not recognizable; an unconditional manifest rewrite if it destroys the no-op budget; a one-spawn contract that cannot carry the required verification.

## Gate 8 — Before release, prove recovery at every application boundary

This necessarily follows the first backend/UI implementation.

Kill or interrupt after:

- capture;
- staging either side;
- preserving preimages;
- persisting intent;
- materializing the state but not PNG;
- remote transfer but before agreement;
- agreement write but before completion reporting.

Then reboot and rerun.

Also exercise every caller and an old/new writer pair. Verify both a populated upgrade and clean installation.

**Pass condition:** all unique pre-resolution progress remains available, unfinished work is identified honestly, no false success stamp is written, and retry is idempotent.

This is the release gate for **D-CLOUD-024**: the wizard and its safety machinery ship together.

---

# 5. Decisions to reopen, decisions to retain, and evidence gaps

## Reopening requests

| Decision or settled contract | Requested refinement | Reason |
|---|---|---|
| **D-CLOUD-031** | Retain per-device JSON and paths; amend origin, publication/bundle, placement, and agreement semantics. | The current shape cannot reliably preserve imported provenance or identify complete publications and scoped agreement. |
| **D-CLOUD-030**, compaction portion only | Limit deletion to verified redundant numbered materializations in the same logical/load context. | State-byte equality alone does not prove that every placement and asset association is redundant. |
| **D-CLOUD-028** | Preserve fast no-op/offline behavior; allow necessary batched remote evidence for changed data and explicit dirty placements outside the time window. | Blind canonical writes cannot detect remote divergence; old-mtime renames are missed; post-upload hashes cannot appear in a pre-upload manifest without another phase. |
| **#9/#22 detector contract** | Make bisync adoption conditional on the non-mutating planning and recovery contract. | `none` does not establish that contract, and the upstream implementation evidence is absent. |
| **IA rev 3/4 retention and interruption semantics** | Bounded retention on by default; minimal native undo; discard decisions only before application, not mid-commit. | Unknown SRAM choices and interrupted application otherwise have no console-first recovery path. |
| **#25’s V2 boundary** | Bring durable preimages and application recovery into V1; leave a full history browser for V2. | V1 KEEP/discard operations already require this machinery. |

These should become new register refinements where applicable. Do not rewrite decided rows or leave supersession only in comments—the failure catalogued in blindspot 27 applies to this council’s recommendations too.

## Retain

- **D-CLOUD-017:** core directories, build information as data, honest unknowns.
- **D-CLOUD-024:** no public feature drop without the wizard.
- **D-CLOUD-025:** hardware evidence before badge severity.
- **D-CLOUD-026:** copy, content-verify, then authorized deletion.
- **D-CLOUD-027:** persistent, rotated, support-oriented text audit.
- **D-CLOUD-029:** no cosmetic stopgap before the complete guarded cutover.
- **D-QA-001/002:** hardware release verification and loopback WebDAV.

Sources: S6 and [`blindspot-register.md`](research/council-runs/2026-09-05-conflict-resolution-foundation/_sources/repo/docs/blindspot-register.md) (S7).

## Gaps surfaced to the orchestrator

The embedded corpus supports this critique, but not every requested external conclusion.

1. **No authoritative rclone 1.75.0 bisync implementation or current upstream roadmap is embedded.** Obtain pinned documentation/source and release notes before claiming what bisync does now or will support next. The planning note is not that evidence.
2. **The issue exports are principally comment threads, not the promised current issue bodies.** For example, issue 9 contains two comments and issue 25 one. I cannot independently verify the current acceptance-criteria bodies against the register.
3. **`cloud-test-backend` implementation and the effective `.defaults` files are absent.** Backend isolation and final merged filter behavior therefore require artifact verification.
4. **The full launch/settings path, `Paths.cpp`, `GuiSaveState.cpp`, `GuiMenu.cpp`, and filesystem helper implementations are absent.** Some relevant behavior is reported in the futro/review, but cannot all be derived from the embedded code.
5. **No hardware test results for #19, the new conflict protocol, or the full round-trip run are embedded.** The bench roster and earlier measurements are reported evidence, not completed gates.

The commission’s two H700 handhelds are enough to expose the most important protocol and lifecycle failures. The other devices refine compatibility and presentation. **Do not spend the scarce first hardware session on a broad matrix before proving that a same-chipset state survives the actual ES and sync lifecycle.**

The futro and changelog remain useful inputs, but not independent proof of the claims they repeat: [`vita-style-conflict-resolution.md`](research/council-runs/2026-09-05-conflict-resolution-foundation/_sources/repo/plans/conflict-resolution/vita-style-conflict-resolution.md) (S5), [`issue-11.md`](research/council-runs/2026-09-05-conflict-resolution-foundation/_sources/issues/issue-11.md) (S17), and [`cloud-sync-changelog.md`](research/council-runs/2026-09-05-conflict-resolution-foundation/_sources/repo/docs/cloud-sync-changelog.md) (S14).

---

# Appendix — `corpus.provenance.json`

Inline artifact only; no filesystem write was performed. The two arrays are parallel and follow supplied source order, S1 through S42. Hashes are the Facilitator’s **“sha256 (verified at embed time)”** values, not hashes recomputed by this council member.

```json
{
  "corpus_mode": "embedded_read_at_time",
  "source_count": 42,
  "source_order": "SOURCE 1 through SOURCE 42 in the supplied prompt",
  "hash_verification": {
    "performed_by": "Council Facilitator",
    "basis": "sha256 (verified at embed time) in each supplied source header",
    "independently_rehashed_by_council_member": false
  },
  "facilitator_manifest_read_timestamp_utc": "2026-09-05T17:32:51Z",
  "filesystem_access": false,
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
  "missing_sources": [
    {
      "description": "Authoritative rclone 1.75.0 bisync implementation, pinned documentation, and current upstream roadmap or release evidence",
      "status": "not embedded; exact behavior requires the proposed spike and additional upstream evidence"
    },
    {
      "description": "Current issue bodies and acceptance criteria distinct from the embedded comment exports",
      "status": "not available as separately verifiable bodies in the supplied issue files"
    },
    {
      "description": "cloud-test-backend implementation and effective installed cloud configuration and filter defaults",
      "status": "not embedded"
    },
    {
      "description": "Full emulator launch/settings code, Paths.cpp, GuiSaveState.cpp, GuiMenu.cpp, and filesystem helper implementations",
      "status": "not embedded; some behavior is reported second-hand in the supplied reviews"
    },
    {
      "description": "Completed compatibility bench results and end-to-end conflict or round-trip execution records",
      "status": "not embedded"
    }
  ]
}
```