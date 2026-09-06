# #22 [OPEN] conflict-resolution: conflict detection engine (local vs cloud manifests)
labels: cloud-saves  milestone: Cloud Saves: Visual Conflict Resolution

Part of the conflict-resolution milestone (epic: #11). Depends on manifests (#20/#21).

Detect real conflicts instead of trusting timestamps. Conflicts arise when someone forgets to sync up on device A, syncs down on device B, plays, and syncs up — both sides now diverge from the last common state.

## Tasks
- [ ] Track last-synced state per file (small local db / remote manifest snapshot) so "both changed since last sync" is detectable — not just "differs".
- [ ] Classification: local-only / cloud-only / identical / **divergent** (needs user decision); group by system → game for the wizard (#23).
- [ ] Machine-readable conflict list (JSON) consumed by the ES UI, including both manifests + screenshot paths.
- [ ] Non-destructive by default: no transfer happens for divergent items until resolved (progress-preservation guardrail).
- [ ] CLI mode for debugging (`cloud_conflicts --list`).

## Acceptance
Forced-conflict test matrix (edit both sides) yields correct classification and a stable JSON the UI can render.


## Futro adjustments (2026-09-05, futro on #11) — this issue owns the write paths

Verified 2026-09-05: the shipped two-way sync already resolves a both-sides change by recency, before any detector runs.

```
autostart/102-cloud-saves:21   /usr/bin/cloud_restore --yes --method=copy --update
autostart/102-cloud-saves:22   /usr/bin/cloud_backup  --yes --method=copy --update
GuiMenu.cpp (SYNC SAVE DATA)   the same pair
FileData.cpp:836 (game exit)   /usr/bin/cloud_backup --yes --saves-only --recent
cloud_backup:639-646            --recent: --max-age Ns --no-traverse, method forced to copy, no --update
```

`copy --update` skips only a newer destination, so down-then-up is newest-wins with no record; the `--recent` upload has no `--update` and overwrites a newer cloud copy outright. Blindspot 28. Stopgap decision parked as D-CLOUD-029.

Additional acceptance criteria:

- [ ] A save changed on both sides since the last agreement is **refused, not resolved**, by the boot pass, the game-exit pass and the SYNC row — shown by a constructed two-device fixture in `tools/cloud-round-trip` (#35) whose pass condition is that neither copy was overwritten.
- [ ] The detector never runs `bisync --resync` on its own (`--resync-mode` defaults to path1-wins); the first run is an explicit, maintainer-driven step; `--recover` and `--resilient` are used.
- [ ] `--conflict-loser` is never left to rename a savestate; a dry-run listing grepped for `conflict` in filenames is the guard, and it is shown to fire on a constructed conflict.
- [ ] The bisync workdir is named explicitly in the script and lives outside the synced tree (default `/storage/.cache/rclone/bisync`; `HOME=/storage`).
- [ ] Every call takes `take_cloud_lock`; exit 3 = SKIPPED is surfaced.
- [ ] Before the `copy --update` pair is replaced or wrapped, the issue records what it guarded and where each guard now lives: the newer-on-destination skip, restore-before-backup ordering, the `--recent` window, the stamps GAME SETTINGS reads (D-UI-018).
- [ ] A silent run is distinguishable from "no conflicts" (blindspot 22): the JSON carries an explicit status, never an empty list standing for success.

