# E-tests audit

**Verdict: withhold unqualified evidence sign-off.** Most named regression tests are present and can reject meaningful regressions. However, the credential guards still have fail-open paths, the credential-quoting checker accepts an ordinary unquoted expression, and several tests do not observe the invariant their names claim to prove.

This is a **static review of the embedded corpus only**. I did not run tests, inspect a checkout, or recompute hashes. Historical FAIL/PASS results remain the streams’ reported results, not independently reproduced observations.

Citations **D**, **R1**, **R2**, and **EP** resolve to the exact source paths and Facilitator-verified hashes in `corpus.provenance.json` below. Nested filenames identify locations **inside D**, not additional files I read.

## Findings

### G2-E-tests-01: Credential scans still pass when their scanning pipeline fails

- **Severity:** High
- **Category:** Guard fails open; new pre-commit guard and incomplete pre-push hardening
- **Where:** D — `.githooks/pre-commit`, `@@ -0,0 +1,23 @@`; `.githooks/pre-push`, `@@ -86,14 +125,27 @@`.
- **What:** The nonempty-pattern check does not establish that matching and redaction succeeded. Both hooks collect `hits` through a pipeline ending in `head -5 || true`. Pre-commit additionally does not check whether `git diff --cached` succeeded.
- **Failure scenario:** Give the hook a readable pattern file containing the nonempty but invalid expression `SECRET_PATTERNS='['`, then stage a credential-shaped addition. `grep` and `sed` fail without producing matching stdout; `hits` is empty; the complete pre-commit script reaches `exit 0`. Likewise, an unavailable or failing pipeline utility can turn an unperformed scan into an empty result.
- **Evidence:** The refusal condition is only `[ -n "${hits}" ]`. The explicit `git log` failure check in pre-push is a useful improvement, but protects the producer—not the subsequent scanner. I looked for validation of the expression and discrimination between grep’s “no match” and “error” statuses; neither is present. The existing missing-pattern test covers absence, not this failure mode. This violates EP, **“Guards must fail closed.”**

A repair must distinguish legitimate no-match results from scanner errors; merely adding blanket `pipefail` around the existing grep/head pipeline needs care about normal grep status 1 and truncation-induced SIGPIPE.

### G2-E-tests-02: The upstream-base lookup trusts a repository-path suffix on any host

- **Severity:** Medium
- **Category:** Incorrect trust-boundary check
- **Where:** D — `.githooks/pre-push`, `@@ -57,10 +69,21 @@`, the `git remote get-url` case statement.
- **What:** The replacement for the unsafe `origin/master` fallback does not actually identify the promised ROCKNIX GitHub repository. It accepts any URL ending in the matching repository path.
- **Failure scenario:** A remote has URL `https://example.invalid/ROCKNIX/emulationstation-next.git`, and its local tracking `master` points to fork history already containing `CLAUDE.md`. A `pr/*` branch cut from that history can have an empty personal-path difference against the selected base. The guard has reinstated the same contaminated-base problem F-PB-18 was meant to prevent.
- **Evidence:** Accepted patterns begin with unrestricted `*`, such as `*[/:]rocknix/emulationstation-next.git`; there is no host check before assigning `base_ref` and breaking. The scratch tests check official-looking GitHub URLs, case variation, and a fork remote whose URL does not match this suffix. They do not test a non-upstream host with the same path. No explicit trusted-mirror policy is embedded that would justify this broader acceptance. [D; R1, F-PB-18 and follow-up G-E1-08]

### G2-E-tests-03: The new app-unit project cannot configure with its declared minimum CMake

- **Severity:** Low
- **Category:** Build compatibility; newly introduced harness defect
- **Where:** D — `tests/app-unit/CMakeLists.txt`, `@@ -0,0 +1,106 @@`.
- **What:** The project declares CMake 3.10 but unconditionally uses `add_link_options`, introduced in CMake 3.13.
- **Failure scenario:** Configure this project with CMake 3.10–3.12. Configuration fails at the unknown command, before any advertised app-unit binary can be built.
- **Evidence:** Both `cmake_minimum_required(VERSION 3.10)` and `add_link_options(-fsanitize=address,undefined)` are visible in the complete new file. There is no version guard or compatibility alternative. The reported successful builds do not establish compatibility with the declared minimum. [D; R2, harness descriptions]

### G2-E-tests-04: Parenthesizing an unquoted credential operand defeats the quoting checker

- **Severity:** Medium
- **Category:** Security-check false negative; incomplete fix
- **Where:** D — `tests/credential-quoting.py`, the `OPERAND` definition and `@@ -81,7 +111,58 @@`.
- **What:** The classifier treats an operand it does not recognize as though there were nothing unsafe to inspect.
- **Failure scenario:** A credential call site uses:
  ```cpp
  "setrootpass " + (pass)
  ```
  This still sends the player’s value to the shell unquoted. But `OPERAND` requires an identifier immediately after `+` and whitespace. The opening parenthesis prevents a match, so `bare_operands` returns an empty list.
