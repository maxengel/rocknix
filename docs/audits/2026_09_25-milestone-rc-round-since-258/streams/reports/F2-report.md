# Stream F2 report: packages, recipes, RetroArch patches, the rotation generators (#307 / #308)

**Where it is:** `feature/pl-f2` in `/workspace/repos/rocknix.worktrees/pl-f2`, cut from `next` at `417dcd8610`. HEAD is `96d3ce0a67`. The tree is clean. Nothing was pushed or built, and nothing touched a device or a guest.

```
$ git log --oneline 417dcd8610..HEAD
96d3ce0a67 last-good-scripts-test: F2's block says what --old shows
25c6e7bb26 zip: one recipe -- drop the generic copy the project recipe shadows
bccbf54cd4 packages: comments said once and true; an empty quirk removed
4f2b1c0cfa ryzenadj: keep JELOS's credit, pass -ludev to cmake without quotes
4403918793 gstreamer: bad chains the generic options; both fail on missing payload
e7166ee63d mupen64plus-sa-video-gliden64: NOHQ on GENERIC_X64 only, as a word
c474af4c05 mupen64plus-sa-audio-sdl: speexdsp declared, libsamplerate unused
43227905ea standalone: amiberry and yabasanshiro-sa skip GENERIC_X64 alone
d4be36a823 ppsspp-lr: strip the aarch64-only atomics flag after the patches
f72a5d1fdf mupen64plus-sa-core: GENERIC_X64 Control1 mappings in their section
c2bdcf0797 retroarch: 0018 keeps only a launch's own Auto slot; 0011 names #19518
150a4e1402 retroarch: widget patches follow the drawn face and apply at fuzz 0
a79b7f82a5 Makefile: write .env in the docker recipe, fresh and owner-only
65bd183950 libretro: rotation generators read live source and carry their floor
8e874f87c5 libretro: each rotation generator is in its cores' build stamps
```

Every commit title matches `^[a-zA-Z0-9_*./-]+:[[:space:]].+$` and is shorter than 72 characters (checked by script). Every commit body names its item(s), the test case, the FAIL it showed before the fix, and an `Already written:` line, and ends with the Co-Authored-By line (15 of 15).

**Harness:** my cases are one block, `# ---- audit #307, stream F2 ----`, placed immediately before the summary line of `tools/last-good-scripts-test`. It holds cases F2-1 to F2-13.
- **Full run:** 429 checks PASS, 0 FAIL, 0 SKIP. The last line reads `PASSED`. The baseline before my work was 386 PASS.
- **Against the audited tree** (`BASE_REF=417dcd8610 ./tools/last-good-scripts-test --old`): `37 CHECK(S) FAILED`. All 37 are in the F2 block and none are outside it. The six F2 checks that pass both ways are controls: a stamp that must not move, `.env` gone after the recipe, the tree compiling, and a payload that must be kept.

**Rules read this session** (from `next`; `diff -q` against the worktree copies shows no difference): `engineering-practices.md`, `upgrade-and-install.md`, `working-principles.md`, `packaging-and-patches.md`. Register rows read: D-UI-086, D-UI-088, D-UI-094, D-UI-098, D-UI-100, D-QA-042, D-QA-053, D-WORKFLOW-050, D-WORKFLOW-054, D-WORKFLOW-055.

**Can this be done on the VM?** Yes, for everything below. Nothing needs a device. I ran nothing on a VM because the brief forbids it; what the integrator should prove on a guest is listed per item.

---

## Punch items

### PL-002: the shared rotation generators sit outside their consumers' build stamps
- **Outcome:** resolved. Commit `8e874f87c5`, followed by `65bd183950`, which moves the generators' row floor into the generators themselves.
- **Fix:** each of the five cores names its generator in `PKG_NEED_UNPACK`, which `calculate_stamp` hashes:
  ```
  PKG_NEED_UNPACK="$(dirname "$(get_pkg_directory ${PKG_NAME})")/rotation-table-fba.py"
  ```
  The cores that name `rotation-table-fba.py` are fbneo, fbalpha2012 and fbalpha2019; mame2003-plus and mame2010 name `rotation-table-mame.py`. This is the same idiom as the vdr plugins' `PKG_NEED_UNPACK="$(get_pkg_directory vdr)"`.
