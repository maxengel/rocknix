# Fix stream D: the offline-achievements service (raofflineproxy) -- audit #307 / #308 (D-WORKFLOW-054, D-WORKFLOW-055)
You are an Opus 5.5 subagent executing a plan this lane defined from a two-seat adversarial audit. Work only in your worktree, only in the files you own, run every item to an outcome, and return a report. Nothing you do reaches a device, a QA guest, an image build or the `next` branch: you deliver a branch, and the integrator builds.
## Your worktree and branch

- Worktree: `/workspace/repos/rocknix.worktrees/pl-d`, branch `feature/pl-d`, cut from `next`. `cd` there for everything; commit there. The primary checkouts (`/workspace/repos/rocknix` on `next`; the ES checkout `/home/max/Development/emulationstation-next.worktrees/qa-integration`) are read-only for you.
- The rules live in `/workspace/repos/rocknix/.claude/rules/` (read them from there; your ROCKNIX worktree carries the same copies). Open before you start: `engineering-practices.md` (§ Guards must fail closed, § Verify the artifact not the report, § A failure you find is yours to fix, § Before deleting a duplicate), `upgrade-and-install.md` (every fix answers what it does to what earlier builds already wrote), `working-principles.md` § Pre-flight, `packaging-and-patches.md`, and `rclone-cloud-sync.md` where your files are cloud scripts. Cite the decision-register rows your items name (`docs/decision-register.md`) rather than re-arguing them.
## The files you own (exclusive -- another stream owns everything else)

`projects/ROCKNIX/packages/network/raofflineproxy/` (`sources/raofflineproxy-ctl`, `sources/raofflineproxy-refresh`, the other sources, `patches/`, `package.mk`), `projects/ROCKNIX/packages/emulators/**/cheevos_*.sh`; plus your block in `tools/last-good-scripts-test`. NOT EmulationStation's ProxyCards/OfflineAchievements (E2).

If a fix genuinely needs a file outside this list, do not touch it: say so in the report under that item and leave the item open with the reason.
## How you prove a fix (scripts and recipes)

