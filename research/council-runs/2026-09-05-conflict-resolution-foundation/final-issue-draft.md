# Step 5 — the handoff as tracker text

**Run:** `research/council-runs/2026-09-05-conflict-resolution-foundation/`. The specification is the handoff section of `consensus_plan.md` in that directory; section labels of the form §1.x, I*n*, B*n*, D*n*, C*n* refer to its base, `claude-revised_plan-r4.md`, which is not reproduced here. Corpus copies were read at `2026-09-05T17:32:51Z` under `_sources/`; every repo path cited below (`docs/…`, `.claude/rules/…`, `projects/…`, `tools/…`, ES files, issue threads) names the live file and has a verified copy at the corresponding `_sources/` path with the hash recorded in the provenance block at the end.

**Vocabulary.** R- and A-numbered text is carried from the handoff. Where the handoff used names D-UI-022 retired — the three saves rows as SYNC/UPLOAD/DOWNLOAD, "system backup", "save data", "upload"/"download" — the tracker text uses the current names: SYNC SAVES WITH THE CLOUD · BACK UP SAVES TO THE CLOUD · RESTORE SAVES FROM THE CLOUD; *settings*; *saves*; *push to / fetch from the cloud*. Config keys are `SAVESPATH`, `SETTINGS_BACKUPS`, `SAVES_REMOTE`, `SETTINGS_REMOTE`, `CONTENT_REMOTE`; `RESTOREPATH` is gone (D-CLOUD-040); every reader reads the old key when the new one is absent (D-UI-022).

---

## #11 — cloud saves: conflict resolution for saves between this device and the cloud

**Epic** for the milestone *Cloud Saves: Visual Conflict Resolution*. Children: #9 #10 #19 #21 #22 #23 #24 #25 #35 #37 #7.

### Context

The two-way sync that ships today is newest-wins. Boot (`projects/ROCKNIX/packages/network/rclone/autostart/102-cloud-saves`) and the sync row run `cloud_restore --method=copy --update` then `cloud_backup --method=copy --update`; the game-exit push (`FileData.cpp` → `ThreadedCloudSync`, `cloud_backup --saves-only --recent`) is `copy` with no `--update` at all. A save changed on two devices is therefore resolved by whichever is newer, with no record — the exact failure the cardinal rule forbids (`.claude/rules/rclone-cloud-sync.md` § Preserve player progress; blindspot 28) — and it happens before any detector could look. This milestone replaces every writer of the saves tree with one reconciler that identifies each save by content, classifies it against what the two sides last agreed, transfers only what one side changed, queues what both changed for a wizard the player opens from a badge, keeps every discarded copy in the cloud, and never decides by time. The maintainer is the only user until it ships (D-CLOUD-029).

### The architecture, one screen

