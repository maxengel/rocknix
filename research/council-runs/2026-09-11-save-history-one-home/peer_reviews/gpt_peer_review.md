# Step 2 — Peer review

This is a review of the four injected proposals, not a revised plan or a vote.

I used only the embedded corpus. Source citations below are relative to `research/council-runs/2026-09-11-save-history-one-home/_sources/`; the full declared paths and Facilitator-supplied hashes are recorded in `corpus.provenance.json` at the end. I have not re-read files, re-hashed them, or performed the proposed experiments.

## The most important correction: retain-and-check is not compare-and-swap

Both `claude-analysis.md` and `kimi-analysis.md` claim a concurrency guarantee that their proposed ordering does not provide.

Consider two devices with agreement H0 and different newly captured saves, HA and HB:

| Step | Device A | Device B |
|---|---|---|
| 1 | Lists H0 | Lists H0 |
| 2 | Retains and verifies H0 | Retains and verifies H0 |
| 3 | Publishes HA | — |
| 4 | Verifies HA and advances agreement to HA | — |
| 5 | — | Publishes HB |
| 6 | — | Verifies HB and advances agreement to HB |

Both pre-publish checks passed. Both post-publish checks passed. Nevertheless, B overwrote HA without retaining HA. The history contains H0, possibly twice.

The next full pass on A makes the consequence worse: L = A = HA, while C = HB, so the stated classifier says **the cloud changed**. Under #22’s explicit exclusion of preimages of one-way fetches, that download can remove HA’s last guaranteed copy. Temporary survival on A is not the cloud-home recovery guarantee.

This follows from the classifier, agreement rules, local locks, and negative scope in `issues/22.md`, and from D-CLOUD-045’s rule that manifests are claims, not a shared head authority. A read, a copy, and another read do not serialize writes between devices.

Therefore:

- `claude-analysis.md`’s “cheap compare-and-swap” claim is false.
- `kimi-analysis.md`’s “fresh-head check already serializes actual publishes” claim is false.
- Post-transfer correspondence does **not** necessarily detect the race.
- Unique history entry names prevent one class of collision; they do not protect the live head.
- `gemini-analysis.md` and `mistral-analysis.md` also need this ordinary, distinct-device case, rather than testing only pruning contention or cloned identities.

This is partly a pre-existing #22 weakness, not something the delta invented. But the delta cannot promise that **every overwritten cloud version** is retained using a protocol that misses this interleaving.

**Required Step 3 revision:** reproduce this schedule explicitly, then distinguish two guarantees: detecting conflicting publication and preserving every candidate’s bytes. Identify what provides each guarantee. Another unconditional re-list is not an answer. Any proposed conditional publication, coordination, or immutable-publication mechanism must be priced under D-CLOUD-034 and reconciled with #22’s “no protected-publication protocol” negative scope and D-CLOUD-052 where applicable.

The decisive fixture must continue through A’s subsequent download. “The other version remains on its original device immediately after the race” is an insufficient assertion.

---

## Review of `claude-analysis.md`

### Strongest argument

The strongest argument is the **loss of structural isolation when the store moves inside the saves root**, together with the warning about advertising a restore menu before #25 exists.

The shipped rules include save extensions at arbitrary depth and contain no `.history/` exclusion. Thus `.history/` members with matching extensions enter the old transfer boundary. The root README, by contrast, matches no include and falls through to the final exclusion. These observations are supported by `repo/code/cloud_sync-rules.txt`.

The shipped cloud backup also really does archive overwritten or sync-deleted files into the sibling and prune older stamp directories after successful full runs; it skips that pruning on `--recent`. That supports the mixed-image hazard, subject to verifying the complete command options and rclone’s filter behavior.  
**Sources:** `repo/code/cloud_backup-set-aside-excerpt.md`; `repo/code/cloud_sync-rules.txt`.

The README timing objection is particularly persuasive: #25 explicitly ships after the writer, and V1 deliberately has no restore control. Documentation must distinguish “retained for recovery” from “restorable from this menu now.”  
**Sources:** `issues/25.md`; D-CLOUD-033, D-CLOUD-077.

### Weakest argument

The weakest argument is the claimed concurrency protection, followed closely by the proposed verification optimization.

