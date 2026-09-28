# Bucket 9-emulators — Council audit (adversarial, evidence-bound)

## 1. Summary

The bucket does five things: it generates a per-game rotation table for five arcade libretro cores at install time (two new Python generators plus an install-step row-count guard), it re-imposes `PKG_ARCH="aarch64"` on five standalone emulators that upstream's 2026-09 cleanup had opened to every architecture, it repairs three achievement launch scripts (ARMSX2 token dedupe, Dolphin/melonDS settings-key rename fallback, PPSSPP quoting and an offline-proxy host line), and it adds x86_64/GENERIC_X64 accommodations to mupen64plus-lr, GLideN64, ppsspp-lr, ppsspp-sa and mupen64plus-audio-sdl. Most of the script fixes are correct and follow the "read both, write the new one" rule; the rotation generators are simple and their guard catches the empty-table failure it was written for. The findings that matter: (1) the ppsspp-lr `-mno-outline-atomics` strip was moved into `post_unpack`, which runs before the patches the comment says inject the flag, so the fix still does nothing; (2) the rotation generators live outside every consuming package's stamp and the diff documents a manual clean where `packages/README.md` provides `PKG_NEED_UNPACK`; (3) the ARMSX2 token rewrite's `sed` range stops at the second `[Achievements]` header — a shape the code this diff removes was writing — so on such a file the Token lines it promises to collapse to one instead grow by one per launch. Secondary: the PPSSPP script probes the proxy with an undeclared `netstat` and logs every negative as "nothing answers"; and re-restricting amiberry/yabasanshiro to aarch64 reverts an upstream cleanup on a fork-VM failure the comment itself says was "reported rather than assumed".

## 2. Findings

### F-EM-01: Rotation generators are outside the packages' stamps; the diff prescribes a manual clean where `PKG_NEED_UNPACK` exists
- **Severity:** Medium
- **Category:** Build/packaging
- **Where:**
  - `projects/ROCKNIX/packages/emulators/libretro/fbalpha2012-lr/package.mk:20-27` (hunk `@@ -7,13 +7,40 @@`)
  - `projects/ROCKNIX/packages/emulators/libretro/fbalpha2019-lr/package.mk:20-27` (hunk `@@ -7,14 +7,41 @@`)
  - `projects/ROCKNIX/packages/emulators/libretro/fbneo-lr/package.mk:27-34` (hunk `@@ -21,7 +24,32 @@`)
  - `projects/ROCKNIX/packages/emulators/libretro/mame2003-plus-lr/package.mk:17-24` (hunk `@@ -7,10 +7,37 @@`)
  - `projects/ROCKNIX/packages/emulators/libretro/mame2010-lr/package.mk:28-35` (hunk `@@ -22,7 +25,31 @@`)
- **What:** Each recipe runs `${PKG_DIR}/../rotation-table-*.py` from its install step and carries a comment that an edit to the generator "does not move this package's stamp (calculate_stamp hashes PKG_DIR alone), so clean these packages by hand after editing a generator." The repository's own reference documents the field that solves this; none of the five recipes sets it.
- **Failure scenario:** A developer changes `rotation-table-mame.py` (for example, the flip-combination rule) and rebuilds. `mame2003-plus-lr` and `mame2010-lr` are not rebuilt because their stamps are unchanged; the image ships the previous tables; `rotation_table_check` passes because the stale table still has ≥100 rows. The build reports success.
- **Evidence:** Diff comment quoted above, identical in all five recipes. `packages/README.md` (sha256 `db3a14de…`): "`PKG_NEED_UNPACK` — Space separated list of files or folders to include in package stamp calculation. If the stamp is invalidated through changes to package files or dependent files/folders the package is cleaned and rebuilt." I searched all five hunks for `PKG_NEED_UNPACK`; it is absent. I also tried to fault the check for ignoring `python3`'s exit status; the ppsspp-sa hunk's own comment ("fails the whole install on `cp: cannot stat`") shows a failing command in `makeinstall_target` aborts the install, so a generator exception already fails the build — not raised.
- **Fix:** In each of the five recipes, at file scope: `PKG_NEED_UNPACK="$(dirname "$(get_pkg_directory ${PKG_NAME})")/rotation-table-fba.py"` (or `-mame.py`); the `${PKG_DIR}/..` form works only if `PKG_DIR` is set before the recipe is sourced (`config/options`, outside the packet). Delete the "clean these packages by hand" sentence.
- **Confidence:** high — the mechanism is documented in a file in the packet; the only unknown is the exact path expression.