- **Evidence:** The pattern is `\+\s*([A-Za-z_][\w:]*)\s*(\(?)`. The new function only iterates its matches; it has no rejection for unclassified concatenation operands. The nine self-tests cover `std::string(pass)` but no parenthesized value or conditional expression. I looked for a second completeness check over the expression and found none. Thus the reported fix closes its two demonstrated constructor cases, not the general unquoted-operand hole. [D; R2, d388c2800 / 8b gpt F-ES-10]

### G2-E-tests-05: The bounded-child helper can report success without running its fixture

- **Severity:** Medium
- **Category:** Test infrastructure fails open
- **Where:** D — `es-app/tests/unit/AtomicFileTests.cpp`, `@@ -0,0 +1,953 @@`, `inChildWithin` and its lock-budget callers.
- **What:** Neither process creation nor `waitpid` success is checked. An unchanged zero-initialized status is decoded as a successful child exit.
- **Failure scenario:** In a directory-lock or unopenable-reap-guard case, `fork()` fails with `EAGAIN`, and `waitpid(-1, ...)` returns `ECHILD`. `status` remains zero; `WIFEXITED(status)` and `WEXITSTATUS(status)` yield a successful result. The lock remains untouched and elapsed time is short, so the assertions can pass although `PidLock::acquire` never ran. An interrupted `waitpid` is another unhandled route.
- **Evidence:** The helper initializes `int status = 0`, calls `waitpid(pid, &status, 0)` without inspecting its return, and then decodes `status`. There is no `pid > 0` requirement, EINTR retry, or successful-reap assertion. The child’s `alarm` cannot protect a child that was never created. [D; R1, F-ES-07 and GPT G-E1-01/02]

### G2-E-tests-06: The AppWindow test does not prove that closing waits for an in-progress post

- **Severity:** Medium
- **Category:** Incomplete lifetime-test oracle
- **Where:** D — `tests/app-unit/AppWindowTests.cpp`, `@@ -0,0 +1,46 @@`.
- **What:** The test observes posts **starting** after `gone`, but not posts still executing when closing returns.
- **Failure scenario:** Mutate `closing()` so it prevents new posts but does not wait for a current post. A worker has already entered `FakeWindow::postToUiThread`, checked `gone == false`, and is sleeping. Closing returns; the test marks the window gone; the old post then completes. All current assertions can pass, although that completion would use an already-destroyed real window.
- **Evidence:** The only `gone` check occurs **before** the 200 μs delay. There is no completion-after-destruction check, no assertion that the post count stays unchanged after closing returns, and no barrier establishing an in-flight call at closure. The final `CHECK_FALSE(AppWindow::post(...))` proves rejection of later calls, not quiescence. The test’s opening comment and R2’s F-ES-26 claim explicitly include waiting for the active post. [D; R2, 5443b5301]

### G2-E-tests-07: PL-024’s test can conceal a write made while the lock is busy

- **Severity:** Medium
- **Category:** Claimed no-write invariant is not observed
- **Where:** D — `es-app/tests/unit/AtomicFileTests.cpp`, the case beginning `"a save that cannot get the lock writes nothing..."`.
- **What:** The final file and return-code checks do not establish the first half of the case’s claim: that the refused save wrote nothing.
- **Failure scenario:** Mutate `saveUnderLock` to write the changed file despite failing acquisition, but still return `LockedSave::LockBusy`. The other writer has already prepared its temporary and later renames it over that premature write. The test then retries `setA`, producing the expected final `a=2` and `b=2`. All current assertions can pass.
- **Evidence:** The other writer prepares `path + ".tmp"` before signalling readiness. After the first save, the parent waits for that writer to finish before inspecting the final contents. There is no intermediate artifact check or assertion that the transform/write path was never entered on `LockBusy`. The original “returns Written and overwrites” defect can fail this test, but the stronger no-write claim is not fully guarded. [D; R1, PL-024]

### G2-E-tests-08: The deferred-state refresh proof depends on allocator address reuse

- **Severity:** Medium
- **Category:** Allocator-dependent test oracle
- **Where:** D — `tests/launch-deferred-state.py`, `@@ -0,0 +1,155 @@`, fake repository `refresh()` and the first result comparison.
- **What:** The refresh subcase uses address equality to distinguish a newly resolved object from a deleted object, while allowing the allocator to reuse that same address immediately.
- **Failure scenario:** A partial implementation keeps a stale pointer when the named state still exists, but correctly clears it when the file was deleted. If refreshing reallocates that state at the old address, the first comparison reports that the launch used the current object; the deletion subcase also passes. The refresh-lifetime defect remains undetected.
- **Evidence:** `refresh()` calls `states.clear()` and immediately allocates replacement `SaveState` objects. The assertion compares only the returned pointer with `states[1].get()`. The script explicitly avoids ASan, and there is no retired-object quarantine or generation identity. This does **not** mean the entire driver cannot reject a complete old-code reversion—the deleted-state case can. It means the claimed refresh-specific proof is allocator-dependent. [D; R2, bcbe0cf88 / F-ES-11]

