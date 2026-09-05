# Model verification log

Per-break gate results. Substrate: OpenRouter via the Council Facilitator
(`tools/council/council-invoke.ts`); each row reads the per-invocation
`*.provenance.json` sibling's `final.verification`. PASS advances; FAIL or
UNVERIFIABLE halts.

| Gate | Seat | Declared | Observed | Result | Outcome | Duration |
| --- | --- | --- | --- | --- | --- | ---: |
| Setup (reachability probe) | claude | `anthropic/claude-fable-5.1 (OpenRouter, effort=xhigh)` | `anthropic/claude-fable-5.1` | **PASS** | success | 4s |
| Setup (reachability probe) | gemini | `google/gemini-3.1-pro-preview (OpenRouter, effort=high)` | `google/gemini-3.1-pro-preview` | **PASS** | success | 2s |
| Setup (reachability probe) | gpt | `openai/gpt-6-astra (OpenRouter, via openai, effort=max)` | `openai/gpt-6-astra` | **PASS** | success | 2s |
| Setup (reachability probe) | kimi | `moonshotai/kimi-k3 (OpenRouter, effort=max)` | `moonshotai/kimi-k3` | **PASS** | success | 1s |
| Setup (reachability probe) | mistral | `mistralai/mistral-large-2512 (OpenRouter primary for Mistral)` | `mistralai/mistral-large-2512` | **PASS** | success | 1s |
| Step 1 (initial analysis) | claude | `anthropic/claude-fable-5.1 (OpenRouter, effort=xhigh)` | `anthropic/claude-fable-5.1` | **PASS** | success | 948s |
| Step 1 (initial analysis) | gemini | `google/gemini-3.1-pro-preview (OpenRouter, effort=high)` | `google/gemini-3.1-pro-preview` | **PASS** | success | 96s |
| Step 1 (initial analysis) | gpt | `openai/gpt-6-astra (OpenRouter, via openai, effort=max)` | `openai/gpt-6-astra` | **PASS** | success | 1038s |
| Step 1 (initial analysis) | kimi | `moonshotai/kimi-k3 (OpenRouter, effort=max)` | `moonshotai/kimi-k3` | **PASS** | success | 565s |
| Step 1 (initial analysis) | mistral | `mistralai/mistral-large-2512 (OpenRouter primary for Mistral)` | `mistralai/mistral-large-2512` | **PASS** | success | 150s |

## Gate verdicts

- **Setup → Step 1: PASS** (5/5 identity verified, zero FAIL/UNVERIFIABLE).
- **Step 1 → Step 2: PASS** (5/5). Step 1 outputs are trusted as Step 2 input.

## Orchestrator notes (not member-visible)

- `council-run-manifest.json` was written at Setup with `provenance_contract:
  council-facilitator@1.0.0`, copied from the schema document's worked example.
  The Facilitator and the anchored genesis both declare **1.2.0**, so the lint
  refused Step 1 until corrected. Corrected after the Step 1 outputs landed and
  recorded in the manifest's `orchestrator_corrections`; the genesis binds the
  roster and verifier-pin hashes, not the manifest bytes, so the anchor stands.
  Orchestrator error, no member or identity implication.
- The `gpt` seat is **GPT-6 Astra** (`openai/gpt-6-astra`), seated 2026-09-05
  replacing GPT-5.6 Sol; probe record in `research/seat-probes/2026-09-05-astra/`.
- Coordination ran on **Claude Opus 5**, the roster's declared coordination tier,
  decorrelated from the Fable 5.1 deliberation seat.
- Step 1 durations ranged 96s (gemini) to 1038s (gpt). Gemini's analysis is the
  shortest by volume (11 KB against 47–76 KB) and was checked for substance
  before advancing: it is dense, not truncated, and raises four distinct
  failure modes. Volume is not a quality gate.

## Orchestrator verification of a disputed code claim (Step 2)

`gemini_peer_review.md` asserts that `gpt-analysis.md` misread
`SaveStateRepository::getNextFreeSlot()` and that it returns `-99` only when all
100,000 slots are full. `claude_peer_review.md` and `mistral_peer_review.md`
both hold that GPT is right. The claim is load-bearing (KEEP BOTH on an
auto-state conflict, which the schema predicts is the commonest kind), so the
orchestrator settled it against the source rather than by majority:

