## Summary

This bucket adds arcade rotation tables, architecture-specific packaging changes, and standalone RetroAchievements configuration fixes. It is not ready for unqualified upstream approval: changes to the shared rotation generators can leave successful incremental builds shipping stale tables. The generators also interpret comments as driver data, creating a supported route to incorrect rotation entries. ARMSX2’s token cleanup does not cover every layout the previous writer could leave behind, while the GLideN64 workaround disables high-resolution texture support beyond the fork’s VM device. This review covers the embedded diff only; no filesystem access, independent hashing, builds, or runtime tests were performed.

Source references **S1–S5** identify the declared path/hash pairs recorded in `corpus.provenance.json` under **Coverage boundary**.

## Findings

### F-EM-01: Shared rotation generators are outside their consumers’ rebuild stamps
- **Severity:** High
- **Category:** Build/packaging
- **Where:**
  - `projects/ROCKNIX/packages/emulators/libretro/fbalpha2012-lr/package.mk`: hunk `@@ -7,13 +7,40 @@`
  - `projects/ROCKNIX/packages/emulators/libretro/fbalpha2019-lr/package.mk`: hunk `@@ -7,14 +7,41 @@`
  - `projects/ROCKNIX/packages/emulators/libretro/fbneo-lr/package.mk`: hunk `@@ -21,7 +24,32 @@`
  - `projects/ROCKNIX/packages/emulators/libretro/mame2003-plus-lr/package.mk`: hunk `@@ -7,10 +7,37 @@`
  - `projects/ROCKNIX/packages/emulators/libretro/mame2010-lr/package.mk`: hunk `@@ -22,7 +25,31 @@`
- **What:** The recipes consume generators outside their package directories without adding the documented stamp dependency. The added comments explicitly substitute manual cleaning for automatic invalidation.
- **Failure scenario:** Build the packages, change only a shared generator, then perform an incremental image build without manually cleaning its consumers. Their existing stamps remain valid, so the build can succeed with tables produced by the previous generator.
- **Evidence:** S1 states that changing a generator “does not move this package’s stamp” and instructs maintainers to “clean these packages by hand.” The invocations use `${PKG_DIR}/../rotation-table-*.py`. I looked for an added dependency covering those files; none appears in the changes. `Python3:host` supplies the interpreter, and the row check only runs when installation runs—neither addresses this dependency. S5’s **Universal Build Option** table documents `PKG_NEED_UNPACK` specifically for including external files in stamp calculation.
- **Fix:** Add each shared generator to the corresponding recipes’ `PKG_NEED_UNPACK`: the FBA generator for the three FBA/FBNeo packages and the MAME generator for the two MAME packages. Verify that changing only a generator invalidates every affected consumer and updates the installed tables without manual cleaning.
- **Confidence:** high — the missing invalidation is explicitly acknowledged in the added comments, and the supplied package reference provides the automatic mechanism.

### F-EM-02: The VM build workaround disables high-resolution textures on AMD64 too
- **Severity:** Medium
- **Category:** Upstream fit
- **Where:**
  - `projects/ROCKNIX/packages/emulators/standalone/mupen64plus-sa/mupen64plus-sa-video-gliden64/package.mk`: hunk `@@ -44,6 +44,11 @@`
- **What:** The new `NOHQ` override is selected by `TARGET_ARCH=x86_64`, not by `DEVICE=GENERIC_X64`. It therefore imposes the documented high-resolution texture-module removal on upstream AMD64 builds as well as the fork’s QA VM.
- **Failure scenario:** An AMD64 player using GLideN64 high-resolution texture packs upgrades to a build made with this recipe. The new configuration forcibly disables the module those packs require.
- **Evidence:** S1 adds `x86_64)` followed by `PKG_MAKE_OPTS_TARGET+="-DNOHQ=On"`. Its comment explicitly identifies this as disabling “the GLideNHQ hi-res texture module” because of GCC-15 issues. I checked for a `GENERIC_X64` restriction or a feature-preserving alternative in the new branch; neither is present.
- **Fix:** Fix the module’s compiler compatibility for supported AMD64 builds. If disabling it is an intentional VM-only compromise, scope that opt-out to `GENERIC_X64` rather than all x86_64 devices, and verify AMD64 with the module enabled.
- **Confidence:** high — the architecture-wide scope and intended feature removal are explicit in the diff; the binary-level result was not tested.

