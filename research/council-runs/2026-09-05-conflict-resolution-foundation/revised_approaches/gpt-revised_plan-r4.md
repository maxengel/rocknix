# gpt-revised_plan-r4.md

## Recommendation

**Build an application-owned, content-based reconciliation coordinator, with rclone as its transport.** Keep ES’s controller-first compare-and-choose flow, content-hash identity, per-device manifests, and per-core state directories. Add the missing consistency contracts before implementing capture or replacing the shipped writers.

Version one must:

- Detect divergence before any save writer overwrites either side.
- Retain discarded conflict copies **by default**, with a count bound.
- Store those copies with enough independent metadata for the future history-restore picker.
- Ship **no undo control**, either in the walkthrough or on its done page.
- Propagate explicit, version-specific deletions and finish renumber compaction.
- Treat unexplained absence, incomplete save sets, stale plans, and failed verification as reasons to leave affected data untouched—not reasons to choose a winner.

The foundation does **not** need a version-history service, vector clocks, cross-device resolution receipts, a database, or another daemon.

This is a build specification, not a claim that its experiments have passed.

### Evidence convention

I used the 42 embedded sources and the four injected reviews. I did not access a filesystem, independently hash files, execute commands, or test hardware.

Every `[Snn]` citation denotes the **declared path and Facilitator-verified sha256** in the parallel arrays of `corpus.provenance.json` below. Short document names in the prose are readability abbreviations for those declared paths.

The earlier revised plans themselves were not embedded in this prompt. Where I credit or correct an earlier plan, I identify the review through which that material was supplied; I do not claim to have inspected the original artifact.

---

## 1. What changed, what I accept, and what still requires a pick

### 1.1 Corrections and adopted material

| Review and referenced artifact | Disposition in this revision |
|---|---|
| `claude_peer_review-r4.md`, `gemini_peer_review-r4.md`, and `kimi_peer_review-r4.md` identify the unspecified physical layout beneath `gpt-revised_plan-r3.md`’s retention store. | **Conceded.** A record contract without an exact discovery path leaves work to the future reader. Section 8 now specifies game/container directories, retention buckets, sequence-named events, and recovery of ordering without a separate index. I adopt the useful directory structure attributed to `claude-revised_plan-r3.md`, with collision-resistant keys and the fuller record contract. |
| `kimi_peer_review-r4.md` identifies the danger in immediately treating an unclaimed cloud-only multi-file save as an ordinary one-way download. | **Conceded.** Such a listing may be a partly published save set. I adopt the staging and repeated-observation approach attributed to `claude-revised_plan-r3.md`, but **two identical observations are not proof of completeness**. A closed member set or equivalent emulator-specific evidence is still required before automatic installation. |
| `claude_peer_review-r4.md` asks for an explicit cloud-loser fetch, attributed to `gemini-revised_plan-r3.md`. | **Adopted.** On KEEP RIGHT, the cloud loser’s save bytes and associated preview are fetched and verified into the local protected store **before publication replaces the cloud head**. A remote sibling is not a substitute for that local retained copy. |
| `claude_peer_review-r4.md` credits `gemini-revised_plan-r3.md` with the four-state apply journal. | **Adopted.** The frozen apply record distinguishes prepared operands, local installation complete, remote publication verified, and agreement committed. A boolean `done` is insufficient. |
| `claude_peer_review-r4.md` and `kimi_peer_review-r4.md` credit `kimi-revised_plan-r3.md` with the `racommands` finding, typed outcomes, checked slot adapter, and reader-destruction test. | **Adopted.** These are explicit implementation and acceptance contracts below. The underlying ES findings are independently visible in the embedded code. [S37–S42] |
| `claude_peer_review-r4.md` recommends excluding verified duplicate compactions from retained-conflict counts. | **Adopted and made explicit.** Compaction must not evict the player’s last real conflict loser. It receives an audit entry, not another retained-history event, once the surviving copy is verified. |
| `claude_peer_review-r4.md` credits `mistral-revised_plan-r3.md` with a missing-delete-hook degradation. | **Adopted as a development and external-writer fallback**, not as grounds for dropping explicit deletion propagation from the feature. Until an operation is instrumented, absence is not deletion authority. |
| `kimi_peer_review-r4.md` recommends the inline amendment format attributed to `mistral-revised_plan-r3.md`. | **Adopted as field-contract tables**, not implementation code. A directory does not receive a fictional “stored-bytes sha256.” Multi-file containers remain units over per-file entries. |

Two review claims need correction rather than adoption:

- `gemini_peer_review-r4.md` treats a bounded scan of unrelated JSON records as an established severe performance failure and describes directory-based history discovery as O(1). Neither runtime claim is measured. A game directory avoids an unnecessary global scan; enumerating and rendering its retained events still takes work. I adopt the better layout without claiming a benchmark.
- That review also treats `.cache` deletion as established. The embedded IA says `.cache` survives updates, while describing it as suitable for regenerable state. The argument for `.local/share` is **clear ownership of irreplaceable data**, not evidence that ROCKNIX currently wipes the proposed `.cache` subtree. [S02, S11]
- `mistral_peer_review-r4.md` attributes a full staging mirror, vector clocks, semantic merging, and a 99-slot cap to the GPT plan. I cannot verify that attribution from the supplied material. None is required here; all are expressly excluded.

### 1.2 The actual choices

These choices cannot be implemented both ways at once, even though most are not different overall architectures.

| Choice | This plan chooses | Reason |
|---|---|---|
| Who classifies conflicts? | **Our three-way content classifier.** Bisync remains an optional adapter candidate. | Game identity, moved slots, complete save sets, and verified agreement are application semantics. The corpus does not establish that bisync exposes a sufficient non-mutating interface. |
| Retention home | **`/storage/.local/share/rocknix/cloud-saves/`** | These are player-data copies, not disposable cache entries. Verify exclusion from backups, sync, and cleanup before enabling destructive apply. |
| Manifest publication | **One selected publication batch where supported; no mandatory manifest-last spawn.** | A manifest is an observation, not a multi-object commit. Reader-side content and completeness checks provide safety under either arrival order. |
| Slow exit-path verification | **Defer the upload, not merely its verification.** | The time budget cannot authorize overwriting a cloud head we have not established. |
| Completed retirement-notice lifetime | **A bounded recent window, with possible late resurrection explicitly accepted.** | Indefinite tombstones are unnecessary history growth. Losing a completed notice may allow an old copy to return; it must never cause an unknown copy to be deleted. Unfinished notices are not evicted. |
| Shared-save representation | **Per-file entries plus a unit descriptor.** Keep file `kind` as `state`, `auto`, or `save`. | A memory-card file remains an in-game save. A directory has members, not one file hash. |
| Unclaimed multi-file cloud data | **Stage and wait for completeness evidence.** | Repeated stability is useful evidence of quiescence, but a permanently partial upload can also remain stable. |

