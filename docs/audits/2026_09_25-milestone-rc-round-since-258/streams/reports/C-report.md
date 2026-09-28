# Stream C report: the cloud sign-in broker and setup (audit #307 / #308)

## Summary

- **Branch:** `feature/pl-c` in `/workspace/repos/rocknix.worktrees/pl-c`. It was cut from `next` at `417dcd8610`. HEAD is `19e3a852b0`, 32 commits, not pushed.
- **Punch items:** all 10 are fixed in code, each with a test that failed before its fix and passes after.
  - Four acceptances also name a proof on a guest or a device, and those are still open for the integrator: PL-016, PL-017, PL-018 and PL-049.
  - PL-018's device fact is the one open item. No device or guest was used from this stream.
- **Sweep rows (32):**
  - 24 fixed.
  - 5 withdrawn with a reason: claude F-RS-11, F-RS-15, F-RS-25 and gpt F-RS-24, F-RS-26.
  - 3 left unfixed, because each needs a fact this stream could not get: claude F-RS-10, claude F-RS-12 and gpt F-RS-15.
  - claude F-RS-20 is part fixed; the rest of it is withdrawn with a reason.
- **Harness:** `tools/last-good-scripts-test` passes in full: **PASSED, 465 PASS, 0 FAIL, 0 SKIP**. The baseline was 386 PASS; stream C's block adds 79.
  - Against the scripts at `417dcd8610` (`BASE_REF=417dcd8610 … --old`), the block reads **54 FAIL, 25 PASS**. The 25 are guards that pass on the old code too.
- **Commits:** titles match `^[a-zA-Z0-9_*./-]+:[[:space:]].+$` and are at most 72 characters.
  - Five titles had a comma or space before the colon, or were too long. I reworded them with a non-interactive `rebase -x`.
  - The trees before and after are identical (empty `git diff`).
  - Every hash cited in a commit body was remapped, and each is an ancestor of HEAD.
- **Two findings beyond the brief:**
  - **The audit refuted gpt F-RS-04 (credentials in the log) wrongly.** It holds in `cloud_remote`: a failed `config create` wrote `pass=<password>` into `cloud_sync.log` in the clear. Fixed under PL-074.
  - **Offline RetroAchievements breaks on-device sign-in.** The offline proxy listens on `127.0.0.1:8080`, which is also the serve's default port, and a `0.0.0.0` bind cannot share that port. So with OFFLINE RETROACHIEVEMENTS on, every on-device sign-in failed with EADDRINUSE. It is fixed by binding the LAN address (claude F-RS-18).

## Decisions I made (no one to ask, per the brief)

- **Ownership paths.**
  - The brief says `projects/ROCKNIX/packages/web/`, but webkitgtk lives at `packages/web/webkitgtk`.
  - The sign-in window lives at `projects/ROCKNIX/packages/network/cloud-signin-window/`.
  - I took "webkitgtk, the sign-in window and its recipe" to mean those real paths.
  - No row named libsoup or libpsl, so I did not touch them.
- **PL-015: refuse rather than re-derive.**
  - A one-level saves folder (`/GAMES`) is refused where it is typed. The message says why and names the folder to use: "Try /GAMES/Saves."
  - I rejected deriving siblings under `/ROCKNIX`. On a bucket remote `/ROCKNIX` is an illegal bucket name, and it would move the player's settings and games somewhere they never chose.
  - "/" was already refused. Two-level and deeper paths keep `<parent>/Backups` and `<parent>/Content`.
- **PL-017's model.**
  - Every named key goes through one `act()`.
  - Back trims the box. With the box empty, Back still deletes on the handheld.
  - Enter, Tab, the arrows and Close send their key and then empty the box, because the focus has left the field the box was for.
  - Page up and Page down only scroll.
- **Moving the folder checks.**
  - The checks from PL-015 and PL-051 now live inside `syncpath_problem` (`384d1a14e9`).
  - The harness's case l lifts that function on its own. As a separate helper, the checks broke case l, which showed as 3 FAILs in the first full run.