### F-EM-03: Legacy duplicate achievement sections still accumulate tokens
- **Severity:** Medium
- **Category:** Upgrade path
- **Where:**
  - `projects/ROCKNIX/packages/emulators/standalone/armsx2-sa/scripts/cheevos_armsx2.sh`: hunks `@@ -45,7 +45,6 @@` and `@@ -87,3 +80,19 @@`
- **What:** The cleanup removes duplicate keys within a single achievement section but does not correctly handle consecutive `[Achievements]` sections. That layout can be produced by the removed writer, which appended a header without inspecting the token file’s existing sections.
- **Failure scenario:** Consider an inherited token file containing:
  ```ini
  [Achievements]
  Token =
  [Achievements]
  Token = old
  ```
  The deletion range ends on the second header, leaving its old token untouched. The next command inserts a new token after both headers; subsequent launches keep adding tokens to the second section.
- **Evidence:** S1 removes the unconditional token-file append `sed -i "\$a [Achievements]\nToken = ${token}" ...`. The replacement uses `/^\[Achievements\]/,/^\[/` for deletion, then inserts after every matching header. A range’s terminating header is not simultaneously reconsidered as a new range’s start. I checked the repaired seed-line match: `^Token *=` does cover `Token =`, but it does not resolve this adjacent-header case. The diff says duplicate tokens are harmless to the reader; this finding concerns incomplete, non-idempotent cleanup, not a demonstrated authentication failure. S3 requires fixes to account for already-written data.
- **Fix:** Normalize the achievement sections with a section-aware rewrite that produces one authoritative token, preserves unrelated settings, and publishes the result atomically. Add an image-BusyBox fixture for consecutive duplicate headers and verify that repeated runs leave the file unchanged.
- **Confidence:** high — both the older append operation and the new range/insertion behavior are visible; no claim is made about how many devices have this layout.

### F-EM-04: Rotation extraction treats commented source as live driver data
- **Severity:** Medium
- **Category:** Correctness
- **Where:**
  - `projects/ROCKNIX/packages/emulators/libretro/rotation-table-fba.py`: lines 8–24
  - `projects/ROCKNIX/packages/emulators/libretro/rotation-table-mame.py`: lines 16–33
- **What:** Both generators inspect raw source text without excluding comments. Commented declarations or orientation flags can therefore produce nonzero rotation entries for games whose active declaration requests no rotation.
- **Failure scenario:** This illustrative MAME fixture—not an observed pinned driver—would produce `demo 3` despite the active declaration using `ROT0`:
  ```c
  /* GAME(1990, demo, 0, m, i, 0, ROT90, "M", "Old", 0) */
  GAME(1990, demo, 0, m, i, 0, ROT0, "M", "Demo", 0)
  ```
  The commented macro populates `out`; the active zero-turn declaration does not remove it. In the FBA parser, an orientation flag mentioned in a comment inside a driver body is likewise treated as an active flag.
- **Evidence:** S1’s MAME generator runs `re.finditer(r'\bGAME[A-Z]*\s*\(', text)` directly on file contents and only assigns entries under `if turns:`. The FBA generator tests `'BDF_ORIENTATION_VERTICAL' in body` and `'BDF_ORIENTATION_FLIPPED' in body`. I looked for comment filtering or validation against active driver data; neither appears. The recipes’ minimum row count cannot detect a wrong individual entry.
- **Fix:** Exclude C/C++ comments using lexical handling that preserves string literals, and inspect the actual orientation field rather than unrestricted driver-body text. Add fixtures for commented macros, commented flags, and a commented rotated declaration followed by a live `ROT0` declaration; compare generated entries against the pinned cores’ active driver data.
- **Confidence:** medium — the parser failure follows directly from the supplied code, but the pinned driver trees were not embedded, so its occurrence in the candidate’s actual tables is unverified.

