# Council — Step 3: revised approach

You are one of five council members. In Step 1 you analysed the foundational
approach to cloud-save conflict resolution for ROCKNIX. In Step 2 the other four
reviewed your analysis, and you reviewed theirs. The corpus is embedded above
again, unchanged and hash-verified; the peer reviews of your work and of the
others' are injected below.

Now produce **your revised approach**: the foundation you would actually build,
having heard the critique. This is the artifact the council votes on in Step 4,
so it must stand on its own — a reader should be able to act on it without
having read your Step 1 or any review.

## Anti-self-citation constraint

Reason about the substance on its merits, against the embedded corpus. Do not
treat the injected reviews as evidence about how councils, models, or this
deliberation behave.

## What the revision must do

- **Concede what was refuted.** Where a reviewer showed a claim of yours was
  wrong — a misread function, an unsupported assertion about rclone, a
  recommendation whose consequence you had not traced — say so plainly, name
  the reviewer and the file, and correct it. A revision that quietly drops a
  refuted claim is worse than one that owns it.
- **Defend what you still hold.** Where a critique missed or misread your
  argument, say so and make the argument better. Do not concede to be
  agreeable; the council's value is in genuine disagreement being resolved on
  evidence, not averaged away.
- **Adopt what others got right.** Where another member found something you
  did not, take it and credit them by filename. You are not scored on
  originality.
- **Separate the load-bearing from the optional.** Your revision should make
  clear which parts of it are the foundation (get these wrong and the milestone
  is unsafe) and which are refinements that could follow later.
- **State decision changes explicitly.** If your approach requires reopening a
  decided register row, name the ID, state the change as a new refinement
  citing the old row, and give the argument. If your approach needs no
  reopening, say that too.
- **Be honest about what is still unmeasured.** Where your approach rests on a
  hypothesis about rclone, bisync, RetroArch, a backend or the hardware, mark
  it and name the experiment that settles it.

Refer to members and artifacts by filename (for example `gpt-analysis.md`,
`kimi_peer_review.md`), never by an invented ordinal.

## Injected peer reviews

=== START claude_peer_review.md ===

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

=== END claude_peer_review.md ===

=== START gemini_peer_review.md ===

An analysis of the four council members' proposals reveals a strong, evidence-based consensus: `rclone bisync` is fundamentally mismatched to this project's requirements and must be replaced by a custom reconciliation layer built on the manifest schema. 

Here is the peer review of each analysis against the embedded corpus, followed by failure modes missed by all.

---

### 1. Review of `claude-analysis.md`

**Strongest argument:** The comprehensive takedown of bisync as the detector (§1.1). Claude correctly identifies that bisync's state is a listing rather than a hash, that it requires `--resync` on first runs and filter changes, and crucially, that time-windowed filters (`--max-age`) cause files to "disappear" from listings, which bisync interprets as deletions. 

**Weakest argument:** The claim that `replaces` is not computable from the manifest (§1.2 Amend 2). The manifest stores the previous hash for that path. If the capture step reads the existing manifest before overwriting it, computing `replaces` is trivial.

**Claims check:**
*   *ES appends; it does not fill gaps:* **True.** `getNextFreeSlot` returns highest occupied + 1 (S37).
*   *Incremental-savestate path copies the loaded state byte-for-byte:* **True.** `SaveState.cpp` (S38) does exactly this.
*   *agreed.json must be scoped to the remote and sync root:* **True.** Changing `SYNCPATH` invalidates the agreement context.

**Revisions to request:** 
*   Drop the claim that `replaces` is uncomputable. 
*   Formalize how the new detector interacts with the `take_cloud_lock` mechanism, as the lock is currently held by the wrapper scripts.

### 2. Review of `gpt-analysis.md`

**Strongest argument:** The observation that the capture hook observes the wrong core (§1.5). GPT brilliantly notes that `SaveState::setupSaveState()` can rewrite `-emulator` and `-core` for a selected state, meaning `getCore(true)` at exit might return the configured default rather than the core that actually ran (Verified in S38 and S42).

**Weakest argument:** The claim that `getNextFreeSlot()` returns `-99` for an auto-only repository (§1.8). GPT misread the code. `SaveStateRepository.cpp` line 211 explicitly states: `if (states.size() == 0) return config != nullptr ? config->firstslot : 0;`. It only returns `-99` if all 100,000 slots are full.

**Claims check:**
*   *copyToSlot() reports success without checking the copies:* **True.** `SaveState.cpp` line 223 returns `true` unconditionally after calling `Utils::FileSystem::copyFile`.
*   *makeStateFilename() constructs its full path using the parent of fileName:* **True.** (S38 line 31).
*   *SaveStateRepository::isEnabled() rejects non-RetroArch emulators:* **True.** (S37 line 189).

**Revisions to request:** 
*   Correct the `-99` claim. 
*   Clarify how "publication completeness" (§1.4 C) should be represented in the JSON schema (e.g., a `bundle_id` or `assets` array).

### 3. Review of `kimi-analysis.md`

**Strongest argument:** Identifying that bisync is blind to SRAM changes on WebDAV (§1.1a). Kimi correctly deduces that because SRAM files are fixed-size and WebDAV lacks hashes/mtimes, rclone's size-only fallback will see no delta, rendering bisync completely blind to the most common conflict type.

