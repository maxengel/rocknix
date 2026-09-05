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

=== START gpt-analysis.md ===

# Verdict: retain the core ideas, but replace the sync safety boundary

**This is a promising foundation, but not yet a safe implementation contract.** I would retain content-addressed save versions, per-device manifests, per-core savestate directories, and the native walkthrough. I would not build the production write paths around the assumption that “bisync with `--conflict-resolve none` reports conflicts and leaves their files untouched.”

The central change I recommend is:

> **ROCKNIX owns classification, the proposed resolution, and the recoverable commit. rclone transports explicitly selected artifacts. bisync is an evaluated component, not the authority that decides when player data may change.**

Three findings make this more than a preference:

1. **The proposed content identity does not yet supply a complete model of moves, provenance, or deletion.** A hash identifies bytes; it does not identify their owner, logical save, or causal history.
2. **The ES helpers are naming and allocation primitives, not verified transaction primitives.** The embedded implementation contains an auto-only allocation failure and a copy function that returns success without checking its copy results.
3. **The design postpones recovery machinery that V1 already needs.** An audit line cannot recover bytes, and “decisions are discarded after interruption” is safe only before application starts.

The signed-off schema and alignment review say that no schema changes remain. I disagree: origin versus possession, payload/thumbnail association, publication completeness, and agreement scope need decisions **before #21 makes the schema real**. This is a request to reopen the relevant portion of **D-CLOUD-031**, not permission to disregard it silently.

Sources: [`save-manifest-schema.md`](research/council-runs/2026-09-05-conflict-resolution-foundation/_sources/repo/docs/save-manifest-schema.md) (S3), [`save-manifest-alignment-review.md`](research/council-runs/2026-09-05-conflict-resolution-foundation/_sources/repo/docs/save-manifest-alignment-review.md) (S4), and [`decision-register.md`](research/council-runs/2026-09-05-conflict-resolution-foundation/_sources/repo/docs/decision-register.md) (S6).

## Disposition by component

| Component | Verdict | Required change |
|---|---|---|
| Detection | **Replace the proposed correctness boundary** | Do not infer “read-only detector” from `--conflict-resolve none`. ROCKNIX must positively authorize every mutation. |
| Version identity | **Endorse D-CLOUD-030’s SHA-256 identity** | Scope equality to a logical save context; do not equate byte equality with a move or provenance. Narrow automatic compaction. |
| Lineage | **Amend** | Distinguish replacement, movement, copying, and the state actually loaded to begin a session. A one-step `replaces` field is not complete lineage. |
| Per-device manifest | **Endorse the shape; reopen D-CLOUD-031’s sufficiency** | Separate origin from the device reporting a materialization; represent bundles, publication completeness, and namespace-scoped agreement. |
| Core namespace | **Endorse D-CLOUD-017** | Implement a genuine two-reader migration. Creating `es_savestates.cfg` changes more than directory substitution. |
| Presentation | **Endorse most of IA rev 4; amend safety semantics** | No preselected destructive answer; distinguish pre-pass transfers from conflict application; make uncertainty and recoverability usable in the flow. |
| KEEP BOTH | **Endorse re-slotting, not raw helper reuse** | Add checked allocation, reservations, destination validation, and state/PNG verification. Define auto-state behavior explicitly. |
| Audit | **Endorse D-CLOUD-027** | Keep the text log, but do not use it as the recovery journal or complete lineage store. |
| Recovery | **Move the minimum into V1** | Durable preimages and an idempotent application journal are prerequisites. A full history browser can remain V2. |
| Migration from current writers | **Endorse D-CLOUD-029’s deliberate cutover** | Replace every save-writing entrance together; do not introduce another `--update` stopgap or leave direct upload/download bypasses. |

**Evidence convention.** Statements about functions below follow from the embedded code. Hardware observations are attributed to the documents reporting them; I have not reproduced them. Predictions about unembedded rclone internals are explicitly identified as hypotheses. Source numbers identify the supplied sources; their exact declared paths and supplied SHA-256 values are recorded in the provenance appendix.

---

# 1. The end-to-end architecture

## 1.1 Detection: “no chosen winner” is not “no mutation”

The adoption argument repeatedly makes this transition:

- `--conflict-resolve none` does not choose a winning version;
- therefore bisync is a detector that can run before ROCKNIX resolves the conflict.

**The second statement does not follow from the first.** Preserving both versions by renaming them is non-destructive at the byte level, but still changes the live save namespace. That is precisely the behavior ES cannot accept.

The embedded issue comment lists both `--conflict-resolve none` and the default conflict-loser renaming policy. It does not establish a supported **plan-without-mutation / apply-this-plan** interface. The old bisync plan is also not reliable evidence of such an interface: it proposes recency resolution and a prototype command, rather than reporting a successful experiment.

Sources: [`issue-22.md`](research/council-runs/2026-09-05-conflict-resolution-foundation/_sources/issues/issue-22.md) (S23), [`rclone-bisync-planning.md`](research/council-runs/2026-09-05-conflict-resolution-foundation/_sources/rclone-bisync-planning.md) (S16), and [`issue-9.md`](research/council-runs/2026-09-05-conflict-resolution-foundation/_sources/issues/issue-9.md) (S18).

**My specific expectation to test:** an ordinary, non-dry-run bisync invocation with unresolved conflicts will preserve versions through namespace changes rather than simply return a conflict report. The exact 1.75.0 behavior and suffix rules are not established by the embedded upstream evidence, because that evidence is absent.

That expectation is enough to reject putting the invocation on live saves before the spike.

### What the spike must establish

Not merely “does it print a conflict?” It must establish all of these:

- Which files and listing-state files change during a dry run?
- What changes during a real run with `none`?
- Can conflicting paths be withheld while uncontested paths are transferred?
- Does withholding a changing set of paths invalidate bisync’s baseline or require a resync?
- After ROCKNIX performs a resolution outside bisync, what does bisync conclude on the next run?
- After interruption, which baseline is authoritative?
- Can an unsupported comparison, incomplete listing, or failed parse be distinguished from zero conflicts?
- Does the comparison detect a changed, same-size SRAM file on the hashless WebDAV backend?

A grep for `conflict` in proposed filenames is a useful **negative guard**. It is not a sufficient detector interface.

### My preferred implementation boundary

Use a small ROCKNIX reconciliation layer:

1. Obtain local observations and remote evidence through rclone.
2. Match verified content versions and normalize known layout operations.
3. Compare against the local, scoped agreement record.
4. Produce a versioned plan containing exact inputs, actions, and unresolved items.
5. Transfer only the artifacts that plan authorizes.
6. Verify results before advancing agreement.

This is not an attempt to reimplement rclone’s transports or build a generic synchronizer. ROCKNIX already needs the save-specific semantics that bisync does not know: game identity, auto states, thumbnails, core namespaces, re-slotting, and non-destructive user choices.

**Reopening request:** change #9/#22 from “bisync must be the detector” to “bisync must be evaluated against this contract.” Adopt it if it satisfies the contract without private listing-file manipulation. Otherwise use rclone’s listing and copy operations directly.

### Only one agreement authority

The schema’s agreement record and bisync’s listing history must not independently authorize writes.

