# Round 4 peer review — `kimi_peer_review-r4.md`

**Posture.** I am the fifth member; my own revised approach is not among the injected artifacts, and per the brief I am not revising it here. The four injected plans — `claude-revised_plan-r3.md`, `gemini-revised_plan-r3.md`, `gpt-revised_plan-r3.md`, `mistral-revised_plan-r3.md` — are judged against the embedded corpus (cited as `[Snn]`, mapping to the provenance block at the end) and against the maintainer's two amendments, which I treat as authoritative. I re-traced every load-bearing claim I rely on against the embedded sources rather than accepting any plan's assurance, including my own prior positions — two of which do not survive this round (§10).

---

## 1. Question one: walk the restore tool through each plan's retention store

The reader's question, verbatim: *"show me the retained past versions of **this game**, newest first, with a thumbnail, the producing device, and which side won."* I trace each store literally.

### 1.1 `claude-revised_plan-r3.md` — survives the trace

**Store:** `/storage/.cache/cloud_sync/retained/<system>/<unit-key>/<device-id>-<seq>/record.json` + retained member files (PNG included), `unit-key` = ROM filename made path-safe, `seq` = persisted per-device monotonic counter (§3.9.1).

**The walk:**

1. From the game, derive `<system>` and `<unit-key>` (ROM filename, path-safe; container id for a VMU/memcard). Open that one directory. It contains exactly this game's retained resolutions and nothing else's — no filtering, no recursive scan.
2. **Newest first:** sort directory names by `<seq>` descending. The counter is monotonic and clock-free — correct on a device that booted without a network, which is precisely the case `clock_synced` exists for (`docs/save-manifest-schema.md` §6 `[S03]`). Because the store is local and only this device writes it, all records share the device's id prefix and the order is total.
3. **Per record, read one small `record.json`:** system; rom/container; `unit` and the complete member list with slot, sha256, size, screenshot; provenance of *both* operands (device id, label, model, emulator, core, core_build, captured_at, clock_synced, `unknown` preserved); which operand was cloud and which device; the action; the winning sha256 and its resulting live path/slot; the retained side and the original path; `resolution_id`; `phase`.
4. **Thumbnail:** the PNG is a member file in the same directory, named in the member list. Open it directly. For an in-game save there is none and the record says so — the glyph rule (`docs/conflict-wizard-ia.md` `[S02]`) applies.
5. **Producing device:** the discarded operand's inline provenance. **Which side won:** action + winning sha256 + retained side.

**What it scans that it does not need:** nothing. One directory, one JSON per record, named PNGs. It consults no manifest, no audit log, no pending record — and the plan's Gate 8 is a test-only reader run *after* the producer's manifest entry has been overwritten, slots renumbered, the audit log rotated (rotation at 1 MiB is D-CLOUD-027 `[S06]`), and the pending record removed. That is the amendment's acceptance test, pre-built.

**Field presence at discard:** every field is in hand at apply time — the wizard rendered both panels from the two manifests, so both operands' provenance is held, and the decision values are the wizard's own. Verified against the schema's field list `[S03 §6]`: each `record.json` field maps to a manifest field or a decision value.

**Residual gaps (minor):** (a) `unit-key` collides for same-basename ROMs in different directories — but that collision is inherited from the flat `{{system}}` savestate layout itself (`es/SaveStateConfigFile.cpp` `[S39]` default), not created by the store; `gpt-revised_plan-r3.md`'s content locator is the fix and is liftable. (b) The store is local: a choice resolved on device A is not restorable on device B. The maintainer's primary case is same-device, one step back, so this is acceptable — but the plan should say it plainly, and it does not quite. (c) The `.cache` home needs the non-disposable sentence; the plan has it, with the D-CLOUD-027 audit-log precedent as support.

### 1.2 `gpt-revised_plan-r3.md` — survives the trace; strongest contract, least concrete layout

**Store:** proposed `/storage/.local/share/rocknix/cloud-saves/` with `discarded/`, `preimages/`, `pending/` areas; record-ID-keyed retained sets plus "a small ordered index" pruned by local commit order (§8.2–8.4).

**The walk:**

