# Milestone Audit Running Log — Cloud-Sync Tier Restructure

**Auditor:** Code Auditor skill
**Started:** 2026-09-03
**Scope:** Milestone-tier. Crosses epic #18 (backuptool) and epic #26 (fresh-handheld
journey), plus new issues #56 (folder seeding), #58 (tar container), #59 (system
selection). Commits `1cd78f4a6c`..`e98fdd84f7` on `build/rclone-cleanup`, and
EmulationStation `feature/cloud-setup-polish` merged as `00a258f9d7`.
**Spec:** GitHub issue bodies on `maxengel/rocknix` (#56, #58, #59) + decision
register rows D-CLOUD-018..021.

**Tier rationale:** the scope crosses an epic boundary, so per SKILL.md this is
milestone tier regardless of diff size — and the value is expected to be at the seam,
since the two defects already found today (blindspot 21, and the CONTENTPATH split)
were both interaction defects between subsystems that each worked alone.

**Independence caveat, recorded up front:** this audit is run by the same session that
implemented the work. SKILL.md prefers a fresh session for milestone tier. That is not
available here, so the compensating measure is that every verdict must cite a primary
artifact re-read at audit time, and mechanical checks are run rather than recalled.
Findings that depend only on my own recollection are to be marked UNTESTABLE, not PASS.

---

## Log Entries

### [Phase 0] Setup — skill and rule currency
Verified `.claude/skills/code-auditor/{SKILL.md,references/*}` identical to `next`.
Verified `.claude/rules/{rclone-cloud-sync,upgrade-and-install,engineering-practices}.md`
identical to `next`. No stale-rubric risk (the failure mode logged 2026-08-24).
Audit folder created.

### [Phase 1] Research — tier coverage enumerated
Ran the ES `<path>` set on the device against all three tiers.
F-01: four ES system paths (`gmu/playlists`, `idtech`, `modules`, `scummvm/games`)
are captured by no tier — pre-existing, but exposed by making the model explicit.
F-02: today's `6785076383` added `/storage/roms/music/*` to the backup, but ES's
music data lives at `/storage/.config/gmu/playlists`. The added line covers an
empty leftover. Introduced today.

### [Phase 2] tar migration — two defects, both proven on-device
F-03: staging pipeline has no pipefail; first stage exits 1 on missing/unwritable
input, pipeline reports 0, guard never fires. Partial backup -> SUCCESS message.
F-04: leak scan expands ${SCANLIST} unquoted; a member name with a space is skipped
and the credential check fails open. Latent today (0/103 members have spaces).

### [Phase 2] zip->{zip,tar.gz} substitution
Brace alternation verified BOTH directions against the real remote (matched .zip and
.tar.gz; /*.zip-only control correctly matched nothing). All 10 call sites cover both.
F-05 (HIGH): cloud_backup:678 gates on `ls A B` exit status, which is non-zero when
one glob is unmatched -- the normal state after the tar change. local_sum stays empty,
which disables the #53 post-upload size verification at line 833 on every device.

### [Phase 6-7] Issue #60 created; five code findings resolved and device-verified
Six documentation/AC findings deferred with named homes. `tools/lint-audit-artifacts`
FAILED first (no Phase 7 gate; 4 of 11 items not individually addressable because they
were grouped) — the exact class of contract miss it was written for. PASS after fixing.

### [Phase 7 close] All 11 items addressed
9 resolved (5 code fixes device-verified, 2 issue-body corrections, 2 ES changes),
2 deferred with named homes (#42 docs, #35 VM execution). Lint PASS.
Instruction file: engineering-practices gains "Guards must fail closed" (P-01, the
pattern behind three of the five code findings).
Harness: cloud-round-trip +6 steps, including the blindspot-21 regression test that
was missing when the defect shipped.
