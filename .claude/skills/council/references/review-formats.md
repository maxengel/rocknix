# Review formats

Choose the purpose before the roster. Member count alone does not define the
procedure, its completion evidence or its authority.

| Format | Use when | Required work and result |
| --- | --- | --- |
| Three-model preliminary review | A prepared issue, requirements packet or draft needs bounded readiness questions before authoring. The request or issue workflow explicitly selects this advisory scope. | Claude, Gemini and GPT independently inspect the same inputs once. The coordinator verifies provenance, checks material source claims and synthesizes findings, unresolved decisions and proposed cases. No vote, approval or council-completion claim. |
| Five-member council | A contested design needs selection, structured adversarial deliberation is required, or the user or acceptance criteria request a council. | Claude, Gemini, GPT, Kimi and Muse complete the prescribed council stages and verification gates. A missing or unverified member halts advancement; no reduced-roster fallback. |
| Council research | Fresh research is required before formal deliberation. | The council-research phases, including its conditional prior-run evaluation, retain all five members and their prescribed evidence. A preliminary review cannot substitute for any phase. |

Cross-cutting documentation can start with the preliminary format to expose
questions about trust, identity, permissions, lifecycle or service boundaries.
Settled requirements stay settled. If a finding exposes a contested platform
claim, prepare that decision for the five-member council before treating the
claim as accepted. Advice may inform a draft; it does not establish acceptance,
authority, implementation correctness or deployed behavior.

A request for a formal council always uses five. Time, price, context pressure
or a failed Kimi/Muse request cannot convert it into a preliminary review.
Historical three-member evidence retains its actual scope; adding two later
opinions does not retrospectively complete the formal pipeline.

## Shared seats and identity

`readPreliminaryReviewContract()` in `scripts/lib/council-roster.ts` projects
Claude/Gemini/GPT from the same installed recipes that `readRoster()` uses for
the formal council. There is no preliminary-review model table or effort tier.
Model ID, effort, output ceiling and provider routing are shared. Seat changes
belong in the canonical Facilitator and travel with accountable pins and tests.

The contract records `review_kind: preliminary-review`,
`decision_authority: advisory` and `formal_council_complete: false`.
`assertPreliminaryReviewContract()` rejects changed format, authority, members
or recipes. Formal run admission rejects this contract, even if someone appends
two seats. These checks verify configuration, not performed review work.

## Preliminary-review procedure

1. Record the selected format, purpose, immutable source manifest, brief and
   authorization for provider use. Preserve complete inputs; refresh a source
   packet explicitly rather than silently changing a previous authorization.
2. Run the installed pin, declaration and supported-effort checks. Save the
   contract from `readPreliminaryReviewContract()` as `review-contract.json`
   in a distinct `research/preliminary-reviews/<run-id>/` directory and validate
   it with `assertPreliminaryReviewContract()`. Record the source revision.
   This is not a council genesis, council run manifest or vote.
3. Invoke each of the three seats through `scripts/council-invoke.ts` with
   `--provider openrouter`, the same brief and `--source-manifest`. Use the
   installed retry policy. Retain outputs and Facilitator provenance verbatim.
   Never use a direct provider wrapper, a substitute model or a second seat's
   answer to fill an unavailable member.
4. After each successful call and before the next member, check its output,
   served-model identity, declared effort, source hashes and output hash. Run
   the strict provenance/digest lints when installed; otherwise perform and record
   the same checks directly against the Facilitator receipts. Before synthesis,
   verify all three files. A skipped or empty scan is not a passing gate. If using their
   `phase-1-research/<member>/analysis.md` filename convention, record that it is
   only a checker-compatible layout, not a claim that council research occurred.
5. Source-check material findings and identify unsupported recommendations.
   Publish a clearly labeled preliminary synthesis: readiness to draft, remaining
   questions, proposed cases and owner boundaries. Completion requires all three
   verified critiques plus this synthesis; retain failures if the review holds.
6. Revalidate the saved contract before reporting completion. State separately
   what remains for any formal council, human decision, runtime testing and
   adoption. The coordinator does not turn advisory findings into an approval.

The contract can be generated without provider access:

```sh
node --input-type=module -e 'import {readPreliminaryReviewContract} from "./scripts/lib/council-roster.ts"; console.log(JSON.stringify(readPreliminaryReviewContract(), null, 2))' > review-contract.json
node --input-type=module -e 'import {readFileSync} from "node:fs"; import {assertPreliminaryReviewContract} from "./scripts/lib/council-roster.ts"; assertPreliminaryReviewContract(JSON.parse(readFileSync("review-contract.json", "utf8")))'
```

See [member roster](member-roster.md), [council pipeline](pipeline.md) and
[council-research](../../council-research/SKILL.md) for their full procedures.
