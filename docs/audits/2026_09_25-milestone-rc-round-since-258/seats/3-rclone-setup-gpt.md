# 1. Summary

This bucket adds provider discovery, remote configuration, an OAuth broker, a phone keyboard, and a WebKit sign-in window, alongside device-identity and cloud-folder helpers. The changes are not ready to submit unchanged. The phone keyboard transmits provider credentials over plaintext HTTP, while folder seeding and layout generation contain paths that can destroy existing cloud data. OAuth completion and cancellation also mishandle state and process ownership, including reporting success before verification and leaving a fullscreen window behind after cancellation. This review is limited to the embedded corpus: no build, device test, filesystem read, or independent hash verification was performed.

# 2. Findings

Source references **S1–S7** resolve to the declared paths and embed-time SHA-256 values recorded under **Coverage boundary**. All implementation references below are to actual added-file hunks in S1, narrowed by function or branch; line numbers have not been reconstructed.

### F-RS-01: The phone keyboard transmits provider credentials over plaintext HTTP
- **Severity:** Critical
- **Category:** Security
- **Where:** `projects/ROCKNIX/packages/network/rclone/sources/cloud_oauth:@@ -0,0 +1,2022 @@` — `cmd_serve`, `REMOTE_PAGE`, `Handler.do_POST`
- **What:** Passwords entered through the phone keyboard are sent as ordinary HTTP form data. The PIN authenticates requests but provides neither transport confidentiality nor protection against modification of the served keyboard page.
- **Failure scenario:** A player uses the phone keyboard on an untrusted network. An attacker controlling the access point or another point on the traffic path can read the PIN and password, or modify the keyboard JavaScript.
- **Evidence:** S1 constructs `bare = "http://%s:%d"`, uses `ThreadingHTTPServer(("0.0.0.0", port), None)`, and sends `"type=" + encodeURIComponent(...)`. I checked for TLS or an authenticated encryption layer; neither is present. The PIN gate does not refute the transport exposure.
- **Fix:** Use an authenticated encrypted channel, or remove credential typing over the LAN. Increasing PIN length alone does not resolve this.
- **Confidence:** high — the transport and credential payload are explicit.

### F-RS-02: README seeding overwrites an existing file when its existence probe fails
- **Severity:** Critical
- **Category:** Data loss
- **Where:** `projects/ROCKNIX/packages/network/rclone/sources/cloud_setup:@@ -0,0 +1,607 @@` — `--seed-folders`, `seed_note`
- **What:** Every failed README probe is treated as permission to write a replacement. A normal `copyto` then overwrites the destination, contradicting the promise never to clobber an owner's note.
- **Failure scenario:** An owner has a custom `README.txt`; its listing fails transiently, but the following upload succeeds. The generated note replaces the owner's file.
- **Evidence:** S1 uses `rclone lsf .../README.txt ... && return 0`, followed by unconditional `rclone copyto`. There is no distinction between missing and unreadable, or a no-clobber write. Conversely, the bucket behavior documented in S5—an absent prefix listing successfully as empty—can make this probe skip a README that does not exist.
- **Fix:** Distinguish confirmed presence, confirmed absence, and an unreadable destination. Refuse on uncertainty and use a no-clobber/conditional creation mechanism, including protection against another device creating the file after the probe.
- **Confidence:** high — the error-to-overwrite path is explicit.

### F-RS-03: Root-level and colliding saves paths produce destructive layouts
- **Severity:** Critical
- **Category:** Data loss
- **Where:** `projects/ROCKNIX/packages/network/rclone/sources/cloud_setup:@@ -0,0 +1,607 @@` — `--set-saves-remote`
- **What:** The setter can put settings backups and content inside the saves tree, or make a second tier identical to it. This violates the separation required to keep a saves mirror from deleting those files.
- **Failure scenario:** Setting `/GAMES` produces settings `/GAMES/Backups` and content `/GAMES/Content`. A saves-only mirror with the documented `--delete-excluded` behavior can delete those tiers without re-uploading them. Setting `/ROCKNIX/Backups` also makes saves and settings share a destination.
- **Evidence:** S1 contains `[ "${SP_PARENT}" = "/" ] && SP_PARENT="${NEWPATH}"`, then derives `${SP_PARENT}/Backups` and `${SP_PARENT}/Content`. No disjointness check follows. S5 explicitly documents the destructive nested-settings case.
- **Fix:** Enforce non-overlapping tier destinations, including root-level paths and reserved sibling names. Handle configurations already written by this code through compatible reads or a non-destructive, verified migration, as required by S3.
- **Confidence:** medium — the unsafe paths are certain; the destructive transfer implementation is outside this packet, although S5 expressly documents its behavior.

