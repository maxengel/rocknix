# Council — Step 4: peer vote

You are one of five council members. Each of you has now produced a revised
delta to the conflict-resolution plan of record: how the earlier versions of a
player's saves are kept, in one home (the commission, `00-problem-statement.md`). The
corpus is embedded above, unchanged and hash-verified; the other four members'
revised plans are injected below.

Vote for **exactly one** of them. You may not vote for your own plan, and your
own plan is not injected — judge the four you are given.

## Anti-self-citation constraint

Judge the plans on their merits against the embedded corpus. Do not treat the
injected artifacts as evidence about how councils, models, or this deliberation
behave.

## What you are voting for

The winning plan becomes the change the maintainer applies to #22, #23 and #25
before they are built. So vote for
the plan that would be **safest and most buildable if adopted as written**, not
the one that is most impressive or most thorough. Weigh, in this order:

1. **Does it protect player progress?** No earlier version is lost that the
   bounds say should be kept, an interrupted run never leaves less than before,
   and the accidental overwrite of a save state is recoverable. A plan with an
   elegant store and one path that drops a copy is worse than a plainer plan
   with none.
2. **Is it grounded?** Claims about the shipped code, EmulationStation's
   helpers, rclone's behaviour and the register's decisions should be correct,
   and hypotheses should be labelled as hypotheses with an experiment named.
3. **Is it actually implementable** by a small team on a busybox handheld,
   inside the time-to-play budget (D-CLOUD-098), against rclone backends that
   differ in hashes, modtimes and version history?
4. **Does it sequence the work** so the cheap experiments that could invalidate
   a design run before the expensive building?
5. **Is it the simplest shape that meets the maintainer's constraints** -- one
   home, hidden but declared, one vocabulary, no stacking of settings -- and
   honest about what it does not know and which decided rows it needs reopened?

## Your output

- **Name the winner** in your first line, by member short name, unambiguously.
- **Give your reasoning**, comparing the winner against the other three
  specifically. Say what the winner does better and where the others fall short.
- **Record dissent.** Name every important primitive, finding or safeguard that
  a losing plan has and the winner does not fully absorb, by filename. This is
  how good ideas from losing plans survive into the final synthesis, so be
  thorough here even when your winner is clear.
- **Name any remaining defect in the winner** that must be fixed before it is
  built.

Refer to plans by filename (for example `kimi-revised_plan.md`), never by an
invented ordinal.

## Injected revised plans

=== START gemini-revised_plan.md ===

# Council — Step 3: Revised Approach

Having reviewed the embedded corpus and the four peer analyses, I present my revised approach for the save-history delta. 

First, a crucial concession: **I concede the concurrency serialization claim refuted by `gpt-analysis.md`.** The assertion made in earlier rounds that a fresh-head check serializes publishes (or acts as a "cheap compare-and-swap") is false. As `gpt-analysis.md` proved, two devices can pass the head check and publish concurrently; the second overwrites the first's head without retaining it. The delta's retain-before-publish alone does not guarantee recoverability. This revision adopts the necessary backstop to close that data-loss window.

Here is the revised delta, separated into the load-bearing foundation (required for data safety) and refinements, followed by explicit register reopenings and unmeasured hypotheses.

---

## 1. The Load-Bearing Foundation (Data Safety & Concurrency)

These elements must be implemented exactly as described, or the plan will lose player saves or break the time-to-play budget.

**1.1 Closing the Concurrent-Publisher Race (Adopted from `gpt-analysis.md` and `gemini-analysis.md`)**
Because R5 is check-then-write, Device B can overwrite Device A's newly published head (`HA`) without retaining it. When Device A next syncs, it will fetch B's head and overwrite its local `HA`. 
*   **The Rule:** We must implement **retain-before-install on fetch**. Before a one-way fetch or restore overwrites a local save, the reconciler must check if the local loser's hash exists in the cloud `.history/` store. If it does not, the device must upload the local loser to the store before installing the fetched bytes. 
*   *Cost:* One store listing per fetching unit, and a rare small upload when the race actually occurs. This is the cheapest sufficient form (D-CLOUD-034) to guarantee recoverability.

**1.2 Namespace Protection & The Standing Fold (Adopted from `gpt-analysis.md`, `claude-analysis.md`, and `kimi-analysis.md`)**
The shipped `cloud_sync-rules.txt` contains `+ /**/*.srm` and similar rules that match at any depth. An old-image device running a sync-mode backup will match `.history/` members, delete them from the cloud, and move them into `-replaced/`. 
*   **The Rule:** The exclusions `- /.history/**` and `- /README.md` (credited to `mistral-analysis.md`) must be placed at the absolute top of the shipped rules file.
*   **The Standing Fold Migration:** Because user-edited rules files or dormant old-image devices may still execute the destructive sync, migration cannot be a one-shot script. We adopt `kimi-analysis.md`'s standing fold: the reconciler must be permanently path-aware. If it finds members in `-replaced/<stamp>/.history/<unit>/<seq>/`, it folds them back into `Saves/.history/<unit>/<seq>/`, verifies them, and deletes the legacy `-replaced/` folder. The store thus self-heals from old-image damage.

**1.3 Copy, Never Move (Adopted from `gpt-analysis.md` and `kimi-analysis.md`)**
Retain-before-publish must use `copyto`, not a server-side `move`. A server-side move leaves a window where the cloud head is absent. If the subsequent publish fails or is interrupted, the next pass sees an unexplained absence and asks the player a D-CLOUD-037 question. The old bytes must remain at the head until the new bytes are positively verified.

**1.4 MATCH Deletions Must Retain (Adopted from `mistral-analysis.md`)**
The menu map defines MATCH THIS DEVICE TO THE CLOUD as "the only action that deletes." Because MATCH bypasses the standard classifier, its deletions must explicitly execute a copy-then-delete into `.history/` with `reason: deleted`. Otherwise, MATCH permanently destroys the bytes the store exists to protect.

---

## 2. Retention Rules & Scope

**2.1 Per-File Count Keying (Adopted from `claude-analysis.md`)**
D-CLOUD-099 grants history to auto-states so players can recover from accidental overwrites. However, if the retention count (default 3) is keyed per *unit* (game + kind), three exits of auto-state churn will evict the manual slot's retained version. 
*   **The Rule:** The count bound must be scoped per `(unit, member path)` or per `(unit, kind-with-auto-separate)`. This aligns with the player-facing label VERSIONS KEPT PER SAVE and protects the manual slot.

**2.2 Pub-Chain Ordering vs. Untrusted Clocks (Adopted from `claude-analysis.md` and `gpt-analysis.md`)**
Handheld clocks are frequently wrong (`clock_synced: false`). Using time to determine the "oldest" entry for the count/size caps will cause a device with a 1970 clock to instantly evict its own fresh saves.
*   **The Rule:** "Oldest first" must be determined by the publication chain (D-CLOUD-045's `pub` and D-CLOUD-027's `replaces` lineage). Time is for display metadata only. If the chain breaks (e.g., a foreign publisher), fallback to time is permitted but must be marked untrusted.

**2.3 Soft-Cap Semantics (Adopted from `kimi-analysis.md`)**
Because pruning and the 256 MiB size sweep run only on full passes, an exit-only device will overshoot the count and size caps between full passes. The UI and README must not promise a hard ceiling, and the admission ceiling must not block publishes merely because the history store is temporarily oversized.

---

## 3. Time-to-Play & The Exit Path