After the lifts above, **no underlying architecture difference remains between this plan and the architecture attributed to `kimi-revised_plan-r3.md` by the reviews**. There remain concrete policy choices, principally retention location and completed-retirement expiry. The manifest-last and receipt requirements attributed to `claude-revised_plan-r3.md` are not retained.

---

## 2. Binding decisions and proposed register refinements

The maintainer’s two amendments are authoritative:

1. Reversibility matters primarily for the immediately mistaken choice.
2. V1 retains discarded copies, on by default and count-bounded, but offers no restore control. A separate tool will reuse the comparison surface later.

They supersede the IA’s off-by-default retention setting and narrow the earlier V2 division. The retention **foundation** is V1; the history-restore **surface** is separate.

The following are proposed **new append-only refinements**, not edits to existing decided rows and not claims that the register has already changed. [S06]

| Existing decision | Required treatment |
|---|---|
| **D-CLOUD-030 — stored-byte identity and duplicate compaction** | Retain sha256 identity. Refine its application: duplicate and move reasoning is scoped to the correct game/core collection; local and cloud compaction use verified surviving copies; explicit deletion authority names the exact old occurrence/version. Ambiguous matching never authorizes deletion. |
| **D-CLOUD-031 — manifest and agreement schema** | Reopen for the field and semantic refinements in §4: manifest owner versus producer, complete units, claims-set union, context-bound agreement, agreement on verified equality, and bounded retirement notices. These close identifiable safety gaps; the file-per-device layout remains unchanged. |
| **D-CLOUD-028 — exit-path optimization** | Refine for #22: time remains a candidate-discovery hint, but exact dirty units and current cloud evidence govern writes. Zero-work exits should spawn no rclone. A changed exit may require read and verification calls; if those cannot be completed within the approved foreground budget, leave the unit pending. |
| **D-CLOUD-014 / D-CLOUD-015 — backup safety and migrated defaults** | Narrowly refine legacy mirror compatibility: a retained `BACKUPMETHOD=sync` setting cannot bypass the new classifier or authorize whole-tree save deletion. Version-specific retirements still preserve replaced bytes. Do not repeatedly rewrite a deliberately chosen setting; route its save operations through the coordinator and report any unsupported action honestly. |
| **D-CLOUD-029 — shipped writers remain until #22** | **No reopening.** Do not add a stopgap `--update`. #22 replaces the save-write paths together. |
| **D-CLOUD-017 — directories by core, build as data** | **No reopening.** Keep it. #10 is a paired ES/launcher change, not merely an XML configuration edit. |
| **D-CLOUD-025 — hardware before badge severity** | **No reopening.** The badge’s strength remains evidence-dependent. |
| **D-CLOUD-027 — persistent audit log** | **No reopening.** Keep its location, rotation, and support-only visibility. The discard store is not the audit log. |
| **D-CLOUD-024 — wizard in this feature drop** | **No reopening.** A detector-only release does not satisfy this plan. |

Also request explicit amendments to the IA and the bodies of #9, #21, #22, #23, #24, and #25:

- Remove the bisync plan’s automatic newer-wins scope.
- Make unattended conflicts pending work rather than an unsolicited takeover.
- Clarify cancellation after the non-conflict pre-pass.
- Move retention default to on.
- Keep the separate history-restore tool out of V1 resolution.
- Close the optional SQLite-index question: **do not build it now**.

The embedded issue files are predominantly comment threads. Their current bodies must be obtained before claiming those edits are complete. [S16–S28]

---

## 3. One coordinator owns every live-save operation

### 3.1 Two different locks protect two different things

The existing `take_cloud_lock` serializes cloud scripts on one device. It does not stop RetroArch or ES from changing files during a sync. Preserve it and add a **save-lifecycle gate**. [S29, S30, S35, S38, S41]

The lifecycle gate covers:

- ES’s pre-launch state preparation.
- The emulator process lifetime.
- `onGameEnded()` restoration and renumbering.
- The final stable capture of that session.
- Any sync installation, compaction, or explicit deletion that changes live saves.

**Lock order for operations needing both: lifecycle gate, then cloud lock.** Do not acquire them in the opposite order and wait.

Gameplay must remain protected if ES crashes and restarts while the emulator survives. An inherited process-lived descriptor is one candidate, not an established property of `ProcessStartInfo`. The hardware experiment decides:

- If the launch chain preserves the descriptor, use it.
- Otherwise, put ownership in the existing launch wrapper/supervisor.
- If neither protects the complete lifetime, live-save mutation remains disabled until that integration is repaired.

Use one small persistent “session cleanup/capture incomplete” marker to detect an interrupted lifecycle. It is not a history journal. If the emulator has exited but ES never performed cleanup, a new sync must not publish session-temporary state as final.

This matters for more than `.bak`: the embedded code also creates a temporary **numbered** incremental state during a session and may remove it at exit. A full pass during the session can otherwise upload a phantom slot. [S38]

### 3.2 Scheduling

- Boot requests go through the same coordinator and ES’s idle scheduling; `102-cloud-saves` must cease launching the old restore/upload pair.
- While a game is active, save-sync requests become pending.
- Read-only remote discovery and downloads into staging may occur without changing live saves. Before installation or publication, reacquire the required gates and revalidate operands.
- Do not hold a cloud lock throughout a player’s multi-minute walkthrough. A completed walkthrough is revalidated before apply.
- An explicit large restore may use the established modal transfer page. Automatic sync must not become an unbounded pre-launch wait.

The exact startup handoff is not embedded and must be established before replacing the boot script.

### 3.3 Capture is unconditional; upload is optional

Capture must not live inside the current conditional that checks `cloudsaves.gameexit` and `!ThreadedCloudSync::isRunning()`. Otherwise disabling sync or encountering an existing sync also disables provenance. [S41]

Capture runs after ES’s final save cleanup, even when:

- Exit sync is disabled.
- The network is unavailable.
- Another transfer holds the cloud lock.
- The emulator returned a nonzero exit status.

Capture records only stable files whose production can be attributed to this session. Other changed files may receive content observations with unknown provenance; a recent mtime alone does not prove that this emulator wrote them.

Record the **actual resolved launch context when constructing the command**, then carry it through exit. Re-running `getCore(true)` at exit is insufficient when `SaveState::setupSaveState()` changed the command’s emulator/core for the selected state. [S38, S42]

#21 must emit the effective core-package pins at image build, using the build system’s actual package resolution, and verify the installed artifact. The human `.info` display version is not the build pin. [S03, S04, S15]

Do not rewrite an unchanged manifest merely to advance `generated_at`. Otherwise every no-change exit manufactures an upload.

---

## 4. Data contracts

### 4.1 Identity, placement, and provenance are separate

Retain D-CLOUD-030:

- A file version is the sha256 of its stored bytes, including compressed `#RZIPv` state bytes.
- Slot and filename are placements.
- A thumbnail is an associated preview, not the save’s identity.

