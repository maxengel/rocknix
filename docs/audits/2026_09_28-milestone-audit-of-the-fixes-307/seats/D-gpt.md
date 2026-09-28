# Stream D audit

**The packet does not support unconditional closure of the stream.** Most named mechanisms are present, but image-pass failures can still become successful outcomes, the listener check accepts an endpoint that cannot serve the configured IPv4 connection, and several new bookkeeping paths remain unsound.

I reviewed the embedded diff and harness, not filesystem copies, and executed no tests. The report’s final **469 PASS / 0 FAIL** remains a reported result, not independently observed evidence. [S4]

Citations **S1–S8** resolve to the declared source paths and Facilitator-verified SHA-256 values recorded in `corpus.provenance.json` below. Diff locations use the supplied hunk headers rather than reconstructed line numbers.

## 1. Punch-item verdicts

### PL-013 — **holds in part**

The cancellation mechanism is present:

- `raofflineproxy-cache-images` replaces the executor context manager with explicit shutdown, cancels queued futures on `KeyboardInterrupt`, and uses `os._exit()` to avoid waiting for running workers.
- It restores the SIGINT handler for background execution.
- `run_image_pass` backgrounds the process, records `CLIENT`, and waits, allowing the control script’s traps to act promptly.

See S1, helper hunks `@@ -314,9 +374,16 @@` and `@@ -328,36 +395,84 @@`, and ctl hunk `@@ -1310,19 +1635,50 @@`.

D1 meaningfully exercises the helper and control-script cancellation paths, but separately, with substituted downloads or a substituted image helper. The required **guest frame series showing closure within two seconds** is absent. That is an outstanding integration acceptance, not a claim that the stream should have violated its prohibition on VM work. [S2, D1; S3, PL-013]

### PL-055 — **holds for the stated failed-listing acceptance**

`LISTED=1` is assigned only after `list_jobs` returns zero. Removal now occurs after the indexed pass and requires `LISTED=1` and an empty `WHY`, rather than preceding the listing.

See S1, ctl hunks `@@ -1581,13 +1980,18 @@` and `@@ -1619,6 +2025,14 @@`.

D2 asserts retention after listing failure, timeout, failed game, and interruption. Its coverage matches the stated acceptance. A separate concurrent-marker replacement problem remains: **G-D-03**.

### PL-057 — **holds at the producer/protocol boundary**

The summary enumerates `achievementsets:` as well as `patch:` rows, deduplicates by game ID, and uses `None` for missing or unreadable unlock data. JSON serialization therefore emits `null`, rather than zero.

See S1, ctl hunks `@@ -588,14 +649,43 @@` and `@@ -603,24 +693,43 @@`. D3 asserts a launch-only game and both missing and malformed unlock rows. [S2]

The EmulationStation consumer is not embedded. I cannot confirm that it preserves and displays “unknown”; the report’s statement about its `jsonInt` behavior is not a substitute for that source. [S4]

### PL-058 — **holds for the named exception path**

`drop_startsession` now raises instead of swallowing deletion exceptions. `done += 1` remains after the drop, and the surrounding failure handler increments `failed`.

See S1, refresh hunks `@@ -81,7 +87,7 @@`, `@@ -199,6 +209,7 @@`, and `@@ -214,8 +225,9 @@`. D4 injects a deletion exception and asserts zero games re-read and one failed. [S2]

This does not independently establish the unembedded `Storage.delete_cache` implementation’s failure contract.

### PL-059 — **holds in part**

The circular walk, persisted cursor, `note TRUNCATED`, and `truncated=1` stamp are present. D5 exercises nominal continuation using a cap of ten over thirteen uncacheable files.

See S1, ctl hunks `@@ -1106,10 +1387,46 @@`, `@@ -1126,28 +1443,36 @@`, and `@@ -1466,12 +1843,21 @@`.

However:

- Cursor write failures are silently ignored, restoring the repeated-first-slice failure: **G-D-06**.
- The literal 5,001-file run and required page frame are not supplied. The scaled test is useful algorithmic coverage, but not the complete stated acceptance. [S2, D5; S3, PL-059]

### PL-060 — **holds in part**

The ordinary invoked-pass paths are improved correctly:

