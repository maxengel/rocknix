# Independent blind reading — Rasteratops 0.0.1, milestone tier
You are the pinned GPT Astra second reader, called through the Council Facilitator. Read only the evidence below. The orchestrator has not supplied its findings or verdicts. You cannot access files or execute commands. Identify concrete defects or unproven critical interactions, with IDs G-01 etc, severity, exact packet file:line and trigger. Distinguish existing tracked open work, conditional future identity integration, and current product defects. Do not infer that a model probe equals a VM run. Do not expand scope to inherited kernels/emulators: D-WORKFLOW-102 defers that review to 0.0.2.

Current facts: bot identity migration is complete; OS identity remains ROCKNIX/date version on both next and feature/identity. The approved future OS_NAME is RASTERATOPS, version0.0.1, retaining DISTRO=ROCKNIX and persisted contracts except cloud root. Run101 main VM suite 14/15 (round-trip /GAMES upload0/9); corrected pair freshly42/0 on same image; fresh host suite1365 PASS zero FAIL/SKIP. Saved benchmark earlier/current medians325/266ms, target delta<=30. Whole branded-image qualification does not exist. Local predicates and code excerpts follow. Explain what the packet cannot establish. One uncertainty is not proof of data loss.

## Criteria (verdicts withheld)
- AC-344-01: `docs/rasteratops/p0-read.md` exists with one decision per row of the base plan's §2, each citing `path:line`, and its first line answers three questions: does `DISTRO=rasteratops` imply a new directory; do image and asset file names derive from `DISTRO`, `DISTRONAME` or something else; what does `rocknix-update` match on. -- done 2026-09-30, `224b73ea54`: `docs/rasteratops/p0-read.md`
- AC-344-02: The sweep report from the base plan's §1.15 command lists every hit in exactly one of four classes (display text; machine identity; persisted paths and network names; boot and storage contracts); every class 2 to 4 hit is marked KEEP, and any non-KEEP carries `path:line`, a reason and a reference to a recorded yes. -- done 2026-09-30, `224b73ea54`: `docs/rasteratops/p0-sweep.md and p0-sweep-hits.txt`
- AC-344-03: The updater note records the mechanism, the asset pattern, redirect handling, any distro-name check, draft and pre-release handling, the manual route, and the comparison function's result on `0.0.1` against RC2's version string as a table, and names Branch A (unaided over-the-air) or Branch B (manual adoption). -- done 2026-09-30, `224b73ea54`: `docs/rasteratops/p0-updater.md`
- AC-344-04: `BUILD_ID`'s derivation is quoted with `path:line`, with its timestamp and host dependence stated. -- done 2026-09-30, `224b73ea54`: `docs/rasteratops/p0-read.md § BUILD_ID`
- AC-344-05: `docs/rasteratops/support-matrix.md` exists with the columns target/arch, physical boards, QA guest, clean install, upgrade, boot medium and boot-chain deltas, recovery method, attachment status; the mandatory migration device is marked. -- done 2026-09-30, `224b73ea54`: `docs/rasteratops/support-matrix.md`
- AC-344-06: `df -B1` of the build volume and `du -sb` per existing root are recorded, with the forecast as line items (old roots, new roots, source archives, VM overlays, retained candidates). -- done 2026-09-30, `224b73ea54`: `docs/rasteratops/p0-read.md § Disk`
- AC-344-07: The per-asset size limit is recorded with its source and date; the ES licence is quoted from the ES tree; the splash repository's owner is recorded; the digest behind the build container's `:latest` is recorded; `DISTRO_SRC` or its equivalent is recorded. -- done 2026-09-30, `224b73ea54`: `docs/rasteratops/p0-read.md § Platform facts`
- AC-344-08: D-WORKFLOW-088 (present in the register; absent from the run's packet) is cited, and Choice 2 of #338 is labelled or struck. -- done 2026-09-30, `224b73ea54`: `docs/rasteratops/p0-read.md § Platform facts`
- AC-344-09: `git log -- distributions/` shows no identity commit and `git tag` shows no `0.0.1`. -- done 2026-09-30, `224b73ea54`: `docs/rasteratops/p0-read.md § Platform facts`
- AC-344-10: The three repositories are transferred and `rocknix-splash` forked; the ES and splash commits are pinned; every recipe URL and `git remote -v` in every worktree shows fork addresses.
- AC-344-11: The bot token's scope inventory (repositories × permissions × expiry) is recorded and an expiry reminder is configured on the mail channel.
- AC-344-12: A workflow grep finds no `pull_request`, `pull_request_target` or `workflow_run` job with `runs-on: self-hosted`; a trigger dry-run from a throwaway fork schedules no self-hosted job.
- AC-344-13: Isolation: `sudo -u runner test -r <path>; echo $?` prints `1` for each secret path; a canary read alerts; `sudo -u runner id` shows no `docker`; `sudo -u runner sudo -l` is empty; `sudo -u runner test -r /var/run/docker.sock` fails; the setuid audit is recorded. If any check fails, the runner is shown disabled.
- AC-344-14: The build container is mirrored under fork control; the build invocation references it by `@sha256:`; `docker inspect` or a build-log line shows that digest consumed.
- AC-344-15: A source-tarball archive index lists every fetched tarball with its hash, in fork-owned storage inside the backup scope.
- AC-344-16: A snapshot ID is recorded; a representative file is restored; the restore-drill log shows the blueprint completing a warm build on a clean host with no secret present.
- AC-344-17: The candidate store path and its `flock` wrapper are in place; the upstream base commit is recorded as frozen.
- AC-344-18: The freeze is in force with the emergency exception written. -- D-WORKFLOW-111, 2026-10-01: `upstream/next` at `9fd38fa870` (fetched 2026-09-29 11:02 UTC); the exception is a security fix for a matrix target, cherry-picked by a register row.
- AC-344-19: A cold `GENERIC_X64` build exits `0` with `DISTRONAME` set and `DISTRO=ROCKNIX` retained (or the split's completed build-and-boot log, if P0 supplied a reason); the build log is archived with the manifest; the concurrency setting is recorded.
- AC-344-20: The brand sweep reports zero unclassified hits against `NAMING.md` allowlist vN (N recorded); an injected old-logo frame fails the template match (threshold and bounding box recorded).
- AC-344-21: The localisation reconciliation lists every touched `.po` and `.xml` entry, with no orphan.
- AC-344-22: The secret sweep reports counts only, all zero.
- AC-344-23: `tools/vm-qa` reads PASS bound to a candidate-store hash equal to the manifest hash, before and after the run.
- AC-344-24: The upstream base commit is unchanged since P1.
- AC-344-25: The RC2 guest's early signal is recorded (offered or not offered; the comparison result).
- AC-344-26: A draft release exists with only the X64 asset.
- AC-344-27: The device image is built; the manifest's input block (distribution, ES and splash commits, container digest, source index) is diff-empty against P2's; the per-image `BUILD_ID` and hash are in the manifest and the candidate store.
- AC-344-28: Branch A: `docs/releases/device-facts.md` carries the migration device's row, and its device log shows discover, download, verify, install and boot unaided, with the PASS line "RC2 device, given the fork channel offering 0.0.1, is offered it and applies it"; every row of the base plan's §2.2 table has a result; the version-ordering table is written; the truncated-download, mid-install-interrupt and failed-first-boot cases each end bootable with post-upgrade hashes equal to the pre-upgrade ones.
- AC-344-29: Branch B: `docs/releases/device-facts.md` carries the migration device's row showing the seven-step procedure completed; the fork-aware updater prints "manual update required"; a network capture shows no request to the upstream host; post-upgrade hashes equal the pre-upgrade ones; the fork-to-fork proof is written as the `0.0.2` gate.
- AC-344-30: Every matrix target is built from P2's input set; the requalification check is diff-empty, or the X64 re-run is recorded.
- AC-344-31: Each asset's hash equals its manifest entry; each attached asset is under the recorded per-asset limit.
- AC-344-32: The brand, secret, leak and localisation sweeps are re-run on every image with P2's PASS conditions.
- AC-344-33: The per-SoC boot-artifact matrix is filled (upgrade against clean flash; downgrade safety); any target with a boot-chain delta has its device-facts smoke-test row before attachment.
- AC-344-34: The component inventory file has a disposition per item; the corresponding-source bundle is retrievable and hash-verified.
- AC-344-35: The channel-separation demonstration is recorded: a draft, pre-release or CI candidate is not offered on the stable channel.
- AC-344-36: Attachment follows the rule: Branch A attaches only smoke-tested targets and lists the others as "built, held"; Branch B follows the answer to question 5.
- AC-344-37: The release notes carry the support matrix with per-device verification status, adoption instructions, the trust assumption, recovery, source links, lineage and non-endorsement (not "marks retained"), the cloud compatibility exception, and the redirect dependency.
- AC-344-38: The publication yes is recorded in the action log; otherwise the state reads "stopped at immutable candidate".
- AC-344-39: Each #341 relaxation the release needs lands with a bidirectional test: the newly permitted pattern passes and the secret and PII fixtures are still blocked.
- AC-344-40: The first merge-cadence run records divergence, patch-refresh and ES conflict numbers.
- AC-344-41: The hosted-QA experiment log records N=10 boot and flow runs, the failure count and the transfer cost, with no timing claims.
- AC-344-42: Redirect-sunset tracking records the fielded devices that have completed one fork-to-fork update.
- AC-344-43: A QA-frame retention policy is written, and a one-sided regression limit for any timing gate.
- AC-344-44: The feasibility proof on `GENERIC_X64` covers display ownership, compositing, focus, controller ownership and lifecycle when either process exits; any command interface is bound to localhost with the address recorded.
- AC-344-45: A background Tier 1 report covers the files Step 0 did not touch; the launch-slice review follows the spike.
- AC-344-46: The bidirectional RetroArch → runner → RetroArch interchange test (saves, states, auto-slot, pending achievements, queue location) passes before #336 Step 1.
- AC-344-47: Each row above the owner approves is in `docs/decision-register.md` with its ID, and `tools/register-check` passes.
- AC-337-01: The register row that calls the direction (D-WORKFLOW-081's answer) names the fork's name and the licence terms it keeps (GPL-2 and MIT kept whole; the CC BY-SA attribution line; no ROCKNIX images).
- AC-337-02: A GENERIC_X64 image boots under the new name with its own splash and logo, `OS_NAME` and the updater's URL read from `/etc/os-release` and the updater's script on guest d (a frame and the two lines filed here).
- AC-337-03: The site builds from the fork's pages under the domain, with the attribution on its front page (the build log's last line filed here).
- AC-337-04: A fresh guest on the candidate, signed in to the QA cloud, creates and uses `/Rasteratops/{Saves,Backups,Content}`: `tools/cloud-test-backend ls` after a backup and a saves sync shows the three folders and nothing under `/ROCKNIX`; `grep -rn ROCKNIX projects/ROCKNIX/packages/network/rclone/sources/cloud_sync.conf*` prints nothing; `tools/vocabulary-check` passes.
- AC-337-05: Every `/ROCKNIX` cloud path in the interface and the scripts is listed by the sweep (`docs/rasteratops/p0-sweep-hits.txt`, rule `cloud-path`, 56 lines) and each is changed or marked history in the same commit; the sweep re-run on the candidate's tree lists none as current.
- AC-337-06: `DISTRONAME="RASTERATOPS"`: `os-release` reads `OS_NAME="RASTERATOPS"`, the images are `RASTERATOPS-<board>.<arch>-0.0.1.*`, the info page reads `OPERATING SYSTEM: RASTERATOPS` (a 640x480 frame from guest d; `/etc/os-release` from the image's SYSTEM); repositories, packages and hosts stay lowercase `rasteratops`; the cloud folder is `/Rasteratops` (D-CLOUD-158).
- AC-337-07: The migration tar carries the suffix `-from-ROCKNIX` (`IMAGE_SUFFIX`), so its name passes the RC2 init's check (`init:882`): the built name is `RASTERATOPS-H700.aarch64-0.0.1-from-ROCKNIX.tar` and `tools/vm-upgrade-rehearsal` from RC2's image applies it; the suffix is dropped in the build after 0.0.1 (D-WORKFLOW-128).
- AC-337-08: The splash and the theme's logo carry the word mark alone until the icon arrives (D-WORKFLOW-130): the splash frame at boot and the theme's logo frame on guest d show the name in the chosen face and no pictorial mark.
- AC-337-09: The release notes and the site's ssh page say the ssh password is unchanged in 0.0.1 (D-WORKFLOW-129, #358): the notes file's line and the docs PR.
- AC-354-01: The mixed-installation test (`tools/cloud-pair-migration` on `tools/vm-pair`): guest a updated in place from RC2's image with a `/ROCKNIX` cloud, guest b a fresh install on the same QA cloud; at the end both confs read `/Rasteratops/{Saves,Backups,Content}`, a save written on each arrives on the other, nothing was removed from `/ROCKNIX` before its verified copy, a guest that missed its step and wrote into the earlier folder is merged by MOVE (D-CLOUD-168), and the log names each step: its PASS lines, and its negative control on a build without the join (D-CLOUD-169) failing.
- AC-354-02: The rehearsal (`tools/vm-upgrade-rehearsal`) from RC2's x64 image keeps every piece of state across the update (its PASS), and a stock-shaped conf carried across (`/GAMES`, nothing in the cloud) meets the cloud folder step at the boot after rather than a dialog from the startup sync: the startup stamp's `78 no-folder` and the step's CREATE IT offer in 640x480 frames (guest d's epic proof, case E; D-CLOUD-166, D-CLOUD-170).
- AC-354-03: `tools/vm-qa` on the candidate passes every suite, `frame-diff` against the accepted baseline explains every changed frame by one of the children, `tools/vocabulary-check` and `tools/es-menu-map-check` pass.
- AC-354-04: Every string the five children add is approved by the maintainer before the build and lands with its French (D-UI-051); `docs/cloud-sync-changelog.md` carries the changes the day they land (`change-log.md`); the site's cloud-sync page names `/Rasteratops` (`documentation-accuracy.md`, with #42).
- AC-349-01: On the transfer page, the SETTINGS restore row's line under the label names the device the archive to be restored came from, read from the label in its file name (`backuptool` prints it; the interface reads it): a 640x480 frame from a `tools/vm-walks` walk shows `FROM <device label>, <date>`.
- AC-349-02: `docs/es-menu-map.md` carries the SETTINGS row's two states, offered with the device and date or dimmed with `NO SETTINGS BACKUP FROM THIS DEVICE YET` (D-UI-039, D-CLOUD-162), and `tools/es-menu-map-check` passes in `tools/vm-qa`'s `menumap` suite. *(Rewritten 2026-10-01: the choice page it named is superseded.)*
- AC-349-03: The public page for cloud sync says the SETTINGS row restores this device's own newest backup and is dimmed when the cloud has none from it (docs follow-up with #42, `documentation-accuracy.md`). *(Rewritten 2026-10-01: a restore from another device is not offered.)*
- AC-349-04: After the scan page (#350), the SETTINGS restore row is offered only when the cloud's Backups folder holds an archive whose label equals this device's `cloud_device_id --label`; with the QA cloud seeded with a foreign label only, guest d's 640x480 frame shows the row dimmed with its reason, and with its own label seeded the row is offered with `FROM <label>, <date>` under it.
- AC-349-05: A restore never takes another device's archive by default: `backuptool` restores the newest archive of this device's label, and its journal line names the label it chose; the foreign-label case on guest d leaves `system.hostname` unchanged.
- AC-349-06: The scan page's line reads, while it runs, the words approved for #350 (proposed: `CHECKING WHAT SETTINGS AND CONTENT YOUR CLOUD HAS FOR THIS DEVICE...`), and the outcome vocabulary when it ends (`es-player-text.md`); frames from the walk show both.
- AC-350-01: Pressing CONTINUE on RESTORE FROM CLOUD opens a page of its own, titled for the comparison, with the live line and CANCEL as the one way out while it runs (D-UI-078); the options page follows when the listing is in. A `tools/vm-walks` frame sequence shows dialog, page, options, and no frame with a card drawn over a dialog.
- AC-350-02: When the comparison fails (the cloud unreachable: the dead port of `tools/cloud-test-backend`), the page says why in the outcome vocabulary (`COULDN'T FINISH - …`, `es-player-text.md`) and offers TRY AGAIN beside CLOSE; a frame shows it.
- AC-350-03: `docs/es-menu-map.md` carries the page (D-UI-039); `tools/es-menu-map-check` passes.
- AC-350-04: The interface edit passes `tools/es-syntax-check` before the pin moves, and `docs/cloud-sync-changelog.md` carries the change the day it lands.
- AC-350-05: The scan page runs `cloud_setup --content-location`, the settings-archive listing by label and `cloud_content_restore --scan` before the options page opens; the options page on guest d lists only rows the scan found (a frame per seeded case: settings for this label, settings for a foreign label only, content under `/ROCKNIX/Content`, content nowhere).
- AC-350-06: Its live line says what it is checking in the words approved for it (proposed: `CHECKING WHAT SETTINGS AND CONTENT YOUR CLOUD HAS FOR THIS DEVICE...`); the string and its French land in the same commit (D-UI-051).
- AC-351-01: 1: the Close control sits at the bottom of the page, below the note, with at least 2rem of space above it, and a tap asks a confirmation (the safe answer first) before Escape is sent; a 390 px headless-Firefox render shows the placement, and the page's load test (the harness from #330) passes.
- AC-351-02: 2: the state line has at least `.75rem` above and below it in both states (`Checking…`, `Connected.`); the two 390 px renders show it.
- AC-351-03: 3: every image ships `/etc/machine-info` with `CHASSIS=handset` (D-NET-016; `feature/cloud-epic` 98e1a30362) and the sign-in window sends WebKit's Mobile user agent: on guest d a page that echoes `navigator.userAgent` through the window reads `... Mobile Safari/605.1.15`, and frames of Dropbox's sign-in and trust pages from the window before and after show the touch layout; re-read on the next staging as a frame from the window at the panel's size.
- AC-351-04: 4: the finishing page carries the shared `STYLE` (the card, the `h1`, the note), reads as a success, and says what happens next; a frame from guest d's window shows it.
- AC-351-05: Every string added has its French in the same commit where it is an interface string (D-UI-051), and `tools/vocabulary-check` passes on the scripts.
- AC-352-01: `cloud_content_restore --scan` lists a pre-tier folder only when this device has a folder of that name under `/storage/roms` or the name is a supported system (`legacy_dirs` / `supported_systems`), the same rule `resolve_src` applies; a `tools/cloud-round-trip` case seeds `Photos/` and `Documents/` at the root and the scan's output carries neither line.
- AC-352-02: When the content root holds no `ROMs/` and no known system folder, the page says so instead of listing: `YOUR CLOUD HAS NO ROMS OR BIOS FOLDER AT <folder>. CHOOSE THE FOLDER WHERE YOUR CONTENT IS.` (words to the maintainer for approval, `player-language.md`), with a row that opens the folder chooser; a 640x480 frame shows it.
- AC-352-03: A CHOOSE CLOUD FOLDER page (the `GuiFileBrowser` pattern fed by `rclone lsf`, `es-native-ui.md` § Reusable precedents) sets `CONTENT_REMOTE` through `cloud_setup`, and the transfer page re-reads it; the walk's frames show the chosen folder and the journal shows the `Content path` line.
- AC-352-04: With `CONTENT_REMOTE` back at `/ROCKNIX/Content` and the QA cloud seeded with `Photos/` and `Documents/` at its root, CONTENT TO RESTORE on guest d lists only ROM systems and BIOS: the walk's 640x480 frame and the scan's output lines. (The Nova's own listing is re-read on its next staging, as a read, and noted here in a comment.)
- AC-352-05: `docs/es-menu-map.md` carries the chooser (D-UI-039); `tools/es-menu-map-check` and `tools/vocabulary-check` pass; the cloud-sync page on the site says where the content folder is chosen (`documentation-accuracy.md`).
- AC-352-06: When the configured content root holds no `ROMs/` and no known system folder, the scan looks under the cloud root's `/ROCKNIX/Content` (the saves root's parent, `cloud_setup:629-631`) and, finding `ROMs/` or `BIOS/` there, offers that folder first (`YOUR CONTENT IS IN /ROCKNIX/Content. USE IT?` -- words for approval) and writes `CONTENT_REMOTE` on yes; on guest d with `CONTENT_REMOTE=""` and content seeded under `/ROCKNIX/Content`, the frame shows the offer and the journal shows the `Content path` line after it.
- AC-352-07: Only then, with nothing found under either, the chooser opens; a frame shows it with the QA cloud's root folders listed as folders to pick from, never as systems.
- AC-353-01: A carried upstream `/GAMES` (a value no player typed) counts as no folder (D-CLOUD-161). At the end of cloud setup the seeding points it at `/Rasteratops` and makes the three folders without asking (D-CLOUD-169: `tools/last-good-scripts-test`'s `--settle` lines); at boot the cloud folder step offers CREATE IT / CHOOSE A FOLDER / NOT NOW (D-CLOUD-170: guest d's epic proof, case E's frame), and so does a transfer page's scan, where CREATE IT writes the three `/Rasteratops` paths (case B: the conf's three lines and `tools/cloud-test-backend ls`); with a `/GAMES` that holds files the dialog is the move naming `/GAMES` (case B0's frame).
- AC-353-02: An earlier `/ROCKNIX` folder gets one dialog, MOVE first (D-CLOUD-160): MOVE copies, verifies and deletes (the move page's frames on guest d; `tools/cloud-test-backend ls` shows `/Rasteratops` whole and no `/ROCKNIX`; a kill during the copy leaves `/ROCKNIX` intact and a second MOVE completes it); another device on `/ROCKNIX` is re-pointed at its next cloud folder step or transfer-page scan with no dialog (`tools/cloud-pair-migration` step 5's journal line, D-CLOUD-170), one that wrote there first is merged by its MOVE (step 5m, D-CLOUD-168); KEEP USING leaves a device on `/ROCKNIX` for good; NOT NOW asks again at the next boot and the next transfer page.
- AC-353-03: The folder is settled by the cloud folder step, at the end of cloud setup and at boot (D-CLOUD-170, #363), never by a sync: with the folder absent the startup and exit syncs end in the card's `SKIPPED - YOUR CLOUD FOLDER ISN'T SET UP YET` pointing at MANAGE CLOUD STORAGE (the startup stamp's `78 no-folder`, D-CLOUD-166), and 640x480 frames show the step at the end of setup (guest d's epic proof, case L) and at boot (cases E and I).
- AC-353-04: The offer carries a third choice to pick a different folder (the folder chooser of #352), and its text has no icon or glyph drawn between its two sentences: a 640x480 frame from guest d and, when it is next staged, one from the device.
- AC-353-05: The words the offer uses are approved by the maintainer before the build (`player-language.md`): proposed `YOUR CLOUD HAS NO /ROCKNIX/Saves FOLDER YET.` / `CREATE IT`, `CHOOSE A FOLDER`, `NOT NOW`; their French lands in the same commit (D-UI-051).
- AC-353-06: The default folder's name (`/ROCKNIX` today, D-WORKFLOW-101; `/Rasteratops` proposed) is a register row on the maintainer's word, with D-WORKFLOW-101's mixed-installation test run before any default changes.
- AC-353-07: The move carries `Saves-replaced` (the set-aside of conflict losers beside the saves folder) to `/Rasteratops/Saves-replaced` by the same copy, verify, delete, and nothing of ours remains under the old name afterwards: a `tools/last-good-scripts-test` case seeds a set-aside copy under the old layout and reads it back under the new one with the old folder gone; the round trip on the VM shows the sync's next set-aside landing under `/Rasteratops`.
- AC-356-01: `cloud_migrate_layout` runs numbered steps from the marker's version to the build's, each with the move dialog, each copy-verify-delete, each a journal line naming the step; a `tools/cloud-round-trip` case seeds layout 1 and ends at layout 2 with the marker written and nothing lost (hash list before and after).
- AC-356-02: A second guest on the same cloud takes the new marker at its next check with no dialog (its journal line), and a guest on an older build with a newer marker reads its saves and shows the card's outcome words rather than writing the old layout (a frame).
- AC-356-03: The step for `/GAMES` and `/ROCKNIX` is step 1 and is the one #353 ships; the design note lives in `docs/rasteratops/cloud-layout.md`.
- AC-363-01: (Ticked on run 100; re-opened 2026-10-02: on run 101 `cloud_backup` lines 832-833 call `cloud_migrate_layout --superseded`, and D-CLOUD-172's listing of the saves folder runs before a backup on an earlier default -- #365's table decides it.) No sync checks the cloud folder: `cloud_backup` and `cloud_restore` carry no call to `cloud_migrate_layout` (`tools/last-good-scripts-test`, its two "runs no folder check before its sync" lines).
- AC-363-02: (Ticked on run 100 at 16 ms; re-opened 2026-10-02: run 101 reads 325 against 266 ms, 59 ms apart, D-CLOUD-172's listing -- #364, #365.) An exit sync for a guest whose conf still names `/ROCKNIX` costs what one on the current folder costs (the follow benchmark on guest d, five of each, medians within 30 ms).
- AC-363-03: `cloud_migrate_layout --needs-step` answers with no network: 0 for an earlier default, not kept, with a remote set up; 1 for the current folder, a folder of the player's own, a kept one, or no remote; 2 for a conf it cannot read; rclone never starts (`tools/last-good-scripts-test` section aa, its `--needs-step` lines).
- AC-363-04: `cloud_scan --folder` is the folder item alone -- the join, the state, the quiet follow -- with no archive or root listing, the opening scan's files left as they were, and a refused join ending with its why and no state (section ab, its `--folder` lines).
- AC-363-05: The transfer pages' scan still checks on every open (`tools/last-good-scripts-test` section ab).
- AC-363-06: At the end of cloud setup, for a fresh install whose cloud holds its saves under an earlier folder, the step reads the move before the seeding (`tools/cloud-pair-migration` step 2's lines), and the frames show CHECKING YOUR CLOUD, the MOVE question, then CLOUD SETUP COMPLETE after the answer (`tools/vm-visual-qa` frames at 640x480).
- AC-363-07: At boot, for a guest whose conf names an earlier folder it has not kept, with a remote set up, the step comes up after the startup sync's card: CHECKING YOUR CLOUD, then the question; NOT NOW brings it back at the next boot; after MOVE the next boot raises nothing and the journal reads `nothing to settle` (frames at 640x480 and the journal, guest d).
- AC-363-08: Offline at boot (the guest's link cut on the QEMU monitor), the step asks `FINISH CLOUD SETUP` / `YOU'RE NOT ONLINE. CONNECT TO FINISH SETTING UP YOUR CLOUD FOLDER.` with CONNECT TO WI-FI and NOT NOW (a frame at 640x480).
- AC-363-09: With a settings restore's marker and an earlier folder both set at boot (written on guest d, a named stand-in for a restore followed by an update), FINISH RESTORE PROCESS comes first with nothing over it; its FINISH brings the step once the screen is free; its LATER brings neither until the next boot (frames at 640x480).
- AC-363-10: `tools/cloud-pair-migration` covers both later cases: the other guest's step follows after the move (step 5), and a guest that missed its step and backed up into the earlier folder has those saves merged by MOVE with nothing left behind (step 5m) -- its PASS lines.
- AC-364-01: A backup on a carried `/GAMES` the cloud does not hold makes no `/GAMES`, sends nothing, prints `>>> offer create-saves-folder|/GAMES` and ends 0, on a deliberate run and on the exit sync's `--automatic --recent` run. A `/GAMES` the cloud holds is backed up as before, and an absent current folder is still made (`tools/last-good-scripts-test` section ad, its four PASS lines; against the previous commit the first two FAIL).
- AC-364-02: At a boot on a stock-shaped conf with nothing in the cloud, the startup card reads SKIPPED with `78 no-folder`, the QA cloud holds no `/GAMES` afterwards, and the cloud folder step offers CREATE IT (guest d's epic proof, case E: its PASS lines and `tools/cloud-test-backend ls`).
- AC-364-03: The cost the listing adds to an exit sync on an earlier folder (59 ms on run 101's follow benchmark, against 16 ms on run 100) is kept with its reason or removed, decided against #365's folder table (D-WORKFLOW-134).
- AC-365-01: `docs/` carries the cloud folder's state table: each combination of conf state and cloud state, with what each actor does and the code line that does it. A walk of the table against the scripts lists no cell where two actors disagree, or names each disagreement as a decision.
- AC-365-02: `tools/last-good-scripts-test` has one case per table cell and passes. The previous commit fails the cases for the cells this work changed.
- AC-365-03: The guest-d proof runs from `tools/` with a per-case state reset. Its exit code is non-zero when any check fails, seen once on a constructed failure.
- AC-365-04: The retro file over runs 95 to 101 names each pattern with its guard, in `tools/`, `.githooks/` or `.claude/rules/`, as `ceremonies.md` asks of a blindspot.
- AC-366-01: The stale-name check reads the list from `cloud_migrate_layout --superseded` and matches each entry as a whole path component; run against today's `tools/cloud-test-backend` (the bare `/GAMES` at line 806) it FAILs, and that failing run is recorded in the day's work log with its command (`engineering-practices.md` § Guards must fail closed).
- AC-366-02: `tools/cloud-test-backend saves-remote` names, on every backend `tools/cloud-test-backend backends` lists, a folder that `cloud_migrate_layout --superseded` does not list: a check in `tools/last-good-scripts-test` that loops over the backends and PASSes.
- AC-366-03: `tools/vm-qa`'s round-trip suite reads PASS in `report.md` on the first image built after the fix, and its `round-trip.log` names the new folder on the `SAVES_REMOTE` line.
- AC-366-04: The S3 backend still gets a legal bucket name: `tools/cloud-round-trip --backend s3` against a QA guest logs `only 9/9` or no shortfall line for its saves upload.
- AC-361-01: A register row names the disposition (the pin accepted for 0.0.1, or the refresh), and `tools/fork-package-freshness` exits 0 on the candidate's tree with the recipe's stated reason, cited in the cut's RECORD.txt.
- AC-361-02: On a refresh: every patch applies or is dropped with its reason in the recipe's comment; `last-good-scripts-test`'s proxy sections and `tools/ra-offline-test` on guest d pass on the built image; the whole-library scan's behaviour (D-RA-012) is stated against the budget.
- AC-362-01: A register row accepts the 3.6 series for 0.0.1 (or the bump is taken), and `tools/fork-package-freshness` exits 0 on the candidate's tree with the recipe's reason, cited in the cut's RECORD.txt.
- AC-362-02: When bumped: WebKitGTK rebuilt against 3.8, the sign-in window's frames on guest d (a Dropbox sign-in page in the touch layout, the finishing page) and `tools/signin-memory`'s peak within its bound, before any device.
- AC-353-C01: The sweep of the old words: `tools/archaeology --reversal /ROCKNIX/Saves` lists every rule, register row and document naming `/ROCKNIX` as the cloud root; each is reworded to `/Rasteratops` or marked as history in the same change as the code, and the command then prints only history (`decision-register.md` § A reversal sweeps its old words).
- AC-353-C02: `cloud_migrate_layout --state` looks for every superseded default's folder in the cloud, not only the configured one: a device configured for `/GAMES` whose cloud holds `/ROCKNIX/Saves` with files reads `STATE=superseded-with-files` with `SOURCE=/ROCKNIX/Saves`, and the move dialog, not the creation, is offered (the Nova's real case: its conf names `/GAMES`, its saves sit in `/ROCKNIX/Saves`); a sandbox check in `tools/last-good-scripts-test` section aa fails against the verb as first written.
- AC-353-C03: `--follow` refuses to re-point a device whose old folder still holds files the new folder lacks: it reads `superseded-with-files` and the move is offered instead; the `tools/cloud-round-trip` move case seeds a save into the old folder after the move and shows the second device offered, not followed, with the save intact.
- AC-353-C04: `Saves-replaced` (the set-aside of conflict losers beside the saves folder) moves with the saves, or the notes say it stays under the old name -- the maintainer's call, asked in the futro's report.
# Primary source packet

Distribution scripts at next c9625abf, same product bytes as image b2378d9c33; ES e108699ea. Numbered excerpts are exact lines. No provider credentials or live personal config are included.

## projects/ROCKNIX/packages/network/rclone/sources/cloud_scan
```
1: #!/bin/bash
2: # SPDX-License-Identifier: GPL-2.0
3: # Copyright (C) 2026-present rasteratops (https://github.com/rasteratops)
4:
5: # cloud_scan - what the cloud holds for this device, before anything is offered.
6: #
7: # The transfer pages scan first and offer only what the scan found
8: # (D-CLOUD-156, fork #350): the folder's state, the settings archives by
9: # device label, where the content is, and -- once the player has ticked
10: # what to move -- the content listing in those classes. This runs those
11: # reads and talks to the scan page in the protocol every cloud page reads
12: # (">>> unit", ">>> doing", ">>> why"), writing each result to a file the
13: # options page builds from.
14: #
15: #   cloud_scan                   the opening scan: the folder, the settings
16: #                                archives, where the content is (three items)
17: #   cloud_scan --content [--with-media|--media-only]
18: #                                the content listing for the systems page,
19: #                                in the classes ticked (one item)
20: #   cloud_scan --folder          the folder alone, for the cloud folder step
21: #                                at the end of cloud setup and at boot
22: #                                (D-CLOUD-170, fork #363; one item)
23: #
24: # Reads, with two exceptions, both settings: a fresh install beside a fleet
25: # still on an earlier folder joins it (cloud_migrate_layout --join), and a
26: # device on a superseded folder whose current folder another device has
27: # already made is re-pointed to it (cloud_migrate_layout --follow;
28: # D-CLOUD-160's "your other devices will follow"). Nothing in the cloud
29: # changes, so no lock is taken and a sync may run beside it.
30: #
31: # Results, under /storage/.cache/cloud_sync/scan/:
32: #   state             cloud_migrate_layout --state, one fact per line
33: #   archives          every settings archive in the Backups folder, one per line
34: #   settings          LABEL= (this device's), MINE= (its newest), NEWEST= (overall), COUNT=
35: #   content-location  cloud_setup --content-location, key=value
36: #   root-dirs         the folders at the cloud's root, one per line (the chooser's)
37: #   done              the epoch the opening scan completed; absent while it runs or failed
38: #   scan              cloud_content_restore --scan's rows        (--content)
39: #   systems           the systems this device syncs (--systems)  (--content)
40: #   content-done      the epoch the content scan completed       (--content)
41: #
42: # Exit: 0 all read; 69 no network (the page says SKIPPED - YOU'RE NOT
43: # ONLINE); 1 no cloud storage set up; otherwise the failing read's code,
44: # with a ">>> why" in the player's words before it (D-UI-028).
45:
46: . /etc/profile 2>/dev/null
47:
48: OUT=/storage/.cache/cloud_sync/scan
49: SYNC_CONF=/storage/.config/cloud_sync.conf
50: readonly EXIT_NO_NETWORK=69
51: # Every listing here is bounded as the other readers' are (#308 claude F-RS-13).
52: readonly -a RCLONE_LIST_OPTS=(--contimeout 15s --timeout 30s --low-level-retries 3 --retries 1)
53:
54: say() { echo "$@"; }
55: log() { logger -t cloud_scan "$*" 2>/dev/null; }
56: why() { echo ">>> why $*"; }
57:
58: # The shared reader (cloud_setup's, the content scripts', D-CLOUD-149): a
59: # value in a form the sync does not read is nothing here, never a folder.
60: conf_get() { # <KEY>
61:     [ -f "${SYNC_CONF}" ] || return 0
62:     awk -v k="$1" '
63:         index($0, k "=") == 1 {
64:             s = substr($0, length(k) + 2); v = ""
65:             if (s ~ /^"/) { s = substr(s, 2); i = index(s, "\""); if (i == 0) exit 2; v = substr(s, 1, i - 1) }
66:             else if (s ~ /^\047/) { s = substr(s, 2); i = index(s, "\047"); if (i == 0) exit 2; v = substr(s, 1, i - 1) }
67:             else { i = index(s, "#"); v = (i == 0) ? s : substr(s, 1, i - 1); sub(/[ \t]+$/, "", v) }
68:             if (v ~ /[$`\\]/) exit 2
69:             print v; exit 0
70:         }
71:     ' "${SYNC_CONF}"
72: }
73:
74: sibling() { # <name>: the script beside this one, else the installed one
75:     local t; t="$(dirname "$(readlink -f "$0")")/$1"
76:     [ -x "${t}" ] || t="/usr/bin/$1"
77:     echo "${t}"
78: }
79: device_label() {
80:     local tool; tool=$(sibling cloud_device_id)
81:     [ -x "${tool}" ] && "${tool}" --label 2>/dev/null | tr -cd 'A-Za-z0-9_-'
82: }
83: os_name() {
84:     local name="${OS_NAME}"
85:     [ -z "${name}" ] && name=$(sed -n 's/^OS_NAME="\{0,1\}\([^"]*\)"\{0,1\}$/\1/p' /etc/os-release 2>/dev/null | head -1)
86:     [ -z "${name}" ] && name="ROCKNIX"
87:     printf '%s\n' "${name}" | tr -cd 'A-Za-z0-9_-'
88: }
89:
90: # What an rclone exit means to a player: the sentences the card and the
91: # rows already carry for these codes (ThreadedCloudSync::whyForCode), so
92: # one code is never called two things and the French reaches them.
93: why_for_rc() {
94:     case "$1" in
95:         3|4) why "COULDN'T FIND YOUR CLOUD FOLDER" ;;
96:         5|124) why "YOUR CLOUD STOPPED ANSWERING" ;;   # 124: a bounded step's timeout (the join)
97:         7|8) why "YOUR CLOUD WOULDN'T TAKE THE FILES" ;;
98:         *)   why "SOMETHING WENT WRONG" ;;
99:     esac
100: }
101:
102: # Before any read: a place to write, a route, a remote.
103: prepare() {
104:     mkdir -p "${OUT}" || { log "scan: cannot make ${OUT}"; why "SOMETHING WENT WRONG"; exit 1; }
105:     # No route, nothing tried: the page says SKIPPED - YOU'RE NOT ONLINE from
106:     # the code alone (D-CLOUD-072, D-CLOUD-112).
107:     if ! ip route show default 2>/dev/null | grep -q .; then
108:         log "scan: no default route; skipped"
109:         exit "${EXIT_NO_NETWORK}"
110:     fi
111:     REMOTE=$(rclone listremotes 2>/dev/null | head -1)
112:     if [ -z "${REMOTE}" ]; then
113:         why "YOUR CLOUD STORAGE ISN'T SET UP YET"
114:         exit 1
115:     fi
116: }
117:
118: # A read that failed ends the run with its why; 69 is the page's own sentinel.
119: stop_on() { # <rc> <what>
120:     [ "$1" -eq 0 ] && return 0
121:     log "scan: $2 exited $1"
122:     [ "$1" -eq "${EXIT_NO_NETWORK}" ] && exit "$1"
123:     why_for_rc "$1"
124:     exit "$1"
125: }
126:
127: # --content: the listing the systems page is built from, in the classes
128: # the player ticked (cloud_content_restore --scan's own flags), and the
129: # systems this device syncs. One item; the page's row 3 says it is
130: # comparing.
131: scan_content() {
132:     local label="ROMS AND BIOS" rc
133:     case " $* " in
134:         *" --with-media "*) label="ROMS, BIOS, AND GAME CONTENT" ;;
135:         *" --media-only "*) label="GAME CONTENT" ;;
136:     esac
137:     rm -f "${OUT}"/scan "${OUT}"/scan.err "${OUT}"/systems "${OUT}"/content-done
138:     prepare
139:     echo ">>> unit ${label}||"
140:     echo ">>> doing compare"
141:     "$(sibling cloud_content_restore)" --scan "$@" > "${OUT}/scan" 2> "${OUT}/scan.err"; rc=$?
142:     [ "${rc}" -eq 0 ] || log "scan: --scan $* exited ${rc}: $(head -1 "${OUT}/scan.err" 2>/dev/null)"
143:     stop_on "${rc}" "--scan"
144:     "$(sibling cloud_content_restore)" --systems > "${OUT}/systems" 2>/dev/null || : > "${OUT}/systems"
145:     date +%s > "${OUT}/content-done"
146:     log "scan: content done ($(grep -c . "${OUT}/scan") rows, ${label})"
147:     exit 0
148: }
149:
150: # 1. The folder: current, kept, superseded or the player's own; the current
151: #    folder's presence; the marker (cloud_migrate_layout --state, fork #353).
152: #    The opening scan's first item, and the whole of --folder.
153: read_folder() {
154:     local layout rc
155:     echo ">>> unit CLOUD FOLDER||"
156:     echo ">>> doing scan"
157:     layout=$(sibling cloud_migrate_layout)
158:     # A fresh install beside a fleet still on the earlier folder joins it first
159:     # (cloud_migrate_layout --join, a setting): the state below then reads the
160:     # folder the player's saves are in, and the move is offered from there
161:     # rather than CREATE IT beside them. 3 is "nothing to join"; anything else
162:     # that is not 0 is the cloud not answering, and stops the scan with its why.
163:     timeout 20 "${layout}" --join >/dev/null 2>&1; rc=$?
164:     case "${rc}" in
165:         0) log "scan: joined the fleet's earlier folder" ;;
166:         3) ;;
167:         *) stop_on "${rc}" "--join" ;;
168:     esac
169:     "${layout}" --state > "${OUT}/state" 2>/dev/null; stop_on $? "--state"
170:     # A device left on a superseded folder with nothing in it, whose current
171:     # folder another device has already made, follows the fleet here -- the
172:     # one place it does since no sync asks any more (D-CLOUD-170): the dialogs
173:     # then never ask about a folder the player has already answered for
174:     # elsewhere.
175:     if [ "$(sed -n 's/^STATE=//p' "${OUT}/state")" = superseded-empty ] \
176:        && [ "$(sed -n 's/^CURRENT_EXISTS=//p' "${OUT}/state")" = 1 ]; then
177:         if timeout 20 "${layout}" --follow >/dev/null 2>&1; then
178:             log "scan: followed the fleet to the current layout"
179:             "${layout}" --state > "${OUT}/state" 2>/dev/null; stop_on $? "--state"
180:         fi
181:     fi
182: }
183:
184: case "$1" in
185:     --content) shift; scan_content "$@" ;;
186:     --folder)
187:         # The step reads state alone; the opening scan's other files are
188:         # left as they were, and are rewritten by the next opening scan.
189:         rm -f "${OUT}"/state
190:         prepare
191:         read_folder
192:         log "scan: folder done ($(sed -n 's/^STATE=//p' "${OUT}/state"))"
193:         exit 0 ;;
194:     "") ;;
195:     *) echo "usage: cloud_scan [--content [--with-media|--media-only] | --folder]" >&2; exit 2 ;;
196: esac
197:
198: rm -f "${OUT}"/state "${OUT}"/archives "${OUT}"/settings "${OUT}"/content-location "${OUT}"/root-dirs "${OUT}"/done
199: prepare
200: date +%s > "${OUT}/started"
201: read_folder
202:
203: # 2. The settings archives, by the device that wrote each (the label in the
204: #    name, cloud_restore's rule): this device's newest first, else the newest
205: #    overall, else none -- the row is offered or dimmed from this (D-CLOUD-162).
206: echo ">>> unit SETTINGS BACKUPS||"
207: echo ">>> doing scan"
208: settings_remote=$(conf_get SETTINGS_REMOTE) || { why "YOUR CLOUD SYNC SETTINGS COULDN'T BE READ"; exit 1; }
209: settings_remote="${settings_remote%/}"
210: listing=$(rclone lsf --files-only --include "*.{zip,tar.gz}" "${REMOTE}${settings_remote:+${settings_remote#/}}/" "${RCLONE_LIST_OPTS[@]}" 2>/dev/null); rc=$?
211: case "${rc}" in
212:     0) ;;
213:     3|4) listing="" ;;   # no Backups folder yet: nothing to restore, not a failure
214:     *) stop_on "${rc}" "archives listing" ;;
215: esac
216: printf '%s\n' "${listing}" | sed '/^$/d' > "${OUT}/archives"
217: label=$(device_label); osn=$(os_name); mine=""; newest=""
218: if [ -n "${label}" ]; then
219:     mine=$(grep -E "^[0-9]{4}_[0-9]{2}_[0-9]{2}-[0-9]{6}-${label}-${osn}_SETTINGS\.tar\.gz$" "${OUT}/archives" | sort | tail -1)
220: fi
221: newest=$(grep -E '^[0-9]{4}_[0-9]{2}_[0-9]{2}-[0-9]{6}-' "${OUT}/archives" | sort | tail -1)
222: {
223:     echo "LABEL=${label}"
224:     echo "MINE=${mine}"
225:     echo "NEWEST=${newest}"
226:     echo "COUNT=$(grep -c . "${OUT}/archives")"
227: } > "${OUT}/settings"
228:
229: # 3. Where the content is: the configured root, the cloud root's
230: #    /Rasteratops/Content, or nowhere yet (cloud_setup --content-location,
231: #    fork #352) -- and the folders at the cloud's root, for the chooser the
232: #    page offers when nothing of ours is found. The listing itself waits for
233: #    --content, once the player has said which classes to compare.
234: echo ">>> unit GAME CONTENT||"
235: echo ">>> doing scan"
236: "$(sibling cloud_setup)" --content-location > "${OUT}/content-location" 2>/dev/null; rc=$?
237: [ "${rc}" -eq 0 ] || log "scan: --content-location exited ${rc} (reported, not fatal)"
238: rclone lsf --dirs-only "${REMOTE}" "${RCLONE_LIST_OPTS[@]}" 2>/dev/null | sed 's:/$::; /^$/d' > "${OUT}/root-dirs"; rc=${PIPESTATUS[0]}
239: stop_on "${rc}" "root listing"
240:
241: date +%s > "${OUT}/done"
242: log "scan: done ($(grep -c . "${OUT}/archives") archives, $(sed -n 's/^STATE=//p' "${OUT}/state"), content $(sed -n 's/^STATE=//p' "${OUT}/content-location"))"
243: exit 0
```

## projects/ROCKNIX/packages/network/rclone/sources/cloud_migrate_layout
```
55:
56: SYNC_CONF="/storage/.config/cloud_sync.conf"
57: NEW_SAVES="/Rasteratops/Saves"
58: NEW_BACKUPS="/Rasteratops/Backups"
59: NEW_CONTENT="/Rasteratops/Content"
60: NEW_ROOT="${NEW_SAVES%/*}"   # the folder the tiers move into; named by the plan line below
61: # Every saves folder this project ever shipped as its default. A device whose
62: # saves folder is one of these is on a layout it never chose, so the move is
63: # offered (D-CLOUD-160); any other folder is the player's own and stays
64: # (the sibling-layout branch below). Oldest first; the current default is
65: # NEW_SAVES and is not listed.
66: SUPERSEDED_DEFAULT_SAVES=("/GAMES" "/ROCKNIX/Saves")
67: # The marker a cloud carries once it is on the current layout (#356): one
68: # line, layout=<n>, at the parent of the saves folder. Read before anything
69: # is offered; written after a move or a seeding.
70: LAYOUT_VERSION=2
71: LAYOUT_MARKER=".layout"
72:
73: # Which superseded default's saves folder holds files in this cloud, the
74: # configured one first, then the others newest first: into SOURCE_FOUND,
75: # empty when none does. Called directly, never inside $(...): its listings
76: # stop the run when the cloud cannot be read (list_or_stop), and inside a
77: # substitution that stop ended only the subshell -- a listing that failed
78: # read as "no folder holds the saves", a provider error taken for absence,
79: # and --state then said superseded-empty and the interface offered CREATE
80: # IT (found 2026-10-01 reading for the mixed-installation test).
81: SOURCE_FOUND=""
82: superseded_source() { # <remote> <configured saves folder>
83:     local remote="$1" saves="$2"
84:     SOURCE_FOUND=""
85:     if has_files "${remote}${saves}/"; then SOURCE_FOUND="${saves}"; return 0; fi
86:     earlier_source "${remote}" "${saves}"
87: }
88:
89: # The newest superseded default, other than <except>, whose saves folder
90: # holds files: into SOURCE_FOUND. Newest first, because where both an
91: # upstream /GAMES and the fork's /ROCKNIX/Saves hold saves, the fork's is
92: # the one its other devices write.
93: earlier_source() { # <remote> [except]
94:     local remote="$1" except="${2:-}" i s
95:     SOURCE_FOUND=""
96:     for (( i = ${#SUPERSEDED_DEFAULT_SAVES[@]} - 1; i >= 0; i-- )); do
97:         s="${SUPERSEDED_DEFAULT_SAVES[i]}"
98:         [ -n "${except}" ] && same_folder "${s}" "${except}" && continue
99:         if has_files "${remote}${s}/"; then SOURCE_FOUND="${s}"; return 0; fi
100:     done
101:     return 1
102: }
103:
104: # The pointers of the layout an earlier saves folder belongs to, into
105: # E_SAVES E_BACKUPS E_CONTENT: its siblings, or the nested /GAMES/backup of
106: # the first layout. Content goes with it only where this device's own was
107: # unset or the current default; a folder the player chose for ROMs stays
108: # theirs.
109: earlier_layout() { # <saves folder> <this device's content pointer>
110:     local src="$1" content="$2" parent
111:     parent="${src%/*}"; [ -n "${parent}" ] || parent="${src}"
112:     E_SAVES="${src}"
113:     if [ "${src}" = "/GAMES" ]; then E_BACKUPS="/GAMES/backup"; else E_BACKUPS="${parent}/Backups"; fi
114:     if [ -z "${content}" ] || same_folder "${content}" "${NEW_CONTENT}"; then
115:         E_CONTENT="${parent}/Content"
116:     else
117:         E_CONTENT="${content}"
118:     fi
119: }
120:
121: superseded_default() { # <saves folder>: 0 when it is a default this project once shipped
122:     local s
123:     for s in "${SUPERSEDED_DEFAULT_SAVES[@]}"; do same_folder "$1" "${s}" && return 0; done
124:     return 1
125: }
```
```
315: absent_not_broken() {
316:     local path="${1%/}" remote rel name parent listing
317:     remote="${path%%:*}:"; rel="${path#*:}"; rel="${rel#/}"
318:     while [ -n "${rel}" ]; do
319:         name="${rel##*/}"; parent="${rel%/*}"
320:         [ "${parent}" = "${rel}" ] && parent=""
321:         if listing=$(rclone lsf --dirs-only "${remote}/${parent:+${parent}/}" "${RCLONE_LIST_OPTS[@]}" 2>/dev/null); then
322:             printf '%s\n' "${listing}" | grep -qFx -- "${name}/" && return 1
323:             return 0
324:         fi
325:         [ -n "${parent}" ] || return 1
326:         rel="${parent}"
327:     done
328:     return 1
329: }
330:
331: # LISTING=what rclone lsf [args] <path> lists; nothing for a folder that is
332: # not there; the run stops for one that cannot be read. Never called inside
333: # $(...), so the stop is the script's.
334: LISTING=""
335: list_or_stop() { # <path> [lsf args...]
336:     local path="$1" rc
337:     shift
338:     LISTING=$(rclone lsf "$@" "${path}" "${RCLONE_LIST_OPTS[@]}" 2>/dev/null); rc=$?
339:     case "${rc}" in
340:         0) return 0 ;;
341:         3|4) LISTING=""; return 0 ;;
342:     esac
343:     if absent_not_broken "${path}"; then
344:         LISTING=""
345:         return 0
346:     fi
347:     unreadable "${path}" "${rc}"
348: }
349:
350: # Does a remote path exist and hold anything?
351: has_entries() {
352:     list_or_stop "$1"
353:     [ -n "${LISTING}" ]
354: }
355:
356: # Does it hold actual files, ignoring the backup folder underneath it?
357: #
358: # Not the same question as "is it empty". The original layout has the backups
359: # nested inside the saves folder, so a saves folder with nothing in it but
360: # that subdirectory still lists an entry -- and reading that as "the saves are
361: # here" would move the backups into the middle of the saves.
362: #
363: # The same exclusions are what the saves relocation carries (audit #307
364: # PL-025): a test that looks past backup/ and Backups/ and a copy that then
365: # moves them is how the original layout's settings archives landed in
366: # Saves/backup/. Anchored at the folder's root, where the nested layout put
367: # them; the caller adds the tiers nested deeper. Every argument is passed
368: # as it is given -- the exclusion used to travel as one unquoted word
369: # (${extra}), which the shell split and glob-expanded against the working
370: # directory (#308 claude F-CS-23).
371: SAVES_EXCLUDES=(--exclude '/backup/**' --exclude '/Backups/**')
372: has_files() { # <path> [more lsf arguments...]
373:     local path="$1"
374:     shift
375:     list_or_stop "${path}" --files-only -R "${SAVES_EXCLUDES[@]}" "$@"
376:     [ -n "${LISTING}" ]
377: }
378:
379: # Does a remote path exist?
380: #
381: # NOT `rclone lsjson --stat`, which is what this used to be. On bucket-based
382: # remotes (S3, B2, Minio) stat synthesises a directory entry for *any* path --
383: # verified against Minio on rclone 1.60 and 1.74, where
384: # "utterly-bogus-never-created" reports success with IsDir true. So it can
385: # never report absence there, and every caller that branched on it took the
386: # "exists" path unconditionally.
387: #
388: # A listing can report absence. Two questions, because a directory can be real
389: # without holding files: does it contain anything, or does its parent list it
390: # (which is what an --s3-directory-markers marker object produces)?
391: exists() {
392:     list_or_stop "$1"
393:     [ -n "${LISTING}" ] && return 0
394:     local parent name
395:     parent="${1%/}"; name="${parent##*/}"; parent="${parent%/*}"
396:     [ -n "${name}" ] || return 1
397:     list_or_stop "${parent}/" --dirs-only
398:     printf '%s\n' "${LISTING}" | grep -qxF -- "${name}/"
399: }
400:
401: # Did a `rclone check` find the two sides the same? Only when it says so
402: # both ways: its exit status is 0, and its count of differences is exactly
403: # zero. The count alone was the test here, as a substring -- and "10
404: # differences found" contains "0 differences found", so a check that found
405: # ten changed files let the pointer move and the old folder go, and a new
406: # folder holding ten other versions of the same names read as a partial
407: # copy to resume into (the audit of the fixes to #307, G-A-01).
408: check_clean() { # <rclone check's exit status> <its output>
```
```
460: # rule -- the newer copy of each file wins -- made non-destructive: every
461: # version that differs between the two folders is set aside first, under
462: # the same <saves>-replaced/<stamp> shelf the backup keeps its conflict
463: # losers on, then the copy runs with --update and the new folder's own
464: # overwritten copies go to that shelf too (--backup-dir), and the old
465: # folder is removed only once every name it held is present in the new
466: # one. Nothing in the new folder is deleted, and nothing is lost: each
467: # byte that was in the cloud is in the new folder or on the shelf.
468: RELOCATE_MERGE=0
469: merge_shelf() { # <dst>: the set-aside beside the destination, one folder per run
470:     echo "${1%/}-replaced/$(date +%Y_%m_%d-%H%M%S)-move"
471: }
472:
473: relocate() { # <src> <dst> <what> <pointer key> [filter arguments...]
474:     local src="$1" dst="$2" what="$3" key="$4" out list
475:     shift 4
476:     local -a filt=("$@")
477:     # One folder under two spellings is not a move (PL-001): copied onto
478:     # itself it checks clean, and the delete after it removes every file
479:     # it listed. Refused here whatever the caller compared.
480:     if same_folder "${src#*:}" "${dst#*:}"; then
481:         say "REFUSING: ${src} and ${dst} are the same folder, so nothing was copied or removed."
482:         logger -t cloud_migrate_layout "relocate: ${src} and ${dst} are one folder; refused" 2>/dev/null
483:         return 1
484:     fi
485:     # A destination inside the source -- a saves folder at /ROCKNIX moving
486:     # to /ROCKNIX/Saves -- is never listed as the source's own: a run cut
487:     # after its copy left part of it there, and the resume moved that copy
488:     # into /ROCKNIX/Saves/Saves (PL-001, found with the spelling cases).
489:     if inside_folder "${dst#*:}" "${src#*:}"; then
490:         filt+=(--exclude "/$(rel_inside "${dst#*:}" "${src#*:}")/**")
491:     fi
492:     list_or_stop "${src}" -R --files-only "${filt[@]}"
493:     if [ -z "${LISTING}" ]; then
494:         [ -z "${key}" ] || set_pointer "${key}" "${dst#*:}" || return 2
495:         return 0
496:     fi
497:     list=$(mktemp /tmp/cloud_migrate_layout.XXXXXX) || { say "Couldn't make a working file on this device; nothing was moved."; return 1; }
498:     printf '%s\n' "${LISTING}" > "${list}"
499:     if [ "${RELOCATE_MERGE}" = 1 ]; then
500:         merge_into "${src}" "${dst}" "${what}" "${key}" "${list}"
501:         return $?
502:     fi
503:     say "Copying ${what}..."
504:     # Under --apply the move runs on a page (GuiCloudTransfer, fork #353):
505:     # ">>> doing" names the step for its row 3, and the copy's own progress
506:     # goes to stdout for the page's counters (COPYING n OF m), as every
507:     # transfer's does; the check and the delete print nothing it reads.
508:     local copy_rc
509:     if [ "${MODE}" = "--apply" ]; then
510:         echo ">>> doing copy"
511:         rclone copy "${src}" "${dst}" --files-from-raw "${list}" --create-empty-src-dirs=false --progress --stats 2s \
512:             "${RCLONE_NET_OPTS_ARRAY[@]}" 2>&1 | tee "${list}.out"; copy_rc=${PIPESTATUS[0]}
513:         out=$(cat "${list}.out" 2>/dev/null); rm -f "${list}.out"
514:     else
515:         out=$(rclone copy "${src}" "${dst}" --files-from-raw "${list}" --create-empty-src-dirs=false "${RCLONE_NET_OPTS_ARRAY[@]}" 2>&1); copy_rc=$?
516:     fi
517:     if [ "${copy_rc}" -ne 0 ]; then
518:         printf '%s\n' "${out}" | tail -3
519:         # A copy that stopped part-way has put some files in the new
520:         # folder; only the old one is as it was (G-A-12).
521:         say "Couldn't finish copying ${what}. Nothing was removed from the old folder; some files may already be in the new one."
522:         rm -f "${list}"
523:         return 1
524:     fi
525:     say "Verifying ${what}..."
526:     [ "${MODE}" = "--apply" ] && echo ">>> doing verify"
527:     out=$(rclone check "${src}" "${dst}" --files-from-raw "${list}" --one-way "${CHECK_OPTS[@]}" "${RCLONE_NET_OPTS_ARRAY[@]}" 2>&1)
528:     if ! check_clean $? "${out}"; then
529:         printf '%s\n' "${out}" | grep -iE "differ|missing|error" | head -3
530:         say "The copy of ${what} didn't match, so nothing was removed from the old folder."
531:         rm -f "${list}"
532:         return 1
533:     fi
534:     # The source goes only once the pointer has landed (G-A-02): a pointer
535:     # that could not be written leaves the device on the old folder, so the
536:     # old folder must still hold everything -- the next run finds the copy
537:     # already there and resumes.
538:     # A folder with no pointer of its own (the set-aside beside the saves,
539:     # named from SAVES_REMOTE by the scripts) has nothing to record here.
540:     if [ -n "${key}" ] && ! set_pointer "${key}" "${dst#*:}"; then
541:         rm -f "${list}"
542:         return 2
543:     fi
544:     say "Removing the old ${what} folder..."
545:     [ "${MODE}" = "--apply" ] && echo ">>> doing remove"
546:     { rclone delete "${src}" --files-from-raw "${list}" "${RCLONE_NET_OPTS_ARRAY[@]}" \
547:         && rclone rmdirs "${src}" "${RCLONE_NET_OPTS_ARRAY[@]}"; } >/dev/null 2>&1 \
548:         || say "(could not remove the old folder; the copy is complete and verified)"
549:     rm -f "${list}"
550:     return 0
551: }
552:
553: # relocate's merge half (RELOCATE_MERGE, above): shelf, copy --update, verify
554: # by presence, remove. <list> is the source's own file listing.
555: merge_into() { # <src> <dst> <what> <pointer key> <list>
556:     local src="$1" dst="$2" what="$3" key="$4" list="$5" shelf differ missing out rc
557:     shelf="${dst%%:*}:$(merge_shelf "${dst#*:}")"
558:     differ=$(mktemp /tmp/cloud_migrate_layout.XXXXXX) || { rm -f "${list}"; return 1; }
559:     missing="${differ}.missing"
560:     say "Merging ${what} into ${dst}: the newer copy of each file is kept, the other set aside under ${shelf#*:}."
561:     # 1. What differs between the two folders is shelved from the source
562:     #    first; the destination's own copies the update replaces follow
563:     #    through --backup-dir. A check that cannot run shelves nothing and
564:     #    stops here (guards fail closed).
565:     rclone check "${src}" "${dst}" --one-way --files-from-raw "${list}" --differ "${differ}" "${CHECK_OPTS[@]}" "${RCLONE_NET_OPTS_ARRAY[@]}" >/dev/null 2>&1; rc=$?
566:     case "${rc}" in 0|1) ;; *)
567:         say "Couldn't compare ${what} with the new folder, so nothing was merged."
568:         rm -f "${list}" "${differ}" "${missing}"; return 1 ;;
569:     esac
570:     if [ -s "${differ}" ]; then
571:         [ "${MODE}" = "--apply" ] && echo ">>> doing copy"
572:         if ! out=$(rclone copy "${src}" "${shelf}" --files-from-raw "${differ}" "${RCLONE_NET_OPTS_ARRAY[@]}" 2>&1); then
573:             printf '%s\n' "${out}" | tail -3
574:             say "Couldn't set aside the ${what} that differ, so nothing was merged."
575:             rm -f "${list}" "${differ}" "${missing}"; return 1
576:         fi
577:         say "$(grep -c . "${differ}") ${what} file(s) differ between the folders; the old folder's copies are on the shelf."
578:     fi
579:     # 2. The copy, newer wins; a file the new folder had a newer copy of is
580:     #    left as it is, and one it replaces goes to the shelf.
581:     say "Copying ${what}..."
582:     local copy_rc
583:     if [ "${MODE}" = "--apply" ]; then
584:         echo ">>> doing copy"
585:         rclone copy "${src}" "${dst}" --files-from-raw "${list}" --update --backup-dir "${shelf}" --create-empty-src-dirs=false --progress --stats 2s \
586:             "${RCLONE_NET_OPTS_ARRAY[@]}" 2>&1 | tee "${list}.out"; copy_rc=${PIPESTATUS[0]}
587:         out=$(cat "${list}.out" 2>/dev/null); rm -f "${list}.out"
588:     else
589:         out=$(rclone copy "${src}" "${dst}" --files-from-raw "${list}" --update --backup-dir "${shelf}" --create-empty-src-dirs=false "${RCLONE_NET_OPTS_ARRAY[@]}" 2>&1); copy_rc=$?
590:     fi
591:     if [ "${copy_rc}" -ne 0 ]; then
592:         printf '%s\n' "${out}" | tail -3
593:         say "Couldn't finish merging ${what}. Nothing was removed from the old folder."
594:         rm -f "${list}" "${differ}" "${missing}"; return 1
595:     fi
596:     # 3. Verified by presence: every name the old folder held is in the new
597:     #    one. Content may differ where the new folder's copy was newer, and
598:     #    that copy is the one kept, so a content check is not the test here.
599:     say "Verifying ${what}..."
600:     [ "${MODE}" = "--apply" ] && echo ">>> doing verify"
601:     : > "${missing}"
602:     rclone check "${src}" "${dst}" --one-way --files-from-raw "${list}" --missing-on-dst "${missing}" "${CHECK_OPTS[@]}" "${RCLONE_NET_OPTS_ARRAY[@]}" >/dev/null 2>&1; rc=$?
603:     if [ "${rc}" -gt 1 ] || [ -s "${missing}" ]; then
604:         say "Not every ${what} file reached the new folder ($(grep -c . "${missing}" 2>/dev/null) missing), so nothing was removed from the old folder."
605:         rm -f "${list}" "${differ}" "${missing}"; return 1
606:     fi
607:     if [ -n "${key}" ] && ! set_pointer "${key}" "${dst#*:}"; then
608:         rm -f "${list}" "${differ}" "${missing}"; return 2
609:     fi
610:     say "Removing the old ${what} folder..."
611:     [ "${MODE}" = "--apply" ] && echo ">>> doing remove"
612:     { rclone delete "${src}" --files-from-raw "${list}" "${RCLONE_NET_OPTS_ARRAY[@]}" \
613:         && rclone rmdirs "${src}" "${RCLONE_NET_OPTS_ARRAY[@]}"; } >/dev/null 2>&1 \
614:         || say "(could not remove the old folder; the merge is complete and verified)"
615:     rm -f "${list}" "${differ}" "${missing}"
616:     return 0
617: }
618:
619: # Point a key of the conf at a tier's new folder: the line rewritten in
620: # place, or added when the conf has none -- and then read back. A write
621: # that did not land (a full or read-only /storage, a path sed's
622: # replacement would mangle) is a failure the caller must stop on, before
623: # anything is removed (the audit of the fixes to #307, G-A-02): its result
624: # used to go unread, and relocate deleted the old folder after it either
625: # way, leaving the device pointed at a folder the run had just emptied.
626: # 0 when the conf now says <remote path>, 1 when it does not.
627: set_pointer() { # <key> <remote path>
628:     if grep -q "^$1=" "${SYNC_CONF}" 2>/dev/null; then
629:         sed -i "s|^$1=.*|$1=\"$2\"|" "${SYNC_CONF}" 2>/dev/null
630:     else
631:         printf '%s="%s"\n' "$1" "$2" >> "${SYNC_CONF}" 2>/dev/null
632:     fi
633:     if [ "$(conf_value "$1")" != "$2" ]; then
634:         say "Couldn't save the new folder in this device's settings. It still uses the old one, and nothing was removed from it."
635:         [ "${MODE}" = "--apply" ] && echo ">>> why YOUR CLOUD SYNC SETTINGS COULDN'T BE SAVED"
636:         logger -t cloud_migrate_layout "could not write $1 to ${SYNC_CONF}; stopped before removing anything" 2>/dev/null
637:         return 1
638:     fi
639:     say "Now using ${2} for your $(tier_words "$1")."
640: }
641:
642: # A tier as the player knows it (es-player-text.md: the four tiers), for
643: # the tidy page's lines -- which named the config key (audit of the fixes,
644: # claude G-A-11).
645: tier_words() { # <pointer key>
646:     case "$1" in
```
```
749: layout_state() { # <remote> <saves> <backups> <content>
750:     local remote="$1" saves="$2" backups="$3" content="$4" state keep cur=0 marker
751:     keep=$(conf_value LAYOUT_KEEP) || return 2
752:     echo "SAVES=${saves}"
753:     echo "BACKUPS=${backups}"
754:     echo "CONTENT=${content}"
755:     echo "CURRENT=${NEW_SAVES}"
756:     # The folder this device is configured for is one witness; the cloud is
757:     # the other. A device upgraded from stock carries /GAMES in its conf
758:     # while its saves sit in /ROCKNIX/Saves, made by its sibling on the
759:     # fork's earlier build (the Retroid Pocket Nova, 2026-10-01): read from
760:     # the conf alone it is "superseded, empty" and would be offered a fresh
761:     # /Rasteratops beside its real saves. So every default this project
762:     # once shipped is looked at, and the one holding files is the source
763:     # the move is offered from (SOURCE=), the configured one or not.
764:     local source=""
765:     if same_folder "${saves}" "${NEW_SAVES}"; then
766:         state=current
767:     elif [ -n "${keep}" ] && same_folder "${saves}" "${keep}"; then
768:         state=kept
769:     elif superseded_default "${saves}"; then
770:         superseded_source "${remote}" "${saves}"; source="${SOURCE_FOUND}"
771:         if [ -n "${source}" ]; then state=superseded-with-files; else state=superseded-empty; fi
772:     else
773:         state=own
774:     fi
775:     echo "SOURCE=${source:--}"
776:     exists "${remote}${NEW_SAVES}" && cur=1
777:     echo "CURRENT_EXISTS=${cur}"
778:     marker=$(rclone cat "${remote}${NEW_SAVES%/*}/${LAYOUT_MARKER}" "${RCLONE_LIST_OPTS[@]}" 2>/dev/null | head -1 | tr -cd 'a-z0-9=')
779:     echo "MARKER=${marker:--}"
780:     echo "STATE=${state}"
781:     return 0
782: }
783:
784: # KEEP USING <folder>: asked once (D-CLOUD-160). The conf remembers the
785: # folder kept, so --state reads "kept" until the folder changes.
786: layout_keep() { # <saves>
787:     set_pointer LAYOUT_KEEP "$1" || return 1
788:     say "Keeping ${1}; the move will not be offered again for this folder."
789:     logger -t cloud_migrate_layout "layout kept at $1 by request" 2>/dev/null
790:     return 0
791: }
792:
793: # "Your other devices will follow": a device on a superseded default whose
794: # current-default folder already exists in the cloud -- another device made
795: # the move -- is re-pointed with no question and one line in the journal.
796: # Nothing is copied or removed here; the folders are already where they
797: # belong. 0 when the device now points at the current layout, 3 when there
798: # was nothing to follow, 1 when the conf could not be written.
799: layout_follow() { # <remote> <saves> <backups> <content>
800:     local remote="$1" saves="$2" backups="$3" content="$4" keep
801:     same_folder "${saves}" "${NEW_SAVES}" && return 3
802:     superseded_default "${saves}" || return 3
803:     keep=$(conf_value LAYOUT_KEEP) || return 2
804:     [ -n "${keep}" ] && same_folder "${saves}" "${keep}" && return 3
805:     # One listing for the usual answer, "no device has moved yet": the
806:     # current folder's parent, which names Saves/ once it exists (exists()
807:     # would list the folder and then its parent, two rclone starts).
808:     list_or_stop "${remote}${NEW_SAVES%/*}/" --dirs-only
809:     printf '%s\n' "${LISTING}" | grep -qxF -- "${NEW_SAVES##*/}/" || return 3
810:     # A device whose old folder still holds files is not followed: they
811:     # would be stranded in a folder nothing reads once the pointer moves
812:     # (the futro's pre-mortem, 2026-10-01). The move is offered instead,
813:     # which copies, verifies and only then removes.
814:     has_files "${remote}${saves}/" && return 3
815:     set_pointer SAVES_REMOTE "${NEW_SAVES}" || return 1
816:     set_pointer SETTINGS_REMOTE "${NEW_BACKUPS}" || return 1
817:     # Content follows only where it was derived from the old folder or
818:     # never set; a folder the player chose for ROMs stays theirs.
819:     if [ -z "${content}" ] || same_folder "${content}" "$(derived_content "$(folder_abs "${saves}")")" \
820:        || same_folder "${content}" "${saves%/}/Content"; then
821:         set_pointer CONTENT_REMOTE "${NEW_CONTENT}" || return 1
822:     fi
823:     say "Followed: this device now uses ${remote}${NEW_SAVES}, which another device already made."
824:     logger -t cloud_migrate_layout "followed the fleet from ${saves} to ${NEW_SAVES}" 2>/dev/null
825:     return 0
826: }
827:
828: # A fresh install beside a fleet still on the earlier folder: this device
829: # is on the current default, the current saves folder holds no saves (it
830: # is not there, or only the seeding's folders and README are), and a
831: # folder this project once shipped as its default does hold them. Without
832: # this the device was offered CREATE IT beside the player's saves, and saw
833: # none of them on its first restore -- the mixed-installation test's fresh
834: # device (D-CLOUD-158). It is pointed at the earlier folder's layout -- a
835: # setting, nothing copied -- so it reads and writes where the saves are,
836: # and is then offered the move as every device on that folder is
837: # (D-CLOUD-160). 0 when it joined, 3 when there was nothing to join, 1
838: # when the conf could not be written.
839: layout_join() { # <remote> <saves> <content>
840:     local remote="$1" saves="$2" content="$3" keep
841:     if same_folder "${saves}" "${NEW_SAVES}"; then
842:         has_files "${remote}${NEW_SAVES}/" --exclude '/README.txt' && return 3
843:     elif superseded_default "${saves}"; then
844:         # The Nova's shape (2026-09-30): a carried /GAMES with nothing in it,
845:         # the saves in /ROCKNIX/Saves beside it. Joined, the move is offered
846:         # from the folder that holds them and KEEP USING keeps that folder;
847:         # left on /GAMES, KEEP USING /ROCKNIX recorded /GAMES.
848:         keep=$(conf_value LAYOUT_KEEP) || return 2
849:         [ -n "${keep}" ] && same_folder "${saves}" "${keep}" && return 3
850:         has_files "${remote}${saves}/" && return 3
851:     else
852:         return 3
853:     fi
854:     earlier_source "${remote}" "${saves}" || return 3
855:     earlier_layout "${SOURCE_FOUND}" "${content}"
856:     set_pointer SAVES_REMOTE "${E_SAVES}" || return 1
857:     set_pointer SETTINGS_REMOTE "${E_BACKUPS}" || return 1
858:     set_pointer CONTENT_REMOTE "${E_CONTENT}" || return 1
859:     say "Joined: this device now uses ${remote}${E_SAVES}, where your saves already are."
860:     logger -t cloud_migrate_layout "joined the fleet at ${E_SAVES}: no saves in ${NEW_SAVES}" 2>/dev/null
861:     return 0
862: }
863:
864: # The wizard's seeding step (cloud_setup --seed-folders): join the earlier
865: # folder that holds the saves; else a device still on a default this
866: # project once shipped, with nothing in it and nothing anywhere, is on no
867: # folder at all (D-CLOUD-161) and is pointed at the current folders, which
868: # the seeding then makes and lists, as it does for any new cloud. Seeding
869: # the carried /GAMES itself put a README there, which every later check
870: # read as saves: the move was offered from /GAMES and left the player's
871: # saves in /ROCKNIX (2026-10-01). 0 when the device was pointed somewhere,
872: # 3 when its folder stands.
873: layout_settle() { # <remote> <saves> <backups> <content>
874:     local remote="$1" saves="$2" backups="$3" content="$4" rc keep
875:     layout_join "${remote}" "${saves}" "${content}"; rc=$?
876:     [ "${rc}" -ne 3 ] && return "${rc}"
877:     superseded_default "${saves}" || return 3
878:     keep=$(conf_value LAYOUT_KEEP) || return 2
879:     [ -n "${keep}" ] && same_folder "${saves}" "${keep}" && return 3
880:     has_files "${remote}${saves}/" && return 3
881:     set_pointer SAVES_REMOTE "${NEW_SAVES}" || return 1
882:     set_pointer SETTINGS_REMOTE "${NEW_BACKUPS}" || return 1
883:     if [ -z "${content}" ] || same_folder "${content}" "$(derived_content "$(folder_abs "${saves}")")" \
884:        || same_folder "${content}" "${saves%/}/Content"; then
885:         set_pointer CONTENT_REMOTE "${NEW_CONTENT}" || return 1
886:     fi
887:     say "Your cloud had nothing in ${remote}${saves}; this device now uses ${remote}${NEW_SAVES}."
888:     logger -t cloud_migrate_layout "settled a carried ${saves} with nothing in it on ${NEW_SAVES}" 2>/dev/null
889:     return 0
890: }
891:
892: # Did another device of ours make the current layout? The marker at the
893: # folder's parent says so (write_marker, after a move or a seeding). A
894: # current folder with no marker is somebody's own folder of the same name,
895: # which the refusals below still protect.
896: fleet_made() { # <remote>
897:     rclone cat "${1}${NEW_SAVES%/*}/${LAYOUT_MARKER}" "${RCLONE_LIST_OPTS[@]}" 2>/dev/null | head -1 | grep -q '^layout='
898: }
899:
900: write_marker() { # <remote>
901:     if printf 'layout=%s\n' "${LAYOUT_VERSION}" | rclone rcat "${1}${NEW_SAVES%/*}/${LAYOUT_MARKER}" "${RCLONE_NET_OPTS_ARRAY[@]}" 2>/dev/null; then
902:         return 0
903:     fi
904:     say "The layout marker could not be written; the folders moved all the same."
905:     logger -t cloud_migrate_layout "could not write ${LAYOUT_MARKER} at ${1}${NEW_SAVES%/*}" 2>/dev/null
906:     return 0
907: }
908:
909: MODE="--check"
910: main() {
```
```
910: main() {
911:     # Every pointer this tool reads must be readable by the shared grammar
912:     # before anything is compared or moved (the audit of the fixes, claude
913:     # G3-D-05): a value the reader cannot read ends the run with its why,
914:     # as cloud_setup ends, never as an empty pointer that reads as a folder.
915:     local _k _v
916:     for _k in SAVESPATH SETTINGS_BACKUPS SAVES_REMOTE SETTINGS_REMOTE CONTENT_REMOTE RCLONE_NET_OPTS; do
917:         _v=$(conf_get "${_k}"); case $? in 2) echo "Your cloud sync settings couldn't be read (${SYNC_CONF}: ${_v})." >&2; exit 2 ;; esac
918:     done
919:     local mode="${1:---check}"
920:     local remote saves backups content old_root
921:     MODE="${mode}"
922:
923:     remote=$(remote_name)
924:     if [ -z "${remote}" ]; then
925:         say "No cloud remote is configured; nothing to migrate."
926:         return 1
927:     fi
928:
929:     # The cloud answers before anything is asked of it (PL-027): a remote
930:     # that does not list at its root is unreadable, and nothing below --
931:     # a presence test, a pointer -- is reached.
932:     # Not for --follow, which an exit sync on a device still on an earlier
933:     # folder runs before every write: its own first listing stops the run on
934:     # a cloud that cannot be read, and the probe and the features query were
935:     # two of the four rclone starts it cost each time (time to play,
936:     # 2026-10-01). Nothing it writes depends on either.
937:     local probe_rc
938:     if [ "${mode}" != "--follow" ]; then
939:         rclone lsd "${remote}" "${RCLONE_LIST_OPTS[@]}" >/dev/null 2>&1; probe_rc=$?
940:         [ "${probe_rc}" -eq 0 ] || unreadable "${remote}" "${probe_rc}"
941:     fi
942:
943:     local net_opts
944:     net_opts=$(conf_value RCLONE_NET_OPTS | tr -s ' ' | sed 's/^ //; s/ $//')
945:     [ -n "${net_opts}" ] || net_opts="${RCLONE_NET_OPTS_FALLBACK}"
946:     read -r -a RCLONE_NET_OPTS_ARRAY <<< "${net_opts}"
947:     # The query creates the remote, a round trip on most backends, so it
948:     # carries the listing bound like every other call here (audit of the
949:     # fixes, G-A-11/G-A-10); one that fails or times out reads as "no
950:     # hashes", the safe side.
951:     local features=""
952:     [ "${mode}" != "--follow" ] && features=$(rclone backend features "${remote}" "${RCLONE_LIST_OPTS[@]}" 2>/dev/null | tr -d ' \t\n')
953:     case "${features}" in *'"Hashes":["'*) ;; *) CHECK_OPTS=(--download) ;; esac
954:     # And whether it keeps case apart (PL-001): only a cloud that says so
955:     # holds /rocknix/saves and /ROCKNIX/Saves as two folders. One that folds
956:     # case, or whose features cannot be read, holds them as one, and a
957:     # pointer spelled either way is the new folder, so nothing moves -- the
958:     # safe side, since the other side deletes a folder copied onto itself.
959:     case "${features}" in *'"CaseInsensitive":false'*) CASE_INSENSITIVE=0 ;; *) CASE_INSENSITIVE=1 ;; esac
960:
961:     saves=$(conf_value SAVES_REMOTE)
962:     backups=$(conf_value SETTINGS_REMOTE)
963:
964:     content=$(conf_value CONTENT_REMOTE)
965:
966:     # Each pointer as the folder it names (PL-001): cleaned for the paths
967:     # below and compared by folder_key, never as a string. A ".." cannot be
968:     # read as one folder without the cloud's own rules -- rclone resolves
969:     # /ROCKNIX/Old/../Saves to /ROCKNIX/Saves -- so a layout holding one is
970:     # left exactly as it is.
971:     local ptr cleaned
972:     for ptr in saves backups content; do
973:         if ! cleaned=$(clean_path "${!ptr}"); then
974:             say "REFUSING: a folder in this device's cloud settings has .. in it, so it can't be told which folder it means. Nothing was changed."
975:             [ "${mode}" = "--apply" ] && echo ">>> why YOUR CLOUD SYNC SETTINGS COULDN'T BE READ"
976:             logger -t cloud_migrate_layout "a pointer has a .. component; nothing done" 2>/dev/null
977:             return 4
978:         fi
979:         printf -v "${ptr}" '%s' "${cleaned}"
980:     done
981:
982:     # A layout the owner chose is current too. CHANGE CLOUD FOLDER writes the
983:     # settings and content folders as SIBLINGS of the saves folder -- the
984:     # parent's Backups and Content, or the folder's own when it sits at the
985:     # root -- and a device on /Custom/Saves, /Custom/Backups, /Custom/Content
986:     # has nothing to migrate. Until 2026-09-11 only the /ROCKNIX names counted
987:     # as current, so this check offered to move a deliberately chosen layout
988:     # back to the default one (#74). The nested first layout, backups INSIDE
989:     # the saves folder, is the only shape this tool exists to move.
990:     case "${mode}" in
991:         --state)  layout_state "${remote}" "${saves}" "${backups}" "${content}"; return $? ;;
992:         --keep)   layout_keep "${saves}"; return $? ;;
993:         --follow) layout_follow "${remote}" "${saves}" "${backups}" "${content}"; return $? ;;
994:         --join)   layout_join "${remote}" "${saves}" "${content}"; return $? ;;
995:         --settle) layout_settle "${remote}" "${saves}" "${backups}" "${content}"; return $? ;;
996:     esac
997:
998:     local sabs sib_parent
999:     sabs=$(folder_abs "${saves}")
1000:     sib_parent="${sabs%/*}"; [ -n "${sib_parent}" ] || sib_parent="${sabs}"
```
```
1265: # --superseded: the list, one per line, for the sync scripts' string test
1266: # before they pay for a network call (no conf, no network, no lock).
1267: if [ "${1:-}" = "--superseded" ]; then printf '%s\n' "${SUPERSEDED_DEFAULT_SAVES[@]}"; exit 0; fi
1268: # --needs-step: whether the cloud folder step has something to settle
1269: # (D-CLOUD-170), asked at every boot, so no network and no rclone start: the
1270: # saves folder is a default this project once shipped, the player has not
1271: # kept it, and a remote is set up. 0 when it has, 1 when not, 2 when the
1272: # conf cannot be read -- which settles nothing, so the step stays away.
1273: # Names compared as written, case included: with no network there is no
1274: # asking the cloud whether it folds case, and a hand-typed /games that a
1275: # case-sensitive cloud calls the player's own would put the scan up at
1276: # every boot for nothing. The scripts write the defaults in their own case.
1277: if [ "${1:-}" = "--needs-step" ]; then
1278:     CASE_INSENSITIVE=0
1279:     _saves=$(conf_value SAVES_REMOTE) || exit 2
1280:     _keep=$(conf_value LAYOUT_KEEP) || exit 2
1281:     superseded_default "${_saves}" || exit 1
1282:     [ -n "${_keep}" ] && same_folder "${_saves}" "${_keep}" && exit 1
1283:     grep -q '^\[' /storage/.config/rclone/rclone.conf 2>/dev/null || exit 1
1284:     exit 0
1285: fi
1286: [ "${1:-}" = "--apply" ] && take_cloud_lock
1287: main "$@" 9>&-
```

## projects/ROCKNIX/packages/network/rclone/sources/cloud_backup
```
804: # Whether the cloud is bucket-based (S3 and compatibles, GCS, Swift, B2), and
805: # on a bucket whether a folder exists: its parent lists it. cloud_restore's
806: # two helpers, the same rule here so the two scripts never disagree about
807: # whether a saves folder is there (#141).
808: BUCKET_BASED=""
809: bucket_based() {
810:     if [ -z "${BUCKET_BASED}" ]; then
811:         if rclone backend features "${REMOTENAME}" 2>/dev/null | grep -q '"BucketBased": *true'; then
812:             BUCKET_BASED=1
813:         else
814:             BUCKET_BASED=0
815:         fi
816:     fi
817:     [ "${BUCKET_BASED}" = "1" ]
818: }
819: bucket_dir_listed() {
820:     local path="${1%/}" parent name
821:     name="${path##*/}"
822:     [ -n "${name}" ] || return 0
823:     parent="${path%/*}"
824:     rclone lsf --dirs-only "${REMOTENAME}${parent}" "${RCLONE_LIST_OPTS[@]}" 2>/dev/null | grep -qx "${name}/"
825: }
826:
827: # Whether the saves setting is a default this project once shipped
828: # (/GAMES, /ROCKNIX/Saves), from cloud_migrate_layout's own list: a string
829: # test, no network. Names compared as written.
830: superseded_saves_setting() {
831:     local tool s want="${SAVES_REMOTE%/}"
832:     tool="$(dirname "$(readlink -f "$0")")/cloud_migrate_layout"
833:     [ -x "${tool}" ] || tool=/usr/bin/cloud_migrate_layout
834:     [ -x "${tool}" ] || return 1
835:     while IFS= read -r s; do
836:         [ -n "${s}" ] && [ "${s%/}" = "${want}" ] && return 0
837:     done < <("${tool}" --superseded 2>/dev/null)
838:     return 1
839: }
840:
841: outcome_word() {
842:     case "$1" in
```
```
1642:         fi
1643:     fi
1644:
1645:     # Check if local backup path exists and has content
1646:     if [ ! -d "${SAVESPATH}" ]; then
1647:         log_message "the saves folder ${SAVESPATH} is not on this device" "false" "ERROR"
1648:         log_message "Your saves folder isn't on this device." "true" "ERROR"
1649:         say_why "YOUR SAVES FOLDER ISN'T ON THIS DEVICE"
1650:         return 1
1651:     fi
1652:
1653:     # Check if we have any files to backup (excluding directories we'll skip anyway)
1654:     local files_to_backup=$(find "${SAVESPATH}" -type f ! -path "*/bios/*" ! -path "*/backups/*" ! -name "*.zip" ! -name "*.tar.gz" | head -1)
1655:     if [ -z "$files_to_backup" ]; then
1656:         log_message "no saves to back up in ${SAVESPATH}" "false" "WARN"
1657:         log_message "There are no saves to back up yet." "true" "WARN"
1658:         return 0
1659:     fi
1660:
1661:     # A default this project once shipped (/GAMES, /ROCKNIX/Saves) that the
1662:     # cloud does not hold is no folder at all (D-CLOUD-161), and a backup
1663:     # does not make it (D-CLOUD-172): it made one before, on a device
1664:     # updated from stock ROCKNIX, and the startup card said SKIPPED - YOUR
1665:     # CLOUD FOLDER ISN'T SET UP YET over a backup that had just written
1666:     # nine saves into /GAMES (guest d, run 100). So it says what the
1667:     # restore says -- the offer line, which an automatic sync's card reads
1668:     # as that SKIPPED and a deliberate run as the offer to create the
1669:     # folder, whose seeding settles the setting on the current folders
1670:     # (cloud_migrate_layout --settle) -- and the cloud folder step asks at
1671:     # the next boot (D-CLOUD-170). Asked only for such a setting; a listing
1672:     # that cannot answer leaves the backup as it was, since skipping it on
1673:     # a guess would leave the saves only on the device.
1674:     if superseded_saves_setting; then
1675:         local saves_folder="${SAVES_REMOTE%/}" list_rc
1676:         rclone lsd "${REMOTENAME}${saves_folder}" "${RCLONE_PROBE_OPTS[@]}" >/dev/null 2>&1; list_rc=$?
1677:         if [ ${list_rc} -eq 0 ] && bucket_based && ! bucket_dir_listed "${saves_folder}"; then
1678:             list_rc=3
1679:         fi
1680:         if [ ${list_rc} -eq 3 ]; then
1681:             log_message "saves folder ${SAVES_REMOTE} is a default an earlier version shipped, and the cloud has none; a backup does not make it (D-CLOUD-172)" "false"
1682:             log_message "Nothing backed up: your cloud has no ${saves_folder} folder yet." "true"
1683:             echo ">>> offer create-saves-folder|${saves_folder}"
1684:             return 0
1685:         fi
1686:     fi
1687:
1688:     # Test remote connectivity before starting backup
1689:     # One round trip, not two. mkdir is idempotent and fails when the remote
1690:     # is unreachable or the sign-in has lapsed, so it is the reachability
1691:     # test as well; the separate `lsd` that used to run first cost a second
1692:     # on every run and proved nothing mkdir would not. If it fails,
1693:     # check_internet does the slower work of wording the error.
1694:     #
1695:     # Not on a --recent run. Starting rclone costs a second on a handheld
1696:     # and the round trip another, for a directory the copy creates itself
1697:     # when it has something to put there -- and when it has nothing, the
1698:     # remote is never touched at all, which is the point of --recent. If
1699:     # the copy does fail, check_internet words the reason below.
1700:     if [ "${RECENT}" -eq 0 ]; then
1701:         log_message "Ensuring remote sync path exists: ${REMOTENAME}${SAVES_REMOTE}" "false"
1702:         rclone mkdir "${REMOTENAME}${SAVES_REMOTE}" "${RCLONE_PROBE_OPTS[@]}" 2>/dev/null
1703:         local mkdir_rc=$?
1704:         if [ ${mkdir_rc} -ne 0 ]; then
1705:             log_message "remote ${REMOTENAME}${SAVES_REMOTE} not accessible (rclone exit ${mkdir_rc})" "false" "ERROR"
1706:             log_message "Couldn't reach your saves folder in the cloud." "true" "ERROR"
1707:             # Exits 69 or 1 with its own why when the network or the cloud
1708:             # is the cause; returns when the remote answers, so the folder is.
1709:             check_internet
1710:             say_why "$(why_for "${mkdir_rc}")"
1711:             return 1
1712:         fi
1713:     fi
1714:
1715:     # Pass an explicit --log-level INFO when LOG_LEVEL is INFO
```
```
2370:         # at most that many archives per folder until the owner removes them.
2371:         # Deleting what cannot be attributed is the failure this exists to
2372:         # stop, so the guard fails closed: no label, no deletion.
2373:         if [ ${BACKUP_SYSTEM_STATUS} -eq 0 ] && [ ${sent_any} -eq 1 ]; then
2374:             local keep="${CLOUD_BACKUP_KEEP:-3}"
2375:             case "${keep}" in
2376:                 ''|*[!0-9]*) keep=3 ;;
2377:             esac
2378:             local label
2379:             label=$(device_label)
2380:             if [ -z "${label}" ]; then
2381:                 log_message "Cannot tell this device's archives from another device's (cloud_device_id gave no name); nothing removed from ${device_dest}" "false" "WARN"
2382:             else
2383:                 local osn listing mine total_n mine_n old_archive
2384:                 osn=$(os_name)
2385:                 listing=$(rclone lsf --files-only --include "*.{zip,tar.gz}" "${device_dest}/" "${RCLONE_LIST_OPTS[@]}" 2>/dev/null)
2386:                 mine=$(printf '%s\n' "${listing}" \
2387:                        | grep -E "^[0-9]{4}_[0-9]{2}_[0-9]{2}-[0-9]{6}-${label}-${osn}_SETTINGS\.tar\.gz$" | sort -r)
2388:                 total_n=$(printf '%s\n' "${listing}" | grep -c .)
2389:                 mine_n=$(printf '%s\n' "${mine}" | grep -c .)
2390:                 if [ "${total_n}" -gt "${mine_n}" ]; then
2391:                     log_message "Leaving $((total_n - mine_n)) archive(s) not named for this device (${label}) alone in ${device_dest}" "false"
2392:                 fi
2393:                 # The archives this run uploaded are kept by name, whatever
2394:                 # the others' names say: a date is the clock of the device
2395:                 # that wrote it, and three archives stamped by a clock that
```

## projects/ROCKNIX/packages/network/rclone/sources/cloud_restore
```
805: }
806:
807: # On a bucket, whether a folder exists: its parent lists it, by a directory
808: # marker or by objects under it. The remote's root always exists; a bucket
809: # is listed at the root. Listing the folder itself proves nothing there
810: # (#141), so this never does.
811: bucket_dir_listed() {
812:     local path="${1%/}" parent name
813:     name="${path##*/}"
814:     [ -n "${name}" ] || return 0
815:     parent="${path%/*}"
816:     rclone lsf --dirs-only "${REMOTENAME}${parent}" "${RCLONE_LIST_OPTS[@]}" 2>/dev/null | grep -qx "${name}/"
817: }
818:
819: why_for() {
820:     case "$1" in
821:         3|4) echo "COULDN'T FIND YOUR CLOUD FOLDER" ;;
822:         5)   echo "YOUR CLOUD STOPPED ANSWERING" ;;
823:         6)   echo "SOME FILES DIDN'T FINISH" ;;
824:         7|8) echo "YOUR CLOUD WOULDN'T TAKE THE FILES" ;;
825:         130) echo "IT WAS STOPPED" ;;
826:         10|124)
827:             # The ceiling ended the run. An automatic sync runs again on its
```
```
1499: # The OS name the archive's name ends with. backuptool has OS_NAME from
1500: # /etc/profile; this script is started by systemd and by EmulationStation,
1501: # where no profile has run, so it is read from the file the profile reads it
1502: # from. Never empty, so the pattern built on it always names a whole archive.
1503: os_name() {
1504:     local name="${OS_NAME}"
1505:     [ -z "${name}" ] && name=$(sed -n 's/^OS_NAME="\{0,1\}\([^"]*\)"\{0,1\}$/\1/p' /etc/os-release 2>/dev/null | head -1)
1506:     [ -z "${name}" ] && name="ROCKNIX"
1507:     printf '%s\n' "${name}" | tr -cd 'A-Za-z0-9_-'
1508: }
1509:
1510: # Enhanced error reporting function
1511: #
1512: # rclone's taxonomy -- "Directory not found or permission denied", "Fatal
1513: # error - rclone giving up" -- went to the screen with the code until
1514: # 2026-09-10. The code and rclone's name go to the log; the screen gets the
1515: # outcome in the player's words and the one `>>> why` line the card and the
```
```
1657:     log_message "Checking if remote path exists: ${REMOTENAME}${SAVES_REMOTE}" "false"
1658:     rclone lsd "${REMOTENAME}${SAVES_REMOTE}" "${RCLONE_LIST_OPTS[@]}" > /dev/null 2>&1
1659:     local remote_check_status=$?
1660:     # On a bucket-based cloud (S3 and its compatibles, GCS, Swift, B2) a
1661:     # folder is a prefix on object names, so listing an absent one succeeds
1662:     # with nothing in it -- rclone's documented shape ("listing a nonexistent
1663:     # directory will produce an error except for remotes which can't have
1664:     # empty directories"), not a fault. The lsd above therefore proves
1665:     # nothing there, and a mistyped folder name restored nothing and said
1666:     # COMPLETED (#141, from the #133 matrix). What does exist on a bucket is
1667:     # what the folder's PARENT lists: a prefix with objects under it, or a
1668:     # directory marker -- the zero-byte "name/" object the AWS and MinIO
1669:     # consoles write for "Create folder" and rclone writes under
1670:     # directory_markers (cloud_setup --seed-folders uses it, and puts a
1671:     # README in each folder besides, which is what makes our folders real
1672:     # there). So on a bucket a folder is present when its parent lists it,
1673:     # and the same rule judges the parent below, which is how a mistyped
1674:     # root fails on a bucket exactly as on a path-based cloud (2026-09-12,
1675:     # the maintainer's marker question). The features call is local.
1676:     if [ ${remote_check_status} -eq 0 ] && bucket_based && ! bucket_dir_listed "${SAVES_REMOTE}"; then
1677:         log_message "bucket-based cloud: ${SAVES_REMOTE} is not listed by its parent (no marker, no objects), which on a bucket is the folder not existing" "false"
1678:         remote_check_status=3
1679:     fi
1680:     if [ $remote_check_status -ne 0 ]; then
1681:         network_lost_during_run "$remote_check_status" "the saves restore"
1682:
1683:         # A cloud that answers, with no saves folder in it, is not a failure:
1684:         # it is the everyday shape of a device whose saves have never been
1685:         # backed up, and telling that player their restore FAILED is telling
1686:         # them something is broken when nothing is (#100, D-CLOUD-085).
1687:         #
1688:         # The parent is what separates the two. If the cloud root is there
1689:         # and only the saves folder inside it is missing, there is simply
1690:         # nothing to bring back. If the root itself is missing, the setting
1691:         # is wrong -- a typo in the folder name would otherwise restore
1692:         # nothing and report success, which is the shape that shipped broken
1693:         # in four images (blindspot 13). So the parent must be listed
1694:         # successfully before this counts as empty, and a saves folder
1695:         # configured AT the root has no parent to distinguish it and keeps
1696:         # failing.
1697:         #
1698:         # Two refinements (#127, D-CLOUD-091/092). A saves folder at the
1699:         # cloud's root (/Saves) has the root for a parent, and a root the
1700:         # remote answers for is a present parent by definition -- it used
1701:         # to have "no parent" and kept failing. And the parent test covers
1702:         # only the parent: /ROCKNIX/Savez has a present parent and got the
1703:         # plain offer, and CREATE IT would have put Savez beside the real
1704:         # Saves, after which every backup went to the wrong folder. So the
1705:         # parent's folders are listed, and one whose name is within a typo
1706:         # of the missing one travels on the offer line for EmulationStation
1707:         # to name -- the plain offer only when nothing near it exists.
1708:         local saves_path="${SAVES_REMOTE%/}"
1709:         local saves_parent="${saves_path%/*}"
1710:         [ "${saves_parent}" = "${saves_path}" ] && saves_parent=""
1711:         local missing_name="${saves_path##*/}"
1712:         if rclone lsd "${REMOTENAME}${saves_parent}" "${RCLONE_LIST_OPTS[@]}" >/dev/null 2>&1 \
1713:            && { ! bucket_based || bucket_dir_listed "${saves_parent}"; }; then
1714:             local near
1715:             near=$(rclone lsf --dirs-only "${REMOTENAME}${saves_parent}" "${RCLONE_LIST_OPTS[@]}" 2>/dev/null \
1716:                    | sed 's|/$||' | near_names "${missing_name}" | head -1)
1717:             if [ -n "${near}" ]; then
1718:                 log_message "saves folder ${SAVES_REMOTE} absent; its parent ${saves_parent:-/} lists and holds a near name: ${near}" "false"
1719:                 echo "Nothing to restore yet: your cloud has ${saves_parent}/${near} but no ${saves_path}. Check the folder name."
1720:                 echo ">>> offer create-saves-folder|${saves_path}|${saves_parent}/${near}"
1721:                 return 0
1722:             fi
1723:             log_message "saves folder ${SAVES_REMOTE} absent but its parent ${saves_parent:-/} lists; treating as an empty cloud" "false"
1724:             echo "Nothing to restore yet."
1725:             # EmulationStation offers to create the folder when it sees this;
1726:             # the wizard's own seeding action is what makes it (cloud_setup
1727:             # --seed-folders). A protocol line rather than a parsed sentence,
1728:             # so rewording the line above can never turn the offer off.
1729:             echo ">>> offer create-saves-folder|${saves_path}"
1730:             return 0
1731:         fi
1732:
1733:         log_message "Couldn't reach your saves folder in the cloud." "true" "ERROR"
1734:         report_rclone_error $remote_check_status "Reaching your saves folder"
1735:         return $remote_check_status
1736:     fi
1737:
1738:     # Ensure local restore path exists
1739:     if [ ! -d "${SAVESPATH}" ]; then
1740:         log_message "Creating local restore path: ${SAVESPATH}" "false"
```
```
2100:         # drag down every archive it holds and leave several beside each other
2101:         # with no way for backuptool to know which was meant. Names lead with
2102:         # the date, so the last one in sort order is the most recent and no
2103:         # metadata call is needed to establish that.
2104:         #
2105:         # This device's own first. Since 2026-09-08 the name carries the
2106:         # device that wrote it (<stamp>-<label>-ROCKNIX_SETTINGS.tar.gz), and
2107:         # the folder may hold more than this device's: another handheld's
2108:         # archive that was restored here and sent up again, one written by a
2109:         # device sharing the folder (a cloned id, #86), and every archive from
2110:         # before names carried a device. When this device has a labelled
2111:         # archive here, the newest of those is the one to bring back. When it
2112:         # has none -- a fresh device that adopted another's folder to take
2113:         # over its settings (#26), or a folder holding only archives from
2114:         # before names carried a device -- the newest overall is, and the log
2115:         # says whose it was. An archive carrying this device's label but made
2116:         # on another device (the two ways cloud_backup's retention names) is
2117:         # taken for this device's own; the label cannot tell them apart.
2118:         local osn listing label mine newest
2119:         osn=$(os_name)
2120:         listing=$(rclone lsf --files-only --include "*.{zip,tar.gz}" "${restore_src}/" "${RCLONE_LIST_OPTS[@]}" 2>/dev/null)
2121:         label=$(device_label)
2122:         mine=""
2123:         if [ -n "${label}" ]; then
2124:             mine=$(printf '%s\n' "${listing}" \
2125:                    | grep -E "^[0-9]{4}_[0-9]{2}_[0-9]{2}-[0-9]{6}-${label}-${osn}_SETTINGS\.tar\.gz$" | sort | tail -1)
2126:         fi
2127:         if [ -n "${mine}" ]; then
2128:             newest="${mine}"
2129:             log_message "Restoring this device's own newest settings backup (named for ${label}): ${newest}" "false"
2130:         else
2131:             # By date, where a name carries one; an archive whose name has no
2132:             # date (ROCKNIX_BACKUP.zip, from before archives were dated) only
2133:             # when nothing dated is there. Sorted together, "R" outranks
2134:             # every "2" and the undated legacy archive read as the newest
2135:             # (#308 gpt F-CS-35).
2136:             newest=$(printf '%s\n' "${listing}" | grep -E '^[0-9]{4}_[0-9]{2}_[0-9]{2}-[0-9]{6}-' | sort | tail -1)
2137:             [ -n "${newest}" ] || newest=$(printf '%s\n' "${listing}" | grep -v '^$' | sort | tail -1)
2138:             if [ -n "${newest}" ]; then
2139:                 local made_by
2140:                 # The label is what sits between the stamp and -ROCKNIX_; an
2141:                 # archive from before the label has nothing there.
2142:                 made_by=$(printf '%s\n' "${newest}" \
2143:                           | sed -nE "s/^[0-9]{4}_[0-9]{2}_[0-9]{2}-[0-9]{6}-(.*)-${osn}_(SETTINGS|BACKUP)\.(tar\.gz|zip)\$/\1/p")
2144:                 case "${made_by}" in
2145:                     '') made_by="made before backups were named after the device" ;;
2146:                     *)  made_by="made on ${made_by}" ;;
2147:                 esac
2148:                 log_message "no settings backup named for this device (${label:-no name}) in ${restore_src}; restoring the newest there, ${newest} (${made_by})" "false"
2149:                 log_message "No settings backup here is named for this device, so the newest one is being restored (${made_by})." "true"
2150:             fi
2151:         fi
2152:
2153:         if [ -z "${newest}" ]; then
2154:             log_message "There's no settings backup in the cloud yet." "true" "WARN"
2155:             RESTORE_SYSTEM_STATUS=0
```

## projects/ROCKNIX/packages/network/rclone/sources/cloud_setup
```
707:     --seed-folders)
708:         # Give a new remote a shape, so somebody with a fresh handheld can see
709:         # where their files go.
710:         #
711:         # Until the first upload these folders do not exist, so a player who
712:         # wants to seed their library from a computer first has to guess three
713:         # names and a per-system convention. The folders answer that; the
714:         # README in each answers what belongs there.
715:         #
716:         # The READMEs are also what makes this work at all on bucket-based
717:         # remotes (S3, B2): there the first path component is a bucket and the
718:         # rest is a key prefix, so an empty directory does not persist and
719:         # `rclone mkdir` on a subpath succeeds while creating nothing. A file
720:         # in the folder is what materialises it.
721:         #
722:         # Nothing is ever overwritten and nothing is deleted. Paths come from
723:         # the config, so a player who moved their cloud folder gets their own
724:         # layout seeded rather than ours.
725:         REMOTE=$(rclone listremotes 2>/dev/null | head -1)
726:         [ -z "${REMOTE}" ] && { echo "ERROR no remote"; exit 2; }
727:         # The folder is settled before anything is made
728:         # (cloud_migrate_layout --settle, D-CLOUD-169). A fresh install, or
729:         # a carried /GAMES, beside a fleet still on the earlier folder joins
730:         # it: seeding an empty /Rasteratops beside the player's saves left a
731:         # new device reading a folder with none of them in it (the
732:         # mixed-installation test, D-CLOUD-158), and seeding the carried
733:         # /GAMES put a README there that every later check read as saves. A
734:         # carried default with nothing anywhere is pointed at the current
735:         # folders, which the seeding makes, as for any new cloud. A settle
736:         # that could not answer changes nothing and the seeding goes on.
737:         layout_tool="$(dirname "$(readlink -f "$0")")/cloud_migrate_layout"
738:         [ -x "${layout_tool}" ] || layout_tool=/usr/bin/cloud_migrate_layout
739:         [ -x "${layout_tool}" ] && timeout 30 "${layout_tool}" --settle >/dev/null 2>&1 \
740:             && log_message "Seeding: this device's cloud folder was settled first (cloud_migrate_layout --settle)"
741:         # Read as text, never eval'd: the config is shell, and a value an
742:         # earlier build wrote could carry a command (PL-051). A folder in a
743:         # form the scripts cannot read makes nothing: read as empty, it
744:         # became the default folder here and was seeded in the player's
745:         # cloud (gpt G2-C-01).
746:         if ! SAVES_REMOTE="$(conf_get SAVES_REMOTE)" \
747:            || ! SETTINGS_REMOTE="$(conf_get SETTINGS_REMOTE)" \
748:            || ! CONTENT_REMOTE="$(conf_get CONTENT_REMOTE)"; then
749:             echo "Your cloud sync settings couldn't be read, so no folders were made."
750:             log_message "Seeding: a folder in ${SYNC_CONF} is not in a form the sync reads; nothing was made"
751:             exit 1
752:         fi
753:         SAVES="${SAVES_REMOTE:-/Rasteratops/Saves}"
754:         BACKUPS="${SETTINGS_REMOTE:-/Rasteratops/Backups}"
755:         # An empty CONTENT_REMOTE is not a missing one: it is
756:         # --use-content-root's "the cloud's root", which is where the
757:         # content scripts put ROMs/ and BIOS/ (ROOT="<remote>:"). Only a
758:         # config with no such line gets the default (#308 gpt F-RS-20).
759:         if grep -q '^CONTENT_REMOTE=' "${SYNC_CONF}" 2>/dev/null; then
760:             CONTENT="${CONTENT_REMOTE%/}"
761:         else
762:             CONTENT="/Rasteratops/Content"
763:         fi
764:
765:         for d in "${SAVES}" "${SAVES}/savefiles" "${SAVES}/savestates" \
766:                  "${SAVES}/screenshots" "${BACKUPS}" \
767:                  ${CONTENT:+"${CONTENT}"} "${CONTENT}/ROMs" "${CONTENT}/BIOS"; do
768:             # --s3-directory-markers writes a zero-byte object ending in "/",
769:             # which is how S3 itself represents a folder -- without it a
770:             # bucket remote silently keeps nothing, and mkdir still exits 0.
771:             # Ignored by path-based backends, so it costs nothing there.
772:             # Bounded like the listings (#308 claude F-RS-13, gpt F-RS-19):
773:             # up to two dozen calls under one 90 s box in the interface.
774:             rclone mkdir --s3-directory-markers "${REMOTE}${d}" "${RCLONE_LIST_OPTS[@]}" 2>/dev/null
775:         done
776:         # The layout marker (fork #356): one line at the parent of the saves
777:         # folder saying which shape of folders this cloud carries, read by
778:         # every device before it offers a move or a creation
779:         # (cloud_migrate_layout --state). Written here because seeding is
780:         # where a cloud first takes the current shape.
781:         # Not beside a folder this project once shipped as its default: a
782:         # device that joined one marks nothing, and a layout=2 marker at
783:         # /ROCKNIX would say a thing about that cloud that is not so.
784:         if [ -x "${layout_tool}" ] && "${layout_tool}" --superseded 2>/dev/null | grep -qFx -- "${SAVES%/}"; then
785:             :
786:         elif ! printf 'layout=2\n' | rclone rcat "${REMOTE}${SAVES%/*}/.layout" "${RCLONE_LIST_OPTS[@]}" 2>/dev/null; then
787:             log_message "Seeding: the layout marker could not be written at ${SAVES%/*}/.layout"
788:         fi
789:
790:         seed_note() {
```

## projects/ROCKNIX/packages/rocknix/sources/scripts/backuptool
```
130: #
131: # zip does not carry a symlink as a symlink, and this OS is full of them: the
132: # config tree links into /usr for OS-shipped content. Backups written before
133: # 358eb53d3f stored those targets' bytes as regular files, and busybox unzip
134: # then aborts the *whole* restore rather than overwrite a live symlink
135: # ("exists but is not a regular file"). That cost a restore, needed a second
136: # fix on the read side (02297b9c07), and left a skip-list in this script to
137: # work around archives already in the wild.
138: #
139: # tar stores a symlink as a symlink, preserves permissions and ownership, and
140: # extracts cleanly over an existing one. Verified on-device, because Info-ZIP
141: # on a desktop and busybox on a handheld disagree, which is how the original
142: # bug stayed invisible.
143: BACKUPFILE="${SETTINGS_BACKUPS}/${BACKUP_STAMP}-${DEVICE_LABEL:+${DEVICE_LABEL}-}${OS_NAME}_SETTINGS.tar.gz"
144: LEGACY_BACKUPFILE="${SETTINGS_BACKUPS}/${OS_NAME}_BACKUP.zip"
145:
146: # The newest archive present, whatever it is called and whichever device wrote
147: # it. Names lead with the date, so sorting them orders them by age.
148: #
149: # Any device's, on purpose. A device that has just pulled another handheld's
150: # archive from the cloud (the fresh-device journey, #26) has it beside its own
151: # or in place of it, and "restore the newest backup" -- which is what the menu
152: # promises -- must apply it. These globs are the ones this function has always
153: # had: a labelled name ends in -ROCKNIX_SETTINGS.tar.gz like every archive
154: # before it, so the first glob takes the new shape and the old alike, and the
155: # other two take the two dated names before that. Unchanged, so that an image
156: # from before the label finds a new archive with the very same code.
157: newest_backup() {
158:     local found
159:     found=$(ls -1 "${SETTINGS_BACKUPS}"/*-"${OS_NAME}"_SETTINGS.tar.gz \
160:                   "${SETTINGS_BACKUPS}"/*-"${OS_NAME}"_BACKUP.tar.gz \
161:                   "${SETTINGS_BACKUPS}"/*-"${OS_NAME}"_BACKUP.zip 2>/dev/null | sort | tail -1)
162:     if [ -n "${found}" ]; then
163:         echo "${found}"
164:     elif [ -f "${LEGACY_BACKUPFILE}" ]; then
165:         echo "${LEGACY_BACKUPFILE}"
166:     fi
167: }
168: ARCHIVE_KEEP=3
169: ESPATH="/storage/.config/emulationstation"
170: mkdir -p "${SETTINGS_BACKUPS}"
```

## /home/max/Development/emulationstation-next.worktrees/cloud-epic/es-app/src/guis/GuiMenu.cpp
```
4835: 	// made, the game list included (D-CLOUD-049) -- so a scraped device can
4836: 	// back up its ROMs alone and read as matching, or send the artwork on
4837: 	// its own. Which systems it comes from is CONTINUE's question.
4838: 	auto media = std::make_shared<SwitchComponent>(window);
4839: 	media->setState(hasContent && remembered("media", false));
4840: 	if (hasContent)
4841: 		s->addWithDescription(_("GAME CONTENT"),
4842: 			_("SCRAPED ARTWORK, VIDEOS, MANUALS, AND GAME LISTS"), media);
4843:
4844: 	auto settings = std::make_shared<SwitchComponent>(window);
4845: 	settings->setState(remembered("settings", false));
4846: 	// On a restore the row is offered only when the cloud holds a settings
4847: 	// backup from this device model (D-CLOUD-162, #349): the scan page before
4848: 	// this one listed the archives by the label in their names (cloud_scan's
4849: 	// settings file, MINE= this device's newest). With none the row stays,
4850: 	// dimmed, with its reason -- es-ui-style-guide.md dims rather than hides
4851: 	// -- and nothing is ticked; offered, its line says which device and when,
4852: 	// the approved "<DEVICE>, <DATE>" (D-CLOUD-164). A backup always has
4853: 	// settings to send, and a page with no scan behind it (older scripts)
4854: 	// reads as it always did.
4855: 	const std::map<std::string, std::string> archives = backup ? std::map<std::string, std::string>() : cloudScanFacts("settings");
4856: 	const bool scanned = !backup && archives.count("MINE") > 0;
4857: 	const CloudText::SettingsArchive mine = scanned ? CloudText::parseSettingsArchive(cloudScanFact(archives, "MINE")) : CloudText::SettingsArchive();
4858: 	if (scanned && !mine.ok)
4859: 	{
4860: 		settings->setState(false);
4861: 		cloudAddDimmedRow(s, window, _("SETTINGS"), _("NO SETTINGS BACKUP FROM THIS DEVICE YET"));
4862: 	}
4863: 	else
4864: 		s->addWithDescription(_("SETTINGS"),
4865: 			// The date in the system's own shape, as every LAST line is
4866: 			// (cloudLastLabel): the formatter knows no month names, and
4867: 			// "%b" printed nothing (guest d, 2026-10-01).
```
```
5206: static void cloudOfferContentFolder(Window* window, const std::function<void()>& then)
5207: {
5208: 	const auto facts = cloudScanFacts("content-location");
5209: 	const std::string state = cloudScanFact(facts, "STATE");
5210: 	const std::string found = cloudScanFact(facts, "FOUND");
5211: 	if (state == "found-elsewhere" && !found.empty())
5212: 	{
5213: 		LOG(LogInfo) << "cloud content folder: nothing of ours at the configured root; using " << found;
5214: 		cloudSetContentFolder(window, found, then);
5215: 		return;
5216: 	}
5217: 	if (state != "empty")
5218: 	{
5219: 		then();
5220: 		return;
5221: 	}
5222: 	std::string folder = cloudScanFact(facts, "CONTENT_REMOTE");
5223: 	if (folder.empty())
5224: 		folder = "/";
5225: 	window->pushGui(new GuiMsgBox(window,
5226: 		Utils::String::format(_("YOUR CLOUD HAS NO ROMS OR BIOS AT %s.\n\nCHOOSE THE FOLDER WHERE YOUR GAMES ARE?").c_str(), folder.c_str()),
5227: 		_("CHOOSE A FOLDER"), [window, then] { cloudOpenContentFolderChooser(window, then); },
5228: 		_("NOT NOW"), then));
5229: }
5230: // CHOOSE A CLOUD FOLDER (#352, the approved title): the folders at the
5231: // cloud's root, as the scan listed them (root-dirs), the one the scan
5232: // found first when it found one. A press points the device's content root
5233: // there and goes on to the content scan.
5234: static void cloudOpenContentFolderChooser(Window* window, const std::function<void()>& then)
5235: {
```
```
5280: }
5281:
5282: // The folder dialogs the scan can raise, before anything is offered (#353;
5283: // the state is cloud_migrate_layout --state's, written by the scan page):
5284: //
5285: // - superseded-with-files: the cloud holds the fork's earlier folder
5286: //   (/ROCKNIX) or upstream's (/GAMES) with saves in it and no current one.
5287: //   One question, MOVE first (D-CLOUD-160): MOVE runs the move on its own
5288: //   page -- copy, verify, then remove, safe to interrupt -- and goes on
5289: //   when it is dismissed; KEEP USING records the folder as kept, so the
5290: //   question is not asked again for it; NOT NOW asks again next time.
5291: // - superseded-empty, or the current folder absent on a restore: the
5292: //   offer CREATE IT / CHOOSE A FOLDER / NOT NOW (D-CLOUD-161). CREATE IT
5293: //   re-points a carried setting at the current layout and seeds the three
5294: //   folders, then goes on; CHOOSE A FOLDER is the CLOUD FOLDER keyboard,
5295: //   then the same.
5296: // - anything else (current, kept, the player's own): straight on.
5297: //
5298: // Where they are raised decides what is asked and what follows each
5299: // answer (CloudFolderAsk): the transfer pages, where a backup asks nothing
5300: // about an absent current folder since the backup makes it; the cloud
5301: // folder step at the end of cloud setup, where the seeding settles an
5302: // empty folder by itself (D-CLOUD-169) and only the move is asked; and the
5303: // same step at boot (D-CLOUD-170, fork #363).
5304: struct CloudFolderAsk
5305: {
5306: 	bool createEmpty = true;        // superseded-empty: CREATE IT / CHOOSE A FOLDER / NOT NOW
5307: 	bool createCurrent = false;     // the current folder absent: the same offer (a restore's)
5308: 	std::function<void()> then;     // nothing to settle, KEEP USING, NOT NOW
5309: 	std::function<void()> rescan;   // after a move, a creation or a folder chosen
5310: 	std::function<void()> abandon;  // a page it opened was closed without completing; empty: back where it was
5311: };
5312:
5313: static void cloudOpenTransfer(Window* window, bool backup);
5314: static void cloudOfferFolder(Window* window, const CloudFolderAsk& ask)
5315: {
5316: 	const std::function<void()> then = ask.then ? ask.then : [] {};
5317: 	const std::function<void()> rescan = ask.rescan ? ask.rescan : then;
5318: 	const std::function<void()> abandon = ask.abandon;
5319: 	const auto st = cloudScanFacts("state");
5320: 	const std::string state = cloudScanFact(st, "STATE");
5321: 	const std::string current = cloudScanFact(st, "CURRENT").empty() ? "/Rasteratops/Saves" : cloudScanFact(st, "CURRENT");
5322: 	const std::string newRoot = cloudRootOf(current);
5323: 	if (state == "superseded-with-files")
5324: 	{
5325: 		const std::string source = cloudScanFact(st, "SOURCE") == "-" || cloudScanFact(st, "SOURCE").empty()
5326: 			? cloudScanFact(st, "SAVES") : cloudScanFact(st, "SOURCE");
5327: 		const std::string oldRoot = cloudRootOf(source);
5328: 		LOG(LogInfo) << "cloud folder: " << oldRoot << " holds saves and " << newRoot << " does not exist; offering the move";
5329: 		window->pushGui(new GuiMsgBox(window,
5330: 			Utils::String::format(_("YOUR CLOUD HAS A %s FOLDER FROM AN EARLIER VERSION.\n\nMOVE IT TO %s? YOUR OTHER DEVICES WILL FOLLOW.").c_str(),
5331: 				oldRoot.c_str(), newRoot.c_str()),
5332: 			_("MOVE"), [window, oldRoot, newRoot, rescan, abandon]
5333: 			{
5334: 				LOG(LogInfo) << "cloud folder: moving " << oldRoot << " to " << newRoot;
5335: 				auto page = new GuiCloudTransfer(window, "/usr/bin/cloud_migrate_layout --apply", _("MOVING YOUR CLOUD FOLDER"));
5336: 				page->setFailedNote(Utils::String::format(_("YOUR CLOUD STILL HAS %s. NOTHING WAS REMOVED.").c_str(), oldRoot.c_str()));
5337: 				// One short sentence: the longer one, naming the three tiers,
5338: 				// was cut at 640 px (guest d, 2026-10-01).
5339: 				page->setCompletedAction(rescan, _("CONTINUE"), _("PRESS ANY BUTTON TO CONTINUE"),
5340: 					Utils::String::format(_("YOUR CLOUD FOLDER IS NOW %s.").c_str(), newRoot.c_str()), true);
5341: 				if (abandon)
5342: 					page->setDismissedAction(abandon);
5343: 				window->pushGui(page);
5344: 			},
5345: 			Utils::String::format(_("KEEP USING %s").c_str(), oldRoot.c_str()), [window, oldRoot, then]
5346: 			{
5347: 				LOG(LogInfo) << "cloud folder: keeping " << oldRoot;
5348: 				window->pushGui(new GuiLoading<int>(window, _("WORKING..."),
5349: 					[](IGuiLoadingHandler*) -> int
5350: 					{
5351: 						// The pair form, for the exit code (the list form throws it away).
5352: 						return ApiSystem::executeScriptLegacy("timeout 30 /usr/bin/cloud_migrate_layout --keep",
5353: 							[](const std::string&) {}).second;
5354: 					},
5355: 					[then](int rc)
5356: 					{
5357: 						if (rc != 0)
5358: 							LOG(LogWarning) << "cloud folder: --keep exited " << rc << "; the question will be asked again";
5359: 						then();
5360: 					}));
5361: 			},
5362: 			_("NOT NOW"), then));
5363: 		return;
5364: 	}
5365: 	const bool absent = (state == "superseded-empty" && ask.createEmpty)
5366: 		|| (state == "current" && cloudScanFact(st, "CURRENT_EXISTS") == "0" && ask.createCurrent);
5367: 	if (!absent)
5368: 	{
5369: 		then();
5370: 		return;
5371: 	}
5372: 	const std::string saves = cloudScanFact(st, "SAVES").empty() ? current : cloudScanFact(st, "SAVES");
5373: 	LOG(LogInfo) << "cloud folder: no " << newRoot << " in the cloud (state " << state << "); offering to create it";
5374: 	window->pushGui(new GuiMsgBox(window,
5375: 		Utils::String::format(_("YOUR CLOUD HAS NO %s FOLDER YET.\n\nCREATE IT, WITH FOLDERS FOR SAVES, SETTINGS BACKUPS, AND GAME CONTENT?").c_str(), newRoot.c_str()),
5376: 		_("CREATE IT"), [window, newRoot, rescan, abandon]
5377: 		{
5378: 			// The re-point first (a carried /GAMES reads as no folder at all,
5379: 			// D-CLOUD-161; 3 is "already on the current layout"), then the
5380: 			// setup step's own seeding, with a folder and a README each.
5381: 			LOG(LogInfo) << "cloud folder: creating " << newRoot;
5382: 			auto page = new GuiCloudTransfer(window,
5383: 				"echo '>>> unit CLOUD FOLDER||'; /usr/bin/cloud_migrate_layout --apply; r=$?; [ \"$r\" = 0 ] || [ \"$r\" = 3 ] || exit \"$r\"; /usr/bin/cloud_setup --seed-folders",
5384: 				_("CREATING YOUR CLOUD FOLDER"), 1);
5385: 			page->setAutoContinue(rescan);
5386: 			if (abandon)
5387: 				page->setDismissedAction(abandon);
5388: 			window->pushGui(page);
5389: 		},
5390: 		_("CHOOSE A FOLDER"), [window, saves, rescan]
5391: 		{
5392: 			cloudSetupOpenSyncPathEditor(window, saves, rescan);
5393: 		},
5394: 		_("NOT NOW"), then));
5395: }
5396:
5397: // BACK UP TO THE CLOUD and RESTORE FROM THE CLOUD open on the scan page
5398: // (D-CLOUD-156, #350; the maintainer, 2026-09-30: "the scanning the cloud
5399: // step should come first, and that way we can only offer options that we
5400: // can actually support"): cloud_scan reads the folder's state, the
5401: // settings archives and where the content is, on a page of its own, and
5402: // a completed scan goes straight to the folder dialogs it may need and
5403: // then the options page, which is built from what it wrote. A scan that
5404: // did not complete stays with its why and TRY AGAIN beside CLOSE. No
5405: // cloud storage set up asks SET IT UP NOW? here, before any page; scripts
5406: // older than cloud_scan open the options page as they always did.
5407: static void cloudOpenTransfer(Window* window, bool backup)
5408: {
5409: 	if (!Utils::FileSystem::exists("/storage/.config/rclone/rclone.conf", false))
5410: 	{
5411: 		window->pushGui(new GuiMsgBox(window, _("NO CLOUD STORAGE IS SET UP ON THIS DEVICE YET.\n\nSET IT UP NOW?"), _("YES"),
5412: 			[window] { GuiMenu::openCloudAddRemote(window); }, _("NO"), nullptr));
5413: 		return;
5414: 	}
5415: 	if (!Utils::FileSystem::exists("/usr/bin/cloud_scan"))
5416: 	{
5417: 		cloudOpenTransferOptions(window, backup);
5418: 		return;
5419: 	}
5420: 	auto page = new GuiCloudTransfer(window, "/usr/bin/cloud_scan", _("CHECKING YOUR CLOUD"), 3);
5421: 	page->setAutoContinue([window, backup]
5422: 	{
5423: 		CloudFolderAsk ask;
5424: 		ask.createCurrent = !backup;
5425: 		ask.then = [window, backup] { cloudOpenTransferOptions(window, backup); };
5426: 		ask.rescan = [window, backup] { cloudOpenTransfer(window, backup); };
5427: 		cloudOfferFolder(window, ask);
5428: 	});
5429: 	window->pushGui(page);
5430: }
5431:
5432: // The cloud folder step (D-CLOUD-170, fork #363). The folder is settled
5433: // where the player first meets the cloud, not before every sync: at the
5434: // end of cloud setup, right after a remote is linked, and at the first
```
```
5450: // page, leaving the folder to the next boot.
5451: enum class CloudFolderPlace { Setup, Boot };
5452:
5453: static void cloudFolderStepAgain(Window* window);
5454:
5455: static void cloudFolderStep(Window* window, CloudFolderPlace place, const std::function<void()>& done)
5456: {
5457: 	const std::function<void()> finish = done ? done : [] {};
5458: 	if (!Utils::FileSystem::exists("/usr/bin/cloud_scan"))
5459: 	{
5460: 		finish();
5461: 		return;
5462: 	}
5463: 	CloudFolderAsk ask;
5464: 	ask.then = finish;
5465: 	if (place == CloudFolderPlace::Setup)
5466: 	{
5467: 		// The seeding that follows makes the folders on a cloud that has
5468: 		// none, and points a carried, empty /GAMES at them (D-CLOUD-169):
5469: 		// only the move is asked here, and every way out goes on to it.
5470: 		ask.createEmpty = false;
5471: 		ask.rescan = finish;
5472: 		ask.abandon = finish;
5473: 	}
5474: 	else
5475: 		ask.rescan = [window] { cloudFolderStepAgain(window); };
5476: 	LOG(LogInfo) << "cloud folder step: checking the folder (" << (place == CloudFolderPlace::Setup ? "end of cloud setup" : "boot") << ")";
5477: 	auto page = new GuiCloudTransfer(window, "/usr/bin/cloud_scan --folder", _("CHECKING YOUR CLOUD"), 1);
5478: 	page->setAutoContinue([window, ask] { cloudOfferFolder(window, ask); });
5479: 	if (ask.abandon)
5480: 		page->setDismissedAction(ask.abandon);
5481: 	window->pushGui(page);
5482: }
5483:
5484: // Whether this device has a folder to settle: an earlier version's
5485: // default, not kept, with a remote set up. No network (--needs-step reads
5486: // the conf), so it may be asked on the interface thread after a press.
5487: static bool cloudFolderStepNeeded()
5488: {
5489: 	if (!Utils::FileSystem::exists("/usr/bin/cloud_migrate_layout")
5490: 		|| !Utils::FileSystem::exists("/usr/bin/cloud_scan")
5491: 		|| !Utils::FileSystem::exists("/storage/.config/rclone/rclone.conf", false))
5492: 		return false;
5493: 	return ApiSystem::executeScriptLegacy("timeout 10 /usr/bin/cloud_migrate_layout --needs-step",
5494: 		[](const std::string&) {}).second == 0;
5495: }
5496:
5497: // Online as the scan means it: a default route (cloud_scan's own first
5498: // test, and cloud_net_ready's), so the step and its scan never disagree
5499: // about whether this device is offline. A few milliseconds.
5500: static bool cloudLinkUp()
5501: {
5502: 	return ApiSystem::executeScriptLegacy("ip route show default 2>/dev/null | grep -q .",
5503: 		[](const std::string&) {}).second == 0;
5504: }
5505:
5506: // The boot place's step, once nothing else is open: the scan when there
5507: // is a link, else the question that offers one.
5508: static void cloudFolderStepAtBoot(Window* window)
5509: {
5510: 	if (cloudLinkUp())
5511: 	{
5512: 		cloudFolderStep(window, CloudFolderPlace::Boot, nullptr);
5513: 		return;
5514: 	}
5515: 	LOG(LogInfo) << "cloud folder step: a folder to settle and no network; asking to connect";
5516: 	window->pushGui(new GuiMsgBox(window,
5517: 		_("FINISH CLOUD SETUP") + "\n\n" + _("YOU'RE NOT ONLINE. CONNECT TO FINISH SETTING UP YOUR CLOUD FOLDER."),
5518: 		_("CONNECT TO WI-FI"), [window]
5519: 		{
5520: 			window->pushGui(new GuiWifi(window, _("WI-FI NETWORKS"), [window] { cloudFolderStepAgain(window); }));
5521: 		},
5522: 		_("NOT NOW"), [] { LOG(LogInfo) << "cloud folder step: NOT NOW; asked again at the next boot"; }));
5523: }
5524:
5525: // After a move, a creation, a folder chosen or a network joined: settled,
5526: // or the step once more.
5527: static void cloudFolderStepAgain(Window* window)
5528: {
5529: 	if (!cloudFolderStepNeeded())
5530: 	{
5531: 		LOG(LogInfo) << "cloud folder step: settled";
5532: 		return;
5533: 	}
5534: 	cloudFolderStepAtBoot(window);
5535: }
5536:
5537: // Once per boot, whichever way it is armed: at boot, or by FINISH on
5538: // FINISH RESTORE PROCESS. Set on the interface thread; a waiter reads it
5539: // to stop early.
5540: static std::atomic<bool> sCloudFolderStepOffered(false);
5541:
5542: // Up only over the carousel or a game list with nothing on it: not over a
5543: // menu the player opened while the startup sync ran, not while a game
5544: // runs, and not beside a sync or a transfer.
5545: static bool cloudFolderStepIfQuiet(Window* window)
5546: {
5547: 	if (sCloudFolderStepOffered)
5548: 		return true;
5549: 	if (window->peekGui() != ViewController::get() || FileData::GetRunningGame() != nullptr
5550: 		|| ThreadedCloudSync::isRunning() || CloudTransferJob::running())
5551: 		return false;
5552: 	sCloudFolderStepOffered = true;
5553: 	cloudFolderStepAtBoot(window);
5554: 	return true;
5555: }
5556:
5557: void GuiMenu::armCloudFolderStep(Window* window)
5558: {
5559: 	if (sCloudFolderStepOffered || !UIModeController::getInstance()->isUIModeFull()
5560: 		|| !Utils::FileSystem::exists("/usr/bin/cloud_migrate_layout")
5561: 		|| !Utils::FileSystem::exists("/usr/bin/cloud_scan")
5562: 		|| !Utils::FileSystem::exists("/storage/.config/rclone/rclone.conf", false))
5563: 		return;
5564: 	std::thread([window]
5565: 	{
5566: 		// The question first, off the interface thread: a bash and two awks,
5567: 		// tens of milliseconds on an A53, kept off the boot. Almost every
5568: 		// device answers no here, and nothing else runs.
5569: 		const int rc = ApiSystem::executeScriptLegacy("timeout 10 /usr/bin/cloud_migrate_layout --needs-step",
5570: 			[](const std::string&) {}).second;
5571: 		if (rc != 0)
5572: 		{
5573: 			LOG(LogInfo) << "cloud folder step: nothing to settle (--needs-step " << rc << ")";
5574: 			return;
5575: 		}
5576: 		// The startup sync first: its card is the screen's until it ends,
5577: 		// and a move takes the lock it holds -- a move asked for beside it
5578: 		// was refused as A SYNC IS ALREADY RUNNING.
5579: 		while (ThreadedCloudSync::isRunning() && !sCloudFolderStepOffered)
5580: 			std::this_thread::sleep_for(std::chrono::milliseconds(500));
5581: 		// A link still coming up is given its time (bounded; no route and
5582: 		// nothing coming up answers at once), so a device whose Wi-Fi joins
5583: 		// a few seconds after the interface is not told it is offline.
5584: 		ApiSystem::executeScriptLegacy("[ -x /usr/bin/cloud_net_ready ] && timeout 40 /usr/bin/cloud_net_ready --wait 30",
5585: 			[](const std::string&) {});
5586: 		// Then once a second until the screen is free, one post at a time;
5587: 		// the window going away (AppWindow::closing) ends it.
5588: 		auto state = std::make_shared<std::atomic<int>>(0);   // 0 waiting, 1 asked, 2 shown
5589: 		for (;;)
5590: 		{
5591: 			const int now = state->load();
5592: 			if (now == 2)
5593: 				return;
5594: 			if (now == 0)
5595: 			{
5596: 				state->store(1);
5597: 				if (!AppWindow::post(window, [window, state] { state->store(cloudFolderStepIfQuiet(window) ? 2 : 0); }))
5598: 					return;
5599: 			}
5600: 			std::this_thread::sleep_for(std::chrono::seconds(1));
5601: 		}
5602: 	}).detach();
5603: }
5604:
5605: // Step three: make this device match the cloud.
```
```
6575: 	// occasional things.
6576: 	if (Utils::FileSystem::exists("/usr/bin/cloud_backup") && Utils::FileSystem::exists("/usr/bin/cloud_restore"))
6577: 	{
6578: 		const bool cloudConfigured = Utils::FileSystem::exists("/storage/.config/rclone/rclone.conf", false);
6579: 		s->addGroup(_("CLOUD SETTINGS"));
6580:
6581: 		// The line under it is how it last went (last-sync-manual, D-UI-023),
6582: 		// like the two rows below; "both ways, nothing is deleted" is the
6583: 		// dialog's to say. Each half reports itself to the card as it ends
6584: 		// (">>> tier <label>|<rc>"), so a restore that finished under a
6585: 		// backup that did not is reported with that part's why rather than as the
6586: 		// whole run failed (D-UI-028); the backup still waits on the restore.
6587: 		cloudAddGatedEntry(s, window, cloudConfigured, _("SYNC SAVES WITH THE CLOUD"),
6588: 			cloudLastRunDetail("sync-manual"), [window] {
6589: 			window->pushGui(new GuiMsgBox(window, _("SYNC GAME SAVES BOTH WAYS?\n\nTHE NEWEST COPY OF EACH SAVE IS KEPT ON BOTH SIDES. NOTHING IS DELETED.") + cloudLastRunWhy("sync-manual"), _("YES"),
6590: 				[window] {
6591: 				ThreadedCloudSync::start(window,
6592: 					"/usr/bin/cloud_restore --yes --method=copy --update --saves-only; _r=$?; echo \">>> tier RESTORING SAVES|$_r\"; [ \"$_r\" = 0 ] || exit \"$_r\";"
6593: 					" /usr/bin/cloud_backup --yes --method=copy --update --saves-only; _b=$?; echo \">>> tier BACKING UP SAVES|$_b\"; exit \"$_b\"",
6594: 					_("SYNC SAVES"), _("SYNCING SAVES"), ThreadedCloudSync::Origin::Manual);
6595: 				}, _("NO"), nullptr));
6596: 		});
6597: 		cloudAddClassRow(s, window, cloudConfigured, _("BACK UP SAVES TO THE CLOUD"), "backup", [window] {
6598: 			window->pushGui(new GuiMsgBox(window, _("BACK UP GAME SAVES, SAVE STATES, AND SCREENSHOTS TO THE CLOUD?") + cloudLastRunWhy("backup"), _("YES"),
6599: 				[window] { ThreadedCloudSync::start(window, "/usr/bin/cloud_backup --yes --saves-only", _("BACK UP SAVES"), _("BACKING UP SAVES"), ThreadedCloudSync::Origin::Manual); },
6600: 				_("NO"), nullptr));
6601: 		});
6602: 		cloudAddClassRow(s, window, cloudConfigured, _("RESTORE SAVES FROM THE CLOUD"), "restore", [window] {
6603: 			window->pushGui(new GuiMsgBox(window, _("RESTORE GAME SAVES, SAVE STATES, AND SCREENSHOTS FROM THE CLOUD?") + cloudLastRunWhy("restore"), _("YES"),
6604: 				[window] { ThreadedCloudSync::start(window, "/usr/bin/cloud_restore --yes --saves-only", _("RESTORE SAVES"), _("RESTORING SAVES"), ThreadedCloudSync::Origin::Manual); },
6605: 				_("NO"), nullptr));
6606: 		});
6607:
6608: 		s->addWithDescription(_("MANAGE CLOUD STORAGE"),
6609: 			_("BACKUP AND RESTORE, SAVE MANAGEMENT, CLOUD STORAGE SETUP."), nullptr,
6610: 			[window] { GuiMenu::openCloud(window); }, "", false, true);
```
```
7410: static void cloudSetupShowDoneStep(Window* window, const std::string& remote, GuiSettings* prev, bool folderStep)
7411: {
7412: 	auto seed = [window, remote, prev]
7413: 	{
7414: 		window->pushGui(new GuiLoading<std::vector<std::string>>(window, _("SETTING UP YOUR CLOUD FOLDERS"),
7415: 			[](IGuiLoadingHandler*)
7416: 			{
7417: 				return ApiSystem::executeScriptLegacy("timeout 90 /usr/bin/cloud_setup --seed-folders");
7418: 			},
7419: 			[window, remote, prev](std::vector<std::string> seeded)
7420: 			{
7421: 				cloudSetupBuildDoneStep(window, remote, prev, seeded);
7422: 			}));
7423: 	};
7424: 	if (folderStep)
7425: 		cloudFolderStep(window, CloudFolderPlace::Setup, seed);
7426: 	else
7427: 		seed();
7428: }
7429:
7430: // Wizard entry point: network is a hard precondition; then branch on the
```

## /home/max/Development/emulationstation-next.worktrees/cloud-epic/es-app/src/main.cpp
```
663: 	const std::string command =
664: 		"if [ -x /usr/bin/cloud_net_ready ]; then"
665: 		" /usr/bin/cloud_net_ready --wait 60; _w=$?; [ \"$_w\" = 0 ] || exit \"$_w\";"
666: 		" else"
667: 		" if ! ip -4 route show default 2>/dev/null | grep -q ."
668: 		" && ! ip -6 route show default 2>/dev/null | grep -q .; then exit " + noNetwork + "; fi;"
669: 		" _t0=$(date +%s); _up=0; _n=0;"
670: 		" while :; do"
671: 		" timeout 4 ping -q -c1 -W2 google.com >/dev/null 2>&1 && _up=1 && break;"
672: 		" _n=$((_n+1)); [ \"$_n\" = 1 ] && echo \">>> doing network\";"
673: 		" [ $(( $(date +%s) - _t0 )) -lt 60 ] || break;"
674: 		" sleep 2;"
675: 		" done;"
676: 		" [ \"$_up\" = 1 ] || exit " + noNetwork + ";"
677: 		" fi;"
678: 		" echo \">>> doing receive\";"
679: 		" /usr/bin/cloud_restore --yes --method=copy --update --saves-only --automatic; _r=$?;"
680: 		" echo \">>> tier RESTORING SAVES|$_r\";"
681: 		" echo \">>> doing send\";"
682: 		" /usr/bin/cloud_backup --yes --method=copy --update --saves-only --automatic; _b=$?;"
683: 		" echo \">>> tier BACKING UP SAVES|$_b\";"
684: 		" [ \"$_r\" != 0 ] && exit \"$_r\"; exit \"$_b\"";
685:
```
```
1105: 	// screen before the theme it is styled by had loaded.
1106: 	//
1107: 	// Not after a one-touch restore. The journey prompt above offers
1108: 	// `cloud_content_restore --all && cloud_restore --yes` on this same
1109: 	// boot, and both take the sync lock: a startup sync already holding it
1110: 	// would turn the player's YES into "Another cloud sync is already
1111: 	// running. Skipped." in a console. That restore brings the saves down
1112: 	// anyway, so nothing is lost by sitting this boot out.
1113: 	if (sStartupCaptureFailed)
1114: 		window.displayNotificationMessage(_U("\uF0C2  ") + _("COULDN'T RECORD THIS SESSION'S SAVES. THEY'RE STILL ON THIS DEVICE."));
1115: 	if (!journeyPending)
1116: 		startStartupSavesSync(&window);
1117:
1118: 	// The cloud folder step at boot (D-CLOUD-170, fork #363): a device
1119: 	// linked to a folder an earlier version made its default is asked about
1120: 	// it once the startup sync has ended, at every boot until it is settled.
1121: 	// Not beside the restore's own page, whose FINISH goes on to it (one
1122: 	// setup page at a time), and not on the one-touch restore's boot.
1123: 	if (!journeyPending && !Utils::FileSystem::exists("/storage/.config/.restore-finish-pending", false))
1124: 		GuiMenu::armCloudFolderStep(&window);
1125:
```

## /home/max/Development/emulationstation-next.worktrees/cloud-epic/es-app/src/ThreadedCloudSync.cpp
```
486: 	// raise that question -- the maintainer met it at startup on the Nova,
487: 	// 2026-10-01, and the folder is the cloud setup's and the transfer
488: 	// pages' to ask about (D-CLOUD-166, fork #353) -- it says SKIPPED with
489: 	// the row that sets it up, and stamps CloudExit::NoFolder so the row
490: 	// under SYNC SAVES DURING STARTUP says the same. A sync the player
491: 	// pressed keeps the question: they are standing there.
492: 	const bool noFolder = !cancelled && (ret == 0 || ret == 9) && mOffer == "create-saves-folder"
493: 		&& (mOrigin == Origin::Startup || mOrigin == Origin::Exit);
494: 	const bool completed = !cancelled && (ret == 0 || ret == 9) && !noFolder;
495: 	const bool gaps = !cancelled && !completed && !okTiers.empty() && !badTiers.empty();
496: 	// In the player's language: the scripts speak English whatever the
497: 	// interface does (#308 F-CS-31). The stamp below keeps mWhy as printed.
498: 	const std::string why = mWhy.empty() ? whyForCode(ret) : CloudText::localizedWhy(mWhy);
499:
500: 	// A 69 is not always a skip (the audit of the fix round, stream A's
501: 	// lead G2-A-03 claude). The scripts exit 69 whenever the network is the
502: 	// reason -- the retry at the link's return and the offline recovery line
503: 	// read the code -- and when files had moved before the link went, the
504: 	// script's own stamp adds the gaps token and its why ("69 gaps YOU WENT
505: 	// OFFLINE PART-WAY THROUGH"), which the rows and the transfer page read
506: 	// as COULDN'T FINISH. This card read the 69 alone and said SKIPPED -
507: 	// YOU'RE NOT ONLINE, which says nothing moved. A bare 69 is still that.
508: 	std::string offlineWhy;
509: 	if (!cancelled && !gaps && ret == CloudExit::NoNetwork)
510: 		offlineWhy = CloudText::offlinePartWayWhy(readStamps(mCommand), mStampsBefore);
511: 	const bool offlineGaps = !offlineWhy.empty();
512:
513: 	std::string outcome, token;
514: 	if (cancelled)
515: 	{
516: 		outcome = _("SKIPPED - YOU STARTED A GAME");
517: 		token = "cancelled";
518: 	}
519: 	else if (completed)
520: 	{
521: 		outcome = _("COMPLETED");
522: 		token = "completed";
523: 	}
524: 	else if (noFolder)
525: 	{
526: 		outcome = _("SKIPPED - YOUR CLOUD FOLDER ISN'T SET UP YET");
527: 		token = "no-folder";
528: 	}
529: 	else if (gaps)
530: 	{
```
```
710:
711: 	// Nothing is running any more, so stop claiming otherwise: somebody who
712: 	// wants to start another sync while the card is still up should not be
713: 	// told one is already going. Under the lock, so a cancelForLaunch that
714: 	// has just taken the pointer finishes with it before it goes -- and the
715: 	// delete below is a linger later. Whether or not there was a card: this
716: 	// used to happen only inside the card's branch, leaving a run with no
717: 	// card to the destructor's unlocked clear (#308 F-CS-25).
718: 	{
719: 		std::lock_guard<std::mutex> lock(sInstanceLock);
720: 		if (ThreadedCloudSync::mInstance == this)
721: 			ThreadedCloudSync::mInstance = nullptr;
722: 	}
723:
724: 	if (mWndNotification != nullptr)
725: 	{
726: 		// Hold the outcome long enough to read, then let the card fade.
727: 		// Success is one word and a full bar, and somebody who just exited
728: 		// a game is standing there watching it, so a second and a half (two
729: 		// lingered -- maintainer, 2026-09-07); anything else is two lines to
730: 		// act on, so five. Five for everything dated from when a sync took
731: 		// 18 seconds -- once the exit sync came down to about five, the card
732: 		// spent as long saying it was done as it had spent working.
733: 		std::this_thread::sleep_for(std::chrono::milliseconds(lingerShort ? 1500 : 5000));
734: 	}
735:
736: 	// A question the run asked us to put to the player, once its card has
737: 	// had its say -- and only when the run completed: an offer to create a
738: 	// folder on top of a failure is one thing too many to read at once. The
739: 	// dialog itself is CloudOffer's, shared with the transfer page, so the
740: 	// two surfaces that run these scripts cannot ask it in different words
741: 	// (#145). It pushes on the interface thread itself.
742: 	if (completed)
743: 		CloudOffer::present(mWindow, mOffer, mOfferArgs);
744:
745: 	// The offline achievements' send card follows an automatic sync's
746: 	// (fork #292, D-RA-030): the proxy sends the moment RetroAchievements
```

## tools/cloud-test-backend
```
799:   saves-remote)
800:     # What SAVES_REMOTE must be for this endpoint. On a path-based backend it is
801:     # just a folder. On a bucket- or share-based one the first component is the
802:     # bucket or share, and it has to be a legal name - lowercase, 3-63 chars for
803:     # S3 - so the shipped "/GAMES" is rejected outright (issue #38). rclone will
804:     # create the bucket itself once the name is valid. On SFTP every path is
805:     # absolute, because an sshd running as an ordinary user cannot chroot.
806:     echo "$("$0" --backend "${BACKEND}" endpoint-prefix)/GAMES"
807:     ;;
808:
```

## tools/last-good-scripts-test
```
8930: sa_run "${MG}" cloud_migrate_layout --check
8931: grep -qx '>>> plan none /Rasteratops' "${MG}/out" && [ "${RC}" -eq 0 ]; check $? "and with nothing stored there the plan is none: a setting alone would change, and the row stays away (rc ${RC})" "rc ${RC}; out: $(sa_tail "${MG}" 8)"
8932:
8933: # And the fixtures that stand in for a cloud take the folder names from the
8934: # shipped defaults (cloud-test-backend shipped-default), never from a literal
8935: # that goes stale when the default moves (blindspot 71): a superseded default
8936: # name may appear in these tools only in a comment or a quoted history.
8937: stale=$(grep -nE '(ROCKNIX|GAMES)/(Saves|Backups|Content)' tools/vm-qa tools/cloud-test-backend tools/cloud-round-trip tools/vm-upgrade-rehearsal tools/time-to-play tools/cloud-pair-migration 2>/dev/null | grep -vE '^[^:]+:[0-9]+:\s*#' | grep -vE "^[^:]+:[0-9]+:\s*(\"\"\"|'|#|.*# )" || true)
8938: [ -z "${stale}" ]; check $? "no QA tool seeds a superseded default by its literal name (ROCKNIX/..., GAMES/...)" "literals: $(echo "${stale}" | head -3 | tr '\n' '|' | cut -c1-240)"
8939: [ "$(tools/cloud-test-backend shipped-default SAVES_REMOTE 2>/dev/null)" = "/Rasteratops/Saves" ] && [ "$(tools/cloud-test-backend shipped-default CONTENT_REMOTE 2>/dev/null)" = "/Rasteratops/Content" ] && ! tools/cloud-test-backend shipped-default NO_SUCH_KEY >/dev/null 2>&1; check $? "cloud-test-backend shipped-default reads the saves and content folders out of cloud_sync.conf.defaults, and exits non-zero for a key with no default" "SAVES '$(tools/cloud-test-backend shipped-default SAVES_REMOTE 2>&1)', CONTENT '$(tools/cloud-test-backend shipped-default CONTENT_REMOTE 2>&1)'"
8940:
8941: # PL-026 (F-CS-09 gpt): killed between the two moves, the next run finishes.
8942: mg_seed
```
```
13385: # And no sync pays for the folder question any more: the check before every backup and restore
13386: # (D-CLOUD-160's follow, 147 ms on the current folder and 419 ms in transition) is the step's.
13387: for lyf in cloud_backup cloud_restore; do
13388:     src_of "projects/ROCKNIX/packages/network/rclone/sources/${lyf}" "${LY}/${lyf}"
13389:     # The follow and the layout's other network verbs; the --superseded list (a string test, no network)
13390:     # is the one verb the backup may ask for (D-CLOUD-172).
13391:     lyhit=$(grep -nE '^[^#]*(follow_layout|--(follow|join|settle|apply|state)\b)' "${LY}/${lyf}" || true)
13392:     [ -z "${lyhit}" ]; check $? "${lyf} runs no folder check before its sync (D-CLOUD-170)" "${lyf}: $(echo "${lyhit}" | head -3 | tr '\n' '|' | cut -c1-200)"
13393: done
13394:
13395:
13396: echo "  ab. cloud_scan (#350, D-CLOUD-156): the opening scan's three items, the content scan's one, the quiet follow, the facts written, the failures said"
```

## tools/cloud-pair-migration
```
190: [ -n "$SUM_B" ] && [ "$(on a 'sha256sum /storage/roms/nes/FromB.srm 2>/dev/null | cut -c1-64')" = "$SUM_B" ]; check $? "5: a's restore brought b's save, byte for byte"
191:
192: say "5m. a device that missed its step: b's pointers set back by hand (staged); its backup re-makes nothing; its step follows"
193: read -r E_SAVES E_BACKUPS E_CONTENT <<< "$A_PTRS0"
194: set_early() { on b "sed -i -e 's|^SAVES_REMOTE=.*|SAVES_REMOTE=\"$E_SAVES\"|' -e 's|^SETTINGS_REMOTE=.*|SETTINGS_REMOTE=\"$E_BACKUPS\"|' -e 's|^CONTENT_REMOTE=.*|CONTENT_REMOTE=\"$E_CONTENT\"|' /storage/.config/cloud_sync.conf" >>"$LOG" 2>&1; }
195: set_early
196: [ "$(ptrs b)" = "$A_PTRS0" ]; check $? "5m: (staged) b's pointers are back on ${EARLY_ROOT}, as on a device that never ran its step" "$(ptrs b)"
197: on b 'head -c 2000 /dev/urandom > /storage/roms/nes/FromB2.srm; /usr/bin/cloud_backup --yes --method=copy --update --saves-only > /tmp/pair-5m.out 2>&1; echo "backup rc=$?"' 2>&1 | tee -a "$LOG" > "$OUT/5m-rc.txt"
198: SUM_B2=$(on b 'sha256sum /storage/roms/nes/FromB2.srm | cut -c1-64')
199: grep -qx 'backup rc=0' "$OUT/5m-rc.txt" && [ -z "$(cloud_files "${EARLY_SAVES#/}")" ] && on b "grep -qx '>>> offer create-saves-folder|${EARLY_SAVES}' /tmp/pair-5m.out"; check $? "5m: its backup made no ${EARLY_SAVES} again, sent nothing and offered the folder (D-CLOUD-172)" "$(cat "$OUT/5m-rc.txt"); ${EARLY_SAVES}: $(cloud_files "${EARLY_SAVES#/}")"
200: on b '/usr/bin/cloud_scan --folder >/dev/null 2>&1; echo "folder scan rc=$?"' 2>&1 | tee -a "$LOG"
201: [ "$(ptrs b)" = "$CUR_SAVES $CUR_BACKUPS $CUR_CONTENT" ] && on b 'grep -qx "STATE=current" /storage/.cache/cloud_sync/scan/state'; check $? "5m: its step's scan followed the fleet with no question" "$(ptrs b)"
202: on b '/usr/bin/cloud_backup --yes --method=copy --update --saves-only >/dev/null 2>&1; echo "backup rc=$?"' 2>&1 | tee -a "$LOG"
203: [ "$("$BE" cat "${CUR_SAVES#/}/nes/FromB2.srm" 2>/dev/null | sha256sum | cut -c1-64)" = "$SUM_B2" ]; check $? "5m: and its next backup sent the save to ${CUR_SAVES}, byte for byte" "$(cloud_files "${CUR_SAVES#/}")"
204:
205: say "5n. a device on an older build that kept writing to ${EARLY_ROOT} after the move (stood in: a save put there directly); its step's MOVE merges"
206: STAND=$(mktemp -d); mkdir -p "$STAND/nes"; head -c 1500 /dev/urandom > "$STAND/nes/FromOld.srm"; SUM_OLD=$(sha256sum "$STAND/nes/FromOld.srm" | cut -c1-64)
207: "$BE" put "$STAND" "${EARLY_SAVES#/}" >>"$LOG" 2>&1; rm -rf "$STAND"
208: cloud_files "${EARLY_SAVES#/}" | grep -q 'nes/FromOld.srm'; check $? "5n: (stood in) ${EARLY_SAVES} holds a save an older build wrote after the move" "$(cloud_files "${EARLY_SAVES#/}")"
209: set_early
210: on b '/usr/bin/cloud_scan --folder >/dev/null 2>&1; echo "folder scan rc=$?"' 2>&1 | tee -a "$LOG"
211: B_STATE=$(on b 'cat /storage/.cache/cloud_sync/scan/state 2>/dev/null' | mask | tr '\n' ' ')
212: echo "$B_STATE" | grep -q 'STATE=superseded-with-files' && echo "$B_STATE" | grep -q 'CURRENT_EXISTS=1'; check $? "5n: its step's scan reads the move with the fleet's folder already there, so the step asks MOVE" "$B_STATE"
213: on b '/usr/bin/cloud_migrate_layout --apply > /tmp/pair-merge.out 2>&1; echo "merge rc=$?"' 2>&1 | tee -a "$LOG" > "$OUT/merge-rc.txt"
214: on b 'cat /tmp/pair-merge.out' | mask | grep -E '^>>> |differ|shelv' >> "$LOG"
215: grep -qx 'merge rc=0' "$OUT/merge-rc.txt"; check $? "5n: MOVE onto the fleet's folder ends 0" "$(cat "$OUT/merge-rc.txt")"
216: CUR_LIST=$(cloud_files "${CUR_SAVES#/}")
217: echo "$CUR_LIST" | grep -q 'nes/FromOld.srm' && echo "$CUR_LIST" | grep -q 'nes/FromB2.srm' && echo "$CUR_LIST" | grep -q 'nes/FromA.srm'; check $? "5n: every save is at ${CUR_SAVES}: a's, b's, and the one the older build wrote" "$CUR_LIST"
218: [ "$("$BE" cat "${CUR_SAVES#/}/nes/FromA.srm" 2>/dev/null | sha256sum | cut -c1-64)" = "$SUM_A" ] && [ "$("$BE" cat "${CUR_SAVES#/}/nes/FromOld.srm" 2>/dev/null | sha256sum | cut -c1-64)" = "$SUM_OLD" ]; check $? "5n: a's save untouched by the merge, and the merged one byte for byte"
219: [ -z "$(cloud_files "${EARLY_SAVES#/}")" ]; check $? "5n: nothing is left under ${EARLY_SAVES}" "$(cloud_files "${EARLY_SAVES#/}")"
220: [ "$(ptrs b)" = "$CUR_SAVES $CUR_BACKUPS $CUR_CONTENT" ]; check $? "5n: and b's conf points at the current folders" "$(ptrs b)"
221:
222: say "6. both devices on the shipped folders"
223: [ "$(ptrs a)" = "$CUR_SAVES $CUR_BACKUPS $CUR_CONTENT" ] && [ "$(ptrs b)" = "$CUR_SAVES $CUR_BACKUPS $CUR_CONTENT" ]; check $? "6: both confs read ${CUR_SAVES}, ${CUR_BACKUPS} and ${CUR_CONTENT}" "a: $(ptrs a); b: $(ptrs b)"
```

## Observed command output bucket-unknown-probe.log
```
Actual:
>>> offer create-saves-folder|/ROCKNIX/Saves
exit=0
```

## Observed command output archive-identity-probe.log
```
OS_NAME=ROCKNIX MINE=2026_10_01-120000-GENERIC-X64-ROCKNIX_SETTINGS.tar.gz
OS_NAME=RASTERATOPS MINE=<empty>
exit=0
```

## Observed command output pair-rerun.log
```
=== 06:06:06 backend: not running
=== 06:06:08 pair up from ROCKNIX-GENERIC_X64.x86_64-20260929.img.gz, then b rebuilt from ROCKNIX-GENERIC_X64.x86_64-20261002.img.gz
=== 06:07:16 a on 69e6039f8f (previous), b on b2378d9c33 (new)
PASS the two guests run two different builds
=== 06:07:16 the QA remote on both; the automatic syncs off, so only the steps below write
=== 06:07:16 a's folders: /ROCKNIX/Saves /ROCKNIX/Backups /ROCKNIX/Content   b's folders: /Rasteratops/Saves /Rasteratops/Backups /Rasteratops/Content
PASS the previous build's default (/ROCKNIX/Saves) is one the new build lists as superseded -- the premise of this test
PASS the fresh install starts on the shipped folders
=== 06:07:17 1. a (previous build) backs up a save and its settings to /ROCKNIX; a ROM is put there too
saves backup rc=0
settings backup rc=0
PASS 1: a's save is in /ROCKNIX/Saves
PASS 1: a's settings backup is in /ROCKNIX/Backups
=== 06:07:22 2. b (fresh) is set up as the wizard does it: the cloud folder step's scan, NOT NOW, then --seed-folders
folder scan rc=0
PASS 2: the wizard's folder step reads the move from /ROCKNIX/Saves, not CREATE IT (D-CLOUD-170)
OK /ROCKNIX/Saves
OK /ROCKNIX/Backups
OK /ROCKNIX/Content/ROMs
OK /ROCKNIX/Content/BIOS
seed rc=0
PASS 2: the fresh install joined the folder the saves are in, with its backups and content (D-CLOUD-158)
PASS 2: nothing was made at /Rasteratops beside them
restore rc=0
PASS 2: b's restore brought a's save, byte for byte
PASS 2: and the step comes again at b's next boot (--needs-step 0)
=== 06:07:25 3. a is updated in place to ROCKNIX-GENERIC_X64.x86_64-20261002.tar
PASS 3: a runs the new build after the update
PASS 3: a's conf still names the folder it was set to (the configured root wins on update)
=== 06:08:09 4. a's scan, then MOVE
scan rc=0
PASS 4: a's scan reads the move
move rc=0
PASS 4: each unit was copied and verified before anything of it was removed
PASS 4: the saves are at /Rasteratops/Saves
PASS 4: the settings backups are at /Rasteratops/Backups
PASS 4: the ROM is at /Rasteratops/Content
PASS 4: the fleet's marker is at /Rasteratops
PASS 4: nothing is left under /ROCKNIX/Saves
PASS 4: a's conf points at the current folders
=== 06:08:13 5. b's step at its next boot follows the fleet; its new save goes up; a restores it
folder scan rc=0
PASS 5: b's step followed: its conf points at the current folders
PASS 5: and its journal says so, with no question asked (D-CLOUD-160)
PASS 5: the step's scan then reads the current folder, so it goes straight on
PASS 5: settled: no step at b's next boot (--needs-step 1)
backup rc=0
PASS 5: b's new save is at /Rasteratops/Saves
PASS 5: and nothing was written back under /ROCKNIX/Saves
restore rc=0
PASS 5: a's restore brought b's save, byte for byte
=== 06:08:17 5m. a device that missed its step: b's pointers set back by hand (staged); its backup re-makes nothing; its step follows
PASS 5m: (staged) b's pointers are back on /ROCKNIX, as on a device that never ran its step
PASS 5m: its backup made no /ROCKNIX/Saves again, sent nothing and offered the folder (D-CLOUD-172)
folder scan rc=0
PASS 5m: its step's scan followed the fleet with no question
backup rc=0
PASS 5m: and its next backup sent the save to /Rasteratops/Saves, byte for byte
=== 06:08:21 5n. a device on an older build that kept writing to /ROCKNIX after the move (stood in: a save put there directly); its step's MOVE merges
PASS 5n: (stood in) /ROCKNIX/Saves holds a save an older build wrote after the move
folder scan rc=0
PASS 5n: its step's scan reads the move with the fleet's folder already there, so the step asks MOVE
PASS 5n: MOVE onto the fleet's folder ends 0
PASS 5n: every save is at /Rasteratops/Saves: a's, b's, and the one the older build wrote
PASS 5n: a's save untouched by the merge, and the merged one byte for byte
PASS 5n: nothing is left under /ROCKNIX/Saves
PASS 5n: and b's conf points at the current folders
=== 06:08:25 6. both devices on the shipped folders
PASS 6: both confs read /Rasteratops/Saves, /Rasteratops/Backups and /Rasteratops/Content
=== 06:08:25 7. a provider error is not an absence: b against a dead endpoint
PASS 7: the scan against a cloud that refuses ends non-zero
PASS 7: and writes no state the interface could offer from
PASS 7: and nothing in b's conf moved
=== 06:08:26 RESULT PASS: 42 passed, 0 failed (log /workspace/artifacts/rocknix-images/qa-b2378d9c33-pair-migration-from-69e6039f8f-20261002-0606/pair-migration.log)
```

## Observed command output freshness.log
```
PACKAGE                    RECIPE         LATEST         VERDICT
brotli                     1.2.0          1.2.0          CURRENT
ruby                       3.3.12         3.3.12         CURRENT in series 3.3: a host-only interpreter for WebKit's generators (e7300897c1); each minor series is a separate download path at cache.ruby-lang.org (PKG_URL uses the series), so the tool follows the newest 3.3.x rather than a new series that would need the URL and libyaml re-checked
unifdef                    2.12           2.12           CURRENT
openjpeg                   2.5.4          2.5.4          CURRENT
woff2                      1.0.2          1.0.2          CURRENT
glib-networking            2.90.0         2.90.0         CURRENT
libtasn1                   4.21.0         4.21.0         CURRENT
dmidecode                  3.7                           UNKNOWN: no resolver for download.savannah.gnu.org, or it did not answer
qrencode                   4.1.1          4.1.1          CURRENT
ryzenadj                   0.19.0         0.19.0         CURRENT
libpsl                     0.23.3         0.23.3         CURRENT
libsoup                    3.6.6          3.8.0          PINNED: 3.8.0 is a new series (GNOME's 3.8, 2026-09) under the WebKitGTK the sign-in window is built on; the 3.6 series stays for 0.0.1 and moves with the next WebKitGTK bump (fork #362) (latest 3.8.0)
webkitgtk                  2.54.0         2.54.0         CURRENT
gamescope-glm              0af55ccecd98d4 119            PINNED: follows subprojects/glm.wrap at gamescope's pinned commit (bump both together) (119 behind 6f14f4792a (2026-04-07))
gamescope-stb              5736b15f7ea0ff 83             PINNED: follows subprojects/stb.wrap at gamescope's pinned commit (bump both together) (83 behind 2c980bb598 (2026-08-02))
mangohud-vulkan-headers    1.4.346        1.4.365        PINNED: follows subprojects/vulkan-headers.wrap at mangohud's pinned commit (bump both together) (latest 1.4.365)
mangohud-vulkan-utility-libraries 1.4.346        1.4.365        PINNED: follows subprojects/vulkan-utility-libraries.wrap at mangohud's pinned commit (bump both together) (latest 1.4.365)
harfbuzz-icu                                             INHERITED
gst-plugins-bad                                          INHERITED
gstreamer                                                INHERITED
cloud-signin-window                                      LOCAL
raofflineproxy-libchdr     8e7b8bd32bc676 3              PINNED: follows the third_party/libchdr submodule commit RAOfflineProxy names (fork #179) (3 behind 607694ca08 (2026-09-27))
raofflineproxy-rcheevos    1433173220a7ea 6              PINNED: follows the third_party/rcheevos submodule commit RAOfflineProxy names (fork #179) (6 behind f87c0de911 (2026-09-27))
raofflineproxy             248ce5acae7511 13             PINNED: upstream's next four commits (93f98382bc, 2026-09-30) rewrite the Linux caching model into a 100-per-30-minutes budget with a queue, and nine of the fork's sixteen patches no longer apply to them; pinned for 0.0.1 pending the maintainer's disposition on fork #361 (13 behind 8cd24578e4 (2026-10-02))
gnutls                                                   INHERITED
rclone                     1.75.1         1.75.1         CURRENT
```
