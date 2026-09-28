# Punch List — the fix audit of #307/#308: what the round leaves for the next
**Generated:** 2026-09-28
**Source Audit:** `docs/audits/2026_09_28-milestone-audit-of-the-fixes-307/04-analysis.md`
**Total Items:** 14 (Critical: 0, High: 0, Medium: 9, Low: 5). PL-007..PL-013 (2026-09-28, 06:4x UTC) are the eleven sweep rows of #308 that no stream answered, carried here so #308 can close on the build that carries the rest. The 165 seat findings themselves were resolved by the streams in the same day (fixed with a case first, or withdrawn with the refuting line -- `02-forward-audit.md` § Verification and the streams' follow-up reports); what is here is what the streams named as beyond their findings, and what the orchestrator carried.
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
- **Severity:** Medium (raised from Low on the second opinion: the destructive-operation, credential and lifetime follow-ups are reviewed before the candidate is approved)
- **Category:** Process (D-WORKFLOW-059)
- **Source Finding:** `04-analysis.md` § Coverage boundary
- **Owner area:** the next audit
- **Where:** `docs/audits/` (the next audit's packets)
- **What:** the ~100 follow-up commits the streams made in answer to this audit had the orchestrator's read and no seat. The next audit's packets are the branches' whole diffs from `417dcd8610` (D-WORKFLOW-058), which carries the follow-ups.
- **Acceptance:** the next audit's `01-research-notes.md` names the follow-up ranges as in scope, and each seat's coverage boundary confirms it saw them.

## Low Priority (carried from #308's unanswered rows)

## PL-007: The sign-in window names console letters and ignores the player's bindings
- **Severity:** Medium
- **Category:** Player text / controls
- **Source Finding:** #308 rows 3-rclone-setup claude F-RS-10; 3-rclone-setup gpt F-RS-15; 8b-es-core gpt F-ES-13
- **Owner area:** cloud_oauth (the window) and EmulationStation
- **Where:** projects/ROCKNIX/packages/network/rclone/sources/cloud_oauth; es-app/src/guis/GuiCloudOAuth*.cpp
- **What:** the sign-in window's help bar hard-codes CHOOSE WITH A and a Nintendo layout, and the window reads a fixed binding rather than the player's es_input.cfg (es-ui-style-guide.md, Interaction rules: never a console letter).
- **Acceptance:** the help bar names buttons by position from the player's own bindings (a doctest over the label builder; a 640x480 frame with swapped buttons); the binding the window must honour on the RG35XX SP is the board's own pad, a fact the VM cannot have (its es_input.cfg entry, read once from the device into a docs/releases/device-facts.md row; D-QA-015)

## PL-008: The RetroAchievements web API key's exclusion from settings backups is asserted, not shown
- **Severity:** Low
- **Category:** Backup / credentials
- **Source Finding:** #308 rows 1-raoffline claude F-RA-21
- **Owner area:** backuptool
- **Where:** projects/ROCKNIX/packages/rocknix/sources/scripts/backuptool
- **What:** "held back from backups like the password" is asserted for the new web API key; no case shows an archive made with a key set omits it.
- **Acceptance:** a harness case backs up a config carrying a web API key and asserts the archive holds no y= value and the sign-in scan names none (PASS line); on the VM, a backup with the QA account's key set, the archive read with tar -tzf and grep, the key absent

## PL-009: The hash-library fetch still blocks the interface thread
- **Severity:** Medium
- **Category:** Interface thread
- **Source Finding:** #308 rows 1-raoffline gpt F-RA-21
- **Owner area:** EmulationStation, ThreadedHasher
- **Where:** es-app/src/ThreadedHasher.cpp
- **What:** the library fetch at a game-list update holds the interface thread for up to about 40 s on a slow link (E2 row 43); #300's follow-up; the back-off c48d8d469 limits repeats meanwhile.
- **Acceptance:** the fetch runs off the interface thread with the card reporting it; a VM run with the link throttled shows the carousel answering input during the fetch (frames), and the hasher's log line

## PL-010: Core-pin generation does not establish that the listed cores were installed
- **Severity:** Medium
- **Category:** Build correctness
- **Source Finding:** #308 rows 10-packages-and-build gpt F-PB-25
- **Owner area:** virtual/emulators
- **Where:** projects/ROCKNIX/packages/virtual/emulators/package.mk
- **What:** the generated core pins name cores whose install is never checked, so a missing core is discovered at launch.
- **Acceptance:** the recipe fails when a pinned core's install tree is absent (a constructed miss fails the build; tools/pkgcheck clean); the build log's line cited

## PL-011: The sign-in window's WebKit engine runs unsandboxed as root
- **Severity:** Medium
- **Category:** Sandbox
- **Source Finding:** #308 rows 3-rclone-setup claude F-RS-11; 3-rclone-setup gpt F-RS-24
- **Owner area:** webkitgtk, the sign-in window
- **Where:** packages/... webkitgtk; bubblewrap and xdg-dbus-proxy (new packages); projects/ROCKNIX/packages/network/rclone/sources/cloud_oauth
- **What:** the remote-content renderer is built without its sandbox and the whole engine runs as root; a register row decides whether the fork carries bubblewrap and xdg-dbus-proxy for it.
- **Acceptance:** a register row (the decision either way); if carried: the packages build, the window's renderer runs under the sandbox (the process tree on a guest, read over ssh), a sign-in against the QA backend completes

## PL-012: rclone-cloud-sync.md has drifted from the scripts
- **Severity:** Low
- **Category:** Documentation
- **Source Finding:** #308 rows 5-cloud-sync-and-saves claude F-CS-28
- **Owner area:** .claude/rules/rclone-cloud-sync.md
- **Where:** .claude/rules/rclone-cloud-sync.md
- **What:** three streams (E1, A, C) flagged the rule file's drift for the integrator; the section added on 2026-09-28 covers the fixes' quiet behaviour, not the rest.
- **Acceptance:** each sentence of the rule file that names a script's behaviour is checked against the script on 1b0d233657 and corrected or dated; tools/rules-check clean; the checked sentences listed in the commit

## PL-013: No stall ceiling on the content transfers
- **Severity:** Medium
- **Category:** Bounded time
- **Source Finding:** #308 rows 5-cloud-sync-and-saves gpt F-CS-34; 7-generic-x64-vm gpt F-VM-18
- **Owner area:** cloud_content_backup / cloud_content_restore; the guest's watchdog policy
- **Where:** projects/ROCKNIX/packages/network/rclone/sources/cloud_content_*; projects/ROCKNIX/devices/GENERIC_X64 (the watchdog units)
- **What:** the automatic sync's ceilings (f987fccf2f) do not cover the deliberate content transfers, which can stall without end on a dead link; separately, F-VM-18: the supplied watchdog policy on the guest contradicts the claimed recovery behaviour (F1 never answered).
- **Acceptance:** a content transfer against the dead-port backend ends within the stated ceiling with COULDN'T FINISH and its why (a harness case with the dead port; the transfer page's frame); the watchdog policy and the claim agree, with the unit's lines cited

