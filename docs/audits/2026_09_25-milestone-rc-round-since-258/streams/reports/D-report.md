# Stream D report: the offline-achievements service (#307 / #308)

Branch `feature/pl-d` in `/workspace/repos/rocknix.worktrees/pl-d`, cut from `next` at `417dcd8610`. 25 commits, head `8bd2fddcae`. Nothing was pushed, built, run on a VM or device, or committed outside this branch.

```
$ git log --oneline 417dcd8610..HEAD
8bd2fddcae raofflineproxy-ctl: the header says what the code and the pin do
511aab7aa6 raofflineproxy: a helper's budget bounds its blocking work
5a34c73954 raofflineproxy: declare the packages its scripts' tools come from
74599ebca4 cheevos_ppsspp.sh: ask the socket table, not netstat, and cite PPSSPP
a7fa6ee786 cheevos_armsx2.sh: one [Achievements] with one Token, whatever the file held
4c28682a73 raofflineproxy: the connection is answered from the bounded lookup
4cb57c8739 tools/last-good-scripts-test: stream D's refresh cases in a fixed order
e997a4213c raofflineproxy: a verify slice left is exit 3, so a crash is not one
cad061f72e raofflineproxy: one PNG test for a download and for the cache's files
4b8247338e raofflineproxy: the log upload's opt-in is a JSON true and nothing else
32e4085693 raofflineproxy: the service is started when it is listening
c1e5266f44 raofflineproxy: the unit's start limit sits in [Unit]
268f88c652 raofflineproxy-ctl: disable reads each step back before using it up
46b6e3917c raofflineproxy-ctl: a game played in PPSSPP is a game played
8ad4802ba1 raofflineproxy-ctl: added= is the games a run made ready
740c255085 raofflineproxy-ctl: a patch path alone does not mark a ROM cached
1e139fb4b1 raofflineproxy-ctl: the listing reads the systems the interface reads
a3d6781a09 raofflineproxy-ctl: the image pass's verdict is the run's
5bb4e84714 raofflineproxy-ctl: the scan walks on from a cursor, and says TRUNCATED
f6af9d8174 raofflineproxy-refresh: three failures in a row, as it says
9167f22270 raofflineproxy-refresh: a session row it could not drop fails the game
8642ac5541 raofflineproxy-ctl: a waiting award is its own account's
883d92415c raofflineproxy-ctl: summary reads a launch's rows, and says unknown
d9bd0c8b32 raofflineproxy-ctl: index-pending goes only once its games are handled
146d7f01ed raofflineproxy: a cancel during the image pass ends the run at once
```

Every commit title follows `<package or script>: <text>` (72 characters or fewer, no space before the colon). Each body names its item, the finding, the test case with its before and after lines, and an `Already written:` line. Each ends with the Co-Authored-By line.

## Test results

- **`tools/last-good-scripts-test` at HEAD:** `PASSED`, with 462 PASS lines and 0 FAIL. At `417dcd8610`, before this stream, it had 386.
- **Fail-first evidence:**
  - All the new checks, run once against the unfixed scripts: 58 FAIL, every one inside block D, none elsewhere.
  - `BASE_REF=417dcd8610 tools/last-good-scripts-test --old` at HEAD: `60 CHECK(S) FAILED`, all 60 in block D and 0 in other sections. The 16 block-D checks that pass at base are guards that should pass either way, such as "a game with both rows is listed once" and "pending still counts every award".
- **Where the cases are:** one block at the end of the file, headed `# ---- audit #307, stream D ----`, sub-cases D1–D18. It uses section t's sandbox (`tctl`, `treset`, the patched client, the virtual clock) and section p's (`ctl`, fail-set). It changes section t's fixtures only from inside the block:
  - it adds two hooks to the `python3` shim (`/run/listing-fail`, `/run/smart-rows.py`);
  - it replaces the stand-in helpers in `${T}/repo`.

  **The integrator should keep block D ahead of any other stream's block that uses section t's `${T}/repo` stand-ins.**
