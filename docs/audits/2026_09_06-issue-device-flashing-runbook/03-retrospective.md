# Retrospective Audit — device-flashing runbook and rule updates

**Auditor:** Code Auditor skill
**Date:** 2026-09-06
**Subject:** Uncommitted documentation set in worktree `build/device-flashing`
**Spec:** The artifacts' own stated requirements (see 01)

---

## Running Notes

### 3.1 Architectural coherence

The set is coherent: one procedure document (`docs/device-flashing-runbook.md`), one canonical rule pointing at it (`device-builds.md` § Installing on the device, with the two bench rows), one agent-entry pointer (`AGENTS.md`), one register row for the failure the session found (blindspot 29), one ES-side rule for the crash class (`es-native-ui.md`), and the dated narrative (work log, 13 entries). No orphaned files, no dead references (`grep -rn device-flashing-runbook` resolves to the file).

One structural observation: the runbook contains two procedures — a fresh-card flash (§1–§8) and an in-place update (lines 51–89) — plus an update-ownership essay (lines 12–49). `device-builds.md` already owns the update path and now delegates its details to the runbook. That is the right direction (one place), and the rule says "Do not use the fresh-card procedure for an update", which keeps the two apart.

**F-01 — The work has no durable home.** `git log next..HEAD` is empty; every artifact is an uncommitted change on a `build/*` branch worktree. `worktrees.md` reserves `build/*` for building and `fork-workflow.md` names `next` as "the single place to look for the current state of the work"; `instruction-files.md` says rules are read from `next`. Until this lands on `next`, no other session sees the runbook, the bench rows, the es-native-ui lesson, or blindspot 29 — and `tools/fork-worktree sync` will (correctly) skip this worktree. The session file itself records the state: "Documentation remains local and uncommitted." This is the blindspot-1 setup: the next session re-derives what this one wrote.

### 3.2 Project conformance

#### Face 1 — instruction files (all carry `paths: "**"`; read from `next`)

| Rule | Relevance | Finding |
| --- | --- | --- |
| `device-builds.md` | ✓ | Updated in the same change (table rows, install section). Accurate against `update.sh`, `mkimage`, the retained images, and the live RG35XX SP. |
| `upgrade-and-install.md` | ✓ | The update section covers the upgrade path (shared tar, `/storage` preserved) and the fresh-card path separately; the "transferred ≠ installed" distinction (runbook step 5) is exactly the rule's "verify on a device". |
| `engineering-practices.md` § verify the artifact | ✓ | Full-byte readback before filesystem changes; on-device hash before queueing; `sha256sum -c` on retained files. |
| `engineering-practices.md` § guards fail closed | ✓ | `set -o pipefail` before every pipeline that can fail; the container script uses `set -euo pipefail` and asserts hash and size before `dd`. |
| `engineering-practices.md` § an ask is a decision | ⚠ | Runbook line 233–236 correctly frames `sudo` as the maintainer's decision and forbids passwords in chat. But the serval alternative it documents covers only the write (F-04): the remaining 17 `sudo` sites would each become an ask on serval, which the rule says must be a *decision*, not an errand. |
| `decision-register.md` | ✗ | **F-03.** Two decisions from the session have no row: (1) 2026-09-05 19:16 UTC, maintainer: the documentation target is the private owned-device list, not a public installation guide (§ "Write a row when", case 1); (2) raw-device access on serval goes through a container that receives only the pinned device and the read-only image, never through an administrator password in chat (case 2, a fork resolved during execution; D-INFRA-002 is the nearest precedent). `grep -nE 'flash|runbook|owned-device' docs/decision-register.md` → none. The rule says "in the same session the decision happens". |
| `learning-capture.md` | ✓ | 13 timestamped entries appended; lessons abstracted into three rule files and the blindspot register. |
| `worktrees.md` | ⚠ | Documentation work is being done on a `build/*` worktree rather than a `feature/*` one; harmless until commit, but see F-01. |
| `fork-workflow.md` | ✓ | Every changed path is a personal path (`.claude/`, `AGENTS.md`, `docs/`, `.github/sessions/`); nothing here can reach an upstream PR. |
| `es-native-ui.md` | ✓ | The added rule is accurate (AC-12) and sits in the Conventions list beside the lambda-capture rule it refines. |
| `documentation-accuracy.md` | · | No user-facing behaviour changes in this diff. The ES fixes on `next` restore documented behaviour; the public cloud-sync page's drift is already tracked (#42). |
| `issue-tracking.md` | ⚠ | **F-02.** #44's comment left "RG-SP: *pending*" and named the exact measurement that would "settle the design question". The session took that measurement (1.2 V; boot0 `dram_type=7`) and recorded it in three places in the repo but not on the issue. Neither a comment nor a body edit exists. |
| `instruction-files.md` | ✓ | The audit read rules from `next`; this worktree is at `next`'s tip. |
| `adversarial-council.md`, `council-substrate-integrity.md`, `packaging-and-patches.md`, `rclone-cloud-sync.md`, `generic-x64-vm-testing.md` | · | Not touched by this change. |