- **Rules used.**
  - Read from `next` this session: `packaging-and-patches.md`, `rclone-cloud-sync.md`, and `generic-x64-vm-testing.md` § What the guest's busybox lacks. I also checked the image's `busybox --list` directly.
  - `engineering-practices.md`, `upgrade-and-install.md`, `working-principles.md`, `es-player-text.md` and `vm-first.md` came from session context. I diffed them against `next` at the end.
    - `working-principles.md` and `vm-first.md` are identical to `next`.
    - `next`'s `upgrade-and-install.md` has the D-WORKFLOW-050 shape (read both, migrated, or nothing inherited), which the answers below follow.
    - `next`'s `engineering-practices.md` and `es-player-text.md` add a device-read filter note and ES card wording. Neither touches this work.
- **Read-only use of a build worktree.** `/workspace/tmp/rocknix-session/streams/C-work/csyntax.sh` syntax-checks `cloud-signin-window.c` with the GENERIC_X64 root's own cross gcc 15.2.0, pkg-config and sysroot. Nothing is written there.
  - The harness already copies busybox from that root.

## Commits

`git log --oneline 417dcd8610..HEAD`:

```
19e3a852b0 tools/last-good-scripts-test: stream C's block says what it covers
384d1a14e9 cloud_setup: the folder checks live inside syncpath_problem
f018407793 rclone: comments that match the code, in the sign-in window too
128bb18fa9 cloud-signin-window: a symbols layout on the on-screen keyboard
2f8a5ae6a6 cloud-signin-window: keep the OAuth redirect out of the page file
cb8f9f61ef cloud-signin-window: focus_first leaves a focused control alone
af949f2cf0 rclone: commit cloud_oauth and cloud_device_id executable
8215d9f67c webkitgtk: patch 0001 says what it fixes
9907ec25b6 webkitgtk: build no MiniBrowser
3f2ff62b65 cloud_device_id: heal a poisoned id only once the old one is recorded
1972479765 cloud_oauth: a Close page button on the phone, for a pad it cannot read
0b9bb8cde8 cloud_oauth: mask the phone box, and say what crosses the network
70811f9cbe cloud_oauth: say which characters the handheld cannot type
c087fe179e cloud_oauth: every named key on the phone page goes through the box
077920c4d7 cloud_oauth: the phone box goes across when the page opens
45b576f2c4 rclone: a failed remote listing stops the create, in both creators
21be768deb cloud_oauth: listen on the LAN address, which also frees port 8080
41454d2045 cloud_oauth: bound what a client on the LAN can make the serve spend
646f7d164f cloud_oauth: bound the wait for rclone's link by the clock
135353e1b0 cloud_oauth: find and bridge a pad whose d-pad is a hat
f28d70e210 cloud_oauth: give sway its pointer hiding back however the window ends
0bdd0d2565 cloud_oauth: write session.json whole, one writer at a time
2c3fe042e8 cloud_oauth: hand the pad back before saying the sign-in is done
967b66bc68 cloud_oauth: SIGTERM unwinds the serve, and its window goes with it
e2d45ec7ec rclone: no rclone words or create arguments in cloud_sync.log
b05a1e3485 cloud_oauth: a dead attempt reads failed, and so does a taken port
754801892f cloud_oauth: set configured only once the remote answers
7d17396c68 cloud_setup: an empty CONTENT_REMOTE seeds the root, as it means
57e82cf95a cloud_setup: bound the rclone calls of the seeding and content-location
12fee6bbda cloud_setup: seed a README only where the folder's listing says none
b5e2beeed1 cloud_setup: write the config as text, never through sed or eval
a96cd98f8d cloud_setup: refuse a saves folder at the top of the cloud
```

Files changed: `cloud_setup`, `cloud_oauth`, `cloud_remote`, `cloud_device_id`, `cloud-signin-window.c`, `packages/web/webkitgtk/package.mk`, patch `webkitgtk-0001-…`, and `tools/last-good-scripts-test`. That is 8 files, +2122 / −156.

The harness changes are all in one block at the end of the file, headed `# ---- audit #307, stream C ----` and placed just before the final verdict line. The block has eight cases:

- **C1:** `cloud_setup --set-saves-remote` and the config writer.
- **C2:** `--seed-folders` against a cloud kept on disk, both path-based and bucket-shaped.
- **C3:** `cloud_oauth` and `cloud_remote` as Python groups, in a bwrap sandbox with its own pid and network namespaces.
- **C4:** the phone page's own script under node.
- **C5:** `cloud_device_id` healing.
- **C6:** the webkitgtk recipe and patches.
- **C7:** file modes.
- **C8:** `cloud-signin-window.c`. Its JavaScript string literals run under node, and one C helper is compiled with the host's `cc`.

