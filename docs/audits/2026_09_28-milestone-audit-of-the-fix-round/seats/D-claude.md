# Audit of the fix round — packet D (raofflineproxy, its ctl and helpers, the cheevos scripts)

## Corpus provenance (as embedded by the Facilitator; not re-read or re-hashed by me)

| path | sha256 (verified at embed time) |
|---|---|
| `docs/audits/2026_09_28-milestone-audit-of-the-fix-round/seats/D.diff` | `6dd9fba5c70f6232ba51459b6ab266866044e967c62f4445c42f6455979aae42` |
| `docs/audits/2026_09_28-milestone-audit-of-the-fix-round/seats/D.report.md` | `bc0e8b9c84ed19e6dbd732cd93b72c5684003d8bc8536d5f20106ed5da05ca7c` |
| `docs/audits/2026_09_28-milestone-audit-of-the-fix-round/seats/D.findings.md` | `22e73ae36c18f1ffc08cacbc8afa9e2a9953b4668a37ab0561101a64edba580e` |
| `docs/audits/2026_09_28-milestone-audit-of-the-fix-round/seats/D.items.md` | `952bba65f60bb0eea05f0eea27915629e533422925f37782d522966a477f6d0b` |
| `docs/audits/2026_09_28-milestone-audit-of-the-fix-round/seats/D.plan.md` | `4054dbd2c65e37b6b8bb6697f10430e50a103ca281ab55be7666684a1080ef4e` |
| `.claude/rules/engineering-practices.md` | `7f1eb012edc986ee2975abacb44f1a662f2a111a6ded1a1a623a84af509eef7d` |
| `.claude/rules/upgrade-and-install.md` | `d79a1084e85117ba566d23af7fbf3633c44290a6c490f9125e1fd9df061f8cfd` |
| `.claude/rules/es-player-text.md` | `c401103eba4ada9d0e757a2b8522e7ed9558a17eb4da72b65615795163f33c86` |

Not embedded, and therefore not judged: `packaging-and-patches.md`, `rclone-cloud-sync.md`, the ES rule files, the pinned client's source (`image_cache.py`, `network.py`, `proxy_service.py`, `storage.py`, `rom_browser.py`), the ctl's preamble and the functions the diff calls but does not change (`run_jobs`, `cancelled`, `count_of`, `time_left`, `count_ready`, `is_cached`, `fail`, `say`, `slog`, `do_enable`, `mark_running`), the harness's sections t and p (`tctl`, `treset`, the shims, `RA_TEST_SCAN_CAP`), the interface's readers (`CloudText::parseScanStamp`, `GuiOfflineScan`, `ProxyCards`, `jsonInt`).

All hunk citations below are to `D.diff`, by file and `@@` header.

---

## 1. Per punch item

### PL-013 — a cancel during the image pass downloads everything queued first
**Verdict: holds in part.** The mechanism the acceptance names is in the diff; the acceptance's proof ("on the guest, a frame series shows the page close") is not in the packet and the report says so.

