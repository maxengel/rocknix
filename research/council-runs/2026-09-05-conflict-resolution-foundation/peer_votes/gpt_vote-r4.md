**Winner: claude — `claude-revised_plan-r4.md`.**

I would use this as the builder’s foundation, **after correcting the blockers below**. It is not safe to implement entirely literally yet. Its advantage is that it specifies more of the safety-critical work: every write entry point, concrete storage paths, retained-record fields, verification mechanisms, apply phases, result codes, and acceptance gates.

The decisive distinction is not architecture—all four substantially converge on an application-owned reconciler using rclone—but how much an implementer must still invent.

Source citations below use **S01–S42**, mapped to the exact declared paths and Facilitator-verified SHA-256 values in `corpus.provenance.json`. I evaluated the embedded text; I did not access files, recompute hashes, or execute tests. References within the plans to earlier reviews are not independent evidence for this vote.

## Why this document wins

### Its strongest provisions

Three parts make `claude-revised_plan-r4.md` the strongest starting document:

1. **It enumerates the write-path replacement completely.** Boot, game exit, save rows, hub actions, Tools, direct script invocation, and the future save-manager tile all reach one reconciler. That matters because the shipped overwrite behavior exists in the scripts themselves, not just in the SYNC menu action. The default copy mode does not make conflicting overwrites safe. [S29, S30, S35, S41; D-CLOUD-029]

2. **It specifies correspondence verification rather than merely requesting “verification.”** Its hashed-backend path compares a fresh remote digest with the expected digest of the sealed payload; its hashless path requires downloaded-content verification. That explicitly addresses the otherwise circular act of associating a newly observed remote hash with the local SHA-256 one hoped to upload. Its rclone command compositions remain hypotheses to test, but the proof obligation is clear. [S09, S10, S29, S30]

3. **Its retention store most nearly satisfies the future-reader requirement as written.** It records the discarded operand’s producer, original slot and paths, retained-relative payload and thumbnail locations, member hashes, winning side, decision, completion state, and clock-independent local ordering. The proposed reader test deliberately removes dependence on mutable manifests, pending records, and the rotating audit log.

Those are concrete implementation decisions, not rewards for document length.

### Against `kimi-revised_plan-r4.md`

This is the strongest alternative. It is **better than the winner on sync-context binding**, explicitly distinguishes a claims-set union from a map merge, correctly rejects `defaultCoreDirectory` as a dual-directory scan, and includes the cloned-card experiment.

I nevertheless prefer `claude-revised_plan-r4.md` because several important contracts remain less settled in `kimi-revised_plan-r4.md`:

- Its remote-verification rule does not specify the new-upload digest correspondence as concretely.
- Its manifest refinements do not provide the same explicit per-entry producer contract. Retaining “the entry plus the enclosing device block” can preserve the *publisher*, rather than the original producer, after KEEP BOTH unless this distinction is wired into the manifest first.
- Its retention key uses a ROM stem rather than a full game locator. Different games in different subdirectories can consequently share a bucket unless further qualification is added.
- Its deletion section simultaneously promises hold-and-report for unexplained absence and describes automatic resurrection after tombstone expiry, plus a “resurrection + hold-back” hook fallback. A builder needs one normative rule.
- Its central sequential offline-fork test appears as the final capstone. The winner puts that cheap, potentially invalidating experiment near the beginning.

**Retention verdict:** substantially suitable, but not yet an unambiguous reader contract. Fix game-key collisions, resolve producer versus publisher explicitly, and specify the auto-state versus numbered-state pruning buckets in the normative store section.

### Against `gemini-revised_plan-r4.md`

This plan has good priorities: explicit cloud-loser fetching, unconditional capture, pending-upload retries, sync-context invalidation, and session-lifetime exclusion.

Its disadvantage is not brevity; it is that several consequential choices remain implicit:

- “ROM filename made path-safe” is not a collision-free key specification.
- The retained-record contract does not explicitly require the original ROM locator and slot.
- Tombstone expiry is coupled to the retention window, although deletion-control state and retained conflict candidates have different purposes.
- The checked adapter treats the auto-only allocator failure as a reason to offer keep-one. The source shows an allocator defect, not evidence that numbered slots are unavailable. [S37]
- The transfer and apply descriptions leave forced transfers, durable recovery state, and several COMPLETE preconditions less explicit.