I would make `/storage/.cache/cloud_sync/agreed.json` the semantic authority. If bisync remains, its workdir is transport implementation state, subordinate to the ROCKNIX plan. Never infer agreement because bisync completed, and never edit bisync listings to make an externally applied resolution look accepted.

Retain the explicit persistent workdir and the prohibition on unattended `--resync`. Neither `--recover` nor `--resilient` should be treated as a promise that every interruption is automatically recoverable.

## 1.2 The conflict table needs more than “present on one side”

The three-way test in schema §3 is a good starting point for two present, verified files. Its final row is underspecified:

> only one side has it → transfer, no prompt

That collapses several different states:

- a new file;
- an intentional deletion;
- a renamed file;
- a temporarily unavailable mount;
- an incomplete remote listing;
- a filtered-out file;
- a partly published bundle.

Those must not have the same meaning.

**Recommended V1 rule:** absence is not deletion intent. Automatic deletion propagation requires an explicit, version-specific deletion record. Without that record, preserve the remaining version.

For a recorded deletion:

- delete versus unchanged may remove a materialization, after the required preservation and verification;
- delete versus modification is a conflict;
- a path that now holds a different hash must not be deleted using an old path-only instruction.

The tombstone must identify the logical occurrence and expected version, not merely “remove slot 2.” Renumbering makes that unsafe.

This also prevents bisync’s deletion semantics from quietly replacing the schema’s copy-on-one-sided-presence semantics. The project needs to decide this explicitly rather than discover it after #9 is adopted.

---

## 1.3 Identity: keep the hash, stop asking it to answer other questions

**D-CLOUD-030 is right about version identity.** Stored-byte SHA-256 survives a rename, works independently of backend hash types, and is appropriate for byte-for-byte verification.

But the schema overstates two deductions:

> same hash under a new path is a move  
> new hash at a path is a new version replacing the old version at that path

These are useful observations, not complete descriptions of the event.

The same bytes under another path may be:

- a move;
- an intentional copy;
- a second materialization of an existing version;
- a state associated with a different core context;
- a file brought back by an old device.

Likewise, the previous contents of a path may have no causal relationship to what now occupies that path.

### A renumber-and-edit example

Start with three agreed slots containing versions A, B, and C.

On one device:

1. Delete A.
2. ES moves B and C down one slot.
3. Play and overwrite the moved B with B′.
4. Capture runs only afterward.

The final path that originally held A now holds B′. A path-local comparison can incorrectly record `B′ replaces A`. If every moved state was subsequently changed, matching final hashes against old paths cannot reconstruct the moves.

The corpus says “fold moves out first,” but has not specified how to recover information no longer present in the final file tree.

Sources: [`SaveStateRepository.cpp`](research/council-runs/2026-09-05-conflict-resolution-foundation/_sources/es/SaveStateRepository.cpp) (S37), [`SaveState.cpp`](research/council-runs/2026-09-05-conflict-resolution-foundation/_sources/es/SaveState.cpp) (S38), and [`issue-24.md`](research/council-runs/2026-09-05-conflict-resolution-foundation/_sources/issues/issue-24.md) (S25).

### The minimum additional model

Keep these concepts separate:

| Concept | Meaning |
|---|---|
| Version | SHA-256 of stored bytes |
| Logical occurrence | The save or resume-point lineage being materialized |
| Placement | Current system/core/game/path/slot |
| Origin | Which capture produced the version, with which actual emulator/core |
| Observation | Which device currently possesses or publishes that placement |
| Agreement | What this device verified with this particular remote namespace |

Record moves and copies where ES performs them, rather than reconstructing all of them at the next game exit. An occurrence identifier or a durable operation record can supply the missing link. This does **not** replace hash identity or invent a second device identity.

Also, `replaces` should mean replacement, not “more progress” and not necessarily “derived from.” Loading an old numbered state and then producing a new auto state demonstrates the difference.

### Narrow automatic compaction

I recommend a refinement of **D-CLOUD-030**, not reversal of its hash decision:

- compact only numbered materializations in the same verified game and core/load namespace;
- never collapse an auto resume point into a numbered slot just because the bytes match;
- verify that the surviving state/thumbnail association is valid;
- perform deletion under the same local mutation protection as resolution;
- update placement records and record the actual outcome.

“Two slots of one game have the same state hash” is not sufficient if their load contexts or provenance associations differ. Byte equality proves that state bytes are redundant; it does not prove that every surrounding association is redundant.

---

## 1.4 The manifest: endorse per-device files, amend the semantics before capture

The reason for **D-CLOUD-031** is sound: one device-owned JSON file avoids a shared metadata file with multiple writers, and its location fits the existing saves allowlist.

The current schema nevertheless has four substantive holes.

### A. The device writing a manifest is not always the save’s producer

Consider:

1. Device A produces V in slot 1.
2. Device B downloads V and places it in slot 3.
3. Device A later replaces slot 1 with W and rewrites its manifest.

Where does V’s origin now live?

- B must not edit A’s manifest.
- B’s top-level `device` describes B.
- A’s current path map may no longer mention V.
- The local audit log is neither synced nor permanent history.

The alignment review says a merged copy becomes a new entry with `replaces = null`, with origin in the audit log. That does not resolve the schema’s top-level-device attribution problem.

**Amendment:** allow B to report that it possesses or materialized a version created by A, retaining the original capture provenance explicitly. “Nothing stamps a file it did not write” should forbid inventing provenance—not forbid recording an honest observation of imported data.

Origin must remain interpretable after the producing device changes its manifest, disappears, or is reflashed.

### B. “Union of maps” must not mean last-map-wins

Two manifests can contain the same path with different hashes. Readers must preserve both claims and match them against actual payload evidence. JSON map merge order cannot choose the cloud version.

Further, old manifest entries are not automatically additional current conflicts. A conflict concerns current verified materializations and their agreement history, not every version ever observed by any device.

### C. A manifest and its payload are not one atomic publication

Writing JSON to a temporary file and renaming it locally prevents one class of torn local read. It does not make these arrive remotely together:

- the state;
- its PNG;
- the metadata describing them;
- related files in an emulator save bundle.

A single rclone pass can expose the manifest before some payloads, or vice versa. An interruption can make that mismatch persistent.

**Amendment:** define publication completeness. At minimum, a generation must identify its required members and expected content hashes. A reader accepts a usable bundle only after those members verify. Missing or mismatched members mean **incomplete publication**, not “unknown provenance, safe to proceed.”

The screenshot needs a verified association with the state version, not just a reusable filename.

### D. Agreement must be scoped to the conversation

`agreed.json` cannot be keyed solely by relative path across arbitrary configuration changes.

Its scope must include enough information to detect a change of:

- remote/account or configured endpoint;
- cloud root;
- local root;
- relevant filter/layout generation;
- writer incarnation where necessary.

Otherwise an agreement with the previous cloud folder can authorize an overwrite in a newly selected folder.

Losing this record must cause conservative reclassification. It is not merely a performance cache that can always be regenerated from current manifests: those manifests do not encode the past conversation.

### Required schema amendment

I would reopen **D-CLOUD-031** for:

- per-version origin distinct from reporting device;
- a publication generation or equivalent completeness record;
- bundle membership, including thumbnail verification;
- explicit placement/move semantics;
- scoped agreement metadata;
- an explicit representation of deletion intent if deletion propagation is in V1.

