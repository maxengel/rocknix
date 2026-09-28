# Saved Session State

> **Saved**: 2026-09-28T18:42:00Z
> **Branch**: feature/conflict-resolution (the session worktree; the work is on `next`, pushed at 8196071ff5, which is chain 88's BUILD_ID)
> **Repo**: maxengel/rocknix; EmulationStation fork `test/qa-integration` at c15c698367 (the distribution's pin, three bumps today)

## Current Focus

Phase 7 of the audit of the fix round (#313, 34 items) is merged and recorded: 33 of 34 resolved or withdrawn on `next`, PL-029 (the candidate's own proofs) open until the cut. Chain 88 started 18:40 UTC from `8196071ff5` (`/workspace/tmp/rocknix-session/chain-88.sh`, log `chain-88.log`, rc `chain-88.rc`): sync -> x64 run 88 -> H700 run 66 -> images kept under `/workspace/artifacts/rocknix-images/{x64,h700}-all-20260928-8196071ff5/` -> vm-qa run 70 -> guest d rebuilt -> proof-298 -> proofs-307 run 3 (`proofs-307/run3.md`) -> the upgrade rehearsal from `d39ccdfff3` (`rehearsal-88.log/.rc`). No commit to `next` between the chain's sync and the H700 image ("H700 done" in `chain-88.log`).

## Next Steps

1. When chain 88 ends: read every step's rc and log; vm-qa 70's report (fifteen suites, `frame-diff` boxes claimed or filed), proof-298, run3.md (expect PL-001's proofs unchanged, `E2-pl061` for PL-034, `F2-autoslot` for D-LAUNCH-007), the rehearsal (PL-024's fix seen: `is-active` on the image). Then PL-029's remaining proofs: the migration on a guest against the QA cloud, the E1/E2 follow-ups' proofs (the BIOS-alone page frame at 640x480, the 69-gaps card with the link cut mid exit sync, STOP IT AND PLAY, the downgrade-and-return two boots, the socket refusal, `wifictl join` on guest d, the cut `system.cfg` repaired at boot, a legacy zip with stored members), `tools/time-to-play` for `settings_base`'s two forks per shell settings write.
2. Records: RECORD.txt x2, the QA log row, `tools/release-catalog`, `docs/cloud-sync-changelog.md`'s entry for the round (the change-log rule: written the day the change lands, claims checked against the build), the Phase 7 work-log entry, PL-029's outcome, `tools/lint-audit-artifacts <folder> --issue 313` PASS, #313 closed with the evidence, D-WORKFLOW-060's round retro (mini-retro).
3. The candidate call on #236; the RG35XX SP's copy and reboot, each asked for by name (D-QA-011).
4. The maintainer's own: the CI secret `FORBIDDEN_PATTERNS`, #260's two edits, the history rewrite.

## Notes for Next Session

- The merge chain script is `merge-stream.sh <x> <base> <wait-rc>`; its busy check is `primary_harness_running` (a `|| pgrep | while read` always read busy). Kill a chain only by a pattern anchored at its argv start (`^/bin/bash /workspace/tmp/rocknix-session/merge-stream\.sh`); a plain literal elsewhere in the same command killed the tool shell once today.
- B's `--old` runs need stdin closed (`< /dev/null`); both harness calls in the chain have it.
- Never write the wordlist's words anywhere the fork carries; the list is `~/.config/rocknix/forbidden-terms`.
- A commit is gated on a test's own rc, never through a pipe ending in a filter.
- `date -u '+%Y-%m-%d %H:%M'` needs its quotes; twice today the friction line got an empty date.

## Open Questions

- The `awecelot` references; the ES fork's runner half of the wordlist check; whether guest d (5.9 GB) should be stopped for builds (the chain rebuilds it).

