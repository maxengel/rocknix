# Council step 1 — the save-history delta, judged

*Seat: Claude. All paths below are under `research/council-runs/2026-09-11-save-history-one-home/_sources/`; I cite them relative to that root. Every sha256 is the one the Facilitator embedded; I did not re-read or re-hash anything. Where a claim rests on the corpus I name the path or the register ID; where it rests on my knowledge of rclone or on estimate, I say "my recollection", "I infer" or "estimate". The provenance list is the appendix.*

## Where I land, in one paragraph

The delta is architecturally right and its cost is honest, but it is not yet crisp in three places that will bite when #22 is built. First, the **count bound is keyed to the wrong thing**: #22 R4 defines a unit as a *hash set* ("*L* = this device's hash set for the unit"), so every save state of a game is one unit, and a per-unit count of 3 lets the auto-state — which D-CLOUD-099 puts in the store and which is rewritten on every exit — evict the manual slot's earlier version within three sessions. That is the exact case the maintainer named as the one that matters. The bound must be per save *file*. Second, **D-CLOUD-100's heal cannot happen where the damage is found**: R5 forbids fetches on the exit path, so "restore the cloud's good copy" at exit is impossible under the plan of record, and the player who relaunches will start from a torn save and, at the next exit, publish a fresh game over their good one. The heal must come from the local capture stage first (D-CLOUD-078 says it holds content-addressed copies), the cloud second. Third, **the allowlist rule is the only thing standing between the store and every writer that predates R1**, and the shipped rules (`repo/code/cloud_sync-rules.txt`) restore `.history/**/*.srm` to a device today; that rule must ship before the store exists. Beyond those, I would drop the 90-day age cap (there is no trustworthy clock anywhere in the store), unify the wizard's cloud-loser move with the everyday retain into one copy primitive, and record two register rows the delta contradicts without naming (D-CLOUD-042, D-CLOUD-047). No simpler *architecture* exists under the maintainer's constraints; the simplifications are inside the delta, not instead of it.

---

## 1. Does the delta weaken any property the plan of record relies on?

### 1.1 The verdict table

| Delta row (`repo/docs/save-history-plan-delta.md`) | Verdict | The load-bearing point |
| --- | --- | --- |
| Store at `<SAVES_REMOTE>/.history/<unit>/<seq>/`; `record.json` gains `reason`; READMEs at `Saves/` and inside `.history/` | **Endorse, amend** | `record.json` must be the commit marker, written last (D-CLOUD-078 (2)); the seq name should carry the reason so the pruner needs no record fetch; the outer README must also declare `savestates/.rocknix/` (D-CLOUD-031) — "hidden but declared" has to cover all of our folders, not one; the README must not promise a menu restore before #25 ships (D-CLOUD-077: no lying). |
| Retain-before-publish on every publish that overwrites a cloud copy: `copyto` the head into the store with a record, then publish | **Endorse, amend** | Make it the *only* retain primitive — the wizard's cloud loser (KEEP RIGHT, D-CLOUD-041) is today a server-side *move*; a move opens a window where the path is absent and another device asks an unexplained-absence question (D-CLOUD-037). Copy has no such window. Take the record's `sha256` from the retained copy, not from the pre-listing; a mismatch means the head moved and the publish must not proceed. This turns the retain into a cheap compare-and-swap that R5 lacks. |
| `--backup-dir` retired when the reconciler is the only writer (R1); no interim (D-CLOUD-097) | **Endorse, amend** | Name MATCH THIS DEVICE TO THE CLOUD (the only action that deletes, `repo/docs/es-menu-map.md`): its deletions go to `.history/` with `reason: deleted` by copy-then-delete over an explicit list, because `--backup-dir` cannot point inside its destination (D-CLOUD-014, verified against a real remote). The settings archive's own `--backup-dir` (`repo/code/cloud_backup-set-aside-excerpt.md`: "the same reasoning already applies to SETTINGS_REMOTE") is *not* retired — R1 leaves the settings phases untouched. Gate 7 (reliability of `copy --backup-dir`) becomes moot. |
| Allowlist: `- /.history/**` ahead of every include; `.snapshots` rule dropped | **Endorse, amend** | Add `- /README.md` explicitly rather than relying on the trailing `- /**`. Ship the rule in the image *before* the one that lands #22 (see §2.3 — this is not the interim D-CLOUD-097 forbids). The reconciler's "empty cloud" test (R4 mass absence) must use the *filtered* listing, or a cloud wiped of saves but still holding `.history/` reads as non-empty and produces a hundred questions instead of one refusal. Store operations (retain, record, verify, prune, the #25 reader) run *without* the allowlist, or the rule excludes their own paths; R2 needs that sentence. |
| Settings: KEEP EARLIER VERSIONS OF SAVES · VERSIONS KEPT PER SAVE nest behind one row under SAVE MANAGEMENT; age and total caps are ours (D-UI-039, D-CLOUD-096) | **Endorse, amend** | The nesting row needs a verb (`repo/rules/es-native-ui-excerpt.md`: "a row that opens a page with more than one action is a submenu whose label carries the verb"). "Per save" must mean per save file (§1.2). Turning the switch OFF trades safety for speed, so its confirmation dialog states the price (`repo/rules/time-to-play.md`). |
| #25 reads one store; `reason` is the label | **Endorse** | Label wording is #25's; two notes in §1.7. |
| Classifier gains `suspect`; auto-heal (D-CLOUD-100) | **Endorse the verdict, replace the mechanics** | R5: "No fetches ... on this path." The heal's bytes must come from the local stage when it holds the agreed hash; a pending, unhealed suspect must make the unit *divergent* at the next exit, not "this device changed". The test should run on the cloud side too (a zero-length head from another device is detectable from the listing's size). |
| Save states, auto-states included, bounded by the per-save count (D-CLOUD-099) | **Endorse, amend the bound** | Per save *file*, not per unit (§1.2). Screenshots (`+ /screenshots/**`) are never overwritten and are not saves; state that they are not retained. |
| Bounds: 3–5 per save · 90 days · 256 MiB · never a game's only copy (D-CLOUD-096) | **Endorse count and size, replace age** | Count: default 3, range 1–9 (D-CLOUD-036), per file. Size: a sweep on a full pass only, at most daily, cancellable. Age: **drop**, or gate on a trusted clock — reopens the age clause of D-CLOUD-096 (§1.6). "Never the only copy" needs a definition (§1.6). |
| Public docs show the layout and the README text | **Endorse** | — |

