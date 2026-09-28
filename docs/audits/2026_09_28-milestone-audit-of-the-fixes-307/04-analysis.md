# Analysis — the fixes for #307/#308, audited (D-WORKFLOW-057)

**Auditor:** Code Auditor skill (orchestrator: Claude Fable 5.1; the seats through the council Facilitator, D-WORKFLOW-049)
**Date:** 2026-09-28 (opened 05:40 UTC; the executive summary and the scorecard are written when the streams' follow-ups are in)
**Subject:** the eight fix streams' work against the punch list (#307, 81 items) and the sweep (#308, 297 rows), built as `4234be0b6b`
**Spec:** `docs/audits/2026_09_25-milestone-rc-round-since-258/05-punch-list.md`; the streams' briefs and reports; the register rows they cite

---

## Executive summary

_(written last, from § Verification in `02-forward-audit.md` and the streams' follow-up outcomes)_

## Acceptance-criteria scorecard

_(one row per punch item once the follow-ups land: the stream's outcome, the seats' verdict, the orchestrator's verdict, the proof on the VM; the sweep rows by packet)_

## Risk assessment

Ranked by what it would cost a player if it shipped as the fix build stands (`4234be0b6b`), before the follow-ups:

1. **The guards that still fail open in `backuptool` and its neighbours** (gpt G-B-01..07): a backup that reports success over a traversal that did not finish, a credential scan that cannot complete and lets the publish through, a boot rollback that says reverted with files left. Each is the shape this project's worst shipped defects had (blindspots 13, 33). Stream B's follow-up 2 is in flight; nothing ships before it lands.
2. **`cloud_migrate_layout`'s verification** (gpt G-A-01/02): a migration that deletes its source on a substring match of rclone's summary, and after a pointer write nobody checked. The migration is the one operation in the cloud scripts that removes a player's files from their cloud on purpose; its check must be exact. With stream A.
3. **A player's own filter refused** (G-A-O1): a `RCLONEOPTS` the player wrote stops their saves backup with a reason about a file they did not write. The #71 contract says the file is theirs. With stream A.
4. **The ES log of this build can carry an unmasked password** (E1's own finding, coverage item 6, fixed `b036967fc`): `sh -c 'tool --password "front back"'` reached the log unmasked between E1's `dcf7fa8c7` and the fix. The build is not staged and will not be; a device that had run it would hold the line until its next boot.
5. **The hub loses the player's place after a folder change** (G-E2-O1): no data moves, but the confirmation the fix exists to show is off the screen, and the next press does something else. With stream E2.
6. **`--match --apply` with no plan names a change that never happened** (G-A-O2): the refusal is the safe branch; the why is wrong. With stream A.

Not a risk to a player, and worth naming: the harness's launch (G-H-01, fixed) and the packet gaps (G-D-01, G-F2-01), which are process defects of this audit, not of the build.

## Coverage boundary

- **The packets were the streams' named files at first delivery, not their branches.** D's `cheevos_armsx2.sh` rewrite and F2's gstreamer, ryzenadj, dmidecode and zip hunks reached no seat; the orchestrator read them and found them as the reports said. That is one reviewer, not two, on those hunks. The next audit's packets are `git diff base..head`, whole.
- **Follow-ups outran the packets.** D (two follow-ups), E2 (three), F1 (one) had commits landed after their packets were cut; the seats audited a moved branch, and one Critical (G-E1-01) was already fixed by a commit the seat could not see. The follow-ups made in answer to this audit (F1, F2, E1 so far; A, B, C, D, E2 in flight) have had no seat: the orchestrator reads each FAIL-then-PASS line and the diff, which is the depth this round affords. A second seat pass over the follow-ups is the next audit's first work if the maintainer wants one.
- **The interface was reviewed as diffs and as frames.** Both seats read the ES diffs; the only interface defect found (G-E2-O1) came from the build's walk frames, not from either seat. Frames cover the walked screens only (`tools/vm-walks/suite.txt`); pages no walk visits -- the RetroAchievements pages, the Wi-Fi picker, the sign-in window -- were reviewed as code alone until the proof runner's frames land (`proofs-307.md`).
- **The scripts were proved on the VM's busybox by the harness (844 checks) and by vm-qa's suites, not on a handheld.** No device fact is claimed here; the H700 twin is built and unstaged.
- **The sweep rows (#308) were spot-checked by the seats, not re-verified one by one.** Each seat took a sample per packet; the streams' own outcome per row is the record.

## Quality self-check

- Every verdict in `02-forward-audit.md` § Verification names the artifact it rests on (a commit, a line, a frame, a suite line) or says "pending the stream's delivery" -- none rests on a report's sentence alone. The two refutations by packet gap say that the orchestrator's read is the only review.
- Subagent (stream) reports were used as leads: each fixed finding is checked by its FAIL-then-PASS lines in the harness and by reading the commit; each withdrawal by the refuting line. Where the orchestrator has not yet done that, the entry says pending.
- The findings index is regenerated from the sixteen outputs (the agent's draft is a lead; the index in `02-forward-audit.md` is checked against the files before it is trusted).
- Timestamps are from the clock at the moment of writing; the log's entries were written as the steps happened (`00-running-log.md`).
- What this audit did not do: no second seat over the follow-ups; no device; no re-verification of every sweep row.

## Second opinion

_(the GPT seat's reading of this analysis, Phase 4.6, after the scorecard is written)_
