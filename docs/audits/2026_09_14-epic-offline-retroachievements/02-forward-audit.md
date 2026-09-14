# Forward Audit — Epic #163 "Offline RetroAchievements"

**Auditor:** Code Auditor skill v1.10.0, Epic tier, one orchestrator, serial
**Date:** 2026-09-14
**Subject:** the 64 criteria enumerated in `01-research-notes.md` § 1.2, at distribution `feature/round-notes-rc5` `cee1656c33` and EmulationStation `feature/round-notes-rc5` `ec2de8ae7`
**Spec:** the issue bodies (#163 … #184) and the register rows named in 01
**Model:** Claude Fable 5.1, xhigh

Verdicts use PASS ✓ / PARTIAL ⚠ / FAIL ✗ / SKIP ○ / UNTESTABLE ?. Every PASS cites a primary artifact and records the refutation attempted. A criterion whose evidence is only on a handheld, or only in an unbuilt image, is SKIP with the place recorded, never PASS on a comment. Tracker ticks are corroboration only.

**Mechanical checks run for this phase (this session, from the distro worktree, read-only):**
- `tools/pkgcheck raofflineproxy` / `raofflineproxy-rcheevos` / `raofflineproxy-libchdr`: exit 0, 0, 0.
- `tools/last-good-scripts-test` at `cee1656c33`: **PASSED**, exit 0 (cases a–s; 235 PASS lines, 0 FAIL; log `/workspace/tmp/rocknix-session/audit-163/lgst.log`). Case p (ctl enable/disable/pending/pending-ids/account/flushed), k (the proxy folder travels in no shape), q (099 reset), r and s (redaction) all PASS.
- Build-tree patch state (`rocknix.worktrees/generic-x64/build.ROCKNIX-GENERIC_X64.x86_64/build/raofflineproxy-64d03d30.../linux/raofflineproxy/`, read-only): patches 001 (`is_passthrough_client_error` ×2), 002 (`WARNING_ACHIEVEMENT_ID` ×6 in rom_cache.py), 003 (`write_flush_stamp` ×2) applied; **004 not applied** (`MAX_CACHED_GAMES = 100` at rom_browser.py:49) — expected, 004 post-dates RC-5.

---

## Running Notes

### AC-163-1: D-RA-001 settled (system-wide vs per emulator; hardcore stance; fork-first vs upstream-first)

**Source:** #163 body
**Verdict:** PASS ✓
**Evidence:** `docs/decision-register.md:264` (D-RA-001, decided 2026-09-13, "settled from the open row"), `:267` (D-RA-002: system-wide, hardcore off with the sentence, per-core parked #172, token never travels, contribute back). Fork-first: D-RA-016 (`:288`) makes upstream contributions gated on the maintainer's go, phase 5.
**Refutation attempted:** looked for a surviving `**Open:**` D-RA-001 row in the open-decisions section — none; grepped for a contradicting later row — none.
**Notes:** the box is unticked in the body while the register says decided; blindspot 27 shape, body edit owed (rolled into F-13).

### AC-163-2: A milestone exists with its acceptance test in the description, or the maintainer decides this rides an existing one

**Source:** #163 body
**Verdict:** PASS ✓
**Evidence:** every sub-issue #164–#168, #173, #175, #176 carries milestone "Offline RetroAchievements" (`gh issue view --json milestone`, `issue-*.json` in the scratch dir); D-RA-001 names it "milestone 4". The description's acceptance test is what #166's scenario and D-RA-007/008 state.
**Refutation attempted:** checked the milestone field on #179, #180, #183, #184 — **absent** (`ms=-`); the four issues built in the last 24 h were never attached. Not a failure of the criterion (the milestone exists) but a tracker gap: the milestone's closing test cannot count them. Recorded as F-13(b).

### AC-163-3: Sub-issues for the phases above, attached as GitHub sub-issues

**Source:** #163 body
**Verdict:** UNTESTABLE ?
**Evidence:** the sub-issue relation is not in `gh issue view --json`; would need `gh api repos/maxengel/rocknix/issues/163/sub_issues`. Not run: the brief's tooling rule keeps GitHub reads to what the skill names, and the answer changes nothing in the code under audit. Each phase issue's body says "Epic #163", which is the readable link.

### AC-164-1: A design note in `docs/` answering each question above with file and line references into the pinned upstream commit

**Source:** #164 (ticked)
**Verdict:** PASS ✓
**Evidence:** `docs/ra-offline/2026_09_13-phase-1-design-note.md` (43,558 bytes; 12 sections; § 2 start/stop, § 4 files written, § 5 authentication, § 6 hardcore, § 7 queue/flush/chain, § 8 es_export, § 10 what a package replaces, § 11 contribute-back) — read the headers and § 11 in full; line references of the form `proxy_service.py:978`, `flusher.py:444-462` throughout § 11.
**Refutation attempted:** the note's pin `64d03d3063` equals `PKG_VERSION` in `package.mk:9`; § 11 item 9 describes the 503 conversion the shipped patch 001 fixes — consistent with the code.

### AC-164-2: D-RA-002 settled: the hardcore stance; the token/credential handling against D-INFRA-010; RetroArch first, PPSSPP after, or both

**Source:** #164
**Verdict:** PASS ✓
**Evidence:** D-RA-002 (`decision-register.md:267`); hardcore: `raofflineproxy-ctl:290-297` records `hardcore_was` once, sets hardcore 0; the ES dialog text (verified in the ES half). Credentials: `backuptool:253-255` `RATOKENDIRS=(/storage/.config/raofflineproxy/)`, `:410-418` held back by prefix, `:670`/`:687` skipped on tar and zip restores; harness case k PASS (this session). Both emulators: `setsettings.sh:511-524` and `cheevos_ppsspp.sh:49-56`.
**Refutation attempted:** looked for a proxy host written to a persistent file (`grep -rn '8080' projects/`): only the two launchers' per-launch outputs (`/tmp/.retroarch.cfg` appendconfig; `ppsspp.ini`'s `AchievementsHost`, which **does** persist and does travel — cleared to empty on every launch with the toggle off, `cheevos_ppsspp.sh:49`, `:84`; a restored `ppsspp.ini` with the host set is rewritten at the next PSP launch, not before — acceptable, the value is only read at launch).

### AC-164-3: The upstream commit to pin, and the list of things the fork would want to contribute back

**Source:** #164
**Verdict:** PASS ✓
**Evidence:** `package.mk:9` pins `64d03d30633ca6e7719c26d732cef3c97dedcc27` with `PKG_SHA256`; the list is the design note § 11 (9 upstream items + the distribution paragraph) and the #168 comment of 2026-09-14 13:43 (patches 1–4, findings 5–9, ideas), recorded as D-RA-016.
**Refutation attempted:** compared the #168 list against what the tree ships — four patches present under `patches/`, item 5 (submodules) matches the two source-only recipes. One item the list lacks: the automatic log upload (`log_uploader.report_storage_corruption`, design note § 11 item 4) is on the note's list but **not** on #168's list of things to raise upstream — see F-02.

### AC-165-1: `tools/pkgcheck` clean; the package builds for GENERIC_X64 and H700

**Source:** #165 (unticked)
**Verdict:** PASS ✓
**Evidence:** `tools/pkgcheck` ×3 exit 0 (this session). GENERIC_X64: the build root `rocknix.worktrees/generic-x64/build.ROCKNIX-GENERIC_X64.x86_64/build/raofflineproxy-64d03d30.../` exists with the patched tree; RC-5 `b3189ba85f` ran the nine suites (`docs/vm-qa-log.md:73`). H700: the 2026-09-14 work log 13:14 UTC device read — `raofflineproxy-ctl` with scan/topup/pending-ids and `libraproxy_rchash.so` present on the RG SP at `BUILD_ID b3189ba85f`.
**Refutation attempted:** `make_target` compiles ~30 C sources with `${CC}` — checked every referenced path exists in the unpacked tree's `third_party/` layout? Not re-verified file by file (the build succeeded on two arches, which is the stronger evidence). The three recipes are `PKG_TOOLCHAIN="manual"`; the two source-only ones define no build functions, so `scripts/build` does nothing for them beyond unpack — by design, stated in their headers.
**Notes:** header carries only the ROCKNIX SPDX/copyright line — a new package, no JELOS/LibreELEC lineage to preserve. `PKG_DEPENDS_TARGET` names `Python3` (the interpreter the ctl and helper run) — the ctl also runs `netstat`, `flock`, `timeout`, `stat`, `mktemp`, `mkfifo`, `logger` (busybox applets on the image) and `systemctl`; none needs a package line. `sqlite3` is Python's module, not the binary (ctl:359-362 says so).

### AC-165-2: Toggle on: the service runs, `retroarch.cfg` carries the proxy host, a game launched online is cached; toggle off: the service stops and the config is restored to what the player had

**Source:** #165 (ticked 2026-09-13 on `e1edaaa33b`)
**Verdict:** PASS ✓
**Evidence:** `raofflineproxy-ctl:277-308` (`do_enable`: marker, start, record-once, hardcore 0, toggle 1, read-back), `:310-333` (`do_disable`: stop, marker, toggle 0, hardcore put back from the record, read-back); harness case p PASS this session (record once, restore, idempotent twice, a start that fails leaves settings untouched). The host reaches RetroArch through the appendconfig, not `retroarch.cfg` (`setsettings.sh:517`) — the criterion's wording predates the design; the #165 comment of 17:57 says why (nothing persistent, nothing to revert). Guest evidence: #166 comments (appendconfig `cheevos_custom_host = "127.0.0.1:8080"`, `login2`/`achievementsets`/`startsession` cached; disable → `hardcore put back`, `cheevos_custom_host = ""`).
**Refutation attempted:** the "restored to what the player had" half — a second `enable` after the first: `:293` keeps the first record (harness p proves). A `disable` with no record leaves hardcore alone (`:315-322`). Partial `enable` (settings write fails after `systemctl start`): `fail` at `:301-304` exits 1 with the marker present and the service running; the boot pass re-derives from the toggle (0) and stops it, and the launchers gate on the toggle, so nothing is routed — self-heals at the next boot, not at once (F-08, Low).

### AC-165-3: The settings backup carries the toggle and never a token (D-INFRA-010; `tools/last-good-scripts-test` proves it)

**Source:** #165 (ticked) — **spot re-verification #1 of the Epic-tier quota**
**Verdict:** PASS ✓
**Evidence:** `backuptool:253-255`, `:410-418` (`grep -F` on the prefix over `FILELIST`, counted and logged), `:670`, `:687` (restore skip lists for tar and zip include `"${RATOKENDIRS[@]#/}"'*'`); harness case k this session: "the offline RetroAchievements proxy's folder travels in no shape: none of its five files is in the archive", "the proxy's queue from the archive is not put over this device's own (tar)", "(zip)" — PASS. The toggle travels: it is a line in `system.cfg`, which is in the default `LOCATIONS` (`backuptool:154` per #151's reading; guest read in #166: the archive's `system.cfg` carries `global.retroachievements.offlineproxy=1`).
**Refutation attempted:** what is *not* under the prefix? `ppsspp_retroachievements.dat` (raw token) — held back by `RATOKENFILES` (`:232`, #169); `global.retroachievements.token` in `system.cfg` — stripped (#169, `:398`). The `last-scan`/`scan.log`/`last-topup-attempt` files sit under the prefix — held back too (no secret in them, but the design keeps the folder whole).

### AC-165-4: Frames of the page at 640x480 and 1280x800 in English and French

**Source:** #165 (ticked 2026-09-14)
**Verdict:** PARTIAL ⚠
**Evidence:** `docs/qa-frames/2026-09-14/`: `ra-offline-page-640x480-609f1df917[-fr].png`, `ra-offline-ra-settings-page-640x480-609f1df917[-fr].png`, `ra-offline-toggle-page-1280x800-31253072d6[-fr].png`, `ra-offline-toggle-row-1280x800-31253072d6[-fr].png`, `ra-offline-toggle-dialog-1280x800-31253072d6.png` — all present (ls this session).
**Gaps:** the frames show the RC-2/RC-3 page (three info rows, `OFFLINE ACHIEVEMENTS` without (BETA)). The page as it stands on the ES branch (`3fd70aa68`: title (BETA), switch + scan row, spacer, one block) has **no frame at any size in either language** — the sixth candidate is unbuilt. The tick was true for the page it framed; it is not evidence for the page that ships next. #184's own acceptance line owes those frames.

### AC-166-1: The scenario passes on a QA guest, recorded in `docs/vm-qa-log.md` with frames of the exit and reconnect messages in both languages

**Source:** #166 (ticked 2026-09-14)
**Verdict:** PARTIAL ⚠
**Evidence:** `tools/ra-offline-test` (403 lines, read in full) drives steps 0–10 with a PASS/FAIL per assertion and refuses on preconditions (`:142-158`), on a spent account (`:208-212`), and on an API that did not answer (`:209`) — never passes over nothing; the RC `31253072d6` run `PASSED (32)` (#166 comment 03:21, report `qa-31253072d6-webdav-d-20260914-0317`); frames `ra-offline-exit-awards-pending-640x480-609f1df917.png`, `ra-offline-flushed-640x480-609f1df917.png` exist. `docs/vm-qa-log.md:73` (RC-5) says "`ra-offline` not re-run (unchanged proxy path)".
**Gaps:** (1) the two card frames exist in **English only** — no `-fr` counterpart in the directory (ls this session) — the criterion says both languages; (2) the RC-5 row did not re-run the suite and the RC `31253072d6` row is the one that did. Not a defect in the code; the tick over-claims the French half.

### AC-166-2: The same scenario with the toggle off reproduces #162's loss (the control)

**Source:** #166 (ticked)
**Verdict:** PASS ✓
**Evidence:** `tools/ra-offline-test --control` branch: `:243-247` (disable, nothing on 8080), `:297` (`Using host: retroachievements.org`), `:354` (no `queued_offline`), `:369` (`pending` = 0, exit 1), `:394-395` (API says NOT earned 90 s after the link returned), `:401` (relaunch: the same active count). The #166 comment of 03:02: `PASSED (25)` on `609f1df917`, frames `ra-offline-control-*`.
**Refutation attempted:** can the control pass over nothing? Step 6 asserts `Awarding achievement` was logged (`:347`) before asserting the loss — a route that never fires FAILs, not passes.

### AC-166-3: The `vm-qa` fixture exists and is in the runner's suite list

**Source:** #166 (ticked)
**Verdict:** PASS ✓
**Evidence:** `tools/vm-qa:47` `SUITES="... link ra-offline walks"`, `:61` `--ra-offline`, `:87`, `:238` dispatch with `--monitor`, `--serial`, `--frames`; `:83` guest d's ports and sockets.
**Refutation attempted:** is it in the default `ONLY` list? No (`:46`) — opt-in by design (the header says why: spends an achievement). The criterion says "in the runner's suite list", which it is.

### AC-173-4: `tools/vm-qa` fixture drives it (#166 box 3)

**Source:** #173 (unticked)
**Verdict:** PASS ✓
**Evidence:** as AC-166-3; the fixture asserts `pending` = 1 at exit (`:368`) and the flush stamp after reconnect (`:381`), the two facts the cards read; `--frames` captures the card (`:122-127`, "a person reads the frames, this tool asserts nothing from them").
**Refutation attempted:** the fixture does not assert the *sentence* on the card — by its own statement. The criterion says "drives it", which it does; the sentence is AC-173-1/-2's.

### AC-176-1: `setsettings.sh` redacts the value of every credential key it logs — the key name stays

**Source:** #176 (ticked) — **spot re-verification #2 of the Epic-tier quota**
**Verdict:** PASS ✓
**Evidence:** `setsettings.sh:256-263` `log()` → `redact_credentials "$*"`; `runemu.sh:72-100` `log()`/`loginit()` through the same; `profile.d/001-functions:56-88` — the word list `passw|token|api_?key|secret|psk|wifi\.key`, the `Fetch "<key>" ... ] (value)` shape (`:77`), `p=`/`t=`/`y=` on a RetroAchievements line (`:78`). Harness case r PASS this session ("the launch log carries no credential value: setsettings' Added setting and Fetch lines, runemu's Executing line, the helper's shapes"; "the sed program is accepted by the sed in use (the image's busybox)").
**Refutation attempted:** `cheevos_username` is logged in the clear (the #176 comment says so, 2 lines; the word list does not include `user`). Is a RetroAchievements user name a credential? It is a public identifier (the profile URL carries it); the brief asks about an account name "where it is meant to be masked" — the guest-read filter masks it for transcripts; the launch log does not claim to. Recorded as an observation (F-15, Low), not a failure of this criterion.

### AC-176-2: `rocknix-evidence` scrubs credential-shaped lines from every file it bundles, with a suite check that plants a value and fails before / passes after

**Source:** #176 (ticked)
**Verdict:** PASS ✓
**Evidence:** `rocknix-evidence:96-97` refuses without `redact_credentials`; `:110` every taken file through it; `:126` every snapshot page; `:140`, `:153` the summary says so. Harness case s PASS this session; the #176 comment records `BASE_REF=880a133f36 --old`: r 6 FAIL, s 8 FAIL — the before/after the criterion asks for.
**Refutation attempted:** which files does it take? `:168-176`: three journals, `es_log*.txt`, `cloud_sync.log` (1 MiB tail), `exec.log`. **Not** `service.log`/`scan.log` (the proxy's) — so the account name in the proxy's request log (F-15) never reaches a bundle. The journal carries the ctl's `say` lines — none names an account (`ctl:306`, `:331`, `:954`, `:1059`, `:1064` read).

### AC-176-3: On a guest with the QA account: a launch, then `grep -c` of the planted value across `/tmp/exec.log` and the evidence bundle -> 0

**Source:** #176 (ticked)
**Verdict:** PASS ✓ (guest evidence, prior; not re-run)
**Evidence:** #176 comment 04:22 on RC-3 `5801ceb5fc`: planted `PLANTEDpw7Qx`, `grep -c` 0 in `exec.log`, 0 files in the extracted bundle, `summary.txt` line 54 "21 file(s) rewritten, 0 left out". The code path is unchanged since (`git log` on `001-functions`, `rocknix-evidence`, `setsettings.sh`, `runemu.sh` since `80edc086fd`: only `df9407007e`'s earlier proxy branch, which predates it).
**Refutation attempted:** re-running would put a dummy password on guest d — an observation the phase does not need, since the code is byte-identical to what the comment tested and case r/s cover the shapes under the image's busybox.

### AC-179-2: The caching path never runs while offline, never exceeds the cap, and logs what it cached and what it skipped

**Source:** #179 (unticked)
**Verdict:** PARTIAL ⚠
**Evidence:** never offline: `ctl:517-520` `is_online` (a fresh `probe-online`, then `"online": true` in the file, else offline), `:897-901` scan exits 69, `:987-994` topup three probes over 10 s then 69. Logs: `slog` lines per client line (`:839`), the stamp `write_stamp` (`:496-502`), `scan.log` rotated at 1 MiB (`:464-470`). Skipped: `:853-857` counted, not shown — "as the proxy does". Cap: superseded by D-RA-014 (patch 004 puts it at 1,000,000); the ctl still stops on `Cache limit reached` (`:846-852`) should the client ever say it.
**Gaps:** (1) the body still says "never exceeds the cap" — amend (F-13); (2) the online probe writes `online_state.json` (F-01); (3) `CACHE_CAP=100` at `:192` is named "for the log" and written to `scan.log` at `:850` as "the proxy's cap of 100 games" — false after 004 (F-07); (4) the top-up marks its attempt before it probes, so a connect whose DNS lags past 10 s costs the half-hour (F-03). No harness case covers any of this (F-04).

### AC-184-6: No cap on how many games earn offline (D-RA-014)

**Source:** #184 note 6 (unticked; built)
**Verdict:** PASS ✓ (code) / SKIP ○ (device, #184's own tick is the maintainer's)
**Evidence:** `patches/004-no-cap-on-cached-games.patch` → `MAX_CACHED_GAMES = 1000000` in `rom_browser.py`; `smart_cache.py:25`, `:158`, `:173`, `:181`, `:208` all derive from the same constant (grep this session), so the smart cache follows. `aa9227d83d` regenerated the patch from the source; the tree's copy applies (`patch --dry-run` is the builder's claim — the build-tree copy predates 004, so not re-verifiable here without an unpack; the diff hunk's context lines match `rom_browser.py:46-51` of the unpacked tree byte for byte, read this session).
**Refutation attempted:** anything else that caps? `MAX_SCAN_ENTRIES = 5000` (`rom_browser.py:50`) bounds one walk of an **unindexed** system in `list_jobs` (`ctl:777-782`) — a never-indexed library of more than 5,000 ROMs under the walked folders is truncated per scan, silently; the indexed path has no such bound. Real libraries of that size exist (arcade sets). F-09, Low.

### REG-RA-002: system-wide; hardcore off with the sentence, never silently; per-core parked; token cache never travels

**Verdict:** PASS ✓ — evidence as AC-164-2 / AC-165-2 / AC-165-3; the sentence is the ES dialog (verified in the ES half). Per-core: #172 open, no code.

### REG-RA-003/005: the synthetic 101000001 never reaches the emulator; the toggle has its own page

**Verdict:** PASS ✓
**Evidence:** patch 002 (`rom_cache.py` `filter_warning_achievement_definitions` drops by id before the Flags test); applied in the build tree; the #173 comment of 02:16 read the cached body: 28 achievements, `has 101000001: False`; `tools/ra-offline-test:300-301` asserts no `Awarding achievement 101000001` in every run. The page: ES `43f565a4c` and after (ES half).
**Refutation attempted:** a cache that already holds the warning — the patch header says bodies are filtered on the way out; `handle_offline_request` → `filter_warning_achievements_for_action` (the header's claim; the unpacked tree has the function at rom_cache.py, grep count 6 for the id). Not re-executed.

### REG-RA-014: no cap; throttle kept

**Verdict:** PASS ✓ — as AC-184-6; throttle: `network.py:25` `RA_MIN_REQUEST_INTERVAL_SECONDS = 0.3`, `:26-27` batch 50 / cooldown 30 s, `:22-24` 429 backoff 2→15 s ×4 — untouched by any patch (grep this session).

### REG-INFRA-010/011: a credential never crosses a script boundary or reaches a log or bundle

**Verdict:** PASS ✓ with one inherited exception recorded
**Evidence:** as AC-176-*; the ctl prints no value from `system.cfg` (read every `echo`/`printf`/`say`/`tell`/`slog` in the 1086 lines: `hardcore=<0|1>`, counts, tokens, file names); `do_account` returns two numbers from the row that holds the token (`:409-425`); `qa-accounts` moves values over stdin (`:53-54`, `:87`).
**Exception:** `tools/ra-offline-test:196` — `curl -s -m 20 "https://retroachievements.org/API/...&u=${RA_QA_USER}&y=${RA_QA_WEBKEY}"`: the web API key is a command-line argument on the **host**, visible in `ps` for the request's duration. The host is the maintainer's (D-INFRA-006 tolerates a value in a build log there); still the opposite of the rule `qa-accounts` adopted (#151 PL-09). F-06, Low.

---

**Mechanical checks run for the ES half (this session, from the ES worktree, into scratch):**
- `es-unit-tests` built with the toolchain's cmake + host g++ into `/workspace/tmp/rocknix-session/audit-163/es-build-tests` (`-DRAPIDJSON_INCLUDE_DIR=<build root>/toolchain/x86_64-rocknix-linux-gnu/sysroot/usr/include` — the hint the test's CMakeLists documents and the `es-code-traps.md` recipe omits): **57 cases, 685 assertions, 0 failed**.
- `msgfmt --check --statistics` (toolchain) on `locale/lang/fr/LC_MESSAGES/emulationstation2.po`: **1386 translated messages**, exit 0.
- Cross `x86_64-rocknix-linux-gnu-g++ -fsyntax-only` with the build root's `compile_commands.json` flags (branch include dirs first) on the five changed TUs (`GuiRetroAchievementsSettings.cpp`, `GuiOfflineScan.cpp`, `OfflineAchievements.cpp`, `ThreadedHasher.cpp`, `GuiMenu.cpp`): rc 0, 0 errors, 0 warnings each.
- `grep -nP '^\s*//.*[^\x00-\x7F]'` over the 20 touched ES files: none (the two non-ASCII bytes in `GuiRetroAchievementsSettings.cpp` are the `·` separators inside string literals, allowed).
- French coverage, strict: every `_()` string the epic added or changed (71 msgids across `GuiOfflineScan.cpp`, `OfflineAchievements.cpp`, the ROCKNIX block and GAME INDEXES rows of `GuiRetroAchievementsSettings.cpp`, `ThreadedCloudSync.cpp`'s four, the two pages' five, the third INDEX row) has a non-empty msgstr — **71/71**. (A keyword-filtered sweep also listed 69 pre-existing cloud strings without French — D-UI-051's known follow-up, not this epic's.)
- Guest d, read-only (`ssh -p 10026`, filtered): `BUILD_ID b3189ba85f`, `raofflineproxy-ctl status` `enabled=0 marker=0 service=inactive hardcore=0`, no `/storage/.config/raofflineproxy/` (left clean by the last session); `systemctl show raofflineproxy.service`: `Type=simple`, `StartLimitIntervalUSec=1min`, `StartLimitBurst=5`, **0** `StartLimit… deprecated` journal lines on systemd 255 — the `[Service]` placement is honoured silently, not a defect; `/bin/sh` → `/usr/bin/bash`.

### AC-167-1 / AC-167-2 / AC-167-3: the handheld round (award survives on the handheld; messages read right at 640x480 on the panel; #161's cause named)

**Source:** #167 (unticked)
**Verdict:** SKIP ○ ×3 — handheld-only, the maintainer's (D-QA-015, D-RA-007). Recorded here: the VM half (D-RA-007's two shapes) is done — RC-4 `c5c50a2d5f` fully-offline check (`/workspace/tmp/rocknix-session/fully-offline-c5c50a2d5f-run2.log`: `the proxy listens on 127.0.0.1:8080 after an offline boot`, `offline: Using host: 127.0.0.1:8080`), RC-5 `b3189ba85f` (`docs/vm-qa-log.md:73`). The RG SP ran RC-5 (work log 13:14 UTC) but no unlock was driven offline on it — #184's notes are about the pages, not an award.

### AC-168-1: The docs page prepared alongside the fork change

**Source:** #168 (unticked)
**Verdict:** FAIL ✗
**Evidence:** `grep -ril 'offline achievements|raofflineproxy' docs/` outside audits, work logs, registers, the QA log, frames, the menu map and `docs/ra-offline/` — nothing; no `ROCKNIX/rocknix.org` draft exists in this tree. Five release candidates carry the feature; `documentation-accuracy.md`'s hard gate ("never push code/functionality changes without the corresponding rocknix.org site update") binds the upstream PR, not a fork RC, so this is a gate on phase 5 rather than on RC-6 — but the criterion as stated ("alongside the fork change") is not met.
**Gaps:** a `docs/configure/retroachievements.md` (or a new offline-achievements page) draft for `ROCKNIX/rocknix.org` covering the toggle, the (BETA)/casual-only/hardcore rule, the scan, the index relation (D-RA-013), what the backup carries (the toggle, never the cache), and the two card sentences. F-14.

### AC-168-2: Upstream PRs opened or the reasons not to recorded here

**Source:** #168 (unticked)
**Verdict:** PARTIAL ⚠ — the reasons-not-yet are recorded (the #168 comment of 13:43: "each opened only on the maintainer's go", D-RA-016); nothing is opened. The list is complete for patches 1–4 and findings 5–9; it omits the automatic log upload (design note § 11 item 4) — F-02(b).

### #172: per-core offline (parked)

**Verdict:** SKIP ○ — no criteria; parked by D-RA-002. No code path reads a per-game `offlineproxy` key (`grep -rn 'offlineproxy' setsettings.sh`: the global `get_setting` only, `:511`), so nothing half-built leaks.

### AC-173-1: Exit with the link down and a pending award: the sentence appears (frame, EN/FR)

**Source:** #173 (unticked)
**Verdict:** PARTIAL ⚠
**Evidence:** `ThreadedCloudSync.cpp:469-477` asks the ctl on the worker after the stamp; `:503`, `:515-539` the exit card with `NoNetwork`: `OFFLINE ACHIEVEMENTS WILL BE SENT NEXT TIME YOU'RE CONNECTED.` (the two-part sentence first, the awards sentence alone where it does not fit — the outcome line already said the saves did not go); no card (`cloudsaves.gameexit` off): `OfflineAchievements::sayAfterGame` (`OfflineAchievements.cpp:72-96`, a thread, then a toast). Frame `ra-offline-exit-awards-pending-640x480-609f1df917.png` (EN). French msgstr present (`LES SUCCÈS HORS LIGNE SERONT ENVOYÉS À VOTRE PROCHAINE CONNEXION.`, in the .po).
**Refutation attempted:** can the sentence show with nothing pending? `pendingAwards > 0` gates it (`:510`, `:528`); the ctl answers 0/exit 1 with the toggle off and exit 2 (→ -1) on an unreadable store (`OfflineAchievements.cpp:56-58`). A -1 never reads as > 0.
**Gaps:** no French frame; the toast path (no card) is unframed (the #173 comment of 02:16 § 4 says so). The two-part sentence's 640x480 fall-through is by design and stated.

### AC-173-2: Reconnect: the recorded sentence appears within a minute (frame, EN/FR)

**Source:** #173 (unticked)
**Verdict:** PARTIAL ⚠
**Evidence:** patch 003 writes `last-flush` after a flush that sent; `ThreadedCloudSync.cpp:473-474` reads it (`takeFlushed`) on any exit or startup card that reached the network; `:512-513` the completed card's action line `OFFLINE ACHIEVEMENTS HAVE BEEN SENT TO RETROACHIEVEMENTS.`; `:550-551` a toast after a failed card; `sayAfterGame` when no card. Frame `ra-offline-flushed-640x480-609f1df917.png` (EN); French present.
**Refutation attempted:** "within a minute" — D-RA-004 deliberately has **no monitor**: the sentence appears at the *next card*, which is the next game exit or the next startup, not within a minute of the flush. The criterion's clock and the design's clock differ; the design is the maintainer's (D-RA-004) and the criterion predates it. Not amended in the body (F-13).
**Gaps:** French frame; the body's "within a minute".

### AC-173-3: With the proxy off, the same exit says the award was not recorded (#162 option 1)

**Source:** #173 (unticked)
**Verdict:** FAIL ✗ (against the body) / by design (against D-RA-004's shape)
**Evidence:** with the toggle off the ctl's `pending` prints 0 (`ctl:355-358`) — "the service is stopped, so a row left in the store is not on its way anywhere"; the card then falls to `SAVES WILL BE SYNCED NEXT TIME YOU'RE CONNECTED.` alone (`ThreadedCloudSync.cpp:535-538`; frame `ra-offline-control-exit-offline-640x480-609f1df917.png`, and the #173 comment of 03:04 names the discrepancy). Nothing in the tree says an award was lost when the proxy is off; RetroArch itself retries until the game exits (#162), and the interface has no way to know an award was pending inside RetroArch.
**Gaps:** either build it (the interface would have to read RetroArch's log for `Error awarding achievement` at exit — fragile) or amend the criterion with the decision recorded. The comment says "decide"; nobody has (F-13).

### AC-175-1 / AC-175-2 / AC-175-3: the switch never flips on a failed sign-in; the retry when the network arrives; the frame

**Source:** #175 (ticked ×3)
**Verdict:** PASS ✓ ×3
**Evidence:** `GuiRetroAchievementsSettings.cpp:495-532`: the save writes the token only (`:508`, `:511`, `:527`) and `global.retroachievements` from the switch (`:529`); refused → dialog + stays on (`:513-517`); unreachable after a change → dialog (`:518-521`); unreachable, unchanged → a WARNING line (`:523`). `NetworkThread.cpp:107-163` + `CheevosRetry.cpp:5-17`: 10 s × 9 while unreachable and online, the long schedule otherwise; `:165-173` a link-up resets the count; `:207-222` the link-up posts the re-check. `CheevosRetryTests.cpp`: 6 cases incl. "the window, walked the way the component walks it" — pass this session. Frames `175-offline-boot-menu-640x480-5801ceb5fc.png`, `175-offline-after-B-no-dialog-…`, `175-refused-dialog-…` (EN, FR) present; the #175 comment of 05:08 (RC-4): 44 s from link to token, refusal never loops.
**Refutation attempted:** a path that still writes the switch off? `grep -n 'setBool("global.retroachievements"' es-app/src -r`: the save function only, from the switch's state. A refusal with `refused` unset by `testAccount`? `RetroAchievements::testAccount(..., &refused)` is the fork's (RC-3); the tests pin the schedule, not `testAccount`'s classification — a 5xx from RA reads as unreachable (retry), a 401/403 as refused. Acceptable.

### AC-179-1: Böbl, never started while connected, starts offline after the caching path; an unlock in that session is `queued_offline` and credited

**Source:** #179 (ticked)
**Verdict:** PASS ✓ (the first half on RC-5) / the unlock half rides AC-166-1's proof
**Evidence:** `docs/vm-qa-log.md:73` "**Böbl (never started online) earns offline after the scan**"; the #179 comment of 08:40 (RC-5): `POST /launch` → `logged in successfully` from the cache, `Identified game: 4902`, the set active. Code: `list_jobs` I-jobs (`ctl:724-747`), `cache_indexed` (`helper:69-100`: `cache_game` + the `gameid` alias + the path on the patch row).
**Refutation attempted:** the tick says "an unlock in that session is `queued_offline` and credited" — that half was not driven on Böbl (no route; `ra-offline-test:83-84` `CANDIDATES="tobu"`). The queue-and-flush mechanism is game-independent and proven on Tobu (AC-166-1). The tick over-reads by one clause; recorded, not failed.

### AC-179-3: The page shows how many games are ready for offline play and offers the scan, EN and FR

**Source:** #179 (ticked)
**Verdict:** PASS ✓ (code + RC-5 frame for the RC-5 wording)
**Evidence:** `GuiRetroAchievementsSettings.cpp:121-159` (`NOT SCANNED YET · <ready>` / `LAST <date> - COMPLETED · <ready>` / `WHEN YOU CAME ONLINE - …`, longest-first through `chooseThatFits`), `GuiOfflineScan::readyPhrase` (`:222-229`); frame `179-offline-page-after-scan-640x480-b3189ba85f.png`; French for all (`3 JEUX PRÊTS POUR JOUER HORS LIGNE` in the .po).
**Refutation attempted:** is `readyCount()` what the player means by "ready"? It counts `cached_game_ids.txt` — which `collect_cached_game_ids` fills from `patch:` rows **and** `achievementsets` rows (`es_export.py:22-39`), so a game started once through RetroArch counts as ready without a `patch` row. For RetroArch (achievementsets API) it is ready; for the achievements page the hash path serves it (D-RA-011). Consistent.

### AC-179-4 / AC-180-4: the RG SP (wording and behaviour with the maintainer's library; Wi-Fi off, a played game's achievements)

**Verdict:** SKIP ○ ×2 — handheld, the maintainer's. #184's notes 1–6 *are* the RG SP's wording round for #179's page; #180's Wi-Fi-off view was the maintainer's own observation that produced D-RA-009.

### AC-180-1: VM: link off, a cached game's page lists its achievements with badges and the player's unlocks (frame, EN/FR)

**Source:** #180 (ticked)
**Verdict:** PARTIAL ⚠
**Evidence:** `RetroAchievements.cpp:274-377` (`getGameInfoFromDevice`: patch by id, else achievementsets by hash, then unlocks — required —, queued ids, badges through the proxy's URLs), `:462-478` the offline switch, `GuiGameAchievements.cpp:170-176` the header line; frames `180-game-achievements-offline-tobu-640x480-b3189ba85f.png` (hash path), `…-bobl-…` (id path); `docs/vm-qa-log.md:73`.
**Gaps:** EN only — no `-fr` frame for either page (ls this session); the #180 comment of 08:18 promised "EN and FR frames", the 09:06 proof lists two EN frames. French msgstrs exist for the three header/dialog strings.

### AC-180-2: an achievement unlocked offline appears as earned-pending before the link returns, and as earned after the flush

**Source:** #180 (unticked)
**Verdict:** UNTESTABLE ? (dependent) — code-read only
**Evidence:** `RetroAchievements.cpp:338-348`, `:368-369` (`Pending = UnlockedOnDevice && queued`), `GuiGameAchievements.cpp:76-79` (`Unlocked - will be sent when you're connected`). The proxy's `unlocks` answer merges cached unlocks with queued awards (upstream `build_unlocks_array`, per the header of `OfflineAchievementsText.h:18-19`), so an offline unlock reads `UnlockedOnDevice`; `pending-ids` marks it `Pending`.
**Blocked by:** D-RA-006 — the QA account's one routed achievement is spent per PASS; the run that would frame this needs a reset the maintainer performs. The #180 comment says so. Not a defect in the code.

### AC-180-3: a never-cached game shows the one-line explanation, not an empty page or a spinner

**Source:** #180 (unticked)
**Verdict:** PARTIAL ⚠ (code-verified, never seen on a screen)
**Evidence:** `RetroAchievements.cpp:298-299`, `:311-312`, `:320-323` (`NotOnDevice = notCached` when the proxy answered "no cached response" for both keys); `GuiGameAchievements.cpp:39-40` the dialog `YOU'RE NOT ONLINE, AND THIS GAME'S ACHIEVEMENTS AREN'T SAVED ON THIS DEVICE YET. SCAN GAMES FOR OFFLINE ACHIEVEMENTS, OR START THE GAME ONCE WHILE YOU'RE CONNECTED.` `OfflineAchievementsTextTests` "parseError and isNotCached tell the miss from the rest" passes.
**Refutation attempted:** a proxy that does not answer at all (dead port) → `askProxy` false with curl's words → `!isNotCached` → `return ret` with `ID 0` and `NotOnDevice false` → the caller falls to the web (`:475-477`), which offline says "no connection" in its own words — a spinner bounded by HttpReq's connect timeout (10 s default for the web call). Acceptable, stated in the comment at `:465-470`.
**Gaps:** no frame; the #180 comment says Böbl had been scanned before the walk reached it. One QA walk with an unscanned ROM closes it (no achievement spent).

### AC-183-1 / AC-183-2 / AC-183-3: the startup hasher runs on the VM; the cause of (2) named; a test or frame pins it

**Source:** #183 (unticked)
**Verdict:** PARTIAL ⚠ (2) / UNTESTABLE ? (1) / FAIL ✗ (3)
**Evidence:** `ThreadedHasher.cpp:146-164`: the id is now set beside the hash and `saveToGamelistRecovery(game)` runs when it changed — the #183 comment of 14:14 names this as "at least partly" the cause of (2): a recovery file with the hash and no id, and `hasCheevos()` wanting the id. `ec2de8ae7` on the ES branch.
**Refutation attempted:** does the fix reach the disk when the hasher is interrupted by a `reboot`? `saveToGamelistRecovery` is per game, at the moment the id is decided — yes. Does `parentHash` still match after the gamelist is later rewritten? The interface's own rule (the ctl mirrors it at `:660-666`); a stale recovery file is skipped by both.
**Gaps:** (1) whether the startup hasher runs at all with `CheevosCheckIndexesAtStart` on a fresh guest is still unread ("to be read on the sixth candidate"); (3) no unit test and no frame pins the recovery-file id — `saveToGamelistRecovery` is not pure, so a walk frame (VIEW THIS GAME'S ACHIEVEMENTS appearing after a reboot) is the test. Open scope on #183, not a new punch item — but D-RA-013 now stands on this index, so #183's box 1 is load-bearing for the offline cache (F-10).

### AC-184-1: (BETA) in the row label, not the subtitle (D-UI-053)

**Verdict:** PASS ✓ (code) / SKIP ○ (frame on the device — #184's tick is the maintainer's)
**Evidence:** `GuiRetroAchievementsSettings.cpp:391` `addWithDescription(_("OFFLINE ACHIEVEMENTS (BETA)"), _("Casual achievements only."), …)`; `:254` the switch `_("OFFLINE ACHIEVEMENTS (BETA)")`; FR `SUCCÈS HORS LIGNE (BÊTA)` / `Succès en mode facile seulement.`
**Refutation attempted:** `:250` titles the page `OFFLINE ACHIEVEMENTS (BETA)` too. D-UI-053 says "the page title stays without it"; #184 note 2 and D-UI-054 say "(BETA) in the title". The code follows note 2. The register contradicts itself by one clause — F-12.

### AC-184-2: the page: (BETA) in the title, the two options first, a little space, one block; '!RA!' quoted (D-UI-054)

**Verdict:** PASS ✓ (code) / SKIP ○ (frame)
**Evidence:** `:250` title; `:254` switch; `:265` scan row; `:266` `addSpacerRow` (half a text line, `:67-76`); `:271` one `_()` block of five sentences with `'!RA!'` quoted; FR joined the same way (msgstr read this session).
**Refutation attempted:** sized to the space? The block is ~330 characters at the standard text size; at 640x480 with `fontScale` 1.31 that is on the order of six to eight wrapped lines under two rows — **no frame exists** (the sixth candidate is unbuilt), so whether the page scrolls or the block overruns is unverified (F-11). The scan row is built with its line so it is two lines tall (`:208-218`).

### AC-184-3a: turning the switch on offers the scan (D-RA-012)

**Verdict:** PASS ✓ (code) / SKIP ○ (frame)
**Evidence:** `:309-325`: online → `SCAN GAMES FOR OFFLINE ACHIEVEMENTS NOW?` + the D-UI-055 sentence, SCAN NOW / LATER (LATER last, so B answers it); offline → one line `YOU'RE NOT ONLINE. SCAN GAMES FOR OFFLINE ACHIEVEMENTS WHEN YOU'RE CONNECTED, SO ACHIEVEMENTS CAN BE EARNED WHILE OFFLINE.` FR present.

### AC-184-3b / AC-184-5b: the index and the offline cache (D-RA-013)

**Verdict:** PASS ✓ (code + guest d proof at the builder's hand) / SKIP ○ (device)
**Evidence:** ctl `list_jobs` (`:594-792`): a system with any `cheevosHash` is indexed; its games with a `cheevosId`, a file on disk and no cached id are I-jobs from id + hash; an unindexed system is walked and hashed; `topup` runs the indexed pass then `run-smart-cache` (`:1001-1048`); `topup --after-index` waits for the lock (`:545-556`) and skips the half-hour (`:976-981`). ES: `ThreadedHasher.cpp:83-85` fires it when the run identified anything and was not stopped; `GuiRetroAchievementsSettings.cpp:463-478` and `GuiMenu.cpp:1151-1154` the three INDEX rows' lines while the toggle is on; `:271` `NEW GAMES ARE ADDED THE NEXT TIME YOU'RE CONNECTED.` The #184 body: "Proven on guest d: Tobu and Böbl cached from the index with no hash lookup (`indexed=2 hashing=0`) …".
**Refutation attempted:** what does an indexed system's game with a hash the server does **not** know cost? Nothing — no id, left to the index (`:742`). What does a game added after the index cost? Nothing until the next index; the page says so. What does a *never-indexed* library cost on the first connect? `topup` mode `indexed` writes I-jobs only (`:750`, `:1006`) — so a device that never indexed gets **no** automatic caching at all; only the scan (mode `all`) or a launch caches it. The page's sentence "NEW GAMES ARE ADDED THE NEXT TIME YOU'RE CONNECTED." is true only once the index knows them; D-RA-013 says as much ("once the index knows it, which is INDEX NEW GAMES AT STARTUP's job") — and #183 says the startup index did not run on the VM. The chain is: fresh install → INDEX NEW GAMES AT STARTUP (default?) must actually run → recovery/gamelist ids → top-up. If the first link is loose, the sentence over-promises on a fresh device (F-10).

### AC-184-4: the scan dialog in complete sentences, without the API remark (D-UI-055)

**Verdict:** PASS ✓
**Evidence:** `:197-198` and `:313-314`: `THIS LOOKS AT EVERY GAME ON THIS CONSOLE AND SAVES ITS ACHIEVEMENT DATA SO ACHIEVEMENTS CAN BE EARNED WHILE OFFLINE. THIS CAN TAKE A WHILE FOR A LARGE LIBRARY.` — shared by both dialogs; no "asks RetroAchievements once per game". FR present.

### AC-184-5a: the page counts the games with achievements it added, nothing about the ones without

**Verdict:** PASS ✓
**Evidence:** `GuiOfflineScan.cpp:236-240` `GAMES WITH ACHIEVEMENTS ADDED: n`, `skipped` unused on screen; FR `JEUX AVEC SUCCÈS AJOUTÉS :` (the colon travels with its words, `527136920`).

### AC-184-A / AC-184-B: every note has a home and a frame or the maintainer's word; the branch merges for the sixth candidate

**Verdict:** PARTIAL ⚠ / SKIP ○ — every note has a home (the six commits + patch 004 + `8c03cbb6e7`), none has a frame; the merge is the next step after this audit.

### REG-RA-004: messages ride the sync cards; no monitor; the link is not mentioned; *sent* not *synced*

**Verdict:** PASS ✓ — evidence as AC-173-1/2; grep over the epic's 71 strings: no `SYNC` on an achievements sentence; `SAVES WILL BE SYNCED…` keeps the saves' verb. The row's provisional "SYNCED" wording is superseded in code; the register row still carries the provisional text with "wording provisional" — F-12(b): a row recording the final wording is owed.

### REG-RA-007: fully-offline proof, VM first, both shapes

**Verdict:** PASS ✓ — the RC-4 log and the RC-5 QA row (AC-167 entry); a game played once online (Tobu) and one never played online (Böbl, before and after the scan).

### REG-RA-010: the scan on the page, fourth-tier surface; verb scan; on-connect top-up; one outcome line under the row

**Verdict:** PASS ✓ with one tension — `GuiOfflineScan` is the fourth tier (owns the screen, refuses input, live line, no bar, stays until dismissed: `:120-153`, `:189-208`). The tension: the tier was written for "work somebody watches finish"; a full-library scan is hours (Phase 3 § cost) with the console locked and **no cancel** (F-16).

### REG-RA-011: the pages' source rule

**Verdict:** PASS ✓ — `RetroAchievements.cpp:462-478`, `:549-553`, `:568-580`, `:687-691`; `networkFailure` = not 401/403 (`:451-454`); two shapes read; `Unlocked` without a date (`GuiGameAchievements.cpp:78-79`); the queued marker (`:76-77`); the never-cached dialog; no second cache; `WebImageComponent.cpp:189-198` removes a 0-byte download. One cost note: the offline summary asks the proxy twice per cached game, sequentially (`:395-407`) — F-17.

### REG-RA-012 / REG-RA-013 / REG-RA-014 / REG-RA-016: PASS ✓ — as AC-184-3a, AC-184-3b/5b, AC-184-6, AC-164-3.

### REG-UI-053 / 054 / 055: PASS ✓ (code) — as AC-184-1/2/4; the one-clause contradiction in D-UI-053's text is F-12.

### REG-WF-020 / 021 / 022: PASS ✓ — RC-5 carried both workstreams (`docs/vm-qa-log.md:73`); #175 and #176 landed before RC-3/RC-4 (`5801ceb5fc`, `c5c50a2d5f` pins); #178 recorded and not a gate (D-WORKFLOW-022). Nothing in the audited code contradicts them.

### REG-QA-016: PASS ✓ — no handheld touched by this audit; the RG SP round is the maintainer's own (#184).

---

## Forward Audit Summary

| Verdict | Count | Criteria |
| --- | --- | --- |
| PASS ✓ | 38 | AC-163-1, -2; AC-164-1, -2, -3; AC-165-1, -2, -3; AC-166-2, -3; AC-173-4; AC-175-1, -2, -3; AC-176-1, -2, -3; AC-179-1, -3; AC-184-1, -2, -3a, -3b, -4, -5a, -5b, -6 (code); REG-RA-002, -003/005, -004, -007, -010, -011, -012, -013, -014, -016; REG-UI-053/054/055; REG-WF-020/021/022; REG-INFRA-010/011; REG-QA-016 |
| PARTIAL ⚠ | 9 | AC-165-4, AC-166-1, AC-168-2, AC-173-1, AC-173-2, AC-179-2, AC-180-1, AC-180-3, AC-183-2, AC-184-A |
| FAIL ✗ | 3 | AC-168-1, AC-173-3, AC-183-3 |
| SKIP ○ | 9 | AC-167-1/2/3, AC-179-4, AC-180-4, AC-184-B, #172, (the device halves of AC-184-1..6) |
| UNTESTABLE ? | 3 | AC-163-3, AC-180-2 (dependent on D-RA-006), AC-183-1 |

(Counts by row; AC-184-1..6 are counted once each as PASS on code with the device half SKIP.)

**Overall Assessment:** PASS WITH FINDINGS. The mechanism is sound end to end and proven on the VM in every shape the maintainer asked for; what fails is the paperwork around three criteria and the docs page, and what is partial is French frames and the unbuilt sixth candidate's screens. The defects worth fixing are in Phase 3/4: the two writers on `online_state.json`, the inherited log upload, the top-up's probe window, the untested scan path, and the cost and lock-out of a full-library scan.

## Coverage Boundary

**Examined (code-read):** every file in the brief's scope list, in full where under 600 lines and in every offline-related region otherwise (`GuiMenu.cpp`, `RetroAchievements.cpp`, `ThreadedCloudSync.cpp`, `setsettings.sh`, `runemu.sh`, `backuptool`, `rocknix-evidence`, the harness); the upstream client's `proxy_service.py`, `state.py`, `network.py`, `storage.py`, `es_export.py`, `rom_cache.py`, `image_cache.py`, `log_uploader.py`, `config.py`, `auth.py`, `smart_cache.py`, `rom_browser.py` in the regions the fork's paths reach.
**Examined (test-run):** `tools/pkgcheck` ×3; `tools/last-good-scripts-test` (whole); `es-unit-tests` (57/685); `msgfmt --check`; cross `-fsyntax-only` ×5; the ASCII-comment grep; the French coverage script.
**Examined (runtime-probed):** guest d, read-only: build id, ctl status, the unit's resolved properties, the journal for a deprecation line.
**Deliberately not examined:** the handheld (D-QA-015; the brief); any cloud account; an image build (the brief); the QA achievement (D-RA-006 — one PASS spends it); the frames of the RC-6 page (unbuilt); the upstream client's menu, Android, dArkOS/KNULLI/muOS paths (not on the image or not reached); `libraproxy_rchash.so`'s C sources (built on two arches; hashes verified by the builder against RetroArch's own).
**Dimensions not exercised:** a full-library scan's wall-clock and disk (estimated in Phase 3 from the client's constants, not measured); the two-writer race on `online_state.json` (reasoned from `state.py:62-67` and `proxy_service.py:996-1002`, not reproduced — it needs a DNS lag staged on a guest with the toggle on, which is a state change the brief allows only when a phase calls for it; Phase 4.5 decides); PPSSPP through the proxy on a guest (no PSP title with a set on the VM); a game launching *during* a scan (two writers on the sqlite — reasoned from WAL + 5 s timeout).