- `SaveStateRepository::refresh()` initialises `int slot = -1` and only
  `matchSlotFile()` assigns a slot; `matchAutoFile()` does not. An auto state is
  therefore stored with `slot == -1`.
- `getNextFreeSlot()` returns `firstslot` only when `states.size() == 0`. A
  repository holding an auto state is not empty, so that branch is skipped.
- The descending scan `for (int i = 99999; i >= 0; --i)` looks for a state whose
  `slot == i`; the auto state's `-1` matches no `i >= 0`.
- Control therefore reaches `return -99`.

**GPT and Claude are correct; Gemini is not.** Recorded here rather than injected
into any member prompt: the Step 3 prompts carry the peer reviews, so the
deliberation is already in a position to correct itself, and the orchestrator
does not put its own findings into members' mouths.

## Gate verdicts, continued

- **Step 2 → Step 3: PASS** (5/5 identity verified).
- **Step 3 → Step 4: PASS** (5/5).
- **Step 4 → r2: PASS** (5/5). Tally 2-2-1 is a genuine tie under
  `voting-rules.md` (5-member roster), so the run recurses per
  `tie-breaking-recursion.md` rather than pausing. The 1-vote outlier
  (`kimi-revised_plan.md`) stays in the candidate set.

## Round-1 vote tally (orchestrator record, not member-visible)

| Voter | Voted for |
| --- | --- |
| claude | `gpt-revised_plan.md` |
| gemini | `gpt-revised_plan.md` |
| gpt | `claude-revised_plan.md` |
| kimi | `claude-revised_plan.md` |
| mistral | `kimi-revised_plan.md` |

`gpt` 2 · `claude` 2 · `kimi` 1 → **2-2-1 tie → recurse to r2.**

The tally is deliberately absent from every r2 prompt. A vote count is an
in-band observation of the run, and SKILL.md § responsibilities item 7 keeps
those out of member prompts; telling the members which two plans led would
bias the round toward them rather than toward the evidence.

## r2 Step 2 → r2 Step 3 gate

Reviews landed 18:40–18:53 UTC. All five identity-verified through the
Facilitator (`council-facilitator@1.2.0`), no retries, no substitutions:

| Seat | Declared | Served | Result |
| --- | --- | --- | --- |
| claude | `anthropic/claude-fable-5.1` (effort xhigh) | same | PASS |
| gemini | `google/gemini-3.1-pro-preview` (effort high) | same | PASS |
| gpt | `openai/gpt-6-astra` (effort max, provider pinned openai) | same | PASS |
| kimi | `moonshotai/kimi-k3` (effort max) | same | PASS |
| mistral | `mistralai/mistral-large-2512` | same | PASS |

`verify-pins`, `verify-chain`, `verify-seals` and `lint --at-step 4` all OK
after the round.

**Gate verdict — r2 Step 2 → r2 Step 3: PASS** (5/5).

### Why no `step2-r2` seal exists

`lib/council-verification.ts::stepKeysThrough` enumerates `step1 … step4_5`,
and `expected_outputs_per_step` in the manifest carries the same four keys. The
seal and lint schemas therefore have **no round dimension**: sealing `step2` a
second time would recompute the identical r1 payload, and there is no key a
recursion round could be sealed under. Recursion-round artifacts are gated the
other two ways instead — per-invocation identity verification inside the
Facilitator, and the append-only ledger, whose chain `verify-chain` checks
across every entry including the r2 ones. Recorded here rather than worked
around, because moving the manifest's declared r1 paths onto r2 files to make
the tool emit a seal would falsify what the r1 seals attest to.

### Why the r2 prompts are assembled outside `build-council-prompt.ts`

Same root cause. The builder injects whatever `expected_outputs_per_step`
declares for the source step, so `--step 3` would inject the **r1** peer
reviews into a round-2 revision prompt. r2 Step 2 avoided this by borrowing
`--step 4` (whose source is the revised plans, which is what that round needed
to inject). No step's declared source is the r2 peer reviews, so r2 Step 3's
prompts are assembled by `_prompts/build-round-prompt.py`, which reproduces the
builder's injection format exactly — same delimiters, same trailing-whitespace
trim, same blank-line join, same roster order, same exclusion of the target
member's own artifact — and fails closed if the sibling count is wrong or the
placeholder is missing. It is run-local, not substrate; the pinned builder is
untouched.

## r2 Step 3 → r2 Step 4 gate

