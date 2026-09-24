# Milestone Audit Running Log — The release-candidate round (work since #186)

**Auditor:** Code Auditor skill v1.10.0, one orchestrator, serial and stage-gated. The forward phases (1-5) run in a fresh Claude Fable 5.1 agent (`model: fable`, the session's `xhigh` effort inherited) that did not implement the work; the implementing session verifies every lead against the primary artifact before Phase 6 and closes Phases 6-7. Recorded per the maintainer's requirement (2026-09-13) that audits run on Fable 5.1 at xhigh or max.
**Started:** 2026-09-24 02:00 UTC
**Scope:** distribution `next` `95e4961fb3..443028ff7a` (482 commits; the fork's own -- `--author='Max Engel'` and the fork paths -- in `projects/`, `packages/`, `tools/`, `.githooks/`, `.github/workflows/fork-*`; upstream merges in the range are out of scope except where the fork resolved a conflict); EmulationStation `test/qa-integration` `ae9c7d56b..75ca1dac2` (73 commits; the RC-6 pin of 2026-09-14 to the seventeenth cut's pin).
**Spec:** the issue bodies on `maxengel/rocknix` (no `docs/planning/`): the RC round #236 and every issue opened or closed since 2026-09-14 (30 closed), `docs/decision-register.md` rows D-UI-057 .. D-UI-084, D-QA-030 .. D-QA-040, D-WORKFLOW-024 .. 028, D-RA-*, D-CLOUD-*, `docs/blindspot-register.md` 41-52.
**Prior audits:** #186 (`docs/audits/2026_09_14-epic-offline-retroachievements/`, epic tier), #151 (`2026_09_13-milestone-stable-before-upstream/`), #129 (`2026_09_12-milestone-cloud-saves-since-60/`).
**Maintainer's scope words (2026-09-24):** *"a full code audit using the code auditor's skill and being very rigorous to make sure comment quality, etc., are all well defined and executed."* Comment quality -- every comment says what the code cannot, is true of the code beside it, and names the issue and decision where one exists -- is a face of the retrospective.
**Punch list:** fixed at every severity before the candidate is called one (D-WORKFLOW-015, D-WORKFLOW-016).
**Constraints:** read-only on code, on docs outside this folder, and on issues except the Phase 6 issue; no handheld; the QA guests read-only (guest d is up on `443028ff7a`); credential values never printed; `--limit` on every `gh` list.

---

## Log Entries

### [Phase 0] 02:00 — Setup, skill freshness, scope frozen

- The implementing session (Claude Fable 5.1, `claude-fable-5-1`) ran Phase 0: `diff -q` of `SKILL.md` and `references/phases.md` in the worktree against `next:` -- SAME.
- Scope frozen at `443028ff7a` (the seventeenth cut, green on vm-qa run 23 and the rehearsal; not on a device). The RG35XX SP runs `aa8d525a8a`. Nothing in scope moves while the audit runs; a device staging on the maintainer's yes does not mutate the code scope.
- The fork's own commits in the distribution range: `git log --author='Max Engel' 95e4961fb3..443028ff7a -- projects packages tools .githooks .github/workflows` (the agent enumerates them in Phase 1.3 and records the count).
- The forward phases are delegated to a fresh Fable agent for independence (the implementer of this range is this session). Its outputs are leads; every verdict-supporting fact is re-read here before Phase 6.

### [Phase 0] 02:15 — Forward-phase agent starts; model, grounding, freeze check

- Agent model per its own system prompt: **Claude Fable 5.1 (`claude-fable-5-1`)**; a fresh agent that did not implement the range. Working directory is the `conflict-resolution` worktree (`feature/conflict-resolution`, clean), used only as a shell cwd.
- Skill freshness: `diff -q` of `SKILL.md`, `references/phases.md`, `references/templates.md`, `references/anti-patterns.md` between the worktree copy, the primary copy and `next:` -- all SAME. Grounding is read from the primary `/workspace/repos/rocknix` (branch `next`).
- The worktree's `.claude/rules/` is STALE against the primary: 8 rule files absent (`ceremonies`, `change-log`, `es-code-traps`, `es-player-text`, `es-ui-style-guide`, `handheld-evidence`, `least-surprise`, `player-language`, `time-to-play`, `vm-first`, `working-principles`) and 11 differ; `CLAUDE.md` differs too. All rules and `CLAUDE.md` are read from the primary, never from the worktree (instruction-files.md).
- Primary HEAD is `a9f503f4`, past the frozen `443028ff7a`. Next: enumerate `443028ff7a..HEAD` to confirm nothing in the code scope moved after the freeze; every file read for a verdict is taken at `443028ff7a` (`git show 443028ff7a:<path>`), and mechanical checks that need a working tree are run in the primary only once the post-freeze commits are shown to be outside `projects/`, `packages/`, `tools/`, `.githooks/`, `.github/workflows/`.

### [Phase 1.3] 02:25 — Range enumerated, freeze verified, research notes opened

- `443028ff7a..HEAD` = 5 commits, 7 files, all `docs/` -> the primary's working tree equals the frozen tip on every code path; mechanical checks may run there.
- Distribution: 134 fork commits / 96 files (brief's numbers confirmed). ES: 108 commits with merges, 108 files, +8571/-1463.
- `01-research-notes.md` created with §1.0 (grounding, rules in scope by glob) and §1.3 (both repos' history, file groups). Next: the spec (#236), the bounded issue lists, the registers, the primary's rules.

### [Phase 1.2] 02:40 — Issues inventoried; registers read

- 30 closed / 83 created since 2026-09-14 (bounded lists). Recorded in §1.2 with the note that most RC-cut targets are still OPEN — a closing-discipline question for Phase 3, evidence question for Phase 2.
- Blindspot register 1–48 read (the file's tail 49–52 next); decision rows dated in the window read (D-CLOUD-129..134, D-RA-005..027, D-UI-057..084, D-QA-030..040, D-WORKFLOW-024..028).
- Primary `CLAUDE.md` read (the worktree copy is stale on the rule index, the PR recipe, the principles).

### [Phase 1.4/1.5] 03:05 — Doctrine read; provenance map; research fan-out launched

- All 27 rule files read or diffed from the primary; blindspots 1–52 and the window's decision rows read. Notes §1.4 lists the constraints that bind the forward audit (comment-quality face, the three-list tool registration, the seen-to-fail rule, D-UI-078/079/083/084, D-WORKFLOW-024, the change log and menu map checks).
- §1.5 provenance map written with verdicts sequestered. Red flag: #186's punch index never received its Phase 7 outcomes (32/33 `open`) though the issue was closed as delivered — Phase 2 re-derives each PL from code.
- Four read-only research subagents (Fable) launched, one per area (A offline RA, B save states/captures/crash, C cloud/Wi-Fi/logging/French/foreground, D tools/packaging/merge/ceremonies). Their output is leads; nothing from them enters a verdict unread.

### [Phase 1.7] 03:40 — Mechanical checks run and recorded

- 28/28 pkgcheck OK; last-good-scripts-test PASSED; register/vocabulary/index/ceremony/menumap/untranslated all exit 0; unit tests 119/1302 green; guest d on `443028ff7a`.
- Three leads: `fork-package-freshness` exit 1 (raofflineproxy 16 behind, unpinned); `es-syntax-check --tree` 3 FAILs that look like the tool's header farm (isolating without `--tree`); host lacks `msgfmt` (trying the build root's). Six non-ASCII comment hits to triage against the range and the xgettext invocation.

### [Phase 1.7b] 03:55 — Leads isolated

- msgfmt from the build root: clean (1944 messages). es-syntax-check's 3 FAILs: byte-identical headers, differing mtimes, objects present in the build tree -> a tool false positive (fails closed), recorded as a lead. Two in-range non-ASCII comments (`acd7a6fee`), harmless to xgettext by position. Freshness: raofflineproxy 16 behind, unpinned. Four tools missing from instruction-files.md's table. The tip's vm-qa (12 PASS, frame-diff 0 boxes) and rehearsal (19/19) read from the report files.
- Waiting on the four research agents; nothing of theirs is in the notes yet.

### [Phase 1 — correction] 02:58 — Earlier timestamps were estimated; the clock is read from now on

- The entries stamped 02:15 through 04:35 above were written between 02:15 and 02:31 UTC (the files' mtimes); their hour:minute values after 02:25 were estimates, not readings. From this entry every stamp is `date -u +%H:%M` at the moment of writing.
- The session was interrupted by a spend limit and resumed at 02:58 UTC on the coordinator's word. Of the four research agents, three reported (A offline RA, B save states, D tools/packaging); C (cloud/Wi-Fi/logging/French/foreground) died without a report and its area is covered by the orchestrator directly. No further subagents are spawned.

### [Phase 1.4.5] 03:00 — Three research reports read as leads; area C taken in hand

- Read in full: A (offline RA, 22 issues + #186's 33 PL items with claiming commits), B (save states/captures/crash, 15 issues), D (tools/packaging/merge/ceremonies, 19 issues; the merge's three re-added guards; the package table; the tools table). Every verdict-bearing fact in them is re-read from the artifact below before it is used.
- Area C (#45 #47 #102 #115 #152 #153 #157 #177 #178 #182 #187 #191 #192 #198 #201 #203 #204 #208 #210 #241): fetched directly, bounded.

### [Phase 1.6] 03:05 — Research checkpoint written

- §1.10 records every lead verified from the artifact (file:line), and the Research Summary closes Phase 1 with seven red flags for Phase 2. Phase 2 begins: criteria are the issues' own `- [ ]` lines, quoted from the bodies fetched today; verdicts written per issue, document-as-you-go, into `02-forward-audit.md`.

### [Phase 2] 03:09 — Forward audit opened; #186's 33 items re-derived

- `02-forward-audit.md` created; section P written: 25 PASS, 4 PARTIAL, 1 FAIL (PL-11, the rocknix.org draft still says B backgrounds the scan), 1 reversed (PL-07 by D-UI-078), 3 UNTESTABLE.
- Next: sections D (tools/packaging/process), B (save states), A (offline RA), C (cloud/Wi-Fi/UI), then the summary and coverage boundary.

### [Phase 2] 03:19 — Sections D, A and B written

- D (52 entries), A (32), B (37) are in `02-forward-audit.md`. New findings from primary reads: F-B05 (clean install copies `es_savestates.cfg` -- `userconfig-setup:13` excludes only the two upstream files; guest d shows the copy, `/storage/.configured` 21:11, the installed `/usr/share/post-update` has the three-file loop so an update repairs it), F-B17 (`cloud_capture --retire --unlink` deletes a path it refused to record), F-B32 (the crash handler LOGs under a `std::mutex` and can hang), F-D51 (the `next` push gate keyed on the pushing worktree), F-D23 (freshness red at the tip), F-A30 (`EX_USAGE` undefined), the comment-quality set (three stale pins, `D-RA-0xx`, the corekeep header, the doc draft, three WI-FI SSID comments).
- Next: section C (cloud/Wi-Fi/logging/French/foreground/password), the summary, the coverage boundary, Phase 2.5.

### [Phase 2] 03:23 — Section C, the summary and the coverage boundary written

- 347 boxes: PASS 184, PARTIAL 54, FAIL 1 (PL-11), SKIP 76, UNTESTABLE 32 (26 of them a handheld's word). Overall PASS WITH FINDINGS.
- Phase 2.5 opens now: the prior audits' verdicts for #175/#176/#183/#184 (#186) and #45/#47 (#151) are read only after these entries were written.

### [Phase 2.5] 03:27 — Prior verdicts cross-checked

- Six overlaps agree; five disagree and every disagreement is explained by a fix or a decision that landed after the prior audit (#183's RC-7 fix, #45's zip path, #47's #151 punch items, D-QA-033). Recorded in `02-forward-audit.md` § Prior-verdict cross-check.
- Phase 3 begins: `03-retrospective.md`.

### [Phase 3] 03:34 — Retrospective written

- `03-retrospective.md`: coherence (the D-UI-078 seam), the three faces (rules table, blindspots 1-52, invariants), spec fidelity by register row, the comment face (≈3,700 added comment lines; 10 shapes, 32 sites, 17 in one reversal), eight interactions, fourteen missing artifacts with searches, eleven defect shapes traced to every site. Phase 4 begins.

### [Phase 4] 03:39 — Analysis written; Phase 4.5 refutations recorded

- `04-analysis.md`: summary, per-issue scorecard (347 boxes; 184/239 decidable fully met), quality, conformance, fidelity, risks, coverage, the refutation of all eight Medium findings (none Critical/High), five codification patterns, Tier B, the self-check. Mitigation search for F-04: `essway.service:14 Restart=always` (on exit), no `WatchdogSec` in any unit -- a hang is not restarted. Phase 5 begins.

### [Phase 5] 03:40 — Punch list written; the artifact contract linted

- `05-punch-list.md`: 30 items (0 Critical, 0 High, 8 Medium, 22 Low) with the YAML index, a pre-existing-tracked-scope section (18 open boxes and issues this audit re-confirmed, exempt from the Phase 7 gate) and two upstream observations. `tools/lint-audit-artifacts <folder>` first reported two shape failures (the scorecard heading's spelling; `## PL-` level-2 headings) -- both fixed in the audit files; re-run exit 1.
- Phases 6 (the issue) and 7 (the resolution gate) are the orchestrator's, as briefed. Nothing outside this folder and `/workspace/tmp/rocknix-session/es-unit-build-audit` was written; no device was touched beyond read-only ssh to guest d; no credential value appears in these files.

### [Phase 5 — correction] 03:41 — PL-015 reworded after reading the lint

- The lint (`tools/lint-audit-artifacts:66-87`) reads a Phase 7 outcomes *table* in the punch list, not the YAML index; #186's table is complete (that is why it PASSes) while its index says `open` ×32. PL-015 and its six mentions (01, 02 ×2, 03 ×2, 04 ×2) now say "the index disagrees with the table and the lint checks only the table". The 30 lint lines on this folder are the same Phase 7 check on a punch list whose outcomes are the orchestrator's to record; the structural checks pass.

### [Phase 4.6] 15:53 — The second opinion graded; the totals corrected

The GPT seat's run (05:49 UTC, 1,125 s, `openai/gpt-6-astra` from the provider response, effort max) read and graded row by row against the tree at `c041be7e98`: 9 confirmed (PL-031..PL-039), 6 re-graded, 2 disagreements with the artifact (G-05, F-29), 1 evidence note (G-09). G-11 held: the headline 347 / 184 / 32 was not the sum of the scorecard's rows (352 / 195 / 27) nor of the forward audit's per-section subtotals (346 / 188 / 27); the rows are the count from here, the 04 headline and this log's earlier figures are superseded (lines 84 and 98 above stand as written), and `tools/lint-audit-artifacts` now sums every **Total** row. The nine fixes are the twentieth cut, building as `c041be7e98` (ES `d30cbd282`).