## Punch items

"Before" lines come from the harness block run against `417dcd8610`, or against the unfixed working tree where the check reads the tree. "After" counts come from the final full run.

### PL-015: a root-level saves path nested the settings and content folders inside it

- **Outcome:** resolved. Commits `a96cd98f8d` and `384d1a14e9`.
- **Test:** C1, which runs `cloud_setup` whole in bwrap against a shim rclone.
- **Before:**
  ```
  FAIL rc 0; the config now reads: SAVES_REMOTE="/GAMES" SETTINGS_REMOTE="/GAMES/Backups" CONTENT_REMOTE="/GAMES/Content"
  FAIL --check-syncpath /GAMES: rc 0; said 'OK /GAMES '
  ```
- **After:** 5 PASS.
  - `/GAMES` is refused with the config untouched.
  - `Mine/Saves/` gets `/Mine/Backups` and `/Mine/Content`. `/a/b/Saves` gets its siblings the same way.
- **Already written (nothing inherited here, but a gap elsewhere):**
  - A config that an earlier `--set-saves-remote /X` wrote keeps `/X/Backups` and `/X/Content`. This fix reads nothing from it.
  - That nesting only deletes under `BACKUPMETHOD=sync`; the shipped default is `copy`.
- **For the integrator, stream A's files:**
  - `cloud_sync_helper` derives `CONTENT_REMOTE` for an upgraded `/GAMES` config the same way (`[ "${parent}" = "/" ] && parent="${user_sync}"`), so it produces `/GAMES/Content`.
  - `cloud_backup`'s nesting warning covers only the settings half, not content.

### PL-016: text typed on the phone before the window opened was never delivered

- **Outcome:** resolved. Commit `077920c4d7`.
- **Test:** C4.
- **Before:**
  ```
  FAIL typed before the window opened: the field holds "" while the box shows "me@example.com"
  ```
  plus the "then use the send button" line.
- **After:** 3 PASS.
- **Already written:** nothing inherited. The page is served per sign-in.
- **For the integrator:** the acceptance's proof is a guest run with the page driven by curl, plus the window's log.

### PL-017: the phone page's Back button bypassed the box's text model

- **Outcome:** resolved. Commit `c087fe179e`.
- **Test:** C4.
- **Before:**
  ```
  FAIL abc, Back, d: the field holds "abd", the box "abcd"
  FAIL user, Tab, pw: the field holds "pw", the box "userpw"
  ```
  The Enter button also left the box full.
- **After:** 5 PASS.
- **Already written:** nothing inherited.
- **For the integrator:** guest d's window log showing `abd` is the device-side proof. The node test is the doctest the acceptance allows.

### PL-018: `wait` returned at sign-in while the bridge still held the pad's grab

- **Outcome:** resolved in code. The acceptance's device fact is open.
- **Commit:** `2c3fe042e8`.
- **Fix:**
  - `signed_in()` stops the bridge, which releases EVIOCGRAB, before it writes the marker.
  - `wait`'s marker branch falls through to the `pad_is_free` settle loop.
- **Test:** C3, with the bridge reading a FIFO and EVIOCGRAB recorded.
- **Before:**
  ```
  FAIL grabs [(1, False)] (arg, marker present)
  FAIL wait returned 0 after 0 pad_is_free polls
  ```
- **After:** 2 PASS.
- **Already written:** nothing inherited; the grab ends with its file descriptor.
- **For the integrator:** prove that the pad moves the menu after an on-device sign-in without a restart. Use the guest with a uinput gamepad, or the RG35XX SP on its owner's yes, and add the row to `docs/releases/device-facts.md`.

### PL-047: a failed README probe overwrote the owner's note

- **Outcome:** resolved. Commit `12fee6bbda`, which also fixes #308 claude F-RS-09.
- **Fix:**
  - `seed_note` lists the folder with a bounded `lsf --files-only`.
  - It writes only when that listing succeeds and holds no README.
  - It uses `copyto --ignore-existing`.
- **Test:** C2.
- **Before:**
  ```
  FAIL the owner's README now reads: Game saves, save states, and screenshots.
  FAIL READMEs written with every listing failing
  FAIL bucket READMEs: ''
  ```