#### Face 2 — blindspot register (`next`, rows 1–28; row 29 added here)

| # | Does this work repeat it? | Finding |
| --- | --- | --- |
| 1 assumed-undone | ⚠ | Not committed by this work, but set up by it: an uncommitted runbook is invisible to the next session (F-01). |
| 2 same-tag republish | ✓ | Directly addressed — v7/v8/v9 share filenames and `OS_VERSION`; the runbook (lines 61–64) and `device-builds.md` (342–344) require build-ID directories and hashes; retained artifacts follow it. |
| 6 consumed artifact checked late | ✓ | §7 uses the absence of `.please_resize_me` *together with* the expanded partition size and `/flash/fs-resize.log` — not the marker alone. |
| 13 assumed-done | ✓ | Runbook step 5 and the session file distinguish *staged* from *installed*; live probe confirms the RG35XX SP is exactly as described. |
| 18 physical-world claim without a source | ⚠ | The RAM rows name their evidence and date (✓). The Anbernic package/spec claims name a source only generically — no URL, no access date (F-08). |
| 20 edit here, build there | ✓ | Build worktree `devices` and this worktree are both at `bba8620e0b`; `verification.json` ties the ES hash to the pinned commit. |
| 25 device path written before the hardware existed | ✓ | No literal `/dev/…` in any runbook command; run-time identification is the whole of §3; line 204 names the failure explicitly. |
| 27 supersession that lives only elsewhere | ✗ | **F-02** (above). The answer to #44's open question lives in the work log, the rule table, and two README files — everywhere except the issue. |
| 29 (new) | — | The row's claims were verified (AC-13); it earns its place. |
| 14, 26 guard bound to a path | · | No guard is installed or moved by this change. |

#### Face 3 — project invariants

- *Every change ships onto devices that already have state* — ✓ the update section is written for exactly that, and both bench devices were carried v7→v8→v9 in place with `/storage` and TF2 preserved (RG35XX SP live: `/storage` 180.6 G, 5.2 G used).
- Progress preservation, secrets in backups, allowlist filter — · not touched.

### 3.3 Spec fidelity

The 19:29 UTC work-log statement of what the runbook "now requires" is met point by point (AC-02..AC-06, AC-11). Scope added after that statement — the update section (21:07), the "Know who owns each update" section (19:29, second half), the TF2 section (19:52), the resize-boot paragraph (20:16), the multi-partition hazard (20:18) — is each recorded in the log with its trigger. No silent scope change. No divergence between what the runbook says the procedure did and what the session file records having done, except that the session's TF2 format ran inside the build container (log 19:52: "the build container's older `mkfs.ext4`") while the runbook shows `sudo mkfs.ext4` — the F-04 gap seen from the other side.

### 3.4 Platform architecture conformance

| Check | Relevance | Finding |
| --- | --- | --- |
| Reference implementation | · | Not applicable — documentation change, no platform surface. |
| Schema-before-code | · | Not applicable. |
| Dogfooding gate | ✓ | The runbook was executed once end-to-end on the RG SP before it was written down (log 19:16 → 19:29); the update section was executed twice (v8, v9). |
| API-first | · | Not applicable. |

### 3.5 Cross-system interaction audit

#### Interaction: manual `/dtb.img` activation (runbook §5) × H700 in-place updater

