# Analysis — Cloud-Sync Tier Restructure

**Auditor:** Code Auditor skill · **Date:** 2026-09-03 · **Tier:** Milestone
**Scope:** `1cd78f4a6c`..`e98fdd84f7` + ES `00a258f9d7`; epics #18, #26; issues #56, #58, #59

## 1. Executive summary

A day's work restructured cloud sync into three explicit tiers, changed the backup
container from zip to tar, reshaped the cloud content layout, and added per-device
system selection. The direction is sound and two genuine data-loss paths were closed
during it (content restore overwriting live saves; ROMs stranded by the CONTENTPATH
split). The tier model is a real improvement: what each subsystem carries is now
decided rather than inherited from the filesystem.

The audit found **eleven items, one High**. The High one is the most instructive:
`backuptool` changed what it writes (one archive format at a time), and `cloud_backup`
gates its post-upload size check on `ls A B` succeeding for *both* globs. Neither
script is wrong alone. Together they silently disable the verification added for #53 —
the bug where a backup reported success while transferring nothing — on every device
that has taken one backup since the change. That is the third interaction defect in
this scope, after the two found during implementation.

The second theme is verification debt. Of 22 acceptance criteria, **7 pass and 14 are
PARTIAL or UNTESTABLE**, almost all because the image has not been flashed. Nothing is
failing; most of it is simply unmeasured. The risk is reading that as "nearly done" —
blindspot 13, which this project has already committed.

## 2. Acceptance-criteria scorecard

| Issue | PASS | PARTIAL | UNTESTABLE | SKIP | FAIL |
| --- | --- | --- | --- | --- | --- |
| #56 seeding | 4 | 2 | 3 | 1 | 0 |
| #58 tar | 1 | 1 | 2 | 0 | 0 |
| #59 selection | 2 | 6 | 1 | 0 | 0 |
| **Total** | **7** | **9** | **5** | **1** | **0** |

Pass rate 32%; unverified 64%. See `02-forward-audit.md` for per-criterion evidence.

## 3. Code-quality assessment

**Strengths.** The allowlist rework replaced a denylist with a rule derived from the
device's own `es_systems.cfg`, matched on `<path>` rather than `<name>` — a subtlety
that would have silently dropped a dozen systems. Restore reads three content layouts
and two archive formats while backup writes one of each, which is the "read both,
write the new one" discipline applied correctly and without a prompt. Comments state
*why* at the sites that need it.

**Concerns.** Three defects share a shape: a guard whose failure mode is silence
(F-03 pipeline status, F-04 word-splitting, F-05 `ls` exit status). All three fail
open. In a subsystem whose signature bug is "reported success while doing nothing",
guards that fail open are the wrong default.

**Hotspot.** `backuptool` took create, restore, rotation, discovery and the leak scan
in one commit, with no way to rehearse a real restore. Two of the eleven findings are
in it.

## 4. Cornerstone conformance

Detail in `03-retrospective.md`. Summary: `upgrade-and-install` ✓, `es-native-ui` ✓,
`rclone-cloud-sync` ⚠ (F-05), `engineering-practices` ⚠ (F-03), `documentation-accuracy`
✗ (F-11/PL-06). Blindspot 21 recurs as F-01/F-02 — the boundary is still enforced at a
granularity the data does not have, one level up this time (paths outside
`/storage/roms` entirely).

## 5. Spec fidelity

Two ACs drifted from the shipped design without their bodies being edited (PL-07,
PL-09), which `issue-tracking.md` explicitly forbids: "when a comment supersedes an
acceptance criterion, edit the body in the same action". One AC shipped half its
content (PL-08).

## 6. Missing artifacts

- No rocknix.org documentation for five user-visible changes (PL-06).
- No regression test for the tier-boundary rule. `tools/cloud-round-trip` does not
  assert that a file carried by one tier is absent from another — the assertion that
  would have caught blindspot 21 before the maintainer did.
- No mechanical check that every ES `<path>` maps to exactly one tier (PL-04).

## 7. Risk assessment

