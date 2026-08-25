# Forward audit — Cloud Saves + Conflict Resolution

**Auditor:** Code Auditor skill (v1.8, ROCKNIX-adapted)
**Date:** 2026-08-24
**Subject:** cloud-saves scripts + conflict-resolution epic #11
**Spec:** GitHub issues on maxengel/rocknix

---

## Running Notes

## #26 — nine ticked progress items, independently re-derived

Trust posture void (F-01: one tick provably false). Each re-derived from
primary artifacts. `cloud_setup` paths are in
`projects/ROCKNIX/packages/network/rclone/sources/`; ES paths are
`es-app/src/guis/GuiMenu.cpp` in `ROCKNIX/emulationstation-next`.

### AC-01 — Remote setup without SSH-console hop (3-step gated wizard)
**Verdict: PASS ✓ (code) / PARTIAL ⚠ (as a user-facing claim)**
- Evidence: all four gate flags implemented — `cloud_setup` `--info`,
  `--connected`, `--check`, `--free-auth-port`; ES consumes all four.
- **Gap:** the *published* documentation still routes users through SSH +
  `rclone config` (F-02). The console hop is removed from the product and
  still mandatory in the docs, so the criterion "without SSH-console hop" is
  met in code and unmet as delivered experience.

### AC-05 — Content upload
**Verdict: FAIL ✗** — see F-01. Never functional; shipped broken in four
images; fixed today in `f60ea2b8f8`, after the box was ticked.

### AC-08 — Cloud folder (SYNCPATH) editable from ES
**Verdict: PASS ✓**
- `cloud_setup:124` implements `--set-syncpath`.
- `GuiMenu.cpp:4530` invokes it; `:4535/:4537` provide the CLOUD FOLDER editor.
- Both sides of the seam present — this is the pattern F-01 failed to have.

### AC-09 — Cloud Tools scope descriptions (three data classes)
**Verdict: PASS ✓** — 17 matching description strings in `GuiMenu.cpp`.

### AC-04 — Saves/states/screenshots download (`cloud_restore`)
**Verdict: PASS ✓ (mechanical, on device)**
- `tools/cloud-round-trip` against the VM: 4 fixtures uploaded, deleted
  locally, restored **byte-identical** (sha256 compared before/after),
  including a nested path and a filename containing a space.
- Allowlist held: the excluded fixture never reached the endpoint.

### AC-03 — Content restore (`cloud_content_restore` + picker)
**Verdict: PASS ✓ (mechanical, on device, isolated)**
- The suite initially reported content restore as failing, but that was a
  **dependent** failure — nothing had been uploaded for it to restore,
  because AC-05 is broken. Reporting it as a defect would have been wrong.
- Re-tested in isolation by planting content in the endpoint directly,
  bypassing the broken uploader: `--list` enumerated the remote directory and
  the restore pulled both files, nested path included.

### FINDING F-03 (Medium) — the suite cannot distinguish these two
`tools/cloud-round-trip` restores what it just uploaded, so a broken uploader
makes the restore check fail for the wrong reason. One bug masks the other's
status. The content-restore step should plant its fixture in the endpoint
directly (as this audit did by hand) so upload and restore are independently
falsifiable. This is the same class as the vacuous-allowlist assertion already
guarded against in that file — an assertion whose failure does not mean what
it appears to mean.

### AC-02 / AC-06 / AC-07 — system-settings restore, RESTORE EVERYTHING, BACK UP EVERYTHING
**Verdict: PARTIAL ⚠**
- Producer/consumer pair verified statically: `GuiMenu.cpp:4916` writes
  `.cloud-journey-pending`; `main.cpp:665` consumes it. Both surfaces exist —
  the paired check F-01 lacked.
- **Not re-verified at runtime in this audit.** The claim spans a reboot and a
  populated cloud; that cycle was not exercised here. Recorded as unverified
  rather than inferred from the code, per the evidence floor.
- Their backup half depends on `backuptool`, which the user placed out of
  scope for this audit.

---

## #11 conflict resolution — #19–#25

36 acceptance criteria, **0 ticked**. All verdicts **SKIP ○ — not started**;
the epic is design-stage by intent, so incompleteness is not a finding.

The audit value here is not completeness but whether the design an implementer
would build from is the design that was actually decided.

### FINDING F-04 (High) — the acceptance criteria contradict the settled design

Every design decision taken this week lives in **issue comments** (7 on #23
alone) and `docs/conflict-wizard-ia.md`. The **issue bodies were never
updated**, and the bodies are where the `- [ ]` acceptance criteria live —
the contract an implementer works from.

`#23`'s body still specifies, as unticked ACs:

| #23 body says | Actually decided |
|---|---|
| "both versions side by side **with screenshots**" (all conflicts) | screenshots for savestates only; battery saves get a **glyph** — no screenshot exists for a `.srm` |
| "**KEEP CLOUD / KEEP DEVICE / MERGE**" | **KEEP LEFT / KEEP RIGHT / KEEP BOTH**, with the chosen column highlighted |
| "**Summary screen** before applying" | no summary — last CONTINUE becomes **COMPLETE**; summary is an opt-in setting |
| (absent) | no entry screen; cloud always left; no play time; keep-discarded-saves off by default; next-free-slot via `getNextFreeSlot()` |

An implementer reading the issue body — the ordinary thing to do, and where
the checkboxes are — would build the superseded design, including a
screenshot panel for battery saves that **cannot exist**.

**This is F-01's shape repeating at design stage.** In F-01 a checkbox said
"done" and nothing had verified the behaviour. Here the checkboxes say what to
build and nothing has reconciled them with what was decided. In both cases the
tracker is authoritative-looking and wrong.
