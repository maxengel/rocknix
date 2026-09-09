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
  `.state` next to the ROM, so a "ROMs only" upload was duplicating saves
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

## One vocabulary (2026-09-06)

Four kinds of thing move through cloud sync, and this change gives each one
name and uses it everywhere: the menus, the dialogs, the progress lines, the
config file, the scripts' log lines, and the archive's filename.

- **Settings** — the archive `backuptool` writes. It holds emulator and
  interface configuration, input mapping, themes, collections, and bezels, and
  **nothing else**: no saves, no ROMs, no operating system. It used to be
  called the *system backup*, which had people expecting their games to be in
  it. This change named the archive `<date>-ROCKNIX_SETTINGS.tar.gz`; since
  2026-09-08 the device's name sits between the date and ROCKNIX (see *The
  archive says which handheld made it*). Every reader still accepts the three
  earlier names.
- **Saves** — game saves, save states, and screenshots. Previously *save data*.
- **ROMs and BIOS** — as before.
- **Discarded saves** — what the conflict wizard keeps when you choose against
  a copy (D-CLOUD-036). The word *discard* means nothing else now.

Two verbs only: **back up** and **restore**. The label says what and where —
BACK UP SETTINGS TO THIS DEVICE, BACK UP SAVES TO THE CLOUD. Nothing is
"uploaded" or "archived" in a label, because a player cannot tell those apart
and the archive is uploaded too. *Sync* is reserved for the automatic two-way
behaviour saves get once conflict resolution lands.

**Config keys are renamed to say which tier and which side**, and an existing
config is carried across once by `cloud_sync_helper` (it runs at update time
from `post-update`, and again before every transfer):

| Was | Is | Meaning |
| --- | --- | --- |
| `BACKUPPATH` | `SAVESPATH` | saves on this device |
| `RESTOREPATH` | *removed* | see below |
| `BACKUPFOLDER` | `SETTINGS_BACKUPS` | settings backups on this device |
| `SYNCPATH` | `SAVES_REMOTE` | saves on the cloud remote |
| `SYNCPATH_BACKUP` | `SETTINGS_REMOTE` | settings backups on the cloud remote |
| `CONTENTPATH` | `CONTENT_REMOTE` | ROMs and BIOS on the cloud remote |

A customised value moves with its key — a device syncing to `/Custom/Saves`
keeps syncing there — and running the helper twice adds nothing. The old keys
are left in the file and ignored, and `cloud_sync.conf.bak` beside it keeps
the pre-migration text.

**`RESTOREPATH` is gone.** It let a restore land somewhere other than the live
saves, a safety valve from when restore was a mirror with no conflict
handling. Saves now have one local folder (D-CLOUD-040). A config that still
points it elsewhere makes every saves transfer refuse, with the setting named,
until the line is removed — nothing moves and nothing is guessed.

`cloud_setup --info` prints the cloud folder under both `SAVES_REMOTE=` and
`SYNCPATH=` until the interface's side of the rename ships; `--set-syncpath`
is accepted beside `--set-saves-remote` for the same reason.

## Game content is a class of its own (2026-09-06)

A device that had been restored and then scraped read "different size" on
every system, because the cloud counted every file under a system and the
device counted every file but saves, and neither side excluded what the
scraper writes — 343 MB of images, videos and manuals under SNES alone that
the cloud never had. Totals cannot say whether one side has what the other
has (D-CLOUD-048); and the scraper's output is a thing you may or may not
want in your cloud (D-CLOUD-050).

So:

- **The transfer page asks about four things.** BACK UP TO THE CLOUD and
  RESTORE FROM THE CLOUD offer SAVES, ROMS AND BIOS, **GAME CONTENT**, and
  SETTINGS. Game content is what the scraper made — its line reads SCRAPED
  ARTWORK, VIDEOS, MANUALS, AND GAME LISTS — and the game list goes with it
  (D-CLOUD-049), so a ROMs-only backup neither sends nor counts
  `gamelist.xml`, and a restored-then-scraped device reads IN YOUR CLOUD
  across the board under ROMS AND BIOS alone. Each tick is remembered per
  direction; game content is off until you turn it on.
- **CONTINUE asks which systems.** Once ROMS AND BIOS or GAME CONTENT is on,
  the button reads CONTINUE and opens SYSTEMS TO BACK UP / SYSTEMS TO
  RESTORE. The page opens with a line saying what moves (BACKING UP ROMS AND
  BIOS, GAME CONTENT, AND SAVES), then SYSTEMS ON THIS DEVICE / SYSTEMS IN
  YOUR CLOUD: the systems that hold anything of what you ticked, each with
  its size and a verdict by file name — IN YOUR CLOUD · *N* FILES NOT IN YOUR
  CLOUD YET · NOT IN YOUR CLOUD YET on the backup page, ON THIS DEVICE · *N*
  FILES NOT ON THIS DEVICE · IN YOUR CLOUD ONLY on the restore page. *N* is
  what the transfer would move. BIOS is not listed as a system; it comes with
  ROMS AND BIOS (D-CLOUD-043). *(The verdicts are superseded 2026-09-08 — the
  line now leads with what would move; see* The content page leads with what
  would move*.)*
- **Game content moves on its own.** Tick it without ROMS AND BIOS and only
  the scraper's folders and game lists travel — no ROM, no BIOS file.
- **Scripts:** `cloud_content_backup` and `cloud_content_restore` take
  `--with-media` (both tiers) or `--media-only` (game content alone); with
  neither, ROMs and BIOS alone. `cloud_content_restore --scan` reports, for
  the union of cloud and device systems under the same mode,
  `name|cloud_bytes|supported|device_bytes|files_in_cloud_not_here|files_here_not_in_cloud`
  *(two byte fields follow since 2026-09-08, and the counts compare size as
  well as name; see* The content page leads with what would move*)*.

