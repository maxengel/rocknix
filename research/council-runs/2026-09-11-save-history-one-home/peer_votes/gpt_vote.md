Winner: **claude** (`claude-revised_plan.md`).

I vote for its **verified pre-publication escrow** as the foundation—not for every optimization surrounding it. It is the only supplied plan that requires a newly published version to be recoverable from the cloud **without the originating device ever returning**. That outweighs its additional transfer cost. However, its pruning, membership checks, and auto-heal rules need blocking corrections before implementation.

Source references below use the corpus’s supplied numbering, S01–S17. Their declared paths and Facilitator-provided hashes are recorded in the provenance section.

## Why this is the strongest foundation

Consider two devices that agree on H0:

1. Both inspect H0 and retain H0.
2. A publishes HA and verifies it.
3. B publishes HB over HA.
4. A’s next pass sees local = agreement = HA, cloud = HB, and therefore classifies this as “the cloud changed.”

That follows directly from #22’s R4/R5 rules. Neither a device-local lock nor a fresh listing makes the subsequent cloud write conditional. [S11]

`gemini-revised_plan.md`, `kimi-revised_plan.md`, and `mistral-revised_plan.md` repair the **subsequent local overwrite** by retaining HA before A installs HB. That is useful, but it depends on A surviving and syncing again. In the intervening period HA is absent from the cloud; losing A then loses progress that had successfully been published.

`claude-revised_plan.md` instead requires HA’s coherent bytes to be verified in `.history/` **before HA becomes the head**. This is recoverable publication, not serialization. It can use the existing copy transport rather than introduce a cross-provider lock service or replace D-CLOUD-052. Its additional cost is real and must be measured, but it buys a stronger property than the other plans’ delayed repair. [S04: D-CLOUD-034/036/052; S13]

Other useful aspects of `claude-revised_plan.md` are:

- Separate transfer rules for live saves and the history store, avoiding an exclusion that blocks the reconciler’s own retention writes.
- Member-relative paths rather than basenames, avoiding collisions within multi-directory units.
- Preservation of both cloud and device legacy set-asides, with verification before source removal.
- Correct README wording before #25 exists, destination validation before housekeeping writes, and mass-absence checks based on live saves rather than control files.
- Explicit acknowledgment that server-side copy, positive verification, cancellation, and listing costs require experiments rather than assumptions.

Those are practical improvements to the existing reconciler, not reasons to build another synchronization service. [S08–S13]

## Comparison with the other plans

### `kimi-revised_plan.md`

This is the strongest alternative for migration, retention semantics, and reader behavior. Its honest `legacy` reason, protection for the newest deliberate conflict loser, partial-unit handling, capture-walker test, and layout-migration requirement should survive into the final plan.

Its decisive shortcoming is the expressly accepted cloud-recovery gap between B overwriting HA and A’s next sync. Recoverability versus conditional-put serialization is not the only choice: pre-publication escrow supplies stronger cloud recovery while retaining the existing transport.

It also does not finish the concurrent-pruning protocol. A valid record, a local lock, and chain-based victim ordering do not by themselves prevent a peer from deleting an entry while another device relies on it. Its claim that chain ordering removes clock dependence “entirely” is too strong when its fallback uses untrusted time.

### `gemini-revised_plan.md`

Its copy-not-move rule, paired retention/publication deferral, and explicit recognition of the exit-time recovery-fetch conflict are sound.

But it calls retain-on-fetch a guarantee without retaining `kimi-revised_plan.md`’s important originating-device residual. Its standing fold also ends by deleting a legacy folder: without a per-object, quiescence-aware removal rule, that can destroy a late arrival from an old writer. It does not adequately specify migration of the unique copies in the device’s `.cache/cloud_sync/replaced/`. Those copies can be the only remaining newer local save. [S09]

Grounding is weaker in two further places:

- The menu map does not establish that MATCH bypasses the classifier; its implementation is not embedded.
- The plan treats SFTP/SMB retention as streamed in one section, then hypothesizes zero-device-transit copying on those backends in another. That capability must be an experimental branch, not two conflicting planning baselines. [S05; S17]

