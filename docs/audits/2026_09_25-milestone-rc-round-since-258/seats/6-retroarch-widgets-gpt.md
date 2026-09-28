## Summary

This bucket adds video-thread mailbox fixes, widget sizing and placement changes, preservation of the configured Auto save slot, and new GENERIC_X64 defaults. The patch stack has a concrete inconsistency: `0016` now defines a 13-pixel floor, but `0017` still requires the old 14-pixel definition as application context. The x64 configuration also carries an ARM core-updater URL, although the updater is hidden by default and the configuration reader is outside the packet. The placement patch explicitly leaves a startup window in which an existing notification retains its previous position until another message arrives. No Critical or High defect is established by these hunks, but patch application, runtime concurrency, and upgrade behavior remain unverified.

## Findings

All **Where** entries identify hunks inside embedded source **S1**, not additional files independently read. Source IDs S1–S4 resolve to the exact paths and Facilitator-verified hashes in `corpus.provenance.json` below.

### F-RW-01: The font-floor change leaves the next patch with stale application context
- **Severity:** Medium
- **Category:** Build/packaging
- **Where:**
  - `projects/ROCKNIX/packages/emulators/libretro/retroarch/patches/0016-widgets-message-queue-floor.patch`: `gfx/gfx_widgets.c` hunk `@@ -44,6 +44,15 @@`
  - `projects/ROCKNIX/packages/emulators/libretro/retroarch/patches/0017-widgets-sharp-font-sizes.patch`: `gfx/gfx_widgets.c` hunk `@@ -53,6 +53,46 @@`
- **What:** `0017` has not been regenerated against the revised output of `0016`. Its first hunk requires both an obsolete comment and the obsolete 14-pixel definition.
- **Failure scenario:** Apply `0016`, then apply `0017` without context fuzz: the latter’s first hunk does not match the shown predecessor output. A permissive patcher may accept it by discarding the mismatching context; the actual build’s patch policy is outside the packet.
- **Evidence:** S1 shows `0016` adding `#define MSG_QUEUE_MIN_SIZE  13.0f` and a comment ending `#251; 14 until #296`. The corresponding context in `0017` still reads `#define MSG_QUEUE_MIN_SIZE  14.0f` and the earlier `#251` comment. **Refutation attempted:** checked whether `0017` intentionally changes that definition; these are context lines, not a removal/addition. Fuzzy application is a possible explanation for successful builds, not evidence that the patches agree.
- **Fix:** Regenerate `0017` against the intended floor and preceding patch stack; reconcile the stale 14-pixel descriptions in both patches. Verify the complete numbered stack against the pinned source without context fuzz, then build it.
- **Confidence:** high — the conflicting predecessor output and required context are both embedded; this does not establish that the normal build currently fails.

### F-RW-02: The x64 profile contains an ARM core-updater endpoint
- **Severity:** Medium
- **Category:** Build/packaging
- **Where:**
  - `projects/ROCKNIX/packages/emulators/libretro/retroarch/sources/GENERIC_X64/retroarch.cfg`: hunk `@@ -0,0 +1,856 @@`, `core_updater_buildbot_url`
  - `projects/ROCKNIX/packages/emulators/libretro/retroarch/sources/GENERIC_X64/retroarch64bit-append.cfg`: lines 1–2
- **What:** The new GENERIC_X64 configuration specifies an `armhf` core-download endpoint. Whether this legacy-looking setting is consumed by the candidate is outside the packet, so this is an architecture-inconsistent configuration risk rather than a demonstrated failed download.
- **Failure scenario:** An x86-64 installation enables the core updater and its reader honors this setting → it selects the ARMhf index rather than a native-core index.
- **Evidence:** S1 contains `core_updater_buildbot_url = "http://buildbot.libretro.com/nightly/linux/armhf/latest/"`. **Refutation attempted:** the supplied 64-bit append file overrides only audio/video filter directories. `menu_show_core_updater = "false"` limits normal exposure, and `core_updater_buildbot_cores_url = ""` makes reader precedence important; neither demonstrates a correcting endpoint.
- **Fix:** Check the candidate’s actual configuration reader. Remove this key if unsupported or unused; otherwise supply the appropriate architecture-specific endpoint and verify the effective updater configuration on GENERIC_X64.
- **Confidence:** medium — the architecture mismatch is explicit, but key recognition, precedence, and updater availability are outside the packet.

