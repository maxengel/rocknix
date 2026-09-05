**Winner: `kimi-revised_plan-r4.md`.**

## Reasoning

The four plans have converged on one architecture — content-hash identity (D-CLOUD-030), per-device manifests read as a set of claims, a context-bound local agreement record, a home-built three-way classifier with rclone as transport, write paths that read cloud evidence before overwriting and defer when they cannot, a lifecycle gate spanning the emulator's process, a checked adapter over ES's slot primitives, default-on count-bounded retention with a self-contained record, queue-and-badge, deterministic auto KEEP BOTH, and no undo control in version one. `gpt-revised_plan-r4.md` and `kimi-revised_plan-r4.md` both say so explicitly. So this vote is choosing the document a builder is handed on Monday, and the question is which one has already decided the most, is grounded correctly, and has the fewest places where a careless reading produces a silent loss.

**`kimi-revised_plan-r4.md` is the most decided document.** Its §1 states the whole design in twelve sentences a builder can hold in their head. §4 gives a literal root, a literal directory layout, an encoding rule for the key (`percent-encode every byte outside [A-Za-z0-9._-]`, raw names kept in the record), a literal rule for the sequence (persisted counter, incremented under the cloud lock, seeded above the on-disk maximum, zero-padded), a literal `record.json` field list, a step-by-step reader walkthrough, and the reader-destruction test as a schema gate. §5 names six picks and settles each with a reason and a gate. §6 names exactly which register rows gain a refining row and which stand unchanged. §7 separates what the corpus settles from what the council merely agrees on, each council-agreed item with its gate. §8 orders thirteen hardware gates. §9 lists what is not built and separates load-bearing from optional. That is the shape the brief asks for: literal paths, field lists, orderings, acceptance conditions, gate sequences.

**Its grounding checks out against the embedded ES sources.** I verified its four adapter traps against `es/SaveStateRepository.cpp` and `es/SaveState.cpp`: `isEnabled` requires `"retroarch"`; an auto state registers with `slot = -1` and the 99999→0 scan in `getNextFreeSlot` never matches it, so an auto-only repository returns −99; `copyToSlot` ignores the return of `renameFile`/`copyFile`; `makeStateFilename(slot, true, …)` combines with `getParent(fileName)` of the *source*; the `.png` is moved alongside. Its concession that `defaultCoreDirectory` *replaces* rather than adds a scan is correct against `es/SaveStateConfigFile.cpp` (`copy->directory = pInfo->defaultCoreDirectory`), as is the `racommands = false` finding in the XML reader — both of which make #10 an ES patch, not a config file. Its transient-slot fixture is real: `setupSaveState` copies the loaded state to `mNewSlotFile` mid-session and `onGameEnded` may remove it, and `+ /**/*.state*` in `repo/.../cloud_sync-rules.txt` admits it. Its harness findings are real: `repo/tools/cloud-round-trip` overwrites `rclone.conf` and never restores it, and its archive assertions do not match the dated names `repo/.../sources/cloud_backup` and `cloud_restore` actually write and restore.

**Against `gpt-revised_plan-r4.md`:** this is the closest rival and is, in places, more complete (see dissent). It loses on leanness and on how much shape it leaves to the implementer. Its `record.json` is a table of *categories*, not fields. Its game key is "a hash of a canonical descriptor" — an indirection the reader must unwind. It proposes a manifest **schema 2** with an inline producer snapshot on *every* entry, a placement observation, a unit descriptor, and retirement notices carrying operation IDs, pinned pending operations, and a rule that "must distinguish deletion of Y from relocation of Z" — a heavier reopening of D-CLOUD-031 than the milestone earns, and closer to the lineage machinery the maintainer's amendment says is not the primary case. It adds a `preimages/` store area, a "last-verified witness" of the device's own manifest, a parser-discipline layer, and a split-root import mode. Each is defensible; together they make the Monday document larger than the problem. Many of its rules are framed as constraints ("must obtain current cloud evidence", "use a tested exact-file selection mechanism such as `--files-from`") rather than decisions. It is the better *specification*; `kimi-revised_plan-r4.md` is the better *build document*.

**Against `gemini-revised_plan-r4.md`:** correct in outline and free of any silent-overwrite path I can find, but too thin to build from without re-deriving most of the shape. Its `record.json` is a bullet list of categories. It places the store under `/storage/.cache/cloud_sync/retained/` and asserts it "is exempt from cache-clearing sweeps and is excluded from `backuptool` archives" without a gate — `repo/docs/conflict-wizard-ia.md` defines `.cache` as the home of state that can be regenerated, and the alignment review verified only that `.cache` escapes the archive, not that nothing sweeps it. It does not cite the corpus. It has no register treatment at all (criterion 5). It handles the auto-only −99 case by "prompt for keep-one," where allocating from `firstslot` is correct and cheaper. It omits the `RCLONEOPTS` filter bypass, forced transfers, the transient-slot fixture, capture context frozen at launch, typed exit outcomes, the census, the 480×320 gate, kid/kiosk, and the bisync spike. Its seven gates put the cheap, independent #19 bench last. A competent implementer would have to make a dozen decisions it does not make.

