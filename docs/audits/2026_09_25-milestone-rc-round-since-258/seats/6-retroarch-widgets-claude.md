# Council audit — bucket 6-retroarch-widgets (council-facilitator@1.2.0 corpus)

## Summary

The bucket adds seven RetroArch patches and a new `sources/GENERIC_X64/` configuration set. Two patches fix the threaded video wrapper: 0011 serialises posters with a mutex, and 0015 gates dispatch on `send_cmd`, the one mailbox flag the consumer clears; 0015's diagnosis (a completed packet copied and re-run on a frame-update wake) follows from the protocol shown in the hunks and is the soundest work here. Four patches rework the notification widgets (0014 re-measures a backdrop with the font it is drawn with and derives the widget scale in one place; 0016 floors the message-queue font; 0017 lifts computed sizes to a table of sharp integer sizes; 0019 re-places the stack and adds log lines), and 0018 stops two code paths from overwriting a negative `state_slot`. The widget series is internally inconsistent: 0017's sharp-size tables are wired only into the ozone-fonts branch, the shipped `retroarch.cfg` sets `video_font_path`, and 0019's own numbers ("the 13 px face") show the queue drawn at 0016's floor with no lift — so 0017 does not do what its message says on this configuration (F-RW-01). 0016 was hand-edited from 14 to 13 after 0017 was generated against it: 0017's leading context no longer matches, and both messages describe a 14 px floor the code does not have (F-RW-02). 0019 cuts the stack's distance from the panel's bottom edge to roughly a quarter at every resolution while measured at one (F-RW-03); the `GENERIC_X64` config is a 640x480 QA-VM tuning with ARM residue shipped as a device default (F-RW-04); and 0018 treats any negative persisted `state_slot` as the launcher's intent, a silent behaviour change for upgraded devices that already hold one (F-RW-05).

## Findings

### F-RW-01: 0017's sharp-size tables are never applied on the shipped configuration; the series' later numbers confirm it
- **Severity:** High
- **Category:** Correctness
- **Where:**
  - `projects/ROCKNIX/packages/emulators/libretro/retroarch/patches/0017-widgets-sharp-font-sizes.patch` hunk `@@ -1006,20 +1053,22 @@` (the `/* Load fonts from user-supplied path */` branch)
  - `projects/ROCKNIX/packages/emulators/libretro/retroarch/patches/0017-widgets-sharp-font-sizes.patch` hunk `@@ -980,11 +1025,13 @@` (the ozone-fonts branch)
  - `projects/ROCKNIX/packages/emulators/libretro/retroarch/sources/GENERIC_X64/retroarch.cfg` (new file, key `video_font_path`)
  - `projects/ROCKNIX/packages/emulators/libretro/retroarch/patches/0019-widgets-message-queue-keeps-its-place.patch` header prose and hunk `@@ -1080,6 +1101,18 @@`
