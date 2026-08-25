# Scoped Audit — Phase-Level

The scoped audit is a lightweight adversarial check that runs as
**Step 2.5** of the `mini-retro` procedure — after evidence is gathered
but before the four retro questions are answered. Its findings feed
into questions 3 (discoveries) and 4 (adjustments) of the retro.

This is **NOT** the full `code-auditor` skill. It is a ~30-minute
spot-check, intentionally scoped to a single phase's delta so it can
run as part of every phase retro without grinding progress to a halt.
The full multi-phase `code-auditor` still runs at Epic and Milestone
boundaries.

## Why bother

Retros have historically focused on process (futro predictions,
blindspots, adjustments). They don't systematically check whether the
code actually does what the acceptance criteria said it should. Test
suites and drift-guards catch a lot, but they don't catch:

- AC bullets that a commit addresses in spirit but misses a detail on
- Cornerstone violations in new files (repo-specific reflexes — e.g.
  scaffold's `.mjs` script conventions and secret-handling discipline)
- Interaction defects between two subsystems that each work in
  isolation
- Housekeeping items (pre-existing failures, documentation drift,
  stale references) that surface during the phase but don't belong to
  the phase's scope

The scoped audit catches these. A finding here either produces a
retro adjustment (fix in the next phase) or a housekeeping item
(defer to Epic/Milestone audit).

## When to skip

- Single-commit fixes with no new files and no new behaviour
- Pure refactors (no semantic change, tests are green, diff is mechanical)
- Phases where the full `code-auditor` skill is about to run anyway
  (e.g. the final phase before PZ; don't duplicate work)

For every other phase boundary, run the checks.

## Delegation (when an Epic-tier audit already covers this scope)

When `code-auditor` has already produced a dated artifact under
`logs/audits/` whose scope subsumes this phase's delta (same branch,
same time window, same files), an individual check MAY delegate to a
specific row or section of that artifact instead of re-deriving.

**Requirements:**

1. Cite the audit artifact path AND the specific row/section inline in
   the check's verdict line (e.g.
   `PASS ✓ — see logs/audits/2026_05_14-epic-m22.../03-retrospective.md § Cornerstone Conformance row 3`).
