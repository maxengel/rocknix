# Audit Analysis — Milestone "Stable before upstream", the work since audit #129

**Date:** 2026-09-13
**Auditor:** Code Auditor skill on Claude Fable 5.1 (`claude-fable-5-1`), session effort `xhigh`
**Spec:** the fourteen issue bodies on `maxengel/rocknix`; `docs/decision-register.md` rows D-CLOUD-008, D-CLOUD-123, D-NET-002, D-NET-003, D-UI-050, D-UI-051, D-WORKFLOW-010/013/014, D-QA-016
**Issues:** #45 #142 #50 #93 #47 #27 #149 #66 #67 #68 #69 #82 #113 #129
**Commits:** distribution `next` `53f390b1e9..59103cd9cb` (`projects/`, `packages/`, `tools/`, `.githooks/`; 19 commits, +546/−19); EmulationStation `test/qa-integration` `52012829cf..3466b36af7` (24 commits, +373/−15)
**Punch-list issue:** [#151](https://github.com/maxengel/rocknix/issues/151) — "Code audit of the milestone work since #129 — 18 findings (0 critical, 2 high)", labels `cloud-saves` `audit` `punch-list`, milestone "Stable before upstream"

---

## Executive Summary

The range does what its nineteen distribution commits and fourteen ES commits say, and it does it with checks: the settings archive is pruned of what the image ships and the tar restore skips the same paths from any age of archive; a cloud folder an FTP server calls "501" reads as *not there yet* and is created before it is written to; a device's shipped family name becomes its own at first boot and survives `systemd-hostnamed`; the save state manager's labels fit a 640x480 panel and its help bar is drawn there for the first time; a refused ScreenScraper login is named in English and French with the right credential blamed; the register has a guard; the ES fork has a pointer and a hook. Every mechanical check in the repo is green on this tree — `last-good-scripts-test` (cases k, l, m included), `register-check`, `vocabulary-check`, `pkgcheck` on all five packages, syntax on every touched script — and the three QA guests confirm the hostnamed ordering three for three. Of 47 decidable acceptance criteria, 41 are fully met.

Two things the range says are not in the image, and one thing it did is undone by the project's own central flow. **The fork's `avahi-daemon.service` — with its `After=network-base.service` and its off-switch — has never shipped:** the override recipe is upstream's minus the one line that removes avahi's stock units, and `scripts/install` extracts those stock units over the fork's copy. Guest b is publishing `ROCKNIX.local` while named `GENERIC-X64-0964`; the one call that would have corrected it was removed as redundant. D-NET-003 and #50's mDNS tick describe a unit file that exists only in the source tree, and the suite's check grades that source file. **The generated per-unit hostname travels in the settings archive**, and on the second device it is "a name the player typed" — so the fresh-handheld journey (restore another device's settings) puts #50's collision back, permanently. **The zip-era restore branch does not skip PPSSPP's assets**, so D-CLOUD-008's "from any archive" is true of one archive kind.

Around those sit fifteen smaller findings, half of them from the two Facilitator seats and confirmed here against the tree: the device identity now first computed at two seconds into a first boot by a unit that cannot see whether the wifi adapter exists yet; #47 closed against four open boxes with two three-line rows on the page and no 640x480 frame; a no-account early return that hides the developer-pair message the tick's frame shows (the frame predates the code); an offline scrape told the server "answered with an error"; two git hooks that scan secrets only at the pushed tip; a QA tool that passes credentials through `ssh`'s argv. **Verdict: PASS WITH FINDINGS — 18 findings, 0 Critical, 2 High, 8 Medium, 8 Low.** Under D-WORKFLOW-015 every one of them is to be fixed; severity orders the work.

## Acceptance-criteria scorecard

Full entries with evidence and refutation in `02-forward-audit.md`. Depth: *check-run* / *guest-read* / *frame* / *code-read* / *cited*.