- **The reconciler owns every writer.** `cloud_reconcile` is the only thing that moves a save in either direction: boot, the three saves rows and the hub tick, the Tools symlinks, the game exit, #37's tile, and the two scripts run from a shell. Cut over in one image; the saves phases of `cloud_backup`/`cloud_restore` delegate, their settings-archive phases are untouched. (#22, R1)
- **Identity is sha256 of the stored bytes**; slot and path are attributes; same hash at a new path is a move, not a version (D-CLOUD-030).
- **Per-device manifests**, one JSON per device under `savestates/.rocknix/`, each device writing only its own, read as a claim set (D-CLOUD-031; schema rev 2 additive, `schema` stays `1`). Capture at exit records device, core, core build pin, thumbnail — what no sync tool can produce. (#21, R3)
- **Local agreement**: the hash last verified equal on both sides, per path, with how it was verified; never synced; carries the sync context (remote, folder, device id, `relink_epoch`) so a re-link or folder change discards it rather than trusting it. (#22, R7)
- **The classifier**, per unit (a game's save is one unit even when it is several files): identical → agreement; one side changed → silent transfer of that unit's changed members; both changed or never agreed → queue; a unit only partly published → hold; a save gone from one side with agreement on record and no retirement → a **question** for the player (D-CLOUD-037); an applicable retirement → act on the survivor; another client's conflict artefact → never a version (D-CLOUD-022). (#22, R4)
- **The lifecycle gate**: capture runs on every exit; the exit push is to-the-cloud only, needs fresh cloud evidence per unit, proves correspondence before advancing agreement, defers above a ceiling; a sync that can touch saves gates game launch through the guard that already ships (D-CLOUD-038). (#21/#22, R5, R6)
- **The checked adapter** turns a decision into ES's own primitives — next free numbered slot from `firstslot`, `copyToSlot`, the PNG moving with its state — after re-checking everything at COMPLETE; four-phase apply with the record written before the first effect. (#23/#24, R8)
- **Count-bounded retention in the cloud, no undo control**: the discarded copy of every wizard decision goes to a sibling of the saves folder, verified there **before** the winner replaces it anywhere; on by default, 3 per save, selectable 1–9; the done page names each discard and says the copies are kept; restoring one is #25's tool, not a control in the wizard (D-CLOUD-032/033/036). (#22/#23, R9)
- **Queue-and-badge**: an unattended pass never opens the wizard over a player; it counts, and MANAGE GAME SAVE RESTORES AND CONFLICTS carries the count (D-CLOUD-035). Typed outcomes 0/1/3/4/5/6; 3–6 render as SKIPPED or WAITING, never FAILED. (#22/#23, R10, R11)
- **bisync is the evaluated transport for full passes**, scored against a written contract before the reconciler is built; a narrow gap is filed upstream, not worked around; the metadata layer above it is not a re-implementation of anything bisync offers (D-CLOUD-039). (#9)

### Build order

Gate 0 (#35) → Gate 11 (#9) and Gate 12 (census, #21/#22) → schema rev 2 and capture (#21; after Gate 12) → reconciler with the writer cutover and the boot liveness fix (#22, #7; after Gates 1, 4, 11) → the cloud retention store (#22/#23; after Gate 2) → wizard apply and the adapter (#23, #24; after Gates 3, 6) → deletion and the absence question (#22/#23; after Gate 5) → #37's tile → the compatibility badge (#23; after Gate 8) → per-core layout (#10; after Gate 9) → the restore tool (#25), in its own futro.

### Ordered experiments

Every gate is unrun. Nothing below is ticked until the behaviour has been watched (blindspot 13).

| # | Gate | Venue | Unblocks |
|---|---|---|---|
| 0 | Repair `tools/cloud-round-trip` and run it: it overwrites `rclone.conf` without restoring it; its archive-name assertions disagree with the dated uploader and restorer in `cloud_backup`/`cloud_restore`; its content fixture predates D-CLOUD-019; its config keys are the old ones. WebDAV **and** MinIO. | GENERIC_X64 VM | everything (#35) |
| 11 | The bisync spike, scored against #9's contract: report shape, loser renames, units, hashless backend, external resolution with no `--resync`, interruption with `--recover`/`--resilient`, renumber, absence, budget, single authority (D-CLOUD-039). | VM vs QA, then RG35XX SP vs Dropbox | the reconciler's full-pass transport (#22) |
| 12 | Shadow census: auto-state divergence per session; what PPSSPP, Flycast, Mupen, DuckStation write (the unit table); retained bytes per unit at count 3, PPSSPP's directory included; sealed bytes per exit. | RG35XX SP | schema rev 2 units (#21), the retention ceiling (#22), the cost of independent-copy sealing (D-CLOUD-034) |
| 1 | A1, A2, A3 — the cardinal-rule and context fixtures, seen to **fail** against the shipped scripts first. | VM pair, then H700 pair | R1, R4, R5, R7 (#22) |
| 4 | A10; `lsjson --hash --files-from` and `hashsum --files-from`; whether rclone's post-transfer hash mismatch fails closed; the hashless cap; a shell-computed native hash. | H700 vs Dropbox; VM vs QA (loopback, D-QA-002) | the exit-path ceiling (D5), register row P4 |
| 2 | A5 — the cloud store's reader and survival test, from a second device. | VM pair, then RG35XX SP + RG-SP | R9 (#22/#23), #25 |
| 3 | A6, A7; launch from a repository holding only an auto state and watch RetroArch receive `-state_slot -99` (`SaveStateRepository.cpp` `getNextFreeSlot`, `SaveState.cpp` `setupSaveState`). | H700 | R6 (the launch gate, D-CLOUD-038), R8, recovery (D2) |
| 6 | A8 — a torn multi-file publication. | VM | the hold (B3) |
| 5 | A9 — deletion, renumber, republication, the residual; the absence question in both directions. | VM pair | deletion semantics (P5), D-CLOUD-037's wording |
| 7 | `copy --backup-dir` under interruption; the paused-between-read-and-write race. | H700 + VM | the `-replaced/` record (D3 b) |
| 8 | The #19 bench (`docs/savestate-compat-test.md`): same-chipset control, cross-chipset, loud/silent. Any time; only the maintainer's hands. | bench | the badge's severity (#23) |
| 9 | #10 rehearsal: an `es_savestates.cfg`; the `racommands`/`incremental`/`autosave` flip; `defaultCoreDirectory` keeps the flat layout visible; RetroArch's `savestate_directory` moves with it. | H700 | #10 |
| 10 | A13. | RG351M | the wizard's layout (#23) |
| 13 | Unknown-unknowns: same-basename ROMs in nested directories sharing a state path; an old state restoring old SRAM that autosaves over the SRAM the wizard kept; a PNG belonging to another version; case-only path variants on Dropbox; full storage after a "successful" copy; an unmounted saves root; a cloned card (A11). | H700 + VM | the guards (I2, I6, I21); the wizard's copy for the save/state coupling |

### Decisions that bind this milestone (cite, do not re-argue)

D-CLOUD-014 · 015 · 017 · 022 · 024 · 025 · 027 · 028 · 029 · 030 · 031 · 032 · 033 · 034 · 035 · 036 · 037 · 038 · 039 · 040; D-UI-017 · 018 · 020 · 022 · 023; D-QA-001 · 002. `docs/decision-register.md`.

### Children

- [ ] #9 — bisync: the transport contract and the spike (Gate 11)
- [ ] #21 — capture at game exit; schema rev 2; the core-pins file
- [ ] #22 — the reconciler owns every writer; classifier; cloud retention store; outcomes
- [ ] #23 — the wizard: queue-and-badge, the compare surface, the absence question, retention settings
- [ ] #24 — the checked adapter: slots, KEEP BOTH, the auto rule, compaction
- [ ] #19 — the bench run that sets the badge's severity (Gate 8)
- [ ] #10 — per-core layout, after Gate 9
- [ ] #25 — the restore tool for discarded saves, own futro after the wizard ships
- [ ] #35 — every fixture above, written to fail first
- [ ] #37 — the launch-screen tile, through the reconciler
- [ ] #7 — boot liveness by route, the boot pass through the reconciler

---

## #9 — cloud sync: rclone bisync as the transport under the reconciler — the contract and the spike (Gate 11)

**What changed.** This issue no longer replaces the two scripts with bisync, and bisync is no longer "the detector". Detection is the reconciler's classifier over sha256 identity and local agreement (#22; D-CLOUD-030/031). What bisync may be is the **transport for full passes** under that layer — and whether it can be is settled by this spike, scored against the contract below, not by reasoning (D-CLOUD-039). The planning note on `rclone-bisync-beta` (`plans/bisync/rclone-bisync-planning.md`, Phase 3 "newer file wins", `--conflict-resolve newer`) is struck: resolution never defaults to recency (`docs/save-manifest-alignment-review.md` §3.1). The exit push is not bisync's: it is a decided, to-the-cloud-only `copy --files-from` (#22 R5) whatever this spike finds.

### The layer above bisync is not bisync

Which device wrote a version, which core and build, when, and its thumbnail are not on disk; no sync tool produces them. They are recorded at exit by the one process that knows (#21). The only overlap between the reconciler and bisync is the *comparison*. The spike asks whether bisync can move files under that layer without becoming a second authority over which version is current.

### The contract (score each item PASS / FAIL, and each FAIL as *upstream-shaped* or *architectural*)

1. **Reports, never resolves.** With `--conflict-resolve none`, a both-changed pair is reported in a form a script can parse without reading a fixed line position (`.claude/rules/engineering-practices.md` *Guards must fail closed*), and neither file changes.
2. **No renames on the saves tree.** A save-state loser is never left renamed (`…conflict1` breaks `{{romfilename}}.state{{slot}}`, `SaveStateConfigFile.cpp` `SetupRegEx`). Either bisync can be configured so, or the reconciler constrains the run so it cannot happen; a dry-run listing grepped for `conflict` is the guard and is shown to fire on a constructed conflict.
3. **Decided transfers only.** bisync moves exactly the set the reconciler decided (a per-run filter file or equivalent) and nothing else — so a unit the classifier holds is not half-installed by a per-file transfer.
4. **Hashless backend.** On the QA WebDAV (no hashes, no modtime precision, #53) an equal-size byte change is never treated as identical by anything that decides.
5. **External resolution without `--resync`.** After the wizard installs a winner and pushes it, the next run — with no `--resync` — neither re-flags nor re-transfers the pair.
6. **Interruption.** A run killed mid-transfer is completed by the next run with `--recover`/`--resilient`; the listing state under `/storage/.cache/rclone/bisync` is consistent; nothing is lost; `--resync` is never needed after the maintainer-driven first run.
7. **Renumber.** ES's rename (same hash, new slot) — a delete-plus-create to any file sync — loses no data and leaves the reconciler's move rule applicable.
8. **Absence never deletes without the reconciler's word.** An unmounted or empty saves root with listings on record does not propagate deletions (bisync's own `--max-delete` is not the guard the reconciler relies on).
9. **Budget.** Spawns and seconds for a full pass with nothing changed on the H700, recorded against today's ≈5 s contract (D-CLOUD-028; `.claude/rules/rclone-cloud-sync.md` § budget).
10. **Single authority.** bisync's listings are never read as agreement; `agreed.json` is (#22 R7). bisync runs correctly when fed only the reconciler's decisions.

### Fixtures (venue: VM against `tools/cloud-test-backend`, WebDAV and MinIO; then the RG35XX SP against Dropbox — blindspot 8)

A multi-file save (an N64 `.eep`+`.mpk` pair) resolved as a unit and published torn; a hashless backend; an external resolution with no `--resync`; an interrupted run; a device-side renumber; compressed states (`#RZIPv`); an unmounted root. The fixtures live in `tools/cloud-round-trip` (#35).

### Verdict rule

All PASS → bisync is the full-pass transport under the reconciler. Any *architectural* FAIL → the reconciler's own transport for every pass: `rclone copy --files-from --ignore-times` per direction (the handoff's I22), bisync not used. Only *upstream-shaped* FAILs → a request on `rclone/rclone` naming the gap, and until it lands the reconciler classifies the affected case as one it cannot transfer — it holds or queues it — and never resolves it by a second mechanism (D-CLOUD-039).

### Acceptance

- [ ] Each contract item above has a recorded result from both venues, with the command, the rclone version (`rclone version` on the device, not the host), and the observed output.
- [ ] Item 2's guard is watched firing on a constructed conflict before it is trusted.
- [ ] Item 6 is observed after a real kill mid-transfer, not a `--dry-run`.
- [ ] The verdict is recorded on this issue and mirrored on #22 before #22's transport is coded.
- [ ] Any upstream request is linked here.

**Preceded by** Gate 0. **Does not build**: no resolution logic, no `--resync` anywhere unattended, no bisync on the exit path.

---

## #10 — cloud sync: per-core save-state layout, with the core build recorded in the per-device manifest (D-CLOUD-017)

**Summary.** Save states get a directory per core; the core build pin travels as data in the manifest, not in the path (D-CLOUD-017). Game saves stay one shared pool. This is the **last** build step of the milestone: the manifest keys entries by path relative to the saves root, so the layout change is a re-key and nothing else depends on it (`docs/save-manifest-schema.md` §9).

**What changed.** The title's "per-chipset/arch" is gone (D-CLOUD-017, blindspot 27). Whether chipset is an axis at all is Gate 8's to answer (#19) and does not gate this issue: directories are per **core** regardless.

### What was found before building

- There is **no `es_savestates.cfg`** anywhere — not in the ES repo, the rocknix tree, or on the device. ES runs on `SaveStateConfig::Default()` (`directory = "{{system}}"`, `SaveStateConfigFile.cpp`) and the root is hard-coded. This issue **creates** the file for the ES package.
- Creating it has a side effect the compiled default does not: every emulator entry parsed from the file gets `racommands = false` unconditionally, and `incremental`/`autosave` default to `false` unless the file sets them (`SaveStateConfigFile.cpp`, constructor). `racommands` decides whether ES copies a chosen state to `.state.auto` before launch or passes `-state_file` (`SaveState.cpp` `setupSaveState`). The flip is a behaviour change every player sees at launch and is Gate 9's first fixture.
- `{{core}}` in the directory template splits cores; `defaultCoreDirectory` lets the default core keep reading the existing flat directory while other cores get their own (`getSaveStateConfigs`). That is how both layouts stay discoverable without scanning: `defaultCoreDirectory = "{{system}}"`, other cores `{{system}}/{{core}}`.
- RetroArch writes where `savestate_directory` points (`setsettings.sh`, `${SNAPSHOTS}/${PLATFORM}` today). Two consumers, one layout, verified together.
- The sync allowlist already passes any depth under `savestates/` (fixture: `savestates/fbn/snes9x/mslug.state2` passed; `docs/save-manifest-alignment-review.md`).

### Acceptance (after Gate 9, after the wizard ships)

- [ ] With the new `es_savestates.cfg` on the H700, a state saved from the save state manager loads from it; the auto state still restores; `racommands`, `incremental` and `autosave` behave as they do today or the difference is recorded and accepted.
- [ ] A state written by a non-default core lands in `{{system}}/{{core}}/` and appears in the save state manager; states already in the flat directory remain visible and loadable for the default core.
- [ ] RetroArch's `savestate_directory` resolves to the same directory ES lists, per core, on the same device.
- [ ] Existing states are `unknown` in every provenance field and never stamped (`.claude/rules/upgrade-and-install.md`); any move of player data is copy → verify → delete, resumable, idempotent (D-CLOUD-026 shape).
- [ ] The reconciler treats the moved paths as a re-key: no conflict, no new version, no duplicate left behind (D-CLOUD-030 compaction runs once).
- [ ] A device that has not updated reads the flat layout and is not broken by a device that has (blindspot 10).

**Does not build**: nothing keyed on chipset, arch or device; no directory named after a build; no migration before the wizard has shipped.

---

## #19 — conflict resolution: the bench run that sets the compatibility badge's severity (Gate 8)

**What changed.** This is a one-hour run, not research (D-CLOUD-025). It no longer blocks #20 — identity is decided (D-CLOUD-030/031) and the device model already comes from `cloud_device_id --label` (`Anbernic-RG35XX-SP` on the RG35XX SP, `/proc/device-tree/model`). It gates exactly one thing: whether #23's badge is a **safeguard** or a **convenience**, which turns on whether a failed load is loud or silent. Every other child of #11 proceeds without it.

### Run `docs/savestate-compat-test.md`, in this order

1. Both H700 handhelds report `HW_DEVICE=H700` and distinct `cloud_device_id --label` values — one command each.
2. **Same-chipset control** (RG35XX SP ↔ RG-SP, one build, one content-less core such as `cap32`): does a state written on one load on the other and show the typed line?
3. Cross-chipset (RK3566, RK3326), all on the same build — different builds confound core version with chipset.
4. **Loud or silent**, even if 2 and 3 pass: truncate a state; flip bytes without changing size; repeat with `savestate_file_compression = "false"`.

### Acceptance

- [ ] A table per test — source, target, core, core build, result, photo where the result is visual — attached here.
- [ ] The same-chipset control is recorded before any cross-chipset row.
- [ ] The badge rule is written as one sentence on #23: *warn when core build differs* / *also when chipset differs* / *block, because failure is silent* — whichever the run shows.
- [ ] The RG35XX SP and RG-SP report distinct labels through `cloud_device_id --label` (already observed on one; confirm on the pair).

**Does not build**: no rules engine, no machine-readable matrix beyond the table above; #10 does not wait on this.

---

## #21 — conflict resolution: capture at game exit, schema rev 2, the core-pins file

Depends on the schema (`docs/save-manifest-schema.md` rev 1, D-CLOUD-030/031) and adds rev 2 to it. Preceded by **Gate 12** (the unit table) and by Gate 0.

**What changed.** Capture no longer rides "the same `--recent` pass" (that pass is replaced by #22's reconciler); it is a step of its own, on every exit, with no rclone spawn. Sidecar-beside-the-save is dead (nothing beside an `.srm` passes the allowlist — fixture on the RG35XX SP, `docs/save-manifest-alignment-review.md`). The manifest's cloud path is unchanged (D-CLOUD-031); its local working copy leaves the saves tree.

### Requirements

- **R3 — schema rev 2, additive to D-CLOUD-031.** Per entry: `unit` (which game-save the file belongs to, from the unit table), `producer` (when the file was imported from another device, that device's id), `published_at`, `pub` (the publication this version arrived in: `<device-id>:<counter>`). Top level: `units` (the members each unit declares — what makes a torn publication detectable) and a bounded `retired` list (deletions this device made: hash, path, the `pub` it retires, when). Agreement is written only on verified equality and records `verified_by` (`remote-hash` · `size+mtime` · `download-sha256`). Manifests are read as a **claim set**: any device's claim about a path is a claim, and the cloud head is what the listing says (I5). The own manifest lives at `/storage/.cache/cloud_sync/manifest-<id>.json` and is published to `savestates/.rocknix/manifest-<id>.json` as a decided transfer; foreign manifests are cached under `/storage/.cache/cloud_sync/manifests/`, never written into the tree. The `schema` integer stays `1`: no cloud has received rev 1, and rev 2 only adds. **Never rewrite an unchanged manifest** (I8) — its mtime is what would otherwise churn every exit.
- **R5 (capture half).** Capture runs on **every** exit — toggle off, no network, lock held, emulator crashed — because a file written and not recorded is exactly what the classifier cannot explain later. The emulator and core recorded are the ones **frozen at command construction** (`SaveState::setupSaveState` may rewrite `-emulator`/`-core` via `_changeCommandlineArgument`; `FileData::getCore(true)`/`getEmulator(true)` re-resolve and are not the answer). ES passes `--system --rom --emulator --core` and the unit context on the command line; capture infers nothing.
- **Sealing is an independent copy (B1).** A changed member is copied into `/storage/.cache/cloud_sync/stage/` and hashed there; never hard-linked (a hard link shares the inode; an emulator flushing in place would change bytes already hashed). Cost: a few megabytes of SD writes per changed save per exit; paid because the alternative pushes bytes that are not the bytes that were hashed (D-CLOUD-034). Gate 12 records the actual bytes.
- **Changed set at exit** = size or mtime differs from the last captured entry; an equal-size, equal-mtime byte change is caught by a full pass, which hashes (A2).
- **The core-pins file (I15; `docs/save-manifest-schema.md` §9).** `/usr/share/rocknix/core-pins`, one line per core package `<package> <PKG_VERSION>`, emitted at image build from `LIBRETRO_CORES` × `get_pkg_version`; capture maps core name → package with a small exception table and records `"unknown"` when it has no answer. `/usr/lib/libretro/*.info` carries libretro-super's `display_version` and is recorded as `core_display_version`, never compared.
- Written whole to a temporary name, renamed into place; a reader never sees a torn file.
- **No rclone spawn.** Capture does not touch the network. The push is #22's. Capture takes **no lock**: ES holds the session lock around the whole launch, including capture (#22 R6).
- Nothing stamps a file it did not write; `unknown` is a value the wizard renders (`.claude/rules/upgrade-and-install.md`).
- Device fields come from `cloud_device_id` / `--label` (D-CLOUD-009).

### Acceptance

- [ ] Exit a game with the toggle off, again with the network down, again while a boot pass holds the lock: the manifest entry for the changed save exists each time, with `sha256` equal to `sha256sum` of the file on disk.
- [ ] Launch a state whose config is not the game's active core: the recorded `core` is the one on RetroArch's command line, not the game's default.
- [ ] A save flushed by the emulator during the seal window: the pushed bytes' hash equals the recorded hash (the independent copy); a hard-linked variant is shown to fail this.
- [ ] Exit with nothing changed: the manifest's mtime does not change.
- [ ] `core_build` equals the `PKG_VERSION` pin for the core's package on the same image; a core absent from the map records `"unknown"`, and the wizard shows it as such.
- [ ] A14: the manifest reaches the remote under `savestates/.rocknix/` with `remote_hash` null on WebDAV and non-null on MinIO, and is absent from the ROMs-and-BIOS tier after `cloud_content_backup` (#35).
- [ ] An N64 game's `.eep` and `.mpk` (and every standalone layout Gate 12 lists) appear as one `unit` with both members declared.
- [ ] Rev 2 is written into `docs/save-manifest-schema.md` and noted on #20, with the SQLite index closed as *not built* (D-CLOUD-027 leaves it to the schema; nothing needs it).

**Does not build**: no sidecars beside saves, no play-time fields, no second exit-path spawn, no lock in capture, no stamping of `unknown` files, no ancestry beyond `replaces`.

---

## #22 — conflict resolution: the reconciler (`cloud_reconcile`) owns every writer of the saves tree

Part of #11. Depends on #21 (capture), #9's verdict (Gate 11), the fixtures of #35 (Gate 0, 1, 4). Home of the **cloud retention store** (D-CLOUD-036) and the classifier; the wizard (#23) and adapter (#24) consume its output.

**What changed since the futro adjustments below.** bisync-as-detector is gone: the classifier is sha256 identity against local agreement, and bisync is at most the full-pass transport (#9, D-CLOUD-039). The stopgap `--update` never shipped (D-CLOUD-029); this issue replaces the write paths wholesale. Retention lives in the **cloud**, beside the saves folder, not under `/storage/.cache` or `/storage/.local` (D-CLOUD-036). An unexplained absence is a **question** the wizard asks, not a held state (D-CLOUD-037). Game launch is gated by the guard that already ships, made true for every sync (D-CLOUD-038); ES does not wait-then-refuse. `RESTOREPATH` no longer exists (D-CLOUD-040), so split local roots cannot be configured.

### R1 — one writer

Every writer of the saves tree — boot (`autostart/102-cloud-saves`), SYNC SAVES WITH THE CLOUD / BACK UP SAVES TO THE CLOUD / RESTORE SAVES FROM THE CLOUD and the hub's SAVES tick (`GuiMenu.cpp`), the Tools symlinks (`/usr/config/modules/cloud_*.sh`), the game exit (`FileData.cpp` → `ThreadedCloudSync`), #37's tile, and `cloud_backup`/`cloud_restore` from a shell — reaches it only through `cloud_reconcile`, cut over in **one image**. The saves phases of the two scripts delegate to it; their settings-archive phases are untouched; the card shows one outcome per run (I11: a queued or held saves phase beside a succeeded settings phase reads DONE with a count, never FAILED; a failure in either reads FAILED). Passes: `--full` (two-way; boot and the sync row), `--to-cloud` (the back-up row and tick: only *this device changed* units move), `--from-cloud` (the restore row and tick; #37: only *the cloud changed* units move), `--exit` (R5). No pass ever overwrites a both-changed unit.

### R2 — rclone arguments

`cloud_reconcile` builds its own rclone arguments; **never sources `RCLONEOPTS`**; passes the shipped allowlist `cloud_sync-rules.txt` as the outer boundary with `- /**/*.bak` and `- /savestates/.snapshots/**` ahead of `+ /savestates/**` (the `.bak` rule covers ES's `.state.auto.bak` during a session; the `.snapshots` rule has no local writer after D-CLOUD-036 and stays as a guard); every decided transfer uses `--files-from` **and** `--ignore-times`. Full-pass transport per #9's verdict.

### R4 — the classifier, per unit

*L* = this device's hash set for the unit, *C* = the cloud head's (fresh listing; `remote_hash` matched to sha256 via the manifests; hashless backends by size + sha256 after fetch), *A* = the agreed hashes. A listing that answers nothing is *unknown*, never "no conflict" (blindspot 22).

| Unit state | Verdict | Action | Outcome |
|---|---|---|---|
| L = C | identical | seed or confirm agreement, `verified_by` | 0 |
| L ≠ C, C = A | this device changed | push the unit's changed members (not on `--from-cloud`) | 0 |
| L ≠ C, L = A | the cloud changed | fetch the unit's changed members (not on `--to-cloud`) | 0 |
| L ≠ C, both ≠ A, or no A | divergent | queue for the wizard; transfer nothing | 5 |
| cloud unit declared incomplete (`units` names members the head lacks, or `pub` disagrees) | held | nothing for this unit; every other unit proceeds (B3) | 6 |
| absent on one side, A on record, an applicable `retired` record (`pub` matches) | deletion | act on the survivor; the cloud copy goes to the `-replaced/` sibling if Gate 7 confirms `copy --backup-dir` (D3 b); the local copy is not retained (I13) | 0 |
| absent on one side, A on record, no `retired` | **unexplained absence** | queue as a **question** (D-CLOUD-037); touch nothing | 5 |
| absent on one side, no A | one-way | transfer (the IA table) | 0 |
| saves root unmounted or empty, or the cloud listing empty or failing, with A on record | mass absence | **refuse the whole pass**, reason named | 1 |
| same hash, different path | move | the cloud's layout wins; a duplicate is compacted in the same plan after both files are re-read equal, logged (D-CLOUD-030) | 0 |
| another client's conflict artefact (`conflicted copy`, `.sync-conflict-`) | not a version | untouched, never offered (D-CLOUD-022) | — |
| exit push above the admission ceiling | deferred | next full pass (D5) | 6 |

A `retired` record applies only to the `pub` it names: restoring a retired hash later is a new publication with a new `pub` and is not consumed by the old record (A9). A device with no agreement for the path re-pushes the deleted version — the accepted residual, observed in Gate 5 and recorded.

### R5 — the exit push

Capture (#21) has run. If the exit toggle is on, and a default route exists (`ip route`, no packets — the shipped `check_network_link`), the push takes `L_T` (non-blocking; exit 3 if held). It is **to-the-cloud only**: one `lsjson --hash --files-from` over the changed units' cloud paths for fresh head evidence; per unit, push only when the head equals agreement; after the push, prove correspondence (a second listing, or rclone's own post-transfer check where Gate 4 shows it fails closed; on hashless backends size plus a capped re-fetch) **before** advancing agreement; a unit whose correspondence fails is marked `uploaded-unverified` and advances nothing. Above the admission ceiling (bytes or members; set from Gate 4 and Gate 12) the unit defers to the next full pass. Budget: an idle exit spawns **no** rclone; a changed exit spawns 3–4 on hashed backends (D-CLOUD-028's "nothing changed ≈ 5 s" contract stands, `.claude/rules/rclone-cloud-sync.md` § budget). No fetches, no ICMP, no probes on this path.

### R6 — locks and the launch gate (D-CLOUD-038)

Two flocks, both non-blocking everywhere; nobody waits.

- `L_T` = `/var/run/cloud_sync.lock`, the shipped `take_cloud_lock` (exit 3). The reconciler holds it for a whole run; the exit push takes only this.
- `L_S` = `/var/run/cloud_saves-session.lock` with a marker beside it naming the game (system, rom, units) and the launched pid. **ES takes `L_S` before the pre-launch renames** (`setupSaveState` moves `.state.auto` to `.bak`) **and holds it through capture**; capture itself holds no lock. Then ES checks `L_T`: if a reconciler holds it, ES releases `L_S` and refuses the launch with the message that already ships for a running sync — the guard `FileData::launchGame` has for syncs it started, extended to every sync (D-CLOUD-038). *The launch-time check is asserted by D-CLOUD-038 and is not in the embedded excerpt of `FileData.cpp` (l740–850, which shows only the exit-path `isRunning()` test); the implementer verifies it in the live file before extending it.*
- The reconciler takes `L_T`, then `L_S` non-blocking per unit batch; when `L_S` is held it reads the marker, excludes that game's units and proceeds elsewhere, reporting SKIPPED for that game (A6). A marker whose pid is dead but which no clean capture cleared keeps the game excluded until a clean capture or reboot (`/var/run` is tmpfs). Batches hold `L_S` briefly — under 100 ms on the H700 is the proposal Gate 3 measures.

### R7 — context and guards

Every local record — `agreed.json`, `queue.json`, `pending-publish.json`, each pending-apply record — carries its **sync context** (I1): remote name, `SAVES_REMOTE`, `cloud_device_id`, `relink_epoch`. A record whose context does not match the current config is treated as absent, so a re-link or CHANGE CLOUD FOLDER makes every pair "never agreed": identical pairs seed, differing pairs queue, nothing on this device is replaced (A3). `relink_epoch` is bumped by `cloud_setup` (its write point is a corpus gap — locate before coding) and by CHANGE CLOUD FOLDER. **Own-manifest witness** (I2): before publishing, the head's copy of this device's manifest must be the one this device last published; a different one means another card carries this identity → refuse with `duplicate-device-id`, transfer nothing (A11). **Storage guards** (I21): saves root mounted; free space before any write; byte count of every copy verified against the listing (full storage after a "successful" copy, Gate 13). **Parser discipline** (I6): JSON through `jq`; rclone output through `lsjson`/`--use-json-log`, never a fixed line; every field present or the run refuses (`.claude/rules/engineering-practices.md`). Split roots cannot be configured (D-CLOUD-040): the reconciler reads `SAVESPATH`, falling back to `BACKUPPATH`; `cloud_sync_helper` drops a legacy `RESTOREPATH` on migration and, where it differed, writes one WARN naming the folder it will not touch.

### R9 — the retention store, in the cloud (D-CLOUD-036)

Layout, a sibling of the saves folder (the pattern D-CLOUD-014 uses for `-replaced/`; outside the allowlist by construction):

```
<SAVES_REMOTE>-discarded/                          e.g. /ROCKNIX/Saves-discarded/
  <unit key, percent-encoded>/                     unit = game + kind, from the unit table
    <seq>/                                         seq = <decided_at, UTC compact>-<deciding device id>
      record.json
      <the loser's members at their basenames>     state + .png, or the save's members
```

`record.json`: `schema: 1`; unit key; `kind`; `system`; `rom`; the loser's slot at discard (or null); per loser member: path, `sha256`, `size`; the loser's `producer` (from its manifest entry, or `"unknown"`), `core`, `core_build`, `captured_at`; the winner's `sha256` and side (`cloud` / `device`); the decision (KEEP LEFT / KEEP RIGHT / REMOVE FROM THIS DEVICE / REMOVE EVERYWHERE); `decided_at`; the deciding device's id and label; the run id; `discarded_by: "wizard"`. This is the record #25's tool drives a picker from: **this game, newest first, thumbnail, producing device, winning side** (D-CLOUD-033).

Rules: the store counts **finalized, coherent wizard losers only** (I13, I18, I26) — propagated deletions, compactions and one-way transfers are not retained here; `-replaced/` is their record where Gate 7 confirms it. Bounded per unit: newest *N* kept, *N* = the player's count (default 3, range 1–9, D-CLOUD-036); the oldest is deleted only **after** the newest is verified. The **ordering rule is load-bearing**: the loser and its `record.json` are verified in the cloud before the winner replaces anything anywhere. With the cloud in the left column (`docs/conflict-wizard-ia.md`, settled), the cloud loser (KEEP RIGHT) is a server-side move plus verification; the device loser (KEEP LEFT) is pushed first with `--ignore-times`, verified, and the resolution does not apply if that cannot be verified. KEEP BOTH retains nothing. When *keep discarded saves* is off nothing is retained, and the done page says so.

Local transaction state stays under `/storage/.cache/cloud_sync/{pending,stage,manifests,runs}` — every item there is one whose loss fails closed: a lost pending record is recovered from the cloud store's `record.json`; a lost stage is re-captured at the next exit.

### R10 — outcomes

0 done · 1 failed (reasons: `split-roots` cannot occur; `duplicate-device-id`, `saves-root-missing`, `cloud-empty`, `unverified-retention`, …) · 3 lock held · 4 no route · 5 conflicts or questions queued · 6 held or deferred. Never rclone's own code. Result file `/storage/.cache/cloud_sync/runs/<run-id>.json` carries the per-unit verdicts the wizard reads. The card renders 3–6 as SKIPPED or WAITING, never FAILED: `SKIPPED - ANOTHER CLOUD SYNC IS RUNNING` · `SKIPPED - NO NETWORK CONNECTION` · `DONE - 3 WAITING FOR YOU` · `DONE - SOME SAVES ARE STILL ARRIVING`.

### R11 — unattended passes

Never open the wizard; count and badge (D-CLOUD-035). The boot pass replaces `ping -c1 google.com` with the route test (#7). Per-row stamps keep their names under `/storage/.cache/cloud_sync/last-*` (D-UI-017/018/020).

### Replaced-mechanism inventory (answered before the old pair is touched — blindspot 23)

| What the `copy --update` pair and `--recent` held | Where it lives now |
|---|---|
| newer-on-destination skip | the classifier: nothing is ever replaced by time |
| restore-before-backup ordering | one `--full` pass; a device away for a while receives before it pushes because the classifier moves *the cloud changed* and *this device changed* in the same plan |
| the `--recent` window and its budget | R5's changed set from capture; zero spawns idle |
| exit 3 / exit 4 semantics and no stamp on skip | R10 |
| the stamps GAME SETTINGS reads | R11 |
| the two scripts' settings-archive phases | untouched |

### Negative scope

No undo control, history browser or extra decision in the resolution flow (D-CLOUD-033); no ancestry beyond `replaces`; no `resolves` receipts; no SQLite index; no generic merger or progress heuristic; no slot cap; no daemon; no protected-publication protocol; no preimages of one-way fetches (C1); no local retention of anything (D-CLOUD-036); no fetches or ICMP on the exit path; no split-root import mode; no `--resync` anywhere unattended.

### Acceptance

- [ ] **A1** Two devices agree H0; B publishes HB; A edits to HA offline; A exits, boots, presses SYNC SAVES WITH THE CLOUD, BACK UP SAVES TO THE CLOUD, RESTORE SAVES FROM THE CLOUD, the hub's SAVES tick, and runs both scripts from a shell: **neither HA nor HB is overwritten anywhere**; the row shows one queued conflict. (Seen to fail against the shipped scripts first.)
- [ ] **A2** After a failed push, the next exit with nothing changed retries and publishes; an equal-size, equal-mtime byte change enters the changed set at the next full pass.
- [ ] **A3** CHANGE CLOUD FOLDER to a folder holding different saves: nothing downloads silently (no file on this device is replaced); identical pairs seed agreement; differing pairs queue.
- [ ] **A6** Kill ES mid-session: the game's units are excluded from mutation and push until a clean capture or reboot; a boot pass overlapping a launch reports SKIPPED for that game and proceeds elsewhere; a launch attempted while a pass holds `L_T` is refused with the shipped message and succeeds after the pass; `L_S` batch holds are under 100 ms on the H700 (proposal).
- [ ] **A7** Kill the reconciler after each rename and before its checkpoint, for a wizard apply **and** for a pre-pass fetch; restart offline: a complete unit exists before any launch; no torn candidate is ever shown.
- [ ] **A8** Interrupt a publication after one member: no device installs the mixed set at any later pass; the hold clears when the rest lands; other units transfer meanwhile.
- [ ] **A9** Delete a state on A and renumber; sync repeatedly on B: each surviving version exists exactly once; restoring a retired hash from the discarded store is not consumed by the old record; an unexplained absence is queued as a question and touched by nothing; a no-agreement device re-pushes (the residual, observed and recorded).
- [ ] **A10** Idle exit spawns no rclone; the changed exit's spawns, round trips, bytes and seconds are recorded on Dropbox and the QA backend and the ceiling is set from them; a correspondence failure after the push leaves an `uploaded-unverified` entry and advances no agreement.
- [ ] **A11** A cloned card: the second device refuses to publish with `duplicate-device-id` and transfers nothing.
- [ ] **A12 (translated, D-CLOUD-040)** An upgraded config carrying a legacy `RESTOREPATH` different from `BACKUPPATH`: the helper migrates `SAVESPATH` from `BACKUPPATH`, drops `RESTOREPATH`, writes one WARN naming the ignored folder; nothing in that folder is touched; agreement is untouched.
- [ ] Mass absence: unmount the saves root, run every pass: each refuses with the reason; nothing transfers; no question is queued. Point the remote at an empty folder with agreement on record: likewise.
- [ ] A cloud loser's members and `record.json` exist in `<SAVES_REMOTE>-discarded/…` with hashes matching **before** the head changes (KEEP RIGHT); a device loser likewise before the local file is replaced (KEEP LEFT); with the count at 3, a fourth discard for one unit removes the oldest only after the newest is verified.
- [ ] A silent run is distinguishable from "no conflicts": the result file carries an explicit status per unit, never an empty list standing for success (blindspot 22).
- [ ] Every writer named in R1 is shown, one by one, to spawn `cloud_reconcile` and nothing else (the process list, not the code).

**Preceded by** Gates 0, 11, 12, 1, 4 (cutover); 2 (store); 5 (deletion, absence); 6 (hold); 7 (`-replaced/`).

---

## #23 — conflict resolution: the wizard — queue-and-badge, the compare surface, the absence question, retention settings

Part of #11. Depends on #22's result file and #24's adapter. Console-first; everything in EmulationStation.

**What changed.** The wizard is opened by the player from a badge, never over them by an unattended pass (D-CLOUD-035). *Keep discarded saves* is **on by default** with a count (D-CLOUD-032/036), and there is **no undo control** in the flow (D-CLOUD-033). An unexplained absence is a question on the same compare surface (D-CLOUD-037). The discarded copies live in the cloud, so the done page says so. "Nothing transfers until COMPLETE" becomes "**no resolution applies until COMPLETE; the pre-pass is not rolled back**". Auto states get a rule, not a question. Rows are two lines (D-UI-023). The IA is `docs/conflict-wizard-ia.md`, to be revised to rev 5 as listed in the epic.

### The entry (D-CLOUD-035, D-UI-023)

In `GAME SETTINGS > CLOUD SETTINGS`, one row:

```
MANAGE GAME SAVE RESTORES AND CONFLICTS
3 waiting                                  ← or: Nothing waiting
```

The count appears as a badge glyph with the number on the CLOUD SETTINGS entry and on the card's outcome line (`DONE - 3 WAITING FOR YOU`). In V1 the page inside holds the queue; #25 adds the history view to the same page so the player learns one place.

### The walkthrough

- Header is the count (`3 CONFLICTS FOUND`); system by system, then game by game; **CLOUD always left**, THIS DEVICE right; source badge over the picture; save states show the screenshot, game saves a glyph, never a substitute image.
- Metadata per side: date · time (local, with the offset; `clock_synced: false` shown as *time not trusted*) · device label · core + build pin (or emulator + version). No file size, no play time. `unknown` renders as `unknown`.
- Choices **KEEP LEFT / KEEP RIGHT / KEEP BOTH**; the chosen column highlights. KEEP BOTH is dimmed with a reason for game saves and for any unit not launched by RetroArch (`SaveStateRepository::isEnabled`, `SaveStateRepository.cpp`). Reserved slots are shown when KEEP BOTH is chosen: `Merged copy goes to slot 4`.
- **The auto rule**: a divergent `.state.auto` pair shows one sentence — `This device keeps its resume point; the cloud's is kept as slot 4.` — and asks nothing (#24). Gate 12 measures how often this fires and how many slots it adds; that cost is recorded before the IA is finalised.
- **The absence question** (D-CLOUD-037), on the same surface with one side empty:

  ```
  THIS SAVE IS GONE FROM THIS DEVICE
  ( BRING IT BACK )  ( REMOVE IT EVERYWHERE )
  ```
  and its mirror, `THIS SAVE IS GONE FROM THE CLOUD` — `( PUT IT BACK IN THE CLOUD ) ( REMOVE IT FROM THIS DEVICE )`. Either removal is a wizard decision and its copy is retained. The mass case never reaches this page (#22 refuses the pass).
- The last CONTINUE is **COMPLETE**. At COMPLETE the adapter re-checks local members, the cloud head by a fresh listing, the unit map, reserved slots and pending retirements; a mismatch re-opens that conflict rather than applying a stale plan.
- Quitting discards the decisions and applies nothing; the pre-pass (cloud-only fetched, device-only pushed) has already happened and is not undone.
- **Review decisions before applying** stays, off by default.

### Retention settings (D-CLOUD-032, D-CLOUD-036)

Two rows in the cloud-saves area: `KEEP DISCARDED SAVES` (switch, on) and `DISCARDED SAVES KEPT PER SAVE` (1–9, default 3; visible but dimmed while the switch is off). The confirmation dialog on COMPLETE is where the sentence lives: *Discarded saves are kept in the cloud, 3 per save.* — not a third row line.

### The done page

Per game, two lines:

```
Advance Wars (USA) (Rev 1) · gba
Kept the cloud copy · Discarded this device's game save
```

Footer: `Discarded saves are kept in the cloud.` (or `Discarded saves were not kept.` when the switch is off). No control to put one back (D-CLOUD-033); the page outlives the apply step (`.claude/rules/es-native-ui.md`, the fourth tier). Each discard's audit line (`/storage/.cache/log/cloud_audit.log`, D-CLOUD-027) is written before the winner replaces anything.

### The badge (after Gate 8)

Until #19 has run, core + build pin are plain text on the panel. The badge's severity — a warning glyph, or a block — is one sentence from #19.

### Acceptance

- [ ] An unattended boot pass that finds two conflicts opens nothing; the row reads `2 waiting`; the CLOUD SETTINGS entry carries the badge; the wizard opens only from the row.
- [ ] **A4** KEEP RIGHT on a cloud loser: the loser's bytes and PNG are in the discarded store with matching hashes **before** the cloud head changes; KEEP LEFT likewise for the device loser; KEEP BOTH retains nothing and installs state + PNG in the next free slot with a visible thumbnail in the save state manager.
- [ ] With the switch off, the same decisions apply, nothing is retained, and the done page says `Discarded saves were not kept.`
- [ ] An absence in each direction is shown as the question above; each answer's removed copy appears in the discarded store before the removal.
- [ ] A divergent auto pair shows one sentence, asks nothing, and the cloud's resume point is in the next free numbered slot with its PNG.
- [ ] Change the cloud head between the walkthrough and COMPLETE: that conflict re-opens; nothing applies from the stale plan.
- [ ] Quit after two of three decisions: both sides are as they were after the pre-pass; the queue still shows three.
- [ ] The done page names each discard per game in the two-line form above; every named discard has an audit line dated before the apply.
- [ ] **A13** The wizard lays out at 480×320 first; frames at 480×320 and 640×480 from `tools/vm-visual-qa` are the evidence.
- [ ] Every row this issue adds is two lines or fewer (D-UI-023); every label uses the D-UI-022 names; checked by label diff across commits, not by reading the diff (blindspot 23).
- [ ] `strings` on the built ES binary contains every new label before any frame is trusted (blindspot 20).

**Does not build**: no undo or restore control, no history view (that is #25 on this page), no deferral, no slot cap, no substitute images, no third row line.

---

## #24 — conflict resolution: the checked adapter — slots, KEEP BOTH, the auto rule, compaction

Part of #11. Identity is decided (D-CLOUD-030); this issue is the merge and install half, consumed by #23.

**What changed.** No per-core slot survey and no slot cap: `getNextFreeSlot` scans to 99999 (`SaveStateRepository.cpp`). No "insert and shift". Standalone emulators are keep-one by construction because ES's slot machinery only exists for RetroArch.

### The adapter's rules (R8)

- **Next free slot** is computed by the adapter from the **visible numbered states from `firstslot`**, not by calling `getNextFreeSlot` blind: with only an auto state present, that function returns `-99` and `setupSaveState` passes `-state_slot -99` to RetroArch (Gate 3 watches this). Highest occupied + 1 among slots ≥ `firstslot`.
- **Slots are reserved in memory** for the length of the walkthrough, so two KEEP BOTH decisions for one game never collide; they are re-checked at COMPLETE.
- KEEP BOTH exists only where `SaveStateRepository::isEnabled` is true (emulator `retroarch`) and the unit is a save state; game saves and every standalone unit are keep-one.
- **Install (D7)**: the cloud copy is fetched to stage, hashed, then renamed into `makeStateFilename(slot)` and its PNG into the image name — the same pair `copyToSlot` moves (`SaveState.cpp`); state then PNG; a rename is the only mutation in the tree, so a kill leaves either the old or the new file, never a torn one (A7). `copyToSlot(slot, move=false)` → verify → remove is the shape for any local re-slot (D-CLOUD-026).
- **The auto rule**: this device keeps its `.state.auto`; the cloud's `.state.auto` and PNG are installed as the next free numbered slot; one sentence, no question (#23). Consequence to record in Gate 12: this device's auto becomes the cloud's at the next push, so the other device applies the same rule in turn.
- **Compaction** (D-CLOUD-030): the same hash in two slots of one game after a sync → the higher slot is removed, only after both files are re-read equal, logged; it happens in the same apply plan as any move, never as a separate pass (P5). Not retained (I13).
- Moves: the cloud's layout wins (P5).
- **Recovery (D2)**: every apply writes its pending record before the first effect and checkpoints after each rename; a restart completes or reverts per the record; nothing half-installed is ever listed by the save state manager.

### A gap to close before coding

`copyToSlot` calls `makeStateFilename(slot)` with the header's default for `fullPath`; `SaveState.h` is not in the corpus, so whether that default is `true` is unverified. Read it: a `false` default would rename into the working directory. Same for `SaveStateRepository.h`'s defaults.

### Acceptance

- [ ] From a repository holding only `game.state.auto`, KEEP BOTH installs the cloud copy as `game.state` (slot 0 with `firstslot = 0`), and RetroArch is never handed `-state_slot -99`.
- [ ] Two KEEP BOTH decisions for one game in one walkthrough land in two distinct slots; the save state manager shows both thumbnails.
- [ ] A dry-run fixture (planted states, a divergent pair, a duplicate hash in two slots, a renumbered move) produces the plan the rules above predict, and applying it leaves exactly one copy of each version with its PNG.
- [ ] Kill the process after the state's rename and before the PNG's: on restart the pair is completed; the manager never showed a state without its picture.
- [ ] A game save conflict shows KEEP BOTH dimmed with its reason; so does any DuckStation, PPSSPP or Flycast unit.

**Preceded by** Gates 3, 6, 12 (the unit table). **Does not build**: slot caps, insert-and-shift, ordering by timestamp, a merger.

---

## #25 — conflict resolution: the restore tool for discarded saves (own futro, after the wizard ships)

Part of #11. Version one **retains** and ships **no** restore control (D-CLOUD-033); this issue is the reader. Its precondition is **Gate 2** (A5): the store #22 writes must already answer the tool's questions from a second device.

**What changed.** No local snapshots, no `savestates/.snapshots/`, no rollback of "any destructive sync": every discarded copy of a wizard decision is already in the cloud under `<SAVES_REMOTE>-discarded/` with a `record.json` (D-CLOUD-036; #22 R9). This tool reads that store. Its home is the same page as the queue — MANAGE GAME SAVE RESTORES AND CONFLICTS (D-CLOUD-035) — as a history view, and it reuses the wizard's compare surface pointed at a game's retained past versions instead of at a live conflict.

### Shape

- Per game, newest first: thumbnail (or glyph), the producing device, when it was discarded, which side won that time. All from `record.json`.
- Choosing one restores it **through the reconciler** as a new publication: the copy it replaces is retained first (the same ordering rule), then the retained version is installed here and published. A restore is a republication with a new `pub`; the old `retired` record does not consume it (A9).
- Copies a sync replaced without anyone deciding (`-replaced/`, where Gate 7 confirms it) are **labelled separately** — they are not *discarded saves* (D-UI-022's residual).
- Requires the network, like everything about a conflict; says so when there is none.

### Acceptance

- [ ] **A5** A test-only reader answers "this game, newest first, thumbnail, producing device, winning side" from the cloud store alone, after a manifest overwrite, a renumber, an audit-log rotation, a clock set backward, all local pending records removed, and from a second device that never made the decision; the store survives an in-place update on a device with real prior state.
- [ ] Restoring a discarded save puts the replaced copy in the store first and installs the chosen bytes byte-for-byte, PNG included.
- [ ] A `-replaced/` copy is shown under its own label and never as a discarded save.
- [ ] The count selector's bound is enforced as the store grows (the oldest goes only after the newest verifies).

**Does not build** before its futro: nothing. The allowlist rule `- /savestates/.snapshots/**` ahead of `+ /savestates/**` stays in #22's R2 as a guard with no writer.

---

## #35 — qa: the round-trip harness, run for the first time, and every fixture #11 needs

Child of #26; also the venue of Gates 0, 1, 2, 5, 6 and the fixtures every other gate reuses. `tools/cloud-round-trip` has **never executed**.

### Gate 0 — repair, then run, on WebDAV and MinIO

- [ ] The harness writes `rclone.conf` and restores the device's own afterwards; a device it has finished with has the remote it started with.
- [ ] Its archive assertions match the dated uploader and restorer (`cloud_backup` `backup_system_files`, `cloud_restore` `restore_system_files`): the settings archive lands under the device's folder with a leading date, and the newest of either format is what a restore picks.
- [ ] Its content fixture is a directory ES declares as a system (D-CLOUD-019) and the harness names it under the new key `CONTENT_REMOTE`.
- [ ] It reads the new config keys (`SAVESPATH`, `SETTINGS_BACKUPS`, `SAVES_REMOTE`, `SETTINGS_REMOTE`, `CONTENT_REMOTE`) and the old ones on an image that has not renamed them (D-UI-022 read-old-if-new-absent).
- [ ] Every existing step passes end to end; PL-10's `unsupported system` branch is observed producing output; the lock step exits 3 and stamps nothing; the exit-path steps assert `--max-age`/`--no-traverse` **until** #22 cuts over, then assert zero spawns on an idle exit (A10).
- [ ] Step names use D-UI-022's words (`settings archive`, `saves`, `ROMs and BIOS`).

### Fixtures for #11 (each written before the code it tests, and seen to fail first — `.claude/rules/engineering-practices.md` *A failure you find is yours to fix*)

- [ ] **A1** two roots against one remote, both changed since agreement: run the boot pair, the three saves rows' commands, the hub's commands and the exit push from each: as shipped this **fails** (blindspot 28); after #22, neither copy is overwritten and one conflict is reported.
- [ ] **A2, A3** as on #22.
- [ ] **A8** a torn unit (one member of an N64 `.eep`/`.mpk` pair) published and left: no root installs the mixed set; the hold clears when the second member lands.
- [ ] **A9** delete and renumber on one root; sync repeatedly on the other; restore a retired hash from the store; unmount one root and run: the pass refuses; remove one file with `rm`: a question is queued and nothing moves.
- [ ] **A11** a cloned `cloud_sync-device-id` on the second root refuses with `duplicate-device-id`.
- [ ] **A12** a config carrying a legacy `RESTOREPATH` unlike `BACKUPPATH`: migrated, warned, nothing touched.
- [ ] **A14** the manifest step: plant a state and a `.srm`, run the exit path, assert `savestates/.rocknix/manifest-<id>.json` on the remote with `sha256` equal to the planted bytes, `remote_hash` null on WebDAV and non-null on MinIO; then run `cloud_content_backup` and assert the manifest is absent from the ROMs-and-BIOS tier.
- [ ] **A5's reader** runs against the MinIO store from the second root.
- [ ] The retention ordering: kill the apply between the loser's verification and the winner's replacement; the loser is in the store, the head is unchanged.
- [ ] #9's contract fixtures (multi-file unit, hashless backend, external resolution with no `--resync`, interruption, renumber, unmounted root) are runnable from here with bisync and with the reconciler's own transport, so Gate 11 scores both.

**Vocabulary and keys**: the harness's own strings and the `CONF` keys it edits follow D-UI-022 and the new key names; `RESTOREPATH` appears only in the A12 fixture.

---

## #37 — ES: restore saves from the save state manager at game launch

Child of #15 (L3). Depends on #22.

**What changed.** The tile no longer runs `cloud_restore --saves-only`: every writer goes through `cloud_reconcile` (#22 R1), so the tile runs `cloud_reconcile --from-cloud --yes` under `L_T`. The label is **RESTORE SAVES**, not SYNC — a player pressing it chose a direction, and *sync* is the automatic two-way behaviour (D-UI-022). Origin badging on the tiles reads `device.label`, `core` and `core_build` from the save manifests (`docs/save-manifest-schema.md` §6), never re-derives them (`docs/save-manifest-alignment-review.md` §3.5). Because it is attended but sits on the launch screen, a conflict it finds for this game is **not** opened here: the toast says `1 CONFLICT WAITING` and the badge appears; the player resolves it from MANAGE GAME SAVE RESTORES AND CONFLICTS (D-CLOUD-035).

### Acceptance

- [ ] The leftmost tile reads RESTORE SAVES, shown only when `rclone.conf` exists; the default cursor position is unchanged.
- [ ] Selecting it runs `cloud_reconcile --from-cloud --yes` behind a blocking `GuiLoading`; the process list shows that and nothing else; the grid cannot be operated until it returns.
- [ ] Exit 3 (lock) and 4 (no route) show as SKIPPED with the shipped wording; a queued conflict shows `RESTORE SAVES : 1 CONFLICT WAITING` and the grid is rebuilt from disk with the non-conflicting states present.
- [ ] Wrapped in `/usr/bin/timeout`; on timeout the grid stays usable and the toast says so.
- [ ] A tile for a state another device produced shows that device's label from the manifest; a state with no entry shows `unknown`.
- [ ] Help bar reads RESTORE while the tile is selected.
- [ ] While the reconciler runs (this tile or any other caller), launching a game from this screen is refused with the shipped sync message (D-CLOUD-038).

### Gap

The COPY TO FREE SLOT action here and `copyToSlot` share `makeStateFilename`'s default `fullPath`, declared in `SaveState.h` (not in the corpus). Verify before touching either path (#24).

---

## #7 — cloud sync: liveness by route, the boot pass through the reconciler, and a shutdown pass later

**What changed.** The boot sync exists (`autostart/102-cloud-saves`) and is wrong twice: it gates on `ping -c1 google.com` — which fails for a LAN remote and passes while the player's provider is down (`.claude/rules/rclone-cloud-sync.md` § Reachability means the remote) — and it runs the newest-wins pair (blindspot 28). Both are fixed by the #22 cutover in the same image.

### Requirements

- Boot: wait for a **default route** (`ip route`, the shipped `check_network_link`), not ICMP; then `cloud_reconcile --full --yes` under `L_T`. The reconciler's own listing is the reachability test; failure words the reason.
- Unattended: never opens the wizard; counts and badges (#22 R11; D-CLOUD-035).
- While it runs, game launch is refused with the shipped sync message and the exit push, if it collides, exits 3 as SKIPPED (D-CLOUD-038; changelog test 5 remains the fixture).
- Shutdown: a `cloud_reconcile --to-cloud --yes` before network teardown, through `L_T`, as a systemd unit ordered before the network target. Not part of #11's drop; sequenced after the cutover so it never adds a second writer.
- Stamps keep their names (D-UI-017/018/020); the row lines stay two (D-UI-023).

### Acceptance

- [ ] A LAN-only WebDAV remote syncs at boot with no internet; a device on a network that blocks `google.com` syncs at boot.
- [ ] With the provider down, boot reports a failure naming the remote, not a success.
- [ ] Both-sides-changed at boot: neither copy is overwritten; the row shows `1 waiting` (A1's boot leg).
- [ ] Launch a game within a minute of boot with both toggles on: the shipped refusal appears while the pass runs; the log shows one reconciler run, not two writers.

**Does not build**: nothing outside `cloud_reconcile`; no ICMP anywhere in the saves path.

---

## Register rows

The handoff proposed P1–P8. Resolved against D-CLOUD-032…040, D-UI-022/023:

| P | Status | Where it landed |
|---|---|---|
| **P1** retention | **Decided.** Retain, on by default: D-CLOUD-032. No undo control; #25 owns the reader: D-CLOUD-033. Count 3, range 1–9: D-CLOUD-036. Stop. | — |
| **P2** store home | **Dissolved.** The store is in the cloud beside the saves folder: D-CLOUD-036. Local transaction state stays under `/storage/.cache/cloud_sync/`, every item of which fails closed on loss; no row needed. | — |
| **P3** schema rev 2 | **Open — draft below.** No injected row covers additive fields under an unchanged `schema` integer, agreement on verified equality, or foreign manifests cached outside the tree. | refines D-CLOUD-031, D-CLOUD-017 |
| **P4** exit-path budget | **Open — draft below.** D-CLOUD-028 states today's contract; D-CLOUD-034 binds the cost discipline; neither states the reconciled exit path's budget. Gate 4 supplies the numbers. | refines D-CLOUD-028 |
| **P5** deletion semantics | **Partly decided.** Propagation is permitted and reversibility is the test: D-CLOUD-032. Absence asks; mass absence refuses: D-CLOUD-037. **Open — draft below** for `retired` records by `pub`, the cloud's layout winning moves, no retention of propagated deletions, and the stated residual. | refines D-CLOUD-030 |
| **P6** write-path ownership | **Decided.** One image replaces every writer wholesale: D-CLOUD-029. Split roots dissolved by removing the key: D-CLOUD-040. The mixed-firmware guarantee is per device (I17) and is recorded on #22 as a consequence, not a decision. | — |
| **P7** bisync's role | **Decided.** Not demoted; the spike is decisive against a written contract; narrow gaps go upstream: D-CLOUD-039. The contract is on #9. | — |
| **P8** queue-and-badge | **Decided.** MANAGE GAME SAVE RESTORES AND CONFLICTS with a badge; unattended passes never open the wizard: D-CLOUD-035. | — |

### Drafts for the three that remain (IDs are the maintainer's to assign)

**D-CLOUD-0xx — Save manifest rev 2 (refines D-CLOUD-031, D-CLOUD-017).** The manifest gains, additively: per entry `unit`, `producer` (when imported), `published_at`, `pub`; top level `units` and a bounded `retired` list. The `schema` integer stays `1` because no cloud has received rev 1 and every field is optional to a rev 1 reader. Agreement is recorded only on verified equality and names how it was verified. Manifests are read as a claim set — a device's claim about a path, never the head; the listing is the head. The own manifest's working copy and every foreign manifest live under `/storage/.cache/cloud_sync/`, outside the saves tree, and reach the cloud only as decided transfers. An unchanged manifest is never rewritten. No SQLite index is built; the audit log is the lineage beyond `replaces` (D-CLOUD-027). | #21, #22

**D-CLOUD-0xx — The exit path after the cutover (refines D-CLOUD-028).** Capture runs on every exit and spawns nothing. An idle exit spawns no rclone. A changed exit pushes to the cloud only: fresh head evidence per unit before any write, correspondence proven before any agreement advances, three to four spawns on backends with hashes and three plus a capped re-fetch on backends without, and an admission ceiling — measured by Gate 4 on the H700 against Dropbox and the QA backend — above which the unit waits for the next full pass. The "nothing changed ≈ 5 s" contract is preserved. Numbers are filled in from Gate 4, not chosen. | #22

**D-CLOUD-0xx — Deletion and absence (refines D-CLOUD-030; applies D-CLOUD-032 and D-CLOUD-037).** A deletion made through the interface is published as a `retired` record naming the `pub` it retires, and applies only to that publication; a later restore is a republication with a new `pub`. A save gone from one side with agreement on record and no applicable retirement is a question for the player, in both directions; an unmounted or empty saves root, or an empty or failing cloud listing, with agreement on record refuses the whole pass. For moves the cloud's layout wins and compaction follows in the same plan. Propagated deletions and compactions are not retained as discarded saves; where `copy --backup-dir` proves reliable (Gate 7), the cloud's `-replaced/` sibling is their record and #25 labels them apart. Residual, stated and accepted: a device holding a deleted version with no agreement for its path re-publishes it. | #22, #23, #25

---

## Document edits

Checked against D-UI-022 and D-UI-023; names updated where they changed.

1. **`docs/conflict-wizard-ia.md` → rev 5.** *Keep discarded saves* on by default, count 3 (1–9) (D-CLOUD-032/036); the entry MANAGE GAME SAVE RESTORES AND CONFLICTS with the badge; unattended passes never open the wizard (D-CLOUD-035); "nothing transfers until COMPLETE" → "no resolution applies until COMPLETE; the pre-pass is not rolled back"; the auto rule; the absence question in both directions with the mass case refusing (D-CLOUD-037); the retention store's home moved from `/storage/.cache/cloud_sync/history.db` to the cloud sibling `<SAVES_REMOTE>-discarded/`, and the SQLite question closed as *not built*; the *Where state lives* table rewritten (per-save sidecar is dead; manifests per device under `savestates/.rocknix/`; local transaction state under `/storage/.cache/cloud_sync/`); "in-game save" → *game save*, "savestate" in prose → *save state* (`.claude/rules/es-native-ui.md`); every specified row two lines (D-UI-023); the stamps directory already corrected.
2. **`docs/save-manifest-schema.md` → rev 2** (#21): R3's fields; `verified_by`; the claim-set reading; the local homes; `schema` stays `1`; §8 rewritten — snapshots are the cloud discarded store, not a `.snapshots` directory; §9's `BACKUPPATH == RESTOREPATH` assumption replaced by "one saves root, `SAVESPATH`" (D-CLOUD-040). Closing comment on #20 recording rev 2 and that no index is built.
3. **`plans/bisync/rclone-bisync-planning.md`** (branch `rclone-bisync-beta`) and **#9**: "newer file wins" and `--conflict-resolve newer` struck (`docs/save-manifest-alignment-review.md` §3.1); the contract on #9 replaces its Phase 3; bisync is the evaluated full-pass transport (D-CLOUD-039).
4. **`plans/conflict-resolution/vita-style-conflict-resolution.md`**: the product vision's KEEP CLOUD / KEEP DEVICE / MERGE → the IA's KEEP LEFT / KEEP RIGHT / KEEP BOTH; "V2 snapshots" → retention in the cloud in V1, the restore tool in #25; a pointer to this run's `consensus_plan.md`.
5. **`.claude/rules/rclone-cloud-sync.md`**: § What gets synced — the reconciler is the only writer; the allowlist is the outer boundary; `RCLONEOPTS` is never sourced by it; the new key names with read-old-if-new-absent; § The game-exit sync rewritten for R5 (zero spawns idle); § Reachability — the boot sync now obeys it; "system backup" → *settings archive* throughout; the two-way passes state their conflict rule in one sentence (blindspot 28's guard).
6. **`docs/es-menu-map.md`**: the new row under CLOUD SETTINGS; row labels per D-UI-022 (SYNC SAVES WITH THE CLOUD · BACK UP SAVES TO THE CLOUD · RESTORE SAVES FROM THE CLOUD · MANAGE CLOUD STORAGE); two lines per row; the SAVESTATE MANAGER entry keeps its screen name and gains #37's tile.
7. **`docs/cloud-sync-changelog.md`** (a claims document — every line re-checked against a run before it leaves the repo): § Game saves "Two-way sync never deletes. The newest copy … is kept on both sides" is **false after the cutover and misleading before it** — replaced by the reconciler's rule once #22 has run A1; § Not in this change updated when the wizard ships; "system backup" → *settings*, "save data" → *saves*, "upload" → *back up*.
8. **`docs/decision-register.md`**: the three drafted rows above, once the maintainer assigns IDs.
9. **`docs/blindspot-register.md`**: entry 28's guard now points at `cloud_reconcile`'s header sentence and the A1 fixture; a new entry if Gate 13 exposes one.
10. **Issue bodies**: #11 #9 #10 #19 #21 #22 #23 #24 #25 #35 #37 #7 as above, edited in the body, not appended as comments (blindspot 27).
11. **`tools/cloud-round-trip`**: the Gate 0 repairs and every fixture on #35; its docstring's "S3 backend" note and step names in D-UI-022's words.
12. **`projects/ROCKNIX/packages/network/rclone/autostart/102-cloud-saves`**: the route test and `cloud_reconcile --full --yes` (#7), in the cutover image.

---

## Needs the maintainer

Short, and none of it reopens a decision.

1. **A one-word correction to D-CLOUD-036's wording.** The row names KEEP LEFT as the server-side move and KEEP RIGHT as the push-first case. With the cloud fixed in the **left** column (`docs/conflict-wizard-ia.md`, settled since rev 3), the cloud loser — the server-side case — is **KEEP RIGHT**, and the device loser that must be pushed first is **KEEP LEFT**. The tracker text above follows the mechanics, which the row states unambiguously; a refining row or a comment on the register would keep the label mapping from being re-derived wrong later.
2. **The folder name of the discarded store.** D-CLOUD-036 places it beside the saves folder; the text above derives `<SAVES_REMOTE>-discarded/` (e.g. `/ROCKNIX/Saves-discarded/`) on the `-replaced/` precedent (D-CLOUD-014) so it needs no new config key. Cosmetic; change it before the first image writes it.
3. **A legacy `RESTOREPATH` that differs from `BACKUPPATH` on an upgraded device.** D-CLOUD-040 removes the key; the text has the helper migrate to `SAVESPATH`, drop the old key, and warn once about the folder it will not touch. If the maintainer prefers that the reconciler *refuse* until someone looks, say so — one check either way.
4. **Between filing a narrow bisync gap upstream and its landing.** D-CLOUD-039 says a narrow gap is filed, not worked around. The text has the reconciler hold or queue the affected case meanwhile (fail closed, no second mechanism). If a confined interim step is preferred instead, that is the maintainer's read of Gate 11's score.

Everything else the handoff listed as outstanding — bisync's role, queue-and-badge, the retention count, local retention of propagated deletions, split roots, absence in both directions, the launch gate — is covered by D-CLOUD-035/036/037/038/039/040 and by D-CLOUD-032/033, as cited inline.

---

## Corpus provenance

Recorded from the per-source headers as embedded; not re-read, not re-hashed, no tests executed. One discrepancy noted: the handoff's own provenance block carries a different string for source 26 (`issue-25.md`); the per-source header value is the one recorded here.

```json
{
  "artifact": "step5-tracker-text.md",
  "role": "council step 5: the consensus handoff rendered as tracker text",
  "corpus_mode": "verbatim embedded read-at-time corpus supplied by Council Facilitator council-facilitator@1.2.0",
  "source_count": 42,
  "manifest_read_timestamp_utc_as_supplied": "2026-09-05T17:32:51Z",
  "member_filesystem_access": false,
  "member_reread_files": false,
  "member_rehashed_sources": false,
  "member_executed_tests": false,
  "hash_basis": "sha256 values copied verbatim from the per-source headers; verified at embed time by the Facilitator; not recomputed here",
  "injected_artifacts_treated_as_specification": ["consensus_plan.md (handoff section)", "settled-decisions.md (D-CLOUD-032..040, D-UI-022, D-UI-023)", "vocabulary-rules.md", "current tracker bodies for #11 #9 #10 #19 #21 #22 #23 #24 #25 #35 #37 #7"],
  "base_plan_not_embedded": "claude-revised_plan-r4.md; its section and item labels (§1.x, I*, B*, D*, C*) are cited by label only and their contents are not reproduced",
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
    {"material": "ES SaveState.h / SaveStateRepository.h (defaults of makeStateFilename fullPath and getNextFreeSlot config), GuiSaveState.cpp (delete and COPY TO FREE SLOT actions), the launch-time isRunning() guard in FileData.cpp outside l740-850, ProcessStartInfo", "reason": "The adapter's install path, #37's tile and the D-CLOUD-038 extension are specified against behaviour these files hold; each is flagged as verify-before-coding in #22, #24, #37", "declared_source_path": null, "sha256": null},
    {"material": "cloud_setup (relink_epoch write point), setsettings.sh (savestate_directory), Paths.cpp, backuptool, tools/cloud-test-backend", "reason": "Named in #22 R7, #10 Gate 9 and #35 Gate 0 as locate-first items", "declared_source_path": null, "sha256": null},
    {"material": "rclone 1.75.0 documentation or source for --files-from with lsjson/hashsum/copy, --ignore-times, post-transfer hash behaviour, --backup-dir with copy under interruption, bisync per-run filter files", "reason": "The exit-path mechanism, spawn counts, the -replaced/ record and contract items 3 and 6 on #9 are hypotheses until Gates 4, 7 and 11 measure them", "declared_source_path": null, "sha256": null},
    {"material": "claude-revised_plan-r4.md and the other round-4 plans and votes", "reason": "Not embedded; base labels (I*, B*, D*, C*, §1.x) are cited by label only and no content is reproduced from them", "declared_source_path": null, "sha256": null},
    {"material": "Any executed result of tools/cloud-round-trip, the bisync spike, the #19 bench, the census, or a two-device fixture", "reason": "None exists in the corpus; every gate in the epic's table is unrun and every acceptance box above is unticked", "declared_source_path": null, "sha256": null}
  ],
  "missing_source_policy": "No missing source paths, hashes, contents, or execution results have been fabricated. Interface strings, the retention folder name, record.json fields, the lock file names and the classifier table are this text's drafts against the cited decisions, marked with the gates that settle them."
}
```