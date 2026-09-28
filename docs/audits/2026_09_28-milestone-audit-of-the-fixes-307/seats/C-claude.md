# Audit of the fixes — stream C (cloud sign-in broker and setup), seat review

Corpus: the 8 embedded sources (hashes recorded in the provenance block at the end). No file was re-read or re-hashed by me; every citation below is to the embedded text. Diff hunks are cited by file and `@@` header because the diff carries no absolute line numbers.

---

## 1. Per punch item

| Item | Verdict | Mechanism in the diff | What is not in the packet |
|---|---|---|---|
| **PL-015** root-level saves path nests the other tiers | **holds** (refusal branch of the acceptance) | `cloud_setup @@ -160,6 +208,8 @@`: in `syncpath_problem`, `case "${path#/}" in */*) ;; *) echo "Your saves folder needs to sit inside another folder…"; echo "Try ${path}/Saves."; return 1`. `@@ -377,23 +460,22 @@`: the `[ "${SP_PARENT}" = "/" ] && SP_PARENT="${NEWPATH}"` line is removed; `syncpath_problem` now runs with or without a remote (`if ! syncpath_problem "${NEWPATH}" "${SP_REMOTE}"`); siblings written as `${SP_PARENT}/Backups`, `${SP_PARENT}/Content` in one `conf_set`. Harness C1 grades `/GAMES` refused with config untouched, `Mine/Saves/` and `/a/b/Saves` with siblings. `/` still falls to the pre-existing empty-path check. | `syncpath_problem`'s callers other than `--check-syncpath`/`--set-saves-remote` (see G-C-11); how ES renders a two-line refusal. |
| **PL-016** text typed before the window is up | **holds** (mechanism); the guest/curl run the acceptance names is outstanding (report says so) | `cloud_oauth @@ -901,13 +1056,22 @@`: `var opened = open && !ready; ready = open; if (opened) { sent = ""; deliver(box.value); }`. Waiting line no longer names a send button. Harness C4 `typedBeforeOpen`: zero posts before open, field `me@example.com` after. | `deliver()`'s body (only its tail `sent = v;` is in the diff) — whether the flush is "one `type=` post". |
| **PL-017** Back bypasses the box | **holds** (mechanism); guest d's window log outstanding | `@@ -785,34 +892,82 @@`: one `act(named)`; `backspace` trims `box.value` and calls `deliver`, or sends `key=backspace` when the box is empty; every `[data-key]` button and the keydown path route through `act`. C4 `backButtonKeepsTheModel`, `namedKeysKeepTheModel`. | `deliver()` again — the C4 model would catch a count drift, so the PASS is meaningful if true. |
| **PL-018** `wait` returns while the bridge holds the grab | **holds** (mechanism); the acceptance's device fact is open (report: open) | `@@ -1499,7 +1701,17 @@` `signed_in()`: `gamepad, self.gamepad = self.gamepad, None; if gamepad: gamepad.stop()` *before* `open(state_path("signed-in"), "w")`. `@@ -1928,12 +2248,13 @@` `wait`: `return 0` → `break`, falling into the `pad_is_free` settle loop. C3 `grab_released_before_signed_in` records EVIOCGRAB order and polls `pad_is_free` three times. | Whether `GamepadBridge.stop()` joins the reader thread before returning — the ordering guarantee and the C3 first assertion rest on it; `stop()` is not in the diff. |
| **PL-047** failed README probe overwrites the note | **holds** | `cloud_setup @@ -437,28 +519,55 @@` `seed_note`: `if ! listing=$(rclone lsf --files-only … ); then log_message …; return 1; fi`; `grep -qFx -- 'README.txt' && return 0`; `copyto --ignore-existing`. `local … listing` is declared apart from the assignment, so the status is the listing's. C2: fail-lsf leaves the owner's note and writes nothing on a fresh cloud; bucket mode seeds five. | `RCLONE_LIST_OPTS` (declared elsewhere; the C2 `unbounded()` check would fail if absent). |
| **PL-048** `configured` set before verification | **holds** | `@@ -318,16 +379,35 @@`: `with self._config_lock: if self._config_result is None: self._config_result = self._create_remote(); self.configured = bool(self._config_result[0]); return self._config_result`. C3 `configured_only_after_verification`: second caller gets the first's failure, one `config create`. | The tail of `_create_remote` (the `lsd` proof and the `signed-in` write) is beyond the hunk. |
| **PL-049** `cancel`'s SIGTERM skips the `finally` | **holds** (mechanism); the guest's window log outstanding | `@@ -1773,7 +2056,26 @@`: `on_term` sets `SIG_IGN` then `raise SystemExit(128 + signum)`; `try: return serve_with(...) finally: holder.end()`; `@@ -1528,6 +1740,13 @@` `end()` = `stop_browser()` + SIGTERM rclone. C3 `cancel_closes_the_window` runs `serve` and `cancel` as processes. | Whether `serve_with`'s main thread blocks only in interruptible calls (`serve_forever` is; nothing else visible). |
| **PL-050** token-less exit leaves `waiting`; taken port tracebacks | **holds**, with two caveats (G-C-02, G-C-03) | `@@ -260,6 +311,16 @@`: `elif not self.token and not self.superseded: if read_state().get("status") in ("starting", "waiting"): write_state(status="failed", error=self.failure_reason())`. `@@ -1781,12 +2083,34 @@`: `except OSError as exc: why = …EADDRINUSE…; write_state(status="failed", error=why); return 2`; the outer `finally` kills rclone. C3 `collector_marks_a_dead_attempt_failed`, `taken_port_fails_cleanly`. | `failure_reason()`'s words; `stop_other_serves()`; `cancel`'s own state write. |
| **PL-051** unescaped `sed` into the conf, and the conf is sourced | **holds** for the writer and the two readers the harness runs | `@@ -44,6 +44,54 @@` `conf_set` (values via `env` → awk `ENVIRON`, temp + `mv -f`, `return 1` on failure) and `conf_get` (`sed -n "s/^$1=//p" … | head -1 | sed 's/^"\(.*\)"$/\1/'`); `syncpath_problem` refuses `*[\"\$\`\\]*|*[[:cntrl:]]*`; `--info` (`@@ -254,7 +332,7 @@`) and `--seed-folders` (`@@ -437,28 +519,55 @@`) read through `conf_get`, the `eval "$(grep …)"` is gone. C1: `&`, `|` round-trip; `$(touch …)` refused at entry and inert when already written; read-only `/storage` is a failure, not OK. | Other `cloud_setup` subcommands that may still source the conf (G-C-05); the other cloud scripts (stream A) still source it — the report says so. |
| **PL-074** rclone stderr logged verbatim | **holds** | `cloud_oauth @@ -335,7 +415,14 @@`: `log("rclone could not save the remote (exit %d)")`, fixed sentence returned; `cloud_remote @@ -93,8 +83,13 @@`: `log("rclone %s failed (%d)" % (verb, proc.returncode))`, verb only. C3 `rclone_text_stays_out_of_the_log`, `remote_create_logs_no_secret` (`SECRETPASS9` absent from `cloud_sync.log`). | `cmd_create`'s handling of the `stderr` `rclone()` still returns (G-C-09). |

