Winner: claude.

I vote for **`claude-revised_plan-r3.md`**. It specifies the strongest combination of fresh conflict evidence, controlled write paths, default retention with usable recovery metadata, and separation between network work and live emulator files. Its advantage is not its length: it names mechanisms for several failures the other plans merely require implementations to avoid.

This is a vote for the best foundation, **not a certification that it is safe to implement unchanged**. The verification, recovery, and migration defects below must be corrected first.

Source references `[Snn]` resolve to the declared paths and Facilitator-verified hashes in `corpus.provenance.json` below. I evaluated the supplied R3 plans, not the earlier plans they cite, and ran no tests.

## Why it wins against the other plans

### Against `kimi-revised_plan-r3.md`

`kimi-revised_plan-r3.md` is the strongest alternative. It is better on in-memory slot reservations, explicit installation of a complete selected member map, holding unexplained absences, and retaining files under their complete relative paths.

However, it leaves three important holes:

- **Hashless equality is internally inconsistent.** Its equality-seeding rule permits a matching manifest claim with matching size and mtime. Elsewhere it correctly rejects metadata-only equality. On the corpus’s hashless, modtime-less WebDAV, that shortcut cannot establish the current cloud bytes. A false agreement can subsequently authorize an overwrite. The signed schema treats size as a pre-check, not proof. `[S03]`
- **Selection is confused with transfer enforcement.** Its specified `copy --files-from …` does not include `--ignore-times`. Selecting a file does not force rclone to transfer it when metadata comparison says “identical.” The shipped archive paths explicitly force already-decided transfers past that comparison. `[S29, S30]`
- **Its lifecycle contract is incomplete.** Rehashing before uploading live files does not seal those files against a subsequent emulator write. Nor does moving boot scheduling into ES establish exclusion after ES dies while an emulator survives. Claude explicitly requires sealed upload sources, inherited lock ownership, and recovery before launch.

Claude also places the primary two-device offline-fork experiment earlier. Kimi leaves that decisive acceptance test until its final gate, after substantial other work.

### Against `gemini-revised_plan-r3.md`

`gemini-revised_plan-r3.md` has a valuable, simple performance rule: **when safe verification costs too much, defer the upload rather than weaken verification**. It also gives the remote-preservation race experiment an explicit stop condition.

But it is not yet an end-to-end implementation contract:

- Its lock sequence covers taking local hashes, not the later installation and publication boundaries.
- It lacks a comparably explicit own-manifest publication and foreign-manifest ownership protocol.
- It does not adequately specify coherent multi-file publication or recovery before an emulator consumes a partially installed unit.
- Its merge section still delegates to `copyToSlot(move=false)` without addressing that helper’s ignored return values and source-parent-derived destination. Those are visible in the embedded implementation, not speculative risks. `[S38]`

Claude supplies these missing structural protections, although its recovery procedure still contains a serious defect identified below.

### Against `mistral-revised_plan-r3.md`

`mistral-revised_plan-r3.md` preserves useful distinctions, especially that a thumbnail discrepancy is not itself a progress fork. Its retention sidecar also contains substantially more useful context than a timestamp-only archive.

Nevertheless, it depends too heavily on an earlier, unavailable editing baseline, and its standalone instructions contain unsafe or contradictory statements:

- Computing a backend-native hash locally cannot confirm that the **current cloud head** still equals agreement “without a listing.”
- “Defer hashless verification” while leaving a “fast-path upload only” is not a sufficiently explicit prohibition against uploading over an unverified head.
- A directory-shaped container entry with one ordinary file `sha256` lacks a defined member-map encoding.
- “A sibling … under the sync root, never inside it” is contradictory placement guidance for safety-critical retained data.

Claude is substantially more buildable because its execution boundaries, stores, and writer responsibilities are defined directly.

## Fit with the maintainer’s amendments

As supplied, **all four R3 plans specify retention on by default and no V1 undo control**. None should receive extra credit merely for repeating those requirements. The meaningful difference is whether the retained artifacts can support the later picker.

