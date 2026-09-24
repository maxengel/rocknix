# Milestone Audit Running Log — Stable before upstream (work since #129)

**Auditor:** Code Auditor skill, one orchestrator, serial and stage-gated
**Model:** Claude Fable 5.1 (`claude-fable-5-1`), session effort `xhigh` — recorded per the maintainer's requirement that this audit run on Fable 5.1 at xhigh or max effort
**Session:** https://claude.ai/code/session_01LkFLXE5GsT1apn8AwrxrGR
**Started:** 2026-09-13 05:49 UTC
**Scope:** Milestone "Stable before upstream" — distribution `next` `53f390b1e9..59103cd9cb` in `projects/`, `packages/`, `tools/`, `.githooks/`; EmulationStation `test/qa-integration` `52012829cf..3466b36af7`; issues #45 #142 #50 #93 #47 #27 #149 #66 #67 #68 #69 #82 #113 #129; decisions D-CLOUD-008, D-CLOUD-123, D-NET-002, D-NET-003, D-UI-050, D-UI-051, D-WORKFLOW-010/013/014, D-QA-016
**Spec:** the issue bodies on `maxengel/rocknix` (there is no `docs/planning/`), `docs/decision-register.md`
**Prior audit:** #129 (`docs/audits/2026_09_12-milestone-cloud-saves-since-60/`)
**Second opinions:** two Facilitator seats (Claude Fable 5.1 xhigh, GPT-6 Astra max) auditing the same frozen scope in parallel; read before Phase 4, verified before use

---

## Log Entries

### [Phase 0] 05:49 — Model check and skill freshness

