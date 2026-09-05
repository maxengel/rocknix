# Round-2 peer review

## Recommendation

**I would build from `claude-revised_plan.md`, but not implement it unchanged.** It gives the clearest account of lifecycle ownership, manifest transport ownership, capture, error reporting, and migration. Those are the boundaries that a correct conflict test cannot protect by itself.

Before using it as the implementation specification, I would:

- Remove its provisional-agreement permissions and its unsupported guarantee that `--backup-dir` makes concurrent overwrites recoverable.
- Correct conflict classification for multi-file units.
- Narrow deletion handling rather than adopt its entire deletion table.
- Take self-contained producer provenance and reusable, **verified** staging from `kimi-revised_plan.md`.
- Take the explicit real-device #10 launch-behaviour rehearsal from `gemini-revised_plan.md`.
- Take the move-observation approach from `mistral-revised_plan.md`, rather than infer lineage after a rename-and-overwrite.
- Treat #10’s deferral as internal build sequencing, **not evidence that a release without local core isolation is safe**.
- Specify durable recovery from an interrupted apply before enabling destructive actions.

No plan is ready to become an unqualified implementation contract. Three particularly consequential errors survive in these revisions:

1. An exit-only `copy` upload does **not** preserve both sides of a fork.
2. Hashing a metadata-skipped staging copy does **not** establish the cloud’s current content.
3. Grouping already-classified file conflicts does **not** correctly classify a multi-file save.

### Evidence convention

I used only the embedded corpus. I did not access files, run commands, re-hash sources, or conduct hardware tests.

Source citations `[S1]`–`[S42]` refer to the full declared paths and exact Facilitator-provided hashes at the corresponding positions in `corpus.provenance.json` below. Paths abbreviated in prose are suffixes of those declared paths. The revised-plan filenames identify proposals under review, not evidence that their technical claims are true. Earlier analyses and reviews mentioned inside those plans were not independently available.

---

## 1. Claims that must not survive into implementation

### 1.1 The “lossless one-way stopgap” is still destructive

This affects:

- `gemini-revised_plan.md`, §5.1;
- `kimi-revised_plan.md`, F5;
- `mistral-revised_plan.md`, §§1, 3.2, and 6.

Disabling downloads prevents one direction of overwrite. It does not prevent the remaining upload from overwriting the cloud.

A sufficient counterexample is:

| Before the exit upload | Content |
|---|---|
| Local save at path *p* | X |
| Cloud save at path *p* | Y |
| Other retained copy of Y | None established |

The shipped `cloud_backup --recent` forces `copy`. Its `--backup-dir` branch applies to `BACKUPMETHOD=sync`, which that recent path has just overridden. If X is transferred, the result is X locally and X in the cloud. **Y has not been preserved.**

This follows directly from `cloud_backup::backup_game_saves`, not from any assumed bisync behaviour. [S29]

The claim that another device probably still holds Y is insufficient. Y may be a cloud-only version after a reflash, deletion, card replacement, or an earlier overwrite. Neither the current transport nor these stopgap proposals pins it.

There is also a configuration mismatch:

- The shipped startup toggle controls the **whole boot pair**, not just its restore half.
- The embedded menu map supplies no toggle that disables the manual SYNC row.
- The literal boot script uses two separate commands, not an `&&` chain. Its backup can run after its restore fails. [S13, S35]

**Disposition:** reject this stopgap’s safety claim. D-CLOUD-029 remains binding unless the maintainer explicitly accepts a new row changing it. `mistral-revised_plan.md` cannot both say it respects D-CLOUD-029 and then replace that decision in its register table. [S6]

**Cheapest confirming experiment:** in an isolated test prefix, use different-sized X and Y so a comparison shortcut cannot hide the overwrite; run the actual recent upload and inventory every retained copy of Y.

**Prediction:** the canonical cloud object becomes X. The proposed posture is not lossless.

---

### 1.2 Kimi’s staging mirror reintroduces the failure it says it eliminates

`kimi-revised_plan.md` F3 proposes:

> `rclone copy`, allowlist-filtered, skipping unchanged by the backend’s available metadata

It then says this learns C by content on every backend, while acknowledging that on WebDAV a same-size cloud change can remain invisible.

Those statements cannot both support the proposed classifier.

Consider this sequence:

1. Local, cloud, agreement, and stage initially contain H₀.
2. The cloud becomes Hᶜ, with the same byte length.
3. Local becomes Hˡ.
4. The metadata-based copy leaves staged H₀ untouched.
5. Hashing the stage yields H₀.
6. The classifier concludes “cloud equals agreement; only local changed” and uploads Hˡ.