- Helper exits other than 0 and 3 produce `SOME_IMAGES_NOT_SAVED`.
- The `NEW=0` scan branch invokes the pass.
- Exit 3 distinguishes unfinished verification from a crash.
- Patch 016 and the absence ledger distinguish 404/410 from transient failures.

See S1, ctl hunks beginning at new ranges `+1635`, `+1803`, and `+2091`, and the new patch 016. D6, D6b, and D19 target these distinctions. [S2]

But success is still reachable without performing or establishing completion of the image work: **G-D-01**.

## 2. Findings

### G-D-01: A scan can still complete without attempting its missing images

- **Severity:** Medium
- **Category:** Correctness / outcome reporting
- **Where:** `projects/ROCKNIX/packages/network/raofflineproxy/sources/raofflineproxy-ctl`; S1 hunks `@@ -1310,19 +1635,50 @@` and `@@ -1466,12 +1843,21 @@`.
- **What:** The fix propagates an invoked helper’s failure, but still treats several forms of *not invoking the helper* as success.
- **Failure scenario:** A store has missing badges, and the ROM library contains an uncached game RetroAchievements does not recognize. The listing has `NEW>0`; every job is skipped; `R_CACHED=0`. The scan bypasses both the new `NEW=0` repair branch and the image-pass call guarded by `R_CACHED>0`. Repeated scans can therefore report completion without repairing the badges.
  
  Separately, a top-up reaching the image phase with ten seconds or less remaining returns success from `run_image_pass` without checking the images.
- **Evidence:** The scan tail retains:
  ```bash
  [ "${R_CACHED}" -gt 0 ] && run_image_pass scan "${IMAGE_PASS_SECONDS}"
  ```
  `run_image_pass` first clears `R_IMAGES_WHY`, then returns zero when the helper is unavailable or the remaining budget is not greater than ten. Neither branch establishes that no image work remains.

  I looked for an unconditional repair pass, a positive completeness check before those returns, or an incomplete verdict for skipped work; none appears in these paths. D6 tests a retry with `NEW=0`, not a retry containing only uncacheable jobs. D17 checks process-bound invocation, not the low-budget bypass. [S2]

**Needed regression:** Retain one always-skipped ROM beside a cached game with a missing badge, then scan twice. Also exercise an image phase entered with five seconds remaining. Completion must require either completed image work or positive evidence that none is necessary.

### G-D-02: An IPv6-loopback listener is mistaken for the configured IPv4 endpoint

- **Severity:** Medium
- **Category:** Readiness / correctness
- **Where:**  
  - `projects/ROCKNIX/packages/emulators/standalone/ppsspp-sa/scripts/cheevos_ppsspp.sh`, S1 hunk `@@ -49,17 +49,48 @@`;  
  - `projects/ROCKNIX/packages/network/raofflineproxy/sources/raofflineproxy-ctl`, S1 hunk `@@ -772,6 +890,88 @@`.
- **What:** Both socket-table readers accept a listener bound to `::1:8080` as proof that `127.0.0.1:8080` is listening. Those are different endpoints. A socket bound specifically to `::1` does not accept an IPv4 connection to `127.0.0.1`.
- **Failure scenario:** Only an IPv6-loopback listener exists during the check. The ctl reports readiness, and PPSSPP writes `AchievementsHost = 127.0.0.1:8080`; the ensuing IPv4 connection is refused. An IPv6 wildcard listener with `IPV6_V6ONLY` also makes the wildcard match insufficient proof.
- **Evidence:** Both case statements accept:
  ```text
  00000000000000000000000001000000:1F90
  ```
  while the selected emulator host remains `127.0.0.1:8080`. There is no IPv4 endpoint confirmation. D12b and D15 explicitly assert the incorrect `::1`-implies-IPv4-readiness behavior, so these tests reinforce rather than detect the defect. [S2]

**Needed regression:** Test the actual address-family boundary, including an IPv6-only listener, and require readiness for the endpoint the emulator will actually use.

### G-D-03: An older top-up can acknowledge a newer index notification

