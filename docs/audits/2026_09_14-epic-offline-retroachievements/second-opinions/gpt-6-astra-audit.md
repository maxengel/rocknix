> Copied verbatim from the Facilitator scratchpad (`/workspace/tmp/rocknix-session/audit-163/gpt-6-astra-audit.md`); provenance beside it. The brief it answered is `gpt-brief.md` in the same scratchpad (323 KB: the orchestrator's findings, the seven questions, and the primary excerpts from both trees and the client), sha256 of the prompt in the provenance.

The blanket PASS on fail-closed behavior does not stand. I retain **F-19 as High** for unbudgeted whole-library refreshes and **F-20 as High for the retention/readiness inconsistency**, while withholding its specific RetroArch failure claim pending the omitted handler code. More immediate problems were missed: incomplete caches suppress repair, ordinary per-game failures report completion, and account/hash identity is lost when deciding what is cached. The cost estimates also overstate some timings. No active third-party credential upload is demonstrated by this packet. RC-6 needs correctness fixes and fault-injection coverage before sign-off; the reported mechanical passes do not establish these properties.

## Where I disagree

- **F-02 — Neither active exfiltration nor absolute unreachability is established.** `storage.py:38–53` selects SQLite when available, contradicting §3.10’s power-cut → JSON-quarantine → upload narrative. However, the incident-recording and retry-gating functions cited in the finding are absent. **Low**, as dependency/privacy hardening; not a demonstrated upload incident or release-blocking credential leak.

- **F-03 — “The next is 30 minutes away” understates the failure.** `ctl:976–994` suppresses subsequent attempts but schedules none. `NetworkThread.cpp:207–222` calls top-up on a connectivity event. With no further event or after-index run, caching does not resume automatically after 30 minutes. Also, the ten seconds are **sleep time**, excluding three probes’ durations. **Medium** retained.

- **F-08 — The inconsistent state need not disappear at boot.** If writing `hardcore_was` fails but the subsequent writes succeed, `ctl:294–303` leaves the toggle at `1` despite returning failure. Boot reconciliation then keeps the service enabled. `enable` also proceeds when `systemctl` is missing. **Medium**, increased from Low: this is a persistent control-state inconsistency, not merely a temporary orphan service.

- **F-09 — This is permanent prefix starvation, not just one truncated pass.** The walk stops at 5,000 entries **before** removing cached paths (`ctl:776–784`). Repeating the scan walks the same prefix; it never advances to entry 5,001. **Medium**, increased from Low.

- **F-10 — A clean install does not necessarily remain unindexed.** The settings save starts `ThreadedHasher` when the RetroAchievements master switch changes to on (`GuiRetroAchievementsSettings.cpp:452–533`, final block), independently of the startup-index preference. The unconditional promise about **later additions** remains wrong. **Medium** retained, with the clean-install claim narrowed.

- **F-15 — `exec.log` is bundled.** `rocknix-evidence:166–178` explicitly takes it, and `001-functions:56–88` does not mask `cheevos_username`. The orchestrator’s own §3.10 correctly acknowledges this, unlike its finding table. **Low**: an unmasked public identifier, not a demonstrated secret disclosure.

- **F-16 / F-19 — The cost arithmetic is not the execution model.** Image downloads run concurrently with metadata fetching (`rom_cache.py:174–182`; `image_cache.py:1–15, 150–215`); adding their entire duration to API time overstates elapsed time. `PeriodicRefresh.run` waits another hour **after** finishing its pass (`proxy_service.py:1021–1057`). A ten-minute pass therefore repeats roughly every 70 minutes: about **41,000 API GETs/day**, not 48,000, in steady-state successful operation. **F-16 Medium; F-19 High** retained. The refresh volume remains unacceptable without a budget.

- **F-18 — The selection hole is proven; the blanket RC-5 migration outcome is not.** `ThreadedHasher.cpp:234` skips hash-bearing entries, but the packet lacks RC-5 recovery fixtures and the gamelist/recovery loader. The comments also distinguish recovery metadata from IDs subsequently saved at clean exit. **Medium** for the hash-only selection gap; do not classify every RC-5 reboot as affected.

- **F-20 — The endpoint-specific conclusion exceeds the excerpt.** Eviction and the retained cached-ID classification are explicit. The supplied `achievementsets` handler ends midway through its fallback branch, so “no rebuild anywhere” and the precise RetroArch 1.22 session failure require its tail and a client trace. **High** stands for deleting offline-response data while continuing to advertise its game as cached.

- **F-11 / F-14 / F-21 — Repository-wide negatives are not independently verified here.** There are no frame artifacts/listing, docs-tree search results, recipe, or test CMakeLists in the primary packet. Keep their review priorities at **Medium / Medium / Low**, respectively, but do not count their claimed absence or mismatch as newly verified defects. Likewise, F-13’s milestone claims need the omitted issue JSON.

## Where I agree

- **F-01 — Medium:** competing, non-atomic writers invalidate the service-owned reachability signal.
- **F-02 — Low only:** upload capability exists; automatic execution is not demonstrated.
- **F-03 — Medium:** a failed initial probe consumes the long suppression interval.
- **F-04 — Medium:** the supplied case p leaves scan/top-up/readiness behavior untested.
- **F-05 — Low:** cleanup leaves derived credentials; PPSSPP’s token file is another residue, not just the proxy directory.
- **F-06 — Low:** the host curl argument exposes the web key to process inspection.
- **F-07 — Low:** the old cap constant and message are stale.
- **F-08 — Medium ↑:** failed state changes are not rolled back consistently.
- **F-09 — Medium ↑:** the fixed walk prefix prevents eventual full-library coverage.
- **F-10 — Medium:** the promise about newly added games exceeds automatic coverage.
- **F-12 — Low:** the register contradicts the current wording/title decisions.
- **F-13 — Low:** acceptance-text drift is visible; superseded requirements need reconciliation, not speculative “award lost” messages.
- **F-15 — Low:** account identifiers remain unmasked, including in collected `exec.log`.
- **F-16 — Medium:** the running page rejects navigation; destruction waits for its worker.
- **F-17 — Medium:** there is no library-wide failure budget; normal retrieval costs two requests, or three with the hash fallback.
- **F-18 — Medium:** hash-only metadata needs lookup-only repair when the hash library is available.
- **F-19 — High:** lifting the library cap exposes unbounded standing refresh work.
- **F-20 — High:** cache retention and advertised readiness disagree.
- **F-22 — Low:** direct schema coupling needs compatibility tests; the full commit pin limits present-day drift.

## What was missed

All probes below are proposed local fixture/mock tests, not executed tests.

### G-01 — Partial caches suppress repair — **High**
**Files:** `raofflineproxy-ctl:699, 737–747`; `es_export.py:22–39`; `rom_cache.py:439–474`.

A committed patch row is sufficient to classify a game as cached even when its unlocks or achievementsets are missing. Every subsequent indexed scan/top-up skips that game. `cache_game` fills these components separately, but eligibility has no completion predicate.

**Fix:** Publish explicit completeness for the required account/hash responses; fetch outside a database transaction, then commit the completed bundle and readiness state together.

**Probe:** Seed only a patch row for an indexed game. Verify that today’s selector omits it despite absent achievementsets. Separately inject failures between writes to establish the omitted `upsert_cache` implementation’s commit boundaries.

### G-02 — Cache reuse loses account and ROM-hash identity — **Medium**
**Files:** `raofflineproxy-ctl:699, 737–747`; `raofflineproxy-cache-indexed:72–95`; `auth.py:39–69`.

Cached IDs are collected across accounts and hashes. An existing game ID suppresses work for another account or a newly added alternate ROM hash, although the required responses are keyed by user/hash. Separately, credential resolution accepts cached credentials before trying the configured password, without checking their username against the intended account.

**Fix:** Scope readiness to the current account and required hash aliases; require an expected username when resolving cached credentials. Reuse shared metadata without skipping missing identities.

**Probe:** Cache account A/hash X, then select account B or add hash Y for the same ID. Verify required rows are created. Test password-only B with cached credentials for A.

### G-03 — Failed games still produce “COMPLETED” — **Medium**
**Files:** `raofflineproxy-cache-indexed:147–179`; `raofflineproxy-ctl:863–872, 942–956, 1013–1019`.

The helper returns zero despite failures. The ctl fails the run only after three consecutive errors, a recognized refusal, or a nonzero helper exit. One or two transport failures—or failures separated by successes—therefore yield a successful stamp and page outcome.

**Fix:** Distinguish legitimate unmatched-ROM skips from caching errors. Any unresolved caching error must produce an incomplete outcome, even when processing continues.

**Probe:** One indexed job emits a timeout failure and the helper exits normally. Assert nonzero scan status and “COULDN’T FINISH”; today it reports completion.

### G-04 — One refresh error kills the refresh thread — **Medium**
**Files:** `proxy_service.py:1021–1057`; `rom_cache.py:158–169`.

`refresh_game_patch` raises on network/API failures. `PeriodicRefresh.run` has no exception boundary, so one failed request terminates the thread while the main service remains running. `Restart=on-failure` does not supervise this worker.

**Fix:** Catch failures at the pass/game boundary, preserve the worker, and apply bounded backoff. An authentication failure should stop the pass, not provoke requests for every remaining game.

**Probe:** Make the first patch request raise an HTTP error; restore the mock server and verify a later scheduled pass still runs.

### G-05 — Broken settings reads pass launcher guards — **Medium**
**Files:** `setsettings.sh:511–524`; `cheevos_ppsspp.sh:21–40, 49–56`.

RetroArch’s guard treats every hardcore value other than `1`, including a failed empty read, as permission to route through the casual-only proxy. PPSSPP similarly maps unknown hardcore values to false. Its unquoted master-switch test also lets an empty `enabled` value fall through when a token remains.

**Fix:** Read flags once, preserve lookup success/failure, and normalize only documented successful defaults. Unknown effective hardcore must not authorize proxy routing.

**Probe:** Fail the hardcore lookup while the toggle and listener are present. Separately remove PPSSPP’s master setting but retain its token; verify achievements are not enabled.

### G-06 — Unknown cache data becomes valid empty progress — **Medium**
**Files:** `raofflineproxy-ctl:418–424`; `RetroAchievements.cpp:325–339, 395–447`; `OfflineAchievementsText.h` (`parseUnlocks` contract).

Missing score fields become zero. The unlock parser’s contract maps malformed replies to an empty list, which its caller accepts as “nothing unlocked.” The summary also sets `Username`/`FromDevice` even after every game lookup fails, so its caller accepts an empty summary rather than reporting failure.

**Fix:** Carry explicit validity separately from empty results. Require the relevant response shape and score fields before publishing progress.

**Probe:** Test a login row without scores, malformed HTTP-200 unlocks, and a proxy that fails every summary lookup. None should become authoritative zero progress.

### G-07 — Toggle operations block the UI thread — **Medium**
**Files:** `GuiRetroAchievementsSettings.cpp:282–306`; `raofflineproxy-ctl:267–274`; `raofflineproxy.service` (`TimeoutStopSec=15`).

The switch callback synchronously executes the ctl and waits for `systemctl`. A stalled stop blocks the event loop; moving scans off-thread does not satisfy “UI thread never blocked.”

**Fix:** Run toggle transitions asynchronously, disable repeated activation while pending, and update the rows from the resulting persisted state.

**Probe:** Make the systemctl shim delay its stop response. Confirm navigation/render updates continue throughout the transition.

### G-08 — The top-up’s whole-job timeout is not enforced — **Medium**
**Files:** `raofflineproxy-ctl:545–555, 997–1029`.

Listing is untimed. The indexed helper then receives a fresh 900 seconds rather than the remaining budget. Only the recent-history pass uses elapsed time. After-index lock waiting adds another possible 900 seconds.

**Fix:** Define separate admission/execution budgets and enforce an absolute deadline across listing and both passes, with cancellation of child work.

**Probe:** Delay listing by two minutes, then run a helper for its full allowance. Today execution exceeds the advertised fifteen-minute bound.

### G-09 — Flush-stamp consumption is not atomic — **Low**
**Files:** `raofflineproxy-ctl:440–449`; `003-flush-stamp.patch` (`write_flush_stamp`).

Reading and then unlinking races with both another reader and the producer. Two readers can report the same stamp; a producer replacement between `head` and `rm` is deleted without being consumed.

**Fix:** Atomically rename the stamp to a unique consumer-owned filename, then validate and remove that file. Check consumption failures.

**Probe:** Pause a reader after `head`, publish another stamp, then resume. Also start two readers against one stamp.

### G-10 — The credential filter misses supported secret shapes — **Medium**
**File:** `001-functions:56–88`.

`global.retroachievements.key=...` matches neither the credential word list nor the URL rules. Single-quoted assignment values such as `password='...'` also survive the assignment filters. These are sanitizer defects; the packet does not show a current production writer logging the web-key assignment.

**Fix:** Recognize the canonical RA web-key setting and correctly handle supported quoting forms. Apply the same protection to helper-error logging rather than trusting exception text.

**Probe:** Put canary assignments of both forms into the evidence fixture’s `exec.log`; require their values to disappear from the resulting archive.

### G-11 — Disabling the feature does not stop active cache jobs — **Medium**
**Files:** `raofflineproxy-ctl:310–333, 825–829, 969–970`; `raofflineproxy-cache-indexed:135–175`.

Disable stops the proxy unit, not the helper processes launched by EmulationStation. Eligibility is checked only before a run; an active top-up continues issuing requests and writing the cache after the toggle becomes off.

**Fix:** Give background jobs an owned lifetime and cooperative cancellation. Quiesce these workers before QA credential/cache removal; preserve queued awards during normal feature disable.

**Probe:** Start a deliberately slow top-up, disable the feature, and count subsequent helper requests/writes.

### G-12 — Image writers share temporary paths without coordination — **Low**
**File:** `image_cache.py:150–195`.

Concurrent downloads of the same missing asset pass `target.exists()` independently and use the same `.tmp` file. They issue duplicate requests and interfere with each other’s rename/cleanup. The helper and service also have separate worker pools.

**Fix:** Use unique temporary files plus per-asset in-flight deduplication; coordinate across processes where necessary.

**Probe:** Barrier two downloads after their existence checks. Exercise both successful completion and one writer’s failure cleanup.

## The maintainer's seven questions

1. **Credentials.** The shown ES loopback requests carry only `u=`, and the new stamps contain numbers/tokens naming outcomes, not credentials. Normal launcher password assignments are filtered. That is not an end-to-end “no secret escapes” proof: G-10 exposes sanitizer gaps, helper exception strings are logged raw, and upstream redaction implementations are incomplete here. Account names enter evidence bundles. QA cleanup must cover the proxy cache **and** PPSSPP’s token file, after quiescing credential-bearing processes. F-02 does not establish automatic exfiltration.

2. **Fail-closed.** **No blanket pass.** Unreadable pending-award databases return an explicit unknown, which is good. Missing/malformed online state does not falsely establish offline reachability. But G-03, G-05 and G-06 convert failures into successful eligibility or valid-looking results. `netstat` proves a listener exists, not that the intended proxy answers requests. `Type=simple` ordering likewise does not establish application readiness. Stamp-write errors remain unchecked as the orchestrator noted.

3. **Upgrade / clean install.** Marker reconciliation from the exact `1` setting is sound in the shown code. The proxy directory survives in-place updates; the supplied backup excerpt establishes the intended exclusion, not the complete restore path. Hash-only entries need lookup-only repair, including hashes previously associated with no set. Enabling the RA master switch provides an initial indexing path, but startup indexing remains off by default. PPSSPP only rewrites its host when execution reaches the update block: its early refusals invalidate “rewritten on every launch.” Actual RC-4/RC-5 migration needs fixtures from those images.

4. **Concurrency.** The ctl’s flock serializes scan/top-up and their `last-scan` writes; it does **not** serialize the service, game requests, flusher, or toggle operations. SQLite supplies database locking with WAL and a five-second busy timeout; the per-instance Python `RLock` is not a cross-process lock. No SQLite corruption is established, but cache-level completeness is not equivalent to transaction safety. After-index admission expires after fifteen minutes even behind a longer manual scan, with no guaranteed later retry. G-08/G-09/G-11/G-12 cover remaining lifetime and file races. The scan animates off-thread but traps navigation; the toggle blocks the UI itself.

5. **Wording — EN/FR.** The shown **scan / sent / synced** distinctions are correct, as are the complete scan-confirmation sentences and quoted `'!RA!'`. The main semantic failures are “every game,” “every game was already ready,” and unconditional new-game coverage. Five sentence-case msgids remain; the packet does not provide a rule exempting them from the requested uppercase convention. French `Enregistre aussi leurs succès…` drops **achievement data**: prefer wording explicitly naming *les données de succès*. Verify *mode facile/difficile* against the existing French Hardcore terminology, rather than treating translation presence as semantic approval. No size/language fit is established without frames; the explanatory block is explicitly requested by D-UI-054, so its mere length is not a two-line-rule defect.

6. **Cost for N games.**
   - **Fresh indexed jobs:** nominally `3N` API GETs, plus authentication, probe and retry overhead.
   - **Unindexed candidates:** `K + 3M`, where `M` candidates match and `K` is their total hash-lookup request count. A single successful hash lookup gives four GETs per matched game; failures/unmatched ROMs do not all cost four. The full hash-candidate loop is omitted.
   - **Top-up:** zero probes when suppressed; otherwise up to three probes, then `3J` for missing indexed jobs plus the recent-history pass. Its complete candidate filtering is absent, so “near zero once cached” is not independently proven.
   - Using the declared throttle, the nominal metadata/pause floor is approximately `0.9N + 30⌊(N−1)/50⌋` seconds indexed, or `1.2N + 30⌊(N−1)/50⌋` with one lookup per matched ROM. At 1,000 games: **24.5 or 29.5 minutes**, excluding hashing/network latency.
   - At 30 achievements/game, distinct uncached assets are roughly 61,000. The packet’s hypothetical 150 ms/image and four workers imply about **38 minutes of media work**, overlapping metadata work—not a measured 1–1.5-hour scan. Its 4 KB/image assumption implies roughly **244 MB**, plus unmeasured database overhead. Duplicate downloads add cost.
   - Standing refresh remains **2N GETs per completed pass**, on a work-duration-plus-hour cadence. HEAD probing is nominally about 5,760/day, excluding probe/flush time and additional probes.

7. **Enhancements, ranked.**
   1. **Budget refresh work:** age-based eligibility, bounded slices, jitter, resilient retries; agree an acceptable request budget upstream.
   2. **Make readiness truthful and durable:** account/hash completeness, atomic publication, repair of partial/expired data; do not solve retention by blindly adding more hourly requests.
   3. **Fix false-success paths and add fault-injection tests:** partial fills, isolated failures, invalid replies, account changes.
   4. **Unify background-job ownership:** cancellation, genuine deadlines, responsive toggles and leaveable scans.
   5. **Give reachability one atomic writer:** use a side-effect-free ctl probe and schedule bounded reconnect retries.
   6. **Repair indexing and library coverage:** lookup-only migration, resumable unindexed traversal, conditional automatic-caching wording.
   7. **Replace 2–3N summary requests:** bounded/bulk metadata retrieval with explicit validity and a library-wide failure budget.
   8. **Close credential/tooling gaps, then verify presentation/docs:** canary tests, complete QA cleanup, EN/FR frames and reconciled acceptance criteria.

## Evidence boundary

No commands, builds, device interactions, network calls, or probes were performed. Reported mechanical results are not independently reproduced.

Important missing evidence includes complete SQLite mutation/export code, the offline `achievementsets` handler tail, upstream request/redaction helpers, corruption-report gating, flusher/account ownership logic, migration fixtures/loaders, and the claimed docs/frame/CMake artifacts. Thus the cache-selection and eviction defects are established separately from a complete emulator award-loss reproduction.

The repeated bare `ppp`/`nip` tails and truncated functions also make these pasted “whole” files unsuitable as literal build evidence. If literal, the C++ tails contradict the claimed syntax checks; original files are needed before treating them as a shipped defect.