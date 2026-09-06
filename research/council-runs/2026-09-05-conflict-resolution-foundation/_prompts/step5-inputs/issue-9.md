# #9 [OPEN] cloud-sync: adopt rclone bisync to unify backup/restore
labels: enhancement, cloud-saves  milestone: none

## Summary
Replace the separate `cloud_backup` + `cloud_restore` with rclone **bisync** for a single bidirectional sync.

## Prior art
Planning doc `plans/bisync/rclone-bisync-planning.md` and branch `rclone-bisync-beta` (commit `4be6c47146`).

## Scope / considerations
- First-run `--resync` bootstrap; persistent state/workdir across reboots.
- Filter parity with `cloud_sync-rules.txt`.
- Built-in conflict handling (`--conflict-resolve` / `--conflict-loser`) — ties into the conflict-resolution issue.
- Robust recovery from interrupted runs (immutable rootfs / sudden power-off).

_Related: conflict resolution, liveness, system-backup revamp._



## Superseded scope (alignment review, 2026-09-05)

The planning doc on `rclone-bisync-beta` (Phase 3: "automatic conflict resolution (newer file wins)", `--conflict-resolve newer`) predates the milestone's rule and **is struck**: #11's cardinal rule is that resolution never defaults to recency, and `docs/conflict-wizard-ia.md` gives the wizard the decision. What bisync contributes here is **detection** — `--conflict-resolve none` (its default) reports; the wizard resolves; `--conflict-loser` is never left to rename a savestate (`…conflict1` breaks `{{romfilename}}.state{{slot}}`); the detector never runs `--resync` on its own. The acceptance criteria that bind this are on #22. Per-core handling (the plan's Phase 4) is #10 / D-CLOUD-017; the "newer wins" bullets in the plan are historical.

