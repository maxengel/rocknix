# Council — Step 3: revised approach

You are one of five council members. In Step 1 you judged the delta to the
conflict-resolution plan of record -- one hidden history store for the earlier
versions of a player's saves (the commission, `00-problem-statement.md`). In Step 2 the other four
reviewed your analysis, and you reviewed theirs. The corpus is embedded above
again, unchanged and hash-verified; the peer reviews of your work and of the
others' are injected below.

Now produce **your revised approach**: the delta you would actually apply to the
plan of record -- endorsing, amending or replacing each row of
`save-history-plan-delta.md` -- having heard the critique. This is the artifact the council votes on in Step 4,
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
  clear which parts of it are the foundation (get these wrong and a player loses a
  save, or waits for us before a game) and which are refinements that could follow later.
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

=== END claude_peer_review.md ===

=== START gemini_peer_review.md ===

Here is my review of the three injected analyses, evaluated against the embedded corpus.

### 1. Testing Claims Against the Corpus

**`claude-analysis.md`**
*   **Claim:** The count bound is keyed to the unit, meaning auto-states will evict manual states. 
    *   *Verdict: True.* Source 11 (R4) defines identity as "*L* = this device's hash set for the unit" and R9 defines "unit = game + kind". Since auto-states and manual states are both "states" for the same game, they share a unit. A count of 3 will indeed allow auto-states (which churn on every exit) to evict manual states.
*   **Claim:** D-CLOUD-100's auto-heal cannot fetch the good copy on the exit path because R5 forbids it.
    *   *Verdict: True.* Source 11 (R5) explicitly states the exit push is "to-the-cloud only... No fetches, no ICMP, no probes on this path." D-CLOUD-100 requires the good copy to be "restored" (fetched). These two directives are in direct conflict.

**`gpt-analysis.md`**
*   **Claim:** The three bounds (count, age, size) and "never the only copy" cannot all be unconditional.
    *   *Verdict: True.* This is a mathematically sound deduction. If a player has 300 games with 1 MiB saves, the total is 300 MiB. The 256 MiB cap (D-CLOUD-096) demands pruning, but the "never the only copy" rule forbids it. 
*   **Claim:** The old store's record is explicitly for "finalized, coherent wizard losers."
    *   *Verdict: True.* Source 11 (R9) explicitly states: "The store counts finalized, coherent wizard losers only... Propagated deletions, compactions and one-way transfers are not retained here."

**`mistral-analysis.md`**
*   **Claim:** The `copyto` operation is a "cloud-to-cloud copy (no device upload)" and costs no device bandwidth.
    *   *Verdict: False.* Source 17 (D-QA-017) mandates support for self-hosted backends including SFTP and SMB. As `kimi-analysis.md` correctly infers, rclone cannot perform server-side copies on these protocols; the data must stream down to the handheld and back up.
*   **Claim:** The `copyto` happens "after the game has started (D-CLOUD-076) or after the sync card has said the player may go (D-CLOUD-038)."
    *   *Verdict: False.* Source 4 (D-CLOUD-038) explicitly states that a sync "gates game launch." The player waits on the card *before* the game starts. 

### 2. Separating Established Facts from Assertions

*   **rclone overlap and sync behavior:** `claude-analysis.md` and `kimi-analysis.md` assert that rclone `sync` will not delete excluded files unless `--delete-excluded` is passed, and that `copy` does not check for source/destination overlap. These are assertions based on external tool knowledge. They are highly likely to be true, but both authors correctly identify that they require VM verification.
*   **The TOCTOU (Time-Of-Check to Time-Of-Use) Race:** `gpt-analysis.md` asserts that even with retain-before-publish, a concurrent publisher can overwrite a version without retaining it. (Device A and B both retain H0; A publishes HA; B publishes HB. HA is destroyed without being retained). This is an assertion based on distributed systems logic, not explicitly detailed in the corpus, but it is undeniably correct because the transfer lock `L_T` is device-local (Source 11, R6), not a remote mutex.
*   **Network Latency Estimates:** All three analyses estimate the time cost of the extra `copyto` operation. These are inferences. `mistral-analysis.md` assumes 1-2 seconds based on Dropbox, while `claude-analysis.md` and `kimi-analysis.md` correctly assert that hashless/streaming backends (SFTP/SMB) will take significantly longer, especially for large PPSSPP states.

### 3. Strongest and Weakest Arguments

**`claude-analysis.md`**
*   **Strongest:** The identification of the R5 (no fetches on exit) vs. D-CLOUD-100 (auto-heal restore) contradiction, and the proposed fix to heal from the local capture stage. This perfectly resolves the conflict without violating the time-to-play budget.
*   **Weakest:** The recommendation to outright *drop* the 90-day age cap because clocks are untrusted. D-CLOUD-096 explicitly requests an age cap. Outright dropping it violates a maintainer constraint. `gpt-analysis.md`'s approach (establishing a strict priority order for bounds) is a much better way to handle the contradiction.

**`gpt-analysis.md`**
*   **Strongest:** The identification of the concurrent-publisher TOCTOU race. `claude-analysis.md` attempted to fix this by checking the hash *after* the copy, but `gpt-analysis.md` correctly realizes that a race window still exists between that check and the final publish. The requirement for "candidate escrow" (retaining the publish candidate *before* modifying the shared head) is the only mathematically safe solution.
*   **Weakest:** The insistence on keeping the `.snapshots` exclusion guard. Source 2 explicitly states the `.snapshots` rule is dropped, and Source 13 confirms "no local snapshots". Defending a deprecated guard distracts from the actual namespace protection needed for `.history/`.

**`mistral-analysis.md`**
*   **Strongest:** The concrete migration mapping. Moving `-replaced/` to `.history/` and synthesizing the `record.json` using `reason: replaced` is a highly practical application of the "read both, write the new one" rule.
*   **Weakest:** The recommendation to *ignore* the local `.cache/cloud_sync/replaced/` folder during migration. Source 3 explicitly states this folder holds "the device copy a restore overwrote." Ignoring it guarantees the loss of any unpublished local saves that were overwritten by a restore, directly violating the commission's "no earlier version is lost" rule.