But a hash is not a game identifier. Equal zero-filled SRAM files from two games must not be merged. Move inference and duplicate compaction operate only inside an appropriate game/core collection, and ambiguous matches preserve all candidates. [S03, S37–S39]

Use a stable **game key** derived from a canonical descriptor containing the ES system and supplied content locator or emulator game ID. A ROM basename alone is insufficient. The key may be a hash of that descriptor for safe directory naming; it is not a replacement for save-version sha256. Store the readable descriptor in every durable record.

When the game cannot be identified, retain an explicit unknown/container identity rather than guessing.

### 4.2 Refined per-device manifest

Keep the decided path:

`<sync root>/savestates/.rocknix/manifest-<device-id>.json`

Each device publishes only its own file. The manifest’s top-level device identifies its **publisher/owner**, not necessarily the producer of every version it currently holds.

A device importing another device’s state into a free slot must copy the verified producer facts into its own placement observation. Otherwise KEEP BOTH loses its origin as soon as the original manifest entry changes and the audit log rotates. [S03, S04, S06]

The refined schema should be versioned explicitly; this plan proposes schema 2 while reading schema 1 conservatively.

| Area | Contract |
|---|---|
| Existing fields | Preserve the signed fields: stored-byte sha256, size, mtime, capture times, clock confidence, system, ROM, emulator/core/build/display version, slot, screenshot, and one-step `replaces`. Unknown remains distinguishable from zero and empty text. |
| Per-entry producer | Inline producer snapshot: device ID, label, model, family, OS/build context where known, emulator/core/build, capture times, and clock confidence. Imported copies retain the producing device; unstamped files remain unknown. |
| Placement observation | Relative path, game key/content locator, unit ID, and current slot/repository. Updating placement does not invent a new capture event. |
| Unit descriptor | Unit role, game/container identity, and the complete expected payload member map: relative path → sha256. Include preview references and hashes separately. |
| Retirement notices | Bounded, version-specific notices described in §6, published only by their issuing device. |
| Native remote hash | Optional evidence binding to the same remote/backend. It remains nullable; size and mtime never replace content verification. |

`kind` remains `state`, `auto`, or `save`. A shared PSX card is a `save` belonging to a `shared-container` unit. A multi-file save directory is represented by its member files and unit descriptor—not a directory entry with one sha256.

A unit is the smallest set that must be installed coherently:

- A numbered state’s payload, with its associated preview.
- An auto-state payload, with its associated preview.
- A singleton SRAM/save file.
- A declared multi-file save set.
- A shared memory-card/container unit, potentially covering several games.

A missing preview need not block a valid save: display “no preview,” not an unrelated screenshot. An incomplete required **payload** member set does block automatic installation.

The unit table must be derived from observed emulator layouts, not guessed from ROM filenames. D-CLOUD-028 already records why that shortcut fails for PPSSPP and Dreamcast. [S06, S09]

### 4.3 The union is a set of claims

Do not right-biased-merge manifests by path.

Two manifests may legitimately claim different hashes at the same path. Preserve both claims and match them to verified bytes. Neither manifest read order nor `generated_at` chooses the cloud’s current version.

Foreign manifests are fetched into an out-of-tree observation cache. They are never blindly republished by this device’s upload. Existing foreign manifest files already in the live sync tree must be excluded from the selected upload set.

A manifest/payload mismatch is **unknown or incomplete**, not a clean “no conflict” result. [S03, S21]

### 4.4 Agreement belongs to a sync context

Keep agreement local at `/storage/.cache/cloud_sync/agreed.json`, but bind it to:

- Configured remote and backend.
- Remote save root.
- Canonical local root or roots.
- A local link identity that changes on account relink or equivalent target replacement.
- The relevant schema/unit interpretation.

A remote name and folder string alone do not identify an account. If a relink cannot establish continuity, invalidate agreement. Unexplained manual configuration changes also require conservative invalidation; normal credential refresh must not be mistaken for a new account.

Without this binding, CHANGE CLOUD FOLDER can turn an unchanged local save into “cloud changed → download,” overwriting it from an unrelated library without a question. The cloud-folder surface already exists. [S13, S33]

Agreement records the last **verified common complete unit**, including verified equality where nothing transferred. It is not reconstructed from success stamps.

Keep at most one last-verified witness for this device’s own published manifest. An unexpected rewrite of that file is a reason to pause publication and investigate a cloned identity or lost local state—not to overwrite the remote copy. This is current-state checking, not a generation history.

### 4.5 Parser discipline

Manifests and listings are input, not commands.

Reject or isolate:

- Unsupported higher schemas.
- Duplicate JSON keys and malformed member maps.
- Absolute paths, traversal, paths outside the approved root, and unsafe symlink escapes.
- Conflicting case/normalization mappings that the local filesystem cannot represent.
- Unreasonable entry counts, sizes, or nesting.
- A preview reference escaping its permitted scope.

Unknown provenance is normal. Structurally unsafe metadata is not.

---

## 5. Classification and agreement

For each coherent unit, compare local payload map **L**, current verified cloud payload map **C**, and last-agreed map **A**. Normalize proven moves before deciding that a path replacement is a version fork.

| Condition | Action |
|---|---|
| L and C are verified equal | No payload transfer; establish/update A even if it was previously absent. |
| A known; only L changed | Upload the complete changed unit, with protected replacement and verification. |
| A known; only C changed | Download and install the complete unit, with a local preimage and verification. |
| Both changed differently | Genuine divergence; ask the player. |
| L and C differ; no valid A | Ask conservatively. |
| Genuinely new on one side, with complete membership and no contradictory prior-presence evidence | One-way transfer without a conflict prompt. |
| Exact explicit retirement applies | Follow §6, never a blanket missing-file rule. |
| Absence is unexplained, listing failed, or required members are incomplete | Hold the affected unit; do not overwrite or delete. |
| Preview changed but payload did not | Repair or suppress the preview association; do not manufacture a progress conflict merely from an image difference. |

“Unknown” must not share the representation of “absent.”

For legacy multi-file cloud sets, stage first and observe again on a subsequent full pass. Automatic installation requires a closed expected member set, a matching coherent manifest claim, or another tested emulator-specific completeness rule. **Two stable partial listings cannot certify a complete save.** If completeness cannot be established, preserve the bytes and report that the save set is not ready; do not fabricate a normal one-way transfer.

Only advance A after:

1. The actual transferred or already-equal bytes have been verified.
2. The whole unit’s required members are accounted for.
3. The result still belongs to the same sync context.
4. No unresolved publication race makes the outcome uncertain.

No resolution receipt is needed for the normal “another device later chose the other version” case. Once our publication has advanced A, a later different cloud choice is an ordinary cloud-side change. A fresh device with no agreement may ask once; that is an acceptable conservative result.

---

## 6. Transport, deletion, and convergence

### 6.1 Bisync is not permission to mutate

The corpus establishes installed flags and planning claims, not the required behavior of `--conflict-resolve none` against real conflicts. In particular, “no winner selected” does not establish “neither input renamed.” [S05, S16, S23]

