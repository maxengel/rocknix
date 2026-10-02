# Research — the RC round since #258, up to `664ad9ac64`

**Auditor:** Code Auditor skill
**Date:** 2026-09-25
**Subject:** the round's product changes since #258/#260 (`c041be7e98..664ad9ac64`): #195, #192, #255, #263
**Spec:** issue bodies #195, #192, #255, #263; register rows D-UI-087, D-UI-089, D-CLOUD-136, D-UI-088, D-QA-042

---

## Running Notes

### 1.1-1.2 The spec, per issue (read in full, body and every comment, 2026-09-25)

**#192 -- the startup card's first step.** Maintainer, 2026-09-15: the card said LOOKING FOR NETWORK though the device knew the link's state. Three criteria: (1) link up -> not LOOKING FOR NETWORK, but a step that says what it does (CHECKING THE CONNECTION / CHECKING THE CLOUD; D-UI-055); (2) link not up yet -> the line says the device is waiting for a network and how long, then continues or skips (worded); (3) frames at 640x480 EN/FR of both cases on the VM, and the RG SP's own card on a normal boot. Box 3's note (2026-09-24, `a84fce38a6`): case a framed EN/FR; case b framed only as SKIPPED, because `cloud_net_ready` exited 69 with no default route (D-CLOUD-072), so the WAITING words were unreachable. Maintainer, 2026-09-24: *"If we can add the reachable wait without adding a delay to the time to play, we should do it."* In the twenty-first cut (D-CLOUD-136): `cloud_net_ready` waits while NetworkManager says `connecting` (or a carrier is up without NetworkManager) and no route exists yet, bounded by `--wait`; disconnected still exits 69 at once. Evidence claimed: harness section i, three cases PASS in vm-qa run 27; time to play 1.10 / 1.51 / 0.84 s; the WAITING frame not taken (the VM has no link that comes up after boot). **Open criteria: all three unticked in the body** -- box 3's VM half recorded in its note, its case b the RG SP's own boot. Implementation: `cloud_net_ready` (distribution, `3a200b0b50`); the interface side (`ThreadedCloudSync`, `CloudText::networkStep`) dates from RC-11, ES `ebefaddf4` -- outside this delta, but the delta makes its WAITING branch reachable for the first time, so the two are audited together.

**#263 -- the VM's RetroArch surface.** Found 2026-09-24: under sway the guest's RetroArch drew into the core's 240x256 and was scaled up, so every RetroArch frame from a guest was a resampled image. Five criteria: (1) the cfg makes the surface the output's size and the log reads 640x480 / 1280x800 -- note: in `eb131d112f`, the cfg ships 640x480 and quirk `092-retroarch-surface` follows `/sys/class/drm/*/modes`; **not deterministic** (a race in RetroArch's wayland fullscreen path, `wayland_common.c:87-104`); box open; (2) `tools/time-to-play` fails a run whose surface is under the mode -- ticked, fired on a constructed 480x432 windowed case; (3) #251's toast re-measured at 1:1 -- open; (4) blindspot 54 -- ticked; (5) `generic-x64-vm-testing.md` says RetroArch frames are 1:1 from build N on -- open. Today's session observed the race again: the first offline launch of Tobu on `664ad9ac64` came up 240x256, the second 640x480 (#194's retake).

**#195 -- the save state manager's times** (closed 2026-09-25 by this morning's sweep; read to its end before that). The in-scope part is D-UI-087 then D-UI-089: a tile's second line is `TODAY at 17:07`, `YESTERDAY at 14:03`, or the locale's date with a two-digit year and `at` the time (`AUJOURD’HUI à`, `HIER à`); the 12-hour switch decides the time's form (D-UI-058). Claimed: `shortYear` and `whenText` pure and unit-tested (es-unit-tests 124 cases PASS), `Utils::Time::dayRelation` pinned by cases (midnight, month end, year end, Feb 29, a stamp from the future), the manager's width sample measuring the widest of the three forms so the French fits, the menu map updated. Frames: `docs/qa-frames/2026-09-24/195-manager-today-yesterday-older-at-640x480-664ad9ac64.png` (all three forms, EN); today's walk on the candidate framed `YESTERDAY at 09:07` across the guest's midnight and `TODAY at 00:25` after a session. **Not framed anywhere I have found: the French forms on screen** (AUJOURD’HUI à / HIER à), though the width sample exists for them.

