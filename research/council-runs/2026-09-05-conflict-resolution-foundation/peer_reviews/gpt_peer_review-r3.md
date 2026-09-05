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