# Saved Session State

> **Saved**: 2026-09-28T12:23:43Z
> **Branch**: feature/conflict-resolution (the session worktree; the work is on `next`, pushed at 11d9a6e3dd)
> **Repo**: maxengel/rocknix (fork of ROCKNIX/distribution); EmulationStation fork at ~/Development/emulationstation-next.worktrees/qa-integration (test/qa-integration at 87b182fbe, pushed)

## Current Focus

The #236 release-candidate round after the milestone audit: the eight fix streams' work (#307, #308) was built (`4234be0b6b`), audited by two seats (D-WORKFLOW-057; `docs/audits/2026_09_28-milestone-audit-of-the-fixes-307/`, lint clean, second opinion in), the follow-ups built as `1b0d233657` and read on the VM (vm-qa run 69 fifteen suites PASS; proof-298 35 PASS; the streams' proofs run 2: 32 PASS, 1 FAIL that is #310, 4 the guest cannot run, 3 with no script). Everything is recorded and pushed; the next act is the maintainer's.

## Completed This Session

- Fix build 4234be0b6b (chain 86): records, QA-log row; vm-qa run 68's three failures each resolved (vm-qa's scripts launch 78f147f762; the round-trip's two steps in stream A; the frame claims).
- The fix audit: sixteen seat outputs (59eea24533), the findings index (165, cross-checked), 02-05, the GPT second opinion folded in (3d98778503), the punch list of fourteen carried items on #309.
- Every stream's follow-up merged (F2, F1, C, D, A, B into next; E1, E2 into the ES branch); the ES pin at 87b182fbe (1b0d233657); B's branch rebased onto the rewritten history.
- Chain 87 (x64 run 87, H700 run 65; images under /workspace/artifacts/rocknix-images/*-all-20260928-1b0d233657/ with RECORD.txt), vm-qa 69, proof-298, the proofs' two runs (docs/qa-frames/2026-09-28/proofs-307/).
- #307 ticked (79) and struck (2) with a comment; #308 closed completed; #309 opened (14 items); #310 opened (the launch cycle's 10 MiB a game); #236 and #309 commented with the results.
- Register: D-WORKFLOW-058/059, D-QA-054, D-UI-114/115, D-RA-041..043, D-CLOUD-146..148, D-INFRA-012..014, D-RA-034 settled; rules: es-player-text (the match line, the help bar), upgrade-and-install (D-CLOUD-102), the hooks' missing-pattern refusal, the lint keying G-ids; the W39 weekly summary and the round's retro (ceremony-check: nothing overdue).
- The change-log entry for the round (docs/cloud-sync-changelog.md, 238 lines, checked on 1b0d233657); the catalog regenerated.
- The pl-* worktrees removed (all merged); the build worktrees on the rewritten history.

## In Progress

- Nothing running. Guest d (port 10026) is up on 1b0d233657, on the carousel, its cloud folder back on /ROCKNIX/*; guests a and b belong to vm-qa.

## Next Steps

1. The maintainer's yeses: step 0 of `release-candidates.md` on 1b0d233657's tree (tools/fork-package-freshness, the upstream distance, the ES pin against ROCKNIX's master, tools/box-check, tools/release-catalog --check); then the copy of h700-all-20260928-1b0d233657's tar to the RG35XX SP's /storage/.update and the reboot, each on its own yes (D-QA-011/015). The SP runs d39ccdfff3 since 2026-09-27 21:57 UTC.
2. The proposed player words for approval: D-UI-112 (SOME ACHIEVEMENT IMAGES COULDN'T BE SAVED. TRY THE SCAN AGAIN. / YOUR PROGRESS COULDN'T BE READ), D-UI-115 (COULDN'T SAVE WHAT YOU TICKED, SO NOTHING WAS RESTORED. / YOUR LAST GAME'S SAVES ARE STILL BEING RECORDED. TRY AGAIN IN A MOMENT.), stream B's list (docs/audits/2026_09_25-milestone-rc-round-since-258/streams/reports/B-report.md § Player words proposed), stream C's page note.
3. Open register questions: D-UI-111 (the M+ 1p font: a sharp-size table or a face change), D-NET-012 (the phone page on plain LAN HTTP), D-NET-013 (the default-route test).
4. #309's fourteen items and #310 are the next round's work; #310 first (the mapping named from /proc/<pid>/maps across one launch).
5. The blind proofs run left 52 set-aside sets and a settings backup in the QA backend's /ROCKNIX folder (09:32-10:23 UTC); vm-qa re-seeds at its start; purge by hand if wanted (tools/cloud-test-backend).

## Key Files Modified

| File | Change | Notes |
| --- | --- | --- |
| `docs/audits/2026_09_28-milestone-audit-of-the-fixes-307/` | Created | the fix audit: running log, research, 02-05, seats/, second-opinions/ |
| `docs/cloud-sync-changelog.md` | Modified | the round's entry, checked on 1b0d233657 |
| `docs/vm-qa-log.md`, `docs/releases/catalog.md` | Modified | rows for 4234be0b6b and 1b0d233657 |
| `docs/qa-frames/2026-09-28/proofs-307/` | Created | run1.md, run2.md, the cited frames, the PL-069 csvs |
| `tools/vm-qa`, `tools/vm-walks/claims.txt` | Modified | the SIGINT wrapper; the rotation fixture; the claims for the round's frames |
| `tools/lint-audit-artifacts`, `.githooks/pre-push`, `.githooks/pre-commit` | Modified | G-stream-NN ids; the missing-pattern refusal |
| `docs/decision-register.md`, `.claude/rules/es-player-text.md`, `.claude/rules/upgrade-and-install.md` | Modified | the rows above; the match line and the help bar; D-CLOUD-102 |
| `docs/work-logs/2026_09-work_logs/2026_09_28-work_log.md`, `2026-W39-summary.md` | Modified / Created | the day's entries and the retro; the weekly summary |

## Related Context

- **Tracker**: #236 (the round), #307 (closed by the maintainer, ticked), #308 (closed), #309 (open, 14), #310 (open, new); milestone audit folder docs/audits/2026_09_25-milestone-rc-round-since-258/.
- **Session scripts and logs**: /workspace/tmp/rocknix-session/ (chain-87*.sh, records-*.py, proofs-307/, the stream reports under streams/, the change-log and scorecard drafts).
- **Images**: /workspace/artifacts/rocknix-images/{x64,h700}-all-20260928-1b0d233657/ and -4234be0b6b/.

## Notes for Next Session

- No commit in the primary checkout while a background job holds a staged merge there (memory one-index-per-checkout); every log heading from `date -u` (memory timestamps-from-the-clock); a seat packet is the branch's whole diff (D-WORKFLOW-058); the masking sed that masks closes its group at the `=` (memory credential-filter-hides-pass-fail); `pgrep -f` patterns that cannot match their own shell (`tools/vm-q[a] `).
- A chain's `wait` waits for every child: gate only what needs the gate, in its own script.
- The 2026-09-26 day file does not exist; the 26th's entries sit in the 25th's file (noted in the W39 summary).

## Open Questions

- The copy and the reboot of 1b0d233657's H700 image on the RG35XX SP (the maintainer's yeses).
- The proposed words (step 2 above); D-UI-111; D-NET-012/013.
- Whether the seven-day sweep the second opinion asked for -- a seat pass over the follow-ups (PL-006 on #309, Medium) -- runs before the candidate is called, or as the next audit's first work.
