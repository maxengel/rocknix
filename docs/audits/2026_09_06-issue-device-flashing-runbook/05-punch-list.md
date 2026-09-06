# Punch List — device-flashing runbook and rule updates

**Generated:** 2026-09-06
**Source Audit:** docs/audits/2026_09_06-issue-device-flashing-runbook/04-analysis.md
**Total Items:** 10 (Critical: 0, High: 1, Medium: 3, Low: 6)
**Audit issue:** https://github.com/maxengel/rocknix/issues/72

---

## Instructions for Executing Agent

Each item is a discrete fix. Work in priority order. For each: read the evidence, make the change, verify the Acceptance line, record the outcome in the resolution gate below.

---

## High Priority

## PL-001: Commit the flashing documentation set and merge it to `next`

- **Severity:** High
- **Category:** Missing Artifact
- **Source Finding:** F-01 (03 § 3.1)
- **Owner area:** fork workflow / `next`
- **What:** Commit the seven files (`docs/device-flashing-runbook.md`, `.github/sessions/saved-session-state-build-device-flashing.md`, `.claude/rules/device-builds.md`, `.claude/rules/es-native-ui.md`, `AGENTS.md`, `docs/blindspot-register.md`, `docs/work-logs/2026_09-work_logs/2026_09_05-work_log.md`) together with this audit folder and the resolutions below, and land them on `next` (fast-forward from a `feature/*` branch or a direct commit — all paths are personal, none reach upstream).
- **Where:** worktree `/workspace/repos/rocknix.worktrees/device-flashing`, branch `build/device-flashing` (`git status --short` → 5 M, 2 ??, plus `docs/audits/…`)
- **Why:** `fork-workflow.md` — `next` is the single place for current state; `instruction-files.md` — rules are read from `next`; blindspot 1.
- **Evidence:** `git log next..HEAD` → empty; `git log --all --oneline -- docs/device-flashing-runbook.md` → none.
- **Acceptance:** `git -C /workspace/repos/rocknix show next:docs/device-flashing-runbook.md` succeeds and `git -C /workspace/repos/rocknix.worktrees/device-flashing status --short` is empty.

## Medium Priority

## PL-002: Carry the RG-SP RAM measurement to #44

- **Severity:** Medium
- **Category:** Documentation Gap (blindspot 27)
- **Source Finding:** F-02 (03 § 3.2, 3.6)
- **Owner area:** issue tracking (`maxengel/rocknix`)
- **What:** Comment on #44 with the RG-SP result — `vdd-dram` 1.2 V under ROCKNIX and stock boot0 `dram_type = 7` (LPDDR3 per `dram_sun50i_h616.h:23`), so the bench pair *differs* (RG35XX SP DDR4, RG-SP DDR3) — and edit the body's "Verification available" paragraph in the same action so it no longer says the RG-SP is pending.
- **Where:** https://github.com/maxengel/rocknix/issues/44 — body § "Verification available"; comment thread (last comment 2026-08-27 says "RG-SP … pending").
- **Why:** `issue-tracking.md` — the body is the contract; blindspot 27. The issue itself said this measurement "settles the design question".
- **Evidence:** `mcp issue_read #44` body + comments; work log 18:51 / 21:07 / 23:01; `device-builds.md` table row.
- **Acceptance:** #44's body no longer says the RG-SP is pending, and a comment carries the measurement with its evidence.

## PL-003: Record the session's two decisions in the register

