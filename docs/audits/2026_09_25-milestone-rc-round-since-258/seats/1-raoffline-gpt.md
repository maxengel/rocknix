## Summary

This bucket adds the packaged offline-achievements proxy, cache-management commands, RetroArch login notifications, and EmulationStation’s offline pages, indexing, and background cards. I would not submit it unchanged: the displayed code contains false-success paths and loses work that its automatic-retry messages promise to finish. The most consequential findings are an empty queue being treated as proof that awards reached the account, failed indexed work losing its retry trigger, and top-up watchers consuming another invocation’s progress. The cache readers also disagree about which stored games and unlocks constitute a valid offline copy. This is a static review of the embedded corpus; no builds, tests, device operations, independent file reads, or hashing were performed.

## Findings

All code locations below refer to hunks in **S1**, the embedded `1-raoffline.diff`. Function names distinguish locations within whole-new-file hunks. Source identifiers **S1–S7** map to the declared paths and embed-verified hashes in `corpus.provenance.json` under **Coverage boundary**.

### F-RA-01: An empty queue is treated as proof that awards were sent
- **Severity:** High
- **Category:** Correctness
- **Where:**  
  `es-app/src/ProxyCards.cpp:@@ -0,0 +1,439 @@ (runSend)`  
  `projects/ROCKNIX/packages/network/raofflineproxy/sources/raofflineproxy-ctl:@@ -0,0 +1,1703 @@ (do_pending)`
- **What:** The send card announces that offline earnings are on the account without requiring evidence of a successful flush. The pending command deliberately returns zero when the toggle is off or the database is absent.
- **Failure scenario:** Awards are queued; the player disables offline achievements while the send card is waiting. `pending` then returns zero although the queue remains on disk and the service has stopped; the card eventually says “WHAT YOU EARNED OFFLINE IS NOW ON YOUR ACCOUNT.”
- **Evidence:** `do_pending` returns `echo 0; return 1` for a disabled toggle or absent store. `runSend` accepts `pending == 0 || (pending < 0 && sent)`. Refutation attempted: the ten-second stamp wait does not help because `sent` is not required when `pending == 0`.
- **Fix:** Distinguish an unavailable/disabled queue from an empty active queue. Base the account-success claim on confirmed flush results associated with the relevant batch, including unsuccessful terminal outcomes, rather than queue emptiness alone.
- **Confidence:** high — the producer’s zero sentinel and consumer’s success condition are both shown.

### F-RA-02: Failed indexed work loses the trigger that would retry it
- **Severity:** High
- **Category:** Correctness
- **Where:**  
  `projects/ROCKNIX/packages/network/raofflineproxy/sources/raofflineproxy-ctl:@@ -0,0 +1,1703 @@ (do_topup)`  
  `es-app/src/CheevosIndex.cpp:@@ -0,0 +1,30 @@ (take)`
- **What:** Indexed work interrupted after a successful probe is not retained as outstanding work. A reconnect consumes `index-pending` before listing or caching succeeds, while an ordinary `--after-index` run creates that marker only when its initial probes fail.
- **Failure scenario:** An index identifies several unplayed games; its top-up caches one and then times out. Subsequent link-return top-ups do not list the index, and may exit before probing because no game was played. The remaining games never receive the promised automatic retry.
- **Evidence:** The reconnect branch executes `rm -f "${INDEX_PENDING}"` before `list_jobs`. Later failures write `last-scan` but do not restore the marker. Refutation attempted: the recent-history pass does not cover unplayed games, and an already indexed game with hash and ID is `Take::None`.
- **Fix:** Keep durable indexed-work intent until listing and all required jobs complete. Preserve or recreate it on timeout, cancellation, listing failure, and partial caching; do not suppress that outstanding work with the no-new-history shortcut.
- **Confidence:** high — the marker lifecycle, reconnect branch, and index eligibility rule are visible.

### F-RA-03: Top-up watchers consume another invocation’s progress
- **Severity:** High
- **Category:** Concurrency
- **Where:**  
  `es-app/src/ProxyCards.cpp:@@ -0,0 +1,439 @@ (topUp, runTopUp)`  
  `projects/ROCKNIX/packages/network/raofflineproxy/sources/raofflineproxy-ctl:@@ -0,0 +1,1703 @@ (mark_running, take_lock)`
- **What:** Every top-up request starts a watcher, but each watcher reads the same unowned progress file. Neither the progress nor the resulting card is tied to the particular control-script invocation being watched.
- **Failure scenario:** A link-return top-up is running when an after-index top-up starts waiting for its lock. Both watchers see the first run’s progress and request cards. A lock-refused invocation that finishes during the watcher’s initial sleep can also consume the winner’s progress and report failure for work it never performed.
- **Evidence:** `topUp` assigns `sTopUpRunning = true` without a single-flight check. `runTopUp` sleeps, reads `runningProgress()`, and sets `sawWork = true` without checking an owner, route, or whether its own command finished during that sleep. Refutation attempted: the backend lock serializes commands, not their watchers.
- **Fix:** Give progress and completion records a run identity and make watchers accept only their own records. Coalesce watcher creation while preserving the necessary queued after-index operation.
- **Confidence:** high — the shared-record consumption and absence of invocation ownership are explicit.

### F-RA-04: The bulk summary omits achievementsets-only cached games
- **Severity:** High
- **Category:** Upgrade path
- **Where:**  
  `projects/ROCKNIX/packages/network/raofflineproxy/sources/raofflineproxy-ctl:@@ -0,0 +1,1703 @@ (do_summary)`  
  `es-app/src/RetroAchievements.cpp:@@ -209,7 +266,215 @@ (getGameInfoFromDevice)`
