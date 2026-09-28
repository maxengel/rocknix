# E1 audit — changes required before full acceptance

I reviewed all embedded diff hunks against the plan and supplied rules. **The unique-temporary writer, Windows-contract clarification, and pre-push changes hold at the static-review level. Locking and configuration recovery remain incomplete, and a refused settings save can lose its pending changes.**

I did not execute tests, access a filesystem, or independently re-hash sources. The report’s execution results remain claims, not independently verified results.

**Citation key:** `[D]` is the embedded diff; `[P]` the plan; `[R]` the report. Rule aliases and their exact declared paths and embed-verified hashes are recorded in `corpus.provenance.json` below. File/hunk citations identify locations *within* `[D]`, not separately read files.

## 1. Per-punch-item verdicts

“Holds” below means the visible implementation and test artifact satisfy the stated mechanism—not that I executed the test.

| Item | Verdict | Evidence and remaining acceptance gap |
|---|---|---|
| **PL-024** | **Holds in part** | `SystemConf.cpp`, `@@ -183,39 +185,60 @@`, returns false for `LockedSave::LockBusy`. `AtomicFileUtil.cpp`, `@@ -126,7 +252,143 @@`, returns before reading or merging when acquisition fails. The file test exercises refusal and a subsequent merge preserving both writers’ keys. However, `loadSystemConf()` still clears the retained dirty keys: **G-E1-03**. |
| **PL-041** | **Holds in part** | `AtomicFileUtil.cpp`, `@@ -148,32 +452,123 @@`, writes the PID into a staging file before `link(staging, mPath)`. The normal stale-reaper path introduces an flock guard, with a real multi-process contender test. But guard failure restores the original race (**G-E1-02**), and its blocking acquisition defeats the timeout (**G-E1-01**). The hard-link fallback also returns to create-then-write publication. Stream B’s current interoperability mechanism is not embedded. |
| **PL-063** | **Holds — POSIX scope** | `AtomicFileUtil.cpp`, `@@ -34,12 +36,51 @@`, gives each call a PID/counter name and opens it with `O_EXCL`; `writeText()` uses that descriptor rather than shared `path.tmp`. The new test concurrently invokes the shipped writer, checks every observed file against complete alternatives, checks failures, and checks temporary cleanup. |
| **PL-064** | **Holds in part** | `chooseConfig()` in `AtomicFileUtil.cpp`, `@@ -126,7 +252,143 @@`, handles the tested cut-prefix/whole-temporary/no-backup cases. Startup no longer deletes the shared temporary. But a visibly incomplete live file can still bypass a complete backup (**G-E1-04**), and recovery from a private temporary can broaden permissions (**G-E1-05**). The earlier boot-time consumer is outside this packet. |
| **PL-065** | **Holds in part** | `AtomicFileUtil.cpp`, `@@ -104,20 +184,66 @@`, initializes `ok=false`, discards text on a read error, and rejects a regular-file read shorter than its initial size. That implements the required mechanism. The tests cause errors on the **first** read—a directory and `/proc/self/mem`—not after a successfully read prefix, so the precise acceptance fixture remains missing. |
| **PL-068** | **Holds in part** | `GuiSaveState.cpp`, `@@ -13,8 +13,25 @@`, calls the actual flock probe; DELETE checks again at YES in `@@ -415,19 +432,29 @@`; COPY also calls the helper. The helper closes its descriptor before returning, so this is a point-in-time refusal, not a lock held through mutation. The worker implementation and required VM walk are absent; the packet cannot establish serialization at the eventual delete/copy. |
| **PL-069** | **Holds in part** | `ThreadedCloudSync.cpp`, `@@ -43,7 +44,12 @@`, replaces the leaked handle with `std::thread(...).detach()`, and the member is removed. This fixes the visible resource-management mistake. The new test does not exercise that implementation and would pass if production reverted (**G-E1-07**). The 50-sync VM proof is absent; task count alone is not a discriminating acceptance metric. |
| **PL-072** | **Holds in part** | `ThreadedCloudSync.cpp`, `@@ -557,6 +564,12 @@`, computes `keepInPlace` for moved bytes followed by exit 69. The subsequent calls use `CloudText::actionCandidates()`, whose protected branch keeps the clause in every candidate. The pure test covers that rule. No mid-transfer link-cut run or 640×480 measurement establishes that the final candidate actually fits. |
| **PL-075** | **Holds** | `AtomicFileUtil.h`, `@@ -14,33 +15,122 @@`, expressly limits guarantees to POSIX/Linux and describes Windows’ delete-before-rename, shared temporary, absent locking, and mode limitations. This is the documentation option explicitly permitted by the plan. |
| **PL-078** | **Holds** | `.githooks/pre-push`, `@@ -68,13 +83,20 @@` and `@@ -86,14 +108,27 @@`, uses a root-safe revision set, excludes only destination-remote history on fallback, includes rename changes, and refuses failed `git log`. The scratch-repository test constructs the four reported problematic shapes plus allowed controls. |

