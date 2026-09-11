# `gpt-revised-approach.md`

## Recommendation

**Apply an amended version of the one-home delta.** Keep `Saves/.history/`, include game saves and all save states, retire the saves-specific `--backup-dir` mechanisms at the reconciler cutover, and retain one restore surface and one nested settings page.

The delta is not safe to apply as a path substitution plus an extra `copyto`. Its load-bearing amendments are:

1. **Verified retention before destructive replacement, in both directions where necessary.** Add a cloud-retention backstop before overwriting a local version whose protection cannot be proved.
2. **A protected namespace and a mixed-version rollout boundary.** The shipped filter does not protect the proposed store.
3. **History counts scoped to independently restorable saves, not an entire game’s state collection.**
4. **A stated priority among retention bounds, pending recovery, and only-copy protection.**
5. **Cancellation and recovery that finish before game launch.** No retention network operation belongs between the launch press and the first frame.
6. **Copy-and-verify migration of both existing set-asides**, including the device-local cache.
7. **A narrower, truthful auto-heal rule** that does not silently reverse a plausible intentional erase or repeatedly undo an authorized restore.

I recommend **recoverable reconciliation with a conditional retain-before-install backstop**, not candidate escrow on every publish and not a new distributed locking service. This leaves a specific concurrency residual, stated below. It must be recorded, not hidden behind “retain-before-publish.”

### Evidence and citation convention

Source citations below use paths relative to the common declared prefix:

`research/council-runs/2026-09-11-save-history-one-home/_sources/`

The provenance block records every full declared path and its Facilitator-supplied, embed-time SHA-256. I have neither filesystem access nor independently recomputed hashes.

The earlier analysis files are not separately embedded in this step. Attributions to them acknowledge arguments reproduced in the injected reviews; factual conclusions below are checked against the source corpus, not treated as established by a reviewer’s endorsement.

---

## 1. What I change after review

### Concessions and corrections

- **Candidate escrow was not justified as the cheapest sufficient recommendation.**  
  `claude_peer_review.md` and `kimi_peer_review.md` correctly object that my preferred escrow response was insufficiently costed against writes, retention bounds, and D-CLOUD-034. I withdraw that preference. The first implementation should use the conditional retain-before-install backstop described below. Escrow remains a stronger alternative **if the requirement is cloud-only recoverability immediately after every acknowledged publication**.

- **The broad format-validation prerequisite was too broad.**  
  `claude_peer_review.md` correctly distinguishes the narrow two-pattern check in D-CLOUD-100 from a general format-aware validator. I no longer make a format census a prerequisite for detecting an empty file. I still require evidence of a prior non-suspect version, and I still challenge automatic healing of a nonzero uniform file at an otherwise plausible full size. Retaining the bytes does not make the statement “was damaged” true.

- **Copy instead of move needs an explicit cost.**  
  Both reviews correctly identify this omission. A remote copy may be approximately as cheap as a remote move where server-side copy is available. Where it streams through the handheld, it can be materially more expensive. Section 8 prices that difference rather than calling every retain “one small transfer.”

- **Temporary transaction recovery is not optional save history.**  
  I accept `kimi_peer_review.md`’s criticism of my footer argument. A temporary recovery copy need not be presented as a kept discarded save. The real issue is defining OFF consistently; the revised policy does so without litigating incidental temporary files in player-facing wording.

- **The obsolete `.snapshots` guard is not a release foundation.**  
  I withdraw treating its preservation as necessary. `gemini_peer_review.md` is right to redirect attention to `.history/`. However, “no local snapshots” does not itself prove that no residual files can exist: #22 R2 and #25 explicitly retain the old guard as a precaution. Dropping it is acceptable after the cutover inventory confirms that it protects no remaining writer or migration input. It is not a substitute for the new root-level exclusion.

### Arguments I retain or strengthen

- **The concurrent-publisher counterexample stands.** A fresh head check is not a conditional write. A post-copy check narrows a race; it does not serialize publication.
- **A standing migration fold does not make arbitrary old-image writers safe.** I adopt the fold proposed in `kimi-analysis.md`, as reproduced in `kimi_peer_review.md` and `claude_peer_review.md`. I reject `mistral_peer_review.md`’s stronger conclusion that it removes the need for a rollout boundary. Two old-image runs can move history into `-replaced/` and then prune it before an updated device can recover it.
- **An orphaned transfer is not necessarily a harmless duplicate history copy.** `mistral_peer_review.md`’s dismissal overlooks restore and publish processes that can still mutate live saves. D-CLOUD-093 deliberately releases the shell-owned lock when its shell dies; that does not prove its children are harmless.
- **A reserved namespace still needs enforcement beyond one editable file.** I accept the request to avoid a bespoke protection mechanism in every caller. The minimal implementation is a common reserved-path boundary, enforced in the shipped filter and in the reconciler’s explicit transfer planner, with capture and layout migration audited against it.

### Ideas adopted from others

- From `claude-analysis.md`, as reproduced in the reviews: **separate the count key from the reconciliation unit**, so auto-state churn cannot consume a manual slot’s allowance.
- From `gemini-analysis.md`, narrowed as recommended by `claude_peer_review.md`: **retain the displaced local version when its cloud retention cannot be proved**.
- From `kimi-analysis.md`: **standing, path-aware legacy folding**, including repair of history members moved into `-replaced/`.
- From `kimi_peer_review.md`: **own-manifest witness before any retention write**, audit coverage for ordinary retains and prunes, and explicit startup-sync cost.
- From `claude_peer_review.md`: resolve **shared-store setting authority**, distinguish deliberate deletion from unexplained absence in only-copy protection, and do not use copied members’ modtimes as retention timestamps.

I do **not** adopt the claim in `kimi_peer_review.md` that the auto-rule necessarily overwrites an occupied slot 4. #23 specifies the **next free slot** and rechecks reserved slots at COMPLETE. The fixed slot number is an example, not a destructive allocation rule. The implementation must preserve that distinction.  
(`issues/23.md`, “The walkthrough” and acceptance.)

---

## 2. Row-by-row delta to apply