### F-RS-04: Setup diagnostics record credentials
- **Severity:** High
- **Category:** Security
- **Where:**  
  `projects/ROCKNIX/packages/network/rclone/sources/cloud_remote:@@ -0,0 +1,403 @@` — `rclone`, `cmd_create`  
  `projects/ROCKNIX/packages/network/cloud-signin-window/sources/cloud-signin-window.c:@@ -0,0 +1,854 @@` — `on_key`  
  `projects/ROCKNIX/packages/network/rclone/sources/cloud_oauth:@@ -0,0 +1,2022 @@` — `BrowserSession.start`
- **What:** Failed configuration commands log their complete arguments, including supplied passwords and keys. Separately, enabling sign-in debugging records individual credential keystrokes in `window.log`.
- **Failure scenario:** A remote creation fails after receiving `password=...` or another secret setting; the secret is appended to `cloud_sync.log`. A debug-enabled provider login similarly records the password's characters.
- **Evidence:** S1 logs `" ".join(args)` on command failure; `cmd_create` appends every `key=value`. The C handler logs `event->string` and `event->keyval`, and the launcher redirects its output to `window.log`. The safe summary log and `--obscure` do not sanitize these separate sinks.
- **Fix:** Redact sensitive configuration values before logging, and remove raw character/key-value logging from credential entry. Diagnose delivery using non-content metadata.
- **Confidence:** high — both logging paths are explicit.

### F-RS-05: Configuration is marked complete before creation or verification succeeds
- **Severity:** High
- **Category:** Concurrency
- **Where:** `projects/ROCKNIX/packages/network/rclone/sources/cloud_oauth:@@ -0,0 +1,2022 @@` — `Session._write_config`, `_collect`, `submit`
- **What:** `self.configured` means “an attempt started,” but subsequent callers interpret it as successful completion. The collector and submitted-code path can enter this method concurrently.
- **Failure scenario:** The collector sets the flag and starts a slow verification. `submit()` then calls `_write_config()`, receives success immediately, displays “Connected,” and schedules shutdown—even if creation or verification subsequently fails.
- **Evidence:** S1 returns success when `self.configured` is true, then sets it true *before* checking existing remotes, creating the remote, or verifying it. I checked for a per-session lock or a stored completed result; neither guards this operation.
- **Fix:** Serialize configuration, distinguish in-progress/succeeded/failed states, and make every caller await the same final result. Mark success only after verification.
- **Confidence:** high — both callers and the premature flag transition are visible.

### F-RS-06: Cancellation kills the broker without cleaning up its browser
- **Severity:** High
- **Category:** Resource
- **Where:** `projects/ROCKNIX/packages/network/rclone/sources/cloud_oauth:@@ -0,0 +1,2022 @@` — `stop_other_serves`, `cmd_serve`, `cancel`, `BrowserSession`
- **What:** Cancellation and replacement send SIGTERM to the broker, but no SIGTERM handler routes that signal through cleanup. Its separately spawned fullscreen browser can survive while its controller bridge dies.
- **Failure scenario:** Cancel or start another setup while the sign-in window is open. The old broker exits, leaving the old window covering the screen without the gamepad-to-keyboard bridge.
- **Evidence:** S1 calls `os.kill(..., signal.SIGTERM)` and later resets state. Browser cleanup exists only in `cmd_serve`'s `finally`; ordinary SIGTERM termination does not execute that block. No signal handler, child process-group termination, or parent-death mechanism appears.
- **Fix:** Implement graceful signal-driven shutdown and wait for owned children to exit. Provide a verified fallback cleanup for cancellation and interrupted startup.
- **Confidence:** high — process creation, termination, and cleanup ownership are visible.

### F-RS-07: An OAuth process that exits without a token remains “waiting”
- **Severity:** High
- **Category:** Correctness
- **Where:** `projects/ROCKNIX/packages/network/rclone/sources/cloud_oauth:@@ -0,0 +1,2022 @@` — `Session._collect`, `cmd_serve`
- **What:** The collector updates failure state only after receiving a token and failing configuration. A failed authorization that produces no token never transitions the on-device session out of waiting.
- **Failure scenario:** The provider refuses an authorization or rclone exits with an exchange error. The listener is gone, but `cloud_oauth status` remains `waiting` until the overall server timeout.
- **Evidence:** After `self.proc.wait()`, S1's only completion branch is `if self.token and not self.configured:`. `failure_reason()` is consulted by `submit()`, not by the direct on-device completion path. No independent process-failure monitor refutes this.
- **Fix:** Record a terminal failure for every unsuccessful authorize-process exit and expose a restartable outcome to the caller. Prevent an obsolete session's collector from overwriting a replacement session's state.
- **Confidence:** high — the missing terminal branch is explicit.