Sources: `[D]`; acceptance criteria: `[P]`, respective PL sections.

## 2. Findings

### G-E1-01: The new reap flock can wait beyond the settings-lock deadline

- **Severity:** Medium
- **Category:** Bounded failure / concurrency
- **Where:** `es-core/src/utils/AtomicFileUtil.cpp`, `removeIfStill()`, hunk `@@ -138,6 +400,48 @@`; its call in `@@ -202,22 +598,26 @@`.
- **What:** The acquisition loop now checks its budget on more paths, but calls a helper that takes a **blocking** flock without a deadline. The budget is checked only after that helper returns.
- **Failure scenario:** A process holds `<lock>.reap` and is suspended or otherwise does not release it. ES encounters a stale PID lock while saving. `PidLock::acquire(5000)` blocks inside `removeIfStill()` indefinitely, holding the interface beyond the promised five seconds.
- **Evidence:** The helper executes:
  ```cpp
  while (::flock(gfd, LOCK_EX) != 0 && errno == EINTR)
  {
  }
  ```
  The caller runs `removeIfStill(mPath, holder);` **before** `expired()`. I looked for a nonblocking attempt, remaining-budget argument, or deadline-aware guard acquisition; none is present. The F-ES-07 test covers a directory at the main lock path, not contention on the reap guard. `[D]`

This leaves F-ES-07 incomplete despite the top-level retry fixes. The appropriate regression case holds the reap guard in another process and verifies that acquisition still ends within its budget. `[ENG: “A failure ends, and ends soon”]`

### G-E1-02: Failure of the reap guard reinstates the original stale-lock race

- **Severity:** Medium
- **Category:** Guards fail closed / concurrency
- **Where:** `es-core/src/utils/AtomicFileUtil.cpp`, `removeIfStill()`, `@@ -138,6 +400,48 @@`.
- **What:** Failure to open or acquire the serialization guard does not stop stale-lock removal. The helper proceeds with the original separate read and unlink.
- **Failure scenario:** `<lock>.reap` is a directory, making the `O_RDWR` open fail. Two contenders both read the same stale holder. One removes the stale lock and acquires a new one; the other’s delayed unlink removes that new lock. Both can then enter the protected operation.
- **Evidence:** Only flock acquisition is inside `if (gfd >= 0)`. These lines execute regardless:
  ```cpp
  const std::string current = readText(path, &again);
  if (again && lockHolder(current) == holder)
      ::unlink(path.c_str());
  ```
  A non-`EINTR` flock error also exits the loop without preventing the unlink. I looked for an early refusal after either guard failure; there is none. The contender test exercises a usable guard file, not these failure paths. `[D]`

The helper’s comment acknowledges this fallback, but documenting it does not make it safe. This is the precise “check could not run, therefore proceed” shape prohibited by `[ENG: Guards must fail closed]`.

### G-E1-03: A reload silently discards settings retained after a refused save

