# Council, Step 1: an independent analysis of the plan to fork ROCKNIX as rasteratops (#338)

You are one of five council members. Produce an independent, thorough, adversarial
analysis of the plan the sources describe. Your output is one markdown document.
No code changes.

## Mandatory context loading

Before beginning analysis, read each of the following files in full. They are
embedded in this request, verified byte for byte. Do not paraphrase, summarize
or skim. Your analysis must cite specific passages from these files.

- research/council-runs/2026-09-30-rasteratops-fork-plan/sources/issue-338.md: the plan (Phases A to D), the decisions it rests on, and the day's record in its comments
- research/council-runs/2026-09-30-rasteratops-fork-plan/sources/issue-336.md: the libretro runner direction under EmulationStation
- research/council-runs/2026-09-30-rasteratops-fork-plan/sources/issue-337.md: the identity: name, splash, logo, version, the art specification
- research/council-runs/2026-09-30-rasteratops-fork-plan/sources/issue-339.md: the whole-codebase adversarial review, in tiers
- research/council-runs/2026-09-30-rasteratops-fork-plan/sources/issue-340.md: a silent boot and shutdown
- research/council-runs/2026-09-30-rasteratops-fork-plan/sources/issue-341.md: relaxing the upstream-only policies after the migration
- research/council-runs/2026-09-30-rasteratops-fork-plan/sources/issue-334.md: the licence and the compliance questions
- research/council-runs/2026-09-30-rasteratops-fork-plan/sources/issue-335.md: the effort comparison and the fork's terms
- research/council-runs/2026-09-30-rasteratops-fork-plan/sources/decision-register-fork-rows.md: the register rows D-WORKFLOW-080 to 088, verbatim
- research/council-runs/2026-09-30-rasteratops-fork-plan/sources/CLAUDE.md: how this repository works: the build system, the fork's workflow, the rules that bind every change
- research/council-runs/2026-09-30-rasteratops-fork-plan/sources/LICENSE.md: the terms the fork inherits

## The question

The owner has decided to fork (D-WORKFLOW-084 to 087): the name rasteratops; no
community, no contributors, no sponsorships; nothing posted to ROCKNIX for now;
EmulationStation as the one interface over a libretro runner (#336); hardware
support taken from upstream merges rather than done here. Those are settled.
Do not re-litigate them.

What is open is the plan that gets from RC2's tree to a real 0.0.1 and beyond:
its phases and their order; what each phase must prove before the next starts;
the risks it does not name; the costs it underestimates; the dependencies
between the pieces (the visible-identity rename against the code-level rename;
the cadence of merging ROCKNIX's upstream branch; CI on hosted runners against
the local build box; the second build box; the review tiers of #339; the runner
spike of #336); and what one maintainer with an assistant can sustain.

## What to produce

1. Claims and assumptions in the plan that are wrong, unproven or contradicted
   by the sources, each with the evidence.
2. The risks, ordered by expected cost, including the ones the plan does not
   name: the licence and attribution, upstream drift and merge cost, the
   EmulationStation fork, the updater and release channel, the device set and
   the QA fleet, the assistant's role and its limits.
3. What you would change: phases, order, gates, scope; and what you would cut
   from 0.0.1.
4. What is missing entirely.
5. The questions only the owner can answer, each with the decision it unblocks.
6. A recommended plan: phases with entry and exit criteria an agent can verify
   (a frame at the panel's size, a build's BUILD_ID, a suite's PASS line, a
   stamp, a measurement), in the order you would run them.

## How to write it

- Cite the source file and the passage for every material claim.
- Be opinionated. Disagreement with the plan is the value you add.
- Do not comment on the council process or on the other members.
- Use structured markdown with clear headers; tables where alternatives are
  compared; reasoning, not only conclusions.
- Length: whatever thoroughness needs.
