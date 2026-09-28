# Packet D — second audit

**Do not treat this packet as fully closed for the release candidate.** The main fixes are present, but three correctness problems remain:

1. The new ready-game fast path can mistake a truncated numeric prefix for a complete game ID.
2. Failed ready-set measurements still fall back to cache-operation counts and can falsely report “more games.”
3. The index-marker acknowledgement still has a compare/delete race that can erase a newer notification.

I also found two fail-open test guards. Guest acceptance for PL-013 and PL-059 remains unproved.

This is a **source-level review of the embedded corpus**. I did not access the filesystem, execute tests, or recompute hashes. The report’s final “493 PASS” result is a reported result, not my observation. [S2]

## Citation convention

`[S1]`–`[S8]` refer to the ordered path/hash pairs in `corpus.provenance.json` below.

Within **S1, `D.diff`**:

- **CTL:** `projects/ROCKNIX/packages/network/raofflineproxy/sources/raofflineproxy-ctl`
- **IMAGES:** `projects/ROCKNIX/packages/network/raofflineproxy/sources/raofflineproxy-cache-images`
- **REFRESH:** `projects/ROCKNIX/packages/network/raofflineproxy/sources/raofflineproxy-refresh`
- **TEST:** `tools/last-good-scripts-test`

Test references such as **D23** identify labelled cases within TEST’s added hunk, `@@ -3011,4 +3011,1432 @@`. Modified-file names are locators within the embedded diff, not claims that those complete files were separately read.

## 1. Punch-item verdicts

The acceptance text in S4 is the criterion. “Holds” below means the shown implementation and test assertions support that criterion; it does not claim an independently executed test run.

| Item | Verdict | Evidence and remaining limitation |
|---|---|---|
| **PL-013 — prompt cancellation during images** | **Holds in part** | IMAGES replaces the executor context manager with explicit `shutdown(wait=False, cancel_futures=True)` and uses `leave(130)`/`os._exit` to avoid interpreter shutdown waiting for workers. CTL backgrounds `timeout`, sets `CLIENT`, and waits so its traps can run. See IMAGES `@@ -328,36 +409,89 @@`; CTL `@@ -1310,19 +1718,57 @@`; tests **D1/D23**. **The required guest frame series showing closure within two seconds is absent.** D23’s real-process-group assertion also permits **three** seconds, not the acceptance’s two. |
| **PL-055 — failed listing preserves index marker** | **Holds for the stated acceptance** | Removal is gated by `LISTED=1` and an empty `WHY`; failed listings do not reach that acknowledgement. D2 asserts that a failed listing leaves the marker. CTL `@@ -1581,20 +2107,33 @@` and `@@ -1619,6 +2160,18 @@`. The separate concurrent-notification guarantee remains incomplete: **G2-D-03** below. |
| **PL-057 — launch-only summary and unknown unlocks** | **Holds** | Summary queries `achievementsets:` rows as well as patches, selects the core set, and initializes `unlocked = None`. Missing, malformed, unsuccessful, or non-list unlock data remains null. D3 seeds both a sets-only game and unreadable unlocks and asserts their output. CTL `@@ -588,14 +651,43 @@` and `@@ -603,24 +695,43 @@`. Rendering null as unknown is an unverified interface seam. |
| **PL-058 — failed session-row drop counts as failure** | **Holds** | `drop_startsession` now raises `RuntimeError`; `done += 1` occurs only after the call returns. D4 replaces `Storage.delete_cache` with a raising implementation and requires `re-read 0 game(s), 1 failed` and exit 1. REFRESH `@@ -81,7 +87,7 @@` and `@@ -199,6 +209,7 @@`. |
| **PL-059 — cursor past uncacheable files and visible truncation** | **Holds in part** | Listing proposes `scan-cursor.next`; the caller commits it only after `R_DONE=1` and `R_STOPPED=0`. A failed truncated-cursor commit yields failure and suppresses the continuation promise. `note TRUNCATED` and `truncated=1` are emitted. CTL `@@ -1106,10 +1458,58 @@`, `@@ -1126,28 +1526,36 @@`, and `@@ -1466,12 +1934,46 @@`; tests **D5/D26**. However, D5 uses **13 files with a cap of 10**, not the specified 5,001-file case, and no guest frame shows the note. The scaled case supports the algorithm but does not literally complete acceptance. |
| **PL-060 — image failures decide scan outcome, including nothing-new scans** | **Holds at the scripts-contract boundary** | `run_image_pass` accepts only exits 0 and 3; other exits set `SOME_IMAGES_NOT_SAVED`. The nothing-new branch runs images, and the ordinary tail now runs them whenever jobs were worked through, including all-skipped jobs. Nonempty image reasons become nonzero stamps/outcomes. CTL `@@ -1310,19 +1718,57 @@`, `@@ -1437,17 +1893,29 @@`, and `@@ -1466,12 +1934,46 @@`; tests **D6/D6b/D22**. The literal on-screen outcome/reason mapping is not embedded. |

