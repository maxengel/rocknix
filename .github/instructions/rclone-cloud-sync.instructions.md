---
description: "Conventions for the rclone cloud-sync subsystem (save/savestate/screenshot/system backup sync)."
applyTo: "projects/ROCKNIX/packages/network/rclone/**"
---

# rclone cloud-sync conventions

This package ships ROCKNIX's cloud backup/restore for saves, savestates, screenshots,
and system backups. User-facing docs:
<https://rocknix.org/configure/cloud-sync/#cloud-sync-with-rclone>.

## Layout & packaging

- `package.mk` installs a **prebuilt rclone binary** (`PKG_TOOLCHAIN="manual"`); there is
  **no `PKG_SHA256`** and no compile. `PKG_URL` is arch-mapped (`aarch64`→`arm64`, else
  `amd64`). To bump rclone, change `PKG_VERSION` only — the URL/unpack derive from it.
- Scripts install to `/usr/bin`; config templates to `/usr/config`; the user's live config
  is `/storage/.config/`. The EmulationStation **Tools** entries are the symlinks
  `/usr/config/modules/{cloud_backup,cloud_restore}.sh` → `/usr/bin/...`.
- Pieces and their roles:
  - `cloud_backup` / `cloud_restore` — controller-driven TUI flows; each has two phases
    (game saves, then the system-backup `.zip`). Keep these two scripts **structurally in
    sync** — most fixes belong in both.
  - `cloud_sync_helper` — merges `*.defaults` into the user's config on OS update.
  - `rclonectl` — FUSE mount/unmount wrapper (`--vfs-cache-mode writes`).
  - `cloud_sync_cleanup_duplicates.sh` — removes duplicate `VAR=` lines from the conf.
  - `post-update` — runs on update; calls `cloud_sync_helper`, with a copy-based fallback.

## Config conventions

- Two user-facing files, each with a `.defaults` sibling: `cloud_sync.conf` (settings) and
  `cloud_sync-rules.txt` (rclone `--filter-from` rules).
- `cloud_sync.conf.defaults` declares every option with a **`DEFAULT_` prefix**.
  `cloud_sync_helper` strips that prefix and appends only options **missing** from the
  user's file, preserving customizations. **When adding a new option, add it to BOTH**
  `cloud_sync.conf` and `cloud_sync.conf.defaults` (as `DEFAULT_<NAME>`).
- `RCLONEOPTS` is a multi-line, backslash-continued string; the scripts normalize it
  (`tr`/`sed`) into an array before exec. Note `cloud_sync_helper`'s line-based merge does
  not handle this multi-line value well — keep that in mind when touching it.

## Critical gotchas (these are recurring bug sources)

- **Never put `--verbose` or `-v` in `RCLONEOPTS`** — they conflict with rclone's
  `--log-level` and abort the run. Multiple past PRs (#1739/#1726/#1747/#1916) fixed this;
  `cloud_sync_helper` and `post-update` actively strip them from existing user configs.
- **`--delete-excluded` is destructive on restore.** It belongs only on backup
  (local→remote). For restore / copy-to-local operations, strip it (the
  `RESTORE_RCLONEOPTS` pattern) so excluded local files (BIOS, `*.zip`, system backups)
  are not deleted.
- **Single remote only:** operations use `rclone listremotes | head -1` — the first
  configured remote. Don't assume multi-remote support without adding it deliberately.

## Style

- SPDX `GPL-2.0` header + ROCKNIX copyright on every script.
- Log via the `log_message` / `log_to_file` helpers (format
  `[timestamp] [LEVEL] [script] msg`, levels `INFO`/`WARN`/`ERROR`) to
  `/var/log/cloud_sync.log`; pass `"false"` to suppress on-screen echo for debug lines.
- Controller input goes through `read_controller_input` (`evtest`); respect the mappings
  sourced from `/storage/.config/profile.d/098-controller`.