The concurrency counterexample above defeats both the “cheap compare-and-swap” claim and the assertion that correspondence checks always catch the overwrite afterward.

More seriously, the time-to-play table permits history verification to be folded into **post-publish** correspondence verification. That violates the ordering the analysis otherwise defends. Retention must be positively verified **before** replacement. Verification may be reused from a transfer operation if that operation demonstrably fails closed, but it cannot be moved after publication to save a spawn.  
**Sources:** `issues/22.md` R9; D-CLOUD-036, D-CLOUD-041, D-CLOUD-078.

### Claims that need correction or qualification

1. **Hashless verification is not size-only.**

   The statement that size-only comparison is the standard D-CLOUD-046 accepts is directly contradicted by the corpus. R4 specifies size plus SHA-256 after fetch; R5 requires a capped re-fetch on hashless backends. D-CLOUD-052 explicitly rejects an architecture that misses equal-size, equal-mtime changes.

   R5’s restriction on ordinary exit-path fetches must not be read as permission to weaken verification. The same specification expressly includes verification re-fetches.

   **Revision:** require the retained bytes’ SHA-256, or an established backend-hash correspondence to those bytes. Defer the overwrite when verification cannot fit the admission ceiling.

2. **The per-unit retention concern is valuable; the per-file remedy is not established.**

   A “hash set for the unit” does not, by itself, prove that every state slot belongs to one unit. A state and its PNG already form a multi-member set. R9’s “game + kind” wording raises the ambiguity, but the missing unit table is necessary to resolve it.

   The analysis acknowledges that inference later; its opening should be equally qualified.

   Moreover, a bound keyed to a member path is not a cost-free fix. D-CLOUD-030 makes paths and slots attributes because renumbering moves versions. A filename-keyed history policy can attach old history to a reused slot or separate history from the version that moved. A state and its thumbnail must not become independently prunable “files.”

   **Revision:** distinguish the coherent restore unit, version identity, and retention bucket. Add a fixture that overwrites a manual state, renumbers slots, then performs several auto-state exits. Require the original manual version and its PNG to remain correctly associated. Do not settle the bucket key without #21 and the unit table.

3. **Local-stage healing is a proposed extension, not an existing guarantee.**

   D-CLOUD-078 establishes that capture has content-addressed copies. It does not establish that the previously agreed version survives a later capture, nor that cached agreement identifies the current cloud head while offline.

   Healing locally before the suspect copy is verified in cloud retention also needs an explicit ordering exception or a sequence that preserves the suspect first. Moving the work into capture does not make that policy question disappear.

   **Revision:** state the required stage lifetime, offline behavior, and preservation ordering as amendments requiring verification against #21. Do not say they require no change to the plan. Report recovery only after installation succeeds.

   “If you meant to erase it, erase it again” is not a usable fallback: the same heuristic can simply undo the second erase too.

4. **The migration must not move sources away before the new representation is verified.**

   Moving legacy cloud files first is inconsistent with the safer copy–verify–record–verify–remove sequence advocated elsewhere. Cloud “moves” also cannot be assumed to have ordinary same-filesystem rename semantics across all supported backends.

   Legacy timestamps are not established UTC timestamps: the shipped naming command uses `date` without an explicit UTC option. Likewise, finding a file in this device’s replacement cache does not establish that this device produced it; it may have restored that file from another device previously.

   **Revision:** preserve sources until verified import, record unknown original producer/time information honestly, and distinguish the importer from the producer.

5. **An early exclusion release helps, but release notes do not close the mixed-fleet race.**

   Shipping the guard one image early does not widen `Saves-replaced`, so the argument that it need not reopen D-CLOUD-097 is sound.

   However, a dormant device can skip that image, and D-CLOUD-088 permits custom filters on old scripts. A startup import can also be cancelled under D-CLOUD-076. “Upgrade both before syncing” is advice, not an enforced safety barrier.

   **Revision:** give an explicit compatibility boundary and address an old device that never received the guard. Do not describe a release note as completing a no-loss proof.