### F-RS-08: Text entered before the browser opens is never flushed
- **Severity:** High
- **Category:** Correctness
- **Where:** `projects/ROCKNIX/packages/network/rclone/sources/cloud_oauth:@@ -0,0 +1,2022 @@` — `REMOTE_PAGE`
- **What:** The phone page invites pre-entry before CONTINUE, but opening the browser does not deliver that buffered text. Its instruction to use a send button names a control that does not exist.
- **Failure scenario:** Scan the QR, paste credentials, and choose CONTINUE on the handheld. The phone changes to “Connected,” but nothing is typed; pressing the page's Enter button sends only Enter.
- **Evidence:** S1 calls `deliver(box.value)` only from input handling while `ready`. Polling merely assigns `ready = open`; it never flushes the value. I checked the entire template for the promised send button or equivalent action and found none.
- **Fix:** Provide an explicit send action or flush buffered text after a genuine input-ready acknowledgement. Do not advertise a nonexistent control.
- **Confidence:** high — the template and all delivery call sites are supplied.

### F-RS-09: Phone keyboard buttons desynchronize its text model
- **Severity:** High
- **Category:** Correctness
- **Where:** `projects/ROCKNIX/packages/network/rclone/sources/cloud_oauth:@@ -0,0 +1,2022 @@` — `REMOTE_PAGE`, `[data-key]` handlers
- **What:** The on-page Back and Enter buttons bypass the `box.value`/`sent` bookkeeping used by physical keyboard events. Subsequent typing can therefore differ from what the phone displays.
- **Failure scenario:** Type `abc`, tap Back, then type `d`. The handheld receives `abd`, while the phone displays `abcd`. A password is silently changed.
- **Evidence:** S1's generic button handler only calls `send("key=" + b.dataset.key)`. In contrast, the keydown Backspace handler changes the local value and calls `deliver`; keydown Enter clears both strings. The ordered request queue preserves this incorrect sequence rather than repairing it.
- **Fix:** Route buttons and keyboard events through one state-aware action handler. Reset or reconcile the shadow buffer when submitting or changing fields.
- **Confidence:** high — the failing sequence follows directly from the JavaScript.

### F-RS-10: Folder names are written into shell configuration without escaping
- **Severity:** High
- **Category:** Correctness
- **Where:** `projects/ROCKNIX/packages/network/rclone/sources/cloud_setup:@@ -0,0 +1,607 @@` — `--set-saves-remote`, `--use-content-root`, `--info`
- **What:** User-supplied paths are interpolated directly into both a sed replacement and a subsequently sourced shell assignment. Write failures are ignored before printing `OK`.
- **Failure scenario:** With an existing configuration, a path containing `|` breaks the sed command but still reports success; `&` expands the matched line into the replacement. Literal shell substitutions in a path can execute when `--info` later sources the file.
- **Evidence:** S1 uses `sed -i "s|^${key}=.*|${key}=\"${value}\"|"`, then unconditionally prints `OK`. `--info` executes `. "${SYNC_CONF}"`. I checked for escaping, validation of these characters, transactional writing, or checked write statuses; none appears.
- **Fix:** Use a writer that correctly serializes shell values—or a non-executable configuration format—and atomically updates all affected keys. Report failure unless the write succeeds.
- **Confidence:** high — the interpretation boundaries and unchecked results are explicit.

### F-RS-11: Successful handoff returns before releasing the exclusive gamepad grab
- **Severity:** High
- **Category:** Concurrency
- **Where:** `projects/ROCKNIX/packages/network/rclone/sources/cloud_oauth:@@ -0,0 +1,2022 @@` — `SessionHolder.signed_in`, `wait`, `GamepadBridge`
- **What:** Successful authorization writes the completion marker while retaining the browser and gamepad bridge. `wait` immediately returns on that marker, bypassing its gamepad-release check.
- **Failure scenario:** A caller follows the documented suspend/wait/resume sequence. On success it reinitializes input while the broker still owns `EVIOCGRAB`, the exact ordering the `pad_is_free` documentation says can leave EmulationStation without a gamepad.
- **Evidence:** S1's `signed_in()` only creates the marker; `wait` returns inside the marker branch, before the `pad_is_free()` loop. Keeping the visual window open does not require keeping the input grab.
- **Fix:** Stop the bridge and acknowledge input release before publishing the completion condition. Keep the finishing window independently until the caller is drawing again.
- **Confidence:** medium — the ordering violation is certain; the EmulationStation caller and SDL reinitialization are outside the packet.

