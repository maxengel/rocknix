# Retrospective — Cloud-Sync Tier Restructure

## Face 1 — Instruction files (globs matching changed paths)

| Rule | Verdict | Note |
| --- | --- | --- |
| `rclone-cloud-sync` | ⚠ | Allowlist discipline improved (content is now an allowlist). But F-05 disables the #53 size verification, which that rule's spirit demands. |
| `upgrade-and-install` | ✓ | Restore reads three content layouts and both archive formats; backup writes only the new shape. "Read both, write the new one" honoured throughout. |
| `engineering-practices` | ⚠ | "Verify the artifact, not the report" was applied to transfers but not to `backuptool`'s own success path — F-03 is precisely a success report that outruns the artifact. |
| `es-native-ui` | ✓ | Copy conventions applied; the picker uses `GuiSettings` + `SwitchComponent` + `GuiLoading`, no new primitives. |
| `documentation-accuracy` | ✗ | Five user-visible changes (tar archives, ROMs/BIOS layout, folder seeding, system selection, dropped `.zip` dialog text) with **no rocknix.org update prepared**. #42 already tracks drift; this widens it. → F-11 |

## Face 2 — Blindspot register

| Entry | Repeated? | Note |
| --- | --- | --- |
| 7 (archiving symlinks) | no | `find -type f` retained |
| 8 (synthetic fixtures) | **partly** | The leak-scan port (F-04) was reasoned, not exercised against a name with a space — the same "tested the tidy case" shape |
| 10 (fixing forward only) | no | Both archive formats read |
| 13 (assumed-done) | **at risk** | 9 PARTIAL + 5 UNTESTABLE criteria; the risk is reading them as done |
| 20 (edit one tree, build another) | no | Build tree merged and artifact-verified by `strings` |
| 21 (boundary at wrong granularity) | **yes, again** | F-01/F-02: the tier model still has four ES paths in no tier, and today's fix targeted `/storage/roms/music` while the data is at `/storage/.config/gmu/playlists` |

## Face 3 — Project invariants

- **Preserve player progress above all** — improved: `SAVE_EXCLUDES` stops content
  restore overwriting live saves. This was the day's worst latent defect and is fixed.
- **Backups never contain secrets** — sanitisation verified (0 credential lines in the
  archive vs 3 on disk). But the *detector* regressed (F-04, fails open).
- **The filter is an allowlist** — upheld and extended.
- **Every change ships onto populated devices** — upheld for data; F-05 is the exception
  where the upgraded state (one archive format) is the broken one.

## Cross-system interaction (step 3.5)

| Pair | Finding |
| --- | --- |
| saves ↔ content | Fixed today (`SAVE_EXCLUDES`), but only for files under a system dir. F-01 shows the *complement* — paths in neither. |
| backuptool ↔ cloud_backup | **F-05.** backuptool changed what it writes (`.tar.gz`, one format at a time); cloud_backup's gate assumed two globs both matching. Neither script is wrong alone. |
| ES picker ↔ scripts | `--selected` with no selection exits 1, but ES offers the row unconditionally → dead end on first run. → F-10 |
| seeding ↔ content restore | The seeded `README.txt` counted as content size until excluded; fixed, but shows seeded artifacts leak into data paths by default. |
