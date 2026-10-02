# Packet C — second-round audit

## Summary and evidence basis

**The packet does not support an unqualified “all fixed” verdict.** Most targeted mechanisms are present, but I found remaining configuration-reader and session-lifetime defects, an incomplete layout guard, and narrower error-handling defects.

Important acceptance gaps:

- **PL-030 appears in the items file but not in the plan’s ten-item delivery or the report’s item-by-item answers.**
- The required guest evidence for **PL-016, PL-018, and PL-049** is absent. The report acknowledges this.
- The final report claims **492 PASS, 0 FAIL, 0 SKIP**. I reviewed the test implementations, not an executed run or its raw output. [S2, S4, S5]

I reviewed only the nine embedded sources. I did not access a filesystem, execute tests, or independently calculate hashes. References **[S1]–[S9]** resolve to the exact declared paths and Facilitator-verified hashes in `corpus.provenance.json` below.

Code locations are within **[S1], `C.diff`**. For brevity:

- `cloud_setup`, `cloud_oauth`, and `cloud_remote` are under `projects/ROCKNIX/packages/network/rclone/sources/`.
- `window.c` means `projects/ROCKNIX/packages/network/cloud-signin-window/sources/cloud-signin-window.c`.
- C1–C8 identify the named test groups in the added `tools/last-good-scripts-test` block, hunk `@@ -3011,4 +3011,1763 @@`.

## 1. Punch-item verdicts

These verdicts use the acceptance text in **[S4]**. A code-level “holds” does not imply that I observed the test passing.

| Item | Verdict | Evidence and limitation |
|---|---|---|
| **PL-015** | **Holds in part** | `syncpath_problem` rejects one-level paths and the setter derives `<parent>/Backups` and `<parent>/Content`. C1 checks `/GAMES`, normal two-level paths, and deeper paths. The added block does not contain the acceptance’s literal `--set-saves-remote /` case. More importantly, noncanonical paths still recreate nesting: **G2-C-04**. [S1, `cloud_setup`, `@@ -168,6 +250,52 @@`, `@@ -377,23 +510,24 @@`; C1] |
| **PL-016** | **Holds in part** | `if (opened) { sent = ""; deliver(box.value); }` implements delivery on the transition to open. C4’s `typedBeforeOpen` asserts the resulting text, not merely that a request was sent. The specified guest/window-log proof is absent; the model assumes an open window already has a receptive field. [S1, `cloud_oauth`, `@@ -901,13 +1138,22 @@`; C4] |
| **PL-017** | **Holds** | The acceptance allows a test of the page’s script. `act("backspace")` changes `box.value` and calls `deliver`; buttons and keyboard events use that function. C4 executes the rendered page’s script and checks `abc`, Back, `d` produces `abd`. This is not a claim of a guest run. [S1, `cloud_oauth`, `@@ -785,34 +959,97 @@`; C4] |
| **PL-018** | **Holds in part** | `signed_in()` calls `gamepad.stop()` before creating the marker, and `wait` changes its early `return` to `break`, reaching the pad-settle path. C3 records grab-release ordering. Actual uinput/SDL menu recovery and the device-fact row are missing. [S1, `cloud_oauth`, `@@ -1499,7 +1786,17 @@`, `@@ -1928,12 +2351,13 @@`; C3] |
| **PL-030** | **Cannot tell from the packet** | C1 directly invokes the script with a quoted command-substitution string and verifies refusal. That does not prove the shell constructing the command in the interface cannot execute the string **before** `cloud_setup` receives it. The caller and the requested guest-picked-folder proof are absent. [S1, `cloud_setup`, `@@ -168,6 +250,52 @@`; C1; S4] |
| **PL-047** | **Holds** | `seed_note` returns without uploading when the directory listing fails; successful listings are checked for an exact `README.txt`; upload uses `--ignore-existing`. C2 tests preservation of an owner’s note and absence of new README files on listing failure. [S1, `cloud_setup`, `@@ -437,28 +571,55 @@`; C2] |
| **PL-048** | **Holds** | `_config_lock` serializes configuration, `_config_result` caches the completed result, and `configured` is assigned from that result. C3 tests concurrent callers with failed and successful verification and asserts one create. [S1, `cloud_oauth`, `@@ -318,16 +446,35 @@`; C3] |
| **PL-049** | **Holds in part** | SIGTERM raises through the outer `finally: holder.end()`. The process test verifies that cancellation removes a fake window. The acceptance specifically asks for the guest’s real-window log, which is absent. [S1, `cloud_oauth`, `@@ -1771,26 +2147,77 @@`, `@@ -1528,6 +1825,21 @@`; C3] |
| **PL-050** | **Holds for the named unit acceptance** | `_collect` now records a token-less exit as failed, and the occupied-port path records failure and returns 2. C3 exercises both. However, the serve can subsequently overwrite that terminal status with `waiting`: **G2-C-02**. The isolated unit acceptance does not establish the integrated lifetime claim. [S1, `cloud_oauth`, `@@ -258,8 +360,34 @@`, `@@ -1771,26 +2147,77 @@`; C3] |
| **PL-051** | **Holds for the stated round-trip acceptance** | Values reach awk through the environment rather than a sed replacement, writes use a temporary file and rename, and C1 compares the resulting `&` and `|` values and unchanged unrelated lines. The replacement reader introduces a separate upgrade-compatibility problem: **G2-C-01**. [S1, `cloud_setup`, `@@ -44,6 +44,86 @@`; C1] |
| **PL-074** | **Holds for newly written log lines** | OAuth creation failures return fixed text and log the exit code; `cloud_remote.rclone()` no longer logs settings or stderr. C3 checks the log’s contents. This does not scrub historical persistent debugging logs; the report explicitly says those remain until rotation. The interface’s separate stderr channel has the residual in **G2-C-06**. [S1, `cloud_oauth`, `@@ -335,7 +482,14 @@`; `cloud_remote`, `@@ -93,8 +83,13 @@`; C3; S2] |

