# Saved Session State

> **Saved**: 2026-09-28T21:15:35Z
> **Branch**: feature/conflict-resolution (the session worktree; the work is on `next`, pushed at ee5e0e8d25 -- upstream/next fe127fad01 merged in 4c291eec63)
> **Repo**: maxengel/rocknix; EmulationStation fork `test/qa-integration` at c15c698367 (the distribution's pin)

## Current Focus

The candidate for #236 after the audit of the fix round (#313: 33 of 34 items closed; PL-029 open until the cut is proven). Chain 88's cut `8196071ff5` proved clean (vm-qa 70 fifteen suites PASS; proof-298 35 PASS; the upgrade rehearsal from `d39ccdfff3` PASS; proofs-307 run 3 + 3b: every stream script clean but E1-pl069 and its control, which fail on #310's known growth). Step 0 of `release-candidates.md` on that head found `upstream/next` 8 commits ahead (merged, `4c291eec63`) and `raofflineproxy` 23 commits behind its author (stream D bumping it on `feature/pl-d2`, agent resumed 20:46 UTC); #305/#306 closed completed, #310 carried (D-QA-055). The candidate is chain 89's cut from the head the bump lands on.

## In Progress

- `proofs-307/run3c.sh E2-pl062 X-socket X-legacy-zip X-gaps-card X-migrate` running on guest d (started 21:14; rc to `/workspace/tmp/rocknix-session/run3c.rc`); `X-bios-alone.sh` corrected (the page's ticks set through `cloudsync.pick.backup.*`, `to_hub`, two walks) and to run after it: `run3c.sh X-bios-alone`. The six X proofs are this cut's own (PL-029 and the streams' owed VM proofs); their first run failed on the scripts, not the code (a 1 GiB stand-in disk, a tar.gz archive, an unmade cloud root, a launch under an open page, a walk off the carousel).
- Stream D's proxy bump: verify (the 13 patches re-applied, section t green, PKG_SHA256), merge with `merge-stream.sh d2 <merge-base> ""`, then `tools/build-preflight --stop-vms` and `chain-89.sh` (written; it sets guest d's fixtures after the rebuild) with a waiter; no commit to `next` between its sync and the H700 image.

## Next Steps

1. When run 3c ends: read the X proofs (view `frames/X-bios-alone-systems-page.png` and the `X-gaps-card/` series with the Read tool), re-run any that still fail on the script; then `python3 /workspace/tmp/rocknix-session/records-8196071ff5.py` (RECORD.txt x2 and the QA-log row for 8196071ff5), `tools/release-catalog`, commit.
2. When D reports: merge, preflight, chain 89 (~3 h: kernels rebuild after the upstream merge); then its records, PL-029's outcome (the rehearsal, the migration on a guest, the proofs' run 4, the frames; the Wi-Fi adapter named as the fact the VM cannot hold), the change-log entry (`changelog-313.md`, BUILD_ID to chain 89's), `tools/lint-audit-artifacts <folder> --issue 313` PASS, #313 closed, the candidate call on #236 (the build, step 0's verdict, the soak's read is the maintainer's), the RG35XX SP's copy and reboot each asked.
3. The maintainer's own: the CI secret, #260's two edits, the history rewrite.

## Notes for Next Session

- `merge-stream.sh` has the fixed busy check; kill a chain only by `^/bin/bash /workspace/tmp/rocknix-session/merge-stream\.sh`.
- The harness and the proofs need stdin closed (`< /dev/null`).
- A proof on guest d starts with `debug_reboot; sleep 30` to be on the carousel; a POST /launch under an open page returns 200 and starts nothing.
- Guest d's fixtures: `/workspace/tmp/rocknix-session/fixtures-d.sh` (its own cloud folder /QA307d, seeded, the RA QA account).
- Never write the wordlist's words anywhere the fork carries.