- `tools/last-good-scripts-test` (run from your worktree root: `./tools/last-good-scripts-test`; read its header first for how cases are written, how the image's busybox is used for the applets the device has, and how fixtures are made) is the harness. Add your cases at the END of the file in ONE block headed `# ---- audit #307, stream D ----` (other streams append their own blocks; the integrator merges). A case is written FIRST and seen to FAIL on the unfixed script -- paste the FAIL line in the report -- then the fix, then the whole suite PASS; quote the final PASS count.
- A recipe (`package.mk`) edit is followed by `tools/pkgcheck <package>`; quote its output. Late binding: toolchain and path variables only inside functions.
- A script that will run under busybox is tested through the image's busybox as the harness does; every external command you add is one the device has (`command -v` in the guest's busybox list in `generic-x64-vm-testing.md` § What the guest's busybox lacks, or a package dependency).
- Every word a player reads (a `>>> why` line, a console line) follows `es-player-text.md` § Outcome vocabulary: `COMPLETED`, `COULDN'T FINISH - <why>`, `SKIPPED - <reason>`, everyday register, no exit codes or paths on a screen.
## Commits

One commit per punch item (a sweep group may share one). Title `<package or script>: <text>` under 72 characters, no spaces before the colon; a blank line; a body that names the item (`#307 PL-NNN`) and the finding, says what the test case is, and carries the `Already written:` line -- how the fix treats what earlier builds already wrote on a device (D-WORKFLOW-050; "nothing is written" is an acceptable answer when true). End every commit message with:

```
Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
```

Never `--no-verify`, never a bare `git stash`, never edit a shell script while a run of it is in flight (the harness reads scripts by offset).

## The punch items (the contract; each has the verdict it was read from, with lines)
## PL-013: A cancel during the scan's image pass downloads everything already queued first
- **Severity:** High
- **Category:** Concurrency
- **Source Finding:** F-RA-01 (claude)
- **Owner area:** raofflineproxy-ctl
- **Where:** raofflineproxy-ctl (`run_image_pass`, the scan's cancel)
- **What:** The image pass's pool drains its queue before the interrupt is honoured, so a CANCEL on the page waits for every queued download. Fix: catch the interrupt inside the pool's loop and `pool.shutdown(cancel_futures=True)`.
- **Acceptance:** CANCEL during the image pass ends the run inside two seconds on the guest (a frame series shows the page close)
<details><summary>The audit's verdict(s) this item rests on</summary>
### F-RA-01 (claude, 1-raoffline) -- a cancel during the scan's image pass downloads everything queued first
**Checked:** `raofflineproxy-cache-images:318-347` runs the downloads under `with ThreadPoolExecutor(max_workers=4) as pool:` and iterates `as_completed`; its deadline branch cancels pending futures (`:347`), but a `KeyboardInterrupt` raised inside `as_completed` leaves the `with` block, whose exit is `shutdown(wait=True)` -- queued futures run to completion before the helper exits, and only then does the ctl's trap write the CANCELLED stamp. On a first scan with tens of thousands of badge images queued, the page's CANCEL (the one way out, D-UI-078) waits for all of them.
**Verdict:** survived -- **High**: catch the interrupt inside the block and `pool.shutdown(wait=False, cancel_futures=True)` (Python 3.9+; the image's Python is 3.12) before re-raising; a scripts-suite case that sends INT mid-pass and times the exit.
### F-RA-01 (gpt, 1-raoffline) -- an empty queue is read as proof the awards were sent
**Checked:** `ProxyCards.cpp:97-109`: `sent = takeFlushed()`, a ten-second wait for the flush stamp when `pending == 0`, then `done = pending == 0 || (pending < 0 && sent)` -- with `pending == 0` the card says `WHAT YOU EARNED OFFLINE IS NOW ON YOUR ACCOUNT.` whether or not the stamp came. `do_pending` (`raofflineproxy-ctl:512-516`) prints 0 when the toggle is off or the store is absent, but the probe (`:325`) gates on the toggle before a card starts, so the empty-queue case is the queue draining. **Survived, Medium** (High as filed): the wait covers the ordinary path (#305's fix), and the sentence should require the stamp -- `COMPLETED` alone when the queue emptied and no stamp followed.
</details>
## PL-055: The offline index's marker is consumed before the listing succeeds
- **Severity:** Medium
- **Category:** Correctness
- **Source Finding:** F-RA-02 (gpt) = F-RA-03 (claude)
- **Owner area:** raofflineproxy-ctl
- **Where:** raofflineproxy-ctl:1584-1586
- **What:** Fix: remove the marker after the listing returns 0.
- **Acceptance:** the scripts test: a listing that fails leaves the marker
<details><summary>The audit's verdict(s) this item rests on</summary>
### F-RA-02 (gpt, 1-raoffline) -- the offline index's marker is consumed before the listing succeeds
**Checked:** `raofflineproxy-ctl:1584-1586` removes `index-pending` and then runs `list_jobs`; on `LRC` 124 or another failure (`:1591-1598`) the marker is not restored, so the next link's return runs "the recently played pass alone" and the games the offline index could not identify wait for the next `--after-index` run -- the next startup or UPDATE GAMELISTS, which do run. **Survived, Medium** (High as filed; bounded by the next boot). Fix: remove the marker after the listing returns 0.
### F-RA-03 (gpt, 1-raoffline) -- two top-up watchers on one progress file
**Checked:** `ProxyCards.cpp:412-418` `topUp` sets `sTopUpRunning = true` with no `exchange` check, so two calls start two watcher threads; the ctl's lock makes the second command exit 75, but both watchers read the same `runningProgress()` file (`:222-230`) and each raises its own card. **Survived, Medium** (High as filed): `if (sTopUpRunning.exchange(true)) return;` -- the shape the send path already has at `:359`.
</details>
## PL-057: The bulk summary reads only `patch:` rows and turns unreadable unlocks into none
- **Severity:** Medium
- **Category:** Correctness
- **Source Finding:** F-RA-04 / F-RA-05 (gpt)
- **Owner area:** raofflineproxy-ctl
- **Where:** raofflineproxy-ctl:593, 612-618
- **What:** Fix: enumerate `achievementsets:` rows too; report a damaged row as unknown.
- **Acceptance:** the scripts test seeds an achievementsets-only game and a bad unlock row
<details><summary>The audit's verdict(s) this item rests on</summary>
### F-RA-04 / F-RA-05 (gpt, 1-raoffline) -- the bulk summary reads only `patch:` rows and turns unreadable unlocks into none
**Checked:** `raofflineproxy-ctl:593` enumerates `cacheKey LIKE "patch:%:<user>"`; a game cached by a launch alone holds `achievementsets:<hash>:<user>` (the ctl's own comment at `:917`, and `RetroAchievements.cpp`'s fallback in `getGameInfoFromDevice`) and is absent from the summary until a scan or top-up caches its patch row; `:612-618` sets `unlocked = set()` on a parse error and appends the game as earned-nothing. **Survived, Medium each** (High as filed): the recently-played top-up closes the first within a link's return, and the second misreports a damaged cache row rather than losing anything on the server.
</details>
## PL-058: The refresh helper reports success over a failed drop
- **Severity:** Medium
- **Category:** Outcome vocabulary
- **Source Finding:** F-RA-06 (gpt)
- **Owner area:** raofflineproxy-refresh
- **Where:** raofflineproxy-refresh:73-85, 201, 224
- **What:** Fix: count the failure.
- **Acceptance:** the helper's test: a failing drop is in `M failed`
<details><summary>The audit's verdict(s) this item rests on</summary>
### F-RA-06 (gpt, 1-raoffline) -- the refresh helper reports success over a failed drop
**Checked:** `raofflineproxy-refresh:73-85` `drop_startsession` catches every exception and returns its count; `:201` counts the game `done`; `:224` prints `re-read N game(s), M failed` with the failure absent. The maintainer's 2026-09-19 case (`engineering-practices.md` § A name is not a behaviour) was this helper reporting half its job. **Survived, Medium** (High as filed): a maintenance report, wrong in the same shape as before.
</details>
## PL-059: The scan cap has no cursor past files that cannot be cached, and truncation is not on the page
- **Severity:** Medium
- **Category:** Correctness
- **Source Finding:** F-RA-07 (gpt)
- **Owner area:** raofflineproxy-ctl
- **Where:** raofflineproxy-ctl:1144-1149, 1426-1428
- **What:** Fix: a cursor kept between runs; `note TRUNCATED` to the page.
- **Acceptance:** the scripts test with 5,001 uncacheable files reaches the 5,001st on the second run; the page's frame reads the note
<details><summary>The audit's verdict(s) this item rests on</summary>
### F-RA-07 (gpt, 1-raoffline) -- the scan cap has no cursor past files that cannot be cached
**Checked:** `MAX_SCAN_ENTRIES = 5000` (`patches/004-no-cap-on-cached-games.patch:25`); `raofflineproxy-ctl:1144-1149` counts the cap over files not yet cached, so cached games move past it (`:122-123`) but files that never cache -- unsupported, unhashable -- occupy the first 5,000 every run; `:1426-1428` logs the truncation and sends no `note TRUNCATED`, and the stamp reads complete. **Survived, Medium** (High as filed): a library over 5,000 uncacheable files is large; the page saying "scan done" over games it never reached is the outcome rule broken. Fix: walk from a cursor kept between runs, and say TRUNCATED on the page.
</details>
## PL-060: Image-pass failures are dropped and a scan with nothing new never repairs them
- **Severity:** Medium
- **Category:** Outcome vocabulary
- **Source Finding:** F-RA-08 (gpt)
- **Owner area:** raofflineproxy-ctl
- **Where:** raofflineproxy-ctl (`run_image_pass` callers, :1438-1444)
- **What:** Fix: carry the pass's result into the stamp; run it on the nothing-new path.
- **Acceptance:** the scripts test: a failing image pass ends the scan `COULDN'T FINISH`
<details><summary>The audit's verdict(s) this item rests on</summary>
### F-RA-08 (gpt, 1-raoffline) -- image-pass failures are dropped and a scan with nothing new never repairs them
**Checked:** `run_image_pass ... || true` at both callers; `:1438-1444` the nothing-new branch stamps and exits before the image pass. **Survived, Medium** (High as filed): badges are a best-effort tier, but the outcome rule (D-UI-030) says a part that failed is not `COMPLETED`; fix: carry the image pass's result into the stamp and run it on the nothing-new path.
</details>
## The sweep rows (#308): the seats' Mediums and Lows in your files, 29 rows

Every row gets a verdict. For each: read the seat's full finding in `/workspace/repos/rocknix/docs/audits/2026_09_25-milestone-rc-round-since-258/seats/<packet>-<seat>.md` under its id; read the code it names; then either **fix** it (the same proof rule: a case first where a case can exist, a commit naming `#308 <packet> <seat> <id>`) or **withdraw** it with one honest line (refuted with the line that refutes it; a duplicate of a punch item -- name it; fork-only prose or upstream fit for the PR-prep pass #256; not in your files -- name the stream). Do not skip a row and do not fix by description: read the line first.

| packet | seat | id | severity | title | where |
| --- | --- | --- | --- | --- | --- |
| 1-raoffline | claude | F-RA-06 | Medium | The listing reads only the first `es_systems*.cfg` it finds, so a device with a custom sys | `.../sources/raofflineproxy-ctl` — `list_jobs`, the embedded Python `es_systems( |
| 1-raoffline | claude | F-RA-07 | Medium | The ctl reads the proxy's sqlite tables directly, and its schema check is recorded against | - `.../sources/raofflineproxy-ctl` — header ("the client's schema at the commit |
| 1-raoffline | claude | F-RA-10 | Medium | `added=` counts the indexed pass only, though the recently-played pass is documented in th | `.../sources/raofflineproxy-ctl` — `do_topup()`: `ADDED="${CACHED}"   # the inde |
| 1-raoffline | claude | F-RA-11 | Medium | Patch 015's `proxy_service.py` hunk uses `urlsplit` with no import in the hunk and no test | `projects/ROCKNIX/packages/network/raofflineproxy/patches/015-bounded-name-looku |
| 1-raoffline | claude | F-RA-12 | Low | `raofflineproxy-refresh` stops after three failures in total while saying "in a row" | `.../sources/raofflineproxy-refresh` — `main()`: `failed += 1 ... if failed >= 3 |
| 1-raoffline | claude | F-RA-13 | Low | A valid PNG with bytes after IEND is refused by patch 013 and, if already cached, deleted | - `.../patches/013-validate-a-cached-image-before-publishing-it.patch` — `if ima |
| 1-raoffline | claude | F-RA-20 | Low | `StartLimitInterval`/`StartLimitBurst` sit in `[Service]` | `projects/ROCKNIX/packages/network/raofflineproxy/system.d/raofflineproxy.servic |
| 1-raoffline | claude | F-RA-22 | Low | `index-offline`'s marker causes a library listing that cannot contain the games it was wri | `.../sources/raofflineproxy-ctl` — `do_index_offline()` and its comment ("the ne |
| 1-raoffline | claude | F-RA-23 | Low | The ctl's external tools are not declared by the package | `projects/ROCKNIX/packages/network/raofflineproxy/package.mk` — `PKG_DEPENDS_TAR |
| 9-emulators | claude | F-EM-03 | Medium | ARMSX2 token rewrite leaves and regrows Token lines when `secrets.ini` carries two `[Achie | `projects/ROCKNIX/packages/emulators/standalone/armsx2-sa/scripts/cheevos_armsx2 |
| 9-emulators | claude | F-EM-04 | Medium | PPSSPP offline-proxy probe relies on an undeclared `netstat` and logs every negative as "n | `projects/ROCKNIX/packages/emulators/standalone/ppsspp-sa/scripts/cheevos_ppsspp |
| 9-emulators | claude | F-EM-07 | Medium | Nothing in the packet shows PPSSPP consumes `AchievementsHost` | `projects/ROCKNIX/packages/emulators/standalone/ppsspp-sa/scripts/cheevos_ppsspp |
| 9-emulators | claude | F-EM-09 | Low | ARMSX2: `sed '$a'` writes nothing to an empty `secrets.ini`; a missing file fails after it | `projects/ROCKNIX/packages/emulators/standalone/armsx2-sa/scripts/cheevos_armsx2 |
| 1-raoffline | gpt | F-RA-09 | Medium | Pending awards are merged into whichever account is currently selected | `projects/ROCKNIX/packages/network/raofflineproxy/sources/raofflineproxy-ctl:@@ |
| 1-raoffline | gpt | F-RA-10 | Medium | Helper budgets do not bound blocking work | `projects/ROCKNIX/packages/network/raofflineproxy/sources/raofflineproxy-cache-i |
| 1-raoffline | gpt | F-RA-11 | Medium | The shared image pass escapes prompt stop handling | `projects/ROCKNIX/packages/network/raofflineproxy/sources/raofflineproxy-ctl:@@ |
| 1-raoffline | gpt | F-RA-12 | Medium | Existing PNG corruption bypasses the strengthened validator | `projects/ROCKNIX/packages/network/raofflineproxy/sources/raofflineproxy-cache-i |
| 1-raoffline | gpt | F-RA-13 | Medium | The history shortcut suppresses PPSSPP-only top-ups | `projects/ROCKNIX/packages/network/raofflineproxy/sources/raofflineproxy-ctl:@@ |
| 1-raoffline | gpt | F-RA-14 | Medium | Unindexed scans mistake a patch path for a complete cache | `projects/ROCKNIX/packages/network/raofflineproxy/sources/raofflineproxy-ctl:@@ |
| 1-raoffline | gpt | F-RA-15 | Medium | “More games” counts cache operations rather than newly ready game IDs | `projects/ROCKNIX/packages/network/raofflineproxy/sources/raofflineproxy-ctl:@@ |
| 1-raoffline | gpt | F-RA-18 | Medium | Disable deletes the restoration record before verifying restoration | `projects/ROCKNIX/packages/network/raofflineproxy/sources/raofflineproxy-ctl:@@ |
| 1-raoffline | gpt | F-RA-19 | Medium | Refresh stops after three total failures, not three consecutive failures | `projects/ROCKNIX/packages/network/raofflineproxy/sources/raofflineproxy-refresh |
| 1-raoffline | gpt | F-RA-20 | Medium | DNS preflight does not bound the connection’s actual lookup | `projects/ROCKNIX/packages/network/raofflineproxy/patches/015-bounded-name-looku |
| 1-raoffline | gpt | F-RA-24 | Medium | Installed CLI dependencies are not declared by the package | `projects/ROCKNIX/packages/network/raofflineproxy/package.mk:@@ -0,0 +1,153 @@ ( |
| 1-raoffline | gpt | F-RA-26 | Medium | Service ordering does not establish listener readiness | `projects/ROCKNIX/packages/network/raofflineproxy/system.d/raofflineproxy.servic |
| 1-raoffline | gpt | F-RA-27 | Medium | The automatic-upload opt-in accepts truthy non-booleans | `projects/ROCKNIX/packages/network/raofflineproxy/patches/008-log-upload-opt-in. |
| 1-raoffline | gpt | F-RA-28 | Low | Control-script documentation describes a different pin and refresh policy | `projects/ROCKNIX/packages/network/raofflineproxy/sources/raofflineproxy-ctl:@@ |
| 9-emulators | gpt | F-EM-03 | Medium | Legacy duplicate achievement sections still accumulate tokens | - `projects/ROCKNIX/packages/emulators/standalone/armsx2-sa/scripts/cheevos_arms |
| 9-emulators | gpt | F-EM-05 | Medium | The no-section token branch cannot initialize an empty file | - `projects/ROCKNIX/packages/emulators/standalone/armsx2-sa/scripts/cheevos_arms |

## The report

Write `/workspace/tmp/rocknix-session/streams/D-report.md` (create the directory if needed) and return its content as your final message. It carries: the branch and `git log --oneline <base>..HEAD`; per punch item -- **outcome** (resolved / open with reason), the commit, the test case's name, the FAIL line seen before the fix and the PASS after, the `Already written:` answer, and anything the integrator must prove on the VM or a device; per sweep row -- fixed (commit) or withdrawn (reason); the harness's final line (the `tools/last-good-scripts-test` PASS count); and a short list of what you could not do and why. No claim without its artifact: a commit hash, a test's output line, a grep.

## Do not

- Build an image or run `make`, `scripts/build`, `scripts/image`; touch `/workspace/repos/rocknix.worktrees/generic-x64` or `devices` (build worktrees); ssh to any host or guest; run `tools/vm-*` or `generic-x64-vm`; touch `/workspace/artifacts`.
- Push; commit on `next` or `test/qa-integration`; create or remove worktrees; edit files outside your list; read `~/.config/council/env`, `~/.ROCKNIX/`, or anything under `~/.config/possibility-forge/`.
- Ask questions: nobody is watching this stream; decide from the rules and say what you decided in the report. If an item is blocked, leave it open with the reason and go on.

## Run to completion

Wait for every command you start with bounded loops; return only when every punch item and every sweep row has an outcome. A few hours is expected.