- **Severity:** Medium
- **Category:** Pending-state loss
- **Where:** `es-core/src/SystemConf.cpp`, `loadSystemConf()`, `@@ -132,47 +116,65 @@`, and `saveSystemConf()`, `@@ -183,39 +185,60 @@`; `es-app/src/guis/GuiWifi.cpp`, join callback in `@@ -146,17 +155,23 @@`.
- **What:** The fix promises to retain changes for the next save, but reload clears the dirty-key set unconditionally. A visible ordinary caller—the successful Wi-Fi join callback—reloads the configuration.
- **Failure scenario:** A settings save times out behind a live lock holder. The player subsequently joins a Wi-Fi network, triggering `loadSystemConf()`. The dirty keys are cleared. A later successful save therefore does not apply those deferred changes.
- **Evidence:** The timeout branch returns false without clearing `changedConf`, correctly. However, reload begins with:
  ```cpp
  changedConf.clear();
  ```
  The successful join callback calls:
  ```cpp
  SystemConf::getInstance()->loadSystemConf();
  ```
  I looked for preserving/reapplying pending keys or refusing/defering reload while they exist; the shown reload has neither. The test calls `saveUnderLock()` twice with a supplied merge function; it does not exercise a `SystemConf` reload between attempts. `[D]`

The residual is named in `[R]`, but the diff independently establishes it. PL-024’s no-write-on-timeout mechanism is correct; its claimed deferred-change retention is not complete.

### G-E1-04: A truncated live configuration bypasses the complete last-good record

- **Severity:** Medium
- **Category:** Upgrade recovery / last-known-good preservation
- **Where:** `es-core/src/utils/AtomicFileUtil.cpp`, `chooseConfig()`, `@@ -126,7 +252,143 @@`; `es-core/src/SystemConf.cpp`, load/save handling.
- **What:** A live file containing one assignment still wins even when it visibly ends mid-line and a complete backup exists. Completeness controls whether it is immediately recorded, not whether recovery should prefer the good record.
- **Failure scenario:** The live file contains `a=1\nb=par`, no `.tmp` exists, and `.backup` contains the complete configuration. ES selects the live fragment. A subsequent settings save normalizes its lines and records that incomplete configuration as the newest good state, replacing the usable backup.
- **Evidence:** Without a whole temporary, `liveCut` is false. This branch then returns before the backup is even read:
  ```cpp
  if (liveOk && isUsableKeyValues(live) && !liveCut)
  {
      out.source = LoadedConfig::Source::Live;
      out.text = live;
      out.record = isComplete(live);
      return out;
  }
  ```
  `saveSystemConf()` later calls `recordLastGood(out)` after a successful write. I looked for a complete-backup check before accepting the incomplete live file; there is none. The test saying “there is nothing better” creates **no backup**, so it does not justify the same choice when a good backup is present. `[D]`

This leaves part of PL-064’s “usable means complete” problem in place and conflicts with keeping the last known good state. `[P: PL-064] [ENG: D-CLOUD-078]`

### G-E1-05: Recovery from a private legacy temporary creates world-readable copies

- **Severity:** Medium
- **Category:** Confidentiality / inherited-state handling
- **Where:** `es-core/src/SystemConf.cpp`, `loadSystemConf()`, `@@ -132,47 +116,65 @@`; `es-core/src/utils/AtomicFileUtil.cpp`, explicit-mode `writeText()`, `@@ -60,11 +101,50 @@`.
- **What:** Recovery mode is derived from the live file or backup, but never from the temporary selected for recovery.
- **Failure scenario:** A device has a whole `system.cfg.tmp` with mode `0600`, and neither live configuration nor backup exists. The loader recovers its contents with explicit mode `0644`, then creates a last-good record with that same broader mode. Configuration secrets inherited only through the private temporary become readable to additional users.
- **Evidence:** Mode selection is:
  ```cpp
  modeOf(mSystemConfFile,
      modeOf(mSystemConfFile + ".backup", 0644))
  ```
  The Temporary branch passes that mode to `writeText()`. Its explicit-mode branch applies `fchmod`, so a restrictive process umask does not prevent broadening. I looked for the selected temporary’s mode in the fallback chain; it is absent. The tests separately cover temporary recovery and private-file copying, but not their combination. `[D]`