| Plan | Does its retention design survive the future-reader requirement? |
|---|---|
| `claude-revised_plan-r3.md` | **Strongest fit.** Its independent, schema-versioned resolution record includes game/container identity, member information, both operands’ provenance, the decision, the winner, and resulting placement. Its reader test removes dependencies on live manifests, the audit log, and completed pending records. The basename storage defect below still needs correction. |
| `kimi-revised_plan-r3.md` | **Yes in design.** `operation.json`, preserved relative paths, screenshot verification, and the independent reader test are appropriate. “Manifest entry verbatim” must actually include the manifest’s top-level device context, because the signed per-entry schema does not contain those device fields or a screenshot hash. `[S03]` |
| `gemini-revised_plan-r3.md` | **Adequate for an ordinary single-file discard, incomplete for grouped units.** It records game, slot, producer, and winner. It still needs a versioned record describing complete unit membership and verified auxiliary files, rather than assuming separate `<path>/<hash>` records reconstruct one coherent decision. |
| `mistral-revised_plan-r3.md` | **Sound direction, unfinished contract.** Its sidecar records the important comparison context, but store placement remains unresolved and grouped-unit reconstruction is underspecified. Hash-keyed storage must distinguish content identity from the context of the retained operation. |

### What the winner must change for the amendments

1. **Keep the existing no-undo V1 scope.** Retain the done-page statement that identifies discarded copies and says they are kept. Put the restore surface in its own issue; do not add another decision or recovery control to the conflict flow.
2. **Remove the V1 `resolves` classifier exception.** The per-publication list is shallow, but it is still unnecessary authorization machinery for this release. In particular, a never-agreed local hash appearing in that list does not prove that a newly encountered copy represents the occurrence the earlier decision rejected. A deliberately restored identical version must not be silently rejected again. Preserve decision context in the discard record; let uncertain cases use the ordinary three-way rule.
3. **Hold unexplained absence rather than automatically resurrecting it.** Claude’s mass-absence refusal does not fully satisfy the requested cheap fail-closed behavior for an individual previously agreed save. Adopt Kimi’s hold-and-report rule, while retaining explicit-delete propagation. This does not abandon the deletion capability.
4. **Make the retained store genuinely unit-safe.** Preserve relative member paths, not just basenames, and use a collision-safe unit key. Define the count in terms of completed retained resolutions or complete save units—not individual files. Three is a proposal, not a maintainer-set number.

These changes simplify the authorization model rather than expanding V1 into a version-history system.

## Dissent to preserve from the losing plans

These are important ideas that `claude-revised_plan-r3.md` does not fully absorb.

### From `kimi-revised_plan-r3.md`

- **Complete-map installation, including membership removal.** Selecting a multi-file version means making the destination match that complete member map. Copying selected members while leaving obsolete destination members can create a third, invalid save.
- **Declared-unit versus allowlist validation.** Before supporting an emulator’s grouped save, prove every required member can pass the transport policy. The database exclusions make this a real boundary to test, not an administrative detail. `[S32]`
- **In-memory slot reservations during planning.** Two KEEP BOTH decisions for the same game must not both receive the allocator’s current “next” slot. ES’s allocator reads repository occupancy; it does not reserve future placements. `[S37]`
- **Individual unexplained-absence hold.** Do not automatically upload or download a previously agreed version solely because its peer disappeared.
- **Full relative paths in retained operations.** Claude’s basename layout can collide within a multi-directory save unit.
- **Separate protection for the last routine-download preimage.** Kimi’s distinction between conflict retention and one recent `superseded-by-download` copy is a useful, bounded one-step safeguard. Routine activity must not consume the retention intended for a mistaken conflict choice.
- **Concrete harness regressions.** Preserve the actual cases behind its F4: `rclone.conf` is overwritten before the remote assertion, archive expectations disagree with dated names, and some fixtures assume artifacts the harness never creates. Claude’s generic “repair the instrument” gate should explicitly include these failures. `[S29, S30, S36]`
- **The sharpened #10 rehearsal.** XML cannot currently express `racommands=true`; an ES patch may be necessary. Also, do not treat `defaultCoreDirectory` as a general dual-layout reader: the embedded code chooses a directory, not a comprehensive old-and-new scan. `[S39]`

### From `gemini-revised_plan-r3.md`

- **Defer work when evidence exceeds the measured budget.** Preserve verification; sacrifice immediacy. Claude’s proposed alternative of dropping verification is the wrong degradation.
- **A stop condition for failed remote preservation.** If the `--backup-dir` experiment loses an intervening head or cannot establish preservation, canonical replacement must remain disabled for that capability class. A larger publication protocol is a possible later answer, not something V1 must build speculatively.
- **Actual endpoint route selection.** `ip route get` can recognize a usable non-default route. Claude’s “default or connected route” formulation can miss routed private networks. Keep this local and bounded; do not replace it with another internet ping.