| Delta row | Judgment | Revised requirement |
|---|---|---|
| **Store location, `reason`, and READMEs** | **Endorse location; amend record contract** | Use `<SAVES_REMOTE>/.history/<unit>/<operation-id>/`. Keep `record.json`, but make the final path component collision-resistant and retry-stable, not a wall-clock ordering key. Preserve member-relative paths rather than flattening basenames. Add an explicit legacy/unknown reason. Declare the store in the root README and its own README. |
| **Retain before every overwriting publish** | **Amend** | Copy and verify the actual preimage and its record before publishing. Never move the current head out of place merely to retain it. Add the conditional local-preimage backstop before a fetch or restore overwrites a local version. Treat retain and publish as one admission unit: defer both, never publish without its required retain. |
| **Retire `--backup-dir`** | **Endorse, with cutover conditions** | Retire the saves phases’ cloud and local set-asides only when all R1 entry points delegate in one image and existing bytes have a migration path. Settings-archive phases are unchanged. Do not point `--backup-dir` at `.history/`; its destination overlap is expressly prohibited. |
| **Allowlist; remove `.snapshots` guard** | **Amend** | Put `- /.history/**` before all includes in the shipped rules and enforce reserved-path rejection in the planner independently of user options. Protect the managed root README as control metadata. Keep `.bak` exclusion. The `.snapshots` guard may go once its no-writer/no-migration-input premise is verified. Ship namespace protection before history writers where a preparatory image is possible. |
| **Nested retention settings** | **Endorse nesting; amend semantics** | One nested history-settings row under SAVE MANAGEMENT; retain the default-ON switch and a shallow count selector. Define the policy as shared by this cloud, not whichever device happens to prune. OFF stops future optional history, does not purge existing history, and does not disable mandatory transaction recovery or suspect quarantine. Age and size remain implementation bounds, not additional settings rows. |
| **One #25 reader, labels from `reason`** | **Endorse; amend truthfulness** | One picker reads finalized coherent entries from the common store, independently of a device’s cache or audit log. It distinguishes unknown legacy details and interrupted operations rather than inventing a decision or claiming an attempted replacement succeeded. Restores remain new publications through the reconciler. |
| **`suspect` and auto-heal** | **Amend narrowly** | Keep the cheap empty/uniform detection. Auto-heal an empty new save only with a verified, applicable prior good copy and successful suspect retention. A nonzero uniform file at a plausible full size is a question unless format-specific evidence justifies automatic repair. Do not override a real both-changed conflict. Authorized republications must not trigger a heal loop. |
| **All save states, including auto-states** | **Endorse coverage; amend count scope** | Include them all. A state and its PNG form one retained version. Count independently restorable save families rather than all states for a game together; auto-state churn must not evict a manual slot merely because both belong to one reconciliation unit. |
| **Public documentation** | **Endorse** | Publish the actual layout, exclusions, migration behavior, effective bounds, network requirement, and restore availability. Update `es-menu-map.md` in the same change. Do not claim that a device-menu restore control exists before #25 ships. |

This revises the proposed delta, not the chosen transport or SHA-256 identity rule.  
(`repo/docs/save-history-plan-delta.md`; `repo/docs/save-history-gap-analysis.md`; `issues/22.md`; `issues/23.md`; `issues/25.md`; `issues/134.md`.)

---

## 3. Foundation: what a retained entry proves

### 3.1 One store, with independently usable records

The entry must answer #25’s existing questions from the cloud alone:

- Which game, kind, and independently restorable save it belongs to.
- Its original paths and slot attributes.
- The complete member set, sizes, and SHA-256 identities.
- Producer, device label, core/build, and capture time, where known.
- The retained publication and intended replacing publication, where known.
- Why it was set aside, and whether the associated operation completed.
- Which times are trusted, and which are merely reported dates.

For legacy entries, unknown means unknown. A `-replaced/` stamp can contain **sync-mode deletions as well as replacements**. Importing all of it as `reason: replaced` would fabricate an event. Use an explicit legacy/unknown reason and retain the original source path in metadata.  
(`repo/code/cloud_backup-set-aside-excerpt.md`; `issues/22.md` R9; `issues/25.md` A5.)

Two further changes are necessary:

- **Do not flatten members to basenames.** R9’s proposed shape can collide when a multi-directory unit contains two same-named files. Store member-relative paths or an unambiguous member mapping.
- **Do not order by `<seq>` text.** Use a unique operation identifier, allocated once and reused on retry. Device identity plus a run nonce is sufficient in shape; timestamps remain metadata. A clock reset or two operations in the same second must not reuse a destination.

No global SQLite index, content-addressed shared-blob store, or mutable “current history” index is required.

### 3.2 Bytes first, verified record last—and completion is a separate fact

A coherent retained payload and a successfully applied replacement are not the same event.

The simplest explicit contract is:

- Members are written and verified first.
- `record.json` is then written and verified; this commits a **usable retained copy**.
- A small completion outcome, stored with the entry or folded into already-planned publication evidence, records that the associated replacement completed.

If an additional per-entry completion receipt is needed, use one; section 8 includes its cost. Do not let a record written before publication falsely certify that publication succeeded.

This also lets a second device distinguish:

- a recoverable earlier copy;
- a coherent copy retained before an interrupted operation;
- incomplete upload debris, which is not a restore candidate.

Pending recovery entries are not pruning candidates. Losing local pending state must not convert them into ordinary expired history. This extends R9’s cloud-recoverable transaction record rather than creating another storage home.  
(`issues/22.md` R5, R7, R9; D-CLOUD-033, D-CLOUD-045, D-CLOUD-078.)

### 3.3 Required ordering and interruption outcomes

| Phase | Required action | Power loss, link loss, or SIGKILL |
|---|---|---|
| **Guard** | Check sync context, mounted root, storage, coherent unit, and own-manifest witness. Acquire the existing locks as applicable. | No retention or save mutation has happened. A cloned identity refuses **before** writing history. |
| **Prepare** | Seal independent candidate bytes; journal the observed base, target hashes/publication, operation ID, and affected members. | Restart uses the journal or cloud record; it must not infer success from partial files. |
| **Retain** | Copy the cloud preimage, or upload a local preimage, to the operation’s private entry. Verify all members. | The old live copy remains. Incomplete history is ignored by the picker and kept out of normal count pruning. |
| **Commit retention** | Write and verify `record.json`; write the required audit event before replacement. | A usable retained copy exists. Restart rechecks the current head before resuming; it does not replay a stale plan blindly. |
| **Recheck** | Confirm that the head still corresponds to the observed base. | On mismatch, stop that mutation and reclassify. The retained copy may remain as an interrupted-operation entry. **This check does not close the cross-device race.** |
| **Publish or install** | Apply the existing unit transaction, never an unjournaled series of live-file overwrites. | A mixed remote unit is held under R4/A8. Local recovery must produce a complete old or new unit before launch, including offline restart under A7. |
| **Verify and finish** | Prove correspondence; only then advance agreement and record completion. | An uncertain result remains `uploaded-unverified` or pending. It is not agreement and not a successful outcome. |
| **Prune later** | Reclaim only eligible, completed entries during a full maintenance pass. | An interrupted cleanup must not remove an active entry, a protected fallback, or a whole unit directory containing newer operations. |

