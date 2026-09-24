# Step 3 — Revised approach: one hidden home for earlier versions, made safe

**Author:** `kimi-analysis.md` (Step 1), revised after the Step 2 critiques in `claude_peer_review.md`, `gemini_peer_review.md`, `gpt_peer_review.md`, `mistral_peer_review.md`.

**Position in one paragraph.** I still endorse the delta's shape — one hidden store at `<SAVES_REMOTE>/.history/`, written only by the reconciler, retain-before-publish with a `reason`, bounded by count, age and size, one reader, `--backup-dir` retired. No row of `save-history-plan-delta.md` needs replacement. But my Step 1 claim that the delta weakens *only* the store's exclusion property was wrong: `gpt-analysis.md`'s concurrent-publisher sequence shows the delta's retain-before-publish, as I defended it, does not make every displaced version recoverable, and my "fails safe" analysis of the head-check race was simply incorrect. The revised delta below keeps the shape and adds the closures: retain-on-fetch-when-absent-from-store, pub-chain ordering instead of clock ordering, a stated priority among the bounds, a count scope that survives auto-state churn, an honest migration of both legacy set-asides, and explicit register refinements by ID. Everything unmeasured is marked, with the experiment that settles it.

---

## 1. What I concede

**1.1 The TOCTOU race does not fail safe. (Refuted by `gpt-analysis.md` §2; confirmed by `claude_peer_review.md` §4 and `gpt_peer_review.md`.)** My Step 1 §2.2 claimed the window between R5's fresh-head check and the publish "fails safe: an extra entry, never a missing one." The counterexample: devices A and B both agree `H0`; both retain `H0`; both pass the head check; A publishes `HA` and advances agreement; B publishes `HB` over `HA` and advances agreement. R5 is check-then-write (`issues/22.md` R5: "push only when the head equals agreement") — nothing makes the write conditional, and `L_T` is a device-local flock (`/var/run/cloud_sync.lock`, R6), not a cross-device mutex. `HA` was the cloud head and is now nowhere in the cloud. Worse, A's next pass classifies `L = A = HA`, `C = HB` as *the cloud changed* and fetches `HB` over `HA` — and #22's negative scope ("no preimages of one-way fetches (C1)") means nothing retains `HA`. A version that was the cloud head is lost. I withdraw §2.2 entirely.

**1.2 The count cap is not clock-independent. (Refuted by `claude_peer_review.md` §4.)** My §2.7 claimed the count and size caps "carry the load" regardless of clocks. Under R9, "newest N" is ordered by `<seq>`, which begins with `decided_at` from the device clock; the shipped pruner likewise sorts stamp names (`repo/code/cloud_backup-set-aside-excerpt.md`). A device with a 1970 clock writes entries every other device treats as oldest — for the count cap as well as the age cap. Withdrawn.

**1.3 My clock mitigation rests on an unproven timestamp. (`claude_peer_review.md` §7.4, `gpt_peer_review.md`.)** I proposed ordering by `max(decided_at, server-side modtime)`. rclone preserves the *source* modtime on `copyto` where the backend supports it, so a retained member likely carries the original save's write time, not the retain time. That is a hypothesis about rclone, not a corpus fact — and it sinks the mitigation. Withdrawn as a mechanism; the experiment is named in §8.

**1.4 Legacy imports cannot be synthesised as `reason: replaced`. (Refuted by `gpt-analysis.md` §4; `claude_peer_review.md` §4.)** The shipped set-aside holds sync-mode *deletions* as well as replacements ("anything replaced (or, in sync mode, removed)" — `repo/code/cloud_backup-set-aside-excerpt.md`). Stamping every import `replaced` fabricates a fact. Imports get an honest `legacy` reason (unknown event, unknown producer, untrusted time).

**1.5 "No rows reopened outright" was wrong. (`gpt_peer_review.md`.)** Copy-instead-of-move refines D-CLOUD-041's mechanics; the exit-time heal fetch refines D-CLOUD-046/R5; `reason: deleted` and retiring `-replaced/` contradict D-CLOUD-047's text while the delta calls it unchanged. §5 states each refinement by ID.