All five round-2 revisions identity-verified, no retries, no substitutions:
claude `anthropic/claude-fable-5.1`, gemini `google/gemini-3.1-pro-preview`,
gpt `openai/gpt-6-astra`, kimi `moonshotai/kimi-k3`, mistral
`mistralai/mistral-large-2512`. **PASS** (5/5).

Orchestrator error worth recording beside the run: both background completion
watchers were `until [ "$(pgrep -fc council-invoke)" = "0" ]` loops, and the
loop's own command line contains that string, so `pgrep -f` counted the watcher
itself and the condition could never hold. r2 Step 3 finished at 19:14 UTC and
was not noticed until 20:24. No artifact was affected; the cost was wall-clock
time. Watchers now use a pattern their own argv cannot contain
(`council-invoke[.]ts --member`).

## r2 Step 4 gate and vote tally (orchestrator record, not member-visible)

All five votes identity-verified. **PASS** (5/5).

| Voter | Voted for |
| --- | --- |
| claude | `gpt-revised_plan-r2.md` |
| gemini | `kimi-revised_plan-r2.md` |
| gpt | `claude-revised_plan-r2.md` |
| kimi | `gpt-revised_plan-r2.md` |
| mistral | `kimi-revised_plan-r2.md` |

`gpt` 2 · `kimi` 2 · `claude` 1 → **2-2-1, a second genuine tie.**

Round 1 was `gpt` 2 · `claude` 2 · `kimi` 1. The pairing rotated rather than
converging, and the roster has now cast ten votes without gemini or mistral
receiving one.

### Why this tie is not the same as the first

The r1 tie was about evidence. This one is about the **maintainer's amendment**,
which the seats read two incompatible ways:

- **gemini and mistral** read it as *build less*: `kimi-revised_plan-r2.md` wins
  because it keeps V1 to a bounded discard store and defers lineage and receipts,
  and because `claude-revised_plan-r2.md` builds a bounded lineage array to
  prevent ping-pong, "solving a problem the maintainer explicitly stated is not
  the primary case."
- **kimi** reads it as *make undo reachable*: `gpt-revised_plan-r2.md` wins
  because it is the only plan making an on-device recovery route a V1
  requirement, and `claude-revised_plan-r2.md` explicitly defers on-device undo
  to V2 — "a directory of bytes recoverable only through SSH is not a complete
  console-first escape hatch."

Both readings agree the discarded bytes must be retained by default. They differ
on whether a **control the player can press** ships in V1. That is a product
decision, not an evidence question, so it goes to the maintainer rather than to
another round of deliberation. Recorded per `voting-rules.md`'s principle that a
tie is escalated on its cause, not merely on its count.

## r3 Step 2 gate

All five round-3 peer reviews identity-verified, no retries, no substitutions.
**PASS** (5/5).

### Movement, recorded before the vote

The reviews carried D-CLOUD-032 and D-CLOUD-033 as problem context for the
first time. Build-from positions:

| Reviewer | Would build from |
| --- | --- |
| claude | `kimi-revised_plan-r2.md` |
| gemini | `kimi-revised_plan-r2.md` |
| gpt | `claude-revised_plan-r2.md` (as an editing baseline, not an approved spec) |
| kimi | `claude-revised_plan-r2.md` |
| mistral | `kimi-revised_plan-r2.md` |

Three to two, against two rounds of 2-2-1. These are review positions and not
votes; the vote is r3 Step 4. Recorded here because the orchestrator's judgement
that this round carried new information rather than churn is falsifiable, and
this is the evidence either way.

## r3 Step 3 gate

All five round-3 revisions identity-verified. **PASS** (5/5). Sizes moved the
way the amendments predicted: gpt's plan grew while shedding its version-one
undo requirement, mistral's more than doubled toward a standalone document, and
claude's and kimi's both shrank as lineage and receipt machinery came out.

## r3 Step 4 gate and vote tally (orchestrator record, not member-visible)

All five votes identity-verified. **PASS** (5/5).

| Voter | Voted for |
| --- | --- |
| claude | `gpt-revised_plan-r3.md` |
| gemini | `claude-revised_plan-r3.md` |
| gpt | `claude-revised_plan-r3.md` |
| kimi | `gpt-revised_plan-r3.md` |
| mistral | `kimi-revised_plan-r3.md` |

