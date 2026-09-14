# Audit Analysis — Epic #163 "Offline RetroAchievements" (the sixth candidate's content)

**Date:** 2026-09-14
**Spec:** the issue bodies #163 #164 #165 #166 #167 #168 #172 #173 #175 #176 #179 #180 #183 #184 and the register rows D-RA-001..014, D-RA-016, D-UI-053..055, D-WORKFLOW-020/021/022, D-QA-016, D-INFRA-010/011
**Issues:** as above; the audit issue is linked at the end
**Commits:** distribution `feature/round-notes-rc5` `95e4961fb3..cee1656c33` (+ the epic's 23 commits already on `next` since `6e35a5fd04`); EmulationStation `feature/round-notes-rc5` `df9d88171..ec2de8ae7` (+ the epic's 20 commits on `test/qa-integration` since `f050944eb`)
**Model:** Claude Fable 5.1 (`claude-fable-5-1`), effort xhigh; second opinion: the Facilitator's GPT seat (`openai/gpt-6-astra`, effort max, provider pinned) — § Second opinion

---

## Executive summary

The offline-achievements epic does what the maintainer asked (D-RA-008): with the toggle on, a casual unlock earned with no network is queued on the device and credited on reconnect at its own moment; a game never started online earns offline after the scan or the index-fed top-up; the achievements pages read the device's cache with Wi-Fi off; the toggle, the hardcore rule, the (BETA) label, the one block of text, the scan dialog's sentences and the count of games with achievements are as the RG SP round asked. Every acceptance criterion that can be proven on the VM has been, in every shape D-RA-007 named, and the harness, the unit tests, `msgfmt`, the cross-compiler syntax check and `pkgcheck` all pass on the branch tips this session. Credentials do not leak: no secret the fork handles reaches a log, a stamp, a backup or a support bundle, and no token crosses the loopback from the interface. Every guard the fork added fails closed for its reader.

What the audit found is at the seams and in the arithmetic. **Patch 004 removed the proxy's 100-game cap without inventorying what else the cap bounded**: the client's `PeriodicRefresh` re-fetches `patch` and `unlocks` for every cached game every hour the device is online, so a 1,000-game scanned library costs RetroAchievements about 41,000 requests a day per device (F-19; the seat corrected the cadence); and the client's 60-day eviction deletes the `achievementsets` rows RetroArch loads a game through while the hourly refresh keeps the `patch` rows alive, so a scanned game the player has not launched online for two months silently stops earning offline while the page still counts it "ready" (F-20). The ctl's online probe writes the state file the service owns and the interface reads (F-01); the top-up on connect gives the resolver ten seconds where #175 measured forty (F-03); the scan page refuses input for a job that can run for an hour with no way out (F-16); and the cache "follows the index" only where an index exists, which it does not by default (F-10, with #183 unresolved underneath). Two upgrade gaps (F-18, F-20), a docs page never started (F-14), a scan path with no harness case (F-04), and a handful of stale constants, body drifts and register drifts round it out.

