# Audit — bucket 3-rclone-setup (rclone on-device setup and QR sign-in)

## Summary

The bucket adds a complete on-device OAuth path for rclone: `cloud_oauth` wraps `rclone authorize`, serves a PIN-gated LAN page, and drives a fullscreen WebKitGTK window (`cloud-signin-window`) from the handheld's pad and from a phone through two uinput devices; `cloud_remote` fills rclone's non-OAuth backends from its own provider catalogue; `cloud_device_id` gives each handheld a stable cloud folder name; `cloud_setup` keeps the SSH console flow and grows machine-readable flags for the interface. Four new packages (qrencode, libpsl, libsoup, webkitgtk plus two WebKit patches) carry the browser stack. The scripts are carefully reasoned in their comments and most edge cases named there are handled in code; the defects are where the code and its own comments part ways, and where a rule in the packet is contradicted by a line in the diff. The three that matter most: `cloud_setup --set-saves-remote` nests `SETTINGS_REMOTE` and `CONTENT_REMOTE` *inside* a root-level saves folder, the layout `rclone-cloud-sync.md` says deletes archives on a saves sync; the phone keyboard page never delivers text typed before the window opens and tells the player to use a "send button" that does not exist; and `cloud_oauth cancel` (and a second `serve`) SIGTERM a process with no handler, so the fullscreen window outlives the only thing that could drive or close it from the pad. Beneath those, the webkitgtk recipe ships MiniBrowser on a device whose design says "not a browser", libsoup's TLS backend is undeclared with the check that would notice disabled, and the gamepad bridge cannot start on any handheld whose d-pad is a hat axis, leaving no exit from the device.

## Findings

### F-RS-01: `--set-saves-remote` nests the settings and content folders inside a root-level saves folder
- **Severity:** High
- **Category:** Data loss
- **Where:** `projects/ROCKNIX/packages/network/rclone/sources/cloud_setup` (hunk `+1,607`), case `--set-saves-remote|--set-syncpath`, the `SP_PARENT` derivation and the `for key in SAVES_REMOTE SETTINGS_REMOTE CONTENT_REMOTE` loop
- **What:** When the new saves folder has one path component, `SP_PARENT` is set to the saves folder itself, so `SETTINGS_REMOTE` becomes `<saves>/Backups` and `CONTENT_REMOTE` becomes `<saves>/Content` — both inside the saves tree the saves phase syncs with an allowlist.
- **Failure scenario:** Player sets the cloud folder to `/GAMES` (the historic default named in `rclone-cloud-sync.md`) or `/mybucket` on S3. Config becomes `SAVES_REMOTE=/GAMES`, `SETTINGS_REMOTE=/GAMES/Backups`, `CONTENT_REMOTE=/GAMES/Content`. The next `--saves-only` backup that runs with a deleting method and `--delete-excluded` (the rule states phase 1 does) removes `Backups/*.zip` and every ROM/BIOS under `Content/` from the cloud, because the allowlist's final `- /**` excludes both.
- **Evidence:**
  ```
  SP_PARENT="$(dirname "${NEWPATH}")"
  [ "${SP_PARENT}" = "/" ] && SP_PARENT="${NEWPATH}"
  ...
  [ "${key}" = "SETTINGS_REMOTE" ] && value="${SP_PARENT}/Backups"
  [ "${key}" = "CONTENT_REMOTE" ] && value="${SP_PARENT}/Content"
  ```
  The block's own comment says "move the settings backups and the ROMs with it -- as SIBLINGS, never inside it" and then adopts "the folder itself when it sits at the root", which is nesting. `rclone-cloud-sync.md`: "**`SETTINGS_REMOTE` must be a sibling of `SAVES_REMOTE`, never inside it.** Phase 1 syncs `SAVES_REMOTE` with `--delete-excluded` ... a `--saves-only` run ... deletes the archives and puts nothing back." Refutation attempted: looked for a guard refusing single-component paths — `syncpath_problem` refuses only `/`; looked for the nesting warning — the rule places it in `cloud_backup`, outside the packet, and describes it as a warning, not a refusal.
- **Fix:** Refuse a single-component saves folder in `--set-saves-remote`/`--check-syncpath` with the same shape of message the S3 branch already prints ("Try something like /rocknix-saves-yourname/Saves"), or derive the siblings at the root (`/Backups`, `/Content`) when the parent is `/`. Add the case to whatever fixture exercises `syncpath_problem`.
- **Confidence:** medium — the derivation and the rule are both in the packet; whether the default backup method deletes (`BACKUPMETHOD`) is outside it.

