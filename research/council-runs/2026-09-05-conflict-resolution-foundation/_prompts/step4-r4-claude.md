# Council — round 4, peer vote

You are one of five council members. Each of you has now produced a round-4
revised approach to the foundation for cloud-save conflict resolution in
ROCKNIX. The corpus is embedded above, unchanged and hash-verified; the other
four members' round-4 revised plans are injected below.

Vote for **exactly one** of them. You may not vote for your own plan, and your
own plan is not injected — judge the four you are given.

## Anti-self-citation constraint

Judge the plans on their merits against the embedded corpus. Do not treat the
injected artifacts as evidence about how councils, models, or this deliberation
behave.

## Amendment to the problem context — two maintainer decisions

Both are authoritative, both were made **after** the injected plans were
written, and neither is open for argument. No plan is expected to name them and
none should be criticised for their absence. What matters is which plans are
closest to them, and what each would have to change.

### The purpose, restated

> The goal is to preserve the sanctity of the user's saves and to empower them
> with the choice to make a decision about a conflict. Undoing that choice is
> also something a user should have the option to do. They likely aren't going
> to be going 8 steps back with the save, but may accidentally make the wrong
> choice with the conflict and want to undo that choice. That's going to be the
> primary use case.
>
> Some of the edge cases around card disconnection, and so on, are good to think
> about, but are edge cases that shouldn't constrain our approach unnecessarily.

So: reversibility is a first-class requirement, the depth that matters is one
step back rather than a version history, and an edge case may inform a design
but may not drive it. In particular, the argument that a capability must be
given up *because* a detached or unmounted card is indistinguishable from a
deliberate deletion is not on its own sufficient. Failing closed on an
unexplained absence is cheap and is still expected; abandoning a capability to
buy it needs a better reason than the edge case alone.

### Where the undo lives, and where it does not

The plans divided on whether version one ships a control the player can press.
The maintainer has settled it:

> I don't want to add more complexity to the user during conflict resolution.
> The goal there is to get the user going as quickly as possible.

**Version one retains the discarded copy, on by default, bounded by a count, and
ships no undo control.** The wizard's done page says what was discarded and that
the copies are kept. Nothing in the resolution flow offers to put one back. A
plan that makes an on-device undo surface a version-one requirement is now
over-scoped, and a plan that builds lineage or receipt machinery deeper than one
step back is solving a problem the maintainer has said is not the primary case.

Restoring a discarded copy becomes a **separate tool**, tracked as its own
issue, and the maintainer has given it a shape:

> an option that allows you to essentially go back through conflict resolution
> flow and use it as a history restore flow, almost like a time machine, to
> overwrite the existing save with something from the past

That is the wizard's own compare-and-choose surface, pointed at a game's
retained past versions instead of at a live conflict, reached from outside the
moment of resolution.

**One consequence lands inside version one even though the tool does not.**
Nothing reads the discard store in version one, so nothing will catch a store
shape that a later reader cannot drive a picker from — one keyed only by a
timestamp, or one that drops which game, which slot, which device produced the
copy, and which side won. The store is designed now for a reader that does not
exist yet. Say whether each plan's retention design survives that requirement.

## What this vote is actually choosing

The reviews that fed these revisions were asked to separate the differences a
builder must **pick** between from the ones that can simply be **lifted** from
one plan into another. Read your own plan and the four injected ones with that
result in mind.

If the architecture is now shared, this vote is not choosing an architecture. It
is choosing **the document a builder is handed on Monday**, and the losing
plans' provisions travel into it rather than being discarded. Vote accordingly:
for the plan that a competent implementer could act on with the fewest
unanswered questions and the fewest places where a wrong reading produces a
silent data loss.

Concretely, prefer the plan that gives literal paths, field lists, orderings,
acceptance conditions and gate sequences over the plan that describes the same
requirement well but leaves its shape to the implementer. Do not vote for a plan
because it is longer, and do not vote against one because it is short — vote on
how much of the work is already decided in it.

## What you are voting for

The winning plan becomes the foundation the maintainer builds on. So vote for
the plan that would be **safest and most buildable if adopted as written**, not
the one that is most impressive or most thorough. Weigh, in this order:

1. **Does it protect player progress, and is a wrong outcome recoverable?** The
   cardinal rule is that no save is lost and that resolution never defaults to
   recency. A plan with an elegant architecture and one silent-overwrite path is
   worse than a plainer plan with none. Recoverable means the discarded bytes are
   retained by default and recorded richly enough for the separate restore tool
   to drive a picker from them later. It does **not** mean a control in version
   one: a plan that ships an undo surface in the resolution flow is over-scoped
   against the amendment, not ahead of it.
2. **Is it grounded?** Claims about the shipped code, EmulationStation's
   helpers, rclone's behaviour and the register's decisions should be correct,
   and hypotheses should be labelled as hypotheses with an experiment named.
3. **Is it actually implementable** by a small team on a busybox handheld,
   inside the stated budgets, against 69 rclone backends of varying capability?
4. **Does it sequence the work** so the cheap experiments that could invalidate
   a design run before the expensive building?
5. **Is it honest about what it does not know**, and about which decided rows
   it needs reopened?

## Your output

- **Name the winner** in your first line, by member short name, unambiguously.
- **Give your reasoning**, comparing the winner against the other three
  specifically. Say what the winner does better and where the others fall short.
- **Say what the winner needs** to satisfy the amendments above, if anything —
  including anything it must give up, not only anything it must add.
- **Record dissent.** Name every important primitive, finding or safeguard that
  a losing plan has and the winner does not fully absorb, by filename. This is
  how good ideas from losing plans survive into the final synthesis, so be
  thorough here even when your winner is clear.
- **Name any remaining defect in the winner** that must be fixed before it is
  built.

Refer to plans by filename (for example `kimi-revised_plan-r4.md`), never by an
invented ordinal.

## Injected revised plans

=== START gemini-revised_plan-r4.md ===

# ROCKNIX Cloud-Save Conflict Resolution: Foundational Architecture

This document specifies the end-to-end architecture for cloud-save conflict resolution in ROCKNIX. It is written to be built from. It incorporates the maintainer’s binding amendments: **reversibility is a primary use case (one step back), V1 retains discarded copies by default with a count bound, V1 ships no undo control, and the retention store must be designed now to drive a future compare-and-choose recovery tool.**

---

## 1. The Retention Store (V1 for the Future Reader)

The store retains discarded saves so a future tool can recover them. It must answer: *"show me the retained past versions of this game, newest first, with a thumbnail, the producing device, and which side won"* without scanning unrelated games, trusting mutable manifests, or relying on the rotating audit log.

**Location and Invariant:** `/storage/.cache/cloud_sync/retained/`
Like the audit log (D-CLOUD-027), this directory holds irreplaceable data. It is exempt from cache-clearing sweeps and is excluded from `backuptool` archives.

**Layout and Ordering:**
```text
retained/<system>/<unit-key>/<device-id>-<seq>/
  record.json
  <original-path-preserving payloads and .png>
```
*   `<unit-key>`: The ROM filename made path-safe, or the container label (e.g., a shared VMU).
*   `<seq>`: A persistent, monotonic per-device counter. **This is the clock-free sort key.** Directory names sort chronologically even if the device booted without a network.

**The `record.json` Contract:**
Written *before* any destructive action. It is self-contained and copies all required context inline:
*   **Identity:** `system`, `unit-key`, `resolution_id`.
*   **Completion:** `phase` (`prepared` vs `finalized`). A record stays `prepared` until the apply step finishes; interrupted applies are recovered or rolled back on next boot.
*   **Event Time:** `resolved_at` (wall clock, for UI display only).
*   **Decision:** `action` (KEEP LEFT / RIGHT / BOTH), `winner_side`, `winner_sha256`, `retained_side`.
*   **Producer Snapshot:** Copied inline from the discarded operand's manifest entry (`device.id`, `device.label`, `device.model`, `emulator`, `core`, `core_build`, `captured_at`, `clock_synced`).
*   **Members:** The complete unit map (paths relative to the retained directory, sha256, size).
*   **Preview:** The retained-relative path to the `.png`, and its hash.

**The Cloud-Loser Fetch:**
On KEEP RIGHT (device wins), the cloud loser's bytes and PNG have not yet been downloaded. The apply step **must fetch them into the local retained directory** before publishing the device's win to the cloud. The done page's promise that "copies are kept" requires the bytes to be local.

**Pruning (Count = 3):**
Pruning is bucketed logically so ES renumbering does not fragment the count. `.state.auto` is its own bucket; numbered states share a game/core bucket. Pruning evicts the oldest `<seq>` in the bucket. **Rule:** A retention sweep must never evict the only copy of an unreviewed head, and incomplete (`prepared`) operations are exempt.

---

## 2. Identity, Manifests, and Agreement

**Identity (D-CLOUD-030):** A save version is the sha256 of its stored bytes. Slot and filename are attributes. The `.png` is an associated artifact, not part of the version identity (a thumbnail anomaly with identical state bytes is not a progress fork).

**Manifests (D-CLOUD-031):** One JSON per device at `savestates/.rocknix/manifest-<device-id>.json`. Each device writes only its own.
*   **Owner vs. Producer:** The manifest *owner* is the device writing the JSON. The *producer* is recorded per-entry. If Device A resolves KEEP BOTH by installing Device B's state into a free slot, A writes the entry but records B's snapshot as the producer.
*   **Set of Claims:** The union of manifests is a *set of claims*, not a right-biased merge of maps. Two devices claiming the same path with different hashes is the definition of a conflict.
*   **Foreign Manifests:** Manifests from other devices are cached out-of-tree and never republished by this device.

