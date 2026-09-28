# Stream D audit — seat review of the delivered diff against the plan

Corpus: the eight embedded sources (provenance block at the end). Everything below is read from `D.diff`, `D.harness.txt`, `D.plan.md`, `D.report.md` and the four rule files. Nothing was re-read from disk or re-hashed.

---

## 1. Per punch item

### PL-013 — cancel during the image pass · **holds in part**

**What the diff does.**
- Helper (`raofflineproxy-cache-images`, hunk `@@ -314,9 +374,16 @@` … `@@ -328,36 +395,84 @@`): the pool is no longer a `with` block (`pool = ThreadPoolExecutor(max_workers=4)`); `except KeyboardInterrupt: pool.shutdown(wait=False, cancel_futures=True); raise`; after the loop `pool.shutdown(wait=False, cancel_futures=True)` and, if anything is still running, `leave(code)` → `os._exit(code)`. `__main__` re-installs `signal.default_int_handler` and on `KeyboardInterrupt` prints `>>> why CANCELLED` and `leave(130)`.
- ctl (`run_image_pass`, hunk `@@ -1310,19 +1635,50 @@`): the helper now runs in the background under `timeout`, with `CLIENT=$!; wait "${CLIENT}"`, so a trapped INT/TERM returns from `wait` and the EXIT trap's `kill "${CLIENT}"` reaches it.

**What holds.** The named mechanism (interrupt caught inside the loop, `shutdown(cancel_futures=True)`, no `with`-block drain) is present in the helper, and the ctl side no longer blocks in a foreground command. Harness D1 drives the real helper with 40 slow downloads and SIGINT (report: `exit -2 after 10.02s, 40 started` → `exit 130 after 0.00s, 4 started`); the D1 ctl case times image-pass-start-to-exit under 2 s.

**What is missing.** (a) The acceptance is a frame series on the guest; not in the packet, and the report says so. (b) See G-D-03: under real coreutils `timeout` the helper sits in its own process group, so the ctl-driven cancel does not travel the KeyboardInterrupt path at all; the harness shims `timeout` (its comment: "the harness's shim hands the budget to the child as FAKE_BUDGET"), so the real signal path is untested.

### PL-055 — index-pending consumed before the listing · **holds**

`do_topup` (hunk `@@ -1581,13 +1980,18 @@`): the `rm -f "${INDEX_PENDING}"` before `list_jobs` is gone; `LISTED=1` is set only on `LRC -eq 0`; removal is `if [ "${LISTED}" -eq 1 ] && [ -z "${WHY}" ] && [ -e "${INDEX_PENDING}" ]` (hunk `@@ -1619,6 +2025,14 @@`), after the indexed pass. A listing that fails (rc 1), times out (124), a failed game (WHY set) and a TERM part-way all keep the marker — D2 covers each, and every case reads `marker: gone` at base per the report. Acceptance ("a listing that fails leaves the marker") holds.

The stream added a storm guard the item did not ask for (`PENDING_DUE`, hunk `@@ -1517,8 +1907,15 @@`): a kept marker bypasses the half hour only if it is `-nt` the last attempt mark. Disclosed; see G-D-10.

### PL-057 — summary reads only `patch:` rows; unreadable unlocks read as none · **holds** (ctl side)

`do_summary` (hunks `@@ -588,14 +649,43 @@`, `@@ -603,24 +693,43 @@`): a second query over `achievementsets:%:<user>`, `set_achievements()` choosing the `Type == "core"` set else the first, `found[gid]` with the patch row winning when it has a core set (`not (gid in found and found[gid][2])`); `unlocked = None` when the row is missing, unparseable, `Success is False` or `UserUnlocks` is not a list, emitted as JSON `null`. D3 seeds exactly the acceptance's two cases and passes.

Boundary: the field names (`GameId`, `Sets`, `Type`, `ImageIconUrl`) are the fixture's, authored by the same stream; whether the pinned client stores the RA response in that shape is outside the packet. The report notes ES's `jsonInt` reads `null` as 0, so the player sees nothing different until E2 acts — the ctl half holds, the end-to-end outcome is deferred.

### PL-058 — refresh reports success over a failed drop · **holds**

`raofflineproxy-refresh` (hunk `@@ -81,7 +87,7 @@`): `raise RuntimeError(...) from exc` replaces the swallowed `note()`. `drop_startsession` is called inside the per-game `try`, so the failure lands in `failed += 1` (hunk `@@ -214,8 +225,9 @@`). D4 `drop` case: `re-read 1 game(s), 0 failed` → `re-read 0 game(s), 1 failed, exit 1`.

