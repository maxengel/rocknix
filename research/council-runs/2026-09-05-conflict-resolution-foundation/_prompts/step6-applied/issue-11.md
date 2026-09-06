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

---
*Body written from the council's handoff, `research/council-runs/2026-09-05-conflict-resolution-foundation/final-issue-draft.md` (consensus plan `revised_approaches/consensus_plan.md`), applied 2026-09-06 per the maintainer.*
