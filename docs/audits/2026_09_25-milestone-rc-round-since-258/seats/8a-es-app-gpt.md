# Summary

This packet changes cloud setup and transfers, save synchronization, restore recovery, Wi-Fi management, scraping, and screenshot presentation. The changes are not ready for approval: settings-restore continuation loses the selected content and systems, content selection still interpolates identifiers into shell commands, and asynchronous save capture has no ordering barrier against another launch. Other directly traceable defects affect first-time setup, restore-marker consumption, rotation records, and screenshot-cache invalidation. Supporting scripts and several application/core implementations are outside the packet, so downstream consequences that depend on them are explicitly bounded below. This is a static review of the embedded corpus; I did not reread files, recompute hashes, build, or run tests.

Citations **[S1]–[S6]** identify the exact paths and Facilitator-verified hashes recorded in `corpus.provenance.json` under **Coverage boundary**; code locations are target-file hunks inside S1, not additional files read.

# Findings

### F-ES-01: Settings restore loses the selected continuation
- **Severity:** High
- **Category:** Correctness
- **Where:** `es-app/src/guis/GuiMenu.cpp:@@ -3836,120 +3996,1451 @@` — `cloudOpenTransfer`, settings-restore branch [S1]  
  `es-app/src/main.cpp:@@ -671,9 +927,141 @@` — `journeyPending` continuation [S1]
- **What:** The settings-first branch promises to restore whatever else the player selected after restarting, but the restart continuation does not consume those selections. It constructs an unconditional content `--all` restore followed by a saves restore.
- **Failure scenario:** Select SETTINGS and GAME CONTENT, leave ROMS AND BIOS unticked, and choose one system. After restarting, accepting the continuation invokes `cloud_content_restore --all`, without `--media-only` or `--selected`.
- **Evidence:** The first branch runs `backuptool restore --then-cloud --no-restart`; main subsequently constructs `cloud_content_restore --all` and `cloud_restore --yes`. Refutation attempted: checked the continuation for reads of `cloudsync.pick.*`, the selected-system file, or a selection payload in the marker; none appears.
- **Fix:** Persist a versioned continuation containing the selected tiers and systems outside the configuration being replaced, and replay those exact choices. Do not create a content continuation for a settings-only restore.
- **Confidence:** high — both the promise and the restarted command construction are shown.

### F-ES-02: Cloud rows remain gated after successful setup
- **Severity:** High
- **Category:** Correctness
- **Where:** `es-app/src/guis/GuiMenu.cpp:@@ -3836,120 +3996,1451 @@` — `openCloud`, `cloudAddTransferRow` [S1]  
  `es-app/src/guis/GuiMenu.cpp:@@ -4152,75 +5643,2028 @@` — `cloudAddGatedEntry`, game-settings cloud rows, setup completion [S1]
- **What:** Configuration availability is sampled when a menu is built and permanently determines its callbacks. Creating `rclone.conf` through a child setup flow does not change the already-open parent's setup-only callbacks.
- **Failure scenario:** On an unconfigured device, open GAME SETTINGS and enter setup through a dimmed cloud row. After configuration succeeds, return to that same menu and press the row: it offers setup again instead of performing the action.
- **Evidence:** `cloudAddGatedEntry(..., false, ...)` installs a callback that always opens the setup offer. Refutation attempted: the uncached `exists(..., false)` avoids filesystem-cache staleness, but it is still evaluated only during construction; the shown completion paths do not rebuild the parent.
- **Fix:** Recheck configuration at activation and refresh/rebuild gated rows when setup finishes.
- **Confidence:** high — the stale callback is explicit and independent of filesystem-cache behavior.