This is an `Already written:` gap in the interaction between PL-064 and F-ES-08. The inherited artifact’s permissions need to participate in recovery, not just its bytes. `[UPGRADE: Every fix answers what was already written]`

### G-E1-06: A same-second previous stop qualifies as a stamp from the new run

- **Severity:** Low
- **Category:** Outcome provenance
- **Where:** `es-app/src/CloudText.cpp`, `stampsToRestamp()`, `@@ -152,6 +153,65 @@`; `ThreadedCloudSync.cpp`, timestamp initialization and `restampStoppedParts()`.
- **What:** The selector uses a seconds-resolution timestamp as run identity. It can select a previous run’s stopped stamp even when the current run never entered that part.
- **Failure scenario:** One run stops and writes exit 130. Another run starts within the same epoch second and is stopped before reaching that part. The prior stamp satisfies the new run’s cutoff and is selected for restamping with the new run’s token.
- **Evidence:** Construction stores `time(nullptr)`, and selection requires only:
  ```cpp
  r.ran && r.when >= runStarted && r.code == CloudExit::Stopped
  ```
  Thus a pre-existing `1789000000 130 cancelled` qualifies for a new run starting at `1789000000`. I looked for a pre-run stamp snapshot, run identifier, or another way to distinguish the two runs; none is shown. The “never started” test uses a much older timestamp and misses the equality case. `[D]`

The visible selection already violates the function’s stated “part this run interrupted” contract; the downstream writer’s full implementation is not embedded.

### G-E1-07: The thread-leak test cannot detect a regression in ThreadedCloudSync

- **Severity:** Low
- **Category:** Regression-test effectiveness
- **Where:** `es-app/tests/unit/AtomicFileTests.cpp`, test `"a thread that ends unjoined keeps its stack; a detached one gives it back (PL-069)"`; `es-app/tests/unit/CMakeLists.txt`, `@@ -77,3 +84,25 @@`.
- **What:** The test compares two hard-coded thread patterns, neither of which calls the shipped sync implementation.
- **Failure scenario:** Production is changed back to the leaking `new std::thread(...)` pattern. This test remains unchanged and still passes, leaving the regression undetected.
- **Evidence:** The test itself creates both:
  ```cpp
  new std::thread(...);              // old shape
  std::thread(...).detach();         // new shape
  ```
  `es-file-tests` compiles only `AtomicFileTests.cpp` and `AtomicFileUtil.cpp`; it does not compile or invoke `ThreadedCloudSync.cpp`. I looked for a production-linked lifecycle fixture or an included integration result covering it; neither is present. `[D]`

This is useful explanatory evidence about thread resources, not a regression guard for PL-069. It also expects task count to remain unchanged after deliberate leaks, showing why that acceptance metric needs replacement.

## 3. Sweep spot-checks

The following checks cover substantially more than the required five fixed rows.