**State shared:** `/flash/dtb.img` on the boot partition.
**Wipe risk:** `update.sh:26–31` overwrites `dtb.img` from `device_trees/$(cat /proc/device-tree/rocknix-dt-id).dtb` on every update. If the manually activated DTB were the wrong model, the *running* kernel would report the wrong `rocknix-dt-id` and the updater would re-select the wrong file — self-perpetuating.
**Test coverage:** TESTED (RG SP: manual RG-SP DTB → booted as `Anbernic RG-SP` / `sun50i-h700-anbernic-rg-sp` → took v8 and v9 updates, per log and session; RG35XX SP live shows the updater-selected DTB id).
**Finding:** Safe, *because* §5 hashes the activated file against the exact model DTB and §7 verifies the running model before closing. The runbook's insistence on the exact DTB is what prevents the loop.

#### Interaction: TF2 card labels (runbook §6) × init's `disk=LABEL=STORAGE` lookup

**State shared:** partition labels visible to the kernel/initramfs.
**Wipe risk:** a games card labelled `STORAGE` could be selected as `/storage` by `init` (cmdline `disk=LABEL=STORAGE`), or `ROCKNIX` as the boot volume — silently booting against the wrong card.
**Test coverage:** UNTESTED (no fixture; deliberately not constructed).
**Finding:** Safe by rule — lines 356–358 forbid both labels and say why. Grounded in `distributions/ROCKNIX/options:202–203` and the built extlinux.

#### Interaction: automounter 8 GiB guard × a multi-partition (Android-formatted) TF2

**State shared:** `/storage/roms` bind target.
**Wipe risk:** a small ext4 `cache`/`metadata` partition on a large card passes the parent-disk size guard (`automount:189–197`) and becomes the ROM tree; a later reformat erases whatever was populated there.
**Test coverage:** PARTIAL — observed once (log 20:18–20:19) but the partition contents were erased before inspection, so the destination is inferred, and the log says so.
**Finding:** Risky but documented, with the code left untouched by design (log 20:18: "without changing automount code"). Not a defect of this change; a candidate for a separate issue if it recurs.

#### Interaction: staging path `/storage/.cache/<image>.tar.part` × updater's `ls "${UPDATE_DIR}"/*.tar | head -n 1`

**State shared:** `/storage/.update/`.
**Wipe risk:** a partial `*.tar` inside `.update` would be picked up and applied.
**Test coverage:** TESTED (two stagings on two devices; live RG35XX SP shows one complete tar with the v9 hash).
**Finding:** Safe — the stage-outside-then-rename design is the correct answer to the consumer's glob.

#### Interaction: session file × device state

**State shared:** what the devices are actually running.
**Test coverage:** TESTED for RG35XX SP (live); UNTESTED for RG SP (no channel).
**Finding:** Safe for what could be checked; the file is honest about what it has not verified.

### 3.5.5 Build-vs-adopt

Advisory only (no register in this repo). The runbook adopts the tree's own mechanisms (`update.sh`'s regulator read, the updater's queue, the automounter's rules) rather than inventing parallel ones; the only "built" element is the restricted-container flash path, which reuses `docker run --device` rather than a bespoke tool. No theatre.

### 3.6 What's missing?

Each negative claim below records its search.

| Missing | Search trail | Finding |
| --- | --- | --- |
| A commit on `next` carrying this work | `git log next..HEAD` → empty; `git status --short` → 5 M, 2 ?? | **F-01** (High) |
| A #44 comment/body edit with the RG-SP measurement | `mcp issue_read #44` body + 1 comment (2026-08-27) → "RG-SP: pending" | **F-02** (Medium) |
| Decision-register rows | `grep -nE 'flash|runbook|owned-device|private' docs/decision-register.md` → only D-INFRA-002/006/007 (other topics) | **F-03** (Medium) |
| Serval-executable equivalents for the 17 privileged sites outside the write | `grep -n sudo runbook` → 18 command lines; container block covers line 229 only | **F-04** (Medium) |
| A definition of `OBSERVED_PARTITION` | digit-tolerant def/use diff → sole undefined name (lines 367, 369) | **F-05** (Low) |
| exFAT in the recognised-filesystem list | `automount:187` `/fat/` matches `exfat`; `:111` loads `exfat`; runbook lines 351–354 omit it | **F-06** (Low) |
| The boot mechanism behind "activation is required", and the DDR4 no-overlay case | `pxe_utils.c:754–758`; v8 `verification.json` DDR4 extlinux has no `FDTOVERLAYS`; runbook lines 300, 329 | **F-07** (Low) |
| URL + access date for the Anbernic claims | `grep -n 'http' runbook` → none; session file lines 222–228 likewise | **F-08** (Low) |
| A `CLAUDE.md` mirror of the AGENTS.md quick warning | `grep -in flash CLAUDE.md` → none; CLAUDE.md § gotchas carries the rclone/VM warnings AGENTS.md carries | **F-09** (Low) |
| The shipped ES source in a durable local clone | `git -C ~/Development/emulationstation-next cat-file -e 58c19931` → absent; only `/tmp/emulationstation-next-v7` (tmpfs) has it; remote has it | **F-10** (Low) |
| Proximate work that might have added a vendor updater under another name | `git log --since=2026-09-01 -- projects/ROCKNIX/devices/H700` → 1 commit (`6face2d2fa linux: kernel config`) | supports AC-10 |
| Another open issue asking for something this session established | `gh issue list --state open --limit 60` filtered on flash/dtb/runbook/H700/RG SP/card → only #44 | see 3.6.5 |

