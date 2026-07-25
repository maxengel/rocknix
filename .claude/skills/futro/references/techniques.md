# Futro Techniques

Deeper guidance for question 4 of a futro ("What could we be missing?").
Four complementary techniques, ordered by primacy. Run them all; they
surface different classes of risk.

---

## 1. Agent-execution simulation (primary)

**The central question:** imagine a fresh agent (AI or human) picks up
this plan cold — what will they actually do, step by step, and where
will they hit traps?

This is **not** the same as mentally walking through an idealized
execution. The value comes from simulating a real agent's decision
process: what they'll read first, what assumptions they'll form from
that reading, what they'll do when the plan is ambiguous, what shortcuts
they'll take, what they'll skip.

Done well, this technique catches more pre-execution bugs than the
other three combined.

### How to run it

Pick a specific agent archetype to simulate:

- **Fresh-context AI agent** (Crush, Claude Code, Copilot) arriving
  cold with only the issue body, spec section, and repo access
- **Future-you, two weeks from now**, remembering only the high-level
  shape
- **Another human developer** familiar with the codebase but not this
  feature
- **A parallel-channel agent** handed the issue as a background task
  via `/copilot` or similar

The choice matters: a fresh AI agent will read the issue body literally
and grep for patterns, while a colleague will ask implicit questions
out loud. Different blindspots.

Then walk their execution forward in concrete steps. At each step, use
**"What if?" scaffolding** to branch into the failure modes:

### "What if?" scaffolding

A library of small thought experiments. Pick the ones that fit the work
and apply them to each step of the imagined execution:

#### Entry-point "what if?"s

- What if they read only the issue body and skip the linked decision doc?
- What if they start with the test file rather than the implementation?
- What if they grep for a term that has two meanings in this codebase?
- What if the first file they open is stale / recently moved?
- What if they don't notice that a referenced function is now deprecated?

#### Interpretation "what if?"s

- What if step N is ambiguous — what's the most likely wrong reading?
- What if a referenced acceptance criterion is genuinely interpretable
  two ways? Which interpretation wins by default?
- What if they confuse this concept with a similarly-named one elsewhere
  (e.g. `capability_type` in manifest vs `CapabilityType` in a type
  alias)?
- What if they follow a naming convention they remember from a similar
  project that doesn't apply here?

#### Shortcut "what if?"s

- What if they skip step N because "it's obvious"?
- What if they don't actually run the tests they wrote and trust that
  they pass?
- What if they commit without running the drift guards?
- What if they batch-resolve two unrelated concerns because they
  happened to be in the same file?

#### State "what if?"s

- What if the database is in state X when they start, not state Y?
- What if their local tests pass but CI fails because of env drift?
- What if a singleton they rely on is already initialized with wrong config?
- What if the feature flag they depend on is off in their environment
  but on in staging?

#### Dependency "what if?"s

- What if the upstream module they import just changed signatures?
- What if the prior phase's artifact isn't actually deployed yet?
- What if a pre-existing drift-guard test passes today but will fail
  once this change lands?
- What if a workspace-local package needs rebuilding that they don't
  know about?

#### Network-reachability "what if?"s (for anything touching cloud resources with `network_acls` / firewalls)

For every step that has an agent / VM / CI runner / operator host
invoking a remote resource (Key Vault, Storage, Postgres, OpenBao,
any service behind a WAF or NSG), trace the egress path explicitly:

- What if the execution host's egress IP is **not** in the resource's
  `network_acls.ip_rules`? (control-plane RBAC + data-plane access
  policy can both pass while the firewall returns `403
ForbiddenByFirewall` at runtime — see the Three-Axis Grant Integrity
  reframe)
- What if the plan assumes a private endpoint exists when only an
  IP-allowlist pattern is in IaC? (and vice versa)
- What if the host running `tofu apply` / `tofu import` is different
  from the host whose IP is in `ip_rules`?
- What if a `bypass = "AzureServices"` exemption that the team assumed
  was present has actually been tightened to `"None"`?
- What if the plan grants identity + authorization but never names
  **which host's egress IP** needs to reach **which resource**?
- What if the audit says "the firewall is restrictive" without
  enumerating the allowed IPs? (a symbolic finding that hides three
  different failure modes)

> **Origin:** drawn from an operator-host key-vault firewall RCA in a
> sibling project. The futro modelled identity + authorization; the
> network axis was a known unknown that never reached the simulation
> step. AC1–AC4 passed; AC5 (downstream import) failed at runtime on the
> firewall.

#### Toolchain-availability "what if?"s

- What if the build/test toolchain isn't installed in the dev container
  (e.g. `mvn`, a specific node version, a language SDK) and the existing
  `build.sh` only handles the build path, not the test path?
- What if the language is normally Dockerized for CI but no local
  Docker invocation is documented?
- What if a CLI the plan assumes (`gh`, `kubectl`, `terraform`,
  `tofu`) is present but pinned to a version that doesn't support a
  flag the plan uses?
- What if running tests locally requires a service (database,
  Keycloak, OpenBao) that isn't started by default in this workspace?
- What if the test suite assumes a fixture file that's `.gitignore`d
  and gets generated by a setup step the plan skipped?

> **Origin:** added 2026-05-04 from the Epic #2373 mini retro —
> Maven was not installed in the dev container; the SPI's `build.sh`
> only ran `mvn package -DskipTests`. Cost: one round-trip to derive
> the Docker `mvn test` invocation. Catching this in the futro would
> have surfaced the gap before T8 execution.

#### Concurrency "what if?"s (for anything touching shared state)

- What if two agents try this work in parallel (different worktrees)?
- What if a race condition between steps N and N+1 happens?
- What if the lock they just grabbed is already held by a long-running
  operation?
