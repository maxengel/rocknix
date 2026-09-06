# Council run — the foundation for cloud-save conflict resolution

**Topic.** The foundational approach for milestone *Cloud Saves: Visual
Conflict Resolution* (epic #11): what detects a conflict, what identity a save
has, who owns the writers, how a decision is applied and kept, and in what
order the unmeasured parts get measured. Problem statement and the 42-source
corpus: `_sources/`, `_prompts/step1-shared.md`.

**Roster.** claude (Fable 5.1, xhigh) · gemini (3.1 Pro Preview, high) ·
gpt (GPT-6 Astra, max) · kimi (K3, max) · mistral (Large 3). Orchestrated on
Opus 5. Every invocation through `tools/council/run invoke`; every seat
identity-verified every step (`model-verification-log.md`).

## How it went

| Round | Step 2 | Step 3 | Step 4 tally |
| --- | --- | --- | --- |
| r1 | 5 reviews | 5 plans | gpt 2 · claude 2 · kimi 1 — tie |
| r2 | reviews of r1 plans | `*-r2` | gpt 2 · kimi 2 · claude 1 — tie, on two readings of the maintainer's amendment |
| r3 | with D-CLOUD-032/033 | `*-r3` | gpt 2 · claude 2 · kimi 1 — tie; three seats report no architecture left to choose |
| r4 | liftable vs architectural | `*-r4` | **claude 3 · kimi 2 — majority**, chosen by the three seats that did not write it |
| 4.5 | — | `revised_approaches/consensus_plan.md` | base adopted whole; 4 blockers cleared; 26 primitives integrated and priced; 7 conflicts listed |
| 5 | — | `final-issue-draft.md` | the handoff as tracker text, against D-CLOUD-032…040, D-UI-022/023 |

Two disputed factual claims were settled by the orchestrator against the source
rather than by majority (`getNextFreeSlot()` returning −99; the r3 votes'
contradictory claims about the retention stores). Both are in
`model-verification-log.md`, with the tallies, which were never shown to a seat.

## What it decided, and where that went

The plan of record is `revised_approaches/consensus_plan.md`. The maintainer's
decisions it needed are D-CLOUD-032 through D-CLOUD-040, D-UI-022 and D-UI-023
in `docs/decision-register.md`. The tracker text is `final-issue-draft.md`,
applied to #11 and its children after the maintainer's review.

## Cost

`run-summary.md` (from `tools/council/run summary`) is right about durations
and wrong about tokens: it reports `usage_unavailable` for every attempt because
it reads a usage field the Facilitator does not write, and it walks only the
four declared steps and 4.5, not the recursion rounds. Summed from the 72
provenance files, which carry the real counts:

| | tokens |
| --- | ---: |
| prompt | 13,822,750 |
| completion | 1,756,272 |
| **total** | **15,579,022** |

Wall clock: about ten hours, 2026-09-05 17:30 UTC to 2026-09-06 03:30 UTC, of
which roughly seventy minutes were two self-matching completion watchers that
never fired (logged in the verification log as an orchestrator error).

## Layout

`{member}-analysis.md` (r1) · `peer_reviews/` · `revised_approaches/` ·
`peer_votes/` — `-r{N}` suffixes for recursion rounds · `verification/`
(genesis, seals for the declared steps) · `ledger.jsonl` · `_prompts/`
(every prompt and per-seat log; `build-round-prompt.py` assembles recursion
rounds, which the pinned builder cannot) · `_probe/` (seat probes) ·
`council-run-manifest.json` (with `orchestrator_corrections`).