### F-EM-05: The no-section token branch cannot initialize an empty file
- **Severity:** Medium
- **Category:** Correctness
- **Where:**
  - `projects/ROCKNIX/packages/emulators/standalone/armsx2-sa/scripts/cheevos_armsx2.sh`: hunk `@@ -87,3 +80,19 @@`
- **What:** When no achievement header exists, the new branch relies on `sed`’s `$a` command to create it. That command does nothing to a zero-length file because there is no input line on which its address can match.
- **Failure scenario:** A zero-length `${ARMSX2_TOKEN}` reaches this block after interrupted initialization or restoration. `grep` finds no header; `sed` can return success while leaving the file empty, so no token is written.
- **Evidence:** S1 adds:
  ```sh
  if ! grep -qFx "[Achievements]" ${ARMSX2_TOKEN} 2>/dev/null; then
      sed -i "\$a [Achievements]\nToken = ${token}" ${ARMSX2_TOKEN}
  ```
  I looked for explicit file initialization or a post-write check in the added branch; neither is present. The stated shipped seed contains a header, which limits this finding to other input states. Earlier initialization is outside the packet.
- **Fix:** Explicitly create or append the section using a checked write that also handles an empty file, preserving appropriate secret-file permissions. Alternatively, cover empty and missing files in the section-aware rewrite requested in F-EM-03. Test both states under the image’s BusyBox.
- **Confidence:** medium — the empty-file behavior is clear, but the complete launcher and preceding initialization are not supplied.

### F-EM-06: New shared generators lack file-level license attribution
- **Severity:** Low
- **Category:** Upstream fit
- **Where:**
  - `projects/ROCKNIX/packages/emulators/libretro/rotation-table-fba.py`: complete new-file hunk, lines 1–27
  - `projects/ROCKNIX/packages/emulators/libretro/rotation-table-mame.py`: complete new-file hunk, lines 1–36
- **What:** Neither new source file identifies its license or copyright holder. This leaves attribution for the newly contributed helpers unspecified within the files.
- **Failure scenario:** none demonstrated; this is an upstream source-attribution gap, not a demonstrated license incompatibility.
- **Evidence:** S1 includes both files in full. They contain a shebang, explanatory comments, and implementation, but no SPDX identifier or copyright attribution; there is no omitted file prefix that could supply it.
- **Fix:** Add the correct project-approved SPDX identifier and copyright attribution, preserving any applicable upstream credits rather than guessing ownership.
- **Confidence:** high — both complete new files are visible.

## Upstream fit

- **Separate the review topics.** Rotation metadata, standalone achievement integration, ARM package restrictions, and `GENERIC_X64` build support are independently reviewable changes. The net diff does not expose commit structure, so actual commit hygiene cannot be judged.
- **Make fork-only integration explicit.** The `GENERIC_X64` patch selection and device handling should accompany an accepted upstream device/QA plan. PPSSPP’s `offlineproxy` setting and hard-coded loopback endpoint require coordinated review with the service, settings writer, and emulator implementation, none of which is supplied here.
- **Do not present feature removal as merely a build fix.** F-EM-02 changes AMD64 capabilities. Likewise, the ARM-only package restrictions need actual supported-target build evidence; historical failure descriptions in comments are not build results.
- **Make rationale self-contained.** Fork audit identifiers and historical merge references can supplement, but should not replace, explanations usable by an upstream maintainer. The new helpers also need the attribution addressed in F-EM-06.
- No literal achievement credentials or personal home-directory paths are visible in this bucket. The token variables are references to runtime secrets, not embedded secret values.