- **Severity:** Medium
- **Category:** Cornerstone Violation (`decision-register.md` § "Write it in the same session")
- **Source Finding:** F-03 (03 § 3.2)
- **Owner area:** `docs/decision-register.md`
- **What:** Append two rows: (a) **D-INFRA-008** — the flashing documentation targets the private owned-device bench list, not a public installation guide (maintainer, 2026-09-05 19:16 UTC; ref work log); (b) **D-INFRA-009** — on serval, raw-device access for flashing goes through a container that receives only the pinned block device and the read-only image — never `--privileged`, never an all-`/dev` bind, never an administrator password through chat (fork resolved during execution, 2026-09-05; refines D-INFRA-002; ref runbook §4).
- **Where:** `docs/decision-register.md`, end of the `Decided` table (after D-WORKFLOW-003).
- **Why:** Both will otherwise be re-decided: the docs scope was already asked once, and the sudo question recurs on every flash.
- **Acceptance:** `grep -c 'D-INFRA-00[89]' docs/decision-register.md` → 2, each row citing its source.

## PL-004: Make the runbook executable on serval for every privileged step

- **Severity:** Medium
- **Category:** Documentation Gap
- **Source Finding:** F-04 (02 AC-05, 03 § 3.6.5 Shape A)
- **Owner area:** `docs/device-flashing-runbook.md`
- **What:** For each `sudo` site outside the write, give the serval equivalent: unprivileged where one exists (`lsblk -bdno SIZE "$RESOLVED_TARGET"` for lines 184/221), and otherwise the same restricted-container pattern as §4 (pinned `--device`, read-only image bind) for the readback (270), `--rereadpt` (285), the §5 mount/copy/hash block (311–317), and the §6 partition/format block (362–369). State explicitly that the container equivalents are the serval path and the `sudo` forms are for a host that has it.
- **Where:** `docs/device-flashing-runbook.md` lines 184, 221, 270, 285, 311–317, 362–369.
- **Why:** serval has no passwordless `sudo` (`sudo -n true` → "interactive authentication is required"); the runbook's stated purpose is repeatability there; `engineering-practices.md` § an ask is a decision.
- **Evidence:** `grep -n sudo docs/device-flashing-runbook.md` → 18 command lines; container block covers line 229 only.
- **Acceptance:** Every `sudo` command line in the runbook has, within its section, either an unprivileged alternative or a container form; `grep -c 'docker run' docs/device-flashing-runbook.md` ≥ 2.

## Low Priority / Improvements

## PL-005: Define `OBSERVED_PARTITION` before it is used

- **Severity:** Low
- **Category:** Code Quality
- **Source Finding:** F-05 (02 AC-07)
- **Owner area:** `docs/device-flashing-runbook.md` §6
- **What:** After `partprobe`/`udevadm settle`, re-list the target's children and assign `OBSERVED_PARTITION` from the observed single child (with the `p1`-vs-`1` naming note), before `mkfs.ext4`.
- **Where:** `docs/device-flashing-runbook.md` lines 365–367.
- **Why:** It is the only undefined placeholder in the document and it feeds the one command that erases the card.
- **Evidence:** digit-tolerant def/use diff over the runbook → `OBSERVED_PARTITION` alone.
- **Acceptance:** The def/use diff returns nothing.

## PL-006: List exFAT among the filesystems the automounter adopts

- **Severity:** Low
- **Category:** Documentation Gap
- **Source Finding:** F-06 (02 AC-07)
- **Owner area:** `docs/device-flashing-runbook.md` §6
- **What:** Change "recognizes ext4, btrfs, FAT, and NTFS" to include exFAT, and note it disables the merged overlay like FAT/NTFS.
- **Where:** `docs/device-flashing-runbook.md` lines 351–354.
- **Why:** `automount:187` `/fat/` matches `TYPE="exfat"`; `:111` loads the `exfat` module.
- **Acceptance:** `grep -c -i exfat docs/device-flashing-runbook.md` ≥ 1.

## PL-007: Name the boot mechanism behind DTB activation; state the DDR4 no-overlay case

