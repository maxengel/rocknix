# Milestone audit — "Stable before upstream", the work since #129 (2026-09-13)

The `code-auditor` skill run at milestone tier over everything that landed on `next` after
`53f390b1e9` up to `59103cd9cb` in `projects/`, `packages/`, `tools/` and `.githooks/`, and on
EmulationStation `test/qa-integration` from `52012829cf` to `3466b36af7`; against the acceptance
criteria of #45 #142 #50 #93 #47 #27 #149 #66 #67 #68 #69 #82 #113 #129 and the ten register
rows the range wrote. One orchestrator, serial, stage-gated, on Claude Fable 5.1 at `xhigh`
(the maintainer's requirement; recorded in `00-running-log.md` Phase 0). Two Facilitator seats
(Claude Fable 5.1 xhigh, GPT-6 Astra max) audited the same frozen scope from the diffs alone;
their raw outputs are under `second-opinions/`, and every finding of theirs is graded in
`04-analysis.md` § Second opinions.

| File | What it holds |
| --- | --- |
| `00-running-log.md` | the flight recorder: model, effort, every phase's entry, the moment `next` moved |
| `01-research-notes.md` | spec and issue inventory, both diffs read with 29 leads, the mechanical checks and their results, the guest reads, the avahi root cause (§ 1.3f), the provenance map |
| `02-forward-audit.md` | 65 criteria and 10 register rows, each with evidence, a refutation attempt and a verdict; the coverage boundary; the Phase 2.5 cross-check with #129 |
| `03-retrospective.md` | coherence, the three conformance faces (rules, blindspots, invariants), spec fidelity, nine interactions, eleven missing artifacts with their searches, six defect shapes enumerated to every site |
| `04-analysis.md` | the report: summary, scorecard, quality, conformance, risk, second opinions, Phase 4.5 refutation, instruction-file recommendations, self-check |
| `05-punch-list.md` | 18 items (0 Critical, 2 High, 8 Medium, 8 Low), the YAML index, the Phase 7 gate |
| `second-opinions/` | the two seats' outputs, verbatim |

**Verdict: PASS WITH FINDINGS.** 40 of 47 decidable criteria fully met. The two High findings:
the fork's `avahi-daemon.service` has never shipped (the override recipe lacks upstream's
`rm -rf ${INSTALL}/usr/lib/systemd`, so the stock unit — no ordering, no off-switch — is what
the image carries, and a guest is publishing `ROCKNIX.local` under another name); and the
generated per-unit hostname travels in the settings archive, so restoring one unit's settings
on another puts #50's collision back permanently.

Punch-list issue: [#151](https://github.com/maxengel/rocknix/issues/151). Nothing in this folder changed any code, document
outside it, or issue other than that one.