### F-ES-03: Selected system names are interpreted by the shell
- **Severity:** High
- **Category:** Security
- **Where:** `es-app/src/guis/GuiMenu.cpp:@@ -3836,120 +3996,1451 @@` — `cloudContentSystemPicker` parsing and save function [S1]
- **What:** Scan identifiers are concatenated into a double-quoted shell argument without shell escaping. Double quotes do not prevent command substitution.
- **Failure scenario:** A scan record naming a selectable system `nes$(id)` produces `cloud_content_restore --set-systems "nes$(id)"`; saving the selection executes `id` rather than passing the identifier literally.
- **Evidence:** The parser assigns `f.name = p[0]`, then appends names to `picked`, then executes `"--set-systems \"" + picked + "\""`. Refutation attempted: checked the parser and selection assembly for validation or `shellQuote`; neither is present. Restrictions imposed by the emitting script are outside the packet.
- **Fix:** Pass arguments without a shell, or apply `Utils::String::shellQuote(picked)` and validate the protocol identifiers against an explicit contract.
- **Confidence:** medium — the shell expansion is certain for the supplied input; whether the backend can emit that identifier is unverified.

### F-ES-04: Exit capture is not ordered against the next launch
- **Severity:** High
- **Category:** Concurrency
- **Where:** `es-app/src/FileData.cpp:@@ -696,10 +725,173 @@` — launch guards [S1]  
  `es-app/src/FileData.cpp:@@ -757,6 +949,44 @@` — capture command construction [S1]  
  `es-app/src/FileData.cpp:@@ -799,6 +1029,87 @@` — detached capture worker [S1]
- **What:** The detached capture job is not represented in the launch guards or serialized with later capture jobs. Its generation check controls only the subsequent UI callback, not when the helper reads saves.
- **Failure scenario:** Delay session A's capture worker, immediately relaunch the same game with another core, and let session B write the save. A's helper can then read the later file while carrying A's frozen emulator/core and start time; two exit captures can also overlap.
- **Evidence:** The code uses `std::thread(...).detach()` and checks `generation` only after `executeScriptLegacy(capture, nullptr)` returns. Refutation attempted: the launch guards cover cloud sync, transfer, send, and top-up jobs, but not capture.
- **Fix:** Register and serialize capture jobs, and keep subsequent launches behind a responsive capture barrier, or capture an immutable snapshot before allowing another session. Give the jobs an owned shutdown lifecycle.
- **Confidence:** medium — the missing ordering is explicit; the capture script is outside the packet, so resulting manifest damage is not established here.

### F-ES-05: Superseded captures silently lose their failure notification
- **Severity:** Medium
- **Category:** Correctness
- **Where:** `es-app/src/FileData.cpp:@@ -799,6 +1029,87 @@` — capture-result UI callback [S1]
- **What:** The generation guard drops capture failures along with obsolete sync requests. A later game does not make the earlier recording failure cease to matter.
- **Failure scenario:** Capture A fails while game B is running. When the queued callback finally executes after B exits, the generation differs and the warning toast is discarded.
- **Evidence:** The callback returns on `generation != sExitGeneration.load()` before examining `captureFailed`. Refutation attempted: the remaining failure report is a log entry, not the player notification required by the supplied capture-outcome rule [S4].
- **Fix:** Handle or accumulate capture failures independently of sync-generation suppression. Suppress only the obsolete sync start.
- **Confidence:** high — the notification is unreachable on the stated branch.

### F-ES-06: FINISH from the cloud menu does not finish the restore marker
- **Severity:** Medium
- **Category:** Upgrade path
- **Where:** `es-app/src/guis/GuiMenu.cpp:@@ -3836,120 +3996,1451 @@` — cloud-menu FINISH RESTORE PROCESS row [S1]  
  `es-app/src/guis/GuiMenu.cpp:@@ -4152,75 +5643,2028 @@` — `openRestoreRelink` FINISH callback [S1]
- **What:** The cloud-menu entry opens the restore checklist with `consumeMarker=false`, even though that entry is displayed because the marker exists. FINISH consequently leaves the pending restore on disk.
- **Failure scenario:** Choose LATER at startup, reopen the checklist through MANAGE CLOUD STORAGE, and press FINISH. The checklist returns on the next boot.
- **Evidence:** The cloud entry passes `false`; removal is guarded by `if (consumeMarker)`. Refutation attempted: the network-menu entry passes `true`, so this is an inconsistent entry path, not a universally retained marker.
- **Fix:** Consume an existing pending marker on FINISH regardless of which menu reopened the checklist. Retain it only on LATER, as required by S3 and S6.
- **Confidence:** high — the complete marker-consumption branch is embedded.

