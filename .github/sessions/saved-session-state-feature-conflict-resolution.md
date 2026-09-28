# Saved Session State

> **Saved**: 2026-09-28T17:01:18Z
> **Branch**: feature/conflict-resolution (the session worktree; the work is on `next`, pushed at 1850043378)
> **Repo**: maxengel/rocknix (fork of ROCKNIX/distribution); EmulationStation fork at ~/Development/emulationstation-next.worktrees/qa-integration (`test/qa-integration` at 83b5386f05, pushed; the distribution's ES pin is that commit, 17fe77bbab)

## Current Focus

Phase 7 of the milestone-tier audit of the fix round (D-WORKFLOW-060, #313, 34 items): merging the eight Opus streams' branches one at a time with the harness gating each merge, recording every outcome in `05-punch-list.md` (table + YAML) and on #313, then chain 88 and the candidate call. 16 of 34 closed: the integrator's seven (PL-011/012/013/023/025/026/027), E1 (PL-010, PL-018), E2 (PL-019; PL-030 withdrawn at the source), F1 (PL-024), C (PL-009/014/021/032). Open: A (PL-001/002/004/015/034), B (PL-003/005/006/007/008/016/017/022/028), D (PL-031/033), F2 (PL-020), the integrator's PL-029 (the next cut's proofs).

## In Progress

- Streams A, B, D, F2 running (agents dispatched 15:53 UTC; reports to `/workspace/tmp/rocknix-session/streams2/<X>-report.md`); C's follow-up (extend `cloud_log_scrub` to `es_log*.txt`) running; B was sent PL-028 mid-run, R-01 for PL-022, the widening of PL-006, E1's cut-file lead and C's `key=`/`access_key_id` lead.
- Merged into `next`: F1 (`e3394a893f`), C (`8840998047`, a harness conflict resolved by keeping both blocks, F1 first). Into `test/qa-integration`: E1 (`b8e0b382e`), E2 (`55a1f6b29`), E1's follow-up (`83b5386f05`). Each merge: verify the branch (commits with `Already written:` and the trailer, es-syntax-check / pkgcheck, the built test binaries run by the integrator), merge with `/workspace/tmp/rocknix-session/integrate-pl2.sh <x>` (detached; a harness conflict in `tools/last-good-scripts-test` is resolved by keeping both appended blocks before the verdict line), re-run `BASE_REF=f3d19dc8fb ./tools/last-good-scripts-test --old` in the stream's worktree to confirm the fail-before claim, then record.

## Next Steps

1. Each remaining report: verify, merge (A, B, D, F2 into `next`), fail-before re-run, record in 05 and tick #313, running-log line.
2. When the last distribution branch is merged: `/workspace/tmp/rocknix-session/chain-88.sh` detached (sync, x64 run 88, H700 run 66, images kept, vm-qa 70, guest d, proof-298, proofs run 3, the upgrade rehearsal from `d39ccdfff3`); no commit to `next` between its sync and its last image.
3. On the cut: PL-029's proofs (the rehearsal, the migration on a guest, the E1/E2 follow-ups' proofs, the runner's NOT RUN), the frames E2/F1/C ask for (the BIOS-alone page at 640x480; a downgrade and return; the socket refusal; STOP IT AND PLAY), records (RECORD.txt x2, the QA log row, the catalog), `tools/lint-audit-artifacts <folder> --issue 313` PASS, the candidate call on #236, the device yeses (copy, then reboot, each asked).
4. The maintainer's own (asked on #312 and in chat): the CI secret `FORBIDDEN_PATTERNS`, #260's two edits, the history rewrite.

## Notes for Next Session

- Never write the wordlist's words anywhere the fork carries; the list is `~/.config/rocknix/forbidden-terms`.
- A commit is gated on a test's own rc, never on `test | grep | cut && git commit` (16:29 UTC's slip, friction log).
- The harness reads by offset: never edit `tools/last-good-scripts-test` in the primary while a run of it is in flight; the `--old` re-runs go in the stream's worktree.
- `es-syntax-check` needs the file's real path (`es-app/src/WifiText.cpp`, not es-core).
- The harness's signal line reads `/proc/$$/status`; `$(awk … /proc/self/status)` reads awk's.

## Open Questions

- The `awecelot` references (theirs to keep or drop); the ES fork's runner half of the wordlist check (on their word).

