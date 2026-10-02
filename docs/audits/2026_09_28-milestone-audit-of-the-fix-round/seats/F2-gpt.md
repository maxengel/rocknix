# F2 audit — follow-up review

**Disposition:** not ready for unconditional closure. The `.env` fix is sound for the reported failure. PL-002 still needs its build-system acceptance proof, PL-032 does not meet its shipped-font acceptance, and PL-076 cannot be verified here. I found **three Medium issues and one Low issue** in the delivered code.

This is a **static review of the embedded corpus**. I did not access files, execute tests, apply patches, or recompute hashes. The report’s “437 PASS” remains the stream’s reported result, not an independently observed result.

Citations such as **[D]** identify the exact path/hash pair recorded in `corpus.provenance.json` below. Code locations name target files **inside that diff**, not separately inspected files.

For compact locators:
- `LR/` = `projects/ROCKNIX/packages/emulators/libretro/`
- `SA/` = `projects/ROCKNIX/packages/emulators/standalone/`
- `GST/` = `projects/ROCKNIX/packages/multimedia/gstreamer/`
- `H:F2-N` = [D], `tools/last-good-scripts-test`, hunk `@@ -3011,4 +3011,678 @@`, labeled case F2-N.

## 1. Punch-item verdicts

The acceptance criteria are those in [I], not the report’s resolution labels.

| Item | Verdict | Evidence and remaining work |
|---|---|---|
| **PL-002 — generator changes invalidate consumer stamps** | **Holds in part** | All five recipes add `PKG_NEED_UNPACK="$(dirname "$(get_pkg_directory ${PKG_NAME})")/rotation-table-….py"`. `H:F2-1` extracts `calculate_stamp`, computes stamps, edits each generator, and checks the affected family changes while the other family does not. These are concrete changes addressing the defect. However, the implementation of `calculate_stamp` and the consuming `scripts/build` path are not embedded. The acceptance specifically requires `./scripts/build <core>` to rebuild and move `build_target`; [R] expressly leaves that proof to the integrator. |
| **PL-032 — sharp-size behavior on the shipped font, and valid patch context** | **Holds in part** | Patch 0017 now recognizes measured faces by path in both layout branches, and its new context names `MSG_QUEUE_MIN_SIZE 13.0f`. But the table contains only `ozone/regular.ttf` and `ozone/bold.ttf`; `H:F2-4` explicitly expects **`none`** for `xmb/monochrome/font.ttf`, the path [R] identifies as shipped. No guest log or sharp-text frame-diff is supplied. The report instead requests an unchanged frame and a maintainer decision. That is a candid deferral, **not satisfaction of the original acceptance**. Source: [D], `LR/retroarch/patches/0017-widgets-sharp-font-sizes.patch`, especially the added face table and six `gfx_widgets_font_init` calls. |
| **PL-043 — fresh owner-only `.env`, not parse-time generation** | **Holds, at the code-mechanism level** | [D], `Makefile`, `@@ -175,5 +170,17 @@`: `rm -f .env && [ ! -e .env ] || … exit 1` prevents reuse after unlink failure; `( umask 077 && set -C && ./scripts/get_env > .env )` creates the replacement without reopening an existing regular file; the parse-time prerequisite is removed; an EXIT trap cleans up. `H:F2-3` and `F2-3b` exercise the ordinary and unremovable-old-file cases. A real-build `stat` is still an integrator confirmation, not an observation made here. |
| **PL-076 — GENERIC_X64 core-updater cfg line** | **Cannot tell from the packet** | [R] attributes resolution to F1 commit `9fd73da845`, but [D] contains no GENERIC_X64 RetroArch profile hunk. The current cfg line or F1’s diff would settle it. |

The absence of build/guest proof is not evidence that the stream disregarded its instructions: [P] prohibited those runs. It does mean those acceptance gates must remain assigned to the integrator.

## 2. First-audit findings: review of the claimed answers

“Not answered by this packet” below means **evidence is unavailable here**, not that another stream failed to implement its fix.

### Claude findings