**Weakest argument:** The claim that the manifest has no entries for PNGs (§1.5.2). The schema explicitly defines the `screenshot` field to hold the remote-relative path of the PNG (S3 §6).

**Claims check:**
*   *SaveStateConfigFile() sets racommands = false unconditionally:* **True.** (S39 line 161).
*   *The boot sync is backgrounded with output to /dev/null:* **True.** (S35 line 18).

**Revisions to request:** 
*   Correct the claim about PNGs missing from the manifest. 
*   Expand on how the manifest test handles the SRAM WebDAV edge case.

### 4. Review of `mistral-analysis.md`

**Strongest argument:** Emphasizing the immediate danger of the shipped newest-wins paths (D-CLOUD-029). While others noted this, Mistral correctly identifies it as a fatal flaw that violates the cardinal rule and demands an immediate stopgap.

**Weakest argument:** The threat model regarding the audit log not being "tamper-proof" (§3.3). This is a single-player handheld console. Tamper-proofing against the device owner editing a text file to "frame another device" is absurd and out of scope.

**Claims check:**
*   *The wizard's KEEP DISCARDED SAVES is not bounded:* **False.** The IA doc (S2) explicitly states it has a "count selector" and "The fixed count is also the retention rule".
*   *differ, no A -> one-way transfer:* **False.** This contradicts the alignment review (S4) which states "never agreed -> ask". Mistral's proposed table would silently overwrite files if the agreement record is lost.

**Revisions to request:** 
*   Drop the tamper-proofing threat model. 
*   Correct the unbounded saves claim. 
*   Revert the proposed conflict table to respect the "never agreed -> ask" conservative rule.

---

### 5. Failure Modes Missed by All Analyses

**1. The duplicate cleanup prompt is completely broken and throws silent errors**
In `cloud_backup` (S29), `ASSUME_YES` is set as a local variable but never exported. When it calls `cloud_sync_helper` (S31), the helper sees an unbound `$ASSUME_YES` and falls back to interactive mode. It then attempts to call `controller_confirm`—but that function is defined in `cloud_backup`, not in the helper! This results in a silent `command not found` error, skipping the cleanup entirely.

**2. `check_internet` tests the wrong remote**
`cloud_backup` determines the target remote using `first_remote()`, which parses `rclone.conf` and sorts alphabetically. However, `check_internet()` uses `rclone listremotes | head -1`. If the user has multiple remotes, these two commands can yield different results, causing the script to test reachability for a different remote than the one it backs up to.

=== END gemini_peer_review.md ===

=== START gpt_peer_review.md ===

# Step 2 — Peer review

**Scope:** This reviews the four injected proposals, not the merits of the council process, and does not cast a vote. I used only the embedded corpus; I did not execute commands, inspect devices, or independently re-read or hash files.

Citations such as **[S38]** refer to the declared source path and Facilitator-verified SHA-256 recorded in the inline `corpus.provenance.json` below.

## Main findings

Several proposals identify real architectural gaps: agreement-state ownership, deletion semantics, remote changes during resolution, capture provenance, and the distinction between pre-COMPLETE cancellation and interrupted application.

However, the following recommendations must **not** pass into Step 3 unchanged:

- **`mistral-analysis.md`:** Treating unequal copies with no agreement as a one-way transfer would introduce silent data loss.
- **`gemini-analysis.md`:** Falling back to legacy copy when the conflict engine refuses a configuration would bypass the safety guard.
- **`kimi-analysis.md`:** “Size-plus-relist” cannot verify an uploaded save on a hashless backend.
- **`claude-analysis.md`:** Replacing an unavailable cloud hash with size and mtime cannot preserve a content-based conflict guarantee.
- **`gemini-analysis.md` and `mistral-analysis.md`:** Adding `--update` does not generally turn conflicting uploads into safe skips.
- **All four:** ES’s existing slot and copy helpers do not provide all the guarantees attributed to them. There are directly checkable failure cases in the embedded implementations.

The case for evaluating an application-owned reconciler is substantial. The case that bisync is *necessarily* unrecoverable, always blind to the relevant changes, or incapable of recognizing externally equalized files is **not established by this corpus**. Retain the comparative spike and its artifact-level assertions.

---

## 1. Review of `claude-analysis.md`

### Strongest argument: introducing `es_savestates.cfg` changes behavior, not merely paths

This is the most valuable source-grounded finding in `claude-analysis.md`.

The embedded code establishes that:

- `SaveStateConfig::Default()` enables `racommands`, `incremental`, and `autosave`.
- Configurations loaded from XML set `racommands = false`; autosave and incremental behavior must be explicitly enabled.
- `SaveState::setupSaveState()` has materially different launch and file-handling paths depending on `racommands`.
- `setupSaveState()` can rewrite the emulator/core arguments, so the configured default returned by `getCore(true)` is not necessarily the core actually launched. [S38, S39, S42]

This supports a concrete revision to #10/#21: **prove launch, autosave, incremental saving, and attribution under the new configuration—not just directory discovery.** Calling #10 a “config-only change” is not an established safety claim.