**1.6 The uniform-byte hash shortcut was overclaimed. (`gpt_peer_review.md`.)** My §1.7.4 proposed detecting "all one byte" from the listing hash "with no round trips." The listing hash is provider-specific (Dropbox's content hash, S3's ETag) and mapped to sha256 via manifests (R4); a newly corrupted external head may have no mapping. Demoted to an optional optimisation, gated on per-backend hash-correspondence validation; the default is inspecting verified bytes.

**1.7 Smaller corrections.** The headline count ("seven outright, two with amendments") did not match my own table (four amended rows) — fixed. My MATCH-direction assumption is not established by the corpus (`gpt_peer_review.md`; the menu map shows only that MATCH is "the only action that deletes", `repo/docs/es-menu-map.md`) — the retention rule below is direction-neutral and MATCH's call path is a corpus gap. My rejection of non-save payload names was too categorical (`gpt_peer_review.md`) — original paths live in `record.json`, so payload naming is a backward-compatibility choice, not a hard constraint. My standing fold is repair, not a no-loss guarantee (`gpt_peer_review.md`) — the residual is stated in §4.3.

`gemini_peer_review.md` carried no dedicated section on my analysis; its cross-cutting checks credited my server-side-copy inference and the `--delete-excluded` catch, and I adopt its intentional-erasure loop fix in §3, row 7.

---

## 2. What I defend

**2.1 The one structural weakening: by construction → by rule.** (`claude_peer_review.md` §4: "the single best framing in the set"; `mistral_peer_review.md`: "the most elegant solution in the set" for its closure.) R9's sibling store was "outside the allowlist by construction" (`issues/22.md` R9). Inside `Saves/`, exclusion survives only as a rule — and the shipped rules file (`repo/code/cloud_sync-rules.txt`) includes `+ /**/*.srm`, `+ /**/*.state*` at any depth, while store members sit "at their basenames" (R9). Whether `**` crosses a dot-prefixed component is a labelled hypothesis (§8, experiment E1) — but the safe design must assume it does, because D-CLOUD-088 keeps user-named filter files alive and D-CLOUD-037 names "a delete made on a device still on the old firmware" as a real cause. An old-image `sync`-mode backup would move `.history/` members into `-replaced/<stamp>/.history/...`, shredding bytes and orphaning records — the D-CLOUD-014 incident re-entering through the new folder.

**2.2 The self-healing fold.** The migration's fold of `Saves-replaced/` is a *standing* full-pass behaviour, path-aware: anything landing at `-replaced/<stamp>/.history/<unit>/<seq>/...` folds back to its original entry. The mechanism that threatens the store becomes its repair, and it upgrades an old-image device's one-run set-aside in place. `gpt_peer_review.md` is right that this is not a no-loss guarantee (two consecutive old-image `sync` runs with no new-image pass between can still destroy a stamp); §4.3 states the residual and the two fleet measures that shrink it.

**2.3 The same-device sequence collision — kept, right-sized.** `gpt_peer_review.md` called this my strongest finding; `mistral_peer_review.md` called it overstated. Both are half-right. The benign case (two retains of the same version colliding) is absorbed by dedupe. The case that matters is two *different* versions of one unit retained by the same device within one timestamp tick — an orphaned rclone finishing an old retain beside a new run (the D-CLOUD-093 trade) — producing one entry directory mixing members of two versions: an incoherent entry, exactly what R9's "finalized, coherent ... only" invariant forbids. The fix costs one field: `<seq>` gains the run id the reconciler already mints (R10's `<run-id>`), stable across retries. Not a headline; cheap hardening, kept.

**2.4 No pruning on the exit path.** The shipped scripts already skip the remote prune on `--recent` runs as "a remote round trip the game-exit sync should not pay" (`repo/code/cloud_backup-set-aside-excerpt.md`). The same rule applies to the store: pruning is a full-pass job under `L_T`, never on the exit card. Confirmed by `claude_peer_review.md`.

**2.5 The rule belongs in the shipped rules file.** D-CLOUD-088 now forces the shipped rules onto every run that doesn't name its own filter file, so the shipped file is the one place the exclusion reaches the fleet. `claude_peer_review.md` §7.5 extends this correctly: a user-*edited* rules file may not receive the new line, and whether `cloud_sync_helper` rewrites it on upgrade is a corpus gap. I adopt that as a requirement (§3, row 4).

