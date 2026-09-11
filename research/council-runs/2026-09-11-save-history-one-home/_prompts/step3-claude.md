# Council — Step 3: revised approach

You are one of five council members. In Step 1 you judged the delta to the
conflict-resolution plan of record -- one hidden history store for the earlier
versions of a player's saves (the commission, `00-problem-statement.md`). In Step 2 the other four
reviewed your analysis, and you reviewed theirs. The corpus is embedded above
again, unchanged and hash-verified; the peer reviews of your work and of the
others' are injected below.

Now produce **your revised approach**: the delta you would actually apply to the
plan of record -- endorsing, amending or replacing each row of
`save-history-plan-delta.md` -- having heard the critique. This is the artifact the council votes on in Step 4,
so it must stand on its own — a reader should be able to act on it without
having read your Step 1 or any review.

## Anti-self-citation constraint

Reason about the substance on its merits, against the embedded corpus. Do not
treat the injected reviews as evidence about how councils, models, or this
deliberation behave.

## What the revision must do

- **Concede what was refuted.** Where a reviewer showed a claim of yours was
  wrong — a misread function, an unsupported assertion about rclone, a
  recommendation whose consequence you had not traced — say so plainly, name
  the reviewer and the file, and correct it. A revision that quietly drops a
  refuted claim is worse than one that owns it.
- **Defend what you still hold.** Where a critique missed or misread your
  argument, say so and make the argument better. Do not concede to be
  agreeable; the council's value is in genuine disagreement being resolved on
  evidence, not averaged away.
- **Adopt what others got right.** Where another member found something you
  did not, take it and credit them by filename. You are not scored on
  originality.
- **Separate the load-bearing from the optional.** Your revision should make
  clear which parts of it are the foundation (get these wrong and a player loses a
  save, or waits for us before a game) and which are refinements that could follow later.
- **State decision changes explicitly.** If your approach requires reopening a
  decided register row, name the ID, state the change as a new refinement
  citing the old row, and give the argument. If your approach needs no
  reopening, say that too.
- **Be honest about what is still unmeasured.** Where your approach rests on a
  hypothesis about rclone, bisync, RetroArch, a backend or the hardware, mark
  it and name the experiment that settles it.

Refer to members and artifacts by filename (for example `gpt-analysis.md`,
`kimi_peer_review.md`), never by an invented ordinal.

## Injected peer reviews

=== START gemini_peer_review.md ===

Here is my review of the three injected analyses, evaluated against the embedded corpus.

### 1. Testing Claims Against the Corpus

**`claude-analysis.md`**
*   **Claim:** The count bound is keyed to the unit, meaning auto-states will evict manual states. 
    *   *Verdict: True.* Source 11 (R4) defines identity as "*L* = this device's hash set for the unit" and R9 defines "unit = game + kind". Since auto-states and manual states are both "states" for the same game, they share a unit. A count of 3 will indeed allow auto-states (which churn on every exit) to evict manual states.
*   **Claim:** D-CLOUD-100's auto-heal cannot fetch the good copy on the exit path because R5 forbids it.
    *   *Verdict: True.* Source 11 (R5) explicitly states the exit push is "to-the-cloud only... No fetches, no ICMP, no probes on this path." D-CLOUD-100 requires the good copy to be "restored" (fetched). These two directives are in direct conflict.

**`gpt-analysis.md`**
*   **Claim:** The three bounds (count, age, size) and "never the only copy" cannot all be unconditional.
    *   *Verdict: True.* This is a mathematically sound deduction. If a player has 300 games with 1 MiB saves, the total is 300 MiB. The 256 MiB cap (D-CLOUD-096) demands pruning, but the "never the only copy" rule forbids it. 
*   **Claim:** The old store's record is explicitly for "finalized, coherent wizard losers."
    *   *Verdict: True.* Source 11 (R9) explicitly states: "The store counts finalized, coherent wizard losers only... Propagated deletions, compactions and one-way transfers are not retained here."

**`mistral-analysis.md`**
*   **Claim:** The `copyto` operation is a "cloud-to-cloud copy (no device upload)" and costs no device bandwidth.
    *   *Verdict: False.* Source 17 (D-QA-017) mandates support for self-hosted backends including SFTP and SMB. As `kimi-analysis.md` correctly infers, rclone cannot perform server-side copies on these protocols; the data must stream down to the handheld and back up.
*   **Claim:** The `copyto` happens "after the game has started (D-CLOUD-076) or after the sync card has said the player may go (D-CLOUD-038)."
    *   *Verdict: False.* Source 4 (D-CLOUD-038) explicitly states that a sync "gates game launch." The player waits on the card *before* the game starts. 

### 2. Separating Established Facts from Assertions

*   **rclone overlap and sync behavior:** `claude-analysis.md` and `kimi-analysis.md` assert that rclone `sync` will not delete excluded files unless `--delete-excluded` is passed, and that `copy` does not check for source/destination overlap. These are assertions based on external tool knowledge. They are highly likely to be true, but both authors correctly identify that they require VM verification.
*   **The TOCTOU (Time-Of-Check to Time-Of-Use) Race:** `gpt-analysis.md` asserts that even with retain-before-publish, a concurrent publisher can overwrite a version without retaining it. (Device A and B both retain H0; A publishes HA; B publishes HB. HA is destroyed without being retained). This is an assertion based on distributed systems logic, not explicitly detailed in the corpus, but it is undeniably correct because the transfer lock `L_T` is device-local (Source 11, R6), not a remote mutex.
*   **Network Latency Estimates:** All three analyses estimate the time cost of the extra `copyto` operation. These are inferences. `mistral-analysis.md` assumes 1-2 seconds based on Dropbox, while `claude-analysis.md` and `kimi-analysis.md` correctly assert that hashless/streaming backends (SFTP/SMB) will take significantly longer, especially for large PPSSPP states.

### 3. Strongest and Weakest Arguments

**`claude-analysis.md`**
*   **Strongest:** The identification of the R5 (no fetches on exit) vs. D-CLOUD-100 (auto-heal restore) contradiction, and the proposed fix to heal from the local capture stage. This perfectly resolves the conflict without violating the time-to-play budget.
*   **Weakest:** The recommendation to outright *drop* the 90-day age cap because clocks are untrusted. D-CLOUD-096 explicitly requests an age cap. Outright dropping it violates a maintainer constraint. `gpt-analysis.md`'s approach (establishing a strict priority order for bounds) is a much better way to handle the contradiction.