- **pkgcheck:** `tools/pkgcheck raofflineproxy` exits 0 and prints no finding, only the progress line `projects/ROCKNIX/packages/network/raofflineproxy/package.mk...`.
- **Patches:** the series still applies to the pin `c1bd3724` in order with no offset or fuzz (`patch -p1` over a fresh unpack). The regenerated 013 was checked by first regenerating the original 013 byte for byte with `diff -up`. The client's own `linux/tests/test_linux_network.py` still passes (23 tests), and block D now runs it.

## Punch items

All six are resolved.

### PL-013 (High): a cancel during the image pass downloads everything queued first

- **Outcome:** resolved in `146d7f01ed`. Follow-up bounds are in `511aab7aa6`.
- **The fix:**
  - The helper's pool is no longer a with-block. A `KeyboardInterrupt` calls `shutdown(wait=False, cancel_futures=True)` and the process exits 130 without waiting for downloads in flight.
  - SIGINT is re-enabled when the helper starts, so a copy started in the background still hears the cancel.
  - The ctl's `run_image_pass` now runs the helper in the background and waits, with `CLIENT` set, so the INT and TERM traps fire at once and the EXIT trap ends the helper.
- **Case D1:** `PL-013 cache-images` (two checks) and `PL-013 ctl` (three checks).
- **Before:**
  - `FAIL  PL-013 cache-images: FAIL cancel: SIGINT with 4 of 40 downloads started -- exit -2 after 10.02s, 40 started`
  - `FAIL  PL-013 ctl: the image pass started at 1790557157.26 and the run exited at 1790557177.35 -- 20.09s`
- **After:**
  - `PASS  ... exit 130 after 0.00s, 4 started`
  - `PASS  PL-013 ctl: from the image pass's start to the run's exit: 0.02s, inside two seconds`
- **Already written:** nothing is written differently. A cut download never reaches its rename (patches 009 and 013).
- **For the integrator:** the acceptance needs a frame series on the guest showing the page close within two seconds of CANCEL. That is a VM proof I could not run.

### PL-055 (Medium): the index marker was removed before the listing succeeded

- **Outcome:** resolved in `d9bd0c8b32`.
- **The fix:** `index-pending` is removed only after a listing that returned 0 and an indexed pass that ended with no error. An after-index run that completes also removes it.
- **I also added a storm guard, which the item did not ask for.** A kept marker bypasses the half hour only when it is newer than the last attempt mark. Otherwise a flapping link would re-list every time.
- **Case D2**, six checks. At base every one printed `marker: gone`, for example `FAIL  PL-055: rc 0; marker: gone; log: ... the interface's index could not be read ...`. After: `PASS  PL-055: a link-return listing for the marker that fails (rc 1) leaves index-pending`. Also passing now:
  - a listing that times out (exit 124);
  - a failed game;
  - a stop signal part-way through (exit 143);
  - a flap inside the half hour waits;
  - past the half hour the listing runs and removes the marker.
- **Already written:** a marker left by an earlier build is one no run has reached yet. It is read as before.

### PL-057 (Medium): summary skipped launch-only games and turned unreadable unlocks into zero

- **Outcome:** resolved in `883d92415c`.
- **The fix:**
  - Summary now also reads the account's `achievementsets:` rows, choosing the core set the way the interface's game page does. Each game appears once, and a patch row wins.
  - A missing or damaged unlock row now gives `"unlocked":null,"unlockedPoints":null`.
- **Case D3.**
  - Before: `FAIL  PL-057 summary: rc 0; no line for game 201` and `202 ... "unlocked":0`.
  - After: `PASS ... 2 achievements, 15 points, both unlocked (one earned, one waiting to be sent)` and `PASS ... read unlocked null`.