### 1.2 The bound is keyed to the unit; it must be keyed to the file

This is the finding I would most like the other seats to check. #22 R4 defines the classifier's input as "*L* = this device's hash set for the unit" and R9 says "unit = game + kind"; D-CLOUD-030 says slot number is an attribute, not identity, because ES renumbers by moving files. Put together, a game's save states are one unit with a set of hashes, one per slot. That is a sound choice for the classifier. It is the wrong key for the *store's count bound*: `.state.auto` is rewritten on every exit of a RetroArch game (`repo/docs/save-history-gap-analysis.md` §2.3), so with D-CLOUD-099 in force every exit sync retains a new auto-state entry under the game's state unit, and at count 3 the manual slot's earlier version is gone after three sessions. That manual-slot overwrite is the case the maintainer called "the moment where someone accidentally quits and then finds they have no way to recover" (D-CLOUD-099).

The fix costs no rule: the count is applied per (unit, member path) — per save file — which is also what "VERSIONS KEPT PER SAVE" says to a player. A game with a battery save, an auto-state and two manual slots at count 3 then holds up to twelve entries; the 256 MiB total bounds the aggregate. I infer from R4's wording; if the unit table in #21 already keys states per slot, this amendment is a no-op and should be stated as such.

### 1.3 Retain-before-publish is the right mechanism, and it strengthens R5 if the hash is taken from the copy

The delta says the reconciler will `copyto` the cloud's current version into the store and then publish. Two amendments make this load-bearing rather than incidental.

**One primitive.** R9 keeps a server-side *move* for the wizard's cloud loser and D-CLOUD-041 confirms it. A move leaves the save's path absent between the move and the upload of the winner; a second device listing in that window sees "absent on one side, A on record, no `retired`" and queues an unexplained-absence question (R4, D-CLOUD-037) — a question about our internals, which the commission calls a failure. A copy leaves the old, good bytes at the path until the winner lands; at every interruption point the head holds a complete version. The cost of copy over move is nil on backends with server-side copy and a few hundred kilobytes through the handheld on those without (§2.6). So: every retention — discarded, replaced, deleted, suspect — is *copy head into the store, write record, verify*, and the wizard's device loser is *upload into the store, write record, verify*. Two shapes of input, one store write path, one kill matrix.

**Hash from the copy.** R5 requires "fresh head evidence per unit before any write", but the listing and the write are not atomic; two devices that both saw head H0 can both publish. Today the second publish silently overwrites the first, and only the correspondence check (R5) catches it afterwards as `uploaded-unverified`. If the record's `sha256` is read from the retained copy after it lands (an `lsjson --hash` the delta already needs to verify the entry) and compared to the agreed hash *A*, a head that moved between the listing and the copy is caught *before* the publish, and the unit is re-classified divergent. On hashless backends the comparison is size-only, which is the same standard D-CLOUD-046 already accepts for the head. Nothing new is spawned; the verification the delta requires anyway does the work.

**Records and members.** `record.json` is written after the members are verified and is the commit marker; an entry without one is incomplete and is swept only after a grace window (§2.4). R9's `discarded_by: "wizard"` should give way to the `reason` field; and the seq — `<decided_at UTC compact>-<device id>` — should also carry the reason (`...-replaced`) so the pruner can apply "never the only copy" from one listing.

### 1.4 D-CLOUD-100: the verdict is right; the heal cannot run where the delta puts it

D-CLOUD-100 says the cloud's good copy "is kept and restored" and that the class lives in R4. Follow the timeline. A save is truncated by power loss; the device did not exit cleanly; the boot `cloud_capture --full` (D-CLOUD-072) is the first reader. Or a crash mid-write followed by an exit; exit capture (#21) is the first reader. In both cases the classifier's verdict `suspect` is correct and cheap. But the *restore*: at exit, R5 says "It is to-the-cloud only ... No fetches", so the cloud's copy cannot be fetched at exit without reopening R5. The heal defers to the next full pass — boot or a manual sync — and D-CLOUD-076 says a launch cancels an automatic sync in any phase. So the pick-up-and-play sequence is: exit with a torn save → relaunch (the boot sync is cancelled or never ran) → the game finds a torn save, treats it as no save, writes a fresh one → exit → the classifier sees a real, non-suspect save that differs from the cloud, with agreement equal to the cloud → "this device changed" → publish. Retain-before-publish saves the good copy into `.history/` — so nothing is *lost* — but the player has a blank game, was told once that a recovery happened, and is told nothing about the second event. D-CLOUD-077 calls that stranding.

Two amendments, neither reopening D-CLOUD-100 or R5:

- **Heal from the stage.** D-CLOUD-078 lists "the capture stage (content-addressed copies of every save the manifest claims)" as a place where last-known-good already holds. If the stage retains the *agreed* version until the classifier has run — a requirement for #21 I cannot verify from the corpus and therefore state as one — the heal is a local copy at capture time, before any network, and the relaunch finds the good save. The cloud remains the authority on *which* version is good (its head equals *A*); the bytes come from the nearest verified copy. The suspect bytes go to the store with `reason: suspect` at the exit push (a zero-length or all-one-byte file is trivial to upload).
- **Sticky suspect.** When the stage lacks the agreed version, a local pending-heal record makes the unit *divergent* at the next exit rather than "this device changed": the wizard then asks a real question (this device's fresh game against the cloud's save), not one about internals, and the full pass fetches the good copy first. If a launch of *that game* is attempted with a heal pending and the network present, gating that one launch on one small fetch with a card is bounded and visible (D-CLOUD-038, D-CLOUD-098) and cheaper than the alternative; I would take it, but the sticky-divergent rule is the safety net either way.

