# Step 5 — the handoff as tracker text

Everything below is ready to paste. Player-facing strings follow D-UI-022 (*saves*, *earlier versions*, *discarded saves*, *back up*, *restore*, *sync*), rows are a label and at most one line (D-UI-023), settings nest (D-UI-039). "Escrow" appears only in engineering text, never in a string a player reads. Every acceptance item names its venue; none runs on a person's device or cloud (D-QA-007/015/017).

---

## #134 Save history: one home for the earlier versions of a player's saves — `Saves/.history/`, hidden, declared, written store-first [OPEN]

**Context.** The plan of record kept the losing side of a resolved conflict in `<SAVES_REMOTE>-discarded/` (#22 R9, D-CLOUD-036), and the shipped scripts set aside every cloud copy a backup overwrites in `<SAVES_REMOTE>-replaced/<stamp>/` through rclone's `--backup-dir` (D-CLOUD-014), pruned to the newest run — two homes for what a player meets as one thing. On 2026-09-11 the maintainer ruled: one hidden store inside the saves folder, declared by a README (D-CLOUD-095); bounded by count, age and size (D-CLOUD-096); no interim widening of `-replaced/` (D-CLOUD-097); save states and auto-states included (D-CLOUD-099); a suspect save auto-healed (D-CLOUD-100); settings nested (D-UI-039); time to play a first-class metric (D-CLOUD-098). This epic carries that ruling into #21, #22, #23, #25, #135 and two new children (the guard image; the fold of the old set-aside folders). #132 is folded here (D-CLOUD-097). D-CLOUD-094 (6) closes when this body is applied.

### The design, on one screen

**Home.** `<SAVES_REMOTE>/.history/<unit>/<seq>/`, dot-prefixed, excluded from every transfer by the allowlist's first rules. `<SAVES_REMOTE>/README.md` and `<SAVES_REMOTE>/.history/README.md` say what the folder is, how much it keeps, and that the handheld's menu is where a version comes back (in V1: that the versions are kept and the menu is coming, D-CLOUD-033). `--backup-dir` is retired at the R1 cutover; until then the shipped scripts are unchanged (D-CLOUD-097).

**The floor (store-first).** Nothing becomes the current save in the cloud, and nothing leaves it, unless that version is already a complete entry in the store. Every publish first places its own version in the store (`reason: published`), verified; every head that is about to be overwritten or deleted and is not yet in the store is copied in first (`replaced`, `discarded`, `deleted`, `suspect`). This generalises D-CLOUD-014 (a backup never deletes by default) and D-CLOUD-078 (one last-known-good at rest) to every writer of the saves tree, and it is why the retain-on-decision store of #22 R9 is superseded rather than moved.

**The transaction.** (1) member bytes, stored under their own sha256 as the file name; (2) `record.json`, written last — a valid record is the commit point; (3) the head. A directory without a valid record is an orphan: invisible to the reader and to the pruner's protections, swept only by the device whose id is in its `<seq>`, on a full pass, when its run id is not current and no local pending record names it. Copy, never move, from the head (a move opens the absence window D-CLOUD-037 turns into a question). A `published`/`replaced` entry is skipped when the newest complete entry of that save file holds the same version and is protected; `discarded`/`deleted`/`suspect` entries are never deduplicated. Own-manifest witness (#22 R7) before any store write. Every store mutation writes its audit line before it acts (D-CLOUD-027).

**Where it runs.**

| Where | What | Player waits? |
| --- | --- | --- |
| **Launch path** | Nothing. A launch cancels an automatic pass in any phase (D-CLOUD-076); the only addition is quiescing a *dead* lock-owner's children, inside D-CLOUD-076's two-second budget. | No |
| **Exit sync** (cancellable) | Head evidence + witness → store entry (members, record) → verify → head write → correspondence → agreement and `store_seq`. Heal of a suspect save from the capture stage. One bounded fetch of one suspect unit only when the stage lacks the good copy. Lazy one-listing check of `store_seq` on the rare unknown path. Smallest unit first; over the ceiling, entry and publish defer *together*. | Behind the card, cancellable |
| **Full pass** (startup sync, manual rows) | Retain of unstored heads by server-side copy; pruning; own-orphan sweep; fold of `-replaced/` and the local cache; cloud-side heals; the optional ancestry check; size accounting. | No |
| **Never on the device** | The script audit for `--delete-excluded` and `--backup-dir`; every measurement (E1–E15) on the GENERIC_X64 pair. | — |

**Bounds and their priority (D-CLOUD-096, refined by P-2).** Protections first: **P1** head-equal, or named by this device's own pending record; **P2** the newest complete entry of a save whose head is absent *without explanation* (agreement on record, newest reason not `deleted`), and a device's own newest complete entry of any headless file; **P3** the newest `discarded` entry per save file (D-CLOUD-032's one step back survives routine churn). Then caps, on full passes only: **C1** count per save file (a state and its PNG are one entry; auto-state churn never evicts a manual slot's versions — what makes D-CLOUD-099 true), default 3, range 1–9 (D-CLOUD-036); **C2** 90 days, only when both the entry's time and the pruner's clock are trusted; **C3** 256 MiB over every stored byte — members, PNGs, records, current-version entries, imports, descriptors, orphans — oldest first over this device's own unprotected entries. **A device deletes only entries its id owns**; two pruners never choose the same victim. Overshoot is logged and disclosed, never resolved by deleting protected material.

**One setting for the fleet.** The own manifest carries `history_keep {on, count, rev}` (additive, D-CLOUD-045). A pass reads every manifest and adopts the highest `rev`; ties: ON beats OFF, the larger count wins; an edit writes `rev = max_seen + 1`. OFF stops every new entry — publish entries included — from the next pass, purges nothing, and the switch's dialog says what that gives up (P-1, maintainer's word).

**Suspect (D-CLOUD-100).** Zero length, or all one byte, where the agreed version was neither. Heal from the capture stage by temp-and-rename; the suspect kept as an exact descriptor (`size`, `byte`) — a version, shown by #25 as SET ASIDE AS DAMAGED; nothing published for the unit; the recovery reported on the card after the install succeeds. Stage missing → one bounded fetch of that unit; fetch fails → `suspect-unhealed`, healed at the next full pass. Both sides suspect, no verified good counterpart, a both-changed pair with one suspect side, a suspect cloud head over a good local copy, and the second suspect capture of one save after a heal are **questions** (D-CLOUD-037's surface), never heals. #21 is amended: the stage keeps the last agreed version of each save until a newer one is agreed.

**Save states.** All of them, auto-states included (D-CLOUD-099), made true by the per-file count bucket above.

### Build order

| Step | What | Lands in |
| --- | --- | --- |
| 1 | Prerequisites: #21's stage keeps the agreed version until superseded and the walker never claims `.history/` or a README; `docs/save-manifest-schema.md` gains `store_seq` per entry and `history_keep` at top level (additive, D-CLOUD-045); audit of the full scripts, the layout migrator and MATCH for `--delete-excluded`, `--backup-dir` targets and call paths | #21; #22 prerequisite; new child A |
| 2 | **Guard image**: `- /.history/**` and `- /README.md` first in `cloud_sync-rules.txt`; `cloud_sync_helper` strips `--delete-excluded` from `RCLONEOPTS` and adds the two lines to a user-*edited* rules file; no writer yet | **new child A** |
| 3 | The store-first transaction in the reconciler: entries, record-last, per-backend verification, ceiling counting store bytes, pair deferral, `pending-publish.json` `escrowed → published`, `store_seq`, dedupe, audit | #22 R5/R9 |
| 4 | Retain path for unstored heads: `store_seq` lookup, lazy listing, from-stage upload at exit, server-side copy on a full pass, defer otherwise | #22 R4/R9 |
| 5 | Pruning: listing, chain order from `<seq>`, P1–P3, C1–C3, owner-scoped deletion, own-orphan sweep, every-byte accounting, overshoot log | #22 R9 |
| 6 | **Standing fold** of `Saves-replaced/` and `/storage/.cache/cloud_sync/replaced/`, receipts, path-aware repair | **new child B** |
| 7 | Suspect class and heal, the second-occurrence question, the bounded fallback fetch | #22 R4/R5 |
| 8 | Wizard apply through the store | #23 |
| 9 | Settings nested behind a verb-bearing row; the fleet setting; menu map; the measured price line | #23 |
| 10 | README and the public cloud-sync page | this epic |
| 11 | The reader | #25, after Gate 2 (A5) |

### Ordered experiments

All on the GENERIC_X64 pair against the self-hosted backends of #133 (WebDAV, S3/MinIO, SFTP, SMB, FTP; D-QA-017). Nothing on a handheld or in a person's cloud (D-QA-015).

