# Step 2 peer review — cloud-save conflict resolution foundation

Reviewed against the embedded corpus. Where I rely on knowledge outside the corpus (rclone bisync internals, Linux `rename(2)` semantics, `rclone hashsum`), I say so; those are hypotheses for the spike, not findings.

---

## 1. `gemini-analysis.md`

### Claims tested against the corpus

**Holds.**
- The `--resync-mode path1` trap and the "first run / after interruption needs `--resync`" hazard are in the corpus (`plans/conflict-resolution/vita-style-conflict-resolution.md` §4 step 2; `issues/issue-22.md` ACs). Gemini's "deadlock" framing (detector forbidden to `--resync`, bisync refusing without it) is a fair reading of the same two facts, though whether `--recover`/`--resilient` avoid the demand is precisely known unknown #2 — the corpus does not settle it.
- Known unknown #5: `es/SaveStateConfigFile.cpp` does look for `es_savestates.cfg` under `Paths::getUserEmulationStationPath()` then `Paths::getEmulationStationPath()` and falls back to `Default()` when neither exists. Correct, but this only re-states what the alignment review §3.2 already said; the unknown is RetroArch's directory handling and the behavioural consequences of the file's presence (see `gpt-analysis.md` §1.5/§2.5 — gemini missed those).
- Clock-skew stranding under `copy --update` and `--max-age` (unknown unknown #3): checkable against `cloud_backup` (`--max-age` from the stamp; `--update` only when passed) and `102-cloud-saves`. Real, and convergent with `kimi-analysis.md` §3.6. Note the scope: it applies to the shipped paths and to any `--update`/bisync-style comparison; a sha256-based detector never looks at mtime, so "the conflict detector will never even see the file" is only true for a bisync detector.

**Does not hold, or is asserted without corpus support.**
- **"bisync with `--conflict-resolve none` will skip the conflicting files entirely … the cloud's conflicting file is not on the device."** Not in the corpus, and it contradicts what the corpus assumes: `issues/issue-22.md` and `docs/conflict-wizard-ia.md` both say the default `--conflict-loser num` *renames* losers, which is why the IA forbids letting bisync run on a savestate tree. My own knowledge (hypothesis, not corpus): under `none`, bisync treats both sides as losers and renames both with the conflict suffix, syncing both copies to both sides. Either way "skips" is unestablished; `gpt-analysis.md` §1.1 states the more careful expectation. This matters because gemini builds a presentation amendment ("must download to staging first") on it — the amendment is still right for KEEP BOTH, but for the wrong reason.
- **The D-CLOUD-029 reopen: "A clobber destroys … A skip leaves the local save … safe until the wizard ships. This is false."** The corpus refutes the safety claim. `102-cloud-saves` runs `cloud_restore --yes --method=copy --update` *before* `cloud_backup … --update` at every boot. Trace the stopgap: exit upload with `--update` skips because the cloud copy is newer → local older-but-more-progress copy stays local → next boot, `cloud_restore --update` finds the cloud copy newer and **overwrites the local one**. The stopgap does not strand the save; it moves the clobber from game-exit to next boot. The maintainer's "same in kind, the flag only changes which copy loses" is correct at the system level, and gemini's argument is only correct for the exit path in isolation. The reopen argument fails as written. (See §5 below for the lossless stopgap nobody proposed.)
- **Unknown unknown #2, "emulator flush race — OS filesystem cache may not have flushed."** The mechanism is wrong: `process.run()` has returned, so the emulator process has exited; a file another process wrote is visible to `sha256sum` and rclone through the page cache regardless of whether it has reached the card. There is no read-coherence race on Linux here (general knowledge, not corpus). The *real* exit-time hazard is in the corpus and gemini missed it: `es/FileData.cpp.launchGame-excerpt` runs `onGameEnded()` and `refresh()` before `ThreadedCloudSync::start`, and `es/SaveState.cpp::onGameEnded` deletes the just-written `.state.auto` and restores the pre-launch `.bak` when the game was launched from a numbered slot (`gpt-analysis.md` §1.5 has this). A detached standalone emulator is a legitimate residual hypothesis; a 50 MB dummy save is not the experiment for it.
- **"Rclone handles remote concurrency safely via temporary files and atomic renames."** Not in the corpus; backend-dependent; several of the 69 backends have no atomic rename. Unestablished and should not be stated as a mitigating fact.
- **"Emit core-pins during the Yocto/buildroot image assembly phase."** `CLAUDE.md`: ROCKNIX is a JELOS fork on the LibreELEC/CoreELEC cross-compilation system. Small, but it is a tell that this section was not grounded in the corpus.
- **Known unknown #3: "verify that `copyToSlot` correctly translates a `.state.auto` into a numbered `.stateN`."** The instinct is right and the code confirms `copyToSlot` would work (the auto state's `fileGenerator` is the slot template). But gemini did not read one function up: `SaveStateRepository::getNextFreeSlot()` returns **-99** when the only state is the auto state (states non-empty; no slot ≥ 0 found; falls through to `return -99`), so the KEEP BOTH gemini wants to verify fails before `copyToSlot` is reached. `gpt-analysis.md` §1.8 has the finding.
- **Unknown unknown #1 (N64 `.eep` + `.mpk` chimera).** The principle — multi-file saves resolved per file can be stitched into an inconsistent whole — is right and convergent with `kimi-analysis.md` §3.2 and `gpt-analysis.md` §2.8. The example is weak: `.eep` is the cartridge EEPROM and `.mpk` the controller pak, which most games use independently (general knowledge). PPSSPP's per-game-ID directory and the Dreamcast shared VMU are the cases the corpus itself names (`cloud_sync-rules.txt`, D-CLOUD-028).

### Strongest argument
The stateless-detector recommendation ("use `rclone lsjson` + manifest diff + `agreed.json`; no workdir to corrupt; no `--resync` path exists to trigger"). Even with the deadlock stated more confidently than the corpus supports, the argument that a *stateful* engine with a forbidden recovery command is a fragile foundation is sound, and it converges with `kimi-analysis.md` §1.1 and `gpt-analysis.md` §1.1.

### Weakest argument
The D-CLOUD-029 reopen — refuted by `102-cloud-saves`. Close second: "do not run this spike" (known unknown #2). The corpus's own rule is *read the answer out of the running system before designing* (futro §3); gemini asks to reopen a decided dependency (#9) while declining the one experiment that would justify it. The spike's fixtures double as the adversarial suite for the manifest test either way (kimi makes this point).

### Revisions for Step 3
1. Withdraw or rebuild the D-CLOUD-029 argument to account for the boot restore; if a stopgap is still wanted, argue for the one-way stopgap in §5, not `--update`.
2. Re-state the bisync "skip" claim as a hypothesis and keep the spike as the arbiter; drop "do not run this spike."
3. Replace the flush-race section with the `onGameEnded` cleanup hazard, citing `es/SaveState.cpp` and the ordering in the `launchGame` excerpt.
4. Fold the `getNextFreeSlot()` -99 finding into known unknown #3 and hardware step order.
5. Label the concurrency/atomic-rename and Yocto claims as outside the corpus or remove them.

---

## 2. `gpt-analysis.md`

### Claims tested against the corpus

I checked every code claim; the hit rate is very high.

**Holds — verified in the embedded ES sources.**
- `getNextFreeSlot()` returns -99 for an auto-only repository (`es/SaveStateRepository.cpp`: `refresh()` leaves `slot = -1` for `matchAutoFile` hits; the loop from 99999 to 0 finds nothing; falls through to `return -99`). **Verified.** This is the single most consequential code finding in any of the four analyses, because the schema (§4) predicts auto states are the commonest conflict and the IA's KEEP BOTH reuses this function unchanged.
- `getNextFreeSlot()` does not refresh the repository (only `renumberSlots()` calls `repo->refresh()`). **Verified.**
- `copyToSlot()` ignores the return values of `renameFile`/`copyFile` and returns `true`. **Verified.**
- `makeStateFilename(slot, fullPath=true, …)` builds the destination from the parent of `fileName`, so a `SaveState` object pointing at a staged cloud file would be copied *within staging*. **Verified as far as the embedded body goes** (the header with the default for `fullPath` is not embedded; gpt's inference assumes `true`, which the `copyToSlot` call for the image confirms is the intended mode).
- `isEnabled()` rejects non-RetroArch emulators. **Verified.**
- Config-driven mode hard-codes `emul->racommands = false` and defaults `autosave`/`incremental` to false, whereas `Default()` has all three true. **Verified.** This is the second most consequential finding: #10 "create `es_savestates.cfg`" is a *launch-behaviour* change (the `.state.auto` copy/`.bak` dance and incremental slots are `racommands` behaviours), not a directory change. `kimi-analysis.md` §1.4 reads the same file and misses this.
- `setupSaveState()` can rewrite `-emulator`/`-core` for a selected state — with one refinement gpt did not state: the rewrite is gated on `!racommands`, so it is **dormant today** (compiled default `racommands = true`) and **becomes live exactly when #10 ships the config file**. That makes gpt's "capture the launched core, not the configured one" a #10 consequence, which should be said.
- `onGameEnded()` deletes the current auto state and restores the `.bak` (racommands mode, numbered-slot launch), removes an unchanged `mNewSlotFile`, and renumbers if incremental — all *before* `ThreadedCloudSync::start` in the launch excerpt. **Verified.** Corollary: "the auto state is written on every exit" (schema §4; problem-statement unknown #3) is false for sessions launched from a numbered slot. Three of four analyses built on the false premise.
- `102-cloud-saves`: two separate commands, no `&&`, each script takes and releases its own lock. **Verified.**
- Exit-code collisions: `cloud_backup`/`cloud_restore` `clean_exit` with rclone's own exit code (3 = directory not found, 4 = file not found per `report_rclone_error`), and `ThreadedCloudSync` renders any 3/4 as SKIPPED-lock / SKIPPED-no-network — and `record_last_run` stamps those, unlike the genuine skips. **Verified; a live bug.**
- Both scripts exit with the save-phase status only. **Verified.**
- `tools/cloud-round-trip` writes `rclone.conf` *before* asserting the first remote and never restores it; no cleanup on exception; fake `.state` payload; no manifest or two-device step; the `f"{device_id}/{ARCHIVE_NAME}"` assertion cannot pass against an uploader that prefixes undated names with a date; the tar-integrity step expects a `*_BACKUP.tar.gz` the harness never creates. **All verified.** The docstring's "the remote is asserted, never assumed" describes a guard that runs after the damage.
- `cloud_sync_helper` places user rules ahead of defaults, so a shipped `- /savestates/.snapshots/**` default is not an unconditional boundary. **Verified.**
- The saves allowlist contains no conflicted-copy exclusion (`+ /**/*.srm` admits `game (X's conflicted copy 2026-09-03).srm`). **Verified.** The D-CLOUD-022 row is a repair procedure, not an automatic exclusion; gpt is right that the alignment review's "never moved by us" overstates it.
- `cloud_device_id` honours the stored value; a cloned card duplicates the identity. **Verified**; convergent with kimi §3.15.
- Capture inside `cloud_backup` is skipped whenever the sync is skipped: `main()` calls `check_network_link` first (exit 4) and the ES call site is gated on `cloudsaves.gameexit == 1` and `!isRunning()`. **Verified.** Capture that rides the transfer misses provenance exactly when offline play creates conflicts. Only gpt saw this.
- The D-CLOUD-028 / `remote_hash` / "no extra spawn" contradiction: a post-upload observation cannot be inside bytes uploaded before it. **Logically verified**; the alignment review §3.3 did not price it.
- The IA's "quitting leaves both sides exactly as they were" versus "non-conflicting files are applied before the walkthrough" tension. **Verified in `docs/conflict-wizard-ia.md`.**
- Origin-vs-possession gap in D-CLOUD-031: schema §6 ("an entry is written by the device that produced the save") plus the alignment review's "#24 — a merged copy is a new entry with `replaces = null`" are in tension, and a downloaded version whose producer later overwrites its slot has no surviving provenance anywhere. **Verified as a gap in the corpus.**

**Asserted, labelled, and plausible.** Rename preserves mtime (Linux semantics); bisync renames both under `none`; check-then-write is not CAS on arbitrary backends. gpt labelled these as hypotheses. Good.

**Where I push back.**
- The "publication generation / bundle completeness / immutable candidate publication" apparatus (§1.4 C, §1.9) is heavier than the corpus's own conservative rule requires. Under schema §3, a file whose manifest entry does not match the object by hash falls into "never agreed → ask" or "unknown → ask" — already the safe branch. The one *concrete* failure gpt names that the existing rule does not catch is the state/PNG binding (wrong screenshot for the right state), and that has a one-field fix: record the PNG's sha256 in the entry and refuse to render a thumbnail whose hash does not match. gpt should scope §1.4 C down to that.
- The volume of reopen requests (D-CLOUD-028, D-CLOUD-030 compaction, D-CLOUD-031, IA retention, #9/#22, #25 boundary) is itself a cost against a register that binds until reopened. Several are justified by verified findings; each should be presented as a minimal new row citing the old ID, and gpt should rank them — the D-CLOUD-028 and #9/#22 reopens are load-bearing; the D-CLOUD-030 compaction narrowing is a refinement whose only concrete trigger in the corpus is the transient identical-hash pair `setupSaveState` creates mid-session (slot N copied to `.state.auto`), which is a sync-during-session hazard rather than a compaction hazard (see §5 A).
- "The issue exports are principally comment threads, not bodies" — a fair caution, but the problem statement says bodies *and* threads were embedded; the first entry in each file reads as the body. gpt should say "I cannot distinguish body from first comment," which is the actual limit.

### Strongest argument
§1.8 as a whole: "the ES helpers are naming and allocation primitives, not verified transaction primitives," backed by four verified code facts (-99, no refresh, unchecked copies, parent-derived destination). It directly falsifies the IA's "checked, not assumed" confidence in `getNextFreeSlot`/`copyToSlot` for merges, and the required merge contract that follows (refresh, reservations, destination validation, copy-verify-delete under D-CLOUD-026) is actionable.

### Weakest argument
§1.9's concurrency section. The diagnosis (a per-device flock serialises nothing across devices; one player can have two boot syncs running) is right, but the remedy — "immutable, device-attributable publication artifacts for every version about to participate in a replacement … publication records that identify the base versions the writer observed" — is a protocol design sketched without a cost model or an experiment that could falsify it, on a system whose budget is one rclone spawn and ~5 s. gpt's own Gate 4 fixture is the right first step; the mechanism should wait for it.

### Revisions for Step 3
1. Add the `!racommands` gate to the `setupSaveState` finding and re-file it as a #10 consequence.
2. Collapse §1.4 C to "add `screenshot_sha256`; treat mismatch as no-picture," and state explicitly that hash mismatch already lands in the conservative branch.
3. Rank the reopen requests; name D-CLOUD-028 and #9/#22 as the two that gate #22, the rest as refinements.
4. Put the round-trip `rclone.conf` overwrite at the head of the hardware plan as an unconditional stop (it is in Gate 0 but buried); say plainly the docstring's guard is inverted.
5. For §1.9, replace the protocol sketch with: run Gate 4 first; then design the smallest mechanism that passes it.

---

## 3. `kimi-analysis.md`

### Claims tested against the corpus

**Holds.**
- Two unreconciled detectors (bisync listings vs schema §3 + `agreed.json`), each with its own agreement state and no named writer for bisync's after a manual apply. **Verified against `docs/conflict-wizard-ia.md` and `docs/save-manifest-schema.md` §§2–3, §9.**
- rclone falls back to size-only with neither modtime nor hash — **verified in `cloud_backup`'s #53 comment block** and the round-trip's same-size archive step. That bisync inherits the same comparison is kimi's labelled inference (and mine: bisync's listings carry size/modtime/hash and diff against the prior listing — general knowledge, hypothesis). The QA WebDAV having neither is in the alignment review. The conclusion — SRAM changes are invisible to bisync on the QA backend, and that reads as "no conflicts" (blindspot 22) — follows and is important.
- `getSaveStateConfigs()` excludes `Default()` once `isEnabled()` is true; `defaultCoreDirectory` is the only carve-out; Option B (`directory = "{{system}}/{{core}}"`, `defaultCoreDirectory = "{{system}}"`) is code-grounded. **Verified** — a genuinely useful read of `es/SaveStateConfigFile.cpp` that nobody else did. **But incomplete**: the same file hard-codes `racommands = false` and defaults `autosave`/`incremental` to false in config mode (`gpt-analysis.md`). Option A/B both change launch behaviour unless the XML sets `autosave="true"` and `incremental="true"`, and `racommands` cannot be set from XML at all. #10 cannot be a "config change" under either option.
- Manifest churn breaks the round-trip's "nothing changed leaves the remote alone" step. **Verified logic** (`--max-age` from the stamp; a rewritten manifest is newer).
- No path from a headless sync to the wizard: boot sync output to `/dev/null`; `ThreadedCloudSync` maps 0/3/4/else. **Verified.**
- Deletion semantics absent from the IA scope table and schema §3. **Verified**; convergent with gpt §1.2.
- Exit-pass refusal (#22 AC a) contradicts D-CLOUD-028's "never probes … the remote." **Verified**; convergent with gpt §1.6.
- Wrong-clock stranding: `--max-age` excludes; `copy --update` skips. **Verified** against `cloud_backup` and `102-cloud-saves`. Kimi's "D-CLOUD-028's claim that full passes cover wrong mtimes is false for `--update` passes" is right for the boot pair and the SYNC row; the corpus does not show the flags on the bare UPLOAD row, so scope it.
- Stale `agreed.json` restoration → silent overwrite via the "cloud changed → download" row. **Verified trace** through schema §3.
- Concurrent-writer trace (B uploads, A overwrites on a stale listing, B downloads A's copy silently). **Verified trace**; it is the same table row.
- `screenshots/**` is in the allowlist and #22 inherits it. **Verified**; only kimi named it.
- Discard store's allowlist rule owned by deferred #25 while *keep discarded saves* ships with #23. **Verified** against the IA settings, schema §8, alignment review §3.1.

**Weak or overstated.**
- "Auto states diverge on every divergent session … every plane flight manufactures one per game played" (§1.5.1, §2.3 "given offline play, it *will* dominate"). The premise is partly false per `es/SaveState.cpp::onGameEnded`: a session launched from a numbered slot ends with ES deleting the session's `.state.auto` and restoring the pre-launch `.bak`. Auto-state frequency is a function of how the player launches, not of sessions. Kimi's shadow-mode census (§1.8.2) is the right instrument and should be the claim; the storm should be a hypothesis it tests.
- §1.6 endorses `getNextFreeSlot()`/`copyToSlot()` reuse "as correct and evidence-based." The evidence points the other way (gpt §1.8, verified above): -99 on auto-only repositories — the exact case kimi's §1.5.4 (KEEP BOTH on `kind: auto`) creates — no refresh, unchecked copies. Kimi's "wizard tracks its own pending allocations" is the right shape but is built on an allocator that returns a sentinel in the commonest case kimi predicts.
- §1.4 Option A ("attribution-by-configuration … `core = <default>`") — the corpus's rule is stricter than kimi allows: "nothing stamps a file it did not write" and `upgrade-and-install.md`'s "do not stamp existing data with metadata you have not verified." A visible, reversible guess is still a guess in a provenance field; the honest encoding is `core_build: "unknown"` *and* an explicit `core_inferred: true` (or leave `core` unknown), not `core = <default>`. Kimi half-says this; it should be firm.
- §1.7's "the cloud-side loser must be downloaded into the store before the winner overwrites it — a small, priced download" is right but unpriced; and the store location under `savestates/` requires the first-match rule *plus* gpt's finding that user rules precede defaults, which kimi missed.

### Strongest argument
§1.1 (a)+(b) together: the primary detector must be the one that sees SRAM on hashless backends and has a named writer for its agreement state after a manual apply. It is the clearest statement in any analysis of *why* the manifest test is not merely an alternative to bisync but the only one of the two that fits the corpus's own constraints (D-CLOUD-030's sha256, the QA backend, the no-`--resync` AC). The falsification criteria ("what would prove me wrong") are stated.

### Weakest argument
The auto-state storm framing, for the reason above; and §1.6's endorsement of the ES primitives without reading their failure paths — kimi read `SaveStateConfigFile.cpp` closely and `SaveStateRepository.cpp` loosely.

### Revisions for Step 3
1. Fold gpt's -99/no-refresh/unchecked-copy findings into §1.6 and rewrite the merge amendments as a checked adapter.
2. Add the `racommands`/`autosave`/`incremental` consequence to §1.4; Options A and B must both specify those attributes, and the migration rehearsal (§4 step 4) must assert launch behaviour (auto-resume, `-state_file` vs `-autosave`), not only discovery.
3. Re-state the auto-state storm as the hypothesis the shadow-mode census tests; cite `onGameEnded` as the reason it may be smaller than assumed.
4. In §1.3.4/§3.2, use PPSSPP and the shared VMU as the canonical multi-file/shared cases; drop reliance on N64 as an example.
5. Add "capture must run regardless of network/sync state" (gpt §1.5) to §1.8's replaced-mechanism inventory — kimi's shadow mode depends on capture having run offline.

---

## 4. `mistral-analysis.md`

### Claims tested against the corpus

**Holds.**
- The shipped write paths are newest-wins (restating blindspot 28 / futro §4). Correct, but this is the corpus's own finding, not mistral's.
- `clock_synced` is carried by the schema and unused by the IA panel spec. **Verified**; convergent with kimi §1.5.5.
- `cloud_backup --recent` carries no `--update`. **Verified.**

**Does not hold.**
- **Conflict-test amendment: "never agreed → one-way transfer, no prompt (conservative)."** This is the most dangerous recommendation in any of the four analyses and it is the opposite of conservative. Two present files with different contents and no shared history are exactly the case the cardinal rule (`rclone-cloud-sync.md`; #11) exists for; transferring one over the other is a silent overwrite. The alignment review's constraint on #22 is explicit: "a file with no manifest entry on either side is `unknown`-both and still falls under never agreed → ask." Mistral's two motivating cases are both misread: a fresh handheld has *no local file*, so it is the "only one side has it" row and already transfers without a prompt; a long-offline device with a stale agreement is precisely when asking is correct. This amendment must be withdrawn.
- "Reopen D-CLOUD-029 / apply `--update` immediately." Same refutation as gemini's: `102-cloud-saves` runs `cloud_restore --update` at boot and undoes the stranding. Mistral also cites D-CLOUD-014 as "the cardinal rule"; D-CLOUD-014 is the no-delete-by-default backup rule.
- "Compaction is destructive if the player deliberately kept both copies for different playthroughs." Two files with equal sha256 are byte-identical; there is no second playthrough in them. D-CLOUD-030's compaction is lossless by construction and the register says so. The narrower, valid concern (auto vs numbered; load context) is gpt's, not this.
- "`remote_hash` race: a remote copy with no manifest entry is orphaned." An entry-less remote file is `unknown` → conservative → the wizard asks. That is the designed behaviour, not a race, and mistral's "upload must atomically update both the file and its manifest entry" is impossible across a remote in one operation — gpt's treatment (choose explicitly between null-until-observed and an extra phase) is the correct framing.
- "Wizard must batch conflicts by game." The IA already walks "system by system, then game by game" with the game in the header. The real batching questions are per-kind (kimi §1.5.1) and multi-file bundles (gpt/kimi/gemini).
- "Replace: the audit log must be mandatory from day one" — it already is (D-CLOUD-027; IA rev 4 "resolutions are recorded in an audit log"). "It is the only way to recover from a bad merge" — a text log cannot recover bytes (gpt §1.9).
- "KEEP BOTH is not reversible: no record of which states were merged." The IA's audit section records "what conflicted, which side won, where a merged copy went."
- "Keep discarded saves count is not enforced." Nothing is built; the IA specifies the count *is* the retention rule.
- "Audit log not tamper-proof; a player could edit it to frame another device." There is no threat model in the corpus in which a single player with a root shell tampers with their own support log. Not a failure mode of this system.
- Citations: "SaveStateRepository.cpp lines 98-99" for the slot-name pattern — those lines pair the `.png` (futro table); the regex is in `SaveStateConfigFile.cpp`. "`rclone-bisync-planning.md` shows `--resync-mode` defaults to path1" — that document does not mention `--resync-mode`; the futro does.
- Hardware Phase 2 "invalidates" logic is inverted or redundant: "verify `renumberSlots()` moves files with `copyToSlot(move=true)` — invalidates hash identity if it does not" (it is in the embedded code; and non-renaming would make hash identity *more* robust, not less); "verify `.info` contains `display_version` — invalidates the core-pins file if `PKG_VERSION` is present" (schema §9 already records the device check); "verify the allowlist excludes XML outside `savestates/` — invalidates per-save sidecars" (the futro ran that fixture; D-CLOUD-031 already rejected sidecars).
- "Unknown unknown #1: bisync `--resync` is a data-loss trap … nobody named." The futro §4 step 2 and #22's ACs name it.

### Strongest argument
The insistence that the write paths are the first job, and that the both-sides-changed fixture must run through boot, exit and SYNC — correct, though it is the futro's finding restated.

### Weakest argument
The "never agreed → transfer, no prompt" table row. It would ship a cardinal-rule violation labelled as caution.

### Revisions for Step 3
1. Withdraw the conflict-table amendment and the D-CLOUD-029 reopen.
2. Remove the tamper-proofing, the KEEP BOTH-irreversibility, the compaction-destructiveness and the audit-log-blocking items; each is either already decided, already specified, or not a failure of this system.
3. Re-derive the hardware plan from what the corpus records as already verified; each step needs a result that is not yet in the corpus.
4. Correct the three mis-citations.

---

## 5. What all four missed, or under-treated

Convergence between four analyses is not evidence; here is what none of them named.

**A. Syncs are not serialised against game sessions, and ES creates transient files during a session that copy-only syncs make permanent.** `es/SaveState.cpp::setupSaveState` (racommands mode, numbered-slot launch) renames `.state.auto` → `.state.auto.bak`, copies slot N to `.state.auto` (so two files with *identical hashes* exist mid-session), and in incremental mode copies the launched state to `game.state<next>` (`mNewSlotFile`), deleting it at exit if unchanged. `102-cloud-saves` runs in the background for up to ~60 s plus transfer time after boot; the lock serialises syncs against each other, not against a game launch. A boot sync overlapping a launch uploads `.state.auto.bak` (matches `+ /**/*.state*` and `+ /savestates/**`) and a transient `game.stateN`; copy never deletes; the next sync on another device downloads them as cloud-only. The `.bak` is inert junk (it matches neither ES regex — checked against `SetupRegEx`); the transient slot copy is a **zombie savestate** the other device will show in its manager and that D-CLOUD-030's compaction may then act on. gpt's §1.5 comes closest (onGameEnded cleanup) but does not connect it to a sync running *during* the session. **Cheapest experiment:** enable startup sync, boot, launch from a numbered slot within 30 s, wait for the boot sync to finish, exit, list the remote for `.bak` and extra slot files. One H700, one boot.

**B. The stopgap debate was framed as `--update` versus nothing; the lossless stopgap is one-way.** With the boot pair and SYNC row disabled (the `SYNC SAVES DURING STARTUP` toggle already exists — `docs/es-menu-map.md`), only the exit upload runs: each device keeps its own local copy untouched; the cloud holds whichever device exited last; nothing on any device is overwritten; every divergence is preserved for the wizard's first run as "never agreed → ask." Cross-device pickup stops working, which is exactly the operation that is unsafe today. This is a maintainer setting, not a code change, and it respects D-CLOUD-029 rather than reopening it. `gemini-analysis.md` and `mistral-analysis.md` should consider recommending this instead of `--update`; `gpt-analysis.md` and `kimi-analysis.md` should say why they would or would not.

**C. Per-device core sets versus core-namespaced states (hypothesis).** `SaveStateConfigFile::getSaveStateConfigs` enumerates only cores in `system->getEmulators()`. Under #10's `savestates/<system>/<core>/` layout, a state downloaded from a device whose core this device does not ship is never enumerated — invisible in the savestate manager and un-mergeable (a `SaveStateConfig` for an absent core yields an empty state list, so `getNextFreeSlot` returns `firstslot` and `copyToSlot` writes wherever the source's parent is). Whether core sets differ per target is not in the corpus (the problem statement says core *versions* are globally pinned, not that every device ships every core). **Cheapest experiment:** diff `LIBRETRO_CORES` between the H700 and RK3326 build options in the tree; if they differ, plant a state under an absent core's directory on the RK3326 and open the manager.

**D. `remote_hash` bootstrapping has a simpler answer (hypothesis).** rclone can compute backend-native hash types locally (`rclone hashsum dropbox <file>`, also md5/sha1/quickxor — my knowledge, not corpus). If that holds on the device, a detector can list the remote with `--hash` and compute the same type locally for its own files, and the manifest's `remote_hash` recorded-at-upload field — and the D-CLOUD-028/extra-phase contradiction gpt found — becomes unnecessary for hash-capable backends. It does nothing for the hashless WebDAV, where size+mtime hint and sha256-after-download remain. **Cheapest experiment:** on the RG35XX SP, `rclone hashsum dropbox` one state and compare with `rclone lsjson --hash` of its uploaded copy.

**E. Union-of-manifests cost is unpriced.** Every detection run must fetch N devices' manifests; the maintainer has five devices. At ~20 KB each this is small, but it is N small copies per run against a budget stated as one rclone spawn; nobody put a number on it or said whether a `--recent`-window optimisation exists for the download side.

---

## 6. Disagreements where I take a side

**Bisync's role.** `kimi-analysis.md` and `gemini-analysis.md` say replace; `gpt-analysis.md` says make it conditional on a non-mutating contract; `mistral-analysis.md` keeps it as detector. On the corpus, the manifest test must be primary regardless of what the spike finds, for kimi's reason (a) — SRAM changes on the QA backend are invisible to any size/modtime comparison, and sha256 is the only comparison D-CLOUD-030 gives us. The spike still runs, as gpt and kimi say, because #9 is decided and only an experiment reopens it. Gemini is wrong to skip the spike; mistral is wrong to keep bisync as the authority.

**D-CLOUD-029.** gpt and kimi are right to retain it; gemini and mistral's `--update` reopen is refuted by the boot restore. The one-way stopgap (§5 B) is the proposal that should replace it if anyone wants a stopgap at all.

**Keep discarded saves default.** gemini and gpt want on-by-default with a bound; kimi keeps off but moves the machinery into #23; mistral has no position. I side with reopening the IA rev-3 default, on gpt's argument: two SRAM panels can both read unknown/unknown with untrusted clocks, and the console-first constraint means a support-only log is not a recovery path. The cost is bounded (count × tens of KB). Kimi's allowlist point (the store must be excluded ahead of `+ /savestates/**`, *and* — per gpt — user rules precede defaults) is a prerequisite either way and should be in #23, not #25.

**How much to reopen D-CLOUD-031.** gpt asks for five amendments; kimi for five smaller ones; gemini/mistral none of substance. The minimal set the corpus actually forces: (i) an `origin` sub-object copied from the source manifest when a device materialises a version it did not produce (KEEP BOTH; #37's copy-to-free-slot) — this is an honest observation, not a stamp; (ii) `screenshot_sha256`; (iii) a group/container key for multi-file and shared saves with `rom: null` for shared containers; (iv) a tombstone or `deleted` marker *if* deletion propagates; (v) a parse-failure rule (unparseable cloud manifest → that device's entries unknown). gpt's publication-generation and scoped-agreement metadata can be reduced to (v) plus keying `agreed.json` by remote + root, which is a local-file change, not a schema change.

---

## 7. What changed my mind

- **`gpt-analysis.md` §1.8** moved me from "reuse ES's allocator and copy helper, as the IA says it checked" to "wrap them in a checked adapter or do not use them for merges." The -99 auto-only case and the unchecked copy results are in the embedded code; the IA's "checked, not assumed" did not check the failure paths.
- **`gpt-analysis.md` §1.5/§2.5** moved me on #10: with `racommands`, `autosave` and `incremental` flipping when a config file appears, #10 is a launch-behaviour migration that needs its own hardware rehearsal for auto-resume and incremental slots, not a directory move — and the `setupSaveState` core rewrite goes live at the same moment, which makes "capture the launched core" a #10 dependency of #21.
- **`kimi-analysis.md` §1.1(a)** moved me from "bisync-vs-manifest is a judgement call the spike decides" to "the manifest test is primary on the QA backend by construction; the spike decides only whether bisync is a fast path anywhere."
- **`gpt-analysis.md` §3.1** moved the round-trip harness from "run it first" to "fix it first": a harness that overwrites `rclone.conf` before asserting the remote and never restores it must not be pointed at a configured handheld, and two of its assertions cannot pass against the embedded uploader.

Nothing in `mistral-analysis.md` changed my position; its one convergent point (`clock_synced` rendering) is made better by kimi.