- **What:** `gfx_widgets_sharp_size` receives a table only in the branch that loads the ozone faces; the branch taken when a `video_font_path` is configured passes `NULL, 0` for all three fonts, and the shipped configuration sets `video_font_path`. On that configuration the message queue is drawn at 0016's floor and the banner at its truncated computed size; 0017's message claims otherwise.
- **Failure scenario:** GENERIC_X64 (and, by 0014's account, the RG35XX SP) with `video_font_path = "/usr/share/retroarch-assets/xmb/monochrome/font.ttf"` → `gfx_widgets_layout` takes the user-path branch → `gfx_widgets_sharp_size(scaled_size, NULL, 0)` returns its input → queue drawn at 13 px (0016's floor), banner at 17 px, not the 15 and 18 that 0017 says a 640x480 panel gets. The readability outcome #251/#255 set out to deliver is not delivered, and nothing reports it.
- **Evidence:** 0017's user-path branch: `gfx_widgets_font_init(... font_path, BASE_FONT_SIZE, 9.0f, NULL, 0);` (twice) and `gfx_widgets_font_init(... font_path, MSG_QUEUE_FONT_SIZE, MSG_QUEUE_MIN_SIZE, NULL, 0);`. `gfx_widgets_sharp_size`: `if (!sharp) return scaled_size;`. The cfg: `video_font_path = "/usr/share/retroarch-assets/xmb/monochrome/font.ttf"`. 0014's own message names that file as the face the widgets draw: "in the shipped widget font (xmb/monochrome/font.ttf, video_font_path)". 0017's message: "On a 640x480 panel the banner goes 17 -> 18 and the queue 14 -> 15" and its tables were "measured ... tools/font-stems over the ozone faces" (Inter UI), not over the file the cfg names. 0019, written after 0017 and measured on the same panel, says "12 px on a 640x480 panel with the 13 px face" and prints `msg_queue_rect_start_x` computed from that face — consistent with a 13 px queue and no lift, and inconsistent with a 15 px queue. Refutation attempted: I looked for a launcher or append config that blanks `video_font_path` for the widgets (none in the packet), for the tables being passed in the user-path branch (they are `NULL, 0`), and for any statement in 0016–0019 that the queue was observed at 15 px (none; the only post-0017 observation is 13). A second, independent way the queue lift can be dead is visible in the ozone branch itself: the tables are selected by pointer identity, `(font_file == p_dispwidget->ozone_regular_font_path) ? REGULAR_SHARP_SIZES : NULL`, and the `switch` that assigns `font_file` is outside the packet.
- **Fix:** Decide which face the widgets actually draw on ROCKNIX and measure that one. Either clear `video_font_path` for the widget fonts so the ozone faces (the ones measured) are used, or select the sharp table by the face's identity (basename or a family probe) in both branches. Rewrite 0016/0017's messages to state the face and sizes that the shipped configuration produces, and add the 0019 log line's output from the QA guest to the proof so the drawn size is recorded rather than asserted.
- **Confidence:** medium — the two load-bearing facts (the `NULL, 0` in the user-path branch; the non-empty `video_font_path` in the shipped cfg) are in the packet; that `gfx_widgets_layout`'s `font_path` is `video_font_path` rests on 0014's commit text and the branch's own comment, not on code in the packet, and the RG35XX SP's cfg is outside it.

### F-RW-02: 0016 was hand-edited after 0017 was generated; 0017's context is stale and both messages describe a floor the code does not ship
- **Severity:** Medium
- **Category:** Build/packaging
- **Where:**
  - `projects/ROCKNIX/packages/emulators/libretro/retroarch/patches/0016-widgets-message-queue-floor.patch` title line, `---`/`+++` header, hunk `@@ -44,6 +44,15 @@`
  - `projects/ROCKNIX/packages/emulators/libretro/retroarch/patches/0017-widgets-sharp-font-sizes.patch` hunk `@@ -53,6 +53,46 @@` (leading context) and header prose
- **What:** 0017's hunk expects the tree to contain `#define MSG_QUEUE_MIN_SIZE  14.0f` preceded by a comment ending `(ROCKNIX fork, #251). */`; 0016 as shipped writes `13.0f` preceded by `(ROCKNIX fork, #251; 14 until #296). */`. The two outermost lines of 0017's leading context do not match the tree 0016 produces, so 0017 applies only if the build's patch tool accepts a fuzz of 2. 0016's title ("never drawn under 14 px") and body ("the message queue gets 14") and 0017's body ("The 14 px floor (0016) stays under it", "the queue 14 -> 15") describe the 14 that was edited away.
- **Failure scenario:** Build applies patches with `git apply` or `patch --fuzz=0` → "Hunk #1 FAILED" on 0017 → RetroArch does not build. Build applies with GNU `patch` defaults → hunk succeeds "with fuzz 2" because the surviving context is a blank line and `static dispgfx_widget_t dispwidget_st = {0}; ...`, and the tree is right by accident; the next regeneration of either patch breaks it.
- **Evidence:** 0016: `+#define MSG_QUEUE_MIN_SIZE  13.0f` and `+ * computed size is already larger (ROCKNIX fork, #251; 14 until #296). */`. 0017 context: ` * computed size is already larger (ROCKNIX fork, #251). */` and `#define MSG_QUEUE_MIN_SIZE  14.0f`. The hand edit is dated by the packet itself: 0016's file headers read `2026-09-24 01:08:39` while its text cites #296, the issue 0019 works and dates `2026-09-27`. Refutation attempted: I checked whether 0019 re-defines `MSG_QUEUE_MIN_SIZE` (it does not touch that region) and whether 0017's context could match 0016's output at any fuzz below 2 (it cannot; both mismatching lines are the first two of three).
- **Fix:** Put the 14→13 change where its issue lives: restore 0016 to 14.0f (matching its message) and let 0019 change the floor to 13 with the #296 rationale; or regenerate 0016 and 0017 from a tree carrying the final value and rewrite both messages. Add a `patch --dry-run --fuzz=0` (or `git apply --check`) pass over `patches/` to `tools/rc-preflight` so a stale context fails before the build.
- **Confidence:** high on the mismatch (every line is in the packet); medium on the build outcome (the patch invocation is in `scripts/unpack`, outside the packet).