| Risk | Severity | Likelihood | Mitigation |
| --- | --- | --- | --- |
| Silent partial cloud upload undetected (PL-01) | High | Certain on any device post-first-backup | Fix before flashing |
| Short backup reported successful (PL-02) | Medium | Low (needs disk-full or a read error) | Fix with the above |
| Player loses ScummVM/idTech entries (PL-04) | Medium | Certain for affected players | Fix before publishing |
| Credential leak undetected (PL-05) | Medium | Low today, rises with themes | Fix before upstream |

## 8. Coverage boundary

**Examined:** all six commits in scope; `backuptool`, `cloud_backup`, `cloud_restore`,
`cloud_content_backup`, `cloud_content_restore`, `cloud_setup`, both rules files, the
ES picker and wizard changes. Mechanical probes run on a live H700: tar symlink and
permission round-trip, staging-pipeline exit status, rclone brace alternation both
directions, `ls` multi-glob exit status, ES `<path>` enumeration, `--scan` /
`--set-systems` / `--systems` / `--selected` round trip, archive member inspection.

**NOT examined:** the ES picker rendered on a device (the image is built but not
flashed); a real `backuptool restore` in either format; any bucket-based remote; the
GENERIC_X64 VM path; the SM8550 image; `cloud_migrate_layout` executed end to end;
concurrent access from two devices.

**Depth:** device-verified for 7 criteria; source-verified only for 9; unmeasured for 5.

## 9. Finding verification (Phase 4.5)

Refutation attempted on the one High finding.

**PL-01.** Attempted refutation: *is there a state where both globs match, making the
gate correct?* Yes — a device whose `BACKUPFOLDER` still holds a `.zip` alongside the
new `.tar.gz`. That is the state immediately after upgrading and before the first
backup, because `backuptool` rotates the previous archive into `archive/` when it
writes a new one. So the finding is correctly scoped to "any device that has taken one
backup since the change", not "all devices". The probe was re-run against the live
device's actual directory contents rather than a constructed case. **Finding stands,
scope narrowed and stated.**

Medium/Low findings were not adversarially refuted (the methodology requires it only
for Critical/High), but each carries a reproduction command in `05-punch-list.md`.

## 10. Instruction File Recommendations

### Coverage gaps (would-have-prevented)

| Finding | Would have been caught by | Uncovered? |
| --- | --- | --- |
| F-01, F-02 | `docs/blindspot-register.md` entry 21 — written the same day, not yet applied backwards | — |
| F-03 | `.claude/rules/engineering-practices.md` § "Verify the artifact, not the report" | — |
| F-04 | `docs/blindspot-register.md` entry 8 (synthetic fixtures) | — |
| F-05 | (none) | **YES** |
| F-11 | `.claude/rules/documentation-accuracy.md` § hard gate | — |

### Codification gaps (needs-new-rule)

| Pattern | Instances | Recommendation |
| --- | --- | --- |
| P-01: a guard that fails **open** — pipeline status, word-splitting, and `ls` exit status all silently skip the check rather than failing loudly | F-03, F-04, F-05 | **Extend** `.claude/rules/engineering-practices.md` with a "Guards must fail closed" subsection: when a check cannot run, that is a failure, not a pass; assert the guard fires by constructing the violation (this is blindspot 14's rule applied to in-script checks rather than to hooks) |

Three instances, so the 3+ rule is met. This auditor does not make the edit — it is an
input to the closing agent.

## 11. Quality self-check

| Mandatory section | Present |
| --- | --- |
| Executive summary | ✓ |
| AC scorecard | ✓ |
| Code-quality assessment | ✓ |
| Cornerstone conformance | ✓ |
| Spec fidelity | ✓ |
| Missing artifacts | ✓ |
| Risk assessment | ✓ |
| Coverage boundary | ✓ |
| Finding verification (4.5) | ✓ |
| Instruction recommendations | ✓ (milestone tier — mandatory) |
| Quality self-check | ✓ |

**Independence caveat:** run by the session that implemented the work, contrary to the
milestone-tier preference for a fresh session. Compensated by citing a primary artifact
or an executed command for every verdict, and by marking recollection-only claims
UNTESTABLE rather than PASS. A fresh-session re-audit would still be worth doing before
upstream.

---

**Audit issue:** https://github.com/maxengel/rocknix/issues/60