- **What:** The offline summary enumerates only `patch:` rows, although the game-page implementation explicitly supports valid cached games stored under `achievementsets:` without a patch row.
- **Failure scenario:** An existing device has an achievementsets response and unlocks from an earlier RetroArch session, but no patch row. Its game page can read the cached set, while its offline account summary omits the game.
- **Evidence:** Summary enumeration is `WHERE cacheKey LIKE "patch:%:<user>"`. The game-page code documents the launch-only storage shape and falls back to `r=achievementsets&m=...`. Refutation attempted: the bulk summary contains no corresponding fallback or enumeration of achievementsets rows.
- **Fix:** Build the summary from both supported storage shapes, using the achievementsets body’s game ID and core set, deduplicating by account and game. Cover inherited achievementsets-only stores without requiring a new scan.
- **Confidence:** high — the two readers implement visibly different completeness rules.

### F-RA-05: Missing or invalid unlock data becomes “nothing earned”
- **Severity:** High
- **Category:** Correctness
- **Where:**  
  `projects/ROCKNIX/packages/network/raofflineproxy/sources/raofflineproxy-ctl:@@ -0,0 +1,1703 @@ (do_summary)`  
  `es-app/src/RetroAchievements.cpp:@@ -209,7 +266,215 @@ (getGameInfoFromDevice)`
- **What:** The bulk summary manufactures zero unlocks when an unlock row is missing or malformed. It then emits a successful game summary rather than identifying the account progress as unknown.
- **Failure scenario:** A patch fetch succeeds but the unlock fetch does not, or an inherited unlock row is damaged. Opening the offline summary shows zero earned achievements for a game whose earned count was not read.
- **Evidence:** `unlocked = set()` is the initial state, and parsing exceptions also assign `set()`; the game is appended regardless. Refutation attempted: the individual game-page path explicitly rejects unreadable unlock data, but that validation is not used by the bulk reader.
- **Fix:** Validate the unlock response separately from its contents. Propagate unknown/unavailable progress instead of zero, or refuse that summary entry/page with an appropriate unavailable state.
- **Confidence:** high — the fallback value and successful output are in the complete function.

### F-RA-06: Failed cache invalidation still reports successful maintenance
- **Severity:** High
- **Category:** Correctness
- **Where:**  
  `projects/ROCKNIX/packages/network/raofflineproxy/sources/raofflineproxy-refresh:@@ -0,0 +1,230 @@ (drop_startsession, main)`  
  `projects/ROCKNIX/packages/network/raofflineproxy/sources/raofflineproxy-cache-images:@@ -0,0 +1,363 @@ (verification deletion and final result)`
- **What:** Both maintenance helpers can report success after failing to remove state they have identified as stale or damaged. Logging the deletion failure does not affect their completion result.
- **Failure scenario:** A refresh updates unlocks but deletion of the old startsession row fails: the helper returns success while an offline launch can still receive the stale session. Similarly, a detected damaged image that cannot be unlinked remains present, so the image pass can report `NOTHING_MISSING` and exit zero.
- **Evidence:** `drop_startsession` catches exceptions and returns a count; its caller then increments `done`. Image unlink failures are only logged, while the final check tests file presence. Refutation attempted: neither caller verifies that the failed invalidation actually took effect.
- **Fix:** Propagate failed session deletion into the refresh result. Track damaged-but-not-repaired images independently of missing files, and return an incomplete result while any remain.
- **Confidence:** high — both swallowed-error paths and subsequent success paths are shown.

### F-RA-07: The scan cap can permanently hide later games while reporting completion
- **Severity:** High
- **Category:** Correctness
- **Where:**  
  `projects/ROCKNIX/packages/network/raofflineproxy/sources/raofflineproxy-ctl:@@ -0,0 +1,1703 @@ (list_jobs, do_scan, run_jobs)`  
  `es-app/src/guis/GuiOfflineScan.cpp:@@ -0,0 +1,352 @@ (truncated outcome)`
- **What:** The unindexed walk has no continuation cursor and excludes only successfully cached paths before counting its cap. Files that cannot be cached can therefore occupy the same first batch forever; truncation is also omitted from the page’s protocol and completion verdict.
- **Failure scenario:** The first `MAX_SCAN_ENTRIES` supported files produce no match or cannot hash, while a valid supported game appears later. Every scan repeats the first batch, never reaches the later game, and finishes with exit zero.
- **Evidence:** The walk stops at `len(walked) >= MAX_SCAN_ENTRIES`; only `cached_paths` bypass that count. `do_scan` logs truncation but never sends `note TRUNCATED` or makes it an incomplete result. Refutation attempted: the GUI can display a truncation notice, but the producer does not emit it.
- **Fix:** Persist scan continuation or otherwise ensure rejected files cannot permanently consume the front of the walk. Report outstanding folders through the existing protocol and an outcome that does not imply a complete library scan.
- **Confidence:** high — repeated deterministic enumeration produces the counterexample.

### F-RA-08: Image-pass failures are hidden, and a repeat scan may never repair them
- **Severity:** High
- **Category:** Correctness
- **Where:**  
  `projects/ROCKNIX/packages/network/raofflineproxy/sources/raofflineproxy-ctl:@@ -0,0 +1,1703 @@ (run_image_pass, do_scan, do_topup)`  
  `projects/ROCKNIX/packages/network/raofflineproxy/sources/raofflineproxy-cache-images:@@ -0,0 +1,363 @@ (main)`