### F-ES-07: Restore Wi-Fi reconnection still blocks the interface
- **Severity:** Medium
- **Category:** Correctness
- **Where:** `es-app/src/guis/GuiMenu.cpp:@@ -4152,75 +5643,2028 @@` — `openRestoreRelink`, Wi-Fi save function [S1]  
  `es-app/src/ApiSystem.cpp:@@ -562,7 +606,14 @@` and `@@ -570,7 +621,7 @@` — `enableWifi` [S1]
- **What:** The restore checklist calls Wi-Fi association synchronously from its save callback and ignores the result. This bypasses the asynchronous mechanism introduced for other Wi-Fi menu operations.
- **Failure scenario:** Re-enter a wrong Wi-Fi password after restoring settings. The interface stops drawing while the enable/connect commands wait, with combined outer bounds of 30 and 150 seconds.
- **Evidence:** The callback directly invokes `ApiSystem::getInstance()->enableWifi(...)`. Refutation attempted: unlike the network-settings callers, this path does not use `networkApplyWifi` or `GuiLoading`. S6 assigns work lasting seconds to `GuiLoading`.
- **Fix:** Perform the association through the asynchronous Wi-Fi helper, preserve the checklist safely during the operation, and report failure before rebuilding it.
- **Confidence:** high — the blocking call and its bounds are shown.

### F-ES-08: Rotation records mishandle zero and missing launch evidence
- **Severity:** Medium
- **Category:** Correctness
- **Where:** `es-app/src/CaptureRotation.cpp:@@ -0,0 +1,182 @@` — `read`, `recordAfterSession` [S1]  
  `es-app/src/CaptureRotationText.cpp:@@ -0,0 +1,145 @@` — `turnsFromLog`, `fold` [S1]
- **What:** An observed zero rotation may not be recorded, leaving a nonzero table fallback active. Conversely, a log with no launch banner is converted into zero and can overwrite an existing record with an `own-launch` claim.
- **Failure scenario:** With no record, a table entry of three turns, and `video_allow_rotate=false`, recording returns early and subsequent reads still return three. With an existing three-turn record and a bannerless launch log, recording can replace it with zero marked `from=own-launch`.
- **Evidence:** `if (!had && turns == 0) return;`; reads without a trusted record use `fromTable(game)`. `turnsFromLog` returns `-1` without a banner, while `fold` converts negative input to zero. Refutation attempted: no separate “valid launch” result or table-aware zero-write condition exists.
- **Fix:** Distinguish unknown launch evidence from a valid zero request, preserve records on unknown evidence, and persist explicit zero whenever fallback could differ.
- **Confidence:** high — both cases follow entirely from the embedded reader and writer.

### F-ES-09: Folder rescans do not invalidate screenshot lookup caches
- **Severity:** Medium
- **Category:** Correctness
- **Where:** `es-app/src/DisplayAspect.cpp:@@ -0,0 +1,153 @@` — `sShots`, `sStems`, `forScreenshotPath` [S1]  
  `es-app/src/SystemData.cpp:@@ -295,6 +296,63 @@` — folder rescan [S1]
- **What:** Screenshot lookup caches survive the rescan that replaces the library they index. In particular, a cached “no matching game” is returned without another lookup.
- **Failure scenario:** View a screenshot before its ROM exists, add the matching ROM, then run the shown folder-rescan path. The screenshot retains the default transform because its negative cache entry remains.
- **Evidence:** A cached empty `system` immediately returns `Transform()`, and `sStems` rebuilds only after `forgetScreenshots()`. Refutation attempted: the rescan drops and remakes views but does not invalidate either cache; the shown session invalidation occurs only when a rotation record is written.
- **Fix:** Invalidate screenshot-to-game and stem caches whenever systems or their file lists are rebuilt, before constructing replacement views.
- **Confidence:** high — the negative-cache path and rescan sequence are both present.