6. **The MATCH fixture has an unsupported direction assumption.**

   The menu map establishes that **MATCH THIS DEVICE TO THE CLOUD** is destructive, but does not embed its implementation. Its label suggests modifying the device, not modifying the cloud to match a sparse device. The proposed “device missing 70 saves → MATCH → 70 cloud history entries” fixture is not established by that map.

   **Revision:** keep the proven cloud hazard attached to `cloud_backup` in sync mode. Audit MATCH separately when its caller and command are available. If it deletes local files, those require local-preimage preservation, not merely copying the cloud head.  
   **Sources:** `repo/docs/es-menu-map.md`; `repo/code/cloud_backup-set-aside-excerpt.md`.

7. **Several claimed simplifications still need evidence.**

   - A new entry does not necessarily sort newest when writer clocks are wrong.
   - A generous timestamp-based grace period does not solve an untrusted-clock problem.
   - A recursive listing facility is not evidence of one network request; pagination and backend traversal matter.
   - Unique entry directories do not prove that Dropbox contention remains only at directory creation; head writes can still share folders.
   - The corpus does not establish that standalone screenshots are never overwritten. D-UI-022 includes screenshots in the saves tier.

   These should remain hypotheses with experiments, not implementation assumptions.

### Concrete Step 3 priorities

Correct the concurrency and verification claims first. Then make the per-file proposal conditional on the unit schema, specify the stage-heal exception, replace move-first migration, and withdraw the unsupported MATCH direction and provider-cost guarantees.

The argument for reconsidering the age cap is substantive: it names clock risk and a potentially redundant rule. But dropping age does not remove timestamp dependence from “oldest first” count and size pruning.

---

## Review of `gemini-analysis.md`

### Strongest argument

The strongest argument is that retiring local `--backup-dir` can discard a safety property unless **unique local preimages remain protected**.

The shipped restore excerpt explicitly says a manual restore can replace a newer local save with an older cloud copy, and the local set-aside preserves that loser. This is not merely speculative.  
**Source:** `repo/code/cloud_restore-set-aside-excerpt.md`.

That conservation requirement should be retained in Step 3.

### Weakest argument

The weakest factual argument is the explanation of launch locking. The weakest proposed outcome is the migration that indefinitely leaves legacy data in separate cloud and local stores and then permits it to expire.

### Claims that need correction or qualification

1. **The launch-lock explanation does not match the corpus.**

   D-CLOUD-053 explicitly gates launch of **any game**, not just the same game, on the transfer lock. In #22 R6, `L_S` helps exclude an active game from reconciler mutation; it is not the only launch gate.

   More importantly, later D-CLOUD-076 supersedes the earlier automatic-sync refusal behavior: a launch cancels an automatic startup or exit sync in any phase, with termination completed before launch. Only a manually started sync is refused.

   **Revision:** remove the same-game/different-game distinction. Explain capture staging separately from the actual cancellation and transfer-lock contract. Releasing `L_S` is not, by itself, what makes launch non-blocking.  
   **Sources:** `issues/22.md` R5–R6; D-CLOUD-053, D-CLOUD-076.

2. **“Retain every local overwrite” is a real scope amendment.**

   The analysis describes local set-aside as part of the plan of record, but it is shipped-script behavior. #22 explicitly lists “no preimages of one-way fetches” in its negative scope.

   There may also be cases where the local preimage already has a verified cloud history copy, making another upload unnecessary.

   **Revision:** explicitly amend that negative scope, distinguish unique unretained bytes from already-retained bytes, and price the additional upload on cloud-to-device operations. The preservation requirement is strong; “upload everything again” is not yet shown to be the cheapest sufficient mechanism.

3. **The shipped allowlist does not exclude `.history/`.**

   The README discussion says that it does. That is the proposed delta, not `repo/code/cloud_sync-rules.txt` as embedded.

   The separate observation that root `README.md` falls through to `- /**` is correct for the shipped default file. Whether a mirror preserves excluded destination files depends on the effective command options; the full scripts were not embedded.

   **Revision:** distinguish baseline behavior from patched behavior and test both.

4. **The migration does not complete the one-home transition.**

   A temporary read-both adapter is reasonable. Leaving the unique local cache as its only home is not a completed migration under D-CLOUD-036’s cross-device consistency rationale. Blindly expiring legacy directories can also remove a game’s only surviving copy.

   The “only a single run” premise is too strong: recent runs skip pruning, and failed runs can leave additional stamps.  
   **Source:** `repo/code/cloud_backup-set-aside-excerpt.md`.

   **Revision:** import and verify both legacy sources into the new cloud store before deleting them. Preserve originals on failure or deferral. Use the read-both adapter during that process, not as a permanent substitute for it.

