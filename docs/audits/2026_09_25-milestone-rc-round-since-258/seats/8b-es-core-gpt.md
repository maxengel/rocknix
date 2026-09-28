## Summary

This bucket changes configuration persistence and recovery, HTTP timeouts, credential logging, shared UI components, image rendering, tests, and French text. I would not approve the persistence rewrite in its current form: concurrent writers can invalidate its atomic-write guarantee, and a settings save deliberately proceeds without acquiring the settings lock. Startup also deletes a complete temporary configuration that the previous writer could have left as the only recoverable copy. Additional findings concern unchecked reads, Windows replacement behavior, PID-lock ownership, file permissions, credential masking, and UI layout. This is a static review of the embedded diff; no builds, tests, or device checks were executed.

Code citations refer to **S1**. Standards citations **S2–S6** resolve to the declared paths and Facilitator-verified hashes recorded in the inline `corpus.provenance.json` below. Code paths and hunk coordinates identify locations *within* S1.

## Findings

### F-ES-01: Concurrent writes share—and can truncate—the same temporary inode
- **Severity:** Critical
- **Category:** Data loss
- **Where:**
  - `es-core/src/utils/AtomicFileUtil.cpp:@@ -0,0 +1,244 @@` — `writeText()`
  - `es-core/src/SystemConf.cpp:@@ -185,27 +272,32 @@` — backup recording after releasing the lock
- **What:** Every write to a destination uses the same `path + ".tmp"` opened with `O_TRUNC`. Concurrent calls can therefore truncate or modify the inode another call subsequently installs as the live file.
- **Failure scenario:** Writer A finishes and closes its temporary file. Writer B opens that same temporary with `O_TRUNC` and pauses before writing. A renames the now-empty temporary over the live file and returns success. If B dies, the live file remains empty; if B continues, it writes directly into the newly installed live inode.
- **Evidence:** S1 contains `const std::string tmp = path + ".tmp"` and `open(..., O_WRONLY | O_CREAT | O_TRUNC, 0644)`. **Refutation attempted:** there is no per-write unique name or internal exclusion. `recordLastGood(out)` explicitly runs outside the settings lock, so that lock is not a universal protection for this helper.
- **Fix:** Use a uniquely created temporary in the destination directory, with exclusive creation and cleanup limited to that writer’s temporary. Retain separate transaction locking for read-modify-write operations. Add a two-writer test covering truncation immediately before another writer’s rename.
- **Confidence:** high — the inode-sharing counterexample follows directly from the shown operations; no particular shell implementation is required.

### F-ES-02: A lock timeout allows a stale settings snapshot to overwrite another writer
- **Severity:** Critical
- **Category:** Data loss
- **Where:**
  - `es-core/src/SystemConf.cpp:@@ -108,10 +183,23 @@`
  - `es-core/src/SystemConf.cpp:@@ -185,27 +272,32 @@`
- **What:** `saveSystemConf()` continues its read-modify-write transaction after lock acquisition fails. A successful atomic rename does not prevent that transaction from discarding another writer’s intervening changes.
- **Failure scenario:** Another settings writer holds the lock for more than five seconds. ES times out and reads the current file; the holder then commits a change before ES installs its own output. ES replaces that change with its earlier snapshot and clears `changedConf`.
- **Evidence:** S1 says `if (!lock.acquire(5000))` followed only by a warning that it is “saving without it”; the subsequent read and write are unconditional. **Refutation attempted:** there is no version check, retry, or merge against a newly read file before replacement. The existing dirty-change set could have retained the player’s changes instead of proceeding.
- **Fix:** On acquisition failure, leave `changedConf` intact and return failure or schedule a retry. Never perform the transaction without ownership. Exercise contention lasting longer than the acquisition budget.
- **Confidence:** high — the fail-open branch is explicit. The shell implementation is outside the packet, but the lost-update interleaving applies to any competing writer.

### F-ES-03: Startup destroys a recoverable temporary left by the previous writer
- **Severity:** Critical
- **Category:** Upgrade path
- **Where:**
  - `es-core/src/SystemConf.cpp:@@ -72,31 +132,46 @@`
  - `es-core/src/SystemConf.cpp:@@ -185,27 +272,32 @@`