## 2. Review of every first-audit finding

These assess the claimed answers in S3 against S1. An **answered-in-part withdrawal** below means its missing dependency prevents verification—not that the original allegation has been established.

### Claude seat

| Finding | Verdict | Follow-up review |
|---|---|---|
| **G-D-01 — ARMSX2 change missing from packet** | **Answered** | The present diff includes the complete two-pass rewrite and checked rename at `cheevos_armsx2.sh`, `@@ -83,16 +83,49 @@`, plus D14/D32. The earlier delivery-gap allegation does not apply to this packet. |
| **G-D-02 — all-skipped scans omit images** | **Answered** | The gate is now `[ "${R_STOPPED}" -eq 0 ] && run_image_pass`, rather than `R_CACHED>0`. CTL `@@ -1466,12 +1934,46 @@`; D22 covers both failing and successful image passes after all jobs are skipped. |
| **G-D-03 — cancellation mechanism under real timeout** | **Answered** | The revised comments describe TERM forwarding, and D23 uses GNU timeout, `setsid`, group SIGINT, and assertions that the helper saw TERM but not INT. This answers the mechanism/test-topology finding, not the still-missing guest acceptance. |
| **G-D-04 — absent/transient classification tested only with a stub** | **Answered** | D24 uses a loopback HTTP server and the real `fetch_static_asset`; it covers 404, 410, redirect-to-404, 503, connection refusal, and a PNG. The replacement test addresses the stated stub-only gap. |
| **G-D-05 — start-limit interval cannot contain the burst** | **Answered** | The unit now has `StartLimitIntervalSec=300` and `StartLimitBurst=5`; D25 checks the interval against wait plus restart delay. Unit hunk `@@ -9,10 +9,19 @@`. Actual restart behaviour remains a runtime check. |
| **G-D-06 — cursor advances during listing** | **Answered** | `propose_cursor` writes `.next`; `commit_cursor` is called after completed, unstopped jobs. CTL `@@ -1106,10 +1458,58 @@` and `@@ -1466,12 +1934,46 @@`; D26 supplies a cancellation case. |
| **G-D-07 — EX_USAGE may be undefined** | **Answered in part** | D27 requires exit 64 and usage text, so there is now a relevant guard. The claimed `EX_USAGE=64` definition is outside the embedded hunks; I cannot independently verify that part of the withdrawal. |
| **G-D-08 — inconsistent whole-game definitions and full-body parsing** | **Answered in part** | Both shown readers now use sets ∩ casual unlocks, and the common fast path reads only 512 characters. However, that optimization introduces the ID-prefix error in **G2-D-01**. CTL `@@ -772,6 +892,115 @@` and `@@ -1052,12 +1357,59 @@`. |
| **G-D-09 — PPSSPP path may reach a playlist consumer** | **Answered in part** | The history-path change is shown, but its claimed sole consumer using only `-e`/`-nt` is not. The withdrawal is plausible and unrefuted, but the report’s caller count is not independently established by this packet. |
| **G-D-10 — storm guard and “once” wording** | **Answered in part** | The log now says “again after the half hour if this run does not finish,” and the `PENDING_DUE`/interval mechanism is visible. CTL `@@ -1517,8 +2033,15 @@` and `@@ -1581,20 +2107,33 @@`; D29. The policy/register approval is not embedded. |
| **G-D-11 — PPSSPP consumption closed by a comment** | **Answered in part** | D30 adds source checks, but its pin guard fails open on an empty extraction: **G2-D-04**. The pinned PPSSPP source and a launch trace are absent. The source check’s existence is established; actual consumption and guest routing are not independently proved here. |
| **G-D-12 — cached-image return contract** | **Answered in part** | D24 now pre-seeds an image and asserts `"cached"`, which is the appropriate regression case. The complete unchanged `target.exists()` path needed to verify the claimed fall-through is not embedded. |
| **G-D-13 — failed top-up listing still succeeds** | **Answered** | Non-timeout listing errors set `LIST_WHY=LIBRARY_UNREADABLE`; that becomes `WHY` if no subsequent failure supplies one. CTL `@@ -1581,20 +2107,33 @@` and `@@ -1656,9 +2209,17 @@`; D2 now requires exit 1 and the failure stamp. |
| **G-D-14 — thirty-day negative image cache** | **Answered for the code change** | `ABSENT_RECHECK_SECONDS = 24 * 3600`; D31 distinguishes a two-day-old entry from an hour-old entry. IMAGES `@@ -82,7 +111,20 @@`. Maintainer approval of the revised policy is not independently available. |