The paths can stay exactly as decided. A synchronized SQLite database is still unnecessary. The volume described in the corpus supports plain, bounded JSON records.

Sources: S3 §§2, 5–8; S4 §§2–3; [`issue-20.md`](research/council-runs/2026-09-05-conflict-resolution-foundation/_sources/issues/issue-20.md) (S21).

---

## 1.5 Capture: the proposed hook observes the wrong thing in several common cases

The existing exit hook is the correct integration **location**, but the implementation contract needs to distinguish four moments:

1. the actual launch context is finalized;
2. the emulator finishes writing;
3. ES performs its own cleanup, restoration, and renumbering;
4. networking starts.

The embedded exit path performs `onGameEnded()` and repository refresh before starting `cloud_backup`. The cloud call is also conditional on the game-exit setting and no existing `ThreadedCloudSync`.

Source: [`FileData.cpp.launchGame-excerpt-l740-850.cpp`](research/council-runs/2026-09-05-conflict-resolution-foundation/_sources/es/FileData.cpp.launchGame-excerpt-l740-850.cpp) (S41).

### Capture must not depend on networking being enabled or available

If capture is merely inserted into the existing conditional transfer path, provenance is missed when:

- game-exit cloud sync is disabled;
- another transfer is already running;
- the device is offline;
- a network guard returns before capture.

Those are exactly the conditions that produce cross-device conflicts later.

**Recommendation:** local capture always runs for a supported completed session, including an emulator crash that may have written data. It precedes the optional network operation and persists independently of whether that operation is skipped. This remains one ES integration path; it does not revive the removed OS hook.

### Capture the emulator actually launched

The schema proposes passing `getEmulator(true)` and `getCore(true)`. Those functions resolve configured values. But `SaveState::setupSaveState()` can rewrite `-emulator` and `-core` for a selected state without changing those configured values.

**Therefore the capture context must be frozen from the finalized launch, not re-derived afterward from game settings.**

Sources: S38 `setupSaveState()` and [`FileData.cpp.getCore-excerpt-l1470-1560.cpp`](research/council-runs/2026-09-05-conflict-resolution-foundation/_sources/es/FileData.cpp.getCore-excerpt-l1470-1560.cpp) (S42).

### An exit-time observation is not automatically an emulator write

`SaveState::onGameEnded()` can:

- remove an unchanged copied slot;
- remove the current auto-state path;
- restore its `.bak`;
- renumber numbered states.

A metadata pass after that cleanup sees ES’s final materialization, not necessarily the state the emulator just wrote. The capture system must preserve that distinction or it will attribute restored old data to the just-finished session.

### Time-window selection is a hint, not a correctness mechanism

A rename preserves mtime. A state moved today can retain last year’s mtime.

Consequently, #21 can write a fresh manifest describing the new path while `cloud_backup --recent` excludes the actual renamed state. The metadata reaches the cloud, but its described placement does not.

This is a concrete reason to refine **D-CLOUD-028**:

- retain time-based discovery as an optimization for unfamiliar emulator layouts;
- include explicit dirty placements and captured content changes regardless of old mtime;
- never stamp every file inside the ten-minute window as having been produced by the game just exited.

The rule that rejected ROM-name filtering remains correct. The alternative is **observed changes and layout adapters**, not a return to filename guessing.

---

## 1.6 D-CLOUD-028’s latency goals and the schema’s remote-hash promise conflict

The alignment review requires all of the following:

1. write the manifest before the existing recent upload;
2. add no rclone spawn;
3. obtain `remote_hash` after uploading;
4. have the uploaded manifest expose that hash.

Those four requirements cannot be satisfied by the described single `rclone copy` pass. A post-upload observation cannot be included in bytes already uploaded before the observation.

Choose explicitly between:

- `remote_hash` remaining null until a later verified observation;
- an additional batched observation/publication phase;
- a different, proven operation-scoped transport interface.

Do not obtain the hash after upload, write it locally, and imply that the manifest already in the cloud contains it.

There is also a more fundamental limit:

> With local L and old agreement A alone, the exit path cannot distinguish “cloud still holds A” from “another device changed the cloud to C.”

A blind overwrite behaves identically in those two worlds and is unsafe in one.

**My recommendation is to reopen D-CLOUD-028’s prohibition on remote observation for changed data.** Preserve the important budget:

- no local changes: no remote work, and say “nothing new to upload,” not “both sides are in sync”;
- no usable network: immediate skip;
- changed data: batched evidence gathering and verified transfer, with measured cost;
- no per-file rclone process launches.

An immutable-candidate-only exit upload could avoid reading the current canonical path, but that is different semantics: it publishes progress for later reconciliation rather than immediately making a shared canonical tree agree.

Source: [`rclone-cloud-sync.md`](research/council-runs/2026-09-05-conflict-resolution-foundation/_sources/repo/.claude/rules/rclone-cloud-sync.md) (S9), S4 §3.3, and [`cloud_backup`](research/council-runs/2026-09-05-conflict-resolution-foundation/_sources/repo/projects/ROCKNIX/packages/network/rclone/sources/cloud_backup) (S29).

---

## 1.7 Presentation: preserve the walkthrough, remove false assurances

I endorse:

- system → game ordering;
- cloud consistently on the left;
- genuine-conflict counts;
- screenshots only when they actually describe that state;
- a save glyph for in-game saves;
- no file size or playtime as progress proxies;
- explicit compatibility information;
- a persistent result page.

Source: [`conflict-wizard-ia.md`](research/council-runs/2026-09-05-conflict-resolution-foundation/_sources/repo/docs/conflict-wizard-ia.md) (S2).

I would amend five semantics.

### 1. State the cancellation boundary accurately

The IA promises both:

- non-conflicting files are applied before the walkthrough;
- quitting leaves both sides exactly as they were.

Those cannot both describe the entire sync.

Recommended meaning:

> The pre-pass may synchronize uncontested data. No **conflict resolution** is applied before COMPLETE. Quitting discards the conflict choices.

If the literal stronger promise is desired, the pre-pass must stage rather than materialize its changes, and the allocator must use a virtual inventory. That is a larger design change. I prefer the scoped, honest guarantee.

Thumbnail downloads to private staging are also transfers; they should not be confused with applying a choice to active save data.

### 2. A one-sided destructive answer must not be preselected

The initial focus may be on a control, but KEEP LEFT or KEEP RIGHT should not already constitute a resolution. Otherwise a sequence of CONTINUE presses silently chooses one side by layout.

Every conflict needs an affirmative decision. No recency-derived default, and no implicit “cloud wins because it is first.”

### 3. Unknown metadata cannot support a forced, irreversible guess

Two SRAM panels can both show:

- no screenshot;
- unknown device;
- unknown emulator;
- unreliable time.

The wizard then has no meaningful evidence with which to distinguish progress. It must not pressure the player into destroying one version merely to complete the pass.

I recommend reopening the IA’s **off-by-default discarded-save retention**. Default bounded retention on, make the control available inside the walkthrough, and provide at least a native way to undo the last resolution. Full history browsing can remain #25.

This is a reopening request against the IA’s settled rev-3 choice, not against D-CLOUD-027. The audit log can remain support-only.

### 4. KEEP BOTH for auto states needs a named active resume point

There is only one canonical `.state.auto`.

My suggested semantics:

- preserve this device’s current auto state as the active resume point;
- put the cloud auto state in the next numbered slot;
- show that consequence before COMPLETE.

Both versions survive; this is not a recency decision. But the fact that one remains the automatic resume point must be visible. “Keep both” alone does not explain it.

### 5. Shared saves need a shared-save screen, not a fictional game

A VMU or memory card may contain progress for several games. Label it as that shared storage unit. Do not assign the whole card to the last game launched merely to fit system → game ordering.

On 480×320, preserve the two-column overview but allow a focused screenshot to expand for inspection without changing side identity or the pending choice. A screenshot that technically fits but cannot be recognized is not a useful comparison.

Sources: [`issue-23.md`](research/council-runs/2026-09-05-conflict-resolution-foundation/_sources/issues/issue-23.md) (S24), [`es-native-ui.md`](research/council-runs/2026-09-05-conflict-resolution-foundation/_sources/repo/.claude/rules/es-native-ui.md) (S12), and [`es-menu-map.md`](research/council-runs/2026-09-05-conflict-resolution-foundation/_sources/repo/docs/es-menu-map.md) (S13).

---

## 1.8 KEEP BOTH: the existing ES primitives are not yet safe enough

The corpus’s strongest “already solved” claims concern these helpers. Reading their implementations produces a different conclusion.

### Evidence: auto-only repositories return `-99`

`getNextFreeSlot()`:

- returns the first slot when `states.size() == 0`;
- otherwise searches for an occupied slot from 99999 down to zero;
- returns `-99` if none is found.

A repository containing only an auto state is **not empty**, but its slot is negative. No numbered slot is found. The function returns `-99`, not slot 0.

That is directly relevant to a design that expects auto states to be the commonest conflict.

### Evidence: allocation uses cached repository contents

`getNextFreeSlot()` does not refresh the repository. Multiple KEEP BOTH decisions made before materialization can all obtain the same next slot unless the caller maintains reservations.

The pre-pass does not solve this.

### Evidence: `copyToSlot()` reports success without checking the copies

After checking that the source exists and the slot is nonnegative, the function calls `copyFile()` or `renameFile()` for the state and screenshot and then returns `true`. It does not test those results.

Disk-full, read-only destination, or a failed PNG copy can therefore produce “success.”

### Evidence: the destination comes from the source’s parent

`makeStateFilename()` constructs its full path using the parent of `fileName`. A cloud state represented by a `SaveState` object in private staging will be copied to another name **inside staging**, not necessarily into the live game’s namespace.

### Also: support is not universal

`SaveStateRepository::isEnabled()` rejects non-RetroArch emulators. The current helper is not evidence that every standalone savestate has a valid KEEP BOTH implementation.

Sources: S37 `getNextFreeSlot()` / `isEnabled()`; S38 `makeStateFilename()` / `copyToSlot()`.

### Required merge contract

Reuse ES’s naming conventions and allocator through a checked adapter:

1. refresh the relevant repository;
2. include verified cloud occupancy for that namespace;
3. maintain reservations for the whole pending batch;
4. reject sentinel or invalid slots;
5. verify that the destination is inside the intended active namespace and unoccupied;
6. copy state and PNG without overwriting unapproved content;
7. re-read and verify their bytes;
8. update placement and agreement records;
9. only then remove an authorized redundant source.

Do not call `copyToSlot(..., true)` as the safety mechanism. Copy–verify–delete under **D-CLOUD-026** is the relevant rule.

The pre-pass gate is necessary under the current IA, but not sufficient. It proves, at best, occupancy at one observed time. It says nothing about stale ES caches, reservations for other choices, or a second device publishing while the player is deciding.

---

## 1.9 Safety and rollback: recovery is V1; a history product may be V2

I distinguish three things the corpus sometimes groups together:

1. **Crash recovery:** finishing or safely abandoning an interrupted application.
2. **Undo:** recovering from the player’s wrong choice.
3. **History browsing:** exploring older snapshots.

Only the third can comfortably remain wholly in V2.

An append-only audit log does not preserve state bytes. A rotating log also cannot be the only record of lineage “beyond one step.” **D-CLOUD-027 should remain the audit decision, not become a transaction-store decision.**

Sources: S6 D-CLOUD-027, [`issue-25.md`](research/council-runs/2026-09-05-conflict-resolution-foundation/_sources/issues/issue-25.md) (S26), and [`engineering-practices.md`](research/council-runs/2026-09-05-conflict-resolution-foundation/_sources/repo/.claude/rules/engineering-practices.md) (S10).

### Minimum V1 application protocol

Before any destructive materialization:

- retain and verify both original versions and their associated assets;
- persist the exact approved input hashes and intended output placements;
- ensure enough space exists for the recovery unit;
- revalidate that the inputs still match the approved plan.

Once COMPLETE has been accepted:

- persist application intent durably;
- apply through idempotent steps;
- verify each output;
- advance agreement only for verified results;
- record completion separately from intent.

An interruption **before** application can discard decisions. An interruption **during** application must retain the journal and recovery material. Treating both as “discard choices and start again” risks applying a second plan to a half-applied first one.

Audit lines written before deletion should say **intent**, not falsely assert that the deletion happened. Completion records follow verified effects.

### Cross-device concurrency requires preservation, not a pretend lock

A device-local flock cannot serialize two handhelds. Nor is “one player, never concurrent” equivalent to “one synchronizer, never concurrent”: device A can be boot-syncing while the player uses device B.

With arbitrary rclone backends, a check followed by a write is not a general compare-and-swap operation. A remote lock file created by “check absence, then copy” has the same race.

For a defensible V1, I recommend:

- immutable, device-attributable recovery/publication artifacts for every version about to participate in a replacement;
- retention of new candidate bytes as well as overwritten preimages;
- publication records that identify the base versions the writer observed;
- preservation of unresolved publications outside ordinary bounded “discarded saves” eviction.

Canonical ES names may remain materialized views for compatibility. They must not be the only surviving copy of a contested version.

This does **not** promise globally atomic synchronization across 69 backends. It promises that concurrent conforming writers cannot destroy the only copy of each other’s progress, and that their competing publications remain discoverable. That narrower promise must be tested explicitly.

If the team wants a truly single authoritative cloud head with transactional updates, it needs stronger backend semantics than this corpus establishes. Do not simulate those semantics with ordinary file existence checks.

---

## 1.10 Migration: one guarded entrance, several user-facing workflows

Respect **D-CLOUD-029**: no interim `--update` patch. But #22 must replace the complete save-writing surface, not only three named calls.

Inventory:

- startup sync;
- game-exit upload;
- menu SYNC;
- direct UPLOAD;
- direct DOWNLOAD;
- save-data phases of the multi-tier hub;
- Tools/script invocations;
- #37’s future savestate-manager sync;
- any later shutdown operation.

All must enter the same classifier and application layer. A direct “upload” may choose direction; it must not mean “bypass conflict protection.”

Sources: S29; [`cloud_restore`](research/council-runs/2026-09-05-conflict-resolution-foundation/_sources/repo/projects/ROCKNIX/packages/network/rclone/sources/cloud_restore) (S30); [`102-cloud-saves`](research/council-runs/2026-09-05-conflict-resolution-foundation/_sources/repo/projects/ROCKNIX/packages/network/rclone/autostart/102-cloud-saves) (S35); S13; and [`issue-37.md`](research/council-runs/2026-09-05-conflict-resolution-foundation/_sources/issues/issue-37.md) (S28).