### F-RS-02: The phone keyboard page never delivers text typed before the window opens, and names a button that does not exist
- **Severity:** Medium
- **Category:** Correctness
- **Where:** `projects/ROCKNIX/packages/network/rclone/sources/cloud_oauth` (hunk `+1,2022`), `REMOTE_PAGE` — the `poll()` function, the `input`/`keydown` listeners, and the `state.textContent` string
- **What:** The page tells the player they can type before the window is up "then use the send button"; there is no send button (the controls are Back, Tab, Enter, Clear, four arrows, Page up, Page down), and when `poll()` flips `ready` to true nothing calls `deliver(box.value)`.
- **Failure scenario:** Player scans the QR first (the order the page asks for), types their email while the handheld still shows the QR, presses CONTINUE on the handheld, sees "Connected.", presses Enter on the phone. The `keydown` handler sends `key=enter` and clears the box (`box.value = ""; sent = "";`); the handheld's field receives an Enter with nothing typed into it; the email is gone from the phone too.
- **Evidence:**
  ```
  : "Not open yet -- choose CONTINUE on your handheld. You can type "
    + "or paste here meanwhile, then use the send button.";
  ...
  ready = open;
  ```
  Delivery is only in `box.addEventListener("input", function () { if (ready) deliver(box.value); });`. Refutation attempted: searched `REMOTE_PAGE` for any element posting the box contents on demand or any code path invoking `deliver` on the `waiting → open` transition; neither exists.
- **Fix:** In `poll()`, when `open` becomes true and `box.value !== sent`, call `deliver(box.value)`; delete "then use the send button" or add the button it names.
- **Confidence:** high — pure JavaScript in the packet.

### F-RS-03: With the on-screen keyboard raised, phone Backspace/Enter/arrows drive the OSK instead of the field
- **Severity:** Medium
- **Category:** Correctness
- **Where:** `projects/ROCKNIX/packages/network/cloud-signin-window/sources/cloud-signin-window.c` (hunk `+1,854`), `on_key`, the `if (showing) { switch (event->keyval) ... }` block
  `projects/ROCKNIX/packages/network/rclone/sources/cloud_oauth`, `GAMEPAD_KEYS`, `GamepadBridge._run` (`self.keyboard.press(name)`), `do_POST` (`holder.keyboard.type_text` / `holder.keyboard.press`)
- **What:** The pad and the phone both type through the same `RemoteKeyboard` uinput device with the same keycodes (`NAMED_KEYS["backspace"] = 14`, `["enter"] = 28`, arrows 103–108). The window cannot tell a phone Backspace from B, so while the OSK is up it hides the OSK on Backspace, presses the highlighted OSK key on Enter, and moves the OSK cursor on arrows.
- **Failure scenario:** OSK auto-raised on a text field (default mode). A phone with the PIN corrects a typo: `deliver()` sends three `key=backspace`. The first hides the OSK; the next two delete characters. The field now holds one more character than the phone's `sent` string, and every later delivery is computed against the wrong baseline.
- **Evidence:**
  ```
  case GDK_KEY_BackSpace:
      osk_hide(osk);
      return TRUE;
  ```
  under `if (showing)`; `BTN_SOUTH: "backspace"` in `GAMEPAD_KEYS`; `holder.keyboard` is the single `RemoteKeyboard()` created in `SessionHolder.__init__` and used by both `GamepadBridge` and `do_POST`. Refutation attempted: looked for a second uinput device or a source tag on key events — there is one keyboard device and GDK key events carry no source.
- **Fix:** Have the pad bridge send distinct codes for OSK navigation (e.g. F5–F10, which no phone key produces) and map those in `on_key`, leaving Backspace/Return/arrows for the page; or hide the OSK when a phone keystroke arrives.
- **Confidence:** high — both halves are in the packet.

### F-RS-04: `ENABLE_MINIBROWSER=ON` ships a general-purpose browser on the device
- **Severity:** Medium
- **Category:** Security
- **Where:** `packages/web/webkitgtk/package.mk` (hunk `+1,107`), `pre_configure_target`, the `-DENABLE_MINIBROWSER=ON` option
- **What:** WebKitGTK's MiniBrowser — address bar, tabs, arbitrary navigation — is built and installed into the image alongside the constrained sign-in window.
- **Failure scenario:** none demonstrated as a crash; it is surface. Anyone with a shell (SSH is a supported path in this very bucket) has a full browser running as root on the handheld, which is exactly what `cloud-signin-window.c`'s header says the design refuses to be.
- **Evidence:** `-DENABLE_MINIBROWSER=ON` in the CMake options; `cloud-signin-window.c`: "This is deliberately not a browser. There is no address bar, no tabs, no downloads ... a handheld should not become a way to browse the web"; `rclone-cloud-sync.md` console-first: "There is no browser on the device". Refutation attempted: looked for a `post_makeinstall_target` deleting the binary — none.
- **Fix:** `-DENABLE_MINIBROWSER=OFF`, or remove `${INSTALL}/usr/libexec/webkit2gtk-4.1/MiniBrowser` in `post_makeinstall_target` with a comment.
- **Confidence:** high — the option is in the diff and MiniBrowser installs under libexec when enabled.