## 2. First-audit finding review

The claims being checked are those in **[S3]**, not accepted verdicts.

| Finding | Verdict on the claimed answer | Diff evidence |
|---|---|---|
| **claude G-C-01** | **Answered — coverage objection** | The new `close_page_reaches_the_keyboard_as_escape` test posts through the real handler and keyboard, then checks actual key-event bytes for Escape press/release. It no longer declares success merely because the phone posted a key. The unchanged named-key table itself is not embedded. [S1, C3; `window.c`, `@@ -444,8 +483,11 @@`] |
| **claude G-C-02** | **Answered in part** | Flocked ownership checks protect late failure writes, and teardown sets `superseded`. Successful superseded sessions remain able to affect completion: **G2-C-03**. [S1, `cloud_oauth`, `@@ -84,12 +89,70 @@`, `@@ -258,8 +360,34 @@`] |
| **claude G-C-03** | **Answered for the cited strings** | The port number remains in the log rather than the state; folder refusals consistently say “cloud folder”; failed folder saves print the single sentence. The new shared bind-error sentence misdiagnoses other errnos: **G2-C-07**. [S1, `cloud_setup`, `@@ -168,6 +250,52 @@`, `@@ -377,23 +510,24 @@`; `cloud_oauth`, `@@ -1771,26 +2147,77 @@`] |
| **claude G-C-04** | **Answered** | The harness header expressly distinguishes red-before-fix cases from guards, including the original 54 FAIL/25 PASS split. [S1, harness header] |
| **claude G-C-05** | **Answered for the coverage gap** | Added guards exercise `--content-location`, `--check-syncpath`, and `--use-content-root` with command text in stored values. The visible readers use `conf_get`. I cannot independently reproduce the report’s exhaustive source/eval search from a diff. [S1, C1; `cloud_setup`, `@@ -284,16 +412,19 @@`, `@@ -342,7 +473,7 @@`] |
| **claude G-C-06** | **Answered in part** | Last assignment, wholly single-quoted values, and simple bare values are handled and tested. Other valid non-expanding shell literals still change meaning: **G2-C-01**. [S1, `cloud_setup`, `@@ -44,6 +44,86 @@`; C1] |
| **claude G-C-07** | **Answered in part** | `osk_wiring.py` checks the build loop, layout-key presence, toggle, and relabel selection rather than character tables alone. It is still a static wiring check; no GTK navigation or 640×480 frame proof is supplied. [S1, C8] |
| **claude G-C-08** | **Answered in part** | The added commands test uses a fixture containing only WebDAV. It does not exercise OAuth tier classification. The reported repository-wide reader search is not supplied, so the claim that the removed constant had no reader is not independently established. [S1, `cloud_remote`, `@@ -44,24 +44,14 @@`; C3 `remote_listings_run_without_the_old_constant`; S2] |
| **claude G-C-09** | **Answered in part** | Raw password values are replaced before stderr reaches the interface, but replacements in input order can expose parts of a longer password: **G2-C-06**. [S1, `cloud_remote`, `@@ -303,7 +311,14 @@`] |
| **claude G-C-10** | **Answered in part** | Early output now goes through the diagnostic checks. A raw-read boundary inside the diagnostic prefix still defeats them: **G2-C-05**. [S1, `cloud_oauth`, `@@ -229,8 +325,14 @@`] |
| **claude G-C-11** | **Withdrawal does not hold as an absolute claim** | `--check-syncpath` explicitly defaults to the stored value: `CAND="${2:-$(conf_get SAVES_REMOTE)}"`. C1 also invokes that command without an argument. Thus “a stored folder is never re-checked” is too broad. This does **not** prove an automatic upgrade regression; the production caller trace needed to settle that is absent. [S1, `cloud_setup`, `@@ -342,7 +473,7 @@`; C1] |
| **gpt G-C-01** | **Answered in part** | Exact and case-folded `Backups`/`Content` aliases are rejected and tested. Path-component aliases still recreate forbidden nesting: **G2-C-04**. [S1, `cloud_setup`, `@@ -168,6 +250,52 @@`; C1] |
| **gpt G-C-02** | **Answered in part** | The reported late configuration-failure write checks `superseded`, but the corresponding successful path does not: **G2-C-03**. [S1, `cloud_oauth`, `@@ -258,8 +360,34 @@`, `@@ -349,7 +503,7 @@`] |
| **gpt G-C-03** | **Answered in part** | The enumerated last-assignment/single-quote/bare-word cases are fixed. The general claim of agreement with shell readers remains false: **G2-C-01**. [S1, `cloud_setup`, `@@ -44,6 +44,86 @@`; C1] |
| **gpt G-C-04** | **Answered** | A non-file at the destination is rejected before writing, and the installed artifact must be a regular file containing every requested line. C1 checks that a directory is left empty and no OK is printed. [S1, `cloud_setup`, `@@ -44,6 +44,86 @@`; C1] |
| **gpt G-C-05** | **Answered** | `warnSay()` counts rejected characters while masked and names them only when Show is active. C4 checks both states. [S1, `cloud_oauth`, `@@ -785,34 +959,97 @@`; C4] |
| **gpt G-C-06** | **Answered** | `listen = address` removes the wildcard fallback. The no-route test checks reachability on the advertised loopback address and rejection on another address. [S1, `cloud_oauth`, `@@ -1771,26 +2147,77 @@`; C3] |
| **gpt G-C-07** | **Answered** | The awk redirection and rename are enclosed in a brace group whose stderr is redirected. C1 asserts the complete output, not just absence of OK. [S1, `cloud_setup`, `@@ -44,6 +44,86 @@`; C1] |

