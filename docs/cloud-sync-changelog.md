# Cloud sync, backup and restore — change summary

Draft for the eventual upstream PR body, the rocknix.org documentation pass,
and a call for testing on devices we do not own.

**This is a claims document.** Every sentence below asserts a behaviour, and a
reader will act on it. Before anything here leaves the repo, each claim is
checked against the code and against a run — the same bar as an acceptance
criterion. The first draft asserted the layout migration was copy-verify-delete
while the script still ran `rclone move` (#57, fixed `b9ea9f3fe8`); audit #41
had already named that failure, and it was repeated here anyway.

**Status:** built and tested on **H700** (Anbernic RG35XX SP) only. Everything
below is verified working there unless a line says otherwise. Other targets
build from the same sources but have not been run — that is the main thing this
document is asking for help with.

**Base:** `upstream/next` as of 2026-09-04. rclone moves **1.71.0 → 1.75.0**
(S3 multipart streaming improvements, and the version our checksums pin).

---

## Setting up a cloud remote, on the device

Previously the only way to configure rclone was to SSH in and run `rclone
config`. That is now a fallback rather than the path.

- **Connect Cloud Storage** is a native EmulationStation flow. Pick a provider
  from a recommended shortlist or the complete list of everything rclone
  supports, and configure it without leaving the couch.
- **Sign in with the provider's own page, on the device.** A single-purpose
  full-screen web view (`cloud-signin-window`) — deliberately not a browser: no
  address bar, no tabs, and it refuses to navigate off the provider's host.
- **Your phone as the keyboard.** Typing an email and password on a d-pad is
  miserable, so the device shows a QR code; scanning it opens a page on your
  phone that acts as a remote keyboard and pointer for the sign-in. The phone
  never sees your cloud account — it is an input device, not where the sign-in
  happens.
- **On-screen keyboard** for anyone without a phone to hand, raised
  automatically when the caret lands in a text field, with L1/R1 to scroll a
  page whose button is below the fold.
- **Managing the remote afterwards** — change the cloud folder, check the
  remote, repair a lapsed sign-in — is all in `GAME SETTINGS > CLOUD SETTINGS`.
  No SSH.
- **Folder seeding.** A newly linked remote gets the folder structure created
  for it, with short READMEs, so it is obvious where to put things from a
  computer.

## Backup and restore on the device

- **On-device backup and restore work again.** They had been broken in ways
  that reported success: archives were written short and announced as fine, and
  restore aborted part-way on any symlink it met.
- **Archives are now `tar.gz`, not `zip`.** zip loses symlinks and permissions,
  and busybox `unzip` aborts a whole restore when it meets one. Restore still
  reads old `.zip` archives, so existing backups keep working.
- **Secrets stay out.** Wi-Fi keys, RetroArch and RetroAchievements
  credentials, and `rclone.conf` are excluded, and the archive is scanned
  afterwards to prove it.
- **Bezels, music and themes** are included — they were in no tier at all.

## Cloud backup and restore

- The whole-device backup can go **to the cloud** and come back, not just to
  local storage.
- After a restore, the device prompts for the handful of things a backup
  deliberately does not carry (Wi-Fi and account passwords).

## Game saves

- **Upload, download and two-way sync**, in `GAME SETTINGS > CLOUD SETTINGS`,
  each showing when it last ran and whether it worked.
- **Sync at startup**, once the network is actually up — it waits for
  connectivity rather than failing at boot.
- **Sync when you exit a game**, reported on screen. It used to run silently in
  the background, which is indistinguishable from not running at all.
- **Two-way sync never deletes.** The newest copy of each save is kept on both
  sides.

- **Sync when exiting a game is quick, and honest about what it did.** It
  pushes only saves changed since the last sync that worked, never lists the
  cloud when nothing changed, and skips the system-settings archive (which has
  its own row). On an RG35XX SP it went from 18 seconds to about 5 when nothing
  changed; a new save adds a couple of seconds for the upload itself. With no
  network it says SKIPPED at once instead of waiting for a timeout, and the
  card shows rclone's comparison as "comparing save files", not as a progress
  bar that looked like every game being uploaded.

## ROMs and BIOS ("content")

New tier, separate from saves, for the bulk static content.

- **Choose which systems this device syncs**, from what your cloud actually
  holds, with sizes — so a handheld that cannot run GameCube does not spend
  card space on it.
- Each system shows whether it is **only in the cloud**, **on this device**, or
  **on this device but a different size**.
- **Download ROMs and BIOS from the cloud** to get a new handheld playable
  without a computer.
- **Match this device to the cloud** — the one action that deletes. It removes
  local ROMs your cloud no longer has, previews exactly what will go before
  asking, and never touches game saves.
- Cloud layout is `ROMs/` and `BIOS/`, written for somebody looking at it in a
  file manager rather than mirroring the handheld's storage.

## Long transfers

- A **full-screen status page** for transfers measured in minutes, showing the
  file being copied, transfer rate, bytes, ETA and elapsed time — and it stays
  up until dismissed, so walking away and coming back still answers "did that
  work?".
- Shorter operations keep the non-blocking progress card, which now reports its
  own outcome rather than handing off to a notification elsewhere on screen.

---

## Fixes worth calling out

Several of these were silent — the operation reported success while doing
nothing.

- **A cloud backup could report success having uploaded nothing**, when the
  remote offered neither modification times nor hashes and rclone compared by
  size alone.
- **Restore filtered on a path that matched nothing**, transferred nothing,
  exited 0 and printed SUCCESS. It shipped that way in four images.
- **A mirror-mode backup deleted another handheld's saves.** One cloud folder
  shared by several devices meant the last one to run won. The default is now
  copy, which never deletes, and a deliberately chosen mirror moves replaced
  files aside into a dated folder instead of destroying them.
- **Content sync was carrying save files.** RetroArch writes `.srm` and
  `.state` next to the ROM, so a "ROMs only" upload was duplicating save data
  into a second cloud location under different rules.
- **A multi-tier transfer reported success when an earlier stage failed** — a
  shell sequence returns its last command's status.
- **`gamelist.xml` was being deleted** by the matching action, taking play
  counts, favourites and scraped-art references with it.
- **Sync-conflict artifacts** (Dropbox's "conflicted copy", Syncthing's
  `.sync-conflict-`) are no longer moved in either direction. Carrying them
  made them immortal: a device that downloaded one uploaded it again, so
  deleting them in the cloud looked like the provider putting them back.
- Empty or unreachable cloud folders now **refuse to act** rather than treating
  "nothing there" as "delete everything".
- **Only one cloud transfer runs at a time**, whoever started it. The
  boot-time sync, the sync after a game exits, and a person in the menu can
  all start one; they now share a lock, and a second request reports
  SKIPPED rather than putting two rclone writers on the same folder.

---

## ScreenScraper on developer builds

Developer builds have never carried ScreenScraper, because the developer pair
the API requires is compiled into the binary and belongs to the project that
built it. Now the scraper is built without one, and **DEVELOPER ID** and **DEVELOPER
PASSWORD** rows sit beside USERNAME and PASSWORD under the scraper's OPTIONS.
Anyone with their own ScreenScraper developer access enters the same pair in
both places and scrapes as usual; starting a scrape with them empty says what
is missing. The developer password is held back from settings backups, like the
account password. Nothing secret is in the image, so the image can be shared.
Upstream builds are unaffected: with a compiled-in pair the rows never appear.

For anyone without developer access of their own, ScreenScraper publishes a
shared developer account for this distribution on its forum (sujet 7455), on
the condition that misuse closes it for everyone — which is the reason it is
typed on the device rather than compiled into an image anyone can download.
Entered under OPTIONS it scrapes as any developer pair does (2026-09-05, H700).

## The scraper page

Two fixes to the SCRAPER menu itself. Both are in the 2026-09-05 image; the
maintainer rebooted into it, reports the page working well, and is running a
full ScreenScraper re-scrape on it. The itemised press-through on
[#65](https://github.com/maxengel/rocknix/issues/65) and
[#67](https://github.com/maxengel/rocknix/issues/67) is still to be ticked.

- **Left/right belong to the rows again.** On a tabbed page the strip used to
  take every left/right press unless the button bar was focused, so an option
  row on SCRAPER → OPTIONS could not cycle in place — the only way to change a
  value was A and the popup. The tab strip is now a focus stop of its own: up
  from the first row lands on it, left/right there switch tabs, down returns to
  the rows, and the wrap runs strip → rows → buttons → strip. A page opens on
  its first row, and the help bar reads SWITCH TAB while the strip is lit.
- **The SCRAPE tab remembers its filters.** GAMES TO SCRAPE FOR, IGNORE
  RECENTLY SCRAPED GAMES and SYSTEMS INCLUDED were rebuilt with hard-coded
  defaults every time the page opened *and every time the tab changed*, so a
  choice made before stepping to OPTIONS was gone on the way back. They now
  survive both. Opening the scraper from a game list still pre-selects that one
  system, and that pre-selection is not what gets remembered. Defaults are
  unchanged, so a fresh install and an upgraded device behave alike.

## Not in this change

- **Save conflict resolution.** There is no conflict manager yet
  ([#11](https://github.com/maxengel/rocknix/issues/11) is open). Two-way sync
  keeps the newest copy of each save on both sides and never deletes, which
  avoids conflicts rather than resolving them. If two devices edit the same
  save while offline, the older one is superseded, not merged.
- `playcount` / `lastplayed` / `gametime` in a shared `gamelist.xml` are
  last-writer-wins across devices.
- **A ScreenScraper login failure still shows the API's raw French text**, and
  that text blames the account even when the developer pair is what was
  rejected ([#66](https://github.com/maxengel/rocknix/issues/66) is open).

## Upgrading from an earlier cloud setup

Every one of these ships onto devices that already have state, so the guiding
rule was that an upgrade should be invisible: read both shapes, write the new
one, and ask only where the choice is genuinely the owner's.

**Tidy up your cloud folders** — the one screen that does ask. The first layout
put everything under `/GAMES`, with system backups nested at `/GAMES/backup`
— *inside* the folder a mirror-mode backup deletes from, so the archive was
deletable by the operation meant to protect it. The default has been
`/ROCKNIX/Saves` and `/ROCKNIX/Backups` for a while, but config files are only
ever added to, never rewritten, so devices set up before that stayed on the old
layout indefinitely.

The row appears in `GAME SETTINGS > CLOUD SETTINGS` **only when there is
actually something to move**, lists exactly what it would relocate, and moves
by copy-verify-delete rather than `rclone move` — an interrupted move would
leave the library split across two locations with no record of which files went
where. It never touches paths the device cannot account for, so somebody's own
files sharing the folder are left alone. Declining is a first-class answer:
where a player's saves live is theirs to decide.

Everything else is handled without asking:

- **Backup archives.** New ones are `tar.gz`; old `.zip` archives still
  restore, and the newest of either format is what a restore picks.
- **Config keys.** New options are merged into an existing `cloud_sync.conf`,
  preserving values you customised.
- **One destructive default is rewritten.** `BACKUPMETHOD=sync` mirrors, and
  with one cloud folder shared between handhelds that means the last device to
  run deletes the others' saves — which happened. It is set to `copy` once, on
  update, keeping your previous file as `cloud_sync.conf.pre-copy-default`.
  Setting it back to `sync` deliberately is respected.
- **Older cloud content layouts are still readable.** Content restore
  understands the current `ROMs/` + `BIOS/` shape, the flat layout that
  preceded it, and the pre-`CONTENTPATH` root — so a library that has not been
  re-uploaded still downloads. Backup only ever writes the current shape, so
  libraries migrate themselves as they are used.
- **After a whole-device restore**, the device offers `FINISH RESTORE SETUP` to
  re-enter the passwords a backup deliberately does not carry. It reappears at
  next startup if dismissed.

Nothing needs reconfiguring. A device that already had a remote keeps it.

---

## Testing wanted, especially on hardware we do not have

Built and exercised on **H700 / RG35XX SP**. Untested elsewhere: **RK3566,
RK3326, RK3399, S922X, RK3588, SM8250/8550/8650/8750, AMD64**.

The parts most likely to differ per device:

1. **The sign-in window** needs a working WebKit and GPU path. If the provider
   page renders blank or the device hangs on `CONNECT CLOUD STORAGE`, that is
   the interesting failure — please capture `/var/log/cloud_sync.log`.
2. **The exit combination** is read from the pad's real capabilities
   (Mode+Start where a Mode button exists, Select+Start otherwise). On an
   unusual controller layout it may name a button you do not have.
3. **The on-screen keyboard and pointer** in the sign-in window, on panels
   between 640×480 and 1920×1080.
4. **`tar.gz` backup and restore** on a device with a populated `/storage` —
   restore onto a live tree, not an empty one, since that is where the symlink
   bug hid.
5. **Exit a game while the boot-time sync is still running** (turn on both
   SYNC SAVES toggles, reboot, launch and quit a game within a minute). The
   card should say SKIPPED, and `/var/log/cloud_sync.log` should show one
   sync, not two interleaved.
6. **Providers other than Dropbox.** Dropbox is what this was developed
   against. S3-style bucket remotes behave differently in ways already found
   once (see below) and deserve a look.

Useful when reporting:

- `/var/log/cloud_sync.log`
- `rocknix-info` (build ID and branch)
- Which provider, and whether it is bucket-based (S3/B2/MinIO) or path-based
  (Dropbox/Drive/OneDrive/WebDAV)

A known difference already handled: on bucket remotes `rclone lsjson --stat`
reports *any* path as an existing directory, so existence checks there had to
be rewritten to list rather than stat.