**Agreement (`agreed.json`):**
Kept locally, never synced. It records the hash this device last uploaded, downloaded, or verified as equal.
*   **Sync-Context Binding:** The agreement record is bound to the `remote`, `backend`, `sync_root`, and `device_id`. If a player uses CHANGE CLOUD FOLDER or re-links their account, the context changes. The old agreement is voided, preventing a stranger folder's files from silently overwriting local saves.

---

## 3. The Classifier and Write Paths

`rclone bisync` is demoted to a candidate transport. The logic is owned by a home-built three-way classifier over complete member maps.

**The Conflict Test:**
1.  Identical hashes → write agreement, do nothing.
2.  Only cloud changed since agreement → download, no prompt.
3.  Only device changed since agreement → upload, no prompt.
4.  Both changed, or never agreed and different → **Wizard**.

**Write-Path Ownership & The Budget:**
The shipped write paths (boot, menu, game-exit) are currently newest-wins. They are replaced by this classifier.
*   **Read Before Write:** The game-exit pass *must* read cloud evidence for the changed set before uploading. It cannot blindly push.
*   **Budget Fallback:** If reading the cloud state exceeds the ~5s budget (e.g., on a hashless WebDAV backend), the script must **defer the upload** (leave the unit pending). It must *never* upload over an unread head.
*   **Capture is Unconditional:** The capture step (hashing the save and writing the local manifest) runs on game exit *even if* the exit-sync toggle is off, offline, or the lock is held. Otherwise, offline progress accrues no provenance.
*   **Zero-Spawn Idle:** If capture shows no local changes, and there are no pending uploads/resolutions, the exit script terminates without spawning rclone. However, an unsuccessful upload *must* be retried on the next exit, even if the file hasn't changed since the failure.

**Remote-Hash Verification:**
A locally computed hash describes local bytes. It cannot certify the remote. To advance agreement, the engine must prove correspondence by matching a fresh remote listing, downloading the file, or matching a native backend hash.

---

## 4. Lifecycle Gate and Merge Adapter

**The Lifecycle Gate:**
Save-tree mutations must be mutually excluded. The lock (`take_cloud_lock`) serializes cloud scripts, but ES and the emulator mutate the tree.
*   The gate must bracket the entire launch session (from before ES pre-launch work to after ES post-launch work).
*   **ES-Death Survival:** The lock file descriptor must be inherited by the emulator process (`ProcessStartInfo`). If ES crashes (SIGABRT) and restarts while the emulator is running, the boot-sync must not wake up and clobber the save tree.

**The Checked Adapter:**
ES's slot primitives (`getNextFreeSlot`, `copyToSlot`) have sharp edges. They must be wrapped by an adapter:
*   `getNextFreeSlot` returns `-99` for auto-only repositories and non-RetroArch cores. The adapter must handle this and prompt for keep-one if no slots exist.
*   `copyToSlot` returns `true` even if the filesystem copy fails. The adapter must verify the filesystem result.
*   **In-Memory Reservations:** If a user selects KEEP BOTH for five conflicts in one walkthrough, the adapter must reserve slots in memory so they don't all collide on the same "next free" slot before application begins.

**Deterministic Auto KEEP BOTH:**
`.state.auto` conflicts are common. KEEP BOTH is deterministic: the device keeps its `.state.auto` (resume point), and the cloud copy is installed into the next free numbered slot.

---

## 5. Deletion, Compaction, and Moves

**Deletion Propagation:**
Explicit local deletions must propagate. They are recorded as version-specific tombstones in the device's manifest.
*   **Unexplained Absence Fails Closed:** If a file vanishes from the cloud without a tombstone, the device *holds and reports*. It does not automatically resurrect the file, nor does it delete the local copy.
*   **Tombstone Expiry:** Tombstones expire when they fall out of the retention window, preventing unbounded manifest growth.

**Verified Compaction (D-CLOUD-030):**
ES renumbers slots on delete (e.g., slot 2 becomes slot 1). Sync sees this as delete+create.
*   **Move Inference:** Same hash at a new path is a move.
*   **Compaction:** If a sync leaves the same hash in slot 1 and slot 2, the higher slot is removed *only after* both files are re-read and hashes verified identical. This terminates renumber churn. Compaction copies are lossless and do *not* consume the retention store's count.

---

## 6. The Wizard and Presentation

**Trigger:** Unattended passes (boot, menu) that detect conflicts **queue and badge** them. The wizard opens when the user clicks the badge or explicitly requests a sync.

**The COMPLETE Gate:**
Nothing transfers until the user presses COMPLETE.
*   **Pre-Pass Re-check:** At COMPLETE, the engine must re-verify that the cloud state hasn't changed since the walkthrough began. If it has, the affected decisions are voided and re-presented.
*   **Cancellation:** Quitting the walkthrough discards the pending decisions. Completed non-conflicting transfers (which ran before the wizard opened) are *not* rolled back.

**Presentation:**
*   **Cloud is Left.**
*   **Battery Saves:** Use the floppy glyph (``). No substitute screenshots.
*   **Compatibility:** `core_build` and `device.family` drive the warning badge.

---

## 7. Execution Gates (What must be proven before shipping)

These must be executed on hardware or the GENERIC_X64 VM.

1.  **Harness Repair:** Fix `tools/cloud-round-trip`. It currently overwrites `rclone.conf` without restoring it, and asserts `ROCKNIX-backup-qa.zip` without the date prefix the uploader actually applies.
2.  **The Offline Fork Fixture:** Device A and B agree on H0. B publishes HB. A edits to HA offline. A exits game. Assert: neither candidate is overwritten. A's upload is deferred.
3.  **The Retention Reader Test:** Create retained decisions. Overwrite the producer's manifest, renumber the slots, rotate the audit log, and remove the pending apply plan. Assert: a test script can still list the game's history, newest first, and locate the PNG.
4.  **The #10 Launch Rehearsal:** `es_savestates.cfg` disables `racommands`. Assert that the ROCKNIX RetroArch launcher correctly honors the non-racommands launch path (`-state_slot N -state_file "..."`) and discovers both flat and per-core layouts.
5.  **Lifecycle ES-Death Test:** Kill ES while the emulator runs. Assert that a background sync cannot acquire the lock and mutate the tree.
6.  **The `--backup-dir` Race:** Test `copy --backup-dir` on Dropbox and WebDAV under interruption. If it fails to preserve the replaced object atomically, fallback to explicit copy-verify-delete for retirements.
7.  **#19 Bench Run:** Run the same-chipset control (H700 vs H700) before the cross-chipset matrix (H700 vs RK3566). Measure loud vs. silent failure to set the badge severity.

=== END gemini-revised_plan-r4.md ===

=== START gpt-revised_plan-r4.md ===

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

=== END gpt-revised_plan-r4.md ===

=== START kimi-revised_plan-r4.md ===

# kimi-revised_plan-r4.md

