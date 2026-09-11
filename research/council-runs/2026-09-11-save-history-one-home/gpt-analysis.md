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