2. The audit artifact MUST be on the same branch HEAD (no new commits
   since it ran that would change the check's evidence).
3. Delegation is per-check, not blanket. Checks whose scope is strictly
   the phase delta (e.g. AC conformance for sub-issues this phase closed)
   should still be run inline.

Delegation is the right move when an Epic-tier audit ran AT the phase
boundary (e.g. final phase of an Epic produces both the phase retro
and the Epic audit in the same session). Re-deriving the same cornerstone
conformance table or interaction-defect scan duplicates work without
adding adversarial value. Origin: M22 FOUND-P4 (#2510, 2026-05-14).

## The checks

Each check takes ~5 minutes. Record the verdict + optional finding
(one-liner with file:line reference) under each check heading in the
retro. See `reference/template.md` § "Scoped audit findings (Step 2.5)".

**Verdicts** (borrowed from `code-auditor`):

| Verdict          | Meaning                                                  |
| ---------------- | -------------------------------------------------------- |
| **PASS ✓**       | Check passed; no finding                                 |
| **PARTIAL ⚠**    | Check mostly passed; minor finding surfaced              |
| **FAIL ✗**       | Check failed; substantive finding surfaced               |
| **SKIP ○**       | Check not applicable to this phase; say why              |
| **UNTESTABLE ?** | Could not verify (missing tooling, no live system, etc.) |

---

### Check 1 — AC conformance scan

**Goal:** every acceptance-criterion bullet in every sub-issue has
evidence in the phase's commits.

**Procedure:**

1. For each sub-issue in scope, read its "Exit criteria" / "Acceptance
   criteria" bullets.
2. For each bullet, identify the commit(s) that address it.
3. Verify the commit actually does what the bullet claims — not just
   "the test passes" but "the change addresses the bullet's intent."
4. **Sub-issue closure check (PL-06 / Z-3 inverse-Closes rule):** for
   every sub-issue mentioned in this retro or in the phase's commits,
   verify it is **CLOSED** on the tracker (e.g. GitHub). If any
   sub-issue is still OPEN despite the retro implying it's done, this
   is an inverse-Closes drift: a `Closes #N` was missing from a commit
   body, or a non-merging-closer commit was relied on. Recovery:
   either (a) close the sub-issue now with a comment citing the
   landing commit, or (b) reopen the parent claim and file the
   remaining work. Origin: an origin-project audit codified this as a
   Closes-ref pre-flight rule.
5. **Migration AC pre-flight (failure-mode-still-exists rule):** for
   any phase that **removes a code path, schema, or surface**
   (migration, anti-resurrection, deprecation, format swap), audit
   each AC bullet for whether **its failure mode still exists in the
   post-migration system**. ACs written against the pre-migration
   shape can become structurally untestable once the surface they
   guarded against is gone — and silently dropping them is the same
   anti-pattern as the inverse-Closes rule, one tier deeper. For each
   such bullet, classify as:
   - **Still applicable** — verify as normal.
   - **Supplanted** — the failure mode is now caught by a different
     mechanism (e.g. an anti-resurrection scan that fail-louds at
     import time replaces a runtime "log warning if legacy field
     present" AC). Document the supplanting mechanism inline in the
     retro's AC reconciliation; do **not** silently drop the bullet.
   - **Structurally impossible** — the code path the AC referenced
     no longer exists (e.g. a drift-guard against mismatched content
     in a schema that was deleted). Document why; replace with an
     equivalent guard at the new shape if one is warranted, or
     explicitly record "no replacement; failure mode gone".

   Post an **AC reconciliation comment** on the parent issue **before**
   the closeout comment, listing each deviation with its
   classification and supplanting/replacing mechanism. The mini-retro
   then links the reconciliation comment from Check 1's finding row.
   Origin: M22 #2674 Phase B (2026-05-13) — DD-A2A-01 Path X migration
   surfaced 3 ACs (AC1 partial-by-design, AC3 supplanted by AB-014
   fail-loud, AC4 supplanted by charter drift-guard) whose original
   failure modes had been replaced by stronger guards. The reconciliation
   pattern made the deviations legible before close; without it, three
   AC bullets would have looked silently unmet.

**Common drift patterns:**

- Bullet says "drift-guard assertion added" — verify the assertion
  exists, not just "a test was added"
- Bullet says "changelog entry" — verify the changelog has the right
  version bump and rationale, not just any entry
- Bullet says "drift-guard test passes" — verify the guard test was
  **extended** to cover the new behaviour, not just "still green"
- Bullet says "log warning" — verify it's at the right level (warn,
  not info/debug) with the right event name and required fields
- Bullet describes a **contract-shape audit** (envelope, response
  schema, error shape, header set, etc.) — **inverse-grep the broader
  category, not just the known bad pattern**. The known bad string
  (e.g. `"Internal server error"`) is the trigger for the audit, not
  its scope. Always sweep the category (e.g. every `, 5\d\d\)`
  return, every `c.json(... 4\d\d)`, every `Response.json(..., {status:`)
  and inspect each match. **Origin:** R2 #2302 futro almost missed 11
  non-bare incomplete envelopes + 1 `_diagnostic` raw-error leak
  because the initial grep targeted only the known bad string.

**Verdict options:** PASS / PARTIAL / FAIL per bullet.

**Finding format** (if PARTIAL or FAIL):

```
AC bullet: <exact bullet text or pointer>
Commit: <sha>
Gap: <specific thing missing or wrong>
Remediation: <which retro question this feeds into — usually §4 adjustments>
```

---

### Check 2 — Cornerstone spot-check

**Goal:** catch common cornerstone violations in new files. Full cornerstone
conformance — the numbered rows in
[`cornerstone-conformance.md`](../../../../docs/architecture/cornerstone-conformance.md)
(doctrine, Accepted-ADR, development-principles, and the conditional
Capability-authoring section) — stays at Epic and Milestone audits. This
check is a bounded spot-check. (The `.kno` `REQ-*` / `PRO-*` format rules
apply **only** when authoring a Capability `.kno`; for everything else those
rows are `·`.)

**Procedure:** run each of the ~5 spot checks below against the
phase's diff. Each should take 30 seconds to 2 minutes.

| Spot check                               | How to verify                                                                                                                                                                                                                  | What to look for                                                                                                                                                                                                                                                                                        |
| ---------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **ESM-not-CJS**                          | `grep -n "^const.*require(" <new .ts files>`                                                                                                                                                                                   | Any `require(` in a new or modified `.ts` file under `services/pspace-api/src/` — ESM-only codebase                                                                                                                                                                                                     |
| **postgres.camel dual-read**             | `grep -n "row\\." <new sql files>`                                                                                                                                                                                             | `row.foo_bar` without `row.foo_bar ?? row.fooBar` fallback; silent-fail pattern                                                                                                                                                                                                                         |
| **XRI canonical form**                   | `grep -n "pspace://\|kno://" <new files>`                                                                                                                                                                                      | Non-canonical forms (bare slugs, `kno://capability/` instead of `pspace://capability/`)                                                                                                                                                                                                                 |
| **New public APIs documented**           | Read any new exported function/type                                                                                                                                                                                            | JSDoc present; cross-references to issue; scope boundary noted                                                                                                                                                                                                                                          |
| **Schema version lockstep**              | If a schema was bumped, grep the version string across the repo                                                                                                                                                                | Any stale pin at the old version that didn't move in the same commit                                                                                                                                                                                                                                    |
| **Schema-rollout reality**               | If a `validation.rules.*` entry was added/edited, run the lint                                                                                                                                                                 | Any `rollout: strict` rule with non-zero baseline findings; demote or fix corpus (see #2289)                                                                                                                                                                                                            |
| **Inverse-pattern sweep**                | If the phase fixed a contract-shape antipattern, inverse-grep the broader category in the migrated files                                                                                                                       | Any sibling-shaped defect (e.g. non-bare-but-still-incomplete envelope, raw exception in body via `_diagnostic`/`_stack`/`error.message`) that the targeted grep would not have caught. See Check 1 for origin.                                                                                         |
| **Typed-but-operationally-unresolvable** | If the phase shipped a partner-facing error-envelope/type/shape improvement, check the PR description and code for a paired path-forward improvement (`remediation` block populated, retry succeeds, discovery surface entry). | An envelope/type improvement without a paired "and now the partner can ${verb} on retry" sentence. Improving shape without improving function. See the project's blindspot register (if it keeps one) for the "typed-but-operationally-unresolvable error responses" pattern. |

**Verdict options:** PASS / PARTIAL / FAIL overall. If any single
spot check fails, the whole check is PARTIAL (unless multiple fail,
then FAIL).

**Finding format:** identify which spot check failed, which file,
what the violation looks like, suggested remediation.

**Adaptation:** different repos care about different patterns. The
ones above are origin-project-specific (carried over as illustrative
examples). For scaffold, replace them with high-signal patterns from its
own conventions — e.g. the `.mjs` script conventions and secret-handling
rules in `.github/copilot-instructions.md` and
`scaffold-platform.instructions.md`, plus the rows in the
cornerstone conformance reference. A project's blindspot register (if it
keeps one) is another good source.

---

### Check 3 — Interaction-defect scan

**Goal:** catch defects where two subsystems each work in isolation
but fail at their intersection. These are the highest-value findings
because unit tests can't catch them.

**Procedure:**

1. Enumerate the subsystems touched by the phase (modules, services,
   databases, external APIs).
2. For each pair of touched subsystems, ask: do they share state,
   resources, or timing?
3. If yes, ask: was the COMBINATION tested, not just each in
   isolation?

**Common risky pairs (origin-project examples — adapt to your stack):**

- Catalog filesystem writes + TerminusDB version-history writes (dual-write coordination)
- Advisory locks (pg_advisory_xact_lock) + connection pool lifecycle (lock release on connection kill)
- fs.watch-based cache + publish-time filesystem writes (race: watch fires before write completes)
- Activity logging + transaction commits (activity fires before commit → duplicate on rollback)
- OpenBao secret fetch + service restart (secret lease expiry during restart)
- **Network ACLs as cross-layer shared state** — any compute resource
  (VM, container, operator host, CI runner) × any data-plane resource
  with `network_acls.ip_rules` / firewall (Key Vault, Storage, Postgres,
  OpenBao). The shared state is "which egress IPs are admitted." Both
  sides can pass their own audit in isolation (identity + RBAC verified
  on the compute side; ACL non-empty on the data-plane side) while the
  combination silently fails with `403 ForbiddenByFirewall` only at
  runtime. The check is: trace **which host's** egress IP must reach
  **which resource**, and verify that IP is in `ip_rules` (or a private
  endpoint exists). Symbolic findings like "the firewall is restrictive"
  do NOT discharge this check. Origin: an operator-host firewall RCA in a
  sibling project, where the network axis was a known unknown that never
  reached the simulation step.

**Verdict options:** PASS / PARTIAL / UNTESTABLE. Rarely FAIL
(proving an interaction defect usually requires integration tests
that may not exist yet).

**Finding format:** name the two subsystems, describe the shared
state/resource/timing, note whether a combination test exists, flag
for Epic audit if UNTESTABLE.

---

### Check 4 — Futro prediction verification

**Goal:** audit the phase's futro predictions against what actually
happened during execution. This is already implicit in well-written
retros; the scoped audit formalizes it.

**Procedure:**

1. Load the phase's futro (from the Epic comment or spec § Futro:
   Phase N).
2. Enumerate every prediction (plan edits in §5 + investigations in §2).
3. For each prediction, mark: **confirmed** / **refined** /
   **rejected** / **over-scoped** / **irrelevant**.
4. Count the ratio and add to the running base rate.

**Verdict options:** always PASS (this is an observational check —
it always produces findings, never "failures"). Below ~70%
confirmation rate, flag for retro § "Practice adjustments" as a
signal that futro technique is miscalibrated for this kind of work.

**Finding format:** a small table with one row per prediction +
final confirmation ratio.

---

### Check 5 — Housekeeping scan

**Goal:** catch pre-existing failures, documentation drift, and
stale references that surfaced during the phase but don't belong to
its scope.

**CRITICAL — scope of "full test suite":** "Full" means the **actual
project-wide test runner output** (e.g. `npx vitest run` with no
filename arguments for pspace-api), NOT a domain-scoped subset. Do
NOT scope to "all tests for the phase's domain" — that's what got
the M33 P3 retro (2026-04-25) to claim "897/898 passing in the full
capability suite" while two `e2e-lifecycle-chain.test.ts` cases were
silently broken in the actual full project suite of 4623 tests
across 228 files. The Epic-tier audit caught it; the phase-tier
scoped audit should have. **Always run the unfiltered project test
runner.**

**Procedure:**

1. Run the **full project test suite**, no filename filters. For
   pspace-api: `cd services/pspace-api && npx vitest run`. For other
   workspaces, use the equivalent project-wide invocation. Note the
   total file/test counts in the retro so future readers can verify
   scope.
2. Note every failure.
3. Classify each failure:
   - **In scope** — must be fixed before retro signs off on the phase
   - **Pre-existing, confirmed** — verified by stashing the phase's
     edits and re-running against base commit. Documented; added to
     retro § housekeeping
   - **Pre-existing, new instance** — existed before this phase but
     the phase's changes made it more visible or touched adjacent
     code. Documented; may warrant a P7 or punch-list entry
   - **NEW regression introduced by this phase** — verified by
     stashing the phase's edits and confirming the test passes
     against the base commit. **Must be fixed before retro signs off.**
4. Grep for stale references in docs (e.g. old version numbers, old
   file paths, old API names) in files touched by the phase.
5. Confirm any skipped/xfailed tests have active issues or
   documented deferrals.

**Diagnostic shortcut for fixture-isolation hypotheses:** when a test
failure looks like cross-test leakage (mysterious extra rows, slot
conflicts, stale auth state), do **not** start by patching the
fixture. First grep the production code for new SQL predicates or
queries added since the failing test was last green:

```bash
git log --oneline <base_sha>..HEAD -- '<service>/src/**/*.ts' | head -20
git diff <base_sha>..HEAD -- '<service>/src/**/*.ts' | grep -E 'sql\`|FROM |WHERE '
```

If a new predicate exists that the failing test's mock doesn't track,
the failure is a mock-drift (#2387 Bucket I), not a fixture-isolation
bug. Fixing the fixture would mask the real defect. Production-call-
count verification is cheaper than fixture-isolation refactoring;
rule it out first.

**Verification protocol for "pre-existing":** Do not trust filename
or commit history alone. The mechanical verification is:

```bash
# 1. Stash current work
git stash
# 2. Check out the phase's base commit (commit BEFORE the phase started)
git checkout <base_sha> -- <files_touched_by_phase>
# 3. Re-run the failing tests
npx vitest run <failing_test_files>
# 4. If the test passed at base → NEW regression (must fix)
#    If the test failed at base → pre-existing (document, defer)
# 5. Restore working tree
git checkout HEAD -- <files_touched>
git stash pop
```

This is mandatory for any failure flagged as "pre-existing." Skipping
this verification is how regressions get mis-classified as pre-existing.

**Verdict options:** PASS / PARTIAL / FAIL. FAIL if an in-scope test
failure was not addressed before the retro, OR if a NEW regression
was misclassified as pre-existing.

**Finding format:** table of (test path, failure reason,
classification, verification evidence, fix location).

**Sub-check 5b — Provisional-name re-check tracking:** if the repo runs a
naming-as-discipline convention (a 7-day provisional window for
newly-coined terms), any new term coined or surfaced during the phase
enters that window. Before the retro signs off:

1. Grep the phase's commits and artifacts for `(provisional)` markers
   and for newly-introduced capitalised domain terms not present at
   the base commit.
2. For each provisional name, record the window-close date (commit
   date + 7 days) in the retro § housekeeping.
3. Schedule the re-check: either (a) call out the date inline in the
   next phase's futro / retro window, or (b) file a follow-up issue
   (per development-principles' *Discovered failure = explicit work*) so
   the ratify-or-replace decision cannot evaporate.

A provisional name with no scheduled re-check is a finding for this
sub-check (PARTIAL verdict). Pattern origin: a sibling-project audit where
two names entered the provisional window but the re-check was not tracked
at phase close.

---

### Check 6 — UI-review artifact (UI-touching phases only; if a design-review / visual-QA process is present)

**Goal:** confirm a visual-QA pass actually ran for any phase that touched
user-facing UI — catching the failure mode where a phase ships visual /
a11y / token-conformance regressions because the review was skipped.
**Applies only if the repo has a design-review / visual-QA process.**
scaffold today is docs + bootstrap scripts with no UI surface, so this is
normally a SKIP.

**Trigger:** the phase modified any user-facing surface — a route or page
template, a rendered component, a global token / style file, an auth-UI
theme, a proxy directive affecting user-visible response shape, or any
projection that drives a page's visible content.

If none of the above changed, **skip with the explicit note**
`"UI review not applicable — no UI surface touched."` Do NOT silently
omit the check.

**Procedure:** for each affected route, verify in the retro:

1. **Artifact present** — the design review ran (page-scale mode) against
   the route, and its artifact path is linked from the closing comment on
   the issue or from the retro itself.
2. **Environment honest** — the artifact records which target was reviewed
   (staging deploy / test environment / local dev / production read-only)
   and which auth method was used.
3. **BLOCKER + MAJOR resolved** — every BLOCKER / MAJOR finding was either
   fixed in-phase or has a tracked follow-up issue linked from the retro
   (per development-principles' *Discovered failure = explicit work*, none
   may be silently absorbed).
4. **MINOR + COSMETIC noted** — appended to the retro's §3
   discoveries (or a dedicated punch list comment) so the Epic-tier
   `code-auditor` can consolidate them.
5. **Observability triangulation (where relevant)** — if the route
   issues SSR fetches, capture the trace ID / query that confirms the
   rendered UI was backed by the expected backend chain (catches silent
   N+1 / swallowed 500 → empty-state).

**Verdict options:** PASS / PARTIAL / FAIL / SKIP.

- **PASS** — artifact present, environment honest, all
  BLOCKER/MAJOR resolved.
- **PARTIAL** — artifact present but one of (environment
  unrecorded, MINOR/COSMETIC not propagated, observability skipped).
- **FAIL** — phase touched UI but no review artifact exists, OR an
  unresolved BLOCKER/MAJOR finding shipped. Phase is **not**
  code-complete; remediate before the retro signs off.
- **SKIP** — with the explicit "no UI surface touched" note above, or
  when the repo has no design-review / visual-QA process.

**Deferral allowance:** when the route or auth flow doesn't yet exist
on the chosen review target (brand-new surface, feature-flag-gated),
record the items as deferred visual-QA in the phase's QA punch list.
Verdict is **PARTIAL with deferral**, not FAIL — but the deferred review
MUST run as part of the post-deploy verification step. Do not let phase
progression block on it.

**Finding format:** route(s) reviewed, target environment + auth
method, artifact path, BLOCKER/MAJOR count and resolution status,
MINOR/COSMETIC count and where propagated, deferral note if any.

---

### Check 7 — Harness self-coverage scan

**Goal:** if this phase shipped a new lint, pre-flight, test
harness, deploy gate, or other defensive check, verify that the
harness covers the failure modes that were actually encountered
while landing it.

**Origin:** M26 P1 (2026-05-08). The phase shipped `git-pre.sh`
scoped to "the two highest-friction pre-commit hooks" (yamllint +
detect-secrets). Within the same session, a follow-up commit was
blocked twice by markdownlint MD031 — a hook that was
deliberately excluded from the new harness on scope-discipline
grounds. The exclusion was wrong for exactly the same reasons that
justified the harness in the first place: the failure was 100%
detectable locally, fully deterministic, and scrolled off-screen
behind the unrelated hook output (don't tail/head the output of
`git commit`, or a late hook failure scrolls past unseen). A scoped-audit
prompt for harness self-coverage would have caught this in
the phase retro instead of the next session.

**When this check applies:** the phase landed any of —

- A new lint script, validation script, or pre-commit / pre-push hook
- A new test harness, smoke test, or deploy gate
- An extension to an existing harness (new rule, new file scope)
- A new runtime guard or assertion (e.g. `lib/tier.sh`-style
  discriminator with an exhaustive check)

If the phase shipped none of these, mark **SKIP** with a one-line
justification.

**Procedure:**

1. List every failure mode that was encountered while landing this
   phase — commit attempts that bounced, CI runs that failed,
   surprises that cost a turn or more. Source: the phase's commit
   message bodies, the retro's §2 ("what was harder than
   expected"), and the running session log.
2. For each harness shipped this phase, ask: **does the harness
   cover the failure mode it was deployed alongside?** If the
   harness was scoped narrower than the encountered failures, that
   is a finding.
3. For each excluded rule / hook / check, demand an explicit
   justification in the harness's header comment or the originating
   issue. "We didn't think of it" is not a justification; "this hook
   produces non-deterministic output" is.
4. If a failure surfaced during the phase (not just during landing)
   that the new harness _would have caught had it covered that
   rule_, that is a FAIL.

**Verdict options:** PASS / PARTIAL / FAIL / SKIP. PARTIAL if the
harness covers most of the encountered failures but missed one;
FAIL if it missed the failure mode that motivated the harness's
existence in the first place.

**Finding format:** one-line per missed failure mode, with the
fix's commit sha (if already routed Outcome A) or the tracking
issue number (Outcome B).

---

### Check 8 — Documentation & glossary freshness

**Goal:** the completion-ceremony counterpart to the kickoff-time
cornerstone / substrate checks. `begin-delivery` runs cornerstone +
substrate verification when work _starts_; this check runs the documentation
update when work _completes_. New nouns and changed surfaces that ship
without doc/glossary updates become the next agent's confusion (and,
for a shared noun, the next polysemy bug).

**Origin:** the user directed that documentation updates should bookend
work _completion_ the way cornerstone checks bookend work _kickoff_.
Surfaced by a three-way "Registry" polysemy where three schema names
shared one noun, partly because the earlier two shipped without a glossary
disambiguation that would have forced the distinction into the open.

**When this check applies:** the phase introduced or changed any of —

- A new platform **proper noun** (schema name, primitive, principle,
  surface, role, capability kind, named flow / endpoint)
- A renamed or re-scoped existing concept
- A new public surface, API, or entity type whose docs now
  describe stale behaviour
- A schema / `.kno` change requiring catalog or changelog reconciliation
  (Capability-authoring phases only)

If the phase introduced no new nouns and made no docs stale (pure
bugfix / tooling), mark **SKIP** with a one-line justification.

**Procedure:**

1. **New-noun sweep.** List every platform proper noun the phase
   introduced or renamed. For each, verify a glossary entry exists (if the
   repo keeps a glossary) — or a follow-up issue to add it. For a noun
   that **collides** with an existing term (the polysemy case), the
   glossary entry MUST state the disambiguation explicitly, not just
   define the new sense.
2. **Stale-doc sweep.** For each surface the phase changed, grep the
   docs that describe it (`docs/architecture/**`, `docs/design/**`,
   relevant `README.md`, auto-applied `.claude/rules/**`). Are
   they still accurate? Update in-session or file a tracked follow-up.
3. **Catalog / changelog reconciliation** (Capability-`.kno` phases
   only): confirm the file-type catalog carries a row for any new
   schema `.kno`, and that changelog surfaces are consistent (run the
   repo's changelog lint, if it provides one).
4. **Consult the live glossary as source of truth for casing** — if the
   repo or platform keeps one.

**Verdict options:** PASS / PARTIAL / FAIL / SKIP. PARTIAL if some
docs updated but a follow-up remains; FAIL if a new noun shipped with
no glossary entry and no tracked follow-up.

**Finding format:** one-line per missing/stale artifact, with the
update's commit sha (Outcome A) or the tracking issue number
(Outcome B).

---

### Check 9 — Build-vs-adopt honor check

**Goal:** verify the phase **honored** the build-vs-adopt answer its
spec / Epic recorded. The question "are we building this because we must,
or because we can?" is doctrine §1 (pSpace-first, with an escape hatch)
and development-principles' *Prefer adopt / extend / contribute before
building from scratch*. This check closes the loop at completion: did the
shipped work match the recorded path?

**Origin:** a roadmap-recalibration Epic institutionalized the question at
several audit hooks; this check is the phase-tier hook.

**When this check applies:** the phase shipped net-new platform
behavior, a new integration/surface, or a new primitive — anything a
build-vs-adopt answer governs. Mark **SKIP** with a one-line note for
pure bugfix / docs / mechanical-migration phases, or when no recorded
answer exists (note the gap).

**Procedure:**

1. **Locate the recorded answer** — the spec's `## Build-vs-Adopt`
   section and/or the row in the repo's build-vs-adopt register (if it
   keeps one); otherwise judge against doctrine §1 + dev-principles.
2. **Compare answer vs. shipped.** A spec that said **adopt** but the
   phase shipped bespoke code → FAIL. A **build** path whose required
   adoption survey (named standards evaluated + disqualifying gaps) was
   never documented → FAIL. An **extend** path whose upstream gap-filing
   never happened → PARTIAL (file it now, Outcome A, or track it).
3. **Check the register row freshness** (if the repo keeps a register).
   If the phase materially changed the answer (e.g. discovered an
   adoptable standard mid-build), a NEW register row records the
   reversal — append, don't edit. Otherwise record the reversal as an ADR.

**Verdict options:** PASS / PARTIAL / FAIL / SKIP.

**Finding format:** the recorded path vs. the shipped reality, with
the register row or ADR (or its absence) cited.

---

### Check 10 — Decision-propagation scan

**Goal:** verify the phase neither **re-opened a settled decision**
(pull rule) nor **ratified a decision without sweeping** (push rule),
per development-principles' *Decisions are recorded, then propagated*
(MET-1) and the ADR process.

**Origin:** an incident where a task filed days after a decision was
ratified (twice) framed it as an open decision point, and the agent
recommended reversing it without reading the record; the user caught it.

**Procedure:**

1. **Pull-rule scan.** For each issue/spec/plan the phase authored or
   materially edited, scan for open-framing markers ("decision
   point", "open question", "TBD", "needs decision"). For each hit,
   spot-check the decision record (the Accepted ADR or instruction-file
   table) — was the question already settled? A settled question framed
   open without named new evidence → FAIL.
2. **Push-rule scan.** If the phase ratified any decision (an ADR moving
   to Accepted, a register row, a decision record), confirm the
   ratification artifact carries its `## Propagation` / Consequences
   section AND spot-check one named impacted issue to confirm the update
   actually landed (a propagation lint, if the repo provides one, proves
   the attestation exists; this check samples its truthfulness).
3. **Recommendation scan (lightweight).** If the phase's session
   recommended reversing any established name, enum, schema shape, or
   primitive: was the original ratification read and cited first?

**Verdict options:** PASS / PARTIAL / FAIL / SKIP (phase neither
authored decision-framing artifacts nor ratified anything).

**Finding format:** the artifact that re-opened or under-propagated,
the ratification record it missed, and the fix applied (Outcome A
preferred: cite-and-close the framing in-session).

---

## After the checks

Aggregate the findings and feed them into the retro's existing
four questions:

- **Check 1 PARTIAL/FAIL** → retro §3 discoveries + §4 adjustments
- **Check 2 PARTIAL/FAIL** → retro §3 discoveries + §4 adjustments,
  blindspot-register entry if the pattern repeats
- **Check 3 findings** → retro §3 discoveries; UNTESTABLE → Epic
  audit punch list
- **Check 4 low ratio** → retro § "Practice adjustments" (new
  subsection; see SKILL.md)
- **Check 5 pre-existing failures** → retro § housekeeping
- **Check 6 PARTIAL/FAIL** → retro §3 discoveries + (for FAIL)
  must remediate before retro signs off; deferred items go to the
  phase's QA punch list as deferred visual-QA (if a design-review /
  visual-QA process is present)
- **Check 7 PARTIAL/FAIL** → retro §3 discoveries + §4 adjustments;
  the harness extension itself is usually Outcome A (fix-now in the
  same session)
- **Check 8 PARTIAL/FAIL** → retro §3 discoveries + §4 adjustments;
  glossary/doc updates are usually Outcome A (in-session), with a
  tracked follow-up issue (Outcome B) only when the doc work is large
  enough to warrant its own scope
- **Check 9 PARTIAL/FAIL** → retro §3 discoveries + §4 adjustments;
  a FAIL (answer not honored, or Build without a documented survey)
  also feeds the next Epic/Milestone `code-auditor` pass, which
  adversarially reviews answer-vs-shipped at its scope
- **Check 10 PARTIAL/FAIL** → retro §3 discoveries + §4 adjustments;
  re-opened framings are usually Outcome A (cite the ratification and
  close the framing in-session); a missing/false Propagation section
  on a ratification artifact must be remediated before the retro
  signs off

The findings section in the retro is **additive** — the four
questions still structure the output; scoped audit findings feed them.

## Artifact placement

Scoped audit findings live **inline in the retro**, under a dedicated
"Scoped audit findings (Step 2.5)" section. They do NOT get their
own `logs/audits/` folder; that's the Epic/Milestone tier's
responsibility.

When the Epic audit runs (usually at PZ), it reads every phase
retro's scoped-audit section and consolidates findings. The
Milestone audit does the same at a higher level.

## Skill self-improvement hook

If during the scoped audit you notice a check that repeatedly produces
no findings, OR a pattern of defects the checks don't catch,
flag it in the retro's § "Practice adjustments" subsection. Periodic
skill revisions should promote consistently-useful checks and retire
consistently-empty ones.

This is how the skill evolves: **from within its own use**, not
through separate skill-improvement projects.