### F-RW-03: 0019 moves the notification stack's foot to about a quarter of its former distance from the bottom edge at every resolution, measured at one
- **Severity:** Medium
- **Category:** Player text
- **Where:**
  - `projects/ROCKNIX/packages/emulators/libretro/retroarch/patches/0019-widgets-message-queue-keeps-its-place.patch` hunk `@@ -623,12 +624,26 @@`
  - `projects/ROCKNIX/packages/emulators/libretro/retroarch/patches/0019-widgets-message-queue-keeps-its-place.patch` hunk `@@ -1080,6 +1101,18 @@`
- **What:** The bottom box's offset changes from `msg_queue_padding * 4` (≈ 2.67 × the queue line height) to `msg_queue_rect_start_x` (`ceil(msg_queue_padding - simple_widget_padding * 0.10)`, ≈ 0.6 × the line height) on every panel, including the 720p-and-up panels where 0016/0017 change nothing by design and where the commit reports no measurement.
- **Failure scenario:** A handheld docked to a 1080p television with ozone (scale 1.0 × 1.5): queue font 30 px, line height ≈ 36, `msg_queue_padding` = 24 → the stack's foot moves from ≈ 96 px above the edge to ≈ 21 px. A TV applying a 2–3 % overscan hides 22–32 rows; the bottom notification's backdrop and text sit in that band.
- **Evidence:** Removed: `y += (p_dispwidget->msg_queue_padding * 4.0f);`. Added: `y  = (float)p_dispwidget->msg_queue_bottom_margin;` with `p_dispwidget->msg_queue_bottom_margin = p_dispwidget->msg_queue_rect_start_x;`. Context lines give `msg_queue_padding = (unsigned)(((float)...msg_queue.line_height * (2.0f / 3.0f)) + 0.5f);` and `msg_queue_rect_start_x = ceil(p_dispwidget->msg_queue_padding - (p_dispwidget->simple_widget_padding * 0.10f));`. The header prose: "Measured per build at the H700's widget scale in docs/qa-frames/2026-09-27" and "the maintainer chose the left margin's number from mock-ups" — a 640x480 decision applied globally. Refutation attempted: I looked for a resolution or scale condition on the new placement (none), and for a lower bound on `msg_queue_bottom_margin` (none).
- **Fix:** Keep upstream's `padding * 4` foot where the computed queue face is not floored (the ≥ 720p case 0016 already distinguishes), or express the margin as `max(rect_start_x, some fraction of video_height)`; state the 1080p and 1280x800 placements in the message with the same specificity as the 640x480 one.
- **Confidence:** medium — the ratio is arithmetic from formulas in the packet (the `simple_widget_padding` formula is outside it, but enters at weight 0.10); whether the maintainer accepts the near-edge placement on large panels is a judgement the packet does not record.

