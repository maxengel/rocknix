# Stream C audit

**Verdict: do not close the stream unconditionally.** The diff implements substantial improvements, and most harness assertions target the relevant failure mechanisms. However, the configuration writer and reader have remaining correctness problems, replacement sessions are not fully isolated, and several required upgrade and runtime proofs remain outstanding.

I reviewed the **embedded diff and harness**, not a checkout. I did not execute tests, inspect devices, or independently verify the report’s PASS counts or commit history.

Citations use **D** (diff), **H** (harness), **P** (plan), **R** (report), and **E/U/K/T** (the four rule files). Their exact declared paths and embed-time SHA-256 values are recorded in `corpus.provenance.json` below. Hunk references reproduce the supplied diff headers rather than inventing post-image line numbers.

## 1. Per-punch verdicts

| Item | Verdict | Evidence and limits |
|---|---|---|
| **PL-015** | **holds in part** | The new `syncpath_problem` branch refuses a one-component path, and the setter removes the fallback that made that path its own parent. See **D**, `cloud_setup`, `@@ -168,6 +218,34 @@` and `@@ -377,23 +460,22 @@`. **H/C1** checks refusal, unchanged configuration, and two-level/deeper siblings. However, path depth does not establish that the three destinations are distinct—**G-C-01**. Previously written nested layouts also receive no mitigation in this delivery; the cross-stream safeguard remains unverified. |
| **PL-016** | **holds in part** | `var opened = open && !ready; … if (opened) { sent = ""; deliver(box.value); }` implements the requested transition flush. **D**, `cloud_oauth`, `@@ -901,13 +1056,22 @@`. **H/C4, `typedBeforeOpen`** checks requests generated before and after readiness. It reconstructs a field from requests; it does not establish actual delivery to the window. The guest/window-log acceptance is not embedded. |
| **PL-017** | **holds** for the specified page-model mechanism | Buttons and keyboard events now share `act()`, and Back changes the local value before delivery. **D**, `cloud_oauth`, `@@ -785,34 +892,82 @@`. **H/C4, `backButtonKeepsTheModel` and `namedKeysKeepTheModel`** exercise the actual embedded page script, including `abc`, Back, `d`. This is the script-level test the plan permits. Caret movement, real provider forms, and actual injected input remain outside this proof. |
| **PL-018** | **holds in part** | `signed_in()` calls `gamepad.stop()` before writing the marker; `wait` changes its marker branch from `return` to `break`, reaching the existing settling path. **D**, `@@ -1499,7 +1701,17 @@` and `@@ -1928,12 +2248,13 @@`. **H/C3, `grab_released_before_signed_in`** checks ordering using a FIFO and fake ioctl. The complete `stop()` implementation and the required real SDL/uinput/device fact are not supplied. |
| **PL-047** | **holds** | A failed folder listing returns before any README upload, successful listings are checked for the exact filename, and upload uses `--ignore-existing`. **D**, `cloud_setup`, `@@ -437,28 +519,55 @@`. **H/C2** meaningfully distinguishes failed, empty, and populated listings, including bucket-shaped absence. Its rclone implementation is a shim, not provider evidence. |
| **PL-048** | **holds** for concurrent callers of one session | `_config_lock` serializes the operation, `_config_result` caches its final result, and `configured` is assigned from that result. **D**, `cloud_oauth`, `@@ -318,16 +379,35 @@`. **H/C3, `configured_only_after_verification`** checks both a failed verification and success, plus one creation. This does not isolate different sessions—see **G-C-02**. |
| **PL-049** | **holds in part** | SIGTERM raises through an outer `finally` calling `holder.end()`. **D**, `@@ -1773,7 +2056,26 @@`; teardown is added at `@@ -1528,6 +1740,13 @@`. **H/C3, `cancel_closes_the_window`** checks an actual broker process and fake child window, not merely a status string. The required guest proof with the real window is absent. |
| **PL-050** | **holds in part** | Token-less termination now writes `failed`; listener creation catches `OSError`, records failure, and returns through cleanup. **D**, `@@ -260,6 +311,16 @@` and `@@ -1781,12 +2083,34 @@`. **H/C3** covers those ordinary cases. The supersession protection applies only to the token-less branch; a replaced collector can still fail its replacement—**G-C-02**. |
| **PL-051** | **holds in part** | Environment-fed awk avoids sed replacement interpretation; shell-active characters are refused; the new file is moved over the old configuration; setup’s two readers no longer execute it. **D**, `cloud_setup`, `@@ -44,6 +44,54 @@`, `@@ -168,6 +218,34 @@`, and the setter/reader hunks. But the reader changes existing valid configuration semantics, and the writer can announce success without producing a configuration file—**G-C-03/04**. Existing unsafe assignments remain on disk, so other readers require a separate upgrade check. |
| **PL-074** | **holds** for the specified logging paths | OAuth creation returns fixed failure text rather than stderr; `cloud_remote.rclone()` logs only the verb and exit status. **D**, `cloud_oauth`, `@@ -335,7 +415,14 @@`; `cloud_remote`, `@@ -93,8 +83,13 @@`. **H/C3** injects secret-bearing stderr and arguments and checks their absence from the relevant logs/state. This does not establish that every other output channel is sanitized or that old persistent logs were scrubbed. |

