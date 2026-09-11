# Council — Step 2: peer review

You are one of five council members. In Step 1 each of you independently judged
the delta to the conflict-resolution plan of record -- one hidden history store for
the earlier versions of a player's saves (the commission, `00-problem-statement.md`). The
complete corpus is embedded above this brief again, unchanged and hash-verified;
the other members' Step 1 analyses are injected below.

Your task is to review **their** analyses. You are not revising your own position
in this step, and you are not voting yet.

## Anti-self-citation constraint

You are critiquing **proposals about this system**, not observations of the
council run that produced them. Do not treat the injected analyses as evidence
about how well councils work, how models behave, or how this deliberation is
going. Reason about the substance on its merits, against the embedded corpus.

## What a good review does here

- **Test claims against the corpus.** Several analyses make specific assertions
  about what the shipped code does, what EmulationStation's helpers do, what
  rclone does, and what a register row decides. The corpus is embedded above.
  Where a claim is checkable, check it, and say plainly whether it holds. A
  confidently wrong claim about rclone's `--backup-dir` overlap rule, the
  allowlist, the shipped set-aside, a register row or what #22 R1-R9 says is the
  most valuable thing you can catch.
- **Separate what is established from what is asserted.** Some claims rest on
  the corpus; some rest on the member's own knowledge of rclone, bisync,
  RetroArch or filesystem behaviour that is *not* in the corpus. The second kind
  may still be right, but it is a hypothesis that needs an experiment. Say which
  is which, including where a member has already labelled their own inference.
- **Identify the strongest and the weakest argument in each analysis**, by name
  and filename.
- **Name failure modes every analysis missed.** Convergence between four models
  is not evidence of correctness; it may be shared blind spots.
- **Give concrete revisions** each proposal should make, specific enough that
  the author could act on them in Step 3.

Where you disagree with another member, argue the substance. Where they have
changed your mind, say so explicitly and why. Do not average positions, and do
not soften a real disagreement into a both-sides summary.

Refer to each analysis by its injected filename (for example `claude-analysis.md`),
never by an invented ordinal such as "Analysis 1" or "the first proposal" —
downstream steps inject your review into other members' prompts, and anonymised
ordinals have caused members to misidentify which position was their own.

## Injected analyses

=== START claude-analysis.md ===

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

=== END claude-analysis.md ===

=== START gemini-analysis.md ===

### 1. Does the delta weaken any property the plan of record relies on?

I have evaluated each changed row of the delta table (`repo/docs/save-history-plan-delta.md`). The delta does not weaken the plan of record; it unifies disparate mechanisms into a single, predictable store. 