### F-RS-05: `cancel` and a second `serve` orphan the fullscreen window and the pad bridge dies with its process
- **Severity:** Medium
- **Category:** Concurrency
- **Where:** `projects/ROCKNIX/packages/network/rclone/sources/cloud_oauth`, `stop_other_serves()`, `cmd_serve()` (`try/finally` around `server.serve_forever()`), `main()` `cancel` branch
- **What:** `stop_other_serves` sends SIGTERM to the running `serve`. The file installs no SIGTERM handler, so Python dies without running `finally: holder.stop_browser()`. The `cloud-signin-window` child keeps the screen; the `GamepadBridge` thread (the only thing that turns Select+Start into an exit) is gone.
- **Failure scenario:** Window open on the handheld; the interface (or a shell) runs `cloud_oauth cancel`. The serve dies, rclone is pkilled, state is reset to `idle` — and the sign-in page stays fullscreen, with the pad reported to sway as a tablet_pad that WebKit ignores. Nothing on the device closes it until something calls `close` or the player finds a USB keyboard. The same happens when a new `serve` starts while an old one has a window up: the old window leaks, the new `open` then adds a second.
- **Evidence:**
  ```
  os.kill(int(entry), signal.SIGTERM)
  ```
  in `stop_other_serves`; `signal` is used only for `SIGTERM`/`SIGKILL` constants — no `signal.signal(...)` anywhere in the file. The `close` command's own comment admits the shape: "sign-in window outlived its server; closing it directly". Refutation attempted: checked whether `cancel` kills the window as `close` does — it does not; checked whether the window exits when its parent dies — it is a plain `Popen` child with no prctl/death-signal.