- **What:** Scan and top-up discard the image helper’s failure result and can stamp completion with missing images. A subsequent scan that finds no new game data exits before attempting image repair.
- **Failure scenario:** Achievement data is cached, then the media connection fails. The image helper exits one, but the run reports completion; pressing scan again takes the `NEW == 0` early exit and leaves the missing badges untouched.
- **Evidence:** Both callers use `run_image_pass ... || true`; the scan’s nothing-new branch exits before that call. Refutation attempted: an independent `images` command exists, but the displayed scan retry does not invoke it. The code describes achievements and images as one action, while S5’s outcome rule rejects completion when a constituent part failed.
- **Fix:** Retain image work as outstanding, expose incomplete image results, and allow a no-new-games run to repair them within its budget.
- **Confidence:** high — helper failure, caller suppression, and retry bypass are all visible.

### F-RA-09: Pending awards are merged into whichever account is currently selected
- **Severity:** Medium
- **Category:** Correctness
- **Where:**  
  `projects/ROCKNIX/packages/network/raofflineproxy/sources/raofflineproxy-ctl:@@ -0,0 +1,1703 @@ (do_pending_ids, do_summary)`  
  `es-app/src/RetroAchievements.cpp:@@ -209,7 +266,215 @@ (getGameInfoFromDevice)`
- **What:** Cached game rows are selected for the configured user, but queued achievement IDs are selected globally. An old account’s pending IDs can therefore be displayed as the current account’s earned achievements.
- **Failure scenario:** Account A has a pending award; the configured username changes to B, which has a cached copy of the same game. The summary merges A’s queued ID into B’s unlock count.
- **Evidence:** Both pending queries use only `WHERE status = 'pending'`; summary then calculates `queued = pending & set(points)`. Refutation attempted: the shown readers perform no ownership check, despite account-specific cache keys and the account-switch handling introduced by patch 007.
- **Fix:** Scope pending reads and merges to their owning account. If the schema cannot express ownership, introduce an explicit account-transition policy that preserves unsent awards without attributing them to another user.
- **Confidence:** high — the incorrect merge follows directly for the stated stored state; this does not assert how upstream submission handles ownership.

### F-RA-10: Helper budgets do not bound blocking work
- **Severity:** Medium
- **Category:** Resource
- **Where:**  
  `projects/ROCKNIX/packages/network/raofflineproxy/sources/raofflineproxy-cache-images:@@ -0,0 +1,363 @@ (main)`  
  `projects/ROCKNIX/packages/network/raofflineproxy/sources/raofflineproxy-refresh:@@ -0,0 +1,230 @@ (main)`  
  `projects/ROCKNIX/packages/network/raofflineproxy/sources/raofflineproxy-ctl:@@ -0,0 +1,1703 @@ (run_image_pass, do_refresh)`
- **What:** The helpers check their deadlines only between blocking operations. The image helper additionally waits for running executor jobs during context-manager shutdown, and its normal scan/top-up caller supplies no external timeout.
- **Failure scenario:** An image download blocks longer than the remaining budget. `as_completed` cannot reach the deadline check until a future finishes; cancellation then leaves active workers running, and executor shutdown waits for them.
- **Evidence:** The loop is `for future in as_completed(futures)` without a timeout, followed by a time check; the executor is used in a `with` block. Refresh checks time before, not during, its network calls. Refutation attempted: passing `--seconds` does not impose a process-level deadline.
- **Fix:** Enforce the shared absolute deadline at a boundary capable of stopping blocking work, including worker shutdown. Bound individual operations and avoid treating cancellation of queued futures as cancellation of running ones.
- **Confidence:** high — these are explicit control-flow and executor-lifetime properties.

### F-RA-11: The shared image pass escapes prompt stop handling
- **Severity:** Medium
- **Category:** Concurrency
- **Where:**  
  `projects/ROCKNIX/packages/network/raofflineproxy/sources/raofflineproxy-ctl:@@ -0,0 +1,1703 @@ (run_image_pass, stop_running_run, scan/top-up EXIT traps)`
- **What:** The image pass used by scan and top-up runs as an untracked foreground command. A stop request signals the control shell, while its cleanup trap only knows about `CLIENT`, which has already been unset.
- **Failure scenario:** Disable or STOP IT AND PLAY arrives during a lengthy image pass. Bash defers the trapped signal while waiting for the foreground command; disable reaches `STOP_WAIT` and continues although the helper is still running.
- **Evidence:** `run_image_pass` invokes `"${IMAGE_HELPER}" ...` directly, without assigning `CLIENT`; preceding job and smart-cache passes unset that variable. Refutation attempted: the standalone `images` and `refresh` verbs correctly background and track their helpers, but the shared image-pass path does not.
- **Fix:** Run this helper through the same tracked, interruptible child/process-group mechanism as the other phases, and wait for confirmed termination before declaring the run stopped.
- **Confidence:** high — the inconsistent child-lifetime handling is visible in the same script.

### F-RA-12: Existing PNG corruption bypasses the strengthened validator
- **Severity:** Medium
- **Category:** Upgrade path
- **Where:**  
  `projects/ROCKNIX/packages/network/raofflineproxy/sources/raofflineproxy-cache-images:@@ -0,0 +1,363 @@ (damaged)`  
  `projects/ROCKNIX/packages/network/raofflineproxy/patches/013-validate-a-cached-image-before-publishing-it.patch:@@ -179,7 +180,52 @@ (nested image_cache.py hunk)`