## The transfer flow after the maintainer's first real backup (2026-09-06)

Found on the RG35XX SP's screen during the first backup of a real library:

- **The content page is CONTENT TO BACK UP / CONTENT TO RESTORE**, opening
  with two centred lines — the per-system classes the choice below applies
  to (`BACKING UP: ROMS AND BIOS · GAME CONTENT`) and what rides along for
  the whole device (`PLUS SAVES AND SETTINGS FOR THE WHOLE DEVICE`). Settings
  cover the device, not a system, and no longer sit on a page called
  SYSTEMS. SELECT ALL / SELECT NONE is one button in the bar. The loading
  text compares this device's content with your cloud.
- **The transfer page** shows file names whole (`S` was the tail of
  `1 MiB/s, 0s` after a split that failed at 100%), never a torn field, no
  second WORKING… beside the spinner, `AND 2 MORE FILES`, and the bar tight
  under the system it reports with the gap before ELAPSED, which is the
  whole run's.
- **SETTINGS BACKUP no longer shows through the ROMs.** Every command a
  saves label runs now passes `--saves-only`, and `cloud_content_backup`
  announces each system as restore always did.

## The round-trip harness ran (2026-09-06)

`tools/cloud-round-trip` executed for the first time — against a GENERIC_X64
guest over SSH (`tools/vm-pair`), on WebDAV and on MinIO — and passes on both
(48 checks each). Its first run found one thing in the scripts: **`backuptool`
ignored the configured settings folder.** It wrote to `/storage/roms/backup`
whatever `SETTINGS_BACKUPS` said, while `cloud_backup` uploaded from the
configured folder, so with the folder moved the settings tier archived into
one place and uploaded from another. `backuptool` reads `SETTINGS_BACKUPS`
now (`BACKUPFOLDER` on a conf that has not been migrated), so a local backup
and the cloud copy come from the same folder.

## Upgrading from an earlier cloud setup

Every one of these ships onto devices that already have state, so the guiding
rule was that an upgrade should be invisible: read both shapes, write the new
one, and ask only where the choice is genuinely the owner's.

**Tidy up your cloud folders** — the one screen that does ask. The first layout
put everything under `/GAMES`, with settings backups nested at `/GAMES/backup`
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
  preceded it, and the pre-`CONTENT_REMOTE` root — so a library that has not been
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

## CHANGE CLOUD FOLDER takes an existing folder, and says when it cannot (2026-09-07)

Typing a cloud folder that already existed and held anything — your saves
folder from another device, with `savestates/` in it — was refused as "your
provider would not accept this folder", with the folder's own listing quoted
as the reason; and the refusal never reached the screen, so the setting
stayed as it was while the page carried on. The probe behind the setting had
read rclone's directory listing as a rejection: only a folder that did not
exist yet passed.

Now the probe reads only what rclone reports as an error, so an existing
folder is accepted and a real rejection (a bucket name the provider will not
take) is still one; and when the script does refuse, the editor shows THE
CLOUD FOLDER WAS NOT CHANGED with the reason instead of moving on. Found by
the two-device fixtures of `tools/cloud-round-trip` on the VM pair before it
reached a handheld; the ES half rides the next build.

## The match flow, read at the size it is played (2026-09-07)

Three things the maintainer saw running MATCH THIS DEVICE TO THE CLOUD for
real, and one from the game-exit sync:

- **A confirmation with a paragraph to say gets room.** A dialog was 0.6 of
  the screen wide whatever it carried, so the match preview — what goes,
  per system, what arrives, what is never touched — wrapped into a dense
  block on a 640-wide panel. A message that would wrap past four lines at
  that width is now laid out at 0.8. Measured with the text's own font,
  never matched on a string; a short dialog is unchanged.
- **A match's done page says what it did.** It used to end on rclone's
  totals for a deletion — `0 B of 0 B, 0 B/s` — true and useless. Each
  system is now announced while it is matched, and the last screen reads
  REMOVED 14 FILES FROM THIS DEVICE · 300 MB with the per-system line the
  confirmation showed under it (SNES 12 FILES · 280 MB   GB 2 FILES ·
  20 MB); when the run also brought files down, it says so.
- **The one thing left to do is on the page.** A content run that changed
  the ROMs on this device is invisible in the game lists until they are
  rebuilt. After a match, or a restore that moved anything, the done page
  carries UPDATE GAMELISTS UNDER GAME SETTINGS TO SEE THE CHANGE — the
  row's own words, and where it lives. Never after a backup, which changes
  nothing on the device.
- **The exit-sync card lets go sooner.** COMPLETED SUCCESSFULLY held for
  two seconds after a game; it is a second and a half now. Skips and
  failures keep their five — those are a sentence to act on.

## A saves transfer refuses when the saves folder changed cards (2026-09-08)