### F-RS-12: The handheld keyboard cannot enter ordinary password characters
- **Severity:** Medium
- **Category:** Correctness
- **Where:** `projects/ROCKNIX/packages/network/cloud-signin-window/sources/cloud-signin-window.c:@@ -0,0 +1,854 @@` — `OSK_LOWER`, `OSK_UPPER`, `OSK_EXTRAS`
- **What:** The two layouts omit printable characters commonly allowed in credentials, including `=`, `:`, quotes, brackets, backslash, comma, and `~`. There is no alternative symbol page.
- **Failure scenario:** A player's password contains `a=B:9`; it cannot be entered using the handheld-only path.
- **Evidence:** S1 supplies all layout strings and extras. Shift only swaps those two fixed layouts; no additional character-entry mechanism is implemented.
- **Fix:** Provide the full supported printable character set and an explicit strategy for non-ASCII credentials. Test every exposed key through actual field delivery.
- **Confidence:** high — this follows from the complete layout tables.

### F-RS-13: Unsupported phone characters are silently discarded
- **Severity:** Medium
- **Category:** Correctness
- **Where:** `projects/ROCKNIX/packages/network/rclone/sources/cloud_oauth:@@ -0,0 +1,2022 @@` — `RemoteKeyboard.type_text`, `Handler.do_POST`, `REMOTE_PAGE.deliver`
- **What:** Characters absent from the US key map are dropped without notifying the phone. The endpoint still returns 204 and the client records the entire string as sent.
- **Failure scenario:** Pasting a credential containing `é` sends a different credential while displaying the original on the phone.
- **Evidence:** S1 uses `if entry is None: continue`; the returned count is only logged. The response contains no rejection or delivery count, and `sent = v` happens independently of the response.
- **Fix:** Support the intended character repertoire, or reject unsupported input visibly before sending any of it. Advance client state only on acknowledged delivery.
- **Confidence:** high — the discard and false client accounting are explicit.

### F-RS-14: The phone displays passwords as ordinary text
- **Severity:** Medium
- **Category:** Security
- **Where:** `projects/ROCKNIX/packages/network/rclone/sources/cloud_oauth:@@ -0,0 +1,2022 @@` — `REMOTE_PAGE`
- **What:** The companion keyboard uses an unmasked text input for provider passwords as well as other fields.
- **Failure scenario:** A password entered for a masked field on the handheld remains readable on the phone screen.
- **Evidence:** S1 declares `<input id=kb ...>` without `type=password`, and deliberately retains its contents. No field-type synchronization or masking control appears. S7 requires passwords to be masked.
- **Fix:** Provide credential-safe masking, with an explicit reveal control where needed, and clear sensitive text at field/session transitions.
- **Confidence:** high — the HTML input type and retained value are explicit.

### F-RS-15: Sign-in ignores the player's configured controller bindings
- **Severity:** Medium
- **Category:** Convention
- **Where:**  
  `projects/ROCKNIX/packages/network/rclone/sources/cloud_oauth:@@ -0,0 +1,2022 @@` — `GAMEPAD_KEYS`, `GAMEPAD_HOLD`, `exit_hint`  
  `projects/ROCKNIX/packages/network/cloud-signin-window/sources/cloud-signin-window.c:@@ -0,0 +1,854 @@` — `osk_hints`
- **What:** Physical button codes and letter-based help are hardcoded independently of the player's interface bindings.
- **Failure scenario:** A player swaps confirmation/cancellation or uses a differently labelled controller; entering sign-in changes the controls and still advertises fixed A/B/X/Y instructions.
- **Evidence:** S1 maps `BTN_EAST` directly to Enter and `BTN_SOUTH` to Backspace. No configured-binding reader is present. S5 requires respecting controller mappings; S7 explicitly warns against hardcoded console letters and confirmation positions.
- **Fix:** Use resolved controller bindings and derive help from them, with the same conventions as the interface.
- **Confidence:** high — the fixed mapping and convention conflict are explicit.