| Reported fixed row(s) | Check against the diff |
|---|---|
| **F-WF-03 / F-WF-06; F-WF-05** | `GuiWifi` now retains `savedKnown/currentKnown`, exposes an unknown-state subtitle, and routes presses through `PressAction`; the old immediate close for a connected snapshot is removed. **Partial:** the new `WifiText` implementations are not embedded, and the exit-code contract of `ApiSystem::joinWifiNetwork()` is outside the diff. |
| **F-WF-08, both seats** | The call site uses one space after the glyph and passes the SSID plus translated `CONNECTED` to `joinedNotice()`. Tests require `<subject> : <outcome>`. This matches `[STYLE: Waiting/Glyphs]`, but the helper’s implementation is not shown. |
| **F-CS-14** | `SaveState.cpp`, `@@ -181,10 +136,20 @@`, gates remove/copy on differing generic paths. This prevents the exact same-path deletion described by the finding. The `setupSaveState()` runtime path remains untested in this packet. |
| **F-CS-19** | `ThreadedCloudSync` calls the extracted `cleanLine()`, which preserves bytes ≥ `0x80`; tests cover a UTF-8 offer path and rclone ellipsis. The named ASCII-stripping defect is addressed. `[TRAPS: piped progress]` |
| **F-CS-25** | The visible singleton changes are coherent: atomic pointer reads, check-and-install under one lock, unconditional worker clear under that lock, destructor clear under the lock. The full dereferencing caller bodies are not embedded, so this is not a complete race-freedom proof. |
| **F-CS-27** | `wholeNumber()` validates the entire field and bounds before conversion; both stamp and tier readers use it. The malformed-value tests exercise the named false-success cases. **Holds for those cases.** |
| **F-CS-31** | The card now localizes script-provided `mWhy`; the table and English-key tests are present. **Partial:** no French catalog hunk is embedded, and the actual emitters and other rendering surfaces are absent. A manually maintained emitter fixture cannot itself discover a newly added script sentence. `[TEXT: D-UI-051]` |
| **F-CS-33** | The shipped SaveState wrapper calls the new word-aware helper. Tests cover quoted and escaped ROM names, joined options, and the legacy form. **Holds for the generated command shapes shown.** |
| **F-ES-07** | More retry paths inspect the budget, but **does not fully hold** because of **G-E1-01**. |
| **F-ES-08** | Normal replacement preserves existing mode; explicit backup-mode calls and tests cover private records. **Incomplete for temporary recovery:** **G-E1-05**. |
| **F-ES-09** | The top-level scanner now spans adjacent quoted/bare pieces and escaped characters; the new cases cover that defect. The new enclosing-quote branch needs additional scrutiny: see the coverage boundary below. |
| **F-ES-11** | `Font::getTabStops()` calls the new per-column calculation. The second stop includes the first column’s maximum plus the gap; tests cover the overlapping-column example. **Holds at the calculation level.** |
| **F-PB-18 / F-PB-19** | The hook no longer falls back to the fork’s master; it identifies the comparison remote by URL and rejects `build-tests/` on `pr/*`. `.gitignore` is also changed. Actual untracking of an already tracked binary cannot be established from this restricted diff. |

### Withdrawals

- **F-RA-19, F-RA-21, and F-WF-11:** Routing to other owners is consistent with `[P]`’s ownership boundary. That justifies not changing them here; it does not establish that the integrated issues are fixed.
- **F-RA-04:** The ownership routing is reasonable. The stronger refutation based on a whole-tree search for `hardcore_was` cannot be independently checked from this packet.
- **F-WF-13:** **Cannot judge the claimed refutation.** The cited base French catalog contents are not embedded.
- **F-CS-03:** **Withdrawal holds as a duplicate of PL-069**, subject to the proof limitation above.
- **F-ES-24:** **The policy reason holds.** `[UI: One floating surface at a time, D-UI-093]` explicitly requires queued toasts to wait while a card is up.
- **F-ES-12:** **Cannot judge the refutation.** The relevant `AsyncNotificationComponent` and `Window` implementation is not embedded. A claim that width never changes is not a substitute for those call sites.

## 4. Coverage boundary and orchestrator gaps

1. **No execution evidence was independently available.** I could inspect test source, not reproduce FAIL/PASS results, validate “faithful extraction,” inspect commit bodies, confirm assertion counts, or verify syntax/link/catalog checks. `[R]` also describes an earlier state in places—for example, 23 why sentences versus the expanded table in `[D]`.

2. **Missing Wi-Fi implementation evidence:** the diff adds declarations and consumers for `WifiText` helpers, but embeds no corresponding `WifiText.cpp` implementation hunk. `ApiSystem::joinWifiNetwork()` is also absent. **Obtain these before declaring the changed interface complete.** This is an evidence gap, not an assertion that the integrated build necessarily fails.

3. **Cross-stream lock and boot recovery:** the current shell `wait_lock` and `chksysconfig` implementations are not embedded. I cannot confirm shared-reaper interoperability or whether boot preserves the legacy temporary long enough for ES to recover it.

4. **Actual save-tree mutation:** `SaveStateBookkeeper` and the transfer worker’s current locking are absent. The UI probe demonstrably releases its lock before returning; whether E2 provides protection at the eventual mutation must be checked there.

