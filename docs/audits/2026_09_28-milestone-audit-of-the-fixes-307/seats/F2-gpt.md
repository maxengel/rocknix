# F2 audit of the fixes

**Disposition:** PL-076 holds at the configuration-file level. PL-002, PL-032, and PL-043 hold in part; none should be closed unconditionally from this packet.

This is a static review of the embedded contents. I did not execute tests, inspect a filesystem, or independently hash anything. Failure scenarios below are code traces or proposed regression fixtures, not claimed test runs.

References **[S1]–[S8]** resolve to the declared paths and Facilitator-verified hashes in `corpus.provenance.json` below. Code locations identify target files and hunks **within S1**, not separately inspected files. The supplied diff contains integrated changes beyond those described in F2’s branch report; findings concern those delivered hunks without attributing authorship.

## 1. Punch-item verdicts

| Item | Verdict | Evidence and outstanding acceptance |
|---|---|---|
| **PL-002 — generator build stamps** | **Holds in part** | All five consumers add `PKG_NEED_UNPACK` naming their respective shared generator. For example, `fbalpha2012-lr/package.mk`, hunk `@@ -7,40 +7,29 @@`, adds `PKG_NEED_UNPACK="$(dirname "$(get_pkg_directory ${PKG_NAME})")/rotation-table-fba.py"`; the other FBA consumers and both MAME consumers receive corresponding declarations. [S1] F2-1 meaningfully compares nonempty stamps before and after edits, including other-family controls. [S2] However, `calculate_stamp`, the actual build invalidation path, and a warm-root `scripts/build` result are not embedded. The plan’s actual-rebuild acceptance remains unproved. [S3] |
| **PL-032 — sharp-size selection and patch context** | **Holds in part** | Patch 0017 now selects a table through `gfx_widgets_sharp_face(font_path)`, and both regular/bold loading branches request that selection. Its context now names the 13-pixel floor, and font diagnostics are added. [S1, `0017-widgets-sharp-font-sizes.patch`, hunks beginning `@@ -2,34 +2,55 @@`, `@@ -40,13 +61,53 @@`, and `@@ -64,71 +125,92 @@`] But the lookup contains only the two ozone faces. For the plan’s shipped-face case, `xmb/monochrome/font.ttf`, F2-4 expressly expects **no table**. [S2] No guest log or frame comparison is embedded, nor the complete stack and pinned source needed to independently establish fuzz-zero application. The original “text at a sharp size” acceptance is not completed by unchanged rendering plus a diagnostic. |
| **PL-043 — private, recipe-time `.env`** | **Holds in part** | The parse-time writer is removed. The recipe creates the file under `umask 077`, refuses a failed `get_env`, and installs cleanup traps. [S1, `Makefile`, hunks `@@ -156,11 +156,6 @@` and `@@ -175,5 +170,14 @@`] These address the ordinary stale-file case exercised by F2-3. [S2] However, the initial unlink is unchecked: a failed removal can leave a writable 0644 file to be reused. **G-F2-01** prevents a full verdict. |
| **PL-076 — armhf updater endpoint** | **Holds** | The integrated diff deletes `core_updater_buildbot_url = "http://buildbot.libretro.com/nightly/linux/armhf/latest/"` while retaining the empty `core_updater_buildbot_cores_url`. [S1, `retroarch/sources/GENERIC_X64/retroarch.cfg`, hunk `@@ -111,7 +111,6 @@`] This satisfies the plan’s configuration-line acceptance. F2’s report left it to another owner, but the delivered diff contains the deletion. [S3, S4] |

## 2. Findings

### G-F2-01: An unlink failure can preserve the world-readable `.env`

- **Severity:** Medium
- **Category:** Credentials / fail-closed guard
- **Where:** `Makefile`, hunk `@@ -175,5 +170,14 @@`. [S1]
- **What:** The recipe relies on successful deletion to obtain fresh permissions, but does not check that deletion:
  ```sh
  rm -f .env; trap 'rm -f .env' EXIT; ...
  ( umask 077 && ./scripts/get_env > .env ) || ...
  ```
  `umask` does not tighten an existing file.
- **Failure scenario:** Run the recipe under the shell execution modeled by F2-3 in a directory the caller can traverse but cannot modify, containing a caller-owned, writable 0644 `.env`. Removal fails, but truncating and writing that existing file can succeed. The container receives a world-readable environment file; the cleanup removal encounters the same obstacle.
- **Evidence:** The unlink is followed by `;`, not a checked condition. The shown recipe contains neither a subsequent mode assertion nor permission tightening. F2-3 seeds a removable 0644 file, so it does not cover this case. [S2, F2-3] A checked unlink—or another mechanism that positively establishes a private file before writing credentials—would refute the finding. The recipe should refuse to continue when that prerequisite fails. [S5, “Guards must fail closed”]

