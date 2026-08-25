---
paths:
  - "projects/ROCKNIX/packages/network/rclone/**"
---

# Cloud sync — read before changing anything here

Full detail: `.github/instructions/rclone-cloud-sync.instructions.md`.
Testing without a cloud account: `tools/cloud-test-backend` +
`tools/cloud-round-trip`, both driving a real device image.

Non-negotiables, each of which has already caused a bug:

- **Preserve player progress above all.** Conflict handling must never default
  to recency — a newer file can hold *less* progress than an older one from
  another device.
- **The filter is an allowlist, and `--delete-excluded` is catastrophic on a
  `sync` restore** — "excluded" there means the entire non-save library.
  `cloud_restore` strips it unconditionally; treat any restore-side
  `--delete-excluded` as a bug.
- **Never `--verbose`/`-v` in `RCLONEOPTS`** — it conflicts with `--log-level`
  and aborts the run.
- **Filter rules are first-match-wins.** A rule below the trailing `- /**` is
  unreachable, however correct it looks.
- **UI lives in another repo.** Any CLI add/rename/removal needs a sweep of
  `ROCKNIX/emulationstation-next` and of `ROCKNIX/rocknix.org`.
- **Backups must never contain secrets** — wifi keys, passwords, tokens.
