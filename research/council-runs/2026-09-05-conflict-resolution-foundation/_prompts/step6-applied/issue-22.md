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

---
*Body written from the council's handoff, `research/council-runs/2026-09-05-conflict-resolution-foundation/final-issue-draft.md` (consensus plan `revised_approaches/consensus_plan.md`), applied 2026-09-06 per the maintainer.*