### G2-E-tests-09: The emitter table is a snapshot, not the advertised protocol-drift guard

- **Severity:** Medium
- **Category:** Test scope overclaim; missing cross-repository contract check
- **Where:** D — `es-app/tests/unit/CloudTextTests.cpp`, the emitter-table comment and hunks beginning `@@ -513,35 +631,68 @@` and `@@ -553,6 +704,55 @@`.
- **What:** The test checks manually listed examples against the parser and translation table. It does not establish that the examples include every current emitter.
- **Failure scenario:** An emitter gains a new `>>> why` sentence or protocol marker without updating this static table. None of this test’s inputs change, so it remains green while the interface may lack the corresponding translation or classification.
- **Evidence:** `shapes[]` is a literal array. The test iterates only that array. The additional `sentences.size() >= 32` check is a floor, not a comparison with the emitters. There is no script read, generated-fixture verification, or emitter-set comparison in this test. The comment that adding an unrecognized marker to a script “fails this case” is therefore not true without a separate regeneration step. R2’s manually regenerated table and its reported 14 failures are useful snapshot evidence, but do not supply that missing drift mechanism. [D; R1, F-CS-28/31; R2, Follow-up 2]

### G2-E-tests-10: The new scanner fixture contradicts the runtime-only fixture rule

- **Severity:** Low
- **Category:** Explicit engineering-rule violation
- **Where:** D — `.githooks/pre-push-test`, `FAKE` assignment; matching exemptions in `.githooks/pre-commit` and `.githooks/pre-push`.
- **What:** The new fixture stores a credential-shaped value literally, then exempts that source line from both credential guards.
- **Failure scenario:** A credential-shaped addition on the exempt `FAKE="..."` line is accepted by construction rather than scanned. Removing the exception later also encounters the literal in the history these guards examine.
- **Evidence:** The fixture’s comment identifies its value as credential-shaped, and both hooks explicitly discard the matching `FAKE` line. EP says scanner fixtures are assembled at runtime, **“never written as a literal.”** This exception is deliberate and documented, but no exception to that supplied rule is recorded. The shown value is explicitly fake; I am not alleging an exposed real credential. [D; EP, “Guards must fail closed”]

## Suite and driver inventory, with claim correspondence

**Reading this ledger:** “Matches” means the described scenario and an appropriate rejecting assertion are visible. It does **not** certify the historical FAIL/PASS execution. “Partial” identifies a narrower proof than the surrounding application-level claim.

All implementation boundaries below follow the build/harness code in D. R1 and R2 supply the claim identifiers.

### Pure suite: `es-app/tests/unit/`

These tests link production pure functions or headers, rather than replacement implementations. They generally do **not** compile the GUI/application caller that chooses when to invoke those functions.