## PL-014: The sign-in window's two-label domain suffix against a real provider
- **Severity:** Medium
- **Category:** Sign-in (a device or account fact)
- **Source Finding:** #308 row 3-rclone-setup claude F-RS-12
- **Owner area:** cloud_oauth (the window's frame filter)
- **Where:** projects/ROCKNIX/packages/network/rclone/sources/cloud_oauth
- **What:** the window's frame filter allows a hop only within the provider's two-label domain suffix; a provider whose sign-in steps through a sibling domain (OneDrive personal's live.com and microsoft.com) may be refused mid-flow. The QA backends cannot show it; only a real account can.
- **Acceptance:** a sign-in to OneDrive personal from a guest on the maintainer's QA account (D-QA-016; never their own) completes, or the refused hop is named and the filter widened for it; the window's log line cited; if no such account exists, a `docs/releases/device-facts.md` row records the gap.

## Phase 7 resolution gate

Recorded per item as it is resolved: the outcome (resolved / deferred / rejected), the commit or issue, the evidence. Open until then.

| Item | Severity | Outcome | Evidence |
| --- | --- | --- | --- |
| PL-001 | Medium | Deferred | carried to the next round on #309 (one checkbox per item); nothing blocks the candidate |
| PL-002 | Medium | Deferred | carried to the next round on #309 (one checkbox per item); nothing blocks the candidate |
| PL-003 | Low | Deferred | carried to the next round on #309 (one checkbox per item); nothing blocks the candidate |
| PL-004 | Low | Deferred | carried to the next round on #309 (one checkbox per item); nothing blocks the candidate |
| PL-005 | Low | Deferred | carried to the next round on #309 (one checkbox per item); nothing blocks the candidate |
| PL-006 | Medium | Deferred | carried to the next round on #309 (one checkbox per item); nothing blocks the candidate |
| PL-007 | Medium | Deferred | carried to the next round on #309 (one checkbox per item); a #308 row no stream answered |
| PL-008 | Low | Deferred | carried to the next round on #309 (one checkbox per item); a #308 row no stream answered |
| PL-009 | Medium | Deferred | carried to the next round on #309 (one checkbox per item); a #308 row no stream answered |
| PL-010 | Medium | Deferred | carried to the next round on #309 (one checkbox per item); a #308 row no stream answered |
| PL-011 | Medium | Deferred | carried to the next round on #309 (one checkbox per item); a #308 row no stream answered |
| PL-012 | Low | Deferred | carried to the next round on #309 (one checkbox per item); a #308 row no stream answered |
| PL-013 | Medium | Deferred | carried to the next round on #309 (one checkbox per item); a #308 row no stream answered |
| PL-014 | Medium | Deferred | carried to the next round on #309 (one checkbox per item); a #308 row no stream answered |

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
  severity: Medium
  category: "Process"
  source_finding: "04-analysis.md coverage boundary (D-WORKFLOW-059)"
  owner_area: "the next audit"
  where: "docs/audits/"
  acceptance: "the next audit's packets are the branches' whole diffs and name the follow-up ranges as in scope"
  outcome: deferred
  outcome_ref: "#309"
- id: PL-007
  severity: Medium
  category: "Player text / controls"
  source_finding: "#308 rows 3-rclone-setup claude F-RS-10; 3-rclone-setup gpt F-RS-15; 8b-es-core gpt F-ES-13"
  owner_area: "cloud_oauth (the window) and EmulationStation"
  where: "projects/ROCKNIX/packages/network/rclone/sources/cloud_oauth; es-app/src/guis/GuiCloudOAuth*.cpp"
  acceptance: "the help bar names buttons by position from the player's own bindings (a doctest over the label builder; a 640x480 frame with swapped buttons); the binding the window must honour on the RG35XX SP is the board's own pad, a fact the VM cannot have (its es_input.cfg entry, read once from the device into a docs/releases/device-facts.md row; D-QA-015)"
  outcome: deferred
  outcome_ref: "#309"
- id: PL-008
  severity: Low
  category: "Backup / credentials"
  source_finding: "#308 rows 1-raoffline claude F-RA-21"
  owner_area: "backuptool"
  where: "projects/ROCKNIX/packages/rocknix/sources/scripts/backuptool"
  acceptance: "a harness case backs up a config carrying a web API key and asserts the archive holds no y= value and the sign-in scan names none (PASS line); on the VM, a backup with the QA account's key set, the archive read with tar -tzf and grep, the key absent"
  outcome: deferred
  outcome_ref: "#309"
- id: PL-009
  severity: Medium
  category: "Interface thread"
  source_finding: "#308 rows 1-raoffline gpt F-RA-21"
  owner_area: "EmulationStation, ThreadedHasher"
  where: "es-app/src/ThreadedHasher.cpp"
  acceptance: "the fetch runs off the interface thread with the card reporting it; a VM run with the link throttled shows the carousel answering input during the fetch (frames), and the hasher's log line"
  outcome: deferred
  outcome_ref: "#309"
- id: PL-010
  severity: Medium
  category: "Build correctness"
  source_finding: "#308 rows 10-packages-and-build gpt F-PB-25"
  owner_area: "virtual/emulators"
  where: "projects/ROCKNIX/packages/virtual/emulators/package.mk"
  acceptance: "the recipe fails when a pinned core's install tree is absent (a constructed miss fails the build; tools/pkgcheck clean); the build log's line cited"
  outcome: deferred
  outcome_ref: "#309"
- id: PL-011
  severity: Medium
  category: "Sandbox"
  source_finding: "#308 rows 3-rclone-setup claude F-RS-11; 3-rclone-setup gpt F-RS-24"
  owner_area: "webkitgtk, the sign-in window"
  where: "packages/... webkitgtk; bubblewrap and xdg-dbus-proxy (new packages); projects/ROCKNIX/packages/network/rclone/sources/cloud_oauth"
  acceptance: "a register row (the decision either way); if carried: the packages build, the window's renderer runs under the sandbox (the process tree on a guest, read over ssh), a sign-in against the QA backend completes"
  outcome: deferred
  outcome_ref: "#309"
- id: PL-012
  severity: Low
  category: "Documentation"
  source_finding: "#308 rows 5-cloud-sync-and-saves claude F-CS-28"
  owner_area: ".claude/rules/rclone-cloud-sync.md"
  where: ".claude/rules/rclone-cloud-sync.md"
  acceptance: "each sentence of the rule file that names a script's behaviour is checked against the script on 1b0d233657 and corrected or dated; tools/rules-check clean; the checked sentences listed in the commit"
  outcome: deferred
  outcome_ref: "#309"
- id: PL-013
  severity: Medium
  category: "Bounded time"
  source_finding: "#308 rows 5-cloud-sync-and-saves gpt F-CS-34; 7-generic-x64-vm gpt F-VM-18"
  owner_area: "cloud_content_backup / cloud_content_restore; the guest's watchdog policy"
  where: "projects/ROCKNIX/packages/network/rclone/sources/cloud_content_*; projects/ROCKNIX/devices/GENERIC_X64 (the watchdog units)"
  acceptance: "a content transfer against the dead-port backend ends within the stated ceiling with COULDN'T FINISH and its why (a harness case with the dead port; the transfer page's frame); the watchdog policy and the claim agree, with the unit's lines cited"
  outcome: deferred
  outcome_ref: "#309"
- id: PL-014
  severity: Medium
  category: "Sign-in (a device or account fact)"
  source_finding: "#308 row 3-rclone-setup claude F-RS-12"
  owner_area: "cloud_oauth"
  where: "projects/ROCKNIX/packages/network/rclone/sources/cloud_oauth"
  acceptance: "a OneDrive personal sign-in from a guest on a QA account completes or the refused hop is named and the filter widened; else a device-facts row records the gap"
  outcome: deferred
  outcome_ref: "#309"
```