- **After:** 7 PASS.
- **Already written:** nothing to migrate.
  - A note an earlier build overwrote cannot be recovered from here.
  - A bucket an earlier build seeded has no READMEs; the next `--seed-folders` writes them.

### PL-048: `configured` was set before the remote was created and verified

- **Outcome:** resolved. Commit `754801892f`.
- **Fix:** one configuration attempt per session, under a lock. A concurrent caller waits and gets the same result, and `configured` is set only from that result.
- **Test:** C3.
- **Before:**
  ```
  FAIL submit got (True, 'qa') while the collector got (False, 'signed in, but the remote did not respond'); configured=True
  ```
- **After:** 3 PASS.
- **Already written:** nothing inherited; the state lives in `/var/run`.

### PL-049: `cancel`'s SIGTERM skipped the serve's `finally`, orphaning the window

- **Outcome:** resolved. Commit `967b66bc68`.
- **Fix:**
  - SIGTERM raises SystemExit; a second SIGTERM during teardown is ignored.
  - The whole serve runs inside one `try` whose `finally` calls `holder.end()`, which takes down the window, the bridge and rclone.
- **Test:** C3 runs `serve` as a process with a fake window, then runs `cancel`.
- **Before:**
  ```
  FAIL serve up True, window opened True, window gone after cancel False, serve ended True
  ```
- **After:** PASS.
- **Already written:** nothing inherited.
- **For the integrator:** the guest's window log after `cloud_oauth cancel` with the page up.

### PL-050: a token-less exit left the status at `waiting`; a taken port left a traceback and `starting`

- **Outcome:** resolved. Commit `b05a1e3485`.
- **Fix:**
  - The collector writes `failed` with `failure_reason()`. It skips this when a newer attempt has replaced its session (a `superseded` flag), so a restart is not reported as a failure.
  - A bind that fails writes `failed`, ends rclone, and exits 2.
- **Test:** C3.
- **Before:**
  ```
  FAIL status after rclone died without a token: 'waiting'
  FAIL port taken: rc 1, status 'starting', traceback True, authorize left running
  ```
- **After:** 3 PASS.
- **Already written:** nothing inherited.

### PL-051: paths were written into the config through an unescaped `sed`, and the config is sourced

