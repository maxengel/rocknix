# Retrospective Audit — Epic #163 "Offline RetroAchievements"

**Auditor:** Code Auditor skill v1.10.0, Epic tier, one orchestrator, serial
**Date:** 2026-09-14
**Subject:** the epic at distribution `cee1656c33` / EmulationStation `ec2de8ae7`
**Spec:** as 01/02
**Model:** Claude Fable 5.1, xhigh

Findings are numbered F-01… across 02, 03 and 04; the punch list maps them to PL items.

---

## Running Notes

### 3.1 Architectural coherence

The epic is one design carried through consistently: the OS owns launch-time emulator configuration (`setsettings.sh`, `cheevos_ppsspp.sh` write the host per launch and never into a file that travels), the proxy is a systemd unit gated by the same marker shape as sshd/avahi and re-derived at boot from `system.cfg`, the ctl is the one backend every surface drives (the page, the cards, the pages, the hooks), pure text lives in `CloudText`/`OfflineAchievementsText` with tests, and the proxy's own files (`online_state.json`, `cached_game_ids.txt`, `last-flush`, `last-scan`) are the contract between processes rather than a second cache. The fork's four patches are small, header-documented and offered upstream (D-RA-016).

Where the whole does not cohere:

- **F-01 — two writers on one state file.** `raofflineproxy-ctl is_online` runs the client's `probe-online`, which writes `online_state.json` (`main.py:541-542`) — the same file the service's `ConnectivityMonitor` owns and the interface reads as "the proxy's own reachability" (D-RA-011, `OfflineAchievements.cpp:130-140`). The monitor writes only on a *transition* (`proxy_service.py:1000-1001`), so a probe from the ctl that lands during a DNS lag writes `false` and nothing corrects it until the service's own state next changes. The interface then shows `YOU'RE NOT ONLINE. SHOWING WHAT'S SAVED ON THIS DEVICE.` on a device that is online, and `GuiMenu`'s two gates skip the connectivity check. `save_json_file` is also not atomic (`state.py:62-67`: `open("w")` + `json.dump`), so a reader can see an empty file — both readers fail closed on that (unknown → web / offline → refuse), which is the right side. **Fix:** the ctl must not write the service's file — probe into a file of its own (`RAOFFLINEPROXY_CONFIG_DIR` is env-settable per process, or a `--state-file` flag upstream), or ask the running service over the loopback (`/probe` is not an endpoint today; `online_state.json`'s mtime is the poor man's check). Severity **High**: it inverts D-RA-011's source rule on the exact event (a connect) the design cares about.
- **F-10 — the cache "follows the index" only where an index exists, and nothing makes one exist.** `CheevosCheckIndexesAtStart` defaults `false` (`Settings.cpp:405`); `topup` in mode `indexed` writes I-jobs only (`ctl:750`, `:1006`), so a device whose player never turned INDEX NEW GAMES AT STARTUP on, never pressed INDEX GAMES, and never scanned gets **no** automatic caching beyond the client's recently-played pass — and the page says `NEW GAMES ARE ADDED THE NEXT TIME YOU'RE CONNECTED.` unconditionally (`GuiRetroAchievementsSettings.cpp:271`). #183 adds that on the VM the startup index did not run even when on. **Fix:** turning the toggle on offers (or sets) INDEX NEW GAMES AT STARTUP, or the sentence is shown only while that setting is on; #183 box 1 becomes load-bearing for D-RA-013. Severity **Medium**.
- **F-16 — the fourth tier, applied to a job that can run for hours.** `GuiOfflineScan::input` refuses every press until the ctl exits (`:125-153`); there is no cancel and no "keep going in the background", and `~GuiOfflineScan` joins the worker (`:94-102`), so quitting the interface waits on the scan too. es-native-ui's tier table was written for "a job measured in minutes"; § 3.8 puts a 1,000-game first scan at one to two hours. The same work runs unattended and bounded as `topup` (15 min per connect, `ctl:201`). **Fix:** B while running = leave it running in the background (the ctl is resumable: uncached paths only) with the row's line reporting; or an explicit cap per press with "the rest continues when you're connected". Severity **Medium**.

Dead or stale: `CACHE_CAP=100` (`ctl:192`, written into `scan.log` at `:850` as "the proxy's cap of 100 games") and `_("THE LIMIT OF 100 GAMES WAS REACHED.")` (`GuiOfflineScan.cpp:281`, with its French) are unreachable after patch 004 and name a number the product no longer has — **F-07**, Low.

### 3.2 Project conformance

#### Instruction files (read from `next`)

| Rule | Relevance | Finding |
| --- | --- | --- |
| `packaging-and-patches.md` | ✓ | Full-hash pin, SHA256, licence, late binding inside functions; `PKG_DEPENDS_TARGET` names Python3 (the interpreter the ctl/helper need); patches apply after unpack and each carries an upstream-ready header. pkgcheck ×3 clean. |
| `engineering-practices.md` § Guards must fail closed | ⚠ | Every fork guard read falls to the safe side (§ 3.9). The exception is the **probe that writes** (F-01): fail-closed for the reader, wrong for the writer. |
| § Verify the artifact | ✓ | The ctl reads back every setting it writes; `qa-accounts` reports what the guest holds. The tick on AC-179-1 over-reads one clause (the unlock half). |
| § Before deleting a duplicate | ✓ | Patch 004 removed the cap and kept the throttle — and did **not** inventory what else the cap protected: the hourly `PeriodicRefresh` (§ 3.8, F-19). The cap's *behaviour* (bounding the refresh) was deleted with its *purpose* (bounding the scan). |
| § Never reboot without asking; VM first | ✓ | The epic's proofs are VM-first; the RG SP round was the maintainer's own. |
| `upgrade-and-install.md` | ⚠ | § 3.7: two upgrade gaps (F-18 the hash-no-id recovery files from RC-5; the 60-day eviction F-20), one clean-install gap (F-10). |
| `es-native-ui.md` (tiers; images tinted; `exists()` cache) | ⚠ | Fourth tier chosen rightly and then overrun (F-16); `DimmableMenuEntry` applies the tint rule correctly; `exists(…, false)` used for every file another process writes (`OfflineAchievements.cpp:104`, `:113`, `:134`). |
| `es-ui-style-guide.md` (dim don't hide; YES first; addSaveFunc; gating) | ✓ | The scan row dims with its reason; SCAN NOW / LATER and YES / NO put the safe answer last; the toggle deliberately bypasses `addSaveFunc` because the script is the writer (documented at `:237-244`); no network round trip at page build. Footer `A  TRY AGAIN     B  CLOSE` hardcodes letters — the precedent `GuiCloudTransfer` set (D-UI-028), not new. |
| `es-player-text.md` / `player-language.md` | ✓ | § 3.6: scan not sync; sent not synced; UPPERCASE `_()` with sentence-case descriptions on the RA settings page (its dialect); Wi-Fi never appears in the epic's strings; every string has French. |
| `es-code-traps.md` | ✓ | ASCII comments (grep clean); `BusyComponent(window, "")`; pure text in `CloudText`/`OfflineAchievementsText` with tests. Rule drift: the unit-test recipe omits `-DRAPIDJSON_INCLUDE_DIR`, which the CMakeLists requires (F-21, Low). |
| `generic-x64-vm-testing.md` | ✓ | Guest reads through the filter; 640x480 frames for RC-5; the `ra-offline` suite opt-in with its spend warning. |
| `handheld-evidence.md` | ✓ | `rocknix-evidence` takes no proxy log; every taken file through `redact_credentials`. |
| `documentation-accuracy.md` | ✗ | No rocknix.org page prepared (AC-168-1, F-14). Binds the upstream PR (phase 5), so not an RC-6 blocker — but five RCs in. |
| `decision-register.md` / `issue-tracking.md` | ⚠ | Rows written the same session throughout; three body/register drifts (F-12, F-13) and a numbering hole (no D-RA-015). |
| `fork-workflow.md` | ✓ | Nothing personal in the feature paths; the two trees' branches are `feature/*`. |
| `adversarial-council.md` | ✓ | The second opinion goes to the Facilitator's GPT seat (Phase 4). |

#### Blindspot register — does this work repeat any?

| # | Repeats? | Where |
| --- | --- | --- |
| 6 consumed one-shot marker | no | `last-flush` is removed by its reader before judging (`ctl:440-452`); `last-scan` is not one-shot. |
| 8 synthetic fixtures | partly | Case p's sqlite fixture uses the proxy's own DDL — good; **no fixture exists at all for scan/topup** (F-04). |
| 10 fix forward only | **yes** | `ec2de8ae7` saves the id with the hash from now on; RC-5's recovery files with a hash and no id are skipped by the startup index (`ThreadedHasher.cpp:234`: hash present → skip) and never gain an id until a forced INDEX GAMES (F-18). |
| 13 assumed-done | partly | AC-165-4 and AC-166-1 ticked on frames that do not cover the language or the page they now claim; AC-179-1 ticked one clause past its evidence. |
| 14/26 guard absent = guard silent | no | `rocknix-evidence` refuses without the filter; the ctl's `cannot_tell` prints nothing rather than a number. |
| 16 a runtime CLI no package declares | no | `python3` is declared; the rest are busybox applets. |
| 22 a probe that cannot report absence | no | `is_online` needs a readable `"online": true`. |
| 23 deleting a duplicate | **yes, in shape** | Patch 004 deleted the cap without diffing what else it bounded (the hourly refresh) — F-19. |
| 27 supersession only in comments | **yes** | #173 AC3, #179 AC2, #163's three boxes (F-13). |
| 34 host tools vs busybox | no | Case p/q/r/s run under the image's busybox; the ctl's applets are busybox's (`flock -n`, `timeout`, `stat -c`, `mkfifo` all present). |
| 36 one backend mistaken for the contract | partly | Everything is proven against RA's real API (the QA account), so no; but a 1,000-game library was never exercised (§ 3.8 is arithmetic). |
| 43 a safety claim in a header, untested | **yes** | `rocknix-evidence`'s header now says the bundle is filtered, and the harness proves it; the ctl's header says "nothing here prints a value from system.cfg", true by reading; the *proxy's* header-level promise "redacts the token in what it logs" is true for `t=`/`p=` and false for `u=` (F-15) — and the design note's § 9 warns of the automatic log upload, which nothing in the fork gates (F-02). |

#### Project invariants

- **Preserve player progress above all.** The queue is the proxy's, on disk, hash-chained; the fork adds only the stamp. A `disable` leaves the store (and a pending queue) in place — a queued award survives the toggle being turned off and is sent when it is turned on again. ✓
- **Backups never contain secrets.** The proxy folder is held back whole on backup and on both restore shapes; `ppsspp_retroachievements.dat` and `global.retroachievements.token` are held back (#169). ✓ (harness k, this session).
- **Every change lands on devices with state.** § 3.7.

### 3.3 Spec fidelity

Aligned: D-RA-001..014 and 016 as read in 02. Diverged, each with the register or a comment on the other side:

- D-RA-004's provisional wording ("SYNCED") → shipped as "SENT" on the maintainer's later call; the row still reads provisional (F-12b).
- D-UI-053 "the page title stays without it" vs D-UI-054/#184 note 2 "(BETA) in the page title" → the code follows note 2 (F-12a).
- #173 AC3 (say the award was lost with the proxy off) → not built, by D-RA-004's shape; the comment of 03:04 says "decide"; nobody has (F-13).
- #179 AC2 "never exceeds the cap" → D-RA-014 removed the cap (F-13).
- #166 AC1 "frames … in both languages" → English only for the two cards (F-11c).

### 3.4 Platform architecture conformance

| Check | Relevance | Finding |
| --- | --- | --- |
| Reference implementation | · | n/a — no tenant model |
| Schema-before-code | ⚠ | The ctl's `>>>` protocol and the `last-scan` line are specified in the ctl's header and read by a tested parser — good. The proxy's sqlite schema is upstream's; the ctl reads it directly (`pending_awards`, `api_cache`) with no version check — a schema change upstream breaks `pending`/`account` into `cannot_tell` (fail-closed, but silent to the player). Low, noted in F-22. |
| Dogfooding gate | ✓ | RC-5 on the RG SP; the notes came back. |
| API-first | · | n/a |

### 3.5 Cross-system interaction audit

#### Interaction: `raofflineproxy-ctl probe-online` × the service's `ConnectivityMonitor` × the interface's `proxyOffline()`
**State shared:** `/storage/.config/raofflineproxy/online_state.json`.
**Wipe risk:** the ctl's probe overwrites the monitor's answer; the monitor rewrites only on its own transition.
**Test coverage:** UNTESTED (nothing stages a probe that disagrees with the monitor).
**Finding:** **broken in one direction** — a stale `false` persists (F-01).

#### Interaction: the scan/top-up helper × the running service × a game launching
**State shared:** `proxy.sqlite3` (WAL, `timeout=5.0`, `storage.py:50-71`), `cached_game_ids.txt` (rewritten by both).
**Wipe risk:** none — WAL and the busy timeout serialise; `es_export` writes whole files.
**Test coverage:** PARTIAL — the builder scanned while the service ran; a launch *during* a scan was not driven.
**Finding:** safe by construction; a launch's `achievementsets` write and the helper's `upsert_cache` for the same game race harmlessly (last writer wins, same content shape).

#### Interaction: `topup` on link-up × `CheckCheevosTokenComponent` on link-up
**State shared:** the link event (`NetworkThread.cpp:207-222`), RetroAchievements' login (both may `login2` with the password when no token exists yet).
**Wipe risk:** none; two tokens are issued, both valid.
**Test coverage:** UNTESTED as a pair.
**Finding:** **risky on timing** — the token check retries for 90 s against a lagging resolver (D-… #175); the ctl gives its probe 10 s and marks the attempt first (`ctl:982`), so on the boot shape #175 measured (DNS ~20–45 s behind the address) the first top-up is refused and the next is 30 min away (F-03, Medium).

#### Interaction: the exit sync card × `raofflineproxy-ctl pending|flushed` × `sayAfterGame`
**State shared:** `last-flush` (one-shot).
**Wipe risk:** two consumers (the card's worker, the no-card toast thread) — whichever runs first consumes; the event is said once. `cloudsaves.gameexit` decides which path runs, never both (`ThreadedCloudSync.cpp:471`, the toast only when there is no card — by the caller's contract in ES; not re-verified at the call site).
**Test coverage:** TESTED on RC `31253072d6` (the card); the toast path unframed.
**Finding:** safe.

#### Interaction: the flock (`/var/run/raofflineproxy-scan.lock`) × `topup --after-index` × the page's scan
**State shared:** the lock; `last-topup-attempt`.
**Wipe risk:** `--after-index` waits up to 900 s for a running scan then gives up with 75 — while a page scan holds the lock for an hour, every after-index top-up is refused; the index's new games wait for the next connect's plain `topup`. Acceptable.
**Finding:** safe; the 30-min mark is touched by every attempt including refused ones (F-03).

#### Interaction: `disable` × a pending queue × the flusher
**State shared:** `pending_awards` rows with the service stopped.
**Finding:** `pending` deliberately answers 0 with the toggle off (`ctl:355-358`) so no false promise is made; the rows stay and go when the toggle returns. Safe, and the card's silence on a lost award (AC-173-3) is the recorded gap.

#### Interaction: patch 004 (no cap) × `PeriodicRefresh` × `evict_cache_older_than`
**State shared:** every `patch:` row, hourly, while online; every `api_cache` row older than 60 days.
**Wipe risk:** **the 60-day eviction deletes `achievementsets:<hash>` rows**, which nothing in the refresh loop rewrites (`proxy_service.py:1036-1057`: `refresh_game_patch`, `cache_unlocks`, `cache_session` only). RetroArch 1.22 loads a game through `achievementsets` (offline handling at `:650-666` keys on it by hash, then by the gameid alias). So a game the scan cached and the player did not launch online within 60 days **stops loading offline** — while its `patch:` row, refreshed hourly, keeps it in `collect_cached_game_ids` → `ready` still counts it, `list_jobs` still skips it as cached, and the page still says N GAMES READY.
**Test coverage:** UNTESTED (needs a clock or a `cachedAt` edit).
**Finding:** **broken over time** (F-20, High) — a silent decay of the epic's promise on the cadence a casual player actually has. And the refresh's cost scales with the library the fork just uncapped (F-19, High).

#### Interaction: the hasher's recovery files × the ctl's `list_jobs` × the interface's own gamelist writer
**State shared:** `recovery/<system>/*.xml` with `parentHash`; `gamelist.xml`.
**Finding:** the ctl mirrors the interface's stale-file rule (`ctl:660-666`); a gamelist rewritten at a clean exit invalidates the recovery files on both sides consistently. Safe. The upgrade gap is F-18 (§ 3.7).

#### Interaction: `backuptool` restore × the toggle × the boot pass
**State shared:** `system.cfg` (travels with the toggle), the marker (does not), the proxy folder (never restored).
**Finding:** a restored device with the toggle on gets its marker and service at the next boot (`006-raofflineproxy`, `099:23-40`) and an empty cache — the top-up and the index refill it. Safe; `hardcore_was` travels too, so a later `disable` restores the *original* device's hardcore choice — correct, it is the player's.

### 3.6 What's missing?

Each with its search and its proximate-work reconstruction:

| Missing | Search | Nearby work that could have added it | Finding |
| --- | --- | --- | --- |
| A harness case for `scan`, `topup`, `ready` | `grep -n -E 'ctl (scan|topup|ready)|list_jobs|last-scan' tools/last-good-scripts-test` → 0 lines; case p ends at `flushed` (`:1346`) | `d0de5f3658` added 600 lines to the ctl with no case; `ead25d7497` added `pending-ids`/`account` **with** cases — the habit exists | F-04 |
| French frames of the two cards and the two pages | `ls docs/qa-frames/2026-09-14 \| grep -E 'ra-offline-(exit-awards|flushed)\|180-' \| grep -- -fr` → 0 | the EN frames were taken by the fixture's `--frames` and by hand; a `system.language=fr_FR` pass was done for the toggle page but not the cards | F-11c |
| Any frame of the RC-6 page | `ls docs/qa-frames \| grep ec2de8ae7\|cee1656c33` → 0; `git log` on `docs/qa-frames` after `da9ab6be6e` → the RC-5 set only | the sixth candidate is unbuilt | F-11 |
| A rocknix.org page | § AC-168-1 | none | F-14 |
| A register row for the final wording (*sent*) and for the (BETA) title | `grep -n 'SENT TO RETROACHIEVEMENTS\|WILL BE SENT' docs/decision-register.md` → 0; D-UI-053's text read | the calls were made in chat on 2026-09-14 and recorded in #173's and #184's bodies | F-12 |
| D-RA-015 | `grep -c 'D-RA-015' docs/decision-register.md` → 0 | D-RA-014 and D-RA-016 were written in the same hour | observation, F-12c |
| An upstream item for the automatic log upload | `grep -n 'log_uploader\|upload' <#168 comment>` → 0; design note § 11 item 4 has it | the #168 list was written from the patches, not from the note | F-02b |
| A cancel or background path on the scan page | `grep -n 'cancel\|background\|detach' es-app/src/guis/GuiOfflineScan.cpp` → 0 | `GuiCloudTransfer` (its model) has none either — the model was followed | F-16 |
| Milestone on #179 #180 #183 #184 | `issue-*.json` `milestone: null` ×4 | the four were opened by agents in the last day | F-13b |
| A guard on the hourly refresh after the cap went | § 3.5 | patch 004's header discusses the throttle, not the refresh | F-19 |

### 3.6.5 Audit-prescription verification — defect shapes to every site

**Shape A — a process writes a file another process owns.** Site: `probe-online` → `online_state.json` (F-01). Siblings: `write_stamp` (`last-scan`) — one writer (the ctl, under the lock) ✓; `last-flush` — the service writes, the ctl removes ✓ (one-shot by design); `cached_game_ids.txt` — the service and the helper both rewrite it via `export_cached_game_ids` (whole-file replace) — SAFE-AS-TESTED (same content derivation); `last-topup-attempt` — ctl only ✓. Adjacent: the ES `exists()` cache vs files other processes write — all four reads uncached ✓. **One site FIX-NOW.**

**Shape B — a bound removed without its dependants.** Site: `MAX_CACHED_GAMES` → `PeriodicRefresh` (F-19), `evict_cache_older_than` (F-20). Siblings: `SMART_CACHE_LIMIT` follows the constant (intended); `MAX_SCAN_ENTRIES = 5000` still bounds an unindexed walk (F-09, a different bound, still there). Adjacent: `TOPUP_TIMEOUT=900` bounds the fork's own pass ✓. **Two FIX-NOW.**

**Shape C — a probe window shorter than the lag it meets.** Site: `topup` 3×5 s (F-03). Siblings: `is_online` in `scan` — one probe, but the player pressed the row so a refusal is visible and retryable ✓ BY-DESIGN; `setsettings.sh` `netstat` check — instantaneous, the service is either listening or not ✓. Adjacent: `CheevosRetry` 9×10 s — the pattern to copy. **One FIX-NOW.**

**Shape D — a stale constant or string after a decision.** Site: `CACHE_CAP=100` (F-07). Siblings: `THE LIMIT OF 100 GAMES WAS REACHED.` + FR; the `LIMIT_REACHED` note path (`ctl:846-852`, `:950`; `GuiOfflineScan.cpp:280-281`) — keep the path (the client could say it), drop the number from the sentence. Adjacent: `docs/es-menu-map.md`? (`grep -n '100' docs/es-menu-map.md` — the reader should check when fixing). **FIX-NOW as one item.**

**Shape E — a supersession that lives only in a comment.** Sites: #173 AC3, #179 AC2, #163 boxes 1–2 (decided, unticked), AC-173-2 "within a minute" (F-13). Adjacent: D-UI-053's clause (F-12a), D-RA-004 "provisional" (F-12b). **FIX-NOW, one tracker pass.**

**Shape F — fixed forward only.** Site: the hasher's recovery-file id (F-18). Sibling: none in the ES tree (`saveToGamelistRecovery` has one caller in the hasher). Adjacent: patch 002's cached bodies are filtered on the way out ✓ (fixed backward too); the `ppsspp.ini` host cleared at the next launch ✓. **One FIX-NOW.**

**Shape G — a credential's shape where a value can appear.** Sites: `u=` in `service.log` (F-15, not bundled, not backed up — BY-DESIGN upstream, an upstream item); the web key in `curl` argv on the host (F-06); `cheevos_username` in `exec.log` (F-15). Adjacent: `qa-accounts clear` leaves the cached `login2` token in the proxy store (F-05). **F-05, F-06 FIX-NOW; F-15 FILE-UPSTREAM.**

### 3.7 Upgrade and clean install (the maintainer's question)

**What a device carries across.** `system.cfg`: `global.retroachievements.offlineproxy`, `.hardcore`, `.offlineproxy.hardcore_was` (travels in a backup, read-old-if-absent everywhere: absent reads as off). `/storage/.cache/services/raofflineproxy.conf` (re-derived at every boot from the toggle — a restored or upgraded device needs no migration). `/storage/.config/raofflineproxy/`: `proxy.sqlite3` (+`-wal`/`-shm`), `online_state.json`, `service.log`, `service_status.json`, `service.pid`, `image_cache/`, `cached_game_ids.txt`, `last-flush`, `last-scan`, `last-topup-attempt`, `scan.log` — never backed up, never restored, survives an update in place. `recovery/<system>/*.xml` and `gamelist.xml`: the index. `ppsspp.ini`'s `AchievementsHost`: rewritten at every PSP launch.

| Change | RC-4 → RC-6 | RC-5 → RC-6 | Clean install |
| --- | --- | --- | --- |
| Patch 004 (no cap) | a store with `Cache limit reached` history: nothing persisted about the cap; the next scan continues ✓ | same ✓ | ✓ |
| Index-fed scan/top-up (D-RA-013) | RC-4 has no scan; the cache holds launched games only; first RC-6 scan reads the index ✓ | **RC-5 recovery files carry a hash and no id** for every game indexed in a session that ended with a reboot (#183). RC-6's startup index skips games with a hash (`ThreadedHasher.cpp:234`); INDEX GAMES with "all games" re-hashes. Until then those games have no id → not in `list_jobs`' I-jobs, not `hasCheevos()`. **F-18, Medium.** A lookup-only pass (hash present, id empty, hash in the library → set the id, no file read) heals it at the next startup index at no cost. | `CheevosCheckIndexesAtStart=false` by default → no index → no automatic caching (F-10) |
| The page's block and (BETA) label | strings only ✓ | ✓ | ✓ |
| The 60-day eviction (upstream, inherited) | any device: `achievementsets` rows older than 60 days go while `patch` rows stay → "ready" over-counts and RetroArch misses offline (F-20) | same | same, 60 days after the first scan |
| `hardcore_was` | a device that had the toggle on under RC-2 and off since: the record was cleared by `disable` ✓; one that never disabled: the record is right ✓ | ✓ | ✓ |
| Patch 002 (synthetic id) | a cache holding 101000001 is filtered on the way out ✓ | ✓ | ✓ |
| `last-scan` shape | RC-5 wrote `indexed=` from `8c03cbb6e7`? No — `indexed=` arrived with `8c03cbb6e7` on the branch; RC-5's stamps lack it; `parseScanStamp` passes over unknown keys and tolerates missing ones (`CloudText.cpp:691-700`) ✓ | ✓ | ✓ |

**Fixing forward is not enough** applies once here (F-18) — exactly blindspot 10's shape.

### 3.8 Cost (the maintainer's question) — requests and time for a library of N games

Constants, all upstream's and unchanged by the fork: `RA_MIN_REQUEST_INTERVAL_SECONDS = 0.3`; `SCAN_BATCH_SIZE = 50` with `SCAN_BATCH_COOLDOWN_SECONDS = 30`; 429 backoff 2→15 s ×4; image pool 4 workers, 10 s timeout each, a badge skipped when already on disk; `cache_images` **default True** (`config.py:263-273`); `ConnectivityMonitor` HEAD every 15 s; `PeriodicRefresh` every 3600 s over every `patch:` row; eviction at 60 days.

**Per game, the scan (index-fed):** 3 API GETs (`patch`, `unlocks`, `achievementsets`) + 0 hash lookups; **per game, unindexed:** the ROM read + `gameid` + the same 3 = 4 GETs. **Badges:** `_rewrite_achievement_badge_fields` yields a locked and an unlocked image per achievement plus the game icon → ~2A+1 image GETs for A achievements (≈30 on average → ~60), from the media host, unthrottled, four at a time, awaited before the helper exits (the pool joins at interpreter shutdown; `shutdown_image_downloads` is not called).

| Library | Scan API GETs | Scan images (≈) | Throttle floor | Cooldowns | Badge time (≈150 ms each, 4 wide) | **Wall clock, first scan** | Disk (≈4 KB/badge) |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 100 games | 300 | 6,000 | 90 s | 1 × 30 s | ~4 min | **~6–8 min** | ~25 MB |
| 1,000 games | 3,000 | 60,000 | 15 min | 19 × 30 s ≈ 10 min | ~40 min | **~40–45 min** (the seat: images download while the API calls run, so the two overlap), longer with disc images to hash | ~250 MB + sqlite ~20–50 MB |

With the index the hashing cost is zero; without it, cartridge ROMs read in milliseconds and CHDs in seconds each.

**Per connect (top-up):** 1 HEAD, then only uncached I-jobs (3 GETs each) and the client's recently-played pass — once the library is cached, near zero. **Bounded** at 15 min and once per 30 min.

**Per online launch (unchanged by the epic):** `login2`, `achievementsets`, `startsession`, then `ping` every ~2 min and one `awardachievement` per unlock — through the proxy instead of direct; the proxy adds the badge rewrite and its own `HEAD` probe cadence.

**Standing costs while the toggle is on and the device is online — the ones the fork's decisions change:**

- The monitor's `HEAD https://retroachievements.org/` every 15 s: **5,760 requests/day per device**, whether or not anything is played. Inherited; upstream's design.
- **`PeriodicRefresh`: 2 GETs per `patch:` row per hour** (`refresh_game_patch` + `cache_unlocks`; the session is local). Upstream sized this under a 100-game cap: ≤200 GETs/hour. Patch 004 removes the cap and leaves the refresh: **a 1,000-game scanned library costs 2,000 GETs every hour it is online — 48,000/day — with the 0.3 s throttle turning that into ten minutes of back-to-back requests each hour.** No age check (`rom_cache.py:140-176`), no "recently played" filter, no jitter. This is the cost the cap was protecting, and the one to answer before a full-library scan ships to anyone but the maintainer (F-19, **High**; the seat corrected the cadence: ~41,000/day, a pass then an hour). The proxy's User-Agent is registered with RetroAchievements as a casual-only client (D-RA-005); a fleet of ROCKNIX devices refreshing whole libraries hourly is the shape that gets a client's UA rate-limited or revoked, for every user.

**The interface's own costs offline:** the RETROACHIEVEMENTS summary asks the proxy twice per cached game, sequentially, on the loopback (`RetroAchievements.cpp:395-407`): 2,000 requests for 1,000 games behind a `GuiLoading` spinner — a few milliseconds each on a handheld's loopback, so tens of seconds, plus badge loads (F-17, Low–Medium). A hung proxy costs `PROXY_TOTAL_MS` (15 s) *per game* with no fail-fast.

**What the player pays:** the first scan is a locked console for an hour at 1,000 games (F-16); afterwards nothing visible — except battery and radio for the hourly refresh, which on a handheld left on at home is not nothing.

### 3.9 Fail-closed (the maintainer's question) — every guard the fork added

| Guard | Machinery that can break | Falls to |
| --- | --- | --- |
| `setsettings.sh` three conditions (`:511-524`) | `get_setting` empty; `game_setting` odd; `netstat` missing or the port not listening | direct path, host cleared, logged ✓ |
| `cheevos_ppsspp.sh` (`:49-56`) | same | `AchievementsHost =` empty ✓ |
| ctl `enable` (`:277-308`) | `systemctl start` fails | marker removed, settings untouched, exit 1 ✓; a settings write failing *after* the start leaves the service up until the boot pass (F-08, Low) |
| ctl `disable` (`:310-333`) | `systemctl stop` fails | logged, carries on; marker gone, toggle 0 → nothing routes ✓ |
| ctl `pending` / `pending-ids` / `account` | store unreadable / not a store / odd answer | exit 2, nothing on stdout (`cannot_tell`) ✓; ES reads -1 / empty → says nothing ✓ |
| ctl `flushed` | a stamp of the wrong shape | removed, exit 1 ✓ |
| ctl `is_online` | `probe-online` fails / file unreadable | offline → refuse ✓ — **but the probe itself writes the shared file (F-01)** |
| ctl `refuse_unless_ready` | toggle off / no account | 78 / 77, no stamp ✓ |
| ctl `take_lock` | `flock` missing | `until flock -n 9` would loop forever on a missing applet (command not found → non-zero → retry) — `--after-index` gives up at 900 s; a plain `scan` exits 75 at once ✓; busybox has flock ✓ |
| ctl `list_jobs` | Python import error / unreadable ES dir | `LIBRARY_UNREADABLE`, stamp rc 1, exit 1 ✓ |
| ctl `run_jobs` three-in-a-row / 401 / cap | | stops, why token, stamp ✓ |
| `write_stamp` | `mkdir` fails | returns 1, unchecked by callers → no stamp, the row keeps its last line (silent) ⚠ Low |
| `099-networkservices` | fragment sets no CONF | `unset` per iteration ✓ (case q) |
| `006-raofflineproxy` | toggle absent | STATE empty → stop ✓ |
| ES `proxyOffline()` | file missing / unreadable / not a bool | unknown → not offline → web as before ✓ |
| ES `pendingAwards()` / `takeFlushed()` | ctl absent / odd exit | -1 / false → silence ✓ |
| ES `getGameInfoFromDevice` | proxy not answering | `ID 0`, `NotOnDevice false` → the web ✓; a miss on both keys → the one dialog ✓ |
| ES `GuiOfflineScan` | ctl exits with an unknown code | `COULDN'T FINISH` + `SOMETHING WENT WRONG` ✓; a killed popen → -1 → same ✓ |
| ES `apply` (toggle) | ctl exit ≠ 0 or no `hardcore=` line | switch reverted, dialog ✓ |
| `CheevosRetry::nextDelayMs` | count 0 or negative | long schedule ✓ (tested) |
| `WebImageComponent` | a 0-byte 200/204 | file removed, retried later ✓ |
| `redact_credentials` absent | | `rocknix-evidence` collects nothing ✓ (case s) |
| `qa-accounts` | file mode ≠ 600 / value with a newline / a rebuild that does not parse | refuses ✓ |
| `ra-offline-test` | spent account / API silent / missing socket | FAIL, nothing launched ✓ |

Verdict: every fork guard fails closed for its **reader**. The one that fails open is a **writer** (F-01), and the one that fails silently is `write_stamp`'s unchecked return.

### 3.10 Credentials (the maintainer's question) — can a value reach a log, a stamp, a bundle, or a proxy request the fork adds?

| Value | Where it lives | Log? | Stamp? | Bundle? | A request the fork adds? |
| --- | --- | --- | --- | --- | --- |
| RA password | `system.cfg`; RetroArch's appendconfig (per launch, `/tmp`) | `exec.log` → `<redacted>` (`001-functions:74-77`; case r); `service.log` → `p=<token>` (`redact_form_tokens`) | no | `exec.log` filtered again on the way in (case s) | `login2` to the proxy → RA, as RetroArch always did |
| RA token | `system.cfg` (`global.retroachievements.token`, held back from backups #169); `proxy.sqlite3` `login2::` row and `t=` in queued awards (folder held back, case k); `ppsspp_retroachievements.dat` (held back) | `service.log` → `t=<token>`; `exec.log` has no token line | no | no | `patch`/`unlocks`/`achievementsets` with `t=` — the proxy's own requests to RA over HTTPS; the ES asks the proxy with `u=` only (`RetroAchievements.cpp:296`, `:309`, `:329`) — **no token crosses the loopback from the interface** ✓ |
| Web API key | `system.cfg` (`global.retroachievements.key`, held back) | no fork line | no | no | the fixture's `curl` URL on the **host** (F-06); on the device the ES web calls, as before |
| Account name | `system.cfg` | `exec.log` `cheevos_username` in the clear (2 lines, #176); `service.log` `u=<name>` on every request line; `scan.log` — no (`grep` this session: file names and reasons); the journal — the ctl's `say` lines name no account | `last-scan` — no | `exec.log`'s two lines travel in the bundle unmasked (a public identifier; the filter's word list omits `user` by choice) | `u=` to the proxy on the loopback |
| HMAC award key (`award_secret.key`) | the folder | no | no | no | no |

Conclusion: no secret the fork handles reaches a log, a stamp or a bundle; the two account-name appearances are public identifiers and stated; the one *value* that leaves the device besides RA's own protocol is the upstream client's **automatic log upload** to `https://ud63psmdb5.execute-api.eu-central-1.amazonaws.com/logs/request-upload` after a storage-corruption incident (`proxy_service.py:1060-1076`, retried at every online start; `log_uploader.py:99-113` redacts `t=`/`p=` and not `u=`; the design note § 9 said so on day one). A power cut mid-write on a handheld — #102's shape — is the trigger. Nothing in the fork gates it (F-02, **High** as a privacy/consent matter: a third-party endpoint, no player's yes, an identifier in the payload). A patch 005 that makes the upload opt-in (config `upload_logs: false` by default, honoured in `retry_storage_corruption_report` and the menu path) is one `if`.

### 3.11 Wording (the maintainer's question) — every player-facing string of the epic, EN and FR

Checked mechanically (§ 02 header): 71 msgids, 71 French; no `WIFI`; `SYNC` only on saves; `SENT` on achievements; UPPERCASE `_()` except the five sentence-case descriptions that match their page's dialect (`Casual achievements only.`, the two `Also saves…` lines, `Unlocked`, `Unlocked - will be sent when you're connected`). Read by hand against D-UI-022/023/053/054/055 and D-RA-004:

- Row + one line everywhere (D-UI-023): the RA settings row, the scan row (two lines tall by construction), the three INDEX rows ✓. The page's info block is one non-selectable text row of five sentences — D-UI-054 asked for one block; on a 3.5" panel it is the longest single text the fork shows and **no frame exists** (F-11). Its French is 30% longer.
- Complete sentences, no machinery (D-UI-055): the scan dialog ✓; `THIS CAN TAKE A WHILE. YOU CAN LEAVE IT RUNNING.` ✓; `LOOKING THROUGH YOUR GAMES...` ✓. One machinery word survives: `SKIPPED - A SCAN IS ALREADY RUNNING` names the lock's effect in the player's terms ✓.
- Scan not sync (D-RA-010) ✓ throughout; *sent* (D-RA-004 as superseded) ✓.
- `'!RA!'` quoted (D-UI-054) ✓ EN and FR.
- `(BETA)` on the row and the switch (D-UI-053) ✓; and on the title (note 2 / D-UI-054) — the register's D-UI-053 clause disagrees (F-12a).
- Numbers: `GAMES WITH ACHIEVEMENTS ADDED: 3`, `3 GAMES READY FOR OFFLINE PLAY`, `1 GAME READY…`, `NO GAMES READY FOR OFFLINE PLAY YET` — one shape per fact ✓; FR `3 JEUX PRÊTS POUR JOUER HORS LIGNE` (number first in both languages) ✓.
- `THE LIMIT OF 100 GAMES WAS REACHED.` — unreachable and false (F-07).
- `A  TRY AGAIN     B  CLOSE` hardcodes button letters against the style guide's "never hardcode press A" — the precedent is `GuiCloudTransfer`'s identical footer (D-UI-028); not new, noted.
- The exit card's `OFFLINE ACHIEVEMENTS WILL BE SENT AND SAVES SYNCED NEXT TIME YOU'RE CONNECTED.` does not fit at 640x480 and falls to the awards sentence alone, by design and documented; the French two-part form fits only at 1280 — consistent.
- French register: typographic apostrophes (`N’ÊTES`, `L’ACTIVER`, `D’UN`) in the long strings; `Déverrouillé - sera envoyé à votre prochaine connexion` and `Déverrouillé` sentence-case beside `Points` ✓; a space before `?` and `:` (`MAINTENANT ?`, `AJOUTÉS :`) ✓ — the file's own style (D-UI-051).

### 3.12 Enhancement and optimisation — what I would change, ranked, with the reason

1. **Bound the hourly refresh (patch 005, upstream too).** Refresh only games in the client's recent history, or rows older than a day, on a daily cadence with jitter — never the whole library hourly. Reason: D-RA-014 removed the cap that sized it; § 3.8's 48,000/day is the number that puts every ROCKNIX user's UA at risk (F-19).
2. **Keep the scanned cache alive (patch 006).** Either refresh `achievementsets` rows beside `patch` rows, or spare from eviction any row whose game is in `cached_game_ids`, or have the top-up treat a game whose `achievementsets:<hash>` row is missing as uncached. Reason: F-20 — the promise decays silently at 60 days, and the page keeps saying "ready".
3. **One writer for `online_state.json`.** The ctl probes into its own file (set `RAOFFLINEPROXY_CONFIG_DIR` to a scratch dir for that one call, or add `--state-file` upstream) and the interface keeps reading the service's. Reason: F-01 inverts D-RA-011 on the event it exists for.
4. **Gate the automatic log upload (patch 007).** `upload_logs` opt-in, default off; the menu's manual upload untouched. Reason: F-02 — a third-party endpoint with no consent, after a fault handhelds produce.
5. **Give the top-up the token check's patience.** Probe on the `CheevosRetry` schedule (10 s × 9) and mark the attempt only after a successful probe or a refused sign-in. Reason: F-03 — the first connect after boot is the one that matters and the one that fails today.
6. **Let a scan be left.** B while running = keep scanning in the background (the ctl is resumable) and the row's line reports; or cap a foreground pass (say 100 games) and hand the rest to the top-up. Reason: F-16 — an hour of refused input on a 3.5" screen.
7. **Make the index exist.** When the toggle goes on, offer INDEX NEW GAMES AT STARTUP (or turn it on with a sentence), and show `NEW GAMES ARE ADDED THE NEXT TIME YOU'RE CONNECTED.` only while it is on. Reason: F-10 — the cache "follows the index" and the index is off by default.
8. **Heal RC-5's recovery files.** The startup hasher does a lookup-only pass for games with a hash and no id (no file read; `mCheevosHashes.find`). Reason: F-18, blindspot 10.
9. **A harness case for scan/topup/ready** (bwrap, shimmed `probe-online`, a fixture gamelist + recovery + `cached_game_ids.txt`, a shimmed helper): the index rule, the four refusals, the lock, the stamp shape, the three-in-a-row abort, the half-hour mark. Reason: F-04 — 600 lines proven only by hand on one guest.
10. **One bulk read for the offline summary** (`raofflineproxy-ctl summary` or the client's `cached-games` JSON): one process instead of 2N loopback requests, and fail-fast after the first proxy failure. Reason: F-17.
11. **Tooling hygiene:** `qa-accounts clear` removes the proxy folder when it holds a `login2` row (F-05); `ra-offline-test` sends the web key to curl over stdin (`-K -`) (F-06).
12. **Tidy:** drop `CACHE_CAP` and the 100-games sentence (F-07); check `write_stamp`'s return (§ 3.9); add `WARNING_ACHIEVEMENT_ID` to `readAchievements`' filter as belt-and-braces; the es-code-traps recipe gains `-DRAPIDJSON_INCLUDE_DIR` (F-21).
13. **Paperwork:** the body edits (F-13), the register rows (F-12), the docs page (F-14), the French and RC-6 frames (F-11), the `log_uploader` item on #168 (F-02b).

### 3.7 Retrospective Summary

**Architectural assessment:** sound and consistent; three seams are wrong (F-01 two writers; F-19/F-20 the cap's dependants; F-16 the tier overrun) and one assumption is unfounded on a fresh device (F-10).

**Conformance:** HIGH on the rules; MEDIUM on the register/tracker discipline (three drifts, one hole); blindspots 10, 23 and 27 repeated in shape, 43 half-repeated.

**Cross-system interactions:** nine examined; two broken (F-01, F-20), one risky on timing (F-03), six safe.

**Spec drift:** five items, each documented in a comment and not in the body or the register (F-12, F-13).

**Missing artifacts:** ten, table § 3.6.
