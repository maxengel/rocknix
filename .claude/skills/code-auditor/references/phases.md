# Code Auditor — Phase Methodology

Authoritative procedure for phases 0–7 (plus the Milestone-tier 2.5 cross-check and the 4.5 finding-verification pass). Load this when executing any phase of an audit.

---

## Phase 0 — Setup

Covered in SKILL.md. Key points recap:

- Create `docs/audits/YYYY_MM_DD-{scope}-{item-name}/` directory
- Create `01-research-notes.md` with the header template
- For milestone-scoped audits, also create `00-running-log.md` and append after every meaningful action

---

## Phase 1 — Research

**Goal:** Build a complete picture of what was planned, what was discussed, what was decided.

**Output:** `01-research-notes.md` — running notes of everything discovered.

### 1.1 Read the spec

- Read the driving spec completely (every section, every phase, every acceptance criterion)
- Document the spec's stated goals, scope, phases, validation gates (staging checkpoints), and acceptance criteria
- Flag any ambiguities or under-specified criteria

### 1.2 Read the issues

Use the GitHub MCP issue/search tools (runtime-specific names: `mcp__github__*` in Claude Code, `mcp_github_*` in Copilot). Avoid `gh` CLI for list/search.

- Find issues by milestone, labels, or numbers
- Read each issue body completely — acceptance criteria, discussion, linked PRs
- Document which issues exist, their AC, current state
- Flag issues marked closed without clear completion evidence

### 1.3 Read git history

- `git log --oneline` filtered by date/files/author
- Note files added/changed/deleted
- Document scope of code changes and surprising additions/omissions

### 1.4 Read relevant documentation

- Instruction files applying to touched code paths
- The instruction files whose `paths:` glob matches the changed paths, plus `CLAUDE.md` and `docs/blindspot-register.md`
- Document which constraints and conventions apply

### 1.4.5 Research fan-out (Milestone tier)

At Milestone tier the research surface (spec + every issue + git history

- every retro + every prior Epic audit) is the context-compaction risk the
  running log mitigates. Parallelise it: dispatch one read-only research
  subagent per Epic (inputs: the Epic issue, its audit folder, its phase
  retros; output: a structured provenance entry with exact file paths and
  quoted ACs). Run them concurrently, then read the named primary artifacts
  yourself before any verdict — fan-out yields leads and paths, NEVER
  verdicts (Evidence floor rule 3). No terminal ops (`git`, `npm`, `gh`) in
  subagents.

### 1.5 Read prior phase retros, Epic audits, and Tier B findings

(Epic and Milestone scope only — skip for Phase scope, which IS the
phase retro.)

**Posture differs by tier** — see SKILL.md § "Tier posture differs by
scope":

- **Epic tier (consolidating):** Findings in phase retros are
  primary inputs. Trust them; do not re-derive.
- **Milestone tier (independent re-audit, prior audits as ONE
  input):** Read prior Epic audits and phase retros to (a) build a
  provenance map of what was audited, (b) note where prior coverage
  may have been thin and warrants extra adversarial scrutiny in
  Phase 2, and (c) carry forward any unresolved punch-list items.
  **Verdict sequestration:** the provenance map records WHO audited
  WHAT, coverage depth, and trust signals — it must NOT transcribe
  per-AC PASS/FAIL verdicts into your notes. Prior verdicts are
  opened only in Phase 2.5, after your independent verdict for that
  criterion is already written (reading the answer key first is
  anchoring, not independence). Phase 2 re-derives from primary
  sources (spec + code + tests).

**For both tiers:**

- Enumerate every in-scope phase retro and read its **Step 2.5
  scoped-audit section** (including any Tier B design-review check,
  if the repo has a design-review process).
- If a design-review / visual-QA process is present, collect every
  Tier B artifact path attached to in-scope retros / closing comments.
  Note: route(s) reviewed, target environment, blocker/major resolution
  status, minor/cosmetic items propagated, any deferred visual-QA items.
- Record the consolidated set in `01-research-notes.md` under a
  dedicated "Tier B coverage" subsection.