Per-file temporary rename is not a multi-file transaction. Nothing here assumes rclone atomically publishes a state plus PNG or a directory save. The existing A7/A8 obligations remain essential.  
(`issues/22.md` R4–R9, A7, A8; `issues/23.md` audit requirement; D-CLOUD-034, D-CLOUD-077, D-CLOUD-078.)

---

## 4. Concurrency: the guarantee I recommend, and its limit

### The counterexample that the plan must acknowledge

Let A and B agree on `H0`.

1. Both observe `H0`.
2. Both retain `H0`.
3. Both pass their final head checks.
4. A publishes `HA`, verifies it, and advances agreement to `HA`.
5. B publishes `HB`, overwriting `HA`.

No history copy of `HA` was necessarily made. A later sees:

- local = agreement = `HA`;
- cloud = `HB`.

R4 consequently calls this “the cloud changed.” Under the existing “no preimages of one-way fetches” exclusion, fetching `HB` destroys A’s remaining `HA`.

`L_T` is device-local. Neither another listing nor another hash check makes the final write conditional.  
(`issues/22.md` R4–R7 and negative scope; D-CLOUD-046, D-CLOUD-052.)

### Recommended closure

**Before installing over a local version, require a verified cloud-retention witness for that version. If it cannot be proved, upload that local version to the common store first.**

This is not a return to a permanent local history folder. Local staging remains transaction state; the retained copy goes to the cloud.

“Proved” must include pruning safety. Merely finding an old entry that another device may delete is not enough. In the simplest first implementation:

- retry may reuse its own still-protected operation entry;
- an existing entry may be reused only where its continued protection is established;
- otherwise, retain a fresh private copy before installation.

I do not recommend adding a distributed lease protocol merely to avoid a small full-pass upload. This means the backstop may cost an upload on some ordinary fetches, not only on the rare race. That is a cost to measure, not to conceal.

### Explicit residual

**`HA` is not recoverable from the cloud alone until A successfully retains it. If A’s remaining local/staged copy disappears before that happens, this backstop cannot recover it.** The same limitation applies if later play overwrites the only surviving local copy before protection occurs.

Therefore the proposal provides a stronger reconciliation backstop, **not immediate cloud durability of every transient head and not serializable head selection**.

I ask for this limitation to be recorded explicitly as a refinement of D-CLOUD-046’s fresh-head contract. It is a pre-existing check-then-write gap, not evidence that the unified store itself is undesirable.

If that residual is unacceptable, the stronger alternative is candidate escrow before head publication, with its additional upload and protected-storage cost. Escrow improves recoverability; it still does not serialize head selection. Truly conditional head publication would require a separate reconsideration of the transport contract and #22’s “no protected-publication protocol” scope. Nothing in the corpus justifies reviving bisync for that purpose.

---

## 5. Retention policy: scope, precedence, clocks, and shared settings

### 5.1 Count the save the player expects to restore

R9 currently counts per unit, described as game plus kind. The exact unit table is not embedded. If it groups a game’s manual and automatic states together, three auto-state replacements can evict the preimage of an accidentally overwritten manual slot.

The revised rule is:

- **A numbered state plus its PNG is one save family.**
- **The automatic resume state plus its PNG is a separate family.**
- **A battery save is separate from states.**
- **An inseparable multi-file save remains one coherent family.**

The reconciliation unit may be larger. Counting must not force us to split an indivisible directory save into independently restorable files.

Use recorded paths and known rename/compaction mappings as retention attributes; do not turn slot number into version identity. If a rename cannot be mapped confidently, retain conservatively rather than guess that two different saves share an allowance. If #21 already provides this granularity, this amendment is a clarification rather than new machinery.  
(`issues/22.md` R4, R9; `issues/23.md`; D-CLOUD-030, D-CLOUD-099.)

My recommended count refinement is **default 3, retaining the decided 1–9 selector**. Treat “3 to 5” in D-CLOUD-096 as the starting default candidates to measure, not an undocumented removal of the earlier range. If the maintainer instead wants a 3–5 range, record that explicitly before #23 implements it.

### 5.2 Preserve the primary undo use case

Per-file counting alone does not protect a wizard loser from repeated overwrites of that **same** file.

Reserve the latest deliberate conflict loser within that family’s retention allowance against routine-sync count churn. Release that special protection after a later deliberate decision supersedes it, or when the applicable age/cap policy legitimately expires it. It is not an immortal copy.

At very shallow settings, this necessarily gives deliberate undo precedence over ordinary older versions. The default of three provides room for that undo and recent routine replacements. Do not promise that a count of one simultaneously preserves every kind of undo.

This follows D-CLOUD-032’s stated primary use case rather than silently changing “three decisions back” into “three exits back.”

### 5.3 The bounds cannot all be unconditional

Three hundred games with one 1 MiB surviving save each cannot fit under a 256 MiB ceiling without violating “never the only copy.”

The recommended precedence is:

1. **Finish or safely recover active transactions.**
2. **Do not delete the last usable coherent copy of an unretired save family.**
3. **Protect the latest deliberate undo against routine count churn.**
4. **Apply count, trusted-age, and aggregate-size cleanup to eligible history, oldest first where ordering is known.**

The 256 MiB figure is therefore a **steady-state cleanup target**, not an unconditional maximum. Count and age can also be exceeded while operations, imports, or uncertainty protect entries.

Account for all stored bytes: payloads, PNGs, metadata, pending entries, and legacy imports. Do not make the apparent cap true by omitting inconvenient classes from the accounting.

If safe reclamation cannot make room, defer additional automatic work rather than discard protected bytes or stall launch. Real provider quota exhaustion is a failed retention; the dependent replacement does not proceed.

### 5.4 Deliberate deletion is not unexplained disappearance

I recommend an explicit refinement of D-CLOUD-096:

- An unexplained absence retains only-copy protection and follows the existing question/refusal rules.
- A **decided retirement** retains an undo copy first, but that copy may expire under ordinary retention policy.

Otherwise REMOVE EVERYWHERE creates a permanent, cap-exempt cloud copy. That is neither a credible bounded-history policy nor an obvious interpretation of a deliberate removal.

Retirements remain publication-scoped. Restoring those bytes creates a new `pub`; an old retirement must not remove the restored publication. Compaction of proven identical copies needs an audit record, not another history version.  
(D-CLOUD-030, D-CLOUD-037, D-CLOUD-047; `issues/22.md` A9; `issues/25.md`.)

### 5.5 Ordering must not trust filenames or copied modtimes

Use known `pub`/`replaces` relationships to order versions where available. This is bounded history lineage, not a new ancestry database.

- A backward device clock must not make a new entry immediately “oldest.”
- Concurrent branches do not have a proven total chronological order.
- Foreign and legacy publications may have no usable chain.
- A copied member’s modtime is not established retention time. Whether rclone preserves source modtime must be tested per backend.

The 90-day sweep requires a trusted retention/import age. When that evidence is missing, first establish a trusted observation and retain conservatively; do not calculate age from an arbitrary source-file timestamp. A clock jump must suspend age-based deletion rather than sweep the store.

Keep the 90-day policy. I do not adopt proposals to drop it merely because trustworthy time needs a guard.  
(`issues/23.md`, `clock_synced: false`; `issues/22.md` R9; D-CLOUD-045, D-CLOUD-096.)

### 5.6 Pruning must survive concurrent writers and pruners

A fresh listing alone is not a race solution.

The minimum pruning contract is:

- Only explicit, completed entry IDs are deletion targets—never a recursive purge of a unit or the entire history root.
- Active operation entries and their recovery material remain protected.
- A new operation must not make a late, unprotected reference to an entry already eligible for deletion; retain afresh if necessary.
- Cleanup preserves a coherent fallback under a strict known successor ordering. It must not delete A “because B exists” while another pruner deletes B “because A exists.”
- Unknown ordering, incomplete listings, missing outcome evidence, and uncertainty about the last usable copy cause retention, not deletion.
- A reader verifies and stages its selected entry before replacing anything locally. If cleanup wins the read race, the read fails safely and the existing save remains.

If the implementation cannot prove those properties on the two-pruner fixture, disable destructive cleanup for the affected entries and report the target overrun. Do not substitute a last-second head check and call it serialized.

### 5.7 One effective policy for the shared cloud

A count of three on A must not silently erase the nine versions B was told would be kept. Similarly, an old cached OFF preference must not silently disable history another device enabled.

I recommend a **cloud-wide effective preference carried through the already-read per-device manifests**, not independent device pruning policies:

- Setting changes carry a causal revision, scoped to the sync context.
- An unchanged cached preference is not republished as a new choice.
- A connected explicit edit can supersede the policy revisions it has read.
- Concurrent or otherwise incomparable changes resolve conservatively: ON wins, and the larger count wins.
- A later explicit edit after observing those changes can supersede both.
- An offline edit remains pending until reconciled; it does not authorize destructive cleanup from stale information.

This avoids an eternal “maximum of every setting any device ever used” and needs no remote lock or global settings database. The exact manifest field design is an implementation prerequisite.

OFF means:

- no new **optional long-term** history under the effective policy;
- no immediate purge of existing entries;
- transaction recovery remains until success is positively known;
- suspect quarantine remains as required by D-CLOUD-100.

Exit passes need not perform a new policy-wide listing merely to prune temporary records. They can leave cleanup to a full pass, which reads the current shared policy.

The UI remains two controls behind one row under SAVE MANAGEMENT, with no age/size sliders and no extra restore entry. Any explanation of shared scope or pending application belongs inside that page, not in a third row line.  
(`repo/docs/es-menu-map.md`; `repo/rules/es-native-ui-excerpt.md`; D-CLOUD-032, D-CLOUD-035, D-CLOUD-036, D-CLOUD-045, D-CLOUD-096; D-UI-023, D-UI-039.)

---

## 6. Namespace safety, cutover, and migration

### 6.1 Moving inside Saves weakens a structural protection

The old R9 store was outside the transfer boundary **by construction**. The new store is excluded **by rule**.

The shipped filter contains any-depth save-extension includes and no `.history/` exclusion. The root README falls through to the terminal exclusion. Whether those extension rules traverse dot-prefixed components, and exactly how excluded destinations behave under the installed rclone’s `sync`, are tool-behavior hypotheses to test—not completed proofs in this corpus.

The consequences are serious enough to require the guard regardless:

- accidental download of historical members as live saves;
- capture claiming those downloaded files;
- mirror deletion of history members into `-replaced/`;
- orphaned metadata and thumbnails;
- an old pruner subsequently deleting those moved members;
- control files making a physically nonempty cloud look like a nonempty **save library**, defeating mass-absence protection.

Mass-absence tests must operate on the applicable live-save set, not on the raw presence of README, history, or manifests.  
(`repo/code/cloud_sync-rules.txt`; `repo/code/cloud_backup-set-aside-excerpt.md`; `issues/22.md` R2, R4, R9.)

### 6.2 Minimal common enforcement

Use three coordinated measures:

1. **Top-of-file shipped exclusions** for `.history/` and the managed root README.
2. **Planner validation:** ordinary save transfer/deletion lists never contain those reserved paths, regardless of a custom filter or hostile `--files-from` input.
3. **Walker and layout audit:** capture, root-emptiness checks, migration, cleanup, and any whole-tree operation distinguish live saves from control metadata.

D-CLOUD-088 preserves custom filters. Its rule therefore needs a narrow refinement: users still control which saves are included, but may not accidentally remove system-owned namespace protection from a saves operation.

Do not indiscriminately exclude `savestates/.rocknix/` from all transport. D-CLOUD-031/045 require those manifests to reach the cloud as explicit metadata transfers and to reside locally in cache. I adopt the documentation point in `mistral_peer_review.md`, not its contradictory suggestion to globally exclude required manifests.

### 6.3 Cut over every entry point

R1 remains a one-image cutover of the writers on an updated device:

- startup;
- automatic exit;
- the sync, back-up, and restore rows;
- the hub’s SAVES tick;
- Tools symlinks and shell commands;
- the tile named in R1;
- wizard and history-restore application.