### GPT seat

| Finding | Verdict | Follow-up review |
|---|---|---|
| **G-D-01 — image pass skipped or given no time** | **Answered in part** | The all-skipped scan is fixed, and `SECONDS_LEFT<=10` now sets `TOOK_TOO_LONG`; D22 checks both. CTL `@@ -1310,19 +1718,57 @@` and `@@ -1466,12 +1934,46 @@`. The no-helper branch still returns success. Its withdrawal depends on the unembedded `makeinstall_target`, so that packaging justification cannot be verified here. |
| **G-D-02 — IPv6 loopback mistaken for IPv4 endpoint** | **Answered** | Both case statements accept only IPv4 loopback, IPv4 wildcard, and IPv4-mapped loopback. Neither `::1` nor `::` is accepted. PPSSPP `@@ -49,17 +49,51 @@`; CTL `@@ -772,6 +892,115 @@`; D12b/D15. |
| **G-D-03 — older run clears newer notification** | **Answered in part** | Token capture and comparison protect updates made before the final comparison. The comparison and unlink remain separate operations, leaving **G2-D-03**. CTL `@@ -1619,6 +2160,18 @@`. |
| **G-D-04 — launch-only game counted as newly ready** | **Answered for the normal-read case** | `ready_games_into` no longer requires a patch row. D28 tests a previously ready sets/unlocks game receiving another indexed dump. CTL `@@ -772,6 +892,115 @@`. The reader and failure-path defects in **G2-D-01/02** qualify the broader counting guarantee. |
| **G-D-05 — failed comparison becomes zero** | **Answered locally** | `games_made_ready` captures grep’s own status and returns failure for status >1 before printing a count. D28’s directory-as-before-file case checks that. CTL `@@ -772,6 +892,115 @@`. The callers’ fallback still misreports counts: **G2-D-02**. |
| **G-D-06 — cursor persistence failure silently succeeds** | **Answered** | Proposal failure is exposed through `cursor_saved`; commit failure makes the run unsuccessful and suppresses `TRUNCATED`. D26 covers an unwritable destination and failed proposal. CTL `@@ -1106,10 +1458,58 @@` and `@@ -1466,12 +1934,46 @@`. |

## 3. New findings

### G2-D-01: The 512-character fast path can invent a different game ID

- **Severity:** Medium
- **Category:** New regression / cache correctness
- **Where:** `projects/ROCKNIX/packages/network/raofflineproxy/sources/raofflineproxy-ctl`; `ready_games_into`, hunk `@@ -772,6 +892,115 @@`, and `whole_games`, hunk `@@ -1052,12 +1357,59 @@`. [S1]
- **What:** Both readers search a truncated JSON prefix using `"GameId"\s*:\s*(\d+)`. A successful regex match is immediately accepted. Nothing verifies that the complete numeric value lies inside the prefix.
- **Failure scenario:** A valid cached body can be constructed as:
  ```python
  '{"Title":"' + 'T' * 489 + '","GameId":153,"Sets":[]}'
  ```
  Its first 512 characters end with `"GameId":15`; the final `3` is character 513. Both fast paths therefore use game **15**, not **153**, and never take the full-body fallback.

  This can make an already-ready game disappear from the measured ready set. If game 15 has unlocks and a path-bearing patch but lacks its own sets row, it can also be falsely classified as whole and passed over by the unindexed scan.
