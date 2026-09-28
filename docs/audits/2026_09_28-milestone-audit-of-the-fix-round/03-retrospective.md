# Retrospective Audit — the whole fix round for #307/#308 (D-WORKFLOW-060)

**Auditor:** Code Auditor skill (orchestrator: Claude Fable 5.1)
**Date:** 2026-09-28
**Subject:** the distribution `417dcd8610..1b0d233657` and the EmulationStation fork `7eae8ed91..87b182fbe`, worked backwards: coherence, conformance, fidelity, the seams, what is missing
**Spec:** `01-research-notes.md`

---

## Running Notes

### 3.1 Architectural coherence

_(after the seats: orphaned files, dead code, coupling; what the round added as structure -- the plan file, the attempt id, the journey record, the capture gate, the settings lock's reap guard, the retired quirks' take-backs)_

### 3.2 Project conformance

**Instruction files in scope** (by glob, read from `next`):

| Rule | Relevance | Finding |
| --- | --- | --- |
| `engineering-practices.md` § Guards must fail closed, § Verify the artifact, § A name is not a behaviour, § Before deleting a duplicate | every stream | _(the seats' findings; the orchestrator's O-1..O-19: every high-risk follow-up read fails closed)_ |
| `upgrade-and-install.md` (Already written on every fix, D-WORKFLOW-050; migrations copy-verify-delete) | every stream | _(each stream's report carries its Already-written lines; the seats check the diff against them)_ |
| `rclone-cloud-sync.md` (the allowlist filter; `--delete-excluded`; the bounded sync; last-good) | A, B, C | _(pending)_ |
| `packaging-and-patches.md` (late binding, patches per device) | F1, F2, the integrator's recipes | `tools/pkgcheck` rc 0 on every one of the 21 recipes changed in the range (run 14:0x UTC) |
| `generic-x64-vm-testing.md` (the harness, the guests, the walks, the claims) | F1, the integrator (vm-qa, claims) | _(pending)_ |
| `es-player-text.md`, `es-native-ui.md`, `es-code-traps.md`, `es-ui-style-guide.md` | E1, E2; the words the scripts print | `tools/vocabulary-check` 0 wrong; `tools/es-menu-map-check` 51 screens, 0 missing; French 599 of 599 (E2's line); the proposed words marked as proposed (D-UI-112/115) |
| `handheld-evidence.md` | B (the rocknix package), F1 | _(pending)_ |
| `change-log.md` | the round | the entry exists (`docs/cloud-sync-changelog.md`, 238 lines, checked on `1b0d233657`) |
| `documentation-accuracy.md` (the public docs change with user-facing behaviour) | the round | **not met yet, tracked**: #42 carries the rocknix.org cloud-sync page; the round's player-visible changes (the plan file's refusal words, the folder collision refusal, the root-level exception) are not on the public page -- pre-existing tracked scope, the PR-prep gate |

**Blindspot register**: _(the 67 entries screened for the round's shape -- the agent's screen is a lead; the REPEATED rows are re-read by the orchestrator and become findings)_

**Project invariants**:

| Invariant | Finding |
| --- | --- |
| Progress above recency | _(A's conflict handling unchanged in this round; the match plan removes only what the cloud lacks -- D-CLOUD-023 restated by E2's in-place line)_ |
| No secrets in backups | B: the credential scan fails closed, the last-good records held back, `Password=` covered; the hooks' run-time fixtures (blindspot 67) |
| The filter is an allowlist; `--delete-excluded` destructive | A: the catch-all check on the managed rules file only; the player's own file honoured (G-A-O1) |
| Every change lands on devices with state | every stream's Already-written line; the runner's F1 rehearsal could not run on this guest (the QA pair was vm-qa's) -- the upgrade half of `1b0d233657` is **unproven on the VM this round** (a coverage line) |

### 3.3 Spec fidelity

_(pending the seats: where a fix diverged from its acceptance text and the divergence was or was not recorded -- known: PL-034 implemented differently from the item's text, F1's part (a) of G-F1-02 decided the other way with a test, E2's "a match is never retried from the page")_

### 3.4 Platform architecture conformance

Not applicable to this repository (no tenant model, schema or API layer); marked ·.

### 3.5 Cross-system interaction audit

#### Interaction: the cloud scripts (A) x the interface's cards and pages (E2)
**State shared:** the `>>> why` sentences and the stamps' third field; the match plan file `/storage/.cache/cloud_sync/content-match-plan`.
**Wipe risk:** a sentence a script prints that the card's table lacks reads in English (the emitter-table unit test guards it); a plan used up by an apply that the page retries (E2 removed TRY AGAIN for a match).
**Test coverage:** PARTIAL -- the unit test over the emitter table; the walk's MATCH preview on the guest (A-pl001 PASS); the planless apply's why is in the table (ES `87b182fbe`).
**Finding:** safe on the read (O-20's sibling: the two integrator sentences added the same day).

#### Interaction: the proxy and its ctl (D) x the RetroAchievements cards (E2)
**State shared:** the scan's stamp tokens and counts (`added=`, `truncated=`, `cursor_saved=`), the index marker's token.
**Wipe risk:** a token the card does not know; a marker removed by an older top-up.
**Test coverage:** PARTIAL -- O-20; the runner's D-pl059 and D-pl013 on the guest.
**Finding:** safe (O-20).

#### Interaction: the settings file's lock (E1) x the scripts' lock (B)
**State shared:** `/tmp/.system.cfg.lock`, its `.reap` guard, the pid-only contents.
**Wipe risk:** a reap by one side of a live holder of the other.
**Test coverage:** TESTED on each side (the ES file tests; `tools/wait-lock-test`); the intersection (the interface holding while a script waits, and the reverse) is the runner's E1-pl024 (PASS on `1b0d233657`).
**Finding:** safe (O-21).

#### Interaction: `wifictl` (B) x the Wi-Fi picker (E1/E2)
**State shared:** the `saved` output the picker parses; the join's return read as an exit code.
**Wipe risk:** a column added to `saved` that the parser does not expect (B added `--ssid` as a separate form, `saved` unchanged); the join's answer type (E2's `5a37c7981` makes the old bool shape not compile).
**Test coverage:** PARTIAL -- the picker still reads `saved` (PL-003 on #309); the runner's E1-wifi on a stand-in wifictl (no adapter on the guest).
**Finding:** safe today; the picker's switch is the next round's (#309 PL-003).

#### Interaction: the capture gate (E2) x `cloud_capture`'s lock (A, PL-067)
**State shared:** the capture's completion, which the gate waits on.
**Wipe risk:** a capture that never completes (A's lock held) holding every launch -- bounded by the 120 s hung rule (O-6).
**Test coverage:** the runner's E2-pl061 with a delayed capture (PASS); a capture blocked on A's lock is UNTESTED as such.
**Finding:** safe by the bound.

#### Interaction: the shared harness (`tools/last-good-scripts-test`) x every stream
**State shared:** one file, six appended blocks, two kept-both merges by hand, the integrator's fixture commit.
**Wipe risk:** a block's helper name colliding with another's; a merge that dropped a case.
**Test coverage:** TESTED -- the whole file PASSED after every merge (vm-qa 69 scripts suite 333 s, 844+ checks); the case counts per block are in the reports.
**Finding:** safe.

#### Interaction: the retired GENERIC_X64 quirks (F1) x a kept guest's state (the upgrade path)
**State shared:** the files the old quirks left under `/storage`; the take-back stamps.
**Wipe risk:** an owner's own drop-in removed (fixed: exact names); a downgrade rewriting the files (stated).
**Test coverage:** PARTIAL -- the harness's rehearsal seeds; the rehearsal itself could not run this round (the QA pair was in use) -- **an intersection the VM has not shown on `1b0d233657`**.
**Finding:** risky until the rehearsal runs on this cut.

### 3.6 What's missing?

_(each with its search trail)_

- **The upgrade rehearsal on `1b0d233657`** -- `ls /workspace/artifacts/rocknix-images/qa-1b0d233657-*/` shows vm-qa run 69 only; the runner's row says the rehearsal takes the QA pair. Missing, and the coverage line above.
- **A second seat over the follow-ups** -- this audit.
- **The public docs** -- `documentation-accuracy.md`'s gate; #42 (pre-existing tracked scope).
- **Scripts for E1's follow-up proofs, three of E2's and the migration on WebDAV** -- the runner's "3 NOT RUN" (`proofs-307.md`); the migration's proof exists as harness cases (A31, A32 not constructible as root) and not on a guest.

### 3.6.5 Audit-prescription verification

_(for every Critical/High finding the seats return: the shape, its siblings and adjacents enumerated with a grep, each classified)_

### 3.7 Retrospective Summary

_(written after the seats)_
