> Redacted by the orchestrator, 2026-09-28: credential-shaped example strings in this seat's prose (test fixtures and pattern examples the seat quoted) were replaced by `<credential-shaped example redacted>` so the file can be committed past the push guard (`.githooks/secret-patterns`); nothing else was changed.

# G2 audit — packet E-tests (EmulationStation fork: tests, hooks, build files, `7eae8ed91..87b182fbe`)

**Corpus.** Four sources embedded by the Facilitator (paths and sha256 as declared; recorded in `corpus.provenance.json` at the end). Not embedded, though the brief names them: `upgrade-and-install.md`, `es-player-text.md`, the ES interface rules, `packaging-and-patches.md`, `rclone-cloud-sync.md`. Where a judgement needed one of those (every player-visible word pinned by a test; every `Already written:` answer) I say so rather than guess. Every component under test — `AtomicFileUtil.cpp`, `CloudText.cpp`, `WifiText.cpp`, `SaveStateBookkeeper.cpp`, `ProxyCards.cpp`, `CloudTransferJob.cpp`, `OfflineScanJob.cpp`, `GuiMenu.cpp`, `FileData.cpp`, `ThreadedHasher.cpp`, the new header-only files — is outside the diff. What I can judge is whether each test is a test: whether a named mutation of its subject fails it, and whether it is the test the report's FAIL-then-PASS line describes.

---

## 1. Per suite or driver: can it fail, and what does it exercise