The actual situation was a fork. The hash verified the **cache**, not the cloud.

The corpus explicitly identifies the QA WebDAV as having neither usable hashes nor modtimes, and `cloud_backup` documents the same-size comparison failure that caused #53. The schema calls size/modtime hints, with content confirmation after download. [S3, S4, S29]

Kimi’s qualification—

> any path whose decision matters gets download-and-hash confirmation

—can repair this only if it is an explicit, unavoidable admission rule. It must cover:

- overwrites;
- equality used to establish agreement;
- “nothing to do” conclusions presented as verified synchronization;
- deletion or duplicate-cleanup decisions;
- reuse of a staged candidate at COMPLETE.

It cannot coexist with an accepted rule that same-size changes remain invisible until a future size change.

There is a second staging problem: **`rclone copy` does not make a mirror.** A file removed remotely can remain in the stage. Presence in the staging directory is therefore not proof of current remote presence. Each staged object needs to be associated with a successful current inventory or another valid freshness proof.

`mistral-revised_plan.md` has the corresponding unresolved problem in §3.1: listing hashes—or size and mtime—and reading local metadata does not obtain a current cloud SHA-256 on a hashless backend. `gemini-revised_plan.md` also needs to explain where verified C comes from; naming a SHA-256 manifest diff does not answer that.

**Disposition:** retain staging as a cache of verified candidates, not as an authoritative mirror obtained through ordinary comparison skipping. Unknown freshness must remain unknown.

**Cheapest experiment:** repeat a same-sized SRAM overwrite against an already-populated WebDAV stage, then change the local SRAM and inspect the classifier’s proposed action.

**Prediction:** ordinary metadata-skipped staging misses the cloud change. Forced content retrieval or an explicit unknown verdict is necessary.

---

### 1.3 The multi-file classifier must operate on the unit, not just aggregate file conflicts

`claude-revised_plan.md` §3.4.3 and `kimi-revised_plan.md` F3 say, in substance:

> Classify per path; if any member is divergent, mark the group divergent.

That is insufficient for a save whose members form one coherent unit.

Suppose a declared save unit contains files *a* and *b*:

| Snapshot | a | b |
|---|---|---|
| Agreed | a₀ | b₀ |
| Local | a₁ | b₀ |
| Cloud | a₀ | b₁ |

Neither file is individually divergent:

- *a* looks device-changed;
- *b* looks cloud-changed.

The proposed rule silently constructs `(a₁, b₁)`. Neither device produced that snapshot.

For an indivisible save unit, **both sides changed the unit**, so this is a group-level fork even though no individual path changed on both sides.

`gemini-revised_plan.md` has the right high-level requirement—resolve the whole bundle—but does not yet provide the group-level test. `mistral-revised_plan.md` similarly needs more than a new `container` kind.

The actual grouping boundaries remain empirical. The corpus names PPSSPP game-ID layouts and shared VMUs, but does not prove that every N64 pair, VMU directory, or emulator-specific directory is one indivisible unit. [S1, S6, S32] Assertions that N64 files are either necessarily coupled or “largely independent” remain hypotheses here.

**Disposition:** for a declared coherent unit, compare its complete local, cloud, and agreed member maps, including membership changes. Do not merely combine already-detected per-file conflicts.

**Cheapest experiment:** the two-file example above is enough to test the classifier. Then verify the grouping table with actual emulator writes.

**Prediction:** both detailed per-file-then-group rules misclassify the example unless amended.

Also, “resolve as a unit” is not the same as “transfer atomically.” None of the embedded material establishes atomic remote directory replacement. An interrupted bundle publication must not become a playable mixed generation.

---

### 1.4 Rechecking and saving the previously observed bytes do not guarantee recovery from a concurrent overwrite

`kimi-revised_plan.md` F9 says its remaining lost race is recoverable because it staged the prior version. `claude-revised_plan.md` §3.7.4 makes the stronger claim that the overwritten bytes will be retained through `--backup-dir`.

The unresolved interleaving is:

1. A checks cloud H₀ and retains H₀.
2. B publishes Hᵇ.
3. A publishes Hᵃ over Hᵇ.

A retained H₀, not Hᵇ.

A `--backup-dir` may improve this substantially. But the corpus does not establish **which generation it archives under this race**, the atomicity of its move/copy operations across backends, or what happens when two devices choose the same dated archive destination. The shipped use is with `sync`; the proposed use and concurrency guarantee require testing. [S29]

Calling the race an accepted limitation is honest only if its consequence is stated accurately:

> A concurrent version may be lost unless that version itself was durably retained.

It is not enough to say “lost update possible, but bytes retained” without establishing the latter.