| ID | Criterion (short) | Verdict | Notes |
| --- | --- | --- | --- |
| AC-45-1 | archive substantially smaller; tracks user data | PASS ✓ | case k + `--old` fails 3; `cmp` is busybox on both trees |
| AC-45-2 | `ppsspp.ini`/`controls.ini` round-trip | PASS ✓ | case k; `controls.ini` by the same rule |
| AC-45-3 | the same on hardware | SKIP ○ | unticked; per-device yes |
| AC-45-4 | an older build's backup does not overwrite assets | PARTIAL ⚠ | tar yes; **zip no** (F-03) |
| AC-45-5 | the symlink comment is right | PASS ✓ | `ppsspp-sa/package.mk:91` |
| AC-45-6 | Cheats decided, user files covered | PASS ✓ | D-CLOUD-008; case k both sides |
| AC-142-1 | missing folder = not there yet, not by exit code alone | PASS ✓ | `absent_not_broken`; case l 11/11 |
| AC-142-2 | scan lists every system on FTP; never "couldn't be read" when reachable | PASS ✓ | code + cited run |
| AC-142-3 | content backup creates the folder first | PASS ✓ | `:564`; case l |
| AC-142-4 | `cloud-round-trip --backend ftp` 99/99 | UNTESTABLE ? | a run this audit may not make |
| AC-50-1 | two same-family devices get different names | PASS ✓ | guests 3/3; case m — **but see F-02** |
| AC-50-2 | both reachable by name on a LAN | SKIP ○ | unticked |
| AC-50-3 | stable across reboots and reflashes | PARTIAL ⚠ | reboots yes; reflash rests on the adapter at ~2 s (F-04) |
| AC-50-4 | a player's name never overwritten | PASS ✓ | case m |
| AC-50-5 | upgrade keeps a set value | PASS ✓ | family-name exception stated |
| AC-50-6 | mDNS on the VM, ordered after the naming script | **FAIL ✗** | stock unit ships; guest b publishes `ROCKNIX.local` (F-01) |
| AC-50-7 | `<name>.local` from a laptop | SKIP ○ | unticked |
| AC-93-1 | help bar follows the focused row after a delete | PASS ✓ | code + frame |
| AC-93-2 | screendump | PASS ✓ | frame |
| AC-47-1 | never-configured cloud row not a fault | PASS ✓ | code + frame |
| AC-47-2 | every actionable row has a description | PARTIAL ⚠ | present; two rows three lines (F-05); body unticked |
| AC-47-3 | icon distinguishes not-set from problem | PASS ✓ | code; glyph unframed |
| AC-47-4 | LATER says where | PASS ✓ | code + frame |
| AC-47-5 | reviewed on a small panel | **FAIL ✗** | not done; issue closed (F-05) |
| AC-27-1 | labels whole at 1280x800 and 640x480 | PASS ✓ | code + frames at both sizes |
| AC-27-2 | no `.po` change needed | PASS ✓ | msgids untouched |
| AC-149-1 | help bar at 640x480 | PASS ✓ | code + frames |
| AC-149-2 | drawn once at 1280x800 | PASS ✓ | code + frame |
| AC-66-1 | cause recorded | PASS ✓ | |
| AC-66-2 | English on screen, body to the log | PASS ✓ | code + frame 640x480 |
| AC-66-3 | wrong pair (any account, **or none**) names the pair | PARTIAL ⚠ | with no account the account is named; the tick's frame predates `5e7245b51` (F-06) — *changed from the forward audit's PASS after the seats' argument was verified* |
| AC-66-4 | valid pair, wrong account names the account | PASS ✓ | code; frame named |
| AC-66-5 | both cases on the VM with a test account | PASS ✓ | frames; `qa-accounts` |
| AC-66-6 | on the H700 | SKIP ○ | unticked |
| AC-67-1, -2 | ALL / NO kept across tab switch and reopen | PASS ✓ | code + frame |
| AC-67-3, -4, -7, -8 | systems kept; from a game list; SCRAPE NOW uses them; H700 | SKIP ○ | unticked |
| AC-67-5, -6 | fresh and upgraded defaults | PASS ✓ | `Settings.cpp:223-225` |
| AC-68-1..5 | summary; game page; empty-key message; key stripped and offered; no `z=…&y=` in the binary | PASS ✓ | code, frames, `strings` = 0 |
| AC-68-6 | on the H700 | SKIP ○ | unticked |
| AC-69-1..4 | Tools icons under Boxart/Logo/Image; VM frames | PASS ✓ | patch + frame |
| AC-69-5, -6 | H700; upstream PR | SKIP ○ | unticked |
| AC-82-1..3 | rescan after exit and after a restore; VM frames | PASS ✓ | code + frames named |
| AC-82-4 | on a handheld | SKIP ○ | unticked |
| AC-113-1 | worst case known and written down | PASS ✓ | in the issue; **not** where the tick says (F-12) |
| AC-113-2 | LINK1-7 still end within ~30 s | PASS ✓ | code + QA log row 58 |
| AC-113-3 | Dropbox on the maintainer's device | SKIP ○ | unticked |
| AC-113-4 | the QA log records both numbers | PARTIAL ⚠ | 303 s absent (F-12) |
| AC-129-1..3 | report; High issues; register check | PASS ✓ | lint PASS; #144-146 closed |

**Pass rate:** 40 of 47 decidable criteria fully met (85%) after the AC-66-3 revision; 5 PARTIAL, 2 FAIL; 17 SKIP (all open in their issues, none silently), 1 UNTESTABLE. Register rows: 7 hold, D-NET-002 with a caveat, D-CLOUD-008 over-claims, D-NET-003 does not hold as shipped.

## Code Quality Assessment