| ID | Verdict | Diff-based assessment |
|---|---|---|
| **G-F2-01** | **Answered** | The current [D] contains the previously missing GStreamer, ryzenadj/dmidecode, woff2, and empty VirtualBox-quirk changes, as well as the zip deletion. The earlier packet-completeness problem is no longer present. This does not independently verify the cited history on `next`. |
| **G-F2-02** | **Answered in part** | 0018 caches the answer before content load through `command_record_append_config()`. This fixes deletion **after recording**. It still reopens the append files rather than recording information from the parse that supplied the effective configuration. See **G2-F2-02**. |
| **G-F2-03** | **Answered, as a static wiring check** | `H:F2-6` now reads `scripts/unpack` through `src_of` and asserts `post_unpack < patch command < post_patch`. That is materially stronger than merely invoking the hook itself. The actual `scripts/unpack` body and a build-system run remain outside this corpus. |
| **G-F2-04** | **Answered** | Every rotation invocation now has its own `|| die "…"`. `H:F2-2b` substitutes a failing `python3` and requires `die` to be reached for all five recipes. The guard no longer depends on being the last statement. |
| **G-F2-05** | **Answered in part** | Literal `#if 0`, direct `#if 1` alternative arms, and decimal digit-separator fixtures are addressed. Constant `#elif` handling and hexadecimal digit separators remain wrong. See **G2-F2-01** and **G2-F2-04**. |
| **G-F2-06** | **Answered** | `H:F2-4` folds whitespace and checks complete calls, rather than individual source lines. Its log inspection also spans complete `RARCH_LOG(…);` calls. The asserted branches now have falsifiable checks. |
| **G-F2-07** | **Answered as a scope withdrawal** | The current F2 diff contains no RetroArch profile `video_driver` change. Nothing here contradicts withdrawal from F2 ownership. The attribution to F1 cannot independently be checked. |
| **G-F2-08** | **Answered for the exact legacy block** | [D], `SA/mupen64plus-sa/mupen64plus-sa-core/scripts/start_mupen64plus.sh`, `@@ -44,6 +44,28 @@`, adds a GENERIC_X64-only repair, temporary output, nonempty check, and rename. `H:F2-5b` checks removal of precisely six lines, preservation of unrelated edits, idempotence, and no change on SM8250. |
| **G-F2-09** | **Answered in part — policy evidence missing** | The code visibly limits the exclusion to GENERIC_X64 and therefore reopens AMD64. Its comment also acknowledges the AMD64 CMake/install problem. Upstream parity and the decision not to support that image are asserted in [R], not established by an embedded upstream recipe or decision row. The withdrawal is **not refuted** by this diff, but neither does this packet prove AMD64 works. |
| **G-F2-10** | **Answered** | The missing-source branches in `H:F2-4` and `F2-6`, and the missing-gcc branch, now call `check 1` with an explanation. Missing prerequisites no longer disappear behind an aggregate pass. |
| **G-F2-11** | **Answered** | In 0018, the helper block is inserted above the pre-existing documentation for `command_event_set_savestate_auto_index`. `H:F2-4` also checks that adjacency. |
| **G-F2-12** | **Answered** | 0017 adds `gfx_widgets_sharp_tail_is()`, treating `/` and `\` alike, and accepts either separator before the suffix. `H:F2-4` includes a Windows-style path. |

### GPT findings

| ID | Verdict | Diff-based assessment |
|---|---|---|
| **G-F2-01** | **Answered** | The Makefile now checks unlink success and absence before writing, and uses noclobber. `H:F2-3b` constructs the unremovable writable-0644 case and requires unchanged old contents, no container, and failure. |
| **G-F2-02** | **Not answered by this packet** | [F] attributes the IPv4/IPv6 proxy fix to D’s `adf852a4b7`. No `cheevos_ppsspp.sh` hunk is embedded. The ownership withdrawal is not contradicted; the implementation cannot be reviewed here. |
| **G-F2-03** | **Answered for the stated ordinary-string case** | MAME now performs `STRING.sub('""', drop_dead(strip_comments(...)))` before searching for `GAME`. `H:F2-2b` includes a string containing a phantom `GAME(...)` and excludes that row from the expected result. This is not proof of a complete C/C++ lexer. |
| **G-F2-04** | **Answered for the exact legacy block** | Same repair mechanism and fixtures as Claude G-F2-08. |
| **G-F2-05** | **Answered as a test-strength improvement** | `H:F2-4` checks complete font-call wiring and compiles the Auto-slot helper with the real config parser over ten cases. A constant-true helper would fail the expected `0100001111` result. The test still does not establish that the cached answer describes the **same read** as configuration loading; see G2-F2-02. |
| **G-F2-06** | **Answered** | Same fail-closed prerequisite branches as Claude G-F2-10. |
| **G-F2-07** | **Not answered by this packet** | [F] attributes the final-rename handling to D’s `a78a72269f`. No `cheevos_armsx2.sh` hunk is embedded. |

## 3. New findings

These are **static counterexamples**, not executed reproductions. The corpus does not establish that the pinned driver trees currently contain the parser-triggering examples.

### G2-F2-01: Constant `#elif` arms can erase a live rotation row