## 3. Findings in the delivered diff

The following failure scenarios are **static traces**, not claims of executions I performed.

### G2-C-01: `conf_get` silently changes valid shell-literal paths

- **Severity:** Medium
- **Category:** Introduced regression / upgrade compatibility
- **Where:** `cloud_setup`, `conf_get`, hunk `@@ -44,6 +44,86 @@`; its readers at `@@ -254,7 +382,7 @@` and `@@ -437,28 +571,55 @@`. [S1]
- **What:** The reader handles only wholly quoted values or whitespace-free bare values. It does not preserve valid shell words assembled from quoted and unquoted literal segments.
- **Failure scenario:** An existing configuration contains:
  ```sh
  SAVES_REMOTE=/Mine/'My Saves'
  ```
  The previous source/eval readers obtain `/Mine/My Saves`. The new bare-value branch truncates at the space and returns `/Mine/'My`. `--info` reports a different folder, and `--seed-folders` can operate on that different path.
- **Evidence:** The bare branch is `value="${value%%[[:space:]]*}"`; quoted branches likewise stop at the first closing quote without consuming following literal segments. The old `--info` sourcing and `--seed-folders` eval are visible in the removed lines. C1 covers wholly quoted values but not this valid, non-executing form. There is neither a literal-word parser nor a refusal of unsupported syntax. This contradicts the report’s claim that hand-edited configurations now read as the sync reads them and the compatibility requirement in [S7].