### PL-059 — no cursor past uncacheable files; truncation not on the page · **holds in part**

`list_jobs` Python (hunk `@@ -1106,10 +1387,46 @@` … `@@ -1126,28 +1443,36 @@`): a circle from `scan-cursor` — `before`/`after` lists split at the cursor file, `candidates = after + before`, `walked = candidates[:MAX_SCAN_ENTRIES]`, `truncated = 1 if len(candidates) > MAX_SCAN_ENTRIES`, cursor written (temp+rename) as `walked[-1]` or removed. The cursor file itself lands in `before` (appended before `passed` flips), so the next walk starts after it — correct. ctl (hunk `@@ -1466,12 +1843,21 @@`): `[ "${TRUNC}" -eq 1 ] && tell "note TRUNCATED"`; `write_stamp` gains `${11}` → ` truncated=1`.

Missing: the acceptance's 5,001-file scale is replaced by `RA_TEST_SCAN_CAP=10` over 13 files (D5; a fair scaling, disclosed), and "the page's frame reads the note" is a guest proof not in the packet. Whether `CloudText::parseScanStamp` / `GuiOfflineScan` know `truncated=1` and `note TRUNCATED` is an ES claim outside the packet. See G-D-06 for a behaviour the cursor introduces.

### PL-060 — image-pass failures dropped; nothing-new scan never repairs · **holds in part**

`run_image_pass` exports `R_IMAGES_WHY=SOME_IMAGES_NOT_SAVED` for every exit but 0 and 3 (hunk `@@ -1310,19 +1635,50 @@`); `do_scan`'s nothing-new branch now runs the pass and stamps its why (hunk `@@ -1437,17 +1803,28 @@`); the jobs path takes it when the games' own why is empty (hunk `@@ -1466,12 +1843,21 @@`); `do_topup` stamps `1 topup … why=SOME_IMAGES_NOT_SAVED` and exits 1 (hunk `@@ -1672,7 +2091,14 @@`). D6/D6b/D19 cover fail, nothing-new, verify-left (exit 3), crash (exit 1 no why), absent-vs-transient.

What does not hold: the jobs path still gates the pass on `[ "${R_CACHED}" -gt 0 ]` — a scan that listed jobs and cached none runs no image pass and stamps `COMPLETED`. Since uncacheable ROMs are listed on every scan by design, this is the common shape, not the rare one. See G-D-02.

---

## 2. Findings

### G-D-01: Four sweep rows are reported fixed in `cheevos_armsx2.sh`, and the diff has no change to that file
- **Severity:** High
- **Category:** Evidence / delivery
- **Where:** `D.diff` (entire); `D.report.md` sweep table rows claude F-EM-03, claude F-EM-09, gpt F-EM-03, gpt F-EM-05 (all `a7fa6ee786`); `D.harness.txt` D14.
- **What:** The plan gives stream D `projects/ROCKNIX/packages/emulators/**/cheevos_*.sh`. The diff contains `cheevos_ppsspp.sh` and nothing for `armsx2-sa/scripts/cheevos_armsx2.sh`. The report claims a whole-file awk rewrite with a 0600 temp file and six D14 checks that failed at base.
- **Failure scenario:** If `a7fa6ee786` did not reach `next`, the F-EM-03 defect (Token lines regrow under a second `[Achievements]` header, Medium) ships while marked fixed. If it did and the packet omitted it, this seat has audited nothing of it.
- **Evidence:** Searched the diff for `armsx2`, `secrets.ini`, `Token`: no hunk. The D14 harness cases do exist and read the script through `src_of`, so a merged suite would FAIL loudly if the change is absent — that bounds the risk, provided the integrator runs the suite. One visit settles it: `git log 417dcd8610..next -- projects/ROCKNIX/packages/emulators/standalone/armsx2-sa/scripts/cheevos_armsx2.sh`.

