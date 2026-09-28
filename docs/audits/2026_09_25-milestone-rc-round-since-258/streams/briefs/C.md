# Fix stream C: the cloud sign-in broker and setup -- audit #307 / #308 (D-WORKFLOW-054, D-WORKFLOW-055)
You are an Opus 5.5 subagent executing a plan this lane defined from a two-seat adversarial audit. Work only in your worktree, only in the files you own, run every item to an outcome, and return a report. Nothing you do reaches a device, a QA guest, an image build or the `next` branch: you deliver a branch, and the integrator builds.
## Your worktree and branch

- Worktree: `/workspace/repos/rocknix.worktrees/pl-c`, branch `feature/pl-c`, cut from `next`. `cd` there for everything; commit there. The primary checkouts (`/workspace/repos/rocknix` on `next`; the ES checkout `/home/max/Development/emulationstation-next.worktrees/qa-integration`) are read-only for you.
- The rules live in `/workspace/repos/rocknix/.claude/rules/` (read them from there; your ROCKNIX worktree carries the same copies). Open before you start: `engineering-practices.md` (§ Guards must fail closed, § Verify the artifact not the report, § A failure you find is yours to fix, § Before deleting a duplicate), `upgrade-and-install.md` (every fix answers what it does to what earlier builds already wrote), `working-principles.md` § Pre-flight, `packaging-and-patches.md`, and `rclone-cloud-sync.md` where your files are cloud scripts. Cite the decision-register rows your items name (`docs/decision-register.md`) rather than re-arguing them.
## The files you own (exclusive -- another stream owns everything else)

`projects/ROCKNIX/packages/network/rclone/sources/cloud_oauth`, `cloud_setup`, `cloud_remote`, `cloud_device_id`; `projects/ROCKNIX/packages/web/` (webkitgtk, the sign-in window `cloud-signin-window.c` and its recipe, libsoup/libpsl recipes named by your rows); plus your block in `tools/last-good-scripts-test` and the ES repo's `tests/cloud-oauth-lifetime.py` is NOT yours (E2). NOT the other cloud scripts (A).

If a fix genuinely needs a file outside this list, do not touch it: say so in the report under that item and leave the item open with the reason.
## How you prove a fix (scripts and recipes)