5. **The cost estimate omits required operations.**

   One `copyto` is not the complete incremental transaction. Records and positive verification also cost work. Backend fallback is a capability-dependent hypothesis, not a uniform property of WebDAV or SFTP.

   A traffic test must count both legs: downloading S bytes and uploading S bytes adds roughly 2S of payload traffic for retention alone, before publication and any verification re-fetch.

   **Revision:** provide an operation ledger and explicit latency/throughput assumptions. Label the seconds as estimates.

6. **Unqualified endorsement leaves material policy gaps.**

   The suspect classifier needs behavior for unavailable or unverified good copies, history being off, and interrupted local installation. The bounds need a saturation policy when protected copies alone exceed 256 MiB. These cannot be discharged by citing the decision IDs alone.

### Concrete Step 3 priorities

Keep the unique-local-preimage requirement, but identify its scope change. Correct launch semantics and the baseline allowlist. Replace expire-in-place migration with verified import, then supply the missing transaction and cost accounting.

---

## Review of `kimi-analysis.md`

### Strongest argument

The strongest argument is the **same-device orphan and sequence-collision hazard** grounded in D-CLOUD-093.

That row deliberately allows a new run to start while an orphaned rclone may still be running. R9’s timestamp-plus-device sequence does not include its separately recorded run ID. Two same-device operations within the same timestamp resolution—or after a clock reset—can therefore target the same entry.

This is a persuasive addition because it connects two explicit parts of the corpus rather than assuming the transfer lock supplies a guarantee it deliberately does not supply.  
**Sources:** D-CLOUD-093; `issues/22.md` R9.

A collision-resistant operation identity, stable across retries, is a concrete requirement. Merely “check whether the directory exists” would still need protection against simultaneous checks.

### Weakest argument

The weakest argument is that fresh-head checking serializes publication and the remaining race fails safe. The opening counterexample disproves it.

That error materially affects the claim that the delta weakens only structural isolation and strengthens everything else.

### Claims that need correction or qualification

1. **The uniform-byte hash shortcut is not generally valid.**

   The analysis proposes comparing the SHA-256 of a uniform buffer with the listing hash. The listing need not contain SHA-256. Dropbox’s content hash and S3 ETags are not interchangeable with stored-byte SHA-256, and a newly corrupted external head may have no manifest mapping that establishes correspondence.

   Also, “all one byte” includes more than zero: detecting an unknown uniform byte through hypothetical hashes may require more work than the stated single comparison.

   **Revision:** make this optimization conditional on an explicitly validated hash algorithm and correspondence. Otherwise inspect verified bytes. Account for any cloud read and CPU work rather than declaring zero additional round trips.  
   **Sources:** `issues/22.md` R4–R5; D-CLOUD-030, D-CLOUD-045; `issues/133.md`.

2. **“Both suspect means nothing worth protecting” is unsafe reasoning.**

   The heuristic is not a format validator. Nor does it establish that older good versions do not exist. D-CLOUD-100’s auto-heal description presupposes a good counterpart.

   Similarly, “a false positive is recoverable by construction through #25” is incomplete: #25 does not ship with V1, and explicit restoration of a suspect entry may trigger the same heuristic again unless an exception is specified.

   **Revision:** require a qualifying, verified good counterpart for auto-heal. Define the both-suspect and unavailable-counterpart outcomes without discarding evidence or reporting a recovery that did not occur.

3. **The exit-fetch rider is a genuine refinement and should be named as such.**

   This part is stronger than pretending the conflict does not exist. A bounded heal download changes the push-only exit contract.

   But the exit card being visible is not sufficient justification for its latency. D-CLOUD-098 still applies, and cancellation during a multi-file local install must leave a complete unit before launch.

   **Revision:** carry the D-CLOUD-046/R5 refinement explicitly, including cancellation and recovery ordering.

4. **The proposed clock fix relies on an unproven timestamp.**

   `max(decided_at, server-side modtime)` is safe only if that second timestamp represents trusted server receipt time. The corpus does not establish that. A provider-exposed modification time may preserve a client-supplied value.

   Count and size are also not wholly clock-independent when victim selection is “oldest first.”

   **Revision:** define the timestamp semantics and trusted-clock policy before adopting the comparison. Test bad writer clocks and bad pruning-device clocks independently.