**Disposition:** accept rechecks as useful detection and staging as preservation of observed candidates. Reject a universal recoverability guarantee based on them. If no-loss under concurrent compliant devices is required, every produced version needs a proven preservation path before canonical replacement. If that stronger requirement is deferred, state the residual possible loss plainly.

**Cheapest experiment:** insert a new cloud-only version after the final recheck and before publication, then inspect canonical, archival, and staged objects by hash. Repeat with two same-second archive destinations.

**Prediction:** precheck-plus-stage alone cannot preserve an intervening version. `--backup-dir` results will be backend- and operation-dependent until proven otherwise.

---

### 1.5 None of the plans finishes the interrupted-apply contract

Preserving losers and writing an audit line before deletion are necessary. They do not fully specify recovery when power fails:

- after one member of a bundle is installed;
- after local replacement but before remote publication;
- after remote publication but before agreement is advanced;
- after an intent was logged but before the operation happened.

`claude-revised_plan.md` is the closest, but its per-item ordering is not yet a recovery state machine. The other plans are less explicit.

The audit log is bounded, support-oriented text under D-CLOUD-027. It must not silently become the sole transaction journal or the only record identifying an incomplete apply. [S6]

**Required acceptance contract:** after interruption, the implementation can identify the exact planned versions and destinations, distinguish completed work from intent, keep incomplete units out of emulator consumption, and either finish or safely stop without deleting a unique candidate.

A small durable pending-operation record is earned here. A database, daemon, distributed two-phase commit, or unbounded history service is not.

This is V1 apply safety, not the V2 rollback browser. The upgrade rule already treats interruption as normal. [S11]

---

## 2. The remaining disagreements, made decidable

### 2.1 Bisync’s role: substantive; “stateless” is mostly terminology

All four plans prefer application-owned reconciliation. That preference is defensible because the application already needs to understand:

- slot identity;
- save units;
- producer metadata;
- manifest ownership;
- screenshots;
- player decisions.

But several stated reasons for rejecting bisync are still not evidence.

`mistral-revised_plan.md` repeatedly states as fact that bisync is SRAM-blind, necessarily demands resync on first runs and filter changes, and has a corruption-prone workdir. The embedded futro poses these as failure scenarios to investigate; it is not an executed trace. The issue comments show help output and an interpretation of defaults, not the actual conflict side effects. [S5, S23]

`claude-revised_plan.md` improves the epistemic labels, but still overreaches in places:

- Rewriting a filter file does not establish that its content changed.
- Even changed content does not establish how bisync fingerprints it.
- A full-sync engine need not satisfy the exit path’s no-remote-contact fast path if the application simply does not invoke it on that path.

Kimi similarly cannot call post-manual-apply failure “spike-independent” while correctly listing the behaviour as a hypothesis.

**What settles it:** a version-pinned, disposable real-run matrix, not just dry-run output:

- genuine fork under `none`;
- same-size edits on WebDAV;
- rename and deletion;
- external equalization after a manual resolution;
- unchanged filter rewrite versus actual filter change;
- interruption and recovery;
- missing listings;
- exact pre/post names and bytes.

The corpus contains neither upstream 1.75.0 implementation material nor a roadmap that could settle these claims. [S16, S23]

**My expectation:** application policy remains necessary whatever the spike finds. Bisync might still earn a limited transfer role; the available evidence does not establish that it has already failed every relevant contract.

**What not to build:** a permanent second diagnostic reconciler in production, maintaining another baseline and making extra remote calls after its adoption question has been answered. Keep that comparison in developer tests.

As for “stateless”: a pure classification function consuming inventories and agreement is a good design. The overall system is nevertheless stateful. `agreed.json`, pending applies, and retained versions are state. Avoiding a bisync workdir does not remove recovery obligations.

---

### 2.2 General deletion propagation versus conservative resurrection

This is a real disagreement:

- Claude, Gemini, and Mistral add tombstones.
- Kimi deliberately does not propagate ordinary deletions in V1.

**I favour Kimi’s conservative ordinary-deletion policy for V1**, but not its claim that existing compaction makes the whole problem disappear.

D-CLOUD-030 removes a higher numbered duplicate after re-verification. If that removal is only local and every absent path is subsequently restored, the next sync downloads it again, compaction removes it again, and the cycle repeats. That is safe in the narrow byte-preservation sense but does not converge. [S3, S6]

The distinction worth preserving is:

1. **Unexplained absence:** not deletion authority.
2. **Explicit player deletion:** a separately approved propagation policy.
3. **Verified duplicate cleanup:** already decided, and lossless only within its carefully checked scope.