**3.1 Admission Ceiling Must Count Retain Bytes (Adopted from `mistral-analysis.md`)**
On backends without server-side copy (e.g., SFTP, SMB), retain-before-publish streams through the device. A 30 MB state costs 60 MB of Wi-Fi transit. The exit sync's admission ceiling must weigh the *retain bytes plus the publish bytes*. If a unit exceeds the ceiling, both the retain and the publish must defer to the next full pass.

**3.2 Bounded Fetch for Auto-Heal (Adopted from `kimi-analysis.md` and `mistral-analysis.md`)**
D-CLOUD-100 requires restoring a good copy over a suspect save, which requires a fetch. However, D-CLOUD-046 defines the exit path as push-only. 
*   **The Rule:** We must explicitly amend D-CLOUD-046 to permit *one bounded fetch per suspect unit* on the exit pass. The exit card is exactly where D-CLOUD-098 permits spending the player's attention for a recovery event.

---

## 4. Explicit Register Changes (Reopenings & Amendments)

To implement this delta, the following binding rows must be explicitly reopened or amended by ID:

*   **Reopen #22 Negative Scope (C1):** Amend "no local retention of anything" to require *retain-on-fetch* when a local save is about to be overwritten by a one-way fetch and its hash is absent from the cloud store.
*   **Amend D-CLOUD-042:** Supersede the location clause (the store moves from `Saves-discarded/` to `Saves/.history/`). The legacy split-root refusal clause remains binding.
*   **Amend D-CLOUD-047:** Supersede the deletion retention clause. Interface deletions and MATCH deletions must be retained in `.history/` with `reason: deleted`. Compactions still retain nothing.
*   **Amend D-CLOUD-046:** Refine the exit-path contract to permit one bounded fetch per suspect unit for auto-heal, and require the admission ceiling to count retain bytes.
*   **Amend D-CLOUD-096:** The 90-day age cap must be trust-gated. It applies only to entries whose `decided_at` timestamp was written by a device with `clock_synced: true`. 

---

## 5. Unmeasured Hypotheses (Honesty & Next Steps)

This revised approach relies on the following hypotheses which must be settled on the GENERIC_X64 VM against the #133 QA matrix before shipping:

1.  **Server-Side Copy & Modtime Preservation:** We hypothesize that `copyto` is a zero-device-transit operation on WebDAV/SFTP/SMB. If it is not, the time-to-play budget on the exit path will be severely impacted. We also hypothesize rclone preserves source modtimes on these backends. Both must be measured.
2.  **Rules File Upgrades:** We hypothesize that `cloud_sync_helper` overwrites a user-edited `cloud_sync-rules.txt` on upgrade. If it does not, the `- /.history/**` guard will never reach those devices, making the standing fold migration (1.2) the *only* line of defense. This gap in the corpus must be audited.
3.  **Operation Ledger:** The exact latency of the retain-before-publish transaction (Obtain head evidence → Copy to `.history/` → Verify → Write `record.json` → Publish new head) must be measured in seconds on the VM to ensure it fits the D-CLOUD-098 budget.

=== END gemini-revised_plan.md ===

=== START gpt-revised_plan.md ===

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

=== END gpt-revised_plan.md ===

=== START kimi-revised_plan.md ===

# Step 3 — Revised approach: one hidden home for earlier versions, made safe

**Author:** `kimi-analysis.md` (Step 1), revised after the Step 2 critiques in `claude_peer_review.md`, `gemini_peer_review.md`, `gpt_peer_review.md`, `mistral_peer_review.md`.

**Position in one paragraph.** I still endorse the delta's shape — one hidden store at `<SAVES_REMOTE>/.history/`, written only by the reconciler, retain-before-publish with a `reason`, bounded by count, age and size, one reader, `--backup-dir` retired. No row of `save-history-plan-delta.md` needs replacement. But my Step 1 claim that the delta weakens *only* the store's exclusion property was wrong: `gpt-analysis.md`'s concurrent-publisher sequence shows the delta's retain-before-publish, as I defended it, does not make every displaced version recoverable, and my "fails safe" analysis of the head-check race was simply incorrect. The revised delta below keeps the shape and adds the closures: retain-on-fetch-when-absent-from-store, pub-chain ordering instead of clock ordering, a stated priority among the bounds, a count scope that survives auto-state churn, an honest migration of both legacy set-asides, and explicit register refinements by ID. Everything unmeasured is marked, with the experiment that settles it.

---

## 1. What I concede

**1.1 The TOCTOU race does not fail safe. (Refuted by `gpt-analysis.md` §2; confirmed by `claude_peer_review.md` §4 and `gpt_peer_review.md`.)** My Step 1 §2.2 claimed the window between R5's fresh-head check and the publish "fails safe: an extra entry, never a missing one." The counterexample: devices A and B both agree `H0`; both retain `H0`; both pass the head check; A publishes `HA` and advances agreement; B publishes `HB` over `HA` and advances agreement. R5 is check-then-write (`issues/22.md` R5: "push only when the head equals agreement") — nothing makes the write conditional, and `L_T` is a device-local flock (`/var/run/cloud_sync.lock`, R6), not a cross-device mutex. `HA` was the cloud head and is now nowhere in the cloud. Worse, A's next pass classifies `L = A = HA`, `C = HB` as *the cloud changed* and fetches `HB` over `HA` — and #22's negative scope ("no preimages of one-way fetches (C1)") means nothing retains `HA`. A version that was the cloud head is lost. I withdraw §2.2 entirely.

**1.2 The count cap is not clock-independent. (Refuted by `claude_peer_review.md` §4.)** My §2.7 claimed the count and size caps "carry the load" regardless of clocks. Under R9, "newest N" is ordered by `<seq>`, which begins with `decided_at` from the device clock; the shipped pruner likewise sorts stamp names (`repo/code/cloud_backup-set-aside-excerpt.md`). A device with a 1970 clock writes entries every other device treats as oldest — for the count cap as well as the age cap. Withdrawn.

**1.3 My clock mitigation rests on an unproven timestamp. (`claude_peer_review.md` §7.4, `gpt_peer_review.md`.)** I proposed ordering by `max(decided_at, server-side modtime)`. rclone preserves the *source* modtime on `copyto` where the backend supports it, so a retained member likely carries the original save's write time, not the retain time. That is a hypothesis about rclone, not a corpus fact — and it sinks the mitigation. Withdrawn as a mechanism; the experiment is named in §8.

**1.4 Legacy imports cannot be synthesised as `reason: replaced`. (Refuted by `gpt-analysis.md` §4; `claude_peer_review.md` §4.)** The shipped set-aside holds sync-mode *deletions* as well as replacements ("anything replaced (or, in sync mode, removed)" — `repo/code/cloud_backup-set-aside-excerpt.md`). Stamping every import `replaced` fabricates a fact. Imports get an honest `legacy` reason (unknown event, unknown producer, untrusted time).

**1.5 "No rows reopened outright" was wrong. (`gpt_peer_review.md`.)** Copy-instead-of-move refines D-CLOUD-041's mechanics; the exit-time heal fetch refines D-CLOUD-046/R5; `reason: deleted` and retiring `-replaced/` contradict D-CLOUD-047's text while the delta calls it unchanged. §5 states each refinement by ID.

**1.6 The uniform-byte hash shortcut was overclaimed. (`gpt_peer_review.md`.)** My §1.7.4 proposed detecting "all one byte" from the listing hash "with no round trips." The listing hash is provider-specific (Dropbox's content hash, S3's ETag) and mapped to sha256 via manifests (R4); a newly corrupted external head may have no mapping. Demoted to an optional optimisation, gated on per-backend hash-correspondence validation; the default is inspecting verified bytes.

