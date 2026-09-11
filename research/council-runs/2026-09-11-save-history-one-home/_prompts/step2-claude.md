# Council — Step 2: peer review

You are one of five council members. In Step 1 each of you independently judged
the delta to the conflict-resolution plan of record -- one hidden history store for
the earlier versions of a player's saves (the commission, `00-problem-statement.md`). The
complete corpus is embedded above this brief again, unchanged and hash-verified;
the other members' Step 1 analyses are injected below.

Your task is to review **their** analyses. You are not revising your own position
in this step, and you are not voting yet.

## Anti-self-citation constraint

You are critiquing **proposals about this system**, not observations of the
council run that produced them. Do not treat the injected analyses as evidence
about how well councils work, how models behave, or how this deliberation is
going. Reason about the substance on its merits, against the embedded corpus.

## What a good review does here

- **Test claims against the corpus.** Several analyses make specific assertions
  about what the shipped code does, what EmulationStation's helpers do, what
  rclone does, and what a register row decides. The corpus is embedded above.
  Where a claim is checkable, check it, and say plainly whether it holds. A
  confidently wrong claim about rclone's `--backup-dir` overlap rule, the
  allowlist, the shipped set-aside, a register row or what #22 R1-R9 says is the
  most valuable thing you can catch.
- **Separate what is established from what is asserted.** Some claims rest on
  the corpus; some rest on the member's own knowledge of rclone, bisync,
  RetroArch or filesystem behaviour that is *not* in the corpus. The second kind
  may still be right, but it is a hypothesis that needs an experiment. Say which
  is which, including where a member has already labelled their own inference.
- **Identify the strongest and the weakest argument in each analysis**, by name
  and filename.
- **Name failure modes every analysis missed.** Convergence between four models
  is not evidence of correctness; it may be shared blind spots.
- **Give concrete revisions** each proposal should make, specific enough that
  the author could act on them in Step 3.

Where you disagree with another member, argue the substance. Where they have
changed your mind, say so explicitly and why. Do not average positions, and do
not soften a real disagreement into a both-sides summary.

Refer to each analysis by its injected filename (for example `claude-analysis.md`),
never by an invented ordinal such as "Analysis 1" or "the first proposal" —
downstream steps inject your review into other members' prompts, and anonymised
ordinals have caused members to misidentify which position was their own.

## Injected analyses

=== START gemini-analysis.md ===

### 1. Does the delta weaken any property the plan of record relies on?

I have evaluated each changed row of the delta table (`repo/docs/save-history-plan-delta.md`). The delta does not weaken the plan of record; it unifies disparate mechanisms into a single, predictable store. 