### 4. Missed Failure Modes

*   **The Intentional Erasure Loop:** If a player intentionally erases their save in-game (resulting in a 0-byte file), D-CLOUD-100's auto-heal will silently restore the old cloud copy. The player will delete it again, and the system will heal it again, trapping the player in an infinite loop. `gpt-analysis.md` briefly touches on this ("Restore loops back into auto-heal"), but none of the analyses provide the necessary mechanical fix: a "sticky divergent" state that forces the wizard to ask the player what they actually want to do.
*   **`--delete-excluded` Wiping History:** `kimi-analysis.md` is the only one to catch this. If any legacy script or user configuration passes `--delete-excluded` to rclone, the `- /.history/**` rule will cause rclone to actively delete the history store from the cloud. 

### 5. Concrete Revisions for Step 3

**For `claude-analysis.md`:**
1.  Do not drop the 90-day age cap. Instead, adopt `gpt-analysis.md`'s priority ordering for bounds (e.g., "never the only copy" > count > age > size) to handle the mathematical contradictions.
2.  Acknowledge `gpt-analysis.md`'s TOCTOU race. Your "hash from the copy" fix narrows the race window but does not close it. Adopt the "candidate escrow" concept: the device must upload its *new* save to `.history/` as a pending candidate before it overwrites the live head.

**For `gpt-analysis.md`:**
1.  Adopt `claude-analysis.md`'s brilliant "count per file" fix. You correctly noted that auto-states shouldn't consume the battery-save allowance, but your solution requires complex UI/logic exceptions. Claude's fix (applying the count to the *file path* rather than the *unit*) solves it instantly without reopening D-CLOUD-099.
2.  Revise your migration strategy to explicitly include the local `.cache/cloud_sync/replaced/` folder, as `claude-analysis.md` and `kimi-analysis.md` did.
3.  Drop the defense of the `.snapshots` guard; the corpus has already retired it.

**For `mistral-analysis.md`:**
1.  Correct your assumption that `copyto` is always a zero-bandwidth server-side operation. You must account for the SFTP/SMB backends (D-QA-017) which will stream the data through the handheld, impacting the time-to-play budget.
2.  Correct your reading of D-CLOUD-038. Sync *gates* launch; it does not happen in the background after the game starts.
3.  Do not ignore the local `.cache/cloud_sync/replaced/` folder during migration. You must fold it into `.history/` to prevent data loss.
4.  Do not reopen D-CLOUD-099 (auto-states). Instead, adopt `claude-analysis.md`'s "count per file" logic to prevent auto-states from evicting manual saves.

=== END gemini_peer_review.md ===

=== START kimi_peer_review.md ===

# Council Step 2 — peer review of the four Step 1 analyses

*Seat review. Every claim below was tested against the embedded corpus only; I cite sources by their declared paths. Where a member's claim rests on knowledge outside the corpus (rclone internals, backend capabilities), I say whether they labelled it as such. I did not re-read or re-hash anything; the Facilitator's embed-time sha256 values are recorded in the provenance block at the end.*

**Headline judgments, argued below:**

1. `gpt-analysis.md` contains the single most important finding of the round — the concurrent-publisher counterexample — and it defeats the one genuinely weak claim in `claude-analysis.md` (that the hash-from-copy check closes the two-device race). The two analyses are complementary, not competing; the delta needs both.
2. `claude-analysis.md` is the most corpus-faithful of the four and its per-file count-keying finding (§1.2) is the best-diagnosed defect in the delta. Its concurrency section overclaims.
3. `gemini-analysis.md` is thin but contributes one amendment nobody else made (retain-before-install) and one real hazard (clock skew) — then wastes both by not developing them. Its migration section loses data and must be rewritten.
4. `mistral-analysis.md` contains a fabricated measurement presented as fact, a misattributed allowlist rule, a verification standard that contradicts R4, and a migration that destroys unique local copies. It needs the most revision.

---

## 1. `claude-analysis.md`

### Claims checked against the corpus

**Hold:**