## 2. Findings

### G-C-01: Path depth does not prevent overlapping cloud tiers

- **Severity:** High
- **Category:** Data layout / incomplete guard
- **Where:** `projects/ROCKNIX/packages/network/rclone/sources/cloud_setup`; **D**, `@@ -168,6 +218,34 @@` and `@@ -377,23 +460,22 @@`.
- **What:** The new guard checks that the saves path has a parent, but not that saves, settings, and content occupy different destinations. The visible validator accepts `/Mine/Backups` with an empty remote argument: it passes the character and depth checks and reaches `[ -n "${remote}" ] || return 0`. The setter’s derivation then makes saves and settings identical.
- **Failure scenario:** Before configuring a remote, select `/Mine/Backups` as the saves destination. The shown derivation produces:
  ```text
  SAVES_REMOTE="/Mine/Backups"
  SETTINGS_REMOTE="/Mine/Backups"
  CONTENT_REMOTE="/Mine/Content"
  ```
  `/Mine/Content` similarly aliases saves and content. Under the saves-mirror/delete semantics described by PL-015 and the new comment, this recreates the cross-tier deletion hazard. The risk is conditional on that destructive mode, not every default-copy setup.
- **Evidence:** There is no comparison of the three resulting destinations before the shown `conf_set` call. **H/C1** covers `/GAMES`, `/Mine/Saves`, and a deeper `Saves` path, but not either collision. An omitted caller-level reserved-name guard could refute public-command reachability; none is supplied. The validator and derivation themselves do not establish the required non-overlap.

### G-C-02: A superseded collector can still mark its replacement failed

- **Severity:** Medium
- **Category:** Session lifetime / concurrency
- **Where:** `projects/ROCKNIX/packages/network/rclone/sources/cloud_oauth`; **D**, `@@ -260,6 +311,16 @@`, `@@ -318,16 +379,35 @@`, and `@@ -1482,6 +1680,10 @@`.
- **What:** `superseded` protects only the new **no-token** branch. The preceding configuration-failure branch still writes shared state without checking ownership:
  ```python
  if read_state().get("status") != "signed-in":
      write_state(status="failed", error=detail)
  elif not self.token and not self.superseded:
      ...
  ```
  The `elif` shown in the diff belongs to the outer token-handling condition; its supersession check does not protect the earlier failure write.
- **Failure scenario:** Attempt A obtains a token and blocks in remote creation or verification. A restart marks A superseded and starts B. A then returns a configuration failure while shared state is not `signed-in`, and writes `failed` over B’s live attempt.
- **Evidence:** `_config_lock` belongs to each `Session`, not to an attempt identity governing shared state. I looked for a supersession/generation check on the configuration-result path; none appears in the supplied changes. **H/C3, `collector_marks_a_dead_attempt_failed`** tests supersession only with `fake_authorize("exit 1")`, so it never exercises this token-bearing branch. Add a test that releases A’s failed configuration result only after B starts.