- **What:** Newly downloaded PNGs receive CRC and IDAT-inflate checks, but existing files checked by `--verify` do not. The fix therefore does not repair the same corruption when it was already written.
- **Failure scenario:** A stored PNG has a flipped IDAT byte but retains its size, signature, and IEND trailer. `damaged()` accepts it, and existence checks prevent a replacement download.
- **Evidence:** `damaged()` checks only a size floor, the first eight bytes, and an IEND marker near the end. Patch 013’s stronger checks run before publishing a new download. Refutation attempted: no shared validator connects those paths. This is the “fixed forward, still broken backward” case prohibited by S3.
- **Fix:** Reuse the strengthened validator for existing files, arrange a resumable sweep of inherited data, and account for validation-version changes in the sweep cursor.
- **Confidence:** high — the mismatch is between two fully displayed validators.

### F-RA-13: The history shortcut suppresses PPSSPP-only top-ups
- **Severity:** Medium
- **Category:** Correctness
- **Where:**  
  `projects/ROCKNIX/packages/network/raofflineproxy/sources/raofflineproxy-ctl:@@ -0,0 +1,1703 @@ (history_path, do_topup)`
- **What:** The no-work decision observes only RetroArch history, although the command it suppresses is documented here as also consuming PPSSPP’s recent list.
- **Failure scenario:** After an initial top-up, a player uses standalone PPSSPP without launching RetroArch. PPSSPP history changes, but the next reconnect exits as “no game played” before invoking the recent-games pass.
- **Evidence:** `history_path()` reads only RetroArch configuration and `.lpl` candidates. `do_topup` exits when that file is absent or not newer than `TOPUP_MARK`. Refutation attempted: the PPSSPP-aware pass is below the early return and cannot correct it.
- **Fix:** Make the eligibility check cover the same history sources as the actual smart-cache pass, or let that pass make its own cheap no-work decision.
- **Confidence:** high — the trigger demonstrably excludes one of its documented input sources.

### F-RA-14: Unindexed scans mistake a patch path for a complete cache
- **Severity:** Medium
- **Category:** Upgrade path
- **Where:**  
  `projects/ROCKNIX/packages/network/raofflineproxy/sources/raofflineproxy-ctl:@@ -0,0 +1,1703 @@ (list_jobs: is_cached, cached_paths, unindexed walk)`
- **What:** Indexed jobs require patch, unlocks, and achievementsets rows, but unindexed jobs are skipped merely because a patch row records their path. Incomplete inherited caches can therefore remain permanently unrepaired by scan.
- **Failure scenario:** A retained patch row has `sourceRomPath`, but its unlock or achievementsets row is missing. In an unindexed system, scan skips the ROM and can report that nothing is new.
- **Evidence:** `cached_paths` is built from patch rows alone, and the walk immediately continues when the normalized path is present. Refutation attempted: the stronger three-row `is_cached()` check is used only for indexed jobs.
- **Fix:** Apply a complete, account-and-dump-specific readiness test to both routes. Treat legacy path-only records without sufficient companion data as repair work.
- **Confidence:** high — the two eligibility predicates are explicitly different.

### F-RA-15: “More games” counts cache operations rather than newly ready game IDs
- **Severity:** Medium
- **Category:** Player text
- **Where:**  
  `projects/ROCKNIX/packages/network/raofflineproxy/sources/raofflineproxy-ctl:@@ -0,0 +1,1703 @@ (list_jobs, write_stamp, do_topup)`  
  `es-app/src/ProxyCards.cpp:@@ -0,0 +1,439 @@ (runTopUp completion text)`
- **What:** The new `added` field is assigned from successful indexed jobs, not from games newly entering the ready set. Multiple dumps and repairs of an existing game can be announced as additional games.
- **Failure scenario:** Game G is already cached for hash H1; an indexed second dump H2 is cached. `ADDED="${CACHED}"` produces “1 MORE GAME IS READY” although the distinct ready-game count has not increased.
- **Evidence:** Jobs are keyed by path, readiness includes the hash, and `ADDED` copies `R_CACHED`. Refutation attempted: the special handling excludes recent-history refreshes, but not existing-game repairs or additional dumps. S5 explicitly restricts “more games” to games new to the store.
- **Fix:** Derive `added` from a distinct, account-specific before/after readiness set, or have the worker explicitly report first-time game readiness separately from cache operations.
- **Confidence:** high — the counted unit differs from the displayed unit.

### F-RA-16: Stop can signal a recycled PID from a persistent lock file
- **Severity:** Medium
- **Category:** Concurrency
- **Where:**  
  `es-app/src/OfflineAchievements.cpp:@@ -0,0 +1,325 @@ (stopRun)`  
  `projects/ROCKNIX/packages/network/raofflineproxy/sources/raofflineproxy-ctl:@@ -0,0 +1,1703 @@ (take_lock and EXIT traps)`
- **What:** `stopRun()` trusts the PID text without verifying that the lock is still held by that process. The lock file retains its PID after normal completion.
- **Failure scenario:** A stop dialog remains open after its run exits, or a killed run leaves a still-fresh progress record. The PID is reused; accepting stop sends SIGTERM to the unrelated replacement process.
- **Evidence:** The only check before `::kill(pid, SIGTERM)` is `pid > 1`. Refutation attempted: the shell’s disable route checks the flock, but the UI route bypasses it and records no process-start identity.
- **Fix:** Route stopping through an ownership-checked backend operation. Validate live lock ownership and a non-reusable process identity, rather than trusting a stale PID file.
- **Confidence:** high — the stale record and unqualified signal are both shown.

