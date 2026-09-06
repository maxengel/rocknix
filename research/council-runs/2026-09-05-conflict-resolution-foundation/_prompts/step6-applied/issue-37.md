Child of #15 (L3). Depends on #22.

**What changed.** The tile no longer runs `cloud_restore --saves-only`: every writer goes through `cloud_reconcile` (#22 R1), so the tile runs `cloud_reconcile --from-cloud --yes` under `L_T`. The label is **RESTORE SAVES**, not SYNC — a player pressing it chose a direction, and *sync* is the automatic two-way behaviour (D-UI-022). Origin badging on the tiles reads `device.label`, `core` and `core_build` from the save manifests (`docs/save-manifest-schema.md` §6), never re-derives them (`docs/save-manifest-alignment-review.md` §3.5). Because it is attended but sits on the launch screen, a conflict it finds for this game is **not** opened here: the toast says `1 CONFLICT WAITING` and the badge appears; the player resolves it from MANAGE GAME SAVE RESTORES AND CONFLICTS (D-CLOUD-035).

### Acceptance

- [ ] The leftmost tile reads RESTORE SAVES, shown only when `rclone.conf` exists; the default cursor position is unchanged.
- [ ] Selecting it runs `cloud_reconcile --from-cloud --yes` behind a blocking `GuiLoading`; the process list shows that and nothing else; the grid cannot be operated until it returns.
- [ ] Exit 3 (lock) and 4 (no route) show as SKIPPED with the shipped wording; a queued conflict shows `RESTORE SAVES : 1 CONFLICT WAITING` and the grid is rebuilt from disk with the non-conflicting states present.
- [ ] Wrapped in `/usr/bin/timeout`; on timeout the grid stays usable and the toast says so.
- [ ] A tile for a state another device produced shows that device's label from the manifest; a state with no entry shows `unknown`.
- [ ] Help bar reads RESTORE while the tile is selected.
- [ ] While the reconciler runs (this tile or any other caller), launching a game from this screen is refused with the shipped sync message (D-CLOUD-038).

### Gap

The COPY TO FREE SLOT action here and `copyToSlot` share `makeStateFilename`'s default `fullPath`, declared in `SaveState.h` (not in the corpus). Verify before touching either path (#24).

---

---
*Body written from the council's handoff, `research/council-runs/2026-09-05-conflict-resolution-foundation/final-issue-draft.md` (consensus plan `revised_approaches/consensus_plan.md`), applied 2026-09-06 per the maintainer.*