5. **Standing import is useful recovery work, but not a no-loss mixed-fleet guarantee.**

   The analysis explicitly accepts losing a legacy stamp after two old-image syncs without a new-image pass between them. That is not compatible with the commission’s requested no-loss transition.

   The rejection of non-save payload names is also too categorical. The maintainer required clear naming and a declared hidden home; the corpus does not establish that every internal payload must preserve an emulator-recognized extension. Original paths can remain in records.

   **Revision:** evaluate backward-safe payload naming or an enforceable compatibility boundary rather than treating human-readable payload basenames as an overriding constraint. State the remaining limit for broad custom filters honestly.

   As in `claude-analysis.md`, the claim that MATCH deletes cloud history is not established by the menu map. Separate it from the proven sync-mode **backup** hazard.

6. **Deleting a local `.history/` copy is not safe merely because it originated in the cloud.**

   Since the same analysis describes old writers destroying cloud history, a previously downloaded local member may now be its only surviving copy.

   **Revision:** verify an intact cloud destination before removing each local artifact. “Originally a copy” is provenance, not current redundancy.

7. **Pending-publication collapse must distinguish never-started work from partially published work.**

   Collapsing queued, unattempted captures may be a useful optimization. Discarding an intent after one member or a publication claim has reached the cloud can strand an incomplete publication.

   #22 explicitly requires interrupted pushes to complete from pending publication state and requires mixed units to remain held.  
   **Source:** `issues/22.md` R2, R5, A8.

   **Revision:** restrict the optimization to provably unstarted publications unless a replacement recovery protocol is specified and tested.

8. **Two rclone test claims need qualification.**

   - The assertion that `--delete-excluded` bypasses `--backup-dir` is not established by the embedded corpus. Test it with the supported version and full command.
   - The proposed shipped-image fixture cannot reasonably expect all `.history/` members to remain untouched while the analysis simultaneously explains why shipped extension includes select them. That fixture needs an expected-failure baseline followed by a patched-image success case.

### Concrete Step 3 priorities

Retain the orphan/identity finding. Replace the publication proof, correct hash and clock assumptions, remove automatic deletion of unverified local copies, and separate safe queued-work collapse from recovery of a publication already in progress.

The “no rows reopened outright” posture also needs correction: changing the wizard’s cloud-loser move to copy refines D-CLOUD-041’s mechanics, and the exit heal changes D-CLOUD-046/R5. Those can be good amendments, but they are amendments.

---

## Review of `mistral-analysis.md`

### Strongest argument

The strongest argument is that a missing or invalid history record must cause publication to **fail closed**, with `record.json` written only after the members.

That is directionally consistent with R9 and D-CLOUD-078. It needs one further requirement: all members must be verified before a valid record can certify a usable retained unit.

The suggested audit of suspect and restored hashes is also useful, provided the success event is recorded only when recovery has actually succeeded.

### Weakest argument

The weakest and most dangerous recommendation is verification by **size plus mtime on hashless backends**. It directly weakens the plan’s identity guarantee.

The unsupported “measured on the RG35XX SP” latency claim must also be withdrawn. No such retention measurement is embedded.

### Claims that need correction or qualification

1. **Size plus mtime is expressly insufficient.**

   D-CLOUD-030 identifies a version by SHA-256 of stored bytes. R4 specifies size plus SHA-256 after fetch on hashless backends. D-CLOUD-052 records equal-size, equal-mtime invisibility as a reason bisync failed.

   **Revision:** retain SHA-256 in every record regardless of backend. Require actual byte verification or established hash correspondence; defer rather than weaken the check.

2. **The argument for reopening D-CLOUD-099 does not hold.**

   The cited 28–51 KB state and approximately 48 KB PNG figures are not a measured PPSSPP directory size; D-CLOUD-036 specifically leaves that case to the census gate.

   Approximately 700 KB is about **0.27%** of 256 MiB, not “little room” remaining. Auto-state count pressure also does not automatically evict game saves if they have different retention buckets.

   Most importantly, “auto-states are rarely worth retaining” directly contradicts the maintainer’s stated reason for D-CLOUD-099 without supplying new evidence.

   **Revision:** withdraw that reopening argument or replace it with representative census and churn evidence. If proposing priority eviction instead of oldest-first, also identify the change to D-CLOUD-096.

