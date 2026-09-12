---
description: "Conventions for the rclone cloud-sync subsystem (save/savestate/screenshot/settings backup sync)."
paths:
  - "projects/ROCKNIX/packages/network/rclone/**"
---

# rclone cloud-sync conventions

This package ships ROCKNIX's cloud backup/restore for saves, savestates, screenshots,
and settings backups. User-facing docs:
<https://rocknix.org/configure/cloud-sync/#cloud-sync-with-rclone>.

## What gets synced (scope)

`cloud_sync-rules.txt` is an rclone `--filter-from` **allowlist**, with patterns relative to
`SAVESPATH` (default `/storage/roms`). Only these are synced:
- the `savefiles/`, `savestates/`, `screenshots/` directories;
- save-file extensions anywhere: `*.srm`, `*.sav`, `*.fs`, `*.state*`, `*.auto`, `*.dsv*`;
- a few system save dirs (`n64/save/*`, `psx/memcards/*`, `dc/shared/savefiles/`, `psp/PPSSPP/`);
- `backup/*.zip` (the settings-backup archive).

Everything else is **excluded**: `roms/`, **`bios/`**, `downloads/`, `images/`, `manuals/`,
`videos/`, `themes/`, disc/ROM types (`*.iso *.chd *.bin *.img *.rom *.7z *.zip ...`),
`*.xml` (gamelists), then a final `- /**` that drops anything not explicitly included. So
ROMs, BIOS, and artwork are **never** uploaded — only saves, savestates, and screenshots.

**Scope guardrail (intent):** every cloud-sync change must serve syncing *only* that set
(saves/savestates/screenshots + the settings-backup zip) across devices, and must **never** risk
non-synced local data. Stay within the allowlist; preserve the excludes in any `sync`/bisync
direction (never delete ROMs/BIOS/art); keep a directory chooser limited to save dirs; and keep
the settings-backup zip partitioned from the saves flow.