| Suite / driver (diff hunk) | Subject | Real or stand-in | A mutation that fails it | Notes |
|---|---|---|---|---|
| `.githooks/pre-push` + `.githooks/pre-push-test` (new, 15 checks) | the push guard | **Real hook**, scratch repo, real `git`; hook fed the stdin lines git would send | revert `--diff-filter=ACMRT`→`AM` (rename case); restore `for cand in upstream/master … origin/master` (fork's-master case); drop `[ -n "${SECRET_PATTERNS:-}" ]` (lonely-hook case); revert range to `oldest^..` (root-commit case); drop `tr 'A-Z' 'a-z'` (URL-case case) | Oracle is exit code only (finding 11). Fixture is a committed literal with an exemption cut for it (finding 01). |
| `.githooks/pre-commit` (new) | the commit guard | real hook — **no test in the diff** | — | Finding 02. |
| `.githooks/secret-patterns` (new) | one pattern list for both hooks | sourced by both | — | Mode 100755 on a sourced file; cosmetic. |
| `es-unit-tests` — `CaptureRotationTextTests.cpp` | `CaptureRotationText` (pure) | real code, compiled into the binary | `recordText` emitting `from=own-launch`; `shouldRecord` returning true for a log with no `=== Build` banner | The exit-0 gate (`recordAfterSession` only after exit 0, E2 187ff9f1c) is in `FileData`, not here. |
| `CheevosRetryTests.cpp` | `CheevosRetry::saveSignIn` (pure) | real | returning `Now` for (switch on, nothing changed, no token, online) | Parameter names are not in the diff; I read them from the comments. The page's wiring (`checkCheevosTokenSoon` after the switch is written) is untested. |
| `CloudTextTests.cpp` | `CloudText` parsers, `cleanLine`, `actionCandidates`, `whySentences`, `stampsToRestamp`, `scanWhy`, `unitLabels` (pure) | real | `atoi` in `parseLastRun` (F-CS-27 cases); printable-ASCII filter (F-CS-19); escape-to-first-letter (G-E1-07); dropping the in-place clause first (PL-072); a typo in one copy of a `whySentences` pair (F-CS-31); restamp by clock alone (G-E1-04/06) | The emitter table is a hand transcription of the scripts; the suite checks the table's own consistency, not the scripts (finding 05, seam 2). |
| `CommandLineTests.cpp` (new) | `Utils::CommandLine::replaceOptionValue` (header-only) | real | `rfind("-core")` to next space (quoted-ROM case) | — |
| `DisplayAspectTextTests.cpp` | `screenshotContent` (pure) | real | stripping after the last dot regardless of extension | — |
| `LaunchCommandTests.cpp` (new) | `launchToken` / `launchArgument` (header-only) | real for the header; **the `runemu()` helper is a C++ model of `${ARGUMENTS##*-P}`, not `runemu.sh`** | last-occurrence reader (nick case: `ro`, `x`, `y'`) | The `runemu(cmd,"-P") == "layer'"` assertion pins the model, which is honest in its comment but proves nothing about the shell script. |
| `MaskSecretsTests.cpp` | `maskSecrets` (`StringUtil.cpp`) | real | value ending at first closing quote (F-ES-09); inner quoted word ended at the quote (coverage 6) | — |
| `OfflineAchievementsTextTests.cpp` | `parseStoreGame` | real | `null`→0 | Seam with the ctl (stream D), proposed. |
| `TabStopsTests.cpp` (new) | `TabStops::fromColumns` (header-only) | real | measuring stop N from each line's own unaligned text | Row/column orientation: outer vector = rows. |
| `WifiTextTests.cpp` | `pickerRows`, `pressAction`, `manualAction`, `joinFailure`, `joinName`, `JoinAnswer` | real | `savedKnown` always true (F-WF-03); `joinFailure(2)==MayBeKey`; `JoinAnswer` convertible to bool (compile-time) | Finding 08 on what the `static_assert`s pin. |
| `es-file-tests` — `AtomicFileTests.cpp` (new, 21 cases) | `Utils::AtomicFile` writers, reader, `PidLock`, `chooseConfig`, `saveUnderLock`, `isFlockHeld`, `pendingAfterReload` | **real component against real files, real forked processes**, plus a `read()` interposition | shared `path.tmp` with O_TRUNC (PL-063: `failed`>0); `ok` set at open (PL-065); temp created 0644 (F-ES-08); pid written after O_EXCL create (PL-041: `emptySeen`); unguarded stale-lock removal (PL-041: `overlaps`); blocking `flock` on `.reap` (G-E1-01: rc −1); proceed without the guard (G-E1-02); retry without reading the clock (F-ES-07); save without the lock (PL-024) | Two cases are not tests of the subject: the PL-069 mechanism case is a platform measurement, the PL-069 source case pins a spelling (finding 09). The G-E1-04 case fixes both mtimes equal (finding 03). `substr(0,38)` comment says the cut ends at `wifi.k`; by count it ends at `wifi.` — cosmetic. PL-041 cases are probabilistic detectors (finding 14). |
| `es-file-tests-win32` — `AtomicFileWin32Tests.cpp` (new) | `AtomicFileUtil.cpp` compiled with `-D_WIN32` on the host | real source, **glibc semantics** | reading `failbit` after `ss << in.rdbuf()` as a failed read (`CHECK(ok)` on the empty file) | Finding 10. |
| `es-app/tests/unit/CMakeLists.txt`, `README.md` | build wiring; the list of record | — | — | Consistent with the sources added (`CommandLineTests`, `TabStopsTests`, `LaunchCommandTests`, `es-file-tests`, `atomicfile-win32-branch`, `es-file-tests-win32`). |
| `tests/app-unit/AppWindowTests.cpp` | `AppWindow::post` / `closing` (header-only) | real header, `FakeWindow` | removing the closing flag (`postsAfterGone`>0) | Cannot fail on the "closing waits for a post in progress" half (finding 04). |
| `BookkeeperTests.cpp` | shipped `SaveStateBookkeeper.cpp` + real `SaveStateJobQueue.cpp`, `AtomicFileUtil.cpp` | real, against doubles for `ApiSystem` (records, runs nothing, rc 0) and `FileSystemUtil`; **real flock held by a real `sh`** | deleting without asking the lock (case 1); check-then-act without holding (case 4: `flock -n` succeeds); fail-open on ELOOP (case 3) | The double always returns rc 0 from the retire script; what the bookkeeper does on a failing script is untested. |
| `FolderMergeTests.cpp` | `FolderMerge::merge` (header-only) | real algorithm over a `Node` tree stand-in for `FolderData`; ASan gives the double-free teeth | clear-and-repopulate (holders deleted) | The `SystemData` half (collections, index, views) is untested here, as E2 says. |
| `JobsTests.cpp` | shipped `CloudTransferJob.cpp`, `OfflineScanJob.cpp` | real, real `sh`/`sleep` in real process groups; `ThreadedCloudSync` stubbed; `Window::postToUiThread` runs inline | dropping the kept stop (4 s runs); snapshot taken after the command (`sSnapshotVersion` = "after-the-command-started"); check-and-mark not under the lock (`testPauseInStop` case) | Seam oracle is the code's own log line `group 0`. `testPauseInStop` is a test hook in shipped code (outside this diff). Retries up to five times to hit the seam (G-E2-09b). |
| `JourneyTiersTests.cpp` | `JourneyTiers` (header-only) | real | `--all` continuation (first case); `known` on the header line alone (damaged records); write without removing the old record | Substring checks on a composed shell command — appropriate here. |
| `ProxyCardsTests.cpp` | shipped `ProxyCards.cpp` | real, elaborate doubles; **inline posts**, real 5–10 s waits | account sentence without the flush stamp (PL-054); a second watcher (`maxOpen==2`); the queued run started under the launch (`ctlCalls==1` at 7.5 s) | Static state in `ProxyCards` persists across cases; the file relies on doctest's default order and long sleeps. |
| `RunLockTests.cpp` | `RunLock::holder` (header-only) | real files, real processes | returning the pid without a held flock (recycled-pid case, `3202022 == 0`) | Linux `/proc`. |
| `TextFitTests.cpp` | `TextFit::fitOneLine` | real | cutting on bytes (`validUtf8`) | ASCII `...`, not U+2026 — a player-text question I cannot judge without the rule file. |
| `tests/cloud-folder-reopen.py` (new) | `GuiMenu::openCloud` **source text** | regex over `GuiMenu.cpp` | `openCloud(window)` without the flag; onDone without `, true` | A text test; its own docstring says the walk is the proof. A missing pattern raises `ValueError` (a crash, not a `FAIL` line). |
| `cloud-gated-row.py` (new) | shipped `cloudAddGatedEntry` extracted verbatim | compiled against doubles, ASan | not re-checking at the press | The `exists` double erases cached/uncached (finding 06). |
| `cloud-oauth-await.py` (new) | shipped `cloudOAuthAwaitSession`, sleep replaced | doubles for `GetShOutputLines` | treating a `url` answer as a started sign-in when `info` says `STATUS=failed` | — |
| `cloud-oauth-lifetime.py` (mod) | shipped `cloudSetupPresent`, `cloudOAuthOwnSession` | doubles; single-slot `onFinalize` | never cancelling (`cancelled 0 times`); cancelling on hand-over | The double's single slot is built from the claim it would refute (G-E2-03). |
| `cloud-set-systems-quoting.py` (new) | shipped `cloudShellQuote`, `cloudSetSystemsCommand` | compiled, then **run through `/bin/sh`** against a stub | unquoted join (`$(touch …)` runs) | Exact-argument oracle; good. |
| `cloud-sync-last-run.py` (new) | shipped `cloudLastRunWhy` (+`cloudLatestRun`) | stamp table double | reading the row's own stamp instead of the newest run's | — |
| `credential-quoting.py` (mod) | the check's own classifier | `SELF_TEST` before the scan; rc 2 on self-test failure | `std::string` back in `QUOTING_CALLS` | An operand that is not an identifier (a parenthesised ternary) is never seen by `OPERAND` and so never flagged — pre-existing shape, Low. |
| `hasher-offline-index.py` (new) | shipped ctor/dtor of `ThreadedHasher` | stand-in class with the same members; "offline" modelled as an empty hash map | counting before emptying (toast `INDEXING COMPLETED…`) | If the real `getCheevosHashes` throws offline, the stand-in does not model it. |
| `launch-capture-gate.py` (new) | shipped `captureGate` | doubles; harness supplies `CaptureHungSeconds`, `captureAgeSeconds`, the generation atomics | a gate that never waits; letting the launch go at the bound; taking the generation early | Finding 13: production constants are replaced by the harness's. |
| `launch-deferred-state.py` (new) | shipped `launchNow`, `rememberSaveState` | doubles; **built without ASan** | handing over the stale pointer | Finding 07. |
| `maintenance-why.py` (new) | shipped `maintenanceWhy` | trivial doubles | preferring the last line over the why | — |

---

## 2. Per claim: is the named test there, and is it the test the claim describes

Every FAIL-then-PASS line in the two reports that names a test in this diff, checked against the diff. Line numbers quoted by the reports are from earlier versions of files that have since grown; I checked the *assertion*, not the number.

| Report / ID | Named test | In diff | Matches the claim | Note |
|---|---|---|---|---|
| E1 PL-024 | "a save that cannot get the lock writes nothing…" `first == LockBusy`, `last.find("a=2\n")` | yes | yes | Other writer is the test's model of `wait_lock`+`write_setting_line`, not the script. |
| E1 PL-041 | two cases, `emptySeen==0`, `overlaps==0`, `failures==0` | yes | yes | Probabilistic (finding 14); the positive was observed. |
| E1 PL-063 | `failed.load()==0`, `torn==0` | yes | yes | — |
| E1 PL-064 | three `chooseConfig` cases | yes | yes | — |
| E1 PL-065 | directory, `/proc/self/mem`, missing, empty | yes | yes | — |
| E1 PL-065 fixture (gpt) | `read()` interposition, `left == -1`, `text.empty()` | yes | yes; the fixture asserts its own positive (`CHECK(left == -1)`) | — |
| E1 PL-068 | `isFlockHeld` case | yes | yes; no unfixed version, said plainly | — |
| E1 PL-069 | mechanism case (VmSize) | yes | it exercises `std::thread`, not the class (finding 09) | — |
| E1 PL-072 | `actionCandidates(…, true)` every candidate holds `inPlace` | yes | yes | — |
| E1 PL-075 | none | — | documentation | — |
| E1 PL-078 | pre-push-test: root commit, rename, unknown tip, second remote | yes, all four names | yes | — |
| E1 F-CS-27 | `parseLastRun`/`classifyProtocolLine` non-integers; old `|`→0 lines changed to −1 | yes | yes | — |
| E1 F-CS-19, F-CS-31, F-CS-33, F-ES-07, F-ES-08, F-ES-09, F-ES-11 | `cleanLine` UTF-8; `whySentences` pairs; `CommandLineTests`; lock-directory budget; mode kept; whole shell word; `TabStops` | yes | yes | — |
| E1 F-WF-03/05/06/08 | `pickerRows`, `pressAction`, `joinedNotice` | yes | yes | — |
| E1 F-PB-18/19 | "a pr/* push carrying build-tests/es-unit-tests"; "…only the fork's master" | yes | yes | The untrack/`.gitignore` half is outside this diff. |
| E1 G-E1-02 (claude) = gpt G-E1-04 | "a live file cut short of its own record loads the record"; "a save merged onto a cut file…" | yes | **partly** — the case fixes equal mtimes; see finding 03 | — |
| E1 G-E1-04 (claude) = gpt G-E1-06 | stop-stamp token case (`130 cancelled`); snapshot/version case | yes | yes | — |
| E1 G-E1-05 = gpt G-E1-07 | thresholds from `pthread_attr_getstacksize`; source-reading case (three CHECKs) | yes | yes for the revert it names; finding 09 on brittleness | — |
| E1 G-E1-06 (claude) | `AtomicFileWin32Tests.cpp:53 CHECK(ok)` | yes — line 53 is `CHECK(ok)` after the empty read | yes, under glibc (finding 10) | — |
| E1 G-E1-07 (claude) | escape-grammar case, four values `itle>>> offer…`, `itlehy…`, `id 12`, `de` | yes; the four `CHECK`s and the old behaviour's outputs are consistent | yes | — |
| E1 G-E1-08 | `says "reading the 1 commit(s)…"`, URL-case case, lonely hook | yes | yes | — |
| E1 gpt G-E1-01/02 | reap guard held → `rc==0`, `ms<3000`; guard is a directory → `rc==0`, text unchanged | yes | yes | — |
| E1 gpt G-E1-03 | `pendingAfterReload` `kept.size()==2` | yes | yes | — |
| E1 gpt G-E1-05 | recovery mode `0600` from tmp/backup (`420 == 384`) | yes | yes | — |
| E1 coverage 6 | inner-quoted value cases | yes | yes | — |
| E2 PL-014 | `FolderMergeTests` `deleted.count(h)==0` ×3, `find(live,"/r/b.nes")==b` | yes | yes | — |
| E2 PL-029 | `JourneyTiersTests` `CHECK_FALSE(has(cmd,"cloud_content_restore"))` | yes | yes | — |
| E2 PL-030 | `cloud-set-systems-quoting.py` | yes | yes | — |
| E2 PL-054 | "send card: an empty queue without the flush stamp…" `card->action.empty()` | yes | yes | — |
| E2 PL-056 | `maxOpen.load()==1`, ctl ran `[false,true]` | yes | yes | — |
| E2 PL-061 | `launch-capture-gate.py` | yes | yes (finding 13 on constants) | — |
| E2 PL-062 | `cloud-gated-row.py`, FAIL text format matches the harness | yes | yes for the re-check; **not** for "uncached" (finding 06) | — |
| E2 PL-068 | `BookkeeperTests` "the state was deleted under a transfer" ×2 | yes | yes | — |
| E2 F-RA-05 | `hasher-offline-index.py` `-- got: INDEXING COMPLETED…` | yes | yes | — |
| E2 F-RA-08/16 | `RunLockTests` `3202022 == 0` | yes | yes | — |
| E2 F-RA-09/17 | three proxycards cases | yes | yes | — |
| E2 F-ES-11 (claude) | `launch-deferred-state.py` | yes | yes (finding 07) | — |
| E2 F-ES-13 | `maintenance-why.py` `got "tar: short read"` | yes | yes | — |
| E2 F-ES-20 | `LaunchCommandTests` `ro`, `x`, `y'` | yes; those are the nick case's old outputs | yes | — |
| E2 F-ES-26 | `AppWindowTests` `postsAfterGone == 0` | yes | half (finding 04) | — |
| E2 F-RA-23 / F-CS-32 | `TextFitTests` `validUtf8` | yes | yes | — |
| E2 F-ES-16/17/18 (gpt 8a) | `cloud-sync-last-run.py`, `cloud-oauth-lifetime.py` ("cancelled 0 times"), `cloud-oauth-await.py` | yes | yes | — |
| E2 follow-up c0def453a | `WifiTextTests` `joinFailure` | yes | yes | — |
| E2 df44e0ab9, 190f62550, d388c2800, 6b806dd50, 8eb4c6821, 4d1ddebc1, 760458b82, 5b6d2e638, cb32a0481, 435a506b5 | `DisplayAspect`; `shouldRecord`; `SELF_TEST`; `stopBeforeThePid`+completed case; stamps cases; scan-job post case; `LaunchCommandTests`; ELOOP case; `scanWhy`; `unlockedKnown` | yes | yes | 4d1ddebc1's quoted `CHECK({?} == 1)` does not match the current `sPosts == atClose` form; an earlier version. |
| E2 follow-up 3: 6caac243c, 4a0c77fa0, 42f9e8851 | profile case; `matchRemovedNote`; `saveSignIn` | yes | yes | — |
| E2 follow-up 4: b7b0927ff, 1113aa8dc, 71a67ed1b, f4c9549ba, 4313a8f53, 5a37c7981, e6c5cbbe3, 766caa3f4, df954c563, 9b89369dc, 12aa39edb | queued-run hold; `testPauseInStop`; damaged records + `replaceRecord`; bound refusal; `cloud-folder-reopen.py`; `JoinAnswer`; `unitLabels`; ELOOP + retry; own-launch retired; lock held during deletion; snapshot before command | yes, each | yes (findings 08, 13 qualify two) | e6c5cbbe3's "Wi-Fi says what failed" half has no test in the diff; not claimed to. |

Claims made without a test are stated as such in both reports (F-RA-14/15/18, F-ES-02/07/10/15/16, F-CS-14/25, PL-075, 3b5b851ec, etc.). E2's gpt F-RA-21 is declared not fixed, with the reason — the rule's "say plainly that you did not".

Suite-line arithmetic that can be checked from the diff: `AtomicFileTests.cpp` has 21 `TEST_CASE`s (E1: 21/21); `pre-push-test` has 15 `expect`/`says`/inline checks (E1: 15 ok); `AtomicFileWin32Tests.cpp` has 14 assertions counting the two `REQUIRE`s in `ScratchDir` (E1: 14).

---

## 3. Findings

### G2-E-tests-01: The push guard's test fixture is a committed credential-shaped literal, and both hooks were given an exemption for it
- **Severity:** Medium
- **Category:** guard weakened / rule violation (engineering-practices § Guards must fail closed, "A fixture for a secret scanner is built at run time, never written as a literal")
- **Where:** `.githooks/pre-push-test` (`FAKE="<credential-shaped example redacted>"`); `.githooks/pre-push` (`grep -v -E '^[0-9a-f]+:\.githooks/pre-push-test: \+FAKE="'`); `.githooks/pre-commit` (`grep -v -E '^\.githooks/pre-push-test: \+FAKE="'`)
- **What:** The rule written the same day for this exact incident (#307) says the file at rest carries no line the guard would match and the fixture is assembled at run time. `FAKE=` matches `devpassword=[A-Za-z0-9._%-]{4,}`, so instead of building it at run time (`FAKE="devpassword=$(printf %s QwErTyUiOpAsDfGh)"` — `$` is outside the class, so the line at rest would not match), a per-file exemption was cut into both scanners. `secret-patterns` and `pre-commit` each carry the sentence "a scanner's test fixture is built at run time, never written as a literal" beside the exemption that contradicts it.
- **Failure scenario:** Any `+FAKE="…"` line added to `.githooks/pre-push-test` in any future commit is never scanned by either hook, whatever it holds. `.githooks/` is a personal path and never reaches `pr/*`, but it does reach the fork's public remote — which is where the original #307 leak landed.
- **Evidence:** The three lines above. I looked for a run-time construction of `FAKE` in `pre-push-test` and found none; I looked for the rule permitting an exemption and found the opposite sentence in three places.

### G2-E-tests-02: `.githooks/pre-commit` is wired with no test and no recorded positive, and falls open on a failure of its own `git diff`
- **Severity:** Medium
- **Category:** guard without evidence (§ "Prove the guard fires"; "The positive is recorded where the guard is wired")
- **Where:** `.githooks/pre-commit` (whole file); `.githooks/pre-push-test` (tests `pre-push` only); E1 follow-up G-E1-08 row; E2 Follow-up 3 ("That hook ran on each of the three commits below and passed them")
- **What:** The push guard got a 15-case test. The commit guard got none, and the only evidence offered for it is three commits it let through — which is the absence of a firing, not a firing. Separately, `hits="$(git diff --cached … | … | head -5 || true)"` takes the pipeline's status from `head`; if `git diff --cached` fails, `hits` is empty and the commit is allowed. `pre-push` was changed in this very round so that a failed `git log` is a refusal ("a list of commits that cannot be made is a refusal, not an empty scan"); `pre-commit` sits beside it with the older shape.
- **Failure scenario:** (a) A regression in `pre-commit`'s awk or exemptions passes silently; nothing would report it. (b) `git diff --cached` exits non-zero (index lock, corrupt object) → empty input → exit 0 → the credential-shaped line is committed; the push guard is the only backstop, and history rewrite is the cost the pre-commit exists to avoid.
- **Evidence:** No `pre-commit` invocation in `pre-push-test`; no constructed failure of `pre-commit` in either report; the `|| true` pipeline versus `pre-push`'s `if ! added="$(git log …)"; then … status=1; continue`.

### G2-E-tests-03: The G-E1-04 "cut live file loads the record" case fixes both mtimes equal; the ordering the finding and the case's own comment describe is untested and, by the rule the report states, yields the old outcome
- **Severity:** Medium
- **Category:** test does not cover the claim / fix possibly incomplete
- **Where:** `es-app/tests/unit/AtomicFileTests.cpp`, `TEST_CASE("a live file cut short of its own record loads the record (G-E1-04)")`: `setMtime(path, now - 60); setMtime(path + ".backup", now - 60);` then `c.source == Backup`; then `setMtime(path, now)` → `Live`. E1 follow-up G-E1-02: "loads the record when the live file is incomplete, is the start of the whole record, **and is no newer than it**."
- **What:** The comment says "the file was cut after the record was written from it." A cut that happens *after* the record — the crash the finding describes (an in-place truncating writer killed mid-copy; `open(O_TRUNC)` updates mtime) — leaves the live file *newer* than the record. The case sets the two mtimes equal, i.e. the same-second boundary, and the only newer-live case asserted is the one that must stay the owner's. So the realistic ordering is exercised nowhere, and the report's rule says it resolves to `Live`.
- **Failure scenario:** `.backup` written whole at T2 (a save, or an earlier boot's record); `system.cfg` truncated in place at T3 > T2 by a pre-#102 writer or any foreign truncation; next start: live is incomplete, a prefix of the record, and newer → `Source::Live`; the device boots on the fragment's keys and defaults for the rest. `record` is false (the second half of G-E1-02 — recording the fragment — is fixed), but the first half — "cut live file wins over a whole .backup" — persists for this ordering.
- **Evidence:** The two `setMtime` lines; the E1 rule text. I looked for a case with the live file's mtime set later than the record's and a `Backup` outcome, and found only the opposite (later → `Live`). `chooseConfig` itself is outside the diff; the orchestrator should read its mtime test and decide whether the rule or the test comment is wrong.

### G2-E-tests-04: `AppWindowTests` cannot fail on "closing waits for a post in progress to finish"
- **Severity:** Medium
- **Category:** a test that cannot fail (for half of what it claims); use-after-free guard unproven
- **Where:** `tests/app-unit/AppWindowTests.cpp`: `FakeWindow::postToUiThread` does `if (gone) postsAfterGone++;` **before** `sleep_for(200µs); posts++;`. Header comment: "nothing is posted once the window is closing, and closing waits for a post in progress to finish." E2 F-ES-26: "`AppWindow::post` / `closing()` (lock held across the post)."
- **What:** The fake samples `gone` at entry. A post that entered before `closing()` and is still inside `postToUiThread` when `w.gone = true` is set is not counted, so an `AppWindow::closing()` that returns without waiting for the in-flight post passes this test. Only the first half (a flag checked before posting) can fail it. The property that protects the real `Window` — no call still executing inside it after main() tears it down — is the untested half.
- **Failure scenario:** `closing()` sets the flag and returns while a worker is inside `Window::postToUiThread`; main() deletes the `Window`; the worker continues on freed memory. The test stays green.
- **Evidence:** The order of the three statements in the fake. Moving the `gone` check after the sleep (or checking both before and after) makes a non-waiting `closing()` fail deterministically. The same shape is in `JobsTests` "scan job: nothing is posted…", which counts posts only.

### G2-E-tests-05: The emitter table is a hand transcription; a sentence the old table listed disappears without a word, and the suite cannot detect a script sentence missing from `whySentences`
- **Severity:** Low
- **Category:** seam evidence / claim not checked by the test
- **Where:** `es-app/tests/unit/CloudTextTests.cpp`, `TEST_CASE("every protocol shape an emitter prints classifies to a known kind")` — removed row `{ ">>> why THE UPLOAD COULDN'T FINISH", …, "cloud_content_backup:158, cloud_content_restore:162" }`; the new table has no such row. `whySentences().size() >= 32` is a floor. E2 Follow-up 2 lists nine sentences *added*, none removed.
- **What:** The test's own comment says "A new marker added to a script without a kind here fails this case" — that is true only if someone also adds it to this table. The table is typed from `git show` of the scripts (E2's words); its `from` column is documentation, not an assertion. So the F-CS-31 property the suite claims ("no why an emitter prints is left in English") is checked only for the sentences someone remembered to list. THE UPLOAD COULDN'T FINISH left the table silently.
- **Failure scenario:** If `cloud_content_backup` at 4476f90394 still prints `>>> why THE UPLOAD COULDN'T FINISH` and `whySentences` no longer pairs it, the card shows English under a translated outcome word — the F-CS-31 defect — and every suite here is green.
- **Evidence:** The removed and added rows; the absence of a removal note in E2 Follow-up 2. One `grep -rn "THE UPLOAD COULDN'T FINISH"` over the scripts repo and `CloudText.cpp` settles it; the packet cannot.

### G2-E-tests-06: `cloud-gated-row.py`'s `exists` double erases the cached/uncached distinction the PL-062 fix hinges on
- **Severity:** Low
- **Category:** stand-in that hides the mutation
- **Where:** `tests/cloud-gated-row.py` harness: `bool exists(const std::string& path, bool = true) { return path == ".../rclone.conf" && gConfigured; }`. E2 PL-062: "a gated row re-checks `rclone.conf` **(uncached)** at the press."
- **What:** The double ignores its `useCache` argument. `cloudAddGatedEntry` calling `Utils::FileSystem::exists(path)` (cached) or `exists(path, false)` (uncached) are indistinguishable here; the driver proves only that the check is repeated at the press.
- **Failure scenario:** A refactor drops the `false`; the real `exists` returns the cached "missing" that the page was built with; the row keeps offering setup after FINISH. Driver green.
- **Evidence:** The one-line double. Recording the `useCache` flag and asserting `false` at the press would kill the mutation. Whether the real cache behaves that way is outside the diff.

### G2-E-tests-07: `launch-deferred-state.py`'s FAIL depends on malloc not reusing the freed address; ASan was dropped for a reason that does not hold
- **Severity:** Low
- **Category:** test whose positive is allocator-dependent
- **Where:** `tests/launch-deferred-state.py`: `refresh()` deletes every `SaveState` and allocates equal ones; `if (launched == system.repo.states[1].get())`; the compile line without `-fsanitize`, with the comment "the unfixed launchNow hands over a freed pointer, and the check compares it rather than reading through it."
- **What:** Comparing a dangling pointer is not an ASan error, so ASan was not in the way. What ASan *does* provide — quarantine, so a freed address is never handed back immediately — is exactly what makes "the pointer equals the new object" unambiguous. Without it, the unfixed code fails only because glibc's tcache returns the chunks in an order that happens to misalign old `states[1]` with new `states[1]`; a two-element vector and LIFO reuse is why the reported FAIL appeared.
- **Failure scenario:** A different allocator, a one-state repository, or a harness change to the order of allocations makes the stale pointer equal the new object's address; the unfixed `launchNow` passes.
- **Evidence:** The comparison and the comment. Building with ASan (as every other `tests/*.py` and `tests/app-unit` target does) removes the dependence.

### G2-E-tests-08: The `JoinAnswer` static_asserts pin the type, not `ApiSystem::joinWifiNetwork`'s return
- **Severity:** Low
- **Category:** guard one step removed from what it claims to guard ("A name is not a behaviour")
- **Where:** `es-app/tests/unit/WifiTextTests.cpp`, `TEST_CASE("a join's answer is not a truth value…")`: `static_assert(!std::is_convertible<JoinAnswer, bool>::value, …)`. E2 G-E2-01: "The function returns `WifiText::JoinAnswer`, which does not convert to bool… two `static_assert`s pin that."
- **What:** `ApiSystem` is not compiled into `es-unit-tests`. The asserts prove `JoinAnswer` cannot become a bool; they say nothing about whether `joinWifiNetwork` still returns it. Changing the signature back to `int` breaks no test here.
- **Failure scenario:** A later edit returns `int`; a caller writes `if (joinWifiNetwork(x))`; every join reads backwards — the Critical the first audit raised — with this suite green.
- **Evidence:** The two asserts; `ApiSystem` absent from `es-app/tests/unit/CMakeLists.txt`'s source list. A `static_assert(std::is_same<decltype(ApiSystem::joinWifiNetwork(std::string(),std::string(),std::string())), WifiText::JoinAnswer>::value)` in `ApiSystem.cpp` or its header would pin the function.

### G2-E-tests-09: The PL-069 pair — one case measures the host, the other pins a spelling
- **Severity:** Low
- **Category:** test that cannot fail from a change to the subject / brittle text test
- **Where:** `AtomicFileTests.cpp`, `TEST_CASE("a thread that ends unjoined keeps its stack…")` and `TEST_CASE("ThreadedCloudSync starts its thread detached…")` (`code()` strips from the first `//`; `cpp.find("std::thread(&ThreadedCloudSync::run, this).detach();") != npos`; `h.find("std::thread*") == npos`).
- **What:** The first case exercises `std::thread` on glibc and no line of `ThreadedCloudSync`; nothing in the fork can fail it. The second is the guard, and it is a text match: a correct refactor (`std::thread t(…); t.detach();`, a lambda) fails it; a leak spelled `std::unique_ptr<std::thread>` or a `std::thread` member never joined passes the two negative checks and fails only the exact-line check. Comment stripping at the first `//` also cuts a `//` inside a string literal on the same line.
- **Failure scenario:** Low practical risk (the exact-line check does fail the revert, as reported); the cost is brittleness and a false sense that the mechanism case guards the class.
- **Evidence:** The two cases. E1 says so about the first ("exercises the pattern because the class needs a Window"); the report's numbers (+229456 KiB / +8196 KiB) are host measurements.

### G2-E-tests-10: `es-file-tests-win32` runs the `_WIN32` branch under glibc; a PASS is not a check of the Windows contract where the CRT differs
- **Severity:** Low
- **Category:** overstated claim
- **Where:** `es-app/tests/unit/CMakeLists.txt` (`atomicfile-win32-branch`, `target_compile_definitions(… _WIN32)`; comment "so the object builds here as it does on Windows… the header's contract for them is checked where it can run"); `AtomicFileWin32Tests.cpp`, `TEST_CASE("the _WIN32 writeText replaces the file whole")`.
- **What:** Builds the same, behaves the same only for standard-C paths whose semantics match. `rename()` over an existing file succeeds on POSIX and fails on the Microsoft CRT; `fopen` on a directory succeeds on Linux and fails on Windows; mode bits do not exist there. "replaces the file whole" passing here says nothing about Windows if the branch uses `std::rename` over an existing target.
- **Failure scenario:** None for ROCKNIX (never builds Windows; PL-075 says the guarantees are POSIX's). The risk is a reader taking "2/2 SUCCESS" as the Windows branch proven.
- **Evidence:** The CMake comment; the test's two writes to the same path. The branch body is outside the diff.

### G2-E-tests-11: `pre-push-test`'s oracle is the exit code; refusals are not checked for their reason, and two "allowed" cases scan an empty range
- **Severity:** Low
- **Category:** weak oracle
- **Where:** `.githooks/pre-push-test` `expect()` (rc only; `says` used once); `# A clean history … git update-ref refs/remotes/origin/clean "${base}"` then `expect allowed "a clean root commit, first push" …`; `g commit -q --allow-empty -m "clean on top"` then `expect allowed "a clean commit over a tip this clone has"`.
- **What:** A hook that refused a rename case with "could not list the commits… nothing was scanned" (status 1 from a broken `git log` invocation) reads as `ok … refused`. The two "clean" allowed cases have nothing for the scanner to read (the commit is already on `origin/clean`; the tip is `--allow-empty`), so the only allowed cases that pass real added lines through the scanner are "the same commit to a feature branch" (CLAUDE.md, `# agent`) and the maskSecrets fixture. The case labelled "a clean root commit, first push" is not a first push: its commit is on the destination's tracking ref.
- **Failure scenario:** A partial breakage of the scan pipeline that fails closed for some inputs is reported as a catch.
- **Evidence:** `expect()` body; the two staged cases. A `says` after each `refused` ("adds a credential-shaped line" / "no ROCKNIX/emulationstation-next master") is the fix.

### G2-E-tests-12: "What the destination is not known to hold" is the local remote-tracking refs, which can be stale
- **Severity:** Low
- **Category:** guard scope (fail-open edge)
- **Where:** `.githooks/pre-push`: `revs=("${local_sha}" --not "--remotes=${remote_name:-.}")` and the comment "every commit not on one of its own remote-tracking refs".
- **What:** A tracking ref outlives the branch on the remote until `git remote prune`. Commits on a stale `refs/remotes/origin/<deleted>` are excluded from the scan on a first push though the remote no longer holds them.
- **Failure scenario:** A branch with a credential is purged on the server (rewritten, deleted); the local tracking ref remains; a new branch cut from that history is pushed for the first time; the purged commits are excluded as "known to origin" and go back up unread. This is the one scenario where a purge and a scanner meet.
- **Evidence:** The `--remotes=` exclusion; no prune or `ls-remote` comparison in the hook. `pre-push-test` has no case for a stale tracking ref (its `update-ref`s stand for pushes that happened). Narrower than the previous rule (`--not --remotes`, all remotes), so not a regression.

### G2-E-tests-13: `launch-capture-gate.py` supplies its own constants and state around the extracted `captureGate`
- **Severity:** Low
- **Category:** stand-in replaces production values
- **Where:** `tests/launch-capture-gate.py` harness: `static const long CaptureHungSeconds = 120; static long captureAgeSeconds() {…}`; `sExitGeneration`, `sCaptureInFlight`, `sCaptureGivenUp`, `sCaptureWaitedOn` defined by the harness; `definition('static bool captureGate(')` extracts the function alone.
- **What:** Everything `captureGate` references outside its body is the harness's. A production change to `CaptureHungSeconds`, to how `captureAgeSeconds` is computed, or to the atomics' handling in the capture's own post is invisible.
- **Failure scenario:** `CaptureHungSeconds` lowered in `FileData.cpp` to a value shorter than a real capture; the "hung" branch lets a launch through under a live capture; the driver's 120 stays and it passes.
- **Evidence:** The harness lines; E2 G-E2-03 names 120 s as the production value, which the packet cannot confirm.

### G2-E-tests-14: The PidLock cases are probabilistic detectors; their regression value is weaker than their observed positive
- **Severity:** Low
- **Category:** test evidence (flakiness both ways)
- **Where:** `AtomicFileTests.cpp`, `TEST_CASE("the lock carries its holder's pid…")` (a spinning reader beside 3000 acquire/release pairs), `TEST_CASE("two waiters on a stale lock…")` (200 rounds × 3 forked waiters; stale pid from `deadPid()`).
- **What:** Both depend on scheduling: on a loaded runner the reader may never win the race (a regression passes), and a pid returned by `deadPid()` can be recycled before the waiters look (a live-looking lock → `acquire(3000)` false → exit 2 → `failures++` → a spurious FAIL). The positives E1 reports (1809 empties; 23 overlaps) are real evidence that the cases can fail; as an ongoing guard they are probabilistic.
- **Failure scenario:** As above; no code defect implied.
- **Evidence:** The loop shapes; `deadPid()` returns a reaped pid with no pid-reuse guard. E1 reports PASS in 7 runs on tmpfs and disk, which is the right thing to do for a probabilistic case.

---

## 4. Sweep rows

**Fixed rows spot-checked against the diff (twelve):**

| Row | Stream / commit | What the diff carries | Holds? |
|---|---|---|---|
| gpt F-CS-27 | E1 0ca44924c | `CloudTextTests`: non-integer stamps not runs; `>>> tier X\|` → −1 (two old assertions flipped) | yes |
| gpt F-ES-09 | E1 dcf7fa8c7 + b036967fc | `MaskSecretsTests`: whole shell word; inner-quoted value (the regression the rewrite introduced, caught by the first audit's coverage note, fixed and pinned) | yes |
| gpt F-ES-11 | E1 a82dcdf4c | `TabStopsTests` | yes |
| gpt F-PB-19 | E1 d5312fabd | `pre-push` `PERSONAL_PATTERNS` gains `build-tests/`; test case refused on `pr/*` | yes for the hook; the untrack/`.gitignore` is outside this diff |
| gpt F-CS-33 | E1 2f5fd6332 | `CommandLineTests` | yes |
| claude F-ES-20 | E2 6c4b0b688 + 760458b82 | `LaunchCommandTests` in `es-unit-tests`, listed in `CMakeLists.txt`, README names it | yes |
| gpt 8a F-ES-21 | E2 df44e0ab9 | `DisplayAspectTextTests` dotted names | yes |
| claude F-RA-08 / gpt F-RA-16 | E2 7b7f2f9ee | `RunLockTests` | yes |
| claude F-ES-13 | E2 275c4200f | `maintenance-why.py` | yes |
| claude F-WF-03 / gpt F-WF-06 (other half) | E2 c0def453a, 5a37c7981 | `WifiTextTests` `joinFailure(2) == ServiceNotAnswering`; `JoinAnswer` | yes (finding 08 qualifies the type guard) |
| claude F-ES-29 | E2 96da6e7d6 | README: count removed, list of record named | yes |
| gpt 8b F-ES-10 | E2 d388c2800 | `credential-quoting.py` `SELF_TEST`, `std::string` demoted to `WRAPPERS` | yes |

**Withdrawn rows I can judge from the packet:**

- E1 claude F-CS-03 (= PL-069): consistent — the PL-069 case comment says so; nothing else in the diff for it.
- E2 claude F-ES-29 "not mine" → later fixed by E2 (96da6e7d6): the README diff is present; the account is consistent.
- E2 claude F-ES-04 = PL-030: `cloud-set-systems-quoting.py` present; consistent.
- E1 claude G-E1-03 withdrawn ("four commits on test/qa-integration in E1's files"): the diff does carry the restamp cases, the regenerated table and `scanWhy`; consistent with the account.
- E2 gpt F-ES-14 withdrawn as "no Windows toolchain… a guarded path would be unproven": E1 later compiled `AtomicFileUtil.cpp` with `-D_WIN32` on the host (`es-file-tests-win32`), so a syntax-and-semantics check of a WIN32 path *is* available in this tree. The withdrawal's reason is weakened, not refuted (finding 10 bounds what such a check proves).
- E2 claude G-E2-03 (single `onFinalize` slot): `cloud-oauth-lifetime.py`'s double models a single slot (`finalize = f`), so the driver cannot refute the claim; it was built from it.
- The remaining withdrawals (F-WF-13 French, F-ES-12 card size, F-RA-16 untranslated, F-ES-19 `clouddrive.mounted`, F-ES-23 GuiBios bytes, G-E2-04 `isSaveStateInfoTemporary`, G-E2-05 `populateFolder`, F-ES-24 D-UI-093, F-ES-17/20 D-INFRA-010) name files or rules not in this packet; I cannot judge them.

---

## 5. Seams

1. **Shared harness (E1's `es-app/tests/unit`, E2's `tests/app-unit`).** E2 moved `LaunchCommandTests` into `es-unit-tests`; the CMake diff lists it and the README names it — agreeing. `tests/app-unit` compiles E1's real `AtomicFileUtil.cpp` and `StringUtil.cpp`, so E1's changes are exercised under E2's doubles too. The committed `build-tests/es-unit-tests` trap E2 named is addressed by 35f02d3d4 (outside the diff) and by `pre-push`'s `build-tests/` pattern (in it). Both streams report their suites on the merged tree with consistent counts (E1 167→E2 170 after three new cases; `es-file-tests` 21/3346 on both).

2. **Cloud scripts' outcome words → the interface.** The interface assumes: every `>>> tier X|code` prints the shell's `$?` (so an empty code is now −1, a failure); the stamp's third field is a token and an optional why; `69 gaps <why>` is stream A's shape; the trap writes `130[ <WHY>]` and never one of ES's tokens (`cancelled`, `player-cancelled`, `no-network`); the `>>> why` sentences are exactly those in `whySentences`. The diff's tests pin the interface's half of each; the scripts' half is asserted only by a hand-typed table (finding 05). If a script ever prints `>>> tier X|` on success, the row now reads COULDN'T FINISH.

3. **Proxy stamps → the cards.** `parseStoreGame` reads `unlocked: null` as unknown; `scanWhy`/`topUpWhy` give words to `SOME_IMAGES_NOT_SAVED`. Both are proposed against a ctl change (stream D) the packet cannot see; the tests pin the interface's reading. The `topUp` fake's rc 75 models the ctl's own lock.

4. **wifictl → the picker.** Assumed: `join` exits 2 when NetworkManager cannot be asked, 1 otherwise, prints `joined` on success; `saved` exits 1 when it cannot ask (a silence is not none); `current` and `list` speak SSIDs, `saved` and `join` speak profile names. `WifiTextTests` pins the picker's inference of a profile for the connected row and its refusal to guess with two active profiles; E2 says `wifictl saved` still prints names only, so a saved network whose profile is named differently and is not up cannot be marked SAVED — open on the script side, and the test cannot see it.

5. **The settings lock (scripts and interface).** `PidLock` + the `.reap` flock (E1) versus `wait_lock` (stream B, "takes the same flock and fails closed", next db0f669bf4 per E1) — the `AtomicFileTests` PL-024 other writer is the test's *model* of the script (noclobber create + pid, `.tmp` + rename); the model and the script are not compared anywhere in the packet. The transfer lock: `isFlockHeld` (E1), the bookkeeper's exclusive non-blocking hold (E2 9b89369dc) and the scripts' `exec 9>lock; flock -n 9` all use the same primitive; the bookkeeper's hold across `--retire --unlink` relies on the scripts waiting "up to a second for a busy lock" — asserted by E2, exercised by no test here.

6. **Rotation records.** `from=checked-launch` supersedes `from=own-launch`; the tests pin that the old claim is untrusted. `tools/vm-qa` line 346 still writes `from=own-launch` (E2's note) — the fixture and the code now disagree until that line changes.

7. **Player words pinned by tests versus `es-player-text.md`.** `SKIPPED - YOU STARTED A GAME` (ProxyCards test) versus the rule's `SKIPPED - A GAME WAS STARTED`; `TRY AGAIN: MATCH THIS DEVICE TO THE CLOUD` and the match note versus the rule's "YOUR CLOUD STILL HAS THEM"; the proposed `SOME ACHIEVEMENT IMAGES COULDN'T BE SAVED…`, `YOUR PROGRESS COULDN'T BE READ`, `…STILL BEING RECORDED…`, `COULDN'T SAVE WHAT YOU TICKED…`. E2 flags each. The tests pin the code's words; the rule file is not in the packet.

---

## 6. Coverage boundary

- **Every subject is outside the diff.** I judged tests, not the code they test. Whether `chooseConfig`'s mtime rule is as E1 states (finding 03), whether `AppWindow::closing()` holds the lock (finding 04), whether `Utils::FileSystem::exists`'s cache behaves as PL-062 assumes (finding 06), what `_WIN32 writeText` does on rename (finding 10) — each needs one visit to one source file the packet does not carry.
- **Rule files not embedded:** `upgrade-and-install.md` (so no `Already written:` answer was checked beyond noting that the tests pin the upgrade paths for own-launch records and pre-#102 `.tmp` fragments), `es-player-text.md` (no word was judged against the outcome vocabulary), the ES interface rules, `packaging-and-patches.md`, `rclone-cloud-sync.md`.
- **The scripts repo** (ROCKNIX `next` 4476f90394): the emitter table's line numbers, the `gaps` token, the trap's stamp shape, `wait_lock`'s flock, `wifictl`'s exit codes — all assumed from the reports.
- **Runtime and device:** every VM step both reports list (PL-024 live lock, PL-068 walk, PL-069 VmSize, PL-072 frame, F-CS-14 slot 3, the capture-gate journal order, confirm-cloud-folder frame 05, STOP IT AND PLAY over a queued top-up) is unproven in this packet and said to be.
- **Suite lines** (case and assertion counts) are the streams' reports of runs I did not see; I checked only the arithmetic that the diff allows (§ 2, last paragraph).
- **The `PERSONAL_PATTERNS` matcher** in `pre-push` is context, not diff; I could not confirm how `build-tests/` is matched.
- **One behaviour question I noticed but could not judge:** `AtomicFileTests` pins that a `system.cfg` holding only `# only a comment\n` is `Source::Damaged`, and that with a `.backup` present the record wins. If a player deliberately empties the file to comments, the record replaces it at the next start. Whether that is #102's intended "usable" rule is a `SystemConf` question, not a test question.

---

```json
{
  "seat": "E-tests",
  "auditor_role": "council member (G2, packet E-tests)",
  "manifest": "docs/audits/2026_09_28-milestone-audit-of-the-fix-round/seats/E-tests.manifest.json",
  "read_mode": "embedded-by-facilitator; no filesystem access; hashes are the Facilitator's, verified at embed time, not re-computed here",
  "source_file_paths": [
    "docs/audits/2026_09_28-milestone-audit-of-the-fix-round/seats/E-tests.diff",
    "docs/audits/2026_09_28-milestone-audit-of-the-fix-round/seats/E1.report.md",
    "docs/audits/2026_09_28-milestone-audit-of-the-fix-round/seats/E2.report.md",
    ".claude/rules/engineering-practices.md"
  ],
  "source_file_hashes": [
    "aebb48c19019efcc6e9d2ca482b75b6f1aba39df1b184d2cec0eddf6487336ec",
    "654dff75600876daeb9162948bb36ffdb504913066e0b0cadda82a5a174b082e",
    "4e80f3ecb71487e7f11f655935eb878969d2063e25d54b10fbd7be6e55b989d9",
    "7f1eb012edc986ee2975abacb44f1a662f2a111a6ded1a1a623a84af509eef7d"
  ],
  "manifest_read_timestamp_utc": "2026-09-28T13:57:25Z",
  "sources_named_in_brief_but_not_embedded": [
    ".claude/rules/upgrade-and-install.md",
    ".claude/rules/es-player-text.md",
    "the ES interface rules (es-native-ui.md, es-ui-style-guide.md, es-code-traps.md)",
    ".claude/rules/packaging-and-patches.md",
    ".claude/rules/rclone-cloud-sync.md"
  ],
  "findings": [
    "G2-E-tests-01", "G2-E-tests-02", "G2-E-tests-03", "G2-E-tests-04",
    "G2-E-tests-05", "G2-E-tests-06", "G2-E-tests-07", "G2-E-tests-08",
    "G2-E-tests-09", "G2-E-tests-10", "G2-E-tests-11", "G2-E-tests-12",
    "G2-E-tests-13", "G2-E-tests-14"
  ]
}
```