- **What:** Startup unconditionally removes `system.cfg.tmp` before selecting a usable configuration. The removed implementation could leave a complete temporary beside an empty or partially copied live file, so that temporary is not necessarily disposable on an upgraded device.
- **Failure scenario:** The previous version finishes writing `system.cfg.tmp`, then dies while copying it through the truncating live stream. At the next start, the live file is damaged and no usable `.backup` exists. The new loader deletes the only complete configuration before attempting recovery.
- **Evidence:** The old code shown in S1 opens the temporary as `src`, opens the live file as `dst`, and performs `dst << src.rdbuf()`. The new loader first calls `std::remove((mSystemConfFile + ".tmp").c_str())`. **Refutation attempted:** there is no examination or preservation of the temporary when both live and backup are unusable. This directly conflicts with S3’s requirement to handle artifacts already written by the old code.
- **Fix:** Preserve and validate the legacy temporary before cleanup when live and backup recovery fail. Make any recovery non-destructive and interruptible. Add this exact old-writer failure state to upgrade fixtures.
- **Confidence:** high — both the old artifact-producing sequence and the new deletion are visible in the diff.

### F-ES-04: A partial read can be promoted to the live configuration or last-good record
- **Severity:** Critical
- **Category:** Data loss
- **Where:**
  - `es-core/src/utils/AtomicFileUtil.cpp:@@ -0,0 +1,244 @@` — `readText()`
  - `es-core/src/SystemConf.cpp:@@ -72,31 +132,46 @@`
  - `es-core/src/SystemConf.cpp:@@ -108,10 +183,23 @@`
- **What:** `readText()` reports success after opening the file without checking whether extraction completed successfully. Its callers can treat a prefix returned before an I/O error as the complete configuration.
- **Failure scenario:** Reading a configuration yields `a=1\n` and then encounters an I/O error before additional settings. Loading accepts the prefix because it contains a usable key/value line and overwrites the last-good record with it. A save encountering the same failure builds its replacement from that prefix and drops the unread settings.
- **Evidence:** S1 performs `ss << in.rdbuf()` and then sets `*ok = true` without checking extraction failure. `isUsableSystemConf()` accepts any non-NUL text containing one qualifying assignment. **Refutation attempted:** the helper documents `ok` as open success only, but the callers have no separate read-completion check.
- **Fix:** Use a checked read operation that distinguishes successful EOF from read failure. Abort saves on incomplete reads and never promote an incompletely read file into the backup. Add fault-injection tests returning a prefix followed by an I/O error.
- **Confidence:** high — the missing error check and promotion paths are shown; the I/O fault is a proposed test condition, not an observed device failure.

### F-ES-05: The Windows replacement branch deletes the original before committing
- **Severity:** Critical
- **Category:** Data loss
- **Where:**
  - `es-core/src/utils/AtomicFileUtil.cpp:@@ -0,0 +1,244 @@` — `_WIN32` branch of `writeText()`
  - `es-core/src/utils/AtomicFileUtil.h:@@ -0,0 +1,65 @@` — replacement contract
- **What:** The Windows branch removes the destination before attempting the rename. It also does not check the stream’s final flush/close, so it does not implement the advertised old-or-new, failure-leaves-original-untouched contract.
- **Failure scenario:** With an existing destination, termination between `std::remove(path.c_str())` and `std::rename(...)` leaves the live path missing. A rename failure after removal likewise returns false after already deleting the original.
- **Evidence:** S1 shows the remove and rename as separate operations; the header promises that “on any failure … `path` is untouched.” **Refutation attempted:** there is no rollback, retained original, checked explicit close, or platform replacement API in this branch.
- **Fix:** Implement checked writing/flushing and a Windows replacement operation that preserves the original on failure. Test replacement failure and interruption boundaries on Windows; do not advertise the POSIX guarantee for an implementation that lacks it.
- **Confidence:** high — the destructive ordering is explicit. This is a Windows/upstream issue, not a demonstrated ROCKNIX Linux execution path.

### F-ES-06: PID-file cleanup can remove a new owner’s lock
- **Severity:** High
- **Category:** Concurrency
- **Where:**
  - `es-core/src/utils/AtomicFileUtil.cpp:@@ -0,0 +1,244 @@` — `PidLock::acquire()`