### F-RS-16: Axis-based d-pads are rejected, but the fullscreen flow still starts
- **Severity:** Medium
- **Category:** Correctness
- **Where:** `projects/ROCKNIX/packages/network/rclone/sources/cloud_oauth:@@ -0,0 +1,2022 @@` — `find_gamepad`, `GamepadBridge.start`, `SessionHolder.start_browser`
- **What:** Controller discovery requires a key-coded d-pad and the bridge processes only key events. Failure to establish a bridge does not prevent successful browser startup.
- **Failure scenario:** A gamepad reports its d-pad through hat axes rather than `BTN_DPAD_UP`. No bridge starts, yet the page covers the screen and advertises a controller exit combination that cannot work.
- **Evidence:** S1 requires `BTN_SOUTH in codes and BTN_DPAD_UP in codes`; `GamepadBridge.start()` returns false when none matches, but its result is ignored. I checked for an alternative axis handler or a visible phone Escape/close control; neither appears.
- **Fix:** Support the actual resolved controller event types, validate the bridge before handing over the screen, and provide an independent accessible close action.
- **Confidence:** high — the stated capability input deterministically takes this failure path; affected physical models require device testing.

### F-RS-17: Session-state writes expose partial JSON to readers
- **Severity:** Medium
- **Category:** Concurrency
- **Where:** `projects/ROCKNIX/packages/network/rclone/sources/cloud_oauth:@@ -0,0 +1,2022 @@` — `write_state`, `reset_state`, `read_state`
- **What:** State is truncated and rewritten in place while other processes and threads read it. Parse failures are silently converted to an empty session.
- **Failure scenario:** An `info` or `status` request lands between truncation and completion of `json.dump`; it reports a blank address/PIN or `idle`. A concurrent merge can then persist an incomplete state.
- **Evidence:** S1 opens `session.json` with `"w"`; `read_state()` returns `{}` on `ValueError`. The holder lock does not protect these file operations, and no temporary-file replacement is used.
- **Fix:** Atomically replace complete state documents and serialize read-modify-write updates. Associate updates with a session generation.
- **Confidence:** high — partial-read and lost-update windows are visible.

### F-RS-18: Unauthenticated clients can consume unbounded request resources
- **Severity:** Medium
- **Category:** Security
- **Where:** `projects/ROCKNIX/packages/network/rclone/sources/cloud_oauth:@@ -0,0 +1,2022 @@` — `Handler.do_POST`, `cmd_serve`
- **What:** Request bodies are read before authentication, without a size cap or per-connection read timeout. The threaded server also has no visible concurrency limit.
- **Failure scenario:** A LAN client opens many requests with large or incomplete bodies. Threads and memory accumulate before the PIN gate is reached, competing with WebKit on a memory-constrained handheld.
- **Evidence:** S1 executes `self.rfile.read(length)` before `_gate(...)` and uses `ThreadingHTTPServer`. The ten-attempt PIN limit cannot protect work done before it, and the session timer is not a per-request resource bound.
- **Fix:** Limit request size and concurrent work, impose read deadlines, and reject malformed lengths before allocation or blocking reads.
- **Confidence:** high — the unauthenticated resource-consumption path is explicit.

### F-RS-19: Setup still contains waits that its stated deadlines do not bound
- **Severity:** Medium
- **Category:** Resource
- **Where:**  
  `projects/ROCKNIX/packages/network/rclone/sources/cloud_oauth:@@ -0,0 +1,2022 @@` — `Session.start`, `cmd_serve`  
  `projects/ROCKNIX/packages/network/rclone/sources/cloud_setup:@@ -0,0 +1,607 @@` — `--content-location`, `--seed-folders`
- **What:** The OAuth startup deadline surrounds a blocking `readline`, so it cannot expire while that read blocks. Several cloud setup operations also omit the bounded options used elsewhere.
- **Failure scenario:** An authorize process remains alive without producing another newline, or a provider stalls during content discovery/seeding. Setup outlives the apparent startup bound or spends default retry periods on repeated calls.
- **Evidence:** S1 checks the 20-second deadline only before `stdout.readline()`; the overall timer starts later. Content-location and seeding calls omit `RCLONE_LIST_OPTS`. I checked `--check` and `syncpath_problem`: those are bounded, but their protection does not cover these branches. S5 documents why default retries matter.
- **Fix:** Use deadline-aware subprocess I/O with termination/reaping, and apply appropriate operation and overall bounds throughout discovery and seeding.
- **Confidence:** high — the blocking and unbounded call sites are explicit.