| File / test family | Report claim and correspondence | Meaningful mutation rejected; boundary |
|---|---|---|
| `CaptureRotationTextTests.cpp` | R2 F-ES-08 and GPT G-E2-06: **matches the text/trust policy**. | Trust `from=own-launch` again, or allow a record without the launch banner. Does not exercise actual log-age checking, file persistence, or the table fallback at the application call site. |
| `CheevosRetryTests.cpp` | R2 F-RA-19: **matches the extracted decision rule**. | Return `Now` for an unchanged enabled page with no token. Does not establish that `NetworkThread` receives the request or that closing the real page is nonblocking. |
| `CloudTextTests.cpp` — numeric stamps and tier codes | R1 F-CS-27: **matches**. | Restore `atoi`-style acceptance of `garbage`, `0x0`, trailing junk, or overflowing codes. |
| `CloudTextTests.cpp` — `cleanLine` | R1 F-CS-19 and Claude G-E1-07: **matches**. | Strip non-ASCII bytes, or terminate all escapes at the first alphabetic byte. UTF-8, OSC, CSI, two-byte escape, and lone-ESC cases are present. |
| `CloudTextTests.cpp` — action candidates | R1 PL-072: **matches candidate construction**. | Drop the in-place clause from the shortest partial-transfer candidate. Does not show which candidate the real card chooses or whether it fits a real panel. |
| `CloudTextTests.cpp` — emitter/why tables | R1 F-CS-28/31; R2 Follow-up 2: **matches the supplied snapshot, not completeness**. | Remove a listed why from the translation table or change one paired spelling. Adding an unlisted emitter does not fail it: finding 09. `_()` returns English here; French catalog/runtime behavior is not exercised. |
| `CloudTextTests.cpp` — script stamp names and stopped parts | R2 F-CS-05/23; R1 Claude G-E1-04 and GPT G-E1-06: **matches the pure selection policy**. | Omit settings stamps, restamp a completed part, accept an earlier ES token, or ignore unchanged versions after clock rollback. Stamp text/version values are supplied data; real inode/mtime capture is not exercised. |
| `CloudTextTests.cpp` — scan/top-up whys, match notes/recovery, unit labels | R2 cb32a0481, GPT F-CS-26, Claude G-E2-08(c): **matches the text helpers**. | Return generic wording for the image token, restore the false cloud-retention sentence, or omit a listed composed label. Real page retry-button suppression and translation rendering remain outside this suite. |
| `CommandLineTests.cpp` | R1 F-CS-33: **matches**. | Revert to substring/rfind replacement and rewrite `--core=` inside a quoted or escaped ROM name. Does not call `SaveState::setupSaveState`. |
| `DisplayAspectTextTests.cpp` | R2 8a GPT F-ES-21: **matches**. | Treat the final dot in an extensionless content name as an image extension. |
| `LaunchCommandTests.cpp` | R2 F-ES-20: **matches the header tests**. | Read prefixes inside the quoted nick or escaped ROM word; fail to read a rewritten core. `runemu()` is a local model of the shell expansion—not execution of `runemu.sh`. |
| `MaskSecretsTests.cpp` | R1 8b F-ES-09 and follow-up Coverage 6: **matches**. | Stop a value at a quoted/bare word boundary, or fail to mask an inner quoted value in `sh -c`. Both the original whole-word cases and the reported regression’s nested-quote cases are present. |
| `OfflineAchievementsTextTests.cpp` | R2 435a506b5 / PL-057 interface side: **matches parsing**. | Interpret explicit null unlock counts as known zero. Does not verify the proxy emits null or the GUI suppresses the progress bar. |
| `TabStopsTests.cpp` | R1 8b F-ES-11: **matches the width rule**. | Calculate a later stop from each row’s unaligned prefix rather than cumulative column maxima. Real glyph measurement and `Font` integration are absent. |
| `WifiTextTests.cpp` — availability, press action, join result and toast | R1 F-WF-03/05/06/08; R2 c0def453a: **matches pure policy**. | Turn an unanswered saved list into “unsaved,” skip joining the connected row, or treat service exit 2 as bad-key advice. No `wifictl` process or `GuiWifi` is run. |
| `WifiTextTests.cpp` — profile identity | R2 F-WF-12 / GPT F-WF-03: **matches the supplied cases**. | Join the connected SSID instead of its uniquely identified active profile, or guess when two active profiles are ambiguous. Inactive renamed profiles remain outside the available protocol, as R2 acknowledges. |
| `WifiTextTests.cpp` — `JoinAnswer` | R2 Claude G-E2-01: **matches the type-level guard**. | Add an implicit or explicit conversion to bool. The static assertions reject it. They do not independently establish `ApiSystem`’s declared return type or enumerate its callers. |

### File suite: `es-app/tests/unit/AtomicFileTests.cpp`

CMake links the production `AtomicFileUtil.cpp` directly. The tests use real scratch files, locks, threads, and child processes; higher-level `SystemConf` and `Settings` are not linked.

| Family | Report claim and correspondence | Meaningful mutation rejected; boundary |
|---|---|---|
| Concurrent whole-file writes | R1 PL-063: **matches the stress scenario**. | Restore the shared truncating temporary. The observed failure is schedule-dependent; this is stress evidence, not a controlled interleaving proof. |
| File/backup/copy permissions | R1 8b F-ES-08: **matches**. | Recreate a private replacement or backup with mode 0644. The test also checks tightening an existing permissive backup. |
| Read failures | R1 PL-065 and follow-up mid-file fixture: **matches**. | Mark an opened-but-failed read successful, or return its prefix. The added interposer checks that its second-read failure was actually reached—an important positive control. |
| PID publication and stale reaping | R1 PL-041: **matches C++-side stress tests**. | Publish an empty lock or let multiple stale reapers remove a replacement lock. The tests do not run the shell implementation of `wait_lock`. |
| Lock/reap budgets and inaccessible guard | R1 F-ES-07 and GPT G-E1-01/02: **scenario present; harness flaw in finding 05**. | Use blocking flock or reap without acquiring the guard. The elapsed-time threshold is substantially looser than the requested 300 ms budget; it chiefly detects hangs/large overruns. |
| Locked save | R1 PL-024: **partial**. | Returning `Written` after acquisition failure is caught. No-write and actual retention of `SystemConf` dirty state are not fully established: finding 07; the retry is performed manually by the test. |
| Configuration selection and recovery mode | R1 PL-064; truncation/backup/privacy follow-ups: **matches helper selection**. | Prefer a cut live prefix over its eligible whole backup, record an incomplete input, or select mode 0644 from a private temporary. These inspect `LoadedConfig` and the save helper, not a real boot/recovery through `SystemConf`. |
| Pending changes and parsing | R1 GPT G-E1-03: **matches the merge policy**. | Return no retained changes, or retain the Wi-Fi value after the file changed beneath it. Actual reload call-site flags are outside the test. |
| Transfer flock probe | R1 PL-068: **matches the low-level probe**. | Use file existence instead of flock ownership. The test proves the lingering lock file is not itself a held lock. |
| Thread resources and source guard | R1 PL-069 and both follow-up coverage findings: **partial but accurately narrowed by the follow-up**. | Restore the named leaking source shape; the lexical guard rejects it. The resource test compares thread patterns, not `ThreadedCloudSync` execution. Neither proves real card/window lifetime safety. |