### 3.6.5 Audit-prescription verification

**Shape A — a privileged command with no serval-executable equivalent (F-04).**

| Occurrence | Line | Class |
| --- | --- | --- |
| Site | 270 (`sudo head -c` readback) | FIX-NOW |
| Sibling-1 | 184, 221 (`sudo blockdev --getsize64`) | FIX-NOW (unprivileged `lsblk -bdno SIZE` exists) |
| Sibling-2 | 229 (`sudo dd`) | SAFE-AS-TESTED (container block 244–258 is its equivalent) |
| Sibling-3 | 285 (`sudo blockdev --rereadpt`) | FIX-NOW |
| Sibling-4 | 311–317 (§5 mount/copy/hash/umount) | FIX-NOW |
| Sibling-5 | 362–369 (§6 parted/partprobe/mkfs/e2fsck) | FIX-NOW (the log says this ran in the build container) |
| Adjacent | `device-builds.md` § Installing — prose only, no privileged command | BY-DESIGN |

**Shape B — a placeholder used but never assigned (F-05).** Grep over all `$VAR` uses vs assignments and `--env` injections → one occurrence (`OBSERVED_PARTITION`). No siblings.

**Shape C — a fact established in-session that answers an open issue's stated pending question (F-02).** Site: #44. Siblings checked: #19 and #10 (the savestate-compatibility pair that names the same bench) — see amendment below.

**Shape D — an external-world claim without a checkable citation (F-08).** Site: runbook lines 22–28 (package name, spec). Sibling: session file lines 222–228 (same claims). Adjacent: `device-builds.md` rows cite in-repo evidence (regulator, boot0) → BY-DESIGN. Both sites FIX-NOW together.

### 3.7 Retrospective Summary

**Architectural assessment:** Sound. One procedure document, one rule pointer, one agent pointer; nothing duplicated, nothing orphaned. The essay-like "Know who owns each update" section is long for a runbook but answers a question the maintainer actually asked, and it ends in a reusable intake checklist.

**Cornerstone alignment:** MEDIUM-HIGH. The engineering rules (verify the artifact, fail closed, device-not-host, physical-world sources) are followed unusually well — the readback, the on-device hash, the run-time card identification and the u-boot mechanism are all correct. The misses are all *bookkeeping*: no commit, no register rows, no #44 update, and a runbook whose worked example (serval) cannot run most of its own privileged steps.

**Cross-system interactions:** Identified and, where a fixture existed, tested. The one risky pair (multi-partition TF2 × size guard) is documented rather than fixed, deliberately.

**Spec drift:** None. Scope grew with the day and each addition is logged with its trigger.

**Missing artifacts:** F-01 through F-10, above.

### 3.6.5 amendment — Shape C siblings

- **#19** (savestate cross-device matrix): its 2026-08-27 "Test sequencing" section names the RG-SP joining the RG35XX SP as the same-chipset control, and one AC requires the pair to report distinct identities. This session made the RG-SP operational and observed distinct `rocknix-dt-id` / `model` strings on the pair — a *prerequisite* now met, not a pending measurement answered; the control run itself has not been done. D-CLOUD-025 (2026-09-04) already records the bench as holding H700 ×2. Classified **SAFE-AS-TESTED**: nothing on #19 is superseded by this session's facts.
- **#10** (per-core namespacing): body already carries its 2026-09-05 supersession note; nothing this session established bears on it. **BY-DESIGN** (no action).

Shape C therefore has one site (#44) and no siblings requiring action.