Two smaller points. First, the check should be symmetric: a *cloud* head that is zero-length where *A* was not is detectable from the listing's size at no cost and should not be fetched over a good local copy; treat it as the cloud damaged, keep local, retain the suspect head with `reason: suspect`, republish. Second, a wording residual: a player who erases their save in-game can produce an all-0x00 or all-0xFF file deliberately. The heal will undo it and say the save "was damaged", which is not true. I would soften the once-message to "was empty when the game closed" and add "if you meant to erase it, erase it again", and label the store entry "SET ASIDE - EMPTY" rather than "AS DAMAGED". The residual is small and the store keeps the erased version too, so nothing is lost.

### 1.5 `.history/` inside the saves folder against rclone and against every other writer

Three separate rclone facts bear on this row; the delta names one.

- `--backup-dir` may not overlap its destination — corpus evidence (D-CLOUD-014, the comment in `repo/code/cloud_backup-set-aside-excerpt.md`). The delta is right that the store cannot be written by `--backup-dir` and that MATCH's deletions therefore need copy-then-delete.
- **The retain step's own source/destination overlap.** If the retain is issued as `copy` from `remote:Saves/` with `--files-from` into `remote:Saves/.history/<unit>/<seq>/`, the destination is inside the source. My recollection of rclone is that `sync` and `move` refuse overlapping remotes unless the destination is excluded by a filter ("try excluding the destination with a filter rule"), and that `copy` does not check. Either way the allowlist rule `- /.history/**` on that invocation is what makes it safe, and a per-file `copyto` with explicit paths avoids the question entirely at the price of one spawn per member. One command on the VM against the QA WebDAV backend settles it for rclone v1.75.0 (D-CLOUD-052 names the version).
- **`sync` and excluded destination files.** My recollection is that rclone's `sync` does not delete destination files the active filter excludes. So a filter carrying `- /.history/**` and `- /README.md` protects the store and the README from a mirror. The shipped rules file does *not* carry them (`repo/code/cloud_sync-rules.txt`: the first include is `+ /savefiles/**`, then `+ /**/*.srm`, `+ /**/*.state*`, and so on), so a device on today's image restores `.history/<unit>/<seq>/Zelda.srm` to `<SAVESPATH>/.history/...` on its next RESTORE (the members match `+ /**/*.srm`; `record.json` and PNGs do not), pushes them back on its next backup, and in `sync` mode deletes every store entry it does not hold into `-replaced/<stamp>/`, pruned to one run by `prune_replaced_remote` after the next full run (`repo/code/cloud_backup-set-aside-excerpt.md`). That is earlier-version loss, in a mixed fleet, in `sync` mode.

R1 closes this once every device is on the #22 image. Until then the store is safe only where the exclusion rule already is. So the rule should ship in the *next* image, ahead of #22, as a guard with no writer — exactly the pattern R2 already uses for `.snapshots` and #25 describes ("stays as a guard with no writer"). This is not the interim D-CLOUD-097 forbids: nothing about `Saves-replaced` widens; a rule is added to a file the helper already migrates (D-CLOUD-079 names `cloud_sync-rules.txt.bak`). The maintainer has two devices (D-UI-022: "I haven't even set up cloud saves on my second device"), so the belt costs one image and the braces are a release note: upgrade both before the next sync.

Adjacent, and not the delta's fault: `savestates/.rocknix/manifest-<id>.json` (D-CLOUD-031) sits under `+ /savestates/**` and *is* restored by today's `cloud_restore`. The plan already has one hidden folder inside `Saves` that must sync and now adds one that must not. The outer README should name both; the allowlist must treat them oppositely; and the D-UI-022 principle "hidden from casual browsing, never a secret" (D-CLOUD-095) is served by one declaration covering everything of ours.

### 1.6 The three bounds

**Count.** Default 3, selectable 1–9 (D-CLOUD-036), per save file (§1.2). Three is one step back plus two (D-CLOUD-032: "they likely aren't going to be going 8 steps back"). Pruning to the count happens at retain time from the one `.history/<unit>/` listing the dedup already needs, never on the exit path if that listing is not otherwise there — in which case it happens at the next full pass and the store overshoots by one entry per save meanwhile, which is harmless.

**Size.** 256 MiB is roughly 2,500 entries at D-CLOUD-036's sizes (a state 28–51 KB plus a 48 KB PNG; a battery save 8–128 KB); PPSSPP directories are the census gate's to measure. Enforcing it needs a recursive listing of `.history/` with sizes. On Dropbox and S3 that is one call; on WebDAV, SFTP and SMB it is one round trip per directory — for 500 units × 4 entries, some 2,500 round trips (§2.6). So the size sweep runs only on a full pass, no more than once a day (a local stamp), after the pass's transfers, and is cancellable by a launch. Oldest first, never the newest entry of any save file.

**Age.** I would drop it, reopening the age clause of D-CLOUD-096, on two grounds. First, it protects nothing the other two bounds do not: the count bound keeps depth shallow per save and the size bound keeps the aggregate in check; an old entry that survives both is one the player might still want (a game not played in four months has only old history). Second, there is no clock to enforce it against. The seq stamp is the retaining device's clock; #23 already carries `clock_synced: false` in its metadata because handheld clocks are not trusted; and — my recollection — rclone sets the destination's modification time from the source on every copy, so a retained member's ModTime in a listing is the *save's* mtime and `record.json`'s is the device's clock again. A device whose clock reads 2031 would sweep every entry as expired; one reading 1990 would write entries every other device evicts first. D-CLOUD-096 called its numbers "starting points ... as defaults to measure against", and D-CLOUD-034 prefers the form that removes a rule. If the maintainer wants a stated time horizon regardless, the sweep must run only when the sweeping device's clock is trusted and must never touch the newest entry of a save file; the residual — a bad-clock writer's older entries mis-ordered — stands either way and is small.

