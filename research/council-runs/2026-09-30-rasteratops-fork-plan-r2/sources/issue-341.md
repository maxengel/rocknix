# Issue #341: After the migration: relax the policies that existed for upstream (attribution, one commit per PR, the size ceiling, the plumbing ban, the personal-paths guard) and keep the process that is ours

Opened 2026-09-30T02:07:41Z

**Maintainer, 2026-09-30 (chat, D-QA-012):** *"once we migrate the code, we can remove some of the policies we have in place to remove AI leftovers and simplify our process, to instead make it easier for us to have those workflows."*

**The policies that exist only because of upstream**, each named so the migration can decide it (a register row per change, citing the row it relaxes):

| Policy | Where it lives | Why it existed | After the migration |
| --- | --- | --- | --- |
| No assistant named anywhere upstream-bound: no footer, no `Co-Authored-By`, no mention in a PR or commit (D-WORKFLOW-078) | `.githooks/pre-push` (the `pr/*` scan), `tools/pr-stack-check` (the drafts' scan), the `release-notes` skill | the ROCKNIX developers' complaint | keep only for the generic fixes that still go to other projects; the fork's own repositories may carry the trailer and the footer as they like |
| One commit per PR on the base, no stack (D-WORKFLOW-079) | the same hook and checker | the same | the fork squash-merges its own PRs; the rule becomes "one purpose per PR", which is quality, and the count is no longer refused |
| The reviewable-size ceiling (1,500 lines, 30 files) in the map | `docs/pr-series/map.txt`, the checker | ROCKNIX's median of 18 lines | dropped for the fork's own work; kept as a number for anything sent to another project |
| Descriptions in the maintainer's voice, no fork plumbing, no templates (D-WORKFLOW-074 extended) | the checker's scan, `tools/prose-check` on `docs/releases/pr/`, the skill | a reviewer who cannot open the fork's issues | the voice stays (it is the project's), the plumbing ban goes: the fork's own PRs may cite its issues, tools and decision IDs, which are its readers' |
| The series map and the by-content branch building (D-WORKFLOW-071, `pr/*`) | `docs/pr-series/`, `tools/pr-stack-check`, `fork-workflow.md` | a PR series to a project that is not ours | retired with the series; the tool stays for the generic fixes |
| The personal-paths guard (`PERSONAL_PATTERNS`: `.claude/`, `docs/`, the fork's tools kept out of upstream PRs) | `.githooks/pre-push`, `fork-workflow.md` | the same | retired for the fork's own repositories -- the records and the tools are the project's, in its tree, in the open |
| The AI-usage answer on a PR template | ROCKNIX's template | their transparency ask | the fork's own template says what the project is, once, in `CONTRIBUTING.md` |

What is **not** upstream's and stays: the register, the work logs, the blindspots, the ceremonies, the suites, the proofs, the first person singular in what is published, the vocabulary, the rules about devices and yeses. Those are the process the maintainer trusts (D-WORKFLOW-082).

## Acceptance criteria

- [ ] After the repositories are transferred (#338 Phase B), one change relaxes the rows above: the hook's `pr/*` scans keep only the personal-paths and credential checks the fork still wants, the checker's drafts scan and count become warnings, the skill's PR section says which rules are for other projects' PRs, and `fork-workflow.md` describes the fork's own PR flow -- each with its register row citing the relaxed one.
- [ ] `tools/rules-check`, `tools/register-check` and the push guard's own proofs pass after the change (the constructed violations re-run, the ones that still refuse named).