- **Severity:** Medium
- **Category:** Concurrency / lost work notification
- **Where:** `projects/ROCKNIX/packages/network/raofflineproxy/sources/raofflineproxy-ctl`; S1 hunks `@@ -1483,8 +1869,12 @@` and `@@ -1619,6 +2025,14 @@`.
- **What:** Marker removal is delayed appropriately, but it is not tied to the marker generation whose listing was processed.
- **Failure scenario:** A top-up lists the library and starts processing its jobs. A newer index notification then touches `index-pending`. The older top-up finishes its own jobs and removes that newly written marker, although its listing did not include the newer index’s work.
- **Evidence:** `do_index_offline` writes the marker with `touch`. A successful top-up later checks only:
  ```bash
  [ "${LISTED}" -eq 1 ] && [ -z "${WHY}" ] && [ -e "${INDEX_PENDING}" ]
  ```
  and unconditionally removes the path. No captured generation, identity, or timestamp participates in the acknowledgement. The earlier `PENDING_DUE` timestamp comparison controls admission, not which event may be acknowledged.

  D2 covers retained markers after failures and stops, but not replacement during a successful run. [S2]

This is conditional on concurrent notification being reachable. Serialization outside the shown functions would refute that reachability, but such evidence is not included. The acknowledgement itself is demonstrably unversioned.

**Needed regression:** Write a second marker after listing but before job completion; completion of the first run must not consume the second notification.

### G-D-04: “Added” still counts an already-cached launch-only game as new

- **Severity:** Medium
- **Category:** Correctness / player-facing counts
- **Where:** `projects/ROCKNIX/packages/network/raofflineproxy/sources/raofflineproxy-ctl`; S1 hunks `@@ -772,6 +890,88 @@` and `@@ -1656,9 +2070,14 @@`.
- **What:** `ready_games_into` defines the before/after set solely as the intersection of patch IDs and unlock IDs. It excludes the launch-only games this same diff now recognizes in `summary`.
- **Failure scenario:** Start with D3’s game 201: a valid account-owned `achievementsets:` row and unlock row, but no patch. The summary already lists that cached game. A later top-up adds its patch row. The before set excludes 201 and the after set includes it, producing `added=1` even though the game was already present and usable from the launch cache.
- **Evidence:** The ready query selects only `patch:%` and `unlocks:%` and prints `patch & unlocks`; it never considers `achievementsets:`. Conversely, the new summary path explicitly supports that existing cache shape, and D3 constructs it. D9 tests a second dump with patch/unlock rows already present, not this alternative existing-game shape. [S1; S2]

The player-text rule reserves “N MORE GAMES ARE READY” for games new to the store. [S8, D-UI-107]

**Needed regression:** Combine D3’s launch-only fixture with D9’s before/after count test. Align the count with the account-scoped logical game/readiness model, rather than requiring one particular API-row shape.

### G-D-05: A failed ready-set comparison can become an authoritative zero

- **Severity:** Low
- **Category:** Guard failure / measurement
- **Where:** `projects/ROCKNIX/packages/network/raofflineproxy/sources/raofflineproxy-ctl`, `games_made_ready`; S1 hunk `@@ -772,6 +890,88 @@`.
- **What:** The function promises to print nothing when either input cannot be read, allowing the caller’s fallback count. Instead, it accepts numeric output without checking the comparison’s success.
- **Failure scenario:** The first grep encounters an I/O error reading a comparison file. It emits no matching lines; the second grep prints `0`; the function accepts that number and returns success. The caller replaces its fallback with a false zero.
- **Evidence:**
  ```bash
  N="$(grep -vxF -f "$1" "$2" 2>/dev/null | grep -c .)"
  case "${N}" in ''|*[!0-9]*) return 1 ;; esac
  echo "${N}"
  ```
  The preceding `-e` checks establish existence, not a successful read. No pipeline-status check distinguishes “no new IDs” from a failed producer. This is the failed-producer-as-zero pattern explicitly covered by the engineering rule. [S5, “Guards must fail closed”]

**Needed regression:** Inject a read/comparison error and assert failure with no numeric result, preserving the caller’s fallback.

### G-D-06: Failure to save the scan cursor silently restores first-slice starvation

