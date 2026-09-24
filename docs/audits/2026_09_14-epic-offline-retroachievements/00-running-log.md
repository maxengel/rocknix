# Epic Audit Running Log — Offline RetroAchievements (#163)

**Auditor:** Code Auditor skill v1.10.0 (single orchestrator)
**Model:** Claude Fable 5.1 (`claude-fable-5-1`), effort xhigh — read from the session's system prompt, which names it; recorded per the brief's ground rule
**Started:** 2026-09-14 14:15 UTC
**Scope:** Epic #163 "Offline RetroAchievements" — sub-issues #164–#168, #172, #173, #175, #176, #179, #180, #183, #184 — at the state of its two feature branches (the sixth candidate's content)
**Spec:** the issue bodies on maxengel/rocknix (issues are the spec here); register rows D-RA-001..016, D-UI-053..055, D-WORKFLOW-020/021/022, D-QA-016 in `docs/decision-register.md`
**Tier:** Epic (one epic, an issue chain inside it). The running log is optional at this tier; kept because the brief asks for it and the scope spans two repositories.

**Audited trees (read-only, never modified by this audit):**
- distribution: `feature/round-notes-rc5` at `/workspace/repos/rocknix.worktrees/round-notes-rc5`, tip `cee1656c33`
- EmulationStation: `feature/round-notes-rc5` at `~/Development/emulationstation-next.worktrees/round-notes-rc5`, tip `ec2de8ae7`, base `test/qa-integration` `df9d88171`
- the unpacked upstream proxy client at `rocknix.worktrees/generic-x64/build.ROCKNIX-GENERIC_X64.x86_64/build/raofflineproxy-64d03d30633ca6e7719c26d732cef3c97dedcc27/linux/raofflineproxy/` (read only)

---

## Log Entries

### [Phase 0] 14:15 — Setup

- Skill read from the primary checkout `/workspace/repos/rocknix/.claude/skills/code-auditor/` (SKILL.md, references/phases.md, templates.md, anti-patterns.md). `diff -q` of all four against `git -C /workspace/repos/rocknix show next:...` — identical. No stale copy.
- Primary checkout is on `next` at `ec4a74937d`, clean.
- Distro worktree: branch `feature/round-notes-rc5`, tip `cee1656c33`, clean. `merge-base HEAD next` = `95e4961fb3` (next has since gained `93fa633258`, `4c222e0e24`, `ec4a74937d`; to be characterised in Phase 1).
- ES worktree: branch `feature/round-notes-rc5`, tip `ec2de8ae7`, clean. `merge-base HEAD test/qa-integration` = `df9d88171` as the brief states.
- Audit folder created: `docs/audits/2026_09_14-epic-offline-retroachievements/`.
- Ground rules from the brief taken as binding: no fixes, no changes to the audited branches, no handheld, no cloud account, no image build, guest d only if an observation is needed, GPT second opinion via the council Facilitator.

### [Phase 1] 14:55 — Research complete