The remote/root binding of `agreed.json` is another strong argument. The schema’s example has no binding to a remote account, cloud folder, or local storage instance, although changing the cloud folder is a supported operation. A remembered hash from a different synchronization relationship can authorize the wrong overwrite. [S03 §7, S13, S33]

### Weakest argument: the proposed replacement relaxes content verification to meet its budget

The replacement detector is described as safer because SHA-256 is authoritative, but parts of its proposed fast path undermine that premise:

1. **Hashing only when size or mtime changes misses same-size, same-mtime edits.**  
   That optimization needs a reliable dirty-file mechanism or a stated conservative fallback. A size/mtime tuple cannot prove byte equality. The project has already encountered the corresponding remote-side failure. [S03 §6, S10, S29]

2. **A pre-upload remote hash describes the old cloud version.**  
   It must not become the `remote_hash` associated with the newly uploaded SHA-256. Computing the expected backend hash locally can help comparison, but does not establish that the upload actually stored those bytes.

3. **The proposed fallback to size and mtime is unsafe as confirmation.**  
   In particular, §4’s suggestion to drop `remote_hash` “in favour of (size, mtime)” must explicitly preserve download-and-hash or another proven content-verification mechanism. On the QA WebDAV backend, even modtime is unavailable as a useful comparison property. [S04 §1]

4. **The two-spawn gated push does amend D-CLOUD-028.**  
   A zero-spawn no-change path is attractive, but a changed-file path that lists, uploads, and possibly verifies has a different command and network budget. `kimi-analysis.md` correctly treats this as a decision requiring explicit refinement rather than claiming the existing contract is unchanged. [S06 D-CLOUD-028]

### Claims that hold, with qualifications

- **The boot sync can overlap gameplay:** supported. The autostart script backgrounds its work; the cloud lock serializes cloud scripts, not emulator writes. The launch excerpt contains no shared exclusion with that boot job. The actual lost-SRAM outcome still needs the proposed experiment. [S35, S41]
- **Renumbering needs more than an mtime window:** sound. ES uses rename operations. Preservation of mtime is ordinary filesystem behavior, but should still be confirmed on the target layout as proposed. [S38]
- **Manifest union cannot mean last-map-wins by path:** correct. Several devices can describe different versions at the same path. Readers need version-qualified candidate records, not an arbitrary map overwrite. [S03 §§2, 5]
- **Audit rotation limits historical lineage:** correct. D-CLOUD-027 retains only one predecessor after rotation; it cannot support an unbounded history claim. [S06 D-CLOUD-027]

### Claims requiring correction

**Bisync assertions remain hypotheses.**  
The analysis labels much of its rclone knowledge `[K]`, which is appropriate. Its verdict nevertheless relies on those hypotheses as if already resolved. In particular:

- Rewriting a filter file is not necessarily changing its effective contents.
- Whether comments affect bisync’s filter-change check is an experiment, not an established outcome.
- Whether a scoped listing traverses only selected parent directories must be measured.
- Native-hash computation and verification requirements vary by backend and configuration.

The proposal should say: **“Prefer this replacement if the spike confirms these constraints,”** or supply the missing version-specific evidence. Neither the upstream bisync implementation nor its 1.75.0 documentation is embedded. [S16, S23]

**`onGameEnded()` does not renumber on every savestate-manager exit.**  
There is an early return when `racommands` is true and `slot < 0`. The launch path also calls `onGameEnded()` only when `options.saveStateInfo` is present. The additional renumbering path is real, but the analysis overgeneralizes it. [S38, S41]

**Pretty-printed JSON is not generally broken by newline removal.**  
Blindspot 3 concerns line-oriented output whose record separators matter. Removing formatting newlines from a valid single JSON document normally preserves it. Reading a result file remains a good interface choice, but “pretty JSON becomes a mashed string” is not the right technical justification. [S07]

**`copyToSlot()` is not categorically unusable for a cloud version.**  
It operates on a local source and constructs destinations relative to that source’s parent. A cloud version therefore needs deliberate materialization and destination handling. That is a constraint, not proof the helper cannot participate. More importantly, its unchecked return behavior is a shared missed failure discussed below. [S38]

**Absence plus an agreement record does not prove explicit deletion.**  
The proposed deletion rows need more than a mass-delete threshold. A single missing file can result from an interrupted layout change, an unavailable mount, an emulator’s temporary rename, or an external client. Explicit deletion events or suitably qualified tombstones are stronger evidence than absence alone. D-CLOUD-030’s duplicate-compaction decision does not automatically authorize general deletion propagation. [S03, S06 D-CLOUD-030, S11]

### Presentation revisions

Replacing the **CLOUD** header with the producing device’s name confuses two distinct facts:

- where the candidate currently resides;
- which device produced it.

The IA deliberately fixes cloud on the left and already includes device/model in the metadata. Keep both facts visible. A downloaded version can have the same producer on both sides. [S02]

The launch-time resume proposal is useful to explore, but selecting a tile is **not automatically a complete cloud resolution**. It must specify:

- which version remains at `.state.auto`;
- how the other version is preserved;
- how the choice interacts with SRAM;
- what happens if the subsequent game session crashes or never uploads;
- how agreement advances.