- For Milestone tier, also record under a "Prior-audit provenance
  map" subsection: per Epic / phase, who audited, when, and a
  one-line trust-signal note (e.g., "thorough — hit 3 critical
  findings"; "thin — single-pass, no cross-system check"). Phase 2
  uses this to allocate adversarial effort.

The forward audit (Phase 2) then verifies any UI-touching acceptance
criterion has matching Tier B evidence; the analysis (Phase 4)
consolidates unresolved items into the punch list (Phase 5).

### 1.6 Checkpoint

Write a "Research Summary" section at the bottom of `01-research-notes.md`:

- What was planned
- What issues exist
- What code was changed
- What constraints apply
- Red flags discovered during research

---

## Phase 2 — Forward audit

**Goal:** Walk through the spec's acceptance criteria in order and verify each against actual code.

**Output:** `02-forward-audit.md` — running notes of each criterion checked.

Simulates a second engineer being assigned the same work and checking it off.

### Per-criterion procedure

1. **State the criterion** — copy it exactly from the spec/issue
2. **Locate the evidence** — find the code, config, test, or documentation.
   **Evidence hierarchy:** if the criterion is enforced by an existing
   mechanical check (vitest suite, parity lint, `kno:validate`,
   `npm run check`, a named validation script), RUN it and record exit
   status + counts — reading about enforcement is insufficient when the
   enforcement can be executed. Tracker state (issue closed, AC box
   checked, retro summary) is corroboration only, never sole evidence.
3. **Attempt refutation** — before evaluating, actively look for what
   would prove the criterion NOT met: the failing input, the unhandled
   path, the environment where it breaks, the sibling site the fix
   missed. Record what you searched and why it came up empty.
4. **Evaluate** — does the evidence survive the refutation attempt and
   fully satisfy the criterion?
5. **Verdict** — PASS ✓ / PARTIAL ⚠ / FAIL ✗ / SKIP ○ / UNTESTABLE ?
6. **Write finding immediately** — append to `02-forward-audit.md` before checking the next criterion

### Criterion entry format

```markdown
### AC-NN: [Criterion Text]

**Source:** [Issue #XX / Spec Phase N / Validation Gate]
**Verdict:** [PASS ✓ / PARTIAL ⚠ / FAIL ✗ / SKIP ○ / UNTESTABLE ?]

**Evidence:**

- [File path and line numbers where this is implemented]
- [Test file that validates this, if any]
- [Command evidence: executed check + exit status + counts, when a mechanical check enforces this AC]

**Refutation attempted (required for PASS):**

- [What you looked for that would have proven the criterion NOT met, and why the search came up empty]

**Notes:**

- [What was found, any concerns, quality observations]

**Gaps (if PARTIAL or FAIL):**

- [Specific gap description]
- [What would be needed to fully satisfy this criterion]
```

### Code-quality checks (applied during forward audit)

While evaluating each criterion, also assess:

| Dimension                 | What to check                                              |
| ------------------------- | ---------------------------------------------------------- |
| **Cyclomatic complexity** | Deeply nested conditionals? Long switch/if chains?         |
| **Pattern adherence**     | Follows patterns established elsewhere in the codebase?    |
| **Edge cases**            | Boundary conditions handled? Null/undefined? Empty arrays? |
| **Error handling**        | Errors caught, logged, handled appropriately?              |
| **Test coverage**         | Tests exist? Happy path AND error paths covered?           |
| **Naming**                | Follows codebase conventions? Descriptive?                 |
| **Security**              | Input validation? Auth checks? Injection prevention?       |

### Call-site count verification

When a finding or punch-list item names a **count of call sites** to migrate, refactor, or audit (e.g., "migrate the three existing call sites"), run a literal code search (Grep / ripgrep) for the function/symbol and confirm the count **before publishing the punch list**. Don't trust the analysis pass alone — historically audit call-site counts undercount by ~1 (M55 #2299 invite paths: audit said 2, reality was 8; #2634 PL-04 outcome-emission: audit said 3, reality was 4). Write the verified count plus the grep query into the finding so the resolver can reproduce it.

### Forward-audit checkpoint

After all criteria are checked, append a summary:

```markdown
## Forward Audit Summary

| Verdict      | Count | Criteria          |
| ------------ | ----- | ----------------- |
| PASS ✓       | N     | AC-01, AC-03, ... |
| PARTIAL ⚠    | N     | AC-02, ...        |
| FAIL ✗       | N     | AC-05, ...        |
| SKIP ○       | N     | AC-07, ...        |
| UNTESTABLE ? | N     | (none ideally)    |

**Overall Assessment:** [PASS / PASS WITH FINDINGS / FAIL]
```

Then append a mandatory **Coverage Boundary** section:

```markdown
## Coverage Boundary

**Examined:** [artifacts/subsystems read, with depth: code-read / test-run / runtime-probed per AC]
**Deliberately not examined:** [what was skipped, with reasons]
**Dimensions not exercised:** [runtime behavior / staging / performance / security / …]
```

---

## Phase 2.5 — Verdict cross-check (Milestone tier only)

Only AFTER every independent verdict is written to `02-forward-audit.md`,
open the prior Epic audits' and retros' per-AC verdicts (sequestered since
Phase 1.5) and cross-check:

- Agreement → note it; no action.
- Disagreement → a finding, not an error. Document both verdicts and
  reason about why (prior audit wrong, or code regressed since). Route to
  Phase 4 synthesis.

Append a short `## Prior-verdict cross-check` section to
`02-forward-audit.md` recording per-AC agreement/disagreement. The
document-as-you-go timestamps make the sequestration auditable: every
independent verdict entry must precede this section.

---

## Phase 3 — Retrospective audit

**Goal:** With the full picture of what was built, work backwards to find things that forward checking might miss.

**Output:** `03-retrospective.md` — running notes of retrospective findings.

### 3.1 Architectural coherence

- Does the completed work form a coherent whole?
- Orphaned files, dead code, unused imports introduced?
- Architecture matches what the spec described?
- Coupling issues or abstraction violations?

### 3.2 Project conformance

This repo's doctrine is distributed, not in one rubric file. Evaluate all three
faces (see SKILL.md § Project conformance):

- **Instruction files** — table with Relevance + Finding per file whose
  `paths:` glob matches a changed path. Read them from `next`: a feature
  worktree cut from an older base silently lacks files added since, so an audit
  run there can miss the rule it should be checking against.
- **Blindspot register** (`docs/blindspot-register.md`) — for each entry, does
  this work repeat it? Highest yield of the three, because every entry is a
  failure this project has actually committed rather than one it might.
- **Project invariants** — progress preservation over recency, no secrets in
  backups, the filter is an allowlist and `--delete-excluded` makes a mistake
  destructive, and every change lands on devices that already have state
  (upgrade path *and* clean install).

### 3.3 Spec fidelity

- Did the implementation match the spec's design decisions?
- Were design decisions silently changed without updating the spec?
- Implementation details that contradict the spec's architectural choices?
- Scope added or removed without documentation?

### 3.4 Platform architecture conformance

| Check                                  | Relevance | Finding |
| -------------------------------------- | --------- | ------- |
| Reference Implementation (tenant zero) | [✓/⚠/✗/·] |         |
| Schema-Before-Code                     | [✓/⚠/✗/·] |         |
| Dogfooding Gate                        | [✓/⚠/✗/·] |         |
| API-First                              | [✓/⚠/✗/·] |         |

### 3.5 Cross-system interaction audit (CRITICAL)

**Catches interaction defects** — two subsystems each work correctly in isolation but fail at their intersection.

For each subsystem touched:

1. **Identify interacting subsystems** — what shares state, resources, timing? Consult the repo's shared-state register if one exists (scaffold's canonical conventions live in `.claude/rules/`)
2. **Check runtime-state assumptions** — config reloads destroying in-memory state, container restarts resetting ephemeral data, deploys running multiple instances, pollers/crons conflicting across instances
3. **Verify intersection testing** — not "A works" and "B works", but "A works while B is also happening"
4. **Check knowledge propagation** — did the implementer consult docs in the **interacting** subsystem, not just the one changed?