### F-RW-04: `sources/GENERIC_X64/` ships a 640x480 QA-VM tuning, with ARM residue, as the device's default configuration
- **Severity:** Medium
- **Category:** Upstream fit
- **Where:**
  - `projects/ROCKNIX/packages/emulators/libretro/retroarch/sources/GENERIC_X64/retroarch.cfg` (new file; keys `video_fullscreen_x`, `video_fullscreen_y`, `custom_viewport_width`, `custom_viewport_height`, `core_updater_buildbot_url`, `input_*_btn`, `emuelec_exit_to_kodi`)
  - `projects/ROCKNIX/packages/emulators/libretro/retroarch/sources/GENERIC_X64/retroarch-core-options.cfg` (new file; `pcsx_rearmed_neon_*`)
- **What:** The new device config pins a 640x480 fullscreen mode and viewport, points the core updater at the `armhf` buildbot, carries NEON-only core options and an EmuELEC-era key, and binds hotkeys to one pad's button numbers. It reads as a copy of an ARM handheld's config adjusted to mimic the RG35XX SP for the QA harness, and it becomes the clean-install default for whatever `GENERIC_X64` builds.
- **Failure scenario:** A fresh flash of a GENERIC_X64 image on an x86 handheld or PC with a 1280x800 or 1920x1080 panel → RetroArch asks the KMS context for a 640x480 mode and sets a 640x480 custom viewport; the online updater, if enabled, fetches ARM binaries. If `GENERIC_X64` names only the fork's QA VM, the scenario does not reach a player, and the finding reduces to an upstream-fit one.
- **Evidence:** `video_fullscreen_x = "640"`, `video_fullscreen_y = "480"`, `custom_viewport_width = "640"`, `custom_viewport_height = "480"`, `core_updater_buildbot_url = "http://buildbot.libretro.com/nightly/linux/armhf/latest/"`, `pcsx_rearmed_neon_enhancement_enable = "disabled"`, `pcsx_rearmed_neon_interlace_enable = "disabled"`, `emuelec_exit_to_kodi = "false"`, `input_enable_hotkey_btn = "6"`, `input_exit_emulator_btn = "7"`. `upgrade-and-install.md` § "The two questions" requires the clean-install answer for every change; none is in the packet. Refutation attempted: I looked for a `package.mk` hunk scoping this directory to the VM (none in the diff) and for a neutral `0`/`0` fullscreen mode (the values are fixed).
- **Fix:** Ship a neutral GENERIC_X64 default (`video_fullscreen_x/y = "0"`, no custom viewport, x86_64 buildbot path or `menu_show_core_updater` left off with the URL blanked, no `neon`/`emuelec` keys) and inject the 640x480 mimicry from the QA harness as an append config; if the directory exists only for the VM, say so in the package and keep it out of the upstream submission.
- **Confidence:** medium — the content is certain; whether `GENERIC_X64` is a shipped ROCKNIX image or the fork's VM-only device, and how `package.mk` selects `sources/<DEVICE>`, are outside the packet.

### F-RW-05: 0018 exempts any negative `state_slot` from the load-time reset, including one an upgraded device already persisted
- **Severity:** Medium
- **Category:** Upgrade path
- **Where:**
  - `projects/ROCKNIX/packages/emulators/libretro/retroarch/patches/0018-auto-slot-survives-content-load.patch` hunk `@@ -1913,6 +1913,15 @@` (command.c)
  - `projects/ROCKNIX/packages/emulators/libretro/retroarch/patches/0018-auto-slot-survives-content-load.patch` hunk `@@ -290,7 +291,15 @@` (runtime_file.c)
