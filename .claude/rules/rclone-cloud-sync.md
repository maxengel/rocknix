---
description: "Conventions for the rclone cloud-sync subsystem (save/savestate/screenshot/system backup sync)."
paths:
  - "projects/ROCKNIX/packages/network/rclone/**"
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

**User intent (design north star):** the two flows to serve are (1) *new/reset device* —
restore saves/savestates/screenshots from the cloud onto a fresh handheld, and (2)
*multi-device* — the cloud as the hub for moving between handhelds, which is why conflict
resolution (below) is the long-term goal. ROM/BIOS distribution is **not** part of the
gamesave sync flows; if it ever belongs anywhere, it's the system backup/restore domain.

**Console-first (hard rule, 2026-07-25):** ROCKNIX is a handheld gaming OS. Product
surfaces — UI labels, dialogs, script output, on-device help, public docs — must assume a
player holding the handheld with, at most, a phone as the companion device. There is no
browser on the device; never instruct users to "open a link" on it. QEMU/VMs are a QA
vehicle only: no product-facing text may mention QEMU, VMs, port forwards, or emulator
setups (that guidance belongs in dev docs/release notes). A computer may be referenced
only where technically unavoidable (e.g. rclone's OAuth `authorize` step).

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
- The legacy pre-`cloud_sync` code (`rclonectl` FUSE-mount wrapper, `rsync.conf`,
  `rsync-rules.conf`, and the post-update "Sync rsync configs" seeding block) was
  **removed on 2026-07-23** (fork issue #6; maintainer decision in favor of the current
  `cloud_sync.*` path). Stale `/storage/.config/rsync*.conf` on user devices are left in
  place deliberately — we stopped seeding rather than deleting from user storage. The
  FUSE live-mount approach itself remains **unproven, not forbidden** (past observations:
  conflicts with providers running their own sync, e.g. Dropbox; slower than scheduled
  copy/sync) — revisiting it would be a fresh build on the `cloud_sync.conf` model.
- `RSYNCRMDIR=yes` (legacy name kept for config compat) is now **implemented**: after a
  successful game-saves backup (exit 0 or 9), `cloud_backup` runs
  `rclone rmdirs <remote> --leave-root` to prune empty remote directories.

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
- rclone itself is **unconfigured** out of the box: backup/restore abort with a clear
  message until the user runs `rclone config` (which creates
  `/storage/.config/rclone/rclone.conf`).

## Critical gotchas (these are recurring bug sources)

- **UI surfaces live in a separate repo.** EmulationStation
  (`ROCKNIX/emulationstation-next`, `es-app/src/guis/GuiMenu.cpp`, Network Settings →
  CLOUD SERVICES) references cloud-sync tools directly — the issue #6 sweep missed the
  `rclonectl` "MOUNT CLOUD DRIVE" toggle there because it only grepped this repo. Any
  add/rename/removal of a cloud-sync CLI must include a sweep of the ES repo (and
  rocknix.org) too.

- **Never put `--verbose` or `-v` in `RCLONEOPTS`** — they conflict with rclone's
  `--log-level` and abort the run. Multiple past PRs (#1739/#1726/#1747/#1916) fixed this;
  `cloud_sync_helper` and `post-update` actively strip them from existing user configs.
- **`--delete-excluded` is safe on backup but catastrophic on a `sync` restore.** rclone
  delete flags act only on `sync`/`move` — they are a **no-op for `copy`** (the default
  `RESTOREMETHOD`). Because the rules are an allowlist, "excluded" means the *entire*
  non-save library. On backup (dest = remote, which only holds saves) deleting excluded
  files just keeps the remote tidy. On a `sync` restore (dest = local `/storage/roms`) it
  would delete ROMs, BIOS, artwork, videos — everything that isn't a save/state/screenshot.
  **Decision (2026-07-23, issue #5 finding #1):** `cloud_restore`'s `load_config` now strips
  `--delete-excluded` unconditionally (like the `--verbose` strip); `sync` restores keep
  mirror semantics *within* the allowlist but can never delete outside it. Preserve that
  strip in any refactor, and treat any restore-side `--delete-excluded` as a bug.
- **The two phases have different transfer roots, so filter rules do not carry
  between them.** Phase 1 runs from `BACKUPPATH` (`/storage/roms`); phase 2 runs
  from `BACKUPFOLDER` (`/storage/roms/backup`) to `SYNCPATH_BACKUP`, and on
  restore from `SYNCPATH_BACKUP` back. `cloud_sync-rules.txt` is anchored to
  `BACKUPPATH`, so in phase 2 every one of its rules describes a path that does
  not exist -- and its `- /**/*.zip` matches the archive itself. **Never pass
  `--filter-from` in the system-backup phase.** The archive lives at the *root*
  of `SYNCPATH_BACKUP`, not under a `backup/` directory: match it with
  `--include=*.zip`. (2026-08-26: `cloud_restore` filtered on `backup/*.zip`,
  matched nothing, transferred nothing, exited 0 and printed SUCCESS. It shipped
  in four images that way.)

- **rclone applies `--include`/`--exclude` ahead of `--filter-from`.** Verified,
  not assumed. This is why the backup side of the same mistake had no symptom: a
  bare `--include=*.zip` outranked the misanchored allowlist that would otherwise
  have excluded the archive. Do not lean on it -- it makes a broken filter set
  look healthy. And using `--include` at all excludes everything it does not
  match, so a single wrong include is a silent no-op transfer, not an error.

- **rclone matches paths relative to the transfer root**, so an absolute
  `--exclude=/storage/roms/backup/**` never matches anything. Derive such
  patterns from the configured directory instead of hard-coding a name.

- **`SYNCPATH_BACKUP` must be a sibling of `SYNCPATH`, never inside it.** Phase 1
  syncs `SYNCPATH` with `--delete-excluded` and the archive is an excluded file,
  so a nested path is deleted there. A full run hides this -- phase 2 re-uploads
  moments later -- but a `--saves-only` run (or `BACKUPFILE_BACKUP_OPTION="no"`)
  deletes the archives and puts nothing back. `cloud_backup` now warns when the
  two are nested and the method can actually delete.

- **Reachability means the remote, not the internet.** `check_internet` used to
  ping `google.com`, wrong in both directions: it fails for a self-hosted or LAN
  remote that needs no internet, and on networks where that host is blocked,
  while passing happily when the user's provider is down or their sign-in has
  expired. Test the configured remote; probe further only to word the failure.

- **Single remote only:** operations use `rclone listremotes | head -1` — the first
  configured remote. Don't assume multi-remote support without adding it deliberately.

## Testing it without a cloud account

`tools/cloud-test-backend` serves a directory on the host over WebDAV;
`tools/cloud-round-trip` drives a device through save backup/restore, the
system-backup archive, and content sync against it
over SSH. A VM from `generic-x64-vm` reaches the host at `10.0.2.2`, so nothing
needs forwarding.

```bash
./tools/cloud-test-backend up                    # WebDAV on :9010
./tools/cloud-round-trip --host root@127.0.0.1 --port 10022 --identity <key>
./tools/cloud-test-backend ls                    # what the device uploaded
./tools/cloud-test-backend down

CLOUD_QA_BACKEND=s3 ./tools/cloud-test-backend up   # MinIO instead
CLOUD_QA_BACKEND=s3 ./tools/cloud-round-trip --host ... # bucket-based path
```

### Runbook

```bash
./tools/cloud-test-backend up                       # WebDAV on :9010
./tools/cloud-round-trip --host root@127.0.0.1 --port 10022 --identity <key>
./tools/cloud-test-backend ls                       # what the device actually uploaded
./tools/cloud-test-backend down                     # ALWAYS -- see below
```

Four things that cost time on 2026-09-03:

- **`down` matters.** WebDAV runs as a bare `rclone serve` on the host, and it
  survives the session that started it. A stale one holding :9010 makes the next
  `up` fail with `address already in use`, and the S3 path additionally leaves a
  half-created container behind (`docker rm -f rocknix-cloud-qa`). `CLOUD_QA_PORT`
  moves it if you need both at once.
- **The host's rclone is not the device's.** This host had **1.60.1-DEV**; the
  device ships **1.74.4**. Backend options differ across that gap —
  `--s3-directory-markers` does not exist in 1.60. Test rclone behaviour by
  running rclone *on the device* against the QA endpoint, not on the host.
- **A real device can reach the host's MinIO too**, not just a VM: bind the
  backend and point the device's rclone config at the host's LAN address. Faster
  than booting a VM when the question is purely about rclone semantics.
- The device reaches a VM-host at `10.0.2.2`; a LAN device needs the real IP.

### Bucket remotes behave differently, and it is not a detail

Run the S3 path (`CLOUD_QA_BACKEND=s3`, MinIO) whenever a change touches
existence checks, directory creation, or layout. Two traps, both found this way:

- **`rclone lsjson --stat` is not an existence test on a bucket remote.** It
  synthesises a directory entry for *any* path — `utterly-bogus-never-created`
  returns `IsDir: true` on 1.60, 1.74 and 1.75 — how bucket remotes work, not a bug awaiting a fix. Three call sites branched on it,
  so on S3 the migration always refused ("destination already exists"), the
  content-restore legacy fallback was dead, and the seeding report could only
  ever say OK. Use a **listing**: does the path contain anything, or does its
  parent list it?
- **`rclone mkdir` exits 0 while creating nothing.** Empty directories do not
  exist on S3; rclone even says so (`Warning: running mkdir on a remote which
  can't have empty directories does nothing`) and still returns success. The
  standard fix is a zero-byte object whose key ends in `/`, which is what the S3
  console itself writes — rclone does it with **`--s3-directory-markers`**
  (default off). B2 has no equivalent rclone flag.

The consequence for design: a folder we want a player to *see* needs either a
marker or a file in it. Our seeded folders get both — the marker so the folder
persists, and a `README.txt` because a folder that says what belongs in it is
worth more than an empty one.

Getting a VM to an SSH target the driver can use: boot it, then over the
serial console (`-serial unix:`) enable sshd and drop in a key —
`systemctl start sshd`, then write your public key to
`/storage/.ssh/authorized_keys` (mode 600, directory 700). SSH is off on a
fresh image, and the console gives a root shell without login.

- **WebDAV, not S3, by default.** Dropbox/Drive/OneDrive are path-based, so
  `SYNCPATH="/GAMES"` is a folder. On S3 and B2 the first path component is the
  *bucket*. rclone creates buckets on demand, so a missing one is not the
  problem - the problem is that `GAMES` is not a **legal** bucket name
  (lowercase only, 3-63 chars), so it is rejected with `InvalidBucketName`
  before anything can be created (issue #38). Testing on S3 exercises
  semantics our users do not have; `CLOUD_QA_BACKEND=s3` reproduces that
  difference on purpose, and the backend reports the `SYNCPATH` it needs
  (`cloud-test-backend syncpath` -> `/<bucket>/GAMES`) so the driver does not
  hard-code either shape.
- **Local on purpose.** These tests exercise credential stripping and backup
  contents - the code paths most likely to leak a token into an archive, a log
  or a work log. A throwaway WebDAV password is worth nothing if it escapes.
- **The remote name is asserted, not assumed.** Every script picks its remote
  with `rclone listremotes | head -1`, so a remote sorting earlier would aim
  the tests at a real account. The driver refuses if the first remote is not
  the test one.
- **Restore is destructive**, so the suite works in `/storage/cloud-qa` unless
  `--real-roms` is passed. Never point it at a device with saves you want.
- An assertion that only holds because nothing happened is worse than no
  assertion: the allowlist check skips rather than passes when the upload
  produced nothing.

The OAuth handshake is not covered - `rclone authorize`, port 53682, token
refresh still need a real provider. The wizard's *gates* (`--connected`,
`--check`, `--free-auth-port`) are plain checks and do test here.

## rocknix.org docs & gaps

The user guide (<https://rocknix.org/configure/cloud-sync/>) documents the `cloud_sync.conf`
options and the Tools backup/restore flow. Known gaps vs. the code: it omits `LOG_LEVEL`,
the single-remote assumption, and `cloud_sync_cleanup_duplicates.sh`. `RSYNCRMDIR` is now
implemented as documented (2026-07-23). Reconcile docs against actual behavior before
relying on them.

## Style

- SPDX `GPL-2.0` header + ROCKNIX copyright on every script.
- Log via the `log_message` / `log_to_file` helpers (format
  `[timestamp] [LEVEL] [script] msg`, levels `INFO`/`WARN`/`ERROR`) to
  `/var/log/cloud_sync.log`; pass `"false"` to suppress on-screen echo for debug lines.
- Controller input goes through `read_controller_input` (`evtest`); respect the mappings
  sourced from `/storage/.config/profile.d/098-controller`.
