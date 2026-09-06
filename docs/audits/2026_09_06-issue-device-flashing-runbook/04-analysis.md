# Audit Analysis — device-flashing runbook and rule updates

**Date:** 2026-09-06
**Spec:** The artifacts' own stated requirements (no driving issue; see 01 § Subject)
**Issues:** none driving; #44 directly affected; #19, #10 checked as siblings
**Commits:** none — the audited set is the uncommitted working tree of `build/device-flashing` at `bba8620e0b` (== `next`)
**Audit issue:** https://github.com/maxengel/rocknix/issues/72

---

## Executive summary

This audit covered the documentation set produced during the 2026-09-05 RG SP flashing session: the new `docs/device-flashing-runbook.md`, the bench rows and install section in `.claude/rules/device-builds.md`, a page-lifetime rule in `es-native-ui.md`, blindspot row 29, an `AGENTS.md` pointer, the session hand-off file, and 383 lines of work log. Nothing in the set is committed. The related code (two EmulationStation fixes and their package pins) is already on `next` and was audited only where these documents make claims about it.

The documents are accurate. Every claim about the tree was re-derived from the script or source it describes: the H700 updater's regulator mapping and DTB selection, the image layout (read directly from the retained v9 DDR3 image: no `dtb.img`, the RG SP DTB present, extlinux `FDT /dtb.img`), the u-boot behaviour that makes activation mandatory, the automounter's filesystem and size rules, the resize-only first boot, and the update queue's consumer. The EmulationStation claims were verified by grep and by running the shipped regression harness both ways — it fails on the pre-fix source and passes on the fix. The RG35XX SP was probed read-only and is exactly as the session file says: running v8, with the v9 tar staged and hash-verified. All six retained artifact checksums verify.

The findings are about completeness and bookkeeping, not correctness. The runbook's serval path documents a container only for the `dd` step while seventeen other privileged commands remain `sudo`, which serval does not have; one placeholder is never defined; exFAT is omitted from the automounter's recognised types. Around the work: nothing is committed, two decisions from the session have no register row, and issue #44 — which was explicitly waiting for the RG-SP's RAM reading to "settle the design question" — was not told the answer. Ten findings, none critical, one high (the uncommitted state).

## Acceptance-criteria scorecard

| ID | Criterion | Verdict | Notes |
| --- | --- | --- | --- |
| AC-01 | Runbook discoverable from the install section and agent entry file | PASS ✓ | `CLAUDE.md` lacks the parallel quick warning (F-09) |
| AC-02 | Image intake commands verify compressed hash, gzip, raw bytes, raw hash | PASS ✓ | re-run on v9 DDR3; matches `verification.json` |
| AC-03 | Regulator check matches `update.sh` mapping | PASS ✓ | live `1100000` on RG35XX SP |
| AC-04 | Run-time card identification; no copied device paths | PASS ✓ | no literal `/dev/…` in any command |
| AC-05 | Raw write + full readback before fs changes; safe container path | PARTIAL ⚠ | container documented only for the write (F-04) |
| AC-06 | Fresh image has no `dtb.img`; extlinux points at it; activation required | PASS ✓ | u-boot skips the label without it; wording could name the mechanism (F-07) |
| AC-07 | TF2 claims: fs types, 8 GiB guard, labels, merged default | PARTIAL ⚠ | exFAT omitted (F-06); `OBSERVED_PARTITION` undefined (F-05) |
| AC-08 | Resize-only first boot does not run the automounter | PASS ✓ | `init`, `fs-resize.target`, `automount` guards |
| AC-09 | One tar for both variants; stage-outside-then-move | PASS ✓ | live: v9 tar hash in `/storage/.update` |
| AC-10 | No vendor firmware updater in the H700 tree | PASS ✓ / ? | repo claim PASS with search trail; vendor-site claims uncited (F-08) |
| AC-11 | Bench rows measured, attributed, not generalised | PASS ✓ | RG SP value corroborated, not re-measured |
| AC-12 | `es-native-ui.md` rule accurate; harness exists at the pin | PASS ✓ | harness run both ways |
| AC-13 | Blindspot row 29 claims | PASS ✓ | call sites: 3 re-routed, 2 remain |
| AC-14 | Session file complete and true | PASS ✓ | RG35XX SP live-verified; RG SP not probe-able |
| AC-15 | Learnings captured per rule | PASS ✓ | 13 entries, additions only |
| AC-16 | Menu path labels exist in pinned ES | PASS ✓ | strings only; nesting not traced |