### From `mistral-revised_plan-r3.md`

- **Thumbnail anomalies are not progress forks.** Claude excludes thumbnails from version identity but includes them in unit descriptions without clearly separating payload verdicts from auxiliary-file repair. Preserve the explicit distinction.
- **Control-state capacity must stop mutation, not discard required correctness records.** A bounded retirement structure needs a defined overflow policy; “the ring is bounded, therefore sufficient” is not a convergence argument.
- **Backend-native hash computation remains a candidate verification primitive.** Computing that hash from a sealed local artifact may provide the missing link between its SHA256 and a subsequent native-hash listing. Keep the experiment, but reject Mistral’s claim that it eliminates fresh cloud evidence.

## Remaining defects in the winner that must be fixed before building

### 1. Verification must not collapse into trusting transfer success

Claude permits hashless publication to advance agreement on forced-transfer success, marked `verified_by: "transfer"`, and proposes dropping the verification listing under performance pressure.

That contradicts this subsystem’s artifact-verification requirement. `[S10]` It also leaves a circular hashful argument: recording a newly observed remote hash alongside the intended SHA256 does not, by itself, prove the observed object contains the intended bytes.

The contract must specify:

- how the sealed local artifact is bound to the observed remote artifact;
- how the published manifest itself is verified;
- that agreement advances only after those checks;
- that insufficient time or evidence produces pending work, not weaker success.

Measure the complete path—including manifest fetching, hash conversion where necessary, and verification—before refining D-CLOUD-028. Do not treat the estimated spawn count as a proven bound. `[S06, S09]`

### 2. `prepared` does not mean “nothing happened”

Claude’s recovery rule says `prepared → discard stage, nothing happened`. A crash can occur **after the first live rename but before the journal advances to `installed`**. That record will still say `prepared`.

Recovery must inspect the expected pre- and post-images and actual member hashes, or use an explicit write-ahead mutation state. It must not discard the staged operands based solely on the recorded phase.

Use the same recoverable installation contract for non-conflicting multi-file pre-pass downloads. Recovery-before-launch must cover those installations too, not only wizard applies. Retained bytes and the journal must be durable before originals can be removed.

### 3. A frozen decision is not permission to overwrite a later head

Before applying a wizard decision—and before resuming a pending publication—revalidate the live local operands, cloud operands, and destination slots.

If another head appeared while the wizard was open or the device was rebooting, the old decision did not select against that new head. Hold the affected operation rather than blindly completing it.

Similarly, a retirement must identify the occurrence it intends to retire, not become a standing prohibition on a hash that the player later republishes deliberately. This needs narrowly scoped operation context, not a deep ancestry graph.

### 4. Capture must prove changes and attribution

Claude’s size/mtime pre-check must not suppress hashing of potentially written fixed-size saves merely because those metadata values remained equal. A same-size, same-timestamp SRAM edit is exactly the class of false equality the architecture is meant to remove. `[S03]`

Also, the actual launched emulator/core must come from the launch descriptor, including any state-specific override. `getEmulator(true)` and `getCore(true)` read configuration; `SaveState::setupSaveState()` can modify the launch command. They are not automatically equivalent after #10. `[S38, S41, S42]`

Finally, identical hashes in two manifests establish content equality—not necessarily agreement about producer, capture time, or compatibility provenance.

### 5. All save-writing entry points need the same enforcement

The detailed cutover repeatedly names boot, game exit, and SYNC. It must also cover:

- explicit UPLOAD and DOWNLOAD save rows;
- the hub’s SAVE DATA action;
- Tools/CLI calls into the shipped scripts;
- the planned savestate-manager transfer.

The enforcement belongs behind those surfaces, not only in their callers.

Claude must also withdraw “downgrade is non-destructive” and “old images carry manifests harmlessly.” The embedded legacy writers can overwrite save contents and republish foreign manifests; ignoring metadata is not safe interoperability. `[S29, S30, S35]` Test mixed-version behavior, and do not claim safety while an old writer can still mutate the same canonical namespace. D-CLOUD-029 permits the current maintainer-only posture until replacement; it does not make legacy writes safe afterward. `[S06]`

### 6. Two observations do not turn an incomplete publication into legacy data