- **Test:** F2-1 computes each recipe's stamp with `config/functions`' own `calculate_stamp`, before and after an edit to each generator.
  - FAIL before (5 of its 7 checks): `FAIL  fbalpha2012-lr's stamp did not move when rotation-table-fba.py changed (b1c882d34d07 -> b1c882d34d07): a warm root keeps the old table`
  - PASS after: all 7, including the controls that each family's stamp is left alone when the other family's generator changes.
- `tools/pkgcheck` on the five recipes reports nothing.
- **Already written:** nothing on a device; the change is build-time. A warm root rebuilds the five cores once.
- **For the integrator:** the acceptance says editing a generator and running `./scripts/build <core>` rebuilds the core. My proof is the stamp computation; `scripts/build` was not run (the brief forbids it). On a warm root: build `fbneo-lr`, append a comment to `rotation-table-fba.py`, build again, and check that `build.*/.stamps/fbneo-lr/build_target` has moved.

### PL-032: patch 0017's sharp-size tables never apply on the shipped font, and 0017 carries 0016's line as stale context
- **Outcome:** resolved in the code and the patch stack, commit `150a4e1402`. The frame half of the acceptance is **open**, for a reason found by measurement.
- **What was wrong, beyond the audit's two points:** in the ozone branch, the message queue's table was chosen by comparing the address of a local `font_file[]` buffer with `ozone_regular_font_path`. That comparison is never true.
- **What changed:**
  - A table is now chosen by the file the face is loaded from, in both branches (`gfx_widgets_sharp_face()`).
  - The two ozone Inter faces get their measured tables.
  - Any other face is drawn at its computed size, as D-UI-088 leaves an unmeasured face.
  - The message queue explicitly takes no sharp step in either branch (D-UI-098).
  - Every face logs its file, its computed and floored size, the table it took and the size drawn. The line looks like `[Widgets] font regular: <file>, computed 17.40 px, floor 9, no sharp-size table for this face, drawn 17 px`.
  - Patches 0014 to 0019 are regenerated from one tree, and the fork's patches now apply at fuzz 0.
  - The messages of 0016 and 0017 now say 13 px and name the face the shipped profiles draw.
- **Why the frame half is open:** every device profile, all 15 of them, sets `video_font_path` to `xmb/monochrome/font.ttf`. That font is M+ 1p (`fc-query`), not Inter.
  - `tools/font-stems` on M+ 1p: a fully lit column in 29 % of strokes at 13 px, 63 % at 17, and 100 % only from 23 px up.
  - Under D-UI-088's band (up to 1.3 times the computed size), no sharp size is within reach at 640x480, where the banner is 17.4 px and the queue 13 px. So nothing the shipped profiles draw changes, and the approved 13 px and 12 px look of D-UI-098 and D-UI-100 is unchanged.
  - Giving M+ 1p a table is a new decision, not something D-UI-088 covers. Under the same band it would move a 720x480 H700 panel's banner from 18 to 23 px, and a 1280x720 XMB panel's from 18 to 23 px.
  - **Maintainer decision needed:** whether to measure M+ into the rule, or change the profiles' face. D-UI-088's line "on a 640x480 panel the banner goes 17 -> 18" holds only for the ozone faces. It needs a refining register row, which is the integrator's to write since `docs/` is not in my files.
- **Test:** F2-4 applies `patches/` and `batteryplus/` to the pinned tarball in the package's order, trying the fork's patches at fuzz 0. It compiles the patched `gfx_widgets.c`, `video_thread_wrapper.c`, `command.c` and `runtime_file.c` syntax-only with host gcc; I proved this compile check fires by inserting an undeclared call. It compiles the sharp-size step on its own and asks it which table each face gets. It reads the remaining claims from the patched source.
  - FAIL before (10 checks), for example:
    - `FAIL  patches that needed fuzz or failed: 0017-widgets-sharp-font-sizes.patch`
    - `FAIL  the face step answered '(the sharp-size step is not marked out ...)'`
    - `FAIL  gfx_widgets.c: the-pointer-comparison-is-still-there msg_queue-not-explicitly-tableless-in-both-branches no-font-log-line a-log-string-carries-a-fork-issue-number`
    - `FAIL  patch messages: 0016-says-14 0017-says-14 0017-silent-on-the-shipped-face`
  - PASS after: all 11 checks of F2-4.
  - Independently of the harness, applying the committed stack to a fresh tarball reproduces the edited tree byte for byte in the six touched files (`cmp`).