Also inventory **MATCH THIS DEVICE TO THE CLOUD**, which appears in the menu map but not R1’s enumerated list. Its saves portion cannot bypass the reconciler with a raw mirror. The implementation and exact deletion direction are not embedded, so I do not invent them from the label.

ES save deletion and renumbering retain their transfer-lock gate and retirement recording. Settings-archive phases retain their existing mechanisms.

### 6.4 Mixed-version safety is a release boundary

A guard-only preparatory image is compatible with D-CLOUD-097: it widens no retention and writes no new history. It protects a namespace before that namespace gains a writer.

Nevertheless, an arbitrarily old client with destructive options can still damage the new store. A standing importer cannot guarantee recovery if:

1. an old run moves `.history/` members into `-replaced/<stamp>/.history/...`;
2. another old run creates a newer stamp;
3. the old pruner removes the first stamp before an updated client reads it.

Therefore:

- establish the guard-ready client boundary before enabling shared history writes;
- verify that user-edited rule files actually receive mandatory protection;
- document unsupported old-writer combinations as a release compatibility issue;
- do not turn that issue into a player migration question.

The corpus does not supply a complete fleet-discovery mechanism. The orchestrator must resolve that rollout gap. **No design confined to this folder can honestly guarantee no loss in the presence of arbitrary unmodified destructive clients.**

### 6.5 Migration procedure: read old and new, write only new

The following is the actual transition, not “leave the old folders until they age out”:

1. **Stop the updated device’s legacy saves writers and pruners.**  
   Do this under the transfer coordination, including orphan-process reconciliation.

2. **Inventory both existing sources.**  
   The cloud `<SAVES_REMOTE>-replaced/` and local `/storage/.cache/cloud_sync/replaced/` are both migration inputs. The local cache can contain the only copy of a newer local save overwritten by the manual restore path. It is not disposable cache for this purpose.  
   (`repo/code/cloud_restore-set-aside-excerpt.md`.)

3. **Map run contents into coherent new entries.**  
   A stamp is a run, not a save unit. Preserve original relative paths and all available bytes. Use the unit map to group known save-plus-thumbnail or directory-save members. Preserve unclassifiable material without fabricating coherence or offering a torn candidate.

4. **Copy, verify, and record an idempotent import receipt.**  
   The receipt maps source path and byte identity to the verified destination. Retry reuses that mapping. Do not remove a source merely because rclone returned success.

5. **Remove only the source bytes whose complete import is verified.**  
   Unknown, changed-during-import, or incomplete material remains for retry. Network failure or quota failure leaves the source untouched. No prompt asks the player which internal folder to keep.

6. **Give imports a grace period.**  
   A 100-day-old legacy timestamp must not cause immediate deletion upon migration. Imported versions receive a fresh, trusted migration grace period—recommended 90 days—before ordinary age cleanup. The source date remains display metadata. Import and only-copy exceptions may temporarily exceed the size target.

7. **Keep a standing full-pass fold.**  
   Continue looking for newly produced legacy set-asides during the compatibility period. Recognize nested `.history/<unit>/<operation>/...` paths and repair the original entry when hashes and metadata establish the correspondence. Otherwise preserve them as separate legacy material, rather than overwrite a valid entry by path alone.

Migration and repair are resumable full-pass work, never launch or exit prerequisites. Temporary local residence while upload is pending is not a second permanent history product.

`CHANGE CLOUD FOLDER` and `TIDY UP YOUR CLOUD FOLDERS` must carry history and control metadata deliberately; an ordinary live-save allowlist is not an appropriate layout-migration filter. Their implementations are a corpus gap.  
(`00-problem-statement.md`; `repo/docs/save-history-gap-analysis.md`; `issues/134.md`; D-CLOUD-089, D-CLOUD-095, D-CLOUD-097.)

---

## 7. Auto-heal without false certainty or a launch-time download

### Keep the cheap detector; narrow the automatic action

The shape check concerns inspected save payload bytes, not thumbnails, README files, or a guessed interpretation of a provider hash.

Apply it only with evidence that:

- the previous applicable version was neither empty nor uniform;
- the current candidate is complete enough to classify as that save;
- the supposed good copy belongs to the appropriate agreement/publication;
- the normal conflict rules do not already require a player choice.

A nonuniform file is not thereby proven semantically good. An unexplained external cloud head must not become an automatic winner just because it is nonuniform.

Recommended behavior:

- **New zero-length candidate, verified prior good copy:** retain the suspect, then heal as D-CLOUD-100 intends.
- **Nonzero uniform candidate at the previous or another known plausible full size:** queue the existing compare-and-choose surface unless format evidence establishes corruption.
- **Both sides changed, incomplete multi-file unit, or uncertain prior good copy:** preserve and queue/hold; do not silently choose the cloud.
- **Suspect cloud head:** do not install it over a known good local copy. Automatic symmetric repair can follow once proved; preventing propagation is required now.

Use truthful wording after a completed repair, for example:

> The latest save for X looked incomplete. Your earlier save from the cloud was restored.

Do not report recovery before installation has verified. D-CLOUD-077 rules out declaring damage as fact where the check only established suspicion.

### Prevent a heal loop

An explicit choice or #25 restore is a new publication. Record its authorization against the particular version/publication, not against the filename forever. It must not immediately be “repaired” back to the prior version.

Repeatedly encountering the same attempted erase after an automatic repair should stop automatic repetition and queue the save question. Pending suspect status also must not disappear merely because a later exit produced a different hash; otherwise an interrupted repair can become a silent new baseline.

### Keep recovery off the launch critical path

Use an independently sealed prior agreed copy from the existing stage **if it is still present and positively matches the required version**. This is an optimization, not a promise that #21 maintains a permanent local history.

If a network read is needed:

- fetch only the admitted unit into staging;
- bound it with the operation’s existing cancellation and timeout rules;
- preserve the suspect in the cloud before replacing it;
- if this cannot complete, leave recovery pending and do not publish the suspect as ordinary progress.

This requires a narrow refinement of D-CLOUD-046/R5: bounded verification or recovery reads into staging are allowed; ordinary exit-time downloading of unrelated saves is not. A local heal installation is a short journaled operation after its prerequisites, not permission to turn every exit into a full two-way pass.