Claude’s full deletion table is not ready to implement. For example, row 12 tests for a remote tombstone but does not explicitly require that it targets the currently agreed version. A stale tombstone for an earlier occupant of a reused path must not authorize removing the present occupant. A mass-delete threshold does not repair that problem.

**What settles the scope:**

- Three consecutive syncs after duplicate compaction: do transfers cease?
- Delete-and-renumber on one device, then edit the reused slot on another.
- Reuse a formerly deleted path and later present its old tombstone.
- Substitute a different populated save tree at the same configured root.

**Prediction:** conservative resurrection protects unique bytes; local-only duplicate deletion churns; path-only deletion records eventually target the wrong occurrence.

**Build implication:** do not make a general deletion protocol a prerequisite merely to solve duplicate convergence. Conversely, do not defer duplicate convergence while claiming D-CLOUD-030 has solved it.

---

### 2.3 Producer provenance, placement, and lineage are different records

Here `kimi-revised_plan.md` has the better direction: preserve producer metadata when a version is materialized elsewhere.

Claude’s “look up producer by hash across manifests” works only while some retained manifest still describes that hash. A per-device map with one current entry per path is not immutable history. If the producer overwrites that path, old core/build/capture metadata can disappear. A V2 index cannot reconstruct fields that no surviving record contains. D-CLOUD-027’s rotated audit log does not make this unbounded history durable. [S3, S6]

Mistral’s proposed `origin: {device, hash}` is a useful reference but may still be insufficient to display an old version’s core build and capture time once its producer’s entry has been replaced.

**Preferred contract:** materialization preserves the version’s available producer metadata separately from the device publishing or holding it. A re-slot is a new placement, **not a new save version** if the bytes are unchanged. Claude’s §3.6.7 calls it a new version; that contradicts D-CLOUD-030. [S3, S6]

There are two additional problems to correct:

#### Rename-then-edit defeats Claude’s possession-record shortcut

Suppose:

- slot 1 held H₁;
- slot 2 held H₂;
- ES deletes slot 1 and renames slot 2 to slot 1;
- the next session overwrites slot 1 with H₃.

Reading the old agreement at slot 1 yields H₁, not H₂. Claude’s R5 does not solve this unless the placement record was updated when the move occurred. The embedded ES code makes those moves before the proposed exit capture. [S37, S38, S41]

This is where Mistral’s instruction to **observe move operations** is valuable. If the predecessor was not observed, uncertain lineage is better than a confidently wrong `replaces`.

#### Reflash recovery cannot block offline capture

Claude’s “download before first capture” conflicts with its own requirement that capture works offline and independently of sync.

The right acceptance test is not “did capture first contact the cloud?” It is:

> Can a reflashed device capture offline without erasing historical metadata when it eventually republishes its own manifest?

Also, the identity implementation has both current and legacy naming logic. The permanent-address seed does not imply the full identifier remains identical across the naming-era transition. [S34]

**Experiments:**

- Re-slot a state; let its producer overwrite the original path; confirm provenance survives.
- Run the rename-then-edit sequence and inspect `replaces`.
- Reflash using both a current generated identity and a stored legacy identity; capture offline first.
- Clone an ID onto a second device of the **same model**.

**Prediction:** hash-union lookup alone loses historical provenance; unchanged per-path possession misattributes the predecessor; model/family checks miss same-model identity collisions.

Claude’s `generated_at` comparison is not an identity-collision proof either. Clocks are explicitly untrusted in this design. [S3]

Finally, agreement scoping is necessary, but hashing an entire remote config section is too blunt. Test credential refresh separately from changing the actual remote account/root. The former should not necessarily invalidate every agreement; the latter must.

---

### 2.4 Deferring #10 is a sequencing choice, not a safety argument

Claude and Kimi defer per-core directory materialization. Gemini instead makes its behavioural rehearsal an explicit gate. Mistral does not adequately address the launch-mode migration.

The code supports the central warning:

- `Default()` enables `racommands`, autosave, and incremental behaviour.
- XML-loaded configurations set `racommands=false`.
- Autosave and incremental behaviour must be declared explicitly rather than inherited from the compiled default. [S39]

That earns a rehearsal. It does **not** prove that the entire feature can safely ship without core isolation.

Claude says flat-path collisions will become visible conflicts with core metadata. That is only true if both versions survive until reconciliation. On one device, core C₂ can write the same flat `.state.auto` or numbered-slot path previously used by C₁ **before the reconciler sees either fork**. Metadata cannot recover overwritten bytes.

The same issue exists independently of chipset compatibility: two different cores are not made interchangeable by a successful same-core H700/RK3326 transfer.