### G-C-03: The replacement config reader changes existing valid values

- **Severity:** Medium
- **Category:** Upgrade compatibility / configuration semantics
- **Where:** `projects/ROCKNIX/packages/network/rclone/sources/cloud_setup`; **D**, `@@ -44,6 +44,54 @@`, `@@ -254,7 +332,7 @@`, and `@@ -437,28 +519,55 @@`.
- **What:** `conf_get` selects the **first** assignment and recognizes only surrounding double quotes:
  ```sh
  sed -n "s/^$1=//p" ... | head -1 | sed 's/^"\(.*\)"$/\1/'
  ```
  The replaced shell readers used the last assignment and recognized single-quoted values too.
- **Failure scenario:** An existing configuration contains a default followed by a user override:
  ```sh
  SAVES_REMOTE="/ROCKNIX/Saves"
  SAVES_REMOTE="/Mine/Saves"
  ```
  Previously, `--info` and the seeding reader used `/Mine/Saves`; they now use `/ROCKNIX/Saves`. A value such as `CONTENT_REMOTE='/Mine/Content'` now retains literal quote characters in the destination.
- **Evidence:** The removed source/eval operations establish the previous assignment semantics. The new reader contains neither compatibility parsing nor an explicit refusal of unsupported legacy forms. **H/C1** checks canonical double-quoted values and an old command substitution, but not duplicate assignments or single quotes. Avoiding execution is correct; silently selecting a different value is not required to achieve that. This needs a data-only compatible reader or explicit, non-destructive handling of unsupported forms under **U**.

### G-C-04: A directory at the config path is reported as a successful save

- **Severity:** Medium
- **Category:** Guards fail closed / artifact verification
- **Where:** `projects/ROCKNIX/packages/network/rclone/sources/cloud_setup`; **D**, `@@ -44,6 +44,54 @@` (`conf_set`).
- **What:** The helper treats every non-regular source as absent:
  ```sh
  [ -f "${src}" ] || src=/dev/null
  ```
  It then considers this sufficient evidence of success:
  ```sh
  mv -f "${tmp}" "${SYNC_CONF}"
  ```
  If `SYNC_CONF` is an existing directory, `mv` moves the temporary file **into** it and succeeds.
- **Failure scenario:** A damaged or incorrectly restored configuration path is a directory. The setter reports `OK`, but `SYNC_CONF` is still a directory and no readable configuration exists at the promised path. The temporary file instead remains inside that directory.
- **Evidence:** No destination-type refusal or positive assertion that the final destination is the intended regular file appears in `conf_set`. **H/C1** tests a read-only regular-file configuration, not a wrong-type destination. This is exactly the distinction between a successful command and the artifact required by **E**, “Verify the artifact, not the report.”

### G-C-05: The masked keyboard reveals rejected password characters

- **Severity:** Medium
- **Category:** Credential display
- **Where:** `projects/ROCKNIX/packages/network/rclone/sources/cloud_oauth`; **D**, `@@ -713,13 +810,15 @@` and `@@ -785,34 +892,82 @@`.
- **What:** The input becomes `type=password`, but `typable()` copies rejected characters into an ordinary visible warning:
  ```javascript
  warn.textContent = "The handheld can't type " + gone.join(" ") + ...
  warn.hidden = false;
  ```
- **Failure scenario:** A player pastes a password containing non-ASCII characters while Show remains off. Those characters appear unmasked below the input. For an entirely non-ASCII password, the warning displays the whole attempted secret, separated by spaces.
- **Evidence:** `warn` is a separate ordinary `<div>`, with no connection to the Show/Hide state. **H/C4** independently asserts that rejected characters produce a warning and that the input is masked; it never checks the warning for disclosure. The masking fix therefore does not cover all places where this change displays the typed value. Use a non-secret-bearing warning by default, or place any literal-character disclosure behind an explicit reveal action.

