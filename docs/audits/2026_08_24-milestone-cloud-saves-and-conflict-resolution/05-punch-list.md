# Punch list — Cloud Saves + Conflict Resolution

**Date:** 2026-08-24 · 5 findings (1 Critical, 2 High, 2 Medium)

Audit-discovered only. Pre-existing tracked scope (#33, #34, #19–#25 build
work) is listed separately at the bottom and is exempt from the resolution
gate.

---

## PL-01 — Critical — ship the content-backup fix
- **Category:** Acceptance Criteria Gap · **Source:** F-01 · **Area:** rclone scripts
- **What:** `f60ea2b8f8` inverts the direction, but every published image still
  carries the broken script. Until a build ships, "upload content to the cloud"
  silently overwrites local content with cloud copies.
- **Where:** `projects/ROCKNIX/packages/network/rclone/sources/cloud_content_backup`
- **Evidence:** `cloud_content_backup qa-content` on the shipped image →
  0/3 files at the endpoint; fixed script under identical config → 3/3.
- **Acceptance:** a build carrying `f60ea2b8f8` published, and
  `tools/cloud-round-trip` reports content backup PASS against it.

## PL-02 — High — rocknix.org teaches the replaced workflow
- **Category:** Documentation Gap · **Source:** F-02 · **Area:** rocknix.org
- **What:** `docs/configure/cloud-sync.md` still instructs SSH + manual
  `rclone config` + hand-edited `SYNCPATH`. Document the wizard, RCLONE
  SERVICES / CLOUD TOOLS, CLOUD FOLDER, and content upload/restore.
- **Evidence:** site-wide grep for every shipped surface name → zero matches.
- **Acceptance:** a `ROCKNIX/rocknix.org` branch exists covering the shipped
  surfaces, and no page instructs the SSH path as the primary route.

## PL-03 — High — reconcile #23's ACs with the settled design
- **Category:** Spec Drift · **Source:** F-04 · **Area:** tracker
- **What:** #23's body still specifies KEEP CLOUD/DEVICE/MERGE, a summary
  screen, and screenshots for every conflict. Decisions live in 7 comments.
  Edit the body; the checkboxes are the contract.
- **Evidence:** body vs `docs/conflict-wizard-ia.md` rev 4 — four direct
  contradictions tabulated in `02-forward-audit.md`.
- **Acceptance:** #23's ACs match the IA doc; same sweep for #20/#21/#24.

## PL-04 — Medium — make content upload and restore independently falsifiable
- **Category:** Test Gap · **Source:** F-03 · **Area:** QA tooling
- **What:** the restore step restores what the upload step just wrote, so a
  broken uploader fails the restore check for the wrong reason.
- **Where:** `tools/cloud-round-trip`
- **Acceptance:** content restore plants its fixture at the endpoint directly;
  breaking the uploader leaves the restore check passing.

## PL-05 — Medium — register the "assumed-done" blindspot
- **Category:** Documentation Gap · **Source:** F-05 · **Area:** docs
- **What:** entry 1 covers assumed-*undone*. Its mirror — ticking an AC on an
  artifact's existence rather than observed behaviour — has no entry, and cost
  a whole epic's worth of confidence here.
- **Acceptance:** entry 13 added; `issue-tracking.instructions.md` states that
  a checkbox is ticked on observed behaviour, never a commit hash.

---

## Pre-existing tracked scope (exempt from the gate)
#33, #34 (unstarted cloud-saves children) · #19–#25 (conflict-resolution build
work) · #38, #39, #40 (filed during this session's work)

---

## Phase 7 — resolution gate

| Item | Outcome | Evidence |
|---|---|---|
| PL-01 ship content-backup fix | **(b) Deferred** — needs a build. `f60ea2b8f8` is merged into `test/qa-integration` (`59b1d800b4`) and will ship in the rebuild already planned before the hardware session. Named, not silent. |
| PL-02 rocknix.org docs | **(b) Deferred** — follow-up **#42** filed in-session. A real docs PR against a separate repo, larger than the audit cycle absorbs. |
| PL-03 reconcile #23 ACs | **(a) Resolved** — #23's body rewritten; ACs now match `docs/conflict-wizard-ia.md` rev 4, with the supersession dated and the IA doc linked. |
| PL-04 decouple content restore from upload | **(a) Resolved** — backend gained `put`; verified on device: restore passes 3/3 byte-identical while the broken uploader still fails. Two coupled failures became one true one. |
| PL-05 register "assumed-done" | **(a) Resolved** — blindspot 13 added; `issue-tracking.instructions.md` gained "Ticking an acceptance criterion". |

**Gate status: satisfied.** Every item has a recorded outcome; both deferrals
are named with a tracked follow-up.