### Strengths
- Every guard added this range can say *no*: `absent_not_broken` distinguishes absent from broken and case l proves both directions; the pair probe requires `<?xml`; `qa-accounts` reads the file back; the pair-identity suite fails on an old image and says why.
- The checks grew with the code and were made to fail before the fix (case k under `--old`: 4 FAILs; `register-check`'s first run found D-CLOUD-007).
- Comments carry the design and its history (`backuptool`'s prune rationale; `GuiSaveState`'s three font facts, which also went into `es-code-traps.md`); the one wrong comment is the avahi recipe's.
- `helpRowPerc` shared between layout and label arithmetic; `RCLONE_LIST_OPTS` on every new listing (three retries, as the rule says).
- The French is in the file's own style, and the msgids are byte-identical (14/14).

### Concerns
- **Verification that checks a narrower artifact than the claim** (the GPT seat's phrase, borne out here): a source unit file for a shipped unit; a tar fixture for two archive kinds; one boot for an ordering; a 1280x800 frame for a 640x480 rule; a tip-of-branch scan for a pushed history; attribute presence for valid XML.
- **A cross-package call with no declared dependency** (`network-base-setup` → `cloud_device_id`) that fails silently when the tool or its input is missing.
- **Fail-open branches in small places**: `grep … || true` swallowing exit 2; `if ! rclone backend features … | grep -q`; `grep -qFx "${name}/"` without `--`; `qa-accounts clear` exiting 0 unconditionally; the distribution hook skipping its guard when no upstream base is present.
- **Two comments contradict each other** on whether a ScreenScraper pair alone can scrape (`ScreenScraper.cpp:1014-1017` vs `tools/qa-accounts:58-60`); the 12:40 observation settled it for the first.

### Complexity Hotspots
- `GuiSaveState`'s constructor (`:51-118`): sixty lines of font and geometry arithmetic that mirror `ImageGridComponent::calcGridDimension` by hand. Correct on the frames; a second theme or a six-slot grid at 640x480 has not been framed.
- `backuptool::write_archive`'s prune (`:258-297`): three temp files and a `while read` over the whole tree; fine at the sizes here.
- `screenScraperFailureMessage` (`:976-1035`): a status switch, a body-text fallback in French, an account check and a network probe in one function — the ordering of the last two is what F-06 is about.

## Cornerstone Conformance

**Overall: MEDIUM.** Tables in `03-retrospective.md` § 3.2. The findings (⚠/✗ only):

- **Verify the artifact, not the report** ✗ — the avahi ordering (source file, one boot); **Before deleting a duplicate, diff its behaviours** ✗ — `avahi-set-host-name` carried the "after the write" property the daemon's own read lacks; **Guards must fail closed** ⚠ — five small branches (F-14, F-09); **issue-tracking** ✗ — #47 closed by comment with the body unedited, #113/#50 ticks citing what is not there; **decision-register** ⚠ — D-NET-003 and D-CLOUD-008 need rows citing them; **es-player-text D-UI-023** ✗ — three-line rows on the FINISH RESTORE page; **least-surprise** ✗ — a name that differs by boot; **packaging** ✗ — an override recipe drifted from upstream by the line that mattered; **rclone-cloud-sync** ⚠ — a change to existence checks run on FTP and WebDAV, not on a bucket; **upgrade-and-install** ⚠ — zip archives; the avahi off-switch; and (per the Claude seat) a third question the file does not ask: *restore onto a different unit*.
- **Blindspot register**: 13, 20, 23, 27 and 41 each repeated once, all on the #50/#47 pair; 1, 6, 22, 24, 26, 39, 40 guarded; 14, 16, 31, 34, 36 partly.
- **Invariants**: progress ✓, secrets in archives ✓ (argv in a QA tool ⚠), allowlist ✓, populated devices ⚠ (zip; avahi off-switch; restore onto another unit).

## Spec Fidelity

### Aligned
#142 (parent walk, mkdir first), #93, #27 (approach grew, recorded in D-UI-050), #149, #66's probe design, #68's shape, #69, #82, D-WORKFLOW-010/013/014, D-QA-016, D-UI-050/051.

### Diverged
| Where | Divergence | Impact |
| --- | --- | --- |
| #50 / D-NET-003 | the ordering and off-switch recorded are not in the image | the feature is a race; the row is wrong; the tick is wrong |
| #50 / AC-50-1 × `backuptool` | the generated name is carried by a settings restore and then protected as the player's | the collision returns on the project's central flow |
| #45 / D-CLOUD-008 | "from any archive" is tar-only | zip-era restores still put old assets under a new emulator |
| #47 | closed with 4/5 boxes open; two rows exceed D-UI-023; no small-panel review | the page is on every restored device; the tracker says less than the comment |
| #66 | "any account, or none" — with none the account is named; the tick's frame predates the shipped code; two comments disagree on anonymous scraping | a stale tick; a misleading comment |
| #68 | issue text says `.apikey`, code says `.key` | body drift only |
| #113 | the 303 s figure is not in the QA log the ticks name | tick accuracy |

## Missing Artifacts

From `03-retrospective.md` § 3.6, each with its search there: a 640x480 frame of FINISH RESTORE PROCESS; a frame of the not-set glyph; an H700 monotonic boot journal placing `wlan0` against `network-base.service`; a check that reads the **built** unit files; a pair-identity assertion of the published mDNS name; `--old` coverage for cases l and m; a zip case beside case k; an issue for D-UI-051's follow-up; the five rocknix.org additions on #42's list; the one recipe line that ships the fork's avahi unit; #47's body edit. Added from the seats and confirmed: a case for the `syncpath_problem` bucket branch; negative tests for both git hooks (an intermediate-commit secret; `feature/x:pr/x`); a MinIO run of LINK5's receiving side; `register-check` wired into a runner.

## Risk Assessment

| Risk | Severity | Impact | Mitigation |
| --- | --- | --- | --- |
| F-01 avahi publishes a stale `.local` name; no off-switch exists | High | two same-family units answer the same mDNS name on the boot the race is lost — #50 over mDNS; a player cannot turn the daemon off | one recipe line; a re-publish after the write; a check on the built unit; new register row |
| F-02 the generated hostname travels in the settings archive | High | after a cross-device restore both units are `H700-9a3f`, and the rule protects it as typed | recognise the generated shape with another unit's suffix as a shipped default; or exclude `system.hostname` from restore (decision) |
| F-03 zip restores put old PPSSPP assets under a new emulator | Medium (both seats: High) | the #45 failure for pre-2026-08-26 archives | `unzip -x` the two prefixes; a zip case in k; a D-CLOUD-008 addendum |
| F-04 device identity seeded at ~2 s of first boot without the adapter | Medium | on a handheld, two possible ids by timing; reflash stability and hostname suffix depend on it | defer the rename past the adapter, or a `cloud_device_id` mode that never stores a fallback; prove on an H700 in monotonic time |
| F-05 #47 closed against its checklist; three-line rows; no 640x480 frame | Medium | the post-restore page every restored device shows | cut the two descriptions; frame at 640x480; tick or reopen |
| F-06 no-account branch hides the pair message; stale tick | Medium | a player with a wrong pair and no account adds an account and fails again | probe first, then say what is missing; retake the frame on the pin; reword the criterion or the code |
| F-07 offline scrape says the server erred; a probe timeout blames the pair | Medium | wrong instructions at the moment of failure | handle `REQ_IO_ERROR` first; on an inconclusive probe say COULDN'T REACH SCREENSCRAPER |
| F-08 both pre-push hooks scan secrets at the tip and key `pr/*` on the local ref; the distribution hook skips with no base | Medium | a secret added and removed within a push is pushed; `feature/x:pr/x` skips the personal-path guard | scan each pushed commit's added lines; key on the remote ref; fail closed with no base; negative tests |
| F-09 `qa-accounts`: credentials in argv; `clear` always succeeds; a missing file yields invalid XML; port range | Medium | the maintainer's account values in `ps`; a false "cleared" | RA lines over stdin like SS; check the ssh status; require `<config>` in the input; `1002[2-9]` |
| F-10 harness gaps: source-file check for the unit; `--old` misses l/m; case m and k under host tools | Medium | the suite cannot show three of its own guards firing | read the build root's unit; fetch old copies for l/m; put `bbin` on case m's PATH |
| F-11 `register-check` limits and not wired | Low | a new area or a four-digit id passes silently; the tool runs by hand only | one regex; a `vm-qa` host suite line |
| F-12 #113 ticks cite a QA-log row that does not exist | Low | tick accuracy | one sentence in the log or the tick |
| F-13 LINK5's lock SKIP cannot fail on WebDAV; no MinIO run | Low | a receiver-integrity cell without a proof | run it on MinIO once and say so in the SKIP |
| F-14 small fail-open branches (`|| true` on grep 2; `backend features` failure; `grep -qFx` without `--`) | Low | narrow triggers, wrong direction | four one-line fixes |
| F-15 D-CLOUD-008's cross-device semantics unrecorded; "prefix" comment | Low | a reader builds on a claim | an addendum row; a word |
| F-16 doc/comment nits (ES `CLAUDE.md` working dir; ES hook header; dead `SKIP=""` deletion; `UNDER OPTIONS`; `qa-accounts`' anonymous-quota comment; `cloud_setup`'s first probe unbounded; silent no-rename) | Low | — | edits |
| F-17 no issue for D-UI-051's follow-up; #42's list | Low | untracked work | file it; append to #42 |
| F-18 `helpRowPerc` unthemed in the constructor; seven strings unframed at 640x480 | Low | a second theme could disagree; unmeasured strings | pass the theme; frame them |

## Coverage Boundary

**Examined:** stated per criterion in `02-forward-audit.md` § Coverage Boundary — check-run (9 tools), guest-read (3 guests, read-only, filtered), image-tree read (x64 `519f40aa0c`, H700 `59103cd9cb`), code-read (every changed line and the functions around them, both avahi recipes, `scripts/install`, `cloud_device_id` whole), 12 frames opened.
**Deliberately not examined:** any handheld; real cloud accounts; harness runs that write to guests or endpoints; the `docs/` commits as scope (read as evidence only, including the two that landed at 06:12); the pre-range implementing commits of #67/#68/#69/#82 beyond their call sites; the ES `tests/` tree.
**Dimensions not exercised:** runtime on a handheld (F-04's timing; the LAN mDNS test; the 640x480 restore page); the FTP cell; performance beyond the QA log; security beyond the credential strip and the argv reading.

## Second opinions

Two Facilitator seats audited the same frozen scope from a self-contained brief (SKILL.md, the rules, the decisions, the criteria, the complete diffs) without the tree, the image, the guests or the frames. Raw outputs: `second-opinions/claude-fable-5.1-audit.md` and `second-opinions/gpt-6-astra-audit.md` in this folder (copied from the Facilitator's scratchpad; provenance `…/second-opinions/*.provenance.json` there). Identity and effort gates from the Facilitator logs: `model=anthropic/claude-fable-5.1 effort=xhigh outcome=success 844 s`; `model=openai/gpt-6-astra effort=max outcome=success 957 s`. Both passed.

Every seat finding was re-derived against the code before use. **Neither seat found F-01** — the unit file that does not ship — which needed the image tree; both found F-02's shape only in part (Claude in full as H-3; GPT not at all). Where a seat's severity differs from this audit's, both are recorded; D-WORKFLOW-015 makes the difference immaterial to what gets fixed.

### Claude seat (`anthropic/claude-fable-5.1`, xhigh)

| Seat | Claim | Reconciliation | Folded as |
| --- | --- | --- | --- |
| H-1 | the no-account early return hides the pair message; the tick's frame predates the shipped code; two comments contradict on anonymous scraping | **CONFIRMED** — `ScreenScraper.cpp:1019-1020` returns before the probe; the tick cites ES `f33fa23ac`, the branch is `5e7245b51` (last commit); `qa-accounts:58-60` says a pair alone scrapes, the 12:40 work log and `ScreenScraper.cpp:1014-1017` say it does not. Severity here Medium (the message is true and actionable; the tick is stale) | F-06 |
| H-2 | zip archives not skipped | **CONFIRMED** (AC-45-4). Medium here, High there | F-03 |
| H-3 | the generated hostname travels in the archive and is then "the player's" on the next unit | **CONFIRMED** — `backuptool:154` archives `system.cfg`, `:377` strips only `.key|.password|.token`; no `hostname` handling in `backuptool` or `cloud_restore`; `network-base-setup:26` protects any name ≠ family. High | **F-02** |
| M-1 | `cloud_device_id` at a boot stage where wifi may not exist | **CONFIRMED** (the audit's own L12); MAC-derived on the VM by hash; unproven on a handheld | F-04 |
| M-2 | `syncpath_problem`'s bucket guard fails open when `backend features` fails | **CONFIRMED** by reading `cloud_setup:195-198`; trigger narrow (features must fail while `lsf` succeeds). Low | F-14 |
| M-3 | case m runs under the host's GNU tools | **CONFIRMED** — `nbs()` binds `${M}/shim` (four stubs) and the host `/usr`; `${TMP}/bbin` is not on its PATH. The device's busybox produced the right names on three guests, so the gap is the harness's. Low | F-10 |
| M-4 | `register-check` run by nothing; no recorded failing run | **half CONFIRMED / half REFUTED** — nothing runs it (`grep -c register-check tools/vm-qa` → 0; the hook lists it only as a personal path); but it *has* failed: its first run found D-CLOUD-007 (work log 01:55), and a scratch duplicate and a dangling citation both fail it here | F-11 |
| M-5 | LINK5's assertion became a SKIP counted inside "65 PASS" | **CONFIRMED** as a test gap; the SKIP prints its reason and names the MinIO run nobody has recorded | F-13 |
| M-6 | RA credentials in `ssh`'s argv | **CONFIRMED** — `qa-accounts:47` | F-09 |
| M-7 | offline → "ANSWERED WITH AN ERROR"; probe failure → pair blamed | **CONFIRMED** — `REQ_IO_ERROR` (=3) falls to `default:` with a curl body; `pairOk` false on any non-XML answer | F-07 |
| M-8 | the identity rule changes cross-device restore semantics, unrecorded | **CONFIRMED** as a design consequence (3.5 notes the stale-seed variant). Low | F-15 |
| M-9 | deleting `SKIP=""` may abort zip restores under `set -u` | **REFUTED** — `backuptool` has no `set -u` (`grep -n 'set -'` → none); the deletion is harmless noise | F-16 (nit) |
| L-1 | `titlePerc` from a cold font; `helpRowPerc` unthemed in the constructor | **CONFIRMED in principle** — `mTheme` is null there (guard added for it), so the help font measured is the default one; clamp and frames hide it on the shipped theme | F-18 |
| L-2 | `readonly` collision; the pre-existing probe unbounded | **half REFUTED** (`cloud_setup` sources only `/etc/profile`) / **half CONFIRMED** (`cloud_setup:184` `rclone lsd … --log-level ERROR` carries no `RCLONE_LIST_OPTS`; the new comment's "30 s" claim covers only the new listing) | F-16 |
| L-3 | duplication | BY-DESIGN (case l enforces identity) | — |
| L-4 | "prefix" comment on a substring grep | **CONFIRMED** | F-15 |
| L-5 | test hygiene (duplicated `[ -s ]`; `--old` header; case m's post-hoc assertion never seen to fail) | **CONFIRMED** | F-10 |
| L-6 | nothing creates `avahi.conf` | **REFUTED** — `avahi-defaults.service` (enabled since the first commit) copies it on first boot; and the shipped unit has no condition at all, which is worse than the seat feared | superseded by F-01 |
| L-7 | the `core.hooksPath` command names a missing directory; `vm-first.md` may not exist | **REFUTED** — `ls "$(git config core.hooksPath)"` lists `pre-push`; `.claude/rules/vm-first.md` exists on `next` | — |
| L-8 | regex without trailing boundary; `IFS=:` | **CONFIRMED** — `D-CLOUD-1234` reads as `D-CLOUD-123` on the scratch copy | F-11 |
| L-9 | seven ScreenScraper strings unframed at 640x480 | **CONFIRMED** | F-18 |
| L-10 | `<multiLine>` now honoured for every theme's gridtile text | **REFUTED as a defect** — the shipped theme's XML has 0 `multiLine`; the property did nothing before, so no theme set it. Noted | — |
| L-11 | `clear` writes the literal `default`; leaves username; port range | **REFUTED** (`set_setting … default` deletes — case c) / **CONFIRMED** (username and the enable flag stay; `1002[0-9]` vs the message) | F-09 |
| L-12 | `RCLONE_LIST_OPTS` undefined in `cloud_content_backup` | **REFUTED** — `:131` | — |
| L-13 | the probe URL's `devpassword=` could reach `es_log.txt` | **REFUTED** — `HttpReq.cpp:553` logs status and error text, never the URL; `ScreenScraper.cpp` logs neither URL | — |
| L-14 | LINK5 pad without `mkdir -p` | **REFUTED as a defect** — `/storage/.config/retroarch` exists on every image; VM-only fixture | — |
| § 2 table | several ticks "∅ no code in either diff" (#47, #67, #68, #69, #82) | **RESOLVED** — the implementing commits predate the range (01 § 1.3b names them); the ticks are re-verifications, and this audit graded them against the code on `next`/`test/qa-integration` | — |

### GPT seat (`openai/gpt-6-astra`, max)

| Seat | Claim | Reconciliation | Folded as |
| --- | --- | --- | --- |
| F-01 | zip restores unprotected | **CONFIRMED** | F-03 |
| F-02 | `grep … || true` promotes a partial list on exit 2 | **CONFIRMED** as a fail-open shape; Low here (a temp-file read error), High there | F-14 |
| F-03 | the ES hook scans secrets at the tip only | **CONFIRMED** (`pre-push:44-61`); **the distribution hook has the same shape** (`.githooks/pre-push:129-131`) — an adjacent site the seat could not see | F-08 |
| F-04 | no-account bypasses the pair diagnosis | **CONFIRMED** (= Claude H-1) | F-06 |
| F-05 | an inconclusive probe reads as a rejected pair | **CONFIRMED** | F-07 |
| F-06 | the bucket guard fails open; `grep -qFx` without `--` | **CONFIRMED** both (a `-Name/` folder would error grep into "absent"). Low | F-14 |
| F-07 | credentials in ssh argv | **CONFIRMED** | F-09 |
| F-08 | the SS writer can produce invalid XML on a failed read and report success | **CONFIRMED in principle** (`grep -v … > $F.new` on a missing file; the report checks attribute names only). Low | F-09 |
| F-09 | `clear` prints success unconditionally | **CONFIRMED** — `qa-accounts:34-38`, the ssh status is not read | F-09 |
| F-10 | LINK5's SKIP leaves the integrity proof unclosed | **CONFIRMED** (= Claude M-5) | F-13 |
| F-11 | the `pr/*` guard keys on the local ref; a failed merge base passes | **CONFIRMED** (`pre-push:63-72`); **the distribution hook keys on `local_ref` too** (`:141`) and *skips its guard with a warning* when no upstream base exists (`:149`) — fail-open, pre-existing | F-08 |
| F-12 | `register-check`'s area list; suppressed read errors | **CONFIRMED** (`D-THEME-001` passes on the scratch copy) | F-11 |
| F-13 | port range accepts 10020/10021 | **CONFIRMED** | F-09 |
| F-14 | ES `CLAUDE.md`'s working-directory sentence | **CONFIRMED** | F-16 |
| scorecard | 25 of 45 ticks UNTESTABLE from the packet | **RESOLVED** — with the tree, the image trees, three guests and twelve frames this audit graded them (see the scorecard above); the seat's boundary was the brief, not the code |

## Finding Verification (Phase 4.5)

| Finding | Severity | Survived refutation? | What was checked |
| --- | --- | --- | --- |
| F-01 | High | **yes** | the shipped unit text on both trees; `systemctl show -p After` on three guests (no `network-base.service`); no `avahi-daemon.service.d/`; `journalctl \| grep -ci 'ordering cycle'` = 0 ×3; avahi logged no second `Host name is` line on guest b in 30 min (no re-read path without `avahi-set-host-name`/D-Bus); the recipe `diff` shows the missing `rm`; `scripts/install:72-160` shows the copy-then-extract order. A mitigation search — does anything re-publish after the write? `avahi-set-host-name` removed; `avahi-daemon -r` not called; `Type=dbus` unit with no `ExecStartPost` — none. |
| F-02 | High | **yes** | `backuptool:154` lists `system.cfg`; `:372-380` strips `.key|.password|.token` only; `grep -in hostname backuptool cloud_restore` → comments only; `network-base-setup:26` protects any non-family name; the ES restore flow (`openRestoreRelink`) touches no hostname; `cloud_restore` chooses another device's folder deliberately on the fresh-handheld path (its own header, `:1343-1372`), so the cross-device restore is a supported flow, not a misuse. Mitigation search: `cloud_sync-device-id` is *not* archived (`cloud_device_id` header) — the id does not travel, only the name does; so the two units keep distinct cloud folders and identical hostnames. |

Both High findings are stated without hedges. The Medium findings F-03..F-10 were each re-read end to end in Phase 2/3 (their entries name the lines); F-06's severity was set after re-reading the ordering at `ScreenScraper.cpp:1019-1030` and the work log's 12:40 reasoning for it.

## Instruction File Recommendations

### Coverage Gaps (would-have-prevented)

| Finding | Would have been caught by | Uncovered? |
| --- | --- | --- |
| F-01 | `engineering-practices.md` § Verify the artifact, not the report; blindspot 20 | — (the rule exists; the check read the source) |
| F-02 | `upgrade-and-install.md` § The two questions — which are two | **partly**: no rule asks what a *restore onto another unit* carries |
| F-03 | `upgrade-and-install.md` § Fixing forward is not enough | — |
| F-04 | `engineering-practices.md` § If the VM can test it… "ask what the VM cannot prove" | — |
| F-05 | `es-player-text.md` D-UI-023; `issue-tracking.md` § Ticking; blindspot 41 | — |
| F-06, F-12 | `issue-tracking.md` § Ticking a criterion (an observation, not an artifact) | **partly**: nothing binds a tick to the commit it saw (Claude P-01) |
| F-07 | `es-player-text.md` § Outcome words; `player-language.md` § Clear | — |
| F-08 | `engineering-practices.md` § Guards must fail closed; blindspot 14 | **partly**: no rule says a secret scan covers every pushed commit, or that a `pr/*` guard keys on the destination ref |
| F-09 | D-INFRA-010 is a decision, not a rule with a "writes" clause | **partly** (Claude P-04) |
| F-10, F-11, F-13 | `engineering-practices.md` § Prove the guard fires; blindspots 34, 39 | — |
| F-14 | § Guards must fail closed | — |
| F-15, F-16, F-17, F-18 | `decision-register.md`; `documentation-accuracy.md`; `es-code-traps.md` | — |

### Codification Gaps (needs-new-rule, 3+ instances)

| Pattern | Instances | Recommendation |
| --- | --- | --- |
| **P-01: a check or a tick grades something other than the artifact that ships** | F-01 (source unit file), F-03 (tar fixture for two kinds), F-05 (1280x800 for a 640x480 rule), F-06 (a frame from an earlier commit), F-08 (tip of branch for a pushed history), F-10 (host tar) | **Extend** `engineering-practices.md` § Verify the artifact, not the report with a subsection "Name the artifact the claim is about, then read *that*": a unit file is what `image/system/usr/lib/systemd/system` holds, not `system.d/`; a restore claim covers every `ARCHIVE_KIND`; a UI claim is a frame at the handheld's size **from the pinned commit**; a push guard reads every pushed commit. Add to `last-good-scripts-test`'s header the rule the busybox shim already follows: when a build root is present, read the built file. |
| **P-02: what travels in the settings archive is decided per file without asking whose the value is** | F-02 (a per-unit name), F-15 (per-image defaults), F-03 (per-image assets by format), #68's key (done right by hand) | **Extend** `upgrade-and-install.md` § The two questions to three — *upgrade*, *clean install*, **restore onto a different unit** — with a table row for any new `system.cfg` key or `/storage/.config` path: per-unit (never restored onto another device: hostname, device id, root password, Wi-Fi), per-player (travels), per-image (regenerable, never travels); name the per-unit list in `backuptool` beside the passwords. (Claude P-02, adopted.) |
| **P-03: a decision row records a mechanism nobody read back from the artifact** | D-NET-003 (ordering, off-switch), D-CLOUD-008 ("any archive"), D-NET-002 (reflash, on an unproven timing) | **Extend** `decision-register.md` § Write a row when: a row that states *how* something is enforced (a unit ordering, a condition, a skip list) cites the built or observed artifact (`systemctl show`, a journal line, the extracted tree), not the source that intends it; a row whose mechanism is later found absent gets a new row citing it, the same session. |
| **P-04: a new check with no runner and no observed failure** | F-10 (`--old` for l/m; case m's post-hoc assertion), F-11 (`register-check` unwired), F-13 (a SKIP with no run behind it) | The rule exists (§ Prove the guard fires; blindspot 39). **Add one operational line** to `engineering-practices.md` § Guards must fail closed: *a new tool or case names, in its header, the runner that executes it and the run in which it was watched to FAIL; until both are named it is not a guard.* (Claude P-03, adopted.) |
| P-05: a credential in a process's arguments | F-09 (two sites in one tool) | Below the threshold; note for the next audit. If it recurs, a "writes" sibling to D-INFRA-010 in `engineering-practices.md`: values travel over stdin or a 0600 file, never argv. |

### Recommended Action Sequence (for the closing agent, not the auditor)
1. `engineering-practices.md` § Verify the artifact — the "name the artifact" subsection (P-01), citing F-01.
2. `upgrade-and-install.md` — the third question and the per-unit/per-player/per-image row (P-02), citing F-02.
3. `decision-register.md` — the "cite the built artifact" clause (P-03), citing D-NET-003.
4. `engineering-practices.md` § Guards must fail closed — the one-line runner-and-failure clause (P-04).
5. `es-player-text.md` § Outcome words — a non-HTTP failure at scrape start is `YOU'RE NOT ONLINE` / `COULDN'T REACH SCREENSCRAPER`, never "answered with an error" (F-07).
6. `es-code-traps.md` § Three things a font is not — a sentence that `helpRowPerc` in a constructor sees no theme (F-18), once fixed.

## Tier B visual-QA consolidation

Frames attached to the range: 33 under `docs/qa-frames/2026-09-13/`. Blocker/major items from them: **none open at 640x480 for #27/#149/#66/#69** (framed there, opened here). **Deferred visual-QA items:** FINISH RESTORE PROCESS at 640x480 (never framed; F-05); the not-set glyph (unobserved; F-05); seven ScreenScraper status strings (F-18); a six-slot manager grid at 640x480 (observation, `02` AC-27-1); dialogs' own help prompts under full-screen menus (pre-existing, observation). Fresh page-scale reviews were not run (read-only session); the two three-line rows were found by opening the implementer's own frame.

## Quality Self-Check

| Item | Status |
| --- | --- |
| Acceptance Criteria Scorecard present, IDs match 02 | present (65 criteria + 10 rows; AC-66-3 revised PASS → PARTIAL, recorded) |
| Cornerstone conformance tables present | present (03 § 3.2, three faces; summarised here) |
| Coverage Boundary present (02 + 04) | present in both |
| Finding Verification recorded for all Crit/High | present (F-01, F-02; no Critical) |
| Instruction File Recommendations (epic/milestone) | present (P-01..P-05, sequence) |
| Tier B visual-QA consolidation present | present |
| Second opinions reconciled, every seat finding graded | present (Claude 14+14, GPT 14+scorecard; 6 refuted outright, 4 half) |
| Verdicts use the defined vocabulary only | yes (PASS ✓ / PARTIAL ⚠ / FAIL ✗ / SKIP ○ / UNTESTABLE ?) |
| Traceability / Evidence / Reproducible / Actionable / Complete | self-checked: every finding names file:line or a command with its output; a second auditor can rerun each check listed in 01 § 1.3e and 02 § Coverage; SKIPs are all unticked boxes in their issues |
| Model and effort recorded (maintainer's requirement) | present (running log Phase 0; this header) |