1. Read the ordered index; filter by the picker grouping (system + supplied ROM filename + content locator, or unit ID / container label). **Newest first** = reverse commit order — no clock anywhere.
2. Per event, read one record: record identity; picker grouping; original placement (relative paths, core repository, slot or `auto`, destination mapping); payload (every member's sha256, size, stored location); **producer snapshot copied inline at retention time** (device id/label/model/family, emulator/core/build, capture times, clock confidence, explicit unknowns); preview (retained PNG location and hash, or explicit absence); decision (action, which side won, winner map/hashes, winner producer where known); retention reason; **completion (prepared vs finalized)**.
3. Thumbnail: the preview field points at the retained PNG. Producing device: the inline snapshot. Which side won: the decision field — the richest of the four, since it also carries the winner's producer where known.

**What it scans that it does not need:** the index (small by design) and the matching records. §8.3's "does not depend on" list — current manifest, rotating audit log, surviving apply-plan, filename timestamp — is the amendment's requirement stated as a contract, and §8.5 commits V1 to testing the future-reader projection.

**Field presence at discard:** explicitly "copied inline at retention time." This is the only plan that says the producer snapshot must be *copied*, not referenced — which matters because the producer's manifest entry is overwritten on its next capture and the audit log rotates.

**Residual gaps:** (a) the on-disk layout below the three areas is unspecified — `claude-revised_plan-r3.md`'s directory shape is the concrete complement and the two compose without friction; (b) if the ordered index is lost and record IDs are non-sequential, commit order is unrecoverable — fixed by adopting claude's seq-in-the-name, which makes the filesystem itself the index; (c) the new path is invented. The embedded evidence is kind to it — `backuptool` archives `/storage/.config/*` (`docs/conflict-wizard-ia.md` "Where state lives" `[S02]`; `docs/save-manifest-alignment-review.md` `[S04]`), so `.local/share` is outside backups — but the plan is right to make upgrade-survival an acceptance test rather than a claim.

### 1.3 `gemini-revised_plan-r3.md` — fails the trace on ordering and completion

**Store:** `/storage/.cache/cloud_sync/discarded/<path>/` holding `<sha256>`, `<sha256>.png`, and `<sha256>.json` (rom, system, kind, slot, producer{device_id, device_label, core, core_build, captured_at}, winner_side, winner_sha256, reason, resolved_at, run_id) (§2.1).

**The walk:**

1. `<path>` is the discarded *file's* path. "This game's" saves have occupied `savestates/<system>/<romfilename>.state`, `.state1…N`, `.state.auto`, and `<system>/<rom>.srm` — and after a renumber, several of those. The reader must either glob every historical per-path directory for the game, or — safely — scan `discarded/` recursively and filter sidecars by `rom`+`system`: **it reads the whole store to answer for one game.** The plan never traces this.
2. **Newest first:** the only ordering fields are `resolved_at` — a wall clock, unreliable on a device that boots without a network (`clock_synced` exists for exactly this reason `[S03 §6]`) — and `run_id`, shown as a `<uuid>`, which is unordered. **The amendment's "newest first" is not derivable as written.** This is the timestamp-keyed failure the amendment names, one level down: the key is path+hash, but the *order* is timestamp-only.
3. Thumbnail: `<sha256>.png` beside the bytes — present. Producing device: `producer.device_id`/`device_label` — present (no model/family, no `clock_synced`). Which side won: `winner_side` + `winner_sha256` — present; the winner's producer is not recorded (not strictly required by the question).
4. **Multi-member units:** two members land as two per-path records linked only by a shared `run_id`. The plan never says the reader groups by `run_id`, and its own "3 per save unit" pruning on a per-path layout requires the same untraced grouping — so one member's record can be pruned while its sibling survives, leaving half a memcard.
5. **No completion marker.** The plan exempts "incomplete transaction preimages" from pruning (§2.2), but the record has no prepared/finalized field; that distinction lives in the apply journal (§3.5), whose post-completion retention the plan does not specify. The pruner cannot tell a finalized record from an interrupted one from the store alone — it would have to consult an apply record the plan may have removed, which is exactly the dependency the amendment forbids.

**Verdict:** the four fields the amendment enumerates (game, slot, device, side won) are present, but the store fails on ordering, on the completion marker, and on per-path fragmentation. All three are liftable fixes from §1.1/§1.2 — the sidecar's other fields are sound.

### 1.4 `mistral-revised_plan-r3.md` — fails the trace on ordering; shallowest store

**Store:** `/storage/.cache/cloud_sync/discarded/<path>/<sha256>` + `<sha256>.json` sidecar carrying the copy's manifest entry verbatim, `reason`, `winner{side, path, sha256, device}`, the run/transaction id, and the wizard's decision text (§6.1).

**The walk:**

1. Same per-path fragmentation as gemini: the reader scans the whole `discarded/` tree filtering by the sidecar's `rom`+`system`.
2. **Newest first:** the sidecar carries `captured_at`/`captured_local` — the copy's *production* time — and a run/transaction id with no stated ordering property. There is **no resolution-time field at all** and no sequence. Neither "most recently discarded" nor any clock-free order is derivable. Fail as written — the weakest ordering story of the four.
3. Thumbnail: "PNG travels with the state" (`[S03 §4]`) — present by implication; the sidecar records the screenshot path and hash.
4. Producing device: `origin`/device inside the verbatim manifest entry — present **only when the copy has a manifest entry**. For an `unknown`-provenance discard — the entire pre-capture population (`[S03 §4]`) — there is no entry to copy verbatim, and the plan does not say what the sidecar then holds. `claude-revised_plan-r3.md` explicitly preserves `unknown`; this plan is silent.
5. Which side won: `winner{side, path, sha256, device}` — present, and richer than gemini's (includes the winner's device).
6. Multi-member grouping and the completion marker: same two defects as gemini — the stated exemptions (§6.1) have no field to hang on.

