# Step 2 review — peer assessment of the four Step 1 analyses

Method: every checkable claim below was tested against the embedded corpus (sources S1–S42 as declared in the per-source headers). I mark **[holds]** where the corpus supports the claim, **[fails]** where the corpus contradicts it, and **[unverifiable]** where the claim rests on the member's own knowledge of rclone/bisync/RetroArch/hardware that is not in the corpus — those are hypotheses for the spike, however plausible. I cite the injected analyses by filename throughout.

---

## 1. claude-analysis.md

### Claims checked

- **The boot sync races the running emulator (§3.1)** — **[holds]**, and it is the best single find in this file. `autostart/102-cloud-saves` backgrounds `cloud_restore --yes --method=copy --update` then `cloud_backup` behind a 30×2 s ping loop (`repo/.../autostart/102-cloud-saves`); RetroArch flushes SRAM every 10 s during play (`repo/docs/save-manifest-schema.md` §4, `autosave_interval = "10"`); `take_cloud_lock` serialises sync against sync, never against the emulator (`repo/.../cloud_backup`, `take_cloud_lock`). A restore landing mid-session is overwritten by the next flush while the stamp reports success. Nobody else found the real race (gemini-analysis.md found a different, mostly wrong one — see §2 below).
- **Transient duplicates and `.bak` leak during play (§1.2, §3.1)** — **[holds]**. `SaveState::setupSaveState` under `racommands` copies the loaded state to `.state.auto` (renaming the old one to `.bak`) and, for incremental configs, byte-copies it to the next free slot with an MD5 recorded; `onGameEnded` deletes the copy if unchanged and restores the `.bak` (`es/SaveState.cpp`). So during any slot-launched session, `.state.auto` is a byte-identical duplicate of the launched slot — a *systematic* duplicate D-CLOUD-030's compaction will meet constantly, and `game.state.auto.bak` matches both `+ /savestates/**` and `+ /**/*.state*` (`cloud_sync-rules.txt`) while matching neither of ES's regexes (`es/SaveStateConfigFile.cpp`, `SetupRegEx`). Correct on every step.
- **The conflict table has no deletion row, and without it the design does not converge (§1.2 Amend 1)** — **[holds]**. Schema §3's last row is "only one side has it → transfer, no prompt" with no reference to *A*. A player deletion is resurrected at the next sync, and D-CLOUD-030's local compaction is undone by the next download of the surviving cloud copy — a permanent churn loop. Verified against `repo/docs/save-manifest-schema.md` §3 and D-CLOUD-030's text in `repo/docs/decision-register.md`. This is the most consequential gap any analysis found in the schema itself.
- **Rename preserves mtime, so `--recent` is rename-blind (§3.2)** — **[holds]** as POSIX fact (correctly labelled [K]); the consequence is verified against `cloud_backup`'s `--max-age … --no-traverse` block and `copyToSlot(slot, move=true)` → `renameFile` (`es/SaveState.cpp`). A renumbered state keeps its old mtime and falls outside the exit window; the manifest's "a move updates the key" therefore cannot be driven by a time filter. gpt-analysis.md independently found the same defect (its §1.5).
- **`es_savestates.cfg` flips `racommands` (unknown 5)** — **[holds]**, jointly with gpt-analysis.md. The file-driven constructor sets `emul->racommands = false` unconditionally and defaults `autosave`/`incremental` to false, while the compiled `Default()` sets all three true (`es/SaveStateConfigFile.cpp`). Shipping any config file for #10 disables the `.auto`/`.bak` launch dance and changes incremental behaviour across every RetroArch system. A further point neither made: `setupSaveState`'s `-emulator`/`-core` rewrite is gated on `!racommands` (`es/SaveState.cpp`), so the rewrite — and with it the wrong-core-capture bug both analyses flag for #21 — is *activated* by #10's config. The "config change rather than new code" claim in `issues/issue-10.md` is wrong in at least two mechanisms.
- **Reflashed device inherits its own stale manifest (§3.8)** — **[holds]**. `cloud_device_id` seeds from the permanent MAC precisely so a reflash regenerates the same id (`repo/.../cloud_device_id`); the alignment review's "a fresh handheld receives every other device's manifest and none of its own" (`repo/docs/save-manifest-alignment-review.md` §2) is wrong for the commonest fresh-handheld case. Capture must be read-merge-write, not regenerate.
- **`agreed.json` must be scoped to remote + sync root (§1.3 Amend 2)** — **[holds]** as logic; §7's example has no such field. gpt-analysis.md's "scoped to the conversation" is the same requirement.
- **`remote_hash` as specified needs a post-upload listing, conflicting with D-CLOUD-028's one-spawn budget (§1.3 Amend 3)** — **[holds]**; §6 defines it "as reported by `rclone lsjson --hash` after the upload", and the manifest riding the same `--recent` pass cannot contain a value observed after that pass. gpt-analysis.md's §1.6 makes the same contradiction explicit. The Dropbox-hash-computed-locally fix is **[unverifiable]** but correct to my knowledge (sha256 over the file's 32-byte sha256 for files under 4 MiB) and cheap to test.
- **`getNextFreeSlot` requires `isEnabled(game)` → RetroArch-only, and needs a `FileData` (§1.5)** — **[holds]** (`es/SaveStateRepository.cpp`: `if (emulatorName != "retroarch") return false;`).
- **`{{romfilename}}` is the stem under `nofileextension = true`, so the schema's gloss on `rom` is imprecise (§1.5)** — **[holds]** (`es/SaveStateRepository.cpp` `getSaveStates` uses `getStem`).
- **The ThreadedCloudSync guard "only knows ES-started syncs" (§1.7 step 4)** — **overstated**. `mInstance` is indeed ES-internal (`es/ThreadedCloudSync.cpp`), but the script lock's exit 3 already surfaces as "SKIPPED - ANOTHER CLOUD SYNC IS RUNNING" on the card, so the unification claude asks for largely exists. The real gap is that the *boot* sync is invisible to the player (no card at all), not that ES's guard is bypassed.
- **Bisync internals (§1.1: first-run `--resync`, filters-file hash, `--max-age` phantom deletes, listing model)** — **[unverifiable]** from the corpus; all correctly labelled [K]; all consistent with rclone's documented behaviour as I know it; all cheap to settle in the spike. Note the corpus itself is contradictory on the central fact: `issues/issue-22.md` frames `--conflict-loser num` as renaming losers (a trap to avoid), while gemini-analysis.md asserts bisync "will skip the conflicting files entirely". Both cannot be true; that contradiction is itself proof the spike must run before any detector code.
- **Two-slot games card on the RG353M (§3.3)** — **[unverifiable]**, labelled [K]; likely correct (the RG353M is a dual-SD device), but the corpus never says so. The scoping conclusion stands even if the hardware premise fails.
- **Dropbox case/Unicode normalisation (§3.4)** — **[unverifiable]**; Dropbox is case-insensitive but case-preserving, and its Unicode normalisation behaviour is not in the corpus. The experiment is ten minutes; keep it as a hypothesis.

**Strongest argument:** §1.2 Amend 1 — the missing deletion row and the resulting non-convergence of both player deletions and D-CLOUD-030 compaction. Fully corpus-verifiable, fatal to the design as written, and it generalises: it forces the register to say what "never auto-delete the loser" does *not* cover.

**Weakest argument:** §1.4 Amend 1 — moving the auto-state decision into `GuiSaveState` at launch. The direction is good (it is where the player's context is, and `getGameAutoSave` exists), but as a V1 *amendment* it silently re-scopes #23 and #37, depends on `GuiSaveState.cpp` mechanics that are not embedded, adds a thumbnail fetch to the launch path with no latency budget, and rests on "this is what the Vita does", which is asserted, not shown. It should be a costed V2 proposal, not an amend.

**Concrete revisions for Step 3:**
1. Merge your deletion rows with gpt-analysis.md's intent requirement: absence ≠ deletion. Your own §3.3 (a *different populated* games card) defeats your empty-root guard — a card swap presents as a mass "deletion" of the other card's paths. Propagation needs explicit tombstones recorded at the ES delete path, plus the mass-delete guard, plus `--backup-dir` archival. Without tombstones the amendment is unsafe; with them it is right.
2. Re-scope the launch-time resolution as V2 with a cost section (launch latency, tile fetch, unverified `GuiSaveState` mechanics).
3. Add to the detector spec: exclude `.rocknix/` (and future `.snapshots/`) from the path universe; define PNG handling as bundle-with-state; and never inherit `RCLONEOPTS`/`BACKUPMETHOD` — the shipped default still contains `--delete-excluded` (`cloud_sync.conf`), which every current consumer strips ad hoc (see §5.3 below).
4. Run the thumbnail-distinguishability measurement before reopening #23's "no play time"; if `session_seconds` survives, define it per kind (exit−launch for `.srm`/auto; mtime−launch for numbered states) and get a register row, not a comment.
5. Add "what does `--conflict-resolve none` actually do to conflicted files in 1.75.0" as question zero of the spike — the corpus contradicts itself on it.

---

## 2. gemini-analysis.md

### Claims checked

- **The bisync deadlock (§1: bisync demands `--resync`, #22 forbids it)** — **[unverifiable]** as to bisync's actual behaviour, but the *structure* is sound: if the demand exists, the design deadlocks, and the corpus nowhere establishes that `--recover`/`--resilient` avoid it. Correctly framed as a reason to prefer stateless manifest diffing.
- **"bisync will skip the conflicting files entirely" (§1, Presentation)** — **[unverifiable]**, stated as fact, and contradicted by `issues/issue-22.md`'s framing that `--conflict-loser num` "renames the loser". The staging conclusion (the cloud's conflicting file must be downloaded before the wizard can show it) is true *if* the premise holds; the premise is exactly what the spike must establish. This should never have been asserted.
- **The Emulator Flush Race (§3.2)** — **[fails]** as the headline mechanism. `FileData.cpp` runs the sync after `process.run()` returns — the emulator has exited; RetroArch flushes SRAM at exit and "capture runs after exit, so the hash it records is the session's final state" (`repo/docs/save-manifest-schema.md` §4). "The OS filesystem cache may not have flushed" is not a hazard for a same-host reader — page cache is coherent. The forked-standalone-emulator tail is a thin hypothetical. Gate 1 of its §4 ("if it races, the sha256 identity foundation is void") gates the whole programme on a non-race. The real races are claude-analysis.md's boot-download-vs-play and the capture-skipped-on-exit-3 problem (claude §3.9, gpt §1.5).
- **Clock skew vs `--update` (§3.3)** — **partially holds**. A 1970-mtime save is skipped by `--update` paths and excluded from the `--recent` window — but the shipped exit path is plain `copy` (no `--update`), which transfers on mtime difference, and the new detector is hash-based and immune. claude-analysis.md's §3.11 is the more careful version of the same point.
- **Unknown 5 "answered by corpus" (§2.5)** — **superficial to the point of wrong**. Yes, `SaveStateConfigFile.cpp` checks two paths and falls back to compiled defaults. But the unknown that matters is what *creating* the file changes — the `racommands=false`/`autosave=false`/`incremental=false` flips that claude-analysis.md and gpt-analysis.md both caught. gemini-analysis.md missed the trap entirely.
- **"Measure by querying the maintainer's own `agreed.json` history" (§2.3)** — **[fails]**: `agreed.json` does not exist; the schema header says "Nothing here is built". An impossible measurement plan.
- **"during the Yocto/buildroot image assembly phase" (§2.6)** — **[fails]**: ROCKNIX is a LibreELEC/CoreELEC-derived build system (`repo/CLAUDE.md`). Small, but it signals the corpus was not read closely here.
- **The D-CLOUD-029 reopening argument (§1)** — **the strongest form of the case**. "A clobber destroys the older save permanently; a skip leaves the local save stuck but *safe*" is correct, and it is the correct way to challenge a decided row: cite the ID, give the argument. The maintainer's "same in kind" reasoning is genuinely weak — skip-then-fork preserves both copies; clobber destroys one. What the argument must concede: the futro already made this case ("turns clobber into skip … which is exactly the case that should wait") and the maintainer declined with eyes open, as the only user at risk. A reopening needs new evidence; the honest new evidence is claude's boot race, which argues for accelerating #22's gated push rather than patching the exit flag.
- **The multi-file chimera (§3.1)** — **[holds]** as a design gap (per-path keys let a player stitch `.eep` from one side and `.mpk` from the other); convergent with claude's unknown 8 and gpt's bundle analysis, and clearly stated.

**Strongest argument:** §1, "Migration off shipped write paths: REOPEN D-CLOUD-029" — data loss versus data stranding. It is the only analysis that took the maintainer's stated reasoning apart rather than around it.

**Weakest argument:** §3.2, the Emulator Flush Race — a gate-the-programme experiment built on a mechanism the corpus's own schema §4 forecloses, with a page-cache misunderstanding at its centre.

**Concrete revisions for Step 3:**
1. Withdraw the flush race; adopt claude-analysis.md's boot race and the exit-3-skips-capture problem as the real timing hazards.
2. Downgrade the bisync "skips" claim to spike question zero; note the corpus's internal contradiction on it.
3. Rewrite the unknown-5 answer around the `racommands` finding.
4. Fix the impossible `agreed.json` measurement and the build-system misnomer.
5. Keep the D-CLOUD-029 argument but re-aim it: the new evidence (boot race) justifies accelerating the replacement, and the futro's own words are the reopening brief.
6. Fold the chimera into the shared bundle treatment (directory-atomic units for PPSSPP; refuse auto-pick on shared containers).

---

## 3. gpt-analysis.md

### Claims checked

- **`getNextFreeSlot()` returns −99 for an auto-only repository (§1.8)** — **[holds]**, verified line by line. With only `.state.auto` present, `states.size() != 0`, the 99999→0 loop matches nothing (the auto state's slot is −1), and the function falls through to `return -99` (`es/SaveStateRepository.cpp`). The commonest conflict kind (auto) on the commonest layout (auto-only) breaks the design's core merge primitive — and the IA's "slot exhaustion is not a real constraint" (`repo/docs/conflict-wizard-ia.md`) never saw it. The best code-level catch in all four analyses.
- **`copyToSlot()` returns true without checking the copies (§1.8)** — **[holds]** (`es/SaveState.cpp`: two pre-checks, then unconditional `return true`). Disk-full or a failed PNG copy reports success.
- **Destination comes from the source's parent, so a staged cloud state copies within staging (§1.8)** — **[holds]** (`makeStateFilename` fullPath combines with `getParent(fileName)`).
- **Allocation reads a cached repository; batch KEEP BOTH can reserve the same slot twice (§1.8)** — **[holds]** (`getNextFreeSlot` does not call `refresh()`).
- **Config-file mode sets `racommands = false` (§1.10/unknown 5)** — **[holds]**; see §1 above.
- **The round-trip harness overwrites `rclone.conf` before asserting the first remote, and never restores it (§3.1)** — **[holds]** (`tools/cloud-round-trip`: `dev.write(RCLONE_CONF, …)` precedes the check; cleanup restores `BACKUPPATH`/`RESTOREPATH`/`BACKUPFOLDER` and the restore option but not `rclone.conf`, `SYNCPATH`, `SYNCPATH_BACKUP`, `CONTENTPATH`). The "remote asserted, never assumed" guard is weaker than its docstring.
- **The harness's device-folder assertion false-fails on dated archive names (§3.1)** — **[holds]**. `cloud_backup` stamps undated archive names (`case "${base}" in [0-9][0-9][0-9][0-9]_*) … *) target="${stamp}-${base}"`), so the listing contains `<id>/<stamp>-ROCKNIX-backup-qa.zip`, and the harness's substring check for `<id>/ROCKNIX-backup-qa.zip` fails on correct behaviour. The restore step then looks for the undated local name and false-fails again. The tar-integrity step expects a `backuptool` archive the harness never creates. All verified by reading S29 against S36.
- **Exit-code collisions: rclone's 3/4 pass through `clean_exit` and are rendered as "another sync"/"no network" (§3.2)** — **[holds]** (`cloud_backup` `report_rclone_error` maps 3/4 to rclone errors; `clean_exit ${BACKUP_STATUS}` passes them through; `es/ThreadedCloudSync.cpp` renders any 3/4 as the friendly skips). A real defect, found by reading.
- **Aggregate failure: exit code is the saves phase only (§3.2)** — **[holds]** (`clean_exit ${BACKUP_STATUS}`; `BACKUP_SYSTEM_STATUS` never reaches the exit code).
- **D-CLOUD-022 is a repair policy, not a sync exclusion; the embedded saves allowlist has no conflicted-copy rules (§3.3)** — **[holds]**. The register row describes `--ignore-existing` merge-verify-purge; `cloud_sync-rules.txt` contains no `conflicted copy`/`sync-conflict` patterns; the changelog's "no longer moved in either direction" (`repo/docs/cloud-sync-changelog.md`) is unproven for the saves tier by the embedded corpus. Correctly hedged about the unembedded device `.defaults`.
- **The cancellation boundary is mis-stated (§1.7.1)** — **[holds]**. "Non-conflicting files are applied before the walkthrough" and "quitting leaves both sides exactly as they were" cannot both be true of the whole sync (`repo/docs/conflict-wizard-ia.md`). The scoped correction it proposes is the right text.
- **Capture must not be conditional on the transfer (§1.5)** — **[holds]** (`es/FileData.cpp.launchGame-excerpt`: the `ThreadedCloudSync::start` call is gated on the setting, the binary, and `!isRunning()`). Capture inside that path loses provenance exactly when later conflicts are born. Same finding as claude's §3.9, better framed.
- **The renumber-and-edit lineage example (§1.3)** — **[holds]** as logic; path-local `replaces` after delete+renumber+overwrite attributes B′ to A. claude's related point (post-KEEP-LEFT `replaces` must come from the pre-session hash, not the manifest) is the complementary half.
- **The occurrence-identifier / durable-operation-record model (§1.3 "minimum additional model")** — **over-engineered**. The problem is real; the fix need not be a second identity system in a design whose whole point (D-CLOUD-030) was to avoid one. Capture-at-operation-time (ES already calls `copyToSlot`/`renumberSlots` — hook there) plus (path, sha256) lookup covers the example. This is the one place gpt-analysis.md adds complexity the project has deliberately designed out.
- **"An immutable-candidate-only exit upload" (§1.6)** — half-formed; either develop it or cut it.
- **Bisync epistemics (§1.1)** — **the correct stance**: the corpus does not establish a non-mutating plan/apply interface; the spike must establish behaviour before the boundary is chosen; the planning note (`_sources/rclone-bisync-planning.md`) is not evidence. Its "reopening request" — make bisync conditional on a contract — is the right way to frame what claude-analysis.md and gemini-analysis.md argue more absolutely.

**Strongest argument:** §1.8, the auto-only `getNextFreeSlot() == -99` find — concrete, verifiable, and fatal to the merge design's commonest path; found by reading the embedded code rather than trusting the corpus's "checked, not assumed" section.

**Weakest argument:** §1.3's occurrence-identifier model — a second identity system proposed in one paragraph, under-costed, against the grain of D-CLOUD-030's simplification.

**Concrete revisions for Step 3:**
1. Promote the −99, unchecked-copy, staging-parent, and cached-repo finds from "evidence" to named acceptance criteria on #24; they are the merge contract's test list.
2. Offer the cheap lineage fix (hook ES's move operations; (path, sha256) lookup) as primary; keep occurrence IDs only if that fails review.
3. Narrow the D-CLOUD-031 ask from "reopen sufficiency" to a targeted field list (origin-vs-possession, bundle membership, agreement scope, publication completeness). The maintainer signed the schema the same day; a surgical amendment list is the viable path, and it is what the register's append-only rule is for.
4. Supply the exact replacement sentence for the IA's cancellation promise.
5. Cut or develop the immutable-candidate aside.
6. Add option-hygiene to the detector contract: never inherit `RCLONEOPTS` (it ships with `--delete-excluded`) or `BACKUPMETHOD` semantics.

---

## 4. mistral-analysis.md

### Claims checked

- **The conflict-table amendment (§1, Presentation): replace "never agreed → ask" with "one-way → transfer, no prompt (conservative)"** — **[fails], and it is dangerous**. Two pre-existing copies with different content and no shared history are exactly the case the cardinal rule exists for; silently transferring either way is a silent overwrite of a genuine fork. The justification conflates two rows: a fresh handheld restoring from the cloud has *no local file to differ with* — that is the existing "only one side has it" row (download, no prompt), not the differ-no-agreement row. The schema's "never agreed means ask" (§3) is the conservative branch; mistral-analysis.md's row is mislabelled "(conservative)" while being the opposite. This must be withdrawn, not amended.
- **"The count is not enforced" for keep-discarded-saves (§3.6)** — **[fails]**: "The fixed count is also the retention rule, so discarded copies cannot grow without bound" (`repo/docs/conflict-wizard-ia.md` § Settings).
- **"`clock_synced` is not actionable; the wizard does not use this to warn" (§3.7)** — **[fails]**: "A device that booted without a network has a wrong clock; the wizard says so rather than trusting the time" (`repo/docs/save-manifest-schema.md` §6).
- **"`replaces` is not transitive … there is no record of A" (§3.9)** — **[fails]** as stated: "One step of lineage; the audit log holds the rest" (§6). claude-analysis.md's rotation-limited version of this point is the accurate one.
- **"Replace: the audit log must be mandatory from day one" (§1, Safety)** — **a strawman**: the audit log is already day-one (D-CLOUD-027); #25 is snapshots/rollback, a different thing. The verdict attacks a design nobody proposed.
- **Compaction "is destructive if the player deliberately kept both copies (e.g., for different playthroughs)" (§1, Identity)** — **confused**: D-CLOUD-030 compacts only *byte-identical* duplicates; identical bytes are the same playthrough. The real edge is the systematic `.auto`↔slot duplicate during play (see §5.7), which gpt-analysis.md's narrowing addresses. And "must be logged" is already in the row's text.
- **D-CLOUD-014 cited as the cardinal rule's source (§1, Detection)** — miscite; the cardinal rule is #11 and `.claude/rules/rclone-cloud-sync.md`; D-CLOUD-014 is the no-delete-by-default backup rule.
- **The `remote_hash` race (§1, Manifest; §3.2)** — **[holds]** as a race; but "must atomically update both the file and its manifest entry" demands an impossibility across two objects. The achievable fix is ordering plus a reader-side staleness rule (claude §1.3 Amend 4; gpt §1.4.C).
- **The audit log "is not tamper-proof … a player could edit it to frame another device" (§3.3)** — **no threat model**: the log is support-only on the owner's own device; signing it against its owner is theatre.
- **"KEEP BOTH is not reversible … no record of which states were merged" (§3.4)** — **[fails]**: "Every resolution is recorded: what conflicted, which side won, where a merged copy went, and when" (`repo/docs/conflict-wizard-ia.md` § Audit log).
- **"Batch conflicts by game" (§1, Presentation)** — muddled; the IA already walks system → game.
- **The stopgap argument and the bisync-rename trap** — **[holds]**, shared with gemini-analysis.md and the corpus respectively.

**Strongest argument:** §1 Manifest / §3.2 — the `remote_hash` publication race (an interrupted sync between upload and manifest update orphans the remote copy). Shared with two other analyses but stated plainly, with a reproducible experiment.

**Weakest argument:** the conflict-table amendment — the only proposal in any of the four files that would make the design *less* safe, by silently transferring never-agreed divergent files, while calling itself conservative.

**Concrete revisions for Step 3:**
1. Withdraw the conflict-table amendment outright.
2. Strike the four corpus-contradicted claims (retention enforcement, `clock_synced`, `replaces` record, audit-log "replace") and re-derive those sections from the sources.
3. Drop log tamper-proofing; if integrity is wanted, say against whom.
4. Replace the compaction objection with gpt-analysis.md's auto-state narrowing.
5. Recast the `remote_hash` fix as ordering + staleness, not atomicity.
6. Coordinate `session_id` with claude-analysis.md's `session_seconds` — one proposal, not two.

---

## 5. Where the four converge — and whether the convergence is right

**5.1 bisync.** Three analyses (claude, gemini, gpt) argue for replacing or demoting bisync; mistral-analysis.md endorses it with the corpus's own amendments. The convergence is *mostly* right, but for the right reason only in gpt-analysis.md's framing: the corpus never establishes what `--conflict-resolve none` does to conflicted files in 1.75.0, and the two corpus-adjacent claims contradict each other (issue-22's "renames the loser" vs gemini's "skips entirely"). The decisive *checkable* arguments are claude's: D-CLOUD-028's budget (one spawn, no listing when idle) is incompatible with a full two-sided listing on every game exit, and the filters-file-rewritten-on-every-update → `--resync` interaction (labelled [K], testable in minutes) would stall sync on every upgraded device. My position: adopt gpt's contract-first spike, with claude's two-tier detector (full reconcile + gated push) as the default plan if the spike's answers are any of the expected ones. mistral-analysis.md's endorsement does not engage with the budget problem at all.

**5.2 keep-discarded-saves default.** claude-analysis.md (§1.6) and gpt-analysis.md (§1.7.3) both want default-on, bounded. The IA's off-by-default is not a register row. I agree with them: with `--backup-dir` (the mechanism D-CLOUD-014 already uses in `cloud_backup`) the cost is near zero, the retention count bounds it, and this subsystem's shipped history is four silent-success bugs (`engineering-practices.md`). This should converge in Step 3.

**5.3 The `--delete-excluded` inheritance trap — missed by all four.** The shipped default `cloud_sync.conf` still carries `--delete-excluded` in `RCLONEOPTS`; `cloud_backup` and `cloud_restore` each strip it at load; `cloud_sync_helper` does *not* strip it from existing configs (it strips only `--verbose`). So every device carries the flag forever, and every *new* consumer of the config — the detector, a bisync invocation, the wizard's apply — must independently remember to strip it, or a `sync`-method run deletes everything outside the allowlist on the destination. The detector must also never inherit `BACKUPMETHOD=sync` semantics (a user who deliberately set it back per D-CLOUD-015 would turn the reconcile into a mirror). Concrete experiment: set `BACKUPMETHOD="sync"`, run the detector's dry run against a destination holding excluded files, and list what it would delete.

**5.4 D-CLOUD-029.** gemini-analysis.md and mistral-analysis.md want it reopened; claude-analysis.md and gpt-analysis.md endorse it. I side with endorsement, narrowly: gemini's argument is the correct one in kind (skip preserves both copies; clobber destroys one), but it is not *new* — the futro made it and the maintainer, the only person at risk, declined. A decided row is binding unless reopened, and reopening wants new evidence. The new evidence that exists (the boot race) argues for accelerating #22, not for the flag.

**5.5 Deletion propagation.** claude-analysis.md found the non-convergence; gpt-analysis.md found the intent problem. Neither remedy alone is safe: propagation without tombstones wipes the cloud on a card swap; tombstones without the mass-delete guard and `--backup-dir` archival are a slower route to the same incident. The Step 3 synthesis should be: tombstones recorded at the ES delete path + guard + archive + a register sentence scoping "never auto-delete the loser".

---

## 6. Failure modes every analysis missed

**6.1 Resolutions ping-pong across devices, ending in a silent reversal.** Trace: devices A and B diverge on path *p* (agreed *A₀*). A resolves KEEP RIGHT → uploads A's version → `agreed_a` advances. B's next sync: L=B, C=A, agreed_b=*A₀* → divergent → **the wizard opens on B with the same pair the player already settled**. If B picks KEEP RIGHT, B uploads; A's next sync sees L = agreed_a, C ≠ agreed_a → "cloud changed" → **silent download over A's explicit winner**. The last device to keep its own side wins without the other side's player ever being asked. The schema's "cloud changed → download, no prompt" assumes all cloud changes are one-sided advances; a resolution reversal violates that premise. Fix: a resolution record in the manifest (path, winner hash, loser hash, when, who) so B's wizard shows "resolved on Anbernic-RG35XX-SP, kept that copy" and B's upload of the recorded loser is classified divergent, not "cloud changed". Cheapest experiment: two H700s, one constructed both-sides conflict; resolve on A; sync B (wizard reopens); KEEP RIGHT on B; sync A and watch A's winner die silently. Thirty minutes.

**6.2 Thumbnails are sync paths with no manifest `kind` and no defined detector treatment.** `foo.state1.png` syncs under `+ /savestates/**` but has no entry kind (`state|auto|save` only) and §3's "per path" never says *which* paths. If the detector enumerates files, PNGs can phantom-conflict (both sides' PNGs differ because the states differ); if it enumerates manifest keys, PNGs transfer unclassified. The same undefined universe covers `savestates/.rocknix/manifest-*.json` (which *should* always sync and never conflict), future `.snapshots/`, and the `.bak`/`.partial` junk claude-analysis.md catalogued. The detector spec needs three explicit path classes: saves (conflict test), metadata (always sync), junk (ignore). Experiment: construct one state conflict, run detection, count rows — is the PNG a row?

**6.3 The wizard's trigger channel does not exist for the boot path, and detection coverage differs by entry point.** "A sync that reports conflicts opens the wizard" (`conflict-wizard-ia.md`) — but the boot sync is a detached shell script with no ES channel, and the exit-code space (0/3/4/other) has no "conflicts pending" value for `ThreadedCloudSync` to act on. Separately, the exit sync's `--recent` window cannot see conflicts created before the last successful stamp; a player with boot sync disabled who never opens the menu rows *never* gets detection. claude-analysis.md's §3.12 names the attention problem but not the mechanism gap. Experiment: disable boot sync, construct a conflict, play and exit games for a day — the wizard never opens.

**6.4 Kid/kiosk mode.** `docs/es-menu-map.md` is explicit: the full-UI block collapses in kid/kiosk mode, and "check it deliberately" is the rule for anything new. A conflict wizard that is unreachable in kid mode strands conflicts silently; one that forces itself open breaks the mode's contract. Nobody decided which. Experiment: enable kid mode, trigger a conflict, observe.

**6.5 Torn remote manifest on dumb backends.** Temp-and-rename protects the *local* write; the *upload* to a WebDAV remote can be interrupted mid-PUT, leaving a truncated JSON. Readers need a rule: an unparseable manifest is "provenance unknown and flagged", never "no entry → unknown → proceed". This sharpens gpt-analysis.md's publication-completeness point to the manifest object itself — and the QA WebDAV is exactly the backend where it will happen. Experiment: truncate a manifest on the QA backend, run detection, observe classification.

**6.6 Compaction and deletion must be gated on "no game running".** During any slot-launched session, `.state.auto` is a byte-identical duplicate of the launched slot (`es/SaveState.cpp`) — the systematic case of D-CLOUD-030's "same hash in two slots". A sync+compaction running mid-play would compact the player's live resume point (or ES's transient next-slot copy). This is the boot race's second head: the lock must exclude the emulator, not just other syncs. gpt-analysis.md's "never collapse an auto resume point" narrowing is the right rule for the wrong reason stated — this trace is the right reason.

**6.7 `cloud_restore` never got the `--yes` pause treatment.** `cloud_backup` gates its pauses behind `pause()`/`ASSUME_YES`; `cloud_restore` still calls `sleep 2`/`sleep 3` directly in six places. The boot sync's restore half pays ~7 s of console pauses for nobody, every boot — the same finding D-CLOUD-028 paid for on the backup side. Small, concrete, free to fix.

**6.8 mtime-precision matching.** The schema records `mtime` "so a listing can be matched without a download", but local ext4 (second resolution) and remote modtime precision vary by backend; a naive equality match manufactures false "cloud changed" verdicts. The detector needs a tolerance rule. One line, nobody wrote it.

---

## 7. Corpus gaps to surface to the orchestrator

- `docs/es-ui-style-guide.md` — the IA defers all visual design to it; **not embedded**. #23's layout review is blocked on it.
- `GuiSaveState.cpp` — the renumber-on-delete claim and every launch-time-resolution mechanic rest on it; **not embedded**.
- `Paths.cpp` — the hard-coded savestates root (cited as `:83`); **not embedded**.
- `cloud_content_backup` / `cloud_content_restore` (`CONFLICT_EXCLUDES`), `cloud_setup` (`--check`), `tools/cloud-test-backend`, `backuptool` — **not embedded**.
- Authoritative rclone 1.75.0 bisync documentation/source — **not embedded**; the planning note is not evidence, and the corpus contradicts itself on conflict behaviour (§5.1).
- The issue exports are comment threads, not current bodies — gpt-analysis.md's observation, verified (e.g., `issues/issue-9.md` is two comments, `issues/issue-25.md` one). Acceptance-criteria bodies cannot be independently verified.
- `es_systems.cfg`, `retroarch.cfg`, the two audit punch-lists — quoted, **not embedded**.

---

## 8. What changed my mind, and where I stand

**Changed:**
- I had accepted the IA's "use `getNextFreeSlot()` for merges; slot exhaustion is not a real constraint" as settled-by-reading. gpt-analysis.md's auto-only −99 find proves the corpus's "checked, not assumed" section itself was not checked far enough. The merge primitive needs a checked adapter, not reuse.
- I had read schema §3's table as complete. claude-analysis.md's deletion-row trace — especially the compaction-churn loop — shows it is not, and it is the single most important amendment on the table.
- I had treated #10 as "a config change". The `racommands=false` finding (claude-analysis.md and gpt-analysis.md independently) shows shipping `es_savestates.cfg` changes launch behaviour across every RetroArch system; #10 needs a behavioural test plan, not a layout plan.
- I had trusted the round-trip suite's self-description ("the remote is asserted, never assumed"). gpt-analysis.md's read of the harness shows it overwrites `rclone.conf` before the assertion and false-fails on dated archive names. The suite needs repair before its first run means anything.

**Where I hold against the grain:**
- Against gemini-analysis.md and mistral-analysis.md on D-CLOUD-029: endorse the maintainer's call; spend the energy on #22's gated push, not the stopgap.
- Against claude-analysis.md's launch-time resolution as a V1 amendment: right instinct, wrong scope; V2.
- Against gpt-analysis.md's occurrence identifiers: the lineage problem is real, the second identity system is not warranted; hook the move operations instead.
- Against mistral-analysis.md's conflict-table amendment: it must be withdrawn; it reintroduces silent resolution of genuine forks under a "conservative" label.

**Net assessment:** gpt-analysis.md is the strongest of the four — its code-level finds (−99, unchecked `copyToSlot`, staging-parent, harness hazards, exit-code collisions, the D-CLOUD-022 nuance) are all verified against the embedded sources and most of them are immediately actionable. claude-analysis.md is a close second — the best systems-level finds (boot race, deletion gap, rename-blindness, reflash inheritance) with a well-argued but [K]-dependent bisync replacement. gemini-analysis.md has the best single rhetorical argument (D-CLOUD-029) but several overclaims and one wrong mechanism. mistral-analysis.md is the weakest — four claims flatly contradicted by the corpus and one proposal that would make the system less safe; its genuine contributions (the publication race, the stopgap case) are better made elsewhere.