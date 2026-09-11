# Council -- Step 5: the handoff, as tracker text

The council has settled on a consensus plan; its handoff section is injected
below, verbatim, and it is the specification. The maintainer's decisions of
2026-09-11 (D-CLOUD-095..100, D-UI-039, D-QA-015/017) are binding and are in the
embedded corpus; so is the vocabulary rule (D-UI-022), which governs every string
you write.

Your job is to turn the handoff into **the text the tracker will hold**, so that
whoever picks up each issue builds the change the council chose and nothing else.
The corpus is embedded above, unchanged and hash-verified; the current bodies of
the issues you edit are in it (`issues/22.md`, `issues/23.md`, `issues/25.md`,
`issues/134.md`, `issues/135.md`).

## Anti-self-citation constraint

Write from the substance. Do not describe or characterise the deliberation that
produced it, and do not cite the injected artifacts as evidence about how councils
or models behave.

## What to produce, in this order

1. **The epic body for #134**, rewritten: one paragraph of context; the design in
   one screen (one hidden store inside the saves folder, declared in the README;
   the store-first invariant; the transaction shape; what runs in the exit sync,
   in a full pass, never on the device; the bounds and their priority; shared
   settings; the suspect class and the heal from the stage); the **build order**
   mapped to #22, #23, #25 and any new child the handoff needs; the **ordered
   experiments** table with each one's venue (the GENERIC_X64 pair and the QA
   backends of `issues/133.md` -- never a person's device, D-QA-015) and what it
   unblocks; the time-to-play measurement (#135) as a gate; and the decisions that
   bind, cited by register ID, not restated.
2. **The amendments to #22** (R1-R9), stated row by row as replacement text for
   the rows that change and "unchanged" for the rest; then **#23**'s retention
   settings rows and **#25**'s reader, the same way. Keep each issue's acceptance
   checklist form: `- [ ]` items that are observable behaviour, never artefacts.
   Where the current body says something the plan overturns -- a `-discarded/`
   sibling, "labelled separately", retain-only-on-decision -- replace it and say
   in one line what changed and why, citing the register ID.
3. **The migration issue**, as a new child: what devices hold today, the
   copy-verify-retire order, the legacy event classification, the mixed-version
   boundary, and the rule that no player is asked a question.
4. **The register rows the handoff proposed**, each resolved against the decisions
   already made: which are *already decided* (cite the ID and stop), and the
   wording for any that remain genuinely open, marked as proposals -- IDs are the
   maintainer's to assign.
5. **The document edits list**: the public cloud-sync page's layout table and the
   README text; `docs/es-menu-map.md`'s SAVE MANAGEMENT nest; anything else the
   handoff names.
6. **What still needs the maintainer's word**, if anything survives 1-5.

## Rules for the text

- **Vocabulary per D-UI-022**: settings, saves (game saves, save states, and
  screenshots), ROMs and BIOS; back up and restore; *sync* only for the automatic
  two-way behaviour; earlier versions in the store are "earlier versions" and the
  wizard's kept losers are "discarded saves"; never "system backup", "save data",
  "upload", "everything", "cloud library", "escrow" or "retention store" in a
  string a player reads.
- **Rows are a label and at most one line** (D-UI-023); settings nest (D-UI-039).
- **Every acceptance item is observable behaviour** with its venue named.
- **Cite decisions by ID.** Do not restate an argument the register already holds.
- Markdown, ready to paste into the tracker; each issue body under its own
  `## #<number>` heading.

## The handoff

## Step 5 handoff content

### 4.1 The store contract (what every issue builds against)

```
<SAVES_REMOTE>/.history/<unit>/<seq>/
    <sha256>          one file per distinct member content; bare hex, no extension
    record.json       written last; a valid record is the commit point
<seq> = <utc-compact>-<device-id>-<run-id>-<vdigest>-<rdigest>
        vdigest = short hash over the entry's sorted member sha256s
        rdigest = vdigest of the version this one displaced, or 0 when unknown
<SAVES_REMOTE>/README.md ; <SAVES_REMOTE>/.history/README.md
```

`record.json`: `schema`; `reason ∈ {published, replaced, discarded, deleted, suspect, legacy}`; unit key, `kind`, `system`, `rom`; `members[] = {path relative to the saves root, sha256, size}`; slot at the time (or null); `producer`, device label, `core`, `core_build`, `captured_at`, `clock_synced`; `replaces` (vdigest, and `pub` if known); for `discarded`: the decision, winning side, `decided_at`; for `deleted`: the retirement's `pub`; for `suspect`: `pattern = {size, byte}` and no members; for `legacy`: `legacy_source`, `legacy_event: unknown`, `legacy_time` (zone unknown), `imported_at`, `imported_by`; `time_trusted`; `complete`; the run id. A reader may treat an entry as complete when its record is valid; it may re-verify member presence against the listing for free.

**Invariants.** I1 nothing becomes the head, and nothing leaves it, unless the version is a complete entry (floor). I2 bytes before record; record before head. I3 copy, never move, from the head. I4 own-manifest witness before any store write. I5 a device deletes only entries it owns. I6 P1 (head-equal; own pending), P2 (unexplained-headless newest complete; own newest complete of any headless file), P3 (newest `discarded` per file) precede C1 (count per save file), C2 (age 90 d, trusted both sides), C3 (256 MiB, oldest first over own unprotected). I7 no store operation on the launch path; pruning, fold, listings and the ancestry check on full passes only. I8 every mutation audited first.

### 4.2 Load-bearing requirements, in build order

1. **Prerequisites (before any store code).** Read #21's unit table and stage lifetime (G1) and amend #21: the stage keeps the agreed version until superseded; the capture walker never claims `.history/`. Read `docs/save-manifest-schema.md` (G3) and add `store_seq` per entry and `history_keep{on,count,rev}` at top level (additive, D-CLOUD-045). Audit the full scripts, the layout migrator and MATCH (G2) for `--delete-excluded`, `--backup-dir` targets and call paths.
2. **Guard image.** `- /.history/**` and `- /README.md` at the top of `cloud_sync-rules.txt`; the helper strips `--delete-excluded` from `RCLONEOPTS` and adds the guard to a user-*edited* rules file (E15); `- /savestates/.snapshots/**` dropped once its no-writer premise is confirmed against the cutover inventory. No writer yet. Not a widening of `-replaced/` (D-CLOUD-097 stands).
3. **Escrow transaction** in the reconciler (R5/R9): entries spawn, record spawn (or E4's one-spawn form), verification per backend class, admission ceiling counting store bytes, deferral as a pair, `pending-publish.json` states `escrowed → published`, `store_seq` written to the own manifest, dedupe rule, audit lines.
4. **Retain path** for unstored heads: `store_seq` lookup, lazy listing, from-stage upload at exit, server-side copy on the full pass, defer otherwise.
5. **Pruning** on full passes: listing, chain order from `<seq>`, P1–P3, C1–C3, owner-scoped deletion, own-orphan sweep, size accounting of every byte, overshoot logging.
6. **Standing fold** of `-replaced/` and the local cache (B8), receipts, path-aware repair.
7. **Suspect class and heal** (F13), the second-occurrence question, the bounded fallback fetch.
8. **Wizard apply through the store** (#23): KEEP LEFT uploads the device loser as `discarded`, then installs the cloud head locally; KEEP RIGHT copies the cloud loser as `discarded` (server-side where possible), escrows the device version, writes the head; KEEP BOTH and the auto rule publish through escrow.
9. **Settings** nested (F19), the fleet setting (B6), the menu map, the switch's measured price line.
10. **README and public docs** (B-12, F20).
11. **Reader (#25)** after Gate 2 (A5).

### 4.3 Changes to the issues, row by row

**#21** — add: the stage keeps the last agreed version of each save until a newer one is agreed; the walker distinguishes live saves from control metadata and never claims `.history/` or a README.

**#22**
- **R1** — add MATCH THIS DEVICE TO THE CLOUD to the enumerated writers (direction from the code, gap G2); every deletion it makes goes through the store first.
- **R2** — the outer boundary carries `- /.history/**` and `- /README.md` ahead of every include, `- /**/*.bak` stays, `.snapshots` dropped after the inventory; **store transfers carry no allowlist** (their source is a stage directory the reconciler wrote); the planner rejects reserved paths from any save list regardless of filter file; `--delete-excluded` never passed.
- **R4** — add the `suspect` class with its outcomes (heal from stage; fallback fetch; questions for both-suspect, no good copy, suspect cloud head, second occurrence); "cloud unit declared incomplete" now also covers an entry with `complete: false`; mass absence is judged on live save units; the ancestry reclassification (F14) as an optional refinement; the deletion row's action becomes "copy into the store as `deleted`, then act" and drops the `-replaced/`/Gate 7 clause.
- **R5** — the exit push becomes: head evidence + witness → escrow members → record → verify → head write → correspondence → agreement and `store_seq`; spawn budget 5–6 hashed, 6–7 hashless, numbers from Gate 4/E12; the ceiling counts store bytes; deferral as a pair; smallest unit first; **one bounded fetch of a suspect unit when the stage lacks the good copy** as the only download; idle exit spawns nothing.
- **R6** — stale text: a launch *cancels* an automatic sync (D-CLOUD-076), not "refuses"; add the process-group marker and quiescence (F15).
- **R7** — the witness precedes any store write; a context change sets every `store_seq` unknown.
- **R9** — replace wholesale with §4.1's contract and I1–I8; local transaction state unchanged under `/storage/.cache/cloud_sync/`.
- **R10** — codes 3/4 → 75/69 (D-CLOUD-074); add reason `unverified-escrow`.
- **Negative scope** — "no local retention of anything" → "no *permanent* local history; the stage's agreed version is transaction state"; "no preimages of one-way fetches" → "no *redundant* preimages: a local version about to be overwritten is retained only when its `store_seq` is unknown or false"; "no protected-publication protocol" → "no coordination protocol in the cloud; publication is made recoverable, not serialised"; "no undo control" and "no `--resync`" unchanged.
- **Replaced-mechanism inventory** — `-replaced/` (cloud) and `.cache/cloud_sync/replaced/` (device): folded by the standing job, then removed when empty and the last old image is retired.
- **Acceptance** — see §4.4; the existing retention items now read "in `.history/`".

**#23** — the two retention rows nest behind a verb-bearing row under SAVE MANAGEMENT; labels per F19; the switch's dialog states the measured price and what OFF removes; the effective fleet value is shown; the done page's footer unchanged; A4 rewritten: the loser's members and record are complete in `.history/` before the head changes (KEEP RIGHT by copy, KEEP LEFT by upload), and the winner is escrowed before it becomes the head; with the switch off nothing is retained and no escrow runs (pending C-3).

**#25** — reads `.history/` only; labels per F18 including `legacy`; hides head-equal; never offers `complete: false`; stages and verifies before any live write; a restore is a publication (re-check the entry at head-write time; re-escrow from stage if gone); the `-replaced/` "labelled separately" clause and the `.snapshots` guard clause go; A5 gains "after a cache clear on the reading device and with the writing device's entries pruned under its own caps".

### 4.4 Acceptance conditions (all on the GENERIC_X64 pair against `issues/133.md`'s self-hosted matrix; nothing on a person's device or cloud — D-QA-007/015/017)

- **Floor.** For every writer in R1, the head never changes without a complete entry of the new version present first; no head version is deleted or overwritten without a complete entry of it present first — asserted by listing between each spawn (kill-between-spawns fixture).
- **Race.** `gpt-analysis.md`'s schedule as reproduced in the closing assessments, carried through A's next pass: HA is a complete entry before B overwrites it; with F14 built, the pair queues as divergent; without it, HB installs and HA is restorable by #25's test reader.
- **Pruner vs escrow.** A escrows and pauses; B runs a full pass under count and size pressure; HA survives; B's log shows no attempt on an entry it does not own.
- **Two pruners.** Two devices prune concurrently over a seeded store with different counts, a headless unexplained file, a headless `deleted` file, a headless `legacy` file, a newest `discarded`, an in-flight upload; no protected entry is deleted; if any fixture deletes one, destructive cleanup is disabled for that class and the overrun reported.
- **Count scope.** Overwrite a manual state, renumber, exit N+1 times with auto-state churn; the manual version and its PNG are restorable together from the second device; after a wizard decision on the same file, N further routine overwrites leave the `discarded` entry in place.
- **Decided deletion.** REMOVE EVERYWHERE, then a full pass with a trusted clock advanced 91 days: the `deleted` entry is gone; an unexplained headless file's newest entry is not.
- **Bytes.** Protected material seeded over 256 MiB: nothing protected is deleted; the overshoot is logged; the total in the log equals the listing's total.
- **Fleet setting.** Set 9 on A offline, OFF on B online, connect A: the effective value after both pass is the higher-`rev` edit; equal `rev` resolves ON/larger; a stale manifest never raises the count.
- **`--delete-excluded`.** Forced in `RCLONEOPTS` on the shipped image against a seeded store, copy and sync modes; then the guard image: the helper has stripped it and the store is untouched.
- **Old image.** `af2db4ab09` against a seeded `Saves/README.md` + `.history/` with content-addressed members: copy backup, sync backup, restore, MATCH (as implemented) — nothing under `.history/` transferred, moved or deleted (the expected pass); with a user filter that includes `+ /**`, the expected damage is recorded and the guard image's fold repairs it.
- **Migration.** Fixtures: partial multi-file stamps, sync-mode deletions, unique local-cache copies, duplicate basenames, a stamp changing during import, hashless stamps, oversized imports; interruption after every copy / record / receipt / removal; a second run is idempotent; no source file is removed unverified; imports carry `legacy`, `complete` correctly, and are not aged on arrival.
- **Cache clear.** Clear `/storage/.cache/`; the next full pass recovers `store_seq` from the own manifest with no `.history/` listing; a legacy head's first overwrite lists once and retains once.
- **Heal.** Zero-length and uniform candidates heal from the stage offline and report only after the install; stage missing → one bounded fetch, cancelled by a launch, healed at the next pass; both-suspect, no-good-copy, suspect cloud head → questions; erase twice → question; a #25-restored uniform version is not re-healed.
- **Orphans.** Kill only the lock-owning parent before a local rename, start a launch, release the child: the child is quiesced before the first frame; the unit is complete.
- **Reader.** Gate 2/A5 from a second device after manifest overwrite, renumber, audit rotation, clock set backward, local pending removed, cache cleared, and the writer's entries pruned; incomplete and `legacy` entries labelled honestly; a restore whose entry is pruned mid-way leaves the save unchanged and says so.
- **Time to play.** E12's three arms report latency distributions and completion rates on WebDAV and SFTP; the launch-path number is unchanged from baseline; the exit-sync number for one changed battery save on a hashed backend is the proposed budget row.
- **Labels and map.** Every new row is two lines or fewer (D-UI-023), uses D-UI-022's names, appears in `strings` on the binary, and `es-menu-map.md` is updated in the same change (D-UI-039).

### 4.5 Ordered experiments and the hazard each exposes

| # | Experiment (VM pair, `issues/133.md` backends) | Hazard it exposes | Settles |
|---|---|---|---|
| E1 | Shipped image `af2db4ab09` against a seeded store with content-addressed members and both READMEs: copy/sync backup, restore, MATCH; then a user filter with broad includes; then the guard image | Old writers restore, mirror away or shred the store; whether bare-hex names fall to `- /**` as read | B1, B8, B-6 |
| E2 | Grep the full scripts (G2); force `--delete-excluded` in `RCLONEOPTS` on the shipped and guard images | The guard becomes a deletion instruction; whether `--backup-dir` catches it | B7 |
| E3 | Per backend: server-side copy, hash availability and correspondence (incl. S3 multipart ETag), post-transfer hash check fails closed under a corrupting proxy, modtime preservation on `copyto` | Unverified escrow; a wrong cost model; the base's R-e gain | F12, B9 |
| E4 | One-spawn record-last ordering (`--transfers 1` + ordering) on every backend, killed mid-transfer | Record before members; a truncated record read as valid | B1 |
| E5 | Two devices with distinct ids through the barrier schedule and A's next pass; with and without F14 | HA lost; false conflicts from the ancestry test on a linear chain | B-2, F14 |
| E6 | A escrows and pauses; B prunes under pressure; then two concurrent pruners over the seeded protections | Escrow deleted before head write; mirrored last-copy deletion | B6 |
| E7 | Parent-only kill before a rename; launch; release the child; a server-side operation completing after client death | A rename after the first frame | F15 |
| E8 | Manual-slot overwrite + auto churn; same-file churn after a wizard decision; decided deletion aging; headless legacy file | Manual slot evicted; wizard loser evicted; permanent `deleted` entries | B3, B4 |
| E9 | Seed a device with a downloaded `.history/`; run `cloud_capture --full` | History claimed as saves | F16 |
| E10 | Migration fixtures of §4.4 with interruption at every step; a stamp changing under an old image | A legacy version lost; a source removed unverified; a torn unit offered | B8 |
| E11 | Cache clear → next full pass; legacy head's first overwrite | Upload storm; retain skipped into an unprotected entry | B9 |
| E12 | #135's `time-to-play` cell: no history / delta / store-first, WebDAV and SFTP, bandwidth-capped and not; startup-sync duration; completion rates | Exit sync over budget; freshness lost to cancellation; launch path touched | B10, F12 |
| E13 | Heal fixtures of §4.4, including a stage that lacks the good copy and an offline heal | A dead save left in place; a false recovery message; a heal loop | F13; #21's stage requirement (G1) |
| E14 | Gate 2/A5 reader from a second device under §4.4's perturbations | A store a reader cannot drive | F18 |
| E15 | Upgrade a device with a user-edited rules file and one with a user-named filter file | The guard never reaches edited files; a user's own filter altered | F17 |

### 4.6 Register rows that need the maintainer's word (proposals — IDs are theirs to assign)

- **P-1 (refines D-CLOUD-032/036/096).** The history setting is one fleet-wide value carried in the manifests, last explicit edit wins, ties ON and larger; OFF stops escrow and every new entry from the next pass, purges nothing, and is disclosed in the switch's dialog as opting out of the floor. *(C-3, C-6.)*
- **P-2 (refines D-CLOUD-096).** Protections before caps: P1 head-equal and own-pending; P2 the newest complete entry of an *unexplained* headless save (a decided deletion or a legacy import ages out normally); P3 the newest deliberate conflict loser; then count per save file (a state and its PNG one entry), age trust-gated, 256 MiB as a target over every stored byte with disclosed overshoot; pruning on full passes; a device deletes only its own entries. Confirm the count range (1–9 default 3, D-CLOUD-036) against "3 to 5" (D-CLOUD-096).
- **P-3 (refines D-CLOUD-041).** The cloud loser is preserved by copy plus verification, never a move; winner and loser both pass through the store.
- **P-4 (refines D-CLOUD-042).** D-CLOUD-095 supersedes the location clause only; the split-root refusal stands.
- **P-5 (refines D-CLOUD-045).** Additive manifest fields `store_seq` and `history_keep{on,count,rev}`; manifests remain claims, the listing the head.
- **P-6 (refines D-CLOUD-046 / #22 R5).** The changed exit gains the escrow and record spawns and one upload of the changed bytes; the ceiling counts store bytes and defers escrow and publish together; one bounded fetch of a suspect unit is the only download, when the stage lacks the good copy; numbers from Gate 4 and E12.
- **P-7 (refines D-CLOUD-047).** Propagated deletions are retained through the store as `deleted` before they act; compactions retain nothing; `-replaced/` is no event's record; Gate 7 is moot for saves.
- **P-8 (refines D-CLOUD-088).** The player's filter controls which saves move; reserved paths are removed from every save list by the reconciler regardless; the helper strips `--delete-excluded` and adds the guard to an edited shipped rules file.
- **P-9 (refines D-CLOUD-093).** The reconciler records its process group; a launch or a new run quiesces a dead owner's group before proceeding.
- **P-10 (refines D-CLOUD-100).** Heal from the stage at exit, from the cloud on a full pass, one bounded fetch as the fallback; the suspect kept as an exact descriptor and shown as a version; the recovery reported after the install; the second occurrence a question; and — the maintainer's call — whether the sentence may say "looked empty / looked damaged" rather than "was damaged" for the heuristic case (D-CLOUD-077).
- **P-11 (refines D-UI-022/039).** *Earlier versions* is the store's noun; *discarded saves* stays the wizard's word and the reason label; the entering row's verb-bearing label and the `legacy` label are the maintainer's words.
- **P-12 (accepts or rejects a residual).** In a fleet with an old image using a user-named filter that reaches `.history/`, or `--delete-excluded` with `sync`, two old runs with no new-image pass between can lose displaced history members before the fold repairs them; mitigations are the release order and the fold; the residual is bounded by the fleet (two handhelds, D-UI-022) and is for the maintainer to accept, not the plan.
- **P-13 (a budget row, #135).** Exit sync for one changed battery save on a hashed backend: the number from E12; a run over it fails the suite.
- **Not reopened:** D-CLOUD-052 (transport), D-CLOUD-095, D-CLOUD-097 (a filter rule is not a widening), D-CLOUD-099, D-CLOUD-014 (store-first is its generalisation: nothing is overwritten or deleted without a record), D-CLOUD-030 (identity), D-CLOUD-033 (no undo control in the wizard), D-QA-015/017.

### 4.7 Time to play, stated (D-CLOUD-098, #135)

**Interface → first frame:** unchanged — nothing in this plan runs before a launch; a launch cancels any automatic pass in any phase (D-CLOUD-076) and the only launch-time addition is F15's bounded quiescence of a *dead* owner's children, inside D-CLOUD-076's two-second budget. **One game's exit → the next first frame:** worst case unchanged (the cancellation budget); the exit sync is longer by F12's ledger (+2 spawns, +S up on hashed backends; +3 spawns, +S up, +S down on hashless; estimated +1–3 s per changed small save, **[unmeasured → E12]**), cancellable, ordered so a cancel wastes at most the spawn in flight, and bounded by P-13 once measured. Rigour that the player is not waiting for — pruning, folding, listings, the ancestry check, imports, cloud-side heals — runs on full passes only.

### 4.8 Corpus gaps surfaced to the orchestrator

G1 — `issues/21.md`: the unit table, the capture walker, the stage lifetime (F13, F16, the count bucket's no-op condition). G2 — the complete `cloud_backup`/`cloud_restore`, `cloud_sync_helper`, the layout migrator, MATCH and `FileData::launchGame` (B7, F15, F16). G3 — `docs/save-manifest-schema.md` (`pub`, `replaces`, additive fields; B6, B9, F14). G4 — `docs/conflict-wizard-ia.md` (the question surfaces for F13). G5 — `upgrade-and-install.md` and `engineering-practices.md` in full (quoted by the commission, not embedded). G6 — no measurement of any retention operation, backend capability or first-frame time exists in the corpus; every second above is an estimate until E3/E12 run. The Step 1 analyses and Step 2 reviews named inside the revised plans were not embedded here; their arguments are taken as the revised plans and closing assessments reproduce them.

---

## `corpus.provenance.json`

```json
{
  "artifact": "consensus_plan.md",
  "facilitator": "council-facilitator@1.2.0",
  "access_mode": "Embedded read-at-time source corpus only; no filesystem access; no file re-read, no hash recomputation, no experiment run by this member.",
  "source_manifest_named_by_prompt": "research/council-runs/2026-09-11-save-history-one-home/_prompts/step4_5-source-manifest.json",
  "hash_basis": "All values in source_file_hashes are the Facilitator's sha256 values verified at embed time; the arrays correspond by index.",
  "manifest_read_timestamps_utc": {
    "sources_1_to_17": "2026-09-11T19:31:42Z",
    "sources_18_to_21": "2026-09-11T22:22:08Z"
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
    "research/council-runs/2026-09-11-save-history-one-home/revised_approaches/gpt-revised_plan.md",
    "research/council-runs/2026-09-11-save-history-one-home/revised_approaches/kimi-revised_plan.md",
    "research/council-runs/2026-09-11-save-history-one-home/revised_approaches/gemini-revised_plan.md",
    "research/council-runs/2026-09-11-save-history-one-home/revised_approaches/mistral-revised_plan.md"
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
    "f75aa71c71ebeff2d7df48a6d5a5f8096bb76e80a9d21dd60241faa6297c35ac",
    "4b835cc5402b0b8c728f4179484d5c62fa3b0c02355de1e46eb569bcbad75ad6",
    "6a6f42c732ebd9fe7518d669f5eb555a0dc312f2da0c85800e3df20251cda8e8",
    "415cc96f6fb6204f38143beb61704a036ad58a6c9bf4241a2a20d4a567927251"
  ],
  "injected_without_declared_path_or_hash": {
    "base": "claude-revised_plan.md (injected verbatim in the orchestrator brief)",
    "closing_assessments": [
      "claude_vote.md",
      "gemini_vote.md",
      "gpt_vote.md",
      "kimi_vote.md",
      "mistral_vote.md"
    ],
    "note": "No path or hash was supplied for these; none has been fabricated, and they are cited by filename only. Step 1 analyses and Step 2 peer reviews named inside the revised plans were not embedded in this step and are cited only as the embedded plans and assessments reproduce them."
  },
  "corpus_gaps_surfaced_to_orchestrator": [
    "issues/21.md: unit table, capture walker, stage lifetime (G1).",
    "Complete cloud_backup, cloud_restore, cloud_sync_helper, layout migrator, MATCH and FileData::launchGame implementations (G2).",
    "docs/save-manifest-schema.md, including the meaning of pub and replaces and the additive fields proposed here (G3).",
    "docs/conflict-wizard-ia.md (G4).",
    "upgrade-and-install.md and engineering-practices.md in full (G5).",
    "No measurement of any retention operation, backend capability (server-side copy, hash correspondence, modtime preservation, post-transfer verification), or first-frame time exists in the corpus; every second stated is an estimate pending E3 and E12 (G6)."
  ],
  "activity_statement": "No code was written or run, no file was written, no test was performed, and no handheld or cloud account was accessed. Layouts, fields and rules proposed above are design proposals, not additional claimed source files."
}
```
