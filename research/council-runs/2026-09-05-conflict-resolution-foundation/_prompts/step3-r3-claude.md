# Council — round 3, revised approach

You are one of five council members. You have each produced a revised approach
to the foundation for cloud-save conflict resolution in ROCKNIX, and the other
four have now reviewed all of them. The corpus is embedded above, unchanged and
hash-verified; those four reviews are injected below.

Now produce **your round-3 revised approach**: the foundation you would
actually build, having heard this second round of critique. This is the artifact
the council votes on next, so it must stand on its own — a reader should be able
to act on it without having read any analysis, review, or earlier revision.

## Anti-self-citation constraint

Reason about the substance on its merits, against the embedded corpus. Do not
treat the injected reviews as evidence about how councils, models, or this
deliberation behave.

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

## What this revision must do

Two revisions have closed the easy distance. What remains are the places where
the plans genuinely disagree, and the places where all four agree without the
corpus having settled the point. Both are dangerous, and this round exists to
deal with them rather than to polish prose.

- **Settle, do not average.** Where the reviews identified a substantive
  disagreement, take a position and give the reason. If the evidence does not
  yet exist, say which experiment settles it and what your plan does in the
  meantime under each outcome. Do not adopt a compromise that no reviewer
  argued for.
- **Separate what the corpus settles from what the council merely agrees on.**
  A position held by everyone and evidenced by nobody is the most expensive
  kind of error, because no reviewer is left to catch it. Mark those explicitly.
- **Concede what was refuted**, naming the reviewer and the file, and correct
  it. A revision that quietly drops a refuted claim is worse than one that owns
  it. Where a review misread you, say so and make the argument better.
- **Adopt what others got right**, crediting them by filename. You are not
  scored on originality.
- **Refuse what the problem does not earn.** This is a handheld running busybox
  with a five-second budget on a path the player watches. Where a reviewer or a
  plan proposes machinery beyond that, say so and cut it.
- **Keep the load-bearing separable from the optional.** Get the load-bearing
  parts wrong and the milestone is unsafe; the rest can follow later. Make the
  boundary explicit.
- **State decision changes explicitly.** If your approach requires reopening a
  decided register row, name the ID, state the change as a new refinement
  citing the old row, and give the argument. If it needs no reopening, say so.
- **Pay the amendments.** If your plan named an on-device undo surface as a
  version-one requirement, remove it and re-home its design to the separate
  restore tool. If it carries lineage, generation tracking or receipts deeper
  than one step back, justify each against the maintainer's stated primary
  case or cut it. State plainly what your retention store records, and whether
  a later restore tool could drive a picker from it.
- **Be honest about what is still unmeasured**, and name the experiment that
  settles each hypothesis about rclone, bisync, RetroArch, a backend, or the
  hardware.

Refer to members and artifacts by filename (for example `gpt-analysis.md`,
`kimi_peer_review-r3.md`), never by an invented ordinal.

## Injected peer reviews

=== START gemini_peer_review-r3.md ===

An analysis of the four revised approaches against the embedded corpus and the maintainer’s new authoritative constraints.

---

### 1. Costing the Amendments

The maintainer’s two rulings—reversibility is one step back with no V1 undo control, and the discard store must support a future "time machine" picker—directly invalidate parts of the proposed plans:

*   **`gpt-revised_plan-r2.md` over-scoped V1.** GPT explicitly demanded a "minimal native recovery route for retained decisions" in V1 (Section 8), arguing that SSH is not a console-first escape hatch. The maintainer explicitly descoped this: *"ships no undo control... Restoring a discarded copy becomes a separate tool."* GPT pays the cost of designing and demanding a UI surface that the maintainer rejected.
*   **`kimi-revised_plan-r2.md` and `mistral-revised_plan-r2.md` designed a discard store the future picker cannot read.** Mistral places discards in `/storage/.cache/cloud_sync/discarded/<stamp>/`. Kimi places them in `/discarded/<path>/<sha256>`. Because Kimi deletes the plan file after apply, and Mistral relies only on a timestamp, both drop the context required for the future picker (which device produced the copy, which side won the conflict, what core it belongs to). To survive the amendment, the discard store must write a metadata sidecar (e.g., `discard-meta.json`) alongside the retained bytes.
*   **`kimi-revised_plan-r2.md` abandoned a capability for an edge case.** Kimi’s plan states: *"V1 propagates no ordinary deletion... The one deletion is D-CLOUD-030's duplicate compaction."* Kimi relies on a "hold-back" flag to prevent resurrecting deleted files, explicitly refusing to delete them from the cloud to protect against the unmounted-card edge case. The maintainer ruled: *"abandoning a capability to buy it [safety from an edge case] needs a better reason than the edge case alone."* Kimi’s complete refusal to propagate recorded deletions is costed by this amendment.

### 2. The Real Disagreements

**Disagreement 1: Deletion Propagation vs. Unexplained Absence**
*   *The Split:* `kimi-revised_plan-r2.md` refuses to propagate deletions to the cloud, using a local "hold-back" flag instead. `gpt-revised_plan-r2.md` allows deletion propagation, but *only* via explicit receipts (verified ES moves/deletes), while failing closed on unexplained absence.
*   *Substantive or Wording:* Substantive.
*   *Resolution:* `gpt-revised_plan-r2.md` wins. The maintainer’s amendment explicitly states we should not abandon capabilities just for edge cases. Kimi built a robust receipt system (the ops journal) but stopped short of using it to actually delete remote files. We should use Kimi's receipts to execute a remote `copy-verify-delete` (into the dated sibling), fulfilling the capability while still failing closed on unrecorded absence.

**Disagreement 2: Concurrency and `--backup-dir`**
*   *The Split:* `kimi-revised_plan-r2.md` leans on `rclone copy --backup-dir` in both directions as the primary safety net for concurrent writes, assuming it will atomically archive the intervening head if a race occurs. `gpt-revised_plan-r2.md` points out that `--backup-dir`'s atomicity and behavior under concurrent writes on backends like WebDAV and Dropbox is entirely unproven.
*   *Substantive or Wording:* Substantive.
*   *Resolution:* `gpt-revised_plan-r2.md` is correct. Rclone's `--backup-dir` is a client-side directive; on backends without atomic server-side moves, a concurrent overwrite can still result in a torn or lost file. *Experiment to settle:* The two-device race fixture (Gate 7). I predict `--backup-dir` will *not* reliably preserve the intervening head on WebDAV, meaning the lineage check (which both plans adopt) is the true safety net, surfacing the lost update as a fork on the next pass.

