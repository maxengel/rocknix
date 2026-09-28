# Punch List — the fix audit of #307/#308: what the round leaves for the next
**Generated:** 2026-09-28
**Source Audit:** `docs/audits/2026_09_28-milestone-audit-of-the-fixes-307/04-analysis.md`
**Total Items:** 6 (Critical: 0, High: 0, Medium: 2, Low: 4). The 165 seat findings themselves were resolved by the streams in the same day (fixed with a case first, or withdrawn with the refuting line -- `02-forward-audit.md` § Verification and the streams' follow-up reports); what is here is what the streams named as beyond their findings, and what the orchestrator carried.
---

## Instructions for Executing Agent

Each item is one change with its acceptance named. None blocks the candidate: the two Mediums are lifetime and design questions the round chose not to open, and the Lows are hand-offs between streams. They are worked in the next round, after the candidate is cut, by whoever owns the file.

---

## Medium Priority
## PL-001: The sync card is closed by a direct call after the window may be gone
- **Severity:** Medium
- **Category:** Lifetime (use after free)
- **Source Finding:** G-E2-O3 (orchestrator, from E2's follow-up 1 note, open through follow-up 4)
- **Owner area:** EmulationStation, ThreadedCloudSync / the sync card
- **Where:** `es-app/src/ThreadedCloudSync.cpp` (the card's close at the run's end)
- **What:** the card's close is a direct call on a window the run does not own; a run that ends after the window is destroyed calls into freed memory. E2 left it because the fix is a lifetime change (a weak handle or a posted close) the round did not open.
- **Acceptance:** the close goes through a handle that knows the window is gone (`postToUiThread` with a weak pointer, as the content page's button rebuild does -- `es-code-traps.md` § Never rebuild a button bar from inside one of its buttons); `tests/cloud-oauth-lifetime.py`-style AddressSanitizer run over a sync ending after the window's destruction, clean.

## PL-002: A migration whose verification failed cannot be resumed
- **Severity:** Medium
- **Category:** Recovery
- **Source Finding:** stream A's follow-up 2, "Found while working" (not a seat finding)
- **Owner area:** cloud_migrate_layout
- **Where:** `projects/ROCKNIX/packages/network/rclone/sources/cloud_migrate_layout` (`resumable`, `relocate`)
- **What:** after G-A-01's fix a check that finds differences stops the migration before the delete, correctly; the next run then refuses the half-copied new folder (THE NEW FOLDER ALREADY HAS FILES IN IT) and the player is stuck between layouts with both copies present. Resuming needs a record on the device of what the run copied, which is a design change.
- **Acceptance:** a migration interrupted after the copy and before the delete is completed by the next run -- the record names the copied set, the check is re-run over it, and the delete follows only on exactly zero differences; a case in the A block interrupts at each step and asserts the previous state stands and the re-run finishes; `upgrade-and-install.md` § Migrating data that lives in someone's cloud cited.

## Low Priority
## PL-003: The Wi-Fi picker reads `wifictl saved --ssid`
- **Severity:** Low
- **Category:** Correctness (a name is not an SSID)
- **Source Finding:** B-gpt G-B-11 (fixed in `wifictl` by `0d2dd4da82`; the interface half is this item)
- **Owner area:** EmulationStation, WifiText / GuiWifi
- **Where:** `es-app/src/WifiText.cpp` (`parseSavedLine`), `es-app/src/guis/GuiWifi.cpp`
- **What:** `wifictl saved --ssid` prints `<name><TAB><ssid><TAB>active|saved` with a tab or backslash inside a field written as `\t` or `\\`; the picker still reads plain `saved` (name and state), so a profile whose name differs from its SSID joins by name.
- **Acceptance:** `WifiText::parseSavedLine` reads the three-column form and unescapes `\t` and `\\` (doctest cases for a tab and a backslash inside an SSID); the picker joins by SSID; French unchanged; a frame of the picker at 640x480 with a profile named differently from its SSID.

## PL-004: A null "unlocked" reads as unknown, not as zero
- **Severity:** Low
- **Category:** Player text
- **Source Finding:** stream D's follow-up 3, "For stream E2"
- **Owner area:** EmulationStation, the RetroAchievements pages / ProxyCards
- **Where:** `es-app/src/ProxyCards.cpp`, `es-app/src/guis/GuiRetroAchievementsSettings.cpp`
- **What:** the proxy's store can hold a null unlocked count for a game whose row was never compared; the page shows it as 0 OF N, which reads as a fact.
- **Acceptance:** a null count shows as a dash or NOT CHECKED YET (proposed words, D-UI-112's family), never as 0; a doctest over the formatter; a frame at 640x480.

## PL-005: Three sign-in notes without a number
- **Severity:** Low
- **Category:** Robustness
- **Source Finding:** C-gpt (under F-RS-18) and C-claude notes, left as written by stream C
- **Owner area:** cloud_oauth
- **Where:** `projects/ROCKNIX/packages/network/rclone/sources/cloud_oauth`
- **What:** no absolute limit on a sign-in request's lifetime; `page_worth_recording` does not match `[::1]` or userinfo forms (rclone's redirect is always `127.0.0.1`, so the form cannot arrive today); the "no pad found at all" half of F-RS-16.
- **Acceptance:** a request older than an absolute bound (minutes) ends with the page's why; the `[::1]` form is either matched or documented as unreachable beside the regex; the no-pad case has its own sentence; cases in the C block for each.

## PL-006: The follow-ups get a seat
- **Severity:** Low
- **Category:** Process (D-WORKFLOW-059)
- **Source Finding:** `04-analysis.md` § Coverage boundary
- **Owner area:** the next audit
- **Where:** `docs/audits/` (the next audit's packets)
- **What:** the ~100 follow-up commits the streams made in answer to this audit had the orchestrator's read and no seat. The next audit's packets are the branches' whole diffs from `417dcd8610` (D-WORKFLOW-058), which carries the follow-ups.
- **Acceptance:** the next audit's `01-research-notes.md` names the follow-up ranges as in scope, and each seat's coverage boundary confirms it saw them.

## Phase 7 resolution gate

Recorded per item as it is resolved: the outcome (resolved / deferred / rejected), the commit or issue, the evidence. Open until then.

| Item | Severity | Outcome | Evidence |
| --- | --- | --- | --- |
| PL-001 | Medium | Deferred | carried to the next round on #309 (one checkbox per item); nothing blocks the candidate |
| PL-002 | Medium | Deferred | carried to the next round on #309 (one checkbox per item); nothing blocks the candidate |
| PL-003 | Low | Deferred | carried to the next round on #309 (one checkbox per item); nothing blocks the candidate |
| PL-004 | Low | Deferred | carried to the next round on #309 (one checkbox per item); nothing blocks the candidate |
| PL-005 | Low | Deferred | carried to the next round on #309 (one checkbox per item); nothing blocks the candidate |
| PL-006 | Low | Deferred | carried to the next round on #309 (one checkbox per item); nothing blocks the candidate |

## Punch index

```yaml
punch_index:
- id: PL-001
  severity: Medium
  category: "Lifetime (use after free)"
  source_finding: "G-E2-O3 (orchestrator)"
  owner_area: "EmulationStation, ThreadedCloudSync"
  where: "es-app/src/ThreadedCloudSync.cpp"
  acceptance: "the close goes through a handle that knows the window is gone; an AddressSanitizer run over a sync ending after the window's destruction, clean"
  outcome: deferred
  outcome_ref: "#309"
- id: PL-002
  severity: Medium
  category: "Recovery"
  source_finding: "stream A follow-up 2, found while working"
  owner_area: "cloud_migrate_layout"
  where: "projects/ROCKNIX/packages/network/rclone/sources/cloud_migrate_layout"
  acceptance: "a migration interrupted between the copy and the delete is completed by the next run from a device-side record of what was copied; a case interrupts at each step"
  outcome: deferred
  outcome_ref: "#309"
- id: PL-003
  severity: Low
  category: "Correctness"
  source_finding: "B-gpt G-B-11 (the interface half)"
  owner_area: "EmulationStation, WifiText / GuiWifi"
  where: "es-app/src/WifiText.cpp, es-app/src/guis/GuiWifi.cpp"
  acceptance: "parseSavedLine reads the three-column --ssid form and unescapes; the picker joins by SSID; doctest cases; a frame at 640x480"
  outcome: deferred
  outcome_ref: "#309"
- id: PL-004
  severity: Low
  category: "Player text"
  source_finding: "stream D follow-up 3, for E2"
  owner_area: "EmulationStation, ProxyCards"
  where: "es-app/src/ProxyCards.cpp, es-app/src/guis/GuiRetroAchievementsSettings.cpp"
  acceptance: "a null unlocked count shows as unknown, never 0; a doctest; a frame"
  outcome: deferred
  outcome_ref: "#309"
- id: PL-005
  severity: Low
  category: "Robustness"
  source_finding: "C-gpt under F-RS-18; C-claude notes"
  owner_area: "cloud_oauth"
  where: "projects/ROCKNIX/packages/network/rclone/sources/cloud_oauth"
  acceptance: "an absolute request lifetime; the [::1] form matched or documented; the no-pad sentence; cases in the C block"
  outcome: deferred
  outcome_ref: "#309"
- id: PL-006
  severity: Low
  category: "Process"
  source_finding: "04-analysis.md coverage boundary (D-WORKFLOW-059)"
  owner_area: "the next audit"
  where: "docs/audits/"
  acceptance: "the next audit's packets are the branches' whole diffs and name the follow-up ranges as in scope"
  outcome: deferred
  outcome_ref: "#309"
```
