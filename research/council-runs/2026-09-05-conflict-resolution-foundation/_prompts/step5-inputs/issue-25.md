# #25 [OPEN] conflict-resolution: pre-change save snapshots and rollback (V2)
labels: cloud-saves  milestone: Cloud Saves: Visual Conflict Resolution

Part of the conflict-resolution milestone (epic: #11). V2 — **planned from the onset** so earlier pieces don't preclude it; built after the wizard ships.

Before any conflict resolution (or destructive sync) mutates saves, snapshot the affected files so the player can roll back.

## Tasks
- [ ] Snapshot layout + retention (e.g. `savestates/.snapshots/<timestamp>/`, excluded from the sync allowlist; size-capped, N most recent).
- [ ] Hook: the wizard's apply step (#23) and any `sync`-mode transfer snapshot first.
- [ ] Manifest schema (#20) reserves the fields snapshots need (origin, reason, resolved-against).
- [ ] Rollback UI: list snapshots per game, restore with confirmation (reuses the wizard's visual language).

## Acceptance
Resolving a conflict wrongly is recoverable: one rollback restores the pre-resolution state byte-for-byte.


## Added by the manifest alignment review (2026-09-05)

- [ ] The snapshot directory is excluded from the sync allowlist by a rule placed **before** `+ /savestates/**` in `cloud_sync-rules.txt` (`- /savestates/.snapshots/**`): rclone filters take the first match, so anything under `savestates/` syncs unless a rule ahead of that line stops it. "Excluded from the allowlist" is a requirement on this issue, not a property of the layout (`docs/save-manifest-schema.md` §8). Verified by the allowlist fixture (`rclone lsf -R --filter-from`) showing the snapshot path absent.
- [ ] A snapshot's own manifest uses the save manifest schema unchanged (`kind`, `sha256`, `replaces`); the reason it was taken is an audit-log line (D-CLOUD-027), not a schema field.