**Verdict:** fails the trace on ordering, keying, the unknown-provenance case, and the completion marker. Its own §6.1 already concedes the home is unsettled ("decide it alongside the sidecar shape"). Needs the same lifts as gemini plus an ordering field.

### 1.5 The store that survives — integrated answer

No plan's store is wrong in philosophy; two are right in fact. The store a builder should write is: **`claude-revised_plan-r3.md`'s layout and seq naming** (`retained/<system>/<unit-key>/<device-id>-<seq>/`, the directory name as the clock-free index) **carrying `gpt-revised_plan-r3.md` §8.3's field set** (a superset: inline producer snapshot, completion state, retention reason, content locator) **with gpt's bucket model for pruning** (auto its own bucket; numbered states a game/core collection bucket so renumbering does not fragment retention; one multi-slot apply = one event) **and the non-disposable sentence** wherever it lives. Home: `.cache/cloud_sync/retained/` with the explicit exemption — the audit-log precedent (D-CLOUD-027) already puts irreplaceable data there — unless someone actually runs the `.local/share` upgrade-survival test, in which case gpt's path is the cleaner convention. Acceptance: claude's Gate-8 / gpt's §8.5 reader-projection test, run after manifest overwrite, renumber, log rotation, and plan removal.

---

## 2. Question two: liftable or architectural

I was strict, per the brief. **Conclusion first: no architectural differences remain among the four plans.** After the round-3 concessions they are one architecture in four dialects — same classifier, same write-path ownership, same lifecycle gate, same checked adapter, same retention semantics, same deletion mechanism. Every remaining difference is a field, a path, a keying, an ordering, or a wording that moves between plans without disturbing anything else. The two nearest candidates for "architectural" are examined at the end and both dissolve.

### 2.1 Liftable differences, with the direction each should move