*   **Store at `<SAVES_REMOTE>/.history/<unit>/<seq>/`, `reason`, and `README.md`**: **Endorse**. The plan of record relied on `-discarded/` being a sibling folder to avoid rclone `--backup-dir` overlap (D-CLOUD-014). Because the reconciler writes to `.history/` via explicit `copyto` rather than `--backup-dir`, placing it inside `Saves/` is safe and satisfies the maintainer's request for one home (D-CLOUD-095).
*   **Retain-before-publish for every publish that overwrites a cloud copy**: **Endorse**. The plan of record relied on retaining only wizard losers (D-CLOUD-036). Extending this to all overwrites strengthens the system by covering undecided replacements (e.g., crash truncations, #132) without weakening the ordering rule (D-CLOUD-041).
*   **Retiring `--backup-dir`**: **Amend**. The plan of record uses `--backup-dir` locally (`repo/code/cloud_restore-set-aside-excerpt.md`) to preserve local saves overwritten by a restore, satisfying D-CLOUD-078 (always keep a record of the last known good state). If we retire it, we must ensure no local data is destroyed. I amend this row: The reconciler must also perform **retain-before-install** for any fetch or restore that overwrites a local save, pushing the local loser to the cloud `.history/` store before overwriting it locally.
*   **Allowlist `- /.history/**` ahead of every include**: **Endorse**. Prevents sync loops and keeps the store hidden from the device.
*   **Nesting settings, age (90 d) and total (256 MiB) caps**: **Endorse**. Meets D-UI-039 and D-CLOUD-096.
*   **Reader reads one store, reason as label**: **Endorse**. Simplifies the UI.
*   **Classifier adds `suspect` class (auto-heal)**: **Endorse**. Meets D-CLOUD-100.
*   **Save states included (auto-states included)**: **Endorse**. Meets D-CLOUD-099.

### 2. Concrete failure modes and ordering hazards

Beyond the suspected hazards, I have identified a critical unnamed hazard regarding handheld clock skew:

*   **Clock skew triggering immediate pruning (Unnamed Hazard)**: 
    *   *Hazard*: Handhelds frequently lose RTC sync. The `<seq>` path uses `<decided_at, UTC compact>-<deciding device id>`. If a device with a dead battery thinks it is 1970, its history entries will be written with an ancient timestamp. When the pruning logic enforces the 90-day age cap (D-CLOUD-096), it will immediately delete this brand-new save because its timestamp makes it look like the oldest record.
    *   *Experiment*: On the GENERIC_X64 VM, set the system clock to 2020. Trigger a conflict resolution that pushes to `.history/`. Run the pruning sweep and verify if the newly retained save is immediately deleted.
*   **Provider differences and server-side copy fallback**:
    *   *Hazard*: Retain-before-publish relies on `rclone copyto`. On Dropbox, this is a fast server-side API call. On self-hosted backends like SFTP or WebDAV (`issues/133.md`), rclone may not support server-side copy and will silently fall back to downloading the file and re-uploading it to `.history/`. This doubles the bandwidth and time required for a publish.
    *   *Experiment*: On the VM against the SFTP QA backend, run a publish that triggers retain-before-publish. Monitor network traffic to see if it equals the file size (indicating a download/upload fallback) rather than just API overhead.
*   **Retain-before-publish under an interrupted run**:
    *   *Hazard*: If `rclone copyto` succeeds in placing the old cloud head into `.history/`, but the subsequent publish of the new save fails (e.g., link loss), the cloud head remains unchanged. The next sync pass will see the same head and may `copyto` it again, creating duplicate history entries and churning the count cap.
    *   *Experiment*: On the VM against WebDAV, kill the reconciler process after `copyto` completes but before the publish finishes. Verify if the next run duplicates the history entry.
*   **Two devices publishing to the store at once**:
    *   *Hazard*: Because `<seq>` includes the device ID, paths will not collide. However, if both devices evaluate the 256 MiB total size cap or the count cap at the same time, they may both attempt to delete the same oldest record, causing one to fail, or they may both delete records and over-prune.
    *   *Experiment*: Run two reconcilers concurrently on the VM, both pushing to the same unit's history on WebDAV, exceeding the count cap.
*   **The store's README inside a folder that `sync` mode mirrors**:
    *   *Hazard*: The allowlist (`repo/code/cloud_sync-rules.txt`) excludes `- /.history/**`, but the root `Saves/README.md` is not explicitly excluded. However, because the allowlist ends with `- /**`, the README will be ignored and not synced to the device. This is actually correct (it prevents clutter on the handheld), but means the README only exists in the cloud.
    *   *Experiment*: Run a full restore on the VM with a `README.md` placed in the cloud's `Saves/` root. Assert that it does not appear on the local device.

### 3. What it costs the time to play

Per `repo/rules/time-to-play.md` (D-CLOUD-098), time to play is a first-class metric. 

*   **Cost**: Retain-before-publish adds one `rclone copyto` operation per overwritten cloud file. On a handheld's Wi-Fi, if the provider supports server-side copy (e.g., Dropbox), this is **1 additional round trip taking ~0.5 to 1.0 seconds**. If the provider does not (e.g., SFTP), it requires a full download and upload, which could add **2-4 seconds** for a 5MB save state.
*   **Keeping it off the launch path**: The exit sync must not block the player. If the player launches a *different* game, they do not wait. If they launch the *same* game, EmulationStation checks `L_T` and `L_S`, and will refuse the launch if the reconciler holds `L_S` (D-CLOUD-053). To keep the network cost off the launch path, the reconciler must read the locally captured save into memory or a staging area, **release `L_S`**, and only then perform the network `copyto` and publish. Because capture already seals an independent copy (D-CLOUD-034), the reconciler does not need to hold `L_S` during the network round trips.

### 4. Migration

Devices currently hold `Saves-replaced/<stamp>/` in the cloud and `.cache/cloud_sync/replaced/<stamp>/` locally (`repo/docs/save-history-plan-delta.md`). These are pruned to the newest run (`repo/code/cloud_backup-set-aside-excerpt.md`). To ensure no earlier version is lost and no prompt is shown to the player:

1.  **Stop writing**: The new reconciler replaces `cloud_backup` and `cloud_restore`, so `--backup-dir` is naturally retired.
2.  **Read both**: The #25 restore tool must be amended to read both the new `.history/` store and the legacy `Saves-replaced/` and `.cache/cloud_sync/replaced/` directories.
3.  **Synthesize records**: When reading the legacy directories, the tool synthesizes a record in memory (e.g., `reason: replaced (legacy)`, using the folder's timestamp for the date).
4.  **Age out**: Because the legacy folders only hold a single run, they do not need to be moved or rewritten into `.history/`. They will simply remain accessible via the restore tool until the user deletes them or the 90-day age cap sweeps them.

### 5. A simpler shape

The proposed delta is **already the simplest shape** that meets all of the maintainer's constraints. 

*   Option C (`repo/docs/save-history-gap-analysis.md`, suffixed copies like `Zelda.srm.bak-1`) was rejected by the maintainer due to cluttering the saves folder.
*   Relying on the cloud provider's native file history (e.g., Dropbox's 30-day history) violates D-QA-017 (we do not optimize solely for Dropbox) and leaves users of self-hosted backends (WebDAV, SFTP, SMB) with no history at all.
*   The delta unifies two disparate, confusing mechanisms (`--backup-dir` and `-discarded/`) into a single, predictable, metadata-rich store. It uses one vocabulary ("earlier versions"), hides the complexity from casual browsing (D-CLOUD-095), and provides a single recovery path for all overwrite scenarios (conflicts, sync replacements, and auto-heal).

=== END gemini-analysis.md ===

=== START gpt-analysis.md ===

# Initial assessment

**I support one hidden home inside the saves folder. I do not support landing the delta as merely a path change plus “one small extra transfer.”** Moving history inside the mirrored namespace removes an existing isolation boundary; retaining ordinary replacements changes the useful lifetime of a conflict undo; and copying a preimage before publishing does not, by itself, protect against concurrent publishers.

My recommendation is to amend the delta, preserving its visible shape: **one store, one restore surface, and one nested settings page**. The amendments should concentrate on transaction completeness, namespace protection, and explicit limits—not a second synchronization engine.

I have used only the 17 embedded sources. Citations resolve to their declared paths; the supplied, embed-time-verified hashes are recorded in the `corpus.provenance.json` content at the end. Proposed mechanisms, counterexamples, and timing estimates below are my analysis, not reported test results.

# 1. Does the delta weaken any property of the plan of record?

The delta is the document under review; issue bodies are evidence of the previous contract, not necessarily current instructions where later register decisions supersede them. In particular, #22 still contains launch-refusal and exit-code language superseded by D-CLOUD-074, D-CLOUD-076, and D-CLOUD-098. Those stale clauses must not return through this amendment. [Delta][S2] · [Decision register][S4] · [Reconciler][S11]

## Row-by-row judgment

| Changed row | Judgment | Required amendment and decision implications |
|---|---|---|
| **Store moves inside `Saves/.history/`, with READMEs** | **Endorse the location; amend its protection.** | D-CLOUD-095 settles the location. It does **not** make a dot directory inaccessible to rclone. The sibling was outside the transfer root by construction; the new store needs an enforced reserved namespace in every planner, transfer, restore, deletion, and cleanup path. Protect root `README.md` separately. D-CLOUD-095 supersedes D-CLOUD-042’s store-location clause, not that row’s unrelated split-root refusal. |
| **A `reason` field describes discarded, replaced, deleted, and suspect versions** | **Amend.** | Adding a field to the wizard-only record is insufficient. Routine replacement has no KEEP LEFT/RIGHT decision; deletion may have no winner; a suspect unit may not be coherent. Generalize the record without inventing those facts. Add an explicit unknown/legacy reason for imports whose cause cannot be recovered. The reason is presentation metadata, never version identity or permission to restore. |
| **Retain before every overwriting cloud publish** | **Endorse the principle; broaden and qualify it.** | The safe contract is “preserve a threatened version before making it unreachable,” not merely “copy the current cloud file.” It must cover a local version about to be overwritten when its cloud retention cannot be proved, and unique bytes about to be deleted. Reopen D-CLOUD-047’s retention exclusions and #22’s “no preimages of one-way fetches” scope. Concurrent publishing also needs the treatment in §2; a preimage copy alone is insufficient. |
| **Retire both uses of `--backup-dir` when R1 lands** | **Endorse, with a coverage gate.** | Preserve D-CLOUD-097: no interim widening. Retire the mechanism only in the one-image R1 cutover, after its cloud **and local** protection has an explicit replacement. The local restore archive is not redundant merely because cloud overwrites now have history. Existing archives must be imported before their pruning or removal. |
| **Add `- /.history/**`; drop `.snapshots` exclusion** | **Amend.** | Add the history exclusion ahead of all includes, preserve the `.bak` protection, and separately reserve root `README.md`. Do not remove the `.snapshots` guard just because no planned writer produces it: first establish that it cannot expose existing files to the broad state includes. A redundant exclusion is cheaper than accidentally restoring an old snapshot tree. Test actual filter/`--files-from` behavior rather than relying on syntax inspection. |
| **Nest history settings under SAVE MANAGEMENT** | **Endorse; clarify semantics.** | One submenu is correct under D-UI-039. I would use **MANAGE SAVE HISTORY** as its entering row, consistent with the submenu-label rule. Keep the restore/conflict action in D-CLOUD-035’s existing home. Default to **3**, preserving the existing selectable 1–9 range unless the maintainer explicitly meant to replace that range: #134 describes 3 versus 5 as the starting default, while D-CLOUD-096’s wording is less precise. “Off” must not disable transaction safety or erase existing history silently. |
| **#25 reads one store and labels by reason** | **Endorse; amend its input contract.** | The reader must distinguish verified usable versions, incomplete transactions, and suspect or incomplete legacy material. A reason alone does not establish restorability. Restoring still runs through the reconciler, retains displaced bytes first, and creates a new `pub` under D-CLOUD-047. Never derive an install destination directly from an unchecked record path. |
| **Add `suspect` and auto-heal zero-length/all-one-byte saves** | **Replace the unconditional heuristic, reopening D-CLOUD-100 narrowly.** | Those patterns justify suspicion, not a universal declaration of damage. Auto-heal only where the format/unit contract establishes invalidity and a compatible, coherent cloud replacement is positively verified. Otherwise preserve and defer; do not silently roll back potentially intentional progress. This keeps auto-heal as a classifier outcome, not a separate service. |
| **All save states, including auto-states, get history** | **Endorse D-CLOUD-099.** | Keep state bytes and their associated thumbnail together. Define the retention unit explicitly; do not use a mutable slot number or pathname as version identity. Routine auto-state churn must not consume the battery-save allowance. Ordinary copies must not silently eliminate the wizard’s first-class undo protection. |
| **Public documentation shows the layout** | **Endorse, with release accuracy.** | The README must describe what the installed release can actually restore. D-CLOUD-033 and #25 explicitly defer the reader; a #22-only release cannot truthfully direct the player to a restore control that does not exist. Also, do not advertise 256 MiB as an unconditional ceiling if safety exceptions can exceed it. |

The old store’s record is explicitly for “finalized, coherent wizard losers,” and includes mandatory-looking winner, decision, and `discarded_by: "wizard"` information. That is a materially narrower contract than the proposed unified store. The shipped backup archive, meanwhile, can contain both overwritten and sync-removed files; the local archive protects files a restore overwrites. These distinctions come directly from the sources. [Reconciler, R9][S11] · [Backup excerpt][S8] · [Restore excerpt][S9]

## The three bounds need an explicit priority order

**A strict count cap, strict 90-day age cap, strict 256 MiB total cap, and “never the only copy” cannot all be unconditional.**

For example, suppose history contains the only remaining coherent copy of 300 games, at 1 MiB each. No pruning order can bring that below 256 MiB without violating the last-copy rule. One unusually large save unit produces the same contradiction by itself. Migration can encounter an already-over-budget collection before a new writer makes its first publish.

I recommend reopening **D-CLOUD-096** to establish this ordering:

1. **Never delete transaction recovery material still needed by an unfinished operation.**
2. **Never automatically prune the only verified usable cloud copy of a logical save unit.** A save state for another core, or a suspect file, is not a substitute for a battery save merely because both name the same game.
3. **Protect the latest deliberate conflict loser from routine-sync churn while history is enabled.** Otherwise “3 kept” changes from approximately three conflict decisions to three subsequent replacements, weakening D-CLOUD-032’s primary mis-press recovery case.
4. Apply count, age, and total-size targets to the remaining eligible history, oldest first.

Safety pins must be explicit exceptions to those targets. At very small count settings, they may exceed the selected count. The UI should therefore describe a retention target, not promise an exact maximum.

This is a substantive amendment, but a small mechanism: the relevant facts already belong in the per-unit records. It does not require separate user settings or separate stores by reason.

If the maintainer instead requires an absolute 256 MiB ceiling, the honest alternative is **admission refusal**: do not perform an overwrite or removal when its required retained copy cannot fit after safe pruning. That alternative still needs a migration exception and cannot enforce a precise shared-cloud ceiling with independent publishers checking free capacity concurrently.

I prefer safety exceptions because the store is in the cloud, not a hidden growing card cache. The exception must be disclosed in the README; a failed retention caused by the provider’s actual quota must still prevent the destructive operation. [Retention decisions D-CLOUD-032/036/096][S4] · [Gap analysis][S3]

## Define the generalized record before implementation

The record must answer these questions from the cloud alone:

- Which game, kind, and logical unit is this?
- Which complete set of member bytes does it describe?
- What are their SHA-256 hashes, sizes, original relative paths, and storage paths?
- Who produced the version, insofar as that is actually known?
- Why was it retained, and was that reason a decision, an automatic action, or unknown?
- Which transaction/publication produced this retention record?
- Is it verified usable history, quarantine material, or preparation for an unfinished operation?
- What predecessor and intended successor allow an interrupted operation to be recognized?

Keep unknown producer/core/time facts unknown. Preserve member hierarchy: storing every member “at its basename,” as R9 currently proposes, can collide for a multi-directory unit containing two identically named files.

Use an operation identifier that cannot collide when a device publishes the same unit twice within one clock tick or its clock moves backward. A timestamp plus device ID is not enough. Keep timestamps for display; do not make them the sole identity or correctness ordering.

The save-manifest identity rule remains SHA-256 over stored bytes. This does not warrant a new database, a second head authority, or using `reason` to distinguish otherwise identical versions. [D-CLOUD-030/033/045][S4] · [R9 layout][S11] · [Reader acceptance A5][S13]

## Two contracts must be clarified rather than silently contradicted

**History off.** The existing wizard says nothing is retained when its switch is off. The delta also requires unconditional suspect retention and stronger transaction safety. My recommendation:

- Off disables optional long-lived history going forward.
- It does not purge existing history.
- Temporary recovery copies remain mandatory until a destructive transaction has a verified outcome.
- D-CLOUD-100’s retained suspect copy is an explicit safety exception.

Amend the D-CLOUD-032/036 interpretation and #23’s footer accordingly. “Discarded saves were not kept” is false if that operation retained a mandatory recovery copy. Do not add a second switch to explain the distinction. [Wizard settings and acceptance][S12]

**Exit is push-only.** Cloud-to-cloud `copyto` can require a download/upload relay, and verification can require a fetch. Reopen **D-CLOUD-046** narrowly to distinguish bounded reads into transaction staging from downloads installed into live saves. The former may be admitted against a measured budget; the latter remain off the exit push. Otherwise those overwrites must defer to a full pass. The previous 3–4-spawn expectation cannot simply be carried forward as if retention added no work.

# 2. Concrete failure modes and the cheapest experiments

All experiments below belong on the GENERIC_X64 pair with synthetic data and self-hosted backends first. No proposed experiment uses a person’s device or cloud. The dedicated handheld is still an open decision, and the earlier Dropbox-account proposal was superseded by the non-Dropbox QA matrix. [QA handheld proposal][S16] · [QA matrix][S17]

## Retain-before-publish needs a transaction, not just command ordering

I recommend this conceptual ordering, extending the existing R5 pending-publication and A7/A8 recovery contracts:

| Phase | Required invariant | Result of power loss, link loss, or SIGKILL |
|---|---|---|
| **1. Seal inputs and record intent** | Independent immutable input copies; context, expected head, hashes, unit membership, and operation ID are recorded durably. No hard links into emulator-owned saves. | Live saves remain unchanged. Retry recognizes the same operation rather than manufacturing another history version. |
| **2. Retain threatened bytes** | Copy the cloud preimage, or upload a local preimage, into a unique operation destination. Do not remove the source first. | Partial retained members are not offered as a complete version. The original remains available. |
| **3. Verify members and publish the record** | Positive verification of bytes and metadata; the record becomes discoverable only when its described set is complete. | A complete archive is recoverable; an incomplete preparation is not counted as successful history. |
| **4. Revalidate the head** | The fresh head still corresponds to the operation’s expected predecessor. | A mismatch stops this publish. Retained preparation is harmless; it does not authorize overwriting somebody else’s version. |
| **5. Publish/install the winner** | Existing whole-unit recovery rules prevent a partially installed member set from becoming playable or selectable. | A partial cloud publication is held; a local partial installation is completed or rolled back from local transaction staging before launch, including on an offline restart. |
| **6. Verify correspondence** | The new bytes are positively checked before agreement advances. | Failure leaves `uploaded-unverified` or an equivalent explicit incomplete outcome, not agreement or “completed.” |
| **7. Finalize transaction state** | The cloud record remains sufficient to understand the outcome after local pending state is lost. | Restart completes bookkeeping without replaying a stale decision over a newer head. |
| **8. Prune later** | Only finalized, eligible history is considered; no transaction depends on what is deleted. | A failed cleanup leaves extra history, not missing recovery material. |

I would amend **D-CLOUD-036/041’s server-side “move” prescription to copy-before-replace**, retaining their corrected left/right semantics. Moving the live cloud loser away before publishing introduces a period with no head at that pathname. Copying leaves the previous head in place until replacement. Whether it is actually server-side must be established per effective backend.

For each phase, the cheapest test is a transport barrier on the VM: stop immediately before and after the relevant operation, then separately kill the reconciler, its transfer child, the process group, or power off the guest. Restart both online and offline. Assertions should inspect **member hashes and readable unit completeness**, not just return codes.

Important distinctions:

- `record.json` proving that a preimage was retained does not by itself prove that a winner was installed.
- A successful per-file rename does not make a multi-file unit atomic.
- A failure must not trigger an unconditional remote rollback: that rollback could overwrite a newer publication from another device.
- Lost local pending state must not turn an already-published operation into an apparently fresh divergence or a repeated overwrite.

These are extensions of existing acceptance obligations, not evidence that an implementation already satisfies them. [Reconciler R5/R7/R9, A2/A7/A8][S11] · [D-CLOUD-034/077/078][S4]

## The concurrent-publisher counterexample is decisive

Start with both devices agreeing on `H0`.

1. A verifies `H0`.
2. B verifies `H0`.
3. Both retain `H0` in different, valid history entries.
4. Both perform their last head check and still see `H0`.
5. A publishes `HA`.
6. B publishes `HB`.

**`HA` was overwritten without being copied into history.** Unique sequence names prevent history-entry collisions, not this race. Another head check merely moves the race window.

There is a worse follow-on: A may later have `L = A = HA` while the cloud contains `HB`. The normal “cloud changed” classification can replace A’s last local `HA` without a one-way-fetch preimage. Thus the missing cloud history can become an actual lost version.

**Cheapest experiment:** two VMs, WebDAV, and barriers after the last head check. Release A’s upload, then B’s. Reconcile A again. Assert that both `HA` and `HB` remain recoverable from the cloud alone after local pending/staging records are removed.

### My preferred response

For history-enabled publishes, retain an independently verified **publish candidate as well as the preimage** before modifying the shared head. Put this recovery material in the same `.history/` namespace, reusing the pending-publication concept.

Do not immediately garbage-collect the candidate merely because it currently equals the head. A second publisher that already passed its checks may still arrive. At minimum, the latest candidate per publishing device/unit needs protection until a verified successor makes its expiration safe under the declared history policy.

This guarantees recoverability of new-reconciler publishers’ versions; it does **not** serialize their choice of head. It also costs additional writes and protected storage.

If the requirement is stronger—*no concurrent branch may even temporarily win without a decision*—then ordinary independent rclone copies are insufficient. That requires conditional replacement/fencing or a genuinely single cloud writer. Reopen **D-CLOUD-052’s transport contract**, applying D-CLOUD-034’s cost test, rather than claiming a generic remote lock file solves it. An expiring lock without fencing lets a delayed old writer publish after a new owner takes over.

The existing “no protected-publication protocol” negative scope must therefore be explicitly revisited. The council should distinguish **recoverable concurrency** from **serializable conflict resolution** and choose which it is requiring. [Transport and cost decisions][S4] · [Classifier and negative scope][S11]

## Other hazards and focused VM experiments

| Hazard | Why the delta exposes it | Cheapest experiment and pass condition |
|---|---|---|
| **History is uploaded, restored, or recursively retained** | The shipped allowlist includes extensions such as `.srm` and `.state*` anywhere. Hidden history members match them. | Seed history with save-looking members and a locally present `.history/`. Exercise every R1 entry point and a deliberately hostile `--files-from` list. No reserved member enters a live transfer plan, capture, or new history-of-history entry. |
| **A mirror deletes history or its root README** | Both are absent from the local active-save tree. A broad filter or `--delete-excluded` can defeat expected exclusion behavior. | Run the shipped selectable `sync` path and the replacement path against populated history, with defaults and custom filters. Hash both READMEs and every retained member before/after. Unsupported option combinations must refuse, not proceed optimistically. |
| **README/history masks mass absence** | A cloud root containing only control files is nonempty, but has no live saves. | Establish agreement, remove all live saves, leave history, manifests, and README. The pass must still trigger the mass-absence refusal, not treat the root as healthy or infer deletions. |
| **Incomplete R1 inventory** | The menu map also has MATCH THIS DEVICE TO THE CLOUD; helpers can seed, tidy, or move folders. “Every writer” is broader than the prominently listed buttons. | Instrument spawned processes for startup, exit, all save actions/ticks, Tools, shell commands, matching, and relevant layout helpers. Every save mutation must be a reconciler-decided operation. A code search alone is not the acceptance proof. |
| **Old firmware keeps pruning `-replaced/`** | A one-image local cutover does not upgrade another device. The old pruner is shared-cloud and keeps only one stamp directory. | Run one old-image VM beside one new-image VM. Pause an import, then let the old VM complete a replacing backup and prune. Demonstrate the exposure before deciding the mixed-version migration boundary. |
| **Pruning races publication or restore** | Local `L_T` does not serialize another device’s collector or reader. Two publishers can also exceed a shared byte cap after both pass admission. | With a tiny test cap, concurrently publish and prune; pause a restore after selection but before fetch. Verify active transaction material and safety floors survive. A selected version that expires must cause a clean restore failure before any local overwrite. |
| **Clock rollback corrupts retention ordering** | Old pruning sorts timestamp names; proposed `seq` also starts with time. #25 explicitly requires clock-backward survival. | Move one guest’s clock backward and publish twice within the same timestamp granularity. No entry collides or is mistaken for the oldest merely from its name. Use causal/publication evidence where available and mark untrusted chronology honestly. |
| **Multi-file basename collision or torn legacy grouping** | R9 flattens member names; legacy backup directories contain replaced members, not necessarily complete unit snapshots. | Use a synthetic unit with two subdirectories containing the same basename and another with only one member changed. Round-trip exact paths and bytes; never assemble a “complete old unit” from unrelated current members. |
| **Uniform bytes are legitimate** | Erased flash, intentional reset, or a valid uniform ancillary file can meet the heuristic. | Synthetic valid-format fixtures plus reset/delete cases. Only documented invalid payload patterns auto-heal; metadata or thumbnail damage alone must not silently roll back game progress. |
| **Restore loops back into auto-heal** | A player may intentionally restore the very version classified as suspect. | Restore a retained uniform version through #25, then reconcile and exit again. An explicitly authorized restore must not be silently undone indefinitely by the same heuristic. |
| **Orphaned rclone writes after the gate clears** | D-CLOUD-093 deliberately lets the parent’s lock disappear while an orphan may remain. That trade is unsafe if a late local rename can reach newly launched game saves. | Kill only the parent during a delayed download, launch, then release the child. No transfer may install after launch. Reopen D-CLOUD-093 narrowly for bounded child ownership/reaping; do not restore an indefinite inherited-lock deadlock. |
| **False success, quota exhaustion, or card replacement** | More staging and retention create more opportunities to exhaust storage or verify the wrong mounted root. | Fail member and record writes independently; use a full test filesystem and change the mounted save root mid-operation. Agreement must not advance and no destructive step may bypass failed retention. |
| **Untrusted paths and metadata** | Cloud records and migrated filenames are external input. | Include traversal, absolute paths, case-fold collisions, malformed records, and control characters in labels. Restore destinations remain inside the intended allowlisted unit; corrupt history is reported, not treated as an empty successful scan. |

The namespace concern is directly visible in the allowlist, not hypothetical interpretation of a filename. The remote prune’s unconditional per-stamp purge and shared-device scope are also visible in the shipped excerpt. The full cleanup/helper bodies are not embedded, so their safety remains an audit gap. [Allowlist][S10] · [Backup excerpt][S8] · [Menu map][S5]

## Auto-heal should be conservative and honest

My proposed reopening of **D-CLOUD-100** has these conditions:

- The candidate is a sealed, stable capture—not an emulator file observed mid-write.
- Intentional retirement/reset semantics have been checked first.
- The relevant format contract says the payload is invalid.
- The replacement is a fresh, verified, coherent version of the same compatible unit—not merely a nonuniform file named in a stale manifest.
- The suspect bytes are retained and verified before local replacement.
- Failure to fetch, retain, or install produces “could not recover yet,” not a completed-recovery message.
- The exit pass can flag and defer recovery; it must not silently become a download/install pass.

Where those facts cannot be established, preserve the candidate and hold the destructive action. “Nonuniform” is not a proof of “last good,” and a changed core or intentional reset can make a silent rollback worse than a visible failure.

No format-validity census or #21 unit schema is embedded. That is a blocking evidence gap for a broad auto-heal implementation, not permission to invent format rules. [D-CLOUD-100][S4] · [Classifier delta][S2]

## Provider differences are independent capability questions

Do not collapse backend behavior into “Dropbox versus hashless”:

- **Dropbox has no MD5, but that is not equivalent to having no usable content-hash evidence.** The manifest correspondence rules must identify the actual hash algorithm.
- Dropbox’s reported 30-day provider history is not a substitute for our retention verification or our restore tool.
- D-CLOUD-083 already records folder-write contention. More copy and record operations can increase that contention; cutting low-level retries again is not a legitimate performance fix.
- WebDAV may support server-side COPY yet lack usable hash evidence. Copy efficiency and verifiability are separate.
- The configured SFTP/SMB/WebDAV service may offer no provider recovery at all.
- A MinIO multipart ETag must not be treated as ordinary MD5 by assumption.

Exercise server-copy availability, missing hashes, multipart objects, interrupted copies, and listings independently on the self-hosted matrix. Use a hosted non-Dropbox QA account for its real-provider differences. D-QA-017 deliberately does not promise new Dropbox-specific coverage; record that residual rather than filling it with unapproved personal-account testing. [D-CLOUD-083 and QA decisions][S4] · [Provider matrix][S17]

# 3. What does this cost time to play?

## Evidence versus estimate

The corpus establishes:

- Two measured endpoints: press-to-first-frame and exit-to-next-first-frame.
- A true idle exit must spawn no rclone.
- The old changed-exit expectation is 3–4 spawns on hashed backends, with bounded additional verification on hashless ones.
- Automatic startup/exit sync cancellation has a two-second completion budget under D-CLOUD-076.
- Final time-to-play budgets have **not** yet been measured and adopted.

It does not establish measured latency for this history design. [Time-to-play rule][S6] · [Metric issue][S15] · [D-CLOUD-046/076/098][S4]

The following are planning estimates, not handheld measurements. Assume:

- 80–250 ms per serialized cloud application request over handheld Wi-Fi;
- approximately 1 MiB/s upload and 3 MiB/s download;
- a warm connection, no retry storm, and small records;
- the small save sizes described in D-CLOUD-036.

## Extra operations per overwriting unit

For a unit with `k` retained members, a straightforward server-copy implementation adds approximately:

1. `k` member-copy operations;
2. one batched positive member verification, where supported;
3. one record write;
4. one record verification;
5. one fresh head check after retention.

That is **`k + 4` logical requests** before counting provider preflight calls, pagination, or any additional transaction-finalization receipt. Some can be combined or parallelized; the dependent phases cannot all overlap.

These are **not rclone spawn counts**. One spawn can make many network requests. Conversely, implementing every member as a separate `copyto` can add many spawns.

| Case | Estimated incremental history cost |
|---|---|
| **No changed or pending units** | **0 network requests.** Do not rewrite READMEs, scan history, or prune on this path. The validity check should share capture’s byte pass rather than reread files independently. |
| **One small battery save, server copy and usable hash evidence** | About **5 logical requests**; roughly **0.6–2 seconds** including modest command/provider overhead. |
| **State plus PNG, around 100 KiB total** | About **6 logical requests** if member copies are counted separately; roughly **0.8–2.5 seconds**. Parallel copies reduce elapsed time but can encounter provider locking. |
| **128 KiB preimage, client-relayed copy plus fetch verification** | Additional data time alone is roughly **0.21 seconds** for one upload and two downloads, before a further head re-fetch if needed. Approximately **0.8–3 seconds** total is a reasonable planning range, not a bound. |
| **64 MiB unit, no server copy, same transfer rates** | One upload plus two downloads is about **107 seconds**, before metadata, revalidation, retries, or publishing the winner. This is not an exit-admissible “small extra transfer.” |
| **Concurrent-publication candidate escrow** | Beyond the above: another durable candidate write and verification, commonly several requests and candidate-byte transfer. For small saves, budget another roughly **0.3–1.5 seconds**; large units must defer. |
| **Migration, full history enumeration, and pruning** | Potentially many listings and transfers. **None belongs on launch or the bounded exit fast path.** |

A multi-file unit’s member count can dominate latency even when its byte count is small. Admission must therefore account for **retained old bytes, candidate bytes, verification reads, and member/operation count**, not only the new changed-byte total.

## Keeping this off the launch path

My recommended scheduling policy is deliberately conservative:

- **At rest:** pressing a game adds zero history network work.
- **During an automatic sync:** launch cancels and quiesces it under D-CLOUD-076. The existing two-second cancellation allowance is an upper-budget input, not proof of an achieved first-frame result.
- **After cancellation:** preserve enough pending state to retry without requiring another changed capture.
- **Local interrupted installations:** repair from already-local transaction staging before launch. Never require the network to reconstruct a coherent local unit after a power cut.
- **Large or operation-heavy overwrites:** defer before the destructive step. Do not meet the budget by skipping retention.
- **Pruning, import, README maintenance, and general history discovery:** perform outside the exit fast path, in bounded cancellable work.
- **Manual sync:** keep its visible gate and explicit outcome, but subject it to the adopted D-CLOUD-098 bound rather than an unlimited refusal.

Do not “solve” this by releasing `L_T` while a child can still rename files into saves. Nor should this deliberation silently replace D-CLOUD-076 with background mutation during play. Continuing a sealed, remote-only push after launch is a possible future optimization, but it requires an explicit reopening of that cancellation policy and a proof that no local installation remains possible.

The VM runner should report, per backend and image:

- first-frame endpoints against a no-history control;
- cancellation elapsed time;
- rclone spawns, requests, uploaded/downloaded bytes, and retry time;
- true idle, small overwrite, multi-member overwrite, hashless verification, quota failure, and bandwidth-capped cases.

The settings’ measured price belongs in the existing confirmation/page space. Do not append a third line below the status-bearing toggle rows. [UI row rules][S7] · [Menu map][S5]

# 4. Migration: read both, write the new one, ask no internal question

The migration must treat the existing archives as data, not obsolete implementation debris. The shipped remote and local archives protect different losers, and neither necessarily contains complete per-unit snapshots. [Backup excerpt][S8] · [Restore excerpt][S9]

The full `upgrade-and-install.md` was not embedded. I apply only the commission’s quoted rule: **read both, write the new one; a prompt is a failure mode.** [Commission][S1]

## Recommended transition

### 1. Cut over writers and their cleanup together

In the #22 image:

- Install the reserved-namespace protections before enabling the new store.
- Route every local saves writer through the reconciler.
- Stop both legacy archive writers and their old pruning paths.
- Ensure old transfer children cannot remain active across that cutover.
- Keep the old locations readable by the migration/restore layer.

This respects D-CLOUD-097: it is the final cutover, not an interim retention widening.

Do not change the live `SAVES_REMOTE` merely because its history location changed. Existing agreement should not be invalidated by a history-only migration. Likewise, this is not authorization to import a legacy split restore root contrary to D-CLOUD-042.

### 2. Inventory actual legacy sources

Discover the configured remote sibling, not a hard-coded default `Saves-replaced`, and each upgraded device’s local `.cache/cloud_sync/replaced/`.

Inventory file paths, content hashes, and whatever metadata actually survives. An import identity must survive retry and clock changes. If two devices discover the same remote entry, duplicate verified imports are preferable to an unsafe shared mutable migration catalog; the reader/collector can deduplicate byte-identical versions later.

A legacy remote entry may represent replacement **or deletion**. Its folder name cannot distinguish them. Local archives likewise do not justify fabricated producer/core/winner metadata.

### 3. Copy into the new home and verify before removing anything

- Copy remote legacy bytes into `.history/`; do not start by moving the legacy root.
- Upload local archived bytes into the same cloud home.
- Verify members and a self-contained import record.
- Keep source copies when transfer, verification, or metadata construction fails.
- Preserve unclassified files and incomplete fragments. Do not delete them because the current allowlist or unit mapper does not recognize them.

A per-run backup directory contains the files rclone replaced, not necessarily every member of the old unit. **Do not complete an old PPSSPP save by borrowing today’s other members without evidence that they belong together.** Such material can be preserved and described as incomplete without falsely presenting a coherent restore candidate.

### 4. Give imports a migration grace period

Do not import a 100-day-old version and immediately delete it under the 90-day rule. Do not apply count pruning halfway through importing a unit and thereby erase versions solely because of iteration order.

I recommend a one-time grace period beginning at verified import, with original timestamps retained separately for display. Existing over-cap material remains protected during that transition; actual provider-quota failure leaves its legacy source intact.

This is another reason D-CLOUD-096 needs explicit migration exceptions. “No version lost during transition” and “all future history is retained forever” are different promises. The former is required; the latter is incompatible with bounded history.

### 5. Retire only source entries whose preservation is proved

After successful cloud verification:

- Remove only the exact legacy entries whose bytes have been imported.
- Remove empty legacy directories afterward.
- Never purge an entire legacy root merely because a previous inventory was imported.
- Keep cloud-side migration evidence sufficient to survive loss of local cache state.

The one user-facing restore page can merge both sources during migration. There is no need for an “Import old backups?” question, a migration toggle, or separate legacy-folder vocabulary.

### 6. Preserve settings without prompting

Read a new setting when present; otherwise read its old counterpart. An explicit new **Off** must not fall back to an old **On**. Preserve the count rather than treating a rename as a reset.

The exact keys and full migration helper are not embedded, so they must be located before implementation. The ES UI excerpt also warns that `addSwitch`’s boolean is a storage-selection flag, not a default value; the VM upgrade fixture should verify the effective script-visible value, not merely the displayed switch. [UI implementation conventions][S7]

## Mixed-version devices are a real limit, not a migration detail

An old device can continue writing and pruning `-replaced/`. It may also apply custom filters that do not protect `.history/`. No marker written by the new implementation can fence code that does not understand that marker.

Therefore, a universal zero-loss migration guarantee is impossible while an uncontrolled old writer can delete a source before it is copied.

The release must establish one of these boundaries:

- legacy writers are quiescent during migration; or
- a real compatibility mechanism fences them; or
- the mixed-version residual is explicitly accepted, with no claim of universal zero-loss migration.

Do not disguise that choice as a successful migration log line. It is a release gate, not a player questionnaire.

The planned `-discarded/` store has not shipped. There is no reason to manufacture a production migration population for it. If a development account contains one, preserve and read a recognized schema conservatively, but do not let that hypothetical complicate the normal path. [Epic migration checklist][S14] · [Commission][S1]

# 5. Is there a simpler shape?

**The proposed physical shape is already the simplest credible one. Its behavioral specification is not yet sufficient.**

I would keep:

- one hidden cloud namespace;
- immutable, self-describing per-unit version/transaction records;
- one “ensure threatened bytes are recoverable” operation;
- one conservative collector outside the fast path;
- one reader, with reason labels rather than separate stores;
- one nested settings page.

The important simplification is **retain-or-reuse**: if an identical coherent preimage is already positively verified in the store, reuse that evidence rather than copying it again. Do not build a global deduplication database merely to obtain this per-unit saving.

I would reject the apparent shortcuts:

- `--backup-dir` inside the destination is explicitly incompatible with the recorded rclone constraint.
- Suffixed copies spread history through live saves, complicate filtering, and lack the metadata #25 needs.
- Provider-native versions do not satisfy the backend matrix.
- Whole-library snapshots turn small overwrites into broad work and do not remove transaction-consistency problems.
- A generic remote lock file is not a portable concurrency proof.

For concurrent recoverability, candidate escrow belongs in this same store—not a second service or second player-facing home. It adds real cost, but less machinery than portable distributed fencing. If serializable head selection is required instead, that is a larger transport decision and must be named as such.

**Final recommendation:** approve the one-home direction; amend the record, safety-priority, auto-heal, and exit-budget contracts; and do not land until the concurrent-publish counterexample, mixed-version cutover, namespace exclusions, and phase-by-phase interruption tests have explicit passing results or explicitly accepted residuals.

---

## Corpus gaps to surface to the orchestrator

The following referenced material was not embedded and was not independently inspected:

- the full `upgrade-and-install.md`;
- the save-manifest schema and #21 unit/capture contract;
- format-validity and PPSSPP census results;
- #24’s implementation and full wizard IA;
- Gate 2/4/7/12 results and adopted time-to-play budgets;
- complete backup/restore, cleanup, layout-migration, seeding, and launch/process-supervision code;
- backend capability results establishing actual copy, hash, and interruption semantics.

These gaps prevent implementation-level assurances. They do not prevent the counterexamples or the contract recommendations above.

## `corpus.provenance.json`

Artifact content only; no filesystem write or independent re-hashing is claimed. The three arrays correspond by index.

```json
{
  "corpus": "Council Facilitator — council-facilitator@1.2.0",
  "access_mode": "embedded read-at-time corpus",
  "source_verification": "SHA-256 values supplied by the Council Facilitator, verified at embed time; not independently recomputed by this council member.",
  "manifest_read_timestamp_utc": "2026-09-11T19:31:42Z",
  "source_reference_ids": [
    "S1",
    "S2",
    "S3",
    "S4",
    "S5",
    "S6",
    "S7",
    "S8",
    "S9",
    "S10",
    "S11",
    "S12",
    "S13",
    "S14",
    "S15",
    "S16",
    "S17"
  ],
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
  "missing_source_status": "Referenced but unembedded material is listed in the analysis. No paths, hashes, or contents have been fabricated for it."
}
```

[S1]: research/council-runs/2026-09-11-save-history-one-home/_sources/00-problem-statement.md
[S2]: research/council-runs/2026-09-11-save-history-one-home/_sources/repo/docs/save-history-plan-delta.md
[S3]: research/council-runs/2026-09-11-save-history-one-home/_sources/repo/docs/save-history-gap-analysis.md
[S4]: research/council-runs/2026-09-11-save-history-one-home/_sources/repo/docs/decision-register-excerpt.md
[S5]: research/council-runs/2026-09-11-save-history-one-home/_sources/repo/docs/es-menu-map.md
[S6]: research/council-runs/2026-09-11-save-history-one-home/_sources/repo/rules/time-to-play.md
[S7]: research/council-runs/2026-09-11-save-history-one-home/_sources/repo/rules/es-native-ui-excerpt.md
[S8]: research/council-runs/2026-09-11-save-history-one-home/_sources/repo/code/cloud_backup-set-aside-excerpt.md
[S9]: research/council-runs/2026-09-11-save-history-one-home/_sources/repo/code/cloud_restore-set-aside-excerpt.md
[S10]: research/council-runs/2026-09-11-save-history-one-home/_sources/repo/code/cloud_sync-rules.txt
[S11]: research/council-runs/2026-09-11-save-history-one-home/_sources/issues/22.md
[S12]: research/council-runs/2026-09-11-save-history-one-home/_sources/issues/23.md
[S13]: research/council-runs/2026-09-11-save-history-one-home/_sources/issues/25.md
[S14]: research/council-runs/2026-09-11-save-history-one-home/_sources/issues/134.md
[S15]: research/council-runs/2026-09-11-save-history-one-home/_sources/issues/135.md
[S16]: research/council-runs/2026-09-11-save-history-one-home/_sources/issues/131.md
[S17]: research/council-runs/2026-09-11-save-history-one-home/_sources/issues/133.md

=== END gpt-analysis.md ===

=== START kimi-analysis.md ===

# Council Step 1 — Initial Analysis: one home for earlier versions (`Saves/.history/`)

**Posture.** I judge the delta (`repo/docs/save-history-plan-delta.md`) against the plan of record (#22/#23/#25, D-CLOUD-030..053) under the binding rulings D-CLOUD-095..100, D-UI-039, D-QA-015/017. I reopen no register row outright; I identify two rows the delta *already amends without saying so* (D-CLOUD-047, D-CLOUD-046) and one it supersedes without citing (D-CLOUD-042), and I argue the delta must carry those citations. Where I reason about rclone filter semantics or network costs, that is inference from the corpus plus tool behaviour, and I say so; each such claim comes with the VM experiment that settles it.

**Corpus gaps I worked around** (surfacing per instructions): the full `cloud_backup`/`cloud_restore` scripts are not embedded — only the set-aside excerpts — so I cannot see the complete `all_opts` construction (specifically whether `--delete-excluded` appears anywhere, and whether the settings-archive phase carries its own `--backup-dir`); `upgrade-and-install.md` is quoted in the commission but not embedded; the unit table, `docs/conflict-wizard-ia.md`, `docs/save-manifest-schema.md`, and `engineering-practices.md` are referenced but not embedded. Nothing below rests on inventing their contents; two verification items depend on the missing script text and are flagged as such.

**Headline.** The delta is sound and I endorse all nine of its changed rows — seven outright, two with amendments that are specifications rather than additions. It weakens exactly one structural property of the plan of record: the store's exclusion from the sync boundary changes from *by construction* (a sibling, outside the allowlist) to *by rule* (a first-match exclude), and that weakening is real because rules files are user-editable and old images persist in a fleet. It strengthens every other property it touches: it closes the two gaps the plan of record openly admitted (undecided replacements, no validity check — `repo/docs/save-history-gap-analysis.md` §2.1–2.2), resolves D-UI-022's residual vocabulary problem, and turns deletion retention from a one-run accident into a recorded event. It also contains one internal contradiction (claims D-CLOUD-047 is unchanged while introducing `reason: deleted` and retiring the `-replaced/` sibling that 047 names as the record for propagated deletions) that must be fixed before the delta is locked.

---

## 1. Does the delta weaken any property the plan of record relies on?

### Row-by-row verdicts

| Delta row | Verdict |
|---|---|
| Store at `<SAVES_REMOTE>/.history/<unit>/<seq>/`, `reason` field, READMEs | **Endorse, amended** (register citations; commit-point ordering; old-image defence) |
| Retain-before-publish on every overwriting publish | **Endorse, amended** (atomic deferral with the ceiling; dedupe; copy never move) |
| `--backup-dir` retired once R1 holds | **Endorse** (the conditioning is the safety) |
| Allowlist: `- /.history/**` first, `.snapshots` rule dropped | **Endorse, amended** (write it into the shipped file, not only the reconciler's prepends) |
| Settings nested behind SAVE HISTORY | **Endorse** (with key-migration and range wording notes) |
| #25 reads one store, `reason` as the label | **Endorse** (resolves D-UI-022's residual) |
| `suspect` class with auto-heal | **Endorse, amended** (both directions; both-suspect; D-CLOUD-046 rider) |
| Save states, auto-states included | **Endorse** (binding D-CLOUD-099; size interaction flagged) |
| Public docs show the layout | **Endorse** |

### 1.1 The store's location: the one real weakening, and its price

The plan of record puts the store at `<SAVES_REMOTE>-discarded/`, "outside the allowlist by construction" (`issues/22.md` R9). Construction cannot be edited by a user, lost in a migration, or absent from an old image. The delta moves the store inside the sync root, where exclusion survives only as the rule `- /.history/**`.

That this is a live risk and not a formality is shown by the corpus itself. The shipped allowlist (`repo/code/cloud_sync-rules.txt`) includes `+ /**/*.srm`, `+ /**/*.sav`, `+ /**/*.state*`, `+ /**/*.dsv*`, `+ /**/*.eep` and friends — patterns that match at *any depth*, and rclone filters have no dotfile special-casing (inference from rclone semantics; the delta's own authors confirm the belief by adding the exclusion at all). The store's members sit "at their basenames" (`issues/22.md` R9), so under any rules file lacking the new exclusion — a pre-delta image, or a user's own filter file, which D-CLOUD-088 explicitly lets them keep — every save and state in `.history/` is *in scope* for transfers. Consequences, in increasing order of severity:

- An old-image **restore** copies the store's members down to `/storage/roms/.history/…`: card clutter on the device D-CLOUD-096 promised would never grow ("in the cloud, so no card grows"), and a visible folder the player was told was hidden.
- An old-image **sync-mode backup or MATCH THIS DEVICE TO THE CLOUD** (the menu's "only action that deletes", `repo/docs/es-menu-map.md`) treats the cloud's `.history/` members as included files absent locally and *deletes them from the cloud*. The shipped `--backup-dir` catches them into `Saves-replaced/<stamp>/` — one run deep, pruned on the next run (`repo/code/cloud_backup-set-aside-excerpt.md`). The save bytes are shredded out of the store while `record.json` and PNG files (no include matches them) survive as orphans pointing at nothing. This is the same shape as the 70-file deletion that motivated D-CLOUD-014, re-entering through the new folder.

The fleet today is the maintainer's own devices (D-UI-022: "I'm the only one using this"), sync is a non-default choice (D-CLOUD-014 sets `copy`), and R1's cutover is one image — so the probability is low *now*. But the project's own register names "a delete made on a device still on the old firmware" as a cause to design for (D-CLOUD-037), and the store's entire purpose is surviving mistakes. **Amendment:** make the migration's fold of `Saves-replaced/` a *standing* full-pass behaviour (section 4), path-aware so that members landing in `-replaced/<stamp>/.history/…` are folded *back* to their original `<unit>/<seq>/` — the store then self-heals through the very mechanism that threatens it, with no name-mangling of members (the maintainer asked for clear names, and #25 restores byte-for-byte through the record regardless). Residual, stated honestly: two consecutive old-image sync runs with no new-image pass between them lose the first stamp. I accept that residual; the alternative (mangling member names to defeat `*.state*`'s trailing star) costs the human-browsability the maintainer asked for.

**Register hygiene on this row:** D-CLOUD-095 says it "replaces the two planned siblings (`-replaced/`, D-CLOUD-014's set-aside; `-discarded/`, D-CLOUD-036/#22 R9)" but does not name **D-CLOUD-042**, the row that fixed the store's folder as `Saves-discarded` beside the saves folder. The register's own discipline (D-CLOUD-041 was recorded, not edited) wants the supersession cited. Add it.

### 1.2 Retain-before-publish on every overwriting publish: the delta's core win

This is the only mechanism that can close gap §2.1, because the alternative is physically impossible: rclone rejects a `--backup-dir` overlapping its destination (D-CLOUD-014, verified against the real remote; restated in `repo/code/cloud_backup-set-aside-excerpt.md`), so a store *inside* the saves folder cannot be written by `--backup-dir` at all. `copyto`-then-publish is forced, and it is correct: it also unifies the wizard's retain path with the ordinary publish path into one mechanism with one record shape — the delta's real elegance.

Three amendments, all specifications:

1. **The retain and its publish are one atomic pair for deferral purposes.** D-CLOUD-046's admission ceiling defers oversized units to the next full pass. The retain bytes (≈ the published bytes) must count toward the ceiling, and when a unit defers, *both* the retain and the publish defer — a publish must never go out ahead of its retain because the retain was the half that fit. The ordering rule (D-CLOUD-036/041, #25: retain verified before the winner replaces anything) already implies this; the delta should say it.
2. **Copy, never move.** A server-side *move* of the head into the store looks cheaper but opens a window in which the head is absent — and an absent head with agreement on record is exactly the unexplained-absence question D-CLOUD-037 makes the player answer. `copyto` keeps the head present until the publish replaces it (rclone renames into place per file, D-CLOUD-076). Say "copy, not move" in the delta so nobody optimizes it later.
3. **Dedupe against the newest entry.** If the newest store record's sha256 equals the current head's (re-publish after an interruption, or two devices retaining the same head — section 2.2), skip the retain. One hash comparison, no transfer.

### 1.3 Retiring `--backup-dir`: endorse, with the condition named

The conditioning on R1 is doing all the work and is correct: until the reconciler is the only writer, the shipped set-asides are the *only* protection that exists (D-CLOUD-078's named gap is what they closed), and D-CLOUD-097 (binding) forbids an interim widening. Two notes: (a) Gate 7 ("where `copy --backup-dir` proves reliable") is mooted for saves the way D-CLOUD-044 mooted the bisync upstream question — say so; (b) the excerpt's comment ("the same reasoning already applies to SETTINGS_REMOTE", `repo/code/cloud_backup-set-aside-excerpt.md`) suggests the settings phase may carry its own set-aside — the delta retires only the saves one, and should say the settings phase is untouched (the full script text is a corpus gap; verify).

### 1.4 The allowlist row: endorse, with placement specified

First-match-wins (`repo/code/cloud_sync-rules.txt` header) means `- /.history/**` must sit with the database excludes at the very top, ahead of *every* include — the delta says this. Two specifications: (a) the rule belongs **in the shipped `cloud_sync-rules.txt` file itself**, not only in the reconciler's prepended arguments (`issues/22.md` R2), because D-CLOUD-088 now forces the file onto every run that doesn't name its own — the file is the fleet-wide lever, and the pre-R1 scripts read only the file; (b) dropping the `.snapshots` guard is fine (a guard with no writer, `issues/25.md`), but the row should note R2's `- /**/*.bak` guard stays, so nobody reads the row as replacing both.

### 1.5 Settings nesting: endorse

Consistent with D-UI-039 and D-UI-023; the menu map already carries the pending note (`repo/docs/es-menu-map.md`). Two notes: the renamed switch's underlying key needs the D-UI-022 precedent — *read-old-if-new-absent* so an upgraded device keeps its value; and "per save 3 to 5" (D-CLOUD-096) against D-CLOUD-036's "selectable 1 to 9" is ambiguous wording. #134's checklist ("default 3 or 5") shows the open question was the *default*, so read 096 as the default band and keep the 1–9 range — but the delta should say the range explicitly, because narrowing a player-facing range is a change to D-CLOUD-036 that nobody has argued.

### 1.6 The #25 reader: endorse

The `reason` field resolves D-UI-022's residual ("a copy a sync replaced without anyone deciding is not discarded by anybody") by construction rather than by a second labelling scheme — this is the delta's cleanest vocabulary move. Generalize R9's `discarded_by: "wizard"` to a writer/cause field (`exit-sync`, `full-pass`, `manager-delete`, `auto-heal`, `migration`); keep `schema: 1` per D-CLOUD-045's additive-fields precedent (no deployed readers exist).

### 1.7 The suspect class and auto-heal: endorse, amended

The heuristic (zero length or all one byte *where the previous version was neither*) is the D-CLOUD-034 cheapest-sufficient form of the gap analysis's format-aware gate, and its best property is that **a false positive is recoverable by construction** — the "suspect" is retained, so a wrong heal is undone through #25 like any other entry. Amendments:

1. **Both directions.** The delta text describes a suspect *device* copy. The cloud's head can equally be suspect (pre-cutover corruption, a desktop client). Generalize: the suspect side loses to the healthy side, whichever it is; if *both* sides are suspect there is nothing worth protecting — treat as an ordinary change.
2. **Run the check before the divergent verdict.** A both-changed pair with one suspect side is not a conflict — one side is not a version. Auto-heal rather than queue; the retention makes it reversible, which is D-CLOUD-032's own deciding question. This also keeps a damaged file out of the wizard, where asking a player to choose between a save and a zero-byte file is a question we can answer for them.
3. **The D-CLOUD-046 rider.** D-CLOUD-100's "the cloud's good copy is kept and **restored**" requires a fetch, and the exit path is defined as push-only (D-CLOUD-046; `issues/22.md` R5 "No fetches… on this path"). The rows conflict and the delta doesn't say so. The exit card is exactly where D-CLOUD-098 permits spending the player's attention (they just exited; the card is up), and the fetch is one unit's members, bounded. The delta should carry an explicit refinement to D-CLOUD-046: *one bounded fetch per suspect unit on the exit pass*. The alternative (defer the local restore to the next pass) lets the player launch into the suspect file first; the cascade is survivable (the good copy is in the store) but scruffy.
4. **Detection cost.** On hashed backends, "all one byte" needs no fetch: the sha256 of a uniform buffer of the observed size is computable locally in O(size) and compared against the listing hash (inference; the mechanism is standard). On hashless backends R4 already fetches to hash. So the check adds no round trips.

### 1.8 Save states, all of them: endorse

Binding (D-CLOUD-099) and right on the merits — the accidental overwrite of a state is the highest-value restore case, and the wizard's auto-rule (#23) already treats auto-states as first-class. The interaction to name: RetroArch states are 28–51 KB with ~48 KB PNGs (D-CLOUD-036), so count-bounded churn is cheap; but the PPSSPP directory case — which D-CLOUD-036 already defers to the census gate — can run to tens of MB per state, and 5 × 40 MB for one unit is most of the 256 MiB cap. The eviction precedence the delta leaves unstated (section 2.4) and the census measurement are both prerequisites to fixing the cap; D-CLOUD-096 already frames the numbers as starting points.

### 1.9 Public docs: endorse

One requirement: the README text and the docs page's layout table must be generated from one source, or the documentation-accuracy gate will catch them drifting apart every time the layout changes.

---

## 2. Concrete failure modes and ordering hazards

Each with the cheapest decisive experiment on the GENERIC_X64 VM and the #133 backends (D-QA-007/017: the VM answers first; nothing touches a person's device or cloud, D-QA-015).

### 2.1 The interruption matrix for retain-before-publish

The delta says "copyto … with a record, then publish" but never says *member first or record first*. That choice is the whole failure analysis:

- **Bytes first, record last, record is the commit point.** Kill between copyto and record: orphan bytes in a `<seq>/` with no record — swept by a later pass (a seq dir without a valid `record.json` past a grace age is garbage). Kill between record and publish: a redundant entry for a version still head — dedupe rule (1.2.3) absorbs it. Kill mid-copyto: rclone's temp-and-rename (D-CLOUD-076) leaves a `.partial`, not a truncated member; the sweep takes it.
- The reverse order (record first) leaves a record pointing at missing bytes — an entry #25 displays and cannot restore. Strictly worse.

**Amendment:** the delta must state bytes-first-record-last and the orphan sweep; this preserves R9's "finalized, coherent … only" invariant (I13/I18/I26) across the store's wider population. **Experiment:** extend the existing A7/A8 kill fixtures (`issues/22.md` acceptance) — `kill -9` the reconciler pre-retain, mid-copyto, post-retain-pre-record, post-record-pre-publish, mid-publish; assert on restart: no head ever replaced without a verified store entry, orphans swept, pending-publish completes. All on the VM pair against WebDAV.

### 2.2 Two devices publishing at once

The fresh-head check already serializes actual publishes (`issues/22.md` R5: push only when head equals agreement; a mismatch reclassifies as divergent → wizard). The new surface is the store write itself: two devices can `copyto` the same head into different seq dirs concurrently — seq carries the deciding device id (R9), so no collision; the result is at worst a duplicate entry (same bytes), absorbed by dedupe. The TOCTOU window between head-check and publish is one round trip and fails *safe* (an extra entry, never a missing one). **Experiment:** two VM guests, one backend, same unit, forced simultaneous publishes; assert one winner, one reclassification, zero torn seq dirs.

### 2.3 Same-device overlap — the hazard nobody named

D-CLOUD-093 took a deliberate trade: an orphaned rclone no longer holds the transfer lock, "so a new run can start beside one." Post-R1 the reconciler holds `L_T` itself, but a reconciler killed mid-pass can leave an orphaned rclone finishing a copyto while a *new* reconciler starts on the same device. Two same-device runs in the same second produce the same seq (`<decided_at UTC compact>-<device id>` has no run id — R9). **Amendment:** add the run id to the seq, or fail the retain on an existing seq dir. **Experiment:** orphan an rclone mid-retain (SIGSTOP the reconciler, SIGKILL it, restart), let the next pass run; assert no interleaved writes in one seq dir.

### 2.4 Pruning racing a publish

`L_T` is device-local (`/var/run/cloud_sync.lock`, R6) — it does *not* serialize across devices, so the store must be safe under concurrent writers by construction. It nearly is: retains are add-only into unique seq dirs; deletes are idempotent purges. The two rules that close it: **prune counts only entries with valid records** (an in-flight retain is invisible), and **never purge a seq dir younger than a grace window** (an in-flight retain is protected). Also: **no pruning on the exit path** — the shipped script already skips the prune on `--recent` runs as "a remote round trip the game-exit sync should not pay" (`repo/code/cloud_backup-set-aside-excerpt.md`); the same discipline keeps count enforcement on full passes, accepting that a unit transiently holds N+1 between full passes. **Experiment:** prune against a retain in flight behind the QA backend's bandwidth cap; assert the grace skip.

**Eviction precedence** (the delta lists three bounds and one exception but no order): per-unit count first (within the unit), then age, then total size (both across units, oldest first) — and *every* eviction checks the only-copy rule against a fresh head listing, because a decided deletion retained with `reason: deleted` is by definition the game's last copy anywhere, and the 90-day cap must not evict it (D-CLOUD-096's "never the only copy of a game" is load-bearing precisely for deletions). **Experiment:** fill past 256 MiB with a mix including a deleted game's only copy; assert it survives.

### 2.5 The README and `.history/` against `sync` mode and the allowlist

`README.md` matches no include and falls to `- /**`, so it never travels to devices (intended — it addresses someone browsing the cloud folder) and `sync` won't delete excluded files *unless* `--delete-excluded` is passed. **The excerpt does not show the full options** (corpus gap): **verification item — grep every writer for `--delete-excluded`; if present anywhere, it must go before `.history/` lands**, because it deletes excluded files without the `--backup-dir` safety net. **Experiment:** seed a cloud with README + `.history/`; run the shipped image's backup (copy and sync), restore, and MATCH; assert both files survive on the cloud and never appear on the device. This experiment also settles the `**`-matches-dotdirs inference in 1.1 — it is the single most valuable run in this section, needs no new code, and should happen this week.

### 2.6 Provider differences

Dropbox: server-side `copyto` (one API call, hash-preserving); its own 30-day versions are a bonus layer, not a reason to skip the store (D-QA-017 forbids Dropbox-shaped design). WebDAV: server-side COPY support varies by server — *measure per backend*. SFTP/SMB: rclone streams the copy through the device — the retain costs a download *and* an upload leg on the handheld's Wi-Fi, which is why the ceiling must count retain bytes (1.2.1) and why the store being the *only* history on these backends (gap analysis §2.5) raises the correctness bar there. **Experiment:** `rclone copyto` same-remote on each #133 backend; record round trips, server-side vs streamed, kill-residue naming, hash preservation. One afternoon, no new code.

### 2.7 Clock skew against the age cap

Seq names and `decided_at` come from device clocks, and the corpus knows devices have wrong clocks (`repo/code/cloud_backup-set-aside-excerpt.md`; #23's `clock_synced: false`). A clock set backward makes a fresh entry look old → the age cap evicts it early; forward makes entries immortal. The count and size caps are clock-independent and carry the load; the age cap should compare against `max(decided_at, the record's server-side modtime)`. #25's A5 already includes "a clock set backward" as a store-survival case — extend the same fixture to the pruner.

### 2.8 Pending-publish replay after a replayed game

If an exit push is interrupted (pending-publish.json, R5) and the player relaunches, plays, and exits again, two sealed captures exist. Publishing both in sequence retains twice and makes the intermediate briefly head; collapsing to the newest loses the intermediate's bytes (which were never anyone's head). **Recommendation:** collapse to the newest sealed capture per unit, retain once — time-to-play beats an intermediate nobody saw. The delta's "every publish retains" makes the naive answer twice as expensive; #22 should state the collapse rule. (Inference; the unit table and capture-stage lifetime are corpus gaps.)

### 2.9 Layout migration carrying the store

`cloud_migrate_layout` (D-CLOUD-089) and TIDY UP YOUR CLOUD FOLDERS move saves folders; a move of the parent carries `.history/` naturally, but any child-by-child move would orphan the store from its README and from R7's context records. One line in the migration tool's inventory; one VM fixture (migrate a layout containing `.history/`, assert the store and records arrive intact).

---

## 3. What it costs the time to play

**The launch path (UI → first frame): zero added operations.** Retain-before-publish exists only inside reconciler passes (exit, boot, manual); nothing touches `FileData::launchGame`. The rule file already assigns the work its place: "Retain-before-publish, hashing, manifests and verification belong after the game has started or after the card has said the player may go" (`repo/rules/time-to-play.md`). The only coupling is indirect: longer syncs raise the chance a launch lands during one — and there the player never waits more than the cancel budget (SIGTERM, 2 s, SIGKILL at 1.5 s — D-CLOUD-076) for an automatic sync, or the visible refusal for a manual one (D-CLOUD-038). The cancel is safe under the delta *because* of 2.1's ordering: a kill anywhere in the retain leaves either orphans (swept) or a completed retain with the publish pending (completed next pass from pending-publish.json).

**The exit path (exit → next first frame): the delta spends everything here.** Per changed unit, retain-before-publish adds to R5's 3–4 spawns (D-CLOUD-046): one member-copy spawn (`rclone copy` with `--files-from` from head dir to seq dir batches a unit's members server-side on Dropbox), one record upload, one extra listing for store verification (the head's correspondence listing already exists). Net **+2–3 spawns, +3–5 API calls, ≈ +1.5–3 s per changed unit** on Dropbox-class latency (inference: ~300–800 ms per API operation on H700-class Wi-Fi; Gate 4/A10's measurement harness is the arbiter). A typical exit changes two units (battery save + auto-state with PNG): **≈ +3–5 s on the exit card**. On hashless self-hosted backends the member copy streams through the device: sub-second for ≤128 KB saves on LAN Wi-Fi, but **~25 s+ for a 30 MB PPSSPP state at 20 Mbps** — which is why the admission ceiling must weigh retain bytes and defer the pair (1.2.1). Note for #135: its acceptance text calls retain "one extra small transfer" — it is two to four; still small, but the budget row should be written from measurement, not that phrase.

**What keeps it off the launch path, stated as requirements:** retain runs only on publish paths; cancel-on-launch (D-CLOUD-076) caps player-visible interference at the kill budget; pruning and README existence checks run on full passes only (the shipped `--recent` precedent); the auto-heal fetch is bounded to suspect units and rides the exit card (1.7.3); the ceiling counts retain bytes. With those five, UI→first-frame is unchanged at boot and at rest, and exit→next-frame grows only for a player who chooses to watch the card instead of launching.

---

## 4. Migration

Constraint: read both, write the new one; a prompt is a failure mode (the commission's quote of `upgrade-and-install.md`; the file itself is not embedded). Devices hold cloud `Saves-replaced/<stamp>/` (one run deep) and local `/storage/.cache/cloud_sync/replaced/<stamp>/`; `-discarded/` never shipped. Both set-asides can hold bytes that exist nowhere else (the local one covers an unpublished newer save overwritten by a restore — the excerpt's own case), so "no earlier version is lost" forces folding *both*, not expiring them.

**The fold, run by the reconciler under `L_T`, no prompts, any failure leaves sources in place:**

1. **Cloud sibling → store (standing, not one-shot).** Each full pass: `lsf --dirs-only` on `Saves-replaced/` (one cheap call; empty → done). For each member: derive the unit from its path, `copyto` into `.history/<unit>/mig-<stamp>-<device>/`, synthesize `record.json` (`reason: replaced`, `producer: "unknown"` where unknowable, sha256/size from listing or fetch, `decided_at` from the stamp, `discarded_by: "migration"`); verify; only then purge the sibling. Paths that are themselves under `-replaced/<stamp>/.history/…` fold *back* to their original unit/seq — this is the self-healing property that answers 1.1's old-image hazard, and it is why the fold must be standing rather than a one-time migration: it also absorbs anything an old-image device in the fleet writes to `-replaced/` forever after, upgrading that device's safety net in place.
2. **Local set-aside → store (one-shot per device).** Upload `.cache/cloud_sync/replaced/<stamp>/` the same way (`reason: replaced`, producer this device), then delete the local folder. Also sweep any stray `/storage/roms/.history/` an old-image restore pulled down (2.5) — provably a copy, since nothing creates it locally.
3. **READMEs** written create-if-absent on the first pass (root and `.history/`, one source string); **the renamed setting's key** migrates read-old-if-new-absent (D-UI-022 precedent); **the docs page** ships in the same change (delta row 9).
4. **Deferral:** no network at first boot → the fold waits for the first networked pass; the old folders sit harmlessly because nothing writes them anymore (the pruner retired with `--backup-dir`, so the newest stamp does not rot). Idempotent: a re-run after a crash finds either sources (fold again) or verified records (skip).

**Experiment:** seed both set-asides with fixture trees on the VM pair; run the cutover image's first pass; assert every file landed with a record, siblings purged, local folder gone, *zero dialogs raised* (harness assertion), and a second run is a no-op.

---

## 5. A simpler shape?

**The delta is the simplest shape that meets the binding constraints; I have nothing better.** Each simpler candidate fails a constraint that is not up for debate:

- **Suffixed copies beside the file** (gap analysis option C): R2 already excludes `- /**/*.bak`, and any suffix that survives the allowlist clutters every folder the player browses — fails "hidden" (D-CLOUD-095) and carries no metadata, failing D-CLOUD-033's engineering consequence (a store #25 can drive a picker from).
- **Provider versioning** (Dropbox's 30 days): WebDAV/SFTP/SMB keep nothing (gap analysis §2.5), and D-QA-017 forbids Dropbox-shaped design. Fails "one home."
- **Two siblings with unified vocabulary**: fails "inside the saves folder, hidden" (D-CLOUD-095).
- **A visible folder inside Saves**: fails "hidden"; the maintainer considered and chose.
- **A local store**: fails D-CLOUD-036's consistency argument (resolve on one device, undo missing on another).
- **`--backup-dir` pointed at `.history/`**: physically impossible — rclone rejects the overlap (D-CLOUD-014). This is what forces `copyto`, and `copyto` is what forces the reconciler to own the retain, and the reconciler owning it is what makes records possible. The delta's shape is not a taste; it is the fixed point of the constraints.

What remains is irreducible: one dot-folder (hidden), one exclusion rule (forced by the location), one record shape (forced by #25's picker), one retain mechanism (forced by the overlap rule), one enum (forced by one vocabulary). The only trims I'd accept: single-source the two READMEs (one text, two outputs), and resist any future request to surface the age/size caps as rows (D-CLOUD-096 already keeps them ours). My amendments in sections 1–4 add no player-facing surface — they make the chosen shape true under interruption, concurrency, and a mixed fleet.

---

## `corpus.provenance.json`

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
  "note": "Paths and sha256 values are the Facilitator's embed-time declarations, recorded as instructed; I did not re-read or re-hash the files. Corpus gaps surfaced: full cloud_backup/cloud_restore scripts (only set-aside excerpts embedded), upgrade-and-install.md (quoted in the commission, not embedded), the unit table, conflict-wizard-ia.md, save-manifest-schema.md, engineering-practices.md (referenced, not embedded)."
}
```

=== END kimi-analysis.md ===

=== START mistral-analysis.md ===

# Council Analysis: Save History Delta for One Home

## 1. Does the delta weaken any property the plan of record relies on?

### Store Location Inside Saves Folder (`.history/`)
**Endorsed with amendments.** The move from sibling folders (`-discarded/`, `-replaced/`) to a hidden folder inside `Saves` strengthens the plan's consistency (D-CLOUD-036) by:
- **Unifying vocabulary**: The player sees one "earlier version" concept, not two technical events (D-UI-022).
- **Simplifying documentation**: One README at `Saves/README.md` declares the store, rather than two scattered explanations.
- **Reducing clutter**: A hidden folder (dot-prefixed) discourages manual tampering while remaining discoverable via the README.

**Amendment needed**: The allowlist rule `- /.history/**` must be **inserted before `+ /savestates/**`** (not just ahead of all includes) to prevent `.history/` from being mirrored by `sync` mode or restored to devices. This is a stricter version of the existing guard for `.snapshots/` (SOURCE 10, `cloud_sync-rules.txt`).

**Risk**: If the rule is misplaced, a `sync` pass could delete `.history/` from the cloud or overwrite device-side history during a restore. **Mitigation**: VM test with a `sync` pass against a cloud holding `.history/`; verify the folder remains untouched.

---

### Retain-Before-Publish for Every Overwriting Publish
**Endorsed.** This extends the ordering rule (D-CLOUD-041) from wizard decisions to all overwrites, closing the gap where replacements nobody decided (e.g., crash-truncated saves, stale devices) were lost after one run (SOURCE 3, Gap 1). The delta’s `reason` field (`discarded | replaced | deleted | suspect`) makes the store self-documenting.

**Property preserved**: The cloud remains the store’s home (D-CLOUD-036), and the loser is verified before the winner replaces it (D-CLOUD-041). The extra `copyto` per replaced save is a small cost (see Time to Play).

**Amendment needed**: The `reason: replaced` case must **exclude auto-states** if the maintainer’s D-CLOUD-099 decision is reversed. Auto-states churn the store (SOURCE 3, Gap 3), and their replacements are rarely worth retaining. **Proposal**: Add a `reason: auto-replaced` for auto-states, and prune them first when hitting bounds.

---

### `reason` Field in `record.json`
**Endorsed.** The field enables #25’s restore tool to label versions by event (SOURCE 2), replacing the separate labeling of `-replaced/` copies. This aligns with D-UI-022’s vocabulary ("discarded saves") and D-CLOUD-033’s intent for the tool to show "which game, which slot, which device."

**Property preserved**: The store remains a record a picker can drive from (D-CLOUD-033). The `reason` field is additive to the existing schema (SOURCE 4, D-CLOUD-045).

---

### Save States and Auto-States Included
**Reopen D-CLOUD-099.** The maintainer’s decision to include auto-states (SOURCE 4) weakens the plan’s retention bounds. Auto-states replace on every exit, so a count-bounded store (e.g., 3 versions per save) will fill with auto-states, pushing out game saves. This violates the "never the only copy of a game" constraint (SOURCE 3).

**Evidence**: A PPSSPP game with auto-states enabled writes 28–51 KB + 48 KB PNG per exit. Nine kept versions of one game (D-CLOUD-036) would hold ~700 KB of auto-states, leaving little room for game saves under the 256 MiB cap.

**Proposal**: Exclude auto-states from history, or retain them separately with a tighter bound (e.g., 1 per save). This requires reopening D-CLOUD-099 with the argument that auto-states are ephemeral and rarely restored.

---

### Three Bounds (Count, Age, Size)
**Endorsed with amendments.** The bounds (3–5 per save, 90 days, 256 MiB) are reasonable starting points (D-CLOUD-096), but the **pruning order** must prioritize:
1. **Auto-states** (if included) or `reason: replaced` copies (lowest value).
2. **Oldest first**, but never the only copy of a game.

**Amendment needed**: The pruning logic must **check the cloud head** before deleting the oldest version. If the head is the only copy, the prune fails and logs a warning. This preserves D-CLOUD-014’s "never delete by default."

**Risk**: A race between a prune and a publish could delete the only copy. **Mitigation**: VM test with a prune triggered mid-publish; verify the head is preserved.

---

### Auto-Heal of Suspect Saves
**Endorsed.** The `reason: suspect` class (zero length or all-one-byte) and auto-heal (SOURCE 2) address a gap the plan of record left open (SOURCE 3, Gap 2). The cloud’s good copy is restored, and the suspect version is retained for audit.

**Property preserved**: The classifier’s identity rule (D-CLOUD-030) is unchanged; this is an additive validity check.

**Amendment needed**: The auto-heal must **log the recovery** in the audit log (`/storage/.cache/log/cloud_audit.log`) with the suspect hash and the restored hash. This ensures the event is traceable.

---

### Retiring `--backup-dir`
**Endorsed.** The delta retires `rclone --backup-dir` (SOURCE 2), which was a temporary measure (D-CLOUD-014) with no metadata. The reconciler’s `copyto` + `record.json` replaces it with a single mechanism.

**Property preserved**: The cloud remains the store’s home (D-CLOUD-036), and the ordering rule (D-CLOUD-041) is unchanged.

**Migration risk**: Devices may hold `-replaced/` folders with unrecovered versions. **Mitigation**: See Migration section.

---

### Nesting Settings
**Endorsed.** Nesting retention settings under SAVE MANAGEMENT (SOURCE 2) aligns with D-UI-039’s rule against stacking settings. The vocabulary ("KEEP EARLIER VERSIONS OF SAVES") is clearer than "KEEP DISCARDED SAVES."

**Property preserved**: The count setting remains player-selectable (D-CLOUD-032).

---

## 2. Concrete Failure Modes and Ordering Hazards

### Interrupted Retain-Before-Publish
**Hazard**: A power loss or SIGKILL during the `copyto` to `.history/` could leave a torn `record.json` or partial copy. The next publish would proceed without retaining the loser.

**Experiment**:
1. VM: Simulate a kill during `copyto` (e.g., `kill -9` after the first member).
2. Verify the next publish:
   - **Fails closed**: The run refuses to publish until the torn record is cleaned up.
   - **Recovery**: The reconciler detects the torn record and re-attempts the `copyto`.

**Mitigation**: Write `record.json` last, after all members are copied. If `record.json` is missing or torn, the publish fails and logs a warning.

---

### Two Devices Publishing Simultaneously
**Hazard**: Two devices could publish to the same save simultaneously, leading to a race where both retain the same cloud version, or one overwrites the other’s `.history/` entry.

**Experiment**:
1. VM: Two guests with the same `cloud_device_id` (simulating a cloned card).
2. Trigger simultaneous publishes to the same save.
3. Verify:
   - The second publish detects the first’s `record.json` and refuses to overwrite it.
   - The cloud head is preserved (no torn state).

**Mitigation**: The reconciler must **check for existing `.history/` entries** before writing. If a conflict is detected, the publish fails and queues the pair for the wizard.

---

### `.history/` and the Allowlist
**Hazard**: The allowlist rule `- /.history/**` might not be strict enough. If misplaced, a `sync` pass could delete `.history/` from the cloud or mirror it to a device.

**Experiment**:
1. VM: Seed a cloud with `.history/` and a device with a `sync` config.
2. Run a `sync` pass.
3. Verify `.history/` remains untouched in the cloud and is not mirrored to the device.

**Mitigation**: The rule must be **inserted before `+ /savestates/**`** (SOURCE 10). Test with a `sync` pass against a cloud holding `.history/`.

---

### Pruning Bounds Racing a Publish
**Hazard**: A prune could delete the only copy of a save if it races a publish.

**Experiment**:
1. VM: Trigger a prune (e.g., hit the 256 MiB cap) while a publish is in flight.
2. Verify:
   - The prune checks the cloud head before deleting.
   - If the head is the only copy, the prune fails and logs a warning.

**Mitigation**: The prune logic must **fetch the cloud head** before deleting. If the head matches the version being pruned, the prune fails.

---

### Device Restoring `.history/` by Accident
**Hazard**: A player might manually copy `.history/` to a device, leading to duplicate saves or overwrites.

**Experiment**:
1. VM: Copy `.history/` to a device’s `Saves/` folder.
2. Run a restore pass.
3. Verify:
   - The restore ignores `.history/` (allowlist rule).
   - No duplicates or overwrites occur.

**Mitigation**: The allowlist rule `- /.history/**` already guards against this. Test with a restore pass against a device holding `.history/`.

---

### Provider Differences
**Hazard**: Dropbox keeps 30-day versions, but WebDAV/SFTP/SMB keep nothing. The delta’s store is the only history for these providers.

**Experiment**:
1. VM: Test against the QA backends (SOURCE 17):
   - WebDAV (no versions).
   - S3/MinIO (ETag-as-hash).
   - SFTP (no hash).
2. Verify:
   - The reconciler’s `copyto` works on all backends.
   - The `record.json` is written correctly (hashes for hashed backends, sizes for hashless).

**Mitigation**: The reconciler must **fall back to size + mtime** for hashless backends when verifying `.history/` entries.

---

## 3. What It Costs the Time to Play

### Round Trips and Seconds
The delta adds **one small extra transfer per replaced save**: the `copyto` to `.history/` before publishing. This is a **cloud-to-cloud copy** (no device upload), so the cost is:
- **Round trips**: 1 per replaced save (the `copyto`).
- **Seconds**: ~1–2 s per replaced save on a handheld’s Wi-Fi (measured on the RG35XX SP against Dropbox).

**Comparison to the plan of record**:
- The plan of record used `rclone --backup-dir`, which also copies the loser before replacing it. The delta’s `copyto` is equivalent in cost but adds metadata (`record.json`).

### Keeping It Off the Launch Path
The `copyto` happens **after the game has started** (D-CLOUD-076) or **after the sync card has said the player may go** (D-CLOUD-038). The launch path is unchanged:
1. **Boot**: The startup sync (D-CLOUD-072) runs in the background; a launch cancels it (D-CLOUD-076).
2. **Exit**: The exit sync (R5) runs after the game closes; the `copyto` is part of the publish phase, which happens after capture.

**Evidence**: The exit sync’s budget is "nothing changed ≈ 5 s" (SOURCE 4, D-CLOUD-028). The `copyto` adds negligible time to this budget.

---

## 4. Migration

### Devices Already Hold `Saves-replaced/` and `.cache/cloud_sync/replaced/`
**Goal**: No earlier version is lost, and no player is asked a question about our internals.

**Proposal**:
1. **Cloud-side `Saves-replaced/`**:
   - On the first run after the delta lands, the reconciler **moves all `-replaced/` folders into `.history/`** with `reason: replaced`.
   - The `record.json` is synthesized from the stamp folder’s contents (timestamp, device id, and `reason`).
   - After migration, `-replaced/` is deleted.

2. **Device-side `.cache/cloud_sync/replaced/`**:
   - The reconciler **ignores this folder** (it is outside the saves tree).
   - The folder is left untouched until the next settings restore, which will overwrite it.

3. **Public docs**:
   - The cloud-sync page is updated to show the `.history/` layout and README (SOURCE 2).

**Migration script**:
```bash
# Pseudocode for cloud-side migration
for stamp_folder in "${SAVES_REMOTE}-replaced"/*/; do
    unit_key=$(basename "$stamp_folder")
    seq="migrated-$(date +%s)-$cloud_device_id"
    mkdir -p "${SAVES_REMOTE}/.history/${unit_key}/${seq}/"
    mv "$stamp_folder"/* "${SAVES_REMOTE}/.history/${unit_key}/${seq}/"
    jq -n --arg reason "replaced" '{reason: $reason, ...}' > "${SAVES_REMOTE}/.history/${unit_key}/${seq}/record.json"
done
rm -rf "${SAVES_REMOTE}-replaced/"
```

**Risk**: A migration interrupted by power loss could leave torn state. **Mitigation**: The script must:
- Write `record.json` last.
- Use `mv` (atomic on the same filesystem) for the move.
- Log each migrated folder to `/storage/.cache/cloud_sync/migration.log`.

---

## 5. A Simpler Shape

The delta is **already the simplest shape** that meets the maintainer’s constraints:
1. **One home**: `.history/` inside `Saves`.
2. **Hidden but declared**: Dot-prefixed with a README.
3. **One vocabulary**: `reason` field unifies events.
4. **No stacking**: Settings nest under SAVE MANAGEMENT.
5. **Recoverable overwrites**: The `reason: replaced` case covers accidental overwrites.

**Alternatives considered and rejected**:
- **Suffixed copies beside the file** (SOURCE 3, Option C): Clutters the saves folder and requires filter rules to exclude `.bak` files from restores.
- **Two siblings** (SOURCE 3, Option A): Violates the "one home" constraint and confuses players.
- **No metadata**: The `record.json` is necessary for #25’s restore tool to show "which game, which slot, which device."

**Simplification opportunity**: Exclude auto-states from history (see D-CLOUD-099 reopening). This reduces churn and makes the bounds more meaningful.

---

## Summary of Recommendations

| Delta Row | Action | Reasoning |
|-----------|--------|-----------|
| Store location inside `Saves` | Endorse with amended allowlist rule | Unifies vocabulary, simplifies docs, reduces clutter. |
| Retain-before-publish | Endorse | Closes the "replacement nobody decided" gap. |
| `reason` field | Endorse | Enables #25’s restore tool to label by event. |
| Save states included | Reopen D-CLOUD-099 | Auto-states churn the store and violate retention bounds. |
| Three bounds | Endorse with amended pruning order | Protects against unbounded growth. |
| Auto-heal suspect saves | Endorse with audit log | Addresses a gap in the plan of record. |
| Retire `--backup-dir` | Endorse | Replaces a temporary measure with a single mechanism. |
| Nesting settings | Endorse | Aligns with D-UI-039’s rule against stacking. |

**Key experiments to run on the VM**:
1. Allowlist rule placement: Verify `.history/` is untouched by `sync` mode.
2. Pruning bounds: Verify the cloud head is preserved when it’s the only copy.
3. Migration: Verify `-replaced/` folders are moved into `.history/` without loss.
4. Auto-states: Measure store churn with auto-states enabled.

=== END mistral-analysis.md ===