- **Already written:** nothing. No file on a device is written differently.
- **For the integrator, on a guest:**
  - The `[Widgets] font regular/bold/msg_queue` lines name `xmb/monochrome/font.ttf` with no table, drawn at 17 and 13 on 640x480.
  - The `[Widgets] msg_queue place:` line reports small and full box heights and a pitch that includes the divider.
  - frame-diff shows the widget text unchanged against the accepted baseline.

### PL-043: the build `.env` is written at parse time and an old 0644 copy is not tightened
- **Outcome:** resolved, commit `a79b7f82a5`.
- **What changed:** the `$(shell ... > .env)` prerequisite is gone. It ran whenever make read the Makefile, for any target, native builds included. The `docker-%` recipe now:
  - removes any `.env` first;
  - writes a new one under `umask 077`, so it is 0600;
  - starts no container if `get_env` fails;
  - removes the file through a trap when the container exits or the recipe is interrupted.
- **Test:** F2-3 takes the recipe out of the Makefile and runs it as make would, one `sh -c` per line with `$$` as `$`, against a stub docker. It runs in a directory holding a 0644 `.env` "left by an older tree". No make or docker was run.
  - FAIL before (3 of 4 checks): `FAIL  what the container got: '644|STALE=1|' -- expected mode 600 and this run's F2_FORWARDED=yes`
  - PASS after: all 4.
- **Already written:** a leftover `.env` in a worktree is deleted at the start of the next docker build instead of being reused. Nothing is written on a device.
- **For the integrator:** the acceptance is `stat -c %a .env` reading 600 during a real `make docker-*`. The stub proves that is what the container receives; one real docker build confirms it.

### PL-076: the x64 RetroArch profile names an armhf core-updater endpoint
- **Outcome:** open. The file is not mine: F1's list names "the GENERIC_X64 RetroArch profile under `projects/ROCKNIX/packages/emulators/**/sources/GENERIC_X64/`", and the brief says to leave such an item open.
- **What I found:** the line is dead text. RetroArch 1.22.2 reads only `core_updater_buildbot_cores_url` (`configuration.c:1683`), and the profile sets that to `""`. `core_updater_buildbot_url` exists in the pinned source only as a menu label string (`msg_hash_lbl_str.h:228`).
- **Fix for F1 or the integrator:** delete `core_updater_buildbot_url = "http://buildbot.libretro.com/nightly/linux/armhf/latest/"` at `sources/GENERIC_X64/retroarch.cfg:114`. Upstream's `sources/AMD64/retroarch.cfg:150` carries the same line; that is upstream's file, so it is only a note for upstream.

---

## Sweep rows (#308), all 38