- **Evidence:** The shown code combines:
  ```python
  substr(responseBody, 1, 512)
  ```
  with:
  ```python
  found = game.search(head or "")
  if found:
      sets.add(int(found.group(1)))
      continue
  ```
  The full JSON parse is reached only when the regex finds nothing. There is no complete-token check. D28 tests a GameId wholly beyond the prefix, not one **straddling** its boundary. Require a complete value before accepting the fast path and add this boundary case.

### G2-D-02: Failed ready-set measurements still produce authoritative “added” counts

- **Severity:** Medium
- **Category:** Fail-open measurement / player-facing correctness
- **Where:** `projects/ROCKNIX/packages/network/raofflineproxy/sources/raofflineproxy-ctl`; top-up hunks `@@ -1604,7 +2143,9 @@` and `@@ -1656,9 +2209,17 @@`; scan hunk `@@ -1437,17 +1893,29 @@`; `write_stamp` context at `@@ -784,12 +1013,36 @@`. [S1]
- **What:** `games_made_ready` now correctly fails instead of printing zero, but its callers silently substitute the number of cache operations. That is the very quantity the fix established is not necessarily the number of newly ready games.
- **Failure scenario:** A game is already ready under one hash. An indexed pass caches another dump of that game. The before-snapshot read fails transiently, or the ready-file comparison cannot be read, while the job itself succeeds.

  No new game became ready, but top-up retains `ADDED="${CACHED}"`; scan leaves `ADDED` empty and `write_stamp` defaults it to `CACHED`. The run can consequently stamp success with `added=1`, supporting a false “1 MORE GAMES ARE READY” outcome.
- **Evidence:** The fallback and conditional replacement are explicit:
  ```bash
  ADDED="${CACHED}"
  ```
  ```bash
  ... && MADE="$(games_made_ready ...)" && ADDED="${MADE}"
  ```
  ```bash
  local ADDED="${10:-${CACHED}}"
  ```
  The shown error branches do not set a measurement-error reason or carry an unknown value. D28 tests the failed comparison alone, not its caller’s stamp after that failure. S8 requires “more” only for games newly ready; S6’s fail-closed measurement rule does not permit replacing an unreadable measurement with a different quantity. Carry uncertainty through to the consumer rather than asserting either zero or the operation count.

### G2-D-03: Token comparison does not make marker acknowledgement atomic

- **Severity:** Medium
- **Category:** Incomplete concurrency fix / lost notification
- **Where:** `projects/ROCKNIX/packages/network/raofflineproxy/sources/raofflineproxy-ctl`; `write_index_pending`, hunk `@@ -1483,11 +1985,25 @@`, and acknowledgement, hunk `@@ -1619,6 +2160,18 @@`. [S1]
- **What:** The token check and `rm -f "${INDEX_PENDING}"` are separate operations. The writer can replace the marker after the successful comparison but before removal.
- **Failure scenario:**
  1. A top-up listed for token **A**.
  2. Its final `cat` reads A, and the comparison succeeds.
  3. An index writes token **B** and renames it over `index-pending`.
  4. The old top-up unlinks that pathname, deleting B.

  The later index notification is lost. The next link return no longer has the marker that requests its indexed listing.
- **Evidence:** The reader does:
  ```bash
  if ... [ "$(cat "${INDEX_PENDING}" 2>/dev/null)" = "${PENDING_TOKEN}" ]; then
      rm -f "${INDEX_PENDING}"
  ```
  while the writer publishes with a separate `mv`. The shown paths contain no shared critical section or atomic acknowledgement protocol spanning comparison and removal. D29 writes the new marker during helper work, before this final comparison; it does not exercise this interleaving. Serialize the short marker write/acknowledgement operations or use a generation protocol that cannot delete a later notification.

### G2-D-04: The PPSSPP pin guard passes when pin extraction returns nothing