---

## 2. Findings

### G-C-01: "Close page" is proven only as far as the phone; the serve's `escape` mapping is not in the diff
- **Severity:** Medium
- **Category:** Test coverage / unverified mechanism (gpt F-RS-16's "way out")
- **Where:** `cloud_oauth` REMOTE_PAGE `@@ -733,19 +832,27 @@` (`<button type=button class=minor data-key=escape>Close page</button>`); `cloud-signin-window.c @@ -444,8 +483,11 @@` (new comment: "Escape is what the phone's 'Close page' sends"); harness C4 `aWayToCloseFromThePhone` and the `device()` model (`if (k === "escape") closed = true;`).
- **What:** The page posts `key=escape`. Whether the serve's named-key path / `RemoteKeyboard.press("escape")` knows that name is outside the diff: the only `RemoteKeyboard` hunk (`@@ -1186,6 +1350,16 @@`) is context, and no key table changes. The C4 model declares the handheld closed the instant the post leaves the phone, so it cannot fail on the serve side. The same file records, in the same diff, that the previous comment "cloud_oauth maps Start to Escape" was false — so an Escape mapping cannot be assumed from history either.
- **Failure scenario:** A pad the bridge cannot read and no USB keyboard — exactly gpt F-RS-16's case. The player taps Close page; the serve drops the unknown name silently (the silent-drop pattern claude F-RS-16 was about); the fullscreen window stays.
- **Evidence:** Looked for an `"escape"` entry or any change to the named-key table in the diff; none. The window side is fine (`on_key` handles `GDK_KEY_Escape`, context lines). What settles it: one grep of `cloud_oauth` for `escape` in `RemoteKeyboard`'s table, or a C3 case that drives `press("escape")` through the real class.

### G-C-02: The collector's new "failed" write is guarded within one process only, and every teardown now wakes it
- **Severity:** Medium
- **Category:** Correctness (race) / session state
- **Where:** `cloud_oauth @@ -260,6 +311,16 @@` (`elif not self.token and not self.superseded:` … `if read_state().get("status") in ("starting", "waiting")`); `@@ -1528,6 +1740,13 @@` (`SessionHolder.end()` SIGTERMs rclone); `@@ -1773,7 +2056,26 @@` (`finally: holder.end()` on every exit); `@@ -84,12 +87,31 @@` (`write_state` merges `existing.update(fields)`).
- **What:** `superseded` is set only in `SessionHolder.start` (`@@ -1482,6 +1680,10 @@`) — same process. Every serve exit (cancel, timeout, bind failure, signed-in) now runs `holder.end()`, which SIGTERMs rclone and wakes the collector; the only cross-process guard is the status test. Two consequences: (a) `cancel` alone leaves `status=failed` with whatever `failure_reason()` says of a SIGTERMed rclone; (b) `cancel` → new `serve` → `reset_state(status="starting")` can be overwritten by the predecessor's dying collector, and because `write_state` merges, its `error` key survives the successor's own `status="waiting"` write.
- **Failure scenario:** ES's `cloudOAuthStart` runs `cancel` then `serve` (plan, PL-049 verdict). The new attempt's `session.json` carries `error: "<reason for the old one>"` beside `status: waiting`; the interface or the phone page shows an error for an attempt that is alive; or, after a plain cancel, `status` reads a failure the player caused.
- **Evidence:** Whether `stop_other_serves()` waits for the predecessor to exit, whether the collector thread is a daemon, whether `cancel` writes its own status, and what `failure_reason()` returns without rclone output are all outside the diff. `taken_port_fails_cleanly` shows the intra-process ordering is right (status already `failed` before `end()`); no C3 case reads state after `cancel` or after a serve timeout. Also noted: a SIGTERM that lands during `Session.start()` (up to `AUTHORIZE_WAIT` seconds) unwinds before `self.session` is assigned (`with self.lock:` follows `session.start()`), so `end()` never reaches that rclone — mitigated only if the next `start()` kills stale `authorize` processes, as the `superseded` comment implies.

### G-C-03: New player-facing strings outside the register, and two output shapes for one refusal
- **Severity:** Low
- **Category:** Player text (`es-player-text.md` § Outcome vocabulary; anti-patterns)
- **Where:** `cloud_oauth @@ -1781,12 +2083,34 @@` (`why = "port %d is already in use on this device"` → `write_state(status="failed", error=why)`); `cloud_setup @@ -377,23 +460,22 @@` (`echo "The cloud sync settings could not be saved, so the folder was not changed."` in the same `case` arm as `echo "ERROR empty path"`); `@@ -160,6 +208,8 @@` ("Your cloud folder's name can't contain …" beside "Your saves folder needs to sit inside another folder …").
- **What:** A port number in `error` is the "exit code or path on a screen" the rule forbids; the plan's PL-050 asked for the same `failure_reason()` shape as the collector's. The `--set-saves-remote` write failure has neither the `OK` nor the `ERROR` prefix its siblings use. Two names for the same folder in adjacent messages.
- **Failure scenario:** The interface shows "port 8080 is already in use on this device" (with OFFLINE RETROACHIEVEMENTS on and no LAN route, the one case the wildcard bind remains).
- **Evidence:** The rule text in SOURCE 8; I cannot see how ES renders `error` or parses `--set-saves-remote`'s output.

### G-C-04: The harness block's header claims every case failed first; the report says 25 of 79 did not
- **Severity:** Low
- **Category:** Evidence / documentation
- **Where:** `C.harness.txt` lines 2–4 ("Every case below was written before its fix and seen to FAIL against the script it grades"); `C.report.md` § Summary ("the block reads **54 FAIL, 25 PASS**. The 25 are guards that pass on the old code too").
- **What:** Regression guards that pass on the old code are legitimate (e.g. "a replaced attempt's collector does not mark the new attempt failed" — the old `_collect` wrote nothing, so it passes trivially; "a two-level folder is stored with its siblings"; "an owner's README is left alone when the folder lists"), but the header is what the next reader of the harness trusts, and it is not true of a third of the block.
- **Failure scenario:** A later editor removes a fix believing every green line would go red.
- **Evidence:** The two quoted lines.

### G-C-05: "cloud_setup's own readers now run nothing" is proven for two subcommands
- **Severity:** Low (cannot tell)
- **Category:** Already written / claim wider than its test
- **Where:** `C.report.md` PL-051 "Already written"; diff hunks `@@ -254,7 +332,7 @@` (`--info`) and `@@ -437,28 +519,55 @@` (`--seed-folders`) — the only reads converted to `conf_get`.
- **What:** `--content-location` uses `CP` and `REMOTE` (context in `@@ -290,10 +368,13 @@`) set above the hunk; `--check-syncpath`, `--use-content-root` and the rest are not shown reading the conf. If any still sources it, an already-written `$( )` still runs there. C1 proves `--info` and `--seed-folders` only.
- **Failure scenario:** The conf the harness's own case constructs (`SAVES_REMOTE="/y$(touch …)/Saves"`) run through `--content-location`.
- **Evidence:** No other `conf_get` call or removed `. "${SYNC_CONF}"` appears in the diff. Settled by a grep of `cloud_setup` for `SYNC_CONF` sourcing/eval, or one more C1 line.

### G-C-06: `conf_get` and the scripts that still source the conf can read one file two ways
- **Severity:** Low
- **Category:** Least surprise / upgrade compatibility
- **Where:** `cloud_setup @@ -44,6 +44,54 @@` (`conf_get`: `head -1`, strips one balanced pair of double quotes only).
- **What:** A sourcing reader takes the *last* `KEY=` line and honours any shell quoting; `conf_get` takes the *first* and only `"…"`. A hand-edited conf with a duplicate key, a single-quoted value, or a trailing comment reads one way on `--info` (what ES shows) and another in `cloud_backup`/`cloud_restore` (stream A, still sourcing per the report).
- **Failure scenario:** The folder shown on the screen is not the folder the sync uses.
- **Evidence:** The scripts write one line per key with double quotes (the shipped conf in C1: `SAVES_REMOTE="/ROCKNIX/Saves"`), so the scripts' own output is safe; the gap is player-edited files. Nothing in the packet says how common those are.

### G-C-07: The symbols key is proven in the table, not on the keyboard
- **Severity:** Low (cannot tell)
- **Category:** Test coverage
- **Where:** `cloud-signin-window.c @@ -76,7 +82,21 @@` (`OSK_EXTRAS` grows to seven entries, `OSK_TO_SYMBOLS` last); harness C8 `osk.py` (reads `OSK_LOWER`/`OSK_UPPER`/`OSK_SYMBOLS`/`OSK_EXTRAS` tables); `osk_relabel` finds the layout key by its *current label*.
- **What:** The loop that builds `osk->keys[OSK_ROWS][c]` from `OSK_EXTRAS` is outside the diff. If it iterates a literal 6 rather than `G_N_ELEMENTS(OSK_EXTRAS)`, the `#+=` key is never created, `osk_relabel`'s label search finds nothing, and every printable character is "reachable" only in the source. The report lists 640x480 frames of each layout as needed, which is the proof.
- **Failure scenario:** gpt F-RS-12 reported fixed; the password with `=` still cannot be typed.
- **Evidence:** Looked for the build loop in the diff; not present. Row lengths of `OSK_SYMBOLS` (10, 10, 9, 10) match `OSK_UPPER`'s context lines, so the relabel of the letter rows is sound.

### G-C-08: A constant was deleted under a "comments" row, with no reader check in the packet
- **Severity:** Low
- **Category:** Evidence (`engineering-practices.md` § Before deleting a duplicate; § A name is not a behaviour)
- **Where:** `cloud_remote @@ -44,24 +44,14 @@` (`DRIVABLE_OAUTH = "all"` removed); `C.report.md` sweep row claude F-RS-14 ("the dead `DRIVABLE_OAUTH` constant is removed. No test can exist for a comment").
- **What:** Removing a name is code, not prose, and it is testable: a grep, or running the tier/provider listing. The packet holds neither. C3's `load_remote` exercises `create` only.
- **Failure scenario:** A `NameError` in whatever `cloud_remote` command classified the "oauth" tier, on the wizard's provider list.
- **Evidence:** The report says "nothing read them" without a grep line; the plan's row named `cloud_oauth`'s `exit_hint()` docstring and `info` comment, not `cloud_remote`.

### G-C-09: PL-074 covers the log; `cloud_remote.rclone()` still hands rclone's stderr to its callers
- **Severity:** Low (cannot tell)
- **Category:** Credentials
- **Where:** `cloud_remote @@ -93,8 +83,13 @@` (`return proc.returncode, proc.stdout, proc.stderr` unchanged); `cmd_create` hunk `@@ -271,7 +269,11 @@` shows only the existing-remotes branch.
- **What:** The finding the stream added (a failed `config create` echoing `pass=`) is stopped at `cloud_sync.log`. Whether `cmd_create` writes the returned `stderr` to its own stderr — which ES captures and may log or show — is outside the diff, and `remote_create_logs_no_secret` reads only `LOG_FILE`.
- **Failure scenario:** The password reaches `es_log.txt` or a dialog instead of `cloud_sync.log`.
- **Evidence:** Settled by reading `cmd_create`'s failure branch.

### G-C-10: Bytes read past the link skip the per-line "last words" check
- **Severity:** Low
- **Category:** Correctness edge
- **Where:** `cloud_oauth @@ -202,18 +232,39 @@` (`os.read(fd, 4096)` into `pending`; `self.early_output = pending.decode(...)`); `@@ -229,7 +280,7 @@` (`buffer = getattr(self, "early_output", "")` then `for line in self.proc.stdout: … if line.startswith("Error: ") or "Fatal error:" in line:`).
- **What:** Anything rclone printed in the same chunk as the link goes into `buffer` but never through the `Error:`/`Fatal error:` test that feeds `failure_reason()`. An rclone that fails within one read of printing its link loses its last words; PL-050's new state write then carries the generic reason. Mixing `os.read` on the fd with the later `TextIOWrapper` iteration is otherwise safe because no wrapper read precedes it.
- **Failure scenario:** rare; a provider that rejects at once.
- **Evidence:** The two hunks. `select` is not shown imported in the diff; the C3 groups that call `start()` would `NameError` if it were missing, so the reported PASS is the evidence it exists.

### G-C-11: PL-015's refusal lives in a shared validator; the upgrade answer is asserted, not shown
- **Severity:** Low (cannot tell)
- **Category:** Already written (`upgrade-and-install.md` D-WORKFLOW-050)
- **Where:** `cloud_setup @@ -160,6 +208,8 @@` (the one-level refusal is inside `syncpath_problem`, before `[ -n "${remote}" ] || return 0`); `C.report.md` PL-015 ("This fix reads nothing from it"); the report also says "The harness's case l lifts that function on its own", i.e. another consumer exists.
- **What:** A device upgraded with a stored one-level folder (`/GAMES`) is refused wherever `syncpath_problem` re-validates a stored path, not only at entry. The two callers in the diff are entry points; any other caller is outside the packet.
- **Failure scenario:** A review/repair step that re-checks the configured folder tells an upgraded player to move saves that are working.
- **Evidence:** No grep of `syncpath_problem`/`--check-syncpath` callers in the packet.

---

## 3. Sweep rows

Spot-checked against the diff (fixed rows):

| seat / id | Verdict on the packet |
|---|---|
| claude F-RS-04 | **holds** — `package.mk @@ -70,12 +70,19 @@`: `-DENABLE_MINIBROWSER=OFF`, with the reason beside the option (the "constraint lives beside the thing" rule). Harness C6 greps it. `pkgcheck` output and the image's `unsquashfs` are not in the packet. |
| claude F-RS-09 | **holds** — `seed_note` lists the folder rather than the file; bucket mode in C2 writes five READMEs. |
| claude F-RS-13 / gpt F-RS-19 (setup half) | **holds** — `"${RCLONE_LIST_OPTS[@]}"` on `lsf`, `mkdir`, `copyto` in `--content-location` and `--seed-folders`; C2 `unbounded()` reads every argv. The array's definition is outside the diff. |
| claude F-RS-16 / gpt F-RS-13 | **holds** — `typable()` strips `[^ -~]`, names the characters, on every `input` event; C4 `untypableCharactersSaySo`. |
| claude F-RS-17 | **holds** — `focus_first` returns for anything but body/documentElement; C8 `0 1 0`. Trade-off (a page that focuses a non-field decoy is now left alone) is stated in the comment. |
| claude F-RS-18 | **holds** — `listen = "0.0.0.0" if address == "127.0.0.1" else address`; C3 `listens_on_the_lan_address`, `coexists_with_the_offline_proxy`. The EADDRINUSE reasoning (a wildcard bind cannot coexist with a listening `127.0.0.1:port`) is correct. |
| claude F-RS-19 / gpt F-RS-25 | **holds** — `cursor_overridden` set in `start()`, restored in `stop()` regardless of `poll()`, and in `close`'s outlived-window path. C3 `cursor_timeout_is_restored`. |
| claude F-RS-20 | **holds in part**, as the report says — `page_worth_recording` skips `127.0.0.1`/`localhost` hosts only; anything else (userinfo, `[::1]`, no scheme) is recorded. Adequate for rclone's fixed redirect; a fail-open shape for a credential guard. |
| claude F-RS-21 | **holds** — `old mode 100644 / new mode 100755` on `cloud_oauth` and `cloud_device_id`. |
| claude F-RS-23 / gpt F-RS-17 | **holds** — `_write_whole` (temp + `os.replace`) under `_STATE_LOCK`; `reset_state` too. C3 `state_writes_are_whole` cannot pass on in-place truncation. Cross-process read-modify-write is still unserialised (see G-C-02's merge note). |
| claude F-RS-26 | **holds** — prose before the first `---` in patch 0001; C6 checks every patch and dry-applies when the tarball is cached (SKIP line otherwise, honestly labelled). |
| gpt F-RS-12 | **holds on the table** (G-C-07 for the key itself). |
| gpt F-RS-14 | **holds** — `type=password`, Show/Hide toggle, the "network you trust" sentence. |
| gpt F-RS-16 | **holds in part** — hat detection and bridging (`_capabilities`, `HAT_KEYS`, EV_ABS branch; C3 `hat_dpad_is_found_and_bridged`) hold. The phone Close key is G-C-01. The row's "the fullscreen flow still starts" half (no pad found at all) is unchanged in the diff. |
| gpt F-RS-18 | **holds** — `MAX_BODY` checked before the body is read (413/400), `Handler.timeout = REQUEST_TIMEOUT`, `BoundedHTTPServer` with a `BoundedSemaphore` released in `process_request_thread`'s `finally`. C3 `requests_are_bounded`. |
| gpt F-RS-20 | **holds** — `grep -q '^CONTENT_REMOTE='` distinguishes empty from absent; `${CONTENT:+"${CONTENT}"}`; root README skipped. C2 both cases. No `Already written` note in the report for the `/ROCKNIX/Content` an earlier build seeded into such a cloud (it stays; nothing moves it — acceptable under "never move what you did not put there", but unstated). |
| gpt F-RS-21 | **holds** — `remember_previous` verifies the line is there afterwards; `heal_poisoned` returns 1 with a WARN before `write_id`. C5 makes `.previous` a directory. |
| gpt F-RS-23 | **holds in both** — `existing_remotes()` → `None` and `cmd_create` rc 2; `_create_remote` refuses on `listed.returncode != 0`. C3 both halves. |

Withdrawn rows, judged from the packet:

- **gpt F-RS-26** (English-only surfaces): the reason holds on the rule as embedded — `es-player-text.md` § "Every fork string ships in English and French" says the cloud pages and the fork's strings since 2026-08 "have no French yet and are a follow-up", and D-UI-051's same-commit rule is written for `_("")` strings, which these GTK labels and HTML are not.
- **claude F-RS-15** (rule-file drift): the plan's ownership list excludes `.claude/rules/`; the withdrawal to the integrator is consistent with it. Whether the "only where technically unavoidable" exception covers the console SSH forward cannot be judged here (`rclone-cloud-sync.md` is not embedded).
- **claude F-RS-11 / gpt F-RS-24** (sandbox): the ownership argument (new bubblewrap/xdg-dbus-proxy packages are not in C's files) is consistent with the plan. The frame-filter refutation cites `on_decide_policy`'s comment, which is not in the diff — unverifiable here.
- **claude F-RS-25** (`-j4`): "upstream fit / maintainer's call" cites `device-builds.md`, not embedded; the `packaging-and-patches.md` rules in the packet say nothing about parallelism, so nothing here contradicts the withdrawal.
- **claude F-RS-20** (rest): "every ROCKNIX process runs as root" is not checkable from the packet; the argument's shape (no new reader) is coherent.
- **Open rows** claude F-RS-10 / gpt F-RS-15 / claude F-RS-12: the report's reasons (a device's `es_input.cfg`; a real provider hop) are facts the plan forbade this stream from gathering; leaving them open with the reason is what the plan asks.

---

## 4. Coverage boundary

Not judgeable from this packet, stated plainly:

- **Callees outside the diff** that the verdicts lean on: `deliver()` (PL-016/017), `RemoteKeyboard`'s named-key table (G-C-01), `GamepadBridge.stop()` and the head of `_run`'s loop (PL-018 ordering), `stop_other_serves()`, `cancel`, `failure_reason()`, `lan_address()`, `pad_is_free()`, `RCLONE_LIST_OPTS`, `OSK_LOWER` and the extras-row build loop, `osk_type`'s handling of shifted symbols, `syncpath_problem`'s other callers, `--content-location`'s `CP`/`REMOTE`, `cmd_create`'s stderr handling, `cloud_device_id`'s `log_message` arity (called with a second `"WARN"` argument in the diff), the `select` import, `_pin_page`'s callers (the new comment asserts "every caller passes nothing"), and how ES renders a two-line `--check-syncpath` refusal and the `error` field.
- **Runtime evidence**: no command in the packet was run by me. The 465/0/0 PASS count, the 54/25 old-code split, `pkgcheck webkitgtk`, the identical-tree rebase claim and every commit hash are the report's statements. The C3 sandbox needs bwrap `--unshare-net` with loopback up, python3, node, cc, patch on the runner; the harness FAILs (does not SKIP) when node/cc are absent, which is the right direction.
- **Device and guest proofs** the acceptances name and the report lists as undone: PL-016/017 curl-driven guest run and window log; PL-049 cancel with the page up; PL-018's pad fact for `device-facts.md`; OSK layout frames at 640x480; `focus_first` on a real provider page; a sign-in with OFFLINE RETROACHIEVEMENTS on; an image showing no `usr/libexec/webkit2gtk-4.1/MiniBrowser`.
- **Files this stream did not own** but its findings touch (per the report): `cloud_sync_helper`'s `/GAMES` derivation and `cloud_backup`'s nesting warning (stream A), the sourcing readers of the conf (stream A), a register row for plaintext on the LAN, `rclone-cloud-sync.md`'s "no browser on the device". None are in the packet.

---

## corpus.provenance.json

```json
{
  "seat": "C",
  "audit": "2026_09_28-milestone-audit-of-the-fixes-307",
  "facilitator": "council-facilitator@1.2.0",
  "read_mode": "embedded-corpus; no filesystem access; hashes as verified by the Facilitator at embed time, not re-computed by this seat",
  "manifest_read_timestamp_utc": "2026-09-28T04:20:24Z",
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
  "sources_needed_but_not_embedded": [
    "projects/ROCKNIX/packages/network/rclone/sources/cloud_oauth (full file: RemoteKeyboard key table, GamepadBridge.stop, stop_other_serves, cancel, failure_reason, lan_address, pad_is_free, select import)",
    "projects/ROCKNIX/packages/network/rclone/sources/cloud_setup (full file: RCLONE_LIST_OPTS, --content-location's CP/REMOTE, other syncpath_problem callers)",
    "projects/ROCKNIX/packages/network/rclone/sources/cloud_remote (full file: cmd_create failure branch, any DRIVABLE_OAUTH reader)",
    "projects/ROCKNIX/packages/network/cloud-signin-window/sources/cloud-signin-window.c (full file: OSK_LOWER, extras-row build loop, osk_type)",
    ".claude/rules/rclone-cloud-sync.md",
    "the harness run logs (old-block.log, new-block.log, final.log) and pkgcheck output the report cites"
  ]
}
```