### G-C-06: The no-route fallback retains the wildcard listener

- **Severity:** Low
- **Category:** Network exposure / incomplete scope restriction
- **Where:** `projects/ROCKNIX/packages/network/rclone/sources/cloud_oauth`; **D**, `@@ -1781,12 +2083,34 @@`.
- **What:** The advertised-address restriction has an explicit exception:
  ```python
  listen = "0.0.0.0" if address == "127.0.0.1" else address
  ```
  Consequently, the fix does not establish that the server listens only at its advertised address.
- **Failure scenario:** Address discovery returns the loopback fallback while another interface is present—or one appears during the session. The broker is advertised at loopback but accepts connections on all IPv4 interfaces.
- **Evidence:** This is a visible branch, not an inferred behavior of `lan_address()`. **H/C3, `listens_on_the_lan_address`** exercises only the non-fallback address `127.0.0.2`; it would not catch this exception. No supplied decision accepts the fallback’s wider exposure. Either bind loopback/refuse startup in that case, or retain it as an explicitly accepted, still-open exception to F-RS-18.

### G-C-07: Failed config writes can emit raw shell diagnostics

- **Severity:** Low
- **Category:** Player-facing error handling
- **Where:** `projects/ROCKNIX/packages/network/rclone/sources/cloud_setup`; **D**, `@@ -44,6 +44,54 @@`.
- **What:** In the awk invocation, the failing output redirection precedes stderr suppression:
  ```sh
  ... "${src}" > "${tmp}" 2>/dev/null
  ```
  Bash processes redirections left to right. If opening the temporary file fails, stderr has not yet been redirected, so the shell can print an internal path and diagnostic before the new friendly failure sentence.
- **Failure scenario:** The configuration directory is read-only or unwritable—the scenario already constructed by C1. The console receives a shell-level error as well as the intended explanation.
- **Evidence:** **H/C1’s read-only checks** require a nonzero result, unchanged configuration, and no `OK`; they do not reject raw stderr. Redirecting the enclosing command group would also cover redirection failures. This establishes a console-output issue against **P/T**; whether ES displays that stderr cannot be established without its caller.

## 3. Sweep checks

The following are checks of the supplied mechanisms and assertions, **not certifications that the reported executions occurred**.

