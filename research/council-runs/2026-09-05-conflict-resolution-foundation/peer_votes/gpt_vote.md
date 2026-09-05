**Winner: claude — `claude-revised_plan.md`.**

It offers the strongest foundation of the four because it most consistently puts **uncertain content into a refusal or verification path**, rather than treating transport success or metadata similarity as permission to overwrite. Its application-owned reconciliation, emulator/sync isolation, manifest transport ownership, checked merge adapter, and normalized result protocol address distinct failure mechanisms.

This is **not approval to implement it unchanged**. Several remaining defects below must become acceptance gates.

Source citations `[S#]` refer to the supplied source numbers. The provenance appendix records their full declared paths and exact Facilitator-verified hashes. I used only the embedded contents; I performed no filesystem reads, hashing, or hardware tests.

## Why it wins against the other three

### Against `kimi-revised_plan.md`

`kimi-revised_plan.md` has valuable simplifications, especially deferring deletion propagation, and useful mechanisms for provenance and staging. Its decisive weakness is **F3’s staging contract**:

- It says the staged tree establishes cloud content on every backend.
- It also explicitly permits size-only skipping on WebDAV, acknowledging that same-size cloud changes remain invisible.

Hashing a stale staged file does not establish the current cloud hash. For example, a staged version can still equal agreement while the actual cloud object has changed to another same-sized SRAM file. The qualifier that paths “whose decision matters” receive download-and-hash confirmation is not a sufficiently precise admission rule: an **identical/no-op verdict also matters**, particularly before launching a game.

This recreates the failure documented in `cloud_backup`’s #53 commentary and the hashless-backend constraint in the alignment review. `[S29, S4]` `claude-revised_plan.md` has the better default: missing content evidence is not agreement, and uncertain changed-path uploads wait for classification.

`kimi-revised_plan.md` also overstates concurrent recoverability. Holding the cloud bytes observed **before** another writer acts does not necessarily preserve the version subsequently overwritten in the check/write gap. Its optional upload-only “lossless interim posture” has the same defect as the stopgaps below.

### Against `gemini-revised_plan.md`

`gemini-revised_plan.md` correctly emphasizes grouped saves, checked ES helpers, and lifecycle isolation. However, its proposed interim measure is unsafe:

> Disable boot and menu synchronization, retaining the exit upload, because pure `copy` preserves both copies.

The embedded `cloud_backup` does not support that claim. `--recent` forces `copy`; that copy can overwrite a differing cloud object, and the script adds `--backup-dir` only for `sync`. A unique cloud version can therefore disappear while the local version remains. **Protecting the local destination is not protecting both sides.** `[S29]`

This is not merely an unmeasured optimization: it is a false safety premise attached to an actionable migration instruction, while also changing D-CLOUD-029’s accepted posture. `[S6]`

The plan is also too incomplete about certified agreement, restart recovery, manifest ownership during transport, and the compatibility bench to be the most buildable specification as written. Those omissions would force substantial safety design during implementation.

### Against `mistral-revised_plan.md`

`mistral-revised_plan.md` repeats the unsafe upload-only stopgap. It also specifies remote hashes “or size+mtime” without explaining how the current cloud SHA-256 is established when **neither usable hashes nor modtimes exist**. Its rejection of bisync presents several untested behaviors as settled facts; the embedded corpus contains no version-specific bisync implementation or experiment establishing all those claims. `[S4, S16, S23]`

Its discard-store exclusion is another concrete weakness. Adding a rule before the defaults’ broad savestate inclusion does not make that rule unconditional: `cloud_sync_helper` places user rules ahead of defaults. `[S31, S32]` `claude-revised_plan.md` explicitly recognizes this distinction and requires a non-overridable safety boundary.

The shorter specification is not consequently easier to build safely: too many load-bearing contracts remain unstated.

## Dissent to carry into the synthesis

These ideas should survive the vote, with their limitations intact.

### From `kimi-revised_plan.md`

1. **No propagated user deletions in V1 — F8.** This is a substantially simpler safety baseline than the winner’s tombstone machinery. Keep D-CLOUD-030’s verified duplicate compaction separate from general deletion propagation. Resurrection is undesirable, but preferable to deleting a distinct version on ambiguous evidence.

2. **A durable origin record — F2.1.** Looking up a producer by hash in the current manifest union is insufficient once that producer overwrites its path entry. Preserve known production provenance when importing or re-slotting a version, without attributing production to the receiving device.

3. **One verified staging area serving several consumers — F3/F4.** Cloud candidates, thumbnails, KEEP BOTH sources, before-images, and upload certification can share verified staged objects. Preserve that economy, **not** the size-only freshness assumption. A staging cache also needs a current remote inventory; `copy` alone does not remove stale cached entries.

4. **Explicit local manifest-write serialization — F5.** Offline capture must not be lost because a network job owns the cloud lock. The winner needs a precise capture/manifest/transfer locking order, not just an unconditional capture call.