- **What:** The guard keys on the sign of the current `state_slot` setting, not on the launcher having set it for this launch. A `-1` that reached `/storage/.config/retroarch/retroarch.cfg` or an override under the old RetroArch (the quick menu's Auto entry plus any config save) was harmless before — the old code reset it at every content load — and is sticky now.
- **Failure scenario:** Upgraded device whose saved cfg holds `state_slot = "-1"` and `savestate_auto_index = "true"` → after the update every launch stays on Auto: `command_event_set_savestate_auto_index` returns before `command_scan_states`, the runtime log's remembered slot is never restored, and the save hotkey writes `.state.auto` instead of the next numbered slot. The player changed nothing and the behaviour of two settings changed without a message.
- **Evidence:** `if (settings->ints.state_slot < 0) return;` placed before `if (savestate_auto_index)`, and `if (config_get_ptr()->ints.state_slot >= 0) runloop_st->entry_state_slot = state_slot;`. The comment asserts intent from the value alone: "it was configured on purpose: ROCKNIX's launcher sets state_slot = -1". `upgrade-and-install.md` § "Every fix answers what was already written (D-WORKFLOW-050)" requires the trace to say what old code left on devices — here a persisted `state_slot` and the runtime log's slot — and the packet carries no such line for this fix. Refutation attempted: I looked for the launcher writing `state_slot` on every launch (which would overwrite a persisted `-1`); the launcher change is not in this diff. I looked for `config_save_on_exit` being forced off everywhere (the shipped cfg has it `"false"`, but overrides and the quick menu's save path are not governed by it).
- **Fix:** Carry the launcher's intent explicitly rather than inferring it from the sign: have the launcher set `savestate_auto_index = "false"` alongside `state_slot = "-1"` in the append config (which makes the command.c guard unnecessary), and guard the runtime-log restore on a launcher-provided marker rather than on the persisted value; record the D-WORKFLOW-050 line for #249.
- **Confidence:** medium — the sticky path follows from the two hunks; how often a `-1` is already persisted on devices depends on files outside the packet.

### F-RW-06: 0018's proof records two failures and no pass
- **Severity:** Low
- **Category:** Test gap
- **Where:**
  - `projects/ROCKNIX/packages/emulators/libretro/retroarch/patches/0018-auto-slot-survives-content-load.patch` header prose
- **What:** The message reports the defect on the device (2026-09-25, unpatched) and on the QA guest with only the command.c half (2026-09-26), and stops there; no observation with both halves applied is stated.
- **Failure scenario:** none demonstrated.
- **Evidence:** "on an RG35XX SP, 2026-09-25 ... and again on the QA guest with the first half alone patched (2026-09-26), where the log's remembered 0 was the second half." Nothing follows about the complete patch loading the `.state.auto` file. Refutation attempted: I re-read the message for a date or log line after the second observation; there is none.
- **Fix:** Add the passing observation (the `[State] Loading state ".../mspacman.state.auto"` line, or its equivalent) from the guest with both hunks applied, with its date.
- **Confidence:** medium — absence in the message is certain; the proof may exist in the tracker, outside the packet.

### F-RW-07: 0014's single scale derivation still splits at a context reset when XMB is configured
- **Severity:** Low
- **Category:** Correctness
- **Where:**
  - `projects/ROCKNIX/packages/emulators/libretro/retroarch/patches/0014-widgets-backdrop-follows-the-font.patch` hunk `@@ -189,6 +189,45 @@`
- **What:** The XMB branch is keyed on `p_disp->menu_driver_id == MENU_DRIVER_ID_XMB`, which the patch itself says reads `UNKNOWN` at a context reset; only the ozone multiplier gets the configured-name fallback. With XMB configured, a reset lays out at the DPI scale and the first frame at the widget-pixel scale — the two-layout window the patch says it removes.
- **Failure scenario:** `menu_driver = "xmb"` → reset uses `gfx_display_get_dpi_scale`, first `gfx_widgets_iterate` uses `gfx_display_get_widget_pixel_scale` → two font rebuilds at launch. The visible symptom (a mismeasured backdrop) is caught by the patch's second change, so the effect is the wasted rebuild and a message that overstates the first change.
- **Evidence:** `if (p_disp->menu_driver_id == MENU_DRIVER_ID_XMB) scale_factor = gfx_display_get_widget_pixel_scale(...)` with no `MENU_DRIVER_ID_UNKNOWN && string_is_equal(settings->arrays.menu_driver, "xmb")` counterpart, against the message's "a reset lays out once, at the scale the frame loop keeps" and "menu_driver_id reads UNKNOWN there". Refutation attempted: looked for the XMB id being set before the widgets' reset; the patch's own account says it is not.
- **Fix:** Apply the same `UNKNOWN && name` fallback to the XMB test, or state in the message that the single-derivation claim holds for ozone only.
- **Confidence:** high on the asymmetry (both conditions are in the hunk); the runtime order is the patch's own claim.

