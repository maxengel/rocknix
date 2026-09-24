# Council run — one home for the earlier versions of a player's saves

**Topic.** A delta to the council-derived conflict-resolution plan (#11, 2026-09-05
run): move the retention store to one hidden folder inside the saves folder,
write to it on every overwriting publish, include save states, bound it by count,
age and size, auto-heal a suspect save, retire rclone's `--backup-dir`, nest the
settings. Commission and 17-source corpus: `_sources/`, `_prompts/step1-shared.md`.
Convened 2026-09-11 by the maintainer ("if we think it's worth it to do a council
run, we should do it") on the analysis in `docs/save-history-gap-analysis.md` and
the delta in `docs/save-history-plan-delta.md`.

**Roster.** claude (Fable 5.1, xhigh) · gemini (3.1 Pro Preview, high) ·
gpt (GPT-6 Astra, max) · kimi (K3, max) · mistral (Large 3). Orchestrated on
Fable 5.1 in the maintainer's Claude Code session. Every invocation through
`tools/council/run invoke` on OpenRouter; every seat identity-verified at every
step (`model-verification-log.md`, 8 gates, 8 PASS, 0 FAIL, 0 UNVERIFIABLE).

## How it went

| Step | What | Result |
| --- | --- | --- |
| 1 | five analyses | all endorse the home, retain-before-publish, retiring `--backup-dir`, one reader; amendments on the transaction shape, the per-file bound, prune-checks-the-head, and the heal's fetch |
| 2 | five reviews | GPT's correction accepted by Claude and Kimi: retain-then-publish is not compare-and-swap; Claude's catch accepted by all: the heal cannot fetch on the exit path. **kimi**'s first review came back truncated (2284 bytes after four attempts); re-invoked once, same prompt, 29,771 bytes -- both kept, logged |
| 3 | five revised plans | Claude: **store-first** (nothing becomes or leaves the head unless it is in the store); Kimi: the delta with a transaction shape and a full migration; GPT: the delta with seven amendments and a recorded residual |
| 4 | vote | **claude 3 (gemini, gpt, kimi) · kimi 2 (claude, mistral)** -- majority, margin 1 |
| 4.5 | consensus | opted in by the maintainer with the steer "optimize for time to play and minimize bandwidth and the number of back-and-forth exchanges ... while obviously balancing the sanctity of a game save"; `revised_approaches/consensus_plan.md`: base kept, 10 blockers cleared (B1–B10), 10 further provisions integrated (F11–F20), 12 conflicts stated (C-1–C-12), 13 register proposals (P-1–P-13) |
| 5 | tracker text | `final-issue-draft.md`: #134's body, #22 R1–R11 row by row, #23, #25, #21 and #135 additions, two new children (the guard image; the fold), the register proposals resolved, the document edits, and what still needs the maintainer's word |

## What it decided, and where that goes

The plan of record is `revised_approaches/consensus_plan.md`; the tracker text is
`final-issue-draft.md`, to be applied to #134, #22, #23, #25 after the maintainer's
review. The maintainer's decisions it needs are the P-rows in the consensus plan
§4.6 and the draft's closing section; they enter `docs/decision-register.md` as
the maintainer settles them (parked as D-CLOUD-101, home #134).

## Cost

`run-summary.md` (from `tools/council/run summary`). Summed from the 26
non-probe provenance attempts: prompt 1,812,872 · completion 659,144 · **total
2,472,016 tokens**; 4.2 hours of summed attempt time, about 3.5 hours of wall
clock (2026-09-11 19:30–23:00 UTC), the seats running in parallel within each step.
One orchestrator error: a Kimi retry was first launched with `--transport sse`,
which the Facilitator refused as unsupported for that seat before any request.

## Layout

`{member}-analysis.md` · `peer_reviews/` · `revised_approaches/` (incl.
`consensus_plan.md`) · `peer_votes/` · `final-issue-draft.md` · `verification/`
(genesis, seals 1–4 and 4_5) · `ledger.jsonl` · `_prompts/` (every prompt, source
manifest and per-seat log; the truncated Kimi review is
`step2-kimi-truncated-attempt.md`) · `_probe/` · `_sources/` · `run-summary.*` ·
`model-verification-log.md`.