| # | Difference | Direction it should move |
|---|---|---|
| 1 | Store keying: per-unit dir + seq (claude) vs record-id + index (gpt) vs per-path (gemini, mistral) | claude's layout into gemini and mistral; gpt's index becomes the seq-in-name |
| 2 | Store ordering: seq / commit order (claude, gpt) vs `resolved_at` clock (gemini) vs nothing (mistral) | monotonic sequence, never a clock — into gemini, mistral |
| 3 | Completion marker: `phase` (claude), prepared/finalized (gpt) vs none (gemini, mistral) | into gemini, mistral — their own pruning exemptions are unenforceable without it |
| 4 | Record field set | gpt §8.3 is the superset; claude's `record.json` is the near-equivalent; lift gpt's inline-producer-snapshot wording into all |
| 5 | Pruning granularity: per unit-key (claude), per "save unit" (gemini, mistral) vs logical buckets (gpt) | gpt's bucket model into all — renumbering must not fragment retention, and one multi-slot apply is one event |
| 6 | Store home: `.cache` (claude, gemini, mistral) vs `.local/share` (gpt) | either, plus the non-disposable sentence; default `.cache` + sentence (D-CLOUD-027 precedent) unless the `.local/share` survival test is actually run |
| 7 | Container spelling: `unit` field + `rom: null` (claude), unit-level distinction (gpt) vs `kind: "container"` (mistral, adopted by gemini) | claude/gpt — see §5.3 for why mistral's row is incoherent |
| 8 | Manifest publication: manifest-last as load-bearing (claude L4; mistral keeps) vs "a manifest is not a transaction commit" (gpt) | gpt's framing; claude's ordering survives as a measurement-gated option (its own O1 already half-concedes) |
| 9 | `resolves` receipts: kept as O6 (claude) vs removed (gpt) | drop for V1 — gpt's trace (§5.4) shows the plain classifier already downloads a later informed choice, because agreement advances at publication; the amendment's "receipt machinery deeper than one step back is not the primary case" lands on claude's side |
| 10 | Spawn A (local `hashsum` to fill `remote_hash`): dropped (claude) vs kept (mistral §4.3) vs "optimization, never prerequisite" (gpt) | drop — mistral's claimed benefit ("confirm C = A without a listing") is unsound: `remote_hash` is already recorded at upload `[S03 §6]`, and a local hash of what *we* uploaded cannot reveal whether the cloud changed since (gpt is exactly right) |
| 11 | LAN reachability: route-table lookup (claude, gpt, gemini-r3) vs mistral's §1.5 adopting it while §10 lists "a probe replacing `ip route`" as not-to-build | route-table, no ICMP; mistral's §10 attacks the ping probe gemini-r3 has itself dropped — resolve to the converged position and delete the stale bullet |
| 12 | Exit-path deferral wording: "leave that unit pending rather than overwrite an unread head" (gpt) vs "defer verification… leaving the exit push as a fast-path upload only" (mistral §4.3) | gpt's sentence — mistral's can be read as write-then-verify, which every plan including mistral's own §4.3 forbids; fix the wording |
| 13 | Unexplained cloud objects: two full passes then legacy-download (claude §3.3.3) vs immediate one-way when "no prior presence contradicts" (gpt §5.1) | claude's two-pass rule for multi-member units — gpt's immediate transfer can install a half-published memcard inside the payload-before-manifest window; for single files the rules coincide |
| 14 | Capture gating: gpt §3.3 requires capture even when exit sync is disabled/offline/lock-held; claude places capture "between the refresh and the sync" without saying it escapes the `cloudsaves.gameexit` conditional in `es/FileData.cpp.launchGame-excerpt-l740-850.cpp` `[S41]` | gpt's — otherwise every player with the toggle off accrues no provenance |
| 15 | Launch context: exit-time `getCore(true)` (claude) vs context saved at command construction (gpt §3.3) | gpt's — `SaveState::setupSaveState` rewrites `-emulator`/`-core` when a state's config is not the active one and `racommands` is false `[S38]`; that condition is exactly the #10 world |
| 16 | Owner-vs-producer manifest semantics with inline per-entry producer (gpt §4.2) vs nothing (all others) | gpt's, as an additive optional field — see §5.2; this is the single most important lift in this round |
| 17 | Merge adapter contract: full (claude §3.8, gpt §7.4, mistral §8.2) vs gemini §3.5, which handles −99 but says the primitives "are used" without addressing `copyToSlot`'s unconditional `true` or the parent-derived destination `[S38]` | the adapter contract into gemini |
| 18 | Kid/kiosk pending behavior (claude §3.7.7, gpt §7.2) vs silence (gemini, mistral) | into gemini, mistral — the full-UI block collapses `[S13]` and queued conflicts must not silently resolve |
| 19 | Run-id result file (claude §3.9.3, gpt §9.1) vs lighter treatment | either into gemini, mistral — rclone's exit 3/4 collide with the scripts' SKIPPED meanings as `ThreadedCloudSync` renders them `[S40]` |
| 20 | Retirement transport: own-manifest `retired` ring (claude) vs unspecified (gemini, mistral) vs a distinct record type (gpt) | claude's transport (the own manifest is what every device already reads) + gpt's bound rule (a control-state limit stops mutation; it never silently drops intent) |
| 21 | "A retention sweep must never evict the only copy of an unreviewed head" — gemini's sentence | into all four verbatim |
| 22 | Round-trip harness repair: gpt §10.3's itemized defects vs claude's generic Gate 0 | gpt's list into claude's gate — verified in §5.1 |
| 23 | Auto-conflict frequency: "every session" (mistral §2.4, restating the schema) vs the correction that numbered-slot launches restore `.auto` from `.bak` at exit `[S38]` (claude §5, gpt §10.2) | the correction into mistral; the resume-point presentation stands regardless |

### 2.2 The two nearest-architectural candidates, and why they dissolve