**Round-4 revised approach — the foundation for cloud-save conflict resolution in ROCKNIX (epic #11; #19–#25, #10, #9).**

This document stands alone. It is the foundation I would build, revised after reading the four injected round-4 peer reviews (`claude_peer_review-r4.md`, `gemini_peer_review-r4.md`, `gpt_peer_review-r4.md`, `mistral_peer_review-r4.md`) against the embedded corpus. Corpus citations use the declared paths under `research/council-runs/2026-09-05-conflict-resolution-foundation/_sources/`, shortened to their suffix (e.g. `repo/docs/save-manifest-schema.md`); decisions are cited by register ID. The two maintainer decisions in the brief — reversibility as one-step retention, on by default, no V1 undo control; the restore tool as a separate issue — are applied as authoritative.

One honesty note up front: the round-3 plans themselves are not embedded in this prompt — only the four reviews are. I reconstruct my own round-3 plan (`kimi-revised_plan-r3.md`) from the reviews' descriptions, which are detailed, quote it extensively, and agree with each other about its content. Where I concede or defend, I am working from that reconstruction, and I say so.

---

## 1. The foundation in twelve sentences

1. **Identity.** A save version is the sha256 of its stored bytes; slot and file name are attributes (D-CLOUD-030). A multi-file save (Dreamcast VMU folder, N64 `.eep/.mpk` pair) is a *unit* of per-file versions with a declared member map; a single-file multi-game save (PSX `.mcr`) is one entry with `kind: container`, `rom: null`.
2. **Manifest.** Each device writes only `savestates/.rocknix/manifest-<device-id>.json` (D-CLOUD-031). Readers take the union as a **set of claims, never a merge of maps** — two devices legitimately hold different hashes for one path, and that *is* the conflict. Foreign manifests are downloaded into an observation cache **outside** the synced tree and are never republished.
3. **Agreement.** A local, unsynced record (`/storage/.cache/cloud_sync/agreed.json`) holds the hash this device last verifiably uploaded or downloaded per path, **bound to a sync context** (remote name, backend type, remote root, local roots, link identity). A context change — CHANGE CLOUD FOLDER, a re-link — voids agreement; every affected path becomes "never agreed → ask," never "cloud changed → download."
4. **Capture.** At every game exit, whether or not any sync setting is on, the device hashes the save tree and records provenance for what it wrote — emulator and core as **effectively executed** (frozen at launch, after `SaveState::setupSaveState()` rewrites), core build from the image's pins file. Nothing stamps a file it did not write; `unknown` is a rendered value.
5. **Classification.** A home-built three-way classifier (local *L*, cloud *C*, agreed *A*) over complete member maps decides every unit: identical → nothing; one side changed → transfer, no prompt; both changed, or never agreed and differing → conflict. Moves are folded out first, under the qualifications in §3.3.
6. **Write paths.** Every path that can overwrite a save — boot pass, SYNC SAVE DATA row, game-exit pass — reads current cloud evidence for the changed set **before** writing. A head it cannot read, it does not overwrite: the upload is deferred and the unit stays pending. This fulfills D-CLOUD-029's replacement; it does not patch the shipped newest-wins pair (blindspot 28).
7. **Wizard.** Conflicts queue and badge; the wizard opens only after the non-conflict pre-pass has verifiably completed; no conflict resolution transfers until COMPLETE; quitting discards decisions — and completed pre-pass transfers are not rolled back (the IA rev 4 sentence is corrected to say so).
8. **Merge.** KEEP BOTH re-slots through a checked adapter over ES's primitives, with in-memory slot reservations for the whole walkthrough. On an auto-state conflict the shape is deterministic: this device keeps `.state.auto`, the cloud copy is preserved as the next free numbered slot.
9. **Retention.** The discarded copy is retained **on by default**, bounded per game/unit, as a self-contained event record under `/storage/.local/share/rocknix/cloud-saves/`; a cloud-side loser is fetched into the store **before** the remote is overwritten. Version one ships **no undo control**; the done page says what was discarded and that the copies are kept on this device.
10. **Deletion.** Explicit deletes propagate as bounded tombstones in the per-device manifest. Unexplained absence **holds and reports** — fail closed, no automatic resurrection, no deletion. Compaction and renumber retirements are verified-identical by construction and are **not** stored.
11. **Lifecycle.** A gate owned across the emulator's process lifetime — surviving an EmulationStation crash-and-restart — excludes the save tree from every sync pass while a game runs. Uploads use sealed stage copies, never live emulator files.
12. **Transport.** rclone only: scoped `--files-from` batches, transfers forced past metadata comparison, results verified against the artifact before agreement advances. `bisync` is a candidate transport the spike may promote or kill; the classifier is ours regardless.

---

## 2. What changed since `kimi-revised_plan-r3.md`

### 2.1 Conceded — refuted, with the file that refuted it

1. **The `defaultCoreDirectory` "dual scan" does not exist.** `gpt_peer_review_r4.md` §2.7 is right, against `es/SaveStateConfigFile.cpp`: `defaultCoreDirectory` *replaces* the config's directory for the default core (`copy->directory = pInfo->defaultCoreDirectory`); it does not add a second scan, and `es/SaveStateRepository.cpp` scans the selected directory non-recursively. My round-3 claim that supplying it keeps both flat and per-core layouts discoverable was wrong. Consequence: **#10 requires an ES patch, not a config file** — which is also what my own `racommands` finding already implied (the XML reader sets `racommands = false` unconditionally, retiring the `.auto`/`.bak` dance and the `-autosave` launch flags; `es/SaveState.cpp`). The #10 rehearsal (§8, gate 10) now tests launch behavior *and* both-layout discovery, expecting a patch.
2. **Equality-seeding from a foreign manifest plus size/mtime is not equality.** `gpt_peer_review-r4.md` §2.2 is right: a manifest claim describes an intended version, not the bytes currently at a mutable remote path, and the QA WebDAV offers neither hashes nor modtimes (`repo/docs/save-manifest-alignment-review.md` §1; `repo/.claude/rules/rclone-cloud-sync.md`). On a hashless backend, size/mtime can only *disprove* equality (a mismatch means known-different); a match means *unknown*, resolved by download-and-hash or by deferral. My round-3 rule permitting the seed is removed.
3. **Restoring retired bytes is a republication, not a new version.** `gpt_peer_review-r4.md` §2.5 is right under D-CLOUD-030: identity is the hash, so a restored file is the *same* version with new provenance. My round-3 text calling the restore "a new version" is corrected, and the tombstone rule gains explicit applicability/consumption semantics (§3.9).
4. **The operation-keyed retention store makes the future reader scan.** My round-3 store (`discarded/<utc>-<device-id>-<seq>/`) forced the restore tool to open every `operation.json` and filter by game. I adopt the game-addressed layout of `claude-revised_plan-r3.md` as relayed by `gemini_peer_review-r4.md` §1 and `gpt_peer_review-r4.md` §1 — while keeping my path-preserving payloads and self-contained record, which `gpt_peer_review-r4.md` §1 credits. See §4.
5. **"A window of two rename syscalls" misstates the interruption geometry.** `gpt_peer_review-r4.md` §2.3 is right: after a kill, a half-installed multi-member unit stays half-installed until recovery runs; the window is not bounded by the next syscall. Recovery restores local coherence **offline, before launch**, inspecting actual hashes (§3.6).
6. **The store does not belong in `.cache`.** `gpt-revised_plan-r3.md`'s reasoning, relayed by `gemini_peer_review-r4.md` §3 and `gpt_peer_review-r4.md` §4: the IA doc defines `/storage/.cache/` as the home of state that "persists but can be regenerated" (`repo/docs/conflict-wizard-ia.md` § Where state lives), and the retention store holds the *only* copy of user data. Moved to `/storage/.local/share/rocknix/cloud-saves/`, gated on a `backuptool` verification (§5, pick 1).
7. **"The loser's manifest entry verbatim" is not self-contained.** `gpt_peer_review-r4.md` §1 is right against `repo/docs/save-manifest-schema.md` §6: `device` is a *top-level* block, not an entry field, and the entry's `screenshot` is a remote-relative path with no hash. The record now carries the entry **plus a snapshot of the enclosing device block**, and the retained PNG's sha256 computed at retention time.
8. **Ordering by UTC directory prefix trusts the RTC.** `claude_peer_review-r4.md` §2 item 4 and `gpt_peer_review-r4.md` §1: a device that booted without a network (`clock_synced: false`, schema §6) misorders wall-clock keys. Ordering is now a persisted commit sequence; wall-clock times are display-only (§4).

### 2.2 Adopted — credited, and where it lands

| From | What | Where |
|---|---|---|
| `gpt-revised_plan-r3.md` (via `claude_peer_review-r4.md` §3.4, §5) | **Agreement bound to a sync context** — the rule `claude_peer_review-r4.md` calls "the single most valuable rule in the four plans that the other three lack" | §3.1 |
| `gpt-revised_plan-r3.md` (via `claude_peer_review-r4.md` item 18) | **Capture unconditional on the sync setting** — the ES exit call is gated on `cloudsaves.gameexit` and `!isRunning()` (`es/FileData.cpp.launchGame-excerpt-l740-850.cpp`); capture must not live inside that `if` | §3.2 |
| `gpt-revised_plan-r3.md` (via `claude_peer_review-r4.md` item 17; `gpt_peer_review-r4.md` §2.3) | **Gate ownership surviving ES death** — ES abort-and-restart is documented in `repo/.claude/rules/engineering-practices.md` | §3.5 |
| `gpt-revised_plan-r3.md` (via `claude_peer_review-r4.md` items 20–21) | **Claims-set union; foreign manifests to an out-of-tree cache** | §3.1 |
| `gpt-revised_plan-r3.md` (via `claude_peer_review-r4.md` items 2, 5) | **Commit-order pruning; game/core retention bucket** | §4 |
| `gpt-revised_plan-r3.md` (via `claude_peer_review-r4.md` item 23) | **Cancellation wording** — "completed non-conflicting transfers are not rolled back" | §3.6, IA rev 5 |
| `gpt-revised_plan-r3.md` (via `claude_peer_review-r4.md` §5) | **Bucket-remote `--backup-dir` prefix validation** — verify the retirement by listing, not exit code (blindspot 22) | §3.9 |
| `gpt_peer_review-r4.md` §2.1 | **Capture dirtiness ≠ publication dirtiness** — the idle fast path must check for unpublished versions, retained staging, and pending operations, or a failed upload is forgotten | §3.4 |
| `gpt_peer_review-r4.md` §2.2 | **Forced transfers** — exact-file uploads pair with `--ignore-times`, the shipped archive paths' own rule (`repo/.../sources/cloud_backup`, `cloud_restore`) | §3.4 |
| `gpt_peer_review-r4.md` §2.6 | **Precondition recheck at COMPLETE** — the pre-pass is a snapshot, not a reservation; agreement alone cannot detect a moved cloud head | §3.6 |
| `gpt_peer_review-r4.md` §2.7 | **Effective emulator/core frozen at launch** — `setupSaveState()` rewrites `-emulator`/`-core` (`es/SaveState.cpp`) | §3.2 |
| `gpt_peer_review-r4.md` §2.5 | **Move-inference qualifications** — same repository and kind, current bytes validated, permutations planned as a set | §3.3 |
| `claude-revised_plan-r3.md` (via `gemini_peer_review-r4.md` §1, `gpt_peer_review-r4.md` §4–5) | **Game-addressed retention discovery; sealed stage copies for upload** | §4, §3.5 |
| `gemini-revised_plan-r3.md` (via `claude_peer_review-r4.md` §5) | **The four-state apply journal sentence** — "prepared operands, local installation complete, remote publication verified, agreement committed"; **explicit cloud-loser fetch**; **the cloned-card experiment** | §3.6, §4, §8 |
| `mistral-revised_plan-r3.md` (via `claude_peer_review-r4.md` §5) | **Hook-absent degradation** — if `GuiSaveState.cpp` (not embedded) offers no clean attach point, reconciler-observed move/compaction receipts still cover D-CLOUD-030, and explicit deletes fall back to resurrection + hold-back until the hook ships | §3.9 |
| `mistral-revised_plan-r3.md` (via `gpt_peer_review-r4.md` §4) | **A thumbnail anomaly is not a progress fork when the state bytes are identical** — the PNG is excluded from version identity (schema §1) and verified/repaired independently | §3.3 |
| `claude_peer_review-r4.md` §3.6 | **The transient incremental slot-copy fixture** — under `racommands`, `setupSaveState` copies the loaded state to the next free slot mid-session (`mNewSlotFile`), admitted by `+ /**/*.state*`; a concurrent full pass would upload a phantom | §8, gate 3 |

### 2.3 Where a review misread my plan

- **`mistral_peer_review-r4.md` §3 lists "`--include`-based manifest transport" as something my plan has that should not be built.** My round-3 transport was `--files-from`, as `claude_peer_review-r4.md` item 14 and `gemini_peer_review-r4.md` §2 both record. No change needed; the record is corrected here.
- **`gemini_peer_review-r4.md` §1 calls my operation-keyed store O(N) with "severe performance issues."** Overstated: the store is count-bounded (count × units), so the scan is a few hundred small JSON files at most — `claude_peer_review-r4.md` §1.3 called the same scan "acceptable; not indexed." I adopt game-keyed discovery because it is strictly better at zero cost, not because the scan was unsafe.
- **`mistral_peer_review-r4.md` §1.1 says my store is "the only" one surviving the amendment while its own table marks `claude` and `gpt` as surviving.** Internally inconsistent; no consequence for the design.

After the integrations above, I believe **no architectural difference remains** between this revision and the integrated endpoint that `claude_peer_review-r4.md` §2 ("a builder does not have to choose between these plans; a builder has to integrate them") and `gpt_peer_review-r4.md` §3 ("nothing architectural remains") describe. What remains is a small set of policy picks, named and settled in §5.

---

## 3. The architecture, end to end

### 3.1 Identity, manifest, agreement

- **Identity** is unchanged from D-CLOUD-030: sha256 of stored bytes; slot and name are attributes; duplicates compacted only after re-reading both files and finding the hashes equal, with an audit line.
- **Manifest** is unchanged in shape from D-CLOUD-031, with four refinements (§6): the union is a **set of claims**; a bounded `retirements` list (§3.9); `kind: container` confined to single-file multi-game saves with `rom: null`, with multi-file containers expressed as **declared units** over per-file entries; and foreign manifests cached outside the synced tree.
- **Agreement** (`agreed.json`, local, unsynced — D-CLOUD-031 stands) gains a `sync_context` block: remote name, backend type, remote root (`SYNCPATH`), local roots (`BACKUPPATH`/`RESTOREPATH`), and a link fingerprint (the remote's non-secret identifying fields; exact field set is a build-time detail, the binding is the rule). On any mismatch, agreement is void and the classifier's conservative branch governs. This closes the hazard `claude_peer_review-r4.md` §3.4 traces: a re-linked folder whose differing bytes would otherwise classify as "cloud changed → download, no prompt" over the player's local progress.
- **Agreement advances only on verified equality**: after an upload, the remote head is verified against what was sealed (post-transfer listing matched to `remote_hash` where the backend hashes; download-and-hash on hashless backends); after a download, the local bytes are re-hashed. An exit code is never evidence (`repo/.claude/rules/engineering-practices.md` — verify the artifact). If verification is impossible within the operation's budget, the mutation or the agreement advance is **deferred**, not asserted.

### 3.2 Capture (#21)

- Runs at **every** game exit, independent of `cloudsaves.gameexit` and of the cloud lock — the ES call site gates the *transfer*, and capture must not inherit that gate (`es/FileData.cpp.launchGame-excerpt-l740-850.cpp`).
- Receives emulator and core **as executed**: frozen at launch after `SaveState::setupSaveState()`'s rewrites (`es/SaveState.cpp`), passed on the command line per the alignment review's "told, not discovered" constraint (`repo/docs/save-manifest-alignment-review.md` §3.3). Standalones pass their own name as `core`.
- Core build comes from `/usr/share/rocknix/core-pins`, emitted at image build (#21's existing constraint).
- Cost on the watched path: the exit capture hashes what the session could have touched. States are tens of KB and `sha256sum` is busybox-present (schema §1). Large standalone saves (PPSSPP) use an mtime+size **negative filter** — unchanged metadata means skip the re-hash — with the boot/full pass re-hashing everything as the invalidation backstop. The filter is a heuristic for *local* capture only; the classifier never treats size/mtime as equality proof for the cloud side (§2.1.2). The census (gate 5) measures the real distribution, including large states — a count is not a byte-space guarantee.

### 3.3 Classification (#22)

- Per unit, over complete member maps: *L* from the local tree, *C* from the claims-set union plus a scoped listing, *A* from the bound agreement record. The verdict table is the schema's §3 made mechanical, with disjoint-member changes inside one unit classified as **one fork**, not per-file conflicts.
- **Moves fold out first**, qualified (`gpt_peer_review-r4.md` §2.5): same hash elsewhere counts as a move only within the same game/core repository and save kind; the *current* bytes are validated, not a stale manifest claim; multiple matches and occupied destinations are handled; a renumber permutation is planned as a set, not renamed through one occupant at a time. D-CLOUD-030 does not establish "the cloud's path wins"; the re-key rule stays the schema's.
- **Thumbnail anomalies are not progress forks** when the state bytes are identical (`mistral-revised_plan-r3.md` via `gpt_peer_review-r4.md` §4); the PNG is verified and repaired as an associated artifact.
- **Never agreed and differing → ask.** A file with no entry on either side is `unknown`-both and still asks (the alignment review's #22 constraint). A Dropbox "conflicted copy" or Syncthing `.sync-conflict-` file is never offered as a version (D-CLOUD-022).
- **bisync** remains a candidate transport. The corpus contains its flags and help text, not a run (`repo/rclone-bisync-planning.md`, `issues/issue-22.md`); the spike (gate 2) decides, and the classifier is ours either way. The planning note's "newer file wins" Phase 3 stays struck (alignment review §3.1).

### 3.4 The write paths

- **Boot pass and SYNC row** route through the reconciler. The boot pass moves under ES scheduling once the network is up, replacing the `ping google.com` gate (`repo/.../autostart/102-cloud-saves`; the rule file and the alignment review both condemn it). The handoff is not embedded — orchestrator gap; the autostart shim stays a no-op until the ES side lands, and the lock prevents a double run during transition.
- **Game-exit pass**: capture (always) → changed set. Idle requires **all** of: no local changes since last capture, no captured-but-unpublished versions, no retained staging, no pending operations (`gpt_peer_review-r4.md` §2.1 — the shipped `--recent` keys its window to a *successful* backup stamp, and that retry property is preserved, not lost). Idle → zero rclone spawns. Changed → one scoped listing of the changed units' remote heads → classify → non-conflicts transfer in one `--files-from` batch, **forced** past metadata comparison (`--ignore-times`, the shipped scripts' own precedent) → conflicts queue and badge. If the head cannot be read within budget, **the upload is deferred** — never "the verification is deferred" while the upload proceeds; `claude_peer_review-r4.md` §3.3's reading of mistral's sentence is the behavior to avoid, and the futro's #22 AC (a constructed both-sides change *refused* on the exit pass) is the guard (`repo/plans/conflict-resolution/vita-style-conflict-resolution.md` §5).
- **Budget**: idle ≈ 0 added seconds; one changed save targets the measured ~7 s envelope on H700 (`repo/.claude/rules/rclone-cloud-sync.md` — ~1 s per rclone start). Gate 4 prices it. The hashless QA WebDAV is designed-for fail-closed, not sized-for; the budget is sized on Dropbox/S3 (`claude_peer_review-r4.md` §6).
- **Every caller takes `take_cloud_lock`**; rclone's exit codes are mapped into typed internal outcomes so rclone's 3/4 never collide with the scripts' reserved skip codes, and no stamp is written for work that did not run (my F3 filing; `repo/.../sources/cloud_backup`, `es/ThreadedCloudSync.cpp`).

### 3.5 The lifecycle gate

- A file descriptor held across the emulator's process lifetime — by the launch supervisor, or by a one-line wrapper if ES closes descriptors on exec (`O_CLOEXEC` is the test `gemini_peer_review-r4.md` §4 names; unmeasured, gate 3). While held, no sync pass installs into or publishes from the save tree. This closes the mid-session transients: the zombie `.state.auto.bak` and the transient incremental slot copy (`es/SaveState.cpp`; `claude_peer_review-r4.md` §3.6), both admitted by the shipped allowlist (`repo/.../sources/cloud_sync-rules.txt`).
- **Uploads use sealed stage copies** (`claude-revised_plan-r3.md` via `gpt_peer_review-r4.md` §4): the bytes hashed are the bytes uploaded, staged under a temp name matching neither ES regex (my round-3 rule), never a live file an emulator can rewrite mid-read.

### 3.6 The wizard (#23) and the apply engine (#24)

- **Queue-and-badge**: an unattended pass that finds conflicts queues them and badges the cloud row; the wizard opens from the badge or the next attended sync. IA rev 4's "a sync that reports conflicts opens the wizard" becomes IA rev 5 (council-agreed, not corpus-settled — §7).
- **Pre-pass gate** stands (futro AC): the wizard refuses to open until every cloud-only file is downloaded, and says so. **At COMPLETE, preconditions are rechecked** — local and cloud operands, the complete unit map, proposed destination slots, pending tombstones — because the pre-pass is a snapshot, not a reservation (`gpt_peer_review-r4.md` §2.6). A moved head reclassifies rather than applies.
- **Apply journal** (`gemini-revised_plan-r3.md`'s sentence, adopted): the record distinguishes *prepared operands → local installation complete → remote publication verified → agreement committed*. With `gpt_peer_review-r4.md` §2.3's correction: a phase is a checkpoint, not proof — recovery inspects actual member hashes at every phase, including when the record says `prepared`, and local coherence is restored **offline, before the next launch**. A prior decision authorizes its recorded operands, not an arbitrary future remote head.
- **Done page**: names each discarded copy per game (futro AC), states that the copies are kept on this device and how many are kept. It does **not** promise recovery — "can be recovered later" is a claim about a tool V1 does not ship, and the changelog rule is that claims are acted on (`repo/docs/cloud-sync-changelog.md`; `claude_peer_review-r4.md` §1.1).
- **Cancellation wording** (IA rev 5): "No conflict-resolution changes apply until COMPLETE. Completed non-conflicting transfers are not rolled back by canceling the walkthrough."
- **Auto pair**: presented first, labeled as the resume-point decision (schema §4); KEEP BOTH's shape is deterministic (§1.8).
- **Kid/kiosk**: pending conflicts never block non-conflict transfers; in modes that hide GAME SETTINGS (`repo/docs/es-menu-map.md`), conflicting units are held, not resolved — fail closed, no prompt surface that mode cannot reach.

### 3.7 The checked slot adapter

All ES contact goes through one adapter; nothing calls the primitives raw. The adapter owns the four source-visible traps: `getNextFreeSlot()` returns −99 for an auto-only repository and for any non-RetroArch emulator (`es/SaveStateRepository.cpp` — `isEnabled` requires `"retroarch"`; an auto state registers with `slot = -1` and the allocator's 99999→0 scan never matches it); `copyToSlot()` returns `true` regardless of the copy/rename result (`es/SaveState.cpp`); `makeStateFilename(fullPath=true)` derives the destination from the *source's* parent, so a cloud state staged in a temp directory would be "merged" into the temp directory; and the `.png` must be verified to have moved. The adapter allocates from `firstslot`, verifies every filesystem effect, derives destinations from the game's real state directory, and holds **in-memory slot reservations** so two KEEP BOTH decisions for one game in one walkthrough allocate different slots before either is installed (my round-3 rule; `gpt_peer_review-r4.md` §4 lifts it). `gpt-revised_plan-r3.md`'s ten-point contract (via `claude_peer_review-r4.md` §5) is the acceptance checklist.

### 3.8 Audit

`/storage/.cache/log/cloud_audit.log`, append-only text, rotated at 1 MiB keeping one predecessor (D-CLOUD-027 — stands; the retention store is **not** the audit log, and `claude_peer_review-r4.md` §3.7's labeling correction is taken). The audit line for a discard is written **before** the apply step deletes anything (futro AC). The audit log is support-only; the done page is what the player sees. The SQLite index question left open in #20 is closed: **no index** — all four plans agree, and the store's record contract carries what an index would.

### 3.9 Deletion, tombstones, unexplained absence

- **Explicit deletes propagate.** The per-device manifest carries a bounded `retirements` list: `{path, sha256, retired_at, seq}`. A consumer seeing a file matching a live tombstone, with no *newer* manifest entry for that (path, hash), retires its local copy and logs it. A manifest entry for the same (path, hash) **newer** than the tombstone consumes it — that is a republication with fresh provenance, not a resurrection (§2.1.3). Tombstoned deletions are applied without retention-store copies: the store's semantics stay "conflict losers," and a deliberate ES delete is already permanent today; widening the store into a trash can is scope the problem does not earn.
- **Window**: pruned when every device in the union has observed them, else after a generous bound (proposal: 64 events or 90 days — unmeasured, §7). The consequence is stated plainly: a forgotten tombstone plus a late device means the file returns as device-only and is uploaded without a prompt — non-destructive, self-correcting, at worst a later conflict the wizard shows. The window is **decoupled from the retention count** (`gpt_peer_review-r4.md` §2.5); `claude_peer_review-r4.md` §2 item 10 prefers this bounded shape over an unbounded list, and so do I (§5, pick 3).
- **Unexplained absence** (no tombstone, file gone on one side): **hold and report** — fail closed, badge, no automatic resurrection, no deletion (my round-3 rule; `gpt_peer_review-r4.md` §2.5 lifts it into every plan). Failing closed on an unexplained absence is cheap and expected, per the maintainer's amendment.
- **Remote retirement mechanism**: `--backup-dir` into a dated **sibling** of the destination (D-CLOUD-014), gated on the race fixture (gate 6); on bucket remotes the retirement is verified by listing, not exit code (blindspot 22; `repo/.claude/rules/rclone-cloud-sync.md` — `mkdir` exits 0 creating nothing).
- **Hook-absent degradation** (`mistral-revised_plan-r3.md` via `claude_peer_review-r4.md` §5): if the delete hook has no clean attach point (`GuiSaveState.cpp` is not embedded), reconciler-observed move/compaction receipts still cover D-CLOUD-030, and explicit deletes fall back to resurrection + hold-back until the hook ships.

### 3.10 #10 per-core namespacing

In the drop, last, gated on the rehearsal (gate 10). The rehearsal's questions, sharpened by §2.1.1: (1) does the non-`racommands` launch path (`-state_slot N -state_file "…"`) work on ROCKNIX's RetroArch launcher — not embedded (`setsettings.sh`, the launch wrapper, the shipped `retroarch.cfg` are gaps); (2) does an ES patch scanning both the flat and per-core directories preserve discovery of existing states; (3) does losing the `.auto`/`.bak` dance change observable behavior (gate 3's reproducer answers). Expect an ES patch, not a config file. D-CLOUD-017 stands; the implementation path is what changed.

---

## 4. The retention store, specified for its future reader

The maintainer's requirement: nothing reads this store in V1, so nothing will catch a shape a later reader cannot drive a picker from. The reader's query is: *"show me the retained past versions of this game, newest first, with a thumbnail, the producing device, and which side won."*

**Root:** `/storage/.local/share/rocknix/cloud-saves/` (§5, pick 1).

**Layout:**

```
discarded/<system>/<unit-key>/<seq>-<device-id>/
    record.json
    <each retained member at its original sync-root-relative path, recreated beneath this directory>
pending/<operation-id>/…        # transient apply journal; removed on finalize
```

- `<unit-key>`: for states, `<rom-stem>+<core>`; for in-game saves, `<rom-stem>`; for shared containers, `container:<label>`. Encoded unambiguously — percent-encode every byte outside `[A-Za-z0-9._-]` — with the raw `system`/`rom`/`core` recorded in `record.json` (`gpt_peer_review-r4.md` §1: no lossy slug).
- `<seq>`: a persisted local counter, zero-padded, incremented under the cloud lock, seeded above the maximum found on disk. **Commit order, RTC-independent** (`gpt-revised_plan-r3.md` via `claude_peer_review-r4.md` item 4). `<device-id>` disambiguates an imported store.

**`record.json`** (schema 1): `record_id`, `seq`, resolving `device_id`; `resolved_at` (UTC), `resolved_at_local` (with offset), `clock_synced` of the resolving device — display fields, never ordering; `system`, `rom` (null for shared containers), `unit_key`, `kind`, `slot`; `decision` (`keep-left`|`keep-right`|`keep-both`); `winner` {side, sha256, paths, producer snapshot or null}; `loser` {side, **producer snapshot = manifest entry verbatim plus the enclosing top-level `device` block** (§2.1.7), `members`: [{original sync-root-relative path, sha256, size, retained-relative location}], `screenshot`: {retained-relative path, sha256 computed at retention} | null}; `reason`: `conflict-loser` (**only** — compaction and renumber retirements are not stored; verified-identical bytes survive at the retained slot, my round-3 rule, which `claude_peer_review-r4.md` §1.4 confirms against D-CLOUD-030 and lifts into mistral); `state`: `prepared` → `finalized`, finalized before the pending record is removed (`gpt_peer_review-r4.md` §1 — presence of the record must not be the only evidence the discard happened); `sync_context`; `run_id`.

**Cloud loser on KEEP RIGHT:** the wizard never needed the cloud side's bytes to display (schema §6's `screenshot` rationale), so the apply step fetches the loser's bytes and PNG into the event directory — one scoped copy, tens of KB — **before** the remote is overwritten. The remote `--backup-dir` sibling is a second copy, not the store. (My round-3 text was ambiguous here; `claude_peer_review-r4.md` §1.3's fix sentence is adopted verbatim in effect, crediting `gemini-revised_plan-r3.md`'s explicit statement.)

**Pruning:** per `unit_key` bucket, keep the N newest **finalized** records by `seq`; N = 3 as a product proposal, set by the census (gate 5) — the maintainer said "bounded by a count," not three (§7). `prepared` records are never pruned. Pruning removes whole event directories; it counts coherent retained candidates, not member files (`gpt_peer_review-r4.md` §1).

**Reader walkthrough:** open `discarded/<system>/<unit-key>/`; list event dirs; sort by `<seq>` descending; read each `record.json`; render the retained panel from the record alone — thumbnail from the retained PNG, device + model from the producer snapshot, local time and clock warning from `resolved_at_local`/`clock_synced`, the winning side from `decision`. No manifest, no audit log, no pending record, no scan of other games.

**The reader test** (my round-3 acceptance test, which `claude_peer_review-r4.md` §1.3 says to lift into every plan; extended per `gpt_peer_review-r4.md` §5): create retained decisions for several games, a complete multi-file unit, a repeated hash, and a renumbered state; then overwrite the producer's manifest entry, rotate the audit log, remove the pending records, and set the clock backward. A test-only reader must still produce the per-game list, correctly ordered, and open the right bytes and PNG. This is a **schema gate**, not a V1 user control.

**The separate restore tool** (its own issue, the maintainer's shape): the wizard's compare-and-choose surface pointed at a game's retained versions — PAST versus NOW, where NOW is read from the live tree. This store drives it without modification.

---

## 5. The picks — where a builder must choose, and what I choose

1. **Store home: `/storage/.local/share/rocknix/cloud-saves/`.** The store holds the only copy of user data; `.cache` is the documented home of regenerable state (`repo/docs/conflict-wizard-ia.md`), and a future cache convention is not worth the convenience. *Gate:* verify against `backuptool` (not embedded) that `.local` is neither archived nor wiped — the alignment review verified only that `.cache` and `/storage/roms` escape the archive (`repo/docs/save-manifest-alignment-review.md` §1). If `.local` fails, fall back to `/storage/.cache/cloud_sync/discarded/` with an explicit no-invalidate marker and a register note. Either way the invariant — *not a cache, not archived* — is enforced and tested. (Changes my round-3; credits `gpt-revised_plan-r3.md`.)
2. **Store keying: game-keyed event directories.** The future reader's query is per-game; operation-keying forces a bounded but unnecessary scan; game-keying costs nothing. (Changes my round-3; credits `claude-revised_plan-r3.md`. My payload layout and record content survive.)
3. **Tombstone lifetime: bounded window, decoupled from the retention count, resurrection consequence stated.** An unbounded list is churn on every exit upload for devices that never return (`claude_peer_review-r4.md` §6); resurrection is non-destructive and self-correcting. `claude_peer_review-r4.md` §2 item 10 prefers this shape; `gpt_peer_review-r4.md` §2.5's decoupling is incorporated.
4. **Manifest transport: one spawn, `--files-from`, payload and manifest together.** The safety lives in the reader's coherence check — a manifest entry whose payload is absent or hash-mismatched is a torn unit, and torn units defer harmlessly — not in ordering (`claude_peer_review-r4.md` item 14; `gemini_peer_review-r4.md` §3). A mandatory manifest-last second spawn costs ~1 s on the watched path to buy a commit point no reader needs. Ordering remains an optional, measured optimization.
5. **No protected-publication protocol in V1, whatever the race fixture shows.** If `--backup-dir` cannot preserve an intervening head, the response is to narrow operation — fail closed, queue, warn-and-refuse same-ID — not to change the remote representation. The maintainer's amendment: edge cases inform, not drive; one player, never concurrent, is the stated model (`00-problem-statement.md`), with the audit log as the tripwire. (Against `gemini-revised_plan-r3.md`'s conditional requirement; with `gpt_peer_review-r4.md` §3 — "the experiment has not earned that fork yet.")
6. **Retention count: propose 3 per unit bucket; the census sets it.** Marked council-agreed, not corpus-settled.

---

## 6. Decision-register changes

- **New row refining D-CLOUD-031** (the schema row): the union is a set of claims, not a merge of maps; a bounded `retirements` list is added to the per-device manifest, with the consumption rule of §3.9; `kind: container` is confined to single-file multi-game saves (`rom: null`), multi-file containers are declared units over per-file entries; foreign manifests are cached outside the synced tree and never republished; `agreed.json` gains the `sync_context` binding.
- **New row refining D-CLOUD-028** (the exit-sync row): the changed set is computed by capture-hash comparison rather than `--max-age`; the retry property is preserved by keying publication state, not just capture state; the exit pass reads cloud evidence before overwriting and defers the upload when it cannot.
- **New small row**: the retention store's location, shape, count, and the done-page sentence — recording the maintainer's amendment where a builder will find it.
- **Unchanged, cited, fulfilled**: D-CLOUD-030 (identity; the republication clarification is schema-doc wording, not a row change); D-CLOUD-029 (write paths stay shipped until #22 replaces them — this plan is that replacement); D-CLOUD-027 (audit log); D-CLOUD-017 (per-core namespacing; the implementation path becomes an ES patch, rehearsal-gated); D-CLOUD-022 (conflicted copies never offered, never carried); D-CLOUD-024/025 (wizard in this drop; #19 before the badge).
- **IA rev 5**: queue-and-badge; the cancellation sentence; the done-page sentence; the deterministic auto KEEP BOTH; the store's reader test as a schema gate.

---

## 7. What the corpus settles vs what the council merely agrees on

**Corpus-settled:** identity and compaction (D-CLOUD-030); manifest shape (D-CLOUD-031); the shipped write paths are newest-wins (`repo/.../autostart/102-cloud-saves`, `repo/.../sources/cloud_backup`, blindspot 28); the ES primitive behaviors (§3.7's four traps; renumber-on-delete; the `racommands` retirement); no `es_savestates.cfg` ships; the allowlist's actual behavior (fixture-tested in the futro); `--include` precedence; rclone 1.75.0 present with bisync flags; the budget numbers; the QA WebDAV has neither hashes nor modtimes; `cloud_device_id`/`--label`; lock exit 3, no-route exit 4; kid/kiosk hides GAME SETTINGS; ES knows emulator/core at exit (`es/FileData.cpp.getCore-excerpt-l1470-1560.cpp`); thumbnails on, compression on; `.cache` and `/storage/roms` not archived; sqlite present (and rejected).

**Council-agreed, not corpus-settled — each with its gate:** bisync's demotion (gate 2); queue-and-badge (IA rev 4 says the wizard opens on report; the change is a design call); retention count 3 (gate 5); boot sync under ES scheduling (the handoff is not embedded); the lifecycle gate's fd-inheritance ownership (the `O_CLOEXEC` test, gate 3); tombstones in the manifest (a schema change; consumer cost unmeasured); `--files-from` composition with `--no-traverse`/`--backup-dir` on 1.75.0 (gate 6); `--backup-dir` preserving an intervening head under a race (gate 6); 480×320 recognisability (gate 9); `--ignore-times` forcing exact-file transfers in this composition (shipped precedent, untested here); the capture negative-filter plus full-pass rescan sufficing (gates 3, 5); the store home surviving `backuptool` (pick 1's verification).

---

## 8. What must be proven on hardware, in order

0. **Repair the harness** (my F4: as embedded, `repo/tools/cloud-round-trip` overwrites `rclone.conf` before asserting the first remote and never restores it; its archive-name expectations mismatch the dated uploader; its tar.gz glob matches no fixture — against `repo/.../sources/cloud_backup`, `cloud_restore`). Run the pure classifier fixtures on disposable GENERIC_X64 storage, WebDAV **and** MinIO. Never point the unrepaired harness at a configured device.
1. **#19 bench** (`repo/docs/savestate-compat-test.md`): same-chipset control (H700 ×2) → cross-chipset → loud/silent, all on one build. Gates the badge's severity (D-CLOUD-025).
2. **bisync spike**: loopback WebDAV dry-run, then Dropbox from the RG35XX SP; record `--conflict-resolve none` output shape; confirm `--recover`/`--resilient` avoid `--resync`; decide bisync's transport candidacy.
3. **Zombie-auto + transient-slot reproducer** on H700: launch from a numbered slot with incremental states on, run a full pass mid-session, inspect what reached the remote; kill ES with the emulator alive and verify the gate holds (the `O_CLOEXEC` test).
4. **Exit-pass evidence-read cost** on H700: spawns, round trips, seconds, idle and one-save-changed.
5. **Shadow census** on the maintainer's library: conflict frequency, auto-state share, unit sizes including large standalone states — sets the retention count and the capture filter's real cost.
6. **`--backup-dir` race fixture** on Dropbox and WebDAV, plus bucket-prefix validation on MinIO.
7. **Deletion/compaction/republication convergence**: delete a numbered state, renumber, sync repeatedly — remaining versions survive exactly once; restore previously retired identical bytes and verify an old tombstone cannot silently remove the restored choice.
8. **Retention reader test** (§4) — the schema gate.
9. **480×320 recognition** on the RG351M: `tools/vm-visual-qa` frames at both sizes; recognition, not merely fit.
10. **#10 rehearsal** on H700 (§3.10's three questions).
11. **Cloned-card experiment** (`gemini-revised_plan-r3.md` via `claude_peer_review-r4.md` §5): two live devices sharing one `cloud_device_id`; verify warn-and-refuse.
12. **Sequential two-device offline fork** (the capstone): agree H0; device B publishes HB; device A edits HA offline; exit on A — no boot, exit, menu, hub, or direct path overwrites either candidate before a decision; then a failed upload followed by an unchanged exit must retry.

Ship when the gates pass.

---

## 9. What is not built

No V1 undo control (the maintainer's decision). No Spawn A as a prerequisite — a locally computed backend-native hash cannot certify the remote (`claude_peer_review-r4.md` §3.2). No mandatory manifest-last second spawn. No compaction copies in the store. No raw ES primitives. No "can be recovered later" on the done page. No unbounded tombstone list. No SQLite index — #20's open question is closed. No cross-device resolution receipts (`resolves`), vector clocks, or generation counters beyond same-ID warn-and-refuse. No daemon, no full remote staging mirror, no semantic binary merging, no 99-slot cap, no automatic `--resync`. No size/mtime precheck that skips hashing indefinitely. No sizing the budget on the hashless backend. No protected publication in V1 (§5, pick 5).

**Load-bearing** (get these wrong and the milestone is unsafe): identity, the bound agreement record, the classifier, the write-path evidence read, the retention record contract, the lifecycle gate, the checked adapter, the apply journal. **Optional or later:** #10's namespacing (gated, last), the badge's severity (after #19), bisync's promotion (after the spike), #25 snapshots (V2, unblocked by §3.9's sibling mechanism and the schema's §8), the restore tool itself (separate issue; its store ships now).

---

## 10. Gaps for the orchestrator

Depended on and not embedded: `GuiSaveState.cpp` (the delete hook's attach point); `SaveState.h`/`SaveStateRepository.h` (default arguments); `Paths.cpp` and the filesystem copy/rename utilities (timestamp behavior); `setsettings.sh`, the shipped `retroarch.cfg`, and the RetroArch launch wrapper (whether `-state_file` is honored decides gate 10); `backuptool`, `cloud_sync.conf.defaults`, `cloud_sync-rules.txt.defaults`, `cloud_setup`, `tools/cloud-test-backend` (pick 1's verification; harness repair); rclone 1.75.0 documentation or source for `--files-from`, `--backup-dir`, and filter ordering; ES startup ordering relative to network readiness and the `102-cloud-saves` handoff; the current issue bodies (the embedded issue files are predominantly comment threads). The round-2 and round-3 plans, including my own `kimi-revised_plan-r3.md`, are not embedded; §2's concessions and defenses are reconstructed from the four reviews' mutually consistent accounts, not from the plan text.

---

## `corpus.provenance.json`

```json
{
  "artifact": "kimi-revised_plan-r4.md",
  "role": "council member, round-4 revised approach",
  "corpus_mode": "verbatim embedded read-at-time corpus supplied by Council Facilitator council-facilitator@1.2.0",
  "source_count": 42,
  "manifest_read_timestamp_utc_as_supplied": "2026-09-05T17:32:51Z",
  "member_filesystem_access": false,
  "member_independently_reread_files": false,
  "member_independently_rehashed_files": false,
  "member_executed_commands_or_hardware_tests": false,
  "hash_basis": "sha256 values copied from the supplied per-source headers; verified at embed time by the Facilitator, not recomputed by this member",
  "own_prior_revision_embedded": false,
  "own_prior_revision_basis": "kimi-revised_plan-r3.md is not embedded; its content is reconstructed from the four injected reviews' mutually consistent accounts",
  "reviewed_artifacts": [
    "claude_peer_review-r4.md",
    "gemini_peer_review-r4.md",
    "gpt_peer_review-r4.md",
    "mistral_peer_review-r4.md"
  ],
  "reviewed_artifact_hashes_provided": false,
  "maintainer_amendments": {
    "source": "orchestrator brief embedded in this prompt",
    "separate_declared_path": null,
    "sha256": null,
    "applied_as_authoritative": true
  },
  "peer_material_use": "Judged on merits against the embedded corpus and the maintainer's two decisions; not treated as evidence about councils, models, or this deliberation",
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
      "material": "GuiSaveState.cpp, SaveState.h, SaveStateRepository.h, Paths.cpp, and the filesystem copy/rename utility implementations",
      "reason": "The explicit-delete hook's attach point, default arguments for makeStateFilename/copyToSlot, and copy timestamp behavior are not inspectable from the embedded excerpts",
      "declared_source_path": null,
      "sha256": null
    },
    {
      "material": "setsettings.sh, the shipped retroarch.cfg, and the RetroArch launch wrapper",
      "reason": "Whether the launcher honors -state_file (the non-racommands path ES emits under an es_savestates.cfg) decides gate 10; savestate_directory and savestate_auto_save are not embedded",
      "declared_source_path": null,
      "sha256": null
    },
    {
      "material": "backuptool, cloud_sync.conf.defaults, cloud_sync-rules.txt.defaults, cloud_setup, tools/cloud-test-backend",
      "reason": "Pick 1's store-home verification and the harness repair cannot be checked from the embedded callers",
      "declared_source_path": null,
      "sha256": null
    },
    {
      "material": "rclone 1.75.0 documentation or source for bisync, --files-from, copy --backup-dir, and filter ordering",
      "reason": "Transport and preservation claims rest on behavior the corpus does not contain",
      "declared_source_path": null,
      "sha256": null
    },
    {
      "material": "ES startup ordering relative to network readiness and the autostart/102-cloud-saves handoff",
      "reason": "The boot pass moves under ES scheduling; the corpus does not show when ES is up or how the autostart script would hand off",
      "declared_source_path": null,
      "sha256": null
    },
    {
      "material": "Current issue bodies for #9, #10, #20–#25, #35, #37",
      "reason": "The embedded issue files are predominantly comment threads; body edits reported by the futro are not independently present",
      "declared_source_path": null,
      "sha256": null
    },
    {
      "material": "The round-2 and round-3 revised plans, including kimi-revised_plan-r3.md",
      "reason": "Not embedded; section 2's concessions and defenses are reconstructed from the four reviews' accounts, not from the plan text",
      "declared_source_path": null,
      "sha256": null
    }
  ],
  "missing_source_policy": "No missing source paths, hashes, file contents, or execution results have been fabricated"
}
```

=== END kimi-revised_plan-r4.md ===

=== START mistral-revised_plan-r4.md ===

I'll produce a revised approach that integrates the strongest elements from all four plans, corrects the identified gaps, and aligns with the maintainer's amendments. This will be a buildable foundation for the conflict-resolution milestone.

---

# Revised Approach: Cloud-Save Conflict Resolution Foundation

## 1. Architecture Summary

**Core components:**
- Content identity via sha256 of stored bytes (D-CLOUD-030)
- Per-device manifests at `savestates/.rocknix/manifest-<device-id>.json` (D-CLOUD-031)
- Local unsynced agreement record at `/storage/.local/share/rocknix/cloud-saves/agreed.json`
- Application-owned three-way classifier with rclone transport
- Lifecycle gate with session-lifetime exclusion
- Checked adapter over ES slot primitives
- Retention store at `/storage/.local/share/rocknix/cloud-saves/retained/`
- Queue-and-badge for unattended passes
- Deterministic KEEP BOTH for auto states
- Retention ON by default, count-bounded (3 per unit)
- Version-specific tombstones for explicit deletes
- Cloud-side compaction to end renumber loop
- `--backup-dir` as remote retirement mechanism

## 2. Identity and Manifest Schema (D-CLOUD-031 refinement)

### 2.1 Identity
- **sha256 of stored bytes** is the version identity (D-CLOUD-030)
- Slot number and file name are attributes, not identity
- Thumbnail is not part of identity (`.png` travels with state by path)

### 2.2 Manifest Fields
```json
{
  "schema": 1,
  "device": {
    "id": "ROCKNIX-ee5013fc56",
    "label": "Anbernic-RG35XX-SP",
    "model": "Anbernic RG35XX SP",
    "family": "H700",
    "os_version": "20260905"
  },
  "generated_at": "2026-09-05T15:37:28Z",
  "entries": {
    "savestates/gba/Mega Man & Bass (USA).state1": {
      "kind": "state",
      "sha256": "64-hex-digest",
      "size": 50816,
      "mtime": "2025-07-29T05:09:49Z",
      "captured_at": "2025-07-29T05:09:50Z",
      "captured_local": "2025-07-29T01:09:50-04:00",
      "clock_synced": true,
      "system": "gba",
      "rom": "Mega Man & Bass (USA).gba",
      "emulator": "retroarch",
      "core": "mgba",
      "core_build": "e31759b24e7",
      "core_display_version": "0.11-dev",
      "slot": 1,
      "screenshot": "savestates/gba/Mega Man & Bass (USA).state1.png",
      "replaces": null,
      "remote_hash": {"type": "dropbox", "value": "..."},
      "producer": {  // NEW: inline producer snapshot
        "device": {
          "id": "ROCKNIX-ee5013fc56",
          "label": "Anbernic-RG35XX-SP",
          "model": "Anbernic RG35XX SP",
          "family": "H700"
        },
        "emulator": "retroarch",
        "core": "mgba",
        "core_build": "e31759b24e7",
        "captured_at": "2025-07-29T05:09:50Z",
        "captured_local": "2025-07-29T01:09:50-04:00",
        "clock_synced": true
      }
    }
  }
}
```

**Key refinements:**
1. **Inline producer snapshot** (from gpt-revised_plan-r3.md §4.2) - preserves provenance when the producer's manifest entry is overwritten
2. **Explicit unknowns** - all fields can be `null` or `"unknown"` (from gpt-revised_plan-r3.md §4.2)
3. **Content locator** - `rom` field for container units (from gpt-revised_plan-r3.md §8.3)

## 3. Agreement Record

```json
{
  "schema": 1,
  "sync_context": {  // NEW: from gpt-revised_plan-r3.md §4.4
    "remote": "dropbox:",
    "backend": "dropbox",
    "sync_root": "/ROCKNIX/Saves",
    "local_roots": ["/storage/roms"],
    "link_identity": "ROCKNIX-ee5013fc56"
  },
  "entries": {
    "gba/Advance Wars (USA) (Rev 1).srm": {
      "sha256": "64-hex-digest",
      "remote_hash": {"type": "dropbox", "value": "..."},
      "at": "2026-09-05T15:40:02Z",
      "direction": "up",
      "verified": true  // NEW: from claude-revised_plan-r3.md §3.3.3
    }
  }
}
```

**Key refinements:**
1. **Sync context binding** (from gpt-revised_plan-r3.md §4.4) - prevents cross-account overwrites
2. **Verification flag** (from claude-revised_plan-r3.md §3.3.3) - tracks whether content was verified

## 4. Conflict Detection

### 4.1 Three-Way Classifier
Per path, with L = local hash, C = cloud hash, A = agreed hash:

| L vs C | A known? | L vs A | C vs A | Verdict | Action |
|--------|----------|--------|--------|---------|--------|
| equal  | -        | -      | -      | identical | nothing |
| differ | yes      | equal  | differ | cloud changed | download, no prompt |
| differ | yes      | differ | equal  | device changed | upload, no prompt |
| differ | yes      | differ | differ | **divergent** | wizard |
| differ | no       | -      | -      | **divergent** (never agreed) | wizard |
| only one side | - | - | - | one-way | transfer, no prompt |

**Key refinements:**
1. **Equality bootstrap** - write agreement on verified equality (from all plans)
2. **Move detection** - same hash under new path = move (no conflict)
3. **Never agreed = ask** - conservative branch (from all plans)

### 4.2 Special Cases
- **Auto states** - most common conflict; wizard treats as "resume point" decision
- **In-game saves** - no lineage inside session; final state only
- **Unknown files** - identity but no provenance; conflict test still works
- **Container units** - multi-file saves (PSX memcards, Dreamcast VMU) handled as units

## 5. Write Path Ownership

### 5.1 Lifecycle Gate
**Contract (from claude-revised_plan-r3.md §3.3):**
1. Exclude save-tree mutation throughout game session
2. Preserve exclusion if ES dies before emulator exits
3. Upload sealed copies, not live emulator files
4. Recover incomplete local installation before next launch

**Implementation:**
- `flock` on `/var/run/cloud_sync.lock` inherited by emulator child
- ES wrapper ensures fd survives ES death (from gpt-revised_plan-r3.md §3.2)
- Staging directory for upload copies
- Recovery inspects actual hashes, not phase labels

### 5.2 Exit Path Budget
**Policy (from gpt-revised_plan-r3.md §4.3):**
- **0 spawn idle path:** when nothing changed and no pending work
- **3-4 spawn changed path:** when changes detected
  - 1: compute local hashes
  - 2: verify cloud state (hashless backend may need download)
  - 3: upload changed files
  - 4: (if needed) upload manifest

**Verification rules:**
- Always verify content before overwriting (from all plans)
- Defer unverifiable uploads to next full pass (from gpt-revised_plan-r3.md §4.3)
- Never upload over an unread head (from gpt-revised_plan-r3.md §4.3)

## 6. Retention Store

### 6.1 Layout
```
/storage/.local/share/rocknix/cloud-saves/retained/
  <system>/
    <unit-key>/
      <device-id>-<seq>/
        record.json
        <member-files...>
```

**Key refinements:**
1. **Game-addressed discovery** (from claude-revised_plan-r3.md §3.9.1)
2. **Clock-free ordering** (from claude-revised_plan-r3.md §3.9.1)
3. **Complete units** (from gpt-revised_plan-r3.md §8.3)
4. **Non-disposable home** (from gpt-revised_plan-r3.md §8.2)

### 6.2 Record Schema
```json
{
  "resolution_id": "20260905-ROCKNIX-ee5013fc56-00042",
  "system": "gba",
  "rom": "Mega Man & Bass (USA).gba",
  "unit": {  // from claude-revised_plan-r3.md §3.9.1
    "kind": "state",
    "members": [
      {
        "path": "savestates/gba/Mega Man & Bass (USA).state1",
        "sha256": "64-hex-digest",
        "size": 50816,
        "slot": 1,
        "screenshot": {
          "path": "savestates/gba/Mega Man & Bass (USA).state1.png",
          "sha256": "64-hex-digest",
          "retained": true
        }
      }
    ]
  },
  "producer": {  // from gpt-revised_plan-r3.md §8.3
    "device": {
      "id": "ROCKNIX-ee5013fc56",
      "label": "Anbernic-RG35XX-SP",
      "model": "Anbernic RG35XX SP",
      "family": "H700"
    },
    "emulator": "retroarch",
    "core": "mgba",
    "core_build": "e31759b24e7",
    "captured_at": "2025-07-29T05:09:50Z",
    "captured_local": "2025-07-29T01:09:50-04:00",
    "clock_synced": true
  },
  "decision": {  // from gpt-revised_plan-r3.md §8.3
    "action": "keep_right",
    "winner": {
      "side": "device",
      "path": "savestates/gba/Mega Man & Bass (USA).state1",
      "sha256": "64-hex-digest",
      "device": {
        "id": "ROCKNIX-ee5013fc56",
        "label": "Anbernic-RG35XX-SP"
      }
    },
    "retained_side": "cloud",
    "original_path": "savestates/gba/Mega Man & Bass (USA).state2"
  },
  "resolved_at": "2026-09-05T16:22:10Z",  // from gemini-revised_plan-r3.md §2.1
  "phase": "finalized",  // from gpt-revised_plan-r3.md §8.3
  "reason": "conflict_loser"  // from mistral-revised_plan-r3.md §6.1
}
```

### 6.3 Pruning Policy
- **Count = 3 per unit** (auto states own bucket; numbered states share game/core bucket)
- **Exemptions:** pending operations, incomplete transactions
- **Rule:** "A retention sweep must never evict the only copy of an unreviewed head" (from gemini-revised_plan-r3.md §2.2)

## 7. Deletion and Retirement

### 7.1 Explicit Deletes
- **Tombstone channel:** bounded list in per-device manifest (from claude-revised_plan-r3.md §3.9.2)
- **Transport:** `--backup-dir` to dated sibling (from all plans)
- **Verification:** copy-verify-delete (from D-CLOUD-026)

### 7.2 Unexplained Absence
- **Policy:** hold and report (from kimi-revised_plan-r3.md §3.8)
- **Implementation:** tombstone with `reason: "unexplained_absence"`

## 8. Merge Adapter

**Contract (from gpt-revised_plan-r3.md §7.4):**
1. Handle `-99` for auto-only repositories
2. Validate `copyToSlot` results (returns `true` regardless of filesystem success)
3. Derive destination from staging directory, not source parent
4. Reserve slots in memory for multiple KEEP BOTH in one walkthrough
5. Handle parent-derived destination paths
6. Verify PNG moves with state
7. Handle standalone emulator paths
8. Preserve unknown provenance
9. Handle container units
10. Verify all member files exist before installation

## 9. Transport and Verification

### 9.1 Remote Hash Bridge
**Rules (from gpt-revised_plan-r3.md §6.1):**
1. For new uploads: verify native hash against local payload before recording
2. For existing mappings: verify native hash against sealed local payload
3. For hashless backends: download and verify sha256 before advancing agreement
4. Always use `--ignore-times` for decided transfers

### 9.2 Manifest Publication
**Policy (from gpt-revised_plan-r3.md §6.3):**
- Manifest is observation, not commit
- Ordering: payload before manifest (measured option)
- Safety: readers verify member maps, not publication order

## 10. Wizard Flow

### 10.1 Trigger
- **Primary:** sync that reports conflicts (IA rev 4)
- **Unattended:** queue and badge (from all plans)

### 10.2 Special Cases
- **Auto states:** deterministic KEEP BOTH (device keeps `.state.auto`, cloud copy takes numbered slot)
- **In-game saves:** KEEP BOTH disabled (dimmed with reason)
- **Containers:** show as single unit with glyph

### 10.3 Done Page
```
3 CONFLICTS RESOLVED
Mega Man & Bass · GBA · Savestate

KEPT:
  Cloud: 1
  Device: 2

DISCARDED (kept on this device):
  Cloud: Mega Man & Bass (USA).state2
  Device: Mega Man & Bass (USA).state3

[ COMPLETE ]
```

## 11. Migration and Compatibility

### 11.1 Upgrade Path
- Read both shapes, write new one (from upgrade-and-install.md)
- Agreement bootstrap: write on verified equality
- Retention store: survives upgrade (test required)

### 11.2 Downgrade Safety
- **Not guaranteed** - old scripts overwrite by recency
- **Inventory:** all active write paths (boot, exit, menu, Tools, #37)

## 12. Testing Requirements

### 12.1 Priority Fixtures
1. **Harness repair** (from gpt-revised_plan-r3.md §10.3):
   - Fix `rclone.conf` overwrite
   - Match archive naming conventions
   - Restore all config values

2. **Offline fork and retry:**
   - Agree H0
   - Publish HB from second device
   - Edit HA offline
   - Exit - must not overwrite either candidate

3. **Retention reader test:**
   - Create retained decisions for multiple games
   - Overwrite producer manifests
   - Rotate audit log
   - Remove pending records
   - Verify reader produces correct per-game list

4. **Lifecycle exclusion:**
   - Boot overlap
   - ES death with emulator alive
   - Interruption between file effects and checkpoints
   - Verify recovery restores local coherence offline

5. **Changed path budget:**
   - Record process starts, remote requests, transferred bytes, elapsed time
   - Include pending-work retries and hashless verification

### 12.2 Hardware Gates
1. **#19 compatibility:** same-chipset control before cross-chipset
2. **#10 namespace:** preserve launch behavior, discover both layouts
3. **480×320 recognition:** verify at smallest panel

## 13. Register Amendments

**D-CLOUD-031-A (refines D-CLOUD-031):**
- Manifest carries inline producer snapshot
- Agreement record binds to sync context
- Retention store at `/storage/.local/share/rocknix/cloud-saves/retained/`

**D-CLOUD-029-A (refines D-CLOUD-029):**
- All write paths read cloud evidence before overwrite
- Exit path defers unverifiable uploads
- Lifecycle gate survives ES death

**D-CLOUD-027-A (refines D-CLOUD-027):**
- Retention store is not a cache and is not archived
- Audit log rotation does not affect retention

## 14. Not To Build

- V1 undo control (maintainer settled)
- Deep ancestry or cross-device resolution machinery
- Second production agreement authority
- Single-spawn target that weakens verification
- Extra local hash spawn as prerequisite
- Timestamp-ordered retention store
- Per-path discard store
- SQLite index
- Kid-mode resolver
- Automatic `--resync`
- 99-slot cap
- Daemon

---

This approach integrates the strongest elements from all four plans while correcting the identified gaps. It provides a buildable foundation that preserves player progress, empowers conflict choices, and enables one-step recovery - exactly what the maintainer asked for.

=== END mistral-revised_plan-r4.md ===