| # | Experiment | Venue | Hazard exposed | Unblocks |
| --- | --- | --- | --- | --- |
| E1 | Shipped image `af2db4ab09` against a seeded `Saves/README.md` + `.history/` with content-addressed members: copy backup, sync backup, restore, MATCH; then a user filter with broad includes; then the guard image | VM pair, WebDAV | Old writers restore, mirror away or shred the store; whether bare-hex names fall through to `- /**` as the rules read | child A; step 2; child B's boundary |
| E2 | Grep the full scripts; force `--delete-excluded` in `RCLONEOPTS` on the shipped and guard images, copy and sync modes | VM pair, WebDAV | The guard becomes a deletion instruction; whether `--backup-dir` catches it | child A |
| E3 | Per backend: server-side copy; hash availability and correspondence (incl. S3 multipart ETag); post-transfer hash check fails closed under a corrupting proxy; modtime on `copyto` | VM pair, all five | An unverified entry; a wrong cost ledger; whether head-from-entry copy saves an upload | steps 3, 4; #22 R5 numbers |
| E4 | One-spawn record-last ordering (`--transfers 1` + ordering) on every backend, killed mid-transfer | VM pair, all five | Record before members; a truncated record read as valid | step 3 (one spawn recovered if it passes) |
| E5 | Two devices with distinct ids: A reads head, B reads head, A publishes HA, B publishes HB over it; then A's next pass; with and without the ancestry check | VM pair, WebDAV + SFTP | HA lost; a false conflict on a linear chain | steps 3, 5; #22 R4 refinement |
| E6 | A writes its entry and pauses before the head; B prunes under count and size pressure; then two concurrent pruners over seeded protections | VM pair, WebDAV | An entry deleted before its head write; two devices each deleting the last copy | step 5 |
| E7 | Kill only the lock-owning parent before a rename; launch a game; release the child; a server-side operation completing after client death | VM pair, WebDAV | A rename landing after the first frame | #22 R6 |
| E8 | Manual-slot overwrite + auto churn; same-file churn after a wizard decision; a decided deletion aged 91 days; a headless `legacy` file | VM pair, WebDAV | A manual slot evicted; the wizard loser evicted; a permanent `deleted` entry | step 5; D-CLOUD-099/032 |
| E9 | Seed a device with a downloaded `.history/`; run `cloud_capture --full` | VM guest | History claimed as this device's saves | #21 amendment |
| E10 | Migration fixtures with interruption at every step; a stamp changing under an old image | VM pair, WebDAV + SFTP | A legacy version lost; a source removed unverified; a torn unit offered | child B |
| E11 | Clear `/storage/.cache/`; next full pass; a legacy head's first overwrite | VM guest, WebDAV | An upload storm; a retain skipped into an unprotected entry | step 4 |
| E12 | `tools/vm-qa time-to-play`: no history / retain-old-head / store-first; WebDAV and SFTP; bandwidth-capped and not; startup-sync duration; completion rates | VM pair | Exit sync over budget; freshness lost to cancellation; launch path touched | #135 gate; P-13 |
| E13 | Heal fixtures: zero-length and uniform, from the stage offline; stage missing; both suspect; suspect cloud head; erase twice; a restored uniform version | VM guest, WebDAV | A dead save left in place; a false recovery message; a heal loop | step 7; #21 stage requirement |
| E14 | Gate 2/A5 reader from a second device under every perturbation in #25 | VM pair, WebDAV + SFTP | A store a reader cannot drive | #25 |
| E15 | Upgrade a device with a user-edited rules file, and one with a user-named filter file | VM guest | The guard never reaches edited files; a user's own filter altered | child A |

### Time to play as a gate (D-CLOUD-098, #135)

Interface → first frame: unchanged by design; E12 confirms it against baseline. Exit → next first frame: worst case unchanged (the cancellation budget); the exit sync grows by the store entry and its record — roughly two more spawns and one more upload of the changed bytes on hashed backends, three more spawns plus a re-fetch on hashless — an estimate until E12 measures it. E12 reports latency distributions *and* completion rates; the number for "one changed battery save, hashed backend" becomes the budget row (P-13) and a run over it fails the suite. Nothing in this epic lands before that row exists.

### Decisions that bind

D-CLOUD-014, 030, 032, 033, 034, 036 (cloud home; 3 per save, 1–9), 037, 038, 041, 045, 046, 047, 052, 053, 074, 075, 076, 077, 078, 083, 088, 093, 095, 096, 097, 098, 099, 100; D-UI-022, 023, 039; D-QA-007, 015, 017. Refinements proposed by ID are in the register-rows section of this handoff (P-1..P-13); none reopens D-CLOUD-052, 095, 097, 099, 014, 030, 033, or D-QA-015/017.

### Checklist

- [ ] #21 amended (stage lifetime; walker).
- [ ] Child A (guard image) shipped one image before the cutover.
- [ ] #22 R1–R10, negative scope, inventory and acceptance amended as below and built.
- [ ] Child B (fold) standing on every full pass; `-replaced/` and the local cache empty and removed once the last old image is retired.
- [ ] #23 settings nested; wizard apply through the store.
- [ ] #135's cell reports E12; the budget row is recorded before #22 lands.
- [ ] `Saves/README.md`, `.history/README.md`, the public page's layout table, `docs/es-menu-map.md`, `docs/save-manifest-schema.md`, `docs/conflict-wizard-ia.md` rev 5 updated in the same changes as the code they describe.
- [ ] #25 after Gate 2.

---

## #22 — amendments, row by row

*One line on what changed and why, then replacement text. Rows not listed are unchanged.*

**Preamble** — replace "Retention lives in the **cloud**, beside the saves folder" with: *Retention lives in the cloud, inside the saves folder at `<SAVES_REMOTE>/.history/` (D-CLOUD-095), written store-first by this reconciler for every writer, not only on a wizard decision.*

### R1 — one writer

*Changed: MATCH THIS DEVICE TO THE CLOUD added to the enumerated writers; every deletion goes through the store first (D-CLOUD-095, the floor).*

Every writer of the saves tree — boot (`autostart/102-cloud-saves`), SYNC SAVES WITH THE CLOUD / BACK UP SAVES TO THE CLOUD / RESTORE SAVES FROM THE CLOUD and the hub's SAVES tick (`GuiMenu.cpp`), **MATCH THIS DEVICE TO THE CLOUD** (the only action that deletes; its direction is taken from the code, which is not in this corpus), the Tools symlinks (`/usr/config/modules/cloud_*.sh`), the game exit (`FileData.cpp` → `ThreadedCloudSync`), #37's tile, and `cloud_backup`/`cloud_restore` from a shell — reaches it only through `cloud_reconcile`, cut over in **one image**. The saves phases of the two scripts delegate to it; their settings-archive phases are untouched; the card shows one outcome per run (I11). Passes: `--full`, `--to-cloud`, `--from-cloud`, `--exit` (R5), and MATCH's pass. No pass ever overwrites a both-changed unit. **Every deletion any pass makes is a complete `deleted` entry in `.history/` before it acts** (R9, I1). `--backup-dir` is passed by nothing once this row is true.

### R2 — rclone arguments

*Changed: the guard rules replace the `.snapshots` guard; store transfers carry no allowlist; reserved paths are rejected on the list, not by filter (D-CLOUD-095; refines D-CLOUD-088 — P-8).*

`cloud_reconcile` builds its own rclone arguments; **never sources `RCLONEOPTS`**; **never passes `--delete-excluded`**; passes the shipped allowlist `cloud_sync-rules.txt` as the outer boundary with **`- /.history/**` and `- /README.md` ahead of every include** and `- /**/*.bak` retained (ES's `.state.auto.bak`); `- /savestates/.snapshots/**` is dropped once the cutover inventory confirms it has no writer. Every decided transfer of a *save* uses `--files-from` **and** `--ignore-times`. **Transfers into and out of `.history/` carry no allowlist**: their source is a stage directory this reconciler wrote, or a listed entry. The planner rejects `.history/**`, `README.md` and any manifest path from every save list *regardless of the filter file in use* — a check on the list, not a rule in a file (the player's filter controls which saves move, not the namespace). Full-pass transport per D-CLOUD-052: the reconciler's own `rclone copy --files-from --ignore-times` per direction; no `rclone bisync` anywhere. A renumber is a move on the same hash plus a `retired` record; an interrupted push is completed from `pending-publish.json` (R5).

### R3 — not present in the current body; nothing to amend.

### R4 — the classifier, per unit

*Changed: the `suspect` class and its questions (D-CLOUD-100); "incomplete" covers `complete: false`; mass absence counts live save units; the deletion row copies into the store first and drops the `-replaced/`/Gate 7 clause (D-CLOUD-095); the ancestry reclassification is an optional refinement.*

*L* = this device's hash set for the unit, *C* = the cloud head's (fresh listing; `remote_hash` matched to sha256 via the manifests; hashless backends by size + sha256 after fetch), *A* = the agreed hashes. A listing that answers nothing is *unknown*, never "no conflict" (blindspot 22).