- **Severity:** Medium
- **Category:** Persistence / recovery
- **Where:** `projects/ROCKNIX/packages/network/raofflineproxy/sources/raofflineproxy-ctl`, embedded Python `write_cursor`; S1 hunks `@@ -1106,10 +1387,46 @@` and `@@ -1126,28 +1443,36 @@`.
- **What:** Cursor persistence is essential to the fix, but all its filesystem errors are swallowed.
- **Failure scenario:** The library exceeds the cap and the attempted ROMs remain uncached. Replacing `scan-cursor` fails. The listing still succeeds and advertises truncation; the next scan starts from the absent or stale cursor and selects the same slice. The advice to scan again does not achieve continuation.
- **Evidence:**
  ```python
  except OSError:
      pass
  ```
  The caller invokes `write_cursor(...)` without receiving or checking a result. There is no failure verdict or even diagnostic for this write, unlike the image helper’s cursor writer. D5 exercises only successful persistence. [S2]

Atomic replacement protects the old record when replacement fails, but does not make the new progress durable. Reporting must distinguish those states. [S5, “Verify the artifact”; S6, “Migrations”]

**Needed regression:** Force only the cursor replacement to fail. Do not report continuation as successfully recorded; propagate the failure while preserving the previous valid cursor.

## 3. Sweep spot-checks

These are static checks against the diff and assertions, not confirmations of the reported executions.

| Sweep row(s) | Assessment |
|---|---|
| **gpt F-RA-09** — award ownership | Normal configured-account path matches the fix: both readers parse `u=` from query/body and filter owners. D3b tests both locations and excludes another account. [S1, `do_pending_ids` / `do_summary`; S2, D3b] |
| **claude F-RA-12 / gpt F-RA-19** — consecutive failures | Matches: separate `in_a_row`, reset after a successful game, increment on failure, stop at three. D4b distinguishes separated from consecutive failures. [S1; S2] |
| **claude F-RA-13 / gpt F-RA-12** — PNG verification | The specific fixes are present: the chunk walk terminates at IEND rather than a fixed trailer position, and cached-file verification calls the same validator. D13b exercises trailing bytes, bad CRC, and damaged compressed data. This is not proof of complete PNG-format conformance. [S1; S2] |
| **gpt F-RA-18** — disable restoration | Matches the stated write-failure cases: read back toggle before stopping; read back hardcore before removing its restoration record. D11 injects both failures. [S1; S2] |
| **gpt F-RA-27** — upload consent | Matches: `is True` rejects truthy strings and integer 1. D13a asserts the distinction. [S1; S2] |
| **claude F-RA-23 / gpt F-RA-24** — dependencies | Required dependency names are added. This satisfies the declaration aspect of the packaging rule; actual image tool provisioning and the reported pkgcheck execution are not independently established. [S1; S2, D16; S7] |
| **claude F-RA-20** — systemd start limits | Matches: `StartLimitIntervalSec` and `StartLimitBurst` are in `[Unit]`, removed from `[Service]`. D12a checks those sections. [S1; S2] |
| **gpt F-RA-26 / claude F-EM-04** — readiness/socket probing | Partial: the wait and tool-independent table readers are present, but their address-family assertion is wrong; **G-D-02**. [S1; S2] |
| **claude F-RA-10 / gpt F-RA-15** — added count | Partial: before/after comparison replaces operation counting, but misses launch-only existing games and can hide comparison errors; **G-D-04/05**. [S1; S2] |
| **gpt F-RA-20** — second DNS lookup | The fresh same-host answer path is implemented, including port substitution; D13c targets it. Full resolver-wrapper compatibility, redirects, other hosts, and the complete patched call sites are outside the supplied diff. [S1; S2] |
| **gpt F-RA-10** — helper budgets | Executor waiting is bounded and process wrappers are added. D17’s ctl assertions establish passage through a timeout shim, not an actual GNU-timeout process-tree test. [S1; S2] |
| **claude F-RA-17 follow-up** — usage | Present: `summary` is in the usage line and D20 checks it. The report’s earlier “not done” paragraph is superseded. [S1; S2; S4] |

### Withdrawals and unsupported closures

