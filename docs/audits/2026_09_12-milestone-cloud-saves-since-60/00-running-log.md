# Milestone Audit Running Log — Cloud saves since audit #60

**Auditor:** Code Auditor skill (v1.10.0), run under one orchestrator, serial
**Started:** 2026-09-12
**Scope:** fork issue #129. ROCKNIX `next` `e98fdd84f7`..`e1ddfd7ec2`; ES `test/qa-integration` `00a258f9d7`..`f93acc2a6`.
Crosses epic #11 (conflict resolution), the evidence epic (#104/#105), the QoL/testing passes
(#117-#120), the credentials-and-rules pass (#116 #52 #71 #39 #74 #100), the seven-issue pass
(#121-#128), plus #133 #135 #138 #140. Two or more epics => **Milestone tier**.
**Spec:** GitHub issue bodies on `maxengel/rocknix` (there is no `docs/planning/`).
**Worktrees:** `/workspace/repos/rocknix.worktrees/audit-129` (branch `audit/129` @ e1ddfd7ec2);
`~/Development/emulationstation-next.worktrees/audit-129` (detached @ f93acc2a6).

---

## Log Entries

### [Phase 0] Setup — worktrees, stale-skill check

Created both audit worktrees at the pinned SHAs. Primary checkout `/workspace/repos/rocknix`
confirmed on `next` @ `e1ddfd7ec28a170d8ea263713a0ba938a742b06c`; never entered.

Stale-skill-copy check (SKILL.md mandates it as the first act of Phase 0):
`diff -q` of `SKILL.md`, `references/phases.md`, `references/templates.md`,
`references/anti-patterns.md` against `next:` — **identical** in both the audit worktree and
the invoking worktree (`conflict-resolution`). No stale rubric. Logged per the skill.

Baseline identified: audit #60 = `docs/audits/2026_09_03-milestone-cloud-sync-tiers/`,
scope `1cd78f4a6c..e98fdd84f7` + ES `00a258f9d7`. So this audit's range starts at
`e98fdd84f7` / ES `00a258f9d7`.

Two audits ran *between* #60 and this one and are prior-audit inputs, not baselines:
`2026_09_06-issue-device-flashing-runbook` and `2026_09_10-graceful-degradation`.

### [Phase 0] Constraints imposed on this run (recorded so verdicts can be read correctly)

- **No guest, no QA cloud, no handheld.** Another process holds the VM pair and the QA
  endpoints. Read-only ssh to guest c is permitted for stamps/logs/config; no launches,
  reboots, syncs, transfers, `set_setting`, or any `tools/vm-*` / `cloud-round-trip` /
  `emulator-exit-test` / `time-to-play` run, and no `cloud-test-backend` subcommand beyond
  `status`/`caps`/`endpoint-prefix`/`rclone-conf`.
- Consequence for the evidence floor: SKILL.md rule 3 ("run it on a device") cannot be
  discharged by fresh runs. Device-behaviour verdicts therefore rest on **already-executed**
  runs whose logs are read in full (`/workspace/artifacts/rocknix-images/qa-a2ee7b9bb2-*`,
  `qa-d94ca7b159-*`, `time-to-play-a2ee7b9bb2-*`, `docs/qa-frames/2026-09-1{1,2}/`) and are
  marked as corroboration, never copied as verdicts. Where a criterion's only possible
  evidence is a run I may not make, the verdict is **UNTESTABLE ?** with the reason.
- **No code changes.** An audit records; the parent session and the maintainer decide.

### [Phase 1] Mechanical evidence gathered on the host (all runs mine, this session)

| Check | Result | Can it fail? |
| --- | --- | --- |
| `tools/pkgcheck rclone rocknix emulationstation linux` | no FAIL/WARN lines | **Proved by construction**: a scratch copy of the tool over a planted `PKG_CFLAGS="${CFLAGS}"` at global scope emits `[FAIL] 003: … late binding violation : ref CFLAGS`. **But the tool has no `exit` statement at all — it always exits 0.** Whole-tree run: 0 FAIL/WARN over every `package.mk`. |
| `bash -n` / `py_compile` over every touched script | 45 files, 0 failures | Weak by nature (syntax only); recorded as scope-limited. |
| `tools/last-good-scripts-test` | **PASSED**, 56 PASS / 0 FAIL, exit 0 | **Proved**: `--old` (base `1d1503180d`) gives exit 1, 34 FAIL / 22 PASS. A real positive control. |
| ES `es-unit-tests` (built in my ES worktree with the GENERIC_X64 toolchain cmake + host g++) | **29 cases / 280 assertions, 0 failed**, exit 0 | Assertions are over `CloudText` pure functions; a deliberate edit is not made (no code changes), but the suite carries negative cases (see `CloudTextTests.cpp`). |
| ES `python3 tests/cloud-oauth-lifetime.py` | **FAILS TO COMPILE — exit 1** | n/a — see finding F-01. |

### [Phase 1] F-01 (High) — the ES lifetime regression test has been broken since 2026-09-11

`tests/cloud-oauth-lifetime.py` extracts `cloudOAuthPresentChoice` and `cloudSetupPresent`
verbatim from `es-app/src/guis/GuiMenu.cpp` and compiles them under AddressSanitizer against
small doubles. Its stub is `struct CloudBackend { std::string label = "Dropbox"; };`
(`tests/cloud-oauth-lifetime.py:74`). The real struct at `GuiMenu.cpp:6226-6232` carries
`tier`, `name`, `label`, `subprovider`, and since `229f50ad4` (2026-09-11 04:30 UTC, #128)
the extracted function calls `CloudText::providerSubtitle(backend.name, backend.label)`,
which the harness neither declares nor provides.

Dated, not asserted: `python3 tests/cloud-oauth-lifetime.py /tmp/GuiMenu-pre.cpp` against
`git show 229f50ad4^:es-app/src/guis/GuiMenu.cpp` prints `PASS phone / PASS keyboard /
PASS no-browser / PASS failed-start`, exit 0. Against `f93acc2a6` it dies at g++ with
`'CloudText' has not been declared` / `'const struct CloudBackend' has no member named 'name'`.

Nothing runs it: `grep -rn 'cloud-oauth-lifetime'` finds no caller in either repo, and the ES
repo has no `.github/workflows`. `.claude/rules/es-native-ui.md:388` mandates it as the check
on the wizard page-replacement transitions — the exact crash that shipped on 2026-09-05.
So the guard has been absent through #128, #138, #140 and the whole seven-issue pass, and its
absence is indistinguishable from its silence (blindspot 14 / 23 / 26 family).

### [Phase 1-3] Research, forward audit, retrospective

Research: 40 issue bodies pulled; 715 ROCKNIX commits / 190 ES commits scoped down to the four
code surfaces; all 21 rules, 38 blindspots and 205 register rows read from `next`.
Three red flags carried into Phase 2: #127 open with every box ticked; #39 closed with **no**
acceptance checklist at all; #104 and #120 are epics with no GitHub sub-issues registered.

Forward audit: 55 criteria. 27 PASS, 6 PARTIAL, 3 FAIL, 2 SKIP, 17 UNTESTABLE.
Phase 2.5 opened the prior verdicts afterwards: audit #60's nine resolved items were
re-derived from the code and all nine hold; its two deferrals (#42, #35) are still open and
are carried forward. No disagreement with either prior artifact set.

Retrospective: 14 findings, F-01..F-14. Phase 3.5 ran six interactions; 3.6's five
missing-artifact claims each carry their literal search; 3.6.5 enumerated site/sibling/adjacent
for all five defect classes.

### [Phase 4.5] Finding verification — one finding killed

Every High and Medium finding was attacked before publication. Seven survived. **One died**:
the RetroAchievements settings-key rename looked like a silent preference reset until
`git log -S` over the ES repo showed ES has never written the old spelling. Recorded in
`03-retrospective.md` § 3.5 rather than dropped, so the next reader does not re-derive it.

### [Phase 5] Punch list + the mandatory lint

12 items. `tools/lint-audit-artifacts` run before Phase 6, as SKILL.md requires, and it **found
three things a manual check would not have**:

1. `04-analysis.md`'s scorecard heading read "Acceptance Criteria Scorecard"; the contract
   wants "Acceptance-criteria scorecard".
2. Punch items were `### PL-NN`; the contract matches `^## (PL-\d+)`.
3. Subtler: the lint slices the Phase 7 gate from the **first** heading containing "Phase 7",
   which was the *tracked-scope* section's own parenthetical ("exempt from the Phase 7 gate"),
   several sections earlier. Every item then read as having no outcome. Reworded that heading.

After the fixes: **PASS**, and `--issue 129` also PASS (15 checkboxes, all twelve PL ids
referenced).

### [Phase 6] Issues

Three High findings, three issues, each with four acceptance criteria of observable behaviour,
each labelled `audit` + `bug` + `cloud-saves` and attached to #129 as a GitHub sub-issue by
REST id: **#144** (F-01), **#145** (F-02), **#146** (F-03). #129's body carries the full
twelve-item punch list as a checklist and its three acceptance criteria are now ticked with
evidence; a summary comment records what was run and what could not be.

### [Phase 7] Resolution gate

12 of 12 items carry an outcome. **None is Resolved** — this audit was instructed not to change
code, so every item is *Deferred* to a named open issue (#144, #145, #146, #42, #71, #127,
#139, and #129's own checklist). Nothing is in limbo and nothing is claimed fixed.

### [Close] What a re-run should do first

Seventeen criteria are UNTESTABLE only because this run had no guest. Every one is inside
`tools/vm-qa`'s four suites, which take about two minutes on a fresh pair. That is the cheapest
remaining verification in this milestone, and it is a run rather than a fix.

### [Close] The scope was pinned; `next` moved under it

SKILL.md's swarm rule: *"while this skill is active on a scope, do not mutate that scope from
elsewhere — an audit of a moving target proves nothing about either state."* The audit worktree
is pinned at `e1ddfd7ec2` and never moved. The **primary checkout** did: it was
`e1ddfd7ec2` at Phase 0 and `3b3322cbaf` at close, three commits later.

Re-derived rather than assumed — `git -C /workspace/repos/rocknix diff --stat
e1ddfd7ec2..3b3322cbaf`:

```
docs/blindspot-register.md                  | 29 +++++++
docs/vm-qa-log.md                           |  2 +-
docs/work-logs/…/2026_09_12-work_log.md     | 20 ++++++
tools/time-to-play                          | 45 +++++++++-
tools/vm-qa                                 |  2 +-
```

**No audited surface is touched** — not the rclone scripts, not `projects/ROCKNIX/packages/rocknix/`,
not EmulationStation. Every finding stands against the tip as well as against the pin.

Two of those commits are worth flagging to whoever reads this next, because they landed in
parallel with the same conclusion this audit reached about the runner: `da2c2a2bbc`
("a run with no headline number fails (#135)") and `66d932b0c0` (**blindspot 39** — "a new
suite that passed over a table of dashes"). That is the cannot-fail-is-not-evidence floor,
found independently from the other side, on the one tool this audit could only read.
