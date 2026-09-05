Winner: claude.

I vote for **`claude-revised_plan-r2.md`**, with the pre-build corrections below. It has the strongest central rule: **obtain current evidence about the cloud before authorizing an overwrite**. That is more protective than silently choosing a winner and relying on an archive to make the choice recoverable.

None of the four plans yet specifies a complete, controller-accessible, one-step undo. I treat that as an amendment all four need, not as a failure to anticipate the maintainer’s later restatement.

Evidence references **E1–E14** resolve, in order, to the exact source paths and embed-time hashes in the provenance record below. I have not executed tests or independently re-read or hashed files.

## Why this foundation wins

`claude-revised_plan-r2.md` gets several important architectural boundaries right:

- Its changed-file exit path checks current cloud evidence before uploading, rather than treating a cached agreement as evidence that the cloud is still unchanged.
- Its hashless-backend rule does not equate equal size with equal content.
- Its main classifier compares **complete save-unit member maps**, including membership changes.
- It separates producer provenance, local possession, and agreement.
- It treats ES’s allocation and copying functions as primitives requiring a checked adapter—not as a reliable transaction API. The embedded code supports that concern: the auto-only allocation case can return `-99`, and `copyToSlot()` ignores its underlying copy/rename results. [E7, E8]
- It keeps #10 in the drop while recognizing that creating `es_savestates.cfg` changes launch behavior, not merely directory layout. The compiled defaults and XML-loaded configuration do differ materially. [E9]

These strengths matter more than its length. There are inconsistencies in its detailed execution protocol, but its governing model is the right one to repair.

## Comparison with the other plans

### `kimi-revised_plan-r2.md`

This is the closest competitor. Its recorded deletion intent, required move observation, explicit lifecycle lock ordering, unchanged-manifest discipline, and retention-on default fit the product well. It also correctly states the complete-member-map classifier.

Its decisive weakness is the exit protocol in §4.3: it consults **cached** foreign manifest claims, uploads, and verifies afterwards. It explicitly accepts that a fork created since the last full pass can be overwritten.

That is not merely the two-devices-concurrently-online edge case:

1. Device B last agreed on H₀.
2. Later, device A plays and publishes Hₐ.
3. Later still, B plays from its stale H₀ and produces Hᵦ.
4. B’s exit upload consults cached H₀ and overwrites Hₐ.

One player can produce this sequence without concurrent play. Even if `--backup-dir` preserves Hₐ, the player was never offered the conflict decision. A subsequent ordinary three-way pass can classify Hᵦ as a cloud-only change and propagate it without ever opening the wizard. **Recoverable bytes are necessary, but they do not replace conflict detection or player choice.** This is exactly why #22 must govern every write path rather than merely add a menu detector. [E4; E1, D-CLOUD-029]

Two further weaknesses reinforce that concern:

- Same-size, non-ROCKNIX changes on hashless backends remain invisible until a periodic full verification. A metadata hint cannot authorize an intervening overwrite. The corpus already documents the size-only failure mechanism. [E4, E14]
- Capture is explicitly allowed across an apply boundary, with a mixed unit expected to “self-correct” later. An atomic rename of one file does not make a multi-file capture coherent.

Those are more consequential than the winner’s extra metadata machinery.

### `gemini-revised_plan-r2.md`

This plan is compact and preserves several useful product choices, including default-on retention and recorded deletion intent. However, two specification errors affect the detector itself:

- It selects staged candidates using differences in size/mtime on hashless backends. A same-size, same-mtime content change may therefore never become a candidate. Hashing selected candidates cannot repair an incomplete selection.
- Its unit rule still says, effectively, “if any member is divergent, the unit is divergent.” That misses the disjoint-member fork:

  **Agreed:** `(a₀, b₀)`  
  **Local:** `(a₁, b₀)`  
  **Cloud:** `(a₀, b₁)`

  Neither individual file is divergent, but combining the one-sided changes manufactures `(a₁, b₁)`, which neither device produced. The winner’s complete-map rule detects this.

