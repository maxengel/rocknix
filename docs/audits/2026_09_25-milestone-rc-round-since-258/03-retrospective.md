# Retrospective — the whole feature drop, both repositories, against upstream

**Auditor:** Code Auditor skill (milestone tier; the seats are the council's Claude and GPT, D-QA-048)
**Date:** 2026-09-28
**Subject:** the fork-only diff of the distribution (`e9ff9dbd11..7911c53bb4`) and of EmulationStation against ROCKNIX's master, read by ten packets
**Spec:** the rule files embedded in each packet and `docs/decision-register.md`; scope in `01-research-notes.md` § 1.7

---

## Running Notes

The seats' own upstream-fit and coverage sections are digested in `seats/digest-upstream-fit-and-coverage.md`
(a subagent's extraction, a lead); what follows is what survived the orchestrator's reading in
`02-forward-audit.md` § Verification, grouped the way this tier is meant to see it: across the epics.

### 3.1 Architectural coherence

- **One idea, many copies.** The seats found the same three safety ideas implemented separately in
  `backuptool`, `cloud_backup`, `cloud_restore`, `cloud_content_*`, `cloud_capture`, `cloud_migrate_layout` and
  `SystemConf`: a temp-and-rename write, a last-good record, and a "did the listing succeed" test. Each copy
  drifted on its own: the rename is unconditional after an unchecked write in `cloud_sync_helper` (F-CS-05),
  the temporary's name is shared in `AtomicFileUtil` (F-ES-01 8b), the listing's exit status is discarded in
  `cloud_migrate_layout` (F-CS-10) and read as "absent" in `cloud_content_restore --match` (F-CS-01), the
  last-good record is taken from a prefix in `SystemConf` (F-ES-04 8b). The gpt seat on bucket 5 said it in
  one line: "these copies are already diverging".
- **The fork's own contracts are the standard, and the code breaks them where the author of the rule was not
  the author of the line.** The outcome rule (a part that failed is not COMPLETED, D-UI-030) is broken by
  the settings phase hidden behind a saves exit 9 (F-CS-12), the game-list pass under `|| true` (F-CS-11),
  the image pass under `|| true` (F-RA-08), the refresh helper's `0 failed` (F-RA-06). The guards-fail-closed
  rule is broken by the lock timeout that saves anyway (F-ES-02 8b), the listing that reads as empty
  (F-CS-10), the credential scan that warns and exits 0 (F-BR-02). Least surprise is broken by a dialog that
  promises the ticks and a continuation that restores everything (F-ES-01 8a).
- **The EmulationStation half is one 3,500-line file heavier.** `GuiMenu.cpp` carries the cloud hub, the
  wizard, the pickers and the transfer flows; the seats' upstream-fit sections name it first in bucket 8,
  and the two ES findings that survived High (F-ES-01/03 8a) are in it.

### 3.2 Project conformance

| Rule | Held | Broken (verified) |
| --- | --- | --- |
| `engineering-practices.md` § Guards must fail closed | the retire path refuses what it cannot record (`cloud_capture`), `--match` asserts its excludes exist | F-CS-05, F-CS-10, F-BR-02, F-ES-02 (8b), F-RA-01, F-PB-08 |
| `es-player-text.md` § Outcome vocabulary (D-UI-030) | every card ends in one of three words | F-CS-12, F-CS-11, F-CS-19, F-RA-06, F-RA-08 |
| `least-surprise.md` (D-UI-042) | the saves-first order at the link's return (#305) | F-ES-01 (8a), F-ES-02 (8a), F-RS-08/09 (the phone page) |
| `upgrade-and-install.md` § Fixing forward is not enough | `cloud_content_restore` reads both content locations | F-ES-03 (8b: the old writer's `.tmp`), F-CS-08/09 (the migration) |
| `packaging-and-patches.md` (late binding, scoped patches) | the ppsspp move into `post_unpack` | F-VM-04 (an orphan quirk tree), F-PB-02/03 (quirks writing to a read-only `/etc`), the `cairo` override (bucket 10) |
| `fork-workflow.md` (no personal paths, no fork identifiers upstream) | the pre-push guard | decision IDs and issue numbers in comments across every bucket; `(ROCKNIX #296)` in a RetroArch runtime string (F-RW-09) |

### 3.3 Spec fidelity

The spec here is the decision register. Where a row and the code disagree after this reading:

- **D-CLOUD-053 / the retire contract:** a relative `--retire` argument is accepted and unlinked relative to
  the working directory (F-CS-04); the row says every write stays under the saves folder.
- **D-CLOUD-133 / the exit capture:** the capture is not a launch guard (F-ES-04 8a); the row assumes the
  capture has finished before the next game writes.
- **D-UI-078 / the fourth tier:** held -- no seat found a leavable long page.
- **D-UI-109 / saves first:** held on the VM (proof-298 phase B, this evening).
- **D-RA-035 / the link's return does not list the library:** the marker that makes the exception is
  consumed before the listing it exists for (F-RA-02).

### 3.4 Platform architecture conformance

- The distribution's scripts run under busybox; two seats note commands whose host and device behaviour
  differ (`unzip -t`, F-CS-17; `netstat` in `cheevos_ppsspp.sh`, bucket 9). `tools/last-good-scripts-test`
  shims the applets it knows; neither of these is in its list.
- GENERIC_X64 carries a root shell on the serial console (F-VM-03), an updater that copies nothing
  (F-VM-01/02 claude), a quirk set that writes to a read-only `/etc` (F-PB-02/03), and a second quirk tree
  nothing installs (F-VM-04). The QA device is held to a lower standard than the handhelds, which is a
  choice nobody wrote down: no register row says whether GENERIC_X64 is ever published.

### 3.5 Cross-system interaction audit

### Interaction: cloud sync × the offline achievements service
- The link's return runs saves, then the send and the top-up as one batch (D-UI-109, held on the VM); the
  send card's completion does not require the service's flush stamp (F-RA-01), so the two subsystems agree
  on order and disagree on what "done" means.
- Two top-up watchers can read one progress file (F-RA-03) -- the same shape as the send card shown twice
  on the maintainer's device (#305), from the other side.

### Interaction: the interface × the scripts (the settings file)
- `SystemConf` and `set_setting` share a PID lock; the interface proceeds after a five-second timeout
  (F-ES-02 8b) and the script's `wait_lock` can remove a fresh lock (F-PB-02 gpt, F-ES-06 8b). One file,
  two lock implementations, neither fails closed.

### Interaction: backup and restore × cloud sync
- The legacy restore overwrites the device's cloud identity (F-BR-12); the layout migration moves the old
  root's backups under Saves (F-CS-08) and leaves pointers stale when it dies between the two moves
  (F-CS-09); the settings-first restore's continuation ignores the transfer page's ticks (F-ES-01 8a).
  Three seams, three different owners of "which folder is whose".

### Interaction: the content tier × the saves tier
- `--match --apply` deletes a system whose listing failed (F-CS-01, both seats) and recomputes the plan the
  player approved (F-CS-03); `--all` restores ROMs and never BIOS (F-CS-02/13, both seats); `.fla` saves are
  in the saves allowlist and not in the content excludes (F-CS-02 gpt). The two tiers are separated by two
  filter files that were written on different days.

### 3.6 What's missing?

- **A single atomic-write helper** used by every script and by the interface, with the checks the copies
  lack (write checked, the catch-all asserted, the temporary unique, the read complete).
- **A decision on GENERIC_X64's publication**, and on what the QA device may carry that a handheld may not.
- **A cursor for the scan** (F-RA-07) and a "TRUNCATED" outcome on the page.
- **Device facts for two ordering claims the VM cannot show**: the pad grab at a successful sign-in
  (F-RS-11) and the exit capture racing a relaunch on an A53 (F-ES-04 8a).
- **Tests that would have caught the copies' drift**: the `last-good-scripts-test` has no case for a rules
  file cut short, for a listing that fails, for a saves exit 9 beside a failed settings phase, or for a
  relative retire argument.

### 3.6.5 Audit-prescription verification

Audit #258's punch list (PL-001..PL-039) was resolved before this round; this reading re-met two of its
shapes: PL-002 (a retire path refused the row and unlinked anyway) is fixed as written and its sibling --
a relative path accepted by the same check -- is F-CS-04; PL-021's class (a success reported over a no-op)
recurs in F-CS-11, F-CS-18, F-RA-06 and F-PB-08. The prescription held where it was applied and was not
applied to the copies.

### 3.7 Retrospective checkpoint

### Architectural Assessment
Coherent in intent, divergent in copies. The fork's rules are the right ones and its own newer scripts break
them where an older copy was not revisited.

### Cornerstone Alignment
Guards-fail-closed and the outcome vocabulary are the two rules most often broken (six and five verified
instances); both are audited by tools that do not reach these lines.

### Cross-System Interactions
Four seams, each with a verified High: content×saves (F-CS-01/03), interface×scripts (F-ES-02 8b),
backup×cloud (F-BR-12, F-CS-08/09), sync×achievements (F-RA-01/03).

### Spec Drift
Five register rows contradicted by a line of code (§ 3.3); none by design.

### Missing Artifacts
The shared write helper, the GENERIC_X64 decision, the scan cursor, two device facts, five test cases.