- **Fix:** In `cmd_serve`, `signal.signal(signal.SIGTERM, lambda *_: shutdown())` so `finally` runs; and make `cancel` perform `close`'s window kill and `pad_is_free` settle.
- **Confidence:** high on the mechanism (CPython's default SIGTERM action); medium on how often the interface calls `cancel` with the window up (interface outside the packet).

### F-RS-06: The gamepad bridge only starts on pads that report `BTN_DPAD_UP`; hat-axis d-pads get no bridge and no exit
- **Severity:** Medium
- **Category:** Correctness
- **Where:** `projects/ROCKNIX/packages/network/rclone/sources/cloud_oauth`, `find_gamepad()` (`if BTN_SOUTH in codes and BTN_DPAD_UP in codes`), `GamepadBridge.start()`, `GamepadBridge._run()` (`if etype != EV_KEY: continue`)
- **What:** Device discovery requires the d-pad as key events. Controllers whose d-pad is `ABS_HAT0X/Y` (any HID/xpad-class pad) are never found; `start()` logs and returns False with no on-screen consequence; nothing else maps Select+Start to an exit.
- **Failure scenario:** A handheld with a hat-based pad opens the sign-in window. D-pad, A, B, X, Y do nothing to the page; Select+Start does nothing; the window covers the screen for the `serve` timeout (600 s) until `finally: holder.stop_browser()` closes it, while the interface waits in `cloud_oauth wait`. Only a phone on the LAN can drive or dismiss it.
- **Evidence:** `log("no gamepad found; the sign-in page can only be driven from a phone")` followed by `return False`, with no marker or message for the interface; the read loop discards every `EV_ABS` event. `cloud_device_id` names `SM*` among the tree's device families, whose built-in pads are HID-class. Refutation attempted: looked for an `ABS_HAT` path or a second finder — none.
- **Fix:** Accept a device with `BTN_SOUTH` and either `BTN_DPAD_UP` or `ABS_HAT0X`; translate hat values ±1 to the four arrow names; when no pad is found, write a state marker the interface can show and refuse to open the window without a phone connected.
- **Confidence:** medium — the requirement is in the packet; which ROCKNIX pads expose hats is outside it.

### F-RS-07: `_write_config` ignores rclone's `--non-interactive` follow-up question and misreports it as "the remote did not respond"
- **Severity:** Medium
- **Category:** Correctness
- **Where:** `projects/ROCKNIX/packages/network/rclone/sources/cloud_oauth`, `Session._write_config()`
  `projects/ROCKNIX/packages/network/rclone/sources/cloud_remote`, `cmd_create()` (the `State`/`Option` parse — the contrast)
- **What:** `cloud_oauth` runs `rclone config create <name> <backend> token=... --non-interactive` and treats exit 0 as done. `cloud_remote`, in the same packet, documents that rclone answers a pending question with a JSON blob and exit 0. A backend whose configuration continues after the token (OneDrive's connection type/drive selection) leaves a half-configured remote; the `lsd` check then fails, the remote is deleted, and the player reads "signed in, but the remote did not respond".
- **Failure scenario:** OneDrive sign-in completes on the device; `config create` returns a question; `rclone lsd onedrive:` fails for want of `drive_id`; `config delete`; status `failed` with a message blaming the provider's availability. The player retries and gets the same result.
- **Evidence:** `_write_config` checks only `result.returncode != 0`, then `check.returncode != 0` → `return False, "signed in, but the remote did not respond"`. `cloud_remote.cmd_create`: "rclone --non-interactive answers with a JSON blob when it still needs something. Exit 0 there would otherwise look like success while leaving a half-configured remote behind." The header's verification claim covers only that `authorize` "resolve[s] to their own providers unchanged", not that `config create` completes. Refutation attempted: looked for `--continue`/`--state` handling or a per-backend answer table in `cloud_oauth` — none.
- **Fix:** Parse `result.stdout` as `cloud_remote` does; on a `State`, either answer known defaults via `--continue --state ... --result` or fail with the question's name; prove each OAuth backend the wizard lists against a real account before the claim "every OAuth backend is drivable" ships.
- **Confidence:** medium — the contrast is in the packet; rclone's per-backend `Config` steps are outside it.

### F-RS-08: libsoup's TLS backend (glib-networking) is undeclared and the meson check that would notice is disabled
- **Severity:** Medium
- **Category:** Build/packaging
- **Where:** `packages/web/libsoup/package.mk` (hunk `+1,25`), `PKG_DEPENDS_TARGET`, and `-Dtls_check=false` in `pre_configure_target`
- **What:** libsoup 3 does HTTPS only through a GIO TLS module (glib-networking). The recipe neither depends on it nor lets meson verify it; every provider sign-in is HTTPS.
- **Failure scenario:** glib-networking currently reaches the image through some other package's dependency (the flows described in the comments did load Dropbox). The day that package drops it, libsoup still builds, the image still builds, and the sign-in window loads no page — the `zip` story from `packaging-and-patches.md` in a new coat.
- **Evidence:** `PKG_DEPENDS_TARGET="toolchain glib libpsl libxml2 nghttp2 sqlite"`; `-Dtls_check=false`. `packaging-and-patches.md`: "Declaring it converts a silent runtime break into a build failure the next time someone drops the package." Refutation attempted: searched the bucket for any package depending on glib-networking — none in the packet.
- **Fix:** Add `glib-networking` to `PKG_DEPENDS_TARGET` (and to webkitgtk's, which is the consumer), and leave `tls_check` at its default unless the cross-check itself is what fails, in which case say so in the comment.
- **Confidence:** medium — the missing declaration is certain; whether glib-networking exists in the tree is outside the packet.

### F-RS-09: `--seed-folders` never writes its READMEs on a bucket remote
- **Severity:** Medium
- **Category:** Correctness
- **Where:** `projects/ROCKNIX/packages/network/rclone/sources/cloud_setup`, case `--seed-folders`, `seed_note()` (`rclone lsf "${REMOTE}${dir}/README.txt" >/dev/null 2>&1 && return 0`)
- **What:** The "never clobber" check treats a zero exit from `lsf` on the README path as "exists". On S3/B2 a missing key is an empty prefix and `lsf` exits 0 with nothing, so every `seed_note` returns before writing.
- **Failure scenario:** S3 remote. Folders persist only through `--s3-directory-markers`; no README lands anywhere; the block's stated purpose — "The READMEs are also what makes this work at all on bucket-based remotes ... A file in the folder is what materialises it" — is not met. On B2, which the rule says has no marker flag, nothing is created and the report prints `MISSING` for all four.
- **Evidence:** the `lsf ... && return 0` line; `rclone-cloud-sync.md`: "listing an absent one succeeds with nothing", "`rclone cat` of a missing key exits 0 with no output ... checks existence first", "never judge it by listing the folder itself". Refutation attempted: looked for a `--files-only` listing of the parent compared against `README.txt` — the report loop at the bottom uses the parent-listing rule, `seed_note` does not.
- **Fix:** `rclone lsf --files-only "${REMOTE}${dir}/" | grep -qx 'README.txt'` (bounded with `RCLONE_LIST_OPTS`) before returning.
- **Confidence:** medium — `lsf`'s bucket semantics are asserted by the rule file in the packet, not observed here.

### F-RS-10: The window's help bar hard-codes console letters and a Nintendo layout the style guide forbids
- **Severity:** Medium
- **Category:** Player text
- **Where:** `projects/ROCKNIX/packages/network/cloud-signin-window/sources/cloud-signin-window.c`, `osk_hints()` strings; `projects/ROCKNIX/packages/network/rclone/sources/cloud_oauth`, `GAMEPAD_KEYS` and its comment "These handhelds use the Nintendo layout"
- **What:** The bar reads "A press key     B or X close keyboard     L1/R1 scroll     Y next", and the bridge fixes A=`BTN_EAST`, B=`BTN_SOUTH` for every device. `es-ui-style-guide.md`: "Refer to buttons by cardinal position ... never console letters — labels differ per controller. South confirms, East cancels by default, and the player can swap them, so never hardcode 'press A'." The strings are also not localised (`es-player-text.md` D-UI-051).
- **Failure scenario:** A handheld with the Xbox layout (A printed on the south button). The bar says "A press key"; pressing A sends `backspace`, which closes the keyboard; pressing B presses the key. The player's swap in the interface settings is ignored.
- **Evidence:** the two strings in `osk_hints`; `BTN_EAST: "enter", BTN_SOUTH: "backspace"`. Refutation attempted: looked for reading `es_input.cfg` or an `--a-is-south` flag — `exit_hint()` claims to read the pad and returns a constant; nothing reads the layout.
- **Fix:** Read the pad's A/B assignment from `es_input.cfg` (the packet already cites it for hotkey), and word the bar by role or glyph rather than letter; run the strings through the same localisation as the rest of the fork.
- **Confidence:** medium — the rule and the strings are in the packet; which devices ship Xbox layout is outside it.

### F-RS-11: A WebKit engine runs unsandboxed as root, and everything that is not a top-level user-gesture navigation loads unfiltered
- **Severity:** Medium
- **Category:** Security
- **Where:** `packages/web/webkitgtk/package.mk`, `-DENABLE_BUBBLEWRAP_SANDBOX=OFF`; `cloud-signin-window.c`, `on_decide_policy` (`if (!webkit_navigation_action_is_user_gesture(action)) return FALSE;`)
- **What:** The sandbox is off because bubblewrap and xdg-dbus-proxy are not shipped; ROCKNIX runs as root (`ssh root@` throughout `cloud_setup`). Subframes, scripts and resources from any origin load freely by design; only a tap on a link is refused. A renderer bug reached through an embedded third-party frame on a provider's marketing page is a root compromise of the handheld.
- **Failure scenario:** none demonstrated; risk statement. The packet contains no plan for rebuilding webkitgtk on security releases, and the recipe notes a build that "finishes rather than one that is fast" at `-j4`.
- **Evidence:** the option and its comment "the bubblewrap sandbox and its dbus proxy" listed as dependencies "we do not ship"; the policy handler's early `return FALSE` for non-gesture navigations, with the comment "Subframes and resources load freely".
- **Fix:** Ship bubblewrap and xdg-dbus-proxy and turn the sandbox on, or run the window under an unprivileged user; block third-party subframes (`WebKitUserContentFilter` or refuse `NAVIGATION_ACTION` for non-main frames outside the allowed suffix) since a sign-in form does not need them; record who rebuilds webkitgtk for advisories.
- **Confidence:** medium — the configuration is in the packet; the runtime uid is inferred from the scripts.

### F-RS-12: The two-label domain suffix may refuse legitimate cross-domain steps of a provider's own sign-in
- **Severity:** Medium
- **Category:** Correctness
- **Where:** `projects/ROCKNIX/packages/network/rclone/sources/cloud_oauth`, `registrable_domain()`; `cloud-signin-window.c`, `host_permitted()` and `on_decide_policy`
- **What:** The allowed suffix is the last two labels of the authorize URL's host; a user-gesture navigation to any other registrable domain is ignored. Providers that hand off to a sibling domain — Microsoft personal accounts to `login.live.com` from `login.microsoftonline.com`, Yandex to `passport.yandex.ru` from `oauth.yandex.com` — would be refused if that hop is a gesture-attributed navigation or redirect.
- **Failure scenario:** OneDrive personal account: the player presses Next on the Microsoft form; if the resulting navigation to `login.live.com` carries the gesture, `g_message("refused navigation to ...")` and the page stays put with no message to the player.
- **Evidence:** docstring: "Two labels is a blunt rule that is wrong for co.uk and right for every provider rclone talks to" — an assertion; the header verifies only that `authorize` URLs "resolve to their own providers unchanged". Refutation attempted: a navigation started from an asynchronous script callback is not a user gesture in WebKit and would pass the filter — so whether this bites depends on how each provider's page navigates, which the packet does not show.
- **Fix:** Prove each listed provider end-to-end on the device (the maintainer's "if the VM can test it" rule does not apply here — it needs real accounts), and log refusals into a state marker the interface can show; consider a small per-provider allowlist of known auth domains rather than a suffix rule.
- **Confidence:** low — depends on provider behaviour and WebKit gesture propagation, both outside the packet.

### F-RS-13: `--content-location` and `--seed-folders` run unbounded rclone listings
- **Severity:** Low
- **Category:** Convention
- **Where:** `projects/ROCKNIX/packages/network/rclone/sources/cloud_setup`, case `--content-location` (`rclone lsf --dirs-only "${REMOTE}${CP#/}"`, `rclone lsf --dirs-only "${REMOTE}"`), case `--seed-folders` (every `rclone lsf`/`mkdir`/`copyto`)
- **What:** None of these carry `RCLONE_LIST_OPTS`, while the same file says "Listings that decide something get a bound" and `--check`'s comment records the fix for exactly this (#273).
- **Failure scenario:** Cloud not answering; `--content-location` hangs for rclone's defaults (three runs of ten low-level retries) under whatever spinner the interface shows.
- **Evidence:** compare `rclone lsd "${REMOTE}" "${RCLONE_LIST_OPTS[@]}"` in `--check` with the bare calls above; `rclone-cloud-sync.md`: "Never give a listing the transfer's count", "a cloud that never answers is a refusal in 30 s, not a wizard that hangs".
- **Fix:** Append `"${RCLONE_LIST_OPTS[@]}"` to every listing in both cases.
- **Confidence:** high.

### F-RS-14: Comments describe behaviour the code does not have
- **Severity:** Low
- **Category:** Documentation
- **Where:** `cloud_oauth`: `exit_hint()` docstring and `info`'s "Read from the pad, not from a table"; `Handler._render_pin` "Carried back so a mistyped digit is corrected"; `cloud-signin-window.c`: `on_key` "cloud_oauth maps Start to Escape; this is what receives it"; `probe_tick` "Nothing to ask while the keyboard is being driven" and `on_probe` "every two seconds"; `on_load_changed` "the page is left alone if it has already focused something itself"; `cloud_remote`: the `device_flow`/`pkce_paste` block above `DRIVABLE_OAUTH = "all"`
- **What:** `exit_hint()` returns the constant `"SELECT + START"` and reads nothing; `_gate` always passes `supplied=""`; nothing sends Escape from the pad (`GAMEPAD_QUIT` calls `stop_browser`); the probe evaluates JS every 500 ms unconditionally; `focus_first` leaves focus alone only when an `INPUT`/`TEXTAREA` holds it; `DRIVABLE_OAUTH` is never read and the block above it describes two flows the next paragraph says were not built.
- **Failure scenario:** none demonstrated — a maintainer reading the comment forms a wrong model of the code.
- **Evidence:** quoted comments beside the code cited; `grep`-equivalent through the packet finds no reader of `DRIVABLE_OAUTH`.
- **Fix:** Delete the dead constant and its block; correct or remove each comment.
- **Confidence:** high.

### F-RS-15: Console-first is contradicted by the shipped console flow, and the rule file is now false
- **Severity:** Low
- **Category:** Player text
- **Where:** `cloud_setup`, `resolve_connection` (`SSH_CMD="ssh -L 53682:localhost:53682 root@${IP_ADDR}"`) and the console block after `esac` ("Connect from a computer on your network ... open the sign-in link it prints in your computer's browser"); `.claude/rules/rclone-cloud-sync.md` ("There is no browser on the device")
- **What:** The device screen shows a port-forward and instructs a computer even though this bucket makes the on-device path available; the rule says "no product-facing text may mention ... port forwards" and allows a computer "only where technically unavoidable". Meanwhile the rule's premise that there is no browser on the device is no longer true.
- **Failure scenario:** none demonstrated.
- **Evidence:** the `SSH_CMD` string is printed at `echo -e "  1. On your computer, connect:  \e[1;36m${SSH_CMD}\e[0m"`; the rule text quoted.
- **Fix:** Make the console flow lead with the on-device sign-in and keep SSH as an explicit "advanced" branch; update `rclone-cloud-sync.md` to describe the window and its confinement.
- **Confidence:** high.

### F-RS-16: The phone keyboard silently drops characters outside the US layout
- **Severity:** Low
- **Category:** Correctness
- **Where:** `cloud_oauth`, `RemoteKeyboard.type_text()` (`if entry is None: continue  # not on a US layout; silently skipped`), `do_POST` (`self.send_response(204)` regardless of `sent`)
- **What:** A character with no `KEYMAP` entry is skipped; the handler answers 204 and the phone page shows the full text as typed.
- **Failure scenario:** Password `Été2026!`. The handheld receives `t2026!`; the provider says wrong password; nothing on either screen says why.
- **Evidence:** the `continue` and the unconditional 204; the count `sent` goes only to the log.
- **Fix:** Return the count and dropped characters in the response and show them on the page; or type via a Unicode-capable path (the OSK's `gdk_unicode_to_keyval` route through a `key=unicode:` POST).
- **Confidence:** high.

### F-RS-17: `focus_first` can steal focus from a control the player just reached
- **Severity:** Low
- **Category:** Correctness
- **Where:** `cloud-signin-window.c`, `on_load_changed`, the `focus_first` script
- **What:** The poll returns early only when `activeElement` is `INPUT`/`TEXTAREA`; otherwise, the first time it finds a visible text field it calls `f.focus()`, whatever the player had focused meanwhile.
- **Failure scenario:** Provider renders its form by script after load; a consent banner is visible first; the player presses Y (F4) and lands on "Accept"; within 500 ms the form appears, the poll focuses the email field; the player presses A and submits an empty form instead of accepting.
- **Evidence:** `if (a && ['INPUT','TEXTAREA'].indexOf(a.tagName) >= 0) return;` followed by `f.focus(); return;` — no `a !== document.body` test, contrary to the comment above it.
- **Fix:** Return early when `a && a !== document.body`.
- **Confidence:** medium — the ordering needs a script-rendered form, which is the case the comment says the poll exists for.

### F-RS-18: The serve listens on every interface, not the LAN address it advertises
- **Severity:** Low
- **Category:** Security
- **Where:** `cloud_oauth`, `cmd_serve()` (`http.server.ThreadingHTTPServer(("0.0.0.0", port), None)`)
- **What:** The header says "The listener binds the LAN only while a sign-in is running"; it binds `0.0.0.0`, so a VPN or tethering interface also receives the keyboard/pointer endpoint.
- **Failure scenario:** none demonstrated beyond the widened exposure; the PIN still gates it.
- **Evidence:** the bind tuple; `lan_address()` computes the address it could have bound.
- **Fix:** Bind to `address` (fall back to `0.0.0.0` only when it is `127.0.0.1`).
- **Confidence:** high on the fact, low on impact.

### F-RS-19: `hide_cursor 0` is not restored when the window ends on its own or is killed directly
- **Severity:** Low
- **Category:** Resource
- **Where:** `cloud_oauth`, `BrowserSession.stop()` (`if self.proc and self.proc.poll() is None: BrowserSession._cursor_timeout(1000)`), `main()` `close` branch's direct kill
- **What:** The restore runs only when the process is still alive at `stop()`; a window that exited (Escape, crash) or one killed by `close`'s "outlived its server" path leaves sway at `hide_cursor 0`.
- **Failure scenario:** After a crash of the window, the next attached pointer (the `RemoteMouse` of the next sign-in, or a USB mouse) never hides.
- **Evidence:** the conditional quoted; the `close` kill loop calls no `swaymsg`.
- **Fix:** Restore unconditionally in `stop()` and in `close`.
- **Confidence:** medium.

### F-RS-20: Credentials and codes cross process and file boundaries
- **Severity:** Low
- **Category:** Security
- **Where:** `cloud-signin-window.c`, `on_load_changed` (`g_file_set_contents(page_file, uri, -1, &werr)`); `cloud_oauth`, `_write_config` (`"token=%s" % self.token` in argv), `cmd_serve` (`print("PROVIDER=%s" ...)`); `cloud_remote`, `cmd_create` (`args.append("%s=%s" % (key, value))`)
- **What:** After the redirect lands, the page file holds `http://127.0.0.1:53682/?state=...&code=...` (mode from umask); the OAuth token and every typed password reach rclone as command-line arguments visible in `/proc/*/cmdline`; the provider URL with rclone's `state` goes to stdout for the interface to log. The packet's own `--info` comment (D-INFRA-008) treats a credential crossing a script boundary as a defect.
- **Failure scenario:** none demonstrated — single-user root device; the code is single-use and already redeemed.
- **Evidence:** the calls quoted; `cloud_setup --info`: "a credential that crosses a script boundary is one careless echo from a log (#116, D-INFRA-008)".
- **Fix:** Skip writing the page file for `127.0.0.1`/`localhost` URIs; pass secrets to rclone through `RCLONE_CONFIG_<NAME>_<KEY>` environment variables where the backend permits, and read them in `cloud_remote` from stdin rather than argv.
- **Confidence:** medium.

### F-RS-21: Two of four scripts are committed without the executable bit
- **Severity:** Low
- **Category:** Build/packaging
- **Where:** `cloud_oauth` and `cloud_device_id` — `new file mode 100644`; `cloud_remote` and `cloud_setup` — `new file mode 100755`
- **What:** Inconsistent modes on files the image installs into `/usr/bin`.
- **Failure scenario:** If the rclone recipe (outside the packet) copies preserving mode, `cloud_oauth serve` fails with permission denied; if it `install -m 755`s, nothing.
- **Evidence:** the diff headers.
- **Fix:** `chmod +x` both in the commit.
- **Confidence:** low that it fails; certain that upstream review will ask.

### F-RS-22: `serve` dies with a traceback and leaves status `starting` when the port is taken
- **Severity:** Low
- **Category:** Correctness
- **Where:** `cloud_oauth`, `cmd_serve()` — `ThreadingHTTPServer(("0.0.0.0", port), None)` outside any `try`
- **What:** An `OSError` on bind propagates; no `write_state(status="failed", ...)`; `stop_other_serves` only clears other serves, not another service on 8080.
- **Failure scenario:** Anything else on port 8080; the interface's `status` reads `starting` until `cancel`.
- **Evidence:** the bare constructor call; the failure path immediately above (`holder.start()`) does record `failed`.
- **Fix:** Wrap the bind, record `failed` with a player-readable why, exit 2.
- **Confidence:** high.

### F-RS-23: `session.json` is read-modify-written without a lock from three threads
- **Severity:** Low
- **Category:** Concurrency
- **Where:** `cloud_oauth`, `write_state()`; callers in `_collect` (collector thread), `_write_config` (collector or handler thread), `cmd_serve` (main thread)
- **What:** `existing = read_state(); existing.update(fields); json.dump(...)` is not atomic; a concurrent `cloud_oauth info` can read a half-written file and get `{}`.
- **Failure scenario:** `status` briefly reads `idle`/empty on the interface while a sign-in is completing.
- **Evidence:** the function body; no lock or temp-file rename.
- **Fix:** Write to `session.json.tmp` and `os.replace`; guard with the holder's lock.
- **Confidence:** medium.

### F-RS-24: No test in the packet exercises the new shell logic
- **Severity:** Low
- **Category:** Test gap
- **Where:** the whole bucket — no `tools/` change accompanies `cloud_setup`'s `--set-saves-remote`, `syncpath_problem`, `--seed-folders`, or `cloud_device_id`
- **What:** `rclone-cloud-sync.md` lists `tools/last-good-scripts-test` and `tools/cloud-round-trip` as the harnesses; neither appears here. F-RS-01 is a one-line fixture (`--set-saves-remote /GAMES` must not produce `SETTINGS_REMOTE=/GAMES/Backups`); F-RS-09 is one S3 run.
- **Failure scenario:** none demonstrated.
- **Evidence:** the diff contains only the 12 listed files.
- **Fix:** Add both cases to the existing harnesses and run the S3 backend for `--seed-folders`.
- **Confidence:** medium — the harnesses may have been extended in another bucket.

### F-RS-25: A build-box parallelism cap is baked into the package
- **Severity:** Low
- **Category:** Upstream fit
- **Where:** `packages/web/webkitgtk/package.mk`, `PKG_MAKE_OPTS_TARGET="-j4"` and the twenty-line comment above it
- **What:** The recipe hard-codes `-j4` for one machine's memory, with the comment "the maintainer's call, 2026-09-19".
- **Failure scenario:** none demonstrated; a webkitgtk build on any other builder is throttled to four jobs.
- **Evidence:** quoted line.
- **Fix:** Use a build-system knob for memory-heavy packages (or `PKG_BUILD_FLAGS`) and let the builder decide.
- **Confidence:** high.

### F-RS-26: Patch 0001 carries no description
- **Severity:** Low
- **Category:** Documentation
- **Where:** `packages/web/webkitgtk/patches/webkitgtk-0001-DocumentLoader-include-EventLoop.patch`
- **What:** A bare hunk with no header saying which compile error it fixes, on which toolchain, or whether it was sent upstream; 0002 shows the expected shape.
- **Failure scenario:** none demonstrated.
- **Evidence:** the file is ten lines, all hunk.
- **Fix:** Add the header and the WebKit bug link; both patches belong in upstream WebKit.
- **Confidence:** high.

## Upstream fit

A ROCKNIX maintainer reading this as a pull request would push back on:

- **Fork-internal references throughout.** `#228`, `#86`, `#49`, `#50`, `#51`, `#105`, `#151`, `D-CLOUD-078`, `D-WORKFLOW-038`, `D-NET-005`, `D-CLOUD-120`, "the maintainer's call, 2026-09-19", "the tester", "cost a debugging session", "four wrong diagnoses" — none resolve against ROCKNIX's tracker. The webkitgtk recipe and `cloud-signin-window.c` in particular narrate debugging history rather than state the constraint.
- **Scope and footprint.** A WebKit engine, GTK3 stack, libsoup/libpsl and MiniBrowser on every device for one sign-in page. Image size, SYSTEM partition headroom, memory on 1 GB devices, and who rebuilds webkitgtk for security releases are questions the packet does not answer. `ENABLE_MINIBROWSER=ON` will be the first line questioned.
- **Build-box constants** (`-j4`), and `PKG_DEPENDS_TARGET` entries whose existence in the tree the packet cannot show (`harfbuzz-icu`, `woff2`, `libepoxy`, `at-spi2-atk`, `unifdef:host`, `ruby:host`), plus the comment's reliance on fork changes to `gst-plugins-base`/`gst-plugins-bad` that are not in this diff.
- **Patches that belong upstream.** Both WebKit patches are build fixes for stock 2.54.0; 0001 has no provenance.
- **Two flows for one job.** `cloud_setup` keeps the SSH/`rclone config` console flow and its `/storage/.config/cloud_setup_ssh` developer override (a "development setups, tunnels, proxies" affordance) alongside the on-device path; `cloud_remote` keeps a dead `DRIVABLE_OAUTH` constant and a comment block about flows that were not built.
- **Copyright.** All seven `package.mk`/source headers carry only "2026-present ROCKNIX". If libpsl/libsoup/qrencode were adapted from LibreELEC or JELOS recipes, the rule requires those credits preserved; the packet cannot show whether they were.
- **Commit hygiene visible in the diff.** Mixed file modes (F-RS-21); Python scripts with `#!/usr/bin/env python3` in a tree whose other tools are bash — whether the image ships Python 3 for them is outside the packet.
- **Secrets in argv** (F-RS-20) and a root-running, unsandboxed renderer (F-RS-11) are the security points a maintainer will raise before reading further.

## Coverage boundary

What this packet does not contain, and what I would need to close the findings above:

- **The rclone `package.mk`** (not in this bucket): whether it installs the four scripts with mode 755; whether `PKG_DEPENDS_TARGET` declares `qrencode`, `ethtool`, `evtest`, `udevadm`, `logger`, `python3`, `glib-networking`, `cloud-signin-window`; how the scripts reach `/usr/bin`.
- **The interface side.** The brief names "the interface wizard" but the diff has zero EmulationStation files. The sequence in which the wizard calls `serve`/`open`/`wait`/`close`/`cancel` (F-RS-05), how it consumes `serve`'s stdout while the process blocks in `serve_forever`, how `--info`'s `SSH_CMD` and `PROVIDER=` are shown or logged, and whether `cloud_remote create` receives passwords on a command line (F-RS-20).
- **`cloud_backup`, `cloud_restore`, `cloud_sync_helper`, `cloud_migrate_layout`.** The default `BACKUPMETHOD`, whether `--delete-excluded` is in the shipped `RCLONEOPTS`, the nesting warning's exact behaviour, and the `CONTENT_REMOTE` derivation `--set-saves-remote` says it mirrors (F-RS-01).
- **Runtime behaviour I could only reason about:** WebKit's user-gesture attribution across redirect chains and each provider's actual hop sequence (F-RS-12); rclone's per-backend `config create --non-interactive` questions (F-RS-07); `rclone lsf` on a missing object on S3/B2 (F-RS-09); which ROCKNIX pads expose `BTN_DPAD_*` versus `ABS_HAT0X` and which ship the Xbox layout (F-RS-06, F-RS-10); the device's XKB layout under sway, which decides what the uinput keycodes type; synthesized GDK key events reaching WebKit's IM path; memory of the three WebKit processes on a 1 GB handheld.
- **Build system.** Whether `scripts/build` appends `PKG_MAKE_OPTS_TARGET` after `NINJA_OPTS` as the webkitgtk comment claims; whether `packages/web/` is a group the tree uses; the existence of every declared dependency.
- **Tests and docs.** `tools/cloud-round-trip`, `tools/last-good-scripts-test`, `tools/vocabulary-check`, and any rocknix.org page describing the new flow are not in the packet; `rclone-cloud-sync.md` is, and it still describes a device without a browser.