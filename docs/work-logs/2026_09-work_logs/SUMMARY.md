# September 2026: cloud sync to release candidates, and a fork of its own

Drafted 2026-10-01 from `docs/work-logs/INDEX.md` § 2026-09, the day files' headings, the one weekly summary (`2026-W39-summary.md`), `docs/decision-register.md`, `docs/blindspot-register.md`, `docs/releases/catalog.md`, `git log -- .claude/rules tools` and the fork's issues. 599 log entries over 29 days: W36 (Sep 1-6) 73, W37 (Sep 7-13) 146, W38 (Sep 14-20) 124, W39 (Sep 21-27) 175, and Sep 28-30 81. Only W39 has a weekly summary: the ceremony clock started on 09-21 (`ceremonies.md`), so the first three weeks are read here from the index and the day files rather than from weeklies.

## The arc

The month opened on the cloud-sync milestone's device rounds on the two H700 handhelds. A backup had deleted another device's saves (09-01), the migration had split the ROMs from the saves without anyone noticing (09-02), and a consolidation deleted core functionality twice (09-04, blindspot 23). The first week turned those into rules and harnesses: the vocabulary sweep (#73, D-UI-022), VM first (D-QA-007), the transfer page that reports, the council imported and run on serval, the RG SP flashed and booted (LPDDR3), and the cloud harness running for the first time (gate 0, #35, 09-06). A device was rebooted during a restore without asking (09-06), which became D-QA-008 and blindspot 29.

The second week was conflict resolution and the cloud engine's failure paths: the fixtures for #11, the exit capture (#21), the shared device id (#86, 09-08), the network going away with nothing hanging (#103, 09-10), graceful degradation and its outcome vocabulary (#105), the last-good settings record after the RG SP lost its settings to a forced power-off (#102, D-CLOUD-079), and handhelds that keep evidence across a power cycle (#104). The maintainer's own Dropbox showed the exit sync never uploading (09-10). A council run chose store-first on 09-11, the nine wizard decisions followed (one console at a time, no lock, the newer copy under the cursor; D-CLOUD-102 to 104), time to play was measured for the first time (#135, 09-12), and the QA cloud grew to five backends (#133). The milestone audit (#151) and its punch list closed the week, with the offline RetroAchievements milestone (#4) starting on RAOfflineProxy and the first SM8550 cold build (09-13).

The third week was release-candidate rounds on the RG SP, RC-3 to RC-12 builds (09-14 to 09-17): the offline achievements work through its phases (#166, #174-#181), audit #186, the save-state manager's deletion and copy (#205, #206), and the French sweep, ending on build 15 `b245fd12ac`. Then WebKitGTK 2.54 was tried four ways and 2.52.6 shipped for the round (09-20), the upgrade rehearsal became a tool, and #236 named what makes a build a candidate for the RG SP and the Nova.

The fourth week (W39, its own summary) cut and re-cut the #236 candidate twenty-two times, wrote the release-candidate procedure down after the twenty-second cut proved to be behind (D-WORKFLOW-047), and ran the device round, the offline achievements' cards and RetroArch's notifications into `7911c53bb4`. The full two-agent upstream audit (D-QA-048) began on 09-27.

The last three days finished that audit: 409 findings read to 78 punch items, eight streams on the fixes, and an audit of the fixes (#313). Chain 90's cut `8dd6765af0` became RC1, published on 09-29 with H700, SM8550 and RK3566 images, and RC2 (`69e6039f8f`) followed that evening. The Retroid Pocket Nova booted an SM8550 image from this fork for the first time (09-29). The twelve-PR upstream series opened that day was closed by the ROCKNIX developers the same evening, and the fork became rasteratops on 09-30 (D-WORKFLOW-084): version 0.0.1 from RC2's tree, its own organisation, and a plan put to the council (#338, plan #344). The month ended on the Nova's first evening on RC2, which produced #349-#353 and the cloud epic #354 for 0.0.1 (D-CLOUD-156 to 158).

## What landed

- **Cloud sync.** The transfer page and one cloud door (09-04 to 09-06); game content as its own class (#77); the exit sync from 18 seconds down to its budget (D-CLOUD-028, D-CLOUD-119); conflict resolution's store-first design and wizard decisions (D-CLOUD-101 to 104); link loss bounded (#103); the outcome vocabulary (#105, D-UI-028/030); the last-good settings record (#102, D-CLOUD-078/079); the automatic syncs asking before a launch (D-CLOUD-130); the 90-second ceiling (D-CLOUD-137); the epic for 0.0.1 decided on 09-30 (#354).
- **Offline RetroAchievements.** Milestone #4 from RAOfflineProxy's first read (09-13) to the first offline achievement read from the RG SP (09-15), the cache that follows the game index (D-RA-013), audit #186, and the send and top-up cards (W39).
- **The interface.** The tab strip as a focus stop (#65), BIOS CHECK as one list (D-UI-019), the save-state manager's tiles and deletion (#205/#206), the help bar (#210), long work on a foreground page with CANCEL (D-UI-078), captures at the system's aspect and rotation (W39), the Wi-Fi picker and forget (#318, D-UI-118), and every fork string in French (D-UI-051).
- **RetroArch.** The threaded-video wrapper bug, patched here and fixed upstream (09-08); the notification floor (W39).
- **Releases.** RC-3 to RC-12 on the RG SP (W38), the #236 candidate's twenty-two cuts (W39), RC1 (`8dd6765af0`, three device images) and RC2 (`69e6039f8f`) on 09-29. The catalog holds 92 cuts built in the month.
- **QA.** `tools/vm-qa` from five suites (09-12) to fifteen (09-25); frame-diff as a gate (D-QA-038); time to play (#135); the QA cloud's five backends (#133); the upgrade rehearsal tool (09-20); the guests on hardware GL (D-QA-052). 38 new tools were added under `tools/`.
- **Process.** Fifteen rule files were added: the council's two (09-05), `handheld-evidence` (09-10), `vm-first`, `time-to-play` (09-11), `player-language`, `least-surprise` and the three ES rules split from one (09-12, #147), `working-principles` (09-19), `change-log` (09-22), `ceremonies` (09-23), `release-candidates` and `bugs-are-agent-first` (09-25). 228 commits touched `.claude/rules/`. Checkboxes became agent-first (D-QA-044) and the ceremonies a tool (D-WORKFLOW-028).

## What was hard

Fifty blindspots were added in the month (21 to 70). They fall into a few families, each of which recurred:

- **Green over nothing.** A probe that cannot report absence (22), a new suite passing over a table of dashes (39), a suite that passed on the caller's shell (40), a log check that never asked whose log it was (50), a timing run with no cloud to reach (56), a memory pass on a page that never loaded (59), a proof's substitute passing where the real input failed (65), a page test whose stubs were kinder than a browser (69).
- **A claim taken for an observation.** A resumed session built on its own summary (30), an audit's claim about a default nobody read (35), a name read as a behaviour (46), decisions lists built from an issue's section (52), an audit headline typed rather than summed (53), a link error the source contradicted (58).
- **Proven where the device is not.** A check proven only under the host's tools (34), one backend's semantics taken for the contract (36), a size no handheld has (41), a fixture's size and speed (44, 45), a guest renderer that was not the device's (54, 63).
- **A person's device and data.** A standing authorisation stretched to actions nobody authorised (29), a category-level offer read as a yes for every action (38), "not me" read from the transcript instead of the device (42).
- **Fixed forward, left behind.** Supersession living only in a comment (27), a constraint that lived only in a commit subject (48), a checklist that inherited stale boxes (51), the writer fixed and what it wrote left (62).
- **The upstream series** was shaped by the fork's process rather than by the reviewers' capacity, and was closed by them on 09-29 (70).

## Rules and registers

- **Decisions: 503 decided rows dated in September.** CLOUD 143 (D-CLOUD-007 to 158), WORKFLOW 107 (003 to 109), UI 107 (015 to 121), QA 54 (003 to 057), RA 45 (001 to 046), NET 14 (001 to 015), INFRA 14 (001 to 014), SYS 12 (001 to 013), LAUNCH 7 (001 to 007).
- **The decisions that set the month's direction:** VM first (D-QA-007) and the per-action yes on a person's device (D-QA-008, D-QA-015); time to play and least surprise as principles (D-CLOUD-098, D-UI-042); player language (D-UI-045); the release-candidate procedure (D-WORKFLOW-047); every council and audit seat through OpenRouter (D-WORKFLOW-049); the fork as rasteratops (D-WORKFLOW-084); time is not a planning factor (D-WORKFLOW-091); and the cloud epic for 0.0.1 with `/Rasteratops` as its folder (D-CLOUD-156 to 158).
- **Blindspots: 50 added (21 to 70)**, by family above. From entry 52 on each names its guard in the tree (`ceremonies.md`).

## Issues

- **Opened: 299 (#55 to #354)**, of which 126 were still open when read on 10-01.
- **Closed: 188 (176 completed, 12 not planned).**

## What October starts with

- **The cloud epic #354 for 0.0.1** (D-CLOUD-156 to 158): x64 runs 95 to 99 on 10-01 brought `/Rasteratops`, the scan-first restore, the per-device settings offer and the join; the cloud folder step that replaces the check before every sync (D-CLOUD-170, #363) is run 100, in proof on the night of 10-01; it is not RC3's candidate until RC3's step 0 passes (libsoup's pin, below).
- **The plan for 0.0.1 (#344)**: P1's open items, then the identity on X64 (#337), the RG35XX SP's manual migration (P3), and the Nova's and the H700's images (P4).
- **RC3's step 0**: libsoup's pin (#362) awaits the maintainer's call; the device facts are read by hand.
- **The adversarial review, in places** (#339, #346).
- **Ceremonies**: the W40 weekly by Tuesday 10-06; this summary was owed by 10-03.