### Preserve behaviors, not unsafe mechanisms

| Existing behavior | New home |
|---|---|
| Restore before upload | Reconcile remote evidence before authorizing an upload; not a blind restore pass |
| Per-device cloud lock | One coordinator for the whole operation, not separate locks with a gap between phases |
| Recent exit work | Dirty-content/placement selection, with time as a hint |
| Fast offline answer | Local preflight, without suppressing capture |
| Last-run stamps | Verified operation outcomes; pending conflicts are a distinct result |
| Save/content/system boundaries | Non-negotiable policy around selected paths |
| Existing menu shortcuts | Remain where their cadence requires them |
| Existing old layouts | Readable without guessing provenance |
| Unknown or unsupported metadata | Conservative handling, never success-by-omission |

The embedded boot script runs backup even if restore fails; its two commands are not joined with `&&`. It also releases the script lock between directions. The unified operation should not inherit either behavior.

### Bootstrap must be a product path

“First bisync run is an explicit maintainer-driven step” is acceptable for a spike, not a finished console-first migration.

For a fresh device or lost agreement state:

- equal verified contents establish agreement;
- one-sided content is preserved and safely transferred;
- differing pre-existing contents go to the ordinary conflict workflow;
- no historical agreement is invented;
- initialization never chooses `path1`, recency, or another blanket winner.

Retain the ban on unattended unsafe `--resync`. If bisync cannot initialize conservatively behind the product’s ordinary flow, that is evidence against making it a hard dependency.

### Mixed-version writers must be tested

New guards do not constrain an old handheld still running copy-based newest-wins sync. No manifest field makes that old binary cooperate.

The release needs a deliberate protocol transition:

- read legacy data conservatively;
- isolate recovery/publication artifacts from old writers;
- test an old writer against a new one;
- either keep new authoritative state out of the legacy writer’s destructive reach or explicitly limit the guarantee to upgraded writers.

Because D-CLOUD-029 says the maintainer is the only current user, coordinated activation on the bench is practical. That opportunity should be used rather than silently assuming mixed-version safety.

Source: [`upgrade-and-install.md`](research/council-runs/2026-09-05-conflict-resolution-foundation/_sources/repo/.claude/rules/upgrade-and-install.md) (S11).

---

# 2. Resolution plans for the eleven known unknowns

| # | Assessment | What to measure, where, and before what |
|---|---|---|
| **1. Chipset compatibility and silent failure** | **Still unknown; partly mis-framed.** Passing two cores does not establish universal compatibility. Same build pin is evidence, not a serialization ABI guarantee. | Start with **RG35XX SP ↔ RG-SP**, using identical frontend/core/options and a visually verifiable content-less state. Then the six directed H700/RK3326/RK3566 pairs, a second core, and a different-core-build test. Run corruption tests in isolated save storage, then continue execution, save, and reload—not only inspect the first frame. **Before #23 badge severity is designed.** D-CLOUD-025 remains binding. |
| **2. bisync semantics and competing agreement state** | **The main architectural gate.** The corpus does not establish the required non-mutating detector contract. | On **GENERIC_X64**, use loopback WebDAV and MinIO; on **H700**, repeat against an isolated real-remote prefix. Exercise genuine `#RZIPv` states, same-size SRAM edits, renames, changing exclusions, first run, lost workdir, and interruption at several phases. Compare payload and workdir inventories before/after every operation. **Before choosing #9/#22’s implementation boundary.** |
| **3. Auto states as the commonest conflict** | **“Every session diverges” is false as a general statement.** Properly sequenced A-upload/B-download/B-play/B-upload is one-sided advancement. Also, ES may restore the old auto state after a numbered-state launch. | On the **two H700s**, trace auto, numbered, PNG, and `.bak` hashes for new-game, auto-resume, numbered-resume, normal exit, and crash. Compare sequential synchronized sessions with genuinely offline forks. Measure conflicts by kind per session. **Before auto-state capture semantics and #23’s resume-point interaction are fixed.** |
| **4. KEEP BOTH pre-pass gate** | **Necessary but insufficient.** Cached ES inventory, batch reservations, and changes during the walkthrough remain. | Plant cloud-only high slots, an auto-only repository, and multiple KEEP BOTH candidates. Interrupt a download; change cloud occupancy from the second device while review is open. Verify no collision or false success. **VM first, then H700 pair; before #24 application code and #23’s gate contract.** |
| **5. No shipped `es_savestates.cfg`** | **Its absence is already reported by the alignment review.** The unresolved question is behavior, not where to find a nonexistent shipped file. | On **H700**, compare default mode with a scratch per-core configuration: actual launch arguments, state directories, auto-resume, incremental slots, and legacy discovery. `SaveStateConfigFile` sets `racommands=false` in config-driven mode, whereas the compiled default uses `true`; it also has different defaults for autosave/incremental fields. **Before #10.** Need the unembedded launch/settings sources to finish the analysis. |
| **6. Core pin and exit context** | **Pin absence is already reported; context correctness is not solved by calling getters.** | Emit pins from effective package resolution, accounting for overrides and patches; verify the installed file against built cores. On **H700**, launch a state whose configured core differs from the game default and verify capture follows the actual launch. Record unknown honestly. **Before #21 ships; pin emission can be prepared alongside the schema amendment.** |
| **7. `BACKUPPATH == RESTOREPATH`** | **Not merely a hypothetical customization.** The shipped config explicitly describes setting them differently to avoid replacement. A warning is insufficient for a two-way engine. | In a **VM**, set distinct roots, then alias paths referring to the same root. Ensure ordinary sync either has a defined safe model or refuses before writing. Preserve the existing settings rather than silently rewriting them. **Before #22’s configuration and agreement-key design.** |
| **8. Standalone and multi-file saves** | **A correctness question, not only presentation.** Per-file one-sided changes can combine two inconsistent halves without any file being classified divergent. | On devices supporting the emulator, trace writes for **PPSSPP game-ID directories, Dreamcast VMU, PSX cards, and N64 layouts**. Create disjoint edits to different members of one save set on two replicas. Establish bundle boundaries and shared-card labels. **Before #21 attribution and #22 classification, not after the wizard is built.** |
| **9. 480×320 readability** | **Requires physical recognition testing.** A frame proves layout, not recognizability or safe choice. | Use **RG351M**, with nearby-looking gameplay moments, long names, unknown metadata, and a newer-but-less-progress case. Have the maintainer identify the intended version before pressing. Compare fixed overview with focus-to-enlarge. Use 640×480 as the second layout. **Before #23 visual design is frozen.** |
| **10. Two devices online together** | **The model does not exclude it.** One player can have two startup jobs running. | On **the H700 pair**, synchronize simultaneous edits; delay one writer between observation and commit; interrupt either device; repeat without overlapping game sessions. Require every unique version to remain recoverable and the race to remain discoverable. **Before approving #22’s commit/publication protocol.** |
| **11. Unrun round-trip suite** | **The existing image removes the cold-build prerequisite, not the verification gap.** The embedded harness also lacks the claimed new manifest and two-device conflict tests. | First inspect and run the harness on **disposable GENERIC_X64 VMs**, WebDAV and MinIO. Repair or explicitly classify stale assertions, add the manifest, same-size-save, and two-device cases, and verify both clean-install and populated-upgrade paths. **Before #22 implementation depends on a green baseline.** Do not run it unchanged against the maintainer’s configured handheld. |