**User intent (design north star):** the two flows to serve are (1) *new/reset device* —
restore saves/savestates/screenshots from the cloud onto a fresh handheld, and (2)
*multi-device* — the cloud as the hub for moving between handhelds, which is why conflict
resolution (below) is the long-term goal. ROM/BIOS distribution is **not** part of the
gamesave sync flows; if it ever belongs anywhere, it's the settings backup/restore domain.

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
    (game saves, then the settings-backup `.zip`). Keep these two scripts **structurally in
    sync** — most fixes belong in both.
  - `cloud_sync_helper` — merges `*.defaults` into the user's config on OS update.
  - `cloud_sync_cleanup_duplicates.sh` — removes duplicate `VAR=` lines from the conf.
  - `cloud_capture` (#21) — the save-manifest producer. Records what a game
    session wrote into `/storage/.cache/cloud_sync/manifest-<id>.json`, sealing
    an independent copy of every version under `…/stage/<sha256>`
    (D-CLOUD-058). Called by EmulationStation at every game exit
    (`FileData::launchGame`), by the save-state manager (`--retire` before a
    delete, `--rescan` after the renumber), and by the boot autostart
    (`--full`, backgrounded, only when a cloud-saves toggle is on —
    D-CLOUD-064). Two rules unique to it, both by requirement: it **never
    takes the flock** on `/var/run/cloud_sync.lock` — it has to record while
    another cloud_* process holds it, and two writers are resolved by an
    optimistic inode/mtime check: the loser discards its document and (exit,
    `--rescan`, `--retire`) re-runs once against the winner's, `--full` never
    retries — and it
    **never sources `/etc/profile`** (it needs nothing there, and the `PATH`
    rewrite would discard the harness prefix). No rclone, no network, no
    `cloud_sync_helper`, no write anywhere under `SAVESPATH`. `jq` for every
    JSON read and write; the schema is `docs/save-manifest-schema.md`.
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
  between them.** Phase 1 runs from `SAVESPATH` (`/storage/roms`); phase 2 runs
  from `SETTINGS_BACKUPS` (`/storage/roms/backup`) to `SETTINGS_REMOTE`, and on
  restore from `SETTINGS_REMOTE` back. `cloud_sync-rules.txt` is anchored to
  `SAVESPATH`, so in phase 2 every one of its rules describes a path that does
  not exist -- and its `- /**/*.zip` matches the archive itself. **Never pass
  `--filter-from` in the settings-backup phase.** The archive lives at the *root*
  of `SETTINGS_REMOTE`, not under a `backup/` directory: match it with
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

- **`SETTINGS_REMOTE` must be a sibling of `SAVES_REMOTE`, never inside it.** Phase 1
  syncs `SAVES_REMOTE` with `--delete-excluded` and the archive is an excluded file,
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

## The saves folder can change cards

Two-card devices (RG SP) bind the second card over `/storage/roms`. The
automount that does it is started by udev when the card is detected, and its
first act is to unmount `/storage/roms`; the bind comes a second later, and
the interface (with its boot restore) starts in that same second. So the
saves tree a sync reads is not always the same filesystem, with both cards
in — that is how the RG SP grew a second tree (#83). `cloud_saves_root`
(D-CLOUD-054/055) records the filesystem UUID under `SAVESPATH` in
`/storage/.cache` after a saves phase; `cloud_backup`/`cloud_restore` run
`check --wait 15` first (a mismatch is re-read for 15 s before it refuses)
and `record <identity-from-check>` afterwards (a card that changed under the
run fails the phase and records nothing). `cloud_setup --accept-saves-root`
is the owner's override. Any new saves writer goes through the same two
calls.

To test a flip on the VM, bind a tmpfs *copy* of the tree over
`/storage/roms` (`mount -t tmpfs`, `cp -a`, `mount --bind`): the identity
changes (`dev:` instead of `uuid:`) while rclone keeps finding its files, as
on a real two-card device. An empty tmpfs makes rclone fail instead and
proves nothing about the post-check. To make the bind land *during* the
copy, throttle rclone with `RCLONE_BWLIMIT=200k` in the environment — MinIO
on the host moves 1200 files in 1.5 s otherwise, and `RCLONEOPTS` in the
conf is a multi-line value a one-line `sed` will not edit.

Two things learned wiring it:

- **The scripts source `/etc/profile`, which rewrites `PATH`.** A helper
  looked up by name inside `cloud_setup` was not found even with its
  directory on the caller's `PATH`. Resolve a sibling helper beside the
  script — `"$(dirname "$(readlink -f "$0")")/<helper>"`, then `/usr/bin` —
  never through `PATH`. This is also what lets a VM run the scripts from
  `/tmp/qa-bin` (the harness's PATH prefix) and still find the helper.
- **`--saves-only` still prints `Settings backup file transfer: SUCCESS`.**
  The report line is unconditional; the phase was skipped. Read the saves
  line for the saves outcome.

## The game-exit sync: `--saves-only --recent`

ES runs `cloud_backup --yes --saves-only --recent` when a game exits
(`FileData::launchGame`). Three things make it different from the full pass
the boot sync and the menu rows run, and each was paid for on 2026-09-05 by an
18-second sync that moved nothing:

- **`--recent` is a time window, not a game name.** rclone gets
  `--max-age <now - last successful backup + 600 s> --no-traverse`, so it walks
  the local tree, considers only files newer than the last backup that worked,
  and never lists the remote when nothing qualifies. The stamp is
  `/storage/.cache/cloud_sync/last-backup`; no stamp, or a failed one, means a
  full pass. Time rather than the ROM's name because standalone emulators keep
  saves under their own layouts (PPSSPP by game ID, Dreamcast in a shared VMU
  folder) and a name filter would miss every one of them. `--recent` always
  copies -- a filtered sync would weigh deleting what the filter hid -- and it
  skips the reachability `mkdir` and the `rmdirs` tidy, which are full-pass
  jobs and a remote round trip each.
- **Exit 75 and exit 69 are skips, not failures.** 75 (`EX_TEMPFAIL`,
  `EXIT_LOCK_HELD`): another sync holds `/var/run/cloud_sync.lock`. 69
  (`EX_UNAVAILABLE`, `EXIT_NO_NETWORK`): no default route (`ip route`, no
  packets sent), answered in a tenth of a second instead of rclone's 10 s
  connect and 20 s overall timeouts. Neither writes a last-run stamp. The
  card shows both as SKIPPED. They were 3 and 4 until 2026-09-09 -- which
  are also rclone's "directory not found" and "file not found", so a failed
  phase carrying rclone's code up read as a phantom sync (#99, blindspot
  33). A sentinel must be a code the wrapped tool cannot return; a phase
  failure now passes rclone's code through unremapped, and every reader
  (`GuiCloudTransfer`, `ThreadedCloudSync`, the harness) names 75 and 69.
- **Under `--yes`, the console pauses are gone.** `pause N` is a no-op when
  nobody is reading; three of them were seven seconds of every headless run.
- **Capture runs first, and it is not part of the sync.** Before the toggle
  is read, `launchGame` runs `/usr/bin/cloud_capture --system … --rom …
  --emulator … --core … --started <tstart> --exit <code>` synchronously
  through `executeScriptLegacy` — not `runSystemCommand`, which always
  returns 0 — and logs a nonzero at `LogWarning`, nothing more. It never
  blocks on the lock and never opens a socket, so a toggle-off, offline or
  lock-held exit is still recorded, and the working copy the push carries is
  current by the time the sync starts. Its stamps sit beside `last-backup`:
  `/storage/.cache/cloud_sync/last-capture` (`<epoch> <rc> <mode>[!card]
  <unit|-> emu-exit=<N|?> <emulator>/<core>`, written on every run, including
  a nothing-changed one, **one line per mode** — `exit`, `rescan`, `full`,
  `retire`, `usage` — each replaced only by a run of the same mode, so the
  boot `--full` pass no longer overwrites the last exit's record (D-CLOUD-070,
  #94); a reader picks its line by the third field with `!card` stripped, and
  a one-line stamp from an older build is that mode's line —
  `tools/cloud-capture-stamp-test` checks the update without a device; the unit
  may contain spaces, the two trailing fields
  never do, and outside exit mode they read `emu-exit=? -/-`; `emu-exit` is
  the launch's exit as EmulationStation saw it -- `runemu.sh`'s 0/1, with the
  exit hotkey's kill reported as 0 (D-LAUNCH-001) -- not the emulator's own
  code) and
  `capture-failures` (one line per degraded run, last 20 kept). They exist
  because `/var/log` is tmpfs unless `debugging` is on (D-CLOUD-027): the log
  line is gone at the next reboot, the stamp is not.

Budget on an H700, measured: **starting rclone costs about a second** by
itself (`rclone version`: 1.0 s), a remote round trip one to two more. That is
why the recent path spawns rclone once, reads the remote's name from
`rclone.conf` instead of `rclone listremotes`, and probes nothing. Nothing
changed: 18 s → 5 s. One save written: about 7 s, most of it Dropbox's commit.
`tools/cloud-round-trip` asserts the window, the untouched remote, the
single-file push, and the exit-4 timing.

## The automatic sync is bounded; the deliberate one is not (D-CLOUD-118)

EmulationStation runs the startup sync and the sync after a game with
`--automatic`. Under it every rclone the script makes carries
`RCLONE_SYNC_NET_OPTS` (`--contimeout 5s --timeout 5s --retries 1
--max-duration 20s`) after the caller's own flags, and runs under busybox
`timeout` against a deadline `SYNC_CEILING_SECONDS` (20) from the script's
start -- because `--max-duration` bounds transfers and nothing else, and a
stalled listing retried ten times is what held the exit card for 321 s on
the VM (#135). A run the ceiling ends returns 124 (timeout) or 10 (rclone),
and `why_for` says THE CLOUD TOOK TOO LONG - IT'LL TRY AGAIN NEXT TIME. The
back up and restore a player presses keep `RCLONE_NET_OPTS`.

Both keys live in `cloud_sync.conf` and its defaults with a fallback
constant in each script; `tools/last-good-scripts-test` case h holds the
three equal and proves the wrapper fires. The numbers are a starting point
the maintainer accepted to tweak on feedback (2026-09-12).

Two retry counts, on purpose. A transfer keeps `--low-level-retries 10`:
Dropbox answers a concurrent write with a lock error a retry clears (#107).
A listing (`lsd`, `lsf`) carries `RCLONE_LIST_OPTS` with three, because
rclone's S3 backend hands the count to the AWS SDK as its attempts with
exponential backoff and `--contimeout` never enters it: a refused endpoint
costs 0.03 s at one attempt, 2 s at two, 6 s at three, 230 s at ten (rclone
1.75, #143). Never give a listing the transfer's count.

On a bucket-based cloud (`rclone backend features` says `BucketBased`), a
folder with no objects does not exist and listing an absent one succeeds
with nothing -- rclone's documented shape. `cloud_restore` reads an empty
saves folder there as absent and raises the empty-cloud offer (#141).

## Progress output: what actually comes out of a pipe

Every transfer here is read by a program, not a terminal — the ES status page
runs the script through `popen`. rclone behaves differently there, in ways
only observation settles. Measured against rclone **1.75.0 on an H700**:

- **`--progress` still works through a pipe**, and still works alongside
  `--log-file` (logs go to the file, the progress block goes to stdout).
  Without `--progress` the stats go *only* to the log and the caller sees
  nothing — which is why a content restore sat at `0 B / 0 B, -, 0 B/s`
  while it was in fact copying Mega Drive ROMs.
- **`--stats-one-line` throws away the per-file block.** That block is the
  liveness signal: a thousand small BIOS files spend minutes between
  percentage changes, and the name of the file being moved is the only thing
  separating working from hung. Use `--stats 1s`.
- **Each redraw's last ` * file` line has no trailing newline.** The next
  block's `Transferred:` is glued straight onto it:

  ```
   * f4.bin: 26% / 3.8 MiB, 507 KiB/sTransferred:   	 6.1 MiB / 22.8 MiB, 27%...
  ```

  A reader splitting on `\n` alone loses both halves of that join — every
  block after the first. Split on `\n`, `\r`, **and** an embedded
  `Transferred:`.
- **`Transferred:` appears twice per block**: bytes first, then a file count
  (`0 / 6, 0%`). The byte line is the one with a unit in it.
- **`--progress-terminal-width` does not exist in 1.75.0.** An unknown flag is
  a usage error that transfers nothing, so `cloud_backup`/`cloud_restore` gate
  it behind `rclone help | grep -q progress-terminal-width`. Adding it
  unguarded to the content scripts would have broken every content transfer;
  the dry run caught it, the documentation did not.

Capture the bytes before writing a parser — `rclone copy ... --bwlimit 2M 2>&1
| od -c` on the device — and run the parser over that capture. The format
above was wrong in three of four guesses made from the documentation.

## Testing it without a cloud account

`tools/cloud-test-backend` serves a directory on the host over WebDAV;
`tools/cloud-round-trip` drives a device through save backup/restore, the
settings-backup archive, and content sync against it
over SSH. A VM from `generic-x64-vm` reaches the host at `10.0.2.2`, so nothing
needs forwarding.

```bash
./tools/cloud-test-backend up                    # WebDAV on :9010
./tools/cloud-round-trip --host root@127.0.0.1 --port 10022 --identity <key>
./tools/cloud-test-backend ls                    # what the device uploaded
./tools/cloud-test-backend down

./tools/cloud-test-backend --backend s3 up       # or s3, sftp, smb, ftp (#133)
./tools/cloud-round-trip --host ... --backend s3
```

### Five backends, and what each one alone can tell you

One protocol's answers to *does this file exist*, *what does it hash to* and
*what survives a cut PUT* are not the answers. `--backend` picks among five,
all on this host, all reachable from a guest at `10.0.2.2`, none needing an
account (`generic-x64-vm-testing.md` has the ports and the data paths):

| `--backend` | Stands for | Hashes | Modtimes | Cut PUT |
| --- | --- | --- | --- | --- |
| `webdav` | Dropbox/Drive/OneDrive, the path-based tier | no | **no** | short file |
| `s3` | S3, B2, the bucket tier (#38, #123) | MD5 | yes | **commits or nothing** |
| `sftp` | a NAS or a seedbox; the hash-less remote | no | yes | short file |
| `smb` | the WINDOWS SHARE tier | no | yes | short file |
| `ftp` | the FTP rows, implicit and explicit | no | yes | short file |

**Run a change against more than WebDAV whenever it touches existence
checks, directory creation, layout, comparison or an exit code.** The first
matrix run (2026-09-12, image `d94ca7b159`) found three shipped defects that
WebDAV cannot show, on 33 steps that were green on WebDAV throughout:

- **#141 — on a bucket remote a wrong saves folder reports COMPLETED.** An
  empty folder does not exist on S3, so *not created yet* and *exists and is
  empty* are one observation, and `cloud_restore` resolves it the wrong way:
  a `SAVES_REMOTE` whose root does not exist at all exits **0** with
  `Game saves: COMPLETED`, where every path-based backend exits 1 and offers
  nothing. A typo in the folder name restores nothing and says it worked.
- **#142 — on FTP a missing directory is exit 1, not 3.** rclone surfaces the
  server's `501 "No such directory."` as a general error, so every
  *is it there yet?* branch reads *not created yet* as *your cloud couldn't
  be read*. And with `--retries 1` a copy into a directory that does not
  exist yet loses files: rclone's FTP backend fails its first pass on the
  destination root and only recovers on a retry we do not allow (2 of 3
  files landed).
- **#143 — a refused S3 endpoint is not bounded by our timeouts.** The AWS
  SDK's retryer backs off underneath `--contimeout 15s --timeout 30s
  --retries 1`; one `rclone lsf` against a closed port ran past 2m23s and the
  whole suite took 578 s against 128-156 s on the other four.

Two more traps that only the bucket path shows, found earlier the same way:

- **`rclone lsjson --stat` is not an existence test on a bucket remote.** It
  synthesises a directory entry for *any* path — `utterly-bogus-never-created`
  returns `IsDir: true` on 1.60, 1.74 and 1.75 — how bucket remotes work, not
  a bug awaiting a fix. Use a **listing**: does the path contain anything, or
  does its parent list it?
- **`rclone mkdir` exits 0 while creating nothing.** Empty directories do not
  exist on S3; rclone even says so and still returns success. The standard fix
  is a zero-byte object whose key ends in `/`, which rclone writes with
  **`--s3-directory-markers`** (default off). B2 has no equivalent flag.

### Runbook

```bash
./tools/cloud-test-backend up                       # WebDAV on :9010
./tools/cloud-round-trip --host root@127.0.0.1 --port 10022 --identity <key>
./tools/cloud-test-backend ls                       # what the device actually uploaded
./tools/cloud-test-backend down                     # ALWAYS -- see below
```

Four things that cost time on 2026-09-03:

- **`down` matters.** WebDAV, SFTP and FTP run as host processes and survive
  the session that started them; S3 and SMB are containers. A stale one
  holding the port makes the next `up` fail with `address already in use`.
  Since #133 each backend has a port of its own (9010/9012/9013/9014/9015) so
  several can be up at once and `down` takes down only the one named by
  `--backend`; `CLOUD_QA_PORT` still moves one if you need two of the same
  kind.
- **The host's rclone is not the device's.** This host had **1.60.1-DEV**; the
  device ships **1.74.4**. Backend options differ across that gap —
  `--s3-directory-markers` does not exist in 1.60. Test rclone behaviour by
  running rclone *on the device* against the QA endpoint, not on the host.
- **A real device can reach the host's MinIO too**, not just a VM: bind the
  backend and point the device's rclone config at the host's LAN address. Faster
  than booting a VM when the question is purely about rclone semantics.
- The device reaches a VM-host at `10.0.2.2`; a LAN device needs the real IP.

### Bucket remotes behave differently, and it is not a detail

The two traps above (`lsjson --stat`, `mkdir`) are the bucket tier's, and
both were found by running the S3 path. Three call sites branched on the
first, so on S3 the migration always refused ("destination already exists"),
the content-restore legacy fallback was dead, and the seeding report could
only ever say OK.

The consequence for design: a folder we want a player to *see* needs either a
marker or a file in it. Our seeded folders get both — the marker so the folder
persists, and a `README.txt` because a folder that says what belongs in it is
worth more than an empty one.

Getting a VM to an SSH target the driver can use: boot it, then over the
serial console (`-serial unix:`) enable sshd and drop in a key —
`systemctl start sshd`, then write your public key to
`/storage/.ssh/authorized_keys` (mode 600, directory 700). SSH is off on a
fresh image, and the console gives a root shell without login.

- **WebDAV is the default, and the harshest.** With `vendor=other` it carries
  neither hashes nor modtimes, so rclone compares by size alone — the shape of
  #53 — and a bug only WebDAV can catch is one WebDAV must keep catching.
- **Bucket and share remotes need a different `SAVES_REMOTE`.** Dropbox/Drive/OneDrive are path-based, so
  `SAVES_REMOTE="/GAMES"` is a folder. On S3 and B2 the first path component is the
  *bucket*. rclone creates buckets on demand, so a missing one is not the
  problem - the problem is that `GAMES` is not a **legal** bucket name
  (lowercase only, 3-63 chars), so it is rejected with `InvalidBucketName`
  before anything can be created (issue #38). SMB has the same shape with the
  *share* in place of the bucket, and SFTP a third — every path absolute,
  because an sshd running as an ordinary user cannot chroot. The backend
  states what it needs (`cloud-test-backend saves-remote`, and
  `endpoint-prefix` for what to strip) so no caller hard-codes a shape.
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
refresh still need a real provider, and so does the hosted half of #133
(Google Drive, Box, pCloud, Mega), which needs QA accounts somebody has to
create. Everything else the matrix covers runs here, so "we would need a real
provider" is not an answer to *can this be done on the VM?* (`vm-first.md`). The wizard's *gates* (`--connected`,
`--check`, `--free-auth-port`) are plain checks and do test here.

## rocknix.org docs & gaps

The user guide (<https://rocknix.org/configure/cloud-sync/>) documents the `cloud_sync.conf`
options and the Tools backup/restore flow. Known gaps vs. the code: it omits `LOG_LEVEL`,
the single-remote assumption, and `cloud_sync_cleanup_duplicates.sh`. `RSYNCRMDIR` is now
implemented as documented (2026-07-23). Reconcile docs against actual behavior before
relying on them. `cloud_capture` (#21) has no player-visible surface — no menu row, no
setting, no flag anyone types — so `documentation-accuracy.md`'s hard gate is not
triggered by it; say that explicitly in the PR rather than leaving it to be asked.

## Style

- SPDX `GPL-2.0` header + ROCKNIX copyright on every script.
- Log via the `log_message` / `log_to_file` helpers (format
  `[timestamp] [LEVEL] [script] msg`, levels `INFO`/`WARN`/`ERROR`) to
  `/var/log/cloud_sync.log`; pass `"false"` to suppress on-screen echo for debug lines.
- Controller input goes through `read_controller_input` (`evtest`); respect the mappings
  sourced from `/storage/.config/profile.d/098-controller`.

## The content tier's flags, and what the scripts may not call

`cloud_content_backup --selected` and `cloud_content_restore --selected` move
the systems chosen with `--set-systems`, in one of three modes (`MEDIA_MODE`
in each script, D-CLOUD-050): with neither flag, ROMs and BIOS alone — the
scraper's folders under a system (`MEDIA_DIRS`) and `gamelist.xml` are
excluded from the transfer and from every count (D-CLOUD-048, D-CLOUD-049);
`--with-media` carries both tiers; `--media-only` carries the scraper's
folders and the game list and nothing else, BIOS included in "nothing". The
interface derives the mode from the ROMS AND BIOS and GAME CONTENT ticks.
`cloud_content_restore --scan` is what both systems pages read:
`name|cloud_bytes|supported|device_bytes|files_in_cloud_not_here|files_here_not_in_cloud`,
one line per system in the union of cloud and device, both sides listed under
the transfer's own rule. Anything that changes what a transfer carries has to
change `content_files` (device), `cloud_content_filter` (cloud) and the
`rclone copy` excludes together, or the page will describe a transfer the
script does not perform.

**The image's busybox has no `comm`.** `comm … | wc -l` reads 0 there, which
in a difference count means "identical" — it shipped that way for one VM run
(2026-09-06). Use `not_in` (awk) in `cloud_content_restore`, and before
reaching for any coreutils name in these scripts, run it on the VM: `mapfile`,
`stat -c`, `find -path`, `mktemp -d` and `sort -u` are there; `comm`,
`pgrep -c`, `find -printf` and `ls --time-style` are not.

## A saves label runs `--saves-only`

`cloud_backup --yes` and `cloud_restore --yes` run **two** phases — the saves
sync and the settings-archive upload or download — and emit a `>>> unit`
marker for each. Every command behind a label that says *saves* (the
transfer page's saves tier, BACK UP SAVES TO THE CLOUD, RESTORE SAVES FROM
THE CLOUD, SYNC SAVES WITH THE CLOUD, the boot-time sync, the game-exit
push) passes `--saves-only`; only the settings tier moves settings
(`backuptool backup && cloud_backup --yes --system-only`). Without the flag
a run with SETTINGS unticked still moved the archive, and the transfer page
kept the phase's label — SETTINGS BACKUP — through every ROM that followed,
because `cloud_content_backup` announced no units of its own (fixed the
same day; restore had since D-UI-024). The D-UI-022 rule that the label says
what moves is enforced by the flag, not by the label.


## What the QA backends compare by (measured 2026-09-07, rclone v1.75.0)

A fixture that stages "the cloud's copy is newer" or "the same size" has to
know what the shipped `copy` does on each backend. Measured on the VM pair
in a fourteen-case matrix, not inferred:

- **WebDAV (`rclone serve webdav`)** reports every file's modtime as its
  *upload* time — a local mtime does not survive the trip — and offers no
  hashes. A plain `copy` replaces the destination whenever size **or** mtime
  differ, in either direction; `copy --update` keeps whichever side has the
  later mtime; an equal-size, equal-mtime byte change is skipped outright
  (#53's shape, and A2's). So "the cloud's copy is newer" is staged by
  making the local file *older* (`touch -d` an hour back), never by touching
  the cloud. A PUT killed mid-transfer leaves a partial file at the
  endpoint, hash-equal to nothing.
- **MinIO** keeps modtimes and offers hashes: the equal-size, equal-mtime
  change is transferred, and a killed upload leaves nothing behind. `rclone
  cat` of a missing key exits 0 with no output — a missing key is an empty
  prefix — so `cloud-test-backend cat` checks existence first.
- **bisync**, scored for Gate 11 (#9; verdict D-CLOUD-052 — not used): a
  tree where one change is "all files changed" — a one-file tree — aborts
  as a safety measure; `--files-from` cannot sit beside `--filters-file`, so
  a decided run drops the allowlist; a run killed with `kill -9` leaves
  `<workdir>/*.lck` and every later run refuses until it is removed
  (`--max-lock`, minimum 2 m, expires it); without its listings it demands
  `--resync`, and `--resync` is `--resync-mode path1` — the device's copy
  wins, silently; with `--conflict-resolve none` a both-changed pair is
  renamed `.conflict1`/`.conflict2` on both sides unless the run is stopped
  at the dry run, and recovery after a kill is a wet run that renames a torn
  head the same way; on a hashless backend it downloads a both-changed pair
  to compare ("check --download for safety") and skips it when equal, but
  cannot see a same-size, same-mtime change at all without `--download-hash`,
  which downloads the whole tree every pass. Its raw runs are what
  `cloud-round-trip --dump` writes.