It also overstates `--backup-dir` recoverability before the relevant backend/race behavior is established. Its proposed manifest-only `--include` needs particular scrutiny: the embedded rclone guide warns that adding an include excludes everything else that does not match. An optimization that accidentally sends only the manifest would recreate this subsystem’s “success while doing nothing” failure. [E6]

Finally, replacing route detection with a ping to a remote IP is not a sound general solution across rclone’s remote abstractions. Reachable cloud services need not answer ICMP.

### `mistral-revised_plan-r2.md`

This is not sufficiently self-contained to become the build foundation:

- Its authoritative conflict table is an external reference to an earlier plan, not an included table.
- It reinstates provisional-agreement and recorded-loser rows without supplying their semantics.
- It presents the two-spawn budget as proven without embedded measurements supporting that implementation.
- Its `rom = matched stem` rule contradicts the signed-off schema’s ES-supplied ROM filename field. [E2]
- “Interrupted applies converge on re-run” does not specify how completion is distinguished from intent.
- Declaring D-CLOUD-029 “withdrawn” is not the append-only decision process the register requires. The stated operating choice—isolated storage and disabled toggles—does not itself require withdrawing that decision. [E1]

The shortness is attractive, but too much safety-critical behavior is left implicit.

## What the winner needs to satisfy the maintainer’s amendment

### 1. Ship one-step undo with conflict resolution

The winner’s §2.6.4 expressly distinguishes retained bytes from an undo control and defers the latter to #25. That boundary must change.

The minimum feature is:

- **Keep discarded saves is player-controlled and on by default.** Remove the optional fallback to IA rev 4’s off-by-default behavior.
- Before applying a resolution, preserve its complete affected save unit, associated thumbnails, provenance, and placement information.
- Retain a small, hash-bound **completed-resolution record**, not merely the pending apply file that is deleted on success.
- Offer **UNDO LAST RESOLUTION** on the completion screen and through a persistent save-management entry after that screen closes or the device reboots.
- Execute undo through the same checked apply path. If subsequent play has changed an affected file, do not blindly overwrite that new progress: retain it and surface the changed situation.
- Do not let routine autosaves or automatic backup pruning immediately evict the protected last-resolution undo.

This does **not** require a history browser, eight-deep rollback, or a new database. The winner already proposes most of the needed storage and apply machinery. The missing work is a bounded undo record, retention semantics, and a controller-facing action.

The eight-entry hash lineage has a detection purpose, not an eight-step rollback purpose, but it must earn its place independently. It must not become a prerequisite for delivering the much simpler wrong-choice undo.

Also, restoring old bytes creates a **new operation**, not a new content identity: their sha256 remains the same under D-CLOUD-030. [E1, E2]

### 2. Separate unexplained absence from deliberate deletion

I would not accept §2.10’s blanket deletion-propagation ban on its stated rationale. An unexplained absence should fail closed; that does not establish that an **observed player deletion** must be unsupported.

Use narrowly scoped, hash-bound intent receipts for ES operations the application actually observed. A receipt naming version H cannot delete a later occupant Y. Retirement remains copy–verify–delete, with the retained copy available to recovery. D-CLOUD-030 duplicate compaction must converge across devices regardless. [E1]

This preserves the capability without building a general-purpose deletion-inference system or letting card-disconnection edge cases determine the product.

## Dissent: safeguards and ideas to retain from losing plans

### From `kimi-revised_plan-r2.md`