- *"The shipped rules restore `.history/<unit>/<seq>/Zelda.srm` to a device today (the members match `+ /**/*.srm`; `record.json` and PNGs do not)."* — Verified against `repo/code/cloud_sync-rules.txt`. The includes `+ /**/*.srm`, `+ /**/*.state*`, `+ /**/*.sav` etc. match at any depth; `.json` and `.png` match no include and fall to the trailing `- /**`. The conclusion is correct, and it is the round's most important shipped-code fact: **the store is unsafe under the shipped allowlist**, in both directions (restore to device; sync-mode deletion into `-replaced/`, which `repo/code/cloud_backup-set-aside-excerpt.md` confirms — "anything replaced (or, in sync mode, removed) in the cloud goes to ${replaced_root}" — and which `prune_replaced_remote` then reduces to one run). The proposed remedy (ship `- /.history/**` one image early, as a guard with no writer, per the `.snapshots` precedent in `issues/25.md`) does not reopen D-CLOUD-097, which is about widening `-replaced/` retention, not about filter rules. This is the strongest safety argument in any of the four analyses.
- *The delta lists D-CLOUD-047 as unchanged while changing it.* — Verified. The delta's "What does not change" names "publications and retirements (D-CLOUD-047)"; D-CLOUD-047 says "Propagated deletions and compactions are not retained as discarded saves; … the cloud's `-replaced/` sibling is their record"; the delta's `reason: deleted` retains deletions and retires `-replaced/`. A real contradiction the delta's own text misses. `gpt-analysis.md` catches the same thing ("Reopen D-CLOUD-047's retention exclusions").
- *D-CLOUD-095 does not cite D-CLOUD-042.* — Verified against the register. `gpt-analysis.md` states the sharper version: D-CLOUD-042 has two clauses (the folder name; the legacy split-root refusal), and only the first is superseded. Claude should adopt that framing.
- *R5 forbids fetches on the exit path, so D-CLOUD-100's "restored" cannot happen at exit.* — Verified: `issues/22.md` R5: "It is **to-the-cloud only** … No fetches, no ICMP, no probes on this path." D-CLOUD-100: "the cloud's good copy is kept and restored." This is an internal contradiction in the plan of record as amended, and only this analysis and `gpt-analysis.md` ("The exit pass can flag and defer recovery; it must not silently become a download/install pass") engage with it. Claude's staged sequence (torn save → relaunch → fresh game written → published as "this device changed" → good copy retained but the player holds a blank game) is correctly constructed and correctly attributed to D-CLOUD-076 (launch cancels the boot sync that would have healed).
- *The count bound is keyed to the unit; auto-state churn evicts manual-slot history.* — Verified as far as the corpus goes: R4 defines *L* as "this device's hash set for the unit"; R9 says "unit = game + kind"; D-CLOUD-030 makes slot an attribute, not identity. Given those, one game's states are one unit, and a per-unit count of 3 lets three exits of auto-state churn evict the manual slot's retained version — the exact case D-CLOUD-099 was decided to protect. Claude flags the one unverifiable premise honestly ("if the unit table in #21 already keys states per slot, this amendment is a no-op"; #21 is not embedded). The fix (count per (unit, member path)) also matches the player-facing label VERSIONS KEPT PER SAVE better than the mechanism it amends. This is the best-diagnosed defect of the round.
- *`prune_replaced_remote` skips `--recent` runs; D-CLOUD-083 restored ten low-level retries; the maintainer has two devices.* — All verified against the register and the excerpts.
- The rclone recollections (overlap-check behaviour of `copy` vs `sync`/`move`, excluded-destination treatment under `sync`, modtime preservation, per-backend server-side copy) are **labelled as recollection with named VM experiments**. This is exactly the discipline the brief asks for, and the other three members do it inconsistently or not at all.

**Fails / overclaims:**

- *"Both retain H0, both publish. Covered in §1.3: with the hash taken from the copy, the second device sees the head no longer equals A and does not publish … Either way no version is lost."* — **Refuted by `gpt-analysis.md`'s counterexample.** Claude's check compares the retained copy's hash to *A* between the retain and the publish. Two devices can both pass that check while the head is still H0, then both publish; the second publish overwrites the first **without retaining it**. The check narrows the window; it cannot close it, because the check and the publish are not atomic — and GPT says exactly this ("Another head check merely moves the race window"). Worse, GPT's follow-on is real: if the first publisher's correspondence check completes before the overwrite, agreement advances to HA; the next pass then classifies "the cloud changed" and fetches HB over the local HA, and #22's negative scope ("no preimages of one-way fetches") means nothing retains HA anywhere. "No version is lost" is false in that window. Claude must adopt GPT's counterexample and either accept the escrow cost, accept Gemini's retain-before-install as the backstop, or explicitly record the residual as accepted — but may not claim closure.

### Strongest argument
§1.2 (per-file count keying), with §1.4 (heal-from-the-stage mechanics) and §1.5 (ship the exclusion rule early) close behind. Each is corpus-derived, each names its experiment, and each amends rather than reopens.

### Weakest argument
The concurrency closure claim (§2.2/§1.3), for the reason above. Second-weakest: dropping the 90-day age cap is well-argued (untrusted clocks are corpus evidence — `issues/23.md` carries `clock_synced: false`), but the recommendation should present the trust-gated sweep as the primary alternative and the drop as the fallback, since it reopens a clause of D-CLOUD-096 and the maintainer approved that number four days ago.

### Concrete revisions for Step 3
1. Replace §2.2's "Covered in §1.3" with GPT's counterexample and a three-option treatment (escrow / retain-before-install backstop / accepted residual), recommending one.
2. Add the ordering rule that the own-manifest witness (R7, I2) must run **before** any retain, or a cloned card writes store entries for a publish it will refuse — a point no member made.
3. Extend the audit requirement: #23 mandates an audit line per discard before the apply; the delta needs the same for routine retains and prunes, or the store's mutations have no lineage (D-CLOUD-027).
4. State the soft-cap semantics explicitly: pruning and the size sweep run on full passes only, so an exit-only device overshoots count and the 256 MiB cap between full passes. The README and the settings page must not promise a hard ceiling.
5. Note the startup-sync cost symmetric to §3: the boot pass's backup half now retains too, lengthening it and raising the probability a launch cancels it (D-CLOUD-076/072). Only the exit path is quantified.

---

## 2. `gemini-analysis.md`

### Claims checked against the corpus

**Holds, partially:**

- *"On self-hosted backends like SFTP or WebDAV, rclone may not support server-side copy and will silently fall back to downloading and re-uploading."* — Directionally correct for SFTP, but asserted without the "hypothesis" label Claude gives the same class of claim, and WebDAV is server-dependent (GPT states the correct distinction: "Copy efficiency and verifiability are separate"). The experiment Gemini names (measure traffic on the SFTP QA backend) is the right one; `issues/133.md` makes that backend available.
- *The clock-skew hazard.* — Real and corpus-grounded: R9's seq is `<decided_at, UTC compact>-<device id>`, and #23 already carries `clock_synced: false` because handheld clocks are not trusted. A 1970-clock device's brand-new entry sorts oldest and is pruned first. But Gemini stops at the hazard; Claude (drop or trust-gate the age cap) and GPT (timestamps are display, never correctness ordering) each supply the mitigation Gemini lacks. Gemini's find is a good premise with no conclusion.
- *The README falls through to the trailing `- /**` and does not sync to the device.* — Correct against `repo/code/cloud_sync-rules.txt`.

**Fails:**

- *"The allowlist (`repo/code/cloud_sync-rules.txt`) excludes `- /.history/**`."* — **False as written.** The shipped file contains no such rule; that rule is the delta's *proposal*. The distinction is the entire hazard: under the shipped rules, `.history` members matching `+ /**/*.srm` are restored to devices and, in sync mode, deleted from the cloud into `-replaced/` (Claude's §1.5, verified above). Gemini's phrasing treats the delta as already shipped and thereby misses the pre-R1 exposure window that motivates Claude's ship-the-rule-early amendment.
- *"If they launch the same game, EmulationStation checks `L_T` and `L_S`, and will refuse the launch if the reconciler holds `L_S` (D-CLOUD-053)."* — Garbled twice over. Per R6, ES takes `L_S` itself before the pre-launch renames, then checks `L_T`; the reconciler holds `L_S` only in sub-100-ms batches. And per D-CLOUD-076 (2026-09-10), a launch **cancels** an automatic sync in any phase; refusal applies only to a player-started sync. Gemini's model is stale relative to D-CLOUD-076 — the same staleness GPT correctly identifies in #22's own text.
- *The migration section ("Age out").* — This is the weakest migration of the four and it fails the commission's own rule ("no earlier version is lost"). Leaving `Saves-replaced/` in place "until the user deletes them or the 90-day age cap sweeps them" loses the bytes twice over: old-image devices prune the folder to one run (`prune_replaced_remote`), and the age cap as specified governs the store, not the legacy sibling — Gemini's own proposal is incoherent on its face. "Until the user deletes them" asks the player a question about internals, which the commission names a failure mode. And amending #25 to read `.cache/cloud_sync/replaced/` is impossible for any device but the one holding it — that cache is local by construction. Claude and GPT both show the only acceptable shape: fold, verify, then delete, with a grace period.
- The `L_S` recommendation ("read the captured save into staging, release `L_S`, then do the network work") is already the design — R6 holds `L_S` in brief per-unit batches. Gemini presents a plan-of-record property as a new requirement.