Run the spike before adopting any bisync path:

- First initialization.
- Same-size changed bytes.
- Compressed states.
- Device-side rename/renumber.
- Both-sides change.
- Dynamic selection/filter changes.
- Interruption before and during transfer.
- Subsequent `--recover`/`--resilient`.
- Local and remote tree contents **and** bisync listing-state files before/after.

If bisync can satisfy a narrow, tested interface without renaming losers or inventing agreement, it may serve behind the coordinator. If it cannot, use selected rclone copy operations. **The classifier remains ours under either outcome.**

Never automatically run `--resync`. Experimental bisync state stays explicitly under `/storage/.cache/rclone/bisync`, separate from our agreement.

No upstream roadmap or rclone 1.75.0 implementation source is embedded. Do not plan around promised future features.

### 6.2 Exact selection; no optional safety filters

The new coordinator must construct the approved file set itself.

User `RCLONEOPTS` cannot replace the mandatory save allowlist, admit staging files, select another target, supply a conflict resolver, or enable destructive flags. Transport preferences such as bandwidth and timeouts can remain configurable through a validated subset.

This closes source-visible holes:

- A non-empty `RCLONEOPTS` replaces the fallback containing `--filter-from`.
- User rules precede defaults.
- The broad save rules admit `.state.auto.bak`, temporary numbered states, and conflict-client artifacts with save extensions. [S29–S33]

Use a tested exact-file selection mechanism such as `--files-from`; do not add a lone manifest `--include` that silently excludes the payload.

Upload selected payloads and the owner’s manifest together where supported. Reader coherence checks handle either arrival order. A manifest-last extra call is optional optimization only if measured behavior earns it.

A post-upload `remote_hash` cannot appear retroactively in the manifest already uploaded. Record verification locally, and publish the metadata update later if useful; `remote_hash: null` is legal. Do not create another mandatory spawn just to make the field non-null.

### 6.3 The exit budget is a safety constraint, not a correctness shortcut

A no-change exit with no pending publication should require:

- Local capture comparison.
- No rclone process.
- No remote probe.
- No archive phase.
- No manufactured manifest update.

That result means **“no new local saves to upload,”** not “the cloud was checked and is fully synchronized.”

A changed exit must obtain current cloud evidence for its candidate units before overwriting them. A locally computed Dropbox/MD5 hash can help match a later listing; it cannot reveal the current cloud head without observing the cloud.

Expected process accounting—not a measured result:

| Work | Possible rclone starts |
|---|---:|
| Idle, nothing pending | 0 |
| Current candidate listing | 1 |
| Fetch changed manifests or hashless operands | Additional batched reads as needed |
| Selected publication, manifest included | 1 |
| Post-publication content verification | Usually another call unless a tested interface supplies equivalent artifact evidence |

Thus “one publication spawn” is **not** “one total spawn.” A changed pass may need three or more. On an A53 this matters. [S06, S09]

Use the approximately five-second no-change experience as the foreground design target. Bound automatic preparation/verification work; if the backend needs a long hashless read, leave the upload pending for the next full pass. Once a publication has begun, do not abort safe completion merely to satisfy a cosmetic stopwatch.

Before #22 is enabled, measure the complete changed-save path and agree its foreground ceiling. If ordinary Dropbox saves routinely cannot meet that ceiling, the feature is not ready to claim fast exit sync; optimize or move the remaining work to an honestly reported pending pass. Never retain fast-path overwrite as the fallback.

A connected LAN route can exist without a default route. Preserve the local, packet-free network decision, using route-to-endpoint information when available. Do not substitute a ping to Google or another internet host. [S09, S29, S35]

### 6.4 Protected publication and its limit

Before replacing a known cloud conflict loser, its verified local retained copy must already exist.

For the actual remote replacement, test `copy` with a unique per-operation `--backup-dir`, using a **sibling of** `SYNCPATH`, not a child. Validate the sibling’s configured prefix on bucket remotes; do not infer existence from `lsjson --stat`. [S06, S09, S29]

The race fixture must inspect which bytes the backup directory actually received:

- Expected old head.
- Intervening third head.
- Final published head.
- State after interruption and retry.

If an unexpected version is preserved there, fetch it into protected local pending storage and stop treating the operation as an ordinary completed choice.

**A retention sweep must never evict the only copy of an unreviewed head.** This is adopted from `gemini-revised_plan-r3.md` as quoted in `kimi_peer_review-r4.md`.

However, a passing race fixture is not proof of atomic compare-and-swap across 69 backends. No such universal primitive is established here. This plan supports the stated single-player, sequential-writer model and detects/preserves observed violations where possible; it does not advertise serializability against arbitrary concurrent or legacy writers.

If a backend cannot preserve the object being replaced through the tested path, destructive publication on that backend stays pending. Read, stage, capture, and non-destructive additions remain available. Do not add a distributed transaction service to hide that limitation.

### 6.5 Explicit deletion and compaction

Deletion remains a capability.

An instrumented ES delete records, before removal:

- Issuing device and operation ID.
- Sync context and affected collection/unit.
- Exact old path/member map and hashes.
- Reason: explicit delete or verified relocation.
- Verified surviving placement for relocations.
- The required protected preimage until propagation finishes.

A notice applies only to the recorded occurrence/version. If that path now contains different bytes, it is not authority to delete them.

For renumbering:

1. Match byte-identical versions within the game/core collection.
2. Establish the intended surviving placement.
3. Copy and verify it locally and remotely as required.
4. Only then retire obsolete occurrences.
5. Update agreement and write the audit outcome.

Example: `{0:X, 1:Y, 2:Z}` becomes `{0:X, 1:Z}` after explicitly deleting Y. The operation must distinguish deletion of Y from relocation of Z. It must not describe both as arbitrary path overwrites. A second device with unchanged old copies can apply those exact retirements; a changed Y or Z is protected from the old notice.

Repeated A→cloud→B→cloud passes must reach a fixed point: no duplicate resurrection, repeated renumber, or repeated payload upload in the no-new-play case.

**Completed-notice bound:** retain a recent window of completed retirement operations in the owner manifest. Proposed engineering starting bound: 64 completed operations per device, to be checked against the census and manifest budget. Pending operations remain pinned; storage/control-state pressure stops new automatic retirement rather than dropping unfinished intent.

After a completed notice expires, a sufficiently old or historyless client may reintroduce an old copy. That is an explicitly accepted, non-destructive limitation—not silent deletion and not a promise of indefinite deletion memory.

If a deletion happened outside an instrumented path, fail closed on its unexplained absence. Depending on existing agreement, it may remain held or later be restored as an ordinary surviving copy. The missing ES attach point is an implementation dependency for #24, not an argument to abandon deletion propagation.

---

## 7. Wizard, merge adapter, and apply

### 7.1 Entry and cancellation

Retain the walkthrough:

