# Research notes — Cloud Saves + Conflict Resolution

**Auditor:** Code Auditor skill (v1.8, ROCKNIX-adapted)
**Date:** 2026-08-24
**Subject:** cloud-saves scripts + conflict-resolution epic #11
**Spec:** GitHub issues on maxengel/rocknix

---

## Running Notes

### 1.2 Issues in scope — first pass

**#26 — cloud: fresh-handheld end-to-end journey** (epic, OPEN). Nine progress
items, **all nine ticked `[x]`**. The acceptance test is the full journey:
link a backend → restore everything → play → back up → repeat on a second
handheld.

**#33 — pick the active remote from ES (REMOTENAME)** (OPEN, 5 AC, none ticked).
**#34 — full-snapshot backup & restore** (OPEN, 4 AC, none ticked).
**#11 — conflict resolution** (epic, OPEN). Design-stage; children #19–#25.

---

### FINDING F-01 (Critical) — a ticked acceptance criterion that never worked

`#26` progress list, line 6:

> - [x] Content upload (`cloud_content_backup` + UPLOAD CONTENT TO CLOUD picker, `0eeb1d127e`)

**This was never functional.** `cloud_content_backup`'s transfer loop was
byte-identical to `cloud_content_restore` — remote as SRC, local as TARGET —
so it downloaded instead of uploading, and printed "Restoring … from the
cloud" while doing it. Confirmed today against a live device; nothing ever
left the machine. Filed as #40, fixed in `f60ea2b8f8`.

Evidence:
- `git show 5bb6c30984:…/cloud_content_backup` — the commit that introduced
  the file already contained the restore body. Born broken; no regression to
  bisect.
- Shipped in every published image: `dev-rk3566-20260819`,
  `dev-h700-20260819`, `dev-rk3326-20260819`, `dev-generic_x64-20260821`.

**Why this matters more than the bug itself:** the box was ticked with a
commit hash as evidence. The commit existed and the file existed, so the
tracker looked correct. Nothing had verified the *behaviour*. This is the
exact anti-pattern in the evidence floor — "commit exists" is corroboration,
never proof — and it went undetected for the life of the epic.

**Audit implication:** every other ticked box in #26 must be treated as
unverified until independently re-derived. One false tick in a list of nine
voids the trust posture for the list.

### 1.4 Conformance faces

All 11 instruction files apply (nine use `applyTo: **`). The two specific ones:
`rclone-cloud-sync` (glob matches the touched path exactly) and
`generic-x64-vm-testing`.

**Mechanically verified invariants from `rclone-cloud-sync.instructions.md`
§ Critical gotchas** — all three RUN, not read:

| Invariant | Result | Evidence |
|---|---|---|
| `cloud_restore` strips `--delete-excluded` unconditionally ("treat any restore-side `--delete-excluded` as a bug") | **PASS** | `cloud_restore:373` — `sed 's/--delete-excluded//g'`, with the rationale at :370 |
| `--verbose`/`-v` stripped from user configs | **PASS** | `cloud_sync_helper:170`, `post-update:26` |
| `--delete-excluded` retained on the backup side (safe there, dest is the remote) | **PASS** | `cloud_sync.conf.defaults:35` |

These are the highest-consequence rules in the file — a restore-side
`--delete-excluded` would delete the entire non-save library — and they hold.

### 1.3 Code scope

20 commits on `feature/cloud-saves` not in `next`; 12 files, all under
`projects/ROCKNIX/packages/network/rclone/` plus `qrencode/package.mk`.

---

### FINDING F-02 (High) — the published docs teach the workflow we replaced

`documentation-accuracy.instructions.md` states a **hard gate** (maintainer
rule, 2026-07-23): *"never push code/functionality changes without the
corresponding rocknix.org site update."*

State of `ROCKNIX/rocknix.org` (checkout at `/home/max/Development/rocknix.org`,
branch `main`, working tree clean, no branch prepared):

- `git status` — clean. No cloud-saves docs work exists, staged or drafted.
- No file mentions SET UP CLOUD REMOTE, RCLONE SERVICES, CLOUD FOLDER or
  CLOUD TOOLS.

The docs have not merely lagged. `docs/configure/cloud-sync.md` §§ Step 1–3
still instructs the user to:

1. Turn on SSH and retrieve the root password,
2. `ssh root@<device_ip>` from a computer,
3. run `rclone config` by hand,
4. hand-edit `SYNCPATH` in `cloud_sync.conf`.

That is precisely the console workflow the native wizard was built to
eliminate — six rounds of UX work (2026-08-14…17) whose entire purpose was
moving setup off the SSH console — and `CLOUD FOLDER` now edits `SYNCPATH`
from the menu.

**Impact:** a user following the published documentation is walked through the
superseded path and never discovers the feature. Actively wrong documentation
is worse than missing documentation, because it reads as current and is
followed with confidence.

**Scope of the drift** — user-facing surfaces shipped with no doc counterpart:
the 3-step setup wizard, RCLONE SERVICES / CLOUD TOOLS menu structure,
BACKUP / RESTORE SYSTEM DATA, content upload/restore, CLOUD FOLDER editing,
and the #39 behaviour change where user sync rules begin taking effect.

**Note on gate wording:** the gate binds "an upstream feature PR". No upstream
PR is open for cloud-saves, so this is not yet a violation *of an upstream
push* — but four device images carrying these surfaces have been published to
testers, which is shipping user-facing behaviour by any practical reading.
