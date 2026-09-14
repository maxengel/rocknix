# Epic audit — "Offline RetroAchievements" (#163), the sixth candidate's content (2026-09-14)

The `code-auditor` skill run at epic tier over the offline-RetroAchievements work at the state of its two feature branches — distribution `feature/round-notes-rc5` `cee1656c33` (on `next` `95e4961fb3`) and EmulationStation `feature/round-notes-rc5` `ec2de8ae7` (on `test/qa-integration` `df9d88171`) — against the acceptance criteria of #163 #164 #165 #166 #167 #168 #172 #173 #175 #176 #179 #180 #183 #184 and the register rows D-RA-001..016, D-UI-053..055, D-WORKFLOW-020/021/022, D-QA-016, D-INFRA-010/011. One orchestrator, serial, stage-gated, on Claude Fable 5.1 at `xhigh` (recorded in `00-running-log.md` Phase 0), with the maintainer's seven questions (credentials, fail-closed, upgrade and clean install, concurrency, wording, cost, enhancements) answered in `03-retrospective.md` §§ 3.7–3.12. The Facilitator's GPT seat (`openai/gpt-6-astra`, effort max, provider pinned) reviewed the same findings from a self-contained brief; its output is under `second-opinions/` and graded in `04-analysis.md` § Second opinion.

| File | What it holds |
| --- | --- |
| `00-running-log.md` | the flight recorder: model, effort, every phase's entry |
| `01-research-notes.md` | the spec and issue inventory (64 criteria numbered), both trees' changes, the rules that apply, eight red flags |
| `02-forward-audit.md` | every criterion with evidence, a refutation attempt and a verdict; the mechanical checks run; the coverage boundary |
| `03-retrospective.md` | coherence, the three conformance faces, spec fidelity, nine interactions, ten missing artifacts with search trails, seven defect shapes to every site, and the maintainer's seven questions — including the cost table for 100 and 1,000 games |
| `04-analysis.md` | the report: summary, scorecard, quality, conformance, risk, coverage, the second opinion, the Phase 4.5 refutation (one High killed, one reduced), instruction-file recommendations, the self-check |
| `05-punch-list.md` | 33 items (0 Critical, 2 High, 19 Medium, 12 Low) — 22 the orchestrator's, 11 the GPT seat's confirmed additions, the YAML index, the Phase 7 gate |
| `second-opinions/` | the GPT seat's output and provenance, verbatim |

**Verdict: PASS WITH FINDINGS.** The mechanism works end to end and is proven on the VM in every shape D-RA-007 named; every fork guard fails closed for its reader; no credential the fork handles reaches a log, a stamp, a backup or a bundle. The two High findings are what patch 004 (no cap) left unbounded in the upstream client: an hourly re-fetch of every cached game (≈48,000 requests a day per device at 1,000 games) and a 60-day eviction that removes the rows RetroArch loads a game through while keeping the ones that count it "ready".

Punch-list issue: [#186](https://github.com/maxengel/rocknix/issues/186). Nothing in this folder changed any code, any document outside it, or any issue other than that one.