1. **Required operation observation, not optional reconstruction** (§4.1). Observe successful ES moves and removals so rename-then-edit does not invent the predecessor at a reused path. The winner makes this optional; the deletion and placement portions deserve stronger treatment.
2. **Hash-bound deletion receipts and convergence tests** (§4.6, §5.1). Retain the stale-receipt/path-reuse test and the multi-pass renumber/duplicate convergence fixture.
3. **A real lifecycle lock with a defined acquisition order** (§4.7). This is stronger than the winner’s two independently checked markers. Do not import the separate claim that capture can safely run without coherent exclusion.
4. **Explicit compaction scope:** numbered states within the same game/core repository; never collapse an auto resume point into a numbered slot merely because their bytes match. Equal content is not, by itself, evidence of a move.
5. **Write the manifest only when its substantive contents change** (§4.2). A new `generated_at` alone should not create upload work or imply new provenance.
6. **Player selection of the active resume point for auto KEEP BOTH** (§4.4). The winner’s deterministic “device stays auto” rule is understandable, but this alternative better exposes the consequential choice. Preserve it for the controller test rather than silently discarding it.
7. **Split-root import without agreement** (§4.8). The shipped configuration explicitly describes different backup and restore paths as an option. Preserve a guarded import route rather than simply removing that capability. It must not become an overwrite bypass. [E12]
8. **Connected-LAN reachability investigation**, rather than treating “no default route” as proof of no usable remote.
9. **Explicit accounting for free-standing screenshots**, distinct from state-bound thumbnails, so the replacement does not leave an existing tier member without an owner.
10. **Cloned-identity and screenshot-fetch-failure tests.** The winner acknowledges related risks, but these deserve explicit acceptance cases. Identity handling must distinguish an ordinary reflash from two active writers sharing an ID.

### From `gemini-revised_plan-r2.md`

1. **Shared-container semantics**, including an honestly nullable ROM association. A shared VMU is not one game merely because the wizard normally walks game by game.
2. **State-load/SRAM dependency as an execution issue**, not only a display issue. If the experiment establishes that loading a selected state rewrites SRAM, consecutive wizard pages alone do not protect that dependency.
3. **Recorded deletion intent and a guarded split-root import**, shared with `kimi-revised_plan-r2.md`.
4. **Retention-on as an actual default**, rather than an optional enhancement that falls back to off.

Its #10 launch-behavior rehearsal is valuable but already substantially absorbed by the winner. I would not carry over the ping replacement, the hashless candidate-selection rule, or the upload-only performance fallback.

### From `mistral-revised_plan-r2.md`

Retain its particularly concrete harness requirements:

- Preserve configuration **before** mutation.
- Assert **exact destination paths and destination bytes**, not basename appearances in a listing.
- Reconcile content fixtures with the current ES-derived content allowlist.

The embedded harness writes `rclone.conf` before checking the selected remote and uses basename-based upload assertions; these are real reasons to strengthen the instrument before trusting its results. [E11]

Its other useful adapter and provenance principles are already present in the winner. Its external table references and provisional-agreement machinery should not be carried forward.

## Remaining defects in the winner that must be fixed before implementation

### 1. Lifecycle markers are not mutual exclusion

Two actors can both observe “not busy” before either writes its marker. Use an atomic gate.

The protected lifecycle must include save-state setup before the emulator starts, execution, exit-time auto restoration/renumbering, and coherent capture/sealing—not just `ProcessStartInfo::run()`. Those surrounding mutations are visible in the embedded ES code. [E7, E10]

An “already-hashed file” is not necessarily sealed. Upload immutable staged bytes or re-establish that the source has not changed.

### 2. Apply the unit rule to the exit path too

The main classifier uses complete member maps, but §2.5.2 describes changed entries and authorization **per path**. Expand a changed member to its complete declared unit and evaluate that unit against current cloud evidence before authorizing any member upload.

The standalone-emulator inventory must also substantiate how capture finds the affected files. Replacing time-based selection with an inadequately specified game-name mapping would revive the omission D-CLOUD-028 deliberately avoided. [E1]

### 3. Make “manifest-last commit” internally consistent

Three details currently undermine that contract:

- The proposal to fold manifest publication into an unordered payload copy.
- Publishing a working capture manifest that may contain entries whose payload was deferred.
- Reclassifying an unexplained/in-flight object as legacy after two full passes.