### F-RS-20: Seeding ignores an intentionally empty content destination
- **Severity:** Medium
- **Category:** Upgrade path
- **Where:** `projects/ROCKNIX/packages/network/rclone/sources/cloud_setup:@@ -0,0 +1,607 @@` — `--use-content-root`, `--seed-folders`
- **What:** An empty `CONTENT_REMOTE` deliberately means the remote root, but seeding treats it as missing and substitutes `/ROCKNIX/Content`.
- **Failure scenario:** Run `--use-content-root`, then seed folders. The helper creates and documents a different content location from the configured one.
- **Evidence:** S1 writes `CONTENT_REMOTE=""` for the root choice, while seeding uses `CONTENT="${CONTENT_REMOTE:-/ROCKNIX/Content}"`. `--content-location` correctly distinguishes the empty-root case, so there is no consistent alternative interpretation.
- **Fix:** Distinguish unset from intentionally empty values and preserve the configured root during seeding.
- **Confidence:** high — both producer and inconsistent consumer are supplied.

### F-RS-21: Identity healing can discard the only recorded legacy folder name
- **Severity:** Medium
- **Category:** Upgrade path
- **Where:** `projects/ROCKNIX/packages/network/rclone/sources/cloud_device_id:@@ -0,0 +1,388 @@` — `remember_previous`, `heal_poisoned`, `previous_ids`
- **What:** Healing proceeds even when recording the previous identity fails. The log nevertheless claims the old ID was kept.
- **Failure scenario:** The stored poisoned ID has a custom prefix, `.previous` is unwritable, and the ID file is writable. Healing replaces the ID, but `--previous` no longer includes the custom legacy folder.
- **Evidence:** S1 ignores `remember_previous "${stored}"`'s return status before `write_id "${healed}"`. The guessed fallback names cover only the current device and hostname labels, not every previously stored prefix. Atomic replacement of the new ID does not preserve the lost history.
- **Fix:** Durably record and verify the old ID before committing the healed one, or retain an equivalent recovery record. Refuse or explicitly defer healing when preservation fails, following S3's interruption-safe migration rule.
- **Confidence:** high — the failing write and missing fallback case are explicit.

### F-RS-22: Programmatic top-level navigation bypasses the advertised host restriction
- **Severity:** Medium
- **Category:** Security
- **Where:** `projects/ROCKNIX/packages/network/cloud-signin-window/sources/cloud-signin-window.c:@@ -0,0 +1,854 @@` — `on_decide_policy`
- **What:** The allowed-host check applies only to user-gesture navigation, not to all top-level navigation. A page can navigate the whole window elsewhere without passing the restriction.
- **Failure scenario:** An allowed page executes a load-time `location.replace()` to an unrelated HTTPS host. The handler returns without checking that host.
- **Evidence:** S1 returns false immediately for `!webkit_navigation_action_is_user_gesture(action)`, before `host_permitted`. I checked for a separate main-frame restriction; none appears. Allowing necessary subframes does not require allowing arbitrary top-level redirects.
- **Fix:** Separate main-frame navigation from subresources and enforce the intended top-level policy, with explicit support for required authentication redirects. Do not present the current gesture filter as containment.
- **Confidence:** high — the bypass is a direct branch in the policy.

### F-RS-23: Existing-remote protection treats an enumeration error as absence
- **Severity:** Medium
- **Category:** Correctness
- **Where:**  
  `projects/ROCKNIX/packages/network/rclone/sources/cloud_remote:@@ -0,0 +1,403 @@` — `existing_remotes`, `cmd_create`  
  `projects/ROCKNIX/packages/network/rclone/sources/cloud_oauth:@@ -0,0 +1,2022 @@` — `Session._write_config`
- **What:** Both creation paths continue toward a modifying command when they cannot establish which remotes already exist. That does not enforce their stated promise to leave existing remotes untouched.
- **Failure scenario:** A working remote named `saves` exists, but its initial enumeration fails transiently. The guard treats it as absent and issues `config create saves ...`.
- **Evidence:** S1's `existing_remotes()` returns `[]` on nonzero status; the OAuth path inspects only `listremotes` stdout. No successful-enumeration requirement refutes this. The precise replacement behavior of the shipped rclone binary is not established here.
- **Fix:** Fail closed on enumeration errors and serialize the existence-check/create transaction against other setup writers.
- **Confidence:** high — proceeding after a failed guard is explicit; no particular overwrite behavior is assumed.

### F-RS-24: The remote-content renderer is built without its sandbox
- **Severity:** Medium
- **Category:** Security
- **Where:**  
  `packages/web/webkitgtk/package.mk:@@ -0,0 +1,107 @@` — `pre_configure_target`  
  `projects/ROCKNIX/packages/network/rclone/sources/cloud_oauth:@@ -0,0 +1,2022 @@` — `BrowserSession.start`