- **Severity:** Medium
- **Category:** Correctness / source extraction regression
- **Where:** [D], `projects/ROCKNIX/packages/emulators/libretro/rotation-table-mame.py`, `@@ -1,36 +1,105 @@`, and `rotation-table-fba.py`, `@@ -1,27 +1,93 @@`; `drop_dead()` and the subsequent assignments to `out`.
- **What:** `drop_dead()` recognizes literal conditions only when opening an `#if`. Every `#elif` after a not-yet-taken branch becomes `live`, regardless of whether its expression is `0` or `1`. An `#elif 1` is not recorded as a taken branch, so its `#else` also becomes live. Combined with the newly unconditional assignment of zero rotations, this can remove a correct row.
- **Failure scenario:** A MAME driver contains:
  ```c
  #if 0
  #elif 1
  GAME(1981, choice, 0, m, i, 0, ROT90, "M", "Choice", 0)
  #else
  GAME(1981, choice, 0, m, i, 0, ROT0, "M", "Choice", 0)
  #endif
  ```
  The compiler selects ROT90, so the table should contain `choice 3`. The generator retains both declarations. The second writes zero over the first, and the final filtering omits `choice`. With at least 100 other rotated games, `--min 100` still passes.
- **Evidence:** Both copies contain:
  ```python
  elif kind == 'elif' and stack:
      stack[-1] = 'gone' if stack[-1] in ('one', 'gone') else 'live'
  ```
  The `else` transition uses the same state choice. MAME then executes:
  ```python
  out[name] = TURNS.get(rot.replace(' ', ''), 0)
  ```
  FBA similarly assigns zero before filtering it out. I looked for literal-`elif` evaluation or a “known branch already taken” transition and found neither. The shown F2-2b fixtures cover `#if 0`, nesting, and `#else`, but no `#elif`.

**Required correction:** handle literal `#elif 0` and `#elif 1` consistently with literal `#if`, preserving whether a known branch has already won. Add both constant-elif cases to each generator’s fixtures.

### G2-F2-02: Auto-slot provenance is still obtained from a second file read

- **Severity:** Medium
- **Category:** Configuration provenance / TOCTOU
- **Where:** [D], `projects/ROCKNIX/packages/emulators/libretro/retroarch/patches/0018-auto-slot-survives-content-load.patch`, outer hunk `@@ -19,54 +20,162 @@`; the added helper in `command.c` and the inner `configuration.c` hunk `@@ -4016,6 +4016,11 @@`.
- **What:** The follow-up moves the pathname-based re-read earlier, but does not capture provenance from the configuration parse itself. `config_load_file` passes a list of paths; `command_append_list_sets_auto_slot()` opens those paths again. Thus the claim that this necessarily describes the files RetroArch loaded is too strong.
- **Failure scenario:** The configuration loader reads an append file containing `state_slot = "-1"`. Before the new helper opens that path, the temporary file is removed or atomically replaced with a slot-3 file. The effective loaded configuration still contains `-1`, but the helper records false. At content load, the new guard no longer protects Auto, restoring the reset behavior this patch exists to prevent.
- **Evidence:** The hook passes no parsed config object or parsed slot provenance:
  ```c
  command_record_append_config(path_is_empty(RARCH_PATH_CONFIG_APPEND)
        ? NULL : path_get(RARCH_PATH_CONFIG_APPEND));
  ```
  The helper independently calls:
  ```c
  config_file_new_from_path_to_string(ptr)
  ```
  and initializes `is_auto` to false. The guards later require both a negative effective slot and that cached boolean. No shared read/snapshot mechanism appears in the patch. `H:F2-4` deletes its fixture **after** `command_record_append_config()`, so it proves persistence of the second read, not agreement with the original read.