**#255 -- RetroArch's widget font sizes.** D-UI-086 then D-UI-088: a computed size moves up to the nearest sharp size of its face within 1.3x, never down; tables Regular 15/18/19+, Bold 17/18/21/22/25/26/28+; CJK faces untouched; the 14 px floor (D-UI-084) under it. Patch `0017-widgets-sharp-font-sizes.patch` (`eb131d112f`), its fallback callers fixed in `24badef3cb` after the H700 build stopped on `expected 9, have 7` (#264 is the syntax check that would have caught it). Criteria: (1) the stem table as a tool -- the comment of 2026-09-24 19:49 says `tools/font-stems` is it; (2) the snap as a patch with the band and cap stated; (3) frames at 640x480 and 1280x800 of the queue and the banner, before and after, with stroke counts; (4) the real panels (reworded today); (5) a register row and the change log. **Body: all five unticked**, though the comment claims 1, 2 and 5 -- a lead to verify from the tree, not a finding yet. Today's #194 retake gave a 640x480 1:1 frame of the queue at 15 px; the banner in it is at the guest's widget factor 0.4 (9 px), not the H700's 1.0.

### 1.2.5 The register rows the scope rests on

- **D-UI-087 / D-UI-089** (#195): as above.
- **D-UI-088** (#255): the fit rule; "frames at 1:1 on the twenty-first cut are the proof".
- **D-UI-084** (#251): the 14 px message-queue floor, patch 0016, the seventeenth cut -- the base 0017 builds on.
- **D-CLOUD-136** (#192): the wait while a link is coming up; **it says a game launched during WAITING cancels the sync (`ThreadedCloudSync::cancelIfWaitingForNetwork`, D-CLOUD-076's shape for this step) rather than being asked to wait.** D-CLOUD-130 (2026-09-16) says a launch over the startup or after-a-game sync *asks* STOP IT AND PLAY / KEEP WAITING instead of cancelling, and #192's comment of 2026-09-24 says a launch during the wait "meets the STOP IT AND PLAY / KEEP WAITING question". **Lead for Phase 2: which does the pinned interface do, and is the waiting step a deliberate exception?**
- **D-QA-042** (#263): the guest's surface at the panel's size; the guard in `tools/time-to-play`.
- **D-CLOUD-072 / D-CLOUD-112**: no route means no wait; the offline benchmark -- the constraints D-CLOUD-136 must keep.

### 1.7 Scope widened to the whole feature drop (2026-09-27, the maintainer's confirmation)

The notes above were written for the round since #258. On 2026-09-25 the register's D-QA-048 made step 6 of
`release-candidates.md` a full upstream audit by two seats, and on 2026-09-27 the maintainer asked: *"To
confirm, we're running the adversarial call on everything, right? Not just the most recent commits? By
everything, I mean all of the work that we'll be breaking into different commits and staging as part of this
big feature drop."* Yes. So the subject of Phase 2 is the fork-only diff of both repositories against their
upstreams -- the distribution from its merge base with `upstream/next` (`e9ff9dbd11`) and EmulationStation from
ROCKNIX's master -- read by ten packets: D-WORKFLOW-034's five buckets (1-raoffline, 2-wifi, 3-rclone-setup,
4-backup-restore, 5-cloud-sync-and-saves) plus the gaps the path map showed (6-retroarch-widgets,
7-generic-x64-vm, 8-es-menus-and-core, 9-emulators, 10-packages-and-build). Each packet went to both seats,
`anthropic/claude-fable-5.1` at xhigh and `openai/gpt-6-astra` at max, through the council's Facilitator on
OpenRouter (D-WORKFLOW-049), with the rule files the bucket is judged by embedded as sources; the packets,
manifests, briefs and every seat's output and provenance are under `seats/`. Bucket 8's gpt call failed three
buffered attempts on the 1 MB packet and was split by path into `8a-es-app` and `8b-es-core`. The spec for
this scope is not one issue's criteria but the rules themselves (`packaging-and-patches.md`, `es-player-text.md`,
`upgrade-and-install.md`, `engineering-practices.md`) and the decision register; the acceptance-criteria
scorecard in `04-analysis.md` is therefore per bucket, not per criterion.