3. **The allowlist amendment is not stricter than the delta.**

   “Before every include” is at least as strong as “before `+ /savestates/**`.” The latter is not an additional safeguard. Also, the shipped rules contain neither the new `.history/` rule nor the planned `.snapshots` guard.

   **Revision:** keep the delta’s first-position exclusion and distinguish the shipped file from #22 R2’s planned guards.

4. **The pruning predicate is reversed or underspecified.**

   A verified live head matching a history entry demonstrates another copy exists; it is not, by itself, a reason that entry must never be pruned. The important case is a game with no live head and only one recoverable retained version.

   History pruning must never target the live head at all. D-CLOUD-014’s default non-deletion rule and D-CLOUD-096’s history-pruning rules should not be conflated.

   **Revision:** state the exact protected-copy predicate and test a deleted game whose sole remaining coherent copy is in history.

5. **The concurrency fixture tests the wrong case and the proposed mitigation still races.**

   Cloned identities belong to R7’s own-manifest witness and A11. Ordinary distinct-device publication needs a separate test. Both devices can also observe “entry absent” before either creates it.

   **Revision:** include the opening distinct-device schedule, then test cloned identities separately. A technical entry-ID collision should not become a fabricated game conflict for the wizard to explain.

6. **The performance claims are unsupported.**

   - `copyto` is not guaranteed to be a server-side copy on every backend.
   - The shipped excerpt says `--backup-dir` **moves** the prior file aside, not that it performs the same copy transaction.
   - No embedded source establishes a 1–2 second measurement for the proposed retention operation.
   - An unchanged-exit contract is not a changed-exit performance measurement.

   **Revision:** replace “measured” with clearly parameterized estimates, and include records and verification.

7. **D-CLOUD-076 does not mean the automatic retain continues after launch.**

   It says the automatic sync is cancelled and termination completes before the game starts.

   **Revision:** describe that contract accurately. Background cloud-only work during play would require a separately specified change, not a citation to the cancellation rule.

8. **The migration is neither loss-safe nor corpus-supported.**

   A legacy stamp is a run, not a unit. It can contain several games and incomplete subsets of multi-file saves. The stamp does not supply a producer device ID.

   The local cache may contain unique unpublished saves. Ignoring it does not satisfy migration, and the claim that a later settings restore overwrites it is not established by the supplied excerpt.

   Ordinary filesystem `mv` atomicity cannot be assumed for a cloud backend. Finally, the commission explicitly requests no code.

   **Revision:** remove the pseudocode. Specify verified import of both sources, per-artifact source preservation until success, unknown metadata where necessary, and resumability across partial migration.

### Concrete Step 3 priorities

Correct identity verification and withdraw the fabricated measurement first. Replace the D-CLOUD-099 argument, repair the pruning predicate, and rewrite migration as a no-code, copy-before-delete transition covering the local cache.

---

## Failure cases none of the proposals closes

The following are specific additional cases—not a claim that the analyses never mention pruning, interruption, or multi-file saves generally.

### 1. History OFF, auto-heal, and a deliberately restored suspect save

The old switch permits conflict losers not to be retained. The new switch governs a broader store. D-CLOUD-100 nevertheless requires retaining the suspect copy and restoring a good one.

None of the analyses supplies the necessary policy table:

- Does OFF disable ordinary overwrite history only, or also suspect preservation?
- May auto-heal replace local bytes if their preservation is disabled or fails?
- What happens when the player explicitly restores a uniform-byte entry and the classifier immediately calls it suspect again?
- What is the practical recovery route before #25 ships?

This affects D-CLOUD-032/033/036/100 and `issues/23.md`’s explicit OFF behavior.

**Required fixture:** history off; qualifying suspect detected; retention failure injected; then, with the reader available, explicitly restore a suspect entry as a new publication. Assert no silent loss, no false recovery message, and no endless heal/restore loop.

### 2. Protected copies can exceed the total cap

“256 MiB total” and “never a game’s only copy” cannot both be unconditional hard limits for arbitrary data. One protected unit can exceed the cap; enough deleted games can exceed it collectively.

