# all-es — static audit

Reviewed the embedded diff against the embedded acceptance text. **No commands, tests, builds, filesystem reads, or independent hashing were performed.** Test additions are evidence of intended coverage, not evidence that those tests passed.

References **[S1]–[S8]** resolve to the exact source paths and embed-time hashes in `corpus.provenance.json` below. Implementation-file references identify hunks **inside [S1]**, not separately inspected files.

The main findings are a remaining password-masking escape, an unlocked recovery-record write, an unchecked selection read, and insufficient process-ownership verification. Two further findings concern the fork-only hooks.

## 1. Acceptance verdicts

“Outside the packet” is a scope boundary, not a verdict on the distribution implementation. Per the brief, PL-011, PL-012, and PL-026 remain distribution acceptance items; their fork counterparts are reviewed separately below.

| Item | Verdict | Evidence or boundary |
|---|---|---|
| PL-001 | **outside the packet** | Layout migration implementation and proof are not embedded. |
| PL-002 | **outside the packet** | The five configuration validators are not embedded. |
| PL-003 | **outside the packet** | `backuptool` configuration reader is not embedded. |
| PL-004 | **outside the packet** | Shell safety-copy restoration paths are not embedded. |
| PL-005 | **outside the packet** | Shell redaction fast path is not embedded. |
| PL-006 | **outside the packet** | `backuptool` temporary-file and worklist handling is not embedded. |
| PL-007 | **outside the packet** | Archive exclusion and recovery-marker handling is not embedded. |
| PL-008 | **outside the packet** | Archive credential scan is not embedded. |
| PL-009 | **outside the packet** | Saves-folder validation is not embedded. |
| PL-010 | **holds in part** | `StringUtil.cpp`, hunks `@@ -551,6 +551,34 @@` and `@@ -579,33 +613,36 @@`, decode enclosing-shell escapes before processing inner quotes. `MaskSecretsTests.cpp`, `@@ -192,3 +195,43 @@`, includes the specified failing input and both enclosing modes. The required `es-syntax-check` result is absent. G3-E-01 identifies a separate, equivalent quoting form still missed. **Refutation attempted:** R1. |
| PL-011 | **outside the packet** | Distribution hook acceptance is outside this diff. Fork-only observations: G3-E-05 and G3-E-06. |
| PL-012 | **outside the packet** | Distribution audit-packet exemption removal and `.gitignore` change are not here. The fork removes its different, fixture-specific exemptions. |
| PL-013 | **outside the packet** | The corrected example is visible in [S3], but this is not a distribution change audit and no `rules-check` result is embedded. |
| PL-014 | **outside the packet** | Persistent cloud-log cleanup is not embedded. |
| PL-015 | **outside the packet** | The five shell grammars are not embedded. |
| PL-016 | **outside the packet** | Mount-table failure handling is not embedded. |
| PL-017 | **outside the packet** | Archived ZIP collision handling is not embedded. |
| PL-018 | **holds** | `AtomicFileUtil.cpp`, `@@ -367,7 +368,13 @@`, changes the fallback to `if (backupWhole)`. `AtomicFileTests.cpp`, `@@ -951,3 +951,140 @@`, contains both requested cases, including missing and unusable live files. The new `SystemConfTests.cpp` additionally checks defaults and that the cut record is not replaced. This is a source-level verdict, not a test-run claim. **Refutation attempted:** R2. |
| PL-019 | **holds in part** | `GuiMenu.cpp`, `@@ -4294,20 +4318,102 @@`, replaces immediate BIOS continuation with a page and a verb press. Both picker paths require `cloudSaveSelection()` before setting `*proceed`; the helper checks exit status and compares read-back selections. `tests/cloud-content-selection.py` tests the extracted production writer and checks callback structure. The required 640×480 frame is absent; the press lifecycle is not exercised by a running GUI in the supplied evidence. G3-E-03 identifies a read-error hole in the new verifier. **Refutation attempted:** R7–R8. |
| PL-020 | **outside the packet** | Rotation generators and regenerated tables are not embedded. |
| PL-021 | **outside the packet** | Shell duplicate-key reader is not embedded. |
| PL-022 | **outside the packet** | ZIP verification and image-busybox results are not embedded. |
| PL-023 | **outside the packet** | Harness verdict accounting is not embedded. |
| PL-024 | **outside the packet** | Upgrade-runner boot identification is not embedded. |
| PL-025 | **outside the packet** | Runner signal-disposition change is not embedded. |
| PL-026 | **outside the packet** | Distribution hook acceptance is outside this diff. The fork’s content-after-label matching is addressed in R11. |
| PL-027 | **outside the packet** | Both requested sentences appear in [S8], but the distribution change and `rules-check` result are outside this diff. |
| PL-028 | **outside the packet** | Archive write-set validation is not embedded. |
| PL-029 | **outside the packet** | No candidate upgrade stamp, migration listings, proof-run results, or device-only gap record is embedded. No code change was required for this item. |
| PL-030 | **does not hold as an evidenced closure** | `SaveStateBookkeeper.cpp`, hunks `@@ -45,16 +45,21 @@` and `@@ -202,6 +207,13 @@`, adds comments, not protection or a regression case. The alternative acceptance requires a **source-backed** refutation. The cited manager copy, capture serialization, and transfer read sets are not embedded. This is an evidence failure, **not a demonstrated COPY race**. |
| PL-031 | **holds — interface half only** | `CloudText.cpp`, `@@ -1130,6 +1156,13 @@`, assigns a distinct sentinel for `added=unknown`. `ProxyCards.cpp`, `@@ -317,19 +336,24 @@`, prevents fallback to `cached`; it reports the ready total or only `COMPLETED`. Parser and card cases are added. Forcing the ctl’s comparison to fail remains outside this packet. **Refutation attempted:** R6. |
| PL-032 | **outside the packet** | OAuth terminal-state ordering is not embedded. |
| PL-033 | **outside the packet** | Proxy listener binding and predicate are not embedded. |
| PL-034 | **outside the packet** | Capture-after-age-release safety proof is not embedded. |