*   **Store at `<SAVES_REMOTE>/.history/<unit>/<seq>/`, `reason`, and `README.md`**: **Endorse**. The plan of record relied on `-discarded/` being a sibling folder to avoid rclone `--backup-dir` overlap (D-CLOUD-014). Because the reconciler writes to `.history/` via explicit `copyto` rather than `--backup-dir`, placing it inside `Saves/` is safe and satisfies the maintainer's request for one home (D-CLOUD-095).
*   **Retain-before-publish for every publish that overwrites a cloud copy**: **Endorse**. The plan of record relied on retaining only wizard losers (D-CLOUD-036). Extending this to all overwrites strengthens the system by covering undecided replacements (e.g., crash truncations, #132) without weakening the ordering rule (D-CLOUD-041).
*   **Retiring `--backup-dir`**: **Amend**. The plan of record uses `--backup-dir` locally (`repo/code/cloud_restore-set-aside-excerpt.md`) to preserve local saves overwritten by a restore, satisfying D-CLOUD-078 (always keep a record of the last known good state). If we retire it, we must ensure no local data is destroyed. I amend this row: The reconciler must also perform **retain-before-install** for any fetch or restore that overwrites a local save, pushing the local loser to the cloud `.history/` store before overwriting it locally.
*   **Allowlist `- /.history/**` ahead of every include**: **Endorse**. Prevents sync loops and keeps the store hidden from the device.
*   **Nesting settings, age (90 d) and total (256 MiB) caps**: **Endorse**. Meets D-UI-039 and D-CLOUD-096.
*   **Reader reads one store, reason as label**: **Endorse**. Simplifies the UI.
*   **Classifier adds `suspect` class (auto-heal)**: **Endorse**. Meets D-CLOUD-100.
*   **Save states included (auto-states included)**: **Endorse**. Meets D-CLOUD-099.

### 2. Concrete failure modes and ordering hazards

Beyond the suspected hazards, I have identified a critical unnamed hazard regarding handheld clock skew:

*   **Clock skew triggering immediate pruning (Unnamed Hazard)**: 
    *   *Hazard*: Handhelds frequently lose RTC sync. The `<seq>` path uses `<decided_at, UTC compact>-<deciding device id>`. If a device with a dead battery thinks it is 1970, its history entries will be written with an ancient timestamp. When the pruning logic enforces the 90-day age cap (D-CLOUD-096), it will immediately delete this brand-new save because its timestamp makes it look like the oldest record.
    *   *Experiment*: On the GENERIC_X64 VM, set the system clock to 2020. Trigger a conflict resolution that pushes to `.history/`. Run the pruning sweep and verify if the newly retained save is immediately deleted.
*   **Provider differences and server-side copy fallback**:
    *   *Hazard*: Retain-before-publish relies on `rclone copyto`. On Dropbox, this is a fast server-side API call. On self-hosted backends like SFTP or WebDAV (`issues/133.md`), rclone may not support server-side copy and will silently fall back to downloading the file and re-uploading it to `.history/`. This doubles the bandwidth and time required for a publish.
    *   *Experiment*: On the VM against the SFTP QA backend, run a publish that triggers retain-before-publish. Monitor network traffic to see if it equals the file size (indicating a download/upload fallback) rather than just API overhead.
*   **Retain-before-publish under an interrupted run**:
    *   *Hazard*: If `rclone copyto` succeeds in placing the old cloud head into `.history/`, but the subsequent publish of the new save fails (e.g., link loss), the cloud head remains unchanged. The next sync pass will see the same head and may `copyto` it again, creating duplicate history entries and churning the count cap.
    *   *Experiment*: On the VM against WebDAV, kill the reconciler process after `copyto` completes but before the publish finishes. Verify if the next run duplicates the history entry.
*   **Two devices publishing to the store at once**:
    *   *Hazard*: Because `<seq>` includes the device ID, paths will not collide. However, if both devices evaluate the 256 MiB total size cap or the count cap at the same time, they may both attempt to delete the same oldest record, causing one to fail, or they may both delete records and over-prune.
    *   *Experiment*: Run two reconcilers concurrently on the VM, both pushing to the same unit's history on WebDAV, exceeding the count cap.
*   **The store's README inside a folder that `sync` mode mirrors**:
    *   *Hazard*: The allowlist (`repo/code/cloud_sync-rules.txt`) excludes `- /.history/**`, but the root `Saves/README.md` is not explicitly excluded. However, because the allowlist ends with `- /**`, the README will be ignored and not synced to the device. This is actually correct (it prevents clutter on the handheld), but means the README only exists in the cloud.
    *   *Experiment*: Run a full restore on the VM with a `README.md` placed in the cloud's `Saves/` root. Assert that it does not appear on the local device.

### 3. What it costs the time to play

Per `repo/rules/time-to-play.md` (D-CLOUD-098), time to play is a first-class metric. 

*   **Cost**: Retain-before-publish adds one `rclone copyto` operation per overwritten cloud file. On a handheld's Wi-Fi, if the provider supports server-side copy (e.g., Dropbox), this is **1 additional round trip taking ~0.5 to 1.0 seconds**. If the provider does not (e.g., SFTP), it requires a full download and upload, which could add **2-4 seconds** for a 5MB save state.
*   **Keeping it off the launch path**: The exit sync must not block the player. If the player launches a *different* game, they do not wait. If they launch the *same* game, EmulationStation checks `L_T` and `L_S`, and will refuse the launch if the reconciler holds `L_S` (D-CLOUD-053). To keep the network cost off the launch path, the reconciler must read the locally captured save into memory or a staging area, **release `L_S`**, and only then perform the network `copyto` and publish. Because capture already seals an independent copy (D-CLOUD-034), the reconciler does not need to hold `L_S` during the network round trips.

### 4. Migration

Devices currently hold `Saves-replaced/<stamp>/` in the cloud and `.cache/cloud_sync/replaced/<stamp>/` locally (`repo/docs/save-history-plan-delta.md`). These are pruned to the newest run (`repo/code/cloud_backup-set-aside-excerpt.md`). To ensure no earlier version is lost and no prompt is shown to the player:

1.  **Stop writing**: The new reconciler replaces `cloud_backup` and `cloud_restore`, so `--backup-dir` is naturally retired.
2.  **Read both**: The #25 restore tool must be amended to read both the new `.history/` store and the legacy `Saves-replaced/` and `.cache/cloud_sync/replaced/` directories.
3.  **Synthesize records**: When reading the legacy directories, the tool synthesizes a record in memory (e.g., `reason: replaced (legacy)`, using the folder's timestamp for the date).
4.  **Age out**: Because the legacy folders only hold a single run, they do not need to be moved or rewritten into `.history/`. They will simply remain accessible via the restore tool until the user deletes them or the 90-day age cap sweeps them.

### 5. A simpler shape

The proposed delta is **already the simplest shape** that meets all of the maintainer's constraints. 

*   Option C (`repo/docs/save-history-gap-analysis.md`, suffixed copies like `Zelda.srm.bak-1`) was rejected by the maintainer due to cluttering the saves folder.
*   Relying on the cloud provider's native file history (e.g., Dropbox's 30-day history) violates D-QA-017 (we do not optimize solely for Dropbox) and leaves users of self-hosted backends (WebDAV, SFTP, SMB) with no history at all.
*   The delta unifies two disparate, confusing mechanisms (`--backup-dir` and `-discarded/`) into a single, predictable, metadata-rich store. It uses one vocabulary ("earlier versions"), hides the complexity from casual browsing (D-CLOUD-095), and provides a single recovery path for all overwrite scenarios (conflicts, sync replacements, and auto-heal).

=== END gemini-analysis.md ===

=== START kimi-analysis.md ===

# Council Step 1 — Initial Analysis: one home for earlier versions (`Saves/.history/`)

**Posture.** I judge the delta (`repo/docs/save-history-plan-delta.md`) against the plan of record (#22/#23/#25, D-CLOUD-030..053) under the binding rulings D-CLOUD-095..100, D-UI-039, D-QA-015/017. I reopen no register row outright; I identify two rows the delta *already amends without saying so* (D-CLOUD-047, D-CLOUD-046) and one it supersedes without citing (D-CLOUD-042), and I argue the delta must carry those citations. Where I reason about rclone filter semantics or network costs, that is inference from the corpus plus tool behaviour, and I say so; each such claim comes with the VM experiment that settles it.

**Corpus gaps I worked around** (surfacing per instructions): the full `cloud_backup`/`cloud_restore` scripts are not embedded — only the set-aside excerpts — so I cannot see the complete `all_opts` construction (specifically whether `--delete-excluded` appears anywhere, and whether the settings-archive phase carries its own `--backup-dir`); `upgrade-and-install.md` is quoted in the commission but not embedded; the unit table, `docs/conflict-wizard-ia.md`, `docs/save-manifest-schema.md`, and `engineering-practices.md` are referenced but not embedded. Nothing below rests on inventing their contents; two verification items depend on the missing script text and are flagged as such.

**Headline.** The delta is sound and I endorse all nine of its changed rows — seven outright, two with amendments that are specifications rather than additions. It weakens exactly one structural property of the plan of record: the store's exclusion from the sync boundary changes from *by construction* (a sibling, outside the allowlist) to *by rule* (a first-match exclude), and that weakening is real because rules files are user-editable and old images persist in a fleet. It strengthens every other property it touches: it closes the two gaps the plan of record openly admitted (undecided replacements, no validity check — `repo/docs/save-history-gap-analysis.md` §2.1–2.2), resolves D-UI-022's residual vocabulary problem, and turns deletion retention from a one-run accident into a recorded event. It also contains one internal contradiction (claims D-CLOUD-047 is unchanged while introducing `reason: deleted` and retiring the `-replaced/` sibling that 047 names as the record for propagated deletions) that must be fixed before the delta is locked.

---

## 1. Does the delta weaken any property the plan of record relies on?

### Row-by-row verdicts

| Delta row | Verdict |
|---|---|
| Store at `<SAVES_REMOTE>/.history/<unit>/<seq>/`, `reason` field, READMEs | **Endorse, amended** (register citations; commit-point ordering; old-image defence) |
| Retain-before-publish on every overwriting publish | **Endorse, amended** (atomic deferral with the ceiling; dedupe; copy never move) |
| `--backup-dir` retired once R1 holds | **Endorse** (the conditioning is the safety) |
| Allowlist: `- /.history/**` first, `.snapshots` rule dropped | **Endorse, amended** (write it into the shipped file, not only the reconciler's prepends) |
| Settings nested behind SAVE HISTORY | **Endorse** (with key-migration and range wording notes) |
| #25 reads one store, `reason` as the label | **Endorse** (resolves D-UI-022's residual) |
| `suspect` class with auto-heal | **Endorse, amended** (both directions; both-suspect; D-CLOUD-046 rider) |
| Save states, auto-states included | **Endorse** (binding D-CLOUD-099; size interaction flagged) |
| Public docs show the layout | **Endorse** |

### 1.1 The store's location: the one real weakening, and its price

The plan of record puts the store at `<SAVES_REMOTE>-discarded/`, "outside the allowlist by construction" (`issues/22.md` R9). Construction cannot be edited by a user, lost in a migration, or absent from an old image. The delta moves the store inside the sync root, where exclusion survives only as the rule `- /.history/**`.

That this is a live risk and not a formality is shown by the corpus itself. The shipped allowlist (`repo/code/cloud_sync-rules.txt`) includes `+ /**/*.srm`, `+ /**/*.sav`, `+ /**/*.state*`, `+ /**/*.dsv*`, `+ /**/*.eep` and friends — patterns that match at *any depth*, and rclone filters have no dotfile special-casing (inference from rclone semantics; the delta's own authors confirm the belief by adding the exclusion at all). The store's members sit "at their basenames" (`issues/22.md` R9), so under any rules file lacking the new exclusion — a pre-delta image, or a user's own filter file, which D-CLOUD-088 explicitly lets them keep — every save and state in `.history/` is *in scope* for transfers. Consequences, in increasing order of severity:

- An old-image **restore** copies the store's members down to `/storage/roms/.history/…`: card clutter on the device D-CLOUD-096 promised would never grow ("in the cloud, so no card grows"), and a visible folder the player was told was hidden.
- An old-image **sync-mode backup or MATCH THIS DEVICE TO THE CLOUD** (the menu's "only action that deletes", `repo/docs/es-menu-map.md`) treats the cloud's `.history/` members as included files absent locally and *deletes them from the cloud*. The shipped `--backup-dir` catches them into `Saves-replaced/<stamp>/` — one run deep, pruned on the next run (`repo/code/cloud_backup-set-aside-excerpt.md`). The save bytes are shredded out of the store while `record.json` and PNG files (no include matches them) survive as orphans pointing at nothing. This is the same shape as the 70-file deletion that motivated D-CLOUD-014, re-entering through the new folder.

The fleet today is the maintainer's own devices (D-UI-022: "I'm the only one using this"), sync is a non-default choice (D-CLOUD-014 sets `copy`), and R1's cutover is one image — so the probability is low *now*. But the project's own register names "a delete made on a device still on the old firmware" as a cause to design for (D-CLOUD-037), and the store's entire purpose is surviving mistakes. **Amendment:** make the migration's fold of `Saves-replaced/` a *standing* full-pass behaviour (section 4), path-aware so that members landing in `-replaced/<stamp>/.history/…` are folded *back* to their original `<unit>/<seq>/` — the store then self-heals through the very mechanism that threatens it, with no name-mangling of members (the maintainer asked for clear names, and #25 restores byte-for-byte through the record regardless). Residual, stated honestly: two consecutive old-image sync runs with no new-image pass between them lose the first stamp. I accept that residual; the alternative (mangling member names to defeat `*.state*`'s trailing star) costs the human-browsability the maintainer asked for.

**Register hygiene on this row:** D-CLOUD-095 says it "replaces the two planned siblings (`-replaced/`, D-CLOUD-014's set-aside; `-discarded/`, D-CLOUD-036/#22 R9)" but does not name **D-CLOUD-042**, the row that fixed the store's folder as `Saves-discarded` beside the saves folder. The register's own discipline (D-CLOUD-041 was recorded, not edited) wants the supersession cited. Add it.

### 1.2 Retain-before-publish on every overwriting publish: the delta's core win

This is the only mechanism that can close gap §2.1, because the alternative is physically impossible: rclone rejects a `--backup-dir` overlapping its destination (D-CLOUD-014, verified against the real remote; restated in `repo/code/cloud_backup-set-aside-excerpt.md`), so a store *inside* the saves folder cannot be written by `--backup-dir` at all. `copyto`-then-publish is forced, and it is correct: it also unifies the wizard's retain path with the ordinary publish path into one mechanism with one record shape — the delta's real elegance.

Three amendments, all specifications:

1. **The retain and its publish are one atomic pair for deferral purposes.** D-CLOUD-046's admission ceiling defers oversized units to the next full pass. The retain bytes (≈ the published bytes) must count toward the ceiling, and when a unit defers, *both* the retain and the publish defer — a publish must never go out ahead of its retain because the retain was the half that fit. The ordering rule (D-CLOUD-036/041, #25: retain verified before the winner replaces anything) already implies this; the delta should say it.
2. **Copy, never move.** A server-side *move* of the head into the store looks cheaper but opens a window in which the head is absent — and an absent head with agreement on record is exactly the unexplained-absence question D-CLOUD-037 makes the player answer. `copyto` keeps the head present until the publish replaces it (rclone renames into place per file, D-CLOUD-076). Say "copy, not move" in the delta so nobody optimizes it later.
3. **Dedupe against the newest entry.** If the newest store record's sha256 equals the current head's (re-publish after an interruption, or two devices retaining the same head — section 2.2), skip the retain. One hash comparison, no transfer.

### 1.3 Retiring `--backup-dir`: endorse, with the condition named

The conditioning on R1 is doing all the work and is correct: until the reconciler is the only writer, the shipped set-asides are the *only* protection that exists (D-CLOUD-078's named gap is what they closed), and D-CLOUD-097 (binding) forbids an interim widening. Two notes: (a) Gate 7 ("where `copy --backup-dir` proves reliable") is mooted for saves the way D-CLOUD-044 mooted the bisync upstream question — say so; (b) the excerpt's comment ("the same reasoning already applies to SETTINGS_REMOTE", `repo/code/cloud_backup-set-aside-excerpt.md`) suggests the settings phase may carry its own set-aside — the delta retires only the saves one, and should say the settings phase is untouched (the full script text is a corpus gap; verify).

### 1.4 The allowlist row: endorse, with placement specified

First-match-wins (`repo/code/cloud_sync-rules.txt` header) means `- /.history/**` must sit with the database excludes at the very top, ahead of *every* include — the delta says this. Two specifications: (a) the rule belongs **in the shipped `cloud_sync-rules.txt` file itself**, not only in the reconciler's prepended arguments (`issues/22.md` R2), because D-CLOUD-088 now forces the file onto every run that doesn't name its own — the file is the fleet-wide lever, and the pre-R1 scripts read only the file; (b) dropping the `.snapshots` guard is fine (a guard with no writer, `issues/25.md`), but the row should note R2's `- /**/*.bak` guard stays, so nobody reads the row as replacing both.

### 1.5 Settings nesting: endorse

Consistent with D-UI-039 and D-UI-023; the menu map already carries the pending note (`repo/docs/es-menu-map.md`). Two notes: the renamed switch's underlying key needs the D-UI-022 precedent — *read-old-if-new-absent* so an upgraded device keeps its value; and "per save 3 to 5" (D-CLOUD-096) against D-CLOUD-036's "selectable 1 to 9" is ambiguous wording. #134's checklist ("default 3 or 5") shows the open question was the *default*, so read 096 as the default band and keep the 1–9 range — but the delta should say the range explicitly, because narrowing a player-facing range is a change to D-CLOUD-036 that nobody has argued.

### 1.6 The #25 reader: endorse

The `reason` field resolves D-UI-022's residual ("a copy a sync replaced without anyone deciding is not discarded by anybody") by construction rather than by a second labelling scheme — this is the delta's cleanest vocabulary move. Generalize R9's `discarded_by: "wizard"` to a writer/cause field (`exit-sync`, `full-pass`, `manager-delete`, `auto-heal`, `migration`); keep `schema: 1` per D-CLOUD-045's additive-fields precedent (no deployed readers exist).

### 1.7 The suspect class and auto-heal: endorse, amended

The heuristic (zero length or all one byte *where the previous version was neither*) is the D-CLOUD-034 cheapest-sufficient form of the gap analysis's format-aware gate, and its best property is that **a false positive is recoverable by construction** — the "suspect" is retained, so a wrong heal is undone through #25 like any other entry. Amendments:

1. **Both directions.** The delta text describes a suspect *device* copy. The cloud's head can equally be suspect (pre-cutover corruption, a desktop client). Generalize: the suspect side loses to the healthy side, whichever it is; if *both* sides are suspect there is nothing worth protecting — treat as an ordinary change.
2. **Run the check before the divergent verdict.** A both-changed pair with one suspect side is not a conflict — one side is not a version. Auto-heal rather than queue; the retention makes it reversible, which is D-CLOUD-032's own deciding question. This also keeps a damaged file out of the wizard, where asking a player to choose between a save and a zero-byte file is a question we can answer for them.
3. **The D-CLOUD-046 rider.** D-CLOUD-100's "the cloud's good copy is kept and **restored**" requires a fetch, and the exit path is defined as push-only (D-CLOUD-046; `issues/22.md` R5 "No fetches… on this path"). The rows conflict and the delta doesn't say so. The exit card is exactly where D-CLOUD-098 permits spending the player's attention (they just exited; the card is up), and the fetch is one unit's members, bounded. The delta should carry an explicit refinement to D-CLOUD-046: *one bounded fetch per suspect unit on the exit pass*. The alternative (defer the local restore to the next pass) lets the player launch into the suspect file first; the cascade is survivable (the good copy is in the store) but scruffy.
4. **Detection cost.** On hashed backends, "all one byte" needs no fetch: the sha256 of a uniform buffer of the observed size is computable locally in O(size) and compared against the listing hash (inference; the mechanism is standard). On hashless backends R4 already fetches to hash. So the check adds no round trips.

### 1.8 Save states, all of them: endorse

Binding (D-CLOUD-099) and right on the merits — the accidental overwrite of a state is the highest-value restore case, and the wizard's auto-rule (#23) already treats auto-states as first-class. The interaction to name: RetroArch states are 28–51 KB with ~48 KB PNGs (D-CLOUD-036), so count-bounded churn is cheap; but the PPSSPP directory case — which D-CLOUD-036 already defers to the census gate — can run to tens of MB per state, and 5 × 40 MB for one unit is most of the 256 MiB cap. The eviction precedence the delta leaves unstated (section 2.4) and the census measurement are both prerequisites to fixing the cap; D-CLOUD-096 already frames the numbers as starting points.

### 1.9 Public docs: endorse

One requirement: the README text and the docs page's layout table must be generated from one source, or the documentation-accuracy gate will catch them drifting apart every time the layout changes.

---

## 2. Concrete failure modes and ordering hazards

Each with the cheapest decisive experiment on the GENERIC_X64 VM and the #133 backends (D-QA-007/017: the VM answers first; nothing touches a person's device or cloud, D-QA-015).

### 2.1 The interruption matrix for retain-before-publish

The delta says "copyto … with a record, then publish" but never says *member first or record first*. That choice is the whole failure analysis:

- **Bytes first, record last, record is the commit point.** Kill between copyto and record: orphan bytes in a `<seq>/` with no record — swept by a later pass (a seq dir without a valid `record.json` past a grace age is garbage). Kill between record and publish: a redundant entry for a version still head — dedupe rule (1.2.3) absorbs it. Kill mid-copyto: rclone's temp-and-rename (D-CLOUD-076) leaves a `.partial`, not a truncated member; the sweep takes it.
- The reverse order (record first) leaves a record pointing at missing bytes — an entry #25 displays and cannot restore. Strictly worse.

**Amendment:** the delta must state bytes-first-record-last and the orphan sweep; this preserves R9's "finalized, coherent … only" invariant (I13/I18/I26) across the store's wider population. **Experiment:** extend the existing A7/A8 kill fixtures (`issues/22.md` acceptance) — `kill -9` the reconciler pre-retain, mid-copyto, post-retain-pre-record, post-record-pre-publish, mid-publish; assert on restart: no head ever replaced without a verified store entry, orphans swept, pending-publish completes. All on the VM pair against WebDAV.

### 2.2 Two devices publishing at once

The fresh-head check already serializes actual publishes (`issues/22.md` R5: push only when head equals agreement; a mismatch reclassifies as divergent → wizard). The new surface is the store write itself: two devices can `copyto` the same head into different seq dirs concurrently — seq carries the deciding device id (R9), so no collision; the result is at worst a duplicate entry (same bytes), absorbed by dedupe. The TOCTOU window between head-check and publish is one round trip and fails *safe* (an extra entry, never a missing one). **Experiment:** two VM guests, one backend, same unit, forced simultaneous publishes; assert one winner, one reclassification, zero torn seq dirs.

### 2.3 Same-device overlap — the hazard nobody named

D-CLOUD-093 took a deliberate trade: an orphaned rclone no longer holds the transfer lock, "so a new run can start beside one." Post-R1 the reconciler holds `L_T` itself, but a reconciler killed mid-pass can leave an orphaned rclone finishing a copyto while a *new* reconciler starts on the same device. Two same-device runs in the same second produce the same seq (`<decided_at UTC compact>-<device id>` has no run id — R9). **Amendment:** add the run id to the seq, or fail the retain on an existing seq dir. **Experiment:** orphan an rclone mid-retain (SIGSTOP the reconciler, SIGKILL it, restart), let the next pass run; assert no interleaved writes in one seq dir.

### 2.4 Pruning racing a publish

`L_T` is device-local (`/var/run/cloud_sync.lock`, R6) — it does *not* serialize across devices, so the store must be safe under concurrent writers by construction. It nearly is: retains are add-only into unique seq dirs; deletes are idempotent purges. The two rules that close it: **prune counts only entries with valid records** (an in-flight retain is invisible), and **never purge a seq dir younger than a grace window** (an in-flight retain is protected). Also: **no pruning on the exit path** — the shipped script already skips the prune on `--recent` runs as "a remote round trip the game-exit sync should not pay" (`repo/code/cloud_backup-set-aside-excerpt.md`); the same discipline keeps count enforcement on full passes, accepting that a unit transiently holds N+1 between full passes. **Experiment:** prune against a retain in flight behind the QA backend's bandwidth cap; assert the grace skip.

**Eviction precedence** (the delta lists three bounds and one exception but no order): per-unit count first (within the unit), then age, then total size (both across units, oldest first) — and *every* eviction checks the only-copy rule against a fresh head listing, because a decided deletion retained with `reason: deleted` is by definition the game's last copy anywhere, and the 90-day cap must not evict it (D-CLOUD-096's "never the only copy of a game" is load-bearing precisely for deletions). **Experiment:** fill past 256 MiB with a mix including a deleted game's only copy; assert it survives.

### 2.5 The README and `.history/` against `sync` mode and the allowlist

`README.md` matches no include and falls to `- /**`, so it never travels to devices (intended — it addresses someone browsing the cloud folder) and `sync` won't delete excluded files *unless* `--delete-excluded` is passed. **The excerpt does not show the full options** (corpus gap): **verification item — grep every writer for `--delete-excluded`; if present anywhere, it must go before `.history/` lands**, because it deletes excluded files without the `--backup-dir` safety net. **Experiment:** seed a cloud with README + `.history/`; run the shipped image's backup (copy and sync), restore, and MATCH; assert both files survive on the cloud and never appear on the device. This experiment also settles the `**`-matches-dotdirs inference in 1.1 — it is the single most valuable run in this section, needs no new code, and should happen this week.

### 2.6 Provider differences

Dropbox: server-side `copyto` (one API call, hash-preserving); its own 30-day versions are a bonus layer, not a reason to skip the store (D-QA-017 forbids Dropbox-shaped design). WebDAV: server-side COPY support varies by server — *measure per backend*. SFTP/SMB: rclone streams the copy through the device — the retain costs a download *and* an upload leg on the handheld's Wi-Fi, which is why the ceiling must count retain bytes (1.2.1) and why the store being the *only* history on these backends (gap analysis §2.5) raises the correctness bar there. **Experiment:** `rclone copyto` same-remote on each #133 backend; record round trips, server-side vs streamed, kill-residue naming, hash preservation. One afternoon, no new code.

### 2.7 Clock skew against the age cap

Seq names and `decided_at` come from device clocks, and the corpus knows devices have wrong clocks (`repo/code/cloud_backup-set-aside-excerpt.md`; #23's `clock_synced: false`). A clock set backward makes a fresh entry look old → the age cap evicts it early; forward makes entries immortal. The count and size caps are clock-independent and carry the load; the age cap should compare against `max(decided_at, the record's server-side modtime)`. #25's A5 already includes "a clock set backward" as a store-survival case — extend the same fixture to the pruner.

### 2.8 Pending-publish replay after a replayed game

If an exit push is interrupted (pending-publish.json, R5) and the player relaunches, plays, and exits again, two sealed captures exist. Publishing both in sequence retains twice and makes the intermediate briefly head; collapsing to the newest loses the intermediate's bytes (which were never anyone's head). **Recommendation:** collapse to the newest sealed capture per unit, retain once — time-to-play beats an intermediate nobody saw. The delta's "every publish retains" makes the naive answer twice as expensive; #22 should state the collapse rule. (Inference; the unit table and capture-stage lifetime are corpus gaps.)

### 2.9 Layout migration carrying the store

`cloud_migrate_layout` (D-CLOUD-089) and TIDY UP YOUR CLOUD FOLDERS move saves folders; a move of the parent carries `.history/` naturally, but any child-by-child move would orphan the store from its README and from R7's context records. One line in the migration tool's inventory; one VM fixture (migrate a layout containing `.history/`, assert the store and records arrive intact).

---

## 3. What it costs the time to play

**The launch path (UI → first frame): zero added operations.** Retain-before-publish exists only inside reconciler passes (exit, boot, manual); nothing touches `FileData::launchGame`. The rule file already assigns the work its place: "Retain-before-publish, hashing, manifests and verification belong after the game has started or after the card has said the player may go" (`repo/rules/time-to-play.md`). The only coupling is indirect: longer syncs raise the chance a launch lands during one — and there the player never waits more than the cancel budget (SIGTERM, 2 s, SIGKILL at 1.5 s — D-CLOUD-076) for an automatic sync, or the visible refusal for a manual one (D-CLOUD-038). The cancel is safe under the delta *because* of 2.1's ordering: a kill anywhere in the retain leaves either orphans (swept) or a completed retain with the publish pending (completed next pass from pending-publish.json).

**The exit path (exit → next first frame): the delta spends everything here.** Per changed unit, retain-before-publish adds to R5's 3–4 spawns (D-CLOUD-046): one member-copy spawn (`rclone copy` with `--files-from` from head dir to seq dir batches a unit's members server-side on Dropbox), one record upload, one extra listing for store verification (the head's correspondence listing already exists). Net **+2–3 spawns, +3–5 API calls, ≈ +1.5–3 s per changed unit** on Dropbox-class latency (inference: ~300–800 ms per API operation on H700-class Wi-Fi; Gate 4/A10's measurement harness is the arbiter). A typical exit changes two units (battery save + auto-state with PNG): **≈ +3–5 s on the exit card**. On hashless self-hosted backends the member copy streams through the device: sub-second for ≤128 KB saves on LAN Wi-Fi, but **~25 s+ for a 30 MB PPSSPP state at 20 Mbps** — which is why the admission ceiling must weigh retain bytes and defer the pair (1.2.1). Note for #135: its acceptance text calls retain "one extra small transfer" — it is two to four; still small, but the budget row should be written from measurement, not that phrase.

**What keeps it off the launch path, stated as requirements:** retain runs only on publish paths; cancel-on-launch (D-CLOUD-076) caps player-visible interference at the kill budget; pruning and README existence checks run on full passes only (the shipped `--recent` precedent); the auto-heal fetch is bounded to suspect units and rides the exit card (1.7.3); the ceiling counts retain bytes. With those five, UI→first-frame is unchanged at boot and at rest, and exit→next-frame grows only for a player who chooses to watch the card instead of launching.

---

## 4. Migration

Constraint: read both, write the new one; a prompt is a failure mode (the commission's quote of `upgrade-and-install.md`; the file itself is not embedded). Devices hold cloud `Saves-replaced/<stamp>/` (one run deep) and local `/storage/.cache/cloud_sync/replaced/<stamp>/`; `-discarded/` never shipped. Both set-asides can hold bytes that exist nowhere else (the local one covers an unpublished newer save overwritten by a restore — the excerpt's own case), so "no earlier version is lost" forces folding *both*, not expiring them.

**The fold, run by the reconciler under `L_T`, no prompts, any failure leaves sources in place:**

1. **Cloud sibling → store (standing, not one-shot).** Each full pass: `lsf --dirs-only` on `Saves-replaced/` (one cheap call; empty → done). For each member: derive the unit from its path, `copyto` into `.history/<unit>/mig-<stamp>-<device>/`, synthesize `record.json` (`reason: replaced`, `producer: "unknown"` where unknowable, sha256/size from listing or fetch, `decided_at` from the stamp, `discarded_by: "migration"`); verify; only then purge the sibling. Paths that are themselves under `-replaced/<stamp>/.history/…` fold *back* to their original unit/seq — this is the self-healing property that answers 1.1's old-image hazard, and it is why the fold must be standing rather than a one-time migration: it also absorbs anything an old-image device in the fleet writes to `-replaced/` forever after, upgrading that device's safety net in place.
2. **Local set-aside → store (one-shot per device).** Upload `.cache/cloud_sync/replaced/<stamp>/` the same way (`reason: replaced`, producer this device), then delete the local folder. Also sweep any stray `/storage/roms/.history/` an old-image restore pulled down (2.5) — provably a copy, since nothing creates it locally.
3. **READMEs** written create-if-absent on the first pass (root and `.history/`, one source string); **the renamed setting's key** migrates read-old-if-new-absent (D-UI-022 precedent); **the docs page** ships in the same change (delta row 9).
4. **Deferral:** no network at first boot → the fold waits for the first networked pass; the old folders sit harmlessly because nothing writes them anymore (the pruner retired with `--backup-dir`, so the newest stamp does not rot). Idempotent: a re-run after a crash finds either sources (fold again) or verified records (skip).

**Experiment:** seed both set-asides with fixture trees on the VM pair; run the cutover image's first pass; assert every file landed with a record, siblings purged, local folder gone, *zero dialogs raised* (harness assertion), and a second run is a no-op.

---

## 5. A simpler shape?

**The delta is the simplest shape that meets the binding constraints; I have nothing better.** Each simpler candidate fails a constraint that is not up for debate:

- **Suffixed copies beside the file** (gap analysis option C): R2 already excludes `- /**/*.bak`, and any suffix that survives the allowlist clutters every folder the player browses — fails "hidden" (D-CLOUD-095) and carries no metadata, failing D-CLOUD-033's engineering consequence (a store #25 can drive a picker from).
- **Provider versioning** (Dropbox's 30 days): WebDAV/SFTP/SMB keep nothing (gap analysis §2.5), and D-QA-017 forbids Dropbox-shaped design. Fails "one home."
- **Two siblings with unified vocabulary**: fails "inside the saves folder, hidden" (D-CLOUD-095).
- **A visible folder inside Saves**: fails "hidden"; the maintainer considered and chose.
- **A local store**: fails D-CLOUD-036's consistency argument (resolve on one device, undo missing on another).
- **`--backup-dir` pointed at `.history/`**: physically impossible — rclone rejects the overlap (D-CLOUD-014). This is what forces `copyto`, and `copyto` is what forces the reconciler to own the retain, and the reconciler owning it is what makes records possible. The delta's shape is not a taste; it is the fixed point of the constraints.

What remains is irreducible: one dot-folder (hidden), one exclusion rule (forced by the location), one record shape (forced by #25's picker), one retain mechanism (forced by the overlap rule), one enum (forced by one vocabulary). The only trims I'd accept: single-source the two READMEs (one text, two outputs), and resist any future request to surface the age/size caps as rows (D-CLOUD-096 already keeps them ours). My amendments in sections 1–4 add no player-facing surface — they make the chosen shape true under interruption, concurrency, and a mixed fleet.

---

## `corpus.provenance.json`

```json
{
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
    "research/council-runs/2026-09-11-save-history-one-home/_sources/issues/133.md"
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
    "4f58af89b8a262bb1c7615b7bdfea3389cb655d3c607474fe6aca8c6d084f9f2"
  ],
  "note": "Paths and sha256 values are the Facilitator's embed-time declarations, recorded as instructed; I did not re-read or re-hash the files. Corpus gaps surfaced: full cloud_backup/cloud_restore scripts (only set-aside excerpts embedded), upgrade-and-install.md (quoted in the commission, not embedded), the unit table, conflict-wizard-ia.md, save-manifest-schema.md, engineering-practices.md (referenced, not embedded)."
}
```

=== END kimi-analysis.md ===

=== START mistral-analysis.md ===

# Council Analysis: Save History Delta for One Home

## 1. Does the delta weaken any property the plan of record relies on?

### Store Location Inside Saves Folder (`.history/`)
**Endorsed with amendments.** The move from sibling folders (`-discarded/`, `-replaced/`) to a hidden folder inside `Saves` strengthens the plan's consistency (D-CLOUD-036) by:
- **Unifying vocabulary**: The player sees one "earlier version" concept, not two technical events (D-UI-022).
- **Simplifying documentation**: One README at `Saves/README.md` declares the store, rather than two scattered explanations.
- **Reducing clutter**: A hidden folder (dot-prefixed) discourages manual tampering while remaining discoverable via the README.

**Amendment needed**: The allowlist rule `- /.history/**` must be **inserted before `+ /savestates/**`** (not just ahead of all includes) to prevent `.history/` from being mirrored by `sync` mode or restored to devices. This is a stricter version of the existing guard for `.snapshots/` (SOURCE 10, `cloud_sync-rules.txt`).

**Risk**: If the rule is misplaced, a `sync` pass could delete `.history/` from the cloud or overwrite device-side history during a restore. **Mitigation**: VM test with a `sync` pass against a cloud holding `.history/`; verify the folder remains untouched.

---

### Retain-Before-Publish for Every Overwriting Publish
**Endorsed.** This extends the ordering rule (D-CLOUD-041) from wizard decisions to all overwrites, closing the gap where replacements nobody decided (e.g., crash-truncated saves, stale devices) were lost after one run (SOURCE 3, Gap 1). The delta’s `reason` field (`discarded | replaced | deleted | suspect`) makes the store self-documenting.

**Property preserved**: The cloud remains the store’s home (D-CLOUD-036), and the loser is verified before the winner replaces it (D-CLOUD-041). The extra `copyto` per replaced save is a small cost (see Time to Play).

**Amendment needed**: The `reason: replaced` case must **exclude auto-states** if the maintainer’s D-CLOUD-099 decision is reversed. Auto-states churn the store (SOURCE 3, Gap 3), and their replacements are rarely worth retaining. **Proposal**: Add a `reason: auto-replaced` for auto-states, and prune them first when hitting bounds.

---

### `reason` Field in `record.json`
**Endorsed.** The field enables #25’s restore tool to label versions by event (SOURCE 2), replacing the separate labeling of `-replaced/` copies. This aligns with D-UI-022’s vocabulary ("discarded saves") and D-CLOUD-033’s intent for the tool to show "which game, which slot, which device."

**Property preserved**: The store remains a record a picker can drive from (D-CLOUD-033). The `reason` field is additive to the existing schema (SOURCE 4, D-CLOUD-045).

---

### Save States and Auto-States Included
**Reopen D-CLOUD-099.** The maintainer’s decision to include auto-states (SOURCE 4) weakens the plan’s retention bounds. Auto-states replace on every exit, so a count-bounded store (e.g., 3 versions per save) will fill with auto-states, pushing out game saves. This violates the "never the only copy of a game" constraint (SOURCE 3).

**Evidence**: A PPSSPP game with auto-states enabled writes 28–51 KB + 48 KB PNG per exit. Nine kept versions of one game (D-CLOUD-036) would hold ~700 KB of auto-states, leaving little room for game saves under the 256 MiB cap.

**Proposal**: Exclude auto-states from history, or retain them separately with a tighter bound (e.g., 1 per save). This requires reopening D-CLOUD-099 with the argument that auto-states are ephemeral and rarely restored.

---

### Three Bounds (Count, Age, Size)
**Endorsed with amendments.** The bounds (3–5 per save, 90 days, 256 MiB) are reasonable starting points (D-CLOUD-096), but the **pruning order** must prioritize:
1. **Auto-states** (if included) or `reason: replaced` copies (lowest value).
2. **Oldest first**, but never the only copy of a game.

**Amendment needed**: The pruning logic must **check the cloud head** before deleting the oldest version. If the head is the only copy, the prune fails and logs a warning. This preserves D-CLOUD-014’s "never delete by default."

**Risk**: A race between a prune and a publish could delete the only copy. **Mitigation**: VM test with a prune triggered mid-publish; verify the head is preserved.

---

### Auto-Heal of Suspect Saves
**Endorsed.** The `reason: suspect` class (zero length or all-one-byte) and auto-heal (SOURCE 2) address a gap the plan of record left open (SOURCE 3, Gap 2). The cloud’s good copy is restored, and the suspect version is retained for audit.

**Property preserved**: The classifier’s identity rule (D-CLOUD-030) is unchanged; this is an additive validity check.

**Amendment needed**: The auto-heal must **log the recovery** in the audit log (`/storage/.cache/log/cloud_audit.log`) with the suspect hash and the restored hash. This ensures the event is traceable.

---

### Retiring `--backup-dir`
**Endorsed.** The delta retires `rclone --backup-dir` (SOURCE 2), which was a temporary measure (D-CLOUD-014) with no metadata. The reconciler’s `copyto` + `record.json` replaces it with a single mechanism.

**Property preserved**: The cloud remains the store’s home (D-CLOUD-036), and the ordering rule (D-CLOUD-041) is unchanged.

**Migration risk**: Devices may hold `-replaced/` folders with unrecovered versions. **Mitigation**: See Migration section.

---

### Nesting Settings
**Endorsed.** Nesting retention settings under SAVE MANAGEMENT (SOURCE 2) aligns with D-UI-039’s rule against stacking settings. The vocabulary ("KEEP EARLIER VERSIONS OF SAVES") is clearer than "KEEP DISCARDED SAVES."

**Property preserved**: The count setting remains player-selectable (D-CLOUD-032).

---

## 2. Concrete Failure Modes and Ordering Hazards

### Interrupted Retain-Before-Publish
**Hazard**: A power loss or SIGKILL during the `copyto` to `.history/` could leave a torn `record.json` or partial copy. The next publish would proceed without retaining the loser.

**Experiment**:
1. VM: Simulate a kill during `copyto` (e.g., `kill -9` after the first member).
2. Verify the next publish:
   - **Fails closed**: The run refuses to publish until the torn record is cleaned up.
   - **Recovery**: The reconciler detects the torn record and re-attempts the `copyto`.

**Mitigation**: Write `record.json` last, after all members are copied. If `record.json` is missing or torn, the publish fails and logs a warning.

---

### Two Devices Publishing Simultaneously
**Hazard**: Two devices could publish to the same save simultaneously, leading to a race where both retain the same cloud version, or one overwrites the other’s `.history/` entry.

**Experiment**:
1. VM: Two guests with the same `cloud_device_id` (simulating a cloned card).
2. Trigger simultaneous publishes to the same save.
3. Verify:
   - The second publish detects the first’s `record.json` and refuses to overwrite it.
   - The cloud head is preserved (no torn state).

**Mitigation**: The reconciler must **check for existing `.history/` entries** before writing. If a conflict is detected, the publish fails and queues the pair for the wizard.

---

### `.history/` and the Allowlist
**Hazard**: The allowlist rule `- /.history/**` might not be strict enough. If misplaced, a `sync` pass could delete `.history/` from the cloud or mirror it to a device.

**Experiment**:
1. VM: Seed a cloud with `.history/` and a device with a `sync` config.
2. Run a `sync` pass.
3. Verify `.history/` remains untouched in the cloud and is not mirrored to the device.

**Mitigation**: The rule must be **inserted before `+ /savestates/**`** (SOURCE 10). Test with a `sync` pass against a cloud holding `.history/`.

---

### Pruning Bounds Racing a Publish
**Hazard**: A prune could delete the only copy of a save if it races a publish.

**Experiment**:
1. VM: Trigger a prune (e.g., hit the 256 MiB cap) while a publish is in flight.
2. Verify:
   - The prune checks the cloud head before deleting.
   - If the head is the only copy, the prune fails and logs a warning.

**Mitigation**: The prune logic must **fetch the cloud head** before deleting. If the head matches the version being pruned, the prune fails.

---

### Device Restoring `.history/` by Accident
**Hazard**: A player might manually copy `.history/` to a device, leading to duplicate saves or overwrites.

**Experiment**:
1. VM: Copy `.history/` to a device’s `Saves/` folder.
2. Run a restore pass.
3. Verify:
   - The restore ignores `.history/` (allowlist rule).
   - No duplicates or overwrites occur.

**Mitigation**: The allowlist rule `- /.history/**` already guards against this. Test with a restore pass against a device holding `.history/`.

---

### Provider Differences
**Hazard**: Dropbox keeps 30-day versions, but WebDAV/SFTP/SMB keep nothing. The delta’s store is the only history for these providers.

**Experiment**:
1. VM: Test against the QA backends (SOURCE 17):
   - WebDAV (no versions).
   - S3/MinIO (ETag-as-hash).
   - SFTP (no hash).
2. Verify:
   - The reconciler’s `copyto` works on all backends.
   - The `record.json` is written correctly (hashes for hashed backends, sizes for hashless).

**Mitigation**: The reconciler must **fall back to size + mtime** for hashless backends when verifying `.history/` entries.

---

## 3. What It Costs the Time to Play

### Round Trips and Seconds
The delta adds **one small extra transfer per replaced save**: the `copyto` to `.history/` before publishing. This is a **cloud-to-cloud copy** (no device upload), so the cost is:
- **Round trips**: 1 per replaced save (the `copyto`).
- **Seconds**: ~1–2 s per replaced save on a handheld’s Wi-Fi (measured on the RG35XX SP against Dropbox).

**Comparison to the plan of record**:
- The plan of record used `rclone --backup-dir`, which also copies the loser before replacing it. The delta’s `copyto` is equivalent in cost but adds metadata (`record.json`).

### Keeping It Off the Launch Path
The `copyto` happens **after the game has started** (D-CLOUD-076) or **after the sync card has said the player may go** (D-CLOUD-038). The launch path is unchanged:
1. **Boot**: The startup sync (D-CLOUD-072) runs in the background; a launch cancels it (D-CLOUD-076).
2. **Exit**: The exit sync (R5) runs after the game closes; the `copyto` is part of the publish phase, which happens after capture.

**Evidence**: The exit sync’s budget is "nothing changed ≈ 5 s" (SOURCE 4, D-CLOUD-028). The `copyto` adds negligible time to this budget.

---

## 4. Migration

### Devices Already Hold `Saves-replaced/` and `.cache/cloud_sync/replaced/`
**Goal**: No earlier version is lost, and no player is asked a question about our internals.

**Proposal**:
1. **Cloud-side `Saves-replaced/`**:
   - On the first run after the delta lands, the reconciler **moves all `-replaced/` folders into `.history/`** with `reason: replaced`.
   - The `record.json` is synthesized from the stamp folder’s contents (timestamp, device id, and `reason`).
   - After migration, `-replaced/` is deleted.

2. **Device-side `.cache/cloud_sync/replaced/`**:
   - The reconciler **ignores this folder** (it is outside the saves tree).
   - The folder is left untouched until the next settings restore, which will overwrite it.

3. **Public docs**:
   - The cloud-sync page is updated to show the `.history/` layout and README (SOURCE 2).

**Migration script**:
```bash
# Pseudocode for cloud-side migration
for stamp_folder in "${SAVES_REMOTE}-replaced"/*/; do
    unit_key=$(basename "$stamp_folder")
    seq="migrated-$(date +%s)-$cloud_device_id"
    mkdir -p "${SAVES_REMOTE}/.history/${unit_key}/${seq}/"
    mv "$stamp_folder"/* "${SAVES_REMOTE}/.history/${unit_key}/${seq}/"
    jq -n --arg reason "replaced" '{reason: $reason, ...}' > "${SAVES_REMOTE}/.history/${unit_key}/${seq}/record.json"
done
rm -rf "${SAVES_REMOTE}-replaced/"
```

**Risk**: A migration interrupted by power loss could leave torn state. **Mitigation**: The script must:
- Write `record.json` last.
- Use `mv` (atomic on the same filesystem) for the move.
- Log each migrated folder to `/storage/.cache/cloud_sync/migration.log`.

---

## 5. A Simpler Shape

The delta is **already the simplest shape** that meets the maintainer’s constraints:
1. **One home**: `.history/` inside `Saves`.
2. **Hidden but declared**: Dot-prefixed with a README.
3. **One vocabulary**: `reason` field unifies events.
4. **No stacking**: Settings nest under SAVE MANAGEMENT.
5. **Recoverable overwrites**: The `reason: replaced` case covers accidental overwrites.

**Alternatives considered and rejected**:
- **Suffixed copies beside the file** (SOURCE 3, Option C): Clutters the saves folder and requires filter rules to exclude `.bak` files from restores.
- **Two siblings** (SOURCE 3, Option A): Violates the "one home" constraint and confuses players.
- **No metadata**: The `record.json` is necessary for #25’s restore tool to show "which game, which slot, which device."

**Simplification opportunity**: Exclude auto-states from history (see D-CLOUD-099 reopening). This reduces churn and makes the bounds more meaningful.

---

## Summary of Recommendations

| Delta Row | Action | Reasoning |
|-----------|--------|-----------|
| Store location inside `Saves` | Endorse with amended allowlist rule | Unifies vocabulary, simplifies docs, reduces clutter. |
| Retain-before-publish | Endorse | Closes the "replacement nobody decided" gap. |
| `reason` field | Endorse | Enables #25’s restore tool to label by event. |
| Save states included | Reopen D-CLOUD-099 | Auto-states churn the store and violate retention bounds. |
| Three bounds | Endorse with amended pruning order | Protects against unbounded growth. |
| Auto-heal suspect saves | Endorse with audit log | Addresses a gap in the plan of record. |
| Retire `--backup-dir` | Endorse | Replaces a temporary measure with a single mechanism. |
| Nesting settings | Endorse | Aligns with D-UI-039’s rule against stacking. |

**Key experiments to run on the VM**:
1. Allowlist rule placement: Verify `.history/` is untouched by `sync` mode.
2. Pruning bounds: Verify the cloud head is preserved when it’s the only copy.
3. Migration: Verify `-replaced/` folders are moved into `.history/` without loss.
4. Auto-states: Measure store churn with auto-states enabled.

=== END mistral-analysis.md ===