- System, then game.
- Cloud always left.
- Screenshot for an associated state preview; glyph for an in-game save.
- Date/time, producing device/model, and core/build context.
- No file size, playtime, or automatic recency selection.
- KEEP LEFT, KEEP RIGHT, KEEP BOTH.
- KEEP BOTH disabled with a reason for in-game save/container units. [S02, S24]

Unattended boot and game-exit passes record pending conflicts and badge the existing cloud/save surfaces. An explicit sync can enter the walkthrough when ES is idle. Kid/kiosk mode must preserve pending data rather than silently resolve it or expose a new privileged resolver. [S13]

Before the walkthrough, finish the applicable non-conflict pre-pass and establish the complete cloud occupancy of each state collection that may allocate a slot. Interrupted or incomplete collection preparation cannot open a KEEP BOTH flow.

Replace the contradictory promise “nothing transfers until COMPLETE” with:

> **No conflict choice is applied until COMPLETE. Leaving this walkthrough discards its choices. The non-conflicting transfers already completed are not undone.**

Fetching previews or staged conflict bytes is not installing or publishing a resolution.

### 7.2 Deterministic auto KEEP BOTH

For an auto-state conflict:

- This device’s version remains `.state.auto`.
- The cloud version becomes a numbered state in the next verified free slot.
- Publish that same resulting mapping.
- State the result on the done page.

No extra “which one should remain auto?” sub-choice is needed.

The schema’s statement that auto states diverge every session is not generally established: numbered-slot launches under `racommands` restore the pre-session auto state from `.bak`. Measure frequency; keep the resume-point presentation regardless. [S03, S38]

### 7.3 The checked ES adapter is mandatory

Reuse ES’s conventions, not its unchecked return values.

The embedded implementation establishes that:

- `getNextFreeSlot()` can return −99 for an auto-only repository.
- Non-RetroArch states are outside the current repository’s enabled path.
- `copyToSlot()` returns true without checking copy/rename results.
- Full destination names are derived from the source file’s parent.
- Creating `es_savestates.cfg` changes launch behavior. [S37–S39]

The adapter must:

1. Refresh the correct game/core repository.
2. Include verified cloud occupancy and slots reserved by earlier choices in the same batch.
3. Use ES’s allocator when it returns a valid unused slot.
4. Handle the confirmed auto-only case from `firstslot`; never pass −99 as a real slot.
5. Reject unsupported repositories rather than pretending every emulator supports KEEP BOTH.
6. Construct the destination explicitly in the live repository—not beside the staged source.
7. Stage under a name matching neither ES discovery regex.
8. Copy state and associated preview without deleting the source.
9. Re-read and verify destination bytes, then refresh ES discovery and verify the installed slot.
10. Remove an obsolete source only after verification and a recorded retirement decision.

Do not invent a 99-slot cap. Also do not turn ES’s scan ceiling into a claim that every returned path is free: check the actual target.

### 7.4 Apply is a recoverable sequence, not a global atomic transaction

On COMPLETE:

1. Freeze choices, operands, expected hashes/member maps, context, and destination reservations in one persistent apply record.
2. Reacquire gates and revalidate local/cloud operands and relevant slot occupancy.
3. If anything changed, invalidate affected choices. Do not replay an old decision over new progress.
4. Prepare and verify all required local preimages and retained-conflict records.
5. Write an audit **intent** before destructive work.
6. Install and publish with verified per-unit outcomes.
7. Commit agreement for completed units.
8. Finalize retained events and audit outcomes.
9. Remove temporary preimages only when no unresolved work depends on them.

The apply record has these distinct states:

- **Prepared operands**
- **Local installation complete**
- **Remote publication verified**
- **Agreement committed**

Keep per-unit progress inside that record. Do not add a second journal.

On restart, recognize completed steps by their artifacts and hashes. A stale “done” flag or rclone exit code is insufficient. If the observed state no longer matches either the precondition or the expected result, preserve everything and reclassify. Do not blindly roll back over newer data.

The pre-COMPLETE walkthrough is reversible. Post-COMPLETE apply can be interrupted; the promise is preserved operands and recoverable, honestly reported work—not an impossible atomic switch across a handheld and a cloud backend.

### 7.5 Typed results

Reserve script control outcomes deliberately:

| Outcome | Suggested exit |
|---|---:|
| Completed requested work / explicit local-no-change result | 0 |
| Failed | 1 |
| Skipped: another operation holds the required gate | 3 |
| Skipped: no usable network route | 4 |
| Needs player decision | 5 |
| Pending/retry: incomplete evidence or deferred work | 6 |

Map rclone’s native exits to these outcomes; never pass native 3/4 through as our lock/network meanings. [S29, S30, S40]

Write a run-bound result containing operation ID, context, disposition, and completed/pending units. Missing, malformed, or stale results fail closed.

Success stamps describe verified completed work. Conflicts and pending work must not look like a successful sync. Keep the existing menu rows and their cadence; do not “deduplicate” them away. [S06, S13]

---

## 8. The retained-copy store the future tool will read

### 8.1 Exact layout

Use the proposed persistent player-data root:

`/storage/.local/share/rocknix/cloud-saves/`

Its areas are:

- `discarded/` — finalized, count-bounded conflict-retention events.
- `pending/` — frozen apply records and unfinished operands.
- `preimages/` — temporary protection for current mutations, not a version history.

A finalized retained event lives at:

`discarded/<system-key>/<game-or-container-key>/<bucket-key>/<commit-seq>-<operation-id>/`

It contains:

- `record.json`
- Retained payload member files.
- Retained previews, if present.

Keys come from validated canonical descriptors, not lossy replacement of punctuation in a ROM basename. The record retains all readable names.

The sequence is a persistent local monotonic **commit order**, assigned when the event is finalized. It is not a save generation or ancestry counter. Unfinished records remain prepared and pinned; they are not presented as finalized history.

The sequence appears in both the event name and record. If an auxiliary index or counter is lost, rebuild from retained records and choose a value above the surviving maximum. A separate database is unnecessary.

### 8.2 Self-contained `record.json`

Every retained event records the following **before the destructive step**, initially with prepared completion state:

| Category | Required contents |
|---|---|
| Record identity | Record schema, operation ID, resolving device, sync-context reference, and finalized commit sequence when assigned. |
| Picker identity | System, game key, ROM filename/content locator where known, unit ID/role, container label, and known game associations for shared containers. |
| Original placement | Original relative paths, core repository, numbered slot or `auto`, and resulting destination mapping. |
| Retained bytes | Complete member list, sha256, size, and stored location for every retained payload member. |
| Producer snapshot | Inline device ID/label/model/family, emulator/core/build, capture times including local offset, clock confidence, and explicit unknowns. Do not merely reference a live manifest. |
| Preview | Stored preview location and hash, or explicit absence. |
| Decision | Action, which operand was cloud/device, which side won, winner member map/hashes, and known winner provenance. |
| Explanation | Retention reason and the decision summary the walkthrough produced. |
| Completion | Prepared/finalized state; whether required bytes have been verified and the selected result committed. |