### G-D-02: The scan's image pass is skipped whenever jobs were listed but none cached, so SCAN does not repair images on the ordinary library
- **Severity:** Medium
- **Category:** Outcome vocabulary / correctness (PL-060)
- **Where:** `raofflineproxy-ctl` `do_scan`, hunk `@@ -1466,12 +1843,21 @@`: `[ "${R_CACHED}" -gt 0 ] && run_image_pass scan "${IMAGE_PASS_SECONDS}"` (only the `|| true` was removed); contrast the nothing-new branch, hunk `@@ -1437,17 +1803,28 @@`, which runs the pass unconditionally with the comment "pressing SCAN again is how a player asks for them".
- **What:** The nothing-new branch is reached only when every candidate file is already cached. PL-059's own comment says a ROM RetroAchievements does not know "is skipped, and stays uncached", so any library with one unsupported file has `NEW > 0` on every scan. If every job is then skipped (`R_CACHED = 0`), no image pass runs and the stamp reads `0 scan cached=0 …` — `COMPLETED` over missing badges, the shape PL-060 was filed for.
- **Failure scenario:** 300 cached games with badges missing after a cut pass; three homebrew ROMs in `/storage/roms/gb`. Every SCAN lists three jobs, skips three, stamps COMPLETED; the badges are never fetched by SCAN. Only a top-up that reaches its own pass, or a scan that happens to cache something new, repairs them.
- **Evidence:** The gate is unchanged from base except for `|| true`. Harness D6's "nothing new" case (`rm -f helper-plan; tctl scan`) only exercises `NEW = 0`; no case has `NEW > 0, R_CACHED = 0`. The report's PL-060 risk note ("a scan with nothing new now walks the whole store") shows the stream saw the nothing-new branch as the repair path and not the skipped-only one.

### G-D-03: Under real `timeout` the helper is in its own process group; the ctl-driven cancel works by TERM forwarding, not by the mechanism the item and the helper's comments name, and the harness never runs the real path
- **Severity:** Medium
- **Category:** Concurrency / mechanism mismatch (PL-013, gpt F-RA-10/11)
- **Where:** `raofflineproxy-ctl` `run_image_pass`, hunk `@@ -1310,19 +1635,50 @@`: `timeout "${SECONDS_LEFT}" "${IMAGE_HELPER}" … &; CLIENT=$!`; `do_images` and `do_refresh` likewise. `raofflineproxy-cache-images` `__main__`, hunk `@@ -1310,…` region ending the file: the comment "the page's CANCEL, a SIGINT to the whole process group, would not reach it. Taken back here".
- **What:** GNU coreutils `timeout` (the package.mk comment says the image's `timeout` is coreutils') calls `setpgid(0,0)` unless `--foreground`, so the helper is no longer in the run's process group. A SIGINT to the group reaches the ctl only; the ctl's trap does `kill "${CLIENT}"` — SIGTERM to `timeout`, which forwards SIGTERM to the helper, which has no SIGTERM handler and dies at once. Net effect: the run stops promptly, so the acceptance's timing likely holds — but `pool.shutdown(cancel_futures=True)`, `leave(130)`, `>>> why CANCELLED` and the re-enabled SIGINT never execute in the ctl path; they matter only for a hand-run helper. The helper's comment about the group SIGINT is now false in the shipped topology.
- **Failure scenario:** None fatal. The residual risk is the untested path: the harness's `timeout` is a shim (D17 comment: "the harness's shim hands the budget to the child as FAKE_BUDGET"), and D1's ctl case uses a stand-in helper that signals the ctl's pid directly. If the image's `timeout` were busybox's (which does not forward signals the same way) or were invoked with a flag change, the cancel would wait for the pass again and nothing in the suite would notice.
- **Evidence:** Looked for `--foreground` in the diff: absent. Looked for a harness case running the real helper under the real `timeout` with a signal: none. The report's PL-013 line "started with SIGINT ignored … the group's SIGINT still ends it" tests a property the `timeout` wrapper makes unreachable. Settle on the VM: `raofflineproxy-ctl scan` with the toggle on, then `kill -INT -- -<pgid>` and `ps -o pid,pgid,comm` during the pass.