- **Severity:** Low
- **Category:** New test guard / fail-open evidence
- **Where:** `tools/last-good-scripts-test`, added hunk `@@ -3011,4 +3011,1432 @@`, **D30**, `PPV` extraction and citation checks. [S1]
- **What:** D30 does not assert that `PPV` is nonempty before interpolating it into grep patterns.
- **Failure scenario:** The readable recipe changes to a non-hex version or another assignment form that the sed expression does not match. Sed succeeds but emits nothing, so `PPV=""`. The two patterns then become:
  ```bash
  grep -q "afbc66a3\|" ...
  grep -q "" ...
  ```
  Both can succeed, and the test reports that the script names the pinned commit even though it obtained no pin. Source discovery can then skip the separate source check.
- **Evidence:** The guard consists of the two grep calls; there is no nonempty/valid-pin assertion. This is the empty-comparison failure class explicitly described in S6. Require a successfully extracted, valid pin before testing its occurrence, and construct an empty-extraction negative case.

### G2-D-05: A partially executed predicate driver can be counted as passing

- **Severity:** Low
- **Category:** New test guard / incomplete execution accepted
- **Where:** `tools/last-good-scripts-test`, added hunk `@@ -3011,4 +3011,1432 @@`, **D13a/D13b/D13c**, especially D13b’s driver and verdict-consumption loop. [S1]
- **What:** These wrappers require only that at least one `PASS` or `FAIL` line exists. They then count whatever verdicts were printed, without requiring every expected predicate to have run.
- **Failure scenario:** In D13b, the download/publication predicate prints its verdict before:
  ```python
  spec.loader.exec_module(helper)
  ```
  A constructed broken helper that exits with `SystemExit(0)` during that import ends the driver successfully after the first PASS. Neither cached-image verification predicate runs. The shell’s existence check succeeds, and its loop records the single PASS without a missing-predicate failure. This scenario does not depend on the unembedded shell prologue’s `errexit` setting.
- **Evidence:** The gate is:
  ```bash
  grep -q '^\(PASS\|FAIL\) ' ...
  ```
  followed by a loop accepting the verdict lines that happen to exist. There is no assertion of the complete expected predicate set. Require successful driver termination **and** every expected named verdict; add a truncated-output negative case. This finding concerns these blocks, not a claim that every other suite case would also pass over the same broken helper.

## 4. Sweep spot-checks

The following are checks of the report’s claimed fixes, not repetitions of its PASS results. [S1, S2, S5]