- Read: the skill (4 files, identical to `next`), #151 for the audit-issue shape, all 14 issues with every comment (rendered to `/workspace/tmp/rocknix-session/audit-163/issues-rendered.md`, 149 KB), 20 register rows + the open-decisions section, the blindspot register (43 entries), 12 rules (from `next`), the design note's structure and § 11, `docs/vm-qa-log.md:73`, the frames directory, both trees' history and inventories, the upstream client's listing.
- 64 criteria enumerated (50 issue boxes incl. #184's ten notes; 14 register rows/groups). 18 ticked boxes to be re-derived.
- Red flags: #173 AC3 and #179 AC2 contradict what shipped; the ES pin is the ES branch's base (RC-6 unbuilt); D-RA-013 leans on the index #183 says did not fill on the VM; two writers on the proxy's sqlite; `cheevos_username` still logged; `log_uploader.py` upstream; no D-RA-015.
- `cheevos_ppsspp.sh` is under `ppsspp-sa/scripts/`, not `rocknix/sources/scripts/`; `ThreadedCloudSync.cpp` is `es-app/src/`, not `components/`.
- Next: Phase 2, one criterion at a time, source read first, finding written before the next.

### [Phase 2] 16:05 — Distribution side written (22 entries)

- Read in full: `package.mk` (3 recipes), the unit, `006-raofflineproxy`, `099-networkservices`, patches 001–004, `raofflineproxy-ctl` (1086 l), `raofflineproxy-cache-indexed` (183 l), `setsettings.sh` § set_cheevos + log(), `cheevos_ppsspp.sh`, `runemu.sh` § log/loginit/lowerdeck, `backuptool` § RATOKENDIRS, `001-functions` § redact_credentials, `rocknix-evidence` § take list, `qa-accounts`, `ra-offline-test`, the harness's proxy cases; in the unpacked client: `proxy_service.py` (http_error tuple, ConnectivityMonitor, startup order, corruption upload), `state.py` (save_json_file), `network.py` (throttle, probe, redaction), `storage.py` (WAL, timeout 5 s), `es_export.py`, `rom_cache.py` (cache_game), `image_cache.py` (pool 4, badge URLs), `log_uploader.py` (AWS endpoint), `config.py` (image caching default True, proxy_value), `auth.py`, `smart_cache.py`.
- Ran: pkgcheck ×3 (0), `last-good-scripts-test` (PASSED, 236/0).
- Findings so far: F-01 two writers on `online_state.json` (service writes only on a transition); F-02 inherited automatic log upload to a third-party endpoint; F-03 top-up marks its attempt before a 10 s probe window shorter than the DNS lag #175 measured; F-04 no harness case for scan/topup/ready; F-05 `qa-accounts clear` leaves the proxy's token cache; F-06 web key in curl argv; F-07 stale `CACHE_CAP=100`; F-08 partial enable self-heals only at the next boot; F-09 `MAX_SCAN_ENTRIES` truncates an unindexed walk silently; F-13 body drift (#173 AC3, #179 AC2, #163 boxes, milestone on four issues); F-15 account name in `service.log`/`exec.log` (not bundled).
- Cost facts gathered for Phase 3: 3 throttled API GETs per game + ~2 badges per achievement (4 workers, unthrottled, skipped when on disk) + batch cooldown 30 s per 50 games; the monitor's HEAD every 15 s while the service runs.
- Next: the ES half, starting with `GuiRetroAchievementsSettings.cpp`.

### [Phase 2] 17:20 — ES side written; forward audit closed

- Read: `GuiRetroAchievementsSettings.cpp` (whole), `OfflineAchievements.{h,cpp}`, `OfflineAchievementsText.{h,cpp}`, `GuiOfflineScan.{h,cpp}` (whole), `RetroAchievements.cpp` device path + four fall-back sites, the two pages' offline parts, `NetworkThread.cpp` 105–237, `CheevosRetry.{h,cpp}`, `ThreadedHasher.cpp` 36–100/140–170, `ThreadedCloudSync.cpp` 458–560, `CloudText` parsers, `HttpReq` option, `WebImageComponent` 186–200, `GuiMenu` gates + INDEX row, the three tests' case lists.
- Ran: es-unit-tests 57/685 pass; msgfmt 1386 exit 0; cross -fsyntax-only ×5 clean; ASCII-comment grep clean; French 71/71.
- Guest d read-only: clean, `b3189ba85f`, StartLimit* honoured silently on systemd 255 (observation withdrawn).
- Tally: 38 PASS, 9 PARTIAL, 3 FAIL, 9 SKIP, 3 UNTESTABLE. Overall PASS WITH FINDINGS.
- New findings from the ES half: F-10 (D-RA-013 stands on an index #183 says did not fill; a never-indexed library gets no automatic top-up), F-11 (the RC-6 page has no frame at any size), F-12 (D-UI-053 vs D-UI-054 on the title; D-RA-004 still provisional), F-14 (no docs page), F-16 (no cancel/background on a scan that can run for hours), F-17 (offline summary = 2 proxy round-trips per cached game, sequential).
- Next: Phase 3.

### [Phase 3] 18:05 — Retrospective written

- Two facts changed the picture during Phase 3: the client's `PeriodicRefresh` re-fetches patch+unlocks for every cached game hourly with no age check (patch 004 uncapped it — F-19, High) and its 60-day eviction removes `achievementsets` rows nothing refreshes while `patch` rows keep the game counted "ready" (F-20, High). `CheevosCheckIndexesAtStart` defaults false (F-10 sharpened). The hasher skips games with a hash (F-18, upgrade path).
- Nine interactions, ten missing artifacts with search trails, seven defect shapes enumerated to every site, the maintainer's seven questions answered in §§ 3.7–3.12 with a cost table for 100 and 1,000 games.
- 22 findings so far (F-01..F-22). Next: Phase 4 synthesis, then 4.5 refutation of every High.

### [Phase 4 / 4.5] 18:40 — Synthesis, refutation, the second opinion

- 04 written; 4.5: F-19, F-20 survive as High; F-01 reduced to Medium (the monitor self-corrects when its own probe fails); F-02 killed as a High (`storage.py:41` — always sqlite; the incident path is the JSON backend's).
- GPT seat: launched 14:59:53Z detached (`setsid nohup`), polled in bounded loops; finished 15:23Z — `openai/gpt-6-astra`, effort max, 38,042 reasoning tokens, 1,415 s, identity from the provider response, one attempt. Output + provenance copied to `second-opinions/`.
- Graded: 8 disagreements (F-03 sharpened; F-08, F-09 re-graded to Medium; F-10, F-18 narrowed; F-15 wording; F-16/F-19 arithmetic corrected to ~40–45 min and ~41k/day; F-20 tail read here and stands), 12 additions (G-01 folded into PL-02; G-02, -03, -04, -06, -07, -08, -10, -11 → PL-23..PL-30 Medium; G-05, -09, -12 → PL-31..PL-33 Low). G-04 and G-10 confirmed by command (grep; canaries through `redact_credentials`).
- Punch list: 33 items (0/2/19/12). Next: Phase 5 lint, Phase 6 issue.

### [Phase 5 / 6] 19:05 — Punch list linted; issue #186 created

- `tools/lint-audit-artifacts` on the folder: required files, the five 04 sections, 33 items, each with a Phase 7 row; the only failures before the issue existed were the 24 gate rows naming the placeholder — filled with #186 now.
- `gh issue create --repo maxengel/rocknix` → #186, labels `audit` `punch-list` `enhancement`, 36 checkboxes (33 items + 3 acceptance lines), the executive summary, method, result, the seven questions in one line each, the tracked scope.
- Phase 7: every item **Deferred, by name, to the fix stream on #186** under the maintainer's no-fix mandate (D-WORKFLOW-015 keeps every severity in scope; the deferral is the mandate's, not a severity's). Lint re-run with `--issue 186` recorded below.
- Nothing in the audited branches, in any document outside this folder (the work log excepted), or in any issue other than #186 was changed.

### [Phase 7 / close] 19:15 — Committed on `next`, pushed

- `tools/lint-audit-artifacts … --issue 186`: **PASS** (33 items, each Deferred by name to #186; the issue carries 36 checkboxes and every PL id).
- Work log entry appended (`docs/work-logs/2026_09-work_logs/2026_09_14-work_log.md`, 19:10 UTC).
- Committed on `next` in the primary checkout (this folder + the work log; nothing else), pushed to `origin next`. The sha is git's.
- Ended: 2026-09-14 19:15 UTC. Model throughout: Claude Fable 5.1, xhigh.