### F-RA-17: Player-requested top-up stops have no cancellation outcome
- **Severity:** Medium
- **Category:** Correctness
- **Where:**  
  `es-app/src/ProxyCards.cpp:@@ -0,0 +1,439 @@ (stopTopUp, runTopUp)`  
  `es-app/src/OfflineAchievements.cpp:@@ -0,0 +1,325 @@ (stopRun)`  
  `projects/ROCKNIX/packages/network/raofflineproxy/sources/raofflineproxy-ctl:@@ -0,0 +1,1703 @@ (stopped, do_topup)`
- **What:** STOP IT AND PLAY uses the same TERM path as disabling the feature. That path writes no completion stamp, while the watcher treats its nonzero exit as failure and may use a previous run’s reason.
- **Failure scenario:** The player stops a top-up to launch a short game. The later card says “COULDN’T FINISH” with an old or generic reason instead of recording the player’s cancellation.
- **Evidence:** `stopped()` exits 143 and explicitly preserves the previous stamp. The watcher’s error branch calls `scanWhy(s.why)` without checking stamp ownership or age. Refutation attempted: only the scan’s INT path writes a cancellation stamp; top-up has no equivalent.
- **Fix:** Distinguish player cancellation from disable/termination, persist that outcome and current counts, and render it as the specified skipped/cancelled outcome. Reject stale stamps on error paths too.
- **Confidence:** high — signal choice, missing stamp, and failure rendering form a complete displayed path.

### F-RA-18: Disable deletes the restoration record before verifying restoration
- **Severity:** Medium
- **Category:** Correctness
- **Where:**  
  `projects/ROCKNIX/packages/network/raofflineproxy/sources/raofflineproxy-ctl:@@ -0,0 +1,1703 @@ (do_disable)`
- **What:** Disable removes `hardcore_was` before checking that restoring hardcore succeeded. It also proceeds with stopping and removing the marker before checking that the toggle cleared.
- **Failure scenario:** Inject a failed hardcore-setting write followed by a successful record deletion. Disable returns an error, but a second disable has no record from which to restore the player’s original setting.
- **Evidence:** `set_setting "${HARDCORE_KEY}" ...` is immediately followed by clearing `HARDCORE_WAS_KEY`; read-back validation happens afterward. Refutation attempted: enable has explicit staged rollback, but disable has no corresponding protection.
- **Fix:** Verify each state transition before consuming its recovery information. Preserve the restoration record on failure, and report/reconcile the actual resulting toggle and service state.
- **Confidence:** high — the failure ordering is explicit; the scenario is a write-failure injection, not a claimed device reproduction.

### F-RA-19: Refresh stops after three total failures, not three consecutive failures
- **Severity:** Medium
- **Category:** Correctness
- **Where:**  
  `projects/ROCKNIX/packages/network/raofflineproxy/sources/raofflineproxy-refresh:@@ -0,0 +1,230 @@ (main refresh loop)`
- **What:** The failure threshold uses the cumulative failure count while reporting “three failures in a row.”
- **Failure scenario:** Games 1, 3, and 5 fail while games 2 and 4 succeed. The helper stops before game 6 despite there never having been consecutive failures and time remaining in the budget.
- **Evidence:** Exceptions increment `failed`, then test `failed >= 3`; successful iterations never reset it. Refutation attempted: patch 005 has a separate resettable consecutive-failure counter, but this helper does not.
- **Fix:** Keep total failures for the final result and a separate consecutive-failure counter reset after each success.
- **Confidence:** high — the failing sequence follows directly from the loop.

### F-RA-20: DNS preflight does not bound the connection’s actual lookup
- **Severity:** Medium
- **Category:** Resource
- **Where:**  
  `projects/ROCKNIX/packages/network/raofflineproxy/patches/015-bounded-name-lookup.patch:@@ -251,7 +262,43 @@ (nested network.py hunk)`  
  `projects/ROCKNIX/packages/network/raofflineproxy/patches/015-bounded-name-lookup.patch:@@ -850,6 +851,23 @@ (nested proxy_service.py hunk)`
- **What:** The bounded resolver returns only success/failure and discards the resolved addresses. The following hostname-based HTTP operation still depends on another lookup; success of the preflight does not guarantee that lookup is cached or bounded.
- **Failure scenario:** The first lookup succeeds, then DNS stops responding before the HTTP connection resolves the hostname again. The request can still wait on the resolver beyond `LOOKUP_SECONDS`.
- **Evidence:** `socket.getaddrinfo(host, None)` becomes `result["ok"] = True`; no address is returned or passed to the HTTP transport. Refutation attempted: the added tests cover a failed/hanging first lookup, not a successful preflight followed by a hanging connection lookup.
- **Fix:** Make the actual connection consume bounded-resolution results while preserving Host/SNI and certificate verification, or enforce the deadline around the whole transport operation. Test the second-lookup and redirect cases.
- **Confidence:** high — the advertised guarantee relies on an unestablished resolver-cache assumption, not on the shown transport boundary.

### F-RA-21: Hash-library fetching still blocks the interface thread
- **Severity:** Medium
- **Category:** Resource
- **Where:**  
  `es-app/src/ThreadedHasher.cpp:@@ -39,16 +47,57 @@ (constructor fetch)`  
  `es-app/src/ThreadedHasher.cpp:@@ -231,9 +320,45 @@ (start constructs hasher)`  
  `es-app/src/RetroAchievements.cpp:@@ -500,6 +851,14 @@ (getCheevosHashes)`
