# Saved Session State

> **Saved**: 2026-09-28T16:03:00Z
> **Branch**: feature/conflict-resolution (the session worktree; the work is on `next`, pushed at d6f6f669ec)
> **Repo**: maxengel/rocknix (fork of ROCKNIX/distribution); EmulationStation fork at ~/Development/emulationstation-next.worktrees/qa-integration (`test/qa-integration` at 7d999fd15, pushed)

## Current Focus

The #236 release-candidate round: the milestone-tier audit of the whole fix round (D-WORKFLOW-060, `docs/audits/2026_09_28-milestone-audit-of-the-fix-round/`) is in Phase 4.6/7. The blind second opinion is graded (PL-028, PL-029 added; 29 items); the refutation pass is running (rc to `/workspace/tmp/rocknix-session/so-refute.rc`, output `second-opinions/refutation-gpt.md`); eight Opus stream agents are fixing the punch list on `feature/pl-{a,b,c,d,f1,f2}` (from `next` f3d19dc8fb) and `feature/pl-e{1,2}` (from `test/qa-integration` 7d999fd15), reports to `/workspace/tmp/rocknix-session/streams2/<X>-report.md`. The maintainer's wordlist request (#312) is delivered except the CI secret and issue #260, which are theirs.

## Completed This Session (since the 12:23 stash)

- The wordlist (#312, D-WORKFLOW-061): 48 files reworded (d430818548); `.githooks/guard-lib` + `pre-commit`, `commit-msg`, `pre-push` in both repositories, fail closed, the list at `~/.config/rocknix/forbidden-terms` (never in a tree; 3e70ef9239, ES 7d999fd15); `tools/forbidden-terms-check` (0 hits both trees); `.githooks/hooks-test` PASS (27), ES `pre-push-test` PASS (21); `.github/workflows/fork-wordlist.yml` on every branch push (10bdc63d92; red until the maintainer sets the `FORBIDDEN_PATTERNS` secret -- the command is on #312). The Foundry endpoint moved to `~/.config/council/env` (`AZURE_AI_FOUNDRY_BASE`). The old issue #311 was deleted (its title carried the words); #312 replaces it; #260's body line 12 and one comment still carry them (reworded copies at `/workspace/tmp/rocknix-session/issue-260/`; the classifier refused the edit). History rewrite files for the maintainer: `~/.config/rocknix/replace-text`, `replace-message`.
- The integrator's punch items on `next`: PL-011, PL-012, PL-026 (3e70ef9239), PL-012's gitignore half, PL-013, PL-023, PL-025, PL-027 (f3d19dc8fb). PL-023's proof: the committed harness `PASSED` rc 0 (`harness-pl023-normal.log`); the skip variant runs in the throwaway worktree `/workspace/repos/rocknix.worktrees/skip-proof` (remove with `tools/fork-worktree remove` when done).
- The lint gains the carried-verdict check (d6f6f669ec, blindspot 68).
- Audit docs: 04 § Second opinion (blind half), 05 with PL-028/PL-029, briefs under `streams/briefs/`, the running log through Phase 7's opening (cba6ae23f2).

## In Progress

- The refutation pass (dispatched 15:45 UTC): grade it into 04 § Second opinion (command, provenance, served model, a table, net effect); finalize 05; `tools/lint-audit-artifacts` (the 29 open outcomes are expected until Phase 7).
- The streams: on each report, read it against the acceptance, record the outcome in 05's Phase 7 table and YAML (Resolved `<sha>` / Deferred / Withdrawn with the evidence), merge the branch into `next` in the primary (`integrate-pl.sh` pattern: one at a time, the harness gating, no commit in the primary while a merge is staged), then the ES branches into `test/qa-integration`, bump the ES pin in `projects/ROCKNIX/packages/ui/emulationstation/package.mk`, run `tools/es-syntax-check` on touched .cpp, then chain 88 (x64 + H700 from one synced head), vm-qa, the proofs' scripts, PL-029's rehearsal, records, the candidate call on #236, the device yeses (the copy and the reboot each asked).

## Next Steps

1. When `so-refute.rc` exists: read `refutation-gpt.md`, grade, finalize 05, run the lint, create the Phase 6 issue (`audit`, `punch-list` labels, one checkbox per item, `--repo maxengel/rocknix`), back-link.
2. When `harness-pl023-skip.rc` exists: expect `PASSED, N SKIPPED` rc 3; record in 05's PL-023 outcome; remove the skip-proof worktree.
3. Stream reports as they land (order of arrival); PL-028 was sent to stream B mid-run.
4. The maintainer's three commands: the CI secret, #260's two edits, the history rewrite (their call; costs in #312's body).

## Key Files Modified

| File | Change | Notes |
| --- | --- | --- |
| `.githooks/guard-lib`, `pre-commit`, `commit-msg`, `pre-push`, `hooks-test` | new/rewritten | fail closed; the wordlist outside the tree |
| `tools/forbidden-terms-check` | new | tree or stdin; path:line only |
| `.github/workflows/fork-wordlist.yml` | new | every branch push |
| `tools/lint-audit-artifacts` | modified | carried-verdict check |
| `tools/last-good-scripts-test`, `tools/vm-qa` | modified | PL-023, PL-025 |
| `docs/audits/2026_09_28-milestone-audit-of-the-fix-round/*` | in progress | 04, 05, running log, briefs, second-opinions |
| `docs/decision-register.md` | D-WORKFLOW-061 | |

## Notes for Next Session

- Never write the wordlist's words anywhere the fork carries; say "the wordlist". The permission classifier refuses `gh secret set` and edits of other issues' bodies; leave those to the maintainer.
- The pre-commit refused its own comment once (a kernel patch name with an `sk-` tail): a comment is content too.
- Concurrent harness runs share fixed `/tmp` paths; run PL-023-style proofs when the streams are quiet if a result looks flaky.
- Read the rules from `/workspace/repos/rocknix/.claude/rules/` (next), not this worktree.

## Open Questions

- The `awecelot` references (the maintainer's own e-mail in three RetroArch patch headers, the playbook name in `working-principles.md`): theirs to keep or drop.
- Whether the ES fork gets the runner half too (the same workflow and secret on `maxengel/emulationstation-next`).