Similarly, `session_seconds` reopens a settled product choice. It is not reliable progress evidence, and deriving it from a numbered state’s mtime is unsafe after downloads, moves, or clock changes. Treat it as an optional research question, not a prerequisite for a safe picker. [S22, S24]

### Concrete Step 3 revisions

1. Separate the replacement’s **verified protocol** from its performance optimizations.
2. Explicitly request the necessary D-CLOUD-028 and D-CLOUD-031 refinements.
3. Replace size/mtime confirmation with a content-verification requirement.
4. Specify deletion intent, manifest ownership, and agreement binding before describing the detector as complete.
5. Keep `--backup-dir` and advisory locks as mechanisms requiring backend tests—not as universal atomicity guarantees.
6. Preserve the configuration-behavior and actual-launched-core findings as blocking #10/#21 acceptance tests.

---

## 2. Review of `gemini-analysis.md`

### Strongest argument: resolution needs retained bytes and a coherent save unit

The analysis correctly challenges a release in which a mistaken manual choice can irreversibly remove progress. Its distinction between an explicit choice and an accidental button press is a legitimate product-safety argument for revisiting the IA’s default-off retention setting. [S02, S24]

It also correctly identifies the danger of treating a multi-file save as independent choices. The repair should be expressed as **a save-unit inventory and grouped resolution contract**, however. The corpus establishes that several layouts exist; it does not establish that every `.eep`/`.mpk` combination is one indivisible save or that mixing them “almost certainly” corrupts it. That needs emulator/game-specific evidence. [S01 §4.8, S32]

### Weakest argument: reopening D-CLOUD-029 on the premise that `--update` preserves both copies

This argument is incorrect as stated.

Consider two different saves:

| Candidate | Modification time | Progress |
|---|---:|---|
| Cloud | 100 | Further |
| Local | 200 | Less |

`copy --update` can still overwrite the cloud’s further-progress version with the newer local file. In the opposite timestamp ordering, it skips the upload—but the next boot restore can overwrite the retained local version.

Thus, `--update` protects one timestamp ordering for one direction; it does not preserve both versions across the shipped workflow. D-CLOUD-029 explicitly accepts the current risk until replacement. Reopening it requires a materially different preservation argument or a narrower risk-reduction case, not “a skip leaves both safe until the wizard.” [S06 D-CLOUD-029, S29, S30, S35]

The recommendation to **fall back to legacy copy when roots differ** is more dangerous still. A guard that refuses because its model does not apply must not hand control to the destructive mechanism it was replacing.

### Other checkable corrections

| Claim in `gemini-analysis.md` | Review |
|---|---|
| The proposed manifest engine is “stateless” and immune to workdir corruption | Incorrect. It still depends on manifests, `agreed.json`, and recovery state. Removing bisync’s additional state is simplification, not statelessness. [S03] |
| `rclone lsjson` pulls remote manifest contents | Incorrect description. Listing object metadata is not downloading the JSON payloads. The fetch and its cost need an explicit place in the protocol. |
| `bisync --conflict-resolve none` skips conflicting files entirely | Not established by the embedded evidence. The corpus supplies claims about the flags, not a non-dry-run artifact trace proving untouched conflicting paths. [S16, S23] |
| Rclone handles remote concurrency safely through temporary files and atomic renames | Incorrect as a consistency claim. Atomic replacement of one object does not prevent two writers from overwriting each other’s updates. Backend-independent atomic rename is itself unproven here. |
| Two distinct devices’ manifests overwrite each other merely because uploads are simultaneous | Not under the intended per-device filenames. That requires duplicated identity or a transfer path that republishes another device’s cached manifest. [S03, S34] |
| Query the maintainer’s existing `agreed.json` history | The schema says nothing is built. There is no such historical dataset in the corpus. [S03 opening] |
| Emit pins during “Yocto/buildroot” assembly | Wrong build-system description. ROCKNIX uses the LibreELEC/CoreELEC-derived build system; the proposed pin sources are `get_pkg_version` and `LIBRETRO_CORES`. [S15, S03 §9] |

### The filesystem-cache explanation is wrong

The analysis conflates **visibility of completed writes** with **durability after power loss**.

Under ordinary Linux file I/O, a subsequent reader sees bytes already written into the page cache; they need not first reach the SD card. A background writer or a launcher that returns while a child continues writing is a different, plausible race. The embedded `process.run()` call does not establish whether every standalone launcher waits for all writers. [S41]

A global `sync` followed by a sleep is not a proof of writer quiescence and does not fix a surviving child. Replace this experiment with:

- identify the actual writing process and launch lifecycle;
- capture a stable version;
- verify that version is what gets transferred;
- test interruption and durability separately.

### Lineage must not be adopted from the losing side

The “Unknown Manifest Overwrite” scenario asks whether KEEP RIGHT should adopt Device A’s `replaces` lineage. Not unless the actual local predecessor is known to be that version.

Choosing B over A is a resolution decision, not evidence that B descended from A. When the predecessor is unknown, preserve that uncertainty. A newly written B version can have known B provenance while its parent remains unknown. [S03 §§2, 6]