**Disagreement 3: The `es_savestates.cfg` Launch-Behavior Migration (#10)**
*   *The Split:* `claude-revised_plan-r2.md` (via Kimi's summary) thought #10 could be deferred because flat-path collisions become visible conflicts. `kimi-revised_plan-r2.md` and `gpt-revised_plan-r2.md` correctly identify that shipping `es_savestates.cfg` alters emulator launch behavior, not just directories.
*   *Substantive or Wording:* Substantive.
*   *Resolution:* `kimi` and `gpt` are correct. Source `es/SaveStateConfigFile.cpp` proves that the compiled `Default()` sets `incremental = true`, `autosave = true`, and `racommands = true`. But the XML parser (lines 160+) defaults `autosave` and `incremental` to false, and hardcodes `emul->racommands = false;`. Shipping this file disables the `.auto` backup dance. It must be gated behind a real-device rehearsal.

### 3. Testing Load-Bearing Claims Against the Corpus

I verified the most critical claims made by the plans against the embedded sources:

*   **Claim:** `copyToSlot` ignores copy/rename return values and returns `true` unconditionally (`kimi-revised_plan-r2.md`).
    *   *Verification:* **TRUE.** Source 38 (`es/SaveState.cpp`), lines 240-264. The function executes `Utils::FileSystem::renameFile(...)` or `copyFile(...)` and unconditionally hits `return true;` at the end without checking their success. A checked adapter is absolutely mandatory.
*   **Claim:** `getNextFreeSlot` returns `-99` for an auto-only repository (`kimi-revised_plan-r2.md`, `gpt-revised_plan-r2.md`).
    *   *Verification:* **TRUE.** Source 37 (`es/SaveStateRepository.cpp`), lines 183-199. If only an auto state exists, `states.size()` is 1. The loop scans `for (int i = 99999; i >= 0; i--)`. Since the auto state has `slot == -1`, the loop finishes without a match and returns `-99`.
*   **Claim:** A non-empty `RCLONEOPTS` without `--filter-from` bypasses the allowlist (`kimi-revised_plan-r2.md`).
    *   *Verification:* **TRUE.** Source 33 (`cloud_sync.conf`) defines `RCLONEOPTS` including the `--filter-from` flag. Source 31 (`cloud_sync_helper`) merges user configs. If a user overrides `RCLONEOPTS` in their local config, the default `--filter-from` is lost. Because `cloud_backup` [S29] passes `RCLONEOPTS` directly to rclone, the allowlist is entirely bypassed. This is a massive shipped hazard.
*   **Claim:** The exit upload is `copy` with no `--update`, meaning it overwrites the cloud head of a fork (`kimi-revised_plan-r2.md`).
    *   *Verification:* **TRUE.** Source 29 (`cloud_backup`), lines 218-232. The `--recent` flag forces `BACKUPMETHOD="copy"` and adds `--max-age` and `--no-traverse`, but does *not* add `--update`. It is a blind overwrite.

### 4. What Each Plan Uniquely Has (To Lift Verbatim)

*   **From `kimi-revised_plan-r2.md`:** The exact breakdown of the ES primitive defects (`getNextFreeSlot` returning `-99`, `copyToSlot` returning unconditional `true`, `makeStateFilename` deriving from the source's parent). This proves beyond doubt that raw ES primitives cannot be used and a checked adapter is required.
*   **From `gpt-revised_plan-r2.md`:** The **lifecycle gate acquisition order**: *"1. A network worker takes the cloud lock non-blockingly. 2. It takes the lifecycle gate non-blockingly... 4. ES’s game session holds the lifecycle gate, performs local capture, releases it, and only then requests cloud work. 5. Capture never waits for the cloud lock."* This structurally eliminates the boot-sync vs. game-session race.
*   **From `claude-revised_plan-r2.md` (via Kimi):** Binding `agreed.json` to the 5-tuple of `{remote name, remote type, SYNCPATH, BACKUPPATH, RESTOREPATH}`. This ensures that changing a cloud folder or unlinking an account doesn't result in a mass false-agreement overwrite.
*   **From `mistral-revised_plan-r2.md`:** The explicit "What not to build" section, which serves as a strict out-of-scope fence for the builder.

### 5. What Should Not Be Built

*   **A native undo/recovery UI in V1:** Explicitly descoped by the maintainer.
*   **A SQLite database:** Unnecessary overhead on busybox, and syncing a database file is a known corruption hazard (as proven by the allowlist exclusions).
*   **A full staging mirror of the remote tree:** Costs a full download on hashless backends just to verify equality. Candidate-scoped staging is the correct approach.
*   **A 99-slot product cap:** ES supports 99999 slots; capping it is inventing a product limitation to mask a code defect.
*   **`bisync` as the production detector:** It remains a spike. Its `--conflict-loser` suffix breaks ES's regex, and its `--resync` behavior is too dangerous for unattended syncs.

### 6. Which Plan I Would Build From

I would build from **`kimi-revised_plan-r2.md`**. 

It is the most rigorously evidenced plan, correctly identifying the ES primitive bugs, the `RCLONEOPTS` bypass hazard, and the exact exit-path budget. It relies on verifiable artifacts rather than assumed rclone behaviors.

**What I would change/take from the others:**
1.  **Fix the Discard Store (Maintainer Amendment):** I would amend Kimi's discard store to write a `discard-meta.json` sidecar alongside every retained file. This sidecar will record `original_path`, `game`, `core`, `device_id`, `side_won`, and `timestamp`, perfectly setting up the maintainer's V2 "time machine" picker.
2.  **Restore Deletion Propagation (Maintainer Amendment / GPT):** I would take GPT's approach to deletion. Kimi built a brilliant "ops journal" to generate deletion receipts, but stopped short of using them to delete remote files. I would use Kimi's receipts to execute a remote `copy-verify-delete` (into the dated sibling), fulfilling the deletion capability while still failing closed on unrecorded absence.
3.  **Adopt the Lifecycle Gate (GPT):** I would lift GPT's strict lock acquisition order to guarantee the boot-sync cannot race the emulator.

### 7. Where a Plan Changed My Mind

The reviews and the revised plans changed my mind regarding **`bisync` and the full staging mirror**. In my own revision, I might have leaned toward utilizing `bisync`'s built-in detection or mirroring the remote tree to simplify comparisons. However, `kimi-revised_plan-r2.md` and `gpt-revised_plan-r2.md` conclusively proved that `bisync`'s suffixing breaks ES's `{{romfilename}}.state{{slot}}` regex (causing files to vanish from the UI), and that a full staging mirror on a hashless backend (like the QA WebDAV) would trigger a full library download just to verify sizes. Candidate-scoped downloads and a custom JSON-based reconciler are the only safe paths forward.

=== END gemini_peer_review-r3.md ===

=== START gpt_peer_review-r3.md ===

# Round-3 peer review

## Recommendation

I would build from **`claude-revised_plan-r2.md` as the editing baseline, not as an approved specification**.

It provides the clearest executable distinction between a verified cloud version and an unknown one, prices the changed-file path more honestly, describes complete-member-map classification, and keeps #10 in the feature drop. Those advantages outweigh its excessive lineage machinery.

Before building, I would:

- remove its eight-generation ancestry requirement;
- correct its publication, agreement, and interrupted-apply ordering;
- replace lifecycle markers with actual mutual exclusion;
- add a self-contained retained-discard record suitable for the later history picker;
- take recorded-operation handling and write-only-on-change capture from `kimi-revised_plan-r2.md`;
- take the pre-pass/SRAM dependency experiment from `gemini-revised_plan-r2.md`;
- take the content-fixture repair criterion from `mistral-revised_plan-r2.md`.

The most consequential remaining disagreement is **not whether a discarded save can eventually be recovered**. It is whether an ordinary offline fork is intercepted **before** either head is overwritten. Some plans still substitute archival recoverability for that requirement.

### Evidence boundary

I reviewed the four injected plans against the embedded sources. I did not access files, recompute hashes, or run tests.

Source citations use suffixes under:

`research/council-runs/2026-09-05-conflict-resolution-foundation/_sources/`

The `[Snn]` references bind each citation to its complete declared path and Facilitator-supplied SHA256 in `corpus.provenance.json` below. The two new maintainer decisions come from the orchestrator brief, not from a separately hashed source file.

---

## 1. What the maintainer’s amendments actually cost

**None of the four supplied revisions requires a version-one on-device undo control.** They already defer restoration or describe manual recovery. The new decision therefore does not require removing an undo screen from any of these four plans. I would not infer such a requirement from their descriptions of earlier, uninjected plans.

Their retention specifications, however, all need work.

| Plan | Fit with the amended resolution flow | Required adjustment now | Does its specified discard store support the later picker? |
|---|---|---|---|
| `claude-revised_plan-r2.md` | Closest: explicitly distinguishes retention from an undo control. | Make default-on bounded retention an implementation requirement, not optional O1. Remove the eight-entry lineage requirement and narrow any resolution receipt to the immediate operation it describes. Make pruning required rather than optional O6. | **Not yet.** `<path>/<sha256>` locates bytes, but the plan does not require retaining the full comparison context with them. |
| `gemini-revised_plan-r2.md` | Default-on retention; no required undo control. | Add the required done-page statement and a self-contained discard record. | **No reader contract is specified.** `<stamp>/` plus current manifests is insufficient. |
| `kimi-revised_plan-r2.md` | Default-on, count-bounded retention; restoration deferred. | Preserve its recorded-operation distinction, but do not turn it into a historical lineage system. Its additional auto-resume sub-choice deserves reconsideration under the “get going quickly” direction. | **Promising ingredients, incomplete persistence.** The apply record contains decisions and preimage locations, but the plan does not say those fields survive with retained copies after apply-record cleanup. |
| `mistral-revised_plan-r2.md` | Default-on retention and no required undo control. | Replace unspecified “recorded-loser” machinery with a bounded, defined operation record. Specify the retained metadata and done-page wording. | **No.** A timestamp directory is a location, not a history-picker model. |

The proposed numeric default of **three** remains a proposal in these plans. The amendment settles **on by default and bounded by a count**, not a particular count.

### The missing retention contract

The later tool must be able to enumerate a game’s retained choices and construct its comparison **without** depending on:

- a producer’s current manifest, which may have replaced the relevant entry;
- the rotated audit log;
- a completed apply record that has been removed;
- the original slot still meaning the same thing.

That follows directly from the current per-path manifest shape, ES renumbering, and D-CLOUD-027’s bounded support log. [`repo/docs/save-manifest-schema.md`, §§1, 5–6, S03; `es/SaveStateRepository.cpp`, S37; `repo/docs/decision-register.md`, D-CLOUD-027, S06.]

For each retained resolution unit, the store needs a small, versioned, self-contained record containing:

- system and game identity, or an honest shared-container identity;
- save kind, original paths and slots, and complete membership for multi-file units;
- retained content hashes and the retained thumbnail’s path/hash, where available;
- producer device identity, label/model, emulator/core/build, and captured time information, with unknowns preserved;
- which operand was cloud and which was local;
- the selected action and which side won, or the placements created by KEEP BOTH;
- the relevant winning hash and resulting destination/resume placement;
- an operation identifier not dependent on wall-clock uniqueness.

This is **one comparison record**, not a version graph. It is necessary version-one storage work even though no production reader ships yet.

The count should apply to complete retained resolution units, with a defined game/unit grouping—not merely the last three timestamp directories across unrelated games. Pruning must not remove an incomplete operation’s only preserved operand.

**Acceptance test:** resolve a conflict, overwrite the producer’s manifest entry, renumber the live slots, rotate the audit log, and remove the completed apply record. A test-only reader must still identify the game, render the retained candidate, name its producer, and explain which side won. This does not add a user-facing undo control.

---

## 2. The real disagreements

### 2.1 Fresh evidence before upload versus cached evidence plus recovery

This is substantive, and `claude-revised_plan-r2.md` is closest to the required behavior.

`kimi-revised_plan-r2.md` §4.3 explicitly allows its exit path to consult cached foreign-manifest claims, upload, and verify afterward. It acknowledges that a fork created since the last full pass can be overwritten.

That is not merely the narrow concurrent-writer race. It includes the milestone’s ordinary case:

1. Both devices agree on H₀.
2. Device B plays and publishes Hᵦ.
3. Device A, which played offline from H₀, has Hₐ and an old cached view of the cloud.
4. A’s exit upload replaces Hᵦ with Hₐ.
5. Verification confirms Hₐ arrived. It does not reveal the conflict that should have been presented.

An archived Hᵦ may preserve bytes, but the player was not empowered to choose the live result. On B’s next ordinary three-way pass, its unchanged local Hᵦ can also be replaced as a one-sided cloud change.

The source requirement is stronger: #22 owns the write paths, and a constructed both-sides-changed save must be refused by boot, game exit, and the SYNC row. D-CLOUD-029 permits today’s behavior only **until that replacement exists**. [`issues/issue-22.md`, S23; `repo/plans/conflict-resolution/vita-style-conflict-resolution.md`, futro §5, S05; `cloud_backup`, S29; D-CLOUD-029, S06.]

**Required change to `kimi-revised_plan-r2.md`:** obtain fresh evidence for the affected unit before authorizing its exit overwrite. Retention is additional protection, not the classifier.

`gemini-revised_plan-r2.md`’s fallback—defer hashless verification if it exceeds the budget while retaining a fast upload—has the same problem unless that upload is explicitly withheld whenever equality cannot be established.

`mistral-revised_plan-r2.md` names a pre-upload check, but its two-spawn contract never specifies how that check establishes C on a hashless backend.

**Deciding experiment:** the five-step sequential scenario above on two disposable device namespaces. No simultaneous processes are needed. Pass condition: both heads remain unchanged until a decision.

**My expected settlement:** fresh, candidate-scoped preflight wins. Zero-contact idle exits remain achievable. Changed-file safety cannot be replaced by a cached permission to overwrite.

---

### 2.2 Hashless candidate selection is still wrong or ambiguous in two plans

`gemini-revised_plan-r2.md` says it stages paths where L≠C “by hash if available, or size/mtime if not.” That can exclude the very same-size SRAM change its concession says it fixed.

`kimi-revised_plan-r2.md` recognizes this residual for non-ROCKNIX writers but postpones authoritative full verification to a menu action. Consequently, its cheap tiers cannot justify overwriting a same-size cloud file just because the cached manifest still claims the agreed bytes.

On the QA WebDAV, neither size equality nor a stale manifest establishes current content equality. The corpus explicitly says that backend lacks hashes and usable modtimes. [`repo/docs/save-manifest-alignment-review.md`, §1, S04; `cloud_backup`, system-backup comparison discussion, S29.]

`claude-revised_plan-r2.md` has the strongest rule: equal size still requires a content read when the overwrite decision depends on equality.

One correction is needed there too: **single-file `copyto` is not a substitute for forcing an already-decided transfer past metadata comparison.** The embedded upload and restore implementations deliberately combine `copyto` with `--ignore-times`. Naming one file does not prove its existing equal-size destination will be replaced. [`cloud_backup`, S29; `cloud_restore`, S30.]

**Deciding experiment:** modify an existing cloud SRAM without changing its size, retain a stale matching manifest, and exercise both classification and the actual chosen transfer. Check destination bytes, including the `copyto` case.

**Expected settlement:** candidate selection may be cheap, but any candidate about to overwrite existing progress needs current content evidence. If evidence cannot be obtained, defer that write—not verification after an unguarded write.

---

### 2.3 Deletion: preserve explicit intent without treating absence as intent

The maintainer’s amendment favors the policy direction in `kimi-revised_plan-r2.md` and `gemini-revised_plan-r2.md`: **an observed ES deletion or move is different from unexplained filesystem absence**.

`claude-revised_plan-r2.md`’s blanket “no ordinary deletion in V1,” justified chiefly by detached cards, temporary renames, and similar ambiguity, is no longer sufficiently argued. Its optional per-path hold-back creates another stateful behavior to explain while withholding the ordinary capability.

However, the opposite claim is also too strong:

> D-CLOUD-030 requires tombstones.

It requires verified, convergent duplicate compaction. It does **not** say compaction is local-only, and it does not logically require a general player-deletion protocol. A verified duplicate can be retired on the relevant side without interpreting every disappearance as deletion intent. [`repo/docs/decision-register.md`, D-CLOUD-030, S06.]

The useful contribution of `kimi-revised_plan-r2.md` is its concrete renumber/download/compact loop. That loop proves that **local-only cleanup followed by unconditional resurrection does not converge**. It does not, by itself, prove the entire receipt design.

There is also a missing connection in the receipt plans:

- A’s local receipt causes the cloud path to be retired.
- B subsequently observes the path absent.
- Where does B obtain A’s authenticated, version-specific retirement intent?

The specified local ops journal is unsynced; the proposed manifest amendments do not clearly define the receipt’s transport and lifetime. Without that connection, B’s “unexplained absence” rule can resurrect or hold the file rather than complete the advertised delete-propagation test.

**What I would take forward:** recorded, version-bound intent for operations ES actually performs; fail closed on unexplained absence; verified duplicate convergence. Do not expand this into an ancestry history.

**Deciding fixtures:**

1. Delete the highest numbered state on A; reconcile A, then B.
2. Retire P:H₀, then reuse P for H₁; the old receipt must not authorize retiring H₁.
3. Run the high-slot renumber/compaction trace through several passes.
4. Make a previously populated root unavailable without an operation receipt.

**Expected settlement:** explicit-intent handling is worth preserving. Unexplained absence remains a cheap refusal, not the reason to abandon deletion altogether. The receipt’s delivery and retirement rules need specification before the capability can be claimed.

---

### 2.4 Eight-step ancestry versus one-step operation context

`claude-revised_plan-r2.md` makes bounded `lineage` and `resolves` load-bearing. Its row 3 no longer means simply “local unchanged, cloud changed.” It requires the cloud version to explain the local agreed hash through ancestry or a resolution list.

That changes the signed three-way classifier. An ordinary sequence of sufficiently many offline sessions becomes a conflict because the ancestry bound expired. The plan itself prices that threshold at nine sessions. This is additional prompting and metadata maintenance, not a requirement of content identity or one-step recoverability. [`repo/docs/save-manifest-schema.md`, §§2–3, S03.]

Under the amendment, I would not build the eight-entry chain or make it permission for normal downloads. Keep:

- the existing immediate `replaces` relationship where it is known;
- the immediate comparison/selection record retained with discarded bytes;
- the pending operation record required to finish an interrupted apply.

Those serve different jobs and do not require a general version-history mechanism.

Two identity corrections also matter:

- The schema says a **renumbering move re-keys the entry while preserving `replaces` and `captured_at`**. Claude’s rule that resets lineage and `replaces` for both renumbers and new KEEP BOTH placements conflates those operations.
- Restoring identical stored bytes does not create a new content version under D-CLOUD-030. It creates a **new restore/publication operation involving the same version hash**. Statements in Claude and Kimi about deliberately restored bytes becoming a “new version” must not become hash-based loser blacklists.

`mistral-revised_plan-r2.md`’s requirement to implement “provisional-agreement rows” and “recorded-loser rows” is not implementable from the supplied document: the referenced earlier table is absent, and the current Claude plan has withdrawn provisional agreement as permission. These rows should not be inherited by reference.

**Expected settlement:** one-step operation context, not an eight-step causal history.

---

### 2.5 Complete save-unit classification versus aggregating file conflicts

`claude-revised_plan-r2.md` and `kimi-revised_plan-r2.md` correctly specify complete member-map comparison, including membership changes.

`gemini-revised_plan-r2.md` still states the rejected rule:

> If any member … is divergent, the entire unit is marked divergent.

That misses:

| | Member a | Member b |
|---|---|---|
| Agreed | a₀ | b₀ |
| Local | a₁ | b₀ |
| Cloud | a₀ | b₁ |

No individual path is divergent. The unit is divergent, and combining the one-sided changes constructs a save neither device produced.

`mistral-revised_plan-r2.md` still defines per-path output and adds a `group` label. A label does not supply unit-level classification.

**Deciding experiment:** the table above is a pure classifier fixture. Add a membership-change variant where one side removes a member and the other edits another.

**Expected settlement:** Claude/Kimi’s complete-map rule wins. Application must also produce the complete selected map: merely copying its present members can leave an obsolete destination member behind.

A thumbnail needs a further distinction. Binding a PNG to its state is essential, but a thumbnail anomaly is not automatically a genuine progress fork when the state bytes are identical. D-CLOUD-030 expressly excludes the thumbnail from version identity. [`repo/docs/save-manifest-schema.md`, §1, S03.]

---

### 2.6 #10 in the drop versus deferral

`kimi-revised_plan-r2.md` defers #10 while acknowledging the remaining local cross-core overwrite.

That acknowledgement is honest, but “pre-existing” does not resolve the scope decision. The problem statement includes #10 in this milestone, D-CLOUD-017 decides core namespacing, and the engineering rule explicitly rejects provenance of a known defect as a reason to ship past it. [S01; D-CLOUD-017, S06; `repo/.claude/rules/engineering-practices.md`, S10.]

This is a normal save-production hazard, not just a disconnected-card edge case: a second core can write the same flat path before the reconciler preserves the first state.

Claude, Gemini, and Mistral are closer here: retain #10, with the launch-behavior rehearsal as its gate. The source establishes why that rehearsal is necessary:

- compiled defaults enable `racommands`, autosave, and incremental behavior;
- the XML-loading path sets `racommands=false` and has different defaults;
- `SaveState::setupSaveState()` behaves differently across those branches.

[`es/SaveStateConfigFile.cpp`, S39; `es/SaveState.cpp`, S38.]

**Expected settlement:** #10 stays in the drop unless explicitly rescheduled by the maintainer. A clean chipset compatibility result does not repeal core namespacing.

---

### 2.7 Auto KEEP BOTH and split-root imports

These are smaller but real product differences.

**Auto KEEP BOTH.** Claude, Gemini, and Mistral use a deterministic outcome: keep this device’s automatic resume point and place the cloud state in a numbered slot. Kimi adds a resume-side sub-choice.

The amendment does not literally forbid that sub-choice, but it strengthens the case against adding it. I favor the deterministic outcome with an explicit sentence showing the resulting resume behavior. A short controller trial should settle whether players understand it without another decision.

Kimi is internally inconsistent about the auto-only allocator case: one section disables KEEP BOTH there, another routes it through the sub-choice. Mistral rejects −99 but also promises auto KEEP BOTH. The adapter must distinguish:

- auto-only, supported repository: use its valid first numbered slot;
- unsupported/disabled repository: refuse;
- unexpected allocator failure: refuse.

Blanket rejection or blanket conversion of −99 to zero is not sufficient. [`es/SaveStateRepository.cpp`, S37.]

**Split roots.** Gemini and Kimi preserve a separate one-way import operation without writing two-way agreement. That is closer to the shipped configuration’s documented intention than Claude’s blanket refusal: `cloud_sync.conf` explicitly describes setting `RESTOREPATH` differently to avoid replacing the normal live tree. [S33.]

I would take that distinction into the baseline: reject split-root *two-way reconciliation*, not the existing import capability. The import must still retain overwritten destination data and must not alter the primary root’s agreement record.

---

## 3. Load-bearing claims that still need correction

### 3.1 In-spawn manifests and “manifest-last commit” are not interchangeable optimizations

The ownership agreement is sound: never republish a cached foreign manifest, and never download the cloud copy over locally captured unpublished entries.

The proposed mechanisms are not yet sound contracts.

- **Gemini/Kimi:** including the own manifest in the payload batch does not establish that it is uploaded after the payload.
- **Claude:** folding its explicit manifest upload into the payload batch would invalidate its manifest-last argument unless actual ordering is proven.
- **Mistral:** excluding `.rocknix/**` while adding the own manifest through `--files-from` leaves the effective filtering behavior undefined in the plan.

The corpus warns that `--include` excludes everything unmatched and that filter precedence is load-bearing. An own-manifest include must not silently turn a saves upload into a manifest-only upload. [`repo/.claude/rules/rclone-cloud-sync.md`, S09.]

More fundamentally, **manifest-last is not by itself a coherent-unit proof** when readers match individual members against the union of several historical claims. All members need to match one coherent declared member map—not merely some claim for each path.

Claude’s “after two full passes, treat unexplained bytes as legacy” also needs narrowing. Two reader passes do not turn an interrupted multi-file publication into a valid emulator-produced save. That rule can expose a half-published unit as a legitimate cloud candidate.

**Test:** deliberately slow a unit upload, force the manifest to appear early, and interrupt after one member. A reader must never install or offer the mixed set as a coherent unit. Repeat with hashes matching old entries in other manifests.

Process-count optimization follows this test; it cannot replace it.

---

### 3.2 Agreement is advanced too early in the proposed apply descriptions

Claude §2.4 says payload → manifest → agreement. Its §2.8 instead describes local installation → agreement → item done, followed by remote payload publication after all items.

Those are different protocols. After KEEP RIGHT, setting agreement to the local winner before that winner reaches the cloud records agreement that never occurred.

Kimi’s apply sequence likewise ends with agreement and status without specifying where remote publication and its verification occur in that sequence.

Gemini introduces the frozen plan as an interrupted-apply test without specifying its durable phases. Mistral claims ordering and re-planning are sufficient.

The fix is not a large transaction system. It is a small pending-operation record that distinguishes, at minimum:

- prepared operands and destinations;
- completed local installation;
- verified required remote publication;
- committed agreement.

A boolean `done` cannot ambiguously mean both “installed here” and “committed on both sides.”

The audit line written before mutation records **intent**, not completion. Completion requires a separate outcome, consistent with D-CLOUD-027’s audit role. [`repo/docs/save-manifest-schema.md`, §§2, 9, S03; `repo/docs/conflict-wizard-ia.md`, S02; `repo/docs/decision-register.md`, S06.]

Also, neither PNG-before-state nor “rename the whole directory” guarantees an old-or-new live unit after every interruption. There can be a gap between removing the old directory and installing the new one; ordinary rename does not replace an arbitrary nonempty directory atomically. The practical guarantee is: **incomplete units cannot be consumed, and the pending record permits recovery**.

That remains required even though the undo UI is deferred.

---

### 3.3 The lifecycle gate must actually exclude concurrent local access

Claude proposes two tmpfs markers. Check-and-set markers are not mutual exclusion: launch and restore can both observe the other marker absent.

Kimi specifies an actual lock and acquisition order, which is better, but then exempts capture and argues that an inconsistent unit snapshot “self-corrects at the next capture.” That is unsafe. Atomic rename of individual files does not provide a coherent multi-file snapshot, and concurrent whole-manifest rewrites can lose each other’s updates.

Capture can be independent of **network availability** without being independent of **local serialization**.

The gate must cover short local snapshot/capture and installation phases. Network uploads may continue during play only from sealed immutable data—not merely from a file that was hashed earlier and can now change.

After reboot, recovery of a pending apply must precede emulator consumption; cleared tmpfs markers are not evidence that the live unit is complete.

The need is visible in the actual launch path: `onGameEnded()` mutates auto/numbered states before the current exit-sync call, and the detached boot script can run independently. [`es/FileData.cpp.launchGame-excerpt-l740-850.cpp`, S41; `es/SaveState.cpp`, S38; `102-cloud-saves`, S35.]

---

### 3.4 `--backup-dir` is useful, but its guarantee remains unproven

Gemini’s “this makes lost races recoverable without extra spawns” and Kimi’s summary claim that no overwrite destroys the only copy are stronger than their evidence.

Claude is more careful in its concurrency section, but its overall contract still depends on backend behavior not embedded here.

A backup option can:

- add no process start;
- add remote operations and latency;
- archive something;
- and still fail to archive the exact intervening generation a race overwrote.

These are separate claims.

The appropriate V1 response is not automatically a competing-head publication system. Under the maintainer’s amendment, that would need a stronger justification than rare concurrency alone. But the plans must narrow their promise:

- preserve the candidates the player actually compared before applying the choice;
- test archival handling of an intervening head on supported backends;
- distinguish the residual race from an already-detectable offline fork;
- report an unverified outcome honestly.

A device ID plus an operation identifier also belongs in archive naming now; `<stamp>` alone is unnecessarily collision-prone.

---

### 3.5 Source-contract errors should not survive as “refinements”

Three corrections are particularly concrete:

1. **Mistral’s `rom` field is wrong.** The signed schema defines the ROM filename **with extension**, supplied by ES, not the matched savestate stem. [`repo/docs/save-manifest-schema.md`, §6, S03.]
2. **Mistral cannot withdraw D-CLOUD-029.** Its proposed isolated testing and disabled toggles are compatible maintainer operating choices. Withdraw the plan’s earlier stopgap proposal, not the binding register row.
3. **Gemini’s ping replacement repeats the liveness category error.** ICMP response from a resolved address does not establish that the configured rclone remote works, and blocked ICMP does not establish that it is unreachable. It also adds network work to a path being optimized to avoid it. The rule already says reachability means the configured remote, not a surrogate. [`repo/.claude/rules/rclone-cloud-sync.md`, S09.]

Similarly, the words “proven on H700” and “no unmeasured claims” in Mistral’s document need to become prospective gates. The embedded corpus contains no execution results supporting its two-spawn/five-second contract.

---

## 4. What each plan uniquely contributes

These are the distinctive details I would preserve, rather than merely retaining their shared architecture.

| Plan | Carry-over-worthy element | Why losing it would matter |
|---|---|---|
| `claude-revised_plan-r2.md` | Its explicit hashless rule: **equal size is not an equality verdict; download-and-hash before the decision that needs equality.** | The other plans retain either an ambiguous candidate filter, a cached-evidence upload, or an unspecified hashless path. This is the clearest operational guard against the #53-shaped saves failure. |
| `gemini-revised_plan-r2.md` | Its placement of the SRAM experiment at the **non-conflict pre-pass boundary**. A liftable AC is: **“Before allowing the pre-pass to replace a game’s in-game save, test whether loading the chosen resume state can rewrite that SRAM.”** | This is sharper than merely placing state/save decisions on adjacent screens. Preserve it as a dependency test, not as a rule that every state and SRAM file must be fused into one enormous unit. |
| `kimi-revised_plan-r2.md` | **“The manifest is written only when something changed — never to bump `generated_at`.”** Also preserve its multi-pass high-slot churn fixture. | The first prevents metadata-only exits from manufacturing work and misleading capture history. The second proves convergence rather than merely showing that one compaction succeeded. |
| `mistral-revised_plan-r2.md` | **“Reconcile content fixtures with the current allowlist.”** | The embedded harness expects its invented `qa-content` directory to be offered, while D-CLOUD-019 defines content membership through ES-declared systems. Fixing credentials and dated archive names alone does not reconcile that mismatch. Use an appropriate declared-system fixture on disposable storage, not a production allowlist exception. [S36; D-CLOUD-019, S06.] |

These are concrete lifts. I would not retain weaker neighboring claims merely to keep each document’s package intact.

---

## 5. What should not be built

Under the amended brief, I would exclude:

- **A V1 undo control.** None of these four requires one; do not accidentally add one while implementing retention.
- **Claude’s eight-generation lineage gate.** It spends complexity and prompts on a history requirement the maintainer has expressly narrowed.
- **Cached-manifest permission to overwrite on game exit.** That misses the primary offline-fork scenario.
- **A timestamp-only discard store.** It would force a later migration or leave the future picker unable to identify retained saves.
- **A general deletion protocol inferred from absence.** Preserve explicit observed operations; unexplained absence remains unknown.
- **Claude’s hold-back behavior as the substitute for supporting explicit deletion.** It introduces another per-path policy while avoiding the real capability question.
- **A second production reconciliation authority in bisync.** Run the spike, then choose one authority for agreement and classification.
- **An ordinary metadata-skipped staging mirror.**
- **A lifecycle gate made solely of markers, or lock-free capture justified by later self-correction.**
- **A promise that a frozen plan needs no durable execution state.** A bounded pending record is not an overbuilt history journal.
- **A hard two-spawn claim unsupported by the required reads and publication order.**
- **A new ping probe on every exit.**
- **Kimi’s extra auto-resume choice by default**, unless controller testing demonstrates that the deterministic outcome is materially confusing.
- **Automatic cleanup of staging files “on sight.”** A stage may hold the only remaining operand of an interrupted apply; cleanup must understand pending operations.

The five-second figure is the measured **nothing-changed** experience; the corpus also reports roughly seven seconds for a changed save. That does not grant unlimited changed-path cost, but it does mean Mistral’s universal five-second gate is an invented constraint, not the shipped measurement. [D-CLOUD-028, S06; `repo/.claude/rules/rclone-cloud-sync.md`, S09.]

---

## 6. The experiments that should settle this review

There are two kinds of gate: substrate experiments before the implementation contract is frozen, and acceptance tests against the implementation before it ships. Tests of a nonexistent lifecycle gate cannot literally precede all implementation.

### Before design freeze

1. **Repair the instrument on a disposable GENERIC_X64 image.** Preserve configuration before changing it; assert the intended remote before use; repair exact archive-path assertions and content membership fixtures. Run WebDAV and MinIO. Keep the QA WebDAV on loopback under D-QA-002. [S36; S06.]
2. **Run the classifier counterexamples.** Same-size stale-manifest cloud change; disjoint-member fork; membership removal; true one-way unknown-provenance import; failed listing versus empty listing.
3. **Run the actual device-version rclone spike.** Compressed state and PNG, genuine fork, rename, external equalization, interrupted run, filter changes, and missing listings. Inspect names and bytes. Nothing embedded establishes the exact 1.75.0 bisync behavior or its future roadmap.
4. **Run the sequential two-device offline-fork scenario.** This settles the cached-versus-fresh exit gate independently of concurrent-writing edge cases.
5. **Price actual changed-path operations on H700.** Include preflight, hashless reads, forced transfer, manifest publication, and verification—not just process starts.

### Before shipping

6. **Run the local lifecycle and adapter tests.** Boot overlap with a numbered-slot launch; auto-only allocation; unwritable destinations; batch reservations; capture during a worker’s local phase; repository refresh after apply.
7. **Interrupt each apply phase.** Neither early agreement nor stale `done` flags may license a different overwrite. Pending recovery must keep incomplete units out of emulator consumption.
8. **Run deletion and compaction to convergence across both devices.** Include stale path reuse and a returning device that did not observe the original operation.
9. **Test retained-store readability without live historical metadata.** This is the new requirement that otherwise has no version-one consumer to expose a defect.
10. **Run #19 and the #10 layout/launch rehearsal.** Same-chipset control first; qualify findings to tested cores/builds; verify old flat states remain discoverable and new writes reach the directory both ES and RetroArch use.
11. **Press through the amended flow at 480×320.** Real thumbnails, unknown provenance, shared containers, deterministic auto KEEP BOTH, cancellation, and the done-page statement that discarded copies are kept. No undo action.

The exact `--backup-dir` race experiment belongs here too, but it must not displace the ordinary offline-fork test as the principal acceptance criterion.

---

## 7. Final build-from case

`claude-revised_plan-r2.md` is the best baseline because its largest problems are identifiable local corrections and deletions of excess machinery. Its pre-upload evidence model is closer to the cardinal rule than Kimi’s currently specified exit path, and its complete unit classifier is clearer than Gemini’s or Mistral’s.

I would take:

- **from Kimi:** recorded move/deletion intent, write-only-on-change capture, a real local lock order, and the convergence fixture;
- **from Gemini:** the pre-pass/SRAM dependency test and preservation of split-root import as a separate operation;
- **from Mistral:** the requirement to reconcile the harness’s content fixtures with the actual membership policy.

I would retain Claude’s explicit verification fallback and #10 sequencing, but not its ancestry gate, hold-back substitute, marker-only exclusion, or contradictory apply ordering.

My own prior revision is not embedded, so I cannot give a verifiable line-by-line account of what changed since it. The argument here that most changes the weighting is Kimi’s churn trace: it makes **retirement convergence a V1 behavior to prove**, not housekeeping to postpone. It still does not prove that every deletion needs a general tombstone history.

**No plan is ready to build unchanged. The amended target is smaller than a history system, but stronger than a folder of backup bytes: intercept genuine forks, make the chosen result explicit, and retain one-step comparison context that the later history tool can actually use.**

---

## `corpus.provenance.json`

```json
{
  "artifact": "round-3 peer review",
  "corpus_mode": "facilitator_embedded_read_at_time",
  "source_count": 42,
  "member_filesystem_access": false,
  "member_reread_files": false,
  "member_rehashed_sources": false,
  "member_executed_tests": false,
  "hash_basis": "SHA256 values copied from the per-source headers, verified at embed time by the Council Facilitator; not independently recomputed",
  "manifest_read_timestamp_utc_as_supplied": "2026-09-05T17:32:51Z",
  "citation_mapping": "S01 through S42 map in order to the parallel source_file_paths and source_file_hashes arrays",
  "reviewed_plan_filenames": [
    "claude-revised_plan-r2.md",
    "gemini-revised_plan-r2.md",
    "kimi-revised_plan-r2.md",
    "mistral-revised_plan-r2.md"
  ],
  "reviewed_plan_hashes_supplied": false,
  "maintainer_amendments": {
    "source": "orchestrator brief embedded in this prompt",
    "separate_declared_path": null,
    "sha256": null,
    "applied_as_authoritative": true
  },
  "own_prior_revision_embedded": false,
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
      "description": "Rclone 1.75.0 documentation or source establishing bisync behavior, transfer-filter composition, copyto comparison, and backup-dir generation handling on the relevant backends",
      "declared_path": null,
      "sha256": null
    },
    {
      "description": "GuiSaveState.cpp, SaveState.h, SaveStateRepository.h, Paths.cpp, full launch-command construction, and RetroArch setsettings/launcher plumbing",
      "declared_path": null,
      "sha256": null
    },
    {
      "description": "Cloud content scripts, cloud_setup, backuptool, cloud-test-backend, and the defaults files needed to validate full harness and filter behavior",
      "declared_path": null,
      "sha256": null
    },
    {
      "description": "Current issue bodies with amended acceptance criteria; the embedded issue artifacts contain comment-thread exports",
      "declared_path": null,
      "sha256": null
    },
    {
      "description": "Executed hardware, backend, interruption, compatibility, retention-reader, and round-trip results",
      "declared_path": null,
      "sha256": null
    },
    {
      "description": "This member's own preceding revision and earlier peer reviews, which were not independently available for before-and-after comparison",
      "declared_path": null,
      "sha256": null
    }
  ]
}
```

=== END gpt_peer_review-r3.md ===

=== START kimi_peer_review-r3.md ===

# Round-3 peer review — `kimi_peer_review-r3.md`

**Posture.** I am the fifth member; my earlier revision is the one the injected plans credit as `kimi-revised_plan.md`. I judge all four injected plans against the embedded corpus and the two maintainer amendments, not against my own artifact. I re-read nothing, re-hashed nothing, ran nothing; the corpus stands as embedded. Where all four plans agree and the corpus is silent, I say so explicitly — that is the class of claim most likely to ship a confident error.

---

## 1. What the two amendments cost each plan

The amendments were made after the plans were written, so absence is not a defect; distance from them is what I measure. Three tests fall out of them:

- **T1 (undo surface):** V1 ships retention ON, count-bounded, and *no* control to put a discarded copy back. The restore tool is a separate issue shaped as the wizard's compare-and-choose pointed at retained versions.
- **T2 (store readable by a reader that does not exist):** the discard store must not be keyed only by timestamp, and must not drop which game, which slot, which device produced the copy, and which side won.
- **T3 (edge cases inform, do not drive):** failing closed on unexplained absence is still expected; abandoning a capability *because* a detached card is indistinguishable from a deletion is not, on its own, sufficient reason.

### 1.1 Score table

| Plan | T1: retention ON, no V1 undo control | T2: store shape vs the future reader | T3: capability vs edge case | Net cost |
|---|---|---|---|---|
| `claude-revised_plan-r2.md` | Compliant (§2.6.4: ON, count 3, "retention for recovery, not an undo control"; done page names discards via the futro ACs it carries) | **Partial.** `/storage/.cache/cloud_sync/discarded/<path>/<sha256>` keeps game, slot, content identity, and the PNG travels (§2.4.1). Producer device and which-side-won are *not* durably bound to the copy: the plan file that held them is deleted after apply (§2.8), the audit log rotates at 1 MiB (D-CLOUD-027), and the loser's `origin` vanishes from the manifest union when the producer's entry is overwritten — the volatility claude itself conceded in §1.1 | **Weakened.** §2.10's no-delete-propagation leans on "an unmounted card … present as absence", which is exactly the argument T3 declares insufficient alone | Low–moderate |
| `gpt-revised_plan-r2.md` | **Violates T1.** §8: "V1 needs a minimal native recovery route … A directory of bytes recoverable only through SSH is not a complete console-first escape hatch." That is an on-device undo surface as a V1 requirement — now over-scoped | **Closest.** Store uses "unique device/transaction components, not a timestamp alone" (§6.1); manifest operation records bind resolutions to exact input hashes and outputs (§3.3), so every device learns every resolution. Still needs operand *provenance* inline — the records carry hashes and locations, and origin-by-lookup is volatile for the loser | **Strongest.** Retirement records name the exact version (§4.3): a detached card produces no record → fail closed; a deliberate delete produces one → propagates. The indistinguishability argument never applies | Low (mostly scope *reduction*) |
| `gemini-revised_plan-r2.md` | Compliant (§2.4: ON, count selector; no V1 undo surface) | **Fails.** `discarded/<stamp>` and remote `-replaced/<stamp>` (§2.4) are keyed by exactly the thing T2 forbids. Game, slot, producer, winner all depend on records not specified | Compliant in form (tombstones for explicit deletes/compactions), but the cited *necessity* is stale (§4.2 below) | Moderate |
| `mistral-revised_plan-r2.md` | Compliant (D-CLOUD-027-A: ON, default 3; no undo surface) | **Fails.** `discarded/<stamp>/` (D-CLOUD-027-B) — same defect as gemini | Compliant in form (tombstones + mass-delete guard, §1.4) | Moderate–high (plus four independent errors, §4.4) |

### 1.2 The fix the amendment demands, once

None of the four stores fully survives T2. The repair is small and the same for all: keep `claude-revised_plan-r2.md`'s path-keyed layout (`discarded/<path>/<sha256>`, PNG beside the state), and write a `<sha256>.json` sidecar at apply time carrying `{rom, system, kind, slot, producer: {device_id, device_label, device_model, core, core_build, captured_at}, winner_side, resolved_at, resolution_id}`. Every field is already in the apply-time plan item in claude's §2.8 or gpt's §7.3, so this is a write of data in hand, not new machinery. Prune by count per path, never by date (claude §7's wrong-clock hazard), and exempt unresolved conflicts and incomplete transactions from the count (gpt §2 — the count must never evict the only copy of an unresolved version). With that sidecar, the maintainer's "time machine" tool — the wizard's panels pointed at a game's retained versions — can be built later without touching V1's store.

### 1.3 Per-plan amendment notes

- `gpt-revised_plan-r2.md`'s T1 violation is the cheapest possible kind: the recovery route it designed is *exactly* the separate tool's shape ("reusing the same comparison/apply machinery"). Moving it to the new issue is a scope cut, and the design work is not wasted — it is the tool's seed. It must also add the done-page sentence (what was discarded, that copies are kept); its §8 cancellation wording is precise but the done page is silent.
- `claude-revised_plan-r2.md` needs the sidecar (§1.2) and a re-justified deletion position (§2, D1). Its done-page sentence already exists via the futro ACs it carries ("the done page names each discarded copy per game, and the audit line precedes the deletion").
- `gemini-revised_plan-r2.md` needs the store re-keyed and the sidecar; its "capped per run" on retirement propagation (§3, D-CLOUD-030-A) must be clarified — if the cap *drops* records it reintroduces non-convergence; `gpt-revised_plan-r2.md` §4.3's rule is the right one: reaching a control-state limit stops mutation rather than silently discarding correctness state.
- `mistral-revised_plan-r2.md` needs the same store repair, plus correction of the four errors in §4.4 before its content is safe to lift anywhere.

---

## 2. The real disagreements, and what settles them

### D1 — Deletion propagation in V1: substantive; settles to version-specific tombstones, conditionally

Positions: `gpt-revised_plan-r2.md` §4.3 (retirement records for explicit deletes, verified moves, verified compactions — each naming the exact version; "a remote edit is a delete/edit conflict, not collateral permission"); `gemini-revised_plan-r2.md` §3 (intent-recorded receipts, "capped per run"); `mistral-revised_plan-r2.md` §1.4 (tombstones + mass-delete guard); `claude-revised_plan-r2.md` §2.10 (no propagation in V1; direct remote compaction for duplicates; hold-back O2; explicit deletion deferred to "a separately approved V2 policy").

Two things are *not* in dispute: unexplained absence fails closed (all four; T3 confirms), and D-CLOUD-030's duplicate compaction must converge. On convergence, `gemini-revised_plan-r2.md` §1 cites my round-2 review as proving receipts are *required* — that is stale: `claude-revised_plan-r2.md` §2.3.2 compacts the higher copy **on whichever side holds it, remote included, after re-reading both copies**, which converges without any receipt. Receipts are one executor; direct remote compaction is another. The genuine residue is the **explicit player deletion**: under claude's design it resurrects on the deleting device (or is held back by O2 — itself new machinery of tombstone-like size), and the player's choice is honoured nowhere else.

T3 says the card-detachment edge case alone cannot kill the capability. Gpt's version-specific record is precisely the design the edge case cannot defeat: absence never mints a record, so a detached card fails closed, while a deliberate delete names the exact bytes it retires, so a stale record cannot remove a path's later occupant. Claude's remaining argument is scope — but its own O2 hold-back is comparable machinery, so scope does not bear the weight either.

**Settling evidence:** (a) does ES's delete path offer one hookable point? `GuiSaveState.cpp` is *not embedded* — the corpus knows only from `repo/issues/issue-24.md` that `GuiSaveState.cpp:236` calls `renumberSlots()` after deletion. This is now a load-bearing corpus gap (§8). (b) Fixture: delete on A → sync → B syncs → the version retires on B without resurrection, and a replayed/stale record cannot remove a later occupant of the path. **Predicted settlement:** gpt's form, conditional on the hook existing; if it does not, reconciler-observed move/compaction receipts still cover D-CLOUD-030, and explicit deletes fall back to resurrection + hold-back until the hook ships. One product call goes to the maintainer [M]: gpt's "whose synced-library effect is made clear" — the savestate manager's delete must say it removes the state on other devices too.

### D2 — Hashless-backend verification at game exit: substantive, small; settles to claude, with gemini's deferral as the measured fallback

`claude-revised_plan-r2.md` §2.5.2 pays a download-and-hash on hashless backends at exit (my round-2 position, which it adopted). `gemini-revised_plan-r2.md` §4.2 defers hashless verification to the full pass, leaving exit a fast-path upload. The deferral's cost: a same-size SRAM change on the QA WebDAV is invisible to a size-only comparison — the #53 shape (`cloud_backup` comments [V]) — so the save the player just made sits unverified until the next boot or menu pass, and the card must not claim otherwise. **Experiment:** Gate 6 timing on H700 → WebDAV, one changed 64 KiB `.srm`, same size. One targeted download + `sha256sum` is ~1–2 s on the measured budget (`repo/.claude/rules/rclone-cloud-sync.md`: rclone start ≈ 1 s, round trip 1–2 s). **Predicted settlement:** claude; if measurement blows the budget, gemini's deferral with an honest "waiting" card — never "safe in the cloud".

### D3 — `remote_hash` at exit: small; settles to claude's spawn A, gated on measurement

`claude-revised_plan-r2.md` §2.5.2 step 4 computes the backend hash locally (`rclone hashsum <type>`, or busybox `md5sum` on md5 backends) so the *next* exit push for the same game can confirm C = A without a listing; without it, a second changed session before any full pass defers. `gpt-revised_plan-r2.md` §5.2: "Do not add a standalone post-upload listing merely to fill `remote_hash` … A manifest with `remote_hash: null` is valid." Gpt's framing misses that claude's spawn is not a post-upload listing and is not for the manifest's vanity — it exists for the two-sessions-in-a-row case, which is the common case. **Experiment:** Gate 13 (`hashsum <type>` on local files, Dropbox's own hash type included) plus Gate 6 cost. **Predicted settlement:** claude, with its own degrade clause (drop spawn A, accept `observed: false`) if the number says so.

### D4 — `BACKUPPATH ≠ RESTOREPATH`: small; settles to gpt/gemini

`claude-revised_plan-r2.md` §2.2 refuses with exit 1. `gpt-revised_plan-r2.md` §9.3 and `gemini-revised_plan-r2.md` §4.3 treat the split root as an **import destination**: one-way copy in, no agreement written. The shipped config documents split roots as a feature ("Changing the below to be different from BACKUPPATH will prevent data from being replaced on restore" — `cloud_sync.conf` [V]), and the schema only *assumes* equality (schema §9). Under #22 the reconciler owns the write paths, so claude's refusal strands a shipped capability; the import reading preserves it without corrupting the sync state. **Settles:** gpt/gemini; the two-way reconciler still refuses the split, but the one-way import remains.

### D5 — `check_network_link`'s LAN false negative: small; settles to gemini

`cloud_backup` exits 4 when no default route exists [V]; a LAN-only or self-hosted remote on a route-less network then never syncs — and the rule file's own case is "a self-hosted or LAN remote needs no internet" (`repo/.claude/rules/rclone-cloud-sync.md` [V]). `claude-revised_plan-r2.md` documents it and keeps exit 4; `gemini-revised_plan-r2.md` §4.4 replaces the check for LAN remotes (probe the remote's resolved address, fall back to the route check for WAN); `gpt-revised_plan-r2.md` §5.3 agrees in principle. Note the interaction with claude's zero-spawn idle path: the idle path needs no network answer at all, so the fix only matters on the changed path, where a bounded probe is affordable. **Experiment:** no-default-route fixture against the loopback/LAN QA WebDAV. **Settles:** gemini.