## Coverage boundary

All **21 distribution-file changes** were reviewed as embedded diff material. Existing files were not supplied in full; only the two newly added generators are complete implementation files. There is no EmulationStation diff in this bucket.

**The orchestrator needs to supply or obtain the following before closing the remaining gaps:**

- **Build lifecycle and results.** Full recipes, relevant patches, `scripts/unpack`, and stamp-calculation implementation are outside the packet. In particular, PPSSPP-lr attributes `-mno-outline-atomics` to patches 005/006 but deletes it in `post_unpack`; the actual runner is needed to establish whether that deletion occurs after those patches. I have not promoted hook-order uncertainty into a demonstrated defect. The `tools/pkgcheck` results required by S4/S5 and cold-build results for affected architectures were not embedded.
- **Rotation correctness and upgrade consumption.** The pinned driver trees, resulting tables, core rotation implementations, and EmulationStation consumer are absent. Consequently, exact mappings, build-conditional driver selection, delivery of updated tables to existing installations, and treatment of previously written rotation records remain unverified.
- **Achievement initialization and runtime behavior.** Complete launchers, seed files, `get_setting`, PPSSPP’s `AchievementsHost` implementation, and RAOfflineProxy are outside the packet. S3 requires clean-install and upgrade checks under device tools. Those should cover legacy/new unofficial keys, duplicate and empty token files, offline-proxy availability, hardcore values `0`/`1`/unset, and clearing a restored PPSSPP host override.
- **Remaining project conformance.** The blindspot register and any additional matching instruction files were not embedded; their paths were not supplied. Conformance is therefore limited to S2–S5. Following S2, missing primary artifacts and test results are recorded as gaps, not assumed passes.

### `corpus.provenance.json`

Inline artifact only; no filesystem file was created. The source IDs, paths, and hashes correspond positionally.

```json
{
  "source_ids": [
    "S1",
    "S2",
    "S3",
    "S4",
    "S5"
  ],
  "source_file_paths": [
    "/workspace/repos/rocknix/docs/audits/2026_09_25-milestone-rc-round-since-258/seats/9-emulators.diff",
    "/workspace/repos/rocknix/.claude/skills/code-auditor/references/anti-patterns.md",
    "/workspace/repos/rocknix/.claude/rules/upgrade-and-install.md",
    "/workspace/repos/rocknix/.claude/rules/packaging-and-patches.md",
    "/workspace/repos/rocknix/packages/README.md"
  ],
  "source_file_hashes": [
    "83352acbb289dc4abcce3e496b8bf930c30c277b1273747842977c57a2d435b1",
    "fd825c0505ae772ca2a6651eefe642581aaa147c254fed8cf50db1f8f1bde678",
    "de4a683f9a36f9100e6fd98be11ad84d736f370374c40f74c445a2b81eca1995",
    "2a44db10f4f179198b9366239eabe0900e1701145beced181536eb18bcbc0746",
    "db3a14de71c3ec3f52db77ac2f7a6f6b75d58f007c977de19fe116ae93b81742"
  ],
  "hash_algorithm": "sha256",
  "hash_verification": "Verified at embed time by the Council Facilitator; not independently recomputed by this auditor.",
  "manifest_read_timestamp_utc": "2026-09-27T22:58:44Z",
  "read_mode": "Embedded read-at-time corpus only",
  "independent_filesystem_access": false,
  "checks_executed": [],
  "missing_sources": [
    "Complete existing recipes and achievement scripts, seed files, settings helper, build lifecycle implementation, and referenced patch contents.",
    "Pinned emulator driver trees and rotation implementations, generated tables, and the EmulationStation rotation consumer.",
    "PPSSPP achievement-host implementation and RAOfflineProxy service integration.",
    "Package lint results, cold-build results, and image-BusyBox clean-install and upgrade test evidence.",
    "Project blindspot register and any additional matching instruction files; their paths were not supplied."
  ]
}
```