Relevant sources: [`savestate-compat-test.md`](research/council-runs/2026-09-05-conflict-resolution-foundation/_sources/repo/docs/savestate-compat-test.md) (S8), [`issue-19.md`](research/council-runs/2026-09-05-conflict-resolution-foundation/_sources/issues/issue-19.md) (S20), [`issue-10.md`](research/council-runs/2026-09-05-conflict-resolution-foundation/_sources/issues/issue-10.md) (S19), [`SaveStateConfigFile.cpp`](research/council-runs/2026-09-05-conflict-resolution-foundation/_sources/es/SaveStateConfigFile.cpp) (S39), [`cloud_sync.conf`](research/council-runs/2026-09-05-conflict-resolution-foundation/_sources/repo/projects/ROCKNIX/packages/network/rclone/sources/cloud_sync.conf) (S33), and [`issue-35.md`](research/council-runs/2026-09-05-conflict-resolution-foundation/_sources/issues/issue-35.md) (S27).

**One protocol correction:** the older compatibility document says a portable cross-chipset result could make #10 unnecessary. That interpretation is superseded by **D-CLOUD-017**. Per-core namespacing remains useful even if same-core states are portable across every tested chipset.

---

# 3. Missing failure modes and the cheapest experiments

The blindspot register is valuable, but it should not become a checklist that limits discovery. The following are concrete failure mechanisms, not additional generic admonitions.

## 3.1 The test harness can damage the configuration it claims to protect

The embedded `tools/cloud-round-trip`:

- writes a new `rclone.conf` **before** checking which remote is first;
- does not restore that original configuration;
- restores some path settings but not all changed remote/content settings;
- has no encompassing cleanup-on-exception mechanism;
- uses a fake `.state` payload, not a loadable compressed state;
- contains no manifest-capture or two-device divergence test;
- checks some claims from output or source text rather than their effect.

Therefore its first-remote assertion does not protect a pre-existing real configuration in the way its docstring suggests. It has already overwritten it.

Its archive tests also expect the original fixture name in places where the embedded uploader adds a date to undated names. The tar-integrity step expects an actual system backup that the harness does not itself create.

Source: [`tools/cloud-round-trip`](research/council-runs/2026-09-05-conflict-resolution-foundation/_sources/repo/tools/cloud-round-trip) (S36).

**Cheapest experiment:** clone a disposable VM, plant recognizable configuration and selection values, interrupt the suite at several steps, and compare all touched configuration afterward. This is Gate 0 for trusting the suite on hardware.

## 3.2 Additional failure catalogue

| Failure | Why it is plausible or evidenced | Cheapest exposing experiment |
|---|---|---|
| **A “successful” application copies nothing** | `copyToSlot()` ignores copy/rename results. | Use an isolated read-only or full destination; invoke the existing operation and compare its return/report with destination hashes. |
| **Auto-only KEEP BOTH cannot allocate** | Direct consequence of `getNextFreeSlot()`’s negative-slot handling. | Populate only `.state.auto`, refresh, and exercise next-slot allocation. Expect the current implementation’s `-99`. |
| **Two decisions reserve the same slot** | Allocation reads a cached repository; no batch reservations exist in the helper. | Request two allocations before any file is materialized. |
| **The “merged” state remains in staging** | Destination generation uses the source parent. | Represent a cloud state from a scratch directory, perform a copy-to-slot, and inspect both scratch and live namespaces. |
| **A core-directory change also changes resume behavior** | Compiled defaults use `racommands=true`; config-derived emulator entries set it false. | Compare launch arguments and auto-state lifecycle before/after adding only the proposed configuration. |
| **A capture names the configured core, not the launched core** | `setupSaveState()` can rewrite launch arguments; configuration getters do not describe that rewrite. | Launch a state associated with another core and compare the executable/core arguments with captured metadata. |
| **A new manifest advertises an old-mtime renamed file that never uploads** | Rename preserves mtime; `--recent` filters by age. | Give states old mtimes, renumber them, update metadata, run the recent path, and compare described paths with actual remote objects. |
| **A correct state is shown with the wrong screenshot** | State and PNG are separate writes and transfers; reusable PNG paths are not version binding. | Publish a new state while retaining or delaying the old PNG. The UI must refuse to present it as a verified screenshot of that version. |
| **A state load destroys an unrelated good in-game save** | Loading a state can restore emulated SRAM, later flushed into the live save. The compatibility test currently focuses on state loading. | In isolated storage, preserve a distinct SRAM file, load an older or deliberately malformed state, wait through autosave, exit, and compare SRAM. |
| **Two devices write one “device-owned” manifest** | `cloud_device_id` deliberately honors its stored value; cloning `/storage` duplicates that value. | Clone storage to a second VM/device and run identity generation. Then test whether restore or clone detection prevents concurrent publication under one ID. |
| **The last good version disappears through retention** | A count bound that treats unresolved candidates like ordinary discarded history can evict the only useful version. | Fill retention with pending conflicts, add another resolution, and verify no unresolved or transaction-required artifact is selected for eviction. |
| **Hashless saves repeat #53, not just archives** | SRAM changes commonly preserve size; the saves path does not have the archive’s content-forced comparison mechanism. | On WebDAV, replace one `.srm` with different same-length bytes without resetting the remote. Check remote bytes, not exit status. |
| **A temporary manifest or recovery file becomes ordinary sync payload** | `+ /savestates/**` admits broad classes of files. | Leave an interrupted temporary publication and recovery artifacts under the tree, then enumerate the effective transfer selection. |
| **Mandatory exclusions lose to preserved user rules** | `cloud_sync_helper` puts user rules before defaults. Adding a default snapshot exclusion is not an unconditional boundary. | Add a broad user include, run the helper, and list whether snapshots/databases/private metadata now transfer. |
| **An apparently harmless save name targets another path** | Paths and screenshot references are remote-controlled metadata and ultimately become filesystem/command operands. | Supply traversal paths, absolute paths, symlinks escaping the root, quotes, newlines, and oversized JSON/PNG inputs. Require rejection before any write or render. |
| **Two game identities collapse** | The default savestate template uses ROM stems; the manifest’s ROM field is a filename, not a complete content identity. | Use identical stems in different subdirectories or with different content extensions/versions and observe pairing, capture, and compaction. |
| **A backend collapses two distinct names** | Case folding and Unicode normalization can invalidate a local path map without changing its JSON validity. | Upload two fixtures differing only by case or normalization to a representative path-based remote; compare actual object count and bytes. |
| **A crash creates a durable agreement for a non-durable payload** | Temp-and-rename is atomic visibility, not proof of power-loss durability across payload, journal, and parent directory. | On a disposable card, cut power at controlled application boundaries; verify retained versions and agreement after reboot. |