### D6 — Foreign manifests in the tree: substantive but easy; settles to stage-only

`mistral-revised_plan-r2.md` §1.2: "Foreign manifests may sit in the tree as read-only caches." During cutover the legacy `cloud_backup` still runs, and the allowlist (`+ /savestates/**` [V]) will bulk-upload any manifest in the tree — republishing a stale foreign manifest over its producer's newer one, the exact hazard claude §2.4.3, gemini §2, and gpt §3.4 all design against (and which mistral's own ownership sentence contradicts in the same paragraph). **Settles:** foreign manifests live in the stage only, never the tree.

### D7 — Manifest in the payload spawn vs manifest-last commit: small; settles to claude

`gemini-revised_plan-r2.md` §2.5 rides the own manifest in the payload spawn via `--include` to save a spawn. But rclone does not guarantee intra-copy ordering, so the manifest can land before some payloads — a consumer then sees a manifest describing absent objects, which reads as "cloud lost it" (claude's row 11) on another device. `claude-revised_plan-r2.md` §2.4.2's manifest-last commit (payload, then manifest `copyto`, then agreement) exists precisely to close that window. The filter expressibility itself (include-then-exclude ordering among flags) is a Gate-13 check. **Settles:** claude's separate `copyto` unless the spike proves safe ordering; one spawn is the price of a commit point.

### D8 — Converged, listed only because the corpus has not settled them

These are [C] — council agreement, not corpus truth. Naming them so a reader knows what is reasoning: bisync's demotion (the IA and #22 still say bisync detects [V]; the spike has not run); the queued wizard trigger (contradicts IA rev 4's automatic open [V]; needs the maintainer's IA amendment); the manifest-detector fitting the exit budget (every number is a prediction until Gate 6); `--backup-dir` archiving the replaced object atomically per backend (the corpus shows it used only in `cloud_backup`'s `sync` branch [V]; with `copy` it is unmeasured); auto states as the commonest conflict (schema §4 asserts; `es/SaveState.cpp` shows numbered-slot launches restore `.auto` from `.bak` at exit, so only auto-resume sessions rewrite it — a census question); unit groupings (nobody has inventoried what PPSSPP/Flycast/Mupen actually write per save). Retention-ON has *left* this list — the maintainer's amendment settled it.