**Against `mistral-revised_plan-r4.md`:** it is not a document a builder can be handed. It opens and closes with meta-chatter ("I'll produce a revised approach…", "This approach integrates…"), its JSON carries `//` comments, and it cites round-3 plans the builder does not have as the source of its content. More importantly it contains two defects that would produce silent loss or invisibility if built as written. §7.2 implements *unexplained absence* as "tombstone with `reason: unexplained_absence`" — but §7.1 defines tombstones as a bounded list in the **synced** per-device manifest, so an unexplained local absence on device A would propagate as a deletion to device B. That inverts fail-closed. §8 item 3 says "derive destination from staging directory, not source parent" — that is the bug, not the fix: the merged state would be installed *into* the staging directory and vanish from the savestate manager; the correct rule (`kimi-revised_plan-r4.md` §3.7, `gpt-revised_plan-r4.md` §7.3) is to derive it from the game's live state directory. It also moves `agreed.json` out of `/storage/.cache/cloud_sync/` without reopening D-CLOUD-031, uses the cloud lock itself as the lifecycle gate (so a running game would make every cloud script report "another sync is running"), counts "compute local hashes" as an rclone spawn, and never states the KEEP RIGHT cloud-loser fetch — so its done page's "kept on this device" would be false for cloud losers.

## What the winner needs to satisfy the amendments

`kimi-revised_plan-r4.md` already matches both maintainer decisions: retention on by default and count-bounded (§1.9, §4), no undo control in version one (§3.6, §9), a done page that names what was discarded and says the copies are kept — and, correctly, does *not* promise recovery — and the restore tool as a separate issue that reuses the compare-and-choose surface (§4, last paragraph). Its store survives the future-reader requirement: keyed by system and game/unit, ordered by a clock-free commit sequence, carrying the producer snapshot, the retained PNG with its own hash, the original slot and path, the decision, and which side won; the reader walkthrough needs no manifest, audit log, or pending record.

Two adjustments, not additions: it should **give up** the peer-review crediting and the `claude_peer_review-r4.md §…` style citations throughout §2, §3 and §4 — the builder does not have those files, and the content is already stated inline; replace them with the corpus citations the plan also gives. And it should mark N = 3 and the tombstone window (64 events / 90 days) as the proposals they are, in one place a builder will read, so the census (its gate 5) is understood to set them.

## Dissent — provisions the winner must absorb from the losers

From **`gpt-revised_plan-r4.md`**:
- **Owner versus producer in the live manifest** (§4.2; also `gemini-revised_plan-r4.md` §2). The winner's manifest refinements (§3.1, §6) do not carry a producer for an *imported* copy — a cloud state installed by KEEP BOTH into a numbered slot on device A gets an entry under A's top-level `device` block, and the alignment review's "origin in the audit log" rotates at 1 MiB (D-CLOUD-027). The wizard's later "device + model" and #37's tile badge (`issues/issue-37.md`) would misattribute. Add a per-entry producer snapshot for imported copies (only imported copies need it; do not bloat every entry).
- **The unknown-provenance loser record** (§8.2): "copy the manifest entry verbatim" is insufficient when no entry exists; the record must carry known identity and placement with explicit unknown producer fields.
- **The failures-not-ruled-out table** (§11) with its cheapest experiments: same-basename ROMs sharing a state path; a state load later overwriting SRAM chosen independently in the wizard; a correct-looking PNG belonging to another state version; case/Unicode/path-syntax aliasing; full or read-only storage after a "successful" copy; a disappearing storage root; same pin with differing build flags; a stale UI result reused after a context change. None is in the winner's gates.
- **The full write-path inventory table** (§9.1): the hub SAVE DATA tick, the Tools entries (`/usr/config/modules/*.sh`), direct `cloud_backup`/`cloud_restore` save phases, and the future #37 tile all route through the coordinator; the winner names boot, the SYNC row and game exit only.
- **Source-visible fixes to file immediately** (§11): the `RCLONEOPTS` bypass of the mandatory allowlist (a non-empty `RCLONEOPTS` replaces the fallback options in `cloud_backup`/`cloud_restore`; user rules precede defaults in `cloud_sync_helper`), the native-rclone exit-code collision with the scripts' 3/4, and the mains returning only the save-phase status.
- **Typed outcome codes with numbers** (§7.5: 5 = needs decision, 6 = pending) — the winner names typed outcomes but not the codes ES will parse.
- "**Do not rewrite an unchanged manifest merely to advance `generated_at`**" (§3.3) — otherwise every no-change exit manufactures an upload.
- **Two stable partial listings cannot certify a complete save** (§5) — the completeness rule for legacy multi-file cloud sets needs a closed member set or emulator-specific evidence.
- **Split roots** (§9.2): the shipped `cloud_sync.conf` advertises a different `RESTOREPATH` as a feature; refuse bidirectional reconciliation of unequal roots rather than merely warning.
- **Local preimage before a one-way download overwrites a local file** (§5, §8.1 `preimages/`) — belt-and-braces the winner lacks; cheap.
- **Core pins from the build system's actual package resolution, verified in the installed artifact** (§3.3; blindspot 12 in `repo/docs/blindspot-register.md`).

