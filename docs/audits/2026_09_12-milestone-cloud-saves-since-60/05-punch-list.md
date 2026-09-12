# Punch List — Cloud saves since audit #60 (fork issue #129)

**Generated:** 2026-09-12
**Source audit:** `docs/audits/2026_09_12-milestone-cloud-saves-since-60/04-analysis.md`
**Total items:** 12 (Critical: 0, High: 3, Medium: 5, Low: 4)
**Tracker:** the punch list lives on **#129** (body + comment); each High item also has an
issue of its own, attached to #129 as a sub-issue.

---

## Instructions for Executing Agent

Each item is discrete. Work through them in order. For each: read the evidence, reproduce it
(every High item carries a command), fix, verify against the stated Acceptance, and record the
outcome on #129's checklist.

**Nothing in this list was fixed by the audit** — an audit records; the parent session and the
maintainer decide what is fixed.

---

# High priority

## PL-01 — the ES OAuth lifetime test has not compiled since 2026-09-11, and nothing runs it

- **Severity:** High
- **Category:** Test Gap
- **Source finding:** F-01
- **Owner area:** EmulationStation — `tests/`, and the fork's runner
- **What:** Update `tests/cloud-oauth-lifetime.py`'s doubles so it compiles against the current
  `GuiMenu.cpp` — `struct CloudBackend` needs `tier`, `name`, `label`, `subprovider`, and the
  harness needs a `CloudText::providerSubtitle` stub — **and give it a runner**, because it has
  never had one. It needs no guest, so `tools/vm-qa`'s `scripts` suite is the natural home.
- **Where:** `~/Development/emulationstation-next/tests/cloud-oauth-lifetime.py:74` (the
  double) against `es-app/src/guis/GuiMenu.cpp:6226-6232` (the real struct) and the
  `CloudText::providerSubtitle(backend.name, backend.label)` call introduced by `229f50ad4`.
  Runner: `tools/vm-qa` (the `scripts` suite, `tools/vm-qa:~90`).
- **Why:** `.claude/rules/es-native-ui.md:388` names this test as the check on the wizard's
  page-replacement transitions — the crash that shipped to a device on 2026-09-05. Blindspot
  14/23/26: a guard with no observed positive is a guard with no evidence, and this one has
  been absent through #128, #138, #140 and the whole seven-issue pass.
- **Evidence (reproduction):**
  ```
  cd <es worktree at f93acc2a6>
  python3 tests/cloud-oauth-lifetime.py
  #   expected: PASS phone / PASS keyboard / PASS no-browser / PASS failed-start, exit 0
  #   actual:   lifetime.cpp:83: error: 'CloudText' has not been declared
  #             lifetime.cpp:83: 'const struct CloudBackend' has no member named 'name'
  #             exit 1
  git show 229f50ad4^:es-app/src/guis/GuiMenu.cpp > /tmp/GuiMenu-pre.cpp
  python3 tests/cloud-oauth-lifetime.py /tmp/GuiMenu-pre.cpp    # -> PASS ×4, exit 0
  ```
- **Acceptance:** `python3 tests/cloud-oauth-lifetime.py` prints four PASS lines and exits 0
  against `GuiMenu.cpp` at HEAD; a `tools/vm-qa` run lists it among the suites and fails the
  run when it fails.

## PL-02 — `>>> offer create-saves-folder` is dropped by the transfer page

- **Severity:** High
- **Category:** Interaction Defect
- **Source finding:** F-02
- **Owner area:** EmulationStation — `GuiCloudTransfer` / `CloudText`
- **What:** `GuiCloudTransfer::handleLine` has no `>>> offer` branch, so the empty-cloud /
  near-name offer built by #100 and #127 never appears on the RESTORE FROM THE CLOUD page. Add
  the branch — or, better, make `CloudText::classifyProtocolLine` the single parser by adding
  `Unit` and `Removed` kinds to it and having both readers call it, which also brings the two
  shapes under `es-app/tests/unit/`.