Acceptance references: [S2]. All implementation and test references above: [S1].

## 2. Findings

### G3-E-01: Equivalent shell quoting still leaves a password outside the masked range

- **Severity:** High
- **Category:** Credential in a log
- **Where:** `es-core/src/utils/StringUtil.cpp`, `maskInnerChar`, hunk `@@ -551,6 +551,34 @@`; `maskValueEnd`, hunk `@@ -579,33 +613,36 @@`. [S1]
- **What:** The new decoder recognizes the four-byte `'\''` splice but not the equivalent `'"'"'` splice. At the latter’s first byte, it returns zero: the enclosing string is considered finished before the password has been consumed.
- **Failure scenario:** This valid shell command passes `front back` as one password:

  ```sh
  sh -c 'tool --password '"'"'front back'"'"''
  ```

  The inner command is `tool --password 'front back'`. At the value’s starting position, `enclosing` is a single quote. The next bytes are `'"'"'`, not `'\''`, so `maskInnerChar` returns zero and `maskValueEnd` returns the starting position. The credential remains outside the masked range.
- **Evidence:** The decisive branch is:

  ```cpp
  if (c == enclosing)
      return enclosing == '\'' && s.compare(i, 4, "'\\''") == 0 ? 4 : 0;
  ```

  **Refutation attempted:** The new `shellQuote` cases cover the backslash splice, but not this equivalent concatenation. The subsequent inner-quote handling cannot rescue the input: `width == 0` returns first. This is a static counterexample, not an executed test.
- **Fix:** Handle adjoining enclosing-shell quoted segments, including this splice, or conservatively redact rather than treating an unresolved boundary as the end of a secret. Add the input above to `MaskSecretsTests.cpp`, asserting that neither part of the password survives.
- **Confidence:** High for the masked-range error.

### G3-E-02: Recovery records are still published outside the settings lock

- **Severity:** Medium
- **Category:** Last-known-good concurrency
- **Where:** `es-core/src/utils/AtomicFileUtil.cpp`, `loadUnderLock`, hunk `@@ -388,6 +395,42 @@`; `es-core/src/SystemConf.cpp`, recovery branches at `@@ -192,9 +230,8 @@` and `@@ -202,17 +239,21 @@`. [S1]
- **What:** `loadUnderLock` protects the recovery’s live-file write, then returns and destroys its local `PidLock`. `SystemConf::loadFromDisk` subsequently calls `recordLastGood(chosen.text, mode)` without that lock. It also calls it when `loadUnderLock` reports `LockBusy`.
- **Failure scenario:** Loader A recovers text A and releases the settings lock. Before A records it, another settings writer publishes newer live text B and its last-good record B. Loader A then writes record A over record B. A later damaged live file recovers the older state. The `LockBusy` route offers another stale-record interleaving because it returns the choice made before waiting.
- **Evidence:** The record call is outside the helper’s lock lifetime. `recordLastGood`, hunk `@@ -81,13 +83,17 @@`, compares the record with the supplied text and writes when they differ; a newer record therefore does not prevent the stale write.

  **Refutation attempted:** The second `chooseConfig()` under the lock closes the live-file race, but it does not cover the subsequent record publication. No record lock or generation recheck appears before the shown `writeText(backup, text, mode)` call.
