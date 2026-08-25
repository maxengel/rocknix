# Retrospective — Cloud Saves + Conflict Resolution

**Auditor:** Code Auditor skill (v1.8, ROCKNIX-adapted)
**Date:** 2026-08-24
**Subject:** cloud-saves scripts + conflict-resolution epic #11
**Spec:** GitHub issues on maxengel/rocknix

---

## Running Notes

## Project conformance

### Face 1 — instruction files (by `applyTo`)

| File | Relevance | Finding |
|---|---|---|
| `rclone-cloud-sync` | direct (glob matches touched path) | ✓ all three critical invariants hold, verified by running not reading |
| `documentation-accuracy` | direct | ✗ **hard gate unmet** — F-02 |
| `issue-tracking` | direct | ⚠ AC hygiene failed twice — F-01 (tick without behaviour), F-04 (ACs contradict decisions) |
| `engineering-practices` | direct | ✓ "verify design intent before fixing" honoured — the content-backup fix was preceded by `git log --follow` proving it was born broken, not a regression |
| `upgrade-and-install` | direct | ✓ #39's behaviour change on upgrade was identified and recorded before shipping |
| `generic-x64-vm-testing` | direct | ✓ used as the evidence source throughout |
| `es-native-ui`, `fork-workflow`, `worktrees`, `device-builds`, `learning-capture` | indirect | · no findings |

### Face 2 — blindspot register (12 entries)

Checked each against this scope. Repeats found:

- **Blindspot 8 (synthetic-fixture testing)** — partially repeated by F-03: a
  test whose failure did not mean what it appeared to mean.
- **Blindspot 11 (build tree / read from `next`)** — repeated *by this audit's
  own invocation*: the skill loaded the unadapted worktree copy (F-00).
- **No repeat** of 1–7, 9, 10, 12 within this scope.

### FINDING F-05 (Medium) — a register gap: "assumed-done"

Blindspot 1 is **assumed-undone** — treating landed work as unlanded. F-01 is
its exact mirror and has no entry: **assumed-done**, where a checkbox is
ticked on the existence of an artifact (a commit, a file) rather than on
evidence of behaviour. The commit existed, the file existed, the box was
ticked — and the feature had never once worked.

The register has the failure in one direction only, which is likely why the
mirror went unnoticed for the life of the epic. Recommend a new entry.

### Face 3 — project invariants

| Invariant | Result |
|---|---|
| Progress preservation over recency | ✓ upheld in design — bisync `--conflict-resolve none` chosen precisely because it reports rather than picking a winner |
| No secrets in backups | · out of scope (backuptool) |
| Filter is an allowlist; `--delete-excluded` catastrophic on restore | ✓ strip verified at `cloud_restore:373` |
| Upgrade path *and* clean install | ✓ for #39; ⚠ the content-backup fix (`f60ea2b8f8`) reaches devices only via a new image — no migration needed, but no device has it yet |

## 3.5 Cross-system interaction

The script↔ES seam is the risky pair here, and it is where F-01 lived: ES
offered "UPLOAD CONTENT TO CLOUD", the script beneath it downloaded. Both
sides existed and neither was wrong in isolation.

**The seam is only checked in one direction.** Adding a CLI flag prompts an ES
sweep (the instruction file mandates it, and all seven `cloud_setup` flags are
consumed by ES). Nothing verifies the reverse: that an ES menu entry invokes a
script which does what the entry's label promises. AC-08 has both sides
verified; AC-05 had both sides present and semantically opposed.