**`AtomicFileWin32Tests.cpp`:** Both reported cases are present. Returning `ok=false` for an empty file or failing the second replacement rejects the tested behavior. This is a **Linux-host execution of an `_WIN32`-selected object**, not a native Windows build/runtime test. Standard-library and rename semantics can differ by host. R1’s later branch-test claim is supportable at that narrower boundary; it does not turn the earlier POSIX-only guarantee into a Windows proof.

The file fixtures also use Linux `/proc` and `SYS_read`; “POSIX only” should not be interpreted as demonstrated portability across all POSIX hosts.

### Application project: `tests/app-unit/`

| File / binary | What is real versus replaced | Claim correspondence and rejecting mutation |
|---|---|---|
| `FolderMergeTests.cpp` / `app-unit-tests` | Production template; plain `Node` tree and adapter replace `FolderData`, collections, indexes and views. | R2 PL-014: **matches identity-preserving merge policy**. Delete/recreate unchanged nodes and pointer-preservation checks fail. Does not prove real collection/index/view cleanup. |
| `JourneyTiersTests.cpp` | Production header; persistence callbacks are in-memory doubles. | R2 PL-029 and GPT G-E2-01/02: **matches record/command policy**. Continue everything for saves-only, accept an incomplete record, or leave the old record when a replacement write fails. Does not exercise actual settings-first restart sequencing. |
| `RunLockTests.cpp` | Production header; real files and processes holding flock. | R2 F-RA-08 / GPT F-RA-16: **matches the demonstrated stale-PID case**. Ignore lock ownership and the live PID in an unheld file is wrongly returned. Actual ctl process identity/signalling is not exercised. |
| `TextFitTests.cpp` | Production header; fixed-advance fake font. | R2 F-RA-23/F-CS-32: **matches character-boundary protection**. Byte-wise shortening fails checks on strings supplied to the measurer. Does not validate real font widths or frames. |
| `AppWindowTests.cpp` | Production header; fake window. | R2 F-ES-26: **partial**. Removing rejection after closure fails; removing the in-progress wait need not: finding 06. |
| `ProxyCardsTests.cpp` / `proxycards-tests` | Configured copy of shipped `ProxyCards.cpp`; real text helpers; fake Window, card, ctl, stamp and settings interfaces. | R2 PL-054/056, F-RA-09/17, queued-top-up follow-up: **named scenarios are present**. Always claim “sent,” spawn two watchers, reuse the clearly old failure stamp, or launch the queued run before the game: assertions reject these. Persistence and actual UI ownership are not tested. |
| `BookkeeperTests.cpp` / `bookkeeper-tests` | Configured shipped `.cpp`, real queue/AtomicFile code and flock; script execution is a double; removal touches real scratch state files. | R2 PL-068 progression: **matches held, unavailable and held-through-operation lock cases**. Delete while externally locked, treat ELOOP as free, or release the lock before the script callback. The external `flock -n` probe is stronger than a mere “lock was checked” assertion. Actual `cloud_capture` is not run. |
| `JobsTests.cpp` / `jobs-tests` | Configured shipped job sources; real commands/process behavior; fake Window and `ThreadedCloudSync` stamp interface. | R2 F-CS-24/Claude F-CS-26, late-stop G-E2-05, O2, scan-post follow-up: **cases are present**. Drop the deferred stop, mark a completed job stopped, snapshot after the marker command, or bypass `AppWindow`. The before-PID seam is retried rather than deterministically injected; the real stamp reader is replaced. |

The app-unit build’s `configure_file(... COPYONLY)` wiring is a genuine strength: the production `.cpp` inputs are named, and the reason for moving them to select fake quoted includes is explicit. These are not silently hand-maintained copies of the implementation. That does not make the replaced interfaces faithful substitutes for all production lifetime and threading behavior.