- **Fix:** Publish the recovery and its record within the same settings-lock transaction, or reacquire the lock and revalidate the selected generation before recording it. A `LockBusy` recovery should not overwrite the record from its pre-wait snapshot. Add an interleaving case that publishes B before A’s record step and asserts that B remains the record.
- **Confidence:** Medium. The unlocked write is explicit. The other production writers of the record are outside this packet; the stated interleaving has not been executed and needs that cross-packet check.

### G3-E-03: Selection read-back accepts a failed read as an empty selection

- **Severity:** Medium
- **Category:** Guard fails open
- **Where:** `es-app/src/guis/GuiMenu.cpp`, `cloudSelectionRead` and `cloudSaveSelection`, hunk `@@ -4052,6 +4053,66 @@`. [S1]
- **What:** The reader returns only names, discarding stream status. The writer separately opens `there` and checks only `there.is_open()`. A successful open does not establish that the second stream read a complete selection file.
- **Failure scenario:** Use the test’s existing exit-zero/no-write stub, make `CLOUD_CONTENT_SELECTION` a directory, and request no systems. On Linux, opening the directory can succeed while `getline` fails. `saved` and `names` are both empty, so the helper returns true and allows continuation without a valid selection file. A partial read ending in an I/O error can similarly validate a prefix instead of the complete selection.
- **Evidence:** Neither stream’s read failure is checked. The condition is only:

  ```cpp
  !there.is_open()
      || std::set<std::string>(saved.begin(), saved.end())
          != std::set<std::string>(names.begin(), names.end())
  ```

  **Refutation attempted:** The existing “nothing ticked, and no file was written” case fails because the first open fails. It does not cover open-success/read-failure, so it does not refute this case.
- **Fix:** Read once through an API that returns both the names and a success status. Require a valid selection file and distinguish normal EOF—including a genuinely empty file—from read failure. Add directory and injected mid-read-error cases; both must refuse continuation.
- **Confidence:** High for the verifier’s error handling. No production transfer was run.

### G3-E-04: Having the lock file open does not prove ownership of its lock

- **Severity:** Medium
- **Category:** Wrong process signalled
- **Where:** `es-app/src/OfflineAchievements.cpp`, `holdsOpen`, hunk `@@ -52,6 +55,41 @@`; `stopRun`, hunk `@@ -293,9 +331,23 @@`. [S1]
- **What:** The new predicate establishes inode access, not flock ownership. An unrelated process can have the same file open without holding its lock.
- **Failure scenario:** Extend `tests/run-lock-signal.py`’s impostor so it opens the scratch lock on an inherited descriptor before executing its existing ctl-named `sleep`. Leave that PID in the file. Start the real holder without publishing its PID yet. Under the `RunLock::holder` contract described in this hunk, the impostor remains the candidate; `holdsOpen` now accepts it, and `stopRun` sends it `SIGTERM` and reports success while the real run continues.
- **Evidence:** Acceptance consists solely of matching `st_dev` and `st_ino` on any descriptor, followed by:

  ```cpp
  if (pid > 1 && holdsOpen(pid, SCAN_LOCK))
      return ::kill((pid_t) pid, SIGTERM) == 0;
  ```

  **Refutation attempted:** The current impostor holds no descriptor, which is exactly the condition the new helper rejects. Neither the helper nor that fixture tests a non-owner with the inode open.
- **Fix:** Require verified run identity/ownership rather than any open descriptor. A cooperative stop request acknowledged by the current run avoids signalling an unrelated PID; an unverified identity should retain the existing refuse-and-wait behavior. Add the open-without-flock impostor case.
- **Confidence:** High that `holdsOpen` does not establish ownership; medium for end-to-end behavior because the actual `RunLock.h` implementation is not embedded.

### G3-E-05: The new commit-message hook accepts producer and parser failures