### F-RW-08: 0019's placement log line prints geometry the code does not use for full-size messages or scaled dividers
- **Severity:** Low
- **Category:** Documentation
- **Where:**
  - `projects/ROCKNIX/packages/emulators/libretro/retroarch/patches/0019-widgets-message-queue-keeps-its-place.patch` hunk `@@ -1080,6 +1101,18 @@`
  - `projects/ROCKNIX/packages/emulators/libretro/retroarch/patches/0019-widgets-message-queue-keeps-its-place.patch` hunk `@@ -944,6 +960,11 @@`
- **What:** The line reports `box` as `msg_queue_height / 2` and `pitch` as `msg_queue_height / 2 + 1` unconditionally, while the placement uses `msg_queue_height` for a message that is not `size_small` and `floor(divider_width_1px)` for the divider; the font line reports `drawn %.2f` from a float the driver truncates.
- **Failure scenario:** 1080p ozone: `divider_width_1px = (unsigned)(1.5 + 0.5) = 2` (formula in 0014's context) and a full-size message's pitch is `msg_queue_height + 2`; the log says `/2 + 1`. A 17.4 px face with no table match logs `drawn 17.40` while 17 is drawn.
- **Evidence:** `RARCH_LOG("[Widgets] msg_queue place: line height %.2f, box %u px, pitch %u, ...", ..., p_dispwidget->msg_queue_height / 2, p_dispwidget->msg_queue_height / 2 + 1, ...)` versus `float box = size_small ? (float)(p_dispwidget->msg_queue_height / 2) : (float)p_dispwidget->msg_queue_height;` and `y += floor(p_dispwidget->divider_width_1px);`. Refutation attempted: looked for the log being conditioned on `size_small` or on the divider; it is not.
- **Fix:** Log both box heights and the actual divider, and log `drawn` as the integer the font driver will use.
- **Confidence:** high — all lines are in the packet.

### F-RW-09: fork issue numbers and QA paths in shipped strings and code comments; inconsistent patch headers
- **Severity:** Low
- **Category:** Convention
- **Where:**
  - `.../patches/0019-widgets-message-queue-keeps-its-place.patch` hunks `@@ -29,6 +29,7 @@`, `@@ -944,6 +960,11 @@`, `@@ -1080,6 +1101,18 @@`
  - `.../patches/0014-widgets-backdrop-follows-the-font.patch` hunk `@@ -876,6 +915,48 @@`
  - `.../patches/0015-video-thread-wrapper-run-a-command-once.patch` hunk `@@ -441,13 +442,36 @@`
  - `.../patches/0016-widgets-message-queue-floor.patch`, `0017-...`, `0018-...`, `0019-...` (headers)
- **What:** Two `RARCH_LOG` strings carry "(ROCKNIX #296)"; comments cite "ROCKNIX fork #194", "maxengel/rocknix#211", "docs/qa-frames/2026-09-27", "tools/font-stems". 0011 and 0014 carry `From:`/`Date:`/`Subject:`; 0015–0019 carry none, and 0019 opens with a paragraph instead of a title. Messages narrate revisions ("the sixth cut", "the eighth cut", "14 until #296").
- **Failure scenario:** none demonstrated.
- **Evidence:** `RARCH_LOG("[Widgets] msg_queue font: scaled %.2f px, drawn %.2f px (ROCKNIX #296)\n", ...)`; `#include "../verbosity.h" /* ROCKNIX fork #295: the placement log lines */`; 0019's first line "The message queue keeps its place at the readable size, and its foot is the same margin as its side (ROCKNIX fork #295, #296; the eighth cut)." `packaging-and-patches.md` § "Generating patches" prescribes `git diff` output; it does not prescribe headers, so this is a consistency finding, not a rule breach.
- **Fix:** Strip issue numbers from log strings; cite issues by full URL once in the patch header; give every patch a title line and author/date; rewrite messages as final rationale.
- **Confidence:** high.

### F-RW-10: 0011 does not record that it is upstream PR libretro/RetroArch#19518
- **Severity:** Low
- **Category:** Upstream fit
- **Where:**
  - `.../patches/0011-video-thread-wrapper-serialise-posters.patch` header
  - `.../patches/0015-video-thread-wrapper-run-a-command-once.patch` header prose and hunk `@@ -441,13 +442,36 @@`
- **What:** 0015 identifies the poster lock as "the poster lock from #19518" / "libretro/RetroArch#19518"; 0011's own header says nothing about an upstream submission, so a RetroArch version bump that includes the merged PR has no signal to drop 0011, and the duplicate `user_lock` would fail to apply.
- **Failure scenario:** `PKG_VERSION` bumped past the merge of #19518 → 0011 hunk in `video_thread_wrapper.h` fails (the field already exists) → build fails, with the reason only discoverable by reading 0015.
- **Evidence:** 0011 header: `Subject: [PATCH] video_thread_wrapper: one poster at a time on the command mailbox` with no upstream reference; 0015: "The build carried the poster lock from #19518". Refutation attempted: searched 0011 for "19518" or "upstream"; neither appears.
- **Fix:** Add the upstream PR URL and its status to 0011's header (and to 0015's, which says "Upstream-bound" without a link).
- **Confidence:** high on the omission; the PR's actual state is outside the packet.