---

## 3. Load-bearing claims, re-tested against the corpus

**Verified source-visible, all four plans may rely on them:**
- `getNextFreeSlot()` returns −99 on an auto-only repository: the auto state sits in the vector with slot −1, the 99999→0 scan finds nothing (`es/SaveStateRepository.cpp` [V]). And the auto-resume launch path appends `-state_slot <nextSlot>` unconditionally (`es/SaveState.cpp` `setupSaveState`, slot == −1 branch [V]) — so the −99 reaches RetroArch's command line. What RetroArch does with slot −99 is [K]; the adapter (all four plans) is mandatory, and the confirming experiment must launch *from the auto state*, since the new-game path swallows the −99 behind `nextSlot > 0`.
- `copyToSlot()` returns true whatever `renameFile`/`copyFile` did, and `makeStateFilename(fullPath = true)` derives the destination from the *source's* parent (`es/SaveState.cpp` [V]) — a staged cloud state's copy would land in the stage directory. The checked adapter must compute destinations from the config templates itself.
- The exit upload is `copy` with no `--update`, and `--backup-dir` exists only in the `sync` branch (`cloud_backup` [V]) — the one-way stopgap is destructive; all four concede; D-CLOUD-029 stands.
- `.state.auto.bak` matches the allowlist's `+ /**/*.state*` and neither of ES's regexes (`cloud_sync-rules.txt`, `es/SaveStateConfigFile.cpp` [V]) — it syncs and is invisible to ES; exclusion must be a command-line flag because user rules merge *ahead of* defaults (`cloud_sync_helper` [V]) and command-line `--exclude` outranks `--filter-from` (`rclone-cloud-sync.md` [V]).
- A non-empty `RCLONEOPTS` silently replaces the default option set including `--filter-from` (`cloud_backup` `load_config` [V]) — option hygiene is load-bearing.
- rclone's exit 3/4 pass through `clean_exit` and render as friendly skips in `ThreadedCloudSync` (`cloud_backup`, `es/ThreadedCloudSync.cpp` [V]) — normalised statuses (claude §2.11, gpt §8) are a real fix for a real collision.
- Creating any `es_savestates.cfg` flips `racommands` to false and changes autosave/incremental defaults versus the compiled `Default()` (`es/SaveStateConfigFile.cpp`, `es/SaveState.cpp` [V]) — the #10 rehearsal gate (all four) is earned.
- Exit-time renumbering is *conditional*, not every exit: `onGameEnded` runs only when `saveStateInfo` exists, the `racommands` branch returns early for slot < 0, and `renumberSlots` runs only for incremental configs (`es/SaveState.cpp`, `es/FileData.cpp…l740-850` [V]). `gpt-revised_plan-r2.md` §1.2's correction of the overgeneralisation is correct.

