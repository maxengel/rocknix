# Code Auditor — Anti-Patterns & Quality Standards

Guardrails against the ways audits go wrong. Review before starting, and check against after finishing.

---

## Anti-patterns

| Anti-pattern                               | Why it's wrong                                                  | Instead                                                                                                                |
| ------------------------------------------ | --------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| **Rubber-stamping**                        | Marking everything PASS without reading code                    | Read every file, trace every criterion to evidence                                                                     |
| **Assuming completion**                    | "The issue is closed, so it must be done"                       | Verify independently — closed ≠ complete                                                                               |
| **Summarising without evidence**           | "The code looks good" with no file references                   | Every finding must cite specific files and lines                                                                       |
| **Batching notes**                         | Reading 10 files then writing one summary                       | Write after EACH file/criterion examined                                                                               |
| **Being helpful instead of accurate**      | Softening findings to avoid conflict                            | State findings precisely — the punch list is for fixing, not feelings                                                  |
| **Skipping cornerstone evaluation**            | "This is just a small change"                                   | Every audit includes cornerstone conformance — no exceptions                                                               |
| **Inventing acceptance criteria**          | Adding criteria the spec didn't define                          | Audit STATED criteria; suggest additions in punch list                                                                 |
| **Delegating terminal ops to subagents**   | Subagents don't inherit terminal access                         | Use `bash` tool directly for `git`, `npm`, `gh` commands                                                               |
| **Unbounded `gh` output**                  | Large output can destabilise the terminal                       | Always pass `--limit N --json <fields>` or pipe through `\| head`                                                      |
| **Using `gh` CLI for list/search**         | Known to crash agent runners in this repo                       | Use GitHub MCP (`mcp_github_*`)                                                                                        |
| **Heredoc body for issue creation**        | Newlines + quoting hazards in terminals                         | Use `--body-file` pointing at the punch list path                                                                      |
| **Missing cross-system interaction audit** | Single-subsystem testing hides intersection bugs                | Phase 3.5 is mandatory for any infrastructure change                                                                   |
| **Silently skipping criteria**             | Missing rows in the scorecard = hidden gaps                     | Every AC gets a verdict, even if UNTESTABLE (document why)                                                             |
| **Verdict from subagent summary**          | Subagents can fabricate plausible content (2026-05-19 incident) | Subagent output is a lead; re-read the primary artifact before any verdict                                             |
| **Tracker-state-only PASS evidence**       | Issue closed / AC box checked proves intent, not implementation | Every PASS cites a primary artifact: file:line, command output, or commit diff                                         |
| **Silently dropping mandatory sections**   | A missing scorecard/cornerstone/coverage section is invisible drift | The Quality Self-Check table in 04-analysis.md records present/absent per section; an artifact-contract lint enforces it (if the repo provides one) |

---

## Quality standards for audit artifacts

All output files (00–05) must meet these standards. Before marking the audit complete, self-check against each — and RECORD the result in the `04-analysis.md` Quality Self-Check table (an unrecorded self-check is indistinguishable from a skipped one):

| Standard           | Requirement                                                             | Self-check                                                               |
| ------------------ | ----------------------------------------------------------------------- | ------------------------------------------------------------------------ |
| **Traceability**   | Every finding links to a source (spec section, issue number, file path) | Can I follow every finding back to its evidence?                         |
| **Evidence-based** | No finding without evidence — file paths, line numbers, git commits     | Any vague assertions?                                                    |
| **Reproducible**   | Another engineer reading the audit could verify every finding           | Would a second auditor reach the same verdicts?                          |
| **Actionable**     | Punch list items are specific enough to implement without ambiguity     | Could an engineer pick up PL-NN and start work with zero back-and-forth? |
| **Complete**       | Every stated acceptance criterion is evaluated — none silently skipped  | Do the criterion IDs in the scorecard match the set in the spec/issue?   |

---

## Red flags during audit

If you find yourself doing any of the following, stop and course-correct:

- Writing "LGTM" anywhere
- Skipping cornerstone evaluation "because the change is obvious"
- Marking SKIP ○ without documenting where the descoping decision is captured
- Finding more than 5 UNTESTABLE ? — that suggests the spec's acceptance criteria are weak; flag to the user rather than continuing
- Writing a punch list item where "Where" is a directory, not a file:line
- Writing a punch list item where "Acceptance" is "fix the thing" rather than a verifiable outcome
- A PASS criterion entry with no "Refutation attempted" line
- A Critical/High finding carrying a hedge ("which suggests…") — Phase 4.5 should have pinned it
- Running the audit for >1 context without having written anything to `00-running-log.md` (milestone scope)

---

## When to stop and escalate

Escalate to the user — don't push through — if you discover:

- **The spec itself is ambiguous or contradictory.** You cannot audit against criteria that aren't crisp. Ask for clarification.
- **Multiple fundamental spec violations in the first few criteria.** The work may be at a stage where an audit is premature. Recommend returning to implementation.
- **Scope dramatically exceeds what was planned.** If the implementation does 3× what the spec described, the audit scope needs redefinition.
- **You uncover a BLOCKER that affects production.** Pause the audit; notify the user immediately with the specific finding and risk.
- **You find evidence of work claimed complete that isn't started.** The audit's context may be wrong; confirm with the user before documenting systematic gaps.
