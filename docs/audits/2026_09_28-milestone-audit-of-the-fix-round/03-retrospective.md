# Retrospective Audit — the whole fix round for #307/#308 (D-WORKFLOW-060)

**Auditor:** Code Auditor skill (orchestrator: Claude Fable 5.1)
**Date:** 2026-09-28
**Subject:** the distribution `417dcd8610..1b0d233657` and the EmulationStation fork `7eae8ed91..87b182fbe`, worked backwards: coherence, conformance, fidelity, the seams, what is missing
**Spec:** `01-research-notes.md`

---

## Running Notes

### 3.1 Architectural coherence

The round adds structure rather than removing it: a plan file between a match's preview and its apply (D-CLOUD-141), an attempt id and a file lock on the sign-in state, a journey record read whole, a capture gate with a bound and a hung rule, a settings lock born by hard link with a reap guard on both sides, take-back scripts with stamps for the retired quirks, one grammar for `cloud_sync.conf` in five copies. The five copies are the coherence cost: the seats found the same hole in each (G2-A-01 gpt), and a sixth reader that never got the grammar (`backuptool`, G2-B-01). The harness is one file of 844 checks with six appended blocks; it held through two hand merges. Nothing orphaned was found: F1's deletions are complete (`pkgcheck` rc 0 on every recipe), the ES test binary is untracked, the retired quirk tree never shipped (the blindspot screen's row 23). Coupling worth naming: the cloud scripts' outcome words and the interface's tables are a byte-for-byte contract kept by a unit test (the emitter table) -- the two sentences the integrator added the same day show the contract is live and that its guard works.

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

**Blindspot register**: the 67 entries screened against the round's diffs by shape (an agent's pre-screen, `/workspace/tmp/rocknix-session/blindspot-screen-fix-round.md`: 15 repeated in 10 instances, 32 avoided, 21 not relevant; the register numbers 29 twice). Five repeats survived the orchestrator's read and are BS-1..BS-5 in `02-forward-audit.md` (a credential left in a persistent log; two readers of one file; a check that cannot see a damaged stored member; skipped checks counted as passed; a wait that a stale line satisfies); the other five are the fixture-size proofs already kept partial (44), the `.fla` list restated in four copies (21, Low), tools used without a declared package (16, Low -- busybox has `flock` and `timeout`, systemd `timedatectl`), a failed listing read as empty by `--content-location` (22, Low), and a shell-out on the interface thread beside one that was already there (45, Low). The avoidances worth naming: 67 (a pre-commit scan in both repositories -- with the fail-open the seats then found in it, G2-I-02), 66 (the lint keyed by seat), 61 (SIGINT reset for the harness), 60, 32, 11, 23.

**Project invariants**:

| Invariant | Finding |
| --- | --- |
| Progress above recency | _(A's conflict handling unchanged in this round; the match plan removes only what the cloud lacks -- D-CLOUD-023 restated by E2's in-place line)_ |
| No secrets in backups | B: the credential scan fails closed, the last-good records held back, `Password=` covered; the hooks' run-time fixtures (blindspot 67) |
| The filter is an allowlist; `--delete-excluded` destructive | A: the catch-all check on the managed rules file only; the player's own file honoured (G-A-O1) |
| Every change lands on devices with state | every stream's Already-written line; the runner's F1 rehearsal could not run on this guest (the QA pair was vm-qa's) -- the upgrade half of `1b0d233657` is **unproven on the VM this round** (a coverage line) |

### 3.3 Spec fidelity

Where the implementation diverged from the acceptance text and said so: PL-034 ("implemented differently from the item's text", F1's report); F1's part (a) of G-F1-02 (the shipped 640x480 and 0x0 follow the mode even with a record, because RESET RETROARCH CONFIG TO DEFAULT leaves exactly that -- a test case records it); E2's match page (no TRY AGAIN for a match, since its plan is used up -- `es-player-text.md` updated the same day); PL-077 (two concurrent evidence runs are refused rather than both completed, where the acceptance said two archives -- gpt's "holds in part", the stream's choice the safer one); PL-076 credited to F1 by F2. Where it diverged and did not say so: the two seats' 48 weaker readings in § Cross-check are mostly packet scope (the other half of a split item, a plan not in the packet), and the ones that name a mechanism are Mediums in 02. Scope added without a record: none found -- the integrator's rule edits and the vm-qa launch are in packet I and were read.

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

Every confirmed High distilled to its shape and grepped for that shape across the tree (the commands quoted), each occurrence classified:

| Defect class (the High) | Grep | Site / Sibling / Adjacent | Verdict |
| --- | --- | --- | --- |
| A CR accepted as whitespace before a comment (G2-A-01 gpt) | `grep -n '\[ \\t\\r\]' projects/ROCKNIX/packages/network/rclone/sources/*` | Site `cloud_backup:1043`; Sibling `cloud_restore:1104`; Sibling `cloud_sync_helper:247`; **Adjacent `cloud_content_backup:128`, `cloud_content_restore:131`** (two copies the seat did not name) | FIX-NOW, all five |
| A reader that sources `cloud_sync.conf` without the validator (G2-B-01) | `grep -rn '\. /storage/.config/cloud_sync.conf' projects/ROCKNIX/packages` | Site `backuptool:42`; no sibling | FIX-NOW |
| A fallback that restores a copy on `-s` alone (G2-A-02) | `grep -rn 'elif \[ -s .*&& mv -f' .../rclone/sources .../rocknix/sources/scripts` | Site `cloud_backup:1170`; Sibling `cloud_restore:1231` | FIX-NOW, both |
| A scan whose pipeline failure reads as no match (G2-E-tests-01 / G2-I-02) | `grep -n 'head -5 \|\| true' .githooks/* ~/Development/.../qa-integration/.githooks/*` | Site distribution `pre-commit`, `pre-push`; **Adjacent the ES fork's `pre-commit:16`, `pre-push:149`** (the same pipeline) | FIX-NOW, all four |
| A path-keyed exemption from the scan (G2-I-01) | `grep -n 'seats/\*\.diff' .githooks/* (both repos)` | Site distribution `pre-push:211,228`, `pre-commit:20`; the ES fork has none | FIX-NOW |
| A masking example that keeps the value (G2-I-10) | `grep -rn '\\1\*\*\*' .claude/rules docs` | Site `engineering-practices.md:555`; no sibling (the memory was corrected this morning) | FIX-NOW |
| A raw string compare where a path compare was meant (G2-A-01 claude) | `grep -n '!= "/ROCKNIX' cloud_backup cloud_sync_helper cloud_setup` | Site `cloud_migrate_layout` (nine compares); no sibling elsewhere | FIX-NOW |
| An unchecked `mktemp` feeding a guard (G2-B-04) | `grep -n '=\$(mktemp)$' backuptool` | Site `backuptool:473` (`KEEP`); **Siblings 207, 650, 651, 652, 758, 775, 1093** (`ERR`, `FILELIST`, `SECRETLIST`, `SENDLIST`, `REGENERABLE`, `KEPT`, `SEEDED`, `MEMBERLIST`) | FIX-NOW: one checked helper for all nine |
| A control file the archive can overwrite (G2-B-06) | `grep -n RESTORE_MARK backuptool` against the skip lists | Site the marker; Adjacent the snapshot's own path (`SNAPSHOT`) -- a member of that name would overwrite the pre-restore copy | FIX-NOW, both |
| A value regex that cannot consume a leading space inside quotes (G2-B-07) | the `CREDENTIAL_KEYS` line | Site only | FIX-NOW |
| A fast-path detector narrower than the redactor (G2-B-02) | `passkey=` in `001-functions` | Site only | FIX-NOW |
| A path validator that ignores `.`/`..` (G2-C-04) | `syncpath_problem` | Site only; Adjacent none (`cloud_migrate_layout` normalises `${1%/}` but never sees a typed path) | FIX-NOW |
| An inner-quote test before the escape (G2-E-core-01) | `maskValueEnd` | Site only | FIX-NOW |
| A credential in a persistent log (BS-1) | `cloud_sync.log`; `/var/log` bind | Site `cloud_remote`'s old line; Adjacent every other script that once logged rclone's stderr (`log_message` of `rclone` output in `cloud_backup`/`cloud_restore` before PL-074) -- the one-time scrub covers the file whatever wrote it | FIX-NOW (the scrub) |

Verdict on the prescription check: **PARTIAL until the fixes land** -- every site is enumerated; the two content-script copies of the grammar and the ES fork's hooks were found by the grep and not by any seat.

### 3.7 Retrospective Summary

### Architectural Assessment

Sound as a set of guards added to four subsystems by eight hands in one night, with the cost that shape carries: the same grammar in five copies with the same hole, one reader that never got it, two readers of one file that disagree, and guards whose own failure paths were not written (the snapshot worklist, the safety copy, the hooks' scan). The seats' sixteen Highs are almost all that shape -- a guard added in the round that fails open on its own error -- which is the register's oldest lesson (blindspots 13, 22, 33) applied to the fixes for the register's oldest lesson.

### Cornerstone Alignment

MEDIUM. `engineering-practices.md` § Guards must fail closed is met by the first deliveries and broken by their follow-ups in seven places (02 § Verification); `upgrade-and-install.md`'s Already-written answer is missing for two things earlier builds left (a credential in a persistent log, BS-1; a hand-edited conf the new grammar refuses, G2-A-05); the outcome vocabulary is kept (`vocabulary-check` 0 wrong; the two integrator sentences in the table, `es-player-text.md` behind by those two, G2-A-04); the public docs gate (`documentation-accuracy.md`) is unmet and tracked (#42).

### Cross-System Interactions

Seven pairs identified and read (§ 3.5); the seats named the same ones. Two intersections the VM has not shown on `1b0d233657`: the upgrade rehearsal (the QA pair was busy; its own wait cannot fail, BS-5) and a capture blocked on `cloud_capture`'s lock (bounded by the hung rule). One seam defect confirmed (BS-2, the two config readers); one seam the seats disputed and the orchestrator holds as accepted risk (the pid-only settings lock, D-INFRA-012).

### Spec Drift

Recorded divergences, none silent (§ 3.3). The acceptance text of #307 was met on the streams' reports and the fix audit's verdicts; this audit's seats, given the whole branches and no plan, read 48 item-seat pairs weaker -- packet scope for most, and mechanism for the Mediums listed.

### Missing Artifacts

The upgrade rehearsal on `1b0d233657`; a second seat over the follow-ups (this audit); the public docs (#42); scripts for E1's follow-up proofs, three of E2's and the migration on a backend; a case for the CR hole and for each of the seven fail-open follow-ups; the lint's coverage of this audit's own ids (fixed while it ran).