### G-F2-02: An IPv6-only listener is mistaken for a reachable IPv4 proxy

- **Severity:** Medium
- **Category:** Correctness / network endpoint selection
- **Where:** `projects/ROCKNIX/packages/emulators/standalone/ppsspp-sa/scripts/cheevos_ppsspp.sh`, hunk `@@ -49,17 +49,48 @@`. [S1]
- **What:** `proxy_listening()` accepts an IPv6 loopback listener, but the caller invariably selects the IPv4 endpoint:
  ```sh
  ...|00000000000000000000000001000000:1F90|...) return 0 ;;
  ```
  followed by:
  ```sh
  0) host="127.0.0.1:8080" ;;
  ```
- **Failure scenario:** Offline proxy use is enabled, hardcore is explicitly off, and the only listener is `::1:8080`. Detection succeeds, but connections to `127.0.0.1:8080` do not reach an `::1`-bound socket. An IPv6 wildcard listener can also be IPv6-only.
- **Evidence:** The function returns only a status, not the reachable address. The caller performs no connection check and never selects an IPv6 endpoint. No IPv4 listener is required once either IPv6 pattern matches. Restricting detection to an endpoint reachable at the selected host, or selecting and validating the detected address, would close this false-positive path. This is present in the integrated diff although not described in F2’s branch report.

### G-F2-03: MAME extraction still accepts a `GAME()` written inside a string

- **Severity:** Medium
- **Category:** Correctness / incomplete extraction fix
- **Where:** `projects/ROCKNIX/packages/emulators/libretro/rotation-table-mame.py`, hunk `@@ -1,36 +1,74 @@`. [S1]
- **What:** Comment stripping preserves literals, but macro recognition subsequently searches those literals as source code:
  ```python
  text = strip_comments(fh.read())
  for m in re.finditer(r'\bGAME[A-Z]*\s*\(', text):
  ```
- **Failure scenario:** This proposed fixture contains no driver declaration:
  ```c
  const char *note = "GAME(1990, phantom, 0, m, i, 0, ROT90)";
  ```
  The shown scanner finds seven arguments, accepts `phantom` as the name, and assigns it three turns. A real tree with enough legitimate rows still passes `--min 100`.
- **Evidence:** There is no literal-aware filter around the macro search. F2-2 tests `//` inside a title string, but not a macro-shaped string; that does not exercise this failure. [S2] Token-aware recognition that excludes literals would refute it. This is a remaining extractor defect, **not evidence that the current pinned tables contain this particular false row**; those source trees are absent.

### G-F2-04: Control1’s inherited configuration has no demonstrated repair path

- **Severity:** Medium
- **Category:** Upgrade completeness / verification gap
- **Where:** `projects/ROCKNIX/packages/emulators/standalone/mupen64plus-sa/mupen64plus-sa-core/config/GENERIC_X64/mupen64plus.cfg`, hunk `@@ -186,12 +186,6 @@`; F2-5. [S1, S2]
- **What:** Removing the foreign section header fixes the shipped seed. The supplied test reads that seed directly; it does not exercise an existing `/storage` configuration.
- **Failure scenario:** A device retains the previous seeded configuration through an upgrade. On the seed-only-when-absent path described by the report, the foreign header remains and the corrected seed is never consumed.
- **Evidence:** The delivered hunk changes only the default configuration, and F2-5 contains no inherited-file fixture or migration invocation. The report explicitly says an old guest keeps the spliced copy until deletion. [S4, “For the integrator”] **That launcher behavior is not independently verified here because the launcher is not embedded.** A migration, compatible reader, or upgrade test showing automatic repair would settle the gap. Until supplied, the upgrade half must remain open; manual deletion is not demonstrated preservation of customized settings. [S6]

### G-F2-05: F2-4 does not test the branch behavior it says it proves

- **Severity:** Medium
- **Category:** Regression-test effectiveness
- **Where:** `F2.harness.txt`, F2-4’s “Both branches ask the drawn face” and “F-RW-05” checks. The associated implementation is in patches 0017 and 0018. [S1, S2]
- **What:** The font test executes the lookup primitive separately, while branch wiring and Auto-slot behavior are checked largely through source spellings.
- **Failure scenario:** Either of these regressions can escape the supplied F2-4 assertions:
  1. Change the user-path regular/bold calls from `sharp=true` to `sharp=false`. The standalone face lookup still passes, while the actual loading branch stops applying the table.
  2. Make `command_append_config_sets_auto_slot()` always return `true`. Its declaration and calls remain, syntax compilation succeeds, and the original “any negative main-config slot stays Auto” behavior returns.