### `mistral-revised_plan.md`

It usefully includes `legacy`, witness-before-retain ordering, and audit coverage, but it carries the same delayed-retention concurrency gap and several concrete errors:

- Its streamed-backend ledger omits the upload of the retained bytes into cloud history. For equal-sized old and new versions, the stated streamed path already needs old-down, old-up, and new-up—before additional verification downloads. Its “2S” total and resulting worst-case timing are therefore not usable.
- It says the auto-state rule overwrites an existing slot 4. #23 specifies a **next free/reserved slot**, rechecked at COMPLETE. [S12]
- Its README promises a device restore menu before #25 ships. [S13]
- Its suspect message still asserts damage as fact while claiming to address intentional erasure.
- “Upgrade both devices before syncing” is advice, not an enforced mixed-fleet safety barrier.

These are important because adopting the plan literally would produce incorrect expectations, implementation behavior, or budgets.

## Dissent: safeguards to retain from the losing plans

### From `kimi-revised_plan.md`

1. **Protect the newest deliberate conflict loser separately from routine churn.**  
   Per-file buckets stop auto-states consuming manual-slot history, but they do not stop repeated overwrites of the *same* save from consuming its most recent wizard loser. Preserve its proposed “newest routine N plus newest deliberate loser” protection, with an explicit age/size policy. This directly serves D-CLOUD-032’s one-step-back requirement. [S04]

2. **Use an honest legacy event classification.**  
   `claude-revised_plan.md` imports legacy artifacts as `replaced`, but the shipped cloud set-aside also contains sync-mode deletions. Preserve `reason: legacy`, unknown producer/event information, and untrusted stamp time. Importer identity is not producer identity. [S08–S09]

3. **Distinguish partial legacy evidence from abandoned uploads.**  
   Preserve the instruction not to manufacture a coherent unit from a run stamp’s partial contents. Extend it so intentionally preserved partial legacy artifacts cannot be swept as failed uploads merely because they remain incomplete.

4. **Make capture and layout movement explicit integration points.**  
   Carry forward the capture-walker fixture for an accidentally downloaded local `.history/`, and the requirement that TIDY UP’s layout migration carries the history store. Exclusion from transfer alone does not prove exclusion from capture, counting, or classification. [S04: D-CLOUD-089; S05; S11]

5. **Resolve fleet-wide retention settings, especially OFF.**  
   The winner absorbs manifest-max counts but not a complete shared-store ON/OFF policy. Preserve the question: what does one device’s OFF mean when another requires retention? Also define how obsolete device claims cease controlling the effective setting.

6. **Preserve the explicit suspect exceptions.**  
   Both-suspect/no-verified-good-counterpart must hold rather than claim recovery. A deliberately restored uniform version needs authorization tied to that version/publication, so it is not immediately healed away. Preserve honest wording for heuristic findings and repeat-suspect escalation.

7. **Keep clock-aware pruning and the edited-rules audit as release requirements.**  
   Neither causal ordering nor required namespace protection should be demoted to polish. The winner identifies custom-filter hazards, but must turn that finding into a concrete upgrade/invocation policy and acceptance test.

### From `gemini-revised_plan.md`

- **Retain-before-install remains a useful defensive boundary.** A cached `in_store` flag cannot substitute for a presently valid, protected cloud entry when a local version is about to be destroyed.
- **Keep the bounded recovery-fetch alternative.** If the required local stage lifetime cannot be established from #21, a narrowly bounded fetch on the exit path is a legitimate alternative to indefinite deferral. It requires an explicit D-CLOUD-046 refinement and measurement; an exit card does not make network time free.
- **Distinguish policy overshoot from physical storage failure.** Exceeding a soft history target should not itself stop a safely retained publication. Failure to create and verify the required retained copy must still stop it.

### From `mistral-revised_plan.md`

- Preserve its **bytes-first, verified-record-last commit-marker alternative**, also present in `kimi-revised_plan.md`. The winner’s co-uploaded record can work only if every consumer independently establishes completeness. Record-last is the simpler baseline against which that optimization should earn its savings.
- Preserve **format-aware suspicion as a proposed follow-up experiment**, not as already established format knowledge. It could reduce false recoveries, but “uniform” alone is not proof of damage.
- Preserve its **stage-first, bounded-fetch fallback** as another implementation option if #21 cannot supply the winner’s proposed local recovery source.