- Helper (`raofflineproxy-cache-images @@ -314,9 +388,16 @@`, `@@ -328,36 +409,89 @@`): the pool is no longer a `with`-block (`pool = ThreadPoolExecutor(max_workers=4)`); `except KeyboardInterrupt: pool.shutdown(wait=False, cancel_futures=True); raise`; `__main__` restores `default_int_handler` and on `KeyboardInterrupt` calls `leave(130)` (`os._exit`). `as_completed(..., timeout=max(0.0, deadline - time.monotonic()))` bounds the wait.
- Ctl (`raofflineproxy-ctl @@ -1310,19 +1718,57 @@`): `timeout "${SECONDS_LEFT}" "${IMAGE_HELPER}" ... &`, `CLIENT=$!`, `wait "${CLIENT}"`, so the INT/TERM traps fire during the pass and the EXIT trap's `kill "${CLIENT}"` reaches `timeout`, which forwards TERM.
- Harness D1 times the helper under 2 s (`took < 2.0 and started <= 8 and '>>> why CANCELLED' in out`) and the ctl path (`b - a < 2`); D23 runs the shipped topology (GNU `timeout`, `setsid`, group SIGINT) and asserts `^term` seen, `^int` not seen, rc 130. These can fail (the report quotes the base's 10.02 s / 20.09 s FAILs, and D23 SKIPs without GNU timeout on the host).
- Note the shipped mechanism is SIGTERM forwarded through `timeout`, not the "catch the interrupt inside the pool's loop" the item text names; the interrupt path is exercised only when the helper is run by hand (D1). Both end the helper; the acceptance is about the page closing, which is E2's card and the guest.

### PL-055 — the offline index's marker is consumed before the listing succeeds
**Verdict: holds.** `rm -f "${INDEX_PENDING}"` is gone from the listing branch (`@@ -1581,20 +2107,33 @@`) and now runs only under `[ "${LISTED}" -eq 1 ] && [ -z "${WHY}" ] && [ -e "${INDEX_PENDING}" ]` and a token match (`@@ -1619,6 +2160,18 @@`). D2's first check is exactly the acceptance ("a listing that fails leaves the marker"): `echo 1 > listing-fail; tctl topup` → `[ -e "${TPD}/index-pending" ]`, plus rc 1 / `why=LIBRARY_UNREADABLE` after G-D-13. Beyond the item: the `PENDING_DUE` storm guard (`@@ -1517,8 +2033,15 @@`) and the token (`write_index_pending`, `@@ -1483,11 +1985,25 @@`) change *when* the promise is kept; the report lists the register row as owed. Correct.

### PL-057 — summary reads only `patch:` rows and turns unreadable unlocks into none
**Verdict: holds.** `@@ -588,14 +651,43 @@` adds the `achievementsets:%:<user>` read, `set_achievements()` (core set, else the first) and `found[gid]` with a patch row winning unless its core set is empty; `@@ -603,24 +695,43 @@` sets `unlocked = None` when the unlock row is missing, not a dict, `Success` is `False`, or fails to parse, and emits `null`. D3 seeds exactly the acceptance's two fixtures (201 sets-only; 202 `"{not json"`, 203 missing) and asserts the JSON lines byte-for-byte for 201 and `"unlocked":null,"unlockedPoints":null` for 202/203. Player-visible effect depends on E2 (`jsonInt` reads null as 0 per the report) — a seam, not a defect of this diff.

### PL-058 — the refresh helper reports success over a failed drop
**Verdict: holds.** `raofflineproxy-refresh @@ -81,7 +87,7 @@`: the `except` now `raise RuntimeError(...) from exc`; the caller's `except Exception: failed += 1` (`@@ -214,8 +225,9 @@`) counts it. D4 makes `Storage.delete_cache` raise and asserts `re-read 0 game(s), 1 failed` and `>>> done 0|1`, rc 1 — the acceptance's "a failing drop is in `M failed`".

### PL-059 — the scan cap has no cursor, and truncation is not on the page
**Verdict: holds in part.** The cursor and the note are in the diff: the walk is a circle from `read_cursor()` (`@@ -1126,28 +1526,36 @@`: `before`/`after`, `candidates = after + before`, `walked = candidates[:MAX_SCAN_ENTRIES]`), the proposal `scan-cursor.next` (`propose_cursor`, `@@ -1106,10 +1458,58 @@`), `commit_cursor` after the jobs (`@@ -784,12 +1013,36 @@`, `@@ -1466,12 +1934,46 @@`), `tell "note TRUNCATED"` and `truncated=1` in the stamp (`write_stamp` `$11`). What is missing against the acceptance text: (a) the harness runs the mechanism with the cap lowered to 10 over 13 files via `RA_TEST_SCAN_CAP` — a hook of section t outside this diff — not "5,001 uncacheable files"; the shape (cap+1 reached on run two: `after` has 1, `before` has cap) is the same, but the literal case was not run; (b) "the page's frame reads the note" is a guest proof the report lists as owed. D5 can fail (the report quotes the base's "the same first ten files held the front").

### PL-060 — image-pass failures are dropped, and a scan with nothing new never repairs them
**Verdict: holds.** `run_image_pass` sets `R_IMAGES_WHY` for every exit but 0 and 3 (`@@ -1310,19 +1718,57 @@`); the scan tail adopts it (`if [ -z "${WHY}" ] && [ -n "${R_IMAGES_WHY}" ]; then RC=1; WHY=...`, `@@ -1466,12 +1934,46 @@`); the nothing-new branch runs the pass and stamps its why (`@@ -1437,17 +1893,29 @@`); the top-up stamps `1 topup ... why=${R_IMAGES_WHY}` and exits 1 (`@@ -1672,7 +2233,14 @@`). D6 asserts rc 1, `>>> why SOME_IMAGES_NOT_SAVED` and the stamp on scan-with-games, scan-with-nothing-new and top-up; D6b asserts a crashed helper is not read as a verify slice. `COULDN'T FINISH` itself is the interface's rendering of the why (E2; the word `SOME ACHIEVEMENT IMAGES COULDN'T BE SAVED` is in `es-player-text.md` § Outcome vocabulary, D-UI-112).

---

## 2. Per finding of the first audit (the stream's answer, as the diff shows it)

| finding | verdict | what the diff shows |
|---|---|---|
| claude G-D-01 (no ARMSX2 hunk) | **answered** (the packet gap is closed) | `cheevos_armsx2.sh @@ -83,16 +83,49 @@` is in this diff; D14 runs it under the image's busybox for six shapes. |
| claude G-D-02 = gpt G-D-01 (scan completes without image work) | **answered** for the two parts fixed; **answered in part** overall | `[ "${R_STOPPED}" -eq 0 ] && run_image_pass scan` replaces the `R_CACHED>0` gate (`@@ -1466,12 +1934,46 @@`); `[ "${SECONDS_LEFT}" -gt 10 ] || { ...; R_IMAGES_WHY=TOOK_TOO_LONG; return 0; }` (`@@ -1310,19 +1718,57 @@`); D22 covers both. The third sub-part — `[ -x "${IMAGE_HELPER}" ] \|\| { slog ...; return 0; }` with no why — is still a success over work not done; the withdrawal rests on `package.mk`'s install step, which is outside the diff (see G2-D-02). |
| claude G-D-03 (real `timeout` topology; comments wrong; path untested) | **answered** | Comments in `run_image_pass` and the helper's `__main__` now describe TERM-through-timeout; D23 runs GNU timeout + `setsid` + group SIGINT and asserts `^term` and no `^int`. Evidence is conditional on the runner having GNU coreutils' timeout (D23 SKIPs otherwise; the report says it ran). |
| claude G-D-04 (patch 016 tested only against a stub) | **answered** | D24: `http.server.ThreadingHTTPServer` on loopback; 404/410/301→404 `absent`, 503 and a refused port `transient`, a whole PNG `cached`; `got == want` exact. |
| claude G-D-05 (start limit never trips) | **answered** | `raofflineproxy.service @@ -9,10 +9,19 @@`: `StartLimitIntervalSec=300`, `StartLimitBurst=5`; D25 asserts `DIV >= DBU*(DWA+DRS)` from the unit's own values. |
| claude G-D-06 + gpt G-D-06 (cursor moves at listing; failed write swallowed) | **answered** | `propose_cursor` writes `.next` and returns False on `OSError` → `cursor_saved=0` (`@@ -1106,10 +1458,58 @@`, `@@ -1156,7 +1564,7 @@`); the ctl commits only under `R_DONE==1 && R_STOPPED==0`, and on `cursor_saved -ne 1 \|\| ! commit_cursor` sets `TRUNC=0; WHY=SOMETHING_WENT_WRONG` (`@@ -1466,12 +1934,46 @@`); the EXIT trap removes `.next` (`@@ -1408,9 +1862,10 @@`). D26 covers cancel-after-listing, cursor-is-a-directory, and `.next`-is-a-directory. |
| claude G-D-07 (`EX_USAGE` undefined) | **withdrawal holds, conditionally** | `EX_USAGE=64` is not in the diff (claimed defined in the preamble). D27 (`listening --wait abc` → rc 64) would FAIL if it were undefined (`exit` with no arg would exit 0). Holds if D27 ran PASS as reported. |
| claude G-D-08 + gpt G-D-04 + gpt G-D-05 (two "whole" rules; every body parsed; launch-only game counted added; failed compare = 0) | **answered** | `ready_games_into` and `whole_games()` both compute `unlocks ∩ sets` from `substr(responseBody,1,512)` with a whole-body fallback (`@@ -772,6 +892,115 @@`, `@@ -1052,12 +1357,59 @@`); `games_made_ready` captures `RC=$?` of `grep -vxF -f` and `return 1` above 1 (`@@ -772,6 +892,115 @@`); D28 covers the 800-char title, the launch-only game (`added=2`) and the unreadable before-file (`rc=1`, no count). Still two implementations of the one rule — see G2-D-10. |
| claude G-D-09 (`history_path` returns `ppsspp.ini`; consumer outside diff) | **cannot judge the withdrawal from the packet** | The reason (one caller, `-e`/`-nt` only, ctl:1928) names a line outside the diff. Not refuted by anything in the packet. |
| claude G-D-10 ("listed once" log line) | **answered** | `slog "... the library listed once for it -- again after the half hour if this run does not finish"` (`@@ -1581,20 +2107,33 @@`); D29 greps `listed once for it.*again`. |
| claude G-D-11 (F-EM-07 closed by a comment) | **answered in part** | D30 checks the pinned PPSSPP source for `ConfigSetting("AchievementsHost", ...)` and `rc_client_set_host(... sAchievementsHost ...)` when the source is on the machine (SKIP otherwise). The companion check that the script names the pin can pass vacuously — see G2-D-04. The launch through the proxy is still owed on the guest, as the report says. |
| claude G-D-12 (`IMAGE_CACHED` for "there already") | **withdrawal holds** | D24 pre-seeds `d24-seeded.png` against a dead port and asserts `there == "cached"`; the early return itself is outside the diff, so the evidence is empirical, not by reading. |
| claude G-D-13 (top-up whose listing failed exits 0) | **answered** | `LIST_WHY=LIBRARY_UNREADABLE` (`@@ -1581,20 +2107,33 @@`) merged by `[ -z "${WHY}" ] && [ -n "${LIST_WHY}" ] && WHY="${LIST_WHY}"` (`@@ -1656,9 +2209,17 @@`); D2's first check now expects rc 1 and `why=LIBRARY_UNREADABLE$` while still asserting the recently played pass ran (`^smart budget=`). |
| claude G-D-14 (404 silenced 30 days) | **answered** | `ABSENT_RECHECK_SECONDS = 24 * 3600` (`@@ -82,7 +111,20 @@`); `read_absent` drops entries at or past it; D31 asserts a 2-day entry is asked and a 1-hour entry is not. |
| gpt G-D-02 (IPv6 loopback read as IPv4 endpoint) | **answered** | Both readers accept only `0100007F:1F90\|00000000:1F90\|0000000000000000FFFF00000100007F:1F90` in state `0A` (`cheevos_ppsspp.sh @@ -49,17 +49,51 @@`; ctl `@@ -772,6 +892,115 @@`); D12b (`DL3`) and D15 assert `::1` alone routes direct. See G2-D-01 for what this still leaves untested. |
| gpt G-D-03 (older top-up clears a newer marker) | **answered** | `PENDING_TOKEN="$(cat INDEX_PENDING)"` read before the listing; removal only when `cat` still equals it (`@@ -1619,6 +2160,18 @@`); `write_index_pending` writes `epoch pid RANDOM` whole-or-not-at-all. D29 writes a second marker mid-run and asserts it survives. A `cat`→`rm` race window remains (microseconds; not a practical defect). |
| gpt G-D-04, gpt G-D-05, gpt G-D-06 | **answered** | Covered above with claude G-D-08 / G-D-06. |

---

## 3. Findings of my own

### G2-D-01: The readiness gate's accepted addresses were never checked against the proxy's own socket
- **Severity:** Medium
- **Category:** Readiness / test evidence (a fixture that encodes the assumption)
- **Where:** `raofflineproxy-ctl @@ -772,6 +892,115 @@` (`port_listening`, the `case` on three local-address forms); `raofflineproxy.service @@ -22,11 +31,16 @@` (`ExecStartPost=/usr/bin/raofflineproxy-ctl listening --wait 30`); `cheevos_ppsspp.sh @@ -49,17 +49,51 @@` (the same three forms); harness D12b and D15.
- **What:** A new hard gate on the unit's start (and on PPSSPP's routing) accepts exactly `127.0.0.1`, `0.0.0.0` and `::ffff:127.0.0.1` on 1F90 in LISTEN and — by the comment's own admission — excludes `::` because "the table does not say" whether it is dual-stack. Whether the proxy binds one of the three forms is decided by `raofflineproxy.main run-service`, which is outside the diff, and no case in the harness runs the reader against the proxy's real socket: D12b's fixtures are hand-written `/proc/net` lines (127.0.0.1, 0.0.0.0, ::ffff:127.0.0.1, ::1, another port, an established connection), and the sandbox does not run the proxy.
- **Failure scenario:** The proxy binds `::` with `IPV6_V6ONLY=0` (Python's `socketserver` on a host name resolving to `::`, or an explicit `""`/`::` bind). tcp6 shows `00000000000000000000000000000000:1F90 ... 0A`; `port_listening` returns 1 after 30 looks; systemd marks the unit failed and kills the main process; `Restart=on-failure` repeats five times inside 300 s; the interface (`Before=emustation.service`) starts 30 s later than before on every boot; with the toggle on, every PPSSPP launch logs "nothing is listening" and routes direct; `enable`'s `systemctl start` never returns success. Fail-closed, but closed means the feature the toggle promises never runs and boot is slower, with nothing on screen saying why.
- **Evidence:** the `case` list and the comment "`::` may be IPv6-only, which the table does not say, so neither counts"; D12b tests `::1` (`DL3`) but not `::` (all zeros); no harness case starts `python3 -m raofflineproxy.main run-service`. What would refute this: one line in the client showing `("127.0.0.1", 8080)` or `("0.0.0.0", 8080)` passed to the server, or `ss -ltn` on a guest with the unit active — neither is in the packet.

### G2-D-02: `run_image_pass` reports success with no why when the image helper is missing
- **Severity:** Low
- **Category:** Guards fail closed
- **Where:** `raofflineproxy-ctl @@ -1310,19 +1718,57 @@`: `[ -x "${IMAGE_HELPER}" ] || { slog "${VERB}: no image helper at ${IMAGE_HELPER}"; return 0; }` with `R_IMAGES_WHY=""` set just above it.
- **What:** Every other way the pass does not do its work now leaves a why (`TOOK_TOO_LONG`, `SOME_IMAGES_NOT_SAVED`), but a missing or non-executable helper leaves none, so the scan and the top-up stamp `0 ... COMPLETED` over images nobody looked at — the shape gpt G-D-01 named. The stream withdrew that sub-part because `package.mk` installs the helper 0755 and section t's early cases run without it on purpose; the install step is outside the diff, and a test convenience is not a reason for a production guard to fail open.
- **Failure scenario:** An image whose install step regressed, or a helper made non-executable on a device: SCAN and every top-up read COMPLETED for good while badges stay missing offline (D-RA-027's "half working").
- **Evidence:** the `return 0` with no why; contrast the next line, which sets `TOOK_TOO_LONG` for the other "not run" case. No harness case constructs the missing helper and asserts the run's outcome.

### G2-D-03: The helper's exit 2 (no store, no account) is stamped as `SOME_IMAGES_NOT_SAVED`
- **Severity:** Low
- **Category:** Outcome vocabulary
- **Where:** `raofflineproxy-ctl @@ -1310,19 +1718,57 @@`: `case "${RC}" in 0|3) ;; *) R_IMAGES_WHY=SOME_IMAGES_NOT_SAVED ;; esac`; the helper's docstring (`raofflineproxy-cache-images @@ -55,13 +66,31 @@`): "2 when the store or the account could not be read".
- **What:** The comment says "no store or account (2) ... is the pass not done", and folds it into a why whose player wording (D-UI-112) is "SOME ACHIEVEMENT IMAGES COULDN'T BE SAVED. TRY THE SCAN AGAIN." A precondition the player cannot fix by scanning again is reported as a transient image failure.
- **Failure scenario:** The toggle is on, the store is unreadable to the helper (or `resolve_credentials` fails) while the ctl's own listing still ran: the page says images could not be saved and to try again; trying again gives the same line.
- **Evidence:** the `case`; the helper's exit-2 contract; `STORE_UNREADABLE` already exists as a why elsewhere in the same file (`tell "why STORE_UNREADABLE"; return 2` in the helper, and the ctl's `cannot_tell`). Refuting it would need a ctl precondition check that makes exit 2 unreachable; `have_account`/`QUEUE` checks in `do_scan` are outside the hunks shown.

### G2-D-04: D30's pin citation check passes vacuously when the package's pin cannot be parsed
- **Severity:** Low
- **Category:** A test that cannot fail (the "two pins compared as empty strings" shape, `engineering-practices.md` § A name is not a behaviour)
- **Where:** `tools/last-good-scripts-test`, D30: `PPV="$(sed -n 's/^PKG_VERSION="\([0-9a-f]*\)".*/\1/p' .../ppsspp-sa/package.mk | head -n 1)"` then `grep -q "afbc66a3\|${PPV:0:8}" "${DD}/cheevos_ppsspp.sh" && grep -q "${PPV:0:8}" "${DD}/cheevos_ppsspp.sh"; check $? "... names the PPSSPP commit ppsspp-sa pins (${PPV:0:8}) ..."`.
- **What:** With `PPV` empty (a `PKG_VERSION` that is a tag, or a quoting change in the recipe), `${PPV:0:8}` is the empty pattern and both `grep -q` match every line; the check prints PASS naming "commit ()". D18's sibling check guards the same shape with `[ -n "${DPINHDR}" ]`; D30 does not.
- **Failure scenario:** ppsspp-sa moves to `PKG_VERSION="v1.21.0"`; the script's citation still says `afbc66a3`; D30 passes, and the comment-as-evidence that closed claude G-D-11 is stale with a green check under it.
- **Evidence:** the two `grep -q` invocations with no `[ -n "${PPV}" ]`; the empty-pattern semantics of grep. The source-file half (`grep -q 'ConfigSetting("AchievementsHost"...'`) is fine because it greps a literal.

### G2-D-05: A badge the server serves malformed is "transient" and fails every run for good
- **Severity:** Low
- **Category:** Design decision needing the maintainer (the same shape as the 404 regression the coordinator caught)
- **Where:** patch 016 (`@@ -308,8 +324,18 @@`: `outcome = IMAGE_ABSENT if status in ABSENT_HTTP_STATUSES else IMAGE_TRANSIENT`); patch 013's `png_problem` (`@@ -250,3 +274,42 @@`); `raofflineproxy-cache-images @@ -328,36 +409,89 @@` (`left = [... p not in absent]`, `code = 1 if left ...`).
- **What:** The absent record covers 404 and 410 only. A body that fails `png_problem` — a chunk CRC that does not verify, IDAT that does not inflate, a PNG with no IDAT — raises `ValueError`, has no `.code`, and is classified transient on every fetch; it is never recorded, never cached, and is in `left` every pass. With PL-060's fix that is `SOME_IMAGES_NOT_SAVED` on every scan and every top-up until the server changes the file. `--verify` now applies the same test to files cached before patch 013, so a badge that was displayed fine for a year is deleted and joins the permanent failures.
- **Failure scenario:** One badge on RetroAchievements' media host with an ancillary chunk whose CRC is wrong (readers ignore ancillary CRC errors; `png_problem` does not distinguish critical from ancillary chunks). Every SCAN ends COULDN'T FINISH - SOME ACHIEVEMENT IMAGES COULDN'T BE SAVED. TRY THE SCAN AGAIN.; trying again cannot help; every top-up card reads COULDN'T FINISH.
- **Evidence:** the two-class split with no third class for "the server's copy is not a PNG we accept"; `png_problem` treats every chunk's CRC alike; D19/D24 test 404/410/503/timeout/refused/whole, never a permanently malformed body. What would refute it: RA's badges never having a bad CRC — not knowable from the packet, and F-RA-13 (trailing bytes after IEND) shows the encoder is not pristine.

### G2-D-06: SCAN on an up-to-date library now waits, silently, for the whole image pass
- **Severity:** Low
- **Category:** Player-facing / performance (acknowledged as "time on a handheld" in the report; the silence is not acknowledged)
- **Where:** `raofflineproxy-ctl @@ -1437,17 +1893,29 @@` (`tell "note NOTHING_NEW"` then `run_image_pass scan "${IMAGE_PASS_SECONDS}"`); `@@ -1310,19 +1718,57 @@` (`>>"${SCAN_LOG}" 2>&1` — the helper's `>>> doing images` / `>>> image i|n` protocol goes to the log, not to the page).
- **What:** Before the fix the nothing-new branch stamped and exited at once. Now it tells the page NOTHING_NEW, then walks every patch/achievementsets/login row's JSON and downloads for up to 300 s (default `IMAGE_PASS_SECONDS`) with no progress line reaching the page; `done` comes at the end.
- **Failure scenario:** A player with a large store and a few missing badges presses SCAN; the page shows nothing new and then sits for minutes. CANCEL works (PL-013), but nothing tells the player what it is waiting for.
- **Evidence:** the ordering of `tell` calls in the branch; the redirection in `run_image_pass`; no `tell "doing images"` anywhere in the ctl. Not a correctness defect; a UX consequence of PL-060 the register row should weigh.

### G2-D-07: New protocol tokens and exit codes with no reader in the packet
- **Severity:** Low
- **Category:** Seam / contract
- **Where:** `raofflineproxy-cache-images @@ -301,12 +368,19 @@` (`tell(f"note ABSENT {len(known_absent)}")`), `@@ -55,13 +66,31 @@` (exit 3 for a verify slice left); `raofflineproxy-ctl @@ -1347,8 +1793,10 @@` (`do_images` returns the helper's exit as its own).
- **What:** `note ABSENT N` is a new line on the scan page's protocol, printed to stdout; through `run_image_pass` it lands in `scan.log`, but through the `images` verb it reaches whoever runs that verb. The helper's exit 3 replaces the exit 1 D-RA-024 documented as "exits non-zero"; a caller of `images` testing `rc == 1` (rather than `!= 0`) would now miss a verify slice left. Neither reader is in the diff.
- **Failure scenario:** The interface (or a script) runs `raofflineproxy-ctl images --verify`, sees `>>> note ABSENT 3` and an exit of 3, and has words for neither.
- **Evidence:** the `tell` and `return 3`; the report's decision-register row for exit 3 is listed as owed. What would settle it: the reader of the `images` verb's output, outside this packet.

### G2-D-08: The 512-character GameId regex has no fallback when it matches the wrong key
- **Severity:** Low
- **Category:** Substring match where an exact answer exists (conditional on the body's key order)
- **Where:** `raofflineproxy-ctl @@ -772,6 +892,115 @@` (`ready_games_into`: `game = re.compile(r"\"GameId\"\s*:\s*(\d+)")`, `found = game.search(head or "")`); `@@ -1052,12 +1357,59 @@` (`whole_games`, the same).
- **What:** The whole-body `json.loads` runs only when the regex finds nothing in the first 512 characters. If a nested `"GameId"` (an achievementsets response's `Sets[].GameId`, which for a bonus or specialty set is a different id) appears before the top-level key within the head, the wrong id is taken and the fallback never runs. The comment asserts the service writes the top-level key in the head; the packet does not show the stored body's key order.
- **Failure scenario:** A stored body `{"Success":true,"Sets":[{"GameId":9876,...` — the game is counted ready under 9876; the real id is neither ready nor added; the walk's `cached_paths` drops the ROM's patch row (its game id is "not whole") and the ROM is a job again at every scan.
- **Evidence:** D28 tests only the "GameId past the head" fallback, not an early wrong match. Refuting it needs one stored achievementsets body or the service's writer, both outside the packet.

### G2-D-09: `Already written:` is not answered for the store an earlier client pin wrote
- **Severity:** Low
- **Category:** Upgrade path (`upgrade-and-install.md` § Every fix answers what was already written)
- **Where:** `raofflineproxy-ctl @@ -538,34 +586,49 @@` (`SELECT achievementId, queuedAt, queryString, requestBody FROM pending_awards`), `@@ -588,14 +651,43 @@` (summary's `awards` query); header `@@ -201,17 +234,21 @@` ("the header named 4e9bab48, two pins back").
- **What:** The ctl now reads two columns it did not read before. D18 proves the reads against a store the *current* pin's `Storage` created. A device that upgrades keeps the sqlite file the *previous* pin created; whether that schema has `queryString`/`requestBody`, and whether the pinned client's `_initialize_sqlite` adds missing columns, is outside the packet. The ctl fails closed (`cannot_tell`, exit 2) if a column is missing — which on such a device means `pending-ids` and `summary` stop answering after the update, where they answered before.
- **Failure scenario:** An upgraded device whose store predates those columns: the achievements pages lose their offline summary and earned-and-waiting marks until the store is recreated.
- **Evidence:** the two SQL statements; D18's fixture is `Storage()` at the current pin; no `--old`-store case. Likely benign (the proxy replays awards, so the request columns have probably always existed), but the report's `Already written:` lines do not say so.

### G2-D-10: "One rule" is two implementations, twice
- **Severity:** Low
- **Category:** Duplication (the inverse of § Before deleting a duplicate: two copies that must be kept identical)
- **Where:** socket-table reader: `raofflineproxy-ctl @@ -772,6 +892,115 @@` (`port_listening`) and `cheevos_ppsspp.sh @@ -49,17 +49,51 @@` (`proxy_listening`); ready-game rule: `ready_games_into` (shell → `python3 -c`) and `whole_games()` (embedded Python in `list_jobs`).
- **What:** Each pair is byte-for-byte the same logic in two files (or two languages) with no shared source. G-D-02's address fix had to be made in both readers (the report says so); the next such fix has the same chance of landing in one.
- **Failure scenario:** A future change to the accepted address forms in the ctl and not in the PPSSPP script: the unit says "listening", PPSSPP says "nothing is listening", and the two disagree on the same device.
- **Evidence:** the two `case` lists and the two `unlocks & sets` blocks. A harness case that runs both readers over one fixture and asserts agreement does not exist (D12b and D15 use separate fixtures).

### G2-D-11: `os._exit` in `leave()` skips patch 009's temp cleanup and unflushed log handlers
- **Severity:** Low
- **Category:** Cleanup / already-written
- **Where:** `raofflineproxy-cache-images @@ -328,36 +409,89 @@` (`leave()`: `sys.stdout.flush(); sys.stderr.flush(); os._exit(code)`; called when `running` after the deadline and on `KeyboardInterrupt`).
- **What:** A download in flight at the instant of `os._exit` is inside the client's `try/finally` that unlinks its temp file (patch 009, outside the diff); `finally` does not run under `os._exit`. The docstring says a cut download "leaves nothing the next pass does not fetch" — true of the image, not of the temp. Any logging handler other than stderr is not flushed either.
- **Failure scenario:** Four workers, a deadline-cut pass every top-up: up to four `image_cache` temp files per cut pass accumulate; nothing in the packet sweeps them. The write-then-rename window is microseconds because the body is fetched into memory first, so the realistic rate is low.
- **Evidence:** the `os._exit`; the docstring's claim; no sweeper of temp names in the diff.

---

## 4. Sweep rows: spot checks

Checked against the diff (row → hunk → what I read):

1. **gpt F-RA-27** (008 opt-in): `patches/008 @@ -31,9 +33,9 @@` — `return (config_data or {}).get("upload_logs") is True`. Fixed as claimed; D13a drives it through `retry_storage_corruption_report` and asserts `{"string false": 0, "number 1": 0, "string yes": 0, "true": 1}`.
2. **claude F-RA-20** (start limit in `[Unit]`): `raofflineproxy.service @@ -9,10 +9,19 @@` adds both keys under `[Unit]`; `@@ -22,11 +31,16 @@` removes `StartLimitInterval=60` / `StartLimitBurst=5` from `[Service]`. Fixed; D12a's awk asserts placement and absence.
3. **claude F-RA-23 = gpt F-RA-24** (tool providers): `package.mk @@ -23,7 +23,13 @@` — `PKG_DEPENDS_TARGET="toolchain Python3 bash busybox coreutils grep systemd ..."`. Fixed; D16 parses the line. The comment's claims about which binary the image ships (`timeout` is coreutils', busybox has no `grep` applet) are outside the packet; `pkgcheck` output is a report claim.
4. **gpt F-RA-18** (disable read-back order): `raofflineproxy-ctl @@ -465,26 +509,30 @@` — `set_setting KEY 0` → `[ "$(setting KEY)" = "0" ] || fail` before `stop_running_run`/`do_stop`/`rm -f MARKER`; hardcore write → read back → only then `set_setting HARDCORE_WAS_KEY default` → read back. Fixed; D11 fails one key's write at a time. Note: on a hardcore-restore failure the script exits through `fail` with the marker already removed and the service stopped, and prints no `hardcore=` last line (the interface's contract in the header) — the record is kept, so the next disable recovers; the interface's row until then is a seam (§5).
5. **gpt F-RA-09** (awards per account): `@@ -538,34 +586,49 @@` and `@@ -588,14 +651,43 @@` — `owner()` parses `u=` from the query (after `?`) or the body via `parse_qs`; `pending-ids` and `summary` filter `in ("", user)`; `pending` (the count) is untouched. Fixed; D3b asserts `3002 1789400001` only and `pending` = 2.
6. **claude F-EM-04** (no netstat; two negatives): `cheevos_ppsspp.sh @@ -49,17 +49,51 @@` — `proxy_listening` returns 0/1/2; `case $? in 0) host=...; 1) "nothing is listening"; *) "couldn't tell"`. Fixed; D15 covers listening, `::1`, `::ffff:127.0.0.1`, other port, and `RAOFFLINEPROXY_PROC_NET=/nonexistent` → "couldn't tell" and not "nothing is listening".
7. **gpt F-RA-13** (PPSSPP play counts): `@@ -750,7 +870,7 @@` — `for F in "${BUILTIN}" "${P}" "${PPSSPP_INI}"`. Fixed; D10 asserts the probe runs with only `ppsspp.ini` newer, and is skipped when it is older.
8. **claude F-RA-12 = gpt F-RA-19** (three in a row): `raofflineproxy-refresh @@ -162,6 +168,10 @@`, `@@ -199,6 +209,7 @@`, `@@ -214,8 +225,9 @@` — `in_a_row` reset on success, `if in_a_row >= 3`. Fixed; D4's driver runs {1,3,5} (no stop) and {2,3,4} (stop).
9. **gpt F-RA-26** (readiness): `listening [--wait N]` verb (`@@ -772,6 +892,115 @@`, dispatch `@@ -1694,10 +2262,11 @@`) and `ExecStartPost` in the unit. Fixed as claimed — with the caveat of G2-D-01.
10. **claude F-RA-07 / gpt F-RA-28** (header): `@@ -201,17 +234,21 @@` names `c1bd3724...`, lists `pending_awards(id, achievementId, queryString, requestBody, queuedAt, status)`, says summary's store-unreadable is 2; `@@ -1356,9 +1804,12 @@` corrects the refresh policy. D18 checks the pin against `package.mk`'s (`PIN` from section t, outside the diff). Fixed as claimed; see G2-D-09 for the upgrade question.
11. **claude F-RA-22** (comments only): `@@ -153,8 +169,22 @@` and `@@ -1483,11 +1985,25 @@` describe what the interface's `NetworkThread` and `topup --after-index` do for unidentified games. Those are claims about ES, outside the packet; a comment is a claim by the rules' own standard, and the row was closed by one. Consistent with the report ("no case can hold a comment").

Withdrawn rows I can judge: **claude F-RA-11's import half** — the packet does not show `proxy_service.py:14`, but D13c calls `proxy_service.ProxyRuntimeServer.forward_to_upstream_result` with a failing resolver and asserts `network_error, 503` in under 2 s; a missing `urlsplit` import would surface there as a `NameError` → `verdict(False, ...)`. The withdrawal is supported by a case that can fail. **gpt G-D-01's "no helper" sub-part** — see G2-D-02: not refuted, but the reason is an artifact outside the diff and the guard's shape fails open.

---

## 5. Seams

- **The shared harness.** Block D edits section t's `python3` shim in place (`listing-fail`, `smart-rows` hooks), replaces `${T}/repo/raofflineproxy-cache-images` (the `dfake_images` stand-in; D19 puts the real helper in and then the stand-in back) and `${T}/repo/raofflineproxy-refresh` (D17's stand-in, **not restored**), appends a gated hook to `${T}/pypath/sitecustomize.py`, swaps `${T}/shim/timeout` for GNU's during D23 (restored by `mv -f` — a killed run leaves the swap), and leaves `${TCFG}` at `DCFG_ON` and `TENV=()`. Any later block that relies on section t's original refresh stand-in or config sees D's. The report's ordering instruction to the integrator is the whole mitigation.
- **Stamps → the interface.** `last-scan` gains `truncated=1` and a changed `added=` meaning (games made ready, from the store), and new/relocated whys (`SOME_IMAGES_NOT_SAVED` on scan and top-up; `TOOK_TOO_LONG` at the top-up's image phase; `LIBRARY_UNREADABLE` on the top-up). `es-player-text.md` § Outcome vocabulary already carries `SOME ACHIEVEMENT IMAGES COULDN'T BE SAVED` (scan page adds `TRY THE SCAN AGAIN.`, D-UI-112) — so E2's side exists for that token; `parseScanStamp` "passes over keys it does not know" is the ctl header's claim; the top-up card's rendering of `TOOK_TOO_LONG` and `LIBRARY_UNREADABLE` is outside the packet. `note TRUNCATED` → `GuiOfflineScan`'s "NOT EVERY FOLDER WAS LOOKED AT..." is quoted in the ctl comment only.
- **`summary` → the achievements page.** `unlocked`/`unlockedPoints` may be `null`; the report says `jsonInt` reads null as 0, so the page shows "0 earned" for unknown until E2 renders it — the same wrong number PL-057 set out to remove, now with the correct value in the JSON. The launch-only game (201) does appear, which is the visible half of the fix.
- **`disable` → the HARDCORE MODE row.** The header's contract is "the last line of stdout is `hardcore=<0|1>`"; the new read-backs exit through `fail` without it. Pre-existing shape, but the reorder means the marker is already gone at that point.
- **Unit ↔ ctl ↔ boot.** `ExecStartPost=... listening --wait 30` and `do_listening` agree on the verb and the address set; `Before=emustation.service` now waits for the readiness check, so a proxy that cannot listen adds 30 s to boot (owed timing; G2-D-01).
- **Two readers, two ready-rules inside D's own files** (G2-D-10).
- **Client patches ↔ pin.** 013 is regenerated (`png_problem` shared by download and `--verify`), 015 and 016 add hunks; "applies with no offset or fuzz" and the 23 client tests are report claims; D13c runs `test_linux_network` when section t runs.
- **`images` verb ↔ its caller**; **helper protocol ↔ page** (G2-D-07).
- **`es_systems` merge ↔ ES's `SystemData::getConfigPath` / `loadAdditionnalConfig`.** The listing now mirrors an ES algorithm by description; D7 tests the mirror's behaviour on two fixtures, not ES's. A divergence (base-file precedence, `/usr/bin` vs `/etc/emulationstation`, the "file that does not parse ends the merging" rule) would show as games listed at the wrong path.

