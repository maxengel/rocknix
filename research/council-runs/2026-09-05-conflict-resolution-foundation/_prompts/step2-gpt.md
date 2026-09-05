# Council — Step 2: peer review

You are one of five council members. In Step 1 each of you independently analysed
the foundational approach to cloud-save conflict resolution for ROCKNIX. The
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
  confidently wrong claim about `copyToSlot`, `getNextFreeSlot`, the allowlist,
  the boot script or a decision ID is the most valuable thing you can catch.
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

# Council analysis — Cloud-save conflict resolution foundation

**Verdict in one paragraph.** The identity decision (D-CLOUD-030) and the per-device manifest (D-CLOUD-031) are sound and should stand. The detection layer should be **replaced**: `rclone bisync` brings a second agreement record, a `--resync` requirement on every first run and after every filter-file change, log-text output that has to be grepped, and a listing model that cannot fit the game-exit budget — while the conflict test the design actually needs (schema §3) is a three-way comparison of *content hashes* that bisync does not perform. A listing-diff detector on `rclone lsjson --hash` + local `sha256sum` + `agreed.json` is smaller, JSON-native, and uses primitives this codebase has already fought with and won. Three things nobody has named will break the design as written regardless of detector: the conflict table has **no deletion row**, so D-CLOUD-030's compaction cannot converge and player deletions are immortal; `agreed.json` is **unscoped** to the remote and to the games card, so changing either turns "cloud changed" into a silent overwrite or a mass-delete; and the boot sync **races the emulator**, overwriting an open `.srm` under RetroArch's 10-second autosave. The wizard is well designed as a bulk tool but the commonest conflict — the auto state — belongs at game launch in `GuiSaveState`, where ES already asks "which state do you want to start from?"

Conventions: **[E path]** = evidence in the embedded corpus; **[I]** = my inference or judgement; **[K]** = my knowledge of rclone/RetroArch/Dropbox not in the corpus — treat every [K] as a hypothesis for the spike.

---

## 1. The foundation, end to end

### 1.1 Detection — **replace** bisync with a listing-diff detector

The approach as it stands: bisync 1.75.0 with `--conflict-resolve none` reports; we resolve; never `--resync`; `--conflict-loser` never renames a state; one lock [E `_sources/00-problem-statement.md`; `issues/issue-22.md`]. This is not a D-row; it rests on #22's ACs and on #9 being a dependency, so challenging it reopens nothing.

**Why bisync is the wrong shape for this design.**

1. *The design's A is a hash; bisync's A is a listing.* Schema §3 compares L, C and A as sha256 values [E `repo/docs/save-manifest-schema.md` §3]. bisync's prior-run state is `path1.lst`/`path2.lst` in the workdir, holding size, modtime and (optionally) the backend hash per path [K]. To turn a bisync verdict ("path1 newer") into a §3 verdict we would still keep `agreed.json` and still hash. Known unknown #2 asks whether bisync's state "duplicates or conflicts with our agreement record" — it duplicates it, and two records of "what we last agreed" is one more than a system whose signature failure is *reporting success while doing nothing* can afford [E `repo/.claude/rules/engineering-practices.md`].

2. *Every upgrading device's first run is a `--resync`.* bisync has no prior listings on a device that has been syncing with `copy --update` for months, and a first run without `--resync` fails [K]. `--resync-mode` defaults to `path1` — winner-picks-all over the whole tree [E `plans/conflict-resolution/vita-style-conflict-resolution.md` §4 step 2]. The AC "the first run is an explicit, maintainer-driven step" is fine for two bench devices and impossible for a shipped feature: `upgrade-and-install.md` says an upgrade must be invisible and a prompt is a failure mode [E `repo/.claude/rules/upgrade-and-install.md`]. The only safe first run on a populated device is *our* detector with A empty for every path — §3 row 5, "never agreed → ask" — which is the wizard, once. Nothing about bisync helps that.

3. *The filters file is rewritten on every OS update and `--resync` follows.* bisync stores a hash of its filters file and refuses to run when it changes [K — the planning note itself lists "filters or config changes require a `--resync` run" as an error to message, E `_sources/rclone-bisync-planning.md`]. `cloud_sync_helper` regenerates `cloud_sync-rules.txt` on every run and merges new defaults on every update [E `repo/.../cloud_sync_helper` `update_cloud_sync_rules`]; #25 will add `- /savestates/.snapshots/**` ahead of `+ /savestates/**` [E `repo/docs/save-manifest-schema.md` §8]. Under the "never `--resync` on its own" AC, the first update after the wizard ships stops sync on every device until someone SSHes in. Cheapest check: change one comment in the rules file, run bisync.

4. *bisync cannot fit the exit-sync budget.* D-CLOUD-028 is: one rclone spawn, never list the remote when nothing changed, ~5 s watched by a player who just quit [E `repo/docs/decision-register.md` D-CLOUD-028; `repo/.claude/rules/rclone-cloud-sync.md` § game-exit sync]. bisync lists both sides fully on every run by construction; and time-windowed filters (`--max-age`) make files "disappear" between runs, which bisync reads as deletions [K]. So bisync at game exit either lists the whole tree on every quit or is unsafe. Nobody has written down that #22's bisync and D-CLOUD-028 are in tension; blindspot 23 ("replaced mechanism") applies.

5. *Its report is log text.* We would grep INFO lines for `conflict` — the exact probe shape blindspot 22 and *Guards must fail closed* warn against [E `repo/docs/blindspot-register.md` 22; `engineering-practices.md`]. `lsjson` is JSON and `jq` is on the device [E `repo/docs/save-manifest-schema.md` §5].

**What replaces it — two tiers, one detector.**

*Full reconcile* (boot, SYNC row, and the wizard's pre-pass): one `rclone lsjson -R --hash remote:<SYNCPATH>/savestates …` plus the `.srm` paths [I: one recursive Dropbox listing is one or two paginated calls, K]; a local `find` over the sync root filtered by the same rules; hash locally only where (size, mtime) differs from the manifest's last entry; apply §3 per path in jq; emit three lists (download, upload, delete-to-propagate — see §1.2) and a `pending-conflicts.json`; transfer with `copy --files-from` in each direction, each with `--backup-dir` (see §1.6). No prior-listing state beyond `agreed.json`; no `--resync`; no filters-file hash.

*Gated push* (game exit): capture already knows the changed path set (it hashes to write entries). One `rclone lsjson --hash --files-from <changed>` on the remote [K: rclone lists only the parent directories of the named files — measure], compare each cloud (size, mtime, hash) against `agreed[path]`; push only paths whose cloud copy is unchanged since agreement; anything else becomes a pending conflict. Two spawns worst case, **zero when nothing changed** — better than today's one. This is what turns D-CLOUD-029's newest-wins push into a refused push without a `--update` stopgap.

The #22 ACs that survive: refuse divergent paths on all three entry points (proven with a constructed fixture); take the lock; treat a silent listing as *unknown* never "no conflict" (blindspot 22); replaced-mechanism inventory before the old pair goes. The ACs about `--resync`, `--conflict-loser` and the workdir become moot. #9 is demoted from hard dependency to "not needed".

If the council keeps bisync, the known-unknown-2 spike must additionally answer: filters-file change → resync required?; `--max-age` → phantom deletes?; wall time on the H700 vs Dropbox for the real tree; and the exact text of a both-sides-changed line so the guard can be proven to fire.

### 1.2 Identity and lineage — **endorse D-CLOUD-030, amend the conflict table**

**Endorse.** sha256 of stored bytes; slot and name as attributes; a move is the same hash at a new path [E `repo/docs/save-manifest-schema.md` §1]. The ES source supports it exactly: `renumberSlots()` moves via `copyToSlot(slot, true)`, which is `renameFile` [E `es/SaveStateRepository.cpp`; `es/SaveState.cpp`]. One supporting fact the corpus has not noticed: the incremental-savestate path in `setupSaveState` **copies the loaded state byte-for-byte into the next free slot before the game runs** and deletes that copy at exit if its MD5 is unchanged [E `es/SaveState.cpp` `mNewSlotFile`, `onGameEnded`]. That transient is a same-hash duplicate ES itself creates; if any sync runs during play it reaches the cloud; D-CLOUD-030's compaction is exactly the right cure for it. Keep the rule.

**Amend 1 — the conflict table has no deletion row, and without one the design does not converge.** Schema §3's last row, "only one side has it → one-way → transfer", ignores A [E §3]. With A known and equal to the surviving side's hash, "only one side has it" means *the other side deleted it since we agreed*. Consequences:

- A player deletes a savestate on device A (via `GuiSaveState`, which confirms). The cloud still has it; at the next sync it is "cloud-only" → downloaded → the deletion is undone, on every device, every time. The futro observes this about today's copy-only paths [E `vita-style-conflict-resolution.md` §1, "also the deleted state coming back"]; the new design inherits it unchanged. It is the "immortal conflicted copy" shape the changelog already describes [E `repo/docs/cloud-sync-changelog.md`, "Carrying them made them immortal"].
- D-CLOUD-030's compaction removes the higher-numbered duplicate *locally*. The cloud copy remains, is cloud-only at the next sync, is downloaded, is compacted again. Forever. And because `SaveState::onGameEnded` calls `renumberSlots()` whenever `config->incremental` is true — which the compiled default is [E `es/SaveStateConfigFile.cpp` `Default()` `incremental = true`; `es/SaveState.cpp` `onGameEnded`] — the gap compaction leaves is closed at the next game exit, i.e. another rename, another delete+create for sync to interpret. Note this corrects the IA doc's claim that renumbering happens only "after every savestate deletion" [E `repo/docs/conflict-wizard-ia.md` § What ES already does]: with the default config it runs after every exit of a game launched through the savestate manager.

Traced through with hash identity *and* deletion propagation, the renumber/compaction cases converge cleanly [I — worked example: B deletes slots 3,4 of {0..5} → renumber → {0,1,2,3=H5}; sync propagates delete 4,5 and "cloud changed" at 3; A, unchanged since agreement, ends {0,1,2,3=H5}. Same layout, nothing lost]. Without propagation they churn indefinitely.

So the table needs rows: *absent here, present there, A = there's hash* → **they kept, we deleted** → delete there (archived via `--backup-dir`, audit-logged); *absent here, present there, A ≠ there's hash* → **we deleted, they changed** → wizard (KEEP THEIRS / DELETE); *absent here, present there, A unknown* → one-way transfer (genuinely new). The cardinal rule is not touched: "never auto-delete the **loser**" is about a both-sides change; propagating the player's own explicit deletion, and removing a byte-identical duplicate, are neither. But this needs saying in the register, because the constraint as worded will otherwise be read to forbid it. And propagation needs the guard in §1.6 (mass-delete refusal), for the same reason D-CLOUD-014 exists.

**Amend 2 — `replaces` is not computable from the manifest.** After KEEP LEFT, device A's local file is B's version, but A's manifest still says the path holds A's last write. `replaces` must be derived from the hash on disk before the session (i.e. from `agreed.json` or a pre-launch hash), not from the manifest's previous entry [I]. Detail for #21, but it is the difference between lineage and fiction.

**Amend 3 — lineage "beyond one step lives in the audit log" [E §2] is false after rotation.** D-CLOUD-027 rotates at 1 MiB keeping one predecessor [E decision-register]. Say plainly that lineage is one step deep plus whatever the log still holds; do not build anything on the longer chain.

### 1.3 The manifest — **endorse D-CLOUD-031's shape, define its reader semantics**

**Endorse:** one JSON per device under `savestates/.rocknix/`, each device writes only its own, in-game saves described by relative path, agreement record unsynced [E `repo/docs/save-manifest-schema.md` §5]. The allowlist fixture makes the location forced, not chosen [E `vita-style-conflict-resolution.md` §1].

**Amend 1 — "readers take the union" is undefined on the collision that always happens.** Entries are keyed by path [E §5]. Every `.state.auto` and every `.srm` of a game played on two devices exists in both devices' manifests under the same key. A merge of maps must pick one. The resolution that matches D-CLOUD-030: **lookup is by (path, sha256), never by path alone**; a manifest entry describes *a version*; the wizard finds the cloud side's provenance by matching the cloud file's hash against every manifest's entry at that path, and the local side's the same way. This also fixes the display semantics: after KEEP LEFT, the "THIS DEVICE" column for that path shows the *originating* device (from B's manifest), because side is where the bytes sit and provenance is whose they were. The schema's words already say this; §5's JSON shape and "union" do not.

**Amend 2 — `agreed.json` must be scoped to the remote and the sync root.** §7's `agreed.json` has no field naming the remote or `SYNCPATH` [E §7]. Change the cloud folder (`CHANGE CLOUD FOLDER` exists [E `repo/docs/es-menu-map.md`]) or the provider: every A now describes a conversation with a different cloud. If the new folder holds another library, `L = A, C ≠ A` → "cloud changed" → **silent download over local**. Record `remote`, `SYNCPATH` and (see §3.3) the games-card identity in `agreed.json`; on mismatch discard it, so everything falls to "never agreed → ask". Cheapest experiment: seed two folders on the QA backend, switch `SYNCPATH`, dry-run.

**Amend 3 — `remote_hash` as specified needs a listing after every upload,** which is a second round trip D-CLOUD-028 forbids, and the manifest that rides in the same pass cannot contain it anyway [I]. Two fixes: (a) in the gated push, the listing runs *before* the copy (it is the gate), so record from it the cloud's pre-state and, after the copy, our own (size, mtime) which rclone preserves onto Dropbox [E §7: "modification times equal to the device's"]; (b) where the backend hash is computable locally — Dropbox's content hash for a file under 4 MiB is sha256 over the file's 32-byte sha256; S3 single-part md5; OneDrive QuickXor via `rclone hashsum` [K] — compute it rather than fetch it. Verify (b) with one `rclone hashsum dropbox` against one `lsjson --hash`.

**Amend 4 — upload ordering.** One `rclone copy` transfers in parallel; the manifest may land before the file it describes. The reader rule must be: an entry whose hash does not match the file it names is *stale*, and the file is `unknown` until it does [E `issues/issue-20.md` first comment already asks for this]. Never trust an entry without checking its hash against the object.

**Amend 5 — growth and pruning.** Entries are never removed as written. A device with 500 games rewrites and re-uploads a growing file every exit. Prune entries whose path no longer exists locally (their history is the audit log); this is safe only once deletions propagate (§1.2).

**Amend 6 — one field the panels are starving for: `session_seconds`.** #23 decided "no play time" and #21 withdrew the request to capture `gametime` [E `issues/issue-23.md`; `issues/issue-21.md`]. Neither is a register row. The cumulative figure was rightly rejected — "more hours does not mean further along". But *the length of the session that produced this version* is per-version, not cumulative, is known at capture (`launchGame` computes `elapsedSeconds` [E `es/FileData.cpp.launchGame-excerpt`]; for a numbered state, file mtime − launch time), and is precisely the signal that separates "I played for an hour on the train" from "I opened it and quit". Without it, see §1.4: the wizard's only differentiators are the thumbnail and the timestamp.

**Also:** the SQLite index the IA doc still carries [E `conflict-wizard-ia.md` § Where state lives] should be dropped; 50–2,000 entries is `jq` territory, and D-CLOUD-027's text log plus the JSON files rebuild everything. One fewer thing, per D-CLOUD-027's own "#20's call".

### 1.4 Presentation and resolution — **endorse the wizard as the bulk tool, amend where the common case is handled**

**Endorse:** genuine forks only; cloud-only down and device-only up silently; system→game walk; fixed columns; highlight-on-select; KEEP BOTH dimmed-with-reason on in-game saves; nothing transfers until COMPLETE; quitting discards [E `repo/docs/conflict-wizard-ia.md` rev 4].