- **Evidence:** The user-path check searches for `gfx_widget_fonts.regular` and the subsequent `font_path` argument with ordinary, line-oriented `grep`; the calls shown in the patches span lines. It also targets the old `NULL, 0` signature, not the new boolean switch. The Auto checks require the helper’s name in three places but never evaluate configuration precedence. [S2, F2-4] Executable branch tests and a main-only/append-negative/last-file-wins configuration matrix would refute these specific test gaps. The report’s old-build `Probe.state.auto` narrative is not a behavioral test of the new narrowing. [S4]

### G-F2-06: Missing prerequisites silently remove important proof cases

- **Severity:** Medium
- **Category:** Validation / fail-closed coverage
- **Where:** `F2.harness.txt`, F2-4 and F2-6 prerequisite branches. No unified harness diff hunk is supplied; these section labels are the packet’s locators. [S2]
- **What:** Missing RetroArch source skips the entire patch/font/slot block; missing PPSSPP source skips its hook-order check; missing GCC skips the patched-source compilation. These branches merely print `SKIP`.
- **Failure scenario:** A checkout without the cached sources runs the supplied block successfully without applying the RetroArch stack or checking PPSSPP’s final flags. An empty or unrecognized pin can also lead into the source-missing branch rather than a failing assertion.
- **Evidence:** These branches contain no failing `check`, nonzero termination, or explicit non-passing status assignment. The full harness wrapper is not embedded, so I **cannot establish whether an external layer rejects these skips**. The block itself supplies no such enforcement. Mandatory acceptance checks need a failure or a propagated incomplete result; the report’s aggregate `PASSED` claim cannot substitute for establishing which cases actually ran. [S4, S5]

### G-F2-07: ARMSX2’s final rename bypasses its rewrite-failure handler

- **Severity:** Low
- **Category:** Failure handling / credential-file cleanup
- **Where:** `projects/ROCKNIX/packages/emulators/standalone/armsx2-sa/scripts/cheevos_armsx2.sh`, hunk `@@ -83,16 +83,45 @@`. [S1]
- **What:** The condition checks the AWK write and nonempty temporary file, but `mv` runs inside the successful branch:
  ```sh
  if (...) && [ -s "${ARMSX2_TOKEN_TMP}" ]; then
      mv -f "${ARMSX2_TOKEN_TMP}" "${ARMSX2_TOKEN}"
  else
      rm -f "${ARMSX2_TOKEN_TMP}"
      echo "... could not be rewritten ..." >> ${LOG_FILE}
  fi
  ```
- **Failure scenario:** Temporary-file creation succeeds but replacement is refused or otherwise fails. The old file remains, but this writer’s failure message and temporary-file cleanup are bypassed.
- **Evidence:** No result check follows `mv` in the supplied hunk. Its nonzero status might propagate to a caller; this is **not** a claim that the script necessarily returns success. The complete caller and any earlier traps are unavailable. Including replacement in the checked operation, with cleanup on failure, would fix the local handling defect.

## 3. Sweep spot-checks

The following are checks against implementation lines, not endorsements of reported executions. All implementation locators below are within **S1**.