Entry format:

```markdown
### Interaction: [Subsystem A] × [Subsystem B]

**State shared:** [What runtime state do they share?]
**Wipe risk:** [What operations could destroy the shared state?]
**Test coverage:** [TESTED / UNTESTED / PARTIAL]
**Finding:** [Safe / risky / broken]
```

Common risky pairs:

| Subsystem A             | Subsystem B           | Interaction risk                           |
| ----------------------- | --------------------- | ------------------------------------------ |
| Deploy scripts          | Custom domain routing | `caddy reload` wipes dynamic routes        |
| Blue-green overlap      | Background pollers    | Duplicate pollers create conflicting state |
| Database migrations     | Running application   | Old code + new schema (expand/contract)    |
| Container orchestration | Connection pools      | Old containers hold DB connections         |
| Auth provider restart   | Active user sessions  | All sessions invalidated                   |
| Secrets manager restart | Application startup   | Apps fail if OpenBao is sealed             |

### 3.6 What's missing?

Look for things that SHOULD exist but DON'T:

- Tests that should have been written
- Documentation that should have been updated
- README files that should reflect new files/services
- Schemas that should have been created or extended
- Changelog entries that should exist
- Migration files that should accompany schema changes
- `.kno` entity files that should exist for new concepts
- **Cross-system interaction tests** for infrastructure changes (3.5)

**Grounding requirement (assertion-grounding):** "X does not exist" is the
highest-risk assertion class an auditor makes. Every missing-artifact
finding must record (a) the literal search commands run (grep/glob/ls with
their exact patterns — same discipline as the call-site count rule), and
(b) a proximate-work reconstruction: recent commits and open issues that
could have added X under a different name. A negative claim without its
search trail is not a finding.

### 3.6.5 Audit-prescription verification

**Goal:** before declaring any finding "complete," prove the fix
addressed every occurrence of the underlying defect class — not just
the one site that surfaced.

This check exists because Q-COL-14 INV-Z2 found a silent-skip
anti-pattern duplicated across **3** migration phases (#2382 +
Sibling-A + Sibling-B) plus an **adjacent** instance in
`projects/ROCKNIX/packages/rocknix/sources/scripts/backuptool` (Adjacent-C, filed as an issue). Fixing
only the surfaced site would have left the same defect alive in 3+
other locations.