The winner already absorbs the losing plans’ witness-before-retain and generalized audit requirements; those do not need a second mechanism.

## Blocking corrections to `claude-revised_plan.md`

### 1. Store membership must be proven, not inferred from a directory name

The proposal sets `in_store` after finding a version digest in a listing. That is unsafe: an interrupted upload can leave the correctly named directory with missing members or an incomplete record.

A digest-bearing name is a locator, not a completion certificate. An optimization may skip retention only when it identifies a **verified, coherent entry whose continued availability is protected for the operation**. Run identifiers must also have an established uniqueness contract; #22 naming a `run-id` does not prove its collision resistance.

### 2. Pruning currently breaks the escrow guarantee

The clearest counterexample is:

- A verifies HA’s escrow and pauses before publishing.
- B’s pruner sees H0 as the current head.
- A’s pending record exists only on A, so B does not protect HA.
- Under count/size pressure, or unfavorable timestamp ordering, B deletes HA.
- A publishes HA from its local stage.

The intended store-first invariant has now failed.

“Both pruners choose the same victims” assumes the same snapshot, which concurrent devices do not have. Nor do two observations of an incomplete entry prove that its writer has abandoned it.

Before implementation, specify a cloud-visible or owner-scoped finalization/reclamation rule that protects outstanding publications and deletions. Where abandonment or safe reclamation cannot be established, **defer deletion**. A last-second recheck alone does not close this race.

The same policy must protect the last recoverable copy, deliberate losers, and retained partial legacy artifacts. Soft caps are not permission to guess about these protections. [S04: D-CLOUD-036/078/096; S11: R9]

### 3. Remove the proposed predecessor-mismatch classifier shortcut

`replaces != agreement` does **not** prove a concurrent branch.

For example, A agrees HA and remains unchanged while B legitimately publishes:

**HA → HB → HC**

HC’s immediate predecessor is HB, not HA. A later seeing HC is an ordinary cloud-only change, not evidence that B never saw HA.

Use positively established branching evidence, or leave the identity classifier unchanged. Do not add frequent false conflicts through an unproven interpretation of the unembedded manifest schema. [S04: D-CLOUD-045; S11: R4]

### 4. Auto-heal needs a durable ordering contract, including OFF and offline operation

As written, the winner permits local healing offline while saying the suspect descriptor is written when a pass becomes online. It does not establish the durable pre-replacement preservation needed for that interval.

Before replacing anything:

- Preserve the exact suspect version durably under an explicitly approved ordering rule.
- Establish the identity and lifetime of the known-good recovery source.
- Report recovery only after a complete local unit is installed.
- Define behavior when either preservation or recovery verification fails.

A descriptor capable of reconstructing every byte **is a retained version**. Calling it an audit record does not reconcile it with “Discarded saves were not kept.” Either retain ordinary members using the existing format, or explicitly specify and approve the encoding, reader support, and OFF semantics.

Offline local preservation also needs an explicit argument against the relevant cloud-first requirements—not an implicit reinterpretation of D-CLOUD-036/041/100. [S04; S12–S13]

### 5. Separate publication state from retention reason

An escrow that never reached the head is not “REPLACED BY A SYNC” merely because it differs from today’s head.

The schema must distinguish pending/never-published material from actual earlier versions. It must also preserve a wizard decision’s reason, winning side, and time even when its loser’s bytes were already escrowed. Byte deduplication must not erase the event metadata #25 requires. [S11: R9; S13: A5]

### 6. Correct the cost and launch-safety claims

The “+1 spawn, +1 upload” ledger omits required pre-publication verification work on a genuinely hashless backend. The escrow verification cannot be folded into the later head verification: they lie on opposite sides of the safety boundary.

Measure the actual ledger, including record verification, any escrow re-fetch, head correspondence, legacy retention, and process startup. Compare old and new payload sizes separately; store-first is not universally cheaper when they differ.