### Python drivers: `tests/`

| Driver | Exercised boundary | Claim correspondence and rejecting mutation |
|---|---|---|
| `cloud-folder-reopen.py` | Source-text checks only; no compiled menu. | R2 O1: **matches the stated structural check**. Change the reopen to `false` or omit the cursor flag and it fails. Focus, scrolling, and frame contents remain the VM proof. |
| `cloud-gated-row.py` | Extracted shipped function; fake settings, row, dialog, and configuration-existence flag. | R2 PL-062: **matches rechecking at press**. Keep the original captured “not configured” decision and `ran` stays zero after setup. No real setup/config file is created. Initial dimming is not itself positively asserted. |
| `cloud-oauth-await.py` | Extracted function with polling sleep replaced; scripted command-output lines. | R2 8a F-ES-18: **matches**. Fall back to the old URL despite `STATUS=failed` and the failure case rejects it. Does not test a real listener or polling-time bound. |
| `cloud-oauth-lifetime.py` | Modified harness around extracted helpers and fake pages; only changed portions are supplied. | R2 8a F-ES-17: **partial**. Removing ownership/cancellation behavior fails the new cancel-count checks. But the fake `cloudOAuthShowSignIn` installs `cloudOAuthOwnSession(page)` itself, so removing that registration from the real page builder is not guarded by this substitute. |
| `cloud-set-systems-quoting.py` | Extracted quote/command functions; real `/bin/sh`; scratch recording script. | R2 PL-030: **matches the C++ quoting proof**. Revert to unsafe interpolation and the marker or exact argument check fails. Script-side name validation is outside this driver. |
| `cloud-sync-last-run.py` | Extracted selector/formatter; fake stamp map. | R2 8a F-ES-16: **matches manual-versus-exit example**. Read only the manual stamp and stale failure text appears. Startup-route selection and real stamp parsing are not directly exercised. |
| `credential-quoting.py` | Static source classifier plus nine self-tests. | R2 8b F-ES-10: **matches the two constructor regressions, incomplete overall**. Restore unconditional trust in `std::string(...)` and self-tests fail. Parenthesized operands bypass it: finding 04. |
| `hasher-offline-index.py` | Extracted constructor/destructor; stand-in class and no-op worker. | R2 F-RA-05: **matches offline count/card/toast decisions**. Leave `mTotal` nonzero and the assertions fail. The real worker’s self-deletion/start lifecycle is not executed. |
| `launch-capture-gate.py` | Extracted gate; supplied globals, age function, spinner and launch doubles. | R2 PL-061 and latest capture follow-ups: **matches the current gate policy**. Launch at the ten-second bound or increment exit generation before success and checks fail. The actual capture worker, call order among launch gates, and production age constant are outside this extraction. |
| `launch-deferred-state.py` | Extracted remember/launch helpers; fake repository, window queue and view controller. | R2 F-ES-11: **partial**. Forward a deleted state instead of null and it fails; the refresh-identity subcase has finding 08. The harness calls `rememberSaveState` itself, not through the real launch entry. |
| `maintenance-why.py` | Extracted pure selector. | R2 F-ES-13: **matches**. Always choose the last tool line and `"tar: short read"` wins incorrectly. No maintenance command, dialog, or translation is run. |

### Hooks, build files and README

- **`.githooks/pre-push-test`:** The reported root-secret, rename, unknown-tip, second-remote, personal-path, binary, URL-case, fixture-exemption and missing-pattern scenarios are present. Reinstating the old range selection or AM-only filter can fail the relevant cases. It is a real scratch-repository test invoking the real hook.
  - Its “clean root commit, first push” control first seeds `refs/remotes/origin/clean` with that root. Under the new destination-specific exclusion, that invocation scans **zero commits**. It is not an unseeded clean-root/clean-new-remote control.
  - A nonzero hook exit is generally accepted as refusal without checking the reason. Allowed controls provide some protection against a universally broken hook.
- **`.githooks/pre-commit`:** No driver in this packet invokes it. Replacing this new hook with `exit 0` would not change `.githooks/pre-push-test`.
- **`.githooks/secret-patterns`:** Both hooks are visibly wired to the shared definition. The hook fixtures predominantly prove the `devpassword` arm, not every credential-pattern alternative.
- **Both CMake projects:** The added source files and targets are wired visibly. The app-unit minimum-version defect is finding 03. No aggregate runner/CI dispatch is embedded, so I cannot certify that release automation actually executes every binary, Python driver and hook test.
- **`README.md`:** The source-list-as-record change supports F-ES-29 and avoids stale counts. Its generalized description of `tests/*.py` as extraction/compile drivers is broader than reality: the credential checker and folder-reopen check are static checks.

## Reconciliation of the reports’ FAIL-then-PASS claims