**2.6 `--delete-excluded` must be audited, not assumed absent.** `gemini_peer_review.md` confirms no other analysis caught this: if any shipped command or user config passes `--delete-excluded`, the exclusion rule itself becomes a deletion instruction against the store. The full scripts are not embedded (corpus gap); the audit and the VM test are in §8.

---

## 3. The revised delta, row by row

Verdicts: **endorse** = apply as written; **amend** = apply with the stated changes; no row is replaced.

### Row 1 — Store location: `<SAVES_REMOTE>/.history/<unit>/<seq>/`, `reason`, READMEs — **ENDORSE, amended**

The location, the `reason: discarded | replaced | deleted | suspect` field, and the two READMEs stand (D-CLOUD-095). Amendments:

- **`<seq>` = `<decided_at, UTC compact>-<deciding device id>-<run id>`** (§2.3). Collision-resistant, stable across retries.
- **`record.json` gains `reason: legacy`** for migrated entries, with `producer`, `decided_at` and the event marked *unknown* where the legacy stamp cannot supply them (§1.4). The importer's identity is recorded separately from the producer.
- **The root `README.md` names both hidden folders** — `.history/` (must never sync) and `savestates/.rocknix/` (the manifests, which *must* sync, D-CLOUD-031/045) — and says the store is *kept for recovery*; it must not promise a menu restore before #25 ships (D-CLOUD-033, D-CLOUD-077's no-lying rule; credited to `claude-analysis.md` via `gpt_peer_review.md`). I reject `mistral_peer_review.md`'s proposed `- /savestates/.rocknix/**` exclusion: manifests reach the cloud as decided transfers (D-CLOUD-045) and other devices read them; excluding them would break the plan of record.
- **The README is written only after the destination is validated** — a housekeeping write must not create a misspelled root and defeat D-CLOUD-085/091/092's missing-folder safeguards (`gpt_peer_review.md`, failure case 6).
- **Mass absence is judged on the live save set, not the raw listing.** A cloud root holding only `README.md`, `.history/` and manifests must still trip R4's mass-absence refusal; otherwise the control files mask it and produce a hundred questions (`gpt-analysis.md`; extended to manifests by `gpt_peer_review.md`).

### Row 2 — Retain-before-publish for every overwriting publish — **ENDORSE, amended (this is the foundation)**

The core stands: every publish that overwrites a cloud copy retains it first, decided or not. Amendments:

- **Transaction shape: bytes first, record last, the record is the commit point.** Members are copied and verified (sha256 of the retained bytes, or an established backend-hash correspondence — never size+mtime, R4, D-CLOUD-030); then `record.json` is written and positively verified; only then does the publish touch the head. An entry without a valid record is an orphan, invisible to #25, swept on full passes (not exit passes) once older than the maximum bounded retain duration; a record whose members are missing reads as *unavailable*, never as a restorable version. (All four analyses converged here; `mistral_peer_review.md` states the fail-closed requirement precisely.)
- **Dedupe against the newest entry** (my §1.2.3, kept): if the newest store record's sha256 set equals the version about to be displaced, skip the retain. Absorbs retry duplicates and the double-`H0` from the race.
- **Copy, never move, for the cloud-side loser** (shared with `gpt-analysis.md`; both of us are corrected by `claude_peer_review.md` on cost). A server-side *move* opens a window in which the head is absent — the unexplained-absence question D-CLOUD-037 makes the player answer. Cost, named per D-CLOUD-034: on backends with server-side copy, copy and move cost the same; on SFTP/SMB a rename is cheap and a copy streams through the device. The safeguard is worth the streamed case, and the admission ceiling below absorbs it. This refines D-CLOUD-041's mechanics (§5).
- **Retain-on-fetch-when-absent-from-store** (adopted from `gpt-analysis.md`'s row-3 rule; `claude_peer_review.md` §6.1 endorses it as the council's closure). Before a one-way fetch installs over a local version, retain that local version if its hash is not already in the store. This closes §1.1: A, about to fetch `HB` over `HA`, finds no `HA` in the store and uploads it first. Cost: a store listing the fetch already needs, plus one small upload in the rare race. This reopens #22's negative scope ("no preimages of one-way fetches (C1)") — narrowly, and by ID (§5). **The residual, stated plainly:** `HA` is unrecoverable *from the cloud alone* in the window between B's overwrite and A's next sync, and lost entirely if A never syncs again. We require the store to be *recoverable*, not the head to be *serializable*; serializability would mean a conditional-put protocol, reopening D-CLOUD-052 and the "no protected-publication protocol" negative scope, and D-CLOUD-032's test ("whether a wrong outcome is reversible") does not require it. I considered and rejected that reopening.
- **The retain and its publish defer as a pair, and the admission ceiling counts retain bytes** (`mistral_peer_review.md` §2.4, adopted). On backends without server-side copy the retain streams 2S through the handheld; a unit that would clear the ceiling for the publish alone must not stall the exit sync on the retain — both defer to the next full pass together. A publish never goes out ahead of its retain.
- **Interrupt points** (commission Q2): kill before the retain → nothing changed. Kill during the retain → orphan members, head untouched, swept later. Kill after the record, before the publish → the entry stands; `pending-publish.json` completes the publish (R2); dedupe prevents a second retain. Kill during the publish → A8's hold; no device installs the mixed unit. Kill after the publish before agreement advances → `uploaded-unverified`, nothing advances, the retained entry stands. Link loss anywhere is bounded by D-CLOUD-075's timeouts and reports partial success as partial (D-CLOUD-077).