The correction must not reintroduce eval: preserve supported literal shell syntax, or fail explicitly rather than silently choose a different cloud folder.

### G2-C-02: Startup can overwrite a terminal result with `waiting`

- **Severity:** Medium
- **Category:** Session-state ordering / incomplete lifetime fix
- **Where:** `cloud_oauth`, `_fail_owned`, hunk `@@ -258,8 +360,34 @@`; `serve_with`, `@@ -1771,26 +2147,77 @@`; restart handler, `@@ -1724,13 +2097,16 @@`. [S1]
- **What:** Ownership checks prevent writes by a different serve, but do not prevent a backward status transition within the same attempt.
- **Failure scenario:** Authorize prints its link and fails immediately. The collector records `failed` while the state is `starting`. The main thread then finishes binding and executes `write_owned(... status="waiting", ...)`. Because the attempt still matches, the dead attempt is republished as waiting, with its old error retained by the merge.
- **Evidence:** `_fail_owned` explicitly accepts `starting`; the later waiting write is unconditional on the existing status. The restart handler has the same pattern after `holder.start()`. No expected-prior-status condition is present at either write. The early-output test calls `Session.start()` in isolation with state already initialized; the serve-process fixture deliberately keeps authorize alive. Neither tests this interleaving.

A deterministic regression can pause listener setup until the collector has recorded its terminal result, then check that setup cannot overwrite it.

### G2-C-03: A superseded successful session can complete its replacement

- **Severity:** Medium
- **Category:** Session ownership / stale completion
- **Where:** `cloud_oauth`, `SessionHolder` attempt initialization and `start`, hunks `@@ -1467,6 +1747,8 @@` and `@@ -1482,6 +1764,11 @@`; `_create_remote`, `@@ -349,7 +503,7 @@`; `signed_in`, `@@ -1499,7 +1786,17 @@`. [S1]
- **What:** Failure paths honor `superseded`; successful configuration does not. The ownership token is per **holder/serve**, so restarting a session within that holder does not invalidate its predecessor’s token.
- **Failure scenario:** Session A has a token and is still creating/verifying its remote. A restart marks A superseded and starts B. Both carry `holder.attempt`. After B is published as waiting, A succeeds and executes `write_owned(self.attempt, status="signed-in", remote=name)`. The matching attempt permits A to mark B’s state signed-in.
- **Evidence:** `session.attempt = self.attempt` is repeated on every `start`; only the holder constructor creates the ID. The successful write has no superseded check. The added replacement test exercises a **failed** create, not a successful one. Additionally, `_create_remote` ignores a false return from `write_owned` and still returns success, while `signed_in()` creates an unowned shared marker. The full successful collector/callback block is not embedded, so cross-serve callback propagation needs that read; the same-holder state overwrite does not depend on it.

Ownership must cover successful completion as well as failure, and distinguish successive sessions within one serve.

### G2-C-04: Dot components bypass the tier-separation guard