**Pass rate:** 13/16 fully met (81%); 2 partial; 0 failed; 1 sub-claim untestable from the repo.

## Code quality assessment

### Strengths

- The destructive boundary is treated as a boundary: everything before the write pins identity (before/after listing, `by-id`, exact size, mounts, system-disk comparison), everything after verifies bytes before touching a filesystem. This is the correct shape for blindspot 25.
- Guards fail closed: `pipefail` before every failing-capable pipeline; the container script asserts hash and size before `dd` under `set -euo pipefail`.
- Claims name their sources. The bench rows say "maintainer's unit", cite the regulator/boot0 evidence and the date, and the runbook forbids turning one unit into a model-wide mapping.
- "Staged" and "installed" are kept apart — in the runbook (update step 5), in the session file, and in what the device shows.
- The ES rule addition points at a runnable check, and the check has an observed positive.

### Concerns

- The worked example (serval) cannot execute most of its own privileged steps as written (F-04). A runbook whose primary machine cannot run it invites the improvisation it exists to prevent.
- One placeholder with no definition (F-05) in the one section that erases a card.
- The "Know who owns each update" section is prose-heavy for a runbook; its intake checklist (lines 35–49) is the reusable part.

### Complexity hotspots

None. The runbook is linear; each section is a small block.

## Cornerstone conformance

**Overall:** MEDIUM-HIGH

### Findings (⚠ / ✗ only; full tables in 03 § 3.2)

- ✗ `decision-register.md` — two decisions unrecorded (F-03).
- ✗ blindspot 27 / `issue-tracking.md` — #44's pending data point answered but not propagated (F-02).
- ⚠ blindspot 1 setup / `worktrees.md` / `fork-workflow.md` — uncommitted on a build branch (F-01).
- ⚠ `engineering-practices.md` § an ask is a decision — the serval gap turns 17 steps into asks (F-04).
- ⚠ blindspot 18 — vendor claims name a source generically, no URL or date (F-08).

## Spec fidelity

### Aligned

Every requirement the 19:29 work-log entry lists is implemented in the runbook (AC-02..AC-06, AC-11). Later additions (update path, ownership essay, TF2, resize boot, multi-partition hazard) are each logged with their trigger.

### Diverged

None material. The session's TF2 format ran inside the build container while the runbook shows `sudo mkfs.ext4` — the F-04 gap seen from the record's side.

## Missing artifacts

| ID | Missing | Severity |
| --- | --- | --- |
| F-01 | A commit on `next` carrying the seven files | High |
| F-02 | #44 comment + body edit with the RG-SP measurement | Medium |
| F-03 | Decision-register rows: docs target = private bench list; serval raw-device access via pinned-device container | Medium |
| F-04 | Serval-executable equivalents for the 17 privileged sites outside the write | Medium |
| F-05 | Definition of `OBSERVED_PARTITION` | Low |
| F-06 | exFAT in the recognised-filesystem list | Low |
| F-07 | The u-boot mechanism behind "activation required"; the DDR4 no-overlay case | Low |
| F-08 | URL + access date for the Anbernic claims (runbook and session file) | Low |
| F-09 | `CLAUDE.md` mirror of the AGENTS.md flashing warning | Low |
| F-10 | The shipped ES source in a durable local clone (only in `/tmp` tmpfs) | Low |

## Risk assessment