### Strongest argument
The **retain-before-install** amendment: "The reconciler must also perform retain-before-install for any fetch or restore that overwrites a local save, pushing the local loser to the cloud `.history/` store before overwriting it locally." Gemini's stated rationale is mostly redundant — for a routine fetch the local loser equals the old head, which the publisher's retain-before-publish already stored — but the amendment becomes load-bearing precisely in GPT's race follow-on, where the local loser (HA) was a head that nobody retained. It is the missing second half of the delta's publish-only retention, and Gemini is the only member who stated it.

### Weakest argument
The migration "age out," for the reasons above.

### Concrete revisions for Step 3
1. Rewrite migration wholesale: fold `-replaced/` into `.history/` with synthesized records, verify before deleting, upload unique local-cache bytes (the manual RESTORE row passes no `--update` — `repo/code/cloud_restore-set-aside-excerpt.md` — so some of those local copies exist nowhere else, as Claude notes), and take GPT's grace period.
2. Correct the launch-gate description per D-CLOUD-076 and R6.
3. Label backend-capability claims as hypotheses with the VM experiment attached (Claude's discipline).
4. Convert the clock hazard into a position on the age cap, or hand it to Claude's amendment explicitly.
5. State the retain-before-install amendment against the concrete scenario that needs it (GPT's follow-on), not the redundant one.

---

## 3. `gpt-analysis.md`

### Claims checked against the corpus

**Hold:**

- *"#22 still contains launch-refusal and exit-code language superseded by D-CLOUD-074, D-CLOUD-076, and D-CLOUD-098."* — Verified and uniquely caught. #22 R10 specifies outcomes "3 lock held · 4 no route"; D-CLOUD-074 moved the sentinels to 75/69 precisely because "rclone's codes run 1-9." #22 R6's launch *refusal* predates D-CLOUD-076's launch-*cancels*-automatic-syncs. Since the delta says "Everything not named here stays as #21–#25 … have it," these stale clauses ride along unless named. This matters and no other member saw it.
- *R9 flattens members to basenames; a multi-directory unit with two same-named files collides.* — Verified: R9 stores "the loser's members at their basenames." PPSSPP directory units are the corpus's own multi-file case. Unique to this analysis.
- *The old store counts "finalized, coherent wizard losers only," a materially narrower contract than the unified store.* — Verified verbatim from R9.
- *The four bounds are jointly unsatisfiable* (300 games × 1 MiB of only-copies vs 256 MiB). — Correct logic, and the priority ordering (transaction material → only usable copy → latest deliberate loser → count/age/size oldest-first) is the cleanest resolution offered. Claude's "never the only copy" definition handles the per-file case; GPT's handles the aggregate. GPT's is more complete.
- *D-CLOUD-095 supersedes only D-CLOUD-042's location clause.* — Correct nuance; sharper than Claude's treatment of the same row.
- *The concurrent-publisher counterexample.* — Constructed correctly and, as argued above, decisive against both the delta's sufficiency and Claude's closure claim. The follow-on (agreement advanced → "cloud changed" fetch overwrites the local loser with no preimage, against #22's "no preimages of one-way fetches" negative scope) is the loss that converts a near-miss into actual data loss. The framing the maintainer needs — **recoverable concurrency vs serializable head selection** — is exactly right, and it is the honest way to present a possible D-CLOUD-052 reopening.
- The migration treatment (copy-not-move, verify before removing, preserve unclassified files, the import grace period against the 90-day cap, mixed-version boundary as a release gate rather than a log line) is the most rigorous of the four. The grace-period point — import a 100-day-old version and the age cap deletes it immediately — is a genuine catch nobody else made.

**Fails / overclaims:**

- *The candidate-escrow fix is never reconciled with the bounds.* Escrowing every publish candidate roughly doubles store writes and churns the very count cap this analysis wants to prioritize; GPT gestures ("costs additional writes and protected storage") and later scopes it ("at minimum, the latest candidate per publishing device/unit"), but the two passages never meet. As written, the strongest finding has the least-costed remedy.
- *"'Discarded saves were not kept' is false if that operation retained a mandatory recovery copy."* — Over-lawyered. Transaction staging (`pending-publish.json`, the stage) exists regardless of the history switch and is not "kept discarded saves" in any vocabulary the player has. The real point underneath — the switch's semantics are unspecified under universal retain-before-publish (does OFF disable replacement retention? does it conflict with D-CLOUD-100's mandatory suspect retention?) — is genuine and worth keeping; the footer argument should be dropped.
- The D-CLOUD-052 reopen is named but the argument for it is only sketched. The commission's bar is "cite its ID and give the argument that should reopen it"; "recoverable vs serializable" is the right frame, but Step 3 needs it stated in one paragraph with the cost test (D-CLOUD-034) applied, or the reopen will read as casual given how decisively Gate 11 settled the transport.

### Strongest argument
The concurrent-publisher counterexample — the only finding in the round that is a *proof* rather than an assessment, and the one that most changes what the delta must say.

### Weakest argument
The uncosted escrow, followed by the footer quibble.

### Concrete revisions for Step 3
1. Cost the escrow against the caps: scope it to the latest candidate per (device, unit), state its interaction with the per-file count, and say what prunes it and when.
2. Write the D-CLOUD-052 reopening argument in full or downgrade it to "recoverable concurrency accepted as a residual" — one of the two, explicitly.
3. Drop the footer argument; keep the switch-semantics gap (which is real and which the delta must specify: OFF disables future optional history, never purges, and does not cover mandatory transaction/suspect retention).
4. Adopt Claude's per-file keying as the concrete mechanism for priority 3 (protecting the deliberate loser from churn) — the two proposals are the same idea at different altitudes.

---

## 4. `mistral-analysis.md`

### Claims checked against the corpus

**Fails — and these are the kind of confidently wrong claims the brief asks reviewers to catch:**

- *"~1–2 s per replaced save on a handheld's Wi-Fi (**measured on the RG35XX SP against Dropbox**)."* — **There is no such measurement in the corpus.** D-CLOUD-046 says the exit-path "Numbers are filled in from Gate 4, not chosen"; #135 says budgets are "to propose after a first measurement"; D-QA-015 exists precisely because an unannounced device run happened once and was ruled a serious breach. Presenting an estimate as a completed device measurement is the single worst claim in any of the four analyses, and it must be withdrawn or replaced with the VM measurement (#135's `time-to-play` cell, which `issues/135.md` says can run on the VM).
- *"This is a stricter version of the existing guard for `.snapshots/` (SOURCE 10, `cloud_sync-rules.txt`)."* — **Misattributed.** SOURCE 10 contains no `.snapshots` rule; that rule exists only in #22 R2's *planned* reconciler arguments ("a guard with no writer"). The shipped allowlist is exactly the problem — it guards nothing against `.history`.
- *"The reconciler must fall back to size + mtime for hashless backends when verifying `.history/` entries."* — **Contradicts the plan of record.** R4 specifies "hashless backends by size + sha256 after fetch"; D-CLOUD-046 specifies "size plus a capped re-fetch." Mtime is the thing `--ignore-times` exists to distrust (R2). This amendment would weaken verification below the standard the plan already set.
- *"Nine kept versions of one game … ~700 KB of auto-states, leaving little room for game saves under the 256 MiB cap."* — The arithmetic refutes the conclusion: 700 KB is roughly 0.3% of 256 MiB, and D-CLOUD-036 already computed "nine kept resolutions of one game stay under a megabyte." The churn problem is real (Claude's §1.2 is the correct diagnosis) but it is a **per-unit keying** problem, not an aggregate-size problem, and the fix is per-file counting — not reopening D-CLOUD-099, a decision the maintainer made four days ago with the accidental-overwrite rationale stated. Mistral's own hedge ("if the maintainer's D-CLOUD-099 decision is reversed") admits the weakness.
- *Migration: "The reconciler ignores this folder … left untouched until the next settings restore, which will overwrite it."* — **Fabricated mechanism and data loss.** Nothing in the corpus says a settings restore touches `/storage/.cache/cloud_sync/replaced/`; and because the manual RESTORE row passes no `--update` (verified in `repo/code/cloud_restore-set-aside-excerpt.md`), some of those local copies are the newest version of a save that exists nowhere else. Ignoring them loses exactly the data the commission's migration rule exists to protect.
- *"The second publish detects the first's `record.json` and refuses to overwrite it."* — Invented mechanics. The plan's actual mechanisms are the own-manifest witness (R7: `duplicate-device-id` refusal, which fires before any publish and makes Mistral's cloned-card experiment moot) and the classifier. The real two-device race is GPT's, and it is not solved by record detection.
- *The pruning amendment ("if the head matches the version being pruned, the prune fails").* — Confused: a history entry equal to the head is a redundant copy of live bytes; evicting it is harmless. The correct rule (Claude's) is: never evict the newest history entry of a file whose unit has no live member in the head. Mistral's version would permanently pin every entry created by a restore-from-history.
- The pseudocode block violates the commission's output shape ("No code").

**Holds:**

- The auto-state churn observation itself (the diagnosis is wrong; the symptom is real).
- The audit-log suggestion for auto-heal — worth generalizing to all store mutations (see my revisions to Claude).
- The allowlist placement instinct (ahead of includes) is directionally right though the stated position ("before `+ /savestates/**`") is muddled; the delta's "ahead of every include" is the correct general form, and the competing includes for root-level `.history` members are the extension rules, not `/savestates/**`.

### Strongest argument
The D-CLOUD-099 reopen attempt — not because it succeeds (Claude's per-file keying achieves the maintainer's stated intent without reopening a four-day-old decision), but because it is the only place Mistral engages with a real tension.

### Weakest argument
The fabricated measurement, because it corrupts the evidentiary basis every other section depends on; the migration, because it loses data.

### Concrete revisions for Step 3
1. Withdraw the "measured on the RG35XX SP" clause; replace with the VM experiment or a labelled estimate.
2. Replace the D-CLOUD-099 reopen with the per-file count amendment, or state explicitly why per-file counting fails to protect the manual slot.
3. Rewrite migration per Claude/GPT (fold, verify, grace, delete).
4. Drop "size + mtime"; cite R4's actual hashless standard.
5. Fix the prune rule to the newest-entry-per-file definition.
6. Remove the pseudocode.

---

## 5. Cross-cutting adjudications

**The count keying.** Claude's per-(unit, member path) amendment is correct and is the minimal change that makes D-CLOUD-099 true; GPT's priority ordering is the same insight at policy level and should cite it as the mechanism; Mistral's reopen of D-CLOUD-099 is unnecessary. The player-facing label (VERSIONS KEPT PER SAVE) already promises per-file semantics, so the amendment is also a documentation-accuracy fix.

**Concurrency.** GPT's counterexample stands unrefuted. The complete treatment synthesizes all four members: Claude's hash-from-copy check (cheap; narrows the window; keep it), Gemini's retain-before-install (closes the follow-on local loss), and GPT's escrow-or-accept decision (the only thing that addresses the head race itself) framed as recoverable-vs-serializable for the maintainer. The delta must state which it takes; "no version is lost" (Claude) and silence (the delta) are both unacceptable.

**The age cap.** Claude's drop-or-trust-gate is the best-supported position (untrusted clocks are corpus evidence, not hypothesis); GPT's priority pins are a viable alternative; Gemini found the hazard and stopped. The 90-day number was approved as a "starting point … to measure against" (D-CLOUD-096), so reopening its age clause with the clock argument is legitimate and should be presented with the trust-gated alternative.

**Migration.** Only the Claude/GPT shape (fold → verify → grace → delete; upload unique local-cache bytes; mixed-fleet ordering as a release gate) satisfies "no earlier version is lost … a prompt is a failure mode." Gemini's and Mistral's versions both fail it, in different ways.

**Auto-heal.** Claude's mechanics (heal from the stage first, sticky-divergent fallback, symmetric cloud-side check) and GPT's conservatism (format-validity gate, intentional-erase handling, no silent rollback of an authorized restore) are complementary amendments; neither alone is sufficient, and the plain endorsements (Gemini, Mistral) both miss the R5 no-fetches contradiction.

## 6. Failure modes every analysis missed or under-developed

Convergence here is a shared blind spot, not correctness:

1. **Witness-before-retain ordering.** R7's own-manifest witness refuses a cloned card's publish — but if the retain precedes the witness, a cloned card still writes store entries for a publish that will be refused. Nobody ordered the two.
2. **Audit lineage for routine retains and prunes.** #23 mandates an audit line per wizard discard before the apply; the delta's universal retains and the pruner's deletions have no equivalent requirement. The store is the player's last resort; its mutations need D-CLOUD-027 lineage. (Mistral's audit point covers auto-heal only.)
3. **The startup sync's backup half now retains too**, lengthening the boot sync and raising the probability a launch cancels it — symmetric to the exit cost Claude quantified, unexamined by all four.
4. **The auto-rule churns the store twice.** #23's divergent-`.state.auto` rule installs the cloud's auto as slot 4; that installation overwrites any existing slot 4, which under retain-before-publish creates a store entry — per divergence, in addition to the entries the delta already creates. Nobody modeled the interaction.
5. **Soft-cap semantics.** With pruning confined to full passes, an exit-only device overshoots both the count and the 256 MiB cap between full passes; the README and settings page must not promise a hard ceiling. Claude and GPT each touch the edge of this; nobody states it as a required disclosure.
6. **The wizard's pre-pass retains survive a quit.** #23: quitting discards decisions but "the pre-pass … has already happened and is not undone"; under the delta, the pre-pass's pushes retained first. Harmless, but the delta should say the entries exist and why.
7. **The delta never says when the allowlist rule ships.** Claude's ship-one-image-early amendment is the only treatment; it should be mandatory text in the delta, not a review finding, because the store is unsafe under the shipped rules from the first retain until R1 completes.

## 7. Where the other members changed my read

- GPT's counterexample changed my assessment of Claude's §1.3: I initially read the hash-from-copy amendment as closing the two-device race; it does not, and the follow-on through agreement advancement makes the residual a data-loss window, not a near-miss.
- Gemini's retain-before-install filled a gap I had accepted as covered; it is not covered for the race follow-on, and the delta's publish-only retention is asymmetric in a way the corpus does not justify.
- Claude's §1.2 changed my read of D-CLOUD-099: I had read the auto-state decision as settled coverage policy; keyed per unit, it is self-defeating, and the per-file amendment is the first thing I would write into the delta.

## Provenance (as embedded; not independently re-hashed)

All paths under `research/council-runs/2026-09-11-save-history-one-home/_sources/`, manifest read_timestamp_utc `2026-09-11T19:31:42Z`:

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
| `repo/code/cloud_sync-rules.txt` | `bdb7e18128ce4a604c9b02cfe5b0f10f4e3e4dfd3aa7e

=== END kimi_peer_review.md ===

=== START mistral_peer_review.md ===

I have reviewed the four analyses (`claude-analysis.md`, `gemini-analysis.md`, `gpt-analysis.md`, `kimi-analysis.md`) against the embedded corpus. My task is to identify the strongest and weakest arguments in each, name failure modes every analysis missed, and give concrete revisions each proposal should make.

---

## 1. Strongest and weakest arguments per analysis

### `claude-analysis.md`

**Strongest argument:**
The **count bound must be keyed to the save file, not the unit** (§1.2). This is the most valuable finding in the set: the plan of record's unit definition (a hash set) is correct for the classifier but wrong for retention, and the maintainer's own example (the accidental overwrite of a manual slot by auto-state churn) is the exact case that breaks under the unit key. The argument is checkable against the corpus (`issues/22.md` R4, R9; D-CLOUD-030) and is decisive.

**Weakest argument:**
The **clock skew hazard against the age cap** (§1.6) is overstated. The seq stamp is the *retaining device's* clock, but `record.json`'s `decided_at` is only for display, and rclone sets the destination's modtime from the source on copy — so the store entry's modtime is the *save's* mtime, not the device's. A device whose clock reads 2031 therefore does not sweep every entry as expired; it writes entries every other device evicts first, but the damage is bounded and the residual is small. The hazard exists, but the analysis treats it as a showstopper rather than a residual to state.

---

### `gemini-analysis.md`

**Strongest argument:**
The **concurrent-publisher counterexample** (§2.2) is the most important hazard named in the set. Two devices can both retain the same head, both publish, and the second publish overwrites the first without retaining it — a real lost version. The analysis is correct, and the counterexample is decisive: the delta's retain-before-publish alone is insufficient for recoverability under concurrency. The experiment it proposes (two VMs, forced simultaneous publishes) is the cheapest way to settle it.

**Weakest argument:**
The **clock skew hazard** (§2.6) is the same overstatement as Claude's, but Gemini goes further and proposes a mitigation (compare against server-side modtime) that is unnecessary. The hazard is real but bounded, and the mitigation adds complexity for a residual that is already small.

---

### `gpt-analysis.md`

**Strongest argument:**
The **namespace protection hazard** (§2.1) is the most valuable single insight in the set. The delta moves the store inside the sync root, where exclusion survives only as the rule `- /.history/**` — and the shipped allowlist includes patterns that match at any depth (`+ /**/*.srm`, `+ /**/*.state*`). An old-image sync-mode backup or MATCH deletes the store's members from the cloud, shredding save bytes while leaving orphans. The analysis is correct, and the hazard is real: the store's exclusion changes from *by construction* to *by rule*, and rules files are user-editable and old images persist in a fleet. The experiment it proposes (seed a cloud with README + `.history/`, run the shipped image's backup/restore/MATCH) is the cheapest way to settle it.

**Weakest argument:**
The **auto-heal heuristic** (§2.10) is over-scoped. The analysis argues that "uniform bytes are legitimate" and that the heuristic must be format-aware, but the corpus already frames the heuristic as a cheap sufficient form (D-CLOUD-034: "a correctness fix that costs complexity, CPU or memory has to earn it"). The delta's zero-length/all-one-byte test is the cheapest sufficient form, and a false positive is recoverable by construction (the suspect is retained). The analysis treats this as a correctness hazard rather than a residual to state.

---

### `kimi-analysis.md`

**Strongest argument:**
The **old-image hazard and its self-healing migration** (§1.1, §4) is the most elegant solution in the set. An old-image sync-mode backup or MATCH deletes the store's members from the cloud, but the migration's fold of `Saves-replaced/` is made *standing* and path-aware: members landing in `-replaced/<stamp>/.history/…` fold *back* to their original `<unit>/<seq>/`. The store then self-heals through the very mechanism that threatens it, with no name-mangling of members. The argument is correct, and the solution is decisive: it answers the namespace protection hazard without requiring a fleet-wide rule file upgrade.

**Weakest argument:**
The **same-device overlap hazard** (§2.3) is overstated. D-CLOUD-093's trade (an orphaned rclone no longer holds the lock) is deliberate and safe: the reconciler holds `L_T` itself post-R1, and a reconciler killed mid-pass leaves an orphaned rclone finishing a copyto — but the copyto is idempotent, and the next pass dedupes against the newest entry. The hazard exists, but the residual (a duplicate entry) is benign and the mitigation (adding a run id to the seq) is unnecessary.

---

## 2. Failure modes every analysis missed

### 2.1 The README's own exclusion

The delta adds `- /.history/**` to the allowlist, but the root `README.md` is not explicitly excluded. The shipped allowlist ends with `- /**`, so the README falls to that and is excluded — but if a user edits the file and removes the trailing `- /**`, the README becomes in scope for transfers. An old-image restore then copies the README down to `/storage/roms/README.md`, cluttering the device with a file the player was told was hidden. The hazard is real, and the fix is one line: add `- /README.md` explicitly ahead of every include.

**Experiment:** seed a cloud with `Saves/README.md`; run the shipped image's restore with a rules file lacking the trailing `- /**`; assert the README appears locally.

---

### 2.2 The `.rocknix/` manifest folder

The plan already has one hidden folder inside `Saves` that *must* sync: `savestates/.rocknix/manifest-<id>.json` (D-CLOUD-031). The delta adds one that *must not*. The outer README must declare both, and the allowlist must treat them oppositely. The hazard is real: the manifest folder matches `+ /savestates/**` and is restored to devices today. The fix is two lines: the README must name both folders, and the allowlist must keep `- /savestates/.rocknix/**` (it is not in the shipped file).

**Experiment:** seed a cloud with `Saves/savestates/.rocknix/manifest-<id>.json`; run the shipped image's restore; assert the manifest appears locally. Repeat with the amended rules; assert it does not.

---

### 2.3 The MATCH deletion path

The menu map calls MATCH THIS DEVICE TO THE CLOUD "the only action that deletes" (`repo/docs/es-menu-map.md`). The delta's `reason: deleted` retains deletions, but MATCH's deletions go through an explicit list (the preview page), not through the classifier. The retain step must run on MATCH's deletions too, or the store loses the very bytes it exists to protect. The hazard is real: MATCH is the one action that deletes, and the delta does not say it retains those deletions. The fix is one sentence: MATCH's deletions go to `.history/` with `reason: deleted` by copy-then-delete over its explicit list.

**Experiment:** seed a cloud with a save; run MATCH from a guest missing that save; assert the save is in `.history/` with a record, not gone.

---

### 2.4 The exit sync's admission ceiling

The delta's retain-before-publish adds bytes to the exit sync's admission ceiling (R4/R5). On backends without server-side copy (SFTP/SMB), the retain streams through the device: a 30 MB PPSSPP state costs 60 MB through the handheld's Wi-Fi. The ceiling must count retain bytes, or a unit that would have cleared the ceiling for the publish alone stalls the exit sync on the retain. The hazard is real: the delta's "one small extra transfer" is two to four spawns, and the ceiling must weigh them. The fix is one sentence: the ceiling counts retain bytes, and when a unit defers, both the retain and the publish defer.

**Experiment:** seed a 30 MB state; run an exit sync against SFTP with a tiny ceiling; assert the pair defers, not only the publish.

---

### 2.5 The auto-heal fetch's budget

D-CLOUD-100's "the cloud's good copy is kept and restored" requires a fetch, and the exit path is defined as push-only (D-CLOUD-046). The delta does not say how the fetch is bounded. The hazard is real: an unbounded fetch on the exit card violates D-CLOUD-098's time-to-play budget. The fix is one sentence: *one bounded fetch per suspect unit on the exit pass*. The fetch is one unit's members, bounded, and rides the exit card — the card is exactly where D-CLOUD-098 permits spending the player's attention.

**Experiment:** truncate a save to zero; run an exit sync; assert the good copy is fetched and installed, and the fetch is bounded to the suspect unit.

---

## 3. Concrete revisions each proposal should make

### `claude-analysis.md`

1. **Drop the age cap** (§1.6). The hazard is real but bounded, and the mitigation (compare against server-side modtime) is unnecessary. The count and size caps carry the load.
2. **Add `- /README.md` to the allowlist row** (§1.1). The README is not explicitly excluded, and the hazard is real.
3. **Add the MATCH deletion path** (§1.3). MATCH's deletions must go to `.history/` with `reason: deleted`, or the store loses the very bytes it exists to protect.
4. **State the exit sync's admission ceiling counts retain bytes** (§2.6). On backends without server-side copy, the retain streams through the device, and the ceiling must weigh it.

---

### `gemini-analysis.md`

1. **Add the namespace protection hazard** (§2.1). The delta moves the store inside the sync root, where exclusion survives only as the rule `- /.history/**` — and the shipped allowlist includes patterns that match at any depth. The hazard is real, and the experiment (seed a cloud with README + `.history/`, run the shipped image's backup/restore/MATCH) is the cheapest way to settle it.
2. **Add the MATCH deletion path** (§2.3). MATCH's deletions must go to `.history/` with `reason: deleted`, or the store loses the very bytes it exists to protect.
3. **State the exit sync's admission ceiling counts retain bytes** (§2.6). On backends without server-side copy, the retain streams through the device, and the ceiling must weigh it.
4. **Drop the clock skew mitigation** (§2.6). The hazard is real but bounded, and the mitigation is unnecessary.

---

### `gpt-analysis.md`

1. **Add the self-healing migration** (§4). The delta's namespace protection hazard is real, but the migration's fold of `Saves-replaced/` is made *standing* and path-aware: members landing in `-replaced/<stamp>/.history/…` fold *back* to their original `<unit>/<seq>/`. The store then self-heals through the very mechanism that threatens it, with no name-mangling of members.
2. **Add the `.rocknix/` manifest folder** (§2.2). The plan already has one hidden folder inside `Saves` that *must* sync; the delta adds one that *must not*. The outer README must declare both, and the allowlist must treat them oppositely.
3. **State the exit sync's admission ceiling counts retain bytes** (§3.1). On backends without server-side copy, the retain streams through the device, and the ceiling must weigh it.
4. **Drop the auto-heal format-awareness** (§2.10). The delta's zero-length/all-one-byte test is the cheapest sufficient form, and a false positive is recoverable by construction.

---

### `kimi-analysis.md`

1. **Add `- /README.md` to the allowlist row** (§1.4). The README is not explicitly excluded, and the hazard is real.
2. **Add the `.rocknix/` manifest folder** (§2.2). The plan already has one hidden folder inside `Saves` that *must* sync; the delta adds one that *must not*. The outer README must declare both, and the allowlist must treat them oppositely.
3. **Add the MATCH deletion path** (§1.3). MATCH's deletions must go to `.history/` with `reason: deleted`, or the store loses the very bytes it exists to protect.
4. **Drop the same-device overlap mitigation** (§2.3). The hazard exists, but the residual (a duplicate entry) is benign, and the mitigation (adding a run id to the seq) is unnecessary.

---

## 4. Summary of revisions all proposals should adopt

| Revision | Why |
|---|---|
| **Count bound per save file, not per unit** | The maintainer's own example (auto-state churn evicting a manual slot) breaks under the unit key. |
| **Add `- /README.md` to the allowlist** | The README is not explicitly excluded, and the hazard is real. |
| **Add the `.rocknix/` manifest folder to the allowlist and README** | The plan already has one hidden folder inside `Saves` that *must* sync; the delta adds one that *must not*. |
| **MATCH's deletions go to `.history/` with `reason: deleted`** | MATCH is the one action that deletes, and the delta does not say it retains those deletions. |
| **The exit sync's admission ceiling counts retain bytes** | On backends without server-side copy, the retain streams through the device, and the ceiling must weigh it. |
| **One bounded fetch per suspect unit on the exit pass** | D-CLOUD-100's "restored" requires a fetch, and the exit path is defined as push-only. |
| **The migration's fold of `Saves-replaced/` is standing and path-aware** | An old-image sync-mode backup or MATCH deletes the store's members from the cloud; the fold absorbs anything written to `-replaced/` forever after. |
| **Dedupe against the newest entry** | If the newest store record's sha256 equals the current head's, skip the retain. |
| **Copy, never move** | A server-side *move* opens a window in which the head is absent — the unexplained-absence question D-CLOUD-037 makes the player answer. |
| **The retain and its publish are one atomic pair for deferral purposes** | When a unit defers, both the retain and the publish defer — a publish must never go out ahead of its retain. |

---

## 5. Register rows the delta must cite

The delta amends or supersedes these rows without saying so:

| Row | What the delta does | What it should say |
|---|---|---|
| **D-CLOUD-042** | Fixes the store's folder as `Saves-discarded` beside the saves folder. The delta moves the store inside `Saves/.history/` and does not cite 042. | "D-CLOUD-095 supersedes D-CLOUD-042's store-location clause." |
| **D-CLOUD-047** | Says "Propagated deletions and compactions are not retained as discarded saves; where `copy --backup-dir` proves reliable (Gate 7), the cloud's `-replaced/` sibling is their record and #25 labels them apart." The delta's `reason: deleted` retains deletions and retires `-replaced/`. | "D-CLOUD-095 supersedes D-CLOUD-047's retention exclusions for deletions; compactions still retain nothing." |
| **D-CLOUD-046** | Defines the exit path as push-only. The delta's auto-heal requires a fetch, and the exit card is exactly where D-CLOUD-098 permits spending the player's attention. | "D-CLOUD-100 refines D-CLOUD-046: one bounded fetch per suspect unit on the exit pass." |

---

## 6. The one register row to reopen

**D-CLOUD-096's age cap clause** should be reopened. The hazard is real but bounded, and the mitigation (compare against server-side modtime) is unnecessary. The count and size caps carry the load, and the age cap protects nothing they do not. The residual (a bad-clock writer's older entries mis-ordered) is small and bounded. The delta should drop the age cap, or gate it on a trusted clock.

=== END mistral_peer_review.md ===