| Sweep row(s) | Static result |
|---|---|
| **9 / claude / F-EM-02** — PPSSPP hook order | **Holds at the recipe level.** The atomics strip moves into `post_patch()`, while cross-compilation adjustments remain in `post_unpack()`. `ppsspp-lr/package.mk`, `@@ -59,18 +59,17 @@`. The actual unpack dispatcher and source/patch application result are not embedded. |
| **9 / claude / F-EM-05** — architecture restrictions | **Holds for the requested selection rule.** Both `amiberry` and `yabasanshiro-sa` assign the aarch64 restriction only inside `DEVICE=GENERIC_X64`. Hunks `@@ -8,10 +8,13 @@` and `@@ -8,14 +8,16 @@`. This does not establish that an AMD64 build succeeds. |
| **9 / claude / F-EM-15; 9 / gpt / F-EM-02** — GLideN64 | **Holds for the changed branch.** The broad x86_64 `NOHQ` arm is removed; GENERIC_X64 alone appends `" -DNOHQ=On"` with a separator. `mupen64plus-sa-video-gliden64/package.mk`, `@@ -44,13 +44,16 @@`. |
| **9 / claude / F-EM-10** — shared row floor | **Holds mechanically.** Both generators calculate their output-row count and exit nonzero below `minimum`; all five consumers pass `--min 100`; copied `rotation_table_check()` functions are removed. Whole-generator hunks and the five consumer hunks. This floor does not detect erroneous extra rows; see G-F2-03. |
| **9 / claude / F-EM-11, F-EM-12; 9 / gpt / F-EM-06** — attribution and documentation | **Holds.** Both scripts gain SPDX/copyright headers, FBA usage names the actual script, and the unused MAME `macro` declaration is deleted. Whole-generator hunks. |
| **6 / claude / F-RW-07** — XMB reset fallback | **Holds in the shown condition.** Patch 0014 adds the configured `"xmb"` name fallback specifically when `menu_driver_id` is UNKNOWN. `@@ -90,7 +92,10 @@`. Runtime scale equality is not demonstrated here. |
| **6 / claude / F-RW-08; 6 / gpt / F-RW-03, F-RW-04** — placement | **Holds at the changed call sites.** Patch 0019 logs small/full heights and pitches using `divider_width_1px` after its assignment, then calls `gfx_widgets_msg_queue_move()` for existing messages. `@@ -104,14 +76,48 @@`. Animation behavior needs the complete implementation/runtime. |
| **7 / claude / F-VM-09** — Control1 splice | **Fresh seed fixed; upgrade unproved.** The inserted section header and duplicate settings are removed, leaving mappings in the intended section. `@@ -186,12 +186,6 @@`. See G-F2-04. |
| **9 / claude / F-EM-08** — audio dependencies | **Declaration change holds.** `libsamplerate` is removed and `speexdsp` retained. `mupen64plus-sa-audio-sdl/package.mk`, `@@ -7,8 +7,11 @@`. The actual `NO_SRC=1` make invocation and upstream link selection are not in the diff. |
| **4 / claude / F-BR-10** — duplicate zip | **Deletion confirmed; equivalence cannot be confirmed.** The generic recipe and patch are deleted. The surviving project recipe/patch are absent, so the report’s byte-equivalence and no-lost-behavior claims cannot be checked. F2-13 counts recipes but does not compare the survivor’s behavior or inspect the image’s `zip` binary. [S2, S7] |

### Withdrawals

- **Duplicate dispositions hold:** the rotation-stamp sweep duplicates PL-002, and the `.env` sweep duplicates PL-043. The plan and corresponding edits make those mappings clear. [S1, S3]
- **Ownership handoffs are not resolutions:** the plan’s exclusions support treating ES-tree work and specified other-stream work as handoffs. Nothing in this packet establishes completion by those owners. [S3, S4]
- **PR-preparation deferrals are authorized dispositions, not fixes:** the plan explicitly permits such withdrawals. Remaining fork-specific comments are visible. Whether the eventual upstream packet excludes or rewrites them is outside this review. [S1, S3]
- **The `valloc` withdrawal is only partly checkable:** the deleted patch does place `valloc()` under `#ifdef MMAP`. The assertion that nothing defines `MMAP`, and the surviving project patch, are not embedded. [S1, S4]
- **I cannot validate the substantive refutations** concerning `get_env` consumers, extraction-directory cleanup, EmulationStation’s rotation-table read path, or the approved overscan/margin decision. Their deciding sources are outside the corpus. [S4]

## 4. Coverage boundary and required handoff

**Several fixes claimed in the report are not represented by implementation hunks in the supplied diff.** These include the GStreamer overrides, ryzenadj/dmidecode changes, woff2 cleanup, and the empty VirtualBox-quirk deletion. The harness describes tests for them, but that is not their implementation. I cannot distinguish delivery omissions from packet omissions; the orchestrator should supply the missing hunks before closing those rows.

Other boundaries:

- No raw harness, `pkgcheck`, strict patch-application, font-measurement, image, or guest results are embedded. Reported counts and observations remain claims.
- `config/functions`, `scripts/build`, `scripts/unpack`, complete package sources/patch stacks, and the relevant configuration seed/migration readers are unavailable.
- The actual shipped font-path settings and decision-register refinement needed for PL-032 are unavailable.
- Additional integrated configuration changes—GL as the GENERIC_X64 RetroArch default, Flycast window-size removal, and the empty Mupen controller name—are visible, but their inherited-config behavior is not.
- The optional bootloader-copy change visibly replaces a failing terminal `a && b` with an `if`; the behavior of `find_file_path` itself is outside the packet.
- I found no demonstrated player-vocabulary violation: the new diagnostics shown are build-side or directed to emulator logs. I have not established whether unembedded callers display those logs to players. [S8]