| # | packet / seat / id | verdict |
|---|---|---|
| 1 | 10 claude F-PB-05 | **Withdrawn, not my file.** The `QEMU Standard PC (Q35 + ICH9, 2009)/**` quirks belong to F1. F1 carries gpt F-PB-22, the same finding, and PL work that deletes those scripts' `/etc` writers. |
| 2 | 10 claude F-PB-09 | **Fixed** `4403918793`. The override keeps the generic `pre_configure_target` under another name and calls it, flips the two mpegts options, and dies if a flip finds nothing to flip. F2-10's fixture puts a quoted value at the end of a line, the way the gstreamer recipe writes one. FAIL before: `the override passed 170 of 172 options (... ends: 'package-name="gst-plugins-bad ')`. On the real tree the result is the generic string with exactly two words changed, 172 options on each side. |
| 3 | 10 claude F-PB-12 | **Duplicate of PL-043**, fixed by `a79b7f82a5`. |
| 4 | 10 claude F-PB-15 | **Withdrawn, upstream fit, for the PR-prep pass #256.** GENERIC_X64 stays out of the PR series (D-QA-053, D-WORKFLOW-034). The seat's `case ${BOOTLOADER}` fix would also drop grub from upstream's AMD64, which uses syslinux too: a change to an upstream device outside the fork's lanes. |
| 5 | 10 claude F-PB-19 | **Fixed** `4f2b1c0cfa`. Both recipes get back the `2023 JELOS` credit of the upstream AMD64 recipes they were rewritten from, plus a `2026-present ROCKNIX` line. ryzenadj passes `-DCMAKE_EXE_LINKER_FLAGS=-ludev` with no literal quotes. The "no consumer" part is refuted: `projects/ROCKNIX/packages/virtual/image/package.mk:73` pulls both on x86_64. |
| 6 | 10 claude F-PB-20 | **Withdrawn, refuted.** `grep -rln 'GITHUB_\|${GH_' scripts config distributions packages projects` finds nothing, so no script inside the container reads a variable the drop removes. Over-dropping is the fail-closed side that `get_env`'s comment accepts. |
| 7 | 10 claude F-PB-21 | **Fixed** `bccbf54cd4`: the woff2 sentence said twice, cairo's claim of GL backends (1.18.4's `meson.options` has no GL option), and the empty `innotek GmbH VirtualBox/091-vbox-graphics` removed. The gst-plugins-base paragraph said twice was fixed in `4403918793`. |
| 8 | 4 claude F-BR-10 | **Fixed** `25c6e7bb26`. "Orphaned" is refuted, because `rocknix/package.mk` and upstream's portmaster both depend on zip. But the fork's `packages/compress/zip` was shadowed by upstream's `projects/ROCKNIX/packages/compress/zip` (`b289e35685`): same build steps and the same patch (`cmp`), never built. Its unique behaviours were listed in the commit before deleting it, and none is lost. |
| 9 | 6 claude F-RW-02 | **Fixed** `150a4e1402`; the same regeneration as PL-032. |
| 10 | 6 claude F-RW-03 | **Withdrawn, decided and refuted.** D-UI-100 is the maintainer's decision that the stack's foot equals its left margin. Overscan crops a 16:9 panel's side at least as much as its foot, so the left placement upstream already has carries the same exposure. |
| 11 | 6 claude F-RW-05 | **Fixed** `c2bdcf0797`. 0018 keeps Auto only when this launch's `--appendconfig` sets `state_slot` negative (`command_append_config_sets_auto_slot`, declared in `command.h`, the last file wins). A `-1` saved into `retroarch.cfg` is reset as upstream resets it. |
| 12 | 6 claude F-RW-06 | **Fixed** `c2bdcf0797`. The header records the pass from the 2026-09-26 01:30 UTC work-log entry: no `found_last_state_slot`, and `Probe.state.auto` loaded, with the monitor key as a named substitute for a pad press. |
| 13 | 6 claude F-RW-07 | **Fixed** `150a4e1402`. The XMB test in 0014 gets the fallback to the configured name. |
| 14 | 6 claude F-RW-08 | **Fixed** `150a4e1402`. The placement line is written after the divider is set, from the placement's own numbers. |
| 15 | 6 claude F-RW-09 | **Split.** The log strings are fixed in `150a4e1402`: no `(ROCKNIX #296)` remains, as F2-4 checks. The fork references in comments, the header styles and the narration of cuts are **withdrawn to PR-prep #256**. |
| 16 | 6 claude F-RW-10 | **Fixed** `c2bdcf0797`. 0011 names `libretro/RetroArch#19518`, merged 2026-09-08 as `d1fcc5fd364d` (read with `gh`). The pin predates it; the pristine tarball has no `user_lock` and no `cond_user`. 0015 has no upstream PR to name. |
| 17 | 7 claude F-VM-09 | **Fixed** `f72a5d1fdf`. The six pasted lines are gone from GENERIC_X64's Control1. Upstream's SM8250 copy has the same splice; that is upstream's file, left as a note. |
| 18 | 9 claude F-EM-01 | **Duplicate of PL-002**, fixed by `8e874f87c5`. |
| 19 | 9 claude F-EM-02 | **Fixed** `d4be36a823`. The strip moves to `post_patch`. F2-6 runs `post_unpack`, the patches and `post_patch` in `scripts/unpack` order over the pinned source: x86_64 ends with 0 flag lines, aarch64 with 1. Before, both had 1. |
| 20 | 9 claude F-EM-05 | **Fixed** `43227905ea`. The aarch64-only restriction applies to `DEVICE=GENERIC_X64` alone. AMD64 builds both emulators as upstream's cleanup intended. The fork's two images are unchanged. |
| 21 | 9 claude F-EM-06 | **Withdrawn, refuted.** EmulationStation reads `/usr/config/emulationstation/rotation` directly: `es-app/src/CaptureRotation.cpp:31` at `7eae8ed91`. The recipes' comment now names that path (`65bd183950`). |
| 22 | 9 claude F-EM-08 | **Fixed** `c474af4c05`. `make_target` passes `NO_SRC=1` (upstream's `7c75a68fa7`), so libsamplerate was never linked; it is dropped. speexdsp is kept, with a comment true for every architecture. |
| 23 | 9 claude F-EM-10 | **Fixed** `65bd183950`. The generators take `--min N`; the recipes pass `--min 100`; the five copies of the check and their pkgcheck WARNs are gone. |
| 24 | 9 claude F-EM-11 | **Fixed** `65bd183950`: an SPDX line and a copyright line in both generators. |
| 25 | 9 claude F-EM-12 | **Fixed** `65bd183950`: correct usage lines, the unused `macro` regex removed, and a header naming all three FBA cores' mapping (read at the pins). |
| 26 | 9 claude F-EM-13 | **Withdrawn to PR-prep #256** (fork references in comments across the bucket). The comment blocks I rewrote carry none. |
| 27 | 9 claude F-EM-15 | **Fixed** `e7166ee63d`: `+=" -DNOHQ=On"`. |
| 28 | 10 gpt F-PB-18 | **Withdrawn, not my file.** It is the EmulationStation fork's `.githooks/pre-push`, which belongs to stream E1 (PL-078). |
| 29 | 10 gpt F-PB-19 | **Withdrawn, not my files.** The ES fork's `CLAUDE.md`, `.githooks` (E1) and the `build-tests` binary are ES-tree content. What reaches upstream is decided by cutting the PR by content: PR-prep #256. |
| 30 | 10 gpt F-PB-20 | **Withdrawn, not my file, and a real defect.** The cap is chosen in `rocknix-corekeep` (stream B), `:131` `emulationstation)`. `%e` is the task comm, truncated to 15 characters (`emulationstatio`), so the interface never gets its 1 GiB cap. **Fix for B:** match `emulationstatio*`, or key on the basename of `$5` (`%E`). Harness x3 passes the untruncated name, so it cannot see this. |
| 31 | 10 gpt F-PB-23 | **Withdrawn, refuted.** `scripts/unpack:70-72` does `rm -rf`, then `mkdir -p "${PKG_UNPACK_DIR}"`, before `:85` calls `${SCRIPTS}/extract`, its only caller. So `FULL_DEST_PATH` never already exists; the two `pre_unpack` hooks that create `PKG_BUILD` are tarball packages, which never take this branch. The one-word divergence from upstream (`mkdir -p`) is PR-prep #256 material. `scripts/extract` is not in my list either. |
| 32 | 10 gpt F-PB-24 | **Fixed** `4403918793`. gst-plugins-bad dies without `libgstmpegts-1.0`. gst-plugins-base dies without the app, audio, video, tag, pbutils, allocators and fft libraries or the `libgstapp.so` plugin; that set was checked against a read-only listing of the GENERIC_X64 image. The copies no longer end in `\|\| true`. |
| 33 | 4 gpt F-BR-18 | **Withdrawn, refuted.** The probe's `valloc();` is under `#ifdef MMAP`, and nothing defines `MMAP` (zip30's `unix/configure` mentions it only in the probe). After `25c6e7bb26` the patch exists only in upstream's copy. |
| 34 | 6 gpt F-RW-03 | **Fixed** `150a4e1402`. `gfx_widgets_layout` calls `gfx_widgets_msg_queue_move()` again once the new margin and divider are known. |
| 35 | 6 gpt F-RW-04 | **Fixed** `150a4e1402`, the same change as row 14. |
| 36 | 9 gpt F-EM-02 | **Fixed** `e7166ee63d`. NOHQ applies to GENERIC_X64 only. Upstream's post_unpack `<cstdint>` include fixed the GCC 15 failure NOHQ was added for. AMD64 keeps hi-res textures. |
| 37 | 9 gpt F-EM-04 | **Fixed** `65bd183950`. Comments are removed by a lexer that keeps string literals. On the pinned cores this drops six false rows: `sbdk` from all three FBA tables, which sat inside `/* */` in `d_dkong.cpp`; `nrallyv` from mame2003-plus; and `dambust`, `kkgalax` and `mrkougr2` from mame2010, which sat behind `//`. The new row counts are 852, 1923, 2543, 1642 and 2180. `#if 0` blocks hold no rotated GAME() at these pins (checked: 0). |
| 38 | 9 gpt F-EM-06 | **Fixed** `65bd183950`, the same change as row 24. |

