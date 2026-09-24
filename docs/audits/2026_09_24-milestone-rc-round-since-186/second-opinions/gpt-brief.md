# Second opinion on a code audit -- the ROCKNIX fork's release-candidate round since #186 (build 443028ff7a, EmulationStation 75ca1dac2), Milestone tier

You are the second reader of a finished code audit of a Linux distribution for handheld gaming devices (ROCKNIX, a JELOS/LibreELEC fork: a cross-compiling build system whose product is an OS image with EmulationStation as the interface, shell scripts as the cloud-sync and RetroAchievements backends, and a QA harness that runs the image in QEMU). You cannot run commands or open the repository; everything you may cite is in the packet below, and every claim you make names the packet's `file:line` or the command output it rests on. The first reader's verdicts are in the packet; do not take them as given.

Answer in three parts, in this order:

1. **Your own findings first.** Read the packet's evidence -- the criteria, the code and command excerpts, the reads -- and list every defect, gap, or unsafe seam you find that is not already one of the first reader's findings (F-01..F-31 in the analysis; PL-001..PL-030 in the punch list). One line each: an id (G-01, G-02, ...), a severity (Critical / High / Medium / Low), the packet's `file:line`, what fails and when. Look hardest at the seams the first reader graded PASS: a clean install against an upgrade, a script's exit codes against what its callers read, a cache against the writer that should invalidate it, a guard that exists against whether anything runs it, a comment against the code beside it (the maintainer's named face for this audit is comment quality: a comment true beside its code, saying the why, ASCII where xgettext reads it).
2. **Refute the first reader.** For every finding at Medium (F-01..F-08) and any Low (F-09..F-31) you think mis-graded: agree, disagree, re-grade, or narrow -- and in each case say what would make the finding false and whether the packet shows it. The punch list says every item was fixed on 2026-09-24; judge the findings and the fixes' acceptance criteria as written, and say where an acceptance criterion would pass without the defect being gone.
3. **What you could not judge.** The claims the packet does not let you verify, so the orchestrator knows where its evidence was thin.

Everyday words, no hedging: a finding either survives your reading or it does not, and you say which. Output Markdown with one table per part.

---

# PACKET 1 of 4: 02-forward-audit.md

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
| **Total** | **347** boxes | 33 PL items + 314 issue boxes over 66 issues |

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


---

# PACKET 2 of 4: 03-retrospective.md

# Retrospective Audit — The release-candidate round (work since #186)

**Auditor:** Code Auditor skill v1.10.0 (Claude Fable 5.1, `claude-fable-5-1`)
**Date:** 2026-09-24
**Subject:** distribution `95e4961fb3..443028ff7a` (the fork's 134 commits / 96 files) and EmulationStation `ae9c7d56b..75ca1dac2` (57 commits / 108 files), read backwards from what was built
**Spec:** the issue bodies on `maxengel/rocknix`; `docs/decision-register.md`; `.claude/rules/*.md` from `next`; `docs/blindspot-register.md` 1–52

---

## Running Notes

## 3.1 Architectural coherence

**The whole holds together, with one seam left over from a reversal.** The range is fourteen RC cuts, each a small, named change over the last, and the tree reads that way: the proxy package's patches are numbered and each header says what it fixes and where it came from; the save-state contract is one file (`es_savestates.cfg`) plus two launcher functions plus a harness section that pins it; the rotation work is a record, a table per core and a text helper with a test; the tools are single-purpose and each carries its usage and its reason at the top.

**The seam: D-UI-078 reversed the #187 design and the code kept both halves.** `GuiCloudTransfer` and `CloudTransferJob` were built on 2026-09-15 so a page could be left and the run followed from the hub row (D-UI-060/070). On 2026-09-21 the maintainer reversed it (D-UI-078): the page is sat in and CANCEL is the only way out. The reversal changed `input()` (`GuiCloudTransfer.cpp:215-218`) and the footer; it left in place the machinery of the old design and every comment describing it:

- `GuiMenu.cpp:5025,5087` still read `CloudTransferJob::current()` to show the hub row's live line "while the run is in the background" (`:5033`, `:5110`), and `FileData.cpp:831` still asks the launch question over "a transfer left running" (`:788`) -- states a player can no longer reach, because the page refuses every press but CANCEL while it runs. The only way to a live run with the page down is the QA API's `POST /launch` under an open page, which launches nothing (memory: *ES API launch needs the carousel*).
- Nineteen comment sites describe the leavable page as the present design (§ Comment quality, shape S1), one of them the header's first paragraph: `GuiCloudTransfer.h:25` "And it is left running, not sat in (fork #187; the scan page is the model)" -- the exact opposite of the rule now in `es-native-ui.md`.

Not dead in the harmful sense (nothing misbehaves), but a reader of the header is told a design the screen contradicts, and `engineering-practices.md` § "Before deleting a duplicate, diff its behaviours" cuts the other way here: a reversal that keeps the old mechanism needs the same list -- what the leftover still does (the row's post-run outcome until dismissed, D-UI-070) and what is now unreachable.

**Two duplicates worth naming.** `projects/ROCKNIX/packages/emulators/libretro/rotation-table-fba.py` and `fbneo-lr/scripts/rotation-table.py` are byte-identical (`cmp`); the shared one's docstring still calls itself `fbneo-rotation-table.py`. Two copies of one generator drift. And `CaptureRotation`'s `sKnown`/`sTables` and `DisplayAspect`'s `known` are three static caches with no invalidation (the first is updated by `recordAfterSession`; the other two never), so a screenshot viewed before its game's first session keeps the file's turn until the interface restarts.

**Removed mid-range and clean:** `SaveStateDeleteQueue`/`SaveStateDeleter` (build 8) gave way to `SaveStateBookkeeper`/`SaveStateJobQueue` (build 10) with the tests moved; no orphan remains (`grep -rn SaveStateDelete es-app/src` -> none). The diagnostic log lines of two cuts (`0f916d52a4`, `8dc8233331`) were removed in the seventh (`DisplayAspect.cpp` has no LOG).

## 3.2 Project conformance

### Face 1 — instruction files (read from `next`; every in-scope rule)

| Rule | Relevance | Finding |
| --- | --- | --- |
| `engineering-practices.md` § Verify the artifact | high | ⚠ Mostly honoured (the ticks quote frames, stamps, counts). Three artifact-shaped ticks on behaviour boxes: #121-2 (a script hash), #196-5 (byte identity for "shows the same tiles and launches each"), #244-2 ("each claim checked" = 11 of 49). |
| § Guards must fail closed | high | ⚠ `.githooks/pre-push:229` runs the ceremony gate only if `$hooks_root/tools/ceremony-check` exists in the pushing worktree; `tools/ceremony-check:147` accepts `issue: guard` unverified; `lint-audit-artifacts` PASSes a folder whose YAML index says `open` ×32 because it reads the outcomes table alone; `raofflineproxy-ctl:1297/1300` `exit ${EX_USAGE}` exits 0; the rotation generators echo `0 games with a turn` and the build succeeds. Fail-closed examples that hold: `es-menu-map-check`/`frame-diff`/`es-syntax-check` exit 2 when they cannot run; `vm-qa` SKIPs a missing baseline. |
| § A name is not a behaviour | high | ✓ The tree carries the lesson in code (the `refresh` helper re-reads unlocks; the worker's line says what is on disk). |
| § A promise is not a mechanism | medium | ✓ `tools/watch-job` + the detach rule; the tip's builds were watched. |
| § Change stays inside the fork's lanes | high | ✓ D-UI-079 honoured: the game index, content installer, OS update and Bluetooth cards untouched (`git diff --stat` shows no change to `ThreadedHasher`'s card, the installer or the updater). Patch 0014 (widget backdrop at every context reset) reaches every RetroArch notification -- inside the RetroAchievements lane by intent, wider by effect; noted. |
| § Never reboot / nothing runs on a device without a yes | high | ✓ Every staging and reboot in #236's comments is asked for by name and run through `tools/device-act` with boot ids; one act's label mis-states the hour of the yes (14:55 vs ~05:45), corrected in the same comment. |
| § If the VM can test it, the VM tests it first | high | ✓ D-QA-033 applied to the round; every cut ran vm-qa and the rehearsal before staging. ⚠ Two VM proofs owed by boxes were skipped while the device half was taken: #192 box 3's VM frames ("not framed on the VM this round"), #178 box 2's ten reboots. |
| § Stop after three fixes | medium | ⚠ #243 took three cuts and two diagnostic pins (fifth, sixth, two diagnostics, seventh) before `es-code-traps` § "the theme's own extra" was written -- the rule fired on the fourth and the lesson was recorded. |
| `upgrade-and-install.md` | high | ⚠ Read-both-write-new honoured for the rotation record (D-UI-082) and the legacy `0`; the rehearsal ran on every cut. **The clean-install path diverges from the upgrade path for `es_savestates.cfg`** (F-B05): `userconfig-setup:13` copies it where `post-update:32` links it. Harmless today, latent, and the cfg's own header says the opposite. |
| `es-native-ui.md` | high | ⚠ D-UI-078's rule is in the file and in the code; the code's comments still carry the old design (S1). `es-syntax-check` before a pin bump: run for #241/#243 (the ticks say so); the tool cannot pass three in-range TUs (F-T01). |
| `es-code-traps.md` § ASCII comments | high | ⚠ Two in-range comment lines carry U+00B7 (`GuiScraperRun.cpp:177`, `.h:38`); xgettext extracts only a comment directly before a `_( )` (`--add-comments=TRANSLATION`, `--keyword=_`), a signature line separates these, and the image built -- so no break, but the rule's pre-bump grep would have flagged them. |
| `es-player-text.md` / `player-language.md` / `least-surprise.md` | high | ✓ `vocabulary-check` 0 wrong of 143; the new strings follow the register (COMPARING SAVES, SKIPPED - YOU CANCELLED IT, STOP IT AND PLAY, WI-FI NETWORK, `Logged in as … (offline).`); every fork string has French (674/674). |
| `es-ui-style-guide.md` | medium | ✓ YES-first confirmations (`CANCEL THIS BACKUP OR RESTORE?`, `STOP IT AND PLAY`/`KEEP WAITING` with B on KEEP WAITING); dim-don't-hide through one `setDimmed`. |
| `rclone-cloud-sync.md` | high | ✓ `cloud_capture` keeps its two rules (no flock, no profile) and adds `trap '' TERM` with its why; the saves-only/system-only contract untouched; the stall ceiling documented in the rule and in the script. ⚠ F-B17: `--retire --unlink` unlinks a path it refused to record -- the rule's "record before unlink" (D-CLOUD-053) not honoured on the refused branch. |
| `packaging-and-patches.md` | high | ✓ pkgcheck 28/28; `PKG_SHA256` on every bump; full hashes for git pins; patches numbered with headers. ⚠ The `python3` the rotation generators run at build time is not in `PKG_DEPENDS_HOST` (the host has it; the rule asks for a shipped script's tools to be declared -- a build-time tool is a weaker case, noted). |
| `device-builds.md` § Late binding in a merge | high | ✓ No file-scope `${PKG_BUILD}` in the six standalone recipes; `${SYSROOT_PREFIX}` at file scope in amiberry/yabasanshiro is set before `source_package` and pkgcheck-clean. ⚠ The re-added guards' comment premise is false for three of five (`virtual/emulators/package.mk:11-12` vs the device arms) -- a constraint written wrong, blindspot 48's shape. |
| `fork-workflow.md` | high | ⚠ `fork-package-freshness` exits 1 at the tip (F-D23); the fork-only tool lists in `.githooks/pre-push` and the rule agree (D's cross-check); `instruction-files.md`'s table lacks four tools (F-DOC). PR 3359 built by content, one commit. |
| `instruction-files.md` § the fork's own tools | medium | ✗ `archaeology`, `ceremony-check`, `frame-diff`, `work-log-index` are in both lists and not in the table ("a new one is added to both lists and to this table, or it is invisible"). |
| `issue-tracking.md` § Ticking / § body edit / § putting a box on a checklist | high | ✗ The most repeated miss of the range (F-hyg): #225 closed with five open boxes; #247 delivered with three open; #193/#194/#203/#195/#211/#182/#177/#198 boxes true and unticked; #45-3/#121-2/#131-2/#150-1 re-scoped inside the tick; #196-1 names `libretro`; #186 PL-04 says "three probes". Blindspot 27's shape, many times. |
| `decision-register.md` | high | ✓ 344 IDs, each once; every citation resolves (register-check) -- except `D-RA-0xx` in a directory it does not scan. ⚠ D-RA-025 was written as open and "corrected in the register in the same action" (append-only asks a new row; the register's text is fine, the history is in git). |
| `change-log.md` | medium | ⚠ Every player-visible change has a claim; the 09-23/24 changes sit as bullets under the 09-22 heading (the rule: a `## Title (date)` section per landing day). |
| `learning-capture.md` / `ceremonies.md` | medium | ✓ Work logs daily with the index; `ceremony-check` green; blindspots 47-52 each name a guard. ⚠ No `docs/retros/` entry in the range (the retro marker is a work-log heading from 09-04); the first retro under the gate is #254's open box. |
| `generic-x64-vm-testing.md` | high | ✓ Twelve suites on the tip; `frame-diff` wired after being seen to fail (run 17); masks explained. ⚠ `retroarch-wrapper-test` and `archaeology`'s constructed case have no observed positive in a suite. |
| `handheld-evidence.md` | medium | ✓ `rocknix-corekeep` obeys the file's rules (bounded, refuses, never collected); D-QA-029 honoured (the marker absent on guest d). |
| `vm-first.md` / `time-to-play.md` | high | ✓ The launch question is measured in the tip's time-to-play cell (1.03 s); D-CLOUD-131. |
| `documentation-accuracy.md` | high | ✗ The fork's rocknix.org draft (`docs/ra-offline/rocknix-org-offline-achievements.md:25`) contradicts the shipped behaviour (PL-11 FAIL); #191/#201/#203 name the rocknix.org page as owed (#42's sequencing). |
| `adversarial-council.md`, `council-substrate-integrity.md`, `worktrees.md`, `learning-capture.md` | low | · no council in this audit's scope; worktrees rule not touched by the range. |

### Face 2 — the blindspot register (does this work repeat it?)

| # | Repeated? | Evidence |
| --- | --- | --- |
| 1 assumed-undone | no | #253's archaeology and blindspot 52 are the guard; #209 was caught re-arguing D-UI-057 and stopped. |
| 6 consumed artifact checked late | no | — |
| 7/10 archive symlinks, fixing forward only | no (partly) | ⚠ F-B05 is a fix-forward shape in miniature: the clean install writes a copy while the update links -- read-both holds because the bytes are equal. |
| 8 synthetic-fixture testing | **yes, three times** | #245 box 2 proven with a hand-appended `SET_ROTATION` (no rotating core on the VM); #213 boxes 1-2 with a host fixture "through the real function", not the image's Python; #247's CUT branch with `/dev/zero`. Each recorded honestly in its tick. |
| 13 assumed-done | **yes** | #121-2 ticked from a script hash; #196-3's Menu+L2 clause ticked before its evidence; #244-2 "each claim checked" for eleven of 49; #196-5 byte identity for a launch box. |
| 14 a guard with no observed positive | **yes** | `--wrap-mode=nodownload` (never seen to refuse); the pre-push INDEX warning (`:226-228`); `fork-checks.yml` (twelve green runs, no constructed red); `tools/retroarch-wrapper-test` (run once by hand, wired nowhere); `archaeology`'s constructed case (#253 box 1 unticked). |
| 16 runtime dependency with no build signal | no (weak) | `python3` at build time for the tables; `gzip -l` on the device (GNU there, confirmed). |
| 22 a probe that cannot report absence | no | the ctl exits 2 on "cannot tell"; `proxyOffline()` returns false without a state file (a fresh toggle-on goes online-way -- a lead, not a false positive). |
| 27 supersession that lives only in a comment | **yes, repeatedly** | see F-hyg above; D-RA-023/D-UI-067/D-RA-022 supersede box text on #190/#193/#194 without a body edit. |
| 33 sentinel collision | no | `EX_UNAVAILABLE`/`TEMPFAIL`/`NOPERM`/`CONFIG` in the ctl; `EX_USAGE` undefined is the opposite failure (exit 0). |
| 34 proven under the host's tools | **yes** (#213), and guarded elsewhere | the harness shims busybox for the scripts (section x for corekeep ran under the shims, and guest d confirmed `gzip`/`head`/`date`). |
| 39/40 a suite that passed over dashes / on the caller's shell | no | `frame-diff` SKIPs a missing baseline; `vm-qa` defines what it needs; `time-to-play` fails on missing headlines (the tip's cell has numbers). |
| 44/45 proven at a fixture's size / speed | partly | the tile-relayout defect (#241's `MultiLineMenuEntry`) shipped in two candidates because every walk scanned a handful of games -- found on the device and recorded in the rule. |
| 46 a name read as a behaviour | no | the `refresh` helper's header says exactly which calls it makes and why. |
| 48 a constraint that lived only in a commit subject | no -- and the fix shipped | webkitgtk's reason sits beside `PKG_VERSION` and beside the option. ⚠ The re-added `PKG_ARCH` guards carry a reason that is wrong for three of five recipes. |
| 49 an edit made blind to the compiler | mitigated | `es-syntax-check` exists and was run; it cannot pass three in-range TUs (F-T01). |
| 50 a log check that never asked whose log | no | `ra-offline-test` clears `exec.log` and dismisses dialogs first. |
| 51 a checklist built from open boxes | partly | #236 was re-cut under D-QA-033 and the stale boxes named; #150 box 2 still names a script that is not in the tree. |
| 52 a decisions list built from a section, twice | no | `archaeology`, the index and the same-day rows exist; #236 § C now names open-table IDs only. |

### Face 3 — project invariants

- **Preserve player progress above all.** No new writer of the saves tree bypasses `cloud_capture`'s record (the manager's COPY now records through `--adopt`; the deletion's row precedes the unlink). ⚠ F-B17: the refused-path branch unlinks without a record -- unreachable from the interface, contradicts the invariant's letter.
- **No secrets in backups or logs.** D-RA-025 re-proved the archive; `maskSecrets` before every logged command line; `rocknix-corekeep` never collected; `qa-accounts` never printed. ✓
- **The filter is an allowlist; `--delete-excluded` restore-side is a bug.** Untouched in range. ✓
- **Every change lands on devices with state.** The rehearsal on every cut; the legacy `0` read as DO NOT INCREMENT; the rotation table at draw time. ⚠ F-B05 (clean install vs upgrade).

## 3.3 Spec fidelity (the register rows the range wrote, against the code)

| Row | Honoured in code? |
| --- | --- |
| D-UI-057/059/069/083 (Batocera parity; no renumbering; the modes) | ✓ `es_savestates.cfg`, `SaveState.cpp`, `setsettings.sh` `0|2|false|none`, harness v/x |
| D-UI-058/066 (12-hour times, padded) | ✓ `TimeUtil.cpp`, `TimeTextTests` |
| D-UI-060/070 -> **reversed by D-UI-078/079** | ✓ the reversal is in `input()`; ⚠ the code and comments of 060/070 remain (S1) |
| D-UI-061 -> superseded by D-UI-063; D-UI-062/064/068/071 | ✓ `wifictl`, `GuiMenu.cpp:9041/9091`, `GuiWifi` |
| D-UI-073/074, D-CLOUD-132/133/134 | ✓ `SaveStateBookkeeper`, `cloud_capture --retire --unlink`/`--adopt`, `GuiSaveState::update` |
| D-UI-075 | ✓ `CloudText::liveWords` |
| D-UI-076 | ✓ `es-menu-map-check` in vm-qa |
| D-UI-077 (REFRESH ACHIEVEMENT STATUS) | ✗ **no row ships** at `75ca1dac2`; the backend verb exists; #224 open -- the register names a row nobody can press |
| D-UI-080/081/082 | ✓ `DisplayAspect`, `CaptureRotation`, the five tables |
| D-UI-084 | ✓ patch 0016 |
| D-RA-019/020/021/022/024/027 | ✓ ctl `DONE` verdict; store-only header; the offline lines; `(offline)`; patch 013; images unconditional |
| D-RA-025 | ✓ (the archive strips; the row corrects a withdrawn premise) |
| D-CLOUD-129/130/131 | ✓ `FileData.cpp:796-832`, `launchWhenGone`, time-to-play's press |
| D-QA-029 (keeper off on a candidate) | ✓ guest d has no marker |
| D-QA-030..039 | ✓ process rows; D-QA-038's baseline was first accepted on a VM pass (then device-accepted the same night) |
| D-WORKFLOW-024 | ⚠ the tool exits 1 at the tip; the proxy recipe lacks the pinned line |
| D-WORKFLOW-026 | ✓ 2.52.6 with the reason beside the version and the option |
| D-WORKFLOW-028 | ✓ `ceremony-check` in the guard and CI; ⚠ the guard's reach (F-D51) |

**Silently changed design:** none found that is not in the register. **Scope added without a row:** the `images` and `refresh` ctl verbs (#212/#224) beyond the PL-30 stop path -- small.

## 3.4 Platform architecture conformance

| Check | Relevance | Finding |
| --- | --- | --- |
| Reference implementation (tenant zero) | · | not applicable to an OS fork |
| Schema-before-code | ⚠ | `docs/save-manifest-schema.md` is owed the `copy` op and the dropped renumber (D-CLOUD-132 says so); not updated in range |
| Dogfooding gate | ✓ | every cut on the VM before the QA handheld |
| API-first | · | n/a |

## Comment quality (the maintainer's face)

**Method.** Every fork-changed file in both repos was counted for added comment lines, issue/decision markers, non-ASCII bytes and TODO tags (Phase 1.7's tables in the running log). The comment text was read whole for the shipped scripts (`cloud_capture`, `runemu.sh`, `setsettings.sh`, `wifictl`, `setrootpass`, `rocknix-corekeep`, `cloud_net_ready`, `001-functions`, `post-update`, `userconfig-setup`, `es_savestates.cfg`, the two cheevos scripts), RetroArch patch 0016, the raofflineproxy/webkitgtk/cairo/rclone/standalone recipes, and sampled (the first 30-34 added comment lines) for 13 tools/helpers and 14 ES files. Truth was judged against the code beside each comment where that code was read in Phase 2; the why/marker face by presence of a reason and an issue or decision ID where a decision was made; ASCII by grep. Stale claims found in a sample were then swept to every site by their shape (`grep`).

**Counts.**

| | Files with added comments | Added comment lines | Lines with `#N`/`D-ID` | Non-ASCII lines | TODO/FIXME |
| --- | --- | --- | --- | --- | --- |
| Distribution (fork commits) | 60+ of 96 | ≈1,900 | ≈165 | 1 (patch 008, Python) | 0 |
| EmulationStation (range) | 60+ of 108 | ≈1,785 (top 60 files) | ≈226 | 2 (`GuiScraperRun.cpp:177`, `.h:38`, U+00B7) | 0 |

Decision-ID citations: every ID cited in the ES sources (51 distinct) and in the proxy package resolves to a register row -- except **`D-RA-0xx`** (`raofflineproxy-cache-images:6`), a placeholder that `tools/register-check` never sees because it does not scan `projects/ROCKNIX/packages/network/raofflineproxy/sources` (`register-check:48-58`).

**What is good, and it is most of it.** The comments in this range are the best-argued part of the work: a header names the issue, the decision and the maintainer's words (`fork-package-freshness`, `frame-diff`, `ceremony-check`, `watch-job`, `build-preflight`, `ra-candidate-games`, `raofflineproxy-refresh`, `SaveStateBookkeeper.h`, `SaveStateJobQueue.h`, `CloudText.h`, `StringUtil.cpp maskSecrets`, `LogPolicy.h`, `CaptureRotationText.h`); constraints sit beside what they constrain with a date and a commit (`webkitgtk` ENABLE_VIDEO, `-j4`; `cloud_capture`'s `trap '' TERM`; `setsettings.sh`'s hardcore `= "0"`); measured numbers are quoted where a number was the reason (`rocknix-corekeep`'s 866 MB, `SaveStateBookkeeper.h`'s third of a second); and the register is cited by ID rather than re-argued. Non-ASCII is two lines; TODO is zero.

**Defects (each verified against the code beside it).**

| Shape | Sites | Severity |
| --- | --- | --- |
| **S1 -- a design reversed, its comments kept.** D-UI-078 (2026-09-21) made the transfer page sat-in with CANCEL; these still describe the leavable page as current: `GuiCloudTransfer.h:25` ("left running, not sat in"), `:81`, `:96`; `CloudTransferJob.h:16,19,171`; `CloudTransferJob.cpp:547`; `GuiCloudTransfer.cpp:164,406`; `GuiMenu.cpp:4382,4920,4922,5033,5110`; `CloudText.h:205`; `FileData.cpp:788`; `ThreadedCloudSync.cpp:686`; `GuiOfflineScan.cpp:93` (the scan page too). 17 sites in 8 files; the code they describe is unreachable (§ 3.1). The fork's own doc draft has the same claim (`docs/ra-offline/rocknix-org-offline-achievements.md:25`). | Medium |
| **S2 -- a label renamed, its comments kept.** D-UI-071 (2026-09-16) renamed WI-FI SSID to WI-FI NETWORK; `WifiText.h:48`, `GuiWifi.h:11`, `GuiMenu.cpp:8887`, `MultiLineMenuEntry.h:28` still name "the WI-FI SSID row" as current (`GuiMenu.cpp:9040` is correctly historical). | Low |
| **S3 -- a pin moved, its comments kept.** `41f86ec9ba` (2026-09-20) re-pinned the proxy; `raofflineproxy-ctl:193` and `raofflineproxy-rcheevos/package.mk:6` still say the schema/submodule follows `64d03d30`; `raofflineproxy-libchdr/package.mk:6` was updated (patches 001/002's context lines carry the old hash legitimately). | Low |
| **S4 -- a mechanism changed, its header kept.** `rocknix-corekeep:32-34` "cut off at CORE_MAX_BYTES of *compressed* output"; the code (`:76-80,167-177`) caps raw bytes and says so. `StringUtil.cpp:459-461` "GuiMenu passes the password unquoted, so a space in it would otherwise leave a tail visible" -- since #198 (`GuiMenu.cpp:3162/6003`) it is quoted; the mask still handles both, the reason given is gone. | Low |
| **S5 -- a constraint written wrong.** `aethersx2-sa:12-15`, `bigpemu-sa:12-15`, `drastic-sa:11-14`: "PKG_EMUS lists this package for every device" -- `virtual/emulators/package.mk:11-12` lists only amiberry and yabasanshiro-sa in the base set; the three are added in device arms that exclude x86_64 anyway. The guard is harmless; the reason beside it is not the real one (blindspot 48's cure applied with the wrong fact). | Low |
| **S6 -- a comment true of the upgrade path only.** `es_savestates.cfg` header: "userconfig-setup links it into /storage/.config/emulationstation on first boot"; `userconfig-setup:51-52` the same. On a clean install it is copied (F-B05). | Medium (with F-B05) |
| **S7 -- a placeholder shipped.** `raofflineproxy-cache-images:6` `D-RA-0xx`. | Low |
| **S8 -- non-ASCII before a translatable string's neighbourhood.** `GuiScraperRun.cpp:177`, `GuiScraperRun.h:38` (`·`). Harmless by position; the rule asks for ASCII. | Low |
| **S9 -- a why missing where a decision was made.** `projects/ROCKNIX/packages/graphics/cairo/package.mk` no longer says why the ROCKNIX override exists now that it names the release the generic recipe would; `raofflineproxy/package.mk` explains the 09-20 pin in prose but lacks the `# freshness: pinned --` marker the tool reads (or a bump). `tools/fork-package-freshness:73-75` holds ruby to its minor series in the tool with no line in the recipe. | Low |
| **S10 -- a doc draft the code contradicts.** `docs/ra-offline/rocknix-org-offline-achievements.md:25` (PL-11). | Medium |

**Counts of defects:** 10 shapes, 32 sites (17 + 4 + 2 + 3 + 3 + 2 + 1 + 2 + 3 + 1 -- S4 counts two sites, S9 three) across 17 files, against ≈3,700 added comment lines: under 1 %, concentrated in one reversal (S1) and three renames/moves (S2-S4). No comment lies about what the code *does* in a way that would mislead a fix -- every stale site describes a design the register records as reversed or a name it records as changed; the risk is the reader who has the file and not the register.

## 3.5 Cross-system interactions

### Interaction: `cloud_capture --retire --unlink` × `essway.service` stop
**State shared:** the manifest and the state files; the worker thread's popen. **Wipe risk:** `systemctl stop essway` SIGTERMs the whole control group mid-deletion. **Test coverage:** TESTED (CAP13 (a)-(d) on guest b; build 9's `systemctl restart essway` found the window; D-CLOUD-133 closed it with `trap '' TERM`; the harness kills a shim mid-redraw). **Finding:** safe; residual accepted (a power cut inside the script's tail); the trap sits at line 116 after the config reads (a SIGTERM in the first milliseconds kills a script that has done nothing -- neither half, fine).

### Interaction: the launch question × the transfer page × the automatic sync
**State shared:** one flock; `ThreadedCloudSync::isRunning()`, `CloudTransferJob::current()`. **Wipe risk:** a rename landing under a game that has the save open. **Test coverage:** TESTED for the sync (time-to-play's press, 1.03 s; frames); the transfer branch (`FileData.cpp:831`) is UNREACHABLE after D-UI-078 (the page refuses B while running). **Finding:** safe; a dead branch with live comments (S1).

### Interaction: `es_savestates.cfg` × `userconfig-setup` × `post-update` × the interface's read order
**State shared:** `/storage/.config/emulationstation/es_savestates.cfg`. **Wipe risk:** none (equal bytes); a future change to the shipped file does not reach a fresh device until its first update. **Test coverage:** UNTESTED (the rehearsal tests the upgrade path only; nothing boots a fresh image and reads the link). **Finding:** risky-latent (F-B05); the rule's own prescription -- exclude the file from the copy as the two upstream files are -- is one token.

### Interaction: the crash handler × `Log`'s mutex × `essway`'s restart
**State shared:** `Log::mMutex` (`std::mutex`). **Wipe risk:** a fault while the mutex is held turns a crash (restart in seconds) into a hang (no restart: `essway` restarts on exit; the SoC watchdog catches a stopped kernel, not a stopped program -- `handheld-evidence.md`). **Test coverage:** UNTESTED. **Finding:** risky (F-B32); the comment accepts a lost backtrace and does not name the hang.

### Interaction: the rotation record × the static caches × the SCREENSHOTS list
**State shared:** `CaptureRotation::sKnown`, `DisplayAspect::known`. **Wipe risk:** none; staleness for one interface session. **Test coverage:** UNTESTED in the order "view a screenshot, then play the game, then view it again". **Finding:** risky for the device box #245-4 (it can read as a failure that is not one).

### Interaction: the ceremony gate × the pushing worktree × CI
**State shared:** `.githooks/pre-push` runs `$hooks_root/tools/ceremony-check` -- the tool of the worktree being pushed from. **Wipe risk:** a push of `next` from a worktree cut before #254 (or `git push origin feature/x:next`) skips the gate silently; CI catches it later (red, not blocking). **Test coverage:** the gate's positives were constructed from the primary only. **Finding:** risky (F-D51).

### Interaction: `frame-diff` × the walks' fixtures × the accepted baseline
**State shared:** `walk-baseline/BASELINE.txt`, the manager fixture's mtimes, `default-pre`'s state. **Wipe risk:** a fixture change lands as 156 unclaimed boxes (run 17 -- the suite failing closed). **Test coverage:** TESTED (runs 17-21, the tip's 0 boxes). **Finding:** safe; `claims.txt` is empty at the tip so every future change fails until claimed -- the strict state D-QA-038 wants.

### Interaction: the startup index × the link-up rerun × the top-up
**State shared:** `startIndexesAtStart(window, true)` on link-up (`NetworkThread.cpp:232`), the ctl's top-up `--after-index`. **Test coverage:** PARTIAL (both proofs took the first path; the rerun has no observed positive). **Finding:** unproven, not broken.

### Interaction: `fork-package-freshness` × the `pr/` guard × upstream's movement
**State shared:** none in code; a process gate. **Finding:** the check is red today with no pinned line; the guard that would block a PR is a prose checklist (`fork-workflow.md`), not the hook.

## 3.6 What is missing (with the searches)

| Missing | Search trail | Proximate work that could have added it |
| --- | --- | --- |
| French frames for #203's question | `ls docs/qa-frames/2026-09-1[5-9]/ docs/qa-frames/2026-09-2[0-4]/ \| grep '^203-' \| grep -c -- '-fr'` -> 0 (10 EN) | #203 box 3 says "FR not yet" |
| 1280x800 frames for #182 and #193; an online #193 frame | `grep -c '^182-'` -> 1 (640x480); `193-*` two files, both 640x480 offline | none |
| The `manager-gb` walk frame | `ls docs/qa-frames/2026-09-23/ \| grep 252-walk-manager` -> `fbn`, `nes` | #252 box 3 cites three |
| A VM frame for #192's two card lines | `grep -c '^192-'` -> 0 | the comment: "not framed on the VM this round" |
| A red run of `fork-checks.yml` | `gh run list --workflow fork-checks.yml --limit 6` -> six `success` | #254 box 2 open |
| A positive for `--wrap-mode=nodownload` | the work logs and #226 name only the accidental DNS-less failure before the guard | #226 box 4 (an empty `find`) |
| A test of the clean-install link for `es_savestates.cfg` | `grep -n 'es_savestates' tools/last-good-scripts-test tools/vm-upgrade-rehearsal tools/vm-qa` -> the rehearsal seeds states, never reads the link; guest d shows the copy | #196 box 1 |
| A non-empty floor on a generated rotation table | `grep -n 'wc -l' projects/ROCKNIX/packages/emulators/libretro/*/package.mk` -> the echo only | #248 box 3 |
| `tools/retroarch-wrapper-test` in a suite | `grep -c retroarch-wrapper-test tools/vm-qa` -> 0 | #225 box 3 |
| The REFRESH ACHIEVEMENT STATUS row D-UI-077 names | `grep -rn 'REFRESH ACHIEVEMENT STATUS' es-app/src` -> 0 | #224 open (backend shipped `87d9969bbb`) |
| `docs/save-manifest-schema.md`'s `copy` op and the dropped renumber | D-CLOUD-132 says it "is owed a correction"; `git log 95e4961fb3..443028ff7a -- docs/save-manifest-schema.md` -> (not checked for content; the row says owed) | #205/#206 |
| The four tools in `instruction-files.md`'s table | `grep -c '\`archaeology\`\|\`ceremony-check\`\|\`frame-diff\`\|\`work-log-index\`' .claude/rules/instruction-files.md` -> 0 each | #253/#254/#252 |
| Phase 7 outcomes in #186's index | `awk` over `05-punch-list.md`'s YAML -> 32 `open`, 1 `resolved` | #186's closure 2026-09-21 |
| A `docs/retros/` entry since 2026-09-04 | `ceremony-check`: "retro last 2026-09-04" | #254 box 3 |

## 3.6.5 Defect shapes, traced to every site

| Shape | Site | Siblings / adjacent | Class |
| --- | --- | --- | --- |
| A design reversed, its comments and code kept (S1) | `GuiCloudTransfer.h:25` | 16 more comment sites (§ Comment quality S1); `GuiMenu.cpp:5025-5110`, `FileData.cpp:831` (unreachable code); `docs/ra-offline/…:25` (S10) | FIX-NOW (comments, doc), FILE-FOLLOWUP (the dead paths: keep the post-run outcome, drop the live line and the transfer launch branch, or record why they stay) |
| A name/pin/mechanism changed, its comment kept (S2-S4) | `WifiText.h:48` | `GuiWifi.h:11`, `GuiMenu.cpp:8887`, `MultiLineMenuEntry.h:28`; `raofflineproxy-ctl:193`, `raofflineproxy-rcheevos/package.mk:6`; `rocknix-corekeep:32-34`; `StringUtil.cpp:459-461` | FIX-NOW |
| A guard with no observed positive (blindspot 14) | `scripts/build` `--wrap-mode=nodownload` | `.githooks/pre-push:226-228` INDEX warning; `fork-checks.yml` red; `tools/retroarch-wrapper-test`; `archaeology`'s constructed case; the pre-push ceremony gate from a foreign worktree | FILE-FOLLOWUP (one constructed positive each) |
| Success reported over a no-op | `SaveStateBookkeeper.cpp:85` (`save state copy recorded` on rc 0 for a non-member) | `fbneo-lr/package.mk:38` and the four MAME/FBA recipes (`0 games with a turn` builds green); `raofflineproxy-ctl:1297/1300` (`exit ${EX_USAGE}` -> 0); `tools/lint-audit-artifacts` (reads the outcomes table, never the index that disagrees with it) | FIX-NOW (the exit, the floor), FILE-FOLLOWUP (the log line, the lint) |
| A clean-install path that diverges from the upgrade path | `userconfig-setup:13` (`es_savestates.cfg` not excluded) | `post-update:32` (correct); `es_savestates.cfg` header and `userconfig-setup:51-52` (S6) | FIX-NOW |
| Unlink after refusing to record | `cloud_capture:237-244` with `:1308-1316` | `--adopt`'s membership refusal (`:549-556`) is the correct sibling | FIX-NOW |
| A malformed progress line / no stop path for a verb | `raofflineproxy-ctl:1279` (`mark_running images`) | `:1309` (`refresh`); `do_images`/`do_refresh` no `TERM` trap and no `CLIENT` (PL-30 gap) | FIX-NOW |
| A tick re-scoped by annotation, a body not edited (blindspot 27) | #45-3 | #121-2, #131-2, #150-1, #196-1 (`libretro`), #186 PL-04 ("three probes"), PL-07 (reversed, unannotated); the unticked-though-true set #225 ×5, #247 ×3, #193 ×2, #194-2, #203-4, #195-4, #211 ×3, #182 ×2, #177 ×2, #198 ×3, #201-6 half, #191-4 half | FILE-FOLLOWUP (one pass over the bodies; the rule exists) |
| A static cache never invalidated | `DisplayAspect.cpp:44-50` | `CaptureRotation.cpp:19,27` (`sKnown` updated by the record only; `sTables` never) | FILE-FOLLOWUP |
| A scroll-loop tile without the decorator | `ImageGridComponent.h:413-417` | (the two decorated sites `:305-309`, `:377-381` are the correct siblings) | FIX-NOW (one call) |
| A generated file with no duplicate-free source | `rotation-table-fba.py` ≡ `fbneo-lr/scripts/rotation-table.py` | — | FILE-FOLLOWUP |

## 3.7 Retrospective summary

**Architectural assessment.** Sound. Fourteen cuts, each small, each proven on the VM before a device, each with its reason in the tree. One seam (the #187 machinery under D-UI-078) and two static caches are the architectural debts; everything else the range built is reachable, tested by a suite or a harness section, and described in a rule.

**Doctrine alignment: MEDIUM-HIGH.** The engineering rules hold where they are enforced by a tool (pkgcheck, the harness, register-check, vocabulary, the menu map, frame-diff, the rehearsal) and slip where they are prose: guards without a positive, a clean-install path nobody boots, an issue-tracking rule broken a dozen times in one round under RC pressure (working-principles § "Under pressure, do more checking" names exactly this). The comment face is strong overall (≈3,700 lines, two non-ASCII, zero TODO, every decision cited by a real ID save one placeholder) and weak in one specific way: a reversal or rename leaves its old sentences behind -- 32 sites, 17 of them one reversal.

**Cross-system interactions.** Eight examined; two risky-latent (the clean-install copy, the crash handler's hang mode), one risky by reach (the push gate), one unproven (the link-up rerun), the rest tested and safe.

**Spec drift.** The register and the code agree except D-UI-077 (a row the register names and the interface does not have) and the stale texts of boxes the register superseded.

**Missing artifacts.** Fourteen, listed with their searches; none blocks a player, several block a box from being honestly ticked.


---

# PACKET 3 of 4: 04-analysis.md (through Finding Verification)

# Audit Analysis — The release-candidate round (work since #186)

**Date:** 2026-09-24
**Spec:** the issue bodies on `maxengel/rocknix` (the RC round #236 and every issue opened or closed since 2026-09-14), `docs/decision-register.md`
**Issues:** #45 #47 #102 #115 #121 #131 #150 #152 #153 #157 #162 #164 #175 #176 #177 #178 #181 #182 #183 #184 #186 #187 #188 #189 #190 #191 #192 #193 #194 #195 #196 #197 #198 #199 #201 #202 #203 #204 #205 #206 #207 #208 #209 #210 #211 #212 #213 #220 #221 #222 #223 #224 #225 #226 #227 #228 #236 #237 #239 #240 #241 #242 #243 #244 #245 #246 #247 #248 #249 #250 #251 #252 #253 #254 #255 #256
**Commits:** distribution `95e4961fb3..443028ff7a` (the fork's 134 / 96 files); EmulationStation `ae9c7d56b..75ca1dac2` (57 non-merge / 108 files)
**Auditor:** Code Auditor skill v1.10.0, Claude Fable 5.1 (`claude-fable-5-1`), a fresh agent; the running log is `00-running-log.md`

---

## Executive Summary

This is the seventeenth cut of the release candidate for the RG35XX SP, audited as a milestone because it crosses every lane the fork works in: the offline-RetroAchievements proxy and its interface pages, the save state manager and its capture contract, the cloud transfer and sync surfaces, Wi-Fi, logging, the French catalogue, the build's package pins and guards, the QA harness and the ceremonies that now gate a push. 347 acceptance boxes were re-derived from the code, the shipped image on guest d, the harness and suite runs, and the filed frames: **184 PASS, 54 PARTIAL, 1 FAIL, 76 SKIP, 32 UNTESTABLE** -- an overall **PASS WITH FINDINGS**. Every mechanical check the repository owns passes at the frozen tip (pkgcheck 28/28, the busybox harness a..x, the register and vocabulary lints, the menu map, the French catalogue, the ES unit suite at 119 cases / 1302 assertions, twelve vm-qa suites with `frame-diff` at zero boxes, the upgrade rehearsal 19/19) except two that name their own defect: `fork-package-freshness` exits 1 because the proxy pin is sixteen commits behind with no pinned line, and `es-syntax-check` cannot pass three in-range translation units because of how it resolves a header reached under two paths.

**Nothing found would lose a player's progress, leak a credential, or brick a device.** The one FAIL is the fork's own draft of the rocknix.org offline-achievements page, which still tells the player to press B to keep a scan running in the background -- the design D-UI-078 reversed on 2026-09-21. The eight Medium findings are of two kinds. Three are latent code defects a careful maintainer will want closed before the candidate is called one: a clean install copies `es_savestates.cfg` where an update links it (`userconfig-setup` excludes the two upstream files from its first-boot copy and not the new one), `cloud_capture --retire --unlink` deletes a path it has just refused to record, and the crash handler logs under a plain mutex so a fault inside the logger becomes a hang that nothing on the device restarts. Five are about the record and the rules the maintainer asked this audit to hold the work to: D-UI-078's reversal left seventeen comments and two unreachable code paths describing the leavable page as the present design; the ceremony gate runs the tool of whichever worktree pushes; the syntax-check rule is unsatisfiable for three files; and the issue-tracking rule -- tick a behaviour you observed, edit the body when a comment supersedes it -- was broken some twenty-five times under RC pressure, including two issues closed as delivered with every box open.

**On comment quality, the maintainer's named face:** about 3,700 added comment lines across both repositories were counted and sampled, and the shipped scripts' comments were read whole. They are the strongest part of the work -- each header names the issue, the decision and the maintainer's words, constraints sit beside what they constrain with a date and a commit, and every decision ID cited resolves except one placeholder. The defects are 32 sites in 17 files, under one percent, and 17 of them are a single reversal whose old sentences were never swept. That is the pattern to fix, not the comments: a rename or a reversal needs a grep for its old words in the same session, and the register row that records it should list what it made stale.

## Acceptance-criteria scorecard

Per issue; the per-box entries are in `02-forward-audit.md`. "Boxes" counts the `- [ ]` lines judged (P = the 33 punch items of #186).

| Issue | Boxes | PASS | PARTIAL | FAIL | SKIP | UNT | Note |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| #186 PL (P) | 33 | 24 | 4 | 1 | 1 | 3 | PL-11 FAIL; PL-07 reversed by D-UI-078; index never written |
| #121 | 2 | 1 | 0 | 0 | 0 | 1 | box 2 ticked from a script hash |
| #131 | 2 | 1 | 0 | 0 | 1 | 0 | |
| #150 | 7 | 0 | 2 | 0 | 5 | 0 | `devices/build-dev.sh` not in the tree |
| #181 | 2 | 0 | 2 | 0 | 0 | 0 | three of six logos framed; the word cannot tell fix from restart |
| #222 | 7 | 6 | 0 | 0 | 1 | 0 | substring match weakness |
| #226 | 6 | 4 | 0 | 0 | 0 | 2 | the guard has no positive |
| #227 | 5 | 3 | 1 | 0 | 0 | 1 | freshness red at the tip |
| #228 | 4 | 0 | 0 | 0 | 4 | 0 | pinned with reasons beside version and option |
| #236 (own) | 3 | 0 | 2 | 0 | 1 | 0 | |
| #237 #255 #256 | 11 | 0 | 0 | 0 | 11 | 0 | unstarted |
| #239 #240 | 7 | 0 | 0 | 0 | 7 | 0 | open, honest |
| #244 | 4 | 3 | 1 | 0 | 0 | 0 | eleven of 49 claims checked |
| #251 | 3 | 2 | 1 | 0 | 0 | 0 | |
| #252 | 6 | 5 | 0 | 0 | 1 | 0 | the gb frame not filed |
| #253 | 5 | 2 | 2 | 0 | 1 | 0 | constructed case mis-specified |
| #254 | 5 | 1 | 1 | 0 | 3 | 0 | CI never red |
| #162 #164 #175 #176 | 12 | 10 | 1 | 0 | 1 | 0 | pre-range; the pin comment stale |
| #183 #184 | 5 | 5 | 0 | 0 | 0 | 0 | |
| #186 (own) | 3 | 0 | 3 | 0 | 0 | 0 | |
| #188 #189 | 9 | 6 | 2 | 0 | 0 | 1 | |
| #190 | 5 | 3 | 1 | 0 | 0 | 1 | 4.6 s against 3 s |
| #193 #194 #199 | 11 | 5 | 2 | 0 | 1 | 3 | |
| #211 #212 #213 | 17 | 10 | 3 | 0 | 1 | 3 | |
| #220 #221 #223 #224 | 21 | 0 | 0 | 0 | 21 | 0 | not planned / open |
| #225 | 5 | 1 | 2 | 0 | 2 | 0 | closed with all five open |
| #242 | 3 | 2 | 1 | 0 | 0 | 0 | EN and the cached shape only |
| #195 | 6 | 3 | 0 | 0 | 2 | 1 | |
| #196 | 8 | 4 | 3 | 0 | 1 | 0 | the clean-install copy (F-02) |
| #197 | 4 | 0 | 0 | 0 | 4 | 0 | not planned (D-UI-059) |
| #202 | 2 | 1 | 0 | 0 | 0 | 1 | |
| #205 #206 #207 | 14 | 14 | 0 | 0 | 0 | 0 | the unlink-after-refusal (F-03) beside it |
| #209 | 5 | 3 | 1 | 0 | 0 | 1 | |
| #243 #245 | 8 | 5 | 1 | 0 | 0 | 2 | the synthetic SET_ROTATION |
| #246 #247 | 7 | 5 | 2 | 0 | 0 | 0 | the crash handler's hang mode (F-04) |
| #248 #249 #250 | 9 | 6 | 0 | 0 | 0 | 3 | |
| #45 #47 #102 #115 | 22 | 21 | 0 | 0 | 1 | 0 | pre-range closures |
| #152 #153 | 8 | 8 | 0 | 0 | 0 | 0 | |
| #157 | 5 | 4 | 0 | 0 | 0 | 1 | |
| #177 #178 | 5 | 1 | 3 | 0 | 0 | 1 | mechanisms in, observations owed |
| #182 | 2 | 1 | 1 | 0 | 0 | 0 | |
| #187 #204 | 6 | 0 | 0 | 0 | 6 | 0 | not planned / parked |
| #191 #192 #201 | 13 | 8 | 5 | 0 | 0 | 0 | |
| #198 | 3 | 0 | 3 | 0 | 0 | 0 | |
| #203 | 4 | 2 | 2 | 0 | 0 | 0 | no FR frame |
| #208 | 5 | 4 | 0 | 0 | 0 | 1 | |
| #210 | 5 | 4 | 0 | 0 | 0 | 1 | |
| #241 | 8 | 7 | 1 | 0 | 0 | 0 | box 6 checked the clone, not the fork's draft |
| **Total** | **347** | **184** | **54** | **1** | **76** | **32** | |

**Pass rate:** 184 of 239 decidable boxes fully met (77 %); of the 55 not fully met, 54 are PARTIAL and 1 FAIL. (SKIP and UNTESTABLE are excluded from the denominator: not planned, open design, future-dated, or a handheld's word.)

## Code Quality Assessment

### Strengths
- **Every change is small, named and reasoned.** The proxy patches, the launcher functions, the ctl verbs and the tools each carry a header that says the issue, the decision and the maintainer's words; constraints sit beside the option (`webkitgtk`'s VIDEO, `cloud_capture`'s `trap`, `setsettings.sh`'s `= "0"`).
- **Pure text has tests.** `CloudText`, `WifiText`, `TimeText`, `CaptureRotationText`, `DisplayAspectText`, `OfflineProxyUrl`, `LogPolicy`, `maskSecrets`, `SaveStateJobQueue` -- ten new unit files, 119 cases green; the rules about strings live where a test can hold them (`es-code-traps` § Pure text has a home).
- **Fail-closed by default in the new tools.** `es-menu-map-check`, `frame-diff`, `es-syntax-check` exit 2 when they cannot run; `vm-qa` SKIPs a missing baseline and never folds it into a pass; `fork-package-freshness` exits 2 on UNKNOWN.
- **The device's tools were asked.** `rocknix-corekeep`'s `gzip -l`, `head -n -N`, `date -d @` all hold on the image (guest d), and the harness runs the shipped scripts under busybox shims.
- **Read both, write the new one.** The legacy `0` for DO NOT INCREMENT; the rotation table consulted at draw time so every existing capture is right the moment the build is (D-UI-082).

### Concerns
- **A reversal kept both halves** (F-01): `GuiMenu.cpp`'s hub-row follower and `FileData.cpp`'s launch-over-transfer branch are unreachable since D-UI-078; seventeen comments describe the old design.
- **Two divergent install paths** (F-02) for one file, and a header that describes only one.
- **A refusal that still acts** (F-03): `cloud_capture`'s `finish()` unlinks every handed path once `rc != 2`.
- **A signal handler that can hang** (F-04): `LOG` under `std::mutex` inside the handler; nothing on the device restarts a hung interface (`handheld-evidence.md`, D-SYS-006 open).
- **Static caches without invalidation** (F-19); **a scroll-loop tile without the decorator** (F-17); **a success line over a no-op** (F-16); **an undefined exit code** (F-12); **a malformed progress line and no stop path for two verbs** (F-13).

### Complexity hotspots
- `raofflineproxy-ctl` (≈1,500 lines of bash; eleven verbs; the lock, the progress file, the traps and the stamp all hand-rolled) -- the file most likely to hold the next F-12/F-13.
- `cloud_capture` (≈1,500 lines; seven modes; jq merge programs as heredocs) -- correct in every tested path; the refused-path branch (F-03) is the kind of corner its size hides.
- `GuiMenu.cpp` (9,000+ lines) -- the fork's cloud, Wi-Fi and save-state rows all live here; #256 already names its coupling.
- `setsettings.sh` -- two background subshells write one appendconfig; line order is nondeterministic (harmless to RetroArch, invisible to the harness which sources one function at a time).

## Cornerstone Conformance

**Overall:** MEDIUM-HIGH -- high where a tool enforces the rule, medium where the rule is prose.

### Findings (⚠ / ✗ rows of Phase 3 § 3.2)
- ✗ `issue-tracking.md` (ticking, body edits, boxes on a checklist): ~25 instances (F-08).
- ✗ `instruction-files.md` § the fork's own tools: four tools missing from the table (F-23).
- ✗ `documentation-accuracy.md`: the fork's draft page contradicts shipped behaviour (F-07).
- ⚠ `engineering-practices.md` § Guards must fail closed: the push gate's reach, `issue: guard` unverified, the lint's silence on an index that contradicts its outcomes table, `exit ${EX_USAGE}`, the generators' zero-row echo (F-05, F-12, F-15, F-18).
- ⚠ § Verify the artifact / blindspot 13: three artifact-shaped ticks (#121-2, #196-5, #244-2); blindspot 8: three synthetic-fixture proofs (#245-2, #213-1/2, #247).
- ⚠ `upgrade-and-install.md`: the clean-install copy (F-02).
- ⚠ `rclone-cloud-sync.md` / D-CLOUD-053: the unlink after a refusal (F-03).
- ⚠ `es-native-ui.md`: the reversed design's comments and code (F-01); the syntax-check rule unsatisfiable for three files (F-06).
- ⚠ `es-code-traps.md`: two non-ASCII comment lines (F-26).
- ⚠ `fork-workflow.md` / D-WORKFLOW-024: freshness red at the tip (F-14).
- ⚠ `change-log.md`: the heading's date (F-24).
- ⚠ `device-builds.md` § late binding in a merge: guard comments with a false premise (F-10).

## Spec Fidelity

### Aligned
Every register row dated in the window is honoured in code (Phase 3 § 3.3): the Batocera parity set (D-UI-057/059/069/083), the 12-hour times (D-UI-058/066), the manager's worker and the deletion as one unit (D-UI-073/074, D-CLOUD-132/133/134), the live words (D-UI-075), the checked menu map (D-UI-076), the foreground pages (D-UI-078/079), aspect and rotation (D-UI-080/081/082), the toast floor (D-UI-084), the offline pages' sources and words (D-RA-019..027), the launch question (D-CLOUD-129/130/131), the pins (D-WORKFLOW-026), the ceremonies (D-WORKFLOW-028), the keeper off on a candidate (D-QA-029).

### Diverged
- **D-UI-077** names REFRESH ACHIEVEMENT STATUS; the interface at `75ca1dac2` has no such row (the backend verb ships). Impact: a register row that reads as decided-and-built for a surface that does not exist; #224 is open and honest.
- **D-UI-060/070** (reversed by D-UI-078): the reversal is in the code's behaviour and not in its comments or its dead paths (F-01). Impact: a reader is told the old design.
- **D-QA-038's** "never on a VM pass alone": the baseline was first accepted on a VM run and became device-accepted the same night. Impact: none now; noted.
- **D-WORKFLOW-024**: the tool's own gate is red at the tip (F-14). Impact: a `pr/` branch cut today would be refused by the rule's checklist.

## Missing Artifacts
(Phase 3 § 3.6, with search trails.) French frames for #203; 1280x800 frames for #182/#193 and an online #193 frame; the `manager-gb` walk frame; a VM frame for #192; a red run of `fork-checks.yml`; a positive for `--wrap-mode=nodownload`; a test of the clean-install link; a non-empty floor on the generated tables; `retroarch-wrapper-test` in a suite; the REFRESH row D-UI-077 names; `docs/save-manifest-schema.md`'s `copy` op; the four tools in `instruction-files.md`'s table; #186's index outcomes; a `docs/retros/` entry.

## Risk Assessment

| Risk | Severity | Impact | Mitigation |
| --- | --- | --- | --- |
| A fresh device's `es_savestates.cfg` is a copy; a future change to the shipped file does not reach it until its first update; the header says otherwise (F-02) | Medium | latent divergence between clean install and upgrade; wrong comment | add `es_savestates.cfg` to `userconfig-setup:13`'s exclude list; fix the two comments; a harness case that boots a fresh image and reads the link |
| `cloud_capture --retire --unlink` deletes a path it refused to record (F-03) | Medium | a root `rm -f` on a caller's bad path, no manifest row; contradicts D-CLOUD-053 | skip the refused paths in `finish()`'s unlink (mirror `--adopt`'s refusal); a CAP13 case with an outside path |
| The crash handler hangs when the fault is inside `Log` (F-04) | Medium | a crash that would restart in seconds becomes a hang no watchdog catches (D-SYS-006 open) | drop `LOG`/`flush` from the handler or `try_lock` with a bounded wait; keep the `write(2)` backtrace; route SIGINT to the old `exit` path or document the change |
| The push gate runs the pushing worktree's tool and skips silently without it (F-05) | Medium | a push of `next` from an older worktree bypasses the blocking ceremonies | run the primary's tool by absolute path (as `core.hooksPath` already is) and refuse when it is missing |
| `es-syntax-check` false FAILs (F-06) | Medium | the pre-bump rule cannot be satisfied for three files; a FAIL that is noise trains the eye to ignore FAILs (the 09-22 chain did) | resolve every include to one root (`-iquote` the worktree's `es-app/src` and `es-core/src` unconditionally, or compare header content) |
| Seventeen comments and two dead paths describe the reversed #187 design (F-01) | Medium | the maintainer's comment-quality face; a reader of the header is misled | sweep the sites (list in Phase 3 § S1); decide the dead paths' fate |
| The rocknix.org draft says B backgrounds the scan (F-07) | Medium | a docs PR built from it would document behaviour that does not ship | rewrite the sentence to CANCEL; #241 box 6 to check the fork's draft too |
| Ticks that are not observations; delivered items unticked; bodies unamended (F-08) | Medium | the tracker no longer says what is done (blindspots 13, 27, 51) | one pass over the ~25 sites; a `ceremony-check` rule for closed-completed issues with open boxes |
| The remaining Low findings | Low | comment truth, tool sharpness, one-line defects | the punch list |

## Coverage Boundary
As `02-forward-audit.md` § Coverage Boundary, in one sentence each: **examined** -- every fork-changed distribution file and the ES mechanisms behind every ticked box (code-read), fifteen mechanical checks run at the tip (test-run), guest d and the tip's vm-qa and rehearsal reports (runtime-probed); **not examined** -- an H700 squashfs, the #168 and PL-19 issue bodies, an exhaustive `LOG(` sweep, the rule's exact unit-test command, `#79`'s row, the ES repo's own hook, the harness `--old` runs, frame pixels beyond names and counts, the prior audits' second-opinion seats; **not exercised** -- any handheld (26 boxes), A53 speed, real providers, a real hotspot lag, ten reboots, a real `SET_ROTATION`, a fault inside `Log::write`, the gate from a foreign worktree, a constructed missing meson dependency, a red CI run.

## Finding Verification (Phase 4.5)

No finding is Critical or High. The eight Medium findings were nonetheless put through the refutation pass; each survived.

| Finding | Severity | Survived refutation? | What was checked |
| --- | --- | --- | --- |
| F-01 reversed design's comments and dead paths | Medium | yes | `grep` sweep of the shape over `es-app/src` and `es-core/src` (19 hits, 17 stale, 2 legitimately about the sync card); `GuiCloudTransfer::input` re-read: every press but B (-> `askCancel`) refused while running, so no run reaches the background; `CloudTransferJob::current()` call sites re-read (`GuiMenu.cpp:5025,5087`, `FileData.cpp:831`) |
| F-02 clean-install copy | Medium | yes | `userconfig-setup:13` exclude list read; `post-update:32` loop read; the installed `/usr/share/post-update` on guest d has the loop; guest d (`/storage/.configured` 21:11, no `last_*`) shows a regular file beside two symlinks; `SaveStateConfigFile.cpp:188-190` reads that path first; `cmp` says identical bytes today. Mitigation found: the first in-place update relinks it -- latent, not moot |
| F-03 unlink after refusal | Medium | yes | `cloud_capture:1299-1316` (RC=1, `continue`) and `finish():237-244` (`rc != 2` -> unlink all) re-read; the only caller (`SaveStateBookkeeper.cpp`) passes repository paths; `--adopt:549-556` refuses the same class -- the asymmetry is real, the exposure needs a bad caller |
| F-04 crash handler hang | Medium | yes | `main.cpp:355-392` and `Log.cpp:70/104/122/187` (`std::mutex`, non-recursive) re-read; `signal()` installs at `:642-646`; mitigation search: `handheld-evidence.md` states the SoC watchdog catches a stopped kernel only and D-SYS-006 (a userspace watchdog) is open; the essway unit's `Restart=` acts on exit, not on a hang (grep of the units, this session). The self-deadlock needs the fault on the thread holding the mutex -- rare, and the worst outcome on a handheld |
| F-05 the push gate's reach | Medium | yes | `.githooks/pre-push:55` (`hooks_root` = the pushing worktree) and `:229-231` (`[ -x "$hooks_root/tools/ceremony-check" ]`) re-read; CI catches it later (red, non-blocking) -- a mitigation that weakens, not removes, the finding |
| F-06 syntax-check false positives | Medium | yes | reproduced three ways (plain, `--with` one root, `--with` two roots); headers byte-identical, mtimes differ; objects for all three TUs present in the build tree at the same pin; the 09-22 work log records a chain that committed past a FAIL |
| F-07 the draft contradicts D-UI-078 | Medium | yes | line 25 read in full; `GuiOfflineScan.cpp:111-112` B -> `askCancel()`; #241 box 6's tick names the clone of rocknix.org, not this file |
| F-08 tick discipline | Medium | yes | each instance re-read from the body fetched 2026-09-24 (`02-forward-audit.md` names the box and the contrary evidence); the closing comments of #225 and #247 re-read |



---

# PACKET 4 of 4: 05-punch-list.md (the items)

# Punch List — The release-candidate round (work since #186)

**Generated:** 2026-09-24
**Source Audit:** `docs/audits/2026_09_24-milestone-rc-round-since-186/04-analysis.md`
**Total Items:** 30 (Critical: 0, High: 0, Medium: 8, Low: 22)

---

## Instructions for Executing Agent

This punch list was generated by the Code Auditor. Each item is a discrete, actionable fix; items are ordered by priority. The maintainer's rule for a release candidate is D-WORKFLOW-015/016: every severity is fixed before the candidate is called one. For each item: read the description and its evidence in `02-forward-audit.md` / `03-retrospective.md`, implement, verify the Acceptance with the command it names, record the outcome in the YAML index below and in the Phase 6 issue's checklist (Phase 7: re-derive each outcome from a command, never from memory). Nothing here edits a device; the VM is the proof.

---

## Medium Priority

## PL-001: A clean install copies `es_savestates.cfg` where an update links it
- **Severity:** Medium
- **Category:** Cornerstone Violation (upgrade-and-install: the clean-install path)
- **Source Finding:** AC-B05 / F-02 / comment shape S6
- **Owner area:** `projects/ROCKNIX/packages/sysutils/systemd/scripts/userconfig-setup`; `projects/ROCKNIX/packages/ui/emulationstation/config/common/es_savestates.cfg`
- **What:** add `es_savestates.cfg` to the first-boot `rsync --exclude={…}` so the `ln -s` at line 55 can succeed, as it does for `es_features.cfg` and `es_systems.cfg`; make the cfg header (lines 18-20) and the comment at `userconfig-setup:51-52` true of both paths; add a harness or vm-qa check that a freshly booted image has the symlink.
- **Where:** `userconfig-setup:13` (the exclude list), `:51-56`; `es_savestates.cfg:18-20`; `post-update:29-34` (already correct).
- **Why:** upgrade-and-install § "The two questions": a device flashed fresh and one updated must land in the same state; today the fresh one holds a copy that a future change to the shipped file would not reach until its first update, and the header says the opposite.
- **Evidence:** guest d (a fresh install of `443028ff7a`, `/storage/.configured` 21:11, no `last_*` file): `ls -la /storage/.config/emulationstation/ | grep es_` -> `es_features.cfg ->` and `es_systems.cfg ->` symlinks, `es_savestates.cfg` a 1518-byte regular file with the image's mtime; `userconfig-setup:13` `rsync -a --ignore-existing --exclude={es_features.cfg,es_systems.cfg} /usr/config/* /storage/.config/`.
- **Acceptance:** on a GENERIC_X64 guest booted from a fresh image, `readlink /storage/.config/emulationstation/es_savestates.cfg` prints `/usr/config/emulationstation/es_savestates.cfg`; the rehearsal still passes; the two comments read true of a clean install and an update.

## PL-002: `cloud_capture --retire --unlink` deletes a path it refused to record
- **Severity:** Medium
- **Category:** Cornerstone Violation (D-CLOUD-053: record before unlink; guards fail closed)
- **Source Finding:** AC-B17 / F-03
- **Owner area:** `projects/ROCKNIX/packages/network/rclone/sources/cloud_capture`
- **What:** in `finish()`, unlink only the paths the retire step accepted (a `RETIRED_OK` array filled where the row is written), never one that `retire_rel` refused (`RC=1; REASON=retire-outside-root`); say so in the header line 83 ("removes exactly the files --retire was handed" becomes "…it accepted"); add a CAP13 case with an outside path.
- **Where:** `cloud_capture:237-244` (the unlink loop, gated on `rc != 2`), `:1308-1316` (the refusal), `:83` (the header).
- **Why:** the script's contract and D-CLOUD-053 are "the row, then the files"; the refused branch does the files with no row, as root. The only caller passes repository paths, so the exposure is a future caller -- which is what a refusal exists for. `--adopt` already refuses the same class (`:549-556`).
- **Evidence:** `cloud_capture --retire --unlink /tmp/probe` (a file outside `SAVESPATH`) at the tip: `log_warn … outside the saves folder; not recorded`, `RC=1`, then `finish()` runs `rm -f -- /tmp/probe` because `1 != 2`. Read from the source; reproduce on a guest with a scratch file.
- **Acceptance:** the same command leaves `/tmp/probe` in place and exits 1 with the warning; `tools/cloud-round-trip` CAP13 gains the case and PASSes; the header sentence is true.

## PL-003: The crash handler logs under a `std::mutex` and can turn a crash into a hang
- **Severity:** Medium
- **Category:** Code Quality (async-signal safety) / Interaction Defect (handler × Log × essway)
- **Source Finding:** AC-B32 / F-04
- **Owner area:** EmulationStation `es-app/src/main.cpp`
- **What:** remove `LOG(LogError)` and `Log::flush()` from `signalHandler` (keep the `write(2)`-based `backtrace_symbols_fd`, which needs no lock), or guard them with a `try_lock`-style bounded attempt; either restore SIGINT's previous `exit()` path (it ran `atexit`, including `SaveStateBookkeeper::shutdown`) or state the change in the comment; install with `sigaction(SA_RESETHAND)` so a second fault in the handler cannot loop.
- **Where:** `main.cpp:355-392` (the handler), `:642-646` (`signal(SIGINT/SIGSEGV/…)`); `es-core/src/Log.cpp:70,104,122,187` (`std::mutex mMutex`, non-recursive).
- **Why:** a SIGSEGV raised while the faulting thread holds `Log::mMutex` (inside `Log::write`, or in malloc under it) blocks the handler on the same mutex: the interface stays alive and unresponsive; `essway.service` (`Restart=always`) restarts on exit, not on a hang, and the SoC watchdog catches a stopped kernel only (`handheld-evidence.md`; D-SYS-006 open). The comment names the lost-backtrace risk and not this one.
- **Evidence:** the handler and `Log.cpp` read (Phase 1.10); `grep -rn 'WatchdogSec' projects/ROCKNIX/packages/ui/emulationstation/` -> none.
- **Acceptance:** the handler contains no call that takes a lock or allocates (`grep -n 'LOG( or flush()' es-app/src/main.cpp` inside `signalHandler` -> 0); `tools/es-syntax-check` PASSes the file; on a guest with `Debug=true`, a deliberate fault raised from a thread inside `Log::write` (a test hook, or `kill -SEGV` timed against a log flood) ends the process and `essway` restarts it within seconds; the SIGINT behaviour is either the old one or documented.

## PL-004: The `next` push gate runs whichever worktree's `ceremony-check` is pushing, and skips silently without one
- **Severity:** Medium
- **Category:** Cornerstone Violation (guards must fail closed; blindspots 14, 26)
- **Source Finding:** AC-D51 / F-05
- **Owner area:** `.githooks/pre-push`; `tools/ceremony-check`
- **What:** resolve the tool from the hook's own location (the hook already lives at an absolute `core.hooksPath` -- use `$(dirname "$0")/../tools/ceremony-check`) and refuse a push of `next` when it is missing or not executable; in `ceremony-check`, make `issue: guard` require a named guard file that exists (as blindspot entries ≥ 52 already must), and narrow the retro marker to `docs/retros/` or a heading that begins with the ceremony's name rather than any heading containing the word.
- **Where:** `.githooks/pre-push:55` (`hooks_root="$(git rev-parse --show-toplevel)"`), `:229-236`; `tools/ceremony-check:121` (`\bretro\b|retrospective`), `:147` (`m.group(2).lower() == 'none'`).
- **Why:** a guard whose presence depends on the tree being pushed is absent exactly when an older worktree pushes (`git push origin feature/x:next` from a branch cut before #254), and its absence looks like a pass; the CI catches it later and red, not blocking.
- **Evidence:** the hook's lines read (Phase 1.10); the gate's positives (#254 box 1) were constructed from the primary only.
- **Acceptance:** a `git push --dry-run origin HEAD:next` from a worktree with `tools/ceremony-check` removed prints the refusal; a friction line `issue: guard` with no guard file makes `ceremony-check --gate` exit 1; a work-log heading "…retro…" that is not a retro no longer resets the retro clock (a constructed case each, recorded).

## PL-005: `es-syntax-check` false-FAILs a translation unit whose header is reached under two paths
- **Severity:** Medium
- **Category:** Test Gap (the pre-bump rule cannot be satisfied for three in-range files)
- **Source Finding:** Phase 1.7b / F-06 (F-T01)
- **Owner area:** `tools/es-syntax-check`
- **What:** make every include resolve to one file: in the plain mode add `-iquote` for the worktree's `es-app/src` and `es-core/src` (and their subdirectories the build lists with `-I`) so a same-directory `#include "X.h"` and an `#include "guis/X.h"` land on the same inode; or compare header content before deciding; say in the header which roots it uses. Keep the constructed-error FAIL.
- **Where:** `tools/es-syntax-check:71-106` (the farm and the command rewrite).
- **Why:** GCC honours `#pragma once` across two paths only when mtime and size match before it compares contents; the worktree's headers (09-14/15) and the build tree's (09-23) differ in mtime, so `GuiGameAchievements.cpp:14 #include "GuiGameAchievements.h"` (own directory, the worktree) and `GuiGameAchievements.h:8 #include "GuiRetroAchievements.h"` (the build tree via `-I`) are "two files" and the class is redefined. `es-native-ui.md` says a `.cpp` is not ready to merge until this passes; for three files it cannot, and the 09-22 work log shows a chain that committed past a FAIL.
- **Evidence:** `./tools/es-syntax-check --tree <qa-integration> <55 changed .cpp>` -> 52 OK, 3 FAIL (`GuiGameAchievements.cpp`, `GuiRetroAchievements.cpp`, `InputManager.cpp`); the same FAILs without `--tree`; `--with es-app/src` clears the first two; `InputManager.cpp` fails with both es-core roots; `cmp` says the three headers are byte-identical; the build tree holds all three objects at the same pin.
- **Acceptance:** `./tools/es-syntax-check <es>/es-app/src/guis/GuiGameAchievements.cpp <es>/es-app/src/guis/GuiRetroAchievements.cpp <es>/es-core/src/InputManager.cpp` at ES `75ca1dac2` -> PASS, exit 0; a copy with `int oops = ;` -> FAIL, exit 1; the header names the include roots.

## PL-006: Seventeen comments and two unreachable code paths still describe the design D-UI-078 reversed
- **Severity:** Medium
- **Category:** Code Quality (comment truth -- the maintainer's face) / Improvement (dead paths)
- **Source Finding:** Phase 3 § 3.1, § Comment quality S1 / F-01
- **Owner area:** EmulationStation `GuiCloudTransfer.{h,cpp}`, `CloudTransferJob.{h,cpp}`, `GuiMenu.cpp`, `CloudText.h`, `FileData.cpp`, `ThreadedCloudSync.cpp`, `GuiOfflineScan.cpp`
- **What:** rewrite the seventeen sites so they describe the sat-in page with CANCEL and name D-UI-078 where they name #187 (`GuiCloudTransfer.h:25` first: "left running, not sat in" is the exact inverse of the rule); decide the fate of the hub row's live-line follower (`GuiMenu.cpp:5025-5110`) and the launch question over a transfer (`FileData.cpp:788-831`) -- remove them, or keep the post-run outcome (D-UI-070) and record why the rest stays in the D-UI-078 row's refs.
- **Where:** `GuiCloudTransfer.h:25,81,96`; `CloudTransferJob.h:16,19,171`; `CloudTransferJob.cpp:547`; `GuiCloudTransfer.cpp:164,406`; `GuiMenu.cpp:4382,4920,4922,5033,5110`; `CloudText.h:205`; `FileData.cpp:788`; `ThreadedCloudSync.cpp:686`; `GuiOfflineScan.cpp:93`.
- **Why:** a reader of the header is told a design the screen contradicts; `engineering-practices.md` § "Before deleting a duplicate" wants the leftover's behaviours named when a mechanism is kept past its design.
- **Evidence:** `grep -rn -iE 'left running|in the background|left with B|goes on without the page|outlives the job' es-app/src es-core/src` -> 19 hits, 17 stale; `GuiCloudTransfer::input` (`:215-218`) refuses every press but B->`askCancel()` while running.
- **Acceptance:** the same grep returns only the sync card's lines (`ThreadedCloudSync.h:13`) and lines that name D-UI-078 as a reversal; `GuiCloudTransfer.h`'s first paragraph describes CANCEL; the two code paths are gone or their retention is a register ref; `es-syntax-check` PASSes the touched files; the `french` suite still 0.

## PL-007: The fork's rocknix.org draft still says B keeps the scan running in the background
- **Severity:** Medium
- **Category:** Documentation Gap (documentation-accuracy hard gate; #186 PL-11 FAIL)
- **Source Finding:** P PL-11 / AC-C35 / F-07
- **Owner area:** `docs/ra-offline/rocknix-org-offline-achievements.md`
- **What:** replace the sentence with the shipped behaviour (the page is sat in; CANCEL asks and names what cancelling means; the next scan carries on from what was saved); amend #241 box 6 to say the fork's draft was checked as well as the clone.
- **Where:** `docs/ra-offline/rocknix-org-offline-achievements.md:25`.
- **Why:** it is the draft the #168 docs PR is built from; published, it would document a control that no longer exists (`GuiOfflineScan.cpp:111-112`).
- **Evidence:** line 25 read: "You can press **B** to keep it scanning in the background and carry on; the line under the row shows how far it is, and the page can be reopened from the row." D-UI-078, 2026-09-21.
- **Acceptance:** `grep -c 'background' docs/ra-offline/rocknix-org-offline-achievements.md` -> 0 in that paragraph; the paragraph names CANCEL; #186's index marks PL-11 resolved with the commit.

## PL-008: Ticks that are not observations, delivered items left unticked, bodies a comment superseded
- **Severity:** Medium
- **Category:** Documentation Gap (issue-tracking § Ticking, § body edit in the same action; blindspots 13, 27, 51)
- **Source Finding:** Phase 3 § 3.6.5 row "a tick re-scoped by annotation" / F-08 (F-hyg)
- **Owner area:** issues on `maxengel/rocknix`
- **What:** one pass over the bodies: tick with evidence or amend the text -- #225 (five open boxes on a closed issue; boxes 4-5 struck per D-QA-039), #247 (three boxes delivered in `2337c07f73`), #193 (boxes 1-2, frames exist), #194 (box 2, D-RA-022 + patch 0013), #203 (box 4's register half, D-CLOUD-129), #195 (box 4 true at `GuiRetroAchievementsSettings.cpp:198`), #211 (boxes 1 and 5 answered in comments), #182, #177, #198 (mechanisms shipped; make or file the observations), #45-3/#121-2/#131-2/#150-1 (re-scoped in the tick -- edit the box), #150-2 (`devices/build-dev.sh` does not exist), #196-1 (`libretro` -> `retroarch`), #186's punch list PL-04 ("three probes" -> nine) and PL-07 (annotate the D-UI-078 reversal).
- **Where:** the issue bodies named; `docs/audits/2026_09_14-epic-offline-retroachievements/05-punch-list.md:71` (PL-04), the PL-07 entry.
- **Why:** the `- [ ]` list is the contract an implementer builds from and what a later round's checklist is assembled from (blindspot 51); a false or stale box costs a QA cycle.
- **Evidence:** `02-forward-audit.md` entries A31, B34, A15, A18, C24, B03, A22, C13, C10-11, C19, C02, D02, D04, D05, D06, B05, P PL-04/PL-07 -- each with the contrary artifact.
- **Acceptance:** `gh issue view <n> --repo maxengel/rocknix --json body` for each shows the box ticked with its evidence or reworded to the criterion in force; #225 and #247 carry no open box; `tools/ceremony-check` (with PL-020's extension) reports no closed-completed issue with an open box.

## Low Priority

## PL-009: Eight stale comments after a rename, a re-pin and a mechanism change
- **Severity:** Low · **Category:** Code Quality (comment truth) · **Source Finding:** Phase 3 § Comment quality S2-S4 / F-09
- **Owner area:** ES `WifiText.h`, `GuiWifi.h`, `GuiMenu.cpp`, `MultiLineMenuEntry.h`, `StringUtil.cpp`; distribution `raofflineproxy-ctl`, `raofflineproxy-rcheevos/package.mk`, `rocknix-corekeep`
- **What / Where:** "the WI-FI SSID row" as current -> WI-FI NETWORK (`WifiText.h:48`, `GuiWifi.h:11`, `GuiMenu.cpp:8887`, `MultiLineMenuEntry.h:28`; `GuiMenu.cpp:9040` is correctly historical); the schema/submodule pin `64d03d30` -> `4e9bab48` (`raofflineproxy-ctl:193`, `raofflineproxy-rcheevos/package.mk:6`); "cut off at CORE_MAX_BYTES of compressed output" -> raw (`rocknix-corekeep:32-34`); "GuiMenu passes the password unquoted" -> quoted since #198 (`StringUtil.cpp:459-461`).
- **Why:** each names a state the register records as changed (D-UI-071, `41f86ec9ba`, #247, #198).
- **Acceptance:** `grep -rn 'WI-FI SSID' es-app/src es-core/src` -> only `GuiMenu.cpp:9040`; `grep -rn 64d03d30 projects/ROCKNIX/packages/network/raofflineproxy*/package.mk projects/ROCKNIX/packages/network/raofflineproxy/sources` -> 0 (patch context lines excluded); `grep -c 'compressed output' rocknix-corekeep` -> 0; `StringUtil.cpp:460` reworded.

## PL-010: The re-added `PKG_ARCH` guards carry a reason that is false for three of five
- **Severity:** Low · **Category:** Code Quality (comment truth; blindspot 48's cure with the wrong fact) · **Source Finding:** Phase 3 § S5 / F-10
- **Owner area:** `projects/ROCKNIX/packages/emulators/standalone/{aethersx2-sa,bigpemu-sa,drastic-sa}/package.mk`
- **What / Where:** lines 12-15 / 12-15 / 11-14 say "PKG_EMUS lists this package for every device, so PKG_ARCH is the only thing keeping it off x86_64"; `virtual/emulators/package.mk:11-12` lists only `amiberry` and `yabasanshiro-sa` in the base set -- these three are added in device arms that exclude x86_64. State the true reason (belt-and-braces beside the two that need it; the aarch64-only binaries) or drop the guard with that said.
- **Acceptance:** each comment is true of `virtual/emulators/package.mk` at the tip; `tools/pkgcheck` passes the three.

## PL-011: A placeholder decision ID shipped, in a directory `register-check` does not scan
- **Severity:** Low · **Category:** Code Quality / Test Gap · **Source Finding:** AC-A23 / F-11 (S7)
- **Owner area:** `projects/ROCKNIX/packages/network/raofflineproxy/sources/raofflineproxy-cache-images`; `tools/register-check`
- **What / Where:** `raofflineproxy-cache-images:6` `D-RA-0xx` -> the row that decided it (D-RA-027, images are not a separate choice); add `projects/ROCKNIX/packages/network/raofflineproxy/sources` (and `patches/`) to `register-check:48-58`'s inputs.
- **Acceptance:** `tools/register-check` fails on a planted `D-ZZ-0yy` in that directory and passes at the tip once the line is fixed.

## PL-012: `raofflineproxy-ctl refresh` with a bad argument prints usage and exits 0
- **Severity:** Low · **Category:** Code Quality (guards fail closed) · **Source Finding:** AC-A30 / F-12
- **Owner area:** `raofflineproxy-ctl`
- **What / Where:** define `EX_USAGE=64` beside the other sysexits constants (`:238-246`); `:1297,1300` then exit 64.
- **Evidence:** `grep -c 'EX_USAGE=' /usr/bin/raofflineproxy-ctl` on guest d -> 0; `exit ${EX_USAGE}` expands to `exit`, the last command's status (the `echo`'s 0).
- **Acceptance:** `raofflineproxy-ctl refresh --bogus; echo $?` -> 64; a harness case in section t asserts it.

## PL-013: `images` and `refresh` write an unparseable progress line and have no stop path
- **Severity:** Low · **Category:** Code Quality · **Source Finding:** AC-A10/A11, P PL-30 / F-13
- **Owner area:** `raofflineproxy-ctl`
- **What / Where:** `mark_running images` (`:1279`) and `mark_running refresh` (`:1309`) glue the verb to the epoch (`at=<epoch>images`) because `mark_running` appends `$1` verbatim (`:685-688`) -- set `RUN_ROUTE` instead, or pass a leading space; give `do_images` (`:1269-1291`) and `do_refresh` (`:1293-1315`) the `CLIENT=` pid and the `trap 'stopped …' TERM` that `scan`/`topup` have, so `stop_running_run` (PL-30) ends their helper too.
- **Acceptance:** during an `images` run the progress file reads `route=images at=<epoch>`; `raofflineproxy-ctl disable` during a slow `images` run leaves no `raofflineproxy-cache-images` process within 10 s (harness t case).

## PL-014: `fork-package-freshness` is red at the tip: the proxy pin is behind and unpinned
- **Severity:** Low · **Category:** Cornerstone Violation (fork-workflow § When to merge up; D-WORKFLOW-024) · **Source Finding:** AC-D23 / F-14
- **Owner area:** `projects/ROCKNIX/packages/network/raofflineproxy/package.mk` (and `-libchdr`, `-rcheevos` if the submodules move)
- **What / Where:** bump `PKG_VERSION` (`:13`) to upstream `main` with the submodule packages following what it names, or add `# freshness: pinned -- <why> (#N)` above it; either way the recipe says which.
- **Evidence:** `./tools/fork-package-freshness` 2026-09-24: `raofflineproxy 4e9bab484e… BEHIND: 16 behind 0711f0b9b6 (2026-09-23)`, exit 1.
- **Acceptance:** `./tools/fork-package-freshness` exits 0; `pkgcheck raofflineproxy` passes; if bumped, the `ra-offline` suite or D-QA-030's equivalent call records why it was not run.

## PL-015: #186's YAML index still says `open` for 32 items while its Phase 7 outcomes table says resolved; the lint reads only the table
- **Severity:** Low · **Category:** Documentation Gap / Test Gap · **Source Finding:** AC-A07 / F-15
- **Owner area:** `docs/audits/2026_09_14-epic-offline-retroachievements/05-punch-list.md`; `tools/lint-audit-artifacts`
- **What / Where:** bring the YAML index into agreement with the Phase 7 outcomes table (`resolved` with the commit, `deferred:#N`, `withdrawn`; PL-07 `withdrawn` citing D-UI-078; PL-11 open until PL-007) -- the index is what `begin-delivery` Step 1.6 parses; make the lint compare the index against the table and fail on a disagreement.
- **Evidence:** `awk` over the YAML: 32 `open`, 1 `resolved`; `grep -c '^- \*\*Outcome' 05-punch-list.md` -> 0 (the outcomes live in the Phase 7 table); `tools/lint-audit-artifacts … --issue 186` -> PASS because it reads the table alone (`lint-audit-artifacts:66-87`).
- **Acceptance:** the index agrees with the table (no `open`); the lint exits 1 on a constructed folder whose index and table disagree, and 0 on the corrected #186 folder.

## PL-016: The bookkeeper logs "save state copy recorded" when the script recorded nothing
- **Severity:** Low · **Category:** Code Quality (verify the artifact) · **Source Finding:** AC-B21 / F-16
- **Owner area:** ES `es-app/src/SaveStateBookkeeper.cpp`; `cloud_capture`
- **What / Where:** `SaveStateBookkeeper.cpp:81-85` logs success on rc 0; `cloud_capture:549-556` exits 0 with a WARN for a path that is not a member of the unit. Either the script exits a distinct code for "nothing recorded", or the worker reads the script's `recorded N copied, M new` line and says "recorded nothing" when both are 0.
- **Acceptance:** an `--adopt` of a non-member path produces an ES log line that says nothing was recorded; the harness or CAP14 gains the case.

## PL-017: Scroll-loop tiles are created without the tile decorator
- **Severity:** Low · **Category:** Code Quality · **Source Finding:** AC-B29 / F-17
- **Owner area:** ES `es-core/src/components/ImageGridComponent.h`
- **What / Where:** `:413-417` creates loop tiles with `loadTile` and no `mTileDecorator` call; the two other creation sites (`:305-309`, `:377-381`) apply it. Apply it here too.
- **Acceptance:** the SCREENSHOTS grid style with scroll loop shows the loop copies turned and fitted like their originals (a frame); `es-syntax-check` PASSes the header's users.

## PL-018: A generated rotation table with zero rows builds green; one generator lives twice
- **Severity:** Low · **Category:** Test Gap · **Source Finding:** AC-B35 / F-18
- **Owner area:** `projects/ROCKNIX/packages/emulators/libretro/{fbneo-lr,fbalpha2012-lr,fbalpha2019-lr,mame2003-plus-lr,mame2010-lr}/package.mk`; `rotation-table-fba.py` ≡ `fbneo-lr/scripts/rotation-table.py`
- **What / Where:** after each `python3 … > …txt` (fbneo-lr `:35-38` and the four siblings), fail the recipe when `wc -l` is 0 (or under a floor); keep one generator and point both packages at it; add `python3:host` or note why the host's is assumed.
- **Acceptance:** a generator pointed at an empty directory fails `make`; `cmp` of the two generators is moot (one file); the five tables on the image keep their counts (2544/853/1924/1643/2183).

## PL-019: Three static caches are never invalidated
- **Severity:** Low · **Category:** Code Quality · **Source Finding:** AC-B27/B29 leads / F-19
- **Owner area:** ES `es-app/src/DisplayAspect.cpp`, `es-app/src/CaptureRotation.cpp`
- **What / Where:** `DisplayAspect.cpp:44-50` `known[path]` (a Transform per screenshot path, forever); `CaptureRotation.cpp:19,27` `sKnown` (updated only by `recordAfterSession`) and `sTables`. Invalidate the screenshot Transform for a game when its record is written (or key the cache on the record's mtime), so a screenshot viewed before the game's first session turns without a restart.
- **Acceptance:** on a guest: view a vertical game's screenshot (untransformed), write its record (a session or the synthetic line), view it again -> turned, without restarting the interface.

## PL-020: Five guards with no observed positive
- **Severity:** Low · **Category:** Test Gap (blindspot 14) · **Source Finding:** AC-D20, D48, D52, A22, D47 / F-20
- **Owner area:** `scripts/build`, `.githooks/pre-push`, `.github/workflows/fork-checks.yml`, `tools/retroarch-wrapper-test`, `tools/archaeology`
- **What / Where:** construct and record one positive each: a meson project with a missing dependency refused under `--wrap-mode=nodownload` (`scripts/build:190,221`); a work-log change pushed without `INDEX.md` printing the warning (`pre-push:226-228`); one red `fork-checks.yml` run then reverted (#254 box 2); `retroarch-wrapper-test` wired into a suite or its absence recorded with a reason (0 references in `tools/vm-qa`; its default path is outside the tree, `:37-43`); #253 box 1's terms fixed so the constructed case lists the four rows it names (today `'INCREMENT PER SAVE|incrementalsavestates'` matches D-UI-083 only).
- **Acceptance:** each positive is a dated line in the work log and in the owning issue's box; `retroarch-wrapper-test` appears in `tools/vm-qa --list` or the reason is in `instruction-files.md`'s table.

## PL-021: `es-menu-map-check` accepts a screen title that appears anywhere in the map's prose
- **Severity:** Low · **Category:** Test Gap · **Source Finding:** AC-D10 / F-21
- **Owner area:** `tools/es-menu-map-check`
- **What / Where:** `:153` `if title.lower() in text.lower(): continue` -- match a map heading or a row token (a line beginning with the title, or `**TITLE**`), not a substring of the whole document.
- **Acceptance:** a constructed map that mentions "TOOLS" only in a sentence reports the TOOLS screen missing; the tip still reports 0 missing.

## PL-022: `es-untranslated`'s upstream base commit is hard-coded
- **Severity:** Low · **Category:** Test Gap · **Source Finding:** AC-C06 / F-22
- **Owner area:** `tools/es-untranslated`
- **What / Where:** `:89` `--upstream 2e1564402`; derive it from the ES repo (the merge-base with an upstream ref) or read `ES_UPSTREAM_BASE` with the value recorded beside the pin, so an ES rebase does not change the count silently (it fails closed today -- more strings counted as the fork's).
- **Acceptance:** the tool prints the base it used; after a rebase the count is explained by the diff, not by a stale constant.

## PL-023: Four fork tools are missing from `instruction-files.md`'s table
- **Severity:** Low · **Category:** Documentation Gap · **Source Finding:** Phase 1.7b / F-23
- **Owner area:** `.claude/rules/instruction-files.md` § "The fork's own tools, and which rule documents each"
- **What / Where:** add rows for `archaeology` (decision-register.md), `ceremony-check` (ceremonies.md), `frame-diff` (generic-x64-vm-testing.md), `work-log-index` (learning-capture.md); they are in `.githooks/pre-push` and `fork-workflow.md` already.
- **Acceptance:** `grep -c '`archaeology`\|`ceremony-check`\|`frame-diff`\|`work-log-index`' .claude/rules/instruction-files.md` -> 4.

## PL-024: The change log's last heading is dated 2026-09-22 and carries the 23rd's and 24th's changes
- **Severity:** Low · **Category:** Documentation Gap (change-log.md § How a claim is written) · **Source Finding:** Phase 1.8 / F-24
- **Owner area:** `docs/cloud-sync-changelog.md`
- **What / Where:** from line 2171: split the #245/#248/#249/#250/#252/#209/#198/#247/#251 bullets into `## … (2026-09-23)` and `## … (2026-09-24)` sections, or date the heading as a range.
- **Acceptance:** every bullet sits under a heading whose date is the day it landed on `next`; `register-check` still passes (the file is one of its inputs).

## PL-025: Frames the boxes name were not filed
- **Severity:** Low · **Category:** Test Gap · **Source Finding:** AC-C24, C13, A15, D44, C18 / F-25
- **Owner area:** `docs/qa-frames/`
- **What / Where:** the French frame of the launch question (#203, 0 of 10 are FR); 1280x800 frames of the dimmed rows (#182) and the game page's bar (#193), and an online #193 frame; the `manager-gb` walk frame (#252 box 3 cites three); the VM frames of #192's two card lines (0 filed). All on guest d/b; the boxes then tick on them.
- **Acceptance:** the files exist under `docs/qa-frames/<date>/` with README rows; the boxes cite them.

## PL-026: Two in-range comment lines carry a non-ASCII byte
- **Severity:** Low · **Category:** Code Quality (es-code-traps § ASCII comments) · **Source Finding:** Phase 1.7b / F-26
- **Owner area:** ES `es-app/src/guis/GuiScraperRun.cpp:177`, `GuiScraperRun.h:38`
- **What / Where:** the quoted example `"GAMES SCRAPED: 12  ·  COULDN'T SCRAPE: 1"` in a comment -- write the separator as `-` or `.` in the comment (the string literal may keep `·`).
- **Acceptance:** `grep -nP '^\s*//.*[^\x00-\x7F]' es-app/src/guis/GuiScraperRun.cpp es-app/src/guis/GuiScraperRun.h` -> 0.

## PL-027: Three recipes hold a version or an override without saying why beside it
- **Severity:** Low · **Category:** Code Quality (comment: the why) · **Source Finding:** Phase 3 § S9 / F-27
- **Owner area:** `projects/ROCKNIX/packages/graphics/cairo/package.mk`; `packages/devel/ruby/package.mk`; `tools/fork-package-freshness:73-75`
- **What / Where:** cairo: one line saying why the ROCKNIX override exists now that it names the release the generic recipe would (`-Dxml` off, the meson conf, or "to be dropped when upstream PR 3359 merges"); ruby: a `# freshness: series 3.3 -- <why>` line so the tool's minor-series rule is the recipe's statement, not the tool's.
- **Acceptance:** each recipe carries the sentence beside `PKG_VERSION`; `fork-package-freshness` reads ruby's series from the recipe or documents that it does not.

## PL-028: A register row names a row that does not ship, and two offline fallbacks go the online way
- **Severity:** Low · **Category:** Spec Drift / Improvement · **Source Finding:** Phase 3 § 3.3 D-UI-077; AC-A13 leads / F-28
- **Owner area:** `docs/decision-register.md`; ES `es-app/src/RetroAchievements.cpp`, `es-app/src/OfflineAchievements.cpp`
- **What / Where:** D-UI-077 (REFRESH ACHIEVEMENT STATUS): a refining row or a ref that says the row is #224's and unbuilt at `75ca1dac2`; `RetroAchievements.cpp:602-611`: offline with no device summary the code "asks the web" (bounded 15 s) -- say the device sentence instead, as the game page does since #242, or comment why not; `OfflineAchievements.cpp:161-163`: with an address and no `online_state.json` the answer is "online" -- decide and comment (a fresh toggle-on before the monitor's first write).
- **Acceptance:** the register row is unambiguous; a guest with the toggle on, the ctl stopped and the link cut shows the summary's offline sentence within seconds, or the comment names the trade.

## PL-029: `docs/save-manifest-schema.md` is owed the `copy` op and the dropped renumber
- **Severity:** Low · **Category:** Documentation Gap · **Source Finding:** Phase 3 § 3.4 / F-29
- **Owner area:** `docs/save-manifest-schema.md`
- **What / Where:** D-CLOUD-132 says the schema "still describes the renumber and is owed a correction"; D-CLOUD-134 added the `copy` op (`cloud_capture` `op_copy`, the jq merge's `copy` branch nulling `replaces`/`pub`/`producer`).
- **Acceptance:** the schema documents `copy` with its fields and no longer describes a rescan-after-renumber; `register-check` passes.

## PL-030: `vm-upgrade-rehearsal` hard-codes the pair's key and port and carries a release-specific check
- **Severity:** Low · **Category:** Improvement (blindspot 40 shape) · **Source Finding:** Phase 1.10 / F-31
- **Owner area:** `tools/vm-upgrade-rehearsal`
- **What / Where:** `:73` `-i /tmp/rocknix-vm-pair/qa-key -P 10022 … root@127.0.0.1` and `:76` `sleep 90` -- take them from `vm-pair`'s variables; `:92` `one libcairo.so.2.*` is #226's assertion in a generic tool -- move it to a named "release checks" block or drop it when PR 3359 merges.
- **Acceptance:** the tool runs against a pair whose key path or port differs; its checks are either generic or labelled release-specific.


