# Blindspot Register (Template / Starter)

This file is a **template**. Copy it to your project's docs directory
(e.g., somewhere under `docs/`) when
your first futro surfaces a blindspot worth cataloguing. The project-level
register is a living document; this template stays put as a starting frame.

---

## What is the blindspot register?

A **blindspot** is a systematic weakness — a pattern that this project
/ team / codebase underweights, misses, or gets wrong consistently.
Examples:

- Always underestimating migration work
- Assuming deployment configs match across environments when they don't
- Missing the case where auth tokens expire mid-request
- Forgetting that tests need DB fixtures when the prod path uses real data
- Underestimating how long dependency-graph work takes

Blindspots are **not** one-off bugs. They're recurring patterns worth
naming so future futros can check for them explicitly.

## How entries get added

1. A futro's question 4 (simulation / pre-mortem / blindspot check)
   surfaces a systematic pattern, not just a one-off risk.
2. The futro's question 5 includes "add to blindspot register" as an
   adjustment.
3. Immediately after the futro is posted, the new entry is appended here.

## How entries get used

Every subsequent futro's question 4 includes a blindspot check against
this register. For each entry, the futro asks: "Does this work trigger
this blindspot? If yes, what's the mitigation?"

Entries that go 6+ months without triggering a futro finding may be
archived (moved to a § Retired section, not deleted — the history is
useful).

## Entry format

```markdown
## <Blindspot name — short, imperative, searchable>

**Identified:** <YYYY-MM-DD> via <futro / phase / issue reference>
**Pattern:** <one-sentence description of what we systematically miss>
**Typical consequence:** <what happens when we miss it>
**Mitigation in futros:** <specific thing to check when this pattern might apply>

**Instances:**

- <YYYY-MM-DD> — <phase / issue> — <what happened in that instance>
- <YYYY-MM-DD> — <phase / issue> — <what happened>
```

---

## Starter entries (examples — replace with real ones)

These are illustrative. Delete and replace as your project's actual
blindspots surface.

## <Example> Migration time is underestimated

**Identified:** <date> via <futro ref>
**Pattern:** We estimate migration work based on "write the migration SQL"
but the actual work is 3–5× that: testing against realistic data volumes,
verifying idempotency, coordinating with active connections, writing
rollback plans.

**Typical consequence:** Migration phases run 50–200% over estimate and
frequently require a follow-up patch migration.

**Mitigation in futros:** If the work includes a migration, multiply the
estimate by at least 2× in question 1. Flag "migration estimate" as an
explicit assumption. If the migration touches a table with > 1M rows,
add an investigation task for perf verification at realistic scale.

**Instances:**

- <date> — <phase> — <example>

---

## <Example> Environment-specific configuration drifts silently

**Identified:** <date> via <futro ref>
**Pattern:** Staging and production compose files drift apart as urgent
fixes land in prod but don't backport; similarly, dev configs accumulate
local-only shortcuts.

**Typical consequence:** "Works in staging, breaks in prod" incidents;
developer environments that silently use different auth flows than
production.

**Mitigation in futros:** If the work touches `docker-compose.*.yml`,
Caddyfile, or environment variables, add an investigation task to diff
across all environment variants and document any intentional divergences.

**Instances:**

- <date> — <phase> — <example>
