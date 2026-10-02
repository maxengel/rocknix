# Week 2026-W39 (Sep 21 to Sep 27): Release candidate, cut and re-cut

Drafted 2026-09-28 from `docs/work-logs/INDEX.md` § Week 2026-W39, the day files, `docs/friction-log.md`, `docs/decision-register.md`, `docs/blindspot-register.md`, `docs/vm-qa-log.md`, `docs/releases/catalog.md`, `git log -- .claude/rules` and the fork's issues. 175 log entries over seven days: 21, 19, 18, 29, 34, 32 and 22. There is no 26th day file. The 26th's entries and all but one of the 27th's were appended to the 25th's file under `(2026-09-26)` and `(2026-09-27)` headings, which is why the index credits the 25th with 87 and reports "6 days".

## The arc

The week opened on the #236 round's second candidate (`d55169e59e`, 09-21) and the rule that a device checklist holds only what the VM cannot prove (D-QA-033). The maintainer's soak on the RG35XX SP produced a steady run of fixes. Long jobs moved to foreground pages with CANCEL (#241). The offline proxy's name lookup was bounded (#242). Captures now use the system's aspect and rotation (#243, #245, #248), and an interface crash (#246) was traced and fixed. Those fixes ran through the twenty-second cut, `664ad9ac64`, on 09-24, with milestone audit #258 and its second opinion (#260) fixed along the way. On 09-25 that cut was called the candidate (D-QA-046) and then found to be behind: webkitgtk, RAOfflineProxy, ROCKNIX by 56 commits and EmulationStation by 66. So the release-candidate procedure was written down (D-WORKFLOW-047) and followed from step 0: the merges and bumps, a clean baseline, and a code trace for every open bug (D-QA-050). The final candidate, `a65da6c784`, was on the device that night. Over the weekend the device round re-cut it again and again: the sync ceiling, one floating surface at a time, rotation records, the exit path, the offline achievements' cards, and RetroArch's notification stack. That ended at `7911c53bb4` late on 09-27, when D-WORKFLOW-053 moved the round to the two-agent upstream audit. On the process side, 17 blindspots were added (49-65), the ceremonies became a tool, checkboxes became agent-first, and the QA guests moved to hardware GL.

## What landed