**Never the only copy.** Define it: the count and size caps never evict the newest entry of a save file whose unit has no live member in the cloud head. A game the player removed everywhere (`reason: deleted`) therefore keeps its last version indefinitely, a hundred kilobytes each; that is the trash can the reason implies, and it is bounded by the player's own deletions. It needs the head listing, which the full pass has.

### 1.7 Settings, vocabulary and the reader

D-UI-039 and the menu map (`repo/docs/es-menu-map.md`: "Pending here: #134's history store settings (nested under SAVE MANAGEMENT ...)") settle the nesting. Three details: the nesting row wants a verb per `repo/rules/es-native-ui-excerpt.md` (KEEP EARLIER VERSIONS OF SAVES as the row that opens the page, with KEEP THEM / KEPT PER SAVE inside, is one shape that satisfies both D-UI-023 and the verb rule); the confirmation dialog on turning the switch OFF says the price ("Earlier versions will not be kept; a save replaced by a sync or a game cannot be brought back"), because `repo/rules/time-to-play.md` requires a speed-for-safety trade to name itself; and — optional, but it answers D-CLOUD-096's "secretly ballooning" worry on screen — a read-only line at the top of the page, USING 12 MB OF 256 MB, from the last full pass's cached total (the menu map's "read-only facts come before editable settings"), never a live listing.

D-UI-022 fixes *discarded saves* as the wizard's kept losers and says "*discard* means nothing else". The delta keeps `reason: discarded` for exactly those and introduces *earlier versions* for the store. That is an extension of D-UI-022, not a reopening; its residual ("#25 labels those separately") is discharged by `reason`. Two label notes for #25: "REPLACED BY A SYNC" is accurate when the exit sync did it, but a manual BACK UP SAVES TO THE CLOUD is not "sync" in D-UI-022's reserved sense; the record carries the deciding device, and "REPLACED FROM RG35XX SP · 11 SEP" tells a two-device player what they need. "YOU CHOSE THE OTHER" is right for one player and wrong across a household; "CHOSEN ON <device>" is exact.

### 1.8 Rows the delta must reopen or supersede by ID, whether or not it changes them

- **D-CLOUD-042** fixes the folder name `Saves-discarded` beside the saves folder. D-CLOUD-095 replaces the two siblings by mechanism but does not cite D-CLOUD-042. The register is append-only; a superseding row is needed or the two stand in contradiction.
- **D-CLOUD-047** says "Propagated deletions and compactions are not retained as discarded saves; where `copy --backup-dir` proves reliable (Gate 7), the cloud's `-replaced/` sibling is their record and #25 labels them apart." The delta's `reason: deleted` retains deletions and retires `-replaced/`; the delta's "what does not change" list names D-CLOUD-047 as unchanged. It changes. Compactions (D-CLOUD-030: the same hash in two places is one version) still retain nothing — no bytes are lost — and the row should say so.
- **D-CLOUD-014**'s principle stands; its mechanism clause ("a chosen `sync` archives into a dated sibling") is superseded for saves by copy-then-delete into `.history/`, and the sibling continues for settings.
- **D-CLOUD-036**: location clause superseded by D-CLOUD-095; ordering and count clauses stand.
- **#22 R4's deletion row** ("the cloud copy goes to the `-replaced/` sibling if Gate 7 confirms") and **Gate 7** itself: replaced by the retain step; Gate 7 retired.
- **D-CLOUD-096**, age clause: reopened here (§1.6).

Nothing else in D-CLOUD-030..053 is weakened. R1 is *relied upon* more heavily than before — the store is only safe when no non-reconciler writer can mirror or restore it — which is why the allowlist rule leads the image.

---

## 2. Failure modes and ordering hazards, with the cheapest experiment for each

### 2.1 Interruption at each point of retain-before-publish

Take the sequence the delta implies, with my amendments: (1) list head; (2) copy head into `.history/<unit>/<seq>/`; (3) write `record.json`; (4) verify the entry; (5) publish; (6) verify the head; (7) advance agreement. Power loss, link loss (bounded by D-CLOUD-075's timeouts, exit 69) and SIGKILL — including D-CLOUD-076's SIGTERM-then-SIGKILL when a launch cancels the exit sync — collapse to "the process stops at point *n*":

| Stopped | Cloud head | Store | Recovery |
| --- | --- | --- | --- |
| before (2) | old, good | untouched | next pass reclassifies; nothing to do |
| during (2) | old, good | on atomic backends (Dropbox, S3: my recollection) the copy landed or did not; on streaming backends (SFTP, SMB, local) a `<name>.<8 hex>.partial` may remain — the shape `sweep_partials` in `repo/code/cloud_restore-set-aside-excerpt.md` already removes locally | incomplete entry (no record) → swept after grace |
| after (2), before (3) | old, good | members without record | as above; the next pass retains again, producing a second entry with the same hash → dedup at prune |
| after (3), before (5) | old, good | complete entry whose hash equals the head | R2: "an interrupted push is completed from `pending-publish.json`"; if that file is lost, R9 recovers from the store's record (it names the winner's hash); the retain is *not* repeated when the newest complete entry's hash equals the head |
| during (5) | old **or** new (rclone's per-file rename, D-CLOUD-077) | complete | next pass sees either L = C (identical, seed) or L ≠ C = A (push again, no new retain) |
| after (5), before (7) | new | complete | L = C → identical |

The property that makes this safe is that no step deletes anything and the head always holds a complete version; the only garbage is an incomplete or duplicate store entry, and both are cheap to sweep. What would break it: writing `record.json` first, or moving instead of copying, or pruning on the exit path.

*Experiment.* D-CLOUD-051 says `tools/cloud-round-trip` already carries a "retention-ordering kill" fixture and an `APPLY` constant. Extend it to SIGKILL the reconciler at each of the seven points against the QA WebDAV (streaming, hashed), SFTP (streaming, hashless) and MinIO (atomic, ETag) backends, and assert after each: the head is byte-identical to the old or the new version; at most one complete entry per save file carries the head's hash; a restart with the pending record removed completes the publish; no entry lacks a record after the grace sweep. Every one of these runs on the GENERIC_X64 pair (D-QA-007).

### 2.2 Two devices publishing to the store at once

The seq carries the device id (R9), so two devices never write the same entry. The races that remain:

- **Both retain H0, both publish.** Covered in §1.3: with the hash taken from the copy, the second device sees the head no longer equals *A* and does not publish; without it, the plan of record's `uploaded-unverified` path catches it after the fact and the next pass shows a real conflict. Either way no version is lost; the amended form is strictly better.
- **Duplicate entries.** Two devices retaining the same head produce two entries with one hash; they consume two of the count. Dedup by hash at prune time (the newest entry with a given hash is kept) applies D-CLOUD-030's principle to the store and costs nothing on the exit path.
- **One device prunes while another writes.** The pruner deletes oldest-first and never the newest, so a concurrent new entry — which sorts newest — is never its target. The one exposure is the incomplete-entry sweep: device A sees B's members without a record and treats them as garbage before B writes the record. A grace window keyed to the seq stamp (a day is generous; clocks are untrusted, so make it generous) closes it. Two devices pruning the same unit delete the same oldest entry; the second delete returns not-found and is treated as success.
- **Dropbox serialises writes per folder** (D-CLOUD-083). Each retain creates its own `<seq>/` folder, so two devices never contend on a folder except at `<unit>/` creation; rclone's ten low-level retries (D-CLOUD-083 put them back) cover that. The design should keep it so: never write two devices' entries into one folder.

*Experiment.* The VM pair against MinIO and WebDAV: seed agreement H0 on both, change both offline, trigger both exit pushes within 100 ms; assert the head is HA or HB, the other survives on its device, the next full pass on that device classifies divergent, and the store holds H0 once after a prune. Repeat with guest A in a full pass pruning while guest B retains; assert B's entry survives.

### 2.3 The README and the store inside a folder the allowlist governs

- **Restore direction.** With `- /.history/**` and `- /README.md` ahead of every include, neither reaches a device. Without them, today's rules restore the members (§1.5). The reconciler must also *ignore* a `<SAVESPATH>/.history/` it finds locally — never read it, never push it — and log its presence once, so a device that pulled one under the old rules is not confused after upgrade. I would not delete it automatically; it is harmless and small.
- **Mirror direction.** The reconciler never runs `rclone sync` (D-CLOUD-052: `copy --files-from` per direction; MATCH is an explicit list), so after R1 the mirror hazard exists only for old-image devices, and only in `sync` mode. Before R1 it is real (§1.5).
- **Emptiness.** R4 refuses the whole pass when the cloud listing is empty with agreement on record. A cloud whose saves were wiped by hand on a PC but whose `.history/` and README survive is *not* empty to an unfiltered listing, and every unit becomes an unexplained-absence question — the hundred-question case D-CLOUD-037 exists to prevent. The emptiness test must use the allowlist-filtered listing.
- **`RSYNCRMDIR`.** The shipped backup removes empty remote directories after a successful run (`repo/code/cloud_backup-set-aside-excerpt.md`). If the reconciler keeps that, it must not run on the exit path and should tolerate the mkdir-to-first-file window of another device's retain (rclone creates parents on demand, so the failure is self-healing).
- **The README promises what does not exist yet.** #25 is its own futro after the wizard. A README that says "your handheld can put one back from the menu" is untrue until then. Version the text; the first edition says what the folder is, that it is ours, and — because the shape is plain files at plain names — how a person could copy one back by hand while the handheld is not syncing. The reconciler rewrites the README when its text changes (compare against the root listing on a full pass; never on the exit path).

*Experiment.* Against WebDAV: build a cloud with `Saves/README.md`, `Saves/.history/u/s/{Zelda.srm,record.json}`, run today's `cloud_restore` and `cloud_backup --method sync` from a guest lacking the store with the shipped rules file; assert `Zelda.srm` arrives locally and the store's other entries land in `-replaced/`. Repeat with the amended rules; assert nothing moves. Then wipe every save under `Saves/` but leave `.history/`, run a full pass with agreement on record; assert one refusal, zero questions.

### 2.4 Pruning racing a publish; the incomplete-entry sweep

Covered in §2.2. The rules that make it safe: prune only on a full pass (the shipped `prune_replaced_remote` already skips `--recent` — keep that instinct); never the newest entry of a save file; incomplete entries swept only after a grace window; the size sweep at most daily, after transfers, cancellable.

### 2.5 A device restoring `.history/` by accident — and the paths nobody named

- Old-image RESTORE (§1.5).
- A user-named filter file (D-CLOUD-088 lets a user who names `--filter-from` keep it): R2 says the reconciler never sources `RCLONEOPTS` and passes the shipped allowlist, so this closes at R1 but is open until then.
- A desktop cloud client mirroring `Saves/` to a PC: `.history/` appears there, hidden; the README is for that person.
- A player restoring `Saves/` from a PC backup that includes `.history/`: same content, no harm.
- A player deleting `.history/` by hand: the reconciler recreates it at the next retain; the reader shows less. Hiding it is what makes this rare.

### 2.6 Provider differences

| | Dropbox | S3 / MinIO | WebDAV | SFTP | SMB |
| --- | --- | --- | --- | --- | --- |
| Hash the store can verify against | Dropbox's own content hash, matched to sha256 through the manifests (R4) | ETag (MD5 for single-part; not for multipart) | server-dependent | none (D-QA-017: "a hash-less remote") | none |
| Server-side copy for the retain (my recollection of rclone's backend features; verify with `rclone backend features`) | yes | yes | yes where the server implements COPY; the QA backend's answer decides | no — rclone downloads and re-uploads through the handheld | no (I believe); as SFTP |
| Recursive listing for the size sweep | one call (ListR) | prefix listing, one call per thousand keys | one round trip per directory | per directory | per directory |
| Own versioning behind us | 30 days | none unless bucket versioning | none | none | none |
| Write quirks | serialised per folder (D-CLOUD-083) | no directories; directory rename = per-object copy | — | atomic rename on upload | case-insensitive; 255-byte components |

Consequences: the retain costs bytes through the handheld only on SFTP/SMB/FTP — a few hundred kilobytes for a state and its PNG, more for PPSSPP directories, which R4's admission ceiling already defers to the full pass; the size sweep is expensive only on the self-hosted matrix, which is why it is daily, full-pass and cancellable; Dropbox's 30-day history is a comfort for one provider and must not enter the README (one story). Unit keys are percent-encoded (R9), which can push a long ROM name past a 255-byte component on SMB or ext4; hash keys longer than a threshold and keep the plain key in the record.

*Experiment.* `tools/cloud-test-backend up --backend <name>` for each of WebDAV, MinIO, SFTP, SMB (#133 lists them); time a retain of a 128 KB and a 5 MB file; then seed a synthetic store of 500 units × 4 entries and time `rclone lsjson -R Saves/.history/` on each. The listing number decides whether the size sweep is daily or weekly and whether a flatter entry shape (§5) is worth having.

### 2.7 Hazards the commission did not list

1. **The unit-keyed count bound and auto-state churn** (§1.2). *Experiment:* count 3; on a guest, overwrite manual slot 3 once, then exit four times with RetroArch autosave on, syncing each time; assert slot 3's earlier version is still in the store.
2. **The heal cannot fetch at exit** (§1.4). *Experiment:* truncate a `.srm` to zero on a guest with the VM's network down; boot; assert the good copy is back from the stage before ES is up and the message shows once; then, with the network up, cancel the boot sync by launching; exit; assert the fresh save does *not* publish as "this device changed" (divergent, or healed first).
3. **The clock and the age cap** (§1.6). *Experiment:* set a guest's clock to 2031 and run a full pass; assert nothing expires. Set another's to 1990, retain, then prune from a good-clock guest; assert the 1990 entry survives if it is the newest for its file.
4. **Store operations under the allowlist** (§1.1, allowlist row). *Experiment:* an `lsjson --files-from` naming a `.history/` path with the shipped filter loaded returns nothing; without it, the entry. Then the retain `copy` into `.history/` with and without `- /.history/**`: does rclone 1.75.0 accept the overlap?
5. **The old device's prune purging stamps the new device has not folded** (§4). *Experiment:* the VM's upgrade recipe (D-QA-007) with `Saves-replaced/` holding two stamps; upgrade guest A, do not run its full pass, run guest B's old-image full backup; observe the older stamp purged. Then reorder: A's startup sync first; assert every byte is folded before B prunes.
6. **MATCH's deletions under retain-before-delete.** D-CLOUD-014's incident deleted 70 files. Under `--backup-dir` they survive one run; under the delta they land in `.history/` with `reason: deleted` and "never the only copy" protects them indefinitely. That is an improvement worth saying out loud — and a test: MATCH from a guest missing 70 saves; assert 70 protected entries and a clean size sweep afterwards.
7. **The exit sync lengthens; cancellation rises** (§3). Not a correctness hazard but a behaviour change to measure, not assume.

---

## 3. What it costs the time to play

### 3.1 What the delta adds, and where

Two numbers govern (D-CLOUD-098, `repo/rules/time-to-play.md`, #135): interface → first frame; one game's exit → the next game's first frame. The delta touches only the *publish* side of a pass — the exit push and the backup half of the startup sync (D-CLOUD-072) — and, through D-CLOUD-100, capture.

D-CLOUD-046 gives the baseline: an idle exit spawns no rclone; a changed exit spawns three to four on hashed backends, three plus a capped re-fetch on hashless. The delta adds, for an exit that overwrites *k* units in the cloud (typically one or two — the battery save and the auto-state; three or four if manual states were saved):

| Step | rclone spawns | Round trips | Bytes through the handheld |
| --- | --- | --- | --- |
| Retain: `copy --files-from` per unit into `.history/<unit>/<seq>/` (destinations differ per unit, so they cannot share a spawn) | *k* | 1–2 each; server-side where the backend copies | none on Dropbox/S3/WebDAV; the members twice on SFTP/SMB/FTP |
| Records: one spawn uploading every `record.json` of the run from a local temp tree | 1 | 1 + one small PUT per unit | a few hundred bytes per unit |
| Verify the entries | 0 if folded into R5's existing post-publish correspondence listing (`lsjson --hash --files-from` naming head and store paths in one call); 1 otherwise | 1 | none |
| Publish, head verification, agreement | unchanged | unchanged | unchanged |

My estimate, to be replaced by Gate 4 and #135's runner (D-CLOUD-046: "Numbers are filled in from Gate 4, not chosen"): on an H700 over Wi-Fi to a hosted provider, a spawn with its TLS handshake and one or two round trips is 1–2 s; to a LAN backend, 0.3–0.6 s. The delta therefore adds roughly *k*+1 to *k*+2 spawns, about 2–5 s to a changed exit against a hosted provider and about 1–2 s on a LAN backend, plus transfer time for the members on backends without server-side copy (negligible at typical save sizes; PPSSPP is the census gate's). A changed exit that is about 5–10 s today becomes about 7–15 s. `repo/docs/save-history-gap-analysis.md` calls this "one small extra transfer per replaced save" and #135 says "one extra small transfer"; it is *k*+1 spawns, and the corpus should say so.

### 3.2 What keeps it off the two measured paths

- **Interface → first frame: nothing.** Nothing in the store is read at launch; #25's reader is opened by the player. The only exception I propose is a heal pending for the game being launched when the stage could not supply it (§1.4): one small fetch, bounded and visible, only for that game, only when it must — which is the rule `repo/rules/time-to-play.md` states.
- **Exit → next first frame: nothing, by D-CLOUD-076.** A launch cancels an automatic sync in any phase with a two-second kill budget the plan already pays. The delta adds no waiting; the measured number does not move. What moves is the *probability that the exit sync is cancelled*, because it runs longer, and therefore the probability that the cloud lags one session for a player who relaunches within fifteen seconds. That is the honest cost, and it is measurable: #135's `time-to-play` cell with a relaunch at three seconds, with retain on and off, against the QA endpoint with and without a bandwidth cap. Two mitigations cost nothing: keep the phases in the order retain-all, records, publish-all — a cancel between retain and publish leaves benign entries and the head unchanged — and put the game save's unit first in the publish's `--files-from` with a single transfer on the exit push, so a cancel loses the least valuable publish.
- **Pruning, the size sweep, the README write, dedup by hash: full pass only, at most daily, after transfers, cancellable.** The shipped code already skips its prune on `--recent` runs (`repo/code/cloud_backup-set-aside-excerpt.md`: "a remote round trip the game-exit sync should not pay"); the reconciler inherits that rule.
- **The suspect check is a size test and a byte scan over a file of at most a few megabytes, inside capture, which runs at every exit already.** The heal from the stage is a local copy. Neither touches the network.
- **The admission ceiling** (R4/R5) must count the retain's bytes on backends without server-side copy, or a PPSSPP directory that would have cleared the ceiling for the publish alone stalls the exit sync on the retain.

---

## 4. Migration

What devices hold today (`repo/docs/save-history-gap-analysis.md` §1, `repo/code/*-set-aside-excerpt.md`): `Saves-replaced/<stamp>/<path>` in the cloud, normally one stamp after a completed full run, more after a failed one; `/storage/.cache/cloud_sync/replaced/<stamp>/<path>` on each device, the local copies a RESTORE overwrote — and because the manual RESTORE row passes no `--update` (`repo/code/cloud_restore-set-aside-excerpt.md`), some of those local copies are the newest version of a save that exists nowhere else. `Saves-discarded/` was never shipped. The rule is `upgrade-and-install.md`'s: read both, write the new one; a prompt is a failure mode.

**Image N+1 (before #22): the guard.** `- /.history/**` and `- /README.md` enter `cloud_sync-rules.txt` ahead of every include, migrated by the helper as rules already are. No writer exists; nothing else changes. Release note: upgrade every device before the next sync. This does not reopen D-CLOUD-097 (§1.5).

**Image N+2 (#22, R1 cutover): stop, fold, upload, delete — in that order, on the first full pass, with no words on screen.**

1. **Stop.** `--backup-dir` leaves the saves phases of both scripts with R1; the settings phases keep theirs.
2. **Fold the cloud sibling by server-side move.** For every file under `Saves-replaced/<stamp>/<relative path>`, map the path to its unit with the same table the reconciler uses for the live tree; `moveto` it into `.history/<unit>/<stamp as UTC>-legacy-replaced/<relative path>`; write one record per entry with `reason: replaced`, producer and core `"unknown"` (R9 already allows `"unknown"`), the time from the stamp (`%Y_%m_%d-%H%M%S` parses), and the device as unknown. A path the unit table does not map is not a save the reconciler would ever touch; leave it, log once, and remove `Saves-replaced/<stamp>/` only when empty. Moves are renames on every backend but S3, where rclone copies per object; the bytes are small.
3. **Upload the local set-aside.** For every file under `/storage/.cache/cloud_sync/replaced/<stamp>/`: compute sha256; if it equals the cloud head or any store entry for that file, it is not an earlier version and is deleted locally after the check (D-CLOUD-078 (3)); otherwise upload it into `.history/<unit>/<stamp>-<this device>-legacy-replaced/…` with `reason: replaced`, producer this device, verify, then delete locally. One-time, a handful of files, on a full pass with network — never on the exit path.
4. **The order matters in a mixed fleet.** An old-image device's completed full backup purges every stamp but the newest (`prune_replaced_remote`), so a stamp the upgraded device has not yet folded can vanish. Folding runs at the upgraded device's *startup* sync, so the window is the minutes between its first boot and the other device's next full run; the release note closes the rest. The old device keeps creating fresh stamps until it is upgraded; the new device folds each at its next full pass; the two converge without anyone being asked anything.
5. **The `.snapshots` guard** has no writer and nothing to migrate. A local `<SAVESPATH>/.history/` pulled under the old rules is ignored and logged (§2.3).
6. **Documentation in the same change:** the public cloud-sync page's layout table gains `.history/` and the README text; `docs/es-menu-map.md` gains the nested rows (D-UI-039); the register gains the superseding rows of §1.8.

*Experiment.* The VM upgrade recipe (D-QA-007 says it reproduces history the VM lacks) with a seeded `Saves-replaced/` of two stamps on WebDAV and MinIO and a seeded local `replaced/` tree holding one file whose hash exists nowhere else; upgrade; run the startup sync; assert every byte is in `.history/` under `reason: replaced`, the unique local file among them, both sibling folders gone, the local tree gone, and — from `tools/vm-visual-qa` frames — no dialog opened.

---

## 5. A simpler shape?

The maintainer's constraints — one home, inside the saves folder, hidden but declared, one vocabulary, no stacked settings, an accidental state overwrite recoverable — leave little room, and each alternative I tested fails one of them or a binding row:

| Shape | Fails on |
| --- | --- |
| Rely on the provider's own versions | WebDAV, SFTP and SMB keep nothing (`repo/docs/save-history-gap-analysis.md` §2.5; D-QA-017 makes them first-class); no rclone surface restores a Dropbox revision; not one home |
| Suffixed copies beside the file (`--suffix`, option C) | clutter beside every save; `--suffix-keep-extension` produces names emulators and the allowlist both match, so copies restore to devices and games may read them; no metadata |
| A local store | reopens D-CLOUD-036, whose argument (consistency across devices) stands |
| Content-addressed blobs plus a per-unit index file | the index is a shared mutable cloud file two devices read-modify-write; the plan of record avoids exactly that (per-device manifests read as a claim set, D-CLOUD-031/045) |
| Run-keyed layout, `.history/<run>/<relative path>` — `--backup-dir`'s own shape, one spawn per run | the reader must open every run to build one game's picker; the per-save bound needs cross-run bookkeeping; it optimises the writer over the moment the player is frightened |
| One umbrella `.rocknix/` holding history and manifests | one hidden folder instead of two, but `history` is the player's word and D-CLOUD-095 chose it; I note the variant and do not recommend it — the README naming both folders achieves the same declaration |

So the delta is the simplest *architecture*. The simplifications lie inside it, and each removes a rule or a hazard rather than adding machinery:

1. **One retain primitive** (copy, then record, then verify) for discarded, replaced, deleted and suspect alike; the wizard's cloud-loser *move* goes (§1.3). One write path, one kill matrix, one fixture.
2. **The count per save file** (§1.2). A single sentence in R9; it makes D-CLOUD-099 true.
3. **Drop the age cap** (§1.6). Two bounds instead of three; no clock; no sweep that a bad clock can turn into a purge.
4. **`record.json` last and the reason in the seq name** (§1.3). The pruner works from one listing; the reader fetches records only for the game it is showing.
5. **Heal from the stage** (§1.4). It makes D-CLOUD-100 work at exit without reopening R5, and it takes the heal off the network entirely in the common case.
6. **The exclusion rule one image early** (§1.5). It costs nothing and it is the only protection the store has before R1.
7. **Store operations outside the allowlist; emptiness inside it** (§2.3).

One shape question I would leave to measurement rather than decide now: if the recursive listing of `.history/` on the self-hosted backends proves slow enough to matter for a daily sweep (§2.6), flattening each entry to `<unit>/<seq>.json` plus `<unit>/<seq>-<member>` makes the sweep one round trip per unit instead of one per entry, at the price of a less legible folder for a person browsing by hand. The experiment in §2.6 answers it before anything is built.

---

## Appendix — provenance as embedded

All under `research/council-runs/2026-09-11-save-history-one-home/_sources/`, manifest read at `2026-09-11T19:31:42Z`:

| path | sha256 (verified at embed time) |
| --- | --- |
| `00-problem-statement.md` | `f7d770768b3bf81985b7415b4d82f8ee9ef26965a98eb6c47c166f54db673b27` |
| `repo/docs/save-history-plan-delta.md` | `1d320545319eba2e8852d830d52f76ab3a417e48e365d01fe79231bade77da8b` |
| `repo/docs/save-history-gap-analysis.md` | `d1107b7e1790b8e8aab177411b96bb3828f69e389fbc8e33c36ce616f67105aa` |
| `repo/docs/decision-register-excerpt.md` | `46ccfb71ef85537639501c2973a5b02fd81b6d5772662608ead073b209ea2726` |
| `repo/docs/es-menu-map.md` | `6d7813f91e37510f5578f35adec3f9372ed34e1ce5d871fcc0f34e392b202911` |
| `repo/rules/time-to-play.md` | `97d2fbba79fa42f22def37e4ff90e18149fc9fbc216d255d091da3dc187075da` |
| `repo/rules/es-native-ui-excerpt.md` | `32be1ee4164c9d1f09e7a9e9c8c25f526e70802f75901e456097bdb5c02d46e4` |
| `repo/code/cloud_backup-set-aside-excerpt.md` | `e5b57d74b83046fc7ebf44b4129c68815a575b35553e938c2ae377c685852509` |
| `repo/code/cloud_restore-set-aside-excerpt.md` | `c0dacd8aa1eb1a4df2986447a853cc3c47b666b6234127e61783a151faa448bd` |
| `repo/code/cloud_sync-rules.txt` | `bdb7e18128ce4a604c9b02cfe5b0f10f4e3e4dfd3aa7e2d69ea018b8c9d5484d` |
| `issues/22.md` | `b05b7095a31dd11f63cc342129fd3b765a19b9ba4b4a91b4b9aa1877c7658b27` |
| `issues/23.md` | `1ca065c449e0b3695f1ab4e9573ad5bd4a92b21ae23c869bba8730fcefdebfc1` |
| `issues/25.md` | `14a3cee5592021447395db3e59dfaf27ec09de77f1fb85fe5c10cfde9da28d1b` |
| `issues/134.md` | `d7ffb5a4648964d458b18a4a5427b1bb5d8fd356bb31fd06182d2d08c33a2071` |
| `issues/135.md` | `3998a6e46d8cdd903deb97b2da23afb78ad1b237061328f4402291c03e0ff137` |
| `issues/131.md` | `b8034bb7ab57d7ffb7d5aa4cf16d0974f0bf8d731c983e864081296fa6ccc17c` |
| `issues/133.md` | `4f58af89b8a262bb1c7615b7bdfea3389cb655d3c607474fe6aca8c6d084f9f2` |

**Corpus gaps I worked around, for the orchestrator:** `docs/conflict-wizard-ia.md`, `docs/save-manifest-schema.md`, #21 (capture and the unit table), the live `FileData.cpp`, `upgrade-and-install.md` and `engineering-practices.md` are cited by the corpus but not embedded. My reading of "unit" (§1.2) and of what the capture stage retains (§1.4) rests on R4's and D-CLOUD-078's wording alone and should be checked against #21 and the schema before either amendment is written into R9. My statements about rclone's overlap check, its treatment of excluded destination files under `sync`, its preservation of source modtime on copy, and which backends copy server-side are recollection, each with a one-command VM check named in §2.