For unknown-provenance files, construct this record with known identity and placement and explicit unknown producer fields. “Copy the manifest entry verbatim” is insufficient when no entry exists.

For KEEP RIGHT, **download the cloud loser’s complete bytes and associated preview into this store before overwriting the cloud**. For KEEP LEFT, retain the local loser before installing the cloud version.

The store is local to the resolving device. A decision made on A is not automatically available in B’s future history picker. That limitation matches the primary one-step, same-device recovery case and must be stated plainly.

### 8.3 Bounds that preserve the useful copy

Proposed product default: **keep three completed conflict events per logical bucket**, with retention on. Three is a proposal; the maintainer settled “on and bounded,” not the number.

Buckets:

- Auto states: one game/core resume bucket.
- Numbered states: one game/core collection bucket, independent of slot renumbering.
- Singleton saves: their stable save unit.
- Multi-file saves/shared cards: the whole unit, never separately pruned members.

A multi-slot resolution within one collection can be one retention event containing all its discarded members.

Prune in local commit order, never by filesystem mtime or capture date.

Do **not** consume the conflict-retention count with:

- Verified duplicate compactions.
- Renumber retirements whose identical bytes survive.
- Routine metadata rewrites.
- Temporary preimages of successful ordinary one-way transfers.

Unfinished operations and unreviewed raced heads are not count-prunable. If safe storage cannot be allocated, refuse the destructive step. Do not silently turn retention off.

If the existing retention setting is deliberately turned off, temporary transaction protection still lasts until completion; the done page must not then claim that discarded copies were retained.

### 8.4 Future-reader acceptance test

V1 does not ship a reader UI, so test a reader projection now.

After completing retention:

1. Overwrite the producer’s live manifest entry.
2. Renumber live slots.
3. Change the state directory layout.
4. Rotate the audit log.
5. Delete the completed apply record.
6. Change the wall clock backwards.
7. Remove/rebuild any optional index.

Then ask only the retained store:

> Show this game’s retained versions, newest first, with the retained preview or explicit absence, producing device, original slot, and which side won.

The test must succeed, including a multi-file unit and an unknown-provenance file. This adopts the destruction-of-dependencies test credited to `kimi-revised_plan-r3.md` and `claude-revised_plan-r3.md` by the reviews.

### 8.5 V1 presentation and the separate tool

The done page says what was discarded, per game, and—when applicable:

> **Discarded copies are kept on this device.**

It offers no restore button and does not promise a currently available recovery route.

Create a separate issue for the later history-restore tool:

- Enter from outside conflict resolution.
- Select a game/container and a retained event.
- Reuse the compare-and-choose surface against current data.
- Use the same protected apply engine.
- Retain the displaced current copy under the chosen retention policy.

No additional history engine is needed to make that possible.

---

## 9. Migration from the shipped pipeline

### 9.1 Replace all writers together

The source proves that the shipped boot pair is `copy --update` both ways and the exit path is an unconditional differing-file copy inside its recent window. A wizard placed after them cannot protect what they already overwrote. [S29, S35, S41]

#22’s cutover must cover:

| Surface | New home |
|---|---|
| Boot save sync | Idle-scheduled coordinator request, not the old script pair. |
| Game exit | Unconditional stable capture, followed by optional bounded upload request. |
| SYNC / UPLOAD / DOWNLOAD save rows | Directional requests to the same classifier and apply engine. “Upload” is not permission to overwrite a divergent cloud head. |
| Hub SAVE DATA tick | Same coordinator and result/stamp contract as the frequent save rows. |
| Tools and direct `cloud_backup` / `cloud_restore` save phases | Compatibility frontends to the coordinator; no raw bypass. |
| Future #37 SYNC tile | Same lock, context, agreement, and pending-conflict path. |
| Content and system backup flows | Remain separate, with tested exclusion of live saves and the retained store. |

Inventory and re-home the old behaviors before deleting the pair:

- Restore-before-upload freshness becomes three-way reconciliation.
- `--update`’s limited skip becomes verified divergence handling.
- `--recent` remains a cheap discovery aid, not overwrite authority.
- Lock and skip semantics remain.
- Per-row stamps remain.
- Archive separation remains.
- No-network handling stays local and fast.

Also fix outcome aggregation: the embedded backup/restore mains return the save-phase status even when a system phase fails. That cannot be the model for a multi-unit result. [S29, S30]

### 9.2 Split roots

The shipped config explicitly advertises a different `RESTOREPATH` as a way to avoid replacing live data. Therefore `BACKUPPATH == RESTOREPATH` is not merely an obscure hypothetical. [S33]

This plan supports:

- One canonical root for two-way reconciliation.
- A different restore root as a **one-way staging/import destination**, with its own context and no inferred live-save agreement.

Refuse bidirectional reconciliation of unequal roots. Preserve the owner’s existing config; do not silently rewrite it or pretend a warning makes the comparison valid.

### 9.3 #10 remains in the drop, last in the dependency chain

Read old flat states and new per-core states; write new states to the new layout. Leave legacy provenance unknown unless independently established.

The embedded ES code makes a “config-only migration” unsafe:

- Compiled defaults enable `racommands`, autosave, and incremental behavior.
- The XML path hard-codes `racommands = false` and defaults autosave/incremental differently.
- The non-`racommands` path emits `-state_file` and may switch emulator/core. [S38, S39]

The rehearsal must answer:

1. Does ROCKNIX’s launcher honor that explicit state-file path?
2. Do numbered, auto, new-game, and incremental launches preserve the intended save behavior?
3. Do ES discovery and RetroArch’s write directory agree for every migrated core?

If the rehearsal fails, #10 needs the corresponding ES/launcher patch. Do not fix it by falsely labelling unknown flat states as belonging to the current default core.

Carry state and preview by copy–verify–delete where migration is needed. A killed migration must leave the old shape usable. [S11]

Mixed-version **data** remains readable. A still-running old writer cannot be made safe by a new device’s metadata. Test and document that boundary honestly; do not claim a release note prevents an old binary from clobbering the shared folder.

---

## 10. Proof gates, in order

The first gates are experiments against existing behavior and throwaway fixtures, before production capture/detection code is committed to these assumptions. Later gates necessarily verify the implementation once it exists. None has been executed by this council member.

Use the RG35XX SP and RG-SP as the primary pair. The corpus reports RG351M and RG353M on the bench; confirm their availability and build identities before scheduling them. Keep the QA WebDAV on loopback under D-QA-002.