- **What:** The network fetch happens during construction, before the threaded work and notification setup. Adding a stall timeout limits one form of freeze but does not move the work off the interface thread.
- **Failure scenario:** Updating game lists while a reused connection is dead leaves the UI unresponsive during the stall bound. A transfer that keeps making minimal progress can continue blocking because the total remains intentionally unbounded.
- **Evidence:** The constructor calls `RetroAchievements::getCheevosHashes()`, and `start()` constructs it synchronously. Refutation attempted: the worker threads are not the owners of this fetch. S6 explicitly documents this remaining problem and the separate follow-up; this is a residual risk, not a new regression caused by the timeout.
- **Fix:** Fetch the library asynchronously, then hand validated results to indexing with cancellation and lifetime handling. Do not perform the potentially long fetch in the UI-thread constructor.
- **Confidence:** high — the call placement and its documented interface-thread behavior agree.

### F-RA-22: Scan controls hardcode button letters
- **Severity:** Medium
- **Category:** Convention
- **Where:**  
  `es-app/src/guis/GuiOfflineScan.cpp:@@ -0,0 +1,352 @@ (input, getHelpPrompts, update)`
- **What:** The scan page hardcodes A for retry and A/B in its footer while using the configured back role elsewhere. These labels cannot remain accurate for all supported confirm/back assignments.
- **Failure scenario:** With swapped controls or a differently labelled controller, the footer names the wrong button for retry or close; retry also uses the literal `"a"` binding rather than the semantic confirmation role.
- **Evidence:** The code uses `isMappedTo("a", input)`, `HelpPrompt("a", ...)`, and `"A  TRY AGAIN     B  CLOSE"`. Refutation attempted: `BUTTON_BACK` is used for cancellation, but the other instructions are not derived from it or from the actual assignments. S7’s interaction rules explicitly forbid hardcoded “press A” instructions.
- **Fix:** Use semantic confirm/back bindings and render their current glyphs/help prompts instead of fixed controller letters.
- **Confidence:** high — the convention violation and fixed labels are explicit.

### F-RA-23: Ellipsis fitting cuts UTF-8 by bytes
- **Severity:** Medium
- **Category:** Player text
- **Where:**  
  `es-app/src/guis/GuiOfflineScan.cpp:@@ -0,0 +1,352 @@ (fitOneLine)`
- **What:** Text fitting removes individual bytes from translated strings and game names. It can pass malformed UTF-8 to font measurement and can leave a broken trailing character.
- **Failure scenario:** A long accented or Japanese game name needs truncation through a multibyte character. `pop_back()` removes a continuation byte, and the next measurement receives an incomplete code point.
- **Evidence:** The loop repeatedly calls `text.pop_back()` followed by `font->sizeText(text + "...")`. Refutation attempted: the stdout cleaner preserves UTF-8 bytes, but this later fitting step does not preserve code-point boundaries.
- **Fix:** Truncate on UTF-8 code-point boundaries, or use a Unicode-aware fitting routine. Test multibyte characters at the exact truncation boundary.
- **Confidence:** high — bytewise truncation of a multibyte encoding is directly visible; no particular font-decoder crash is asserted.

### F-RA-24: Installed CLI dependencies are not declared by the package
- **Severity:** Medium
- **Category:** Build/packaging
- **Where:**  
  `projects/ROCKNIX/packages/network/raofflineproxy/package.mk:@@ -0,0 +1,153 @@ (PKG_DEPENDS_TARGET)`  
  `projects/ROCKNIX/packages/network/raofflineproxy/sources/raofflineproxy-ctl:@@ -0,0 +1,1703 @@`
- **What:** The package declares Python and the two native source packages, but its installed control script also requires Bash and external service/locking/timeout utilities. Their providers are not explicitly declared.
- **Failure scenario:** None demonstrated in a built image; this is a packaging-convention finding. A base-image change can remove a required CLI without a dependency failure in this package.
- **Evidence:** Dependencies are `"toolchain Python3 raofflineproxy-rcheevos raofflineproxy-libchdr"`; the script requires `/bin/bash`, `systemctl`, `flock`, `timeout`, and other utilities. Refutation attempted: their presence may be guaranteed elsewhere today, but S4 expressly requires shipped scripts’ CLI providers to be declared by the owning package.
- **Fix:** Identify and declare the target packages providing those runtime tools, accounting for BusyBox-provided commands, then run package lint and target-image command checks.
- **Confidence:** high — the explicit declaration does not satisfy the supplied rule; actual image absence is not claimed.

### F-RA-25: The card coordinator releases its visible-send exclusion too early
- **Severity:** Medium
- **Category:** Concurrency
- **Where:**  
  `es-app/src/ProxyCards.cpp:@@ -0,0 +1,439 @@ (runSend, runTopUp screenFree, probe)`
- **What:** The send card clears `sSendRunning` five seconds before closing, while top-up attachment checks that flag rather than `sSendShowing`. The shown coordinator therefore permits another notification request while the send outcome is still open.
- **Failure scenario:** A top-up is waiting to attach when the send outcome appears. Its next poll sees `screenFree()` and calls the notification factory during the send card’s five-second display period.
- **Evidence:** `sSendRunning = false; sleep_for(5000ms); card->close();` is paired with `screenFree()` testing only `!sSendRunning`. Refutation attempted: `sSendShowing` is written but never used as a guard in this file.
- **Fix:** Separate “job running” from “surface visible” and use a shared visible-card ownership gate for attachment. Preserve the ability to launch a game once the network job has finished.
- **Confidence:** medium — the coordinator’s exclusion gap is certain; whether `Window` adds another serialization layer is outside the packet.