### F-ES-10: The content picker rejects actionable BIOS-only and empty-file content
- **Severity:** Medium
- **Category:** Correctness
- **Where:** `es-app/src/guis/GuiMenu.cpp:@@ -3836,120 +3996,1451 @@` — `cloudContentSystemPicker` filtering [S1]
- **What:** The picker treats zero bytes as absence and removes BIOS from consideration before deciding whether there is anything to transfer.
- **Failure scenario:** A source system containing only a missing zero-byte file has a positive file delta but is filtered out. A cloud containing BIOS and no ROM-system content produces the “no system holds what you ticked” dialog and no way to proceed with that tier.
- **Evidence:** The code skips `f.name == "bios"` and then skips zero `localBytes`/`cloudBytes`; `found.empty()` returns before presenting a transfer action. Refutation attempted: the later count-based handling of empty files cannot run for rows already discarded.
- **Fix:** Use file presence/counts rather than byte totals to identify source content, and permit the BIOS portion of the tier without a selectable ROM system.
- **Confidence:** high — both exclusions precede the only continuation.

### F-ES-11: Cloud transfer forms contain strong ownership cycles
- **Severity:** Medium
- **Category:** Resource
- **Where:** `es-app/src/guis/GuiMenu.cpp:@@ -3836,120 +3996,1451 @@` — `cloudOpenTransfer`, `run`, `rebuildButtons` [S1]
- **What:** The content and media switches store callbacks that strongly own those same switches through `rebuildButtons`. That closure also owns `run`, which retains the other controls.
- **Failure scenario:** Repeatedly open and close BACK UP TO THE CLOUD or RESTORE FROM THE CLOUD with content tooling available. Each closed form leaves its callback/control graph retained.
- **Evidence:** `rebuildButtons` captures `content`, `media`, and `run`; both switches install `[rebuildButtons]` callbacks. Refutation attempted: the weak ownership used in the system picker is not used in this form.
- **Fix:** Break the graph with weak captures or a page-owned controller whose callbacks do not own their containing controls, following the ownership pattern documented in S5.
- **Confidence:** high — the strong-reference cycle is explicit.

### F-ES-12: Scraper layout compression does not compress its text
- **Severity:** Medium
- **Category:** Correctness
- **Where:** `es-app/src/guis/GuiScraperRun.cpp:@@ -0,0 +1,250 @@` — constructor geometry [S1]
- **What:** When the page does not fit, the constructor scales row heights and advances but leaves font sizes and automatic text heights unchanged. This reduces the distance between text rows without reducing the text occupying them.
- **Failure scenario:** On a small panel or with sufficiently large menu fonts, `fit < 1`; the counter is placed at `status_y + hM * fit` while the status still uses the original text font, allowing overlap.
- **Evidence:** `rM = hM * fit` controls positions, while text components receive `setSize(w, 0)` and retain their original fonts. Refutation attempted: there is no corresponding component scale, font change, or clipping/layout alternative.
- **Fix:** Preserve measured text-row heights and reduce spacing only within safe limits; when that cannot fit, change the layout or provide scrolling. Verify the actual font metrics on small panels.
- **Confidence:** high — the mismatch between layout pitch and text sizing is visible; no particular device frame is claimed.

### F-ES-13: Scraper truncation splits UTF-8 characters
- **Severity:** Medium
- **Category:** Correctness
- **Where:** `es-app/src/guis/GuiScraperRun.cpp:@@ -0,0 +1,250 @@` — `fitOneLine` [S1]
- **What:** The truncation loop removes bytes rather than Unicode characters and then feeds the intermediate strings back to the font. It can return or measure malformed UTF-8.
- **Failure scenario:** An overwide game title ends with an accented or non-Latin character. The first `pop_back()` removes only its final byte, leaving an invalid sequence for the next measurement.
- **Evidence:** The loop calls `text.pop_back()` and then `font->sizeText(text + "...")`. Refutation attempted: no code-point boundary handling is present; the supplied rules expressly require preserving UTF-8 [S5].
- **Fix:** Truncate at UTF-8 code-point boundaries, preferably in a pure tested helper. Cover multibyte titles and very narrow widths.
- **Confidence:** high — byte-wise truncation is explicit; the font’s exact response to malformed input is outside the packet.

