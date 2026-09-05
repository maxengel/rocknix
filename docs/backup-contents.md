# What the system backup contains

Reference for `backuptool` (ES: **BACKUP CONFIGURATIONS** / **RESTORE FROM BACKUP**,
and the cloud **BACK UP / RESTORE EVERYTHING** actions). Source of truth for the
user-facing docs on rocknix.org (fork issues #18 P4, #32).

The archive is `/storage/roms/backup/ROCKNIX_BACKUP.zip`. It matches the cloud
allowlist (`backup/*.zip`), so **it can be uploaded to a cloud provider** — every
rule below exists because of that.

## Hard rule: no secrets, ever

A backup must be safe to store in someone else's cloud. Credentials are the one
class of data that is deliberately **not** restorable; the device walks the user
through re-entering them after a restore (fork issue #31).

Stripped from the archived copy (the live config on the device is untouched):

| Source | Removed |
|---|---|
| `system.cfg` | every `*.key`, `*.password`, `*.token` line — Wi-Fi key, root password, RetroAchievements password/token and web API key (`global.retroachievements.key`, #68), netplay password |
| `es_settings.cfg` | `ScreenScraperPass` |
| `retroarch.cfg` | `*_password`, `*_token`, `*_stream_key` values blanked (cheevos password/token, netplay + spectate, kiosk, settings, streaming keys) |

Deliberately **kept**: `cheevos_username` and other usernames — not secrets, and
the post-restore re-entry page uses them to know which accounts to offer.

Never captured at all: Bluetooth link keys (`/storage/.cache/bluetooth`) are
adapter-MAC-bound and useless on another device; Syncthing's `key.pem`/`cert.pem`
device identity is outside the backup set (a restored clone must get its own).

A backup-time self-check greps the finished zip for populated credential-shaped
lines and warns if any survived, so a newly-added config file carrying secrets is
caught the first time rather than leaking silently.

## Included

- `/storage/.config/system/configs/system.cfg` (sanitized) — system settings
- `/storage/.config/emulationstation/` — `es_settings.cfg` (sanitized), input
  configuration, collections
- `/storage/.config/retroarch/*` (sanitized `retroarch.cfg`) — RetroArch config,
  per-core overrides, remaps
- `/storage/.config/ppsspp/*`, `/storage/.config/moonlight/*`,
  `/storage/.config/game/*` — emulator configuration
- `/storage/.config/fancontrol.conf`, `/storage/.config/backuptool.conf`

**Regular files only.** Symlinks are excluded: the config tree links into
OS-shipped content (ppsspp assets, hypseus fonts/pics/sound), and following them
both bloated the archive and made restore abort partway when it could not
overwrite a live symlink with a regular file. Symlinks are the OS's to provide.

Also excluded by design: `es_systems.cfg` / `es_features.cfg`, which are
OS-managed symlinks — restoring stale copies would freeze the systems list at
backup-time and break OS-update management of it.

## Not included (they belong to other flows)

| Data | Flow |
|---|---|
| Game saves, savestates, screenshots | cloud saves sync (`cloud_backup` / `cloud_restore`) |
| ROMs and BIOS | content sync (`cloud_content_backup` / `cloud_content_restore`) |
| Credentials | re-entered after restore (#31) |

These three classes are exactly how the Cloud Tools menu describes each action.

## Housekeeping

Each backup rotates the previous archive into `backup/archive/` (newest 3 kept).
That folder does **not** match the cloud allowlist, so archives stay local and
cannot bloat the remote.

## Restore behavior

Restore verifies the archive (`unzip -t`) before touching anything, reports
failures without rebooting, and on success reboots so the restored configuration
takes effect cleanly (a running EmulationStation would otherwise rewrite
`es_settings.cfg` over the restored copy). It then leaves
`/storage/.config/.restore-finish-pending`, which EmulationStation consumes on the
next boot to offer the credential re-entry flow.