**Unmeasured and must stay marked [K]:** `--backup-dir` with `copy` (which object, atomicity, cost); `lsjson --files-from`; `hashsum <type>` on local files; single-object copy appearing whole; the boot-race byte loss (mechanism source-visible — SRAM flush every 10 s per schema §4 — loss itself reproduced, not observed); auto-state conflict frequency; every spawn/time number.

**Errors found:**

- `gemini-revised_plan-r2.md` §2.4: "`--backup-dir` … makes lost races *recoverable* **without extra spawns**." The spawn count is not the cost axis — server-side copy/rename requests are, and they are unmeasured; `gpt-revised_plan-r2.md` §1.2 already refuted the "zero extra round trips" form. Restate as "no extra rclone *processes*; request cost measured at Gate 2".
- `gemini-revised_plan-r2.md` §1: the claim that receipts are *required* for D-CLOUD-030 convergence is stale (§2, D1) — direct remote compaction also converges. Receipts earn their place on the explicit-delete case, not the duplicate case.
- `gpt-revised_plan-r2.md`: no factual errors against the corpus found. Its defect is scope (T1), not correctness.
- `claude-revised_plan-r2.md`: the split-root refusal (D4) and the ES-death gap in its marker design (§5 below) are the only correctness-adjacent weaknesses; everything else checked out, including its concessions.
- `mistral-revised_plan-r2.md` — four errors, each load-bearing if lifted:
  1. §2: "**D-CLOUD-029 is withdrawn**." The register shows D-CLOUD-029 *decided* — no stopgap, paths stay until #22 replaces them (`repo/docs/decision-register.md` [V]). A decided row is binding unless reopened; "withdrawn" misstates register discipline and the decision's content.
  2. §1.1: "provisional-agreement rows … are all implemented." `claude-revised_plan-r2.md` §1.1 *withdrew* provisional agreement as a permission concept. Mistral lifts a table containing rows its author retracted.
  3. §2: "`rom` is the matched stem under `nofileextension = true` (claude §3.2 R9)." Claude withdrew this in the same §1.1; schema §6 defines `rom` as the ROM file name *recorded, not re-derived* ("told, not discovered", §9). Mistral adopts a retracted position that contradicts the signed schema.
  4. §1.1 and Gate 1: "Budget: ≤ 2 rclone spawns … **proven** on H700." Nothing has run; the round-trip suite has never executed (`repo/issues/issue-35.md`, `repo/tools/cloud-round-trip` [V]). Claude's honest accounting is 0 spawns idle, 3–4 changed. A gate written to a guessed number will either fail falsely or be quietly edited.