- **Severity:** Medium
- **Category:** Fork-only scanner fails open
- **Where:** `.githooks/commit-msg`, new-file hunk `@@ -0,0 +1,19 @@`, especially lines 12–15. [S1]
- **What:** Every failed message-production pipeline enters a branch that either exits zero or continues scanning its partial output. It does not distinguish grep’s legitimate “no selected lines” status from an unreadable message or failed numbering stage.
- **Failure scenario:** With valid pattern lists, invoke the hook with a nonexistent message path. `grep` fails, the output file is empty, and `[ -s "${lines}" ] || exit 0` accepts the message scan. A numbering failure that emits nothing takes the same path.
- **Evidence:** `pipefail` detects the failure, but the following branch discards it.

  **Refutation attempted:** The comment explains grep status 1 for an empty message. It does not justify accepting status 2 or a parser failure. `guard_load` validates the lists, not the message producer.
- **Fix:** Capture and inspect the individual pipeline statuses immediately, or separate the stages. Only the filtering grep’s ordinary no-lines status may be accepted; the numbering stage must succeed. Add unreadable-input and parser-failure cases for this hook.
- **Confidence:** High. Fork-only tooling, not shipped device behavior.

### G3-E-06: Quoted Git paths bypass both added-line scans

- **Severity:** Medium
- **Category:** Fork-only scanner path bypass
- **Where:** `.githooks/guard-lib`, `guard_added_lines`, new-file hunk `@@ -0,0 +1,86 @@`; its callers in `.githooks/pre-commit` and `.githooks/pre-push`. [S1]
- **What:** The parser recognizes only unquoted `+++ b/…` headers. Any other `+++` header clears `f`, after which all added lines for that file are silently omitted.
- **Failure scenario:** Add a text file named `odd"name.txt` containing a line that matches a loaded scan pattern. Git quotes and escapes that path:

  ```text
  +++ "b/odd\"name.txt"
  ```

  This header misses the first rule and enters the `f = ""` rule. Its added content reaches neither scan.
- **Evidence:**

  ```awk
  /^\+\+\+ b\// { f = substr($0, 7); next }
  /^\+\+\+ / { f = ""; next }
  ...
  /^\+/ { if (f != "") print pre f ":" n t $0; n++; next }
  ```

  **Refutation attempted:** Content-after-label anchoring addresses false matches in labels, not omitted files. `pipefail` cannot help because this parser exits successfully.
- **Fix:** Support Git’s quoted path format, or fail closed on unsupported non-deletion headers. Do not silently discard a file’s additions. Add staged and pushed fixtures with quoted filenames and runtime-built matching content.
- **Confidence:** High. Fork-only tooling, not shipped device behavior.

## 3. Seams and conformance

| Seam | Assessment |
|---|---|
| **SystemConf ↔ AtomicFileUtil ↔ shell settings writers** | The live recovery is reselected and written under `PidLock`; save-time recovery selection and recovered permissions also connect correctly in the shown calls. Record publication remains outside that transaction: G3-E-02. The shell lock protocol and record writers must be read before claiming complete multi-writer agreement. |
| **ProxyCards ↔ FileData** | The hold now has a deadline and game-start generation; first runs and successor runs both call `waitForTheGame`. The new cases address a late request and a game that came and went during the outcome card. They do not establish production synchronization: the fake uses atomics for game state, whereas the shown production getter returns the raw `mRunningGame` pointer. The complete launch/worker synchronization is outside the hunks. |
| **ThreadedCloudSync ↔ CloudText ↔ script stamps** | The visible readers agree on a newly written `69 gaps` stamp: show `COULDN'T FINISH`, preserve the gaps token, treat movement as having occurred, and keep an exit sync owed. Unchanged stamp versions and bare 69 remain distinct. Actual script producers and the complete stamp-reading path are not supplied. |
| **Ctl `added=unknown` ↔ parser ↔ top-up card** | The interface distinguishes unknown from absent. Unknown never falls back to cache operations; absent `added=` retains compatibility with older stamps. This meets the interface half without changing the ctl’s contract. Other `ScanStamp` consumers and the ctl producer require the distribution/full-source read. |
| **Picker ↔ selection file ↔ `--selected`** | Consent is moved to the verb, and exit-zero stale selections are compared with the ticks. The transfer item count also uses the new reader, covering the short-file trap in [S7]. Read-error handling is incomplete: G3-E-03. The actual setter and consumer are not embedded, so shell/GUI parsing equivalence is not established. |
| **Save-state COPY ↔ capture manifest ↔ transfer tree** | The comments offer a plausible distinction between the synchronous file copy and queued manifest recording. They do not prove either serialization or the claimed transfer read set. PL-030 needs the primary source, not the recorded grep conclusion. |
| **UI mechanics and language** | The BIOS-only route uses the native settings-page/verb/finalizer shape from [S6], and failure keeps the page available for another press. The new messages are localized at their call sites. French additions cover the backup failure and `BIOS FILES`, but no matching restore-failure addition appears in this diff. An unchanged catalog entry could settle that; the full catalog and frames are missing. |
| **Already-written state** | Visible compatibility handling includes cut recovery records, legacy scan stamps without `added=`, and old `no-network` exit stamps. Those mechanisms are not a kept-`/storage` upgrade proof. The requirement in [S4] remains a separate artifact obligation, particularly PL-029. |