**Retention verdict:** conditionally suitable. Its producer snapshot, complete-member map, retained-relative preview, and pre-overwrite cloud-loser fetch are strong. It still needs precise game/slot identity and key encoding. Keeping irreplaceable data under `.cache` is not automatically a failure—the corpus says that directory survives updates—but its exception from regenerable-cache treatment must be enforced and tested, not merely declared. [S02, S11]

### Against `mistral-revised_plan-r4.md`

This plan has useful field examples, an explicit producer snapshot, and a sound high-level requirement to verify native hashes against the payload.

However, it contains two particularly dangerous literal instructions:

- The merge adapter says to derive the destination **from the staging directory**. The destination must be the game’s actual repository directory. Otherwise an operation can successfully copy and verify files in staging without installing anything players can use. `SaveState::makeStateFilename()` and `copyToSlot()` make this distinction load-bearing. [S38]
- Unexplained absence is implemented as a **tombstone**. Without a rigorously separate non-deleting type, that turns missing evidence into deletion authority—the opposite of hold-and-report.

It also specifies classification per path while calling multi-file saves “units,” without fully defining the complete-unit classifier. Its example `link_identity` is the device ID, which does not distinguish two accounts linked under the same remote name.

**Retention verdict:** the required information is mostly named, but the store is not sufficiently specified as written. `<member-files...>` and `retained: true` are not unambiguous payload locators. It needs explicit original-versus-retained paths, sequence allocation rules, and a mandatory verified cloud-loser fetch before overwrite.

## What the winner needs for the maintainer’s amendments

`claude-revised_plan-r4.md` already adopts the substantive policy correctly:

- Default-on, count-bounded retention.
- No V1 undo control.
- A done page naming discards and saying their copies are kept.
- A separate future compare-and-choose restore tool.
- No deep ancestry or cross-device resolution-receipt system.

Its store **survives the future-reader requirement**, subject to the durability corrections below.

The final handoff should preserve that scope:

- **Do not add an undo button, history browser, or additional decision to the resolution flow.**
- Keep the restore-tool design and issue separate; retain the **test-only reader** as a V1 schema acceptance test.
- Treat the proposed count of three as a product proposal, not an already approved number.
- Say “copies are kept” only after their bytes and metadata have been durably verified. If retention cannot be completed, defer the affected destructive action; do not silently disable retention.
- Keep temporary transaction recovery separate from user-visible history. Journaling an interrupted operation does not require building a version-history product.

The default reversal must also be propagated into the IA and implementation issues, rather than leaving the old default-off instructions in circulation. [S02, S03; D-CLOUD-027, D-CLOUD-031]

## Dissent: provisions that must travel from the losing plans

### From `kimi-revised_plan-r4.md`

1. **Sync-context-bound agreement.** This is the winner’s most important omission. Bind agreement to the remote/backend, remote root, local roots, device identity, and a real link/account identity or locally maintained relink epoch. A context change must also invalidate queued plans and observations derived from the old context.

2. **Claims-set union.** Retain every relevant claim rather than choosing a manifest by map-merge order. However, qualify the wording: two different manifest claims alone do not prove a current fork—one may be stale. Current bytes plus agreement determine the verdict.

3. **The `defaultCoreDirectory` finding.** It substitutes a directory; it does not add a second scan. The XML path also changes `racommands`, while repository discovery scans the selected directories non-recursively. The winner’s #10 rehearsal should explicitly require both-layout discovery and launch-behavior parity, with an ES patch expected. [S37, S39]

4. **Sequence recovery and allocation.** Allocate the retention sequence under the relevant lock and recover it above existing records if the counter is missing or damaged. A bare persistent `.seq` file is an incomplete specification.

5. **The cloned-card experiment.** `cloud_device_id` deliberately trusts the stored value. Copying `/storage` can therefore duplicate the supposed single-writer identity. Test detection and safe refusal; do not assume hardware-derived initialization prevents later cloning. [S34; D-CLOUD-009]

6. **Separate conflict retention from mechanical retirement.** Verified-identical compaction must not consume the retention budget for actual conflict losers. The winner should make this explicit, particularly where its general retirement handling says “copy to retention.”

### From `gemini-revised_plan-r4.md`