**1.7 Smaller corrections.** The headline count ("seven outright, two with amendments") did not match my own table (four amended rows) — fixed. My MATCH-direction assumption is not established by the corpus (`gpt_peer_review.md`; the menu map shows only that MATCH is "the only action that deletes", `repo/docs/es-menu-map.md`) — the retention rule below is direction-neutral and MATCH's call path is a corpus gap. My rejection of non-save payload names was too categorical (`gpt_peer_review.md`) — original paths live in `record.json`, so payload naming is a backward-compatibility choice, not a hard constraint. My standing fold is repair, not a no-loss guarantee (`gpt_peer_review.md`) — the residual is stated in §4.3.

`gemini_peer_review.md` carried no dedicated section on my analysis; its cross-cutting checks credited my server-side-copy inference and the `--delete-excluded` catch, and I adopt its intentional-erasure loop fix in §3, row 7.

---

## 2. What I defend

**2.1 The one structural weakening: by construction → by rule.** (`claude_peer_review.md` §4: "the single best framing in the set"; `mistral_peer_review.md`: "the most elegant solution in the set" for its closure.) R9's sibling store was "outside the allowlist by construction" (`issues/22.md` R9). Inside `Saves/`, exclusion survives only as a rule — and the shipped rules file (`repo/code/cloud_sync-rules.txt`) includes `+ /**/*.srm`, `+ /**/*.state*` at any depth, while store members sit "at their basenames" (R9). Whether `**` crosses a dot-prefixed component is a labelled hypothesis (§8, experiment E1) — but the safe design must assume it does, because D-CLOUD-088 keeps user-named filter files alive and D-CLOUD-037 names "a delete made on a device still on the old firmware" as a real cause. An old-image `sync`-mode backup would move `.history/` members into `-replaced/<stamp>/.history/...`, shredding bytes and orphaning records — the D-CLOUD-014 incident re-entering through the new folder.

**2.2 The self-healing fold.** The migration's fold of `Saves-replaced/` is a *standing* full-pass behaviour, path-aware: anything landing at `-replaced/<stamp>/.history/<unit>/<seq>/...` folds back to its original entry. The mechanism that threatens the store becomes its repair, and it upgrades an old-image device's one-run set-aside in place. `gpt_peer_review.md` is right that this is not a no-loss guarantee (two consecutive old-image `sync` runs with no new-image pass between can still destroy a stamp); §4.3 states the residual and the two fleet measures that shrink it.

**2.3 The same-device sequence collision — kept, right-sized.** `gpt_peer_review.md` called this my strongest finding; `mistral_peer_review.md` called it overstated. Both are half-right. The benign case (two retains of the same version colliding) is absorbed by dedupe. The case that matters is two *different* versions of one unit retained by the same device within one timestamp tick — an orphaned rclone finishing an old retain beside a new run (the D-CLOUD-093 trade) — producing one entry directory mixing members of two versions: an incoherent entry, exactly what R9's "finalized, coherent ... only" invariant forbids. The fix costs one field: `<seq>` gains the run id the reconciler already mints (R10's `<run-id>`), stable across retries. Not a headline; cheap hardening, kept.

**2.4 No pruning on the exit path.** The shipped scripts already skip the remote prune on `--recent` runs as "a remote round trip the game-exit sync should not pay" (`repo/code/cloud_backup-set-aside-excerpt.md`). The same rule applies to the store: pruning is a full-pass job under `L_T`, never on the exit card. Confirmed by `claude_peer_review.md`.

**2.5 The rule belongs in the shipped rules file.** D-CLOUD-088 now forces the shipped rules onto every run that doesn't name its own filter file, so the shipped file is the one place the exclusion reaches the fleet. `claude_peer_review.md` §7.5 extends this correctly: a user-*edited* rules file may not receive the new line, and whether `cloud_sync_helper` rewrites it on upgrade is a corpus gap. I adopt that as a requirement (§3, row 4).

**2.6 `--delete-excluded` must be audited, not assumed absent.** `gemini_peer_review.md` confirms no other analysis caught this: if any shipped command or user config passes `--delete-excluded`, the exclusion rule itself becomes a deletion instruction against the store. The full scripts are not embedded (corpus gap); the audit and the VM test are in §8.

---

## 3. The revised delta, row by row

Verdicts: **endorse** = apply as written; **amend** = apply with the stated changes; no row is replaced.

### Row 1 — Store location: `<SAVES_REMOTE>/.history/<unit>/<seq>/`, `reason`, READMEs — **ENDORSE, amended**

The location, the `reason: discarded | replaced | deleted | suspect` field, and the two READMEs stand (D-CLOUD-095). Amendments:

- **`<seq>` = `<decided_at, UTC compact>-<deciding device id>-<run id>`** (§2.3). Collision-resistant, stable across retries.
- **`record.json` gains `reason: legacy`** for migrated entries, with `producer`, `decided_at` and the event marked *unknown* where the legacy stamp cannot supply them (§1.4). The importer's identity is recorded separately from the producer.
- **The root `README.md` names both hidden folders** — `.history/` (must never sync) and `savestates/.rocknix/` (the manifests, which *must* sync, D-CLOUD-031/045) — and says the store is *kept for recovery*; it must not promise a menu restore before #25 ships (D-CLOUD-033, D-CLOUD-077's no-lying rule; credited to `claude-analysis.md` via `gpt_peer_review.md`). I reject `mistral_peer_review.md`'s proposed `- /savestates/.rocknix/**` exclusion: manifests reach the cloud as decided transfers (D-CLOUD-045) and other devices read them; excluding them would break the plan of record.
- **The README is written only after the destination is validated** — a housekeeping write must not create a misspelled root and defeat D-CLOUD-085/091/092's missing-folder safeguards (`gpt_peer_review.md`, failure case 6).
- **Mass absence is judged on the live save set, not the raw listing.** A cloud root holding only `README.md`, `.history/` and manifests must still trip R4's mass-absence refusal; otherwise the control files mask it and produce a hundred questions (`gpt-analysis.md`; extended to manifests by `gpt_peer_review.md`).

### Row 2 — Retain-before-publish for every overwriting publish — **ENDORSE, amended (this is the foundation)**

The core stands: every publish that overwrites a cloud copy retains it first, decided or not. Amendments:

- **Transaction shape: bytes first, record last, the record is the commit point.** Members are copied and verified (sha256 of the retained bytes, or an established backend-hash correspondence — never size+mtime, R4, D-CLOUD-030); then `record.json` is written and positively verified; only then does the publish touch the head. An entry without a valid record is an orphan, invisible to #25, swept on full passes (not exit passes) once older than the maximum bounded retain duration; a record whose members are missing reads as *unavailable*, never as a restorable version. (All four analyses converged here; `mistral_peer_review.md` states the fail-closed requirement precisely.)
- **Dedupe against the newest entry** (my §1.2.3, kept): if the newest store record's sha256 set equals the version about to be displaced, skip the retain. Absorbs retry duplicates and the double-`H0` from the race.
- **Copy, never move, for the cloud-side loser** (shared with `gpt-analysis.md`; both of us are corrected by `claude_peer_review.md` on cost). A server-side *move* opens a window in which the head is absent — the unexplained-absence question D-CLOUD-037 makes the player answer. Cost, named per D-CLOUD-034: on backends with server-side copy, copy and move cost the same; on SFTP/SMB a rename is cheap and a copy streams through the device. The safeguard is worth the streamed case, and the admission ceiling below absorbs it. This refines D-CLOUD-041's mechanics (§5).
- **Retain-on-fetch-when-absent-from-store** (adopted from `gpt-analysis.md`'s row-3 rule; `claude_peer_review.md` §6.1 endorses it as the council's closure). Before a one-way fetch installs over a local version, retain that local version if its hash is not already in the store. This closes §1.1: A, about to fetch `HB` over `HA`, finds no `HA` in the store and uploads it first. Cost: a store listing the fetch already needs, plus one small upload in the rare race. This reopens #22's negative scope ("no preimages of one-way fetches (C1)") — narrowly, and by ID (§5). **The residual, stated plainly:** `HA` is unrecoverable *from the cloud alone* in the window between B's overwrite and A's next sync, and lost entirely if A never syncs again. We require the store to be *recoverable*, not the head to be *serializable*; serializability would mean a conditional-put protocol, reopening D-CLOUD-052 and the "no protected-publication protocol" negative scope, and D-CLOUD-032's test ("whether a wrong outcome is reversible") does not require it. I considered and rejected that reopening.
- **The retain and its publish defer as a pair, and the admission ceiling counts retain bytes** (`mistral_peer_review.md` §2.4, adopted). On backends without server-side copy the retain streams 2S through the handheld; a unit that would clear the ceiling for the publish alone must not stall the exit sync on the retain — both defer to the next full pass together. A publish never goes out ahead of its retain.
- **Interrupt points** (commission Q2): kill before the retain → nothing changed. Kill during the retain → orphan members, head untouched, swept later. Kill after the record, before the publish → the entry stands; `pending-publish.json` completes the publish (R2); dedupe prevents a second retain. Kill during the publish → A8's hold; no device installs the mixed unit. Kill after the publish before agreement advances → `uploaded-unverified`, nothing advances, the retained entry stands. Link loss anywhere is bounded by D-CLOUD-075's timeouts and reports partial success as partial (D-CLOUD-077).

### Row 3 — Retiring `--backup-dir` — **ENDORSE**

Retired once the reconciler is the only writer (R1); unchanged until then (D-CLOUD-097: no interim). D-CLOUD-014's *principle* — a backup never deletes by default — stands and is strengthened (every overwritten version is retained with metadata, not one run of anonymous bytes); its *mechanism* is superseded. The migration is §4.

### Row 4 — Allowlist: `- /.history/**` ahead of every include; `.snapshots` rule dropped — **ENDORSE, amended**

- **Add `- /README.md` beside it** (`mistral_peer_review.md` §2.1, adopted). The trailing `- /**` already excludes the README, but a user edit that removes the catch-all would pull it down to devices; one line closes it.
- **Ship the exclusion one image ahead of the store where possible** (credited to `claude-analysis.md`), **and** `cloud_sync_helper` must migrate user-edited rules files on upgrade (§2.5; whether it does today is a corpus gap), **and** the standing fold (§4.3) repairs what any remaining old image damages. Release notes alone are not a safety barrier (`gpt_peer_review.md`).
- **Audit every shipped command and the docs for `--delete-excluded`** (§2.6). Corpus gap: the full scripts.
- The `.snapshots` rule stays dropped (the delta as written; `gemini_peer_review.md` confirms the guard has no writer).

### Row 5 — Settings nested behind one row under SAVE MANAGEMENT — **ENDORSE, amended**

- The nesting stands (D-UI-039). The entering row's label must carry a verb per `repo/rules/es-native-ui-excerpt.md` ("a row that opens a page with more than one action is a submenu whose label carries the verb") — e.g. MANAGE SAVE HISTORY; the exact words are the maintainer's. `repo/docs/es-menu-map.md` updates in the same change (D-UI-039).
- **The switch and count are per-device settings on a shared store** (`claude_peer_review.md` §7.2, adopted as a question with a recommendation). Device A at count 3 would otherwise prune entries device B at 9 expects; A with the switch off would leave gaps in a history B relies on. Recommended cheap form: each device publishes its effective count in its manifest (`savestates/.rocknix/manifest-<device-id>.json`, already read on every pass, D-CLOUD-045); pruners apply the **maximum** across manifests; a device's OFF suppresses its own routine retains only when no manifest requires retention. One field plus a `max()` — the cheapest sufficient form (D-CLOUD-034). Put to the maintainer against D-CLOUD-096 (§5).

### Row 6 — #25 reads one store, the `reason` as the label — **ENDORSE, amended**