- **Severity:** High
- **Category:** Data-layout guard / incomplete repair
- **Where:** `cloud_setup`, `syncpath_problem`, hunk `@@ -168,6 +250,52 @@`; destination derivation, `@@ -377,23 +510,24 @@`. [S1]
- **What:** Depth and sibling-name checks operate on the uncanonicalized path. They neither reject nor resolve `.` and `..` components.
- **Failure scenario:** With no remote configured, validate and store:
  ```text
  /Mine/Backups/.
  ```
  It passes the string checks: it has multiple components and is not textually equal to either derived sibling. `dirname` yields `/Mine/Backups`, producing:
  ```text
  SAVES_REMOTE="/Mine/Backups/."
  SETTINGS_REMOTE="/Mine/Backups/Backups"
  CONTENT_REMOTE="/Mine/Backups/Content"
  ```
  On a path-based destination that resolves terminal `.`—including the packet’s filesystem-backed fixture—the latter two folders are inside the saves folder.
- **Evidence:** The shown normalization removes leading/trailing slashes only. The collision checks compare `folded` against `${parent}/Backups` and `${parent}/Content`, followed by an explicit success return when no remote is present. C1 tests direct names and case folding, not path aliases. No component rejection or canonicalization is present in the validator.

This recreates the forbidden layout. The exact destructive consequence in the integrated build depends on downstream scripts; [S9] describes additional stream-A mitigations, but their implementation is not supplied here.

### G2-C-05: Early-output replay invents a line boundary

- **Severity:** Low
- **Category:** Introduced parsing edge / diagnostic correctness
- **Where:** `cloud_oauth`, raw authorize reads, `@@ -202,18 +277,39 @@`; `_collect`, `@@ -229,8 +325,14 @@`. [S1]
- **What:** `early.splitlines(True)` can end with an incomplete line. Chaining it with the remaining stdout iterator treats the continuation as a separate line for diagnostic recognition.
- **Failure scenario:** The raw read that finds the authorize link ends with `Erro`. The remaining pipe data begins `r: failed to get token: oauth2: "invalid_grant"\n`. Neither yielded fragment starts with `Error: `, so the provider’s actual reason is not stored in `rclone_says`.
- **Evidence:** `buffer += line` reconstructs the bytes for token parsing, but the error checks operate on each separate `line`. There is no carry-over of the unfinished last line. The new test emits the complete link and diagnostic together; it does not deliberately split the diagnostic prefix across the handoff.

Only complete early lines should be processed; the partial tail must be joined to subsequent bytes.

### G2-C-06: Redaction order exposes suffixes of longer passwords

- **Severity:** Low
- **Category:** Credentials / incomplete sanitization
- **Where:** `cloud_remote`, password-value collection, `@@ -271,15 +269,25 @@`; stderr filtering, `@@ -303,7 +311,14 @@`. [S1]
- **What:** Password values are replaced in settings order. Replacing a shorter value first can prevent a longer value from matching.
- **Failure scenario:** Provider metadata identifies two password options. Their supplied values, in order, are synthetic strings `abc123` and `abc123XYZ987`. An error echoes the second value. The first replacement changes it to `<hidden>XYZ987`; the second replacement no longer matches. A password suffix reaches the interface.
- **Evidence:** `secret_values` preserves settings order, followed by successive `said.replace(value, "<hidden>")` calls. No longest-first ordering or simultaneous matching is used. The added test supplies only one password value.

At minimum, test overlapping values and replace longer values before their substrings. This finding concerns the interface channel, not the already-cleaned log.

### G2-C-07: Every bind error is described as a port conflict

- **Severity:** Low
- **Category:** Introduced player-facing diagnostic error
- **Where:** `cloud_oauth`, `serve_with` bind-exception handler, `@@ -1771,26 +2147,77 @@`. [S1]
- **What:** The log distinguishes `EADDRINUSE` from other errors, but the state always says another program is using the sign-in connection.
- **Failure scenario:** Wi-Fi loses the selected address between `lan_address()` and `bind()`, producing `EADDRNOTAVAIL`. The player is told “Something else on this handheld is using the sign-in’s connection. Restart it and try again,” although no port conflict exists.
- **Evidence:** The handler catches all `OSError`; only `why` branches on `exc.errno`. The player-facing `write_owned(... error=...)` does not. Tests cover an occupied port only. There is no distinct unavailable-address or generic-listen failure sentence.