**Required correction:** record the winning append-file slot provenance while processing the same parsed input that supplies the effective configuration. Add a test that changes/removes the pathname between initial loading and any attempted second read.

### G2-F2-03: GStreamer’s required-payload guards accept dangling library links

- **Severity:** Medium
- **Category:** Fail-closed guard / artifact validation
- **Where:** [D], `projects/ROCKNIX/packages/multimedia/gstreamer/gst-plugins-bad/package.mk`, `@@ -7,23 +7,42 @@`, and `gst-plugins-base/package.mk`, `@@ -81,20 +81,23 @@`; `post_makeinstall_target()`.
- **What:** The new assertions establish that a matching directory entry exists, not that the required library or plugin exists. `compgen -G` accepts dangling symlinks, and `cp -a` preserves them successfully. The hook can therefore report success while retaining no usable required payload.
- **Failure scenario:** The bad-plugin install contains only:
  ```text
  usr/lib/libgstmpegts-1.0.so -> libgstmpegts-1.0.so.0
  ```
  with the target missing. The glob matches. Both archival copies preserve the broken link, the cleanup succeeds, and no `die` fires. The resulting image still lacks the library required at load. The same pattern affects the base-library checks and a dangling `gstreamer-1.0/libgstapp.so`.
- **Evidence:** The guard is:
  ```sh
  compgen -G "${INSTALL}/usr/lib/libgstmpegts-1.0.so*" > /dev/null \
    || die ...
  ```
  followed by `cp -a`. The base hook uses the same `compgen` pattern for each required item. I looked for resolved-target or required-load-name validation and found none in these hooks. `H:F2-10` checks wholly missing payloads and regular placeholder files, not dangling links or misleading suffix matches.

**Required correction:** positively validate the required load names and their resolved file targets before declaring the payload present. Add a dangling-link refusal fixture.

### G2-F2-04: The digit-separator fix only protects separators following decimal digits

- **Severity:** Low
- **Category:** C++ lexical correctness / incomplete follow-up
- **Where:** [D], `projects/ROCKNIX/packages/emulators/libretro/rotation-table-fba.py`, `@@ -1,27 +1,93 @@`, and `rotation-table-mame.py`, `@@ -1,36 +1,105 @@`; `LEXEME`.
- **What:** `(?<![0-9])` prevents a separator after a decimal digit from opening a character literal, but a valid hexadecimal digit separator may follow `A`–`F`. Such a separator can still cause the lexer to consume a block-comment opener as part of a supposed character literal.
- **Failure scenario:** A valid C++14 source contains:
  ```cpp
  static unsigned nSep = 0xFF'00; /* old value 0xEE'00,
  struct BurnDriver BurnDrvGhost = {
      "ghost", BDF_ORIENTATION_VERTICAL
  };
  */
  ```
  The first apostrophe follows `F`, so the character-literal alternative consumes:
  ```text
  '00; /* old value 0xEE'
  ```
  That match is retained rather than removed. The comment opener is consequently never processed as a comment, and the commented driver becomes a false `ghost 1` row.