| Sweep row(s) | Spot-check result |
|---|---|
| **gpt F-RA-27 — automatic-upload consent** | **Mechanism holds.** Patch 008 uses `.get("upload_logs") is True`, excluding truthy strings and integer 1. D13a supplies those distinct values. |
| **gpt F-RA-18 — disable restoration record** | **Mechanism holds for the named write failures.** CTL reads the toggle back before stopping anything, and hardcore back before deleting its saved value. Hunk `@@ -465,26 +509,30 @@`; D11 exercises refused writes. |
| **claude F-RA-12 / gpt F-RA-19 — consecutive refresh failures** | **Holds.** `in_a_row` increments on failure and resets only after successful refresh/drop. REFRESH `@@ -162,6 +168,10 @@`, `@@ -199,6 +209,7 @@`, and `@@ -214,8 +225,9 @@`; D4 distinguishes separated and consecutive failures. |
| **gpt F-RA-09 — pending award ownership** | **Shown filtering holds.** Both readers extract and normalize `u` from query/body and exclude a different named account. CTL `@@ -538,34 +586,49 @@` and `@@ -588,14 +651,43 @@`; D3b tests query-owned and body-owned awards. The upstream ownership helper itself is not embedded. |
| **gpt F-RA-12 / claude F-RA-13 — cached PNG verification and trailing bytes** | **Named checks are present.** IMAGES calls `image_cache.png_problem`; patch 013 walks CRC-checked chunks through IEND and inflates IDAT. Trailing bytes after IEND are accepted. This proves the stated CRC/inflate design, not complete PNG decoder validity. D13b’s execution guard needs G2-D-05. |
| **claude F-EM-03/F-EM-09; gpt F-EM-03/F-EM-05 — ARMSX2 legacy and empty files** | **Mechanism holds.** The two-pass rewrite consolidates sections and tokens; END handles empty input. Rename is now inside the checked operation. D14 covers legacy/empty/missing inputs and idempotence; D32 covers rename refusal. |
| **claude F-EM-04 — PPSSPP listener probe** | **Shown replacement holds.** It uses shell reads of socket tables, not netstat; unreadable tables are distinguished from no listener. The final case statement rejects IPv6-only loopback. PPSSPP hunk `@@ -49,17 +49,51 @@`; D15. |
| **gpt F-RA-26 / claude F-RA-20 — readiness and start limit** | **Static unit mechanism holds.** ExecStartPost waits for the port; the start-limit settings are in `[Unit]`, with an interval sized to contain failed starts. Real boot ordering and enable rollback are not proved by the unit text or systemctl shims. |
| **gpt F-RA-20 — second DNS lookup** | **Intended mechanism is visible.** Patch 015 remembers bounded results and rewrites the requested numeric port in the socket answer; bounded workers bypass the cache. D13c exercises a resolver that stops answering after the first result. General compatibility of the process-wide wrapper with all callers, flags, and retries is not established by the embedded callers. |
| **claude F-RA-23 / gpt F-RA-24 — dependencies** | **Declaration holds; installed artifact unverified.** The recipe adds bash, busybox, coreutils, grep, and systemd, and D16 checks the declaration. The complete install recipe, target tool inventory, and packaging rule are not embedded. |
| **claude F-RA-10 / gpt F-RA-15 — newly ready counts** | **Partial.** The normal before/after-set approach and duplicate-dump cases are present, but G2-D-01/02 prevent accepting the broader counting guarantee. |

**Sweep withdrawal:** The import half of **claude F-RA-11** cannot be adjudicated independently: the claimed unchanged `urlsplit` import is in an unembedded upstream module. D13c does add a forwarder failure case, so the test-gap response is visible. I do not treat the missing import hunk as proof that the import is absent.

## 5. Seams and upgrade behaviour

| Seam | Assumptions and assessment |
|---|---|
| **IMAGES ↔ CTL exit protocol** | Both sides agree in this diff: 0 means complete, 3 means only a verify slice remains, and other exits fail the pass. They must ship together with the patched client providing `png_problem` and image outcomes. Compatibility of a mixed installed version is not demonstrated. |
| **Summary ↔ interface** | CTL now emits null unlock counts. The consumer must preserve “unknown,” including aggregates, rather than turn null into zero. No interface consumer is embedded. The report identifies this handoff, but does not prove the integrated result. |
| **Stamps/cards and scan page** | `added`, `truncated`, `SOME_IMAGES_NOT_SAVED`, and `TOOK_TOO_LONG` carry player-visible meaning. S8 supplies acceptable image-failure wording, but not the implementation of the readers or French localization. G2-D-02 makes the producer’s `added` assertion unreliable on measurement failure. |
| **Index notification ↔ interface re-indexing** | The comments now distinguish identified games that a listing can cache from unidentified games requiring another index run. That distinction is sound, but the interface’s link-return re-index mechanism is not embedded. The ctl’s notification acknowledgement additionally needs G2-D-03. |
| **Shared scripts harness** | Block D changes section-t shims and replaces helper stand-ins. Some replacements remain for later blocks. S2 explicitly calls out ordering dependence. This packet does not contain the merged harness, so its standalone reported pass count does not establish isolation from other streams. |
| **Unit ↔ launcher/interface startup** | The unit waits for an IPv4-reachable listener, and PPSSPP’s check agrees with that address family. Actual boot-to-carousel timing, dynamic enable behaviour, and a PSP launch reaching the proxy remain external proofs. |

The diff does address several inherited-state cases required by S7:

- Existing duplicate ARMSX2 sections are rewritten, not merely avoided on new files.
- An empty legacy `index-pending` still has a comparable empty token.
- `scan-cursor` remains a path record.
- Existing two-field absent records are read with the new one-day lifetime.
- Missing images and previously cached corrupt images have repair paths.

These are source-level compatibility observations, **not** a clean-install or upgrade rehearsal. In particular, existing valid cache bodies must also survive the new readiness reader; G2-D-01 shows a case that does not.