The fail-open findings apply [S3]’s guard and artifact rules. The missing-primary-source boundaries follow [S5]; comments and test expectations have not been promoted into observed behavior. String and outcome judgments use [S8].

## 4. Refutations

**These are static counterexample checks, not executed tests.**

- **R1 — PL-010:** An escaped inner double quote no longer toggles the inner quote state first: the backslash consumes the decoded next character. The specified shape is addressed; G3-E-01 is a different enclosing-word splice.
- **R2 — PL-018:** A merely usable cut backup cannot enter the displayed fallback because it now requires `backupWhole`. Both alternative recovery outcomes requested by the acceptance are represented in tests.
- **R3 — Recovery lock:** A newer whole live file installed while recovery waits is re-read after acquiring the lock; a non-recovery choice returns without the stale live write. This does not protect the later record write.
- **R4 — Pending reload:** The `!loaded && keepPending` branch restores the pending set, its bases, and the last disk reading before returning false.
- **R5 — Partial offline run:** An unchanged `69 gaps` stamp is rejected by the version check, and a bare 69 is rejected by the token check. Neither alone produces the new partial-run outcome.
- **R6 — PL-031:** `added=unknown` cannot enter the cached-count fallback because `addedUnknown` is handled first. With no ready total, the success card does not claim `EVERYTHING'S UP TO DATE`.
- **R7 — PL-019 persistence:** Exit zero with a different, successfully read selection fails the set comparison and does not set `*proceed`.
- **R8 — PL-019 consent:** In the BIOS branch, scan completion constructs the page rather than invoking `onDone`. BACK does not set the shared proceed flag.
- **R9 — Wi-Fi:** An inactive SSID namesake no longer outranks the single active profile; the active-profile count is evaluated first.
- **R10 — Top-up hold:** A request arriving after the stopped card does not inherently escape the hold: the watcher waits before releasing ownership, and every run now calls `waitForTheGame`.
- **R11 — Hook labels:** For lines the parser emits, the scan expression requires the tab separator before a content match. A matching path label alone is not enough.
- **R12 — Invalid scan pattern:** An invalid regular expression is rejected by `guard_load` when grep returns above 1. That does not rescue the message-pipeline or omitted-path cases above.

## 5. Coverage boundary and orchestrator handoff

The following evidence is needed before closing the remaining boundaries:

1. **PL-030 primary source:** the actual manager copy/gate, `cloud_capture` adoption and locking, and the relevant transfer read sets. None is embedded.
2. **Recovery-record writers:** the shell settings-lock implementation and all writers of the last-good record, to exercise G3-E-02 against the real shared protocol.
3. **Run identity:** the actual `RunLock.h` body and ctl lock/PID publication, including the open-but-not-owner fixture in G3-E-04.
4. **Selection protocol:** the actual `cloud_content_restore --set-systems` and `--selected` readers, plus the read-error cases in G3-E-03.
5. **Execution artifacts:** required syntax checks with changed headers, test results, candidate upgrade/proof artifacts, and the BIOS-only 640×480 frame. None was supplied.
6. **French coverage:** the full French catalog lookup for `COULDN'T SAVE WHAT YOU TICKED, SO NOTHING WAS RESTORED.` Its absence from additions is not proof of absence from the whole catalog.
7. **Full conformance:** the referenced UI style guide, menu map, and blindspot register are not embedded. Conformance here is limited to the supplied rules.

All 34 item IDs are classified. No assertion is made that the supplied test cases compiled or passed, that the stated VM work ran on this pin, or that source files outside the embedded hunks were inspected.