**Preferred disposition:** defer #10’s implementation until its behavioural contract is understood, if useful for development. Do not declare the drop safe without either the decided isolation or an explicitly accepted alternative that prevents local cross-core overwrite. D-CLOUD-017 still governs the release design. [S6]

**Experiment:** on a protected test library, create a known state under one core, switch core, save through both auto and numbered paths, and inventory which original versions remain. Separately install the proposed configuration and exercise resume, incremental save, core selection, and legacy-flat discovery.

**Prediction:** creating the configuration changes launch behaviour; the exact effects require observation. Leaving the flat namespace in place does not itself preserve versions across core switches.

---

### 2.5 The changed-file exit budget is not yet priced

The revisions correctly recognize that D-CLOUD-028 needs an explicit amendment if changed-file uploads require additional correctness reads. But their numerical claims are not yet internally consistent.

Claude proposes:

1. a remote listing;
2. a save payload upload;
3. an explicit own-manifest single-file upload.

That is already at least three rclone invocations as described, not its claimed two, before any separate post-upload verification. Its later statement that the manifest “rides the same push” contradicts the explicit separate transfer rule.

Kimi adds staging and, on hashless backends, post-upload download-and-hash. Those are legitimate correctness costs, but the invocation and remote-operation counts need to be stated.

A locally computed backend-native hash is an **expected** value. Computing it is not proof that the remote stored it, and it does not by itself satisfy the current schema’s definition of `remote_hash` as a post-upload observation. [S3] A verified transfer-level check may supply the needed evidence, but that remains an experiment.

The shipped code also does not have a zero-spawn local-diff fast path. It normally starts rclone with a time window. “No qualifying recent files” and “no newly changed files since the last run” are not identical because the window deliberately overlaps by ten minutes. [S29]

There is a product difference as well:

- Claude defers many hashless-backend exit uploads to a full pass.
- Kimi pays to verify them.

Deferral can be safe but fails the cross-device handoff if no full pass runs on A before the player starts B. “Queued on this device” must not be reported as “safe in the cloud.”

**What settles it:** an invocation/operation trace and H700 timings for:

- no changed candidates;
- one changed SRAM;
- one state plus PNG;
- a save unit;
- hashless verification;
- unavailable network;
- A exits, then B starts without A rebooting or receiving another manual sync.

**Preferred outcome:** preserve the no-change fast path, accept a measured correctness cost for changed files, and report pending work honestly. Do not certify data by size to meet a budget.

---

### 2.6 UI disagreements need product decisions, not technical camouflage

#### Automatic wizard versus queued conflicts

Claude largely retains rev 4’s automatic trigger; Kimi explicitly queues conflicts.

That is substantive. A result file does not decide whether the UI should open immediately.

I favour Kimi’s queued, durable entry for unattended/exit-triggered work, with a direct route from an explicitly requested sync. But it requires an IA amendment: it must not quietly replace the current trigger contract. [S2]

The experiment is a controller-only session containing several conflicts, followed by dismissal, reboot, and return to the affected game. Measure whether the player can find and finish resolution without a forced interruption or a hidden backlog.

#### Cancellation

Claude correctly identifies the contradictory original promises, but its replacement text still says “nothing was overwritten” during preparation.

Non-conflicts include `L=A, C≠A`, which is an agreed one-sided update and can overwrite local A. [S3]

The accurate promise is narrower:

> Cancelling leaves the conflicting versions unchanged and discards the walkthrough’s choices. Earlier non-conflicting updates have already been applied.

Kimi, Gemini, and Mistral should not simply retain the globally worded “nothing transfers until COMPLETE” alongside an applying pre-pass.

#### KEEP BOTH on auto states

Kimi says the “winner” stays at `.state.auto` and the loser becomes a numbered slot. But KEEP BOTH does not identify a winner in the IA.

Every plan needs a deterministic, visible answer to:

> Which copy will automatic resume use after KEEP BOTH?

That cannot be inferred from recency or left to transfer order.

#### Retention

Default-on bounded retention is a reasonable proposed amendment. But:

- It is not already the settled default.
- `--backup-dir` does not make the implementation nearly free.
- The IA specifies a count selector, **not a default count of three**. Mistral’s attribution is wrong; three is the shipped system-backup retention default. [S2, S33]
- Retained bytes without a controller-accessible recovery action are not yet a console-first undo feature.

If rollback UI remains V2, distinguish “copies retained for recovery” from “you can undo this choice here.”

#### Kid/kiosk mode

Mistral uniquely makes access a required test; Claude explicitly avoids opening the wizard there. The embedded menu map says GAME SETTINGS is in the full-UI block. A badge only in that menu is invisible in kid/kiosk mode. [S13]

