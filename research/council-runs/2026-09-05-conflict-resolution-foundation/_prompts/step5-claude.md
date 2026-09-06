# Council — Step 5: the handoff, as tracker text

The council has settled on a consensus plan; its handoff section is injected
below, verbatim, and it is the specification. Every decision that section
listed as "the maintainer's to make" has since been made, and those register
rows are injected after it and are binding. So is the vocabulary rule, which
governs every string you write.

Your job is to turn the handoff into **the text the tracker will hold**, so
that whoever picks up each issue on Monday builds the foundation the council
chose and nothing else. The corpus is embedded above, unchanged.

## Anti-self-citation constraint

Write from the substance. Do not describe or characterise the deliberation
that produced it, and do not cite the injected artifacts as evidence about
how councils or models behave.

## What to produce

This project tracks work as **Milestone → Epic → child issues**, and the
children already exist. The current bodies of the epic (#11) and every child
the handoff touches (#9 #10 #19 #21 #22 #23 #24 #25 #35 #37 #7) are injected
below, so you edit real text rather than imagined text. Produce, in this
order:

1. **The epic body for #11**, rewritten: one paragraph of context; the
   architecture in one screen (the reconciler owns every writer; sha256
   identity; per-device manifests; local agreement; the classifier; the
   lifecycle gate; the checked adapter; count-bounded retention in the cloud
   with no undo control; queue-and-badge); the **build order** from the
   handoff mapped to child issue numbers; the **ordered experiments** table
   with each gate's venue and what it unblocks; and the decisions that bind
   the milestone, cited by register ID, not restated.
2. **Each child issue body**, rewritten or amended: the requirements that
   issue carries (R-numbers, verbatim where the handoff gives them), its
   acceptance conditions (A-numbers, verbatim), the gates that precede it,
   and what it must not build. Where the current body says something the
   plan overturns — bisync as the detector, a local retention store, an undo
   control, the old vocabulary — replace it and say in one line what changed
   and why (cite the register ID). Keep each issue's existing acceptance
   checklist form: `- [ ]` items that are observable behaviour, never
   artefacts.
3. **The register rows the handoff proposed** (P1–P8), each resolved against
   the decisions that have since been made: state which are now *already
   decided* (cite the ID and stop), and draft the wording only for any that
   remain genuinely open.
4. **The document edits list** from the handoff, checked against the
   vocabulary rule and updated where a name has changed.
5. **What still needs the maintainer's word**, if anything survives 1–4.
   Expect this to be short or empty; if you list something, say why it is
   not already covered by an injected decision.

## Rules for the text

- **Vocabulary per D-UI-022**: settings, saves (game saves, save states, and
  screenshots), ROMs and BIOS; back up and restore; *sync* only for the
  automatic two-way behaviour; *discarded saves*; never "system backup",
  "save data", "upload", "everything", "cloud library".
- **Config keys are the new ones**: SAVESPATH, SETTINGS_BACKUPS, SAVES_REMOTE,
  SETTINGS_REMOTE, CONTENT_REMOTE. RESTOREPATH no longer exists.
- **Two lines per row, never three** (D-UI-023) wherever you specify
  interface text.
- **Retention lives in the cloud** (D-CLOUD-036), not under `/storage/.cache`
  or `/storage/.local`. Where the handoff's store layout, `record.json`, and
  Gate 2 assume a local store, translate them to the cloud location beside
  the saves folder, keep what the reader (the restore tool, #25) needs, and
  keep the ordering rule the decision states: the loser is verified in the
  cloud before the winner replaces it anywhere.
- **Absence is a question** (D-CLOUD-037) — where the handoff says "hold and
  report", the wizard asks instead, with the mass case still refusing.
- **Launch gating extends the shipped guard** (D-CLOUD-038), not a new
  mechanism.
- **The bisync spike is decisive** (D-CLOUD-039): Gate 11 is scored against
  the written contract and is not "informational".
- Cite corpus sources by their declared path and the register by ID; mark
  every remaining hypothesis with the gate that settles it.
- Refer to the run's artifacts by path under
  `research/council-runs/2026-09-05-conflict-resolution-foundation/` so the
  trail is auditable from the tracker.

Write it so a maintainer can paste each section into its issue with at most
a glance. Headings: `## #11 — <title>` for the epic, `## #<n> — <title>` for
each child, then `## Register rows`, `## Document edits`, `## Needs the
maintainer`.

## The consensus plan's handoff section

=== START consensus-handoff.md ===

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

=== END consensus-handoff.md ===

## Decisions made since, binding

=== START settled-decisions.md ===

| D-CLOUD-032 | 2026-09-05 | **Undoing a conflict decision is a first-class requirement of the wizard, and *keep discarded saves* is the mechanism rather than a nicety — an option the player controls, on by default, shallow.** Maintainer, restating the milestone's purpose while the council deliberated: the goal is *"to preserve the sanctity of the user's saves and to empower them with the choice to make a decision about a conflict,"* and undo of that choice *"is also something a user should have the option to do."* On depth: *"they likely aren't going to be going 8 steps back with the save, but may accidentally make the wrong choice with the conflict and want to undo that choice. That's going to be the primary use case."* So the retained loser of a resolution is not clutter and not history — it is the answer to a mis-press, and one step back is the case to design for. Settles the open question `gpt-revised_plan.md` raised: `docs/conflict-wizard-ia.md` rev 3 had the setting OFF and rev 4 did not revisit it, so the council's converged default-ON needed a decision rather than a comment. It has one. Retention is bounded by the IA's count selector; no default count is named anywhere in the corpus, so #22 picks one and states it. Second half of the call, on how much the edge cases may shape the design: *"some of the edge cases around card disconnection, etc., are good to think about, but again, are edge cases that shouldn't constrain our approach unnecessarily."* Consequence for the council's live disagreement: the argument that deletions must never propagate *because* an unmounted card is indistinguishable from a delete is an edge case driving the architecture, and cannot decide the design on its own. The deciding question is whether a wrong outcome is reversible. An unexplained absence must still fail closed — failing closed is cheap and loses nothing — but a design is not obliged to give up deletion propagation to buy it. | maintainer, 2026-09-05; #11, #22, #25 |
| D-CLOUD-033 | 2026-09-05 | **Refines D-CLOUD-032: version one retains the discarded copy and ships no undo control. Restoring one is a separate tool, and #25 is its home.** The wizard's done page says what was discarded and that the copies are kept; nothing in the resolution flow offers to put one back. Maintainer: *"I don't want to add more complexity to the user during conflict resolution. The goal there is to get the user going as quickly as possible."* Settles the council's second tie, whose two vote pairs were two readings of D-CLOUD-032 — retain the bytes and build less, against make undo a control the player can press in version one. The first reading is correct. The maintainer's shape for the tool that does the restoring: *"an option that allows you to essentially go back through conflict resolution flow and use it as a history restore flow, almost like a time machine, to overwrite the existing save with something from the past"* — the same compare-and-choose surface, pointed at a game's retained past versions instead of at a live conflict, and reachable outside the moment of resolution. **The engineering consequence lands in version one even though the tool does not.** Maintainer: it *"might be something we need to think about how we build if we're saving it."* Nothing reads the discard store in V1, so nothing would catch a shape that a restore tool cannot use — a store keyed only by timestamp, or one that drops which game, which slot, which device and which side won. #22 therefore designs the store as a record a later reader can drive a picker from, and #25 owns the reader. | maintainer, 2026-09-05; #22, #23, #25 |
| D-CLOUD-034 | 2026-09-05 | **A correctness fix that costs complexity, CPU or memory has to earn it; the cheapest sufficient form wins.** Maintainer, on the four blockers the winning council plan carries: *"those concerns seem valid. we need to not overcomplicate our solution in a way that adds undue complexity, computational, and memory overhead to our processes."* Binding on the consensus integration and on #21-#24. This is a handheld: a busybox userland, a five-second budget on the path the player watches after a game, and an SD card doing the writing. Applied to the four blockers, three are free or negative: holding a torn multi-file save instead of promoting it after two unchanged passes **removes** a promotion rule; failing closed on split local roots is one check; turning a lock availability test into a real acquisition is `flock` semantics, not machinery. Only the first has a real price — capture may not hard-link a save into staging, because a hard link shares the inode and an emulator writing a battery save in place then changes bytes already treated as sealed, so it must be an independent copy of a few megabytes per changed save at exit. That one is paid because the alternative is uploading bytes that are not the bytes that were hashed. The general rule the row states: name the cost of a safeguard before adopting it, prefer the form that removes a rule over the form that adds one, and do not buy a guarantee the one-player model does not need. | maintainer, 2026-09-05; #22, council r4 |
| D-CLOUD-035 | 2026-09-06 | **One menu entry owns both the conflict queue and the restores: MANAGE GAME SAVE RESTORES AND CONFLICTS, reached from a badge that counts what is waiting.** Maintainer: *"Makes sense to show a badge and then add a menu item to 'Manage game save restores and conflicts'."* Settles the council's queue-and-badge question (P8) and gives #25's restore tool its home in the same row rather than a second one. An unattended pass therefore never opens the wizard over a player; it counts and badges. The entry does the queue in V1 and grows the history view when #25 lands, so the player learns one place. | maintainer, 2026-09-06; #23, #25 |
| D-CLOUD-036 | 2026-09-06 | **The discarded copy of a resolution lives in the cloud, not on the device. Retention defaults to 3 per save, selectable 1 to 9.** Reverses the council consensus plan's local store and dissolves its `.cache`-versus-`.local` question (C4, P2). Maintainer's argument, which is better than the one it replaces: *"If a conflict is only found when cloud sync is happening, why not just use the cloud as the source of truth? ... If sometimes you can restore from the device and sometimes you can[not], what solution provides the most consistency to the user?"* A conflict cannot exist without a sync, so requiring the network to undo one is consistent rather than a regression, and a local store would let a player resolve on one device and find the undo missing on another. **Ordering is load-bearing and this row is not safe without it: the loser must be verified in its cloud location before the winner replaces it anywhere.** KEEP LEFT is a server-side move of a file already in the cloud and costs no upload; KEEP RIGHT uploads the local loser first and the resolution does not apply if that upload cannot be verified. Retention covers save states as well as battery saves, so thumbnails travel too — a numbered state is 28-51 KB and its PNG about 48 KB, a battery save 8-128 KB, so nine kept resolutions of one game stay under a megabyte. The PPSSPP directory case is measured by the census gate before the ceiling is fixed. | maintainer, 2026-09-06; #22, #23, #25 |
| D-CLOUD-037 | 2026-09-06 | **An unexplained absence is shown to the player as a question, not held as a state they have to learn about.** Maintainer: *"be very transparent about an unexplained absence and just let the user decide what they want to do ... In all likelihood, an unexplained absence would be caused by user behavior and user error. I don't want to overcorrect in a way that would add confusion."* So the wizard already being built asks it, in its own words: this save is gone from this device and still in the cloud, bring it back or remove it everywhere. Refines the consensus plan's hold-and-report, which was correct about never inferring deletion from absence and wrong to make the player discover a new state. Causes it covers: a save deleted over the network or with a file manager instead of through the interface, a swapped card, an interrupted layout migration, a desktop cloud client moving something, a delete made on a device still on the old firmware. The mass case stays separate and stays automatic — an unmounted or empty saves root with agreement on record refuses the whole pass rather than producing a hundred questions. | maintainer, 2026-09-06; #22, #23 |
| D-CLOUD-038 | 2026-09-06 | **A sync that can touch saves gates game launch, extending the guard that already ships rather than adding a new mechanism.** Maintainer: *"We should design the sync moments that involve conflict resolution to gate game launch, similar to how when the scraper is running you can't update gamelists and access other menus."* `FileData::launchGame` already refuses to start a game while `ThreadedCloudSync::isRunning()` and says so on screen. The gap is that it only knows about syncs EmulationStation started, so the boot sync — which runs outside it and downloads while an emulator may be flushing SRAM — is unguarded today. The reconciler's session lock becomes the thing that makes the shipped message true for every sync, whoever started it. Replaces the consensus plan's bounded-wait-then-refuse design (B2's ES half) with a pattern players already recognise from the scraper. | maintainer, 2026-09-06; #22, ES `FileData.cpp` |
| D-CLOUD-039 | 2026-09-06 | **The bisync spike is decisive, not informational: it is scored against a written contract, and a narrow gap is filed upstream rather than worked around.** Reverses the council's framing (C6 made the spike informational once bisync was demoted). Maintainer: *"My general concern is that we'd wind up rebuilding a lot of what bisync should be offering. It's a question of whether we're better off figuring out how to work with bisync and then filing requests upstream than building a sync service on top of a sync service."* The distinction the spike must test: the metadata layer is not a re-implementation of bisync, because which device wrote a version, which core, when, and its thumbnail are not on disk and no sync tool can produce them — they are recorded at exit by the only thing that knows. The overlap is the comparison alone. So the spike asks whether bisync can be the transport under that layer without becoming a second authority, and its fixtures include the ones the council believed would fail it: a multi-file save resolved as a unit, a hashless backend, an external resolution with no `--resync`, and an interrupted run. A failure that is narrow and upstream-shaped becomes a request to rclone, not a fork. | maintainer, 2026-09-06; #9, #22 |
| D-UI-022 | 2026-09-06 | **Cloud vocabulary: two verbs, the noun says what, the destination says where. *Back up* and *restore* are the only verbs; the tiers are *settings*, *saves* (game saves, save states, and screenshots), and *ROMs and BIOS*; *system backup* is retired because the archive holds settings and nothing else; *sync* is reserved for the automatic two-way behaviour saves get after #22; the wizard's kept losers are *discarded saves*.** Maintainer, reviewing `docs/cloud-vocabulary-audit.md`: the upload/archive split was rejected — *"A user won't understand the difference between an upload and an archive. Isn't the archive uploaded too?"* — and destination adopted as the axis: *"Isn't this distinct to say 'back up to device' or 'back up to cloud'?"* All names change **now**, config keys and the archive filename included, read-old-if-new-absent on every reader so an upgraded device keeps its values: *"We should change all of the names now and then make sure it's all uniformly implemented … I'm the only one using this, and I haven't even set up cloud saves on my second device."* The one residual on *discarded saves*: a copy a sync replaced without anyone deciding is not discarded by anybody, so #25's restore tool labels those separately. Extends the rules in `es-native-ui.md` (*back up* / *backup*; *game save* / *save state*; serial comma). | maintainer, 2026-09-06; `docs/cloud-vocabulary-audit.md` §4 |
| D-CLOUD-040 | 2026-09-06 | **Refines D-CLOUD-029 lineage: the restore-root setting is removed; saves have one local folder.** Design intent verified before removal, per `engineering-practices.md`: the split arrived with the original ROCKNIX import (`9f1fab30f6`, 2025-07-13, upstream's code, still carried upstream), and in that script the restore root had exactly one consumer — the folder rclone downloaded into. Its comment is its whole intent: *"Changing the below to be different from BACKUPPATH will prevent data from being replaced on restore."* A safety valve from when restore was a mirror with no conflict handling. Once every writer is the reconciler and nothing overwrites without a decision, the danger it guards against no longer exists, and a split would leave the classifier without one local tree — the same conflict re-offered on every pass forever. Maintainer: *"Why not force these to be the same?"* Removing the key is how. The sentence above is what the upstream PR carries. | maintainer, 2026-09-06; #22 |
| D-UI-023 | 2026-09-06 | **A menu row is a label and at most one line under it; a description that would make a third line moves into the row's confirmation dialog where it is additive.** Maintainer, on 3.5- and 4-inch panels: *"adding a fuller description isn't necessarily always better ... we don't want to have lots of tiny text"*, and on the cloud settings rows that stacked what a row moves on top of how it last went: *"if the description can be moved into the confirmation dialog and it serves an additive function, that's the best-case scenario in principle (because it allows us to keep it to two lines max)."* Corollaries: a row that opens a page with more than one action is a submenu whose label carries the verb and whose page carries the choices; a row that genuinely needs explaining wants a page, not a longer line. Applied the same hour: the cloud hub row became MANAGE CLOUD STORAGE over its submenu's three section names; the sync row lost the two-way sentence that was already its dialog; the two saves rows keep only how they last went; the transfer page's tier rows keep only what they carry, because that page launches with no confirmation. Refines D-UI-017/018's three-line class rows, which had fixed a run-on sentence by making a stack. | maintainer, 2026-09-06; ES `257116b3bb`, `es-native-ui.md` |

=== END settled-decisions.md ===

## The vocabulary rule and the two-line rule

=== START vocabulary-rules.md ===

- **Three tiers, two verbs, and the destination says where (D-UI-022).**
  The things cloud sync moves are **settings** (the archive `backuptool`
  writes: emulator and interface configuration, input mapping, themes,
  collections, bezels — no saves, no ROMs, no operating system), **saves**
  (game saves, save states, and screenshots), and **ROMs and BIOS**. The
  only verbs are *back up* and *restore*; nothing is "uploaded" or
  "archived" in a label, because a player has no way to tell those apart
  and the archive is uploaded too. The label says what and where: BACK UP
  SETTINGS TO THIS DEVICE, BACK UP SAVES TO THE CLOUD, RESTORE SETTINGS FROM
  THE CLOUD. **Never "system backup"** — it held people to expecting their
  games in it — and never "save data", "configurations", "everything", or
  "cloud library". *Sync* is reserved for the automatic two-way behaviour
  saves get after #22, where a player never picks a direction. The wizard's
  kept losers are **discarded saves**; *discard* means nothing else.

## A row that leads somewhere is a label, not a paragraph

Maintainer, 2026-09-06: *"adding a fuller description isn't necessarily always
better. We're dealing with the 3.5- or 4-inch screen here sometimes, so we
don't want to have lots of tiny text. If necessary, sometimes it's better to
have the user click into the menu, where they can have some options or at
least breathing room. If there's more than one action that can be taken, this
likely makes sense within our menu structures, so the user has room to choose
what to do."*

So:

- **A row that opens a page with more than one action is a submenu.** Its
  label carries the verb (MANAGE CLOUD STORAGE, MANAGE GAME SAVE RESTORES AND
  CONFLICTS); the page inside carries the choices, with room. Do not make up
  for a hub label with a description that lists everything behind it — that is
  the tiny text nobody reads, on the panel where it is smallest.
- **A description, where one is needed, is one short line.** The three section
  headings the player will see inside (`BACKUP AND RESTORE, SAVE MANAGEMENT,
  CLOUD STORAGE SETUP.`) is a description; a sentence naming every action is
  not.
- **When a row genuinely needs explaining, that is a signal it wants a page**,
  not a longer line under it.

**Two lines per row, never three (D-UI-023).** Maintainer, the same day, on
the cloud settings rows that carried a label, what they move, and how they
last went: *"when we risk having an extra line, if the description can be
moved into the confirmation dialog and it serves an additive function, that's
the best-case scenario in principle (because it allows us to keep it to two
lines max)."* So a row is a label and at most one line under it. When a second
line wants in, ask what the confirmation dialog already says — the itemisation
of what moves belongs there, where it is read at the moment of deciding — and
what the page's job is: on a page that launches a job, the line under the row
is how it last went; on a page that chooses what moves, it is what the row
carries. A row with no confirmation has nowhere to move a line to, so it
keeps the line that serves the page's job and drops the other.

The case: the cloud hub row briefly carried "BACK UP OR RESTORE, CHOOSE ROMS AND
BIOS, SET WHEN SAVES SYNC, AND CONNECT OR REPAIR YOUR CLOUD STORAGE." — accurate,
and wrong, replaced the same hour.

=== END vocabulary-rules.md ===

## Current tracker text

=== START issue-11.md ===

# #11 [OPEN] cloud-sync: conflict resolution between local and cloud
labels: enhancement, epic, cloud-saves  milestone: Cloud Saves: Visual Conflict Resolution

**Epic** for the *Cloud Saves: Visual Conflict Resolution* milestone.

## Vision (Vita-style)

Like the PlayStation Vita's sync screen: when local and cloud diverge, the player walks the conflicts **system by system, game by game**, seeing **both versions side by side with screenshots**, and chooses **KEEP CLOUD / KEEP DEVICE / MERGE** — with unmistakable arrow/dimming iconography showing what survives. Everything is native EmulationStation, controller-first.

- **Merge** (savestates): keep both by re-slotting — the conflicting state increments (append) or inserts with later states shifted down. Slot-limited cores fall back to keep-one (#24).
- **Metadata** per save/state: game + ROM name, UTC timestamp (+ device-local rendering), handheld friendly model name (device-tree mapping), emulator/core + version, screenshot, slot, schema version (#20).
- **Cross-device**: game saves are portable; savestates are bound to core/version/arch — a compatibility rules table (#19) drives badges and merge offers. Long-term goal: pick up on one device, sync, resume on another.
- **Sync model**: one player, many devices — not concurrent play. Conflicts arise from a forgotten sync-up before syncing down elsewhere; the detection engine therefore tracks last-synced state, not just timestamps (#22).
- **Safety**: divergent items transfer nothing until resolved; V2 snapshots make every resolution reversible (#25). Progress preservation stays the prime directive.

## Task breakdown

- [ ] #19 — research: savestate cross-device compatibility matrix + device friendly names
- [ ] #20 — design: save/savestate metadata manifest (schema, screenshots, snapshot-ready)
- [ ] #21 — backend: capture manifests at save/state write time
- [ ] #22 — backend: conflict detection engine (last-synced tracking, JSON for UI)
- [ ] #23 — ES UI: Vita-style conflict wizard (system→game, side-by-side, iconography)
- [ ] #24 — merge semantics: savestate re-slotting + per-core slot limits
- [ ] #25 — V2: pre-change snapshots & rollback (planned now, built after the wizard)

## Ordering
#19/#20 (parallel research+design) → #21 → #22 → #23 (+#24 feeding it) → #25. Relates: #10 (namespacing), #9 (bisync), #8 (auto-sync), #15 (native ES program).

=== END issue-11.md ===

=== START issue-9.md ===

# #9 [OPEN] cloud-sync: adopt rclone bisync to unify backup/restore
labels: enhancement, cloud-saves  milestone: none

## Summary
Replace the separate `cloud_backup` + `cloud_restore` with rclone **bisync** for a single bidirectional sync.

## Prior art
Planning doc `plans/bisync/rclone-bisync-planning.md` and branch `rclone-bisync-beta` (commit `4be6c47146`).

## Scope / considerations
- First-run `--resync` bootstrap; persistent state/workdir across reboots.
- Filter parity with `cloud_sync-rules.txt`.
- Built-in conflict handling (`--conflict-resolve` / `--conflict-loser`) — ties into the conflict-resolution issue.
- Robust recovery from interrupted runs (immutable rootfs / sudden power-off).

_Related: conflict resolution, liveness, system-backup revamp._



## Superseded scope (alignment review, 2026-09-05)

The planning doc on `rclone-bisync-beta` (Phase 3: "automatic conflict resolution (newer file wins)", `--conflict-resolve newer`) predates the milestone's rule and **is struck**: #11's cardinal rule is that resolution never defaults to recency, and `docs/conflict-wizard-ia.md` gives the wizard the decision. What bisync contributes here is **detection** — `--conflict-resolve none` (its default) reports; the wizard resolves; `--conflict-loser` is never left to rename a savestate (`…conflict1` breaks `{{romfilename}}.state{{slot}}`); the detector never runs `--resync` on its own. The acceptance criteria that bind this are on #22. Per-core handling (the plan's Phase 4) is #10 / D-CLOUD-017; the "newer wins" bullets in the plan are historical.

=== END issue-9.md ===

=== START issue-10.md ===

# #10 [OPEN] cloud-sync: per-core savestate namespacing, with the core build recorded in a per-device manifest (D-CLOUD-017)
labels: enhancement, cloud-saves  milestone: Cloud Saves: Visual Conflict Resolution

## Summary
Namespace savestates **per core** and **per chipset/arch** (arch element TBD) so incompatible cores/architectures can't clobber each other's states across devices.

## Motivation
Savestates frequently break across core versions and CPU architectures; syncing a flat namespace risks corruption when a state made on one device/core is restored on another. The rocknix.org cloud-sync docs already warn about state incompatibility.

## Scope
- Leverage RetroArch's per-core / per-content subfolder options.
- Define a namespacing scheme (core + chipset/arch) and a migration for existing states.

## Open question
Key on **arch** (aarch64 vs arm), **chipset**, or **device**? (TBD)

_Related: conflict resolution, bisync._



## Superseded (D-CLOUD-017, 2026-09-01) — body note added by the futro of 2026-09-05

The open question above is answered: key on **core**, not arch, chipset or device. Directories are structure and churn permanently; the core build (our own `PKG_VERSION` pin) goes in a per-device manifest under `savestates/.rocknix/states-<device-id>.json` as data. Existing states are `unknown`. Warn, do not block. Game saves are excluded. See the 2026-09-01 comment for the full reasoning.

Verified 2026-09-05 on the RG35XX SP: the layout is still flat per system (`/storage/roms/savestates/fbn/mslug.state1`), so this is decided and not built. ES already substitutes `{{core}}` in a savestate `directory` template (`SaveStateConfigFile.cpp:51-55`); open item before building:

- [ ] ~~Locate the shipped `es_savestates.cfg`~~ **There is none** (alignment review, 2026-09-05): not in the ES repo, not in the rocknix tree, not on the device. ES runs on its compiled defaults (`SaveStateConfigFile.cpp` `Default()`: `directory = "{{system}}"`) and `Paths.cpp:83` hard-codes the root `/storage/roms/savestates`. Per-core directories therefore mean **creating** an `es_savestates.cfg` for the ES package *and* pointing RetroArch's `savestate_directory` (`setsettings.sh:811`, today `${SNAPSHOTS}/${PLATFORM}`) at the same layout — two consumers, one layout, verified together.
- [ ] The layout change is a migration of player data: read both layouts, copy-verify-delete, never stamp what was not verified (`upgrade-and-install.md`, blindspot 10).

=== END issue-10.md ===

=== START issue-19.md ===

# #19 [OPEN] conflict-resolution: research savestate cross-device compatibility matrix
labels: cloud-saves  milestone: Cloud Saves: Visual Conflict Resolution

Part of the conflict-resolution milestone (epic: #11).

Game saves (SRAM/memcard) are generally portable; **savestates are bound to emulator, emulator/core version, and often architecture**. Before cross-device sync can be safe, we need a rules engine for "is this savestate usable on that device?".

## Tasks
- [ ] Inventory the emulators/cores we ship (`*-lr`, `*-sa`) and document savestate portability per core: same-core cross-arch? cross-version? (RetroArch cores vary; some embed core version in the state header.)
- [ ] Define **compatibility keys**: (core, core-version, arch?, platform?) → the minimal tuple that must match for a state to load. Relates #10 (per-core/arch namespacing).
- [ ] Device identity: map device-tree compatible strings / `HW_DEVICE` to **friendly model names** (e.g. "RG353V", "Retroid Pocket 5") for display and manifests.
- [ ] Deliverable: `compatibility rules` document + machine-readable table the conflict engine can consume.

## Test sequencing (added 2026-08-27)

A second H700 handheld (RG-SP) joins the existing RG35xx SP, giving **two devices on one chipset** — the control this matrix previously lacked. With three different build families only, a failed transfer cannot separate chipset from core version from anything else. Holding the chipset constant makes the result decisive either way:

- transfers → chipset is the real variable, build the cross-chipset matrix
- does not transfer → chipset was never the variable, and #10's per-chipset namespacing is aimed wrongly

Run the same-chipset control **first**; it is far cheaper than the full matrix and determines whether the matrix measures what it claims to.

## Acceptance criteria

- [ ] A reviewed doc + machine-readable table answering, for each shipped core: which other devices' states it can load, keyed by the compatibility tuple above.
- [ ] Device identity resolves to a **model**, not a build target. `scripts/image:163` sets `HW_DEVICE="${DEVICE}"`, so twelve distinct Anbernic handhelds all report `H700`; two devices sharing that build target must report distinct identities, verified on the RG35xx SP and RG-SP pair. The model string is available at `/proc/device-tree/model` (precedent: `ap6611s/autostart/008-ap6611s`, and H700's `bootloader/update.sh` reading `rocknix-dt-id`).
- [ ] The same-chipset control is run and recorded before the cross-chipset matrix.

Blocks #20 (a manifest recording `H700` as provenance cannot distinguish two H700 devices) and #23 (`docs/conflict-wizard-ia.md` specifies `device + model` per side; two identical `H700` rows convey nothing). Related: #44.

=== END issue-19.md ===

=== START issue-21.md ===

# #21 [OPEN] conflict-resolution: capture manifests when saves/states are written
labels: cloud-saves  milestone: Cloud Saves: Visual Conflict Resolution

Part of the conflict-resolution milestone (epic: #11). Depends on the manifest schema (#20).

Write the manifest sidecars at the moment saves/states are produced.

## Tasks
- [ ] Hook points: the game-exit path that already runs the save sync — `FileData::launchGame` → `ThreadedCloudSync` (`e74fe4e58a`); the OS hook `/usr/bin/scripts/game-end/` was removed (`357dfcffd7`) and must not come back as a second path. Plus RetroArch save/state naming conventions and standalone emulators' save dirs.
- [ ] Populate device/emulator fields (friendly name from #19; core version discovery per emulator).
- [ ] Pair screenshots: reuse RetroArch state thumbnails; define capture for cores without them.
- [ ] Backfill strategy for pre-existing saves (manifest-less files must still sync and appear in conflicts with degraded info).
- [ ] Keep manifests inside the existing sync allowlist so they travel with the saves.

## Acceptance
Playing a game and saving/stating produces correct manifests; existing saves keep working without them.


## Futro adjustments (2026-09-05, futro on #11)

- [ ] Manifests for **in-game saves** pass the sync allowlist. Verified 2026-09-05 with a fixture on the RG35XX SP: `rclone lsf -R --files-only --filter-from /storage/.config/cloud_sync-rules.txt` passes everything under `savestates/` and excludes `snes/game.srm.json`, `snes/game.srm.manifest`, `snes/.cloud-meta.xml` (`- /**/*.xml`, `- /**`). Either the manifest lives under `savestates/` or the rules gain an explicit `+`; the fixture command is the acceptance test.
- [ ] Nothing stamps a file it did not write: pre-existing saves stay `unknown`, and `unknown` is a value the wizard renders, not an error (per #10 and #20 threads; `upgrade-and-install.md`).
- [ ] Any script this issue adds that touches the cloud takes `take_cloud_lock` (`b9ea9f3fe8`).
- [ ] Device fields come from `cloud_device_id` / `--label` (verified on the device: `ROCKNIX-ee5013fc56`, `Anbernic-RG35XX-SP`).



## Constraints from the schema and its alignment review (2026-09-05)

- [ ] **Core pins file.** `core_build` is our `PKG_VERSION` pin and nothing on the device carries it (`/usr/lib/libretro/*.info` exists but holds libretro-super's `display_version`). Emit `/usr/share/rocknix/core-pins` at image build — one line per core package, `<package> <PKG_VERSION>` — from `LIBRETRO_CORES` in `virtual/emulators` via `get_pkg_version` (`config/functions`). The capture step maps core name → package (`mgba` → `mgba-lr`, `genesis_plus_gx` → `genesis-plus-gx-lr`; exceptions in a small table) and records `"unknown"` when the map has no answer.
- [ ] **Told, not discovered.** ES passes `--system`, `--rom`, `--emulator` (`getEmulator(true)`) and `--core` (`getCore(true)`) on the command line at the exit path (`FileData.cpp:836`); the capture step never infers which core wrote a state. Standalone emulators pass their own name as the core.
- [ ] **No second rclone spawn.** The manifest is written *before* `cloud_backup --yes --saves-only --recent` runs, in the same exit path; it lives under `savestates/` and is newer than the last-backup stamp, so it rides the existing `--max-age` window. D-CLOUD-028's budget stands: one rclone start (~1 s on an A53), no extra listing.
- [ ] Written whole to a temporary name and renamed into place; a reader never sees a torn file.
- [ ] `docs/save-manifest-schema.md` §6 is the field contract; §7 the worked examples; the `manifest-<id>.json` file is asserted by the #35 step added the same day.

=== END issue-21.md ===

=== START issue-22.md ===

# #22 [OPEN] conflict-resolution: conflict detection engine (local vs cloud manifests)
labels: cloud-saves  milestone: Cloud Saves: Visual Conflict Resolution

Part of the conflict-resolution milestone (epic: #11). Depends on manifests (#20/#21).

Detect real conflicts instead of trusting timestamps. Conflicts arise when someone forgets to sync up on device A, syncs down on device B, plays, and syncs up — both sides now diverge from the last common state.

## Tasks
- [ ] Track last-synced state per file (small local db / remote manifest snapshot) so "both changed since last sync" is detectable — not just "differs".
- [ ] Classification: local-only / cloud-only / identical / **divergent** (needs user decision); group by system → game for the wizard (#23).
- [ ] Machine-readable conflict list (JSON) consumed by the ES UI, including both manifests + screenshot paths.
- [ ] Non-destructive by default: no transfer happens for divergent items until resolved (progress-preservation guardrail).
- [ ] CLI mode for debugging (`cloud_conflicts --list`).

## Acceptance
Forced-conflict test matrix (edit both sides) yields correct classification and a stable JSON the UI can render.


## Futro adjustments (2026-09-05, futro on #11) — this issue owns the write paths

Verified 2026-09-05: the shipped two-way sync already resolves a both-sides change by recency, before any detector runs.

```
autostart/102-cloud-saves:21   /usr/bin/cloud_restore --yes --method=copy --update
autostart/102-cloud-saves:22   /usr/bin/cloud_backup  --yes --method=copy --update
GuiMenu.cpp (SYNC SAVE DATA)   the same pair
FileData.cpp:836 (game exit)   /usr/bin/cloud_backup --yes --saves-only --recent
cloud_backup:639-646            --recent: --max-age Ns --no-traverse, method forced to copy, no --update
```

`copy --update` skips only a newer destination, so down-then-up is newest-wins with no record; the `--recent` upload has no `--update` and overwrites a newer cloud copy outright. Blindspot 28. Stopgap decision parked as D-CLOUD-029.

Additional acceptance criteria:

- [ ] A save changed on both sides since the last agreement is **refused, not resolved**, by the boot pass, the game-exit pass and the SYNC row — shown by a constructed two-device fixture in `tools/cloud-round-trip` (#35) whose pass condition is that neither copy was overwritten.
- [ ] The detector never runs `bisync --resync` on its own (`--resync-mode` defaults to path1-wins); the first run is an explicit, maintainer-driven step; `--recover` and `--resilient` are used.
- [ ] `--conflict-loser` is never left to rename a savestate; a dry-run listing grepped for `conflict` in filenames is the guard, and it is shown to fire on a constructed conflict.
- [ ] The bisync workdir is named explicitly in the script and lives outside the synced tree (default `/storage/.cache/rclone/bisync`; `HOME=/storage`).
- [ ] Every call takes `take_cloud_lock`; exit 3 = SKIPPED is surfaced.
- [ ] Before the `copy --update` pair is replaced or wrapped, the issue records what it guarded and where each guard now lives: the newer-on-destination skip, restore-before-backup ordering, the `--recent` window, the stamps GAME SETTINGS reads (D-UI-018).
- [ ] A silent run is distinguishable from "no conflicts" (blindspot 22): the JSON carries an explicit status, never an empty list standing for success.

=== END issue-22.md ===

=== START issue-23.md ===

# #23 [OPEN] conflict-resolution: ES-native Vita-style conflict wizard
labels: cloud-saves  milestone: Cloud Saves: Visual Conflict Resolution

Part of the conflict-resolution milestone (epic: #11). Depends on the detection engine (#22). Console-first: everything happens in EmulationStation with a controller.

Modeled on the PlayStation Vita's sync conflict screen: the player sees **both versions side by side with screenshots** and decides.

## Flow

> **Superseded 2026-08-24.** The design below replaces the original
> Vita-style spec. Full IA and rendered wireframes:
> [`docs/conflict-wizard-ia.md`](https://github.com/maxengel/rocknix/blob/next/docs/conflict-wizard-ia.md)
> · <https://claude.ai/code/artifact/5da9ce12-b088-4db0-8557-4b34fe454dd6>

- [ ] **No entry screen.** The conflict count is the header of the first
      conflict ("3 CONFLICTS FOUND"); non-conflicting files sync first, without
      prompting.
- [ ] Walkthrough ordered **system by system, then game by game**.
- [ ] Per conflict: two panels, **CLOUD always left**, THIS DEVICE right, with
      the source badge overlaid on the picture.
- [ ] **Savestates** show the RetroArch screenshot. **In-game saves show a
      glyph** — no screenshot exists for a `.srm`, and substituting a different
      image would drive wrong choices.
- [ ] Metadata per side: date · time · device + model · core/emulator +
      version. **No file size, no play time** (neither is actionable, and
      ranking by play time reintroduces a recency-style heuristic).
- [ ] Choices: **KEEP LEFT / KEEP RIGHT / KEEP BOTH**; the selected column(s)
      highlight, so LEFT/RIGHT never has to be mapped onto CLOUD/DEVICE.
- [ ] **KEEP BOTH is savestates only**, moving the merged copy to the next free
      slot via ES's own `getNextFreeSlot()`. On in-game saves it is **dimmed
      with a reason** (fixed cartridge slots), not hidden.
- [ ] **No summary screen and no deferral.** The last CONTINUE becomes
      **COMPLETE**; nothing transfers until then. A "Review decisions before
      applying" setting (off by default) restores the summary for those who
      want it.
- [ ] **Keep discarded saves** setting (off by default) with a retention count,
      shown dimmed while off — this, not deferral, is the escape hatch for
      "I am not sure", and it is what makes a one-way choice acceptable.
- [ ] Compatibility badge when the other side's savestate would not load here
      (from #19 rules).
- [ ] Resolutions recorded in an **audit log**.

## Building blocks (see es-native-ui.instructions.md)
ImageComponent side-by-side in a ComponentGrid, GuiMsgBox confirms, AsyncNotificationComponent for the apply step, GuiLoading for manifest fetch.



## Futro adjustments (2026-09-05, futro on #11)

- [ ] The wizard opens only after the non-conflict pre-pass (cloud-only down, device-only up) has **completed**, and says so if it has not — otherwise KEEP BOTH can pick a slot the cloud already holds and one resolved conflict becomes a new one at the next sync.
- [ ] The done page names each discarded copy per game, and its audit line (`/storage/.cache/log/cloud_audit.log`, D-CLOUD-027) is written **before** the apply step deletes anything.
- [ ] Layout proven at 480×320 (RG351M) first and at 640×480, by `tools/vm-visual-qa` frames, not by reading the code.
- [ ] The compatibility badge is designed only after #19 has run (D-CLOUD-025); until then the panels show core + build pin as plain text.

=== END issue-23.md ===

=== START issue-24.md ===

# #24 [OPEN] conflict-resolution: savestate merge semantics (slot renumbering + limits)
labels: cloud-saves  milestone: Cloud Saves: Visual Conflict Resolution

Part of the conflict-resolution milestone (epic: #11). Feeds the wizard (#23).

MERGE for savestates means **keeping both sides** by re-slotting: the conflicting state increments to the next free slot (likely appended at the end) or is inserted with later states shifted down — no state is lost.

## Tasks / research
- [ ] Per-core slot model survey: max slots, slot-in-filename conventions (RetroArch `.state`, `.state1..N`, `.auto`), which cores tolerate renumbering (pure file rename vs embedded metadata).
- [ ] Define merge algorithm: append vs insert+shift; deterministic ordering (by UTC timestamp); thumbnail sidecars must move with their states.
- [ ] Slot-limited cores: when the limit would be exceeded, merge is not offered — wizard falls back to keep-one (document per-core in the #19 table).
- [ ] Game saves (SRAM): merge is generally impossible — binary choice only; confirm exceptions (e.g. per-slot memcard formats) are out of scope for v1.

## Acceptance
Merge spec reviewed; a dry-run tool demonstrates re-slotting on a fixture set without corruption.

=== END issue-24.md ===

=== START issue-25.md ===

# #25 [OPEN] conflict-resolution: pre-change save snapshots and rollback (V2)
labels: cloud-saves  milestone: Cloud Saves: Visual Conflict Resolution

Part of the conflict-resolution milestone (epic: #11). V2 — **planned from the onset** so earlier pieces don't preclude it; built after the wizard ships.

Before any conflict resolution (or destructive sync) mutates saves, snapshot the affected files so the player can roll back.

## Tasks
- [ ] Snapshot layout + retention (e.g. `savestates/.snapshots/<timestamp>/`, excluded from the sync allowlist; size-capped, N most recent).
- [ ] Hook: the wizard's apply step (#23) and any `sync`-mode transfer snapshot first.
- [ ] Manifest schema (#20) reserves the fields snapshots need (origin, reason, resolved-against).
- [ ] Rollback UI: list snapshots per game, restore with confirmation (reuses the wizard's visual language).

## Acceptance
Resolving a conflict wrongly is recoverable: one rollback restores the pre-resolution state byte-for-byte.


## Added by the manifest alignment review (2026-09-05)

- [ ] The snapshot directory is excluded from the sync allowlist by a rule placed **before** `+ /savestates/**` in `cloud_sync-rules.txt` (`- /savestates/.snapshots/**`): rclone filters take the first match, so anything under `savestates/` syncs unless a rule ahead of that line stops it. "Excluded from the allowlist" is a requirement on this issue, not a property of the layout (`docs/save-manifest-schema.md` §8). Verified by the allowlist fixture (`rclone lsf -R --filter-from`) showing the snapshot path absent.
- [ ] A snapshot's own manifest uses the save manifest schema unchanged (`kind`, `sha256`, `replaces`); the reason it was taken is an audit-log line (D-CLOUD-027), not a schema field.

=== END issue-25.md ===

=== START issue-35.md ===

# #35 [OPEN] qa: fresh-handheld round-trip on two VMs
labels: cloud-saves  milestone: Cloud Saves: Fresh Handheld Journey

Child of epic #26 — the milestone's exit test, run for real.

## Procedure
Two fresh GENERIC_X64 VM disks (`generic-x64-vm`): complete the journey on VM1 (link remote → restore/populate → play → back up), then on a fresh VM2: link remote → RESTORE EVERYTHING (+ content) → re-link wizard → play VM1's save.

## Acceptance criteria
- [ ] Documented step-by-step procedure (work log + this issue) reproducible by someone else.
- [ ] VM2 ends with: settings applied after reboot, saves/savestates/screenshots present, ROMs/BIOS restored, and the re-link wizard having walked WiFi/password/ScreenScraper/RA/cloud steps.
- [ ] A game save created on VM1 loads and plays on VM2.
- [ ] Every defect found is filed as its own issue and linked here before this closes.


## Added by the futro of 2026-09-05 (epic #11)

- [ ] **Two-device both-sides-changed step**: the same save modified on two "devices" (two local roots against one remote) since their last agreement; run the boot pair (`cloud_restore --method=copy --update && cloud_backup --method=copy --update`) and the game-exit `cloud_backup --recent` from each. Pass condition: **neither copy is overwritten** and the pair is reported for the wizard. As shipped today this step fails (blindspot 28) — it must be seen to fail before #22 makes it pass.


- [ ] **Manifest step** (added by the alignment review, 2026-09-05; written before #21 lands so it fails first): plant a savestate and a `.srm`, run the exit path, and assert `savestates/.rocknix/manifest-<device-id>.json` reaches the remote with entries whose `sha256` equal the planted bytes; `remote_hash` is `null` on the WebDAV backend (no hashes) and non-null on S3 (`CLOUD_QA_BACKEND=s3`, MinIO offers md5) — both backends, because the null path is the fallback the schema relies on. Then run `cloud_content_backup` and assert the manifest is **absent** from the content tier.

=== END issue-35.md ===

=== START issue-37.md ===

# #37 [OPEN] ES: sync saves from the savestate manager at game launch
labels: cloud-saves  milestone: none

Child of #15 (native ES experience, L3).

The savestate manager appears just before launch and is exactly where a player notices that a save from their other handheld is missing. Today the only fix is backing out to Game Settings → Cloud Tools and running a sync, then relaunching. A tile on this screen removes that entirely.

## Shape

A tile at **position 0** of the existing grid — left of START NEW GAME — that pulls saves and rebuilds the grid in place. Everything else about the screen is unchanged.

Selecting it runs a **saves-only** pull (`cloud_restore --saves-only`, which already exists) behind a blocking `GuiLoading` spinner. That is deliberate: if the sync ran in the background while the grid stayed live, a player could pick a slot that is mid-download or about to be replaced — the worst possible moment. `GuiLoading` already swallows all input and dismisses itself when the worker returns, so "modal, shows status, disappears" is native behaviour rather than new machinery. On completion, rebuild the grid and surface the outcome as a toast.

An in-tile spinner (animating the tile itself instead of a modal) would be a nicer end state, but `GridTileComponent` renders a static image and has no busy state today, so it is a follow-up refinement rather than the first cut.

## The hint

`GuiSaveState` already has a dynamic help bar — `updateHelpPrompts()` is wired to a cursor-changed callback and the prompts already vary by selected item (DELETE / COPY TO FREE SLOT appear only on a populated slot). So the hint belongs there: when the sync tile is selected the bar reads SYNC rather than LAUNCH, which is the idiomatic mechanism and adds no on-screen clutter.

## Acceptance criteria

- [ ] A sync tile is the leftmost item in the savestate grid, shown **only when a cloud remote is configured** (`/storage/.config/rclone/rclone.conf` exists) so it is never a dead end.
- [ ] **The default cursor position is unchanged.** Inserting at index 0 must not move the initial selection onto the sync tile — the grid still opens on whatever it opens on today.
- [ ] Selecting it runs `cloud_restore --saves-only` behind a blocking spinner; the grid cannot be operated until it finishes.
- [ ] The call is wrapped in `timeout` (`/usr/bin/timeout` ships on the image) so a stalled network cannot trap the player on the launch screen. On timeout, report it and leave the grid usable.
- [ ] The grid is rebuilt from disk after a successful sync, so a newly-pulled state is immediately selectable.
- [ ] Outcome surfaced as a toast (`<glyph> SYNC SAVES : FINISHED` / failure pointing at the log), matching the existing cloud toast shape.
- [ ] Help bar reads SYNC when the tile is selected.
- [ ] Respects the single-instance guard — if a sync is already running (boot sync, manual run), say so rather than starting a second.

## Related

- #7 — the boot sync exists but uses `ping google.com` as its liveness check; `cloud_setup --check` is the better primitive now that it exists.
- #14 — single-instance `flock`, which this shares.
- #24 — this screen already has a **COPY TO FREE SLOT** action, which is the mechanism cross-device states would arrive through, and the tiles already render `emulator: core` per slot, so origin badging has a place.

=== END issue-37.md ===

=== START issue-7.md ===

# #7 [OPEN] cloud-sync: liveness check + sync on boot and shutdown
labels: enhancement, cloud-saves  milestone: none

## Summary
Add a remote **liveness check** and trigger cloud sync automatically on **boot** (pull latest) and **shutdown** (push latest), so devices stay current without manual Tools actions.

## Scope
- Liveness check: confirm network is up and the remote is reachable (e.g. `rclone lsd <remote>`); skip gracefully and log when offline.
- Boot: restore/pull latest saves before play.
- Shutdown: back up/push latest saves; must complete before network teardown.
- Wire via systemd (a boot oneshot + correct shutdown ordering) calling the existing scripts.

## Considerations
- Boot delay budget; shutdown race with network down.
- Interacts with auto-save-after-exit, bisync, and conflict resolution (see related backlog issues).

_Related: bisync, conflict resolution, system-backup revamp._

=== END issue-7.md ===