**`gpt-analysis.md`**
*   **Strongest:** The identification of the concurrent-publisher TOCTOU race. `claude-analysis.md` attempted to fix this by checking the hash *after* the copy, but `gpt-analysis.md` correctly realizes that a race window still exists between that check and the final publish. The requirement for "candidate escrow" (retaining the publish candidate *before* modifying the shared head) is the only mathematically safe solution.
*   **Weakest:** The insistence on keeping the `.snapshots` exclusion guard. Source 2 explicitly states the `.snapshots` rule is dropped, and Source 13 confirms "no local snapshots". Defending a deprecated guard distracts from the actual namespace protection needed for `.history/`.

**`mistral-analysis.md`**
*   **Strongest:** The concrete migration mapping. Moving `-replaced/` to `.history/` and synthesizing the `record.json` using `reason: replaced` is a highly practical application of the "read both, write the new one" rule.
*   **Weakest:** The recommendation to *ignore* the local `.cache/cloud_sync/replaced/` folder during migration. Source 3 explicitly states this folder holds "the device copy a restore overwrote." Ignoring it guarantees the loss of any unpublished local saves that were overwritten by a restore, directly violating the commission's "no earlier version is lost" rule.

### 4. Missed Failure Modes

*   **The Intentional Erasure Loop:** If a player intentionally erases their save in-game (resulting in a 0-byte file), D-CLOUD-100's auto-heal will silently restore the old cloud copy. The player will delete it again, and the system will heal it again, trapping the player in an infinite loop. `gpt-analysis.md` briefly touches on this ("Restore loops back into auto-heal"), but none of the analyses provide the necessary mechanical fix: a "sticky divergent" state that forces the wizard to ask the player what they actually want to do.
*   **`--delete-excluded` Wiping History:** `kimi-analysis.md` is the only one to catch this. If any legacy script or user configuration passes `--delete-excluded` to rclone, the `- /.history/**` rule will cause rclone to actively delete the history store from the cloud. 

### 5. Concrete Revisions for Step 3

**For `claude-analysis.md`:**
1.  Do not drop the 90-day age cap. Instead, adopt `gpt-analysis.md`'s priority ordering for bounds (e.g., "never the only copy" > count > age > size) to handle the mathematical contradictions.
2.  Acknowledge `gpt-analysis.md`'s TOCTOU race. Your "hash from the copy" fix narrows the race window but does not close it. Adopt the "candidate escrow" concept: the device must upload its *new* save to `.history/` as a pending candidate before it overwrites the live head.

**For `gpt-analysis.md`:**
1.  Adopt `claude-analysis.md`'s brilliant "count per file" fix. You correctly noted that auto-states shouldn't consume the battery-save allowance, but your solution requires complex UI/logic exceptions. Claude's fix (applying the count to the *file path* rather than the *unit*) solves it instantly without reopening D-CLOUD-099.
2.  Revise your migration strategy to explicitly include the local `.cache/cloud_sync/replaced/` folder, as `claude-analysis.md` and `kimi-analysis.md` did.
3.  Drop the defense of the `.snapshots` guard; the corpus has already retired it.

**For `mistral-analysis.md`:**
1.  Correct your assumption that `copyto` is always a zero-bandwidth server-side operation. You must account for the SFTP/SMB backends (D-QA-017) which will stream the data through the handheld, impacting the time-to-play budget.
2.  Correct your reading of D-CLOUD-038. Sync *gates* launch; it does not happen in the background after the game starts.
3.  Do not ignore the local `.cache/cloud_sync/replaced/` folder during migration. You must fold it into `.history/` to prevent data loss.
4.  Do not reopen D-CLOUD-099 (auto-states). Instead, adopt `claude-analysis.md`'s "count per file" logic to prevent auto-states from evicting manual saves.

=== END gemini_peer_review.md ===

=== START gpt_peer_review.md ===

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

=== END gpt_peer_review.md ===

=== START kimi_peer_review.md ===

# Council Step 2 — peer review of the four Step 1 analyses

*Seat review. Every claim below was tested against the embedded corpus only; I cite sources by their declared paths. Where a member's claim rests on knowledge outside the corpus (rclone internals, backend capabilities), I say whether they labelled it as such. I did not re-read or re-hash anything; the Facilitator's embed-time sha256 values are recorded in the provenance block at the end.*

**Headline judgments, argued below:**

1. `gpt-analysis.md` contains the single most important finding of the round — the concurrent-publisher counterexample — and it defeats the one genuinely weak claim in `claude-analysis.md` (that the hash-from-copy check closes the two-device race). The two analyses are complementary, not competing; the delta needs both.
2. `claude-analysis.md` is the most corpus-faithful of the four and its per-file count-keying finding (§1.2) is the best-diagnosed defect in the delta. Its concurrency section overclaims.
3. `gemini-analysis.md` is thin but contributes one amendment nobody else made (retain-before-install) and one real hazard (clock skew) — then wastes both by not developing them. Its migration section loses data and must be rewritten.
4. `mistral-analysis.md` contains a fabricated measurement presented as fact, a misattributed allowlist rule, a verification standard that contradicts R4, and a migration that destroys unique local copies. It needs the most revision.

---

## 1. `claude-analysis.md`

### Claims checked against the corpus

**Hold:**