| Gate | Experiment and evidence | Blocks |
|---|---|---|
| **0 — Make the test vehicle trustworthy** | Repair and run `tools/cloud-round-trip` in a disposable GENERIC_X64 VM, on WebDAV and MinIO. Verify real remote objects and restored bytes. Preserve all test-modified configuration, fail on command failures, and add positive controls for each exclusion. | Any claimed baseline pass; #22. |
| **1 — Identity and compatibility control** | On the two H700s, confirm distinct IDs/models on the same image and effective core pins. Run same-chipset transfers first, then H700↔RK3326↔RK3566, a second/heavier core, a core-version change, and loud/silent corruption cases with compression considered. Observe continued operation and re-save, not merely the first frame. [S08, S20] | Badge severity; launch/capture context contract. |
| **2 — Save lifecycle** | On H700, launch a numbered state with incremental behavior. Observe `.auto`, `.bak`, and the temporary numbered copy before and after exit. Attempt a full sync mid-session; kill ES while the emulator survives; verify no live mutation or temporary publication escapes the gate. | #21 capture ordering; #22 live mutation. |
| **3 — rclone/bisync semantics** | Run the cases in §6.1 on VM WebDAV/MinIO and disposable Dropbox paths from H700. Record exact output, bytes, filenames, and listing-state changes. Test exact-file selection and interrupted manifest/payload arrival separately. | Transport adapter selection. |
| **4 — Replacement and retirement under interruption/race** | On Dropbox and QA backend families, insert a third head between observation and replacement; interrupt each transfer/retirement stage. Inspect actual backup-dir contents and final heads. Test sibling-prefix validation and missing-path probes. | Destructive publication and cloud retirement on each backend. |
| **5 — Cost and real save census** | On H700, measure zero-change, one-state, auto+SRAM, and larger save-set exits; count all rclone starts and reads. Inventory real PPSSPP, Dreamcast, N64, and PSX units. Test wrong clocks, link/context changes, equal roots, and split-root import. | Final #20 refinement; automatic #22 coverage and exit budget. |
| **6 — Slot and convergence proof** | On the H700 pair, test auto-only allocation, explicit `firstslot`, cloud-only high slots, staged-source parent mismatch, failed copies, two KEEP BOTH choices in one collection, delete+renumber, and delete-versus-edit. Repeat A→cloud→B→cloud until no-change passes transfer nothing. | #24 apply and deletion propagation. |
| **7 — Retention reader and storage survival** | Execute §8.4; test full/read-only storage and interruption between prepared/finalized states. Upgrade a populated image and exercise ordinary backup/cleanup paths. Assert retained bytes are neither swept away nor uploaded by another tier. | Enabling V1 discard apply. |
| **8 — Small-panel recognition** | Start at real RG351M 480×320, then 640×480. Ask the maintainer to identify two real moments, including dark/text-heavy previews. Verify missing previews, unknown provenance, disabled KEEP BOTH, and controller navigation. If recognition fails, add a focused enlarge-preview interaction—not fabricated metadata. | #23 visual sign-off. |
| **9 — #10 rehearsal** | On H700, rehearse flat/new mixed data and the non-`racommands` launch path; test all launch modes, screenshots, write directories, and interruption. | Per-core layout cutover. |
| **10 — End-to-end release gate** | On the two physical H700s, sequentially play offline from the same agreement, sync one, then sync the other. Exercise boot, exit, every menu path, KEEP LEFT/RIGHT/BOTH, cancellation, retained copies, failure outcomes, and restart recovery. Include cloned-ID and ordinary overlap attempts. | The feature drop and upstream delivery, D-QA-001. |

### Coverage of the eleven named unknowns

1. **Chipset and silent failure:** Gate 1; no universal compatibility inference from one core.
2. **Bisync state/recovery/agreement overlap:** Gates 3–4; our A remains authoritative regardless.
3. **Auto frequency:** Gates 2 and 5; measure rather than repeat “every session.”
4. **Pre-pass and KEEP BOTH:** Gate 6, including interrupted preparation and stale occupancy.
5. **ES config / RetroArch layout:** Gate 9.
6. **Core pins and actual emulator/core:** Gates 1 and 5, then artifact verification of #21’s emitted file.
7. **Split roots:** Gate 5; one-way import, not ambiguous two-way state.
8. **Standalone multi-file/container saves:** Gate 5; automatic coverage only for established unit rules.
9. **480×320 recognition:** Gate 8.
10. **Two devices online:** Gates 4 and 10; no claim that a local lock supplies remote atomicity.
11. **Never-run suite:** Gate 0 before it is used as evidence, Gate 10 for physical end-to-end assurance.

---

## 11. Failures the current corpus has not ruled out

These are cheap experiments, not reasons to build a larger history system.

| Failure | Cheapest exposing experiment | Consequence if found |
|---|---|---|
| Same-basename ROMs or different ROM revisions share a state path. | Two disposable content paths with the same basename; save and import both. | Preserve distinct content locators; block ambiguous association instead of deduplicating by hash/name. |
| A state load later overwrites SRAM selected independently in the wizard. | Load an old state beside newer disposable SRAM; wait for autosave and exit; compare SRAM bytes. | Define the affected load-coupled unit/protection behavior before claiming independent choices stay intact. Do not infer this coupling for every core. |
| A correct-looking PNG belongs to another state version. | Change a state while withholding/reordering its preview upload. | Suppress unproven previews; never substitute the game’s latest screenshot. |
| Equal-size changes escape backend comparison. | Change bytes without changing length or useful mtime, on the hashless backend. | Force the exact established transfer; never let rclone’s size comparison overrule it. |
| Case, Unicode, or path syntax aliases two distinct remote objects locally. | Fixture names differing only by case/normalization, plus spaces, quotes, newlines, and pattern characters. | Reject unrepresentable mappings and fix selection escaping before mutation. |
| A cloned card creates two publishers with one device ID. | Boot two disposable copies with the same ID; publish sequentially, then overlap. | Demonstrate unexpected-own-manifest detection and honest refusal; do not claim that it catches every simultaneous race. |
| Metadata or save writes fail after a “successful” copy call. | Full/read-only destination and interrupted writes; inspect actual files and ES discovery. | No agreement or success stamp; preserve operands. |
| The configured storage root disappears. | Make the disposable root unavailable during listing and apply. | Fail closed on unexplained absence. Explicit versioned deletion remains supported. |
| A core pin matches but build flags/options alter serialization. | Same pin, controlled differing runtime options or device build; transfer and continue/re-save. | Narrow compatibility evidence; a pin is useful provenance, not a universal load guarantee. |
| A stale UI result is reused after context change or ES restart. | Leave an old success/result file, change the remote context, then start a failed run. | Run/context binding must reject it; no false success card. |

### Source-visible fixes to file immediately

The orchestrator should file or attach these to their implementation owners; I have not filed them:

1. **Mandatory selection bypass and temporary-file admission** in the current saves scripts/rules. [S29–S33]
2. **Native rclone exit-code collision** with script 3/4 and incomplete phase-result aggregation. [S29, S30, S40]
3. **Round-trip harness defects:** it overwrites `rclone.conf` before asserting the remote and does not restore it; archive-name checks disagree with dated upload/restore names; the real tar-archive assertion lacks its own creation fixture; content fixtures must match the now-declared-system allowlist. Its current log/string checks also cannot prove network calls were absent. [S29, S30, S36]
4. **ES adapter and config-mode behavior** documented as checked conventions but incompletely represented by the IA. [S02, S37–S39]
5. **Boot reachability and handoff:** the embedded boot script still pings Google and launches the old pair. [S35]