- **What:** WebKit's process sandbox is disabled for a window that loads provider pages and unrestricted third-party resources. The shown launcher supplies no replacement isolation.
- **Failure scenario:** A renderer vulnerability is exercised by page content; WebKit's configured sandbox cannot contain it. No exploit is demonstrated, and the invoking UID or enclosing service isolation is not supplied.
- **Evidence:** S1 sets `-DENABLE_BUBBLEWRAP_SANDBOX=OFF`; the launcher directly spawns the executable. The ephemeral context limits persistence, not process authority.
- **Fix:** Enable and package the sandbox, or provide and document an independently reviewed isolation boundary. Establish the runtime privilege and filesystem/network exposure on shipped images.
- **Confidence:** medium — sandbox removal is certain; effective system-level containment requires sources and runtime evidence outside this packet.

### F-RS-25: A browser that exits itself leaves the cursor override behind
- **Severity:** Low
- **Category:** Resource
- **Where:** `projects/ROCKNIX/packages/network/rclone/sources/cloud_oauth:@@ -0,0 +1,2022 @@` — `BrowserSession.start`, `BrowserSession.stop`
- **What:** The cursor timeout is restored only while the browser process is still alive.
- **Failure scenario:** The window exits through Escape, destruction, or a crash. Cleanup sees an exited process and leaves Sway's cursor timeout at zero.
- **Evidence:** S1 applies `_cursor_timeout(0)` during startup, but restores `1000` inside `if self.proc and self.proc.poll() is None`. The gamepad watchdog's later call to `stop()` therefore cannot restore it.
- **Fix:** Restore an applied override regardless of process liveness, preferably to the captured prior value.
- **Confidence:** high — the cleanup condition excludes the natural-exit path.

### F-RS-26: The new standalone setup surfaces remain English-only
- **Severity:** Low
- **Category:** Player text
- **Where:**  
  `projects/ROCKNIX/packages/network/cloud-signin-window/sources/cloud-signin-window.c:@@ -0,0 +1,854 @@` — UI strings  
  `projects/ROCKNIX/packages/network/rclone/sources/cloud_oauth:@@ -0,0 +1,2022 @@` — page templates
- **What:** These directly rendered product strings have no localization path, including instructions and recovery messages.
- **Failure scenario:** A player using French still receives English sign-in and companion pages.
- **Evidence:** S1 constructs literal GTK labels and HTML templates without translation lookup. S6 requires English and French, while acknowledging older cloud text as a follow-up; no implementation here closes that gap.
- **Fix:** Connect these surfaces to the supported language setting and provide the required translations, or explicitly carry the documented follow-up into the upstream submission rather than claiming coverage.
- **Confidence:** high — the complete standalone rendering code is supplied.

# 3. Upstream fit

- **The WebKit addition needs an explicit support and security commitment.** This is a substantial browser-engine and GStreamer dependency addition, not merely a QR-code feature. Reviewers will need supported-target build evidence, image-size and low-memory results, and a security-update plan. The historical measurements in comments are not supplied test artifacts. `ENABLE_MINIBROWSER=ON` also needs justification when the feature supplies its own window.
- **Build-host accommodations should not become unexplained global policy.** The fixed `-j4` limit may be justified, but the recipe explains it through one fork build machine's history. An upstream submission should state the general constraint and whether builders can safely override it.
- **The WebKit include patches should have upstream disposition.** Both patches are narrowly described include-path/header fixes. The packet does not establish whether they have been submitted upstream, superseded, or tested across the supported architectures.
- **Separate the reviewable changes.** Browser packaging, authentication/input brokering, device-identity healing, and cloud-layout changes have different failure domains. The diff does not expose commit history, so commit hygiene cannot be judged, but these should not arrive as one inseparable behavioral change.
- **Packaging closure is not demonstrated.** S4 requires runtime CLI dependencies to be declared. The owning rclone recipe and install hooks are absent, so the presence of Python, input tools, `ethtool`, the browser, and executable installation permissions cannot be verified. In particular, the added `cloud_oauth` and `cloud_device_id` source files have mode `100644`; that is a question for installation rules, not proof that their installed copies are non-executable.
- **Fork history should not substitute for contracts.** Numerous comments describe earlier designs, specific fork issues, VNC, or a phone-paste flow while the shipped path now differs. Retain useful rationale, but update interface/security claims to match the implementation.
- **No embedded account secret or personal workstation path was identified in the shown source.** The credential findings concern runtime transport and logging. New recipe/script files visibly carry SPDX and ROCKNIX headers; the packet does not establish provenance or credit requirements beyond the shown additions.

# 4. Coverage boundary

The following gaps are surfaced to the orchestrator, not treated as successful checks:

- **No EmulationStation implementation is embedded.** Despite the brief's discussion of a wizard and a pinned interface revision, the bucket contains zero interface files. Caller-side cancellation, suspend/resume sequencing, gating, translation integration, and actual input initialization remain unverified.
- **The destructive transfer consumers are outside the diff.** The layout finding uses the explicit destructive behavior documented in S5; the current backup/restore implementations, configuration defaults, migration helpers, and archive include lists must be inspected before resolving that finding.
- **No build or installed-image evidence is available.** Dependency closure, target compatibility, package lint, binary installation modes, dynamic linking, and the 1 GB runtime cannot be certified. The authoritative `packages/README.md` identified by S4 is not embedded.
- **No real-provider completion evidence is supplied.** Resolving an authorization URL does not establish successful login, token persistence, refresh, backend-specific configuration continuations, or embedded-browser compatibility. Those journeys need actual provider evidence.
- **GTK and input delivery require runtime tests.** Synthetic Enter/Delete routing, focus transitions, complete character delivery, controller variants, failure exits, and 640×480 rendering have not been exercised here.
- **Upgrade and clean-install rehearsals are absent.** Required seeds include deliberately empty content roots, previously generated nested destinations, custom poisoned IDs, unwritable history/configuration files, and interruption during updates.
- **Audit conformance is limited to the embedded standards.** S2 calls for primary evidence and blindspot review. Primary code evidence is used above, but the blindspot register and a complete acceptance-criteria artifact were not embedded. No tracker state, historical comment, or absent runtime result has been counted as PASS.

## `corpus.provenance.json`

The following is the provenance content for the orchestrator to save. The hashes are the Facilitator's **verified-at-embed-time** values, not hashes computed during this review. Parallel array entries refer to the same source.

```json
{
  "bucket": "3-rclone-setup",
  "review_mode": "static analysis of facilitator-embedded contents",
  "filesystem_access": false,
  "independently_reread_or_rehashed": false,
  "hash_algorithm": "sha256",
  "hash_verification": "Verified at embed time by the Council Facilitator",
  "manifest_read_timestamp_utc": "2026-09-27T22:58:44Z",
  "source_ids": [
    "S1",
    "S2",
    "S3",
    "S4",
    "S5",
    "S6",
    "S7"
  ],
  "source_file_paths": [
    "/workspace/repos/rocknix/docs/audits/2026_09_25-milestone-rc-round-since-258/seats/3-rclone-setup.diff",
    "/workspace/repos/rocknix/.claude/skills/code-auditor/references/anti-patterns.md",
    "/workspace/repos/rocknix/.claude/rules/upgrade-and-install.md",
    "/workspace/repos/rocknix/.claude/rules/packaging-and-patches.md",
    "/workspace/repos/rocknix/.claude/rules/rclone-cloud-sync.md",
    "/workspace/repos/rocknix/.claude/rules/es-player-text.md",
    "/workspace/repos/rocknix/.claude/rules/es-ui-style-guide.md"
  ],
  "source_file_hashes": [
    "ed2f1f4dddda0184c8076c4247b5eef7bc15627c908a72ec3427f8a7d1a319f1",
    "fd825c0505ae772ca2a6651eefe642581aaa147c254fed8cf50db1f8f1bde678",
    "de4a683f9a36f9100e6fd98be11ad84d736f370374c40f74c445a2b81eca1995",
    "2a44db10f4f179198b9366239eabe0900e1701145beced181536eb18bcbc0746",
    "92545b9e4528435e1bccdb8874d51efa7e80a41ea1d3d7f99029d45c6e2de658",
    "97c0816eabd3088ce94e3d45dec8042c1796afa3c295a9a8d080597ece817145",
    "150d0ac637626d771871eab48db995d8fc46c69ed7cf786240213649d264ad02"
  ],
  "source_gaps": [
    "EmulationStation wizard, caller lifecycle, and input initialization implementation",
    "Owning rclone package recipe, installation hooks, and installed dependency/executable evidence",
    "Current backup/restore consumers, configuration defaults, archive include lists, and migration implementation",
    "Authoritative packages/README.md",
    "Referenced blindspot register and complete acceptance-criteria artifact",
    "Runtime service isolation and invoking-user evidence",
    "Build results, target-device tests, provider round trips, and upgrade/clean-install rehearsal artifacts"
  ],
  "checks_not_performed": [
    "Filesystem reads or independent hash verification",
    "Compilation or package lint",
    "Command execution or runtime reproduction",
    "Device or VM testing",
    "Live provider authentication",
    "Upgrade or clean-install rehearsal"
  ]
}
```