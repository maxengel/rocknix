# Council run 2026-09-30-rasteratops-fork-plan-r2: the plan to fork ROCKNIX as rasteratops (#338)

**Problem.** The plan that gets from RC2's tree to a real 0.0.1 and beyond (#338 with #336, #337, #339, #340, #341, #334, #335, the register rows D-WORKFLOW-080 to 087): its phases and their order, what each must prove, the risks it does not name, the dependencies between the pieces, and what one maintainer with an assistant can carry. The direction itself (D-WORKFLOW-084 to 087) was settled and out of scope.

**Roster.** Definitive profile: claude (anthropic/claude-fable-5.1, xhigh), gemini (google/gemini-3.8-flash, high), gpt (openai/gpt-6-astra, max, OpenAI-pinned), kimi (moonshotai/kimi-k3, max, provider-pinned), muse (meta/muse-spark-1.3, max, Meta-pinned); council-facilitator@1.14.0 on OpenRouter; anchored on `verification-anchors/2026-09-30-rasteratops-fork-plan-r2` (receipt pushed). Reachability: `research/seat-probes/2026-09-30-muse-roster/` and run 1's Step 1. No in-run PONG probes (#343: a zero-reasoning PONG halts a run for good; run 1, `../2026-09-30-rasteratops-fork-plan/`, is that record).

**Packet.** Eleven sources, 130 KB, hashed in `source-manifest.json`, embedded verbatim by the Facilitator. One defect, noted by the claude seat and confirmed: `sources/decision-register-fork-rows.md` carries rows 080 to 087 while its title promises 088 (the row was written after the file). Every member read the same bytes; 088 (the council toolchain's adoption) is not material to the plan under review. The Step 1 brief asked what one maintainer can "sustain", which invited estimates in days; per D-WORKFLOW-091 (made during the run) those are read as size and dependency, never as dates.

**Round 1.**

| Step | Outcome |
| --- | --- |
| 1 | five analyses, identity and effort PASS, sealed |
| 2 | five peer reviews, PASS, sealed |
| 3 | five revised plans, PASS, sealed |
| 4 | five ballots, PASS, sealed: **claude 3 (gemini, gpt, kimi), gpt 2 (claude, muse)**. A majority, margin one, so Step 4.5 is offered to the owner. |

**Winner.** `revised_approaches/claude-revised_plan.md`: read before estimating (P0: the updater, the build's identity variables and every consumer of them, BUILD_ID's derivation, the licence texts, the support matrix); plumbing and custody before any release commit (P1); the identity proven on GENERIC_X64 first (P2); a migration contract rehearsed on one real handheld with real state, by the RC2 client unaided or by a documented manual path (P3); then the remaining device images from the same manifest and a release whose notes say what was verified per device (P4); everything else behind the release (P5, P6). Explicitly out of 0.0.1: the cloud folder change, the triceratops art, a new site, #340, #336 beyond a feasibility spike, the `GuiMenu.cpp` split, a manifest service, image signing. Its exit criteria are runnable checks bound to a manifest digest (§5), it names eight register rows to write (§6) and five owner questions (§7).

**Dissent carried.** From gpt's plan (the close second): the four-bucket taxonomy of every consumer of the distribution name (display text; machine identity; persisted paths and network names; boot and storage contracts); the eight-row updater behaviour table; corresponding-source and component-licence closure before publication; the estimate-invalidation predicates; the requalification rule when an ARM fix changes frozen inputs; the owner-unavailable stop rule. From muse: runnable exits with receipts; the register text for D-WORKFLOW-083; the correlated-2FA single-device risk; the redirect sunset criterion; the secret-free restore blueprint; the emergency exception to the freeze. From kimi: the asset-naming trap (an RC2 client matching `ROCKNIX-*.tar` never sees a `rasteratops-*` asset); the blocking-versus-background split of preparatory work; the mail path bypassing the redaction wrapper; the mixed-installation cloud case. From gemini: the forward-prefix rule for every new fork-owned artifact; per-target hardware qualification before an image becomes an update candidate.

**Model verification.** `model-verification-log.md`: four gates, all PASS, no FAIL or UNVERIFIABLE.

**Run summary.** `run-summary.md`: 20 attempts, 702,411 prompt and 428,532 completion tokens, 93 minutes of seat time, no usage gaps.

**Owner decisions pending** (Step 5 waits on them): accept the 3-2 winner; opt into Step 4.5, a consensus integration by the winning author carrying the dissent above; then the issue. Written 2026-09-30T15:01Z.
