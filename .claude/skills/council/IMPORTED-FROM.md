# Where this council came from, and what was changed on the way in

**Since 2026-09-30 the council toolchain comes from scaffold's own export, at
scaffold's own paths, with the fork adaptations listed below** (D-WORKFLOW-088,
D-WORKFLOW-090, D-WORKFLOW-135). The bundle the maintainer's agent on marvin
delivered -- `COUNCIL-BUNDLE.md` and `COUNCIL-BUNDLE.SHA256SUMS` beside this file, from
scaffold `main` at `7be6721be24458910e75ca639f318d25ffe7e8d5` (2026-09-30, corpus 4.29.1
plus #976) -- holds 94 files: `scripts/council-*`, `scripts/lint-council-*`, the verifiers,
`scripts/lib/`, `scripts/__tests__/`, `seed/corpus/`, `verifier-pins.json`,
`council-seat-efforts.json`, `.claude/agents/council-member-*.agent.md`,
`.claude/skills/council/`, `.claude/skills/council-research/` and `docs/council-*.md`.
The bundle record and its checksums describe the original delivery. Current
`verifier-pins.json` entries account for local changes to pinned files.

| Bundle path | Here | Why |
| --- | --- | --- |
| everything under `scripts/`, `seed/`, `docs/`, `.claude/agents/`, `.claude/skills/`, and the two root JSON files | same paths, with the adaptations below | the pins hash these; `verifier-pins.ts` reads `verifier-pins.json` at the repository root |
| `.github/instructions/*.instructions.md` | `.claude/rules/*.md`, `applyTo:` as a `paths:` list, `description` first (D-WORKFLOW-009) | this repo's rules directory; `.github/instructions/` is retired here. `adversarial-council.md` keeps the fork's own section (the maintainer's 2026-09-05 words on seat length) |
| `.gitignore` | the council lines merged into ours (`.council-*`, `research/**/verification/seal-key.local`; `.work/` was already ignored) | the toolchain tests copy the root ignore file into their fixture, and run-start refuses a seal key that is not ignored |
| `COUNCIL-BUNDLE.md`, `SHA256SUMS` | this directory | the bundle's own record |

Patches applied here, each pinned file re-pinned with a `repin_reason` in
`verifier-pins.json` (D-WORKFLOW-089, the maintainer's direction of 2026-09-30:
*"remove references to [the source estate] directly and just change framing and
phrasing to be about Rasteratops"*):

1. `scripts/council-run-start.ts`: a live anchor lands on the fork's own repository
   (rasteratops on GitHub, over the box's ssh key or https), pushed with plain git and
   read back with `ls-remote`; the Forge write preflight, the custody file and the token
   helper are gone, so no credential enters argv, config or the environment. Without it
   every run failed `remote_scope` and none could be anchored here. The two tests in
   `scripts/council-toolchain.node-test.mjs` that asserted the Forge helper and the
   Forge remote assert the fork's remote instead.
2. The wordlist sweep: every line that named the source estate, in 22 delivered files
   (both skills' prose, the Facilitator's two `HTTP-Referer` strings and its Azure
   Foundry default host, comments in three scripts and one test, five corpus-manifest
   paths, one pin reason), now says "the source estate", "scaffold's forge",
   "estate-local", names this fork, or carries a placeholder host. Behaviour unchanged
   except the referer. `scripts/forge-write-status.mjs` stays pinned, unimported, with
   placeholder defaults.
3. Ten fixture key literals in the two test files are built at run time (`join`), the
   fork's credential scanner's rule; identical strings at run time.
4. `.claude/agents/council-member-mistral.agent.md`: one historical line names a
   placeholder host instead of the source estate's Foundry.
5. The skill, shared references and member instructions describe only the installed
   five-seat council (D-WORKFLOW-135): Claude Fable 5.1, Gemini 3.8 Flash, GPT-6 Astra,
   Kimi K3 and Muse Spark 1.3. The imported evaluation instructions are removed.
   Inactive member files remain as historical recipe records required by the
   imported pin verifier; they explicitly forbid invocation here. Runtime profiles,
   source-bundle checksums and sealed run artifacts retain their imported meaning.

A refresh re-applies these adaptations with the scripts kept beside the session's records; the
hook's own pattern (`~/.config/rocknix/forbidden-terms`, never written anywhere) is the
check, run over every council file before the commit.

The fork uses the `definitive` profile only. D-WORKFLOW-135 refines D-WORKFLOW-109:
future fifth-seat changes come through reviewed imports from the other projects;
the current five stay in place until such a change is adopted. A refresh does not
automatically adopt another project's evaluation policy or activate extra recipes.

Not installed: the Mistral token counter's Python environment
(`scripts/lib/council-mistral-requirements.txt`) -- Mistral sits in no profile since
scaffold#915. The `forge-write-status.mjs` and `owner-queue-lint.mjs` scripts are pinned
imports of run-start's Forge branch and never run here.

## Before 2026-09-30

Imported 2026-09-05 (fork issue #70, D-WORKFLOW-003) from the `pfi/pfi-collaboration`
lineage via marvin's clone, relocated to `tools/council/` with path patches
(`REPO_ROOT` two levels up, pins beside the scripts) and re-pinned. That relocation is
what made every refresh a patch job, and it was 12 Facilitator versions behind by the
time it was replaced. The runner at `tools/council/run` survives: it loads
`~/.config/council/env` and execs the root scripts.

## Running it

Provider keys never enter the repo or the shell history. They live in
`~/.config/council/env` (0600) as `export` lines -- one `OPENROUTER_API_KEY` seats the
whole roster. Use the wrapper, which loads that file, changes to the repository root
(the Facilitator refuses any other working directory) and execs the script under the
tsx in `tools/council/node_modules`:

```bash
tools/council/run verify-pins                       # every pinned verifier's bytes, every re-pin accountable
tools/council/run efforts --strict                  # every seat's effort against the pinned catalogue snapshot
tools/council/run test                              # the toolchain, routing and seat-effort tests, no provider calls
tools/council/run invoke --member muse --prompt "…" --output research/seat-probes/<dir>/muse.txt
tools/council/run start --run-dir research/council-runs/<run>
tools/council/run lint --at-step 1 --strict research/council-runs/<run>
```

## Refreshing

Ask for a fresh export (`COUNCIL-BUNDLE.md` says how it was made), check its
`SHA256SUMS`, copy it over the same paths, re-apply the adaptations above, re-pin what changed
with a reason, run `verify-pins`, `efforts --strict` and `test`, then probe the five seats
(`research/seat-probes/`). Never relocate the files again.

For an adopted roster change, bring the model/provider/effort recipe, member
instructions, capacity and identity checks, tests and pins together. Record the
decision before the next run and start a fresh genesis; do not change an anchored
run's roster. Keep the fork's skill aligned with that selected roster.