## `corpus.provenance.json`

The following is provenance content for the orchestrator to save; no filesystem write is claimed.

```json
{
  "corpus_mode": "prompt-embedded read-at-time corpus",
  "source_ids": [
    "S1",
    "S2",
    "S3",
    "S4",
    "S5",
    "S6",
    "S7",
    "S8"
  ],
  "source_file_paths": [
    "docs/audits/2026_09_28-milestone-audit-of-the-fixes-307/seats/F2.diff",
    "docs/audits/2026_09_28-milestone-audit-of-the-fixes-307/seats/F2.harness.txt",
    "docs/audits/2026_09_28-milestone-audit-of-the-fixes-307/seats/F2.plan.md",
    "docs/audits/2026_09_28-milestone-audit-of-the-fixes-307/seats/F2.report.md",
    ".claude/rules/engineering-practices.md",
    ".claude/rules/upgrade-and-install.md",
    ".claude/rules/packaging-and-patches.md",
    ".claude/rules/es-player-text.md"
  ],
  "source_file_hashes": [
    "b7e13881adfc850cb2afdb7ba57e4c7cfea46a3ca1955022b1b642c64a9844c9",
    "ed0a6cadc720b17840bb9c28f1d83b4fb8d0bc42e760c44a2b87b387d83e7322",
    "80830e921e97d803de7227fe40ff6539ede05f5796e870263e6af21b5ce2c731",
    "7853e457421781c44b87688e8414ea9aa9bdc690b36ba5b72a88bb3b59752fa3",
    "d6f88a6f4cd9c61b0e6ef728625c6a1cec9dc6f58e1db578cf0987f10f870c1a",
    "de4a683f9a36f9100e6fd98be11ad84d736f370374c40f74c445a2b81eca1995",
    "2a44db10f4f179198b9366239eabe0900e1701145beced181536eb18bcbc0746",
    "554225c68e627a3bde8969a77f177aea14f5bcd85b0bcc740631d402a5f1f7a7"
  ],
  "array_alignment": "source_ids, source_file_paths, and source_file_hashes correspond by index",
  "hash_algorithm": "sha256",
  "hash_verification": "Verified by the Council Facilitator at embed time; supplied values recorded without independent re-hashing",
  "facilitator_manifest_read_timestamp_utc": "2026-09-28T04:20:24Z",
  "auditor_filesystem_access": false,
  "auditor_executed_tests": false,
  "coverage_gaps": [
    {
      "sources": [
        "config/functions",
        "scripts/build",
        "scripts/unpack",
        "scripts/get_env",
        "packages/README.md"
      ],
      "reason": "Build-stamp consumption, hook dispatch, complete environment handling, and authoritative package semantics are not embedded."
    },
    {
      "sources": [
        "projects/ROCKNIX/packages/multimedia/gstreamer/gst-plugins-bad/package.mk",
        "projects/ROCKNIX/packages/multimedia/gstreamer/gst-plugins-base/package.mk",
        "packages/multimedia/gstreamer/gst-plugins-bad/package.mk",
        "packages/multimedia/gstreamer/gst-plugins-base/package.mk",
        "packages/sysutils/ryzenadj/package.mk",
        "packages/sysutils/dmidecode/package.mk",
        "packages/graphics/woff2/package.mk"
      ],
      "reason": "Reported fixes or fixture dependencies lack implementation contents in the supplied corpus."
    },
    {
      "sources": [
        "projects/ROCKNIX/packages/compress/zip/package.mk"
      ],
      "reason": "The surviving recipe and its patch are needed to verify behavioral equivalence after deleting the generic copy."
    },
    {
      "sources": [
        "docs/decision-register.md",
        "es-app/src/CaptureRotation.cpp"
      ],
      "reason": "Needed to check the cited font-policy decisions and rotation-table reader claim; not embedded."
    },
    {
      "sources": [],
      "reason": "Complete RetroArch and PPSSPP pinned sources and patch stacks, current shipped font settings, the Mupen configuration seeder/migration, and the full harness wrapper are not embedded. No additional paths or hashes are asserted."
    },
    {
      "sources": [],
      "reason": "Raw execution logs, font measurements, guest logs, frames, warm-root rebuild evidence, and the reported empty-quirk deletion are not embedded."
    }
  ]
}
```