- **claude F-RA-11, import half:** **cannot tell** whether withdrawal is justified. The asserted `proxy_service.py:14` import is not embedded. D13c is a useful test capable of exposing a missing import, but its successful execution is only reported. [S2; S4]
- **claude F-RA-06, custom-base interpretation:** the added merge implementation is visible, but the claim that it exactly mirrors EmulationStation’s base-selection and merge rules cannot be checked without that implementation.
- **ARMSX2 F-EM-03 / F-EM-05 / F-EM-09:** **cannot tell**. D14 and the report describe the rewrite, but **no ARMSX2 implementation or ARMSX2 diff hunk appears in the embedded `D.diff`**. This could be a packet or integration/history issue; the packet cannot distinguish them. The orchestrator should obtain the integrated implementation and reconcile it with the claimed commit before closing these rows.
- **PPSSPP F-EM-07:** the added source citation is visible, not the cited upstream implementation. Consumption of `AchievementsHost` and a launch through the proxy remain unverified here.

## 4. Coverage boundary and handoff

The orchestrator still needs:

1. **The missing ARMSX2 source evidence**, explicitly identified above.
2. **Unshown surrounding code and callees:** complete ctl lifecycle/serialization context, pinned patched client implementations, and the full harness/shims. In particular, external serialization could settle G-D-03’s reachability.
3. **EmulationStation consumers:** unknown-unlock handling, `SOME_IMAGES_NOT_SAVED` mapping, truncation display, and offline-index retry behavior. The supplied player-text rule names the proposed image-failure sentence, but does not prove consumer implementation. [S8]
4. **Runtime acceptance:** cancellation frames, truncation frames, PPSSPP traffic, actual systemd readiness/boot behavior, and real process-bound tests.
5. **Persistent-state fault coverage:** failed cursor/absence-ledger writes and the 30-day absence recheck are not exercised by the supplied cases. An absent ledger on first use is handled, but that is not an upgrade or failure rehearsal.
6. **Decision-register material:** the referenced register itself was not embedded; I have not treated its cited row numbers as independently read decisions.

## `corpus.provenance.json`

The following is the provenance artifact content, supplied inline because this review has no filesystem access. Citation IDs, paths, and hashes are positionally aligned.

```json
{
  "corpus_name": "Council Facilitator — council-facilitator@1.2.0",
  "audit_scope": "Stream D audit of fixes, #307 / #308",
  "access_mode": "embedded prompt contents only",
  "verification_basis": "SHA-256 values were verified by the Facilitator at embed time and supplied in the source headers.",
  "independent_filesystem_reads": false,
  "independent_hash_computation": false,
  "independent_test_execution": false,
  "manifest_read_timestamp_utc": "2026-09-28T04:20:24Z",
  "citation_ids": [
    "S1",
    "S2",
    "S3",
    "S4",
    "S5",
    "S6",
    "S7",
    "S8"
  ],
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
  "source_hash_status": "verified at embed time by the Facilitator; not independently re-hashed",
  "missing_or_partial_sources": [
    {
      "path": "projects/ROCKNIX/packages/emulators/standalone/armsx2-sa/scripts/cheevos_armsx2.sh",
      "sha256": null,
      "availability": "not embedded",
      "gap": "D14 and the report claim changes, but the implementation and its diff hunk are absent from the supplied corpus."
    },
    {
      "path": "projects/ROCKNIX/packages/network/raofflineproxy/sources/raofflineproxy-ctl",
      "sha256": null,
      "availability": "changed regions and context available through D.diff only",
      "gap": "Unshown surrounding lifecycle, serialization, and helper definitions cannot be independently checked."
    },
    {
      "path": "tools/last-good-scripts-test",
      "sha256": null,
      "availability": "stream D block embedded separately",
      "gap": "Full runner, earlier sections, and original shim implementations are not embedded."
    },
    {
      "path": "docs/decision-register.md",
      "sha256": null,
      "availability": "not embedded",
      "gap": "Referenced decision rows were not independently read."
    },
    {
      "path": null,
      "sha256": null,
      "availability": "not embedded",
      "gap": "Pinned patched RAOfflineProxy client implementations and the upstream PPSSPP files cited by the added comment."
    },
    {
      "path": null,
      "sha256": null,
      "availability": "not embedded",
      "gap": "EmulationStation implementations consuming summary values, outcome tokens, truncation, and index notifications."
    }
  ],
  "additional_evidence_missing": [
    "Independently inspectable complete test-run output",
    "Required guest cancellation and truncation frame evidence",
    "PPSSPP-through-proxy runtime evidence",
    "Systemd readiness and actual timeout process-tree evidence",
    "Clean-install and retained-storage upgrade rehearsal evidence"
  ]
}
```