1. **Make the cloud-loser fetch an explicit apply branch and acceptance test.** On KEEP RIGHT, obtaining a cloud thumbnail for display does not mean the cloud save itself has been retained. Fetch and verify the complete discarded unit locally before overwriting its remote head.

   The winner’s `prepared` phase largely implies this already; the dedicated branch removes a likely wrong reading.

2. **Keep the reader query as the store’s acceptance contract.** “This game, newest first, correct thumbnail, producing device, winning side” is the right test—not merely that record files exist. The winner incorporates most of this and should retain it unchanged through implementation.

The other major safeguards in `gemini-revised_plan-r4.md`—pending-work retries, lifecycle exclusion, protected incomplete records, and deterministic auto KEEP BOTH—are already substantially absorbed.

### From `mistral-revised_plan-r4.md`

1. **Use an explicit per-version producer snapshot contract.** Its schema example makes the producer object concrete. The winner’s optional-object convention needs particularly careful treatment of imported and unknown-origin files; a mandatory explicit producer object, allowing honest unknown values, would reduce attribution ambiguity.

2. **Carry the native-hash bridge into the acceptance tests.** Exercise both a newly established SHA-256/native-hash association and reuse of an existing association. The winner specifies the mechanism more clearly, but both cases should be tested independently.

I would **not** import its staging-directory destination rule or its unexplained-absence tombstone.

## Remaining blockers in `claude-revised_plan-r4.md`

### 1. Bind agreement to context, and settle the two-local-roots case

A warning that `BACKUPPATH != RESTOREPATH` is insufficient once agreement authorizes silent overwrites. The shipped configuration actually advertises different roots as a way to avoid replacement on restore; this is not merely an invented card-disconnection scenario. [S33]

Before reconciliation starts, either support those distinct roles explicitly or fail closed for that configuration. Do not silently interpret them as one tree. Apply the context binding carried from `kimi-revised_plan-r4.md` to pending operations as well as `agreed.json`.

### 2. A hard link is not a sealed upload snapshot

The winner permits capture to “hard-link or copy” a file into staging. A hard link shares the inode: a later in-place emulator write can change the supposedly sealed payload.

Require an independent copy, or a specifically proven snapshot mechanism. Hash the immutable staged bytes and upload those same bytes.

Also turn “the session lock is free” into an actual acquisition-and-hold contract, with an explicit lock order. Checking availability and then proceeding is not exclusion. Capture’s independence from the cloud-transfer lock must not introduce a deadlock.

### 3. Never promote a known torn unit merely because two passes saw it

The classifier currently allows an incomplete or mismatched declared unit to become an unknown-provenance one-way transfer after two unchanged full passes.

**Repeated observation is not evidence of completeness.** An interrupted PPSSPP upload can remain identically incomplete indefinitely.

Remove that promotion. Hold the affected unit until completeness can be established, while allowing unrelated work to continue. Honest legacy single-file handling can remain; it must not erase evidence that a declared multi-file unit is incomplete.

### 4. Make recovery durable, and apply it to non-conflicting installations too

The claim that losing `pending-apply` state necessarily fails closed is not established. Losing the only record identifying a partially installed unit can leave no reliable way to know what needs repair.

Require durable operation records and complete staged operands before the first installation effect. Do not subject unresolved recovery state to ordinary cache invalidation.

The same checked installation and offline-before-launch recovery contract must cover **non-conflicting pre-pass transfers**, not only wizard decisions. This is transaction safety, not an expansion into deep history. [S10, S11]

### 5. Rewrite the retirement rules as one consistent algorithm

Three corrections are needed:

- The one-sided retirement rows appear to target the side that is already absent. State the action against the concrete surviving operand.
- `published_at` versus retirement wall-clock time is not a reliable causal ordering, even when both devices report NTP synchronization. Use a narrowly scoped publication/retirement event relationship so restoring identical bytes is not consumed by an old retirement. This does not require a deep lineage graph.
- Reconcile “cloud layout wins” with D-CLOUD-030’s lower-slot compaction rule in one whole-repository move plan. Do not let the two rules alternately undo each other.

The retirement-expiry guarantee must also distinguish previously agreed absence from a genuinely untracked legacy copy. Bounded control state cannot justify an unlimited convergence claim.