**Verdict: PASS WITH FINDINGS — 33 findings after the second opinion: 0 Critical, 2 High, 19 Medium, 12 Low** (22 the orchestrator's, 11 the seat's confirmed additions; two of the orchestrator's re-graded upward on the seat's argument). Of 64 criteria: 38 PASS, 9 PARTIAL, 3 FAIL (the docs page; #173's proxy-off sentence, which the design superseded and nobody amended; #183's pinning test), 9 SKIP (handheld or unbuilt), 3 UNTESTABLE (one dependent on D-RA-006). The three things to fix before the sixth candidate ships beyond the maintainer's own device are F-19, F-20 and F-01; the rest are D-WORKFLOW-015's "all of them", in the order the punch list gives.

## Acceptance-criteria scorecard

| ID | Criterion (short) | Verdict | Notes |
| --- | --- | --- | --- |
| AC-163-1 | D-RA-001 settled | PASS ✓ | body box unticked (F-13) |
| AC-163-2 | milestone with its test | PASS ✓ | #179 #180 #183 #184 not attached (F-13b) |
| AC-163-3 | sub-issues attached | UNTESTABLE ? | not read from the API |
| AC-164-1 | design note | PASS ✓ | |
| AC-164-2 | D-RA-002 settled in code | PASS ✓ | |
| AC-164-3 | pin + contribute-back list | PASS ✓ | list omits the log upload (F-02b) |
| AC-165-1 | pkgcheck; builds x64 + H700 | PASS ✓ | pkgcheck ×3 run; both images exist |
| AC-165-2 | toggle on/off behaviour | PASS ✓ | harness p; partial-enable heals at boot (F-08) |
| AC-165-3 | backup: toggle yes, token never | PASS ✓ | harness k run; spot re-verification #1 |
| AC-165-4 | frames 640/1280 EN/FR | PARTIAL ⚠ | frames are of the RC-2/3 page, none of RC-6's (F-11) |
| AC-166-1 | scenario passes, QA log, frames EN/FR | PARTIAL ⚠ | EN only (F-11c) |
| AC-166-2 | the control | PASS ✓ | |
| AC-166-3 | fixture in the suite list | PASS ✓ | |
| AC-167-1/2/3 | the handheld round | SKIP ○ | the maintainer's; VM halves done |
| AC-168-1 | docs page prepared | FAIL ✗ | none (F-14) |
| AC-168-2 | upstream PRs or reasons | PARTIAL ⚠ | reasons recorded; one item missing (F-02b) |
| #172 | per-core, parked | SKIP ○ | |
| AC-173-1 | exit sentence EN/FR | PARTIAL ⚠ | EN frame; toast path unframed |
| AC-173-2 | recorded sentence within a minute | PARTIAL ⚠ | "within a minute" contradicts D-RA-004's no-monitor design (F-13) |
| AC-173-3 | proxy off: award not recorded | FAIL ✗ | not built, by design; body not amended (F-13) |
| AC-173-4 | fixture drives it | PASS ✓ | |
| AC-175-1/2/3 | #175 | PASS ✓ ×3 | tests run |
| AC-176-1/2/3 | #176 | PASS ✓ ×3 | harness r, s run; spot re-verification #2 |
| AC-179-1 | Böbl offline after the scan | PASS ✓ | the unlock clause rides AC-166-1 |
| AC-179-2 | never offline / cap / logs | PARTIAL ⚠ | probe writes the shared file (F-01); mark before probe (F-03); stale cap words (F-07); no case (F-04) |
| AC-179-3 | the page's ready line EN/FR | PASS ✓ | |
| AC-179-4 / AC-180-4 | RG SP | SKIP ○ | |
| AC-180-1 | offline page with badges EN/FR | PARTIAL ⚠ | EN frames only |
| AC-180-2 | earned-pending marker | UNTESTABLE ? | dependent on D-RA-006 |
| AC-180-3 | never-cached dialog | PARTIAL ⚠ | code + tests; no frame |
| AC-183-1 | startup hasher runs on the VM | UNTESTABLE ? | open on #183; load-bearing for D-RA-013 (F-10) |
| AC-183-2 | cause of (2) named | PARTIAL ⚠ | the recovery id, "at least partly" |
| AC-183-3 | test or frame pins it | FAIL ✗ | none |
| AC-184-1..6 | the six notes | PASS ✓ (code) / SKIP ○ (device) | title clause vs D-UI-053 (F-12a); no RC-6 frame (F-11) |
| AC-184-A / B | homes + frames; merge | PARTIAL ⚠ / SKIP ○ | |
| REG-RA-002/003-005/004/007/010/011/012/013/014/016 | | PASS ✓ | D-RA-004 still "provisional" (F-12b); D-RA-010's tier overrun (F-16); D-RA-011's summary cost (F-17) |
| REG-UI-053/054/055 | | PASS ✓ | F-12a |
| REG-WF-020/021/022, REG-INFRA-010/011, REG-QA-016 | | PASS ✓ | |

**Pass rate:** 38 of 52 decidable criteria fully met (73%); 9 SKIP and 3 UNTESTABLE excluded.

## Code quality assessment

**Strengths.** A single backend (`raofflineproxy-ctl`) with a written contract (`>>>` lines, stamps, exit codes shared with `CloudExit.h`); every setting written is read back; pure text isolated and tested (`OfflineAchievementsText`, `CloudText`, `CheevosRetry` — 57 cases); uncached `exists()` wherever another process writes; the fourth-tier page follows `GuiCloudTransfer`'s geometry so two long-job pages sit the same; upstream-ready patch headers with the reasoning; the index rule mirrors the interface's own recovery-file semantics; the credential story is complete and mechanically proven (cases k, p, r, s).

**Concerns.** The ctl is 1,086 lines of shell with an embedded 200-line Python program — `list_jobs` would be a module beside `raofflineproxy-cache-indexed` with a test. `write_stamp`'s return is unchecked. `CACHE_CAP` and the 100-games sentence outlived their decision. The synchronous `executeScriptLegacy` on the UI thread in the toggle's `apply` (`disable` can wait on `TimeoutStopSec=15`). `getUserSummaryFromDevice` is O(2N) loopback requests with no fail-fast.

**Complexity hotspots.** `raofflineproxy-ctl` `run_jobs`/`do_scan`/`do_topup` (`:818-1067`); `GuiOfflineScan::update` (seven rows × two states); `setsettings.sh` `set_cheevos` runs in the background (`:1335`, upstream's shape).

## Cornerstone conformance

**Overall:** HIGH on the instruction files, MEDIUM on the register/tracker discipline. Findings (⚠/✗ only, from 03 § 3.2): `engineering-practices` § *Before deleting a duplicate, diff its behaviours* — patch 004 (F-19/F-20); `upgrade-and-install` — F-18, F-20, F-10; `es-native-ui` tiers — F-16; `documentation-accuracy` — F-14; `decision-register`/`issue-tracking` — F-12, F-13; blindspots 10, 23, 27 repeated in shape, 43 half.

## Spec fidelity

**Aligned:** D-RA-001..014, 016; D-UI-053 (row and switch), 054, 055; D-RA-004 as superseded.
**Diverged:** D-UI-053's clause "the page title stays without it" vs the shipped title (D-UI-054's application) — a register contradiction to resolve by a refining row, not a code change; D-RA-004's provisional "SYNCED" vs shipped "SENT" — a row recording the final wording; #173 AC3 and AC2 "within a minute", #179 AC2 "the cap", #163's two decided boxes — body edits (blindspot 27).

## Missing artifacts

Ten, each with its search trail in 03 § 3.6: the scan/topup harness case; French frames of the cards and pages; any frame of the RC-6 page; the rocknix.org page; register rows for the final wording and the (BETA) title; D-RA-015; the log-upload item on #168; a cancel/background path on the scan page; the milestone on four issues; a bound on the hourly refresh.

## Risk assessment

| Risk | Severity | Impact | Mitigation |
| --- | --- | --- | --- |
| F-19 hourly whole-library refresh (2 GETs/game per pass, an hour after each pass, uncapped by patch 004) | **High** | ~41k requests/day/device at 1,000 games; the proxy's UA is registered with RA — rate-limiting or revocation would hit every ROCKNIX user | patch 005: refresh recently played or rows older than a day, daily cadence with jitter; upstream the same |
| F-20 (+ G-01) 60-day eviction removes `achievementsets` rows nothing refreshes, and a `patch` row committed before a failed `unlocks`/`achievementsets` fetch counts the same way; `patch` rows keep the game "ready" | **High** | scanned games silently stop loading offline in RetroArch after 60 days; the page over-counts | refresh `achievementsets` beside `patch`, or spare rows whose game is exported, or treat a missing row as uncached in the top-up |
| F-01 the ctl's probe writes `online_state.json`; the monitor rewrites only on a transition | Medium | a stale `false` puts the pages on the device's copy while online (needs a flapping resolver; a plain lag self-corrects) | probe into a file of the ctl's own |
| F-03 top-up marks its attempt before a 10 s probe window | Medium | the first connect after boot is refused on the #175 boot shape; nothing schedules a retry — the next link change or index run is the next chance | probe on the `CheevosRetry` schedule; mark after a successful probe or a refusal |
| F-04 no harness case for scan/topup/ready | Medium | 600 lines proven only by hand on one guest | a bwrap case with shims and fixtures |
| F-10 the index is off by default; the page promises new games are added | Medium | a fresh device caches only recently played games; the sentence over-promises; #183 unresolved | offer/turn on INDEX NEW GAMES AT STARTUP with the toggle; sentence conditional |
| F-16 no cancel or background on a scan that runs ~40–45 min at 1,000 games (images overlap the API calls) | Medium | the console locked; quitting ES waits on the scan | B leaves it running; the row's line reports |
| F-18 RC-5 recovery files with a hash and no id are skipped by the startup index | Medium | those games never gain an id → no `hasCheevos()`, no I-job | a lookup-only pass in the hasher |
| F-17 offline summary = 2 loopback requests per cached game, no fail-fast | Medium | tens of seconds at 1,000 games; 15 s × N on a hung proxy | one bulk read; fail-fast |
| F-11 no frame of the RC-6 page or French cards | Medium | the longest block the fork shows is unseen at 640x480 | frames on the sixth candidate (#184's own line) |
| F-14 no docs page | Medium | phase 5's hard gate | draft the page |
| F-02 automatic log upload path present, unreachable on this image (JSON backend only) | Low | a defensive gate and an upstream item | patch or upstream issue |
| F-05 `qa-accounts clear` leaves the proxy's token cache | Low | five hand removals so far | clear removes the folder when a `login2` row exists |
| F-06 web key in curl argv on the host | Low | visible in `ps` for a second | `curl -K -` over stdin |
| F-07 `CACHE_CAP=100`, `THE LIMIT OF 100 GAMES WAS REACHED.` | Low | false words in a log and a string | remove / reword |
| F-08 partial `enable`: a `hardcore_was` write failing after `KEY=1` leaves the toggle **on** in `system.cfg` with `enable` returning 1 | Medium (re-graded on the seat's argument) | the page reverts its switch; the boot pass and the launchers honour the 1 | write the toggle last and roll back on any failure |
| F-09 `MAX_SCAN_ENTRIES=5000` caps the walk **before** cached paths are removed | Medium (re-graded) | every scan walks the same first 5,000; entry 5,001 is never reached | filter cached paths during the walk, or resume from a cursor |
| F-12 register: D-UI-053 clause; D-RA-004 provisional; no D-RA-015 | Low | two rows disagree; one row is stale | refining rows |
| F-13 bodies: #173 AC2/AC3, #179 AC2, #163 boxes, milestone on four issues | Low | blindspot 27 | body edits |
| F-15 account name in `service.log` (not bundled) and `exec.log` (bundled, unmasked) | Low | a public identifier | upstream: redact `u=`; fork: leave |
| F-21 es-code-traps recipe lacks `-DRAPIDJSON_INCLUDE_DIR` | Low | the documented command fails | one flag in the rule |
| F-22 the ctl reads upstream's sqlite schema with no version check | Low | a schema change → `cannot_tell` (fail-closed, silent) | note in the ctl; an upstream item |
| G-02 cached ids ignore the account and the hash | Medium | a second account or an alternate dump is skipped as cached | key readiness by user and hash |
| G-03 scattered failures still end `COMPLETED` | Medium | D-UI-030 broken; the page over-claims | any unresolved caching error → COULDN'T FINISH |
| G-04 one refresh error kills the refresh thread | Medium | no refresh (and no eviction) for the service's lifetime | a try/except per game; backoff |
| G-06 malformed answers become valid empty progress | Medium | every badge locked / an empty summary shown over the web's error | validity separate from emptiness |
| G-07 the toggle's `apply` blocks the UI thread | Medium | a stalled stop freezes the interface up to 15 s | run the ctl off-thread; disable the row while pending |
| G-08 the 15-minute top-up bound is not enforced across listing and both passes | Medium | a hook that can run 30+ min | one deadline for the run |
| G-10 the credential filter passes `.key=` and single-quoted values | Medium | a sanitizer gap in the one guard (no current writer) | extend the shapes; canary tests |
| G-11 `disable` does not stop a running scan/top-up | Medium | requests and writes continue after the toggle is off | cooperative cancellation |
| G-05 an unreadable hardcore setting routes through the proxy; PPSSPP's unquoted master test | Low | a consistently softcore session; an upstream line | treat unreadable as direct; quote the test |
| G-09 `flushed` read-then-unlink race | Low | a stamp lost or reported twice | rename first |
| G-12 shared `.tmp` for one badge across pools | Low | duplicate downloads; cleanup interference | unique temp names |

## Coverage boundary

As 02 § Coverage Boundary, plus: the cost table (03 § 3.8) is arithmetic from the client's constants, not a measurement; the two-writer race (F-01) and the 60-day eviction (F-20) are reasoned from code, not reproduced; PPSSPP through the proxy is code-read only (no PSP title with a set on the VM); nothing was run on a handheld or against a cloud account; no image was built.

## Second opinion (the Facilitator's GPT seat)

**Run:** `tools/council/run invoke --member gpt --prompt-file gpt-brief.md --output gpt-6-astra-audit.md` (per-attempt timeout raised to 1500 s). **Identity gate:** `final.verification.observed = openai/gpt-6-astra`, `model_identity_source = provider_response`, provider `openai` pinned, `allow_fallbacks: false`; effort `max`, 38,042 reasoning tokens; HTTP 200, one attempt, 1,415 s; output sha256 `46a29e9c…`. Raw output and provenance under `second-opinions/`. The seat worked from a 323 KB self-contained brief (this audit's findings, the seven questions, primary excerpts from both trees and the client) and ran nothing.

The seat's verdict: "The blanket PASS on fail-closed behavior does not stand … RC-6 needs correctness fixes and fault-injection coverage before sign-off." Every one of its 8 disagreements and 12 additions was graded against the tree (and, where a command could settle it, run):

| Seat item | Orchestrator's grade | Evidence |
| --- | --- | --- |
| F-02 not demonstrated as an upload | **agree** (already Low after 4.5) | `storage.py:41` |
| F-03 "the next is 30 minutes away" understates it: nothing schedules a retry; only the next link event or an after-index run does | **agree, sharpened** — the finding now reads "no retry until the next link change" | `ctl:976-994`; `NetworkThread.cpp:207-222` |
| F-08 Low → Medium: a `hardcore_was` write that fails after `KEY=1` lands leaves the toggle **on** in `system.cfg` while `enable` returns 1 and the page reverts its switch — a persistent inconsistency the boot pass then honours | **agree, Medium** | `ctl:293-304` read again: the read-backs fail in order KEY, HARDCORE, HARDCORE_WAS; KEY is already 1 |
| F-09 Low → Medium: `MAX_SCAN_ENTRIES` stops the walk **before** cached paths are removed, so every scan walks the same first 5,000 and never reaches 5,001 — permanent starvation, not one truncated pass | **agree, Medium** | `ctl:776-784`: `walked` capped, then `hash_jobs = [p for p in walked if … not in cached_paths]` |
| F-10 narrowed: turning RETROACHIEVEMENTS on starts the hasher once (`:529-531`), so a clean install is not necessarily unindexed; the unconditional promise about *later* additions still fails | **agree, narrowed** | `GuiRetroAchievementsSettings.cpp:529-531` |
| F-15: `exec.log` **is** bundled with `cheevos_username` | **agree** — the risk row said "not bundled" of `service.log`; corrected to name both files | `rocknix-evidence:176` |
| F-16/F-19 arithmetic: images download concurrently with the API calls (~40 min media overlapping ~25–30 min metadata → a 1,000-game scan ≈ 40–45 min, not 1–1.5 h); `PeriodicRefresh` waits an hour **after** each pass, so ≈ 41,000 GETs/day, not 48,000 | **agree**, figures corrected below; both severities unchanged | `rom_cache.py:174-182`; `proxy_service.py:1021` `stop_event.wait(interval)` at the top of the loop |
| F-18 narrowed to "games indexed in a session that ended without a clean exit" | **agree** — that is what 02/03 say | |
| F-20: the handler tail was cut from the brief | **the tail was read here** (`proxy_service.py:644-682` ends `return error_json(503, "no cached response")`, no rebuild) — High stands | this session's read |
| F-11/F-14/F-21/F-13 negatives unverifiable from the packet | **verified here by command** (ls, grep, cmake run, issue JSON) — stand | 02, 03 § 3.6 |
| **G-01 High** — a committed `patch:` row alone classifies a game as cached; a failure in `cache_unlocks`/`cache_achievementsets` after it leaves a game that is "ready", never repaired, and unloadable offline | **confirmed** — same mechanism class as F-20; folded into PL-02's fix (completeness predicate) | `rom_cache.py:448-474` write order; `es_export.py:25-28`; `ctl:745` |
| **G-02 Medium** — `collect_cached_game_ids` ignores the account and the hash in the key, so a second account (the QA account and the maintainer's on one guest) or an alternate dump of a cached game is skipped; `resolve_credentials` prefers cached credentials without checking the user | **confirmed** — new PL-23 | `es_export.py:22-39`; `auth.py:42-52`; `ctl:745` |
| **G-03 Medium** — scattered per-game failures (fewer than three in a row) end in `COMPLETED` with rc 0 | **confirmed** — new PL-24 (D-UI-030: parts that disagree are COULDN'T FINISH) | `helper:147-179` returns 0; `ctl:863-872`, `:942-949` |
| **G-04 Medium** — `PeriodicRefresh.run` has no exception boundary; one `CacheGameError` kills the daemon thread for the service's lifetime | **confirmed by grep** (no `try` in `:1021-1057`) — new PL-25, upstream item; incidentally it also stops the eviction | this session |
| **G-05** — a failed hardcore read routes through the proxy; PPSSPP's unquoted `[ ! ${enabled} = 1 ]` | **partly** — the same empty read also writes `cheevos_hardcore_mode_enable` empty, so the session is consistently softcore and RA judges by RetroArch's `h=` flag; no hardcore award is lost. The PPSSPP test is upstream ROCKNIX's 2022 line, not the fork's. **Low** — new PL-31 (quote the test; treat an unreadable hardcore as "direct") | `setsettings.sh:472`, `:512`; `cheevos_ppsspp.sh:21` |
| **G-06 Medium** — malformed 200 `unlocks` → empty → every badge locked; a summary whose every lookup failed still sets `Username`/`FromDevice` and is accepted over the web's error | **confirmed** — new PL-26 | `RetroAchievements.cpp:329-336`, `:405-407`, `:438-439`; `:575-576` |
| **G-07 Medium** — the toggle's `apply` runs the ctl synchronously on the UI thread; a stalled `systemctl stop` (15 s) freezes the interface | **confirmed** (noted in 02's AC-165-2 read, not raised) — new PL-27; answers the maintainer's "UI thread never blocked" with a no | `GuiRetroAchievementsSettings.cpp:287-288`; unit `TimeoutStopSec=15` |
| **G-08 Medium** — the 15-minute top-up bound is not one: listing is untimed, the helper gets a fresh 900 s, only the smart pass uses the remainder; `--after-index` may wait 900 s first | **confirmed** — new PL-28 | `ctl:997-1029`, `:545-556` |
| **G-09 Low** — `flushed` reads then unlinks: a stamp replaced between `head` and `rm` is lost; two readers could report one | **confirmed** — new PL-32 (rename-then-read) | `ctl:440-449` |
| **G-10 Medium** — the credential filter passes `global.retroachievements.key=<value>` and `password='<value>'` (single quotes) | **confirmed by canaries this session** (GNU sed; the regex shape is the question): both survived, `t=` after a space survived too; the double-quoted and bare shapes were redacted. No current writer logs those shapes; D-INFRA-011 makes the helper the one guard — new PL-29 | `001-functions:72-78` |
| **G-11 Medium** — `disable` stops the unit, not a running `scan`/`topup` helper, which keeps requesting and writing | **confirmed** — new PL-30 | `ctl:310-333` vs `:825-829` |
| **G-12 Low** — concurrent downloads of one badge share a `.tmp` path across the helper's and the service's pools | **confirmed as read** — new PL-33, upstream item | `image_cache.py:150-195` |
| Wording: `Enregistre aussi leurs succès…` drops "achievement data"; "EVERY GAME ON THIS CONSOLE" vs `SCAN_SYSTEMS` + the 5,000 cap | **agree as nits** — folded into PL-17 (the cap) and PL-10's frame pass (the French line) | |
| Wording: five sentence-case msgids "with no rule exempting them" | **disagree** — the RA settings page's descriptions are sentence case by the maintainer's call of 2026-09-13 (#166, RC-2), and `Unlocked…` matches `Points`/`Unlocked on` beside it (D-RA-011) | #166 comment 19:38 |
| "The C++ tails contradict the claimed syntax checks" | **the brief's `sed` ranges cut mid-function**; the files compile (cross `-fsyntax-only` ×5, this session) | 02 header |

**Net effect of the second opinion:** 11 new punch items (PL-23..PL-33), two re-graded upward (PL-16, PL-17), one folded (G-01 → PL-02), two figures corrected (03 § 3.8's wall clock and daily count). The seat's ranked enhancements agree with this audit's on the top five and add "fault-injection coverage" as the frame for PL-05/PL-24/PL-26 — adopted.

## Finding verification (Phase 4.5)

| Finding | Severity (before → after) | Survived refutation? | What was checked |
| --- | --- | --- | --- |
| F-19 | High → **High** (seat: agree) | yes | `proxy_service.py:1022-1057` re-read: `is_online()` and credentials gate it, then **every** `PREFIX_PATCH` row, no slice, no cooldown, no age check (`rom_cache.py:140-176`); `http_get` throttled 0.3 s only. Upstream's cap was the only bound; patch 004 removed it. |
| F-20 | High → **High** | yes | `storage.py:479-493` deletes every `api_cache` row with `cachedAt < now-60d` except `login2::*` and the UA row; `get_cache` (`:304-334`) is a plain SELECT — no touch; the refresh loop upserts `patch`, `unlocks`, `startsession` only; `proxy_service.py:644-668` serves offline `achievementsets` from cached rows only, no rebuild from `patch`. `gameid:` alias rows age out the same way. |
| F-01 | High → **Medium** | yes, reduced | `main.py:541-542` (the ctl's `probe-online` writes); `proxy_service.py:986-1001` (the monitor writes at start and on transition only); `state.py:62-67` non-atomic. Reduced because a DNS lag fails the monitor's probe too (every 15 s, forced), which then writes `false` and later `true` — the stale case needs the ctl's probe to fail while the monitor's succeeds inside one 15 s tick (a flapping resolver). Both readers fail closed on a torn file. |
| F-02 | High → **Low** | **no, as a High** | `storage.py:41` `_use_sqlite = sqlite3 is not None` — always sqlite on this image; `record_incident` is called only from `_quarantine_corrupt_json_unlocked` (`:165-182`), the JSON backend's path; `retry_storage_corruption_report` gates on an incident. The upload is unreachable on ROCKNIX; the menu path that could call `upload_logs` is not drawn here. Kept as a defensive gate + upstream note. |

Hedges removed: none of the four carries "suggests" language; F-01's reduced likelihood is stated as the mechanism.

## Instruction file recommendations

### Coverage gaps (would-have-prevented)

| Finding | Would have been caught by | Uncovered? |
| --- | --- | --- |
| F-19, F-20 | `engineering-practices.md` § Before deleting a duplicate, diff its behaviours (read as: before removing a bound, list what it bounds) | — |
| F-18 | `upgrade-and-install.md` § Fixing forward is not enough | — |
| F-10 | `upgrade-and-install.md` § The two questions (clean install) | — |
| F-01 | `engineering-practices.md` § Guards must fail closed — covers the reader, not a writer | **partly** |
| F-03 | (none: no rule says a probe window must be sized from a measured lag) | **YES** |
| F-16 | `es-native-ui.md` § tiers — the table says when the fourth tier is right, not what a job over an hour needs | **partly** |
| F-04 | `engineering-practices.md` § A failure you find is yours to fix ("close the hole") | — |
| F-12, F-13 | `issue-tracking.md`, `decision-register.md` | — |
| F-14 | `documentation-accuracy.md` | — |
| F-05, F-06 | `generic-x64-vm-testing.md` § credential filter; #151 PL-09's stdin rule (in a punch list, not a rule) | **partly** |

### Codification gaps (needs-new-rule)

| Pattern | Instances | Recommendation |
| --- | --- | --- |
| P-01: a bound or cap removed without enumerating its dependants (the refresh, the eviction, the smart-cache limit) | F-19, F-20, F-09 | **Extend** `engineering-practices.md` § Before deleting a duplicate with a paragraph "Before removing a limit, list what it limits": grep the constant's readers and the loops that assume its ceiling; state each one's new bound or say it has none. |
| P-02: a probe or retry window sized by feel against a lag the project has already measured | F-03 (10 s vs #175's 20–45 s), and #175 itself | **Extend** `engineering-practices.md` with "Size a wait from a measurement": name the measurement the window is sized from; the token check's 9×10 s is the precedent to reuse. |
| P-03: a fourth-tier page for a job whose length is unbounded by the page | F-16, and `GuiCloudTransfer` for a first full backup | **Extend** `es-native-ui.md` § tiers: a job that can run past what a player will watch needs a way to leave it running (B) or a bound per press, and the row's line carries the rest. |

### Recommended action sequence

1. Land the two client patches (005 refresh bound, 006 keep `achievementsets` alive) and raise both upstream with the numbers from 03 § 3.8.
2. Fix the ctl's probe file (F-01) and the top-up's window (F-03) in one commit with a harness case (F-04) that pins both.
3. The interface: the scan page's B (F-16), the index offer (F-10), the hasher's lookup pass (F-18), the summary's bulk read (F-17).
4. Tracker and register pass (F-12, F-13), the stale words (F-07), the tools (F-05, F-06), the rule edits (P-01..P-03, F-21).
5. Frames on the sixth candidate (F-11), the docs page (F-14).

## Quality self-check

| Item | Status |
| --- | --- |
| Acceptance-criteria scorecard present, IDs match 02 | present |
| Cornerstone conformance tables present | present (03 § 3.2, summarised above) |
| Coverage boundary present (02 + 04) | present |
| Finding verification recorded for all Crit/High | present (4 findings, one killed as a High) |
| Instruction file recommendations (epic tier) | present |
| Tier B visual-QA consolidation present | present as F-11 and the frames noted per criterion; no design-review process exists here |
| Verdicts use the defined vocabulary only | yes |
| Traceability / Evidence / Reproducible / Actionable / Complete | self-checked: every finding cites file:line or a run; every PASS has a refutation line; the cost table's inputs are named constants |

**Tracker:** [#186](https://github.com/maxengel/rocknix/issues/186) — one checkbox per punch item, every severity (D-WORKFLOW-015).