This needs a maintainer decision: resolution after unlocking, or a deliberately permitted restricted-mode resolver. I would not automatically expose destructive choices to kid mode merely to satisfy Mistral’s sentence. I would require that pending conflicts remain safe, understandable, and resolvable through the chosen access path.

---

### 2.7 Result file versus exit code is not a meaningful either/or

Claude proposes a durable result plus a normalized conflicts status. Kimi insists conflicts must never be signalled by an exit code.

The important requirements are:

- rclone codes must not escape into the application’s reserved status meanings;
- a durable, validated result must carry details;
- the UI must not mistake an old result for the current run;
- unavailable classification must not appear as clean synchronization.

A normalized exit code can summarize the same result. It is not inherently unsafe. Conversely, a state file alone is unsafe if a failed run leaves yesterday’s clean file in place.

The source finding is real: `cloud_backup` and `cloud_restore` can pass through rclone 3/4, while `ThreadedCloudSync` presents all 3/4 as friendly skips. Both script mains also return only the saves-phase status, potentially masking a system-phase failure. [S29, S30, S40]

**Disposition:** combine durable, run-correlated results with normalized status. Do not build competing notification mechanisms or treat missing results as success.

---

## 3. Additional source checks

These findings are worth carrying into acceptance criteria without re-litigating them.

| Claim | Corpus check and consequence |
|---|---|
| Auto-only allocation returns −99 | **Supported.** The vector is nonempty because it contains slot −1; the nonnegative scan finds nothing. Handle this specific case without treating every −99—including unsupported allocation—as permission to use slot zero. [S37] |
| `copyToSlot()` verifies success | **False.** After preliminary checks, it ignores state and image copy/rename results. A checked adapter is necessary. Prefer repairing/reusing the allocator and helper contracts over creating a permanently divergent slot implementation. [S38] |
| Refreshing before a batch prevents repeated slot allocation | **Insufficient.** If planned copies have not yet materialized, repeated refreshes see the same free slot. Gemini needs explicit reservations, as Claude and Kimi already require. Refresh also deletes repository-owned state objects. [S37] |
| Creating XML config always disables exit renumbering | **Overstated.** It changes the `racommands` path, but the final `onGameEnded()` renumber also depends on `config->incremental`. Explicit XML settings matter. [S38, S39] |
| `getCore(true)` is necessarily the actual launched core until #10 ships | **Too broad.** The demonstrated compiled-default path supports that inference; the configurable alternate launch path already exists. Upgraded installations can have custom configuration. Preserve the executed launch descriptor rather than rely on a future feature boundary. [S38, S39, S42] |
| Auto states necessarily diverge every session | **Not established.** ES can back up and restore `.state.auto` around numbered-slot launches. Frequency is a census question, not a premise for architecture. [S38, S41] |
| The schema already contains independent PNG entries because it has `screenshot` | **Not established.** It contains a companion-path field; that is not the same as a separate PNG version record. The relevant missing guarantee is binding the displayed PNG to the chosen state version. [S3] |
| `rom` should universally become the matched stem | **Reject that blanket change.** ES supports `nofileextension` both ways. Preserve game identity from the launch context and distinguish it from the basename used by a particular save pattern. [S3, S37, S39] |
| A safety exclusion placed before the defaults’ savestates include is unconditional | **False.** User rules precede defaults. Mistral’s discard exclusion can be defeated. The explicit option construction and transport ownership in Claude/Kimi are better; test the effective command, not just the default file. [S9, S31, S32] |
| The existing round-trip suite is a trusted baseline | **False.** Its config overwrite precedes its remote assertion, cleanup is incomplete, and archive expectations have drifted. Also review its arbitrary `qa-content` directory assumption against D-CLOUD-019’s ES-system allowlist; do not weaken production membership to make an obsolete fixture pass. [S6, S36] |

The boot/emulator overlap is a credible and important mechanism: the detached boot script and the ES launch/exit path have no demonstrated shared gameplay exclusion. But the exact timing and resulting byte loss remain to be reproduced. A “verified mechanism” should not be presented as a hardware incident already observed. [S35, S41]

---

## 4. What each plan uniquely contributes—and what not to build

### `claude-revised_plan.md`

**Distinct contribution worth retaining:** it supplies an actual ownership mechanism for the gameplay race, rather than only adding another sync lock.

Lift this requirement:

> No reconcile, compaction, or download may mutate the live save tree while an emulator owns it; game launch and save-tree commit must share an explicit lifecycle gate.

The ES-owned startup scheduling proposal gives that requirement a plausible home.

**Why I would start here:** its coverage of foreign-manifest republication, independent capture, normalized results, and actual entry points makes it the strongest integration document.