- `tools/last-good-scripts-test` (run from your worktree root: `./tools/last-good-scripts-test`; read its header first for how cases are written, how the image's busybox is used for the applets the device has, and how fixtures are made) is the harness. Add your cases at the END of the file in ONE block headed `# ---- audit #307, stream C ----` (other streams append their own blocks; the integrator merges). A case is written FIRST and seen to FAIL on the unfixed script -- paste the FAIL line in the report -- then the fix, then the whole suite PASS; quote the final PASS count.
- A recipe (`package.mk`) edit is followed by `tools/pkgcheck <package>`; quote its output. Late binding: toolchain and path variables only inside functions.
- A script that will run under busybox is tested through the image's busybox as the harness does; every external command you add is one the device has (`command -v` in the guest's busybox list in `generic-x64-vm-testing.md` § What the guest's busybox lacks, or a package dependency).
- Every word a player reads (a `>>> why` line, a console line) follows `es-player-text.md` § Outcome vocabulary: `COMPLETED`, `COULDN'T FINISH - <why>`, `SKIPPED - <reason>`, everyday register, no exit codes or paths on a screen.
## Commits

One commit per punch item (a sweep group may share one). Title `<package or script>: <text>` under 72 characters, no spaces before the colon; a blank line; a body that names the item (`#307 PL-NNN`) and the finding, says what the test case is, and carries the `Already written:` line -- how the fix treats what earlier builds already wrote on a device (D-WORKFLOW-050; "nothing is written" is an acceptable answer when true). End every commit message with:

```
Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
```

Never `--no-verify`, never a bare `git stash`, never edit a shell script while a run of it is in flight (the harness reads scripts by offset).

## The punch items (the contract; each has the verdict it was read from, with lines)
## PL-015: A root-level saves path nests the settings and content folders inside it
- **Severity:** High
- **Category:** Data layout
- **Source Finding:** F-RS-03 (gpt) = F-RS-01 (claude)
- **Owner area:** cloud_setup
- **Where:** cloud_setup:385-390 (`--set-saves-remote`)
- **What:** With the saves remote at the cloud's root the derived settings and content paths land under it, so a later saves sync's `--backup-dir` and prune walk the other tiers. Fix: refuse a saves remote at the root or derive the siblings beside it, never inside.
- **Acceptance:** `cloud_setup --set-saves-remote /` is refused with the reason, or the derived paths are `/ROCKNIX/Settings` beside `/ROCKNIX/Saves`; the scripts test covers both
<details><summary>The audit's verdict(s) this item rests on</summary>
- **F-RS-01** (the phone keyboard's page and form travel over plain HTTP on the LAN, PIN-gated): true by design -- `cloud_oauth` serves `http://<device>:<port>` with a PIN; TLS on a handheld's LAN page means a self-signed certificate warning on the phone, which the QR flow was built to avoid. **Not a defect but an undecided trade**: no register row records the acceptance of plaintext on the local network. **Medium**, and a row to write (bind the server to the Wi-Fi interface's address rather than `0.0.0.0`, and say in the page that the network is trusted).
- **F-RS-03** (a root-level saves path nests the other tiers inside it): `cloud_setup:385-390` -- `SP_PARENT="$(dirname "${NEWPATH}")"; [ "${SP_PARENT}" = "/" ] && SP_PARENT="${NEWPATH}"`, then `${SP_PARENT}/Backups` and `${SP_PARENT}/Content`; the comment at `:360` says siblings, never inside. With the saves mirror's delete semantics the nested tiers are what a mirror removes. **Survived, High**: refuse a root-level saves path, or derive the siblings under `/ROCKNIX` when the parent is `/`; a scripts-suite case.
</details>
## PL-016: Text typed on the phone before the window is up is never delivered
- **Severity:** High
- **Category:** Least surprise
- **Source Finding:** F-RS-08 (gpt) = F-RS-02 (claude)
- **Owner area:** cloud_oauth (the phone page)
- **Where:** cloud_oauth:910 (`poll()`)
- **What:** The page's `poll()` sets `ready = open;` and nothing sends what the box already holds once the window opens. Fix: on the transition to ready, send the box's content as one `type=` post and reset `sent`.
- **Acceptance:** typing on the phone page before the window opens reaches the field after it opens (a guest run with the page driven by curl and the window's log)
<details><summary>The audit's verdict(s) this item rests on</summary>
- **F-RS-02** (a failed README probe overwrites the owner's note): `cloud_setup`'s `rclone lsf .../README.txt ... && return 0` then an unconditional `copyto`. **Survived, Medium** (a note, not data; the promise was not to clobber it): distinguish a failed listing from an empty one, and `copyto --ignore-existing`.
- **F-RS-08** (text typed on the phone before the window is up is never delivered): **Survives; High.** `cloud_oauth:910`, the page's `poll()`, sets `ready = open;` and nothing sends what the box already holds once the window opens, so the characters typed while the page said the window was not ready are silently dropped and the player's next keystrokes land after a gap.
</details>
## PL-017: The phone page's Back button bypasses the box's text model
- **Severity:** High
- **Category:** Least surprise
- **Source Finding:** F-RS-09 (gpt)
- **Owner area:** cloud_oauth (the phone page)
- **Where:** cloud_oauth:815
- **What:** The named-key buttons post `key=BackSpace` without trimming `box.value` or decrementing `sent`, so the device's field and the phone's box differ by a character after every correction and a password is sent altered. Fix: Back trims the box and the count; the other named keys likewise route through the model.
- **Acceptance:** typing `abc`, Back, `d` on the phone page leaves `abd` in the field on guest d (the sign-in window's log); a doctest of the page's script if it is testable, else the guest run
<details><summary>The audit's verdict(s) this item rests on</summary>
- **F-RS-09** (the phone page's Back button bypasses the box): **Survives; High.** `cloud_oauth:815`: `b.addEventListener("click", function () { send("key=" + b.dataset.key); });` sends the named key to the device without trimming `box.value` or decrementing `sent`, so after a Back press the device's field and the phone's box differ by a character, and a password typed with one correction is sent altered with nothing on either screen saying so.
</details>
## PL-018: `wait` returns at a successful sign-in while the bridge still holds the pad's grab
- **Severity:** High
- **Category:** Input handling (pending a fact)
- **Source Finding:** F-RS-11 (gpt)
- **Owner area:** cloud_oauth (`wait`, `GamepadBridge`)
- **Where:** cloud_oauth:1925-1943, 1385-1400, 1492-1507; ApiSystem.cpp:573-582
- **What:** The marker branch skips the `pad_is_free` loop and the bridge releases only when the window dies, so the interface re-initialises SDL under a foreign EVIOCGRAB -- the ordering its own comments say leaves it without a pad. Fix: the bridge releases the grab when the `signed-in` marker appears (the Finishing-up page takes no input) and `wait`'s marker branch runs the `pad_is_free` loop first.
- **Acceptance:** on the guest with a uinput gamepad, or on the RG35XX SP on its own yes: after an on-device sign-in the pad moves the menu without a restart -- the fact goes in `docs/releases/device-facts.md`
<details><summary>The audit's verdict(s) this item rests on</summary>
- **F-RS-11** (`wait` returns at success before the grab is released): **Survives; High, pending a fact.** `wait` (1925-1943) returns 0 the moment `signed-in` exists, skipping the `pad_is_free` loop; the bridge holds EVIOCGRAB until the window is gone (`_run`, 1385-1400, `alive=browser.is_running`; nothing releases on the marker) and `signed_in` (1492-1507) keeps the window up by design; EmulationStation then runs `launchExternalWindow_after` (SDL re-init) before `close` (ApiSystem 573-582). Its own comments (ApiSystem 553-556; `pad_is_free`'s doc, 1306-1311) call that the ordering that leaves ES with no gamepad. Both halves were written in one commit (`e4597faf23`, 2026-09-01) whose message does not mention the pad; the 2026-08-31 work log says the grab handover was never exercised (the VM has no gamepad), and `docs/releases/device-facts.md` has no row for a pad after an on-device sign-in. Whether SDL really loses a joystick opened under a foreign grab is unproven either way; the fix is cheap regardless -- the bridge releases the grab when the marker appears (the "Finishing up" page takes no input) and `wait`'s marker branch runs the `pad_is_free` loop first. Proof: a uinput gamepad on the guest, or the RG35XX SP on its own yes.
- **3-rclone-setup, the Claude seat against the GPT seat** (its output landed 23:49 UTC, attempt 3 of 3, 41 KB): one High, F-RS-01 (`--set-saves-remote` nests the settings and content folders inside a root-level saves folder) -- the same defect as GPT's F-RS-03, so **both seats, survives High**. Overlaps at a different severity: Claude's F-RS-02 (the phone page never delivers text typed before the window opens; Medium) is GPT's F-RS-08 (High) -- verified above, and High stands: the text is lost, not delayed. Claude's F-RS-05 (`cancel` and a second `serve` orphan the window; Medium) is GPT's F-RS-06, which the reading above brought to Medium -- the seats agree once the callers are read. Claude-only items worth the punch list without a High to refute: F-RS-06 (a hat-axis d-pad gets no bridge and no exit hotkey; Medium), F-RS-22 (`serve` dies with a traceback and leaves status `starting` when the port is taken; Low), F-RS-11 (WebKit unsandboxed as root; Medium), F-RS-07 (`--non-interactive`'s follow-up question read as "the remote did not respond"; Medium). Neither seat found F-RS-04's credential logging; GPT's was the only claim and it is refuted.
</details>
## PL-047: A failed README probe overwrites the owner's note
- **Severity:** Medium
- **Category:** Guards fail closed
- **Source Finding:** F-RS-02 (gpt)
- **Owner area:** cloud_setup
- **Where:** cloud_setup (`--seed-folders`)
- **What:** Fix: distinguish "absent" from "could not list" before writing.
- **Acceptance:** the scripts test: a listing that fails writes nothing
<details><summary>The audit's verdict(s) this item rests on</summary>
- **F-RS-02** (a failed README probe overwrites the owner's note): `cloud_setup`'s `rclone lsf .../README.txt ... && return 0` then an unconditional `copyto`. **Survived, Medium** (a note, not data; the promise was not to clobber it): distinguish a failed listing from an empty one, and `copyto --ignore-existing`.
</details>
## PL-048: `self.configured` is set before the remote is created and verified
- **Severity:** Medium
- **Category:** Correctness
- **Source Finding:** F-RS-05 (gpt)
- **Owner area:** cloud_oauth
- **Where:** cloud_oauth (`submit`, `configured`)
- **What:** Fix: set it after `_write_config` returns ok.
- **Acceptance:** a unit test of the session's state transitions
<details><summary>The audit's verdict(s) this item rests on</summary>
- **F-RS-05** (`self.configured` set before the remote is created and verified, so a concurrent `submit()` reports Connected early): **Survived, Medium** (a race inside one session; the outcome the page shows is checked again by the wizard's next step).
</details>
## PL-049: `cancel`'s SIGTERM skips the serve's `finally`, orphaning the window
- **Severity:** Medium
- **Category:** Resource
- **Source Finding:** F-RS-06 (gpt) = F-RS-05 (claude)
- **Owner area:** cloud_oauth
- **Where:** cloud_oauth:570-595, 1847-1853
- **What:** Fix: a SIGTERM handler that raises, so the cleanup runs.
- **Acceptance:** `cloud_oauth cancel` with the page up closes the window (the guest's window log)
<details><summary>The audit's verdict(s) this item rests on</summary>
- **F-RS-05** (`self.configured` set before the remote is created and verified, so a concurrent `submit()` reports Connected early): **Survived, Medium** (a race inside one session; the outcome the page shows is checked again by the wizard's next step).
- **F-RS-06** (cancel SIGTERMs the broker; its window survives without the bridge): **Mechanism confirmed, downgraded to Medium.** `cancel` (2009-2016) calls `stop_other_serves()` (570-595), which sends SIGTERM; the file installs no `signal.signal` handler, so the process dies with the default action and `cmd_serve`'s `finally` (1847-1853, `holder.stop_browser()`) never runs; the window is a plain `Popen` child (640-645) with no death signal, so it is orphaned; the bridge's grab dies with its fd (the kernel drops EVIOCGRAB on close). Exposure: both EmulationStation callers run `cancel` with no window up -- `cloudOAuthStart` (GuiMenu 6900) before a serve, the STILL WAITING dialog (7176) after `launchCloudSignIn` has already run `close` (ApiSystem 582) -- and `close` kills a window that outlived its server by a /proc walk (1958-1975). The orphan needs a `cloud_oauth cancel` from a shell while the page is up. Fix: a SIGTERM handler that raises, so the `finally` runs.
</details>
## PL-050: An rclone that exits without a token leaves the on-device session `waiting`; a serve whose port is taken dies with a traceback and status `starting`
- **Severity:** Medium
- **Category:** Least surprise
- **Source Finding:** F-RS-07 (gpt) + F-RS-22 (claude)
- **Owner area:** cloud_oauth
- **Where:** cloud_oauth:231-262; the serve's port-taken traceback
- **What:** Fix: after `proc.wait()` with no token, `write_state(status="failed", error=failure_reason())`; catch `EADDRINUSE` and write the same.
- **Acceptance:** a unit test of `_collect` with a process that exits early; the status reads failed
<details><summary>The audit's verdict(s) this item rests on</summary>
- **F-RS-07** (rclone exits without a token and the on-device session stays `waiting`): **Survives; Medium** (High as filed). `_collect` (231-262) writes state only under `if self.token and not self.configured`; after `self.proc.wait()` with no token nothing is written. `finished()` (192) has one caller, the phone form's POST (1755), which offers "Start a new sign-in"; the on-device path has none, so `cloud_oauth status` (2005) reads `waiting` until the serve's timeout (ES passes `--timeout 900`) and the STILL WAITING dialog tells the player to finish an attempt that is dead. Not stranded -- the exit hotkey runs `on_quit` -> `stop_browser`, `wait` returns, `close` -- but told the wrong thing for up to fifteen minutes. Fix: after `proc.wait()`, no token and state `waiting` -> `write_state(status="failed", error=self.failure_reason())`.
</details>
## PL-051: Paths are written into the conf through an unescaped `sed` replacement, and the conf is sourced
- **Severity:** Medium
- **Category:** Shell safety
- **Source Finding:** F-RS-10 (gpt)
- **Owner area:** cloud_setup
- **Where:** cloud_setup (the `sed` that writes the conf)
- **What:** Fix: escape `|`, `&`, `\` in the replacement (or write with `printf` and a quoted value); validate the path's characters.
- **Acceptance:** the scripts test: a path with `&` round-trips
<details><summary>The audit's verdict(s) this item rests on</summary>
- **F-RS-10** (paths written into the conf through an unescaped `sed` replacement, and the conf is sourced by `--info`): `cloud_setup:392` `sed -i "s|^${key}=.*|${key}="${value}"|"`; `:442-443` read the sourced values. **Survived, Medium**: escape `|`, `&` and `\` in the replacement (or write the line with `printf` and a temp file), and validate the path's characters at entry.
</details>
## PL-074: rclone's stderr excerpt is logged verbatim on a failed remote creation
- **Severity:** Low
- **Category:** Credentials
- **Source Finding:** F-RS-04 (gpt)
- **Owner area:** cloud_oauth
- **Where:** cloud_oauth:260, 338
- **What:** Fix: log a fixed sentence and keep rclone's text out of `cloud_sync.log`.
- **Acceptance:** the log line after a failed create carries no rclone text
<details><summary>The audit's verdict(s) this item rests on</summary>
- **F-RS-04** (failed remote-creation commands log their arguments, `password=` included; the sign-in window's debug logs keystrokes): **Refuted as stated; Low.** `cloud_oauth` has no `" ".join(args)` and logs no command line: the create path (`_write_config`, 333-352) logs only `remote %s created for %s`, and its failure returns `result.stderr.strip()[:200]`, which `_collect` logs as `could not finish the sign-in: <rclone's stderr>` (260) -- rclone's own text, never our arguments, and rclone's config-create errors do not echo parameter values. The window logs keystrokes only under `CLOUD_SIGNIN_DEBUG` (`cloud-signin-window.c:440-441`), which nothing shipped sets. Residual, one line: the 200-byte stderr excerpt is logged verbatim, so an rclone that echoed a parameter would reach the log -- a Low punch item.
</details>
## The sweep rows (#308): the seats' Mediums and Lows in your files, 32 rows

Every row gets a verdict. For each: read the seat's full finding in `/workspace/repos/rocknix/docs/audits/2026_09_25-milestone-rc-round-since-258/seats/<packet>-<seat>.md` under its id; read the code it names; then either **fix** it (the same proof rule: a case first where a case can exist, a commit naming `#308 <packet> <seat> <id>`) or **withdraw** it with one honest line (refuted with the line that refutes it; a duplicate of a punch item -- name it; fork-only prose or upstream fit for the PR-prep pass #256; not in your files -- name the stream). Do not skip a row and do not fix by description: read the line first.

| packet | seat | id | severity | title | where |
| --- | --- | --- | --- | --- | --- |
| 3-rclone-setup | claude | F-RS-04 | Medium | `ENABLE_MINIBROWSER=ON` ships a general-purpose browser on the device | `packages/web/webkitgtk/package.mk` (hunk `+1,107`), `pre_configure_target`, the |
| 3-rclone-setup | claude | F-RS-09 | Medium | `--seed-folders` never writes its READMEs on a bucket remote | `projects/ROCKNIX/packages/network/rclone/sources/cloud_setup`, case `--seed-fol |
| 3-rclone-setup | claude | F-RS-10 | Medium | The window's help bar hard-codes console letters and a Nintendo layout the style guide for | `projects/ROCKNIX/packages/network/cloud-signin-window/sources/cloud-signin-wind |
| 3-rclone-setup | claude | F-RS-11 | Medium | A WebKit engine runs unsandboxed as root, and everything that is not a top-level user-gest | `packages/web/webkitgtk/package.mk`, `-DENABLE_BUBBLEWRAP_SANDBOX=OFF`; `cloud-s |
| 3-rclone-setup | claude | F-RS-12 | Medium | The two-label domain suffix may refuse legitimate cross-domain steps of a provider's own s | `projects/ROCKNIX/packages/network/rclone/sources/cloud_oauth`, `registrable_dom |
| 3-rclone-setup | claude | F-RS-13 | Low | `--content-location` and `--seed-folders` run unbounded rclone listings | `projects/ROCKNIX/packages/network/rclone/sources/cloud_setup`, case `--content- |
| 3-rclone-setup | claude | F-RS-14 | Low | Comments describe behaviour the code does not have | `cloud_oauth`: `exit_hint()` docstring and `info`'s "Read from the pad, not from |
| 3-rclone-setup | claude | F-RS-15 | Low | Console-first is contradicted by the shipped console flow, and the rule file is now false | `cloud_setup`, `resolve_connection` (`SSH_CMD="ssh -L 53682:localhost:53682 root |
| 3-rclone-setup | claude | F-RS-16 | Low | The phone keyboard silently drops characters outside the US layout | `cloud_oauth`, `RemoteKeyboard.type_text()` (`if entry is None: continue  # not |
| 3-rclone-setup | claude | F-RS-17 | Low | `focus_first` can steal focus from a control the player just reached | `cloud-signin-window.c`, `on_load_changed`, the `focus_first` script |
| 3-rclone-setup | claude | F-RS-18 | Low | The serve listens on every interface, not the LAN address it advertises | `cloud_oauth`, `cmd_serve()` (`http.server.ThreadingHTTPServer(("0.0.0.0", port) |
| 3-rclone-setup | claude | F-RS-19 | Low | `hide_cursor 0` is not restored when the window ends on its own or is killed directly | `cloud_oauth`, `BrowserSession.stop()` (`if self.proc and self.proc.poll() is No |
| 3-rclone-setup | claude | F-RS-20 | Low | Credentials and codes cross process and file boundaries | `cloud-signin-window.c`, `on_load_changed` (`g_file_set_contents(page_file, uri, |
| 3-rclone-setup | claude | F-RS-21 | Low | Two of four scripts are committed without the executable bit | `cloud_oauth` and `cloud_device_id` — `new file mode 100644`; `cloud_remote` and |
| 3-rclone-setup | claude | F-RS-23 | Low | `session.json` is read-modify-written without a lock from three threads | `cloud_oauth`, `write_state()`; callers in `_collect` (collector thread), `_writ |
| 3-rclone-setup | claude | F-RS-24 | Low | No test in the packet exercises the new shell logic | the whole bucket — no `tools/` change accompanies `cloud_setup`'s `--set-saves-r |
| 3-rclone-setup | claude | F-RS-25 | Low | A build-box parallelism cap is baked into the package | `packages/web/webkitgtk/package.mk`, `PKG_MAKE_OPTS_TARGET="-j4"` and the twenty |
| 3-rclone-setup | claude | F-RS-26 | Low | Patch 0001 carries no description | `packages/web/webkitgtk/patches/webkitgtk-0001-DocumentLoader-include-EventLoop. |
| 3-rclone-setup | gpt | F-RS-12 | Medium | The handheld keyboard cannot enter ordinary password characters | `projects/ROCKNIX/packages/network/cloud-signin-window/sources/cloud-signin-wind |
| 3-rclone-setup | gpt | F-RS-13 | Medium | Unsupported phone characters are silently discarded | `projects/ROCKNIX/packages/network/rclone/sources/cloud_oauth:@@ -0,0 +1,2022 @@ |
| 3-rclone-setup | gpt | F-RS-14 | Medium | The phone displays passwords as ordinary text | `projects/ROCKNIX/packages/network/rclone/sources/cloud_oauth:@@ -0,0 +1,2022 @@ |
| 3-rclone-setup | gpt | F-RS-15 | Medium | Sign-in ignores the player's configured controller bindings | `projects/ROCKNIX/packages/network/rclone/sources/cloud_oauth:@@ -0,0 +1,2022 @@ |
| 3-rclone-setup | gpt | F-RS-16 | Medium | Axis-based d-pads are rejected, but the fullscreen flow still starts | `projects/ROCKNIX/packages/network/rclone/sources/cloud_oauth:@@ -0,0 +1,2022 @@ |
| 3-rclone-setup | gpt | F-RS-17 | Medium | Session-state writes expose partial JSON to readers | `projects/ROCKNIX/packages/network/rclone/sources/cloud_oauth:@@ -0,0 +1,2022 @@ |
| 3-rclone-setup | gpt | F-RS-18 | Medium | Unauthenticated clients can consume unbounded request resources | `projects/ROCKNIX/packages/network/rclone/sources/cloud_oauth:@@ -0,0 +1,2022 @@ |
| 3-rclone-setup | gpt | F-RS-19 | Medium | Setup still contains waits that its stated deadlines do not bound | `projects/ROCKNIX/packages/network/rclone/sources/cloud_oauth:@@ -0,0 +1,2022 @@ |
| 3-rclone-setup | gpt | F-RS-20 | Medium | Seeding ignores an intentionally empty content destination | `projects/ROCKNIX/packages/network/rclone/sources/cloud_setup:@@ -0,0 +1,607 @@` |
| 3-rclone-setup | gpt | F-RS-21 | Medium | Identity healing can discard the only recorded legacy folder name | `projects/ROCKNIX/packages/network/rclone/sources/cloud_device_id:@@ -0,0 +1,388 |
| 3-rclone-setup | gpt | F-RS-23 | Medium | Existing-remote protection treats an enumeration error as absence | `projects/ROCKNIX/packages/network/rclone/sources/cloud_remote:@@ -0,0 +1,403 @@ |
| 3-rclone-setup | gpt | F-RS-24 | Medium | The remote-content renderer is built without its sandbox | `packages/web/webkitgtk/package.mk:@@ -0,0 +1,107 @@` — `pre_configure_target` |
| 3-rclone-setup | gpt | F-RS-25 | Low | A browser that exits itself leaves the cursor override behind | `projects/ROCKNIX/packages/network/rclone/sources/cloud_oauth:@@ -0,0 +1,2022 @@ |
| 3-rclone-setup | gpt | F-RS-26 | Low | The new standalone setup surfaces remain English-only | `projects/ROCKNIX/packages/network/cloud-signin-window/sources/cloud-signin-wind |

## The report

Write `/workspace/tmp/rocknix-session/streams/C-report.md` (create the directory if needed) and return its content as your final message. It carries: the branch and `git log --oneline <base>..HEAD`; per punch item -- **outcome** (resolved / open with reason), the commit, the test case's name, the FAIL line seen before the fix and the PASS after, the `Already written:` answer, and anything the integrator must prove on the VM or a device; per sweep row -- fixed (commit) or withdrawn (reason); the harness's final line (the `tools/last-good-scripts-test` PASS count); and a short list of what you could not do and why. No claim without its artifact: a commit hash, a test's output line, a grep.

## Do not

- Build an image or run `make`, `scripts/build`, `scripts/image`; touch `/workspace/repos/rocknix.worktrees/generic-x64` or `devices` (build worktrees); ssh to any host or guest; run `tools/vm-*` or `generic-x64-vm`; touch `/workspace/artifacts`.
- Push; commit on `next` or `test/qa-integration`; create or remove worktrees; edit files outside your list; read `~/.config/council/env`, `~/.ROCKNIX/`, or anything under `~/.config/possibility-forge/`.
- Ask questions: nobody is watching this stream; decide from the rules and say what you decided in the report. If an item is blocked, leave it open with the reason and go on.

## Run to completion

Wait for every command you start with bounded loops; return only when every punch item and every sweep row has an outcome. A few hours is expected.