- What if mid-step, the process is killed?

#### Failure-path "what if?"s

- What if step N throws an exception?
- What if the rollback they planned leaves partial state?
- What if the error message they emit is so generic that the next
  operator can't debug it?
- What if their test for the happy path passes but there's no test for
  the sad path they forgot?

### Output per finding

State the step, the decision point, the wrong turn, and the plan change
that prevents it. Specific:

> **Step F.3** (call `isDependencySatisfied` inside the lock) —
> simulated a fresh AI agent reading the #1558 body. They'll likely
> interpret "call inside the lock" as "put the function call inside
> the lock block," but the decision doc specifies that the call must
> happen **after** the lock is acquired and **before** the write —
> which is a different (tighter) requirement. Most likely wrong turn:
> they'll call it immediately at the top of the lock block before the
> state is even read inside the transaction.
>
> **Plan change:** revise AC to say "inside the lock, after reading
> fresh state, before writing the lifecycle transition." Add the
> docstring example from #1556 to the AC so the intended shape is
> unambiguous.

### When simulation returns nothing

If you walk the agent through every step and find no traps, two
possibilities:

1. **The plan is genuinely well-understood.** Rare but real, especially
   for small well-patterned work that resembles recent phases closely.
2. **You haven't simulated hard enough.** Much more common.

The test: name the specific agent archetype you simulated. "A fresh AI
agent with only the issue body." "My future self two weeks from now."
If you can't name the archetype, you simulated a fictional perfect
executor — that's the version that never trips.

---

## 2. Pre-mortem (complementary)

**Question:** imagine this work failed and shipped broken. What's the
most likely post-incident story?

Where simulation walks the execution path forward and catches decision
traps, pre-mortem starts from a broken outcome and works backward to
identify the unseen cause. The two techniques are complementary —
simulation finds decision-point traps, pre-mortem finds outcome-level
traps.

### How to run it

1. Set a future date (30 days, 90 days).
2. Write 2–3 sentences as if you're reviewing a production incident:
   "On {date}, X happened. Root cause was Y. The code review missed
   it because Z."
3. Look at what you wrote. The specific failure mode is probably
   plausible — otherwise you couldn't have written it concretely.
4. Ask: "What in the current plan prevents that story?" If the answer
   is weak ("we'll be careful"), the plan has a gap.

### Output per finding

The imagined failure story + a specific plan change that would prevent
it. Example:

> **Pre-mortem:** "On 2026-05-15, tenants reported install failures
> with misleading 409 responses. Root cause: the enforcement gate's
> error body included the capability slug but not the full XRI, so
> operators couldn't tell which of two similarly-named capabilities
> was missing. Code review missed it because no test asserted on the
> error body shape."
>
> **Plan change:** add AC to #1558: "Error body `details.dep` is the
> full canonical XRI, not the slug. Test asserts on exact body shape."

---

## 3. Blindspot check (complementary)

**Question:** for each systematic weakness we've identified before,
does this work trigger it?

Where simulation and pre-mortem catch new risks, blindspot check
catches recurring ones — patterns the project has missed before and
would likely miss again without deliberate attention.

### How to run it

1. Load the project's blindspot register (see
   `references/blindspot-register.md` for the starter template).
2. For each entry, ask honestly: "Does this work trigger the pattern?"
3. For each YES: document a specific mitigation for this phase.
4. Also ask: "Are there new patterns I'm noticing here that should
   become register entries?"

### Output per finding

- For each register entry that applies: "Blindspot #N triggers.
  Mitigation for this phase: {specific action}."
- For each newly-discovered blindspot: "New entry — {name}. Identified
  during futro because {reason}. Add to register."

The register should be updated immediately, not deferred.

---

## 4. Pattern analysis (used for question 3, not question 4)

**Question:** have we done something structurally similar before? What
worked? What didn't?

This technique belongs to question 3 ("patterns from prior work that
apply that we haven't named"), not question 4 — but it's documented
here alongside the others for completeness, because it uses the same
muscle memory as simulation.

### How to run it

1. Identify the core structural pattern of the work — is it a schema
   migration? a registry refactor? an auth surface change? a
   cross-service coordinator?
2. Search for prior instances:
   - `git log --grep="<pattern keywords>" --oneline`
   - Grep for similar data-shape code (`grep -rn "advisory_lock" src/` —
     find other places in the codebase doing this thing)
   - Skim closed issues labeled similarly on the tracker
   - Read prior phase retros that mention the pattern
3. For each instance found, ask:
   - What worked?
   - What didn't?
   - What would they do differently next time?
4. Translate findings into concrete guidance for the current work.

### Output per finding

> **Prior instance:** `services/pspace-api/src/a2a/capability-helpers.ts`
> (commit `2f1a...`) implemented an in-memory lock with similar
> Set-keyed-by-pair semantics.
>
> **What worked:** simple and fast.
>
> **What didn't:** didn't survive multi-instance deploy (documented in
> the #1556 critique).
>
> **Applied to current work:** this is exactly why #1556 chose
> advisory-locks over in-memory — already baked into the plan, no
> adjustment needed.

---

## Running all four

For a meaningful futro, run simulation first (it catches the most, most
concretely), then pre-mortem (catches what simulation missed at the
outcome level), then blindspot check (catches what you were never going
to catch without the register), then pattern analysis (which feeds
question 3, not question 4).

If simulation alone produces 3+ concrete findings, the other techniques
are still worth running but are lower-priority. If simulation produces
zero findings, treat that as a signal to simulate harder — specifically,
pick a different agent archetype and run again. The most common failure
mode of a futro is simulating too gracefully.
