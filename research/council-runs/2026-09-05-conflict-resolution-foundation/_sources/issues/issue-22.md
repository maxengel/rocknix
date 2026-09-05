author:	maxengel
association:	owner
edited:	false
status:	none
--
## bisync may already do most of the detection

Checked on a device running rclone **1.74.4**: `bisync` has native conflict detection, and its defaults happen to match this project's rules.

```
--conflict-resolve string   ... none, path1, path2, newer, older, larger, smaller (default "none")
--conflict-loser  ...       num, pathname, delete (default: num)
--conflict-suffix ...       (default: 'conflict')
```

- **`--conflict-resolve none` is the default**, so bisync *detects and reports* rather than picking a winner. That is exactly the guardrail in `rclone-cloud-sync.instructions.md` — conflict handling must never default to recency, because a newer file can hold less progress.
- **`--conflict-loser num`** renames the loser rather than deleting it, which is close to what "keep discarded saves" wants.

**So this issue may be much smaller than scoped.** Detection could be *reading what bisync already found* rather than building manifest diffing. Manifests (#20/#21) are still needed to **display** a conflict — device name, emulator, core — but possibly not to **find** one. Worth confirming before building a detection engine we may not need.

Links to #9 (adopt bisync), which becomes a dependency rather than a parallel idea.

### One trap if we do use it

**Do not let bisync rename savestate losers.** Its suffix produces names like `game.state3.conflict1`, which no longer match the `{{romfilename}}.state{{slot}}` pattern ES's savestate manager uses — the file would still exist but vanish from the UI, which is worse than either keeping or deleting it. Detect with bisync, then do slot-based resolution ourselves.
--
author:	maxengel
association:	owner
edited:	false
status:	none
--
**Prior-work grounding (retro on #26, 2026-09-04):** two constraints now exist in code. (1) Every transfer script takes `take_cloud_lock` — non-blocking `flock` on `/var/run/cloud_sync.lock`, exit 3 = SKIPPED (`b9ea9f3fe8`). A bisync-based detector is a fourth caller and goes through the same lock. (2) The design forbids letting bisync rename savestate losers: `…conflict1` breaks `{{romfilename}}.state{{slot}}` and the file vanishes from the savestate manager. Detect with bisync, resolve into slots ourselves. #9 (adopt bisync) is therefore a hard dependency of this issue, not backlog.
--
author:	maxengel
association:	owner
edited:	false
status:	none
--
**Pre-futro audit — 2026-09-05.** Live state: rclone 1.75.0 with bisync (`--recover`, `--resilient`, `--resync-mode` default path1, workdir `/storage/.cache/rclone/bisync`); lock in all four transfer scripts; **the shipped boot pair and SYNC row are `copy --update` both ways and the game-exit upload is `copy` with no `--update` — newest-wins today** (blindspot 28). Scope change surfaced to the maintainer via the futro: this issue owns the write paths. **Post-futro audit — 2026-09-05.** Seven ACs added; D-CLOUD-029 parked for the stopgap. **Paused** until #35's round-trip suite has run on a VM and the bisync spike is done.
--
author:	maxengel
association:	owner
edited:	false
status:	none
--
D-CLOUD-029 settled by the maintainer (2026-09-05): **the write paths stay as shipped until this issue replaces them.** No `--update` stopgap on the game-exit upload — with or without it the risk is the same in kind (a clobber, or not landing the intended state; the flag only changes which copy loses), and the maintainer is the only user until conflict resolution exists. The acceptance criteria above are unchanged: this issue gates the boot pass, the game-exit pass and the SYNC row on last-agreed state.
--
author:	maxengel
association:	owner
edited:	false
status:	none
--
Constraint from the manifest alignment review (2026-09-05, `docs/save-manifest-alignment-review.md`): a file with **no manifest entry on either side** is `unknown`-both and still falls under "never agreed → ask" — the conservative branch, never silently transferred. And a sync client's conflicted copy (Dropbox "conflicted copy", Syncthing `.sync-conflict-`; D-CLOUD-022) is **never offered as a version**: it has no entry, it is not moved, it stays where it is.
--
