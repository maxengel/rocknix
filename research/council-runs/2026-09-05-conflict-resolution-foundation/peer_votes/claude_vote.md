**Winner: `gpt-revised_plan.md`.**

## Reasoning

I read all four against the embedded corpus and traced the player-progress paths through each. The vote turns on criterion 1, and it turns on one scenario the project itself already treats as ordinary.

### The deciding case: a download landing on a live save

`autostart/102-cloud-saves` backgrounds the boot sync, waits up to ~60 s for network, then runs a full restore. `docs/cloud-sync-changelog.md` lists "exit a game while the boot-time sync is still running (… launch and quit a game within a minute)" as a standard test, so boot-sync/gameplay overlap is not exotic. `docs/save-manifest-schema.md` §4 records `autosave_interval = "10"` — RetroArch flushes SRAM to disk every ten seconds from memory. Now run the primary multi-device journey (play on B, boot A, launch the same game promptly) through each plan's *new* boot pass:

- **`kimi-revised_plan.md` F5**: stage-down → hash → three-way test → apply non-conflicts. The SRAM is L = A, C ≠ A → "cloud changed, download, no prompt." If that download lands while RetroArch holds the old SRAM in memory, the next 10 s flush overwrites B's progress on disk; agreement is now B's hash; at exit L ≠ A, C = A → "device changed, upload, no prompt." B's progress is gone from the cloud, and B's next boot pulls A's copy down. Silent, and in the exact flow the feature exists for. Kimi's plan gates nothing against an active session — its F1/F12/§8.1 handle only the *upload* direction (`*.bak`, zombie slots). 
- **`mistral-revised_plan.md`**: names the race only as an experiment (§4), no design element.
- **`gemini-revised_plan.md`** §4C: one sentence ("the lock must exclude active gameplay"), no mechanism, no ordering.
- **`gpt-revised_plan.md`** §4.9: a local save-lifecycle gate shared by launch preparation, the active session, `onGameEnded()` cleanup, ES renumbering, and cloud materialisation; a boot pass may inspect/upload sealed staging data during a game but "must not restore over live SRAM, renumber active states, or scan ES's provisional copies as final saves," and records pending work if it cannot get a window. §4.3 also captures pre-session hashes and orders capture *after* `onGameEnded()` — which I verified against `es/FileData.cpp.launchGame-excerpt-l740-850.cpp` (`onGameEnded` → `refresh()` → `fireEvent` → `ThreadedCloudSync::start`).

The brief says an elegant architecture with one silent-overwrite path loses to a plainer plan with none. `gpt-revised_plan.md` is the only plan in which I could not construct one.

### Second progress test: hashless backends

`docs/save-manifest-alignment-review.md` §1 records the QA WebDAV as offering neither hashes nor modtimes; `cloud_backup`'s #53 block shows rclone then compares by size alone, and SRAM is a fixed 65,536 B. 
- gpt §4.4: "on the hashless QA WebDAV, read and hash the relevant remote content before authorizing an overwrite," and force the decided transfer past rclone's size comparison — the #53 lesson applied. 
- kimi F3 states the right principle ("any path whose decision matters gets download-and-hash confirmation") but its substrate contradicts it: the staging mirror skips by backend metadata, i.e. size-only on that backend, and F9(1) leans on "the staging pass is recent by construction." Underspecified, fixable, but a gap as written.
- mistral §3.1: "size+mtime on hashless backends" — on a backend with no modtimes that is size-only, so a same-size SRAM change in the cloud classifies as "device changed → upload, no prompt." A designed silent overwrite.
- gemini: how the cloud SHA-256 is learned is never said.

### Grounding

`gpt-revised_plan.md`'s source claims all check out against the embedded files: the auto-only `-99` path (`es/SaveStateRepository.cpp` — `slot` stays `-1` for `matchAutoFile`, the vector is non-empty, the 99999→0 scan misses); `copyToSlot()` ignoring both file-operation results (`es/SaveState.cpp`); config-driven mode hard-coding `racommands = false` and defaulting `autosave`/`incremental` off (`es/SaveStateConfigFile.cpp`); the `setupSaveState()` core rewrite gated on `!racommands`; the numbered-slot session lifecycle (`.bak` rename, auto copy, provisional slot, restore at exit) — read accurately, and its consequence that "auto is written every exit" mis-describes the payload; rclone exit 3/4 passing through `clean_exit` and being rendered as SKIPPED by `es/ThreadedCloudSync.cpp` while stamping a last-run; `tools/cloud-round-trip` writing `rclone.conf` *before* asserting the remote and false-failing on dated archive names. It also concedes what the corpus cannot establish (`makeStateFilename`'s default argument, current issue bodies) and refuses two `gemini_peer_review.md` findings after checking `cloud_sync_helper`. `kimi-revised_plan.md` is nearly as well grounded (its concession table is the best in the set). `mistral-revised_plan.md` states inference as fact ("bisync is blind to SRAM on WebDAV", "workdir is a corruption hazard"), calls the IA's still-true 99999-slot observation "wrong," and its "Replaced D-CLOUD-029" row restates what the row already says. `gemini-revised_plan.md` justifies default-on retention with `--backup-dir`, which `cloud_backup` uses only in `sync` mode and has nothing to do with wizard discards.