---

## 4. What each plan uniquely has (lift candidates)

**`claude-revised_plan-r2.md`:**
- The 14-row verdict table with the **clock-free in-flight rule** (§2.3.1 rule 4: an object no manifest explains is `unknown` for two consecutive full passes, then escalates to legacy download-and-hash) — the only complete answer to the mixed-version cutover that uses no clocks.
- The **result file + run id** (§2.11): ES compares the run id it issued with the one in the file; a missing or stale result is *unknown*, never success. Nobody else has the anti-stale-result mechanism.
- §7's unknown-unknowns, each with a cheap experiment: path-bytes round-trip through Dropbox's case/Unicode normalisation (phantom cloud-only/device-only pairs), Dropbox write-rate limits on many small operations, wrong-clock archive pruning (prune by count, never date), stage-and-tree on different filesystems (install = copy-then-verify), the thirty-item controller-only walkthrough gate.
- The hold-back (O2): the only design that lets a deleting device stop re-downloading without propagating the deletion.

**`gemini-revised_plan-r2.md`:**
- The **LAN-only reachability fix** (§4.4) — unique, correct, and cheap; the corpus's own rule file demands "reachability means the remote, not the internet".
- The honesty marker on consensus itself (§2.1: "unanimously agrees … but **unmeasured** until the bisync spike runs") — the discipline the whole round needs.