### Concrete Step 3 revisions

1. Withdraw the blanket `--update` safety claim and the legacy-copy fallback.
2. Retain the bisync spike; remove unsupported assertions that every interruption demands resync.
3. Specify manifest fetching, payload validation, agreement persistence, and recovery.
4. Separate writer-lifecycle testing from filesystem durability testing.
5. Define retention count scope—per save unit, game, or transaction—rather than prescribing “1” without saying what it bounds.
6. Treat multi-file grouping as measured emulator behavior, not inferred solely from extensions.

---

## 3. Review of `kimi-analysis.md`

### Strongest argument: the first writer can lose progress without a later conflict

The trace in §3.13 is compelling:

1. B uploads `H_B` and records agreement with it.
2. A, acting on a stale observation, overwrites the cloud with `H_A`.
3. B later has `L_B = A_B = H_B`, while `C = H_A`.
4. The schema correctly classifies this as “cloud changed,” so B downloads `H_A` without a conflict.

That outcome follows directly from the proposed table. It demonstrates why a pre-upload read or a COMPLETE-time recheck **shrinks a race window but does not eliminate it**. An audit line does not restore the overwritten bytes. [S03 §3]

This finding should change the claimed guarantee of every proposal relying on read-before-copy. Step 3 needs an explicit answer: enforce serialization, retain independently published versions despite racing canonical writes, or state the remaining limitation honestly. “The lock is advisory” cannot become “progress is protected under concurrency.”

The narrow reopening of D-CLOUD-028 is also well argued: a correctness read for files about to be uploaded differs from an unconditional reachability probe, but its real cost must be measured and registered. [S06 D-CLOUD-028]

### Weakest argument: size-plus-relist as post-upload verification

Section 1.6 permits “download-and-hash **or size-plus-relist**” on hashless backends. The latter is exactly the class of comparison the design is supposed to stop trusting.

A different 65,536-byte SRAM file passes a size check. Relisting it twice does not change that fact. The required revision is unambiguous:

> A hashless remote requires content confirmation before agreement can certify the uploaded version, unless another explicitly tested mechanism provides the same guarantee.

The system-backup code’s size assertion is useful prior-art context, not sufficient proof for the stronger save-version identity contract. [S03 §6, S10, S29]

### Strong supporting findings

These deserve to remain:

- **Pending KEEP BOTH allocations must be reserved within the plan.** Calling an unchanged repository’s allocator repeatedly before COMPLETE can select the same slot. [S37]
- **Unchanged manifests should not be rewritten solely to change `generated_at`.** Otherwise metadata churn defeats the no-change fast path. [S03, S06 D-CLOUD-028]
- **The headless-to-ES handoff is unspecified.** The boot job discards output, while `ThreadedCloudSync` understands success, two skip states, and generic failure—not a conflict result. [S35, S40]
- **The discard store belongs to the wizard’s implementation scope if its setting ships there.** Deferring #25 cannot defer the bytes needed to honor #23’s own retention setting. [S02, S26]
- **The XML configuration does not automatically include a second legacy-flat reader.** The code supports the diagnosis that “read both, write new” is not obtained merely by adding another emulator template. [S39]

### Detection claims overreach their stated evidence

The proposal initially labels bisync’s hashless behavior as inference, but later treats it as a settled universal result: “Every in-game-save change … is invisible,” and bisync is therefore capped at hash-capable backends.

The corpus establishes the size-only failure for the shipped copy paths. It does **not** establish every bisync comparison mode, refusal behavior, or recovery mechanism in 1.75.0. A clean refusal on an unsupported configuration would also differ materially from silent blindness. [S29, S16, S23]

Similarly:

- The externally equalized-conflict loop is a useful test.
- The statement that a subsequent clean bisync run is “impossible” is not established.
- The claim that the manifest algorithm is already “complete” and handles renames “for free” conflicts with the proposal’s own unresolved deletion and grouping requirements.

Keep the spike as the arbiter, as the analysis elsewhere recommends. Do not let an explicitly conditional hypothesis become an unconditional architectural premise.

### #10’s proposed Option A violates the attribution rule

Moving flat states into the current default core’s directory and recording that core as fact is not made legitimate by an audit line saying it was inferred.

A loud failure in one bench test does not turn an unknown producing core into a known one. D-CLOUD-017 and the upgrade rule explicitly reject manufacturing authoritative-looking provenance. [S06 D-CLOUD-017, S11]

Option B also needs stronger qualification:

- It leaves the default core writing into the legacy-flat directory.
- A later change in the system’s default core can change which core is associated with those files.
- It is not the full “read both, write the new layout” migration contract.

The useful conclusion is **“the existing configuration mechanism may be insufficient”**, not “choose between two configurations that each compromise the requirement.” A reader change is a legitimate alternative.

Also, a measured chipset incompatibility does not by itself require chipset directories. D-CLOUD-017 deliberately separates physical namespace from compatibility metadata and policy.

### Other revisions needed

**Root mismatch is not closed by a warning.**  
The config explicitly permits different backup and restore roots. An engine whose agreement model requires one root must refuse affected save writes or model the distinction. “Warning fires; nothing misbehaves” assumes the result that must be proved. [S33]