Do not convert these findings into claimed fixes merely because an issue exists. The project’s governing rule is to verify produced artifacts and observed behavior. [S07, S10, S14]

---

## 12. Load-bearing versus optional

### Load-bearing for V1

- One admission/classification path for every save writer.
- Lifecycle protection through cleanup and capture.
- Current cloud evidence before overwrite.
- Context-bound, content-verified agreement, including equality bootstrap.
- Complete-unit handling and honest unknowns.
- Checked slot installation and convergent renumber retirement.
- Version-specific explicit deletion.
- Prepared operands and recoverable per-unit apply.
- Default-on, count-bounded, self-contained retained conflict copies.
- Truthful typed outcomes and preserved pending work.
- Hardware and artifact gates above.

### Not required for V1

- A restore/undo control.
- A full snapshot browser or eight-generation history.
- Cross-device `resolves` receipts.
- Vector clocks or a new distributed identity protocol.
- Unbounded tombstones.
- A SQLite index.
- Mandatory manifest-last publication.
- A mandatory native-hash computation spawn.
- Semantic merging of binary SRAM or cards.
- A full remote staging mirror.
- Automatic `--resync`.
- A 99-slot product cap.
- A new daemon.
- Provider-specific compatibility claims unsupported by testing.

### Still recommendations, not corpus-settled facts

The application-owned classifier, queue-and-badge trigger, lifecycle-gate mechanism, exact-file batching, retained-store home, count of three, retirement-window bound, and protected `copy --backup-dir` behavior are **proposals with gates**, not truths established by agreement among reviewers.

The corpus settles the current scripts and ES behaviors, the signed decisions, and the previously recorded measurements. It does not establish that this new combination works.

**Proceed first with the schema refinements, missing-source retrieval, and Gates 0–5. Do not enable destructive reconciliation until the relevant adapter, retention, and hardware gates pass.**

---

## `corpus.provenance.json`

```json
{
  "artifact": "gpt-revised_plan-r4.md",
  "role": "council member, round-4 revised approach",
  "corpus_mode": "Verbatim embedded read-at-time corpus supplied by Council Facilitator council-facilitator@1.2.0",
  "source_count": 42,
  "manifest_read_timestamp_utc_as_supplied": "2026-09-05T17:32:51Z",
  "member_filesystem_access": false,
  "member_independently_reread_files": false,
  "member_independently_rehashed_files": false,
  "member_executed_commands_or_hardware_tests": false,
  "hash_basis": "Values copied from the supplied per-source headers; sha256 verified at embed time by the Facilitator, not recomputed by this member",
  "citation_mapping": "S01 through S42 denote the declared path and sha256 in the same-index entries of source_file_paths and source_file_hashes; S01 is array index 0",
  "additional_embedded_material": [
    {
      "filename": "claude_peer_review-r4.md",
      "declared_source_path": null,
      "sha256": null
    },
    {
      "filename": "gemini_peer_review-r4.md",
      "declared_source_path": null,
      "sha256": null
    },
    {
      "filename": "kimi_peer_review-r4.md",
      "declared_source_path": null,
      "sha256": null
    },
    {
      "filename": "mistral_peer_review-r4.md",
      "declared_source_path": null,
      "sha256": null
    }
  ],
  "earlier_revised_plans_embedded": false,
  "earlier_plan_attribution_basis": "Only descriptions and quotations in the four injected reviews; original earlier plan contents were not independently inspected",
  "maintainer_amendments": {
    "source": "Orchestrator brief embedded in this prompt",
    "declared_source_path": null,
    "sha256": null,
    "applied_as_authoritative": true,
    "requirements": [
      "Preserve save sanctity and player choice; primary reversibility case is one step back; edge cases inform rather than unnecessarily drive the architecture",
      "V1 retains discarded copies on by default, bounded by a count, and ships no undo control",
      "The done page reports discarded copies and that they are kept",
      "A separate history-restore tool will reuse the compare-and-choose surface",
      "V1 retention records must independently support that future reader"
    ]
  },
  "peer_material_use": "Technical claims assessed against the embedded corpus and authoritative amendments; not used as evidence about councils, models, or deliberation",
  "proposed_runtime_paths_are_not_source_provenance": true,
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
      "material": "GuiSaveState.cpp, SaveState.h, SaveStateRepository.h, Paths.cpp, and filesystem copy/rename utility implementations",
      "reason": "Verify the explicit-delete attach point, default arguments, root handling, copy failures, and timestamp behavior",
      "declared_source_path": null,
      "sha256": null
    },
    {
      "material": "ProcessStartInfo implementation, launch wrapper/supervisor, ES startup ordering, and boot handoff",
      "reason": "Establish lifecycle-gate ownership, descriptor inheritance, surviving emulator behavior after ES death, and idle boot scheduling",
      "declared_source_path": null,
      "sha256": null
    },
    {
      "material": "setsettings.sh, shipped retroarch.cfg, and effective RetroArch launch arguments",
      "reason": "Verify state-file support, per-core directory behavior, autosave/incremental semantics, and state/SRAM interaction",
      "declared_source_path": null,
      "sha256": null
    },
    {
      "material": "backuptool, cloud_sync.conf.defaults, cloud_sync-rules.txt.defaults, cloud_setup, and cleanup/update consumers",
      "reason": "Verify retention-store survival and exclusion, config migration, relink/context invalidation, and effective mandatory filters",
      "declared_source_path": null,
      "sha256": null
    },
    {
      "material": "cloud_content_backup, cloud_content_restore, and tools/cloud-test-backend",
      "reason": "Verify tier boundaries, current content-fixture eligibility, QA endpoint isolation, and complete harness cleanup",
      "declared_source_path": null,
      "sha256": null
    },
    {
      "material": "rclone 1.75.0 documentation/source and relevant upstream change or roadmap records",
      "reason": "No supplied primary material establishes bisync side effects, recovery guarantees, exact-file selection composition, copy backup-dir race semantics, or future direction",
      "declared_source_path": null,
      "sha256": null
    },
    {
      "material": "Current issue bodies and docs/es-ui-style-guide.md",
      "reason": "The embedded issue files are predominantly comment threads; reported body edits and complete UI requirements are not independently present",
      "declared_source_path": null,
      "sha256": null
    },
    {
      "material": "Earlier revised plans, including gpt-revised_plan-r3.md",
      "reason": "Only their descriptions and quotations in the injected peer reviews are available here",
      "declared_source_path": null,
      "sha256": null
    }
  ],
  "missing_source_policy": "No missing source paths, hashes, file contents, command results, hardware observations, or completed issue/register edits have been fabricated"
}
```