**`gpt-revised_plan-r2.md`:**
- **Version-specific retirement records** (§4.3) — the design that survives T3; see D1.
- **Retention-count exemptions** ("unresolved conflicts and incomplete transactions are exempt from this rolling count") and the warning that the discard store, pending plans and retained bytes "are **not disposable caches**, despite residing below `/storage/.cache/`" — the IA doc's own convention is that `.cache` contents *self-invalidate* (`repo/docs/conflict-wizard-ia.md` [V]); without this sentence, some future cleanup will correctly-by-convention delete the discard store.
- "Say **'No new saves to upload'**, not 'The cloud is fully in sync'" (§5.2) — the honest-outcome wording, liftable verbatim.
- The lifecycle-gate requirement that ownership **survive ES dying while the emulator lives** (§3.1) — claude's tmpfs marker written by ES does not specify this case, and `engineering-practices.md` documents ES aborting and being restarted [V].
- The **cloned-card experiment as mandatory** (§3.4) vs claude's optional O4 — two live devices sharing one `cloud_device_id` is a *supported* misconfiguration (`cloud_device_id` [V]: "the file can be edited to adopt another device's folder").
- "Never rewrite the manifest merely to refresh `generated_at`" (§3.2) — kills manifest churn on every exit.
- The split-root import destination (§9.3); see D4.

**`mistral-revised_plan-r2.md`:**
- The **inline full-entry JSON amendment** (§2) — as a documentation form for #20's thread, one amended entry shown whole beats a field table; lift the *form* (with the content errors of §4.4 stripped).
- `kind: "container"` for shared VMU/memcard units — arguably cleaner than overloading `rom: null` (gpt/gemini); either is acceptable, but the schema should pick one deliberately.
- "The conflict table is lifted verbatim into #22's ACs" — the right execution instruction, applied to the *corrected* table.

---

## 5. What should not be built

- `gpt-revised_plan-r2.md` §8's **V1 minimal native recovery route** — descoped by the maintainer; move it, nearly intact, to the separate restore-tool issue.
- `mistral-revised_plan-r2.md`'s **≤2-spawn gate**, **in-tree foreign manifest caches**, **provisional-agreement rows**, and **matched-stem `rom` rule** — §4.4.
- `gemini-revised_plan-r2.md`'s **stamp-keyed stores** and any retirement cap that *drops* records rather than deferring them.
- `claude-revised_plan-r2.md`'s **spawn A**, conditionally — build it, but its own degrade clause applies if Gate 6 puts the changed path over budget; **O4** (`writer_instance`) stays optional while gpt's cloned-card *experiment* runs regardless.
- Anything the four already refuse in chorus, kept refused: a staging mirror of the remote tree, a protected-publication store in V1 (unless Gate 2 flips it), tombstones hooked anywhere but the verified delete path, an in-tree discard store, SQLite, a daemon, vector clocks, semantic merging, progress heuristics that *select* a winner, time-based classification, a prompt at launch, and any production role for bisync before question zero is answered.

---

## 6. Where I changed my mind since my revision

1. **The resolution receipt is load-bearing.** I raised the ping-pong reversal (two disagreeing resolutions, no missing state) but did not specify the mechanism. `claude-revised_plan-r2.md`'s `resolves` (§2.3.6) and `gpt-revised_plan-r2.md`'s narrow receipt (§4.4) are the same answer in different clothes: a publication records the versions the player chose *over*, so the next pass applies an informed choice and asks about an uninformed one. I adopt it — per publication, never a permanent stigma on bytes.
2. **Compaction should act on the remote copy.** I held conservative resurrection for everything. `claude-revised_plan-r2.md` §2.3.2's direct remote compaction after re-reading both copies is lossless by construction and converges; my position would have left the upload/compact loop gemini described.
3. **Explicit deletions should propagate as version-specific records.** Post-amendment, my pure-resurrection stance rests on exactly the edge-case argument T3 disqualifies, and gpt's record design answers the indistinguishability problem directly. I keep fail-closed on *unexplained* absence; I drop "never propagate".
4. **The store must be designed for its future reader now.** My out-of-tree placement was necessary but not sufficient; the amendment's one V1 consequence is the sidecar of §1.2.
5. **The honest spawn accounting is 0 idle / 3–4 changed.** Claude's capture-before-network ordering and hash-selected change set convinced me the two-spawn figure I had hand-waved was wrong; the idle path can and should cost zero rclone starts, strictly under D-CLOUD-028.

I hold, against the remaining resistance: verify-by-download on hashless backends at exit (D2), the content-addressed stage as cache-not-authority, manifest transport ownership, and the queued trigger.

---

## 7. What I would build from

**Base: `claude-revised_plan-r2.md`.** It is the most complete and internally consistent artifact: the verdict table, transport rules, exit-path design, adapter contract, plan file, normalised statuses, gate ordering, and honest [V]/[K]/[C]/[M] marking. Its defects are few and each has a named fix.

**Lift into it, before building:**
- From `gpt-revised_plan-r2.md`: version-specific retirement records (D1) with the mass-delete guard and the stop-mutation-not-drop-records rule; the split-root import destination; retention-count exemptions; the ".cache is not disposable" warning; the ES-death survival requirement for the lifecycle gate; the mandatory cloned-card experiment; "never rewrite the manifest merely to refresh `generated_at`"; "No new saves to upload".
- From `gemini-revised_plan-r2.md`: the LAN-only reachability fix (D5).
- From `mistral-revised_plan-r2.md`: the inline-JSON form for the schema amendment; a deliberate decision between `kind: "container"` and `rom: null`.
- From the amendments themselves: the §1.2 discard sidecar; the done-page sentence made explicit everywhere; no undo control anywhere in V1; gpt's recovery-route design re-homed to the separate restore-tool issue as its seed.

The resulting document is claude's architecture with gpt's deletion semantics and the amendment's retention contract — and every number in it still gated on hardware, in the order claude's §8 gives.

---

## 8. Corpus gaps surfaced to the orchestrator

Newly load-bearing this round: **`GuiSaveState.cpp`** — the delete path is now the proposed home of explicit-delete tombstones (D1), and the corpus holds it only as a citation in `issue-24.md`. Also still missing and needed: `SaveState.h`/`SaveStateRepository.h` (default arguments), `Paths.cpp`, `setsettings.sh` (RetroArch `savestate_directory`), rclone 1.75.0 documentation or source for `--backup-dir` with `copy`, `lsjson --files-from`, `hashsum` on local paths and the Dropbox hash type, `docs/es-ui-style-guide.md`, and the current issue bodies with edited ACs. No executed test results of any kind exist in the corpus; every gate remains a gate.

---

## `corpus.provenance.json`

```json
{
  "artifact": "kimi_peer_review-r3.md",
  "role": "council member, round-3 peer review of the four injected revised approaches",
  "corpus_mode": "verbatim embedded read-at-time corpus supplied by Council Facilitator council-facilitator@1.2.0",
  "source_count": 42,
  "manifest_read_timestamp_utc_as_supplied": "2026-09-05T17:32:51Z",
  "member_filesystem_access": false,
  "member_independently_reread_files": false,
  "member_independently_rehashed_files": false,
  "member_executed_commands_or_hardware_tests": false,
  "hash_basis": "sha256 values copied verbatim from the supplied per-source headers; verified at embed time by the Facilitator",
  "injected_plan_artifacts": [
    "claude-revised_plan-r2.md",
    "gemini-revised_plan-r2.md",
    "gpt-revised_plan-r2.md",
    "mistral-revised_plan-r2.md"
  ],
  "injected_plan_hashes_provided": false,
  "own_earlier_revision_embedded": false,
  "amendments_applied": [
    "maintainer restatement of purpose: reversibility first-class, one step back is the depth that matters, edge cases inform but do not drive",
    "maintainer decision: V1 retains discarded copies ON by default bounded by a count, ships no undo control; restore becomes a separate wizard-shaped tool; the V1 store must be designed for that future reader"
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
    {"description": "GuiSaveState.cpp — now load-bearing: the delete path is the proposed home of explicit-delete retirement records (D1)", "declared_source_path": null, "sha256": null},
    {"description": "SaveState.h, SaveStateRepository.h, Paths.cpp, setsettings.sh and the RetroArch launch plumbing", "declared_source_path": null, "sha256": null},
    {"description": "rclone 1.75.0 documentation or source for --backup-dir with copy, lsjson --files-from, hashsum on local paths, Dropbox hash type on local files", "declared_source_path": null, "sha256": null},
    {"description": "docs/es-ui-style-guide.md; current issue bodies with edited ACs; any executed test results", "declared_source_path": null, "sha256": null},
    {"description": "kimi-revised_plan.md and the other round-2 artifacts, known here only through the injected plans' citations", "declared_source_path": null, "sha256": null}
  ],
  "missing_source_policy": "No missing source paths, hashes, file contents, or execution results have been fabricated."
}
```

=== END kimi_peer_review-r3.md ===

=== START mistral_peer_review-r3.md ===

I have reviewed the five revised approaches for the cloud-save conflict resolution foundation in ROCKNIX. Below is my analysis, focusing on the real disagreements, load-bearing claims, and what each plan uniquely offers.

---

## 1. Real Disagreements and How to Settle Them

### 1.1 Deletion Propagation
**Disagreement:** Whether deletions should propagate in V1, and if so, how.
- **`claude-revised_plan-r2.md` and `kimi-revised_plan-r2.md`:** Propagate only recorded deletions (ES deletions, renumbers, compactions, wizard choices) as moves into dated siblings. Unexplained absence fails closed.
- **`gemini-revised_plan-r2.md` and `mistral-revised_plan-r2.md`:** Never propagate deletions in V1; treat absence as a fail-closed anomaly.
- **`gpt-revised_plan-r2.md`:** Propagate only version-specific retirements with receipts, never deletions inferred from absence.

