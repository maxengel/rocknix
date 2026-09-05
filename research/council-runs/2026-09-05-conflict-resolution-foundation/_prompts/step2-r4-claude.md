# Council — round 4, peer review of the revised approaches

You are one of five council members. Each of you has produced a revised
approach to the foundation for cloud-save conflict resolution in ROCKNIX. The
corpus is embedded above, unchanged and hash-verified; the other four members'
current revised approaches are injected below.

Review them. You are not revising your own plan in this step and you are not
voting.

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

## Two questions this round must answer concretely

The plans have converged on the architecture. What is left divides into
differences a builder would have to *choose* between and differences that could
simply be *lifted* from one plan into another. Separating those two is the main
job of this round, and the following two questions are where the separation is
hardest.

**1. Walk the restore tool through each plan's retention store.** For every
plan, state literally what a later reader does to answer "show me the retained
past versions of *this game*, newest first, with a thumbnail, the producing
device, and which side won" — the path it opens, what it must read, and what it
must scan that it does not need. Say whether every field that question needs is
present at the moment of the discard, or whether the reader would have to
consult a manifest, an audit log or an apply record that the plan itself says
may be overwritten, rotated or removed by then. Do not accept a plan's own
assurance that its store is sufficient; trace it.

**2. Sort every remaining difference into liftable or architectural.** A
*liftable* difference is a rule, a field, a path shape or an ordering that could
be moved from one plan into another without disturbing anything else — say
which direction it should move. An *architectural* difference is one where
taking both is incoherent and a builder has to pick. Be strict: most
disagreements at this stage are liftable, and calling one architectural when it
is not is how a decision gets made by argument that should have been made by
integration. If you conclude that nothing architectural remains between two
plans, say so plainly.

## What this round is for

The plans have converged on the architecture. What remains are the places where
they still genuinely differ, the places where all of them agree without the
corpus having settled the point, and now the places where the maintainer's
decisions above cut against what a plan proposes.

- **Find the real disagreements.** Where two plans differ, say whether the
  difference is substantive or only wording. If substantive, state what evidence
  or experiment would settle it, and which way you think it settles.
- **Test the load-bearing claims again.** A confident error that survives into
  the built foundation is the most expensive thing that can happen here.
- **Say which plans the amendments cost, and how much.** Naming a version-one
  requirement the maintainer has just descoped is a real defect; so is retention
  the later restore tool could not read.
- **Name what each plan uniquely has.** For every plan, identify at least one
  element the others lack that would be a real loss if it were dropped, specific
  enough to be lifted verbatim.
- **Name what any plan has that should not be built.** This is a handheld
  running busybox with a five-second budget on the path a player watches.
- **Say which plan you would build from,** and what you would take from the
  others before building. You are not voting; you are making the case.

Where a plan has changed your mind since your own revision, say so and why.

Refer to plans by filename (for example `kimi-revised_plan-r3.md`), never by an
invented ordinal.

## Injected revised approaches

=== START gemini-revised_plan-r3.md ===

# Round 3 Revised Approach: Cloud-Save Conflict Resolution Foundation

This document specifies the complete, executable foundation for cloud-save conflict resolution in ROCKNIX. It is built on the embedded corpus (S01–S42) and the maintainer’s two binding amendments: **reversibility is first-class but bounded to one step back**, and **V1 ships a headless retention store (no undo UI) designed for a future "time machine" reader**.

This revision settles the remaining disagreements by adopting the strongest, corpus-backed mechanisms from the round-2 plans, conceding refuted positions, and stripping over-scoped machinery.

---

## 1. Concessions and Adoptions

To reach a safe, console-first foundation within the 5-second exit budget, I concede the following refuted positions and adopt the proven corrections from my peers:

*   **Concession (Exit-path overwrite):** I concede that relying on cached manifest claims to authorize an exit upload (`kimi-revised_plan-r2.md`) fails the acceptance criterion to *refuse* offline forks. **Adopted:** `gpt-revised_plan-r2.md`’s requirement to read cloud evidence for changed units *before* uploading.
*   **Concession (Unit classification):** I concede that "any member divergent marks the whole unit divergent" (`gemini-revised_plan-r2.md`) fails to detect disjoint-member forks (e.g., A edits `.eep`, B edits `.mpk`). **Adopted:** `kimi-revised_plan-r2.md` and `gpt-revised_plan-r2.md`’s complete member-map comparison.
*   **Concession (Deletion propagation):** I concede that abandoning deletion propagation because an unmounted card mimics a deletion (`claude-revised_plan-r2.md`, `kimi-revised_plan-r2.md`) violates the maintainer's directive that edge cases inform but do not drive. **Adopted:** `gpt-revised_plan-r2.md`’s version-specific retirement records for explicit ES deletes.
*   **Adopted from `claude-revised_plan-r2.md`:** The strict hashless verification rule (equal size is not an equality verdict; download-and-hash is required before overwriting).
*   **Adopted from `gemini-revised_plan-r2.md`:** The LAN-only reachability fix (`ip route get <ip>`) and the split-root (`BACKUPPATH != RESTOREPATH`) one-way import destination.
*   **Adopted from `mistral-revised_plan-r2.md`:** `kind: "container"` for shared VMU/memcard units, making `rom: null` a strict type rule.
*   **Adopted from `gpt-revised_plan-r2.md`:** The `--files-from` manifest transport (avoiding `--include`'s destructive exclusion behavior) and the `.cache` non-disposable warning.

---

## 2. The Maintainer Amendments: Retention & Undo

The maintainer ruled that V1 must not add UI complexity to the resolution flow. There is no "undo" button in V1. However, discarded copies must be retained (ON by default, bounded by a count), and the store must be designed *now* to support a future "time machine" tool.

### 2.1 The V1 Retention Store
The store lives at `/storage/.cache/cloud_sync/discarded/<path>/`. **Warning:** Despite residing in `.cache`, this directory is *not* a disposable cache and must be exempt from OS-level cache-wiping routines (`gpt-revised_plan-r2.md`).

When a resolution discards a copy (local or cloud), the engine writes:
1.  **The State & Thumbnail:** The discarded bytes (`<sha256>`) and its PNG (`<sha256>.png`). The PNG must travel with the state so the future picker can render it.
2.  **The Context Sidecar:** `<sha256>.json`, written *before* the destructive apply step, containing:
    ```json
    {
      "rom": "Advance Wars.gba",
      "system": "gba",
      "kind": "state",
      "slot": 1,
      "producer": {
        "device_id": "ROCKNIX-ee5013fc56",
        "device_label": "Anbernic-RG35XX-SP",
        "core": "mgba",
        "core_build": "e31759b24e7...",
        "captured_at": "2026-09-05T15:37:28Z"
      },
      "winner_side": "local",
      "winner_sha256": "<winning_hash>",
      "reason": "conflict-loser",
      "resolved_at": "2026-09-06T10:00:00Z",
      "run_id": "<uuid>"
    }
    ```

### 2.2 Retention Bounds
*   **Count:** Default is **3 per save unit** (not global).
*   **Exemptions:** Unresolved conflicts and incomplete transaction preimages are strictly exempt from pruning (`gpt-revised_plan-r2.md`). A retention sweep must never evict the only copy of an unreviewed head.
*   **Done Page:** The wizard's final screen explicitly states: *"Discarded copies are kept and can be recovered later."*

---

## 3. Architecture and End-to-End Flow

### 3.1 Identity and Manifests
*   **Identity:** A save version is the `sha256` of its stored bytes (D-CLOUD-030).
*   **Manifests:** One JSON per device at `savestates/.rocknix/manifest-<device_id>.json` (D-CLOUD-031). Each device writes only its own.
*   **Agreement:** The last agreed hash per path is stored locally at `/storage/.cache/cloud_sync/agreed.json`.
*   **Equality Establishes Agreement:** If Local = Cloud, and no agreement record exists, the engine *writes* the agreement record. Without this, the first change to any legacy save triggers a false conflict (`gpt-revised_plan-r2.md`).

### 3.2 The Lifecycle Gate
To survive ES dying while the emulator lives (`gpt-revised_plan-r2.md`), the lock order is fixed:
1.  Take `take_cloud_lock` (blocks other syncs).
2.  Take local snapshot lock (blocks ES/RetroArch mutation).
3.  Read local hashes.
4.  Release local snapshot lock.
5.  Perform network operations.

### 3.3 Classification (Member-Map)
A save unit (e.g., `.eep` + `.mpk` pair) is classified by comparing its complete member map (Path → Hash) across Local, Cloud, and Agreed.
*   If Local changed and Cloud changed (including disjoint member edits), the unit is **Divergent → Wizard**.
*   If Local changed and Cloud = Agreed, **Upload**.
*   If Cloud changed and Local = Agreed, **Download**.
*   If Local ≠ Cloud and Agreed is unknown, **Divergent → Wizard**.

### 3.4 The Game-Exit Sync (Pre-Upload Evidence)
To satisfy the AC that offline forks are *refused* by the exit pass, the engine must read before writing (`gpt-revised_plan-r2.md`):
1.  Identify locally changed units.
2.  Fetch cloud evidence *only* for those units (`lsjson --hash` on S3/Dropbox; manifest claims on WebDAV).
3.  **Hashless Strictness:** On WebDAV (no hashes/mtimes), equal size is *not* an equality verdict. The engine must download-and-hash the cloud head before authorizing an overwrite (`claude-revised_plan-r2.md`). If this exceeds the 5-second budget, the upload is deferred to the next full pass (`gemini-revised_plan-r2.md`).
4.  Upload safely advanced units using `--files-from` (avoids `--include`'s destructive exclusion).
5.  Leave conflicts pending. Say *"No new saves to upload"* rather than *"The cloud is fully in sync"*.

### 3.5 Resolution and Apply
*   **Auto KEEP BOTH:** Deterministic. The device's resume point stays at `.state.auto`; the cloud copy is moved to the next free numbered slot with its PNG. No extra sub-choice UI is presented.
*   **Merge Primitives:** `SaveStateRepository::getNextFreeSlot()` (which correctly returns `-99` for auto-only repos) and `copyToSlot(move=false)` are used.
*   **Interrupted Apply:** The frozen plan is the journal. A boolean `done` is insufficient. The record must distinguish: prepared operands, local installation complete, remote publication verified, and agreement committed.

### 3.6 Deletion Propagation and Churn
*   **Explicit Deletes:** When ES deletes a state, the engine writes a version-specific retirement record (tombstone) containing the exact `sha256`. This propagates the deletion without treating an unexplained absence (e.g., a detached SD card) as a delete (`gpt-revised_plan-r2.md`).
*   **Compaction Churn:** D-CLOUD-030 compaction applies to the *cloud* copy as well. Retiring the cloud's higher slot via copy-verify-delete into a dated sibling terminates the renumber-churn loop (`kimi-revised_plan-r2.md`).

---

## 4. What the Corpus Settles vs. What the Council Agrees

**Settled by the Corpus (Source-Visible):**
*   `getNextFreeSlot()` returns `-99` for an auto-only repository (S37). The adapter must handle this by allocating from `firstslot`.
*   The exit upload is `copy` with no `--update` (S29). The one-way stopgap is destructive; D-CLOUD-029 stands until #22 replaces it.
*   `RCLONEOPTS` silently replaces `--filter-from` (S29). Option hygiene is load-bearing.
*   Creating `es_savestates.cfg` changes launch behavior (S39). The #10 rehearsal gate is mandatory.
*   Exit-time renumbering is conditional, not every exit (S38, S41).

**Agreed by the Council (Unmeasured / Not in Corpus):**
*   **Bisync's Demotion:** The council agrees bisync should be a candidate transport, not the detector. (Requires the bisync spike to confirm 1.75.0 behavior).
*   **Boot Sync Scheduling:** The boot pass must move under ES's scheduling to avoid racing gameplay.
*   **Queue-and-Badge Trigger:** Unattended passes queue conflicts and badge the UI, rather than forcing the wizard open immediately.
*   **Retention Count:** The default count of 3 per unit is a product proposal, not a corpus-derived limit.

---

## 5. Decision Register Updates

*   **Refine D-CLOUD-031 (Manifest & Agreement):** Add: "Equality establishes agreement. If Local and Cloud hashes match but no agreement record exists, the engine writes the agreement record to prevent false conflicts on legacy saves."
*   **New D-CLOUD-032 (V1 Retention Store):** "Discarded saves are retained ON by default, bounded by a per-unit count (proposed: 3), exempting pending transactions. The store lives at `/storage/.cache/cloud_sync/discarded/` (exempt from cache-wiping) and includes a JSON sidecar with full producer/winner context to support a future time-machine reader. V1 ships no undo UI."
*   **New D-CLOUD-033 (Deletion Propagation):** "Explicit player deletions and D-CLOUD-030 compactions generate version-specific retirement records. Unexplained filesystem absence fails closed. Cloud-side compaction terminates the renumber-churn loop."

---

## 6. Known Unknowns and Experiments (The Gates)

Before freezing the implementation, the following experiments must be executed on the GENERIC_X64 VM and H700 hardware:

1.  **The Bisync Spike:** Run rclone 1.75.0 `bisync` with `--conflict-resolve none`, `--recover`, and `--resilient`. Verify it does not rename savestate losers and handles missing listings gracefully.
2.  **Hashless Exit-Sync Cost:** Measure the time to download-and-hash a 64 KiB `.srm` on the QA WebDAV from the H700. If it exceeds the 5-second budget, enact the `gemini` fallback (defer verification to the full pass).
3.  **The `--backup-dir` Race Fixture:** Interleave two publications on Dropbox/WebDAV. Verify `--backup-dir` atomically preserves the intervening head. If it fails, a protected-publication protocol is required before multi-device ships.
4.  **The #10 Launch-Behavior Rehearsal:** Ship `es_savestates.cfg` and verify that RetroArch's `racommands`, autosave, and incremental behaviors are preserved.
5.  **The 480x320 UI Layout Test:** Render the wizard at the RG351M's resolution. Verify side-by-side thumbnails are recognizable. If not, fallback to a single-column toggle.
6.  **The Cloned-Card Experiment:** Run two live devices sharing one `cloud_device_id` (a supported misconfiguration). Verify the engine warns and refuses rather than corrupting state.

---

## 7. What Should Not Be Built

*   **A V1 Undo Control:** Descoped by the maintainer.
*   **8-Generation Lineage:** `claude`'s deep ancestry requirement is over-scoped. One-step operation context is sufficient.
*   **Cached-Manifest Exit Overwrites:** `kimi`'s permission to overwrite based on stale caches misses the primary offline-fork scenario.
*   **Timestamp-only Discard Stores:** Fails the maintainer's requirement for the future reader tool.
*   **`--include` Manifest Transport:** `gemini`'s approach excludes the payload. Use `--files-from`.
*   **A New Ping Probe:** `gemini`'s ping violates D-CLOUD-028. Keep `ip route` (WAN) and add `ip route get <ip>` (LAN).

=== END gemini-revised_plan-r3.md ===

=== START gpt-revised_plan-r3.md ===

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

=== END gpt-revised_plan-r3.md ===

=== START kimi-revised_plan-r3.md ===

# kimi-revised_plan-r3.md

**Cloud-save conflict resolution in ROCKNIX — the foundation to build (round 3)**

This is a standalone specification. A reader can act on it without any prior round, review, or analysis. Sources are cited as [S01]–[S42] in embed order; full declared paths and the Facilitator's sha256 values are in `corpus.provenance.json` at the end. I did not re-read, re-hash, or execute anything; the embedded corpus is my read-at-time basis. The two maintainer decisions in the orchestrator brief are applied as authoritative.

---

## 1. The foundation in twelve sentences

1. **Identity** is the sha256 of a save's stored bytes; slot and file name are attributes (D-CLOUD-030 [S06]). Saves are classified as **units**: a single file by default; a declared multi-file unit (N64 `.eep/.mpk`, PSX memcard, Dreamcast VMU, PPSSPP game-ID set) is classified as **one whole member map** (path → hash), never as an aggregate of per-file verdicts; a shared container (VMU, memcard) is one unit with `kind: container`, `rom: null`.
2. **Truth channels** are the per-device synced manifests (D-CLOUD-031 [S03], [S06]) plus the local, unsynced agreement record; **agreement is written on verified equality as well as on transfer** — otherwise every save on every existing device prompts once on its first change, and the upgrade is not invisible [S11].
3. **The classifier is ours**: three-way (local *L*, cloud *C*, agreed *A*) per unit, with **move inference** (a hash the agreement knew at path *k* now visible at path *k−1* in the cloud listing or the manifest union is a move, not delete + create) and **bounded tombstones** in the per-device manifest for pure deletions. Never-agreed-and-differ asks; `unknown` is rendered honestly; nothing stamps a file it did not write [S03 §§2–4].
4. **Every write path reads before it writes.** The game-exit pass reads cloud evidence for exactly the changed set (capture knows it by hash) before uploading; the boot/menu passes classify everything before transferring anything; a fork is **refused, queued, and badged** — never resolved by recency, on any path, per the futro's #22 AC (a) [S05 §5].
5. **Capture** runs at game exit, told the game, emulator and core by ES [S41], [S42], hashes locally, and writes the manifest **only when something changed**; the upload carries the exact changed set plus the own manifest via `--files-from` — one spawn, no filter composition, no `--max-age` as change detector.
6. **The wizard** opens from a badge after the non-conflict pre-pass has completed; cloud is always left; KEEP LEFT / KEEP RIGHT / KEEP BOTH; KEEP BOTH is savestates-only through a **checked adapter** over ES's primitives; an auto-state conflict is a resume-point decision with a **deterministic** KEEP BOTH outcome (this device keeps `.state.auto`; the cloud copy becomes a numbered state with its PNG); nothing transfers until COMPLETE; quitting discards decisions; the done page names every discarded copy and says the copies are kept.
7. **Retention is on by default, bounded per save unit, and ships no undo control.** The store at `/storage/.cache/cloud_sync/discarded/<operation-id>/` carries a **self-contained `operation.json`** per operation — the loser's manifest entry verbatim, reason, winner, run id, screenshot path + hash — so the maintainer's later "time machine" tool (a separate issue: the wizard's compare surface pointed at retained versions) can drive a picker from it. V1 builds the store, not the tool.
8. **Deletions propagate when — and only when — intent was recorded.** A player-initiated delete in the savestate manager is hooked and recorded; the next pass retires the cloud copy by copy-verify-delete into a dated sibling (D-CLOUD-026 shape [S06]); other devices retire their local copies on sighting the tombstone. Renumber and compaction propagate by hash inference plus **cloud-side compaction under D-CLOUD-030's existing wording**. **Unexplained absence fails closed**: hold, log, surface; never delete, never silently resurrect.
9. **Concurrency** is the existing cloud lock (`take_cloud_lock`, exit 3 [S29]) plus one local **lifecycle gate** with a fixed acquisition order: a network worker takes the cloud lock, then the gate non-blockingly; a game session holds the gate for local capture, releases it, then requests cloud work; capture never waits for the cloud lock; the gate is never held across a network wait. The boot sync moves under ES's scheduling; the detached `autostart/102-cloud-saves` pair [S35] is retired by the engine, not patched.
10. **Safety**: every destructive step is preceded by its retention copy and its audit-intent line, and followed by an audit-outcome line; a pending-operation record makes an interrupted apply recoverable; `--backup-dir` is the remote retirement mechanism **pending a race fixture**, with a defined fallback if it fails; every guard is proven to fire against a constructed violation [S10].
11. **Migration** is shadow mode → census → enforce. The engine first classifies and logs on the maintainer's devices while the shipped paths run unchanged (D-CLOUD-029 stands [S06]); the census prices the design on the real library; then the engine takes over the write paths wholesale. Equality-seeding (item 2) means existing devices see no prompt storm.
12. **bisync is not the detector.** It may earn the bulk-transfer role for non-conflicting units if the spike passes; the classifier is the manifest three-way regardless. This amends the approach language of #9/#22 [S17], [S18], [S23] and the IA's detection section [S02]; it contradicts no decided row.

---

## 2. What the maintainer's two decisions cost this plan — concessions, named

`kimi-revised_plan-r2.md` was mostly aligned with the amendments (no undo control; retention on, count 3). What it owed, and what this revision changes:

| # | Concession | Refuted or required by | The change in this plan |
|---|---|---|---|
| C1 | **The KEEP BOTH auto sub-choice is dropped.** My r2 asked the player which copy becomes `.state.auto`. | `claude_peer_review-r3.md` D3; `gpt_peer_review-r3.md` §2.7; the maintainer's "I don't want to add more complexity during conflict resolution." | Deterministic rule: the device's resume point stays at `.state.auto`; the cloud copy becomes the next free numbered slot with its PNG; the done page names where it went. A player who wants the cloud copy as the resume point presses KEEP LEFT. |
| C2 | **The exit pass must read before it writes.** My r2 consulted cached manifest claims and accepted that a fork created since the last full pass could be overwritten, with the dated sibling as recovery. | `claude_peer_review-r3.md` D2; `gpt_peer_review-r3.md` §2.1; the futro's #22 AC (a) — *refused*, not resolved [S05 §5]. | §3.3: the exit pass reads cloud evidence for the changed set before any upload. Recoverability is a floor, not refusal. |
| C3 | **The discard store was a stamp-keyed path mirror.** It could not drive the later picker: device of origin and which side won were lost when the winner's manifest entry replaced the loser's and the apply record was disposed of. | `claude_peer_review-r3.md` §1.1–1.2; `gemini_peer_review-r3.md` §1; `gpt_peer_review-r3.md` §1 ("the missing retention contract"). | §3.6: self-contained `operation.json`; PNG travels; per-unit counts; exemptions for pending operations. |
| C4 | **The apply record's fate was unstated** — "presence means interrupted" implied disposal on completion. | `gpt_peer_review-r3.md` §1 table; `claude_peer_review-r3.md` §1.1. | Split in two: a *transient* pending record (removed on completion) and a *permanent* `operation.json` written with the retention copies before the first destructive step. |
| C5 | **Deletion propagation was under-specified and, on one reading, refused.** `gemini_peer_review-r3.md` read my r2 as refusing to propagate ordinary deletions; `gpt_peer_review-r3.md` §2.3 found the receipt's transport undefined (a local unsynced journal cannot tell device B that device A retired path P). | `gemini_peer_review-r3.md` §§1–2; `gpt_peer_review-r3.md` §2.3; the maintainer's "abandoning a capability to buy [edge-case safety] needs a better reason than the edge case alone." | §3.7: recorded deletions propagate as copy-verify-delete into dated siblings. Transport is (a) hash inference for moves/compactions — no record needed, the hash's new location is the signal — and (b) a bounded tombstone list in the synced per-device manifest for pure deletes. No new channel. |
| C6 | **#10 deferred.** My r2 moved per-core directories out of the drop. | `claude_peer_review-r3.md` D6; `gpt_peer_review-r3.md` §2.6; D-CLOUD-024 and S01's milestone scope. | §3.11: #10 stays in the drop, sequenced last, gated on the launch-behaviour rehearsal — with a sharper finding (§3.11) about what the rehearsal must measure. Deferral happens only on rehearsal evidence, as a maintainer scope decision. |
| C7 | **The ops journal was partly justified by `replaces` fidelity across rename-then-edit** — lineage depth the maintainer has set aside. | `claude_peer_review-r3.md` §4 (kimi bullet); the maintainer's one-step-back. | The journal's V1 jobs are exactly two: deletion receipts and pending-operation recovery. Nothing deeper. |
| C8 | **Manifest transport by filtered `--include`, gated on a dry run.** | `claude_peer_review-r3.md` D7; S09's gotcha ("using `--include` at all excludes everything it does not match"). | `--files-from` from capture's exact changed set; staging-directory copy as the fallback; dry-run gate either way (§3.2). |

One misreading to correct: `gemini_peer_review-r3.md` §2 attributes to my r2 the claim that `--backup-dir` "will atomically archive the intervening head." My r2 listed `--backup-dir` as *council-agreed, untested for this use* (as `claude_peer_review-r3.md` D10 confirms). The overclaim was `gemini-revised_plan-r2.md`'s ("recoverable without extra spawns"). The race fixture (§8, gate 6) gates it for everyone; no plan may claim the guarantee yet.

---

## 3. The architecture, part by part

Verdicts on the approach as it stands [S01], then the design.

| Part | Verdict |
|---|---|
| Identity (D-CLOUD-030) | **Endorse**; clarify compaction scope (§3.7) |
| Manifest (D-CLOUD-031) | **Endorse with refinement** (§3.1, §4) |
| Namespace (D-CLOUD-017) | **Endorse**; #10 gated on rehearsal (§3.11) |
| Detection (bisync, #9/#22) | **Replace**: own classifier; bisync a candidate transport (§3.10) |
| Presentation (IA rev 4 [S02]) | **Endorse with amendments**: queue-and-badge; retention ON; deterministic auto KEEP BOTH; rev-5 corrections (§3.4) |
| Merge (#24) | **Endorse** via checked adapter, never raw primitives (§3.5) |
| Audit (D-CLOUD-027) | **Endorse**; intent + outcome lines; the audit is not the store's index (§3.8) |
| Write paths (D-CLOUD-029) | **Endorse the row**; replace wholesale via shadow → enforce (§3.9) |
| Compatibility (#19, D-CLOUD-025) | **Endorse**; badge severity waits for the bench (§3.11) |
| Snapshots (#25) | **Endorse V2**; the retention store is separate machinery; #25 still owes its allowlist rule when it lands [S03 §8] |

### 3.1 Identity, agreement, and the classifier

- **Units.** Default unit: one file (a state with its PNG as an attribute — the PNG is not identity, D-CLOUD-030 [S03 §1]). Declared units, shipped as a small table keyed by system/emulator, covering exactly the special layouts the allowlist already names [S32]: `n64/save/*`, `psx/memcards/*`, `dc/shared/savefiles/**`, `psp/PPSSPP/**`. A declared unit's member set is checked against the allowlist at declaration time — a unit containing a member the `*.db` rules exclude [S32] can never sync that member, and the table must say so rather than discover it (credit `gpt-revised_plan-r2.md` §12, via `claude_peer_review-r3.md`).
- **Member-map classification.** For a declared unit, build three maps — M_local, M_cloud, M_agreed (path → hash over the complete member set). The three-way rules of [S03 §3] apply to the maps as wholes: equal → nothing; only one side's map differs from agreed → apply that side's whole map (install *and remove* members so the destination holds the complete selected map, never a merge of two maps — credit `gpt_peer_review-r3.md` §2.5); both differ → divergent → wizard. The disjoint-member fork (agreed (a₀,b₀), local (a₁,b₀), cloud (a₀,b₁)) is a fork under this rule and invisible to per-file aggregation — `gemini-revised_plan-r2.md` §2.1's "any member divergent" rule misses it, as `claude_peer_review-r3.md` D1 shows. Pure classifier fixture, no hardware, ten minutes; it settles toward member maps.
- **Moves.** Before any "device-only → upload" or "cloud-only → download" verdict, check whether the hash exists at another path in the cloud listing or the manifest union. If so: it is a move; re-key locally; do not transfer; compact per D-CLOUD-030. This extends the schema's "a move is not a conflict" [S03 §3] from conflict-avoidance to transfer-suppression, and it is what terminates the renumber churn loop without a journal (credit `claude_peer_review-r3.md` D4).
- **Equality writes agreement.** When a pass verifies L == C by content for a path with no agreement, it writes agreement (refinement of D-CLOUD-031; §4). The schema as signed writes agreement only on upload/download [S03 §§2, 9]; devices synced by the shipped scripts have L == C everywhere and no agreement, so without this the engine's first change to any save is "never agreed → ask" (credit `gpt-revised_plan-r2.md` §4.1 via `claude_peer_review-r3.md` §3 item 10). On hashless backends, seeding agreement requires a matching foreign-manifest claim with matching size+mtime, or download-and-hash; otherwise no agreement is written and the first real divergence asks. Fail toward asking, never toward silent.
- **Unknown and foreign artifacts.** A file with no entry anywhere is `unknown` in every provenance field and still classified by hash [S03 §4]. A Dropbox "conflicted copy" or Syncthing `.sync-conflict-` file is never offered as a version and never moved by us (D-CLOUD-022; [S04] §3.5) — and the saves allowlist currently admits them (§11, filing F2).
- **Cloud member maps must be coherent.** Readers assemble a cloud unit's member map from the listing plus foreign manifests and require all members to match **one** foreign manifest's declared map; a mixed set (interrupted publication) matches nothing, is never installed or offered as a coherent unit, and is surfaced as incomplete (credit `gpt_peer_review-r3.md` §3.1). Manifest-last publication is a hint for readers, never a proof.

### 3.2 Capture and manifest transport (#21)

- ES calls capture at the existing exit point [S41], passing game path, `getEmulator(true)`, `getCore(true)` [S42] — told, not discovered (S03 §9). Standalones pass their own name as core.
- Capture takes the **lifecycle gate** briefly (the emulator process has exited; the gate excludes a concurrent sync install), hashes the game's save/state paths, re-keys moved entries (same hash, new path → update the key, `replaces` and `captured_at` unchanged [S03 §6]), writes new entries for changed files, and **writes the manifest file only when an entry changed** — never to bump `generated_at` (kept from `kimi-revised_plan-r2.md`; credited in `gpt_peer_review-r3.md` §4). A metadata-only exit then costs zero spawns and manufactures no history.
- `core_build` comes from `/usr/share/rocknix/core-pins`, emitted at image build from `LIBRETRO_CORES` × `get_pkg_version`, with a core→package map and `"unknown"` when unmapped [S03 §9].
- **Transport**: the exit upload is `rclone copy --files-from <changed saves + own manifest> --no-traverse --backup-dir <sibling>` — one spawn, no filter composition, and `--max-age` is retired as the change detector (the shipped script's own comment admits wrong-mtime files escape it [S29]). `--files-from` is not covered by the corpus; the dry-run gate (§8, gate 0) proves it composes with `--no-traverse` and `--backup-dir` on 1.75.0, with a staging-directory copy as the fallback. Downloads exclude the own manifest by exact path; a foreign manifest is never republished, and the cloud's copy of our manifest never overwrites locally captured unpublished entries.

### 3.3 The three write paths, replaced

**Game-exit pass** (the watched ~5 s path [S09], D-CLOUD-028):
1. Capture (above). Changed set empty → stamp, done. **Zero rclone spawns** — better than the shipped `--recent`, which spawns once even when idle [S29].
2. Take the cloud lock non-blockingly; held → exit 3, SKIPPED, no stamp [S29].
3. **Evidence read, changed set only**: one `lsjson --hash` per distinct parent directory (typically one), matched against the manifests' `remote_hash` claims [S03 §6]. Hashless backend: the listing yields names/sizes; any changed path whose cloud presence and equality cannot be established from the listing plus a foreign-manifest claim is **downloaded and hashed** (scoped `--files-from` to a staging dir; tens of KB). A listing that answers nothing is *unknown*, never "no conflict" (blindspot 22 [S07]).
4. Classify each changed unit: cloud head == agreement or absent → upload with `--backup-dir`; cloud head ≠ agreement → **fork: do not upload; queue; badge; typed outcome** (§3.8). Evidence unreadable → defer, report honestly, fail closed.
5. Upload (`--files-from`, one spawn), verify, advance agreement, stamp, audit.

Budget: idle ≈ 1–2 s (local hashing only); one changed save ≈ the ~7 s the corpus already prices [S09], plus one scoped listing. **Gate 4 measures it on the H700.** If the evidence read breaks the budget, the fallback (credit `gemini-revised_plan-r2.md` §4) is: upload only units whose cloud head is *verified* equal to agreement, defer the rest to the full pass — **never upload over an unread head**. AC (a) holds under every outcome.

**Boot pass / SYNC row / menu rows** (full passes): lock → classify everything (capture full scan; download foreign manifests; cloud listing; on hashless, size+mtime hints plus foreign-manifest claims, with download-and-hash only for candidates whose decision needs equality — equal size is not an equality verdict, credit `claude_peer_review-r3.md` §3 item 10's implication and `gpt_peer_review-r3.md` §2.2) → run the **pre-pass** (all non-conflict verdicts: cloud-only down, device-only up, one-way changes, moves folded, compactions) → queue conflicts → badge. Downloads/installs happen only when no game session is live (the gate): installing a save while RetroArch runs is pointless — the exit flush overwrites it — and racy. Uploads re-hash immediately before transfer; a file that changed since capture is re-classified, never uploaded stale.

**Replaced-mechanism inventory** (the futro's #22 AC (f) [S05 §4]): the `--update` newer-on-destination skip → replaced by agreement-based one-way rules (strictly safer: agreement, not recency); restore-before-backup ordering → preserved inside one pass (downloads apply before uploads); the lock → kept; the `--recent` window → replaced by capture's exact set; the stamps in `/storage/.cache/cloud_sync/` → kept, same files, same meanings (D-UI-018's rows read them [S06]).

**Typed outcomes**: the engine maps rclone's exit codes internally and emits its own — 0 applied; 3 lock-held skip; 4 no-route skip; 5 conflicts pending (badge); 6 evidence unreadable, deferred; 1 error — because rclone's own 3/4 collide with the scripts' reserved meanings and `clean_exit` stamps any code [S29], [S40] (filing F3).

### 3.4 Presentation and resolution (#23)

- **Trigger: queue-and-badge.** IA rev 4's "a sync that reports conflicts opens the wizard" [S02] is right for a menu-initiated sync and wrong for boot and game exit; unattended passes queue and badge (the CLOUD SETTINGS row, the SYNC row's last-run line, and #37's savestate-manager tile reading the manifests [S28], [S04] §3.5). Kid/kiosk hides GAME SETTINGS [S13]; nothing destructive happens without the wizard; unlocking resolves. Council-agreed, not corpus-settled → IA rev 5.
- **Pre-pass gate**: the wizard refuses to open until the non-conflict pre-pass has completed and says so (futro AC on #23 [S05 §5]); an interrupted pre-pass is ordinary idempotent transfers, resumed next pass.
- **The screen**: as IA rev 4 — cloud always left; screenshot or glyph; date/time (local, with the `clock_synced` warning), device label + model, emulator/core + build per side; no size, no play time; KEEP BOTH dimmed with a reason on in-game saves; auto conflicts labelled as the resume-point decision [S03 §4]; `unknown` rendered honestly. Compatibility badge severity waits for #19 (D-CLOUD-025).
- **KEEP BOTH on an auto conflict: deterministic** (C1). This device keeps `.state.auto`; the cloud copy becomes the next free numbered slot with its PNG; the done page names the slot.
- **Nothing transfers until COMPLETE; quitting discards decisions** [S02]. The done page names each discarded copy per game **and says the copies are kept** (the audit line precedes the deletion [S05 §5]). **No undo control anywhere in the flow** — the maintainer's decision. The restore tool is a separate issue with the maintainer's shape: the wizard's compare-and-choose surface pointed at a game's retained versions, reached from outside the moment of resolution.
- **Layout at 480×320 first**, `tools/vm-visual-qa` frames at both sizes, and an RG351M recognition test with real thumbnails (§8, gate 8) [S05 §5].

### 3.5 Merge: the checked adapter, never the raw primitives

Verified against the embedded ES sources:

- `getNextFreeSlot()` returns **−99 for an auto-only repository** — the loop scans slots 99999→0 and an auto state (slot −1) never matches [S37]. That is the *ordinary* case for the commonest conflict kind [S03 §4], not an edge case. The adapter: auto-only → allocate from `firstslot`; `isEnabled` false (non-RetroArch emulator [S37]) → KEEP BOTH disabled with a reason; any other −99 → refuse with a reason. Blanket rejection or blanket conversion of −99 to 0 are both wrong (credit `gpt_peer_review-r3.md` §2.7).
- `copyToSlot()` discards the `renameFile`/`copyFile` results and returns `true` unconditionally [S38]. The adapter re-reads the destination and verifies the hash after every copy.
- `makeStateFilename(fullPath = true)` derives the destination from the **source's parent** [S38] — a cloud state staged in `/tmp` would "merge" into `/tmp`. Stage in the real save directory under a temp name matching neither ES regex (`X.state1.tmp-<id>` matches neither `^(.*)\.state($|[0-9]+)$` nor the auto pattern [S39]; credit `claude_peer_review-r3.md` §3 item 3).
- Slot allocation reuses ES's `getNextFreeSlot()` (inherits `firstslot` and future conventions [S02]) behind the adapter, with **in-memory reservations** so two merges in one wizard run for one game allocate distinct slots; the pre-pass gate makes free-on-device equal free-on-both [S02].
- The PNG moves with the state — `copyToSlot` already pairs them [S38] — and the adapter verifies both.

### 3.6 The retention store (the amendment's design)

- **Home**: `/storage/.cache/cloud_sync/discarded/`. Alternatives are worse: `/storage/.config` is swept into `backuptool`'s archive [S04 §1]; anything under `/storage/roms` is admitted by the allowlist [S32]. But `.cache` is the established home for *regenerable* state [S02] and **these bytes cannot be regenerated** (credit `gpt-revised_plan-r2.md` §12 via `claude_peer_review-r3.md` §1.2). So the location comes with a named rule: **this subtree is not a cache** — no schema-version rebuild ever wipes it; the retention count is the only eviction. Decided with the shape, with the maintainer.
- **Layout**: `discarded/<operation-id>/` where operation-id = `<utc>-<device-id>-<seq>` (no wall-clock uniqueness assumption — credit `gpt_peer_review-r3.md` §1). Retained files sit under their sync-root-relative paths; a state's PNG sits beside it [S03 §4].
- **`operation.json`** (one per directory, written **before** the first destructive step): operation id; kind (`wizard-resolution | sync-retirement | es-delete`); and per retained copy: the loser's **manifest entry verbatim** (kind, sha256, size, slot, system, rom, emulator, core, core_build, device id/label/model/family, captured_at/local, clock_synced, screenshot path + sha256 — all present at discard time), `reason` ∈ {`conflict-loser`, `superseded-by-download`, `es-delete`}, `winner` = {side, path, sha256, device} or null, and the wizard's decision summary for wizard operations.
- **Retention rule** (default ON; count is a **proposal**, council-agreed not corpus-settled — the maintainer said "bounded by a count"): per save unit, keep the last **3** `conflict-loser`/`es-delete` copies and the **1** most recent `superseded-by-download` copy. Compaction and renumber retirements are **not stored** — verified-identical bytes survive at the retained slot; audit lines only (D-CLOUD-030's compaction is lossless by construction [S06]). **Exempt from eviction**: anything referenced by a pending operation record (credit `gpt-revised_plan-r2.md` §6.3 via `claude_peer_review-r3.md` §1.2).
- **Remote analog**: retirements on the cloud go to `SYNCPATH-replaced/<device-id>/<stamp>/` (outside the sync root, so it never syncs), same reasons and counts, pruned on full passes by the device that wrote them.
- **The reader test** (credit `gpt_peer_review-r3.md` §1): resolve a conflict; then overwrite the producer's manifest entry, renumber the live slots, rotate the audit log, remove the completed pending record. A test-only reader must still identify the game, render the retained candidate from its PNG, name its producer, and say which side won. This store passes; a stamp-keyed mirror does not.

### 3.7 Deletion, renumber, compaction — and the fail-closed half

- **Recorded intent propagates.** One load-bearing hook: the player-initiated delete in the savestate manager (attach at the `GuiSaveState` delete action — the call site is **not embedded**; §12 — *not* at `SaveState::remove()`, which `onGameEnded` also calls for its own cleanup [S38] and would record false deletions). The hook hashes the file at delete time and records {path, sha256, when}. The next pass retires the cloud copy by copy-verify-delete into the dated sibling and appends a **tombstone** {path, sha256, retired_at, reason} to the own manifest's bounded tombstone list. A peer sighting the tombstone: local hash == tombstone hash → retire locally into its own store, drop agreement; local hash ≠ tombstone hash → a divergent version the tombstone does not name → ordinary classification (upload or conflict). **A stale tombstone never authorizes retiring different bytes** (the fixture in §8, gate 7).
- **Renumber and compaction need no tombstone.** The hash survives at the new/lower path, visible in the listing and the manifest union; move inference (§3.1) re-keys and compacts locally. The cloud copy is compacted the same way — D-CLOUD-030 says "after a sync, two slots of one game holding the same hash are compacted: the higher slot is removed" and does not say *locally* (credit `claude_peer_review-r3.md` D4). Cloud-side compaction by copy-verify-delete terminates the churn loop with no journal.
- **D-CLOUD-030 clarification** (§4): compaction concerns numbered slots of one game in one repository, after hash re-verification, logged; it **never collapses an auto resume point into a numbered slot** (credit `gpt-revised_plan-r2.md`, via `mistral_peer_review-r3.md` §3).
- **Unexplained absence fails closed.** No receipt, no inference, no tombstone → hold the local copy, do not upload, do not delete, log, and surface as an anomaly at the next wizard run. A RetroArch-menu deletion (invisible to ES) lands here: held, not propagated — the stated residual, and the player can delete again via the manager. The maintainer: failing closed on unexplained absence is cheap and expected; abandoning propagation for it was not sufficient reason.
- **Tombstone lifetime**: pruned with the same per-unit retention window. A device returning after the window with the retired hash re-uploads it; other devices see an ordinary one-way transfer and the file returns — bounded, non-destructive, and the next deletion propagates the same way. Stated, accepted.

### 3.8 Safety, audit, and the interrupted apply

- Apply sequence per COMPLETE: freeze the plan (decisions, operands, destinations, hashes) → write the **pending record** → per unit: stage and hash-verify the winner → retention copy + `operation.json` → **audit-intent line** → install (staging rename; KEEP BOTH via the adapter) → publish remote with `--backup-dir`, retire the remote loser to the sibling → verify publication → advance agreement → **audit-outcome line** → remove the pending record. Intent and completion are separate lines; the audit log (D-CLOUD-027, append-only, rotated 1 MiB keep-one [S06]) is a support artefact, never the store's index.
- Kill-point fixtures at the two named stages (credit `gemini-revised_plan-r2.md` §6): after local replacement before remote publication; after publication before agreement advance. Recovery reads the pending record, verifies actual state by hash, and completes or repairs — never re-asks (decisions were made at COMPLETE), never leaves a half-installed unit consumable by the classifier. Honest residual: a kill between two member renames of a multi-file unit leaves a mixed unit until the next engine run repairs it; the window is two rename syscalls; the pending record makes the repair deterministic.
- `--backup-dir` is proven in the corpus only in the shipped mirror mode [S29]. The race fixture (§8, gate 6) has three outcomes (credit `gpt-revised_plan-r2.md` §6.3 via `claude_peer_review-r3.md` D10): pass → ship as designed; unsupported-or-ambiguous on a backend → no canonical replacement on that backend, forks surface via lineage next pass; loses a head → stop and redesign the retirement step.

### 3.9 Migration off today's write paths

D-CLOUD-029 stands [S06]; `mistral-revised_plan-r2.md`'s "withdrawn" reopens a decided row without the argument S01 requires, and misattributes the withdrawal (credit `claude_peer_review-r3.md` §4). The sequence: (1) engine ships in **shadow mode** — full classification and logging, zero transfers — beside the shipped paths, on the maintainer's devices only; (2) the **census** (§8, gate 5) prices verdict distribution, fork rate per kind, auto share, unknown rate, evidence-read cost, store growth; (3) **enforce**: the boot pair, the exit call [S41], and the menu rows call the engine; the shipped scripts keep the system-backup and content tiers, which are out of scope. Upgrade invisibility comes from equality-seeding (§3.1): the maintainer's devices, synced by the shipped scripts, have L == C mostly — zero prompts; genuinely divergent pre-existing files ask once, with `unknown` shown honestly [S11].

### 3.10 bisync's role

Demoted to candidate transport; the spike decides (§8, gate 2): fixture matrix against the loopback WebDAV (D-QA-002) then Dropbox from the device — compressed states (`#RZIPv`), a device-side rename, a genuine both-sides change, an interrupted run; record `--conflict-resolve none` output shape; confirm `--recover`/`--resilient` avoid `--resync`; the detector never runs `--resync` on its own; `--conflict-loser` never renames a savestate (its suffix breaks `{{romfilename}}.state{{slot}}` [S02], [S23]); workdir named explicitly at `/storage/.cache/rclone/bisync` [S05]; every call under the lock; a dry-run listing grepped for `conflict` as the guard (the futro's #22 ACs (b)–(e) [S05 §5]). If it passes, bisync may carry non-conflicting bulk transfers; the classifier and the agreement record are ours regardless — bisync's own agreement state is then unused, and the spike must confirm it cannot conflict with ours (S01 §4 item 2).

### 3.11 #10 and #19 sequencing

- **#19 first** (D-CLOUD-025): the bench protocol [S08], same-chipset control on the two H700s before the cross-chipset matrix, Test C (loud vs silent) even if A and B pass. The badge's severity waits; `core_build` and `device.family` are in the schema regardless.
- **#10 last in the drop**, gated on the **launch-behaviour rehearsal** — and this plan sharpens what the rehearsal must measure. The XML parser **hard-codes `racommands = false`** and defaults `autosave`/`incremental` to false, while the compiled `Default()` sets all three true [S39]. So shipping any `es_savestates.cfg` — no matter what it says — retires the `racommands` branch of `setupSaveState()` [S38]: the auto `.bak` dance at launch and restore at exit. No config can express `racommands = true`. Rehearsal questions: (1) with the XML path, does launching from a numbered slot still produce a correct auto at exit, and does the pre-launch auto survive — if not, #10 needs an ES patch making `racommands` configurable, not a config file; (2) does RetroArch honour the per-core directory (`savestate_directory`; `setsettings.sh` is **not embedded**, §12) — two consumers, one layout [S04 §3.2]; (3) are old flat states still discovered — `defaultCoreDirectory` dual-scans the default core only [S39], so non-default cores need the logged copy-verify-delete migration (D-CLOUD-026 shape), decided on rehearsal evidence. If the rehearsal cannot preserve launch behaviour, *that finding* — not the wizard's convenience — goes to the maintainer as a scope decision (credit `claude_peer_review-r3.md` D6).

---

## 4. Register changes (each stated as a refinement citing the old row)

- **D-CLOUD-032 (refines D-CLOUD-031):** agreement is written on verified equality as well as on transfer; a bounded tombstone list joins the per-device manifest; `kind: container` with `rom: null` for shared units; declared units classify as whole member maps; the manifest is written only on change and rides uploads via `--files-from`. Argument: §3.1–3.3; the equality gap is the sharpest hole in the signed schema (`claude_peer_review-r3.md` §3 item 10).
- **D-CLOUD-033 (refines D-CLOUD-030):** compaction concerns numbered slots of one game in one repository, after re-verification, logged; never collapses an auto; applies to the cloud copy by copy-verify-delete. Argument: §3.7; terminates the churn loop.
- **D-CLOUD-034 (new; supersedes IA rev 4's "keep discarded saves is off by default" [S02], by the maintainer's amendment):** retention ON by default, bounded per unit (3 proposed), store shape per §3.6, no undo control in V1, restore tool as its own issue.
- **D-CLOUD-035 (new; amends #9/#22 approach language, contradicts no decided row):** detection authority is the manifest three-way classifier; bisync is a candidate transport pending the spike; the wizard trigger is queue-and-badge for unattended passes (IA rev 5).
- **D-CLOUD-036 (new; cites D-CLOUD-026, D-CLOUD-030):** recorded deletions propagate as copy-verify-delete into dated siblings; renumbers/compactions propagate by hash inference and cloud-side compaction; unexplained absence fails closed.
- **D-CLOUD-029: stands.** No reopening. **D-CLOUD-017, 024, 025, 027: stand.**

---

## 5. Corpus-settled vs council-agreed vs unmeasured

**Settled by the corpus** (build on these): identity and compaction (D-CLOUD-030); manifest shape and fields (D-CLOUD-031); the shipped write paths are newest-wins ([S35], [S29] `--recent`; blindspot 28 [S07]); the ES primitive behaviours (§3.5 [S37], [S38]); no `es_savestates.cfg` ships and the XML path flips `racommands`/`autosave`/`incremental` ([S39], [S04] §3.2); the allowlist's actual behaviour ([S32], [S05] fixture); `--include` excludes everything unmatched [S09]; rclone 1.75.0 with bisync and its workdir [S05]; the budget numbers [S09], D-CLOUD-028; the QA WebDAV has no hashes and no modtimes ([S04], [S29]); `cloud_device_id`/`--label` ([S34], D-CLOUD-009); lock exit 3, no-route exit 4 [S29]; kid/kiosk hides GAME SETTINGS [S13]; ES knows emulator/core at exit ([S41], [S42]).

**Council-agreed, not corpus-settled** (flagged; each has a gate): bisync's demotion ◊; queue-and-badge ◊; retention count 3 per unit ◊; boot sync under ES scheduling ◊; `--backup-dir` as the retirement mechanism on every backend ◊; the lifecycle gate design ◊; tombstones-in-manifest for pure deletes ◊; `--files-from` transport ◊; 480×320 recognisability ◊.

**Unmeasured, with the experiment named**: bisync's behaviour (gate 2); `--backup-dir` under a two-writer race (gate 6); exit-pass evidence-read cost (gate 4); auto-conflict frequency and verdict distribution (gate 5 census); the zombie-auto mtime consequence — the copy utility's timestamp behaviour is not embedded (gate 3); `--files-from` composition (gate 0); the XML path's real launch behaviour (gate 9); thumbnail recognisability at 480×320 (gate 8).

---

## 6. Known unknowns → resolution plans (the problem statement's §4)

1. **Chipset axis; loud vs silent** → #19 bench [S08], same-chipset control first, before badge design. Outcomes: portable → badge is a convenience; silent failure → badge is a safeguard and the cross-core/chipset toggles get destructive framing.
2. **bisync behaviour** → gate 2 spike; dry-run first; the classifier does not wait on it.
3. **Is the auto state the commonest conflict?** → gate 5 census measures; the wizard treats `kind: auto` as a resume-point decision regardless [S03 §4].
4. **Pre-pass gate sufficiency** → the wizard refuses to open until the pre-pass completes (AC); interruption is idempotent transfers; the KEEP BOTH fixture asserts no slot collision across two devices.
5. **No `es_savestates.cfg` ships** → #10 creates it *and* moves RetroArch's `savestate_directory`; rehearsal gate 9 with the three questions of §3.11.
6. **`core_build` not on the device** → #21 emits `/usr/share/rocknix/core-pins` at image build; ES passes emulator/core at exit [S03 §9].
7. **`BACKUPPATH == RESTOREPATH`** → assumed [S03 §9]. Split roots: two-way reconciliation **refuses with a clear message**; the shipped config documents split roots as a restore-elsewhere feature [S33], so a **one-way import** is preserved as a separate operation that writes no agreement and retains overwritten destination data (credit `gpt_peer_review-r3.md` §2.7).
8. **Standalone layouts** → the declared unit table (§3.1) covering exactly the allowlist's special dirs [S32]; containers present as one row; a conflict on a multi-file save presents as one decision over the whole map.
9. **480×320** → layout at 480×320 first; frames at both sizes; RG351M recognition test (gate 8).
10. **Two devices online at once** → not enforced; the lock is per device; `--backup-dir` plus lineage (agreement mismatch → fork next pass) is the net; gate 6 measures the mechanism; the audit log shows violations. Accepted per the futro [S05 §5].
11. **The round-trip suite has never run** → repair the harness (§11, F4), run on GENERIC_X64 against WebDAV and MinIO before enforce ships; add the manifest step [S04 §3.6], the two-device both-sides-changed step [S05 §5], the exit-pass fork-refusal fixture, and the churn-termination fixture.

## 7. Unknown unknowns — the failure and the cheapest experiment that exposes it

- **Classification bugs in our own engine.** The most dangerous unknown is the one we ship. Cheapest exposure: **shadow mode on the maintainer's real devices** (gate 5) — classify and log for a week beside the shipped paths; every wrong verdict appears in the log before it can touch a byte.
- **A JSON reader in ES is asserted, not shown.** The futro's build-vs-adopt table claims "pugixml/JSON already in ES" [S05]; the corpus embeds no ES JSON parser. Cheapest exposure: grep the ES tree for the JSON library before #22's output format is frozen; fall back to a trivial line-oriented format the wizard parses in fifty lines.
- **Clock skew making `captured_local` misleading.** `clock_synced` exists for this [S03 §6]; the census measures how often devices boot unsynced; the wizard renders the warning rather than trusting the time.
- **Store growth on a small card.** Worst case ≈ 3 × (tens of KB states + 64 KB SRAM) per unit; trivial — but the census measures real growth, and the count selector is the bound [S02].
- **A same-device-id manifest fork (cloned card).** Warn and refuse — fail closed; no generation-counter machinery (credit `claude_peer_review-r3.md` §6). Edge case; the audit log will show if it ever happens.

## 8. What must be proven on hardware before any of it is built — in order

0. **No hardware:** repair the harness (F4); run the pure classifier fixtures (member-map fork; move inference; stale tombstone vs new occupant; never-agreed-ask; unknown-both).
1. **#19 bench** (H700 ×2 control → cross-chipset → loud/silent) — before the badge is designed.
2. **bisync spike** (loopback WebDAV dry-run → Dropbox from the RG35XX SP) — before the transport choice.
3. **Zombie-auto reproducer on H700**: launch a numbered slot while the shipped boot pair runs; observe the auto handling and the copy utility's timestamp behaviour [S38], [S35] — validates the race the lifecycle gate closes.
4. **Exit-pass evidence-read cost on H700**: spawns, round trips, seconds for the scoped listing and the hashless scoped download — settles read-before-write vs the verified-only fallback (§3.3).
5. **Shadow census** on the maintainer's library, one week, both devices — before enforce.
6. **`--backup-dir` race fixture** on Dropbox and WebDAV with the three-outcome contract (§3.8).
7. **Deletion/compaction convergence fixtures**: churn termination across three passes on two devices; highest-slot delete propagation; stale tombstone meets a different occupant.
8. **RG351M 480×320 recognition test** with real thumbnails.
9. **#10 launch-behaviour rehearsal** on H700 (§3.11's three questions).
10. **The sequential two-device offline fork** (agree H₀; B publishes Hᵦ; A plays offline and exits) — pass condition: A's exit pass uploads nothing, both heads unchanged, the badge shows one conflict; then resolve and verify the loser's `operation.json`. This is AC (a)'s constructed fixture (credit `gpt_peer_review-r3.md` §2.1).

## 9. Load-bearing vs optional

**Load-bearing** (wrong = unsafe milestone): identity/agreement/classifier including equality-writes-agreement, member maps, move inference; read-before-write on every path; the checked ES adapter; the lifecycle gate and lock order; the retention store's self-contained `operation.json`; fail-closed absence with tombstones for pure deletes; the pending-operation record; the three day-one filings the engine must not inherit (F1–F3).
**Optional / later**: bisync as transport; #10 (last, gated); the badge's severity; the restore tool (V1 ships only the store); remote sibling pruning cadence; cross-device resolution receipts (V2 — the ordinary outcome is correct and retained without them; credit `claude_peer_review-r3.md` D5); the move hook (fidelity only; the delete hook is the load-bearing one).

## 10. What is not built

No undo control in V1 (maintainer). No SQLite index — all four reviews converge; #20's open question is answered: no. No vector clocks or generation counters beyond fail-closed warn on a same-id manifest fork. No protected-publication/two-phase commit — the one-player model does not earn it on a 5 s path. No full staging mirror — blind to same-size changes on hashless backends; candidate-scoped reads. No semantic binary merging. No 99-slot cap — 99999 exists; the adapter owns −99. No kid/kiosk resolver. No progress heuristics selecting a winner — the cardinal rule [S17]. No daemon — systemd units and ES calls only [S01]. No move hook justified by lineage. No `--include`-based manifest transport. No probe replacing `ip route` — D-CLOUD-028 [S06]; a literal-IP endpoint can use `ip route get`, a hostname without a default route is unreachable anyway (credit `claude_peer_review-r3.md` D8).

## 11. Day-one filings (bycatch, not baggage)

- **F1 — `RCLONEOPTS` without `--filter-from` bypasses the allowlist.** A non-empty `RCLONEOPTS` replaces the default option set *including* `--filter-from` [S29 `backup_game_saves`]; a user edit then syncs `/storage/roms` with only `--exclude=bios/**`. Fix: always append `--filter-from`, asserted non-empty at the point of use (blindspot 24's rule [S07]). (Kept from `kimi-revised_plan-r2.md`; verified by `gemini_peer_review-r3.md` §3.)
- **F2 — The saves tier admits conflict artifacts and transients.** `+ /savestates/**` takes `.state.auto.bak`; `+ /**/*.srm` takes `X (conflicted copy).srm` [S32]; the shipped scripts carry no exclusion [S29], [S30] — D-CLOUD-022's fix reached only the content tier. Add scoped exclusions to the defaults (`- /savestates/**/*.bak`, `- /**/*conflicted copy*`, `- /**/*.sync-conflict-*`) and enforce them in the engine's code, not only in the filter file (user rules precede defaults [S31]).
- **F3 — Exit-code typing.** rclone's 3/4 collide with the scripts' reserved meanings; `clean_exit` stamps any code [S29]. The engine emits typed outcomes (§3.3).
- **F4 — The round-trip harness cannot pass as embedded, and would harm a configured device.** It writes `rclone.conf` wholesale before asserting the first remote and never restores it; asserts `{device_id}/{ARCHIVE_NAME}` where the uploader stamps undated names as `${stamp}-${base}` [S29]; reads the archive back at the original path where restore writes the dated name [S30]; looks for `*-*_BACKUP.tar.gz` the fixture never creates [S36] (credit `claude_peer_review-r3.md` §3 item 13). Fix: back-up-and-restore around `rclone.conf`; assert the first remote against the merged config; align archive-name expectations; reconcile the content fixture with D-CLOUD-019's ES-declared membership (credit `mistral-revised_plan-r2.md` via `gpt_peer_review-r3.md` §4).
- **F5 — Boot liveness still pings google.com** [S35] — pre-existing; filed on #7 [S04 §3.7]; the engine's boot pass replaces it rather than patching it.
- **F6 — IA rev 5 text**: the "checked, not assumed" paragraph is wrong about `getNextFreeSlot()` for the auto-only case [S02] vs [S37]; the trigger, the retention default, and the done-page wording change per §3.4.

## 12. Gaps surfaced to the orchestrator

Not embedded, and depended on: `GuiSaveState.cpp` (the delete hook's attach point), `SaveState.h`/`SaveStateRepository.h` (default arguments), `Paths.cpp`, and the filesystem copy/rename utilities (timestamp behaviour for gate 3). rclone 1.75.0 documentation or source for bisync, `--backup-dir`, `--files-from`, and filter ordering (gates 0, 2, 6). ES startup ordering relative to network readiness, and the `autostart/102-cloud-saves` handoff (the boot pass moving under ES). `setsettings.sh` and the shipped `retroarch.cfg` (`savestate_directory`, `savestate_auto_save`; the #10 two-consumer layout; auto-state frequency). `cloud_sync.conf.defaults`, `cloud_sync-rules.txt.defaults`, the content scripts, `cloud_setup`, `backuptool`, `tools/cloud-test-backend`. The four round-2 plans themselves (including `kimi-revised_plan-r2.md`) are not embedded; this plan restates its own positions and never relies on them as evidence.

## 13. Credits

From `gpt_peer_review-r3.md`: read-before-write on the exit pass (the five-step fixture); the retention contract and its reader test; coherent member maps; split-root import preserved; the content-fixture reconciliation. From `claude_peer_review-r3.md`: the D2/D3/D4/D6/D7 settlements; equality-writes-agreement as the schema's sharpest gap; cloud-side compaction under D-CLOUD-030's wording; the store's non-disposable rule; the staging-name regex check; the harness defect list. From `gemini_peer_review-r3.md`: the budget fallback rule; the two named kill points; the deletion-propagation push that the maintainer's amendment settles. From `mistral_peer_review-r3.md`: `kind: container`; the gate-table shape; the IA-text corrections. Kept from `kimi-revised_plan-r2.md`: the three shipped hazards (F1–F3); write-only-on-change capture; the corpus-vs-council table; the churn fixture; "a deliberately restored file is a new version, not a stigmatized one" — a restore from the store is an ordinary new version to the classifier.

---

## `corpus.provenance.json`

```json
{
  "artifact": "kimi-revised_plan-r3.md",
  "role": "council member, round-3 revised approach",
  "corpus_mode": "verbatim embedded read-at-time corpus supplied by Council Facilitator council-facilitator@1.2.0",
  "source_count": 42,
  "manifest_read_timestamp_utc_as_supplied": "2026-09-05T17:32:51Z",
  "member_filesystem_access": false,
  "member_independently_reread_files": false,
  "member_independently_rehashed_files": false,
  "member_executed_commands_or_hardware_tests": false,
  "hash_basis": "sha256 values copied from the supplied per-source headers; verified at embed time by the Facilitator, not recomputed by this member",
  "citation_mapping": "S01 through S42 correspond to the ordered, same-index source_file_paths and source_file_hashes arrays",
  "reviewed_artifacts": [
    "claude_peer_review-r3.md",
    "gemini_peer_review-r3.md",
    "gpt_peer_review-r3.md",
    "mistral_peer_review-r3.md"
  ],
  "reviewed_artifact_hashes_provided": false,
  "own_prior_revision_embedded": false,
  "maintainer_amendments": {
    "source": "orchestrator brief embedded in this prompt",
    "separate_declared_path": null,
    "sha256": null,
    "applied_as_authoritative": true
  },
  "peer_material_use": "Judged on merits against the embedded corpus and the maintainer's two decisions; not treated as evidence about councils, models, or this deliberation.",
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
      "reason": "The load-bearing delete hook's attach point is uncited in the corpus; default arguments and copy timestamp behaviour (the zombie-auto trace) are not inspectable from the excerpts.",
      "declared_source_path": null,
      "sha256": null
    },
    {
      "material": "rclone 1.75.0 documentation or source for bisync, --backup-dir, --files-from, and --filter/--filter-from ordering",
      "reason": "Gates 0, 2 and 6 rest on behaviour the corpus does not contain.",
      "declared_source_path": null,
      "sha256": null
    },
    {
      "material": "ES startup ordering relative to network readiness and the autostart handoff",
      "reason": "The boot pass moves under ES scheduling; the corpus does not show when ES is up or how 102-cloud-saves would hand off.",
      "declared_source_path": null,
      "sha256": null
    },
    {
      "material": "setsettings.sh, shipped retroarch.cfg and es_systems.cfg",
      "reason": "RetroArch's savestate_directory and savestate_auto_save decide the #10 two-consumer layout and the auto-state frequency claim.",
      "declared_source_path": null,
      "sha256": null
    },
    {
      "material": "cloud_sync.conf.defaults, cloud_sync-rules.txt.defaults, cloud_content_backup, cloud_content_restore, cloud_setup, backuptool, tools/cloud-test-backend",
      "reason": "Cross-tier and upgrade claims referenced by this plan cannot all be checked from the embedded callers.",
      "declared_source_path": null,
      "sha256": null
    },
    {
      "material": "The four round-2 plans, including kimi-revised_plan-r2.md",
      "reason": "Not embedded; this plan restates its own positions and relies on none of them as evidence.",
      "declared_source_path": null,
      "sha256": null
    }
  ],
  "missing_source_policy": "No missing source paths, hashes, file contents, or execution results have been fabricated."
}
```

=== END kimi-revised_plan-r3.md ===

=== START mistral-revised_plan-r3.md ===

# Revised approach — the foundation I would build

## 1. Executive summary

I would build from `claude-revised_plan-r2.md` as the editing baseline, with the following amendments:

1. **Retention store** — add the discard sidecar of §1.2 from `kimi_peer_review-r3.md` to satisfy the maintainer’s “time machine” requirement.
2. **Deletion propagation** — adopt `gpt-revised_plan-r2.md`’s version-specific retirement records for explicit deletes, conditional on the ES delete hook existing.
3. **Exit path** — keep `claude-revised_plan-r2.md`’s fresh evidence before upload, but add `gemini-revised_plan-r2.md`’s deferral as the measured fallback if the hashless download exceeds the budget.
4. **Split roots** — adopt `gpt-revised_plan-r2.md`’s one-way import destination for `BACKUPPATH ≠ RESTOREPATH`.
5. **LAN reachability** — adopt `gemini-revised_plan-r2.md`’s probe for LAN-only remotes.
6. **Manifest transport** — keep `claude-revised_plan-r2.md`’s manifest-last commit, but drop spawn A if Gate 6 measurement says so.
7. **Schema amendment** — use `mistral-revised_plan-r2.md`’s inline-JSON form for the D-CLOUD-031 refinement, with the content errors corrected.
8. **Recovery route** — move `gpt-revised_plan-r2.md`’s “minimal native recovery route” to the separate restore-tool issue as its seed.

The result is `claude-revised_plan-r2.md`’s architecture with `gpt-revised_plan-r2.md`’s deletion semantics, the maintainer’s retention contract, and every number still gated on hardware.

---

## 2. Identity, lineage, and agreement

### 2.1 Identity

- **A save version is the sha256 of its stored bytes** (D-CLOUD-030). Slot and file name are attributes.
- **Duplicates are compacted after re-verification** (D-CLOUD-030): the higher-numbered copy is removed, only after both files are re-read and the hashes found equal, and the removal is written to the audit log.
- **The thumbnail is not part of the identity** (schema §1). It travels with the state by path; `copyToSlot` already moves both (S38).

### 2.2 Lineage

- **Per device, per path**: the current hash and the hash it replaced at that path on this device (`replaces`), with when, which device, which core and core build.
- **Agreement, per device, per path**: the hash this device last uploaded or downloaded for that path — the last version both sides agreed on, *A*. Kept locally under `/storage/.cache/cloud_sync/`, never synced (schema §2).

### 2.3 Agreement on verified equality

- **Establish agreement on verified equality as well as transfer** (gpt §4.1). The signed schema never writes agreement on verified equality (S03 §9); the first change to any save on a device upgraded to the engine then classifies as “never agreed → ask” (S03 §3). This is an upgrade that is not invisible (S11).
- **Write agreement if absent** (kimi §4.3). A device that upgrades with L = C for every file and no agreement must not prompt on the first change.

### 2.4 Conflict test

Per path, with *L* the local hash, *C* the cloud’s, *A* the agreed one:

| L vs C | A known? | L vs A | C vs A | Verdict | Action |
|---|---|---|---|---|---|
| equal | — | — | — | identical | nothing |
| differ | yes | equal | differ | cloud changed | download, no prompt |
| differ | yes | differ | equal | device changed | upload, no prompt |
| differ | yes | differ | differ | **divergent** | wizard |
| differ | no | — | — | **divergent** (never agreed) | wizard — conservative |
| only one side has it | — | — | — | one-way | transfer, no prompt |

Refinements:
- **A move is not a conflict.** Same hash under a new path is a *move*: no conflict, no new version.
- **Never agreed means ask.** Two pre-existing copies with different content and no shared history are exactly the case the player must decide; there is no recency to fall back on (S01).
- **Auto states are the commonest conflict.** `game.state.auto` is written at exit wherever RetroArch’s auto-save is enabled, so two devices playing the same game diverge on it every session. The wizard should expect this pair most often and make it the fastest decision on the page.

---

## 3. Manifest shape

### 3.1 Shape

- **One JSON file per device at `savestates/.rocknix/manifest-<device-id>.json`** (D-CLOUD-031, refining D-CLOUD-017). Each device writes only its own; readers take the union.
- **Describes in-game saves as well as states** by path relative to the sync root. The allowlist passes nothing beside an in-game save except the save itself (S32), and XML is excluded outside `savestates/` (S31).
- **The local agreement record is kept unsynced** under `/storage/.cache/cloud_sync/agreed.json`, same entry shape minus provenance, one per path, holding the hash this device last uploaded or downloaded (schema §2).

### 3.2 Fields

Top level:

| Field | Type | Meaning |
|---|---|---|
| `schema` | int | `1`. Readers refuse a higher number and treat a missing one as `0` (pre-schema). |
| `device.id` | string | `cloud_device_id` — stable, seeded from the permanent hardware address (D-CLOUD-009). |
| `device.label` | string | `cloud_device_id --label`, folder-safe (`Anbernic-RG35XX-SP`). |
| `device.model` | string | `/proc/device-tree/model`, for display (`Anbernic RG35XX SP`). |
| `device.family` | string | `HW_DEVICE` from `/etc/os-release` (`H700`). |
| `device.os_version` | string | `OS_VERSION` from `/etc/os-release`. |
| `generated_at` | string | UTC, ISO 8601, when this file was last written. |
| `entries` | object | path → entry, path relative to the sync root (`/storage/roms`). |

Per entry:

| Field | Type | Meaning |
|---|---|---|
| `kind` | `"state"` \| `"auto"` \| `"save"` \| `"container"` | numbered savestate; the `.state.auto` resume point; an in-game save (`.srm`, `.sav`, memcard, …); a shared container (VMU, memcard set). |
| `sha256` | string | **The identity of this version** (D-CLOUD-030): sha256 of the bytes as stored — compressed for a state (`savestate_file_compression = "true"`; files begin `#RZIPv`), raw for a save. |
| `size` | int | bytes as stored. A cheap pre-check before hashing, never a substitute for it. |
| `mtime` | string | the file’s modification time, UTC ISO 8601 (ext4 here; second resolution). What rclone compares by; recorded so a listing can be matched without a download. |
| `captured_at` | string | UTC ISO 8601, when this entry was written. |
| `captured_local` | string | the same instant in the device’s local time with offset (`2026-09-05T01:32:46-04:00`) — the wizard shows local time, and the offset is what makes two devices’ local times comparable. |
| `clock_synced` | bool | `timedatectl show -p NTPSynchronized` at capture. A device that booted without a network has a wrong clock; the wizard says so rather than trusting the time. |
| `system` | string | ES system name (`gba`). |
| `rom` | string \| null | the ROM file name with extension, from ES’s game path. For a state this is what `{{romfilename}}` stood for; it is recorded rather than re-derived so a rename of the state cannot detach it from its game. `null` for a container. |
| `emulator` | string | ES’s resolved emulator (`retroarch`, `duckstation`, …). |
| `core` | string | the libretro core name (`mgba`); for a standalone emulator, the emulator name again. Never empty (ES does the same in `SaveStateConfig::getDirectory`). |
| `core_build` | string | our own `PKG_VERSION` pin for that core’s package (D-CLOUD-017), or `"unknown"`. The thing two devices compare to know whether a state will load (#19). |
| `core_display_version` | string \| null | `display_version` from `/usr/lib/libretro/<core>_libretro.info` (`1.61` for snes9x), for humans; never compared. |
| `slot` | int \| null | attribute, not identity. `0` for `game.state`, `n` for `game.staten`; `null` for `auto` and `save`. |
| `screenshot` | string \| null | remote-relative path of the PNG (`savestates/gba/X.state1.png`), so the wizard can fetch the cloud side’s picture with one small copy and never has to derive it from the state’s name. `null` for a save — never a substitute image (S02). |
| `replaces` | string \| null | the sha256 this version replaced at this path on this device, or `null` for the first version seen. One step of lineage; the audit log holds the rest (schema §2). |
| `remote_hash` | object \| null | `{"type": "dropbox", "value": "…"}` as reported by `rclone lsjson --hash` after the upload that carried this version; `null` until then. Lets a later listing say "the cloud still holds this version" without a download. Backend-specific by construction (Dropbox offers only its own type; WebDAV none), so it is only ever compared against a listing of the same remote. |

Rules the fields obey:
- **Absent is not zero.** A field that could not be determined is `null` or `"unknown"`, never `0` or `""`. `clock_synced: false` and `core_build: "unknown"` are values the wizard renders, not errors (S21 thread; `upgrade-and-install.md`).
- **Nothing stamps a file it did not write.** An entry is written by the device that produced the save, at the moment it is produced. A file with no entry anywhere is `unknown` in every provenance field and still has a hash, computed locally, so the conflict test (schema §3) works for it.
- **A move is an update to the key, not a new entry.** After ES renumbers, the capture step finds the same hash under a new path and moves the entry; `replaces` and `captured_at` are unchanged.

### 3.3 Schema amendment

Refine D-CLOUD-031 with the following inline-JSON amendment (mistral’s form, content corrected):

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
      "sha256": "…64 hex…",
      "size": 50816,
      "mtime": "2025-07-29T05:09:49Z",
      "captured_at": "2025-07-29T05:09:50Z",
      "captured_local": "2025-07-29T01:09:50-04:00",
      "clock_synced": true,
      "system": "gba",
      "rom": "Mega Man & Bass (USA).gba",
      "emulator": "retroarch",
      "core": "mgba",
      "core_build": "e31759b24e7…",
      "core_display_version": "0.11-dev",
      "slot": 1,
      "screenshot": "savestates/gba/Mega Man & Bass (USA).state1.png",
      "replaces": null,
      "remote_hash": { "type": "dropbox", "value": "…" }
    },
    "savestates/gba/Advance Wars (USA) (Rev 1).state.auto": {
      "kind": "auto",
      "sha256": "…",
      "size": 43011,
      "mtime": "2025-07-29T04:51:38Z",
      "captured_at": "2025-07-29T04:51:40Z",
      "captured_local": "2025-07-29T00:51:40-04:00",
      "clock_synced": true,
      "system": "gba",
      "rom": "Advance Wars (USA) (Rev 1).gba",
      "emulator": "retroarch",
      "core": "mgba",
      "core_build": "e31759b24e7…",
      "core_display_version": "0.11-dev",
      "slot": null,
      "screenshot": "savestates/gba/Advance Wars (USA) (Rev 1).state.auto.png",
      "replaces": "…the previous auto state's sha256…",
      "remote_hash": null
    },
    "gba/Advance Wars (USA) (Rev 1).srm": {
      "kind": "save",
      "sha256": "…",
      "size": 65536,
      "mtime": "2025-07-29T04:51:39Z",
      "captured_at": "2025-07-29T04:51:40Z",
      "captured_local": "2025-07-29T00:51:40-04:00",
      "clock_synced": true,
      "system": "gba",
      "rom": "Advance Wars (USA) (Rev 1).gba",
      "emulator": "retroarch",
      "core": "mgba",
      "core_build": "e31759b24e7…",
      "core_display_version": "0.11-dev",
      "slot": null,
      "screenshot": null,
      "replaces": "…",
      "remote_hash": null
    },
    "dc/shared/savefiles/": {
      "kind": "container",
      "sha256": "…",
      "size": 131072,
      "mtime": "2025-07-29T04:51:39Z",
      "captured_at": "2025-07-29T04:51:40Z",
      "captured_local": "2025-07-29T00:51:40-04:00",
      "clock_synced": true,
      "system": "dc",
      "rom": null,
      "emulator": "flycast",
      "core": "flycast",
      "core_build": "…",
      "core_display_version": "…",
      "slot": null,
      "screenshot": null,
      "replaces": "…",
      "remote_hash": null
    }
  }
}
```

---

## 4. Detection

### 4.1 Detector

- **The detector is our own three-way classifier, not bisync.** Bisync is demoted to a candidate transport; the spike has not run (S01).
- **The detector never runs `--resync` on its own** (S05 futro AC (b)); use `--recover` and `--resilient`.
- **The bisync workdir stays at its default `/storage/.cache/rclone/bisync`** (persistent, `HOME=/storage`) and is named in the script so a future change of `HOME` cannot move it under `/var` (S05 futro AC (d)).

### 4.2 Classification

- **Complete member-map comparison** (claude §2.3.1, kimi §4.3, gpt §4.2). A unit is a map of path → hash over its complete member set. If any member differs, the unit differs; if the member set differs, the unit differs.
- **A thumbnail anomaly is not a progress fork when the state bytes are identical.** D-CLOUD-030 expressly excludes the thumbnail from version identity (S03 §1).
- **A retirement for X encounters Y at a relevant path → conflict or stale operation; never treat the record as permission to remove Y** (gpt §4.3). A stale retirement record cannot remove a path’s later occupant.

### 4.3 Exit path

- **Fresh evidence before upload** (claude §2.5.2, gpt §5.2). The exit path reads cloud evidence for the changed units before uploading. On a hash backend: `lsjson --hash` scoped to the changed paths. On a hashless backend: manifest claims plus download-and-hash.
- **Defer hashless verification if it exceeds the budget** (gemini §4.2). If the download-and-hash exceeds 5 seconds, defer verification to the boot/menu full pass, leaving the exit push as a fast-path upload only. The card must say “waiting” rather than “safe in the cloud”.
- **Spawn A: compute the backend hash locally** (claude §2.5.2 step 4). `rclone hashsum <type>` or busybox `md5sum` on md5 backends, so the *next* exit push for the same game can confirm C = A without a listing. Without it, a second changed session before any full pass defers.
- **Spawn count:** 0 idle, 3–4 changed (claude §2.5.2). The idle path needs no network answer at all; the changed path is measured at Gate 6.

### 4.4 Boot sync

- **Boot sync under ES’s scheduling** (all four). The race with a live session is necessary (S35, S41); nothing embedded says when ES is up relative to the network or how `autostart/102-cloud-saves` hands off. That handoff is a gap to name (§9).
- **Queue-and-badge for unattended passes** (all four). IA rev 4 says “a sync that reports conflicts opens the wizard” (S02); all four queue for boot/exit. This is an IA rev 5 item.

---

## 5. Resolution

### 5.1 Wizard

- **Cloud is always the left column** (S02 rev 3).
- **KEEP LEFT / KEEP RIGHT / KEEP BOTH** (S02 rev 2). KEEP BOTH is savestates only via ES’s own `getNextFreeSlot()`; in-game saves are shown disabled with a reason.
- **KEEP BOTH on an auto-state conflict uses a deterministic rule** (claude §2.3.3, gpt §7.1 criterion 7, mistral §1.3). The device’s resume point stays at `.state.auto`; the cloud copy becomes a numbered state with its PNG. The done page names where the cloud copy went.
- **Nothing transfers until COMPLETE** (S02). The walkthrough is reversible right up to the end; quitting partway leaves both sides exactly as they were.
- **Non-conflicting files are applied before the walkthrough starts** (S02). This is what makes the slot choice safe. Once every cloud-only file has been downloaded, free-on-device and free-on-both are the same thing, and a merge cannot pick a slot the cloud is already using.
- **The done page names each discarded copy per game** (S02 rev 4 AC). The audit line for it is written *before* the apply step deletes anything.

### 5.2 Settings

- **Review decisions before applying** — off by default; turns the summary from a step everyone pays for into one the careful can opt into.
- **Keep discarded saves** — on by default; retains the losing copy so a choice can be undone. A **count selector** sets how many to keep, and stays visible but unselectable while the toggle is off (dim, don’t hide — the capability should be discoverable before it is enabled). The fixed count is also the retention rule, so discarded copies cannot grow without bound on card storage.

---

## 6. Retention and recovery

### 6.1 Retention store

- **Discard store at `/storage/.cache/cloud_sync/discarded/<path>/<sha256>`** (claude §2.4.1). PNG travels with the state (S03 §4).
- **Sidecar per retained copy** (`<sha256>.json` beside it), written *before* the destructive step, carrying:
  - the copy’s manifest entry verbatim (kind, sha256, system, rom, slot, `origin`/device, core, core_build, captured_at/local, clock_synced, screenshot path + sha256);
  - `reason` ∈ {`conflict-loser`, `superseded-by-download`, `compaction`, `es-delete`};
  - `winner` = {side, path, sha256, device};
  - the run/transaction id;
  - the wizard’s decision text.
- **Retention count is per save unit** (gpt §2). A global count of 3 across the whole store would be consumed by three routine one-way downloads of unrelated games; the primary case — “I picked the wrong side for *this* game” — would be gone.
- **Transaction preimages and unresolved candidates are exempt from the count** (gpt §6.3, §8). A retention sweep must not evict the only copy of an unreviewed head.
- **The store’s home is not settled by “outside the sync tree”** (gpt §1.2). The IA doc’s own convention is that `.cache` contents *self-invalidate* (`repo/docs/conflict-wizard-ia.md` [V]); without this sentence, some future cleanup will correctly-by-convention delete the discard store. Decide the store’s home alongside its shape.

### 6.2 Recovery tool

- **The restore tool is a separate issue** (maintainer decision). It is the wizard’s own compare-and-choose surface pointed at a game’s retained past versions, reached from outside the moment of resolution.
- **Move `gpt-revised_plan-r2.md`’s “minimal native recovery route” to the new issue as its seed.** The design work is not wasted — it is the tool’s shape.

---

## 7. Deletion propagation

### 7.1 Explicit deletes

- **Version-specific retirement records** (gpt §4.3). An observed ES delete or move produces a receipt naming the exact version; a detached card produces no record → fail closed; a deliberate delete produces one → propagates.
- **Receipts are propagated as copy-verify-delete into a dated sibling** (D-CLOUD-026). The sibling is a dated directory under the sync root, never inside it (D-CLOUD-014).
- **The delete hook is the one load-bearing hook** (D1). ES’s delete path is the proposed home of explicit-delete retirement records. If the hook does not exist, reconciler-observed move/compaction receipts still cover D-CLOUD-030, and explicit deletes fall back to resurrection + hold-back until the hook ships.

### 7.2 Compaction

- **Direct remote compaction** (claude §2.3.2). After a renumber uploads `state3 = H`, the cloud holds `state3` and `state5` with equal hashes; retiring the cloud’s higher slot by copy-verify-delete into the sibling terminates the loop with no journal at all.
- **The renumber signature is also inferable by hash.** The hash agreement says was at slot k is now at slot k−1.

---

## 8. Adapter over ES’s slot primitives

### 8.1 Defects

- **`getNextFreeSlot()` returns −99 for an auto-only repository** (S37). The auto state sits in the vector with slot −1, the 99999→0 scan finds nothing.
- **`copyToSlot()` returns true whatever `renameFile`/`copyFile` did** (S38). The function executes `Utils::FileSystem::renameFile(...)` or `copyFile(...)` and unconditionally hits `return true;` at the end without checking their success.
- **`makeStateFilename(fullPath = true)` derives the destination from the source’s parent** (S38). A staged cloud state’s copy would land in the stage directory.

### 8.2 Adapter contract

- **Compute destinations from the config templates itself.**
- **Allocate from `firstslot` for an auto-only repository.**
- **Distinguish:**
  - auto-only, supported repository: use its valid first numbered slot;
  - unsupported/disabled repository: refuse;
  - unexpected allocator failure: refuse.

---

## 9. Gaps surfaced to the orchestrator

- `GuiSaveState.cpp` — the delete path is now the proposed home of explicit-delete retirement records (D1).
- `SaveState.h`/`SaveStateRepository.h` — default arguments.
- `Paths.cpp`, `setsettings.sh` — RetroArch `savestate_directory`, `savestate_auto_save`.
- rclone 1.75.0 documentation or source for `--backup-dir` with `copy`, `lsjson --files-from`, `hashsum` on local paths, Dropbox hash type on local files.
- `docs/es-ui-style-guide.md`.
- Current issue bodies with edited ACs.
- Executed hardware, backend, interruption, compatibility, retention-reader, and round-trip results.

---

## 10. What should not be built

- A native undo surface in the resolution flow (gpt §8, §13) — descoped by the maintainer.
- Cross-device resolution receipts synced through manifests (gpt §4.4) — V2; the ordinary outcome is correct and retained (D5).
- The KEEP BOTH auto sub-choice (kimi §4.4 amendment 3) — one more press the maintainer has said not to add (D3).
- Move-observation hooks justified by `replaces` fidelity (kimi §4.1) — keep the delete hook for receipts; treat the move hook as optional (D4).
- `--include`-based manifest transport (gemini §2.5) — a silent no-op transfer per S09; use `--files-from` (D7).
- A probe replacing `ip route` (gemini §4 item 4) — contradicts D-CLOUD-028 (D8).
- Per-file “any member divergent” unit classification (gemini §2.1) — misses the disjoint-member fork (D1).
- “Conservative resurrection” of compacted duplicates (mistral §1.4) — does not converge (D4).
- Withdrawing D-CLOUD-029 by assertion (mistral §2) — the row stands; the maintainer’s toggle posture is compatible with it and needs no row.
- A SQLite index — all four agree; say so on #20 and close the question.
- A generation counter that does more than fail closed on a same-ID manifest fork (gpt §3.3) — a cloned card is an edge case; warn and refuse (kimi §4.1 rule 5) is enough.
- Anything that reads a retention count as permission to evict an unreviewed head — every plan’s store must exempt transaction preimages and pending candidates (gpt says it; the others must).

---

## 11. Decision register amendments

### D-CLOUD-031-A (refines D-CLOUD-031)

**The save manifest is one JSON file per device at `savestates/.rocknix/manifest-<device-id>.json`, describing in-game saves as well as states by path relative to the sync root; the local agreement record is kept unsynced under `/storage/.cache/cloud_sync/agreed.json`.** Refines D-CLOUD-031. Forced by the allowlist: nothing beside an in-game save syncs, and XML is excluded outside `savestates/`. The manifest carries `kind: "container"` for shared VMU/memcard units, with `rom: null`.

### D-CLOUD-031-B (refines D-CLOUD-031)

**Establish agreement on verified equality as well as transfer.** The signed schema never writes agreement on verified equality (S03 §9); the first change to any save on a device upgraded to the engine then classifies as “never agreed → ask” (S03 §3). This is an upgrade that is not invisible (S11). Write agreement if absent (kimi §4.3).

### D-CLOUD-030-A (refines D-CLOUD-030)

**After a sync, two slots of one game holding the same hash are compacted: the higher slot is removed, only after both files are re-read and the hashes found equal, and the removal is written to the audit log. Propagate as moves into dated siblings, capped per run.** Refines D-CLOUD-030. Direct remote compaction converges without any receipt.

### D-CLOUD-029-A (refines D-CLOUD-029)

**The game-exit sync reads cloud evidence for changed units before uploading.** The exit path reads cloud evidence for the changed units before uploading. On a hash backend: `lsjson --hash` scoped to the changed paths. On a hashless backend: manifest claims plus download-and-hash. Defer hashless verification if it exceeds the budget, leaving the exit push as a fast-path upload only. The card must say “waiting” rather than “safe in the cloud”.

### D-CLOUD-027-A (refines D-CLOUD-027)

**The discard store is at `/storage/.cache/cloud_sync/discarded/<path>/<sha256>`, with a `<sha256>.json` sidecar per retained copy carrying the full comparison context.** The store’s home is not settled by “outside the sync tree”; decide it alongside the sidecar shape. Retention count is per save unit, with exemptions for transaction preimages and unresolved candidates.

### D-CLOUD-024-A (refines D-CLOUD-024)

**The wizard ships in the same feature drop as the cloud-sync revamp, with retention ON by default bounded by a count, and no undo control in V1.** The restore tool is a separate issue shaped as the wizard’s compare-and-choose pointed at retained versions.

---

## 12. What the amendments cost

- **`gpt-revised_plan-r2.md`** — Low. Delete “minimal native recovery” from §8 and §13; move §4.4’s resolution receipts and the “completed resolution” operation record to “may follow later”; keep the move/delete/compaction operation records (they are convergence, not lineage). Its store is the closest to the reader requirement; it owes one sentence: the frozen plan’s per-unit record is *retained beside the copies*, not disposed of on completion.
- **`claude-revised_plan-r2.md`** — Low. Add the discard sidecar (§1.2 from kimi); re-justify deletion propagation (§2, D1); its done-page sentence already exists via the futro ACs it carries.
- **`kimi-revised_plan-r2.md`** — Medium. Drop the KEEP BOTH auto sub-choice (D3). Add the discard sidecar; the `origin` data it needs is already in hand at discard time. Narrow the ops journal’s justification to deletion receipts (D4) — the `replaces`-fidelity argument is lineage depth the maintainer has set aside. Separately from the amendments, its exit pass fails the futro’s #22 AC (a) (D2).
- **`gemini-revised_plan-r2.md`** — Moderate. Add the discard sidecar; its “capped per run” on retirement propagation (§3, D-CLOUD-030-A) must be clarified — if the cap *drops* records it reintroduces non-convergence; `gpt-revised_plan-r2.md` §4.3’s rule is the right one: reaching a control-state limit stops mutation rather than silently discarding correctness state.
- **`mistral-revised_plan-r2.md`** — Moderate–high. Add the discard sidecar; correct the four errors in §4.4 before its content is safe to lift anywhere.

=== END mistral-revised_plan-r3.md ===