**Do not build unchanged:**

- provisional agreement that can authorize subsequent canonical uploads;
- the full deletion table;
- permanent recorded-loser rules as automatic authority;
- time-based identity-collision detection;
- the claim that metadata makes a flat cross-core namespace safe;
- a mandatory two-week shadow period on unsafe live writers.

A recorded loser can be useful context. It must not permanently stigmatize the same bytes when a player later deliberately restores them. Repeated conservative prompting after lost agreement is not sufficient justification for a new global resolution-ordering protocol.

Also, scope the gameplay gate to save-tree safety. Do not block game launch behind every long content transfer merely because both operations use the cloud subsystem.

---

### `kimi-revised_plan.md`

**Distinct contribution worth retaining:** materialized versions retain producer metadata separately from the publishing device.

Lift this requirement:

> A downloaded or re-slotted version preserves its producer’s device, core, core build, and capture metadata as origin; the receiving device records possession or materialization without claiming production.

That survives a producer subsequently overwriting its original slot better than hash lookup into current manifests alone.

Its second useful contribution is reusing staged candidates for the wizard, merge, and discard preservation. That is good economy **once freshness has been proven**.

**Do not build unchanged:**

- the metadata-skipping staging mirror as the source of current C;
- the “lossless” exit-only configuration;
- “any member divergent” as the whole unit classifier;
- the assertion that a retained precheck snapshot makes a later race recoverable;
- deletion resurrection without a duplicate-convergence plan.

The combination of a whole-tree mirror, separate manifest copies, and certification downloads also needs measurement before it is called the budget-conscious option.

---

### `gemini-revised_plan.md`

**Distinct contribution worth retaining:** the explicit **real-device #10 launch-behaviour rehearsal as a preimplementation gate**.

This is procedurally different from Claude’s VM-specified primitive experiment, Kimi’s deferral to another futro, and Mistral’s core-set comparison.

Lift:

> Before shipping `es_savestates.cfg`, test auto-resume and incremental-slot behaviour on a real device; creating the file is a launch-behaviour migration, not merely a directory-template change.

There is no unique new safe detector mechanism in this shorter plan. Its useful contribution is keeping that hardware gate visible.

**Do not build unchanged:**

- the one-way stopgap;
- an engine that merely strips `--delete-excluded` while otherwise inheriting arbitrary `RCLONEOPTS`;
- batch allocation relying only on refresh;
- “atomic bundle resolution” without unit-level classification and interrupted-publication semantics.

Its conservative unknown rule also needs narrowing: unknown **provenance** is not itself a fork. A genuinely cloud-only legacy file should still restore without demanding an impossible comparison choice. [S3]

---

### `mistral-revised_plan.md`

**Distinct contribution worth retaining:** observe moves instead of trying to reconstruct every occurrence from final hashes.

Lift:

> ES move operations must update the placement/predecessor record when they occur; a later content scan cannot reliably reconstruct a move after the destination has also been overwritten.

This supplies the missing mechanism in Claude’s rename-then-edit example without first requiring a second identity system.

Its kid/kiosk accessibility test is also valuable, provided the desired access policy is decided rather than assumed.

**Do not build unchanged:**

- the metadata-only hashless detector;
- categorical, unverified bisync claims;
- the lossless stopgap;
- default-file-only discard protection;
- the invented attribution of a three-copy discard default to the IA;
- “never overwrite without explicit choice” as a literal rule for all files.

That last phrase would turn ordinary verified one-sided updates into prompts, contrary to the agreed conflict table. The intended rule should concern divergent or unverified overwrites.

The proposed `D-CLOUD-031-A` through `-E` labels must also remain clearly marked as proposals. They are not existing register decisions.

---

## 5. The smallest useful experiment sequence

These are acceptance gates, not a request to build every proposed subsystem first.

1. **Repair and validate the test instrument.**  
   Disposable GENERIC_X64 only. Preserve configuration before mutation, prove cleanup, use exact paths and destination bytes, repair dated-archive expectations, and reconcile content fixtures with the current allowlist. Then run both WebDAV and MinIO. [S36]

2. **Run the inexpensive counterexamples first.**  
   Exit-only overwrite; same-size staged cloud change; disjoint-member unit fork; stale tombstone after path reuse; three-pass duplicate convergence. These can eliminate incorrect designs before hardware UI work.

3. **Run the version-specific rclone spike.**  
   Dry-run and actual disposable writes; WebDAV, MinIO, then device-to-Dropbox. Include external equalization and unchanged-versus-changed filter files. Record inventories and hashes, not just exit codes.