### F-RA-26: Service ordering does not establish listener readiness
- **Severity:** Medium
- **Category:** Concurrency
- **Where:**  
  `projects/ROCKNIX/packages/network/raofflineproxy/system.d/raofflineproxy.service:@@ -0,0 +1,32 @@`  
  `projects/ROCKNIX/packages/network/raofflineproxy/sources/raofflineproxy-ctl:@@ -0,0 +1,1703 @@ (do_enable)`
- **What:** The unit’s `Before=` ordering and successful `systemctl start` are treated as sufficient to make the proxy usable, but `Type=simple` does not signal that its socket is listening.
- **Failure scenario:** Python startup or storage initialization delays binding. Systemd allows EmulationStation to proceed, or enable sets the routing toggle, while port 8080 is still unavailable.
- **Evidence:** The unit uses `Type=simple`, with no readiness notification or post-start listener check. Enable writes the toggle after `systemctl start` returns. Refutation attempted: no readiness gate is shown in either path; the unit comment itself identifies refusal of the first achievement request as harmful.
- **Fix:** Add an actual readiness protocol or a bounded local readiness check, and make enable fail/roll back if the listener does not become ready.
- **Confidence:** medium — the missing guarantee is clear, but actual startup timing and the complete service entry point are outside the packet.

### F-RA-27: The automatic-upload opt-in accepts truthy non-booleans
- **Severity:** Medium
- **Category:** Security
- **Where:**  
  `projects/ROCKNIX/packages/network/raofflineproxy/patches/008-log-upload-opt-in.patch:@@ -324,6 +324,13 @@ (nested config.py hunk)`  
  `projects/ROCKNIX/packages/network/raofflineproxy/patches/008-log-upload-opt-in.patch:@@ -1171,6 +1172,14 @@ (nested proxy_service.py hunk)`
- **What:** The advertised requirement for `"upload_logs": true` is implemented as Python truthiness. Values such as the string `"false"` enable the guard.
- **Failure scenario:** Configuration contains `"upload_logs": "false"` and a reportable corruption incident reaches the retry path. The predicate returns true rather than preserving the default-off consent boundary.
- **Evidence:** The implementation is `bool((config_data or {}).get("upload_logs", False))`. Refutation attempted: the shown predicate does not enforce a JSON boolean; complete configuration validation is outside the packet. The patch also states that incident creation is currently unreachable on ROCKNIX’s SQLite backend.
- **Fix:** Require the value to be exactly `True`, or reject malformed configuration before it reaches the guard. Add false-string and numeric-value tests.
- **Confidence:** medium — the predicate counterexample is definite, but current-image incident reachability is explicitly limited.

### F-RA-28: Control-script documentation describes a different pin and refresh policy
- **Severity:** Low
- **Category:** Documentation
- **Where:**  
  `projects/ROCKNIX/packages/network/raofflineproxy/sources/raofflineproxy-ctl:@@ -0,0 +1,1703 @@ (schema header, do_refresh comment, summary exit contract)`  
  `projects/ROCKNIX/packages/network/raofflineproxy/package.mk:@@ -0,0 +1,153 @@`  
  `projects/ROCKNIX/packages/network/raofflineproxy/patches/005-keep-the-refresh-thread-alive.patch:@@ -1054,35 +1058,50 @@ (nested proxy_service.py hunk)`
- **What:** Several maintenance contracts are stale: the schema header names the previous package pin, the refresh comment promises a daily pass over every cached game, and the summary header advertises an unreadable-store exit code that the shell wrapper changes.
- **Failure scenario:** None demonstrated; a maintainer following these comments validates the wrong source revision or assumes unplayed games are automatically refreshed.
- **Evidence:** The header names `4e9bab48…`, while `PKG_VERSION` is `c1bd3724…`; the implemented refresh selection uses the seven-day played window. Summary’s Python exit 3 is converted by `cannot_tell` into exit 2. Refutation attempted: the newer refresh helper describes the played-window policy correctly, confirming the inconsistency.
- **Fix:** Update the documented contracts from the current implementation, and obtain current-pin schema evidence before describing compatibility as verified.
- **Confidence:** high — these are literal inconsistencies within the packet.

## Upstream fit

- **Split the submission along ownership boundaries.** The proxy patches, native hashing-library packaging, RetroArch response-header protocol, and EmulationStation integration belong to different upstream projects. The comments saying patches were “offered upstream” are not evidence of acceptance or of their status against the new pin.
- **Separate unrelated frontend work.** Web API-key provisioning, the progress-tracker option, completion-bar presentation, and broader account-enable behavior are mixed with offline-achievements integration in `RetroAchievements.cpp`, `GuiRetroAchievements.cpp`, and `GuiRetroAchievementsSettings.cpp`. Separate commits or pull requests would make their independent behavior and regressions reviewable.
- **Make protocols explicit and test their consumers together.** The control script’s stdout, `running`, `last-scan`, `last-flush`, SQLite reads, and response headers form public interfaces between packages. Several findings arise from incompatible interpretations of these interfaces, not isolated local mistakes.
- **Reduce fork-maintenance prose without removing rationale.** Installed sources contain extensive release-specific pin history, fork issue numbers, and private decision identifiers. Keep the failure rationale, but replace essential private references with self-contained explanations and public upstream references. F-RA-28 shows how historical commentary already misstates current behavior.
- **Do not infer licensing or approval from recipe assertions.** The recipes and scripts carry SPDX/copyright notices; the new ES translation units do not carry equivalent per-file notices. ES’s applicable header policy, upstream license texts, and evidence behind “Approved by RetroAchievements.org” are not embedded, so no licensing or approval verdict is made.
- **No embedded credential leak is established.** Patch authorship names and email addresses are not credentials, and `/storage`, `/usr`, and `/var/run` are product paths rather than developer checkout paths. Credential handling, log redaction, and backup exclusion still require the omitted integration sources.
- **Commit hygiene is only partly reviewable.** This is an aggregate diff, not the commit series. It does not establish whether protocol changes and their consumers land atomically, whether French translations accompany each frontend string, or whether individual commits build.