### G-D-04: Patch 016's absent/transient classification is tested only against a stubbed `fetch_static_asset`
- **Severity:** Medium
- **Category:** Test evidence (PL-060 follow-up)
- **Where:** `patches/016-say-what-became-of-a-download.patch`, hunk `@@ -308,8 +324,18 @@`: `status = getattr(exc, "code", None); outcome = IMAGE_ABSENT if status in ABSENT_HTTP_STATUSES else IMAGE_TRANSIENT`. Harness D19: `image_cache.fetch_static_asset = answer(kind)` raising `urllib.error.HTTPError` directly; the ctl-driven half replaces `_ic.fetch_static_asset` via `sitecustomize.py`.
- **What:** Whether a 404 from the media host arrives at this `except` as an exception carrying `.code == 404` depends on `fetch_static_asset` (context line: `raise last_error if last_error else RuntimeError("fetch failed")`), which is outside the diff and stubbed in every D19 case. If it retries 404s, wraps them, or a redirect path raises a `URLError`, every not-found badge reads `transient` and fails the pass — the very symptom the follow-up fixed.
- **Failure scenario:** The follow-up's four ctl-level D19 checks pass; on a device the first 404 badge still fails every scan with `SOME_IMAGES_NOT_SAVED`.
- **Evidence:** Searched the packet for the body of `fetch_static_asset`: only its last line is in 016's context. No case exercises the real fetcher against a local HTTP server. The direction of failure is the safe one (a pass fails rather than a badge being wrongly marked absent), which is why this is Medium and not High.

### G-D-05: The start limit as moved no longer bounds a proxy that never listens
- **Severity:** Low
- **Category:** Availability (gpt F-RA-26 × claude F-RA-20)
- **Where:** `system.d/raofflineproxy.service`: `[Unit] StartLimitIntervalSec=60 / StartLimitBurst=5`; `[Service] ExecStartPost=/usr/bin/raofflineproxy-ctl listening --wait 30`, `Restart=on-failure`, `RestartSec=5`.
- **What:** Each failed start now lasts ≥ 30 s (the wait) + 5 s (RestartSec). At most two starts fit in any 60 s window, so five-in-sixty never trips and a proxy that cannot bind (port held by something else, Python failing after fork) restarts forever at ~35 s intervals instead of stopping after five attempts as the limit intends.
- **Failure scenario:** Toggle on, something else on 8080; every 35 s a Python interpreter starts, imports the service, and is killed; the journal fills; battery drains. The unit's comment says "enable puts the device back as it was" — that covers `enable`'s own first start, not a later failure while the marker (`ConditionPathExists`) stands.
- **Evidence:** The two numbers and the wait are all in the diff; the arithmetic is the finding. Fix shape: `StartLimitIntervalSec` at least `Burst × (wait + RestartSec)`, or a shorter `--wait`.

### G-D-06: The scan cursor advances at listing time, so a cancelled or failed scan defers the files it listed a full circle
- **Severity:** Low
- **Category:** Correctness (PL-059)
- **Where:** `raofflineproxy-ctl` `list_jobs` Python, hunk `@@ -1126,28 +1443,36 @@`: `write_cursor(str(walked[-1]) if truncated and walked else "")` runs inside the listing, before any job is processed.
- **What:** A truncated listing writes the cursor whether or not the run then caches anything. A player who cancels a scan after the listing, or whose run ends `SOME_GAMES_NOT_SAVED`, finds the next scan starting past the games the first never reached; they return only when the circle comes round (⌈N/5000⌉ scans). This is still better than base (the same 5000 forever) but is not the "walks past what the first cached" of #186 PL-17; it is "past what the first listed".
- **Failure scenario:** 6,000 uncached files; scan 1 lists 1–5,000 and is cancelled at once; scan 2 lists 5,001–6,000 then 1–4,000; files 4,001–5,000 wait for scan 3.
- **Evidence:** The cursor write has no dependency on `R_CACHED`/`R_WHY` (those are computed later in the shell). Also unverifiable from the packet: whether the `os.walk` order is sorted; an unsorted `listdir` makes "after the cursor" unstable when files are added.

