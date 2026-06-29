---
description: "Conventions for the rclone cloud-sync subsystem (save/savestate/screenshot/system backup sync)."
applyTo: "projects/ROCKNIX/packages/network/rclone/**"
---

# rclone cloud-sync conventions

This package ships ROCKNIX's cloud backup/restore for saves, savestates, screenshots,
and system backups. User-facing docs:
<https://rocknix.org/configure/cloud-sync/#cloud-sync-with-rclone>.

## What gets synced (scope)

`cloud_sync-rules.txt` is an rclone `--filter-from` **allowlist**, with patterns relative to
`BACKUPPATH`/`RESTOREPATH` (default `/storage/roms`). Only these are synced:
- the `savefiles/`, `savestates/`, `screenshots/` directories;
- save-file extensions anywhere: `*.srm`, `*.sav`, `*.fs`, `*.state*`, `*.auto`, `*.dsv*`;
- a few system save dirs (`n64/save/*`, `psx/memcards/*`, `dc/shared/savefiles/`, `psp/PPSSPP/`);
- `backup/*.zip` (the system-backup archive).

Everything else is **excluded**: `roms/`, **`bios/`**, `downloads/`, `images/`, `manuals/`,
`videos/`, `themes/`, disc/ROM types (`*.iso *.chd *.bin *.img *.rom *.7z *.zip ...`),
`*.xml` (gamelists), then a final `- /**` that drops anything not explicitly included. So
ROMs, BIOS, and artwork are **never** uploaded — only saves, savestates, and screenshots.

**Scope guardrail (intent):** every cloud-sync change must serve syncing *only* that set
(saves/savestates/screenshots + the system-backup zip) across devices, and must **never** risk
non-synced local data. Stay within the allowlist; preserve the excludes in any `sync`/bisync
direction (never delete ROMs/BIOS/art); keep a directory chooser limited to save dirs; and keep
the system-backup zip partitioned from the saves flow.

**Preserve player progress above all.** The worst failure is losing progress someone made.
Conflict handling must **not** default to recency — a newer file can hold *less* progress than
an older one from another device. Default to **non-destructive** resolution (keep both copies,
never auto-delete the conflict loser) and prefer prompting/merging over silent overwrite; lean
toward progress (e.g. playtime/size/state heuristics), not timestamps.

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
- `rclonectl` (FUSE **mount** wrapper) + `rsync.conf` / `rsync-rules.conf` are **older,
  pre-`cloud_sync` legacy** code — the `cloud_sync.*` scripts are the current, supported path.
  `rclonectl` is reachable only via manual SSH (no UI/Tools entry invokes it). The rsync
  configs are installed by `package.mk` and re-seeded on every update by the "Sync rsync
  configs" block in `projects/ROCKNIX/packages/rocknix/sources/post-update`. The FUSE-mount
  approach was set aside (the maintainer observed it conflicting with destination providers
  that run their own sync, e.g. Dropbox, and being slower than scheduled copy/sync) — treat
  live-mount sync as **unproven, not forbidden**; it's open to revisiting. Removal is being
  explored in **fork issue #6**.

## Clean install & config bootstrap

On first boot and after every OS update, the live config under `/storage/.config/` is
seeded from the `/usr/config/*.defaults` templates:
- `post-update` runs `cloud_sync_helper` (fallback: a plain copy of the defaults if the
  helper binary is missing).
- `cloud_sync_helper` **creates** `cloud_sync.conf` / `cloud_sync-rules.txt` if absent;
  otherwise it **merges** — backing up the user file (`.bak`), then appending only the
  keys/rules missing from the user's copy, preserving customizations. Config keys come from
  the `DEFAULT_`-prefixed vars in `cloud_sync.conf.defaults`; rules are line-matched against
  `cloud_sync-rules.txt.defaults`.
- `rclonectl` separately seeds the legacy `rsync.conf` / `rsync-rules.conf` if missing.
- rclone itself is **unconfigured** out of the box: backup/restore abort with a clear
  message until the user runs `rclone config` (which creates
  `/storage/.config/rclone/rclone.conf`).

## Critical gotchas (these are recurring bug sources)

- **Never put `--verbose` or `-v` in `RCLONEOPTS`** — they conflict with rclone's
  `--log-level` and abort the run. Multiple past PRs (#1739/#1726/#1747/#1916) fixed this;
  `cloud_sync_helper` and `post-update` actively strip them from existing user configs.
- **`--delete-excluded` is safe on backup but catastrophic on a `sync` restore.** rclone
  delete flags act only on `sync`/`move` — they are a **no-op for `copy`** (the default
  `RESTOREMETHOD`). Because the rules are an allowlist, "excluded" means the *entire*
  non-save library. On backup (dest = remote, which only holds saves) deleting excluded
  files just keeps the remote tidy. On a `sync` restore (dest = local `/storage/roms`) it
  would delete ROMs, BIOS, artwork, videos — everything that isn't a save/state/screenshot.
  The intended guard is the `RESTORE_RCLONEOPTS` pattern (strip `--delete-excluded` for
  restore / copy-to-local), but in `cloud_restore` that variable is currently **computed and
  never used** (tracked in fork issue #5). Treat any restore-side `--delete-excluded` as a bug.
- **Single remote only:** operations use `rclone listremotes | head -1` — the first
  configured remote. Don't assume multi-remote support without adding it deliberately.

## rocknix.org docs & gaps

The user guide (<https://rocknix.org/configure/cloud-sync/>) documents the `cloud_sync.conf`
options and the Tools backup/restore flow. Known gaps vs. the code: it omits `LOG_LEVEL`,
`rclonectl` mount/unmount, the single-remote assumption, and `cloud_sync_cleanup_duplicates.sh`,
and it documents `RSYNCRMDIR` which is **not implemented** anywhere in the scripts. Reconcile
docs against actual behavior before relying on them.

## Style

- SPDX `GPL-2.0` header + ROCKNIX copyright on every script.
- Log via the `log_message` / `log_to_file` helpers (format
  `[timestamp] [LEVEL] [script] msg`, levels `INFO`/`WARN`/`ERROR`) to
  `/var/log/cloud_sync.log`; pass `"false"` to suppress on-screen echo for debug lines.
- Controller input goes through `read_controller_input` (`evtest`); respect the mappings
  sourced from `/storage/.config/profile.d/098-controller`.