| Sweep row(s) | Assessment |
|---|---|
| **claude F-RS-04 — MiniBrowser** | The recipe visibly changes `ENABLE_MINIBROWSER` to `OFF` inside `pre_configure_target`. **H/C6** checks the option. This supports the recipe change, not absence of a previously installed binary from a built SYSTEM. The tarball analysis and `pkgcheck` result remain report claims; **K** also requires a real build. |
| **claude F-RS-09 — bucket READMEs** | The new parent-folder listing distinguishes successful emptiness from failure, and **H/C2** models the bucket absence case that defeated the old file probe. Supported at the script/shim level. |
| **claude F-RS-13 / gpt F-RS-19 — bounds** | The changed setup calls carry `RCLONE_LIST_OPTS`; authorization-link acquisition uses `select()` rather than a blocking `readline()`. However, C2 checks retry flags, not elapsed time or the aggregate wizard deadline. The definition of `RCLONE_LIST_OPTS` is not embedded. |
| **claude F-RS-17 — focus** | The new JavaScript returns when any non-body/document element owns focus. **H/C8** distinguishes a focused button, body, and field. Real asynchronous provider-page behavior remains untested here. |
| **claude F-RS-18 — bind** | Supported for the non-fallback branch; **G-C-06** prevents an unconditional “fixed” verdict. |
| **claude F-RS-19 / gpt F-RS-25 — cursor** | `cursor_overridden` makes restoration independent of whether the window is still alive, and the orphan-window close path adds restoration. The harness checks calls to a substituted `_cursor_timeout`, not sway’s resulting state. |
| **claude F-RS-20 — callback file** | `page_worth_recording()` excludes the literal loopback hosts used by the shown flow, and `on_load_changed` consults it before writing. C8 checks the helper’s canonical cases. This is not a general URI-secret scrubber. |
| **claude F-RS-23 / gpt F-RS-17 — state files** | Locking and temporary-file replacement address in-process writer overlap and partial JSON visibility. **H/C3, `state_writes_are_whole`** is a meaningful interrupted-write observation. Atomic files do not supply session ownership or cross-process transaction isolation. |
| **gpt F-RS-12 — OSK characters** | The diff adds the missing punctuation layout and switching branches. C8’s “reachable” check only unions table contents and compares row lengths: it would still pass if the symbols table existed but its switch were unreachable. It does not assert the extras-row switch despite its explanatory comment. Full construction/input testing and 640×480 frames remain necessary. |
| **gpt F-RS-14 — masking** | The ordinary input is masked and Show toggles it, but **G-C-05** leaves a disclosure path. |
| **gpt F-RS-16 — hats** | Discovery accepts `ABS_HAT0Y`, and the bridge maps `ABS_HAT0X/Y` changes to arrows. C3 exercises those specific codes. This does not prove every axis-based controller or configured binding is supported. |
| **gpt F-RS-18 — HTTP resources** | Body size and simultaneous handler count are explicitly capped; the socket timeout handles inactivity. C3 tests an oversized body, a complete stall, and one excess connection. It does **not** establish an absolute request lifetime: a client sending bytes before each socket timeout is a different case. |
| **gpt F-RS-20 — empty content destination** | Presence of the config line is now separated from its empty value; the directory list and README calls handle root content specially. C2 checks resulting files, which is stronger than checking `OK` alone. Legacy quoting semantics remain subject to **G-C-03**. |
| **gpt F-RS-21 — identity healing** | The old ID must be successfully appended and found before `write_id` runs. C5 constructs a failed `.previous` write. The fail-closed ordering is supported. |
| **gpt F-RS-23 — remote enumeration** | Both creators refuse creation when listing fails. Their C3 tests check that no creation command is issued. This supports the enumeration-error fix, not an atomic “create only if absent” guarantee against other writers. |

### Withdrawals and deferrals

- **claude F-RS-11 / gpt F-RS-24 — sandbox:** Needing packages outside the ownership list is a legitimate **scope block**, not a refutation of the risk. The owned WebKit recipe is part of the issue even if new dependencies belong elsewhere. The navigation-policy code and alleged captcha experiment are not embedded, so the frame-filter justification cannot be verified.
- **claude F-RS-15 — console-first:** The claimed SSH exception is in an unembedded rule file, and `resolve_connection` is not shown. I cannot validate this withdrawal from the packet. Rule-file ownership can justify reassignment, not closure.
- **claude F-RS-25 — `-j4`:** The maintainer decision and PR-prep disposition are report claims referring to unembedded material. Treat this as deferred, not independently validated.
- **gpt F-RS-26 — localization:** **T** explicitly records existing cloud French translations as follow-up work, supporting a deferral. It does not prove these surfaces are localized or establish a blanket exemption for newly added strings.
- **Remaining claude F-RS-20 claims:** Neither the asserted absence of an alternative rclone persistence interface nor “argv adds no reader” can be established from the supplied code. Do not promote those report explanations into verified security conclusions.

The three rows explicitly left open—controller/help bindings and provider cross-domain navigation—remain open. The report’s counts and hardware/provider assertions do not settle them.

## 4. Coverage boundary and required handoffs

### Upgrade closure is still missing

Two handoffs must remain visible under **U**, “Every fix answers what was already written”:

1. **Old overlapping destinations:** C prevents one future path shape but does not repair or guard configurations already naming `/GAMES/Backups` and `/GAMES/Content` under `/GAMES`. Its seeding reader still uses stored values. Whether stream A supplies a safe destructive-operation guard or compatible layout treatment cannot be judged here.
2. **Old shell-active path assignments:** Setup now reads them as text, but does not remove them from the configuration. **R** identifies other sourcing consumers; their implementations are not embedded. Their safety must be checked, not inferred either from the report or from comments saying all cloud scripts source the file.

