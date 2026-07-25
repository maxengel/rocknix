# Mini Retro Template

Copy this into the spec document phase section AND into the Epic issue
comment. Replace every `<placeholder>` with real content. **Do not leave
placeholders.** Do not invent new sections — the four-question structure is
what makes retros cross-searchable for future agents.

The four sections form a deliberate backward + forward symmetry:

- **Backward looking** — what just happened: _What worked well_, _What was
  harder than expected_, _Discoveries that affect future phases_.
- **Forward looking** — what changes because of it: _Adjustments to
  remaining phases_, plus optional _Practice adjustments_ (changes beyond
  the current spec — e.g. skill or instruction-file refinements).

Both halves are mandatory. A retro that only says "what happened" without
naming what changes downstream is incomplete.

---

## Mini Retro: <scope — e.g. "Phase N" or "Epic A (sub-issues #B through #E)">

**Completed:** <YYYY-MM-DD>
**Scope of this retro:** <which sub-issues / commits / files were in scope. Name the out-of-scope boundary too — e.g. "F, G, H remain open and are informed by these learnings.">

**Branch:** `<branch>` (<N> commits on top of <base>).
**Delta:** <quantified change. Examples: "pspace-api went 4244 → 4293 passing tests (+49)", or "added 312 LOC across 3 modules", or "3 new API endpoints shipped". Skip if truly immeasurable, but try.>

---

### What worked well

- <bullet — a pattern, tool, sequencing decision, or artifact that was genuinely effective. Concrete. Reference files / commits / test counts.>
- <bullet>
- <bullet>

### What was harder than expected

- <bullet — friction, unexpected complexity, miscalibrated estimate, tooling failure, process gap. Honest. If nothing was harder than expected, you haven't looked hard enough.>
- <bullet>
- <bullet>

### Discoveries that affect <future phases / remaining issues>

- <bullet — new info not available during planning. Technical discoveries, requirement clarifications, pre-existing issues surfaced, scope gaps uncovered.>
- <bullet>
- <bullet>

### Adjustments to <remaining phases / remaining issues>

Based on the above, the specific changes to remaining work:

- <bullet — name the issue / phase and the change. E.g. "F AC add: 'Gate invokes isDependencySatisfied() inside the lock (recheck-before-commit) — reviewable as a code-review item.'">
- <bullet>

**OR** if the plan holds:

> No adjustments needed — remaining <phases / issues> still align with current reality.

(Do not leave this section empty. Either list adjustments or explicitly state "no adjustments needed.")

### Scoped audit findings (Step 2.5)

<Optional section. Populate this if Step 2.5 of the mini-retro procedure
was run. Full check procedure in `references/scoped-audit.md`. Each of the
checks gets one line with verdict (PASS ✓ / PARTIAL ⚠ / FAIL ✗ /
SKIP ○ / UNTESTABLE ?) + a one-line finding. Substantive findings should
also appear in the retro sections above (usually §3 discoveries or §4
adjustments); this section is the overview / audit receipt.>

- **Check 1 — AC conformance:** <verdict> — <finding or "no gaps">
- **Check 2 — Cornerstone spot-check:** <verdict> — <finding or "no violations">
- **Check 3 — Interaction-defect scan:** <verdict> — <finding or "no risky pairs">
- **Check 4 — Futro prediction verification:** <N>/<M> confirmed (<X>%) — <brief note>
- **Check 5 — Housekeeping (full-suite scan):** <verdict> — <classification of any failures>
- **Check 6 — UI-review artifact (if a design-review / visual-QA process is present):** <verdict / SKIP "no UI surface touched"> — <artifact path or note>
- **Check 7 — Harness self-coverage:** <verdict / SKIP "no new harness shipped"> — <finding or note>
- **Check 8 — Documentation & glossary freshness:** <verdict / SKIP "no new nouns, no docs made stale"> — <finding or note>
- **Check 9 — Build-vs-adopt honor check:** <verdict / SKIP "no new build/adopt surface"> — <recorded path vs. shipped + register row / ADR (if present)>

**OR** if the scoped audit was skipped (per `references/scoped-audit.md`
§ "When to skip"):

> Scoped audit skipped — <reason, e.g. "single-commit mechanical refactor; no new behaviour">

### Practice adjustments

<Optional section. Use when the retro, scoped audit, or phase chaining
revealed a gap in the mini-retro / futro / begin-delivery /
begin-exploration / code-auditor skills themselves. This is the
recursive-improvement hook: skills evolve from within their own use. (If
a skill named below isn't installed — e.g. begin-exploration — treat its
mention as conditional.)

Examples:

- "Scoped audit Check 2's ESM spot-check produced no findings in
  phases P1, P2, and P3 — candidate for retirement or narrower scope."
- "Futro missed the dual-write coordination pattern during P2
  execution (discovered in Check 3 scoped-audit); the futro skill's
  § 4 agent-simulation should include a 'dual-write coordination'
  archetype."
- "The 'housekeeping items' section has accumulated 12 pre-existing
  failures across P0–P3 without anyone triaging them. Consider
  batching into a dedicated P7 housekeeping task."

Empty is acceptable — don't invent adjustments. But if empty across
many consecutive retros, that's itself a signal that nobody's looking
for skill gaps.>

- <practice-level observation>

### Housekeeping items (not blocking next phase)

Optional section. Use when the phase surfaced pre-existing issues that are
out of scope but worth tracking.

- <bullet — e.g. "Fix stale `@0.8.0` schema version references (5 files) — separate issue">
- <bullet>

### Code-verifiable state

Optional table. Helpful when the retro scope covered multiple discrete
sub-issues with measurable deliverables.

| Sub-issue | Module / Area | Tests / Delta |
| --------- | ------------- | ------------- |
| #<N>      | `<path>`      | <delta>       |
| #<N>      | `<path>`      | <delta>       |

---

**Phase <N> code-complete. Ready for <next phase / next action> kickoff — suggest running `begin-delivery` (if the next phase is an Execution Epic) or, if present, `begin-exploration` (if it's a Discovery Epic that invokes a substantive methodology directly). Both skills' Step 1 read this retro; `begin-delivery` then feeds the futro skill, and `begin-exploration` (where available) then verifies substrate prereqs.**

---

## After writing

Don't stop at the artifact. Close the loop:

1. **Post this as a comment** on the Epic / umbrella issue (or wherever the
   next phase's kickoff will look)
2. **Update the spec document** if this retro populates a placeholder in a
   spec's phase section
3. **Edit affected issue bodies** for every item in "Adjustments" — do not
   leave adjustments unpropagated
4. **Post a short comment** on each downstream issue that was adjusted,
   linking back to this retro
5. **Update the Milestone body** if task ordering changed
6. **Close the Mini Retro issue** on the tracker if the milestone uses one

Only then is the phase closed.