- **Outcome:** resolved. Commits `b5e2beeed1` and `384d1a14e9`.
- **Fix:**
  - `conf_set` writes `KEY="value"` lines in one awk pass. Values arrive through the environment, and the result is renamed over the config: all three keys or none, and a failure is reported.
  - A name containing `"`, `$`, `` ` ``, `\` or a control character is refused where it is typed.
  - `--info` and `--seed-folders` now read values as text instead of sourcing or `eval`-ing the config.
- **Test:** C1.
- **Before:**
  ```
  FAIL rc 0; config: SAVES_REMOTE="/RSAVES_REMOTE="/ROCKNIX/Saves"D/Saves" …
  said: sed: bad option in substitution expression
  FAIL a command in the folder name ran when --info sourced the config
  ```
  Also failing: the read-only config printing OK, and `--seed-folders` running an already-written command.
- **After:** 12 PASS. `/R&D/Saves` and `/a|b/Saves` round-trip, and every other config line is unchanged byte for byte.
- **Already written:**
  - A value that the old sed garbled is read as it stands.
  - A `$( )` an earlier build wrote is still executed by the scripts that source the config (`cloud_backup` and `cloud_restore`, stream A). `cloud_setup`'s own readers now run nothing.

### PL-074: rclone's stderr was logged verbatim on a failed remote creation

- **Outcome:** resolved. Commit `e2d45ec7ec`.
- **Fix:**
  - `cloud_oauth` logs a fixed sentence and rclone's exit code.
  - The same finding holds in `cloud_remote`, which the audit had refuted: its `rclone()` logged the whole argv, including `pass=`. It now logs the verb and the exit code.
- **Test:** C3.
- **Before:**
  ```
  FAIL log: [... could not finish the sign-in: Failed to create: bad token=SECRETVALUE9]
  FAIL cloud_sync.log: [... rclone config create qa webdav url=https://dav.example pass=SECRETPASS9 --non-interactive --obscure failed (1) ...]
  ```
- **After:** 2 PASS.
- **Already written, left as it is:**
  - A `cloud_sync.log` from an earlier build may hold such a line.
  - `/var/log` is tmpfs unless debugging is on (D-CLOUD-027), so it went at the next reboot.
  - With debugging on, it stays in the persistent log until that rotates. This fix does not scrub it.

## Sweep rows (#308, packet 3-rclone-setup)

| seat | id | verdict |
| --- | --- | --- |
| claude | F-RS-04 | **Fixed** `9907ec25b6`. `-DENABLE_MINIBROWSER=OFF`. Its only use in 2.54.0 is `add_subdirectory(MiniBrowser/gtk)`, read from the source tarball. MiniBrowser is in the current GENERIC_X64 image. C6 check. `pkgcheck webkitgtk` exits 0. |
| claude | F-RS-09 | **Fixed** `12fee6bbda`, with PL-047. |
| claude | F-RS-10 | **Not fixed; open.** Following the interface's own bindings means reading the pad's `es_input.cfg` entry, and the shipped entries disagree: of the 81 in `es_input.cfg`, 38 carry no evdev `code` on `a`, and x/y sit at 307/308 on 14 and 308/307 on 8. A remap written without the H700's actual entry would move buttons on the one device where the current map is known to work. It needs that entry read from a device (no device is reachable from here), then a uinput-pad walk on the VM. Also open: the window's help-bar strings have no localisation (see gpt F-RS-26). |
| claude | F-RS-11 | **Withdrawn.** The sandbox half is not in C's files: it needs new bubblewrap and xdg-dbus-proxy packages (stream F2's lane or a new one) and a register row that accepts or schedules them. The frame-filter half is refuted by the window's own record: `on_decide_policy`'s comment says filtering third-party frames refused Dropbox's captcha and Google's button, and the form never became usable. |
| claude | F-RS-12 | **Not fixed; open.** No failure has been shown. Whether a gesture-attributed hop (OneDrive personal: `login.microsoftonline.com` to `login.live.com`) leaves the two-label suffix depends on the provider's page. Only a sign-in against a real account shows that; the VM can do it with a hosted QA account (vm-first). Refusals are already logged (`refused navigation to` in `window.log`). |
| claude | F-RS-13 | **Fixed** `57e82cf95a`. C2 argv check: 22 calls and 2 listings, all bounded. |
| claude | F-RS-14 | **Fixed** `f018407793`. The comments now match the code, and the dead `DRIVABLE_OAUTH` constant is removed. No test can exist for a comment. |
| claude | F-RS-15 | **Withdrawn.** The console flow's SSH port-forward is the rule's named exception ("only where technically unavoidable (e.g. rclone's OAuth authorize step)"). The rule-file drift ("There is no browser on the device" is now false) is in `.claude/rules/rclone-cloud-sync.md`, which is not this stream's file. Integrator. |
| claude | F-RS-16 | **Fixed** `70811f9cbe`. C4. |
| claude | F-RS-17 | **Fixed** `cb8f9f61ef`. C8: before `'1 1 0'`, after `'0 1 0'`. |
| claude | F-RS-18 | **Fixed** `21be768deb`. C3, 2 PASS. This includes the offline RetroAchievements proxy on `127.0.0.1:8080`. |
| claude | F-RS-19 | **Fixed** `f28d70e210`. C3, 2 PASS. |
| claude | F-RS-20 | **Part fixed** `2f8a5ae6a6`: the page file no longer records the loopback redirect that carries the code (C8, a host-`cc` test of `page_worth_recording`). **The rest is withdrawn:** `rclone config create` has no stdin or env path that persists a remote, and every ROCKNIX process runs as root, which can already read `rclone.conf` where the same secrets land. The argv adds no reader. `PROVIDER=` on stdout is the interface's contract and carries a single-use `state`. |
| claude | F-RS-21 | **Fixed** `af949f2cf0`. C7. |
| claude | F-RS-23 | **Fixed** `0bdd0d2565`. C3. |
| claude | F-RS-24 | **Fixed** by this block: C1, C2 and C5, in commits `a96cd98f8d`, `b5e2beeed1`, `12fee6bbda`, `57e82cf95a`, `7d17396c68` and `3f2ff62b65`. |
| claude | F-RS-25 | **Withdrawn.** Upstream fit, for the PR-prep pass #256. `-j4` is the maintainer's call, recorded in `device-builds.md` § Before a build. |
| claude | F-RS-26 | **Fixed** `8215d9f67c`. C6 checks that each patch is described and applies dry to 2.54.0 from the sources cache. |
| gpt | F-RS-12 | **Fixed** `128bb18fa9`. An `OSK_SYMBOLS` layout plus a `#+=` key; C8 checks every printable ASCII character is reachable. **Frames needed:** each layout at 640x480 on the VM. |
| gpt | F-RS-13 | **Fixed** `70811f9cbe`. Duplicate of claude F-RS-16. |
| gpt | F-RS-14 | **Fixed** `0b9bb8cde8`. The box is masked with a Show toggle. The page's note now says keystrokes cross the network unencrypted (F-RS-01's page half). |
| gpt | F-RS-15 | **Not fixed; open.** Duplicate of claude F-RS-10; the same fact is needed. |
| gpt | F-RS-16 | **Fixed** `135353e1b0` (hat d-pads) and `1972479765` (a "Close page" key on the phone). C3 and C4. |
| gpt | F-RS-17 | **Fixed** `0bdd0d2565`. Duplicate of claude F-RS-23. |
| gpt | F-RS-18 | **Fixed** `41454d2045`. A 64 KiB body cap (413), a 15 s request timeout, and 16 connections. C3, 3 PASS. |
| gpt | F-RS-19 | **Fixed**: the `cloud_oauth` half in `646f7d164f` and the `cloud_setup` half in `57e82cf95a`. |
| gpt | F-RS-20 | **Fixed** `7d17396c68`. C2. |
| gpt | F-RS-21 | **Fixed** `3f2ff62b65`. C5. |
| gpt | F-RS-23 | **Fixed** `45b576f2c4` in both creators. C3. |
| gpt | F-RS-24 | **Withdrawn.** Duplicate of claude F-RS-11; not in C's files. |
| gpt | F-RS-25 | **Fixed** `f28d70e210`. Duplicate of claude F-RS-19. |
| gpt | F-RS-26 | **Withdrawn** to the recorded follow-up. `es-player-text.md` says the fork's cloud strings since 2026-08 "have no French yet and are a follow-up". These two surfaces (GTK labels and Python HTML) have no translation path at all, which needs its own design and issue. |