### Implementability and sequencing

This is where gpt is weakest and kimi strongest, and I say so plainly. Kimi's staging mirror ("one mechanism, four consumers") is the most concrete thing any plan offers a bash/jq team; its shadow-mode census gating the apply step is the cheapest safety gate in the set. gpt's §4.7 protected-publication protocol and §4.8 journal are heavy. But gpt prices its own cost and gives a fail-safe degradation (exit path uploads protected candidates and leaves reconciliation pending; never falls back to an unchecked canonical overwrite), keeps the idle exit at zero remote contact, and its Gates 0–6 put harness repair and lifecycle observation before any code. Mistral has no harness-repair step at all despite the harness being unsafe on a configured handheld; gemini lists four experiments without ordering them against build steps. On the brief's ordering, a safer foundation whose buildability must be tightened beats a buildable one whose safety must be re-derived.

## Dissent — what the losing plans have that the winner does not fully absorb

**`kimi-revised_plan.md`** (the runner-up; most of this should be in the synthesis):
- **F3 staging mirror** as the concrete substrate for learning C by content, and as the shared source for cloud-side thumbnails, KEEP BOTH materialisation, the discard store and upload certification. gpt says "read and hash" but never names the mechanism.
- **§8.8 shadow-mode census** with a defined "verdict-table bug" gating the wizard's apply step; gpt's step 3 is the same idea with less definition.
- **F12 / §8.0 fixture**: a customised nonempty `RCLONEOPTS` lacking `--filter-from` currently syncs with *no allowlist* (`cloud_backup` only falls back on an empty array). Verified; a shipped hazard gpt does not name.
- **F2 transport rule**: `/savestates/.rocknix/**` excluded from every tree transfer by command-line `--exclude` (which `.claude/rules/rclone-cloud-sync.md` records as applied ahead of `--filter-from`), manifests moving only by explicit single-file copy — closing the stale-foreign-manifest republication path. gpt's "cached copies must not be uploaded" states the goal, not the mechanism.
- **F3 "observed-equal" agreement write** when L = C and A is unknown — closes the first-run false-conflict loop cheaply.
- **§6 D-CLOUD-017 refinement deferring #10's directory materialisation** past the wizard because `es_savestates.cfg` is a launch-behaviour migration. gpt treats #10 as a migration to *prove* (§4.10); deferral is the cheaper safe option for this milestone.
- **F7.4 conflicts queue via a `GAME SETTINGS > CLOUD SETTINGS` badge**; the exit sync never opens a wizard over a player who just quit. gpt has the persistent pending record but not the product decision.
- **F8 "deletions never propagate in V1"** as the simpler alternative to gpt's receipts — a legitimate scope reduction for synthesis to weigh. (Note the interaction if adopted: D-CLOUD-030 compaction removes a higher slot whose hash still exists locally; kimi's resurrection rule would pull it back unless "hash present at another local path" is classified as a move, which kimi's own table implies but does not state.)
- **F2.5 cloned-card identity collision rule**; **§8.5 core-set divergence by tree diff** (no device time); **§8.4 local backend-hash experiment (H2)** — gpt mentions the last as an optimisation only.
- **F7 discard store at `/storage/.cache/cloud_sync/discarded/`**, outside the sync tree, so no allowlist rule can be overridden by user-first rule ordering in `cloud_sync_helper`.
- **F11** naming the exit-code collision explicitly as a shipped bug to file (gpt names the defect; kimi files it).

**`gemini-revised_plan.md`**:
- The explicit **#10 launch-behaviour rehearsal** before any config file ships (§6.2), stated as an experiment with a device — worth keeping as a gate even if #10 is deferred.
- The **RG351M thumbnail distinguishability test** as a pre-layout gate (§6.4), converging with gpt's Gate 5.
- Its concession list is a useful record of what *not* to build (flush-race, "bisync skips conflicts", atomic renames).