A launch cancels the automatic operation. It does not wait for a newly added recovery download.  
(`issues/22.md` R4–R6; `issues/23.md`; `issues/25.md`; D-CLOUD-034, D-CLOUD-046, D-CLOUD-076, D-CLOUD-100.)

---

## 8. Time to play and provider cost

### 8.1 What is measured—and what is not

There are **no completed retain-before-publish timing measurements in this corpus**. D-CLOUD-083 reports Dropbox move failures at different retry counts, not seconds per retained save. #135 explicitly leaves budgets for measurement.

The estimates below are hypotheses for admission planning, not handheld results.

### 8.2 Incremental operation count

For a retained group with `k` payload/thumbnail members, a straightforward implementation adds approximately:

| Added work | Logical requests |
|---|---:|
| Copy retained members | `k` |
| Verify retained member correspondence | about 1 listing/check, plus byte reads where required |
| Write `record.json` | 1 |
| Verify that record | 1 |
| Recheck the live head | 1 |
| Record operation completion, if not folded into existing evidence | 1–2 |

Thus the core is approximately **`k + 4` additional requests**, with another one or two for a separately verified completion receipt. That is not the same as process-spawn count; batching may reduce spawns without eliminating backend work.

The original 3–4-spawn changed-exit budget cannot simply be carried forward unchanged. Re-measure it, including retries, verification, metadata, and cancellation.  
(`issues/22.md` R5/A10; D-CLOUD-046.)

### 8.3 Illustrative seconds

Assume, solely for illustration:

- effective remote request latency: **150–350 ms**;
- usable upload bandwidth: **5 Mbit/s**;
- usable download bandwidth: **20 Mbit/s**.

Then:

- A one-member battery save requires roughly **0.75–1.75 seconds** for the `k + 4` core request count.
- A state plus PNG requires roughly **0.9–2.1 seconds**.
- A separate completion receipt and process/authentication overhead make **about 1–3 additional seconds** a reasonable small-save test hypothesis on an efficient backend—not a budget or measurement.
- At 500–1000 ms per request, the same metadata-heavy operation can take several seconds before significant payload transfer.

For a backend that streams the retain through the device and needs byte re-fetch verification, retaining `S` bytes can add approximately:

- one download of `S`;
- one upload of `S`;
- another download of `S` for verification.

At the illustrative bandwidths, **128 KiB** adds about **0.3 seconds** of payload time. A **20 MiB test fixture** adds about **50 seconds**, before request latency and the candidate’s normal publish cost. That fixture size is not a claim about measured PPSSPP saves.

Consequently, the admission ceiling must count:

- the old preimage as well as the new candidate;
- members and PNGs;
- streamed retain traffic;
- hashless verification reads;
- metadata requests and retry behavior.

If the pair is too large, defer **retain and publish together**.

### 8.4 Copy versus move, by provider capability

- Where server-side copy is supported, copy-before-replace may be close to move-before-replace in device traffic.
- Where only rename is cheap but copy must stream through the handheld, removing the absent-head window costs real bandwidth and time.
- Server-side copy capability and verifiable hash capability are separate questions.
- Dropbox having no MD5 does not automatically make it hashless. Use a provider hash only where correspondence to the stored-byte SHA-256 is established.
- A multipart S3 ETag must not simply be assumed to be the file’s MD5.
- WebDAV, SFTP, and SMB capability behavior must be measured with the actual rclone/backend configuration.

The safeguard is still justified: moving the current head into history first opens an absence window that another device can classify as a missing save. On slow-copy backends the proper response is admission and deferral, not silently reverting to move-before-publish.

Dropbox’s own 30-day versions are additional protection, not the history contract. Self-hosted providers may have no versions behind this store.  
(`repo/docs/save-history-gap-analysis.md`; D-CLOUD-014, D-CLOUD-036, D-CLOUD-041, D-CLOUD-083; `issues/133.md`.)

### 8.5 Effect on the two player metrics

| Situation | Required delta effect |
|---|---|
| **UI → game, no sync running** | No history listing, retention write, migration, pruning, or cloud sanity check. Target: zero added network requests. |
| **UI → game, automatic startup sync running** | Cancel and quiesce the automatic run before launch. Its newly longer backup half increases cancellation opportunities, not permitted waiting time. |
| **Game → game, idle exit** | Capture remains local; no rclone spawn. Shape detection should ride the existing byte inspection rather than add a second whole-tree scan. |
| **Game → game, changed exit** | Retention increases exit-sync duration, but launch cancels it. Required local transaction cleanup and complete-unit recovery finish before the game starts. |
| **Manual sync running** | Existing refusal remains visible and bounded; do not silently change it into automatic-sync behavior. |

D-CLOUD-076 already supplies a two-second cancellation budget, with SIGKILL at 1.5 seconds. This is not a newly measured performance result. #135 must measure both first-frame metrics against a baseline on every image, including startup and exit cancellation, slow bandwidth, and link loss.

D-CLOUD-093 needs a narrow safety refinement: track and quiesce the operation’s process group before admitting another live-tree writer or a game. Retain the shell-only lock ownership; do not mistake lock release for proof that all writers ended.

If process quiescence or coherent local recovery cannot be proved, fail safely and offer recovery. Do not allow an orphaned rename to land after the first game frame.

There is no claim here that D-CLOUD-076 lets the same automatic sync continue after the game begins—it says the opposite.  
(`repo/rules/time-to-play.md`; `issues/135.md`; D-CLOUD-074, D-CLOUD-075, D-CLOUD-076, D-CLOUD-093, D-CLOUD-098.)

---

## 9. Explicit register refinements

These are proposed append-only refinements, not claims that the register already contains them.