---

## For the integrator

**Proofs to run on the VM:**
- **RetroArch:**
  - The `[Widgets] font` and `msg_queue place` lines.
  - frame-diff unchanged at 640x480.
  - `proof-249-auto-slot.sh` passes, and logs `[State] Keeping the Auto slot this launch's configuration asks for.`
  - With `state_slot = "-1"` written into the guest's `retroarch.cfg`, a START NEW GAME launch no longer keeps Auto.
- **Build log:** the five cores print `# 852/1923/2543/1642/2180 games with a turn`. gst-plugins-bad and gst-plugins-base build, since their payload is present. `/usr/bin/zip` is still in the image. ryzenadj builds on GENERIC_X64.
- **Fresh guest:** mupen64plus's Control1 mappings are live in `/storage/.config/mupen64plus/mupen64plus.cfg`. An old guest keeps its spliced copy until that file is deleted, because the launcher copies the file only when absent.

**Merge notes:**
- F1 holds F-EM-14 on `mupen64plus-sa-video-gliden64/package.mk`, and PL-076's file.
- I treated `mupen64plus-sa-core/config/GENERIC_X64/mupen64plus.cfg` (F-VM-09) as mine: my row names it, no other brief names it, and F1's list does not include emulator `config/GENERIC_X64/` files. If F1 touched it too, keep `f72a5d1fdf`'s version of Control1.
- Other streams append their own blocks to `tools/last-good-scripts-test`. Mine sits just before the summary line and defines its helpers inside itself (`f2_source`, `F2_*` names).

