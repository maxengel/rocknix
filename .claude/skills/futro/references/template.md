# Futro Template

Copy this into the spec document phase section AND into the Epic issue
comment. Replace every `<placeholder>` with real content. **Do not leave
placeholders.** Do not invent new sections — the five-question structure
is what makes futros cross-searchable for future agents.

---

## Futro: <scope — e.g. "Phase N" or "Epic A Phase 2 (sub-issues #F through #H)">

**Prepared:** <YYYY-MM-DD>
**Scope of this futro:** <what work is about to begin. Name the out-of-scope boundary too — e.g. "Does not cover Phase N+2 work; that gets its own futro at its own kickoff.">

**Upstream retro consulted:** <link to mini-retro comment / spec section, or explicitly "none — first phase of project">
**Inputs considered:** <list: spec section, parent epic body, sub-issue bodies, prior phase retros, related closed issues, blindspot register entries>

---

### 1. What do we know and what are we assuming?

**The plan (as written):**

<quote or summarize the plan being executed>

**Explicit assumptions we are relying on:**

- <assumption — especially the obvious-feeling ones. If it's obvious, it belongs here.>
- <assumption>
- <assumption>

**Confidence:**

<one line: high / mixed / low, with one-sentence explanation>

---

### 2. What known unknowns need investigation?

Things we know we don't know. Each gets one of two treatments: an
investigation task (resolve before execution) or a documented "proceeding
without this answer because…" decision.

| Unknown                                                                                              | Treatment                            | Owner / task             |
| ---------------------------------------------------------------------------------------------------- | ------------------------------------ | ------------------------ |
| <specific question — e.g. "Does pg_advisory_xact_lock release if the connection is killed mid-txn?"> | Investigate before execution         | <task ref or todo entry> |
| <specific question>                                                                                  | Proceed without; rationale: <reason> | N/A                      |
| <specific question>                                                                                  | Investigate before execution         | <task ref>               |

If there are no known unknowns to list: "None identified at futro time."

---

### 3. What patterns from prior work apply that we haven't named?

Positive pattern-matching. Cite specific past work.

- <pattern — e.g. "Matches the pspace-api/secrets-lifecycle work (commit `a3b1c`); same FNV hashing + sorted lock order there, worked well — apply here.">
- <pattern>
- <pattern>

If genuinely no applicable patterns: "No direct prior patterns; work is novel in this codebase."

---

### 4. What could we be missing?

Primary technique: agent-execution simulation. Complementary: pre-mortem, blindspot check.

**Agent-execution simulation ("what if?" walkthrough):**

> Archetype simulated: <name one — e.g. "Fresh AI agent with only the issue body and repo access"; "Future-me two weeks from now"; "A parallel-channel Copilot CLI agent handed #F as a background task">

- **Step <N> (<what the agent will try to do>):** <what if they interpret / skip / state-assume / depend-on X? Where do they most-likely trip?>
  **Plan change / AC addition:** <specific concrete change to the plan that prevents the trap>

- **Step <N> (<next step>):** <what if?>
  **Plan change:** <change>

- <…as many as surface>

If simulation returned nothing, state explicitly: "Re-ran with archetype `<name>` after first archetype returned clean; found <X>." Do not report zero findings from a single archetype — that's a sign of too-gracious simulation, not safety.

**Pre-mortem (imagine the work failed 30 days out):**

- **Imagined failure:** <concrete two-sentence incident story: "On {date}, X happened. Root cause: Y. Code review missed it because Z.">
  **Plan change:** <specific addition that would have prevented the story>

**Blindspot check (against register at <path or "none yet">):**

- <register entry #N — does it apply? if yes, mitigation for this phase>
- <new blindspot discovered during this futro — add to register>

If all techniques genuinely returned clean: state so explicitly, technique by technique, and name the agent archetype you simulated. "Clean across the board" is not an acceptable summary without that specificity.

---

### 5. What adjustments or investigations must happen BEFORE execution?

The output. Based on 1–4, what concrete changes?

**Plan edits applied:**

- <edit — e.g. "Added AC to #1558: 'Gate invokes isDependencySatisfied() inside withCapabilityLifecycleLock() (recheck-before-commit)'">
- <edit>

**Investigation tasks opened:**

- <task — e.g. "Spike: read postgres.js docs on sql.begin rollback semantics for connection-kill mid-txn (before step 3 of F)">
- <task>

**Documented unresolved assumptions (proceeding without resolving):**

- <assumption — e.g. "Assuming external capability endpoints stay consistent across the install transaction's duration. Rationale: current health monitor polls at 60s intervals and install is <10s; follow up if timing changes.">
- <assumption>

**Blindspot register updates:**

- <entry — new blindspot added, with date/phase/description>
- OR "No register updates."

**OR** if nothing needs to happen:

> No adjustments needed — plan as written is sound; all known unknowns are acceptably documented; no unknown-unknown signals surfaced. Proceed as planned.

(Do not leave section 5 empty. Either list actions or explicitly state "no adjustments needed.")

---

**Futro complete. Ready to proceed to execution of <next phase / next sub-issue> once investigations (if any) are resolved.**

---

## After writing

Don't stop at the artifact. Close the loop:

1. **Post this as a comment** on the Epic / umbrella issue
2. **Update the spec document** if this futro populates a `### Futro: Phase N` placeholder
3. **Edit affected issue bodies** for every plan edit in section 5 — do not leave edits unpropagated
4. **File investigation tasks** on the tracker (or add to agent todo list) for each unresolved known unknown requiring pre-execution resolution
5. **Update the blindspot register** if section 5 added new entries
6. **Only then** mark the phase as "ready for execution" and begin task work