## Coverage boundary

### What this review establishes

The findings above come from the displayed branches, queries, state transitions, and protocol consumers—not issue closure, comments claiming a successful proof, or test names. The review follows the evidence and conformance requirements in **S2**, but is not a complete milestone acceptance audit.

The included tests cover several pure parsers, URL classification, index-selection rules, and initial DNS-preflight failures. Their presence is not evidence that they were run, nor that they cover the process, storage, and UI coordination paths identified above.

### Missing evidence to supply to the orchestrator

- **Complete pinned RAOfflineProxy sources:** storage/schema and account ownership, flusher terminal states, HTTP implementations, cache completeness, session reconstruction, configuration validation, and image-path validation. The patch hunks do not establish all those callees’ behavior.
- **Omitted integration implementations:** launch-time RetroArch and PPSSPP routing, boot reconciliation, backup exclusions, `CloudText` record parsers, `HttpReq`, `WebImageComponent`, notification factory/lifetimes, network-return hooks, and launch cancellation.
- **Current file-reader implementation:** S6 documents that `readAllText` mishandles files shorter than three bytes. `readyIds()` reads the proxy’s line-oriented export through it; explicitly test a valid export containing only `"1\n"`. The helper’s current body is outside this packet, so this remains a targeted verification gap rather than a confirmed additional defect.
- **Build and runtime evidence:** package lint, patch application against the exact pins, native hashing-library builds, runtime CLI availability, service readiness, process-tree termination, and tests using the image’s actual BusyBox/systemd environment.
- **Upgrade and clean-install evidence required by S3:** retained partial caches, existing damaged images, missing markers, restored settings, account changes with pending awards, interrupted maintenance, and a fresh device without generated directories or exports.
- **French catalog and screen evidence:** the frontend `.po` changes and 640×480 captures are not embedded. Translation completeness, text fit, and actual notification overlap cannot be certified from these hunks.
- **Additional governing material:** the authoritative `packages/README.md`, the blindspot register required by S2, and the referenced `es-native-ui.md`, `player-language.md`, and `least-surprise.md` were not embedded. Their conformance has not been silently treated as passed.

### `corpus.provenance.json`

The following is the content to record; no file was created or independently re-hashed. Arrays are aligned in **S1–S7** order.

```json
{
  "review_mode": "Static review of the inline embedded corpus",
  "filesystem_access": false,
  "independent_file_reads_or_hashing": false,
  "hash_verification": "Verified by the Council Facilitator at embed time; hashes copied from the supplied source headers",
  "manifest_read_timestamp_utc": "2026-09-27T22:58:44Z",
  "source_ids": [
    "S1",
    "S2",
    "S3",
    "S4",
    "S5",
    "S6",
    "S7"
  ],
  "source_file_paths": [
    "/workspace/repos/rocknix/docs/audits/2026_09_25-milestone-rc-round-since-258/seats/1-raoffline.diff",
    "/workspace/repos/rocknix/.claude/skills/code-auditor/references/anti-patterns.md",
    "/workspace/repos/rocknix/.claude/rules/upgrade-and-install.md",
    "/workspace/repos/rocknix/.claude/rules/packaging-and-patches.md",
    "/workspace/repos/rocknix/.claude/rules/es-player-text.md",
    "/workspace/repos/rocknix/.claude/rules/es-code-traps.md",
    "/workspace/repos/rocknix/.claude/rules/es-ui-style-guide.md"
  ],
  "source_file_hashes": [
    "66eadbb33f7a42c23ae1cf483eda49123a5f5811fbf434d3c7b9754becfaee2c",
    "fd825c0505ae772ca2a6651eefe642581aaa147c254fed8cf50db1f8f1bde678",
    "de4a683f9a36f9100e6fd98be11ad84d736f370374c40f74c445a2b81eca1995",
    "2a44db10f4f179198b9366239eabe0900e1701145beced181536eb18bcbc0746",
    "97c0816eabd3088ce94e3d45dec8042c1796afa3c295a9a8d080597ece817145",
    "9d5d6995714c9a1287c84f0c02a92de244271a4bdad8e53d29bb61115ba51d0f",
    "150d0ac637626d771871eab48db995d8fc46c69ed7cf786240213649d264ad02"
  ],
  "missing_sources": [
    "Complete upstream RAOfflineProxy sources at the pinned commit, including storage, flusher, HTTP, authentication, configuration, and cache implementations",
    "Complete omitted ROCKNIX and EmulationStation integration implementations identified in the coverage boundary",
    "Build logs, executed test results, target runtime evidence, and clean-install/upgrade rehearsal evidence",
    "French translation catalog changes and device-resolution UI captures",
    "Authoritative packages/README.md and applicable upstream license/header policies",
    "Blindspot register and referenced governing rules not embedded in this packet",
    "Commit series and upstream approval or patch-acceptance evidence"
  ],
  "missing_source_paths_or_hashes_fabricated": false,
  "gaps_surfaced_to_orchestrator": true
}
```