Two passes are not proof of a coherent save generation. Publish a frozen manifest describing the verified publication, and do not automatically bless an incomplete known unit as legacy.

### 4. Correct agreement and completion ordering

Section 2.8 advances agreement and marks individual items done before the later payload upload, contradicting §2.4.2’s publication order.

The durable record must distinguish local installation, remote publication, verification, and completion. A restart must not skip an unfinished remote publication because local work was marked done. Agreement may advance only on the verified outcome it claims to remember. [E2]

This needs a small state machine in the existing plan record—not a general transaction framework.

### 5. Remove the `copyto` exception to forced transfer

Section 2.4.1 treats single-file `copyto` as an alternative to `--ignore-times`. Do not assume that naming one file disables comparison skipping. The embedded backup and restore scripts explicitly force their single-file archive transfers for this reason. [E4, E5]

Likewise, `--backup-dir` must remain a tested backend capability, not a universal proof of preservation. Use collision-resistant operation identifiers, verify which bytes were retained, and include archive retention in the implementation rather than making bounded growth optional.

### 6. Fix the capture-first cutover hazard

Stage 1 must not publish new manifests through the unchanged legacy bulk writers. The current broad savestate scope can carry cached foreign manifests, and user rules can precede default exclusions. [E4, E6, E13]

Keep pre-cutover capture local and unpublished, or switch manifest ownership safeguards coherently with the new protocol. Audit every save-writing entry point—not only boot, exit, and the SYNC row—including explicit upload/download actions, bundled transfers, Tools, and #37.

### 7. Finish the small but load-bearing contracts

Before sign-off:

- Bind agreement to the actual remote dataset, not merely a reused remote name/type and path.
- Enforce the game/core/numbered-state compaction scope.
- Validate planned destinations against the effective roots and save scope.
- Remove the optional “convenience badge until measured” fallback: D-CLOUD-025 requires the hardware result before choosing that framing.
- Record the new undo/default-retention and protocol refinements as append-only decisions. Keep D-CLOUD-027’s audit location and D-CLOUD-029’s pre-cutover policy intact. [E1]

The first experiments should remain cheap: repair the VM harness; run same-size and disjoint-member counterexamples; establish rclone transfer/archive semantics; then prove the lifecycle and #10 behavior on hardware. The final player acceptance test must now include **make the wrong choice, undo it with the controller, and verify the restored bytes after reboot**.

That is the foundation I would adopt: the winner’s evidence-before-write reconciler, with a small first-class undo feature—not a history system and not an archive-only promise.

## `corpus.provenance.json`