---

## 6. Coverage boundary

I could not judge, and did not guess at:

- The proxy's bind address and `HTTPServer` construction (G2-D-01); systemd's handling of `ExecStartPost` failure on the device; `do_enable`'s "puts the device back" on a failed start.
- `run_jobs` (sets `R_DONE`, `R_STOPPED`, `R_WHY`, `R_CACHED`…), `cancelled()`, `count_of`, `time_left`, `count_ready`, `is_cached`, `have_account`, `fail`, `say`, `slog`, `mark_running`, the sysexits block (`EX_USAGE`), and whether the ctl runs under `errexit` (the removal of `|| true` around `run_image_pass` and the bare call in `do_topup` require it off; D6's PASS on the top-up stamp implies it is).
- The hidden branch structure between `@@ -1656,9 +2209,17 @@` and `@@ -1672,7 +2233,14 @@` in `do_topup`: whether a top-up with nothing new runs its `--verify` slice at all (if not, the store's verify sweep never comes round on a library that stops changing — D-RA-024's promise).
- The helper's verify loop (`verify_left`, `damaged_found` handling; whether re-fetched damaged paths pass through the `absent` filter), `missing_paths`, `all_paths`; the pinned client's `fetch_static_asset`, `download_static_image`'s early return, patch 009's temp naming, `Storage._initialize_sqlite` (G2-D-09), `cache_keys`, `rom_browser.MAX_SCAN_ENTRIES` and how `RA_TEST_SCAN_CAP` reaches it.
- The stored achievementsets body's key order (G2-D-08); the pending_awards schema at earlier pins (G2-D-09).
- Everything in EmulationStation: `CloudText::parseScanStamp`, `GuiOfflineScan`, `ProxyCards`, `OfflineAchievements::scanWhy`, `jsonInt`, `SystemData`, `NetworkThread`.
- The harness's sections t and p (sandbox, shims, virtual clock, `PIN`), whether the suite was run and produced the quoted 493 PASS / 0 FAIL, and whether D23/D30 ran or SKIPped on the runner.
- PPSSPP's and ARMSX2's actual consumption of `AchievementsHost` and of `secrets.ini`'s first Token line; the image's `timeout`/`grep` provenance asserted in `package.mk`'s comment; `pkgcheck`'s output; the patch series applying to `c1bd3724`.
- All guest and device proofs the report lists as owed (PL-013's frame series, PL-059's page frame, a PSP launch through the proxy, boot-to-carousel timing with the readiness wait, a nothing-new scan timed on a handheld).