Respecting stream ownership was appropriate. These are nevertheless unresolved acceptance dependencies, not “nothing inherited” release closure.

### Sources and artifacts not supplied

The orchestrator would need the following to settle the remaining claims:

- Complete post-images, particularly `GamepadBridge.stop`, session submission/result handling, keyboard delivery/KEYMAP, navigation policy, OSK construction, and `RCLONE_LIST_OPTS`.
- The relevant cross-stream configuration consumers and upgrade safeguards.
- Real window/input evidence for PL-016/018/049, and any required PL-017 device confirmation; actual SDL handover rather than fake ioctl observations.
- Built-image inspection, package-build/pkgcheck output, and the WebKit source used for patch application.
- Provider sign-in evidence, keyboard frames, and configured-controller evidence.
- The decision-register entries and referenced rule exceptions used to accept plaintext LAN input or justify withdrawals.

The full harness header and execution logs are also absent. In particular, C6’s patch checks and C7’s mode checks read the current root/index rather than uniformly using `src_of`; their behavior under `--old` is not a complete historical oracle. I therefore do not independently endorse **465 PASS**, **54 baseline FAIL**, or the claimed fail-before-fix chronology.

## 5. `corpus.provenance.json`

This is the content to record; no filesystem write or independent hashing is claimed. The three source arrays are positionally aligned.

```json
{
  "source_access": "Embedded source corpus supplied by the Council Facilitator",
  "hash_algorithm": "sha256",
  "hash_verification": "Verified at embed time by the Council Facilitator; not recomputed by this reviewer",
  "manifest_read_timestamp_utc": "2026-09-28T04:20:24Z",
  "filesystem_access": false,
  "tests_executed_by_reviewer": false,
  "source_keys": [
    "D",
    "H",
    "P",
    "R",
    "E",
    "U",
    "K",
    "T"
  ],
  "source_file_paths": [
    "docs/audits/2026_09_28-milestone-audit-of-the-fixes-307/seats/C.diff",
    "docs/audits/2026_09_28-milestone-audit-of-the-fixes-307/seats/C.harness.txt",
    "docs/audits/2026_09_28-milestone-audit-of-the-fixes-307/seats/C.plan.md",
    "docs/audits/2026_09_28-milestone-audit-of-the-fixes-307/seats/C.report.md",
    ".claude/rules/engineering-practices.md",
    ".claude/rules/upgrade-and-install.md",
    ".claude/rules/packaging-and-patches.md",
    ".claude/rules/es-player-text.md"
  ],
  "source_file_hashes": [
    "62ead943f2d5aeedaf442d14f7181b3e018394f7875dedc567852eeb531a5fe4",
    "f31307f095f22b3e4e6abc5855c561df873fcd0ad829f69d465f87fe1cf345bc",
    "a4d2d27b9a51a680f7db3537c8d27a20920daa9d5710b159f5e832f44213073b",
    "9a319dacb581625847e185a850e40d419c39349d5d14f8af975b206c36833bc3",
    "d6f88a6f4cd9c61b0e6ef728625c6a1cec9dc6f58e1db578cf0987f10f870c1a",
    "de4a683f9a36f9100e6fd98be11ad84d736f370374c40f74c445a2b81eca1995",
    "2a44db10f4f179198b9366239eabe0900e1701145beced181536eb18bcbc0746",
    "554225c68e627a3bde8969a77f177aea14f5bcd85b0bcc740631d402a5f1f7a7"
  ],
  "unembedded_evidence_needed": [
    "Complete implementation post-images for code outside the supplied diff hunks",
    "Cross-stream configuration consumers and upgrade safeguards",
    "Full harness header, raw execution logs, and historical fail-before-fix evidence",
    "Built-image, package-check, WebKit patch-application, VM, device, and provider evidence",
    "docs/decision-register.md",
    ".claude/rules/rclone-cloud-sync.md",
    "The referenced device-builds rule and its maintainer decision"
  ]
}
```