### Row 3 — Retiring `--backup-dir` — **ENDORSE**

Retired once the reconciler is the only writer (R1); unchanged until then (D-CLOUD-097: no interim). D-CLOUD-014's *principle* — a backup never deletes by default — stands and is strengthened (every overwritten version is retained with metadata, not one run of anonymous bytes); its *mechanism* is superseded. The migration is §4.

### Row 4 — Allowlist: `- /.history/**` ahead of every include; `.snapshots` rule dropped — **ENDORSE, amended**

- **Add `- /README.md` beside it** (`mistral_peer_review.md` §2.1, adopted). The trailing `- /**` already excludes the README, but a user edit that removes the catch-all would pull it down to devices; one line closes it.
- **Ship the exclusion one image ahead of the store where possible** (credited to `claude-analysis.md`), **and** `cloud_sync_helper` must migrate user-edited rules files on upgrade (§2.5; whether it does today is a corpus gap), **and** the standing fold (§4.3) repairs what any remaining old image damages. Release notes alone are not a safety barrier (`gpt_peer_review.md`).
- **Audit every shipped command and the docs for `--delete-excluded`** (§2.6). Corpus gap: the full scripts.
- The `.snapshots` rule stays dropped (the delta as written; `gemini_peer_review.md` confirms the guard has no writer).

### Row 5 — Settings nested behind one row under SAVE MANAGEMENT — **ENDORSE, amended**

- The nesting stands (D-UI-039). The entering row's label must carry a verb per `repo/rules/es-native-ui-excerpt.md` ("a row that opens a page with more than one action is a submenu whose label carries the verb") — e.g. MANAGE SAVE HISTORY; the exact words are the maintainer's. `repo/docs/es-menu-map.md` updates in the same change (D-UI-039).
- **The switch and count are per-device settings on a shared store** (`claude_peer_review.md` §7.2, adopted as a question with a recommendation). Device A at count 3 would otherwise prune entries device B at 9 expects; A with the switch off would leave gaps in a history B relies on. Recommended cheap form: each device publishes its effective count in its manifest (`savestates/.rocknix/manifest-<device-id>.json`, already read on every pass, D-CLOUD-045); pruners apply the **maximum** across manifests; a device's OFF suppresses its own routine retains only when no manifest requires retention. One field plus a `max()` — the cheapest sufficient form (D-CLOUD-034). Put to the maintainer against D-CLOUD-096 (§5).

### Row 6 — #25 reads one store, the `reason` as the label — **ENDORSE, amended**