### F-ES-14: The new signal path is unconditionally POSIX
- **Severity:** Medium
- **Category:** Build/packaging
- **Where:** `es-app/src/main.cpp:@@ -354,21 +371,75 @@` — `crashWrite`, signal handlers [S1]  
  `es-app/src/main.cpp:@@ -472,10 +700,29 @@` — handler installation [S1]
- **What:** The previously portable signal setup now unconditionally uses `sigaction`, `sigemptyset`, POSIX flags, and `write(STDERR_FILENO, ...)`. The file still carries a WIN32 build path.
- **Failure scenario:** Building the WIN32 application reaches POSIX signal structures/constants that its C runtime does not provide.
- **Evidence:** The `sigaction` block has no platform guard, while only backtrace-related code is guarded by `__GLIBC__`. Refutation attempted: no Windows fallback accompanies these additions.
- **Fix:** Keep the POSIX implementation behind an appropriate platform guard and retain or implement a Windows-specific handler path.
- **Confidence:** high — this is a static portability regression; no Windows build was run.

### F-ES-15: Scraper cancellation instructions ignore mapped controls
- **Severity:** Medium
- **Category:** Player text
- **Where:** `es-app/src/guis/GuiScraperRun.cpp:@@ -0,0 +1,250 @@` — `input`, `render`, footer strings [S1]
- **What:** The footer tells the player to press literal B, while cancellation follows the configurable `BUTTON_BACK` mapping. The custom page also omits the early help-bar rendering required by the supplied full-screen-menu contract.
- **Failure scenario:** With confirm/back swapped, pressing the displayed B does not cancel. On a full-screen secondary page, the documented help-bar behavior removes the mapped prompt that could correct that instruction.
- **Evidence:** Input uses `config->isMappedTo(BUTTON_BACK, input)`, but text says `PRESS B TO CANCEL.` Refutation attempted: `getHelpPrompts()` exists, but `render()` does not call `renderHelpPromptsEarly()`. S5 documents that requirement; S6 prohibits hardcoded console letters.
- **Fix:** Use mapped control prompts and render the custom page’s help bar when it is topmost; remove the literal B instruction.
- **Confidence:** high — the mapping mismatch and convention violation are explicit; no rendered frame is claimed.

### F-ES-16: Sync confirmation can explain a different run from its row
- **Severity:** Medium
- **Category:** Player text
- **Where:** `es-app/src/guis/GuiMenu.cpp:@@ -3836,120 +3996,1451 @@` — `cloudLastRunDetail`, `cloudLastRunWhy` [S1]
- **What:** The sync row selects the newest manual, exit, or startup run, but its confirmation’s explanation reads only the manual stamp. The two surfaces can contradict each other.
- **Failure scenario:** A manual sync fails, then a later automatic sync completes. The row says COMPLETED for the automatic run, while the confirmation still presents the old manual failure as “LAST TIME IT COULDN'T FINISH”.
- **Evidence:** `cloudLastRunDetail("sync-manual")` merges three stamps; `cloudLastRunWhy` calls only `cloudReadLastRun(name)`. Refutation attempted: there is no shared “latest sync” selection used by both functions.
- **Fix:** Resolve the relevant last run once through a shared helper and use it for both the row and its explanation.
- **Confidence:** high — the differing selection rules are shown.

