**What changed.** This is a one-hour run, not research (D-CLOUD-025). It no longer blocks #20 — identity is decided (D-CLOUD-030/031) and the device model already comes from `cloud_device_id --label` (`Anbernic-RG35XX-SP` on the RG35XX SP, `/proc/device-tree/model`). It gates exactly one thing: whether #23's badge is a **safeguard** or a **convenience**, which turns on whether a failed load is loud or silent. Every other child of #11 proceeds without it.

### Run `docs/savestate-compat-test.md`, in this order

1. Both H700 handhelds report `HW_DEVICE=H700` and distinct `cloud_device_id --label` values — one command each.
2. **Same-chipset control** (RG35XX SP ↔ RG-SP, one build, one content-less core such as `cap32`): does a state written on one load on the other and show the typed line?
3. Cross-chipset (RK3566, RK3326), all on the same build — different builds confound core version with chipset.
4. **Loud or silent**, even if 2 and 3 pass: truncate a state; flip bytes without changing size; repeat with `savestate_file_compression = "false"`.

### Acceptance

- [ ] A table per test — source, target, core, core build, result, photo where the result is visual — attached here.
- [ ] The same-chipset control is recorded before any cross-chipset row.
- [ ] The badge rule is written as one sentence on #23: *warn when core build differs* / *also when chipset differs* / *block, because failure is silent* — whichever the run shows.
- [ ] The RG35XX SP and RG-SP report distinct labels through `cloud_device_id --label` (already observed on one; confirm on the pair).

**Does not build**: no rules engine, no machine-readable matrix beyond the table above; #10 does not wait on this.

---

---
*Body written from the council's handoff, `research/council-runs/2026-09-05-conflict-resolution-foundation/final-issue-draft.md` (consensus plan `revised_approaches/consensus_plan.md`), applied 2026-09-06 per the maintainer.*