5. **A fully specified bounded discard policy — F7.** Per-path retention plus a global cap is more concrete than the winner’s general count-based bound. Storage exhaustion must stop destructive application, not silently disable retention.

6. **Queued post-exit conflicts and a durable entry point — F7.** A state file and discoverable pending-conflicts row can avoid forcing a walkthrough immediately after every game. This is a product amendment requiring approval, not an automatic consequence of backend design.

7. **Explicit KEEP BOTH placement for auto states — F6.** The result must retain a canonical `.state.auto` and place the other version in a numbered slot. Both plans still need to specify which remains the resume point without inventing a recency-based “winner.”

8. **Per-target core inventory and absent-core testing — §8.5**, plus the shadow census’s unknown-rate and grouping-error measurements. The winner’s compatibility work should include discoverability of states for a core absent on the receiving image, not merely successful loads between installed cores.

### From `gemini-revised_plan.md`

**Whole-bundle resolution must be genuinely atomic in its decision semantics — §4D.** The winner adopts the goal but does not fully implement it in its classification rule. Test disjoint member changes on opposite devices, not only two versions of the same member.

Its other important safeguards—checked copies, emulator lifecycle isolation, thumbnail binding, and default-on retention—are already substantially absorbed. I would not carry its stopgap forward.

### From `mistral-revised_plan.md`

1. **Explicit destination-vacancy validation on both sides — §3.4.** Pre-pass completion and a cached ES allocator are not substitutes for checking the exact planned destination immediately before materialization.

2. **Observe move operations rather than reconstructing them later — §7.** Move hooks or equivalent operation records can preserve lineage across renumbering followed by editing. The winner’s “last known hash at this path” does not always identify the actual predecessor.

3. **Resolve the kid/kiosk accessibility question deliberately — §5.5.** The winner leaves conflicts waiting and places their badge in the full UI, which those modes hide. `[S13]` Preserve the requirement that pending work remain discoverable or have an explicit adult-unlock path; this does not require forcibly exposing destructive controls in kid mode.

## Remaining defects in the winner that must be fixed

### 1. Provisional agreement must authorize no destructive action

`claude-revised_plan.md` §3.2 R3 says provisional agreement can authorize a skip and another upload, while §3.4 sends differing provisional versions to the wizard. Those permissions need one consistent contract.

A pending upload receipt is **not agreement**. It must not authorize overwrite or deletion, or a claim that both sides are synchronized. Likewise, an `--ignore-existing` upload that skipped an existing cloud file cannot establish agreement with the local version.

The executor must also ensure that planned writes are not silently skipped by rclone’s own size/modtime comparison. Exit zero, even on a hash-capable backend, is insufficient unless the intended content was actually certified. `[S3, S29]`

### 2. Classify save units as units, not merely conflicting files

The winner’s rule—“if any member is divergent, the unit is divergent”—misses this case:

- The device changes member X.
- The cloud changes member Y.
- Neither individual path changed on both sides.

Per-path classification then constructs a mixed bundle without prompting.

Compare the **complete member/hash inventories** of local, cloud, and agreed units. If both unit inventories changed differently, resolve the whole unit. Membership changes count too. Group definitions require the proposed emulator experiments; unknown multi-file layouts must not be silently authorized piecemeal.

### 3. Add mandatory transaction recovery, separate from optional retention

An audit line followed by a backup and a destructive step is not a complete crash-recovery protocol.

Before overwriting, preserve and verify the relevant versions and companions; persist the submitted operation and its allocated destinations; make replay idempotent; publish agreement only after certification. An interrupted apply must not allocate another KEEP BOTH slot on every retry.

Optional long-term retention can remain bounded. **Recovery material for an unfinished transaction cannot be optional or pruned.** Validate manifest-derived paths against the permitted roots, including traversal and symlink escapes.

Full rollback browsing can remain #25. Recovering an interrupted operation cannot.

### 4. Simplify or fully specify deletion propagation

The winner’s tombstone table has overlapping absence cases and insufficiently explicit version checks. In particular, a remote tombstone’s mere existence must not authorize deletion of an unrelated version later occupying the same path.

My preference is to adopt `kimi-revised_plan.md`’s conservative V1 policy. If propagation remains, require matching content identity, scope, validated intent, verified preservation, and restart-safe execution. Do not treat general user deletion and byte-identical duplicate compaction as the same operation.

### 5. Do not promise race-safe preservation from unproven `--backup-dir` behavior

The winner appropriately acknowledges a check/write race, but then promises that overwritten bytes are retained. That guarantee is not established across the supported backends.

Test the adversarial ordering where a competing write occurs **between observation and replacement**, including interrupted archival. Recovery destinations must be unique per device/operation, not merely second-resolution timestamps.

If the backend cannot preserve the actual overwritten version reliably, weaken the operation—preserve immutable versions first or refuse the unsafe replacement—rather than merely weakening the explanation. A support-only log and unspecified manual recovery are not a console-first undo mechanism.

### 6. Activate the new guard across all write paths together

