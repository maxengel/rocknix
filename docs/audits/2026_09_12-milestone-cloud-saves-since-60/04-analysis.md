# Audit Analysis — Cloud saves since audit #60

**Date:** 2026-09-12
**Spec:** GitHub issue bodies on `maxengel/rocknix`; driving issue **#129**
**Issues:** #11 #19 #20 #21 #22 #23 #24 #25 #39 #52 #71 #74 #100 #103 #104 #105 #107 #113
#116 #117 #118 #119 #120 #121 #122 #123 #124 #125 #126 #127 #128 #133 #134 #135 #138 #139
#140 #141 #142 #143
**Commits:** ROCKNIX `e98fdd84f7..e1ddfd7ec2` (715 commits); ES `00a258f9d7..f93acc2a6` (190)
**Tier:** Milestone (two or more epics — #11, the evidence epic #104, the testing epic #120)

---

## Executive Summary

Three weeks of work across two repositories, audited from a fresh session that did not
implement any of it. The cloud-saves subsystem is in materially better shape than at audit
#60: the saves allowlist is now unconditional rather than riding inside a user-editable
string; the transfer lock is held by the script's own shell and by nothing it starts; the
config merge puts a player's own rules where rclone will read them; the sentinels moved out of
rclone's exit-code space; three new device-less test harnesses ship **with working positive
controls**, which is the single strongest quality signal in the range and rarer than it should
be. Of 55 acceptance criteria evaluated, 27 pass on evidence, 6 are partial, 3 fail, 2 are
explicitly deferred and 17 are untestable — the last count being a fact about this run's
constraints (no guest, no QA endpoint, no handheld) rather than about the work.

**Fourteen findings, none critical, three high.** The three high ones are all *seam* defects,
which is what milestone tier exists to find. **F-01**: the AddressSanitizer regression test
that guards the wizard's page-replacement lifetimes — the exact crash that shipped on a device
on 2026-09-05 — has not compiled since 2026-09-11, nothing runs it, and its absence is
indistinguishable from its silence. **F-02**: the scripts and EmulationStation have two
independent parsers for the `>>> ` protocol with different vocabularies, and the one with no
unit tests silently drops `>>> offer create-saves-folder` — so the empty-cloud offer built by
#100 and #127 works on the GAME SETTINGS card and not on the RESTORE FROM THE CLOUD transfer
page, which is the surface a fresh handheld actually uses. **F-03**: `f988562665` put
`--low-level-retries` back to ten in the conf, the defaults and the migration helper, and left
it at two in all four scripts' `RCLONE_NET_OPTS_FALLBACK` constants, whose own comments now
assert they are "the shipped values".

The pattern under all three, and under F-04 and F-11 as well, is **a change applied to some of
its sites**. Five of the fourteen findings are one site of a class that has three or four. The
project already has the rule (`engineering-practices.md` § "Before deleting a duplicate, diff
its behaviours"; the skill's own § 3.6.5) — what it does not have is a mechanical way to
enumerate the sites, and the recommendation at the foot of this report is to build one for the
two classes that keep recurring: a string that names a menu control, and a constant duplicated
between a config file and the scripts that read it.

The second theme is **verification debt that is now measurable**. Seventeen criteria are
untestable on a host, and every one of them is testable by `tools/vm-qa`, which exists and
runs four suites in about two minutes. The cheapest remaining work in this milestone is not a
fix; it is a run.

---

## Acceptance-criteria scorecard

| ID | Criterion (abbreviated) | Verdict | Notes |
| --- | --- | --- | --- |
| AC-116-1 | `--info` prints no usable credential | PASS ✓ | `cloud_setup:193` |
| AC-116-2 | step-1 checkmark still works | UNTESTABLE ? | frame |
| AC-116-3 | nothing else reads `PASSWORD=` | PASS ✓ | 0 hits |
| AC-52-1 | `rclone.conf` held back | PASS ✓ | harness case f, run |
| AC-52-2 | restored device sent to cloud setup | PARTIAL ⚠ | path wording, F-06 |
| AC-52-3 | old archive still restorable | UNTESTABLE ? | needs a device + an old archive |
| AC-52-4 | scanner still reports what is not held back | PASS ✓ | harness case f, run |
| AC-71-1..3 | allowlist applied regardless of RCLONEOPTS | PASS ✓ | both scripts |
| AC-71-4 | user's `--filter-from` **or `--filter`** keeps control | PARTIAL ⚠ | **F-09** |
| AC-71-5 | harness case that must fail against old code | PARTIAL ⚠ | exists; not run here |
| AC-39 | user rule survives and takes effect | PASS ✓ | harness case d, run |
| AC-74-1..4 | CHANGE CLOUD FOLDER writes siblings | UNTESTABLE ? | harness asserts it; guest needed |
| AC-100-1 | empty cloud reads as empty | PASS ✓ | with **F-02** attached |
| AC-100-2 | a wrong root still fails | PARTIAL ⚠ | fails on buckets — #141 |
| AC-100-3 / 127-1 | decisions are register rows | PASS ✓ | D-CLOUD-085/091/092 |
| AC-100-4 | harness asserts both shapes | PASS ✓ | code-read |
| AC-127-2 | offer names a near sibling | PASS ✓ | `cloud_restore:975-982` |
| AC-127-3 | root-level folder gets the offer | PASS ✓ | `cloud_restore:971-973` |
| AC-104-1 | persistent journal, capped | PARTIAL ⚠ | numbers not those under test on the VM |
| AC-104-2 | ES + cloud logs on `/storage`, rotated | PASS ✓ | `cloud_sync_helper:305` |
| AC-104-3 | boot-evidence snapshot, ring of five | PASS ✓ | timer + service + `enable_service` |
| AC-104-4 | watchdog, panic-on-hang, crash store | PARTIAL ⚠ | built; scope widened; `hung_task_panic` risk |
| AC-104-5 | config files survive a mid-shutdown cut | PASS ✓ | harness a/c/d, run |
| AC-104-6 | a rule on what to capture first | PASS ✓ | `handheld-evidence.md` |
| AC-105-1,6,7,8 | outcome vocabulary, no developer words, the gate | PASS ✓ | harness e, run; gate default-on |
| AC-105-2,3,4,9 | card, transfer page, picker, frames | UNTESTABLE ? | frames |
| AC-105-5 | COMPLETED WITH GAPS | SKIP ○ | superseded in the body by D-UI-030 |
| AC-117-1..4 | exit-hotkey debounce | UNTESTABLE ? | guest/handheld |
| AC-118-1,3 | no player-facing "remote"; frames | PASS ✓ / UNTESTABLE ? | 3 residual, as claimed |
| AC-118-2 | every quoted menu label reads as it now is | **FAIL ✗** | **F-04, F-05** |
| AC-119-1 | `run false` exits non-zero | PASS ✓ | **executed, with a control** |
| AC-119-2 | ES callers react to a non-zero status | PASS ✓ | no `/usr/bin/run` callers left |
| AC-119-3 | frame at 640x480 | UNTESTABLE ? | frame |
| AC-120-1 | `vm-qa` runs everything unattended | PASS ✓ / UNTESTABLE ? | exists; run not made here |
| AC-120-2 | the exit cell exists and fails without the debounce | PASS ✓ / UNTESTABLE ? | exists |
| AC-120-3 | reference frames + a failing comparison | **FAIL ✗** | absent; the tool says so itself |
| AC-120-4 | ES unit tests, under a second | PASS ✓ | **29 cases / 280 assertions, run** |
| AC-120-5 | a nightly has produced one report | **FAIL ✗** | no scheduler anywhere |
| AC-121-1 | no `powerstate` line on the guest | PASS ✓ | guard added |
| AC-121-2 | handheld behaviour unchanged | UNTESTABLE ? | needs a battery |
| AC-122-1 | no `laptop_mode` warning | PASS ✓ | package **and** upgrade path |
| AC-123-1,2 | provider forms in player words | PASS ✓ / UNTESTABLE ? | unit-tested |
| AC-124-1,2 | the lock never outlives a run | PASS ✓ / UNTESTABLE ? | 5 sites checked |
| AC-125-1 | walks wait on frames, not the clock | PASS ✓ | **0 `sleep` in any walk** |
| AC-125-2,3 | under load; `vm-pair up` | UNTESTABLE ? | guest |
| AC-126-1 | nothing-to-send says SKIPPED, stamp untouched | PASS ✓ | `cloud_backup:1172` |
| AC-128-1,2 | S3 subtitle is a name | PASS ✓ / UNTESTABLE ? | unit-tested |
| AC-129-1 | an audit report with severities and file:line | PASS ✓ | this folder |
| AC-129-2 | an issue per high-or-above finding | PASS ✓ | Phase 6 |
| AC-129-3 | the register checked against the code | PASS ✓ | § Register check |
| #133 / #135 / #11 + children | — | SKIP ○ | § Not yet built |

**Pass rate:** 27 of 38 decidable criteria fully met (**71%**); 3 fail; 6 partial;
2 deferred; 17 not decidable on this host.

---

## Register check (#129 acceptance criterion 3)

Every row read from `docs/decision-register.md` at `e1ddfd7ec2` and checked against the code.
`HOLDS` means the code does what the row says. `NOT YET BUILT` is a verdict, not a failure.

### The rows #129 names

| Row | Verdict | Evidence |
| --- | --- | --- |
| D-CLOUD-085 | **HOLDS, with a bucket-tier hole** | `cloud_restore:938` + `:974-996`. Correct on the four path-based backends; on a bucket `rclone lsd` of an absent prefix exits 0, so the branch is never entered — **#141**, open. |
| D-CLOUD-086 | HOLDS | `cloud_sync-rules.txt{,.defaults}` carry `+ /**/*.{eep,mpk,sra,fla}` and the `/n64/save/` trio. |
| D-CLOUD-087 | HOLDS | `backuptool` holds `rclone.conf` back; proved by `last-good-scripts-test` f (run). |
| D-CLOUD-088 | HOLDS | `cloud_backup:981-988`, `cloud_restore:1032-1037`. The row's claim is unconditional and the code is — except for a bare `--filter`, which is **F-09** against #71's criterion, not against this row. |
| D-CLOUD-089 | HOLDS (code-read) | `cloud_migrate_layout` treats a sibling layout as current; the harness asserts `rc == 3 and "nothing to move"` at `cloud-round-trip:1105`. |
| D-CLOUD-090 | HOLDS | `cloud_backup:1172-1173`, `:1584`, `:1598`, and `record_last_run`'s early return at `:374-377`. |
| D-CLOUD-091 | HOLDS | `cloud_restore:975-982` + `ThreadedCloudSync.cpp:490-491`. |
| D-CLOUD-092 | HOLDS | `cloud_restore:971-973`. |
| D-CLOUD-093 | HOLDS | `take_cloud_lock` outside the `9>&-` group at all **five** sites (`cloud_backup:1642`, `cloud_restore:1489`, `cloud_content_backup:512`, `cloud_content_restore:579` and `:1016`). |
| D-SYS-001 | HOLDS | `var-log.mount`: both debugging conditions replaced by `ConditionPathExists=!/storage/.cache/volatile-log`; pulled in by `systemd-journal-flush.service`'s `RequiresMountsFor`. |
| D-SYS-002 | HOLDS | `systemd/config/system.conf.d/20-watchdog.conf`, installed at `package.mk:274-275`. |
| D-SYS-003 | HOLDS | `busybox/sysctl.d/hang-policy.conf`, installed by `scripts/install:126-128`'s convention (verified: `PKG_TMP_DIR` iterates the override directory). **Risk noted** in AC-104-4. |
| D-SYS-004 | HOLDS | `0950-arm64-dts-allwinner-h616-ramoops-reserved-memory.patch`; 512 KiB console + 4 × 128 KiB records = the reserved 1 MiB exactly. |
| D-SYS-005 | HOLDS | `rocknix-evidence.{service,timer}`, `enable_service` at `rocknix/package.mk:85`. |
| D-SYS-007 | HOLDS | `post-update:96-102`, anchored `^vm\.laptop_mode=`, one line not the file. |
| D-SYS-008 | HOLDS | `powerstate.sh` guards on `[[ "${BATLEFT}" =~ ^[0-9]+$ ]]` and does not exit the loop. |
| D-UI-033 | HOLDS | `backuptool:415-431` `--no-restart`; `GuiMenu.cpp:4590-4605` owns the restart. |
| D-UI-034 | HOLDS | `ComponentGrid::canMoveCursor` (`ComponentGrid.cpp:396`) used by `getHelpPrompts` (`:527-528`). |
| D-UI-035 | HOLDS | `CloudText::outcomeCandidates` (`CloudText.cpp:259`) consumed at `ThreadedCloudSync.cpp:449`. |
| D-UI-036 | **HOLDS with a caveat** | Three residual `_("…REMOTE…")` strings, as the row's exemption describes — but one of them (`GuiMenu.cpp:6060`, "CLOUD SYNC USES THE FIRST REMOTE IN ALPHABETICAL ORDER") is our own statement, not one of rclone's prompts. |
| D-UI-037 | HOLDS | `grep -rn '/usr/bin/run' es-app/src es-core/src` returns two **comment** lines in `GuiMenu.cpp` (`:261`, `:264`) and no call site; `factoryreset` and `backuptool` both take `--no-restart`. |
| D-UI-038 | HOLDS | `CloudText::fieldLabel` (`CloudText.cpp:56`) at all four row-building sites; unit-tested. |
| D-QA-012 | HOLDS (process) | Every out-of-band request in the range has an issue — #130, #131, #132, #135, #139 each quote the maintainer in their opening line. |
| D-QA-013 | **HOLDS in part** | `settle`/`wait-for-change`/`wake`/`dismiss-dialogs` exist and **no walk contains a `sleep`**. The row's closing clause — "Frames are compared as th…" — describes a comparison the tooling does not perform (`tools/vm-qa:27` says so). That is #120's third box, unticked; the row over-claims. |
| D-QA-014 | HOLDS | `GuiMenu.cpp:4437` persists `cloudsync.pick.<direction>.<class>`; `tools/vm-qa:144-146` reboots before the walks. |

### The rows added since (not named by #129, checked by the orchestrator's instruction)

| Row | Verdict | Note |
| --- | --- | --- |
| D-INFRA-008 (2026-09-05, flashing docs) | HOLDS — **but see F-11**, the ID is used twice |
| D-INFRA-008 (2026-09-11, credentials) | HOLDS | `cloud_setup:193`, `GuiMenu.cpp:5894` |
| D-QA-015 | HOLDS (process) | No device or cloud action was taken by this audit; the rule is why. |
| D-QA-017 | HOLDS | `tools/cloud-test-backend` serves five self-hosted backends; no Dropbox optimisation in the tree. |
| D-QA-018 | HOLDS | `cloud-test-backend:75-79` — 9010/9012/9013/9014/9015, WebDAV keeps 9010, `CLOUD_QA_PORT` still moves one. |
| D-QA-019 | HOLDS | `cloud-test-backend:558-612` — `endpoint-prefix`, `saves-remote`, `settings-remote`, `content-remote`. |
| D-QA-020 | HOLDS | `cloud-round-trip:20`, `:1680`, and the SKIP-with-reason branches at `:657`, `:757`; #141/#142/#143 were filed rather than tolerated. |
| D-UI-039 | HOLDS | `docs/es-menu-map.md` exists and was updated three times in the range. |
| D-UI-040 | HOLDS | `FileData.cpp:909` `SYNC SAVES` / `SYNCING SAVES TO THE CLOUD`; `main.cpp:586` `SYNCING SAVES AT STARTUP`; the transfer page keeps BACK UP / RESTORE. |
| D-UI-042 | HOLDS (principle) | `least-surprise.md` exists; **F-05 and F-13 are where the code does not meet it.** |
| D-UI-044 | HOLDS | The label map ships as `CloudText::fieldLabel`. |
| D-UI-045 | HOLDS (principle) | `player-language.md` exists; F-04 is where a string does not meet it. |
| D-CLOUD-098 | **PART BUILT** | `tools/time-to-play` exists (1331 lines); no budget is a register row yet and none of #135's 13 criteria is ticked. |
| D-CLOUD-095 · 096 · 097 · 099 · 100 · 102 · 103 · 104 · 105 · 106 · 107 · 108 · 110 · 114 · 115 · 117 | **NOT YET BUILT** | The save-history design (#134 and its children #136/#137, plus #21/#22/#23/#25). No `Saves/.history/`, no `cloud_reconcile`, no retention: `grep -rn 'cloud_reconcile\|\.history/' projects/` returns nothing in the shipped scripts. Nothing to check — the boundary, stated so the parent knows it. |
| D-CLOUD-109 | **NOT YET BUILT, and today's code contradicts it** | The row says a launch never cancels an automatic sync. `FileData.cpp:740-744` + `ThreadedCloudSync::cancelForLaunch` (`:545`, SIGTERM then SIGKILL at 1500 ms) still cancel it, per the earlier D-CLOUD-076. This is a *superseded-but-unbuilt* row, not a violation; #22/#135 close it. Listed because "the code contradicts a decided row" is exactly the thing that must not be discovered by accident later. |
| D-CLOUD-111 · 112 · 113 · 116 | **NOT YET BUILT** | No `--max-duration`, no idle-progress watch, no absolute ceiling: `grep -rn 'max-duration\|cutoff-mode' projects/` → nothing. The only bounds today are `--contimeout 15s --timeout 30s --low-level-retries 10 --retries 1`, which is what #143 shows the S3 SDK ignores. |
| D-UI-041 · D-UI-043 | **NOT YET BUILT** | #139 and #23. **F-13 is a case D-UI-041's issue does not currently cover.** |

**Summary:** 26 of 26 rows #129 names were checked. **24 hold**; **2 hold with a documented
hole or over-claim** (D-CLOUD-085 on the bucket tier — #141; D-QA-013's frame-comparison
clause). Of the 38 rows added since, 12 hold, 1 is part-built, and 25 are design decisions
whose code is not yet written. **No built behaviour contradicts a row**, with the single
qualified exception of D-CLOUD-109, which is a decided-but-unbuilt reversal of D-CLOUD-076.

---

## Code Quality Assessment

### Strengths

- **Positive controls ship with the tests.** `tools/last-good-scripts-test --old` → 34 FAIL;
  `tools/wait-lock-test /tmp/old` → 14 FAIL; `tools/cloud-capture-stamp-test /tmp/old` →
  9 FAIL. Each header names the exact base commit to point at. This is the
  "an assertion that cannot fail is not evidence" floor built into the tooling, and it is why
  a large part of this audit could be evidenced from the host at all.
- **The reasoning is beside the code.** `take_cloud_lock`'s 35-line comment, the `--recent`
  window's, `liveLine`'s account of rclone's pipe format, `hang-policy.conf`'s. A reader can
  audit the *intent*, which is the difference between finding F-03 in ten minutes and not
  finding it.
- **Guards that fail closed, deliberately.** `cloud_content_restore:571-575` refuses when
  `SAVE_EXCLUDES` is empty rather than proceeding with fewer arguments (blindspot 24's rule,
  applied); `archives=()` with a count rather than `ls A B`'s exit status (#60 PL-01's rule,
  still applied).
- **The config contract is exact.** A mechanical comparison of `cloud_sync.conf` against
  `cloud_sync.conf.defaults` — 14 keys each — found **zero** asymmetry in either direction,
  and the same for the two rules files. That is the `upgrade-and-install.md` gate passing on a
  check that could have failed.

### Concerns

- **Two parsers for one protocol** (F-02), one of them untested and outside the pure-code
  boundary `es-app/tests/unit/README.md` draws.
- **Duplicated constants across a config/script boundary** (F-03) with no check that they
  agree — the same shape as the config/defaults pair, which *does* have a natural check.
- **Player-facing strings that name controls**, with no mechanical link to the controls
  (F-04). Three instances, two introduced by the passes meant to fix exactly this.
- **A test with no runner** (F-01). The ES repo has no CI at all; `tools/vm-qa` is the fork's
  runner and does not know about the ES repo's own tests.

### Complexity hotspots

`cloud_backup` (1643 lines) and `cloud_restore` (1490) are near the limit of what a shell
script should carry, and `rclone-cloud-sync.md`'s "keep these two structurally in sync"
is enforced by nothing but care — F-03 is what that costs. `tools/cloud-round-trip` at 7414
lines is a single-file Python harness whose 438 `check()` calls are its real specification.

---

## Cornerstone Conformance

**Overall: HIGH.**

| Face | Verdict | Findings |
| --- | --- | --- |
| `rclone-cloud-sync.md` | ✓ | Allowlist unconditional; `--delete-excluded` stripped on restore; no `--filter-from` in the settings phase; `SETTINGS_REMOTE` nesting warned; capture writes nothing under `SAVESPATH` and never takes the lock; single-remote assumption intact. |
| `upgrade-and-install.md` | ⚠ | Config/defaults pair exact; `vm.laptop_mode` handled on **both** paths; the RA key rename reads both spellings. **F-14** (an opt-in deleted every update, upstream's) is the exception. |
| `engineering-practices.md` § guards fail closed | ✓ | See Strengths. |
| `engineering-practices.md` § the artifact not the report | ⚠ | Honoured in the harness (it reads the endpoint, not the run's summary). **F-01** is the counter-example: a test reported nothing because it could not run. |
| `least-surprise.md` | ⚠ | **F-05** (one page, two names), **F-13** (a sync that says nothing), **F-06** (one path written two ways). |
| `player-language.md` | ⚠ | **F-04** (three strings naming absent controls), **F-07** (`WIFI`). |
| `es-native-ui.md` | ✓ | Vocabulary, two-lines-per-row, the four progress tiers, `GuiCloudTransfer` as the long-job page — all followed. |
| `issue-tracking.md` | ⚠ | **F-10** (#127 open, all ticked); #39 closed with no checklist; #104 and #120 are epics with **no** GitHub sub-issues registered. |
| `decision-register.md` | ⚠ | **F-11** (a duplicate ID). |
| `fork-workflow.md` | ⚠ | **F-12** (the "same list" invariant is false). |
| `vm-first.md` / `time-to-play.md` | ✓ | #141/#142/#143 each open with "Can this be done on the VM? **Yes**"; #135 exists as the metric's home. |
| Blindspot register (38 entries) | see below | |

### Blindspot register, the entries this range engages

| # | Repeated? | Evidence |
| --- | --- | --- |
| 13 assumed-done | **partly** | F-10 (#127's ticks with the issue open); D-QA-013's row claiming a comparison the tool does not do. |
| 14 / 23 / 26 a guard with no observed positive | **yes — F-01** | The lifetime test has not run since 2026-09-11 and nothing would say so. The *other* three harnesses do the opposite and ship controls. |
| 22 a probe that cannot report absence | **yes, known** | `rclone lsd` cannot separate absent from empty on a bucket — #141. And see the rule change proposed below: the doctrine's own remedy is insufficient here. |
| 27 supersession that lives only in a comment | **yes — F-09** | #71's AC text says `--filter`; only the tick's note says otherwise. |
| 29 a feature that ships but has no route | **yes — F-02** | The offer has a route on one of its two surfaces. |
| 31 a harness agreeing with itself | no | `cloud-test-backend`'s `epath()`/`endpoint-prefix` split is exactly the fix; D-QA-019 codifies it. |
| 34 a check proven only under the host's tools | no | `last-good-scripts-test` runs `sed mv cp tr head wc cut awk` through the image's busybox. |
| 36 one backend, its semantics mistaken for the contract | **fixed, and it paid** | Five backends now; the first matrix run found #141/#142/#143 — three shipped defects WebDAV could not show. F-03 is the *residue* of #36's own fix. |
| 38 a category offer read as a standing yes | no | This audit took no device or cloud action. |

---

## Spec Fidelity

### Aligned

The three passes each did what their issues said: the credentials-and-rules pass closed six
real defects; the evidence epic turned on a mechanism the image already carried
(blindspot 37's rule, applied — `var-log.mount` was switched on, not rebuilt); the QoL pass
produced `/usr/bin/run`'s status, the debounce and the unit tests.

### Diverged

| Divergence | Impact |
| --- | --- |
| #104 says the watchdog and hang policy are "for H700 (then the other families)"; both ship fleet-wide from the first build | Low, and argued in the files' own comments — but `hung_task_panic=1` with the default 120 s on microSD-backed devices is a policy nobody has measured. |
| D-UI-036's exemption is "the three `rclone config` terminal steps"; a fourth string keeps the word | Cosmetic. |
| #71's AC says `--filter`; the code recognises only `--filter-from`/`--filters-file` | F-09; the criterion, not the code, is probably what should change. |
| D-QA-013 says frames "are compared"; `tools/vm-qa` keeps them | The row over-claims relative to #120's own unticked box. |

---

## Missing Artifacts

Reference frames and a comparison step (#120 box 3) · a nightly runner (#120 box 5) · a
caller for `tests/cloud-oauth-lifetime.py` · unit tests for `GuiCloudTransfer`'s protocol
parser · the rocknix.org docs for this range (#42, carried from audit #60) · GitHub
sub-issues under the #104 and #120 epics.

---

## Risk Assessment

| Risk | Severity | Impact | Mitigation |
| --- | --- | --- | --- |
| The wizard's page-replacement lifetimes are unguarded (F-01) | **High** | The 2026-09-05 crash class can return with nothing to catch it; the wizard is the first thing a new player touches | Fix the harness's doubles; give it a runner (`tools/vm-qa` or an ES-repo workflow) |
| The empty-cloud offer is missing on the transfer page (F-02) | **High** | A fresh handheld's first restore completes with nothing moved and no way forward offered — the #26 journey's own path | Give `GuiCloudTransfer` the `offer` branch, or route both surfaces through `classifyProtocolLine` |
| `--low-level-retries 2` survives on the fallback path (F-03) | **High** | #107 returns for any device whose conf is unreadable or predates #103; on Dropbox that is every exit sync of a save already in the cloud | Make the constant the single source, or assert the two agree |
| Strings naming absent controls (F-04) | Medium | A player following the instruction at the moment they most need it finds nothing | Fix the three strings; add a check |
| An exit sync ES declines to start says nothing (F-13) | Medium | The save is safe but the player is not told anything happened or did not | Start it and let the lock speak, or say the skip; add the case to #139 |
| `D-INFRA-008` is two decisions (F-11) | Medium | A cited ID resolves to the wrong decision; the register's whole contract | Renumber the later row; add a duplicate check to `tools/lint-audit-artifacts` |
| `hung_task_panic=1` fleet-wide, 120 s default | Medium | A long SD stall reboots the device mid-write — the corruption class the policy exists to prevent | Measure D-state duration under a large write; consider `hung_task_timeout_secs` |
| One page, two names (F-05) | Medium | Least surprise | Pick one; the menu map already records both |
| `--filter` unrecognised (F-09) | Low | A player's own filter is joined by ours | Edit #71's criterion, or recognise `--filter` |
| #127 open with every box ticked (F-10) | Low | The tracker misreports | Close it, or add the criterion that is actually open |
| The guard lists diverge (F-12) | Low | The invariant erodes | Add three entries to `fork-workflow.md` |
| `pkgcheck` always exits 0 (F-08) | Low | A recorded "exit 0" is not evidence | Say so where it is cited; or make it exit non-zero |
| `WIFI` (F-07) | Low | Cosmetic | One string |
| `system.suspend.dpms` deleted every update (F-14) | Low | An opt-in cannot persist; upstream's | Report upstream |

---

## Coverage Boundary

Reproduced from `02-forward-audit.md` § Coverage Boundary, which carries the full table of
what was read, what was executed, what was deliberately skipped, and the six dimensions not
exercised at all (runtime · rendered UI · any endpoint · performance · the end-to-end upgrade
path · four of the five backends).

**The single most important line in it:** *no guest, no QA cloud, no handheld.* Seventeen
criteria are UNTESTABLE for that reason alone, and all seventeen are within
`tools/vm-qa`'s reach.

---

## Finding Verification (Phase 4.5)

| Finding | Severity | Survived refutation? | What was checked |
| --- | --- | --- | --- |
| F-01 | High | **yes** | Re-ran the test against `229f50ad4^`'s `GuiMenu.cpp` and got `PASS ×4, exit 0`, then against `f93acc2a6` and got the compile error — so the harness is sound and the source moved. Searched both repos and the ES repo's (absent) workflows directory for any caller. Searched for a second, newer lifetime test that might have superseded it: none. |
| F-02 | High | **yes** | Re-read `GuiCloudTransfer::handleLine` end to end (`:835-1107`) for a late `offer` branch or a generic `>>> ` fallback — there is none; the function returns without setting anything. Re-read `threadRun` for a second consumer — it is a plain `popen`, no `setsid`, no protocol layer. Confirmed the page really does run `cloud_restore --saves-only` (`GuiMenu.cpp:4618`) and that the offer is otherwise consumed only in `ThreadedCloudSync` (`:206`, `:481`). Searched for a mitigation — e.g. the done page showing the script's plain sentence — and found none: unmatched plain lines are dropped too. |
| F-03 | High | **yes** | Confirmed `f988562665` touched three files and none of the four constants (`git show --stat`, `git show … | grep FALLBACK` → empty). Confirmed the fallback is *reachable*: `[ -n "${net_opts}" ] || net_opts="${RCLONE_NET_OPTS_FALLBACK}"` at four sites, and `last-good-scripts-test` exercises the torn-conf → `.bak` path that reaches it. Searched for a later commit fixing the constants: `git log -S'low-level-retries 2'` shows none. Considered whether the fallback is dead code — it is not; `load_config` has no other branch. |
| F-04 | Medium | **yes** | Each of the three labels was searched for as an exact `_("<LABEL>")` **and** as a substring, across `es-app` and `es-core`; the near-misses (`UPDATE GAMELISTS`, `BACK UP TO THE CLOUD`) were located so the report can name the real control. Checked `addGroup`'s implementation to be sure `CLOUD SETTINGS` is a heading and not a page. |
| F-05 | Medium | **yes** | Both rows resolve to `GuiMenu::openRestoreRelink` and the same marker; enumerated every call site (2). Checked `docs/es-menu-map.md`, which records **both** names — so this is a documented inconsistency rather than an unnoticed one, and no register row decides it. Severity held at Medium for that reason rather than raised. |
| F-11 | Medium | **yes** | Parsed all 199 decided rows and all 6 open rows; exactly one duplicate ID, no ID in both tables. Traced the origin to audit #72's own punch list. Confirmed a live citation points at the newer meaning (`docs/cloud-sync-changelog.md:1830`). |
| F-13 | Medium | **yes** | Re-read `FileData::launchGame` around `:817` and `:904` to confirm capture is unconditional and the sync is not; confirmed no stamp is written when the sync never starts (`ThreadedCloudSync::recordOutcome` is called only at the end of a run, `:626-662`); read #139's four criteria and confirmed none names this case. |
| **A finding that died here** | — | **no — withdrawn** | The RA settings-key rename (`challengeindicators` → `challenge_indicators`) looked like `upgrade-and-install.md`'s "renaming a key silently resets everyone's preference": `GuiSettings::addSwitch` reads only the new key. `git log -S` over the ES repo shows ES **never** wrote the old spelling, so the old key can only hold the image's seeded `0`. No preference is behind it. Recorded in `03-retrospective.md` § 3.5 so the next reader does not re-derive it. |

---

## Instruction File Recommendations

### Coverage gaps (would-have-prevented)

| Finding | Would have been caught by | Uncovered? |
| --- | --- | --- |
| F-01 | `.claude/rules/es-native-ui.md` § "Wizard page replacement" — it *mandates* the test but names no runner | partly |
| F-02 | (none) | **YES** |
| F-03 | `.claude/rules/engineering-practices.md` § "Before deleting a duplicate, diff its behaviours" — the sibling-site habit, applied to a change rather than a deletion | partly |
| F-04 | `.claude/rules/upgrade-and-install.md` § "A menu entry that moved" — *"does any string still name the old path?"* | — |
| F-05 | `.claude/rules/least-surprise.md` § "Same thing, same place, same words" | — |
| F-06 | `.claude/rules/least-surprise.md` § same | — |
| F-07 | `.claude/rules/es-native-ui.md` § Conventions ("Wi-Fi, hyphenated") | — |
| F-09 | `.claude/rules/issue-tracking.md` § "Ticking an acceptance criterion" | — |
| F-10 | `.claude/rules/issue-tracking.md` § "Closing discipline" | — |
| F-11 | `.claude/rules/decision-register.md` § "One row per decision … stable ID" | — |
| F-12 | `.claude/rules/fork-workflow.md` § "Personal paths" (it states the invariant and nothing enforces it) | partly |
| F-13 | `.claude/rules/least-surprise.md` § "No silent outcomes" | — |

### Codification gaps (needs-new-rule; 3+ instances)

| Pattern | Instances | Recommendation |
| --- | --- | --- |
| **P-01: a change applied to some of its sites.** A value, a sentence or a behaviour lives at N places; a fix reaches some. Every instance here was found by grepping for the *shape*, and none by reading the diff. | F-02 (2 parsers, 1 changed), F-03 (7 sites, 3 changed), F-04 (4 copies of 3 sentences), F-11 (an ID assigned twice), F-12 (2 lists, 1 updated) | **Extend** `.claude/rules/engineering-practices.md` with a "**Change the set, not the site**" subsection: before a change lands, write down the enumeration command that finds every site of the shape (not the symbol), paste its output into the commit or the issue, and state which sites are changed and why the rest are not. The existing § "Before deleting a duplicate" already does this for deletions; this is the same discipline for edits. |
| **P-02: a player-facing string that names a control, with nothing linking the two.** | F-04 (×3, two introduced by the vocabulary passes themselves), F-05, F-06 | **Extend** `.claude/rules/es-native-ui.md` with "**A string that names a row is a reference, not prose**": when a message names a menu label, the label is quoted exactly as its `_( )` reads, and the change that renames a row greps the tree for the old label *in other strings* before it lands. A mechanical form is cheap — extract every `_("…")` that contains an all-caps run of 4+ characters and assert each such run exists as its own `_( )` — and would have caught all three. |
| **P-03: a guard whose runner does not exist.** | F-01 (no caller), #120 box 3 (frames kept, never compared), #120 box 5 (a nightly the tool was written for) | **Extend** `.claude/rules/vm-first.md` or `engineering-practices.md` § "Guards must fail closed" with: *a check that nothing invokes is not a guard*. Every test added names the runner that will run it in the same change; `tools/vm-qa` is the fork's runner and gains the line. |

### Recommended action sequence

1. Fix F-01's doubles and add `tests/cloud-oauth-lifetime.py` to `tools/vm-qa`'s `scripts` suite (it needs no guest).
2. Fix F-02 in `GuiCloudTransfer`, and add `>>> unit` / `>>> removed` to `classifyProtocolLine` so one parser serves both.
3. Fix F-03's four constants; add a harness assertion that the constant equals the shipped default.
4. Fix F-04's four strings; add the P-02 mechanical check.
5. Renumber the later `D-INFRA-008`; add a duplicate-ID check to `tools/lint-audit-artifacts`.
6. Apply P-01/P-02/P-03 as instruction-file edits (Phase Z.6 — **not** by this audit).

### Proposed register rows (proposals, not decided rows — the maintainer decides)

- **A bucket remote cannot distinguish an absent prefix from an empty one, and a *listing* is not the fix.** `rclone-cloud-sync.md` currently prescribes "use a listing" as the remedy for blindspot 22; `cloud_restore:938` uses `rclone lsd` and #141 is the result. The rule needs the bucket-tier sentence: on S3/B2, existence is only knowable by finding **an object** under the prefix (or a `--s3-directory-markers` marker we wrote), never by the listing's exit status.
- **The exit sync's skip conditions are exhaustive and each one speaks.** Today there are three (toggle off, script missing, another sync running) and only the first is intended to be silent. (F-13; belongs beside D-UI-041.)
- **A fork-only tool is added to `.githooks/pre-push` and `fork-workflow.md` in the same commit**, or the rule stops claiming they are one list. (F-12.)

---

## Not yet built (the boundary, stated so the parent knows it)

`grep -rn 'cloud_reconcile\|Saves/\.history\|--max-duration\|history_keep' projects/ tools/`
(run this session) returns **nothing under `projects/`** — no shipped script mentions any of
them — and exactly three lines under `tools/`, all in `cloud-round-trip`: the forward-declared
constant `APPLY = "cloud_reconcile --apply --unit {unit} --keep {side}"` (`:1657`) and two
cleanup lines (`:2327`, `:2329`). That is D-CLOUD-051 working as written: the fixtures are
named before the command exists. The following are **design decisions whose code does not
exist**, and the correct verdict for each is *not yet built — nothing to check*, never FAIL:

- **#134** save history (`Saves/.history/`) and its children **#136** (the guard image) and
  **#137** (folding the set-aside folders): D-CLOUD-095, 096, 097, 099, 100, 105, 106, 107,
  108, 110, 114, 115, 117; D-UI-043.
- **#21** capture schema rev 2 and the core-pins file (7 of 11 criteria ticked; `cloud_capture`
  exists, the rev-2 work does not).
- **#22** the reconciler: D-CLOUD-102, 103, 109, 111, 112, 113. **26 criteria, 0 ticked.**
- **#23** the wizard: D-CLOUD-104, D-UI-041. **14 criteria, 0 ticked.**
- **#24** the checked adapter, **#25** the discarded-saves restore tool, **#19** the bench run.
- **#135** time to play: D-CLOUD-098, 116. `tools/time-to-play` exists; **13 criteria,
  0 ticked**; no budget is a register row.
- **#139** offline sync: D-UI-041. 4 criteria, 0 ticked.
- **#133**'s hosted half (Google Drive, Box, pCloud, Mega — accounts nobody has created);
  its self-hosted half is built and produced #141/#142/#143.

---

## Quality Self-Check

| Item | Status |
| --- | --- |
| Acceptance-criteria scorecard present, IDs match 02 | present |
| Instruction-file / blindspot conformance tables present | present |
| Coverage Boundary present (02 + 04) | present (04 references 02's full table rather than duplicating it) |
| Finding Verification recorded for all Critical/High | present — and for every Medium, plus one withdrawn finding |
| Instruction File Recommendations (epic/milestone) | present |
| Tier B visual-QA consolidation | **absent — with reason.** The repo's visual-QA process is `tools/vm-visual-qa`, which needs a guest this run was barred from. Every frame cited anywhere in these artifacts is one produced by an earlier session and read, never re-run. |
| Verdicts use the defined vocabulary only | yes |
| Traceability / Evidence / Reproducible / Actionable / Complete | self-checked: every finding carries a `file:line` read this session; every executed check records its command and its positive control; every negative claim records its search. |
| Stale-skill-copy check (Phase 0) | performed and logged — identical to `next` in both worktrees |
| `tools/lint-audit-artifacts` run before Phase 6 | see `00-running-log.md` |

**Punch-list issue:** #129 itself (per the orchestrator's instruction — the punch list lives
on #129 rather than in a second issue).
