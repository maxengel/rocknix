Part of #11. Version one **retains** and ships **no** restore control (D-CLOUD-033); this issue is the reader. Its precondition is **Gate 2** (A5): the store #22 writes must already answer the tool's questions from a second device.

**What changed.** No local snapshots, no `savestates/.snapshots/`, no rollback of "any destructive sync": every discarded copy of a wizard decision is already in the cloud under `<SAVES_REMOTE>-discarded/` with a `record.json` (D-CLOUD-036; #22 R9). This tool reads that store. Its home is the same page as the queue — MANAGE GAME SAVE RESTORES AND CONFLICTS (D-CLOUD-035) — as a history view, and it reuses the wizard's compare surface pointed at a game's retained past versions instead of at a live conflict.

### Shape

- Per game, newest first: thumbnail (or glyph), the producing device, when it was discarded, which side won that time. All from `record.json`.
- Choosing one restores it **through the reconciler** as a new publication: the copy it replaces is retained first (the same ordering rule), then the retained version is installed here and published. A restore is a republication with a new `pub`; the old `retired` record does not consume it (A9).
- Copies a sync replaced without anyone deciding (`-replaced/`, where Gate 7 confirms it) are **labelled separately** — they are not *discarded saves* (D-UI-022's residual).
- Requires the network, like everything about a conflict; says so when there is none.

### Acceptance

- [ ] **A5** A test-only reader answers "this game, newest first, thumbnail, producing device, winning side" from the cloud store alone, after a manifest overwrite, a renumber, an audit-log rotation, a clock set backward, all local pending records removed, and from a second device that never made the decision; the store survives an in-place update on a device with real prior state.
- [ ] Restoring a discarded save puts the replaced copy in the store first and installs the chosen bytes byte-for-byte, PNG included.
- [ ] A `-replaced/` copy is shown under its own label and never as a discarded save.
- [ ] The count selector's bound is enforced as the store grows (the oldest goes only after the newest verifies).

**Does not build** before its futro: nothing. The allowlist rule `- /savestates/.snapshots/**` ahead of `+ /savestates/**` stays in #22's R2 as a guard with no writer.

---

---
*Body written from the council's handoff, `research/council-runs/2026-09-05-conflict-resolution-foundation/final-issue-draft.md` (consensus plan `revised_approaches/consensus_plan.md`), applied 2026-09-06 per the maintainer.*