- Legacy imports appear under their own honest label, never synthesised as REPLACED BY A SYNC (§1.4; D-UI-022's residual is thereby honoured without lying).
- **A restore stages and verifies its selected candidate before touching any live file**; if pruning wins the race meanwhile, the restore leaves the current save unchanged and says so (`gpt_peer_review.md`, failure case 3).
- **A decided republication is never classified suspect** (new `pub`, D-CLOUD-047) — otherwise a player who restores a uniform-byte version through #25 is re-healed on the next pass (`gpt-analysis.md`).
- V1 wording: the store is kept for recovery; the restore control arrives with #25 (D-CLOUD-033).

### Row 7 — The `suspect` class and auto-heal (D-CLOUD-100) — **ENDORSE, narrowly amended**

- **Zero-length heals as decided.** For **uniform-at-full-size**, heal but the once-message must not assert damage as fact and must name the path back — an intentional in-game reset can produce a uniform file, and "was damaged" would then be a lie (D-CLOUD-077). This is the narrow amendment `claude_peer_review.md` §3 drew from `gpt-analysis.md`'s argument; I adopt it over my original "recoverable by construction" dismissal, which was true of the bytes and silent on the message.
- **The heal's fetch needs an explicit exit-path refinement** (my §1.7.3, merged with `gpt-analysis.md`'s D-CLOUD-046 rider per `claude_peer_review.md`): R5's exit path is "No fetches", and D-CLOUD-100 says the good copy "is kept and restored". Refinement: **one bounded fetch per suspect unit on the exit pass**, riding the exit card — where D-CLOUD-098 permits spending the player's attention — with cancellation leaving a complete unit before any launch (A7). Stated as a register refinement in §5.
- **Both-suspect is not "nothing worth protecting"** (`gpt_peer_review.md`, correcting me): the heuristic is not a format validator. If both sides classify suspect, or no verified good counterpart exists, there is no auto-heal: retain both, hold the unit, tell the player once, honestly. A false recovery message is worse than none (D-CLOUD-077).
- **The intentional-erasure loop** (`gemini_peer_review.md` §4, adopted): a first suspect pattern heals; a *second* identical suspect pattern for the same unit within a short window becomes a wizard question, not another heal — the player has told us twice. One small classifier state.
- **History-OFF policy table** (`gpt_peer_review.md`, failure case 1, adopted): the switch governs routine overwrite history and wizard losers (D-CLOUD-032/036, done page says so when off). The suspect set-aside is part of the heal itself — D-CLOUD-100 requires it and the player is told — so it is **not** governed by the switch. Flagged to the maintainer as a semantics confirmation, not a reopening.
- Every heal writes an audit line before the install (`mistral-analysis.md`'s sound point, via `claude_peer_review.md`; D-CLOUD-027/078).
- The hash-shortcut optimisation survives only as a gated experiment (§1.6, §8).

### Row 8 — Save states, auto-states included (D-CLOUD-099) — **ENDORSE, with the count-scope amendment**

No reopening of D-CLOUD-099: `mistral-analysis.md`'s reopening fails on arithmetic (≈700 KB is ~0.3 % of 256 MiB) and on unit scope, and does not engage the maintainer's reasoning. But the maintainer's own headline case — the accidental overwrite of a manual slot — is defeated if auto-state churn shares the manual slot's retention bucket (`claude_peer_review.md` §7.1; the per-file keying is `claude-analysis.md`'s fix, with `gpt_peer_review.md`'s caveats). Amendment:

- **The count applies per (unit, member path), not per unit.** `.state.auto` history and `.state1` history are separate buckets; three exits of auto-state churn cannot evict slot 1's preimage. An entry's members (state + PNG, multi-file saves) live and prune **together** — entries, never files, are the prune granularity. The bucket is a pruning scope only; restore semantics stay record-driven (slot-at-discard and sha256 are in the record), so D-CLOUD-030's "paths and slots are attributes" is honoured. The unit table is a corpus gap (#21 not embedded); the bucket key is settled when it is read. Fixture: overwrite slot 1, renumber, exit N times, restore slot 1's preimage from a second device.
- **Protect the newest deliberate conflict loser** (`gpt-analysis.md` §1, "the best defence of D-CLOUD-032 in the whole set" — `claude_peer_review.md`): per bucket, keep the newest N routine entries *plus* the newest `reason: discarded` entry. D-CLOUD-032's primary use case — "one step back" from a mis-pressed decision — must not degrade from three decisions to three exits.

### Row 9 — Public docs show the layout — **ENDORSE**

The cloud-sync page shows the layout table with `.history/`, `savestates/.rocknix/`, and the README text (documentation-accuracy gate).

### The bounds (D-CLOUD-096) — **AMENDED by refinement**

The corpus states four bounds with no ordering, and they cannot all be unconditional (`gpt-analysis.md` §1's arithmetic: enough protected only-copies exceed any total cap). Priority order, highest first:

1. **Never a game's only copy** — unconditional; the size and age caps yield to it.
2. **Count** per (unit, member path) — the player's setting (fleet-max, row 5).
3. **Age, 90 days** — input is the record's `decided_at` *with clock trust*: a device whose clock is untrusted (`clock_synced: false` exists in #23's metadata model) does not prune by age at all; count and size still bound. I keep the cap rather than dropping it (`mistral_peer_review.md` §6) — D-CLOUD-096 is binding and a same-day maintainer call; the trust gate is the cheap sufficient form.
4. **Size, 256 MiB total** — prunes oldest non-protected first and stops at protected copies; if protected copies alone exceed the cap, they stay and the docs say so. No player question (a prompt is a failure mode).

Victim selection for count and size is by **publication chain, not time** (`claude_peer_review.md` §4, adopted): each record carries the `pub` of the version it holds and the `pub` that displaced it (D-CLOUD-045's `pub`, D-CLOUD-027's `replaces`); "oldest" walks the chain back from the current head; a chain break (foreign publisher) falls back to record time, marked untrusted. This removes the device clock from the count cap entirely (§1.2, §1.3).

**Questions to the maintainer against D-CLOUD-096** (`claude_peer_review.md` §7.3, adopted): does "never the only copy of a game" cover a *decided* REMOVE EVERYWHERE? My recommendation: no — a decided deletion's retained copy ages out at 90 days like any other entry; the clause protects games with a live head somewhere. Otherwise `reason: deleted` entries are immortal and exempt from every cap.

---

## 4. Migration (commission Q4)

Rule: read both, write the new one; no prompts; no earlier version lost.

**4.1 Cloud `Saves-replaced/`.** First new-image full pass under `L_T`: for each stamp folder, copy each artifact into `.history/` under its unit (from the path beneath the stamp), verify bytes, write `record.json` with `reason: legacy` (event unknown — a stamp may hold deletions, §1.4), producer unknown, stamp time marked untrusted (the shipped naming is `date +%Y_%m_%d-%H%M%S`, local time), importer recorded; verify the record; only then remove the source artifact. **Copy–verify–record–verify–remove, never move-first** (`gpt_peer_review.md`). A stamp is a run, not a unit, and may hold a partial multi-file save: import what exists, mark the entry *incomplete*, and never offer an incoherent combination as a restorable unit (`gpt_peer_review.md`, failure case 4). A stamp still changing under a running old image is left for the next pass.

**4.2 Local `.cache/cloud_sync/replaced/`.** Same fold, upward: upload each artifact into `.history/` with `reason: legacy`, verify the cloud entry intact, *then* remove the local copy (`gpt_peer_review.md`: "originally a copy" is provenance, not current redundancy). This folder can hold the only copy of a newer local save an old restore overwrote (`repo/code/cloud_restore-set-aside-excerpt.md`'s own case); ignoring it — or leaving it as a second home one device can read — violates both the commission's no-loss rule and D-CLOUD-036's consistency argument.

**4.3 The standing fold.** Thereafter, every full pass folds anything under `Saves-replaced/` — including `-replaced/<stamp>/.history/...` written by an old image's attack on the store — back to its original entry (§2.2). Residual, stated honestly: two consecutive old-image `sync`-mode runs with no new-image pass between them can destroy a stamp before any fold runs. The early rule shipment and the rules-file migration (row 4) shrink the fleet window; the fold converts permanent loss into a bounded race.

**4.4 `-discarded/`** never shipped — nothing to migrate. **Layout migrations** (D-CLOUD-089's TIDY UP) must carry `.history/` (my §2.9, kept).

---

## 5. Register changes, stated explicitly

**Refinements (new rows citing old ones):**

1. **D-CLOUD-042** — the delta must say what is true: D-CLOUD-095 supersedes its store-location clause; its split-root refusal stands untouched. (Citation fix, not a reopening; `gpt-analysis.md`, `claude_peer_review.md`.)
2. **D-CLOUD-047** — refined: propagated deletions **are** retained, `reason: deleted`; compactions remain unretained (the bytes survive at the surviving slot, D-CLOUD-030); `-replaced/` is no longer any event's record. The delta cannot call 047 unchanged while replacing its mechanism.
3. **D-CLOUD-041** — mechanics refined: the cloud loser is preserved by server-side **copy** plus verification, not a move; cost named per backend class (row 2).
4. **D-CLOUD-046 / R5** — refined: the exit path gains (a) bounded retain transfers, counted in the admission ceiling, deferring as a pair with their publish, and (b) one bounded fetch per suspect unit for auto-heal. The "nothing changed ≈ 5 s" contract and the zero-spawn idle exit stand.
5. **D-CLOUD-100** — refined: uniform-at-full-size heals with honest wording (D-CLOUD-077); a decided republication is never suspect; both-suspect holds as a question; the repeat-suspect window escalates to the wizard.
6. **#22 negative scope, C1** — reopened narrowly: preimages of one-way fetches are retained **only** when the displaced local version's hash is absent from the store (row 2). Argument: without it, the delta's own promise — every overwritten version recoverable — is false under ordinary two-device concurrency (§1.1).

**Questions to the maintainer (not reopenings):** D-CLOUD-096 — bounds priority (recommended: only-copy > count > age > size), decided-deletion aging (recommended: ages out normally), fleet-shared setting semantics (recommended: manifest-published, prune to max), count bucket scope (recommended: per member path, settled with #21's unit table).

**Explicitly not reopened:** D-CLOUD-052 (no conditional-put transport; recoverable-not-serializable accepted, §3 row 2), D-CLOUD-099 (auto-states stay; the fix is bucket scope), D-CLOUD-097 (no interim), D-CLOUD-032 (honoured by protecting the newest discarded entry), D-CLOUD-014's principle, D-CLOUD-036's count range and default. Also: when #22's text is amended, its R6 launch-refusal and R10 exit-code language must be swept for the superseded phrasings `gpt-analysis.md` caught (D-CLOUD-076 cancels; D-CLOUD-074's 75/69).

---

## 6. Time to play (commission Q3; D-CLOUD-098, #135)

**Launch path: zero added round trips.** Retain-before-publish runs on publish paths (exit sync, full passes), never between the press and the frame; a launch during an automatic sync cancels it, the kill completing before the game starts (D-CLOUD-076). `repo/rules/time-to-play.md` is satisfied: rigour is spent where the player is not waiting.

**Exit sync, operation ledger** (`gpt_peer_review.md`, adopted — all figures *estimates*, to be replaced by #135's VM measurements):

| Step | Hashed backend, server-side copy | Hashless / streamed (SFTP, SMB) |
|---|---|---|
| Fresh head evidence | already in R5 (1 listing) | same |
| Retain: `copyto` per changed member | +1 round trip each, no payload through device; est. 0.3–1.0 s | streams 2S through the device; est. ~4.2 s payload for 5 MiB at 20 Mbit/s, plus latency |
| Verify retained bytes | folded into the transfer's post-check where it fails closed | capped re-fetch (R4's rule) |
| `record.json` write + verify | +1–2 round trips; est. 0.3–1.5 s | same |
| Publish + verify + agreement | as planned (D-CLOUD-046's 3–4 spawns) | as planned |
| Housekeeping (prune, sweep, fold) | full passes only, never exit | same |

One changed save on a hashed backend: est. +1–3 s on the exit card. On streamed backends, large units defer more often — the honest price, named on the card (D-CLOUD-077). The idle exit spawns nothing; dedupe skips redundant retains. **Measurement warning adopted from `gpt_peer_review.md`:** longer automatic runs raise cancellation probability, so #135's cell must record completion rates alongside latency — a fast launch achieved by cancelling every backup is not protection.

---

## 7. Load-bearing vs optional

**Load-bearing** (get these wrong and a player loses a save, or waits for us): the row-2 transaction shape (bytes-first-record-last, verified before replace); retain-on-fetch-when-absent-from-store; copy-not-move; deferral as a pair with the ceiling counting retain bytes; the allowlist exclusion + rules-file fleet migration + `--delete-excluded` audit; mass-absence judged on live units; migration as copy–verify–record–verify–remove over *both* set-asides; never-only-copy outranking the size cap; restore staging before any live write.

**Ships with the store** (correctness of victim selection and display, not safety): pub-chain ordering; count-per-(unit, member-path) buckets; protect-newest-discarded; run-id in `<seq>`; the standing fold; README wording.

**Can follow later:** the uniform-byte hash shortcut (gated optimisation); the verb-label wordsmithing; docs polish; the repeat-suspect escalation window's exact length.

---

## 8. Unmeasured — hypotheses and the experiments that settle them

All on the GENERIC_X64 VM pair and #133's self-hosted backends (D-QA-007/017); nothing touches a person's device or cloud (D-QA-015).

- **E1 (dot-component matching):** seed a cloud with `Saves/README.md` and `.history/<unit>/<seq>/` members; run the *shipped* image's backup (sync mode), restore, and MATCH. Expected result written as the hazard: members are moved to `-replaced/`, records orphaned. Then the patched image must pass. (My §2.5, with `gpt_peer_review.md`'s expected-failure baseline.)
- **E2 (`--delete-excluded`):** grep the full scripts (corpus gap); then a VM run with the flag forced, asserting the store survives. Whether it bypasses `--backup-dir` is unestablished — test, don't assert.
- **E3 (backend capabilities):** server-side copy, hash availability, and **modtime preservation on `copyto`** measured per #133 backend (§1.3); no age or ordering rule may lean on modtime until this lands.
- **E4 (concurrent publishers, distinct device ids):** `gpt-analysis.md`'s barrier sequence through A's subsequent fetch; assert `HA` reaches the store via retain-on-fetch. (Cloned-id case is R7/A11's, tested separately.)
- **E5 (orphan rename):** pause a restore's child before a local rename, kill the lock-owning parent, launch a game, release the child (D-CLOUD-093's trade; `gpt_peer_review.md` failure case 7, `claude_peer_review.md` §3). Also: a server-side operation completing after client death.
- **E6 (count scope):** overwrite slot 1, renumber, N auto-state exits, restore slot 1's preimage from a second device (`claude_peer_review.md` §7.1).
- **E7 (capture walker):** seed a device with a downloaded `.history/` tree; run `cloud_capture --full`; assert nothing under it is claimed as this device's saves (`claude_peer_review.md` §7.6; #21 not embedded — corpus gap).
- **E8 (time to play):** #135's `time-to-play` cell with bandwidth caps, per backend class, reporting latency distributions *and* sync completion rates.

**Corpus gaps surfaced:** the full `cloud_backup`/`cloud_restore` scripts and MATCH's call path; #21 (unit table, capture-stage lifetime); `docs/save-manifest-schema.md`, `docs/conflict-wizard-ia.md`, `engineering-practices.md`, `upgrade-and-install.md`; `cloud_sync_helper`'s handling of a user-edited rules file; all backend capability measurements.

---

## 9. A simpler shape?

None exists that meets the maintainer's constraints. Two siblings (A) is what D-CLOUD-095 retired; suffixed copies beside each save (C) clutter the visible tree, carry no metadata, and need filter machinery to survive restores. The delta's shape — one hidden folder, declared in a README, one vocabulary, one reader — is the simplest that fits. Everything above is about making that shape *safe*, not replacing it.

---

## `corpus.provenance.json`

```json
{
  "facilitator": "council-facilitator@1.2.0",
  "access_mode": "embedded read-at-time corpus; no filesystem access; hashes are the Facilitator's embed-time values, not recomputed by this member",
  "manifest": "research/council-runs/2026-09-11-save-history-one-home/_prompts/step3-source-manifest.json",
  "manifest_read_timestamp_utc": "2026-09-11T19:31:42Z",
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
  "corpus_gaps_surfaced": [
    "full cloud_backup / cloud_restore scripts and the MATCH call path (--delete-excluded audit, deletion direction)",
    "issues/21.md (capture contract, unit table, stage lifetime) — needed for the count-bucket key and the capture-walker question",
    "docs/save-manifest-schema.md, docs/conflict-wizard-ia.md, engineering-practices.md, upgrade-and-install.md (referenced, not embedded)",
    "cloud_sync_helper's handling of a user-edited cloud_sync-rules.txt on upgrade",
    "backend capability evidence (server-side copy, hash correspondence, modtime preservation on copyto) — to be produced on the #133 matrix"
  ],
  "fabrication_statement": "No path, hash or content has been invented for unembedded material. Peer artifacts are cited by their injected filenames only (claude_peer_review.md, gemini_peer_review.md, gpt_peer_review.md, mistral_peer_review.md, and the Step 1 analyses they name); no hashes were supplied for them and none are claimed."
}
```

=== END kimi-revised_plan.md ===

=== START mistral-revised_plan.md ===

I've synthesized the peer reviews and the embedded corpus into a revised approach for the delta. This revision endorses, amends, or replaces each row of `save-history-plan-delta.md` while addressing the critiques and missed failure modes.

---

## Revised Delta to the Council-Derived #11 Plan

### 1. Store Location and Structure (Endorsed with Amendments)

**Original:**
> store at `<SAVES_REMOTE>-discarded/`, written on a wizard decision

**Revised:**
> store at **`<SAVES_REMOTE>/.history/<unit>/<seq>/`** with:
> - `record.json` carrying `reason: discarded | replaced | deleted | suspect | legacy`
> - A **`README.md`** at `<SAVES_REMOTE>/` and inside `.history/` declaring the store's purpose and that the device menu restores from it
> - **`- /.history/**`** prepended to the shipped `cloud_sync-rules.txt` **one image before R1** (D-CLOUD-097 not reopened; this is a guard, not a retention change)

**Rationale:**
- **One home, hidden, declared** (D-CLOUD-095) is endorsed.
- **Amendments:**
  - `reason: legacy` for migrated `-replaced/` entries (GPT: sync-mode deletions are not "replaced"; Kimi: unknown producer/time).
  - Ship the allowlist rule early to close the pre-R1 exposure window (Claude: the store is unsafe under the shipped rules; Gemini: the delta's rule is not yet shipped).
  - The README is excluded from sync by the shipped rules (Gemini), but its creation must be guarded against mass-absence (GPT: metadata can conceal emptiness).

**Failure Modes Addressed:**
- `.history/` members matching `+ /**/*.srm` restored to devices or deleted into `-replaced/` under the shipped rules (Claude).
- Sync-mode deletions misclassified as `replaced` (GPT).
- Mass-absence bypass via control files (GPT).

---

### 2. Retain-Before-Publish (Amended)

**Original:**
> retain the loser before the winner replaces it (wizard only)

**Revised:**
> **retain-before-publish for every overwriting publish (decided or not):**
> 1. Copy the cloud's current version into `.history/` with `reason: replaced` (or `deleted` for sync-mode deletions).
> 2. Verify the retained bytes and `record.json` before publishing the new head.
> 3. For one-way fetches, retain the local loser in `.history/` if its hash is not already there (Gemini: closes GPT's race follow-on).
> 4. **Ordering:** Own-manifest witness (R7) runs before any retain (Kimi: cloned cards must not write store entries for refused publishes).

**Rationale:**
- **Universal retention** (D-CLOUD-095) is endorsed.
- **Amendments:**
  - **Conditional local retention** (Gemini): Only when the local loser's hash is absent from the store (GPT's race follow-on).
  - **Verification before publish** (Claude/GPT): Bytes-first, record-last, with the record as commit point (D-CLOUD-078).
  - **Ordering rule** (Kimi): Witness before retain to prevent cloned-card store pollution.

**Failure Modes Addressed:**
- Concurrent publishes overwriting versions without retention (GPT).
- Cloned cards writing store entries for refused publishes (Kimi).
- Torn writes or verification failures leaving the store incoherent (Claude).

---

### 3. Retirement of `--backup-dir` (Amended)

**Original:**
> retired once the reconciler is the only writer (R1); until then unchanged

**Revised:**
> **Retired at R1.** Until then:
> - **No interim widening of `-replaced/`** (D-CLOUD-097).
> - **Migration at R1:** Fold `-replaced/` and `.cache/cloud_sync/replaced/` into `.history/` under `L_T` with `reason: legacy`, verify before deleting, and preserve unique local copies (Claude/GPT).
> - **Grace period:** Import entries older than 90 days but do not prune them until the next full pass (GPT: age cap applies immediately otherwise).

**Rationale:**
- **No interim** (D-CLOUD-097) is endorsed.
- **Amendments:**
  - **Migration:** Fold both set-asides into `.history/` (Claude/GPT: no data loss; Gemini/Mistral's versions lose data).
  - **Grace period:** Protects old entries from the age cap (GPT).

**Failure Modes Addressed:**
- Unique local copies lost (Mistral: ignored `.cache/cloud_sync/replaced/`).
- Age cap pruning imported entries immediately (GPT).

---

### 4. Allowlist Rule (Amended)

**Original:**
> `- /savestates/.snapshots/**` ahead of `+ /savestates/**` (a guard with no writer)

**Revised:**
> **`- /.history/**`** prepended to the shipped `cloud_sync-rules.txt` **one image before R1**, ahead of every include. The `.snapshots` rule is dropped (no writer after R1).

**Rationale:**
- **Prepended rule** is endorsed.
- **Amendment:** Ship the rule early (Claude: closes the pre-R1 exposure window).

**Failure Modes Addressed:**
- `.history/` members restored to devices or deleted into `-replaced/` under the shipped rules (Claude).

---

### 5. Retention Settings (Amended)

**Original:**
> KEEP DISCARDED SAVES (switch) · DISCARDED SAVES KEPT PER SAVE (1–9, default 3) on the cloud-saves page

**Revised:**
> **SAVE HISTORY** (submenu under SAVE MANAGEMENT) with:
> - **KEEP EARLIER VERSIONS OF SAVES** (switch, on by default)
> - **VERSIONS KEPT PER SAVE** (3–5, default 3; per (unit, member path), not per unit)
> - **AGE CAP** (90 days, trust-gated: prune only entries with `decided_at` > earliest trusted clock)
> - **TOTAL SIZE CAP** (256 MiB, soft: prune oldest-first on full passes only)
> - **Disclosure:** The README and settings page state that caps are soft and pruning runs on full passes only.

**Rationale:**
- **Nesting** (D-UI-039) and **one vocabulary** (D-CLOUD-096) are endorsed.
- **Amendments:**
  - **Per-file count keying** (Claude): Protects manual slots from auto-state churn (D-CLOUD-099).
  - **Trust-gated age cap** (Claude): Prune only entries with trusted timestamps (untrusted clocks are corpus evidence).
  - **Soft caps** (Kimi): Pruning runs on full passes only; exit-only devices overshoot between full passes.
  - **Disclosure:** The README and settings page must not promise hard ceilings.

**Failure Modes Addressed:**
- Auto-state churn evicting manual slots (Claude).
- Untrusted clocks pruning fresh entries (Gemini).
- Soft-cap semantics not disclosed (Kimi).

---

### 6. Restore Tool (Amended)

**Original:**
> reads `-discarded/`, labels `-replaced/` copies separately

**Revised:**
> **#25 reads one store (`.history/`), labels by `reason`:**
> - **YOU CHOSE THE OTHER** (`discarded`)
> - **REPLACED BY A SYNC** (`replaced`)
> - **DELETED** (`deleted`)
> - **SET ASIDE AS DAMAGED** (`suspect`)
> - **UNKNOWN** (`legacy`)
> - **Restore mechanics:** Republication with a new `pub`; the old `retired` record does not consume it (A9).

**Rationale:**
- **One store** is endorsed.
- **Amendments:**
  - **Legacy reason** for migrated entries (GPT/Kimi).
  - **Restore mechanics:** Republication with a new `pub` (A9).

**Failure Modes Addressed:**
- Sync-mode deletions misclassified (GPT).
- Unknown producer/time for migrated entries (Kimi).

---

### 7. Suspect Classifier (Amended)

**Original:**
> adds a `suspect` class: zero length, or all one byte, where the previous version was neither

**Revised:**
> **`suspect` class:** Zero length or uniform byte (format-aware: e.g., all `0x00` or `0xFF` for known formats) where the previous version was neither.
> - **Auto-heal:** Restore the cloud's good copy; set the suspect aside with `reason: suspect`.
> - **Message:** "The save for X was damaged when the game closed. The last good copy from your cloud was put back." (D-CLOUD-077: no lying; GPT: intentional erasures must not be silently rolled back).
> - **Both suspect:** Flag as a question for the wizard (no silent rollback).
> - **Unavailable good copy:** Flag as a question for the wizard (no silent rollback).
> - **Audit line** for every auto-heal (Mistral: generalized to all store mutations).

**Rationale:**
- **Auto-heal** (D-CLOUD-100) is endorsed.
- **Amendments:**
  - **Format-aware uniform-byte detection** (Kimi: hash shortcut is backend-dependent).
  - **Both-suspect and unavailable-counterpart handling** (GPT: no silent rollback).
  - **Message wording** (GPT: intentional erasures must not be silently rolled back).
  - **Audit line** (Mistral: generalized to all store mutations).

**Failure Modes Addressed:**
- Intentional erasures silently rolled back (GPT).
- Both-suspect or unavailable-counterpart cases mishandled (GPT).

---

### 8. Save States (Endorsed)

**Original:**
> decided (D-CLOUD-099): all of them, auto-states included

**Revised:**
> **All save states, auto-states included, bounded by the per-file count.**

**Rationale:**
- **D-CLOUD-099** is endorsed.
- **Amendment:** Per-file count keying (Claude) protects manual slots from auto-state churn.

---

### 9. Time-to-Play Cost (Amended)

**Original:**
> one small extra transfer per replaced save

**Revised:**
> **Operation ledger (worst-case, SFTP/SMB):**
> | Operation | Round Trips | Payload (S = save size) | Notes |
> |---|---|---|---|
> | Fresh head evidence | 1 | Listing | |
> | Retain old bytes | 1 | Download S | |
> | Verify retained bytes | 1 | SHA-256 | |
> | Write `record.json` | 1 | Upload ~1 KiB | |
> | Verify `record.json` | 1 | Download ~1 KiB | |
> | Publish new head | 1 | Upload S | |
> | Verify new head | 1 | Download S or SHA-256 | Backend-dependent |
> | **Total** | **6–7** | **2S + ~2 KiB** | |
>
> **Estimated latency (20 Mbit/s, 5 MiB save):**
> - Payload: ~4.2 s (2 × 5 MiB @ 20 Mbit/s).
> - Request overhead: ~1–2 s (6–7 round trips).
> - **Total: ~5–6 s per replaced save.**
>
> **Mitigations:**
> - **Exit path:** Retain and verify in the background after the card says the player may go (D-CLOUD-038).
> - **Startup path:** Retain and verify during the boot sync (D-CLOUD-072), but this lengthens the boot sync and raises cancellation probability (D-CLOUD-076).
> - **Backend optimization:** Server-side copy (Dropbox, S3) reduces payload to ~S + ~2 KiB (~2.1 s for 5 MiB).

**Rationale:**
- **Cost transparency** (D-CLOUD-098) is endorsed.
- **Amendment:** Full operation ledger (GPT) and latency estimates (Claude).

**Failure Modes Addressed:**
- Understated cost (Mistral: fabricated measurement; GPT: omitted operations).

---

### 10. Migration (Amended)

**Original:**
> Devices already hold `Saves-replaced/` folders and a local `.cache/cloud_sync/replaced/`

**Revised:**
> **At R1:**
> 1. **Fold both set-asides into `.history/` under `L_T`:**
>    - `-replaced/<stamp>/` → `.history/<unit>/<seq>/` with `reason: legacy`.
>    - `.cache/cloud_sync/replaced/<stamp>/` → `.history/<unit>/<seq>/` with `reason: legacy`.
>    - Preserve unique local copies (Mistral: ignored `.cache/cloud_sync/replaced/`).
> 2. **Verify before deleting:** Check hashes and `record.json` for every imported entry.
> 3. **Grace period:** Import entries older than 90 days but do not prune them until the next full pass (GPT).
> 4. **Release gate:** "Upgrade both devices before syncing" (GPT: mixed-fleet ordering).

**Rationale:**
- **No data loss** (commission rule) is endorsed.
- **Amendments:**
  - **Fold both set-asides** (Claude/GPT: no data loss; Gemini/Mistral's versions lose data).
  - **Grace period** (GPT: age cap applies immediately otherwise).
  - **Release gate** (GPT: mixed-fleet ordering).

---

### 11. Reopened Decisions

| ID | Change | Argument |
|---|---|---|
| **D-CLOUD-047** | Retain deletions and sync-mode replacements in `.history/` with `reason: deleted`/`replaced` | The delta's `reason: deleted` and retirement of `-replaced/` contradict D-CLOUD-047's exclusions. |
| **D-CLOUD-041** | Cloud loser (KEEP RIGHT) uses `copyto` instead of server-side move | Copy-before-replace closes the D-CLOUD-037 window (GPT/Kimi: absent-head TOCTOU). Cost: SFTP/SMB streams through the device. |
| **D-CLOUD-046** | Exit path may fetch for auto-heal (bounded) | D-CLOUD-100's "restored" contradicts R5's "no fetches on exit." Amendment: heal from the stage first (Claude); fetch only if the stage lacks the good copy (GPT). |
| **D-CLOUD-052** | Recoverable concurrency accepted as a residual | GPT's counterexample proves R5's head check is not a serialization. Amendment: retain-on-fetch-when-absent-from-store (Gemini) closes the follow-on; escrow (GPT) is the stronger alternative. Residual: `HA` is unrecoverable from the cloud alone until A next syncs. |

---

### 12. Failure Modes Not in the Delta

1. **Witness-before-retain ordering** (Kimi): Cloned cards must not write store entries for refused publishes.
2. **Audit lineage for routine retains/prunes** (Kimi): The store's mutations need D-CLOUD-027 lineage.
3. **Startup sync's backup half retains too** (Kimi): Lengthens the boot sync and raises cancellation probability.
4. **Auto-rule churns the store twice** (Kimi): The divergent-`.state.auto` rule installs slot 4, which overwrites any existing slot 4, creating a store entry.
5. **Soft-cap semantics** (Kimi): Pruning runs on full passes only; exit-only devices overshoot between full passes.
6. **Wizard's pre-pass retains survive a quit** (Kimi): The delta should disclose this.
7. **Allowlist rule ships at R1** (Kimi): The store is unsafe under the shipped rules until R1.

---

### 13. Simpler Shape?

The delta is already the simplest shape that meets the maintainer's constraints:
- **One home** (D-CLOUD-095).
- **Inside the saves folder** (D-CLOUD-095).
- **Hidden but declared** (D-CLOUD-095).
- **One vocabulary** (D-CLOUD-096).
- **No stacking of settings** (D-UI-039).
- **Recoverable accidental overwrites** (D-CLOUD-099).

The amendments above refine it for safety and consistency, not complexity.

---

## `corpus.provenance.json`

```json
{
  "facilitator": "council-facilitator@1.2.0",
  "access_mode": "embedded read-at-time corpus; no filesystem access; hashes are the Facilitator's embed-time values, not recomputed by this member",
  "manifest": "research/council-runs/2026-09-11-save-history-one-home/_prompts/step3-source-manifest.json",
  "manifest_read_timestamp_utc": "2026-09-11T19:31:42Z",
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
  "peer_reviews": [
    "claude_peer_review.md",
    "gemini_peer_review.md",
    "gpt_peer_review.md",
    "kimi_peer_review.md"
  ],
  "corpus_gaps_surfaced": [
    "The unit table in #21 (decides whether a game's states are one unit; needed for per-file count keying).",
    "Backend capability results for server-side copy, hash availability, and modtime preservation on copyto (needed for cost estimates and clock mitigations).",
    "The full backup/restore scripts (needed to audit MATCH THIS DEVICE TO THE CLOUD and --delete-excluded behavior).",
    "The save-manifest schema and conflict-wizard IA (referenced but not embedded).",
    "The upgrade-and-install rules (referenced by the commission but not embedded)."
  ],
  "fabrication_statement": "No path, hash, or content has been invented for unembedded material. The analyses reviewed are the four injected peer reviews, cited by filename only."
}
```

=== END mistral-revised_plan.md ===