- Legacy imports appear under their own honest label, never synthesised as REPLACED BY A SYNC (§1.4; D-UI-022's residual is thereby honoured without lying).
- **A restore stages and verifies its selected candidate before touching any live file**; if pruning wins the race meanwhile, the restore leaves the current save unchanged and says so (`gpt_peer_review.md`, failure case 3).
- **A decided republication is never classified suspect** (new `pub`, D-CLOUD-047) — otherwise a player who restores a uniform-byte version through #25 is re-healed on the next pass (`gpt-analysis.md`).
- V1 wording: the store is kept for recovery; the restore control arrives with #25 (D-CLOUD-033).

### Row 7 — The `suspect` class and auto-heal (D-CLOUD-100) — **ENDORSE, narrowly amended**

- **Zero-length heals as decided.** For **uniform-at-full-size**, heal but the once-message must not assert damage as fact and must name the path back — an intentional in-game reset can produce a uniform file, and "was damaged" would then be a lie (D-CLOUD-077). This is the narrow amendment `claude_peer_review.md` §3 drew from `gpt-analysis.md`'s argument; I adopt it over my original "recoverable by construction" dismissal, which was true of the bytes and silent on the message.
- **The heal's fetch needs an explicit exit-path refinement** (my §1.7.3, merged with `gpt-analysis.md`'s D-CLOUD-046 rider per `claude_peer_review.md`): R5's exit path is "No fetches", and D-CLOUD-100 says the good copy "is kept and restored". Refinement: **one bounded fetch per suspect unit on the exit pass**, riding the exit card — where D-CLOUD-098 permits spending the player's attention — with cancellation leaving a complete unit before any launch (A7). Stated as a register refinement in §5.
- **Both-suspect is not "nothing worth protecting"** (`gpt_peer_review.md`, correcting me): the heuristic is not a format validator. If both sides classify suspect, or no verified good counterpart exists, there is no auto-heal: retain both, hold the unit, tell the player once, honestly. A false recovery message is worse than none (D-CLOUD-077).
- **The intentional-erasure loop** (`gemini_peer_review.md` §4, adopted): a first suspect pattern heals; a *second* identical suspect pattern for the same unit within a short window becomes a wizard question, not another heal — the player has told us twice. One small classifier state.
- **History-OFF policy table** (`gpt_peer_review.md`, failure case 1, adopted): the switch governs routine overwrite history and wizard losers (D-CLOUD-032/036, done page says so when off). The suspect set-aside is part of the heal itself — D-CLOUD-100 requires it and the player is told — so it is **not** governed by the switch. Flagged to the maintainer as a semantics confirmation, not a reopening.
- Every heal writes an audit line before the install (`mistral-analysis.md`'s sound point, via `claude_peer_review.md`; D-CLOUD-027/078).
- The hash-shortcut optimisation survives only as a gated experiment (§1.6, §8).

### Row 8 — Save states, auto-states included (D-CLOUD-099) — **ENDORSE, with the count-scope amendment**

No reopening of D-CLOUD-099: `mistral-analysis.md`'s reopening fails on arithmetic (≈700 KB is ~0.3 % of 256 MiB) and on unit scope, and does not engage the maintainer's reasoning. But the maintainer's own headline case — the accidental overwrite of a manual slot — is defeated if auto-state churn shares the manual slot's retention bucket (`claude_peer_review.md` §7.1; the per-file keying is `claude-analysis.md`'s fix, with `gpt_peer_review.md`'s caveats). Amendment:

- **The count applies per (unit, member path), not per unit.** `.state.auto` history and `.state1` history are separate buckets; three exits of auto-state churn cannot evict slot 1's preimage. An entry's members (state + PNG, multi-file saves) live and prune **together** — entries, never files, are the prune granularity. The bucket is a pruning scope only; restore semantics stay record-driven (slot-at-discard and sha256 are in the record), so D-CLOUD-030's "paths and slots are attributes" is honoured. The unit table is a corpus gap (#21 not embedded); the bucket key is settled when it is read. Fixture: overwrite slot 1, renumber, exit N times, restore slot 1's preimage from a second device.
- **Protect the newest deliberate conflict loser** (`gpt-analysis.md` §1, "the best defence of D-CLOUD-032 in the whole set" — `claude_peer_review.md`): per bucket, keep the newest N routine entries *plus* the newest `reason: discarded` entry. D-CLOUD-032's primary use case — "one step back" from a mis-pressed decision — must not degrade from three decisions to three exits.

### Row 9 — Public docs show the layout — **ENDORSE**

The cloud-sync page shows the layout table with `.history/`, `savestates/.rocknix/`, and the README text (documentation-accuracy gate).

### The bounds (D-CLOUD-096) — **AMENDED by refinement**

The corpus states four bounds with no ordering, and they cannot all be unconditional (`gpt-analysis.md` §1's arithmetic: enough protected only-copies exceed any total cap). Priority order, highest first:

1. **Never a game's only copy** — unconditional; the size and age caps yield to it.
2. **Count** per (unit, member path) — the player's setting (fleet-max, row 5).
3. **Age, 90 days** — input is the record's `decided_at` *with clock trust*: a device whose clock is untrusted (`clock_synced: false` exists in #23's metadata model) does not prune by age at all; count and size still bound. I keep the cap rather than dropping it (`mistral_peer_review.md` §6) — D-CLOUD-096 is binding and a same-day maintainer call; the trust gate is the cheap sufficient form.
4. **Size, 256 MiB total** — prunes oldest non-protected first and stops at protected copies; if protected copies alone exceed the cap, they stay and the docs say so. No player question (a prompt is a failure mode).

Victim selection for count and size is by **publication chain, not time** (`claude_peer_review.md` §4, adopted): each record carries the `pub` of the version it holds and the `pub` that displaced it (D-CLOUD-045's `pub`, D-CLOUD-027's `replaces`); "oldest" walks the chain back from the current head; a chain break (foreign publisher) falls back to record time, marked untrusted. This removes the device clock from the count cap entirely (§1.2, §1.3).

**Questions to the maintainer against D-CLOUD-096** (`claude_peer_review.md` §7.3, adopted): does "never the only copy of a game" cover a *decided* REMOVE EVERYWHERE? My recommendation: no — a decided deletion's retained copy ages out at 90 days like any other entry; the clause protects games with a live head somewhere. Otherwise `reason: deleted` entries are immortal and exempt from every cap.

---

## 4. Migration (commission Q4)

Rule: read both, write the new one; no prompts; no earlier version lost.

**4.1 Cloud `Saves-replaced/`.** First new-image full pass under `L_T`: for each stamp folder, copy each artifact into `.history/` under its unit (from the path beneath the stamp), verify bytes, write `record.json` with `reason: legacy` (event unknown — a stamp may hold deletions, §1.4), producer unknown, stamp time marked untrusted (the shipped naming is `date +%Y_%m_%d-%H%M%S`, local time), importer recorded; verify the record; only then remove the source artifact. **Copy–verify–record–verify–remove, never move-first** (`gpt_peer_review.md`). A stamp is a run, not a unit, and may hold a partial multi-file save: import what exists, mark the entry *incomplete*, and never offer an incoherent combination as a restorable unit (`gpt_peer_review.md`, failure case 4). A stamp still changing under a running old image is left for the next pass.

**4.2 Local `.cache/cloud_sync/replaced/`.** Same fold, upward: upload each artifact into `.history/` with `reason: legacy`, verify the cloud entry intact, *then* remove the local copy (`gpt_peer_review.md`: "originally a copy" is provenance, not current redundancy). This folder can hold the only copy of a newer local save an old restore overwrote (`repo/code/cloud_restore-set-aside-excerpt.md`'s own case); ignoring it — or leaving it as a second home one device can read — violates both the commission's no-loss rule and D-CLOUD-036's consistency argument.

**4.3 The standing fold.** Thereafter, every full pass folds anything under `Saves-replaced/` — including `-replaced/<stamp>/.history/...` written by an old image's attack on the store — back to its original entry (§2.2). Residual, stated honestly: two consecutive old-image `sync`-mode runs with no new-image pass between them can destroy a stamp before any fold runs. The early rule shipment and the rules-file migration (row 4) shrink the fleet window; the fold converts permanent loss into a bounded race.

**4.4 `-discarded/`** never shipped — nothing to migrate. **Layout migrations** (D-CLOUD-089's TIDY UP) must carry `.history/` (my §2.9, kept).

---

## 5. Register changes, stated explicitly

**Refinements (new rows citing old ones):**

1. **D-CLOUD-042** — the delta must say what is true: D-CLOUD-095 supersedes its store-location clause; its split-root refusal stands untouched. (Citation fix, not a reopening; `gpt-analysis.md`, `claude_peer_review.md`.)
2. **D-CLOUD-047** — refined: propagated deletions **are** retained, `reason: deleted`; compactions remain unretained (the bytes survive at the surviving slot, D-CLOUD-030); `-replaced/` is no longer any event's record. The delta cannot call 047 unchanged while replacing its mechanism.
3. **D-CLOUD-041** — mechanics refined: the cloud loser is preserved by server-side **copy** plus verification, not a move; cost named per backend class (row 2).
4. **D-CLOUD-046 / R5** — refined: the exit path gains (a) bounded retain transfers, counted in the admission ceiling, deferring as a pair with their publish, and (b) one bounded fetch per suspect unit for auto-heal. The "nothing changed ≈ 5 s" contract and the zero-spawn idle exit stand.
5. **D-CLOUD-100** — refined: uniform-at-full-size heals with honest wording (D-CLOUD-077); a decided republication is never suspect; both-suspect holds as a question; the repeat-suspect window escalates to the wizard.
6. **#22 negative scope, C1** — reopened narrowly: preimages of one-way fetches are retained **only** when the displaced local version's hash is absent from the store (row 2). Argument: without it, the delta's own promise — every overwritten version recoverable — is false under ordinary two-device concurrency (§1.1).

**Questions to the maintainer (not reopenings):** D-CLOUD-096 — bounds priority (recommended: only-copy > count > age > size), decided-deletion aging (recommended: ages out normally), fleet-shared setting semantics (recommended: manifest-published, prune to max), count bucket scope (recommended: per member path, settled with #21's unit table).

**Explicitly not reopened:** D-CLOUD-052 (no conditional-put transport; recoverable-not-serializable accepted, §3 row 2), D-CLOUD-099 (auto-states stay; the fix is bucket scope), D-CLOUD-097 (no interim), D-CLOUD-032 (honoured by protecting the newest discarded entry), D-CLOUD-014's principle, D-CLOUD-036's count range and default. Also: when #22's text is amended, its R6 launch-refusal and R10 exit-code language must be swept for the superseded phrasings `gpt-analysis.md` caught (D-CLOUD-076 cancels; D-CLOUD-074's 75/69).

---

## 6. Time to play (commission Q3; D-CLOUD-098, #135)

**Launch path: zero added round trips.** Retain-before-publish runs on publish paths (exit sync, full passes), never between the press and the frame; a launch during an automatic sync cancels it, the kill completing before the game starts (D-CLOUD-076). `repo/rules/time-to-play.md` is satisfied: rigour is spent where the player is not waiting.

**Exit sync, operation ledger** (`gpt_peer_review.md`, adopted — all figures *estimates*, to be replaced by #135's VM measurements):

| Step | Hashed backend, server-side copy | Hashless / streamed (SFTP, SMB) |
|---|---|---|
| Fresh head evidence | already in R5 (1 listing) | same |
| Retain: `copyto` per changed member | +1 round trip each, no payload through device; est. 0.3–1.0 s | streams 2S through the device; est. ~4.2 s payload for 5 MiB at 20 Mbit/s, plus latency |
| Verify retained bytes | folded into the transfer's post-check where it fails closed | capped re-fetch (R4's rule) |
| `record.json` write + verify | +1–2 round trips; est. 0.3–1.5 s | same |
| Publish + verify + agreement | as planned (D-CLOUD-046's 3–4 spawns) | as planned |
| Housekeeping (prune, sweep, fold) | full passes only, never exit | same |

One changed save on a hashed backend: est. +1–3 s on the exit card. On streamed backends, large units defer more often — the honest price, named on the card (D-CLOUD-077). The idle exit spawns nothing; dedupe skips redundant retains. **Measurement warning adopted from `gpt_peer_review.md`:** longer automatic runs raise cancellation probability, so #135's cell must record completion rates alongside latency — a fast launch achieved by cancelling every backup is not protection.

---

## 7. Load-bearing vs optional

**Load-bearing** (get these wrong and a player loses a save, or waits for us): the row-2 transaction shape (bytes-first-record-last, verified before replace); retain-on-fetch-when-absent-from-store; copy-not-move; deferral as a pair with the ceiling counting retain bytes; the allowlist exclusion + rules-file fleet migration + `--delete-excluded` audit; mass-absence judged on live units; migration as copy–verify–record–verify–remove over *both* set-asides; never-only-copy outranking the size cap; restore staging before any live write.

**Ships with the store** (correctness of victim selection and display, not safety): pub-chain ordering; count-per-(unit, member-path) buckets; protect-newest-discarded; run-id in `<seq>`; the standing fold; README wording.

**Can follow later:** the uniform-byte hash shortcut (gated optimisation); the verb-label wordsmithing; docs polish; the repeat-suspect escalation window's exact length.

---

## 8. Unmeasured — hypotheses and the experiments that settle them

All on the GENERIC_X64 VM pair and #133's self-hosted backends (D-QA-007/017); nothing touches a person's device or cloud (D-QA-015).

- **E1 (dot-component matching):** seed a cloud with `Saves/README.md` and `.history/<unit>/<seq>/` members; run the *shipped* image's backup (sync mode), restore, and MATCH. Expected result written as the hazard: members are moved to `-replaced/`, records orphaned. Then the patched image must pass. (My §2.5, with `gpt_peer_review.md`'s expected-failure baseline.)
- **E2 (`--delete-excluded`):** grep the full scripts (corpus gap); then a VM run with the flag forced, asserting the store survives. Whether it bypasses `--backup-dir` is unestablished — test, don't assert.
- **E3 (backend capabilities):** server-side copy, hash availability, and **modtime preservation on `copyto`** measured per #133 backend (§1.3); no age or ordering rule may lean on modtime until this lands.
- **E4 (concurrent publishers, distinct device ids):** `gpt-analysis.md`'s barrier sequence through A's subsequent fetch; assert `HA` reaches the store via retain-on-fetch. (Cloned-id case is R7/A11's, tested separately.)
- **E5 (orphan rename):** pause a restore's child before a local rename, kill the lock-owning parent, launch a game, release the child (D-CLOUD-093's trade; `gpt_peer_review.md` failure case 7, `claude_peer_review.md` §3). Also: a server-side operation completing after client death.
- **E6 (count scope):** overwrite slot 1, renumber, N auto-state exits, restore slot 1's preimage from a second device (`claude_peer_review.md` §7.1).
- **E7 (capture walker):** seed a device with a downloaded `.history/` tree; run `cloud_capture --full`; assert nothing under it is claimed as this device's saves (`claude_peer_review.md` §7.6; #21 not embedded — corpus gap).
- **E8 (time to play):** #135's `time-to-play` cell with bandwidth caps, per backend class, reporting latency distributions *and* sync completion rates.

**Corpus gaps surfaced:** the full `cloud_backup`/`cloud_restore` scripts and MATCH's call path; #21 (unit table, capture-stage lifetime); `docs/save-manifest-schema.md`, `docs/conflict-wizard-ia.md`, `engineering-practices.md`, `upgrade-and-install.md`; `cloud_sync_helper`'s handling of a user-edited rules file; all backend capability measurements.

---

## 9. A simpler shape?

None exists that meets the maintainer's constraints. Two siblings (A) is what D-CLOUD-095 retired; suffixed copies beside each save (C) clutter the visible tree, carry no metadata, and need filter machinery to survive restores. The delta's shape — one hidden folder, declared in a README, one vocabulary, one reader — is the simplest that fits. Everything above is about making that shape *safe*, not replacing it.

---

## `corpus.provenance.json`

```json
{
  "facilitator": "council-facilitator@1.2.0",
  "access_mode": "embedded read-at-time corpus; no filesystem access; hashes are the Facilitator's embed-time values, not recomputed by this member",
  "manifest": "research/council-runs/2026-09-11-save-history-one-home/_prompts/step3-source-manifest.json",
  "manifest_read_timestamp_utc": "2026-09-11T19:31:42Z",
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
  "corpus_gaps_surfaced": [
    "full cloud_backup / cloud_restore scripts and the MATCH call path (--delete-excluded audit, deletion direction)",
    "issues/21.md (capture contract, unit table, stage lifetime) — needed for the count-bucket key and the capture-walker question",
    "docs/save-manifest-schema.md, docs/conflict-wizard-ia.md, engineering-practices.md, upgrade-and-install.md (referenced, not embedded)",
    "cloud_sync_helper's handling of a user-edited cloud_sync-rules.txt on upgrade",
    "backend capability evidence (server-side copy, hash correspondence, modtime preservation on copyto) — to be produced on the #133 matrix"
  ],
  "fabrication_statement": "No path, hash or content has been invented for unembedded material. Peer artifacts are cited by their injected filenames only (claude_peer_review.md, gemini_peer_review.md, gpt_peer_review.md, mistral_peer_review.md, and the Step 1 analyses they name); no hashes were supplied for them and none are claimed."
}
```