- **Evidence:** Both lexers use:
  ```python
  (?<![0-9])\'(?:\\.|[^\'\\\n])*\'
  ```
  `strip_comments()` preserves a match unless its first character is `/`. There is no numeric-token handling that would refute the scenario. `H:F2-2b` tests `1'000`/`2'000`, which cannot exercise a separator following a hexadecimal letter.

**Required correction:** distinguish numeric tokens from character literals rather than using the decimal-only predecessor test; add a hexadecimal-separator fixture.

## 4. Sweep-row spot checks

These checks assess the visible changes, not the report’s historical test results.

| Report row(s) | Spot-check result |
|---|---|
| **Claude F-PB-09 — generic GStreamer options** | **Mechanism present.** [D], `GST/gst-plugins-bad/package.mk`, replaces source-text `sed` extraction with a saved generic function, calls it, and changes the two mpegts options. `H:F2-10` contains a quoted-value fixture. The actual generic recipe is not embedded, so the reported 172-option equivalence cannot independently be confirmed. |
| **GPT F-PB-24 — required GStreamer payload** | **Partially fixed.** Silent `|| true` copies are removed and explicit absence checks are added. The guards still accept broken links: G2-F2-03. |
| **Claude F-PB-19 — attribution and ryzenadj quoting** | **Visible fix holds.** Both sysutils recipes restore the `2023 JELOS` line and add `2026-present ROCKNIX`. Ryzenadj changes to `-DCMAKE_EXE_LINKER_FLAGS=-ludev`, eliminating embedded quote characters. The separate “consumer exists” assertion depends on an unembedded image recipe. |
| **Claude F-EM-02 — ppsspp hook placement** | **Visible relocation holds.** [D], `LR/ppsspp-lr/package.mk`, `@@ -59,18 +59,17 @@`, places the atomics strip in `post_patch()` and retains unrelated work in `post_unpack()`. `H:F2-6` adds both source-order simulation and a check of the build script’s hook order. Actual patch 005 and `scripts/unpack` are unavailable here. |
| **Claude F-EM-10 — duplicated row floor** | **Guard consolidation holds.** The five copied shell functions are removed; both generators implement `--min`; each recipe supplies `--min 100` and an explicit failure handler. The floor checks quantity, not correctness of individual rows, so it does not catch G2-F2-01/04. |
| **Claude F-EM-15 / GPT F-EM-02 — GLideN64 NOHQ** | **Visible scope/separator fix holds.** [D], `SA/mupen64plus-sa/mupen64plus-sa-video-gliden64/package.mk`, `@@ -44,13 +44,16 @@`, removes the general x86_64 branch and adds `+=" -DNOHQ=On"` only for `DEVICE=GENERIC_X64`. |
| **Claude F-VM-09 — Control1 section** | **Seed and exact-shape upgrade repair present.** Six foreign lines are deleted from the seed, and the launcher now repairs the corresponding inherited block. This is a substantive improvement over a forward-only fix under [UPG]. |
| **Claude F-RW-08 / GPT F-RW-03/04 — widget placement** | **Requested mechanisms present.** 0019 logs after `divider_width_1px` is set, uses that divider in both reported pitches, and calls `gfx_widgets_msg_queue_move()` after the new metrics when messages exist. Runtime animation/thread behavior requires the complete source. |
| **Claude F-BR-10 — duplicate zip recipe** | **Deletion visible; equivalence not verifiable.** The generic recipe and patch are removed. The surviving project recipe is absent. `H:F2-13` counts recipes, but a count of one cannot establish behavioral equivalence or that `/usr/bin/zip` remains installed. [ENG] and [PKG] require those distinctions. |

### Withdrawals that can be assessed

- **F-RW-09’s split disposition is consistent with the diff:** the altered runtime log strings lose the fork issue suffixes, while fork-specific comments remain. Deferring those comments to PR preparation is visibly different from claiming they were removed.
- **Out-of-packet ownership withdrawals** for QEMU quirks, ES scaffolding, corekeep, and D’s achievement scripts are not contradicted by this F2 diff. Their fixes or ownership history cannot be positively verified here.
- **GPT F-BR-18:** the deleted zip patch visibly places `valloc();` under `#ifdef MMAP`. That supports the conditionality argument, but the stronger assertion that nothing defines `MMAP` needs the missing source/configuration.
- **F-EM-06, F-PB-20, and GPT F-PB-23:** the reported refutations depend respectively on the ES consumer, environment-variable consumers, and extraction callers. Those implementations are not embedded; I cannot endorse the refutations from the report alone.