Removing developer details should not remove the distinction needed for accurate recovery advice. [S6, S8]

## 4. Sweep spot-checks

The following checks concern rows the report labels fixed. [S2]

| Sweep row(s) | Assessment against the diff |
|---|---|
| **claude F-RS-04 — MiniBrowser** | The recipe changes `ENABLE_MINIBROWSER` to OFF. That establishes the option change, not absence from a produced image or the claimed complete upstream blast-radius analysis. [S1, `packages/web/webkitgtk/package.mk`, `@@ -70,12 +70,19 @@`] |
| **claude F-RS-09 — bucket READMEs** | The successful parent-folder listing replaces the ambiguous file probe. C2 models missing bucket keys separately from failed listings and verifies actual README files. Sound targeted mechanism. [S1, `cloud_setup`, `@@ -437,28 +571,55 @@`; C2] |
| **claude F-RS-13 / gpt F-RS-19 — bounds** | Listing options are added to the seeding/content-location calls; authorize’s initial read is genuinely clock-bounded by `select`. The shell tests inspect retry flags, not elapsed time or a total seeding deadline. Do not infer an aggregate 90-second guarantee from them. [S1, `cloud_setup`, `@@ -284,16 +412,19 @@`, `@@ -437,28 +571,55 @@`; `cloud_oauth`, `@@ -202,18 +277,39 @@`] |
| **claude F-RS-16 / gpt F-RS-13; gpt F-RS-14 — phone text** | Unsupported characters are removed with a warning; masking and Show are implemented; warnings no longer reveal characters while masked. C4 exercises those predicates. [S1, `cloud_oauth`, `@@ -785,34 +959,97 @@`; C4] |
| **claude F-RS-18 — listener scope** | The listener binds the advertised address, including loopback fallback. The proxy-coexistence test checks distinct addresses sharing a port. The real `lan_address()` selection and proxy configuration are outside the diff. [S1, `cloud_oauth`, `@@ -1771,26 +2147,77 @@`; C3] |
| **gpt F-RS-16 — hats and escape** | Hat discovery and event translation are implemented and tested. **Only partial overall:** the report expressly leaves “no pad at all” unworked; adding a phone escape route does not establish a usable console-only exit when the bridge cannot read any pad. [S1, `@@ -1241,33 +1497,47 @@`, `@@ -1404,6 +1675,15 @@`; S2, “Not worked”] |
| **claude F-RS-23 / gpt F-RS-17 — JSON state** | Locking plus temp-and-rename prevents partial JSON reads; the slow-writer test checks the previous whole document. This does not solve semantic state ordering or stale completion: G2-C-02/03. [S1, `@@ -84,12 +89,70 @@`; C3] |
| **gpt F-RS-18 — HTTP resources** | Body size and concurrent thread counts are bounded. **Partial:** `Handler.timeout` is a socket inactivity timeout, not an absolute request deadline. Sixteen clients sending sufficiently frequent partial data can retain all slots. The report acknowledges this unworked limit; it should remain an explicit release disposition. [S1, `@@ -1551,8 +1863,57 @@`, `@@ -1675,7 +2037,18 @@`; S2] |
| **gpt F-RS-20 — empty content root** | Presence of the key is distinguished from an empty value; root ROMs/BIOS notes are seeded without adding a README at the cloud’s top. C2 checks those artifacts. [S1, `cloud_setup`, `@@ -437,28 +571,55 @@`, `@@ -476,7 +637,10 @@`; C2] |
| **gpt F-RS-21 — identity history** | Healing now requires append success and exact read-back of the previous ID. C5 verifies that an unwritable history path preserves the custom old ID. [S1, `cloud_device_id`, `@@ -292,11 +292,14 @@`, `@@ -316,7 +319,17 @@`; C5] |
| **gpt F-RS-23 — remote enumeration** | Both creators refuse to create when enumeration fails. The tests assert no create call, not merely a nonzero return. [S1, `cloud_remote`, `@@ -243,10 +238,13 @@`, `@@ -271,15 +269,25 @@`; `cloud_oauth`, `@@ -318,16 +446,35 @@`; C3] |
| **gpt F-RS-12 — symbols keyboard** | Tables cover printable ASCII; static guards check wiring and row sizes. The report correctly leaves actual 640×480 layout/navigation proof open. [S1, `window.c`, `@@ -76,7 +82,21 @@`; C8] |