| Risk | Severity | Impact | Mitigation |
| --- | --- | --- | --- |
| Uncommitted runbook and rules are lost or re-derived (F-01) | High | A future session flashes a card without §3–§5; or rewrites what exists (blindspot 1) | Commit and merge to `next` (PL-001) |
| #44 keeps waiting for a measurement that exists (F-02) | Medium | The single-image-vs-document decision stays unmade on stale premises | Comment + body edit on #44 (PL-002) |
| Decisions re-argued next session (F-03) | Medium | Docs scope or sudo handling re-decided differently | Two register rows (PL-003) |
| Serval operator improvises privileged steps (F-04) | Medium | A `sudo` ask in chat, or an ad-hoc container with broader device exposure | Document the container/unprivileged equivalents per step (PL-004) |
| `OBSERVED_PARTITION` guessed wrong (F-05) | Low (but destructive step) | `mkfs.ext4` on the wrong node | Define it from the post-`partprobe` listing (PL-005) |
| exFAT card behaves unexpectedly (F-06) | Low | Reader expects it ignored; automounter adopts it and disables the overlay | One sentence (PL-006) |
| Wrong mental model of activation (F-07) | Low | A future device intake treats `dtb.img` as optional | Name the mechanism (PL-007) |
| Vendor claim un-rechecked (F-08) | Low | Blindspot 18 in a year's time | Cite URL + date (PL-008) |
| Claude-only session misses the warning (F-09) | Low | Rule still loads via `device-builds.md` | One bullet in CLAUDE.md (PL-009) |
| Shipped ES source local copy vanishes on reboot (F-10) | Low | Remote has it; only convenience lost | `git fetch` in the durable clone (PL-010) |

## Coverage boundary

**Examined** (depth per AC in 02 § Coverage Boundary): runtime-probed — RG35XX SP (read-only SSH); test-run — ES regression harness (both ways), `sha256sum -c` on retained artifacts, `bash -n` on 14 blocks, direct FAT read of the v9 DDR3 image; code-read — `update.sh`, `mkimage`, `automount`, `init`, `fs-resize*`, `system.cfg`, u-boot `pxe_utils.c` / `dram_sun50i_h616.h`, three u-boot recipes, ES `GuiMenu.cpp` / `GuiSettings.cpp` at `58c19931`, commits `483b270e` / `c5443dd0` / `d3fb1162`, issues #44 / #19 / #10.

**Deliberately not examined:** the RG SP (no SSH channel from this session); the Anbernic web pages (no URL to fetch); ES menu nesting (strings only); the committed ES/ROCKNIX code as code (on `next`, outside this diff).

**Dimensions not exercised:** executing the runbook against a card (destructive; no card attached); the post-reboot v9 UI verification the session lists as pending (a maintainer action — the devices have not been rebooted).

## Finding verification (Phase 4.5)

| Finding | Severity | Survived refutation? | What was checked |
| --- | --- | --- | --- |
| F-01 | High | yes | Re-ran `git log next..HEAD` (empty) and `git status --short` (5 M, 2 ??); checked no other worktree or branch carries the runbook (`git log --all --oneline -- docs/device-flashing-runbook.md` → none); checked `origin/next` == local `next` tip. Nothing mitigates it. |
| F-02 | Medium | yes | Re-read #44 body and its one comment (2026-08-27); searched the work log and session file for "#44" (none). No propagation exists anywhere. |
| F-03 | Medium | yes | Grepped the register for the topics; read D-INFRA-002 (nearest precedent, different decision). |
| F-04 | Medium | yes | Confirmed `sudo -n true` fails on serval; enumerated all 18 `sudo` command lines; the container block covers exactly one. |

## Instruction file recommendations

Absent — issue-tier audit; the 3+ instances rule cannot be evaluated at this scope (SKILL.md § Choosing a tier).

## Tier B visual-QA consolidation

Absent — no UI surface changed in this diff, and the repo has no design-review process.

## Quality self-check

| Item | Status |
| --- | --- |
| Acceptance-criteria scorecard present, IDs match 02 | present (AC-01..AC-16) |
| Cornerstone conformance tables present | present (03 § 3.2, three faces; summarised above) |
| Coverage boundary present (02 + 04) | present |
| Finding verification recorded for all Crit/High | present (F-01; Mediums verified too) |
| Instruction file recommendations (epic/milestone) | absent — issue tier, by rule |
| Tier B visual-QA consolidation present | absent — no UI change, no design-review process |
| Verdicts use the defined vocabulary only | yes (PASS/PARTIAL/UNTESTABLE; AC-10 carries a dual verdict, stated explicitly) |
| Traceability / Evidence / Reproducible / Actionable / Complete | self-checked: every finding cites file:line or a command; every AC has a refutation line; punch items name file and line |