| Existing decision | Proposed refinement and argument |
|---|---|
| **D-CLOUD-014; D-CLOUD-095** | The saves-specific `-replaced/` writer retires at R1 cutover. Default backup remains non-deleting; settings phases are unchanged. This implements one home without broadening deletion. |
| **D-CLOUD-036; D-CLOUD-041** | Retention remains cloud-based and verified before replacement, but cloud preimages are copied rather than moved out of the head. KEEP LEFT still retains the device loser; KEEP RIGHT retains the cloud loser. The copy cost buys removal of an artificial absence window. |
| **D-CLOUD-042** | D-CLOUD-095 supersedes **only its store-location clause**. Do not silently reopen its split-root refusal. #22’s conflicting migration wording needs separate alignment with the binding row. |
| **D-CLOUD-047** | Deliberate deletions use the unified store, not `-replaced/`. Compactions of re-read equal bytes remain audit-only. Publication-scoped retirement and unexplained-absence behavior are unchanged. |
| **D-CLOUD-032; D-CLOUD-036; D-CLOUD-096** | Define independently restorable count families, protect the latest deliberate undo against routine churn, clarify default/range, define OFF, and state shared-cloud policy authority. These preserve the original undo promise under broader retention traffic. |
| **D-CLOUD-096** | Count/age/size are cleanup targets subordinate to active recovery and only-copy safety. Age needs trusted evidence. Decided deletions can expire normally. The unconditional formulation is mathematically impossible and otherwise makes deletion permanent. |
| **D-CLOUD-045** | Add only the small optional policy-revision claims needed for shared settings. Manifests remain claims, not the cloud head; unchanged manifests are not rewritten. |
| **D-CLOUD-046** | Cost and admit retention plus verification; permit bounded staging reads needed for verification/recovery; preserve zero-rclone idle exit and no ordinary exit-time download pass. Explicitly record the non-serialized publication residual and the local-preimage backstop. |
| **D-CLOUD-088** | Preserve custom save selection while making reserved control-path protection non-optional for saves operations. |
| **D-CLOUD-093** | Shell-only lock ownership remains, but orphaned live-tree writers must be identified and stopped before another writer or game proceeds. “Lock available” alone is insufficient. |
| **D-CLOUD-100** | Keep empty-save auto-heal with verified prerequisites; question plausible full-size uniform saves, use suspicion rather than asserted damage in uncertain cases, and honor authorized republications. |
| **D-UI-022; D-UI-039** | “Earlier versions of saves” describes the common store. Discarded, replaced, deleted, and suspect remain event descriptions, not separate storage products. Nest the controls and update the map in the same change. |

Also amend #22’s **C1/no-preimages-of-one-way-fetches** exclusion for the cloud-retention backstop. Permanent local history remains out of scope.

**No reopening is requested for D-CLOUD-030’s byte identity, D-CLOUD-052’s chosen copy transport, D-CLOUD-099’s auto-state coverage, or the QA policy.** No wizard undo control is added, and D-CLOUD-033’s staged delivery of #25 remains.

---

## 10. Release gates

All applicable testing starts on the GENERIC_X64 pair and self-hosted backends. No action in this proposal uses a person’s handheld or cloud account. A dedicated hardware target remains the open decision in #131; the hosted-provider expansion follows #133 and D-QA-017, not a Dropbox-centered shortcut.

| Gate | Required evidence |
|---|---|
| **Namespace and R1 census** | Exercise every actual writer, including MATCH, shell paths, custom filters, hostile explicit file lists, capture, and layout migration. Seed `.history/`, READMEs, and manifests. Verify no ordinary save restore/capture claims history, and a control-only cloud still triggers the appropriate mass-absence refusal. Observe spawned processes, not just source routing. |
| **Interrupted retain/apply** | Kill before and after each phase above; sever the network; exhaust local and remote storage. Restart offline. Verify a complete local unit before launch, no torn picker entry, no agreement on uncertainty, and no premature prune. |
| **Two-device publication** | Use distinct device IDs. Force both devices past retain and final head check before either publishes; let A verify before B overwrites. Demonstrate the local-preimage backstop and explicitly demonstrate the cloud-only residual. Test cloned identity separately. |
| **Pruning races** | Run two pruners and a publisher together. Exercise pending entries, last usable copies, deliberate deletions, reader-versus-prune, and incomplete listings. A fresh check alone is not an acceptable result. |
| **Count and clock behavior** | Accidentally overwrite a manual slot, perform more than N auto-state exits, and restore the manual preimage from the second device. Test repeated same-file syncs after a wizard choice. Test backward and forward clocks, untrusted timestamps, imported old files, and copied modtime behavior. |
| **Auto-heal** | Empty candidate, plausible full-size uniform erase, repeated intentional erase, authorized history restore, suspect remote, both-changed conflict, missing member, cancellation, and offline recovery. Verify no repeated silent undo and no false recovery message. |
| **Migration** | Include cloud replacements, cloud deletions, unique local-cache copies, incomplete groups, duplicate basenames, old dates, oversized imports, and interruption after every copy/receipt/removal step. Exercise nested-history repair and the two-old-run destructive residual. |
| **Provider and timing matrix** | WebDAV, MinIO, SFTP, SMB, and FTP as #133 builds them; at least one QA-only hosted non-Dropbox provider. Measure actual copy capability, verification behavior, bytes, requests, spawns, retries, and both first-frame metrics under delay, throttling, and link loss. |
| **Reader and UI contract** | Gate 2/A5 from a second device with local pending records removed, manifests overwritten, slots renumbered, clocks reversed, and audit logs rotated. Frames at 480×320 and 640×480; row-height, vocabulary, binary-label, and menu-map checks. |

Keep D-CLOUD-083’s low-level retry lesson: do not “meet” the launch budget by reducing retries until Dropbox-style folder contention becomes routine failure. Bound/cancel the operation and defer its admitted unit instead.  
(`issues/22.md`; `issues/23.md`; `issues/25.md`; `issues/131.md`; `issues/133.md`; `issues/135.md`; D-QA-007, D-QA-015, D-QA-017.)

---

## 11. Simplicity and remaining gaps

This is still the simplest acceptable **product shape**:

- one hidden cloud home;
- one self-describing record format;
- one writer;
- one restore destination in the UI;
- one nested settings group;
- one retain-and-verify transaction pattern.

No provider-native version dependency, second local history product, per-game history daemon, shared-blob garbage collector, or distributed lock service is proposed.

The necessary complexity is concentrated at the boundaries where bytes can otherwise disappear: transaction completion, pruning, local replacement, old writers, and launch cancellation. Compression, broad format validators, aggressive deduplication, and prettier history indexing can follow later.

The following remain actual corpus gaps and are surfaced to the orchestrator:

- #21’s unit map and capture/staging lifetime, including the startup walker;
- the full scripts, helper, layout migrator, MATCH implementation, and ES lock/cancellation code;
- upgrade behavior for user-edited filters and old setting names;
- the referenced manifest schema, wizard IA, upgrade rules, and relevant gate results;
- actual backend capabilities and first-frame measurements;
- how the release establishes the guard-ready mixed-fleet boundary.