### Withdrawn sweep rows

- **claude F-RS-11 / gpt F-RS-24 — sandbox:** “Needs another stream/new packages” is an ownership-based **deferral**, not a technical refutation. The asserted captcha/frame-filter history is not supplied as source or runtime evidence. The residual needs an owner or an explicit accepted-risk disposition.
- **claude F-RS-15 — console flow/rule drift:** [S9] contains a technically-unavoidable OAuth computer exception, but the actual fallback flow is not embedded sufficiently to establish that it qualifies. The reported “no browser” rule drift is already absent from the embedded current rule, which names the sign-in window.
- **claude F-RS-20 — argv/provider output:** The loopback page-file suppression is visible and narrowly tested. The remainder’s withdrawal depends on rclone’s available input mechanisms and the device’s process-access model, neither established by this packet.
- **claude F-RS-25 — parallelism:** Upstream-fit deferral is permitted by the plan. The cited maintainer build-policy record is not embedded, so I cannot independently verify that part.
- **gpt F-RS-26 — localization:** [S8] explicitly records cloud-string French debt as a follow-up. That supports deferral, not a claim that localization was fixed; the standalone surfaces’ translation design remains outside this packet.

## 5. Seams and inherited state

| Seam | What must agree | What this packet establishes |
|---|---|---|
| **Folder writer ↔ stream-A cloud readers/migration** | Readers must interpret preserved `/storage` values consistently, and historical layouts must not become destructive. | New writes are atomic and common literal forms work, but G2-C-01/04 remain. [S9] describes stream-A protections newer than portions of C’s report. Those rules are not a substitute for reading the integrated implementation. |
| **`session.json` / `signed-in` marker ↔ interface lifecycle** | “Signed in” must mean the current attempt completed, and the pad must be free before SDL reopens it. | Intended release-before-marker ordering is present. Generation ownership is incomplete, and real SDL recovery is unproved. The interface consumer is not embedded. |
| **Interface command construction ↔ `cloud_setup` validation** | Untrusted folder text must reach the script as data before the script can reject it. | C1 proves only the script side. This is the unresolved PL-030 seam. |
| **Script output ↔ interface vocabulary/parsers** | Machine tokens such as `OK`, `MISSING`, and state fields must be parsed; player-visible reasons must use the agreed language. | Several reasons are improved. The UI conversion layer is absent, so I do not classify every protocol token as an on-screen vocabulary violation. G2-C-07 is wrong even before that conversion. [S8] |
| **OAuth listener ↔ offline-achievements proxy** | Specific-address binds must allow the shared port to coexist. | The socket test checks that assumption. No proxy-stamp/card contract changes are shown in C. |
| **Shared scripts harness ↔ other streams’ blocks** | Common helpers, globals, sandbox setup, and final accounting must survive integration. | C appends one block before the verdict and supplies meaningful artifact assertions. Other streams’ blocks and the merged raw run are absent. |
| **Credential fix ↔ historical logs** | A fresh safe log line is not evidence that old persistent logs contain no secrets. | The report explicitly leaves persistent debugging logs untouched until rotation. That residual should not disappear under PL-074’s new-write acceptance. [S2, S7] |

## 6. Coverage boundary and requests to the orchestrator

The following were **not supplied**, and I have not treated them as read:

1. **Full post-fix source bodies**, especially the collector success/callback path, `SessionHolder.start` publication/cleanup order, the phone’s open-probe implementation, the complete gamepad stop path, and the removed constant’s possible consumers.
   - A specific unresolved lifetime question is cancellation while `Session.start()` is still waiting for the authorize link: the shown start path works on a local session, while `holder.end()` cleans `holder.session`. The full assignment/cleanup order is needed to rule out an unpublished-child leak.