### F-RW-03: A notification can retain its old position after startup relayout
- **Severity:** Medium
- **Category:** Correctness
- **Where:**
  - `projects/ROCKNIX/packages/emulators/libretro/retroarch/patches/0019-widgets-message-queue-keeps-its-place.patch`: `gfx/gfx_widgets.c` hunk `@@ -1080,6 +1101,18 @@`
  - `projects/ROCKNIX/packages/emulators/libretro/retroarch/patches/0014-widgets-backdrop-follows-the-font.patch`: `gfx/gfx_widgets.c` hunks `@@ -876,6 +915,48 @@` and `@@ -943,6 +1024,22 @@`
- **What:** The placement patch explicitly preserves a window in which an on-screen message retains the first layout’s position after the second layout changes its margin. The added live-message refresh updates width and text height, not the existing vertical placement.
- **Failure scenario:** A notification enters the display between the two startup layouts → it remains one pixel away from the intended position until another message triggers placement, then moves.
- **Evidence:** S1 assigns `msg_queue_bottom_margin = msg_queue_rect_start_x`, but its accompanying comment says a message between passes “sits a pixel off until the next re-places it.” The added measurement helper assigns only `msg->width` and `msg->text_height`. **Refutation attempted:** checked the added current-message refresh for offset correction; it only calls that measurement helper. The complete placement call graph is outside the packet, so this finding is limited to the startup case expressly acknowledged by the patch—not an asserted larger resize regression.
- **Fix:** Recompute active-message positions after the new layout metrics are established, with appropriate synchronization and animation-target updates. Verify a message inserted between startup layouts reaches the correct margin without requiring another notification.
- **Confidence:** medium — the residual case is explicitly documented and consistent with the added code, but no runtime capture or complete caller sequence is embedded.

### F-RW-04: The placement diagnostic reports the wrong pitch at larger scales
- **Severity:** Low
- **Category:** Documentation
- **Where:**
  - `projects/ROCKNIX/packages/emulators/libretro/retroarch/patches/0019-widgets-message-queue-keeps-its-place.patch`: `gfx/gfx_widgets.c` hunks `@@ -623,12 +624,26 @@` and `@@ -1080,6 +1101,18 @@`
  - `projects/ROCKNIX/packages/emulators/libretro/retroarch/patches/0014-widgets-backdrop-follows-the-font.patch`: `gfx/gfx_widgets.c` hunk `@@ -943,6 +1024,22 @@`
- **What:** The new diagnostic always reports small-message pitch as half the queue height plus one pixel, while placement uses the actual divider width. It therefore cannot reliably describe the geometry at larger widget scales.
- **Failure scenario:** With `last_scale_factor = 2.0`, the divider becomes two pixels. Consecutive small boxes have pitch `(msg_queue_height / 2) + 2`, but the diagnostic reports `(msg_queue_height / 2) + 1`.
- **Evidence:** S1’s placement loop adds `floor(p_dispwidget->divider_width_1px)`, while the log argument is `p_dispwidget->msg_queue_height / 2 + 1`. The visible divider calculation uses `(unsigned)(last_scale_factor + 0.5f)` above scale 1. **Refutation attempted:** the one-pixel-divider case is correct; the explicit larger-scale branch defeats the assumption that the divider is always one.
- **Fix:** Emit the diagnostic after divider initialization and derive its small-box pitch from the same box/divider calculation used for placement.
- **Confidence:** high — the contradictory arithmetic is visible in the embedded hunks.

## Upstream fit

- **Separate shared RetroArch changes from distribution policy.** The mailbox patches and Auto-slot behavior change belong in separately reviewable RetroArch submissions. The Ozone multiplier, font floor, measured sharp-size tables, and margin preference are distribution policy and need their own justification across supported configurations. Combining them with a large GENERIC_X64 defaults snapshot obscures those decisions.
- **Regenerate the patch stack rather than relying on permissive application.** S4’s *Generating patches* section establishes that package patches apply automatically after unpack. F-RW-01 should be resolved before upstream review, with an application/build record against the actual recipe pin.
- **Establish which font configuration the measurements cover.** The new GENERIC_X64 configuration supplies `video_font_path = "/usr/share/retroarch-assets/xmb/monochrome/font.ttf"`. In `0017`, the user-supplied-font branch passes `NULL, 0` for every sharp-size table, and the helper immediately returns unchanged when the table is null. A run using that branch does not exercise the bundled-font tables. Effective launcher overrides and font contents are needed before treating one configuration’s images as evidence for another.
- **Trim historical patch commentary.** “Eighth cut,” earlier-cut comparisons, dated measurements, and fork issue numbers dominate some patch descriptions. Preserve the failure mechanism and useful reproduction evidence, but move iterative development history into supporting records. The stale 14-pixel prose should be corrected with F-RW-01.
- **No credential or copyright violation is demonstrated.** The supplied credential/token fields are empty; author attribution and a username in a reproduced toast are not credentials. There is no `package.mk` edit here, so S4’s package-header and required-field rules do not establish a missing-header finding for these configuration files.