## 6. Coverage boundary and orchestrator handoff

The following were **not embedded** and should be obtained before closing the corresponding claims:

1. **Full CTL context:** the `EX_USAGE` definition, complete `history_path` consumer set, enable/stop behaviour, and omitted surrounding control flow.
2. **Pinned upstream client and complete applied patch series:** storage method behaviour, existing cached-image control flow, forwarding/import context, and all resolver callers.
3. **Complete package installation and target tooling:** notably installation of the image helper, target GNU timeout, and the applicable `packaging-and-patches.md` rule.
4. **Pinned PPSSPP source and launch evidence:** D30’s source assertions are test code, not the embedded source or a traffic trace.
5. **Interface consumers and localization:** null handling, stamp parsing, image-failure wording, truncation display, and link-return re-indexing.
6. **Target acceptance evidence:** PL-013’s two-second guest frame series; PL-059’s production-cap test and page frame; readiness/boot timing; a PSP launch through the proxy; clean-install and upgrade checks.
7. **Raw execution and decision artifacts:** the full suite output, relevant register approvals, and the integrated multi-stream harness run.

The immediate source changes to resolve are G2-D-01 through G2-D-03. G2-D-04/05 should be fixed before relying on these newly added evidence guards.

## `corpus.provenance.json`

The arrays below are parallel: entry *n* corresponds to source `[Sn]`. Hashes are the Facilitator’s **verified-at-embed-time values**, not hashes recomputed by this reviewer.

```json
{
  "packet": "D",
  "review_mode": "Static review of the eight embedded sources only",
  "filesystem_access": false,
  "tests_executed_by_reviewer": false,
  "hash_verification": "Facilitator verified at embed time; reviewer did not re-read or re-hash source files",
  "facilitator_manifest_read_timestamp_utc": "2026-09-28T13:57:25Z",
  "source_file_paths": [
    "docs/audits/2026_09_28-milestone-audit-of-the-fix-round/seats/D.diff",
    "docs/audits/2026_09_28-milestone-audit-of-the-fix-round/seats/D.report.md",
    "docs/audits/2026_09_28-milestone-audit-of-the-fix-round/seats/D.findings.md",
    "docs/audits/2026_09_28-milestone-audit-of-the-fix-round/seats/D.items.md",
    "docs/audits/2026_09_28-milestone-audit-of-the-fix-round/seats/D.plan.md",
    ".claude/rules/engineering-practices.md",
    ".claude/rules/upgrade-and-install.md",
    ".claude/rules/es-player-text.md"
  ],
  "source_file_hashes": [
    "6dd9fba5c70f6232ba51459b6ab266866044e967c62f4445c42f6455979aae42",
    "bc0e8b9c84ed19e6dbd732cd93b72c5684003d8bc8536d5f20106ed5da05ca7c",
    "22e73ae36c18f1ffc08cacbc8afa9e2a9953b4668a37ab0561101a64edba580e",
    "952bba65f60bb0eea05f0eea27915629e533422925f37782d522966a477f6d0b",
    "4054dbd2c65e37b6b8bb6697f10430e50a103ca281ab55be7666684a1080ef4e",
    "7f1eb012edc986ee2975abacb44f1a662f2a111a6ded1a1a623a84af509eef7d",
    "d79a1084e85117ba566d23af7fbf3633c44290a6c490f9125e1fd9df061f8cfd",
    "c401103eba4ada9d0e757a2b8522e7ed9558a17eb4da72b65615795163f33c86"
  ],
  "unembedded_sources_needed": [
    "Complete post-change control script and harness context outside the supplied hunks",
    "Pinned upstream raofflineproxy sources and complete applied patch series",
    "Complete package installation recipe, target tool inventory, and packaging-and-patches.md",
    "Pinned PPSSPP source cited by D30",
    "Interface consumers, localization, and integrated multi-stream harness",
    "Guest acceptance artifacts, raw test execution logs, upgrade rehearsal, and relevant decision-register approvals"
  ],
  "gap_handling": "Missing evidence is identified in the audit; no paths, hashes, source contents, or execution results were fabricated for it"
}
```