The staged cutover takes over exit uploads before boot and menu transfers. During that interval, a new exit gate can correctly refuse a fork that the old boot restore subsequently overwrites.

D-CLOUD-029 permits the existing risk until replacement; it does not make a partially guarded system conflict-safe. Activate the common guard across boot, exit, menu rows, bundle operations, and script entry points together. No failure branch may fall back to the legacy writer.

The emulator exclusion also needs a shared, atomic launch/write protocol. An ES-only check is insufficient for transfers started through scripts. Shadow observations must capture their inputs **before** legacy transfers destroy the evidence they are meant to classify. `[S29, S30, S35, S41]`

### 7. Repair the provenance/bootstrap contradictions

Several details need correction:

- “Download our existing manifest before first capture” conflicts with unconditional offline capture. Record captures locally, then merge safely before first publication.
- `generated_at` cannot reliably detect cloned identity or establish causal order; clocks are explicitly untrusted.
- Reading the last agreement at a path does not establish `replaces` after a rename followed by an edit. Observe the move, or report lineage as unknown.
- A KEEP BOTH copy is a **new placement of the existing content version**, not a new version merely because its slot changed.
- Preserve ROM identity separately from ES’s matched filename stem. `nofileextension` explains matching behavior; it does not require redefining the schema’s `rom` field to discard the extension.

These follow from the schema and embedded ES behavior, not hypothetical backend behavior. `[S3, S34, S37, S38, S39]`

### 8. Make #10 deferral conditional on local preservation

The winner says flat-path collisions between cores can wait for the wizard. That is not always true: one core can overwrite another core’s local file **before synchronization sees two candidates**.

The finding that introducing `es_savestates.cfg` changes `racommands`, autosave, and incremental defaults is sound. `[S39]` But deferring the layout requires another proven protection for local cross-core writes, or keeping #10 on the critical path with an explicit legacy reader and launch-behavior rehearsal. “Core as metadata” alone cannot recover overwritten bytes.

### 9. Reconcile the budget, status, and cancellation promises

The changed-path budget cannot simultaneously count only listing plus payload upload while also requiring explicit own-manifest publication and, where necessary, read-back verification. Count the actual calls and measure them on the A53.

Hashless-backend uploads deferred to a full pass need a specified retry path and an honest **upload pending** result—not a successful-backup stamp.

The revised cancellation text also says the pre-pass overwrote nothing, although the conflict table permits automatic one-sided updates at existing paths. The accurate guarantee is:

> Quitting applies none of the selected conflict resolutions. Independently safe synchronization may already have completed.

Finally, the opening “no rows reopened” assurance must be reconciled with the substantive changes to D-CLOUD-028, the signed D-CLOUD-031 schema, D-CLOUD-017’s sequencing, and the IA settings. Obtain approval through new rows citing the existing decisions before building them. `[S2, S3, S6]`

**Bottom line:** adopt `claude-revised_plan.md` as the foundation, retain the dissent above, and close these contracts before implementation. The first executable gate remains repair and execution of the round-trip harness on a disposable VM, followed by content-blindness, interruption, lifecycle, and merge-failure fixtures. The compatibility badge still waits for D-CLOUD-025’s hardware evidence.

## `corpus.provenance.json`

```json
{
  "corpus_mode": "facilitator_embedded_read_at_time",
  "source_count": 42,
  "source_reference_order": "S1 through S42 in supplied order; source_file_paths and source_file_hashes are positionally aligned",
  "hash_verification": "SHA-256 values supplied by the Council Facilitator, verified at embed time; not independently recomputed",
  "independently_reread_files": false,
  "independently_rehashed_files": false,
  "commands_or_hardware_tests_performed": false,
  "manifest_read_timestamp_utc_as_supplied": "2026-09-05T17:32:51Z",
  "candidate_plan_filenames": [
    "claude-revised_plan.md",
    "gemini-revised_plan.md",
    "kimi-revised_plan.md",
    "mistral-revised_plan.md"
  ],
  "candidate_plan_hashes_supplied": false,
  "candidate_plan_treatment": "Evaluated as proposals, not as independent evidence for their technical claims. Earlier analyses and peer reviews referenced within them were not assumed available.",
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
      "description": "Version-specific rclone 1.75.0 bisync implementation/documentation, and evidence establishing verification, recovery, and concurrent backup-dir behavior",
      "declared_source_path": null,
      "sha256": null
    },
    {
      "description": "Full ES mutation and launcher implementations, relevant headers and filesystem helpers, and RetroArch directory-setting code needed to establish lifecycle, move, copy, and durability contracts",
      "declared_source_path": null,
      "sha256": null
    },
    {
      "description": "QA backend implementation and executed round-trip, compatibility, interruption, concurrency, and latency results",
      "declared_source_path": null,
      "sha256": null
    },
    {
      "description": "Current full issue bodies and acceptance criteria where the embedded issue exports provide comment threads rather than distinct bodies",
      "declared_source_path": null,
      "sha256": null
    }
  ]
}
```