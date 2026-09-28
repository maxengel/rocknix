# Saved Session State

> **Saved**: 2026-09-28T00:17:09Z
> **Branch**: feature/conflict-resolution (the session worktree; the work lives on `next` in /workspace/repos/rocknix)
> **Repo**: maxengel/rocknix (upstream ROCKNIX/distribution)

## Current Focus

The release-candidate round (#236, `release-candidates.md`): the build with #304/#305/#306 (`7911c53bb4`) is proven on the VM and awaits the maintainer's yes for the copy and the reboot on the RG35XX SP; step 6, the milestone audit (D-QA-048), is through Phase 6 -- #307 carries 78 punch items -- and Phase 7 (resolve the Critical and the 29 Highs before any PR is cut) is the next chunk of work.

## Completed This Session

- `7911c53bb4` (x64 run 85, H700 run 63): proof-298 35/35, vm-qa run 67 all suites, frame-diff PASS; records, QA log, catalog (`ea59da6e59`); frames for #304/#305 filed and the three issues' VM checkboxes ticked with evidence comments (`2474b84335`); #306's device checkbox reworded to a read; #299's two open items carried to #278.
- The audit: 20 seat outputs in (bucket 8's gpt as 8a/8b), 93 verification entries, the findings index (409), retrospective, analysis, punch list (78), the lint (structure passes; 78 open outcomes fail until Phase 7), #307 filed, the folder committed with the day's log and D-QA-053 (open) in the register.
- Change log bullets for #304/#305/#306; the seats' upstream-fit/coverage digest saved under `seats/`.

## In Progress

- **The maintainer's yes for `7911c53bb4` on the RG35XX SP**: `stage-rg35xxsp-7911c53bb4.sh` and `stage-and-reboot-7911c53bb4.sh` in /workspace/tmp/rocknix-session refuse (rc 4) until their words replace `YES_QUOTE_NOT_GIVEN` (LABEL in double quotes).
  - **What remains**: quote the yes into both scripts, run stage-and-reboot, then the post-boot reads (device facts row, records' Device lines, #306's scan.log read, #236 comment).
- **Audit Phase 7** (#307): 1 Critical (PL-001) and 29 Highs before any PR; each fix with its `Already written:` line and its scripts-test case written first; outcomes recorded in `05-punch-list.md`'s Phase 7 table and YAML (`tools/lint-audit-artifacts ... --issue 307`).

## Next Steps

1. If the maintainer's yes arrives: quote it into the two staging scripts, run `./stage-and-reboot-7911c53bb4.sh` from /workspace/tmp/rocknix-session, read the device afterwards (masked), update `docs/releases/device-facts.md`, the RECORD.txt Device lines, #306 (scan.log read), #236.
2. Phase 7: start with PL-001 (`cloud_content_restore --match`: a failed listing aborts; the preview's plan enforced), PL-003 (`wifictl --escape no`), PL-020 (the rules file's catch-all asserted), PL-028 (the settings-phase result folded in), PL-029 (the settings-first continuation reads the ticks) -- each with a `tools/last-good-scripts-test` case seen to FAIL first.
3. Then the rest of the Highs in buckets 1-5; the GENERIC_X64 Highs after D-QA-053 is answered; the Mediums in the fork's next cut.
4. Ask the maintainer: D-QA-053 (is GENERIC_X64 ever published), and whether Phase 7's Mediums wait for after the RC (their 2026-09-27 words: "some of these might be items we just want to handle once the release candidate's out").

## Key Files Modified

| File | Change | Notes |
| --- | --- | --- |
| `docs/audits/2026_09_25-milestone-rc-round-since-258/*` | Created/extended | the audit through Phase 6; `seats/` holds every packet and output |
| `docs/qa-frames/2026-09-27/30[45]-*.png` + README | Created | the transfer line and the saves-first series on 7911c53bb4 |
| `docs/cloud-sync-changelog.md` | Modified | #304/#305/#306 bullets |
| `docs/decision-register.md` | Modified | D-QA-053 open |
| `docs/work-logs/2026_09-work_logs/2026_09_27-work_log.md`, `2026_09_28-work_log.md` | Created | the evening and the audit |

## Related Context

- **Tracker**: #236 (the round), #307 (the audit's punch list), #304/#305/#306 (proven on the VM, device reads pending), #278 (harness debts, +2 items), D-WORKFLOW-053, D-QA-048, D-QA-053.
- **Session scripts**: /workspace/tmp/rocknix-session (proof-298.sh, frame-304.sh, chain-8N.sh, stage-*-7911c53bb4.sh, audit-collect.py, audit-issue-body.md).
- **Guest d** (port 10026) is up on 7911c53bb4 with the proof's shim and helpers; the vm-qa pair is down.

## Notes for Next Session

- The Facilitator's gpt seat refuses `--transport sse`; a packet over ~500 KB is split by path (8a/8b succeeded first time where the 1 MB packet failed three buffered attempts).
- `tools/lint-audit-artifacts` fails every open punch item by design; it is the folder's closing gate.
- A fixture removed while rclone still reads it ends the sync rc 1 with `lstat ... no such file` (frame-304's own doing); remove after the stamp, never after a sleep. rclone's totals include retried bytes (the card read 25.0 MB OF 49.0 MB for a 24 MB file after a low-level retry).
- Two device facts the VM cannot give: the pad grab at a successful sign-in (PL-018; a uinput gamepad on the guest is the VM half) and the capture racing a relaunch on an A53 (PL-062).

## Open Questions

- The maintainer's yes for the copy and the reboot of `7911c53bb4` (each asked separately, D-QA-011).
- D-QA-053: is GENERIC_X64 ever published?
- Phase 7's scope before the PRs: the Critical and the Highs, or the Highs in the five PR buckets only, with the GENERIC_X64 ones after D-QA-053?