Sources for the identity and filter findings: [`cloud_device_id`](research/council-runs/2026-09-05-conflict-resolution-foundation/_sources/repo/projects/ROCKNIX/packages/network/rclone/sources/cloud_device_id) (S34), [`cloud_sync_helper`](research/council-runs/2026-09-05-conflict-resolution-foundation/_sources/repo/projects/ROCKNIX/packages/network/rclone/sources/cloud_sync_helper) (S31), and [`cloud_sync-rules.txt`](research/council-runs/2026-09-05-conflict-resolution-foundation/_sources/repo/projects/ROCKNIX/packages/network/rclone/sources/cloud_sync-rules.txt) (S32).

### Two implementation-level observations deserve immediate regression tests

**Result-code collisions.** The scripts reserve exit 3 for lock contention and exit 4 for no network, but also pass through rclone operation codes. `ThreadedCloudSync` interprets every 3 or 4 as those friendly skips. An actual rclone failure can therefore be mislabeled as “another sync” or “no network.”

**Aggregate failure reporting.** Both embedded backup and restore scripts exit using the save-phase status, not an aggregate including the system phase. A system-only failure can be presented as overall success.

These are code findings, not hardware results. They reinforce the need for a structured result envelope separating operation status, failure stage, raw transport code, conflict count, and verified effects.

Sources: S29, S30, and [`ThreadedCloudSync.cpp`](research/council-runs/2026-09-05-conflict-resolution-foundation/_sources/es/ThreadedCloudSync.cpp) (S40).

## 3.3 The “conflict artifacts never move” claim lacks complete supplied evidence

The alignment review attributes a universal no-move policy to **D-CLOUD-022**. The register row actually describes a deliberate repair operation: fill gaps with `--ignore-existing`, verify, then purge. That is different from automatic-sync exclusion.

Also, the supplied saves allowlist contains no conflicted-copy exclusions, and the supplied save-script option builders do not add them. Under those supplied rules, a conflicted `.srm` or a file anywhere under `savestates/` is admitted.

The effective device `.defaults` file was not embedded, so I cannot conclude that the running image lacks a further exclusion. I can conclude that the supplied templates do not prove the advertised all-tier property.

**Cheapest experiment:** place recognizable Dropbox- and Syncthing-style artifacts in both local and remote saves trees, alongside ordinary positive controls. Run backup and restore separately and inspect both sides. The existing harness’s content-upload test is not that experiment.

Codify the distinction:

- ordinary sync leaves foreign conflict artifacts alone;
- an explicit repair operation may act under D-CLOUD-022’s copy–verify–delete policy.

## 3.4 Compatibility badges must describe evidence, not certainty

A core build pin identifies source selection, not necessarily every serialization-relevant property. The package system permits device overrides; patches, build options, frontend container behavior, BIOS, ROM revision, and core settings can matter.

Source: [`CLAUDE.md`](research/council-runs/2026-09-05-conflict-resolution-foundation/_sources/repo/CLAUDE.md) (S15).

Therefore:

- “same recorded build” is honest;
- “tested on this combination” is stronger and needs a result;
- “compatible” as a universal green assurance is not earned by matching pins.

Record enough build context to interpret later failures, but do not turn every differing binary hash into a hard incompatibility rule. Cross-device binaries can differ while their state formats remain compatible.

Finally, a corrupted file can have a perfectly valid SHA-256. Hash identity is not state-format validation and certainly not evidence of greater progress.

---

# 4. What must be proven before building on this foundation, in order

There are two kinds of gates: experiments on the existing substrate **before feature implementation**, and fault-injection tests that necessarily run against the first application prototype. They should not be conflated.

## Gate 0 — Establish a safe, identifiable bench

**Substrates:** disposable GENERIC_X64 VM; spare or recoverable storage for physical devices.

- Preserve the maintainer’s actual saves and configurations outside the experiment.
- Verify the running rclone version and the actual scripts/binary under test.
- Repair or contain the harness configuration-overwrite hazard.
- Keep QA WebDAV on loopback, as **D-QA-002** requires.
- Use a disposable real-remote prefix for H700 transport tests.

**Stop condition:** any uncertainty about what device, remote, or storage tree a destructive test targets.

The existing GENERIC_X64 image means “start a cold build now” from the older futro is stale scheduling advice. Verify the image instead.

## Gate 1 — Run the existing pipeline and establish red controls

**Substrates:** GENERIC_X64 with WebDAV and MinIO.

- Run existing round-trip behavior against populated destinations.
- Observe same-size overwrite cases.
- Record current recency clobbering as an expected failing safety test, consistent with D-CLOUD-029.
- Verify lock and network skips by their effects.
- Add genuine compressed-state and PNG fixtures.

**Invalidates:** claims of a green baseline based only on written tests or prior comments.

This is the immediate application of **D-QA-001** and the project’s “verify the artifact” rule, not a request to certify an unbuilt feature.

## Gate 2 — Prove the H700 control and actual state lifecycle

**Hardware:** RG35XX SP and RG-SP, same build and core.

- Confirm distinct device identities and model labels.
- Transfer and load a recognizable state both directions.
- Exercise new game, auto resume, and numbered-state resume.
- Observe auto-state backup/restore behavior and actual launched core.
- Exercise the auto-only next-slot case.

**Invalidates:** the “every exit writes the current resume point” assumption and any belief that the existing allocator is immediately reusable unchanged.

A failed same-chipset control must be investigated before interpreting a cross-chipset failure.

## Gate 3 — Settle bisync’s role

**Substrates:** the VM backend pair, then H700 with a real remote.

Run the exact candidate 1.75.0 commands against:

- a true fork;
- a rename;
- a same-size edit;
- an interrupted transfer;
- missing agreement/listing state;
- changed filters;
- externally applied resolutions.

Capture complete before/after inventories, bytes, output, and workdir contents.

**Invalidates:** #9/#22’s current detector-only assumption if any ordinary invocation mutates unresolved paths or cannot preserve a reliable baseline across the proposed workflow.

This result should precede backend feature implementation.

## Gate 4 — Prove the concurrency preservation mechanism

**Hardware:** H700 pair.

Arrange two writers to observe the same base and then commit in the opposite order. Repeat with a power loss and with sequential gameplay but overlapping startup syncs.

**Pass condition:** each distinct candidate remains recoverable, neither device mistakes a race for an uncontested update, and a subsequent reconciliation can explain the remaining alternatives.

**Invalidates:** a design whose only protection is per-device flock plus pre-commit rechecking.

The fixture can expose the problem before implementation; the chosen preservation protocol must pass it on its first prototype before broader feature work relies on it.

## Gate 5 — Prove layout and save-unit boundaries

**Hardware:** H700 for RetroArch; appropriate owned device for each standalone emulator.

- Verify both ES and emulator use the proposed per-core path.
- Keep flat legacy states discoverable as unknown.
- Verify config-driven launch semantics, not only directory names.
- Identify and test PPSSPP bundles and shared cards.
- Check actual installed core-pin mappings.

**Invalidates:** “#10 is just a configuration change” and a universal “one file equals one user decision” model.

Complete this before capture and classification contracts are frozen.

## Gate 6 — Complete compatibility evidence

**Hardware:** H700 pair, RG351M, RG353M; SM8550 only for explicitly added test rows.

Run the rest of #19:

- directed cross-chipset transfers;
- at least two cores;
- different core builds;
- compressed and uncompressed corruption cases where applicable;
- continued play, save, and reload after a load;
- SRAM side-effect checks.