- **Severity:** Low
- **Category:** Improvement
- **Source Finding:** F-07 (02 AC-06)
- **Owner area:** `docs/device-flashing-runbook.md` §5
- **What:** Replace "the platform/image expects the installer to select that file" with the mechanism: u-boot skips an extlinux label whose explicit `FDT` cannot be loaded (`boot/pxe_utils.c`, "Skipping … for failure retrieving FDT"), so a fresh H700 card without `/dtb.img` does not boot. Reword "a DDR overlay agrees with the selected DDR image" to say DDR3 images declare the ddr3 overlay and DDR4 images declare none.
- **Where:** `docs/device-flashing-runbook.md` lines 300, 329.
- **Why:** A future device intake should know this is a boot precondition, not a convention.
- **Acceptance:** §5 names `pxe_utils`/the skip behaviour and the DDR4 no-overlay case.

## PL-008: Cite the Anbernic sources with URL and access date

- **Severity:** Low
- **Category:** Documentation Gap (blindspot 18)
- **Source Finding:** F-08 (02 AC-10)
- **Owner area:** runbook § "Know who owns each update"; session file
- **What:** Add the URL(s) and the 2026-09-05 access date for the System Update page entry `RGSP-V1.0.1-EN16GB-260624` and the product specification, in both places the claim is made.
- **Where:** `docs/device-flashing-runbook.md` lines 22–28; `.github/sessions/saved-session-state-build-device-flashing.md` lines 222–228.
- **Why:** The claim cannot be re-derived from the repo; blindspot 18 asks for a checkable source.
- **Acceptance:** Both passages carry a URL or an explicit "URL not retained; accessed 2026-09-05 via …" note.

## PL-009: Mirror the flashing quick warning in `CLAUDE.md`

- **Severity:** Low
- **Category:** Documentation Gap
- **Source Finding:** F-09 (02 AC-01)
- **Owner area:** `CLAUDE.md` § Non-obvious gotchas
- **What:** Add one bullet pointing at `docs/device-flashing-runbook.md`, matching the rclone/VM warnings CLAUDE.md already carries.
- **Where:** `CLAUDE.md`, "Non-obvious gotchas" list.
- **Why:** AGENTS.md and CLAUDE.md are parallel entry files; the warning is in one.
- **Acceptance:** `grep -c device-flashing-runbook CLAUDE.md` → 1.

## PL-010: Put the shipped ES source in the durable local clone

- **Severity:** Low
- **Category:** Improvement
- **Source Finding:** F-10 (02 AC-14 notes)
- **Owner area:** `~/Development/emulationstation-next`
- **What:** `git fetch origin` in the durable clone so `58c19931` (the pinned commit and its regression test) exists outside `/tmp`.
- **Where:** `/home/max/Development/emulationstation-next` (at `0f83d515`); `/tmp/emulationstation-next-v7` is on a tmpfs.
- **Why:** The only local copy of the shipped source and its ASan harness vanishes on reboot; the remote has it, so this is convenience, not loss.
- **Acceptance:** `git -C /home/max/Development/emulationstation-next cat-file -e 58c199318ca78975d405a21b6e608ab432dbf892` exits 0.

## Pre-existing tracked scope (NOT punch items — exempt from the resolution gate)

- #44 — the public-side answer (release notes / rocknix.org, or a single H700 image). PL-002 feeds it; it does not close it.
- #42 — cloud-sync public docs drift (the routing fix on `next` restores documented behaviour; no new drift from this diff).
- #19 / #10 — savestate compatibility; the RG SP is now an operational same-chipset control, a prerequisite, not a result.
- Session "Next steps" 1–2 — reboot both devices to install v9 and exercise both keyboard choices. A maintainer action; not an audit finding.

## Phase 7 resolution gate

All ten were **resolved in the follow-up session** (2026-09-06) and are tracked in #72. Refs below cite the concrete artifact for each; the documentation fixes landed together on `next`.