From **`gemini-revised_plan-r4.md`**:
- Owner/producer (§2), as above.
- **Gate 6's fallback**: if `copy --backup-dir` does not preserve the replaced object atomically on a backend, fall back to explicit copy-verify-delete for retirements (D-CLOUD-026's shape) rather than only "fail closed and queue" — the winner's pick 5 should say which of the two the builder does.
- The one-line **auto-only handling** contrast is worth recording so nobody copies gemini's "prompt for keep-one": allocate from `firstslot`.

From **`mistral-revised_plan-r4.md`**:
- A **`verified` flag on agreement entries** (§3) — the winner says agreement advances only on verified equality; recording the flag makes a partially-verified record inspectable.
- The **done-page mockup** (§10.3) — the winner's wording is right; mistral's is the only rendered layout, minus its stray `[ COMPLETE ]` button.
- **"Downgrade safety is not guaranteed — old scripts overwrite by recency"** (§11.2) stated plainly as a release-note fact; the winner implies it but does not say it.

## Remaining defects in the winner that must be fixed before it is built

1. **`<unit-key>` uses `<rom-stem>`** (§4). The schema's `rom` field and ES's `{{romfilename}}` are the ROM file name *with* extension (`repo/docs/save-manifest-schema.md` §6). Key on the full `rom` (percent-encoded) to avoid stem collisions and to match what the manifest records.
2. **No producer for imported copies in the live manifest** — see dissent; a #37 badge or a later wizard panel reads the wrong device.
3. **No rule for the loser's producer snapshot when no manifest entry exists** — see dissent.
4. **Boot cutover is ambiguous** (§3.4): "the autostart shim stays a no-op until the ES side lands" and "the lock prevents a double run during transition" describe two different transitions. D-CLOUD-029 says the shipped paths stay as they are until #22 replaces them; make the boot pass cut over in #22 atomically with the exit pass and the SYNC row, and say so in one sentence.
5. **`copyToSlot`'s `makeStateFilename(slot)` default `fullPath`** is unknown (`SaveState.h` not embedded) — if the default is `false`, `destState` is a bare filename renamed into the process's working directory. The winner lists this as a gap; promote it to a blocking item of gate 6, because the adapter cannot be written without it.
6. **Tombstoned deletions applied without a retention-store copy** (§3.9): the only safety net for a mistaken ES delete becomes the cloud `--backup-dir` sibling, reachable only from a computer. Acceptable under the amendment's scope, but say so where a builder will read it, and consider gpt's bounded local preimage until propagation finishes.
7. **Capture's mtime+size negative filter** (§3.2): mtime is second-resolution on ext4 (schema §6), so a same-size rewrite inside the same second as the last capture is missed until the full pass. Non-destructive delay, but state the consequence beside the rule.
8. **Strip the peer-review citations** before handing over — see above.

---

*Provenance.* Judged against the 42 sources embedded above (manifest read `2026-09-05T17:32:51Z`), cited by their declared paths with the Facilitator's embed-time sha256 values; I did not re-read or re-hash any file, ran no commands, and touched no hardware. The four injected round-4 plans are not part of the source manifest and carry no hashes; I judged their claims on the merits against the corpus and the two maintainer amendments in the brief, not as evidence about councils or models.

```json
{
  "artifact": "peer-vote-r4",
  "corpus_mode": "verbatim embedded read-at-time corpus supplied by Council Facilitator council-facilitator@1.2.0",
  "source_count": 42,
  "manifest_read_timestamp_utc_as_supplied": "2026-09-05T17:32:51Z",
  "member_filesystem_access": false,
  "member_independently_reread_files": false,
  "member_independently_rehashed_files": false,
  "hash_basis": "copied from the per-source headers; verified at embed time by the Facilitator",
  "injected_plans_judged": ["gemini-revised_plan-r4.md", "gpt-revised_plan-r4.md", "kimi-revised_plan-r4.md", "mistral-revised_plan-r4.md"],
  "injected_plans_have_declared_hashes": false,
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
  ]
}
```