Claude’s “two full passes, then legacy” rule is not a proof of coherence. A first publication of a new multi-file unit can have no previous manifest claims and remain partially uploaded across both observations.

Unknown provenance can be displayed honestly. Incomplete unit membership cannot be made valid by waiting for another pass. Define a complete legacy-unit import rule; otherwise retain the unknown/incomplete state without installing it.

The schema refinement must make complete membership and producer context expressible before #21 is built. Calling a nullable `rom`, new unit semantics, and new control records “additive, no schema bump” does not substitute for specifying reader behavior under D-CLOUD-031. `[S03, S06]`

### 7. Tighten the cancellation promise

“Nothing transfers until COMPLETE” must mean **no conflicting live version is changed before COMPLETE**. Read-only staging and the already-completed non-conflict pre-pass occur earlier. Cancelling the wizard cannot truthfully promise to undo that pre-pass. The inherited IA contains both claims; the implementation and wording must distinguish them. `[S02]`

---

**Bottom line:** adopt `claude-revised_plan-r3.md`, remove the unnecessary resolution-receipt authorization, preserve the dissent above, and correct these contracts before implementation. Then prove the primary offline fork, forced same-size transfer, crash recovery, slot reservation, and independent retention-reader cases before building the full wizard. No undo UI, database, or deep version graph is required.

## `corpus.provenance.json`

The arrays below record the **17 source files cited in this vote**, using the supplied values. All 42 embedded sources were available as the read-at-time corpus; no independent filesystem reading or hashing was performed.