## Upstream fit

- **Fork identifiers baked into runtime strings and comments** (F-RW-09). A ROCKNIX maintainer will ask for `RARCH_LOG` strings without "(ROCKNIX #296)", and for comments that explain the code rather than point at `docs/qa-frames/2026-09-27` and `tools/font-stems`, which exist only in the fork's tree.
- **Patch series hygiene.** Seven patches with three header styles; 0016 hand-edited after generation (F-RW-02); messages that narrate eight revisions. A reviewer will ask for each patch regenerated from a clean tree with a final message, and for 0016/0017/0019 either squashed or made mutually consistent about the floor and the drawn size (F-RW-01, F-RW-02). The `index ed06d55..c5b37b2` line in 0014 refers to the fork's working-tree blobs and means nothing upstream.
- **Numbering gaps.** 0012 and 0013 are absent from the fork-only diff; whether they exist at the merge base or were renumbered away is not visible. 0014's message cites "0001-Increase-ozone-widget_size.patch" and its context cites a "producer-locking fix" already in `gfx_widgets.c`, so the ROCKNIX package carries prior widget patches this series depends on and must sit after.
- **ROCKNIX-only behaviour coupled into a general helper.** `gfx_widgets_get_scale_factor` (0014) folds the fork's 1.5× ozone multiplier and a `settings->arrays.menu_driver` string test into a function whose other half is upstream RetroArch's. For ROCKNIX that is a dependency on 0001; for the libretro submission 0014 says it is "not (yet)" seeking, the multiplier must be split out. 0015 says "Upstream-bound" and 0011 is described as an open upstream PR; both should carry the link (F-RW-10).
- **Device configuration copied from ARM.** `sources/GENERIC_X64/` carries `armhf` buildbot URLs, NEON core options and `emuelec_exit_to_kodi`, and pins 640x480 (F-RW-04). If the directory exists for the QA VM, a maintainer will ask that the VM's mimicry live in the harness, not in the package. The `TATE-MAME 2003-Plus.rmp` file name contains a space; whatever copies `sources/<DEVICE>/*` must quote it — the `package.mk` is outside the packet.
- **Global placement change justified by one panel** (F-RW-03). A maintainer with a 1080p or 1280x800 device will ask for its frame.
- **Credentials and personal paths.** None found: `cheevos_username`, `cheevos_password`, `cheevos_token`, `netplay_nickname`, and the three stream keys are empty; `discord_app_id` is RetroArch's default; the author line `max@awecelot.com` is a normal patch author field.
- **Copyright headers.** Patches and RetroArch configuration files do not carry them in the package's existing layout, and no rule in the packet requires them for these file kinds.

## Coverage boundary