### F-ES-17: Leaving OAuth setup does not cancel its waiting session
- **Severity:** Medium
- **Category:** Resource
- **Where:** `es-app/src/guis/GuiMenu.cpp:@@ -4152,75 +5643,2028 @@` — `cloudOAuthStart`, `cloudOAuthPresentChoice`, `cloudSetupSetButtons` [S1]
- **What:** OAuth setup launches a detached service before showing the input choice, but its normal EXIT action only deletes the page. ES sends no cancellation for that exit.
- **Failure scenario:** Start a healthy waiting sign-in and immediately choose EXIT. The UI disappears while the detached sign-in remains subject to its own completion or 900-second timeout rather than the player's exit.
- **Evidence:** The command contains `serve ... --timeout 900 ... &`; EXIT executes only `s->close()`. Refutation attempted: an explicit `cloud_oauth cancel` exists in the later CANCEL SIGN-IN dialog, but not on the ordinary OAuth exit paths.
- **Fix:** Give the OAuth flow session ownership and explicitly cancel on abandonment, without cancelling during transitions between its own pages.
- **Confidence:** high — the missing ES cancellation is shown; the service’s complete cleanup implementation is outside the packet.

### F-ES-18: OAuth timeout falls back to an unvalidated URL
- **Severity:** Medium
- **Category:** Correctness
- **Where:** `es-app/src/guis/GuiMenu.cpp:@@ -4152,75 +5643,2028 @@` — `cloudOAuthAwaitSession` [S1]
- **What:** The legacy `url` fallback executes even when the current `info` protocol was understood but never reported `waiting`. It can turn a failed current-protocol session into `ready.started=true`.
- **Failure scenario:** `info` repeatedly reports `STATUS=failed`, while `url` still returns a stored address. After polling, the function accepts that address and presents a started sign-in.
- **Evidence:** After the loop, the function unconditionally invokes `cloud_oauth url` and returns `!url.empty()`. Refutation attempted: `understood` affects the loop but does not guard the fallback.
- **Fix:** Use the legacy fallback only when `info` is genuinely unsupported. Known failure states and current-protocol timeouts should fail closed.
- **Confidence:** medium — the acceptance path is certain for that protocol input; the helper’s retention of failed-session URLs is outside the packet.

### F-ES-19: Post-connect advice assumes sync settings are unset
- **Severity:** Low
- **Category:** Player text
- **Where:** `es-app/src/guis/GuiMenu.cpp:@@ -4152,75 +5643,2028 @@` — `cloudOAuthShowConnected` [S1]  
  `es-app/src/FileData.cpp:@@ -799,6 +1029,87 @@` — exit-sync setting [S1]
- **What:** The completion page unconditionally says NOTHING SYNCS YET and tells the player to turn on systems. Existing startup/exit sync preferences can already be enabled, and the shown save-sync controls are global switches rather than per-system selections.
- **Failure scenario:** A settings-restored device retains `cloudsaves.gameexit=1` but reconnects its missing cloud account. The completion advice says nothing syncs, while the next exit starts synchronization.
- **Evidence:** The completion text is unconditional; the exit path tests the retained setting directly. Refutation attempted: the shown sign-in flow does not reset that setting. This also conflicts with the upgrade requirement to account for existing state [S3].
- **Fix:** Describe or display the actual startup/exit sync settings and distinguish them from content-system selection.
- **Confidence:** high — the retained-setting case is directly supported.

### F-ES-20: SSH setup displays the device password without masking
- **Severity:** Low
- **Category:** Convention
- **Where:** `es-app/src/guis/GuiMenu.cpp:@@ -4152,75 +5643,2028 @@` — `cloudSetupOpenPasswordPage`, `cloudSetupShowConnectStep`, `cloudSetupAddFact` [S1]
- **What:** These pages pass the real device password directly to a text fact, contrary to the supplied password-display convention.
- **Failure scenario:** Entering the SSH connection step exposes the device password to anyone viewing the screen. No credential leaving the device is demonstrated.
- **Evidence:** `cloudSetupAddFact(..., _("CURRENT PASSWORD"), current, ...)` forwards the value to `TextComponent`. Refutation attempted: there is no masking or separate reveal action on that display path; S6 specifies masked password values.
- **Fix:** Mask by default and provide a deliberate reveal action if this setup flow requires it.
- **Confidence:** high — the value-to-display path is embedded.