These gaps do not change the recommendation to use one home. They do prevent claiming that the unchanged delta is already safe, bounded, or measured.

---

## `corpus.provenance.json`

```json
{
  "artifact": "gpt-revised-approach.md",
  "facilitator": "council-facilitator@1.2.0",
  "access_mode": "Embedded read-at-time source corpus only; no filesystem access; no independent file reread or hash computation.",
  "source_manifest_path_named_by_prompt": "research/council-runs/2026-09-11-save-history-one-home/_prompts/step3-source-manifest.json",
  "source_manifest_status": "Named by the Facilitator; the manifest file itself was not separately embedded or read.",
  "manifest_read_timestamp_utc_supplied_for_sources": "2026-09-11T19:31:42Z",
  "hash_provenance": "All source_file_hashes values below are the Facilitator's sha256 values verified at embed time. The path and hash arrays correspond by index.",
  "source_file_paths": [
    "research/council-runs/2026-09-11-save-history-one-home/_sources/00-problem-statement.md",
    "research/council-runs/2026-09-11-save-history-one-home/_sources/repo/docs/save-history-plan-delta.md",
    "research/council-runs/2026-09-11-save-history-one-home/_sources/repo/docs/save-history-gap-analysis.md",
    "research/council-runs/2026-09-11-save-history-one-home/_sources/repo/docs/decision-register-excerpt.md",
    "research/council-runs/2026-09-11-save-history-one-home/_sources/repo/docs/es-menu-map.md",
    "research/council-runs/2026-09-11-save-history-one-home/_sources/repo/rules/time-to-play.md",
    "research/council-runs/2026-09-11-save-history-one-home/_sources/repo/rules/es-native-ui-excerpt.md",
    "research/council-runs/2026-09-11-save-history-one-home/_sources/repo/code/cloud_backup-set-aside-excerpt.md",
    "research/council-runs/2026-09-11-save-history-one-home/_sources/repo/code/cloud_restore-set-aside-excerpt.md",
    "research/council-runs/2026-09-11-save-history-one-home/_sources/repo/code/cloud_sync-rules.txt",
    "research/council-runs/2026-09-11-save-history-one-home/_sources/issues/22.md",
    "research/council-runs/2026-09-11-save-history-one-home/_sources/issues/23.md",
    "research/council-runs/2026-09-11-save-history-one-home/_sources/issues/25.md",
    "research/council-runs/2026-09-11-save-history-one-home/_sources/issues/134.md",
    "research/council-runs/2026-09-11-save-history-one-home/_sources/issues/135.md",
    "research/council-runs/2026-09-11-save-history-one-home/_sources/issues/131.md",
    "research/council-runs/2026-09-11-save-history-one-home/_sources/issues/133.md"
  ],
  "source_file_hashes": [
    "f7d770768b3bf81985b7415b4d82f8ee9ef26965a98eb6c47c166f54db673b27",
    "1d320545319eba2e8852d830d52f76ab3a417e48e365d01fe79231bade77da8b",
    "d1107b7e1790b8e8aab177411b96bb3828f69e389fbc8e33c36ce616f67105aa",
    "46ccfb71ef85537639501c2973a5b02fd81b6d5772662608ead073b209ea2726",
    "6d7813f91e37510f5578f35adec3f9372ed34e1ce5d871fcc0f34e392b202911",
    "97d2fbba79fa42f22def37e4ff90e18149fc9fbc216d255d091da3dc187075da",
    "32be1ee4164c9d1f09e7a9e9c8c25f526e70802f75901e456097bdb5c02d46e4",
    "e5b57d74b83046fc7ebf44b4129c68815a575b35553e938c2ae377c685852509",
    "c0dacd8aa1eb1a4df2986447a853cc3c47b666b6234127e61783a151faa448bd",
    "bdb7e18128ce4a604c9b02cfe5b0f10f4e3e4dfd3aa7e2d69ea018b8c9d5484d",
    "b05b7095a31dd11f63cc342129fd3b765a19b9ba4b4a91b4b9aa1877c7658b27",
    "1ca065c449e0b3695f1ab4e9573ad5bd4a92b21ae23c869bba8730fcefdebfc1",
    "14a3cee5592021447395db3e59dfaf27ec09de77f1fb85fe5c10cfde9da28d1b",
    "d7ffb5a4648964d458b18a4a5427b1bb5d8fd356bb31fd06182d2d08c33a2071",
    "3998a6e46d8cdd903deb97b2da23afb78ad1b237061328f4402291c03e0ff137",
    "b8034bb7ab57d7ffb7d5aa4cf16d0974f0bf8d731c983e864081296fa6ccc17c",
    "4f58af89b8a262bb1c7615b7bdfea3389cb655d3c607474fe6aca8c6d084f9f2"
  ],
  "injected_peer_review_inputs": {
    "filenames": [
      "claude_peer_review.md",
      "gemini_peer_review.md",
      "kimi_peer_review.md",
      "mistral_peer_review.md"
    ],
    "provenance_limit": "These were injected under filenames without declared source paths or verified hashes. None has been assigned a fabricated path or hash or included in the source arrays.",
    "completeness_note": "The injected kimi_peer_review.md ends with a truncated provenance table; only the supplied content was available."
  },
  "corpus_gaps_surfaced_to_orchestrator": [
    "The Step 1 analysis files are not separately embedded in this step; acknowledgments refer to positions reproduced in the injected reviews.",
    "The full #21 capture contract, unit table, startup walker, and stage lifetime are not embedded.",
    "Full cloud_backup, cloud_restore, cloud_sync_helper, layout-migration, MATCH, and EmulationStation lock/cancellation implementations are not embedded.",
    "Actual --delete-excluded usage, cleanup filter behavior, and migration of user-edited filter files cannot be verified from the excerpts.",
    "upgrade-and-install.md is referenced and its migration rule is quoted by the commission, but the document is not embedded.",
    "The referenced save-manifest schema, conflict-wizard IA, engineering-practices material, and detailed gate evidence are not embedded.",
    "No retain-before-publish timing results, backend copy/modtime capability results, completed #135 budgets, or relevant hardware measurements are embedded.",
    "The mechanism establishing a guard-ready mixed-fleet release boundary is not supplied."
  ],
  "activity_statement": "No code was implemented or run, no files were written, no tests were performed, and no handheld or cloud account was accessed. Proposed paths and protocol changes in the analysis are design proposals, not additional claimed source files."
}
```