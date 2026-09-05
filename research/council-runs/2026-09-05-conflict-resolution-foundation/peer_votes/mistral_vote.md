I vote for **kimi-revised_plan.md**.

## Reasoning

The kimi plan is the safest and most buildable foundation for the milestone. It makes the fewest assumptions, closes the most gaps, and sequences the work so the cheap experiments that could invalidate the design run before the expensive building. Three things set it apart:

1. **It protects player progress above all.** The cardinal rule is that no save is lost and resolution never defaults to recency. The kimi plan is the only one that:
   - **Never propagates deletions in V1** (F8), closing the gap my Step 1 named and `gpt_peer_review.md` proved was missing from the conflict table.
   - **Certifies uploads by download-and-hash on hashless backends** (F4), closing the #53 failure shape that `gpt_peer_review.md` rightly called out as a blindspot in my "size-plus-relist" shortcut.
   - **Preserves both sides of every race** (F9), adopting `mistral_peer_review.md`'s demand that concurrency mitigation preserve competing bytes rather than merely logging a lost update.
   - **Makes the discard store load-bearing in V1** (F7), so a mistaken choice in the wizard is recoverable — the only plan to treat this as a requirement rather than a refinement.

   The other plans each have one silent-overwrite path: claude's `--backup-dir` archival is not a guard against a lost race (its §3.7.4 admits the residue); gemini's `--update` stopgap is refuted by `102-cloud-saves`' restore-then-backup ordering; gpt's staging mirror is not a protection against a concurrent overwrite (its §4.7 admits the same residue).

2. **It is grounded in the corpus.** Every claim about the shipped code, EmulationStation's helpers, rclone's behaviour and the register's decisions is correct, and every hypothesis is labelled as such with an experiment named. The plan:
   - **Correctly reads the ES primitives** (`gpt-analysis.md` §1.8 refuted my Step 1 endorsement of `getNextFreeSlot()`/`copyToSlot()`; kimi's F6 checked adapter is the only plan to treat them as naming/allocation primitives that need hardening, not as transaction primitives).
   - **Correctly scopes the manifest amendments** (D-CLOUD-031 is refined, not reopened; the five F2 amendments are the minimal set needed to close the gaps `gpt_peer_review.md` §5.4 and `claude_peer_review.md` §6 named).
   - **Correctly prices the staging mirror** (the nothing-changed game-exit path stays zero-remote-contact, and the wizard's cloud-side screenshot source, KEEP BOTH materialisation source, discard-store source and upload-certification input all ride the same staging pass — one mechanism, four consumers, zero extra round trips).
   - **Correctly sequences #10** (shipping `es_savestates.cfg` hard-codes `racommands = false` and flips `autosave`/`incremental` defaults — a launch-behaviour migration nobody budgeted, not a config change; kimi defers the directory move past the wizard and gives it its own futro with a launch-behaviour rehearsal).

3. **It sequences the work so the cheap experiments run first.** The plan gates enabling the wizard's apply step on a shadow-mode census that measures fork frequency per kind (step 8.8), and gates the merge adapter on a small target-side test that proves the allocator's failure cases (step 8.2). The bisync spike (step 8.3) is framed as a candidate transfer-engine candidacy test, not as a detector design gate — the manifest test is the sole classifier regardless of the spike's outcome. The round-trip suite (step 8.7) runs only after the harness is repaired (step 8.0), and the 480×320 recognition test (step 8.9) runs only after the RG351M is available. This is the only plan to treat the harness repair as a prerequisite rather than a follow-up.

## Dissent

The losing plans each have one critical safeguard that kimi does not fully absorb:

- **claude's `--backup-dir` archival** (its §3.7.3) is the only plan to treat every cloud overwrite as recoverable, not just the ones that lose a race. Kimi's F9 contract preserves the loser of a race, but not the loser of a one-sided overwrite that the detector misclassified. The safeguard is real, but it is priced: a changed unit can require a remote evidence read, a protected-publication batch, canonical transfer, and verification. Kimi's discard store is cheaper (it rides the staging mirror, zero extra round trips) and covers the commonest case (a mistaken choice in the wizard), but it does not cover a detector misclassification.
- **gpt's publication receipts** (its §4.7) are the only plan to prevent resolution ping-pong after a reflash or first run. Kimi's F2.1 `origin` sub-object is additive and cheap, but it does not bind a resolution to the exact operand hashes and resulting locations — so a second device still holding the exact discarded version can still see "cloud changed → download" and silently reverse an explicit choice. The safeguard is real, but it is priced: a receipt is a small JSON object that must be published and preserved, and the current per-device manifest is not the right place for it (two devices would write one file). Kimi's F4 agreement scoping and F9 recheck-before-overwrite mitigate the ping-pong, but they do not close it.
- **gemini's one-way interim posture** (its §4) is the only plan to treat the maintainer as the only user at risk until the wizard ships. Kimi's F5 retains D-CLOUD-029 and offers the same configuration note (disable the boot pair and the SYNC row via the existing toggles, leaving only the exit upload), but it does not make the posture the default. The safeguard is real, but it is a maintainer operating choice, not a product property.

## Remaining defect in the winner

The staging mirror's residual risk (F3) is stated, not hidden: on a hashless backend the staging skip keys on size alone, so a same-size cloud-side change is invisible until the next size-changing event on that path. The priced alternative (download-and-hash the whole tree every pass) is rejected on budget. This is the only plan to treat the risk as a residual, not as a solved problem.

The risk is bounded: the staging pass is recent by construction, and the wizard re-stages the conflicted paths at COMPLETE — so a same-size change that matters (a conflict) is caught before apply. The risk is also characterised: the bisync spike (step 8.3) and the round-trip suite (step 8.7) both include same-size SRAM mutation fixtures, so the frequency and impact are measured before the wizard ships.

The defect is real, but it is the cheapest of the four plans' residual risks.