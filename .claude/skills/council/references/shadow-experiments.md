# Shadow council experiments

A shadow evaluates a roster without changing the definitive decision. It remains
a complete five-seat council; it is never a reduced run or a sixth ballot.
The `definitive` profile holds Claude, Gemini, GPT, Kimi and Muse Spark 1.3
(scaffold#915, owner ruling 2026-09-27). The `grok-shadow` and `deepseek-shadow`
profiles replace only the fifth member, with Grok 4.7 or with DeepSeek V4 Pro 0813
served by CoreWeave. Their authority is always `non-binding`: a shadow winner
cannot authorize implementation or change the definitive roster.

## The fifth-seat evaluation (standing campaign)

The owner's words, relayed on scaffold#915: "promote one and have the other two as
shadow participants, and do this for a number of council runs, and then evaluate if
we need to switch the seats at the table." The rulings fixed the rest: Muse Spark
1.3 promoted; "CoreWeave only" for DeepSeek; "Five runs" before the review.

- **Every definitive council during the evaluation runs both shadow arms**, on the
  same frozen sources and templates (§ Controlled execution). The definitive arm's
  outcome stands on its own; the shadows only measure.
- **The count is five definitive runs whose three arms all complete.** A run
  counts once its definitive, `grok-shadow` and `deepseek-shadow` arms each finish
  Step 4 with five valid ballots. A run whose shadow arm fails still delivers its
  definitive result but does not count; record the failure. The count is of runs,
  never a calendar window.
- **The campaign record** lives with the estate that runs the councils: one entry
  per counted run naming its three run IDs, the frozen source manifest and brief,
  process/settings versions and the comparison below. Keep source facts separate
  from interpretation, as the eval insight-log process does.
- **After the fifth counted run, the owner reviews the seat.** The review compares
  the three fifth-seat models across the five runs and the owner decides whether to
  keep Muse, promote a shadow, or change a shadow. Until then, and until the owner
  decides, the roster does not change. The evaluation neither adds a sixth vote nor
  enables a reserve.

## Before running

1. Record the owner's experiment authorization (for the standing campaign, the
   rulings on scaffold#915), the three run IDs, baseline ID, frozen source manifest
   and brief, process/settings versions, evaluation rubric and exclusions in the
   campaign record.
2. Use the canonical Facilitator recipes and installed profile projection. Every
   arm has exactly five members. Do not use `OPENROUTER_MISTRAL_MODEL` to disguise a
   candidate, alter an anchored roster or silently switch providers/models.
3. Each run manifest sets `council_profile`. Each shadow must include:

   ```json
   {
     "experiment": {
       "schema_version": "council-experiment@1.0.0",
       "campaign_id": "YYYY-MM-DD-fifth-seat-evaluation",
       "baseline_run_id": "YYYY-MM-DD-topic",
       "decision_authority": "non-binding"
     }
   }
   ```

   The definitive arm may carry the same experiment metadata with authority
   `definitive` and its own run ID as baseline. `roster_contract` comes from
   `rosterIdentity(root, profile)`; never hand-author a competing recipe table.
   Genesis binds profile and experiment metadata. Changing either requires a
   fresh genesis; summaries derive authority from the installed profile.
4. Verify the exact route, model identity, supported effort and complete-request
   capacity for every stage before execution. A catalog entry or PONG is not a
   full-request proof. Preserve failed attempts. Staged reading is not qualified
   for any OpenRouter-only member (Muse, Grok, DeepSeek). The smallest window across
   the three arms is Grok 4.7's 500,000 tokens: a shadow request that does not fit
   is a recorded capacity failure for that arm, and the definitive arm's reading is
   never trimmed to suit a shadow.

## Controlled execution

All three arms use the same frozen sources and substantive task/step templates,
with the incumbent four recipes unchanged. Each arm starts five fresh independent
analyses. Never share their outputs across arms, seed a late fifth opinion or reveal
comparative results before all arms finish. Subsequent peer inputs naturally differ
because the deliberations differ. Retain separate genesis, manifests, ledgers, seals,
prompts and summaries.

The three fifth-seat recipes request their model's highest advertised native effort:
Muse `max`, Grok `xhigh`, DeepSeek `max`. Each reserves 131072 output tokens; the
incumbent four retain their own recipes. This measures each supported model
configuration, not equal compute or equal latent reasoning. A ceiling failure is
evidence to diagnose; no silent reduction or selective retry to improve a score. No
user-facing experiment framing or national/cultural persona is added to the shared
substantive prompt.

## Comparison and authority

Predeclare evidence fidelity, distinct valid objections, missed material risks,
quality of revisions, whether peer criticism changed the plan, vote/convergence
patterns, qualitative clarity and tone, completeness, reliability, latency and
cost where provider usage is available. Preserve dissent even when its author
receives no votes. Model-blind review of final artifacts can reduce preference
bias; retain the private identity mapping and all provenance.

Supplier origin and jurisdiction are separate selection considerations, never
inferred from writing style. The owner's preference for Mistral's EU origin is
recorded and is why Mistral returns for evaluation when a larger-window version
ships; none of the three current candidates is EU-origin. The DeepSeek arm is
pinned to a US-headquartered provider with declared US datacenters. Never prompt a
model to imitate a nationality or assert where an inference route is hosted beyond
what the provider declares. Test actual responses for diversity.

One run is descriptive: different stochastic outputs and native reasoning settings
prevent attributing every difference to the replaced seat. The five-run count gives
the owner a pattern to review, not statistical proof. Publish every arm and failure,
not just a preferred winner. Only an explicit owner decision changes the definitive
roster, through canonical delivery.