The ledger above locates the named regression scenarios. I found **no missing named regression family** among the local tests referenced by the reports, subject to the partial old-file diff for `cloud-oauth-lifetime.py`.

Important qualifications:

1. **The first sections are not the final state.**
   - R1’s initial “mid-file EIO unproven” is superseded by the visible second-read interposer.
   - R1’s initial lack of a Windows-branch test is superseded by the `_WIN32`-selected host object, within the limited boundary described above.
   - R2’s initial capture policy—launch at the bound—is superseded by the visible refusal/retry assertions.
   - The later journey-record, queued-top-up, late-stop, deletion-lock and pre-command-snapshot cases are present. [R1, follow-up; R2, Follow-up 4; D]

2. **A reported old-behavior failure is not necessarily an original-component failure.** R1 explicitly distinguishes faithful extractions from untouched originals. R2 later acknowledges stand-ins for the prior FolderMerge/captureGate/AppWindow behavior. The test code is consistent with those narrower descriptions. The old implementations and execution logs needed to establish extraction fidelity are not embedded.

3. **Visible case declarations support the latest new-suite counts.** The new files assemble to 21 file cases, 2 `_WIN32` branch cases, 18 app-unit cases, 7 proxy-card cases, 5 bookkeeper cases and 6 job cases, matching R2’s latest report. This does not verify their execution, assertion totals, sanitizer cleanliness, or the 170-case pure suite whose unchanged contents are not all supplied.

4. **Some application claims remain intentionally outside these tests:** the real rescan soak; boot-time recovery; `SystemConf` dirty-state retention across actual reloads; COPY/DELETE UI behavior; the real hash fetch’s responsiveness; actual thread/card teardown; translation rendering; and all named VM frames. A helper PASS does not close these report handoff items.

## Sweep-row spot checks

At least these fixed rows were checked against their actual test assertions:

| Sweep row | Result |
|---|---|
| **5-cloud GPT F-CS-27** | Good direct coverage of malformed numeric stamps/tier codes; not merely a success count. |
| **5-cloud GPT F-CS-33** | Good quoted/escaped-ROM counterexamples for option replacement; application invocation remains outside the suite. |
| **8b GPT F-ES-09** | Whole-shell-word and nested quoted-command regressions are both represented. |
| **8b GPT F-ES-11** | The two-row/two-column example directly rejects the old unaligned-stop calculation. |
| **8b GPT F-ES-10** | The `std::string(value)` regression is represented, but the checker still has finding 04. |
| **8a GPT F-ES-18** | A failed listener with a stale URL is explicitly refused; older-script fallback remains a positive control. |
| **8-es Claude F-ES-20** | Nick/ROM token boundaries and save-state rewrite are checked. The launcher comparison is a model, not the launcher itself. |
| **1-raoffline GPT F-RA-23 / 5-cloud GPT F-CS-32** | Strings handed to the fake font are checked for complete UTF-8 code units, not just the final output. |
| **10-packages GPT F-PB-18/19** | Fork-base and `build-tests/` cases exist; the URL trust test is still too broad, finding 02. |
| **5-cloud GPT F-CS-31** | Listed why-pair agreement is checked. Current emitter completeness and actual French translation are not, finding 09. |

### Withdrawals that can—and cannot—be judged here

- **F-CS-03 as a duplicate of PL-069:** The shared thread-leak mechanism and test coverage support treating these as the same test obligation. This does not strengthen the mechanism/source guard into a real-component lifecycle proof. [R1; D]
- **Claude G-E2-09(c), qualification of stand-in “before” tests:** The qualification is appropriate to the harness boundaries visible here. Historical fidelity itself cannot be independently verified. [R2; D]
- **The old bool/int join concern:** The new `JoinAnswer` assertions establish a useful type-level guard. The claims that there is exactly one caller and that it uses the returned type correctly require `ApiSystem`/`GuiWifi` source, absent here. [R1; R2; D]
- **Withdrawals based on `populateFolder` behavior, temporary save-state ownership, finalizer registration, fixed notification width, or existing French catalog entries:** Not adjudicable from these doubles and test assertions. The real callees/catalog are not embedded.
- **Withdrawals based on D-UI-093, D-INFRA-010 or other nonembedded design rules:** I cannot validate the policy justification by repeating the report’s summary of those rules.

## Cross-stream seams