```json
{
  "artifact_type": "round-3 peer vote",
  "winner": "claude",
  "corpus_mode": "embedded read-at-time corpus supplied by Council Facilitator council-facilitator@1.2.0",
  "embedded_source_count": 42,
  "provenance_scope": "source files cited in this vote",
  "recorded_source_count": 17,
  "manifest_read_timestamp_utc_as_supplied": "2026-09-05T17:32:51Z",
  "member_filesystem_access": false,
  "member_independently_reread_files": false,
  "member_independently_rehashed_files": false,
  "member_executed_tests": false,
  "hash_basis": "SHA256 values copied from source headers; verified at embed time by the Facilitator, not independently recomputed",
  "citation_mapping": "source_ids, source_file_paths, and source_file_hashes are parallel arrays",
  "source_ids": [
    "S02",
    "S03",
    "S06",
    "S09",
    "S10",
    "S11",
    "S29",
    "S30",
    "S31",
    "S32",
    "S35",
    "S36",
    "S37",
    "S38",
    "S39",
    "S41",
    "S42"
  ],
  "source_file_paths": [
    "research/council-runs/2026-09-05-conflict-resolution-foundation/_sources/repo/docs/conflict-wizard-ia.md",
    "research/council-runs/2026-09-05-conflict-resolution-foundation/_sources/repo/docs/save-manifest-schema.md",
    "research/council-runs/2026-09-05-conflict-resolution-foundation/_sources/repo/docs/decision-register.md",
    "research/council-runs/2026-09-05-conflict-resolution-foundation/_sources/repo/.claude/rules/rclone-cloud-sync.md",
    "research/council-runs/2026-09-05-conflict-resolution-foundation/_sources/repo/.claude/rules/engineering-practices.md",
    "research/council-runs/2026-09-05-conflict-resolution-foundation/_sources/repo/.claude/rules/upgrade-and-install.md",
    "research/council-runs/2026-09-05-conflict-resolution-foundation/_sources/repo/projects/ROCKNIX/packages/network/rclone/sources/cloud_backup",
    "research/council-runs/2026-09-05-conflict-resolution-foundation/_sources/repo/projects/ROCKNIX/packages/network/rclone/sources/cloud_restore",
    "research/council-runs/2026-09-05-conflict-resolution-foundation/_sources/repo/projects/ROCKNIX/packages/network/rclone/sources/cloud_sync_helper",
    "research/council-runs/2026-09-05-conflict-resolution-foundation/_sources/repo/projects/ROCKNIX/packages/network/rclone/sources/cloud_sync-rules.txt",
    "research/council-runs/2026-09-05-conflict-resolution-foundation/_sources/repo/projects/ROCKNIX/packages/network/rclone/autostart/102-cloud-saves",
    "research/council-runs/2026-09-05-conflict-resolution-foundation/_sources/repo/tools/cloud-round-trip",
    "research/council-runs/2026-09-05-conflict-resolution-foundation/_sources/es/SaveStateRepository.cpp",
    "research/council-runs/2026-09-05-conflict-resolution-foundation/_sources/es/SaveState.cpp",
    "research/council-runs/2026-09-05-conflict-resolution-foundation/_sources/es/SaveStateConfigFile.cpp",
    "research/council-runs/2026-09-05-conflict-resolution-foundation/_sources/es/FileData.cpp.launchGame-excerpt-l740-850.cpp",
    "research/council-runs/2026-09-05-conflict-resolution-foundation/_sources/es/FileData.cpp.getCore-excerpt-l1470-1560.cpp"
  ],
  "source_file_hashes": [
    "5738428852899047b9d49902b78e9c5e0d4457f67b09d079fdfeb89fdcfcc6c9",
    "2a794ea3d027402a26e3dfc62ea6184c204211c888c904413d1564ecf3f189ce",
    "0a4b1150d907f26cdd70d480830e195b9fa2885920abf48641506bb5a0f09640",
    "7d43f252d029d54baa98ffa266b9334fa2f0f2da3db2507f451205f40dc73353",
    "e8ee62ea5af749ef09c0ede9da7abc5d7c192d890ae2e737cc369a5c5549c646",
    "d343c805b912141a1f8af7aa8d6025e2379e5335fb197c4cc59adf960fa43cbb",
    "dfd1bf52dca78ab67a1b30b56e3c048d8910863a99ca02442525f58d083a2a57",
    "3a1bec8bb0ef5005f3dd92cdd766beb2c32ef26c5b5ea06fbd6cdb0bb0259de9",
    "8b22b9c82effe0a044ff765f73ecf24e26dd064abf694dc1f37304e2759b8823",
    "60db296dde26bebbf4fcf1b97101188799cedb2eb3260616204a2ee082ce19c3",
    "7c3e79bbe41bd70ec1c1f08d9defd04e38af891430616173609bf3e76c2159ee",
    "212e1c8531008b1d25f5f976797d9762c5cfa3061fe70229c546d276784efb49",
    "9931bfdceacc18344d7a6b9eeea0a27278dff46ae04a7f82e5c4efe7300ff51b",
    "848e0746fa26ef5c565af72962c487b0d4185f199f36f2290827bd086e303741",
    "4f38ea7dcfcbd71068122124c428d146b7da3c6dbdcc05a81afc99bbd93a9b15",
    "5b341d85de24badb2984fff979226f25f080831a1d194f607b6d6caa6085f233",
    "2410e4316d9c2c3bfb301c39dbe79590fb73682b18e70988527eeecc2a024fa6"
  ],
  "reviewed_plan_filenames": [
    "claude-revised_plan-r3.md",
    "gemini-revised_plan-r3.md",
    "kimi-revised_plan-r3.md",
    "mistral-revised_plan-r3.md"
  ],
  "reviewed_plan_hashes_supplied": false,
  "maintainer_amendments": {
    "source": "orchestrator brief in this prompt",
    "declared_source_path": null,
    "sha256": null,
    "treated_as_authoritative": true
  },
  "gaps_for_orchestrator": [
    {
      "material": "rclone 1.75.0 implementation or authoritative documentation for the proposed --files-from, native-hash, publication-verification, and --backup-dir preservation contracts",
      "reason": "The exact proposed combinations and cross-backend race guarantees are not established by the embedded scripts or planning documents.",
      "declared_source_path": null,
      "sha256": null
    },
    {
      "material": "ES ProcessStartInfo and process-launch implementation, relevant filesystem utilities, and full launch descriptor construction",
      "reason": "Inherited lock lifetime, durability, copy semantics, and actual launched-core attribution require inspection and execution.",
      "declared_source_path": null,
      "sha256": null
    },
    {
      "material": "Full save-menu, Tools, startup, and GuiSaveState delete call sites",
      "reason": "The complete write-path cutover and explicit-delete hook cannot be verified from the provided excerpts alone.",
      "declared_source_path": null,
      "sha256": null
    },
    {
      "material": "Executed results for the proposed offline-fork, interruption-recovery, remote-preservation, and retained-store reader acceptance tests",
      "reason": "These proposed safeguards remain unproven; this vote supplies no execution evidence.",
      "declared_source_path": null,
      "sha256": null
    }
  ]
}
```