- System prompt names the model: Fable 5.1, id `claude-fable-5-1`. Effort `xhigh`. Proceeding.
- `diff -q` of `SKILL.md`, `references/phases.md`, `references/templates.md`, `references/anti-patterns.md` in the worktree against `next:` — all four SAME. No sync needed.
- Primary checkout `/workspace/repos/rocknix` is on `next`, clean, HEAD `81a5f81e58` (two docs commits past the scope's upper bound `59103cd9cb`; both are frames/work-log, outside the frozen code scope).
- A previous orchestrator was stopped in Phase 2 and its folder deleted; nothing of it is on disk. Starting fresh.
- Constraints carried: read-only on code, docs outside this folder, and issues (except the Phase 6 issue); no handheld, no real cloud account; QA guests read-only with credential filtering.

### [Phase 1.1-1.2] 05:55 — Spec and issues read

- There is no `docs/planning/`; the spec is the 14 issue bodies (fetched to the scratchpad as JSON, read in full) plus the register rows. Counted the ticked/unticked acceptance boxes per issue as the AC inventory for Phase 2.
- Issue states: #45 OPEN (5 of 6 ticked; hardware box open), #142 CLOSED completed (4/4), #50 OPEN (5 of 7; two LAN/handheld boxes open), #93 CLOSED (2/2), #47 CLOSED completed with **1 of 5 boxes ticked** — four criteria unticked on a closed issue; must be examined, not assumed (issue-tracking.md closing discipline), #27 CLOSED (2/2), #149 CLOSED (2/2), #66 OPEN (5/6), #67 OPEN (4/8), #68 OPEN (5/6), #69 OPEN (4/6), #82 OPEN (3/4), #113 OPEN (3/4), #129 CLOSED (3/3 + punch list: PL-06 and PL-07 unticked).
- Scope note: #67, #68, #69's implementing commits (ES `3e7195eb9`, `2bdb5d0e7`, theme patch `638eedc5b3`) are dated 2026-09-05 and predate `53f390b1e9`; what this range did for them is *pressing* (VM frames, ticks). The prompt lists "es-theme patch (#69)" among the distribution themes, but `git diff --stat` of the range shows no `themes/` path — to verify where that patch lives before Phase 2.
- Prior audit #129: its three High items and most Medium/Low were resolved (ticked with commits); PL-06 (an exit sync ES declines to start reports nothing) and PL-07 (rocknix.org docs, #42) are still open — carried into "Pre-existing tracked scope".
- Decision rows read in full: D-CLOUD-008, D-CLOUD-123, D-NET-001/002/003, D-UI-050/051, D-WORKFLOW-010/011/013/014, D-QA-016, D-INFRA-010, D-CLOUD-007 (retired ID). Open decisions section holds D-CLOUD-122, D-SYS-006, D-CLOUD-051.
- Read: `docs/blindspot-register.md` (41 entries; 40 and 41 are this day's), the 2026-09-13 work log (13 entries, 00:05 → 12:40 UTC), the six `docs/vm-qa-log.md` rows for 2026-09-13, `docs/qa-frames/2026-09-13/README.md` (16 frames described; the directory holds 33 PNGs, so 17 frames are cited only from issue bodies — noted for Phase 3.6).

### [Phase 1.3] 06:00 — Both diffs read in full; 27 leads recorded in 01 § 1.3c-d

- Distribution diff (546/19) and ES diff (373/15) read file by file. Leads L1-L27 in the research notes; four resolved on the spot (L4, L8, L9, L11), the rest carried to Phase 2/3.
- Two leads look like they will grade: L12 (`cloud_device_id` first run moved to 3 s into first boot — identity seeded before the adapter may exist, then stored for good) and L17 (`avahi.disabled` is inert on every device that already has `avahi.conf`, i.e. all of them). Both are seams between epics (network × cloud identity; a register row × the unit files), which is what this tier is for. Evidence still to gather before either is a finding.
- The theme patch (#69) is outside the range (`638eedc5b3`, 2026-09-05); #67/#68/#82's ES commits likewise. This range pressed them. Recorded so the scorecard credits the range only with what it wrote.

### [Phase 1.3] 06:06 — Mechanical checks all green on the host; the guests contradict one register row

- `last-good-scripts-test` PASSED (k/l/m included); `--old` at `53f390b1e9` fails only k — l and m are not covered by `--old` (L28). `register-check` 233 IDs clean; `vocabulary-check` 0 wrong; `pkgcheck` ×5 exit 0; `bash -n`/`py_compile` clean.
- Read-only ssh to guests a/b/d (filtered). hostnamed ordering holds 3/3. **avahi ordering does not**: the image ships avahi's stock unit, not the fork's `system.d/` copy — no `After=network-base.service`, no `ConditionPathExists`. Guest b is publishing `ROCKNIX.local` while named `GENERIC-X64-0964`. D-NET-003 and #50's mDNS tick describe a unit file that is not in the image (L29). Evidence in 01 § 1.3e.
- Ids on the three guests are MAC-derived (hash matches); L12 remains a handheld question.

### [Phase 1.6] 06:10 — Research checkpoint written

- 01 § 1.3f pins the avahi root cause: the fork's `avahi/package.mk` lacks upstream's `rm -rf ${INSTALL}/usr/lib/systemd`, and `scripts/install` extracts the package's own tarball *after* copying `system.d/`, so avahi's stock unit replaces the fork's on both image trees. § 1.4 rules in scope, § 1.5 provenance map (verdicts sequestered), Tier B coverage, § 1.6 summary with seven red flags.

### [Phase 2] 06:18 — Forward audit complete: 65 criteria + 10 register rows

- 41 PASS, 4 PARTIAL (AC-45-4 zip branch; AC-50-3 reflash identity; AC-47-2 three-line rows and body; AC-113-4 the 303 s not in the QA log), 2 FAIL (AC-50-6 mDNS ordering not shipped; AC-47-5 small-panel review skipped on a closed issue), 17 SKIP (all unticked in their issues; handheld/LAN/maintainer-owned), 1 UNTESTABLE (AC-142-4, a harness run this audit may not make). Register: 7 hold, D-NET-002 holds with the L12 caveat, D-CLOUD-008 over-claims, D-NET-003 does not hold as shipped.
- Twelve frames opened; the FINISH RESTORE frames show two three-line rows at 1280x800 (D-UI-023) — found by looking, not by the closing comment that quoted the same strings.
- `register-check` proven to fire on a scratch copy (duplicate ID, dangling citation); two pattern limits found (unlisted area, four-digit ID).
- Phase 2.5 cross-check with #129: no disagreement; PL-06/PL-07 still open → tracked scope.
- **`next` moved under the audit at 06:12** — `a439dbd7c9` (QA-log row for `519f40aa0c`) and `a1aae0f736` (D-WORKFLOW-015, a work-log entry). Both in `docs/`, outside the frozen code scope (`projects/`, `packages/`, `tools/`, `.githooks/` ≤ `59103cd9cb`), so the scope is unmoved; the register count is 234 where 06:06's run said 233. Reading both now for what they change about Phases 5-7.

### [Phase 3] 06:26 — Retrospective written

- Three conformance faces: instruction files (26 rows), blindspot register (19 entries evaluated; 13, 20, 23, 27, 41 repeated once each — all on the #50/#47 pair), invariants (progress, secrets, allowlist, populated devices, two lines per row).
- Nine interactions; two risky/broken (identity at boot; avahi's stale name), one found-and-fixed in range (LINK5), the rest safe. `systemd-resolved` follows the kernel name (guest b: `System hostname changed to 'GENERIC-X64-0964'` at 2.796 s) — L26 closed as not a defect.
- Adjacent-N sweep for the avahi shape: every fork `system.d` unit compared with both image trees — avahi's is the **only** one that differs; `connman` is the only other override whose generic removes upstream units, and it carries the `rm`. Single site, no siblings.
- Missing artifacts: eleven, each with its search trail. Ready for Phase 4; the seat files (06:03/06:05) are opened next.

### [Phase 4] 06:34 — Seats opened, reconciled, analysis written

- Facilitator seats read only now: Claude (`anthropic/claude-fable-5.1`, xhigh, 844 s, success) and GPT (`openai/gpt-6-astra`, max, 957 s, success) — gates passed per the Facilitator logs. Raw outputs copied to `second-opinions/` (0 credential-shaped lines).
- Claude: 3 H / 9 M / 14 L + a tick table; GPT: 3 H / 9 M / 2 L + a 45-tick scorecard. Every finding re-derived: 20 confirmed in whole or part, 8 refuted (M-9 no `set -u`; L-2a; L-6; L-7; L-10; L-11a; L-12; L-13; L-14). Neither seat found F-01 (needs the image tree); Claude found F-02 (H-3) — confirmed: nothing strips `system.hostname` from the archive. GPT's two hook findings have siblings in the distribution hook.
- AC-66-3 revised PASS → PARTIAL after verifying the seats' point that the tick's frame (`f33fa23ac`) predates the branch (`5e7245b51`). Recorded in 04's scorecard.
- 04-analysis.md written: 18 findings (0/2/8/8), Phase 4.5 refutation for F-01 and F-02, five instruction-file patterns (two adopted from the Claude seat by name), Tier B consolidation, self-check.

### [Phase 5] 06:39 — Punch list written; pre-Phase-6 lint

- 18 items PL-01..PL-18 mirroring the findings, each with severity, category, source, owner, what/where/why, a probe for High/Medium, and an acceptance; YAML index; Phase 7 gate with every item Deferred to the audit issue (and the range's open issue where one exists). Under D-WORKFLOW-015 the deferral is sequencing (read-only mandate), not severity.
- `tools/lint-audit-artifacts` before Phase 6: the folder contract passes; the gate rows that name only "the audit issue" cannot cite a number yet — those rows are filled in with the issue number right after Phase 6 and the lint re-run with `--issue`.

### [Phase 6] 06:42 — Punch-list issue created: #151

- `gh issue create --repo maxengel/rocknix` with `--body-file`: **#151** "Code audit of the milestone work since #129 — 18 findings (0 critical, 2 high)", labels `cloud-saves` `audit` `punch-list`, milestone "Stable before upstream". 18 PL checkboxes plus three acceptance boxes for the issue itself; the seat refutations recorded so they are not re-raised.
- Back-linked from `04-analysis.md`, `05-punch-list.md` (tracker line and every gate row) and `README.md`; the scorecard heading renamed to the hyphenated form the lint matches. `tools/lint-audit-artifacts <folder> --issue 151` re-run after the edits — result below.
- Lint: PASS

### [Close] 06:43 — Committed on `next`, pushed

- Phases 0-6 complete; Phase 7 is the maintainer's (#151). The folder is committed on `next` in the primary checkout as its own commit and pushed to `origin next`; the sha is in `git log`. Nothing outside this folder was changed; no handheld or real cloud account was touched; the QA guests were read only, with credential-shaped output filtered.