### G-D-07: `exit ${EX_USAGE}` in the new `listening` verb — the rule-named trap; the sibling usage branch uses a literal
- **Severity:** Low
- **Category:** Guards fail closed
- **Where:** `raofflineproxy-ctl` `do_listening`, hunk `@@ -772,6 +890,88 @@`: `echo "usage: …" >&2; exit ${EX_USAGE}`; the dispatcher's `*)` branch (hunk `@@ -1694,10 +2120,11 @@`) uses `exit 2`.
- **What:** `engineering-practices.md` § Guards must fail closed names this exact shape: an undefined `EX_USAGE` makes it `exit` with the `echo`'s 0. `EX_USAGE=` is not in the diff. If it is undefined, `raofflineproxy-ctl listening --wait abc` exits 0 — "listening".
- **Failure scenario:** Only on a hand-typed misuse (the unit's arguments are fixed), so Low.
- **Evidence:** Grepped the diff for `EX_USAGE=`: absent. The inconsistency with the literal `exit 2` twenty lines away is the tell. One visit: `grep -n 'EX_USAGE=' raofflineproxy-ctl`.

### G-D-08: Two definitions of "the game is whole", and every achievementsets body parsed on every listing
- **Severity:** Low
- **Category:** Correctness / performance (gpt F-RA-14, claude F-RA-10 = gpt F-RA-15)
- **Where:** `raofflineproxy-ctl` `ready_games_into` (hunk `@@ -772,6 +890,88 @@`): ready = `patch ∩ unlocks`. `list_jobs` `whole_games()` (hunk `@@ -1052,12 +1309,36 @@`): whole = `unlocks ∩ sets`, then intersected with patch-row paths; it `json.loads` every `achievementsets:` body via `get_all_cache_by_prefix`.
- **What:** A game with patch + unlocks and no sets row is counted `added=` (ready) yet stays a job on the next unindexed walk; a game with unlocks + sets + patch-path is whole for the walk but the two agree only when all three rows exist. And the sets bodies are full RA responses; on a store of thousands of games the walk now parses tens of megabytes of JSON at every scan (unbounded: `list_jobs "${LIST}" all 0`) and top-up listing, on a device the unit tunes `MALLOC_ARENA_MAX=2` for.
- **Failure scenario:** Store with 2,000 sets rows × ~50 KB; each SCAN and each link-return top-up spends seconds and a large transient heap in the listing before any job runs; the top-up's `timeout "${BUDGET}"` on the listing (LRC 124 → `TOOK_TOO_LONG`) becomes reachable on a slow card.
- **Evidence:** Both functions are in the diff; the report's "time a scan with nothing new on a handheld" does not mention the listing. Not measured here; the orchestrator should time `list_jobs` on a populated store.

### G-D-09: `history_path` can now return `ppsspp.ini`; its consumer is outside the diff
- **Severity:** Low
- **Category:** Correctness (gpt F-RA-13)
- **Where:** `raofflineproxy-ctl` `history_path`, hunk `@@ -736,8 +849,13 @@` / `@@ -750,7 +868,7 @@`: `for F in "${BUILTIN}" "${P}" "${PPSSPP_INI}"`, newest wins, and the function returns that path.
- **What:** The diff shows only the mtime question (D-RA-035) using the result. If any caller also reads the returned file as a RetroArch `.lpl`, an INI is not one. Also, PPSSPP rewrites `ppsspp.ini` on any settings change, so a visit to PPSSPP's own menu reads as "a game was played" — a false positive that costs a probe and a pass, not a wrong answer.
- **Evidence:** D10 checks the gate opens (`^smart budget=` in the probe log) and closes; no case reads the path's contents. One visit: every call site of `history_path`.

### G-D-10: The PL-055 storm guard changes when the offline-index promise is kept, and a log line still says "once"
- **Severity:** Low
- **Category:** Reaches past its item / register
- **Where:** `do_topup`, hunk `@@ -1517,8 +1907,15 @@` (`PENDING_DUE`), and hunk `@@ -1581,13 +1980,18 @@`: `slog "… the library listed once for it"` retained while the marker may now be listed for repeatedly.
- **What:** After a failed attempt the marker waits out the half hour, so "NEWLY ADDED GAMES WILL BE ENABLED ONCE YOU RECONNECT" (D-UI-106) becomes "…or up to 30 minutes after a link that failed". Strictly better than base (which lost the marker), disclosed in the report, register row listed as owed — recorded here so the orchestrator writes it, and the `slog` text is corrected.
- **Evidence:** D2's third check asserts the wait explicitly. Also `-nt` compares mtimes; `do_index_offline`'s `touch` and the attempt mark's `touch` in the same second are unordered — an edge the harness's virtual clock does not exercise.

### G-D-11: F-EM-07 is closed by a citation in a comment; a comment is a claim, not the artifact
- **Severity:** Low
- **Category:** Evidence (`engineering-practices.md` § A name is not a behaviour)
- **Where:** `cheevos_ppsspp.sh`, hunk `@@ -49,17 +49,48 @@`: "PPSSPP reads the key from ppsspp.ini's [Achievements] (Core/Config.cpp:376 at the pinned v1.20.2, afbc66a3) … rc_client_set_host, Core/RetroAchievements.cpp:650-652".
- **What:** The row was "nothing in the packet shows PPSSPP consumes `AchievementsHost`". Nothing in this packet shows it either; the PPSSPP source is not embedded, and the report itself says "the integrator still owes a VM proof". The row's honest state is *open with a citation*, not *fixed*.
- **Evidence:** No test in D15 launches PPSSPP; every D15 check reads `ppsspp.ini` after the script runs. Judge the citation in one visit to the pinned PPSSPP tree.

### G-D-12: Patch 016 documents `IMAGE_CACHED` for "there already", and the early-return path is not in the diff
- **Severity:** Low
- **Category:** Contract vs code
- **Where:** `patches/016-…patch`, hunk `@@ -236,19 +236,35 @@`: `IMAGE_CACHED = "cached"  # there already, or fetched whole`; the only `return IMAGE_CACHED` is at the end of the `try` (hunk `@@ -308,8 +324,18 @@`).
- **What:** The docstring says "No-ops if already cached"; that early exit (presumably a bare `return` inside the `try`) is not touched by 016. If it is bare, the function returns `None` for a cached image, contradicting its `-> str` and the constant's comment. The helper is unaffected (it checks `resolve_cached_static_asset` first, and treats `None` as "say nothing"), so this is a contract defect, not a runtime one.
- **Evidence:** Searched 016 for a second `return IMAGE_CACHED`: none. D19's `"ok": "cached"` case fetches, it does not pre-seed the file. One visit: the first ten lines of `download_static_image`'s `try`.

### G-D-13: A top-up whose listing fails (LRC other than 0/124) exits 0, and D2's first check now enshrines it
- **Severity:** Low
- **Category:** Guards fail closed (pre-existing, codified by the new test)
- **Where:** Harness D2: `[ "${RC}" -eq 0 ] && grep -q "index could not be read" "${TLOG}" && [ -e "${TPD}/index-pending" ]; check $? "PL-055: a link-return listing for the marker that fails (rc 1) leaves index-pending (rc ${RC})"`. ctl `do_topup`, hunk `@@ -1581,13 +1980,18 @@`: only `LRC -eq 124` sets a why.
- **What:** The item's fix (keep the marker) is right, but the run that could not read the interface's index still reports rc 0 with no `why`, and the stream's own case asserts that. Under D-UI-030 a run whose part failed is `COULDN'T FINISH`. Outside PL-055's acceptance and pre-existing, but a test that pins a fail-open exit is worth naming before it becomes precedent.
- **Evidence:** The harness line above; the `else` branch after `LRC -eq 124` is not in the diff, so I cannot see whether it sets anything the stamp would carry.

### G-D-14: A badge answered 404 during a new set's propagation is silenced for thirty days
- **Severity:** Low
- **Category:** Design decision needing the maintainer
- **Where:** `raofflineproxy-cache-images`, hunk `@@ -82,7 +95,18 @@`: `ABSENT_RECHECK_SECONDS = 30 * 24 * 3600`; `read_absent()` drops entries only past that age.
- **What:** The report offers "say if you want absent to be permanent instead" but not the other direction. A player who caches a set the day it is published, while its badge is not yet on the CDN, sees no badge for a month; `SOME_IMAGES_NOT_SAVED` never says so because absent is "no failure of the pass". Rare, disclosed in part, register row owed.
- **Evidence:** The constant and the read filter are in the diff; nothing shortens the recheck for a recently added game.

---

## 3. Sweep rows

**Spot-checked against the diff (confirmed present as reported):**

| Row | Where in the diff | Note |
| --- | --- | --- |
| gpt F-RA-27 (patch 008) | `return (config_data or {}).get("upload_logs") is True` | Holds exactly; D13a gives `0/0/0/1`. |
| claude F-RA-20 (unit) | `[Unit] StartLimitIntervalSec=60 / StartLimitBurst=5`, removed from `[Service]` | Holds; see G-D-05 for the interaction with the new wait. |
| gpt F-RA-26 | `ExecStartPost=/usr/bin/raofflineproxy-ctl listening --wait 30`; `port_listening`/`do_listening` in ctl | Mechanism correct (`Type=simple` + ExecStartPost holds the start job and `Before=`). D12b covers the five socket-table shapes. |
| gpt F-RA-18 | `do_disable`: read-back of `${KEY}` before `stop_running_run`, of `${HARDCORE_KEY}` before clearing the record, of the record after | Holds; D11's three cases match the three read-backs. |
| claude F-RA-12 = gpt F-RA-19 | `in_a_row` counter, reset on success, `if in_a_row >= 3` | Holds; D4b `apart`/`row`. |
| gpt F-RA-09 | `owner()` in `do_pending_ids` and `do_summary`; `pending` count unchanged | Holds; awards naming no account are counted for the signed-in user (disclosed). The `u=` parameter name is a claim about `utils.extract_request_param`, outside the packet. |
| claude F-RA-23 = gpt F-RA-24 | `PKG_DEPENDS_TARGET="toolchain Python3 bash busybox coreutils grep systemd …"` | Textually holds; whether `coreutils`/`grep` exist as target package names in this tree is outside the packet (report: pkgcheck clean). |
| claude F-EM-04 | `proxy_listening()` reading `${proc}/tcp{,6}`, tri-state 0/1/2, two distinct log lines | Holds; the v6 hex forms (`…01000000`, `…FFFF00000100007F`) are little-endian-correct and match the ctl's. |
| claude F-RA-13 / gpt F-RA-12 (patch 013, cache-images) | `png_problem()` walking to IEND wherever it is; `damaged()` → `image_cache.png_problem(target.read_bytes())` | Holds; `zlib.decompress(b"")` on a PNG with no IDAT raises, so a frame-only body is refused. |
| gpt F-RA-14 | `whole_games()` and the `cache_keys.parse_game_id_from_patch_key(...) in whole` filter | Holds (see G-D-08 for the cost and the second definition). |
| claude F-RA-10 = gpt F-RA-15 | `ready_games_into` / `games_made_ready`, before/after in `do_scan` and `do_topup`, `ADDED` falls back to `CACHED` when the store cannot be read | Holds; `grep -vxF -f` with an empty before-file lists every after-line (GNU grep), which is the intended "all new". |
| gpt F-RA-13 | `PPSSPP_INI` in `history_path`'s newest-wins loop | Present; see G-D-09. |
| claude F-RA-07 / gpt F-RA-28 | Header names `c1bd3724d18e8c0ce67c3d62852e6eaf83e3a302`, `pending_awards(id, achievementId, queryString, requestBody, queuedAt, status)`, summary exit 2, refresh policy, `account` entry restored | Text matches the SQL in the same file; D18 pins the header to `PIN`. |
| claude F-RA-22 | Comments in `do_index_offline` and the `INDEX_PENDING` block | Comments only, as reported. |
| claude F-RA-17 (follow-up) | Usage line `…|account|summary|flushed|…`; `listening [--wait <seconds>]` added | Holds. |

**Rows reported fixed with no evidence in the diff:** claude F-EM-03, claude F-EM-09, gpt F-EM-03, gpt F-EM-05 — G-D-01. Claude F-EM-07 — a comment citation, G-D-11.

**Withdrawn:** claude F-RA-11's import half ("`proxy_service.py:14` at the pin has `from urllib.parse import urlsplit`"). Cannot judge from the packet; consistent with D13c's forwarder case, which would `NameError` on `forward_to_upstream_result` if the import were missing and is reported PASS. Its test half is in D13c and does exercise the failed-lookup path with a real `getaddrinfo` failure.

**Cases that pass on the unfixed code:** the report discloses 16 and calls them guards. Those I can identify from the harness logic are guards in truth (D3 "listed once", D3b "pending still counts", D6 verify-left rc 0, D19 transient-still-fails, D13c forwarder, the two shim self-checks). One caveat: D6's verify-left check passed at base because `|| true` swallowed every exit, so alone it cannot tell "exit 3 handled" from "everything ignored"; D6b's crash case supplies the discriminator, which is the right pairing.

---

## 4. Coverage boundary — what this packet cannot settle

- **`cheevos_armsx2.sh`**: absent from the diff (G-D-01).
- **Callees outside the diff** that the fixes lean on: `fetch_static_asset` (exception shape, retries), `resolve_cached_static_asset`, `Storage`/`cache_keys` (`parse_game_id_from_patch_key`, `PREFIX_ACHIEVEMENTSETS`), `load_content_history_paths`, `utils.extract_request_param` (`u=`), the ctl's `cancelled()` INT/TERM traps, `fail`/`say`/`cannot_tell`, `EX_USAGE`, `time_left`, `count_ready`, `run_jobs`, `do_enable`'s rollback on a failed start, the consumer of `history_path`, the `os.walk` ordering and `MAX_SCAN_ENTRIES`/`RA_TEST_SCAN_CAP` plumbing (patch 004), the top-up's gating `if` around its image pass, `network.py`'s `import time`/`threading`.
- **EmulationStation** (stream E2): `CloudText::parseScanStamp` on `truncated=1`, `GuiOfflineScan` on `note TRUNCATED`, `OfflineAchievements::scanWhy` on `SOME_IMAGES_NOT_SAVED` (es-player-text.md lists the proposed sentence under D-UI-112), `jsonInt` on `null`, `parseAchievementSets`' core-else-first rule the summary mirrors.
- **PPSSPP** consuming `AchievementsHost` (G-D-11).
- **Runtime**: real coreutils `timeout` semantics (G-D-03), the unit's start/restart behaviour and boot-to-carousel delay (G-D-05; the report already flags timing), listing cost on a populated store (G-D-08), the helper's whole-store walk on a nothing-new scan.
- **Build**: existence of `coreutils`, `grep`, `busybox`, `bash`, `systemd` as target packages; `tools/pkgcheck` output; the patch series applying at `c1bd3724` (hunk counts in 013/015 look arithmetically consistent, which is not proof).
- **The RA API's response shapes** the summary and `whole_games` read (`GameId`, `Sets[].Type`, `ImageIconUrl`): fixtures in D3/D8/D9 are the stream's own.
- **All PASS/FAIL counts** in the report (462/469, 58/60 base FAILs) are claims; the harness text is consistent with them but I have not run it.

Considered and dismissed: `set -e` in the ctl would make the bare `[ … ] && run_image_pass` fatal, but the pre-existing `COUNTS="$(list_jobs …)"; LRC=$?` idiom in the same function cannot work under `set -e`, so the ctl does not run with it.

---

## corpus.provenance.json

```json
{
  "seat": "D",
  "audit": "docs/audits/2026_09_28-milestone-audit-of-the-fixes-307",
  "manifest": "docs/audits/2026_09_28-milestone-audit-of-the-fixes-307/seats/D.manifest.json",
  "read_mode": "embedded-by-facilitator; no filesystem access; hashes are the facilitator's at embed time",
  "read_timestamp_utc": "2026-09-28T04:20:24Z",
  "source_file_paths": [
    "docs/audits/2026_09_28-milestone-audit-of-the-fixes-307/seats/D.diff",
    "docs/audits/2026_09_28-milestone-audit-of-the-fixes-307/seats/D.harness.txt",
    "docs/audits/2026_09_28-milestone-audit-of-the-fixes-307/seats/D.plan.md",
    "docs/audits/2026_09_28-milestone-audit-of-the-fixes-307/seats/D.report.md",
    ".claude/rules/engineering-practices.md",
    ".claude/rules/upgrade-and-install.md",
    ".claude/rules/packaging-and-patches.md",
    ".claude/rules/es-player-text.md"
  ],
  "source_file_hashes": [
    "df2f0efe5f844316c8a8c4584646e1c0b972cb66cb2cee5448cde4f2b2f3a786",
    "3cac6b0c040340fa7a1f5bf8f00e11cdeac02195b291d1f57ba0e99fa1628a8e",
    "4054dbd2c65e37b6b8bb6697f10430e50a103ca281ab55be7666684a1080ef4e",
    "f079632db8c2c8a2fee568846a9fdef997a36ba4b4c8e2abf7b864c17d13f540",
    "d6f88a6f4cd9c61b0e6ef728625c6a1cec9dc6f58e1db578cf0987f10f870c1a",
    "de4a683f9a36f9100e6fd98be11ad84d736f370374c40f74c445a2b81eca1995",
    "2a44db10f4f179198b9366239eabe0900e1701145beced181536eb18bcbc0746",
    "554225c68e627a3bde8969a77f177aea14f5bcd85b0bcc740631d402a5f1f7a7"
  ],
  "not_embedded_but_needed": [
    "projects/ROCKNIX/packages/emulators/standalone/armsx2-sa/scripts/cheevos_armsx2.sh (claimed changed in a7fa6ee786; no hunk in D.diff)",
    "full raofflineproxy-ctl (traps, EX_USAGE, history_path callers, top-up image-pass gating)",
    "pinned client image_cache.py / network.py / proxy_service.py at c1bd3724",
    "EmulationStation CloudText/GuiOfflineScan/OfflineAchievements",
    "PPSSPP Core/Config.cpp, Core/RetroAchievements.cpp at afbc66a3"
  ]
}
```