A device with two microSD cards mounts the second one at `/storage/roms` when
it is present and falls back to the internal card when it is not — a card
unseated, or enumerated after the mount ran. Each tree then receives syncs on
its own boots, and whichever copy is mounted later reads as this device's
newest save. On the RG SP that left 101 stale files on the internal card,
written by a boot restore at a boot without the second card (#83).

- **`cloud_saves_root`** (new, in the rclone package) prints the identity of
  the filesystem under `SAVESPATH` — its UUID from `blkid`, or the device
  number where there is none — and keeps a record of it at
  `/storage/.cache/cloud_sync/saves-root`. That path is on the internal card
  whichever card the saves are on, which is the point.
- `cloud_backup` and `cloud_restore` **record** it after a saves phase that
  succeeded, and **refuse the saves phase** (exit 1, reason on stdout and in
  the log) when the identity differs from the record: *"The saves folder
  /storage/roms is on a different card than the last time saves were synced
  (now uuid:…, last time uuid:…). Nothing was transferred. If the second card
  is missing, put it back; if the change is intended, run: cloud_setup
  --accept-saves-root"*. The settings archive is not affected; it lives on
  the internal card either way.
- **`cloud_setup --accept-saves-root`** records the current card as the right
  one. The boot pair, the game-exit sync and the transfer pages all run the
  same two scripts, so all of them refuse and all of them resume after the
  accept.
- **Upgrade**: no record yet means nothing to compare. A device updated to
  this build records at its first transfer and is never asked. A clean
  install does the same.
- **How it actually happened (RG SP journal, 2026-09-08)**: not a missing
  card. The automount script is started by udev when the card partition is
  detected, and its first act is to *unmount* `/storage/roms`; it binds the
  second card back a second later. The interface starts in that same second
  (automount 23:48:57, unmount 23:48:57, bind 23:48:58, interface 23:48:57,
  boot restore 23:48:58). A transfer that got in before the bind, or one the
  bind landed under, wrote to the internal card with both cards in the
  device. The compositor's `After=rocknix-automount.service` cannot order
  against a unit that is not in the boot transaction.
- **So the check waits, and the run is checked again at the end**
  (`9618b63d7c`). A mismatch with the record is re-read once a second for up
  to 15 seconds before it is a refusal, which turns the boot race into a
  short delay. `check` prints the identity it confirmed, and the phase hands
  it back to `record` after the transfer: if the folder is on a different
  card by then, nothing is recorded and the phase reports *"The saves folder
  /storage/roms changed cards during the transfer (it started on uuid:… and
  is on … now). Files written in that time may be on the other card. Nothing
  was recorded. Run the transfer again once the cards have settled."*
  instead of success. Restores are plain copies, so running again is
  harmless.
- **Not covered**: a card that flips *between* two transfers and flips back
  leaves no trace; and the one second in which a running emulator would
  write a save to the internal card is not our writer. The ROMs and BIOS
  tier restores into `/storage/roms` in the same boot window and has no
  guard yet (follow-up on the fork).
- Proven on GENERIC_X64 guest a with a tmpfs copy bound over
  `/storage/roms`: the usual card returning 3 s into the wait lets the
  backup proceed; a card that never returns is refused after the wait
  (helper in 3 s, the restore script in 22 s with the pauses it already
  had); a bind landing under a throttled 1200-file copy makes the run fail
  with the changed-cards message and leaves the record alone; an unflipped
  backup and restore still pass and record.
- Proven on GENERIC_X64 guest a with `tools/cloud-test-backend` (MinIO):
  refusal on backup and on restore against a planted record, accept, the
  record rewritten, a matching restore, and a run with no record.
- **Docs debt**: `--accept-saves-root` and the refusal text belong on
  rocknix.org's cloud-sync page (#42 carries the docs PR).

## The wrong-card writes are fixed at the source (2026-09-08)

The saves-root guard (above) catches a saves transfer aimed at the wrong
card. This removes the wrong aim in the first place, for every tier.

The RG SP's second tree came from `rocknix-automount` binding the
**internal** card over `/storage/roms` at a boot where the external card
had not enumerated by the time the script's one scan ran. Nothing waited
for it. The boot restore then wrote to internal. Unit ordering was not the
cause — in monotonic time the automount finished about ten seconds before
the interface on both handhelds; the wall-clock journal only looked
otherwise because NTP corrected the clock in the middle of the boot.

- `find_games` in `automount` now retries the scan for up to 15 seconds
  when the device **expects** an external card — it has merged one before
  (`system.merged.device=external`) or a games device is pinned
  (`system.gamesdevice`). A one-card device has neither signal and its
  boot is unchanged; a card genuinely removed still boots to internal
  after the timeout.
- Because the wrong bind never happens, both the saves tier and the ROMs
  and BIOS tier are protected, above the `cloud_saves_root` guard which
  now becomes a backstop rather than the only defence.
- Verified on GENERIC_X64 against the real `find_games` body under mocks:
  card present, card late (waits then mounts), card absent (times out to
  internal), one-card (no wait), unset setting (no wait), pinned games
  device with a late card (waits then mounts).
- **Boot cost.** A normal boot finds the card on the first pass and waits
  nothing. The retry only runs when a card is *physically present but not
  probed yet* — `external_node_present()` checks `/sys/block` for a
  non-internal disk over ~8 GB — so a card that was removed has no node
  and boot falls to internal after a 2 s grace, not the full timeout. The
  ceiling is 10 s, paid only by a card present but whose filesystem never
  becomes readable.
- The `automount` change is offered upstream to ROCKNIX/distribution on
  its own (#84).

## The content page leads with what would move (2026-09-08)

The maintainer, on CONTENT TO BACK UP, where each system's line read its
size on the device, a dash, and IN YOUR CLOUD: *"what they'll want to know
is the delta, or what's being sent up, not just what's in their cloud"*, and
*"it also is confusing to only say 'in your cloud' because what you're
backing up is on your device."*

- **Each row's line now says what this run would send.** On the backup
  page: `312.50 MB TO BACK UP · 14 FILES`, or `ALREADY IN YOUR CLOUD
  (1.20 GB)` when nothing would move, the parenthesis being the system's
  size on this device. On the restore page: `312.50 MB TO RESTORE · 14
  FILES`, or `ALREADY ON THIS DEVICE (1.20 GB)`, the parenthesis being its
  size in the cloud. A system this device cannot run keeps its suffix and,
  when a size leads the line, drops the file count from beside it —
  `12.30 GB TO RESTORE · THIS DEVICE CANNOT RUN IT` — so the row stays one
  line under the label (D-UI-023). Sizes round up to a whole KB, so a
  difference of a few bytes reads `1.00 KB`, never `0.00 KB`; and when the
  only files to move are empty ones (pico-8 ships a 0-byte `Splore.png`)
  the count carries the line — `1 FILE TO BACK UP` — since a copy sends an
  empty file all the same.
- **"Would move" is by name and size.** A file counts when the far side
  lacks it or holds it at a different size — what `rclone copy` compares
  (size, then modtime where the backend keeps one). A same-size file is not
  counted whatever changed inside it — the listings carry name and size
  only — so the figure can run under what a copy moves, never over. The
  game list is in the totals and never in the comparison: under game
  content it travels in its own pass, newest wins, and the scan has no
  modtime to say which side that is, so a run may carry a game list the
  line did not mention (under, again, never over). Without that exclusion
  the side whose list was older read `1 FILE TO RESTORE` for as long as
  the two lists differed, and a run moved nothing. The file count and the
  bytes describe one set: until now the count compared names alone, and a
  ROM re-uploaded at a new size read IN YOUR CLOUD with nothing to send.
- **Scripts:** `cloud_content_restore --scan` gains two trailing fields:
  `name|cloud_bytes|supported|device_bytes|files_in_cloud_not_here|files_here_not_in_cloud|bytes_in_cloud_not_here|bytes_here_not_in_cloud`.
  The first six keep their position and type; fields 5 and 6 now count by
  name and size, the same set fields 7 and 8 measure. Both sides are listed
  as `size|relpath` by the tier's own rule and compared in awk (the image's
  busybox has no `comm`); the device side is one `find` per system where
  there were two. Lines for the pre-tier layout (a system straight under
  the content root) are listed for size alone, as before, with zeros in
  every comparison field.
- **An EmulationStation ahead of its scripts still works.** Given a
  six-field scan the page falls back to the verdict it showed before
  (`<total> · N FILES NOT IN YOUR CLOUD YET` / `IN YOUR CLOUD`, and the
  restore mirror). A system with nothing on the far side needs no byte
  fields — all of it moves — so that case reads the new way under either
  script, and so does a pre-tier line on the restore page.
- Proven on a GENERIC_X64 guest against `tools/cloud-test-backend` (MinIO)
  with the modified script staged beside the installed one, twice: first
  with a file of one size on both sides, a cloud-only file, a device-only
  file, one file at 1000 bytes in the cloud and 2500 on the device, a game
  list of one size on both sides, a cloud-only scraped image and a BIOS
  file (`snes|501000|1|452500|2|2|201000|152500`, `bios|4096|1|0|1|0|4096|0`;
  the installed six-field script read the same fixture
  `snes|501000|1|452500|1|1`); then, after review, with the game lists at
  differing sizes on the two sides — 105 and 210 bytes at the system's
  root, 40 and 80 in a subfolder — a device-only empty file, and a second
  system whose only difference is an empty file. Under ROMS AND BIOS that
  read `snes|301040|1|302580|1|2|1000|2500` and `gba|1234|1|1234|0|1|0|0`;
  with game content, `snes|351145|1|302790|2|2|51000|2500`; game content
  alone, `snes|50105|1|210|1|0|50000|0`. Every figure matched a sum of the
  planted sizes computed separately in the guest's shell; the game lists
  are in every total and in no comparison field, and the empty file is one
  file at zero bytes. The version before the review read the same fixture
  `snes|301040|1|302580|2|3|1040|2580` and `…|4|4|51145|2790`: the game
  lists counted as moving both ways. The page has not yet been built or
  seen on a panel for this change: the strings above are what the code
  produces from those fields.
- `tools/cloud-round-trip` asserts the eight fields at its
  unsupported-system step: a cloud-only one-byte file, a file that is one
  byte in the cloud and two on the device, then a game list of three bytes
  in the cloud and five on the device, which must leave the ROMS AND BIOS
  row as it was and, with game content, add to each total without touching
  a comparison field (added, not yet run).

## The archive says which handheld made it (2026-09-08)

Maintainer: *"in our backup naming, we should include the host name for the
device. It's not super clear when you have multiple devices to know which one
is which. For example, I just backed up from my RG SP, but I've also done
backups from my RG35XX SP. It's not easy to tell when looking at the backups
which backup came from which system."*

Every device wrote `<date>-ROCKNIX_SETTINGS.tar.gz`, because the slot held
`OS_NAME` and that is ROCKNIX on all of them. The hostname is not the answer —
the RG SP's owner had set it, the RG35XX SP still said ROCKNIX — so the name
now carries the label `cloud_device_id --label` derives from the device tree,
the same one the per-device cloud folder is built from (D-CLOUD-009), between
the date and ROCKNIX:

    2026_09_08-161022-Anbernic-RG-SP-ROCKNIX_SETTINGS.tar.gz
    2026_09_08-161200-Anbernic-RG35XX-SP-ROCKNIX_SETTINGS.tar.gz

- **The label sits in the middle, not in ROCKNIX's place.** The stamp stays
  first, so a listing still sorts by age; and the name still ends in
  `-ROCKNIX_SETTINGS.tar.gz`, so the glob every reader already has —
  `backuptool`'s `newest_backup`, in this build and in every image already on
  a device — matches it unchanged. The first cut put the label where ROCKNIX
  was, and the review found that an image from before the change, restoring
  such an archive from the cloud, could not find it: its finder returned
  nothing for `…-GENERIC-X64_SETTINGS.tar.gz`. `newest_backup` is now the
  function that ships, unchanged, and the harness asks the installed
  `/usr/bin/backuptool` — through that function — to find the archive the new
  one wrote.
- **`backuptool`** resolves the helper beside itself or at `/usr/bin` — never
  via PATH, which `/etc/profile` rewrites. With no helper there is no label
  and the archive is named as before. The local `archive/` rotation is
  unchanged and trims every shape.
- **Retention (`CLOUD_BACKUP_KEEP`) works inside this device's own cloud
  folder and counts only archives carrying this device's label.** Archives
  live under `SETTINGS_REMOTE/<device id>/` — `Anbernic-RG-SP-f058e3e9e8`,
  the id `cloud_device_id` gives (it gave `Anbernic-RG-SP-ee5013fc56` until
  #86, *The device id is seeded from a hardware address or nothing*, below) —
  so a different device's own archives are
  in a different folder and are never touched. Within this folder the newest
  `CLOUD_BACKUP_KEEP` archives carrying this device's label are kept and the
  rest of those removed; an archive carrying another device's label, or none,
  is left alone. Before, the newest three of *everything* in the folder
  survived and the rest went, so an archive another device had put there —
  restored here and sent up again — could be evicted by this device's backups.
- **What the label cannot do.** An archive carrying this device's label but
  made by another device is counted as this device's own, because nothing in
  the name tells them apart. It can be in this folder in exactly two ways: it
  was restored here from that device's folder and sent back up with the next
  backup (the fresh-device journey, #26); or the two devices share an id and
  so share this folder — a cloned id, fork #86; the RG SP and the RG35XX SP
  shared the hash `ee5013fc56` until the section below: not a clone but a
  constant seed, healed on the first run of this build. The id is deliberately not in the
  archive name. The review's finding that retention removed a same-label
  archive from a second device of the same model sharing the folder describes
  exactly this case, and it stands: the code does that, and now says so.
- **Archives from before names carried a device are left alone.** They cannot
  be attributed to anyone, and deleting what cannot be attributed is the
  failure this exists to stop, so the guard fails closed: no label, no
  deletion (D-CLOUD-067). The cost is bounded — the old rule had already
  trimmed them to `CLOUD_BACKUP_KEEP` per folder and no new ones are written —
  so at most that many sit beside the labelled ones until the owner removes
  them by hand.
- **`cloud_restore` prefers this device's newest labelled archive** in the
  folder it restores from. With none — a fresh device that adopted another's
  folder to take over its settings (#26), or a folder holding only pre-label
  archives — it takes the newest overall and says so on the transfer page and
  in the log: *No settings backup named for this device (GENERIC-X64) in …;
  restoring the newest there, 2099_01_01-000000-Other-Handheld-ROCKNIX_SETTINGS.tar.gz
  (made on Other-Handheld)*, or *(made before backups were named after the
  device)* for a pre-label archive. Which folder it restores from is
  unchanged: its own, its pre-rename folder, then the shared root.
- **`cloud_device_id --label` is now the same for every caller.** `HW_DEVICE`
  reaches a shell only through `/etc/profile`, so on a device with no device
  tree (GENERIC_X64) `backuptool` labelled `GENERIC-X64` while `cloud_backup`,
  started without a profile, labelled by hostname (`GENERICX64`) — and
  retention would never have recognised its own archives. The helper reads
  `HW_DEVICE` from `/etc/os-release` when the environment lacks it, and the
  cloud scripts read `OS_NAME` the same way for the same reason. Handhelds
  have a device tree and were never affected; a stored identity is never
  regenerated.
- **Upgrade**: nothing to migrate. Old archives keep their names and are read
  everywhere; the first backup after the update writes the new shape beside
  them; the cloud folder is the same folder. A device that has not updated yet
  finds a new archive with the finder it already has — proven below against
  the image's own `/usr/bin/backuptool`.
- Proven on GENERIC_X64 guest a (image `5b8e6b45`, from before this change)
  against `tools/cloud-test-backend` (MinIO), the four scripts staged at
  `/tmp/qa-bin`, label `GENERIC-X64`, folder `BACKUPS/GENERICX64-15ca35b6b4`,
  `CLOUD_BACKUP_KEEP=3`:
  - the image's own `newest_backup`, sourced from `/usr/bin/backuptool`,
    returned a planted `2026_09_08-120000-GENERIC-X64-ROCKNIX_SETTINGS.tar.gz`
    — and still returned it, not the newer first-cut
    `2026_09_08-130000-GENERIC-X64_SETTINGS.tar.gz` planted beside it, which
    it cannot see;
  - the staged `backuptool backup` wrote
    `2026_09_08-152011-GENERIC-X64-ROCKNIX_SETTINGS.tar.gz` (17,313,614
    bytes, 303 members, `tar -tzf` clean), and the installed finder and the
    staged one — identical text — both returned it;
  - with `2026_01_01-000000-ROCKNIX_SETTINGS.tar.gz`,
    `2026_01_01-000000-Other-Handheld-ROCKNIX_SETTINGS.tar.gz` and three of
    its own (`2026_01_02`…`04`) planted in its folder, `cloud_backup --yes
    --system-only` uploaded the real archive and logged *Leaving 2 archive(s)
    not named for this device (GENERIC-X64) alone* and *Removing old cloud
    backup 2026_01_02-000000-GENERIC-X64-ROCKNIX_SETTINGS.tar.gz*; the folder
    afterwards held both planted foreign archives, `01_03`, `01_04` and the
    real one;
  - with `2099_01_01-000000-Other-Handheld-ROCKNIX_SETTINGS.tar.gz` added,
    `cloud_restore --yes --system-only` brought back the real archive and
    logged *Restoring this device's own newest settings backup (named for
    GENERIC-X64)*; with its own removed, it brought back the `2099_` archive
    with the *made on Other-Handheld* line; with only the pre-label archive
    left, that one, with *made before backups were named after the device*.

  Everything planted was removed afterwards, locally and in the cloud.
- `tools/cloud-round-trip` asserts the labelled name on the archive
  `backuptool` writes and that the installed `/usr/bin/backuptool`'s own
  `newest_backup` finds the same file; keeps its planted `ROCKNIX_` archive as
  the upgrade path and asserts the fallback is logged; and plants an
  other-device archive and both pre-label shapes beside this device's in its
  folder to check retention and the preference. The full single-device suite
  passed against the staged scripts on guest a — 61 checks, no failures, no
  skips — with `tools/cloud-test-backend` in `CLOUD_QA_BACKEND=s3` mode, which
  is what the guest's `qa-cloud:` remote is; in the default WebDAV mode the
  backend names bucket-less paths the S3 remote rejects, and the suite fails
  at its first upload. A two-guest fixture would add no evidence: guest b gets
  its own folder by construction, and sharing one needs a cloned id, which A11
  refuses.
- **Docs debt**: the archive name and the retention rule belong on
  rocknix.org's cloud-sync page (#42 carries the docs PR).

## The transfer page shows a bar for a run that only compares (2026-09-08)

The maintainer, on a saves backup: *"when backing up to the cloud, we seem to
have lost the progress bar and had it replaced with the small spinner. The
progress bar was better."* And on the panel: *"It needs more height in
general because the note that says, 'This can take a while. You can leave it
running,' is right along the bottom edge and does not have equal padding
above and below the elements."*

- **The bar shows the lower of two percentages rclone printed: the
  transfer's and the checks'.** It came only from the byte line, and a saves
  backup whose saves are all in the cloud already moves nothing: that line
  reads `0 B / 0 B, -`, rclone prints no per-file line and omits the
  files-transferred line, so the page showed the spinner from start to
  COMPLETED — the "lost" bar. The `Checks:` line was the one moving number,
  and the page ignored it. The transfer's percentage is bytes, or the count
  of files transferred when the bytes have no number (nothing but empty
  files queued); the lower of that and the checks' percentage is drawn,
  because a run is both — rclone compares as it lists and moves what
  differs — and one changed save among hundreds moves its bytes in a second
  and then spends the run comparing, so bytes alone would pin the bar at
  100% over a live CHECKING count for all of it. The files-transferred count
  is not a third contender for the minimum: it counts completed files, and
  the VM capture of two files moving together reads `0 / 2, 0%` until both
  land while the bytes climb 24 → 93%. The page never draws a bar without a
  number rclone printed; a block that prints none leaves the last real
  number standing rather than flicking back to the spinner once a second;
  a `>>> unit` change still resets to the spinner until the new unit prints
  one.
- **A comparison-only run says what it is doing.** With no file in flight the
  file row reads `CHECKING 12 OF 45 FILES` — the name row shows the file if
  rclone caught one mid-comparison, else WORKING... — and before the first
  check is queued it reads `CHECKING FILES...`. rclone's `Listed` count is
  not shown: it counts both sides, so 40 saves list as 80, a number nobody
  could reconcile with their files. A file that moves still shows its name
  and TRANSFERRING line, which is why the settings archive was the one name
  the maintainer saw.
- **The system's line no longer reads `0 B OF 0 B · - · 0 B/S · -`.** A bare
  `-` — rclone's word for a value it does not have yet: the ETA of a transfer
  that has not started, the percentage of nothing — is dropped from every
  rclone field the page renders, and the byte totals are left off the
  system's line while they read `0 B / 0 B`, so during a run that only
  compares that line is blank rather than a row of zeros.
- **The panel is padded equally above the title and below the footer**
  (0.05 of the screen height each; the footer used to sit on the bottom
  edge), and its rows are stacked from the theme's own menu font heights, so
  the seven lines have room on a 640×480 panel and the page sizes itself for
  a theme with larger fonts (0.66 of the screen height at 640×480 and 0.56 at
  1920×1080 on the shipped theme; past 0.9 every pitch is scaled down
  together). The bar, the spinner and the done-note share one row; the bar
  used to be drawn a row below the spinner it replaced.
- Checked by `g++ -fsyntax-only` against the GENERIC_X64 sysroot; by reading
  rclone 1.75.0's `fs/accounting/stats.go` for when each stats line is
  printed (`Checks:` once anything is checked or listed, the count line once
  anything is queued, `-` for a zero total — and the counters only grow, the
  retry loop resets errors alone); and by replaying two piped rclone 1.75.0
  captures from the VM through the page's parse rules — one comparing 40
  files it already had (spinner, then a bar at 100% over CHECKING 40 OF 40
  FILES, the system's line blank), one moving two (24 → 47 → 69 → 93 →
  100%) — plus a synthetic run of one changed save among 45 (27 → 0 → 89 →
  100% block by block; between a block's byte line and its `Checks:` line
  the previous block's checks stand, so a frame drawn in that instant
  shows 67%, a number rclone printed a second earlier) and one of four
  disc images moving together (bytes throughout, where
  a minimum over all three percentages sat at 0%). The built page is the
  screendump's to prove.

## The device id is seeded from a hardware address or nothing (2026-09-08)

Both handhelds printed the same device-id hash, `ee5013fc56` — the RG SP as
`Anbernic-RG-SP-ee5013fc56`, the RG35XX SP as `ROCKNIX-ee5013fc56` — so the
per-device cloud folders of #49 were per device only by the accident that the
label rule changed between the two generations (fork #86).

- **What happened.** `cloud_device_id` took the first interface in sorted
  `/sys/class/net` that was not on a short denylist of names and whose
  `ethtool -P` output was not empty, all-zero or broadcast. Every kernel that
  builds in the IPv6 sit tunnel (`CONFIG_IPV6_SIT=y`: H700, RK3566 and RK3576
  among ours) has a `sit0`, which sorts before `wlan0` and was not on the
  list. `ethtool -P sit0` prints `Permanent address: not set`; the script's
  own `sed`/`tr` turn that into `notset`; the denylist accepted it. So every
  such device hashed the literal `notset|unknown` — `DEVICE` is a build-system
  variable that nothing on a device exports, so the "family" term the old
  comment described was always `unknown` — and md5 of that, ten hex, is
  `ee5013fc56`. The VM (sit as a module, `eth0` sorting first) was seeded
  from its real address and never showed it. Ruled out first: a settings
  archive carrying the id file (backuptool's include list never had it) and
  identical hardware (the two MACs, machine-ids and device-tree serials all
  differ).
- **The guard is the shape of the value, not a list of bad ones.**
  `usable_interfaces` now takes an interface only if
  `/sys/class/net/<n>/type` is `1` (ARPHRD_ETHER; `sit0` is 776, `lo` 772)
  and `/sys/class/net/<n>/device` exists (a physical adapter; a tunnel has
  none). The name list gains `sit* ip6tnl* gre* wg* dummy* bond* ifb*` for
  the reader, but the two tests decide. `permanent_address` accepts only a
  value matching `^([0-9a-f]{2}:){5}[0-9a-f]{2}$` in either case that is not
  all-zero or broadcast; anything else yields no seed, and the machine-id
  fallback applies as before.
- **The hash recipe is unchanged**: `md5(<seed>|unknown)`, first ten hex.
  Every device that was seeded from a real address keeps its id, and
  `--legacy` keeps reproducing its pre-label folder name. Only the comment
  that claimed the device family joins the hash is corrected.
- **A poisoned stored id heals, once, and only that.** On any run that
  prints the id (not the `--label`, `--legacy` or `--previous` modes, which
  return before the heal), a stored id whose ten-hex suffix is `ee5013fc56`
  (computed in the script as `md5("notset|unknown")`, not written down) is
  replaced when a validated address is available: the old id is appended to
  `/storage/.config/cloud_sync-device-id.previous` (one per line, never
  twice), `<label>-<hash>` is written, and `old -> new` goes to the journal
  (`logger -t cloud_device_id`) and to `/var/log/cloud_sync.log` when it is
  writable. A stored id with any other suffix is returned unchanged, as
  always — including one that differs from what this hardware would hash to,
  which is the wifi-module-swap case and the deliberate adopt-another-folder
  edit. With no validated address the poisoned id is returned unchanged and
  nothing is written; nothing is ever invented.
- **`cloud_device_id --previous`** prints every folder name this device may
  have written under before healing, one per line, deduplicated: the lines of
  `.previous`, then `<label>-ee5013fc56`, then `<hostname>-ee5013fc56`. The
  last two are listed even on a device that was never healed, because a
  reflashed card has no `.previous` and its backups may sit there; a folder
  of that name was produced by every device of one model or one hostname, so
  it may hold another device's archives. **They are listed only where
  `/sys/class/net/sit0` exists** — a kernel with `CONFIG_IPV6_SIT=y` has one
  from boot, ours with it as a module never do — because a device with no
  `sit0` could not have hashed `notset`, and every ROCKNIX image ships the
  hostname `ROCKNIX`, so an ungated list would have sent a fresh RG351M to
  the RG35XX SP's `ROCKNIX-ee5013fc56` before the root tier. The trade: a
  healed device reflashed onto a later build that switched `sit` to a module
  loses the two guessed names and falls to the root tier.
- **`cloud_restore` reads the old folders.** Its lookup for the settings
  archive is now: this device's own folder, then its `--legacy` name, then
  each `--previous` folder in order, then the root where archives sat before
  folders existed; the first holding an archive wins, and the log says which
  it took. The `--previous` tier logs a WARN naming the folder as one this
  device *may* have written to while its id was the constant — the two
  guessed names are listed on devices that were never healed — and that
  another device of the same model or hostname may have written there. A
  helper from before `--previous` existed answers it with the current id,
  which the chain skips as already tried.
- **`cloud_backup` writes to the current folder only.** Retention counts
  only there. Nothing in a folder this device wrote under a healed-away id is
  written, trimmed or moved: the archives there are still someone's only
  backup, and the same folder name may be another device's. **The upload
  marker records where as well as what.** `settings-backup.uploaded` held
  the hash of the archive last sent (#53); it now holds `<hash>
  <destination>`, and the transfer is skipped only when both match. A device
  whose id healed writes to a new folder, and a marker that knew only the
  hash said "unchanged; nothing to send" on every game-exit backup until the
  next `backuptool backup`, leaving the new folder with no archive and no
  `device.json`. A marker from an older build is a bare hash, never equal to
  the pair, so an upgraded device sends exactly once more and is then in
  step; the skip line names the destination.
- **For the two handhelds, on the first call of this build that can see the
  wifi adapter's permanent address** — normally the first backup, restore,
  game-exit capture or boot `--full` pass; the boot pass does not wait for
  the network, and on a slow SDIO probe `wlan0` may not be registered yet, in
  which case the next call heals — the RG SP becomes `Anbernic-RG-SP-f058e3e9e8` and
  the RG35XX SP `Anbernic-RG35XX-SP-a431b25ede`; those are the hashes of their
  wifi adapters' permanent addresses, computed on 2026-09-08 from the
  addresses read on each. `/ROCKNIX/Backups/Anbernic-RG-SP-ee5013fc56/` and
  `/ROCKNIX/Backups/ROCKNIX-ee5013fc56/` stay exactly as they are; a restore
  with nothing under the new folder finds them through `--previous`
  (`Anbernic-RG-SP-ee5013fc56` is the RG SP's `<label>-ee5013fc56`;
  `ROCKNIX-ee5013fc56` is the RG35XX SP's `<hostname>-ee5013fc56`, and its
  `.previous` line). The next backup — a game exit included, whether or not
  the archive has changed, because the marker now names the folder it last
  went to — writes the archive and a `device.json` to the new folder; the old
  `device.json` is left where it is. No manifest has been published (#21
  writes the local working copy only), so nothing in the cloud is keyed by
  the old id. Locally, `cloud_capture` names its working copy after the id;
  when nothing sits under the new name it renames the first
  `manifest-<previous id>.json` it finds (the `--previous` order) to
  `manifest-<new id>.json` before the pass, once, and says so in the log —
  so the provenance recorded since #21 follows the device.
- **Two devices of one model on a build from before this** still share the
  hash and so a folder. Nothing here changes what those builds do.
- Checked by the harness's new A15 on the VM (`--only A15`; one guest and the
  QA endpoint, no second guest), 34 checks: with `sit` loaded, the old
  pipeline yields `notset` for `sit0` and `permanent_address` yields nothing
  for it and `52:54:00:52:4e:58` for `eth0`, run with the interface list
  narrowed in the harness's own shell rather than through a hook in the
  script; a macvlan on `eth0` (type 1, no device link, no name pattern
  matches it) is omitted by `usable_interfaces` and `permanent_address`
  reaches `eth0` past it — the sysfs tests on their own, since `sit0` is
  also refused by name; a planted `<hostname>-ee5013fc56` (the RG35XX SP's
  shape) heals to `<label>-15ca35b6b4` — the hash this guest had generated
  before the change — with `.previous`, the cloud-sync log and the journal
  each marked before the run so only its own lines count, and `--previous`
  listing the recorded id, then `<label>-ee5013fc56`, then
  `<hostname>-ee5013fc56` for a hostname unlike the label; `cloud_capture
  --full` renames `manifest-<old>.json` to `manifest-<new>.json` once; an
  archive planted under the old folder is restored through the `--previous`
  tier with the folder named in the log, one in the own folder wins over it;
  with the marker holding the local archive's bare hash — an old build's,
  from an upload to the old folder — a backup still lands in the healed
  folder with a `device.json`, the marker then reads `<hash> <folder>`, the
  run after sends nothing, and the old folder's six archives are untouched
  with retention past its limit there; a second run and a healthy foreign id
  rewrite nothing (mtimes moved back five seconds first, so a same-content
  rewrite would show); with the list narrowed to `sit0` the poisoned id comes
  back unchanged and nothing is written; with `sit` unloaded the two guessed
  names leave `--previous`. Every one of those checks was shown to fail
  against a copy of the scripts with the guard it tests removed (thirteen
  FAILs, one per removed guard) before the fixed scripts were staged. The
  single-device suite then ran on the same guest with the same staged
  scripts and passed every step.

## runemu.sh now returns how the launch ended (2026-09-08)

**Verified on the GENERIC_X64 guest with staged copies of `001-functions`
and `runemu.sh` only; no image carries it yet.** `wait_lock()` in
`/etc/profile.d/001-functions` installed an EXIT trap that ran `rm` and then
re-exited with rm's 0, so every script that had taken the settings lock —
`runemu.sh` takes it for the cooling profile and netplay mode — exited 0
however it ended. RetroArch's `Failed to load content` reached
EmulationStation as a clean exit, and on a build from `test/qa-integration`,
the branch that carries the capture hook (ES `c530a581b`, merged
`33a398083`), it reached `cloud_capture --exit` the same way (#90, found by
#21's exit-path check). The trap also named a variable that was never set,
so a shell killed while holding the lock left `/tmp/.system.cfg.lock` behind
and every later `set_setting` waited on it until reboot.

- The trap now saves the exit status first and exits with it, and releases
  the lock only when this shell still owns it — callers release it themselves
  a few lines after taking it, and the trap outlives them.
- With the status finally reaching it, `runemu.sh` had to say what a non-zero
  one means, because it was not "the launch failed": the exit hotkey ends a
  standalone emulator with `killall -9` (35 of the 36 standalone start
  scripts) and RetroArch with SIGTERM, so a player leaving mednafen, Dolphin
  or xemu by the hotkey after an hour would have returned 137 — and
  EmulationStation records play count, play time and last-played only for a
  0. `runemu.sh` now reports 137 and 143 as a clean exit and everything else
  non-zero as 1, as before (D-LAUNCH-001).
- On the guest: a 64 KiB zero `QaExit.gba` under mgba made `runemu.sh` log
  `exiting with 1` and return **0** with the shipped file, **1** with the fix.
  A live RetroArch (stella; `video_driver=gl`, since the guest has no Vulkan)
  killed with `-9` as the hotkey does: **1** with the trap fix alone — the
  regression the review found — and **0** with the mapping; a `.sh` launch
  ended by TERM (143) or KILL (137) returns 0, one that exits 5 returns 1;
  `exit 7` while holding the lock returns 7 and releases it; a lock another
  process owns at exit is left alone; TERM while holding returns 143 and
  releases it.
- **For a player**: leaving a game by the hotkey changes nothing — play count
  and time are kept as they were. A launch that fails now shows as one: no
  play count or last-played for it, and `cloud_capture --exit 1` in its
  record. The trade (D-LAUNCH-001): an emulator the kernel's OOM killer ends
  is indistinguishable from the hotkey and reads as clean. One exception,
  open as #92: force-quitting RetroArch with the global hotkey — RetroArch's
  own signal handler exits 1 on the second press, and on the guest the first
  did nothing — reads as a failed launch and records no play stats for that
  session; RetroArch's own quit (its hotkey or menu) exits 0 and is
  unaffected. Upstream defect; offered upstream as its own change once it
  has run in a built image.