Likewise, cancellation does not automatically mean zero added game-to-game delay. It includes termination and any necessary completion/recovery of local multi-member installation. Per-file temp-and-rename alone does not prove that the **unit** is coherent before the first frame. The D-CLOUD-093 orphan-child case needs particular attention. [S04: D-CLOUD-046/075/076/093/098; S06; S11: A7/A10; S15]

### 7. Mixed-fleet safety and migration cannot be closed by accepting the residual on the maintainer’s behalf

The early exclusion image and standing fold are worthwhile mitigations. They do not prevent two old sync-mode runs from destroying a displaced history member before repair.

Make the compatibility experiment a release gate, including custom filters and `--delete-excluded`. If required, test whether non-save payload names can provide additional protection against the shipped old allowlist. Do not claim protection against arbitrary old writers without a demonstrated barrier.

Migration source removal must be per verified artifact, with late writes handled conservatively. Correct the legacy reason, and keep imported partial artifacts separate from abandoned-transfer garbage. [S08–S10]

### 8. Finish the policy and register edits before coding

Keep the two settings nested under a verb-bearing row; do not ship the winner’s alternative of placing them directly in SAVE MANAGEMENT without an explicit reopening of the agreed delta. Resolve the effective count, OFF semantics, cap exceptions, and protection for deliberate losers.

Record actual amendments to the affected decisions rather than labeling substantive changes “refinements” and assuming approval. Also sweep #22’s stale launch-refusal and sentinel text against D-CLOUD-076 and D-CLOUD-074. [S02; S04; S05; S07; S11]

## Work sequence

The cheapest potentially disqualifying experiments should precede the wizard and full reader:

1. Obtain the missing #21 contract, manifest schema, full writer paths, and rules-migration implementation.
2. On isolated VM backends, test namespace isolation, positive copy verification, interrupted entry visibility, and the publication/pruner barrier above.
3. Exercise concurrent publishers, parent-only kills with surviving children, local multi-member recovery, partial legacy imports, and repeated old-image syncs.
4. Measure both time-to-play metrics **and successful sync completion rates** across hashed and hashless/streamed cases.
5. Only then finalize the storage protocol and build the #23/#25 surfaces around it.

All proposed experiments belong on GENERIC_X64 and the QA-only backend matrix first. No owner-device or owner-cloud testing is proposed; the dedicated QA handheld remains an open decision. [S16–S17; S04: D-QA-007/015/017]

**Bottom line:** retain `claude-revised_plan.md`’s pre-publication escrow, remove its unsafe shortcuts, and settle reclamation before building the UI.

## `corpus.provenance.json`

The following records the embedded corpus, not filesystem reads or independently recomputed hashes. Earlier-round analyses and reviews mentioned inside the candidate plans were not separately available and are not treated as independently verified evidence.

```json
{
  "facilitator": "council-facilitator@1.2.0",
  "access_mode": "Embedded read-at-time corpus only; no filesystem access and no experiments performed",
  "hash_basis": "The Facilitator's sha256 values, verified at embed time; not recomputed by this member",
  "facilitator_manifest_read_timestamp_utc": "2026-09-11T19:31:42Z",
  "citation_order": "S01 through S17 correspond to the parallel arrays below",
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
  "injected_plan_filenames": [
    "claude-revised_plan.md",
    "gemini-revised_plan.md",
    "kimi-revised_plan.md",
    "mistral-revised_plan.md"
  ],
  "plan_hash_note": "No hashes were supplied for the injected revised plans; none are fabricated",
  "corpus_gaps_surfaced_to_orchestrator": [
    "Issue #21: capture-stage lifetime, unit table, capture exclusions, and recovery-source guarantees",
    "The complete save-manifest schema, including the precise meanings of pub and replaces",
    "The full backup, restore, MATCH, launch, and child-process lifecycle implementations",
    "cloud_sync_helper handling of edited or custom rules files",
    "The complete conflict-wizard IA, upgrade-and-install rules, and engineering-practices rules",
    "Measured backend capabilities and retention/time-to-play results; the proposed experiments have not been run"
  ]
}
```