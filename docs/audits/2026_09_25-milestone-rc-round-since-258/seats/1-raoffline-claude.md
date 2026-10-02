# Audit — bucket 1-raoffline (full offline RetroAchievements)

## 1. Summary

The bucket adds RAOfflineProxy as a loopback service between the emulators and retroachievements.org (three `package.mk`s, a systemd unit, a boot reconcile, fifteen proxy patches), a 1,700-line control script (`raofflineproxy-ctl`) with three Python helpers that drive enable/disable, the library scan, the link-return top-up and the store reads, a RetroArch patch that reads two proxy headers into its sign-in toast, and interface code that shows the scan page, the send/top-up cards, the offline achievements pages and the index that feeds the cache. The proxy patches are narrow, additive and mostly well-argued; patch 015 carries tests, the pure text readers in the interface carry tests, and the upgrade questions the rule file asks (old stamps without `added=`, images written before the length check) are answered in the code. The control script and the interface's card logic are where the defects are, and they cluster around signals and phases: the scan's image pass runs in the foreground, so the ctl's TERM/INT traps are deferred and the interface's cancel makes the image helper drain its entire download queue instead of stopping (F-RA-01); during that same pass the page and the card go silent for up to five minutes (F-RA-02); and the `index-pending` marker is deleted before the listing it exists for, so one cut run loses the games it promised (F-RA-03). Two more wrong outcomes on ordinary paths: the hardcore record the ctl writes is not mirrored into the interface's in-memory config and is resurrected by its next save (F-RA-04), and an offline boot shows "INDEXING COMPLETED" beside the card that says nothing was indexed (F-RA-05). Everything the pages depend on in `CloudText`, `GuiGameAchievements`, `SystemConf`, the launch scripts that route RetroArch to the proxy, and the proxy's own sources at the pinned commit is outside this packet.

## 2. Findings

### F-RA-01: A stop or cancel during the scan's image pass is deferred, and the interface's cancel makes the image helper download everything queued before it exits
- **Severity:** High
- **Category:** Concurrency
- **Where:**
  - `projects/ROCKNIX/packages/network/raofflineproxy/sources/raofflineproxy-ctl` — `run_image_pass()` (foreground helper), `do_scan()` (`[ "${R_CACHED}" -gt 0 ] && run_image_pass scan ...`), `do_topup()` (`run_image_pass topup ... --verify`), `list_jobs` invoked as `COUNTS="$(list_jobs ...)"`, `is_online()` (foreground `${PROXY_PY} probe-online`), `stop_running_run()`
  - `projects/ROCKNIX/packages/network/raofflineproxy/sources/raofflineproxy-cache-images` — `main()`, the `with ThreadPoolExecutor(max_workers=4) as pool:` block
  - `es-app/src/OfflineScanJob.cpp` — `cancel()` (`::kill(-pid, SIGINT)`), `run()` (the `setsid sh -c` wrapper)