**Auto-state recency is not semantically authoritative.**  
A new resume point can be a shallow replay or an accidental new game even with a perfectly synchronized clock. The cardinal rule applies to it as well. Offline play alone also does not produce a conflict: both sides must diverge. Measure actual forks, not merely auto-state writes. [S01, S03 §3]

**Initial conflict volume is overstated.**  
The table asks about copies that differ *now*, not files whose contents “ever diverged.” Identical copies do not need a choice merely because their provenance or agreement record is missing. [S03 §3]

**Schema amendments must be acknowledged as such.**  
`rom: null`, new container kinds, tombstones, and grouping fields are reasonable proposals, but they alter the signed-off rev-1 contract. The opening claim that nothing touches D-CLOUD-031 should be replaced with an explicit proposed refinement. [S03 §6, S06 D-CLOUD-031]

### Concrete Step 3 revisions

1. Delete size-plus-relist as verification.
2. Preserve the concurrency counterexample and require a stronger preservation contract.
3. Keep bisync behavior conditional until measured.
4. Reject inferred-core migration; specify an honest legacy reader.
5. Make root mismatch a fail-closed condition for the affected engine.
6. Register the proposed schema changes and correct the auto-state/initial-volume assumptions.

---

## 4. Review of `mistral-analysis.md`

### Strongest argument: every save-writing entry point must share the same refusal policy

The demand to test boot, game exit, and the menu against a constructed both-sides change is correct. So is requiring KEEP BOTH’s destination to be free on both sides. These are substantive endorsements of #22/#23’s documented acceptance criteria, rather than newly discovered requirements. [S05 §5, S23, S02]

### Weakest argument: “never agreed and different” should transfer without prompting

This proposed table row must be rejected.

If both sides contain different bytes and no common baseline exists, nothing identifies a safe direction. Calling that case “one-way” does not make it one-way.

A fresh handheld with **no local file** already has a separate cloud-only case. A fresh handheld with **an identical local file** already has the equality case. A handheld with two different pre-existing versions is exactly the case where conservative behavior requires a choice. Long-offline agreement is not invalid simply because it is old. [S03 §3]

The proposed row would silently destroy the evidence needed for the player’s decision.

### Incorrect claims about the current design

**Audit logging is already a V1 requirement.**  
D-CLOUD-027 and the IA require it. Making it “mandatory from day one” does not replace snapshots; an audit log contains descriptions, not the lost save bytes. [S06 D-CLOUD-027, S02]

**KEEP BOTH retains both save versions.**  
If implemented correctly, the desired cloud bytes remain available in the allocated numbered slot. The assertion that the original cloud copy cannot be recovered confuses loss of its former path with loss of its content. The valid concern is interrupted or incorrect application—not KEEP BOTH’s intended semantics.

**Retention is already bounded in the specification.**  
The count selector is explicitly the retention rule. Since the feature is unbuilt, “the count is not enforced” is not an observed defect. It is an acceptance test to implement. [S02]

**`remote_hash` cannot be mandatory on all supported remotes.**  
The QA WebDAV backend supplies no hashes. Its valid value remains `null` after upload. Moreover, making a field mandatory does not atomically commit a save and a manifest. Generic multi-object atomicity is not supplied by the corpus. [S03, S04]

**The boot script does not use `&&`.**  
Its restore and backup are separate sequential commands, so the backup is attempted even after restore failure. The analysis’s quoted composition does not match the embedded source. This matters for error handling and the cutover inventory. [S35]

**#10 is no longer per-chipset namespacing.**  
D-CLOUD-017 decides core directories with build metadata. Cross-chipset portability does not invalidate per-core separation. [S06]

### Decision arguments needing repair

The `--update` recommendation has the same timestamp-ordering defect as `gemini-analysis.md` and contradicts D-CLOUD-029 unless explicitly reopened and accepted.

The duplicate-compaction objection also needs a more precise argument. Two hash-equal files contain the same stored save version. Removing one can remove an intentionally convenient slot placement, but it does not delete a different playthrough’s bytes. D-CLOUD-030 explicitly chose automatic compaction. Reopening it would require an argument about meaningful duplicate-slot intent, not a claim that byte-identical copies contain different progress. [S06 D-CLOUD-030]

Finally, signed audit logs address an unsupported threat model. This is one player’s support log, not an adversarial multi-party ledger. A player able to edit it can generally also edit local keys and state. No requirement here calls for preventing the owner from “framing another device.” That proposal adds complexity without recovering a single lost save.

### Concrete Step 3 revisions

1. Restore the schema’s conservative no-agreement row.
2. Remove mandatory remote hashes and unsupported cross-object atomicity requirements.
3. Distinguish audit records from retained payloads.
4. Correct the boot control flow and D-CLOUD-017 interpretation.
5. Reframe retention, unknown compatibility, and clock rendering as implementation tests—not established defects.
6. Drop audit tamper-proofing unless the maintainer introduces a corresponding threat model.
7. Do not make resume-point labeling depend on exceeding an arbitrary frequency threshold; it describes the file’s meaning.

---

## 5. Important failure modes none of the four analyses resolves

