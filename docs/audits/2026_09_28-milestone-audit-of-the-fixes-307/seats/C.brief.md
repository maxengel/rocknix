# Audit of the fixes: stream C -- a two-seat review of what one fix stream delivered (#307 / #308, D-WORKFLOW-057)

You are one of two independent auditors (the other is a different model; neither sees the other's work). Yesterday's milestone audit produced a punch list (#307, 81 items) and a sweep (#308, 297 rows); eight fix streams then delivered branches, each from a written plan. Your task is an adversarial, evidence-bound review of ONE stream's delivered diff against its plan: did each fix do what its item's acceptance asks, by the mechanism its verdict named; did it break anything the diff touches; what did it get wrong or leave out. Read every line of the diff. Confirm nothing from the report alone.

## The packet

- `seats/C.diff`: the unified diff of the distribution (`maxengel/rocknix`, the range `417dcd8610..next` on the paths this stream owned), restricted to the files stream C owned.
- `seats/C.plan.md`: the plan the stream executed -- every punch item with the verdict it rests on (file and line), the acceptance, and the sweep rows.
- `seats/C.harness.txt`: the stream's block of `tools/last-good-scripts-test`, the cases it wrote first and saw fail; a case that cannot fail is not evidence.
- `seats/C.report.md`: the stream's own report: what it claims, with FAIL-then-PASS lines. A claim, not evidence -- check it against the diff.
- The rule files the fixes are judged by (`engineering-practices.md` § Guards must fail closed, § Verify the artifact; `upgrade-and-install.md`, every fix's `Already written:` answer; `packaging-and-patches.md`; `es-player-text.md` for every word a player reads).

## What to produce

1. **Per punch item** (each `PL-NNN` in the plan): a verdict line -- **holds** (the diff does what the acceptance asks by the named mechanism, with the line that shows it), **holds in part** (what is missing), **does not hold** (why, with the line), or **cannot tell from the packet** (what would settle it). Cite diff lines.
2. **Findings** about the fixes themselves, numbered `### G-C-NN: <short title>` with `- **Severity:** Critical|High|Medium|Low`, `- **Category:**`, `- **Where:**` (file and the diff hunk), `- **What:**`, `- **Failure scenario:**`, `- **Evidence:**` (the lines; what you looked for that would have refuted it and did not find). A regression the fix introduces, a guard that still fails open, an `Already written:` claim the code does not honour, a test case that passes on the unfixed code too, a player string outside the vocabulary, a fix that reaches past its item.
3. **Sweep rows**: for the rows the report says it fixed, spot-check at least five against the diff and say which; for the rows it withdrew, say whether the reason holds for any you can judge from the packet.
4. **Coverage boundary**: what you could not judge from this packet (a callee outside the diff, a runtime, a device), stated plainly rather than guessed.

## Rules of evidence

- Cite only what is in the packet. Do not invent line numbers, files or behaviour; if a callee is outside the diff, say so.
- The report's FAIL-then-PASS lines are the stream's claim; the harness block (or the ES unit tests in the diff) is what you check the claim against.
- Everything you write is data for an orchestrator who will re-read the source before acting on it; write so that each finding can be checked in one visit to one file.