- **What:** Re-reading a stale lock and then unlinking its pathname are separate operations. Another contender can replace the stale lock between those operations, after which the first contender removes the new owner’s lock and also acquires ownership.
- **Failure scenario:** A and B both encounter a dead owner’s PID. A completes its confirming read and is paused. B removes the stale file, creates its own lock, writes its PID, and returns true. A resumes, unlinks B’s file using its earlier comparison, creates a replacement, and also returns true.
- **Evidence:** S1 uses `if (again && current == holder) ::unlink(mPath.c_str())`. **Refutation attempted:** the second read narrows the race but does not make comparison and removal atomic. Acquisition also ignores the PID write result—`(void) n; mHeld = true`—so an unpublished owner can leave an empty file that another waiter reclaims.
- **Fix:** Coordinate ES and the shell around an OS-managed lock, such as a held `flock` descriptor with bounded acquisition, rather than unsynchronized stale-file deletion. Do not replace this check with another equally racy read/stat check.
- **Confidence:** high — both contenders’ successful acquisition paths can be traced through the embedded implementation. Updating the shell side requires another packet.

### F-ES-07: Several lock-retry paths bypass the timeout
- **Severity:** Medium
- **Category:** Concurrency
- **Where:**
  - `es-core/src/utils/AtomicFileUtil.cpp:@@ -0,0 +1,244 @@` — `PidLock::acquire()`
  - `es-core/src/SystemConf.cpp:@@ -108,10 +183,23 @@`
- **What:** The deadline is checked only after encountering a non-stale, readable holder. Read failures and stale-lock cleanup retry without checking the elapsed budget, including when removal repeatedly fails.
- **Failure scenario:** `/tmp/.system.cfg.lock` is a directory. Exclusive creation fails because the pathname exists; reading it either fails or produces no PID, and unlinking it cannot remove the directory. Acquisition loops indefinitely, blocking the interface-thread settings save instead of returning within five seconds.
- **Evidence:** Both `if (!ok) continue` and the stale-cleanup branch’s `continue` precede the elapsed-time test; the unlink result is ignored. **Refutation attempted:** the sleeps throttle some retries but do not enforce a deadline or handle permanent errors.
- **Fix:** Enforce the deadline on every iteration. Distinguish transient disappearance from permanent read/removal errors, return failure when appropriate, and preserve pending settings rather than using F-ES-02’s fail-open behavior.
- **Confidence:** high — the deadline bypass is visible on both possible read outcomes for the stated pathname.

### F-ES-08: Atomic replacement broadens previously restricted configuration permissions
- **Severity:** Medium
- **Category:** Security
- **Where:**
  - `es-core/src/utils/AtomicFileUtil.cpp:@@ -0,0 +1,244 @@` — POSIX `writeText()`
  - `es-core/src/Settings.cpp:@@ -495,7 +506,31 @@`
  - `es-core/src/Settings.cpp:@@ -543,6 +610,23 @@`
- **What:** Replacement takes the temporary’s newly created permissions rather than preserving the destination’s permissions. The new last-good files can also expose an identical copy of restricted configuration bytes under a less restrictive mode.
- **Failure scenario:** With umask `022`, saving an existing `0600` configuration replaces it with a `0644` file. Loading a valid configuration can independently create a `0644` backup. Where parent directories are traversable, a local reader previously denied access can now read those bytes.
- **Evidence:** S1 explicitly creates the temporary with mode `0644` and renames it over the destination; Settings writes the same serialized bytes to `.backup`. **Refutation attempted:** there is no preservation of the old mode or credential-file-specific restriction. A restrictive device umask would mitigate this, but no such guarantee is embedded.
- **Fix:** Preserve appropriate existing permissions and ownership, and use restrictive permissions for newly created credential-bearing configurations and their backups. Test an upgraded `0600` file under umask `022`.
- **Confidence:** high — the permission transition for the specified input is deterministic. Remote access or credential exfiltration is not demonstrated.

### F-ES-09: Credential masking stops before the end of a shell word
- **Severity:** Medium
- **Category:** Security
- **Where:**
  - `es-core/src/utils/StringUtil.cpp:@@ -443,6 +443,228 @@` — `maskValueEnd()`
  - `es-core/src/InputManager.cpp:@@ -1264,7 +1265,7 @@`
