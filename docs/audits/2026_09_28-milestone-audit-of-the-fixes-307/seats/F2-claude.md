# Audit of the fixes — stream F2 (packages, recipes, RetroArch patches, rotation generators)

Corpus: the eight embedded sources, cited by path and the sha256 the Facilitator recorded. I read every hunk of `F2.diff` and cross-read each against `F2.plan.md`, the F2 harness block and `F2.report.md`. Nothing below is taken from the report alone.

A preliminary that shapes the whole review: **`F2.diff` is the range `417dcd8610..next` on F2's *paths*, not F2's *commits*.** It carries hunks with no row in F2's plan (`video_driver = "gl"` and the armhf line in the GENERIC_X64 `retroarch.cfg`; `cheevos_armsx2.sh`; `cheevos_ppsspp.sh`; `rocknix/package.mk` "#307 PL-073"; flycast `emu.cfg`; the mupen64plus `name = ""` line) — the harness fragments `F1i`/`F1j` embedded at the end of `F2.harness.txt` show these are stream F1's — and it is **missing** hunks the F2 report says it committed (gstreamer, ryzenadj/dmidecode, woff2, the empty quirk). Both facts are in the verdicts below.

---

## 1. Per punch item

### PL-002 — shared rotation generators outside their consumers' build stamps
**Verdict: holds** (at the stamp level; the `scripts/build` half is delegated, honestly).

- Mechanism: each of the five recipes gains
  `PKG_NEED_UNPACK="$(dirname "$(get_pkg_directory ${PKG_NAME})")/rotation-table-fba.py"` (fbalpha2012/2019/fbneo) or `.../rotation-table-mame.py` (mame2003-plus, mame2010) — `F2.diff`, hunks `@@ -7,40 +7,29 @@` (fbalpha2012-lr), `@@ -7,41 +7,30 @@` (fbalpha2019-lr), `@@ -7,10 +7,14 @@` (fbneo-lr), `@@ -7,37 +7,26 @@` (mame2003-plus-lr), `@@ -7,10 +7,14 @@` (mame2010-lr).
- Evidence the mechanism does what the acceptance asks: harness F2-1 extracts `calculate_stamp` from `config/functions` itself (`awk '/^calculate_stamp\(\) *\{/...'`), computes each recipe's stamp, appends `# an edit` to each generator, and asserts `[ -n "${s}" ] && [ -n "${F2_S0[${p}]}" ] && [ "${s}" != "${F2_S0[${p}]}" ]` (fails closed on an empty stamp). The two cross-family controls are asserted equal. Report: 5 of 7 FAIL before (`b1c882d34d07 -> b1c882d34d07`), 7 PASS after.
- `config/functions` is not in the packet, so I cannot read that `calculate_stamp` hashes `PKG_NEED_UNPACK`; the harness exercised the real function, which is the right kind of evidence. The acceptance's literal wording ("running `./scripts/build <core>` rebuilds the core") was not executed — the report says so and hands the integrator the exact check (`.stamps/fbneo-lr/build_target` moves).
- `Already written:` "nothing on a device; a warm root rebuilds the five cores once" — honoured: the new `PKG_NEED_UNPACK` changes every stamp exactly once.
- Side effect worth knowing: `PKG_NEED_UNPACK` is also the re-*unpack* trigger, so a generator edit re-unpacks and rebuilds the whole core, not only its install step. Heavier than necessary, but it is what the acceptance asks for.

### PL-032 — 0017's tables never apply on the shipped face; 0017 carries 0016's line as stale context
**Verdict: holds in part.**

What holds:
- The table is now chosen by the file the face is loaded from, in both branches: `gfx_widgets_sharp_face()` matches the path tail `ozone/regular.ttf` / `ozone/bold.ttf` (0017, hunk `@@ -54,6 +55,88 @@`); `gfx_widgets_font_init` takes `bool sharp` and asks the face (hunk `@@ -895,15 +978,33 @@`); all six call sites updated (`@@ -986,11 +1087,11 @@`, `@@ -1010,22 +1111,28 @@`). The never-true pointer comparison `font_file == p_dispwidget->ozone_regular_font_path` is gone — a defect the audit had not named, which the stream found and the harness now guards (`grep -q 'font_file == p_dispwidget->ozone_regular_font_path' && F2_BAD+=`).
- A `RARCH_LOG("[Widgets] font %s: %s, computed %.2f px, floor %.0f, %s%s, drawn %u px\n", ...)` per face (same hunk) — the acceptance's log line exists in code.
- Stale context: 0017's `MSG_QUEUE_MIN_SIZE` context line is now `13.0f` (`@@ -54,6 +55,88 @@` context), and the harness applies the fork's patches with `--fuzz=0 --dry-run` and fails on `with fuzz` (F2-4). 0016's title and body say 13 px.
- Harness F2-4 compiles the marked-out step alone and asserts `Inter UI Regular|Inter UI Bold|none|none|none|18|11.0`; the harness's expectation is consistent with a multiplicative band (17.4×1.3 ≥ 18; 11×1.3 < 15), which is what the header describes.