4. **Prove lifecycle and merge behaviour.**  
   Protected H700 fixtures: boot overlap, offline/lock-skipped capture, auto-only allocation, multiple pending merges, failed state/PNG copy, and repository refresh invalidation. Rehearse #10 on the actual target before enabling that layout.

5. **Run #19 as required by D-CLOUD-025.**  
   Same-chipset control first, then cross-family and version cases, then corruption tests that distinguish compression rejection from core behaviour. Results qualify the tested core/build combinations, not all cores by extrapolation. [S8, S20]

6. **Interrupt apply and publication deliberately.**  
   Verify every pre-apply distinct version remains recoverable, incomplete units cannot be consumed, stale results do not report success, and retry does not repeat a destructive action against a different occupant.

7. **Price and press through the finished path.**  
   Count process starts and remote operations on H700; test A-exit/B-start handoff on a hashless backend; test real PNG recognition on RG351M; exercise pending-conflict discovery, cancellation, auto KEEP BOTH, and the chosen kid/kiosk policy.

A field census can then measure auto-conflict frequency and usability. It cannot substitute for these constructed failures. A read-only detector run only **after** a legacy overwrite also cannot recover the overwritten input needed to judge that overwrite; shadow observations must preserve their inputs.

### What I would take into the build document

The resulting starting specification would be Claude’s integration outline, with:

- Kimi’s self-contained origin metadata and bounded outside-tree discard store;
- verified, selective staging rather than Kimi’s metadata-authoritative mirror;
- Gemini’s real-device #10 gate;
- Mistral’s move observation;
- unit-level three-way classification;
- conservative ordinary-deletion semantics plus explicit duplicate convergence;
- a minimal durable apply-recovery contract;
- a measured changed-file exit path.

That is a case for one document with explicit corrections—not an average of the four.

**Change-of-mind limitation:** my own revised plan is not embedded in this prompt. I cannot honestly claim a sentence-by-sentence change from it, or use these plans’ descriptions of it as evidence. The judgments above are the positions I can substantiate from the currently supplied material.

---

## Corpus gaps surfaced to the orchestrator

Before the corresponding claims can be called verified, supply:

- rclone 1.75.0 source or version-specific documentation, and the actual spike traces;
- full ES headers, filesystem helpers, launcher/process implementation, and `GuiSaveState.cpp`;
- RetroArch launch/configuration plumbing for #10;
- current content-transfer scripts and the QA backend helper;
- current issue bodies with edited acceptance criteria;
- executed compatibility and round-trip results;
- this member’s earlier revision, if a retrospective change-of-mind comparison is required.

No filesystem locations or hashes for that missing material are inferred below.

## `corpus.provenance.json`

```json
{
  "corpus_mode": "facilitator_embedded_read_at_time",
  "source_count": 42,
  "source_reference_order": "S1 through S42; source_file_paths and source_file_hashes are positionally aligned",
  "hash_verification": "SHA-256 values supplied as verified at embed time by the Council Facilitator; copied from the source headers",
  "independently_reread_files": false,
  "independently_rehashed_files": false,
  "commands_or_hardware_tests_performed": false,
  "manifest_read_timestamp_utc_as_supplied": "2026-09-05T17:32:51Z",
  "reviewed_plan_filenames": [
    "claude-revised_plan.md",
    "gemini-revised_plan.md",
    "kimi-revised_plan.md",
    "mistral-revised_plan.md"
  ],
  "reviewed_plan_hashes_supplied": false,
  "earlier_own_revision_available": false,
  "earlier_peer_review_artifacts_independently_available": false,
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
      "description": "rclone 1.75.0 implementation, version-specific bisync documentation, roadmap, and executed spike traces",
      "declared_source_path": null,
      "sha256": null
    },
    {
      "description": "Full ES headers, filesystem helpers, launcher/process implementation, and GuiSaveState.cpp",
      "declared_source_path": null,
      "sha256": null
    },
    {
      "description": "RetroArch launch and directory-configuration plumbing needed for the #10 behavioural migration",
      "declared_source_path": null,
      "sha256": null
    },
    {
      "description": "Current content-transfer scripts, cloud setup implementation, backuptool, and QA backend helper",
      "declared_source_path": null,
      "sha256": null
    },
    {
      "description": "Current issue bodies with edited acceptance criteria, separately from the embedded comment-thread exports",
      "declared_source_path": null,
      "sha256": null
    },
    {
      "description": "Executed round-trip, compatibility, concurrency, and interrupted-apply test results",
      "declared_source_path": null,
      "sha256": null
    },
    {
      "description": "This member's earlier revised plan and the earlier analyses and peer reviews referenced inside the injected plans",
      "declared_source_path": null,
      "sha256": null
    }
  ]
}
```