- *"The shipped rules restore `.history/<unit>/<seq>/Zelda.srm` to a device today (the members match `+ /**/*.srm`; `record.json` and PNGs do not)."* — Verified against `repo/code/cloud_sync-rules.txt`. The includes `+ /**/*.srm`, `+ /**/*.state*`, `+ /**/*.sav` etc. match at any depth; `.json` and `.png` match no include and fall to the trailing `- /**`. The conclusion is correct, and it is the round's most important shipped-code fact: **the store is unsafe under the shipped allowlist**, in both directions (restore to device; sync-mode deletion into `-replaced/`, which `repo/code/cloud_backup-set-aside-excerpt.md` confirms — "anything replaced (or, in sync mode, removed) in the cloud goes to ${replaced_root}" — and which `prune_replaced_remote` then reduces to one run). The proposed remedy (ship `- /.history/**` one image early, as a guard with no writer, per the `.snapshots` precedent in `issues/25.md`) does not reopen D-CLOUD-097, which is about widening `-replaced/` retention, not about filter rules. This is the strongest safety argument in any of the four analyses.
- *The delta lists D-CLOUD-047 as unchanged while changing it.* — Verified. The delta's "What does not change" names "publications and retirements (D-CLOUD-047)"; D-CLOUD-047 says "Propagated deletions and compactions are not retained as discarded saves; … the cloud's `-replaced/` sibling is their record"; the delta's `reason: deleted` retains deletions and retires `-replaced/`. A real contradiction the delta's own text misses. `gpt-analysis.md` catches the same thing ("Reopen D-CLOUD-047's retention exclusions").
- *D-CLOUD-095 does not cite D-CLOUD-042.* — Verified against the register. `gpt-analysis.md` states the sharper version: D-CLOUD-042 has two clauses (the folder name; the legacy split-root refusal), and only the first is superseded. Claude should adopt that framing.
- *R5 forbids fetches on the exit path, so D-CLOUD-100's "restored" cannot happen at exit.* — Verified: `issues/22.md` R5: "It is **to-the-cloud only** … No fetches, no ICMP, no probes on this path." D-CLOUD-100: "the cloud's good copy is kept and restored." This is an internal contradiction in the plan of record as amended, and only this analysis and `gpt-analysis.md` ("The exit pass can flag and defer recovery; it must not silently become a download/install pass") engage with it. Claude's staged sequence (torn save → relaunch → fresh game written → published as "this device changed" → good copy retained but the player holds a blank game) is correctly constructed and correctly attributed to D-CLOUD-076 (launch cancels the boot sync that would have healed).
- *The count bound is keyed to the unit; auto-state churn evicts manual-slot history.* — Verified as far as the corpus goes: R4 defines *L* as "this device's hash set for the unit"; R9 says "unit = game + kind"; D-CLOUD-030 makes slot an attribute, not identity. Given those, one game's states are one unit, and a per-unit count of 3 lets three exits of auto-state churn evict the manual slot's retained version — the exact case D-CLOUD-099 was decided to protect. Claude flags the one unverifiable premise honestly ("if the unit table in #21 already keys states per slot, this amendment is a no-op"; #21 is not embedded). The fix (count per (unit, member path)) also matches the player-facing label VERSIONS KEPT PER SAVE better than the mechanism it amends. This is the best-diagnosed defect of the round.
- *`prune_replaced_remote` skips `--recent` runs; D-CLOUD-083 restored ten low-level retries; the maintainer has two devices.* — All verified against the register and the excerpts.
- The rclone recollections (overlap-check behaviour of `copy` vs `sync`/`move`, excluded-destination treatment under `sync`, modtime preservation, per-backend server-side copy) are **labelled as recollection with named VM experiments**. This is exactly the discipline the brief asks for, and the other three members do it inconsistently or not at all.

**Fails / overclaims:**

- *"Both retain H0, both publish. Covered in §1.3: with the hash taken from the copy, the second device sees the head no longer equals A and does not publish … Either way no version is lost."* — **Refuted by `gpt-analysis.md`'s counterexample.** Claude's check compares the retained copy's hash to *A* between the retain and the publish. Two devices can both pass that check while the head is still H0, then both publish; the second publish overwrites the first **without retaining it**. The check narrows the window; it cannot close it, because the check and the publish are not atomic — and GPT says exactly this ("Another head check merely moves the race window"). Worse, GPT's follow-on is real: if the first publisher's correspondence check completes before the overwrite, agreement advances to HA; the next pass then classifies "the cloud changed" and fetches HB over the local HA, and #22's negative scope ("no preimages of one-way fetches") means nothing retains HA anywhere. "No version is lost" is false in that window. Claude must adopt GPT's counterexample and either accept the escrow cost, accept Gemini's retain-before-install as the backstop, or explicitly record the residual as accepted — but may not claim closure.

### Strongest argument
§1.2 (per-file count keying), with §1.4 (heal-from-the-stage mechanics) and §1.5 (ship the exclusion rule early) close behind. Each is corpus-derived, each names its experiment, and each amends rather than reopens.

### Weakest argument
The concurrency closure claim (§2.2/§1.3), for the reason above. Second-weakest: dropping the 90-day age cap is well-argued (untrusted clocks are corpus evidence — `issues/23.md` carries `clock_synced: false`), but the recommendation should present the trust-gated sweep as the primary alternative and the drop as the fallback, since it reopens a clause of D-CLOUD-096 and the maintainer approved that number four days ago.

### Concrete revisions for Step 3
1. Replace §2.2's "Covered in §1.3" with GPT's counterexample and a three-option treatment (escrow / retain-before-install backstop / accepted residual), recommending one.
2. Add the ordering rule that the own-manifest witness (R7, I2) must run **before** any retain, or a cloned card writes store entries for a publish it will refuse — a point no member made.
3. Extend the audit requirement: #23 mandates an audit line per discard before the apply; the delta needs the same for routine retains and prunes, or the store's mutations have no lineage (D-CLOUD-027).
4. State the soft-cap semantics explicitly: pruning and the size sweep run on full passes only, so an exit-only device overshoots count and the 256 MiB cap between full passes. The README and the settings page must not promise a hard ceiling.
5. Note the startup-sync cost symmetric to §3: the boot pass's backup half now retains too, lengthening it and raising the probability a launch cancels it (D-CLOUD-076/072). Only the exit path is quantified.

---

## 2. `gemini-analysis.md`

### Claims checked against the corpus

**Holds, partially:**

- *"On self-hosted backends like SFTP or WebDAV, rclone may not support server-side copy and will silently fall back to downloading and re-uploading."* — Directionally correct for SFTP, but asserted without the "hypothesis" label Claude gives the same class of claim, and WebDAV is server-dependent (GPT states the correct distinction: "Copy efficiency and verifiability are separate"). The experiment Gemini names (measure traffic on the SFTP QA backend) is the right one; `issues/133.md` makes that backend available.
- *The clock-skew hazard.* — Real and corpus-grounded: R9's seq is `<decided_at, UTC compact>-<device id>`, and #23 already carries `clock_synced: false` because handheld clocks are not trusted. A 1970-clock device's brand-new entry sorts oldest and is pruned first. But Gemini stops at the hazard; Claude (drop or trust-gate the age cap) and GPT (timestamps are display, never correctness ordering) each supply the mitigation Gemini lacks. Gemini's find is a good premise with no conclusion.
- *The README falls through to the trailing `- /**` and does not sync to the device.* — Correct against `repo/code/cloud_sync-rules.txt`.

**Fails:**

- *"The allowlist (`repo/code/cloud_sync-rules.txt`) excludes `- /.history/**`."* — **False as written.** The shipped file contains no such rule; that rule is the delta's *proposal*. The distinction is the entire hazard: under the shipped rules, `.history` members matching `+ /**/*.srm` are restored to devices and, in sync mode, deleted from the cloud into `-replaced/` (Claude's §1.5, verified above). Gemini's phrasing treats the delta as already shipped and thereby misses the pre-R1 exposure window that motivates Claude's ship-the-rule-early amendment.
- *"If they launch the same game, EmulationStation checks `L_T` and `L_S`, and will refuse the launch if the reconciler holds `L_S` (D-CLOUD-053)."* — Garbled twice over. Per R6, ES takes `L_S` itself before the pre-launch renames, then checks `L_T`; the reconciler holds `L_S` only in sub-100-ms batches. And per D-CLOUD-076 (2026-09-10), a launch **cancels** an automatic sync in any phase; refusal applies only to a player-started sync. Gemini's model is stale relative to D-CLOUD-076 — the same staleness GPT correctly identifies in #22's own text.
- *The migration section ("Age out").* — This is the weakest migration of the four and it fails the commission's own rule ("no earlier version is lost"). Leaving `Saves-replaced/` in place "until the user deletes them or the 90-day age cap sweeps them" loses the bytes twice over: old-image devices prune the folder to one run (`prune_replaced_remote`), and the age cap as specified governs the store, not the legacy sibling — Gemini's own proposal is incoherent on its face. "Until the user deletes them" asks the player a question about internals, which the commission names a failure mode. And amending #25 to read `.cache/cloud_sync/replaced/` is impossible for any device but the one holding it — that cache is local by construction. Claude and GPT both show the only acceptable shape: fold, verify, then delete, with a grace period.
- The `L_S` recommendation ("read the captured save into staging, release `L_S`, then do the network work") is already the design — R6 holds `L_S` in brief per-unit batches. Gemini presents a plan-of-record property as a new requirement.