**`mistral-revised_plan.md`**:
- **§4 "does the detector inherit `--delete-excluded`"** as a constructed dry-run with `BACKUPMETHOD="sync"` against a destination holding excluded files — the guard-fires test `engineering-practices.md` demands; gpt states the hygiene rule but not the experiment.
- **§5.5 kid/kiosk reachability** as a hardware proof item (gpt covers it in §4.11; mistral makes it a gate).
- **§7 rejections** — no occurrence-identifier system, no audit tamper-proofing, launch-time resolution as V2 — a compact scope fence the synthesis should keep.
- Its `container` kind is an alternative naming for gpt's complete-member-set units; either is fine, one must be chosen.

## Remaining defects in `gpt-revised_plan.md` to fix before it is built

1. **Prune and stage §4.7.** Define the V1 minimum of "protected publication" — the outgoing version copied to a per-device, dated, non-overwriting folder *outside* `SYNCPATH` and outside the old mirror's allowlist reach, with a small receipt — and state the H700 exit-budget threshold above which the degradation rule (protected upload only, canonical pending) applies. As written the protocol is open-ended and a small team will over-build it.
2. **Name the substrate.** §4.4 says "read and hash"; adopt kimi's staging mirror (with forced re-fetch of any path about to be overwritten on a hashless backend) as *the* way C is learned, so the plan is buildable rather than aspirational.
3. **Specify the lock order** between the §4.9 save-lifecycle gate and `take_cloud_lock` before implementation; gpt flags this but leaves it open, and the futro's blindspot 23 (the dropped `pgrep` guard) is exactly how such ordering gets lost.
4. **The D-CLOUD-030 "clarification"** ("equal bytes are not proof of a move") reopens a decided consequence of the row ("same hash under a new path is a move"). It needs the maintainer's explicit word as a new register row, not a clarification.
5. **Absorb kimi's F12 and F2 transport rule** (no-filter `RCLONEOPTS` hazard; `.rocknix` excluded from tree transfers, single-file manifest publish). Both are shipped hazards gpt's "build filters at the service boundary" does not concretely close.
6. **Adopt the conflicts-queue trigger** (kimi F7.4) explicitly; gpt's persistent pending record is necessary but the product rule that the exit sync never opens the wizard should be written down for #23.
7. **Consider deferring #10's directory materialisation** (kimi's D-CLOUD-017 refinement) rather than only rehearsing it; the wizard needs `core` as data, not the directory.

## Provenance (sources relied on for this vote; hashes as verified at embed time by the Facilitator — not re-read or re-hashed by me)