- **What:** The redactor handles a quoted segment, not a complete shell word assembled from adjacent quoted and unquoted segments. It leaves a credential suffix in the log for valid shell syntax.
- **Failure scenario:** A configured finish command contains `tool --password 'front'back`, which passes the password `frontback` to the shell command. Masking produces `tool --password <redacted>back`, exposing the suffix. Unquoted words containing escaped whitespace have a related boundary problem.
- **Evidence:** S1 returns `i + 1` at the first closing quote; unquoted scanning treats quotes and whitespace as unconditional terminators. The outer scanner then copies the remaining text. **Refutation attempted:** the special handling for `shellQuote`’s `'\''` sequence covers that generated form, not general shell concatenation; `tocall` is an arbitrary configured command in the shown caller.
- **Fix:** Consume the entire shell word, including adjacent quoted segments and escaped delimiters, before masking. Prefer structured redaction before command serialization where possible. Add the concrete concatenation cases to the redactor tests.
- **Confidence:** high — the output follows directly from the scanner. This does not claim that the newly quoted built-in command constructors use the failing form.

### F-ES-10: The credential-quoting guard accepts an unquoted `std::string`
- **Severity:** Medium
- **Category:** Test gap
- **Where:**
  - `tests/credential-quoting.py:@@ -0,0 +1,119 @@` — `QUOTING_CALLS` and operand classification
- **What:** The guard treats every `std::string(...)` operand as shell-safe, even though constructing a string does not quote its contents. It can certify a credential-injection defect as quoted.
- **Failure scenario:** A scanned C++ source contains `"setrootpass " + std::string(password)`. The site is counted, its operand is accepted, and the guard reports no bare operand although spaces and shell metacharacters in `password` remain active.
- **Evidence:** S1 includes `"std::string"` in `QUOTING_CALLS`; acceptance checks only the call name and the presence of `(`. **Refutation attempted:** there is no inspection of the constructor argument or requirement that it contain an already quoted value.
- **Fix:** Remove unconditional acceptance of `std::string`. Permit only demonstrably constant operands or expressions whose dynamic value passes through the approved quoting operation. Test the guard itself with unsafe wrapper expressions and safe quoting expressions.
- **Confidence:** high — the counterexample matches both the site regex and the acceptance predicate. No existing shipped injection site is asserted from this test defect alone.

### F-ES-11: Later tab stops ignore alignment introduced by earlier columns
- **Severity:** Medium
- **Category:** Correctness
- **Where:**
  - `es-core/src/resources/Font.cpp:@@ -826,6 +826,119 @@` — `getTabStops()` and `sizeTabbedText()`
  - `es-core/src/resources/Font.cpp:@@ -1031,7 +1101,7 @@`
- **What:** Tab-stop collection measures each line’s unaligned prefix, but rendering places earlier columns at shared stops. With two or more tabs, a later stop can therefore lie before the end of text already rendered.
- **Failure scenario:** Render `AAAAAAAAAA\tb\t1\nc\tDDDDDDDDDD\t2` in a monospace font with a small or missing tab-glyph advance. The second row’s D column starts after the wide A column’s shared stop, but its following stop was measured using only the narrow `c` prefix. The final value is positioned back inside the D column.
- **Evidence:** On a tab, `getTabStops()` records `xpos` and continues with ordinary glyph advance; it never advances through the earlier shared stop. Rendering instead assigns `x = offset[0] + it->second + TAB_STOP_GAP`. **Refutation attempted:** one-tab labels work, but neither collection nor rendering compensates for earlier-column expansion in multi-tab rows.
- **Fix:** Measure maximum widths per column, then derive cumulative stops including the gaps. Use those stops consistently for measurement and drawing. Add a multi-row, multi-tab case with opposing wide and narrow columns.
- **Confidence:** high — the mismatch is algorithmic; it does not depend on a particular achievements-page caller.

### F-ES-12: Width-fit results remain cached after layout changes
- **Severity:** Medium
- **Category:** Correctness
- **Where:**
  - `es-core/src/components/AsyncNotificationComponent.cpp:@@ -78,12 +126,55 @@`
  - `es-core/src/components/AsyncNotificationComponent.cpp:@@ -106,11 +197,31 @@`