- **The #236 round, second to twenty-second cut (09-21 to 09-24).** `d55169e59e` (09-21: #153's cut upload reads COULDN'T FINISH, ES `d842bbe16`), the third candidate `75603308e4` (09-22), and its cuts through the fifteenth, `aa8d525a8a` (09-23). The sixteenth, `6205420b3d`, was the batch the maintainer asked for (#209, #198, #247). The twenty-second, `664ad9ac64`, carries D-UI-089's `TODAY at` tile times and went on the RG35XX SP at 09-25 01:46.
- **Fixes from the soak (09-22 to 09-23).** #241, long jobs on a foreground page with CANCEL (D-UI-078; D-UI-079 limits it to the fork's lanes), on `75603308e4`. #242, the proxy's unbounded name lookup, on `f2f23da875`; the maintainer confirmed it on the device 09-22 15:20. #243, captures at the system's aspect (D-UI-080). #245 and #248, rotation taken from the launch log and the core's driver table (D-UI-081/082; `ed61a18d5c`, `9221b4528d`); the maintainer confirmed it 09-23 04:15. #246, an ES SIGSEGV: a rescan reloaded a view whose cursor it had just deleted. It was fixed on the ninth cut, `520e1c92ca`, which then ran forty sessions without a crash. #250, the manager's arrow (`aa8d525a8a`).
- **Audit #258 and its second opinion (09-24).** 30 findings (0 critical, 0 high, 8 medium), fixed in the eighteenth and nineteenth cuts (`a84fce38a6`, `c8609558d4`). The code-auditor gained Phase 4.6, a second model by default (#260, D-WORKFLOW-031/032); its nine items were fixed in the twentieth cut, `c041be7e98`.
- **The release-candidate procedure (09-25).** `release-candidates.md` and `tools/rc-preflight` (D-WORKFLOW-047, #271). ROCKNIX's `upstream/next` merged (56 commits, 0 behind). ES merged with ROCKNIX master (66 commits, pin `370ebe416`, D-UI-091). Baseline `e506fcd8e5`. webkitgtk 2.54.0 (D-WORKFLOW-048, #228): its "fourth wall" was a stale precompiled header from ccache. RAOfflineProxy moved to `0711f0b` (D-RA-029, #259). The candidate `57bd0de478` was rebuilt as `c939df737a` after twelve code traces (#273, D-QA-050), and the final `a65da6c784` was on the RG35XX SP at 21:26 with the preflight reading MAY BE CUT.
- **The device round (09-25 23:40 to 09-26 15:35).** #249, #279 and #280 were fixed; #282 raised the automatic sync ceiling to 90 s (D-CLOUD-137); #283 allows one floating surface at a time (D-UI-093). Together these became `a8175c6193`. #288, rotation-record provenance (D-UI-094), became `3f93dc4683`. #290 moved the exit path off the interface thread (D-LAUNCH-006) as `86dc949300`. The maintainer confirmed #249's hotkey from the pad (09-26 15:35).
- **The offline achievements' cards (09-26 to 09-27).** #292 and #293: the send and top-up cards, and a launch that asks over them (D-RA-030, D-UI-095/096; `64a0934a5d`). The capture-failure toast came with RAOfflineProxy `c1bd3724d1` (D-RA-032; `d72084ccad`). #298, #299 and #300 (D-UI-101 to 105, D-RA-035/036) produced `c9f5aa7de0` and `ed0fc38a22`. #302 made the offline notice a card and #303 swept every fork card (D-UI-106/107; `463abbca2a`, `d39ccdfff3`). #304, #305 and #306 (the transfer line, saves first at the link's return, the real history file; D-UI-108/109, D-RA-038) were proven on `7911c53bb4`.
- **RetroArch notifications (09-26 to 09-27).** #295 and #296 took patch 0019 through eight cuts: `af3aaa3af0`, `6f0a974765` and `7fd4864597`, closing on `9a64a4ad8f`. The result is a 13 px floor, and the room under the stack equals the left margin, 12 px (D-UI-097 to 100).
- **QA harness.** The frame-diff gate: runs 20 and 21 were pixel-identical, run 21 at 0 boxes over 78 frames (#252, D-QA-038, 09-23). #263: the guest's RetroArch had been drawing into a 240x256 surface (D-QA-042). #291 put the guests on hardware GL through virgl and restored llvmpipe (D-QA-052, `f483f215ad`, 09-26). A new `quoting` suite (blindspot 57). vm-qa grew from eleven suites (09-21) to fifteen (09-25).
- **Fork tools.** `es-syntax-check` (09-21), `png-blackout` (09-22), `archaeology` and `work-log-index` (#253), `ceremony-check` (#254, D-WORKFLOW-028; 09-23), `signin-memory` and `font-stems` (09-24), and `rules-check` (#269), `box-check` (#268), `release-catalog` (#267) and `rc-preflight` (#271) (09-25).
- **The upstream audit (D-QA-048).** Paused at the spend limit on 09-25. Every council and audit seat now goes through OpenRouter (D-WORKFLOW-049, 09-26). The audit resumed 09-27 23:20 on `7911c53bb4`: twenty seat calls, with 16 of 20 outputs in at 23:48.

## What was hard

- **Edits that never met a compiler.** Run 12 died on an unbraced loop body (blindspot 49, 09-21 16:32; hence `es-syntax-check`). RetroArch patch 0017 was committed on `patch --dry-run` alone and missed two callers (friction 09-24; #264, still open).
- **Settled things asked again.** Two of six open A checkboxes were already done (blindspot 51, 09-21 18:32). Four "pending decisions" had already been settled (blindspot 52; friction 09-23 18:50; #253). #159 was read as unbuilt although it shipped in RC-11 (09-24 18:30, D-WORKFLOW-040). #266 put settled facts to the maintainer (friction 09-25 01:20).
- **The ceremonies had stopped.** Fifteen cuts and six blindspots went by after 09-14 with no retro, futro or audit (friction 09-23 20:30; #254, D-WORKFLOW-028).
- **Measuring on the wrong renderer or scale.** #251's numbers measured the guest's upscaling (#263, blindspots 54 and 55). The guests had run on softpipe for a month (blindspot 63, #291). The guest's widget scale is 0.4 against the H700's 1.0 (09-25 04:12, 09-27 02:25).
- **Green over nothing.** A stale `exec.log` false-passed (blindspot 50). A timing run passed with no cloud to reach (56). A memory figure came from a page that never loaded (59). A suite started as a background job ignored SIGINT (61). Two substitutes closed #298 and ticked D-RA-035's wake checkbox: a shim that stamps at once, and a history path RetroArch never writes (blindspot 65; friction 09-27 22:44).
- **#295's reference came from prose.** Two RetroArch cuts went on a number read from patch 0016's text (friction 09-26 22:45). The stack took eight cuts across #295 and #296.
- **Fixed the writer, not what it had written.** Old rotation records stayed wrong until each game was replayed (#288, blindspot 62, D-WORKFLOW-050, #289). A wait was lengthened three times for an event the code had no path to produce (blindspot 64; friction 09-27 17:40).
- **Staging mechanics.** A dated tar name in the staging script (friction 09-24 02:16, #257). The read filter dropped `device-act` lines (friction 09-27 19:20). Apostrophes in a single-quoted label sent a garbage command and no reboot (friction 09-27 22:00). `c9f5aa7de0` reached the device as `af523c33a7` because the chain synced twice (09-27 19:15). A `/tmp` helper was lost to the reboot (friction 09-27 01:50).
- **The session's own footing.** Rules eleven files behind `next` (friction 09-24 03:05). vm-qa edited mid-run (friction 09-23 17:40). The account's spend limit stopped the auditor (09-24 03:10) and then Fable (09-25 05:26). Three headings were written an hour ahead of the clock (09-27 22:50). Bucket 8's 1 MB GPT packet failed buffered and had to be split (09-27 23:45).

## Rules and registers

- **Decisions: 96 decided rows dated 09-21 to 09-27, plus one open row (D-RA-034).**
  - **D-QA (19).** 032 ES changes before other devices' RC · 033 the device holds only what the VM cannot prove · 034 QA as the CI/CD foundation · 035 the RA reset stays a person's step · 036/037 one soak, any core · 038 frame-diff gate · 041 no hosted provider accounts · 042 RetroArch at the panel's size on guests · 043/044 agent-first criteria · 045 say checkbox · 046 candidate called after the soak · 047/048 audit before the soak, then a full two-agent audit before upstream · 049 bumps before the candidate · 050 bug dispositions on code traces · 051 bugs are agent-first · 052 guests on hardware GL.
  - **D-UI (32).** 078/079 foreground page with CANCEL, in the fork's lanes · 080-083 capture aspect, rotation, save modes · 084/086/088/097-100 RetroArch widget size and placement (098's 13 px reverses 084's 14) · 085 #187 seams kept as defence · 087/089 tile times · 090 theme fix as a PR · 091/092 IP row, own links only · 093 one surface · 094 record provenance · 095/096 automatic work shown, destination implied · 101-107 offline achievements' cards and the card sweep · 108 transfer line · 109 saves first at the link's return.
  - **D-WORKFLOW (27).** 027/038/041/042/048 webkitgtk: spike, then pinned, then first work of the next candidate, then in this one · 028 ceremonies · 029 proxy pin · 030 #258's codification gaps · 031/032 second-model audit phase · 033-037 #44 after the RC, the PR buckets, the process lane, Groundhog, shellper out of bounds · 039 no self-hosted runner · 040 #159 was built · 043 SemVer · 044/046 release catalog · 045 CLAUDE.md and AGENTS.md · 047 RC procedure · 049 OpenRouter for every seat · 050 the already-written answer · 051/052 a base accepted behind by name (two commits, then one) · 053 after `7911c53bb4`, the adversarial review.
  - **D-RA (10), D-CLOUD (4), D-LAUNCH (3), D-SYS (1).** RA-028 offline summary sentence · 029/031/032/033/037 proxy and libchdr pins · 030 send card · 035 two-pronged top-up · 036 stall-bounded fetch · 038 RetroArch 1.22 history path. CLOUD-135 retire unlink · 136 WAITING FOR A NETWORK reachable · 137 90 s ceiling · 138 a deliberate engine, never continuous sync. LAUNCH-004/005/006 one launch per log, the auto slot survives, interface back before capture. SYS-009 the lock-free fault handler.
- **Rule files.** 57 commits touched `.claude/rules/` between 09-21 00:00 and 09-27 23:59 UTC. The brief's `--until=2026-09-28` also catches six commits from 09-28. Four files were added: `change-log.md` (`381d0894c7`, 09-22), `ceremonies.md` (`de9f7ced98`, 09-23), `release-candidates.md` (`52ec7f8afa`, 09-25) and `bugs-are-agent-first.md` (`96a6083283`, 09-25). Others, by subject:
  - `eebbe61acd` long work is a foreground page with CANCEL
  - `065d5b6942` change stays inside the fork's lanes
  - `91f34e339a` a checklist built from open boxes
  - `31045f5fad` never edit a shell tool in flight
  - `4b84aaacdb` a RetroArch frame is evidence only on the panel's surface
  - `0b56120873` rules-check, and AGENTS.md standing alone for Codex
  - `dfef5e2569` say checkbox
  - `4b1221fb8a` a failing checkbox keeps CI red
  - `e446f5a906` every fix answers what was already written
  - `7ceee87293` OpenRouter for every seat
  - `23d3281cfe` ship small items with proposed words
  - `fcf4439aaa` the implied destination
- **Blindspots added (17).** 49 an edit blind to the compiler · 50 a log check that never asked whose log it was · 51 a checklist that inherits stale boxes · 52 a decisions list built from an issue's section, twice · 53 an audit headline typed, not summed · 54 a guest renderer that was not the device's · 55 54's guard reading an untied line · 56 a timing run with no cloud to reach · 57 a fix covering fewer sites than its issue named · 58 a link error the source contradicted · 59 a memory pass on a page that never loaded · 60 a fixture the harness did not own · 61 a suite started as a background job · 62 the writer fixed, the written left · 63 llvmpipe in the options, softpipe in the renderer · 64 a wait lengthened three times · 65 a proof's substitute passing where the real input failed.

## Issues

- **Opened: 70 (#237-#306).** 35 were closed within the week; the other 35 were still open when read on 09-28. The open ones:
  - **Harness and suites.** #237 round checkboxes as suites · #240 RA fixture budget · #252 frame-diff · #263 guest RetroArch surface · #278 VM harness gaps · #297 screenshot library
  - **Process tools.** #253 archaeology · #254 ceremonies · #257 stage-h700 · #264 retroarch-syntax-check · #268 agent-first criteria · #269 instruction files · #270 catalog kept current · #273 code traces · #281 build-preflight runaway · #289 already-written line
  - **Upstream and releases.** #256 upstream PR map · #260 auditor second opinion · #261 roadmap · #265 SemVer · #266 bucket B · #277 community-build items · #287 OpenRouter
  - **RetroArch fonts.** #251 sign-in banner font · #255 widget font snapping
  - **Cloud sync.** #284 per-backend sync options · #285 RomM · #286 QA WebDAV 405
  - **Offline achievements' cards.** #292 send card · #293 automatic work shown · #301 hash fetch off the UI thread · #303 card sweep · #304 transfer line · #305 reconnection order · #306 wake-check history
- **Opened and closed the same week (35).** #238 (not planned), #239, #241-#250, #258, #259, #262, #267, #271, #272, #274-#276, #279, #280, #282, #283, #288, #290, #291, #294-#296, #298-#300, #302.
- **Older issues closed (50).**
  - Completed (43): #16, #43, #45, #50, #66-#68, #82, #94, #113, #121, #151 (audit), #153-#155, #157, #160, #165, #166, #169, #170, #174, #177-#179, #181, #182, #186 (audit), #188-#190, #194, #195, #198, #199, #202, #203, #208-#211, #221, #225.
  - Not planned (7): #17, #25, #29, #87, #161, #187, #200.
  - In total 85 issues closed in the week (77 completed, 8 not planned).

## Builds and proofs

`docs/vm-qa-log.md` has 45 rows dated in the week. Each entry below gives the build, its x64/H700 run, and the verdict; "(SP)" marks a cut applied on the RG35XX SP. Time to play: 0.87-1.11 s to a game's first frame on softpipe, and 0.52-0.67 s on hardware GL from 09-26. The exit sync's stamp, where a row gives it, was 0.84-1.56 s against its 3 s budget (D-CLOUD-119).

- **09-21.** `d55169e59e` (13/4): eleven suites PASS; ra-offline 32 PASS (SP).
- **09-22.** `75603308e4` (16/7): eleven PASS, rehearsal 20/20. `f2f23da875` (17/8): ten PASS plus a `scripts` FAIL that was the harness's own, 342/0 on rerun (SP). `5d8bc093c7` and `2e2773bacf`: superseded. `220585b56b` (22/11): eleven PASS, 19/19. `8b8bc1c964` (23/12): the interface died on session 13. `520e1c92ca` (24/13): forty sessions, no core (SP). `bf53cea7e4` (25/14): superseded.
- **09-23.**
  - Eleven PASS, rehearsal 19/19: `ed61a18d5c` (26/15, SP), `428d44af40` (27/16), `9221b4528d` (28/17, SP) and `aa8d525a8a` (30/19, SP).
  - `c0c2d15179` (29/18): ten PASS plus `scripts` FAIL(2), which passed on a local rerun (SP).
  - Frame-diff rollout, runs 17-21: run 21 PASS, 0 boxes.
- **09-24.**
  - `6205420b3d` (31/20): twelve PASS, 19/19.
  - `443028ff7a` (32/21): twelve PASS (SP).
  - `a84fce38a6` (33/22): 13 PASS.
  - `c8609558d4` (34/23): 13 of 14, frame-diff FAIL on the editor's caret, then masked.
  - `c041be7e98` (35/24) and `d27858eb70` (42/25): 14 of 14, 20/20.
  - `664ad9ac64` (44/27): 13 PASS, frame-diff's six boxes claimed under D-UI-089, 20/20 (SP).
- **09-25.**
  - `e506fcd8e5` (45/28): 12 of 14; both failures were the tools' own, then time-to-play run 32 PASS.
  - `4137690ec1` (x64 48): the 2.54 sign-in window at 284 MB.
  - All fifteen PASS: `57bd0de478` (49/29), `c939df737a` (50/30) and `a65da6c784` (52/32, SP).
- **09-26.**
  - All fifteen: `a8175c6193` (56/36, SP), `3f93dc4683` (57/37, SP), `86dc949300` (58/38, SP), `af3aaa3af0` (67/45, SP) and `6f0a974765` (69/47, SP).
  - `f483f215ad` (x64 59): the first run on GL; baseline accepted.
  - `64a0934a5d` (62/40): fourteen PASS plus `scripts`, which passed in a foreground rerun.
  - `d72084ccad` (63/41): 14 of 15, a walk screen accepted as the new baseline (SP).
- **09-27.**
  - All 15 suites PASS: `7fd4864597` (70/48), `9a64a4ad8f` (71/49, SP), `b4f90b815c` (75/53), `9e9a9eda81` (78/56, proof-298 30/3), `48f940aa06` (79/57, proof 34/1), `c9f5aa7de0` (80/58, proof 35/0, on the SP as `af523c33a7`), `ed0fc38a22` (81/59, SP), `463abbca2a` (82/60), `d39ccdfff3` (83/61, SP) and `7911c53bb4` (85/63, proof 35/0).
  - The catalog stood at 75 cuts.

## What next week starts with

- **Step 6, the two-agent upstream audit (D-QA-048, D-WORKFLOW-053)**, resumed on `7911c53bb4`. 16 of 20 seat outputs were in; bucket 8's GPT seat is split into `8a-es-app` and `8b-es-core`. F-RS-11 is graded High, pending a uinput gamepad proof on a guest.
- **`7911c53bb4` is not on the device.** Its staging scripts refuse to run (rc 4) until the maintainer's words for the copy and for the reboot are in them. The RG35XX SP runs `d39ccdfff3`. Then steps 7-8:
  - the PR series by content along D-WORKFLOW-034's buckets (#256), with rocknix.org last (#42);
  - builds for the RG SP and the Retroid Pocket Nova (D-QA-046).
- **Carried in from the week.**
  - #301: an offline game-list update still holds the screen for about 40 s.
  - #303: the settings pages' rows are not yet swept.
  - #304: rclone's totals count retried bytes; noted, not fixed.
  - Also open: #289, #257, #264, #278, #270 and #286.
- **Register hygiene.**
  - D-RA-034 is still in the open table although D-RA-035 records that it "settles D-RA-034".
  - D-QA-040 (the ceremony cadences) and D-CLOUD-122 remain open.
  - The H700 `7911c53bb4` catalog row says the device "runs 9a64a4ad8f", which was already stale when it was built (`d39ccdfff3` went on at 22:02).
  - No 2026-09-26 day file exists (see the top of this page).
- **Ceremonies.** This summary is owed by Tuesday 09-29 (`ceremonies.md`). The fix round's retro landed 09-28 (`dadff14c1b`).