- **The RetroArch `package.mk`**: the pinned version (whether #19518 is already merged into it), how `sources/<DEVICE>` is selected (whether `GENERIC_X64` is a shipped image or the fork's VM device), and how patches are applied (fuzz tolerance decides F-RW-02's outcome).
- **The launcher.** The bucket name promises "launcher-side changes"; the diff contains none. The script that writes `state_slot = "-1"` (0018's premise), whether it writes `state_slot` on every launch, and whether it sets or clears `video_font_path`, `menu_widget_scale_auto` or `menu_widget_scale_factor` are all outside the packet.
- **The effective widget scale on the QA VM.** The shipped `retroarch.cfg` has `menu_widget_scale_auto = "false"` and `menu_widget_scale_factor = "0.400000"` under `video_fullscreen = "true"`, yet 0014 and 0016 derive the queue face as 20 × 0.363 × 1.5 = 10.9 px with no 0.4 factor and report 9 px and 10 px observed. Either something outside the packet overrides the factor, or the arithmetic in the messages does not describe the shipped configuration; `gfx_display_get_dpi_scale` is outside the packet and I did not adjudicate.
- **RetroArch source outside the hunks**: `video_thread_handle_packet` and the wait condition of `video_thread_loop` (0015's gate assumes the loop wakes on `send_cmd != CMD_VIDEO_NONE || frame.updated`); `gfx_widgets_msg_queue_push`'s width and word-wrap logic (whether wrapped messages upstream use a fixed rect width that 0014's re-measure now shrinks); the `switch` that assigns `font_file` (whether 0017's pointer comparison can ever be true); `font_driver_get_message_width`'s handling of a NULL font and of `len == 0` for an empty line; whether `current_msgs_lock` is ever held at a call to `gfx_widgets_layout` (0014 takes it inside); `runloop.c`'s consumption of `entry_state_slot` and its default; `command_scan_states`; the origin of `DISPWIDG_FLAG_SMALL` and whether ROCKNIX's plain notifications carry it (0019's placement and log assume they do); whether any poster reaches the video thread other than through `video_thread_send_and_wait_user_to_thread` (0011's deadlock argument).
- **The RG35XX SP (H700) `retroarch.cfg`**, to confirm F-RW-01 on the device the defects were reported from.
- **The proofs the messages cite**: the 0015 fixture ("2000 posts ran the method 2017 times"), `tools/font-stems` and its FreeType 2.14.3 measurements, `docs/qa-frames/2026-09-27`, and the tracker's code traces (#273 form, D-WORKFLOW-050 "Already written" line) for #249 — none are in the packet, so every quantitative claim in 0015–0019 is taken as reported, not verified.
- **Patches 0001, 0012, 0013** and the "producer-locking fix" already in `gfx_widgets.c`: the base these hunks apply to.

## Corpus provenance

Sources read as embedded by the Facilitator; paths and hashes are the Facilitator's declared values, not re-read or re-hashed here.

| # | path | sha256 (verified at embed time) |
|---|---|---|
| 1 | `/workspace/repos/rocknix/docs/audits/2026_09_25-milestone-rc-round-since-258/seats/6-retroarch-widgets.diff` | `b608dff3f720b174e7474baa10528a1b9c852006d3c4360d3f8df6bf3ceb95eb` |
| 2 | `/workspace/repos/rocknix/.claude/skills/code-auditor/references/anti-patterns.md` | `fd825c0505ae772ca2a6651eefe642581aaa147c254fed8cf50db1f8f1bde678` |
| 3 | `/workspace/repos/rocknix/.claude/rules/upgrade-and-install.md` | `de4a683f9a36f9100e6fd98be11ad84d736f370374c40f74c445a2b81eca1995` |
| 4 | `/workspace/repos/rocknix/.claude/rules/packaging-and-patches.md` | `2a44db10f4f179198b9366239eabe0900e1701145beced181536eb18bcbc0746` |

Gap surfaced to the orchestrator: the brief lists "the interface codebase's known sharp edges" and the rule on "what a player may read on a 640x480 panel and in which words" among the standards; no rule file for either was embedded, so player-text findings (F-RW-03) are judged against `upgrade-and-install.md` and the diff alone.