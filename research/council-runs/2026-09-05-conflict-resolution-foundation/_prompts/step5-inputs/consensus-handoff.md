## Step 5 handoff content

### Load-bearing requirements (the issues carry these verbatim)

- **R1 (#22)** Every writer of the save tree — boot (`[S35]`), SYNC/UPLOAD/DOWNLOAD and the hub tick (`[S13]`), the Tools symlinks (`[S09]`), the game exit (`[S41]`), #37's tile, `cloud_backup`/`cloud_restore` from a shell — reaches it only through `cloud_reconcile`, cut over in **one image**. The saves phases of the two scripts delegate; their archive phases are untouched; outcomes aggregate per I11.
- **R2 (#22)** `cloud_reconcile` builds its own rclone arguments; never sources `RCLONEOPTS`; passes the shipped allowlist `[S32]` as the outer boundary with `- /**/*.bak` and `- /savestates/.snapshots/**` ahead of `+ /savestates/**`; every decided transfer uses `--files-from` **and** `--ignore-times`.
- **R3 (#20/#21)** Schema rev 2, additive to D-CLOUD-031: per-entry `unit`, `producer` (when imported), `published_at`, `pub`; top-level `units`, bounded `retired`; agreement written on verified equality with `verified_by`; manifests read as a claim set (I5); own manifest at `/storage/.cache/cloud_sync/manifest-<id>.json`, foreign ones under `/storage/.cache/cloud_sync/manifests/`; the `schema` integer stays `1` because no cloud has yet received rev 1. Never rewrite an unchanged manifest (I8).
- **R4 (#22)** Classification per unit by the base's §1.3 table with B3 and D1 applied: identical → seed agreement; one side changed → silent transfer of the unit's changed members; both changed or never agreed → queue; declared-incomplete → hold; unexplained absence → hold; applicable retirement → act on the survivor; another client's conflict artefact → never a version (D-CLOUD-022).
- **R5 (#21/#22)** Capture runs on every exit regardless of the toggle, network or lock; the emulator and core passed are the ones frozen at command construction (`[S38]` `_changeCommandlineArgument`; `[S42]`); sealing is an independent copy (B1); the exit push is upload-only, produces fresh cloud-head evidence per unit, proves correspondence before advancing agreement, and defers above the admission ceiling (D5).
- **R6 (#22)** The lock contract of B2: `L_T` then `L_S`, non-blocking in the reconciler; ES holds `L_S` from pre-launch renames through capture with a bounded wait and refuses to launch on timeout; the session marker with a pid check; capture holds no lock; the exit push takes only `L_T`.
- **R7 (#22)** Sync context (I1) on `agreed.json`, `queue.json`, `pending-publish.json` and every pending-apply record; `relink_epoch` bumped by `cloud_setup` and CHANGE CLOUD FOLDER; own-manifest witness (I2); split roots refuse (B4); storage guards (I21); parser discipline (I6).
- **R8 (#23/#24)** The checked adapter (base §1.7): next free slot computed from visible numbered states from `firstslot`; slots reserved in memory for the walkthrough; KEEP BOTH dimmed for non-RetroArch units (`isEnabled` requires `"retroarch"`, `[S37]`) and for in-game saves; auto states: this device keeps its `.state.auto`, the cloud copy goes to the next free numbered slot, one sentence, no question. COMPLETE re-checks local members, the cloud head (fresh listing), the unit map, reserved slots and pending retirements. Apply in four phases with the record written before the first effect; phase 1 includes the cloud-loser fetch (I3) and retention verification (I4); install by D7; recovery by D2.
- **R9 (#23/#25)** The retention store exactly as base §1.9 (home, layout, percent-encoded unit key, persisted `seq`, `record.json`, buckets counting finalized coherent wizard losers only — I13, I18, I26); on by default; count bounded; the done page names each discard per game with I16's wording and says the copies are kept; **no undo control**; the restore tool is its own issue reusing the compare surface.
- **R10 (#22)** Typed outcomes: 0 done · 1 failed (reasons `split-roots`, `duplicate-device-id`, …) · 3 lock held · 4 no route · 5 conflicts queued · 6 held or deferred; never rclone's own code; result file `/storage/.cache/cloud_sync/runs/<run-id>.json`; the card renders 3–6 as SKIPPED/WAITING, never FAILED.
- **R11 (#22/#7)** Unattended passes never open the wizard; the boot pass replaces `ping google.com` (`[S35]`) with the route test; per-row stamps keep their names (D-UI-017/018/020).

### Negative scope (not built in V1)

No undo control, history browser or extra decision in the resolution flow; no ancestry beyond `replaces`; no `resolves` receipts; no SQLite index (say so on #20); no generic merger or progress heuristic; no slot cap; no daemon; no protected-publication protocol; no preimages of one-way downloads (C1); no local retention of propagated deletions or compactions (I13); no exit-path downloads; no ICMP on the exit path; no split-root import mode; no `--resync` anywhere unattended.

### Acceptance conditions (each is a behaviour watched, never an artefact pointed to — blindspot 13, `[S07]`)

- **A1** Two devices agree H0; B publishes HB; A edits to HA offline; A exits, boots, presses SYNC, UPLOAD, DOWNLOAD, the hub tick, and runs both scripts from a shell: **neither HA nor HB is overwritten anywhere**; the row shows one queued conflict.
- **A2** After a failed upload, the next exit with nothing changed retries and publishes; an equal-size, equal-mtime byte change enters the changed set at the next full pass.
- **A3** CHANGE CLOUD FOLDER to a folder holding different saves: nothing downloads silently; identical pairs seed agreement; differing pairs queue.
- **A4** A KEEP RIGHT on a cloud loser: the loser's bytes and PNG are in `retained/` with matching hashes **before** the cloud head changes; KEEP LEFT likewise for the device loser; KEEP BOTH retains nothing and installs state + PNG in the next free slot with a visible thumbnail in the savestate manager.
- **A5** The test-only reader answers "this game, newest first, thumbnail, producing device, winning side" after manifest overwrite, renumber, audit-log rotation, clock set backward and all pending records removed; the store survives an in-place update on a device with real prior state.
- **A6** Kill ES mid-session: the game's units are excluded from mutation and upload until a clean capture or reboot; a boot pass overlapping a launch reports SKIPPED for that game and proceeds elsewhere; hold durations of `L_S` batches are under 100 ms on the H700 (proposal).
- **A7** Kill the reconciler after each rename and before its checkpoint, for a wizard apply **and** for a pre-pass download; restart offline: a complete unit exists before any launch; no torn candidate is ever shown.
- **A8** Interrupt a publication after one member: no device installs the mixed set at any later pass; the hold clears when the rest lands; other units transfer meanwhile.
- **A9** Delete a state on A and renumber; sync repeatedly on B: each surviving version exists exactly once; restoring a retired hash from retention is not consumed by the old record; an unexplained absence is held on the row and touched by nothing; a no-agreement device re-uploads (the D1 residual, observed and recorded).
- **A10** Idle exit spawns no rclone; the changed exit's spawns, round trips, bytes and seconds are recorded on Dropbox and the QA backend and the ceiling is set from them; correspondence failure after upload leaves an `uploaded-unverified` entry and advances no agreement.
- **A11** A cloned card: the second device refuses to publish with `duplicate-device-id` and transfers nothing.
- **A12** Split roots configured: every path refuses with the message; nothing transfers; agreement is untouched.
- **A13** The wizard lays out at 480×320 first; frames at 480×320 and 640×480 from `tools/vm-visual-qa` are the evidence (`[S24]`).
- **A14** The manifest reaches the remote under `savestates/.rocknix/` with `remote_hash` null on WebDAV and non-null on MinIO, and is absent from the content tier (`[S04]` §3.6).

### Ordered experiments (venue; what each gates)

| # | Gate | Venue | Gates |
|---|---|---|---|
| 0 | Repair `tools/cloud-round-trip` and run it: it overwrites `rclone.conf` without restoring it; its archive-name assertions disagree with the dated uploader/restorer (`[S29]`, `[S30]`); its content fixture predates D-CLOUD-019 (`[S36]`). WebDAV **and** MinIO. | GENERIC_X64 VM | everything |
| 1 | A1, A2, A3 (the cardinal-rule and context fixtures). | VM pair, then H700 pair | R1, R4, R5, R7 |
| 2 | A5 (the reader and survival test). | VM, then RG35XX SP | R9, the restore tool's issue |
| 3 | A6, A7; launch from an auto-only repository and observe RetroArch with `-state_slot -99` (`[S38]`). | H700 | R6, R8, D2 |
| 4 | A10; confirm `lsjson --hash --files-from` and `hashsum --files-from`; whether rclone's post-transfer hash mismatch fails closed; the hashless cap; the shell-computed native hash option. | H700 vs Dropbox; VM vs QA (loopback, D-QA-002) | D5, P4 |
| 5 | A9 (deletion, renumber, republication, residual). | VM pair | D1, P5 |
| 6 | A8 (torn unit). | VM | B3 |
| 7 | `copy --backup-dir` under interruption; the paused-between-read-and-write race. | H700 + VM | D3 (b), the `-replaced/` bonus |
| 8 | The #19 bench (`[S08]`): same-chipset control first, then cross-chipset, then loud/silent. Runs at any time — needs only the maintainer's hands. | bench | the badge's severity only |
| 9 | #10 rehearsal: an `es_savestates.cfg`; `racommands`/`incremental`/`autosave` flip; `defaultCoreDirectory` replaces the scan (I14); both layouts discoverable; RetroArch's `savestate_directory` moves with it. | H700 | §1.11 #10 |
| 10 | A13. | RG351M | the wizard's layout |
| 11 | The bisync spike (`[S05]` §2): output shape, `--recover`/`--resilient`, rename, interruption. Informational. | VM, then RG35XX SP | nothing in V1 (C6) |
| 12 | Shadow census: auto-state divergence frequency; what PPSSPP, Flycast, Mupen, DuckStation write (the unit table); retained bytes per bucket at count 3; stage bytes per exit. | RG35XX SP | R3 units, the count, B1's price |
| 13 | Unknown-unknowns (I19): same-basename ROMs in nested directories sharing a state path; a loaded old state restoring old SRAM that autosaves over the SRAM the wizard kept; a PNG belonging to another version; case-only path variants on Dropbox; full storage after a "successful" copy; an unmounted sync root; A11. | H700 + VM | guards I6, I21, I2; wizard copy for the save/state coupling |

**Build order:** Gate 0 → schema rev 2 and #21 capture (after Gate 12's inventory) → reconciler with the writer cutover (after Gates 1, 4) → store (after Gate 2) → wizard apply (after Gates 3, 6) → deletion (after Gate 5) → badge (after Gate 8) → #10 (after Gate 9) → the restore tool, in its own futro.

### Register rows proposed (IDs are the maintainer's to assign; each refines, none reopens)

- **P1 — Retention amendment** (refines D-CLOUD-024, D-CLOUD-027; IA rev 4's *keep discarded saves* default): V1 retains the discarded copy of every wizard decision, on by default, bounded by a count (**3 proposed; no corpus basis; the maintainer's number**), no undo control; the done page names discards and says copies are kept; the restore tool is a separate issue reusing the compare surface; the store is designed for that reader.
- **P2 — Store and transaction-state home** (refines D-CLOUD-027 as the `.cache` precedent): `/storage/.local/share/rocknix/cloud-saves/{retained,pending,stage}/`, never cleared by update, schema rebuild or cleanup; `.cache/cloud_sync/` holds only state whose loss fails closed.
- **P3 — Schema rev 2** (refines D-CLOUD-031, D-CLOUD-017): R3's additive fields; agreement on verified equality with `verified_by`; manifests as a claim set; foreign manifests cached outside the tree; sync context on all local records; `schema` stays `1`.
- **P4 — Exit-path budget** (refines D-CLOUD-028): idle exit zero rclone spawns; changed exit upload-only, fresh evidence before any write, correspondence before any agreement advance, 3–4 spawns on hashed backends, 3 plus capped bytes on hashless, admission ceiling measured by Gate 4; the "nothing changed ≈ 5 s" contract preserved.
- **P5 — Deletion semantics** (refines D-CLOUD-030): explicit deletions propagate via `retired` records applicable by `pub` identity; a restore is a republication; unexplained absence is held in both directions; the cloud's layout wins for moves and compaction follows in one plan; propagated deletions and compactions are not retained locally; the no-agreement residual is stated.
- **P6 — Write-path ownership** (refines D-CLOUD-029): one image replaces every writer in R1; the mixed-firmware period is guaranteed per device only (I17); distinct backup and restore roots refuse.
- **P7 — bisync's role** (no row exists; the IA and #22's thread say detect): the maintainer's word on C6, with I22 as the fallback.
- **P8 — Queue-and-badge** (IA rev 5): unattended passes never open the wizard; the maintainer's call.

### Document and issue edits required

IA rev 5 (`[S02]`): default flip for *keep discarded saves*; queue-and-badge; "nothing transfers until COMPLETE" qualified as "no resolution applies until COMPLETE; the pre-pass is not rolled back"; the auto rule; the SQLite question closed; the stamps directory already corrected. #22 body: R1–R7, R10, C6 with I22. #9 scope (`[S18]`, `[S16]`): "newer wins" struck (`[S04]` §3.1); bisync as evaluated transport only. #21: unconditional capture; frozen context; independent-copy sealing; the core-pins file per `[S03]` §9 and I15; no second spawn. #23: I16 wording; A13. #24: the adapter's rules. #25: the restore tool's shape, Gate 2 as its precondition, the allowlist rule. #35: the fixtures above. #7: the boot liveness test. #37 (`[S28]`): reads `device.label`/`core`/`core_build` from manifests; `copyToSlot`'s `makeStateFilename` default `fullPath` is unknown (`SaveState.h` not embedded) — a gap for any ES path that still calls it.

### Maintainer calls outstanding

1. bisync demoted (C6/P7) — or the I22 fallback.
2. Queue-and-badge as the trigger (P8).
3. The retention count (P1).
4. No local retention of propagated deletions and compactions (I13/P5) — the cloud `-replaced/` sibling is the record.
5. Split roots refuse rather than import (B4/P6).
6. Hold in both directions for unexplained absence (C7/P5), with its residual.
7. ES refuses a launch when the session lock cannot be taken within the bound (B2) — a rare, bug-indicating prompt, accepted over a possible mid-install corruption.

### Gaps the corpus does not fill

`ProcessStartInfo`/launcher implementation (fd inheritance — now non-load-bearing), `GuiSaveState.cpp`'s delete action, `SaveState.h`/`SaveStateRepository.h` defaults, `Paths.cpp`, `setsettings.sh`, `cloud_setup` (the `relink_epoch` write point), `backuptool`, `tools/cloud-test-backend`; rclone 1.75.0 documentation or source for `--files-from` with `lsjson`/`hashsum`/`copy`, `--ignore-times`, post-transfer hash behaviour, `--backup-dir` with `copy`; any executed result of the round-trip suite, the bisync spike, the #19 bench or a two-device fixture. None was fabricated; each maps to a gate above.

---

```json
{
  "artifact": "consensus_plan.md",
  "role": "council consensus integration over claude-revised_plan-r4.md",
  "corpus_mode": "verbatim embedded read-at-time corpus supplied by Council Facilitator council-facilitator@1.2.0",
  "source_count": 42,
  "manifest_read_timestamp_utc_as_supplied": "2026-09-05T17:32:51Z",
  "member_filesystem_access": false,
  "member_reread_files": false,
  "member_rehashed_sources": false,
  "member_executed_tests": false,
  "hash_basis": "sha256 values copied verbatim from the per-source headers; verified at embed time by the Facilitator; not recomputed here",
  "citation_mapping": "S01 through S42 map in order to the parallel source_file_paths and source_file_hashes arrays",
  "base_artifact": "claude-revised_plan-r4.md",
  "injected_artifacts": [
    "claude-revised_plan-r4.md",
    "claude_vote-r4.md",
    "gemini_vote-r4.md",
    "gpt_vote-r4.md",
    "kimi_vote-r4.md",
    "mistral_vote-r4.md"
  ],
  "injected_artifact_hashes_provided": false,
  "peer_material_use": "Judged on substance against the embedded corpus and the two maintainer decisions in the orchestrator brief; plans not embedded (gemini/gpt/kimi/mistral-revised_plan-r4.md and all round-3 plans) are cited only as the votes describe them; nothing is drawn from any artifact as evidence about how councils or models behave.",
  "maintainer_decisions": {
    "source": "orchestrator brief embedded in this prompt",
    "applied_as_authoritative": true,
    "content": [
      "V1 retains the discarded copy, on by default, bounded by a count, no undo control; the restore tool is a separate issue reusing the wizard's compare surface; the store is designed for that reader",
      "cost discipline: name the cost of every safeguard; prefer forms that remove a rule; buy no guarantee the one-player model does not need"
    ]
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
    "696bcdba14d33dfeea8e627a90094a2b1955745f39c78677f54bb97f88099ba",
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
    {"material": "ES ProcessStartInfo/launcher, GuiSaveState.cpp delete action, SaveState.h / SaveStateRepository.h defaults, Paths.cpp, setsettings.sh, cloud_setup, backuptool, tools/cloud-test-backend", "reason": "Needed for the delete hook point, copyToSlot's fullPath default, the relink_epoch write point, the RetroArch directory rehearsal and the harness repair; the lock design no longer depends on fd inheritance", "declared_source_path": null, "sha256": null},
    {"material": "rclone 1.75.0 documentation or source for --files-from with lsjson/hashsum/copy, --ignore-times, post-transfer hash verification behaviour, local-backend hash types, --backup-dir with copy under interruption", "reason": "The exit-path mechanism, spawn counts and the -replaced/ bonus are hypotheses until Gates 4 and 7 measure them", "declared_source_path": null, "sha256": null},
    {"material": "The four other members' round-4 plans and all round-3 plans", "reason": "Not embedded; cited only as the injected votes describe them", "declared_source_path": null, "sha256": null},
    {"material": "Any executed result of the round-trip suite, the bisync spike, the #19 bench, or a two-device fixture", "reason": "None exists in the corpus; every gate above is unrun", "declared_source_path": null, "sha256": null}
  ],
  "missing_source_policy": "No missing source paths, hashes, contents, or execution results have been fabricated."
}
```