`gpt` 2 · `claude` 2 · `kimi` 1 — a third 2-2-1, and the same tally as r1
(r2 was `gpt` 2 · `kimi` 2 · `claude` 1).

### A disputed factual claim, settled against the plans rather than by majority

`gemini_vote-r3.md` and `mistral_vote-r3.md` make **directly contradictory
claims about the same artifacts**: whether each plan's retention store can be
read later by the maintainer's restore tool (D-CLOUD-033's requirement).
Following the precedent set for the `getNextFreeSlot()` dispute in r1, the
orchestrator read the plans rather than counting the votes.

- **`claude-revised_plan-r3.md` §3.9.1** lays the store out as
  `retained/<system>/<unit-key>/<device-id>-<seq>/` with a self-contained
  `record.json`, and states explicitly that `seq` is "a persisted per-device
  monotonic counter — **never a clock**".
- `mistral_vote-r3.md` describes that same store as "a stamp-keyed path mirror"
  that "cannot drive the later picker". **False.** A stamp-keyed path mirror is
  what `kimi-revised_plan-r3.md`'s own concession table (row C3) records as a
  defect in the *r2* design, which r3 replaced. Mistral attributes a conceded
  defect of one plan to a different plan, in the round after it was fixed.
- `mistral_vote-r3.md` then says its winner "needs only one change": adding
  `screenshot_sha256` and `screenshot_path` to `operation.json`. **Already
  present** — `kimi-revised_plan-r3.md` §3.6 lists "screenshot path + sha256"
  among the fields written before the first destructive step.
- `gemini_vote-r3.md`'s structural comparison is **accurate**:
  `claude-revised_plan-r3.md` groups by system and unit, so a reader enumerates
  one game's retained versions directly; `kimi-revised_plan-r3.md`'s
  `discarded/<operation-id>/` is flat and time-ordered, so grouping by game
  requires reading every record. Kimi's records are self-contained, so the tool
  is possible either way; the difference is a scan, not a capability.

The 1-vote outlier therefore rests on two falsified premises. `voting-rules.md`
provides no mechanism to discard a vote for being wrong (only for a self-vote),
so **the tally stands as cast** and this is recorded rather than acted on.
Setting the outlier aside would not break the tie in any case: `gpt` 2 ·
`claude` 2 remains.

### Why this tie is not the r1 or r2 tie repeating

Both earlier ties turned on something unsettled — evidence in r1, the reading of
the maintainer's amendment in r2. This one does not. The four plans agree on the
architecture, and the two finalists' remaining differences are **enumerable,
small, and liftable**:

- `gpt-revised_plan-r3.md` is better at two rules. §6.1 refuses manifest claims,
  size and mtime as overwrite authority on hashless backends outright, where
  `kimi-revised_plan-r3.md` §3.1 seeds agreement from a matching claim plus
  size and mtime — rclone's own default comparison level, which is the #53
  shape. And §3.3 makes capture independent of the exit-sync toggle, where
  kimi hooks the existing exit point that sits inside the toggle's guard.
- `claude-revised_plan-r3.md` is better at the store the maintainer asked for
  (above), at the lifecycle gate (an `flock` whose descriptor the emulator child
  inherits, so the lock survives ES dying — marked `[K]` with a named fallback),
  and at the amendment-compliance test (a test-only reader run after the
  producer's manifest entry is overwritten, slots renumbered, the audit log
  rotated and the pending record removed).
- Its costs are **removals**: four rclone spawns on the watched exit path where
  the fourth buys a manifest-last commit point `gpt-revised_plan-r3.md` argues
  is not load-bearing, and a `resolves` receipt `gemini_vote-r3.md` says should
  go under the one-step-back rule.

**The two finalists' own author seats each voted for the other.** `claude` voted
`gpt`; `gpt` voted `claude`. That is not incommensurability — it is two strong
documents whose differences are the exact material Step 4.5 exists to integrate.

**Orchestrator recommendation: stop recursing and take a maintainer decision on
the base, then run Step 4.5.** The r5 cap permits two more rounds, but r3
reproduced r1's tally exactly, and the remaining deltas are liftable rules
rather than architectural disagreements — the condition
`tie-breaking-recursion.md` names as "more recursion adds cost without adding
signal". Declared conflict of interest: the orchestrator (Opus 5) is not the
`claude` seat (Fable 5.1), but the recommendation below favours that seat's
plan, and the maintainer should weigh it knowing that.