## 5. Seams

| Seam | Assumptions and assessment |
|---|---|
| **Shared harness** | F2 correctly places one block before the final aggregate result and calls shared `check`. It depends on existing `src_of`, `OLD`, `BASE_REF`, `FAIL`, and the image-BusyBox setup. Those definitions and other streams’ blocks are absent. It also uses unprefixed globals such as `FX`, `GX`, `L`, `g`, and `a`; no collision can be established without the merged harness. Review the final assembled file, not each block’s isolated pass. |
| **F1’s GLideN64/profile work** | [R] identifies another F1 change in the GLideN64 recipe and attributes PL-076/profile work to F1. F2’s device-specific NOHQ setting is clear, but the other side is absent. The merged recipe and actual profile must be checked; F2’s report cannot close the seam. |
| **Rotation recipes → build stamps → ES** | The generators retain `<romname> <turns>` output and the recipes retain installation under `/usr/config/emulationstation/rotation`. New stamp inputs address warm builds. Whether the build framework hashes them as intended, and whether the ES consumer bypasses inherited stale state as reported, needs the missing producer/consumer implementations. |
| **Launcher append config → RetroArch Auto slot** | The patch assumes the launch request is a negative slot in the winning append file, not a saved main-config value. The helper tests that policy in isolation. Agreement with the effective configuration still requires eliminating the second-read mismatch in G2-F2-02 and checking the launcher’s file lifetime. |
| **GStreamer overrides → generic hook → WebKit** | The override assumes the generic hook is already defined and produces the expected option names. The retained library/plugin set must match WebKit’s actual needs. Neither the generic hook nor WebKit’s load dependencies is embedded; the visible presence checks additionally have G2-F2-03’s weakness. |
| **Zip deletion → package resolution → backup tools** | The deletion assumes the project recipe wins resolution and provides equivalent runtime payload. That surviving recipe and the final image artifact are needed before the duplicate-deletion argument is complete. |
| **Player-facing outcome vocabulary** | The added F2 strings are build diagnostics or RetroArch diagnostic logs, not the cloud cards/transfer outcomes governed by [TEXT]. I found no basis to treat those developer messages as vocabulary violations. No proxy/card or Wi-Fi/picker interface changes are present to assess. |

## 6. Coverage boundary and orchestrator handoff

The following remain outside what this corpus can establish:

1. **Build integration:** `config/functions`, `scripts/build`, `scripts/unpack`, and `scripts/get_env`; real stamp invalidation, package builds, and live `.env` mode.
2. **RetroArch integration:** the complete pinned source, complete patch series, actual application/fuzz results, linked target builds, configuration-parser merging semantics, and guest behavior. The changed tests are inspectable; their reported execution is not independently reproduced.
3. **Visual acceptance:** actual shipped profiles, font files, `font-stems` output, guest logs, and frame-diffs. PL-032 needs its original acceptance met or an explicit maintainer-approved replacement—not silent substitution with “unchanged.”
4. **Upgrade coverage:** the exact-block Mupen repair has useful local fixtures. No VM upgrade-rehearsal seed or interruption proof is supplied. The integrator should include the inherited malformed configuration in the rehearsal required by [UPG].
5. **Deleted/reused package behavior:** the surviving zip recipe, generic GStreamer recipes, upstream AMD64 recipes, and resulting image payloads.
6. **Cross-stream closure:** F1’s profile/GLideN64 changes, D’s two attributed fixes, and ES consumer changes.
7. **Policy authority beyond the corpus:** cited decision-register rows and `packages/README.md` are not embedded. The latter is expressly authoritative over the supplied packaging-rule subset.