**Settlement:** The churn trace in `kimi-revised_plan-r2.md` (C1) proves that pure resurrection cannot terminate. The receipts-and-siblings mechanism is the minimal solution that converges. The fail-closed half of `gemini` and `mistral`'s argument is preserved: unexplained absence fails closed. The residual is bounded churn, which is annoying but never lossy.

**Experiment:** The churn-termination fixture (cloud-only `state5` onto `{0,1,2}`; download; launch and exit; sync twice; assert one copy per side, no churn, the retired cloud copy in the dated sibling).

---

### 1.2 Concurrency Contract
**Disagreement:** Whether `--backup-dir` in both directions is sufficient for recoverability, or if a protected-publication protocol is needed.
- **`claude`, `gemini`, `kimi`:** `--backup-dir` in both directions is sufficient for V1 under the one-player model.
- **`gpt`:** A protected-publication protocol is needed for linearizability.
- **`mistral`:** The pre-upload check alone cannot close the window.

**Settlement:** The one-player model does not earn a two-phase commit on a 5-second path. `--backup-dir` is the chosen mechanism, with the residual stated honestly: recoverability, not prevention. The race fixture (§11, gate 7) will prove whether `--backup-dir` preserves intervening heads on Dropbox and WebDAV.

**Experiment:** The two-H700 race fixture (interleave publications; kill after each destructive stage; assert both heads present, one canonical, one siblinged).

---

### 1.3 How C's Bytes Are Obtained
**Disagreement:** Whether to use a full staging mirror or candidate-scoped reads.
- **`kimi` and `claude`:** Candidate-scoped reads with the full stage as a hashless fallback.
- **`gpt`:** Full staging mirror as the default.
- **`mistral`:** Metadata-only detector.

**Settlement:** The full staging mirror is blind to same-size changes on hashless backends (the #53 shape). Candidate-scoped reads are the correct default, with the full stage as a fallback for backends offering neither hash nor modtime. The shadow census (§11, gate 8) will measure the cost of the fallback mode.

**Experiment:** The same-size WebDAV fixture (change a cloud SRAM preserving size; the classifier must not conclude "cloud unchanged").

---

### 1.4 Bisync's Role
**Disagreement:** Whether bisync should be the detector or a candidate transfer engine.
- **`claude` and `kimi`:** Bisync is a candidate transfer engine pending the spike.
- **`gpt` and `gemini`:** Bisync is demoted; the classifier is ours regardless.
- **`mistral`:** Bisync is the detector.

**Settlement:** The problem statement listed bisync-as-detector as the approach under judgement, but no register row made it binding. The spike (§11, gate 2) will decide whether bisync earns the bulk-transfer role for non-conflicting units. The classifier is ours regardless.

**Experiment:** The bisync spike matrix (§11, gate 2).

---

### 1.5 #10's Per-Core Directories
**Disagreement:** Whether #10 should be deferred.
- **`kimi` and `gpt`:** Defer #10 to its own futro, with proof obligations and a real-device rehearsal as gates.
- **`claude` and `gemini`:** Keep #10 in the drop, sequenced last.
- **`mistral`:** #10 is unnecessary.

**Settlement:** Shipping `es_savestates.cfg` is a launch-behaviour migration, not a config change. The wizard does not need the directory, but the flat layout's local cross-core overwrite is pre-existing shipped behaviour. #10 gets its own futro, and the rehearsal gate ensures the launch behaviour is preserved.

**Experiment:** The #10 launch-behaviour rehearsal (§11, gate 5).

---

### 1.6 Wizard Trigger, Retention Default, Cancellation, Auto KEEP BOTH, Kid Mode
**Settlement:** Queue-and-badge trigger (IA rev 5); retention ON with count 3 (register row); gpt's precise cancellation sentence; the resume-side sub-choice for auto KEEP BOTH; gpt's kid/kiosk rule over mistral's reachability requirement.

---

## 2. Load-Bearing Claims That Need Testing

| Claim | Experiment | Outcome |
|---|---|---|
| `--backup-dir` preserves the intervening head under a two-writer race | Race fixture (§11, gate 7) | If pass: ship as designed. If fail: adopt gpt's protected-publication protocol before multi-device ships. |
| The exit upload overwrites the cloud head of a fork | Cheap counterexample (§11, gate 1) | Corpus-settled; no experiment needed. |
| The session-zombie resume-point loss | H700 reproducer (§11, gate 3) | Corpus-traced; the lifecycle gate is the fix. |
| Foreign-manifest republication | Round-trip fixture (§11, gate 1) | Corpus-settled; the fixture verifies the hazard. |
| Auto states are the commonest conflict | Shadow census (§11, gate 8) | The wizard treats `kind: auto` as a resume-point decision regardless. |
| 480×320 thumbnails are recognizable | RG351M recognition test (§11, gate 9) | If fail: single-column compare as fallback. |
| `--filter` vs `--filter-from` ordering | Dry run (§11, gate 0) | If `--filter` cannot be ordered ahead, use `--exclude`/`--include`. |
| `rclone hashsum <backend>` computes backend-native hashes locally | Device experiment | Not a dependency; the exit path can defer to the next full pass. |

---

## 3. What Each Plan Uniquely Offers

### `claude-revised_plan-r2.md`
- **Intent-recorded deletion receipts propagated as moves into dated siblings.** This is the minimal mechanism that terminates D-CLOUD-030's compaction.
- **The reflash bootstrap.** A reflashed device regenerates the same `cloud_device_id` and seeds from its own previous manifest before its first capture republishes.
- **The lifecycle gate with fixed acquisition order.** This closes the boot-sync vs gameplay race structurally.

### `gemini-revised_plan-r2.md`
- **The `--backup-dir` retention seed.** This is the recoverability mechanism adopted by `claude` and `kimi`.
- **The #10 launch-behaviour rehearsal as a real-device pre-implementation gate.** This ensures the launch behaviour is preserved after shipping `es_savestates.cfg`.
- **The one-sentence D-CLOUD-029 confirmation.** "The stopgap merely moves the clobber from game-exit to boot."

### `gpt-revised_plan-r2.md`
- **The unit-level member-map classifier.** This is the correction to `kimi`'s per-file aggregation (C6).
- **The D-CLOUD-030 clarification.** Compaction concerns numbered states in one game/core repository, idle, after verified copies; never collapses an auto resume point into a numbered slot.
- **The `makeStateFilename` parent-derivation finding.** A staged-in-/tmp state would merge into /tmp — stage in the real save directory under a temp name.
- **The eight #24 acceptance criteria.** Especially "standalone-emulator states never allocate" (`isEnabled` requires `retroarch`).

### `kimi-revised_plan-r2.md`
- **The ops journal + receipts.** This makes `replaces` correct across the rename-then-edit sequence.
- **The discard store outside the sync tree.** This avoids sync-tree contamination and requires no allowlist exclusions.
- **The shadow census.** This measures fork rate per kind, verdict distribution, unknown rate, and the exit-path cost in spawns, round trips, and seconds.
- **The ordered hardware gates with a defined shadow census.** This ensures the foundation is proven before it is built.

### `mistral-revised_plan-r2.md`
- **The out-of-scope fence.** This is a builder needs it as much as the plan.
- **The IA-text corrections for rev 5.** The "checked, not assumed" paragraph is wrong about `getNextFreeSlot()` for the auto-only case.
- **Move observation as a first-class mechanism.** This is the correction to `gpt`'s reconstruction-after approach.

---

## 4. What Should Not Be Built

- **A protected-publication protocol in V1.** The one-player model does not earn it on a 5-second path.
- **A separate apply journal beyond the frozen plan with per-unit status.** The frozen plan is the journal.
- **The full staging mirror as a default mode.** It is blind to same-size changes on hashless backends.
- **Semantic binary merging, vector clocks, a shared database, a SQLite history index, a daemon.** These are out of scope for V1.
- **A 99-slot product cap to work around the allocator defect.** The allocator defect is fixed in the adapter.
- **Permanent loser memory as automatic authority.** A deliberately restored file is a new version, not a stigmatized one.
- **Tombstones for hypothetical external writers.** Receipts cover our recorded operations only.
- **A kid/kiosk-mode resolver.** A kid resolving save conflicts destructively is what kid mode exists to prevent.
- **Progress heuristics that select a winner.** The cardinal rule forbids it.

---

## 5. The Plan I Would Build From

I would build from `kimi-revised_plan-r2.md`, with the following additions from the other plans:

1. **From `claude-revised_plan-r2.md`:**
   - The reflash bootstrap.
   - The lifecycle gate with fixed acquisition order.
   - The in-spawn manifest transport filters.

2. **From `gpt-revised_plan-r2.md`:**
   - The unit-level member-map classifier.
   - The D-CLOUD-030 clarification.
   - The `makeStateFilename` parent-derivation finding.
   - The eight #24 acceptance criteria.

3. **From `gemini-revised_plan-r2.md`:**
   - The `--backup-dir` retention seed.
   - The #10 launch-behaviour rehearsal as a real-device pre-implementation gate.

4. **From `mistral-revised_plan-r2.md`:**
   - The out-of-scope fence.
   - The IA-text corrections for rev 5.

---

## 6. What Would Change My Mind

- **The race fixture (§11, gate 7):** If `--backup-dir` does not preserve intervening heads on Dropbox or WebDAV, gpt's protected-publication protocol becomes load-bearing before multi-device ships.
- **The shadow census (§11, gate 8):** If the decision-scoped download set is large on the maintainer's library, the full-stage fallback is priced and accepted for hashless backends only.
- **The bisync spike (§11, gate 2):** If bisync satisfies the contract and materially simplifies full-pass transport, it earns the bulk-transfer role for non-conflicting units.
- **The #10 rehearsal (§11, gate 5):** If the XML path cannot preserve launch behaviour, the appropriate resolver/configuration behaviour is changed deliberately; the naive config is not shipped.

---

## 7. Final Recommendation

Build from `kimi-revised_plan-r2.md` with the additions above. It is the most complete, safest, and most thoroughly tested foundation for cloud-save conflict resolution in ROCKNIX. The ordered hardware gates ensure the foundation is proven before it is built, and the shadow census ensures the design is tuned to the maintainer's real library. The receipts-and-siblings mechanism is the minimal solution that terminates D-CLOUD-030's compaction, and the lifecycle gate closes the boot-sync vs gameplay race structurally. The wizard's queue-and-badge trigger is the correct console-first design, and the discard store outside the sync tree avoids sync-tree contamination.

=== END mistral_peer_review-r3.md ===