**Procedure** for every finding flagged in passes 1–3:

1. Distill the defect to its **shape** (predicate, anti-pattern,
   missing assertion) — not its surface text.
2. Grep the codebase for the shape, not the symbol. Prefer
   structural patterns (e.g. `if ! .* test -d .* skipping` rather
   than the file path of the failing site).
3. Enumerate every occurrence as **Site / Sibling-N / Adjacent-N**:
   - **Site** — the surfaced occurrence
   - **Sibling-N** — same defect in same module/script/file
   - **Adjacent-N** — same defect in a different module/script that
     shares the same risk class
4. Classify each: `FIX-NOW` / `FILE-FOLLOWUP` / `SAFE-AS-TESTED` /
   `BY-DESIGN`. Document the rationale for any not fixed in this
   audit's commits.
5. The finding is not "complete" until every Sibling and Adjacent
   site has a verdict.

**Verdict options:** PASS (every site classified, fixes landed where
classified FIX-NOW), PARTIAL (sites classified but follow-up issues
still open), FAIL (Sibling/Adjacent sites unenumerated — finding
closed prematurely).

**Finding format:** for each defect class, a small table with one
row per Site/Sibling/Adjacent occurrence + verdict + commit/issue
reference.

### 3.7 Retrospective checkpoint

```markdown
## Retrospective Summary

### Architectural Assessment

[Is the completed work architecturally sound?]

### Cornerstone Alignment

[Overall conformance: HIGH / MEDIUM / LOW]
[Key tensions or violations]

### Cross-System Interactions

[Were interaction points identified and tested?]
[Any untested intersections that pose risk?]

### Spec Drift

[Did implementation match spec? Where did it diverge?]

### Missing Artifacts

[List everything that should exist but doesn't]
```

---

## Phase 4 — Synthesis

**Goal:** Merge findings from all three passes into a single analysis document.

**Output:** `04-analysis.md` — the authoritative audit report.

Structure in [`references/templates.md` § Analysis Report](templates.md) —
including the mandatory Coverage Boundary and Quality Self-Check sections.

---

## Phase 4.5 — Finding verification (false-positive kill pass)

For every **Critical** and **High** finding, attempt to refute your own
finding before it becomes a punch item:

1. Re-read the implicated code path end-to-end (not just the flagged lines)
2. Re-run the reproduction if one exists
3. Search for an existing mitigation (a guard elsewhere, a lint, a test)
   that makes the finding moot

Record per finding in `04-analysis.md` § Finding Verification:
`survived refutation: yes/no + what was checked`. A finding that dies here
saved a punch-list cycle; a finding that survives is now load-bearing
evidence, not a hedge ("which suggests…" hedges in findings are the signal
this pass was skipped).

---

## Phase 5 — Punch list

**Goal:** Distil all findings into an actionable, prioritised list another agent or engineer can execute.

**Output:** `05-punch-list.md` — the remediation plan, plus its
machine-readable YAML index (one record per item — the parseable source for
the Phase 6 issue and the begin-delivery Step 1.6 gate).

Structure, unified item schema, YAML index format, and
category-to-priority mapping in [`references/templates.md` § Punch List](templates.md).

**Discovered vs. tracked:** punch items are audit-DISCOVERED defects/gaps
only. Open scope already represented by a tracked issue goes in the
"Pre-existing tracked scope" section (issue links, no PL numbers) — exempt
from the Phase 7 gate.

**Final step:** if the repo provides an artifact-contract lint (e.g. a
`lint-audit-artifacts` script), run it and fix every finding before Phase 6;
scaffold has none today, so verify folder naming, required files, mandatory
sections, verdict vocabulary, and punch-index schema manually.

---

## Phase 6 — Create GitHub punch-list issue

Covered in SKILL.md. After presenting the punch list to the user, create the GitHub audit punch-list issue. This is mandatory even when every punch-list item has already been resolved; if there are no open items, create the issue with outcomes recorded and close it as completed.

- Title: `Audit: [Item Name] — [N] findings ([X] critical, [Y] high)`
- Labels: `audit`, `punch-list`, plus relevant epic labels
- Body from `05-punch-list.md` plus the executive summary and acceptance-criteria scorecard. Prefer GitHub MCP issue tools when available; if using `gh`, write the body to a file and pass it via `--body-file` (never heredoc)
- Linked to the original milestone/issues
- Back-linked from `04-analysis.md` and `05-punch-list.md`

If labels don't exist, create them first with `gh label create <name> --color <hex>`.

**CRITICAL:** never delegate GitHub operations to subagents — they do not inherit terminal access. Use `bash` directly.