**Amend 1 — the auto state is a launch decision, not a wizard item.** The corpus predicts `.state.auto` is the commonest conflict [E `repo/docs/save-manifest-schema.md` §4] and asks the wizard to treat it as a resume point [E problem statement, unknown 3]. ES already has the resume-point UI: `GuiSaveState` opens at launch when savestates are enabled and offers the auto save and every slot as tiles with `emulator: core` per slot [E `repo/docs/es-menu-map.md`; `issues/issue-37.md`]; `SaveStateRepository::getGameAutoSave` finds the auto slot [E `es/SaveStateRepository.cpp`]. Add the cloud's auto state as a tile — "☁ Anbernic RG353M · yesterday 22:10", thumbnail fetched in the pre-pass — and the player's pick *is* the resolution: the chosen version becomes the session's start; the other is materialised to the next free slot (KEEP BOTH implicit, `getNextFreeSlot`); at exit RetroArch writes a new `.state.auto` descending from the chosen one and the gated push sends it. This is what the Vita does, it is one decision at the moment the player has context, and it uses #37's tile — which §3.5 below argues is mandatory anyway. The wizard remains for the backlog and for `.srm` conflicts, which get a two-choice dialog at launch ("Continue with the save from RG353M / from this device / decide later").

**Amend 2 — name the other device, not "CLOUD".** The cloud is the medium; the version came from a device the manifest can name (`device.label`). Column header: "ANBERNIC RG353M" vs "THIS DEVICE"; fall back to "CLOUD" only for `unknown`. The player's mental model is "the one I played on the couch", not "the one in Dropbox".

**Amend 3 — the information design currently routes recency through the player's thumb.** Each panel shows date, time, device, core [E IA § What each kind shows]. For an `.srm` (glyph, no picture) the *only* difference between the panels is the timestamp; for two `.state.auto` files of an RPG, both thumbnails are often the same pause menu. A player shown two identical pictures and two times will pick the later one — the design has moved newest-wins from the code into the UI. `session_seconds` (§1.3) is the cheapest honest counter-signal. Measure the premise: after a week of two-device play, how many real conflict pairs have visually distinguishable thumbnails? If under half, the picker's advantage over a list is smaller than the wireframes assume.

**Amend 4 — thumbnails for the cloud side are one `rclone copy` each** [E schema §6 `screenshot`]. Ten conflicts is ten spawns and ten round trips before the first screen. Fetch all of them in the pre-pass with one `--files-from`.

**Amend 5 — first-run scale.** On an upgrading device the first reconcile has A empty everywhere; every differing path is a conflict [E schema §3 row 5]. Expect dozens of stale auto states. Offer, for `kind: auto` only, a bulk "keep this device's / keep the other device's for all remaining" — a choice by *side*, not by time, so it does not violate the rule — and make COMPLETE a different button from CONTINUE so a mashed A cannot apply.

### 1.5 Merge semantics — **amend three things the IA leaves implicit**

**KEEP BOTH must say which version stays at the contested path.** Local `state3 = H_L`, cloud `state3 = H_C`. One stays at 3, one goes to `getNextFreeSlot()`. Traced through the §3 table on device B (which wrote `H_C`), either assignment converges to the same layout on both devices [I]: B's slot 3 is replaced by the download and its own state reappears at the new slot — lossless but a *silent change to B's numbering*, worth an audit line and a tile badge. For a numbered slot the choice is cosmetic. For `.state.auto` it is the resume point, and the IA is silent; §1.4's launch-time framing answers it.

**The pre-pass gate is necessary and not sufficient.** "Free on device equals free on both once every cloud-only file is down" [E IA § Flow] holds only if no other device uploads between the pre-pass and COMPLETE. Two devices online is not enforced [E problem statement, unknown 10] and the person testing this has two H700s on one bench. Cheap fix: at COMPLETE, one `lsjson` of the target slot paths; if any now exist, download them and re-run `getNextFreeSlot()` before uploading, or refuse with "the cloud changed while you were deciding". Plus an advisory cloud lock (§2, unknown 10).

**KEEP BOTH is RetroArch-only, and needs the game locally.** `getNextFreeSlot` returns -99 unless `isEnabled(game)`, which requires `emulator == "retroarch"` and a `FileData*` [E `es/SaveStateRepository.cpp`]. A state for a game whose ROM is no longer on this device, or any standalone emulator's state, cannot be re-slotted. The dimmed-with-reason treatment should extend to those, and the wizard must resolve path → system → `FileData` for `unknown` entries by the same regex ES uses [E `es/SaveStateConfigFile.cpp` `SetupRegEx`]. Note also that with `nofileextension = true` (the default) `{{romfilename}}` is the ROM's *stem*, so the schema's "for a state this is what `{{romfilename}}` stood for" [E schema §6 `rom`] is imprecise; the `rom` field with extension is right, the gloss is wrong.

**`copyToSlot` is not the merge primitive for the cloud copy.** It moves an existing *local* `SaveState` [E `es/SaveState.cpp`]. The cloud's loser is downloaded to a temp path and written to `makeStateFilename(N)` (and its `.png` to the image name) — the IA's "via `copyToSlot`" [E IA rev 4] is the pattern, not the call.

### 1.6 Safety and rollback — **amend: the minimum safety net is free and should be on by default**

*Keep discarded saves* is off by default [E IA § Settled; not a D-row]. The reason given was retention; the count solves that. The reason to reverse it: this subsystem shipped four silent-success bugs [E `engineering-practices.md` § Verify the artifact]; the first shipped conflict resolution will have one; the losing copy of a 40 KB state is nothing on a card. And rclone gives the mechanism for free: every transfer the reconcile makes can carry `--backup-dir` — the local downloads to `/storage/.cache/cloud_sync/replaced/<date>/`, the uploads to a dated sibling of `SYNCPATH` exactly as D-CLOUD-014 already does for `sync` [E `repo/.../cloud_backup` `--backup-dir`]. Overwritten and deleted files are moved aside by rclone itself, atomically, per path. A retention sweep bounds it. #25's rollback then has a substrate and "keep discarded saves" becomes a retention knob over something that always exists. Default on, small bound.

**The apply phase needs a journal.** "Nothing transfers until COMPLETE" [E IA] says nothing about COMPLETE being interrupted — a Wi-Fi drop after three of seven resolutions, or ES abort()ing mid-apply (which it does; supervisor restarts it [E `engineering-practices.md`]). Write the plan to a file first; apply per path atomically (download to temp + rename; `copyto` up); mark each done; a re-run finishes or re-detects. The audit line before the deletion [E futro §4] is the right instinct; the journal is its generalisation. And the apply step runs in a script under the lock, not in ES, so ES's death does not stop it.

**A mass-delete guard is mandatory once deletions propagate (§1.2).** If `/storage/roms/savestates` is missing, empty, or a different card (§3.3), every agreed path reads as "deleted locally". Refuse to propagate more than N deletions or any deletion when the local sync root is empty or absent; require an explicit action. This is D-CLOUD-014's 70-file incident in new clothes [E decision-register D-CLOUD-014].

### 1.7 Migration off the shipped write paths — **endorse D-CLOUD-029, supply the sequence and one race**

Today, verified in source: boot runs `cloud_restore --yes --method=copy --update` then `cloud_backup --yes --method=copy --update` behind a `ping google.com` loop, with a comment that says "keeps the newest copy of every save on both sides" [E `repo/.../autostart/102-cloud-saves`]; game exit runs `cloud_backup --yes --saves-only --recent`, which forces `copy` with `--max-age … --no-traverse` and no `--update` [E `es/FileData.cpp.launchGame-excerpt`; `repo/.../cloud_backup` `--recent` block]. Newest-wins, as blindspot 28 says. D-CLOUD-029 leaves it until #22 replaces it wholesale [E decision-register]. Endorse the call; the sequence is missing:

1. Land capture (#21) and the manifest first; the shipped paths keep running — the manifest rides `--recent` [E alignment review §3.3].
2. Land the detector in *dry-run* alongside the old paths: it writes `pending-conflicts.json` and the audit log, transfers nothing. Compare its verdicts against what the old paths actually did, for a week, on the maintainer's devices. This is the guard being seen to fire before it is trusted.
3. Swap the game-exit path to the gated push. Swap boot and the SYNC row to the full reconcile with conflicts refused. The first reconcile on each device is the wizard with A empty.
4. Replaced-mechanism inventory [E futro §4]: `--update`'s newer-skip → the agreement gate; restore-before-backup → one reconcile does both directions; the lock → kept; `--recent`'s window → the manifest path-set diff (see §3.2: the window was rename-blind anyway); the stamps → kept; `ping google.com` → `cloud_setup --check` [E alignment review §3.7]; ES's "A CLOUD SYNC IS ALREADY RUNNING" only knows ES-started syncs [E `es/ThreadedCloudSync.cpp` `mInstance`] — the autostart sync is invisible to it; unify through the lock's exit 3 or move boot sync into ES.

**The race the migration must fix on the way.** `102-cloud-saves` backgrounds the restore for up to 60 s after boot; a player launches a game in that window as a matter of course. `cloud_restore` then writes `<system>/<game>.srm` **while RetroArch has that SRAM in memory and flushes it every 10 s** (`autosave_interval = "10"` [E schema §4]). The cloud's newer save is overwritten by the next flush and the restore's stamp says success. The lock serialises syncs against syncs, not against the emulator. Nothing in the corpus names this. The boot sync must not write under the sync root while a game runs — move it into ES where `mRunningGame` is known, or gate on `pgrep retroarch`, or defer the download half until ES is idle. Cheapest experiment in §4, item 1.

### 1.8 Register rows and settled items I would reopen or amend

| Item | Status | My position |
|---|---|---|
| D-CLOUD-030 identity | decided | **Endorse.** Amend: compaction must remove the cloud copy too (or keep tombstones), and the conflict table needs deletion rows or compaction never converges. |
| D-CLOUD-031 manifest | decided | **Endorse shape.** Amend: lookup by (path, sha256); `agreed.json` scoped to remote + sync root + card; `remote_hash` computed locally or from the gate listing; prune on propagated delete; add `session_seconds`. |
| D-CLOUD-028 exit-sync budget | decided | **Endorse.** It is why bisync cannot be the exit detector. |
| D-CLOUD-029 no stopgap | decided | **Endorse**, with the sequence above and the boot-vs-play race fixed in step 3. |
| D-CLOUD-027 audit log | decided | **Endorse.** Do not claim lineage beyond rotation; write JSONL so `jq` can read it. |
| D-CLOUD-025 #19 first | decided | **Endorse and escalate**: the maintainer's RK3326, RK3566 and H700s already share one cloud folder under `copy`, so cross-chipset states are being placed today. |
| D-CLOUD-022 conflicted copies | decided | **Endorse**; extend the class to `*.partial`, `._*`, `.DS_Store`, `desktop.ini`, Syncthing markers (§3.6). |
| bisync as detector (#22 ACs, #9) | not a D-row | **Replace** (§1.1). |
| keep-discarded off by default (IA rev 3) | not a D-row | **Reverse**: default on, bounded, via `--backup-dir` (§1.6). |
| no play time (#23) | not a D-row | **Partially reverse**: `session_seconds` per version, never cumulative, never sorted by (§1.3). |
| wizard as sole surface (IA) | not a D-row | **Amend**: auto-state and single-game resolution at launch in `GuiSaveState`; wizard for the backlog (§1.4). |
| "never auto-delete the loser" | constraint | **Not challenged**; its scope must be written down: player deletions propagated with a mass-delete guard, and byte-identical duplicates compacted, are not "losers". |

---

## 2. The eleven known unknowns

**1. Chipset axis; loud or silent.** Run `docs/savestate-compat-test.md` as written, same build on all devices [E `repo/docs/savestate-compat-test.md`]. Two additions. First, Test C step 3 with compression on will almost certainly be *loud for the wrong reason*: RZIP chunks are zlib streams with checksums, so a flipped byte fails decompression before the core sees it [K]; only the compression-off variant answers the question, and the protocol already says so — make it the primary run. Second, record RetroArch's logged serialize size per core per device; a size match with a garbage load is the silent case the badge exists for. Before #23's badge; not before #20/#21/#24 — the futro is right. But per D-CLOUD-025's escalation above, run it *first* on the bench because the shipped `copy` is already mixing families.

**2. bisync against a real remote.** Re-framed by §1.1. If bisync is dropped, the spike becomes: `lsjson -R --hash` wall time on the H700 against Dropbox for the real tree (the number that decides whether the full reconcile is a boot job or a menu job); `lsjson --hash --files-from` cost for one to three paths (decides the exit gate's budget); Dropbox hash computed locally equals the listing's (decides `remote_hash`); Unicode/case round trip (§3.5). If bisync is kept: filters-file change → `--resync` demanded?; rename → delete+create confirmed; `--recover` after `kill -9` mid-run; the literal text of a both-sides line; `--max-age` behaviour. On the device against Dropbox, then the loopback WebDAV (no hashes, no modtimes), then MinIO. Before any #22 code.

**3. Auto states.** Already the corpus's prediction, not a measurement [E schema §4]. Measure on the maintainer's two H700s after a week: count `.state.auto` vs numbered states, and how many auto pairs differ. Re-frame per §1.4: it is a launch decision in `GuiSaveState`, and `getGameAutoSave` is the hook [E `es/SaveStateRepository.cpp`].

**4. Pre-pass gate.** Mis-framed as sufficient; it is necessary (§1.5). Add the COMPLETE re-check. Interruption: the pre-pass is `copy --files-from`, idempotent; the wizard refuses to open until a *completed* pre-pass is stamped; re-run finishes. Experiment: `kill` rclone mid-pre-pass, re-run, assert the stamp is absent then present and no file is torn (rclone writes `.partial` and renames [K] — which is itself §3.6's problem).

**5. `es_savestates.cfg`.** Not embedded; the corpus says none ships [E alignment review §2]. The ES source answers more than "where is it": `SaveStateConfigFile()` sets `racommands = false` unconditionally for every emulator read from the file, and `autosave`/`incremental` default to *false* unless the XML says `"true"` [E `es/SaveStateConfigFile.cpp` constructor]. The compiled `Default()` is `racommands = true, incremental = true, autosave = true`. **Shipping any `es_savestates.cfg` for #10 flips every RetroArch system onto the non-`racommands` launch path** (`setupSaveState` builds different command lines; the `.auto`/`.bak` dance disappears) [E `es/SaveState.cpp`]. That is a behavioural change across the whole savestate manager, not "a config change rather than new code" [E `issues/issue-10.md`, 2026-08-19 comment]. Separately, RetroArch's own `sort_savestates_enable` (false on all 13 configs [E `issues/issue-10.md`]) sorts by the core's *library name* (`mGBA`), while ES's `{{core}}` substitutes the libretro name (`mgba`) [K] — the "two consumers, one layout" trap with a specific mismatch. Experiment before #10: flip `sort_savestates_enable`, save a state, `ls`; then add a minimal `es_savestates.cfg` and `strings`/behaviour-check that autosave and incremental still work.

**6. Core build pin.** #21 emits `/usr/share/rocknix/core-pins` from `LIBRETRO_CORES × get_pkg_version` and a name→package map [E alignment review §3.3]. The map is the fragile part (`libretro-snes9x2010` vs `mgba-lr` naming). The build tree knows which package installed each `*_libretro.so`; generate the pin keyed by `.so` basename mechanically at image time rather than by a hand table. Also: `PKG_VERSION` identifies *source*, and a toolchain bump can change the binary without changing it; a sha256 of the `.so` identifies the binary but differs per device family (`-mcpu`), so it would defeat the very comparison #19 wants. Record both; compare on `core_build`. And #21 should pass the core that *ran* — `setupSaveState` rewrites `-core` when loading another core's state [E `es/SaveState.cpp`], so `getCore(true)` at exit can name the wrong one.

**7. `BACKUPPATH == RESTOREPATH`.** `cloud_sync.conf` advertises making them differ ("will prevent data from being replaced on restore") [E `repo/.../cloud_sync.conf`]. Fail closed: the detector refuses to run when they differ, with one sentence why. Not a warning.

**8. Multi-file and shared-container saves.** Per-path identity is wrong for two classes. PPSSPP writes a directory per save (`PARAM.SFO`, `ICON0.PNG`, `SAVEDATA.BIN`) [K]; the wizard would show three conflicts for one save and a mixed resolution corrupts it. The manifest needs an atomic-unit notion — entry key = the save directory for `psp/PPSSPP/**`, hash = hash of sorted member hashes. Shared containers (DuckStation `psx/memcards/*.mcd`, Flycast VMU) hold many games' progress; choosing a side is *guaranteed* to lose someone's progress — the canonical "newer holds less" case. V1 must refuse to auto-pick and should offer KEEP BOTH as a renamed card where the emulator can address more than one; block-level merge (PSX memcards are 15 independent 8 KB blocks with a directory frame [K]) is a V2 the cardinal rule's "prefer merging" invites. Experiment: play a PSP game on two devices, hash the save directory members, count what differs.

**9. 480×320.** Lay out there first, as the futro says. One mitigating fact: RetroArch thumbnails are native framebuffer size — 240×160 for GBA, 320×240 for PSX [K] — so two side-by-side at ~230 px are near-native for 8/16-bit and only mildly downscaled otherwise. If they still do not read, flip-compare (one image, L/R toggles sides) beats side-by-side for spotting differences. `tools/vm-visual-qa` frames at both sizes.

**10. Two devices online.** Unenforceable in general; make it *unlikely to hurt*: the COMPLETE re-check (§1.5), and an advisory lock object `savestates/.rocknix/lock-<id>` with a timestamp, written before the pre-pass and removed at COMPLETE; other devices' reconciles exit 3-style ("another device is resolving conflicts") while it is fresh. Object storage locks are racy, which is acceptable for an advisory guard with a TTL [I]. Experiment: both H700s, one in the wizard, the other exiting a game.

**11. Round-trip suite.** Run it. Add: the both-sides-changed step (futro); the manifest step (alignment review §3.6); a **two-VM** variant against the QA backend so the two-device cases (KEEP BOTH collision, deletion propagation, compaction convergence) are exercised — one VM cannot demonstrate any of them, exactly as the suite's own comment says about the archive collision [E `repo/tools/cloud-round-trip`]. Note the QA WebDAV has neither hashes nor modtimes, so the suite exercises the size-plus-sha256-after-download fallback and *nothing else*; the Dropbox path (hash from listing) is never covered without a real remote. Blindspot 8 applies.

---

## 3. What nobody has named

Each with the cheapest experiment. Ordered by how much of the design it can invalidate.

**3.1 The boot sync races the running emulator** (§1.7). `102-cloud-saves` downloads into `/storage/roms/<system>/` while RetroArch may hold that `.srm` open and flush it every 10 s [E `autostart/102-cloud-saves`; schema §4]. Savestates are safer (loaded on demand) but the `.state.auto`/`.bak` rename dance during play [E `es/SaveState.cpp` `setupSaveState`] means a mid-play backup uploads `game.state.auto.bak` — which `+ /**/*.state*` and `+ /savestates/**` both admit [E `cloud_sync-rules.txt`], which ES's regexes do not match, and which will come back down forever. *Experiment:* startup sync on; plant a newer `.srm` in the cloud; boot; launch that game within 10 s of Wi-Fi; exit; `sha256sum` the local `.srm` against the planted one; `rclone lsf` for `.bak`. Fifteen minutes; two possible data-loss findings.

**3.2 Rename preserves mtime, so time windows are blind to renumbering.** `renumberSlots` uses `renameFile` [E `es/SaveState.cpp` `copyToSlot(move=true)`]; `rename(2)` does not touch the inode's mtime [K]. So a state that moved slots is *outside* `--recent`'s `--max-age` window and is never pushed at game exit — today's exit sync misses every renumber, and any capture step that finds "what changed" by mtime will miss moves too. The manifest's "a move updates the key" requires a path-set diff, not a time filter. *Experiment:* `stat -c %Y` a state, delete a lower slot in `GuiSaveState`, `stat` the moved file. Two minutes.

**3.3 The games card is not the OS card, and `agreed.json` does not know which card it is describing.** ROCKNIX mounts `/storage/roms` from a second SD card on two-slot devices such as the RG353M [K — verify on the bench]. `agreed.json` lives in `/storage/.cache` on the OS card [E D-CLOUD-031]. Swap games cards and every agreed path is "deleted locally"; with deletion propagation (§1.2) that is a cloud wipe; without it, the other card's saves are downloaded onto this one. Either scope `agreed.json` by the card's filesystem UUID, or keep it *on the games card* at `<sync root>/.cloud_sync/agreed.json` — excluded by `- /**` since no `+` rule matches it (verify with the allowlist fixture) — so the agreement travels with the tree it describes. This amends D-CLOUD-031's location, not its unsynced status. The mass-delete guard (§1.6) is the backstop. *Experiment:* `mv /storage/roms/savestates /storage/roms/savestates.off` and dry-run the detector; it must refuse.

**3.4 The path-keyed identity assumes the remote returns the same bytes for a name.** Dropbox is case-insensitive and may return Unicode in a normalised form [K]; macOS-sourced ROM names copied over SMB are frequently NFD; `Pokémon - Edición Roja.state1` is not an edge case in this hobby. If `lsjson` returns NFC and the manifest key is NFD, every accented ROM's cloud side is `unknown` and, worse, may be a phantom "cloud-only" download beside a phantom "device-only" upload — the same file twice, forever. *Experiment:* create `Pokémon.state1` (NFD) locally, upload, `lsjson`, `jq` the key equality; repeat with `MSLUG.state1`/`mslug.state1`. Ten minutes.

**3.5 The tile badge (#37) is the only place a silently-downloaded incompatible state can warn.** Cloud-only downloads never open the wizard [E IA § Scope]. Until #10 exists, a state written by `snes9x2010` on device B lands in the flat `snes/` directory on device A, where ES attributes it to the single default config and launches the default core with it [E `es/SaveStateRepository.cpp` `refresh`; `es/SaveStateConfigFile.cpp` `getSaveStateConfigs` returns `Default()` when no cfg]. D-CLOUD-017's "warn, do not block" has no warning surface for this path except the savestate manager's tile. #37 is therefore not polish; it precedes turning on any two-way sync that can carry cross-core states — which, per §1.8, the shipped `copy` already does. *Experiment:* two cores for one system on the bench (e.g. `snes9x` and `snes9x2010`), state from one, load via the other's default; note whether the tile gives any hint.

**3.6 The allowlist admits junk by directory that neither ES nor the player can see.** rclone downloads to `<name>.partial` and renames [K]; a power loss leaves `game.state1.partial`, which `+ /savestates/**` and `+ /**/*.state*` both pass [E `cloud_sync-rules.txt`], ES's regex ignores, and every device then re-uploads. Same for macOS `._game.state1` (AppleDouble), `.DS_Store` (rewritten constantly → perpetual "cloud changed"), `desktop.ini`, Syncthing `.stfolder`. D-CLOUD-022's class is broader than "conflicted copies". *Experiment:* plant one of each in the cloud under `savestates/`, sync, `ls -la` on the device, sync again, `rclone lsf` — count copies.

**3.7 KEEP BOTH's cloud-side upload assumes a `FileData` the device may not have** (§1.5). A conflict for a game whose ROM was removed locally (states kept) cannot call `getNextFreeSlot` [E `es/SaveStateRepository.cpp` `isEnabled`]. *Experiment:* delete a ROM, keep its states, construct a conflict, watch what the wizard offers.

**3.8 A reflashed device regenerates the same id and inherits its own stale manifest.** `cloud_device_id` seeds from the permanent MAC precisely so a reflash finds its own folder [E `repo/.../cloud_device_id`]. So a reflashed handheld downloads `manifest-<its own id>.json` describing files it no longer knows it wrote; if the capture step then *regenerates* the manifest from local files rather than read-merge-write, it overwrites the cloud's copy and every pre-flash state becomes `unknown`. The alignment review's "a fresh handheld receives every other device's manifest and none of its own" [E §2] is wrong for this — the commonest — fresh-handheld case. *Experiment:* delete the local `cloud_sync-device-id`, regenerate, compare; then plan capture as merge.

**3.9 The exit-sync capture must run under the same lock as the transfer, and the manifest must be written *before* the copy that carries it — yet ES calls one command** [E `es/FileData.cpp.launchGame-excerpt`]. Two spawns in sequence from ES, or `cloud_backup` invoking capture internally; either way the lock is taken once, and an exit-3 skip (boot sync holding the lock) must *not* skip the manifest write — otherwise a state played during the boot window is never captured and is `unknown` forever. *Experiment:* hold the lock, exit a game, check the manifest.

**3.10 ES reads script output through `GetShOutput`, which joins lines** [E `repo/docs/blindspot-register.md` 3]. A pretty-printed conflict JSON read that way is one mashed string. The wizard reads a *file* the detector wrote, or `jq -c`. Trivial, and it has bitten before.

**3.11 Clock and RTC.** Devices without a battery-backed RTC boot with the last-saved time until NTP [K — check `hwclock` on each family]; `clock_synced` handles display [E schema §6]. But the shipped `--recent` window compares a real-time stamp against a possibly-behind file mtime and excludes it; the boot pass catches it [E `cloud_backup` comment]. The new detector is hash-based and immune — one more reason not to build detection on time. *Experiment:* `timedatectl` on each family with Wi-Fi off; note drift after a day powered down.

**3.12 Human factors — the wizard is a prompt at the wrong moment.** Detection fires at boot (background — no one is looking) and at game exit (the player wants the next game). Neither is when the decision has context. A pending-conflict count on the CLOUD SETTINGS row plus a launch-time gate for affected games (§1.4) puts the decision where the Vita puts it. *Experiment:* none needed; observe the maintainer's own reaction the first time the wizard opens after a quit.

---

## 4. What must be proven on hardware, in order

Each item: substrate, time, and which decision falls if it fails.

1. **Boot sync vs. running emulator** (§3.1) — RG35XX SP + Dropbox, 15 min. *If the cloud `.srm` loses:* the boot sync cannot stay an autostart script; it moves into ES or gates on the emulator before any other work. Also settles whether `.bak`/transient slot copies leak.

2. **Rename preserves mtime** (§3.2) — RG35XX SP, 2 min. *If true (expected):* capture and the exit gate diff by path set, never by mtime; `--recent`'s window is retired without a replacement of the same shape.

3. **`lsjson -R --hash` and `lsjson --files-from` timings on the H700 against Dropbox** (§1.1) — 20 min. *If a full listing exceeds ~4 s:* the full reconcile is boot/menu-only and the gated push stands. *If `--files-from` traverses the whole tree:* the exit gate uses per-file `lsjson --stat` for ≤3 paths, or accepts one full listing per exit and D-CLOUD-028 is amended.

4. **Unicode/case round trip** (§3.4) — 10 min. *If keys differ:* normalise keys on both sides before any manifest is written; #21 gains an AC.

5. **Dropbox hash computed locally equals the listing's** (§1.3) — 5 min. *If not:* `remote_hash` comes from the gate listing only, or is dropped in favour of (size, mtime).

6. **Games-card swap and empty-root refusal** (§3.3) — RG353M, 10 min. *If `/storage/roms` is a separate card:* `agreed.json` moves to the sync root or is UUID-scoped; the mass-delete guard is an AC on #22.

7. **`sort_savestates_enable` flip and a minimal `es_savestates.cfg`** (unknown 5) — 20 min. *If RetroArch's core directory name ≠ ES's `{{core}}`:* #10 needs a mapping table or ES-side `defaultCoreDirectory` gymnastics. *If autosave/incremental behaviour changes with the cfg present:* #10's mechanism is redesigned before any layout migration.

8. **#19 protocol** — bench, ~1 h. *If cross-family loads work:* badge is a convenience; #10's per-core layout stays for core separation only. *If failure is silent with compression off:* badge is a safeguard and the tile badge (#37) blocks rather than warns.

9. **Two-device both-sides-changed under the shipped paths** — two H700s, 20 min. Documents the incident the pre-mortem imagined [E futro §4] and gives the round-trip suite its baseline fixture.

10. **Two-core state attribution in the flat layout** (§3.5) — 15 min. *If ES launches the wrong core silently:* #37's badge precedes enabling any two-way sync in the shipped build.

11. **Junk-file immortality** (§3.6) — 10 min. Fixes the allowlist before the detector exists to be confused by it.

12. **bisync spike** — only if §1.1's replacement is rejected. Then filters-file change, `--max-age`, `--recover`, both-sides text, wall time, in that order.

13. **480×320 frames** — `tools/vm-visual-qa`, after a conflict JSON fixture exists.

The first six take under two hours on the bench and each can invalidate a design decision. Nothing in #21 or #22 should be written before items 1–6 have been run; #23's layout can proceed in parallel once #22 produces a fixture; #10 waits on item 7; the badge waits on item 8.

=== END claude-analysis.md ===

=== START gemini-analysis.md ===

### 1. Is this foundation sound, end to end?

The foundation is exceptionally well-reasoned but contains two critical structural flaws in its detection and write-path migration strategies. 

**Detection (`rclone bisync`): Amend.** 
Relying on `rclone bisync` with `--conflict-resolve none` (`research/council-runs/2026-09-05-conflict-resolution-foundation/_sources/issues/issue-22.md`) is dangerous for a handheld gaming OS. Bisync is highly stateful; it relies on local listings stored in `/storage/.cache/rclone/bisync`. If a handheld hard-powers off, drops Wi-Fi mid-transfer, or has its SD card swapped, bisync's state can desync from the remote. When this happens, bisync refuses to run and demands `--resync` (which defaults to `path1` winner-takes-all). Issue #22 explicitly forbids the detector from running `--resync` on its own. This creates a deadlock: bisync refuses to run without `--resync`, and our scripts refuse to pass `--resync`. 
*Recommendation:* Do not use `bisync` for detection. You are already building a robust, stateless manifest system (`research/council-runs/2026-09-05-conflict-resolution-foundation/_sources/repo/docs/save-manifest-schema.md`). Use `rclone lsjson` to pull the remote manifests, diff them against the local manifests and `agreed.json` in memory, and execute standard `rclone copy` commands. It is stateless, immune to workdir corruption, and guarantees you never accidentally trigger a winner-takes-all resync.

**Identity and Lineage (sha256 + manifest): Endorse.**
Deciding that identity is the `sha256` of the stored bytes (D-CLOUD-030) is brilliant. Because EmulationStation renumbers slots by renaming files (`research/council-runs/2026-09-05-conflict-resolution-foundation/_sources/es/SaveStateRepository.cpp`), relying on filenames would cause endless false conflicts. 

**Presentation and Resolution: Amend.**
The IA states that non-conflicts are applied *before* the wizard opens (`research/council-runs/2026-09-05-conflict-resolution-foundation/_sources/repo/docs/conflict-wizard-ia.md`). This is mandatory so that `getNextFreeSlot()` accurately reflects the cloud's state. However, if you use `bisync --conflict-resolve none`, bisync will skip the conflicting files entirely. This means the cloud's conflicting file is *not on the device* when the wizard opens. To show the wizard, or to execute KEEP BOTH, you must download the cloud's conflicting file to a temporary staging directory first. 

**Merge Semantics (`copyToSlot`): Endorse.**
Reusing ES's `SaveState::copyToSlot` (`research/council-runs/2026-09-05-conflict-resolution-foundation/_sources/es/SaveState.cpp`) ensures the `.png` thumbnail travels with the state automatically. 

**Safety and Rollback: Amend.**
V2 snapshots (#25) are planned "later" (`research/council-runs/2026-09-05-conflict-resolution-foundation/_sources/repo/plans/conflict-resolution/vita-style-conflict-resolution.md`). This is too late. If *keep discarded saves* is off by default (IA Rev 3), a player who accidentally presses A on the wrong panel permanently deletes their progress. The cardinal rule is "never auto-delete the loser." While a manual choice isn't "auto-delete," a UI slip is irreversible. 
*Recommendation:* *Keep discarded saves* must default to ON with a retention count of 1, or V2 snapshots must block this release.

**Migration off shipped write paths: REOPEN D-CLOUD-029.**
D-CLOUD-029 (`research/council-runs/2026-09-05-conflict-resolution-foundation/_sources/repo/docs/decision-register.md`) leaves the current `copy --update` and game-exit `copy` paths in place until the wizard is built. As noted in Blindspot 28, this means the shipped OS is currently executing a recency-based clobber on every game exit. The maintainer argued that adding `--update` to the game-exit sync is just swapping one risk for another. This is false. A clobber destroys the older (potentially higher-progress) save permanently. A skip (`--update`) leaves the local save stuck on the device, but *safe*, until the wizard ships. 
*Argument to reopen:* Data loss is worse than data stranding. Reopen D-CLOUD-029 and apply `--update` to the game-exit sync immediately as a stopgap.

### 2. The Known Unknowns

1. **Chipset compatibility / loud vs silent failure:** Run the protocol in `docs/savestate-compat-test.md` on the physical bench (H700, RK3566, RK3326) before designing the UI badge.
2. **Bisync against real remote / interrupted run:** *Misframed.* Do not run this spike. As argued above, drop `bisync` entirely and use your manifest diffing. If you insist on bisync, measure this by pulling the battery on the device mid-sync, then observe if `bisync --recover` deadlocks.
3. **Auto state commonest conflict:** Measure by querying the maintainer's own `agreed.json` history. The wizard should treat it as a resume point, but verify that `copyToSlot` correctly translates a `.state.auto` into a numbered `.stateN` when KEEP BOTH is selected.
4. **KEEP BOTH's "next free slot" safety:** Measure by interrupting the pre-pass gate. If the pre-pass fails, the wizard must refuse to open.
5. **`es_savestates.cfg` location:** *Answered by corpus.* `SaveStateConfigFile.cpp` lines 136-139 (`research/council-runs/2026-09-05-conflict-resolution-foundation/_sources/es/SaveStateConfigFile.cpp`) show it looks in `Paths::getUserEmulationStationPath()` and `Paths::getEmulationStationPath()`. If it's missing, ES falls back to hardcoded defaults.
6. **Core build pin not on device:** Plan: Implement the `#21` AC to emit `/usr/share/rocknix/core-pins` during the Yocto/buildroot image assembly phase.
7. **`BACKUPPATH == RESTOREPATH` assumed:** Plan: Add a strict assertion in `cloud_sync_helper` (`research/council-runs/2026-09-05-conflict-resolution-foundation/_sources/repo/projects/ROCKNIX/packages/network/rclone/sources/cloud_sync_helper`). If they differ, refuse to run the conflict engine and fall back to legacy copy.
8. **Standalone emulators' multi-file saves:** *See Unknown Unknowns below.*
9. **480×320 panel readability:** Plan: Generate UI frames via `tools/vm-visual-qa` at 480x320. If thumbnails are illegible, fallback to a single-panel toggle (L/R shoulder buttons to swap views) rather than side-by-side.
10. **Two devices online at once:** Plan: The lock (`/var/run/cloud_sync.lock`) is local. Rclone handles remote concurrency safely via temporary files and atomic renames, but manifests could overwrite each other if two devices upload simultaneously. Measure by running two VMs syncing to the same WebDAV endpoint simultaneously.
11. **Round-trip suite never run:** Plan: Execute `tools/cloud-round-trip` on the `GENERIC_X64` VM immediately.

### 3. Unknown Unknowns (What is missing)

**1. The Multi-File Save Chimera (Architecture)**
*The Failure:* Standalone emulators often use multiple files for a single save state (e.g., N64 uses `.eep` and `.mpk`). Because the manifest keys by *file path* (`research/council-runs/2026-09-05-conflict-resolution-foundation/_sources/repo/docs/save-manifest-schema.md`), a conflict in an N64 game will present as two separate conflicts in the wizard. If a player chooses KEEP LEFT for the `.eep` and KEEP RIGHT for the `.mpk`, they will stitch together two different playthroughs, almost certainly corrupting the save permanently.
*Cheapest Experiment:* Create a fixture in `tools/cloud-round-trip` with mismatched `.eep` and `.mpk` files. Observe if the wizard groups them (it won't, based on the schema) or asks twice. 

**2. The Emulator Flush Race Condition (Substrate)**
*The Failure:* The game-exit hook (`FileData.cpp:836` in `research/council-runs/2026-09-05-conflict-resolution-foundation/_sources/es/FileData.cpp.launchGame-excerpt-l740-850.cpp`) fires `ThreadedCloudSync::start` immediately after `process.run()` returns. However, the OS filesystem cache may not have flushed the emulator's final SRAM write to disk, or a standalone emulator might fork and return before fully terminating. If `cloud_backup` hashes and uploads the `.srm` while it is still being written, the cloud receives a torn save, and the manifest records a hash that will immediately mismatch the local file once the flush completes.
*Cheapest Experiment:* Add a 50MB dummy save file to a core, exit the game, and immediately check if the uploaded `sha256` matches the final `sha256` on the SD card. 

**3. Clock Skew vs. Rclone Mtime (Operational)**
*The Failure:* Handhelds frequently boot without NTP sync, defaulting to epoch time (1970). The schema correctly flags `clock_synced: false`, but `rclone` itself relies heavily on `mtime` for its internal comparisons. If a device writes a save in 1970, and the cloud has a save from 2026, a standard `rclone copy --update` (or bisync) will silently skip uploading the new progress because 1970 < 2026. The conflict detector will never even see the file because rclone filtered it out before the script could evaluate it.
*Cheapest Experiment:* Disconnect Wi-Fi, set the OS clock to 2020, play a game to generate a save, reconnect Wi-Fi, and run the sync. Watch rclone silently ignore the file.

**4. The "Unknown" Manifest Overwrite (Architecture)**
*The Failure:* If Device A uploads a save (creating a manifest), and Device B downloads it via a legacy client (or before upgrading), Device B has the file but no manifest. When Device B upgrades and plays the game, it hashes the file, finds no manifest, and marks its lineage as `unknown`. When Device B syncs, it will see Device A's manifested version in the cloud. Because Device B's version is `unknown`, the conflict test (`research/council-runs/2026-09-05-conflict-resolution-foundation/_sources/repo/docs/save-manifest-schema.md` §3) says "never agreed -> ask". This is safe. *However*, if the user chooses KEEP RIGHT (Device B), does the new manifest correctly adopt Device A's `replaces` lineage, or does it sever the history? 
*Cheapest Experiment:* Hand-craft a legacy state in the QA bucket, download it to a VM, modify it, and trace the resulting `agreed.json` and manifest lineage.

### 4. What must be proven on hardware, and in what order

Before writing any UI code for the wizard, the following must be proven sequentially:

1. **The Emulator Flush Race (Hardware):** Prove that `cloud_backup` captures the exact final bytes of the `.srm`. 
   *Invalidation:* If it races, you must inject a `sync` command and a brief sleep into `FileData.cpp` before triggering the backup, or the sha256 identity foundation is void.
2. **The Bisync Deadlock (VM/Hardware):** Prove that `rclone bisync` can recover from a deleted `/storage/.cache/rclone/bisync` directory without requiring `--resync`. 
   *Invalidation:* If it demands `--resync`, you must abandon `bisync` for detection and write a custom manifest-diffing script, or you will eventually brick the sync subsystem for users who experience SD card corruption.
3. **Savestate Compatibility (Hardware):** Run the `docs/savestate-compat-test.md` protocol across the H700, RK3566, and RK3326. 
   *Invalidation:* If cross-chipset loads result in silent corruption, the UI toggles for cross-chipset sync must be removed entirely or placed behind an "Advanced/Destructive" warning, and the UI badge becomes a hard safeguard.
4. **480x320 Legibility (VM):** Render the side-by-side screenshot UI at 480x320. 
   *Invalidation:* If the thumbnails are too small to distinguish gameplay moments, the side-by-side layout must be scrapped for a single-panel toggle design.

=== END gemini-analysis.md ===

=== START kimi-analysis.md ===

## Verdict in one paragraph

The foundation is buildable: the identity decision (D-CLOUD-030), the manifest shape (D-CLOUD-031), the wizard IA (rev 4), and the merge primitives read out of ES's own code are the strongest parts, and they are grounded in evidence rather than taste. The weak storey is **detection**: the corpus currently holds two unreconciled detectors (bisync's snapshot engine and the manifest three-way test in `docs/save-manifest-schema.md` §3), one of which is blind to the commonest save kind on hashless backends and has no specified way to survive the wizard's own apply step. The unbuilt rooms are **deletion semantics, multi-file/container saves, and the concurrency degradation contract** — none of which appears anywhere in the corpus. I endorse the identity/manifest/presentation/merge core with amendments, recommend **replacing bisync in the detection role** with the manifest test (with the #22 spike retained as the arbiter), and argue for a narrow reopening of D-CLOUD-028. Nothing below touches D-CLOUD-030, D-CLOUD-031, D-CLOUD-029, D-CLOUD-027 or D-CLOUD-025 as decided.

---

## 1. The foundation, part by part

### 1.1 Detection — **replace in its current form; the manifest test should be primary**

The corpus contains two detection designs that are never reconciled:

- `docs/conflict-wizard-ia.md` (rev 4): "Much of the detection engine (#22) may be *reading what bisync already found* rather than diffing manifests ourselves. Manifests are still needed to **display** a conflict… but perhaps not to **find** one."
- `docs/save-manifest-schema.md` §3: a complete, mechanical, manifest-based three-way conflict test (L vs C vs A), with agreed.json as the agreement record.

These are not two views of one engine. They are two engines, each with its own agreement state (bisync's path1/path2 listings in `/storage/.cache/rclone/bisync` vs. `/storage/.cache/cloud_sync/agreed.json`), each capable of disagreeing with the other, and the disagreement is invisible — this subsystem's signature failure mode is *reporting success while doing nothing* (`.claude/rules/engineering-practices.md`). Three specific problems:

**(a) bisync is size-only on hashless backends, and SRAM never changes size.** The QA WebDAV backend has "no hashes and no modtimes" (`docs/save-manifest-alignment-review.md` §1, D-QA-001/002 row). The shipped `cloud_backup` source documents rclone's fallback in that case: "Given neither modification times nor hashes it falls back to size alone" (`projects/ROCKNIX/packages/network/rclone/sources/cloud_backup`, the #53 comment block). bisync inherits rclone's comparison primitives (inference from rclone's documented behavior; the corpus establishes the fallback for copy/sync, and bisync is built on the same machinery). A `.srm` is a fixed-size file — the schema's own example is 65,536 bytes (`docs/save-manifest-schema.md` §7). Every in-game-save change on a hashless backend is therefore **invisible to bisync**: it will report no delta, no conflict, nothing. The commonest conflict kind (the auto state is the commonest *state*; SRAM conflicts are the commonest *kind* per `docs/conflict-wizard-ia.md`'s own scope discussion and issue #23's "battery-save conflicts are likely the common case") is exactly the one bisync cannot see on exactly the backend the QA suite runs on. The manifest test is immune: it compares our own sha256 sidecar-to-sidecar, which is why D-CLOUD-030 exists.

**(b) The wizard's apply step desynchronizes bisync's snapshot, and the only documented reset is the forbidden one.** bisync's conflict detection is relative to its own last listing state. The wizard's apply writes to *both* sides (KEEP LEFT downloads, KEEP RIGHT uploads, KEEP BOTH does both). The next bisync run compares two changed trees against a stale snapshot. If bisync has no "both sides now equal → no action" fast path, every resolved conflict is re-reported as a fresh conflict — the wizard manufactures the next wizard (inference about bisync internals; this is precisely what the #22 spike must measure — see §2.2). The documented ways to advance bisync's state are a clean bisync run (impossible — bisync cannot apply per-file human decisions) or `--resync` (explicitly forbidden by #22's own ACs, `plans/conflict-resolution/vita-style-conflict-resolution.md` §4 Step 2). Hand-editing bisync's listing files is format-internal surgery. Nobody has named the writer that advances bisync's agreement state after a manual resolution. agreed.json has a named writer (#22, per `docs/save-manifest-schema.md` §9); bisync's state has none.

**(c) The `--resync` trap and the loser-renaming trap are already documented** (`plans/conflict-resolution/vita-style-conflict-resolution.md` §4; `issues/issue-22.md`). Both exist only because bisync is in the engine room at all.

**Recommendation:** the schema §3 test — local manifest + `rclone lsjson --hash` (with the documented size/mtime hint and sha256-after-download confirmation on hashless backends) + agreed.json — is already a complete detection algorithm, it is backend-independent by construction, it handles renames for free (hash identity, D-CLOUD-030), and its agreement record is required *anyway* for the exit-pass gate (see 1.8). Transfers stay as verdict-driven `rclone copy` — three explainable, auditable copy directions (down for cloud-only/cloud-changed, up for device-only/device-changed, refuse-and-flag for divergent), each line written to `cloud_audit.log`. bisync is demoted to a spike-validated diagnostic. This reframes #9: bisync was adopted as the detection engine; the evaluation that adoption deserved is the spike, and the spike's fixtures (below) double as the manifest test's adversarial suite, so the work is not wasted either way.

**What would prove me wrong:** the spike shows (i) a post-apply bisync run reporting zero conflicts with no state surgery, on WebDAV *and* Dropbox, and (ii) `--recover`/`--resilient` surviving a mid-run kill with no `--resync` prompt. Even then, the SRAM blindness caps bisync at hash-capable backends, so the manifest test remains the portable baseline and bisync becomes at most a backend-conditional fast path — two engines selected by backend capability, which is complexity I would not buy at save-file sizes (tens of KB; bisync's efficiencies are irrelevant here).

### 1.2 Identity and lineage (D-CLOUD-030) — **endorse**

sha256-of-stored-bytes is the right identity: it survives ES's rename-based renumbering (`es/SaveState.cpp` `copyToSlot(slot, move)`), it is backend-independent, and it is cheap (busybox `sha256sum`, tens of KB). The compaction rule (higher slot removed only after re-reading both files and re-verifying hashes, with an audit line) is lossless by construction and correctly distinguished from *keep discarded saves*.

One caveat, stated and dismissed: identity is over the *compressed* bytes (`savestate_file_compression = "true"`, files begin `#RZIPv` — `docs/save-manifest-schema.md` §6), so two devices producing the same *logical* state with different compressor builds would hash differently and manufacture a conflict. Producing the same logical state independently on two devices is practically impossible (a downloaded state's bytes are identical, so the hash matches), so the false-positive rate is negligible. Not worth hashing decompressed content (which would cost a decompress per comparison and create its own determinism questions).

Lineage (`replaces`, one step in the manifest, the rest in the audit log) is sufficient for display; the audit log being local means cross-device lineage is one step deep, which is all the wizard needs.

### 1.3 The manifest (D-CLOUD-031) — **endorse, with five amendments**

The shape (one JSON per device under `savestates/.rocknix/`, union of readers, agreement record local) is forced by the allowlist physics the futro measured (`plans/conflict-resolution/vita-style-conflict-resolution.md` §1, fixture output) and is correct. Amendments:

1. **Elide unchanged writes.** If capture rewrites the manifest at every game exit even when no entry changed, `generated_at` churn makes the file newer than the `--recent` stamp on every exit, and every exit sync pays an upload (~1–2 s of the 5 s budget in D-CLOUD-028) for a metadata-only change — and the round-trip step "a --recent sync with nothing changed leaves the remote alone" (`tools/cloud-round-trip`) starts failing the day #21 lands. Capture must compare and skip the write when no entry changed. One line in #21's constraints.
2. **Readers must treat an unparseable cloud manifest as absent.** The local write is temp-and-rename (atomic), but the *upload* is not atomic on all backends — a killed PUT on WebDAV can leave a truncated JSON. Schema §6 specifies refusal of higher `schema` numbers and missing-as-0, but not parse failure. Absent → that device's entries are `unknown` → conservative → wizard noise, which is the safe direction. One line in the schema.
3. **Container/grouping key for multi-file and shared saves** — see 1.9 below; additive fields, rev 1 does not preclude them, but the *decision* belongs before #21's capture build so capture writes groups from day one.
4. **No `rom` stamping for shared containers.** The schema's rule "nothing stamps a file it did not write" is violated in spirit if the exit-time capture stamps a Dreamcast shared VMU (`/dc/shared/savefiles/**` in `cloud_sync-rules.txt`) with the ROM of the game just exited: the VMU holds *every* DC game's progress, and the wizard would show "conflict in <game A>" while a KEEP LEFT discards games B/C/D's progress too. Shared containers get `rom: null` and a container kind/group; the wizard says "this memory card holds saves for all Dreamcast games."
5. **Tombstones, if deletes propagate** — pending the deletion decision (1.8 and §3.1); the schema needs a tombstone entry kind or a `deleted` flag so a delete can be distinguished from a never-seen path.

### 1.4 Namespace (D-CLOUD-017) and #10's migration — **endorse the decision; amend the migration plan, which is underdetermined**

Keying on core with the build pin as data is right (structure churns permanently; data can be compared — the decision's own reasoning). But "existing states are `unknown` and consumers handle it" does not answer **where existing flat states live** once ES points at per-core directories, and the ES config model forces a choice the corpus never makes:

- `es/SaveStateConfigFile.cpp` keys configs by emulator name — **one directory template per emulator**; with `es_savestates.cfg` present, `isEnabled()` is true and the compiled flat `Default()` config is *not* included in `getSaveStateConfigs()`. So "read both shapes" (`.claude/rules/upgrade-and-install.md`) is not available by simply adding a second template.
- The only carve-out the code offers is `defaultCoreDirectory`: when `directory` contains `{{core}}`, the *default* core can be given a different directory than the rest (`SaveStateConfigFile.cpp`, the `getSaveStateConfigs` expansion). So **Option B**: `directory = "{{system}}/{{core}}"`, `defaultCoreDirectory = "{{system}}"` — existing flat states stay put and remain discoverable under the system's default core; non-default cores get segregated directories. No move, no attribution, partial namespacing that improves as players use non-default cores.
- **Option A**: move flat states into the system's default core directory (copy-verify-delete per D-CLOUD-026), with manifest entries saying `core = <default>`, `core_build = "unknown"`, and an audit line "migrated from flat layout; core inferred from system default." This is attribution-by-configuration — a visible, reversible guess, but it is exactly the "authoritative-looking wrong data" `.claude/rules/upgrade-and-install.md` warns about if the guess is wrong, and #19's loud/silent result is what tells us how much a wrong guess costs.

The choice between A and B should be made *after* #19 (if failed loads are loud, A's guess is cheap; if silent, B's honesty wins) — one more reason #19 gates more than the badge. Either way, #10 must also ship the config file *and* move RetroArch's `savestate_directory` (`docs/save-manifest-alignment-review.md` §3.2: two consumers, one layout), and the migration rehearsal (§4, step 4) must prove ES's savestate manager still discovers the states.

### 1.5 Presentation and resolution (IA rev 4) — **endorse, with six amendments**

The flow's invariants (nothing transfers until COMPLETE; non-conflicts applied first; cloud always left; dim-don't-hide; no file size; discard-on-quit) are right and well-argued. Amendments:

1. **Batching for the auto-state storm.** `game.state.auto` diverges on every divergent session (`docs/save-manifest-schema.md` §4 names it the commonest conflict), and handhelds are offline constantly — every plane flight manufactures one per game played. "Every conflict gets a decision" (`docs/conflict-wizard-ia.md`) plus "quitting discards decisions" plus high auto volume equals a player habituated to mashing through — and the real conflicts get discarded with the noise. Add a per-kind affordance ("KEEP RIGHT for all N resume-point conflicts") with per-item override. This is batching, not deferral; the no-defer rule stands.
2. **Fold the `.png` into its state's conflict item.** The manifest has no entries for PNGs (they travel with their state, D-CLOUD-030), but the sync layer sees `game.state1` and `game.state1.png` as two files. #22 must pair them (strip the `.png` suffix) so the header count is pairs-not-files, the wizard never shows a bare picture conflict, and the apply carries both in every direction. Currently unspecified anywhere.
3. **Design the handoff from headless sync paths.** The boot sync is backgrounded with output to `/dev/null` (`projects/ROCKNIX/packages/network/rclone/autostart/102-cloud-saves`); `ThreadedCloudSync` maps exit codes 0/3/4 and everything else to FAILED (`es/ThreadedCloudSync.cpp`). "A sync that reports conflicts opens the wizard" (IA rev 4) has no mechanism for either path. Needed: a conflicts-pending marker the scripts write and ES checks (at startup and when entering GAME SETTINGS > CLOUD), a new exit code (e.g. 5 = conflicts found) with a distinct card state, and a menu row that lights up. Unowned today.
4. **Specify KEEP BOTH on `kind: auto`.** The auto state has `slot: null`; `getNextFreeSlot()` allocates numbered slots. The natural semantics — KEEP BOTH on an auto conflict freezes the cloud's resume point into numbered slot N (re-kind to `state`, `replaces: null`, origin in the audit log) — is exactly right but written nowhere.
5. **Render `clock_synced`.** The schema carries it (`docs/save-manifest-schema.md` §6) precisely because a device that booted offline has a wrong clock; the IA's panel spec never shows it. When either side's `clock_synced` is false, the wizard should badge the times as untrustworthy — otherwise the player is silently doing recency-by-eye with fabricated times, which is the cardinal rule's failure mode wearing a UI.
6. **Do not open the wizard at game exit.** The exit sync's card appears when the player has just finished playing; forcing a walkthrough there is bad timing and invites dismissals. The card should report "N saves need your choice" and point at the menu; resolution happens at boot or from the SYNC row. (Consistent with `es-native-ui.md`: the surface that reported the work says how it ended.)

Also endorsed without change: the done page naming discarded copies with the audit line written *before* deletion (futro AC), and 480×320-first layout with `tools/vm-visual-qa` frames (futro AC).

### 1.6 Merge semantics (#24) — **endorse, with four amendments**

Reusing `getNextFreeSlot()` (highest+1, scans to 99999 — `es/SaveStateRepository.cpp`), `copyToSlot(slot, move)` (carries the `.png` — `es/SaveState.cpp`), and inheriting `firstslot` handling is correct and evidence-based. Amendments:

1. **The wizard must track its own pending allocations.** Nothing transfers until COMPLETE, so `getNextFreeSlot()` does not advance between walkthrough items; two KEEP BOTHs on one game must allocate N and N+1. The allocator is the wizard's, seeded from `getNextFreeSlot()`, incremented per pending merge.
2. **Re-validate at apply.** The pre-pass gate (futro AC) makes free-on-device == free-on-cloud *at wizard open*; the model's "never concurrent" is unenforced (known unknown #10). Immediately before each merge upload, re-list the target slot path on the remote; if occupied, re-allocate. One `lsjson`; closes the manufactured-conflict race the futro's second archetype found.
3. **Per-path atomic, resumable apply.** A mid-apply power loss must leave agreed.json written for exactly the paths completed (it is written per transfer — `docs/save-manifest-schema.md` §9), so the next wizard run re-presents only the remainder. The IA's "quitting discards" is about decisions before COMPLETE; the *apply* must be crash-safe by construction. Make it an explicit #23 AC.
4. **Verify the artifact before writing agreement.** After a KEEP RIGHT upload, re-list and match `remote_hash`; after a KEEP LEFT download, sha256 the local file; write agreed.json only on match (the pattern `cloud_backup`'s system-archive phase already implements: "Only record the upload once the remote actually holds a file of the right size"). On hashless backends the verification is download-and-hash or size-plus-relist. This is `.claude/rules/engineering-practices.md`'s cardinal rule applied to the newest code; it should be a #22 AC verbatim.

### 1.7 Safety and rollback — **endorse D-CLOUD-027; amend the discard store's ownership; drop the SQLite index**

The audit log decision is right (persistent across the reboot that follows a wrong choice; append-only text; rotated in-script). Two changes:

- **The discard store cannot wait for #25.** *Keep discarded saves* ships with the wizard (#23), but its machinery is declared "same as #25, build it once" while #25 is V2 (`docs/conflict-wizard-ia.md` rev 4 settings; `issues/issue-25.md`). The store's location and its allowlist rule are owned by the deferred issue: `docs/save-manifest-schema.md` §8 requires `- /savestates/.snapshots/**` *before* `+ /savestates/**` (first match wins), and `docs/save-manifest-alignment-review.md` §3.1 notes "#25 body lacks it." If the store lands under `savestates/` without that rule, discarded losers **sync** — and propagate to every other device as brand-new files, manufacturing the zombie conflicts the discard was meant to prevent. Move the store location, the allowlist rule, and the fixture proof (the futro's `rclone lsf --filter-from` command) into #23's scope. Note the cloud-side loser must be *downloaded* into the store before the winner overwrites it — a small, priced download.
- **Drop the SQLite history index.** With the text audit log (D-CLOUD-027), the manifest union, and agreed.json, the index in the IA doc's "Where state lives" table is a fourth store that can skew from the other three and buys nothing the wizard needs. #20's call is still open; my recommendation is no index. (The IA table also still says `cloud-sync/` where the device uses `cloud_sync/` — the futro already fixed the doc line; the table's `history.db` row should go with it.)

### 1.8 Migration off the shipped write paths (D-CLOUD-029) — **endorse the decision; amend the plan in four ways**

D-CLOUD-029 (no `--update` stopgap; maintainer is the only user; #22 replaces wholesale) is a sound acceptance of a bounded risk. The plan around it needs:

1. **Price the exit-pass conflict check — and reopen D-CLOUD-028 narrowly to do it.** #22's AC (a) requires the *game-exit pass* to refuse a both-sides-changed save (`plans/conflict-resolution/vita-style-conflict-resolution.md` §5). Refusing requires knowing the cloud side changed. D-CLOUD-028 says the exit sync "never probes or tidies the remote." You cannot detect a remote change without a remote read: the AC and the register row contradict each other, and `docs/save-manifest-alignment-review.md` checked #22 against D-CLOUD-028 without pricing this (it priced only the manifest write riding the `--recent` pass). The reconciliation preserves D-CLOUD-028's intent: the nothing-changed fast path never lists the remote (unchanged), but **when the `--recent` window is non-empty — i.e., when there are uploads to make — the exit pass pays one `lsjson --hash` of the affected remote paths before uploading, refuses divergent paths, uploads the rest, and reports "N saves held for the conflict wizard."** That is not a reachability probe (what D-CLOUD-028 banned); it is a correctness read intrinsic to the transfer. Cost: ~1–2 s only on exits that actually wrote saves. I argue this should reopen and refine D-CLOUD-028 with a new row citing it; the alternative is documenting that the exit path keeps a clobber window until boot — the exact loss the cardinal rule exists to prevent, on the exact path the player watches.
2. **Add a shadow-mode phase.** Before the new engine may refuse anything, it runs read-only alongside the shipped paths on the maintainer's daily devices, logging what it *would* have transferred/refused versus what the newest-wins paths actually did. The round-trip fixture is the constructed case (blindspot 28's guard); shadow mode is the field case. A detector that has never been observed in the wild before it holds refusal power is blindspots 13 and 14 (`docs/blindspot-register.md`) in their purest form. Shadow mode also produces the day-one conflict census (§3.14).
3. **Decide deletion semantics before #22 ships** — see §3.1. The scope table in `docs/conflict-wizard-ia.md` ("Exists in cloud only → download; exists on device only → upload") makes every player deletion resurrect at the next sync. That is a product decision masquerading as a non-decision.
4. **Add one row to the replaced-mechanism inventory.** The futro's inventory (`plans/conflict-resolution/vita-style-conflict-resolution.md` §4) lists the `--update` skip, the lock, the `--recent` window, and the stamps; make explicit that the boot pair's *restore-before-backup ordering* becomes "verdict-driven downloads before verdict-driven uploads" in the new engine, and that the `last-backup`/`last-restore` stamps keep being written (D-UI-018's menu rows read them).

---

## 2. The eleven known unknowns — resolution plans

**1. Is chipset a compatibility axis; is a failed load loud or silent? (#19)**
Run `docs/savestate-compat-test.md` as written, with its own sequencing enforced: **same-chipset control first** (RG35XX SP ↔ RG-SP — `issues/issue-19.md`'s control case), then the six cross-chipset directed pairs (RG351M/RK3326, RG353M/RK3566, RG35XX SP/H700), then Test C (truncate; flip bytes with compression on *and* off). All devices on **one build** (the protocol's named confound). Add the protocol's own second core (`dosbox_pure`) before acting on a "portable" result. The SM8550 (Retroid Pocket Nova) is on the bench but not in the protocol — include it as a fourth family if the hour allows, or explicitly exclude it. *Measure:* visual correctness at a cap32/atari800 BASIC prompt; refuses / loads-wrong / loads-fine per pair. *Before:* #23's badge (D-CLOUD-025) **and** #10's migration shape (1.4). *Can reopen:* D-CLOUD-017 — if chipset proves real, keying on core alone is wrong; the schema already carries `device.family` (`docs/save-manifest-schema.md` §6), so the amendment is a rule change, not a schema change.

**2. bisync against a real remote: listing state, `--recover`/`--resilient`, agreement-state duplication.**
This is the decisive unknown for §1.1. Five fixtures on three substrates — VM→WebDAV loopback (`tools/cloud-test-backend`, D-QA-002), device→MinIO over LAN (`.claude/rules/rclone-cloud-sync.md` confirms a real device can reach the host's MinIO), device→Dropbox (the maintainer's real remote; blindspot 8 demands at least one real-remote run):
(a) device-side rename (simulated renumber); (b) genuine both-sides change; (c) kill -9 mid-run, then `--recover`/`--resilient` — is `--resync` ever suggested?; (d) **same-size-changed `.srm`** — expect zero detections on WebDAV (the blindness test); (e) **post-apply re-detection** — manufacture a conflict, make both sides equal externally, re-run, count reported conflicts. Record the workdir listing files, exit codes, and output shape. *Before:* #22 commits to an architecture. The agreement-state question answers itself in the recommended design: agreed.json is the only load-bearing agreement state; bisync's listings are never load-bearing.

**3. The auto state: commonest conflict? resume-point treatment?**
Mis-framed: given offline play, it *will* dominate; the real question is treatment volume. *Measure:* the shadow-mode detector (1.8.2) logs conflict counts by kind for one week of the maintainer's actual two-H700 play; the histogram calibrates whether batching (1.5.1) suffices or a standing per-game rule is needed. Decide KEEP BOTH-on-auto semantics in the schema now (1.5.4). Note the trap: recency is *semantically* correct for a resume point (the file's entire meaning is "where I stopped"), but `clock_synced: false` makes recency unsafe — so it stays a prompt, batched, never a default. *Before:* #23's flow build; the measurement runs during #21/#22 development.

**4. Is the pre-pass gate sufficient; what happens when interrupted?**
VM fixture: plant a cloud-only state at slot 5, local slots 0–2, a conflict at slot 1; kill networking mid-pre-pass; assert the wizard refuses to open and says why; resume; assert the gate clears. Then the apply-time re-check (1.6.2): occupy the target slot on the remote between open and apply; assert re-allocation. *Before:* #23's merge build. VM suffices (logic, not hardware); one H700 pass for real thumbnails.

**5. No `es_savestates.cfg` ships; two consumers, one layout.**
`find` the image root and the device for the file (the futro found it at neither expected path); read the RetroArch launch path (`docs/save-manifest-alignment-review.md` §3.2 names `setsettings.sh:811`, `${SNAPSHOTS}/${PLATFORM}` — that file is cited but not embedded, so verify rather than trust). Then the migration rehearsal (§4 step 4) decides Option A vs Option B (1.4) on one H700 with real flat states: states land in per-core directories, RetroArch honors the computed directory, and the savestate manager still discovers everything. *Before:* #10's build.

**6. The core build pin is not on the device.**
Emit `/usr/share/rocknix/core-pins` at image build (`get_pkg_version` × `LIBRETRO_CORES`, per `docs/save-manifest-schema.md` §9); write the core→package map (the exceptions table is #21's); boot one device per family and assert every core ES can launch has a pins line; capture records `"unknown"` otherwise. ES's side is verified present in the embedded excerpt: `FileData::getEmulator(true)` / `getCore(true)` (`es/FileData.cpp.getCore-excerpt-l1470-1560.cpp`). *Before:* #21's capture build.

**7. `BACKUPPATH == RESTOREPATH` is assumed.**
Nearly answered — `docs/save-manifest-schema.md` §9 documents the assumption and names the fix. Close it: the one-line warning in `cloud_sync_helper` when they differ, plus a VM run with the paths set apart (warning fires; nothing misbehaves). *Before:* #21. Not a real unknown.

**8. Standalone emulators' multi-file saves.**
Inventory on device: PPSSPP (`/psp/PPSSPP/**`, by game ID), Dreamcast shared VMU (`/dc/shared/savefiles/**`), N64 (`/n64/save/*.eep/.mpk/.sra`), PSX (`/psx/memcards/*.mcd/.mcr`) — classify each as shared-across-games or per-game. Then force two conflicts on two H700s: a VMU conflict (two DC games played on A, one on B) and a two-file N64 conflict. *Measure:* what per-path presentation would show versus per-container presentation; specifically whether mixed resolution (KEEP LEFT on `.eep`, KEEP RIGHT on `.mpk`) is even possible in the design — it must not be (§3.2). *Decide:* the container/group key (1.3.3, 1.3.4). *Before:* #20's schema revision adding the group field and #23's item model.

**9. The 480×320 panel.**
The futro AC stands: lay out at 480×320 first, `tools/vm-visual-qa` frames at 480×320 and 640×480 with **real thumbnails from the device's own states** (blindspot 8: no synthetic stand-ins), and the maintainer judges recognizability **on the RG351M panel itself** — a frame on a monitor is not the panel. Include the glyph-only in-game-save panel (the common case) in the judgment. *Before:* #23's layout build.

**10. Two devices online at once is not enforced.**
Scripted drill over SSH: both H700s exit-sync in the same second; both boot-sync simultaneously; force the KEEP BOTH slot race (both devices merge the same game before either syncs). *Measure:* file-level outcomes, the next sync's verdicts, audit lines. *Expected (inference):* the hash design degrades most races to wizard prompts — **but not all**: a concurrent first writer can be silently overwritten by a second writer acting on a stale listing, and the first writer's next sync then classifies the overwrite as "cloud changed → download, no prompt" and loses its version locally too (§3.13). The drill establishes the degradation contract and whether the pre-upload check (1.8.1) plus audit-recorded pre-upload listings are sufficient mitigation. *Before:* #22 finalizes refusal semantics; document the contract in #22's body.

**11. The round-trip suite has never run.**
Run it on the GENERIC_X64 VM against WebDAV, then `CLOUD_QA_BACKEND=s3` (MinIO) — both backends, because the hashless-WebDAV fallback path is the one the manifest's `remote_hash: null` case exists for (`docs/save-manifest-alignment-review.md` §3.6). Then extend fixtures before #22's ACs are ticked: a compressed `#RZIPv` state; a same-size-changed `.srm`; the manifest step (§3.6 of the review); the both-sides-changed step (futro); a deletion/tombstone case; a PNG-pairing case; a wrong-clock save (§3.6). Mind the suite's own known blind spot — it resets the remote, so it historically tested only first uploads (`.claude/rules/engineering-practices.md`, the #53 postmortem); the second-upload cases are the ones that matter. *Before:* #22 starts (already planned).

---

## 3. What nobody has named

Ordered by expected damage. Each with the cheapest exposing experiment.

**3.1 Deletion semantics are absent: every deleted savestate is a zombie.** The scope table (`docs/conflict-wizard-ia.md`) and the conflict test (`docs/save-manifest-schema.md` §3) contain no delete row: "exists on device only → upload" resurrects cloud-deleted files; "exists in cloud only → download" resurrects device-deleted ones. A player who deletes a state to tidy the savestate manager gets it back at the next sync, under a *new* slot number after renumbering, forever. The corpus's only deletions are compaction (D-CLOUD-030) and discards — player-initiated deletion is never discussed. The data to distinguish delete-from-never-existed exists: a path in agreed.json that is now absent locally is a local delete. The decision (propagate with tombstone + audit + discard-store copy, vs. never propagate + a periodic "N deleted states remain in the cloud — purge?" cleanup) must be made before #22, because it changes the schema (tombstones) and the wizard (a third class of item). *Cheapest experiment:* delete a state on one H700, run the boot sync, watch it return. One SSH session, today.

**3.2 Multi-file saves invite mixed-resolution corruption, and shared containers invite mass misattribution.** The manifest keys by path; the wizard walks per path. An N64 game's `.eep` + `.mpk` presented as two items can be resolved KEEP LEFT / KEEP RIGHT — a Frankenstein save worse than either side. A Dreamcast VMU conflict stamped with the last-played game's `rom` presents as "conflict in <game A>" while discarding every other DC game's progress on the losing side. Neither is hypothetical; both layouts are in the shipped allowlist (`cloud_sync-rules.txt`). *Cheapest experiment:* the §2.8 inventory plus one forced VMU conflict on two H700s; watch what per-path presentation would show.

**3.3 bisync is blind to SRAM on hashless backends.** Developed at length in 1.1(a). The danger is not the blindness itself but its silence: develop against the QA WebDAV and the detector "works" (reports nothing, which reads as "no conflicts" — blindspot 22, a probe that cannot report absence). *Cheapest experiment:* fixture (d) of the §2.2 spike — a same-size-changed `.srm` through bisync on WebDAV; count detections; expect zero.

**3.4 The post-apply re-detection loop.** Developed in 1.1(b): if bisync re-reports externally-equalized conflicts, bisync-as-detector is unworkable without state surgery, and the design collapses onto the manifest test anyway. *Cheapest experiment:* fixture (e) of the spike.

**3.5 The exit-pass clobber window is unpriced, and closing it contradicts D-CLOUD-028.** Developed in 1.8.1. Today's exit pass overwrites the cloud copy whenever the local one differs (`plans/conflict-resolution/vita-style-conflict-resolution.md` §4 Step 1, verified in `cloud_backup`); the future exit pass must refuse divergent paths, which requires a remote read the register currently forbids. *Cheapest experiment:* construct the both-sides change on two H700s, run *only* the exit pass on the second, observe the clobber (proves the window); then time one `lsjson --hash` of the saves tree on the device (prices the fix against the 5 s budget).

**3.6 Wrong-clock saves are invisible to both shipped comparison mechanisms.** The schema carries `clock_synced` because "a device that booted without a network has a wrong clock" (`docs/save-manifest-schema.md` §6). Follow that fact through the shipped paths: a save written with a too-old mtime falls *outside* the `--max-age` window (the exit sync never considers it) and loses every `--update` comparison (the boot backup skips it because the remote's copy is "newer"). D-CLOUD-028's claim that "full passes cover files with wrong mtimes" is false for `--update` passes — a wrong-clock save can be stranded indefinitely, and offline play on a handheld is the normal case, not the edge. The hash engine (#22) is the only proposed mechanism that rescues these files, which is an unlisted argument for making it primary. *Cheapest experiment:* `date -s` yesterday on one H700, write a save, run the exit sync and the boot pair, list the remote. An afternoon.

**3.7 Manifest churn breaks the nothing-changed fast path.** Covered in 1.3.1. *Cheapest experiment:* two consecutive exit syncs with no save written; assert the second uploads nothing.

**3.8 There is no path from a headless sync to the wizard.** Covered in 1.5.3. *Cheapest experiment:* with a conflict planted, reboot and watch what the player sees at boot and at game exit — today: nothing.

**3.9 PNG pairing is unspecified in detection, counting, and apply.** Covered in 1.5.2. *Cheapest experiment:* once any detector exists, one divergent state → count conflict items (2 where 1 is right).

**3.10 #10's migration has no answer to "where do flat states live."** Covered in 1.4 — the ES config model (`es/SaveStateConfigFile.cpp`: one directory template per emulator; `defaultCoreDirectory` the only carve-out) forces a choice the corpus never makes. *Cheapest experiment:* build the candidate config, boot one H700 with real flat states, open the savestate manager.

**3.11 The discard store has no allowlist home, and a syncing store exports zombies.** Covered in 1.7. *Cheapest experiment:* the futro's fixture command (`rclone lsf --filter-from`) against a tree containing the candidate store path.

**3.12 agreed.json loss is a conflict storm; agreed.json *restoration* is a silent-loss vector.** The agreement record lives in `/storage/.cache/` by deliberate choice (`docs/conflict-wizard-ia.md`, "Where state lives") — but `.cache` is the OS's *disposable* tree by convention, and agreed.json cannot be regenerated (it is the memory of a conversation). A wipe turns every both-sides file into "never agreed → ask" (safe direction, but a day-one storm on every cache clear). The dangerous direction is the opposite: if agreed.json ever travels (a backup, a card clone, a well-meaning cleanup that archives `.cache`), a *stale* agreement record misclassifies divergent files as "cloud changed → download, no prompt" and silently overwrites local progress. The placement is right; the tradeoff and the "never back this up, never restore it elsewhere" rule are unwritten. *Cheapest experiment:* on a VM, delete agreed.json and re-run detection (count the storm); then plant a stale agreed.json with a diverged cloud and watch the misclassification.

**3.13 Concurrent writes can silently lose the *first* writer — the corpus's "accepted" posture is too rosy.** The futro accepts unenforced concurrency because "the audit log will show if it is violated" (`plans/conflict-resolution/vita-style-conflict-resolution.md` §5). Trace the race with the *new* engine: B uploads H_B (agreed_B = H_B); A uploads H_A over it on a stale listing; B's next sync computes L_B == A_B, C != A_B → "cloud changed → download, no prompt" → B's version is overwritten locally. No prompt anywhere; the cardinal rule is violated by construction. Mitigations that exist within the design's physics: the pre-upload listing check (1.8.1) shrinks the window to one listing's staleness; the audit log should record the pre-upload listing's `remote_hash` for every overwrite so support can recover the loser from provider-side versioning (Dropbox keeps version history — *inference from general knowledge, not the corpus*); and the degradation contract should be written into #22's body so "never concurrent" is a stated load-bearing assumption with a stated failure price, not a hope. *Cheapest experiment:* the §2.10 drill.

**3.14 Day-one unknown-both volume shock.** Every pre-existing save is `unknown` (D-CLOUD-017, D-CLOUD-030's honesty rule). The maintainer has five devices and months of newest-wins history — the first wizard run after the feature ships will present *every* both-sides file whose content ever diverged, with no provenance on either side, chosen by date alone (the heuristic the design exists to distrust, unavoidable here). If that number is 40, the wizard's batching and its "no history for either copy" honesty line (1.5 amendments) are load-bearing on day one, not nice-to-haves. *Cheapest experiment:* the shadow-mode census (1.8.2) — run the read-only detector against the maintainer's real cloud and devices and count. This also directly calibrates §2.3.

**3.15 A cloned card duplicates the device identity.** `cloud_device_id`'s stored value wins (`projects/ROCKNIX/packages/network/rclone/sources/cloud_device_id`, D-CLOUD-009) — so a player who clones their card to a second handheld (a normal thing to do) creates two devices writing *one* manifest: the write conflict D-CLOUD-017 exists to avoid, with entries oscillating between two devices' realities. Detection is cheap (a device's own manifest in the cloud carries hashes of files this device never wrote). V2 at earliest, but unnamed today. *Cheapest experiment:* `dd` a card to a second device, sync both, watch the manifest thrash.

**3.16 The screenshots tier has no conflict semantics.** `/screenshots/**` is in the allowlist and is not progress data; when #22 owns the write paths it inherits screenshots. Keep them on `copy --update` semantics as a *documented* exception (newest-wins on a non-progress tier), or they become wizard noise. One line in #22.

**Corpus gaps I relied on and flag:** `GuiSaveState.cpp` (the renumber-on-delete call site) is cited (`issues/issue-24.md`, `GuiSaveState.cpp:236`) but not embedded — the claim rests on that citation plus the embedded `renumberSlots` in `es/SaveStateRepository.cpp` and `es/SaveState.cpp`'s `onGameEnded`. `retroarch.cfg` and `setsettings.sh` are cited via the futro's substrate table and the alignment review, not embedded. rclone/bisync internals beyond the flags listed in the futro are inference; the spike exists to replace that inference with measurement.

---

## 4. What must be proven on hardware, in order

D-QA-001 governs: nothing upstream without a hardware run. The GENERIC_X64 VM cannot speak to savestate compatibility (x86_64; `docs/savestate-compat-test.md`), so steps 3, 4, 7, 8 are physical-device-only.

**Step 0 — Run the round-trip suite as it exists** (VM; WebDAV, then S3). This validates the *measuring instrument* before anything is measured with it; eleven of its criteria have never executed (`issues/issue-35.md`). *Invalidates:* nothing in the new design directly; a failing harness blocks trusting every later step. *Blocks:* everything.

**Step 1 — The three cheap physics experiments on one H700** (an afternoon): deletion resurrection (§3.1), wrong-clock stranding (§3.6), exit-pass clobber (§3.5). *Invalidates/confirms:* the tombstone decision's framing; the claim that the hash engine is necessary (not merely nice); the price of the exit-pass check. These change #22's and the schema's requirements *before* either is built, which is why they precede the spike.

**Step 2 — The bisync spike** (VM→WebDAV; device→MinIO; device→Dropbox; five fixtures per §2.2). *Invalidates:* bisync-as-detector, if the SRAM blindness or the post-apply re-detection fails (my expectation is both fail on WebDAV; Dropbox may pass) — the fallback is the manifest-test-primary design of 1.1, which needs no bisync at all. *Blocks:* #22's architecture commit.

**Step 3 — The #19 bench protocol** (four devices, one build; same-chipset control first; then cross pairs; then loud/silent). *Invalidates:* the badge-as-convenience hypothesis (D-CLOUD-025's open question); potentially D-CLOUD-017's core-only keying (if chipset is real); #10's migration shape (1.4: loud failure → Option A is cheap, silent → Option B). *Blocks:* #23's badge, #10's build.

**Step 4 — The #10 migration rehearsal** (one H700 with real flat states): shipped `es_savestates.cfg` + RetroArch `savestate_directory` move + ES discovery verified in the savestate manager. *Invalidates:* the chosen migration shape (Option A vs B) if discovery fails or RetroArch ignores the directory. *Blocks:* #10's merge.

**Step 5 — Shadow mode on the maintainer's daily devices** (one week): the read-only verdict engine alongside the shipped paths; diff its verdicts against what newest-wins actually did; produce the day-one conflict census (§3.14) and the auto-state histogram (§2.3). *Invalidates:* verdict-table bugs before the engine may refuse anything; calibrates the wizard's batching. *Blocks:* #22's enforcement half, #23's flow finalization.

**Step 6 — Pre-pass, interruption, and apply-resumption fixtures** (VM): the gate refuses mid-pre-pass; the apply re-checks slot freedom; a mid-apply kill leaves a resumable remainder with agreed.json written for exactly the completed paths. *Blocks:* #23's merge/apply build.

**Step 7 — The wizard on device** (RG351M at 480×320 and RG35XX SP at 640×480): `tools/vm-visual-qa` frames plus the maintainer's press-through (blindspot 13: tick on observed behavior); then the full two-H700 journey — manufacture a state conflict and an SRAM conflict, resolve each of KEEP LEFT / KEEP RIGHT / KEEP BOTH once, verify *bytes* on both sides and the audit lines (artifact, not report). *Blocks:* #23's sign-off.

**Step 8 — The concurrency drill** (two H700s, scripted): simultaneous exit syncs, simultaneous boot syncs, the KEEP BOTH slot race. *Invalidates:* the degradation contract as written (§3.13) if any silent loss escapes the pre-upload check + audit record. *Blocks:* the milestone's ship call.

The ordering logic: harness trust (0) → today's-path physics that reshape requirements (1) → detector physics (2) → compatibility physics (3) → layout migration (4) → field shadow (5) → UI logic (6) → UI reality (7) → the contract nobody can test alone (8). Every step before 5 is cheap and changes the design; every step after 5 is expensive and should only run on a design the cheap steps already shook.

---

## Appendix — provenance (sources cited, hashes verified at embed time by the Facilitator)

| path | sha256 (embed time) |
|---|---|
| `research/council-runs/2026-09-05-conflict-resolution-foundation/_sources/00-problem-statement.md` | `7e8c1076ee1735925af1d59dded61d23146c5c8e9fb2aae2be53d5afca26b6b7` |
| `…/_sources/repo/docs/conflict-wizard-ia.md` | `5738428852899047b9d49902b78e9c5e0d4457f67b09d079fdfeb89fdcfcc6c9` |
| `…/_sources/repo/docs/save-manifest-schema.md` | `2a794ea3d027402a26e3dfc62ea6184c204211c888c904413d1564ecf3f189ce` |
| `…/_sources/repo/docs/save-manifest-alignment-review.md` | `56f6c54c013c5476f638a0dee5f2201e6a4ad021b47c674010bdc392665bfd48` |
| `…/_sources/repo/plans/conflict-resolution/vita-style-conflict-resolution.md` | `d22a49e73fe5d25cafea7646ec353e57a3da95f6ef84d4b86249c91bb170cf43` |
| `…/_sources/repo/docs/decision-register.md` | `0a4b1150d907f26cdd70d480830e195b9fa2885920abf48641506bb5a0f09640` |
| `…/_sources/repo/docs/blindspot-register.md` | `1514b33d61ab148d4e59bf446af03d973792a0673969df471b41c021edc9cbd8` |
| `…/_sources/repo/docs/savestate-compat-test.md` | `4d0b9d21ee5c9c26a25da5c169d9e99b83c18457732bd9471078c2d508b1d1bb` |
| `…/_sources/repo/.claude/rules/rclone-cloud-sync.md` | `7d43f252d029d54baa98ffa266b9334fa2f0f2da3db2507f451205f40dc73353` |
| `…/_sources/repo/.claude/rules/engineering-practices.md` | `e8ee62ea5af749ef09c0ede9da7abc5d7c192d890ae2e737cc369a5c5549c646` |
| `…/_sources/repo/.claude/rules/upgrade-and-install.md` | `d343c805b912141a1f8af7aa8d6025e2379e5335fb197c4cc59adf960fa43cbb` |
| `…/_sources/repo/.claude/rules/es-native-ui.md` | `cba905608c0104093b166c88393dba32159dca2b280d8a5229b6668930c8e4d2` |
| `…/_sources/repo/docs/cloud-sync-changelog.md` | `6357ada783d5b09f22bd6fad2745b5c101e68fcdf2f85ffc698975be356cd594` |
| `…/_sources/rclone-bisync-planning.md` | `acae778e1ee700e4a7c0120cb5e9be2fb5d2129aa04ef3e75590af2effca60eb` |
| `…/_sources/issues/issue-9.md` | `cf3f971c8c6d95f0429d7f2937ecb130b1b40f2d12d7681441548230ca48a9c0` |
| `…/_sources/issues/issue-10.md` | `4704211f8e92be217eb2f16cd363a6a7c3dacc381f5083b7536e9aa33b79ab0f` |
| `…/_sources/issues/issue-11.md` | `4c6881068dd2be7eca3031e8d929b4d1a5f314eb6d08ba07a1d7cbd735bd207f` |
| `…/_sources/issues/issue-19.md` | `b4f54c4e548f514f9429d5ea56dc9c3e246b95b0ae519a4b013891b1d69ffe39` |
| `…/_sources/issues/issue-20.md` | `083c6c3504c578da7c283008d1305492f792a82c4b0a30d35007f9776ff6ad90` |
| `…/_sources/issues/issue-21.md` | `c87315eb509d89d1ac2f8595c1fb47c9227836fadfbd13cf22122fce5f9806d3` |
| `…/_sources/issues/issue-22.md` | `6d998503be831ad800a34bbfa952fc2aeb85ca5f5d959b6d10dad98d0fea6831` |
| `…/_sources/issues/issue-23.md` | `016287a95f088a1cf137199a4c50321e0650684b78ecbe1849d995ae52afb6ee` |
| `…/_sources/issues/issue-24.md` | `f87746eecfd56f78e477d227a25ddb7cfc2accc4626656c41ac14eeff8285ea0` |
| `…/_sources/issues/issue-25.md` | `696bcdba14d33dfeea8e627a90094a2b1955745f32fc28677f54bb97f88099ba` |
| `…/_sources/issues/issue-35.md` | `5787b6f79b1f7a9160c0540997d8b2fae1541201224c4bb8bf17b3cacf610210` |
| `…/_sources/issues/issue-37.md` | `a43faf60f3fa4d2aa60345815484ff7c862bdba0061befa068e64b1994e0a907` |
| `…/_sources/repo/projects/ROCKNIX/packages/network/rclone/sources/cloud_backup` | `dfd1bf52dca78ab67a1b30b56e3c048d8910863a99ca02442525f58d083a2a57` |
| `…/_sources/repo/projects/ROCKNIX/packages/network/rclone/sources/cloud_restore` | `3a1bec8bb0ef5005f3dd92cdd766beb2c32ef26c5b5ea06fbd6cdb0bb0259de9` |
| `…/_sources/repo/projects/ROCKNIX/packages/network/rclone/sources/cloud_sync_helper` | `8b22b9c82effe0a044ff765f73ecf24e26dd064abf694dc1f37304e2759b8823` |
| `…/_sources/repo/projects/ROCKNIX/packages/network/rclone/sources/cloud_sync-rules.txt` | `60db296dde26bebbf4fcf1b97101188799cedb2eb3260616204a2ee082ce19c3` |
| `…/_sources/repo/projects/ROCKNIX/packages/network/rclone/sources/cloud_sync.conf` | `c9f4d94dc9745bce7bccf99145816e0e45305c8a5058acb6476a1fb56f96eb6c` |
| `…/_sources/repo/projects/ROCKNIX/packages/network/rclone/sources/cloud_device_id` | `2b56d6f5fd4a86bfd40578bec43308204f62af513df9b3ed227cf971585f837b` |
| `…/_sources/repo/projects/ROCKNIX/packages/network/rclone/autostart/102-cloud-saves` | `7c3e79bbe41bd70ec1c1f08d9defd04e38af891430616173609bf3e76c2159ee` |
| `…/_sources/repo/tools/cloud-round-trip` | `212e1c8531008b1d25f5f976797d9762c5cfa3061fe70229c546d276784efb49` |
| `…/_sources/es/SaveStateRepository.cpp` | `9931bfdceacc18344d7a6b9eeea0a27278dff46ae04a7f82e5c4efe7300ff51b` |
| `…/_sources/es/SaveState.cpp` | `848e0746fa26ef5c565af72962c487b0d4185f199f36f2290827bd086e303741` |
| `…/_sources/es/SaveStateConfigFile.cpp` | `4f38ea7dcfcbd71068122124c428d146b7da3c6dbdcc05a81afc99bbd93a9b15` |
| `…/_sources/es/ThreadedCloudSync.cpp` | `62f817868c3b803429e62efb7aa8f37aa995213386c6e4303e8e1f490a144ffc` |
| `…/_sources/es/FileData.cpp.launchGame-excerpt-l740-850.cpp` | `5b341d85de24badb2984fff979226f25f080831a1d194f607b6d6caa6085f233` |
| `…/_sources/es/FileData.cpp.getCore-excerpt-l1470-1560.cpp` | `2410e4316d9c2c3bfb301c39dbe79590fb73682b18e70988527eeecc2a024fa6` |

I did not re-read or re-hash these files; the contents and hashes above are as embedded by the Facilitator. Sources I wanted and did not have: `GuiSaveState.cpp`, `retroarch.cfg`, `setsettings.sh`, and rclone's own bisync documentation for 1.75.0 — every claim resting on those is marked as citation or inference above, and the #22 spike is the designated replacement for the bisync inference.

=== END kimi-analysis.md ===

=== START mistral-analysis.md ===

# Analysis of the Cloud-Save Conflict Resolution Foundation

## 1. Is this foundation sound, end to end?

### Detection (Issue #22, D-CLOUD-029)

**Endorsement with critical amendments.** The bisync-based detection approach is sound in principle, but the current design has a fatal flaw: **the shipped write paths are newest-wins today** (blindspot 28, `00-problem-statement.md` §4, `plans/conflict-resolution/vita-style-conflict-resolution.md` §4). This violates the cardinal rule (D-CLOUD-014, #11) and must be fixed before any detector is built.

**Required changes:**
- **Immediate stopgap:** Add `--update` to the game-exit upload (`cloud_backup --recent`). This turns clobber into skip (the cloud's newer copy survives; the local one waits for the wizard). Evidence in `projects/ROCKNIX/packages/network/rclone/sources/cloud_backup` lines 639-646 shows no `--update` is present today.
- **Permanent fix:** #22 must gate the boot pass, the game-exit pass, and the SYNC row on last-agreed state. The futro's AC (a) is correct: a both-sides-changed save must be refused (not resolved) by every transfer path, shown by a constructed fixture. The current `copy --update` pair is a recency resolver by construction and must be replaced.

**Bisync specifics:**
- **Endorse** `--conflict-resolve none` (default) and `--conflict-loser num` as correct defaults.
- **Amend:** Never let bisync rename savestate losers. Its suffix (`...conflict1`) breaks the `{{romfilename}}.state{{slot}}` pattern ES matches on (`SaveStateRepository.cpp` lines 98-99). The futro's AC (c) is correct: detect with bisync, resolve into slots ourselves.
- **Amend:** The detector must never run `--resync` on its own. `--resync-mode` defaults to path1 (winner-picks-all), which is a recency-free data-loss tool. Use `--recover` and `--resilient` instead (futro AC b).

### Identity and Lineage (D-CLOUD-030, Issue #24)

**Endorse with one critical clarification.** The decision to use sha256 of stored bytes as identity is correct. However:

**Amendment:** The compacting rule (D-CLOUD-030) must be **reversible and logged**. A renumber on one side followed by a sync can leave the same hash in two slots. The current rule removes the higher-numbered copy after re-verification, but this is **destructive** if the player deliberately kept both copies (e.g., for different playthroughs). The audit log must record the removal, and the player must have a way to recover the discarded copy if it was intentional.

**Evidence:** `SaveStateRepository::renumberSlots()` in `SaveStateRepository.cpp` moves files with `copyToSlot(slot, move=true)`, which renames both the state and its `.png`. This is the mechanism that creates duplicates.

### Manifest (D-CLOUD-031, Issue #20)

**Endorse with two amendments.**

**Amendment 1:** The manifest must include **play session boundaries**. The current schema records `captured_at` as the moment the entry was written, but for `.state.auto` files (written on every exit), this conflates multiple sessions. Add a `session_id` field to group states written in the same session.

**Amendment 2:** The `remote_hash` field must be **mandatory after upload**. The current design allows `null` until upload, but this creates a race condition: if a sync is interrupted after the file is uploaded but before the manifest is updated, the remote copy is orphaned. The upload step must atomically update both the file and its manifest entry.

**Evidence:** `docs/save-manifest-schema.md` §6 shows `remote_hash` as nullable. The futro's bisync spike (Issue #22) must test this race condition.

### Presentation and Resolution (Issue #23)

**Endorse with critical amendments to the conflict test.**

**Amendment 1:** The conflict test in `docs/save-manifest-schema.md` §3 is **too conservative**. It treats "never agreed" as a conflict, but this is wrong for:
- A fresh handheld restoring from the cloud (every other device's manifest is `unknown`)
- A device that has been offline for a long time (the last-agreed state may be stale)

**Proposed test:**
| L vs C | A known? | L vs A | C vs A | Verdict | Action |
|--------|----------|--------|--------|---------|--------|
| equal  | —        | —      | —      | identical | nothing |
| differ | yes      | equal  | differ | cloud changed | download |
| differ | yes      | differ | equal  | device changed | upload |
| differ | yes      | differ | differ | **divergent** | wizard |
| differ | no       | —      | —      | **one-way** | transfer, no prompt (conservative) |

**Amendment 2:** The wizard must **batch conflicts by game**. The current design walks system-by-system then game-by-game, but this is inefficient for players with many conflicts. Group conflicts by game (e.g., "3 conflicts in Mega Man 2") and let the player resolve them in one pass.

**Evidence:** `docs/conflict-wizard-ia.md` § Flow shows the current walkthrough order.

### Merge Semantics (Issue #24)

**Amend:** KEEP BOTH must be **slot-aware**. The current design uses `getNextFreeSlot()`, but this is unsafe if the cloud has states in slots the device considers free. The pre-pass must download every cloud-only state before the wizard opens, and the merge must verify the target slot is free on both sides.

**Evidence:** `SaveStateRepository::getNextFreeSlot()` in `SaveStateRepository.cpp` returns highest occupied + 1, which is only safe if the cloud's state is already local.

### Safety and Rollback (Issue #25)

**Replace:** The current design treats snapshots as V2, but this is **too late**. The audit log (`/storage/.cache/log/cloud_audit.log`) must be **mandatory from day one**, because:
- It is the only record of where a merged state came from
- It is the only way to recover from a bad merge
- It is cheap to implement (append-only text)

**Proposal:** Make the audit log a **blocking dependency** for the wizard. The log must record:
- What conflicted (paths, hashes)
- Which side won (KEEP LEFT/RIGHT/BOTH)
- Where a merged copy went (slot)
- When (timestamp)

### Migration off Shipped Write Paths (D-CLOUD-029)

**Amend:** The current plan (write paths stay as shipped until #22 replaces them) is **unacceptable**. The shipped paths are newest-wins today, which violates the cardinal rule. The stopgap (`--update` on game-exit upload) must be applied **immediately**, and the boot pass must be gated on last-agreed state before the wizard ships.

**Evidence:** `autostart/102-cloud-saves` runs `cloud_restore --update && cloud_backup --update`, which is newest-wins by construction.

---

## 2. The Known Unknowns

### 1. Is chipset a compatibility axis, and is failure loud or silent? (#19)

**Resolution plan:**
- **Measure:** Run `docs/savestate-compat-test.md` on the bench (H700 ×2, RK3326, RK3566).
- **Substrate:** Real hardware (GENERIC_X64 VM cannot test aarch64-to-aarch64).
- **Before:** #23's badge design. If failure is silent, the badge must be a safeguard (red warning icon). If failure is loud, it can be a convenience (yellow info icon).

**Evidence:** The protocol already exists and is ready to run.

### 2. Bisync against a real remote with compressed savestates, device-side rename, both-sides change, and interrupted run

**Resolution plan:**
- **Measure:** Spike inside #22 against:
  - `tools/cloud-test-backend` (WebDAV, loopback)
  - Dropbox from the device
- **Substrate:** RG35XX SP (H700) with compressed savestates (`savestate_file_compression = "true"` in `retroarch.cfg`).
- **Before:** #22's implementation. Record:
  - `--conflict-resolve none` output shape
  - `--recover`/`--resilient` behavior after interruption
  - Whether `--resync` is avoided

**Evidence:** The futro's AC (b) and (c) already name this.

### 3. The auto state (game.state.auto) is the commonest conflict

**Resolution plan:**
- **Measure:** Instrument the game-exit sync (`FileData.cpp:836`) to count how often `.state.auto` is the only changed file.
- **Substrate:** Maintainer's devices (RG35XX SP, RG353M, RG351M).
- **Before:** #23's UI design. If `.state.auto` is >50% of conflicts, treat it as a resume-point decision (label it "Resume" rather than "Auto Slot 1").

**Evidence:** `FileData.cpp.launchGame-excerpt-l740-850.cpp` shows the sync hook.

### 4. KEEP BOTH's "next free slot" is safe only if every cloud-only state was downloaded before the wizard opened

**Resolution plan:**
- **Measure:** Construct a fixture with:
  - Device: slot 1 occupied, slot 2 free
  - Cloud: slot 2 occupied (same game)
- **Substrate:** Two H700s (one to write the cloud state, one to run the wizard).
- **Before:** #23's implementation. Verify the pre-pass downloads the cloud state before the wizard opens.

**Evidence:** `docs/conflict-wizard-ia.md` § Flow assumes this, but it is untested.

### 5. No es_savestates.cfg ships; ES runs on compiled defaults

**Resolution plan:**
- **Measure:** `find / -name es_savestates.cfg` on the RG35XX SP image.
- **Substrate:** RG35XX SP (image `6d03d93946`).
- **Before:** #10's implementation. If the file is missing, the per-core directory move must create it and update RetroArch's `savestate_directory`.

**Evidence:** `SaveStateConfigFile.cpp` lines 51-55 show the template substitution.

### 6. The core build pin is not on the device

**Resolution plan:**
- **Measure:** Verify `/usr/lib/libretro/*.info` exists and contains `display_version`, not `PKG_VERSION`.
- **Substrate:** RG35XX SP.
- **Before:** #21's implementation. Emit `/usr/share/rocknix/core-pins` at image build with `<package> <PKG_VERSION>` per core.

**Evidence:** `docs/save-manifest-schema.md` §9 already names this.

### 7. BACKUPPATH == RESTOREPATH is assumed

**Resolution plan:**
- **Measure:** Audit `cloud_sync_helper` for hardcoded `/storage/roms`.
- **Substrate:** None (code audit).
- **Before:** #22's implementation. Add a warning in `cloud_sync_helper` if `BACKUPPATH != RESTOREPATH`.

**Evidence:** `cloud_sync_helper` lines 100-105 derive `CONTENTPATH` from `SYNCPATH`.

### 8. Standalone emulators' save layouts

**Resolution plan:**
- **Measure:** Document the save layouts for:
  - PPSSPP (by game ID)
  - Dreamcast (shared VMU)
  - N64 (`.eep`/`.mpk`)
  - PSX (memcards)
- **Substrate:** RG35XX SP with each emulator.
- **Before:** #20's schema finalization. The manifest must key by file path, so conflicts in multi-file saves must present as a single entry.

**Evidence:** `cloud_sync-rules.txt` already includes `/psx/memcards/*.mcd`.

### 9. The smallest panel is 480×320 (RG351M)

**Resolution plan:**
- **Measure:** Lay out the wizard at 480×320 first, using `tools/vm-visual-qa`.
- **Substrate:** GENERIC_X64 VM (640×480) and RG351M (480×320).
- **Before:** #23's implementation. If thumbnails are unrecognizable, use a list view for small panels.

**Evidence:** The futro's AC on #23 already names this.

### 10. Two devices online at once is not enforced

**Resolution plan:**
- **Measure:** Instrument the audit log to record concurrent syncs.
- **Substrate:** Two H700s syncing to the same Dropbox folder.
- **Before:** #22's implementation. If concurrent syncs are detected, the audit log must flag them, and the wizard must warn the player.

**Evidence:** The lock (`take_cloud_lock`) is per-device, not per-remote.

### 11. The round-trip suite has never run

**Resolution plan:**
- **Measure:** Build GENERIC_X64 image and run `tools/cloud-round-trip`.
- **Substrate:** GENERIC_X64 VM.
- **Before:** #22's implementation. The suite must pass before any bisync code is written.

**Evidence:** The futro's AC on #35 already names this.

---

## 3. What is missing that nobody has named

### 1. Bisync's `--resync` is a data-loss trap

**Failure mode:** An interrupted bisync run defaults to `--resync-mode path1`, which is winner-picks-all. A player who scripts `bisync ... || bisync --resync` to "make it work" ships a recency-free data-loss tool.

**Experiment:**
- Construct a fixture with:
  - Device: `game.state1` (hash A)
  - Cloud: `game.state1` (hash B)
- Interrupt the first bisync run.
- Run `bisync --resync`.
- **Expected:** The cloud copy overwrites the device copy (or vice versa), with no record.

**Evidence:** `rclone-bisync-planning.md` shows `--resync-mode` defaults to path1.

### 2. The manifest's `remote_hash` is a race condition

**Failure mode:** If a sync is interrupted after the file is uploaded but before the manifest is updated, the remote copy is orphaned. The next sync sees a file with no manifest entry and treats it as `unknown`, which may trigger the wizard unnecessarily.

**Experiment:**
- Instrument `cloud_backup` to:
  1. Upload the file
  2. Kill the process before updating the manifest
- Run a second sync.
- **Expected:** The remote file is treated as `unknown`, and the wizard may open.

**Evidence:** `docs/save-manifest-schema.md` §6 shows `remote_hash` as nullable.

### 3. The audit log is not tamper-proof

**Failure mode:** The audit log (`/storage/.cache/log/cloud_audit.log`) is append-only text, but it is not signed or hashed. A player could edit it to hide a bad merge or to frame another device.

**Experiment:**
- Construct a fixture with:
  - Device A: `game.state1` (hash A)
  - Device B: `game.state1` (hash B)
- Resolve the conflict with KEEP LEFT (Device A wins).
- Edit the audit log to say KEEP RIGHT (Device B wins).
- **Expected:** The log shows a false resolution, and there is no way to detect the tampering.

**Evidence:** D-CLOUD-027 specifies the log location and format.

### 4. The wizard's "KEEP BOTH" is not reversible

**Failure mode:** KEEP BOTH moves the merged copy to the next free slot, but there is no record of which states were merged. If the player later realizes they wanted to keep the original copies, there is no way to recover them.

**Experiment:**
- Construct a fixture with:
  - Device: `game.state1` (hash A)
  - Cloud: `game.state1` (hash B)
- Resolve with KEEP BOTH.
- Later, realize the cloud copy was the desired one.
- **Expected:** No way to recover the original cloud copy.

**Evidence:** `docs/conflict-wizard-ia.md` § Semantics shows KEEP BOTH moves to the next free slot.

### 5. The manifest's `core_build` is not validated

**Failure mode:** The manifest records `core_build` as `"unknown"` if the core-pins file is missing or the mapping fails. This could lead to false compatibility assumptions.

**Experiment:**
- Delete `/usr/share/rocknix/core-pins`.
- Run the game-exit sync.
- **Expected:** `core_build` is recorded as `"unknown"`, and the wizard may show incorrect compatibility badges.

**Evidence:** `docs/save-manifest-schema.md` §9 names the core-pins file.

### 6. The wizard's "KEEP DISCARDED SAVES" is not bounded

**Failure mode:** The setting "Keep discarded saves" is off by default with a count selector, but the count is not enforced. Discarded copies could grow without bound on card storage.

**Experiment:**
- Enable "Keep discarded saves" with count=3.
- Resolve 10 conflicts, discarding each time.
- **Expected:** Only the last 3 discarded copies are kept.

**Evidence:** `docs/conflict-wizard-ia.md` § Settings shows the count selector.

### 7. The manifest's `clock_synced` is not actionable

**Failure mode:** The manifest records `clock_synced` as `false` if the device booted without a network, but the wizard does not use this to warn the player about unreliable timestamps.

**Experiment:**
- Boot the device without a network.
- Play a game and save.
- Sync to the cloud.
- **Expected:** The wizard shows a warning about unreliable timestamps.

**Evidence:** `docs/save-manifest-schema.md` §6 includes `clock_synced`.

### 8. The wizard's "REVIEW DECISIONS" is not discoverable

**Failure mode:** The setting "Review decisions before applying" is off by default, and there is no on-screen hint that it exists. Players may not know they can review their choices.

**Experiment:**
- Run the wizard without enabling "Review decisions".
- **Expected:** No indication that a review step is available.

**Evidence:** `docs/conflict-wizard-ia.md` § Settings shows the setting.

### 9. The manifest's `replaces` is not transitive

**Failure mode:** The manifest records `replaces` as the sha256 this version replaced, but this is only one step of lineage. If a state is replaced multiple times, the audit log must be consulted to reconstruct the full history.

**Experiment:**
- Construct a fixture with:
  - Device: `game.state1` (hash A) → `game.state1` (hash B) → `game.state1` (hash C)
- Sync to the cloud.
- **Expected:** The manifest shows `replaces: B`, but there is no record of A.

**Evidence:** `docs/save-manifest-schema.md` §6 shows `replaces` as a single step.

### 10. The wizard's "COMPLETE" button is not reversible

**Failure mode:** The wizard applies all decisions on COMPLETE, but there is no way to undo a bad resolution after the fact. The only escape hatch is "Keep discarded saves", which is off by default.

**Experiment:**
- Resolve a conflict with KEEP LEFT.
- Realize KEEP RIGHT was desired.
- **Expected:** No way to undo the resolution.

**Evidence:** `docs/conflict-wizard-ia.md` § Flow shows COMPLETE applies all decisions.

---

## 4. What must be proven on hardware, and in what order

### Phase 1: Substrate Validation (Before Any Code is Written)
1. **Bisync behavior on real hardware** (Issue #22 spike):
   - Test against Dropbox from the RG35XX SP.
   - Record `--conflict-resolve none` output shape.
   - Verify `--recover`/`--resilient` avoid `--resync`.
   - **Invalidates:** Bisync-based detection if `--resync` is unavoidable.

2. **Savestate compatibility** (Issue #19):
   - Run `docs/savestate-compat-test.md` on the bench (H700 ×2, RK3326, RK3566).
   - **Invalidates:** Per-chipset namespacing (#10) if states are portable across chipsets.

3. **Round-trip suite** (Issue #35):
   - Build GENERIC_X64 image and run `tools/cloud-round-trip`.
   - **Invalidates:** Any bisync implementation if the suite fails.

### Phase 2: Manifest and Identity (Before #20/#21/#24 are Built)
1. **Manifest shape validation**:
   - Verify the allowlist excludes XML outside `savestates/` (fixture on RG35XX SP).
   - **Invalidates:** Per-save sidecars if XML is excluded.

2. **Core build pin validation**:
   - Verify `/usr/lib/libretro/*.info` exists and contains `display_version`.
   - **Invalidates:** The core-pins file if `PKG_VERSION` is already present.

3. **Slot identity validation**:
   - Verify `SaveStateRepository::renumberSlots()` moves files with `copyToSlot(slot, move=true)`.
   - **Invalidates:** Hash-based identity if renumbering does not rename files.

### Phase 3: Wizard UI (Before #23 is Built)
1. **Small-panel layout**:
   - Lay out the wizard at 480×320 (RG351M) using `tools/vm-visual-qa`.
   - **Invalidates:** Side-by-side thumbnails if they are unrecognizable.

2. **Conflict batching**:
   - Construct a fixture with 10 conflicts across 3 games.
   - **Invalidates:** System-by-system walkthrough if batching by game is faster.

3. **Auto state frequency**:
   - Instrument the game-exit sync to count `.state.auto` conflicts.
   - **Invalidates:** Resume-point labeling if `.state.auto` is <50% of conflicts.

### Phase 4: Safety and Rollback (Before #25 is Built)
1. **Audit log tamper-proofing**:
   - Attempt to edit `/storage/.cache/log/cloud_audit.log`.
   - **Invalidates:** Append-only text if tampering is undetectable.

2. **KEEP BOTH reversibility**:
   - Construct a fixture with a merged state.
   - **Invalidates:** KEEP BOTH if the original copies cannot be recovered.

3. **Concurrent sync detection**:
   - Run two syncs to the same Dropbox folder from two H700s.
   - **Invalidates:** Per-device lock if concurrent syncs corrupt data.

### Phase 5: Migration (Before #22 Replaces Write Paths)
1. **Stopgap validation**:
   - Add `--update` to the game-exit upload and verify it skips newer cloud copies.
   - **Invalidates:** The stopgap if it does not prevent clobber.

2. **Last-agreed state validation**:
   - Construct a fixture with a both-sides-changed save.
   - **Invalidates:** The boot pass if it does not refuse the conflict.

3. **Manifest race condition**:
   - Interrupt a sync after upload but before manifest update.
   - **Invalidates:** The manifest schema if the remote copy is orphaned.

---

## Summary of Critical Risks

1. **The shipped write paths are newest-wins today** (blindspot 28). This must be fixed before any detector is built.
2. **Bisync's `--resync` is a data-loss trap**. The detector must never run it on its own.
3. **The manifest's `remote_hash` is a race condition**. The upload step must atomically update both the file and its manifest entry.
4. **The audit log is not tamper-proof**. It must be signed or hashed.
5. **KEEP BOTH is not reversible**. The wizard must record which states were merged.

**Order of operations:**
1. Fix the shipped write paths (stopgap: `--update` on game-exit upload).
2. Validate bisync behavior on real hardware.
3. Run the round-trip suite.
4. Finalize the manifest schema.
5. Build the wizard UI and test on small panels.
6. Implement the audit log and test tamper-proofing.
7. Replace the write paths with bisync-based detection.

=== END mistral-analysis.md ===