Likewise, postponing pruning until a full pass does not limit overshoot to N+1. Repeated exit passes can create many entries while every startup/full pass is cancelled.

There is also a shared-setting question: one device may select nine versions while another selects one. The corpus does not specify which device’s setting governs destructive pruning of their shared cloud history.

**Required revision:** define the priority among preservation, admission, and the nominal cap, and specify retention-policy ownership. D-CLOUD-096 calls the numbers starting points; it does not justify silently breaking the only-copy exception.

**Required fixture:** protected history over 256 MiB, an oversized single unit, repeated exit-only operation, and two devices with different count settings. No fixture may pass by deleting the protected data.

### 3. A retained entry can still be needed by an unfinished transaction or restore

A valid `record.json` establishes that retention completed. It does not establish that the intended publication subsequently succeeded, that no pending recovery depends on it, or that #25 is not currently retrieving it.

Grace periods and “never newest” rules are not a proof against a paused foreign writer, timestamp skew, reused entries, or concurrent pruning.

Hash deduplication also needs to preserve the metadata contract: identical bytes do not make “discarded by a decision” and “retained before an attempted replacement” the same event.

**Required revision:** distinguish retained, applied, and abandoned outcomes; define what makes an entry eligible for deletion or reuse. Before a restore changes live files, its selected candidate must already be independently staged and verified. If pruning wins before that, the restore must leave the current save unchanged.

**Required fixture:** pause after retention verification, prune from another device, remove local pending state, then resume recovery; separately prune while #25 fetches its selected entry.

### 4. Legacy set-asides are not necessarily coherent snapshots

`--backup-dir` retains files that were overwritten, not necessarily every member of a save unit. A stamp may therefore contain only one member of a multi-file save. Combining it with today’s other members can manufacture a version that never existed.

All migration proposals need to address that explicitly. Unknown producer, unknown original reason, untrusted timestamp, and incomplete membership must not become invented certainty in `record.json`.

Legacy stamps can also still be changing while an old writer runs. Verifying a listing and then purging the whole source directory can remove files that arrived after that listing.

**Required fixture:** partially changed multi-file saves, a failed legacy run, equal timestamps from different devices, and a late legacy write during import. Preserve every imported source byte, but do not offer an incoherent combination as a restorable unit.

### 5. “Per-file atomic” is not “coherent unit”

Several interruption arguments reduce the cloud head to “old or new.” #22 A8 explicitly exists because a publication can stop after one member.

The correct property is not that the entire cloud unit is always atomically old or new. It is that incomplete units remain held, retained candidates are coherent, and no reader installs a mixed set. A retention operation can itself copy members across a concurrent head change unless it verifies the expected complete member set.

**Required fixture:** interleave publications and retention member-by-member, including a state/PNG pair and a directory save. Then restart another device offline after a cut local install. A complete local unit must exist before launch, as A7 requires.

### 6. Metadata can conceal mass absence or bypass setup guards

`claude-analysis.md` correctly notices that history and a README can make a raw listing nonempty. Its filtered-listing remedy is incomplete: D-CLOUD-031’s manifests remain included under `savestates/.rocknix/`.

A cloud containing only manifests, history, and documentation can still have no live saves. Similarly, writing a README before validating the configured root could create a misspelled destination and defeat the missing-folder safeguards in D-CLOUD-085/091/092.

**Required revision:** base mass-absence protection on the relevant live save units, not arbitrary listed objects, and validate the destination before writing housekeeping metadata.

### 7. Killing the parent does not prove every writer stopped

`kimi-analysis.md` identifies orphaned rclone collisions, but the consequence extends beyond history names. D-CLOUD-093 deliberately permits an orphan to outlive the lock holder. Such a process could complete a local restore rename while a new run or game begins.

A server-side operation may also finish after the client loses its connection. “Process killed” and “remote operation aborted” are distinct facts.

**Required fixture:** pause immediately before a local rename, kill only the lock-owning parent, begin a new launch or reconciliation, and then release the old child. Test late remote completion separately.

The final lifecycle contract must satisfy both D-CLOUD-076’s bounded cancellation and A7’s complete-before-launch requirement. Neither follows merely from adding an operation ID.

---

## Time-to-play and validation revisions common to all four analyses