## `corpus.provenance.json`

Inline contents for the orchestrator to persist; no file was written by this auditor.

```json
{
  "packet": "all-es",
  "access_method": "embedded read-at-time corpus",
  "filesystem_access": false,
  "independent_file_reads": false,
  "independent_hashing": false,
  "commands_or_tests_executed": false,
  "hash_algorithm": "sha256",
  "hash_verification": {
    "performed_by": "Council Facilitator",
    "when": "verified at embed time",
    "performed_by_this_auditor": false
  },
  "manifest_read_timestamp_utc": "2026-09-29T00:18:21Z",
  "array_alignment": "source_ids, source_file_paths, and source_file_hashes are positionally aligned",
  "source_ids": [
    "S1",
    "S2",
    "S3",
    "S4",
    "S5",
    "S6",
    "S7",
    "S8"
  ],
  "source_file_paths": [
    "/workspace/repos/rocknix/docs/audits/2026_09_29-milestone-audit-of-the-313-fixes/seats/all-es.diff",
    "/workspace/repos/rocknix/docs/audits/2026_09_29-milestone-audit-of-the-313-fixes/seats/items.md",
    "/workspace/repos/rocknix/.claude/rules/engineering-practices.md",
    "/workspace/repos/rocknix/.claude/rules/upgrade-and-install.md",
    "/workspace/repos/rocknix/.claude/skills/code-auditor/references/anti-patterns.md",
    "/workspace/repos/rocknix/.claude/rules/es-native-ui.md",
    "/workspace/repos/rocknix/.claude/rules/es-code-traps.md",
    "/workspace/repos/rocknix/.claude/rules/es-player-text.md"
  ],
  "source_file_hashes": [
    "ab990818040c72a1e60c77a553a98824256f548a39d109b3030fd12ec55ce54a",
    "7017bd2d9f3927d24c85f19a21069dd5fe118dee79b732b8b9042c49a488ac97",
    "9a41f84b4bf10534f5e8d1de3c165acafb6937807d98e84017b024076b23bdcd",
    "d79a1084e85117ba566d23af7fbf3633c44290a6c490f9125e1fd9df061f8cfd",
    "fd825c0505ae772ca2a6651eefe642581aaa147c254fed8cf50db1f8f1bde678",
    "48cd5ac727b6d05d0e5acf5a17e7591d96a56e574d27f48a5c0210c5499afcb7",
    "9d5d6995714c9a1287c84f0c02a92de244271a4bdad8e53d29bb61115ba51d0f",
    "bfbd58cd993195eb4af7b604db0cb4e163d4a48dde46046cddf383560974817a"
  ],
  "implementation_citation_scope": "Implementation paths and hunk locators refer to content inside S1. No separate implementation-file hashes are asserted.",
  "missing_sources": [
    {
      "description": "Full manager COPY/gate implementation, cloud_capture adoption and capture locking, and transfer-script read sets",
      "needed_for": "PL-030 source-backed refutation",
      "status": "not embedded"
    },
    {
      "description": "Shell settings-lock implementation and production last-good record writers",
      "needed_for": "SystemConf multi-writer agreement and G3-E-02 integration verification",
      "status": "not embedded"
    },
    {
      "description": "RunLock.h implementation and ctl lock/PID publication",
      "needed_for": "G3-E-04 end-to-end ownership verification",
      "status": "not embedded"
    },
    {
      "description": "Actual cloud_content_restore selection writer and reader",
      "needed_for": "Selection protocol agreement and G3-E-03 integration verification",
      "status": "not embedded"
    },
    {
      "description": "Unchanged production source surrounding the diff, including launch/worker synchronization and GUI lifecycle callees",
      "needed_for": "Complete concurrency and callback-lifetime review",
      "status": "not embedded"
    },
    {
      "description": "Full French catalog, referenced UI style guide, menu map, and blindspot register",
      "needed_for": "Complete translation and project-conformance review",
      "status": "not embedded"
    },
    {
      "description": "Distribution hook counterparts and actual credential-pattern definitions",
      "needed_for": "Distribution hook acceptance and full scanner-pattern coverage",
      "status": "not embedded"
    },
    {
      "description": "Syntax-check results, test-run outputs, BIOS-only 640x480 frame, candidate upgrade and proof artifacts",
      "needed_for": "Execution evidence for PL-010, PL-019, PL-029, and runtime claims",
      "status": "not embedded"
    }
  ]
}
```