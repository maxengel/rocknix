# #7 [OPEN] cloud-sync: liveness check + sync on boot and shutdown
labels: enhancement, cloud-saves  milestone: none

## Summary
Add a remote **liveness check** and trigger cloud sync automatically on **boot** (pull latest) and **shutdown** (push latest), so devices stay current without manual Tools actions.

## Scope
- Liveness check: confirm network is up and the remote is reachable (e.g. `rclone lsd <remote>`); skip gracefully and log when offline.
- Boot: restore/pull latest saves before play.
- Shutdown: back up/push latest saves; must complete before network teardown.
- Wire via systemd (a boot oneshot + correct shutdown ordering) calling the existing scripts.

## Considerations
- Boot delay budget; shutdown race with network down.
- Interacts with auto-save-after-exit, bisync, and conflict resolution (see related backlog issues).

_Related: bisync, conflict resolution, system-backup revamp._