5. **Translations and rendering:** the French catalog, font measurements, and required VM frames are absent. `[TEXT]`, `[UI]`, `[TRAPS]`, and `[STYLE]` require more than plausible strings or character-count approximations.

6. **Credential-mask follow-up:** directly test:
   ```sh
   sh -c 'tool --password "front back"'
   ```
   The new enclosing-quote branch in `maskValueEnd()` differs materially from its top-level shell-word scanner. The unchanged `maskEndsValue()` definition and outer masking loop are not embedded, so I have **not** promoted this to a proven credential leak.

7. **Other integration dependencies:** added tests reference launch-command, capture-rotation, display-aspect, and offline-store implementations outside this packet. Their test expectations do not establish that those implementations satisfy them.

8. **Referenced governance sources:** the full decision register, menu map, and `working-principles.md` were not embedded. Decisions quoted in the supplied rules can be used as supplied; unembedded register contents cannot.

---

## `corpus.provenance.json`

The parallel path/hash arrays below use the Facilitator’s declared order and values. No independent filesystem read or hash verification is claimed.

```json
{
  "audit_seat": "E1",
  "corpus_mode": "embedded read-at-time corpus",
  "verification": "Hashes were supplied as verified at embed time by the Council Facilitator. The auditor did not independently re-read or re-hash files.",
  "facilitator_manifest_read_timestamp_utc": "2026-09-28T04:20:24Z",
  "source_aliases": [
    "D",
    "P",
    "R",
    "ENG",
    "UPGRADE",
    "TEXT",
    "UI",
    "TRAPS",
    "STYLE"
  ],
  "source_file_paths": [
    "docs/audits/2026_09_28-milestone-audit-of-the-fixes-307/seats/E1.diff",
    "docs/audits/2026_09_28-milestone-audit-of-the-fixes-307/seats/E1.plan.md",
    "docs/audits/2026_09_28-milestone-audit-of-the-fixes-307/seats/E1.report.md",
    ".claude/rules/engineering-practices.md",
    ".claude/rules/upgrade-and-install.md",
    ".claude/rules/es-player-text.md",
    ".claude/rules/es-native-ui.md",
    ".claude/rules/es-code-traps.md",
    ".claude/rules/es-ui-style-guide.md"
  ],
  "source_file_hashes": [
    "be9325775bb3d6943449515edfe70bf0202f20c479f68d2b779e1f8ee673ac0f",
    "5b7d2283dc7df121ad4294f001807753169aa73ac7083ac1b571a29e8148db0d",
    "78b02baa8b8ed57f6a8fd89d01aca36898c251b8c2b2ca7c0b87ee578b6f933a",
    "d6f88a6f4cd9c61b0e6ef728625c6a1cec9dc6f58e1db578cf0987f10f870c1a",
    "de4a683f9a36f9100e6fd98be11ad84d736f370374c40f74c445a2b81eca1995",
    "554225c68e627a3bde8969a77f177aea14f5bcd85b0bcc740631d402a5f1f7a7",
    "48cd5ac727b6d05d0e5acf5a17e7591d96a56e574d27f48a5c0210c5499afcb7",
    "9d5d6995714c9a1287c84f0c02a92de244271a4bdad8e53d29bb61115ba51d0f",
    "150d0ac637626d771871eab48db995d8fc46c69ed7cf786240213649d264ad02"
  ],
  "execution_performed": false,
  "coverage_gaps": [
    "No independent test runs, raw harness logs, compiler/linker results, VM walks, or device frames were available.",
    "WifiText helper implementations and the ApiSystem joinWifiNetwork return-value contract were not embedded.",
    "Current Stream B wait_lock and chksysconfig implementations were not embedded.",
    "Current E2 save-state worker and transfer-worker locking implementations were not embedded.",
    "The French catalog and measured rendering evidence were not embedded.",
    "The unchanged maskEndsValue predicate and complete maskSecrets caller were not embedded.",
    "Several added tests reference production implementations outside the restricted diff.",
    "The full decision register, menu map, and working-principles rule were not embedded."
  ]
}
```