- **What:** Candidate selection is cached solely by the candidate strings, although the result also depends on row width and font metrics. An unchanged message is not reconsidered when its available space changes.
- **Failure scenario:** A wide card selects the long candidate from `{"long explanation", "short"}`. Its row is subsequently narrowed while the candidates remain unchanged. Rendering retains the long selection rather than choosing the available short alternative, leaving text clipped.
- **Evidence:** S1 calls `chooseThatFits()` only when `key != mAppliedGameName` or `key != mAppliedAction`; neither key includes width or font. **Refutation attempted:** the chooser reads current dimensions, but that cannot help when the cache prevents the chooser from running.
- **Fix:** Invalidate selection on relevant layout/font changes, or include those inputs in the selection cache. Do not finalize an unsized-row selection indefinitely. Test repeated rendering with identical candidates across wide and narrow layouts.
- **Confidence:** medium — the cache omission is explicit; the whole application’s resize/recreation policy and the delegated `CloudText` body are outside the packet.

### F-ES-13: Added translations retain fixed controller-button letters
- **Severity:** Low
- **Category:** Player text
- **Where:**
  - `locale/lang/fr/LC_MESSAGES/emulationstation2.po:@@ -4048,3 +4058,2231 @@`
- **What:** Several added message keys and translations hardcode A/B instructions despite the project’s configurable control assignments. These strings provide no placeholder for the current mapping.
- **Failure scenario:** None demonstrated on screen in this packet because the callers are outside it. If displayed unchanged with swapped assignments or a differently labeled controller, the instructions name the wrong button.
- **Evidence:** S1 adds `A  TRY AGAIN     B  CLOSE`, `PRESS B TO CANCEL.`, and the provider-page instruction ending `CHOOSE WITH A.` S6’s “Interaction rules” explicitly prohibit hardcoded console letters and note that confirm/cancel can be swapped. **Refutation attempted:** these particular messages contain no mapped-button substitution.
- **Fix:** Coordinate with the menu-half auditor to use mapped help prompts or translated placeholders populated from current input assignments. Update English keys and French translations together.
- **Confidence:** medium — the textual conflict is certain; active use or caller-side transformation cannot be established here.

## Upstream fit

- **Separate the persistence/security work from presentation changes.** Atomic configuration replacement, recovery, lock interoperability, notification layout, image transforms, networking, translation expansion, and test-framework vendoring are independently reviewable changes. Combining them makes the failure-sensitive persistence changes harder to review and backport. S1 shows all of these in one packet; commit organization itself is not available.
- **The settings lock is a cross-repository protocol.** The hardcoded `/tmp/.system.cfg.lock` and comments promising compatibility with shell settings functions are not self-contained core implementation details. F-ES-02 and F-ES-06 require agreement with the distribution-side writer, not an ES-only patch.
- **Keep generic UI policy out of a cloud-specific application dependency where practical.** `AsyncNotificationComponent.cpp` now includes `../../es-app/src/CloudText.h` for a generic text-fitting operation. A shared pure utility is a cleaner boundary. Similarly, `WebImageComponent` now knows the offline-achievements proxy’s request policy; a caller-supplied policy would reduce service-specific behavior in the generic component. These are architectural objections, not asserted build failures. [S1]
- **Do not advertise platform-independent atomicity yet.** The Windows branch needs its own implementation and validation, rather than inheriting the POSIX helper’s contract. [F-ES-05]
- **Confirm vendored licensing and test integration.** The new doctest header references the MIT license, but an accompanying license artifact and the unit-test CMake body are outside this packet. Their absence from this packet is not proof they are absent from the repository.
- **No literal production credential is demonstrated in the additions.** That does not resolve the dynamic logging and configuration-permission findings. Likewise, the audit’s `/workspace/...` provenance paths should not be confused with paths introduced into the shipped program.

## Coverage boundary

This review used the embedded text only. The Facilitator’s hashes were accepted as supplied; I did not re-read or re-hash any file. Failure scenarios above are static counterexamples or proposed tests, not reports of executed tests.

The following gaps need to be handed back to the orchestrator:

1. **Distribution-side configuration and backup behavior.** The shell lock implementation, boot-time recovery, settings writers, and archive filtering are outside the packet. In particular, the new `.backup` files contain the same bytes as their live configurations: the backup/security auditor must verify that these copies cannot bypass credential exclusion or sanitization during archival.
2. **Full component implementations and application callers.** The packet does not establish notification destruction/locking behavior, all resize lifecycles, or the complete text/image resource behavior. `CloudText`, the `OfflineProxyUrl` implementation, relevant request callers, and the unit-test build/test bodies are outside the packet. No deadlock, link success, or complete timeout coverage is inferred from their names.
3. **Upgrade and clean-install proof.** Required fixtures include the legacy complete `.tmp` plus damaged live file, missing/invalid backups, restricted file modes, symlinked configuration paths, and pre-existing zero-byte web-image caches. The new empty-download handling alone does not establish that previously cached empty images are invalidated. Existing persisted `HideWindow` values also need an upgrade check. These follow S3’s inherited-state requirements.
4. **Runtime and packaging proof.** No Linux or Windows build, gettext extraction/catalog validation, concurrency/fault-injection run, or device rendering was supplied. The shared UI changes need 640×480 English/French frames and input checks, including changed control mappings. Network checks should include loss of the physical link while VPN interfaces retain addresses. S4–S6 supply standards, not execution evidence.
5. **Remaining project-conformance sources.** The blindspot register required by S2 was not embedded. The referenced `es-native-ui.md`, `player-language.md`, and `least-surprise.md` were also not embedded. Full conformance to those documents cannot be claimed.

### `corpus.provenance.json`

Provided inline; no filesystem artifact was written. Citation IDs, paths, and hashes are index-aligned.

```json
{
  "bucket": "8b-es-core",
  "access_mode": "embedded source corpus",
  "filesystem_access": false,
  "tests_executed": false,
  "independent_rehash_performed": false,
  "hash_algorithm": "sha256",
  "hash_verification": "Verified by the Council Facilitator at embed time; accepted as supplied, not independently recomputed by this auditor.",
  "citation_ids": [
    "S1",
    "S2",
    "S3",
    "S4",
    "S5",
    "S6"
  ],
  "source_file_paths": [
    "/workspace/repos/rocknix/docs/audits/2026_09_25-milestone-rc-round-since-258/seats/8b-es-core.diff",
    "/workspace/repos/rocknix/.claude/skills/code-auditor/references/anti-patterns.md",
    "/workspace/repos/rocknix/.claude/rules/upgrade-and-install.md",
    "/workspace/repos/rocknix/.claude/rules/es-player-text.md",
    "/workspace/repos/rocknix/.claude/rules/es-code-traps.md",
    "/workspace/repos/rocknix/.claude/rules/es-ui-style-guide.md"
  ],
  "source_file_hashes": [
    "1e467503a63d1cd6d39e90f7a44f860fda0010ff82043c732b36448753571f16",
    "fd825c0505ae772ca2a6651eefe642581aaa147c254fed8cf50db1f8f1bde678",
    "de4a683f9a36f9100e6fd98be11ad84d736f370374c40f74c445a2b81eca1995",
    "97c0816eabd3088ce94e3d45dec8042c1796afa3c295a9a8d080597ece817145",
    "9d5d6995714c9a1287c84f0c02a92de244271a4bdad8e53d29bb61115ba51d0f",
    "150d0ac637626d771871eab48db995d8fc46c69ed7cf786240213649d264ad02"
  ],
  "missing_sources": [
    "Distribution-side settings-lock, configuration-writer, boot-recovery, and backup-filter implementations.",
    "Full component implementations, application callers, CloudText implementation, OfflineProxyUrl implementation, and unit-test build/test bodies outside the supplied hunks.",
    "Build logs, gettext validation, concurrency and fault-injection results, upgrade fixtures/results, and device-rendering evidence.",
    "The blindspot register and the referenced es-native-ui.md, player-language.md, and least-surprise.md documents.",
    "Vendored-license coverage outside the added doctest header."
  ],
  "gap_handling": "Gaps are surfaced in Coverage boundary. No missing artifact contents, hashes, or filesystem paths were fabricated."
}
```