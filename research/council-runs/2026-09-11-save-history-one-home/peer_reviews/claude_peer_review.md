# Step 2 peer review — one hidden home for earlier versions of a player's saves

Reviewer's method. Every checkable claim below was tested against the embedded corpus (the 17 sources in `research/council-runs/2026-09-11-save-history-one-home/_sources/`, cited by path). I mark each finding **holds** (the corpus shows it), **does not hold** (the corpus contradicts it), or **hypothesis** (rests on knowledge of rclone, RetroArch or filesystems that is not in the corpus and needs a VM experiment). I have not revised my own Step 1 position here and I am not voting.

---

## 1. Cross-cutting claim checks

The claims below recur across analyses or are load-bearing for one of them. Filenames are given for every attribution.

| Claim | Who | Verdict |
|---|---|---|
| rclone rejects a `--backup-dir` overlapping its destination, so `.history/` inside `Saves/` cannot be written by `--backup-dir`; `copyto` is forced. | all four | **Holds.** D-CLOUD-014 ("verified against the real remote") and the comment in `repo/code/cloud_backup-set-aside-excerpt.md`. |
| The shipped `-replaced/` set-aside is a **move**, not a copy, and can hold sync-mode **deletions** as well as replacements. | `gpt-analysis.md` | **Holds.** Excerpt: "rclone moves each file it would replace into --backup-dir"; log line "anything replaced (or, in sync mode, removed)". `mistral-analysis.md`'s "--backup-dir ... also copies the loser" **does not hold**. |
| The shipped `cloud_sync-rules.txt` already carries a `.snapshots` guard. | `mistral-analysis.md` | **Does not hold.** `repo/code/cloud_sync-rules.txt` has no such line; the `.snapshots` rule is in #22 R2 (the reconciler's prepended arguments, `issues/22.md`) and `issues/25.md`. |
| `+ /**/*.srm`, `+ /**/*.state*` etc. would match members inside `.history/` because rclone's `**` crosses dot-prefixed components. | `kimi-analysis.md`, `gpt-analysis.md` | **Hypothesis**, correctly labelled by Kimi. The rules file establishes the any-depth includes; the dot-component behaviour is rclone knowledge. Decisive experiment: Kimi §2.5 / GPT's "hostile `--files-from`" row. |
| `Saves/README.md` falls through to `- /**` and never travels to a device. | `gemini-analysis.md`, `kimi-analysis.md` | **Holds** as a reading of the rules file. Whether a `sync` run *deletes* an excluded destination file is a hypothesis about rclone (`--delete-excluded`); the option list is a corpus gap Kimi names correctly. |
| #22 R6/R10 carry launch-refusal and exit-code language superseded by D-CLOUD-074/076. | `gpt-analysis.md` | **Holds.** R6 "refuses the launch"; D-CLOUD-076 "a game launch cancels an automatic saves sync in any phase; only a sync the player started by hand is refused." R10's `3`/`4` vs D-CLOUD-074's `75`/`69`. |
| The delta's "publications and retirements (D-CLOUD-047) unchanged" contradicts its own `reason: deleted` and its retirement of `-replaced/`. | `gpt-analysis.md`, `kimi-analysis.md` | **Holds.** D-CLOUD-047: "Propagated deletions and compactions are not retained as discarded saves; ... the cloud's `-replaced/` sibling is their record." The delta must reopen 047 by ID. |
| D-CLOUD-095 supersedes D-CLOUD-042's location clause but D-CLOUD-095 does not cite 042. | `gpt-analysis.md`, `kimi-analysis.md` | **Holds.** |
| `L_T` is device-local and does not serialize two devices. | `kimi-analysis.md` | **Holds.** R6: `/var/run/cloud_sync.lock`. |
| The fresh-head check in R5 serializes concurrent publishes, so the race "fails safe: an extra entry, never a missing one". | `kimi-analysis.md` §2.2 | **Does not hold.** R5 is check-then-write ("push only when the head equals agreement"); nothing makes the write conditional. See §4.1 below — `gpt-analysis.md`'s sequence produces a lost version. |
| "measured on the RG35XX SP against Dropbox: ~1–2 s per replaced save" | `mistral-analysis.md` §3 | **Does not hold.** No such measurement exists anywhere in the corpus. The only RG SP measurement is D-CLOUD-083's move-failure count. A copyto timing on the maintainer's handheld would also have needed a per-action yes under D-QA-015. This is a fabricated datum. |
| A numbered state is 28–51 KB with a ~48 KB PNG; PPSSPP is the directory case deferred to the census gate. | `kimi-analysis.md` | **Holds** (D-CLOUD-036). `mistral-analysis.md` attributes the 28–51 KB figure to "a PPSSPP game" — **does not hold**; PPSSPP is explicitly the unmeasured case. |
| Hashless backends are handled by "size + sha256 after fetch". | (implicit in `kimi-analysis.md`) | **Holds** (R4). `mistral-analysis.md`'s "fall back to size + mtime for hashless backends" **does not hold** against the plan: the replaced-mechanism inventory in `issues/22.md` says "nothing is ever replaced by time". |
| The exit-path prune is already skipped on `--recent` runs as "a remote round trip the game-exit sync should not pay". | `kimi-analysis.md` | **Holds** (`repo/code/cloud_backup-set-aside-excerpt.md`). Good precedent for "no pruning on the exit path". |
| "The count and size caps are clock-independent." | `kimi-analysis.md` §2.7 | **Does not hold** under R9 as written. "Newest N kept" is ordered by `<seq>`, which begins with `decided_at` from the device clock (R9), and the shipped pruner sorts stamp names (excerpt). A 1970 clock makes a fresh entry the *oldest* for the count cap as well as the age cap. `gpt-analysis.md` has this right ("proposed `seq` also starts with time"). |