### F-EM-02: ppsspp-lr strips the aarch64-only flag in `post_unpack`, which runs before the patches that inject it
- **Severity:** Medium
- **Category:** Build/packaging
- **Where:** `projects/ROCKNIX/packages/emulators/libretro/ppsspp-lr/package.mk:62-72` (hunk `@@ -60,6 +60,17 @@`), the `sed -i '/add_compile_options(-mno-outline-atomics)/d' ${PKG_BUILD}/CMakeLists.txt` at line 71
- **What:** The comment says "Patches 005/006 inject the aarch64-only -mno-outline-atomics; strip it on x86_64" and that the previous file-scope placement "had never once done its job". The new placement is `post_unpack`, the hook of the extraction step; patches are applied after extraction, so at the moment the `sed` runs the line it targets has not yet been written into `CMakeLists.txt`. `sed … d` with no match exits 0.
- **Failure scenario:** x86_64 build of ppsspp-lr: `post_unpack` runs the `sed` against the pristine `CMakeLists.txt` (no match, exit 0); patches 005/006 then apply and insert `add_compile_options(-mno-outline-atomics)`; the flag reaches the x86_64 compiler. Either the build fails on the unrecognised `-m` option, or — if the injected line sits inside an ARM64 conditional — the strip was never needed and the "fix" is dead code with a comment asserting it works. In neither case does the hook do what its comment says.
- **Evidence:** `packages/README.md` function table: "`unpack` / `pre_unpack` / `post_unpack` — Extract the source from the downloaded file"; "`pre_patch` / `post_patch` — Apply the patches to the source, after extraction." The mupen64plus-lr hunk's comment ("@DEVICE@ is substituted by scripts/unpack") places patch application inside the unpack script, consistent with this order. I looked for a `post_patch` hook in the ppsspp-lr hunk and for the contents of patches 005/006 in the diff; neither is present.
- **Fix:** Move the `if [ "${TARGET_ARCH}" = "x86_64" ]; then sed …; fi` block into `post_patch()`. Then confirm on an x86_64 build log that the flag is absent from the compile lines; if the pristine or patched file already guards it with an ARM64 conditional, delete the block and the comment instead.
- **Confidence:** medium-high — the hook order is documented in the packet and is the standard LibreELEC-family order; `scripts/unpack` itself and the two patches are outside the packet.

### F-EM-03: ARMSX2 token rewrite leaves and regrows Token lines when `secrets.ini` carries two `[Achievements]` headers — a shape the removed code wrote
- **Severity:** Medium
- **Category:** Correctness / Upgrade path
- **Where:** `projects/ROCKNIX/packages/emulators/standalone/armsx2-sa/scripts/cheevos_armsx2.sh` hunk `@@ -87,3 +80,19 @@`, the `else` branch: `sed -i "/^\[Achievements\]/,/^\[/{/^Token *=/d;}" ${ARMSX2_TOKEN}` followed by `sed -i "/^\[Achievements\]/a Token = ${token}" ${ARMSX2_TOKEN}`; and the removed line in hunk `@@ -45,7 +45,6 @@`: `sed -i "\$a [Achievements]\nToken = ${token}" ${ARMSX2_TOKEN}`
- **What:** The comment promises "One Token line, whatever the file held before." The delete uses a `sed` range that ends at the next line starting with `[`. A second `[Achievements]` header closes the range without opening a new one, so Token lines under it are never deleted; the append then adds one Token after *every* header.
- **Failure scenario:** Input written by the pre-fix script (the removed `$a [Achievements]\nToken` ran whenever `PCSX2.ini` had no `[Achievements]`, adding a second header to a seeded `secrets.ini`):
  ```
  [Achievements]
  Token = old
  [Achievements]
  Token = old
  ```
  After this diff's two `sed`s: `[Achievements]` / `Token = new` / `[Achievements]` / `Token = new` / `Token = old` — three Token lines, and the file gains one Token line per launch thereafter (the second block's lines are never in a delete range). The first Token of the first section is correct, so ARMSX2 logs in; the invariant the comment states is false and the accumulate-every-launch behaviour of #170 returns for this file shape.