2. **Interface callers and lifecycle code**, needed for PL-030, stored-path validation reachability, state/error presentation, and SDL reinitialization.
3. **Guest/device artifacts** for the named acceptances, slow-page field readiness, real Escape handling, symbols-layout frames, and pad recovery.
4. **Raw harness, pkgcheck, compiler, patch-application, and image-inspection outputs.** The report gives claims and excerpts, not independently available execution artifacts.
5. **Stream-A and other integrated implementations**, needed to settle historical configuration safety and shared-writer contracts.
6. **`packaging-and-patches.md`, the decision register, and device-facts contents.** They are referenced by the plan/brief but not embedded. Recipe review here is therefore limited to the visible change and tests.

The highest-value next checks are the deterministic regressions described in G2-C-01 through G2-C-06, reconciliation of **PL-030’s ownership/delivery**, and completion of the explicitly required guest proofs.

## `corpus.provenance.json`

```json
{
  "packet": "C",
  "source_access": "Reviewed the embedded read-at-time corpus only. No filesystem access, test execution, independent file reread, or independent hashing.",
  "hash_algorithm": "sha256",
  "hash_verification": "All source hashes below are the Facilitator-supplied values marked verified at embed time.",
  "facilitator_manifest_read_timestamp_utc": "2026-09-28T13:57:25Z",
  "source_ids": [
    "S1",
    "S2",
    "S3",
    "S4",
    "S5",
    "S6",
    "S7",
    "S8",
    "S9"
  ],
  "source_file_paths": [
    "docs/audits/2026_09_28-milestone-audit-of-the-fix-round/seats/C.diff",
    "docs/audits/2026_09_28-milestone-audit-of-the-fix-round/seats/C.report.md",
    "docs/audits/2026_09_28-milestone-audit-of-the-fix-round/seats/C.findings.md",
    "docs/audits/2026_09_28-milestone-audit-of-the-fix-round/seats/C.items.md",
    "docs/audits/2026_09_28-milestone-audit-of-the-fix-round/seats/C.plan.md",
    ".claude/rules/engineering-practices.md",
    ".claude/rules/upgrade-and-install.md",
    ".claude/rules/es-player-text.md",
    ".claude/rules/rclone-cloud-sync.md"
  ],
  "source_file_hashes": [
    "25f58e1e6683bc6efb9b137c37b00ccb3dc2cb8e409c24732fedff4f6198c6d5",
    "929b6cd0b9e81fd74870993db692b38e4fad079d76dee0c8aa14b3e53c8ecf3e",
    "b1e182d9b6606858bd904e5df9f9337b358bba4209c1ff94019d8a58b332787b",
    "05be3f9b4c1562bc0ba0b26f535ac93168944325238383a4c32f327774c50670",
    "a4d2d27b9a51a680f7db3537c8d27a20920daa9d5710b159f5e832f44213073b",
    "7f1eb012edc986ee2975abacb44f1a662f2a111a6ded1a1a623a84af509eef7d",
    "d79a1084e85117ba566d23af7fbf3633c44290a6c490f9125e1fd9df061f8cfd",
    "c401103eba4ada9d0e757a2b8522e7ed9558a17eb4da72b65615795163f33c86",
    "62478bddb5b706a91f7d9f6900eeffc46b06a6aacdcfc0d554ba17465035001c"
  ],
  "source_array_alignment": "source_ids, source_file_paths, and source_file_hashes correspond positionally.",
  "gaps_surfaced_to_orchestrator": [
    "Complete post-fix source bodies and unchanged callees are not embedded; code review is limited to the diff hunks and supplied test implementations.",
    "Interface command construction, lifecycle consumers, and production stored-path validation callers are not embedded.",
    "Other streams' integrated implementations and shared-harness blocks are not embedded.",
    "Raw test, build, pkgcheck, compiler, patch-application, image-inspection, guest, and device evidence is not embedded.",
    "The referenced packaging-and-patches rule, decision register, and device-facts contents are not embedded.",
    "PL-030 is present in C.items.md but is not accounted for by the plan's ten-item delivery or the report's item-by-item outcomes."
  ]
}
```