# Punch List — Epic #163 "Offline RetroAchievements" (the sixth candidate's content)

**Generated:** 2026-09-14
**Source audit:** `docs/audits/2026_09_14-epic-offline-retroachievements/04-analysis.md`
**Total items:** 33 (Critical: 0, High: 2, Medium: 19, Low: 12) — 22 the orchestrator's, 11 the GPT seat's confirmed additions (PL-23..PL-33); PL-16 and PL-17 re-graded to Medium on the seat's argument; the seat's G-01 is folded into PL-02
**Tracker:** [#186](https://github.com/maxengel/rocknix/issues/186) — every item is a checkbox there.
**Rule of the day:** D-WORKFLOW-015 — every item is fixed, at every severity; severity orders the work and excuses nothing.

---

## Instructions for Executing Agent

Each item is discrete. Work through them in order. For each: read the evidence, reproduce it where a probe is given, fix, verify against the stated Acceptance, and tick the box on the audit issue with the commit, frame or command output that proves it.

**Nothing in this list was fixed by the audit** — it ran under the maintainer's explicit no-change mandate (the audited branches, every document outside this folder and every issue other than its own were read-only). Items PL-01, PL-02 and PL-12 change the upstream client and are candidates for misantronic/RAOfflineProxy under D-RA-016; write each as a patch with an upstream-ready header like patches 001–004.

Seat attribution: PL-23..PL-33 are the GPT seat's (G-nn), each confirmed against the tree in `04-analysis.md` § Second opinion; PL-16/PL-17 carry its severity argument; PL-02 absorbs its G-01.

---

# High priority

## PL-01 — bound the client's hourly whole-library refresh, which patch 004 uncapped

- **Severity:** High
- **Category:** Interaction Defect / Cornerstone Violation (*before deleting a duplicate, diff its behaviours* — the cap bounded the refresh too)
- **Source finding:** F-19 (03 § 3.5, § 3.8; 04 § 4.5 survived)
- **Owner area:** `projects/ROCKNIX/packages/network/raofflineproxy/patches/` (a new 005), upstream `proxy_service.py` `PeriodicRefresh`
- **What:** `PeriodicRefresh.run` re-fetches `patch` and `unlocks` for **every** `patch:` row every 3600 s while online, with no age check, slice or cooldown (`proxy_service.py:1005-1057`; `rom_cache.py:140-176`). Upstream sized it under `MAX_CACHED_GAMES = 100`. Add a bound: refresh only rows older than 24 h (add a `cachedAt` test before `refresh_game_patch`), and only games in the client's recent history (`load_content_history_paths`) or a daily cap with jitter; keep the throttle. Offer the patch upstream with the arithmetic.
- **Where:** `proxy_service.py:1022-1057` (the loop), `rom_cache.py:140-176`; the fork's patch under `patches/005-*.patch`
- **Why:** a 1,000-game scanned library costs RetroAchievements ~2,000 GETs every online hour (~48,000/day per device), ten minutes of back-to-back requests each hour at the 0.3 s throttle; the proxy's User-Agent is registered with RA as a casual-only client — rate-limiting or revocation would hit every ROCKNIX user (D-RA-014 kept "as polite as before", which this is not).
- **Evidence (reproduction):** static — `sed -n '1022,1057p' proxy_service.py` shows the unbounded loop; `grep -n 'cachedAt\|older' rom_cache.py` → no age test in `refresh_game_patch`. Dynamic, on guest d with the toggle on and ≥3 games cached: `tail -f /storage/.config/raofflineproxy/service.log` an hour after start → one `patch` and one `unlocks` request per cached game within ~1 s of each other (expected today); after the fix, none for rows under 24 h.
- **Acceptance:** with N cached games and the device online for two hours, `service.log` shows ≤ max(recently-played, N/24-ish) `patch` requests per hour, never N; the harness (PL-05's case) or a unit test in the client pins the predicate; the patch header carries the numbers; an upstream issue/PR is drafted for the maintainer's go (D-RA-016).

## PL-02 — keep a scanned game's `achievementsets` (and `gameid`) rows alive past the client's 60-day eviction

- **Severity:** High
- **Category:** Interaction Defect (the eviction × the refresh × the scan)
- **Source finding:** F-20 (03 § 3.5; 04 § 4.5 survived) + the GPT seat's G-01 (a `patch:` row committed before a failed `unlocks`/`achievementsets` fetch counts the same way — `rom_cache.py:448-474` write order)
- **Owner area:** `patches/` (006), or `raofflineproxy-ctl topup`/`list_jobs`; upstream `storage.py`, `proxy_service.py`
- **What:** `evict_cache_older_than(now-60d)` deletes every `api_cache` row except `login2::*` and the UA row (`storage.py:479-493`); reads do not touch `cachedAt` (`:304-334`); the hourly refresh upserts `patch`, `unlocks`, `startsession` only (`proxy_service.py:1036-1057`); the offline `achievementsets` handler serves only a cached row, by hash then by the `gameid` alias, with no rebuild from `patch` (`:644-668`). So a scanned game the player has not launched online for 60 days stops loading offline in RetroArch 1.22 while its refreshed `patch` row keeps it in `cached_game_ids.txt` (`es_export.py:22-39`) → "N GAMES READY" over-counts and `list_jobs` skips it as cached. Fix one of: (a) refresh `achievementsets` (and re-upsert the `gameid` alias) beside `patch` in the refresh loop; (b) exempt from eviction any row whose game id is in `collect_cached_game_ids`; (c) in `list_jobs`, treat a game whose `achievementsets:<hash>` row is missing as **uncached** so the top-up re-adds it. (a)+(c) together are the honest pair.
- **Where:** `storage.py:479-493`; `proxy_service.py:1036-1057`, `:644-668`; `raofflineproxy-ctl:696-747` (`cached_ids`/`cached_paths` decide "cached")
- **Why:** D-RA-008 — the player must never have to care; a silent decay at 60 days on a casual cadence is exactly caring. `upgrade-and-install.md`: the format the scan writes is not what the launch reads.
- **Evidence (reproduction):** on guest d with a scanned game: `sqlite3 proxy.sqlite3 "UPDATE api_cache SET cachedAt = cachedAt - 61*86400000 WHERE cacheKey LIKE 'achievementsets:%'"` (or wait), let the hourly refresh run once → the `achievementsets` row is gone, `patch` row present, `cached_game_ids.txt` still lists the game; link off; launch → RetroArch `Load failed (-27): no cached response`. Expected after the fix: the row survives or is re-cached by the next top-up.
- **Acceptance:** the reproduction above loads the game offline after the fix; `raofflineproxy-ctl ready` never counts a game whose `achievementsets` row is missing (or the row cannot go missing while the game is exported); a harness case (PL-05) plants an aged row and asserts the outcome; patch header + upstream draft.

# Medium priority

## PL-03 — the ctl's online probe must not write the service's `online_state.json`

- **Severity:** Medium (High before refutation; the persistent case needs a resolver that flaps inside one 15 s tick)
- **Category:** Interaction Defect / Cornerstone Violation (a guard that fails open as a writer)
- **Source finding:** F-01 (03 § 3.1, § 3.5; 04 § 4.5)
- **Owner area:** `raofflineproxy-ctl` `is_online` (`:517-520`); upstream `main.py probe-online`
- **What:** `is_online` runs `python3 -m raofflineproxy.main probe-online`, which `save_online_state(online_check(...))`s into the shared file (`main.py:541-542`, non-atomic `state.py:62-67`); the service's monitor rewrites only at start and on a transition (`proxy_service.py:986-1001`); EmulationStation and the menu gates read that file as the proxy's own view (`OfflineAchievements.cpp:130-140`, `GuiMenu.cpp:179`, `:5087`). Run the probe with `RAOFFLINEPROXY_CONFIG_DIR` pointed at a scratch directory (`mktemp -d`) so it writes its own `online_state.json`, read that, and remove it — or, upstream, add `--state-file`/`--no-write` to `probe-online`. Do not read the service's file as the ctl's answer (the ctl needs a fresh probe).
- **Where:** `raofflineproxy-ctl:512-520`; optionally `main.py:541-542`
- **Why:** D-RA-011 makes "offline" the proxy's own probe; a second writer inverts it on the connect event the design cares about, and the pages then show "YOU'RE NOT ONLINE. SHOWING WHAT'S SAVED ON THIS DEVICE." online.
- **Evidence (reproduction):** toggle on, service online (`online_state.json` true); make the ctl's probe fail without touching the service (`RAOFFLINEPROXY_CONFIG_DIR` unchanged, `/etc/hosts`-style block is not available — instead run `raofflineproxy-ctl topup` during a staged resolver lag per `generic-x64-vm-testing.md` § "Lagging the guest's resolver" and read the file inside the same 15 s): today `{"online": false}` while `curl retroachievements.org` succeeds from the same guest; after the fix the file is untouched by the ctl.
- **Acceptance:** `strace -e trace=openat -f raofflineproxy-ctl topup` (or a shim) shows no write to `/storage/.config/raofflineproxy/online_state.json`; the harness case (PL-05) asserts the file's mtime is unchanged across a `scan` refusal.

## PL-04 — give the top-up the token check's patience, and mark the attempt only after a real answer

- **Severity:** Medium
- **Category:** Interaction Defect
- **Source finding:** F-03
- **Owner area:** `raofflineproxy-ctl do_topup` (`:966-994`)
- **What:** the mark is touched before the probe (`:982`) and the probe window is 3 × 5 s (`:987-990`); #175 measured the resolver 20–45 s behind the address on this boot shape and gave the token check 9 × 10 s (`CheevosRetry.h`). Probe on the same schedule (up to 90 s, bounded), and touch `last-topup-attempt` only after a successful probe or a refused sign-in — never after a probe that could not reach the server.
- **Where:** `raofflineproxy-ctl:976-994`
- **Why:** the first connect after boot is when a device that added games while offline should cache them; today that connect is refused and — the seat's correction — **nothing schedules a retry**: the next link change or an after-index run is the next chance, silently.
- **Evidence (reproduction):** stage the resolver lag (the `/storage/.config/resolv.conf` override), link up → `scan.log` reads `topup refused: offline by the proxy's probe` and `stat -c %Y last-topup-attempt` is now; a second `topup` within 30 min exits 0 at once.
- **Acceptance:** with the lag staged for 30 s, the top-up succeeds within 90 s of the link and the mark is set once; with no network at all, three probes and exit 69 with no mark.

## PL-05 — a harness case for `scan`, `topup` and `ready`

- **Severity:** Medium
- **Category:** Test Gap
- **Source finding:** F-04 (03 § 3.6)
- **Owner area:** `tools/last-good-scripts-test` (a new case t, beside p)
- **What:** under bwrap with the image's busybox: a shimmed `python3 -m raofflineproxy.main` (probe-online writes a chosen answer; `run-smart-cache` prints a result line; `cached-games-count`), a shimmed helper printing `OK`/`FAIL`/`DONE` lines from a script, a fixture `es_systems.cfg`, a gamelist with `cheevosHash`/`cheevosId`, a `recovery/<system>/` file with a matching and a stale `parentHash`, a `cached_game_ids.txt`. Assert: the four refusals (78/77/69/75) with no stamp; `list_jobs` writes I-jobs for indexed games only, H-jobs for an unindexed folder, skips a cached id and a stale recovery file; `write_stamp`'s line shape; the three-in-a-row abort → `RETROACHIEVEMENTS_STOPPED_ANSWERING`; `login required` → `SIGN_IN_REFUSED`; the half-hour mark and `--after-index`'s bypass; `ready` from the export; PL-03's mtime assertion; PL-04's mark rule. Prove each fails against the current script where it should (`--old`).
- **Where:** `tools/last-good-scripts-test` after `:1346`; header list `:57-75`
- **Why:** 600 lines of the ctl are proven only by hand on one guest; the epic's own habit (case p for `pending-ids`/`account`) shows the shape.
- **Acceptance:** `tools/last-good-scripts-test` PASSES with the new case; `BASE_REF=<pre-fix> --old` fails the PL-03/PL-04 assertions and passes the rest.

## PL-06 — make the index exist when the toggle goes on, or stop promising new games are added

- **Severity:** Medium
- **Category:** Spec Drift / Acceptance Criteria Gap (D-RA-013 on a clean install)
- **Source finding:** F-10 (03 § 3.1, § 3.7)
- **Owner area:** ES `GuiRetroAchievementsSettings.cpp` `apply` (`:282-326`), `:271`; #183
- **What:** `CheevosCheckIndexesAtStart` defaults `false` (`Settings.cpp:405`) and `topup` mode `indexed` writes I-jobs only, so a fresh device with the toggle on and no index gets no automatic caching beyond the client's recently-played pass — while the page's block ends `NEW GAMES ARE ADDED THE NEXT TIME YOU'RE CONNECTED.` unconditionally. Either: when the switch goes on and the setting is off, a second question after SCAN NOW/LATER — `INDEX NEW GAMES AT STARTUP, SO GAMES YOU ADD LATER EARN OFFLINE TOO?` YES/NO (EN+FR) — that sets `CheevosCheckIndexesAtStart`; or show the last sentence only while that setting is on. And close #183 box 1 (does the startup hasher actually run on a fresh guest?) — D-RA-013 stands on it.
- **Where:** `GuiRetroAchievementsSettings.cpp:271`, `:309-325`; `Settings.cpp:405`; #183
- **Why:** D-RA-013's promise is conditional on a setting most players never see; D-UI-055 says a sentence must be true of what happens.
- **Evidence:** a fresh guest, toggle on, no index, link off/on → `scan.log` `topup start: found=0 new=0 …`, the smart-cache pass only.
- **Acceptance:** on a fresh guest with the toggle turned on through the page and a new ROM added, the next boot online indexes it (hasher lines) and the next top-up caches it (`topup: cached 1 game(s), 1 from the index`); or the sentence is absent when the setting is off — one of the two, framed at 640x480 EN/FR.

## PL-07 — let a scan be left running, or bound a foreground pass

- **Severity:** Medium
- **Category:** Cornerstone Violation (es-native-ui tiers: "a job measured in minutes") / Improvement
- **Source finding:** F-16 (03 § 3.1, § 3.8)
- **Owner area:** ES `GuiOfflineScan.cpp` `input` (`:125-153`), `~GuiOfflineScan` (`:94-102`); `raofflineproxy-ctl scan`
- **What:** B while the scan runs = `KEEP SCANNING IN THE BACKGROUND` (the page closes; the ctl process continues — detach the popen'd child from the page's lifetime, or have the page start the ctl through `setsid` and stop reading; the row's line reports from `last-scan` when it ends), with the footer saying so; the destructor must not join a worker whose child is still running. Alternatively cap a foreground pass (e.g. 100 games per press) and end on `THE REST IS ADDED THE NEXT TIME YOU'RE CONNECTED.` The ctl is already resumable (uncached paths only).
- **Where:** `GuiOfflineScan.cpp:125-153`, `:94-102`, `:386-420`; `GuiRetroAchievementsSettings.cpp:117-159` (the row's line already reads the stamp)
- **Why:** a 1,000-game first scan is ~1–1.5 h (03 § 3.8) with every press refused on a 3.5" screen, and quitting the interface waits on it; the same work runs unattended as `topup`.
- **Evidence:** start a scan over the four QA ROMs, press B during `GAME 1 OF 4` → nothing happens (by design today); `pkill emulationstation` during a scan → the process lingers until the ctl exits.
- **Acceptance:** B during a scan returns to the page within a second with the ctl still running (`pgrep -f raofflineproxy-ctl`), the row's line updates when it finishes; frames EN/FR at 640x480; the fourth-tier rule in `es-native-ui.md` gains the sentence (P-03).

## PL-08 — heal RC-5's recovery files: a hash with no id gets its id without a re-hash

- **Severity:** Medium
- **Category:** Cornerstone Violation (*fixing forward is not enough*, blindspot 10)
- **Source finding:** F-18 (03 § 3.7)
- **Owner area:** ES `ThreadedHasher.cpp` (`:226-240`, `:146-164`)
- **What:** the startup hasher takes a game only when `forceAllGames || CheevosHash.empty()` (`:234`); RC-5 wrote recovery files with a hash and no id (#183 comment 14:14), and `ec2de8ae7` fixes only what is written from now on. Add a lookup-only branch: a game with a non-empty hash and an empty id whose hash is in `mCheevosHashes` gets its id set and saved (`saveToGamelistRecovery`) with no file read; count it in the notification.
- **Where:** `ThreadedHasher.cpp:226-240` (the queue), `:146-164` (the id block)
- **Why:** on a device upgraded from RC-5, every game indexed in a session that ended with a reboot has no id until a forced INDEX GAMES — no VIEW THIS GAME'S ACHIEVEMENTS, no I-job for the top-up.
- **Evidence:** on guest d, write a recovery file for Tobu with `<cheevosHash>` and no `<cheevosId>` (parentHash = the gamelist's size), reboot with the startup index on → no hasher line for it, `hasCheevos()` false (no VIEW THIS GAME'S ACHIEVEMENTS).
- **Acceptance:** the same setup on the fixed build sets the id at startup (a `CheckCheevosHash OK` line without a hash read, the recovery file gains `<cheevosId>`), and the entry appears; a walk frame pins it (#183 box 3).

## PL-09 — one bulk read for the offline RETROACHIEVEMENTS summary, and a fail-fast

- **Severity:** Medium
- **Category:** Improvement / Code Quality
- **Source finding:** F-17 (03 § 3.8)
- **Owner area:** ES `RetroAchievements.cpp` `getUserSummaryFromDevice` (`:386-447`); `raofflineproxy-ctl` (a `summary` verb) or the client's `cached-games`
- **What:** the summary calls `getGameInfoFromDevice` per exported id — two loopback requests each, sequential, `PROXY_TOTAL_MS` 15 s each with no fail-fast. Replace with one process: a `raofflineproxy-ctl summary` printing one line per cached game (`<id> <title> <achievements> <unlocked> <points> <pointsUnlocked>`) read from the store the way `pending-ids` is, or the client's JSON export; keep the per-game path for the game page. And stop after the first proxy failure in any loop that asks per game.
- **Where:** `RetroAchievements.cpp:395-407`; `OfflineAchievements.cpp:28-29`
- **Why:** 1,000 cached games = 2,000 requests behind a spinner (tens of seconds; 4 hours worst case on a hung proxy).
- **Acceptance:** the offline summary with 100 cached games opens in under two seconds on guest d (time from A to the list); with the proxy stopped mid-way it returns within one timeout, not N.

## PL-10 — frames of the RC-6 page and the French cards

- **Severity:** Medium
- **Category:** Missing Artifact
- **Source finding:** F-11 (03 § 3.6; AC-165-4, AC-166-1, AC-180-1, AC-184-2)
- **Owner area:** `docs/qa-frames/<date>/` + README rows; #184's acceptance line
- **What:** on the sixth candidate at 640x480 (and 1280x800 for the page): the RETROACHIEVEMENTS SETTINGS row `OFFLINE ACHIEVEMENTS (BETA)`; the page (title, switch, scan row, spacer, the block — does it fit, does it scroll); the SCAN NOW/LATER prompt; the scan page running and done; the two cards (`…WILL BE SENT…`, `…HAVE BEEN SENT…`) and the two achievements pages — each in EN **and FR**. The block's French is 30% longer than the English.
- **Where:** `docs/qa-frames/`, `tools/vm-walks/` (the `to-offline-page`/`scan-*` steps exist)
- **Why:** the longest single text the fork shows has never been seen on the panel it is for; three ticked criteria claim frames "in both languages" that exist in one.
- **Acceptance:** the frames exist with README rows; the block is fully visible or the page scrolls to it; nothing clips; #184's boxes tick on them.

## PL-11 — the rocknix.org page for offline achievements

- **Severity:** Medium
- **Category:** Documentation Gap (documentation-accuracy hard gate for phase 5)
- **Source finding:** F-14 (AC-168-1 FAIL)
- **Owner area:** `ROCKNIX/rocknix.org` `docs/configure/retroachievements.md` (or a new page); #168
- **What:** draft the page beside the fork change: what OFFLINE ACHIEVEMENTS (BETA) is (casual only; turning it on turns hardcore off), the toggle and its page, the scan and the index relation (D-RA-013), what earns offline and when a new game does, the two card sentences, what a settings backup carries (the toggle, never the cache), the `'!RA!'` badge. Keep it in the fork's `docs/` until the PR (personal path), then the site PR with #42's ordering.
- **Where:** a draft under `docs/` in this repo; the site PR
- **Acceptance:** the draft exists and every sentence matches the code (PL-19's amended bodies); #168 box 1 ticks on it.

# Low priority

## PL-12 — gate the client's automatic log upload (defensive; unreachable on this image today)

- **Severity:** Low (High before refutation)
- **Category:** Improvement / upstream item
- **Source finding:** F-02 (04 § 4.5 killed as a High: `storage.py:41` always sqlite; the incident is recorded only in the JSON backend's quarantine)
- **What:** a patch (007) or config default `upload_logs: false` honoured by `retry_storage_corruption_report` (`proxy_service.py:1060-1076`) so the path stays off if a future client version records incidents for sqlite too; and add the item (design note § 11 item 4: an opt-in gate, `u=` redaction) to #168's upstream list.
- **Where:** `proxy_service.py:1060-1076`; `log_uploader.py:99-113`, `:352-378`; #168
- **Acceptance:** with a planted incident file, `service.log` shows no `request-upload` call; #168 lists the item.

## PL-13 — `qa-accounts clear` takes the proxy's cached sign-in out too

- **Severity:** Low
- **Category:** Test Gap / tooling
- **Source finding:** F-05
- **What:** when `/storage/.config/raofflineproxy/proxy.sqlite3` holds a `login2::` row (or simply when the folder exists and the toggle is off), `clear` removes the folder (after `raofflineproxy-ctl disable` if the toggle is on, or refuses and says so) and reports it by name; five verification comments removed it by hand.
- **Where:** `tools/qa-accounts:56-73`
- **Acceptance:** after `ra` + a proxied launch, `clear` leaves no `raofflineproxy/` folder and prints what it removed; `clear` on a guest with the toggle on says what it did not touch and why.

## PL-14 — `ra-offline-test` sends the web API key to curl over stdin

- **Severity:** Low
- **Category:** Cornerstone Violation (#151 PL-09's rule: a value never on a command line)
- **Source finding:** F-06
- **What:** `earned()` (`:196`) puts `y=${RA_QA_WEBKEY}` in the URL argument; use `curl -K -` with `url = "…"` on stdin (or `--data-urlencode` on a POST if the API accepts it).
- **Where:** `tools/ra-offline-test:195-198`
- **Acceptance:** `ps` during `earned()` shows no key; the fixture still PASSes step 2.

## PL-15 — drop the cap's words: `CACHE_CAP=100` and `THE LIMIT OF 100 GAMES WAS REACHED.`

- **Severity:** Low
- **Category:** Code Quality
- **Source finding:** F-07
- **What:** remove `CACHE_CAP` (`ctl:190-192`, `:850`) and reword the `LIMIT_REACHED` note to a number-free sentence (or drop the path if the client can no longer say it) — `GuiOfflineScan.cpp:280-281` + the French msgstr; check `docs/es-menu-map.md` for the number.
- **Acceptance:** `grep -rn '100' raofflineproxy-ctl GuiOfflineScan.cpp` finds no cap; msgfmt clean.

## PL-16 — `enable` writes the toggle last and rolls back on any failure (a `hardcore_was` write failing after `KEY=1` leaves the toggle on)

- **Severity:** Medium (re-graded from Low on the GPT seat's argument: the read-backs run KEY, HARDCORE, HARDCORE_WAS in that order, so a failed record leaves `offlineproxy=1` in `system.cfg`, the page's switch reverted, the boot pass and launchers honouring the 1 — a persistent inconsistency, not a temporary orphan)
- **Category:** Code Quality (fail-closed completeness)
- **Source finding:** F-08
- **What:** in `do_enable`, write `hardcore_was` and `hardcore` first and `KEY=1` **last**, read each back before the next, and on any failure roll back what was written (`set_setting … default` for the record, the previous hardcore value, `systemctl stop`, `rm -f "${MARKER}"`) in a cleanup function, so a failed enable leaves the device exactly as it was.
- **Where:** `raofflineproxy-ctl:277-308`
- **Acceptance:** harness case p gains "a set_setting that fails at each of the three writes leaves the toggle 0, hardcore as it was, the record absent, the service stopped and the marker gone" (three sub-cases).

## PL-17 — `MAX_SCAN_ENTRIES` starves everything past the first 5,000 files of an unindexed folder, on every scan

- **Severity:** Medium (re-graded from Low on the GPT seat's argument)
- **Category:** Code Quality
- **Source finding:** F-09
- **What:** `list_jobs` caps `walked` at 5,000 files **before** cached paths are removed (`ctl:776-784`), so every scan walks the same first 5,000 and skips the cached ones — entry 5,001 is never reached. Filter cached paths during the walk (so the cap counts *uncached* files), or resume from a saved cursor; print `truncated=1` and `slog` it; and make the dialog's `EVERY GAME ON THIS CONSOLE` true or qualified (`SCAN_SYSTEMS` also limits the folders).
- **Acceptance:** a fixture folder of 5,001 uncached files, scanned twice with a cap of 10 for the test → the second scan reaches files the first did not; the summary says `truncated=`; harness case t asserts it.

## PL-18 — register: refine D-UI-053's title clause, record D-RA-004's final wording, note the D-RA-015 gap

- **Severity:** Low
- **Category:** Documentation Gap
- **Source finding:** F-12
- **What:** a row refining D-UI-053 ("(BETA) in the page title too, per #184 note 2 / D-UI-054"); a row settling D-RA-004's wording as shipped (achievements are *sent*, saves are *synced*; the three card sentences verbatim); a one-line note that D-RA-015 was never issued (or issue it for a decision this list makes). `tools/register-check` passes.
- **Acceptance:** the rows exist, cited by ID from the code comments that quote the wording.

## PL-19 — bodies: amend #173, #179, #163; attach the milestone to #179 #180 #183 #184

- **Severity:** Low
- **Category:** Documentation Gap (blindspot 27)
- **Source finding:** F-13
- **What:** #173 AC2 → "at the next sync card that reaches the network" (D-RA-004); #173 AC3 → decide: build it or strike it with the reason (the interface cannot see an award RetroArch failed to send); #179 AC2 → drop "never exceeds the cap" (D-RA-014); #163 boxes 1–2 → tick with the row ids; the four issues → milestone "Offline RetroAchievements".
- **Acceptance:** `gh issue view` shows the edits; the bodies and the register agree.

## PL-20 — the account name in the proxy's request log (upstream item)

- **Severity:** Low
- **Category:** Improvement / upstream
- **Source finding:** F-15
- **What:** `redact_form_tokens` and `redact_query_tokens` redact `t`/`p` and not `u` (`network.py:19`, `utils.py:110-124`); add `u=` redaction to #168's upstream list (design note § 11 item 4 already asks). Nothing to change in the fork: `service.log` is neither bundled nor backed up.
- **Acceptance:** the item is on #168.

## PL-21 — the unit-test recipe in `es-code-traps.md` gains `-DRAPIDJSON_INCLUDE_DIR`

- **Severity:** Low
- **Category:** Documentation Gap
- **Source finding:** F-21
- **What:** the documented cmake line fails on `rapidjson/document.h was not found`; add `-DRAPIDJSON_INCLUDE_DIR=$B/toolchain/x86_64-rocknix-linux-gnu/sysroot/usr/include` as the test's own CMakeLists says.
- **Acceptance:** the command in the rule runs as written.

## PL-22 — say in the ctl which schema it reads, and add a version guard upstream

- **Severity:** Low
- **Category:** Code Quality / upstream
- **Source finding:** F-22
- **What:** a header line in the ctl naming the tables and columns it reads (`pending_awards.status/achievementId/queuedAt`, `api_cache.cacheKey/responseBody`) and the client commit they come from; upstream, a `schema_version` row the ctl could check before `cannot_tell`.
- **Acceptance:** the header line exists; #168 lists the schema item.


## PL-23 — readiness is keyed by game id alone; the account and the ROM hash are lost *(GPT seat G-02)*

- **Severity:** Medium
- **Category:** Interaction Defect
- **Source finding:** G-02 (04 § Second opinion, confirmed)
- **Owner area:** `raofflineproxy-ctl list_jobs` (`:696-747`); upstream `es_export.py`, `auth.py`
- **What:** `collect_cached_game_ids` reads `patch:<id>:<user>` and `achievementsets` rows for **any** user and any hash (`es_export.py:22-39`); `list_jobs` skips a game when its id is in that set (`ctl:745`). So on a device that has seen two accounts (the QA account and the maintainer's on one guest is exactly this) the second account's games are never cached for it, and an alternate dump (a different hash for a cached id) never gets its `achievementsets:<hash>` row. `resolve_credentials` also takes cached credentials before the configured password without checking the user (`auth.py:50-52`).
- **Where:** `ctl:696-747`; `es_export.py:22-39`; `auth.py:42-69`
- **Why:** one console, one player is the model — but the QA workflow violates it on purpose, and a second dump of a game is ordinary.
- **Acceptance:** a harness fixture with `patch:<id>:userA` only → `list_jobs` for `userB` writes the I-job; a second hash for a cached id writes it too; the helper's credentials carry the configured user or fall through to the password.

## PL-24 — scattered per-game failures still end in `COMPLETED` *(GPT seat G-03)*

- **Severity:** Medium
- **Category:** Cornerstone Violation (D-UI-030: a run whose parts disagree is COULDN'T FINISH)
- **Source finding:** G-03 (confirmed)
- **Owner area:** `raofflineproxy-cache-indexed` (`:147-179` exits 0 with failures), `raofflineproxy-ctl run_jobs`/`do_scan` (`:863-872`, `:942-949`)
- **What:** only three failures in a row, a refusal, or a non-zero helper exit fail the run; one or two transport failures, or failures separated by successes, leave rc 0 and `COMPLETED` on the page and the row. Distinguish RetroAchievements' "no match" (a skip) from a caching **error**; any unresolved error → rc 1 with `why=SOME_GAMES_COULDN'T_BE_SAVED` (a new token) and the page says how many; the next scan retries them (it does today).
- **Acceptance:** a fixture run with one FAIL among successes ends `COULDN'T FINISH` with the count; harness case t asserts it; `--old` shows COMPLETED.

## PL-25 — one refresh error kills the client's refresh thread for the service's lifetime *(GPT seat G-04; upstream)*

- **Severity:** Medium
- **Category:** Code Quality / upstream item (inherited)
- **Source finding:** G-04 (confirmed by grep: no `try` in `proxy_service.py:1021-1057`)
- **What:** `refresh_game_patch` raises `CacheGameError` on any network or API failure; `PeriodicRefresh.run` has no exception boundary, so the daemon thread dies and the service runs on without refresh — and without the eviction (which is the one accidental mitigation of F-20). Patch (with PL-01's bound): a try/except per game, an auth failure ends the pass, a bounded backoff.
- **Where:** `proxy_service.py:1021-1057`; `rom_cache.py:158-169`
- **Acceptance:** a fixture pass whose first request raises leaves the thread alive and the next pass running; upstream draft on #168.

## PL-26 — malformed or empty answers become valid empty progress *(GPT seat G-06)*

- **Severity:** Medium
- **Category:** Cornerstone Violation (guards must fail closed) / Code Quality
- **Source finding:** G-06 (confirmed)
- **Owner area:** ES `RetroAchievements.cpp` (`:329-336`, `:395-447`), `OfflineAchievementsText::parseUnlocks`, `raofflineproxy-ctl do_account` (`:418-424`)
- **What:** a 200 `unlocks` whose body is not the expected shape parses to an empty list and the page shows every badge locked; a summary whose every per-game lookup failed still sets `Username`/`FromDevice` and is taken over the web's error (`:575-576`); `do_account` prints 0 for absent score fields. Carry validity separately from emptiness: `parseUnlocks` reports "not the shape" and `getGameInfoFromDevice` then returns `ID 0`; the summary returns empty `Username` when no game answered; `do_account` exits 1 when a field is absent.
- **Acceptance:** `OfflineAchievementsTextTests` gains the malformed-unlocks case; the summary over a stopped proxy shows the web's error, not an empty list; harness p asserts `account` on a row without scores exits 1.

## PL-27 — the toggle's `apply` runs the ctl on the UI thread *(GPT seat G-07)*

- **Severity:** Medium
- **Category:** Cornerstone Violation (es-native-ui: the UI thread never blocks on a process)
- **Source finding:** G-07 (confirmed; noted in 02 AC-165-2 and not raised there)
- **Owner area:** ES `GuiRetroAchievementsSettings.cpp` `apply` (`:282-326`)
- **What:** `executeScriptLegacy` runs `raofflineproxy-ctl enable|disable` synchronously; `disable` waits on `systemctl stop` (`TimeoutStopSec=15`). Run it from a thread (the pattern `sayAfterGame` uses), dim/disable the switch while pending, and set the rows from the ctl's answer on `postToUiThread`.
- **Acceptance:** with a systemctl shim that sleeps 10 s on stop, the interface keeps rendering and answering B during the toggle; the hardcore row updates when the ctl returns.

## PL-28 — the top-up's 15-minute bound is not one bound *(GPT seat G-08)*

- **Severity:** Medium
- **Category:** Code Quality
- **Source finding:** G-08 (confirmed)
- **Owner area:** `raofflineproxy-ctl do_topup` (`:997-1029`), `take_lock` (`:545-556`)
- **What:** listing is untimed; the indexed pass gets a fresh `TOPUP_TIMEOUT`; only the recently-played pass uses the remainder; `--after-index` may first wait 900 s for the lock. One deadline from `START` across listing and both passes (`timeout $((TOPUP_TIMEOUT - elapsed))` for each child), and the lock wait counted against it.
- **Acceptance:** with listing delayed 2 min and a helper that would run 15 min, the run ends within 15 min of `START`; harness case t asserts the deadline.

## PL-29 — the credential filter passes `global.retroachievements.key=<value>` and single-quoted values *(GPT seat G-10)*

- **Severity:** Medium
- **Category:** Cornerstone Violation (D-INFRA-011: the one helper decides what a credential looks like)
- **Source finding:** G-10 (confirmed by canaries this session: `set_setting global.retroachievements.key=<canary>` and `cheevos_password='<canary>'` survived; `"…"` and bare values were redacted; a `t=` not preceded by `?`/`&` survived)
- **Owner area:** `projects/ROCKNIX/packages/rocknix/profile.d/001-functions:56-88`; harness case r
- **What:** add `\.key\b` (the RA web key's setting name) to the word list — or the explicit key `retroachievements\.key` — extend the assignment rules to `'…'` values, and let the RA-line rule match `[?& ]` before `[pty]=`. No current writer logs these shapes; the guard exists so the next writer is covered. Plant the canaries in case r (fails before, passes after).
- **Acceptance:** the three canaries above read `<redacted>` under the image's busybox sed; case r asserts them.

## PL-30 — `disable` does not stop a running scan or top-up *(GPT seat G-11)*

- **Severity:** Medium
- **Category:** Interaction Defect
- **Source finding:** G-11 (confirmed)
- **Owner area:** `raofflineproxy-ctl do_disable` (`:310-333`), `run_jobs` (`:818-891`)
- **What:** `disable` stops the unit and leaves a `scan`/`topup` helper started by the interface running — requesting RetroAchievements and writing the store after the toggle is off. Have `disable` take the scan lock non-blocking; if held, signal the runner (a `disable-requested` file the `run_jobs` loop checks between lines, or `pkill -TERM` on the helper via the lock holder's pid file) and wait bounded for it to stop; `refuse_unless_ready` already covers the next start.
- **Acceptance:** a slow fixture top-up + `disable` → the helper is gone within 10 s and no further client lines reach `scan.log`; harness case t asserts it.

## PL-31 — an unreadable hardcore setting routes through the proxy; PPSSPP's unquoted master test *(GPT seat G-05, partly)*

- **Severity:** Low
- **Category:** Code Quality
- **Source finding:** G-05 (partly confirmed: the same empty read also writes `cheevos_hardcore_mode_enable` empty, so the session is consistently softcore and RA judges by RetroArch's `h=` flag — no hardcore award is lost; PPSSPP's `[ ! ${enabled} = 1 ]` is upstream ROCKNIX's 2022 line)
- **What:** in `setsettings.sh:512-513` treat an empty `CHEEVOS_HARDCORE` as "direct" (the safe side) rather than "not hardcore"; quote `cheevos_ppsspp.sh:21` (`[ "${enabled}" != 1 ]`).
- **Acceptance:** with `retroachievements.hardcore` unreadable, the appendconfig carries no `cheevos_custom_host`; `bash -n` and the launch path unchanged otherwise.

## PL-32 — `flushed` reads the stamp and then unlinks it *(GPT seat G-09)*

- **Severity:** Low
- **Category:** Code Quality
- **Source finding:** G-09 (confirmed)
- **What:** rename `last-flush` to a consumer-owned name first (`mv -f last-flush last-flush.$$`), then read and remove that; a stamp the service replaces between the two steps is not lost, and two readers cannot report one.
- **Where:** `raofflineproxy-ctl:440-452`
- **Acceptance:** harness p: a stamp replaced between read and remove is reported by the next call.

## PL-33 — concurrent badge downloads share one `.tmp` path *(GPT seat G-12; upstream)*

- **Severity:** Low
- **Category:** Code Quality / upstream item
- **Source finding:** G-12 (confirmed as read)
- **What:** `download_static_image` writes `<target>.tmp` and renames; two workers (or the helper's pool and the service's) for one asset collide. Unique temp names (`.tmp.<pid>.<thread>`) and a per-asset in-flight set. An item for #168.
- **Where:** `image_cache.py:150-195`
- **Acceptance:** the item is on #168; optionally a patch.

## Pre-existing tracked scope (NOT punch items — exempt from the resolution gate)

- #167, #179 box 4, #180 box 4, #184 (the handheld halves) — the maintainer's device round.
- #180 box 2 (the earned-pending marker) — blocked by D-RA-006 (a QA reset or a second account).
- #183 boxes 1–3 — open; PL-06 and PL-08 lean on box 1 and box 3.
- #168 (phase 5) — the upstream list; PL-01, PL-02, PL-12, PL-20, PL-22 add to it.
- D-UI-051's follow-up — the 69 pre-existing cloud strings without French (not this epic's).

## Machine-readable index

```yaml
punch_index:
- {id: PL-01, severity: High,   category: Interaction Defect, source_finding: F-19, owner_area: raofflineproxy patches / upstream PeriodicRefresh, where: proxy_service.py:1022-1057, acceptance: "refresh bounded by age and recency; harness/unit pins it; upstream draft", outcome: open}
- {id: PL-02, severity: High,   category: Interaction Defect, source_finding: F-20, owner_area: raofflineproxy patches / ctl list_jobs, where: storage.py:479-493; proxy_service.py:644-668,1036-1057; raofflineproxy-ctl:696-747, acceptance: "an aged achievementsets row is refreshed or re-cached; ready never over-counts", outcome: open}
- {id: PL-03, severity: Medium, category: Interaction Defect, source_finding: F-01, owner_area: raofflineproxy-ctl is_online, where: raofflineproxy-ctl:512-520, acceptance: "the ctl never writes the service's online_state.json", outcome: open}
- {id: PL-04, severity: Medium, category: Interaction Defect, source_finding: F-03, owner_area: raofflineproxy-ctl do_topup, where: raofflineproxy-ctl:976-994, acceptance: "90 s probe window; mark only after a real answer", outcome: open}
- {id: PL-05, severity: Medium, category: Test Gap, source_finding: F-04, owner_area: tools/last-good-scripts-test, where: tools/last-good-scripts-test:1346+, acceptance: "case t passes; --old fails PL-03/PL-04 assertions", outcome: open}
- {id: PL-06, severity: Medium, category: Spec Drift, source_finding: F-10, owner_area: ES GuiRetroAchievementsSettings apply; #183, where: GuiRetroAchievementsSettings.cpp:271,309-325, acceptance: "a fresh guest indexes and caches an added game, or the sentence is conditional; frames", outcome: open}
- {id: PL-07, severity: Medium, category: Cornerstone Violation, source_finding: F-16, owner_area: ES GuiOfflineScan, where: GuiOfflineScan.cpp:94-153, acceptance: "B leaves the scan running; the row reports; frames; rule P-03", outcome: open}
- {id: PL-08, severity: Medium, category: Cornerstone Violation, source_finding: F-18, owner_area: ES ThreadedHasher, where: ThreadedHasher.cpp:226-240,146-164, acceptance: "hash-no-id games gain an id at startup without a re-hash; walk frame", outcome: open}
- {id: PL-09, severity: Medium, category: Improvement, source_finding: F-17, owner_area: ES RetroAchievements getUserSummaryFromDevice; ctl summary, where: RetroAchievements.cpp:395-407, acceptance: "offline summary of 100 games under 2 s; one timeout on a hung proxy", outcome: open}
- {id: PL-10, severity: Medium, category: Missing Artifact, source_finding: F-11, owner_area: docs/qa-frames; #184, where: docs/qa-frames/<date>/, acceptance: "RC-6 page and cards framed EN+FR at 640x480 (+1280 page)", outcome: open}
- {id: PL-11, severity: Medium, category: Documentation Gap, source_finding: F-14, owner_area: rocknix.org; #168, where: docs/ draft then the site PR, acceptance: "the page draft exists and matches the code", outcome: open}
- {id: PL-12, severity: Low,    category: Improvement, source_finding: F-02, owner_area: raofflineproxy patches; #168, where: proxy_service.py:1060-1076, acceptance: "upload gated off; item on #168", outcome: open}
- {id: PL-13, severity: Low,    category: Test Gap, source_finding: F-05, owner_area: tools/qa-accounts, where: tools/qa-accounts:56-73, acceptance: "clear removes the proxy folder and says so", outcome: open}
- {id: PL-14, severity: Low,    category: Cornerstone Violation, source_finding: F-06, owner_area: tools/ra-offline-test, where: tools/ra-offline-test:195-198, acceptance: "no key in argv; step 2 passes", outcome: open}
- {id: PL-15, severity: Low,    category: Code Quality, source_finding: F-07, owner_area: raofflineproxy-ctl; GuiOfflineScan, where: raofflineproxy-ctl:190-192,850; GuiOfflineScan.cpp:280-281, acceptance: "no cap number remains", outcome: open}
- {id: PL-16, severity: Medium, category: Code Quality, source_finding: F-08, owner_area: raofflineproxy-ctl do_enable, where: raofflineproxy-ctl:277-308, acceptance: "the toggle is written last; any failure rolls back; harness p three sub-cases", outcome: open}
- {id: PL-17, severity: Medium, category: Code Quality, source_finding: F-09, owner_area: raofflineproxy-ctl list_jobs, where: raofflineproxy-ctl:776-784, acceptance: "a second scan reaches files past the cap; truncated= in the summary", outcome: open}
- {id: PL-18, severity: Low,    category: Documentation Gap, source_finding: F-12, owner_area: docs/decision-register.md, where: rows D-UI-053, D-RA-004, D-RA-015, acceptance: "refining rows exist; register-check passes", outcome: open}
- {id: PL-19, severity: Low,    category: Documentation Gap, source_finding: F-13, owner_area: issues #173 #179 #163 #180 #183 #184, where: issue bodies, acceptance: "bodies amended; milestone attached", outcome: open}
- {id: PL-20, severity: Low,    category: Improvement, source_finding: F-15, owner_area: #168 upstream list, where: network.py:19; utils.py:110-124, acceptance: "item on #168", outcome: resolved}
- {id: PL-21, severity: Low,    category: Documentation Gap, source_finding: F-21, owner_area: .claude/rules/es-code-traps.md, where: the unit-test recipe, acceptance: "the command runs as written", outcome: open}
- {id: PL-22, severity: Low,    category: Code Quality, source_finding: F-22, owner_area: raofflineproxy-ctl header; #168, where: raofflineproxy-ctl:1-150, acceptance: "schema named; item on #168", outcome: open}
- {id: PL-23, severity: Medium, category: Interaction Defect, source_finding: G-02, owner_area: raofflineproxy-ctl list_jobs; upstream es_export/auth, where: raofflineproxy-ctl:696-747; es_export.py:22-39; auth.py:42-69, acceptance: "readiness keyed by user and hash; credentials carry the configured user", outcome: open}
- {id: PL-24, severity: Medium, category: Cornerstone Violation, source_finding: G-03, owner_area: raofflineproxy-cache-indexed; raofflineproxy-ctl run_jobs, where: raofflineproxy-cache-indexed:147-179; raofflineproxy-ctl:863-872,942-949, acceptance: "an unresolved caching error ends COULDN'T FINISH with a count", outcome: open}
- {id: PL-25, severity: Medium, category: Code Quality, source_finding: G-04, owner_area: raofflineproxy patches; upstream PeriodicRefresh, where: proxy_service.py:1021-1057, acceptance: "a raising request leaves the refresh thread alive; upstream draft", outcome: open}
- {id: PL-26, severity: Medium, category: Cornerstone Violation, source_finding: G-06, owner_area: ES RetroAchievements; OfflineAchievementsText; ctl do_account, where: RetroAchievements.cpp:329-336,395-447; raofflineproxy-ctl:418-424, acceptance: "malformed answers are invalid, not empty; tests added", outcome: open}
- {id: PL-27, severity: Medium, category: Cornerstone Violation, source_finding: G-07, owner_area: ES GuiRetroAchievementsSettings apply, where: GuiRetroAchievementsSettings.cpp:282-326, acceptance: "the toggle runs the ctl off the UI thread; the interface renders during a 10 s stop", outcome: open}
- {id: PL-28, severity: Medium, category: Code Quality, source_finding: G-08, owner_area: raofflineproxy-ctl do_topup/take_lock, where: raofflineproxy-ctl:997-1029,545-556, acceptance: "one deadline from START across listing, the lock wait and both passes", outcome: open}
- {id: PL-29, severity: Medium, category: Cornerstone Violation, source_finding: G-10, owner_area: profile.d/001-functions; harness case r, where: 001-functions:72-78, acceptance: "three canaries read <redacted> under busybox sed; case r asserts them", outcome: open}
- {id: PL-30, severity: Medium, category: Interaction Defect, source_finding: G-11, owner_area: raofflineproxy-ctl do_disable/run_jobs, where: raofflineproxy-ctl:310-333,818-891, acceptance: "disable ends a running helper within 10 s", outcome: open}
- {id: PL-31, severity: Low,    category: Code Quality, source_finding: G-05, owner_area: setsettings.sh; cheevos_ppsspp.sh, where: setsettings.sh:512-513; cheevos_ppsspp.sh:21, acceptance: "an unreadable hardcore reads as direct; the PPSSPP test is quoted", outcome: open}
- {id: PL-32, severity: Low,    category: Code Quality, source_finding: G-09, owner_area: raofflineproxy-ctl do_flushed, where: raofflineproxy-ctl:440-452, acceptance: "rename-then-read; harness p asserts no lost stamp", outcome: open}
- {id: PL-33, severity: Low,    category: Code Quality, source_finding: G-12, owner_area: #168 upstream list; image_cache.py, where: image_cache.py:150-195, acceptance: "item on #168", outcome: open}
```

# Phase 7 resolution gate

The audit ran under the maintainer's no-fix mandate ("Do not fix anything. The audit's product is the punch list; fixes are a separate stream"), so no item is Resolved here. Every item is **Deferred, by name, to the fix stream tracked on the audit issue #186** — a named deferral under D-WORKFLOW-015 (all severities get fixed), not a severity excuse. The fix stream records each outcome on that issue's checklist with the commit, frame or command output that proves the item's Acceptance, and re-runs `tools/lint-audit-artifacts … --issue 186` when the last one lands.

| Item | Outcome (2026-09-14) |
| --- | --- |
| PL-01 | Deferred — fix stream on #186 (client patch 005 + upstream draft) |
| PL-02 | Deferred — fix stream on #186 (client patch 006 / ctl) |
| PL-03 | Deferred — fix stream on #186 |
| PL-04 | Deferred — fix stream on #186 |
| PL-05 | Deferred — fix stream on #186 |
| PL-06 | Deferred — fix stream on #186 (with #183) |
| PL-07 | Deferred — fix stream on #186 |
| PL-08 | Deferred — fix stream on #186 (with #183) |
| PL-09 | Deferred — fix stream on #186 |
| PL-10 | Deferred — fix stream on #186 (the sixth candidate's frames, #184) |
| PL-11 | Deferred — fix stream on #186 (with #168) |
| PL-12 | Deferred — fix stream on #186 (with #168) |
| PL-13 | Deferred — fix stream on #186 |
| PL-14 | Deferred — fix stream on #186 |
| PL-15 | Deferred — fix stream on #186 |
| PL-16 | Deferred — fix stream on #186 |
| PL-17 | Deferred — fix stream on #186 |
| PL-18 | Deferred — fix stream on #186 |
| PL-19 | Deferred — fix stream on #186 |
| PL-20 | Deferred — fix stream on #186 (with #168) |
| PL-21 | Deferred — fix stream on #186 |
| PL-22 | Deferred — fix stream on #186 (with #168) |
| PL-23 | Deferred — fix stream on #186 |
| PL-24 | Deferred — fix stream on #186 |
| PL-25 | Deferred — fix stream on #186 (with #168) |
| PL-26 | Deferred — fix stream on #186 |
| PL-27 | Deferred — fix stream on #186 |
| PL-28 | Deferred — fix stream on #186 |
| PL-29 | Deferred — fix stream on #186 |
| PL-30 | Deferred — fix stream on #186 |
| PL-31 | Deferred — fix stream on #186 |
| PL-32 | Deferred — fix stream on #186 |
| PL-33 | Deferred — fix stream on #186 (with #168) |