**Recommended handoff:** correct the four source-derived issues; retain PL-002’s warm-build proof and PL-032’s visual/decision gate; obtain the missing F1/D artifacts before closing their attributed findings. The existing report is useful evidence of intended work, but is not a substitute for those artifacts under [ENG].

## `corpus.provenance.json`

The following is the provenance artifact’s content; no file creation is claimed.

```json
{
  "packet": "F2",
  "review_basis": "embedded_text_only",
  "citation_keys_in_array_order": [
    "D",
    "R",
    "F",
    "I",
    "P",
    "ENG",
    "UPG",
    "TEXT",
    "PKG"
  ],
  "source_file_paths": [
    "docs/audits/2026_09_28-milestone-audit-of-the-fix-round/seats/F2.diff",
    "docs/audits/2026_09_28-milestone-audit-of-the-fix-round/seats/F2.report.md",
    "docs/audits/2026_09_28-milestone-audit-of-the-fix-round/seats/F2.findings.md",
    "docs/audits/2026_09_28-milestone-audit-of-the-fix-round/seats/F2.items.md",
    "docs/audits/2026_09_28-milestone-audit-of-the-fix-round/seats/F2.plan.md",
    ".claude/rules/engineering-practices.md",
    ".claude/rules/upgrade-and-install.md",
    ".claude/rules/es-player-text.md",
    ".claude/rules/packaging-and-patches.md"
  ],
  "source_file_hashes": [
    "f6e7b0018aa5441dd62433fcd1713e71718ac1ddae21b43584534696e2af6e78",
    "2feee2db6d31143792c1bccdce0b97c51cca20e699343b8b3e92fdeacdffb5a7",
    "180feb76fa6cc03933ce76ffb4b0e2a1b49ad610f8cd3ab599e8304860da9e2c",
    "afc3ec97a5181ede1d4bdf032a6df5048d8ea258871164cc113404e2fbf96a02",
    "80830e921e97d803de7227fe40ff6539ede05f5796e870263e6af21b5ce2c731",
    "7f1eb012edc986ee2975abacb44f1a662f2a111a6ded1a1a623a84af509eef7d",
    "d79a1084e85117ba566d23af7fbf3633c44290a6c490f9125e1fd9df061f8cfd",
    "c401103eba4ada9d0e757a2b8522e7ed9558a17eb4da72b65615795163f33c86",
    "2a44db10f4f179198b9366239eabe0900e1701145beced181536eb18bcbc0746"
  ],
  "arrays_are_parallel": true,
  "hash_algorithm": "sha256",
  "hash_verification_authority": "Council Facilitator; verified at embed time",
  "facilitator_manifest_read_timestamp_utc": "2026-09-28T13:57:25Z",
  "auditor_filesystem_access": false,
  "auditor_re_read_source_files": false,
  "auditor_recomputed_hashes": false,
  "commands_executed": [],
  "unembedded_evidence_needed": [
    "config/functions, scripts/build, scripts/unpack, and scripts/get_env implementations",
    "Complete tools/last-good-scripts-test, shared helper definitions, other streams' blocks, and image-BusyBox setup",
    "Pinned emulator source trees and the complete RetroArch source and patch series",
    "RetroArch configuration-loading implementation and the launcher's append-config lifetime",
    "Actual shipped RetroArch profiles, font artifacts, font-stems measurements, guest logs, and frame-diffs",
    "Generic GStreamer recipes, WebKit load dependencies, and resulting installed library/plugin artifacts",
    "projects/ROCKNIX/packages/compress/zip/package.mk and final image zip payload",
    "F1 and D implementation diffs for attributed fixes, and the ES rotation consumer",
    "VM upgrade-rehearsal coverage for the inherited Mupen configuration",
    "docs/decision-register.md and packages/README.md"
  ],
  "limitations": [
    "Report and findings outcomes are author claims, not independent execution evidence.",
    "Code citations identify target-file hunks within the embedded F2.diff, not separately accessed target files.",
    "Counterexamples are derived by static analysis and were not executed.",
    "The corpus does not establish whether the pinned driver trees contain the parser-triggering examples."
  ]
}
```