| Item | Outcome |
| --- | --- |
| PL-001 | Resolved — committed and fast-forwarded onto `next` (#72) |
| PL-002 | Resolved — #44 body edited + comment `#issuecomment` posted |
| PL-003 | Resolved — D-INFRA-008 and D-INFRA-009 added to `docs/decision-register.md` (#72) |
| PL-004 | Resolved — runbook §3–§6 serval container/unprivileged forms added (#72) |
| PL-005 | Resolved — `OBSERVED_PARTITION` defined in runbook §6 (#72) |
| PL-006 | Resolved — exFAT added to runbook §6 filesystem list (#72) |
| PL-007 | Resolved — runbook §5 names `pxe_utils` skip + DDR4 no-overlay (#72) |
| PL-008 | Resolved — Anbernic source URLs + access date in runbook §1 (#72) |
| PL-009 | Resolved — flashing bullet added to `CLAUDE.md` gotchas (#72) |
| PL-010 | Resolved — `58c19931` fetched into `~/Development/emulationstation-next` (#72) |

## Machine-readable index

```yaml
punch_index:
- id: PL-001
  severity: High
  category: Missing Artifact
  source_finding: F-01
  owner_area: fork workflow / next
  where: /workspace/repos/rocknix.worktrees/device-flashing (working tree)
  acceptance: "git show next:docs/device-flashing-runbook.md succeeds; worktree status clean"
  outcome: resolved:#72
- id: PL-002
  severity: Medium
  category: Documentation Gap
  source_finding: F-02
  owner_area: issue tracking
  where: https://github.com/maxengel/rocknix/issues/44
  acceptance: "#44 body no longer says RG-SP pending; comment carries the measurement"
  outcome: resolved:#72
- id: PL-003
  severity: Medium
  category: Cornerstone Violation
  source_finding: F-03
  owner_area: docs/decision-register.md
  where: docs/decision-register.md (Decided table, end)
  acceptance: "grep -c 'D-INFRA-00[89]' docs/decision-register.md == 2"
  outcome: resolved:#72
- id: PL-004
  severity: Medium
  category: Documentation Gap
  source_finding: F-04
  owner_area: docs/device-flashing-runbook.md
  where: docs/device-flashing-runbook.md:184,221,270,285,311-317,362-369
  acceptance: "every sudo line has an unprivileged or container equivalent in its section"
  outcome: resolved:#72
- id: PL-005
  severity: Low
  category: Code Quality
  source_finding: F-05
  owner_area: docs/device-flashing-runbook.md
  where: docs/device-flashing-runbook.md:365-367
  acceptance: "def/use diff over the runbook returns nothing"
  outcome: resolved:#72
- id: PL-006
  severity: Low
  category: Documentation Gap
  source_finding: F-06
  owner_area: docs/device-flashing-runbook.md
  where: docs/device-flashing-runbook.md:351-354
  acceptance: "grep -ci exfat docs/device-flashing-runbook.md >= 1"
  outcome: resolved:#72
- id: PL-007
  severity: Low
  category: Improvement
  source_finding: F-07
  owner_area: docs/device-flashing-runbook.md
  where: docs/device-flashing-runbook.md:300,329
  acceptance: "§5 names the u-boot skip behaviour and the DDR4 no-overlay case"
  outcome: resolved:#72
- id: PL-008
  severity: Low
  category: Documentation Gap
  source_finding: F-08
  owner_area: runbook + session file
  where: docs/device-flashing-runbook.md:22-28; .github/sessions/saved-session-state-build-device-flashing.md:222-228
  acceptance: "both passages carry a URL or an explicit access note"
  outcome: resolved:#72
- id: PL-009
  severity: Low
  category: Documentation Gap
  source_finding: F-09
  owner_area: CLAUDE.md
  where: CLAUDE.md (Non-obvious gotchas)
  acceptance: "grep -c device-flashing-runbook CLAUDE.md == 1"
  outcome: resolved:#72
- id: PL-010
  severity: Low
  category: Improvement
  source_finding: F-10
  owner_area: ~/Development/emulationstation-next
  where: /home/max/Development/emulationstation-next
  acceptance: "git cat-file -e 58c19931 exits 0 in the durable clone"
  outcome: resolved:#72
```