The seconds need an **operation ledger**, not the phrase “one extra small transfer”:

1. Obtain fresh head evidence.
2. Preserve the relevant old bytes.
3. Verify those bytes.
4. Write and positively verify the record before replacement.
5. Publish and verify the new head.
6. Advance agreement.
7. Run eligible housekeeping separately.

Some checks may be supplied by proven transfer behavior or batching. They cannot be omitted or moved across the ordering boundary without evidence.

For illustration only, at an effective 20 Mbit/s in each direction, retaining a 5 MiB file by download-and-upload takes approximately **4.2 seconds of payload transfer alone**. That excludes request latency, process startup, records, verification, and the new publication. Server-side copy has a different cost model; capability discovery and measurement must decide which model applies.

`claude-analysis.md` and `kimi-analysis.md` correctly note that longer automatic runs raise cancellation probability. But “the same cancellation ceiling” does not prove unchanged measured time to first frame: more launches can now incur that ceiling, and capture, local healing, or recovery can add work.

Record both latency distributions and cloud freshness/completion rates. Otherwise a fast launch achieved by cancelling every backup can appear to satisfy #135 while providing little actual protection.  
**Sources:** `repo/rules/time-to-play.md`; `issues/135.md`; D-CLOUD-046, D-CLOUD-076, D-CLOUD-098.

For testing, use the VM pair and #133’s self-hosted and non-Dropbox QA matrix. Provider copy, hash, pagination, filter, and rename behavior must be tested on the instantiated backend, not inferred solely from its protocol name. The dedicated handheld remains undecided under D-QA-016; nothing here authorizes owner-device or owner-account testing.  
**Sources:** `issues/131.md`; `issues/133.md`; D-QA-007/015/017.

Finally, preserve register precedence:

- D-CLOUD-095 already settles the new location. Clarify the partial supersession of D-CLOUD-042 without reopening its unrelated split-root clause.
- The delta cannot call D-CLOUD-047 unchanged while replacing its deletion-retention mechanism.
- Copy instead of the wizard’s cloud-loser move refines D-CLOUD-041’s mechanics.
- Exit-time local healing must be reconciled with D-CLOUD-046/R5.
- Do not reintroduce #22’s stale automatic-launch refusal or old script sentinel values over D-CLOUD-074/076.
- `claude-analysis.md` correctly catches the submenu-label rule: a multi-action history settings page needs a verb-bearing entry under the embedded UI rules, not an unexplained exception for “SAVE HISTORY.” Update the map with the implementation.  
  **Sources:** `repo/docs/save-history-plan-delta.md`; `repo/docs/decision-register-excerpt.md`; `repo/docs/es-menu-map.md`; `repo/rules/es-native-ui-excerpt.md`.

## Gaps to surface to the orchestrator

Before the authors claim the relevant questions are settled, obtain:

- #21’s unit table and capture-stage lifetime/recovery contract;
- the referenced save-manifest schema and conflict-wizard IA;
- complete backup/restore scripts and the actual MATCH/launch call paths;
- the full upgrade and engineering rules referenced by the commission;
- supported-rclone command traces, backend capability evidence, and actual retention timing measurements.

The corpus provides enough evidence to reject the incorrect guarantees above. It does not provide enough to invent those missing implementation details.

---

## `corpus.provenance.json`

The arrays correspond positionally. This is provenance data, not implementation code.

```json
{
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
  "provenance_basis": "Embedded source contents and the Facilitator's sha256 values, verified at embed time. No filesystem access, independent re-reading, re-hashing, or experiments were performed.",
  "manifest_read_timestamp_utc": "2026-09-11T19:31:42Z",
  "corpus_gaps": [
    "The complete backup and restore scripts and the actual MATCH and launch implementations were not embedded.",
    "Issue #21, its unit table, and the capture-stage lifetime and recovery specification were not embedded.",
    "The save-manifest schema and conflict-wizard IA referenced by the supplied issues were not embedded.",
    "The full upgrade-and-install and engineering-practices rules referenced by the commission were not embedded.",
    "No proposed-history implementation traces, backend capability measurements, or measured retain-before-publish latency results were embedded."
  ],
  "peer_analysis_note": "The four injected analyses were reviewed as proposals. No source-file hashes were supplied for them, and none have been fabricated."
}
```