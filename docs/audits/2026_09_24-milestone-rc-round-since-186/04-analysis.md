# Audit Analysis — The release-candidate round (work since #186)

**Date:** 2026-09-24
**Spec:** the issue bodies on `maxengel/rocknix` (the RC round #236 and every issue opened or closed since 2026-09-14), `docs/decision-register.md`
**Issues:** #45 #47 #102 #115 #121 #131 #150 #152 #153 #157 #162 #164 #175 #176 #177 #178 #181 #182 #183 #184 #186 #187 #188 #189 #190 #191 #192 #193 #194 #195 #196 #197 #198 #199 #201 #202 #203 #204 #205 #206 #207 #208 #209 #210 #211 #212 #213 #220 #221 #222 #223 #224 #225 #226 #227 #228 #236 #237 #239 #240 #241 #242 #243 #244 #245 #246 #247 #248 #249 #250 #251 #252 #253 #254 #255 #256
**Commits:** distribution `95e4961fb3..443028ff7a` (the fork's 134 / 96 files); EmulationStation `ae9c7d56b..75ca1dac2` (57 non-merge / 108 files)
**Auditor:** Code Auditor skill v1.10.0, Claude Fable 5.1 (`claude-fable-5-1`), a fresh agent; the running log is `00-running-log.md`

---

## Executive Summary

This is the seventeenth cut of the release candidate for the RG35XX SP, audited as a milestone because it crosses every lane the fork works in: the offline-RetroAchievements proxy and its interface pages, the save state manager and its capture contract, the cloud transfer and sync surfaces, Wi-Fi, logging, the French catalogue, the build's package pins and guards, the QA harness and the ceremonies that now gate a push. 352 acceptance boxes were re-derived from the code, the shipped image on guest d, the harness and suite runs, and the filed frames: **195 PASS, 53 PARTIAL, 1 FAIL, 76 SKIP, 27 UNTESTABLE** -- an overall **PASS WITH FINDINGS**. Every mechanical check the repository owns passes at the frozen tip (pkgcheck 28/28, the busybox harness a..x, the register and vocabulary lints, the menu map, the French catalogue, the ES unit suite at 119 cases / 1302 assertions, twelve vm-qa suites with `frame-diff` at zero boxes, the upgrade rehearsal 19/19) except two that name their own defect: `fork-package-freshness` exits 1 because the proxy pin is sixteen commits behind with no pinned line, and `es-syntax-check` cannot pass three in-range translation units because of how it resolves a header reached under two paths.

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
| **Total** | **352** | **195** | **53** | **1** | **76** | **27** | the column sums of the rows above (G-11: the row read 347 / 184 / 54 / 1 / 76 / 32 until 2026-09-24) |

**Pass rate:** 195 of 249 decidable boxes fully met (78 %); of the 54 not fully met, 53 are PARTIAL and 1 FAIL. *(Until 2026-09-24 this read 184 of 239 (77 %), from a headline that was not the sum of the rows -- the seat's G-11, § Second opinion. Three printed totals disagreed: this headline, the forward audit's per-section subtotals (188 PASS, 27 UNTESTABLE, 346 boxes) and these rows. The rows are the finest-grained record, each written from the criterion entries of one issue, so they are the count; the per-section subtotals in `02-forward-audit.md` § Forward Audit Summary are marked superseded there rather than re-derived, because a section's entries roll several boxes with mixed verdicts into one heading and a heading-level recount (351 boxes, 212 PASS) cannot split them.)* (SKIP and UNTESTABLE are excluded from the denominator: not planned, open design, future-dated, or a handheld's word.)

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
As `02-forward-audit.md` § Coverage Boundary, in one sentence each: **examined** -- every fork-changed distribution file and the ES mechanisms behind every ticked box (code-read), fifteen mechanical checks run at the tip (test-run), guest d and the tip's vm-qa and rehearsal reports (runtime-probed); **not examined** -- an H700 squashfs, the #168 and PL-19 issue bodies, an exhaustive `LOG(` sweep, the rule's exact unit-test command, `#79`'s row, the ES repo's own hook, the harness `--old` runs, frame pixels beyond names and counts, the prior audits' second-opinion seats; **not exercised** -- any handheld (26 boxes), A53 speed, real providers, a real hotspot lag, ten reboots, a real `SET_ROTATION`, a fault inside `Log::write`, the gate from a foreign worktree, a constructed missing meson dependency, a red CI run. **The seat's boundary** (§ Second opinion, its § 3, thirteen rows), added here where this list did not already carry it: fix results after the packet (the twentieth cut's runs are cited per item in `05-punch-list.md`); the Wi-Fi page's ordering around a failed join (read for G-05: `GuiWifi.cpp:197-208`, the key is written only after `ok`); launchable save states across the upgrade (the rehearsal's fixtures are junk files); the link-up rerun at `NetworkThread.cpp:232` and an aged store's offline launch; the shipped Python running patch 013 (the harness runs the host's; the image's is python3 of the same minor series -- not exercised); rotation learning beyond the one Ms. Pac-Man case; `Log::write` under a fault; canonical path containment and a sync racing a capture; and equal WARNING counts (G-09), which are consistent with delivery of every ES warning and do not prove it.

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

## Instruction File Recommendations

### Coverage Gaps (would-have-prevented)

| Finding | Would have been caught by | Uncovered? |
| --- | --- | --- |
| F-01 | `.claude/rules/engineering-practices.md` § "Before deleting a duplicate, diff its behaviours" (the mirror case: a reversal that keeps the mechanism) and `decision-register.md` § "Write a row when a decision reverses" | partly -- neither says "grep the codebase for the reversed design's words" |
| F-02 | `.claude/rules/upgrade-and-install.md` § "The two questions" (clean install) | — |
| F-03 | `.claude/rules/rclone-cloud-sync.md` (D-CLOUD-053: record before unlink); `engineering-practices.md` § "Guards must fail closed" | — |
| F-04 | `.claude/rules/handheld-evidence.md` § "It catches a kernel that has stopped, not a program that has" | partly -- no rule says a signal handler may not take a lock |
| F-05 | `.claude/rules/engineering-practices.md` § "Guards must fail closed"; blindspots 14/26 (a guard bound to a path) | — |
| F-06 | `.claude/rules/es-native-ui.md` § "Before the pin moves, the compiler has seen the edit" (the rule assumes the tool passes a correct file) | **YES** for the tool's limitation |
| F-07 | `.claude/rules/documentation-accuracy.md` (docs and code change together) | — |
| F-08 | `.claude/rules/issue-tracking.md` § "Ticking an acceptance criterion", § "When a comment supersedes…" | — (written, not audited) |
| F-09, F-10 | `.claude/rules/engineering-practices.md` § "A constraint lives beside the thing it constrains" | partly -- says where a constraint lives, not that it dies with its subject |
| F-11 | `.claude/rules/decision-register.md` (`register-check` after every edit) | partly -- the tool's scan list lacks the directory |
| F-12, F-13, F-16, F-18 | `.claude/rules/engineering-practices.md` § "Guards must fail closed" ("an assertion that cannot fail is not evidence") | — |
| F-14 | `.claude/rules/fork-workflow.md` § "When to merge up" (freshness exits 0) | — |
| F-15 | `code-auditor` SKILL § Phase 7 ("an outcome asserted from memory…"); `tools/lint-audit-artifacts` | partly -- the lint reads the outcomes table and not the index |
| F-17, F-19 | `.claude/rules/es-code-traps.md` (caches: `Utils::FileSystem::exists` caches for the session) | partly |
| F-20 | `.claude/rules/engineering-practices.md` § "Prove the guard fires" | — (written, not audited) |
| F-21, F-22, F-31 | (none -- tool-internal sharpness) | **YES** |
| F-23 | `.claude/rules/instruction-files.md` § "The fork's own tools" | — |
| F-24 | `.claude/rules/change-log.md` § "How a claim is written" | — |
| F-25 | `.claude/rules/issue-tracking.md` § Ticking; `es-native-ui.md` (640x480 frames) | — |
| F-26 | `.claude/rules/es-code-traps.md` § "Comments near a translatable string must be ASCII" | — |
| F-28 | `.claude/rules/decision-register.md` (a row for a row that ships) | partly |

### Codification Gaps (needs-new-rule; 3+ instances)

| Pattern | Instances | Recommendation |
| --- | --- | --- |
| P-01: a decision reversed or a name changed leaves its old sentences in the code, the docs and the punch list | F-01 (17 sites), F-07, F-09 (8 sites), F-10, PL-07/PL-04's text | **Extend** `.claude/rules/decision-register.md` § "Write a row when" with a "Reversal sweep" subsection: a row that reverses, renames or re-pins lists the files whose comments, docs and open boxes named the old design (`grep -rn` for its words, both repos, `docs/`), and the sweep lands in the same change; `tools/archaeology` gains `--reversal <old words>` to print the list. |
| P-02: a guard wired in without an observed positive | F-05, F-15, F-20 (five tools/paths), #226's `--wrap-mode`, #254's CI | **Extend** `.claude/rules/engineering-practices.md` § "Guards must fail closed" with "the positive is recorded where the guard is wired": a hook, a CI step or a suite line is added in the same commit as a work-log line naming the constructed failure it was seen to catch; `tools/ceremony-check`'s `guards` check extends from blindspot entries to the fork tools listed in `instruction-files.md` (a tool with no recorded positive is a DUE line). |
| P-03: a tick that is not an observation, a delivered item unticked, a body a comment superseded | F-08 (~25), F-25 | **Extend** `.claude/rules/issue-tracking.md` with an audited check: `tools/ceremony-check` (or a new `tools/issue-hygiene`) reads closed-completed issues since the clock for any `- [ ]` and open issues whose last comment says delivered/built/shipped with boxes untouched, and reports them as DUE (CI red, not push-blocking). The rule already exists; it needs the stage above "written" (`working-principles.md` § enforcement depth). |
| P-04: success reported over a no-op (an echo of a count, an undefined exit, a log line on rc 0, a lint that accepts `open`) | F-12, F-15, F-16, F-18 | **Extend** `.claude/rules/engineering-practices.md` § "Guards must fail closed" with the shape: "a count that is echoed is not a floor -- assert the non-zero; an exit code named must be defined (`set -u` catches an unset variable in `exit ${X}` only when X is unset, not empty -- define constants at the top and grep for `exit \$\{` against them); a success log line is written from the artifact, not the exit status". |
| P-05: a proof made with a synthetic input where the device's own was reachable | #245-2 (a hand-appended `SET_ROTATION`), #213-1/2 (host Python), #247 (`/dev/zero`), #196-3 (command port for a hotkey) | **Extend** `.claude/rules/vm-first.md` § "The question, and where the answer goes" with: when the VM cannot produce the real input (no rotating core, no oversized process), the tick names the substitute and the box stays PARTIAL until a real input is seen once -- blindspot 8's rule applied to the tick. |

### Recommended Action Sequence
1. Fix the three latent code defects (F-02, F-03, F-04) and re-run `last-good-scripts-test` with the two new cases (the fresh-install link; a retire of an outside path); the crash-handler change gets a VM proof (a deliberate fault with `Debug=true`).
2. Sweep P-01's 32 sites (Phase 3 § S1-S4, S6-S7, S10) and decide the fate of `GuiMenu.cpp:5025-5110` and `FileData.cpp:831`; record the sweep in the D-UI-078 row's refs.
3. Harden the two guards (F-05 absolute path + refuse when missing; F-06 one include root) and construct their positives.
4. Pin or bump the proxy (F-14); define `EX_USAGE`, fix `mark_running`'s two callers, add the TERM trap to `do_images`/`do_refresh` (F-12, F-13); the tile decorator on the scroll loop (F-17); the non-empty floor on the tables (F-18).
5. The record: the ~25 box edits (F-08), #186's index outcomes (F-15), the four tools in `instruction-files.md` (F-23), the change log's heading (F-24), the draft page (F-07), the schema doc (F-29).
6. Write the three rule extensions (P-01, P-02, P-04) and the vm-first sentence (P-05); wire P-03's check into `ceremony-check`.

## Tier B — visual QA consolidation

The repo's design-review process is the frames under `docs/qa-frames/<date>/` read at 640x480 (blindspot 41) and, since #252, `frame-diff` against the device-accepted baseline. In range: 106 frames filed across 2026-09-20..24 (4 + 48 + 30 + 20 + 4); the tip's twelve suites include `frame-diff` at 0 boxes over 78 screens against `aa8d525a8a`; `claims.txt` is empty so any future change fails until claimed. Deferred visual items rolled into the punch list: the French frame of the launch question (#203), the 1280x800 frames of #182/#193, the `manager-gb` frame, the VM frames of #192's two lines, the before/after of #251 at 640x480 on the device (open box), the online #193 frame. No page-scale re-review was run here; the frames were checked by name and count and, where a tick quoted a measurement, that measurement was accepted as the tick's evidence.

## Second opinion (Phase 4.6)

**Run:** `tools/council/run invoke --member gpt --prompt-file docs/audits/2026_09_24-milestone-rc-round-since-186/second-opinions/gpt-brief.md --output docs/audits/2026_09_24-milestone-rc-round-since-186/second-opinions/gpt-6-astra-audit.md --provenance docs/audits/2026_09_24-milestone-rc-round-since-186/second-opinions/gpt-6-astra-audit.provenance.json`, started 2026-09-24 05:49 UTC, 1,125 s. **Identity gate:** `declared_model` = `openai/gpt-6-astra (OpenRouter, via openai, effort=max)`; `attempts[0].model_field` = `openai/gpt-6-astra` from `model_identity_source: provider_response`; `outcome: success`; 57,068 prompt tokens, 44,498 completion of which 37,808 reasoning. **Calls:** one -- the refutation pass over the four artifacts (`01`-`04`, the punch list's item bodies, and the mechanical results at the frozen tip; 195 KB). The skill's Milestone tier asks for a blind pass first from v1.11.0 on; this run predates the phase and was its first exercise (#260), so the blind pass is owed to the next Milestone audit, not back-filled here.

The seat returned three sections: eleven new findings (G-01..G-11), a refutation row for each of the thirty punch items, and thirteen rows it could not judge from the packet. Every row below is the orchestrator's own read of the tree at `c041be7e98` (ES `d30cbd282`), never the packet's.

| Seat item | Orchestrator's grade | Evidence |
| --- | --- | --- |
| G-01 the PNG validator accepts a body with the right signature and a bad body (seat: Medium) | **agree, re-graded Medium → Low** -- latent: the proxy caches only what the server sent, but a torn download passed by signature alone; fixed | patch `013-validate-a-cached-image-before-publishing-it.patch:79-87`: every chunk's CRC (`zlib.crc32`), the IDAT stream inflated; harness case `013 / #213 validator (G-01)`: a real 1x1 PNG published, bad-IDAT, bad-CRC and frame-only bodies refused (`tools/last-good-scripts-test`, in run 26's `harness` suite); PL-031 |
| G-02 the store-only header is read case-sensitively (seat: Medium) | **agree, re-graded Medium → Low** -- the one client, EmulationStation, sends the canonical spelling; a proxy that depends on it is still wrong; fixed | patch `012-offline-image-miss.patch`: `store_only_requested` compares `k.lower()`; harness case `012 / #199 store-only header in another client's capitalisation`; PL-032 |
| G-03 the core keeper admits a dump that takes the card under its floor (seat: Medium) | **confirmed, Medium** | `rocknix-corekeep:91,161-163`: `NEED_KB = CORE_MIN_FREE_KB + CORE_MAX_BYTES / 1024`, refused under it with the floor and the cap named; harness case `with free space above the floor but under the floor plus the cap, the dump is refused`; PL-033 |
| G-04 the first screenshot lookup walks the whole library on the interface thread (seat: Medium) | **agree, re-graded Medium → Low** -- one walk per never-seen screenshot, so a list of S new screenshots walked the library S times; fixed | ES `d30cbd282` `DisplayAspect.cpp:63-76`: `sStems` built once by `buildStems()`, cleared with `forgetScreenshots()`; `tools/es-syntax-check` PASS; PL-034 |
| G-05 the failed-join proof stops at the shell backend; the page's handling is unshown (Low) | **disagree, with the artifact** | `GuiWifi.cpp:197-208`: on `!ok` the page shows COULDN'T CONNECT and returns at `:203`; `wifi.ssid` and `wifi.key` are written at `:204-205` only after `ok`. The harness's section u proves the backend's exit codes; the page's ordering is in the source, and no path writes the key before the join answers |
| G-06 CUT cannot tell a truncated core from one of exactly the cap (Low) | **confirmed** | `rocknix-corekeep:183`: one more byte is read after the cap (`MORE`); CUT only when `RAW >= cap` and `MORE >= 1`; harness case `a dump of exactly the cap is noted whole, not CUT`; PL-035 |
| G-07 the "file that arrived while the page was open" comment promises more than the refresh does (Low) | **agree, narrowed** -- the mechanism was as designed (the disk is read only when a bookkeeping job lands); the comment overstated it | ES `d30cbd282` `GuiSaveState.cpp:524`: the comment now says when the disk is read; PL-036 |
| G-08 a dead run's well-formed progress file is never cleaned up (Low) | **confirmed** | `raofflineproxy-ctl:830`: `take_lock` removes `running` and `running.tmp` once it holds the lock, so a file a killed run left goes with the next verb; harness case `a stale running file is removed by a topup that then skips`; PL-037 |
| G-09 equal WARNING counts do not prove delivery of every warning (Low) | **agree, as an evidence note** -- no item; the boundary carries it | the count in `02-forward-audit.md` B is consistent with delivery and not proof of it; § Coverage Boundary above names it as not exercised (a planted warning and its journal line would be the proof) |
| G-10 the rehearsal's cairo check proves one versioned file, not the symlink #226 box 1 asks for (Low) | **confirmed** | `tools/vm-upgrade-rehearsal:105`: `readlink /usr/lib/libcairo.so.2` compared with the one versioned file's name; guest d on `c8609558d4`: `libcairo.so.2 -> libcairo.so.2.11804.4`; first run in rehearsal run 21; PL-038 |
| G-11 the audit's totals do not add up (Low) | **confirmed** | three printed totals disagreed: the headline (347 / 184 PASS / 32 UNTESTABLE), the forward audit's per-section subtotals (346 / 188 / 27) and the scorecard's own rows (352 / 195 / 27). The rows are now the headline (above); `tools/lint-audit-artifacts` sums every `**Total**` row against its table -- constructed positive: it failed this folder and found the 2026-09-03 audit's UNTESTABLE column printed 5 for 6; PL-039 |
| F-02 / PL-001 clean-install copy: Low, not Medium | **agree, re-graded** -- a first update repairs the copy; the fix stands because a device that never updates keeps the wrong shape | `post-update:29-34` read; the item's severity cell now says Low |
| F-07 / PL-007 the offline-achievements draft: Low, not Medium | **agree, re-graded** -- the draft was unpublished; the sentence was wrong all the same | `docs/ra-offline/rocknix-org-offline-achievements.md:25` at the fix |
| F-13 / PL-013 helper lifecycle: Medium, not Low | **agree, re-graded** -- the helper running on after `disable` is behaviour, not a display blemish; the fix's stop path and the harness's `disable` cases cover `images` and `refresh` both | `raofflineproxy-ctl` do_images/do_refresh: `trap … TERM`, `CLIENT=$!`, `wait`; harness cases `images progress line + disable`, `refresh progress + disable` |
| F-28 / PL-028 the offline fallbacks: Medium for the fallback | **agree, re-graded** -- an offline run that went online for a summary was the design's own contradiction | ES `RetroAchievements.cpp` offline no-summary path: stays offline and says THE OFFLINE ACHIEVEMENTS SERVICE DIDN'T ANSWER |
| F-29 / PL-029 manifest-schema debt "does not survive as verified" | **disagree, with the artifact** -- the schema was read at fix time; the packet did not show the read, which is a packet gap | `docs/save-manifest-schema.md` at `d52e3d81c7`: the `copy` op and the dropped renumber are in the document; the register rows D-CLOUD-132/134 said what was owed and the document lacked it before that commit |
| F-01, F-08, F-09, F-14, F-18, F-19, F-20, F-25, F-27, F-31: narrow the claim | **agree, narrowed** -- each narrowing is the shape the item's Phase 7 outcome already records (dead to the player's route, not to the compiler; tracking that is false or stale, not unticked observations; a missing guard, not a bad table; a Transform cache, not three; filing, not an absent walk) | `05-punch-list.md` § Phase 7 resolution gate, the rows named |
| F-30 is missing from the packet | **confirmed, no item** -- the number was skipped in synthesis; no finding is missing (`grep -n 'F-30' 01..05` finds only the gap) | the punch list's source column runs F-29, F-31 |

**Net effect:** 9 new punch items (G-01 → PL-031, G-02 → PL-032, G-03 → PL-033, G-04 → PL-034, G-06 → PL-035, G-07 → PL-036, G-08 → PL-037, G-10 → PL-038, G-11 → PL-039), 6 re-graded (G-01, G-02, G-04 down; F-13, F-28 up; F-02, F-07 down), 2 disagreements recorded with their artifact (G-05, F-29), 1 evidence note (G-09), 1 confirmed non-item (F-30), and the seat's thirteen could-not-judge rows carried into § Coverage Boundary. The new items are Low but one (PL-033 Medium) and ship as the twentieth cut, `c041be7e98`, under D-WORKFLOW-015. What the phase bought, in one line: the orchestrator had read `rocknix-corekeep`'s floor check and the PNG validator and passed both; a different model reading the same lines did not.

## Quality Self-Check

| Item | Status |
| --- | --- |
| Acceptance Criteria Scorecard present, IDs match 02 | present (per-issue rows; the per-box IDs are in 02's sections P, D, A, B, C) |
| Cornerstone conformance tables present | present (03 § 3.2 three faces; 04 § Cornerstone Conformance) |
| Coverage Boundary present (02 + 04) | present in both |
| Finding Verification recorded for all Crit/High | present -- none Critical/High; the eight Medium findings were refuted anyway |
| Instruction File Recommendations (milestone) | present (coverage gaps, five codification patterns, action sequence) |
| Tier B visual-QA consolidation present | present |
| Second opinion recorded (Phase 4.6; Epic/Milestone tiers) | present -- one call (the refutation pass); the Milestone tier's blind pass is owed to the next audit, the phase having been written after this run |
| Verdicts use the defined vocabulary only | yes (PASS ✓ / PARTIAL ⚠ / FAIL ✗ / SKIP ○ / UNTESTABLE ?; the four named reasons are annotations, not new verdicts) |
| Traceability / Evidence / Reproducible / Actionable / Complete | self-checked: every finding cites file:line or a command and its result; every box of every in-scope issue has a verdict (352; the headline read 347 until G-11); the punch items name file:line and a verifiable acceptance; the counts in 02's section summaries were recounted and corrected in place (P 24, A 42/15/26/8, B 42/8/7/7) |