---

## 2. `gemini-analysis.md`

**Established vs asserted.** The row-by-row is mostly endorsement-by-restatement; where it reasons, the two provider hazards (server-side copy fallback, clock skew) are external knowledge, and the analysis correctly attaches an experiment to each. The lock reasoning in §3 is asserted and wrong (below).

**What holds.**
- The clock-skew hazard against the 90-day cap (§2) is real and concrete, and the VM experiment is the right one. Note that the corpus already knows devices carry wrong clocks (`clock_synced: false` in `issues/23.md`; the excerpt's "with a wrong clock, an older one").
- The server-side-copy fallback (`copyto` streaming through the device on backends without server-side copy) is a genuine cost the delta's "one small extra transfer" hides. Hypothesis, but the right hypothesis, and #133's matrix is where it is settled.
- Retain-and-then-fail-to-publish producing duplicate entries on retry (§2) is a real churn source; Gemini names it but offers no closure. Kimi's dedupe rule (§1.2.3) is the closure.

**What does not hold.**
- §1, "retiring `--backup-dir`": "The plan of record uses `--backup-dir` locally ... satisfying D-CLOUD-078." The local set-aside is *shipped* code, not the plan of record — the excerpt's own comment calls it "the cheap form" and names "#22's reconciler [as] the full answer" (`repo/code/cloud_restore-set-aside-excerpt.md`). More importantly, the amendment ("retain-before-install for any fetch or restore that overwrites a local save, pushing the local loser to the cloud store") reopens #22's negative scope — "no preimages of one-way fetches (C1); no local retention of anything (D-CLOUD-036)" — without citing it. And the case the local set-aside guards ("a newer local save can be replaced by an older cloud copy" under a manual RESTORE with no `--update`) *does not exist* post-R1: a `--from-cloud` pass moves only "the cloud changed" units, and "No pass ever overwrites a both-changed unit" (`issues/22.md` R1). The one-way fetch overwrites a local copy whose hash equals agreement, which is the cloud's *previous* head — already retained by whoever published the current head, if that publisher was a new-image device. So the blanket amendment buys almost nothing. What is worth keeping is the residual: when the displaced local version's hash is *not* in the store (a foreign or old-image publisher wrote the head), retain it before installing. `gpt-analysis.md` states exactly that narrower rule ("cover a local version about to be overwritten when its cloud retention cannot be proved"), and §4.1 below shows it also closes the concurrent-publish follow-on.
- §3, keeping retention off the launch path: "EmulationStation checks `L_T` and `L_S`, and will refuse the launch if the reconciler holds `L_S` (D-CLOUD-053)." R6 says ES takes `L_S` itself and refuses on **`L_T`**; the reconciler takes `L_S` non-blocking per unit batch and skips the game. And the refusal language is stale: D-CLOUD-076 makes a launch *cancel* an automatic sync in any phase. The proposed remedy — "read the locally captured save into a staging area, release `L_S`, and only then perform the network copyto" — is already the plan (capture "seals an independent copy", D-CLOUD-034; "batches hold `L_S` briefly — under 100 ms", R6). Gemini presents the design of record as its amendment.
- §3 cost: "1 additional round trip taking ~0.5 to 1.0 seconds" counts only the member copy. The record upload, the store-side verification and the head recheck are further round trips; GPT's `k + 4` is the honest count.
- §4 migration leaves `Saves-replaced/` and the local `.cache/cloud_sync/replaced/` in place as second and third homes to be read by #25 "until the user deletes them or the 90-day age cap sweeps them". Two homes indefinitely is what D-CLOUD-095 rules out, and the local folder is readable by one device only — D-CLOUD-036's consistency argument ("resolve on one device and find the undo missing on another") applies. It also leaves the standing old-image pruner (`prune_replaced_remote`) in the fleet with a live target.

**Strongest argument:** §2's clock-skew hazard with its experiment — concrete, checkable, and it exposed a flaw in Kimi's "clock-independent" claim once followed through.

**Weakest argument:** §3's lock model — wrong lock, superseded rule, and an "amendment" that restates R6.

**Revisions for Step 3.**
1. Replace the `--backup-dir` amendment with the narrow rule: *before a one-way fetch installs over a local version, retain that version in the store if its hash is not already there*; cite C1 and the "no local retention" clause of #22's negative scope as the rows you reopen, and name the cost (one store listing per fetching unit, a rare small upload).
2. Rewrite §3 against R6 and D-CLOUD-076 as written; drop the same-game/different-game distinction, which appears nowhere in the corpus.
3. Recount the exit cost with record write, store verification and head recheck included; label every number as an estimate.
4. Migration: fold both set-asides into `.history/` (read both, write the new one), rather than leaving them as readable siblings.

---

## 3. `gpt-analysis.md`

**Established vs asserted.** The analysis is scrupulous about labelling: estimates are called estimates, the transaction phases are called a proposal, and corpus gaps are enumerated at the end. Its corpus reading is the most accurate of the four (the superseded R6/R10 language, D-CLOUD-042, D-CLOUD-047, the deletion content of `-replaced/`, MATCH THIS DEVICE TO THE CLOUD missing from R1's list).

**What holds, and matters.**
- **The concurrent-publisher counterexample (§2) is decisive and I accept it.** Sequence: A and B both agree `H0`; both retain `H0`; both pass their head check; A publishes `HA` and verifies (agreement → `HA`); B publishes `HB` and verifies. `HA` is head for a few round trips and then gone from the cloud with no store copy. A's next pass sees `L = A = HA`, `C = HB` → "the cloud changed" → fetches `HB` over `HA` with no preimage (C1). `HA` is lost. R5 as written (check-then-write, no conditional put) does not prevent this. Kimi §2.2 is refuted.
- The three bounds need a priority order and "never the only copy" cannot coexist with an unconditional 256 MiB cap (§1). The arithmetic is unarguable; the corpus states four bounds with no ordering (D-CLOUD-096).
- "Protect the latest deliberate conflict loser from routine-sync churn" (§1, priority 3) is the best defence of D-CLOUD-032 in the whole set. Under the delta, one wizard decision followed by three exits that each replace a member of the same unit evicts the wizard loser at count 3 — the maintainer's "primary use case" ("one step back") degrades from three *decisions* to three *exits*. Nobody else saw it.
- Legacy `-replaced/` entries may be deletions, not replacements (sync mode), so an import `reason` of `replaced` is a fabricated fact; use an explicit legacy/unknown reason (§4). Kimi and Gemini both synthesize `reason: replaced`; GPT is right and they should adopt it.
- "Restore loops back into auto-heal" (§2 table): a player who restores a uniform version through #25 is re-healed on the next pass. The classifier must treat a decided republication (new `pub`, D-CLOUD-047) as not suspect. Real, and missed by everyone else.
- "README/history masks mass absence": if emptiness of the cloud listing is judged on the raw listing rather than the allowlisted set, a root holding only control files defeats the mass-absence refusal (R4) and produces a hundred questions. Real, missed by everyone else.
- The D-CLOUD-093 orphan trade (an orphaned rclone renaming into a live game's saves after the launch gate clears) is correctly identified as the more dangerous consequence of that row than Kimi's same-device seq collision.
- Copy-before-replace instead of the server-side *move* prescribed in D-CLOUD-036/041 — shared with Kimi §1.2.2, both right about the absent-head window and the D-CLOUD-037 question it can provoke.

**What is asserted or over-built.**
- **Candidate escrow.** GPT's preferred response to the race is to retain the *publish candidate* as well as the preimage before touching the head, with per-device protection of the latest candidate. That adds a second upload (or a server-side copy of the just-published head, which loses the race it is meant to win) to every history-enabled publish, plus a protected class of entries. GPT's own row-3 amendment — retain a local version before installing over it when its retention in the cloud cannot be proved — already closes the follow-on that turns the race into a *lost* version: A, about to fetch `HB` over `HA`, finds no `HA` in the store and uploads it first. Cost: a store listing the fetch already needs, and one small upload in the rare race. Under D-CLOUD-034 ("the cheapest sufficient form wins") that rule should be the response, and escrow should be named as the more expensive alternative it is. The residual to state: `HA` is unrecoverable *from the cloud alone* until A next syncs; the head choice is still not serialized — GPT's own recoverable/serializable distinction, and the council should say it requires recoverable, which is D-CLOUD-032's test ("whether a wrong outcome is reversible").
- "Reserved namespace in every planner, transfer, restore, deletion, and cleanup path" plus "protect root `README.md` separately" is machinery. Post-R1 every decided transfer is `--files-from` (R2), so the exposure is old images and custom filter files (D-CLOUD-088). Kimi's placement — the rule in the shipped rules file itself — plus the hostile-`--files-from` experiment is the cheaper form of the same protection.
- Copy-before-replace is stated without its cost. On backends with server-side copy, copy and move cost the same; on SFTP/SMB a rename is cheap and a copy streams through the device. D-CLOUD-034 asks that the cost be named before the safeguard is adopted. (Kimi has the same omission.)
- D-CLOUD-100 reopening: the argument (an intentional in-game reset can produce a uniform full-size file; auto-heal would then roll back a deliberate erase while telling the player "was damaged") is a real one and the strongest reason to touch a binding row — it engages D-CLOUD-077's no-lying rule, which Kimi's "recoverable by construction" does not answer. But the reopening is broader than the argument: zero length is almost never a deliberate state, and the delta's rule only fires "where the previous version was neither". The narrow amendment is: heal zero-length as decided; for uniform-at-full-size, heal but the once-message must not assert damage as fact and must name the path back, or hold it as a question. The census/format material GPT calls a blocking gap is only blocking for the broader gate, not for the two-pattern rule.
- MANAGE SAVE HISTORY as the entering row: defensible under the submenu-verb rule in `repo/rules/es-native-ui-excerpt.md`, but it is a third MANAGE row on the hub tree (`repo/docs/es-menu-map.md`); this is a naming preference, not a finding.
- The 3–4-spawn budget of D-CLOUD-046 "cannot simply be carried forward": correct, and the request to reopen 046 narrowly (bounded reads into staging vs downloads installed into live saves) is the right shape; Kimi's §1.7.3 makes the same request for the auto-heal fetch. The two should be merged into one refinement.

**Strongest argument:** the concurrent-publisher sequence and its follow-on to a lost version. It is the only finding in the four analyses that shows a property the plan of record *believes it has* (R5's "push only when head equals agreement") and does not.

**Weakest argument:** candidate escrow as the *preferred* response, when the analysis's own row-3 rule is the D-CLOUD-034-compliant closure.

**Revisions for Step 3.**
1. Demote escrow to "the stronger, costlier alternative"; make retain-on-fetch-when-absent-from-store the recommendation; state the residual in one sentence.
2. Cost the copy-vs-move change per backend class; keep copy where the cost is equal, argue the streamed case explicitly.
3. Narrow the D-CLOUD-100 reopening to the uniform-at-full-size pattern and to the wording of the once-message (D-CLOUD-077).
4. Collapse the namespace protection to: rule in the shipped file at the top; `--files-from` planners never emit a `.history/` path; the hostile-list experiment. Drop "reserve README separately" unless the `--delete-excluded` grep (Kimi §2.5) finds a writer that needs it.
5. Merge the D-CLOUD-046 refinement with Kimi's auto-heal-fetch rider into one row.

---

## 4. `kimi-analysis.md`

**Established vs asserted.** Kimi labels its rclone-semantics inferences and its network estimates, and names its corpus gaps up front. Two claims that are asserted as established are wrong (§2.2, §2.7's clock-independence); one internal count is off (the headline says "seven outright, two with amendments"; the table shows four amended rows).

**What holds, and matters.**
- §1.1 is the single best framing in the set: the delta weakens exactly one structural property — the store's exclusion from the sync boundary moves from *by construction* (R9: "outside the allowlist by construction") to *by rule* — and the corpus shows why that is not a formality: any-depth includes in `repo/code/cloud_sync-rules.txt`, members stored "at their basenames" (R9), user-kept filter files (D-CLOUD-088), and "a delete made on a device still on the old firmware" as a named cause (D-CLOUD-037). The old-image `sync`/MATCH path — members deleted from `.history/` into `-replaced/<stamp>/.history/...`, `record.json` and PNGs left as orphans — is the D-CLOUD-014 incident re-entering through the new folder. The dot-component matching is a hypothesis, correctly labelled, and §2.5's experiment settles it.
- The self-healing fold (§1.1, §4): make the migration of `Saves-replaced/` a *standing* full-pass behaviour, path-aware so that `-replaced/<stamp>/.history/<unit>/<seq>/...` folds back to its original entry. This converts the very mechanism that threatens the store into its repair, and it upgrades an old-image device's one-run set-aside in place. Residual honestly stated (two consecutive old-image runs). This changed my view of the migration from a one-shot to a standing pass, and I now think GPT's "release gate" and Kimi's standing fold are complementary: the fold is the mechanism, the gate is what you write in the release notes about the residual.
- Bytes-first-record-last with the record as commit point, plus an orphan sweep (§2.1) — all four analyses converge here; Kimi states it most precisely and ties it to R9's "finalized, coherent ... only" invariant.
- No pruning on the exit path, grounded in the shipped `--recent` precedent (§2.4).
- The rule belongs *in the shipped rules file* because D-CLOUD-088 now forces that file onto every run (§1.4). One follow-up Kimi does not ask: an upgraded device's rules file may be the *user's edited copy*; whether `cloud_sync_helper` rewrites it (D-CLOUD-079 mentions `cloud_sync-rules.txt.bak`) is a corpus gap that decides whether the shipped line reaches the fleet at all.
- §1.7.3: D-CLOUD-100's "restored" requires a fetch on a path R5 defines as "No fetches". The rows conflict; Kimi is the first to say so plainly.
- §2.9 layout migration carrying `.history/` (D-CLOUD-089, TIDY UP) — a small, real, otherwise unnamed hazard.

**What does not hold.**
- **§2.2, "The TOCTOU window between head-check and publish is one round trip and fails safe (an extra entry, never a missing one)."** Refuted by `gpt-analysis.md`'s sequence (§3 above). The extra entry is `H0` twice; the missing one is `HA`. Kimi's dedupe rule (§1.2.3) absorbs the duplicate and does nothing for the loss. Kimi should adopt GPT's counterexample and the retain-on-fetch closure.
- **§2.7, "The count and size caps are clock-independent and carry the load."** Under R9, "newest N" is by `<seq>`, which begins with `decided_at`. A backward clock makes the fresh entry the oldest for the *count* cap too. The concrete fix nobody offered: order history by the publication chain rather than by time — each record carries the `pub` of the version it holds and the `pub` that displaced it (D-CLOUD-045's `pub`, D-CLOUD-027's `replaces` lineage); "newest N" is N steps back along the chain from the current head; time is display metadata and the age cap's input only. A chain break (foreign publisher) falls back to the record's time, marked untrusted.
- §2.7's mitigation "compare against `max(decided_at, the record's server-side modtime)`" assumes a server-side time exists in rclone's model. Hypothesis, and probably false for members: rclone preserves the *source* modtime on `copyto` where the backend supports it, so a retained member carries the original save's write time, not the retain time (this is my rclone knowledge, not corpus — test it on each #133 backend before relying on it). Gemini and GPT lean on the same assumption.
- §1.7.4, detection of "all one byte" from the listing hash with "no round trips": the listing hash is provider-specific and mapped to sha256 via manifests (R4), so this needs the provider's hash of a uniform buffer, for the plausible byte values. Feasible, but not the one-liner stated; hypothesis.
- §4 synthesizes `reason: replaced` for every `-replaced/` import; GPT shows a sync-mode entry may be a deletion. Use a legacy/unknown reason.
- §2.5's experiment says "assert both files survive on the cloud" under the shipped image's `sync` — but §1.1 predicts members will *not* survive under the shipped image. The experiment is the right one; its expected result should be written as the hazard §1.1 predicts, so a pass is unambiguous.

**Strongest argument:** §1.1 — the by-construction→by-rule weakening, its old-image deletion path, and the self-healing fold that answers it.

**Weakest argument:** §2.2's "fails safe" — it asserts a serialization R5 does not have.

**Revisions for Step 3.**
1. Withdraw §2.2; adopt GPT's sequence; add retain-on-fetch-when-absent-from-store as the closure and state the residual.
2. Replace time-ordered `seq` for the count cap with pub-chain ordering; keep time for the age cap only and mark untrusted clocks.
3. Fix the headline count; note the settings-file migration gap (user-edited rules copy).
4. Import legacy entries with an explicit unknown/legacy reason.
5. Cost copy-vs-move per backend class.

---

## 5. `mistral-analysis.md`

**Established vs asserted.** Most of this analysis is assertion. Several statements contradict the corpus; one presents a measurement that does not exist; the migration section contains code in a no-code deliberation and would lose versions.

**What holds.**
- A prune must check the head / only-copy rule before deleting the oldest (§1 "Three bounds", §2 "Pruning bounds racing a publish"). Correct concern, shared with Kimi §2.4 and GPT §1.
- Auto-heal must write an audit line (§1): consistent with #23's per-discard audit line (`/storage/.cache/log/cloud_audit.log`, D-CLOUD-027) and the D-CLOUD-078 obligation to *know* when something succeeded.
- Write `record.json` last (§2): agrees with all others.

**What does not hold.**
- §1 allowlist: "must be inserted before `+ /savestates/**` (not just ahead of all includes)". Ahead of all includes *is* before `+ /savestates/**`; the delta's placement is the stricter one, and Mistral's "amendment" is weaker than the text it amends. The cited precedent (a `.snapshots` guard in `cloud_sync-rules.txt`) is not in that file.
- §1 D-CLOUD-099 reopening. The binding row is reversed on an argument that is numerically wrong and structurally confused: "nine kept versions ... ~700 KB of auto-states, leaving little room for game saves under the 256 MiB cap" — 700 KB is 0.3 % of 256 MiB; the 28–51 KB figure is for RetroArch numbered states, not PPSSPP (D-CLOUD-036 defers PPSSPP to the census); and the per-save count is per *unit* = game + kind (R9), so auto-states do not "push out game saves" of the same game unless the unit table merges kinds. The maintainer's reasoning in D-CLOUD-099 (the accidental overwrite of a state is the moment a player most needs a restore) is not engaged at all. A reopening needs an argument; this is not one. (There *is* a real churn concern at the unit level — see §7.1 — but it argues for how the count is scoped, not for excluding auto-states.)
- §3: "~1–2 s per replaced save on a handheld's Wi-Fi (measured on the RG35XX SP against Dropbox)". No such measurement is in the corpus; if it had been taken it would have breached D-QA-015. This must be withdrawn.
- §3: "The plan of record used `rclone --backup-dir`, which also copies the loser" — it is the shipped scripts, not the plan of record, and it moves. "This is a cloud-to-cloud copy (no device upload)" — true only where the backend has server-side copy (Gemini/GPT/Kimi's hypothesis), and false for the wizard's KEEP LEFT, whose device loser is uploaded (D-CLOUD-041).
- §3: "The copyto happens after the game has started (D-CLOUD-076)". D-CLOUD-076 says a launch *cancels* the sync; nothing continues after the game starts. This inverts the row.
- §2 "Two devices publishing": the experiment uses two guests with the *same* `cloud_device_id` — that is R7's `duplicate-device-id` refusal case, a different scenario. The proposed mitigation ("the second publish detects the first's `record.json` and refuses") would refuse every legitimate second publish to a unit that has any history; `record.json` is a per-entry manifest, not a lock.
- §2 "Provider differences": "fall back to size + mtime for hashless backends" contradicts R4 (size + sha256 after fetch) and the plan's rule that "nothing is ever replaced by time".
- §4 migration: (a) contains a script, against the commission's "No code"; (b) its structure is wrong — a `-replaced/<stamp>/` folder is a run, not a unit, and the paths beneath it are the saves tree, so `basename` of the stamp is not a unit key; (c) "`mv` (atomic on the same filesystem)" — a cloud remote is not a filesystem and rclone `move` across directories is not atomic on most providers (hypothesis, but the burden is on the claim); (d) the local `.cache/cloud_sync/replaced/` is "left untouched until the next settings restore, which will overwrite it" — nothing in the corpus says a settings restore touches `/storage/.cache/cloud_sync/`, and the folder can hold the only copy of a newer local save an old restore overwrote (the excerpt's own case). The commission's condition "no earlier version is lost" is violated.

**Strongest argument:** the prune-must-check-the-head requirement (§1/§2), though it is stated more precisely elsewhere.

**Weakest argument:** the D-CLOUD-099 reopening; the RG35XX SP "measurement" is the most serious defect because it is not an argument at all.

**Revisions for Step 3.**
1. Withdraw the RG35XX SP measurement and any cost claim not labelled as an estimate.
2. Withdraw or rebuild the D-CLOUD-099 reopening against the actual unit granularity and the maintainer's stated reasoning; if the concern is churn, redirect it to §7.1's scoping question.
3. Correct the allowlist amendment to the delta's own placement and drop the `.snapshots` citation.
4. Remove the code; rewrite migration as: fold *both* set-asides into `.history/` under `L_T`, verify before purge, no prompts, legacy/unknown reason.
5. Replace "size + mtime" with R4's rule; replace the duplicate-id experiment with two *distinct* devices and GPT's barrier sequence.

---

## 6. Disagreements between members, resolved on substance

**6.1 Concurrent publishes — Kimi vs GPT.** GPT is right; Kimi is wrong. R5 is check-then-write. The corpus offers nothing that makes a publish conditional on the head, and D-CLOUD-052 chose plain `rclone copy` as transport. What the plan actually has is *recoverability* if and only if every displaced version reaches the store — and the delta's retain-before-publish only retains the version the publisher *saw*. The cheapest closure (GPT's own row-3 rule, adopted by Gemini in narrower form) is retain-on-fetch when the displaced local version is absent from the store. Serializable head selection would reopen D-CLOUD-052 and the "no protected-publication protocol" negative scope, and I do not think D-CLOUD-032's test requires it.

**6.2 Auto-states — Mistral vs the binding row.** Mistral's reopening fails on arithmetic and on unit scope. GPT and Kimi accept D-CLOUD-099 and correctly move the concern to *how the count is scoped* (§7.1).

**6.3 Local set-aside retirement — Gemini vs GPT.** Gemini's blanket retain-before-install over-reaches (the guarded case disappears at R1); GPT's conditional form is right and should be the council's.

**6.4 Auto-heal — Kimi vs GPT.** Kimi's "a false positive is recoverable by construction" is true of the bytes and silent on D-CLOUD-077 (the once-message asserts damage as fact). GPT's intentional-reset case is a real argument. The narrow amendment (§3 revision 3) reconciles them without discarding the maintainer's call.

**6.5 Copy vs move — GPT and Kimi agree; both omit the cost.** D-CLOUD-034 requires it be named. Equal on server-side-copy backends; a streamed copy on SFTP/SMB where a rename would have been cheap. The safeguard is still worth it (the D-CLOUD-037 window is real), but say the price.

---

## 7. Failure modes all four analyses missed

**7.1 What is "a save" when the count is "per save"?** D-CLOUD-096 bounds "per save 3 to 5"; R9 bounds per *unit* = game + kind. The unit table is a corpus gap, but #23's auto rule ("the cloud's is kept as slot 4") and D-CLOUD-030's slot compaction both treat a game's states as one collection with slots as attributes. If a game's states are one unit, then after a player overwrites slot 1 by accident (the D-CLOUD-099 case), the auto-state replaced on each of the next three exits evicts the slot-1 preimage at count 3 — the maintainer's own headline scenario is defeated by the maintainer's own inclusion of auto-states, purely through unit scoping. GPT's "protect the latest deliberate conflict loser" addresses wizard losers only. The count needs a stated scope — per (unit, member path) or per (unit, kind-with-auto-separate) — decided before the census, and a fixture: overwrite slot 1, exit N times, restore slot 1's preimage from a second device.

**7.2 A per-device setting on a shared store.** The count (and the switch) live in device config; the store is shared by every device (D-CLOUD-036). Device A at count 3 prunes entries device B at count 9 expects to keep; device A with the switch off publishes without retaining, leaving gaps in a history device B relies on. No analysis asked whose setting governs. Cheapest direction: each device publishes its effective count in its manifest (`savestates/.rocknix/manifest-<device-id>.json`, D-CLOUD-031/045, already read on every pass) and pruners apply the *maximum* across manifests; "off" on one device does not suppress retention that another device's setting requires. This is a design question for the maintainer, not a decision I am proposing here.

**7.3 Deletion is never final.** `reason: deleted` + "never the only copy of a game" (D-CLOUD-096) means a deliberate REMOVE EVERYWHERE keeps its bytes in the cloud indefinitely, exempt from the 90-day and size caps — and GPT's 300-games arithmetic is exactly this population. Whether the maintainer intends "never the only copy" to cover a *decided* deletion, or whether decided deletions age out normally, is unasked. It should be asked, by ID against D-CLOUD-096.

**7.4 `copyto` preserves the source modtime.** Every proposed clock mitigation (Gemini's experiment, Kimi's `max(decided_at, server modtime)`, GPT's "causal evidence where available") assumes some trustworthy time is attached to a retained member. rclone sets the destination modtime to the *source's* on backends that support it, so a `.history/` member carries the original save's write time from a device clock. Hypothesis; must be measured per #133 backend before any age or ordering rule leans on it. The pub-chain ordering (§4 revision 2) is the clock-free alternative.

**7.5 A user-edited rules file does not receive the shipped line.** D-CLOUD-088 forces *the rules file* onto every run; if a device's copy is user-edited and the helper does not rewrite it (D-CLOUD-079's `.bak` handling is the only hint, and a corpus gap), the `.history/` exclusion never reaches that device. Kimi got closest (put the rule in the shipped file) without asking whether the shipped file reaches the fleet.

**7.6 Capture's own walker.** If an old-image restore has pulled `.history/` members down to `/storage/roms/.history/...`, does `cloud_capture --full` (D-CLOUD-072's autostart pass, #21 — not embedded) claim them as this device's saves and seal copies? The allowlist governs rclone, not necessarily capture. GPT's table row names "capture" in passing; nobody names the autostart pass that runs before any reconciler could sweep the folder.

---

## 8. Where my position moved

- I accept `gpt-analysis.md`'s concurrent-publisher sequence as decisive: R5's head check is not a serialization and the delta's retain-before-publish alone does not make every displaced version recoverable. I now hold that retain-on-fetch-when-absent-from-store must be part of the delta, and that the council should name "recoverable" (not "serializable") as the property required.
- `kimi-analysis.md`'s standing fold changed my view of migration from a one-shot event to a full-pass behaviour that also repairs old-image damage.
- Following Gemini's clock hazard through Kimi's "clock-independent" claim moved me to the view that history ordering should not be time-based at all.

---

## 9. Revision list by author (for Step 3)

**`gemini-analysis.md`:** narrow the local-retention amendment to the conditional form and cite C1 / "no local retention" as the rows reopened; rewrite §3 against R6 and D-CLOUD-076; recount exit cost; fold both set-asides rather than leaving them readable.

**`gpt-analysis.md`:** demote escrow, promote retain-on-fetch, state the residual; cost copy-vs-move per backend class; narrow the D-CLOUD-100 reopening to uniform-at-full-size and the message wording; collapse namespace machinery to rule-in-shipped-file + `--files-from` discipline + hostile-list test; merge the D-CLOUD-046 refinement with Kimi's rider.

**`kimi-analysis.md`:** withdraw §2.2; adopt pub-chain ordering for the count cap; fix the headline count; use a legacy/unknown import reason; note the user-edited rules file gap; cost copy-vs-move.

**`mistral-analysis.md`:** withdraw the RG35XX SP measurement and the D-CLOUD-099 reopening as argued; correct the allowlist placement and citation; remove the code and rebuild the migration to fold both set-asides; replace "size + mtime" with R4's rule; rebuild the concurrency experiment with distinct devices.

**All four:** answer §7.1 (count scope vs unit granularity), §7.2 (whose setting governs a shared store), §7.3 (is a decided deletion exempt from the caps), and §7.4 (no trustworthy time on a retained member) before the delta is locked; each is a question to the maintainer by ID or an experiment on the GENERIC_X64 pair against the #133 backends (D-QA-007/017), none touches a person's device or cloud (D-QA-015).

---

## `corpus.provenance.json`

```json
{
  "facilitator": "council-facilitator@1.2.0",
  "access_mode": "embedded read-at-time corpus; no filesystem access; hashes are the Facilitator's embed-time values, not recomputed by this member",
  "manifest": "research/council-runs/2026-09-11-save-history-one-home/_prompts/step2-source-manifest.json",
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
    "full cloud_backup / cloud_restore scripts (only the set-aside excerpts are embedded; --delete-excluded, RSYNCRMDIR filter handling and the settings-phase --backup-dir are unverifiable)",
    "upgrade-and-install.md (quoted by the commission, not embedded)",
    "the unit table and #21's capture contract (decides whether a game's states are one unit; needed for §7.1 and §7.6)",
    "docs/save-manifest-schema.md, docs/conflict-wizard-ia.md, engineering-practices.md (referenced, not embedded)",
    "cloud_sync_helper's handling of a user-edited cloud_sync-rules.txt on upgrade (needed for §7.5)",
    "any backend capability results for server-side copy, hash availability and modtime preservation on copyto (needed for §7.4 and every cost estimate)"
  ],
  "fabrication_statement": "No path, hash or content has been invented for unembedded material; the analyses reviewed are the four injected under the orchestrator brief and are cited by their injected filenames only."
}
```