| Seam | Assumptions on both sides | Evidence verdict |
|---|---|---|
| **Shared app harness ↔ production components** | The configured production sources must see compatible doubles; fake immediate posts must stand in for a queued real UI. | Build wiring is explicit. Immediate callbacks cannot prove queued-callback lifetime or real component ownership. |
| **Cloud emitters ↔ parser/translations** | Marker spelling, delimiters, numeric status ranges, labels and English why keys agree. | Strong supplied-example parsing tests; no live emitter-set comparison. Source snapshot comments are not an automatic agreement check. |
| **Script stop stamps ↔ restamping** | A current run rewrites the stamp; version identity distinguishes it despite clock rollback; ES tokens distinguish already-restamped results. | Pure policy and page snapshot ordering are tested. The real script writer and real `readStamps` inode/mtime implementation are not exercised here. |
| **Proxy ↔ cards** | Flush evidence—not an empty queue—earns the account claim; last-scan state belongs to the current top-up. | Fake stamp/ctl transitions exercise card decisions. Actual persisted stamp formats, same-second/future old stamps, and proxy execution need separate proof. |
| **`wifictl` ↔ picker** | Current/list use SSIDs; saved/join use profile names; exit 2 means service unavailability. | The supplied model is tested, including ambiguity. The script protocol and `ApiSystem` adapter are absent; inactive renamed profiles remain a reported gap. |
| **Shell settings writer ↔ C++ lock/recovery** | Both writers use compatible PID publication and the same `.reap` flock; boot does not discard a recoverable temporary before ES reads it. | Real C++ fixtures plus a shell-shaped competing writer are present. The actual shell reaper and boot service are not. |
| **Transfer scripts ↔ save-state bookkeeper** | The same flock protects transfer and deletion; deletion owns it through retire/unlink. | Real external locking is tested around a fake script callback. Actual script side effects and the real UI COPY path are outside the proof. |
| **Launch command ↔ `runemu.sh`** | Both readers must identify the same shell words. | The test deliberately records a disagreement with a modeled launcher expansion. A green result is not evidence that the two deployed readers now agree. |
| **Rotation records ↔ older devices/VM fixtures** | Old `own-launch` claims are untrusted; new records and fixtures use `checked-launch`. | Text migration policy is directly tested. R2’s requested VM-fixture update and actual fallback behavior need the other packet/artifacts. |
| **Journey record ↔ settings-first restart** | New records name all three tiers; legacy/damaged records take the documented fallback; old records cannot silently stand in for new ones. | Header policy has useful existing-state cases. Disk failure atomicity, marker ordering, and restart continuation are not end-to-end tested. |

## Coverage boundary and requests to the orchestrator

The following are **not certified by this packet**:

- Historical execution of the quoted FAIL/PASS lines, sanitizer results, syntax checks, translation checks, or VM walks.
- The complete unchanged test suites, production callees, external scripts, CI/release runner, or final deployed artifacts.
- Native Windows behavior, general POSIX portability, or absence of data races. The app project enables ASan/UBSan, not TSan.
- Compliance with nonembedded player-text/design/upgrade rules or the actual presence of every commit’s `Already written:` answer.

Two residuals deserve explicit routing rather than being hidden by the green test totals: **the real notification card’s direct calls after window teardown**, and **the blocking hash-library fetch**. R2 reports them as unresolved; this packet provides no evidence settling their status at the requested final tip.

For closure, the orchestrator needs to:
1. Resolve or explicitly accept the guard/build defects and test-oracle gaps above.
2. Obtain fresh run artifacts including constructed scanner failures and fixture failures—not only ordinary green runs.
3. Reconcile the external protocol, lock, migration and VM seams against their actual current implementations.
4. Supply the missing rule corpus before treating this as a vocabulary/design/upgrade-policy sign-off.

## `corpus.provenance.json`

```json
{
  "packet": "E-tests",
  "requested_review_range": "7eae8ed91..87b182fbe",
  "access_mode": "embedded read-at-time corpus only",
  "source_ids": [
    "D",
    "R1",
    "R2",
    "EP"
  ],
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
  "hash_algorithm": "sha256",
  "hash_verification": "Verified at embed time by the Council Facilitator; values copied from the supplied per-source headers.",
  "manifest_read_timestamp_utc_for_all_sources": "2026-09-28T13:57:25Z",
  "auditor_filesystem_access": false,
  "auditor_independent_rehash": false,
  "auditor_test_execution": false,
  "historical_test_results": "Treated as stream claims, not independently reproduced results.",
  "corpus_gaps": [
    "upgrade-and-install.md was named in the brief but was not embedded; no additional path or hash is asserted.",
    "es-player-text.md was named in the brief but was not embedded; vocabulary compliance is not certified.",
    "packaging-and-patches.md and rclone-cloud-sync.md were named in the brief but were not embedded.",
    "Additional ES design/rule files referenced by the reports, and the full manifest contents, were not embedded.",
    "Production implementations, external script emitters, native runtime environments, and raw execution or VM artifacts referenced by the tests and reports were not embedded as independent review sources.",
    "The unified diff does not supply all unchanged portions of existing tests or drivers."
  ],
  "gap_disposition": "Surfaced explicitly to the orchestrator in the audit; no missing source contents, hashes, or observed execution results were fabricated."
}
```