## Harness

The final full run of `tools/last-good-scripts-test` on `19e3a852b0` ends with `PASSED`: 465 PASS, 0 FAIL, 0 SKIP.

The block needs `python3`, `node`, `cc` and `patch` on the host, plus bwrap with `--unshare-pid` and `--unshare-net`. If node or cc is missing, their checks FAIL rather than pass. If the webkitgtk tarball is missing, the patch dry run prints a SKIP line, following case t's precedent.

## For the integrator, and what I could not do

- **Rebuild cost.** webkitgtk rebuilds because both its `package.mk` and its patches directory changed, and at `-j4` it is the long pole of the next GENERIC_X64 and H700 build. `cloud-signin-window` rebuilds too.
  - After the build, `unsquashfs -ll SYSTEM` should show no `usr/libexec/webkit2gtk-4.1/MiniBrowser`.
- **VM and device proofs this stream did not run** (it is not allowed to):
  - PL-016 and PL-017: the page driven by curl, and guest d's window log.
  - PL-049: `cancel` with the page up.
  - PL-018: a uinput pad after an on-device sign-in, and its row in `device-facts.md`.
  - The symbols keyboard frames at 640x480 (gpt F-RS-12).
  - `focus_first` still landing the caret in the first field on a real page.
  - A sign-in with OFFLINE RETROACHIEVEMENTS on.
  - A OneDrive personal sign-in, for claude F-RS-12.
  - The H700's `es_input.cfg`, for claude F-RS-10 and gpt F-RS-15.
- **Not this stream's files:**
  - `cloud_sync_helper`'s `/GAMES` to `/GAMES/Content` derivation, and `cloud_backup`'s missing content-nesting warning (stream A).
  - A register row accepting plaintext on the LAN, which the audit's F-RS-01 verdict asks for.
  - `rclone-cloud-sync.md`'s now-false "There is no browser on the device".
- **Scratch material:** the scratch tests, the evidence log (`evidence.md`) and the helper scripts are in `/workspace/tmp/rocknix-session/streams/C-work/`. The block logs against the base and the branch are `old-block.log` and `new-block.log`, and the final full run is `final.log`.