### 6. Correct the post-write and concurrency guarantees

Fresh cloud evidence is necessary, but **read–check–write is not compare-and-swap**. The winner’s assertion that it makes simultaneous devices produce queued conflicts rather than clobbers is too strong.

Likewise, if correspondence verification fails *after* an upload, the system cannot truthfully say the unit was “never written.” It needs a durable uploaded-but-unverified outcome: retain operands, do not advance agreement, and re-observe before retrying.

Run the paused-between-read-and-write race experiment. Do not automatically add a distributed publication protocol because of an edge case, but do not claim one’s guarantees without implementing one.

### 7. Correct the remaining source and decision claims

- The schema **does have an equality row**; what it lacks is an explicit agreement-seeding action on that row. [S03]
- Caching foreign manifests outside the updated device’s sync tree prevents that device from republishing them. It does **not** prevent an older device from downloading and republishing the manifests through its broad savestates filter. [S29, S30, S32]
- D-CLOUD-028’s changed-path spawn/probe contract and D-CLOUD-031’s local manifest/agreement details are materially refined. Obtain and record those approvals explicitly rather than presenting everything as unchanged.
- The context, rclone verification composition, lifecycle ownership, and #10 launch behavior remain experiments, not established hardware results.

**Build gate:** repair the harness first, then prove the sequential offline fork and failed-upload retry, complete-unit retention, and offline interruption recovery before enabling the new write paths. That order preserves the winner’s main advantage: discovering a false safety assumption before building an expensive UI around it. [S36]

---

## `corpus.provenance.json`

```json
{
  "artifact_type": "round-4 peer vote",
  "winner": "claude",
  "winning_plan": "claude-revised_plan-r4.md",
  "corpus_mode": "Facilitator-supplied verbatim embedded read-at-time corpus",
  "source_count": 42,
  "manifest_read_timestamp_utc_as_supplied": "2026-09-05T17:32:51Z",
  "member_filesystem_access": false,
  "member_independently_reread_files": false,
  "member_independently_rehashed_sources": false,
  "member_executed_tests": false,
  "hash_basis": "SHA-256 values copied from source headers; verified at embed time by the Council Facilitator, not by this member",
  "citation_mapping": "S01 through S42 correspond, in order, to the parallel source_file_paths and source_file_hashes arrays",
  "reviewed_plans": [
    "claude-revised_plan-r4.md",
    "gemini-revised_plan-r4.md",
    "kimi-revised_plan-r4.md",
    "mistral-revised_plan-r4.md"
  ],
  "reviewed_plan_hashes_provided": false,
  "peer_material_use": "Plans evaluated as proposals against the embedded corpus and authoritative maintainer amendments; not evidence about councils, models, or deliberation behavior. Earlier plans and reviews referenced inside them were not independently consulted.",
  "maintainer_amendments": {
    "source": "orchestrator brief in this prompt",
    "applied_as_authoritative": true,
    "separate_declared_source_path": null,
    "sha256": null
  },
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
  "gaps_for_orchestrator": [
    {
      "material": "ES process-launch implementation, descriptor inheritance, GuiSaveState delete handler, and filesystem copy/rename implementations",
      "reason": "Required to establish lifecycle-lock ownership, delete-hook placement, and installation durability rather than assuming them",
      "declared_source_path": null,
      "sha256": null
    },
    {
      "material": "rclone 1.75.0 implementation or authoritative documentation for the proposed files-from, native-hash, download-verification, and backup-dir compositions",
      "reason": "The proposed transport and preservation mechanisms have not been demonstrated by the embedded corpus",
      "declared_source_path": null,
      "sha256": null
    },
    {
      "material": "RetroArch launch wrapper, setsettings.sh, backuptool, configuration defaults, cloud_setup, and tools/cloud-test-backend",
      "reason": "Needed for the namespace rehearsal, retention-home verification, relink-context implementation, and harness repair",
      "declared_source_path": null,
      "sha256": null
    },
    {
      "material": "Current issue bodies and executed results for the proposed hardware and regression gates",
      "reason": "Embedded issue artifacts are predominantly comments, and the required execution evidence is not supplied",
      "declared_source_path": null,
      "sha256": null
    }
  ],
  "missing_source_policy": "No unavailable source path, hash, file content, or test result has been fabricated"
}
```