### F-ES-21: Extensionless screenshot names containing dots are misparsed
- **Severity:** Low
- **Category:** Correctness
- **Where:** `es-app/src/DisplayAspectText.cpp:@@ -0,0 +1,66 @@` — `screenshotContent` [S1]  
  `es-app/tests/unit/DisplayAspectTextTests.cpp:@@ -0,0 +1,41 @@` [S1]
- **What:** The helper claims to accept names with or without an extension, but always strips everything after the last dot before recognizing the screenshot suffix.
- **Failure scenario:** `Dr. Mario-260922-153012` becomes `Dr` and returns an empty content name instead of `Dr. Mario`.
- **Evidence:** `stem = stem.substr(0, dot)` runs for any non-leading dot. Refutation attempted: tests cover a dotted name with `.png` and an extensionless undotted name, but not their combination.
- **Fix:** Recognize the screenshot suffix before treating a dot as an extension separator, or strip only a recognized image extension. Add dotted extensionless cases.
- **Confidence:** high — this is a deterministic pure-function case.

### F-ES-22: New scraper comments violate the ASCII extraction rule
- **Severity:** Low
- **Category:** Convention
- **Where:** `es-app/src/guis/GuiScraperStart.cpp:@@ -79,12 +82,30 @@` and `@@ -129,14 +159,56 @@` [S1]
- **What:** New comments in translatable UI code contain em dashes despite the supplied rule requiring ASCII comments in this extraction path.
- **Failure scenario:** none demonstrated; xgettext was not run.
- **Evidence:** Examples include `page closes — the path` and `today's default — every system ... —`. Refutation attempted: these are comment bytes, not the permitted Unicode string literals. S5 documents the image-build failure mode and the pre-pin check.
- **Fix:** Replace those comment characters with ASCII punctuation and run the actual translation-extraction/image-build step.
- **Confidence:** high for the convention violation; whether these particular comments are extracted is unverified.

# Upstream fit

- **Split the submission by behavior.** Cloud orchestration, saved Wi-Fi management, scraping, BIOS presentation, capture transforms, and crash handling are independent changes with different failure surfaces. The aggregate diff does not provide a reviewable commit sequence; commit hygiene beyond the visible aggregate cannot be judged.
- **Keep application/platform boundaries explicit.** The new signal code breaks the existing portability boundary. Cloud commands also depend on ROCKNIX-specific installed paths and protocols; their compatibility needs coordinated review with the distribution-side scripts, not approval based on explanatory comments.
- **Reduce orchestration inside `GuiMenu.cpp`.** It now contains protocol parsing, shell construction, asynchronous work, ownership graphs, and several setup state machines. Consolidating command execution and quoting would directly reduce defects such as F-ES-03; extracting pure parsing decisions would make them testable under the project’s stated convention [S5].
- **Separate invariants from fork chronology.** Numerous comments embed fork issue numbers, maintainer conversations, VM history, and internal rule paths. Preserve the useful invariants, but move implementation history to repository-qualified references or commit descriptions so an upstream reader can locate it.
- **Do not treat the added unit tests as workflow proof.** The shown pure tests do not establish restore-continuation fidelity, callback lifetime, process cancellation, save-capture ordering, or rendered layout.
- **No production credential or personal runtime home path is demonstrated in this packet.** The password literals in the masking tests are explicitly stand-ins. Runtime display of the device password is a separate issue, F-ES-20.
- **Licensing/header requirements remain unknown.** The project’s license and new-file notice policy were not embedded; absence of headers cannot responsibly be declared a licensing violation from this corpus.

# Coverage boundary

This review covers only the supplied application diff and five standards documents. It does not certify the whole 107-file bucket or the complete release candidate.

**Orchestrator follow-up is required for:**