| Unit state | Verdict | Action | Outcome |
| --- | --- | --- | --- |
| L = C | identical | seed or confirm agreement, `verified_by`; on a full pass, a head with no complete entry in `.history/` is copied in server-side (`replaced`) and its `store_seq` recorded | 0 |
| L ≠ C, C = A | this device changed | store-first publish (R5); a head with no complete entry (`store_seq` unknown or false) is retained first; not on `--from-cloud` | 0 |
| L ≠ C, L = A | the cloud changed | fetch the unit's changed members (not on `--to-cloud`); the local agreed version is copied into the store first **only** when its `store_seq` is unknown or false. *Optional refinement:* when the device's agreed version is **not an ancestor** of the cloud head along the `replaces` chain read from `<seq>`, reclassify divergent; a broken chain (`rdigest = 0`) is *unknown* and this row stands (D-CLOUD-030's identity rule is unchanged unless this is built) | 0 |
| L ≠ C, both ≠ A, or no A | divergent | queue for the wizard; transfer nothing | 5 |
| L is zero length or all one byte; the agreed version was neither; C = A | **suspect** | audit line; the descriptor (`reason: suspect`, `pattern {size, byte}`) written durably to the local pending store; the agreed version installed from the capture stage by temp-and-rename; nothing published for the unit; the card reports the recovery **after** the install succeeds. Stage lacks the agreed version → **one bounded fetch of this unit only** (D-CLOUD-075's timeouts; a launch cancels it; the card names it); fetch fails → `suspect-unhealed`, nothing publishes, the next full pass heals from the cloud | 0 · 6 |
| both sides suspect · L suspect with no verified good counterpart · both changed and one side suspect · C suspect while L = A and good · the second suspect capture of one save after a heal | **question** | queue on the wizard's absence surface: keep it as it is, or put back the last good copy; a suspect cloud head is never installed over a good local copy; a version restored through #25 becomes agreed and is not re-healed | 5 |
| cloud unit declared incomplete (`units` names members the head lacks, or `pub` disagrees), or the head's version is in the store only as `complete: false` | held | nothing for this unit; every other unit proceeds (B3) | 6 |
| absent on one side, A on record, an applicable `retired` record | deletion | the version about to be removed is a complete `deleted` entry first (cloud copy: server-side copy where the backend can, else through the device; local copy: uploaded when no complete entry of that version exists), verified; then act on the survivor | 0 |
| absent on one side, A on record, no `retired` | unexplained absence | queue as a **question** (D-CLOUD-037); touch nothing | 5 |
| absent on one side, no A | one-way | transfer (a push is store-first; a fetch into an absent local side retains nothing) | 0 |
| saves root unmounted or empty, or the cloud listing empty or failing, with A on record — **judged on live save units only**: `.history/`, `README.md` and the manifests folder count as neither presence nor absence | mass absence | **refuse the whole pass**, reason named | 1 |
| same hash, different path | move | the cloud's layout wins; a duplicate is compacted after both files are re-read equal, logged (D-CLOUD-030); compaction retains nothing | 0 |
| another client's conflict artefact | not a version | untouched, never offered (D-CLOUD-022) | — |
| exit push above the admission ceiling (entry bytes + head bytes + record + hashless re-fetches, members and PNGs) | deferred **as a pair** | entry and publish both wait for the next full pass | 6 |

A `retired` record applies only to the `pub` it names (A9). A device with no agreement for the path re-pushes the deleted version — the accepted residual (D-CLOUD-047).

### R5 — the exit push

*Changed: store-first ordering; spawn budget; pair deferral; smallest first; one bounded fetch of a suspect unit as the only download (refines D-CLOUD-046 — P-6).*

Capture (#21) has run. If the exit toggle is on and a default route exists (`ip route`, no packets), the push takes `L_T` (non-blocking; exit 75 if held). Per changed unit, **smallest first**: (1) one `lsjson --hash --files-from` over the changed units' cloud paths for fresh head evidence **and the own-manifest witness** (R7) — nothing is written to the store before this; (2) if the head has no complete entry (`store_seq` unknown or false), retain it: from the stage if the stage holds the agreed version, else one listing of `.history/<unit>/` answers it, else defer the unit; (3) the entry: members under their sha256 names, then `record.json` **last** (two spawns; one if E4 passes); (4) verify — rclone's post-transfer hash check where E3 shows it fails closed on that backend, size plus a capped re-fetch where it has no hash; a failure marks `unverified-escrow`, publishes nothing for the unit, advances nothing; (5) `pending-publish.json` → `escrowed`; (6) the head write from the stage (or by server-side copy from the entry where E3 shows the gain); (7) correspondence (a second listing, or the post-transfer check; hashless: size plus a capped re-fetch) **before** agreement advances; a failure marks `uploaded-unverified`; (8) agreement and `store_seq` written. A unit over the admission ceiling (set from Gate 4 and E12) defers entry and publish together. Budget: an idle exit spawns **no** rclone; a changed exit spawns 5–6 on hashed backends and 6–7 on hashless — numbers filled from Gate 4/E12, not chosen; the "nothing changed ≈ 5 s" contract stands. **The only download on this path is one bounded fetch of one suspect unit when the stage lacks its good copy (R4).** No ICMP, no probes. A launch cancels the run in any phase (D-CLOUD-076); record-last means a cancel leaves an orphan or a complete entry, never a torn entry, and wastes at most the spawn in flight.

### R6 — locks and the launch gate (D-CLOUD-038, D-CLOUD-076, D-CLOUD-093)

*Changed: a launch cancels an automatic sync (D-CLOUD-076), the body said "refuses"; the process-group marker and quiescence are added (refines D-CLOUD-093 — P-9).*

Two flocks, both non-blocking everywhere; nobody waits.

- `L_T` = `/var/run/cloud_sync.lock`, held by the reconciler's own shell and nothing it starts (D-CLOUD-093); exit 75 when held. **The reconciler writes its process-group id beside the lock.**
- `L_S` = `/var/run/cloud_saves-session.lock` with a marker naming the game and the launched pid. ES takes `L_S` before the pre-launch renames and holds it through capture. Then ES checks `L_T`: an **automatic** pass (startup or exit origin) holding it is **cancelled** — SIGTERM to the group, wait within a two-second budget, SIGKILL at 1.5 s, the kill complete before the game starts, the card ending `SKIPPED - A GAME WAS STARTED` (D-CLOUD-076); a sync **the player started by hand** is not cancelled, ES releases `L_S` and refuses the launch with the shipped running-sync message. **If the lock owner is dead but its group is alive** (children still renaming), the launch — and any new reconciler run — kills and waits that group within the same budget before proceeding. The launch-time check is not in the embedded `FileData.cpp` excerpt; the implementer verifies it in the live file before extending it.
- Every other writer of the saves tree inside EmulationStation is gated the same way (D-CLOUD-053); a deletion made there writes a `retired` entry (#21 R3).
- The reconciler takes `L_T`, then `L_S` non-blocking per unit batch; when `L_S` is held it reads the marker, excludes that game's units and reports SKIPPED for that game (A6). Batches hold `L_S` under 100 ms on the H700 (Gate 3 measures).

### R7 — context and guards

*Changed: the witness precedes any store write; a context change sets every `store_seq` unknown.*

Every local record carries its **sync context** (I1); a record whose context does not match is treated as absent (A3). **A context change — re-link, CHANGE CLOUD FOLDER — also makes every `store_seq` unknown**, so the first overwrite of each head after it lists `.history/<unit>/` once and retains if no complete entry is found. **Own-manifest witness** (I2): before any publish **and before any write to `.history/`**, the head's copy of this device's manifest must be the one this device last published; otherwise `duplicate-device-id`, nothing written anywhere (A11). Storage guards (I21), parser discipline (I6), and the split-root rule (D-CLOUD-040) are unchanged.

### R8 — not present in the current body; nothing to amend.

### R9 — the store, inside the saves folder (D-CLOUD-095/096/099/100)

*Changed: replaced wholesale. The `-discarded/` sibling written on a wizard decision (D-CLOUD-036/042's location) becomes `Saves/.history/` written store-first by every writer (D-CLOUD-095); bounds per D-CLOUD-096 as refined by P-2.*

```
<SAVES_REMOTE>/.history/<unit key, percent-encoded>/<seq>/
    <sha256>          one file per distinct member content; bare hex, no extension
    record.json       written last; a valid record is the commit point
<seq> = <utc-compact>-<device-id>-<run-id>-<vdigest>-<rdigest>
        vdigest = short hash over the entry's sorted member sha256s
        rdigest = vdigest of the version this one displaced, or 0 when unknown
<SAVES_REMOTE>/README.md ; <SAVES_REMOTE>/.history/README.md
```

`record.json`: `schema`; `reason ∈ {published, replaced, discarded, deleted, suspect, legacy}`; unit key, `kind`, `system`, `rom`; `members[] = {path relative to the saves root, sha256, size}`; slot at the time (or null); `producer`, device label, `core`, `core_build`, `captured_at`, `clock_synced`; `replaces` (vdigest, and `pub` if known); for `discarded`: the decision, winning side, `decided_at`; for `deleted`: the retirement's `pub`; for `suspect`: `pattern = {size, byte}` and no members; for `legacy`: `legacy_source`, `legacy_event: unknown`, `legacy_time` (zone unknown), `imported_at`, `imported_by`; `time_trusted`; `complete`; the run id. A reader treats an entry as complete when its record is valid and may re-verify member presence against the listing at no extra request. This is the record #25 drives a picker from: **this game, newest first, thumbnail, producing device, why it was kept** (D-CLOUD-033).

**Invariants.** I1 nothing becomes the head, and nothing leaves it, unless the version is a complete entry (the floor). I2 bytes before record; record before head. I3 copy, never move, from the head. I4 own-manifest witness before any store write. I5 a device deletes only entries whose `<seq>` carries its own id. I6 protections P1 (head-equal; own pending), P2 (newest complete entry of an *unexplained* headless save; a device's own newest complete entry of any headless file), P3 (newest `discarded` per save file) precede caps C1 (count per save file, default 3, 1–9), C2 (age 90 d, entry time and pruner clock both trusted), C3 (256 MiB over every stored byte, oldest first over own unprotected). I7 no store operation on the launch path; pruning, fold, listings and the ancestry check on full passes only. I8 every mutation audited before it acts.

**Rules.** Dedupe applies to `published`/`replaced` only (skip when the newest complete entry of that save file holds the same version and is P1-protected); event entries are never deduplicated. A directory without a valid record is an **orphan**, swept only by its owner on a full pass when its run id is not current and no local pending record names it. A decided deletion (`deleted`: REMOVE EVERYWHERE, a save-state DELETE, a MATCH deletion) is an ordinary earlier version and leaves under C2/C3; only an *unexplained* headless save's newest entry is P2-protected (D-CLOUD-096's "never the only copy of a game", made precise). A `legacy` entry of a headless file has no agreement and no known event; P2 does not apply and it ages from `imported_at`. Overshoot of C3 by protected material is logged and disclosed, never resolved by deletion. The wizard's apply: KEEP LEFT (keep the cloud copy, D-CLOUD-041) uploads the device loser as `discarded` first, verifies, then installs the cloud head locally; KEEP RIGHT copies the cloud loser as `discarded` **by server-side copy plus verification, never a move** (P-3), places the device version in the store as `published`, then writes the head; KEEP BOTH and the auto rule publish store-first like any change. When the fleet setting is OFF (R9's `history_keep`, P-1) nothing new enters the store — no publish entries, no retains, no wizard losers — the suspect descriptor is still written (D-CLOUD-100), existing entries leave under C2/C3 only, and the done page says so.

Local transaction state stays under `/storage/.cache/cloud_sync/{pending,stage,manifests,runs}`, every item of which fails closed on loss: a lost pending record is recovered from the store's `record.json`; a lost stage is re-captured at the next exit; **`store_seq` lives in the own manifest** (additive, D-CLOUD-045 — P-5) whose cloud copy survives a cache clear and is already read on every pass, so a cleared cache costs one `.history/<unit>/` listing per unit at its first overwrite, never a bulk upload.

### R10 — outcomes

*Changed: 3/4 → 75/69 (D-CLOUD-074); `unverified-escrow` added.*

0 done · 1 failed (reasons: `duplicate-device-id`, `saves-root-missing`, `cloud-empty`, `unverified-retention`, `unverified-escrow`, …) · **75** lock held · **69** no route · 5 conflicts or questions queued · 6 held, deferred, or `suspect-unhealed`. Never rclone's own code. Result file `/storage/.cache/cloud_sync/runs/<run-id>.json` carries per-unit verdicts. The card renders 5, 6, 69 and 75 as SKIPPED, WAITING or DONE with a count, never FAILED: `SKIPPED - ANOTHER CLOUD SYNC IS RUNNING` · `SKIPPED - NO NETWORK CONNECTION` · `DONE - 3 WAITING FOR YOU` · `DONE - SOME SAVES ARE STILL ARRIVING` · `DONE - SOME SAVES WILL FINISH AT THE NEXT SYNC` (the deferred pair) · the D-CLOUD-100 recovery sentence for a heal.

### R11 — unattended passes: **unchanged.**

### Negative scope

*Changed lines only.* "no local retention of anything" → **no permanent local history; the stage's agreed version is transaction state.** "no preimages of one-way fetches (C1)" → **no redundant preimages: a local version about to be overwritten is copied into the store only when its `store_seq` is unknown or false.** "no protected-publication protocol" → **no coordination protocol in the cloud — no lock, lease or conditional write; publication is made recoverable, not serialised.** Unchanged: no undo control (D-CLOUD-033), no ancestry beyond `replaces` (the ancestry check reads `replaces`), no `resolves` receipts, no SQLite index, no generic merger, no slot cap, no daemon, no split-root import mode, no `--resync` anywhere unattended, no fetches on the exit path other than R5's one bounded suspect fetch.

### Replaced-mechanism inventory

Add two rows: `--backup-dir` to `-replaced/<stamp>` (cloud) → *store-first entries in `.history/`; the folder is folded by child B and removed when empty and the last old image is retired*; `--backup-dir` to `/storage/.cache/cloud_sync/replaced/<stamp>` (device) → *the same*. Rest unchanged.

### Acceptance

Venue for every item: the GENERIC_X64 pair against #133's self-hosted backends (WebDAV as the hashed default; SFTP as the hashless; S3/MinIO where ETag matters). Nothing on a person's device or cloud (D-QA-015).

- [ ] **A1** (unchanged) — neither HA nor HB overwritten anywhere by any writer in R1; one queued conflict. *(pair, WebDAV)*
- [ ] **A2** (unchanged). *(pair, WebDAV + SFTP)*
- [ ] **A3** (unchanged, plus) after CHANGE CLOUD FOLDER the first overwrite of each head lists `.history/<unit>/` once and retains the head when no complete entry exists. *(pair, WebDAV)*
- [ ] **A6b**, **A6**, **A7**, **A8** (unchanged), A6 reading "a launch attempted while an automatic pass holds `L_T` cancels it within two seconds and the card says so; while a manual sync holds it the launch is refused with the shipped message". *(pair, WebDAV)*
- [ ] **A9** (amended) — restoring a retired hash **from `.history/`** is a new publication not consumed by the old `retired` record; the rest unchanged. *(pair, WebDAV)*
- [ ] **A10** (amended) — idle exit spawns no rclone; a changed exit's spawns, round trips, bytes and seconds are recorded on WebDAV and SFTP and the admission ceiling is set from them; a correspondence failure leaves `uploaded-unverified` and advances nothing; a verification failure of the entry leaves `unverified-escrow`, publishes nothing for that unit and advances nothing. *(pair, WebDAV + SFTP)*
- [ ] **A11** (unchanged, plus) the cloned device writes nothing under `.history/` before it refuses. *(pair, WebDAV)*
- [ ] **A12**, **mass absence**, **silent run**, **every writer spawns `cloud_reconcile` and nothing else** (unchanged); mass absence additionally: a saves root holding only `.history/`, `README.md` and the manifests folder is judged empty. *(pair, WebDAV)*
- [ ] **Floor.** For every writer in R1, with a kill between every spawn: the head never changes without a complete entry of the new version present first, and no head version is deleted or overwritten without a complete entry of it present first — asserted by listing after each kill. *(pair, WebDAV + SFTP)*
- [ ] **Race.** A and B both read the head H0; A publishes HA; B publishes HB over it; A's next pass runs: HA is a complete entry before B's head write lands; with the ancestry check built the pair queues as divergent; without it HB installs and HA is restorable by #25's test reader. *(pair, WebDAV + SFTP)*
- [ ] **Pruner against an entry in flight.** A writes a complete entry and pauses before its head write; B runs a full pass under count and size pressure: HA survives, and B's log shows no attempt on any entry B does not own. *(pair, WebDAV)*
- [ ] **Two pruners.** Both devices prune concurrently over a seeded store holding different counts, a headless unexplained save, a headless `deleted` save, a headless `legacy` save, a newest `discarded`, and an in-flight upload: no protected entry is deleted; if any fixture deletes one, destructive cleanup is disabled for that class and the overrun is reported in the log. *(pair, WebDAV)*
- [ ] **Count scope.** Overwrite a manual slot, renumber, exit N+1 times with auto-state churn: the manual version and its PNG are restorable together from the second device; after a wizard decision on the same file, N further routine overwrites leave the `discarded` entry in place. *(pair, WebDAV)*
- [ ] **Decided deletion.** REMOVE EVERYWHERE, then a full pass with a trusted clock advanced 91 days: the `deleted` entry is gone; an unexplained headless save's newest entry is not. *(pair, WebDAV)*
- [ ] **Bytes.** Protected material seeded over 256 MiB: nothing protected is deleted; the overshoot is logged; the logged total equals the listing's total. *(pair, WebDAV)*
- [ ] **Cache clear.** Clear `/storage/.cache/`: the next full pass recovers every `store_seq` from the own manifest with no `.history/` listing; a legacy head's first overwrite lists once and retains once. *(guest, WebDAV)*
- [ ] **Heal.** A zero-length and a uniform save heal from the stage offline and the card reports only after the install; with the stage missing, one bounded fetch runs, a launch cancels it, and the next pass heals; both-suspect, no-good-copy and a suspect cloud head each queue a question and install nothing; a second erase after a heal queues a question; a #25-restored uniform version is not re-healed. *(guest + pair, WebDAV)*
- [ ] **Orphan quiescence.** Kill only the lock-owning parent before a local rename; start a launch; release the child: the child is gone before the first frame and the unit is complete. *(guest, WebDAV)*
- [ ] **Store shape.** A cloud loser's members and `record.json` exist in `.history/` with matching hashes **before** the head changes (KEEP RIGHT, by copy); a device loser likewise before the local file is replaced (KEEP LEFT); the winner is a complete `published` entry before it is the head; with the count at 3, a fourth entry for one save file removes the oldest unprotected one only after the newest is verified. *(pair, WebDAV)*
- [ ] **Delete-excluded.** `--delete-excluded` forced in `RCLONEOPTS`: the reconciler never passes it (process list). *(guest)*

**Preceded by** Gates 0, 11, 12, 1, 4 (cutover); 2 (store); 5 (deletion, absence); 6 (hold); E1–E7, E11, E13. Gate 7 (`-replaced/`) is moot for saves (P-7).

---

## #23 — amendments

*Changed: the two rows nest behind one verb-bearing row under SAVE MANAGEMENT and govern the whole store (D-UI-039, D-CLOUD-095); A4 is rewritten for store-first (D-CLOUD-095); the switch's dialog states its price (`repo/rules/time-to-play.md`).*

### Retention settings (replaces "Retention settings (D-CLOUD-032, D-CLOUD-036)")

Under `MANAGE CLOUD STORAGE > SAVE MANAGEMENT`, one row opens a page:

```
MANAGE EARLIER VERSIONS OF SAVES          ← label is the maintainer's word (P-11); this is the proposal
```

Inside, two rows and nothing else:

```
KEEP EARLIER VERSIONS OF SAVES            [ON]
ON EVERY HANDHELD THAT USES THIS CLOUD FOLDER

VERSIONS KEPT PER SAVE                    [3]      (1–9; dimmed while the switch is off)
```

Both rows show the **effective fleet value** — the value the last pass adopted (R9's `history_keep`, highest `rev`; ties ON and larger). An edit applies on this device at once and reaches the other devices at their next pass. The age and size caps are ours and are not rows (D-CLOUD-096, D-UI-039). This one setting covers discarded saves, replaced saves, deleted saves and suspect saves alike; the wizard has no separate switch.

**Confirmation dialogs** (where the row's explanation lives, D-UI-023):

- Turning OFF: *EARLIER VERSIONS OF YOUR SAVES WILL NO LONGER BE KEPT, ON EVERY HANDHELD THAT USES THIS CLOUD FOLDER. IF A SYNC REPLACES A SAVE BY MISTAKE, THERE WILL BE NO EARLIER VERSION TO PUT BACK. VERSIONS ALREADY KEPT STAY UNTIL THEY EXPIRE.* — TURN OFF · KEEP ON
- Turning ON: *KEEPING EARLIER VERSIONS ADDS ABOUT N SECONDS TO THE SYNC AFTER A GAME.* — N is filled from E12, never chosen; until E12 runs the string is not shipped.
- COMPLETE (unchanged sentence): *Discarded saves are kept in the cloud, 3 per save.*

### The done page — **unchanged** (footer *Discarded saves are kept in the cloud.* / *Discarded saves were not kept.*).

### The apply step (adds to "The walkthrough", after COMPLETE)

Every decision applies through the reconciler, store-first (#22 R9): KEEP LEFT places this device's loser in `.history/` as `discarded`, verified, then installs the cloud copy here; KEEP RIGHT copies the cloud loser into `.history/` as `discarded` (server-side, verified, never a move), places this device's version as `published`, then writes the head; KEEP BOTH and the auto rule publish store-first like any change; either answer to the absence question places the removed copy as `deleted` before the removal. Each discard's audit line is written before anything is replaced (D-CLOUD-027).

### Acceptance (changed and added items; the rest unchanged)

- [ ] **A4 (rewritten)** KEEP RIGHT on a cloud loser: the loser's members and `record.json` are complete in `.history/` with matching hashes **before** the cloud head changes, placed by copy — the loser's original path is never absent between the two; KEEP LEFT likewise for the device loser, by upload, before the local file is replaced; in both, the winner is a complete `published` entry before it is the head; KEEP BOTH retains nothing and installs state + PNG in the next free slot with a visible thumbnail. *(VM pair, WebDAV)*
- [ ] With the switch off, the same decisions apply, nothing new appears under `.history/` (no loser, no `published` entry), the suspect descriptor is still written for a suspect save, and the done page says `Discarded saves were not kept.` *(pair, WebDAV)*
- [ ] An absence in each direction is shown as the question; each answer's removed copy is a complete `deleted` entry before the removal. *(pair, WebDAV)*
- [ ] **Fleet setting.** Set 9 on A offline and OFF on B online, then connect A: after both have passed, both pages show the higher-`rev` edit; an equal-`rev` tie shows ON and the larger count; a stale manifest never raises the count. *(pair, WebDAV)*
- [ ] The switch's OFF dialog names what is given up; the ON dialog states the seconds E12 measured; neither row carries a third line. *(frames at 480×320 and 640×480 from `tools/vm-visual-qa`)*
- [ ] Every row this issue adds is two lines or fewer (D-UI-023), uses D-UI-022's names, appears in `strings` on the built binary, and `docs/es-menu-map.md` is updated in the same change (D-UI-039). *(build + `tools/vm-visual-qa`)*

**Does not build**: unchanged.

---

## #25 — amendments

*Changed: reads one store, `.history/`, and labels by `reason`; the `-replaced/` "labelled separately" clause and the `.snapshots` guard clause go (D-CLOUD-095 — the reason label is the separate label D-UI-022's residual asked for); a restore is a store-first publication (D-CLOUD-095, #22 R9).*

### Shape (replaces the current section)

- Home: the history view on MANAGE GAME SAVE RESTORES AND CONFLICTS (D-CLOUD-035), reusing the wizard's compare surface pointed at a game's earlier versions (D-CLOUD-033).
- Per game, newest first, from `record.json` alone: thumbnail (or glyph), the producing device, when it was kept, and **why**, as the label:

  | `reason` | Label |
  | --- | --- |
  | `published`, `replaced` (not head-equal) | REPLACED BY A SYNC |
  | `discarded` | YOU CHOSE THE OTHER |
  | `deleted` | DELETED |
  | `suspect` | SET ASIDE AS DAMAGED |
  | `legacy` | KEPT BY AN OLDER SYNC — the maintainer's word (P-11); this is the proposal |

- **Hidden:** entries whose version equals the current head. **Never offered:** an entry with `complete: false`, or a directory with no valid record. A `suspect` entry is offered as a version (its descriptor reconstructs it exactly) so a player who meant to erase can have the erased state back.
- Choosing one **stages and verifies** the entry's members before any live file is touched, then restores **through the reconciler as a new publication**: the copy it replaces is a complete entry first (the same ordering rule), the reconciler re-checks the chosen entry's presence at head-write time and, if it has been pruned meanwhile, **leaves the current save unchanged and says so** (D-CLOUD-077). A restore is a republication with a new `pub`; the old `retired` record does not consume it (A9). The restored version becomes the agreed version (so a restored uniform file is not re-healed).
- Requires the network; says so when there is none.

### Acceptance

- [ ] **A5 (extended)** A test-only reader answers "this game, newest first, thumbnail, producing device, why it was kept" from `.history/` alone — after a manifest overwrite, a renumber, an audit-log rotation, a clock set backward, all local pending records removed, **a cache clear on the reading device**, and **with the writing device's entries pruned under its own caps** — from a second device that never made the decision; the store survives an in-place update on a device with real prior state. *(VM pair, WebDAV + SFTP)*
- [ ] Restoring an earlier version places the replaced copy in `.history/` first and installs the chosen bytes byte-for-byte, PNG included. *(pair, WebDAV)*
- [ ] A head-equal entry is not shown; an incomplete entry and an orphan are not offered; a `legacy` entry carries its own label and never reads as a discarded save. *(pair, WebDAV)*
- [ ] Prune the chosen entry between the pick and the head write: the current save is unchanged and the page says the version is no longer there. *(pair, WebDAV)*
- [ ] The count bound is enforced as the store grows (the oldest unprotected entry goes only after the newest verifies); the newest `discarded` entry of a save survives N routine overwrites. *(pair, WebDAV)*
- [ ] With no network the page says so and offers nothing to press that would fail. *(guest, route removed)*

**Does not build** before its futro: nothing. The `.snapshots` clause is removed from this issue.

---

## #21 — additions (body not embedded in this corpus; stated as additions only)

- The capture stage keeps **the last agreed version of every save until a newer version is agreed** — D-CLOUD-078's one last-known-good applied to the stage; the heal (#22 R4) and the retain path read it.
- The capture walker distinguishes live saves from control metadata: it **never claims `.history/`, `README.md` or the manifests folder** as this device's saves, whether found locally after a download or in the cloud.
- [ ] Seed a device with a downloaded `.history/` and both READMEs; run `cloud_capture --full`: nothing under them enters the stage or the manifest. *(VM guest)*
- [ ] Agree a version, exit with a changed save, kill before agreement advances: the stage still holds the agreed version. *(VM guest)*

---

## #135 — additions

- The `time-to-play` cell runs **three arms** — no history, retain-old-head-then-publish, store-first — on WebDAV and SFTP, bandwidth-capped and not, and reports for each: the launch-path time, the exit-sync **latency distribution**, the exit-sync **completion rate** (the share of exit syncs that finish before a launch cancels them, D-CLOUD-076), and the startup-sync duration.
- [ ] The launch-path number under store-first equals the no-history baseline within noise. *(VM pair)*
- [ ] The exit-sync number for **one changed battery save on a hashed backend** is proposed as a register row (P-13) from the measurement, never chosen; once recorded, a run over it fails the suite. *(VM pair, WebDAV)*
- [ ] #134's store and #22's reconciler are checked against that row before #22 lands: no store operation on the launch path; the exit sync adds only the entry and its record. *(VM pair)*
- [ ] The ON dialog of KEEP EARLIER VERSIONS OF SAVES (#23) states the measured seconds. *(frames)*

---

## #<new child A of #134> Save history: the guard image — exclude `.history/` and the README before any writer exists [OPEN]

Ships **one image before** #22's cutover. It widens nothing (D-CLOUD-097 stands: a filter rule is not a widening of `-replaced/`). Purpose: no shipped writer, on any device that has taken this image, can restore `.history/` to a device, mirror it away with a `sync`, or delete it through `--delete-excluded`.

- `cloud_sync-rules.txt`: `- /.history/**` and `- /README.md` as the first two rules, ahead of every include; `- /savestates/.snapshots/**` is *not* added (it belonged to #22 R2 and is dropped there).
- `cloud_sync_helper`, once, with a log line each: strips `--delete-excluded` from `RCLONEOPTS`; adds the two guard lines to a user-**edited** copy of the shipped rules file; leaves a user-**named** filter file alone (D-CLOUD-088).
- The audit of the full `cloud_backup`, `cloud_restore`, the layout migrator and MATCH for `--delete-excluded` and `--backup-dir` targets is a task here, with its result recorded in the issue (the full scripts are not in this corpus).

Acceptance (GENERIC_X64 pair against WebDAV; nothing on a person's device or cloud):

- [ ] **E1.** Shipped image `af2db4ab09` against a seeded `Saves/README.md` + `.history/` with content-addressed members: copy backup, sync backup, restore, MATCH (as implemented) — nothing under `.history/` transferred, moved or deleted; the README not restored to the device. With a user filter that includes `+ /**`, the damage is recorded; after the guard image, the same runs touch nothing.
- [ ] **E2.** `--delete-excluded` forced in `RCLONEOPTS`, copy and sync modes, on the shipped image: the outcome recorded (whether `--backup-dir` caught the deletion); on the guard image: the helper has stripped it (log line present) and the store is untouched.
- [ ] **E15.** Upgrade a device with a user-edited rules file: the two lines are present and logged; upgrade one with a user-named filter file: the file is byte-identical and the rules file the helper adds is logged.

---

## #<new child B of #134> Save history: fold the set-aside folders into `.history/` — no earlier version lost, no question asked [OPEN]

**What devices hold today.** In the cloud, `<SAVES_REMOTE>-replaced/<stamp>/<path>`: written by rclone `--backup-dir` on every backup; a stamp holds each cloud copy a backup replaced **and, in sync mode, each one it removed**; stamps are `date +%Y_%m_%d-%H%M%S` in the device's local zone; every stamp but the newest is purged after a full run that completed, shared by every device using the folder. On the device, `/storage/.cache/cloud_sync/replaced/<stamp>/<path>`: written on every restore; because the manual RESTORE SAVES row passes no `--update`, this folder **can hold the only copy of a newer local save an older cloud copy replaced**. `Saves-discarded/` never shipped (D-CLOUD-042 location superseded by D-CLOUD-095); nothing to migrate.

**The rule.** A standing job on every full pass of the reconciler, from the cutover image onward, until both folders are empty and the last old image is retired. It runs on full passes only — never the exit sync, never the launch path. **No player is ever asked anything**; everything it does is logged, and the card reports nothing about it beyond the pass's outcome (a prompt about our internals is a failure mode).

**Per file, copy → verify → record → retire.**

1. **Hash** the source: on hashed backends, the backend hash mapped through the manifests (#22 R4); on hashless backends, fetch-to-hash within a per-pass budget — files beyond the budget wait for the next pass, untouched.
2. **Skip-and-retire** if a complete entry in `.history/` already holds that version for that path: confirm the entry is complete, then delete that one source file.
3. Otherwise **copy** it — server-side where E3 shows the backend can, else through the device — into `.history/<unit>/<seq>/<sha256>`.
4. **Record** (`record.json`, last): `reason: legacy`; `legacy_source` (the stamp path); `legacy_event: unknown` (a stamp cannot say replaced or removed); `producer: unknown`; `legacy_time: <stamp as written>`, zone unknown; `time_trusted: false`; `imported_at`, `imported_by`; `complete: false` unless the unit table says every member is present. A `legacy` entry ages from `imported_at` by the importer's clock, trust-gated — a hundred-day-old stamp is not deleted on arrival.
5. **Receipt**: an idempotent local record (source path + hash → destination `<seq>`); a lost receipt is re-derived from the listing's digests.
6. **Verify** the record; then **delete that one source file**, and only if its listing entry (size, hash) still matches what was imported — a late write from an old image is left for the next pass. A stamp directory is never purged; it is removed when empty.

**Path-aware repair.** A source found at `<stamp>/.history/<unit>/<seq>/<name>` is a store member an old image displaced: if the original entry's record exists and lists that hash, it goes back to its place; else it becomes a new `legacy` entry.

**The device folder**, per file: hash locally; if the head or a complete entry holds that version for that path, delete the local file; else upload it as `legacy` (`imported_by: <this device>`, producer unknown), verify, record, delete.

**The mixed-version boundary.** Release order: (i) the guard image (child A); (ii) the writer image (#22 R1); (iii) old images retired. Under the shipped allowlist as read, a content-addressed store member matches no include and falls through to `- /**`, so a device on `af2db4ab09` neither restores nor mirrors it away (E1 confirms). Two configurations remain exposed: a user-named filter whose includes reach `.history/`, and `--delete-excluded` with `BACKUPMETHOD=sync`. In those, two old-image sync-mode runs with no new-image pass between can let `prune_replaced_remote` delete a stamp holding displaced members before this fold repairs it. That residual is bounded by the fleet and is **for the maintainer to accept or reject (P-12)**, not accepted here.

**Retirement.** When both folders have been empty for one full pass on every device that has passed since the writer image, the empty roots are removed; the entry in #22's replaced-mechanism inventory is closed.

Acceptance (GENERIC_X64 pair against WebDAV and SFTP; nothing on a person's device or cloud):

- [ ] **E10.** Fixtures: partial multi-file stamps; sync-mode deletions; unique local-cache copies; duplicate basenames across systems; a stamp changing during import; hashless stamps over the per-pass budget; oversized imports. Interruption after every copy, record, receipt and removal: a second run is idempotent; no source file is removed without a verified complete entry of its version; every import carries `legacy`, `complete` set correctly, `time_trusted: false`, and is not aged out on arrival.
- [ ] A unique local-cache copy (a newer save an older cloud copy replaced) is a complete `legacy` entry in `.history/` before the local file is removed, and #25's test reader offers it from the second device.
- [ ] A displaced store member found under a stamp is back at its original `<seq>` when its record lists it, else a new `legacy` entry; the stamp is removed only when empty.
- [ ] A file that changes under an old image between hash and delete is left in place and imported on the next pass.
- [ ] No prompt, dialog or card line about the fold appears on either guest at any point (`tools/vm-visual-qa` frames across the whole fixture run).
- [ ] With both folders empty on both guests, the next full pass removes the empty roots and the log says so.

---

## Register rows the handoff proposed, resolved against the decisions already made

IDs are the maintainer's to assign. "Decided" means: cite and stop.

| Proposal | Status | Text |
| --- | --- | --- |
| **P-1** (refines D-CLOUD-032/036/096) | **Open — needs the maintainer's word.** D-CLOUD-032/036 make the setting the player's, on by default, 3 per save; neither says how it travels between devices or what OFF does to the store-first floor. | *The history setting is one value for every handheld using the cloud folder, carried in the manifests: the last explicit edit wins, ties resolve ON and the larger count. OFF stops every new entry — the entry a publish makes of its own version included — from the next pass on every device, purges nothing, and the switch's dialog says that a mistaken sync will then leave no earlier version to put back.* |
| **P-2** (refines D-CLOUD-096) | **Open — needs the maintainer's word** on two points: the protections' order, and the count range. D-CLOUD-036 decided 1–9 default 3; D-CLOUD-096 names "3 to 5" as starting points to measure against — both stand until the maintainer says which the rows carry. | *Protections before caps: P1 head-equal and own-pending; P2 the newest complete entry of an unexplained headless save (a decided deletion or a legacy import ages out normally); P3 the newest deliberate conflict loser; then count per save file (a state and its PNG one entry), age 90 days trust-gated, 256 MiB as a target over every stored byte with disclosed overshoot; pruning on full passes; a device deletes only its own entries. Count range and default: [1–9, default 3 per D-CLOUD-036 / 3–5 per D-CLOUD-096 — the maintainer's choice].* |
| **P-3** (refines D-CLOUD-041) | **Open — proposal.** D-CLOUD-036/041 say the cloud loser is a server-side *move*; a move opens the absence window D-CLOUD-037 turns into a question. | *The cloud loser is preserved by server-side copy plus verification, never a move; winner and loser both pass through the store before the head changes.* |
| **P-4** (refines D-CLOUD-042) | **Decided.** D-CLOUD-095 supersedes the location clause; the split-root refusal is D-CLOUD-040 and the second clause of D-CLOUD-042, untouched. Stop. | — |
| **P-5** (refines D-CLOUD-045) | **Principle decided** (D-CLOUD-045: additive fields, manifests are claims, the listing is the head). **Open only for the fields**, proposed under discretion with confirmation as the open half. | *Save manifest rev 3, additive: per entry `store_seq`; top level `history_keep {on, count, rev}`. `schema` stays 1; every field optional to a rev 1 reader.* |
| **P-6** (refines D-CLOUD-046 / #22 R5) | **Open — needs the maintainer's word.** D-CLOUD-046 says numbers come from Gate 4 (unchanged); it and R5 say no fetch on the exit path, which the suspect fallback narrows. | *The changed exit gains the store entry and its record and one upload of the changed bytes; the ceiling counts store bytes and defers entry and publish together; one bounded fetch of one suspect unit, when the stage lacks its good copy, is the only download on the exit path; spawn counts and the ceiling from Gate 4 and E12.* |
| **P-7** (refines D-CLOUD-047) | **Mostly decided** by D-CLOUD-095 (one home; `-replaced/` is no record; Gate 7 moot for saves). **Open for one line**, under discretion: | *A propagated deletion is a complete `deleted` entry before it acts; a compaction retains nothing.* |
| **P-8** (refines D-CLOUD-088) | **Open — proposal under discretion.** | *The player's filter controls which saves move; `.history/**`, `README.md` and the manifests are removed from every save list by the reconciler regardless of filter file; the helper strips `--delete-excluded` from `RCLONEOPTS` and adds the two guard lines to a user-edited copy of the shipped rules file, leaving a user-named filter file alone.* |
| **P-9** (refines D-CLOUD-093) | **Open — proposal under discretion.** | *The reconciler records its process group beside the lock; a launch, or a new run, that finds the lock owner dead kills and waits that group within D-CLOUD-076's two-second budget before proceeding.* |
| **P-10** (refines D-CLOUD-100) | **The heal is decided** (D-CLOUD-100). **Open**: the mechanics, and the wording. | *Heal from the capture stage at exit and from the cloud on a full pass, with one bounded fetch as the fallback; the suspect kept as an exact descriptor and shown as a version; the recovery reported after the install; the second occurrence of one save a question; both-suspect, no good copy, and a suspect cloud head questions. Wording: whether the sentence may read "looked empty" / "looked damaged" instead of "was damaged" for the heuristic case (D-CLOUD-077) — the maintainer's call.* |
| **P-11** (refines D-UI-022/039) | **The noun is decided** — D-CLOUD-095's own text says *earlier versions of saves*; *discarded saves* stays the wizard's word (D-UI-022). **Open**: two labels. | *The store's noun is "earlier versions"; the entering row's label [proposal: MANAGE EARLIER VERSIONS OF SAVES] and the label for an entry an older image set aside [proposal: KEPT BY AN OLDER SYNC] are the maintainer's words.* |
| **P-12** (a residual) | **Open — needs the maintainer's acceptance or rejection.** | *In a fleet where an old image runs with a user-named filter that reaches `.history/`, or `--delete-excluded` with `sync`, two old-image runs with no new-image pass between can lose displaced history members before the fold repairs them. Mitigations: the release order and the standing fold. Accepted / rejected: [ ].* |
| **P-13** (a budget row, #135) | **Decided in form** (D-CLOUD-098: budgets are register rows, numbers measured). **Open only for the number**, after E12. | *Exit sync, one changed battery save, hashed backend: N s (from E12); a run over it fails the suite.* |
| **Not reopened** | D-CLOUD-052 (transport), 095, 097 (a filter rule is not a widening), 099, 014 (store-first is its generalisation), 030 (identity), 033 (no undo control in the wizard), D-QA-015/017. | — |

---

## Document edits

1. **The public cloud-sync page** — add the layout table and the README text; remove any mention of `Saves-replaced/`.

   | Path (default folder) | What it is | Written by |
   | --- | --- | --- |
   | `/ROCKNIX/Saves/` | Your saves — game saves, save states, and screenshots — in the layout your handheld uses | Your handhelds, when they back up, restore or sync saves |
   | `/ROCKNIX/Saves/README.md` | A note saying what is in this folder | ROCKNIX, once the folder is checked |
   | `/ROCKNIX/Saves/savestates/.rocknix/` | Hidden. One small file per handheld describing the saves it knows about | Each handheld |
   | `/ROCKNIX/Saves/.history/` | Hidden. Earlier versions of your saves, one folder per version, each with a record of where it came from and why it was kept | Your handhelds; never by hand |
   | `/ROCKNIX/Saves/.history/README.md` | How that folder is laid out and what not to do in it | ROCKNIX |
   | `/ROCKNIX/Saves-replaced/` | Retired. Handhelds on an older ROCKNIX wrote it; a current handheld moves what it holds into `.history/` and removes it when empty | Older images only |

   **`Saves/README.md`** (written only after the saves folder is validated — D-CLOUD-085/091/092; V1 text, no menu restore promised — D-CLOUD-033/077):

   > **About this folder**
   >
   > This is the saves folder your ROCKNIX handhelds back up to and sync with: game saves, save states, and screenshots, in the same layout as on the handheld.
   >
   > Two hidden folders live inside it. Your handhelds write them; please leave them alone.
   >
   > `.history/` — earlier versions of your saves. When a sync replaces a save, when you choose one side of a conflict, when a save is deleted, or when a save looks damaged, the version that would otherwise be lost is kept here first. Each version has a `record.json` saying which game, which handheld, when, and why it was kept. The files are named by their contents, not by their game — the record is the map.
   >
   > `savestates/.rocknix/` — one small file per handheld describing the saves it knows about.
   >
   > How much is kept: 3 earlier versions of each save (you can choose 1 to 9 on the handheld), for up to 90 days, up to about 256 MB in all. The last copy of a game is never removed. These are targets; the folder may run over briefly between syncs.
   >
   > Putting an earlier version back: a menu for this is coming to the handheld under GAME SETTINGS > CLOUD SETTINGS. Until then the versions are kept, and nothing you do on the handheld removes them early. If you must recover one by hand, read `.history/README.md` first.

   **`Saves/.history/README.md`**:

   > **Earlier versions of your saves**
   >
   > Layout: `<game and kind>/<time-handheld-run-digests>/` holding one file per member of the version, named by its sha256, and `record.json` — which game, slot, handheld, time, and why it was kept. A folder with no `record.json` is unfinished and will be tidied by the handheld that started it.
   >
   > Why a version was kept (`reason` in `record.json`): `replaced` — a sync put a newer version in its place · `published` — a handheld kept this version here before making it current · `discarded` — you chose the other side when two handhelds disagreed · `deleted` — the save was deleted · `suspect` — the save looked damaged (empty, or one repeated byte) and the last good copy was put back · `legacy` — kept by an older ROCKNIX, before this folder existed.
   >
   > Do not rename, move or edit anything here. To recover a version by hand: copy the file named in `record.json` under `members[].path` back into the saves folder at that path, and know that the next sync will treat it as a change.

2. **`docs/es-menu-map.md`** — in the same change as the rows (D-UI-039): replace the "Pending here" note; add under `SAVE MANAGEMENT`:

   ```
       SM --> EV[MANAGE EARLIER VERSIONS OF SAVES]
       EV --> KEEP[KEEP EARLIER VERSIONS OF SAVES<br/><i>ON EVERY HANDHELD THAT USES THIS CLOUD FOLDER</i>] --> KEEPD[dialog: OFF names what is given up / ON states the measured seconds]
       EV --> CNT[VERSIONS KEPT PER SAVE<br/><i>1-9 · dimmed while off</i>]
   ```
   and under `CLOUD SETTINGS`: `CS --> MAN[MANAGE GAME SAVE RESTORES AND CONFLICTS<br/><i>N waiting · Nothing waiting</i>]` (#23; the history view of #25 lands on the same page). Update "As built on" to the image that ships them.

3. **`docs/save-manifest-schema.md`** — rev 3, additive: per entry `store_seq`; top level `history_keep {on, count, rev}`; `schema` stays 1 (P-5).

4. **`docs/conflict-wizard-ia.md` rev 5** — the apply step through the store (KEEP LEFT/RIGHT as #23 above); the second-occurrence and both-suspect questions on the absence surface (D-CLOUD-037's shape); the done-page footer unchanged; the settings page's two rows and dialogs.

5. **`.claude/rules/rclone-cloud-sync.md` § budget** — the exit-sync spawn counts (5–6 hashed, 6–7 hashless, pending Gate 4/E12); the one bounded suspect fetch as the only download on the exit path; no store operation on the launch path.

6. **`docs/decision-register.md`** — append the rows the maintainer assigns from P-1..P-13; mark D-CLOUD-094 (6) settled by this run.

7. **`docs/save-history-plan-delta.md`** and **`docs/save-history-gap-analysis.md`** — a top line: superseded by #134's body; kept as record.

8. **`docs/vm-qa-log.md`** — the two time-to-play numbers per image, from E12 onward (#135).

9. **`upgrade-and-install.md`** — a paragraph on the fold: read both folders, write `.history/`, retire per file, no prompt; the release order and P-12's residual. (The file is not in this corpus; the edit is stated, not drafted.)

10. **`cloud_sync-rules.txt`** header comment — why `- /.history/**` and `- /README.md` are first (child A).

---

## What still needs the maintainer's word

1. **P-1** — one fleet-wide setting, last edit wins; and whether OFF stops the publish entries too (the exit sync shortens; a mistaken sync then leaves no earlier version).
2. **P-2** — the protections' order as written; and which count range the rows carry: 1–9 default 3 (D-CLOUD-036) or 3–5 (D-CLOUD-096).
3. **P-3** — copy plus verification instead of D-CLOUD-041's server-side move for the cloud loser.
4. **P-6** — the exit path's one bounded fetch of a suspect unit, and the longer exit sync, as a refinement of D-CLOUD-046/R5.
5. **P-10** — whether the card may say "looked empty / looked damaged" rather than "was damaged" for the heuristic case.
6. **P-11** — the two labels: MANAGE EARLIER VERSIONS OF SAVES (the entering row) and KEPT BY AN OLDER SYNC (a `legacy` entry).
7. **P-12** — accept or reject the mixed-fleet residual.
8. **P-13** — the budget number, once E12 has run.
9. **P-5, P-7, P-8, P-9** — small refinements proposed under discretion; the maintainer's confirmation is the open half.
10. Whether the guard image (child A) and the fold (child B) are opened as children of #134 with the bodies above, and their numbers.

Everything else in this handoff is either decided (D-CLOUD-095..100, D-UI-039, D-QA-015/017 and the plan of record's rows) or is engineering under those decisions, with its evidence assigned to E1–E15 on the GENERIC_X64 pair.

---

## `corpus.provenance.json`

```json
{
  "artifact": "step5-handoff-as-tracker-text.md",
  "facilitator": "council-facilitator@1.2.0",
  "access_mode": "Embedded read-at-time source corpus only; no filesystem access; no file re-read, no hash recomputation, no experiment run by this member.",
  "source_manifest_named_by_prompt": "research/council-runs/2026-09-11-save-history-one-home/_prompts/step5-source-manifest.json",
  "hash_basis": "All values in source_file_hashes are the Facilitator's sha256 values verified at embed time; the arrays correspond by index.",
  "manifest_read_timestamps_utc": {
    "sources_1_to_17": "2026-09-11T19:31:42Z",
    "source_18": "2026-09-11T22:37:56Z"
  },
  "source_file_paths": [
    "research/council-runs/2026-09-11-save-history-one-home/_sources/00-problem-statement.md",
    "research/council-runs/2026-09-11-save-history-one-home/_sources/repo/docs/save-history-plan-delta.md",
    "research/council-runs/2026-09-11-save-history-one-home/_sources/repo/docs/save-history-gap-analysis.md",
    "research/council-runs/2026-09-11-save-history-one-home/_sources/repo/docs/decision-register-excerpt.md",
    "research/council-runs/2026-09-11-save-history-one-home/_sources/repo/docs/es-menu-map.md",
    "research/council-runs/2026-09-11-save-history-one-home/_sources/repo/rules/time-to-play.md",
    "research/council-runs/2026-09-11-save-history-one-home/_sources/repo/rules/es-native-ui-excerpt.md",
    "research/council-runs/2026-09-11-save-history-one-home/_sources/repo/code/cloud_backup-set-aside-excerpt.md",
    "research/council-runs/2026-09-11-save-history-one-home/_sources/repo/code/cloud_restore-set-aside-excerpt.md",
    "research/council-runs/2026-09-11-save-history-one-home/_sources/repo/code/cloud_sync-rules.txt",
    "research/council-runs/2026-09-11-save-history-one-home/_sources/issues/22.md",
    "research/council-runs/2026-09-11-save-history-one-home/_sources/issues/23.md",
    "research/council-runs/2026-09-11-save-history-one-home/_sources/issues/25.md",
    "research/council-runs/2026-09-11-save-history-one-home/_sources/issues/134.md",
    "research/council-runs/2026-09-11-save-history-one-home/_sources/issues/135.md",
    "research/council-runs/2026-09-11-save-history-one-home/_sources/issues/131.md",
    "research/council-runs/2026-09-11-save-history-one-home/_sources/issues/133.md",
    "research/council-runs/2026-09-11-save-history-one-home/revised_approaches/consensus_plan.md"
  ],
  "source_file_hashes": [
    "f7d770768b3bf81985b7415b4d82f8ee9ef26965a98eb6c47c166f54db673b27",
    "1d320545319eba2e8852d830d52f76ab3a417e48e365d01fe79231bade77da8b",
    "d1107b7e1790b8e8aab177411b96bb3828f69e389fbc8e33c36ce616f67105aa",
    "46ccfb71ef85537639501c2973a5b02fd81b6d5772662608ead073b209ea2726",
    "6d7813f91e37510f5578f35adec3f9372ed34e1ce5d871fcc0f34e392b202911",
    "97d2fbba79fa42f22def37e4ff90e18149fc9fbc216d255d091da3dc187075da",
    "32be1ee4164c9d1f09e7a9e9c8c25f526e70802f75901e456097bdb5c02d46e4",
    "e5b57d74b83046fc7ebf44b4129c68815a575b35553e938c2ae377c685852509",
    "c0dacd8aa1eb1a4df2986447a853cc3c47b666b6234127e61783a151faa448bd",
    "bdb7e18128ce4a604c9b02cfe5b0f10f4e3e4dfd3aa7e2d69ea018b8c9d5484d",
    "b05b7095a31dd11f63cc342129fd3b765a19b9ba4b4a91b4b9aa1877c7658b27",
    "1ca065c449e0b3695f1ab4e9573ad5bd4a92b21ae23c869bba8730fcefdebfc1",
    "14a3cee5592021447395db3e59dfaf27ec09de77f1fb85fe5c10cfde9da28d1b",
    "d7ffb5a4648964d458b18a4a5427b1bb5d8fd356bb31fd06182d2d08c33a2071",
    "3998a6e46d8cdd903deb97b2da23afb78ad1b237061328f4402291c03e0ff137",
    "b8034bb7ab57d7ffb7d5aa4cf16d0974f0bf8d731c983e864081296fa6ccc17c",
    "4f58af89b8a262bb1c7615b7bdfea3389cb655d3c607474fe6aca8c6d084f9f2",
    "1697a8ebe210e20c8a86027249906025d47f22e05ef8beab3566c40bb110fd4c"
  ],
  "injected_without_declared_path_or_hash": {
    "handoff": "The orchestrator brief's 'Step 5 handoff content' (§4.1–4.8), which reproduces the embedded consensus_plan.md's §4; no separate path or hash was supplied for the brief itself and none has been fabricated."
  },
  "corpus_gaps_surfaced_to_orchestrator": [
    "issues/21.md is not embedded: the #21 additions above are stated as additions only, not as replacement text against a current body (G1).",
    "The complete cloud_backup, cloud_restore, cloud_sync_helper, layout migrator, MATCH THIS DEVICE TO THE CLOUD and FileData::launchGame are not embedded: child A's audit task, R1's MATCH direction and R6's launch-time check are written as tasks for the implementer to verify in the live files (G2).",
    "docs/save-manifest-schema.md is not embedded: the rev 3 fields are stated additively without sight of pub/replaces (G3).",
    "docs/conflict-wizard-ia.md is not embedded: the rev 5 edits are named, not drafted (G4).",
    "upgrade-and-install.md and engineering-practices.md are quoted by the commission but not embedded: the fold's no-prompt rule is applied as quoted; the paragraph for upgrade-and-install.md is named, not drafted (G5).",
    "No measurement of any retention operation, backend capability or first-frame time exists in the corpus: every second and spawn count above is an estimate until E3/E12 run; the ON dialog's number and P-13 are left blank by design (G6).",
    "The revised plans and closing assessments the consensus plan cites (gpt-, kimi-, gemini-, mistral-revised_plan.md; the *_vote.md files; claude-revised_plan.md) were not embedded in this step; their content is taken only as consensus_plan.md reproduces it, and none is cited above as evidence."
  ],
  "activity_statement": "No code was written or run, no file was written, no test was performed, and no handheld or cloud account was accessed. Issue numbers for the two new children are not assigned here; labels and register wording marked as proposals await the maintainer's word."
}
```