What does not hold, by the stream's own measurement: the acceptance's second half ("`frame-diff` shows the widget text at a sharp size"). Every shipped profile draws `xmb/monochrome/font.ttf` (M+ 1p), which has no table by design (0017 header, `@@ -2,34 +2,55 @@`: "29 % of strokes at 13 px, 63 % at 17 and 100 % only from 23"), so on every device nothing draws differently; the patch now truthfully says so. The stream leaves the decision (measure M+ into the rule, or change the profile face) to the maintainer and lists the register row that would need refining (D-UI-088). That is the right shape for an open item; it is still open.

`Already written:` "nothing" — honoured; the diff writes no device file.

### PL-043 — the build `.env` is written at parse time and an old 0644 copy is not tightened
**Verdict: holds.**

- `Makefile` `@@ -156,11 +156,6 @@` removes `docker-%: $(shell umask 077; ./scripts/get_env > .env)`. `@@ -175,5 +170,14 @@` writes it in the recipe as one shell (`\` continuations): `rm -f .env; trap 'rm -f .env' EXIT; trap 'exit 130' INT TERM HUP;` then `( umask 077 && ./scripts/get_env > .env ) || { echo ... >&2; exit 1; };` then the `docker run`. The redirection is performed inside the subshell after `umask 077`, so the file is created 0600; the preceding `rm -f` guarantees no older mode is inherited; a failing `get_env` starts no container and the EXIT trap removes the partial file; the shell's exit status is docker's because the EXIT trap does not itself `exit`.
- Harness F2-3 runs the recipe's own text (joined continuation lines, `$$`→`$`, `$(VAR)` blanked, a stub docker that records `stat -c %a .env`) against a planted 0644 `STALE=1` `.env`; report FAIL before `'644|STALE=1|'`, PASS after (`600`, fresh content, `.env` gone, rc 7 preserved, get_env-fails path). I checked the harness's join (`sub(/\\$/, "")` accumulating into `buf`) reproduces make's one-shell semantics.
- Side benefit: the removed `$(shell)` ran on *every* `make` invocation including `make -n`; that is gone.
- `Already written:` a leftover `.env` is removed at the next docker run — honoured by the leading `rm -f`.
- Acceptance literally asks for `stat` during a real build; only the stub was run. Same honest delegation as PL-002.

### PL-076 — the x64 RetroArch profile names an armhf core-updater endpoint
**Verdict: holds in the diff, credited elsewhere.** The report records it **open** ("the file is F1's"), but `F2.diff` contains the removal: `sources/GENERIC_X64/retroarch.cfg @@ -111,7 +111,6 @@` deletes `core_updater_buildbot_url = ".../armhf/latest/"`, and the harness tail carries an F1 case (`# F1j. #307 PL-076`) asserting `! grep -q '^core_updater_buildbot_url'`. So the acceptance ("the cfg line") is met in `next`; F2's "open" is a statement about ownership, not about the tree. The orchestrator should mark PL-076 resolved by F1, not open.

---

## 2. Findings

### G-F2-01: Four sweep fixes recorded with commit hashes have no hunk in the packet's diff
- **Severity:** High (if the commits are not on `next`); Medium (if the packet's path filter dropped them)
- **Category:** Report/diff mismatch
- **Where:** `F2.report.md` rows 2 (`4403918793`, gst-plugins-bad/base), 5 (`4f2b1c0cfa`, ryzenadj/dmidecode), 7 (`bccbf54cd4`: woff2 sentence, empty quirk `innotek GmbH VirtualBox/091-vbox-graphics`), 32 (`4403918793`), versus `F2.diff` as a whole.
- **What:** The diff contains no hunk under `projects/ROCKNIX/packages/multimedia/gstreamer/`, `packages/sysutils/ryzenadj/` or `dmidecode/`, `packages/graphics/woff2/`, or `projects/ROCKNIX/packages/hardware/quirks/devices/`. The only `packages/graphics` hunk is `cairo/package.mk` (comment). Yet `F2.plan.md` § "The files you own" names `woff2`, `cairo`, `pango`, `zip`, `gst-plugins-bad` explicitly, so a diff "restricted to the files stream F2 owned" should carry them if they merged. Harness cases F2-10, F2-11 and F2-12 read those files through `src_of`; their PASS on the stream's worktree says nothing about `next`.
- **Failure scenario:** F-PB-09, gpt F-PB-24 (a WebKit payload copy still ending `|| true` — the seat's "required payload treated as optional"), F-PB-19 and three of F-PB-21's four parts are recorded as fixed while `next` does not carry them; the harness's F2-10 checks would then FAIL on `next` (or SKIP if the fixture files are missing), which the integrator would discover only by running the suite on the integration branch.
- **Evidence:** searched the diff for `gstreamer`, `ryzenadj`, `dmidecode`, `woff2`, `innotek`, `libgstmpegts`: every occurrence is inside `F2.harness.txt` or `F2.report.md`, none in `F2.diff`. Settles it in one command: `git -C rocknix log --oneline 417dcd8610..next -- projects/ROCKNIX/packages/multimedia/gstreamer packages/sysutils/ryzenadj packages/graphics/woff2`.

### G-F2-02: 0018's Auto-slot keep now depends on the append config still being readable at content load
- **Severity:** Medium
- **Category:** Regression risk / guard direction
- **Where:** `0018-auto-slot-survives-content-load.patch`, `command.c @@ -1909,10 +1909,57 @@` (`command_append_config_sets_auto_slot`) and `runtime_file.c @@ -290,7 +292,16 @@`.
- **What:** The helper re-opens every `--appendconfig` file from disk (`config_file_new_from_path_to_string(ptr)`) at two points later than argv parsing: every content load and the runtime-log restore. If a file is unreadable or lacks `state_slot`, `is_auto` stays `false` and both sites fall through to upstream's reset. The old 0018 keyed on the sign alone and did not have this dependency.
- **Failure scenario:** ROCKNIX's launcher writes the append config to a path it later removes or rewrites (a per-launch temp file), or the file is regenerated without `state_slot` between parse and content load: the player launched from an auto save and the load-state hotkey goes to a slot 0 file that does not exist — exactly #249's symptom ("Loading state .../mspacman.state, 0 bytes"). The helper cannot tell "no key" from "could not read", and its default is the direction that reintroduces the regression.
- **Evidence:** the 0018 header's pass ("Probe.state.auto loaded ... 2026-09-26") predates this mechanism — the report says the header records "the pass from the 2026-09-26 01:30 UTC work-log entry", i.e. with the sign-only version. Harness F2-4 greps for the helper's presence and use (`grep -q 'command_append_config_sets_auto_slot()'`) and compiles; it does not run the path. The launcher is outside the packet. What settles it: the launcher's handling of its append file, and `proof-249-auto-slot.sh` on a guest with the new stack — the report lists the latter for the integrator.

### G-F2-03: ppsspp-lr's third hook placement is proved by calling the hook, not by the build system calling it
- **Severity:** Medium
- **Category:** Evidence gap (same class as the two prior misfires in this recipe)
- **Where:** `ppsspp-lr/package.mk @@ -59,18 +59,17 @@` (`post_patch()`); harness F2-6 `F2_CALL="...; declare -F post_patch >/dev/null && post_patch; ..."`.
- **What:** The strip moved from file scope (never ran, per the removed comment) to `post_unpack` (ran before the patch that adds the flag), and now to `post_patch`. F2-6 invokes `post_unpack`, the patches and `post_patch` itself, so it proves the hook's body in that order; it does not prove that `scripts/unpack` invokes a hook named `post_patch`. `scripts/unpack` is not in the packet.
- **Failure scenario:** if `post_patch` is not a recognised hook, x86_64 keeps `-mno-outline-atomics` — this time loudly (x86 gcc rejects the option), so the cost is a broken GENERIC_X64 build rather than a silent one, but the recipe would have missed for the third time.
- **Evidence:** the new comment asserts the ordering ("scripts/unpack runs post_unpack before it applies them") but not the hook's existence. Settles in one visit: `grep -n 'post_patch' scripts/unpack`.

### G-F2-04: the row-floor guard's firing now depends on the generator being the function's last statement
- **Severity:** Low
- **Category:** Guard robustness
- **Where:** the five `makeinstall_target` hunks, e.g. fbneo-lr `@@ -24,32 +28,16 @@`: `python3 ${PKG_DIR}/../rotation-table-fba.py --min 100 ${PKG_BUILD} > ...fbneo.txt` is the last line; the removed `rotation_table_check` called `die`.
- **What:** The floor now fails the build only through the generator's non-zero exit reaching the function's return status. The packet's own `rocknix/package.mk` hunk (`@@ -48,7 +48,12 @@`) states the rule this relies on ("a's failure ... as the function's last statement ... fails the install"), so today it fires. A later line appended after the generator call would swallow it unless the build shell runs `set -e`, which the packet cannot show.
- **Failure scenario:** a future edit adds a `cp` or `chmod` after the table line; a wrong source path then writes a short table and the build stays green — the audit's original PL-018 shape.
- **Evidence:** harness F2-2 tests the generator's exit status (`rc -ne 0`) and F2-2's recipe check greps for `--min [0-9]`; neither exercises the recipe's propagation. An explicit `|| die "..."` on the recipe line removes the dependency.

### G-F2-05: "live source only" excludes comments but not preprocessor-disabled code
- **Severity:** Low
- **Category:** Claim precision
- **Where:** `rotation-table-fba.py` and `rotation-table-mame.py` headers ("Comments are not source -- a driver or a flag inside /* */ or after // is not read"), `strip_comments()` in both.
- **What:** `#if 0` / inactive `#ifdef` branches are read as live. The report says 0 rotated `GAME()` in `#if 0` blocks at the pins — a check of the pins, not a property of the tool. A core bump could reintroduce a handful of false rows below the `--min 100` floor's sensitivity.
- **Evidence:** `LEXEME` has alternatives for `//`, `/* */`, strings and char literals only. Also noted, of no consequence at these pins: a C++14 digit separator (`1'000`) would be consumed by the char-literal alternative and could keep a following `//` comment on the same line as live text.

### G-F2-06: two of F2-4's sub-checks are line-bound against multi-line calls
- **Severity:** Low
- **Category:** Test strength
- **Where:** `F2.harness.txt`, F2-4: `grep -Eq 'gfx_widget_fonts\.regular,[^;]*font_path, BASE_FONT_SIZE, 9\.0f, NULL, 0\)'` and `grep -q 'RARCH_LOG([^;]*ROCKNIX'`.
- **What:** `grep` is line-based, so `[^;]*` cannot cross the newline inside a multi-line call. The first sub-check can never match the old code's shape (the call spans two lines) and is vacuous on both trees; the second inspects only a `RARCH_LOG` call's first line, so a fork issue number on a continuation line would pass. The composite `check` still fires on old code through its other sub-checks (`the-pointer-comparison-is-still-there`, `msg_queue-not-explicitly-tableless-in-both-branches`, `no-font-log-line`, `floor-not-13`), so the case is not a false pass — but two of its stated assertions are not being made.

### G-F2-07: a GENERIC_X64 profile change in the packet with no plan row, report line or harness case
- **Severity:** Low (probably F1's; a note for that packet)
- **Category:** Coverage
- **Where:** `sources/GENERIC_X64/retroarch.cfg @@ -765,7 +764,7 @@`: `video_driver = "vulkan"` → `"gl"`.
- **What:** A behaviour change to the QA device's default video driver. Nothing in this packet claims or tests it; the embedded F1 fragments (`F1i`, `F1j`) cover the flycast size lines, the mupen name line and the armhf key, not this. Consistent with `engineering-practices.md` § Guards must fail closed ("the image's default Vulkan driver -- which a QEMU guest cannot draw with"), so likely deliberate — but it should appear in some stream's plan and harness.
- **Evidence:** searched `F2.plan.md`, `F2.report.md` and `F2.harness.txt` for `video_driver`: no occurrence.

### G-F2-08: F-VM-09's `Already written:` answer leaves an upgraded guest with the spliced file
- **Severity:** Low
- **Category:** Upgrade path (D-WORKFLOW-050)
- **Where:** `mupen64plus-sa-core/config/GENERIC_X64/mupen64plus.cfg @@ -186,12 +186,6 @@`; `F2.report.md` § For the integrator ("An old guest keeps its spliced copy until that file is deleted").
- **What:** The fix is forward-only; `upgrade-and-install.md` § "Fixing forward is not enough" asks for read-both or a migration. The report states the gap plainly rather than claiming otherwise, and the file is a QA-device profile copied only when absent, so a fresh VM boot (which is what `tools/vm-qa` does) is unaffected. Recorded so the choice is visible, per § "A failure you find is yours to fix".

### G-F2-09: yabasanshiro-sa now builds on AMD64 and, by its own comment, fails there
- **Severity:** Low (informational; upstream parity chosen on purpose)
- **Category:** Reach
- **Where:** `yabasanshiro-sa/package.mk @@ -8,14 +8,16 @@`: "AMD64 meets the same CMake choice, which is upstream's to see."
- **What:** F-EM-05 asked that the fork not restrict upstream's AMD64; the fix restores upstream's state, including a package the recipe itself says cannot install on x86_64. If the fork ever builds AMD64 it breaks at this package. Harness F2-7 asserts only that AMD64 is not *skipped*.

### G-F2-10: F2-4 and F2-6 SKIP silently when the pinned sources are absent
- **Severity:** Low
- **Category:** Guard visibility
- **Where:** `F2.harness.txt`: `echo "    SKIP  retroarch-${RA_PIN:-?}.tar.gz is not under ..."` and the ppsspp equivalent.
- **What:** Twelve of the stream's 43 checks (all of the RetroArch and ppsspp evidence) depend on a sources cache being present on the host running the suite. The report ran with 0 SKIP; on a host without `/workspace/cache/rocknix-sources` the suite still ends `PASSED` with those checks absent. The SKIP is printed, which is the acceptable form — but the integrator should confirm their run shows 0 SKIP before quoting the count.

### G-F2-11: Doxygen block in command.c now documents the wrong function
- **Severity:** Low
- **Category:** Documentation drift
- **Where:** `0018 ... command.c @@ -1909,10 +1909,57 @@`: the new `command_append_config_sets_auto_slot()` is inserted between ` * @return \c The most recent savestate slot.\n */` and `void command_event_set_savestate_auto_index(...)`.

### G-F2-12: `gfx_widgets_sharp_face` assumes `/` separators
- **Severity:** Low
- **Category:** Upstream fit
- **Where:** `0017 @@ -54,6 +55,88 @@`: `font_path[len - flen - 1] == '/'`.
- **What:** RetroArch builds `ozone_regular_font_path` with `PATH_DEFAULT_SLASH`; on a non-`/` platform the face is never recognised. Harmless for ROCKNIX; a reviewer's remark if the series goes upstream.

Positive checks that turned up nothing (recorded so the orchestrator need not repeat them): the harness arithmetic reconciles (43 F2 checks by my count of `check` calls; 37 FAIL-on-old + 6 controls, and the six controls are the ones I would expect to pass both ways — F2-1's two cross-family stamps, F2-3's ".env gone/rc 7", F2-4's compile, F2-10's two "payload kept"; 386 + 43 = 429). No player-visible string is added anywhere in the diff (the `echo`s in `cheevos_*.sh` and the Makefile go to `${LOG_FILE}`/stderr; RARCH_LOG and the generators write to logs), so `es-player-text.md` is not engaged. The awk rewrite in `cheevos_armsx2.sh` (`@@ -83,16 +83,45 @@`, not F2's) reads correctly for the empty-file, no-section, duplicate-header and CRLF cases and uses `ENVIRON["TOKEN"]` so the token never enters argv; `proxy_listening` in `cheevos_ppsspp.sh` matches the kernel's uppercase little-endian-word encoding for `::1` and `::ffff:127.0.0.1` and returns a distinct 2 for "unreadable". The 0014 XMB fallback (`@@ -189,6 +189,50 @@`) mirrors the ozone test exactly. The 0019 re-place (`@@ -1166,6 +1187,24 @@`) is guarded by `current_msgs_size` and placed after `divider_width_1px` is final.

---

## 3. Sweep rows

**Fixed rows spot-checked against the diff — confirmed present:**
1. claude F-EM-02 — `ppsspp-lr` `post_patch()` (with G-F2-03's caveat).
2. claude F-EM-05 — `amiberry`/`yabasanshiro-sa` `if [ "${DEVICE}" = "GENERIC_X64" ]; then PKG_ARCH="aarch64"; fi`.
3. claude F-EM-08 — `mupen64plus-sa-audio-sdl` drops `libsamplerate`, keeps `speexdsp`, comment no longer says x86_64 (`@@ -7,8 +7,11 @@`); `NO_SRC=1` in `make_target` is outside the hunk, checked by F2-8's `declare -f`.
4. claude F-EM-15 / gpt F-EM-02 — gliden64 `+=" -DNOHQ=On"` behind `DEVICE = GENERIC_X64`; the fork's `x86_64)` case arm removed (`@@ -44,13 +44,16 @@`).
5. claude F-EM-10/11/12, gpt F-EM-04/06 — both generators: SPDX+copyright, correct usage line, `--min`, `strip_comments`, `macro` regex gone; five recipes pass `--min 100` and carry no `rotation_table_check`.
6. claude F-VM-09 — the six `[Retroid Pocket Gamepad]` lines removed from `[Input-SDL-Control1]`.
7. claude F-RW-05/06/07/08/10, gpt F-RW-03/04 — all present in 0018, 0014, 0019, 0011 as described above.
8. claude F-BR-10 — `packages/compress/zip/package.mk` and its patch deleted; the surviving `projects/ROCKNIX/packages/compress/zip` is not in the diff (unchanged), so "same steps, same patch byte for byte" is the report's word — see § 4.
9. claude F-PB-21 — only the cairo part (`@@ -6,9 +6,10 @@`) is in the diff; woff2 and the quirk are G-F2-01.
10. claude F-PB-09 / gpt F-PB-24 / claude F-PB-19 — **not in the diff** (G-F2-01).

**Withdrawn rows I can judge from the packet:**
- claude F-PB-12 "duplicate of PL-043" — holds; the `rm -f .env` before the write is exactly the first-run mode concern.
- claude F-EM-01 "duplicate of PL-002" — holds.
- gpt F-BR-18 (valloc probe) — the deleted patch text shows `#ifdef MMAP\n    valloc();\n#endif`, so the call is compiled only under `MMAP`; whether anything defines `MMAP` is outside the packet. The withdrawal is at least consistent with the hunk; and after the deletion the fork carries no copy of the patch in `packages/`, so the row's file no longer exists on the fork side.
- claude F-EM-13 / F-RW-09 (fork references, deferred to PR-prep #256) — consistent with the diff: the rewritten recipe comments carry none, while `gfx_widgets.h` in 0019 still says `ROCKNIX fork #296` and the gliden64 comment cites `9d13fbcbfa`; the log-string half of F-RW-09 is verifiably gone (`(ROCKNIX #296)` removed from the RARCH_LOG in 0019).
- claude F-RW-03 (D-UI-100), claude F-EM-06 (ES `CaptureRotation.cpp`), claude F-PB-20 (`GITHUB_*` grep), gpt F-PB-23 (`scripts/unpack` `rm -rf`), claude F-PB-15 — each rests on a file or register row not in the packet; cannot judge beyond noting the reasons are specific and checkable in one visit each.
- PL-076 "not my file" — the diff shows F1 removed the line; see the PL-076 verdict.

---

## 4. Coverage boundary

Could not be judged from this packet, stated plainly:
- `config/functions` (`calculate_stamp` and whether it hashes `PKG_NEED_UNPACK`), `scripts/unpack` (`post_patch` hook; `PKG_NEED_UNPACK` re-unpack), `scripts/build` (`set -e` / function-status handling) — PL-002, G-F2-03, G-F2-04.
- The pinned RetroArch source outside the hunks: `gfx_widgets_sharp_size`'s body (the band arithmetic is inferred from the header and the harness's expected `18|11.0`), `gfx_widgets_msg_queue_move`'s safety when called from `gfx_widgets_context_reset`, `string_is_equal` and `config_get_int` availability (the harness's `-fsyntax-only -Werror=implicit-function-declaration` compile is the evidence offered).
- The ROCKNIX launcher's append-config lifecycle — G-F2-02.
- `projects/ROCKNIX/packages/compress/zip` (the survivor of F-BR-10) and the `cmp` claim.
- The gstreamer, ryzenadj, dmidecode, woff2 and quirk files — G-F2-01.
- Anything on a guest or device: the `[Widgets] font` and `msg_queue place` lines, frame-diff, `proof-249-auto-slot.sh`, `stat -c %a .env` in a real docker build, the five cores' row counts (852/1923/2543/1642/2180), `/usr/bin/zip` in the image. The report lists these for the integrator and made none of them itself, consistent with the brief's "do not build/run".
- Register rows D-UI-088, D-UI-098, D-UI-100, D-QA-053 and the `tools/font-stems` measurements of M+ 1p — PL-032's open half rests on them.
- The rest of `tools/last-good-scripts-test` (only the F2 block and two F1 fragments are embedded), including `src_of`, `check` and `OLD` handling.