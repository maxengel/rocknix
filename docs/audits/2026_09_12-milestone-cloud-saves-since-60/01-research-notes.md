# Research Notes — Cloud saves since audit #60 (fork issue #129)

**Auditor:** Code Auditor skill v1.10.0
**Date:** 2026-09-12
**Subject:** Milestone-tier audit, ROCKNIX `next` `e98fdd84f7`..`e1ddfd7ec2`, ES `test/qa-integration` `00a258f9d7`..`f93acc2a6`
**Spec:** GitHub issue bodies on `maxengel/rocknix` (no `docs/planning/` in this repo); driving issue #129

---

## Running Notes

### 1.1 The driving spec — #129

#129 is the audit's own spec. Its scope sentence: "Everything that landed since audit #60:
the credentials-and-rules pass (#116 #52 #71 #39 #74 #100), the evidence epic (#104/#105 and
children), the QoL and testing passes (#117-#120), and this pass (#121-#128)." Its method
clause names the `code-auditor` methodology explicitly and forbids a single-model
"be critical" pass, citing `.claude/rules/adversarial-council.md`.

Its three acceptance criteria are this audit's own deliverable and are audited in
`02-forward-audit.md` as AC-129-1..3.

**Ambiguity flagged (per 1.1):** #129's AC 3 names only D-CLOUD-085..093, D-SYS-001..008,
D-UI-033..038 and D-QA-012..014 — the rows that existed when it was written on 2026-09-11.
Twenty-eight further rows were added on 2026-09-11/12 (D-CLOUD-094..117, D-UI-039..045,
D-QA-015..020, D-INFRA-008). They are in the audit's register check by the orchestrator's
instruction, recorded separately so the reader can see which half #129 asked for.

**Second note, corrected during research:** all eight `D-SYS` rows exist. Four of the named
IDs — `D-CLOUD-094`, `D-CLOUD-101`, `D-QA-016`, `D-SYS-006` — sit in the register's **Open
decisions** table rather than `Decided`, which is a legitimate state and is recorded as such
rather than as a missing row. (First pass of the extraction script read only the `Decided`
table and reported them absent; re-derived against the whole file. Recorded because the
skill's own rule is that a negative claim needs its search trail.)

### 1.2 The issues

40 issue bodies pulled to the scratchpad. Acceptance-criteria inventory (`- [ ]`/`- [x]`
counts read from the bodies, not from memory):

| Issue | State | ACs | ticked | Note |
| --- | --- | ---: | ---: | --- |
| #11 | OPEN | 11 | 1 | epic — conflict resolution |
| #19 #20 #21 #22 #23 #24 #25 | mixed | 4/15/11/26/14/5/6 | 0/8/7/0/0/0/0 | #11 children; most not yet built |
| #39 | CLOSED | 0 | 0 | **no acceptance-criteria checklist at all** |
| #52 #71 #74 #100 #116 | CLOSED | 4/5/4/4/3 | all | credentials-and-rules pass |
| #103 #105 | CLOSED | 5/9 | all | degradation + fault injection |
| #104 | OPEN | 6 | 5 | evidence epic |
| #117 #118 #119 | CLOSED | 4/4/3 | all | QoL pass |
| #120 | OPEN | 5 | 3 | testing epic |
| #121 | OPEN | 2 | 1 | powerstate |
| #122 #123 #124 #125 #126 #128 | CLOSED | 1/2/2/3/1/2 | all | seven-issue pass |
| #127 | **OPEN** | 3 | **3** | all three ticked while the issue is open — flagged |
| #133 | OPEN | 5 | 2 | QA matrix; spawned #141 #142 #143 |
| #134 #135 #139 | OPEN | 27/13/4 | 17/0/0 | save history, time to play, offline sync |
| #138 #140 | CLOSED | 4/3 | all | card wording |
| #141 #142 #143 | OPEN | 4/4/3 | 0 | matrix findings, unfixed |

**Red flag 1:** #127 is OPEN with every acceptance criterion ticked. Either the ticks are
ahead of the work or the issue should be closed — `issue-tracking.md` § "Closing discipline"
forbids leaving a delivered issue open. Carried into Phase 2.

**Red flag 2:** #39 closed COMPLETED with **zero** acceptance criteria in its body, against
`issue-tracking.md`'s "Every actionable issue carries an 'Acceptance criteria' checklist".
Carried into Phase 2 as an unauditable-as-written criterion set.

**Red flag 3:** #104 (epic) and #120 (epic) have **no GitHub sub-issues registered**
(`gh api repos/.../issues/<n>/sub_issues` returns empty for both), where
`issue-tracking.md` § Structure requires children attached as real sub-issues. #11 has nine.

### 1.3 Git history

715 commits, 1415 files, +240889/-9466 over the range — but most of that mass is council
research artifacts (`research/council-runs/…`, out of audit scope) and upstream kernel/device
patches pulled in by merges. The in-scope code surface:

| Surface | Files | Δ |
| --- | ---: | --- |
| `projects/ROCKNIX/packages/network/rclone/` | 20 | +5470 / -624 |
| `projects/ROCKNIX/packages/rocknix/` | 21 | +1617 / -297 |
| `tools/` (excl. `tools/council/`) | 50 | +17793 / -217 |
| ES `es-app/` + `es-core/` + `tests/` | 53 | +14368 / -894 |

New files that did not exist at the #60 baseline: `cloud_capture` (1370), `cloud_net_ready`
(173), `cloud_saves_root` (175), `rocknix-evidence` (160), `tools/last-good-scripts-test`
(464), `tools/time-to-play` (1331), `tools/vm-qa` (212), `tools/vm-pair` (106),
`tools/vm-serial` (133), `tools/cloud-census` (306), `tools/emulator-exit-test` (187),
`tools/wait-lock-test` (159), `tools/cloud-capture-stamp-test` (116), `tools/vm-walks/*`;
ES `CloudText.{h,cpp}` (779), `GuiCloudTransfer.{h,cpp}` (1455), `CloudExit.h` (24),
`LaunchCommand.h` (41), `AtomicFileUtil.{h,cpp}` (309), `es-app/tests/unit/*`,
`tests/cloud-oauth-lifetime.py` (151).

Deletions of note: `cloud_saves_gameend.sh` (-17, the OS game-end hook — blindspot 23's third
instance), `rclone/sources/post-update` (-32, moved into `rocknix/sources/post-update`).

### 1.4 Doctrine in scope

Rules read **from `next` at the audited SHA** (`instruction-files.md` mandates it). Note the
invoking worktree's `CLAUDE.md` summary lists only a subset; `next` carries 21 rule files
including seven the summary never names (`handheld-evidence`, `least-surprise`,
`player-language`, `time-to-play`, `vm-first`, `rclone-cloud-sync`, `generic-x64-vm-testing`).
That gap is itself the stale-worktree trap `instruction-files.md` describes, and is why the
rubric was taken from `next`.

In scope by `paths:` glob or by subject:

- `rclone-cloud-sync.md` (563 lines) — `projects/ROCKNIX/packages/network/rclone/**`
- `engineering-practices.md`, `upgrade-and-install.md`, `es-native-ui.md`,
  `player-language.md`, `least-surprise.md`, `time-to-play.md`, `vm-first.md`,
  `handheld-evidence.md`, `generic-x64-vm-testing.md`, `issue-tracking.md`,
  `decision-register.md`, `documentation-accuracy.md`, `packaging-and-patches.md`
- `docs/blindspot-register.md` — 38 entries (1–28 table rows, 29–38 prose sections)
- `docs/decision-register.md` — 199 decided rows + 6 open

### 1.5 Prior-audit provenance map (verdicts SEQUESTERED — see Phase 2.5)

| Audit | Scope | Depth signal | Where extra scrutiny is warranted |
| --- | --- | --- | --- |
| `2026_09_03-milestone-cloud-sync-tiers` (#60) | `1cd78f4a6c..e98fdd84f7` + ES `00a258f9d7`; epics #18/#26 + #56 #58 #59 | 22 criteria; **11 findings, 1 High**; self-declared independence caveat — "run by the session that implemented the work". Its own recommendation: "A fresh-session re-audit is still worth doing before upstream." | The whole of it. PL-06 was deferred to #42 and #42 is still OPEN — carry forward. PL-10 deferred to #35, still OPEN — carry forward. |
| `2026_09_06-issue-device-flashing-runbook` (#72) | runbook + rule updates; issue tier | 10 findings, 1 High | Out of this audit's code scope; checked only for carried-forward open items. |
| `2026_09_10-graceful-degradation` | #105 (D-CLOUD-077/078 pass over every flow) | **Not a `code-auditor` artifact set** — it holds `README.md` + three read-only reports, no `01..05` files, no verdict vocabulary, no punch list. It is a research pass filed under `docs/audits/`. Trust posture is explicitly low: **blindspot 35** records that this folder's `emulationstation-flows.md` asserted `actionLine=true` by default when the header says `bool actionLine = false`, and the implementation inherited the error. | #105 is squarely in scope. Treat every factual claim in that folder as a lead needing a `file:line`, per blindspot 35's own rule. Its "verdicts", such as they are, are opened only at Phase 2.5. |

Per the milestone-tier rule, this map records WHO audited WHAT and how deep. It deliberately
does **not** transcribe any prior PASS/FAIL verdict.
