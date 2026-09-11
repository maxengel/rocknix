**Winner: `kimi-revised_plan.md`.**

## Why kimi, in one paragraph

Judged on the brief's order — progress first, then grounding, buildability inside D-CLOUD-098, sequencing, simplicity — `kimi-revised_plan.md` is the plan a small team could take into #22/#23/#25 as written with the fewest ways to lose a copy and the clearest statement of what is load-bearing, what ships with the store, what can wait, and which cheap experiment (E1–E8) would invalidate each design assumption before anything expensive is built. It concedes its own Step-1 errors by name (the TOCTOU "fails safe" claim, the clock-independent count, the modtime mitigation, the fabricated `reason: replaced` on imports), and every closure it adopts is costed against D-CLOUD-034. It reopens the fewest binding rows (D-CLOUD-041/046/047/100 as refinements, #22's C1 narrowly, D-CLOUD-042 as a citation fix) and explicitly declines to reopen D-CLOUD-052, -099, -097, -032 and -036's range. `gpt-revised_plan.md` is the closest competitor and is in several places *safer*, but it buys that with machinery the brief tells me to discount (a causal-revision shared-settings protocol, per-entry completion receipts, a pruning contract that must be *proved* on a two-pruner fixture) and it partially reopens the maintainer's same-day auto-heal ruling. `gemini-revised_plan.md` is a correct list of adoptions with no migration of the existing set-asides and no transaction shape. `mistral-revised_plan.md` has grounding errors that would mislead the implementer.

## Kimi against each of the other three

### Against `gpt-revised_plan.md`

Where gpt is stronger, and I want that recorded (see Dissent): member-relative paths inside an entry instead of R9's basenames; completion as a fact separate from the record; the two-pruner contract; "a suspect cloud head is never installed over a known good local copy"; the MATCH inventory with an honest refusal to invent its direction; planner validation of reserved paths independent of any filter file.

Where kimi is the better plan to *adopt as written*:

- **Simplicity of the shared-settings answer.** Both see the real problem (`claude_peer_review.md`'s point, as both cite it): a count of 3 on device A prunes what device B at 9 was told is kept. Kimi's answer is one manifest field already read on every pass (D-CLOUD-045) plus `max()`. gpt's answer is a causal-revision protocol with pending offline edits, "ON wins and larger count wins" for incomparable changes, and a later edit that supersedes both — and gpt itself says "the exact manifest field design is an implementation prerequisite." D-CLOUD-034 says the cheapest sufficient form wins; kimi's is cheaper and, with the drawer-device caveat I record below, sufficient.
- **Fidelity to D-CLOUD-100.** The maintainer ruled auto-heal for *both* patterns ("zero length or all one byte"). Kimi keeps the heal for the uniform case and fixes what is actually wrong with it — the once-message asserts damage as fact (D-CLOUD-077) — and adds the second-time escalation from `gemini_peer_review.md` so an intentional erase is not fought forever. gpt turns the uniform-at-full-size case into a wizard question, which is a reopening of a same-day ruling and adds a question to a flow the maintainer wants to be quick (D-CLOUD-033). gpt argues it by ID, which is permitted; kimi's is closer to what was decided and just as safe for the bytes.
- **Protecting the deliberate loser at shallow counts.** Kimi keeps "the newest N routine entries *plus* the newest `reason: discarded` entry." gpt reserves the deliberate loser *within* the allowance and says plainly that at a count of one it will not also preserve the routine preimage. Under criterion 1 that is a policy path in gpt that drops a copy; kimi's N+1 does not.
- **Sequencing.** Kimi §7 separates *load-bearing* (get it wrong and a player loses a save or waits) from *ships with the store* from *can follow later*, and §8 names eight experiments with the hazard each is expected to reveal on the shipped image first (E1's "expected result written as the hazard"). gpt's §10 is a release-gate table — necessary evidence, but framed as what must be true before shipping rather than what to run before building. The brief's criterion 4 asks for the latter.
- **Two catches gpt lists only as gaps.** Kimi puts the `--delete-excluded` audit in the body as a requirement with an experiment (E2): if any shipped command or user `RCLONEOPTS` passes it, `- /.history/**` becomes a deletion instruction against the store. gpt mentions it only in its provenance gaps. Kimi also requires the README be written only after the destination is validated so a housekeeping write cannot create the misspelled root D-CLOUD-085/091/092 exist to catch.

### Against `gemini-revised_plan.md`

Gemini adopts the right things (retain-on-fetch, top-of-file exclusions including `- /README.md`, standing fold, copy-not-move, per-file count, pub-chain ordering, soft caps, admission ceiling counting retain bytes, bounded heal fetch) and states three honest hypotheses. But adopted as written it fails the commission on two of its five questions and has one drop-a-copy path:

- **No answer to Q4 (migration).** Its only migration item is the *repair* fold of `-replaced/<stamp>/.history/...`. Nothing folds the existing legacy stamps into the store, and the local `/storage/.cache/cloud_sync/replaced/` is never mentioned — yet the shipped `cloud_restore` comment says that folder can hold the newer local save an older cloud copy replaced (`repo/code/cloud_restore-set-aside-excerpt.md`). Worse, §1.2 says the reconciler "folds them back ... and deletes the legacy `-replaced/` folder": if the folder is deleted after folding only the nested items, the un-folded legacy stamps in it are lost. That is the path the brief says disqualifies an elegant store.
- **No answer to Q2's interruption cases.** There is no transaction shape (bytes-first, record-last), no interrupt-point walkthrough, no statement of what an entry without a record means to #25. Kimi has all three.
- **Ungrounded assertion.** "Because MATCH bypasses the standard classifier" is not in the corpus; `repo/docs/es-menu-map.md` shows only that MATCH is "the only action that deletes." Kimi and gpt both say the call path is a gap.
- **No bounds precedence.** Gemini trust-gates the age cap but never resolves "never a game's only copy" against 256 MiB — the arithmetic that gpt and kimi both name.

### Against `mistral-revised_plan.md`

Mistral has the right skeleton and a few primitives worth keeping (below), but it would mislead the implementer in ways that touch binding rows:

- **§5 lists AGE CAP and TOTAL SIZE CAP as rows in the SAVE HISTORY submenu**, and says "the settings page" states they are soft. D-CLOUD-096 and D-UI-039 say those caps "are ours, not rows." Adopted as written this stacks two rows the maintainer removed.
- **§7 is self-contradictory**: it cites D-CLOUD-077 and gpt's intentional-erasure point, then keeps the wording "was damaged when the game closed" — the exact assertion the point was about. It also makes the detector "format-aware," the broader validator gpt withdrew and the maintainer did not ask for.
- **§9's mitigation is ungrounded**: "Retain and verify in the background after the card says the player may go (D-CLOUD-038)." Retain precedes publish by the plan's own row 2; nothing can be retained after the sync has reported done, and D-CLOUD-038 is the launch gate, not a background-work permission.
- **§11 reopens D-CLOUD-052** for the concurrency residual. D-CLOUD-052 is the transport verdict; the residual lives in R5/D-CLOUD-046. Kimi explicitly and correctly does *not* reopen 052.
- **§12 item 4 adopts a refuted claim** — that the auto rule "overwrites any existing slot 4." `issues/23.md` says the cloud's resume point goes "in the next free numbered slot" and reserved slots are rechecked at COMPLETE. gpt refutes this; kimi does not repeat it.
- **§10's "release gate: upgrade both devices before syncing"** is a player-facing instruction about our internals; the commission calls a prompt a failure mode. gpt and kimi treat the mixed-fleet boundary as a release-engineering problem, not a player message.

## Dissent — what the winner must absorb from the losing plans

By filename, so the synthesis can pick these up:

**From `gpt-revised_plan.md`:**
1. **Member-relative paths, not basenames.** R9's "members at their basenames" can collide inside a multi-directory unit (the PPSSPP directory case D-CLOUD-036 defers to the census; the N64 saves the allowlist now admits at two depths, D-CLOUD-086). Kimi calls payload naming "a backward-compatibility choice"; it should be a requirement. One overwritten member is a dropped copy.
2. **Completion is a separate fact from the record.** Kimi's record is the commit point and is written before the publish; if the publish never completes the record says `replaced` about a version that is still the head. Add a completion marker (or `applied: pending` until verified) so #25 never labels an attempted replacement as a completed one.
3. **The two-pruner contract** (gpt §5.6): only explicit completed entry IDs are deletion targets, never a recursive purge of a unit; uncertainty about ordering, listings or last-usable-copy yields retention; if the properties cannot be shown on the two-pruner fixture, destructive cleanup is disabled and the overrun reported. Kimi says pruning is full-pass under `L_T`, but `L_T` is device-local and two devices' full passes can prune concurrently.
4. **A suspect cloud head is never installed over a known good local copy.** Kimi covers both-suspect and no-good-counterpart; it does not state the asymmetric case.
5. **MATCH THIS DEVICE TO THE CLOUD inventoried into R1** without inventing its direction, and **planner validation** that reserved paths never appear in a saves transfer or deletion list regardless of a custom filter — the D-CLOUD-088 refinement (users control which saves; not the namespace guard).
6. **Idempotent import receipts and a fresh 90-day grace** for imports (gpt §6.5 steps 4–6). Kimi's "stamp time untrusted → never age-pruned" achieves the grace indirectly but leaves legacy entries first in line for size pruning and gives the importer no retry ledger.
7. **D-CLOUD-093 refinement:** quiesce the operation's process group before admitting another live-tree writer or a game; a released lock is not proof that rclone's children stopped. Kimi has the experiment (E5) but not the requirement.
8. **Walker audit:** `cloud_capture` and every whole-tree operation must distinguish live saves from control metadata. Kimi has E7 as an experiment; make it a requirement.
9. **Audit lines for ordinary retains and prunes**, not only heals (D-CLOUD-027 lineage).

**From `gemini-revised_plan.md`:**
10. **Soft-cap disclosure.** Because pruning runs only on full passes, an exit-only device overshoots count and size between passes; the README and the public page must not promise a hard ceiling, and the admission ceiling must not block a publish because the store is temporarily oversized. Kimi implies this (§2.4) but does not require the wording.
11. **`- /README.md` at the top** — kimi has it (row 4, credited to mistral); noting that gemini's placement "at the absolute top" is the right position.

**From `mistral-revised_plan.md`:**
12. **Own-manifest witness before any retention write** (mistral §2 item 4, originally `kimi_peer_review.md`'s): a cloned card (R7, A11) must refuse before writing store entries for a publish it will not make. Kimi's revised plan does not state this ordering explicitly; gpt's Guard phase does.
13. **A named label for `reason: legacy`** in #25 (mistral's UNKNOWN). Kimi says "their own honest label" without naming it.
14. **The startup sync's backup half now retains too** (mistral §12 item 3): the boot pass gets longer, raising cancellation probability under D-CLOUD-072/076. Kimi's completion-rate measurement (§6) covers the consequence; the cause should be named in the plan.

## Remaining defects in `kimi-revised_plan.md` to fix before it is built

1. **Basename layout** (dissent item 1) — mandate member-relative paths or a member map in the entry.
2. **Record-before-publish truthfulness** (item 2) — add the completion fact.
3. **Orphan sweep by age.** Row 2 sweeps record-less entries "once older than the maximum bounded retain duration," but kimi's own §1.3 says no ordering rule may lean on modtime until E3 lands, and no other timestamp exists for an orphan. As written, a second device could sweep the members of a retain that is in flight from a slow or wrong-clocked device. Sweep by run-id liveness (the `<run-id>` now in `<seq>`) or after a trusted observation, never by copied modtime.
4. **Fleet-max on settings** has a drawer-device residual: a handheld unused for a year pins the fleet's count at 9. Either accept and state it, or weight a manifest by its `published_at` freshness (D-CLOUD-045) — still one field and a comparison.
5. **Two concurrent pruners** (item 3) — adopt gpt's minimal contract.
6. **Witness before retain** (item 12) — make explicit.
7. **Suspect cloud head** (item 4) — state it.
8. **One loose cost claim:** "on backends with server-side copy, copy and move cost the same" is stated as fact in row 2; it is E3's hypothesis and should be labelled so in the row.
9. **Exit-card framing:** "the exit card — where D-CLOUD-098 permits spending the player's attention" reads `repo/rules/time-to-play.md` loosely; the rule says rigour belongs *after the card has said the player may go*. The heal fetch is defensible because a launch cancels it (D-CLOUD-076) and the card names it (D-CLOUD-077) — say that, not that the card is a permitted cost.
10. **Row 5 label:** kimi proposes MANAGE SAVE HISTORY over the delta's SAVE HISTORY on the submenu-carries-the-verb rule; the words are the maintainer's and `repo/docs/es-menu-map.md` must move in the same change (D-UI-039). Flag, not decide.

None of these changes kimi's shape; each is a paragraph in a row, and all fail toward retention. That is why it is the safest plan to hand to the maintainer as the change to #22, #23 and #25.