### 5.1 `copyToSlot()` can report success after failing to copy

**Established in the embedded code:** after checking only that the source exists and the requested slot is nonnegative, `copyToSlot()` ignores the return values of both state and screenshot copy/rename operations and returns `true`. [S38]

Therefore:

- “reuse it” does not establish successful materialization;
- a state copy can fail while the caller records agreement;
- the state and thumbnail can have different outcomes.

**Cheapest experiment:** use an isolated destination with no writable space or permissions; keep the source present; invoke the merge path and compare the reported result with destination hashes.

**Required revision:** verify state and companion artifacts independently before advancing agreement or deleting any source. Fix or wrap the helper’s success contract.

### 5.2 An auto-only repository does not yield the first numbered slot

**Established in the embedded code:** `getNextFreeSlot()` returns `firstslot` only when the state vector is empty. If it contains an auto state at slot `-1` but no numbered states, the scan over `99999…0` finds nothing and returns `-99`. [S37]

This directly affects the proposed common case: KEEP BOTH on an auto-state conflict.

**Cheapest experiment:** a game with only `.state.auto` and its PNG; refresh the repository and exercise allocation.

**Required revision:** explicitly test auto-only, empty, disabled, and boundary repositories. “No practical 99-slot limit” must not be confused with an infallible allocator.

### 5.3 Verified equality can leave a first-run file permanently “never agreed”

The schema says:

- equal copies → “nothing”;
- agreement is written by the transfer that uploads or downloads a version. [S03 §§3, 9]

A literal implementation can therefore observe `L = C = H` on its first run, transfer nothing, and leave A unknown. A later unilateral change becomes an unnecessary conflict.

**Cheapest experiment:** begin with equal copies and no agreement record; reconcile; change only the cloud; reconcile again.

**Required revision:** specify whether a verified equality observation establishes agreement without a transfer. It should not depend on manufacturing a redundant copy.

### 5.4 “Each device writes only its own manifest” must also constrain transport

The existing upload walks the save tree, and the allowlist includes all of `savestates/`. Downloaded foreign manifests reside in that same tree. Merely restricting which manifest a capture routine edits does not prevent a later generic upload from republishing a stale foreign manifest. [S29, S32]

**Cheapest experiment:**

1. B downloads A’s manifest.
2. A publishes a newer manifest.
3. B uploads its cached save tree.
4. Check whether A’s newer metadata survives.

**Required revision:** enforce manifest ownership in upload and deletion selection. Foreign manifests are reader inputs, not writable payloads of this device.

### 5.5 Mandatory safety exclusions are not guaranteed by defaults

`cloud_sync_helper` puts custom rules before defaults. Thus, putting a snapshot exclusion before `+ /savestates/**` **inside the defaults** does not necessarily put it before a custom broad inclusion. [S31]

There is another boundary: the backup and restore functions use their fallback `--filter-from` only when the configured options array is empty. A nonempty customization that omits the filter does not automatically receive the mandatory allowlist. [S29, S30]

**Cheapest experiment:** use an upgraded fixture configuration containing a broad custom inclusion, then one with nonempty `RCLONEOPTS` but no filter. Include a real save, a snapshot, and a ROM as positive/negative controls.

**Required revision:** distinguish customizable selection from non-overridable safety boundaries, and test the actual effective command. A rule’s presence in a defaults file is not proof it governs the transfer.

### 5.6 Exit-code domains already collide

The scripts reserve exit 3 for lock contention and exit 4 for no network. But they also pass through raw rclone statuses, whose own error descriptions include 3 for directory/permission problems and 4 for a missing file. `ThreadedCloudSync` renders those statuses as skips. [S29, S30, S40]

Additionally, both script mains exit with the save-phase result even if the system-backup phase failed. A `--system-only` failure can therefore be reported through an overall zero save status.

**Cheapest experiment:** force a backend/file error and a system-only transfer failure; inspect both the artifact and the card/stamp outcome.

**Required revision:** define a normalized script result protocol. Do not allocate “5 = conflicts” without separating it from native backend errors. Preserve per-phase failures rather than letting an unrelated successful phase mask them.

### 5.7 Moving the PNG is not proof it depicts the selected save version

All four discuss pairing, but none specifies a reliable binding between a particular state version and particular thumbnail bytes.

A manifest can correctly identify the current state hash while its screenshot path contains an older PNG from an interrupted publication. The picker then confidently presents the wrong picture—the failure its information architecture explicitly wants to avoid. [S03 §6, S02, S38]

**Cheapest experiment:** publish a new state with an intentionally retained old thumbnail, or interrupt between the two objects; verify what the picker shows.

**Required revision:** bind companions to a capture/version and withhold or mark the image when that association is unverified. A companion digest or generation need not become part of D-CLOUD-030’s state identity.

### 5.8 Repository refresh invalidates stored `SaveState*` objects

`SaveStateRepository::refresh()` calls `clear()`, which deletes the stored state objects. A wizard that retains those pointers across refresh, renumbering, or a revalidation pass risks using invalid objects. [S37]

**Cheapest experiment:** retain a selected conflict item, trigger the required repository refresh/reallocation, then revisit or apply that selection.