## Coverage boundary

This was a static review of the four embedded sources. No filesystem access, patch application, build, re-hashing, or runtime test was performed. In accordance with S2, fixture results described in patch prose are not treated as independently reproduced evidence.

The following gaps are surfaced to the orchestrator:

- **Patch/build integration:** The owning RetroArch recipe, pinned full source, earlier patches, patch-application policy, and build output were not embedded. Full stack applicability and compilation cannot be established.
- **Concurrency:** Complete mailbox send/reply functions, callers, lock ordering, allocation-failure cleanup, and shutdown sequencing are absent. The two patches address distinct stated mechanisms, but their fixture sources/results and concurrent screenshot/badge/reinitialization tests are not available.
- **Auto-slot integration:** The two guards are visible. Launcher code, initialization and later application of `entry_state_slot`, and sequential content loads within one RetroArch process are outside the packet. Despite the bucket description, no launcher implementation is embedded.
- **Existing state and clean installation:** S3 requires both paths to be checked. The Auto-slot patch addresses an already-written artifact by declining to restore a remembered numbered slot over configured Auto; it does not require deleting that old record. For the new GENERIC_X64 configuration files, installation/seeding behavior and treatment of an existing persistent configuration are unknown. Previous-image upgrade and fresh-image evidence are needed.
- **Fonts, layout, and input:** Font assets, the referenced measurement utility/results, effective device configuration, and QA captures are absent. Small-panel readability, custom/CJK fonts, reset-time placement, actual TATE remap loading, and controller behavior remain unverified. Core-option implementations are also absent, so option names alone were not used to infer their effects.
- **Remaining conformance:** The blindspot register and the authoritative packaging reference mentioned by S4 were not embedded. Their conformance checks remain open, not silently passed.

### `corpus.provenance.json`

Rendered for the orchestrator to save; no file was written. Arrays correspond positionally to S1–S4.

```json
{
  "review_basis": "Facilitator-embedded verbatim source corpus",
  "source_ids_in_array_order": ["S1", "S2", "S3", "S4"],
  "source_file_paths": [
    "/workspace/repos/rocknix/docs/audits/2026_09_25-milestone-rc-round-since-258/seats/6-retroarch-widgets.diff",
    "/workspace/repos/rocknix/.claude/skills/code-auditor/references/anti-patterns.md",
    "/workspace/repos/rocknix/.claude/rules/upgrade-and-install.md",
    "/workspace/repos/rocknix/.claude/rules/packaging-and-patches.md"
  ],
  "source_file_hashes": [
    "b608dff3f720b174e7474baa10528a1b9c852006d3c4360d3f8df6bf3ceb95eb",
    "fd825c0505ae772ca2a6651eefe642581aaa147c254fed8cf50db1f8f1bde678",
    "de4a683f9a36f9100e6fd98be11ad84d736f370374c40f74c445a2b81eca1995",
    "2a44db10f4f179198b9366239eabe0900e1701145beced181536eb18bcbc0746"
  ],
  "hash_algorithm": "sha256",
  "hash_verification": "Verified at embed time by the Council Facilitator; not recomputed by this reviewer",
  "facilitator_manifest_read_timestamp_utc": "2026-09-27T22:58:44Z",
  "independent_filesystem_read": false,
  "independent_hash_verification": false,
  "runtime_tests_executed": false,
  "missing_sources_or_evidence": [
    "Full pinned RetroArch source, owning recipe, preceding patches, and patch/build records",
    "Mailbox fixture sources/results and complete concurrency/lifecycle callers",
    "Launcher implementation and complete Auto-slot initialization/application flow",
    "Configuration installation/seeding logic and clean-install/upgrade results",
    "Font assets, measurement results, effective device settings, and QA captures",
    "Core-option implementations and TATE remap consumers",
    "Blindspot register and authoritative packaging reference"
  ]
}
```