- **Evidence:** Standard `addr1,addr2` semantics: the end address is tested from the line after the start; a line that closes a range is not re-tested as a start. Tried to refute by finding a shape the old code could not produce: the removed `$a` line in the first hunk writes a header into `secrets.ini` unconditionally on the no-section branch, so a seeded file gains a duplicate header on any launch that took that branch.
- **Fix:** Normalise the whole file rather than one range: drop every `^Token *=` line and every `[Achievements]` header beyond the first (e.g. `awk '/^\[Achievements\]$/{if(seen++)next} /^Token *=/{next} {print}'` to a temp file, then `mv`), then append exactly one `Token = ${token}` after the single header; create the header if none exists.
- **Confidence:** medium-high — the `sed` semantics are not in doubt; how common the two-header shape is on upgraded devices depends on `PCSX2.ini`'s state at launches under the old image, which the packet does not show.

### F-EM-04: PPSSPP offline-proxy probe relies on an undeclared `netstat` and logs every negative as "nothing answers"
- **Severity:** Medium
- **Category:** Build/packaging / Correctness
- **Where:** `projects/ROCKNIX/packages/emulators/standalone/ppsspp-sa/scripts/cheevos_ppsspp.sh:58-61` (hunk `@@ -33,19 +35,40 @@`): `if netstat -ltn 2>/dev/null | grep -q '127\.0\.0\.1:8080 '; then` … `else echo "Offline RetroAchievements is on but nothing answers on 127.0.0.1:8080; launching direct." >> ${LOG_FILE}`; `projects/ROCKNIX/packages/emulators/standalone/ppsspp-sa/package.mk` hunk `@@ -93,7 +93,14 @@` (no dependency added)
- **What:** The script invokes `netstat`; the owning recipe declares nothing for it. `2>/dev/null` and the pipe into `grep -q` make "tool missing", "proxy bound to `0.0.0.0:8080` or `:::8080`", and "proxy down" indistinguishable; all three take the direct path with a log line asserting the proxy is not answering.
- **Failure scenario:** Toggle on, hardcore off, proxy running and answering on loopback, but bound to `0.0.0.0` (or `netstat` absent from the image): `grep` finds no `127.0.0.1:8080 `, `host` stays empty, PPSSPP launches direct every time, and the log blames the proxy. The offline-achievements feature is silently absent for PPSSPP.
- **Evidence:** `.claude/rules/packaging-and-patches.md` (sha256 `2a44db10…`): "If a script the image installs invokes an external CLI tool, declare that tool in the owning package's `PKG_DEPENDS_TARGET`". The ppsspp-sa `package.mk` hunk in this diff touches only the `sources/${DEVICE}` copy. I looked for `netstat`, `busybox`, or `net-tools` in any `PKG_DEPENDS_TARGET` in the diff — none. The proxy's bind address and whether the image's busybox enables the `netstat` applet are outside the packet.
- **Fix:** Probe without an external tool (`exec 3<>/dev/tcp/127.0.0.1/8080` under bash, or the proxy's own status command the comment names, `raofflineproxy-ctl`), or declare the tool that provides `netstat`. Match `:8080 ` after any local address, or read the bind address from the proxy's configuration. Log a distinct message when the probe tool itself is unavailable.
- **Confidence:** medium — the rule and the missing declaration are in the packet; presence of a `netstat` applet and the proxy's bind address are not.

### F-EM-05: `PKG_ARCH="aarch64"` re-imposed on amiberry and yabasanshiro-sa reverts an upstream cleanup on grounds the diff calls unverified
- **Severity:** Medium (High if upstream's AMD64 images currently build these two packages)
- **Category:** Upstream fit / Build/packaging
- **Where:**
  - `projects/ROCKNIX/packages/emulators/standalone/amiberry/package.mk:11-14` (hunk `@@ -8,6 +8,10 @@`)
  - `projects/ROCKNIX/packages/emulators/standalone/yabasanshiro-sa/package.mk:11-19` (hunk `@@ -8,6 +8,14 @@`)
- **What:** Both comments say the restriction was "restored after the 2026-09 upstream cleanup dropped it (28e750db32)" and that `PKG_EMUS lists this package for every device`. The yabasanshiro comment gives the motive — a cold GENERIC_X64 build failure — and closes with "Upstream's own AMD64 target has the same exposure; reported rather than assumed." Submitted upstream, this line removes the two emulators from every x86_64 image upstream builds, on the strength of a fork-VM failure that the fork has not reproduced on upstream's device.
- **Failure scenario:** Upstream AMD64 today builds and ships amiberry and yabasanshiro (the cleanup that removed `PKG_ARCH` is consistent with that). After merge, both packages are skipped on x86_64; AMD64 players lose two emulators, and any generated per-device emulator list or `es_systems` entry that still names them points at binaries that are not there.
- **Evidence:** Comments quoted above. `packages/README.md`: `PKG_ARCH` — "Architectures for which the package builds." I looked for any statement in the diff that upstream AMD64 fails to build either package; the only statement is the explicit "reported rather than assumed."
- **Fix:** Before submitting, build both on an AMD64 device tree (or cite upstream's own build log). If AMD64 fails, submit the CMake port selection fix (`retro_arena` on x86_64) rather than the exclusion; if AMD64 succeeds, keep the exclusion in the fork's GENERIC_X64 device options (or a `case ${DEVICE}` arm) and out of the shared recipe.
- **Confidence:** medium — the reversal and its unverified justification are in the packet; upstream AMD64's actual build result is not.

### F-EM-06: The rotation tables' "right the moment the build is" claim is not demonstrated for a device that already has state
- **Severity:** Medium
- **Category:** Upgrade path
- **Where:**
  - `projects/ROCKNIX/packages/emulators/libretro/fbalpha2012-lr/package.mk:39-46` (`mkdir -p ${INSTALL}/usr/config/emulationstation/rotation`, `python3 … > ${INSTALL}/usr/config/emulationstation/rotation/fbalpha2012.txt`)
  - same pattern: `fbalpha2019-lr/package.mk:40-47`, `fbneo-lr/package.mk:46-54`, `mame2003-plus-lr/package.mk:36-43`, `mame2010-lr/package.mk:47-54`
- **What:** The tables are installed under `/usr/config/emulationstation/rotation/`. On this OS `/usr/config/<component>` is the seed tree that is copied into `/storage/.config/<component>` (the ppsspp-sa hunk in this diff installs `cheat.db` and `PSP/SYSTEM` under `/usr/config/ppsspp` in exactly that role). The comments assert that "what is already on a device is right the moment the build is", which holds only if the reader opens the `/usr/config` copy on the system partition rather than a `/storage/.config` copy seeded once at first boot. The reader is in the ES repository, which contributes zero files to this bucket.
- **Failure scenario:** A device flashed before this build has `/storage/.config/emulationstation/` populated. If the reader looks there and the seed copy runs only when the directory is missing, `rotation/` never arrives on the upgraded device and every core bump thereafter leaves a stale table on devices that were seeded once.
- **Evidence:** Install paths quoted; `.claude/rules/upgrade-and-install.md` (sha256 `de4a683f…`): "For every change in the build, answer both: Upgrade … Clean install" and "Every fix answers what was already written … in writing, and checked." I looked for the reader's path or the seed mechanism in the diff — not present.
- **Fix:** State in the recipe comment (and in the #248 code trace's "Already written" line) the absolute path the ES reader opens. If it is `/storage/.config/…`, install the tables somewhere ES reads directly from the system partition (e.g. `/usr/share/emulationstation/rotation/`) or add the directory to whatever refreshes `/storage/.config/emulationstation` on every boot.
- **Confidence:** low — the reader is outside the packet; the finding stands on the rule's requirement that the answer be written, not on a demonstrated wrong path.

### F-EM-07: Nothing in the packet shows PPSSPP consumes `AchievementsHost`
- **Severity:** Medium
- **Category:** Test gap
- **Where:** `projects/ROCKNIX/packages/emulators/standalone/ppsspp-sa/scripts/cheevos_ppsspp.sh:45-47, 71, 88-92` (hunks `@@ -33,19 +35,40 @@` and `@@ -59,4 +82,12 @@`)
- **What:** The routing writes `AchievementsHost = 127.0.0.1:8080` into `[Achievements]` of `ppsspp.ini` and the comment states "PPSSPP's own achievements client behind AchievementsHost … Empty otherwise, which is PPSSPP's default host." The diff contains no PPSSPP patch adding such a key and no reference to where PPSSPP reads it. A key PPSSPP does not know is ignored without diagnostic.
- **Failure scenario:** PPSSPP has no `AchievementsHost` setting (or names it differently): the ini line is written and ignored, awards go to retroachievements.org, and the offline proxy is bypassed for PPSSPP while every visible indicator says it is on.
- **Evidence:** The key appears only in this script and its comment. I looked for a `patches/` file for ppsspp-sa in the diff and for a `PKG_CMAKE_OPTS_TARGET` change naming a host option — none.
- **Fix:** Cite the PPSSPP source line (or the fork patch) that parses `AchievementsHost` in the script comment, and add a VM check that a launch with the toggle on produces a proxy-side request from PPSSPP.
- **Confidence:** low — the key may well exist upstream; the packet gives no way to confirm it, and the failure mode is silent.

### F-EM-08: mupen64plus-audio-sdl gains libsamplerate and speexdsp on every architecture under an x86_64 justification
- **Severity:** Low
- **Category:** Build/packaging
- **Where:** `projects/ROCKNIX/packages/emulators/standalone/mupen64plus-sa/mupen64plus-sa-audio-sdl/package.mk:10-11` (hunk `@@ -7,7 +7,8 @@`)
- **What:** `PKG_DEPENDS_TARGET` gains `libsamplerate speexdsp` unconditionally; the comment says "for x86_64 (cf4c58652a)". Either the comment mis-states the scope or the dependency is unscoped — every aarch64 image now builds and links two more libraries and the audio plugin's resampler configuration changes on shipping devices.
- **Failure scenario:** none demonstrated; behaviour change on aarch64 (resampler selection, two extra shared libraries in the image) not described anywhere in the diff.
- **Evidence:** The two added tokens and the comment on line 10. I looked for a `case ${TARGET_ARCH}` or `${DEVICE}` guard around the assignment — none; `PKG_DEPENDS_*` may be conditionally appended at file scope (README: assignments in the global section are honoured).
- **Fix:** If the need is x86_64-only, append inside `case ${TARGET_ARCH} in x86_64) PKG_DEPENDS_TARGET+=" libsamplerate speexdsp" ;; esac` at file scope. If the plugin's Makefile needs them on every arch, say so in the comment and drop "for x86_64".
- **Confidence:** medium — the mismatch between comment and scope is in the packet; the plugin's Makefile behaviour is not.

### F-EM-09: ARMSX2: `sed '$a'` writes nothing to an empty `secrets.ini`; a missing file fails after its diagnostic is hidden
- **Severity:** Low
- **Category:** Correctness
- **Where:** `projects/ROCKNIX/packages/emulators/standalone/armsx2-sa/scripts/cheevos_armsx2.sh` hunk `@@ -87,3 +80,19 @@`, `if ! grep -qFx "[Achievements]" ${ARMSX2_TOKEN} 2>/dev/null; then sed -i "\$a [Achievements]\nToken = ${token}" ${ARMSX2_TOKEN}`
- **What:** `$a` appends after the last line; a zero-length file has no last line, so both GNU and busybox `sed` write nothing and exit 0. A missing file makes `grep` fail (its error hidden by `2>/dev/null`) and then `sed -i` fails on the missing path.
- **Failure scenario:** `secrets.ini` exists but is empty (truncated by the emulator or a restore): no header, no token written, exit 0, ARMSX2 launches logged out with nothing in the launch log explaining why.
- **Evidence:** The command sequence quoted; the pre-fix code had the same `$a` but the new comment now claims the block handles "whatever the file held before". I tried to find a `[ -s ]` or `printf >>` path — none.
- **Fix:** In the no-header branch, `printf '[Achievements]\nToken = %s\n' "${token}" >> "${ARMSX2_TOKEN}"` (creating the directory first if needed) instead of `sed '$a'`.
- **Confidence:** medium — the `sed` behaviour on an empty file is standard; how often the file is empty on devices is unknown.

### F-EM-10: `rotation_table_check` duplicated verbatim in five recipes; the generator already computes the count; each copy is an "unknown function" to pkgcheck
- **Severity:** Low
- **Category:** Convention
- **Where:** the five `rotation_table_check()` definitions listed under F-EM-01; `rotation-table-fba.py:27`, `rotation-table-mame.py:36` (`print('# %d games with a turn' % len(out), file=sys.stderr)`)
- **What:** Eight identical shell lines and an eight-line identical comment appear five times. Both generators already know `len(out)`. `packages/README.md` documents that `tools/pkgcheck` reports an unlisted function name as `unknown function | WARN`, and `packaging-and-patches.md` requires running pkgcheck after every `package.mk` edit; five new WARNs land.
- **Failure scenario:** none demonstrated (a future edit to the threshold or message that misses one copy).
- **Evidence:** Text identical across the five hunks; README pkgcheck table row quoted.
- **Fix:** Give the generators a `--min N` argument that exits non-zero below the threshold and prints the count on stderr; the recipes become `python3 … --min 100 > table || die`. Delete the five copies.
- **Confidence:** medium — pkgcheck's exact function whitelist is outside the packet.

### F-EM-11: New generator scripts carry no SPDX or copyright header
- **Severity:** Low
- **Category:** Convention
- **Where:** `projects/ROCKNIX/packages/emulators/libretro/rotation-table-fba.py:1-5`; `projects/ROCKNIX/packages/emulators/libretro/rotation-table-mame.py:1-6`
- **What:** Both files open with a shebang and prose comments; no `SPDX-License-Identifier`, no copyright line.
- **Failure scenario:** none demonstrated.
- **Evidence:** First lines of both files as shown in the diff. `packaging-and-patches.md`: "Open with the SPDX header and the copyright lines … this is a fork, and the licensing depends on those being kept."
- **Fix:** Add `# SPDX-License-Identifier: GPL-2.0-or-later` (or the repo's chosen identifier) and a ROCKNIX copyright line after the shebang.
- **Confidence:** high.

### F-EM-12: Generator doc drift — usage line names a different file; an unused compiled regex
- **Severity:** Low
- **Category:** Documentation
- **Where:** `rotation-table-fba.py:5` (`fbneo-rotation-table.py <fbneo src root>`); `rotation-table-mame.py:8` (`macro = re.compile(r'\bGAME[A-Z]*\s*\((.*?)\)\s*$', re.S | re.M)`)
- **What:** The FBA generator's usage line names a file that does not exist and describes only FBNeo, though the fbalpha2012/2019 recipes' comments say "the generator mirrors the core's own mapping" for those cores. The MAME generator compiles `macro` and never uses it (the loop uses an inline `re.finditer`).
- **Failure scenario:** none demonstrated.
- **Evidence:** Lines quoted; `macro` does not appear again in the 36-line file.
- **Fix:** Rename the usage line to `rotation-table-fba.py <fba/fbneo src root>` and name which cores' mappings were checked; delete the unused regex.
- **Confidence:** high.

### F-EM-13: Fork-internal issue, audit, decision and commit references in upstream-bound comments
- **Severity:** Low
- **Category:** Upstream fit
- **Where:** every added comment block in the bucket, e.g. `fbalpha2012-lr/package.mk:11-13, 20-27, 39-43` ("audit #258 PL-018", "fork #248, D-UI-082", "2026-09-24"); `aethersx2-sa/package.mk:12-19` ("28e750db32", "audit #258 PL-010"); `cheevos_armsx2.sh` hunk `@@ -87,3 +80,19 @@` ("fork #170", "#273's trace of #170"); `cheevos_ppsspp.sh:45-55` ("fork #165, D-RA-002", "#186 PL-31"); `mupen64plus-sa-audio-sdl/package.mk:10` ("cf4c58652a"); `yabasanshiro-sa/package.mk:11-18` ("610/641 on 2026-09-19")
- **What:** These identifiers resolve only in the fork's tracker and audit tree. In upstream's repository they are dead references, and the dated measurements ("853 to 2544 rows on 2026-09-24") age immediately.
- **Failure scenario:** none demonstrated.
- **Evidence:** Quoted above.
- **Fix:** Rewrite each comment as the plain rationale (what breaks without the line, on which architecture), keep issue numbers in the commit message.
- **Confidence:** high.

### F-EM-14: Fork-only device `GENERIC_X64` wired into shared recipes
- **Severity:** Low
- **Category:** Upstream fit
- **Where:** `projects/ROCKNIX/packages/emulators/libretro/mupen64plus-lr/package.mk:15-21` (hunk `@@ -12,6 +12,14 @@`); `projects/ROCKNIX/packages/emulators/standalone/mupen64plus-sa/mupen64plus-sa-video-gliden64/package.mk:15, 22, 47-51` (hunks `@@ -12,14 +12,14 @@`, `@@ -44,6 +44,11 @@`); `projects/ROCKNIX/packages/emulators/standalone/ppsspp-sa/package.mk:97-104`
- **What:** Three recipes branch on a device upstream does not have; the GLideN64 comment says so ("GENERIC_X64 is ours, so upstream has no branch"). Unless the GENERIC_X64 device overlay is part of the same submission, these arms are unreachable upstream. The ppsspp-sa `[ -d … ]` guard is harmless standalone but its comment is written around the fork's VM.
- **Failure scenario:** none demonstrated.
- **Evidence:** Lines quoted; the mupen64plus-lr arm adds `AMD64` patches for a device that upstream cannot select.
- **Fix:** Submit the GENERIC_X64 device with these arms, or carry them in the fork only; for the `x86_64) -DNOHQ=On` arm in GLideN64 (which is arch-keyed, not device-keyed) keep it — it is the one piece a maintainer can accept independently.
- **Confidence:** high.

### F-EM-15: `PKG_MAKE_OPTS_TARGET+="-DNOHQ=On"` appends without a separator
- **Severity:** Low
- **Category:** Convention
- **Where:** `projects/ROCKNIX/packages/emulators/standalone/mupen64plus-sa/mupen64plus-sa-video-gliden64/package.mk:50` (hunk `@@ -44,6 +44,11 @@`)
- **What:** `+=` with no leading space concatenates onto any existing value; correct only while the variable is empty at that point in `configure_target`.
- **Failure scenario:** none demonstrated — the adjacent `arm|aarch64)` arm (line 46, context) uses the same form and builds, so the variable is empty here today.
- **Evidence:** Line quoted; the existing arm at line 46 shows the same pattern.
- **Fix:** `PKG_MAKE_OPTS_TARGET+=" -DNOHQ=On"`.
- **Confidence:** medium.

## 3. Upstream fit

A ROCKNIX maintainer reviewing this as a pull request would push back on:

- **Reversal of their own cleanup.** Five files re-add `PKG_ARCH="aarch64"` and one re-adds a `[ -d ]` guard that `28e750db32` removed. For aethersx2-sa, bigpemu-sa and drastic-sa the comments concede the line is "belt and braces" (the packages are only listed in aarch64 device arms), so those three are churn. For amiberry and yabasanshiro-sa the change alters upstream's AMD64 images on evidence the comment itself calls "reported rather than assumed" (F-EM-05). Expect a request for an AMD64 build log or for the fix to move into the fork's device options.
- **Fork-only device in shared recipes.** `GENERIC_X64` arms in mupen64plus-lr and GLideN64 (F-EM-14) are unreachable without the device overlay; the maintainer will ask whether GENERIC_X64 is coming upstream, and if not, will drop them.
- **Rotation tables with no upstream consumer.** Five `/usr/config/emulationstation/rotation/*.txt` files, two loose scripts in a package-group directory, and a `Python3:host` dependency on five cores are dead weight unless the ES change that reads them (D-UI-081/082, another bucket, another repository) lands first or together. The maintainer will also ask for the generators to live in a package directory or under `tools/`, with SPDX headers (F-EM-11), and for `PKG_NEED_UNPACK` instead of the "clean by hand" instruction (F-EM-01).
- **Copy-paste volume.** The same 8-line function and 8-line comment five times, the same 8-line `PKG_ARCH` comment three times (F-EM-10).
- **Comment hygiene.** Audit IDs, decision IDs, fork issue numbers, fork commit hashes and dated row counts throughout (F-EM-13). The yabasanshiro comment reads as a work-log entry ("failed the cold GENERIC_X64 build at 610/641 on 2026-09-19").
- **The offline-proxy wiring in `cheevos_ppsspp.sh`** depends on a fork service (RAOfflineProxy), a fork settings key (`global.retroachievements.offlineproxy`), a hard-coded `127.0.0.1:8080`, and an undeclared `netstat` (F-EM-04). Without the proxy bucket it is a no-op with a log line; with it, the port and address should come from one place.
- **Accepted as-is, most likely:** the `post_unpack` late-binding move in ppsspp-lr (once relocated to `post_patch`, F-EM-02), the `.unofficial`/`.testunofficial` read-both in Dolphin and melonDS, the `[ "${enabled}" != "1" ]` quoting fix, the `x86_64) -DNOHQ=On` arm, and the ARMSX2 move of the token to `secrets.ini` (once the range bug in F-EM-03 is fixed). No credentials or personal paths appear in the diff. Commit hygiene is not visible: the packet is a single range diff with no commit boundaries.

## 4. Coverage boundary

I could not judge, and would need to see:

- **`scripts/unpack`** — to confirm the `post_unpack` → patch → `post_patch` order that F-EM-02 rests on; the README in the packet documents it but the script does not appear.
- **ppsspp-lr `patches/005*` and `006*`** — whether the injected `-mno-outline-atomics` is inside an ARM64 conditional (F-EM-02's second branch).
- **The ES-side reader for `rotation/<core>.txt`** and the mechanism that seeds `/usr/config/emulationstation` into `/storage/.config` — F-EM-06 cannot be resolved from the distribution repository alone. Also which name ES uses to key the table (`mame2003_plus` vs the core's `.so` name) and how it treats the FBNeo "Vertical mode" / MAME "TATE" core options that change the core's requested rotation.
- **`libretro.cpp` of fbalpha2012 and fbalpha2019, `video.c` of mame2003-plus, `retromain.c` of mame2010** — the generators claim to mirror each core's rotation mapping; only FBNeo's mapping is named in a generator header.
- **`config/options` and `calculate_stamp`** — whether `PKG_DIR` is set before the recipe is sourced and whether `PKG_NEED_UNPACK` accepts a single file (README says "files or folders").
- **The image's busybox configuration and RAOfflineProxy's bind address/port**, and `raofflineproxy-ctl`, for F-EM-04; **PPSSPP's `Core/Config.cpp`** (or a fork patch) for F-EM-07.
- **Upstream's AMD64 build of amiberry and yabasanshiro-sa** and the `virtual/emulators` device arms, for F-EM-05; and whether any generated emulator list or `es_systems` entry names a package that `PKG_ARCH` now skips.
- **The head of `cheevos_armsx2.sh`** (where `ARMSX2_TOKEN` is defined, whether the script exits before the new block when achievements are off, whether it also reads `testunofficial`) and every other `cheevos_*.sh` in the tree — only Dolphin and melonDS received the `.unofficial` fallback.
- **`patches/AMD64/` of mupen64plus-lr** — whether the platform name is `@DEVICE@` (substituted to `GENERIC_X64`) as the comment states, or literal `AMD64`.
- **mupen64plus-audio-sdl's Makefile** — whether libsamplerate/speexdsp are optional (`NO_SRC`/`NO_SPEEX`) or required, to size the aarch64 effect in F-EM-08.
- **Output of `tools/pkgcheck`** on the five edited libretro recipes (F-EM-10) and a build log from an x86_64 build of ppsspp-lr (F-EM-02).
- **Row counts of the five generated tables** from a current build, to confirm the ≥100 guard is comfortably below every core's real count.

---

*Corpus read from the Facilitator's embedded sources: `docs/audits/2026_09_25-milestone-rc-round-since-258/seats/9-emulators.diff` (`83352acbb289dc4abcce3e496b8bf930c30c277b1273747842977c57a2d435b1`); `.claude/skills/code-auditor/references/anti-patterns.md` (`fd825c0505ae772ca2a6651eefe642581aaa147c254fed8cf50db1f8f1bde678`); `.claude/rules/upgrade-and-install.md` (`de4a683f9a36f9100e6fd98be11ad84d736f370374c40f74c445a2b81eca1995`); `.claude/rules/packaging-and-patches.md` (`2a44db10f4f179198b9366239eabe0900e1701145beced181536eb18bcbc0746`); `packages/README.md` (`db3a14de71c3ec3f52db77ac2f7a6f6b75d58f007c977de19fe116ae93b81742`). No other file was read; hashes are the Facilitator's, not re-computed here.*