```json
{
  "artifact": "step4-vote",
  "member_filesystem_access": false,
  "member_rehashed_sources": false,
  "source_file_paths": [
    "research/council-runs/2026-09-05-conflict-resolution-foundation/_sources/00-problem-statement.md",
    "research/council-runs/2026-09-05-conflict-resolution-foundation/_sources/repo/docs/conflict-wizard-ia.md",
    "research/council-runs/2026-09-05-conflict-resolution-foundation/_sources/repo/docs/save-manifest-schema.md",
    "research/council-runs/2026-09-05-conflict-resolution-foundation/_sources/repo/docs/save-manifest-alignment-review.md",
    "research/council-runs/2026-09-05-conflict-resolution-foundation/_sources/repo/plans/conflict-resolution/vita-style-conflict-resolution.md",
    "research/council-runs/2026-09-05-conflict-resolution-foundation/_sources/repo/docs/decision-register.md",
    "research/council-runs/2026-09-05-conflict-resolution-foundation/_sources/repo/docs/blindspot-register.md",
    "research/council-runs/2026-09-05-conflict-resolution-foundation/_sources/repo/.claude/rules/rclone-cloud-sync.md",
    "research/council-runs/2026-09-05-conflict-resolution-foundation/_sources/repo/.claude/rules/engineering-practices.md",
    "research/council-runs/2026-09-05-conflict-resolution-foundation/_sources/repo/docs/es-menu-map.md",
    "research/council-runs/2026-09-05-conflict-resolution-foundation/_sources/repo/docs/cloud-sync-changelog.md",
    "research/council-runs/2026-09-05-conflict-resolution-foundation/_sources/issues/issue-22.md",
    "research/council-runs/2026-09-05-conflict-resolution-foundation/_sources/repo/projects/ROCKNIX/packages/network/rclone/sources/cloud_backup",
    "research/council-runs/2026-09-05-conflict-resolution-foundation/_sources/repo/projects/ROCKNIX/packages/network/rclone/sources/cloud_restore",
    "research/council-runs/2026-09-05-conflict-resolution-foundation/_sources/repo/projects/ROCKNIX/packages/network/rclone/sources/cloud_sync_helper",
    "research/council-runs/2026-09-05-conflict-resolution-foundation/_sources/repo/projects/ROCKNIX/packages/network/rclone/sources/cloud_sync-rules.txt",
    "research/council-runs/2026-09-05-conflict-resolution-foundation/_sources/repo/projects/ROCKNIX/packages/network/rclone/sources/cloud_sync.conf",
    "research/council-runs/2026-09-05-conflict-resolution-foundation/_sources/repo/projects/ROCKNIX/packages/network/rclone/autostart/102-cloud-saves",
    "research/council-runs/2026-09-05-conflict-resolution-foundation/_sources/repo/tools/cloud-round-trip",
    "research/council-runs/2026-09-05-conflict-resolution-foundation/_sources/es/SaveStateRepository.cpp",
    "research/council-runs/2026-09-05-conflict-resolution-foundation/_sources/es/SaveState.cpp",
    "research/council-runs/2026-09-05-conflict-resolution-foundation/_sources/es/SaveStateConfigFile.cpp",
    "research/council-runs/2026-09-05-conflict-resolution-foundation/_sources/es/ThreadedCloudSync.cpp",
    "research/council-runs/2026-09-05-conflict-resolution-foundation/_sources/es/FileData.cpp.launchGame-excerpt-l740-850.cpp"
  ],
  "source_file_hashes": [
    "7e8c1076ee1735925af1d59dded61d23146c5c8e9fb2aae2be53d5afca26b6b7",
    "5738428852899047b9d49902b78e9c5e0d4457f67b09d079fdfeb89fdcfcc6c9",
    "2a794ea3d027402a26e3dfc62ea6184c204211c888c904413d1564ecf3f189ce",
    "56f6c54c013c5476f638a0dee5f2201e6a4ad021b47c674010bdc392665bfd48",
    "d22a49e73fe5d25cafea7646ec353e57a3da95f6ef84d4b86249c91bb170cf43",
    "0a4b1150d907f26cdd70d480830e195b9fa2885920abf48641506bb5a0f09640",
    "1514b33d61ab148d4e59bf446af03d973792a0673969df471b41c021edc9cbd8",
    "7d43f252d029d54baa98ffa266b9334fa2f0f2da3db2507f451205f40dc73353",
    "e8ee62ea5af749ef09c0ede9da7abc5d7c192d890ae2e737cc369a5c5549c646",
    "3ab8da275237ac1ccf3cab3bf2f019077d7fdef06d2e6afd180313ca80e00d8c",
    "6357ada783d5b09f22bd6fad2745b5c101e68fcdf2f85ffc698975be356cd594",
    "6d998503be831ad800a34bbfa952fc2aeb85ca5f5d959b6d10dad98d0fea6831",
    "dfd1bf52dca78ab67a1b30b56e3c048d8910863a99ca02442525f58d083a2a57",
    "3a1bec8bb0ef5005f3dd92cdd766beb2c32ef26c5b5ea06fbd6cdb0bb0259de9",
    "8b22b9c82effe0a044ff765f73ecf24e26dd064abf694dc1f37304e2759b8823",
    "60db296dde26bebbf4fcf1b97101188799cedb2eb3260616204a2ee082ce19c3",
    "c9f4d94dc9745bce7bccf99145816e0e45305c8a5058acb6476a1fb56f96eb6c",
    "7c3e79bbe41bd70ec1c1f08d9defd04e38af891430616173609bf3e76c2159ee",
    "212e1c8531008b1d25f5f976797d9762c5cfa3061fe70229c546d276784efb49",
    "9931bfdceacc18344d7a6b9eeea0a27278dff46ae04a7f82e5c4efe7300ff51b",
    "848e0746fa26ef5c565af72962c487b0d4185f199f36f2290827bd086e303741",
    "4f38ea7dcfcbd71068122124c428d146b7da3c6dbdcc05a81afc99bbd93a9b15",
    "62f817868c3b803429e62efb7aa8f37aa995213386c6e4303e8e1f490a144ffc",
    "5b341d85de24badb2984fff979226f25f080831a1d194f607b6d6caa6085f233"
  ]
}
```