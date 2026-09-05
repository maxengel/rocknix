# Where this council came from, and what was changed on the way in

Imported 2026-09-05 (fork issue #70, D-WORKFLOW-003) from the
`pfi/pfi-collaboration` lineage on the forge, via marvin's clone at
`~/Development/pfi-collaboration`:

| What | Source commit |
| --- | --- |
| repository HEAD at import | `7666e87ac5a48e6baf5b99f467311c2b6d62107f` (2026-09-04) |
| `.claude/skills/council/**`, member agents, rules | `d51c09c9d60b332d57f3bbbaf364ba0c9efc3317` (2026-09-03, "limits audit + roster docs for the lifted limits") |
| Facilitator, its library, the lint | `8a4ef909b2832174db43a85448ecb1f46358a0d1` (2026-09-03, "lift the limits that cost a Step 1") |

The scaffold estate's copy (`7bcac00`, 2026-08-02) is older and lacks
`lint-council-run.ts`; do not refresh from it.

## Layout here, and the patches that follow from it

| Estate path | Here | Why |
| --- | --- | --- |
| every council script — `council-invoke.ts`, `lint-council-run.ts`, `council-run-start.ts`, `build-council-prompt.ts`, `write-step-seal.ts`, `council-run-summary.ts`, `verify-pins.ts`, `verify-chain.ts`, `verify-seals.ts`, `check-stale-blob-drift.ts`, `lint-council-seat-efforts.ts`, and `lib/council-verification.ts`, `lib/verifier-pins.ts` | `tools/council/` | `scripts/` is the build engine in this repo; fork-only tools live under `tools/` and are enumerated in `.githooks/pre-push` |
| `.github/instructions/*.instructions.md` | `.claude/rules/council-substrate-integrity.md`, `.claude/rules/adversarial-council.md` | this repo's rules; `applyTo:` became `paths:` |
| `.claude/agents/council-member-*.agent.md` | same path | the Facilitator does not read them; they document each seat. Copilot-only front-matter keys (`tools:`, `model:`) are kept as `x-tools:` / `x-declared-model:` so Claude Code does not reject the file |
| `research/council-runs/` | same path | output home; a personal path on `next`, never in an upstream PR |

Patches applied (recorded so a refresh can re-apply them):

1. Both scripts: `REPO_ROOT = resolve(__dirname, "..")` → `"../.."` — they now sit two levels below the repo root.
2. Every literal `scripts/council-invoke.ts`, `scripts/lint-council-run.ts`, `scripts/lib/council-verification.ts` and the two instruction-file paths rewritten across the skill, references, rules and agents.
3. `tools/council/package.json` (`"type": "module"`, `tsx`, the Bedrock client the Facilitator imports) so `npx tsx` runs the ESM sources; `node_modules/` is gitignored.
4. `verifier-pins.json` and `council-seat-efforts.json` live **beside the scripts** (`tools/council/`), not at the repo root: `lib/verifier-pins.ts` (`readVerifierPins`, the `git show <ref>:…` accountability read), `council-run-start.ts` and `lint-council-seat-efforts.ts` are patched to that path. The pins were regenerated against the patched files with an accountable `repin_reason` naming the source pins; `tools/council/run verify-pins` passes.
5. `docs/council-limits.md` (the 2026-09-03 limits audit) is carried under `docs/`.

`tools/council/run <command>` fronts every script (`invoke`, `lint`, `start`, `prompt`, `seal`, `summary`, `verify-pins`, `verify-chain`, `verify-seals`, `efforts`, `drift`).

Not imported: `council-research` (the 5-phase research wrapper) and its
`researcher.agent.md`. Fetch them from the same source when a run needs
fresh tool-using research first.

## Running it

Provider keys never enter the repo or the shell history. They live in
`~/.config/council/env` (0600) as `export` lines — one `OPENROUTER_API_KEY`
seats the whole roster; direct keys are optional upgrades. Use the wrapper,
which loads that file and execs the Facilitator or the lint:

```bash
tools/council/run invoke --member claude --prompt "…" --output research/council-runs/<run>/step1-claude.md
tools/council/run lint --at-step 1 research/council-runs/<run>
```

## Refreshing

`ssh marvin 'cd ~/Development/pfi-collaboration && git pull && git log -1 --format=%H -- .claude/skills/council'`,
fetch the same file set, re-apply the three patches above, and update this
table. Compare with `diff -r` before overwriting: local edits to the skill are
expected to be none.