- **Where:** `es-app/src/guis/GuiCloudTransfer.cpp:835-958` (the second parser, no `offer`);
  `es-app/src/CloudText.cpp:278-322` (the first, no `unit`/`removed`);
  `es-app/src/ThreadedCloudSync.cpp:206-214` and `:481-491` (the only consumer today);
  the emitters at `projects/ROCKNIX/packages/network/rclone/sources/cloud_restore:980` and
  `:989`; the affected call site at `es-app/src/guis/GuiMenu.cpp:4618`.
- **Why:** The fresh-handheld journey (#26) restores through the transfer page, which is
  exactly the device whose cloud has no `Saves` folder yet. It completes having moved nothing
  and offers nothing — blindspot 29's shape on one of two routes, and `least-surprise.md`'s
  "no silent outcomes".
- **Evidence (reproduction, needs a guest):**
  ```
  ./tools/cloud-test-backend up
  # point a guest at an endpoint whose parent lists but whose Saves folder is absent
  ssh <guest> 'cloud_restore --yes --saves-only'   # -> exit 0, ">>> offer create-saves-folder|..."
  # then, in ES: MANAGE CLOUD STORAGE > RESTORE FROM THE CLOUD, tick SAVES, RESTORE
  #   expected: the page ends with the create-folder offer
  #   actual:   the page ends COMPLETED, nothing transferred, no offer
  # control: GAME SETTINGS > RESTORE SAVES FROM THE CLOUD does show it
  ```
- **Acceptance:** both surfaces present the offer for the same script run; a unit case in
  `es-app/tests/unit/CloudTextTests.cpp` covers `>>> unit` and `>>> removed` if the parsers are
  merged; `tools/vm-visual-qa` frames the offer reached from the transfer page at 640x480.

## PL-03 — `RCLONE_NET_OPTS_FALLBACK` still carries the two-retry bound #107 removed

- **Severity:** High
- **Category:** Spec Drift / Interaction Defect
- **Source finding:** F-03
- **Owner area:** cloud scripts
- **What:** `f988562665` changed `cloud_sync.conf`, `cloud_sync.conf.defaults` and
  `cloud_sync_helper` to `--low-level-retries 10` and left all four in-script fallbacks at 2.
  Set them to 10 — and add the assertion that keeps them in step, because the comments beside
  them already claim it and a comment is not a check.
- **Where:**
  `projects/ROCKNIX/packages/network/rclone/sources/cloud_backup:42`,
  `cloud_restore:42`, `cloud_content_backup:121`, `cloud_content_restore:125`; against
  `cloud_sync.conf.defaults:92`. The reachable branches:
  `cloud_backup:711-713`, `cloud_restore:742-744`, `cloud_content_backup:123`,
  `cloud_content_restore:127`. The false comments: `cloud_restore:33-41`
  ("This is the same value … Keep the two values in step") and `cloud_backup:707-710`
  ("means the shipped values").
- **Why:** #107 measured 6 of 12 replacements failing on Dropbox at two low-level retries. The
  fallback is taken whenever `RCLONE_NET_OPTS` is empty or unset — a conf the helper has not
  reached, a blanked line, or a torn conf that fell back to a pre-#103 `.bak`, which
  `tools/last-good-scripts-test` explicitly exercises. Blindspot 36, alive on a side path.
- **Evidence (reproduction, host-only):**
  ```
  grep -n 'RCLONE_NET_OPTS_FALLBACK=' projects/ROCKNIX/packages/network/rclone/sources/*
  #   expected: --low-level-retries 10, matching cloud_sync.conf.defaults:92
  #   actual:   --low-level-retries 2 at all four
  git show f988562665 --stat          # three files, none of them a script carrying the constant
  ```
- **Acceptance:** all four constants read `--low-level-retries 10`; a check (in
  `tools/last-good-scripts-test`, which already loads these scripts) asserts each script's
  `RCLONE_NET_OPTS_FALLBACK` equals `cloud_sync.conf.defaults`' `DEFAULT_RCLONE_NET_OPTS`, and
  fails when they differ.

---

# Medium priority

## PL-04 — three player-facing strings name a control that does not exist

- **Severity:** Medium
- **Category:** Spec Drift
- **Source finding:** F-04
- **Owner area:** EmulationStation strings + `backuptool`
- **What:** Correct three sentences (four copies) so each names a control that exists.
- **Where:**
  `es-app/src/guis/GuiMenu.cpp:356` — "TURN ON SETTINGS BACKUP UNDER CLOUD SETTINGS" (no such
  control; the four CLOUD SETTINGS rows are at `GuiMenu.cpp:5414-5445`);
  `es-app/src/guis/GuiMenu.cpp:362` **and**
  `projects/ROCKNIX/packages/rocknix/sources/scripts/backuptool:673` — "BACK UP SETTINGS TO THE
  CLOUD FROM GAME SETTINGS" (the row is BACK UP TO THE CLOUD, `GuiMenu.cpp:4907`);
  `es-app/src/guis/GuiCloudTransfer.cpp:652` — "UPDATE GAME LISTS" (the row is
  `_("UPDATE GAMELISTS")`, `GuiMenu.cpp:5061`).
- **Why:** `upgrade-and-install.md` § "A menu entry that moved" — a message that sends somebody
  to a menu that holds nothing is a dead end at the moment they most need it. Two of the three
  were introduced by this range's own vocabulary passes (`d161afb2b` #73, `4bab23fcb` #108).
- **Acceptance:** every all-caps run of four or more characters inside a `_("…")` string that
  reads as a menu label exists as its own `_("<LABEL>")` in the tree; the check is mechanical
  and runs (see P-02 in `04-analysis.md`).

## PL-05 — one page, two row labels, two descriptions

- **Severity:** Medium
- **Category:** Cornerstone Violation (`least-surprise.md`, D-UI-022/045)
- **Source finding:** F-05
- **Owner area:** EmulationStation — the cloud hub and NETWORK SETTINGS
- **What:** `GuiMenu::openRestoreRelink` is reached from **FINALIZE RESTORE**
  (cloud hub) and **FINISH RESTORE SETUP** (NETWORK SETTINGS); the page itself is titled
  FINISH RESTORE SETUP, and `GuiMenu.cpp:7359` tells the player to find it under the second
  route only. Pick one name and one description. "(WI-FI, ACCOUNTS, ETC.)" should also lose
  the "ETC." — the sibling string already enumerates.
- **Where:** `es-app/src/guis/GuiMenu.cpp:5043-5045`, `:9025-9027`, `:7188`, `:7359`;
  `docs/es-menu-map.md:68` and `:121` record **both**, so the map changes with it.
- **Why:** `least-surprise.md` § "Same thing, same place, same words". Pressing a row called
  FINALIZE RESTORE and landing on a page called something else is the definition of a surprise.
- **Acceptance:** one label, used by both rows and as the page title; `docs/es-menu-map.md`
  agrees; `GuiMenu.cpp:7359` names a route that exists from wherever the player is.

## PL-06 — an exit sync EmulationStation declines to start reports nothing

- **Severity:** Medium
- **Category:** Interaction Defect
- **Source finding:** F-13
- **Owner area:** EmulationStation — `FileData::launchGame`; and #139's scope
- **What:** `!ThreadedCloudSync::isRunning()` gates the game-exit sync. When another sync is
  running the exit sync never starts, and because it never starts there is no card, no
  `>>> why`, no stamp and no log line. Either start it and let the script's lock answer with
  exit 75 (`SKIPPED - ANOTHER CLOUD SYNC IS RUNNING`), or say the skip on the card.
- **Where:** `es-app/src/guis/../FileData.cpp:904-910`; the lock's own refusal at
  `projects/ROCKNIX/packages/network/rclone/sources/cloud_backup:156-167`;
  `ThreadedCloudSync::recordOutcome` (`ThreadedCloudSync.cpp:626-662`), which is never reached.
- **Why:** `least-surprise.md` § "No silent outcomes". D-UI-041 (#139) covers no-route, a dead
  uplink and a cloud that does not answer — **not** this case; so #139's criteria need the
  fourth cause as well.
- **Acceptance:** exiting a game while a startup sync runs leaves *something* durable — a card
  that says so, or a `last-sync-exit` stamp carrying the skip — and #139's body names the
  cause.

## PL-07 — the rocknix.org docs for this range (carried from audit #60, PL-06)

- **Severity:** Medium
- **Category:** Documentation Gap
- **Source finding:** carried forward; `documentation-accuracy.md`'s hard gate
- **Owner area:** `ROCKNIX/rocknix.org`
- **What:** #42 has been open since audit #60 and this range added at least six more
  user-visible changes: CHECK CONNECTION, FINALIZE RESTORE, MATCH THIS DEVICE TO THE CLOUD, the
  native provider forms, the new outcome vocabulary (COMPLETED / COULDN'T FINISH / SKIPPED),
  and the `RCLONE_NET_OPTS` config key.
- **Where:** `ROCKNIX/rocknix.org` `docs/configure/cloud-sync.md`; the source of truth is
  `projects/ROCKNIX/packages/network/rclone/sources/cloud_sync.conf{,.defaults}` and the
  `cloud_*` scripts.
- **Why:** `documentation-accuracy.md`: *"never push code/functionality changes without the
  corresponding rocknix.org site update"*, and the page still teaches the SSH `rclone config`
  workflow the wizard replaced.
- **Acceptance:** #42 carries the full list including this range's six, or a PR to
  `ROCKNIX/rocknix.org` lands them.

## PL-08 — `D-INFRA-008` names two different decisions

- **Severity:** Medium
- **Category:** Cornerstone Violation
- **Source finding:** F-11
- **Owner area:** `docs/decision-register.md`
- **What:** Two decided rows share the ID. Give the later one (2026-09-11, the credential
  boundary) a fresh number, cite the old ID in the new row per the append-only contract, and
  update `docs/cloud-sync-changelog.md:1830` and #116's evidence note.
- **Where:** `docs/decision-register.md:94` and `:171`; the origin is
  `docs/audits/2026_09_06-issue-device-flashing-runbook/05-punch-list.md:50`.
- **Why:** `.claude/rules/decision-register.md` — "One row per decision … stable ID"; citing by
  ID is the register's whole purpose and a duplicate makes a citation ambiguous.
- **Acceptance:** a parse of `docs/decision-register.md` reports zero duplicate IDs, and
  `tools/lint-audit-artifacts` gains that check so it cannot recur.

---

# Low priority / improvements

## PL-09 — `--filter` is not recognised where #71's criterion says it is

- **Severity:** Low
- **Category:** Acceptance Criteria Gap
- **Source finding:** F-09
- **Owner area:** cloud scripts / issue #71
- **What:** `cloud_backup:983` and `cloud_restore:1034` recognise `--filter-from`,
  `--filter-from=*`, `--filters-file`, `--filters-file=*` and **not** `--filter`. #71's AC 4
  says "their own `--filter-from` or `--filter`". Decide which is right and make the two agree
  — most likely by editing the criterion, since the allowlist is deliberately not optional.
- **Where:** `cloud_backup:981-988`, `cloud_restore:1032-1037`; #71's acceptance list.
- **Why:** `issue-tracking.md` — a comment that supersedes a criterion edits the body in the
  same action (blindspot 27).
- **Acceptance:** #71's AC 4 and the `case` statement describe the same set.

## PL-10 — #127 is open with every acceptance criterion ticked

- **Severity:** Low
- **Category:** Acceptance Criteria Gap
- **Source finding:** F-10
- **What:** Close #127 `completed` naming `70ca1c6fb9` / ES `cf89a61ec`, **or** add the
  criterion that is genuinely open — D-CLOUD-092's row says "the maintainer's confirmation is
  the open half", which is not a checkbox today.
- **Where:** issue #127.
- **Why:** `issue-tracking.md` § "Closing discipline".
- **Acceptance:** #127 is closed, or carries an unticked box naming what remains.

## PL-11 — the two personal-path lists are not the same list

- **Severity:** Low
- **Category:** Documentation Gap
- **Source finding:** F-12
- **What:** Add `tools/emulator-exit-test`, `tools/vm-qa` and `tools/time-to-play` to
  `.claude/rules/fork-workflow.md`'s fork-only-tools list, which its own text says is the same
  list as `PERSONAL_PATTERNS`.
- **Where:** `.claude/rules/fork-workflow.md:23-27` vs `.githooks/pre-push:37-56`.
- **Why:** `fork-workflow.md:28` asserts the invariant; the hook is complete and the prose is
  not.
- **Acceptance:** the two lists match entry for entry.

## PL-12 — two cosmetic string issues

- **Severity:** Low
- **Category:** Code Quality
- **Source findings:** F-07, F-06
- **What:** (a) `es-app/src/guis/GuiMenu.cpp:8733` `_("ENABLE WIFI GPIO")` → `WI-FI`, against
  24 hyphenated siblings. (b) The cloud scripts say "GAME SETTINGS > MANAGE CLOUD STORAGE"
  (two levels, correct) while ES says "GAME SETTINGS > CLOUD SETTINGS > MANAGE CLOUD STORAGE"
  (three, the middle one an `addGroup` heading that cannot be entered —
  `es-core/src/components/MenuComponent.h:39`). Pick one form.
- **Where:** `GuiMenu.cpp:8733`, `:6526`, `:6936`, `:7347`, `:7349`;
  `cloud_backup:462`, `cloud_restore:509`, `cloud_content_backup:96`,
  `cloud_content_restore:97`.
- **Why:** `es-native-ui.md` § Conventions; `least-surprise.md` § "same words".
- **Acceptance:** `grep -rhoE '_\("[^"]*WIFI[^"]*"' es-app es-core` returns nothing; the menu
  path is written one way in both repos.

---

## Observations recorded, no punch item

- **F-08** — `tools/pkgcheck` has no `exit` statement and always returns 0; it prints
  `[FAIL] … late binding violation` (proved this session with a constructed violation) but
  cannot fail a caller. Wherever its "exit status" is cited as evidence, the absence of
  `[FAIL]`/`[WARN]` lines is the evidence instead. Not filed: nothing automates it.
- **F-14** — `post-update:200` deletes `system.suspend.dpms` from the owner's `system.cfg`
  unconditionally on every update, while the comment above it calls the setting opt-in.
  **Upstream's** (`104a4d14ff`, 2026-08-20); worth an upstream report, not a fork fix.
- **`hung_task_panic = 1` fleet-wide** with `kernel.hung_task_timeout_secs` unset (120 s
  default) on microSD-backed handhelds. No measurement exists of D-state duration under a large
  write; if one exceeds 120 s the policy reboots the device mid-write, which is the corruption
  class it exists to prevent. `projects/ROCKNIX/packages/sysutils/busybox/sysctl.d/hang-policy.conf`.
- **The GENERIC_X64 journald drop-ins** (`092`, `093`, `098`) conflict with each other and with
  the image default; `20-x64-fd-improvements.conf` wins, so the guest runs
  `SyncIntervalSec=10min` where the image ships `1min`. #104's journal evidence was taken under
  the former. Pre-existing, out of #129's scope, recorded for the next journal measurement.
- **`assert_message`'s FORBIDDEN check passes on empty output**
  (`tools/cloud-round-trip:5543-5551`) — the shape the same file already fixed for the
  allowlist check with an explicit SKIP.

## Pre-existing tracked scope (NOT punch items — exempt from the resolution gate)

- **#141** — on a bucket remote a wrong saves folder reports COMPLETED. **Re-confirmed in the
  code this session:** `cloud_restore:938`'s `rclone lsd` exits 0 for an absent prefix on S3,
  so the whole #100/#127 branch is skipped.
- **#142** — FTP: a missing directory is exit 1, not 3; `--retries 1` loses files on a first
  write into a new directory.
- **#143** — a refused S3 endpoint is not bounded by `--contimeout`/`--timeout`/`--retries`.
- **#42** — rocknix.org docs (also **PL-07** above, because this range added to it).
- **#35** — the round-trip harness's own coverage gaps (carried from audit #60 PL-10).
- **#107**, **#113** — the retry bound's two ends; #107's third criterion (a device upgrading
  gets the new value) is satisfied by `cloud_sync_helper:389-397`, and the issue can be
  re-checked once **PL-03** lands.
- **#134 / #136 / #137 / #21 / #22 / #23 / #24 / #25 / #19 / #135 / #139** — the not-yet-built
  boundary, enumerated in `04-analysis.md` § "Not yet built".
- **#120** boxes 3 and 5 (reference frames; a nightly) — correctly unticked, tracked there.

---

## Machine-readable index

```yaml
punch_index:
  - id: PL-01
    severity: High
    category: Test Gap
    source_finding: F-01
    owner_area: emulationstation-next tests
    where: tests/cloud-oauth-lifetime.py:74
    acceptance: "python3 tests/cloud-oauth-lifetime.py prints four PASS lines and exits 0 at ES HEAD, and tools/vm-qa runs it"
    outcome: deferred:#144
  - id: PL-02
    severity: High
    category: Interaction Defect
    source_finding: F-02
    owner_area: emulationstation-next GuiCloudTransfer
    where: es-app/src/guis/GuiCloudTransfer.cpp:835
    acceptance: "the create-saves-folder offer appears from the transfer page as well as the card, for one script run"
    outcome: deferred:#145
  - id: PL-03
    severity: High
    category: Spec Drift
    source_finding: F-03
    owner_area: rclone cloud scripts
    where: projects/ROCKNIX/packages/network/rclone/sources/cloud_backup:42
    acceptance: "all four RCLONE_NET_OPTS_FALLBACK constants read --low-level-retries 10, and a check asserts they equal DEFAULT_RCLONE_NET_OPTS"
    outcome: deferred:#146
  - id: PL-04
    severity: Medium
    category: Spec Drift
    source_finding: F-04
    owner_area: emulationstation-next strings + backuptool
    where: es-app/src/guis/GuiMenu.cpp:356
    acceptance: "every menu label quoted inside a _() string exists as its own _(\"LABEL\") in the tree, checked mechanically"
    outcome: deferred:#129
  - id: PL-05
    severity: Medium
    category: Cornerstone Violation
    source_finding: F-05
    owner_area: emulationstation-next menus
    where: es-app/src/guis/GuiMenu.cpp:5043
    acceptance: "one label for openRestoreRelink across both rows and the page title, and docs/es-menu-map.md agrees"
    outcome: deferred:#129
  - id: PL-06
    severity: Medium
    category: Interaction Defect
    source_finding: F-13
    owner_area: emulationstation-next FileData
    where: es-app/src/FileData.cpp:904
    acceptance: "exiting a game while another sync runs leaves a durable report of the skip, and #139 names the cause"
    outcome: deferred:#139
  - id: PL-07
    severity: Medium
    category: Documentation Gap
    source_finding: carried from audit #60 PL-06
    owner_area: ROCKNIX/rocknix.org
    where: docs/configure/cloud-sync.md
    acceptance: "#42 lists this range's six user-visible changes, or a rocknix.org PR lands them"
    outcome: deferred:#42
  - id: PL-08
    severity: Medium
    category: Cornerstone Violation
    source_finding: F-11
    owner_area: docs/decision-register.md
    where: docs/decision-register.md:171
    acceptance: "a parse of the register reports zero duplicate IDs, and tools/lint-audit-artifacts checks it"
    outcome: deferred:#129
  - id: PL-09
    severity: Low
    category: Acceptance Criteria Gap
    source_finding: F-09
    owner_area: rclone cloud scripts / issue #71
    where: projects/ROCKNIX/packages/network/rclone/sources/cloud_backup:983
    acceptance: "#71 AC 4 and the case statement describe the same set of filter flags"
    outcome: deferred:#71
  - id: PL-10
    severity: Low
    category: Acceptance Criteria Gap
    source_finding: F-10
    owner_area: issue tracker
    where: "https://github.com/maxengel/rocknix/issues/127"
    acceptance: "#127 is closed completed, or carries an unticked box naming what remains"
    outcome: deferred:#127
  - id: PL-11
    severity: Low
    category: Documentation Gap
    source_finding: F-12
    owner_area: fork workflow
    where: .claude/rules/fork-workflow.md:23
    acceptance: "fork-workflow.md's fork-only tools list and PERSONAL_PATTERNS match entry for entry"
    outcome: deferred:#129
  - id: PL-12
    severity: Low
    category: Code Quality
    source_finding: F-07, F-06
    owner_area: emulationstation-next strings + cloud scripts
    where: es-app/src/guis/GuiMenu.cpp:8733
    acceptance: "no _() string contains WIFI unhyphenated; the menu path is written one way in both repos"
    outcome: deferred:#129
```

---

# Phase 7 resolution gate

Every item has a recorded outcome. **This audit fixed nothing** — it was run under an explicit
instruction not to change code, so no item can be *Resolved* here; each is **Deferred** to a
named, open issue, which is the outcome the gate allows when the fix is larger than the audit
cycle or belongs to someone else's decision. The three High findings got issues of their own,
filed in this session and attached to #129 as GitHub sub-issues; the rest are tracked on
#129's own checklist, which is where the punch list lives.

| Item | Outcome | Evidence |
| --- | --- | --- |
| PL-01 | **Deferred** | #144 — "ES lifetime test: cloud-oauth-lifetime.py has not compiled since #128, and nothing runs it"; open, four acceptance criteria, sub-issue of #129 |
| PL-02 | **Deferred** | #145 — "cloud: the empty-cloud offer never appears on the transfer page (two protocol parsers)"; open, four acceptance criteria, sub-issue of #129 |
| PL-03 | **Deferred** | #146 — "cloud scripts: the RCLONE_NET_OPTS fallback still carries the two-retry bound #107 removed"; open, four acceptance criteria, sub-issue of #129 |
| PL-04 | **Deferred** | #129 punch-list checklist — three strings, four copies; rationale: a string fix plus the mechanical check (P-02) that stops it recurring, which is a change to the ES build, not an audit edit |
| PL-05 | **Deferred** | #129 punch-list checklist — rationale: which of the two names survives is the maintainer's call (`least-surprise.md`), and `docs/es-menu-map.md` changes with it |
| PL-06 | **Deferred** | #129 punch-list checklist, and #139 — rationale: the fix is a behaviour choice (start it and let the lock answer, or say the skip) that belongs with D-UI-041's design |
| PL-07 | **Deferred** | #42 — open since audit #60's PL-06; this range adds six more user-visible changes to it |
| PL-08 | **Deferred** | #129 punch-list checklist — rationale: renumbering a decided row is an append-only edit the maintainer should make, and the lint change belongs with it |
| PL-09 | **Deferred** | #129 punch-list checklist, and #71 — rationale: the criterion is probably what should change, which is a decision |
| PL-10 | **Deferred** | #127 — the issue itself; close it, or add the box that is genuinely open |
| PL-11 | **Deferred** | #129 punch-list checklist — rationale: a two-line edit to `.claude/rules/fork-workflow.md`, personal-overlay scope |
| PL-12 | **Deferred** | #129 punch-list checklist — rationale: cosmetic; bundle with PL-04's string pass |

**Gate status:** 12 of 12 items carry an outcome citing an open issue. Nothing is in limbo,
and nothing is claimed fixed. The three High items are the ones that block: #144, #145, #146.