```json
{
  "artifact_type": "round-2 peer vote",
  "winner": "claude",
  "reviewed_plans": [
    "claude-revised_plan-r2.md",
    "gemini-revised_plan-r2.md",
    "kimi-revised_plan-r2.md",
    "mistral-revised_plan-r2.md"
  ],
  "reviewed_plan_hashes_supplied": false,
  "corpus_mode": "facilitator_embedded_read_at_time",
  "embedded_source_count": 42,
  "cited_source_count": 14,
  "source_citation_order": [
    "E1", "E2", "E3", "E4", "E5", "E6", "E7",
    "E8", "E9", "E10", "E11", "E12", "E13", "E14"
  ],
  "hash_basis": "Exact sha256 values declared verified at embed time by the Council Facilitator; not independently recomputed.",
  "manifest_read_timestamp_utc_as_supplied": "2026-09-05T17:32:51Z",
  "member_filesystem_access": false,
  "member_independently_reread_files": false,
  "member_rehashed_sources": false,
  "member_executed_tests": false,
  "source_file_paths": [
    "research/council-runs/2026-09-05-conflict-resolution-foundation/_sources/repo/docs/decision-register.md",
    "research/council-runs/2026-09-05-conflict-resolution-foundation/_sources/repo/docs/save-manifest-schema.md",
    "research/council-runs/2026-09-05-conflict-resolution-foundation/_sources/repo/docs/conflict-wizard-ia.md",
    "research/council-runs/2026-09-05-conflict-resolution-foundation/_sources/repo/projects/ROCKNIX/packages/network/rclone/sources/cloud_backup",
    "research/council-runs/2026-09-05-conflict-resolution-foundation/_sources/repo/projects/ROCKNIX/packages/network/rclone/sources/cloud_restore",
    "research/council-runs/2026-09-05-conflict-resolution-foundation/_sources/repo/.claude/rules/rclone-cloud-sync.md",
    "research/council-runs/2026-09-05-conflict-resolution-foundation/_sources/es/SaveState.cpp",
    "research/council-runs/2026-09-05-conflict-resolution-foundation/_sources/es/SaveStateRepository.cpp",
    "research/council-runs/2026-09-05-conflict-resolution-foundation/_sources/es/SaveStateConfigFile.cpp",
    "research/council-runs/2026-09-05-conflict-resolution-foundation/_sources/es/FileData.cpp.launchGame-excerpt-l740-850.cpp",
    "research/council-runs/2026-09-05-conflict-resolution-foundation/_sources/repo/tools/cloud-round-trip",
    "research/council-runs/2026-09-05-conflict-resolution-foundation/_sources/repo/projects/ROCKNIX/packages/network/rclone/sources/cloud_sync.conf",
    "research/council-runs/2026-09-05-conflict-resolution-foundation/_sources/repo/projects/ROCKNIX/packages/network/rclone/sources/cloud_sync_helper",
    "research/council-runs/2026-09-05-conflict-resolution-foundation/_sources/repo/docs/save-manifest-alignment-review.md"
  ],
  "source_file_hashes": [
    "0a4b1150d907f26cdd70d480830e195b9fa2885920abf48641506bb5a0f09640",
    "2a794ea3d027402a26e3dfc62ea6184c204211c888c904413d1564ecf3f189ce",
    "5738428852899047b9d49902b78e9c5e0d4457f67b09d079fdfeb89fdcfcc6c9",
    "dfd1bf52dca78ab67a1b30b56e3c048d8910863a99ca02442525f58d083a2a57",
    "3a1bec8bb0ef5005f3dd92cdd766beb2c32ef26c5b5ea06fbd6cdb0bb0259de9",
    "7d43f252d029d54baa98ffa266b9334fa2f0f2da3db2507f451205f40dc73353",
    "848e0746fa26ef5c565af72962c487b0d4185f199f36f2290827bd086e303741",
    "9931bfdceacc18344d7a6b9eeea0a27278dff46ae04a7f82e5c4efe7300ff51b",
    "4f38ea7dcfcbd71068122124c428d146b7da3c6dbdcc05a81afc99bbd93a9b15",
    "5b341d85de24badb2984fff979226f25f080831a1d194f607b6d6caa6085f233",
    "212e1c8531008b1d25f5f976797d9762c5cfa3061fe70229c546d276784efb49",
    "c9f4d94dc9745bce7bccf99145816e0e45305c8a5058acb6476a1fb56f96eb6c",
    "8b22b9c82effe0a044ff765f73ecf24e26dd064abf694dc1f37304e2759b8823",
    "56f6c54c013c5476f638a0dee5f2201e6a4ad021b47c674010bdc392665bfd48"
  ],
  "gaps_to_orchestrator": [
    {
      "description": "Version-pinned rclone 1.75.0 implementation or documentation establishing the proposed archive, filtering, and publication guarantees is not embedded.",
      "source_file_path": null,
      "sha256": null
    },
    {
      "description": "Executed results for the proposed compatibility, race, interrupted-apply, and performance gates are not embedded; proposed tests are not evidence of passing behavior.",
      "source_file_path": null,
      "sha256": null
    },
    {
      "description": "Full launch/setup plumbing, filesystem utility behavior, and current content-transfer implementations are needed to complete lifecycle, installation, and harness verification.",
      "source_file_path": null,
      "sha256": null
    }
  ]
}
```