**Scratch left for you:** `/workspace/tmp/rocknix-session/f2/stack/ra` is a git repo of the pinned RetroArch with one commit per patch. Tags `p-<patch>` mark the old stack and `n14`..`n19` the new one; each new patch is `git diff` of adjacent tags with the `index` lines stripped, so a further edit to the stack can be regenerated the same way. The harness runs are in `/workspace/tmp/rocknix-session/f2/final.log` and `old.log`.

**Register and log work:** `docs/` is not in my files, so these are yours.
- A row refining D-UI-088: its table applies to the ozone faces, and the shipped M+ 1p face has none.
- An open decision on an M+ table, with the measurements above.
- A work-log entry.
- Possibly a change-log line for 0018: a `-1` saved into the main config is no longer sticky.

## Could not do, and why
- **PL-076:** the file is F1's, per the brief's ownership rule.
- **gpt F-PB-20:** the fix is in `rocknix-corekeep`, which is stream B's. It is a real defect; the fix is written in row 30.
- **gpt F-PB-18 and F-PB-19:** ES-fork files, belonging to E1.
- **claude F-PB-05:** a QEMU quirk, belonging to F1.
- **PL-032, the frame half:** needs a maintainer decision on M+ 1p. This is a measured fact, not a gap in the code.
- **No build, `make`, `scripts/build`, guest or device run**, per the brief. The recipes are proved by sourcing them, by `pkgcheck`, and by the harness; the patches by a fuzz-0 apply and host `gcc -fsyntax-only`. Real builds and guest proofs are the integrator's.

## Found outside my files (not fixed, reported)
- **`tools/pkgcheck` given a path checks nothing and exits 0.** It matches only package names, through `find ... -path */${arg}/package.mk`. `./tools/pkgcheck projects/.../fbneo-lr` printed nothing while `./tools/pkgcheck fbneo-lr` printed a WARN. It is upstream's tool; the fix would be to fail when no recipe matched.
- **Upstream's `0004-drm-resolution.patch` applies only with fuzz.** Upstream's file, outside the fork's lanes.
- **Upstream's `sources/AMD64/retroarch.cfg:150` carries the same dead armhf key** as PL-076, and **upstream's SM8250 `mupen64plus.cfg`** has the Control1 splice.