**Required revision:** retain stable plan data—version hashes and validated paths—not borrowed repository objects across invalidating operations.

### 5.9 The round-trip harness is not yet a trustworthy measuring instrument

All four correctly call for running it. Its embedded implementation also requires review before relying on the result:

- It overwrites `rclone.conf` before checking which remote is first.
- Cleanup restores only some modified settings, not the original remote configuration.
- Exception exits can bypass cleanup.
- Archive assertions expect the old undated local name, while the current scripts upload dated names and restore under those dated names. [S36, S29, S30]

**Cheapest experiment:** run on a disposable VM with known configuration sentinels; compare configuration and artifact inventory before and after, including an interrupted run.

**Required revision:** keep this suite off valuable handheld installations, distinguish stale test expectations from product defects, and add positive artifact checks without weakening the safety assertions. The already-available GENERIC_X64 image in the problem statement should be used; an earlier futro’s cold-build requirement is stale. [S01]

---

## 6. Required evidence and revisions before Step 3 settles an architecture

These are review requirements, not a replacement implementation plan.

1. **Make the harness reliable on disposable VMs.** Run WebDAV and MinIO, retain raw results, and verify configuration isolation.
2. **Test the ES primitives’ actual failure behavior.** Auto-only allocation, failed copies, thumbnail mismatch, and repository invalidation belong before trusting the merge design.
3. **Run the comparative bisync/reconciler spike.** Include:
   - same-size and same-mtime changed data;
   - hashless remote behavior;
   - genuine forks with `none`/loser settings;
   - rename and deletion distinctions;
   - external equalization after a manual decision;
   - interrupted and missing agreement/listing state;
   - filter changes;
   - exact pre/post path and byte inventories.
4. **Require a write-authorization argument for every path.** That includes foreign manifests, grouped saves, direct upload/download rows, headless callers, and configuration failures. No fallback may bypass the guard.
5. **Require a concurrency preservation argument.** Rechecks, TTLs, and provider history may mitigate; none should be described as eliminating lost updates without proof.
6. **Run #19 with the same-chipset control first, then the stated cross-family and corruption cases.** Results apply to tested cores/builds/configurations—not all savestates.
7. **Measure real small-panel recognition.** Use actual thumbnails on the RG351M, not only desktop-viewed frames, before changing the settled presentation.
8. **Make decision changes explicit.** D-CLOUD-028 budget refinements, D-CLOUD-031 schema/ownership refinements, and any reopening of D-CLOUD-029 or D-CLOUD-030 must be separately stated and accepted.

### Gaps surfaced to the orchestrator

The following needed evidence was not embedded:

- Upstream rclone 1.75.0 bisync implementation/documentation and evidence for claims about its future direction.
- `Utils::FileSystem` implementations and relevant headers for stronger copy, rename, lifetime, and durability guarantees.
- The full launcher/process implementation and RetroArch directory-setting path.
- Actual results from the round-trip suite, bisync spike, and compatibility protocol.
- Current issue bodies and edited AC lists as distinct artifacts: the supplied issue files are comment-thread exports, so several body-edit claims are supported only by the futro/alignment review.

The absence of these sources does not prevent this review, but it prevents treating several proposed implementation guarantees as established.

---

## `corpus.provenance.json`

Artifact contents are supplied inline because this session has no filesystem access. The arrays are positionally aligned: their first entries are **S01**, their second entries **S02**, and so on.

```json
{
  "corpus_mode": "facilitator_embedded_read_at_time",
  "source_count": 42,
  "source_reference_order": "S01 through S42, positionally aligned across both arrays",
  "hash_verification": "SHA-256 values verified at embed time by the Council Facilitator and copied from source headers",
  "independently_reread_files": false,
  "independently_rehashed_files": false,
  "commands_or_hardware_tests_performed": false,
  "manifest_read_timestamp_utc_as_supplied": "2026-09-05T17:32:51Z",
  "peer_analyses_reviewed": [
    "claude-analysis.md",
    "gemini-analysis.md",
    "kimi-analysis.md",
    "mistral-analysis.md"
  ],
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
  "missing_material": [
    {
      "description": "Upstream rclone 1.75.0 bisync implementation, version-specific documentation, and evidence for future-direction claims",
      "declared_source_path": null,
      "sha256": null
    },
    {
      "description": "Utils::FileSystem implementations and relevant ES headers needed to establish stronger copy, rename, lifetime, and durability guarantees",
      "declared_source_path": null,
      "sha256": null
    },
    {
      "description": "Full launcher/process implementation and RetroArch directory-setting path, including the referenced setsettings.sh and runtime configuration",
      "declared_source_path": null,
      "sha256": null
    },
    {
      "description": "Executed round-trip, bisync-spike, and savestate-compatibility results",
      "declared_source_path": null,
      "sha256": null
    },
    {
      "description": "Current issue bodies and edited acceptance-criteria lists as distinct artifacts; embedded issue snapshots are comment-thread exports",
      "declared_source_path": null,
      "sha256": null
    }
  ]
}
```

=== END gpt_peer_review.md ===

=== START kimi_peer_review.md ===

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

=== END kimi_peer_review.md ===