**Invalidates:** particular badge assurances, not D-CLOUD-017’s core namespace by itself.

No result should be generalized to an untested core family or ABI.

## Gate 7 — Prove human recognition and the real latency budget

**Hardware:** RG351M for the smallest panel; H700 for exit cost.

Measure:

- correct-choice rate, hesitation, and mistaken presses with real screenshots;
- unknown/unknown SRAM choices;
- KEEP BOTH’s auto-resume explanation;
- no-change and one-change P50/P95 durations;
- rclone process starts and actual remote requests;
- hashing and staging cost for large states, not only tens-of-KB examples.

**Invalidates:** a side-by-side-only design if pictures are not recognizable; an unconditional manifest rewrite if it destroys the no-op budget; a one-spawn contract that cannot carry the required verification.

## Gate 8 — Before release, prove recovery at every application boundary

This necessarily follows the first backend/UI implementation.

Kill or interrupt after:

- capture;
- staging either side;
- preserving preimages;
- persisting intent;
- materializing the state but not PNG;
- remote transfer but before agreement;
- agreement write but before completion reporting.

Then reboot and rerun.

Also exercise every caller and an old/new writer pair. Verify both a populated upgrade and clean installation.

**Pass condition:** all unique pre-resolution progress remains available, unfinished work is identified honestly, no false success stamp is written, and retry is idempotent.

This is the release gate for **D-CLOUD-024**: the wizard and its safety machinery ship together.

---

# 5. Decisions to reopen, decisions to retain, and evidence gaps

## Reopening requests

| Decision or settled contract | Requested refinement | Reason |
|---|---|---|
| **D-CLOUD-031** | Retain per-device JSON and paths; amend origin, publication/bundle, placement, and agreement semantics. | The current shape cannot reliably preserve imported provenance or identify complete publications and scoped agreement. |
| **D-CLOUD-030**, compaction portion only | Limit deletion to verified redundant numbered materializations in the same logical/load context. | State-byte equality alone does not prove that every placement and asset association is redundant. |
| **D-CLOUD-028** | Preserve fast no-op/offline behavior; allow necessary batched remote evidence for changed data and explicit dirty placements outside the time window. | Blind canonical writes cannot detect remote divergence; old-mtime renames are missed; post-upload hashes cannot appear in a pre-upload manifest without another phase. |
| **#9/#22 detector contract** | Make bisync adoption conditional on the non-mutating planning and recovery contract. | `none` does not establish that contract, and the upstream implementation evidence is absent. |
| **IA rev 3/4 retention and interruption semantics** | Bounded retention on by default; minimal native undo; discard decisions only before application, not mid-commit. | Unknown SRAM choices and interrupted application otherwise have no console-first recovery path. |
| **#25’s V2 boundary** | Bring durable preimages and application recovery into V1; leave a full history browser for V2. | V1 KEEP/discard operations already require this machinery. |

These should become new register refinements where applicable. Do not rewrite decided rows or leave supersession only in comments—the failure catalogued in blindspot 27 applies to this council’s recommendations too.

## Retain

- **D-CLOUD-017:** core directories, build information as data, honest unknowns.
- **D-CLOUD-024:** no public feature drop without the wizard.
- **D-CLOUD-025:** hardware evidence before badge severity.
- **D-CLOUD-026:** copy, content-verify, then authorized deletion.
- **D-CLOUD-027:** persistent, rotated, support-oriented text audit.
- **D-CLOUD-029:** no cosmetic stopgap before the complete guarded cutover.
- **D-QA-001/002:** hardware release verification and loopback WebDAV.

Sources: S6 and [`blindspot-register.md`](research/council-runs/2026-09-05-conflict-resolution-foundation/_sources/repo/docs/blindspot-register.md) (S7).

## Gaps surfaced to the orchestrator

The embedded corpus supports this critique, but not every requested external conclusion.

1. **No authoritative rclone 1.75.0 bisync implementation or current upstream roadmap is embedded.** Obtain pinned documentation/source and release notes before claiming what bisync does now or will support next. The planning note is not that evidence.
2. **The issue exports are principally comment threads, not the promised current issue bodies.** For example, issue 9 contains two comments and issue 25 one. I cannot independently verify the current acceptance-criteria bodies against the register.
3. **`cloud-test-backend` implementation and the effective `.defaults` files are absent.** Backend isolation and final merged filter behavior therefore require artifact verification.
4. **The full launch/settings path, `Paths.cpp`, `GuiSaveState.cpp`, `GuiMenu.cpp`, and filesystem helper implementations are absent.** Some relevant behavior is reported in the futro/review, but cannot all be derived from the embedded code.
5. **No hardware test results for #19, the new conflict protocol, or the full round-trip run are embedded.** The bench roster and earlier measurements are reported evidence, not completed gates.

The commission’s two H700 handhelds are enough to expose the most important protocol and lifecycle failures. The other devices refine compatibility and presentation. **Do not spend the scarce first hardware session on a broad matrix before proving that a same-chipset state survives the actual ES and sync lifecycle.**

The futro and changelog remain useful inputs, but not independent proof of the claims they repeat: [`vita-style-conflict-resolution.md`](research/council-runs/2026-09-05-conflict-resolution-foundation/_sources/repo/plans/conflict-resolution/vita-style-conflict-resolution.md) (S5), [`issue-11.md`](research/council-runs/2026-09-05-conflict-resolution-foundation/_sources/issues/issue-11.md) (S17), and [`cloud-sync-changelog.md`](research/council-runs/2026-09-05-conflict-resolution-foundation/_sources/repo/docs/cloud-sync-changelog.md) (S14).

---

# Appendix — `corpus.provenance.json`

Inline artifact only; no filesystem write was performed. The two arrays are parallel and follow supplied source order, S1 through S42. Hashes are the Facilitator’s **“sha256 (verified at embed time)”** values, not hashes recomputed by this council member.

```json
{
  "corpus_mode": "embedded_read_at_time",
  "source_count": 42,
  "source_order": "SOURCE 1 through SOURCE 42 in the supplied prompt",
  "hash_verification": {
    "performed_by": "Council Facilitator",
    "basis": "sha256 (verified at embed time) in each supplied source header",
    "independently_rehashed_by_council_member": false
  },
  "facilitator_manifest_read_timestamp_utc": "2026-09-05T17:32:51Z",
  "filesystem_access": false,
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
  "missing_sources": [
    {
      "description": "Authoritative rclone 1.75.0 bisync implementation, pinned documentation, and current upstream roadmap or release evidence",
      "status": "not embedded; exact behavior requires the proposed spike and additional upstream evidence"
    },
    {
      "description": "Current issue bodies and acceptance criteria distinct from the embedded comment exports",
      "status": "not available as separately verifiable bodies in the supplied issue files"
    },
    {
      "description": "cloud-test-backend implementation and effective installed cloud configuration and filter defaults",
      "status": "not embedded"
    },
    {
      "description": "Full emulator launch/settings code, Paths.cpp, GuiSaveState.cpp, GuiMenu.cpp, and filesystem helper implementations",
      "status": "not embedded; some behavior is reported second-hand in the supplied reviews"
    },
    {
      "description": "Completed compatibility bench results and end-to-end conflict or round-trip execution records",
      "status": "not embedded"
    }
  ]
}
```

=== END gpt-analysis.md ===

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