- **Already written:** nothing is written; summary only reads.
- **For stream E2:** the interface's `jsonInt` reads null as 0, so the page shows what it showed before for those games until the interface tells "unknown" apart.

### PL-058 (Medium): the refresh helper reported success over a failed drop

- **Outcome:** resolved in `9167f22270`.
- **The fix:** `drop_startsession` now raises when a row cannot be removed, and the game counts as failed.
- **Case D4.**
  - Before: `FAIL  PL-058 refresh: FAIL drop: rc 0; ... re-read 1 game(s), 0 failed | >>> done 1|0`.
  - After: `PASS ... re-read 0 game(s), 1 failed, exit 1`.
- **Already written:** a session row that failed to drop stays in place and is dropped by the next refresh that can. Until then it is reported as a failure.

### PL-059 (Medium): the scan cap had no cursor, and truncation never reached the page

- **Outcome:** resolved in `5bb4e84714`.
- **The fix:**
  - The walk is a circle starting from `scan-cursor`, written with a temp file and a rename. A walk that fits under the cap removes the cursor.
  - A cut walk tells the page `note TRUNCATED` and adds `truncated=1` to the stamp. The interface already has words for both.
- **Case D5.** It lowers the cap to 10 over 13 files that can never be cached (the harness's `RA_TEST_SCAN_CAP`, as section t does) instead of 5,001 files.
  - Before: `FAIL  PL-059: second scan's jobs: a.nes e.nes g01.gbc ... g08.gbc h.gb i.gb -- the same first ten files held the front of the walk` and `FAIL  PL-059: 10 distinct files over two scans`.
  - After: `PASS ... note TRUNCATED ... truncated=1`, `PASS ... g09, g10 and g11 ... are its jobs`, `PASS ... all thirteen`.
- **Already written:** there is no cursor on any device, so the first scan starts from the top, as always.
- **For the integrator:** the acceptance also needs the page's frame reading the note on the guest.

### PL-060 (Medium): image-pass failures were dropped, and a scan with nothing new never repaired them

- **Outcome:** resolved in `a3d6781a09`, with a follow-up in `e997a4213c`.
- **The fix:**
  - The image pass's result now decides the run's: a pass that leaves images behind makes the scan or top-up exit 1 with `why SOME_IMAGES_NOT_SAVED` (per D-RA-027 and D-UI-030).
  - A scan with nothing new now runs the pass too.
- **A defect in my own first cut, fixed in `e997a4213c`:** it read "exit 1 with no why" as a verify slice left over. Python gives a crashed helper exactly that, so a crash read as success. The helper now exits 3 for a verify slice left over, and the ctl treats every exit except 0 and 3 as a failure.
- **Cases D6 and D6b.**
  - Before: `FAIL  PL-060: rc 0; ... stamp: ... 0 scan cached=4 ...` and `FAIL ... image pass run: 0 time(s)`. For the crash, `FAIL  rc 0; stamp: ... 0 topup ... -- a crash read as the sweep working`.
  - After: all 7 checks pass.
- **Already written:** nothing is written differently. Images missed before this build are fetched by the next scan.
- **For stream E2:** `SOME_IMAGES_NOT_SAVED` is a new token, and `OfflineAchievements::scanWhy` shows `SOMETHING WENT WRONG` for it. I propose `SOME ACHIEVEMENT IMAGES COULDN'T BE SAVED. TRY THE SCAN AGAIN.`, which still needs the maintainer's approval.
- **Risks:**
  - A badge the media host never serves (a 404) would now fail every scan, because `download_static_image` swallows the reason.
  - A scan with nothing new now walks the whole store, which should be timed on a handheld.

## Sweep rows (#308), 29 of 29 with an outcome

| packet · seat · id | Verdict |
| --- | --- |
| 1-raoffline · claude · F-RA-06 | **Fixed** `1e139fb4b1`. The seat's scenario was partly wrong: the interface itself uses `es_systems_custom.cfg` as the whole base (`SystemData::getConfigPath`). The real gap was the `es_systems_*.cfg` merge (`loadAdditionnalConfig`), now mirrored. D7 was FAIL before and PASS after. |
| 1-raoffline · claude · F-RA-07 | **Fixed** `8bd2fddcae`. I read `storage.py` at `c1bd3724` and put that pin in the header. A new guard runs the store reads against a store the pinned client itself wrote, and checks the header's pin matches `package.mk`. Before: `FAIL ... the header names '4e9bab48…'`. |
| 1-raoffline · claude · F-RA-10 | **Fixed** `8ad4802ba1`. `added=` is now the number of games that became ready (store read before and after). Before: `cached=1 added=0`; after: `added=1`. |
| 1-raoffline · claude · F-RA-11 | **Import half withdrawn:** `proxy_service.py:14` at the pin has `from urllib.parse import urlsplit`. **Test-gap half fixed** in `4c28682a73` with D13c's forwarder case. |
| 1-raoffline · claude · F-RA-12 | **Fixed** `f6af9d8174`: a separate count of failures in a row. Before: `FAIL apart: ... why REPEATED_FAILURES`. |
| 1-raoffline · claude · F-RA-13 | **Fixed** `cad061f72e`. Patch 013's `png_problem` walks chunks to IEND wherever it is, and `--verify` uses the same test. Before: `damaged() said 'no IEND'`. |
| 1-raoffline · claude · F-RA-20 | **Fixed** `c1e5266f44`: `StartLimitIntervalSec=` and `StartLimitBurst=` moved to `[Unit]`. |
| 1-raoffline · claude · F-RA-22 | **Fixed** `8bd2fddcae`, comments only. They now say that an offline index's unidentified games are cached by the interface's next index plus the after-index top-up, not by the marker's listing. No case can hold a comment. |
| 1-raoffline · claude · F-RA-23 | **Fixed** `5a34c73954`. `PKG_DEPENDS_TARGET` now adds `bash busybox coreutils grep systemd`, providers read from the GENERIC_X64 build root. pkgcheck is clean. |
| 9-emulators · claude · F-EM-03 | **Fixed** `a7fa6ee786`. `secrets.ini` is rewritten whole by awk reading it twice, then written to a 0600 temp file and renamed. D14 was FAIL before, for example `[Achievements]\|Token = TOKEN-NEW\|[Achievements]\|Token = TOKEN-NEW\|Token = TOKEN-NEW\|Token = old`. |
| 9-emulators · claude · F-EM-04 | **Fixed** `74599ebca4`. The script reads `/proc/net/tcp` and `tcp6` with bash builtins instead of netstat, and logs "nothing is listening" apart from "couldn't tell". D15 was FAIL before and PASS after. |
| 9-emulators · claude · F-EM-07 | **Fixed** `74599ebca4`: the comment now cites PPSSPP v1.20.2, `Core/Config.cpp:376` and `Core/RetroAchievements.cpp:650-652`, where it reads `AchievementsHost` and passes it to `rc_client_set_host`. **The integrator still owes a VM proof** that a PSP launch reaches the proxy. |
| 9-emulators · claude · F-EM-09 | **Fixed** `a7fa6ee786` (same rewrite). An empty file and a missing file now each get the section. |
| 1-raoffline · gpt · F-RA-09 | **Fixed** `8642ac5541`. summary and pending-ids read each award's owner from `u=` in its query or body; `pending` still counts every award. Before: `pending-ids: 1002 …\|3002 …`. |
| 1-raoffline · gpt · F-RA-10 | **Fixed** `511aab7aa6`, plus the PL-013 commit. `as_completed` now has a timeout and the helper leaves without joining downloads in flight; the ctl wraps the image pass, `images` and `refresh` in `timeout`. Before: `exit 1 after 10.06s` and `budget=none`. After: `1.05s` and `budget=300 --seconds 290`. |
| 1-raoffline · gpt · F-RA-11 | **Fixed** `146d7f01ed` (PL-013's backgrounding). Before: `disable rc 0 after 10.07s; helper … gone: 0`. After: `disable done in 1.05s`. |
| 1-raoffline · gpt · F-RA-12 | **Fixed** `cad061f72e` (same validator). Before: `damaged(): {'good': None, 'trailing': 'no IEND', 'bad-idat': None, 'bad-crc': None}`. |
| 1-raoffline · gpt · F-RA-13 | **Fixed** `46b6e3917c`: `ppsspp.ini` is now one of the history files the wake check reads. Before: `FAIL … no game played since the last attempt`. |
| 1-raoffline · gpt · F-RA-14 | **Fixed** `740c255085`: the walk's "already cached" now needs the patch, unlocks and sets rows. Before: `h.gb` was never a job. |
| 1-raoffline · gpt · F-RA-15 | **Fixed** `8ad4802ba1`. Before: `added=3` for a second copy of a game already ready; after: `added=2`. |
| 1-raoffline · gpt · F-RA-18 | **Fixed** `268f88c652`. disable reads the toggle back before stopping anything, and reads hardcore back before removing its record. Before: `the player's hardcore setting was lost` and `marker gone; systemctl stop`. |
| 1-raoffline · gpt · F-RA-19 | **Fixed** `f6af9d8174` (same as claude F-RA-12). |
| 1-raoffline · gpt · F-RA-20 | **Fixed** `4c28682a73`. Patch 015 keeps the bounded lookup's answer for 30 seconds and a narrow `socket.getaddrinfo` wrapper serves that host from it. The bounded lookup itself still asks the resolver every time. Before: `second lookup still waiting after 2.00s`. After: answered at once on port 443. |
| 1-raoffline · gpt · F-RA-24 | **Fixed** `5a34c73954` (same as claude F-RA-23). |
| 1-raoffline · gpt · F-RA-26 | **Fixed** `32e4085693`. A new `listening [--wait N]` verb reads `/proc/net`, and the unit runs `ExecStartPost=… listening --wait 30`. Before: `listening: rc 2/2/2`. After: all four D12b checks pass. |
| 1-raoffline · gpt · F-RA-27 | **Fixed** `4b8247338e`: patch 008 now tests `is True`. Before: uploads `1/1/1/1` for `"false"`, `1`, `"yes"`, `true`; after: `0/0/0/1`. |
| 1-raoffline · gpt · F-RA-28 | **Fixed** `8bd2fddcae`: the pin, the refresh policy (the seven-day window, D-RA-029), summary's exit code (2), and the account entry separated back out from summary's. |
| 9-emulators · gpt · F-EM-03 | **Fixed** `a7fa6ee786` (same as claude F-EM-03). |
| 9-emulators · gpt · F-EM-05 | **Fixed** `a7fa6ee786` (same as claude F-EM-09). |

The other extra commit, `4cb57c8739`, fixed a flaky test of my own. The refresh cases' fixture order depended on rows inserted in the same millisecond: 15 runs passed and the 16th failed. Each row now has its own `cachedAt`.

## What I could not do, and what the integrator owes

- **Device and VM proofs** (the brief forbids them here):
  - PL-013's frame series.
  - PL-059's page frame.
  - F-EM-07: a PSP launch through the proxy.
  - F-RA-26: time boot to the carousel with the toggle on, before and after. The unit now holds the interface until the proxy is listening.
  - PL-060: time a scan with nothing new on a handheld.
- **For stream E2 (EmulationStation):**
  - Wording for `SOME_IMAGES_NOT_SAVED` (proposed above; needs approval).
  - Display "unknown" when summary's `unlocked` is null.
- **Decision-register rows to write** (`docs/` is not in my files):
  - The helper's exit 3 for a verify slice left over, refining D-RA-024.
  - `ppsspp.ini` in the wake check, refining D-RA-035 and D-RA-038.
  - The image pass's result deciding the run's, per D-RA-027 and D-UI-030. This reverses the ctl's earlier comment that the pass's exit code "is not the caller's".
  - The index marker's storm guard.
  - The unit counting as started only once it is listening.
  - Patch 015's remembered lookup answer (30 seconds).
- **Also for the integrator:** the change log and a work-log entry.
- **Noticed, not done:** claude F-RA-17 is not one of my rows; the ctl's usage line still leaves out `summary`.
- **Rules read this session, from `next`:**
  - engineering-practices
  - upgrade-and-install
  - working-principles
  - packaging-and-patches
  - the busybox section of generic-x64-vm-testing
  - es-player-text
  - decision-register (plus rows D-RA-024, 027, 029, 035 and 038, D-UI-030 and 107, D-WORKFLOW-050/054/055)

## Follow-up (the coordinator's message, 2026-09-28)

Two more commits on `feature/pl-d`, on top of `8bd2fddcae`:

```
66370fab6b raofflineproxy-ctl: the usage line names summary
fa9af93285 raofflineproxy: a badge the image server lacks is absent, not a failure
```

**Suite:** `tools/last-good-scripts-test` at `66370fab6b` ends `PASSED` with 469 PASS lines and 0 FAIL. The cases were written first; against the scripts at `8bd2fddcae` they gave `6 CHECK(S) FAILED`, all in the new cases D19 and D20.

### 1. PL-060 regression: a badge the server lacks must not fail every scan (`fa9af93285`)

**Resolved.** A badge the image server does not have is now recorded as absent and no longer fails the scan; a transient failure still does.

**The fix:**
- A new client patch, `016-say-what-became-of-a-download.patch`, makes `download_static_image` return what happened to the image:
  - `cached`: already there, or fetched whole;
  - `absent`: the server answered 404 or 410;
  - `transient`: anything else (a timeout, a 5xx, a refused connection, a short or damaged body).
- The same patch logs every image it did not cache, at info level, with the class, the URL and the HTTP status. It used to log at debug with no class.
- The image helper (`raofflineproxy-cache-images`) writes absent images to a new record, `image_cache/absent`, one `<epoch> <path>` per line, written to a temp file and renamed. It does not ask for them again and does not count them as left behind.
- Transient failures are not recorded. They still exit 1, fail the pass, and are asked for next time.
- So the ctl's `SOME_IMAGES_NOT_SAVED` now means transient failures only, and the ctl's comment says so.
- The series still applies to the pinned proxy source (`c1bd3724`) with no offset or fuzz.

**One addition you did not ask for:** an absent entry older than 30 days is asked for once more, so an image the server adds later is not missed for ever. The cost is one request per absent badge per month. Say if you want absent to be permanent instead.

**Before the fix:**
- `FAIL  PL-060 follow-up, patch 016: FAIL outcome: {'404': None, '410': None, '503': None, 'timeout': None, 'ok': None} -- the reason was swallowed`
- `FAIL  PL-060 follow-up, patch 016: FAIL logged: ` (nothing above debug)
- `FAIL  PL-060 follow-up: rc 1; out: ... >>> why SOME_IMAGES_NOT_SAVED ... stamp: ... 1 scan cached=4 ... why=S…` (a scan with a 404 badge and a 410 badge)
- `FAIL  PL-060 follow-up: rc 1; requested: /Badge/9301.png /Badge/9303.png  -- an absent badge was asked for at every pass`

**After the fix, case D19 (6 checks):**
- `PASS  PL-060 follow-up, patch 016: download_static_image says what became of an image -- 404 and 410 absent, a 503 and a timeout transient, a whole PNG cached`
- `PASS  PL-060 follow-up, patch 016: the outcome class, the HTTP status and the URL are logged`
- `PASS  PL-060 follow-up: a scan whose image server answers 404 and 410 for two badges completes (rc 0, no why) -- they are absent, not a failure of the run`
- `PASS  PL-060 follow-up: the next scan does not ask for the absent badges again (rc 0)`
- `PASS  PL-060 follow-up: a badge that timed out and one the server answered 503 end the scan COULDN'T FINISH (rc 1, why SOME_IMAGES_NOT_SAVED)`. This one also passed before; it guards that the fix did not turn transient failures into absent ones.
- `PASS  PL-060 follow-up: the next scan asks for the timed-out and the 503 badges again, and with the server answering, completes`

**How D19 runs:** it drives the real ctl and the real image helper through section t's sandbox. The image server is answered from a plan file, `/run/image-plan`, read by a hook D19 appends to section t's `sitecustomize.py` that only acts while that file exists. D19 puts the image-helper stand-in back when it ends.

**Already written:** an image cache from an earlier build has no absent record and is read as before. A badge it lacks is asked for once more, and if the server answers 404 or 410 it is recorded then.

**Decision-register row owed:** the image pass separates absent from transient, with a 30-day recheck.

### 2. claude F-RA-17: `summary` missing from the usage line (`66370fab6b`)

**Fixed.** The usage line now reads `...|account|summary|flushed|...`. This supersedes the "Noticed, not done" line above.
- Before: `FAIL  #308 claude F-RA-17: rc 2; usage: Usage: raofflineproxy-ctl {enable|...|pending-ids|account|flushed|scan|...}`
- After: `PASS  #308 claude F-RA-17: the usage line names summary with the other verbs`
- Already written: nothing.

## Follow-up 2 (the coordinator's second message, 2026-09-28)

One commit on `feature/pl-d`, on top of `66370fab6b`. The new pre-commit hook ran and passed.

```
156c2acffa raofflineproxy: no discarded store walk, a docstring, an executable helper
```

**Suite:** `tools/last-good-scripts-test` at `156c2acffa` ends `PASSED` with 472 PASS lines and 0 FAIL. The cases were written first; against the scripts at `66370fab6b` they gave `3 CHECK(S) FAILED`, all in the new case D21.

**claude F-RA-17 is now fixed in full.** Its other parts went in earlier: the header and summary's exit code in `8bd2fddcae`, the usage line in `66370fab6b`. This commit fixes the last three, each with its own check in D21:

| Part | Before (FAIL) | After (PASS) |
| --- | --- | --- |
| The image helper re-read the whole store before `--verify` and threw the result away. That read is removed. | `FAIL  #308 claude F-RA-17: FAIL walks: --verify walked the store's missing images 2 time(s), rc 0` | `PASS  #308 claude F-RA-17: --verify walks the store once, not once more to throw away` |
| The image helper's `-h` printed a fallback usage without `--verify`, because the file had no docstring. It now has one, naming both flags and the exit codes. | `FAIL  #308 claude F-RA-17: FAIL help: usage: raofflineproxy-cache-images [--seconds N]` | `PASS  #308 claude F-RA-17: cache-images -h names --seconds and --verify (a docstring of its own)` |
| `raofflineproxy-cache-indexed` was mode 100644 while its three siblings under `sources/` are 100755. Fixed with `git update-index --chmod=+x` plus `chmod 0755` in the worktree. The install step (`chmod 0755` in `package.mk`) was already right. | `FAIL  #308 claude F-RA-17: modes: raofflineproxy-ctl=100755 raofflineproxy-cache-indexed=100644 raofflineproxy-cache-images=100755 raofflineproxy-refresh=100755` | `PASS  #308 claude F-RA-17: the four scripts under sources/ are mode 100755 in the tree` |

The mode check reads the git index, or `BASE_REF`'s tree under `--old`, so it also runs when section t is skipped.

**Already written:** nothing on a device.