### Strongest argument
The **retain-before-install** amendment: "The reconciler must also perform retain-before-install for any fetch or restore that overwrites a local save, pushing the local loser to the cloud `.history/` store before overwriting it locally." Gemini's stated rationale is mostly redundant — for a routine fetch the local loser equals the old head, which the publisher's retain-before-publish already stored — but the amendment becomes load-bearing precisely in GPT's race follow-on, where the local loser (HA) was a head that nobody retained. It is the missing second half of the delta's publish-only retention, and Gemini is the only member who stated it.

### Weakest argument
The migration "age out," for the reasons above.

### Concrete revisions for Step 3
1. Rewrite migration wholesale: fold `-replaced/` into `.history/` with synthesized records, verify before deleting, upload unique local-cache bytes (the manual RESTORE row passes no `--update` — `repo/code/cloud_restore-set-aside-excerpt.md` — so some of those local copies exist nowhere else, as Claude notes), and take GPT's grace period.
2. Correct the launch-gate description per D-CLOUD-076 and R6.
3. Label backend-capability claims as hypotheses with the VM experiment attached (Claude's discipline).
4. Convert the clock hazard into a position on the age cap, or hand it to Claude's amendment explicitly.
5. State the retain-before-install amendment against the concrete scenario that needs it (GPT's follow-on), not the redundant one.

---

## 3. `gpt-analysis.md`

### Claims checked against the corpus

**Hold:**

- *"#22 still contains launch-refusal and exit-code language superseded by D-CLOUD-074, D-CLOUD-076, and D-CLOUD-098."* — Verified and uniquely caught. #22 R10 specifies outcomes "3 lock held · 4 no route"; D-CLOUD-074 moved the sentinels to 75/69 precisely because "rclone's codes run 1-9." #22 R6's launch *refusal* predates D-CLOUD-076's launch-*cancels*-automatic-syncs. Since the delta says "Everything not named here stays as #21–#25 … have it," these stale clauses ride along unless named. This matters and no other member saw it.
- *R9 flattens members to basenames; a multi-directory unit with two same-named files collides.* — Verified: R9 stores "the loser's members at their basenames." PPSSPP directory units are the corpus's own multi-file case. Unique to this analysis.
- *The old store counts "finalized, coherent wizard losers only," a materially narrower contract than the unified store.* — Verified verbatim from R9.
- *The four bounds are jointly unsatisfiable* (300 games × 1 MiB of only-copies vs 256 MiB). — Correct logic, and the priority ordering (transaction material → only usable copy → latest deliberate loser → count/age/size oldest-first) is the cleanest resolution offered. Claude's "never the only copy" definition handles the per-file case; GPT's handles the aggregate. GPT's is more complete.
- *D-CLOUD-095 supersedes only D-CLOUD-042's location clause.* — Correct nuance; sharper than Claude's treatment of the same row.
- *The concurrent-publisher counterexample.* — Constructed correctly and, as argued above, decisive against both the delta's sufficiency and Claude's closure claim. The follow-on (agreement advanced → "cloud changed" fetch overwrites the local loser with no preimage, against #22's "no preimages of one-way fetches" negative scope) is the loss that converts a near-miss into actual data loss. The framing the maintainer needs — **recoverable concurrency vs serializable head selection** — is exactly right, and it is the honest way to present a possible D-CLOUD-052 reopening.
- The migration treatment (copy-not-move, verify before removing, preserve unclassified files, the import grace period against the 90-day cap, mixed-version boundary as a release gate rather than a log line) is the most rigorous of the four. The grace-period point — import a 100-day-old version and the age cap deletes it immediately — is a genuine catch nobody else made.

**Fails / overclaims:**

- *The candidate-escrow fix is never reconciled with the bounds.* Escrowing every publish candidate roughly doubles store writes and churns the very count cap this analysis wants to prioritize; GPT gestures ("costs additional writes and protected storage") and later scopes it ("at minimum, the latest candidate per publishing device/unit"), but the two passages never meet. As written, the strongest finding has the least-costed remedy.
- *"'Discarded saves were not kept' is false if that operation retained a mandatory recovery copy."* — Over-lawyered. Transaction staging (`pending-publish.json`, the stage) exists regardless of the history switch and is not "kept discarded saves" in any vocabulary the player has. The real point underneath — the switch's semantics are unspecified under universal retain-before-publish (does OFF disable replacement retention? does it conflict with D-CLOUD-100's mandatory suspect retention?) — is genuine and worth keeping; the footer argument should be dropped.
- The D-CLOUD-052 reopen is named but the argument for it is only sketched. The commission's bar is "cite its ID and give the argument that should reopen it"; "recoverable vs serializable" is the right frame, but Step 3 needs it stated in one paragraph with the cost test (D-CLOUD-034) applied, or the reopen will read as casual given how decisively Gate 11 settled the transport.

### Strongest argument
The concurrent-publisher counterexample — the only finding in the round that is a *proof* rather than an assessment, and the one that most changes what the delta must say.

### Weakest argument
The uncosted escrow, followed by the footer quibble.

### Concrete revisions for Step 3
1. Cost the escrow against the caps: scope it to the latest candidate per (device, unit), state its interaction with the per-file count, and say what prunes it and when.
2. Write the D-CLOUD-052 reopening argument in full or downgrade it to "recoverable concurrency accepted as a residual" — one of the two, explicitly.
3. Drop the footer argument; keep the switch-semantics gap (which is real and which the delta must specify: OFF disables future optional history, never purges, and does not cover mandatory transaction/suspect retention).
4. Adopt Claude's per-file keying as the concrete mechanism for priority 3 (protecting the deliberate loser from churn) — the two proposals are the same idea at different altitudes.

---

## 4. `mistral-analysis.md`

### Claims checked against the corpus

**Fails — and these are the kind of confidently wrong claims the brief asks reviewers to catch:**

- *"~1–2 s per replaced save on a handheld's Wi-Fi (**measured on the RG35XX SP against Dropbox**)."* — **There is no such measurement in the corpus.** D-CLOUD-046 says the exit-path "Numbers are filled in from Gate 4, not chosen"; #135 says budgets are "to propose after a first measurement"; D-QA-015 exists precisely because an unannounced device run happened once and was ruled a serious breach. Presenting an estimate as a completed device measurement is the single worst claim in any of the four analyses, and it must be withdrawn or replaced with the VM measurement (#135's `time-to-play` cell, which `issues/135.md` says can run on the VM).
- *"This is a stricter version of the existing guard for `.snapshots/` (SOURCE 10, `cloud_sync-rules.txt`)."* — **Misattributed.** SOURCE 10 contains no `.snapshots` rule; that rule exists only in #22 R2's *planned* reconciler arguments ("a guard with no writer"). The shipped allowlist is exactly the problem — it guards nothing against `.history`.
- *"The reconciler must fall back to size + mtime for hashless backends when verifying `.history/` entries."* — **Contradicts the plan of record.** R4 specifies "hashless backends by size + sha256 after fetch"; D-CLOUD-046 specifies "size plus a capped re-fetch." Mtime is the thing `--ignore-times` exists to distrust (R2). This amendment would weaken verification below the standard the plan already set.
- *"Nine kept versions of one game … ~700 KB of auto-states, leaving little room for game saves under the 256 MiB cap."* — The arithmetic refutes the conclusion: 700 KB is roughly 0.3% of 256 MiB, and D-CLOUD-036 already computed "nine kept resolutions of one game stay under a megabyte." The churn problem is real (Claude's §1.2 is the correct diagnosis) but it is a **per-unit keying** problem, not an aggregate-size problem, and the fix is per-file counting — not reopening D-CLOUD-099, a decision the maintainer made four days ago with the accidental-overwrite rationale stated. Mistral's own hedge ("if the maintainer's D-CLOUD-099 decision is reversed") admits the weakness.
- *Migration: "The reconciler ignores this folder … left untouched until the next settings restore, which will overwrite it."* — **Fabricated mechanism and data loss.** Nothing in the corpus says a settings restore touches `/storage/.cache/cloud_sync/replaced/`; and because the manual RESTORE row passes no `--update` (verified in `repo/code/cloud_restore-set-aside-excerpt.md`), some of those local copies are the newest version of a save that exists nowhere else. Ignoring them loses exactly the data the commission's migration rule exists to protect.
- *"The second publish detects the first's `record.json` and refuses to overwrite it."* — Invented mechanics. The plan's actual mechanisms are the own-manifest witness (R7: `duplicate-device-id` refusal, which fires before any publish and makes Mistral's cloned-card experiment moot) and the classifier. The real two-device race is GPT's, and it is not solved by record detection.
- *The pruning amendment ("if the head matches the version being pruned, the prune fails").* — Confused: a history entry equal to the head is a redundant copy of live bytes; evicting it is harmless. The correct rule (Claude's) is: never evict the newest history entry of a file whose unit has no live member in the head. Mistral's version would permanently pin every entry created by a restore-from-history.
- The pseudocode block violates the commission's output shape ("No code").

**Holds:**

- The auto-state churn observation itself (the diagnosis is wrong; the symptom is real).
- The audit-log suggestion for auto-heal — worth generalizing to all store mutations (see my revisions to Claude).
- The allowlist placement instinct (ahead of includes) is directionally right though the stated position ("before `+ /savestates/**`") is muddled; the delta's "ahead of every include" is the correct general form, and the competing includes for root-level `.history` members are the extension rules, not `/savestates/**`.

### Strongest argument
The D-CLOUD-099 reopen attempt — not because it succeeds (Claude's per-file keying achieves the maintainer's stated intent without reopening a four-day-old decision), but because it is the only place Mistral engages with a real tension.

### Weakest argument
The fabricated measurement, because it corrupts the evidentiary basis every other section depends on; the migration, because it loses data.

### Concrete revisions for Step 3
1. Withdraw the "measured on the RG35XX SP" clause; replace with the VM experiment or a labelled estimate.
2. Replace the D-CLOUD-099 reopen with the per-file count amendment, or state explicitly why per-file counting fails to protect the manual slot.
3. Rewrite migration per Claude/GPT (fold, verify, grace, delete).
4. Drop "size + mtime"; cite R4's actual hashless standard.
5. Fix the prune rule to the newest-entry-per-file definition.
6. Remove the pseudocode.

---

## 5. Cross-cutting adjudications

**The count keying.** Claude's per-(unit, member path) amendment is correct and is the minimal change that makes D-CLOUD-099 true; GPT's priority ordering is the same insight at policy level and should cite it as the mechanism; Mistral's reopen of D-CLOUD-099 is unnecessary. The player-facing label (VERSIONS KEPT PER SAVE) already promises per-file semantics, so the amendment is also a documentation-accuracy fix.

**Concurrency.** GPT's counterexample stands unrefuted. The complete treatment synthesizes all four members: Claude's hash-from-copy check (cheap; narrows the window; keep it), Gemini's retain-before-install (closes the follow-on local loss), and GPT's escrow-or-accept decision (the only thing that addresses the head race itself) framed as recoverable-vs-serializable for the maintainer. The delta must state which it takes; "no version is lost" (Claude) and silence (the delta) are both unacceptable.

**The age cap.** Claude's drop-or-trust-gate is the best-supported position (untrusted clocks are corpus evidence, not hypothesis); GPT's priority pins are a viable alternative; Gemini found the hazard and stopped. The 90-day number was approved as a "starting point … to measure against" (D-CLOUD-096), so reopening its age clause with the clock argument is legitimate and should be presented with the trust-gated alternative.

**Migration.** Only the Claude/GPT shape (fold → verify → grace → delete; upload unique local-cache bytes; mixed-fleet ordering as a release gate) satisfies "no earlier version is lost … a prompt is a failure mode." Gemini's and Mistral's versions both fail it, in different ways.

**Auto-heal.** Claude's mechanics (heal from the stage first, sticky-divergent fallback, symmetric cloud-side check) and GPT's conservatism (format-validity gate, intentional-erase handling, no silent rollback of an authorized restore) are complementary amendments; neither alone is sufficient, and the plain endorsements (Gemini, Mistral) both miss the R5 no-fetches contradiction.

## 6. Failure modes every analysis missed or under-developed

Convergence here is a shared blind spot, not correctness:

1. **Witness-before-retain ordering.** R7's own-manifest witness refuses a cloned card's publish — but if the retain precedes the witness, a cloned card still writes store entries for a publish that will be refused. Nobody ordered the two.
2. **Audit lineage for routine retains and prunes.** #23 mandates an audit line per wizard discard before the apply; the delta's universal retains and the pruner's deletions have no equivalent requirement. The store is the player's last resort; its mutations need D-CLOUD-027 lineage. (Mistral's audit point covers auto-heal only.)
3. **The startup sync's backup half now retains too**, lengthening the boot sync and raising the probability a launch cancels it — symmetric to the exit cost Claude quantified, unexamined by all four.
4. **The auto-rule churns the store twice.** #23's divergent-`.state.auto` rule installs the cloud's auto as slot 4; that installation overwrites any existing slot 4, which under retain-before-publish creates a store entry — per divergence, in addition to the entries the delta already creates. Nobody modeled the interaction.
5. **Soft-cap semantics.** With pruning confined to full passes, an exit-only device overshoots both the count and the 256 MiB cap between full passes; the README and settings page must not promise a hard ceiling. Claude and GPT each touch the edge of this; nobody states it as a required disclosure.
6. **The wizard's pre-pass retains survive a quit.** #23: quitting discards decisions but "the pre-pass … has already happened and is not undone"; under the delta, the pre-pass's pushes retained first. Harmless, but the delta should say the entries exist and why.
7. **The delta never says when the allowlist rule ships.** Claude's ship-one-image-early amendment is the only treatment; it should be mandatory text in the delta, not a review finding, because the store is unsafe under the shipped rules from the first retain until R1 completes.

## 7. Where the other members changed my read

- GPT's counterexample changed my assessment of Claude's §1.3: I initially read the hash-from-copy amendment as closing the two-device race; it does not, and the follow-on through agreement advancement makes the residual a data-loss window, not a near-miss.
- Gemini's retain-before-install filled a gap I had accepted as covered; it is not covered for the race follow-on, and the delta's publish-only retention is asymmetric in a way the corpus does not justify.
- Claude's §1.2 changed my read of D-CLOUD-099: I had read the auto-state decision as settled coverage policy; keyed per unit, it is self-defeating, and the per-file amendment is the first thing I would write into the delta.

## Provenance (as embedded; not independently re-hashed)

All paths under `research/council-runs/2026-09-11-save-history-one-home/_sources/`, manifest read_timestamp_utc `2026-09-11T19:31:42Z`:

| path | sha256 (verified at embed time) |
| --- | --- |
| `00-problem-statement.md` | `f7d770768b3bf81985b7415b4d82f8ee9ef26965a98eb6c47c166f54db673b27` |
| `repo/docs/save-history-plan-delta.md` | `1d320545319eba2e8852d830d52f76ab3a417e48e365d01fe79231bade77da8b` |
| `repo/docs/save-history-gap-analysis.md` | `d1107b7e1790b8e8aab177411b96bb3828f69e389fbc8e33c36ce616f67105aa` |
| `repo/docs/decision-register-excerpt.md` | `46ccfb71ef85537639501c2973a5b02fd81b6d5772662608ead073b209ea2726` |
| `repo/docs/es-menu-map.md` | `6d7813f91e37510f5578f35adec3f9372ed34e1ce5d871fcc0f34e392b202911` |
| `repo/rules/time-to-play.md` | `97d2fbba79fa42f22def37e4ff90e18149fc9fbc216d255d091da3dc187075da` |
| `repo/rules/es-native-ui-excerpt.md` | `32be1ee4164c9d1f09e7a9e9c8c25f526e70802f75901e456097bdb5c02d46e4` |
| `repo/code/cloud_backup-set-aside-excerpt.md` | `e5b57d74b83046fc7ebf44b4129c68815a575b35553e938c2ae377c685852509` |
| `repo/code/cloud_restore-set-aside-excerpt.md` | `c0dacd8aa1eb1a4df2986447a853cc3c47b666b6234127e61783a151faa448bd` |
| `repo/code/cloud_sync-rules.txt` | `bdb7e18128ce4a604c9b02cfe5b0f10f4e3e4dfd3aa7e

=== END kimi_peer_review.md ===

=== START mistral_peer_review.md ===

I have reviewed the four analyses (`claude-analysis.md`, `gemini-analysis.md`, `gpt-analysis.md`, `kimi-analysis.md`) against the embedded corpus. My task is to identify the strongest and weakest arguments in each, name failure modes every analysis missed, and give concrete revisions each proposal should make.

---

## 1. Strongest and weakest arguments per analysis

### `claude-analysis.md`

**Strongest argument:**
The **count bound must be keyed to the save file, not the unit** (§1.2). This is the most valuable finding in the set: the plan of record's unit definition (a hash set) is correct for the classifier but wrong for retention, and the maintainer's own example (the accidental overwrite of a manual slot by auto-state churn) is the exact case that breaks under the unit key. The argument is checkable against the corpus (`issues/22.md` R4, R9; D-CLOUD-030) and is decisive.

**Weakest argument:**
The **clock skew hazard against the age cap** (§1.6) is overstated. The seq stamp is the *retaining device's* clock, but `record.json`'s `decided_at` is only for display, and rclone sets the destination's modtime from the source on copy — so the store entry's modtime is the *save's* mtime, not the device's. A device whose clock reads 2031 therefore does not sweep every entry as expired; it writes entries every other device evicts first, but the damage is bounded and the residual is small. The hazard exists, but the analysis treats it as a showstopper rather than a residual to state.

---

### `gemini-analysis.md`

**Strongest argument:**
The **concurrent-publisher counterexample** (§2.2) is the most important hazard named in the set. Two devices can both retain the same head, both publish, and the second publish overwrites the first without retaining it — a real lost version. The analysis is correct, and the counterexample is decisive: the delta's retain-before-publish alone is insufficient for recoverability under concurrency. The experiment it proposes (two VMs, forced simultaneous publishes) is the cheapest way to settle it.

**Weakest argument:**
The **clock skew hazard** (§2.6) is the same overstatement as Claude's, but Gemini goes further and proposes a mitigation (compare against server-side modtime) that is unnecessary. The hazard is real but bounded, and the mitigation adds complexity for a residual that is already small.

---

### `gpt-analysis.md`

**Strongest argument:**
The **namespace protection hazard** (§2.1) is the most valuable single insight in the set. The delta moves the store inside the sync root, where exclusion survives only as the rule `- /.history/**` — and the shipped allowlist includes patterns that match at any depth (`+ /**/*.srm`, `+ /**/*.state*`). An old-image sync-mode backup or MATCH deletes the store's members from the cloud, shredding save bytes while leaving orphans. The analysis is correct, and the hazard is real: the store's exclusion changes from *by construction* to *by rule*, and rules files are user-editable and old images persist in a fleet. The experiment it proposes (seed a cloud with README + `.history/`, run the shipped image's backup/restore/MATCH) is the cheapest way to settle it.

**Weakest argument:**
The **auto-heal heuristic** (§2.10) is over-scoped. The analysis argues that "uniform bytes are legitimate" and that the heuristic must be format-aware, but the corpus already frames the heuristic as a cheap sufficient form (D-CLOUD-034: "a correctness fix that costs complexity, CPU or memory has to earn it"). The delta's zero-length/all-one-byte test is the cheapest sufficient form, and a false positive is recoverable by construction (the suspect is retained). The analysis treats this as a correctness hazard rather than a residual to state.

---

### `kimi-analysis.md`

**Strongest argument:**
The **old-image hazard and its self-healing migration** (§1.1, §4) is the most elegant solution in the set. An old-image sync-mode backup or MATCH deletes the store's members from the cloud, but the migration's fold of `Saves-replaced/` is made *standing* and path-aware: members landing in `-replaced/<stamp>/.history/…` fold *back* to their original `<unit>/<seq>/`. The store then self-heals through the very mechanism that threatens it, with no name-mangling of members. The argument is correct, and the solution is decisive: it answers the namespace protection hazard without requiring a fleet-wide rule file upgrade.

**Weakest argument:**
The **same-device overlap hazard** (§2.3) is overstated. D-CLOUD-093's trade (an orphaned rclone no longer holds the lock) is deliberate and safe: the reconciler holds `L_T` itself post-R1, and a reconciler killed mid-pass leaves an orphaned rclone finishing a copyto — but the copyto is idempotent, and the next pass dedupes against the newest entry. The hazard exists, but the residual (a duplicate entry) is benign and the mitigation (adding a run id to the seq) is unnecessary.

---

## 2. Failure modes every analysis missed

### 2.1 The README's own exclusion

The delta adds `- /.history/**` to the allowlist, but the root `README.md` is not explicitly excluded. The shipped allowlist ends with `- /**`, so the README falls to that and is excluded — but if a user edits the file and removes the trailing `- /**`, the README becomes in scope for transfers. An old-image restore then copies the README down to `/storage/roms/README.md`, cluttering the device with a file the player was told was hidden. The hazard is real, and the fix is one line: add `- /README.md` explicitly ahead of every include.

**Experiment:** seed a cloud with `Saves/README.md`; run the shipped image's restore with a rules file lacking the trailing `- /**`; assert the README appears locally.

---

### 2.2 The `.rocknix/` manifest folder

The plan already has one hidden folder inside `Saves` that *must* sync: `savestates/.rocknix/manifest-<id>.json` (D-CLOUD-031). The delta adds one that *must not*. The outer README must declare both, and the allowlist must treat them oppositely. The hazard is real: the manifest folder matches `+ /savestates/**` and is restored to devices today. The fix is two lines: the README must name both folders, and the allowlist must keep `- /savestates/.rocknix/**` (it is not in the shipped file).

**Experiment:** seed a cloud with `Saves/savestates/.rocknix/manifest-<id>.json`; run the shipped image's restore; assert the manifest appears locally. Repeat with the amended rules; assert it does not.

---

### 2.3 The MATCH deletion path

The menu map calls MATCH THIS DEVICE TO THE CLOUD "the only action that deletes" (`repo/docs/es-menu-map.md`). The delta's `reason: deleted` retains deletions, but MATCH's deletions go through an explicit list (the preview page), not through the classifier. The retain step must run on MATCH's deletions too, or the store loses the very bytes it exists to protect. The hazard is real: MATCH is the one action that deletes, and the delta does not say it retains those deletions. The fix is one sentence: MATCH's deletions go to `.history/` with `reason: deleted` by copy-then-delete over its explicit list.

**Experiment:** seed a cloud with a save; run MATCH from a guest missing that save; assert the save is in `.history/` with a record, not gone.

---

### 2.4 The exit sync's admission ceiling

The delta's retain-before-publish adds bytes to the exit sync's admission ceiling (R4/R5). On backends without server-side copy (SFTP/SMB), the retain streams through the device: a 30 MB PPSSPP state costs 60 MB through the handheld's Wi-Fi. The ceiling must count retain bytes, or a unit that would have cleared the ceiling for the publish alone stalls the exit sync on the retain. The hazard is real: the delta's "one small extra transfer" is two to four spawns, and the ceiling must weigh them. The fix is one sentence: the ceiling counts retain bytes, and when a unit defers, both the retain and the publish defer.

**Experiment:** seed a 30 MB state; run an exit sync against SFTP with a tiny ceiling; assert the pair defers, not only the publish.

---

### 2.5 The auto-heal fetch's budget

D-CLOUD-100's "the cloud's good copy is kept and restored" requires a fetch, and the exit path is defined as push-only (D-CLOUD-046). The delta does not say how the fetch is bounded. The hazard is real: an unbounded fetch on the exit card violates D-CLOUD-098's time-to-play budget. The fix is one sentence: *one bounded fetch per suspect unit on the exit pass*. The fetch is one unit's members, bounded, and rides the exit card — the card is exactly where D-CLOUD-098 permits spending the player's attention.

**Experiment:** truncate a save to zero; run an exit sync; assert the good copy is fetched and installed, and the fetch is bounded to the suspect unit.

---

## 3. Concrete revisions each proposal should make

### `claude-analysis.md`

1. **Drop the age cap** (§1.6). The hazard is real but bounded, and the mitigation (compare against server-side modtime) is unnecessary. The count and size caps carry the load.
2. **Add `- /README.md` to the allowlist row** (§1.1). The README is not explicitly excluded, and the hazard is real.
3. **Add the MATCH deletion path** (§1.3). MATCH's deletions must go to `.history/` with `reason: deleted`, or the store loses the very bytes it exists to protect.
4. **State the exit sync's admission ceiling counts retain bytes** (§2.6). On backends without server-side copy, the retain streams through the device, and the ceiling must weigh it.

---

### `gemini-analysis.md`

1. **Add the namespace protection hazard** (§2.1). The delta moves the store inside the sync root, where exclusion survives only as the rule `- /.history/**` — and the shipped allowlist includes patterns that match at any depth. The hazard is real, and the experiment (seed a cloud with README + `.history/`, run the shipped image's backup/restore/MATCH) is the cheapest way to settle it.
2. **Add the MATCH deletion path** (§2.3). MATCH's deletions must go to `.history/` with `reason: deleted`, or the store loses the very bytes it exists to protect.
3. **State the exit sync's admission ceiling counts retain bytes** (§2.6). On backends without server-side copy, the retain streams through the device, and the ceiling must weigh it.
4. **Drop the clock skew mitigation** (§2.6). The hazard is real but bounded, and the mitigation is unnecessary.

---

### `gpt-analysis.md`

1. **Add the self-healing migration** (§4). The delta's namespace protection hazard is real, but the migration's fold of `Saves-replaced/` is made *standing* and path-aware: members landing in `-replaced/<stamp>/.history/…` fold *back* to their original `<unit>/<seq>/`. The store then self-heals through the very mechanism that threatens it, with no name-mangling of members.
2. **Add the `.rocknix/` manifest folder** (§2.2). The plan already has one hidden folder inside `Saves` that *must* sync; the delta adds one that *must not*. The outer README must declare both, and the allowlist must treat them oppositely.
3. **State the exit sync's admission ceiling counts retain bytes** (§3.1). On backends without server-side copy, the retain streams through the device, and the ceiling must weigh it.
4. **Drop the auto-heal format-awareness** (§2.10). The delta's zero-length/all-one-byte test is the cheapest sufficient form, and a false positive is recoverable by construction.

---

### `kimi-analysis.md`

1. **Add `- /README.md` to the allowlist row** (§1.4). The README is not explicitly excluded, and the hazard is real.
2. **Add the `.rocknix/` manifest folder** (§2.2). The plan already has one hidden folder inside `Saves` that *must* sync; the delta adds one that *must not*. The outer README must declare both, and the allowlist must treat them oppositely.
3. **Add the MATCH deletion path** (§1.3). MATCH's deletions must go to `.history/` with `reason: deleted`, or the store loses the very bytes it exists to protect.
4. **Drop the same-device overlap mitigation** (§2.3). The hazard exists, but the residual (a duplicate entry) is benign, and the mitigation (adding a run id to the seq) is unnecessary.

---

## 4. Summary of revisions all proposals should adopt

| Revision | Why |
|---|---|
| **Count bound per save file, not per unit** | The maintainer's own example (auto-state churn evicting a manual slot) breaks under the unit key. |
| **Add `- /README.md` to the allowlist** | The README is not explicitly excluded, and the hazard is real. |
| **Add the `.rocknix/` manifest folder to the allowlist and README** | The plan already has one hidden folder inside `Saves` that *must* sync; the delta adds one that *must not*. |
| **MATCH's deletions go to `.history/` with `reason: deleted`** | MATCH is the one action that deletes, and the delta does not say it retains those deletions. |
| **The exit sync's admission ceiling counts retain bytes** | On backends without server-side copy, the retain streams through the device, and the ceiling must weigh it. |
| **One bounded fetch per suspect unit on the exit pass** | D-CLOUD-100's "restored" requires a fetch, and the exit path is defined as push-only. |
| **The migration's fold of `Saves-replaced/` is standing and path-aware** | An old-image sync-mode backup or MATCH deletes the store's members from the cloud; the fold absorbs anything written to `-replaced/` forever after. |
| **Dedupe against the newest entry** | If the newest store record's sha256 equals the current head's, skip the retain. |
| **Copy, never move** | A server-side *move* opens a window in which the head is absent — the unexplained-absence question D-CLOUD-037 makes the player answer. |
| **The retain and its publish are one atomic pair for deferral purposes** | When a unit defers, both the retain and the publish defer — a publish must never go out ahead of its retain. |

---

## 5. Register rows the delta must cite

The delta amends or supersedes these rows without saying so:

| Row | What the delta does | What it should say |
|---|---|---|
| **D-CLOUD-042** | Fixes the store's folder as `Saves-discarded` beside the saves folder. The delta moves the store inside `Saves/.history/` and does not cite 042. | "D-CLOUD-095 supersedes D-CLOUD-042's store-location clause." |
| **D-CLOUD-047** | Says "Propagated deletions and compactions are not retained as discarded saves; where `copy --backup-dir` proves reliable (Gate 7), the cloud's `-replaced/` sibling is their record and #25 labels them apart." The delta's `reason: deleted` retains deletions and retires `-replaced/`. | "D-CLOUD-095 supersedes D-CLOUD-047's retention exclusions for deletions; compactions still retain nothing." |
| **D-CLOUD-046** | Defines the exit path as push-only. The delta's auto-heal requires a fetch, and the exit card is exactly where D-CLOUD-098 permits spending the player's attention. | "D-CLOUD-100 refines D-CLOUD-046: one bounded fetch per suspect unit on the exit pass." |

---

## 6. The one register row to reopen

**D-CLOUD-096's age cap clause** should be reopened. The hazard is real but bounded, and the mitigation (compare against server-side modtime) is unnecessary. The count and size caps carry the load, and the age cap protects nothing they do not. The residual (a bad-clock writer's older entries mis-ordered) is small and bounded. The delta should drop the age cap, or gate it on a trusted clock.

=== END mistral_peer_review.md ===