1. **Supporting application implementations.** Bodies for `ThreadedCloudSync`, `CloudTransferJob`, `ProxyCards`, `OfflineAchievements`, `ThreadedHasher`, `SaveStateBookkeeper`, and several other files named by CMake are not embedded. Their cancellation, synchronization, progress, cache, and teardown behavior cannot be inferred from their names or callers.
2. **Core and GUI lifecycle contracts.** The complete `Window` task-queue/shutdown implementation, `GuiLoading` lifecycle, process-launch helpers, secret masking, and remaining callback/destructor implementations are outside the packet. In particular, detached workers retain raw `Window*` values; whether shutdown safely drains those workers requires the owning seat’s evidence.
3. **Script contracts and data safety.** `cloud_capture`, cloud transfer/setup/OAuth scripts, `backuptool`, `wifictl`, and `runemu.sh` are not embedded. Backend identifier validation, marker payloads, atomic writes, process-group cleanup, and the claim that launch-command parsing matches actual launcher behavior remain unverified. Findings above distinguish caller defects from unproven downstream loss.
4. **Runtime and upgrade proof.** No build output, VM execution, device trace, interruption test, or rendered frame was provided. Needed checks include settings-only/media-only restart continuations, rapid relaunch during capture, restore-marker completion from both menus, small-panel/large-font layouts, mapped buttons, and state inherited from older images [S3].
5. **Project-wide conformance.** French catalogs, the blindspot register, the complete acceptance-criterion set, and other referenced companion rules were not embedded. French coverage cannot be marked missing or passing from this diff. The audit checklist’s full conformance/completeness steps therefore remain open [S2].

## `corpus.provenance.json`

The arrays below are aligned in **S1–S6 order**. Hashes are the values verified by the Council Facilitator at embed time, not hashes computed by this reviewer.

```json
{
  "corpus_mode": "embedded read-at-time corpus",
  "source_ids": ["S1", "S2", "S3", "S4", "S5", "S6"],
  "source_file_paths": [
    "/workspace/repos/rocknix/docs/audits/2026_09_25-milestone-rc-round-since-258/seats/8a-es-app.diff",
    "/workspace/repos/rocknix/.claude/skills/code-auditor/references/anti-patterns.md",
    "/workspace/repos/rocknix/.claude/rules/upgrade-and-install.md",
    "/workspace/repos/rocknix/.claude/rules/es-player-text.md",
    "/workspace/repos/rocknix/.claude/rules/es-code-traps.md",
    "/workspace/repos/rocknix/.claude/rules/es-ui-style-guide.md"
  ],
  "source_file_hashes": [
    "05609c61cbf6d4fdd7d896b32ad6cc069dec695790004b13482909b159ecb071",
    "fd825c0505ae772ca2a6651eefe642581aaa147c254fed8cf50db1f8f1bde678",
    "de4a683f9a36f9100e6fd98be11ad84d736f370374c40f74c445a2b81eca1995",
    "97c0816eabd3088ce94e3d45dec8042c1796afa3c295a9a8d080597ece817145",
    "9d5d6995714c9a1287c84f0c02a92de244271a4bdad8e53d29bb61115ba51d0f",
    "150d0ac637626d771871eab48db995d8fc46c69ed7cf786240213649d264ad02"
  ],
  "hash_verification": "Council Facilitator verified at embed time",
  "filesystem_access": false,
  "files_independently_reread": false,
  "hashes_independently_recomputed": false,
  "builds_or_tests_run": false,
  "unembedded_evidence_needed": [
    {
      "artifact": "Supporting application job, synchronization, indexing, and bookkeeping implementations",
      "sha256": null
    },
    {
      "artifact": "Core Window, GUI lifecycle, process-launch, and secret-masking implementations",
      "sha256": null
    },
    {
      "artifact": "Invoked cloud, backup, Wi-Fi, and emulator-launcher scripts",
      "sha256": null
    },
    {
      "artifact": "Build results, VM/device proofs, rendered frames, and upgrade rehearsals",
      "sha256": null
    },
    {
      "artifact": "French catalogs, blindspot register, complete acceptance criteria, and unembedded companion rules",
      "sha256": null
    }
  ],
  "gap_disposition": "Surfaced to the orchestrator; no contents or hashes fabricated for missing artifacts"
}
```