- **What:** bash runs a trap handler only after a foreground command returns. `run_image_pass`, the listing and the probes run in the foreground, so `trap 'stopped scan' TERM` and `trap 'cancelled scan' INT` fire only when that child exits. The interface's cancel signals the whole process group, so the image helper receives `KeyboardInterrupt` inside `as_completed`; the `with` block exits and `Executor.__exit__` calls `shutdown(wait=True)`, which runs every queued future to completion — the helper's own deadline branch (`for pending in futures: pending.cancel()`) is never reached.
- **Failure scenario:** first scan of a 494-game library. The jobs phase ends; `run_image_pass` submits every missing image (the badges `wait_for_badges` dropped after 120 s — tens of thousands per the helper's own header). The page shows "SCANNING... GAME 494 OF 494" frozen (F-RA-02); the player presses B, YES. SIGINT reaches the helper, which then downloads all queued images before exiting — minutes on a good link, hours on a poor one (20 s timeout, one retry, four workers). Only then does the ctl's INT trap write the CANCELLED stamp and exit 130, and the page, "sat in" by design, offers nothing else. Same root cause for `raofflineproxy-ctl disable`: `stop_running_run` TERMs the ctl pid, waits `STOP_WAIT=10`, logs "did not stop within 10s; carrying on", and the scan keeps writing into the image cache after the toggle is off.
- **Evidence:** `"${IMAGE_HELPER}" --seconds "${SECONDS_LEFT}" ${MODE} >>"${SCAN_LOG}" 2>&1 || RC=$?` (foreground) against `do_images`, which does `"${IMAGE_HELPER}" ... &`, `CLIENT=$!`, `wait "${CLIENT}"`; `pause()`'s own comment: "A sleep that a SIGTERM interrupts ... wait returns the moment a trapped signal arrives". The helper: `with ThreadPoolExecutor(max_workers=4) as pool:` submitting all of `missing`, cancellation only inside `if time.monotonic() > deadline:`. `OfflineScanJob::cancel`: `if (pid > 0) ::kill(-pid, SIGINT);`. Refutation attempted: looked for `&`+`wait` around `run_image_pass`/`list_jobs` (none), for a `KeyboardInterrupt`/`SIGTERM` handler or `cancel_futures=True` in cache-images (none), for `stop_running_run` signalling anything but the ctl pid (it does not), for an EXIT trap that kills the image helper (the trap kills `${CLIENT}`, which `run_jobs` `unset` before the pass).
- **Fix:** run the image helper and the listing in the background and `wait` (as `do_images` does), keep `CLIENT` set so the EXIT trap ends them; in cache-images catch `KeyboardInterrupt` and install a TERM handler that calls `pool.shutdown(wait=False, cancel_futures=True)`, and submit in bounded batches rather than the whole set.
- **Confidence:** high on the mechanism (all in the packet; bash trap deferral and `ThreadPoolExecutor.__exit__` semantics are standard); medium on the drain's duration, which depends on link and library.

### F-RA-02: The scan page and the top-up card go silent for the whole image pass, and the running-progress file is gone while the run still holds the lock
- **Severity:** Medium
- **Category:** Player text
- **Where:**
  - `.../sources/raofflineproxy-ctl` — `run_image_pass()` (stdout to `SCAN_LOG` only), `run_jobs()` (`unmark_running` at its end), `do_scan()` (`tell "done ..."` after the pass), `do_topup()` (pass after `unmark_running`)
  - `es-app/src/guis/GuiOfflineScan.cpp` — `update()`, non-finished branch
  - `es-app/src/ProxyCards.cpp` — `runTopUp()` poll loop (`if (!p.running) continue;`), `topUpRunning()`
- **What:** the pass emits no `>>>` line and writes no progress file, so the last GAME i OF n line stands for up to `IMAGE_PASS_SECONDS` (300) on the scan page and on the top-up card; `topUpRunning()` reads the progress file, so during the pass a launch is not asked STOP IT AND PLAY although the lock is held and a scan pressed then exits 75.
- **Failure scenario:** scan caches 200 games; the page shows "SCANNING... / GAME 200 OF 200 / <last name>" with the spinner and "PRESS B TO CANCEL" for five minutes. The page's own comment names the problem it creates: "a frozen count is indistinguishable from a hang". A top-up's card holds "GETTING GAME N OF N READY..." through verify and fetch; a game launched then finds `topUpRunning()` false.
- **Evidence:** `slog "${VERB}: image pass, up to ${SECONDS_LEFT}s..."` is the only output of `run_image_pass`; the image helper prints `>>> image <i>|<n>` but its stdout is `>>"${SCAN_LOG}"`; `unmark_running` is called at the end of `run_jobs`, before the pass. Refutation attempted: looked for a `tell`/`mark_running` inside or around `run_image_pass` (none) and for a page string about images (none — `GuiOfflineScan` knows `listing`, `game`, `cached`, `note`, `errors`, `why`, `done`).
- **Fix:** `tell "doing images"` and pass the helper's `>>> image i|n` lines through to the page (a "SAVING IMAGES i OF n" line), keep the progress file updated until the run ends, and make `topUpRunning()` also consult the lock.
- **Confidence:** high.

### F-RA-03: `index-pending` is removed before the listing it exists for; one cut or failed run loses the games added offline
- **Severity:** Medium
- **Category:** Correctness
- **Where:** `.../sources/raofflineproxy-ctl` — `do_topup()`, the block `if [ "${AFTER_INDEX}" -eq 0 ]; then ... rm -f "${INDEX_PENDING}"; fi` before `COUNTS="$(list_jobs "${LIST}" indexed "${LEFT}" ...)"`; the failure exits `WHY=TOOK_TOO_LONG` (`LRC -eq 124`, `LEFT -le 0`), `run_jobs` setting `R_WHY`, and `stopped()` (exit 143, no stamp)
- **What:** the marker that says "list the library once at the link's return" is deleted at the start of that listing; every later failure in the same run leaves no marker, and the next link return applies the half-hour gate and the "no game played" gate and runs the recently-played pass alone.
- **Failure scenario:** index runs offline → card "NEWLY ADDED GAMES WILL BE ENABLED ONCE YOU RECONNECT." → link returns → `topup` takes the lock, probes, `rm -f INDEX_PENDING`, lists → player launches a game and chooses STOP IT AND PLAY → TERM → `stopped topup` exits 143 with no stamp. Or the 900 s deadline cuts `run_jobs`. Next link: no marker, `TOPUP_MARK` fresh → `exit 0` before any listing. The added games are cached only when the player presses SCAN or the index runs again with the library.
- **Evidence:** quoted lines above; the only `touch "${INDEX_PENDING}"` calls are in the `AFTER_INDEX -eq 1` probe-failure branch and `do_index_offline`. Refutation attempted: looked for a re-touch on `WHY` or in `stopped()`; none.
- **Fix:** remove the marker only after the indexed pass ended with `WHY` empty; re-touch it in `stopped()` and on any `WHY` when the run started with it.
- **Confidence:** high.

### F-RA-04: The hardcore record the ctl writes and deletes is not mirrored into the interface's in-memory `SystemConf`, so its next save resurrects a stale record and a later `disable` restores the wrong hardcore value
- **Severity:** Medium
- **Category:** Correctness
- **Where:**
  - `es-app/src/guis/GuiRetroAchievementsSettings.cpp` — `openOfflineAchievements`, the `apply` lambda's `postToUiThread` body (`SystemConf::getInstance()->set("global.retroachievements.offlineproxy", ...)`, `SystemConf::getInstance()->set("global.retroachievements.hardcore", ...)`)
  - `.../sources/raofflineproxy-ctl` — `do_enable()` (`if [ -z "$(setting "${HARDCORE_WAS_KEY}")" ]`, "A second enable finds the record and keeps it"), `do_disable()` (`set_setting "${HARDCORE_WAS_KEY}" default`)
- **What:** the fork's own comment says why two keys are mirrored: "the parent page's own save at close writes what the script wrote rather than what it read at open". `global.retroachievements.offlineproxy.hardcore_was` is read into `SystemConf` at startup when present, deleted by `disable`, and not cleared in memory — the parent page's save at close writes it back.
- **Failure scenario:** boot with the toggle on (`hardcore=0`, `hardcore_was=1` in `system.cfg`). Player turns the toggle off: ctl sets `hardcore=1`, deletes the record; the page mirrors the two keys; the parent page closes and saves → `hardcore_was=1` is back in the file. Player later turns HARDCORE MODE off for their own reasons. Player enables again: the ctl finds a record and keeps it. Player disables: hardcore is restored to 1 — a value the player had turned off.
- **Evidence:** the three `SystemConf::set` calls in the packet name `offlineproxy` and `hardcore` only; the ctl's `disable` verifies deletion only against the file (`[ -z "$(setting "${HARDCORE_WAS_KEY}")" ] || fail`). Refutation attempted: looked for a `SystemConf::set(".../hardcore_was", ...)`, a `SystemConf` reload, or the ctl printing the record for the page to mirror; none.
- **Fix:** have `enable`/`disable` print `hardcore_was=<value|>` beside `hardcore=`, and mirror it (`SystemConf::set(key, "")` on disable) in the same `postToUiThread` body.
- **Confidence:** medium — `SystemConf::saveSystemConf` is outside the packet; the finding rests on the fork's own statement of what that save does.

### F-RA-05: An offline index shows "INDEXING COMPLETED" beside the card that says nothing was indexed
- **Severity:** Medium
- **Category:** Player text
- **Where:** `es-app/src/ThreadedHasher.cpp` — hunk `@@ -20,15 +25,18 @@` (`mTotal = mSearchQueue.size();`), hunk `@@ -39,16 +47,57 @@` (the pop loop and `if (mTotal == 0) return;`), destructor hunk `@@ -67,10 +116,24 @@`
- **What:** `mTotal` is taken from the queue before the hash library is fetched; when the library does not come the queue is emptied but `mTotal` keeps the old count, so the `mTotal == 0` early return does not fire, a notification is created, threads start and end at once, and the destructor's guard `mTotal > 0` lets `displayNotificationMessage(... _("INDEXING COMPLETED") ... _("UPDATE GAMELISTS TO APPLY CHANGES."))` run.
- **Failure scenario:** boot offline with games to index and the toggle on: `ProxyCards::indexRanOffline` puts up "RETROACHIEVEMENTS (OFFLINE) / NEWLY ADDED GAMES WILL BE ENABLED ONCE YOU RECONNECT." and the destructor toasts "INDEXING COMPLETED. UPDATE GAMELISTS TO APPLY CHANGES." — two floating surfaces at once (es-player-text D-UI-093), one of them false, and the fork's own log line for the same run says "nothing is indexed this run".
- **Evidence:** `mTotal = mSearchQueue.size();` precedes `while (!mSearchQueue.empty()) mSearchQueue.pop();`; the only later writes are `mTotal++` in the lookup loop. Refutation attempted: looked for `mTotal = 0` or a recount after the library check; none. Upstream had the toast too; the fork added the `mTotal > 0` guard for the no-work case and the card that contradicts the toast.
- **Fix:** set `mTotal = 0` after the pop (before the `lookupOnly` loop) so the early return and the destructor guard both hold.
- **Confidence:** high.

### F-RA-06: The listing reads only the first `es_systems*.cfg` it finds, so a device with a custom systems file has its stock systems treated as unindexed
- **Severity:** Medium
- **Category:** Correctness
- **Where:** `.../sources/raofflineproxy-ctl` — `list_jobs`, the embedded Python `es_systems()`: `for cfg in (es_dir / "es_systems_custom.cfg", es_dir / "es_systems.cfg", Path("/usr/config/emulationstation/es_systems.cfg")): ... return found`
- **What:** the loop returns after the first readable file. If the interface loads `es_systems_custom.cfg` in addition to the base file (the name is that of an override file), a device that has one gives the ctl only the custom systems.
- **Failure scenario:** a player adds one custom system. Every stock system is now absent from `es_systems()`, so it is never in `indexed_dirs`: `topup --after-index` (mode `indexed`) lists nothing for them and caches nothing; `scan` (mode `all`) hashes every one of their ROMs through `H` jobs instead of the index — one gameid request per file, the walk capped at 5,000.
- **Evidence:** the `return found` inside the loop; the comment "the interface's own custom, user or image copy, in the order it reads them" describes precedence, not a merge. Refutation attempted: the interface's `SystemData::loadConfig` is outside the packet; nothing in the packet shows the custom file replacing rather than extending the base.
- **Fix:** read every file that exists and merge systems by name, or read the same file set the interface's loader reads.
- **Confidence:** low — depends on the interface's loader, outside the packet.

### F-RA-07: The ctl reads the proxy's sqlite tables directly, and its schema check is recorded against a pin two moves old
- **Severity:** Medium
- **Category:** Upgrade path
- **Where:**
  - `.../sources/raofflineproxy-ctl` — header ("the client's schema at the commit package.mk pins (4e9bab484e4d7be30b2dbc313aae94ca2f5f742a ... checked 2026-09-24 for audit #258 PL-009)"), `do_pending`, `do_pending_ids` (`ORDER BY queuedAt ASC, id ASC`), `do_account`, `do_summary` (`cacheKey, responseBody, sourceRomPath`)
  - `projects/ROCKNIX/packages/network/raofflineproxy/package.mk` — `PKG_VERSION="c1bd3724d18e8c0ce67c3d62852e6eaf83e3a302"` and the comment listing storage changes since 4e9bab48 ("keeps every cached game's rows until the game is deleted ... caches gameid lookups")
- **What:** the pin moved to 0711f0b9 and then c1bd3724 with storage changes named in the package comment; the ctl's claim that its raw SQL matches the store was last checked at 4e9bab48 and was not re-stated. A column or table the ctl names that changed shape reads as `cannot_tell` (exit 2) — every store read (`pending`, `pending-ids`, `account`, `summary`) then goes dark, and the interface reads exit 2 as "say nothing about achievements".
- **Failure scenario:** upstream renames `sourceRomPath` or drops `id` from `pending_awards` at the new pin → `summary` exits 2 → offline summary page says "THE OFFLINE ACHIEVEMENTS SERVICE DIDN'T ANSWER" for a service that is answering; the exit card promises nothing though awards wait.
- **Evidence:** the two quoted comments name different commits for the same claim. Refutation attempted: `storage.py` at c1bd3724 is outside the packet; I could not confirm or refute that the columns still exist.
- **Fix:** re-check `_initialize_sqlite` at c1bd3724 and update the header; better, read the store through the client's `Storage` (the ctl already imports it in `list_jobs`) so a schema change fails at the import, not in a hand-written SELECT.
- **Confidence:** medium.

### F-RA-08: `OfflineAchievements::stopRun` signals whatever pid the lock file holds without checking the lock is held
- **Severity:** Medium
- **Category:** Concurrency
- **Where:** `es-app/src/OfflineAchievements.cpp` — `stopRun()`; contrast `.../sources/raofflineproxy-ctl` `stop_running_run()` (`if flock -n 7; then exec 7>&-; return 0; fi`)
- **What:** the ctl's own stop path first tests the lock with `flock -n` and only then trusts the pid; the interface reads the pid and sends `SIGTERM` to it. `/var/run` is tmpfs, so a stale lock means a ctl that died without cleanup this boot; its pid can be reused.
- **Failure scenario:** a top-up is killed -9 mid-run (power management, OOM). Its lock and progress file remain; `topUpRunning()` is true until the progress file's age passes the bound; a launch asks STOP IT AND PLAY; `stopRun()` TERMs the old pid, now owned by another process.
- **Evidence:** `const long pid = atol(Utils::String::trim(text).c_str()); if (pid <= 1) return false; return ::kill((pid_t) pid, SIGTERM) == 0;`. Refutation attempted: looked for an `flock`/`/proc/<pid>/cmdline` check; none.
- **Fix:** open the lock and `flock(LOCK_EX|LOCK_NB)`; if it succeeds nobody is running — release and return false. Or route the stop through `raofflineproxy-ctl` (a `stop-run` verb reusing `stop_running_run`).
- **Confidence:** medium (window is narrow; the code path is certain).

### F-RA-09: The top-up card says COULDN'T FINISH for a run the player stopped, and its "why" tells the player to run a scan they did not run
- **Severity:** Medium
- **Category:** Player text
- **Where:**
  - `es-app/src/ProxyCards.cpp` — `runTopUp()`: `const bool ok = rc == 0;` ... `outcome = std::string(_("COULDN'T FINISH")) + " - " + OfflineAchievements::scanWhy(s.why); action.push_back(_("IT'LL TRY AGAIN NEXT TIME YOU'RE CONNECTED."));`
  - `es-app/src/OfflineAchievements.cpp` — `scanWhy()`: `SOME_GAMES_NOT_SAVED` → "SOME GAMES COULDN'T BE SAVED. TRY THE SCAN AGAIN."
  - `.../sources/raofflineproxy-ctl` — `stopped()` (exit 143, no stamp)
- **What:** any non-zero exit after work was seen becomes COULDN'T FINISH; `stopped()` writes no stamp, so `s` is the previous run's stamp and `s.why` is stale or empty. es-player-text's outcome table gives a player's stop the word SKIPPED. Separately, the automatic run borrows the scan page's sentence, so its card carries two instructions at once.
- **Failure scenario:** (a) player chooses STOP IT AND PLAY, game lasts under 90 s → card "COULDN'T FINISH - SOMETHING WENT WRONG" (or the last scan's why) with "IT'LL TRY AGAIN NEXT TIME YOU'RE CONNECTED." (b) a top-up with one failed fetch → "COULDN'T FINISH - SOME GAMES COULDN'T BE SAVED. TRY THE SCAN AGAIN." over "IT'LL TRY AGAIN NEXT TIME YOU'RE CONNECTED."
- **Evidence:** the `ok`/`else` branches quoted; `if (!sawWork && s.ran && s.when >= startedAt ...)` shows the code knows how to date a stamp but the `why` path does not use it. Refutation attempted: looked for an rc 143/130 branch in `runTopUp`; none.
- **Fix:** rc 143 → no card or SKIPPED - IT WAS STOPPED; use `s.why` only when `s.when >= startedAt`; give the top-up its own text for `SOME_GAMES_NOT_SAVED`.
- **Confidence:** medium (the 90 s attach window bounds how often (a) shows).

### F-RA-10: `added=` counts the indexed pass only, though the recently-played pass is documented in the same file as caching games "not yet cached"
- **Severity:** Medium
- **Category:** Player text
- **Where:** `.../sources/raofflineproxy-ctl` — `do_topup()`: `ADDED="${CACHED}"   # the indexed pass brings games new to the store (fork #298)`, then `CACHED=$((CACHED + SC))` after `run-smart-cache`; the header ("the recently played pass re-reads games already there") against the pass's own comment ("each not yet cached")
- **What:** the two comments contradict each other; if the client's `run-smart-cache` result `cached` counts games it newly cached (the comment says the pass takes "each not yet cached"), those are new to the store and the card says "N GAMES ARE READY." where D-UI-107 wants "N MORE GAMES ARE READY.".
- **Failure scenario:** index off, player plays two new games online, link drops and returns; the recently-played pass caches both; stamp `cached=2 added=0`; card reads "<ready> GAMES ARE READY." and never says two were added.
- **Evidence:** the quoted lines. Refutation attempted: `run-smart-cache`'s `cached` semantics are outside the packet; the ctl's two comments cannot both be right.
- **Fix:** decide which the client's count means and either add `SC` to `ADDED` or correct the pass's comment.
- **Confidence:** medium.

### F-RA-11: Patch 015's `proxy_service.py` hunk uses `urlsplit` with no import in the hunk and no test; the network half has three tests, this half none
- **Severity:** Medium
- **Category:** Test gap
- **Where:** `projects/ROCKNIX/packages/network/raofflineproxy/patches/015-bounded-name-lookup.patch` — proxy_service.py hunk `@@ -850,6 +851,23 @@` (`resolved, reason = resolve_host_bounded(urlsplit(url).hostname or "")`), import hunk `@@ -44,6 +44,7 @@` (adds `resolve_host_bounded` only); tests hunk touches `linux/tests/test_linux_network.py` only
- **What:** if `proxy_service.py` at c1bd3724 does not already import `urlsplit`, every upstream attempt raises `NameError` in `forward_to_upstream` — every online request fails, and the failure is a traceback, not a 503.
- **Failure scenario:** import absent → RetroArch's login2 through the proxy gets no response → rcheevos disables achievements for the session on every launch while online.
- **Evidence:** the hunk as quoted; nothing in the packet shows the module's imports. Refutation attempted: `network.py`'s use of `urlsplit` is exercised by `test_head_upstream_does_not_connect_when_the_lookup_fails`; no equivalent covers `forward_to_upstream`.
- **Fix:** add `from urllib.parse import urlsplit` to the hunk if it is not already present, and a test that a failed lookup in `forward_to_upstream` returns the `network_error` tuple.
- **Confidence:** low — the import is likely present (the module parses query strings); the test gap is certain.

### F-RA-12: `raofflineproxy-refresh` stops after three failures in total while saying "in a row"
- **Severity:** Low
- **Category:** Correctness
- **Where:** `.../sources/raofflineproxy-refresh` — `main()`: `failed += 1 ... if failed >= 3: note("three failures in a row; stopping rather than hammering")`
- **What:** `failed` is never reset on success.
- **Failure scenario:** `refresh --all` over 500 games, three unrelated failures at games 10, 200, 400 → the run stops at 400 with `why REPEATED_FAILURES`; 100 games unrefreshed.
- **Evidence:** no `failed = 0` on the success path; `done += 1` only. Refutation attempted: none possible; the counter is total.
- **Fix:** a separate `in_a_row` counter reset on success, as `refresh_games` in patch 005 does.
- **Confidence:** high.

### F-RA-13: A valid PNG with bytes after IEND is refused by patch 013 and, if already cached, deleted and re-fetched on every verify pass
- **Severity:** Low
- **Category:** Correctness
- **Where:**
  - `.../patches/013-validate-a-cached-image-before-publishing-it.patch` — `if image_path.lower().endswith(".png") and not (payload.startswith(...) and b"IEND" in payload[-12:]): raise ValueError("not a whole PNG")`
  - `.../sources/raofflineproxy-cache-images` — `damaged()`: `handle.seek(-12, 2); if b"IEND" not in handle.read(12): return "no IEND"`, then `target.unlink()` in `main()`
- **What:** the IEND-in-last-12-bytes test rejects a PNG whose encoder appended trailing data (allowed by the format's readers). Such an asset is fetched, dropped, counted in `left`, and fetched again at the next pass; if it was cached before 013, `--verify` deletes it every pass.
- **Failure scenario:** one such badge → every scan and top-up ends `why SOME_IMAGES_NOT_SAVED`, one wasted request per pass, forever.
- **Evidence:** quoted. Refutation attempted: RetroAchievements' media pipeline is outside the packet; nothing here guarantees clean trailers.
- **Fix:** accept a PNG whose chunk walk reaches IEND wherever it ends (the walk in 013 already `break`s on IEND); in `damaged()`, use the same test.
- **Confidence:** medium.

### F-RA-14: The scan page's footer hard-codes controller letters, and the page draws no help bar on a handheld
- **Severity:** Low
- **Category:** Convention
- **Where:** `es-app/src/guis/GuiOfflineScan.cpp` — `update()`: `_("A  TRY AGAIN     B  CLOSE")`, `_("THIS CAN TAKE A WHILE. PRESS B TO CANCEL.")`, `_("PRESS B TO CANCEL.")`; `render()` (no `renderHelpPromptsEarly()`)
- **What:** es-ui-style-guide § Interaction rules: "Refer to buttons by cardinal position ... never console letters ... never hardcode 'press A'". es-code-traps: with full-screen menus on "Window::render draws no help prompts while a second page is open. A page that is not a MenuComponent and wants a bar draws it itself with renderHelpPromptsEarly()" — so `getHelpPrompts()`/`updateHelpPrompts()` here have no visible effect on a handheld and the hard-coded footer stands in for them. es-player-text § Recover describes the transfer page the same way ("TRY AGAIN (A) beside CLOSE (B)"), so the two rule files disagree and a maintainer decides; the diff follows the player-text file.
- **Failure scenario:** none demonstrated (a swapped South/East layout reads the wrong letter).
- **Evidence:** quoted; `getHelpPrompts()` returns prompts nothing renders. Refutation attempted: looked for `renderHelpPromptsEarly` in the page; none.
- **Fix:** draw the help bar from the page (`mWindow->renderHelpPromptsEarly()` when top) and drop the letters from the footer, or record the rule conflict and its resolution.
- **Confidence:** high on the text; medium on the bar (Window's behaviour is stated in the rule, not shown in the packet).

### F-RA-15: Offline with no device summary and no web API key, the summary page asks for a key it could not use
- **Severity:** Low
- **Category:** Player text
- **Where:** `es-app/src/RetroAchievements.cpp` — `getUserSummary()`, inside `if (offline)`: `if (getApiLogin().empty()) { ret.Status = getMissingLoginMessage(); return ret; }`; `es-app/src/OfflineAchievements.h` — the `proxyOffline` comment ("unknown is never read as offline: the web is asked then") against `OfflineAchievements.cpp` (`if (Utils::Platform::queryIPAddress().empty()) return true;`)
- **What:** the branch runs when the device is offline and the ctl gave no summary; the message sends the player to enter a web API key, which is the online path's precondition. The header's description of `proxyOffline` is the pre-#190 rule.
- **Failure scenario:** Wi-Fi off, store unreadable → "RETROACHIEVEMENTS NEEDS YOUR WEB API KEY. ENTER IT UNDER RETROACHIEVEMENTS SETTINGS..." instead of "THE OFFLINE ACHIEVEMENTS SERVICE DIDN'T ANSWER."
- **Evidence:** quoted. Refutation attempted: the game page's offline branch has no such key check, so the two pages already disagree.
- **Fix:** drop the key check inside the offline branch; update the header.
- **Confidence:** high.

### F-RA-16: None of the bucket's new player strings carries French in the packet
- **Severity:** Low
- **Category:** Player text
- **Where:** every `_("...")` added in `GuiOfflineScan.cpp`, `GuiRetroAchievementsSettings.cpp`, `ProxyCards.cpp`, `OfflineAchievements.cpp`, `RetroAchievements.cpp`, `GuiRetroAchievements.cpp`; no `locale/lang/fr/...po` hunk in the diff
- **What:** es-player-text D-UI-051: "a string added here gets its French written into locale/lang/fr/... in the same commit"; the same file records the fork's strings since 2026-08 as a known follow-up.
- **Failure scenario:** none demonstrated (falls through to English).
- **Evidence:** absence in the diff. Refutation attempted: the `.po` may be in another bucket's diff — outside this packet.
- **Fix:** French for the ~60 new msgids, or a written descoping.
- **Confidence:** medium (bucket boundary).

### F-RA-17: Dead flags, stale and contradictory comments, and a wasted store read
- **Severity:** Low
- **Category:** Documentation
- **Where:**
  - `es-app/src/ProxyCards.cpp` — `sSendShowing` (written, never read), `sTopUpRunning`/`TopUpEnd` (written, never read; `topUpRunning()` reads the file), `TopUpEnd::window` unused, `(void) self;` in `OfflineScanJob::run`
  - `.../sources/raofflineproxy-cache-images` — `_, _, _rows = missing_paths(storage)  # warm the same read` (a full walk of every cached row, result discarded); `print(__doc__ or "usage: ... [--seconds N]")` — the file has no docstring, so `-h` prints a usage without `--verify`
  - `.../sources/raofflineproxy-ctl` — header: the `account` description is split in two by the `summary` block; `summary` comment says "3 when the store cannot be read" but the shell turns 3 into `cannot_tell` (exit 2); the `Usage:` line lacks `summary`; `raofflineproxy-cache-indexed` is mode 100644 in-tree while its siblings are 100755
- **What:** each is a reader's trap rather than a runtime defect; the ctl's header is the interface's contract ("both answers are read through CloudText, so the shapes above are the contract"), so its errors matter more than usual.
- **Failure scenario:** none demonstrated.
- **Evidence:** as listed. Refutation attempted: searched the packet for readers of `sSendShowing`/`sTopUpRunning`; none.
- **Fix:** remove or use the flags; delete the warm read; add a docstring; fix the header and usage; `chmod 755` the helper.
- **Confidence:** high.

### F-RA-18: `getUserSummaryFromDevice` walks `FileData` from a worker thread
- **Severity:** Low
- **Category:** Concurrency
- **Where:** `es-app/src/RetroAchievements.cpp` — `getUserSummaryFromDevice()`: `FileData* file = GuiRetroAchievements::getFileData(std::to_string(game.id));` and `file->getSourceFileData()->getSystem()->getFullName()`; header comment "they run from GuiLoading's worker"
- **What:** es-code-traps § #246: a rescan deletes `FileData` on the interface thread; upstream's summary worker did not touch `FileData` (the constructor does, on the interface thread). This call moves the walk onto the worker.
- **Failure scenario:** a rescan while the summary loads → use of freed memory; frequency depends on what triggers `rescanIfFolderChanged`, outside the packet.
- **Evidence:** quoted. Refutation attempted: looked for a lock around the walk or for the lookup being deferred to the constructor; none.
- **Fix:** return the console name lookup to the constructor (as the web path does) or take the ids only and resolve on the interface thread.
- **Confidence:** low.

### F-RA-19: With the switch left on, every close of RETROACHIEVEMENTS SETTINGS while offline performs a blocking sign-in on the interface thread
- **Severity:** Low
- **Category:** Resource
- **Where:** `es-app/src/guis/GuiRetroAchievementsSettings.cpp` — the `addSaveFunc` hunk `@@ -89,20 +687,28 @@`: `if (newState && (accountChanged || token.empty()))` → `RetroAchievements::testAccount(...)` (an `HttpReq` on the save path)
- **What:** upstream turned the switch off on failure, ending the retries; the fork keeps it on (correctly, #175) so `token.empty()` stays true offline and the network call recurs at every close, on the thread that paints the screen.
- **Failure scenario:** a hotspot with a route and no DNS (the #242 state): each close of the page freezes for the request's connect timeout; the fork's own rule (es-code-traps § pooled connection) says a fetch on the interface thread is the freeze.
- **Evidence:** quoted. Refutation attempted: looked for an "am I online" gate before `testAccount`; none.
- **Fix:** skip the sign-in when `Utils::Platform::queryIPAddress().empty()` and leave it to `NetworkThread`, which the comment says already does it.
- **Confidence:** medium (pre-existing shape; the recurrence is the fork's).

### F-RA-20: `StartLimitInterval`/`StartLimitBurst` sit in `[Service]`
- **Severity:** Low
- **Category:** Build/packaging
- **Where:** `projects/ROCKNIX/packages/network/raofflineproxy/system.d/raofflineproxy.service` — `[Service]` section
- **What:** since systemd 230 both belong in `[Unit]` (`StartLimitIntervalSec=`); the old location is accepted for compatibility and logs a deprecation.
- **Failure scenario:** none demonstrated.
- **Evidence:** the unit as embedded. Refutation attempted: n/a.
- **Fix:** move to `[Unit]` as `StartLimitIntervalSec=60` / `StartLimitBurst=5`.
- **Confidence:** high.

### F-RA-21: "Held back from backups like the password" is asserted for the new web API key and cannot be shown from the packet
- **Severity:** Low
- **Category:** Security
- **Where:** `es-app/src/guis/GuiRetroAchievementsSettings.cpp` — `addInputTextConfigRow(_("WEB API KEY"), "global.retroachievements.key", true)` and its comment; `es-app/src/RetroAchievements.cpp` — `getApiLogin()` (the key in the query string)
- **What:** a new credential in `system.cfg`, which "travels in a settings backup" (ctl header). If `backuptool`'s exclusion list does not name the key, it leaves the device in every settings backup — Critical under the brief's scale if true.
- **Failure scenario:** not demonstrable here.
- **Evidence:** the comment is the only evidence; `backuptool` is outside the packet.
- **Fix:** show the exclusion (or add it) in the same change that adds the key.
- **Confidence:** low; raised because the cost of being wrong is a credential leaving the device.

### F-RA-22: `index-offline`'s marker causes a library listing that cannot contain the games it was written for
- **Severity:** Low
- **Category:** Documentation
- **Where:** `.../sources/raofflineproxy-ctl` — `do_index_offline()` and its comment ("the next link-return topup lists the library once for those games ... so the games added offline are cached when the device is next online"); `list_jobs` mode `indexed` (`I` jobs require a `cheevosId`); `es-app/src/ThreadedHasher.cpp` — the library-empty branch pops the queue before any hash is written
- **What:** the games that waited have no hash and no id (the constructor drops them before hashing), so `list_jobs indexed` produces no job for them. What actually caches them is a later index run with the library (the `NetworkThread` restart the `ThreadedHasher.h` comment mentions, outside the packet) followed by `topup --after-index`. The marker's listing is redundant for its stated purpose; the card's promise rests on code not in this bucket.
- **Failure scenario:** none beyond the misdescription (and F-RA-03's loss of the marker is then mostly harmless for these games).
- **Evidence:** as quoted. Refutation attempted: looked for the marker triggering an `H` (hash) job or an index run; it does neither.
- **Fix:** state the real mechanism in both comments, or make the marker trigger what it claims (a hash job list for games without a `cheevosHash` in the systems that were queued).
- **Confidence:** medium.

### F-RA-23: The ctl's external tools are not declared by the package
- **Severity:** Low
- **Category:** Build/packaging
- **Where:** `projects/ROCKNIX/packages/network/raofflineproxy/package.mk` — `PKG_DEPENDS_TARGET="toolchain Python3 raofflineproxy-rcheevos raofflineproxy-libchdr"`; `.../sources/raofflineproxy-ctl` — `flock`, `timeout`, `mkfifo`, `mktemp`, `logger`, `stat`, `systemctl`; `es-app/src/OfflineScanJob.cpp` — `setsid`
- **What:** packaging-and-patches § "A shipped script's tools are dependencies too": declare every CLI a shipped script invokes. Most are busybox applets whose presence depends on the image's busybox config, outside the packet; `logger` is one the rule's own check loop names.
- **Failure scenario:** none demonstrated.
- **Evidence:** as listed. Refutation attempted: no busybox config in the packet.
- **Fix:** declare `busybox systemd bash` (or whichever packages provide them) and run the rule's `MISSING:` loop over `flock timeout setsid mkfifo logger`.
- **Confidence:** medium.

## 3. Upstream fit

- **RetroArch patch `0013-cheevos-offline-proxy-toast.patch`** couples RetroArch's sign-in toast to a third-party proxy's private headers (`X-RA-Proxy`, `X-RA-Offline`) and edits `intl/msg_hash_fr.h` directly (RetroArch's translations are Crowdin-managed). A ROCKNIX maintainer will ask whether this belongs in the distribution's RetroArch patch set at all, and if so for the libretro issue it was offered under. The patch header carries a personal address (`Max Engel <max@awecelot.com>`), usual for git but worth a look at the project's convention.
- **Proxy patches 001–015** each say "Offered upstream as-is" and cite ROCKNIX decision IDs (D-RA-002, D-RA-016), audit items (#186 PL-xx) and device anecdotes ("the RG SP, 2026-09-15") in their bodies; none names an upstream PR. 010/012/014 add a fork-specific request header and behaviour; 004 has no title line; 006 is retired leaving a numbering gap the package comment explains. The package's `PKG_LONGDESC` claims "Approved by RetroAchievements.org" without a source. Expect push-back on carrying fifteen patches against a moving upstream and on the audit-log tone of the patch bodies.
- **`raofflineproxy-ctl`** is 1,700 lines of bash with four embedded Python programs and a header that is the interface's contract; the header's stale pin reference (F-RA-07), split `account` comment and missing `summary` in usage (F-RA-17) are commit hygiene a reviewer will trip on first.
- **Interface:** `#if defined(ROCKNIX)` blocks in `GuiRetroAchievementsSettings.cpp`; unrelated changes riding in the same file (PROGRESS TRACKER switch, WEB API KEY row and `getApiLogin()`, the sign-in save semantics, the completion-bar restyle in `GuiRetroAchievements.cpp`) — each defensible, none "offline achievements"; internal IDs (D-UI-xxx, D-RA-xxx, "audit #258 PL-028") throughout comments that a reader outside the fork cannot resolve; dead statics and unused captures (F-RA-17); `ProxyCards.cpp` duplicating `cloud_sync` stamp paths and `EXIT_SYNC` from `ThreadedCloudSync`.
- **Copyright/licence:** SPDX and ROCKNIX lines are present on every new package file and helper; `raofflineproxy` is `GPL-3.0-only` in a `GPL-2.0-or-later` tree (a separate program, but worth a note in the package). No JELOS/LibreELEC credit is owed for new packages.
- **Fork-only paths:** none personal; everything is under `/storage`, `/var/run`, `/usr`.

## 4. Coverage boundary

Not in the packet, so not judged:

- **RAOfflineProxy sources at c1bd3724:** `storage.py` (schema, `Storage` API), `cache_keys.py`, `rom_browser.add_rom_to_cache`, `run-smart-cache` and its result JSON, `probe-online`, `es_export` (`cached_game_ids.txt`), `handle_offline_request`, where `cached_login_response` comes from in `process_proxy_request` (decides whether `X-RA-Offline` can appear while online), whether `proxy_service.py`/`auth.py` import `urlsplit`/`json`/`cache_keys`, whether `image_cache._image_download_executor` and `shutdown_image_downloads` exist as the helper assumes, and whether the proxy's `sqlite3` file is named `proxy.sqlite3`.
- **Distribution files referenced but absent:** `setsettings.sh set_cheevos` and `cheevos_ppsspp.sh` (the routing of RetroArch/PPSSPP to 127.0.0.1:8080 that the whole bucket presumes), the retroarch `package.mk`, `099-networkservices` (how it treats an empty `STATE`), `get_setting`/`set_setting` (whether `default` deletes a key), `backuptool`'s exclusions (`global.retroachievements.key`/`token`, `/storage/.config/raofflineproxy`), the image's busybox applet list, Python3's `sqlite3`/`ssl` modules, `PKG_PYTHON_VERSION`/`python_compile`/`get_build_dir`, whether `scripts/install` copies `daemons/`.
- **Interface files referenced but absent:** `GuiGameAchievements.{h,cpp}` (the three-argument `show`, and the rendering of `FromDevice`/`NotOnDevice`/`Pending`/`ProxyDidNotAnswer`), `CloudText` (`parseScanStamp`, `parseRunningProgress` and its age bound, `parsePendingCount`, `parseFlushStamp`, `chooseThatFits`, `outcomeCandidates`, `exitSyncOwed`), `CloudExit.h`, `ThreadedCloudSync::writeStamp/isRunning/start`, `MultiLineMenuEntry::setDimmed/getDescription`, `SwitchComponent::setDimmed`, `HttpReqOptions::customHeaders/stallTimeout`, `Window::postToUiThread`, `createAsyncNotificationComponent(bool)`, `AsyncNotificationComponent::updateText(vector, vector)`, `Utils::String::shellQuote/maskSecrets`, `Utils::HtmlColor::applyColorOpacity`, `GuiRetroAchievements::getFileData`'s visibility, `saveToGamelistRecovery` and `Gamelist.cpp`'s `parentHash` semantics (the ctl's recovery-file test depends on it), `SystemData::loadConfig`'s handling of `es_systems_custom.cfg`, `SystemConf::saveSystemConf`, `NetworkThread` (calls to `ProxyCards::linkReturned` and the index restart on link-up), `FileData::launchGame`'s questions over running jobs, `WebImageComponent`'s use of `isProxyUrl`/`StoreOnlyHeader`, the tests' `CMakeLists.txt`, and the French `.po`.
- **RetroArch:** that `task_http` populates `http_transfer_data_t.headers`, and that rc_client invokes the login callback synchronously inside the http callback (the patch's premise).
- **Runtime:** every device and VM observation cited in comments (RG SP, RG35XX SP, "guest d", frame captures, the #179 hash check) is taken as reported; nothing in the packet re-produces it.