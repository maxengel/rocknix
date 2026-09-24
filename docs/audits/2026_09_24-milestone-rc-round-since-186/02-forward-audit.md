# Forward Audit — The release-candidate round (work since #186)

**Auditor:** Code Auditor skill v1.10.0 (Claude Fable 5.1, `claude-fable-5-1`, a fresh agent)
**Date:** 2026-09-24
**Subject:** every acceptance criterion of the issues opened or closed since 2026-09-14 that carries code in `95e4961fb3..443028ff7a` (distribution) or `ae9c7d56b..75ca1dac2` (EmulationStation), plus the 33 punch items of #186 carried forward
**Spec:** the issue bodies on `maxengel/rocknix`, fetched 2026-09-24 (the `- [ ]` lines quoted verbatim, trimmed with `…` where long); `docs/decision-register.md`

---

## Running Notes

Conventions. Every entry: **Source** (issue, box number, its tick state today) · **Verdict** · **Evidence** (file:line at `443028ff7a` / ES `75ca1dac2`, a command run in Phase 1.7 with its result, a report file, or a guest d read) · **Refutation** (what would have shown the criterion unmet, and why it did not) · **Gaps**. Four recurring verdict reasons are named once:

- **UNTESTABLE-DEV** — the box is the maintainer's word on a handheld. This audit has no handheld (read-only guest d only), the RG SP named in many boxes is no longer the RC device (D-QA-031), and D-QA-033 moved what the VM can prove to the VM. The VM half, where one exists, is judged in its own box.
- **SKIP-NP** — the issue was closed *not planned* or parked, with the register row that says so.
- **SKIP-OPEN** — open design work that nothing in the range claims; the box is honest.
- **PRE-RANGE** — the fix and its proof predate `95e4961fb3` / `ae9c7d56b`; only "the tip still carries the mechanism" is derived here.

Mechanical results cited throughout are from §1.7 of `01-research-notes.md` (all run 2026-09-24 on the primary at `443028ff7a`): pkgcheck 28/28; `last-good-scripts-test` PASSED (a..x); register/vocabulary/index/ceremony exit 0; `es-menu-map-check` 0 missing of 51; `es-untranslated` 0 of 674; `msgfmt` 1944 messages clean; ES unit tests 119 / 1302; `fork-package-freshness` exit 1; `es-syntax-check` 52/55 with three tool false positives; vm-qa `qa-443028ff7a-webdav-a-20260924-0116` twelve suites PASS, `frame-diff` 0 boxes; rehearsal 19/19.

---

## P. The #186 punch list carried forward (33 items; the issue closed 2026-09-21 "delivered")

The prior audit's index (`docs/audits/2026_09_14-epic-offline-retroachievements/05-punch-list.md`) still reads `outcome: open` for 32 of 33 items, and `tools/lint-audit-artifacts … --issue 186` PASSes anyway, because it reads the folder's Phase 7 outcomes table -- which is complete -- and never the index (Phase 1.10). Each item is therefore re-derived here from the acceptance line quoted in Phase 1.5/1.10 and the code at the tip.