**Manifest-last vs manifest-with-payload.** `claude-revised_plan-r3.md` lists manifest-last as load-bearing (L4: "the price of a commit point"); `gpt-revised_plan-r3.md` §6.3 calls the commit point illusory. Gpt is right on the mechanism: rclone transfers are per-file, no backend offers a multi-object commit, and ordering only selects *which* transient mismatch a reader sees (manifest-without-payload or payload-without-manifest). Both plans already require readers to treat either mismatch as pending/torn (claude §3.3.3; gpt §4.3, §6.3) — the member-map completeness guard is what actually protects readers, and both have it. The residual difference is one spawn's price on the changed-exit path, which Gate 4 measures. A pricing question is not an architecture.

**`resolves` vs no receipts.** One optional field. Both systems are coherent with or without it; the main case it serves is already served by the classifier (gpt's §5.4 trace: A's agreement advanced when A published its resolution, so B's later choice arrives as an ordinary "cloud changed" download). The residual case — a *fresh* device holding the loser of someone else's resolution — asks once, conservatively, which the cardinal rule (`issues/issue-11.md` `[S17]`) is content with. Drop it; if the census later shows the case is common, the field is additive and can return.

**Stated plainly:** between any two of these four plans, nothing remains where taking both is incoherent. A builder integrating them never has to choose a camp; they have to choose spellings.

---

## 3. Where all four agree without the corpus settling it

These are unanimous and unsettled — the orchestrator should not mistake four-way agreement for evidence:

1. **Bisync demoted from detector to candidate transport.** The corpus still says bisync detects (`docs/conflict-wizard-ia.md` "Detection" `[S02]`; the futro's #22 ACs `[S05]`; `issues/issue-22.md` `[S23]`). No register row binds it, so no row needs reopening — but the IA and #22's body need the amendment, and the maintainer should see the recommendation explicitly, not discover it.
2. **Queue-and-badge wizard trigger.** IA rev 4 says "a sync that reports conflicts opens the wizard" `[S02]`; all four propose queue-and-badge for unattended passes. This is an IA rev 5 item and a maintainer call — it interacts with "get the user going as quickly as possible," which cuts *for* it.
3. **Retention count = 3.** A product proposal with no corpus basis; the amendment settles "on, and bounded," not the number.
4. **The changed-exit path fits a tolerable budget.** Every number is a prediction; `issues/issue-35.md` `[S27]` records that the round-trip suite has never executed, and no plan has run anything.
5. **`copy --backup-dir` preserves the replaced object.** The corpus shows `--backup-dir` only in `cloud_backup`'s `sync` branch `[S29]`; its behavior with `copy`, under interruption and race, is unmeasured. Gpt's §6.6 failure branch is the right posture if the fixture fails.
6. **Auto states are the commonest conflict.** The schema asserts it `[S03 §4]`; `es/SaveState.cpp` `[S38]` shows numbered-slot launches restore `.auto` from `.bak` at exit, so divergence requires auto-resume sessions. The census settles it; the design stands either way.
7. **ES's process spawn inherits the lifecycle fd across an ES death.** `ProcessStartInfo` is not embedded; `engineering-practices.md` `[S10]` records SIGABRT-and-restart behavior that makes this load-bearing.
8. **The unit table matches what standalone emulators actually write.** Nobody has inventoried PPSSPP/Flycast/Mupen/DuckStation output on a device (known unknown 8, `[S01]`).

---

## 4. Real disagreements, and what settles them

- **Manifest publication order** — settled by the Gate 2 `--order-by` probe and Gate 4 spawn pricing. Settles toward `gpt-revised_plan-r3.md`: no safety difference (the torn-unit guard covers both orders), price only.
- **Store home** — settled by an upgrade-survival test on a device with real prior state (`upgrade-and-install.md` `[S11]`). Either outcome is fine; the exemption sentence is the load-bearing part.
- **`resolves`** — settled by argument, not experiment: the classifier already handles the main case; the amendment discourages the machinery. Settles toward drop.
- **Two-pass legacy escalation vs immediate one-way** — settled by the torn-unit fixture (interrupt an upload after one member; assert no device installs the mixed set). Settles toward claude's wait, which costs nothing.
- **Auto-conflict frequency** — settled by the shadow census; design-neutral.

---

## 5. Load-bearing claims re-tested against the corpus

### 5.1 `gpt-revised_plan-r3.md` §10.3's harness repair list — verified, and it matters

I checked three of its claims against `tools/cloud-round-trip` `[S36]` and the scripts:

- **Archive-name expectations disagree with the uploader.** The harness plants `ROCKNIX-backup-qa.zip` and asserts `f"{device_id}/{ARCHIVE_NAME}" in listing`. `cloud_backup` `[S29]` prepends a date stamp to any archive not already dated, so the real key is `<device_id>/2026_…-ROCKNIX-backup-qa.zip`; the asserted substring is absent. The check fails spuriously. **Verified.**
- **Restore-name mismatch.** `cloud_restore` `[S30]` downloads "under the name it already has" (dated); the harness hashes the undated local path and concludes "the archive did not come back." **Verified.**
- **`rclone.conf` overwritten and never restored.** The harness writes the QA config before the remote assertion; cleanup restores `BACKUPPATH`/`RESTOREPATH`/`BACKUPFOLDER` and `BACKUPFILE_RESTORE_OPTION` but not `rclone.conf` — on a configured device that strands the player's remote. **Verified.**

This list is the difference between Gate 0 producing evidence and Gate 0 producing spurious FAILs chased for a day. It is `gpt-revised_plan-r3.md`'s most concrete unique contribution.

### 5.2 The schema's missing per-entry producer — a real gap only `gpt-revised_plan-r3.md` names

The signed schema carries `device.*` at the top level only; per-entry fields have no producer (`docs/save-manifest-schema.md` §6 `[S03]`), and its rule "nothing stamps a file it did not write" was written against stamping *pre-existing* files. The KEEP BOTH import case is new: device A installs B's state into a free slot and writes an entry for it — under the letter of the schema that entry reads as A-produced, because the manifest's device block is A's. The true producer survives only in the audit log, which rotates at 1 MiB (D-CLOUD-027 `[S06]`), and KEEP BOTH writes no retained record (nothing was discarded). So the merged copy's provenance **evaporates by design** in three of the four plans. Gpt's owner-vs-producer refinement (manifest owner ≠ entry producer; producer facts carried inline) closes it additively. I verified the schema text; the gap is real. Lift it.

### 5.3 `mistral-revised_plan-r3.md`'s container row is incoherent

Its §3.3 schema amendment adds an entry keyed `"dc/shared/savefiles/"` — a *directory* — with a single `"sha256"`. The schema keys entries by path, **one per file** (`[S03 §5]`), and a directory of VMU files has no single stored-bytes hash; the unit's identity is the member *map*, which is mistral's own §4.2 rule. The row contradicts the plan's own classifier. `claude-revised_plan-r3.md`'s `unit` field on per-file entries (and gpt's unit-level distinction) is the coherent spelling; mistral's own argument for `kind: "container"` is further weakened by claude's observation that the wizard's glyph logic keys on `kind` and a memcard is still an in-game save to the player. Fix before the inline-JSON form is lifted anywhere.

### 5.4 The ES primitive defects — verified from source

`getNextFreeSlot()` scans 99999→0 for a numbered slot; an auto-only repository (slot −1) yields −99 `[S37]`, and `setupSaveState` appends `-state_slot <nextSlot>` unconditionally on the auto-resume path `[S38]` — what RetroArch does with −99 is genuinely unknown, and claude's Gate-6 "launch from the auto state" is the right cheap experiment. `copyToSlot()` returns `true` regardless of what `renameFile`/`copyFile` did `[S38]`. `makeStateFilename(fullPath=true)` combines with the *source's* parent directory `[S38]`. `isEnabled()` requires `emulator == "retroarch"` `[S37]`. All four plans' adapter mandates are justified; gemini's is under-specified (§2.1 row 17).

### 5.5 The equality-bootstrap gap — verified, and all four now carry the fix

The signed schema records agreement only on **upload or download** (`[S03 §2]`); its conflict table has no equality row (`[S03 §3]`). A device that upgrades with local = cloud everywhere and no `agreed.json` gets "never agreed → ask" on the first save it touches — an upgrade that is not invisible (`upgrade-and-install.md` `[S11]`). All four plans now write agreement on verified equality. Converged and correct.

### 5.6 Smaller verifications

- `RCLONEOPTS` bypass: a non-empty user value replaces `cloud_backup`'s fallback option set `[S29]`; the shipped default does carry `--filter-from` `[S33]`, so the hazard is user-edited configs — claude's claim is accurate with that nuance.
- `.state.auto.bak` matches `+ /**/*.state*` `[S32]` and matches neither ES regex `[S39]` — synced and invisible; the exclusion is justified.
- `es_savestates.cfg` creation flips three behaviors: compiled `Default()` sets `racommands`/`incremental`/`autosave` true; the XML path hard-codes `racommands = false` and defaults the other two false `[S39]`. The #10 rehearsal gate is justified.
- The exit upload is `copy` with no `--update` `[S29]`; the boot pair is `copy --update` both ways `[S35]` — blindspot 28 `[S07]` stands; D-CLOUD-029 stands.

---

## 6. What the amendments cost each plan

- **`claude-revised_plan-r3.md`: ~zero.** It anticipated both amendments — retention on by default with a count, no undo control, one-step lineage (the eight-generation chain was already cut), a reader-designed store, and Gate 8 as the reader test. Residual friction: the O6 `resolves` receipt is exactly the "receipt machinery" the amendment's second clause cools on.
- **`gpt-revised_plan-r3.md`: ~zero.** Its r2 over-scope (a native recovery route in V1) is withdrawn in §1 with the design re-homed to the separate issue; §8 is the fullest store contract of the four.
- **`gemini-revised_plan-r3.md`: moderate.** Headline-compliant (§2: on by default, count, no undo, done-page sentence), but its store fails the amendment's *consequence* clause — the reader cannot order newest-first, cannot see completion, and must scan the whole tree per game. The cost is a re-keying and two fields, all liftable.
- **`mistral-revised_plan-r3.md`: moderate.** Headline-compliant (§5.2, §6.2), but its store has no resolution-time ordering at all, the same per-path fragmentation, an unknown-provenance hole, and no completion marker; plus three editing defects the amendments did not cause (the container row, the §1.5/§10 probe self-contradiction, the "fast-path upload" wording that can be read as write-then-verify).

---

## 7. What each plan uniquely has (liftable verbatim)

- **`claude-revised_plan-r3.md`:** the concrete store layout `retained/<system>/<unit-key>/<device-id>-<seq>/record.json` with its full field list; the Gate-8 readability protocol (overwrite the manifest, renumber, rotate the log, remove the plan, *then* read); the two-pass unknown→legacy escalation with the torn-unit narrowing; the churn-trace convergence gate (Gate 7); the 0-idle / 3–4-changed spawn accounting; the verdict-table retirement rows ("C only + `retired{path, sha256 = C}` at the cloud head → retire into `-replaced` by copy-verify-delete").
- **`gemini-revised_plan-r3.md`:** the sentence "a retention sweep must never evict the only copy of an unreviewed head"; the named `ip route get <ip>` mechanism (now universal); the most explicit concession ledger (§1) — a model of revision accountability; the compact settled-vs-agreed split (§4).
- **`gpt-revised_plan-r3.md`:** the §10.3 harness repair list (verified in §5.1); owner-vs-producer manifest semantics with the inline producer snapshot (§5.2); capture independent of the sync toggle (§3.3); launch-context-at-construction (§3.3, grounded in `[S38]`); the pruning bucket model (§8.4); manifest parser discipline (reject absolute paths, traversal, unsafe links — §4.5); sync-context binding that notes the five values are insufficient for an account relink (§4.4); "a manifest is not a transaction commit" (§6.3); the explicit no-reopens list (§9.4).
- **`mistral-revised_plan-r3.md`:** the §12 per-plan amendment-cost table (the right format for the orchestrator's integration step); the inline-JSON register-amendment form (with the container row corrected to the `unit`-field spelling); "a SQLite index — all four agree; say so on #20 and close the question" — a genuinely useful closure action; the consolidated not-to-build list (§10).

## 8. What should not be built

- `mistral-revised_plan-r3.md`'s spawn A — its claimed benefit is unsound (§2.1 row 10) and it costs a process start on the watched path.
- `mistral-revised_plan-r3.md`'s directory-keyed `kind: "container"` manifest row (§5.3).
- `gemini-revised_plan-r3.md`'s timestamp-ordered store as written.
- `claude-revised_plan-r3.md`'s `resolves` in V1, and its manifest-last spawn as a *load-bearing* requirement (demote to measured option).
- Any reading of `mistral-revised_plan-r3.md` §4.3 that uploads before verification — the degrade is deferral, never write-then-verify.
- A ping probe on the exit path (all four now agree; D-CLOUD-028's local-answer posture stands); a 99-slot product cap to mask the −99 defect; a second journal beside the frozen plan; SQLite anywhere near the sync tree (`[S32]` excludes it for a reason); a kid-mode resolver; a V1 undo control (the maintainer has settled this).

## 9. Which plan I would build from

**`gpt-revised_plan-r3.md` as the spine.** It is the most internally consistent, the most disciplined about what the corpus settles versus what the council merely agrees, and it carries three catches nobody else has — the harness defects, the owner/producer gap, and capture-independence — each of which I verified against the embedded sources rather than accepted. Its weakness is concreteness, which is exactly `claude-revised_plan-r3.md`'s strength.

Before building, lift into it: from `claude-revised_plan-r3.md` — the store layout and seq naming, the Gate-8 protocol, the two-pass escalation, the churn-trace gate, the spawn accounting, the −99 launch experiment, and the verdict-table retirement rows; from `mistral-revised_plan-r3.md` — the amendment-form and cost-table formats (formats only; fix the container row before lifting content); from `gemini-revised_plan-r3.md` — the unreviewed-head sentence. The merged store is §1.5. The register amendments should go up in `mistral-revised_plan-r3.md`'s inline form with `gpt-revised_plan-r3.md` §9.4's content and the explicit note that bisync's demotion and queue-and-badge are council recommendations needing the maintainer's word, not settled rows.

## 10. Where these plans changed my mind

My earlier revision held four positions this round's plans have corrected, and I concede each on the merits:

1. **The KEEP BOTH auto sub-choice.** All four refuse it; the maintainer's "get the user going as quickly as possible" settles it. The deterministic rule — device keeps `.state.auto`, the cloud copy takes a numbered slot, one sentence on the done page — is right.
2. **The per-path discard store.** My sidecar's fields were necessary but not sufficient: keyed by path it splits a game's history across slots, and it carried no clock-free ordering. `claude-revised_plan-r3.md`'s unit-key + seq and `gpt-revised_plan-r3.md`'s commit-order index are the correction; the amendment's reader requirement is what exposed the gap.
3. **The ops journal justified by `replaces` fidelity.** The maintainer's one-step clause and `mistral-revised_plan-r3.md`'s narrowing (deletion receipts and the pending-apply record are convergence machinery; ancestry fidelity is not) settle it. The journal shrinks to those two jobs.
4. **Cached manifest claims as overwrite permission on the exit path** — already conceded in my round-3 revision; the four r3 plans have now converged on the shape that replaces it (fresh candidate-scoped evidence, or defer the write), and `gpt-revised_plan-r3.md`'s sentence is the canonical statement: leave the unit pending rather than overwrite an unread head.

---

## `corpus.provenance.json`

```json
{
  "artifact": "kimi_peer_review-r4.md",
  "role": "council member, round-4 peer review of the four injected revised approaches",
  "corpus_mode": "verbatim embedded read-at-time corpus supplied by Council Facilitator council-facilitator@1.2.0",
  "source_count": 42,
  "manifest_read_timestamp_utc_as_supplied": "2026-09-05T17:32:51Z",
  "member_filesystem_access": false,
  "member_reread_files": false,
  "member_rehashed_sources": false,
  "member_executed_tests": false,
  "hash_basis": "sha256 values copied verbatim from the per-source headers; verified at embed time by the Facilitator; not independently recomputed",
  "citation_mapping": "S01 through S42 map in order to the parallel source_file_paths and source_file_hashes arrays",
  "injected_plans": [
    "claude-revised_plan-r3.md",
    "gemini-revised_plan-r3.md",
    "gpt-revised_plan-r3.md",
    "mistral-revised_plan-r3.md"
  ],
  "injected_plan_hashes_provided": false,
  "own_prior_revisions_embedded": false,
  "maintainer_amendments": {
    "source": "orchestrator brief embedded in this prompt",
    "applied_as_authoritative": true,
    "content": [
      "reversibility is first-class; the depth that matters is one step back; edge cases inform but do not drive; failing closed on unexplained absence is still expected",
      "V1 retains the discarded copy on by default, bounded by a count, ships no undo control; the restore tool is separate and reuses the compare-and-choose surface; the V1 store must be readable by that future tool"
    ]
  },
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
    {"description": "kimi-revised_plan-r2.md, kimi-revised_plan-r3.md and kimi_peer_review-r3.md — my own prior artifacts, known here only through the four injected plans' references", "declared_path": null, "sha256": null},
    {"description": "GuiSaveState.cpp (delete hook for retirement records), SaveState.h / SaveStateRepository.h (default arguments), Paths.cpp, setsettings.sh, ES ProcessStartInfo (fd inheritance)", "declared_path": null, "sha256": null},
    {"description": "rclone 1.75.0 documentation or source for --backup-dir with copy, lsjson --files-from, --order-by ordering guarantees", "declared_path": null, "sha256": null},
    {"description": "docs/es-ui-style-guide.md; current issue bodies with the futro's edited acceptance criteria; any executed test result — none exists in the corpus", "declared_path": null, "sha256": null}
  ],
  "missing_source_policy": "No missing source paths, hashes, contents or execution results have been fabricated."
}
```