| PL | Acceptance (short) | Verdict | Evidence at the tip / refutation |
| --- | --- | --- | --- |
| PL-01 | hourly refresh bounded; harness pins the predicate; upstream draft | PARTIAL ⚠ | patch `005-bound-the-hourly-refresh.patch` present; `last-good-scripts-test` PASSED (the PL-01 cases run in section t). The two-hour `service.log` count on a device was never observed; the upstream draft is a #168 item, not verified here. |
| PL-02 | eviction whole; `ready` never counts a game missing its `achievementsets` row | PARTIAL ⚠ | patch `006-evict-a-game-whole.patch`; ctl `is_cached` asks the three rows (`1159fd29c0`, harness t). "loads the game offline after the fix" has no launch observation on an aged store. |
| PL-03 | the ctl never writes `online_state.json` | PASS ✓ | ctl `is_online` probes with a scratch `RAOFFLINEPROXY_CONFIG_DIR`; harness case t asserts the file's mtime unchanged (suite PASSED 2026-09-24). Refutation: a write would move the mtime the case reads. |
| PL-04 | 90 s probe window; mark only after a real answer; offline: probes then 69 | PASS ✓ (text stale) | ctl `PROBE_TRIES=9` (`:254`); harness t. The acceptance line still says "three probes" (05-punch-list.md:71) -- the count was corrected in the work log (09-14 L483), never in the punch list. |
| PL-05 | harness case t passes; `--old` fails PL-03/04 | PASS ✓ | `./tools/last-good-scripts-test` PASSED 2026-09-24 (section t among a..x). `--old` not re-run here (needs a base ref); the 09-14 work log records it. |
| PL-06 | a fresh guest indexes and caches an added game, or the sentence is conditional | PASS ✓ | ES `cce9ab12a` (in range) starts the indexes without the splash (`main.cpp:788-795`); RC-7 proof `183-game-options-view-achievements-640x480-3387cf5da0.png` exists; D-RA-018. |
| PL-07 | B leaves the scan running; the row reports | SKIP ○ (reversed) | **Reversed by D-UI-078** (#241): `GuiOfflineScan.cpp:111-112` B -> `askCancel()`; nothing runs in the background. The ticked PL describes behaviour that no longer ships; the punch list and #186 were not annotated with the reversal. |
| PL-08 | hash-no-id games gain an id at startup | PASS ✓ | `cce9ab12a`; `ThreadedHasher` log line quoted in #183; frame exists. |
| PL-09 | offline summary of 100 games under 2 s; one timeout on a hung proxy | PASS ✓ | one-read `raofflineproxy-ctl summary` (`RetroAchievements.cpp:402-424`, D-RA-020); the 2 s reworded to the tool's latency by D-RA-023. |
| PL-10 | RC-6 frames EN+FR at 640x480 | PASS ✓ | `docs/qa-frames/2026-09-14/184-*` (13 files, listed in Phase 1 research). |
| PL-11 | the rocknix.org draft matches the code | **FAIL ✗** | `docs/ra-offline/rocknix-org-offline-achievements.md:25`: "You can press **B** to keep it scanning in the background … the page can be reopened from the row" -- false since D-UI-078 (2026-09-21); the file was last touched 2026-09-14. #241 box 6 checked the *clone of rocknix.org*, not this draft. |
| PL-12 | log upload gated off | PASS ✓ | patch `008-log-upload-opt-in.patch`. |
| PL-13 | `qa-accounts clear` removes the proxy folder | PASS ✓ | `tools/qa-accounts` (`4e11497aa7`). |
| PL-14 | no key in `ra-offline-test`'s argv | PASS ✓ | `eeda543cdc`: `curl -K -` on stdin. |
| PL-15 | no cap number remains; msgfmt clean | PASS ✓ | patch 004 (no cap); `msgfmt --check` 1944 messages, exit 0 (Phase 1.7b). |
| PL-16 | enable rolls back on a failed write | PASS ✓ | ctl `enable_undo`/`do_enable` (`1159fd29c0`); harness p. |
| PL-17 | a second scan reaches files past the cap; `truncated=` | PASS ✓ | ctl `list_jobs` (`1159fd29c0`); harness t. |
| PL-18 | refining rows exist; register-check passes | PASS ✓ | D-UI-056, D-RA-017, D-RA-015 (never issued) read in the register; `register-check` 344 IDs clean. |
| PL-19 | four issue bodies amended | UNTESTABLE ? | issue-body edits leave no artifact in the tree; not re-derived (budget). |
| PL-20 | the `u=` item is on #168 | UNTESTABLE ? | the only `resolved` outcome in the index; #168's body not re-read here. |
| PL-21 | the unit-test recipe in the rule runs as written | UNTESTABLE ? | this audit ran the equivalent from the brief (build-root rapidjson include), 119 / 1302 green; the rule's exact line (toolchain cmake + sysroot include) was not executed. |
| PL-22 | the ctl header names the schema pin | PARTIAL ⚠ | `raofflineproxy-ctl:193` names `64d03d30…`; `package.mk:13` pins `4e9bab484e…` since `41f86ec9ba` (2026-09-20). The header is now wrong. |
| PL-23 | readiness keyed by user and hash | PASS ✓ | patch `007-cached-sign-in-of-the-configured-account.patch`; ctl `list_jobs`. |
| PL-24 | a failed caching ends COULDN'T FINISH with a count | PASS ✓ | ctl `do_scan`; frames `186-pl24-*` (3). |
| PL-25 | a raising request leaves the refresh thread alive | PASS ✓ | patch 005. |
| PL-26 | malformed answers are invalid; tests | PASS ✓ | `OfflineAchievementsTextTests.cpp` present; unit run 119 / 1302. |
| PL-27 | the toggle runs the ctl off the UI thread | PASS ✓ | `GuiRetroAchievementsSettings.cpp` `apply` (pre-range ES `70023f5fc`, present at the tip); frames `186-pl27-*`. |
| PL-28 | one deadline from START | PASS ✓ | ctl `time_left`/`take_lock`. |
| PL-29 | three canaries read `<redacted>` under busybox sed | PASS ✓ | `001-functions` diff read (Phase 1.9); harness case r in the PASSED run. |
| PL-30 | `disable` ends a running helper within 10 s | PARTIAL ⚠ | `stop_running_run` covers `scan`/`topup` (`trap 'stopped …' TERM` at 1318/1413, `CLIENT=` 1137/1513). `do_images` (1269) and `do_refresh` (1293), added after, set only `trap unmark_running EXIT` and no `CLIENT`: a SIGTERM ends the ctl and leaves the Python helper running. |
| PL-31 | an unreadable hardcore keeps the direct path | PASS ✓ | `setsettings.sh` `= "0"` and `cheevos_ppsspp.sh` `hardcore_raw` (Phase 1.9 diffs); harness. |
| PL-32 | rename-then-read on the flushed stamp | PASS ✓ | ctl `do_flushed`; harness p. |
| PL-33 | unique image temp names | PASS ✓ | patch `009-unique-image-temp-names.patch`. |

**P summary:** 24 PASS, 4 PARTIAL (PL-01, PL-02, PL-22, PL-30), 1 FAIL (PL-11), 1 SKIP-reversed (PL-07), 3 UNTESTABLE (PL-19, PL-20, PL-21). The index's `open` on all of them is a bookkeeping defect, not a code one (Phase 3).

---

## D. Tools, packaging, the upstream merge, ceremonies, the RetroArch floor

### AC-D01 · #121 box 1 (ticked): "A boot of the GENERIC_X64 guest has no `powerstate` line in `journalctl -b`."
**Verdict:** see the guest read below (Phase 2 D addendum) · **Evidence:** the fix `8d2f384d1c` predates the range (PRE-RANGE); guest d on `443028ff7a`: `journalctl -b | grep -c powerstate` = **1** line. **Refutation:** any `powerstate` line disproves the box as written; one exists -- what it says decides between "the arithmetic error is back" and "a unit line the box never meant". Resolved in the addendum.

### AC-D02 · #121 box 2 (ticked): "A handheld's `powerstate` behaviour is unchanged (LED and audible alerts still fire at the thresholds)."
**Verdict:** UNTESTABLE ? (UNTESTABLE-DEV) · **Evidence:** the tick's own text says the check was "by inspection … byte-identical … not a test to schedule"; no alert was observed to fire. **Refutation:** the box asks for a behaviour; an artifact identity cannot fail it (blindspot 13). **Gap:** a tick from an artifact on a box that names a behaviour (finding F-hyg).

### AC-D03 · #131 box 1 (ticked): "A decision row records the device and the accounts chosen…"
**Verdict:** PASS ✓ · **Evidence:** D-QA-027 (2026-09-17) read in `docs/decision-register.md`; guest reads and the vm-qa rows show only QA accounts in use (`tools/qa-accounts`). **Refutation:** a missing row or one naming the maintainer's device would fail it; D-QA-027 names the RG35XX SP and QA accounts only.

### AC-D04 · #131 box 2 (unticked, annotated "superseded"): "The exit test, the Dropbox replacement proof (#107) and the retry measurement (#113) run against the QA device … from the runner…"
**Verdict:** SKIP ○ · **Evidence:** the box says in-body that it is superseded (2026-09-20) and where the runs live (#236 A, #113). `tools/vm-qa` at the tip has no device target (`SUITES=` line 56). **Notes:** honest, but the issue closed *completed* with an unmet box re-scoped by annotation rather than struck (issue-tracking: edit the body).

### AC-D05 · #150 box 1 (ticked): "The milestone audit's punch-list issue is closed with every item at every severity resolved (D-WORKFLOW-015)."
**Verdict:** PARTIAL ⚠ · **Evidence:** #151 closed 2026-09-21; its index (Phase 1.5) shows 16 `resolved` and **2 `deferred:#156`**. **Refutation:** "every item at every severity resolved" is falsified by the two deferrals the tick itself names. **Gap:** the box's wording was not amended when D-QA-032 allowed the two frame halves to follow.

### AC-D06 · #150 box 2 (ticked): "H700 built from the `next` that carries those fixes via `devices/build-dev.sh H700` after `tools/fork-worktree sync`; artifacts under `/workspace/artifacts/rocknix-images/h700-all-<date>-<BUILD_ID>/` … its GENERIC_X64 twin passes all eight VM suites."
**Verdict:** PARTIAL ⚠ · **Evidence:** `h700-all-20260921-d55169e59e/` exists (and sixteen later cuts up to `h700-all-20260924-443028ff7a/`); vm-qa row 98 (eleven suites). `devices/build-dev.sh` does **not exist** in the tree at `443028ff7a` (`ls`); the tick records the deviation (`make docker-H700` through a session script). **Gap:** the box names a script that is not in the tree; the recipe it means is only in a scratch file.

### AC-D07 · #150 boxes 3-7 (unticked): SM8550 build; the Nova row and runbook; staging on both devices; PL-04's fresh-flash proof; the Nova's first boot.
**Verdict:** SKIP ○ (SKIP-OPEN) ×5 · **Evidence:** D-QA-031 sequences the RG SP and the Nova after an accepted RC; nothing in the range claims them. `device-builds.md` already carries the Nova row (Phase 1.4 delta), so box 4 is half-done and unticked.

### AC-D08 · #181 box 1 (ticked): "Frames at 640x480 and the RG SP's size show the FBNeo, NES and Game Boy logos as crisp as GBA, Genesis and Sega CD, with the cause named from the code."
**Verdict:** PARTIAL ⚠ · **Evidence:** `docs/qa-frames/2026-09-21/181-logo-{gb,gba,nes}-640x480-77e7e97515.png` (3) and four 2026-09-14 frames; the cause (a shared SVG rasterised at the largest requested size, ES `20824cc29`, pre-range) named in the body. **Refutation/gap:** FBNeo, Genesis and Sega CD are named by the box and not framed in range; the 2026-09-21 set covers three of six.

### AC-D09 · #181 box 2 (ticked): "The maintainer confirms on the RG SP."
**Verdict:** PARTIAL ⚠ · **Evidence:** the tick quotes the maintainer (2026-09-14) that the logos "fixed themselves after the restart". **Refutation:** a restart empties the shared-texture cache, which is the bug's own mechanism -- the observation cannot tell the fix from the reboot; the closing comment retracts a later "panel matter" note (blindspot 51). A word, but not one that bears on the fix.

### AC-D10 · #222 box 1 (ticked): "A check exists that fails when a shipped screen is neither mapped nor declared."
**Verdict:** PASS ✓ · **Evidence:** `tools/es-menu-map-check` run 2026-09-24: `51 screen(s) at 75ca1dac2, 27 in the map, 24 declared unmapped, 0 missing`, exit 0; the work log 09-18 §211 records the positive (30 missing, exit 1, a constructed stale declaration caught). **Refutation:** `tools/es-menu-map-check:153` tests `title.lower() in text.lower()` against the **whole map text** -- a screen whose title is a common word (TOOLS, NETWORK, SECURITY) reads as mapped by incidental prose. The positive was seen; the weakness is real (finding F-D10, Low).

### AC-D11 · #222 box 2 (ticked): "It reads the commit the image ships, not a local working tree."
**Verdict:** PASS ✓ · **Evidence:** `shipped_ref()` reads `PKG_VERSION` from the emulationstation recipe; the output names `75ca1dac2`, the pin at `443028ff7a`. **Refutation:** pointing `--es-src` at a checkout on another branch still reports the pin's ref (by design).

### AC-D12 · #222 box 3 (ticked): "Screens we choose not to map carry a written reason, in the map."
**Verdict:** PASS ✓ · **Evidence:** `docs/es-menu-map.md` `## Not mapped`: 24 entries, each `- TITLE -- why` (read). **Refutation:** an entry with no reason would show as a bare title; none does.

### AC-D13 · #222 box 4 (ticked): "The six fork-added screens are mapped."
**Verdict:** PASS ✓ · **Evidence:** the map contains FINISH RESTORE (6), WHICH CONNECTION (1), SSH PASSWORD (1), CLOUD SETUP COMPLETE (1), WI-FI PASSWORD (1), DEVICE PASSWORD (1) (`grep -c`); the check's 0 missing covers the rest.

### AC-D14 · #222 box 5 (ticked): "It runs as part of `tools/vm-qa`."
**Verdict:** PASS ✓ · **Evidence:** `qa-443028ff7a-webdav-a-20260924-0116/menumap.log`: `51 screen(s) at 75ca1dac2 … 0 missing`; `report.md` row `menumap PASS 0s`. **Notes:** the tick (09-18) preceded the first run that actually executed it (`6558618a59`, 09-19: "menumap … never ran because this copy was not updated") -- the box became true a day after it was ticked.

### AC-D15 · #222 box 6 (ticked): "The instruction file says the rule is checked, and how to declare an exception."
**Verdict:** PASS ✓ · **Evidence:** `es-native-ui.md` § "The other files that carry the interface law" (Phase 1.4 delta: "And it is checked… `## Not mapped` … `- TITLE -- why`").

### AC-D16 · #222 box 7 (unticked): "It runs somewhere nobody has to remember -- a pre-commit or CI hook…"
**Verdict:** SKIP ○ (SKIP-OPEN) · **Evidence:** `fork-checks.yml` runs `work-log-index --check`, `register-check`, `ceremony-check` only (needs no ES checkout); honest.

### AC-D17 · #226 box 1 (ticked): "GENERIC_X64 image built from `06016e4bbf` or later: `/usr/lib` holds exactly one `libcairo.so.2.*` regular file, and `libcairo.so.2 -> libcairo.so.2.11804.4`."
**Verdict:** PASS ✓ · **Evidence:** guest d on `443028ff7a`: `ls /usr/lib/libcairo.so.2.*` -> 1 file, `libcairo.so.2.11804.4`; the rehearsal's `one libcairo.so.2.*` PASS on the same image. **Refutation:** a second regular file (the meson-built master) would show in the listing; none.

### AC-D18 · #226 box 2 (ticked): "H700 aarch64 SYSTEM squashfs from the same tree: the same."
**Verdict:** UNTESTABLE ? · **Evidence:** the tick records an `unsquashfs -ll` read of the 09-20 tar; this audit did not open an H700 squashfs (`h700-all-20260924-443028ff7a/` exists). **Notes:** the recipe and `--wrap-mode=nodownload` are arch-independent, so the x64 read bears on it; not derived.

### AC-D19 · #226 box 3 (ticked): "pango's H700 arm thread log: `Run-time dependency cairo found: YES 1.18.4` and no `Cloning`."
**Verdict:** UNTESTABLE ? · **Evidence:** a build-log observation of 2026-09-20 (`run 3`); the logs were not re-read here. Consistent with D17.

### AC-D20 · #226 box 4 (ticked): "On the cold H700 aarch64 root after the build, `find build.*/build -mindepth 4 -maxdepth 4 -path '*/subprojects/*/.git'` prints nothing…"
**Verdict:** PASS ✓ (as observed 09-20) · **Evidence:** the tick records the empty find on the cold root. The same find on the **warm** x64 root today prints `glib-2.89.3/subprojects/sysprof/.git` -- a pre-guard clone the box's own caveat excludes ("warm roots keep old clones"). **Refutation:** the guard (`scripts/build:190,221` `--wrap-mode=nodownload`) has **no observed positive in the record**: nothing shows it refusing a constructed missing dependency; the 09-19 DNS-less failure predates it (blindspot 14). Finding F-D20 (Low).

### AC-D21 · #226 box 5 (ticked): "vm-qa on the rebuilt x64 image: every suite PASS."
**Verdict:** PASS ✓ · **Evidence:** `qa-77e7e97515-webdav-a-20260920-1856` (eleven) per the row; at the tip `qa-443028ff7a-…-0116` twelve suites PASS.

### AC-D22 · #226 box 6 (ticked): "Upstream PR opened from a `pr/` branch carrying both changes; linked here."
**Verdict:** PASS ✓ · **Evidence:** `gh pr view 3359 --repo ROCKNIX/distribution`: OPEN, "cairo: update to 1.18.4, stop meson fetching subprojects", head `pr/cairo-1.18`, 1 commit. **Notes:** the cairo override (`projects/ROCKNIX/packages/graphics/cairo/package.mk:1-13`) carries no line saying why an override still exists now that it names the release the generic recipe would (comment-quality lead).

### AC-D23 · #227 box 1 (ticked): "`tools/fork-package-freshness` run on `next` reports every fork-introduced package CURRENT, PINNED (with its reason), INHERITED or LOCAL, and exits 0. Run against a recipe held one release back it reports BEHIND and exits 1 -- the guard shown to fire."
**Verdict:** PARTIAL ⚠ · **Evidence:** run 2026-09-24: **exit 1**, `raofflineproxy 4e9bab484e… BEHIND: 16 behind 0711f0b9b6 (2026-09-23)`; 13 CURRENT, 3 PINNED, 4 INHERITED, 1 LOCAL. The guard's positive is recorded (brotli held back -> BEHIND, 09-20 §59) and the BEHIND today is itself a positive. **Gap:** the criterion's first sentence is not true at `443028ff7a`: the proxy recipe (`package.mk:5-13`) explains the 09-20 pin in prose but has no `# freshness: pinned -- …` line, so the rule's check is red before a `pr/` branch exists (D-WORKFLOW-024). Finding F-D23 (Low).

### AC-D24 · #227 box 2 (ticked): "The rebuilt GENERIC_X64 image: `rclone version` prints 1.75.1; webkitgtk is the 2.52.6 recipe…; vm-qa passes…"
**Verdict:** PASS ✓ · **Evidence:** guest d `rclone version` -> `rclone v1.75.1`; `packages/web/webkitgtk/package.mk:7` `PKG_VERSION="2.52.6"`; twelve suites PASS at the tip. **Notes:** the tick's "its recipe did not change" is loose -- the recipe changed twice in range (`-j4`, the VIDEO comment), not its options.

### AC-D25 · #227 box 3 (ticked): "The H700 image carries the same versions, read from its SYSTEM squashfs."
**Verdict:** UNTESTABLE ? · **Evidence:** not re-read here; the tick itself reads half the versions from the pre-pack image root rather than the squashfs.

### AC-D26 · #227 box 4 (ticked): "`fork-workflow.md` 'When to merge up' names the freshness check; the decision register has D-WORKFLOW-024 citing this issue."
**Verdict:** PASS ✓ · **Evidence:** `fork-workflow.md` delta ("Every package the fork introduces is at its latest upstream release … `tools/fork-package-freshness` exits 0 (D-WORKFLOW-024, #227)"); D-WORKFLOW-024 row read.

### AC-D27 · #227 box 5 (ticked): "The raofflineproxy pin is at `4e9bab484e` with libchdr at `8e7b8bd32b`, built and seen by vm-qa's offline-RetroAchievements suite, or a comment here records why not."
**Verdict:** PASS ✓ · **Evidence:** `package.mk:13` `4e9bab484e…`; `raofflineproxy-libchdr/package.mk` `8e7b8bd32b…` (freshness table: PINNED, follows the submodule); D-QA-030 records the maintainer's "no further VM pass". **Notes:** `raofflineproxy-rcheevos/package.mk:6` still says the submodule follows "the proxy's own pinned commit (64d03d30…)" -- stale beside a correct twin (comment-quality finding).

### AC-D28 · #228 boxes 1-4 (unticked): 2.54 current; the sign-in window on VM and H700; gst-plugins-bad recipe; the pinned line removed with the bump.
**Verdict:** SKIP ○ (SKIP-OPEN) ×4 · **Evidence:** D-WORKFLOW-026 (2.52.6 for the RC), D-WORKFLOW-027 open. `packages/web/webkitgtk/package.mk:5-6` carries the `# freshness: pinned -- … (fork #228)` line beside `PKG_VERSION`, and lines 44-50 the ENABLE_VIDEO-stays-ON paragraph beside the option -- blindspot 48 remedied as the rule asks. **Notes:** box 2 names "vm-qa's OAuth suite", which does not exist in `SUITES` (`tools/vm-qa:56`).

### AC-D29 · #236 own box 1 (unticked): "Every box in A and B is ticked with an observation or moved to its issue with the reason; none is ticked from a log line or a commit hash."
**Verdict:** PARTIAL ⚠ · **Evidence:** B's ticks cite frames and numbers (18 of 21 name a `docs/qa-frames/2026-09-2x/` path or a measured number); A's #121 box is ticked "by inspection … byte-identical" (a hash), against the box's own rule; A's #241/#174/soak and B's #69/#196 are open. **Gap:** one artifact tick; five boxes open; the box is honestly unticked.

### AC-D30 · #236 own box 2 (unticked): "The delivered-but-open issues A closes are closed with a comment naming this round and the build."
**Verdict:** PARTIAL ⚠ · **Evidence:** #45, #47, #121, #131, #181, #152, #153 closed naming the round/build; #190, #193, #194, #199, #195, #202, #208, #210 remain open on device boxes the round has since declared the VM's (D-QA-033) without amending them.

### AC-D31 · #236 own box 3 (unticked): "D's reboot question is asked only after A and B's upgrade rehearsal are done."
**Verdict:** SKIP ○ · **Evidence:** section D (the RG SP) has not started; the rehearsal is green on every cut (19/19 at the tip).

### AC-D32 · #237 boxes 1-3, #255 boxes 1-5, #256 boxes 1-3 (all unticked)
**Verdict:** SKIP ○ (SKIP-OPEN) ×11 · **Evidence:** no commit in the range names them; #255's measurement tool (`solidity.py`) is session scratch, which is what its box 1 asks to fix; #256's PR map is not started (D-WORKFLOW-014 sequences it after #42).

### AC-D33 · #239 boxes 1-3 (unticked): the deliberate reproduction; VM-vs-ES decision; the README's quit-path sentence.
**Verdict:** SKIP ○ (SKIP-OPEN) ×3 · **Evidence:** body edited in the same action as the `/emukill` finding (2026-09-21); `tools/vm-walks/README.md` has no `execute_kill`/quit sentence (`grep`: none) -- box 3 honestly open. **Notes:** the manager walks never launch a game, so the hazard is outside every suite.

### AC-D34 · #240 boxes 1-4 (unticked)
**Verdict:** SKIP ○ (SKIP-OPEN) ×4 · **Evidence:** D-QA-035 records the decision not to automate the reset; `tools/ra-offline-test` changed in range only for blindspot 50 (`98773a4ba9`); the candidate frames live in session scratch (`/workspace/tmp/rocknix-session/frames-d/`), not `docs/qa-frames/`.

### AC-D35 · #244 box 1 (ticked): "Tonight's three are in the log the day they ship (#241 … #242 … #243), each as a claim checked against the build."
**Verdict:** PASS ✓ · **Evidence:** `docs/cloud-sync-changelog.md` § "Long work is a page with CANCEL; offline achievements answer at once; thumbnails at the system's shape (2026-09-22)" carries #241, #242, #243 with on-screen words in backticks that match the source (`SKIPPED - YOU CANCELLED IT` at `GuiCloudTransfer.cpp:368`; the service-down sentence at `RetroAchievements.cpp:505`).

### AC-D36 · #244 box 2 (ticked): "The gap 2026-09-12 -> 2026-09-21 is filled…, each claim checked against `next` before it is written."
**Verdict:** PARTIAL ⚠ · **Evidence:** nine dated sections exist (headings 1894-2162). The closing comment and the 09-22 work log say **eleven of 49 claims were spot-checked by grep**; the box says each claim was checked. **Gap:** the tick is stronger than its evidence.

### AC-D37 · #244 box 3 (ticked): the vocabulary sweep's words are used.
**Verdict:** PASS ✓ · **Evidence:** the 09-22 section read: "back up / restore", "save state", "SAVE STATE MANAGER", "Wi-Fi" spelt as D-UI-022 asks; `vocabulary-check` is not run over the change log (it reads ES strings and scripts), so this is a read, not a mechanical result.

### AC-D38 · #244 box 4 (ticked): "A rule in `.claude/rules/` says the change log is written the day a player-visible change lands."
**Verdict:** PASS ✓ · **Evidence:** `.claude/rules/change-log.md` read (Phase 1.4). **Refutation/notes:** the rule's own shape (`## Title (date)` per landing day) is not followed after 09-22: the 09-23/24 changes (#245/#248/#249/#250/#252/#209/#198/#247/#251) are bullets under the 09-22 heading (Phase 1.8). Finding F-D38 (Low).

### AC-D39 · #251 box 1 (ticked): "The maintainer's choice, recorded here and as a register row: option 2 … D-UI-084. Patch `0016-widgets-message-queue-floor.patch`: `gfx_widgets_font_init` takes the floor as a parameter, 9 for the regular and bold faces, `MSG_QUEUE_MIN_SIZE` 14 for the message queue."
**Verdict:** PASS ✓ · **Evidence:** D-UI-084 row read; the patch read in full: `#define MSG_QUEUE_MIN_SIZE 14.0f`, `gfx_widgets_font_init(…, float min_size)`, `if (scaled_size < min_size)`, six call sites (regular/bold `9.0f`, msg_queue `MSG_QUEUE_MIN_SIZE`) in both the ozone and user-font branches. `pkgcheck retroarch` not applicable (a patch); the image built (x64 run 32, H700 run 21). **Refutation:** a call site left at the old two-argument form would not compile; the build proves none was.

### AC-D40 · #251 box 2 (unticked): "the sign-in banner at 640x480 on the VM framed before and after; on the RG35XX SP, the maintainer's word…"
**Verdict:** PARTIAL ⚠ · **Evidence:** `docs/qa-frames/2026-09-24/251-toast-10px-vs-14px-4x.png` exists (committed **after** the frozen tip, `cce581bc5f`); the device word is open. The 01:25 work-log entry records a first stroke measurement that was wrong (a shorter span) and corrected before the patch was touched -- the measurement tool is session scratch (#255 box 1).

### AC-D41 · #251 box 3 (unticked): "The running change log carries it the day it lands."
**Verdict:** PASS ✓ (box lags) · **Evidence:** `git show 443028ff7a:docs/cloud-sync-changelog.md | grep -c '#251'` = 1 -- the bullet is in the tip commit itself. The box is unticked in the honest direction.

### AC-D42 · #252 box 1 (ticked): "`tools/frame-diff <baseline-dir> <run-dir>` lists the differing boxes per screen; the constructed violation is caught."
**Verdict:** PASS ✓ · **Evidence:** the tick records the one-box arrow test (x 53..110, y 294..360, 1,533 px); `tools/frame-diff` read (compare/accept/boxes; exit 2 with no `BASELINE.txt`); the tip run compared 78 screens in 1 s. **Refutation:** a tool that could not see the arrow would have reported 0 boxes on the twelfth-vs-fifteenth pair; it reported exactly the arrow.

### AC-D43 · #252 box 2 (ticked): "The `frame-diff` suite fails a run with an unclaimed box and passes one whose boxes are claimed; masks cover the clock; the fixtures carry fixed dates; the report names each box and its claim."
**Verdict:** PASS ✓ · **Evidence:** run 17 `FAIL (1), 156 unclaimed` then runs 19/21 PASS (vm-qa-log row 112); the tip: `frame-diff.md` "78 screens … 4 masks … 0 live claims … PASS -- 0 box(es) claimed, 0 unclaimed, 0 missing"; `tools/vm-walks/masks.txt` four rectangles each with a why and the runs they were measured from; `tools/vm-qa` SKIPs (rc 3) without `BASELINE.txt`. **Notes:** `claims.txt` holds only the header, so every box is unclaimed by construction -- the strict state D-QA-038 wants; the baseline was accepted on a VM-only pass first (contradicting D-QA-038's "never on a VM pass alone") and became device-accepted the same night.

### AC-D44 · #252 box 3 (ticked): "Walks exist for the SAVE STATE MANAGER on a 4:3 system, a square-pixel one and a turned one -- `manager-nes`, `manager-gb`, `manager-fbn` … (frames `docs/qa-frames/2026-09-23/252-walk-manager-*`)."
**Verdict:** PASS ✓ (with a filing gap) · **Evidence:** `tools/vm-walks/suite.txt:98-100` defines the three; the tip's `walks.log` ran all three (5 frames each). Only `252-walk-manager-{fbn,nes}-1280x800.png` are filed -- no `gb` frame, though the tick cites three.

### AC-D45 · #252 box 4 (unticked): walks for the SCREENSHOTS list and the viewer.
**Verdict:** SKIP ○ (SKIP-OPEN) · honest; the reason (`StartupSystem` cannot land on `imageviewer`) is in the box.

### AC-D46 · #252 boxes 5-6 (ticked): the rule and D-QA-038; the change log.
**Verdict:** PASS ✓ ×2 · **Evidence:** `generic-x64-vm-testing.md` § "The frames are compared, not only counted (#252)" read; D-QA-038 row read; the change log's `#252` bullet read.

### AC-D47 · #253 box 1 (unticked): "`tools/archaeology --no-gh 'INCREMENT PER SAVE|incrementalsavestates'` lists D-UI-057, D-UI-059, D-UI-069 and D-UI-083 and the 2026-09-15/18 work-log entries; `--issue 225` lists the 09-19 comment and D-QA-039."
**Verdict:** PARTIAL ⚠ · **Evidence:** run 2026-09-24 (read-only, exit 0): lists **D-UI-083**, the 09-18 work-log entries (00:20, 00:55, 01:20) and the 09-15/18 commits -- and **not** D-UI-057, D-UI-059 or D-UI-069, whose rows do not contain either term (D-UI-059 says "INCREMENTAL SAVE STATES"). The tool works; the box's expectation is mis-specified for the terms it names. `--issue 225` needs `gh` and was not run.

### AC-D48 · #253 box 2 (unticked): "`docs/work-logs/INDEX.md` is committed and `tools/work-log-index --check` passes on `next`; a push that changes a work log without it prints the guard's warning (proven once against a constructed push)."
**Verdict:** PARTIAL ⚠ · **Evidence:** `work-log-index --check` -> current (exit 0); INDEX.md committed with every log since. The warning branch (`.githooks/pre-push:226-228`) has **no recorded positive**; #254's dry-run proof exercised `ceremony-check`'s `BLOCK index`, a different path. Blindspot 14 shape.

### AC-D49 · #253 boxes 3-4 (unticked): the register rows exist and `register-check` passes; the rules carry the three sentences.
**Verdict:** PASS ✓ ×2 (boxes lag) · **Evidence:** D-QA-039, D-WORKFLOW-026, D-WORKFLOW-027, D-UI-083 rows read; `register-check` 344 IDs clean; `decision-register.md` delta carries "Before putting anything to the maintainer as pending… `tools/archaeology`", "A decision the maintainer makes in an issue comment… gets its row the same day", "An issue's 'decisions pending' section names open-table IDs".

### AC-D50 · #253 box 5, #254 boxes 3-5 (future-dated or the maintainer's)
**Verdict:** SKIP ○ ×4 · four-weeks-on checks and D-QA-040's numbers.

### AC-D51 · #254 box 1 (ticked): "`tools/ceremony-check` passes on `next` at the time of this commit … and fails on constructed violations -- … `BLOCK friction`; … `BLOCK guards`; … `git push --dry-run origin next` … `BLOCK index`."
**Verdict:** PASS ✓ · **Evidence:** `./tools/ceremony-check --no-gh` 2026-09-24: nothing overdue (exit 0); the three positives are recorded in the box with the `CEREMONY_TODAY` override that made them constructible. **Refutation (weaknesses recorded, not disproofs):** `:121` the retro marker is any work-log heading matching `\bretro\b|retrospective`; `:147` a friction line's `issue: guard` is never checked against a guard that exists; `.githooks/pre-push:55,229` the `next` gate runs only when `$hooks_root/tools/ceremony-check` exists in the pushing worktree -- a push from a worktree without the tool skips the gate silently (engineering-practices: guards fail closed). Finding F-D51 (Medium).

### AC-D52 · #254 box 2 (unticked): "`fork-checks.yml` is green on `next` after this lands, and red when the check fails (one constructed red run, then reverted)."
**Verdict:** PARTIAL ⚠ · **Evidence:** `gh run list --workflow fork-checks.yml --limit 6`: six `push … success` on 2026-09-24; the workflow read (three steps: index, register, ceremony-check with `GH_TOKEN`). No red run was constructed (the box is honest). Blindspot 14: a CI gate that has never been seen red.

### D addendum · AC-D01 resolved
**Verdict:** PASS ✓ · **Evidence:** the one `powerstate` line in guest d's boot journal is `systemd[1]: Started powerstate.service.` -- the unit's start, not the `arithmetic` error the issue was about; no error line. **Refutation:** an arithmetic line would have shown in the same grep.

---

## A. Offline RetroAchievements

### AC-A01 · #162 boxes 1-3 (ticked): a decision row names the options; the exit/reconnect sentences (moved to #173); the award recorded once the link returns, on the guest and on a handheld.
**Verdict:** PASS ✓ / SKIP ○ (moved to #173) / PASS ✓ (PRE-RANGE) · **Evidence:** D-RA-001/004/007 rows read; box 2 struck in-body and re-homed; box 3's guest half is the `ra-offline` suite (`qa-d55169e59e-ra-offline-d-20260921-1745` exists under `/workspace/artifacts/rocknix-images/`) and the device half is the RC-7 Mario Tennis log quoted in the tick (D-RA-007: no hotspot). **Refutation:** a tick with no register row or no flush evidence would fail it; both exist. **Notes:** the device proof is a paraphrased log, not a filed journal excerpt.

### AC-A02 · #164 boxes 1-3 (ticked): the design note; D-RA-002 settled; the pin and the contribute-back list.
**Verdict:** PASS ✓ ×2, PARTIAL ⚠ (box 3) · **Evidence:** `docs/ra-offline/2026_09_13-phase-1-design-note.md` exists; D-RA-002 read. Box 3 names pin `64d03d30…`; `package.mk:13` pins `4e9bab484e…` since `41f86ec9ba` -- the body was not amended and two shipped comments still carry the old pin (`raofflineproxy-ctl:193`, `raofflineproxy-rcheevos/package.mk:6`) while `raofflineproxy-libchdr/package.mk:6` was updated. Finding F-A02 (comment quality, Low).

### AC-A03 · #175 boxes 1-3 (ticked): the writer named; a failed boot-time login never flips the switch and retries when the network arrives; a 640x480 frame of the menu still holding RETROACHIEVEMENTS.
**Verdict:** PASS ✓ (PRE-RANGE, mechanism present at the tip) · **Evidence:** ES `NetworkThread.cpp:158` `CheevosRetry::nextDelayMs(...)`, `:168/211` `setOnline`; `CheevosRetryTests` in the unit run (119 cases green); nine `175-*` frames exist under `docs/qa-frames/2026-09-14/`. **Refutation:** the retry was proven with a deterministic resolver override, not a real lag; nothing in range re-proves it. The box's mechanism survives at the tip; its behaviour on a real hotspot is unobserved (note, not a gap in the box).

### AC-A04 · #176 boxes 1-3 (ticked): setsettings redacts credential values; `rocknix-evidence` scrubs with a harness check; `grep -c` of a planted value over `exec.log` and the bundle -> 0.
**Verdict:** PASS ✓ (PRE-RANGE; extended in range) · **Evidence:** `001-functions` `redact_credentials` (Phase 1.9 diff: `retroachievements\.key`, single quotes, bare `t=` -- `9a2c9228aa`, #186 PL-29); harness cases r and s in the PASSED run. **Refutation:** the bare `[pty]=` rule applies only on lines matching `RetroAchievements|raofflineproxy|dorequest|127.0.0.1:8080` (`001-functions:82`) -- a `p=` on an unrelated line is not masked; by design (a `p=` elsewhere is not a credential), noted.

### AC-A05 · #183 boxes 1-3 (ticked): the startup index runs on a connected rebooted guest and VIEW THIS GAME'S ACHIEVEMENTS appears; the cause named; a unit test or walk frame pins it.
**Verdict:** PASS ✓ ×3 · **Evidence:** ES `main.cpp:788-795` starts the indexes in the `--no-splash` branch (in range, `cce9ab12a`); `NetworkThread.cpp:232` the link-up rerun; D-RA-018; frame `183-game-options-view-achievements-640x480-3387cf5da0.png` exists; #236 B ticked "guest a booted to the carousel by ~20 s… a newly added ROM gets its achievements". **Refutation:** the link-up rerun path (`startIndexesAtStart(window, true)`) has no observed positive anywhere in the record (both proofs took the first path) -- a note for Phase 3, not a failure of the boxes as written.

### AC-A06 · #184 boxes 1-2 + the ten note boxes (ticked): every note has a home and a frame or the maintainer's word; the notes' branch merged for the sixth candidate.
**Verdict:** PASS ✓ · **Evidence:** thirteen `184-*` frames under `docs/qa-frames/2026-09-14/`; D-UI-053..056, D-RA-012/013/014 rows; `8c03cbb6e7` (the index-fed scan) and patch 004 in range. **Refutation:** "or the maintainer's word" makes the device half unfalsifiable; the VM half is framed.

### AC-A07 · #186 boxes 1-3 (ticked): every PL box ticked with proof; `lint-audit-artifacts` passes; PL-18's rows and PL-19's bodies.
**Verdict:** PARTIAL ⚠ · **Evidence:** section P above: 25 PASS, 4 PARTIAL, 1 FAIL (PL-11), 1 reversed (PL-07), 3 UNTESTABLE. The lint PASSes today (run 2026-09-24) while the folder's index reads `outcome: open` for 32 of 33 -- the lint reads the Phase 7 outcomes table, which is complete, and never the YAML index, which is not -- the two sources disagree (finding F-A07, Low, tool). `register-check` clean. **Gap:** PL-11's draft is false since D-UI-078; PL-07's reversal and PL-04's stale count are not annotated in the punch list or the issue.

### AC-A08 · #188 boxes 1-4 (ticked): harness: a helper that prints `DONE` then sleeps stamps rc 0; the same for `scan`; the helper ends within seconds of `DONE` when the budget is spent; VM: a top-up over a large index reads `WHEN YOU CAME ONLINE - COMPLETED · N GAMES READY`.
**Verdict:** PASS ✓ ×3, PARTIAL ⚠ (box 4) · **Evidence:** D-RA-019; `07415e7946` (ctl + `raofflineproxy-cache-indexed` `wait_for_badges`, harness); the harness PASSED today. Box 4's frame `189-row-completed-122-ready-640x480-b22f345923.png` reads `COMPLETED · 122 GAMES READY` -- the AC's head `WHEN YOU CAME ONLINE -` is not in the frame's README, and the 09-21 RC frame shows a scan's `LAST … - COMPLETED`. **Notes:** `raofflineproxy-cache-indexed:69-83` reaches into `image_cache._image_download_executor` (a private name) -- a pin bump could raise after `DONE` (Phase 3 lead).

### AC-A09 · #188 box 5 (unticked): the RG SP's next top-up stamps COMPLETED.
**Verdict:** UNTESTABLE ? (UNTESTABLE-DEV).

### AC-A10 · #189 boxes 1-2 (ticked): while a ctl top-up runs the row reads the run's progress EN/FR at 640x480; when it ends it reads the stamp.
**Verdict:** PASS ✓ ×2 · **Evidence:** ES `d86754c57` (in range) `CloudText::parseRunningProgress` (`CloudText.cpp:802`) with `RUNNING_STALE_AFTER_S = 900` (`CloudText.h:442`); ctl `mark_running` at `:1144/1195` for the top-up with `index= total= name=`; seven `189-*` frames exist (EN and FR, 2026-09-14). **Refutation:** `mark_running images` (`:1279`) and `mark_running refresh` (`:1309`) write `at=<epoch>images` -- unparseable -- but those verbs have no row; the top-up path the box names is well-formed.

### AC-A11 · #189 box 3 (unticked): a stale progress file is ignored and removed.
**Verdict:** PARTIAL ⚠ · **Evidence:** the interface ignores one older than 900 s (above); the ctl removes it only through `unmark_running` on its own EXIT/`:1208/1517` -- a run that died leaves the file until the next run's mark replaces it; `do_topup`'s early `exit 0` inside `TOPUP_INTERVAL` clears nothing (lead). Honestly unticked.

### AC-A12 · #189 box 4 (ticked): harness: the ctl writes and removes the file around a fake helper's run.
**Verdict:** PASS ✓ · **Evidence:** harness (section t) in the PASSED run; ctl `mark_running`/`unmark_running` `:685-689`.

### AC-A13 · #190 boxes 1-3, 5 (ticked): the device's list within 3 s with the state file stale-online; the wait ends within 15 s with the resolver dead; 250 games in one `summary` read; the RC-7 cause named.
**Verdict:** PASS ✓ (boxes 2, 3, 5), PARTIAL ⚠ (box 1) · **Evidence:** ES `OfflineAchievements.cpp:149-167` `proxyOffline()` (no address -> offline, whatever the file says); `RetroAchievements.cpp:402-424` `getUserSummaryFromDevice` = one `raofflineproxy-ctl summary`; patch 010 (`X-RA-Store-Only`, `OfflineProxyUrl.h:29`); frames `190-summary-offline-{stale-state,fr}-640x480-a6d032bf5e.png` and `190-offline-summary-640x480-77e7e97515.png` exist. Box 1 measured **4.6 s** against a 3 s criterion, rescued by an inferred 1.7 s tool latency (D-RA-023 reworded it in a comment; the body still says 3 s). **Refutation:** `RetroAchievements.cpp:602-611`: offline with no device summary the code still "asks the web" (bounded 15 s) -- a ctl failure offline reproduces a shorter PLEASE WAIT; and `proxyOffline()` returns false when `online_state.json` does not exist yet (a fresh toggle-on before the monitor's first write goes the online way). Both are leads (Phase 3), not disproofs of the boxes' shapes.

### AC-A14 · #190 box 4 (unticked): the RG SP with Wi-Fi off.
**Verdict:** UNTESTABLE ? (UNTESTABLE-DEV; D-QA-033 declared it the VM's, the box was not amended).

### AC-A15 · #193 boxes 1-2 (unticked): the percentage and the bar on one baseline at 640x480 and 1280x800, online and offline; the offline line EN/FR.
**Verdict:** PARTIAL ⚠ ×2 · **Evidence:** ES `e2023b2f3` (in range) reworks the bar; frames `193-game-page-offline-fr-640x480-66bfd20330.png` (FR, before D-UI-067 shortened the line) and `193-160-game-page-offline-640x480-77e7e97515.png` (EN); the `.po` carries D-UI-067's strings. **Gaps:** no 1280x800 frame, no online frame, no frame of the shortened French line; the boxes are unticked though the 2026-09-21 comment claims proof on the RC.

### AC-A16 · #193 box 3, #194 box 3, #199 box 5 (unticked): the RG SP's word.
**Verdict:** UNTESTABLE ? ×3 (UNTESTABLE-DEV). **Notes:** the maintainer's 2026-09-22 comment on #242 ("it correctly shows … that I am offline, that the text box extended to the correct point") bears on #194's toast and was not carried to #194.

### AC-A17 · #194 box 1 (ticked): a VM frame of the login toast at 640x480 through the proxy; the backdrop covers the text.
**Verdict:** PASS ✓ · **Evidence:** RetroArch patches 0013 (`(offline)` suffix; `X-RA-Offline` header from proxy patch 011) and 0014 (backdrop follows the font); frames `194-login-toast-offline-640x480-66bfd20330.png`, `194-offline-login-toast-640x480-77e7e97515.png` exist. **Refutation:** no before-frame of the uncovered text exists (the box allowed "the defect is shown and fixed"); patch 0014 changes widget scaling at every context reset for all notifications -- wider than the issue (Phase 3 note).

### AC-A18 · #194 box 2 (unticked): the toast's words, as decided with the maintainer (patch, EN/FR).
**Verdict:** PASS ✓ (box lags) · **Evidence:** D-RA-022 (`Logged in as "Name" (offline).`) read; patch 0013 shipped in RC-11. The box was never ticked.

### AC-A19 · #199 boxes 1-2, 4 (ticked): patch 012 answers an uncached image at once; the summary lists within 6 s with icons absent; the fixture's README.
**Verdict:** PASS ✓ ×3 · **Evidence:** patch `012-offline-image-miss.patch`; harness "four 012 predicates" in the PASSED run (the tail shows the three `012 / #199` cases); ES `0ec3f43ae` (in range: `WebImageComponent.cpp`, `OfflineProxyUrl`); frame `199-summary-offline-200-games-icons-absent-640x480-a6d032bf5e.png`. **Refutation/notes:** the box says "placeholders"; the comment corrects it to blank slots; the issue's premise (a 34 s stall) was withdrawn in-body. Patch 012 matches the header's exact spelling (`X-Ra-Store-Only` from urllib would take the fetch path) -- the interface sends the exact spelling.

### AC-A20 · #199 box 3 (unticked): the same games cached by the top-up with icons; the list within 6 s.
**Verdict:** SKIP ○ · **Evidence:** the comment records it as hardening, not a gate (D-RA-023); unticked and unamended.

### AC-A21 · #211 box 3 (ticked): the awards still reach RetroAchievements after the flush.
**Verdict:** PASS ✓ · **Evidence:** `qa-d55169e59e-ra-offline-d-20260921-1745` **exists** (the A lead said not found; `ls` shows `-1739` and `-1745`); the tick quotes `Flush complete: total=1 flushed=1` and the API record; #236 B 031-032 ticked on it.

### AC-A22 · #211 boxes 1, 2, 4, 5 (unticked): the VM reproduces or not; two offline unlocks leave RetroArch running; the player sees a toast; an upstream report exists.
**Verdict:** PARTIAL ⚠ (boxes 1, 4, 5 answered in comments, unticked), UNTESTABLE ? (box 2 device half) · **Evidence:** patch `0015-video-thread-wrapper-run-a-command-once.patch` (in range, `e5d14d4220`; the `have_cmd` gate); `tools/retroarch-wrapper-test` PASS 2000/2000 per the comments; upstream libretro/RetroArch#19577 named in the comments (closed the same hour: master already gates); the VM non-reproduction recorded in comments; the soak's eight Dr. Mario unlocks and `Flush complete: total=8 flushed=8` (D-QA-037) in #236's 2026-09-22 comment. **Gaps:** four answered boxes left unticked; `tools/retroarch-wrapper-test` defaults to a source path outside the tree and is wired into no suite (0 references in `tools/vm-qa`) -- #225's "regression check exists" is a tool nobody runs (finding F-A22, Low).

### AC-A23 · #212 boxes 1, 3, 4, 6 (ticked): `images` fetches exactly the missing ones, idempotent; offline every badge and icon of a cached set is served; a ceilinged run says what is left and resumes; the pass refuses offline.
**Verdict:** PASS ✓ ×4 · **Evidence:** `raofflineproxy-cache-images` (new, `4a0b094022`), ctl `do_images` (`:1269-1291`) through `refuse_unless_ready`/`is_online`; the counts in the ticks (566 -> 522 -> 0; a 5 s ceiling -> `>>> done 40|522`, exit 1). **Refutation/notes:** box 1's "images deliberately removed" became "the guest's own cache was already that incomplete" (the idempotency read from counts, not a planted set); box 3 proven by two hand requests, not a launch's log. `raofflineproxy-cache-images:6` cites **`D-RA-0xx`** -- a placeholder register ID that `register-check` never sees because it does not scan `network/raofflineproxy/sources` (finding F-A23, Low: comment quality + tool scope).

### AC-A24 · #212 boxes 2, 5 (unticked): no cached game missing an image after a scan; the RG SP's 956 close.
**Verdict:** SKIP ○ / UNTESTABLE ? (UNTESTABLE-DEV).

### AC-A25 · #213 boxes 1-5 (ticked): a truncated or malformed body is never published; `--verify` re-fetches a damaged badge; bounded and resumable; runs on the top-up tail only, never offline.
**Verdict:** PASS ✓ ×5 · **Evidence:** patch `013-validate-a-cached-image-before-publishing-it.patch` (Content-Length + PNG magic + IEND), `0d74ce702b` (one budget), D-RA-024; `run_image_pass scan` without `--verify`, `topup … --verify` (ctl). **Refutation/notes:** boxes 1-2 were proven with a **host** fixture "through the real function", not on the image's Python (upgrade-and-install: verify on the VM) -- a lead; the verify slice is "at most half a pass's budget" after both passes, so a busy top-up leaves it seconds.

### AC-A26 · #213 box 6 (unticked): the device's own store passes a full verify once.
**Verdict:** UNTESTABLE ? (UNTESTABLE-DEV).

### AC-A27 · #220 boxes 1-5 (unticked; closed not planned, premise withdrawn)
**Verdict:** SKIP ○ (SKIP-NP) ×5 · **Evidence:** D-RA-025 records that `backuptool` already strips `.key/.password/.token`, blanks `retroarch.cfg`'s credentials and holds the proxy folder back (D-INFRA-010); the closer names its own blindspot ("I never checked the artifact"). **Notes:** D-RA-025 was first written as an open decision and then "corrected in the register in the same action" -- the append-only rule wants a new row citing the old; Phase 3 checks the register's history.

### AC-A28 · #221 boxes 1-4 (unticked; open, no work)
**Verdict:** SKIP ○ (SKIP-OPEN) ×4 · **Evidence:** `backuptool` had no commit in range. **Notes:** #236 B 043 ticked "no leak warning printed on the clean archive" on the RC -- which contradicts #221's premise ("fires on a clean archive") unless the archive shapes differ; one VM backup would settle it (Phase 3 lead).

### AC-A29 · #223 boxes 1-6 (unticked; open design)
**Verdict:** SKIP ○ (SKIP-OPEN) ×6 · **Evidence:** `raofflineproxy-refresh` (`87d9969bbb`, `609c6a14be`, `901dd7644a`) keeps patch 005's oldest-first order; nothing claims #223. **Notes:** `raofflineproxy-refresh`'s `note()` prints to stdout where the sibling helpers use stderr, so `raofflineproxy-ctl refresh` interleaves prose with `>>>` lines (lead).

### AC-A30 · #224 boxes 1-6 (unticked; open)
**Verdict:** SKIP ○ (SKIP-OPEN) ×6 · **Evidence:** `grep -rn 'REFRESH ACHIEVEMENT STATUS' es-app/src` -> 0: the row does not exist at `75ca1dac2`; the backend verb does (`raofflineproxy-ctl refresh`, `:1293-1315`). **Notes:** D-UI-077 names a row that ships nowhere yet; `raofflineproxy-ctl refresh --bogus` prints usage and exits **0** (`exit ${EX_USAGE}`, undefined at `:1297/1300`; 0 definitions in `/usr/bin/raofflineproxy-ctl` on guest d) -- finding F-A30 (Low).

### AC-A31 · #225 boxes 1-5 (unticked; closed "delivered" 2026-09-23)
**Verdict:** PASS ✓ (box 1), PARTIAL ⚠ (box 2: the report's text not re-read), PARTIAL ⚠ (box 3: the check exists, runs nowhere), SKIP ○ ×2 (boxes 4-5 dropped by the maintainer's scope cut, D-QA-039) · **Evidence:** patch 0015 in range; upstream #19577 named; `tools/retroarch-wrapper-test` present. **Gap:** closed as delivered with **five unticked boxes and an unamended body** (issue-tracking: edit the body in the same action) -- finding F-hyg.

### AC-A32 · #242 boxes 1-3 (ticked): the cause named from the device's log; offline with the toggle on the game page never asks the web (cached page / not-saved sentence / service-down sentence, EN/FR, at once and a minute later); the ES change re-cut per D-QA-032.
**Verdict:** PASS ✓ (box 1), PARTIAL ⚠ (box 2), PASS ✓ (box 3) · **Evidence:** ES `c8b03e3d6` (in range): `RetroAchievements.cpp:493-506` the service-down sentence with `LOG(LogWarning) … not asking the web`; proxy patch `015-bounded-name-lookup.patch`; frames `242-game-page-offline-resolver-waits-640x480-f2f23da875.png` and `242-service-down-sentence-640x480-f2f23da875.png` exist (the first is byte-identical to the 09-21 `193-160` frame -- the page rendered pixel-identically, as the A lead checked against the raw capture; not a re-filed frame); vm-qa row 100; the maintainer's device confirmation 2026-09-22. **Gaps (box 2):** proven EN only (the French string is in the catalogue), the cached-game shape only (the "not saved on this device yet" branch rests on the RC-6 frame), and 25 s after going offline (the "minute later" case argued, not run).

**A summary:** across #162 #164 #175 #176 #183 #184 #186 #188 #189 #190 #193 #194 #199 #211 #212 #213 #220 #221 #223 #224 #225 #242 -- PASS 42, PARTIAL 15, FAIL 0 (PL-11's FAIL is in P), SKIP 26, UNTESTABLE 8 (91 boxes). The FAIL-shaped defects here are in shipped comments and the ctl's usage exit, not in what the boxes claim.

---

## B. Save states, captures, rotation and aspect, the crash path

### AC-B01 · #195 box 1 (ticked): "With SHOW CLOCK IN 12-HOUR FORMAT on, every row of the SAVE STATE MANAGER shows its time with AM/PM (`09/13/2026 9:07 AM`); with it off, the 24-hour form … follows the switch live … Frames at 640x480, both settings."
**Verdict:** PASS ✓ · **Evidence:** ES `8b7340f5b` (in range): `TimeUtil.cpp:81/99/203` read `Settings::ClockMode12()` live; `TimeText` pure + `TimeTextTests` (7 cases, in the 119-case run); frames `195-manager-12h-{en,fr}-640x480-66bfd20330.png`, `195-save-state-manager-{12h,24h}-640x480-77e7e97515.png` exist; #236 B 052 ticked "22:30 with the setting off, 10:30 PM with it on". **Refutation/notes:** the shipped form is padded (`02:17 AM`, D-UI-066); the box's example `9:07 AM` was never amended -- the register supersedes the body (blindspot 27 shape).

### AC-B02 · #195 box 2 (ticked): a French 12-hour row still tells morning from evening (FR frame).
**Verdict:** PASS ✓ · **Evidence:** D-UI-066 (literal AM/PM in French); `195-manager-12h-fr-640x480-66bfd20330.png` exists.

### AC-B03 · #195 box 4 (unticked): "The same switch governs the interface's other player-facing times … (the RetroAchievements page's LAST line …), or the row records why not."
**Verdict:** PASS ✓ (box lags) · **Evidence:** `GuiRetroAchievementsSettings.cpp:198` `Settings::ClockMode12() ? " %I:%M %p" : " %H:%M"`; the commit message of `8b7340f5b` says the LAST line already read the switch. A true, unticked box (finding F-hyg).

### AC-B04 · #195 boxes 3, 5, 6 (unticked): a legible date for a save not from today (the maintainer's call); the RG SP's word; the menu map notes the format.
**Verdict:** SKIP ○ (open decision), UNTESTABLE ? (UNTESTABLE-DEV), FAIL-shaped but open ○ (`docs/es-menu-map.md:80-100` says nothing about the clock switch -- genuinely undone, honestly open).

### AC-B05 · #196 box 1 (ticked): "`es_savestates.cfg` with Batocera's `libretro` entry … is installed where the interface reads it (`/storage/.config/emulationstation/` or beside the binary -- confirmed by the interface taking the file path: a launch from a slot passes `-state_slot N -state_file "..."` and no `.bak` appears…)."
**Verdict:** PARTIAL ⚠ · **Evidence:** `projects/ROCKNIX/packages/ui/emulationstation/config/common/es_savestates.cfg` (new, `dee5d6dd0e`) with `<emulator name="retroarch" …>`; ES `SaveState.cpp:118-142` sends `-state_slot N -state_file` / `-autosave 1 -state_file` when `racommands` is false; `SaveStateConfigFile.cpp:188-190` reads `/storage/.config/emulationstation/es_savestates.cfg` first, the binary's directory second; guest d has the file and the harness section v (20 PASS) proves the launcher contract. **Refutation, found:** the box's own text names the `libretro` entry while the shipped one is `retroarch` (comment 11 explains; the body was not amended). **And the install path is only half what the comments say:** `userconfig-setup:13` copies `/usr/config/*` into `/storage/.config/` with `--exclude={es_features.cfg,es_systems.cfg}` -- **`es_savestates.cfg` is not excluded**, so on a clean install it lands as a regular copy and the `ln -s` at `:55` fails silently (`>/dev/null 2>&1`). Guest d, a fresh install of the tip (7 boots, no `last_*` file): `es_features.cfg` and `es_systems.cfg` are symlinks, `es_savestates.cfg` is a 1518-byte regular file dated with the image's mtime, byte-identical to `/usr/config`'s. An in-place update runs `post-update`'s `mv` + `ln -s` and repairs it. So today the interface reads the same bytes either way; the header comment in `es_savestates.cfg` ("userconfig-setup links it into /storage/.config/emulationstation on first boot") and the comment at `userconfig-setup:51-52` are untrue of a clean install, and a future change to the shipped file would not reach a fresh device until its first update. Finding **F-B05** (Medium: upgrade-and-install § "read both, write the new one" -- the clean-install path diverges from the upgrade path; comment quality).

### AC-B06 · #196 box 2 (ticked): "`runemu.sh`/`setsettings.sh` honour `-state_file`: a file ending in `.auto` -> `savestate_auto_load = true`; any other -> RetroArch started with `-e <N>`…; harness cases."
**Verdict:** PASS ✓ · **Evidence:** `runemu.sh` `parse_savestate_arguments "$@"` and `--state_file=` ahead of `--controllers=` (Phase 1.9 diff); `setsettings.sh` `set_autosave` (`*.auto` -> `SETAUTOLOAD=true`, `SLOT=-1`; numbered -> ` -e N` on stdout); `last-good-scripts-test` section v (20 PASS) in the 2026-09-24 run. **Refutation:** a state file with spaces/parentheses is read from argv whole -- case v proves "Mario Tennis - Power Tour (USA, Australia)"; a non-numeric slot emits no `-e` (the fragment is eval'd).

### AC-B07 · #196 box 3 (ticked): VM proof: launch from slot N loads it, quit -> AUTO SAVE carries the quit time, slot N untouched; an in-game save lands in a numbered slot as INCREMENTAL SAVE STATES says.
**Verdict:** PARTIAL ⚠ · **Evidence:** frames `196-manager-before-launch-24h-…`, `196-manager-after-quit-640x480-66bfd20330.png` exist; comment 11's `-e 1`, `found_last_state_slot: #1`, `.state.auto` mtime. **Gap:** the "in-game save (Menu+L2) lands in a numbered slot" clause has no observation in the tick -- it was proven under #209 on 2026-09-23 through RetroArch's command port on a later launcher; the tick predates its evidence (blindspot 13 shape).

### AC-B08 · #196 box 4 (ticked): Batocera's `001-no-next-slot.patch` applied (or the decision not to).
**Verdict:** PASS ✓ · **Evidence:** ES `1c6763a89` (in range): `SaveState.cpp` +10/-22, `GuiMenu.cpp` -1 (INCREMENT SLOT gone), `.po` -6; D-UI-057; and D-UI-069 (no renumbering, a deliberate divergence, `8d7213712`).

### AC-B09 · #196 box 5 (ticked): upgrade: a VM from the previous image with an auto save and slots, updated in place, "shows the same tiles and launches each of them".
**Verdict:** PARTIAL ⚠ · **Evidence:** `tools/vm-upgrade-rehearsal` on the tip: `PASS saves and save states byte-identical` (four seeded files) -- run `qa-443028ff7a-upgrade-from-b245fd12ac-20260924-0145`, 19/19. **Gap:** byte identity is an artifact check; "shows the same tiles and launches each of them" was deferred by the tick to #236 A's manager box, which is open. The fixture states are junk files, so the launch half cannot be observed by the rehearsal as written.

### AC-B10 · #196 box 6 (unticked): "START NEW GAME unchanged (no auto save at quit, as upstream); `docs/es-menu-map.md` says what LAUNCH from a slot and START NEW GAME do to the auto save."
**Verdict:** PARTIAL ⚠ (half done, honestly open) · **Evidence:** `docs/es-menu-map.md:80-100` says exactly what LAUNCH on a slot, LAUNCH on AUTO SAVE and START NEW GAME do (read); harness case v `-autosave 0` alone -> both off. No VM observation of a START NEW GAME session ending without an auto save.

### AC-B11 · #196 box 7 (ticked): the RG SP's word.
**Verdict:** PASS ✓ (as a word) · **Evidence:** the maintainer, 2026-09-17, on build 15: "The save state manager quit and auto-save did work as intended." **Notes:** every later cut changed the launcher (`c0c2d15179`, `2337c07f73`); the word is for build 15.

### AC-B12 · #196 box 8 (unticked): upstream proposal.
**Verdict:** SKIP ○ (SKIP-OPEN; D-WORKFLOW-014 sequences it).

### AC-B13 · #197 boxes 1-4 (unticked; closed not planned)
**Verdict:** SKIP ○ (SKIP-NP) ×4 · **Evidence:** D-UI-059 ("dates only … align with Batocera"). **Notes:** the menu map line 85 documents the mode-dependent ordering (`SLOT n` under DO NOT INCREMENT) that `GuiSaveState.cpp:239-248` implements.

### AC-B14 · #202 box 2 (ticked): VM frames at 640x480 EN/FR beside RC-12 build 2's.
**Verdict:** PASS ✓ · **Evidence:** `202-manager-labels-{en,fr}-640x480-f2ee6415cd.png`, `202-manager-title-fr-640x480-bc26baa60d.png` exist; ES `9161d602f` (`pointsUnderSmall = 1`, present at the tip via `34523d1ac`). **Refutation:** the 480x320 panels are not framed (the label rule is screen-relative; noted).

### AC-B15 · #202 box 1 (unticked): the RG SP's word.
**Verdict:** UNTESTABLE ? (UNTESTABLE-DEV; the RG SP has sat on build 15 since 2026-09-17).

### AC-B16 · #205 box 1 (ticked): on the RG SP, after YES the manager responds within a frame or two -- the maintainer's own confirmation.
**Verdict:** PASS ✓ (as a word) · **Evidence:** the tick quotes the maintainer on build 10 (2026-09-17): "deletions show up quickly".

### AC-B17 · #205 box 2 (ticked): "The retired row is still written **before** the file goes: after a deletion, the manifest's `retired` array has the row … and the file is absent (read from the device, `jq`, read-only)."
**Verdict:** PASS ✓ (with a provenance note) · **Evidence:** `cloud_capture --retire --unlink`: the retire step (`:1299+`) runs before `finish()` unlinks (`:237-244`); `tools/cloud-round-trip` CAP13 (a)-(d) PASSED on guest b (build 12, per #207 box 5's tick); the VM journal order `queued -> --retire -> deleted` (build 9). **Refutation:** the box says "read from the device"; the device read (comment 8) covered the timing line, not the manifest row -- the row was read on the VM. **Also found (F-B17, Medium):** `cloud_capture:1308-1316` refuses a path outside `${ROOT}` (`RC=1`, `continue`) and `finish()` then unlinks **every** `RETIRE_PATHS` when `rc != 2` -- a `--retire --unlink <outside path>` writes no row and deletes the file as root. ES only passes repository paths and the header (`:83`) says "removes exactly the files --retire was handed", but D-CLOUD-053's contract (record before unlink) is not honoured on that branch, and `--adopt` refuses the same class (`:549-556`).

### AC-B18 · #205 box 3 (struck, superseded by D-CLOUD-132): no `--rescan` after a deletion.
**Verdict:** PASS ✓ · **Evidence:** D-CLOUD-132 row; the ES worker runs `--retire --unlink` only (`SaveStateBookkeeper`); the tick records "no rescan line" on build 9. The box is struck in place with the row -- the one correctly amended box in this set.

### AC-B19 · #205 box 4 (ticked): the refusal while a sync runs is unchanged.
**Verdict:** PASS ✓ · **Evidence:** `GuiSaveState.cpp:409` (DELETE) and `:460` (COPY) gate on `ThreadedCloudSync::isRunning()`; frame `206-manager-copy-refused-during-sync-640x480-6c0c13dc4e.png` exists (the COPY twin; the DELETE sentence differs only in its verb).

### AC-B20 · #205 box 5 (ticked): proven on guest d with the frame tool, then confirmed on the RG SP with the device's `(--retire, N ms)` number recorded.
**Verdict:** PASS ✓ · **Evidence:** frames `205-manager-yes-first-changed-frame-640x480-{586d2334fd,a4dfd97ca5,e287f9d21a}.png` and `…-0923b9ee9f.png` exist; the device numbers `(--retire --unlink, 1160 ms)` / `970 ms` read through `tools/device-act` (comment 8). **Notes:** the recorded number is the whole unit on the worker, not the interface-thread `--retire` the box was written for; blindspot 45's point stands in the tick.

### AC-B21 · #206 boxes 1-4 (ticked): after COPY TO FREE SLOT the manifest has the new path with the source's sha; the next `--full` keeps it; a copy during a sync is refused like DELETE; the manager stays quick.
**Verdict:** PASS ✓ ×4 (with two provenance notes) · **Evidence:** `cloud_capture --adopt … --from …` (`:351-361` validation, `:539-556` membership, STEP 7b `:1231-1272`, `op_copy` and the jq `copy` op nulling `replaces`/`pub`/`producer`); ES `9e4e2ab85` (`recordCopy`, `SaveStateBookkeeper::runCopy`, `SaveStateJobQueue::enqueueCopy`); CAP14 (a)-(d) on guest b; `GuiSaveState.cpp:460` gate; frames `206-manager-copy-first-changed-frame-640x480-0923b9ee9f.png`, `206-manager-copy-refused-during-sync-640x480-6c0c13dc4e.png`. **Refutation/notes:** box 1's manager-press observation exercised the unknown-provenance branch; the source-sha branch was proven in CAP14(a) with a hand `cp`; box 2's "next boot" was a hand-run `--full`. And `SaveStateBookkeeper.cpp:81-85` logs `save state copy recorded` on rc 0 while `cloud_capture:549-556` exits 0 with a WARN for a path that is not a member of the unit -- a success line over a no-op (finding F-B21, Low).

### AC-B22 · #207 boxes 1-5 (ticked): no flash after a deletion on the RG SP (word); one frame change on guest d; a refused unlink brings the tile back; a copy adds one tile with no redraw; the retire-before-unlink and no-rescan still hold (CAP13, unit tests).
**Verdict:** PASS ✓ ×5 · **Evidence:** ES `ee4786940` (`GuiSaveState::update` `:515-531` compares `filesOnDisk()` with `mShown` when `completed()` moves; the rebuild is the logged exception path), `058c375ac` (the worker's line says what is on disk); frames `207-manager-{copy-tile-added,immutable-tile-back,yes-tile-gone}-640x480-ea828b286a.png`, `207-manager-yes-empty-sheet-640x480-0923b9ee9f.png` exist; the maintainer's word on build 15; CAP13/14 PASS on build 12; unit tests 112/1224 then, 119/1302 now. **Refutation:** the code comment claims the exception path also catches "a file that arrived while the page was open" -- it is checked only when a job completes (coincidental); the capture harness (`flash-check.py`) is session scratch. Leads.

### AC-B23 · #209 boxes 1-2 (ticked): DO NOT INCREMENT: the hotkey writes the launched slot, no new slot, `savestate_auto_index = false`; INCREMENT PER SAVE: a new slot, the launched one untouched.
**Verdict:** PASS ✓ ×2 · **Evidence:** `setsettings.sh` `set_savestates` `0|2|false|none` -> `savestate_auto_index false` (Phase 1.9 diff); harness section x (PASSED: `INCREMENT PER SAVE ("")`, `DO NOT INCREMENT ("2")`, `a legacy "0"`); guest d observations in the ticks (RetroArch `Saving state ".../Bobl.state1"`, then `Bobl.state4` under increment). **Refutation:** the proof pressed RetroArch's command-port `SAVE_STATE`, not the player's hotkey -- the same `CMD_EVENT_SAVE_STATE`; noted, not a gap in the mechanism.

### AC-B24 · #209 box 3 (unticked): a device holding the legacy `0` shows a row whose value matches what the next save does.
**Verdict:** PARTIAL ⚠ · **Evidence:** ES `GuiMenu.cpp:5332-5334` maps a stored `"0"` to `"2"` for the option list; the launcher maps `0` off (harness x). The frame the tick says is owed does not exist. **Refutation:** the row's next save writes `"2"`; until then `SystemConf::getIncrementalSaveStates()` reads `"0"` (false) and the launcher writes off -- consistent.

### AC-B25 · #209 box 4 (ticked): `savestate_max_keep` never written empty.
**Verdict:** PASS ✓ · **Evidence:** `setsettings.sh` `if [ -n "${MAXINCREMENTALSAVES}" ]`; harness x `no maxincrementalsaves: no savestate_max_keep line`. **Notes:** the tick's claim about RetroArch's default for an unset key is not exercised by any test (D-UI-083 asserts it).

### AC-B26 · #209 box 5 (unticked): the RG SP's word with `/tmp/.retroarch.cfg` read beside it.
**Verdict:** UNTESTABLE ? (UNTESTABLE-DEV).

### AC-B27 · #243 boxes 1-2 (ticked): D-UI-080 recorded; on guest d NES tiles and screenshots 4:3, Game Boy 10:9, labels two lines; frames.
**Verdict:** PASS ✓ ×2 · **Evidence:** D-UI-080 row; ES `3b7265f33` + `9f46264a8` + `4e4ab0647` (in range: `DisplayAspect{,Text}`, `ImageComponent::setDisplayAspect`, `applyToBoundImages` for the theme's own extra -- `es-code-traps` § "The picture beside a game list is the theme's own extra"); frames `243-{after-manager-nes-tiles-4x3,after-manager-gb-tile-as-is,after-screenshots-list-nes-4x3,after-screenshots-list-gb-as-is,before-screenshots-list-nes-file-shape}.png` exist; `DisplayAspectTextTests` in the unit run. **Refutation:** the measure changed from the box's "160×120 in a 160-px box" to a ring fixture (87x87 = round); the fifth cut's frames carry the deformed START NEW GAME arrow that #250 later found (the box never asked about it). **Leads (Phase 3):** `DisplayAspect.cpp:44-50` caches a Transform per screenshot path forever; `forScreenshotPath` walks every game of every system on the interface thread per new path.

### AC-B28 · #243 box 3 (unticked): the RG35XX SP's word on an NES thumbnail.
**Verdict:** UNTESTABLE ? (UNTESTABLE-DEV).

### AC-B29 · #245 boxes 1, 3, 5 (ticked): D-UI-081; with a record of one turn the manager's tiles, the SCREENSHOTS list, its grid style and the viewer draw upright; the change log.
**Verdict:** PASS ✓ (box 1), PASS ✓ with a note (box 3), PASS ✓ (box 5) · **Evidence:** D-UI-081 settled; ES `12de21757` + `b49d85448` (`CaptureRotation` record `turns=N`; `es-code-traps` § "A file under three bytes reads as empty"); six `245-*` frames exist (manager gb/nes, list gb/nes, viewer nes, the before); the change log's #245 bullet. **Refutation:** "its grid style" is ticked "not framed" in the same sentence (it shares the tile code); `ImageGridComponent.h:413-417` creates scroll-loop tiles with `loadTile` and no decorator -- a grid with scroll loop shows untransformed loop tiles (finding F-B29, Low).

### AC-B30 · #245 box 2 (ticked): "The interface learns a game's rotation at the end of a RetroArch session (the launch log's `SET_ROTATION`…) and records it beside the game's save states."
**Verdict:** PARTIAL ⚠ · **Evidence:** `FileData.cpp` `recordAfterSession` reads `/var/log/exec.log`; the record `turns=1` written on guest d for cookieclicker. **Refutation, found in the tick's own comment:** the `SET_ROTATION` line was **appended to the launch log by hand** ("the VM has no rotating core"). No real core's `RETRO_ENVIRONMENT_SET_ROTATION` has been observed writing a record on any VM or device in the record; the device half (box 4) is open. The mechanism is proven for a synthetic line only.

### AC-B31 · #245 box 4, #248 box 2, #249 box 2, #250 box 2 (device boxes)
**Verdict:** UNTESTABLE ? ×3 (UNTESTABLE-DEV), PASS ✓ (#248 box 2, the maintainer's word 2026-09-23 on `9221b4528d`: "I can confirm that the rotation worked").

### AC-B32 · #246 boxes 1-2, 4 (ticked): reproduced on the VM with a stack (or a core); the cause named and fixed with a unit test where the shape allows; #79's row and the change log.
**Verdict:** PASS ✓ ×3 · **Evidence:** ES `50a505192` (`main.cpp:355-392`: backtrace to stderr, `signal(SIG_DFL)`, `raise`), `5aea8a314` (`SystemData.cpp:339/347` `dropGameListView`/`remakeGameListView`; `ViewController.h:49-59`); `es-code-traps` § "A rescan that deletes FileData drops the view first"; `device-builds.md` § "Reading a crash"; the change log's #246 bullet; #79 row 5 (per A lead; not re-read). **Refutation:** the "stack" was three frames with the innermost PC in the heap -- the cause came from the last log line and code reading, which the tick says ("no unit test -- view plumbing over live FileData; the forty-session loop is the check"). **Found (F-B32, Medium):** the handler calls `LOG(LogError)` and `Log::flush()` before the backtrace; `Log::write`/`flush` take `Log::mMutex`, a plain `std::mutex` (`Log.cpp:70/104/122/187`). A fault raised while that mutex is held -- inside `Log::write`, or in malloc under it -- deadlocks the handler: the interface stays alive and unresponsive, and `essway` restarts on exit, not on a hang. The comment admits the handler is not async-signal-safe and accepts a lost backtrace; it does not name the hang. Also `signal(SIGINT, signalHandler)` (`main.cpp:645`) now ends a Ctrl-C with `raise(SIGINT)` under `SIG_DFL` and no `atexit` (developer-run behaviour only; nothing on the image sends SIGINT).

### AC-B33 · #246 box 3 (`[~]`): ten offline exits in a row on the VM leave the interface running; the maintainer's next offline session sees no restart.
**Verdict:** PARTIAL ⚠ (VM half PASS: forty sessions on the ninth cut, vm-qa row 105; device half open).

### AC-B34 · #247 boxes 1-3 (unticked; comment 1 claims delivery in the sixteenth cut)
**Verdict:** PASS ✓ (box 3), PARTIAL ⚠ (box 1: `CUT at the cap: <raw> raw bytes kept of more` -- the "bytes the kernel offered" is unknowable and the note says so), PASS ✓ (box 2: the "raise the cap for the interface" alternative, 1 GiB by `%e` match, `rocknix-corekeep:76-80,123-128`; no `coredump_filter` is set or noted, which the box's "either/or" allows) · **Evidence:** `rocknix-corekeep` read in full (Phase 1.9): `head -c "${CORE_MAX_BYTES}" | gzip -1`, CUT decided by `gzip -l`'s raw count; harness section x3 in the PASSED run (`a 64 KB dump … whole`, `a 3 MB dump … CUT from the raw count`); guest d: `gzip` is GNU (`/usr/bin/gzip`, `gzip -l` on a stream works), busybox `head -n -1` exits 0, `date -d @epoch` works -- the device-tool question raised in Phase 1.9 answered in the script's favour. **Gaps:** all three boxes unticked though delivered (F-hyg); the header comment `rocknix-corekeep:32-34` still says "cut off at CORE_MAX_BYTES of *compressed* output" while `:76-80` and `:167-177` cap raw bytes (finding F-B34, comment quality, Low); the CUT branch was proven with `/dev/zero` under a 1 MB env cap, never with a real oversized process; the 512 MB free floor is checked before the write and not against the cap.

### AC-B35 · #248 boxes 1, 3, 4 (ticked): on the VM an FBNeo game with no record shows upright from the table; the table generated in the fbneo-lr package with a count in the build log and a unit test; the change log.
**Verdict:** PASS ✓ ×3 · **Evidence:** `fbneo-lr/package.mk:28-38` runs `scripts/rotation-table.py` in `makeinstall_target` and echoes `USING: fbneo rotation table: N games with a turn`; guest d has the five tables (`fbneo.txt` 2544 lines, `mspacman 3` in the four MAME/FBA tables, `md_mspacmanpp 1` in FBNeo's); ES `1a5186f59` `fromTable` (`CaptureRotation.cpp:26-53`, keyed on `getCore(true)`; guest d's `es_systems.cfg` names `fbalpha2019` as a core, so every table's stem matches); `CaptureRotationTextTests`; frames `248-*` (4) exist; the change log bullet. **Refutation/leads:** the build-log count is `wc -l` -- a generator that matches nothing prints `0 games with a turn` and the build succeeds (no floor); `rotation-table-fba.py` and `fbneo-lr/scripts/rotation-table.py` are byte-identical duplicates; the mapping (`ROT270->1, ROT180->2, ROT90->3`; FBNeo `VERTICAL|FLIPPED->3`) is asserted only in comments and the VM fixtures were built to the same assumption -- the maintainer's Ms. Pac-Man word is the one independent oracle. `sTables` is read once per core and never invalidated (a table only changes with an image, so harmless). Finding F-B35 (Low: no non-empty assertion on a generated table).

### AC-B36 · #249 boxes 1, 3 (ticked): a game launched from AUTO SAVE runs with `state_slot = -1` and `savestate_auto_load = true`; from SLOT 1 with `state_slot = 1` and `-e 1`; the change log.
**Verdict:** PASS ✓ ×2 · **Evidence:** `setsettings.sh` `set_autosave` `SLOT="-1"` for `*.auto` (`c0c2d15179`); harness section v cases (now expecting `state_slot = "-1"`, `33947e2eb0`); `SaveState.cpp:118-121` sends `-autosave 1 -state_file` for the auto tile. **Refutation:** the tick's guest observation was made with the launcher bind-mounted before the cut; the harness is the durable check and it holds on the tree. **Lead:** the body notes "the save hotkey then writes the auto save too" from an AUTO SAVE launch -- no VM check of the save hotkey from that tile.

### AC-B37 · #250 box 1 (ticked): the START NEW GAME tile pixel-identical to a build before #243/#245 for a turned, a recorded and an untouched game; capture tiles portrait with the mark above.
**Verdict:** PASS ✓ · **Evidence:** ES `bb79e4fc4` (a per-tile decorator; the grid-wide setters removed from `ImageGridComponent.h`); frames `250-{before-manager-nes-arrow-fitted-4x3,before-manager-fbn-arrow-turned,after-manager-{fbn,nes,gb}-arrow-unchanged}.png` exist; the reference `195-save-state-manager-24h-640x480-77e7e97515.png` exists; "0 of 25,752 pixels differ in all three"; the tip's `frame-diff` 0 boxes against `aa8d525a8a`. **Refutation:** the box was first written against the fifth cut, which already carried the defect -- and **the body was edited** to say so (the one body in this set amended with its comment). The strongest VM evidence in the section.

**B summary:** across #195 #196 #197 #202 #205 #206 #207 #209 #243 #245 #246 #247 #248 #249 #250 -- PASS 42, PARTIAL 8, FAIL 0, SKIP 7, UNTESTABLE 7 (64 boxes). Findings raised: F-B05 (clean-install copy of `es_savestates.cfg`), F-B17 (unlink after refusal), F-B21 (success line over a no-op adopt), F-B29 (scroll-loop tiles undecorated), F-B32 (crash handler can hang), F-B34 (stale corekeep header), F-B35 (no floor on a generated table).

---

## C. Cloud transfer and sync, launch-over-sync, Wi-Fi, logging and secrets, French, the help bar, foreground pages, the device password

### AC-C01 · #45 boxes 1, 2, 4, 5, 6 (ticked; the fix `4fae9fe2e4` is PRE-RANGE, the closure in range)
**Verdict:** PASS ✓ ×5 · **Evidence:** `tools/last-good-scripts-test` case k in the PASSED run (the identity rule, `-X` skips, the zip kind); `backuptool:285-287` now says "`/usr/bin/assets` points INTO /storage/.config/ppsspp/assets" (box 5); D-CLOUD-008 (box 6); the tip's round-trip suite ends "1 archive at root" and the #236 B tick measured a 3,114-byte archive of 12 entries on the RC. **Refutation:** a 16 MB archive on the RC would have shown in the B tick's numbers.

### AC-C02 · #45 box 3 (ticked): "The same on hardware…"
**Verdict:** PASS ✓ (by the VM under D-QA-033) · **Evidence:** the tick says the VM is the proof (guest a on the RC). **Notes:** the box's text still says hardware; ticked by re-scoping in the tick, not by editing the box (F-hyg).

### AC-C03 · #47 boxes 1-5 (ticked; PRE-RANGE, closed 2026-09-20 "from #236's round")
**Verdict:** PASS ✓ ×5 (PRE-RANGE) · **Evidence:** ES `15bfd5e81` / pin `c694d733c6` and the 2026-09-13 frames the ticks cite; `GuiMenu::openRestoreRelink` exists at the tip (D-RA-025's row reads it). Not re-derived beyond the closure; nothing in range touched the page.

### AC-C04 · #102 boxes 1-5 (ticked; PRE-RANGE incident follow-ups)
**Verdict:** PASS ✓ ×5 (PRE-RANGE) · **Evidence:** the bounded automatic sync (`cloud_backup:56` `RCLONE_SYNC_NET_OPTS_FALLBACK`, `--max-duration 20s`; `handheld-evidence.md` § the persistent journal, D-SYS-001..005); box 5's "no recurrence in eight days and eleven candidates" is a negative observation the maintainer's device round bears out. Nothing in range changed these.

### AC-C05 · #115 boxes 1-6 (ticked; PRE-RANGE small-panel fixes)
**Verdict:** PASS ✓ ×5, SKIP ○ (box 4's stopping-case frame, deferred with its reason in the body; and D-CLOUD-130 replaced the hand-started refusal with the question) · **Evidence:** `es-code-traps` § "The help bar offers a direction only where it moves something" (D-UI-034); D-UI-035 (candidate lines); the frames the ticks cite (2026-09-10). Not re-derived beyond the closure.

### AC-C06 · #152 boxes 1-3 (ticked): every fork string has French; a script lists the untranslated and runs in vm-qa; two pages framed in fr_FR at 640x480.
**Verdict:** PASS ✓ ×3 · **Evidence:** `tools/es-untranslated` 2026-09-24: 674 / 674, exit 0; the tip's `french.log` the same; `msgfmt --check` 1944 messages clean; frames `152-cloud-rows-fr-640x480-b245fd12ac.png`, `152-manage-cloud-storage-fr-640x480-b245fd12ac.png` (3 `152-*`, all FR). **Refutation:** `tools/es-untranslated:89` defaults `--upstream 2e1564402`; after an ES rebase the base is wrong in the direction of more strings counted as the fork's (exit 1) -- fails closed (finding F-C06, Low).

### AC-C07 · #153 boxes 1-5 (ticked): D-CLOUD-126/127; LINK5 on S3 at 40 s/120 s; the same on WebDAV; the summary line and the outcome pattern agree; frames EN/FR of a cut S3 upload on the transfer page.
**Verdict:** PASS ✓ ×5 · **Evidence:** D-CLOUD-126/127/128 rows; `cloud_backup:88-99,136` the stall ceiling (`--timeout 30s` idle + grace, read from rclone's stats block); harness cases h and n in the PASSED run; `vocabulary-check` 0 wrong; ES `7afce37a6` + `d842bbe16` (in range: a cut run with any progress is COULDN'T FINISH, the note counts files, the unit names through `_( )`); 13 `153-*` frames (7 FR) on `a283f504a0` and `d55169e59e`. **Refutation:** the first RC's frame found the page wrong (SKIPPED - YOU'RE NOT ONLINE over WHAT MADE IT IS IN YOUR CLOUD) and the candidate was re-cut -- the box was re-proven on the fixed pin.

### AC-C08 · #157 boxes 1-4 (ticked): the card's bar and line advance monotonically through the two halves; 50 % / 100 %; frames at both sizes EN/FR, every string one line; `ThreadedCloudSync` and `GuiCloudTransfer` agree on phase names.
**Verdict:** PASS ✓ ×4 · **Evidence:** ES `26a770561` (`GuiCloudTransfer.cpp:877/880` COMPARING N OF M FILES / COMPARING FILES...), `CloudText::phaseBar`, `main.cpp`'s `>>> doing receive/send` (D-UI-052); 7 `157-*` frames (2 FR); the tip's time-to-play run shows the exit-sync card `RECEIVING · 407 KB OF 407 KB → COMPLETED` in #236 B 040's tick. **Refutation:** at 1280x800 the compare finished under a second so the compare line there rests on the 640x480 frames and the unit test -- said in the tick.

### AC-C09 · #157 box 5 (unticked): the two H700 handhelds at boot.
**Verdict:** UNTESTABLE ? (UNTESTABLE-DEV).

### AC-C10 · #177 box 1 (unticked): with `LogLevel=debug`, setting the device password writes `runSystemCommand: setrootpass <redacted>`; `grep -c` of the value -> 0.
**Verdict:** PARTIAL ⚠ · **Evidence:** ES `80f52e500` (in range): `Platform.cpp:830` `LOG(LogInfo) << "runSystemCommand: " + maskSecrets(cmd)`; `GuiMenu.cpp:3162/6003` the two `setrootpass` sites through `shellQuote`; `MaskSecretsTests.cpp` in the 119-case run; `StringUtil.cpp:475/540` masks a `shellQuote`d value as one word. **Gap:** the box asks for the observation (`grep -c` -> 0 on a guest at debug level); the comment describes the mask, no run is filed. The mechanism is in; the box is honestly unticked.

### AC-C11 · #177 box 2 (unticked): "No other `LOG(` line in `es-app`/`es-core` prints a credential value."
**Verdict:** PARTIAL ⚠ · **Evidence:** the twelve `maskSecrets` call sites (`Platform.cpp`, `ApiSystem.cpp` ×4, `Scripting.cpp`, `OfflineScanJob.cpp`, `Scraper.cpp`, `FileData.cpp:870`, the Win32 copies); the comment's sweep. **Gap:** a negative over the codebase, not independently re-swept here.

### AC-C12 · #178 boxes 1-3 (unticked): a WARNING/ERROR line is in `es_log.txt` within a second; a reboot 2 s after a WARNING keeps it in the rotated log (ten times); the journal carries WARNING lines.
**Verdict:** PARTIAL ⚠ (box 1: mechanism, no timing), UNTESTABLE ? (box 2: not run), PASS ✓ (box 3) · **Evidence:** ES `469441d4d` (in range): `Log.cpp:~100-130` flushes the file after every batch; `LogPolicy.h` `mirrorToStderr(level <= LogWarning || debug)` with `LogPolicyTests`; guest d today: `journalctl -b | grep -c WARNING` = **165** = `grep -c WARNING /var/log/es_log.txt` = **165** -- every WARNING reached the journal. **Gaps:** the one-second latency was not measured (the comment's "6 s before the read" is a bound, not a measurement); the ten-reboot check was never run (the VM could).

### AC-C13 · #182 boxes 1-2 (unticked): a gated cloud row renders dimmed on every frame at 640x480 and 1280x800; one shared mechanism.
**Verdict:** PARTIAL ⚠ (box 1: 640x480 only), PASS ✓ (box 2) · **Evidence:** ES `d9fa93bf2` (in range): `SwitchComponent::setColor` re-applies `mDimmed` (`SwitchComponent.cpp:27-31`), `MultiLineMenuEntry::setDimmed`, `ComponentList.h:23` comment; frame `182-cloud-rows-dimmed-no-cloud-640x480-a6d032bf5e.png` (1). **Gap:** no 1280x800 frame; the boxes are unticked though the fix shipped in RC-11.

### AC-C14 · #187 boxes 1-3 (unticked; closed not planned 2026-09-21)
**Verdict:** SKIP ○ (SKIP-NP) ×3 · **Evidence:** D-UI-078 reversed the background shape; `GuiCloudTransfer.cpp:196-218` "sat in, CANCEL the one way out"; scope moved to #241.

### AC-C15 · #191 boxes 1-2 (ticked): the Wi-Fi row shows the network the device is on (NetworkManager) and says when none; MANAGE SAVED NETWORKS lists, marks, forgets with confirmation and says when it disconnected.
**Verdict:** PASS ✓ ×2 · **Evidence:** `wifictl current/saved/forget` (Phase 1.9 diff; NM asked with `nmcli -t`, exit 2 when it cannot be asked); harness section u (19 cases) in the PASSED run; ES `ApiSystem.cpp:625/638/667` (bounded `timeout 10/15/30`), `GuiMenu.cpp:9041` WI-FI NETWORK (D-UI-071), `:9091/9455` MANAGE SAVED NETWORKS (D-UI-062); `WifiTextTests` in the unit run. **Refutation:** `forget` of the wired profile is refused; NM not answering exits 2, never "joined to none" -- both harness cases.

### AC-C16 · #191 boxes 3-4 (unticked): frames at 640x480 EN/FR with two saved profiles ("the VM half is done"); the menu map and the rocknix.org page.
**Verdict:** PARTIAL ⚠ ×2 · **Evidence:** 11 `191-*` frames (2 FR) and 11 `201-*` (2 FR); `docs/es-menu-map.md` has MANAGE SAVED NETWORKS (4) and WI-FI NETWORK (4). **Gaps:** the RG SP half of box 3 (D-QA-033 makes it the VM's; the box was not amended); the rocknix.org page (#42's).

### AC-C17 · #192 boxes 1-2 (unticked): with the link up the first step reads what it does (CHECKING THE CONNECTION); without, WAITING FOR A NETWORK and how long.
**Verdict:** PASS ✓ ×2 · **Evidence:** ES `ebefaddf4` (in range): `ThreadedCloudSync.cpp:267` `CHECKING THE CONNECTION...`, `:272-273` `WAITING FOR A NETWORK, UP TO %d SECONDS...` / the short form; `cloud_net_ready:178` prints `>>> doing network`; `CloudText::networkStep` unit-tested (three cases per the comment; the CloudTextTests file is in the run); #236 A: the **maintainer's own tick** on the RG35XX SP (2026-09-21 02:20): "the card's first step reads CHECKING THE CONNECTION..., not LOOKING FOR NETWORK". **Refutation:** the old string `LOOKING FOR NETWORK` is gone from `es-app/src` (grep: only the comment in `main.cpp:539-540` and `ThreadedCloudSync.cpp:217` name the old/new words).

### AC-C18 · #192 box 3 (unticked): frames at 640x480 EN/FR of both cases on the VM; the RG SP's card.
**Verdict:** PARTIAL ⚠ · **Evidence:** 0 `192-*` frames filed ("Not framed on the VM this round" -- the guest's remote was not ready); the device half was met by the maintainer's #236 tick. A VM frame the box asks for was never taken, though the VM could (vm-first).

### AC-C19 · #198 boxes 1-3 (unticked; comment claims the fix in the sixteenth cut)
**Verdict:** PARTIAL ⚠ ×3 · **Evidence:** ES `75ca1dac2`: `GuiMenu.cpp:3162` and `:6003` `"setrootpass " + shellQuote(...)`; `setrootpass` `printf '%s\n%s\n'` to smbpasswd (`2337c07f73`); harness section x in the PASSED run (`a b$c\n2` reaches cryptpw whole, smbpasswd twice byte for byte, syncthing and the setting the same bytes); the Wi-Fi key already through `shellQuote` (`ApiSystem.cpp:599-600`); the mask at `Platform.cpp:830`. **Gaps:** box 1 asks for an ssh login with the new password on the VM -- not done; box 2 asks for a PSK with a space and `$` checked "the same way" -- not observed; box 3 asks for a debug-level log grep -- not filed. Mechanisms in, observations owed; boxes honestly unticked.

### AC-C20 · #201 boxes 1-4 (ticked): the row's value is the network the device is on; the picker lists networks in range with CONNECTED/SAVED marks; a press on a saved one joins without a key; a new one asks the key, connects, saves; a wrong key changes nothing.
**Verdict:** PASS ✓ ×4 · **Evidence:** `wifictl join` (`join_wifi`: profile up with `-w 90`, `wifi.ssid`/`wifi.key` moved from NM, `pin_wifi`, the key read with `-s -g` and never printed); harness u (join cases: activation fails -> settings untouched; NM down -> exit 2); ES `GuiWifi.cpp:138-219` (`joined()` toast `CONNECTED TO <name>`; the new-network path writes `wifi.key` at `:205`); `ApiSystem.cpp:655` `timeout 120 wifictl join <shellQuote>`; D-UI-063/064; 11 `201-*` frames. **Refutation:** a press on a saved row that asked for a key would show in the frames; the join path never opens the keyboard.

### AC-C21 · #201 boxes 5-6 (unticked): harness + unit tests + frames done; the RG SP confirms the row and the hotspot in range; the menu map and rocknix.org.
**Verdict:** PARTIAL ⚠ ×2 · **Evidence:** the VM halves are done (above); the device half and the rocknix.org page are open.

### AC-C22 · #203 box 1 (ticked): launching over an automatic sync asks the same question and cancels only on the answer (D-CLOUD-130).
**Verdict:** PASS ✓ · **Evidence:** ES `e21841060` (in range): `FileData.cpp:796-832` -- one `GuiMsgBox` for any running sync, `STOP IT AND PLAY` -> `cancelForLaunch(&again, true)` then `launchNow` or `launchWhenGone`; `KEEP WAITING` (and B) leaves it. **Runtime:** the tip's `time-to-play` cell answered the question at **1.03 s** in the game-to-game lane and the stamp's token was `cancelled` x1 (`qa-443028ff7a-…-0116/time-to-play.log`). **Refutation:** a launch that cancelled without asking would have produced no question frame and a `cancelled` token before any press; the tool's own D-CLOUD-131 press is what records the answer.

### AC-C23 · #203 box 2 (ticked): over the player's sync or a transfer left running, STOP starts the game within seconds and the outcome reads SKIPPED - YOU STARTED A GAME (row: SKIPPED, A GAME WAS STARTED); KEEP WAITING leaves it.
**Verdict:** PASS ✓ · **Evidence:** `CloudTransferJob.cpp:87-101` `kill(-pid, SIGTERM/SIGKILL)` on the `setsid` group; `FileData.cpp:721-760` `launchWhenGone` (hard stop at 5 s, gives up at 20 s with `IT DIDN'T STOP IN TIME`); `GuiCloudTransfer.cpp:368` `SKIPPED - YOU STARTED A GAME`; the `last-backup restamped as stopped for a game` line and 10 `203-*` frames. **Refutation:** the "transfer left running" precondition no longer exists after D-UI-078 (a transfer cannot be left running); the question over a *sync* stands, and the transfer branch remains reachable only while the page is up -- noted, not a gap.

### AC-C24 · #203 boxes 3-4 (unticked): VM frames at 640x480 (EN done, FR not; the spinner too brief); the RG SP; register D-CLOUD-129; the menu map's cloud section; the rocknix.org page.
**Verdict:** PARTIAL ⚠ ×2 · **Evidence:** 10 EN frames, **0 FR**; D-CLOUD-129 row exists (box 4's register half done and unticked); rocknix.org open. **Gaps:** the FR frame; the device word; the docs page.

### AC-C25 · #204 boxes 1-3 (unticked; closed parked)
**Verdict:** SKIP ○ (SKIP-NP) ×3 · **Evidence:** D-UI-072 ("French stays… not a priority").

### AC-C26 · #208 boxes 2-5 (ticked): on guest d no frame carries a NOTHING … YET line, the sequence per half; a half with nothing to move ends on its outcome; the words decision is a pure `CloudText` function with six unit cases; the suites pass.
**Verdict:** PASS ✓ ×4 · **Evidence:** ES `8d5ab6db9` (in range): `CloudText::liveWords` (`CloudText.cpp:596`, `CloudText.h:286-302`), `ThreadedCloudSync.cpp:342-372`; `CloudTextTests` "liveWords says progress, never the outcome so far (#208)" in the 119-case run; 6 `208-*` frames (2 FR); vm-qa row 92 and the tip's twelve suites. **Refutation:** `grep -rn 'NOTHING SENT YET\|NOTHING RECEIVED YET\|NOTHING SYNCED YET'` over the ES sources finds only the explanatory comments in `CloudText.h:286` and `ThreadedCloudSync.cpp:346` -- no live string.

### AC-C27 · #208 box 1 (unticked): the RG SP's own confirmation.
**Verdict:** UNTESTABLE ? (UNTESTABLE-DEV).

### AC-C28 · #210 boxes 1-4 (ticked): no SAVE STATES prompt where it cannot apply, either arrangement, frames; the prompt where it can; margins within 2 px EN/FR at both sizes; no prompt silently dropped while the row fits.
**Verdict:** PASS ✓ ×4 · **Evidence:** ES `7dc8bf373` (in range): `ISimpleGameListView.cpp:700-734` names SAVE STATES only where `SaveStateRepository::isEnabled(cursor)`; `HelpComponent.cpp:127-148` the row centred on what it draws (the trailing spacer removed from the box); 6 `210-*` frames (2 FR); the tick's margins (45/49 … 118/118 … 255/256). **Refutation/notes:** the French row at 640x480 draws five of six prompts at the cap and drops SAUVEGARDES D'ETAT with no sign -- recorded in the tick as a decision to make; the measuring tool (`measure-helprow.py`) is session scratch.

### AC-C29 · #210 box 5 (unticked): the RG SP.
**Verdict:** UNTESTABLE ? (UNTESTABLE-DEV).

### AC-C30 · #241 box 1 (ticked): the scan page offers no way to leave it running; CANCEL asks and names what cancelling means; on YES the ctl is gone within seconds; the page shows the outcome and the row's line; a later scan passes over the saved games.
**Verdict:** PASS ✓ · **Evidence:** ES `acd7a6fee` (in range): `GuiOfflineScan.cpp:111-112` B -> `askCancel()`, `:163/169` help bar CANCEL then CLOSE; ctl `trap 'cancelled scan' INT` (stamp `why=CANCELLED`, exit 130); 22 `241-*` frames (11 FR) including `241-scan-{running-footer,cancel-dialog,outcome-cancelled,page-after-cancel,again-dialog}-640x480-75603308e4{,-fr}.png`; the harness case for a scan after a cancel in the PASSED run.

### AC-C31 · #241 box 2 (ticked): the transfer page the same; after CANCEL no partial file on the device or in the cloud; the hub row says how it ended.
**Verdict:** PASS ✓ · **Evidence:** `GuiCloudTransfer.cpp:196-218` (`cancellable()` && B -> `askCancel()`), `:300-303` CANCEL THIS BACKUP OR RESTORE?, `:368` SKIPPED - YOU CANCELLED IT, `:935` the footer; `CloudTransferJob.cpp:100-101` SIGTERM to the group; the stamp `130 player-cancelled`; rclone renames on completion (33 whole files, no `.partial`, per the tick). **Notes:** a settings *restore* still refuses B (it owns the restart) -- said in the tick.

### AC-C32 · #241 box 3 (ticked): the scraper on a foreground page with CANCEL and no card.
**Verdict:** PASS ✓ · **Evidence:** `GuiScraperRun.cpp:96-97,109,124,127` (B -> `askCancel`, CANCEL then CLOSE); `ThreadedScraper.cpp` no `createAsyncNotificationComponent`/`displayNotificationMessage` (grep); frames `241-scraper-*` (EN/FR).

### AC-C33 · #241 box 4 (ticked): no player-visible string offers to leave a long job in the background; French for every new string.
**Verdict:** PASS ✓ · **Evidence:** `git grep -nE 'IN THE BACKGROUND|LEAVE IT RUNNING|KEEP IT RUNNING' -- es-app/src es-core/src` -> **0** (run 2026-09-24); `es-untranslated` 0 of 674.

### AC-C34 · #241 box 5 (ticked): `tools/es-syntax-check` on every touched `.cpp` before the pin moves; frames EN/FR under `docs/qa-frames/<date>/`.
**Verdict:** PASS ✓ (for its files) · **Evidence:** the tick records PASS on all ten plus two after the tool learned `-iquote`; 22 frames filed. **Notes:** the tool's false-positive class found in Phase 1.7b (`GuiRetroAchievements.cpp`, `GuiGameAchievements.cpp`, `InputManager.cpp`) is outside #241's file set; the rule "not ready to merge until this has passed" is unsatisfiable as-is for those three (finding F-T01, Medium, tool).

### AC-C35 · #241 box 6 (ticked): "rocknix.org: the offline-achievements page (#186 PL-11) says nothing about backgrounding on the clone as of 2026-09-21; re-checked after the change, with a docs PR if CANCEL earns a sentence."
**Verdict:** PARTIAL ⚠ · **Evidence:** the tick checked the **clone of `ROCKNIX/rocknix.org`**; the fork's own draft for that page, `docs/ra-offline/rocknix-org-offline-achievements.md:25`, still says "You can press **B** to keep it scanning in the background … the page can be reopened from the row" -- the sentence #186 PL-11 was written to keep true. The box looked at the wrong document (ties to P PL-11 FAIL; finding F-P11).

### AC-C36 · #241 boxes 7-8 (ticked): the maintainer's call on the other background cards recorded; #187 closed against D-UI-078; `es-native-ui.md` and the register updated.
**Verdict:** PASS ✓ ×2 · **Evidence:** D-UI-079 row; `engineering-practices.md` § "Change stays inside the fork's lanes"; #187 closed not planned 2026-09-21T23:41Z; D-UI-078 row; `es-native-ui.md` § "A fourth-tier page is sat in, with CANCEL" and § "A layout must not be computed from what it last produced" (Phase 1.4 delta).

**C summary:** across #45 #47 #102 #115 #152 #153 #157 #177 #178 #182 #187 #191 #192 #198 #201 #203 #204 #208 #210 #241 -- PASS 52, PARTIAL 15, FAIL 0, SKIP 7, UNTESTABLE 5 (79 boxes). Findings raised: F-C06 (hard-coded upstream base in `es-untranslated`, fails closed), F-T01 (the syntax-check false-positive class), F-P11 restated (the fork's own draft, not the clone).

---

## Forward Audit Summary

| Verdict | Count | Where |
| --- | --- | --- |
| PASS ✓ | **184** | P 24 · D 28 · A 42 · B 42 · C 52 (with 5 "box lags" -- true criteria left unticked: A18, B03, D41, D49 ×2 -- counted as PASS) |
| PARTIAL ⚠ | **54** | P 4 · D 12 · A 15 · B 8 · C 15 |
| FAIL ✗ | **1** | P PL-11 (the rocknix.org draft contradicts D-UI-078) |
| SKIP ○ | **76** | P 1 · D 35 · A 26 · B 7 · C 7 (not planned / parked with a register row; open design with no claim in range; future-dated) |
| UNTESTABLE ? | **32** | P 3 · D 4 · A 8 · B 7 · C 5 (26 of them a handheld's word this audit cannot obtain; the rest an H700 squashfs, issue bodies, a rule's exact command) |
| **Total** | **352** boxes | 33 PL items + 319 issue boxes over 66 issues -- the column sums of `04-analysis.md`'s per-issue scorecard, which is the count of record (G-11, 2026-09-24) |

*The five per-section rows above are as first transcribed on 2026-09-24 and are **superseded** by the scorecard: they sum to 346 boxes, 188 PASS and 27 UNTESTABLE, against the headline they sat under (347 / 184 / 32) and the scorecard's rows (352 / 195 / 27). The seat's G-11 (`04-analysis.md` § Second opinion) found the disagreement. The rows are kept rather than re-derived because an entry here rolls several boxes with mixed verdicts into one heading, so a recount from the headings (351 boxes, 212 PASS) cannot split them; the scorecard was written per issue from the entry bodies and is the finer record. The letter-by-letter split is therefore indicative, not a count.*

**Overall assessment: PASS WITH FINDINGS.** Every mechanical check the repo owns passes at the frozen tip except two that name their own defect (`fork-package-freshness` exit 1 on an unpinned, out-of-date proxy pin; `es-syntax-check` exit 1 on three tool false positives); the VM evidence for the tip is complete (twelve suites, frame-diff 0 boxes, rehearsal 19/19); the one FAIL is a documentation draft. The PARTIALs cluster into four shapes: a device box re-scoped by tick rather than by editing (D-QA-033), an observation the tick claims but did not file (frames at one size, a launch not watched, an "each claim checked" that was eleven of 49), a mechanism proven with a synthetic input (a hand-appended `SET_ROTATION`, a host fixture for the image's Python, a `/dev/zero` core), and a box whose text is now wrong (the pin, the entry name, "three probes", `libretro`). The UNTESTABLE count is high because the RG SP -- named in a dozen boxes -- is no longer the RC device and no handheld is available to this audit; none of those boxes is a code claim.

The 26 UNTESTABLE-DEV boxes exceed the anti-pattern's threshold of five; they are not a weak spec but a spec written for a device round this audit was not given. They are listed so the maintainer's round, not this audit, ticks them.

## Coverage Boundary

**Examined.**
- *Code-read* (the primary diffs and the tip's files): every distribution file the fork changed in range under `projects/`, `packages/`, `tools/`, `.githooks/`, `.github/workflows/` (96), with the shipped scripts read whole or by diff (`cloud_capture`, `runemu.sh`, `setsettings.sh`, `wifictl`, `setrootpass`, `rocknix-corekeep`, `cloud_net_ready`, `001-functions`, `post-update`, `userconfig-setup`, `es_savestates.cfg`, the two cheevos scripts, the ctl and its three helpers, the 12 proxy patches by name, RetroArch patch 0016 whole, the 28 recipes by `pkgcheck`); the ES range's mechanisms behind every ticked box by targeted reads (`FileData.cpp` 714-832, `main.cpp` 355-392/785-797, `GuiSaveState.cpp`, `SaveState.cpp` 110-150, `CloudText`, `ThreadedCloudSync`, `GuiCloudTransfer`, `GuiOfflineScan`, `GuiScraperRun`, `RetroAchievements.cpp` 402-615, `OfflineAchievements.cpp` 145-170, `DisplayAspect.cpp`, `CaptureRotation.cpp`, `ImageGridComponent.h`, `SaveStateBookkeeper.cpp`, `Log.cpp`, `LogPolicy.h`, `StringUtil`, `HelpComponent.cpp`, `ISimpleGameListView.cpp`, `GuiMenu.cpp` at the named lines, `WifiText.h`, `GuiWifi.cpp/.h`, `ApiSystem.cpp` 585-667).
- *Test-run* (2026-09-24, the primary at the frozen tip): pkgcheck ×28; `last-good-scripts-test`; `register-check`; `vocabulary-check`; `work-log-index --check`; `ceremony-check --no-gh`; `fork-package-freshness`; `es-menu-map-check`; `es-untranslated`; `msgfmt --check` (build-root gettext); `es-syntax-check --tree` on 55 TUs and the plain/`--with` isolations; the ES unit suite (119 / 1302); `archaeology`'s constructed case; `lint-audit-artifacts` on the #186 folder; `git grep` for the background phrases; `gh` reads of PR 3359 and the fork CI's runs.
- *Runtime-probed* (read-only): guest d on `443028ff7a` -- `/etc/os-release`, the busybox/GNU identity of `head gzip date df stat logger tr sort grep awk sed`, `head -n -N`, `gzip -l`, `date -d @`, the core pattern and the absent marker, the five rotation tables and `es_systems.cfg`'s core names, the three ES config files' link state and `/storage/.configured`, the installed `/usr/share/post-update` and `/usr/bin/raofflineproxy-ctl`, the journal's `powerstate` line and WARNING count against `es_log.txt`, `rclone version`, the one `libcairo`; the tip's vm-qa report and every suite log, the upgrade rehearsal's log and rc, the frame directories 2026-09-14..24 by name and count.

**Deliberately not examined.** An H700 squashfs (D18/D19/D25); the bodies of #168 and the four PL-19 issues; an exhaustive `LOG(` sweep for credential values (C11); the rule's exact unit-test command (PL-21); `#79`'s row 5; the ES repo's own `.githooks/pre-push`; the `--old` runs of the harness against pre-fix scripts (recorded in the work logs, not re-run); every `docs/qa-frames` PNG's pixels (existence and names only, except where a tick's own measurement was quoted); the second-opinion seats of the prior audits.

**Dimensions not exercised.** Any handheld (26 boxes); performance at the A53's speed (blindspot 45) beyond the tip's time-to-play cell; a real provider (Dropbox/S3 in the wild) beyond the QA backends the suites use; a real hotspot lag for the token retry; the ten-reboot log-rotation check (#178 box 2); a `SET_ROTATION` from a real core; the crash handler under a fault inside `Log::write`; the ceremony gate's behaviour from a worktree lacking the tool; the `--wrap-mode=nodownload` guard against a constructed missing dependency; a red run of `fork-checks.yml`.

---

## Prior-verdict cross-check (Phase 2.5)

Opened after every entry above was written (the running log's ordering: sections P, D, A, B, C at 02:5x–03:2x UTC, this section after). Only the criteria both audits judged are compared.

| Criterion | #186 (2026-09-14) or #151 (2026-09-13) | This audit | Agreement |
| --- | --- | --- | --- |
| #175 boxes 1-3 | PASS ✓ ×3 | PASS ✓ ×3 (PRE-RANGE; mechanism at the tip) | agree |
| #176 boxes 1-3 | PASS ✓ ×3 (box 3 "guest evidence, prior; not re-run") | PASS ✓ ×3 | agree; both rest on the 09-14 guest run; the mask was extended in range (PL-29) |
| #183 boxes 1-3 | UNTESTABLE ? / PARTIAL ⚠ / **FAIL ✗** | PASS ✓ ×3 | **disagree, explained:** the fix (`cce9ab12a`, RC-7) landed the same day *after* the #186 audit; the prior FAIL is what drove it. Not a wrong prior verdict, a changed tree. |
| #184 notes | PASS (code) / SKIP (device) | PASS ✓ | agree |
| #186's 33 PL items | (its own punch list, `open` in its index) | 24 PASS, 4 PARTIAL, 1 FAIL, 1 reversed, 3 UNTESTABLE | n/a -- the prior audit produced them; this one grades their resolution |
| #45 boxes 1, 2, 5, 6 | PASS ✓ | PASS ✓ | agree |
| #45 box 3 | SKIP ○ (open by design, per-device yes) | PASS ✓ by the VM under D-QA-033 | **disagree, explained:** D-QA-033 (2026-09-21) re-scoped the device boxes to the VM after #151; the box's text was not amended (F-hyg) |
| #45 box 4 | PARTIAL ⚠ | PASS ✓ | **disagree, explained:** the zip-kind path (`9e811f240d`, 2026-09-13, after #151's audit) closed the gap #151 named; the tick records it |
| #47 boxes 1, 3, 4 | PASS ✓ | PASS ✓ (PRE-RANGE) | agree |
| #47 box 2 | PARTIAL ⚠ (two descriptions broke the rule) | PASS ✓ (PRE-RANGE) | **disagree, explained:** #151's punch list reworded them (frames 2026-09-13, ES `15bfd5e81`, pin `c694d733c6`) before the 2026-09-20 closure |
| #47 box 5 | **FAIL ✗** ("not done, and the issue was closed anyway") | PASS ✓ (PRE-RANGE) | **disagree, explained:** #151 PL-05 set the 640x480 frame as this box's evidence and the frames were taken 2026-09-13; the box's wording was changed to say so (blindspot 41). The prior FAIL was right for its tree. |

No disagreement is a prior audit being wrong about the tree it saw; each is a fix that landed between the two audits, or a decision (D-QA-033) that moved a device box to the VM. One pattern for Phase 3: the prior audits' FAILs were resolved by ticks that carry the evidence, but the boxes' *text* was not always brought to the new criterion (#45 box 3 still says "on hardware").
